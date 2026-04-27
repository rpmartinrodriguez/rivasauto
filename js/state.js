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
  document.getElementById('login-install-btn').classList.remove('hidden'); 
  document.getElementById('sidebar-install-btn').classList.remove('hidden'); 
});

window.installPWA = async () => { 
  if (window.deferredPrompt) { 
    window.deferredPrompt.prompt(); 
    const { outcome } = await window.deferredPrompt.userChoice; 
    if (outcome === 'accepted') { 
      document.getElementById('login-install-btn').classList.add('hidden'); 
      document.getElementById('sidebar-install-btn').classList.add('hidden'); 
    } 
    window.deferredPrompt = null; 
  } 
};

// UTILIDADES DE FORMATO
window.formatMoney = (a) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(a);
window.formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
window.checkDocStatus = (docs) => docs && docs.c08 && docs.verificacion && docs.libreDeuda;
window.formatWhatsAppLink = (phone, text) => `https://wa.me/549${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
window.generateId = () => Math.random().toString(36).substring(2, 9);
