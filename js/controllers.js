// ==========================================
// js/controllers.js
// ==========================================

// --- FORMULARIOS (BOLETOS) ---
window.openModalBoleto = (tipo, prefillData = null) => {
  let content = ''; 
  const t = tipo === 'simple' ? 'BOLETO COMPRA VENTA AUTOMOTOR' : 'BOLETO DE VENTA CON PERMUTA'; 
  document.getElementById('boleto-title').innerText = t;

  if(tipo === 'simple') {
    content = `
      <form id="form-real-boleto" onsubmit="window.preGuardarBoleto(event, 'simple')">
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Datos de Partes</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <input id="bf-vendedor" required placeholder="Vendedor (Nombre)" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.vendedor || ''}"/>
          <input id="bf-comprador" required placeholder="Comprador (Nombre)" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.comprador || ''}"/>
          <input id="bf-dni" required placeholder="D.N.I Comprador" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.dni || ''}"/>
          <input id="bf-domicilio" required placeholder="Domicilio Comprador" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.domicilio || ''}"/>
        </div>
        
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Datos del Vehículo</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <input id="bf-marca" required placeholder="Marca" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.auto?.marca || ''}" />
          <input id="bf-modelo" required placeholder="Modelo y Tipo" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.auto?.modelo || ''}"/>
          <input id="bf-anio" required placeholder="Año" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.auto?.año || ''}"/>
          <input id="bf-dominio" required placeholder="Dominio (Patente)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none uppercase font-bold" value="${prefillData?.auto?.patente || ''}"/>
          <input id="bf-motor" required placeholder="Motor N°" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" />
          <input id="bf-chasis" required placeholder="Chasis N°" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" />
        </div>
        
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Monto, Pago y Observaciones</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input id="bf-monto" type="number" required placeholder="Suma Total ($)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold text-lg" value="${prefillData?.monto || ''}"/>
          <input id="bf-formapago" required placeholder="Forma de pago (Ej: EFECTIVO)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="EFECTIVO EN ESTE ACTO" />
        </div>
        <textarea id="bf-obs" maxlength="1500" rows="4" placeholder="Observaciones..." class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold resize-none mb-6"></textarea>
        
        <button type="submit" class="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg hover:bg-green-700 transition-colors">
          Continuar a Guardar e Imprimir
        </button>
      </form>
    `;
  } else {
    content = `
      <form id="form-real-boleto" onsubmit="window.preGuardarBoleto(event, 'permuta')">
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Datos de Partes</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <input id="bf-vendedor" required placeholder="Vendedor (Agencia)" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.vendedor || 'RIVAS AUTO'}"/>
          <input id="bf-comprador" required placeholder="Comprador (Nombre)" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.comprador || ''}"/>
          <input id="bf-dni" required placeholder="D.N.I Comprador" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.dni || ''}"/>
          <input id="bf-domicilio" required placeholder="Domicilio Comprador" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.domicilio || ''}"/>
          <input id="bf-telefono" required placeholder="Teléfono" class="col-span-2 w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.telefono || ''}"/>
        </div>
        
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Vehículo Entregado (Vendido)</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <input id="bf-marca" required placeholder="Marca" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.auto?.marca || ''}" />
          <input id="bf-modelo" required placeholder="Modelo" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.auto?.modelo || ''}"/>
          <input id="bf-anio" required placeholder="Año" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.auto?.año || ''}"/>
          <input id="bf-dominio" required placeholder="Patente" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none uppercase font-bold" value="${prefillData?.auto?.patente || ''}"/>
          <input id="bf-motor" required placeholder="Motor N°" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" />
          <input id="bf-chasis" required placeholder="Chasis N°" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" />
        </div>
        
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Pago y Permuta Recibida</h4>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <input id="bf-monto" type="number" required placeholder="Venta Total ($)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold text-lg" value="${prefillData?.monto || ''}"/>
          <input id="bf-efectivo" type="number" placeholder="Efectivo abonado ($)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.efectivo || ''}"/>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800">
          <input id="bp-marca" required placeholder="Permuta: Marca" class="w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.permuta?.marca || ''}"/>
          <input id="bp-modelo" required placeholder="Permuta: Modelo" class="w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.permuta?.modelo || ''}"/>
          <input id="bp-anio" required type="number" placeholder="Permuta: Año" class="w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.permuta?.anio || ''}"/>
          <input id="bp-dominio" required placeholder="Permuta: Patente" class="w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none uppercase font-bold" value="${prefillData?.permuta?.patente || ''}"/>
          <input id="bp-tasado" type="number" required placeholder="Valor Tasado ($)" class="w-full rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 outline-none font-bold text-green-700" value="${prefillData?.permuta?.tasado || ''}"/>
        </div>
        
        <h4 class="font-bold text-slate-500 mb-4 uppercase">Financiación y Observaciones</h4>
        <div class="grid grid-cols-3 gap-4 mb-4">
          <input id="bf-saldo" type="number" placeholder="Saldo Deudor ($)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold text-rose-500" value="${prefillData?.saldo || ''}" />
          <input id="bf-cuotas" type="number" placeholder="Cant. Cuotas" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.cuotas || ''}" />
          <input id="bf-valcuota" type="number" placeholder="Valor Cuota ($)" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold" value="${prefillData?.valCuota || ''}" />
        </div>
        
        <textarea id="bf-obs" maxlength="1500" rows="4" placeholder="Observaciones adicionales..." class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none font-bold resize-none mb-6"></textarea>
        
        <button type="submit" class="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg hover:bg-green-700 transition-colors">
          Continuar a Guardar e Imprimir
        </button>
      </form>
    `;
  }
  
  document.getElementById('boleto-form-content').innerHTML = content;
  
  if (prefillData && prefillData.auto) { 
    window.state.tempFormData = { autoIdAsociado: prefillData.auto.id }; 
  } else { 
    window.state.tempFormData = {}; 
  }
  
  window.openModal('modal-boleto');
};

window.preGuardarBoleto = (e, tipo) => {
  e.preventDefault();
  
  const baseData = {
    tipo: tipo === 'simple' ? 'Boleto Compra Venta' : 'Boleto Venta con Permuta', 
    fecha: new Date().toISOString().split('T')[0],
    vendedor: document.getElementById('bf-vendedor').value, 
    comprador: document.getElementById('bf-comprador').value, 
    dni: document.getElementById('bf-dni').value, 
    domicilio: document.getElementById('bf-domicilio').value,
    marca: document.getElementById('bf-marca').value, 
    modelo: document.getElementById('bf-modelo').value, 
    año: document.getElementById('bf-anio').value, 
    dominio: document.getElementById('bf-dominio').value.toUpperCase(),
    motor: document.getElementById('bf-motor').value, 
    chasis: document.getElementById('bf-chasis').value, 
    monto: document.getElementById('bf-monto').value, 
    observaciones: document.getElementById('bf-obs').value
  };
  
  if(tipo === 'simple') { 
    baseData.formaPago = document.getElementById('bf-formapago').value; 
  } else { 
    baseData.telefono = document.getElementById('bf-telefono').value; 
    baseData.efectivo = document.getElementById('bf-efectivo').value; 
    baseData.p_marca = document.getElementById('bp-marca').value; 
    baseData.p_modelo = document.getElementById('bp-modelo').value; 
    baseData.p_anio = document.getElementById('bp-anio').value; 
    baseData.p_dominio = document.getElementById('bp-dominio').value.toUpperCase(); 
    baseData.p_tasado = document.getElementById('bp-tasado').value; 
    baseData.saldo = document.getElementById('bf-saldo').value; 
    baseData.cuotas = document.getElementById('bf-cuotas').value; 
    baseData.valCuota = document.getElementById('bf-valcuota').value; 
  }
  
  const autoId = window.state.tempFormData.autoIdAsociado; 
  window.state.tempFormData = { ...baseData, autoIdAsociado: autoId };
  
  if (autoId) { 
    window.guardarYImprimirFormulario(autoId); 
  } else { 
    document.getElementById('asoc-auto-select').innerHTML = `<option value="">-- Seleccionar Automóvil --</option>` + window.state.autos.filter(a => a.estado !== 'Vendido').map(a => `<option value="${a.id}">${a.marca} ${a.modelo} (${a.patente})</option>`).join(''); 
    window.closeModal('modal-boleto'); 
    document.getElementById('asoc-select-container').classList.add('hidden'); 
    window.openModal('modal-asociar-form'); 
  }
};

window.guardarYImprimirFormulario = async (autoIdAsociado) => {
  const data = { ...window.state.tempFormData };
  
  if (autoIdAsociado) { 
    data.autoIdAsociado = autoIdAsociado; 
    await window.fbUpdate("autos", autoIdAsociado, { estado: 'Vendido' }); 
  }
  
  await window.fbAdd("formularios", data);
  
  window.closeModal('modal-asociar-form'); 
  window.closeModal('modal-boleto');
  
  window.imprimirBoletoHtml(data);
};

window.imprimirBoletoHtml = (data) => {
  let printHtml = ''; 
  const date = new Date(data.fecha); 
  const fDate = `${date.getDate() + 1} de ${date.toLocaleString('es-ES', { month: 'long' })} del ${date.getFullYear()}`;
  
  if(data.tipo === 'Boleto Compra Venta') {
    printHtml = `
      <h2 class="text-center text-2xl font-black mb-8 underline uppercase">${data.tipo}</h2>
      <p class="mb-4">Conste por el presente que entre el Señor/a: <strong>${data.vendedor}</strong> como VENDEDOR y el Señor/a: <strong>${data.comprador}</strong>, D.N.I: <strong>${data.dni}</strong> y domicilio en calle <strong>${data.domicilio}</strong> como COMPRADOR se conviene lo siguiente:</p>
      <p class="mb-4">El Vendedor vende un AUTOMOVIL en las condiciones vistas con las siguientes características:</p>
      <ul class="list-disc pl-8 mb-6 font-bold">
        <li>Marca: ${data.marca}</li>
        <li>Modelo y Tipo: ${data.modelo}</li>
        <li>Año: ${data.año}</li>
        <li>Dominio: ${data.dominio}</li>
        <li>Motor N°: ${data.motor}</li>
        <li>Chasis N°: ${data.chasis}</li>
      </ul>
      <p class="mb-4">En la suma total de pesos: <strong>$ ${data.monto}</strong></p>
      <p class="mb-6">Pagaderos de la siguiente forma: <strong>${data.formaPago}</strong>, SIRVIENDO EL PRESENTE BOLETO DE RECIBO SUFICIENTE.</p>
      <p class="mb-4 text-justify">Esta unidad se entrega en el estado de uso en que se encuentra y que el comprador declara conocer, al igual que todo lo concerniente a la marca, modelo, numeros de motor y/o chasis del referido vehiculo, que ha sido revisado y constatado y acepta de plena conformidad, haciendose responsable civil y criminalmente, a partir de la fecha y hora de efectuada esta venta por cualquier accidente, daño y/o perjucio que pudiera ocasionar el vehiculo que es recibido en este acto con su documentacion completa y al dia.</p>
      <p class="mb-4 text-justify">El comprador se compromente a efectuar la correspondiente transferencia de dominio del vehiculo dentro de los plazos de ley, estando a a su exclusivo cargo la totalidad de los gastos que demande la misma y los tramites y gestiones pertinentes.</p>
      <p class="mb-6 font-bold">Observaciones: ${data.observaciones}</p>
      <p class="mt-8">En la ciudad de GUALEGUAYCHÚ, a los ${fDate}, se firman dos ejemplares de un mismo tenor y a un solo efecto.</p>
      <div class="mt-24 flex justify-between px-16">
        <div class="text-center border-t border-black w-48 pt-2 font-bold">Firma Vendedor</div>
        <div class="text-center border-t border-black w-48 pt-2 font-bold">Firma Comprador</div>
      </div>
    `;
  } else {
    printHtml = `
      <h2 class="text-center text-xl font-black mb-8 underline uppercase">BOLETO DE VENTA CON PERMUTA</h2>
      <p class="mb-4 text-justify">Conste por el presente que hemos vendido a Sr./Sra: <strong>${data.comprador}</strong><br>
      D.N.I: <strong>${data.dni}</strong> y domicilio en calle <strong>${data.domicilio}</strong><br>
      De la localidad de __________________ Celular: <strong>${data.telefono}</strong><br>
      Por cuenta y orden de Sr./Sra. <strong>${data.vendedor}</strong> un automovil usado, en las condiciones vistas y que se encuentran libre de gravamenes y/o deudas nacionales, municipales o provinciales, dejando contancia que en la fecha el comprador toma posesion del mismo de conformidad, siendo sus caracteristicas las que se detallan a continuacion:</p>
      
      <p class="mb-4 font-bold">Marca: ${data.marca} Modelo: ${data.modelo}<br>
      Año: ${data.año} Motor: ${data.motor} Nro. serie o chasis: ${data.chasis}<br>
      Patentado en la localidad de __________________ bajo Nro. ${data.dominio}</p>
      
      <p class="mb-4 text-justify">La venta se realiza por la suma total de ($) <strong>${data.monto}</strong> , (____________________________________)<br>
      Discriminados en la siguiente manera:<br>
      Efectivo: ($) <strong>${data.efectivo || 0}</strong></p>
      
      <p class="mb-4 text-justify">Se recibe como parte de pago, un automovil marca: <strong>${data.p_marca}</strong> Modelo: <strong>${data.p_modelo}</strong><br>
      Año: <strong>${data.p_anio}</strong> Motor Nro.: ________________ Nro. de serie o chasis: ________________<br>
      Patente de: <strong>${data.p_dominio}</strong> Nro.: ____________ libre de deuda y gravamenes, tasado en la suma de ($): <strong>${data.p_tasado}</strong> , (____________________________________)<br>
      debiendo cancelarse el remanente de ($): <strong>${data.saldo}</strong> , (____________________________________)</p>
      
      <p class="mb-6 text-justify">En <strong>${data.cuotas}</strong> cuotas de ($) <strong>${data.valCuota}</strong> cada una, con vencimiento la primera de ellas el dia ______ del mes ____________ del año ________. Y las cuotas restantes a cancelar cada treinta (30) dias, sucesivamente, hasta la cancelacion de la deuda total, cuyo efecto se firma de igual numero de Pagares que representan las cuotas convenidas y prenda con Registro, gravandose con todas las formalidades establecidas en la Ley Nro. 12.962 el automovil vendido, garantia del saldo deudor.</p>
      
      <p class="mb-4 font-bold text-justify">Observaciones: ${data.observaciones}</p>
      
      <p class="mb-12">En conformidad se forman dos ejemplares del mismo tenor y a un solo efecto, en Gualeguaychu a los ${fDate}.</p>
      
      <div class="mt-12 flex justify-between px-16">
        <div class="text-center border-t border-black w-48 pt-2 font-bold">Firma Agencia</div>
        <div class="text-center border-t border-black w-48 pt-2 font-bold">Firma Comprador</div>
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
    window.renderFormulariosView(); 
  }, 500);
};

window.imprimirFlota = () => {
   const today = new Date().toLocaleDateString('es-AR');
   let printHtml = `
     <h2 class="text-center text-2xl font-black mb-4 uppercase">Listado de Flota Rivas Auto</h2>
     <p class="mb-6 font-bold text-right text-sm">Fecha de impresión: ${today}</p>
     <table class="w-full text-left border-collapse border border-black">
        <thead>
          <tr class="bg-gray-200 border-b border-black text-xs uppercase">
            <th class="p-2 border-r border-black">Vehículo</th>
            <th class="p-2 border-r border-black">Patente</th>
            <th class="p-2 border-r border-black">Color</th>
            <th class="p-2 border-r border-black">Km</th>
            <th class="p-2 border-r border-black">Condición</th>
            <th class="p-2 text-right">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${window.state.autos.filter(a => a.estado !== 'Vendido').map(a => `
           <tr class="border-b border-black text-sm">
             <td class="p-2 border-r border-black font-bold">${a.marca} ${a.modelo} (${a.año})</td>
             <td class="p-2 border-r border-black uppercase">${a.patente}</td>
             <td class="p-2 border-r border-black capitalize">${a.color || '-'}</td>
             <td class="p-2 border-r border-black">${a.km || '-'}</td>
             <td class="p-2 border-r border-black uppercase text-[10px]">${a.condicion || '-'}</td>
             <td class="p-2 text-right font-bold">${window.formatMoney(a.precio)}</td>
           </tr>
          `).join('')}
        </tbody>
     </table>
   `;
   
   document.getElementById('print-content').innerHTML = printHtml;
   
   document.getElementById('app-wrapper').classList.add('hidden'); 
   document.getElementById('print-section').classList.remove('hidden');
   
   setTimeout(() => { 
     window.print(); 
     document.getElementById('print-section').classList.add('hidden'); 
     document.getElementById('app-wrapper').classList.remove('hidden'); 
   }, 500);
};

// --- ALTA Y MODIFICACIÓN DE AUTOS ---
window.handleAutoSubmit = async (e) => {
  e.preventDefault();
  
  const obj = { 
    marca: document.getElementById('auto-marca').value, 
    modelo: document.getElementById('auto-modelo').value, 
    color: document.getElementById('auto-color').value, 
    km: Number(document.getElementById('auto-km').value), 
    año: Number(document.getElementById('auto-anio').value), 
    patente: document.getElementById('auto-patente').value.toUpperCase(), 
    precio: Number(document.getElementById('auto-precio').value), 
    costo: Number(document.getElementById('auto-costo').value), 
    condicion: document.getElementById('auto-condicion').value, 
    sucursalId: document.getElementById('auto-sucursal').value 
  };
  
  if(window.state.editingAutoId) { 
    await window.fbUpdate("autos", window.state.editingAutoId, obj); 
  } else { 
    await window.fbAdd("autos", { 
      ...obj, 
      estado: 'Disponible', 
      gastos: [], 
      documentacion: { c08: false, verificacion: false, libreDeuda: false, vtv: '' } 
    }); 
  }
  
  window.closeModal('modal-auto'); 
  e.target.reset(); 
  window.initSelects();
};

window.openDetalleAuto = (id) => { 
  window.state.selectedAutoId = id; 
  window.state.daActiveSection = 'crm'; 
  window.state.isVentaMode = false; 
  window.state.ventaData.tienePermuta = false; 
  window.renderDetalleAuto(); 
  window.openModal('modal-detalle-auto'); 
};

window.switchDASection = (s) => { 
  window.state.daActiveSection = s; 
  window.renderDetalleAuto(); 
};

window.toggleDoc = async (id, k) => { 
  const a = window.state.autos.find(x => x.id === id); 
  const docs = a.documentacion; 
  docs[k] = !docs[k]; 
  await window.fbUpdate("autos", id, { documentacion: docs }); 
  window.renderDetalleAuto(); 
};

window.openModalIngreso = (id) => {
  window.state.pendingIngresoAutoId = id; 
  document.getElementById('ingreso-precio').value = ''; 
  document.getElementById('ingreso-aviso-gastos').classList.add('hidden'); 
  document.getElementById('btn-ingreso-gastos').classList.add('hidden'); 
  window.closeModal('modal-detalle-auto'); 
  window.openModal('modal-ingreso-auto');
};

window.confirmarIngresoAuto = async () => { 
  const p = Number(document.getElementById('ingreso-precio').value); 
  if(p > 0) { 
    await window.fbUpdate("autos", window.state.pendingIngresoAutoId, { estado: 'Disponible', precio: p }); 
    document.getElementById('ingreso-aviso-gastos').classList.remove('hidden'); 
    document.getElementById('btn-ingreso-gastos').classList.remove('hidden'); 
  } else { 
    alert("Debe establecer un precio mayor a 0."); 
  } 
};

window.abrirCajaParaGastos = () => { 
  window.closeModal('modal-ingreso-auto'); 
  window.switchTab('caja'); 
  window.openModal('modal-caja'); 
  setTimeout(() => { 
    document.getElementById('caja-auto').value = window.state.pendingIngresoAutoId; 
    document.getElementById('caja-tipo').value = 'gasto'; 
  }, 500); 
};

// --- CONTROLADORES DE CIERRE DE VENTA ---
window.handleDAVentaSubmit = async (e, autoId) => {
  e.preventDefault(); 
  
  const auto = window.state.autos.find(x => x.id === autoId);
  const userQueRegistra = window.state.currentUser; 
  
  const vEf = document.getElementById('chk-efectivo')?.checked ? Number(document.getElementById('val-efectivo').value) : 0;
  const vCr = document.getElementById('chk-credito')?.checked ? Number(document.getElementById('val-credito').value) : 0;
  const vPa = document.getElementById('chk-pagare')?.checked ? Number(document.getElementById('val-pagare').value) : 0;
  const vPe = window.state.ventaData.tienePermuta ? Number(document.getElementById('p-valor').value) : 0;
  
  const tVenta = vEf + vCr + vPa + vPe;

  if(tVenta <= 0) {
    return alert("Debe especificar al menos una forma de pago válida o recibir permuta para cerrar la venta.");
  }

  const fDate = new Date().toISOString().split('T')[0];

  if(vEf > 0) {
    await window.fbAdd("transacciones", { 
      fecha: fDate, 
      descripcion: `Cobro Venta: ${auto.marca} ${auto.modelo} (${document.getElementById('nota-efectivo').value||'Efectivo'})`, 
      tipo: 'ingreso', 
      categoria: 'Venta Vehículos', 
      valor: vEf, 
      userId: userQueRegistra.id, 
      sucursalId: userQueRegistra.sucursalId, 
      tipoComprobante: 'X', 
      numComprobante: '',
      iva: 0, 
      estadoCobro: 'disponible', 
      fechaAcreditacion: null 
    });
  }
  
  if(vCr > 0) {
    await window.fbAdd("transacciones", { 
      fecha: fDate, 
      descripcion: `Cobro Crédito: ${auto.marca} ${auto.modelo} (${document.getElementById('nota-credito').value||'-'})`, 
      tipo: 'ingreso', 
      categoria: 'Venta Vehículos', 
      valor: vCr, 
      userId: userQueRegistra.id, 
      sucursalId: userQueRegistra.sucursalId, 
      tipoComprobante: 'X', 
      numComprobante: '',
      iva: 0, 
      estadoCobro: 'pendiente', 
      fechaAcreditacion: document.getElementById('venc-credito').value 
    });
  }
  
  if(vPa > 0) {
    await window.fbAdd("transacciones", { 
      fecha: fDate, 
      descripcion: `Cobro Pagaré: ${auto.marca} ${auto.modelo} (${document.getElementById('nota-pagare').value||'-'})`, 
      tipo: 'ingreso', 
      categoria: 'Venta Vehículos', 
      valor: vPa, 
      userId: userQueRegistra.id, 
      sucursalId: userQueRegistra.sucursalId, 
      tipoComprobante: 'X', 
      numComprobante: '',
      iva: 0, 
      estadoCobro: 'pendiente', 
      fechaAcreditacion: document.getElementById('venc-pagare').value 
    });
  }

  let metodos = [];
  if(vEf > 0) metodos.push('Efectivo');
  if(vCr > 0) metodos.push('Crédito');
  if(vPa > 0) metodos.push('Pagaré');
  if(vPe > 0) metodos.push('Permuta');
  
  const cuotas = Math.max(Number(document.getElementById('cuotas-credito')?.value||0), Number(document.getElementById('cuotas-pagare')?.value||0));

  await window.fbAdd("ventas", {
    fecha: fDate, 
    autoDesc: `${auto.marca} ${auto.modelo} (${auto.patente})`,
    compradorNombre: document.getElementById('vent-comp-nombre').value, 
    compradorTelefono: document.getElementById('vent-comp-tel').value,
    compradorDNI: document.getElementById('vent-comp-dni').value,
    compradorDomicilio: document.getElementById('vent-comp-domicilio').value,
    montoTotal: tVenta, 
    metodoPago: metodos.join(' + '), 
    cuotasTotales: cuotas, 
    cuotasPagadas: 0, 
    tienePermuta: window.state.ventaData.tienePermuta,
    detallePermuta: window.state.ventaData.tienePermuta ? `${document.getElementById('p-marca').value} ${document.getElementById('p-modelo').value}` : null
  });

  if(window.state.ventaData.tienePermuta) {
    await window.fbAdd("autos", { 
      marca: document.getElementById('p-marca').value, 
      modelo: document.getElementById('p-modelo').value, 
      color: document.getElementById('p-color').value, 
      km: Number(document.getElementById('p-km').value||0),
      año: Number(document.getElementById('p-anio').value), 
      patente: document.getElementById('p-pat').value.toUpperCase(), 
      precio: 0, 
      costo: vPe, 
      condicion: document.getElementById('p-condicion').value, 
      estado: 'A Ingresar', 
      sucursalId: auto.sucursalId, 
      gastos: [], 
      documentacion: {c08: false, verificacion: false, libreDeuda: false, vtv: ''} 
    });
  }
  
  await window.fbUpdate("autos", autoId, { estado: 'Vendido' }); 
  
  window.state.tempFormData = {
    auto: auto,
    comprador: document.getElementById('vent-comp-nombre').value, 
    telefono: document.getElementById('vent-comp-tel').value, 
    dni: document.getElementById('vent-comp-dni').value, 
    domicilio: document.getElementById('vent-comp-domicilio').value,
    monto: tVenta, 
    efectivo: vEf, 
    saldo: vCr + vPa, 
    cuotas: cuotas, 
    valCuota: '',
    permuta: window.state.ventaData.tienePermuta ? { 
      marca: document.getElementById('p-marca').value, 
      modelo: document.getElementById('p-modelo').value, 
      anio: document.getElementById('p-anio').value, 
      patente: document.getElementById('p-pat').value.toUpperCase(), 
      tasado: document.getElementById('p-valor').value 
    } : null
  };

  window.closeModal('modal-detalle-auto'); 
  
  document.getElementById('btn-go-to-boleto').onclick = () => {
     window.closeModal('modal-confirm-boleto');
     window.switchTab('formularios'); 
     window.openModalBoleto(window.state.ventaData.tienePermuta ? 'permuta' : 'simple', window.state.tempFormData);
  };
  
  window.openModal('modal-confirm-boleto');
};

window.generarBoletoDesdeVendido = (autoId) => {
  const a = window.state.autos.find(x => x.id === autoId); 
  const v = window.state.ventas.find(venta => venta.autoDesc.includes(a.patente));
  
  const prefillData = { 
    auto: a, 
    comprador: v ? v.compradorNombre : '', 
    dni: v ? v.compradorDNI : '', 
    domicilio: v ? v.compradorDomicilio : '', 
    monto: v ? v.montoTotal : a.precio, 
    efectivo: v ? v.montoTotal : a.precio 
  };
  
  window.closeModal('modal-detalle-auto'); 
  window.switchTab('formularios'); 
  window.openModalBoleto(v && v.tienePermuta ? 'permuta' : 'simple', prefillData);
};

window.registrarCuotaVenta = async (id) => { 
  const v = window.state.ventas.find(x => x.id === id); 
  if(v && (v.cuotasPagadas || 0) < (v.cuotasTotales || 0)) { 
    await window.fbUpdate("ventas", id, { cuotasPagadas: (v.cuotasPagadas || 0) + 1 }); 
    window.closeModal('modal-detalle-venta'); 
  } 
};

// --- CRM GLOBALES ---
window.handleGlobalLeadSubmit = async (e) => { 
  e.preventDefault(); 
  await window.fbAdd("consultas", { 
    autoId: null, 
    nombre: document.getElementById('gl-nombre').value, 
    telefono: document.getElementById('gl-tel').value, 
    marcaInteres: document.getElementById('gl-interes').value, 
    estadoLead: document.getElementById('gl-estado').value, 
    notas: document.getElementById('gl-nota').value, 
    recordatorio: new Date().toISOString().split('T')[0], 
    fecha: new Date().toISOString().split('T')[0] 
  }); 
  window.closeModal('modal-nuevo-lead'); 
  e.target.reset(); 
};

window.handleDA_CRMSubmit = async (e, autoId) => { 
  e.preventDefault(); 
  const a = window.state.autos.find(x => x.id === autoId);
  await window.fbAdd("consultas", { 
    autoId: autoId, 
    marcaInteres: a.marca, 
    nombre: document.getElementById('dac-nombre').value, 
    telefono: document.getElementById('dac-tel').value, 
    notas: document.getElementById('dac-nota').value, 
    estadoLead: 'Tibio', 
    recordatorio: new Date().toISOString().split('T')[0], 
    fecha: new Date().toISOString().split('T')[0] 
  }); 
  document.getElementById('dac-nombre').value = ''; 
  document.getElementById('dac-tel').value = ''; 
  document.getElementById('dac-nota').value = '';
};

// --- COMISIONES Y PERSONAL ---
window.openModalAsignarBono = () => { 
  document.getElementById('form-comision').reset(); 
  document.getElementById('comision-venta-id').value = ""; 
  window.openModal('modal-comision'); 
};

window.openModalComisionPorVenta = (ventaId) => { 
  document.getElementById('form-comision').reset(); 
  document.getElementById('comision-venta-id').value = ventaId; 
  window.openModal('modal-comision'); 
};

window.handleComisionSubmit = async (e) => {
  e.preventDefault();
  const uId = document.getElementById('comision-user').value;
  const monto = Number(document.getElementById('comision-monto').value);
  const vId = document.getElementById('comision-venta-id').value;
  
  if(!uId || monto <= 0) return alert("Complete los datos correctamente.");
  
  await window.fbAdd("comisiones", { 
    userId: uId, 
    ventaId: vId || null, 
    monto: monto, 
    estado: 'Pendiente', 
    fecha: new Date().toISOString().split('T')[0] 
  });
  
  window.closeModal('modal-comision'); 
  alert("Comisión/Bono asignado correctamente.");
};

window.openModalCerrarPagos = () => { 
  window.openModal('modal-cerrar-pagos'); 
};

window.calcularTotalPagos = () => {
  const pdtes = window.state.comisiones.filter(c => c.estado === 'Pendiente');
  const tot = pdtes.reduce((a,c) => a + c.monto, 0);
  document.getElementById('monto-total-liquidar').innerText = window.formatMoney(tot);
};

window.confirmarCierrePagos = async () => {
  const pdtes = window.state.comisiones.filter(c => c.estado === 'Pendiente');
  const tot = pdtes.reduce((a,c) => a + c.monto, 0);
  
  if(tot <= 0) { 
    window.closeModal('modal-cerrar-pagos'); 
    return alert("No hay comisiones pendientes de pago."); 
  }
  
  const fDate = new Date().toISOString().split('T')[0];
  const adminUsr = window.state.usuarios.find(u => u.rol === 'Admin') || window.state.currentUser;
  
  await window.fbAdd("transacciones", { 
    fecha: fDate, 
    descripcion: `Liquidación de Personal (Cierre de Pagos)`, 
    tipo: 'gasto', 
    categoria: 'Liquidación Personal', 
    valor: tot, 
    userId: adminUsr.id, 
    sucursalId: adminUsr.sucursalId, 
    tipoComprobante: 'X', 
    numComprobante: '', 
    iva: 0, 
    estadoCobro: 'disponible' 
  });
  
  for(let p of pdtes) { 
    await window.fbUpdate("comisiones", p.id, { estado: 'Pagada', fechaPago: fDate }); 
  }
  
  window.closeModal('modal-cerrar-pagos'); 
  alert("Pagos liquidados. Se generó el egreso en Caja automáticamente.");
};

window.handleCajaSubmit = async (e) => {
  e.preventDefault(); 
  
  const f = document.getElementById('caja-fecha').value; 
  const t = document.getElementById('caja-tipo').value; 
  const d = document.getElementById('caja-desc').value; 
  const c = document.getElementById('caja-cat').value; 
  const v = Number(document.getElementById('caja-monto').value); 
  const a = document.getElementById('caja-auto').value || null; 
  const compTipo = document.getElementById('caja-comprobante').value; 
  const compNum = document.getElementById('caja-comp-num').value; 
  const iva = Number(document.getElementById('caja-iva').value || 0);
  
  await window.fbAdd("transacciones", { 
    userId: window.state.currentUser.id, 
    sucursalId: window.state.currentUser.sucursalId, 
    fecha: f, 
    tipo: t, 
    descripcion: d, 
    categoria: c, 
    valor: v, 
    autoId: a, 
    tipoComprobante: compTipo, 
    numComprobante: compNum, 
    iva: iva, 
    estadoCobro: 'disponible' 
  });
  
  if(a && t === 'gasto') { 
    const auto = window.state.autos.find(x => x.id === a); 
    const nwGastos = [...(auto.gastos || []), { 
      id: window.generateId(), 
      fecha: f, 
      descripcion: d, 
      categoria: c, 
      monto: v 
    }]; 
    await window.fbUpdate("autos", a, { gastos: nwGastos }); 
  }
  
  window.closeModal('modal-caja'); 
  e.target.reset(); 
  window.initSelects();
};
