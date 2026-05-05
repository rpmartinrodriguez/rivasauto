// ==========================================
// js/render/renderCRM.js
// ==========================================

window.renderClientesView = () => { 
  const table = document.getElementById('crm-table'); 
  if(!table) return;
  
  let misConsultas = window.state.consultas || [];
  
  if(window.state.currentUser.rol === 'Vendedor') {
     misConsultas = misConsultas.filter(c => c.userId === window.state.currentUser.id);
  } else if (window.state.currentUser.rol === 'Encargado') {
     const validUsers = (window.state.usuarios || []).filter(u => u.sucursalId === window.state.currentUser.sucursalId && u.rol !== 'Admin').map(u => u.id);
     misConsultas = misConsultas.filter(c => validUsers.includes(c.userId));
  }

  const today = new Date();

  if (misConsultas.length === 0) { 
    table.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-8 text-neutral-500 font-bold">
          No hay clientes en la base de datos.
        </td>
      </tr>
    `; 
  } else { 
    let html = `
      <thead>
        <tr class="text-xs uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-800/30">
          <th class="px-6 py-4 font-bold">Cliente</th>
          <th class="px-6 py-4 font-bold">Contacto</th>
          <th class="px-6 py-4 font-bold">Interés</th>
          <th class="px-6 py-4 font-bold">Registro</th>
          <th class="px-6 py-4 font-bold text-right">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/50">
    `;

    html += misConsultas.slice().sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''))).map(c => { 
      const a = c.autoId ? (window.state.autos || []).find(x => x.id === c.autoId) : null; 
      
      const leadDate = new Date(c.fecha + 'T00:00:00');
      const diffDays = Math.floor((today - leadDate) / (1000 * 60 * 60 * 24));
      
      let dynamicState = 'Frío';
      let lClass = 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'; 

      if (diffDays <= 7) { 
        dynamicState = 'Caliente'; 
        lClass = 'bg-black text-white dark:bg-white dark:text-black'; 
      } else if (diffDays <= 20) { 
        dynamicState = 'Tibio'; 
        lClass = 'bg-neutral-400 text-neutral-900 dark:bg-neutral-600 dark:text-white'; 
      } 
      
      const autor = (window.state.usuarios || []).find(u => u.id === c.userId);
      const nombreAutor = autor ? autor.nombre : 'Desconocido';
      const txtAutor = window.state.currentUser.rol !== 'Vendedor' ? `<p class="text-[10px] text-neutral-400 font-bold mt-1 uppercase tracking-wider">Cargado por: ${nombreAutor}</p>` : '';

      return `
        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer" onclick="window.openDetalleLead('${c.id}')">
          <td class="px-6 py-4">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center mr-4 font-black text-lg">
                ${String(c.nombre || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p class="font-bold">${c.nombre || 'Sin Nombre'}</p>
                <span class="inline-flex px-2 py-0.5 mt-1 rounded-md text-[10px] font-black uppercase tracking-widest ${lClass}">
                  ${dynamicState}
                </span>
                ${txtAutor}
              </div>
            </div>
          </td>
          <td class="px-6 py-4 text-sm font-bold">
            ${c.telefono || '-'}
          </td>
          <td class="px-6 py-4">
            ${a ? `
              <span class="font-bold text-sm text-green-600 dark:text-green-500 hover:underline" onclick="event.stopPropagation(); window.openDetalleAuto('${a.id}')">
                ${a.marca} ${a.modelo}
              </span>
            ` : `
              <span class="font-bold text-sm">
                ${c.marcaInteres || '-'}
              </span>
            `}
            <p class="text-xs text-neutral-500 italic mt-1 max-w-[200px] truncate">"${c.notas || ''}"</p>
          </td>
          <td class="px-6 py-4 text-sm font-bold text-neutral-500">
            Orig: ${window.formatDate(c.fecha)}
          </td>
          <td class="px-6 py-4 text-right">
            <div class="flex justify-end items-center space-x-2">
              <button onclick="event.stopPropagation(); window.openDetalleLead('${c.id}')" class="px-3 py-2 bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm transition-transform hover:scale-105 flex items-center">
                <i data-lucide="edit-2" class="w-3 h-3 mr-1"></i> Editar
              </button>
              <a href="${window.formatWhatsAppLink(c.telefono || '', '')}" onclick="event.stopPropagation()" target="_blank" class="px-3 py-2 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md transition-transform hover:scale-105 hover:bg-green-700 flex items-center">
                <i data-lucide="message-circle" class="w-3 h-3 mr-1"></i> Contactar
              </a>
            </div>
          </td>
        </tr>
      `; 
    }).join(''); 
    
    html += `</tbody>`;
    table.innerHTML = html;
  } 
  if(window.lucide) window.lucide.createIcons();
};

window.openDetalleLead = (id) => {
  const c = (window.state.consultas || []).find(x => x.id === id);
  if(!c) return;

  const a = c.autoId ? (window.state.autos || []).find(x => x.id === c.autoId) : null;
  const autoInfo = a ? `${a.marca} ${a.modelo} (${a.patente})` : c.marcaInteres;

  const today = new Date();
  const leadDate = new Date(c.fecha + 'T00:00:00');
  const diffDays = Math.floor((today - leadDate) / (1000 * 60 * 60 * 24));
  
  let dynamicState = 'Frío';
  if (diffDays <= 7) dynamicState = 'Caliente'; 
  else if (diffDays <= 20) dynamicState = 'Tibio'; 

  let html = `
    <form id="form-edit-lead" onsubmit="window.handleEditLeadSubmit(event, '${c.id}')">
      <div class="flex justify-between items-center mb-6 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
         <div>
           <p class="text-xs text-neutral-500 font-bold uppercase">Estado Actual</p>
           <p class="font-black text-lg">${dynamicState} (${diffDays} días)</p>
         </div>
         <div class="text-right">
           <p class="text-xs text-neutral-500 font-bold uppercase">Fecha Carga</p>
           <p class="font-black">${window.formatDate(c.fecha)}</p>
         </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-neutral-500 uppercase mb-1">Nombre y Apellido</label>
          <input id="edit-lead-nombre" required class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none focus:border-green-500 font-bold" value="${c.nombre || ''}" />
        </div>
        <div>
          <label class="block text-xs font-bold text-neutral-500 uppercase mb-1">Teléfono</label>
          <input id="edit-lead-tel" required class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none focus:border-green-500 font-bold" value="${c.telefono || ''}" />
        </div>
        <div>
          <label class="block text-xs font-bold text-neutral-500 uppercase mb-1">Vehículo / Interés</label>
          <input id="edit-lead-interes" required class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none focus:border-green-500 font-bold" value="${autoInfo || ''}" ${a ? 'readonly title="Viene de un auto en stock"' : ''} />
        </div>
        <div>
          <label class="block text-xs font-bold text-neutral-500 uppercase mb-1">Notas y Seguimiento</label>
          <textarea id="edit-lead-nota" rows="5" class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none resize-none focus:border-green-500 font-bold">${c.notas || ''}</textarea>
        </div>
      </div>
      <div class="mt-8 flex space-x-3">
         <button type="button" onclick="window.deleteLead('${c.id}')" class="w-1/3 py-3 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center">
           <i data-lucide="trash-2" class="w-5 h-5"></i>
         </button>
         <button type="submit" class="w-2/3 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex justify-center items-center">
           <span>Guardar Cambios</span>
         </button>
      </div>
    </form>
  `;

  document.getElementById('lead-detail-content').innerHTML = html;
  window.openModal('modal-detalle-lead');
  if(window.lucide) window.lucide.createIcons();
};
