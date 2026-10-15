/* Rivas Auto - Recuperacion de archivos originales, solo agrega faltantes. */
(() => {
"use strict";
const $=id=>document.getElementById(id);
const B=()=>window.RivasBackup;
const isAdmin=()=>window.state?.currentUser?.rol==="Admin";
let selection=null,restoring=false;
function msg(t,err=false){B().status(t,err,"rc-status");}
const idValid=id=>typeof id==="string"&&id.length>0&&id.length<=1500&&!id.includes("/")&&id!=="."&&id!==".."&&!/[\x00-\x1f]/.test(id);
function validate(info){
 const b=B();
 if(!info||info.formato!==b.FORMAT||info.version!==1||info.proyecto!=="rivasauto"||
   !info.colecciones||typeof info.colecciones!=="object"||Array.isArray(info.colecciones))throw Error("No es un respaldo compatible de Rivas Auto.");
 const names=Object.keys(info.colecciones);
 if(!names.length||names.some(n=>!b.NAMES.includes(n)))throw Error("El archivo incluye colecciones no compatibles.");
 for(const n of names){
  const docs=info.colecciones[n];
  if(!Array.isArray(docs)||docs.length>100000)throw Error("Cantidad de registros invalida en "+n);
  const ids=new Set();
  for(const r of docs){
   if(!r||!idValid(r.id)||ids.has(r.id)||!r.data||typeof r.data!=="object"||Array.isArray(r.data))throw Error("Registro o ID duplicado/invalido en "+n);
   ids.add(r.id);b.deserialize(r.data);
  }
 }
 return info;
}
function parseCSV(input){
 const t=input.replace(/^\ufeff/,""),result=[];let quote=false,row=[],value="";
 for(let i=0;i<t.length;i++){
  const c=t[i];
  if(quote){if(c==='"'&&t[i+1]==='"'){value+='"';i++;}else if(c==='"')quote=false;else value+=c;}
  else if(c==='"'){if(value!=="")throw Error("CSV con comillas invalidas.");quote=true;}
  else if(c===";"){row.push(value);value="";}
  else if(c==="\n"){row.push(value.replace(/\r$/,""));result.push(row);row=[];value="";}
  else value+=c;
 }
 if(quote)throw Error("CSV sin cerrar.");
 if(row.length||value!==""){row.push(value);result.push(row);}
 return result;
}
function importCaja(rows){
 const b=B();
 if(!rows.length||b.HEAD.some((x,i)=>String(rows[0][i]??"").trim()!==x))throw Error("Encabezados incorrectos. Usa un CSV o Excel generado por Rivas Auto.");
 const documents=[];
 for(let i=1;i<rows.length;i++){
  const r=rows[i];
  if(!r||r.every(v=>v===""||v===null))continue;
  if(String(r[0])!==b.CSV_MARK)throw Error("Fila "+(i+1)+" incompatible.");
  let data;
  try{data=JSON.parse(String(r[9]??""));}catch(e){throw Error("Datos originales ausentes en fila "+(i+1)+".");}
  // La columna datos_json guarda todos los campos: evita perder auditoria, relaciones e importes.
  const matches=[
   [data.fecha,r[2]],[data.userId,r[3]],[data.tipo,r[5]],[data.valor,r[6]],
   [data.descripcion,r[7]],[data.categoria,r[8]]
  ];
  for(const [a,v] of matches){
   const actual=String(a??"");
   const visible=String(v??"");
   if(actual!==visible&&actual!=="'"+visible&&visible!=="'"+actual)
    throw Error("Fila "+(i+1)+" modificada en Excel. Para recuperar utiliza el archivo exportado sin editar.");
  }
  documents.push({id:String(r[1]??""),data});
 }
 return validate({formato:b.FORMAT,version:1,proyecto:"rivasauto",fecha:null,colecciones:{transacciones:documents}});
}
async function loadFile(file){
 if(!file)throw Error("Selecciona un archivo.");
 if(file.size>50*1024*1024)throw Error("El archivo es mayor a 50 MB.");
 const name=file.name.toLowerCase(),b=B();
 if(name.endsWith(".zip")){
  if(!window.JSZip)throw Error("No se cargo la biblioteca ZIP.");
  const zip=await window.JSZip.loadAsync(file,{checkCRC32:true});
  const entry=zip.file("respaldo.json");
  if(!entry||entry.dir||entry._data?.uncompressedSize>50*1024*1024)throw Error("No contiene respaldo.json compatible.");
  return validate(JSON.parse(await entry.async("string")));
 }
 if(name.endsWith(".json"))return validate(JSON.parse(await file.text()));
 if(name.endsWith(".csv"))return importCaja(parseCSV(await file.text()));
 if(name.endsWith(".xlsx")){
  if(!window.XLSX)throw Error("No se cargo el lector XLSX. Usa el ZIP o CSV.");
  const book=window.XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:false});
  if(!book.SheetNames.length)throw Error("El archivo Excel esta vacio.");
  return importCaja(window.XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{header:1,defval:"",raw:true}));
 }
 throw Error("Formatos admitidos: ZIP, JSON, CSV y XLSX generados por Rivas Auto.");
}
async function compare(info){
 const plan={},b=B();
 for(const n of Object.keys(info.colecciones)){
  const fresh=await b.read([n]),actual=new Map(fresh[n].map(x=>[x.id,x.data]));
  const missing=[];let same=0,different=0;
  for(const rec of info.colecciones[n]){
   if(!actual.has(rec.id))missing.push(rec);
   else if(b.same(actual.get(rec.id),rec.data))same++;
   else different++;
  }
  plan[n]={total:info.colecciones[n].length,missing,same,different};
 }
 return plan;
}
function totals(plan){
 const t={total:0,missing:0,same:0,different:0};
 for(const r of Object.values(plan)){t.total+=r.total;t.missing+=r.missing.length;t.same+=r.same;t.different+=r.different;}
 return t;
}
function paint(plan){
 const tbody=$("rc-preview-body");tbody.replaceChildren();
 for(const [name,r] of Object.entries(plan)){
  const tr=document.createElement("tr");
  for(const item of [name,r.total,r.missing.length,r.same,r.different]){
   const td=document.createElement("td");td.className="border-b border-neutral-200 dark:border-neutral-700 px-3 py-2";td.textContent=String(item);tr.append(td);
  }
  tbody.append(tr);
 }
 const t=totals(plan);
 msg("Registros analizados: "+t.total+" | Faltantes: "+t.missing+" | Coincidentes: "+t.same+
   " | Diferentes (no se reemplazaran): "+t.different+".");
 $("rc-apply").disabled=t.missing===0;$("rc-preview").classList.remove("hidden");
}
async function analyze(el){
 selection=null;$("rc-preview").classList.add("hidden");
 if(!el.files?.[0])return;
 if(!isAdmin()){msg("Solo administradores.",true);return;}
 msg("Leyendo el archivo y comparando con Firebase...");
 try{
  const info=await loadFile(el.files[0]),plan=await compare(info);
  selection={info,plan};paint(plan);
 }catch(e){msg("Archivo rechazado: "+e.message,true);}
}
async function recover(){
 if(restoring)return;
 try{
  if(!isAdmin())throw Error("Solo administradores.");
  if(!selection)throw Error("Analiza un respaldo compatible antes de recuperar.");
  // Nunca sobrescribir registros. Ante cambios desde la vista previa, comparar de nuevo y detener.
  msg("Revalidando movimientos actuales...");
  const fresh=await compare(selection.info);
  const old=totals(selection.plan),now=totals(fresh);
  if(old.missing!==now.missing||old.different!==now.different){
   selection.plan=fresh;paint(fresh);
   throw Error("La base cambio despues de la vista previa. Compara nuevamente antes de continuar.");
  }
  if(now.missing===0)throw Error("No se encontraron registros faltantes.");
  if(!B().folder||!await B().permission(true))
   throw Error("Para recuperar primero debes elegir y autorizar la carpeta de Windows en el menu Respaldo.");
  if(!confirm("RECUPERACION DE RIVAS AUTO\n\nSe agregaran "+now.missing+
    " registros FALTANTES. Ningun registro existente sera sobrescrito o eliminado.\n"+
    "Antes se guardara una copia completa de seguridad en tu carpeta local.\n\n¿Confirmas?"))return;
  restoring=true;$("rc-apply").disabled=true;
  msg("Creando copia de seguridad ANTES de recuperar...");
  await B().backup("before"); // Abortar si la copia no se escribio correctamente.
  let done=0;
  for(const n of B().NAMES){
   if(!fresh[n])continue;
   for(const rec of fresh[n].missing){
    const ref=window.doc(window.db,n,rec.id);
    const created=await window.fbRunTransaction(window.db,async t=>{
     const existing=await t.get(ref);
     if(existing.exists())return false;
     t.set(ref,B().deserialize(rec.data));
     return true;
    });
    if(created)done++;
    msg("Restaurados: "+done+" de "+now.missing+". No se sobrescriben existentes.");
   }
  }
  // Recargar colecciones recuperadas y vistas visibles, sin cerrar sesion.
  for(const n of Object.keys(fresh)){
   const snap=await window.getDocs(window.collection(window.db,n));
   window.state[n]=snap.docs.map(d=>({id:d.id,...d.data()}));
  }
  window.initSelects?.();window.reRenderActiveViews?.();
  selection=null;$("rc-preview").classList.add("hidden");$("rc-file").value="";
  msg("Recuperacion completa: "+done+" registros agregados. Ninguno sobrescrito.");
 }catch(e){
  console.error("Error de recuperacion:",e);
  msg("Recuperacion detenida: "+e.message+
    " Si ya habia comenzado, vuelve a analizar el archivo para evitar duplicaciones.",true);
 }finally{restoring=false;if(selection)$("rc-apply").disabled=totals(selection.plan).missing===0;}
}
window.RivasRecovery={analyze,recover};
})();