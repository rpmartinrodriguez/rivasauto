// ==========================================
// js/render/renderCaja.js
// ==========================================

window.renderCajaView = () => {
    const table = document.getElementById('caja-table');
    const statsContainer = document.getElementById('caja-stats');
    const filterContainer = document.getElementById('caja-filters-container');
    const btnPendientes = document.getElementById('btn-ver-pendientes');
    
    if (!table || !statsContainer) return;

    const currentRole = window.state.currentUser.rol;
    const currentUserId = window.state.currentUser.id;
    const currentSuc = window.state.currentUser.sucursalId;

    // 1. Mostrar botón de "Cobros Pendientes" solo si hay permisos
    if (currentRole === 'Admin' || currentRole === 'Encargado') {
        if(btnPendientes) btnPendientes.classList.remove('hidden');
    }

    // 2. Construir el Dropdown de Filtro según el Rol del usuario
    if (filterContainer) {
        let optionsHtml = `<option value="">Todas mis cajas visibles</option>`;
        
        let usersToFilter = [];
        if (currentRole === 'Admin') {
            usersToFilter = window.state.usuarios;
        } else if (currentRole === 'Encargado') {
            usersToFilter = window.state.usuarios.filter(u => u.sucursalId === currentSuc && u.rol !== 'Admin');
        } else {
            usersToFilter = [window.state.currentUser];
        }

        // Si ve a más de 1 usuario, le mostramos el menú para filtrar
        if (usersToFilter.length > 1) {
            usersToFilter.forEach(u => {
                optionsHtml += `<option value="${u.id}">${u.nombre} (${u.rol})</option>`;
            });
            
            // Guardamos el valor seleccionado si ya existía antes de repintar
            const currentFilterVal = document.getElementById('caja-user-filter')?.value || '';
            
            filterContainer.innerHTML = `
                <div class="flex items-center space-x-2 bg-white dark:bg-neutral-900 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <i data-lucide="filter" class="w-4 h-4 text-neutral-400 ml-2"></i>
                    <select id="caja-user-filter" onchange="window.renderCajaView()" class="bg-transparent border-none outline-none text-sm font-bold text-neutral-700 dark:text-neutral-300 pr-2">
                        ${optionsHtml}
                    </select>
                </div>
            `;
            // Restauramos la selección
            if(document.getElementById('caja-user-filter')) {
                document.getElementById('caja-user-filter').value = currentFilterVal;
            }
            filterContainer.classList.remove('hidden');
        } else {
            filterContainer.classList.add('hidden');
            filterContainer.innerHTML = '';
        }
    }

    // 3. Filtrar las transacciones de caja según el rol y lo elegido en el selector
    const selectedUserId = document.getElementById('caja-user-filter')?.value || '';
    
    let transacciones = (window.state.transacciones || []).filter(t => {
        // Regla base de visibilidad
        let isVisible = false;
        if (currentRole === 'Admin') {
            isVisible = true;
        } else if (currentRole === 'Vendedor') {
            isVisible = (t.userId === currentUserId);
        } else if (currentRole === 'Encargado') {
            const tUser = window.state.usuarios.find(u => u.id === t.userId);
            if (tUser && tUser.sucursalId === currentSuc && tUser.rol !== 'Admin') {
                isVisible = true;
            }
        }

        // Si pasó la regla base y además hay un filtro selecto, lo aplicamos
        if (isVisible && selectedUserId !== '') {
            return t.userId === selectedUserId;
        }
        return isVisible;
    });

    // Ordenamos cronológicamente
    transacciones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    let saldo = 0;
    let totalIngresos = 0;
    let totalEgresos = 0;
    let rowsHtml = '';
    
    // Calculamos totales y armamos la tabla
    transacciones.forEach(t => {
        const monto = Number(t.valor) || 0;
        if (t.tipo === 'ingreso') {
            saldo += monto;
            totalIngresos += monto;
        } else {
            saldo -= monto;
            totalEgresos += monto;
        }

        const montoClass = t.tipo === 'ingreso' ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-500';
        const signo = t.tipo === 'ingreso' ? '+' : '-';
        
        const u = window.state.usuarios.find(x => x.id === t.userId);
        const userName = u ? u.nombre : 'Usuario Desconocido';
        
        let detalleAuto = '';
        if (t.autoId) {
            const auto = window.state.autos.find(x => x.id === t.autoId);
            if (auto) {
                detalleAuto = `<span class="block text-[10px] text-green-600 font-bold mt-1 uppercase">Ref: ${auto.marca} ${auto.modelo} (${auto.patente})</span>`;
            }
        }

        // Agregamos al principio (para que los más nuevos queden arriba)
        rowsHtml = `
            <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <td class="px-6 py-4 text-xs font-bold text-neutral-500">${window.formatDate(t.fecha)}</td>
                <td class="px-6 py-4">
                    <p class="font-bold text-sm text-neutral-800 dark:text-neutral-200">${t.descripcion}</p>
                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">${t.categoria} ${t.tipoComprobante !== 'X' ? `| FACT: ${t.tipoComprobante} ${t.numComprobante}` : ''}</p>
                    ${detalleAuto}
                </td>
                <td class="px-6 py-4 text-xs font-bold uppercase text-neutral-500">${userName}</td>
                <td class="px-6 py-4 text-right font-black ${montoClass}">
                    ${signo} ${window.formatMoney(monto)}
                </td>
                <td class="px-6 py-4 text-right font-black text-lg">
                    ${window.formatMoney(saldo)}
                </td>
            </tr>
        ` + rowsHtml; 
    });

    if (transacciones.length === 0) {
        rowsHtml = `<tr><td colspan="5" class="text-center py-8 text-neutral-500 font-bold">No hay movimientos registrados en esta caja.</td></tr>`;
    }

    table.innerHTML = rowsHtml;

    // Pintar tarjetas de estadísticas
    statsContainer.innerHTML = `
        <div class="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
            <p class="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Ingresos Totales</p>
            <p class="text-2xl font-black text-green-600 dark:text-green-500">${window.formatMoney(totalIngresos)}</p>
        </div>
        <div class="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
            <p class="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Egresos Totales</p>
            <p class="text-2xl font-black text-rose-600 dark:text-rose-500">${window.formatMoney(totalEgresos)}</p>
        </div>
        <div class="bg-black text-white dark:bg-white dark:text-black p-6 rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 opacity-10"><i data-lucide="wallet" class="w-32 h-32"></i></div>
            <p class="text-xs font-bold uppercase tracking-widest mb-2 opacity-80 relative z-10">Saldo Operativo Final</p>
            <p class="text-4xl font-black relative z-10">${window.formatMoney(saldo)}</p>
        </div>
    `;

    if(window.lucide) window.lucide.createIcons();
};

window.openModalPendientes = () => {
    const contenedor = document.getElementById('pendientes-list-content');
    if (!contenedor) return;

    let html = '';
    const ventasPendientes = window.state.ventas.filter(v => 
        (v.credito && v.credito.pagadas < v.credito.cuotas) || 
        (v.pagare && v.pagare.pagadas < v.pagare.cuotas)
    );

    if (ventasPendientes.length === 0) {
        html = '<p class="text-center text-neutral-500 font-bold italic py-8">No hay cuotas pendientes de cobro en este momento.</p>';
    } else {
        html = `<div class="space-y-4">`;
        ventasPendientes.forEach(v => {
            html += `
                <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-5 rounded-2xl shadow-sm">
                    <div class="flex justify-between items-start mb-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <div>
                            <h4 class="font-black text-lg">${v.compradorNombre}</h4>
                            <p class="text-xs font-bold text-neutral-500 uppercase mt-1">Tel: ${v.compradorTelefono || 'S/N'}</p>
                        </div>
                        <span class="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500 text-[10px] font-bold uppercase rounded">Venta: ${v.autoDesc}</span>
                    </div>
            `;
            
            if (v.credito && v.credito.pagadas < v.credito.cuotas) {
                const numCuota = v.credito.pagadas + 1;
                html += `
                    <div class="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl mb-2 border border-neutral-100 dark:border-neutral-700">
                        <div>
                            <p class="text-xs font-bold text-neutral-500 uppercase">Cuota Crédito #${numCuota} de ${v.credito.cuotas}</p>
                            <p class="font-black text-lg text-neutral-800 dark:text-neutral-200">${window.formatMoney(v.credito.valorCuota)}</p>
                        </div>
                        <button onclick="window.cobrarCuotaVenta('${v.id}', 'credito')" class="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-bold text-xs uppercase rounded-lg shadow-md hover:scale-105 transition-transform">
                            <span id="btn-txt-credito-${v.id}">Cobrar y a Caja</span>
                        </button>
                    </div>
                `;
            }

            if (v.pagare && v.pagare.pagadas < v.pagare.cuotas) {
                const numCuota = v.pagare.pagadas + 1;
                html += `
                    <div class="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl mb-2 border border-neutral-100 dark:border-neutral-700">
                        <div>
                            <p class="text-xs font-bold text-neutral-500 uppercase">Pagaré #${numCuota} de ${v.pagare.cuotas}</p>
                            <p class="font-black text-lg text-neutral-800 dark:text-neutral-200">${window.formatMoney(v.pagare.valorCuota)}</p>
                        </div>
                        <button onclick="window.cobrarCuotaVenta('${v.id}', 'pagare')" class="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-bold text-xs uppercase rounded-lg shadow-md hover:scale-105 transition-transform">
                            <span id="btn-txt-pagare-${v.id}">Cobrar y a Caja</span>
                        </button>
                    </div>
                `;
            }

            html += `</div>`;
        });
        html += `</div>`;
    }

    contenedor.innerHTML = html;
    window.openModal('modal-pendientes');
};
