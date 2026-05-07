// ==========================================
// js/render/renderAutos.js
// ==========================================

window.renderAutosView = () => {
    const container = document.getElementById('autos-container');
    
    if (!container) {
        return;
    }

    const query = (document.getElementById('search-autos')?.value || '').toLowerCase();
    const mode = window.state.autosViewMode || 'grid';

    // Filtrar autos que no estén vendidos para la vista principal de stock
    let autos = window.state.autos.filter(a => a.estado !== 'Vendido');

    // Aplicar búsqueda por patente, marca o modelo
    if (query) {
        autos = autos.filter(a => 
            a.patente.toLowerCase().includes(query) || 
            a.marca.toLowerCase().includes(query) || 
            a.modelo.toLowerCase().includes(query)
        );
    }

    if (autos.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-20 text-center">
                <i data-lucide="car-front" class="w-12 h-12 text-neutral-300 mx-auto mb-4"></i>
                <p class="text-neutral-500 font-bold uppercase tracking-widest text-sm">
                    No se encontraron vehículos en stock
                </p>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
        return;
    }

    if (mode === 'grid') {
        container.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";
        
        container.innerHTML = autos.map(a => {
            const colorEstado = a.estado === 'Disponible' 
                ? 'bg-green-500' 
                : (a.estado === 'Señado' ? 'bg-purple-500' : 'bg-amber-500');
            
            // INTELIGENCIA CRM: Ver si este auto tiene interesados
            const interesados = (window.state.consultas || []).filter(c => {
                const interes = (c.marcaInteres || '').toLowerCase();
                return interes.includes(a.marca.toLowerCase()) || interes.includes(a.modelo.toLowerCase());
            });

            let badgeInteresados = '';
            if (interesados.length > 0) {
                badgeInteresados = `
                    <div class="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center animate-bounce z-20">
                        <i data-lucide="zap" class="w-3 h-3 mr-1"></i> 
                        ${interesados.length} INTERESADOS
                    </div>
                `;
            }

            return `
                <div onclick="window.openDetalleAuto('${a.id}')" class="group bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden relative">
                    
                    ${badgeInteresados}
                    
                    <div class="absolute top-4 right-4 z-10">
                        <span class="flex h-3 w-3">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${colorEstado} opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 ${colorEstado}"></span>
                        </span>
                    </div>
                    
                    <div class="p-6">
                        <div class="mb-4">
                            <p class="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">
                                ${a.marca}
                            </p>
                            <h3 class="text-xl font-black text-neutral-800 dark:text-neutral-100 leading-tight group-hover:text-green-600 transition-colors">
                                ${a.modelo}
                            </h3>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-2xl">
                                <p class="text-[9px] font-bold text-neutral-400 uppercase mb-1">Año</p>
                                <p class="text-sm font-black">${a.año}</p>
                            </div>
                            <div class="bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-2xl">
                                <p class="text-[9px] font-bold text-neutral-400 uppercase mb-1">Km</p>
                                <p class="text-sm font-black">${new Intl.NumberFormat('es-AR').format(a.km)}</p>
                            </div>
                        </div>

                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                                    Precio Sugerido
                                </p>
                                <p class="text-2xl font-black text-neutral-900 dark:text-white">
                                    ${window.formatMoney(a.precio, a.moneda)}
                                </p>
                            </div>
                            <div class="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all">
                                <i data-lucide="arrow-right" class="w-5 h-5"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } else {
        // MODO LISTA
        container.className = "flex flex-col space-y-3";
        container.innerHTML = `
            <div class="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-[2rem] overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="text-[10px] uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-800/30">
                                <th class="px-6 py-4 font-bold">Vehículo</th>
                                <th class="px-6 py-4 font-bold text-center">Año / Km</th>
                                <th class="px-6 py-4 font-bold text-center">Estado</th>
                                <th class="px-6 py-4 font-bold text-right">Precio</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                            ${autos.map(a => `
                                <tr onclick="window.openDetalleAuto('${a.id}')" class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer">
                                    <td class="px-6 py-4">
                                        <p class="font-black text-sm text-neutral-800 dark:text-neutral-100">
                                            ${a.marca} ${a.modelo}
                                        </p>
                                        <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                                            ${a.patente}
                                        </p>
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        <p class="text-sm font-bold">${a.año}</p>
                                        <p class="text-[10px] font-bold text-neutral-400 uppercase">
                                            ${new Intl.NumberFormat('es-AR').format(a.km)} KM
                                        </p>
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${a.estado === 'Disponible' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500'}">
                                            ${a.estado}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-right font-black text-lg text-neutral-800 dark:text-neutral-200">
                                        ${window.formatMoney(a.precio, a.moneda)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
};

window.renderDetalleAuto = () => {
    const autoId = window.state.selectedAutoId;
    const auto = window.state.autos.find(x => x.id === autoId);
    
    if (!auto) {
        return;
    }

    const content = document.getElementById('da-content');
    const headerActions = document.getElementById('da-header-actions');
    const isAdmin = window.state.currentUser.rol === 'Admin';

    // 1. HEADER ACTIONS
    let headerHtml = '';
    if (isAdmin) {
        headerHtml = `
            <button onclick="window.editAuto('${auto.id}')" class="p-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-blue-500 transition-colors shadow-sm">
                <i data-lucide="edit-3" class="w-5 h-5"></i>
            </button>
            <button onclick="window.deleteAuto('${auto.id}')" class="p-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
        `;
    }
    headerActions.innerHTML = headerHtml;

    // 2. TABS DE NAVEGACIÓN INTERNA
    const activeTab = window.state.daActiveSection || 'info'; // Por defecto 'info'
    const tabClass = "px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative flex-shrink-0";
    const activeTabClass = "text-green-600 dark:text-green-500 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-green-500 after:rounded-t-full";
    const inactiveTabClass = "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200";

    let html = `
        <div class="flex items-center space-x-1 border-b border-neutral-100 dark:border-neutral-800 mb-8 overflow-x-auto no-scrollbar">
            <button onclick="window.switchDASection('info')" class="${tabClass} ${activeTab === 'info' ? activeTabClass : inactiveTabClass}">
                Ficha Técnica
            </button>
            <button onclick="window.switchDASection('crm')" class="${tabClass} ${activeTab === 'crm' ? activeTabClass : inactiveTabClass}">
                Interesados CRM
            </button>
            <button onclick="window.switchDASection('taller')" class="${tabClass} ${activeTab === 'taller' ? activeTabClass : inactiveTabClass}">
                Gastos Taller
            </button>
            <button onclick="window.switchDASection('docs')" class="${tabClass} ${activeTab === 'docs' ? activeTabClass : inactiveTabClass}">
                Documentos
            </button>
            ${auto.estado !== 'Vendido' ? `
                <button onclick="window.switchDASection('venta')" class="${tabClass} ${activeTab === 'venta' ? 'text-rose-600 dark:text-rose-500 after:bg-rose-500' : 'text-rose-400 dark:text-rose-600 hover:text-rose-600'}">
                    Registrar Venta
                </button>
            ` : ''}
        </div>
    `;

    // 3. RENDERIZADO POR SECCIÓN
    if (activeTab === 'info') {
        html += `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 fade-in">
                <div class="space-y-6">
                    <div class="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-neutral-100 dark:border-neutral-800">
                        <p class="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">
                            Información Técnica
                        </p>
                        <div class="space-y-4">
                            <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                                <span class="text-sm font-bold text-neutral-500">Patente</span>
                                <span class="text-sm font-black uppercase text-neutral-800 dark:text-neutral-200">${auto.patente}</span>
                            </div>
                            <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                                <span class="text-sm font-bold text-neutral-500">Marca</span>
                                <span class="text-sm font-black uppercase text-neutral-800 dark:text-neutral-200">${auto.marca}</span>
                            </div>
                            <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                                <span class="text-sm font-bold text-neutral-500">Modelo</span>
                                <span class="text-sm font-black uppercase text-neutral-800 dark:text-neutral-200">${auto.modelo}</span>
                            </div>
                            <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                                <span class="text-sm font-bold text-neutral-500">Año</span>
                                <span class="text-sm font-black text-neutral-800 dark:text-neutral-200">${auto.año}</span>
                            </div>
                            <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                                <span class="text-sm font-bold text-neutral-500">Color</span>
                                <span class="text-sm font-black uppercase text-neutral-800 dark:text-neutral-200">${auto.color || 'S/D'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="space-y-6">
                    <div class="bg-black text-white dark:bg-white dark:text-black p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                        <i data-lucide="banknote" class="absolute -right-4 -bottom-4 w-32 h-32 opacity-10"></i>
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
                            Precio de Venta
                        </p>
                        <h4 class="text-4xl font-black">
                            ${window.formatMoney(auto.precio, auto.moneda)}
                        </h4>
                        ${isAdmin ? `
                            <p class="mt-4 text-[10px] font-bold uppercase opacity-50">
                                Costo Original: ${window.formatMoney(auto.costo)}
                            </p>
                        ` : ''}
                    </div>
                    
                    <button onclick="window.toggleEstadoAuto('${auto.id}')" class="w-full py-4 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-xs font-black uppercase tracking-widest hover:border-green-500 hover:text-green-600 transition-all text-neutral-800 dark:text-neutral-200">
                        Estado Actual: ${auto.estado} (Cambiar)
                    </button>
                </div>
            </div>
        `;
    } else if (activeTab === 'taller') {
        const totalGastos = (auto.gastos || []).reduce((acc, g) => acc + g.monto, 0);
        html += `
            <div class="fade-in space-y-6">
                <div class="flex justify-between items-end bg-rose-50 dark:bg-rose-900/10 p-6 rounded-3xl border border-rose-100 dark:border-rose-800">
                    <div>
                        <p class="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">
                            Inversión en Reparaciones
                        </p>
                        <h4 class="text-3xl font-black text-rose-700 dark:text-rose-500">
                            ${window.formatMoney(totalGastos)}
                        </h4>
                    </div>
                    <i data-lucide="wrench" class="w-10 h-10 text-rose-200 dark:text-rose-800"></i>
                </div>

                <form onsubmit="window.handleGastoTallerSubmit(event, '${auto.id}')" class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                    <input id="gt-desc" required placeholder="¿Qué se le hizo?" class="md:col-span-1 px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-800 dark:text-neutral-200" />
                    <input id="gt-monto" required oninput="window.formatInputMoney(this)" placeholder="Costo $" class="px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-black text-neutral-800 dark:text-neutral-200" />
                    
                    <div class="flex space-x-2">
                        <select id="gt-cat" class="flex-1 px-2 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200">
                            <option value="Mecánica">Mecánica</option>
                            <option value="Chapa y Pintura">Chapa/Pintura</option>
                            <option value="Limpieza">Limpieza</option>
                            <option value="Gestoría">Gestoría</option>
                            <option value="Otros">Otros</option>
                        </select>
                        <button type="submit" class="p-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:scale-105 transition-transform">
                            <i data-lucide="plus" class="w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <div class="md:col-span-3 flex items-center px-1 mt-2">
                        <input type="checkbox" id="gt-fuera-caja" class="mr-2 w-4 h-4 rounded text-green-600" />
                        <label for="gt-fuera-caja" class="text-[10px] font-black text-neutral-500 uppercase">
                            Gasto fuera de caja (No descontar de la Caja Chica)
                        </label>
                    </div>
                </form>

                <div class="space-y-3">
                    ${(auto.gastos || []).length === 0 ? '<p class="text-center py-6 text-neutral-400 text-xs font-bold uppercase tracking-widest">Sin gastos registrados</p>' : ''}
                    
                    ${(auto.gastos || []).slice().reverse().map(g => `
                        <div class="flex justify-between items-center p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm">
                            <div>
                                <p class="text-sm font-black text-neutral-800 dark:text-neutral-200">
                                    ${g.descripcion}
                                </p>
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                                    ${window.formatDate(g.fecha)} • ${g.categoria}
                                </p>
                            </div>
                            <p class="font-black text-rose-600 dark:text-rose-500">
                                ${window.formatMoney(g.monto)}
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (activeTab === 'docs') {
        const docs = auto.documentacion || { c08: false, verificacion: false, libreDeuda: false, vtv: '' };
        html += `
            <div class="fade-in space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div onclick="window.toggleDoc('${auto.id}', 'c08')" class="p-5 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${docs.c08 ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50'}">
                        <span class="text-sm font-black uppercase text-neutral-800 dark:text-neutral-200">Formulario 08</span>
                        <i data-lucide="${docs.c08 ? 'check-circle' : 'circle'}" class="${docs.c08 ? 'text-green-600 dark:text-green-500' : 'text-neutral-300 dark:text-neutral-700'}"></i>
                    </div>
                    
                    <div onclick="window.toggleDoc('${auto.id}', 'verificacion')" class="p-5 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${docs.verificacion ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50'}">
                        <span class="text-sm font-black uppercase text-neutral-800 dark:text-neutral-200">Verificación Policial</span>
                        <i data-lucide="${docs.verificacion ? 'check-circle' : 'circle'}" class="${docs.verificacion ? 'text-green-600 dark:text-green-500' : 'text-neutral-300 dark:text-neutral-700'}"></i>
                    </div>
                </div>
            </div>
        `;
    } else if (activeTab === 'crm') {
        // --- SECCIÓN INTELIGENTE: INTERESADOS CRM ---
        const todosLeads = window.state.consultas || [];
        const interesados = todosLeads.filter(c => {
            const interes = (c.marcaInteres || '').toLowerCase();
            return interes.includes(auto.marca.toLowerCase()) || interes.includes(auto.modelo.toLowerCase());
        });

        html += `
            <div class="fade-in space-y-6">
                <div class="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/50">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h4 class="text-lg font-black text-indigo-800 dark:text-indigo-300">
                                Interesados Potenciales
                            </h4>
                            <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                                El sistema encontró ${interesados.length} personas que buscan un auto como este.
                            </p>
                        </div>
                        <div class="bg-indigo-600 text-white p-2 rounded-xl shadow-lg">
                            <i data-lucide="zap" class="w-5 h-5"></i>
                        </div>
                    </div>
                    
                    <div class="space-y-3 mt-6">
                        ${interesados.length === 0 ? '<p class="text-center py-8 text-neutral-400 dark:text-neutral-500 text-xs font-bold uppercase tracking-widest italic">Nadie ha preguntado por este modelo aún.</p>' : ''}
                        
                        ${interesados.map(c => {
                            const analisis = window.calcularTermometroLead ? window.calcularTermometroLead(c) : { score: 50, estado: 'Tibio' };
                            const barColor = analisis.estado === 'Caliente' ? 'bg-rose-500' : (analisis.estado === 'Tibio' ? 'bg-amber-500' : 'bg-blue-500');
                            
                            return `
                                <div onclick="window.closeModal('modal-detalle-auto'); window.openDetalleLead('${c.id}')" class="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between hover:border-indigo-400 transition-all cursor-pointer group">
                                    <div class="flex-1">
                                        <p class="text-sm font-black text-neutral-800 dark:text-neutral-100 group-hover:text-indigo-600 transition-colors">
                                            ${c.nombre}
                                        </p>
                                        <div class="flex items-center mt-1 space-x-3">
                                            <span class="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                                ${c.telefono}
                                            </span>
                                            <div class="flex items-center">
                                                <div class="w-16 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mr-2">
                                                    <div class="${barColor} h-full" style="width: ${analisis.score}%"></div>
                                                </div>
                                                <span class="text-[9px] font-black uppercase text-neutral-500">
                                                    ${analisis.estado}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <i data-lucide="chevron-right" class="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-indigo-500 transition-colors"></i>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700">
                    <h5 class="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4">
                        Nueva Consulta para este Auto
                    </h5>
                    
                    <form onsubmit="window.handleDA_CRMSubmit(event, '${auto.id}')" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input id="dac-nombre" required placeholder="Nombre del interesado" class="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-800 dark:text-neutral-200" />
                            <input id="dac-tel" required placeholder="Teléfono" class="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-800 dark:text-neutral-200" />
                        </div>
                        <textarea id="dac-nota" rows="2" placeholder="Notas adicionales (opcional)..." class="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold resize-none text-neutral-800 dark:text-neutral-200"></textarea>
                        <button type="submit" class="w-full py-3.5 bg-black text-white dark:bg-white dark:text-black rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-[1.02] transition-transform">
                            Vincular a este Vehículo
                        </button>
                    </form>
                </div>
            </div>
        `;
    } else if (activeTab === 'venta') {
        html += `
            <div class="fade-in space-y-6">
                <div class="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-3xl border border-rose-100 dark:border-rose-800/50 mb-6">
                    <h4 class="text-lg font-black text-rose-800 dark:text-rose-400">
                        Panel de Cierre de Operación
                    </h4>
                    <p class="text-xs font-bold text-rose-600 dark:text-rose-500 mt-1">
                        Complete los datos para retirar el vehículo del stock y generar la documentación correspondiente.
                    </p>
                </div>
                
                <form onsubmit="window.handleDAVentaSubmit(event, '${auto.id}')" class="space-y-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="md:col-span-2">
                            <label class="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                                Comprador
                            </label>
                            <input id="vent-comp-nombre" required placeholder="Nombre Completo" class="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-800 dark:text-neutral-200" />
                        </div>
                        
                        <input id="vent-comp-dni" required placeholder="DNI" class="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-800 dark:text-neutral-200" />
                        
                        <input id="vent-comp-tel" required placeholder="Teléfono" class="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-800 dark:text-neutral-200" />
                        
                        <div class="md:col-span-2">
                            <input id="vent-comp-domicilio" placeholder="Domicilio Completo" class="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-800 dark:text-neutral-200" />
                        </div>
                    </div>

                    <div class="space-y-4">
                        <label class="block text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                            Desglose de Pago
                        </label>
                        
                        <div class="flex items-center space-x-4 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                            <input type="checkbox" id="chk-efectivo" class="w-5 h-5 rounded text-green-600" />
                            <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input id="val-efectivo" oninput="window.formatInputMoney(this)" placeholder="Monto Efectivo / Transf." class="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-black text-neutral-800 dark:text-neutral-200" />
                                <input id="nota-efectivo" placeholder="Nota (Ej: Dólares, Transferencia)" class="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200" />
                            </div>
                        </div>

                        <div class="flex items-center space-x-4 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                            <input type="checkbox" id="chk-credito" class="w-5 h-5 rounded text-green-600" />
                            <div class="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                                <input id="val-credito" oninput="window.formatInputMoney(this)" placeholder="Total Crédito" class="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-black text-neutral-800 dark:text-neutral-200" />
                                <input id="cuotas-credito" type="number" placeholder="Cant. Cuotas" class="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-800 dark:text-neutral-200" />
                                <p class="hidden md:flex items-center text-[10px] font-black text-neutral-400 uppercase">
                                    Cuotas Mensuales
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-4 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                            <input type="checkbox" id="chk-pagare" class="w-5 h-5 rounded text-green-600" />
                            <div class="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                                <input id="val-pagare" oninput="window.formatInputMoney(this)" placeholder="Total Pagaré" class="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-black text-neutral-800 dark:text-neutral-200" />
                                <input id="cuotas-pagare" type="number" placeholder="Cant. Cuotas" class="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-800 dark:text-neutral-200" />
                            </div>
                        </div>

                        <div class="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                            <button type="button" onclick="window.toggleVentaPermuta()" class="w-full flex justify-between items-center text-xs font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-300">
                                <span>¿Toma Vehículo en Permuta?</span>
                                <i data-lucide="${window.state.ventaData.tienePermuta ? 'minus-circle' : 'plus-circle'}" class="w-5 h-5"></i>
                            </button>
                            
                            <div id="venta-permuta-form" class="${window.state.ventaData.tienePermuta ? '' : 'hidden'} mt-4 space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <input id="p-marca" placeholder="Marca" class="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200" />
                                    <input id="p-modelo" placeholder="Modelo" class="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200" />
                                    <input id="p-pat" placeholder="Patente" class="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold uppercase text-neutral-800 dark:text-neutral-200" />
                                    <input id="p-anio" type="number" placeholder="Año" class="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200" />
                                    <input id="p-km" oninput="window.formatInputMoney(this)" placeholder="Km" class="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200" />
                                    <input id="p-color" placeholder="Color" class="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200" />
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <select id="p-condicion" class="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                        <option value="Propio">Propio</option>
                                        <option value="Consignación">Consignación</option>
                                    </select>
                                    <input id="p-valor" oninput="window.formatInputMoney(this)" placeholder="Valor de toma $" class="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm font-black text-indigo-700 dark:text-indigo-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="btn-submit-venta">
                        <button type="submit" class="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl shadow-rose-600/20 hover:scale-[1.02] transition-transform">
                            Finalizar y Generar Boleto
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    content.innerHTML = html;
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
};

window.toggleVentaPermuta = () => {
    window.state.ventaData.tienePermuta = !window.state.ventaData.tienePermuta;
    window.renderDetalleAuto();
};

window.imprimirFlota = () => {
    const autos = window.state.autos.filter(a => a.estado !== 'Vendido');
    let html = `
        <div style="font-family: Arial, sans-serif; color: #000; padding: 20px;">
            <h2 style="text-align: center; text-transform: uppercase; margin-bottom: 20px;">Reporte de Flota y Stock</h2>
            <p style="text-align: center; color: #555; font-size: 14px; margin-bottom: 30px;">
                Generado el: ${new Date().toLocaleDateString('es-AR')}
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background-color: #f1f1f1; text-align: left;">
                        <th style="padding: 10px; border: 1px solid #ddd;">Patente</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Vehículo</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Año / Km</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Estado</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Precio</th>
                    </tr>
                </thead>
                <tbody>
                    ${autos.map(a => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; text-transform: uppercase;">
                                ${a.patente}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                ${a.marca} ${a.modelo}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                ${a.año} | ${new Intl.NumberFormat('es-AR').format(a.km)} km
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                ${a.estado}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
                                ${window.formatMoney(a.precio, a.moneda)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('print-content').innerHTML = html;
    window.print();
};
