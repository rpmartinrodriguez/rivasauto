// ==========================================
// js/ui.js
// ==========================================

window.toggleDarkMode = () => { 
  window.state.isDarkMode = !window.state.isDarkMode; 
  document.documentElement.classList.toggle('dark', window.state.isDarkMode); 
  document.getElementById('theme-icon').setAttribute('data-lucide', window.state.isDarkMode ? 'sun' : 'moon'); 
  lucide.createIcons(); 
};

window.togglePwd = (id) => { 
  const i = document.getElementById(id); 
  i.type = i.type === 'password' ? 'text' : 'password'; 
};

window.toggleSidebar = () => { 
  window.state.isSidebarOpen = !window.state.isSidebarOpen; 
  document.getElementById('sidebar').classList.toggle('-translate-x-full', !window.state.isSidebarOpen); 
  const b = document.getElementById('sidebar-backdrop'); 
  
  if(window.state.isSidebarOpen) { 
    b.classList.remove('hidden'); 
    setTimeout(() => b.classList.remove('opacity-0'), 10); 
  } else { 
    b.classList.add('opacity-0'); 
    setTimeout(() => b.classList.add('hidden'), 300); 
  } 
};

window.switchTab = (tabId) => { 
  window.state.activeTab = tabId; 
  document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden')); 
  document.getElementById(`view-${tabId}`).classList.remove('hidden'); 
  if(window.state.isSidebarOpen) window.toggleSidebar(); 
  window.renderNav(); 
};

window.openModal = (id) => {
  document.getElementById(id).classList.remove('hidden');
};

window.closeModal = (id) => { 
  document.getElementById(id).classList.add('hidden'); 
  if(id === 'modal-detalle-auto'){ 
    window.state.selectedAutoId = null; 
    window.state.isVentaMode = false; 
  } 
};

window.toggleNotifications = () => { 
  document.getElementById('notif-dropdown').classList.toggle('hidden'); 
};

window.renderNav = () => {
  if(!window.state.currentUser) return; 
  const isAd = window.state.currentUser.rol === 'Admin';
  
  let tabs = [ 
    { id: 'autos', icon: 'car', label: 'Flota' }, 
    { id: 'caja', icon: 'wallet', label: 'Caja' }, 
    { id: 'clientes', icon: 'users', label: 'CRM' } 
  ];
  
  if(isAd) { 
    tabs.splice(2, 0, { id: 'ventas', icon: 'shopping-bag', label: 'Historial Ventas' }); 
    tabs.splice(3, 0, { id: 'facturas', icon: 'file-text', label: 'Facturas' }); 
    tabs.splice(4, 0, { id: 'personal', icon: 'briefcase', label: 'Personal' }); 
    tabs.splice(6, 0, { id: 'formularios', icon: 'printer', label: 'Formularios' }); 
    tabs.push( 
      { id: 'resumenes', icon: 'pie-chart', label: 'Resúmenes' }, 
      { id: 'admin', icon: 'settings', label: 'Administración' } 
    ); 
  }
  
  document.getElementById('nav-menu').innerHTML = tabs.map(t => `
    <button onclick="switchTab('${t.id}')" class="w-full flex items-center space-x-3 py-3 px-4 rounded-2xl transition-all font-bold text-sm ${window.state.activeTab === t.id ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}">
      <i data-lucide="${t.icon}" class="w-5 h-5"></i>
      <span>${t.label}</span>
    </button>
  `).join(''); 
  
  lucide.createIcons();
};
