// ==========================================
// js/render/renderPersonal.js
// ==========================================

window.renderPersonalView = () => {
  if(window.state.currentUser?.rol !== 'Admin') return;
  
  const table = document.getElementById('personal-table');
  const select = document.getElementById('comision-user');
  const tableCierres = document.getElementById('cierres-table');
  const modalCierreList = document.getElementById('cierre-checkboxes-list');
  
  const usuariosAgencia = (window.state.usuarios || []).filter(u => u.rol === 'Vendedor' || u.rol === 'Encargado').sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
  
  let totLiq = 0;
  let checkboxHtml = '';
  
  if (table) {
    const dataRows = usuariosAgencia.map(u => {
      const pdtes = (window.state.comisiones || []).filter(c => c.userId === u.id && c.estado === 'Pendiente');
      const totPdte = pdtes.reduce((a,c) => a + c.monto, 0);
      totLiq += totPdte;
      
      const suc = (window.state.sucursales || []).find(s => s.id == u.sucursalId)?.nombre || '-';
      
      if(totPdte > 0) {
        checkboxHtml += `
          <label class="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl cursor-pointer hover:border-green-500">
            <div class="flex items-center">
              <input type="checkbox" checked value="${u.id}" class="cierre-user-checkbox w-5 h-5 text-green-600 rounded mr-3" onchange="window.calcularTotalPagos()">
              <span class="font-bold text-sm">${u.nombre || 'Sin Nombre'}</span>
            </div>
            <span class="font-black text-rose-500" data-amount="${totPdte}">${window.formatMoney(totPdte)}</span>
          </label>
        `;
      }

      return `
        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer" onclick="window.openDetallePersonal('${u.id}')">
          <td class="px-6 py-4 font-bold flex items-center">
             <div class="w-2 h-2 rounded-full mr-2 ${totPdte > 0 ? 'bg-amber-500' : 'bg-transparent'}"></div>
             ${u.nombre || 'Sin Nombre'}
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
      <option value="${u.id}">${u.nombre || 'Sin Nombre'} (${u.rol})</option>
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
  if(window.lucide) window.lucide.createIcons();
};

window.openDetallePersonal = (userId) => {
  const u = (window.state.usuarios || []).find(x => x.id === userId);
  if(!u) return;
  
  const comisionesUsuario = (window.state.comisiones || []).filter(c => c.userId === userId).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
  
  let html = `
    <div class="mb-6 flex items-center space-x-4">
      <div class="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-black text-2xl">
        ${String(u.nombre || 'U').charAt(0).toUpperCase()}
      </div>
      <div>
        <h4 class="text-2xl font-black">${u.nombre || 'Sin Nombre'}</h4>
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
               const v = (window.state.ventas || []).find(x => x.id === c.ventaId);
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
      const nombre = u ? (u.nombre || 'Sin Nombre') : 'Usuario Eliminado';
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
