// ==========================================
// js/state.js
// ==========================================

// ESTADO GLOBAL DE LA APP
window.state = {
  activeTab: 'autos', 
  isDarkMode: false, 
  isSidebarOpen: false, 
  currentUser: null,
  sucursales: [], 
  usuarios: [], 
  autos: [], 
  transacciones: [], 
  ventas: [], 
  consultas: [], 
  formularios: [], 
  comisiones: [],
  cierres_personal: [], // Nuevo arreglo para el Historial de Cierres de Pagos
  categoriasGasto: [
    'Mecánica', 'Estética', 'Gestoría', 'Impuestos', 
    'Servicios Generales', 'Venta Vehículos', 'Gastos Varios', 'Liquidación Personal'
  ],
  cajaFilterUser: 'all', 
  selectedAutoId: null, 
  daActiveSection: 'crm', 
  isVentaMode: false, 
  autosViewMode: 'grid',
  ventaData: { tienePermuta: false }, 
  editingUserId: null, 
  editingSucursalId: null, 
  editingAutoId: null, 
  tempFormData: null, 
  pendingIngresoAutoId: null
};

// INSTALACIÓN PWA
window.deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => { 
  e.preventDefault(); 
  window.deferredPrompt = e; 
  
  const loginBtn = document.getElementById('login-install-btn');
  const sidebarBtn = document.getElementById('sidebar-install-btn');
  
  if (loginBtn) loginBtn.classList.remove('hidden'); 
  if (sidebarBtn) sidebarBtn.classList.remove('hidden'); 
});

window.installPWA = async () => { 
  if (window.deferredPrompt) { 
    window.deferredPrompt.prompt(); 
    const { outcome } = await window.deferredPrompt.userChoice; 
    
    if (outcome === 'accepted') { 
      const loginBtn = document.getElementById('login-install-btn');
      const sidebarBtn = document.getElementById('sidebar-install-btn');
      
      if (loginBtn) loginBtn.classList.add('hidden'); 
      if (sidebarBtn) sidebarBtn.classList.add('hidden'); 
    } 
    
    window.deferredPrompt = null; 
  } 
};

// UTILIDADES DE FORMATO Y HELPERS GLOBALES
window.formatMoney = (a) => {
  return new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: 'ARS', 
    minimumFractionDigits: 0 
  }).format(a);
};

window.formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

window.checkDocStatus = (docs) => {
  return docs && docs.c08 && docs.verificacion && docs.libreDeuda;
};

window.formatWhatsAppLink = (phone, text) => {
  if (!phone) return '#';
  const cleanPhone = phone.toString().replace(/\D/g, '');
  return `https://wa.me/549${cleanPhone}?text=${encodeURIComponent(text)}`;
};

window.generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};
