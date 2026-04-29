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

window.formatInputMoney = (input) => {
  let val = input.value.replace(/[^0-9]/g, '');
  if(val) {
    val = parseInt(val, 10);
    input.value = new Intl.NumberFormat('es-AR').format(val);
  }
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
  document.getElementById('auto-precio').value = window.formatMoney(a.precio).replace(/[^0-9]/g, ''); 
  document.getElementById('auto-costo').value = window.formatMoney(a.costo || 0).replace(/[^0-9]/g, ''); 
  document.getElementById('auto-condicion').value = a.condicion || 'Propio'; 
  document.getElementById('auto-sucursal').value = a.sucursalId; 
  if (document.getElementById('auto-moneda')) {
    document.getElementById('auto-moneda').value = a.moneda || 'ARS';
  }
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
  e.stopImmediatePropagation();
  
  if (window.state.isSubmittingAuto) return; 
  window.state.isSubmittingAuto = true;

  const btn = document.getElementById('modal-auto-submit');
  if(btn) window.setBtnLoader(btn, true);
  
  try {
    const obj = { 
      marca: document.getElementById('auto-marca').value.toUpperCase(), 
      modelo: document.getElementById('auto-modelo').value.toUpperCase(), 
      color: document.getElementById('auto-color').value.toUpperCase(), 
      km: Number(document.getElementById('auto-km').value), 
      año: Number(document.getElementById('auto-anio').value), 
      patente: document.getElementById('auto-patente').value.toUpperCase(), 
      precio: Number(document.getElementById('auto-precio').value.replace(/[^0-9]/g, '')), 
      costo: Number(document.getElementById('auto-costo').value.replace(/[^0-9]/g, '')), 
      condicion: document.getElementById('auto-condicion').value, 
      sucursalId: document.getElementById('auto-sucursal').value,
      moneda: document.getElementById('auto-moneda') ? document.getElementById('auto-moneda').value : 'ARS'
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
  } catch(error) {
    console.error("Error al guardar auto:", error);
    alert("Hubo un error. Revisa tu conexión a internet.");
  } finally {
    window.state.isSubmittingAuto = false; 
    if(btn) window.setBtnLoader(btn, false);
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
  const p = Number(document.getElementById('ingreso-precio').value.replace(/[^0-9]/g, '')); 
  const btn = event ? event.target : document.querySelector('#modal-ingreso-auto button.bg-black');
  
  if (window.state.isConfirmandoIngreso) return; 
  window.state.isConfirmandoIngreso = true;

  if(p > 0) { 
    if(btn) window.setBtnLoader(btn, true);
    try {
      await window.fbUpdate("autos", window.state.pendingIngresoAutoId, { estado: 'Disponible', precio: p }); 
      document.getElementById('ingreso-aviso-gastos').classList.remove('hidden'); 
      document.getElementById('btn-ingreso-gastos').classList.remove('hidden'); 
    } catch(err) {
      console.error(err);
    } finally {
      if(btn) window.setBtnLoader(btn, false);
      window.state.isConfirmandoIngreso = false;
    }
  } else { 
    alert("Debe establecer un precio mayor a 0."); 
    window.state.isConfirmandoIngreso = false; 
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

window.openModalSeñado = (autoId) => {
  window.state.señaAutoId = autoId;
  document.getElementById('form-seña').reset();
  window.closeModal('modal-detalle-auto');
  window.openModal('modal-señado');
};

window.confirmarSeñado = async (e) => {
  e.preventDefault();
  e.stopImmediatePropagation();
  
  if(window.state.isSubmittingSeña) return;
  window.state.isSubmittingSeña = true;

  const btn = document.querySelector('#form-seña button[type="submit"]');
  if(btn) window.setBtnLoader(btn, true);

  try {
    const autoId = window.state.señaAutoId;
    const clNombre = document.getElementById('s-cliente-nombre').value;
    const clTel = document.getElementById('s-cliente-tel').value;
    
    await window.fbUpdate("autos", autoId, {
      estado: 'Señado',
      señadoPorNombre: window.state.currentUser.nombre,
      señadoPorUserId: window.state.currentUser.id,
      señadoClienteNombre: clNombre,
      señadoClienteTel: clTel
    });

    window.closeModal('modal-señado');
    if(window.renderAutosView) window.renderAutosView();
  } catch(err) {
    console.error(err);
  } finally {
    window.state.isSubmittingSeña = false;
    if(btn) window.setBtnLoader(btn, false);
  }
};

window.quitarSeña = async (autoId) => {
  if(confirm("¿Estás seguro de cancelar la seña? El auto volverá a estar 'Disponible'.")) {
    try {
      await window.fbUpdate("autos", autoId, {
        estado: 'Disponible',
        señadoPorNombre: null,
        señadoPorUserId: null,
        señadoClienteNombre: null,
        señadoClienteTel: null
      });
      window.closeModal('modal-detalle-auto');
      if(window.renderAutosView) window.renderAutosView();
    } catch(err) {
      console.error(err);
    }
  }
};

// --- CONTROLADORES DE ADMINISTRACIÓN ---
window.handleSaveSucursal = async (e) => { 
  e.preventDefault(); 
  e.stopImmediatePropagation();
  
  if (window.state.isSubmittingSucursal) return; 
  window.state.isSubmittingSucursal = true;

  const btn = document.getElementById('new-suc-submit');
  if(btn) window.setBtnLoader(btn, true);
  
  try {
    const n = document.getElementById('new-suc-name').value; 
    if(window.state.editingSucursalId) { 
      await window.fbUpdate("sucursales", window.state.editingSucursalId, { nombre: n }); 
    } else { 
      await window.fbAdd("sucursales", { nombre: n }); 
    } 
    window.resetSucForm(); 
  } finally {
    window.state.isSubmittingSucursal = false;
    if(btn) window.setBtnLoader(btn, false);
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
  e.stopImmediatePropagation();
  
  if (window.state.isSubmittingUser) return;
  window.state.isSubmittingUser = true;

  const btn = document.getElementById('new-user-submit');
  if(btn) window.setBtnLoader(btn, true);
  
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
    window.state.isSubmittingUser = false;
    if(btn) window.setBtnLoader(btn, false);
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
  e.stopImmediatePropagation();
  
  if (window.state.isSubmittingCaja) return; 
  window.state.isSubmittingCaja = true;

  const btn = document.querySelector('#form-caja button[type="submit"]');
  if(btn) window.setBtnLoader(btn, true);
  
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
  } catch(error) {
    console.error(error);
  } finally {
    window.state.isSubmittingCaja = false; 
    if(btn) window.setBtnLoader(btn, false);
  }
};

window.cobrarCuotaVenta = async (ventaId, tipo) => {
  if (window.state.isCobrandoCuota) return; 
  window.state.isCobrandoCuota = true;

  const v = window.state.ventas.find(x => x.id === ventaId);
  if(!v) {
    window.state.isCobrandoCuota = false;
    return;
  }

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
    } catch(e) {
      console.error(e);
    } finally {
      if(btnEl) window.setBtnLoader(btnEl, false);
      window.state.isCobrandoCuota = false; 
    }
  } else {
    window.state.isCobrandoCuota = false;
  }
};

// --- CONTROLADORES DE FORMULARIOS Y BOLETOS ---
window.preGuardarBoleto = (e, tipo) => {
  e.preventDefault();
  e.stopImmediatePropagation();
  
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
  if (window.state.isSubmittingBoleto) return; 
  window.state.isSubmittingBoleto = true;

  const data = { ...window.state.tempFormData };
  const btn = document.querySelector('#form-real-boleto button[type="submit"]') || document.querySelector('#modal-asociar-form button.bg-black');
  
  if(btn) window.setBtnLoader(btn, true);
  
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
  } catch (err) {
    console.error("Error guardando el formulario", err);
  } finally {
    window.state.isSubmittingBoleto = false; 
    if(btn) window.setBtnLoader(btn, false);
  }
};

// --- CONTROLADOR DE VENTA MAESTRO ---
window.handleDAVentaSubmit = async (e, autoId) => {
  e.preventDefault(); 
  e.stopImmediatePropagation();
  
  if (window.state.isSubmittingVenta) return; 
  window.state.isSubmittingVenta = true;

  const btn = document.querySelector('#btn-submit-venta button');
  if(btn) window.setBtnLoader(btn, true);
  
  try {
    const auto = window.state.autos.find(x => x.id === autoId);
    const userQueRegistra = window.state.currentUser; 
    
    const vEf = document.getElementById('chk-efectivo')?.checked ? Number(document.getElementById('val-efectivo').value) : 0;
    const vCr = document.getElementById('chk-credito')?.checked ? Number(document.getElementById('val-credito').value) : 0;
    const cCr = Number(document.getElementById('cuotas-credito')?.value || 0);
    const vPa = document.getElementById('chk-pagare')?.checked ? Number(document.getElementById('val-pagare').value) : 0;
    const cPa = Number(document.getElementById('cuotas-pagare')?.value || 0);
    const vPe = window.state.ventaData.tienePermuta ? Number(document.getElementById('p-valor').value.replace(/[^0-9]/g, '')) : 0;
    
    const tVenta = vEf + vCr + vPa + vPe;

    if(tVenta <= 0) {
      alert("Debe especificar al menos una forma de pago válida o recibir permuta para cerrar la venta.");
      window.state.isSubmittingVenta = false;
      if(btn) window.setBtnLoader(btn, false);
      return;
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
        marca: document.getElementById('p-marca').value.toUpperCase(), 
        modelo: document.getElementById('p-modelo').value.toUpperCase(), 
        color: document.getElementById('p-color').value.toUpperCase(), 
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
    
  } catch(e) {
    console.error(e);
  } finally {
    window.state.isSubmittingVenta = false; 
    if(btn) window.setBtnLoader(btn, false);
  }
};

// --- CRM GLOBALES Y DE AUTO ---
window.handleGlobalLeadSubmit = async (e) => { 
  e.preventDefault(); 
  e.stopImmediatePropagation();
  
  if (window.state.isSubmittingLead) return; 
  window.state.isSubmittingLead = true;

  const btn = document.querySelector('#modal-nuevo-lead form button[type="submit"]');
  if(btn) window.setBtnLoader(btn, true);
  
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
    window.state.isSubmittingLead = false; 
    if(btn) window.setBtnLoader(btn, false);
  }
};

window.handleDA_CRMSubmit = async (e, autoId) => { 
  e.preventDefault(); 
  e.stopImmediatePropagation();
  
  if (window.state.isSubmittingDALead) return; 
  window.state.isSubmittingDALead = true;

  const btn = document.querySelector('#btn-submit-lead-auto button[type="submit"]');
  if(btn) window.setBtnLoader(btn, true);
  
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
    window.state.isSubmittingDALead = false; 
    if(btn) window.setBtnLoader(btn, false);
  }
};

window.handleEditLeadSubmit = async (e, id) => {
  e.preventDefault();
  e.stopImmediatePropagation();
  
  if (window.state.isEditingLead) return; 
  window.state.isEditingLead = true;

  const btn = e.submitter || document.querySelector('#form-edit-lead button[type="submit"]');
  if(btn) window.setBtnLoader(btn, true);
  
  try {
    const nombre = document.getElementById('edit-lead-nombre').value;
    const telefono = document.getElementById('edit-lead-tel').value;
    const notas = document.getElementById('edit-lead-nota').value;
    const estadoLead = document.getElementById('edit-lead-estado') ? document.getElementById('edit-lead-estado').value : 'Tibio';
    
    await window.fbUpdate("consultas", id, {
      nombre,
      telefono,
      notas,
      estadoLead
    });
    
    window.closeModal('modal-detalle-lead');
    if(window.renderClientesView) window.renderClientesView();
    if(window.state.selectedAutoId && window.renderDetalleAuto) window.renderDetalleAuto();
  } catch(err) {
    console.error(err);
  } finally {
    window.state.isEditingLead = false; 
    if(btn) window.setBtnLoader(btn, false);
  }
};

window.deleteLead = async (id) => {
  if(confirm('¿Estás seguro de eliminar permanentemente a este interesado?')) {
    try {
      await window.fbDelete("consultas", id);
      window.closeModal('modal-detalle-lead');
      if(window.renderClientesView) window.renderClientesView();
      if(window.state.selectedAutoId && window.renderDetalleAuto) window.renderDetalleAuto();
    } catch (err) {
      console.error(err);
    }
  }
};

// --- COMISIONES Y PERSONAL ---
window.openModalAsignarBono = () => { 
  document.getElementById('form-comision').reset(); 
  document.getElementById('comision-venta-id').value = ""; 
  window.openModal('modal-comision'); 
};

window.handleComisionSubmit = async (e) => {
  e.preventDefault();
  e.stopImmediatePropagation();
  
  if (window.state.isSubmittingComision) return; 
  window.state.isSubmittingComision = true;

  const btn = document.querySelector('#form-comision button[type="submit"]');
  if(btn) window.setBtnLoader(btn, true);
  
  try {
    const uId = document.getElementById('comision-user').value;
    const monto = Number(document.getElementById('comision-monto').value);
    const desc = document.getElementById('comision-desc') ? document.getElementById('comision-desc').value : 'Carga Manual';
    const vId = document.getElementById('comision-venta-id').value;
    
    if(!uId || monto <= 0) {
      alert("Complete los datos correctamente.");
      window.state.isSubmittingComision = false; 
      if(btn) window.setBtnLoader(btn, false);
      return;
    }
    
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
    window.state.isSubmittingComision = false; 
    if(btn) window.setBtnLoader(btn, false);
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
  if (window.state.isCerrandoPagos) return; 
  window.state.isCerrandoPagos = true;

  const checkboxes = document.querySelectorAll('.cierre-user-checkbox:checked');
  const userIdsSelected = Array.from(checkboxes).map(cb => cb.value);

  const pdtes = window.state.comisiones.filter(c => c.estado === 'Pendiente' && userIdsSelected.includes(c.userId));
  const tot = pdtes.reduce((a,c) => a + c.monto, 0);
  
  if(tot <= 0) { 
    window.closeModal('modal-cerrar-pagos'); 
    window.state.isCerrandoPagos = false; 
    return alert("No hay comisiones seleccionadas pendientes de pago."); 
  }
  
  const btn = event ? event.target : document.querySelector('#modal-cerrar-pagos button.bg-rose-600');
  if(btn) window.setBtnLoader(btn, true);

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
    window.state.isCerrandoPagos = false; 
    if(btn) window.setBtnLoader(btn, false);
  }
};

window.openModalComisionPorVenta = (ventaId) => {
  const v = window.state.ventas.find(x => x.id === ventaId);
  if(!v) return;
  document.getElementById('form-comision').reset(); 
  document.getElementById('comision-venta-id').value = ventaId; 
  document.getElementById('comision-desc').value = `Bono por Venta: ${v.autoDesc}`;
  window.closeModal('modal-detalle-venta');
  window.openModal('modal-comision'); 
};
