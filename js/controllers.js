// ==========================================
// js/controllers.js
// ==========================================

// Al arrancar, verificamos si el usuario guardó su preferencia de vista (Grid o Lista)
document.addEventListener("DOMContentLoaded", () => {
  const savedView = localStorage.getItem('autosViewMode');
  if (savedView && window.state) {
    window.state.autosViewMode = savedView;
  }
});

// --- CONTROLADORES DE FLOTA Y AUTOS ---

window.toggleAutosViewMode = (mode) => { 
  window.state.autosViewMode = mode; 
  localStorage.setItem('autosViewMode', mode); // Guardamos la preferencia
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


// --- CONTROLADORES DE ADMINISTRACIÓN (SUCURSALES Y USUARIOS) ---
window.handleSaveSucursal = async (e) => { 
  e.preventDefault(); 
  const n = document.getElementById('new-suc-name').value; 
  if(window.state.editingSucursalId) { 
    await window.fbUpdate("sucursales", window.state.editingSucursalId, { nombre: n }); 
  } else { 
    await window.fbAdd("sucursales", { nombre: n }); 
  } 
  window.resetSucForm(); 
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
  
  // 2. Crédito Pendiente a Caja
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
  
  // 3. Pagaré Pendiente a Caja
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

  // 4. Registro Histórico
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

  // 5. Alta de Auto Recibido en Permuta
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
  
  // 6. Marcar Auto como Vendido
  await window.fbUpdate("autos", autoId, { estado: 'Vendido' }); 
  
  // 7. Preparar Data para Boleto Rápido
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
  const ml = document.getElementById('monto-total-liquidar');
  if(ml) ml.innerText = window.formatMoney(tot);
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
  
  // 1. Guardamos el registro del Cierre de Personal
  const nuevoCierreData = {
    fecha: fDate,
    cantidadMovimientos: pdtes.length,
    total: tot,
    userId: adminUsr.id
  };
  
  const docRef = await window.fbAdd("cierres_personal", nuevoCierreData);
  const cierreId = docRef ? docRef.id : window.generateId();
  
  // 2. Transacción de Egreso a la Caja
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
  
  // 3. Marcamos todas las comisiones como pagadas y le asociamos el ID del Cierre
  for(let p of pdtes) { 
    await window.fbUpdate("comisiones", p.id, { 
      estado: 'Pagada', 
      fechaPago: fDate,
      cierreId: cierreId
    }); 
  }
  
  window.closeModal('modal-cerrar-pagos'); 
  alert("Pagos liquidados. Se generó el egreso en Caja y el Ticket de Cierre Histórico automáticamente.");
};
