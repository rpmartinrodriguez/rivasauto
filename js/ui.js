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
    window.initDolarWidget();

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

    // 1. Limpiamos TODAS las clases "rebeldes" que vienen del HTML para que JS tome el control total
    sidebar.classList.remove('lg:translate-x-0', 'lg:-translate-x-full', 'lg:static', 'lg:absolute', 'lg:shadow-none');
    if (hamburgerBtn) hamburgerBtn.classList.remove('hidden', 'lg:hidden');
    if (overlay) overlay.classList.remove('hidden', 'lg:hidden');

    if (isPinned && window.innerWidth >= 1024) {
        // --- MODO PC: MENÚ FIJADO ---
        sidebar.classList.remove('-translate-x-full', 'absolute', 'z-50', 'shadow-2xl');
        sidebar.classList.add('translate-x-0', 'static', 'shadow-none');
        
        if (hamburgerBtn) hamburgerBtn.classList.add('hidden'); // Ocultamos hamburguesa porque ya está abierto
        if (pinIcon) pinIcon.setAttribute('data-lucide', 'pin-off');
        if (overlay) overlay.classList.add('hidden'); // Sin fondo oscuro
    } else {
        // --- MODO MÓVIL O PC: MENÚ FLOTANTE ---
        sidebar.classList.remove('static', 'translate-x-0', 'shadow-none');
        sidebar.classList.add('absolute', 'z-50', '-translate-x-full', 'h-full', 'shadow-2xl');
        
        if (pinIcon) pinIcon.setAttribute('data-lucide', 'pin');
        if (overlay) overlay.classList.add('hidden'); // Oculto hasta que el usuario abra el menú
    }

    if (window.lucide) window.lucide.createIcons();
};

window.toggleSidebarPin = () => {
    const isPinned = localStorage.getItem('sidebarPinned') !== 'false';
    localStorage.setItem('sidebarPinned', !isPinned); // Invierte la configuración
    window.applySidebarState();
};

window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;

    // Evaluamos si está cerrado
    const isClosed = sidebar.classList.contains('-translate-x-full');

    if (isClosed) {
        // ABRIR MENÚ
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        if (overlay) overlay.classList.remove('hidden');
    } else {
        // CERRAR MENÚ
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
        if (overlay) overlay.classList.add('hidden');
    }
};

// Escuchar cambios de tamaño de pantalla para ajustar el menú automáticamente
window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        window.applySidebarState();
    }, 150);
});

// --- WIDGET DÓLAR (BOTÓN FIJO / TOGGLE DE VISTA) ---
window.initDolarWidget = async () => {
    const container = document.getElementById('dolar-widget-container');
    if (!container) return;

    // Quitamos la clase 'hidden' y el evento onclick del contenedor padre que traía el HTML
    container.classList.remove('hidden');
    container.removeAttribute('onclick');
    
    // Inyectamos el botón real. El botón siempre se ve, y el <span> interior es el que se oculta.
    container.innerHTML = `
        <button onclick="window.toggleDolarWidget()" class="flex items-center space-x-2 p-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800 font-bold text-sm cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm" title="Cotización Dólar Blue">
            <i data-lucide="dollar-sign" class="w-5 h-5"></i>
            <span id="dolar-value" class="hidden pr-1">Calculando...</span>
        </button>
    `;
    if (window.lucide) window.lucide.createIcons();

    // Guardamos un estado interno
    window.dolarValue = "Calculando...";
    
    // Hacemos una consulta silenciosa en segundo plano
    try {
        const res = await fetch('https://dolarapi.com/v1/dolares/blue');
        const data = await res.json();
        window.dolarValue = `Blue: $${data.venta}`;
    } catch (e) {
        window.dolarValue = "Error API";
    }
};

window.toggleDolarWidget = () => {
    const valSpan = document.getElementById('dolar-value');
    if (!valSpan) return;
    
    // Alternamos la visibilidad del texto (el ícono queda intacto)
    valSpan.classList.toggle('hidden');
    
    // Si lo acabamos de mostrar, pintamos el valor y hacemos un fetch fresco por si cambió
    if (!valSpan.classList.contains('hidden')) {
        valSpan.innerText = window.dolarValue;
        
        fetch('https://dolarapi.com/v1/dolares/blue')
            .then(res => res.json())
            .then(data => {
                window.dolarValue = `Blue: $${data.venta}`;
                valSpan.innerText = window.dolarValue;
            })
            .catch(() => {});
    }
};

// --- NAVEGACIÓN Y MODALES ---
window.switchTab = (tabId) => {
    // 1. Ocultar todas las vistas
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    
    // 2. Mostrar la vista seleccionada
    const view = document.getElementById(`view-${tabId}`);
    if (view) view.classList.remove('hidden');

    // 3. Quitar color activo de todos los botones
    document.querySelectorAll('.nav-btn').forEach(el => {
        el.classList.remove('bg-neutral-100', 'dark:bg-neutral-800', 'text-green-600', 'dark:text-green-500');
    });

    // 4. Poner color activo al botón clickeado
    const activeBtn = document.getElementById(`nav-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-neutral-100', 'dark:bg-neutral-800', 'text-green-600', 'dark:text-green-500');
    }

    // 5. Cambiar título del Topbar
    const titles = {
        'flota': 'Flota y Stock',
        'caja': 'Caja Chica',
        'ventas': 'Ventas',
        'crm': 'CRM',
        'formularios': 'Formularios',
        'personal': 'Personal',
        'facturas': 'Facturación',
        'resumenes': 'Dashboard',
        'admin': 'Administración'
    };
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.innerText = titles[tabId] || 'Panel Principal';

    // 6. Autocerrar el menú si estamos en móvil o si el menú está en modo flotante (no fijado)
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
