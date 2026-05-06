// ==========================================
// js/render/renderCRM.js
// ==========================================

window.renderClientesView = () => {
    const table = document.getElementById('crm-table');
    
    if (!table) {
        return;
    }

    let leads = window.state.consultas || [];

    // Filtro estricto por roles para privacidad del CRM
    if (window.state.currentUser.rol === 'Vendedor') {
        leads = leads.filter(c => c.userId === window.state.currentUser.id);
    } else if (window.state.currentUser.rol === 'Encargado') {
        const validUsers = window.state.usuarios
            .filter(u => u.sucursalId === window.state.currentUser.sucursalId && u.rol !== 'Admin')
            .map(u => u.id);
        
        leads = leads.filter(c => validUsers.includes(c.userId));
    }

    // Ordenar los leads por fecha de creación (los más nuevos arriba)
    leads.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Estado vacío
    if (leads.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-8 text-neutral-500 font-bold">
                    No hay clientes/leads en tu cartera.
                </td>
            </tr>
        `;
        return;
    }

    // Renderizado de la tabla con los leads
    table.innerHTML = `
        <thead>
            <tr class="text-[10px] uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-800/30">
                <th class="px-6 py-4 font-bold">Cliente</th>
                <th class="px-6 py-4 font-bold">Interés / Auto</th>
                <th class="px-6 py-4 font-bold">Estado</th>
                <th class="px-6 py-4 font-bold text-right">Próx. Contacto</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/50">
            ${leads.map(c => {
                // 1. Buscamos si está asociado a un auto específico (incluso si se vendió)
                let autoVinculado = '';
                
                if (c.autoId) {
                    const auto = window.state.autos.find(a => a.id === c.autoId);
                    if (auto) {
                        const estadoAuto = auto.estado === 'Vendido' ? '<span class="text-rose-500 ml-1">[VENDIDO]</span>' : '';
                        autoVinculado = `
                            <div class="text-[10px] text-green-600 dark:text-green-400 font-bold mt-1">
                                Vinculado a: ${auto.marca} ${auto.modelo} ${auto.patente} ${estadoAuto}
                            </div>
                        `;
                    }
                }

                // 2. Colores según el estado (Temperatura del Lead)
                let eClass = 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300';
                
                if (c.estadoLead === 'Caliente') {
                    eClass = 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
                } else if (c.estadoLead === 'Tibio') {
                    eClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
                } else if (c.estadoLead === 'Frío') {
                    eClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
                }

                // 3. Buscar el próximo contacto pendiente en el historial
                const pendientes = (c.historial || [])
                    .filter(h => !h.completado && h.proximoContacto)
                    .sort((a,b) => new Date(a.proximoContacto) - new Date(b.proximoContacto));
                
                const prox = pendientes.length > 0 ? window.formatDate(pendientes[0].proximoContacto) : 'Sin agendar';

                // 4. Retornamos la fila
                return `
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer" onclick="window.openDetalleLead('${c.id}')">
                    <td class="px-6 py-4">
                        <p class="font-black text-sm">${c.nombre}</p>
                        <p class="text-xs text-neutral-500 font-bold">${c.telefono}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-sm font-bold text-neutral-700 dark:text-neutral-300 truncate max-w-[200px]">
                            ${c.marcaInteres}
                        </p>
                        ${autoVinculado}
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 text-[10px] font-bold uppercase rounded-lg ${eClass}">
                            ${c.estadoLead}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <span class="text-xs font-black ${prox !== 'Sin agendar' ? 'text-amber-600 dark:text-amber-500' : 'text-neutral-400'}">
                            ${prox}
                        </span>
                    </td>
                </tr>
                `;
            }).join('')}
        </tbody>
    `;
};

window.openDetalleLead = (id) => {
    const lead = window.state.consultas.find(x => x.id === id);
    
    if (!lead) {
        return;
    }

    // 1. Panel informativo si está vinculado a un auto
    let autoVinculado = '';
    if (lead.autoId) {
        const auto = window.state.autos.find(a => a.id === lead.autoId);
        if (auto) {
            autoVinculado = `
                <div class="mt-4 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
                    <p class="text-xs font-bold text-green-700 dark:text-green-500 uppercase tracking-widest flex items-center">
                        <i data-lucide="car" class="w-4 h-4 mr-2"></i> Consulta original por vehículo:
                    </p>
                    <p class="text-sm font-black mt-1">
                        ${auto.marca} ${auto.modelo} (${auto.patente}) - ${auto.estado === 'Vendido' ? 'VENDIDO' : auto.estado}
                    </p>
                </div>
            `;
        }
    }

    const historial = lead.historial || [];

    // 2. Construcción del HTML del Modal
    let html = `
        <form id="form-edit-lead" onsubmit="window.handleEditLeadSubmit(event, '${id}')" class="space-y-4 mb-6">
            <div class="grid grid-cols-2 gap-4">
                <input id="edit-lead-nombre" required placeholder="Nombre" value="${lead.nombre}" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 outline-none font-bold focus:border-green-500 transition-colors" />
                <input id="edit-lead-tel" required placeholder="Teléfono" value="${lead.telefono}" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 outline-none font-bold focus:border-green-500 transition-colors" />
            </div>
            
            <select id="edit-lead-estado" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 outline-none font-bold focus:border-green-500 transition-colors">
                <option value="Caliente" ${lead.estadoLead === 'Caliente' ? 'selected' : ''}>Alta Prioridad (Caliente)</option>
                <option value="Tibio" ${lead.estadoLead === 'Tibio' ? 'selected' : ''}>Seguimiento Normal (Tibio)</option>
                <option value="Frío" ${lead.estadoLead === 'Frío' ? 'selected' : ''}>Baja Prioridad (Frío)</option>
            </select>
            
            <textarea id="edit-lead-nota" rows="2" placeholder="Notas iniciales..." class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 outline-none resize-none font-bold focus:border-green-500 transition-colors">${lead.notas || ''}</textarea>
            
            ${autoVinculado}
            
            <button type="submit" class="w-full py-3 bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 rounded-xl font-black uppercase tracking-wider text-xs hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors">
                Actualizar Datos Base
            </button>
        </form>

        <div class="border-t border-neutral-200 dark:border-neutral-800 pt-6">
            <h4 class="font-black text-sm uppercase mb-4 text-neutral-500 tracking-wider flex items-center">
                <i data-lucide="history" class="w-4 h-4 mr-2"></i> Historial y Seguimiento
            </h4>
            
            <form onsubmit="window.handleAddLeadHistory(event, '${id}')" class="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50 mb-6">
                <textarea id="lh-texto" required rows="2" placeholder="Ej: Lo llamé y pidió que le envíe fotos..." class="w-full rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-700 outline-none resize-none font-bold text-sm mb-3 focus:border-amber-500 transition-colors"></textarea>
                
                <div class="flex items-center space-x-3">
                    <div class="flex-1">
                        <label class="block text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-1">
                            Agendar Alerta (Próx. Contacto)
                        </label>
                        <input id="lh-fecha" type="date" class="w-full rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-700 outline-none font-bold text-sm focus:border-amber-500 transition-colors" />
                    </div>
                    <button type="submit" class="mt-4 px-4 py-3 bg-amber-500 text-black rounded-xl font-black uppercase tracking-wider text-xs shadow-md hover:scale-105 transition-transform">
                        Agregar
                    </button>
                </div>
            </form>

            <div class="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-1">
                ${historial.length === 0 ? '<p class="text-xs text-neutral-500 italic text-center py-4">Sin historial de seguimiento registrado.</p>' : ''}
                
                ${historial.slice().reverse().map(h => `
                    <div class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col relative transition-opacity ${h.completado ? 'opacity-60' : ''}">
                        <p class="text-xs font-bold mb-3 text-neutral-800 dark:text-neutral-200">${h.texto}</p>
                        
                        <div class="flex justify-between items-center mt-auto border-t border-neutral-200 dark:border-neutral-700 pt-3">
                            <span class="text-[10px] text-neutral-400 font-bold tracking-wider">
                                Registrado: ${window.formatDate(h.fechaCarga)}
                            </span>
                            
                            ${h.proximoContacto ? `
                                <div class="flex items-center">
                                    <span class="text-[10px] font-black tracking-wider mr-3 ${h.completado ? 'text-green-500' : 'text-amber-500'}">
                                        Alerta: ${window.formatDate(h.proximoContacto)}
                                    </span>
                                    
                                    ${!h.completado ? `
                                        <button type="button" onclick="window.markHistoryCompleted('${id}', '${h.id}')" class="px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500 rounded-lg text-[10px] font-black uppercase hover:bg-green-200 dark:hover:bg-green-800 transition-colors shadow-sm">
                                            Marcar Hecho
                                        </button>
                                    ` : `
                                        <div class="flex items-center text-green-500 text-[10px] font-black uppercase tracking-wider">
                                            <i data-lucide="check-check" class="w-4 h-4 mr-1"></i> Listo
                                        </div>
                                    `}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <button type="button" onclick="window.closeModal('modal-detalle-lead')" class="w-full mt-6 py-4 bg-black text-white dark:bg-white dark:text-black rounded-xl font-black uppercase tracking-wider shadow-lg hover:scale-[1.02] transition-transform flex justify-center items-center">
                Cerrar Ficha
            </button>
        </div>
    `;

    document.getElementById('lead-detail-content').innerHTML = html;
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    window.openModal('modal-detalle-lead');
};
