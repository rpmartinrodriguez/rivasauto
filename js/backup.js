/* Rivas Auto: respaldo local, no agrega servicios ni bases de datos. */
(() => {
"use strict";
const NAMES=["usuarios","sucursales","autos","transacciones","ventas","formularios","consultas","comisiones","cierres_personal"];
const FORMAT="rivas-auto-backup-v1", CSV_MARK="RIVAS_CAJA_V1";
const HEAD=["formato","id","fecha","userId","usuario","tipo","valor","descripcion","categoria","datos_json"];
const $=id=>document.getElementById(id);
const admin=()=>window.state?.currentUser?.rol==="Admin";
const authorize=()=>{if(!admin())throw Error("Acceso exclusivo para administradores.");};
let root=null,busy=false,lastAttempt=0;
function status(msg,err=false,id="bk-status"){const e=$(id);if(e){e.textContent=msg;e.classList.toggle("text-red-600",err);e.classList.toggle("text-green-700",!err);}}
function stamp(){const d=new Date(),p=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"_"+p(d.getHours())+"-"+p(d.getMinutes())+"-"+p(d.getSeconds());}
function dl(name,blob){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);}
function serialize(v){
 if(v===null||typeof v==="string"||typeof v==="boolean")return v;
 if(typeof v==="number"){if(!Number.isFinite(v))throw Error("Numero invalido");return v;}
 if(v instanceof Date)return {__rivas_tipo:"date",iso:v.toISOString()};
 if(v?.toDate&&typeof v.seconds==="number"&&typeof v.nanoseconds==="number")return {__rivas_tipo:"timestamp",seconds:v.seconds,nanoseconds:v.nanoseconds};
 if(window.fbGeoPoint&&v instanceof window.fbGeoPoint)return {__rivas_tipo:"geopoint",latitude:v.latitude,longitude:v.longitude};
 if(window.fbBytes&&v instanceof window.fbBytes)return {__rivas_tipo:"bytes",base64:v.toBase64()};
 if(window.fbDocumentReference&&v instanceof window.fbDocumentReference)return {__rivas_tipo:"reference",path:v.path};
 if(Array.isArray(v))return v.map(serialize);
 if(v&&typeof v==="object"&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)){
  const out={};for(const k of Object.keys(v)){if(["__proto__","constructor","prototype"].includes(k))throw Error("Campo prohibido");out[k]=serialize(v[k]);}return out;
 }
 throw Error("Tipo de dato Firestore no compatible; respaldo cancelado para evitar perdida.");
}
function deserialize(v){
 if(v===null||["string","number","boolean"].includes(typeof v))return v;
 if(Array.isArray(v))return v.map(deserialize);
 if(!v||typeof v!=="object")throw Error("Dato invalido");
 if(v.__rivas_tipo){
  switch(v.__rivas_tipo){
   case "date":return new Date(v.iso);
   case "timestamp":return new window.fbTimestamp(v.seconds,v.nanoseconds);
   case "geopoint":return new window.fbGeoPoint(v.latitude,v.longitude);
   case "bytes":return window.fbBytes.fromBase64String(v.base64);
   case "reference":return window.doc(window.db,v.path);
   default:throw Error("Tipo desconocido");
  }
 }
 const obj={};for(const k of Object.keys(v)){if(["__proto__","constructor","prototype"].includes(k))throw Error("Campo prohibido");obj[k]=deserialize(v[k]);}return obj;
}
function normalized(v){if(Array.isArray(v))return v.map(normalized);if(v&&typeof v==="object"){const o={};Object.keys(v).sort().forEach(k=>o[k]=normalized(v[k]));return o;}return v;}
const same=(a,b)=>JSON.stringify(normalized(a))===JSON.stringify(normalized(b));
async function read(names){
 const out={};for(const n of names){const snap=await window.fbGetDocsFromServer(window.collection(window.db,n));out[n]=snap.docs.map(d=>({id:d.id,data:serialize(d.data())}));}
 return out;
}
function csvRows(transacciones,usuarios){
 const names=new Map((usuarios||[]).map(u=>[u.id,u.data.nombre||""]));
 return [HEAD,...(transacciones||[]).map(r=>[CSV_MARK,r.id,r.data.fecha||"",r.data.userId||"",names.get(r.data.userId)||"",r.data.tipo||"",r.data.valor??0,r.data.descripcion||"",r.data.categoria||"",JSON.stringify(r.data)])];
}
function cell(v){let s=String(v??"");if(/^[=+@-]/.test(s)&&!/^[-]?[0-9]+(?:[.,][0-9]+)?$/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function csv(rows){return "\ufeff"+rows.map(row=>row.map(cell).join(";")).join("\r\n");}
function xlsx(rows){
 if(!window.XLSX)throw Error("El componente Excel no esta disponible; utiliza CSV.");
 const w=window.XLSX.utils.aoa_to_sheet(rows);
 w["!cols"]=HEAD.map(x=>({wch:x==="datos_json"?60:20}));
 const b=window.XLSX.utils.book_new();window.XLSX.utils.book_append_sheet(b,w,"Caja");
 return new Blob([window.XLSX.write(b,{bookType:"xlsx",type:"array",compression:true})],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}
async function makeZip(snapshot){
 if(!window.JSZip)throw Error("El componente ZIP no se cargo; revisa tu conexion.");
 const z=new window.JSZip();
 z.file("respaldo.json",JSON.stringify(snapshot));
 const rows=csvRows(snapshot.colecciones.transacciones,snapshot.colecciones.usuarios);
 z.file("caja_movimientos.csv",csv(rows));
 if(window.XLSX)z.file("caja_movimientos.xlsx",await xlsx(rows).arrayBuffer());
 z.file("LEEME.txt","Rivas Auto: respaldo completo "+snapshot.fecha+"\nContiene informacion personal y credenciales: guardar en carpeta privada.\nPara recuperar: menu Recuperacion, cargar ZIP, comparar y confirmar.\nSolo agrega faltantes y no sobrescribe documentos existentes.\n");
 return z.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});
}
const IDB="rivas_backup_directory_v1";
async function dbOpen(){return new Promise((yes,no)=>{if(!window.indexedDB)return no(Error("IndexedDB no disponible"));const r=indexedDB.open(IDB,1);r.onupgradeneeded=()=>r.result.createObjectStore("settings");r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error);});}
async function saveHandle(h){const db=await dbOpen();try{await new Promise((yes,no)=>{const tx=db.transaction("settings","readwrite");tx.objectStore("settings").put(h,"folder");tx.oncomplete=yes;tx.onerror=()=>no(tx.error);});}finally{db.close();}}
async function loadHandle(){try{const db=await dbOpen();try{return await new Promise((yes,no)=>{const r=db.transaction("settings","readonly").objectStore("settings").get("folder");r.onsuccess=()=>yes(r.result||null);r.onerror=()=>no(r.error);});}finally{db.close();}}catch(e){console.warn(e);return null;}}
function folderLabel(){status(root?"Carpeta: "+root.name+" / Rivas Auto / Respaldos":"No se eligio carpeta. El primer respaldo permite seleccionarla.",!root,"bk-folder");}
async function selectFolder(){
 try{
  authorize();
  if(!window.showDirectoryPicker)throw Error("Usa Chrome o Edge actualizado sobre HTTPS para elegir una carpeta. Puedes descargar el ZIP directamente.");
  // Debe invocarse dentro del evento clic: requiere activacion de usuario.
  const h=await window.showDirectoryPicker({mode:"readwrite",id:"rivas-local-backup",startIn:"documents"});
  root=h;await saveHandle(h);folderLabel();status("Carpeta autorizada.");return true;
 }catch(e){if(e.name!=="AbortError")status(e.message,true);return false;}
}
async function permission(interactive){if(!root)return false;try{if(await root.queryPermission({mode:"readwrite"})==="granted")return true;return !!interactive&&await root.requestPermission({mode:"readwrite"})==="granted";}catch(e){return false;}}
async function writeFolder(name,blob){
 const p=await root.getDirectoryHandle("Rivas Auto",{create:true});
 const d=await p.getDirectoryHandle("Respaldos",{create:true});
 const f=await d.getFileHandle(name,{create:true});
 const w=await f.createWritable();
 try{await w.write(blob);await w.close();}catch(e){await w.abort().catch(()=>{});throw e;}
}
async function backup(mode="manual"){
 authorize();if(busy)throw Error("Ya hay otra operacion en curso.");busy=true;
 try{
  status("Leyendo informacion directamente de Firebase...");
  const snapshot={formato:FORMAT,version:1,proyecto:"rivasauto",fecha:new Date().toISOString(),colecciones:await read(NAMES)};
  const blob=await makeZip(snapshot);
  const filename="RIVAS_AUTO_"+(mode==="before"?"ANTES_RECUPERACION_":"")+stamp()+".zip";
  if(root){if(!await permission(mode==="manual"))throw Error("Debes autorizar la escritura en la carpeta.");await writeFolder(filename,blob);status("Respaldo guardado: "+filename);}
  else{if(mode!=="manual")throw Error("La programacion requiere una carpeta elegida.");dl(filename,blob);status("Respaldo enviado a Descargas: "+filename);}
  return filename;
 }finally{busy=false;}
}
async function manual(){
 try{
  authorize();
  if(!root&&window.showDirectoryPicker){if(!await selectFolder())return;}
  await backup("manual");
 }catch(e){status("No se pudo respaldar: "+e.message,true);}
}
async function exportCaja(kind){
 try{
  authorize();status("Leyendo movimientos de caja actuales...");
  const d=await read(["usuarios","transacciones"]),rows=csvRows(d.transacciones,d.usuarios);
  const name="RIVAS_CAJA_"+stamp();
  if(kind==="xlsx")dl(name+".xlsx",xlsx(rows));
  else dl(name+".csv",new Blob([csv(rows)],{type:"text/csv;charset=utf-8"}));
  status("Exportados "+d.transacciones.length+" movimientos.");
 }catch(e){status(e.message,true);}
}
function openBackup(){
 try{
  authorize();const c=settings();
  $("bk-enabled").checked=!!c.enabled;$("bk-frequency").value=c.frequency==="weekly"?"weekly":"daily";
  $("bk-hour").value=c.hour||"02:00";$("bk-day").value=String(Number.isInteger(c.day)?c.day:1);
  updateScheduleUI();folderLabel();window.openModal("modal-backup");
 }catch(e){alert(e.message);}
}
function openRecovery(){try{authorize();window.openModal("modal-recovery");}catch(e){alert(e.message);}}
const SETTINGS="rivas_backup_schedule_v1",LAST="rivas_backup_last_v1";
function settings(){try{return JSON.parse(localStorage.getItem(SETTINGS)||"{}");}catch(e){return {};}}
function updateScheduleUI(){$("bk-day-container").classList.toggle("hidden",$("bk-frequency").value!=="weekly");}
function saveSchedule(){
 try{
  authorize();const c={enabled:$("bk-enabled").checked,frequency:$("bk-frequency").value,hour:$("bk-hour").value,day:Number($("bk-day").value)};
  if(!/^[0-2][0-9]:[0-5][0-9]$/.test(c.hour)||!["daily","weekly"].includes(c.frequency))throw Error("Horario invalido");
  localStorage.setItem(SETTINGS,JSON.stringify(c));
  status(c.enabled?"Programado en este navegador. Funciona solo con Rivas Auto abierto y carpeta autorizada.":"Programacion desactivada.");
  tick();
 }catch(e){status(e.message,true);}
}
async function tick(){
 if(!admin()||busy||!root)return;
 const s=settings();if(!s.enabled)return;
 const d=new Date(),p=n=>String(n).padStart(2,"0"),today=d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());
 const hh=p(d.getHours())+":"+p(d.getMinutes()),key=s.frequency+":"+today+":"+s.hour;
 if(hh<s.hour||(s.frequency==="weekly"&&d.getDay()!==s.day)||localStorage.getItem(LAST)===key||Date.now()-lastAttempt<15*60*1000)return;
 if(!await permission(false)){status("La copia programada necesita que reautorices la carpeta.",true);return;}
 lastAttempt=Date.now();
 try{await backup("auto");localStorage.setItem(LAST,key);}catch(e){console.error("Respaldo automatico:",e);status("Fallo el respaldo automatico: "+e.message,true);}
}
async function init(){
 root=await loadHandle();folderLabel();
 setInterval(tick,60000);
 window.addEventListener("focus",tick);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)tick();});
 tick();
}
window.RivasBackup={NAMES,FORMAT,CSV_MARK,HEAD,read,serialize,deserialize,same,backup,permission,manual,selectFolder,exportCaja,openBackup,openRecovery,saveSchedule,updateScheduleUI,dl,
 get folder(){return root;},
 status,init};
document.addEventListener("DOMContentLoaded",init);
})();