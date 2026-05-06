// ==========================================
// js/render/renderAdmin.js
// ==========================================

window.renderResumenesView = () => {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    // Filtro de seguridad: Solo el Administrador puede ver los números sensibles
    if (window.state.currentUser?.rol !== 'Admin') {
        container.className = "flex justify-center items-center h-64";
        container.innerHTML = `
            <div class="text-center p-8 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-3xl w-full max-w-md">
                <i data-lucide="shield-alert" class="w-12 h-12 text-rose-500 mx-auto mb-4"></i>
                <h3 class="text-lg font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest">Acceso Denegado</h3>
                <p class="text-sm font-bold text-rose-600 dark:text-rose-500 mt-2">Esta sección contiene datos financieros y es exclusiva para administradores.</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    // Quitamos la grilla por defecto del contenedor para armar nuestro propio layout
    container.className = "flex flex-col space-y-8 w-full";

    // --- PROCESAMIENTO DE DATOS ---
    const now = new Date();
    const mesActual = now.getMonth();
    const añoActual = now.getFullYear();

    // 1. Análisis de Stock (Capital Inmovilizado)
    const autosDisponibles = (window.state.autos || []).filter(a => a.estado !== 'Vendido');
    const totalAutos = autosDisponibles.length;
    const costoTotalInvertido = autosDisponibles.reduce((acc, a) => acc + (Number(a.costo) || 0), 0);
    const valorTotalReventa = autosDisponibles.reduce((acc, a) => acc + (Number(a.precio) || 0), 0);
    const gananciaBrutaPotencial = valorTotalReventa - costoTotalInvertido;

    // 2. Análisis de Ventas (Mes Actual)
    const ventasMes = (window.state.ventas || []).filter(v => {
        const d = new Date(v.fecha);
        return d.getMonth() === mesActual && d.getFullYear() === añoActual;
    });
    const cantidadVentasMes = ventasMes.length;
    const facturacionMes = ventasMes.reduce((acc, v) => acc + (Number(v.montoTotal) || 0), 0);

    // Ranking de Vendedores
    const rankingVendedores = {};
    (window.state.ventas || []).forEach(v => {
        if (!rankingVendedores[v.userId]) {
            rankingVendedores[v.userId] = { qty: 0, total: 0 };
        }
        rankingVendedores[v.userId].qty++;
        rankingVendedores[v.userId].total += (Number(v.montoTotal) || 0);
    });

    const topVendedores = Object.keys(rankingVendedores).map(uid => {
        const u = (window.state.usuarios || []).find(x => x.id === uid);
        return {
            nombre: u ? u.nombre : 'Usuario Eliminado',
            qty: rankingVendedores[uid].qty,
            total: rankingVendedores[uid].total
        };
    }).sort((a, b) => b.qty - a.qty).slice(0, 5); // Top 5

    const maxVentasTop = topVendedores.length > 0 ? topVendedores[0].qty : 1;

    // 3. Análisis de Caja Chica (Egresos del Mes)
    const transaccionesMes = (window.state.transacciones || []).filter(t => {
        const d = new Date(t.fecha);
        return d.getMonth() === mesActual && d.getFullYear() === añoActual;
    });
    
    const gastosMes = transaccionesMes.filter(t => t.tipo === 'gasto');
    const totalGastosMes = gastosMes.reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

    const agrupacionGastos = {};
    gastosMes.forEach(g => {
        const cat = g.categoria || 'Sin Categoría';
        if (!agrupacionGastos[cat]) agrupacionGastos[cat] = 0;
        agrupacionGastos[cat] += (Number(g.valor) || 0);
    });

    const topGastos = Object.keys(agrupacionGastos).map(cat => {
        return { categoria: cat, monto: agrupacionGastos[cat] };
    }).sort((a, b) => b.monto - a.monto);

    // 4. Análisis CRM
    const leads = window.state.consultas || [];
    const totalLeads = leads.length;
    const leadsCalientes = leads.filter(l => l.estadoLead === 'Caliente').length;
    const leadsTibios = leads.filter(l => l.estadoLead === 'Tibio').length;
    const leadsFrios = leads.filter(l => l.estadoLead === 'Frío').length;

    const porcCaliente = totalLeads > 0 ? (leadsCalientes / totalLeads) * 100 : 0;
    const porcTibio = totalLeads > 0 ? (leadsTibios / totalLeads) * 100 : 0;
    const porcFrio = totalLeads > 0 ? (leadsFrios / totalLeads) * 100 : 0;

    // --- CONSTRUCCIÓN DE LA INTERFAZ (HTML) ---
    
    // Mes formateado para los títulos
    const nombreMes = new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' });

    let html = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div class="bg-gradient-to-br from-neutral-900 to-black text-white p-6 rounded-3xl shadow-xl relative overflow-hidden transform hover:scale-[1.02] transition-transform">
                <div class="absolute -right-4 -bottom-4 opacity-10"><i data-lucide="vault" class="w-32 h-32"></i></div>
                <div class="relative z-10">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Capital en Calle (Stock)</p>
                    <h3 class="text-3xl font-black text-white">${window.formatMoney(costoTotalInvertido)}</h3>
                    <div class="mt-4 pt-4 border-t border-neutral-800">
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-neutral-400 font-bold">Autos Físicos:</span>
                            <span class="font-black text-green-400">${totalAutos} Unidades</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm transform hover:scale-[1.02] transition-transform">
                <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1 flex items-center">
                    <i data-lucide="trending-up" class="w-3 h-3 mr-1 text-green-500"></i> Ganancia Bruta Potencial
                </p>
                <h3 class="text-3xl font-black text-green-600 dark:text-green-500">${window.formatMoney(gananciaBrutaPotencial)}</h3>
                <div class="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-neutral-500 font-bold">Valorizado de Venta:</span>
                        <span class="font-black text-neutral-800 dark:text-neutral-200">${window.formatMoney(valorTotalReventa)}</span>
                    </div>
                </div>
            </div>

            <div class="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm transform hover:scale-[1.02] transition-transform">
                <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1 flex items-center capitalize">
                    <i data-lucide="badge-dollar-sign" class="w-3 h-3 mr-1 text-blue-500"></i> Operado en ${nombreMes}
                </p>
                <h3 class="text-3xl font-black text-blue-600 dark:text-blue-500">${window.formatMoney(facturacionMes)}</h3>
                <div class="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-neutral-500 font-bold">Operaciones Cerradas:</span>
                        <span class="font-black text-neutral-800 dark:text-neutral-200">${cantidadVentasMes} Ventas</span>
                    </div>
                </div>
            </div>

            <div class="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm transform hover:scale-[1.02] transition-transform">
                <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1 flex items-center capitalize">
                    <i data-lucide="arrow-down-right" class="w-3 h-3 mr-1 text-rose-500"></i> Gastos de ${nombreMes}
                </p>
                <h3 class="text-3xl font-black text-rose-600 dark:text-rose-500">${window.formatMoney(totalGastosMes)}</h3>
                <div class="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-neutral-500 font-bold">Movimientos:</span>
                        <span class="font-black text-neutral-800 dark:text-neutral-200">${gastosMes.length} Registros</span>
                    </div>
                </div>
            </div>

        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div class="lg:col-span-1 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col">
                <h4 class="font-black text-lg mb-6 uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center">
                    <i data-lucide="medal" class="w-5 h-5 mr-2 text-amber-500"></i> Top Vendedores
                </h4>
    `;

    if (topVendedores.length === 0) {
        html += `<p class="text-neutral-500 text-sm font-bold text-center italic my-auto">Aún no hay ventas registradas.</p>`;
    } else {
        html += `<div class="space-y-5 flex-1">`;
        topVendedores.forEach((v, index) => {
            const porcentajeWidth = (v.qty / maxVentasTop) * 100;
            const medalColor = index === 0 ? 'text-yellow-400' : (index === 1 ? 'text-gray-400' : (index === 2 ? 'text-amber-700' : 'text-neutral-200 dark:text-neutral-800'));
            
            html += `
                <div>
                    <div class="flex justify-between items-end mb-1">
                        <div class="flex items-center space-x-2">
                            <i data-lucide="award" class="w-4 h-4 ${medalColor}"></i>
                            <span class="font-black text-sm text-neutral-800 dark:text-neutral-200">${v.nombre}</span>
                        </div>
                        <span class="font-black text-xs text-neutral-500">${v.qty} ventas</span>
                    </div>
                    <div class="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                        <div class="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full" style="width: ${porcentajeWidth}%"></div>
                    </div>
                    <p class="text-[10px] font-bold text-neutral-400 text-right mt-1">Generado: ${window.formatMoney(v.total)}</p>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `
            </div>

            <div class="lg:col-span-1 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col">
                <h4 class="font-black text-lg mb-6 uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center">
                    <i data-lucide="pie-chart" class="w-5 h-5 mr-2 text-rose-500"></i> Fuga por Categorías
                </h4>
    `;

    if (topGastos.length === 0) {
        html += `<p class="text-neutral-500 text-sm font-bold text-center italic my-auto">Sin gastos en el mes actual.</p>`;
    } else {
        html += `<div class="space-y-4 overflow-y-auto no-scrollbar max-h-80 flex-1">`;
        topGastos.forEach(g => {
            const porcGasto = (g.monto / totalGastosMes) * 100;
            html += `
                <div class="bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-black uppercase text-neutral-700 dark:text-neutral-300">${g.categoria}</span>
                        <span class="text-sm font-black text-rose-600 dark:text-rose-500">${window.formatMoney(g.monto)}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden flex-1">
                            <div class="bg-rose-500 h-1.5 rounded-full" style="width: ${porcGasto}%"></div>
                        </div>
                        <span class="text-[10px] font-bold text-neutral-500 w-8 text-right">${porcGasto.toFixed(0)}%</span>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `
            </div>

            <div class="lg:col-span-1 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                <div>
                    <h4 class="font-black text-lg mb-2 uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center">
                        <i data-lucide="users" class="w-5 h-5 mr-2 text-blue-500"></i> Termómetro CRM
                    </h4>
                    <p class="text-xs font-bold text-neutral-500 mb-6">Temperatura de tu cartera total de clientes.</p>
                </div>
                
                <div class="flex items-end space-x-2 h-40 mb-6">
                    <div class="flex flex-col items-center flex-1 h-full justify-end">
                        <span class="text-xs font-black text-blue-500 mb-2">${leadsFrios}</span>
                        <div class="w-full bg-blue-500 rounded-t-lg transition-all duration-1000" style="height: ${porcFrio}%;"></div>
                        <span class="text-[10px] font-bold uppercase text-neutral-500 mt-2">Fríos</span>
                    </div>
                    <div class="flex flex-col items-center flex-1 h-full justify-end">
                        <span class="text-xs font-black text-amber-500 mb-2">${leadsTibios}</span>
                        <div class="w-full bg-amber-500 rounded-t-lg transition-all duration-1000" style="height: ${porcTibio}%;"></div>
                        <span class="text-[10px] font-bold uppercase text-neutral-500 mt-2">Tibios</span>
                    </div>
                    <div class="flex flex-col items-center flex-1 h-full justify-end">
                        <span class="text-xs font-black text-rose-500 mb-2">${leadsCalientes}</span>
                        <div class="w-full bg-rose-500 rounded-t-lg transition-all duration-1000" style="height: ${porcCaliente}%;"></div>
                        <span class="text-[10px] font-bold uppercase text-neutral-500 mt-2">Calientes</span>
                    </div>
                </div>

                <div class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                        <p class="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-widest">Total en Base de Datos</p>
                        <p class="font-black text-2xl text-blue-800 dark:text-blue-300">${totalLeads} Clientes</p>
                    </div>
                    <i data-lucide="database" class="w-8 h-8 text-blue-300 dark:text-blue-700 opacity-50"></i>
                </div>
            </div>

        </div>
    `;

    container.innerHTML = html;

    if (window.lucide) {
        window.lucide.createIcons();
    }
};

// --------------------------------------------------------
// RENDERIZADO DEL PANEL DE ADMINISTRACIÓN (USUARIOS Y SUCURSALES)
// --------------------------------------------------------
window.renderAdminView = () => {
    // Seguridad: Solo Admins
    if (window.state.currentUser?.rol !== 'Admin') {
        return;
    }
    
    // 1. Llenar Select de Sucursales en el formulario de creación de usuario
    const selectSuc = document.getElementById('new-user-suc');
    if (selectSuc) {
        selectSuc.innerHTML = window.state.sucursales.map(s => 
            `<option value="${s.id}">${s.nombre}</option>`
        ).join('');
    }

    // 2. Llenar la Lista de Usuarios del Sistema
    const usersList = document.getElementById('admin-users-list');
    if (usersList) {
        usersList.innerHTML = window.state.usuarios.map(u => {
            const suc = window.state.sucursales.find(s => s.id == u.sucursalId)?.nombre || 'Sin Asignar';
            return `
                <div class="flex justify-between items-center p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm hover:border-green-300 dark:hover:border-green-700 transition-colors">
                    <div>
                        <p class="font-black text-sm text-neutral-800 dark:text-neutral-100">${u.nombre}</p>
                        <p class="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">${u.rol} • ${suc}</p>
                    </div>
                    <div class="flex space-x-1">
                        <button onclick="window.editUser('${u.id}')" class="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="window.deleteUser('${u.id}')" class="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors" title="Eliminar">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 3. Llenar la Lista de Sucursales
    const sucList = document.getElementById('admin-suc-list');
    if (sucList) {
        sucList.innerHTML = window.state.sucursales.map(s => `
            <div class="flex justify-between items-center p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm hover:border-green-300 dark:hover:border-green-700 transition-colors">
                <p class="font-black text-sm text-neutral-800 dark:text-neutral-100">${s.nombre}</p>
                <div class="flex space-x-1">
                    <button onclick="window.editSucursal('${s.id}')" class="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button onclick="window.deleteSucursal('${s.id}')" class="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors" title="Eliminar">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Re-renderizamos iconos
    if(window.lucide) {
        window.lucide.createIcons();
    }
};
