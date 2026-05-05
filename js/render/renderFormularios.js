// ==========================================
// js/render/renderFormularios.js
// ==========================================

window.renderFormulariosView = () => {
   const table = document.getElementById('formularios-table');
   if(!table) return;
   
   if((window.state.formularios || []).length === 0) { 
     table.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-neutral-500 font-bold">No hay formularios generados.</td></tr>`; 
   } else {
     table.innerHTML = window.state.formularios.slice().reverse().map(f => {
       const isPendiente = f.estado === 'Pendiente';
       return `
         <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
           <td class="px-6 py-4 text-sm font-bold text-neutral-500">${window.formatDate(f.fecha)}</td>
           <td class="px-6 py-4 font-bold">
             <span class="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 px-2 py-1 rounded text-xs uppercase tracking-wider">${f.tipo}</span>
           </td>
           <td class="px-6 py-4 font-bold text-sm">${f.comprador}</td>
           <td class="px-6 py-4 text-center space-x-2 flex justify-center">
             <button onclick='window.openModalBoleto("${f.tipo.includes('Permuta') ? 'permuta' : 'simple'}", ${JSON.stringify(f).replace(/"/g, '&quot;')})' 
                     class="px-3 py-1.5 ${isPendiente ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'} text-xs font-bold rounded-lg hover:scale-105 transition-transform flex items-center">
               <i data-lucide="${isPendiente ? 'edit-2' : 'eye'}" class="w-4 h-4 mr-1"></i> ${isPendiente ? 'Terminar' : 'Ver / Editar'}
             </button>
             <button onclick='window.imprimirBoletoHtml(${JSON.stringify(f).replace(/"/g, '&quot;')})' class="px-3 py-1.5 bg-black text-white dark:bg-neutral-700 dark:text-white text-xs font-bold rounded-lg hover:scale-105 transition-transform flex items-center">
               <i data-lucide="printer" class="w-4 h-4 mr-1"></i> Reimprimir
             </button>
           </td>
         </tr>
       `;
     }).join('');
   }
   if(window.lucide) window.lucide.createIcons();
};

window.openModalBoleto = (tipo, prefillData = null) => {
  let content = ''; 
  document.getElementById('boleto-title').innerText = tipo === 'simple' ? 'BOLETO COMPRA VENTA AUTOMOTOR' : 'BOLETO DE VENTA CON PERMUTA'; 

  if(tipo === 'simple') {
    content = `
      <form id="form-real-boleto" onsubmit="window.preGuardarBoleto(event, 'simple')">
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Datos de Partes</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <input id="bf-vendedor" required placeholder="Vendedor (Nombre)" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.vendedor || ''}"/>
          <input id="bf-vendedor-domicilio" required placeholder="Domicilio Vendedor" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.vendedorDomicilio || ''}"/>
          <input id="bf-vendedor-loc" required placeholder="Localidad Vendedor" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.vendedorLoc || 'Gualeguaychú'}"/>
          <input id="bf-vendedor-tel" required placeholder="Celular Vendedor" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.vendedorTel || ''}"/>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <input id="bf-comprador" required placeholder="Comprador (Nombre)" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.comprador || ''}"/>
          <input id="bf-dni" required placeholder="D.N.I Comprador" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.dni || ''}"/>
          <input id="bf-domicilio" required placeholder="Domicilio Comprador" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.domicilio || ''}"/>
          <input id="bf-loc-comp" required placeholder="Localidad Comprador" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.locComp || ''}"/>
          <input id="bf-telefono" required placeholder="Celular Comprador" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.telefono || ''}"/>
        </div>
        
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Datos del Vehículo</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <input id="bf-categoria" required placeholder="Categoría (Ej: AUTOMOVIL)" class="col-span-2 md:col-span-3 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.categoria || 'AUTOMOVIL'}"/>
          <input id="bf-marca" required placeholder="Marca" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.auto?.marca || prefillData?.marca || ''}" />
          <input id="bf-modelo" required placeholder="Modelo" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.auto?.modelo || prefillData?.modelo || ''}"/>
          <input id="bf-tipo" required placeholder="Tipo (Ej: SEDAN 5 PUERTAS)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.tipoVehiculo || ''}"/>
          <input id="bf-anio" required placeholder="Año" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.auto?.año || prefillData?.año || ''}"/>
          <input id="bf-motor" required placeholder="Motor N°" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.motor || ''}" />
          <input id="bf-chasis" required placeholder="Chasis N°" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.chasis || ''}" />
          <input id="bf-dominio" required placeholder="Dominio (Patente)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none uppercase font-bold" value="${prefillData?.auto?.patente || prefillData?.dominio || ''}"/>
        </div>
        
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Monto y Pago</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input id="bf-monto" type="number" required placeholder="Suma Total ($)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold text-lg" value="${prefillData?.monto || ''}"/>
          <input id="bf-monto-letras" required placeholder="Suma Total (En letras)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.montoLetras || ''}"/>
        </div>
        <textarea id="bf-formapago" required maxlength="1500" rows="3" placeholder="Detallar forma de pago exacta..." class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold resize-none mb-6">${prefillData?.formaPago || ''}</textarea>
        
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Legal y Observaciones</h4>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <input id="bf-dias-transf" type="number" required placeholder="Días para transferir" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.diasTransf || '30'}"/>
          <input id="bf-ciudad-firma" required placeholder="Ciudad de firma" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.ciudadFirma || 'Gualeguaychú'}"/>
        </div>
        <textarea id="bf-obs" maxlength="1000" rows="3" placeholder="Observaciones adicionales..." class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold resize-none mb-6">${prefillData?.observaciones || ''}</textarea>
        
        <button type="submit" class="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center">
          <span>Guardar e Imprimir</span>
        </button>
      </form>
    `;
  } else {
    content = `
      <form id="form-real-boleto" onsubmit="window.preGuardarBoleto(event, 'permuta')">
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Datos de Partes</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <input id="bf-comprador" required placeholder="Comprador (Nombre y Apellido)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.comprador || ''}"/>
          <input id="bf-dni" required placeholder="D.N.I" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.dni || ''}"/>
          <input id="bf-telefono" required placeholder="Celular" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.telefono || ''}"/>
        </div>
        <div class="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
          <input id="bf-domicilio" required placeholder="Calle (Domicilio)" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.domicilio || ''}"/>
          <input id="bf-altura" required placeholder="Altura (Nro)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.altura || ''}"/>
          <input id="bf-loc-comp" required placeholder="Localidad, Provincia" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.locComp || ''}"/>
        </div>
        
        <div class="mb-6">
          <input id="bf-vendedor" required placeholder="Por cuenta y orden de (Apoderado)" class="w-full md:w-1/2 rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.vendedor || 'RIVAS AUTO'}"/>
        </div>

        <h4 class="font-bold text-slate-500 mb-4 uppercase">Vehículo Vendido</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <input id="bf-marca" required placeholder="Marca" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.auto?.marca || prefillData?.marca || ''}" />
          <input id="bf-modelo" required placeholder="Modelo y Tipo" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.auto?.modelo || prefillData?.modelo || ''}"/>
          <input id="bf-anio" required placeholder="Año" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.auto?.año || prefillData?.año || ''}"/>
          <input id="bf-motor" required placeholder="Motor N°" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.motor || ''}" />
          <input id="bf-chasis" required placeholder="Chasis N°" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.chasis || ''}" />
          <input id="bf-dominio" required placeholder="Patente Nro" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none uppercase font-bold" value="${prefillData?.auto?.patente || prefillData?.dominio || ''}"/>
          <input id="bf-loc-pat" required placeholder="Patentado en localidad de..." class="col-span-2 md:col-span-3 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.locPat || ''}"/>
        </div>
        
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Importes (Venta)</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input id="bf-monto" type="number" required placeholder="Suma Total ($)" oninput="window.calcRemanentePermuta()" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold text-lg" value="${prefillData?.monto || ''}"/>
          <input id="bf-monto-letras" required placeholder="Suma Total (En letras)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.montoLetras || ''}"/>
          <input id="bf-efectivo" type="number" placeholder="Efectivo abonado ($) - Si corresponde" class="col-span-1 md:col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.efectivo || ''}"/>
        </div>
        
        <h4 class="font-bold text-slate-500 mb-4 uppercase text-amber-600">Vehículo Recibido en Permuta</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800">
          <input id="bp-marca" required placeholder="Permuta: Marca" class="w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.permuta?.marca || prefillData?.p_marca || ''}"/>
          <input id="bp-modelo" required placeholder="Permuta: Modelo" class="w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.permuta?.modelo || prefillData?.p_modelo || ''}"/>
          <input id="bp-anio" required type="number" placeholder="Permuta: Año" class="w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.permuta?.anio || prefillData?.p_anio || ''}"/>
          <input id="bp-motor" required placeholder="Permuta: Motor N°" class="w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.p_motor || ''}"/>
          <input id="bp-chasis" required placeholder="Permuta: Chasis N°" class="w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.p_chasis || ''}"/>
          <input id="bp-dominio" required placeholder="Permuta: Patente" class="w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none uppercase font-bold" value="${prefillData?.permuta?.patente || prefillData?.p_dominio || ''}"/>
          <input id="bp-loc-pat" required placeholder="Permuta patentada en localidad de..." class="col-span-2 md:col-span-3 w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.p_locPat || ''}"/>
          
          <input id="bp-tasado" type="number" required placeholder="Valor Tasado / Toma ($)" oninput="window.calcRemanentePermuta()" class="col-span-2 md:col-span-1 w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none font-bold text-amber-700" value="${prefillData?.permuta?.tasado || prefillData?.p_tasado || ''}"/>
          <input id="bp-tasado-letras" required placeholder="Valor Tasado (En letras)" class="col-span-2 w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none font-bold text-amber-700" value="${prefillData?.p_tasadoLetras || ''}"/>
        </div>
        
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Detalle del Remanente</h4>
        <div class="mb-6 p-6 bg-neutral-100 dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700">
           <label class="block text-xs font-bold text-neutral-500 uppercase mb-2">Diferencia Automática (Monto Venta - Valor Toma)</label>
           <input id="bf-remanente-num" readonly class="w-full rounded-xl px-4 py-3 bg-neutral-200 dark:bg-neutral-900 border border-transparent outline-none font-black text-rose-500 mb-4 cursor-not-allowed" value="0"/>
           <input id="bf-remanente-letras" required placeholder="Remanente (En letras)" class="w-full rounded-xl px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold mb-4" value="${prefillData?.remanenteLetras || ''}"/>
           <textarea id="bf-detalle-remanente" required maxlength="1500" rows="6" placeholder="Detalle exacto de cómo se cancela el remanente (Ej. en cuotas de $X con vencimiento X)..." class="w-full rounded-xl px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold resize-none">${prefillData?.detalleRemanente || ''}</textarea>
        </div>
        
        <textarea id="bf-obs" maxlength="1000" rows="3" placeholder="Observaciones adicionales..." class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold resize-none mb-6">${prefillData?.observaciones || ''}</textarea>
        
        <button type="submit" class="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center">
          <span>Guardar e Imprimir</span>
        </button>
      </form>
    `;
  }
  
  document.getElementById('boleto-form-content').innerHTML = content;
  
  if (prefillData && prefillData.auto) { 
    window.state.tempFormData = { autoIdAsociado: prefillData.auto.id, id: prefillData.id }; 
  } else if (prefillData && prefillData.id) {
    window.state.tempFormData = { id: prefillData.id }; 
  } else { 
    window.state.tempFormData = {}; 
  }
  
  window.openModal('modal-boleto');
  
  if (tipo === 'permuta') {
    window.calcRemanentePermuta();
  }
};

window.imprimirBoletoHtml = (data) => {
  const globalLogo = document.getElementById('print-logo');
  if(globalLogo) globalLogo.classList.add('hidden');

  let printHtml = `
    <div class="absolute -top-4 right-0 w-32 h-32">
      <img src="logo-form.png" class="w-full h-full object-contain" alt="Logo Formulario" onerror="this.style.display='none'">
    </div>
  `;

  const dateObj = new Date(data.fecha + 'T00:00:00');
  const dia = dateObj.getDate();
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mes = meses[dateObj.getMonth()];
  const anio = dateObj.getFullYear();
  
  if(data.tipo === 'Boleto Compra Venta') {
    printHtml += `
      <h2 class="text-center text-xl font-black mb-4 underline uppercase">BOLETO COMPRA VENTA AUTOMOTOR</h2>
      
      <div class="text-[12px] leading-snug space-y-2">
          <p class="text-justify">Conste por el presente que entre el Señor: <strong>${data.vendedor}</strong> como VENDEDOR y el Señor: <strong>${data.comprador}</strong>, como comprador se conviene lo siguiente:</p>
          
          <p class="text-justify">El señor: <strong>${data.vendedor}</strong>, vende un: <strong>${data.categoria}</strong> en las condiciones vistas.<br>
          Marca: <strong>${data.marca}</strong>, Modelo: <strong>${data.modelo}</strong>, Tipo: <strong>${data.tipoVehiculo}</strong>, Año: <strong>${data.año}</strong>, Motor Nro: <strong>${data.motor || '___________'}</strong>, Chasis Nro.: <strong>${data.chasis || '___________'}</strong>, Dominio: <strong>${data.dominio}</strong>.</p>
          
          <p class="text-justify">En la suma total de pesos ($): <strong>${data.monto}</strong>, (<strong>${data.montoLetras}</strong>), Pagaderos de la siguiente forma: <strong>${data.formaPago}</strong></p>
          
          <p class="text-justify">Esta unidad se entrega en el estado de uso en que se encuentra y que el comprador declara conocer, al igual que todo lo concerniente a la marca, modelo, números de motor y/o chasis del referido vehículo, que ha sido revisado y constatado y acepta de plena conformidad, haciéndose responsable civil y criminalmente, a partir de la fecha y hora de efectuada esta venta por cualquier accidente, daño y/o perjuicio que pudiera ocasionar el vehículo que es recibido en este acto con su documentación completa y al día. El comprador se compromete a efectuar la correspondiente transferencia de dominio del vehículo dentro de los <strong>${data.diasTransf}</strong> días de la fecha, de acuerdo a lo establecido al respecto por la ley 22.977 y sus normas complementarias, interpretativas y/o complementarias, estando a a su exclusivo cargo la totalidad de los gastos que demande la misma y los tramites y gestiones pertinentes, incluyendo la firma del formulario 08 o el que a tales fines lo subsista y/o reemplace y/o el otorgamiento de los poderes, todos ello en forma directa con el titular dominal. Transcurrido dicho plazo sin que realizara la transferencia el vendedor no se responsabiliza por los inconvenientes de cualquier índole que pudieran existir anteriores o posteriores a la fecha, que imposibilitan la efectivización de dicho tramite, incluyendo embargos y/o prendas o medidas judiciales de cualquier tipo sobre el vehículo, al igual que deudas emergentes de patentes municipales y/o multas. Con absoluta conformidad del Comprador.----------------------------------------------------------------------------------------------------/</p>
          
          <p class="text-justify">En <strong>${data.ciudadFirma}</strong> a los <strong>${dia}</strong> dias, del mes de <strong>${mes}</strong> del Año <strong>${anio}</strong>, se firman dos ejemplares del mismo tenor y a un solo efecto.</p>
          
          <p class="font-bold text-justify mt-2">Observaciones: ${data.observaciones}</p>
      </div>

      <div class="grid grid-cols-2 gap-8 text-[11px] mt-6">
        <div>
          <p class="font-bold mb-2">Comprador</p>
          <p>Nombre y Apellido: <strong>${data.comprador}</strong></p>
          <p>Direccion: <strong>${data.domicilio}</strong></p>
          <p>Localidad: <strong>${data.locComp}</strong></p>
          <p>Celular: <strong>${data.telefono}</strong></p>
          <div class="border-t border-black mt-12 pt-1 font-bold w-[80%] text-center">FIRMA:</div>
        </div>
        <div>
          <p class="font-bold mb-2">Vendedor</p>
          <p>Nombre y Apellido: <strong>${data.vendedor}</strong></p>
          <p>Direccion: <strong>${data.vendedorDomicilio}</strong></p>
          <p>Localidad: <strong>${data.vendedorLoc}</strong></p>
          <p>Celular: <strong>${data.vendedorTel}</strong></p>
          <div class="border-t border-black mt-12 pt-1 font-bold w-[80%] text-center">FIRMA:</div>
        </div>
      </div>
    `;
  } else {
    printHtml += `
      <h2 class="text-center text-xl font-black mb-4 underline uppercase">BOLETO DE VENTA CON PERMUTA</h2>
      
      <div class="text-[12px] leading-snug space-y-2">
          <p class="text-justify">Conste por el presente que hemos vendido a Sr./Sra: <strong>${data.comprador}</strong> con D.N.I: <strong>${data.dni}</strong> y domicilio en calle <strong>${data.domicilio}</strong> Nro.: <strong>${data.altura}</strong> de la localidad de <strong>${data.locComp}</strong> con Celular: <strong>${data.telefono}</strong>.</p>
          
          <p class="text-justify">Por cuenta y orden de Sr./Sra. <strong>${data.vendedor}</strong> un automóvil usado, en las condiciones vistas y que se encuentran libre de gravámenes y/o deudas nacionales, municipales o provinciales, dejando constancia que en la fecha el comprador toma posesión del mismo de conformidad, siendo sus características las que se detallan a continuación:</p>
          
          <p class="font-bold text-justify">Marca: ${data.marca} Modelo: ${data.modelo} Año: ${data.año} Motor: ${data.motor || '___________'}, Nro. serie o chasis: ${data.chasis || '___________'}<br>
          Patentado en la localidad de: ${data.locPat || '___________'} bajo Nro.: ${data.dominio}</p>
          
          <p class="text-justify">La venta se realiza por la suma total de ($) <strong>${data.monto}</strong> , (<strong>${data.montoLetras}</strong>); Discriminados en la siguiente manera:<br>
          Efectivo: ($) <strong>${data.efectivo || 0}</strong></p>
          
          <p class="text-justify">Se recibe como parte de pago un automovil marca: <strong>${data.p_marca}</strong> Modelo: <strong>${data.p_modelo}</strong> Año: <strong>${data.p_anio}</strong> Motor Nro.: <strong>${data.p_motor || '___________'}</strong> Nro. de serie o chasis: <strong>${data.p_chasis || '___________'}</strong> patentado en la localidad de: <strong>${data.p_locPat || '___________'}</strong>, Nro.: <strong>${data.p_dominio}</strong>, libre de deuda y gravamenes, tasado en la suma de ($): <strong>${data.p_tasado}</strong> , (<strong>${data.p_tasadoLetras}</strong>), debiendo cancelarse el remanente de ($): <strong>${window.formatMoney((Number(data.monto) || 0) - (Number(data.p_tasado) || 0))}</strong> , (<strong>${data.remanenteLetras || '___________'}</strong>).</p>
          
          <p class="text-justify uppercase font-bold">${data.detalleRemanente}</p>
          
          <p class="text-justify">Y las cuotas restantes a cancelar cada treinta (30) dias, sucesivamente, hasta la cancelacion de la deuda total, cuyo efecto se firma de igual numero de Pagares que representan las cuotas convenidas y prenda con Registro, gravandose con todas las formalidades stablecidas en la Ley Nro. 12.962 el automovil vendido, garantia del saldo deudor.</p>
          
          <p class="font-bold text-justify">Observaciones: ${data.observaciones}</p>
          
          <p class="mt-4">En conformidad se forman dos ejemplares del mismo tenor y a un solo efecto, en Gualeguaychu a los ${dia} dias del mes de ${mes} del año ${anio}.</p>
      </div>

      <div class="mt-12 flex justify-between px-16 text-[11px]">
        <div class="text-center border-t border-black w-48 pt-2 font-bold">Firmas</div>
        <div class="text-center border-t border-black w-48 pt-2 font-bold">Firmas</div>
      </div>
    `;
  }
  
  document.getElementById('print-content').innerHTML = printHtml;
  document.getElementById('app-wrapper').classList.add('hidden'); 
  document.getElementById('print-section').classList.remove('hidden');
  
  setTimeout(() => { 
    window.print(); 
    document.getElementById('print-section').classList.add('hidden'); 
    document.getElementById('app-wrapper').classList.remove('hidden'); 
    if(globalLogo) globalLogo.classList.remove('hidden'); 
    if(window.renderFormulariosView) window.renderFormulariosView(); 
  }, 800); 
};
