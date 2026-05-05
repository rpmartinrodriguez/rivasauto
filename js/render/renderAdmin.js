// ==========================================
// js/render/renderAdmin.js
// ==========================================

window.renderResumenesView = () => { 
  if(window.state.currentUser?.rol !== 'Admin') return; 
  const dc = document.getElementById('dashboard-content');
  if(!dc) return;
  
  const ing = (window.state.transacciones || []).filter(t => t.tipo === 'ingreso').reduce((a,c) => a + c.valor, 0); 
  let egr = (window.state.transacciones || []).filter(t => t.tipo === 'gasto').reduce((a,c) => a + c.valor, 0); 
  
  const cats = (window.state.transacciones || []).filter(t => t.tipo === 'gasto').reduce((a,c) => { 
    a[c.categoria] = (a[c.categoria] || 0) + c.valor; 
    return a; 
  }, {}); 
  
  (window.state.autos || []).forEach(a => { 
    (a.gastos || []).forEach(g => { 
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
    if ((window.state.sucursales || []).length === 0) { 
      sucList.innerHTML = `
        <p class="text-neutral-500 text-center py-4 font-bold">
          No hay sucursales.
        </p>
      `; 
    } else { 
      sucList.innerHTML = window.state.sucursales.slice().sort((a,b) => String(a.nombre || '').localeCompare(String(b.nombre || ''))).map(s => `
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
    elSuc.innerHTML = (window.state.sucursales || []).slice().sort((a,b) => String(a.nombre || '').localeCompare(String(b.nombre || ''))).map(s => `
      <option value="${s.id}">${s.nombre}</option>
    `).join(''); 
  }
  
  const usrList = document.getElementById('admin-users-list'); 
  if(usrList) {
    if ((window.state.usuarios || []).length === 0) { 
      usrList.innerHTML = `
        <p class="text-neutral-500 text-center py-4 font-bold">
          No hay usuarios.
        </p>
      `; 
    } else { 
      usrList.innerHTML = window.state.usuarios.slice().sort((a,b) => String(a.nombre || '').localeCompare(String(b.nombre || ''))).map(u => { 
        const s = window.state.sucursales.find(x => x.id == u.sucursalId); 
        return `
          <div class="flex justify-between items-center p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div>
              <p class="font-bold text-sm">${u.nombre || 'Sin Nombre'}</p>
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
  if(window.lucide) window.lucide.createIcons(); 
};

window.renderDolarWidget = async () => {
  const widget = document.getElementById('dolar-widget-container');
  if (!widget) return;
  
  const showDolar = localStorage.getItem('showDolarWidget') !== 'false'; 
  if (!showDolar) {
    widget.classList.add('hidden');
    return;
  }
  
  widget.classList.remove('hidden');
  
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue');
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    
    widget.innerHTML = `
      <div class="flex flex-col items-end justify-center bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-xl border border-green-200 dark:border-green-800/50 cursor-help transition-all hover:bg-green-100" title="Actualizado: ${new Date(data.fechaActualizacion).toLocaleString('es-AR')}">
        <span class="text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-none">Dólar Blue</span>
        <div class="flex space-x-2 text-xs font-black text-green-700 dark:text-green-500 mt-0.5">
          <span>C: $${data.compra}</span>
          <span>V: $${data.venta}</span>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error fetching Dolar:", error);
    widget.innerHTML = `
      <span class="text-[10px] text-rose-500 font-bold px-2">
        Error Dólar
      </span>
    `;
  }
};

window.toggleDolarWidget = () => {
  const current = localStorage.getItem('showDolarWidget') !== 'false';
  localStorage.setItem('showDolarWidget', !current);
  window.renderDolarWidget();
};
