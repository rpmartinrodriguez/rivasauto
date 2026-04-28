// ==========================================
// js/controllers.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  const savedView = localStorage.getItem('autosViewMode');
  if (savedView && window.state) {
    window.state.autosViewMode = savedView;
  }
});

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

window.openModalBoleto = (tipo, prefillData = null) => {
  let content = ''; 
  const t = tipo === 'simple' ? 'BOLETO COMPRA VENTA AUTOMOTOR' : 'BOLETO DE VENTA CON PERMUTA'; 
  document.getElementById('boleto-title').innerText = t;

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

window.calcRemanentePermuta = () => {
  const monto = Number(document.getElementById('bf-monto')?.value || 0);
  const tasado = Number(document.getElementById('bp-tasado')?.value || 0);
  const diff = monto - tasado;
  const remInput = document.getElementById('bf-remanente-num');
  if(remInput) remInput.value = window.formatMoney(diff);
};

window.preGuardarBoleto = (e, tipo) => {
  e.preventDefault();
  
  let baseData = {};
  
  if(tipo === 'simple') { 
    baseData = {
      tipo: 'Boleto Compra Venta', 
      fecha: new Date().toISOString().split('T')[0],
      vendedor: document.getElementById('bf-vendedor').value, 
      vendedorDomicilio: document.getElementById('bf-vendedor-domicilio').value, 
      vendedorLoc: document.getElementById('bf-vendedor-loc').value, 
      vendedorTel: document.getElementById('bf-vendedor-tel').value, 
      comprador: document.getElementById('bf-comprador').value, 
      domicilio: document.getElementById('bf-domicilio').value,
      locComp: document.getElementById('bf-loc-comp').value,
      telefono: document.getElementById('bf-telefono').value,
      categoria: document.getElementById('bf-categoria').value,
      marca: document.getElementById('bf-marca').value, 
      modelo: document.getElementById('bf-modelo').value, 
      tipoVehiculo: document.getElementById('bf-tipo').value, 
      año: document.getElementById('bf-anio').value, 
      motor: document.getElementById('bf-motor').value, 
      chasis: document.getElementById('bf-chasis').value, 
      dominio: document.getElementById('bf-dominio').value.toUpperCase(),
      monto: document.getElementById('bf-monto').value, 
      montoLetras: document.getElementById('bf-monto-letras').value, 
      formaPago: document.getElementById('bf-formapago').value,
      diasTransf: document.getElementById('bf-dias-transf').value,
      ciudadFirma: document.getElementById('bf-ciudad-firma').value,
      observaciones: document.getElementById('bf-obs').value,
      estado: 'Completado' 
    };
  } else { 
    baseData = {
      tipo: 'Boleto Venta con Permuta', 
      fecha: new Date().toISOString().split('T')[0],
      vendedor: document.getElementById('bf-vendedor').value, 
      comprador: document.getElementById('bf-comprador').value, 
      dni: document.getElementById('bf-dni').value, 
      telefono: document.getElementById('bf-telefono').value, 
      domicilio: document.getElementById('bf-domicilio').value,
      altura: document.getElementById('bf-altura').value,
      locComp: document.getElementById('bf-loc-comp').value,
      marca: document.getElementById('bf-marca').value, 
      modelo: document.getElementById('bf-modelo').value, 
      año: document.getElementById('bf-anio').value, 
      dominio: document.getElementById('bf-dominio').value.toUpperCase(),
      motor: document.getElementById('bf-motor').value, 
      chasis: document.getElementById('bf-chasis').value, 
      locPat: document.getElementById('bf-loc-pat').value,
      monto: document.getElementById('bf-monto').value, 
      montoLetras: document.getElementById('bf-monto-letras').value, 
      efectivo: document.getElementById('bf-efectivo').value, 
      p_marca: document.getElementById('bp-marca').value, 
      p_modelo: document.getElementById('bp-modelo').value, 
      p_anio: document.getElementById('bp-anio').value, 
      p_dominio: document.getElementById('bp-dominio').value.toUpperCase(), 
      p_motor: document.getElementById('bp-motor').value, 
      p_chasis: document.getElementById('bp-chasis').value, 
      p_locPat: document.getElementById('bp-loc-pat').value,
      p_tasado: document.getElementById('bp-tasado').value, 
      p_tasadoLetras: document.getElementById('bp-tasado-letras').value, 
      remanenteLetras: document.getElementById('bf-remanente-letras').value,
      detalleRemanente: document.getElementById('bf-detalle-remanente').value,
      observaciones: document.getElementById('bf-obs').value,
      estado: 'Completado' 
    };
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
  const btn = document.getElementById('form-real-boleto')?.querySelector('button[type="submit"]') || event?.target;
  window.setBtnLoader(btn, true);
  
  try {
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
  } finally {
    window.setBtnLoader(btn, false);
  }
};

window.imprimirBoletoHtml = (data) => {
  let printHtml = ''; 
  const dateObj = new Date(data.fecha + 'T00:00:00');
  const dia = dateObj.getDate();
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mes = meses[dateObj.getMonth()];
  const anio = dateObj.getFullYear();
  
  if(data.tipo === 'Boleto Compra Venta') {
    printHtml = `
      <h2 class="text-center text-xl font-black mb-8 underline uppercase">BOLETO COMPRA VENTA AUTOMOTOR</h2>
      
      <p class="mb-4 text-justify">Conste por el presente que entre el Señor: <strong>${data.vendedor}</strong> como VENDEDOR y el Señor: <strong>${data.comprador}</strong>, como comprador se conviene lo siguiente:</p>
      
      <p class="mb-4 text-justify">El señor: <strong>${data.vendedor}</strong>, vende un: <strong>${data.categoria}</strong> en las condiciones vistas.<br>
      Marca: <strong>${data.marca}</strong>, Modelo: <strong>${data.modelo}</strong>, Tipo: <strong>${data.tipoVehiculo}</strong>, Año: <strong>${data.año}</strong>, Motor Nro: <strong>${data.motor || '___________'}</strong>, Chasis Nro.: <strong>${data.chasis || '___________'}</strong>, Dominio: <strong>${data.dominio}</strong>.</p>
      
      <p class="mb-4 text-justify">En la suma total de pesos ($): <strong>${data.monto}</strong>, (<strong>${data.montoLetras}</strong>), Pagaderos de la siguiente forma: <strong>${data.formaPago}</strong></p>
      
      <p class="mb-4 text-justify text-sm">Esta unidad se entrega en el estado de uso en que se encuentra y que el comprador declara conocer, al igual que todo lo concerniente a la marca, modelo, números de motor y/o chasis del referido vehículo, que ha sido revisado y constatado y acepta de plena conformidad, haciéndose responsable civil y criminalmente, a partir de la fecha y hora de efectuada esta venta por cualquier accidente, daño y/o perjuicio que pudiera ocasionar el vehículo que es recibido en este acto con su documentación completa y al día. El comprador se compromete a efectuar la correspondiente transferencia de dominio del vehículo dentro de los <strong>${data.diasTransf}</strong> días de la fecha, de acuerdo a lo establecido al respecto por la ley 22.977 y sus normas complementarias, interpretativas y/o complementarias, estando a a su exclusivo cargo la totalidad de los gastos que demande la misma y los tramites y gestiones pertinentes, incluyendo la firma del formulario 08 o el que a tales fines lo subsista y/o reemplace y/o el otorgamiento de los poderes, todos ello en forma directa con el titular dominal. Transcurrido dicho plazo sin que realizara la transferencia el vendedor no se responsabiliza por los inconvenientes de cualquier índole que pudieran existir anteriores o posteriores a la fecha, que imposibilitan la efectivización de dicho tramite, incluyendo embargos y/o prendas o medidas judiciales de cualquier tipo sobre el vehículo, al igual que deudas emergentes de patentes municipales y/o multas. Con absoluta conformidad del Comprador.----------------------------------------------------------------------------------------------------/</p>
      
      <p class="mb-6 text-justify">En <strong>${data.ciudadFirma}</strong> a los <strong>${dia}</strong> dias, del mes de <strong>${mes}</strong> del Año <strong>${anio}</strong>, se firman dos ejemplares del mismo tenor y a un solo efecto.</p>
      
      <p class="mb-8 font-bold text-justify">Observaciones: ${data.observaciones}</p>

      <div class="grid grid-cols-2 gap-8 text-sm mt-8">
        <div>
          <p class="font-bold mb-4">Comprador</p>
          <p>Nombre y Apellido: <strong>${data.comprador}</strong></p>
          <p>Direccion: <strong>${data.domicilio}</strong></p>
          <p>Localidad: <strong>${data.locComp}</strong></p>
          <p>Celular: <strong>${data.telefono}</strong></p>
          <div class="border-t border-black mt-16 pt-2 font-bold w-[80%] text-center">FIRMA:</div>
        </div>
        <div>
          <p class="font-bold mb-4">Vendedor</p>
          <p>Nombre y Apellido: <strong>${data.vendedor}</strong></p>
          <p>Direccion: <strong>${data.vendedorDomicilio}</strong></p>
          <p>Localidad: <strong>${data.vendedorLoc}</strong></p>
          <p>Celular: <strong>${data.vendedorTel}</strong></p>
          <div class="border-t border-black mt-16 pt-2 font-bold w-[80%] text-center">FIRMA:</div>
        </div>
      </div>
    `;
  } else {
    printHtml = `
      <h2 class="text-center text-xl font-black mb-8 underline uppercase">BOLETO DE VENTA CON PERMUTA</h2>
      <p class="mb-4 text-justify">Conste por el presente que hemos vendido a Sr./Sra: <strong>${data.comprador}</strong> con D.N.I: <strong>${data.dni}</strong> y domicilio en calle <strong>${data.domicilio}</strong> Nro.: <strong>${data.altura}</strong> de la localidad de <strong>${data.locComp}</strong> con Celular: <strong>${data.telefono}</strong>.</p>
      
      <p class="mb-4 text-justify">Por cuenta y orden de Sr./Sra. <strong>${data.vendedor}</strong> un automóvil usado, en las condiciones vistas y que se encuentran libre de gravámenes y/o deudas nacionales, municipales o provinciales, dejando constancia que en la fecha el comprador toma posesión del mismo de conformidad, siendo sus características las que se detallan a continuación:</p>
      
      <p class="mb-4 font-bold">Marca: ${data.marca} Modelo: ${data.modelo} Año: ${data.año} Motor: ${data.motor || '___________'}, Nro. serie o chasis: ${data.chasis || '___________'}<br>
      Patentado en la localidad de: ${data.locPat || '___________'} bajo Nro.: ${data.dominio}</p>
      
      <p class="mb-4 text-justify">La venta se realiza por la suma total de ($) <strong>${data.monto}</strong> , (<strong>${data.montoLetras}</strong>); Discriminados en la siguiente manera:<br>
      Efectivo: ($) <strong>${data.efectivo || 0}</strong></p>
      
      <p class="mb-4 text-justify">Se recibe como parte de pago un automovil marca: <strong>${data.p_marca}</strong> Modelo: <strong>${data.p_modelo}</strong> Año: <strong>${data.p_anio}</strong> Motor Nro.: <strong>${data.p_motor || '___________'}</strong> Nro. de serie o chasis: <strong>${data.p_chasis || '___________'}</strong> patentado en la localidad de: <strong>${data.p_locPat || '___________'}</strong>, Nro.: <strong>${data.p_dominio}</strong>, libre de deuda y gravamenes, tasado en la suma de ($): <strong>${data.p_tasado}</strong> , (<strong>${data.p_tasadoLetras}</strong>), debiendo cancelarse el remanente de ($): <strong>${window.formatMoney((Number(data.monto) || 0) - (Number(data.p_tasado) || 0))}</strong> , (<strong>${data.remanenteLetras || '___________'}</strong>).</p>
      
      <p class="mb-6 text-justify uppercase font-bold">${data.detalleRemanente}</p>
      
      <p class="mb-6 text-justify">Y las cuotas restantes a cancelar cada treinta (30) dias, sucesivamente, hasta la cancelacion de la deuda total, cuyo efecto se firma de igual numero de Pagares que representan las cuotas convenidas y prenda con Registro, gravandose con todas las formalidades stablecidas en la Ley Nro. 12.962 el automovil vendido, garantia del saldo deudor.</p>
      
      <p class="mb-4 font-bold text-justify">Observaciones: ${data.observaciones}</p>
      
      <p class="mb-12">En conformidad se forman dos ejemplares del mismo tenor y a un solo efecto, en Gualeguaychu a los ${dia} dias del mes de ${mes} del año ${anio}.</p>
      
      <div class="mt-12 flex justify-between px-16">
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

    let objCredito = null;
    if (vCr > 0 && cCr > 0) {
      objCredito = { montoTotal: vCr, cuotas: cCr, pagadas: 0, valorCuota: vCr / cCr };
    }
    
    let objPagare = null;
    if (vPa > 0 && cPa > 0) {
      objPagare = { montoTotal: vPa, cuotas: cPa, pagadas: 0, valorCuota: vPa / cPa };
    }

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
    
    const cuotasMax = Math.max(cCr, cPa);
    const boletoData = {
      tipo: window.state.ventaData.tienePermuta ? 'Boleto Venta con Permuta' : 'Boleto Compra Venta',
      fecha: fDate,
      vendedor: 'RIVAS AUTO',
      vendedorLoc: 'Gualeguaychú',
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
      boletoData.telefono = document.getElementById('vent-comp-tel').value;
    }

    await window.fbAdd("formularios", boletoData);

    window.closeModal('modal-detalle-auto'); 
    window.switchTab('formularios');
    
  } finally {
    window.setBtnLoader(btn, false);
  }
};

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
