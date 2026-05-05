// ==========================================
// js/ui.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar Tema (Claro/Oscuro)
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // 2. Inicializar Estado del Menú Lateral
    window.applySidebarState();

    // 3. Inicializar Widget del Dólar
    setTimeout(() => {
        window.initDolarWidget();
    }, 500);

    if (window.lucide) window.lucide.createIcons();
});

// --- LÓGICA DE TEMA (DARK/LIGHT) ---
window.toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle('dark'); 
    const isDark = html.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

// --- LÓGICA DEL MENÚ PIN (FIJO/FLOTANTE) ---
window.applySidebarState = () => {
    const sidebar = document.getElementById('sidebar');
    const hamburgerBtn = document.getElementById('btn-hamburger');
    const pinIcon = document.getElementById('pin-icon');
    const overlay = document.getElementById('sidebar-overlay');

    if (!sidebar) return;

    // ¿El usuario lo quiere fijado? (Por defecto es true)
    const isPinned = localStorage.getItem('sidebarPinned') !== 'false';

    // Limpieza total de clases previas para evitar conflictos
    sidebar.classList.remove('lg:static', 'lg:relative', 'lg:absolute', 'lg:translate-x-0', 'lg:-translate-x-full', 'z-50', 'shadow-2xl');

    if (isPinned && window.innerWidth >= 1024) {
        // --- MODO PC: MENÚ FIJADO (EMPUJA EL CONTENIDO) ---
        sidebar.classList.add('lg:relative', 'lg:translate-x-0', 'translate-x-0');
        
        if (hamburgerBtn) hamburgerBtn.classList.add('lg:hidden'); 
        if (pinIcon) pinIcon.setAttribute('data-lucide', 'pin-off');
        if (overlay) overlay.classList.add('hidden'); 
    } else {
        // --- MODO MÓVIL O PC: MENÚ FLOTANTE (TAPA EL CONTENIDO) ---
        sidebar.classList.add('absolute', 'z-50', '-translate-x-full', 'shadow-2xl');
        
        if (hamburgerBtn) hamburgerBtn.classList.remove('lg:hidden'); 
        if (pinIcon) pinIcon.setAttribute('data-lucide', 'pin');
        if (overlay) overlay.classList.add('hidden');
    }

    if (window.lucide) window.lucide.createIcons();
};

window.toggleSidebarPin = () => {
    const isPinned = localStorage.getItem('sidebarPinned') !== 'false';
    localStorage.setItem('sidebarPinned', !isPinned); 
    window.applySidebarState();
};

window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;

    const isClosed = sidebar.classList.contains('-translate-x-full');

    if (isClosed) {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        if (overlay) overlay.classList.remove('hidden');
    } else {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
        if (overlay) overlay.classList.add('hidden');
    }
};

window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        window.applySidebarState();
    }, 200);
});

// --- WIDGET DÓLAR ---
window.initDolarWidget = async () => {
    const container = document.getElementById('dolar-widget-container');
    if (!container) return;

    container.classList.remove('hidden'); // Asegura visibilidad
    
    container.innerHTML = `
        <button onclick="window.toggleDolarWidget()" class="flex items-center space-x-2 p-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800 font-bold text-sm cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm">
            <i data-lucide="dollar-sign" class="w-5 h-5"></i>
            <span id="dolar-value" class="hidden pr-1">Cargando...</span>
        </button>
    `;
    if (window.lucide) window.lucide.createIcons();

    try {
        const res = await fetch('https://dolarapi.com/v1/dolares/blue');
        const data = await res.json();
        window.dolarValue = `Blue: $${data.venta}`;
        const valSpan = document.getElementById('dolar-value');
        if(valSpan) valSpan.innerText = window.dolarValue;
    } catch (e) {
        window.dolarValue = "Dólar s/c";
    }
};

window.toggleDolarWidget = () => {
    const valSpan = document.getElementById('dolar-value');
    if (!valSpan) return;
    valSpan.classList.toggle('hidden');
    if (!valSpan.classList.contains('hidden')) {
        valSpan.innerText = window.dolarValue || "Cargando...";
    }
};

// --- NAVEGACIÓN ---
window.switchTab = (tabId) => {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    const view = document.getElementById(`view-${tabId}`);
    if (view) view.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(el => {
        el.classList.remove('bg-neutral-100', 'dark:bg-neutral-800', 'text-green-600', 'dark:text-green-500');
    });

    const activeBtn = document.getElementById(`nav-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-neutral-100', 'dark:bg-neutral-800', 'text-green-600', 'dark:text-green-500');
    }

    const titles = {
        'flota': 'Flota y Stock',
        'caja': 'Caja Chica',
        'ventas': 'Historial Ventas',
        'crm': 'Clientes CRM',
        'formularios': 'Formularios',
        'personal': 'Personal y Comisiones',
        'facturas': 'Facturación',
        'resumenes': 'Reportes',
        'admin': 'Configuración'
    };
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.innerText = titles[tabId] || 'Panel';

    const sidebar = document.getElementById('sidebar');
    const isPinned = localStorage.getItem('sidebarPinned') !== 'false';
    if (window.innerWidth < 1024 || !isPinned) {
        if (sidebar && sidebar.classList.contains('translate-x-0')) {
            window.toggleSidebar();
        }
    }
};

window.openModal = (id) => {
    const m = document.getElementById(id);
    if (m) m.classList.remove('hidden');
};

window.closeModal = (id) => {
    const m = document.getElementById(id);
    if (m) m.classList.add('hidden');
};
