// ==========================================
// js/render/renderVentas.js
// ==========================================

window.renderVentasView = () => { 
  let misVentas = window.state.ventas || [];
  
  if(window.state.currentUser.rol === 'Vendedor') {
     misVentas = misVentas.filter(v => v.userId === window.state.currentUser.id);
  } else if (window.state.currentUser.rol === 'Encargado') {
     const validUsers = (window.state.usuarios || []).filter(u => u.sucursalId === window.state.currentUser.sucursalId && u.rol !== 'Admin').map(u => u.id);
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
  if(window.lucide) window.lucide.createIcons(); 
};

window.openDetalleVenta = (id) => { 
  const v = window.state.ventas.find(x => x.id === id); 
  if(!v) return; 
  
  const metodos = v.metodoPago || ''; 
  const valorOriginal = v.precioAutoLista || v.montoTotal; // Fallback por si es una venta vieja
  
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
        <span class="text-neutral-500">Vehículo</span>
        <span class="font-bold text-right">${v.autoDesc || '-'}</span>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Valor de Lista (Auto)</span>
        <span class="font-bold text-right">${window.formatMoney(valorOriginal)}</span>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500 font-bold uppercase">Monto Operación Cerrada</span>
        <span class="font-black text-lg text-green-600 dark:text-green-500">${window.formatMoney(v.montoTotal || 0)}</span>
      </div>
      
      <div class="pt-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <p class="text-xs text-neutral-500 font-bold uppercase mb-3"><i data-lucide="pie-chart" class="w-4 h-4 inline mr-1"></i> Desglose de Pago:</p>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <span class="text-neutral-500 block mb-1">Efectivo / Transf.</span>
            <span class="font-black text-sm">${window.formatMoney(v.desglose?.efectivo || 0)}</span>
          </div>
          <div class="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-800/50">
            <span class="text-amber-700 dark:text-amber-500 block mb-1">Permuta</span>
            <span class="font-black text-sm text-amber-700 dark:text-amber-500">${window.formatMoney(v.desglose?.permuta || 0)}</span>
          </div>
          <div class="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <span class="text-neutral-500 block mb-1">Crédito</span>
            <span class="font-black text-sm">${window.formatMoney(v.desglose?.credito || 0)}</span>
          </div>
          <div class="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <span class="text-neutral-500 block mb-1">Pagaré</span>
            <span class="font-black text-sm">${window.formatMoney(v.desglose?.pagare || 0)}</span>
          </div>
        </div>
      </div>
      
      ${v.tienePermuta ? `
        <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 mt-4">
          <span class="text-neutral-500">Permuta Detalle</span>
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
      <div class="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <button onclick="window.openModalComisionPorVenta('${v.id}')" class="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow hover:bg-green-700 transition-colors">
          <i data-lucide="award" class="w-5 h-5 inline mr-2"></i>Asignar Comisión a Personal
        </button>
      </div>
    `;
  }
  
  document.getElementById('venta-detail-content').innerHTML = html;
  window.openModal('modal-detalle-venta'); 
  if(window.lucide) window.lucide.createIcons();
};

window.imprimirHistorialVentas = () => {
  const currentUser = window.state.currentUser;
  const isAdmin = currentUser.rol === 'Admin';
  const today = new Date().toLocaleDateString('es-AR');

  let ventasReporte = [];
  let usuariosReporte = [];

  if (isAdmin) {
     ventasReporte = window.state.ventas || [];
     usuariosReporte = (window.state.usuarios || []).filter(u => ventasReporte.some(v => v.userId === u.id));
  } else {
     ventasReporte = (window.state.ventas || []).filter(v => v.userId === currentUser.id);
     usuariosReporte = [currentUser];
  }

  let printHtml = `
    <h2 class="text-center text-2xl font-black mb-4 uppercase">Reporte de Ventas y Comisiones</h2>
    <p class="mb-6 font-bold text-right text-sm">Fecha: ${today}</p>
  `;

  let granTotalUnidades = 0;
  let granTotalMonto = 0;
  let granTotalComisiones = 0;

  usuariosReporte.forEach(u => {
     const userVentas = ventasReporte.filter(v => v.userId === u.id);
     if(userVentas.length === 0) return;

     const unidades = userVentas.length;
     const montoTotal = userVentas.reduce((acc, v) => acc + (v.montoTotal || 0), 0);
     
     const userComisiones = (window.state.comisiones || []).filter(c => c.userId === u.id && c.ventaId && userVentas.some(v => v.id === c.ventaId));
     const comisionesTotal = userComisiones.reduce((acc, c) => acc + (c.monto || 0), 0);

     granTotalUnidades += unidades;
     granTotalMonto += montoTotal;
     granTotalComisiones += comisionesTotal;

     printHtml += `
        <div class="mb-6 border border-black p-4 rounded-lg">
           <h3 class="text-lg font-black uppercase mb-2">Vendedor: ${u.nombre || 'Desconocido'}</h3>
           <div class="grid grid-cols-3 gap-4 text-sm mb-4">
             <div><strong>Unidades Vendidas:</strong> ${unidades}</div>
             <div><strong>Volumen de Venta:</strong> ${window.formatMoney(montoTotal)}</div>
             <div><strong>Comisiones Asignadas:</strong> ${window.formatMoney(comisionesTotal)}</div>
           </div>
           <table class="w-full text-left border-collapse border border-gray-300 text-[11px]">
             <thead>
               <tr class="bg-gray-100 border-b border-gray-300 uppercase">
                 <th class="p-1 border-r border-gray-300">Fecha</th>
                 <th class="p-1 border-r border-gray-300">Cliente</th>
                 <th class="p-1 border-r border-gray-300">Vehículo</th>
                 <th class="p-1 text-right">Monto</th>
               </tr>
             </thead>
             <tbody>
               ${userVentas.slice().sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map(v => `
                 <tr class="border-b border-gray-200">
                   <td class="p-1 border-r border-gray-300">${window.formatDate(v.fecha)}</td>
                   <td class="p-1 border-r border-gray-300">${v.compradorNombre}</td>
                   <td class="p-1 border-r border-gray-300">${v.autoDesc}</td>
                   <td class="p-1 text-right">${window.formatMoney(v.montoTotal || 0)}</td>
                 </tr>
               `).join('')}
             </tbody>
           </table>
        </div>
     `;
  });

  if (isAdmin && usuariosReporte.length > 1) {
     printHtml += `
        <div class="mt-8 border-t-2 border-black pt-4">
           <h3 class="text-xl font-black uppercase mb-2">Resumen General (Todos los Vendedores)</h3>
           <div class="grid grid-cols-3 gap-4 text-sm">
             <div><strong>Unidades Totales:</strong> ${granTotalUnidades}</div>
             <div><strong>Volumen Total:</strong> ${window.formatMoney(granTotalMonto)}</div>
             <div><strong>Comisiones Totales:</strong> ${window.formatMoney(granTotalComisiones)}</div>
           </div>
        </div>
     `;
  }

  document.getElementById('print-content').innerHTML = printHtml;
  document.getElementById('app-wrapper').classList.add('hidden'); 
  document.getElementById('print-section').classList.remove('hidden');
  
  const globalLogo = document.getElementById('print-logo');
  if(globalLogo) globalLogo.classList.add('hidden');

  setTimeout(() => { 
    window.print(); 
    document.getElementById('print-section').classList.add('hidden'); 
    document.getElementById('app-wrapper').classList.remove('hidden'); 
    if(globalLogo) globalLogo.classList.remove('hidden');
  }, 500);
};
