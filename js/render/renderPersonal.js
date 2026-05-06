// ==========================================
// js/render/renderPersonal.js
// ==========================================

window.renderPersonalView = () => {
    // Solo el Administrador puede ver la gestión completa de personal
    if (window.state.currentUser?.rol !== 'Admin') {
        return;
    }
    
    // Contenedores principales (reutilizamos los IDs del HTML pero cambiamos su contenido)
    const tablePersonal = document.getElementById('personal-table');
    const tableCierres = document.getElementById('cierres-table');
    const selectUserBono = document.getElementById('comision-user');
    
    // Filtramos solo Vendedores y Encargados (ordenados alfabéticamente)
    const usuariosAgencia = (window.state.usuarios || [])
        .filter(u => u.rol === 'Vendedor' || u.rol === 'Encargado')
        .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
    
    // ----------------------------------------------------
    // 1. REDISEÑO: TARJETAS DE EMPLEADOS (Reemplaza la tabla)
    // ----------------------------------------------------
    if (tablePersonal) {
        // Obtenemos el contenedor padre para cambiar su estructura
        const parentDiv = tablePersonal.closest('.bg-white\\/60') || tablePersonal.parentElement;
        
        if (usuariosAgencia.length === 0) {
            parentDiv.innerHTML = `
                <div class="text-center py-12 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-[2rem]">
                    <i data-lucide="users" class="w-12 h-12 text-neutral-400 mx-auto mb-4"></i>
                    <p class="text-neutral-500 font-bold">No hay personal registrado para comisionar.</p>
                </div>
            `;
        } else {
            let cardsHtml = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
            
            usuariosAgencia.forEach(u => {
                const comisiones = (window.state.comisiones || []).filter(c => c.userId === u.id);
                const pdtes = comisiones.filter(c => c.estado === 'Pendiente');
                const totPdte = pdtes.reduce((a, c) => a + c.monto, 0);
                const suc = (window.state.sucursales || []).find(s => s.id == u.sucursalId)?.nombre || 'Sin Sucursal';
                
                const cardColor = totPdte > 0 
                    ? 'border-green-200 dark:border-green-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md hover:border-green-400 dark:hover:border-green-600' 
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 opacity-80 hover:opacity-100';

                cardsHtml += `
                    <div onclick="window.openDetallePersonal('${u.id}')" class="p-5 rounded-2xl border transition-all cursor-pointer flex flex-col ${cardColor}">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${totPdte > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}">
                                    ${String(u.nombre || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 class="font-black text-sm text-neutral-800 dark:text-neutral-100">${u.nombre || 'Sin Nombre'}</h4>
                                    <p class="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">${u.rol} • ${suc}</p>
                                </div>
                            </div>
                        </div>
                        <div class="mt-auto border-t border-neutral-100 dark:border-neutral-800/50 pt-3 flex justify-between items-center">
                            <span class="text-xs font-bold text-neutral-500">Saldo a Pagar:</span>
                            <span class="text-xl font-black ${totPdte > 0 ? 'text-green-600 dark:text-green-500' : 'text-neutral-400'}">
                                ${window.formatMoney(totPdte)}
                            </span>
                        </div>
                    </div>
                `;
            });
            
            cardsHtml += `</div>`;
            parentDiv.innerHTML = cardsHtml;
        }
    }
    
    // ----------------------------------------------------
    // 2. POBLAR SELECTOR PARA ASIGNAR BONO MANUAL
    // ----------------------------------------------------
    if (selectUserBono) {
        selectUserBono.innerHTML = `
            <option value="">-- Seleccione Empleado --</option>
            ${usuariosAgencia.map(u => `<option value="${u.id}">${u.nombre || 'Sin Nombre'} (${u.rol})</option>`).join('')}
        `;
    }
    
    // ----------------------------------------------------
    // 3. TABLA DE HISTORIAL DE CIERRES GLOBALES
    // ----------------------------------------------------
    if (tableCierres) {
        const cierres = window.state.cierres_personal || [];
        
        if (cierres.length === 0) {
            tableCierres.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-8 text-neutral-500 font-bold">
                        No hay cierres de caja/liquidaciones registrados.
                    </td>
                </tr>
            `;
        } else {
            tableCierres.innerHTML = cierres.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(c => `
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td class="px-6 py-4 font-bold text-sm">${window.formatDate(c.fecha)}</td>
                    <td class="px-6 py-4 text-xs font-bold text-neutral-500">
                        ${c.empleadoLiquidado ? c.empleadoLiquidado : 'Global'} (${c.cantidadMovimientos || 0} movs)
                    </td>
                    <td class="px-6 py-4 text-right font-black text-rose-600 dark:text-rose-400">
                        ${window.formatMoney(c.total)}
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="window.openDetalleCierre('${c.id}')" class="px-3 py-1.5 bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 text-[10px] font-black uppercase tracking-wider rounded-lg hover:scale-105 transition-transform flex items-center justify-center mx-auto">
                            <i data-lucide="receipt" class="w-3 h-3 mr-1"></i> Ver
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
    
    // Asegurar que el botón del topbar sea el de Asignar Bono
    const headerActions = document.querySelector('#view-personal .flex.justify-between.items-center .space-x-2.flex');
    if (headerActions) {
        headerActions.innerHTML = `
            <button onclick="window.openModalAsignarBono()" class="bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform flex items-center">
                <i data-lucide="award" class="w-4 h-4 mr-2"></i> Asignar Bono Extra
            </button>
        `;
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
};

// ----------------------------------------------------
// 4. MODAL: DETALLE INDIVIDUAL DEL EMPLEADO (REDISEÑADO)
// ----------------------------------------------------
window.openDetallePersonal = (userId) => {
    const empleado = (window.state.usuarios || []).find(x => x.id === userId);
    
    if (!empleado) {
        return;
    }
    
    // Obtenemos todas sus comisiones ordenadas por fecha (más nuevas arriba)
    const comisiones = (window.state.comisiones || [])
        .filter(c => c.userId === userId)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    const pendientes = comisiones.filter(c => c.estado === 'Pendiente');
    const pagadas = comisiones.filter(c => c.estado === 'Pagada');
    
    const totalPendiente = pendientes.reduce((acc, curr) => acc + curr.monto, 0);
    const totalHistorico = pagadas.reduce((acc, curr) => acc + curr.monto, 0);
    
    // CABECERA DEL EMPLEADO Y BOTÓN LIQUIDAR
    let html = `
        <div class="mb-6 flex flex-col md:flex-row md:justify-between md:items-end border-b border-neutral-200 dark:border-neutral-800 pb-6 gap-4">
            <div class="flex items-center space-x-4">
                <div class="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-black text-3xl flex-shrink-0">
                    ${String(empleado.nombre || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                    <h4 class="text-2xl font-black tracking-tight">${empleado.nombre || 'Sin Nombre'}</h4>
                    <p class="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">${empleado.rol}</p>
                </div>
            </div>
            
            <div class="flex flex-col items-end">
                <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Total a Liquidar</p>
                <div class="flex items-center space-x-3">
                    <span class="text-3xl font-black ${totalPendiente > 0 ? 'text-green-600 dark:text-green-500' : 'text-neutral-400'}">
                        ${window.formatMoney(totalPendiente)}
                    </span>
                    ${totalPendiente > 0 ? `
                        <button onclick="window.liquidarPersonal('${userId}')" class="px-5 py-3 bg-green-600 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg hover:bg-green-700 hover:scale-105 transition-all flex items-center">
                            <i data-lucide="check-circle" class="w-4 h-4 mr-2"></i> Pagar
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <div class="flex justify-end mb-4">
            <button onclick="window.imprimirEstadoCuentaPersonal('${userId}')" class="px-4 py-2 bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center">
                <i data-lucide="printer" class="w-3 h-3 mr-2"></i> Imprimir Estado de Cuenta
            </button>
        </div>
    `;
    
    // SECCIÓN 1: COMISIONES PENDIENTES
    html += `
        <h5 class="font-black text-sm uppercase text-neutral-500 tracking-wider mb-4 flex items-center">
            <i data-lucide="clock" class="w-4 h-4 mr-2 text-amber-500"></i> Por Cobrar (${pendientes.length})
        </h5>
    `;
    
    if (pendientes.length === 0) {
        html += `
            <div class="p-6 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-center mb-8">
                <p class="text-sm font-bold text-neutral-500">No hay comisiones pendientes de pago.</p>
            </div>
        `;
    } else {
        html += `<div class="space-y-3 mb-8">`;
        pendientes.forEach(c => {
            let autoDesc = c.descripcion || 'Bono Manual';
            if (c.ventaId) {
                const v = (window.state.ventas || []).find(x => x.id === c.ventaId);
                if (v) autoDesc = `Venta: ${v.autoDesc}`;
            }
            html += `
                <div class="bg-white dark:bg-neutral-900 border border-green-200 dark:border-green-900/50 p-4 rounded-xl flex flex-col md:flex-row md:justify-between md:items-center shadow-sm">
                    <div class="mb-2 md:mb-0">
                        <span class="text-[10px] font-bold text-neutral-400 block mb-1">${window.formatDate(c.fecha)}</span>
                        <p class="text-sm font-black text-neutral-800 dark:text-neutral-200">${autoDesc}</p>
                    </div>
                    <span class="font-black text-xl text-green-600 dark:text-green-500 text-right">
                        ${window.formatMoney(c.monto)}
                    </span>
                </div>
            `;
        });
        html += `</div>`;
    }

    // SECCIÓN 2: HISTORIAL DE PAGADOS
    html += `
        <h5 class="font-black text-sm uppercase text-neutral-500 tracking-wider mb-4 flex items-center border-t border-neutral-200 dark:border-neutral-800 pt-6">
            <i data-lucide="check-check" class="w-4 h-4 mr-2 text-green-500"></i> Historial Pagado (${pagadas.length})
        </h5>
    `;
    
    if (pagadas.length === 0) {
        html += `
            <div class="p-6 text-center">
                <p class="text-sm font-bold text-neutral-500">Aún no hay registro de pagos anteriores.</p>
            </div>
        `;
    } else {
        html += `<div class="space-y-3">`;
        pagadas.forEach(c => {
            let autoDesc = c.descripcion || 'Bono Manual';
            if (c.ventaId) {
                const v = (window.state.ventas || []).find(x => x.id === c.ventaId);
                if (v) autoDesc = `Venta: ${v.autoDesc}`;
            }
            html += `
                <div class="bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-700 p-4 rounded-xl flex flex-col md:flex-row md:justify-between md:items-center opacity-80 hover:opacity-100 transition-opacity">
                    <div class="mb-2 md:mb-0">
                        <div class="flex items-center space-x-2 mb-1">
                            <span class="text-[10px] font-bold text-neutral-400">Cargado: ${window.formatDate(c.fecha)}</span>
                            <span class="text-[10px] font-bold text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">Pagado el ${window.formatDate(c.fechaPago)}</span>
                        </div>
                        <p class="text-sm font-bold text-neutral-600 dark:text-neutral-400">${autoDesc}</p>
                    </div>
                    <span class="font-black text-lg text-neutral-500 text-right line-through">
                        ${window.formatMoney(c.monto)}
                    </span>
                </div>
            `;
        });
        html += `
            <div class="text-right pt-4">
                <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total Histórico Pagado</p>
                <p class="text-xl font-black text-neutral-800 dark:text-neutral-200">${window.formatMoney(totalHistorico)}</p>
            </div>
        </div>`;
    }
    
    document.getElementById('dp-content').innerHTML = html;
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    window.openModal('modal-detalle-personal');
};

// ----------------------------------------------------
// 5. MODAL: DETALLE DEL TICKET DE CIERRE
// ----------------------------------------------------
window.openDetalleCierre = (cierreId) => {
    const cierre = window.state.cierres_personal.find(c => c.id === cierreId);
    
    if (!cierre) {
        return;
    }
    
    const comisionesPagadas = window.state.comisiones.filter(c => c.cierreId === cierreId);
    
    let html = `
        <div class="mb-6 flex justify-between items-start border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <div>
                <p class="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Ticket de Liquidación</p>
                <h4 class="text-2xl font-black">${window.formatDate(cierre.fecha)}</h4>
                <p class="text-sm font-bold text-neutral-500 mt-1">Ref: ${cierre.empleadoLiquidado || 'Global'}</p>
            </div>
            <div class="flex flex-col items-end">
                <p class="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total Abonado</p>
                <p class="text-3xl font-black text-rose-600 dark:text-rose-500">${window.formatMoney(cierre.total)}</p>
                
                <button onclick="window.imprimirTicketCierre('${cierreId}')" class="mt-4 px-4 py-2 bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center">
                    <i data-lucide="printer" class="w-3 h-3 mr-2"></i> Imprimir Comprobante
                </button>
            </div>
        </div>
        
        <h5 class="font-black text-sm uppercase text-neutral-500 tracking-wider mb-4 flex items-center">
            <i data-lucide="list" class="w-4 h-4 mr-2"></i> Desglose de Movimientos (${comisionesPagadas.length})
        </h5>
    `;
    
    if (comisionesPagadas.length === 0) {
        html += `<p class="text-neutral-500 text-sm font-bold italic">El detalle no está disponible.</p>`;
    } else {
        // Agrupamos por usuario por si en el futuro se hacen tickets globales nuevamente
        const agrupado = {};
        comisionesPagadas.forEach(c => {
            if (!agrupado[c.userId]) {
                agrupado[c.userId] = { total: 0, items: [] };
            }
            agrupado[c.userId].total += c.monto;
            agrupado[c.userId].items.push(c);
        });
        
        html += `<div class="space-y-6 pb-4">`;
        
        for (let userId in agrupado) {
            const u = window.state.usuarios.find(x => x.id === userId);
            const nombre = u ? (u.nombre || 'Sin Nombre') : 'Usuario Eliminado';
            const userGroup = agrupado[userId];
            
            html += `
                <div class="bg-neutral-50 dark:bg-neutral-800/30 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <div class="flex justify-between items-center mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                        <span class="font-black text-lg">${nombre}</span>
                        <span class="font-black text-green-600 dark:text-green-500">${window.formatMoney(userGroup.total)}</span>
                    </div>
                    <div class="space-y-3">
                        ${userGroup.items.map(item => {
                            let autoDesc = item.descripcion || 'Carga Manual / Bono';
                            if (item.ventaId) {
                                const v = window.state.ventas.find(x => x.id === item.ventaId);
                                if (v) autoDesc = `Venta: ${v.autoDesc}`;
                            }
                            return `
                                <div class="flex justify-between items-center text-sm bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                    <div class="flex-1 pr-4">
                                        <p class="font-bold text-neutral-800 dark:text-neutral-200">${autoDesc}</p>
                                        <p class="text-[10px] text-neutral-400 font-bold mt-1">Cargado: ${window.formatDate(item.fecha)}</p>
                                    </div>
                                    <span class="font-black text-neutral-800 dark:text-neutral-200">${window.formatMoney(item.monto)}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        html += `</div>`;
    }
    
    document.getElementById('dc-content').innerHTML = html;
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    window.openModal('modal-detalle-cierre');
};

// ----------------------------------------------------
// 6. FUNCIONES DE IMPRESIÓN (Estado de cuenta y Ticket)
// ----------------------------------------------------
window.imprimirEstadoCuentaPersonal = (userId) => {
    const empleado = window.state.usuarios.find(x => x.id === userId);
    
    if (!empleado) {
        return;
    }
    
    const comisiones = (window.state.comisiones || [])
        .filter(c => c.userId === userId)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
    const pendientes = comisiones.filter(c => c.estado === 'Pendiente');
    const totalPendiente = pendientes.reduce((acc, curr) => acc + curr.monto, 0);
    
    const printContent = document.getElementById('print-content');
    const hoy = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    
    let html = `
        <div style="font-family: Arial, sans-serif; color: #000; padding: 20px;">
            <h2 style="text-align: center; font-size: 24px; text-transform: uppercase; margin-bottom: 5px;">Estado de Cuenta - Comisiones</h2>
            <p style="text-align: center; color: #555; font-size: 14px; margin-bottom: 30px;">Fecha de emisión: ${hoy}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; width: 30%;">Empleado</td>
                    <td style="padding: 10px; border: 1px solid #ddd; font-size: 18px; font-weight: bold;">${empleado.nombre}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Rol</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${empleado.rol}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Saldo Pendiente de Cobro</td>
                    <td style="padding: 10px; border: 1px solid #ddd; font-size: 20px; font-weight: bold; color: #16a34a;">${window.formatMoney(totalPendiente)}</td>
                </tr>
            </table>
            
            <h3 style="font-size: 18px; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px;">Detalle de Movimientos Pendientes</h3>
    `;
    
    if (pendientes.length === 0) {
        html += `<p style="text-align: center; font-style: italic; color: #555;">No hay comisiones pendientes de pago al día de la fecha.</p>`;
    } else {
        html += `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f1f1f1; text-align: left;">
                        <th style="padding: 10px; border: 1px solid #ddd;">Fecha Venta/Carga</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Concepto</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Monto</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        pendientes.forEach(c => {
            let autoDesc = c.descripcion || 'Carga Manual';
            if (c.ventaId) {
                const v = window.state.ventas.find(x => x.id === c.ventaId);
                if (v) autoDesc = `Venta: ${v.autoDesc}`;
            }
            html += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${window.formatDate(c.fecha)}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${autoDesc}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${window.formatMoney(c.monto)}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
                <tfoot>
                    <tr style="background-color: #f9f9f9;">
                        <td colspan="2" style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 16px;">TOTAL A LIQUIDAR</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 18px;">${window.formatMoney(totalPendiente)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
    }
    
    html += `
        <div style="margin-top: 80px; display: flex; justify-content: space-around;">
            <div style="text-align: center;">
                <p style="border-top: 1px solid #000; padding-top: 5px; width: 200px;">Firma del Empleado</p>
            </div>
            <div style="text-align: center;">
                <p style="border-top: 1px solid #000; padding-top: 5px; width: 200px;">Firma Rivas Auto</p>
            </div>
        </div>
        </div>
    `;
    
    printContent.innerHTML = html;
    window.print();
};

window.imprimirTicketCierre = (cierreId) => {
    const cierre = window.state.cierres_personal.find(c => c.id === cierreId);
    
    if (!cierre) {
        return;
    }
    
    const comisionesPagadas = window.state.comisiones.filter(c => c.cierreId === cierreId);
    const printContent = document.getElementById('print-content');
    
    let html = `
        <div style="font-family: Arial, sans-serif; color: #000; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px dashed #ccc;">
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 20px;">
                <h2 style="font-size: 22px; text-transform: uppercase; margin: 0 0 10px 0;">Recibo de Liquidación</h2>
                <h1 style="font-size: 32px; margin: 0;">RIVAS AUTO</h1>
                <p style="font-size: 14px; color: #555; margin: 10px 0 0 0;">Comprobante de pago interno</p>
            </div>
            
            <table style="width: 100%; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 5px 0;"><strong>Fecha de Pago:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">${window.formatDate(cierre.fecha)}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;"><strong>Beneficiario:</strong></td>
                    <td style="padding: 5px 0; text-align: right; font-size: 18px; font-weight: bold;">${cierre.empleadoLiquidado || 'Pago Global'}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;"><strong>Cant. Movimientos:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">${cierre.cantidadMovimientos || comisionesPagadas.length} items</td>
                </tr>
            </table>
            
            <h3 style="font-size: 16px; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">Detalle Cubierto:</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    `;
    
    comisionesPagadas.forEach(item => {
        let autoDesc = item.descripcion || 'Bono / Manual';
        if (item.ventaId) {
            const v = window.state.ventas.find(x => x.id === item.ventaId);
            if (v) autoDesc = v.autoDesc;
        }
        
        html += `
            <tr>
                <td style="padding: 8px 0; border-bottom: 1px dotted #ccc; font-size: 14px;">${autoDesc} <br><small style="color: #666;">Orig: ${window.formatDate(item.fecha)}</small></td>
                <td style="padding: 8px 0; border-bottom: 1px dotted #ccc; text-align: right; font-weight: bold;">${window.formatMoney(item.monto)}</td>
            </tr>
        `;
    });
    
    html += `
            </table>
            
            <div style="background-color: #f1f1f1; padding: 15px; border-radius: 5px; text-align: right;">
                <p style="margin: 0; font-size: 14px; text-transform: uppercase;">Total Liquidado</p>
                <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold;">${window.formatMoney(cierre.total)}</p>
            </div>
            
            <div style="margin-top: 60px; text-align: center;">
                <p style="border-top: 1px solid #000; padding-top: 5px; width: 250px; margin: 0 auto; font-size: 14px;">Firma Conforme Recibí</p>
                <p style="font-size: 12px; color: #777; margin-top: 5px;">${cierre.empleadoLiquidado || ''}</p>
            </div>
        </div>
    `;
    
    printContent.innerHTML = html;
    window.print();
};
