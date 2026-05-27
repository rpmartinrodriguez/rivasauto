// ==========================================
// js/controllers.js
// ==========================================

// --------------------------------------------------------
// 1. PERSISTENCIA Y UTILIDADES
// --------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    const savedView = localStorage.getItem('autosViewMode');
    if (savedView && window.state) {
        window.state.autosViewMode = savedView;
    }
});

window.setBtnLoader = (btn, isLoading) => {
    if (!btn) return;

    if (isLoading) {
        btn.dataset.originalHtml = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto"></i>';
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        btn.innerHTML = btn.dataset.originalHtml || 'Guardar';
        btn.disabled = false;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
};

window.formatInputMoney = (input) => {
    let val = input.value.replace(/[^0-9]/g, '');
    if (val) {
        val = parseInt(val, 10);
        input.value = new Intl.NumberFormat('es-AR').format(val);
    }
};

// --------------------------------------------------------
// 2. ALGORITMO INTELIGENTE DE CRM (LEAD SCORING)
// --------------------------------------------------------

window.calcularTermometroLead = (lead) => {
    let score = 50; 
    
    if (!lead) return { score: 0, estado: 'Frío' };

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const fechaAlta = new Date(lead.fecha || todayStr);
    
    // Diferencia en días desde que ingresó la consulta
    const diasAntiguedad = Math.floor((today - fechaAlta) / (1000 * 60 * 60 * 24));

    // 1. Reglas por Antigüedad
    if (diasAntiguedad <= 3) {
        score += 20; 
    } else if (diasAntiguedad <= 7) {
        score += 10; 
    } else if (diasAntiguedad > 30) {
        score -= 20; 
    }

    // 2. Reglas por Gestión e Interacción del Vendedor
    if (lead.historial && lead.historial.length > 0) {
        score += (lead.historial.length * 5); 
        
        const completados = lead.historial.filter(h => h.completado);
        const pendientes = lead.historial.filter(h => !h.completado && h.proximoContacto);

        score += (completados.length * 10);

        pendientes.forEach(p => {
            if (p.proximoContacto < todayStr) {
                score -= 15; 
            } else {
                score += 15; 
            }
        });
    } else {
        score -= 15; 
    }

    score = Math.max(0, Math.min(100, score));

    let estado = 'Frío';
    if (score >= 70) {
        estado = 'Caliente';
    } else if (score >= 40) {
        estado = 'Tibio';
    }

    return { score, estado };
};

// --------------------------------------------------------
// 3. CONTROLADORES DE FLOTA Y AUTOS
// --------------------------------------------------------

window.openModalCreateAuto = () => { 
    window.state.editingAutoId = null; 
    document.getElementById('form-auto').reset(); 
    document.getElementById('modal-auto-title').innerText = "Alta Vehículo"; 
    window.openModal('modal-auto'); 
};

window.editAuto = (id) => { 
    const auto = window.state.autos.find(x => x.id === id); 
    window.state.editingAutoId = id; 
    
    document.getElementById('auto-marca').value = auto.marca; 
    document.getElementById('auto-modelo').value = auto.modelo; 
    document.getElementById('auto-color').value = auto.color || ''; 
    document.getElementById('auto-km').value = auto.km ? new Intl.NumberFormat('es-AR').format(auto.km) : ''; 
    document.getElementById('auto-anio').value = auto.año; 
    document.getElementById('auto-patente').value = auto.patente; 
    document.getElementById('auto-precio').value = window.formatMoney(auto.precio).replace(/[^0-9]/g, ''); 
    document.getElementById('auto-costo').value = window.formatMoney(auto.costo || 0).replace(/[^0-9]/g, ''); 
    document.getElementById('auto-condicion').value = auto.condicion || 'Propio'; 
    document.getElementById('auto-sucursal').value = auto.sucursalId; 
    
    if (document.getElementById('auto-moneda')) {
        document.getElementById('auto-moneda').value = auto.moneda || 'ARS';
    }
    
    document.getElementById('modal-auto-title').innerText = "Editar Vehículo"; 
    
    window.closeModal('modal-detalle-auto'); 
    window.openModal('modal-auto'); 
};

window.deleteAuto = async (id) => { 
    if (confirm('¿Estás seguro de eliminar este vehículo de manera permanente? Esta acción no se puede deshacer.')) { 
        await window.fbDelete("autos", id); 
        window.closeModal('modal-detalle-auto'); 
    } 
};

window.handleAutoSubmit = async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    
    const btn = e.submitter || document.getElementById('modal-auto-submit');

    if (window.state.isSubmittingAuto || (btn && btn.disabled)) {
        return; 
    }
    
    window.state.isSubmittingAuto = true;
    
    if (btn) {
        window.setBtnLoader(btn, true);
    }
    
    try {
        const objAuto = { 
            marca: document.getElementById('auto-marca').value.toUpperCase(), 
            modelo: document.getElementById('auto-modelo').value.toUpperCase(), 
            color: document.getElementById('auto-color').value.toUpperCase(), 
            km: Number(document.getElementById('auto-km').value.replace(/[^0-9]/g, '')), 
            año: Number(document.getElementById('auto-anio').value), 
            patente: document.getElementById('auto-patente').value.toUpperCase(), 
            precio: Number(document.getElementById('auto-precio').value.replace(/[^0-9]/g, '')), 
            costo: Number(document.getElementById('auto-costo').value.replace(/[^0-9]/g, '')), 
            condicion: document.getElementById('auto-condicion').value, 
            sucursalId: document.getElementById('auto-sucursal').value,
            moneda: document.getElementById('auto-moneda') ? document.getElementById('auto-moneda').value : 'ARS'
        };
        
        if (window.state.editingAutoId) { 
            await window.fbUpdate("autos", window.state.editingAutoId, objAuto); 
        } else { 
            objAuto.estado = 'Disponible';
            objAuto.gastos = [];
            objAuto.documentacion = { 
                c08: false, 
                verificacion: false, 
                libreDeuda: false, 
                vtv: '' 
            };
            await window.fbAdd("autos", objAuto); 
        }
        
        window.closeModal('modal-auto'); 
        e.target.reset(); 
        window.initSelects();
        
    } catch(error) {
        console.error("Error al guardar auto:", error);
        alert("Hubo un error al guardar. Por favor, revisa tu conexión a internet e inténtalo de nuevo.");
    } finally {
        window.state.isSubmittingAuto = false; 
        if (btn) {
            window.setBtnLoader(btn, false);
        }
    }
};

window.openDetalleAuto = (id) => { 
    window.state.selectedAutoId = id; 
    window.state.daActiveSection = 'info'; 
    window.state.isVentaMode = false; 
    window.state.ventaData.tienePermuta = false; 
    
    if (window.renderDetalleAuto) {
        window.renderDetalleAuto(); 
    }
    
    window.openModal('modal-detalle-auto'); 
};

window.switchDASection = (section) => { 
    window.state.daActiveSection = section; 
    
    if (window.renderDetalleAuto) {
        window.renderDetalleAuto(); 
    }
};

window.toggleEstadoAuto = async (autoId) => {
    const auto = window.state.autos.find(x => x.id === autoId);
    
    if (!auto) return;
    if (auto.estado === 'Vendido' || auto.estado === 'Señado') return; 
    
    const nuevoEstado = auto.estado === 'Disponible' ? 'A Ingresar' : 'Disponible';
    
    if (confirm(`¿Estás seguro de cambiar el estado de este vehículo a ${nuevoEstado}?`)) {
        try {
            await window.fbUpdate("autos", autoId, { estado: nuevoEstado });
            
            if (window.renderDetalleAuto) {
                window.renderDetalleAuto();
            }
            if (window.renderAutosView) {
                window.renderAutosView();
            }
        } catch(err) {
            console.error("Error al cambiar estado:", err);
        }
    }
};

window.handleGastoTallerSubmit = async (e, autoId) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    
    const btn = e.submitter || e.target.querySelector('button[type="submit"]') || e.target.querySelector('button');

    if (window.state.isSubmittingGastoTaller || (btn && btn.disabled)) {
        return;
    }
    
    window.state.isSubmittingGastoTaller = true;
    
    if (btn) {
        window.setBtnLoader(btn, true);
    }

    try {
        const auto = window.state.autos.find(x => x.id === autoId);
        const desc = document.getElementById('gt-desc').value;
        const monto = Number(document.getElementById('gt-monto').value.replace(/[^0-9]/g, ''));
        const cat = document.getElementById('gt-cat').value;
        const esFueraDeCaja = document.getElementById('gt-fuera-caja').checked;
        const fDate = new Date().toISOString().split('T')[0];
        
        // Creamos un ID único que usaremos para vincular ambos si es necesario
        const txUnicoId = window.generateId ? window.generateId() : Date.now().toString();

        const nuevoGasto = { 
            id: txUnicoId, 
            txId: txUnicoId,
            fecha: fDate, 
            descripcion: desc, 
            categoria: cat, 
            monto: monto, 
            fueraDeCaja: esFueraDeCaja 
        };
        
        const nuevosGastos = [...(auto.gastos || []), nuevoGasto];
        
        await window.fbUpdate("autos", autoId, { gastos: nuevosGastos });

        if (!esFueraDeCaja) {
            const dataTx = {
                userId: window.state.currentUser.id, 
                sucursalId: window.state.currentUser.sucursalId, 
                fecha: fDate, 
                tipo: 'gasto',
                descripcion: `Gasto Taller: ${auto.marca} ${auto.modelo} - ${desc}`, 
                categoria: cat, 
                valor: monto, 
                autoId: autoId,
                tipoComprobante: 'X', 
                numComprobante: '', 
                iva: 0, 
                estadoCobro: 'disponible'
            };
            
            await window.fbAdd("transacciones", dataTx);
        }
        
        if (window.renderDetalleAuto) {
            window.renderDetalleAuto();
        }
        
    } catch(err) {
        console.error("Error al guardar gasto de taller:", err);
    } finally {
        window.state.isSubmittingGastoTaller = false;
        
        if (btn) {
            window.setBtnLoader(btn, false);
        }
    }
};

window.toggleDoc = async (id, key) => { 
    const auto = window.state.autos.find(x => x.id === id); 
    const docs = auto.documentacion; 
    docs[key] = !docs[key]; 
    
    await window.fbUpdate("autos", id, { documentacion: docs }); 
    
    if (window.renderDetalleAuto) {
        window.renderDetalleAuto(); 
    }
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
    const precio = Number(document.getElementById('ingreso-precio').value.replace(/[^0-9]/g, '')); 
    const btn = event?.submitter || event?.target || document.querySelector('#modal-ingreso-auto button.bg-black');
    
    if (window.state.isConfirmandoIngreso || (btn && btn.disabled)) {
        return; 
    }
    
    window.state.isConfirmandoIngreso = true;

    if (precio > 0) { 
        if (btn) {
            window.setBtnLoader(btn, true);
        }
        
        try {
            await window.fbUpdate("autos", window.state.pendingIngresoAutoId, { 
                estado: 'Disponible', 
                precio: precio 
            }); 
            
            document.getElementById('ingreso-aviso-gastos').classList.remove('hidden'); 
            document.getElementById('btn-ingreso-gastos').classList.remove('hidden'); 
        } catch(err) {
            console.error("Error al confirmar ingreso:", err);
        } finally {
            if (btn) {
                window.setBtnLoader(btn, false);
            }
            window.state.isConfirmandoIngreso = false;
        }
    } else { 
        alert("Debe establecer un precio mayor a 0 para el vehículo."); 
        window.state.isConfirmandoIngreso = false; 
    } 
};

window.abrirCajaParaGastos = () => { 
    window.closeModal('modal-ingreso-auto'); 
    window.switchTab('caja'); 
    window.openModalCaja(); 
    
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
    
    const btn = e.submitter || document.querySelector('#form-seña button[type="submit"]');

    if (window.state.isSubmittingSeña || (btn && btn.disabled)) {
        return;
    }
    
    window.state.isSubmittingSeña = true;
    
    if (btn) {
        window.setBtnLoader(btn, true);
    }

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
        
        if (window.renderAutosView) {
            window.renderAutosView();
        }
    } catch(err) {
        console.error("Error al señar vehículo:", err);
    } finally {
        window.state.isSubmittingSeña = false;
        if (btn) {
            window.setBtnLoader(btn, false);
        }
    }
};

window.quitarSeña = async (autoId) => {
    if (confirm("¿Estás seguro de cancelar la seña? El auto volverá a estar 'Disponible' para todos.")) {
        try {
            await window.fbUpdate("autos", autoId, { 
                estado: 'Disponible', 
                señadoPorNombre: null, 
                señadoPorUserId: null, 
                señadoClienteNombre: null, 
                señadoClienteTel: null 
            });
            
            window.closeModal('modal-detalle-auto');
            
            if (window.renderAutosView) {
                window.renderAutosView();
            }
        } catch(err) {
            console.error("Error al quitar seña:", err);
        }
    }
};

// --------------------------------------------------------
// 4. VENTA Y TRANSACCIONES MAESTRAS (CON INTELIGENCIA CRM)
// --------------------------------------------------------

window.handleDAVentaSubmit = async (e, autoId) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    
    const btn = e.submitter || document.querySelector('#btn-submit-venta button');

    if (window.state.isSubmittingVenta || (btn && btn.disabled)) {
        return;
    }
    
    window.state.isSubmittingVenta = true;
    
    if (btn) {
        window.setBtnLoader(btn, true);
    }
    
    try {
        const auto = window.state.autos.find(x => x.id === autoId);
        const userQueRegistra = window.state.currentUser; 
        
        // 1. Recolección de valores
        const nombreComprador = document.getElementById('vent-comp-nombre').value;
        const vEfectivo = document.getElementById('chk-efectivo')?.checked ? Number(document.getElementById('val-efectivo').value.replace(/[^0-9]/g, '')) : 0;
        const vCredito = document.getElementById('chk-credito')?.checked ? Number(document.getElementById('val-credito').value.replace(/[^0-9]/g, '')) : 0;
        const cCredito = Number(document.getElementById('cuotas-credito')?.value || 0);
        const vPagare = document.getElementById('chk-pagare')?.checked ? Number(document.getElementById('val-pagare').value.replace(/[^0-9]/g, '')) : 0;
        const cPagare = Number(document.getElementById('cuotas-pagare')?.value || 0);
        const vPermuta = window.state.ventaData.tienePermuta ? Number(document.getElementById('p-valor').value.replace(/[^0-9]/g, '')) : 0;
        
        const totalVentaOperacion = vEfectivo + vCredito + vPagare + vPermuta;

        if (totalVentaOperacion <= 0) {
            alert("Debes especificar al menos una forma de pago válida o recibir una permuta.");
            window.state.isSubmittingVenta = false;
            
            if (btn) {
                window.setBtnLoader(btn, false);
            }
            return;
        }

        const fDate = new Date().toISOString().split('T')[0];

        // 2. Registro de Ingresos de Efectivo
        if (vEfectivo > 0) {
            const notaEfectivo = document.getElementById('nota-efectivo').value || 'Efectivo';
            await window.fbAdd("transacciones", {
                fecha: fDate, 
                tipo: 'ingreso', 
                valor: vEfectivo, 
                categoria: 'Venta Vehículos',
                descripcion: `Entrega Venta: ${auto.marca} ${auto.modelo} (${notaEfectivo})`,
                userId: userQueRegistra.id, 
                sucursalId: userQueRegistra.sucursalId,
                tipoComprobante: 'X', 
                numComprobante: '', 
                iva: 0, 
                estadoCobro: 'disponible', 
                fechaAcreditacion: null
            });
        }

        // 3. Objetos de Deuda
        let objCredito = null;
        if (vCredito > 0 && cCredito > 0) {
            objCredito = { 
                montoTotal: vCredito, 
                cuotas: cCredito, 
                pagadas: 0, 
                valorCuota: vCredito / cCredito 
            };
        }
        
        let objPagare = null;
        if (vPagare > 0 && cPagare > 0) {
            objPagare = { 
                montoTotal: vPagare, 
                cuotas: cPagare, 
                pagadas: 0, 
                valorCuota: vPagare / cPagare 
            };
        }

        let metodosUsados = [];
        if (vEfectivo > 0) metodosUsados.push('Efectivo');
        if (vCredito > 0) metodosUsados.push('Crédito');
        if (vPagare > 0) metodosUsados.push('Pagaré');
        if (vPermuta > 0) metodosUsados.push('Permuta');
        
        // 4. Registro Histórico de Ventas
        await window.fbAdd("ventas", {
            fecha: fDate, 
            autoDesc: `${auto.marca} ${auto.modelo} (${auto.patente})`, 
            precioListaOriginal: auto.precio, 
            montoTotal: totalVentaOperacion, 
            desglose: { 
                efectivo: vEfectivo, 
                credito: vCredito, 
                pagare: vPagare, 
                permuta: vPermuta 
            },
            compradorNombre: nombreComprador, 
            compradorTelefono: document.getElementById('vent-comp-tel').value,
            compradorDNI: document.getElementById('vent-comp-dni').value, 
            compradorDomicilio: document.getElementById('vent-comp-domicilio').value,
            metodoPago: metodosUsados.join(' + '), 
            credito: objCredito, 
            pagare: objPagare,
            userId: userQueRegistra.id, 
            sucursalId: userQueRegistra.sucursalId,
            tienePermuta: window.state.ventaData.tienePermuta,
            detallePermuta: window.state.ventaData.tienePermuta ? `${document.getElementById('p-marca').value} ${document.getElementById('p-modelo').value}` : null
        });

        // 5. Alta del Auto en Permuta
        if (window.state.ventaData.tienePermuta) {
            await window.fbAdd("autos", { 
                marca: document.getElementById('p-marca').value.toUpperCase(), 
                modelo: document.getElementById('p-modelo').value.toUpperCase(), 
                color: document.getElementById('p-color').value.toUpperCase(),
                km: Number(document.getElementById('p-km').value.replace(/[^0-9]/g, '') || 0), 
                año: Number(document.getElementById('p-anio').value), 
                patente: document.getElementById('p-pat').value.toUpperCase(),
                precio: 0, 
                costo: vPermuta, 
                condicion: document.getElementById('p-condicion').value, 
                estado: 'A Ingresar',
                sucursalId: auto.sucursalId, 
                gastos: [], 
                documentacion: { c08: false, verificacion: false, libreDeuda: false, vtv: '' } 
            });
        }
        
        // 6. Baja del Auto de la Flota
        await window.fbUpdate("autos", autoId, { estado: 'Vendido' }); 
        
        // 7. CIERRE INTELIGENTE EN EL CRM (EL PUENTE)
        try {
            const leadMatch = (window.state.consultas || []).find(c => c.nombre.trim().toLowerCase() === nombreComprador.trim().toLowerCase());
            
            if (leadMatch && leadMatch.estadoLead !== 'Vendido') {
                await window.fbUpdate("consultas", leadMatch.id, { estadoLead: 'Vendido' });
                
                const autoVendidoDesc = `${auto.marca} ${auto.modelo} (${auto.patente})`;
                const nuevoHistorial = { 
                    id: window.generateId ? window.generateId() : Date.now().toString(), 
                    fechaCarga: fDate, 
                    texto: `¡OPERACIÓN CONCRETADA EN SALÓN! Vehículo vendido: ${autoVendidoDesc}`, 
                    proximoContacto: null, 
                    completado: true 
                };
                
                const listHistorial = [...(leadMatch.historial || []), nuevoHistorial];
                await window.fbUpdate("consultas", leadMatch.id, { historial: listHistorial });
            }
        } catch(crmErr) {
            console.error("Error al intentar vincular y cerrar el lead en el CRM:", crmErr);
        }

        // 8. Auto-generación de Boleto
        const cuotasMax = Math.max(cCredito, cPagare);
        const tipoBoleto = window.state.ventaData.tienePermuta ? 'Boleto Venta con Permuta' : 'Boleto Compra Venta';
        
        const boletoData = {
            tipo: tipoBoleto, 
            fecha: fDate, 
            vendedor: 'RIVAS AUTO', 
            vendedorLoc: 'Gualeguaychú',
            comprador: nombreComprador, 
            dni: document.getElementById('vent-comp-dni').value,
            domicilio: document.getElementById('vent-comp-domicilio').value, 
            marca: auto.marca, 
            modelo: auto.modelo,
            año: auto.año, 
            dominio: auto.patente, 
            motor: '', 
            chasis: '', 
            monto: totalVentaOperacion, 
            observaciones: '',
            estado: 'Pendiente', 
            autoIdAsociado: autoId
        };

        if (window.state.ventaData.tienePermuta) {
            boletoData.telefono = document.getElementById('vent-comp-tel').value;
            boletoData.efectivo = vEfectivo;
            boletoData.p_marca = document.getElementById('p-marca').value;
            boletoData.p_modelo = document.getElementById('p-modelo').value;
            boletoData.p_anio = document.getElementById('p-anio').value;
            boletoData.p_dominio = document.getElementById('p-pat').value.toUpperCase();
            boletoData.p_tasado = vPermuta;
            boletoData.saldo = vCredito + vPagare;
            boletoData.cuotas = cuotasMax;
            boletoData.valCuota = '';
        } else {
            boletoData.formaPago = metodosUsados.join(' + ');
            boletoData.telefono = document.getElementById('vent-comp-tel').value;
        }

        await window.fbAdd("formularios", boletoData);
        
        window.closeModal('modal-detalle-auto');
        window.switchTab('formularios');
        
    } catch(err) {
        console.error("Error en venta:", err);
    } finally {
        window.state.isSubmittingVenta = false;
        
        if (btn) {
            window.setBtnLoader(btn, false);
        }
    }
};

// --------------------------------------------------------
// 5. CONTROLADORES DE FORMULARIOS Y BOLETOS
// --------------------------------------------------------

window.guardarYImprimirFormulario = async (autoIdAsociado) => {
    if (window.state.isSubmittingBoleto) return;

    if (autoIdAsociado && typeof autoIdAsociado === 'object') {
        autoIdAsociado = null;
    }

    window.state.isSubmittingBoleto = true;
    
    const dataToSave = { ...window.state.tempFormData, estado: 'Completado' };
    const formId = dataToSave.id; 

    delete dataToSave.id;
    
    Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === undefined) {
            dataToSave[key] = null;
        }
    });

    const btn = document.querySelector('#form-real-boleto button[type="submit"]') || document.querySelector('#modal-asociar-form button.bg-black');
    if (btn) window.setBtnLoader(btn, true);

    try {
        if (autoIdAsociado) {
            dataToSave.autoIdAsociado = autoIdAsociado;
            await window.fbUpdate("autos", autoIdAsociado, { estado: 'Vendido' });
        }

        if (formId) {
            await window.fbUpdate("formularios", formId, dataToSave);
            
            const idx = window.state.formularios.findIndex(f => f.id === formId);
            if (idx !== -1) {
                window.state.formularios[idx] = { ...window.state.formularios[idx], ...dataToSave, id: formId };
            }
        } else {
            await window.fbAdd("formularios", dataToSave);
        }

        window.closeModal('modal-asociar-form');
        window.closeModal('modal-boleto');

        if (window.imprimirBoletoHtml) {
            window.imprimirBoletoHtml(dataToSave);
        }

    } catch (err) {
        console.error("Error guardando el formulario", err);
        alert("Ocurrió un error al guardar. Verifica la consola.");
    } finally {
        window.state.isSubmittingBoleto = false;
        if (btn) window.setBtnLoader(btn, false);
        if (window.renderFormulariosView) window.renderFormulariosView();
    }
};

window.vincularYGuardarFormulario = () => {
    const sel = document.getElementById('asoc-auto-select');
    if (sel && sel.value) {
        window.guardarYImprimirFormulario(sel.value);
    } else {
        alert("Debes seleccionar un vehículo de la lista para vincularlo.");
    }
};

window.ignorarYGuardarFormulario = () => {
    window.guardarYImprimirFormulario(null);
};

// --------------------------------------------------------
// 6. CONTROLADORES DE CRM (LEADS Y CONSULTAS)
// --------------------------------------------------------

window.handleGlobalLeadSubmit = async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    
    const btn = e.submitter || e.target.querySelector('button[type="submit"]');

    if (window.state.isSubmittingLead || (btn && btn.disabled)) {
        return;
    }
    
    window.state.isSubmittingLead = true;
    
    if (btn) {
        window.setBtnLoader(btn, true);
    }
    
    try {
        await window.fbAdd("consultas", {
            autoId: null,
            nombre: document.getElementById('gl-nombre').value,
            telefono: document.getElementById('gl-tel').value,
            marcaInteres: document.getElementById('gl-interes').value,
            notas: document.getElementById('gl-nota').value,
            fecha: new Date().toISOString().split('T')[0],
            userId: window.state.currentUser.id,
            sucursalId: window.state.currentUser.sucursalId,
            historial: [] 
        });
        
        window.closeModal('modal-nuevo-lead');
        e.target.reset();
        
        if (window.renderClientesView) {
            window.renderClientesView();
        }
        
        if(window.updateNotifications) {
            window.updateNotifications();
        }
        
    } catch(err) {
        console.error("Error guardando lead global:", err);
    } finally {
        window.state.isSubmittingLead = false;
        
        if (btn) {
            window.setBtnLoader(btn, false);
        }
    }
};

window.handleDA_CRMSubmit = async (e, autoId) => { 
    e.preventDefault();
    e.stopImmediatePropagation();
    
    const btn = e.submitter || e.target.querySelector('button[type="submit"]');

    if (window.state.isSubmittingDALead || (btn && btn.disabled)) {
        return;
    }
    
    window.state.isSubmittingDALead = true;
    
    if (btn) {
        window.setBtnLoader(btn, true);
    }
    
    try {
        const auto = window.state.autos.find(x => x.id === autoId);
        
        await window.fbAdd("consultas", { 
            autoId: autoId, 
            marcaInteres: `${auto.marca} ${auto.modelo}`, 
            nombre: document.getElementById('dac-nombre').value, 
            telefono: document.getElementById('dac-tel').value, 
            notas: document.getElementById('dac-nota').value, 
            fecha: new Date().toISOString().split('T')[0],
            userId: window.state.currentUser.id, 
            sucursalId: window.state.currentUser.sucursalId, 
            historial: []
        }); 
        
        document.getElementById('dac-nombre').value = ''; 
        document.getElementById('dac-tel').value = ''; 
        document.getElementById('dac-nota').value = '';
        
        if (window.renderDetalleAuto) {
            window.renderDetalleAuto();
        }
        
        if (window.renderClientesView) {
            window.renderClientesView();
        }
        
        if(window.updateNotifications) {
            window.updateNotifications();
        }
        
    } catch (err) {
        console.error("Error agregando lead desde detalle auto:", err);
    } finally {
        window.state.isSubmittingDALead = false;
        
        if (btn) {
            window.setBtnLoader(btn, false);
        }
    }
};

window.handleEditLeadSubmit = async (e, id) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    
    const btn = e.submitter || document.querySelector('#form-edit-lead button[type="submit"]');

    if (window.state.isEditingLead || (btn && btn.disabled)) {
        return;
    }
    
    window.state.isEditingLead = true;
    
    if (btn) {
        window.setBtnLoader(btn, true);
    }
    
    try {
        const nombreLead = document.getElementById('edit-lead-nombre').value;
        const telefonoLead = document.getElementById('edit-lead-tel').value;
        const notasLead = document.getElementById('edit-lead-nota').value;
        
        await window.fbUpdate("consultas", id, { 
            nombre: nombreLead, 
            telefono: telefonoLead, 
            notas: notasLead
        });
        
        if (window.renderClientesView) {
            window.renderClientesView();
        }
        
        if (window.state.selectedAutoId && window.renderDetalleAuto) {
            window.renderDetalleAuto();
        }
        
        alert("Datos base actualizados correctamente.");
        
    } catch(err) {
        console.error("Error editando lead:", err);
    } finally {
        window.state.isEditingLead = false;
        
        if (btn) {
            window.setBtnLoader(btn, false);
        }
    }
};

window.deleteLead = async (id) => {
    if (confirm('¿Estás seguro de eliminar permanentemente a este interesado de tu cartera?')) {
        try {
            await window.fbDelete("consultas", id);
            
            window.closeModal('modal-detalle-lead');
            
            if (window.renderClientesView) {
                window.renderClientesView();
            }
            
            if (window.state.selectedAutoId && window.renderDetalleAuto) {
                window.renderDetalleAuto();
            }
            
            if(window.updateNotifications) {
                window.updateNotifications();
            }
            
        } catch (err) {
            console.error("Error eliminando lead:", err);
        }
    }
};

window.handleAddLeadHistory = async (e, leadId) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    
    const btn = e.submitter || e.target.querySelector('button[type="submit"]');
    
    if(btn) {
        window.setBtnLoader(btn, true);
    }

    try {
        const lead = window.state.consultas.find(c => c.id === leadId);
        
        if(!lead) {
            return;
        }
        
        const texto = document.getElementById('lh-texto').value;
        const prox = document.getElementById('lh-fecha').value;
        
        const nuevoHistorial = { 
            id: window.generateId ? window.generateId() : Date.now().toString(), 
            fechaCarga: new Date().toISOString().split('T')[0], 
            texto: texto, 
            proximoContacto: prox || null, 
            completado: false 
        };
        
        const list = [...(lead.historial || []), nuevoHistorial];
        
        await window.fbUpdate("consultas", leadId, { historial: list });
        
        if(window.openDetalleLead) {
            window.openDetalleLead(leadId);
        }
        
        if(window.renderClientesView) {
            window.renderClientesView();
        }
        
        if(window.updateNotifications) {
            window.updateNotifications();
        }
        
    } catch(err) {
        console.error("Error agregando historial al lead:", err);
    } finally {
        if(btn) {
            window.setBtnLoader(btn, false);
        }
    }
};

window.markHistoryCompleted = async (leadId, histId) => {
    try {
        const lead = window.state.consultas.find(c => c.id === leadId);
        
        if(!lead) {
            return;
        }
        
        const list = (lead.historial || []).map(h => {
            if(h.id === histId) {
                return { ...h, completado: true };
            }
            return h;
        });
        
        await window.fbUpdate("consultas", leadId, { historial: list });
        
        if(window.openDetalleLead) {
            window.openDetalleLead(leadId);
        }
        
        if(window.renderClientesView) {
            window.renderClientesView();
        }
        
        if(window.updateNotifications) {
            window.updateNotifications();
        }
        
    } catch(err) {
        console.error("Error marcando historial como completado:", err);
    }
};

// --------------------------------------------------------
// 7. CONTROLADORES DE ADMINISTRACIÓN Y SUCURSALES
// --------------------------------------------------------

window.handleSaveSucursal = async (e) => { 
    e.preventDefault();
    e.stopImmediatePropagation();
    
    const btn = e.submitter || document.getElementById('new-suc-submit');

    if (window.state.isSubmittingSucursal || (btn && btn.disabled)) {
        return;
    }
    
    window.state.isSubmittingSucursal = true;
    
    if (btn) {
        window.setBtnLoader(btn, true);
    }
    
    try {
        const nombreSuc = document.getElementById('new-suc-name').value; 
        
        if (window.state.editingSucursalId) { 
            await window.fbUpdate("sucursales", window.state.editingSucursalId, { nombre: nombreSuc }); 
        } else { 
            await window.fbAdd("sucursales", { nombre: nombreSuc }); 
        } 
        
        window.resetSucForm(); 
        
    } catch (err) {
        console.error("Error guardando sucursal:", err);
    } finally {
        window.state.isSubmittingSucursal = false;
        
        if (btn) {
            window.setBtnLoader(btn, false);
        }
    }
};

window.editSucursal = (id) => { 
    window.state.editingSucursalId = id; 
    const sucursal = window.state.sucursales.find(s => s.id === id);
    
    document.getElementById('new-suc-name').value = sucursal.nombre; 
    document.getElementById('new-suc-cancel').classList.remove('hidden'); 
};

window.deleteSucursal = async (id) => { 
    if (confirm('¿Eliminar esta sucursal permanentemente?')) {
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
    
    const btn = e.submitter || document.getElementById('new-user-submit');

    if (window.state.isSubmittingUser || (btn && btn.disabled)) {
        return;
    }
    
    window.state.isSubmittingUser = true;
    
    if (btn) {
        window.setBtnLoader(btn, true);
    }
    
    try {
        const n = document.getElementById('new-user-name').value; 
        const em = document.getElementById('new-user-email').value; 
        const r = document.getElementById('new-user-rol').value; 
        const s = document.getElementById('new-user-suc').value; 
        const p = document.getElementById('new-user-pwd').value; 
        
        if (window.state.editingUserId) { 
            const dataUpdate = { nombre: n, email: em, rol: r, sucursalId: s }; 
            
            if (p) { 
                dataUpdate.password = p; 
                dataUpdate.isFirstLogin = true; 
            } 
            
            await window.fbUpdate("usuarios", window.state.editingUserId, dataUpdate); 
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
        
    } catch (err) {
        console.error("Error guardando usuario:", err);
    } finally {
        window.state.isSubmittingUser = false;
        
        if (btn) {
            window.setBtnLoader(btn, false);
        }
    }
};

window.editUser = (id) => { 
    window.state.editingUserId = id; 
    const usuario = window.state.usuarios.find(x => x.id === id); 
    
    document.getElementById('new-user-name').value = usuario.nombre; 
    document.getElementById('new-user-email').value = usuario.email; 
    document.getElementById('new-user-rol').value = usuario.rol; 
    document.getElementById('new-user-suc').value = usuario.sucursalId; 
    document.getElementById('new-user-pwd').required = false; 
    document.getElementById('new-user-cancel').classList.remove('hidden'); 
};

window.deleteUser = async (id) => { 
    if (id === window.state.currentUser.id) {
        return alert('No puedes eliminar tu propio usuario.'); 
    }
    
    if (confirm('¿Eliminar este usuario de forma permanente?')) {
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

// --------------------------------------------------------
// 8. CONTROLADORES DE CAJA CHICA Y COBROS PENDIENTES
// --------------------------------------------------------

window.agregarCategoria = async () => { 
    const n = prompt('Ingrese el nombre de la nueva categoría:'); 
    
    if (n && n.trim() !== '') { 
        window.state.categoriasGasto.push(n.trim()); 
        window.initSelects(); 
    } 
};

window.handleComprobanteChange = (val) => { 
    const c = document.getElementById('caja-iva-container'); 
    const i = document.getElementById('caja-iva'); 
    
    if (val === 'A') { 
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

window.openModalCaja = () => {
    window.state.editingTransaccionId = null;
    document.getElementById('form-caja').reset();
    const title = document.getElementById('modal-caja-title');
    if(title) title.innerText = "Nuevo Movimiento de Caja";
    window.openModal('modal-caja');
};

window.editTransaccion = (id) => {
    const t = window.state.transacciones.find(x => x.id === id);
    if (!t) return;
    
    window.state.editingTransaccionId = id;
    
    document.getElementById('caja-fecha').value = t.fecha;
    document.getElementById('caja-tipo').value = t.tipo;
    document.getElementById('caja-desc').value = t.descripcion;
    document.getElementById('caja-cat').value = t.categoria;
    document.getElementById('caja-monto').value = window.formatMoney(t.valor).replace(/[^0-9]/g, '');
    
    if (document.getElementById('caja-auto')) {
        document.getElementById('caja-auto').value = t.autoId || '';
    }
    if (document.getElementById('caja-comprobante')) {
        document.getElementById('caja-comprobante').value = t.tipoComprobante || 'X';
        if (window.handleComprobanteChange) window.handleComprobanteChange(t.tipoComprobante || 'X');
    }
    if (document.getElementById('caja-comp-num')) {
        document.getElementById('caja-comp-num').value = t.numComprobante || '';
    }
    if (document.getElementById('caja-iva')) {
        document.getElementById('caja-iva').value = t.iva ? window.formatMoney(t.iva).replace(/[^0-9]/g, '') : '';
    }

    const title = document.getElementById('modal-caja-title');
    if(title) title.innerText = "Editar Movimiento de Caja";
    
    window.openModal('modal-caja');
};

window.deleteTransaccion = async (id) => {
    if (!confirm("⚠️ ADVERTENCIA CRÍTICA: Estás a punto de ELIMINAR permanentemente un movimiento contable. Esto alterará los saldos históricos de la caja. ¿Estás absolutamente seguro de continuar?")) {
        return;
    }

    try {
        const t = window.state.transacciones.find(x => x.id === id);
        if (!t) return;

        if (t.tipo === 'gasto' && t.autoId) {
            const auto = window.state.autos.find(x => x.id === t.autoId);
            if (auto) {
                const gastosLimpios = (auto.gastos || []).filter(g => g.txId !== id && g.id !== id);
                await window.fbUpdate("autos", t.autoId, { gastos: gastosLimpios });
            }
        }

        await window.fbDelete("transacciones", id);
    } catch (err) {
        console.error("Error eliminando transacción de caja:", err);
        alert("Hubo un error al eliminar el movimiento.");
    }
};

window.handleCajaSubmit = async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    
    // Captura estricta del botón para frenar los clics múltiples al instante
    const btn = e.submitter || e.target.querySelector('button[type="submit"]') || e.target.querySelector('button');

    // Escudo: Si ya está enviando, o si el botón ya está deshabilitado, rechazamos la petición extra
    if (window.state.isSubmittingCaja || (btn && btn.disabled)) {
        return;
    }

    if (window.state.editingTransaccionId) {
        if (!confirm("⚠️ ADVERTENCIA: Estás a punto de modificar un movimiento contable. Esto alterará los saldos históricos de la caja. ¿Deseas continuar con la edición?")) {
            return;
        }
    }
    
    window.state.isSubmittingCaja = true;
    
    if (btn) {
        window.setBtnLoader(btn, true);
    }
    
    try {
        const autoIdSel = document.getElementById('caja-auto').value || null;
        const tipoTx = document.getElementById('caja-tipo').value;
        const descTx = document.getElementById('caja-desc').value;
        const catTx = document.getElementById('caja-cat').value;
        const montoTx = Number(document.getElementById('caja-monto').value.replace(/[^0-9]/g, ''));
        const fDate = document.getElementById('caja-fecha').value;

        const data = {
            userId: window.state.currentUser.id, 
            sucursalId: window.state.currentUser.sucursalId,
            fecha: fDate, 
            tipo: tipoTx,
            descripcion: descTx, 
            categoria: catTx,
            valor: montoTx,
            autoId: autoIdSel, 
            tipoComprobante: document.getElementById('caja-comprobante').value,
            numComprobante: document.getElementById('caja-comp-num').value, 
            iva: Number(document.getElementById('caja-iva').value.replace(/[^0-9]/g, '') || 0),
            estadoCobro: 'disponible'
        };

        let txId = window.state.editingTransaccionId;
        const oldTx = txId ? window.state.transacciones.find(t => t.id === txId) : null;
        const oldAutoId = oldTx ? oldTx.autoId : null;

        if (txId) {
            data.editado = true;
            data.fechaEdicion = new Date().toISOString();
            await window.fbUpdate("transacciones", txId, data);
        } else {
            const docRef = await window.fbAdd("transacciones", data);
            txId = docRef ? docRef.id : data.id; 
        }

        if (txId && oldAutoId && oldAutoId !== autoIdSel) {
            const oldAuto = window.state.autos.find(x => x.id === oldAutoId);
            if (oldAuto) {
                const gastosLimpios = (oldAuto.gastos || []).filter(g => g.txId !== txId && g.id !== txId);
                await window.fbUpdate("autos", oldAutoId, { gastos: gastosLimpios });
            }
        }

        if (tipoTx === 'gasto' && autoIdSel) {
            const auto = window.state.autos.find(x => x.id === autoIdSel);
            if (auto) {
                let gastosActuales = auto.gastos || [];
                const gastoIndex = gastosActuales.findIndex(g => g.txId === txId || g.id === txId);
                
                const objGasto = { 
                    id: txId, 
                    txId: txId,
                    fecha: fDate, 
                    descripcion: descTx, 
                    categoria: catTx, 
                    monto: montoTx, 
                    fueraDeCaja: false 
                };

                if (gastoIndex >= 0) {
                    gastosActuales[gastoIndex] = objGasto;
                } else {
                    gastosActuales.push(objGasto);
                }
                
                await window.fbUpdate("autos", autoIdSel, { gastos: gastosActuales });
            }
        }
        
        window.closeModal('modal-caja');
        e.target.reset();
        window.state.editingTransaccionId = null; 
        
    } catch(err) {
        console.error("Error guardando transaccion de caja:", err);
    } finally {
        window.state.isSubmittingCaja = false;
        if (btn) window.setBtnLoader(btn, false);
    }
};

window.cobrarCuotaVenta = async (ventaId, tipo) => {
    if (window.state.isCobrandoCuota) {
        return;
    }
    
    window.state.isCobrandoCuota = true;
    const venta = window.state.ventas.find(x => x.id === ventaId);
    
    if (!venta) { 
        window.state.isCobrandoCuota = false; 
        return; 
    }

    const userQueRegistra = window.state.currentUser;
    let montoACobrar = 0; 
    let numeroDeCuota = 0; 
    let datosDeActualizacion = {};

    if (tipo === 'credito' && venta.credito) {
        montoACobrar = venta.credito.valorCuota; 
        numeroDeCuota = venta.credito.pagadas + 1;
        datosDeActualizacion = { credito: { ...venta.credito, pagadas: numeroDeCuota } };
    } else if (tipo === 'pagare' && venta.pagare) {
        montoACobrar = venta.pagare.valorCuota; 
        numeroDeCuota = venta.pagare.pagadas + 1;
        datosDeActualizacion = { pagare: { ...venta.pagare, pagadas: numeroDeCuota } };
    }

    if (montoACobrar > 0) {
        const fechaHoy = new Date().toISOString().split('T')[0];
        const btnId = tipo === 'credito' ? `btn-txt-credito-${ventaId}` : `btn-txt-pagare-${ventaId}`;
        const btnDOM = document.getElementById(btnId)?.parentElement;
        
        if (btnDOM) {
            window.setBtnLoader(btnDOM, true);
        }

        try {
            await window.fbAdd("transacciones", { 
                fecha: fechaHoy, 
                descripcion: `Cobro Cuota ${numeroDeCuota} (${tipo === 'credito' ? 'Crédito' : 'Pagaré'}): ${venta.compradorNombre} - ${venta.autoDesc}`, 
                tipo: 'ingreso', 
                categoria: 'Venta Vehículos', 
                valor: montoACobrar, 
                userId: userQueRegistra.id, 
                sucursalId: userQueRegistra.sucursalId, 
                tipoComprobante: 'X', 
                numComprobante: '', 
                iva: 0, 
                estadoCobro: 'disponible', 
                fechaAcreditacion: null 
            });
            
            await window.fbUpdate("ventas", ventaId, datosDeActualizacion);
            
            window.closeModal('modal-pendientes');
            alert(`Cuota #${numeroDeCuota} cobrada con éxito e ingresada a la caja.`);
            
        } catch(e) {
            console.error("Error cobrando cuota:", e);
        } finally {
            if (btnDOM) {
                window.setBtnLoader(btnDOM, false);
            }
            window.state.isCobrandoCuota = false; 
        }
    } else {
        window.state.isCobrandoCuota = false; 
    }
};

// --------------------------------------------------------
// 9. CONTROLADORES DE COMISIONES Y CIERRES DE MES
// --------------------------------------------------------

window.openModalAsignarBono = () => { 
    document.getElementById('form-comision').reset(); 
    document.getElementById('comision-venta-id').value = ""; 
    window.openModal('modal-comision'); 
};

window.handleComisionSubmit = async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    
    const btn = e.submitter || e.target.querySelector('button[type="submit"]');

    if (window.state.isSubmittingComision || (btn && btn.disabled)) {
        return;
    }
    
    window.state.isSubmittingComision = true;
    
    if (btn) {
        window.setBtnLoader(btn, true);
    }
    
    try {
        const usrId = document.getElementById('comision-user').value;
        const montoBono = Number(document.getElementById('comision-monto').value.replace(/[^0-9]/g, ''));
        const descripcionBono = document.getElementById('comision-desc') ? document.getElementById('comision-desc').value : 'Carga Manual';
        const ventaIdAsoc = document.getElementById('comision-venta-id').value;
        
        if (!usrId || montoBono <= 0) { 
            alert("Complete los datos. El monto debe ser mayor a 0."); 
            window.state.isSubmittingComision = false; 
            
            if (btn) {
                window.setBtnLoader(btn, false);
            }
            return; 
        }
        
        await window.fbAdd("comisiones", { 
            userId: usrId, 
            ventaId: ventaIdAsoc || null, 
            monto: montoBono, 
            descripcion: descripcionBono,
            estado: 'Pendiente', 
            fecha: new Date().toISOString().split('T')[0] 
        });
        
        window.closeModal('modal-comision'); 
        alert("Carga registrada y asignada correctamente a la cuenta del empleado.");
        
        if (window.renderPersonalView) {
            window.renderPersonalView();
        }
        
    } catch(err) {
        console.error("Error asignando comision:", err);
    } finally {
        window.state.isSubmittingComision = false;
        
        if (btn) {
            window.setBtnLoader(btn, false);
        }
    }
};

window.openModalComisionPorVenta = (ventaId) => {
    const venta = window.state.ventas.find(x => x.id === ventaId);
    
    if (!venta) {
        return;
    }
    
    document.getElementById('form-comision').reset(); 
    document.getElementById('comision-venta-id').value = ventaId; 
    document.getElementById('comision-desc').value = `Bono por Venta: ${venta.autoDesc}`;
    
    window.closeModal('modal-detalle-venta');
    window.openModal('modal-comision'); 
};

window.liquidarPersonal = async (userId) => {
    if (window.state.isCerrandoPagos) {
        return;
    }
    
    const empleado = window.state.usuarios.find(x => x.id === userId);
    
    if(!empleado) {
        return;
    }

    const pendientes = window.state.comisiones.filter(c => c.estado === 'Pendiente' && c.userId === userId);
    const montoLiquidacion = pendientes.reduce((acc, curr) => acc + curr.monto, 0);

    if (montoLiquidacion <= 0) {
        return alert("Este empleado no tiene comisiones pendientes de cobro.");
    }
    
    if (!confirm(`¿Estás seguro de liquidar ${window.formatMoney(montoLiquidacion)} a ${empleado.nombre}?\n\nAl confirmar, este monto se descontará automáticamente como 'Gasto' en la Caja Chica.`)) {
        return;
    }

    window.state.isCerrandoPagos = true;
    
    try {
        const fechaHoy = new Date().toISOString().split('T')[0];
        const adminUser = window.state.usuarios.find(user => user.rol === 'Admin') || window.state.currentUser;

        const dataCierre = { 
            fecha: fechaHoy, 
            cantidadMovimientos: pendientes.length, 
            total: montoLiquidacion, 
            userId: adminUser.id, 
            empleadoLiquidado: empleado.nombre 
        };
        
        const docRef = await window.fbAdd("cierres_personal", dataCierre);
        const cierreOficialId = docRef ? docRef.id : window.generateId ? window.generateId() : Date.now().toString();

        await window.fbAdd("transacciones", {
            fecha: fechaHoy, 
            descripcion: `Liquidación de Personal: ${empleado.nombre}`, 
            tipo: 'gasto', 
            categoria: 'Liquidación Personal',
            valor: montoLiquidacion, 
            userId: adminUser.id, 
            sucursalId: adminUser.sucursalId, 
            tipoComprobante: 'X', 
            numComprobante: '', 
            iva: 0, 
            estadoCobro: 'disponible'
        });

        for (let comision of pendientes) {
            await window.fbUpdate("comisiones", comision.id, { 
                estado: 'Pagada', 
                fechaPago: fechaHoy, 
                cierreId: cierreOficialId 
            });
        }

        window.closeModal('modal-detalle-personal');
        alert(`¡Éxito! El pago de ${window.formatMoney(montoLiquidacion)} a ${empleado.nombre} fue registrado y descontado de la caja.`);
        
        if (window.renderPersonalView) {
            window.renderPersonalView();
        }
        
    } catch(err) {
        console.error("Error procesando pago de empleado:", err);
        alert("Hubo un error al procesar el pago.");
    } finally {
        window.state.isCerrandoPagos = false; 
    }
};
