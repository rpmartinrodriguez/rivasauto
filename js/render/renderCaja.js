// ==========================================
// js/render/renderCaja.js
// ==========================================

window.renderCajaView = () => {
  const table = document.getElementById('caja-table');
  if(!table) return;
  
  let myTrans = window.state.transacciones || [];
  
  if(window.state.currentUser.rol === 'Vendedor') { 
    myTrans = myTrans.filter(t => t.userId === window.state.currentUser.id); 
  } else if (window.state.currentUser.rol === 'Encargado') { 
    const usuariosValidos = (window.state.usuarios || []).filter(u => u.sucursalId === window.state.currentUser.sucursalId && u.rol !== 'Admin').map(u => u.id);
    myTrans = myTrans.filter(t => usuariosValidos.includes(t.userId)); 
  }

  if(window.state.currentUser.rol !== 'Vendedor') {
    const fc = document.getElementById('caja-filters-container'); 
    if(fc) {
      fc.classList.remove('hidden');
      let users = window.state.usuarios || [];
      if (window.state.currentUser.rol === 'Encargado') {
         users = users.filter(u => u.sucursalId === window.state.currentUser.sucursalId && u.rol !== 'Admin');
      }
      fc.innerHTML = `
        <div class="flex-1 min-w-[200px]">
          <label class="text-xs font-bold text-neutral-500 block mb-1">Filtrar por Usuario</label>
          <select onchange="window.state.cajaFilterUser=this.value; window.renderCajaView()" class="w-full bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 outline-none focus:border-green-500">
            <option value="all">Todas las cajas permitidas</option>
            ${users.map(u => `<option value="${u.id}" ${window.state.cajaFilterUser === u.id ? 'selected' : ''}>${u.nombre}</option>`).join('')}
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

  if (transWithSaldo.length === 0) { 
    table.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-neutral-500 font-bold">Sin movimientos.</td></tr>`; 
  } else {
    table.innerHTML = transWithSaldo.slice().reverse().map(t => {
      const u = (window.state.usuarios || []).find(x => x.id === t.userId); 
      
      return `
        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${t.estadoCobro === 'pendiente' ? 'opacity-50' : ''}">
          <td class="px-6 py-4 text-xs font-bold text-neutral-400 whitespace-nowrap">
            ${window.formatDate(t.fecha)}
          </td>
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
  if(window.lucide) window.lucide.createIcons();
};

window.openModalPendientes = () => { 
  let myTrans = window.state.transacciones || [];
  let myVentas = window.state.ventas || [];
  
  if(window.state.currentUser.rol === 'Vendedor') { 
    myTrans = myTrans.filter(t => t.userId === window.state.currentUser.id); 
    myVentas = myVentas.filter(v => v.userId === window.state.currentUser.id); 
  } else if (window.state.currentUser.rol === 'Encargado') { 
    const validUsers = (window.state.usuarios || []).filter(u => u.sucursalId === window.state.currentUser.sucursalId && u.rol !== 'Admin').map(u => u.id);
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
    content.innerHTML = `<p class="text-center text-neutral-500 py-6 font-bold">Sin cobros pendientes por el momento.</p>`; 
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
  if(window.lucide) window.lucide.createIcons();
};
