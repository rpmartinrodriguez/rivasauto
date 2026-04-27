// ==========================================
// js/controllers.js
// ==========================================

// --- PERSISTENCIA Y UTILIDADES ---
document.addEventListener("DOMContentLoaded", () => {
  const savedView = localStorage.getItem('autosViewMode');
  if (savedView && window.state) {
    window.state.autosViewMode = savedView;
  }
});

// Helper para animar botones y evitar doble click
window.setBtnLoader = (btn, isLoading) => {
  if(!btn) return;
  if(isLoading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto"></i>';
    btn.disabled = true;
    btn.classList.add('opacity-75', 'cursor-not-allowed');
  } else {
    btn.innerHTML = btn.dataset.originalHtml;
    btn.disabled = false;
    btn.classList.remove('opacity-75', 'cursor-not-allowed');
  }
  if(window.lucide) window.lucide.createIcons();
};

// --- CONTROLADORES DE FLOTA Y AUTOS ---
window.toggleAutosViewMode = (mode) => { 
  window.state.autosViewMode = mode; 
  localStorage.setItem('autosViewMode', mode); 
  if (window.renderAutosView) window.renderAutosView(); 
};

window.openModalCreateAuto = () => { 
  window.state.editingAutoId = null; 
  document.getElementById('form-auto').reset(); 
  document.getElementById('modal-auto-title').innerText = "Alta Vehículo"; 
  window.openModal('modal-auto'); 
};

window.editAuto = (id) => { 
  const a = window.state.autos.find(x => x.id === id); 
  window.state.editingAutoId = id; 
  document.getElementById('auto-marca').value = a.marca; 
  document.getElementById('auto-modelo').value = a.modelo; 
  document.getElementById('auto-color').value = a.color || ''; 
  document.getElementById('auto-km').value = a.km || ''; 
  document.getElementById('auto-anio').value = a.año; 
  document.getElementById('auto-patente').value = a.patente; 
  document.getElementById('auto-precio').value = a.precio; 
  document.getElementById('auto-costo').value = a.costo || 0; 
  document.getElementById('auto-condicion').value = a.condicion || 'Propio'; 
  document.getElementById('auto-sucursal').value = a.sucursalId; 
  document.getElementById('modal-auto-title').innerText = "Editar Vehículo"; 
  window.closeModal('modal-detalle-auto'); 
  window.openModal('modal-auto'); 
};

window.deleteAuto = async (id) => { 
  if(confirm('¿Estás seguro de eliminar este vehículo de manera permanente?')) { 
    await window.fbDelete("autos", id); 
    window.closeModal('modal-detalle-auto'); 
  } 
};

window.handleAutoSubmit = async (e) => {
  e.preventDefault();
  const btn = document.getElementById('modal-auto-submit');
  window.setBtnLoader(btn, true);
  
  try {
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
  } finally {
    window.setBtnLoader(btn, false);
  }
};

window.openDetalleAuto = (id) => { 
  window.state.selectedAutoId = id; 
  window.state.daActiveSection = 'crm'; 
  window.state.isVentaMode = false; 
  window.state.ventaData.tienePermuta = false; 
  if(window.renderDetalleAuto) window.renderDetalleAuto(); 
  window.openModal('modal-detalle-auto'); 
};

window.switchDASection = (s) => { 
  window.state.daActiveSection = s; 
  if(window.renderDetalleAuto) window.renderDetalleAuto(); 
};

window.toggleDoc = async (id, k) => { 
  const a = window.state.autos.find(x => x.id === id); 
  const docs = a.documentacion; 
  docs[k] = !docs[k]; 
  await window.fbUpdate("autos", id, { documentacion: docs }); 
  if(window.renderDetalleAuto) window.renderDetalleAuto(); 
};

window.openModalIngreso = (id) => {
  window.state.pendingIngresoAutoId = id; 
  document.getElementById('ingreso-precio').value = ''; 
  document.getElementById('ingreso-aviso-gastos').classList.add('hidden'); 
  document.getElementById('btn-ingreso-gastos').classList.add('hidden'); 
  window.closeModal('modal-detalle-auto'); 
  window.openModal('modal-ingreso-auto');
};

window.confirmarIngresoAuto = async (event) => { 
  const p = Number(document.getElementById('ingreso-precio').value); 
  const btn = event.target;
  
  if(p > 0) { 
    window.setBtnLoader(btn, true);
    try {
      await window.fbUpdate("autos", window.state.pendingIngresoAutoId, { estado: 'Disponible', precio: p }); 
      document.getElementById('ingreso-aviso-gastos').classList.remove('hidden'); 
      document.getElementById('btn-ingreso-gastos').classList.remove('hidden'); 
    } finally {
      window.setBtnLoader(btn, false);
    }
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

// --- CONTROLADORES DE ADMINISTRACIÓN (SUCURSALES Y USUARIOS) ---
window.handleSaveSucursal = async (e) => { 
  e.preventDefault(); 
  const btn = document.getElementById('new-suc-submit');
  window.setBtnLoader(btn, true);
  
  try {
    const n = document.getElementById('new-suc-name').value; 
    if(window.state.editingSucursalId) { 
      await window.fbUpdate("sucursales", window.state.editingSucursalId, { nombre: n }); 
    } else { 
      await window.fbAdd("sucursales", { nombre: n }); 
    } 
    window.resetSucForm(); 
  } finally {
    window.setBtnLoader(btn, false);
  }
};

window.editSucursal = (id) => { 
  window.state.editingSucursalId = id; 
  document.getElementById('new-suc-name').value = window.state.sucursales.find(s => s.id === id).nombre; 
  document.getElementById('new-suc-cancel').classList.remove('hidden'); 
};

window.deleteSucursal = async (id) => { 
  if(confirm('¿Estás seguro de eliminar esta sucursal permanentemente?')) { 
    await window.fbDelete("sucursales", id); 
  } 
};

window.resetSucForm = () => { 
  window.state.editingSucursalId = null; 
  document.getElementById('new-suc-name').value = ''; 
  document.getElementById('new-suc-cancel').classList.add('hidden'); 
};

window.handleSaveUser = async (e) => { 
  e.preventDefault(); 
  const btn = document.getElementById('new-user-submit');
  window.setBtnLoader(btn, true);
  
  try {
    const n = document.getElementById('new-user-name').value; 
    const em = document.getElementById('new-user-email').value; 
    const r = document.getElementById('new-user-rol').value; 
    const s = document.getElementById('new-user-suc').value; 
    const p = document.getElementById('new-user-pwd').value; 
    
    if(window.state.editingUserId) { 
      const d = { nombre: n, email: em, rol: r, sucursalId: s }; 
      if(p) { 
        d.password = p; 
        d.isFirstLogin = true; 
      } 
      await window.fbUpdate("usuarios", window.state.editingUserId, d); 
    } else { 
      await window.fbAdd("usuarios", { 
        nombre: n, 
        email: em, 
        rol: r, 
        sucursalId: s, 
        password: p, 
        isFirstLogin: true 
      }); 
    } 
    window.resetUserForm(); 
  } finally {
    window.setBtnLoader(btn, false);
  }
};

window.editUser = (id) => { 
  window.state.editingUserId = id; 
  const u = window.state.usuarios.find(x => x.id === id); 
  document.getElementById('new-user-name').value = u.nombre; 
  document.getElementById('new-user-email').value = u.email; 
  document.getElementById('new-user-rol').value = u.rol; 
  document.getElementById('new-user-suc').value = u.sucursalId; 
  document.getElementById('new-user-pwd').required = false; 
  document.getElementById('new-user-cancel').classList.remove('hidden'); 
};

window.deleteUser = async (id) => { 
  if(id === window.state.currentUser.id) {
    return alert('No puedes eliminar tu propio usuario mientras tienes la sesión iniciada.'); 
  }
  if(confirm('¿Deseas eliminar este usuario del sistema de forma permanente?')) { 
    await window.fbDelete("usuarios", id); 
  } 
};

window.resetUserForm = () => { 
  window.state.editingUserId = null; 
  document.getElementById('new-user-name').value = ''; 
  document.getElementById('new-user-email').value = ''; 
  document.getElementById('new-user-pwd').value = ''; 
  document.getElementById('new-user-pwd').required = true; 
  document.getElementById('new-user-cancel').classList.add('hidden'); 
};

// --- CONTROLADORES DE CAJA ---
window.agregarCategoria = async () => { 
  const n = prompt('Ingrese el nombre de la nueva categoría (ej. Gastos de Gestoría):'); 
  if (n && n.trim() !== '') { 
    window.state.categoriasGasto.push(n.trim()); 
    window.initSelects(); 
  } 
};

window.handleComprobanteChange = (val) => { 
  const c = document.getElementById('caja-iva-container'); 
  const i = document.getElementById('caja-iva'); 
  if(val === 'A') { 
    c.classList.remove('hidden'); 
    i.required = true; 
  } else { 
    c.classList.add('hidden'); 
    i.required = false; 
    i.value = ''; 
  } 
};

window.marcarCobrado = async (id) => { 
  await window.fbUpdate("transacciones", id, { estadoCobro: 'disponible' }); 
  window.closeModal('modal-pendientes'); 
};

window.handleCajaSubmit = async (e) => {
  e.preventDefault(); 
  const btn = e.submitter;
  window.setBtnLoader(btn, true);
  
  try {
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
  } finally {
    window.setBtnLoader(btn, false);
  }
};

window.cobrarCuotaVenta = async (ventaId, tipo) => {
  const v = window.state.ventas.find(x => x.id === ventaId);
  if(!v) return;

  const userQueRegistra = window.state.currentUser;
  let monto = 0;
  let cuotaNum = 0;
  let updateData = {};

  if(tipo === 'credito' && v.credito) {
    monto = v.credito.valorCuota;
    cuotaNum = v.credito.pagadas + 1;
    const updatedCredito = { ...v.credito, pagadas: cuotaNum };
    updateData = { credito: updatedCredito };
  } else if (tipo === 'pagare' && v.pagare) {
    monto = v.pagare.valorCuota;
    cuotaNum = v.pagare.pagadas + 1;
    const updatedPagare = { ...v.pagare, pagadas: cuotaNum };
    updateData = { pagare: updatedPagare };
  }

  if(monto > 0) {
    const fDate = new Date().toISOString().split('T')[0];
    
    // El botón recibe disable temporalmente por ID dinámico para la carga visual
    const btnId = tipo === 'credito' ? `btn-txt-credito-${ventaId}` : `btn-txt-pagare-${ventaId}`;
    const btnEl = document.getElementById(btnId)?.parentElement;
    if(btnEl) window.setBtnLoader(btnEl, true);

    try {
      await window.fbAdd("transacciones", { 
        fecha: fDate, 
        descripcion: `Cobro Cuota ${cuotaNum} (${tipo === 'credito' ? 'Crédito' : 'Pagaré'}): ${v.compradorNombre} - ${v.autoDesc}`, 
        tipo: 'ingreso', 
        categoria: 'Venta Vehículos', 
        valor: monto, 
        userId: userQueRegistra.id, 
        sucursalId: userQueRegistra.sucursalId, 
        tipoComprobante: 'X', 
        numComprobante: '',
        iva: 0, 
        estadoCobro: 'disponible', 
        fechaAcreditacion: null 
      });
  
      await window.fbUpdate("ventas", ventaId, updateData);
      window.closeModal('modal-pendientes');
      alert(`Cuota ${cuotaNum} cobrada con éxito e ingresada a la caja.`);
    } finally {
      if(btnEl) window.setBtnLoader(btnEl, false);
    }
  }
};

// --- CONTROLADORES DE FORMULARIOS (BOLETOS Y FLOTA) ---
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
    observaciones: document.getElementById('bf-obs').value,
    estado: 'Completado' 
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
  const formId = window.state.tempFormData.id;

  window.state.tempFormData = { ...baseData, autoIdAsociado: autoId, id: formId };
  
  if (autoId || formId) { 
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
  
  if (data.id) {
    const copyData = {...data};
    delete copyData.id; 
    await window.fbUpdate("formularios", data.id, copyData);
  } else {
    await window.fbAdd("formularios", data);
  }
  
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
        <li>Motor N°: ${data.motor || '___________'}</li>
        <li>Chasis N°: ${data.chasis || '___________'}</li>
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
      Año: ${data.año} Motor: ${data.motor || '___________'} Nro. serie o chasis: ${data.chasis || '___________'}<br>
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
    if(window.renderFormulariosView) window.renderFormulariosView(); 
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

// --- CONTROLADORES DE CIERRE DE VENTA MAESTRO ---
window.handleDAVentaSubmit = async (e, autoId) => {
  e.preventDefault(); 
  const btn = e.submitter || document.getElementById('txt-submit-venta')?.parentElement;
  window.setBtnLoader(btn, true);
  
  try {
    const auto = window.state.autos.find(x => x.id === autoId);
    const userQueRegistra = window.state.currentUser; 
    
    const vEf = document.getElementById('chk-efectivo')?.checked ? Number(document.getElementById('val-efectivo').value) : 0;
    
    const vCr = document.getElementById('chk-credito')?.checked ? Number(document.getElementById('val-credito').value) : 0;
    const cCr = Number(document.getElementById('cuotas-credito')?.value || 0);
    
    const vPa = document.getElementById('chk-pagare')?.checked ? Number(document.getElementById('val-pagare').value) : 0;
    const cPa = Number(document.getElementById('cuotas-pagare')?.value || 0);
    
    const vPe = window.state.ventaData.tienePermuta ? Number(document.getElementById('p-valor').value) : 0;
    
    const tVenta = vEf + vCr + vPa + vPe;

    if(tVenta <= 0) {
      return alert("Debe especificar al menos una forma de pago válida o recibir permuta para cerrar la venta.");
    }

    const fDate = new Date().toISOString().split('T')[0];

    // 1. Efectivo Inmediato a Caja
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

    // 2. Preparar Objetos de Cuotas
    let objCredito = null;
    if (vCr > 0 && cCr > 0) {
      objCredito = {
        montoTotal: vCr,
        cuotas: cCr,
        pagadas: 0,
        valorCuota: vCr / cCr
      };
    }
    
    let objPagare = null;
    if (vPa > 0 && cPa > 0) {
      objPagare = {
        montoTotal: vPa,
        cuotas: cPa,
        pagadas: 0,
        valorCuota: vPa / cPa
      };
    }

    // 3. Registro Histórico de la Venta
    let metodos = [];
    if(vEf > 0) metodos.push('Efectivo');
    if(vCr > 0) metodos.push('Crédito');
    if(vPa > 0) metodos.push('Pagaré');
    if(vPe > 0) metodos.push('Permuta');
    
    await window.fbAdd("ventas", {
      fecha: fDate, 
      autoDesc: `${auto.marca} ${auto.modelo} (${auto.patente})`,
      compradorNombre: document.getElementById('vent-comp-nombre').value, 
      compradorTelefono: document.getElementById('vent-comp-tel').value,
      compradorDNI: document.getElementById('vent-comp-dni').value,
      compradorDomicilio: document.getElementById('vent-comp-domicilio').value,
      montoTotal: tVenta, 
      metodoPago: metodos.join(' + '), 
      credito: objCredito,
      pagare: objPagare,
      userId: userQueRegistra.id,
      sucursalId: userQueRegistra.sucursalId,
      tienePermuta: window.state.ventaData.tienePermuta,
      detallePermuta: window.state.ventaData.tienePermuta ? `${document.getElementById('p-marca').value} ${document.getElementById('p-modelo').value}` : null
    });

    // 4. Alta de Auto Recibido en Permuta
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
    
    // 5. Marcar Auto actual como Vendido
    await window.fbUpdate("autos", autoId, { estado: 'Vendido' }); 
    
    // 6. FLUJO AUTOMATIZADO: Crear Borrador del Boleto en DB
    const cuotasMax = Math.max(cCr, cPa);
    const boletoData = {
      tipo: window.state.ventaData.tienePermuta ? 'Boleto Venta con Permuta' : 'Boleto Compra Venta',
      fecha: fDate,
      vendedor: 'RIVAS AUTO',
      comprador: document.getElementById('vent-comp-nombre').value,
      dni: document.getElementById('vent-comp-dni').value,
      domicilio: document.getElementById('vent-comp-domicilio').value,
      marca: auto.marca,
      modelo: auto.modelo,
      año: auto.año,
      dominio: auto.patente,
      motor: '',
      chasis: '',
      monto: tVenta,
      observaciones: '',
      estado: 'Pendiente', 
      autoIdAsociado: autoId
    };

    if (window.state.ventaData.tienePermuta) {
      boletoData.telefono = document.getElementById('vent-comp-tel').value;
      boletoData.efectivo = vEf;
      boletoData.p_marca = document.getElementById('p-marca').value;
      boletoData.p_modelo = document.getElementById('p-modelo').value;
      boletoData.p_anio = document.getElementById('p-anio').value;
      boletoData.p_dominio = document.getElementById('p-pat').value.toUpperCase();
      boletoData.p_tasado = vPe;
      boletoData.saldo = vCr + vPa;
      boletoData.cuotas = cuotasMax;
      boletoData.valCuota = '';
    } else {
      boletoData.formaPago = metodos.join(' + ');
    }

    await window.fbAdd("formularios", boletoData);

    // 7. Enrutamiento directo a la sección Formularios
    window.closeModal('modal-detalle-auto'); 
    window.switchTab('formularios');
    
  } finally {
    window.setBtnLoader(btn, false);
  }
};


// --- CRM GLOBALES Y DE AUTO ---
window.handleGlobalLeadSubmit = async (e) => { 
  e.preventDefault(); 
  const btn = e.submitter;
  window.setBtnLoader(btn, true);
  
  try {
    await window.fbAdd("consultas", { 
      autoId: null, 
      nombre: document.getElementById('gl-nombre').value, 
      telefono: document.getElementById('gl-tel').value, 
      marcaInteres: document.getElementById('gl-interes').value, 
      estadoLead: document.getElementById('gl-estado').value, 
      notas: document.getElementById('gl-nota').value, 
      recordatorio: new Date().toISOString().split('T')[0], 
      fecha: new Date().toISOString().split('T')[0],
      userId: window.state.currentUser.id,
      sucursalId: window.state.currentUser.sucursalId
    }); 
    window.closeModal('modal-nuevo-lead'); 
    e.target.reset(); 
  } finally {
    window.setBtnLoader(btn, false);
  }
};

window.handleDA_CRMSubmit = async (e, autoId) => { 
  e.preventDefault(); 
  const btn = e.submitter || document.getElementById('txt-submit-lead-auto')?.parentElement;
  window.setBtnLoader(btn, true);
  
  try {
    const a = window.state.autos.find(x => x.id === autoId);
    await window.fbAdd("consultas", { 
      autoId: autoId, 
      marcaInteres: a.marca, 
      nombre: document.getElementById('dac-nombre').value, 
      telefono: document.getElementById('dac-tel').value, 
      notas: document.getElementById('dac-nota').value, 
      estadoLead: 'Tibio', 
      recordatorio: new Date().toISOString().split('T')[0], 
      fecha: new Date().toISOString().split('T')[0],
      userId: window.state.currentUser.id,
      sucursalId: window.state.currentUser.sucursalId
    }); 
    document.getElementById('dac-nombre').value = ''; 
    document.getElementById('dac-tel').value = ''; 
    document.getElementById('dac-nota').value = '';
    
    if(window.renderDetalleAuto) window.renderDetalleAuto();
  } finally {
    window.setBtnLoader(btn, false);
  }
};

// --- COMISIONES Y PERSONAL (CARGA MANUAL Y CIERRE) ---
window.openModalAsignarBono = () => { 
  document.getElementById('form-comision').reset(); 
  document.getElementById('comision-venta-id').value = ""; 
  window.openModal('modal-comision'); 
};

window.handleComisionSubmit = async (e) => {
  e.preventDefault();
  const btn = e.submitter;
  window.setBtnLoader(btn, true);
  
  try {
    const uId = document.getElementById('comision-user').value;
    const monto = Number(document.getElementById('comision-monto').value);
    const desc = document.getElementById('comision-desc') ? document.getElementById('comision-desc').value : 'Carga Manual';
    const vId = document.getElementById('comision-venta-id').value;
    
    if(!uId || monto <= 0) return alert("Complete los datos correctamente.");
    
    await window.fbAdd("comisiones", { 
      userId: uId, 
      ventaId: vId || null, 
      monto: monto, 
      descripcion: desc,
      estado: 'Pendiente', 
      fecha: new Date().toISOString().split('T')[0] 
    });
    
    window.closeModal('modal-comision'); 
    alert("Carga registrada y asignada correctamente.");
  } finally {
    window.setBtnLoader(btn, false);
  }
};

window.openModalCerrarPagos = () => { 
  window.calcularTotalPagos();
  window.openModal('modal-cerrar-pagos'); 
};

window.calcularTotalPagos = () => {
  const checkboxes = document.querySelectorAll('.cierre-user-checkbox:checked');
  const userIdsSelected = Array.from(checkboxes).map(cb => cb.value);
  
  const pdtes = window.state.comisiones.filter(c => c.estado === 'Pendiente' && userIdsSelected.includes(c.userId));
  const tot = pdtes.reduce((a,c) => a + c.monto, 0);
  
  const ml = document.getElementById('monto-total-liquidar');
  if(ml) ml.innerText = window.formatMoney(tot);
};

window.confirmarCierrePagos = async (event) => {
  const checkboxes = document.querySelectorAll('.cierre-user-checkbox:checked');
  const userIdsSelected = Array.from(checkboxes).map(cb => cb.value);

  const pdtes = window.state.comisiones.filter(c => c.estado === 'Pendiente' && userIdsSelected.includes(c.userId));
  const tot = pdtes.reduce((a,c) => a + c.monto, 0);
  
  if(tot <= 0) { 
    window.closeModal('modal-cerrar-pagos'); 
    return alert("No hay comisiones seleccionadas pendientes de pago."); 
  }
  
  const btn = event.target;
  window.setBtnLoader(btn, true);

  try {
    const fDate = new Date().toISOString().split('T')[0];
    const adminUsr = window.state.usuarios.find(u => u.rol === 'Admin') || window.state.currentUser;
    
    const nuevoCierreData = {
      fecha: fDate,
      cantidadMovimientos: pdtes.length,
      total: tot,
      userId: adminUsr.id
    };
    
    const docRef = await window.fbAdd("cierres_personal", nuevoCierreData);
    const cierreId = docRef ? docRef.id : window.generateId();
    
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
      await window.fbUpdate("comisiones", p.id, { 
        estado: 'Pagada', 
        fechaPago: fDate,
        cierreId: cierreId
      }); 
    }
    
    window.closeModal('modal-cerrar-pagos'); 
    alert("Pagos liquidados con éxito.");
  } finally {
    window.setBtnLoader(btn, false);
  }
};
