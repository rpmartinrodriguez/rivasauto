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

    // 2. Inicializar Estado del Menú (Chincheta)
    window.applySidebarState();

    // 3. Inicializar Widget del Dólar
    window.initDolarWidget();

    if (window.lucide) window.lucide.createIcons();
});

// --- LÓGICA DE TEMA (DARK/LIGHT) ---
window.toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle('dark'); // Alterna la clase en la etiqueta <html>
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

    // Leemos qué configuración eligió el usuario (por defecto está fijo)
    const isPinned = localStorage.getItem('sidebarPinned') !== 'false';

    if (isPinned) {
        // MODO FIJO (Desktop)
        sidebar.classList.add('lg:translate-x-0', 'lg:static');
        sidebar.classList.remove('lg:-translate-x-full', 'lg:absolute');

        if (hamburgerBtn) hamburgerBtn.classList.add('lg:hidden'); // Escondemos las 3 rayas en PC
        if (pinIcon) pinIcon.setAttribute('data-lucide', 'pin-off');
        if (overlay) overlay.classList.add('lg:hidden'); // Fondo oscuro desactivado en PC
    } else {
        // MODO FLOTANTE / DESPLEGABLE (Desktop)
        sidebar.classList.remove('lg:static', 'lg:translate-x-0');
        sidebar.classList.add('lg:absolute', 'lg:-translate-x-full');

        if (hamburgerBtn) hamburgerBtn.classList.remove('lg:hidden'); // Mostramos las 3 rayas en PC
        if (pinIcon) pinIcon.setAttribute('data-lucide', 'pin');

        // Asegurarnos que inicie cerrado si la pantalla es grande
        if (window.innerWidth >= 1024) {
            sidebar.classList.add('-translate-x-full');
            sidebar.classList.remove('translate-x-0');
            if (overlay) overlay.classList.add('hidden');
        }
    }

    if (window.lucide) window.lucide.createIcons();
};

window.toggleSidebarPin = () => {
    const isPinned = localStorage.getItem('sidebarPinned') !== 'false';
    localStorage.setItem('sidebarPinned', !isPinned); // Invierte el valor guardado
    window.applySidebarState();
};

window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;

    // Desliza el menú adentro o afuera
    sidebar.classList.toggle('-translate-x-full');
    sidebar.classList.toggle('translate-x-0');

    // Controla el fondo oscuro (overlay)
    if (overlay) {
        overlay.classList.toggle('hidden');
        const isPinned = localStorage.getItem('sidebarPinned') !== 'false';
        if (!isPinned) {
            overlay.classList.remove('lg:hidden'); // Si está flotante, permitir el fondo oscuro en PC
        } else {
            overlay.classList.add('lg:hidden');
        }
    }
};

// --- WIDGET DÓLAR EN TIEMPO REAL ---
window.initDolarWidget = async () => {
    const container = document.getElementById('dolar-widget-container');
    if (!container) return;

    // Forzamos a que sea visible (quitamos el class 'hidden' del index.html)
    container.classList.remove('hidden');
    container.innerHTML = `
        <div class="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800 font-bold text-sm cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm" title="Click para actualizar la cotización">
            <i data-lucide="dollar-sign" class="w-4 h-4"></i>
            <span id="dolar-value">Consultando...</span>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    await window.fetchDolar();
};

window.fetchDolar = async () => {
    const valSpan = document.getElementById('dolar-value');
    if (!valSpan) return;
    valSpan.innerText = "Calculando...";
    try {
        // Consultamos la API pública de DolarAPI (Dólar Blue)
        const res = await fetch('https://dolarapi.com/v1/dolares/blue');
        const data = await res.json();
        valSpan.innerText = `Blue: $${data.venta}`;
    } catch (e) {
        valSpan.innerText = "Error API";
        console.error("Error al obtener dólar:", e);
    }
};

window.toggleDolarWidget = () => {
    // Al hacer clic, en lugar de ocultarse, ¡actualiza la cotización!
    window.fetchDolar();
};

// --- NAVEGACIÓN Y MODALES ---
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

    // Auto-cerrar el sidebar en móviles, o en PC si está en modo flotante
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
