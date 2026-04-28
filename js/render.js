// ==========================================
// js/render.js
// ==========================================

window.renderAllViews = () => { 
  if(!window.state.currentUser) return; 
  
  if(window.renderCajaView) window.renderCajaView(); 
  if(window.renderVentasView) window.renderVentasView();
  if(window.renderFacturasView) window.renderFacturasView(); 
  if(window.renderAutosView) window.renderAutosView(); 
  if(window.renderClientesView) window.renderClientesView(); 
  if(window.renderFormulariosView) window.renderFormulariosView();
  if(window.renderPersonalView) window.renderPersonalView();
  if(window.renderResumenesView) window.renderResumenesView(); 
  if(window.renderAdminView) window.renderAdminView(); 
  
  if(window.checkNotifications) window.checkNotifications();
  lucide.createIcons(); 
};

window.initSelects = () => { 
  const elCat = document.getElementById('caja-cat');
  if (elCat) {
    elCat.innerHTML = window.state.categoriasGasto
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .map(c => `<option value="${c}">${c}</option>`)
      .join(''); 
  }
  
  const elSuc = document.getElementById('auto-sucursal');
  if (elSuc) {
    elSuc.innerHTML = window.state.sucursales
      .slice()
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map(s => `<option value="${s.id}">${s.nombre}</option>`)
      .join(''); 
  }
  
  const elAuto = document.getElementById('caja-auto');
  if (elAuto) {
    elAuto.innerHTML = `
      <option value="">-- Gasto General de Agencia --</option>
    ` + window.state.autos
      .slice()
      .sort((a, b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo))
      .map(a => `<option value="${a.id}">${a.marca} ${a.modelo} (${a.patente})</option>`)
      .join(''); 
  }
  
  const elFecha = document.getElementById('caja-fecha');
  if (elFecha) {
    elFecha.value = new Date().toISOString().split('T')[0]; 
  }
};

window.checkNotifications = () => {
  if(!window.state.currentUser || window.state.currentUser.rol !== 'Admin') {
    const nc = document.getElementById('notif-container');
    if (nc) nc.classList.add('hidden');
    return;
  }
  
  const nc = document.getElementById('notif-container');
  if (nc) nc.classList.remove('hidden');
  
  const notifs = [];
  const today = new Date();
  
  window.state.ventas.forEach(v => {
    const metodos = v.metodoPago || '';
    if (metodos.includes('Crédito') || metodos.includes('Pagaré')) {
      const cuotasT = v.cuotasTotales || 0;
      const cuotasP = v.cuotasPagadas || 0;
      const pendientes = cuotasT - cuotasP;
      
      if (pendientes <= 0) return; 
      
      const fechaFin = new Date(v.fecha + 'T00:00:00');
      fechaFin.setMonth(fechaFin.getMonth() + cuotasT);
      
      const diffDays = Math.ceil((fechaFin - today) / (1000 * 60 * 60 * 24));

      if (diffDays <= 60 && diffDays > 20) {
        notifs.push({ v, msg: 'Aprox. 2 meses para finalizar.', days: diffDays });
      } else if (diffDays <= 20 && diffDays >= 0) {
        notifs.push({ v, msg: '¡Menos de 20 días para terminar!', days: diffDays });
      }
    }
  });
  
  const badge = document.getElementById('notif-badge');
  const list = document.getElementById('notif-list');
  
  if (!badge || !list) return;

  if (notifs.length > 0) {
    badge.classList.remove('hidden');
    list.innerHTML = notifs.map(n => `
      <div class="p-4 border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
        <p class="font-bold text-sm">${n.v.compradorNombre || 'Sin Nombre'}</p>
        <p class="text-xs text-neutral-500 mb-3">${n.v.autoDesc || '-'} • <span class="text-amber-600 dark:text-amber-400 font-bold">${n.msg}</span></p>
        <a href="${window.formatWhatsAppLink(n.v.compradorTelefono || '', '')}" target="_blank" class="text-[10px] font-bold uppercase text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded flex w-fit items-center hover:bg-green-100 transition">
          <i data-lucide="message-circle" class="w-3.5 h-3.5 mr-1.5"></i> Ofrecer Recompra
        </a>
      </div>
    `).join('');
  } else {
    badge.classList.add('hidden');
    list.innerHTML = `
      <div class="p-6 text-center text-sm text-neutral-500">
        No hay alertas de recompra en este momento.
      </div>
    `;
  }
};

window.toggleAutosViewMode = (mode) => { 
  window.state.autosViewMode = mode; 
  localStorage.setItem('autosViewMode', mode);
  window.renderAutosView(); 
};

window.renderAutosView = () => {
  const container = document.getElementById('autos-container');
  if(!container) return;

  const btnGrid = document.getElementById('btn-view-grid');
  const btnList = document.getElementById('btn-view-list');
  
  if(btnGrid) {
    btnGrid.className = window.state.autosViewMode === 'grid' 
      ? 'p-2 rounded-lg bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white transition-colors' 
      : 'p-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors';
  }
  
  if(btnList) {
    btnList.className = window.state.autosViewMode === 'list' 
      ? 'p-2 rounded-lg bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white transition-colors' 
      : 'p-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors';
  }
  
  const autosValidos = window.state.autos
    .filter(a => a.estado !== 'Vendido')
    .sort((a, b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo));
  
  if (autosValidos.length === 0) { 
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-neutral-500 font-bold">
        No hay vehículos en la flota.
      </div>
    `; 
    return; 
  }

  if (window.state.autosViewMode === 'grid') {
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 fade-in">
        ${autosValidos.map(auto => {
          const totalGastos = auto.gastos?.reduce((s, g) => s + Number(g.monto), 0) || 0; 
          const sName = window.state.sucursales.find(x => x.id === auto.sucursalId)?.nombre || 'Sin Asignar';
          
          let bClass = 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'; 
          if(auto.estado === 'Disponible') {
            bClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'; 
          }
          if(auto.estado === 'A Ingresar') {
            bClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500 border border-amber-300 dark:border-amber-700';
          }
          
          return `
            <div onclick="window.openDetalleAuto('${auto.id}')" class="group cursor-pointer bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-2 shadow-sm hover:shadow-lg transition-all hover:border-green-500/50">
              <div class="bg-neutral-50/50 dark:bg-neutral-800/50 rounded-[2rem] p-6 h-full flex flex-col relative">
                <div class="flex justify-between items-start mb-4">
                  <div class="flex flex-col space-y-1">
                    <div class="flex space-x-2">
                      <span class="px-3 py-1 text-[10px] font-bold uppercase rounded-xl ${bClass}">
                        ${auto.estado}
                      </span>
                    </div>
                    <span class="text-xs text-neutral-500 font-bold ml-1">
                      <i data-lucide="map-pin" class="w-3 h-3 inline"></i> ${sName} | <span class="uppercase text-[10px]">${auto.condicion || 'Propio'}</span>
                    </span>
                  </div>
                  <div class="bg-white dark:bg-neutral-900 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <span class="font-mono text-sm font-bold">${auto.patente}</span>
                  </div>
                </div>
                <div class="mb-4">
                  <h3 class="text-2xl font-black">${auto.marca} <br/>
                    <span class="text-neutral-500">${auto.modelo}</span>
                  </h3>
                  <p class="text-sm text-neutral-400 mt-1 font-bold">
                    Año ${auto.año} • ${auto.color || ''} • ${auto.km || 0} km
                  </p>
                </div>
                <div class="mt-auto space-y-3">
                  <div class="flex justify-between items-center p-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                    <span class="text-xs font-bold text-neutral-500 uppercase">Precio</span>
                    <span class="text-lg font-black">${window.formatMoney(auto.precio)}</span>
                  </div>
                  <div class="flex justify-between items-center px-2">
                    <span class="text-xs text-neutral-500 font-bold">
                      <i data-lucide="wrench" class="w-3 h-3 inline"></i> Inversión Acumulada
                    </span>
                    <span class="text-sm font-bold">${window.formatMoney(totalGastos)}</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-[2rem] shadow-sm overflow-hidden fade-in">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-xs uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-800/30">
                <th class="px-6 py-4 font-bold">Vehículo</th>
                <th class="px-6 py-4 font-bold">Patente</th>
                <th class="px-6 py-4 font-bold">Detalles</th>
                <th class="px-6 py-4 font-bold">Estado</th>
                <th class="px-6 py-4 font-bold text-right">Precio Venta</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/50">
              ${autosValidos.map(auto => {
                let bClass = 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'; 
                if(auto.estado === 'Disponible') {
                  bClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'; 
                }
                if(auto.estado === 'A Ingresar') {
                  bClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500';
                }
                
                return `
                  <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors" onclick="window.openDetalleAuto('${auto.id}')">
                    <td class="px-6 py-4">
                      <p class="font-bold">${auto.marca} ${auto.modelo}</p>
                      <p class="text-xs text-neutral-500 font-bold mt-1">Año ${auto.año}</p>
                    </td>
                    <td class="px-6 py-4 font-mono text-sm font-bold uppercase">${auto.patente}</td>
                    <td class="px-6 py-4 text-xs text-neutral-600 dark:text-neutral-400 font-bold capitalize">
                      ${auto.color || '-'} • ${auto.km || 0} km • <span class="uppercase">${auto.condicion || 'Propio'}</span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-2 py-1 text-[10px] font-bold uppercase rounded-md ${bClass}">
                        ${auto.estado}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right font-black text-lg">
                      ${window.formatMoney(auto.precio)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  lucide.createIcons();
};

window.renderDetalleAuto = () => {
  const a = window.state.autos.find(x => x.id === window.state.selectedAutoId); 
  if(!a) return;
  
  const tg = a.gastos?.reduce((ac, g) => ac + g.monto, 0) || 0;
  
  document.getElementById('da-header-actions').innerHTML = `
    <button type="button" onclick="window.editAuto('${a.id}')" class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition">
      <i data-lucide="edit-2" class="w-4 h-4"></i>
    </button>
    <button type="button" onclick="window.deleteAuto('${a.id}')" class="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 rounded-full transition">
      <i data-lucide="trash-2" class="w-4 h-4"></i>
    </button>
    <div class="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-2"></div>
    <button type="button" onclick="window.closeModal('modal-detalle-auto')" class="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-full">
      <i data-lucide="x" class="w-5 h-5"></i>
    </button>
  `;
  
  let html = '';
  
  if(!window.state.isVentaMode) {
    
    html += `
      <div class="bg-black text-white dark:bg-white dark:text-black rounded-[2rem] p-8 mb-6 relative overflow-hidden border border-neutral-800 dark:border-neutral-200">
        <div class="flex justify-between items-start relative z-10">
          <div>
            <span class="bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 text-[10px] uppercase px-3 py-1 rounded-lg font-bold">
              ${a.estado}
            </span>
            <span class="ml-2 bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 text-[10px] uppercase px-3 py-1 rounded-lg font-bold">
              ${a.condicion || 'Propio'}
            </span>
            <h2 class="text-3xl font-black mt-3">${a.marca} ${a.modelo}</h2>
            <p class="text-sm mt-1 opacity-80 font-bold">Año ${a.año} • ${a.color||''} • ${a.km||0} km</p>
          </div>
          <div class="text-right">
            <p class="text-xs uppercase font-bold opacity-60">Precio Venta</p>
            <p class="text-3xl font-black mt-1">${window.formatMoney(a.precio)}</p>
            ${tg > 0 ? `
              <p class="text-[10px] font-bold mt-2 text-rose-400 dark:text-rose-600 uppercase tracking-widest">
                + Gastos Aplicados: ${window.formatMoney(tg)}
              </p>
            ` : ''}
          </div>
        </div>
    `;
    
    if (window.state.currentUser.rol === 'Admin' && a.costo > 0) { 
      html += `
        <p class="mt-4 text-xs font-bold text-neutral-400">
          Costo Base Original: ${window.formatMoney(a.costo)}
        </p>
      `; 
    }
    
    if(a.estado === 'A Ingresar') {
      html += `
        <div class="mt-8 pt-6 border-t border-white/10 dark:border-black/10">
          <button onclick="window.openModalIngreso('${a.id}')" class="w-full py-4 bg-amber-500 text-black font-black rounded-2xl shadow hover:bg-amber-400 transition-all">
            Marcar como Disponible / Fijar Precio
          </button>
        </div>
      `;
    } else if (a.estado !== 'Vendido') { 
      if (window.state.currentUser.rol === 'Admin' || window.state.currentUser.rol === 'Vendedor' || window.state.currentUser.rol === 'Encargado') { 
        html += `
          <div class="mt-8 pt-6 border-t border-white/10 dark:border-black/10">
            <button onclick="window.state.isVentaMode=true; window.renderDetalleAuto()" class="w-full py-4 bg-green-600 text-white dark:bg-green-500 dark:text-black font-black rounded-2xl shadow hover:bg-green-700 transition-all">
              Cerrar Venta con Cliente
            </button>
          </div>
        `; 
      } 
    }
    
    html += `</div>`;
    
    // PESTAÑAS (TABS)
    html += `
      <div class="flex space-x-4 border-b border-neutral-200 dark:border-neutral-800 mb-6 overflow-x-auto no-scrollbar">
        <button onclick="window.switchDASection('crm')" class="pb-3 font-bold border-b-2 flex items-center ${window.state.daActiveSection === 'crm' ? 'border-green-600 text-green-600' : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'}">
          <i data-lucide="users" class="w-4 h-4 mr-2"></i> Leads
        </button>
        <button onclick="window.switchDASection('doc')" class="pb-3 font-bold border-b-2 flex items-center ${window.state.daActiveSection === 'doc' ? 'border-green-600 text-green-600' : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'}">
          <i data-lucide="file-check" class="w-4 h-4 mr-2"></i> Papeles
        </button>
        <button onclick="window.switchDASection('taller')" class="pb-3 font-bold border-b-2 flex items-center ${window.state.daActiveSection === 'taller' ? 'border-green-600 text-green-600' : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'}">
          <i data-lucide="wrench" class="w-4 h-4 mr-2"></i> Taller
        </button>
      </div>
    `;
    
    if(window.state.daActiveSection === 'doc') {
      html += `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${[{k:'c08', l:'08 Firmado'},{k:'verificacion', l:'Verificación (12D)'},{k:'libreDeuda', l:'Libre Deuda'}].map(i => `
            <div onclick="window.toggleDoc('${a.id}','${i.k}')" class="p-5 rounded-2xl border-2 flex items-center space-x-4 cursor-pointer transition-colors ${a.documentacion[i.k] ? 'border-green-600 bg-green-50/50 dark:bg-green-900/10' : 'border-neutral-200 dark:border-neutral-700'}">
              <div class="w-6 h-6 rounded-full flex items-center justify-center ${a.documentacion[i.k] ? 'bg-green-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800'}">
                ${a.documentacion[i.k] ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}
              </div>
              <span class="font-bold">${i.l}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else if(window.state.daActiveSection === 'crm') {
       
       let leadsAuto = window.state.consultas.filter(c => c.autoId === a.id);
       
       if(window.state.currentUser.rol === 'Vendedor') {
         leadsAuto = leadsAuto.filter(c => c.userId === window.state.currentUser.id);
       } else if (window.state.currentUser.rol === 'Encargado') {
         const validUsers = window.state.usuarios.filter(u => u.sucursalId === window.state.currentUser.sucursalId && u.rol !== 'Admin').map(u => u.id);
         leadsAuto = leadsAuto.filter(c => validUsers.includes(c.userId));
       }
       
       leadsAuto = leadsAuto.sort((x,y) => new Date(y.fecha) - new Date(x.fecha));
       
       let listHtml = '';
       if (leadsAuto.length > 0) {
         listHtml = leadsAuto.map(c => `
           <div onclick="window.openDetalleLead('${c.id}')" class="p-3 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
             <div>
               <p class="text-sm font-bold">${c.nombre}</p>
               <p class="text-xs text-neutral-500">${c.telefono} • ${window.formatDate(c.fecha)}</p>
             </div>
             <p class="text-xs text-neutral-500 italic max-w-[120px] truncate text-right">"${c.notas}"</p>
           </div>
         `).join('');
       } else {
         listHtml = `
           <p class="text-xs text-neutral-500 py-2 p-4">
             No hay leads registrados por tu usuario para este vehículo.
           </p>
         `;
       }
      
       html += `
         <div>
           <form id="btn-submit-lead-auto" onsubmit="window.handleDA_CRMSubmit(event, '${a.id}')" class="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 mb-6">
             <h4 class="font-bold mb-4 text-sm uppercase text-neutral-500 tracking-wider">Cargar Interesado</h4>
             <div class="grid grid-cols-2 gap-4">
               <input id="dac-nombre" required placeholder="Nombre" class="w-full mb-4 rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-green-500 font-bold" />
               <input id="dac-tel" required placeholder="Teléfono" class="w-full mb-4 rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-green-500 font-bold" />
             </div>
             <textarea id="dac-nota" placeholder="Notas..." class="w-full mb-4 rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none resize-none focus:border-green-500 font-bold"></textarea>
             <button type="submit" class="w-full py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform flex justify-center items-center">
               <span id="txt-submit-lead-auto">Guardar Lead</span>
             </button>
           </form>
           
           <div class="mt-4">
             <h5 class="font-bold text-xs uppercase mb-2 text-neutral-500 tracking-wider">Historial de Leads del Vehículo</h5>
             <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
               ${listHtml}
             </div>
           </div>
         </div>
       `;
    } else if (window.state.daActiveSection === 'taller') {
       if(!a.gastos || a.gastos.length === 0) {
         html += `
           <p class="text-neutral-500 text-sm font-bold text-center py-6">
             No hay gastos de taller registrados para este vehículo.
           </p>
         `;
       } else {
         html += `
         <div class="space-y-3">
           ${a.gastos.slice().reverse().map(g => `
             <div class="flex justify-between items-center p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700">
               <div>
                 <p class="font-bold text-sm">${g.descripcion}</p>
                 <p class="text-xs text-neutral-500 mt-1 uppercase tracking-wider">${g.categoria} • ${window.formatDate(g.fecha)}</p>
               </div>
               <span class="font-black text-rose-600 dark:text-rose-400">${window.formatMoney(g.monto)}</span>
             </div>
           `).join('')}
         </div>
         `;
       }
    }
  } else {
    
    html += `
      <button type="button" onclick="window.state.isVentaMode=false; window.renderDetalleAuto()" class="mb-6 text-sm font-bold flex items-center hover:underline text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
        <i data-lucide="arrow-left" class="w-4 h-4 mr-1"></i> Volver a Ficha
      </button>
    `;
    
    if (window.state.currentUser.rol === 'Admin') {
      html += `
        <div class="bg-black dark:bg-white text-white dark:text-black rounded-[2rem] p-6 mb-6 flex justify-between shadow-xl border border-neutral-800 dark:border-neutral-200">
          <div>
            <p class="text-xs uppercase opacity-70 mb-1 font-bold">Costo Inversión Total</p>
            <p class="text-xl font-bold">${window.formatMoney((a.costo||0) + tg)}</p>
          </div>
          <div class="text-right">
            <p class="text-xs uppercase opacity-70 mb-1 font-bold">Ganancia Bruta Est.</p>
            <p class="text-xl font-black text-green-400 dark:text-green-600">${window.formatMoney(a.precio - ((a.costo||0) + tg))}</p>
          </div>
        </div>
      `;
    }

    html += `
      <form id="btn-submit-venta" onsubmit="window.handleDAVentaSubmit(event, '${a.id}')">
        
        <div class="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 mb-6">
          <h4 class="font-bold mb-4 text-sm uppercase text-neutral-500 tracking-wider">Datos Comprador</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input id="vent-comp-nombre" required placeholder="Nombre y Apellido" class="col-span-2 w-full rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="vent-comp-tel" required placeholder="Teléfono" class="col-span-2 w-full rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="vent-comp-dni" required placeholder="D.N.I" class="col-span-2 md:col-span-1 w-full rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="vent-comp-domicilio" required placeholder="Domicilio" class="col-span-2 md:col-span-3 w-full rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
          </div>
        </div>
        
        <div class="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 mb-6">
          <h4 class="font-bold mb-4 text-sm uppercase text-neutral-500 tracking-wider">Formas de Pago Aplicadas</h4>
          
          <label class="flex items-center space-x-2 mb-2 font-bold cursor-pointer">
            <input type="checkbox" id="chk-efectivo" onchange="document.getElementById('div-efectivo').classList.toggle('hidden', !this.checked)" class="w-5 h-5 text-green-600 rounded"> 
            <span>Efectivo / Transferencia (Inmediato a Caja)</span>
          </label>
          <div id="div-efectivo" class="hidden pl-8 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 fade-in">
            <input id="val-efectivo" type="number" placeholder="Monto ($)" class="rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-bold text-lg outline-none focus:border-green-500">
            <input id="nota-efectivo" type="text" placeholder="Nota / Banco..." class="rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:border-green-500 font-bold">
          </div>
          
          <label class="flex items-center space-x-2 mb-2 font-bold cursor-pointer">
            <input type="checkbox" id="chk-credito" onchange="document.getElementById('div-credito').classList.toggle('hidden', !this.checked)" class="w-5 h-5 text-green-600 rounded"> 
            <span>Crédito Pre-Aprobado (Cobro en Caja)</span>
          </label>
          <div id="div-credito" class="hidden pl-8 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl fade-in">
            <input id="val-credito" type="number" placeholder="Monto Total a Financiar ($)" class="col-span-2 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 font-bold outline-none focus:border-green-500">
            <input id="cuotas-credito" type="number" placeholder="Cant. Cuotas" class="rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 font-bold outline-none focus:border-green-500">
            <input id="venc-credito" type="date" class="rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 text-xs font-bold outline-none focus:border-green-500" title="1º Vencimiento">
            <input id="nota-credito" type="text" placeholder="Entidad / Financiera..." class="col-span-4 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 font-bold outline-none focus:border-green-500">
          </div>
          
          <label class="flex items-center space-x-2 mb-2 font-bold cursor-pointer">
            <input type="checkbox" id="chk-pagare" onchange="document.getElementById('div-pagare').classList.toggle('hidden', !this.checked)" class="w-5 h-5 text-green-600 rounded"> 
            <span>Pagaré Personal (Cobro en Caja)</span>
          </label>
          <div id="div-pagare" class="hidden pl-8 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl fade-in">
            <input id="val-pagare" type="number" placeholder="Monto Total a Financiar ($)" class="col-span-2 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 font-bold outline-none focus:border-green-500">
            <input id="cuotas-pagare" type="number" placeholder="Cant. Cuotas" class="rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 font-bold outline-none focus:border-green-500">
            <input id="venc-pagare" type="date" class="rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 text-xs font-bold outline-none focus:border-green-500" title="1º Vencimiento">
            <input id="nota-pagare" type="text" placeholder="Detalle / Aval..." class="col-span-4 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 font-bold outline-none focus:border-green-500">
          </div>
        </div>
        
        <div class="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 mb-8">
          <div class="flex justify-between items-center mb-6">
            <h4 class="font-bold flex items-center text-neutral-700 dark:text-neutral-300">
              <i data-lucide="repeat" class="w-5 h-5 mr-2 opacity-60"></i> Recibe Vehículo en Permuta
            </h4>
            
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" id="vent-hasperm" class="sr-only toggle-checkbox" onchange="document.getElementById('permuta-fields').classList.toggle('hidden', !this.checked); window.state.ventaData.tienePermuta=this.checked;" ${window.state.ventaData.tienePermuta ? 'checked' : ''} />
              <div class="toggle-label bg-neutral-300 dark:bg-neutral-600 relative">
                <div class="absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${window.state.ventaData.tienePermuta ? 'translate-x-6' : ''}"></div>
              </div>
            </label>
          </div>
          
          <div id="permuta-fields" class="${window.state.ventaData.tienePermuta ? '' : 'hidden'} grid grid-cols-2 md:grid-cols-3 gap-4 fade-in">
            <input id="p-marca" placeholder="Marca" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="p-modelo" placeholder="Modelo" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="p-color" placeholder="Color" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="p-km" type="number" placeholder="Km" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="p-anio" type="number" placeholder="Año" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="p-pat" placeholder="Patente" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 uppercase outline-none font-bold focus:border-green-500" />
            
            <select id="p-condicion" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500">
              <option value="Propio">Propio</option>
              <option value="Consignación">Consignación</option>
            </select>
            
            <div class="col-span-2 mt-2">
              <label class="block text-xs font-bold uppercase mb-2 text-neutral-500">Valor Real de Toma / Costo ($)</label>
              <input id="p-valor" type="number" placeholder="Ingresará a la flota con este costo base" class="w-full rounded-xl px-4 py-4 text-lg font-black bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none focus:border-green-500" />
            </div>
          </div>
        </div>
        
        <button type="submit" class="w-full py-5 bg-green-600 text-white font-black text-lg rounded-2xl shadow-xl hover:bg-green-700 hover:scale-[1.01] transition-transform flex justify-center items-center">
          <span id="txt-submit-venta">Confirmar Cierre de Venta</span>
        </button>
      </form>
    `;
  }
  
  document.getElementById('da-content').innerHTML = html;
  lucide.createIcons();
};

window.renderCajaView = () => {
  let myTrans = window.state.transacciones;
  
  if(window.state.currentUser.rol === 'Vendedor') { 
    myTrans = myTrans.filter(t => t.userId === window.state.currentUser.id); 
  } else if (window.state.currentUser.rol === 'Encargado') { 
    const usuariosValidos = window.state.usuarios.filter(u => u.sucursalId === window.state.currentUser.sucursalId && u.rol !== 'Admin').map(u => u.id);
    myTrans = myTrans.filter(t => usuariosValidos.includes(t.userId)); 
  }

  if(window.state.currentUser.rol !== 'Vendedor') {
    const fc = document.getElementById('caja-filters-container'); 
    if(fc) fc.classList.remove('hidden');
    
    let users = window.state.usuarios;
    if (window.state.currentUser.rol === 'Encargado') {
       users = users.filter(u => u.sucursalId === window.state.currentUser.sucursalId && u.rol !== 'Admin');
    }
    
    if(fc) {
      fc.innerHTML = `
        <div class="flex-1 min-w-[200px]">
          <label class="text-xs font-bold text-neutral-500 block mb-1">Filtrar por Usuario</label>
          <select onchange="window.state.cajaFilterUser=this.value; window.renderCajaView()" class="w-full bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 outline-none focus:border-green-500">
            <option value="all">Todas las cajas permitidas</option>
            ${users.map(u => `
              <option value="${u.id}" ${window.state.cajaFilterUser === u.id ? 'selected' : ''}>${u.nombre}</option>
            `).join('')}
          </select>
        </div>
      `;
    }
    
    if(window.state.cajaFilterUser !== 'all') { 
      myTrans = myTrans.filter(t => t.userId === window.state.cajaFilterUser); 
    }
  }

  const btnPendientes = document.getElementById('btn-ver-pendientes');
  if(btnPendientes) {
    btnPendientes.classList.remove('hidden'); 
    btnPendientes.classList.add('inline-flex'); 
  }

  const sorted = [...myTrans].sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
  let saldo = 0; 
  
  const transWithSaldo = sorted.map(t => { 
    if(t.estadoCobro !== 'pendiente') { 
      saldo += t.tipo === 'ingreso' ? Number(t.valor) : -Number(t.valor); 
    } 
    return { ...t, saldoDisponible: saldo }; 
  });
  
  const ing = transWithSaldo.filter(t => t.tipo === 'ingreso' && t.estadoCobro !== 'pendiente').reduce((a,c) => a + c.valor, 0); 
  const egr = transWithSaldo.filter(t => t.tipo === 'gasto').reduce((a,c) => a + c.valor, 0);

  const statContainer = document.getElementById('caja-stats');
  if(statContainer) {
    statContainer.innerHTML = `
      <div class="relative p-6 bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
        <h3 class="text-sm font-medium text-neutral-500 mb-1">Saldo Real Disponible</h3>
        <p class="text-3xl font-black ${saldo >= 0 ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-400'}">${window.formatMoney(saldo)}</p>
      </div>
      <div class="relative p-6 bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
        <h3 class="text-sm font-medium text-neutral-500 mb-1">Ingresos Efectivizados</h3>
        <p class="text-3xl font-black text-green-600 dark:text-green-500">${window.formatMoney(ing)}</p>
      </div>
      <div class="relative p-6 bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
        <h3 class="text-sm font-medium text-neutral-500 mb-1">Egresos Registrados</h3>
        <p class="text-3xl font-black text-rose-600 dark:text-rose-400">${window.formatMoney(egr)}</p>
      </div>
    `;
  }

  const tableContainer = document.getElementById('caja-table');
  if (tableContainer) {
    if (transWithSaldo.length === 0) { 
      tableContainer.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-8 text-neutral-500 font-bold">
            Sin movimientos en la caja seleccionada.
          </td>
        </tr>
      `; 
    } else {
      tableContainer.innerHTML = transWithSaldo.slice().reverse().map(t => {
        const u = window.state.usuarios.find(x => x.id === t.userId); 
        const s = window.state.sucursales.find(x => x.id === t.sucursalId);
        
        return `
          <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${t.estadoCobro === 'pendiente' ? 'opacity-50' : ''}">
            <td class="px-6 py-4">
              <div class="flex items-center space-x-4">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${t.tipo === 'ingreso' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}">
                  <i data-lucide="${t.tipo === 'ingreso' ? 'trending-up' : 'trending-down'}" class="w-5 h-5"></i>
                </div>
                <div>
                  <p class="text-sm font-bold flex items-center">
                    ${t.descripcion}
                    ${t.estadoCobro === 'pendiente' ? '<span class="ml-2 text-[10px] bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300 px-1 rounded">Pendiente</span>' : ''}
                  </p>
                  <div class="flex items-center space-x-2 mt-1">
                    <span class="text-xs text-neutral-500 uppercase">${t.categoria}</span>
                    ${t.tipoComprobante !== 'X' ? `<span class="bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300 text-[10px] font-bold px-1.5 py-0.5 rounded">Fac ${t.tipoComprobante}</span>` : ''}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <p class="text-sm font-bold">${u ? u.nombre : '-'}</p>
              <p class="text-xs text-neutral-500">${s ? s.nombre : ''}</p>
            </td>
            <td class="px-6 py-4 text-sm font-bold text-right ${t.tipo === 'ingreso' ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-400'}">
              ${t.tipo === 'ingreso' ? '+' : '-'}${window.formatMoney(t.valor)}
            </td>
            <td class="px-6 py-4 text-sm font-bold text-right">
              ${t.estadoCobro === 'pendiente' ? '-' : window.formatMoney(t.saldoDisponible)}
            </td>
          </tr>
        `;
      }).join('');
    }
  }
  lucide.createIcons();
};

window.openModalPendientes = () => { 
  let myTrans = window.state.transacciones;
  let myVentas = window.state.ventas;
  
  if(window.state.currentUser.rol === 'Vendedor') { 
    myTrans = myTrans.filter(t => t.userId === window.state.currentUser.id); 
    myVentas = myVentas.filter(v => v.userId === window.state.currentUser.id); 
  } else if (window.state.currentUser.rol === 'Encargado') { 
    const validUsers = window.state.usuarios.filter(u => u.sucursalId === window.state.currentUser.sucursalId && u.rol !== 'Admin').map(u => u.id);
    myTrans = myTrans.filter(t => validUsers.includes(t.userId)); 
    myVentas = myVentas.filter(v => validUsers.includes(v.userId)); 
  }

  const oldPendientes = myTrans.filter(t => t.estadoCobro === 'pendiente');
  const ventasPendientes = myVentas.filter(v => 
    (v.credito && v.credito.pagadas < v.credito.cuotas) ||
    (v.pagare && v.pagare.pagadas < v.pagare.cuotas)
  );

  let totalPendiente = 0;
  oldPendientes.forEach(t => totalPendiente += t.valor);
  ventasPendientes.forEach(v => {
    if(v.credito) totalPendiente += (v.credito.cuotas - v.credito.pagadas) * v.credito.valorCuota;
    if(v.pagare) totalPendiente += (v.pagare.cuotas - v.pagare.pagadas) * v.pagare.valorCuota;
  });

  const content = document.getElementById('pendientes-list-content');
  if(!content) return;

  if (oldPendientes.length === 0 && ventasPendientes.length === 0) { 
    content.innerHTML = `
      <p class="text-center text-neutral-500 py-6 font-bold">
        Sin cobros pendientes por el momento.
      </p>
    `; 
    window.openModal('modal-pendientes');
    return;
  }

  let html = '';
  
  if (window.state.currentUser && window.state.currentUser.rol === 'Admin') {
    html += `
      <div class="mb-6 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-400 p-4 rounded-2xl flex justify-between items-center">
        <span class="font-bold uppercase tracking-wider text-xs">Total Pendiente a Cobrar</span>
        <span class="font-black text-2xl">${window.formatMoney(totalPendiente)}</span>
      </div>
    `;
  }
  
  html += `<div class="space-y-4">`;

  ventasPendientes.forEach(v => {
    let internalHtml = '';
    
    if(v.credito && v.credito.pagadas < v.credito.cuotas) {
      internalHtml += `
        <div class="flex justify-between items-center mt-2 p-3 bg-white/60 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <span class="text-xs font-bold">Crédito: Cuota ${v.credito.pagadas + 1} de ${v.credito.cuotas}</span>
          <div class="flex items-center space-x-4">
            <span class="text-sm font-black text-green-600 dark:text-green-500">${window.formatMoney(v.credito.valorCuota)}</span>
            <button onclick="window.cobrarCuotaVenta('${v.id}', 'credito')" class="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-md flex items-center">
              <span id="btn-txt-credito-${v.id}">Cobrar</span>
            </button>
          </div>
        </div>
      `;
    }
    
    if(v.pagare && v.pagare.pagadas < v.pagare.cuotas) {
      internalHtml += `
        <div class="flex justify-between items-center mt-2 p-3 bg-white/60 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <span class="text-xs font-bold">Pagaré: Cuota ${v.pagare.pagadas + 1} de ${v.pagare.cuotas}</span>
          <div class="flex items-center space-x-4">
            <span class="text-sm font-black text-green-600 dark:text-green-500">${window.formatMoney(v.pagare.valorCuota)}</span>
            <button onclick="window.cobrarCuotaVenta('${v.id}', 'pagare')" class="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-md flex items-center">
              <span id="btn-txt-pagare-${v.id}">Cobrar</span>
            </button>
          </div>
        </div>
      `;
    }

    html += `
      <div class="border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden shadow-sm">
        <div class="bg-neutral-50 dark:bg-neutral-800 p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors" onclick="document.getElementById('pend-venta-${v.id}').classList.toggle('hidden')">
          <div>
             <p class="font-black text-sm text-neutral-900 dark:text-white">${v.compradorNombre}</p>
             <p class="text-xs text-neutral-500 font-bold mt-1">${v.autoDesc}</p>
          </div>
          <i data-lucide="chevron-down" class="w-5 h-5 text-neutral-400"></i>
        </div>
        <div id="pend-venta-${v.id}" class="hidden p-4 bg-neutral-100/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-700">
           ${internalHtml}
        </div>
      </div>
    `;
  });

  oldPendientes.forEach(t => {
    html += `
      <div class="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl shadow-sm">
        <div>
          <p class="font-bold text-sm text-neutral-900 dark:text-white">${t.descripcion}</p>
          <p class="text-xs text-amber-700 dark:text-amber-400 font-bold mt-1">Acreditación Original: ${window.formatDate(t.fechaAcreditacion)}</p>
        </div>
        <div class="text-right">
          <p class="font-black text-green-600 dark:text-green-500 mb-2">${window.formatMoney(t.valor)}</p>
          <button onclick="window.marcarCobrado('${t.id}')" class="px-4 py-2 bg-black text-white dark:bg-white dark:text-black text-xs font-bold rounded-lg hover:scale-105 transition-transform shadow-md flex items-center">
            <span id="btn-txt-pend-${t.id}">Cobrar en Caja</span>
          </button>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  content.innerHTML = html;
  
  window.openModal('modal-pendientes');
  lucide.createIcons();
};

window.renderFormulariosView = () => {
   const table = document.getElementById('formularios-table');
   if(!table) return;
   
   if(window.state.formularios.length === 0) { 
     table.innerHTML = `
       <tr>
         <td colspan="4" class="text-center py-8 text-neutral-500 font-bold">
           No hay formularios generados.
         </td>
       </tr>
     `; 
   } else {
     table.innerHTML = window.state.formularios.slice().reverse().map(f => `
       <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
         <td class="px-6 py-4 text-sm font-bold text-neutral-500">${window.formatDate(f.fecha)}</td>
         <td class="px-6 py-4 font-bold">
           <span class="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 px-2 py-1 rounded text-xs uppercase tracking-wider">
             ${f.tipo}
           </span>
         </td>
         <td class="px-6 py-4 font-bold text-sm">${f.comprador}</td>
         <td class="px-6 py-4 text-center space-x-2 flex justify-center">
           <button onclick='window.openModalBoleto("${f.tipo === 'Boleto Compra Venta' ? 'simple' : 'permuta'}", ${JSON.stringify(f).replace(/"/g, '&quot;')})' class="px-3 py-1.5 ${f.estado === 'Pendiente' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'} text-xs font-bold rounded-lg hover:scale-105 transition-transform flex items-center">
             <i data-lucide="edit-2" class="w-4 h-4 mr-1"></i> ${f.estado === 'Pendiente' ? 'Terminar' : 'Editar'}
           </button>
           <button onclick='window.imprimirBoletoHtml(${JSON.stringify(f).replace(/"/g, '&quot;')})' class="px-3 py-1.5 bg-black text-white dark:bg-neutral-700 dark:text-white text-xs font-bold rounded-lg hover:scale-105 transition-transform flex items-center">
             <i data-lucide="printer" class="w-4 h-4 mr-1"></i> Reimprimir
           </button>
         </td>
       </tr>
     `).join('');
   }
   lucide.createIcons();
};

window.renderPersonalView = () => {
  if(window.state.currentUser?.rol !== 'Admin') return;
  
  const table = document.getElementById('personal-table');
  const select = document.getElementById('comision-user');
  const tableCierres = document.getElementById('cierres-table');
  const modalCierreList = document.getElementById('cierre-checkboxes-list');
  
  const usuariosAgencia = window.state.usuarios.filter(u => u.rol === 'Vendedor' || u.rol === 'Encargado').sort((a, b) => a.nombre.localeCompare(b.nombre));
  
  let totLiq = 0;
  let checkboxHtml = '';
  
  if (table) {
    const dataRows = usuariosAgencia.map(u => {
      const pdtes = window.state.comisiones.filter(c => c.userId === u.id && c.estado === 'Pendiente');
      const totPdte = pdtes.reduce((a,c) => a + c.monto, 0);
      totLiq += totPdte;
      
      const suc = window.state.sucursales.find(s => s.id == u.sucursalId)?.nombre || '-';
      
      if(totPdte > 0) {
        checkboxHtml += `
          <label class="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl cursor-pointer hover:border-green-500">
            <div class="flex items-center">
              <input type="checkbox" checked value="${u.id}" class="cierre-user-checkbox w-5 h-5 text-green-600 rounded mr-3" onchange="window.calcularTotalPagos()">
              <span class="font-bold text-sm">${u.nombre}</span>
            </div>
            <span class="font-black text-rose-500" data-amount="${totPdte}">${window.formatMoney(totPdte)}</span>
          </label>
        `;
      }

      return `
        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer" onclick="window.openDetallePersonal('${u.id}')">
          <td class="px-6 py-4 font-bold flex items-center">
             <div class="w-2 h-2 rounded-full mr-2 ${totPdte > 0 ? 'bg-amber-500' : 'bg-transparent'}"></div>
             ${u.nombre}
          </td>
          <td class="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">${u.rol}</td>
          <td class="px-6 py-4 text-sm">${suc}</td>
          <td class="px-6 py-4 text-right font-black text-lg ${totPdte > 0 ? 'text-green-600 dark:text-green-500' : 'text-neutral-400'}">${window.formatMoney(totPdte)}</td>
        </tr>
      `;
    }).join('');
    
    table.innerHTML = dataRows || `
      <tr>
        <td colspan="4" class="text-center py-8 text-neutral-500 font-bold">
          No hay personal para comisionar.
        </td>
      </tr>
    `;
  }
  
  if(modalCierreList) {
    if(checkboxHtml === '') {
      modalCierreList.innerHTML = `<p class="text-sm text-neutral-500 text-center italic">No hay comisiones pendientes.</p>`;
    } else {
      modalCierreList.innerHTML = checkboxHtml;
    }
  }

  if (document.getElementById('monto-total-liquidar')) {
    document.getElementById('monto-total-liquidar').innerText = window.formatMoney(totLiq);
  }
  
  if (select) {
    select.innerHTML = `
      <option value="">-- Seleccione Empleado --</option>
    ` + usuariosAgencia.map(u => `
      <option value="${u.id}">${u.nombre} (${u.rol})</option>
    `).join('');
  }
  
  if (tableCierres) {
    const cierres = window.state.cierres_personal || [];
    
    if(cierres.length === 0) {
      tableCierres.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-8 text-neutral-500 font-bold">
            No hay cierres registrados.
          </td>
        </tr>
      `;
    } else {
      tableCierres.innerHTML = cierres.slice().reverse().map(c => `
        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
          <td class="px-6 py-4 font-bold text-sm">${window.formatDate(c.fecha)}</td>
          <td class="px-6 py-4 text-sm font-bold text-neutral-500">${c.cantidadMovimientos || 0} comisiones</td>
          <td class="px-6 py-4 text-right font-black text-rose-600 dark:text-rose-400">${window.formatMoney(c.total)}</td>
          <td class="px-6 py-4 text-center">
             <button onclick="window.openDetalleCierre('${c.id}')" class="px-4 py-2 bg-black text-white dark:bg-neutral-700 dark:text-white text-xs font-bold rounded-xl hover:scale-105 transition-transform">
               Ver Ticket
             </button>
          </td>
        </tr>
      `).join('');
    }
  }
};

window.openDetallePersonal = (userId) => {
  const u = window.state.usuarios.find(x => x.id === userId);
  if(!u) return;
  
  const comisionesUsuario = window.state.comisiones.filter(c => c.userId === userId).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
  
  let html = `
    <div class="mb-6 flex items-center space-x-4">
      <div class="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-black text-2xl">
        ${u.nombre.charAt(0).toUpperCase()}
      </div>
      <div>
        <h4 class="text-2xl font-black">${u.nombre}</h4>
        <p class="text-sm text-neutral-500 font-bold uppercase tracking-wider">${u.rol}</p>
      </div>
    </div>
  `;
  
  if(comisionesUsuario.length === 0) {
    html += `
      <p class="text-neutral-500 text-center py-6 font-bold">
        No hay registro de comisiones para este empleado.
      </p>
    `;
  } else {
    html += `
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
            <th class="py-3">Fecha</th>
            <th class="py-3">Contexto Venta</th>
            <th class="py-3">Estado</th>
            <th class="py-3 text-right">Monto</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/50">
          ${comisionesUsuario.map(c => {
            let autoDesc = c.descripcion || 'Manual / Bono';
            if (c.ventaId) {
               const v = window.state.ventas.find(x => x.id === c.ventaId);
               if(v) autoDesc = `Venta: ${v.autoDesc}`;
            }
            return `
            <tr>
              <td class="py-4 text-sm font-bold text-neutral-600 dark:text-neutral-400">${window.formatDate(c.fecha)}</td>
              <td class="py-4 text-sm font-bold truncate max-w-[150px]" title="${autoDesc}">${autoDesc}</td>
              <td class="py-4">
                <span class="px-2 py-1 text-[10px] font-bold uppercase rounded-md ${c.estado === 'Pendiente' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'}">
                  ${c.estado}
                </span>
              </td>
              <td class="py-4 text-right font-black ${c.estado === 'Pendiente' ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500 line-through'}">
                ${window.formatMoney(c.monto)}
              </td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
    `;
  }
  
  document.getElementById('dp-content').innerHTML = html;
  window.openModal('modal-detalle-personal');
};

window.openDetalleCierre = (cierreId) => {
  const cierre = window.state.cierres_personal.find(c => c.id === cierreId);
  if(!cierre) return;
  
  const comisionesPagadas = window.state.comisiones.filter(c => c.cierreId === cierreId);
  
  let html = `
    <div class="mb-8 flex justify-between items-end border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div>
        <p class="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Fecha de Liquidación</p>
        <h4 class="text-2xl font-black">${window.formatDate(cierre.fecha)}</h4>
      </div>
      <div class="text-right">
        <p class="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Abonado</p>
        <p class="text-3xl font-black text-rose-600 dark:text-rose-400">${window.formatMoney(cierre.total)}</p>
      </div>
    </div>
    
    <h5 class="font-bold text-lg mb-4">Desglose del Ticket</h5>
  `;
  
  if(comisionesPagadas.length === 0) {
    html += `
      <p class="text-neutral-500">
        Detalle no disponible o vacío.
      </p>
    `;
  } else {
    const agrupado = {};
    comisionesPagadas.forEach(c => {
      if(!agrupado[c.userId]) agrupado[c.userId] = { total: 0, items: [] };
      agrupado[c.userId].total += c.monto;
      agrupado[c.userId].items.push(c);
    });
    
    html += `<div class="space-y-6">`;
    for(let userId in agrupado) {
      const u = window.state.usuarios.find(x => x.id === userId);
      const nombre = u ? u.nombre : 'Usuario Eliminado';
      const userGroup = agrupado[userId];
      
      html += `
        <div class="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
          <div class="flex justify-between items-center mb-3 border-b border-neutral-200 dark:border-neutral-700 pb-2">
            <span class="font-black text-lg">${nombre}</span>
            <span class="font-black text-green-600 dark:text-green-500">${window.formatMoney(userGroup.total)}</span>
          </div>
          <ul class="space-y-2 pl-2">
            ${userGroup.items.map(item => {
              let autoDesc = item.descripcion || 'Carga Manual';
              if (item.ventaId) {
                 const v = window.state.ventas.find(x => x.id === item.ventaId);
                 if(v) autoDesc = `Venta: ${v.autoDesc}`;
              }
              return `
              <li class="flex justify-between text-sm">
                <span class="text-neutral-600 dark:text-neutral-400 font-bold">• ${autoDesc} <span class="text-[10px] text-neutral-400 font-normal ml-2">(Orig: ${window.formatDate(item.fecha)})</span></span>
                <span class="font-black text-neutral-800 dark:text-neutral-200">${window.formatMoney(item.monto)}</span>
              </li>
              `;
            }).join('')}
          </ul>
        </div>
      `;
    }
    html += `</div>`;
  }
  
  document.getElementById('dc-content').innerHTML = html;
  window.openModal('modal-detalle-cierre');
};

window.renderVentasView = () => { 
  let misVentas = window.state.ventas;
  
  if(window.state.currentUser.rol === 'Vendedor') {
     misVentas = misVentas.filter(v => v.userId === window.state.currentUser.id);
  } else if (window.state.currentUser.rol === 'Encargado') {
     const validUsers = window.state.usuarios.filter(u => u.sucursalId === window.state.currentUser.sucursalId && u.rol !== 'Admin').map(u => u.id);
     misVentas = misVentas.filter(v => validUsers.includes(v.userId));
  }
  
  const table = document.getElementById('ventas-table'); 
  if(!table) return;
  
  if (misVentas.length === 0) { 
    table.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-8 text-neutral-500 font-bold">
          No hay ventas registradas.
        </td>
      </tr>
    `; 
  } else { 
    table.innerHTML = misVentas.slice().reverse().map(v => { 
      let badge = ''; 
      const metodos = v.metodoPago || ''; 
      
      if (metodos.includes('Crédito') || metodos.includes('Pagaré')) { 
        let pendientes = 0;
        if(v.credito) pendientes += (v.credito.cuotas - v.credito.pagadas);
        if(v.pagare) pendientes += (v.pagare.cuotas - v.pagare.pagadas);
        if(!v.credito && !v.pagare) pendientes = (v.cuotasTotales || 0) - (v.cuotasPagadas || 0);

        if (pendientes > 0) {
          badge = `
            <span class="block mt-1 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded font-bold">
              ${pendientes} Pendientes
            </span>
          `; 
        } else if (pendientes === 0) {
          badge = `
            <span class="block mt-1 text-[10px] text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded font-bold">
              Finalizado
            </span>
          `; 
        }
      } 
      
      return `
        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors" onclick="window.openDetalleVenta('${v.id}')">
          <td class="px-6 py-4 text-sm text-neutral-500">${window.formatDate(v.fecha)}</td>
          <td class="px-6 py-4">
            <p class="font-bold text-sm">${v.compradorNombre || '-'}</p>
            <p class="text-xs text-neutral-500 flex items-center mt-1"><i data-lucide="phone" class="w-3 h-3 mr-1"></i>${v.compradorTelefono || '-'}</p>
          </td>
          <td class="px-6 py-4 font-bold text-sm">${v.autoDesc || '-'}</td>
          <td class="px-6 py-4 text-right font-black">${window.formatMoney(v.montoTotal || 0)}</td>
          <td class="px-6 py-4 text-center">
            <span class="text-xs uppercase font-bold text-neutral-700 dark:text-neutral-300">${metodos}</span>
            ${badge}
          </td>
        </tr>
      `; 
    }).join(''); 
  } 
  lucide.createIcons(); 
};

window.openDetalleVenta = (id) => { 
  const v = window.state.ventas.find(x => x.id === id); 
  if(!v) return; 
  
  const metodos = v.metodoPago || ''; 
  
  let html = `
    <div class="space-y-4 text-sm">
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Fecha</span>
        <span class="font-bold">${window.formatDate(v.fecha)}</span>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Comprador</span>
        <span class="font-bold text-right">${v.compradorNombre || '-'} <br><span class="text-xs text-neutral-400">DNI: ${v.compradorDNI || '-'}</span></span>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Teléfono</span>
        <a href="${window.formatWhatsAppLink(v.compradorTelefono || '', '')}" target="_blank" class="font-bold text-green-500 hover:underline">${v.compradorTelefono || '-'}</a>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Domicilio</span>
        <span class="font-bold text-right">${v.compradorDomicilio || '-'}</span>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Vehículo</span>
        <span class="font-bold text-right">${v.autoDesc || '-'}</span>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Monto Operación</span>
        <span class="font-black text-lg">${window.formatMoney(v.montoTotal || 0)}</span>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Métodos Aplicados</span>
        <span class="font-bold uppercase">${metodos}</span>
      </div>
      ${v.tienePermuta ? `
        <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <span class="text-neutral-500">Permuta Entregada</span>
          <span class="font-bold text-right">${v.detallePermuta || '-'}</span>
        </div>
      ` : ''}
    </div>
  `; 
  
  if(window.state.currentUser && window.state.currentUser.rol === 'Admin') {
    let patenteStr = '';
    const match = v.autoDesc.match(/\(([^)]+)\)/);
    if(match) patenteStr = match[1];

    const a = window.state.autos.find(x => x.patente === patenteStr);
    
    const costo = a ? a.costo || 0 : 0;
    const gastos = a && a.gastos ? a.gastos.reduce((acc, g) => acc + g.monto, 0) : 0;
    const comisiones = window.state.comisiones.filter(c => c.ventaId === v.id).reduce((acc, c) => acc + c.monto, 0);
    const totalEgresos = costo + gastos + comisiones;
    const ganancia = v.montoTotal - totalEgresos;
    const colorGanancia = ganancia >= 0 ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-500';
           
    html += `
      <div class="mt-6 border border-neutral-200 dark:border-neutral-700 rounded-[2rem] overflow-hidden shadow-sm">
        <div class="bg-neutral-100 dark:bg-neutral-800 p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors" onclick="document.getElementById('rentab-v-${v.id}').classList.toggle('hidden')">
          <span class="font-black text-sm uppercase tracking-wider flex items-center">
            <i data-lucide="bar-chart-2" class="w-4 h-4 mr-2"></i> Análisis de Rentabilidad
          </span>
          <i data-lucide="chevron-down" class="w-5 h-5 text-neutral-500"></i>
        </div>
        <div id="rentab-v-${v.id}" class="hidden p-6 bg-neutral-50 dark:bg-neutral-800/50">
          <div class="space-y-3 text-sm">
            <div class="flex justify-between items-center"><span class="text-neutral-500 font-bold">Ingreso por Venta Bruto</span><span class="font-black text-lg">${window.formatMoney(v.montoTotal)}</span></div>
            <div class="flex justify-between items-center"><span class="text-neutral-500 font-bold">Costo Origen Vehículo</span><span class="font-black text-rose-500">-${window.formatMoney(costo)}</span></div>
            <div class="flex justify-between items-center"><span class="text-neutral-500 font-bold">Inversión (Gastos Taller)</span><span class="font-black text-rose-500">-${window.formatMoney(gastos)}</span></div>
            <div class="flex justify-between items-center"><span class="text-neutral-500 font-bold">Comisiones Pagadas</span><span class="font-black text-rose-500">-${window.formatMoney(comisiones)}</span></div>
            <div class="flex justify-between items-center border-t border-neutral-200 dark:border-neutral-700 pt-3 mt-2"><span class="font-black uppercase text-base">Utilidad Neta</span><span class="font-black text-2xl ${colorGanancia}">${window.formatMoney(ganancia)}</span></div>
          </div>
        </div>
      </div>
    `;

    html += `
      <div class="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <button onclick="window.openModalComisionPorVenta('${v.id}')" class="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow hover:bg-green-700 transition-colors">
          <i data-lucide="award" class="w-5 h-5 inline mr-2"></i>Asignar Comisión a Personal
        </button>
      </div>
    `;
  }
  
  document.getElementById('venta-detail-content').innerHTML = html;
  window.openModal('modal-detalle-venta'); 
  lucide.createIcons();
};

window.renderFacturasView = () => { 
  if(window.state.currentUser?.rol !== 'Admin') return; 
  
  const facturas = window.state.transacciones.filter(t => ['A','B','C'].includes(t.tipoComprobante)); 
  const totalEmitido = facturas.reduce((a,c) => a + c.valor, 0); 
  const totalIva = facturas.reduce((a,c) => a + (c.iva || 0), 0); 
  
  const fs = document.getElementById('facturas-summary');
  if(fs) {
    fs.innerHTML = `
      <div class="p-8 bg-black dark:bg-neutral-800 rounded-3xl text-white shadow-xl border border-neutral-800 dark:border-neutral-700">
        <p class="text-neutral-400 text-sm font-bold uppercase tracking-wider mb-2">Monto Facturado (Global)</p>
        <p class="text-5xl font-black">${window.formatMoney(totalEmitido)}</p>
      </div>
      <div class="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <p class="text-neutral-500 dark:text-neutral-400 text-sm font-bold uppercase tracking-wider mb-2">IVA Acumulado (Fac. A)</p>
        <p class="text-5xl font-black text-neutral-900 dark:text-white">${window.formatMoney(totalIva)}</p>
      </div>
    `; 
  }
  
  const table = document.getElementById('facturas-table'); 
  if(!table) return;
  
  if(facturas.length === 0) { 
    table.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-8 text-neutral-500 font-bold">
          No hay facturas.
        </td>
      </tr>
    `; 
  } else { 
    table.innerHTML = facturas.slice().reverse().map(f => { 
      const u = window.state.usuarios.find(x => x.id === f.userId); 
      return `
        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
          <td class="px-6 py-4">
            <span class="inline-block bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200 font-bold text-[10px] uppercase px-2 py-1 rounded mb-1">
              Tipo ${f.tipoComprobante}
            </span>
            <p class="font-mono text-sm font-bold">${f.numComprobante || 'S/N'}</p>
          </td>
          <td class="px-6 py-4 text-sm text-neutral-500">${window.formatDate(f.fecha)}</td>
          <td class="px-6 py-4">
            <p class="font-bold">${f.descripcion}</p>
            <p class="text-xs text-neutral-400 mt-1">Por: ${u ? u.nombre : '-'}</p>
          </td>
          <td class="px-6 py-4 text-right font-black text-lg">${window.formatMoney(f.valor)}</td>
          <td class="px-6 py-4 text-center">
            ${f.tipoComprobante === 'A' ? `
              <button onclick="window.openDetalleFactura('${f.id}')" class="text-xs font-bold uppercase tracking-wider bg-black text-white dark:bg-neutral-700 px-4 py-2 rounded-xl hover:bg-neutral-800 transition-colors">
                Ver Detalle
              </button>
            ` : `
              <span class="text-neutral-300 dark:text-neutral-700">-</span>
            `}
          </td>
        </tr>
      `; 
    }).join(''); 
  } 
};

window.openDetalleFactura = (id) => { 
  const t = window.state.transacciones.find(x => x.id === id); 
  if(!t) return;
  const subtotal = t.valor - (t.iva || 0); 
  
  document.getElementById('factura-detail-content').innerHTML = `
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-black text-white flex items-center justify-center text-3xl font-black mx-auto mb-3 rounded-2xl shadow-md border border-neutral-800">A</div>
      <p class="font-mono text-neutral-500 font-bold">${t.numComprobante}</p>
    </div>
    <div class="space-y-4 mb-8">
      <div class="flex justify-between text-sm">
        <span class="text-neutral-500 font-bold uppercase tracking-wider">Fecha:</span> 
        <span class="font-bold">${window.formatDate(t.fecha)}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-neutral-500 font-bold uppercase tracking-wider">Operación:</span> 
        <span class="font-bold text-right">${t.descripcion}</span>
      </div>
    </div>
    <div class="border-t border-neutral-200 dark:border-neutral-700 pt-6 space-y-3">
      <div class="flex justify-between text-sm">
        <span class="text-neutral-500 font-bold uppercase tracking-wider">Subtotal:</span> 
        <span class="font-bold text-lg">${window.formatMoney(subtotal)}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-neutral-500 font-bold uppercase tracking-wider">IVA:</span> 
        <span class="font-bold text-lg">${window.formatMoney(t.iva)}</span>
      </div>
      <div class="flex justify-between text-xl mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <span class="font-black uppercase tracking-wider">Total:</span> 
        <span class="font-black text-2xl text-green-600 dark:text-green-500">${window.formatMoney(t.valor)}</span>
      </div>
    </div>
  `; 
  window.openModal('modal-detalle-factura'); 
};

window.openDetalleLead = (id) => {
  const c = window.state.consultas.find(x => x.id === id);
  if(!c) return;

  const a = c.autoId ? window.state.autos.find(x => x.id === c.autoId) : null;
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
          <input id="edit-lead-nombre" required class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none focus:border-green-500 font-bold" value="${c.nombre}" />
        </div>
        <div>
          <label class="block text-xs font-bold text-neutral-500 uppercase mb-1">Teléfono</label>
          <input id="edit-lead-tel" required class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none focus:border-green-500 font-bold" value="${c.telefono}" />
        </div>
        <div>
          <label class="block text-xs font-bold text-neutral-500 uppercase mb-1">Vehículo / Interés</label>
          <input id="edit-lead-interes" required class="w-full rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 outline-none focus:border-green-500 font-bold" value="${autoInfo}" ${a ? 'readonly title="Viene de un auto en stock"' : ''} />
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
  lucide.createIcons();
};

window.renderClientesView = () => { 
  const table = document.getElementById('crm-table'); 
  if(!table) return;
  
  let misConsultas = window.state.consultas;
  
  if(window.state.currentUser.rol === 'Vendedor') {
     misConsultas = misConsultas.filter(c => c.userId === window.state.currentUser.id);
  } else if (window.state.currentUser.rol === 'Encargado') {
     const validUsers = window.state.usuarios.filter(u => u.sucursalId === window.state.currentUser.sucursalId && u.rol !== 'Admin').map(u => u.id);
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
    table.innerHTML = misConsultas.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)).map(c => { 
      const a = c.autoId ? window.state.autos.find(x => x.id === c.autoId) : null; 
      
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
      
      return `
        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer" onclick="window.openDetalleLead('${c.id}')">
          <td class="px-6 py-4">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center mr-4 font-black text-lg">
                ${c.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <p class="font-bold">${c.nombre}</p>
                <span class="inline-flex px-2 py-0.5 mt-1 rounded-md text-[10px] font-black uppercase tracking-widest ${lClass}">
                  ${dynamicState}
                </span>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 text-sm font-bold">
            ${c.telefono}
          </td>
          <td class="px-6 py-4">
            ${a ? `
              <span class="font-bold text-sm text-green-600 dark:text-green-500 hover:underline" onclick="event.stopPropagation(); window.openDetalleAuto('${a.id}')">
                ${a.marca} ${a.modelo}
              </span>
            ` : `
              <span class="font-bold text-sm">
                ${c.marcaInteres}
              </span>
            `}
            <p class="text-xs text-neutral-500 italic mt-1 max-w-[200px] truncate">"${c.notas}"</p>
          </td>
          <td class="px-6 py-4 text-sm font-bold text-neutral-500">
            Orig: ${window.formatDate(c.fecha)}
          </td>
          <td class="px-6 py-4">
            <a href="${window.formatWhatsAppLink(c.telefono, '')}" onclick="event.stopPropagation()" target="_blank" class="px-4 py-2 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md transition-transform hover:scale-105 hover:bg-green-700 inline-block">
              Contactar
            </a>
          </td>
        </tr>
      `; 
    }).join(''); 
  } 
};

window.renderResumenesView = () => { 
  if(window.state.currentUser?.rol !== 'Admin') return; 
  const dc = document.getElementById('dashboard-content');
  if(!dc) return;
  
  const ing = window.state.transacciones.filter(t => t.tipo === 'ingreso').reduce((a,c) => a + c.valor, 0); 
  let egr = window.state.transacciones.filter(t => t.tipo === 'gasto').reduce((a,c) => a + c.valor, 0); 
  
  const cats = window.state.transacciones.filter(t => t.tipo === 'gasto').reduce((a,c) => { 
    a[c.categoria] = (a[c.categoria] || 0) + c.valor; 
    return a; 
  }, {}); 
  
  window.state.autos.forEach(a => { 
    a.gastos?.forEach(g => { 
      cats[g.categoria] = (cats[g.categoria] || 0) + g.monto; 
      egr += g.monto; 
    }); 
  }); 
  
  const max = Math.max(...Object.values(cats), 1); 
  
  let catHTML = ''; 
  if(Object.keys(cats).length === 0) { 
    catHTML = `
      <p class="text-neutral-500 py-4 font-bold">
        Sin datos de gastos en el periodo.
      </p>
    `; 
  } else { 
    catHTML = Object.entries(cats).sort((a,b) => b[1] - a[1]).map(([c,v]) => `
      <div class="mb-4">
        <div class="flex justify-between text-sm mb-2">
          <span class="text-neutral-600 dark:text-neutral-300 font-bold uppercase tracking-wider text-[10px]">${c}</span>
          <span class="font-black">${window.formatMoney(v)}</span>
        </div>
        <div class="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-3">
          <div class="bg-green-600 h-3 rounded-full" style="width: ${(v/max)*100}%"></div>
        </div>
      </div>
    `).join(''); 
  } 
  
  dc.innerHTML = `
    <div class="bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 p-8 rounded-[2rem] shadow-sm">
      <h3 class="font-black text-2xl mb-8">Flujo de Fondos Operativo</h3>
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <span class="text-neutral-500 font-bold uppercase tracking-wider text-xs">Ingresos Totales</span>
          <span class="font-black text-xl text-green-600 dark:text-green-500">${window.formatMoney(ing)}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-neutral-500 font-bold uppercase tracking-wider text-xs">Egresos (Caja + Taller)</span>
          <span class="font-black text-xl text-rose-600 dark:text-rose-400">${window.formatMoney(egr)}</span>
        </div>
        <div class="pt-6 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
          <span class="font-black text-xl uppercase">Balance Neto</span>
          <span class="font-black text-3xl ${ing - egr >= 0 ? 'text-black dark:text-white' : 'text-rose-600'}">${window.formatMoney(ing - egr)}</span>
        </div>
      </div>
    </div>
    
    <div class="bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 p-8 rounded-[2rem] shadow-sm">
      <h3 class="font-black text-2xl mb-8">Distribución de Gastos</h3>
      ${catHTML}
    </div>
  `; 
};

window.renderAdminView = () => { 
  if(window.state.currentUser?.rol !== 'Admin') return; 
  
  const sucList = document.getElementById('admin-suc-list'); 
  if(sucList) {
    if (window.state.sucursales.length === 0) { 
      sucList.innerHTML = `
        <p class="text-neutral-500 text-center py-4 font-bold">
          No hay sucursales.
        </p>
      `; 
    } else { 
      sucList.innerHTML = window.state.sucursales.slice().sort((a,b) => a.nombre.localeCompare(b.nombre)).map(s => `
        <div class="flex justify-between items-center p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <span class="font-bold text-sm">${s.nombre}</span>
          <div class="flex space-x-1">
            <button onclick="window.editSucursal('${s.id}')" class="p-2 text-neutral-500 hover:text-green-600 transition-colors">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button onclick="window.deleteSucursal('${s.id}')" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `).join(''); 
    } 
  }
  
  const elSuc = document.getElementById('new-user-suc');
  if(elSuc) {
    elSuc.innerHTML = window.state.sucursales.slice().sort((a,b) => a.nombre.localeCompare(b.nombre)).map(s => `
      <option value="${s.id}">${s.nombre}</option>
    `).join(''); 
  }
  
  const usrList = document.getElementById('admin-users-list'); 
  if(usrList) {
    if (window.state.usuarios.length === 0) { 
      usrList.innerHTML = `
        <p class="text-neutral-500 text-center py-4 font-bold">
          No hay usuarios.
        </p>
      `; 
    } else { 
      usrList.innerHTML = window.state.usuarios.slice().sort((a,b) => a.nombre.localeCompare(b.nombre)).map(u => { 
        const s = window.state.sucursales.find(x => x.id == u.sucursalId); 
        return `
          <div class="flex justify-between items-center p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div>
              <p class="font-bold text-sm">${u.nombre}</p>
              <p class="text-[10px] font-bold text-neutral-500 mt-1 uppercase tracking-wider">
                ${u.rol} • ${s ? s.nombre : '-'} • ${u.email}
              </p>
            </div>
            <div class="flex space-x-1">
              <button onclick="window.editUser('${u.id}')" class="p-2 text-neutral-500 hover:text-green-600 transition-colors">
                <i data-lucide="edit-2" class="w-4 h-4"></i>
              </button>
              <button onclick="window.deleteUser('${u.id}')" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `; 
      }).join(''); 
    } 
  }
  lucide.createIcons(); 
};
