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

    // 3. Inicializar Widget del Dólar (con un pequeño retraso para asegurar carga)
    setTimeout(() => {
        window.initDolarWidget();
    }, 500);

    // 4. Bucle para chequear alertas de CRM constantemente
    setInterval(() => {
        if(window.updateNotifications) {
            window.updateNotifications();
        }
    }, 5000); // Chequea cada 5 segundos

    // 5. Inicializar íconos
    if (window.lucide) {
        window.lucide.createIcons();
    }
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

    if (!sidebar) {
        return;
    }

    // ¿El usuario lo quiere fijado? (Por defecto es true)
    const isPinned = localStorage.getItem('sidebarPinned') !== 'false';

    // Limpieza total de clases previas para evitar conflictos de Tailwind
    sidebar.classList.remove(
        'lg:static', 
        'lg:relative', 
        'lg:absolute', 
        'lg:translate-x-0', 
        'lg:-translate-x-full', 
        'z-50', 
        'shadow-2xl'
    );

    if (isPinned && window.innerWidth >= 1024) {
        // --- MODO PC: MENÚ FIJADO (EMPUJA EL CONTENIDO) ---
        sidebar.classList.add('lg:relative', 'lg:translate-x-0', 'translate-x-0');
        
        if (hamburgerBtn) {
            hamburgerBtn.classList.add('lg:hidden'); 
        }
        
        if (pinIcon) {
            pinIcon.setAttribute('data-lucide', 'pin-off');
        }
        
        if (overlay) {
            overlay.classList.add('hidden'); 
        }
    } else {
        // --- MODO MÓVIL O PC: MENÚ FLOTANTE (TAPA EL CONTENIDO) ---
        sidebar.classList.add('absolute', 'z-50', '-translate-x-full', 'shadow-2xl');
        
        if (hamburgerBtn) {
            hamburgerBtn.classList.remove('lg:hidden'); 
        }
        
        if (pinIcon) {
            pinIcon.setAttribute('data-lucide', 'pin');
        }
        
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
};

window.toggleSidebarPin = () => {
    const isPinned = localStorage.getItem('sidebarPinned') !== 'false';
    localStorage.setItem('sidebarPinned', !isPinned); 
    
    window.applySidebarState();
};

window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (!sidebar) {
        return;
    }

    const isClosed = sidebar.classList.contains('-translate-x-full');

    if (isClosed) {
        // Abrir Menú
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    } else {
        // Cerrar Menú
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
        
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
};

// Adaptar el menú si el usuario redimensiona la ventana
window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        window.applySidebarState();
    }, 200);
});

// --- WIDGET DÓLAR ---
window.initDolarWidget = async () => {
    const container = document.getElementById('dolar-widget-container');
    
    if (!container) {
        return;
    }

    container.classList.remove('hidden'); 
    
    // Inyectamos el botón con un contenedor interno (wrapper) para el texto y el ícono info
    container.innerHTML = `
        <button onclick="window.toggleDolarWidget()" class="flex items-center space-x-2 p-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800 font-bold text-sm cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm">
            <i data-lucide="dollar-sign" class="w-5 h-5"></i>
            <div id="dolar-value-wrapper" class="hidden flex items-center space-x-2">
                <span id="dolar-value">Cargando...</span>
                <i id="dolar-info-icon" data-lucide="info" class="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity" title="Calculando..."></i>
            </div>
        </button>
    `;
    
    if (window.lucide) {
        window.lucide.createIcons();
    }

    try {
        const res = await fetch('https://dolarapi.com/v1/dolares/blue');
        const data = await res.json();
        
        // Extraemos y formateamos la fecha de la API
        const fechaActualizacion = new Date(data.fechaActualizacion || new Date());
        const horaStr = fechaActualizacion.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const fechaStr = fechaActualizacion.toLocaleDateString('es-AR');

        // Valores de Compra y Venta
        window.dolarValue = `C: $${data.compra} | V: $${data.venta}`;
        window.dolarInfoText = `Fuente: DolarAPI (Dólar Blue)\nÚltima actualización: ${fechaStr} a las ${horaStr}`;
        
        const valSpan = document.getElementById('dolar-value');
        const infoIcon = document.getElementById('dolar-info-icon');
        
        if (valSpan) {
            valSpan.innerText = window.dolarValue;
        }
        if (infoIcon) {
            infoIcon.setAttribute('title', window.dolarInfoText);
        }
        
    } catch (e) {
        window.dolarValue = "Dólar s/c";
        const valSpan = document.getElementById('dolar-value');
        if (valSpan) {
            valSpan.innerText = window.dolarValue;
        }
        console.error("Error consultando API Dolar:", e);
    }
};

window.toggleDolarWidget = () => {
    const wrapper = document.getElementById('dolar-value-wrapper');
    
    if (!wrapper) {
        return;
    }
    
    wrapper.classList.toggle('hidden');
};

// --- LOGICA MAESTRA DE CAMPANITA (NOTIFICACIONES DE CRM) ---
window.updateNotifications = () => {
    const notifContainer = document.getElementById('notif-container');
    const badge = document.getElementById('notif-badge');
    const list = document.getElementById('notif-list');
    
    if (!notifContainer || !window.state || !window.state.consultas || !window.state.currentUser) {
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const uRole = window.state.currentUser.rol;
    const uId = window.state.currentUser.id;
    const uSuc = window.state.currentUser.sucursalId;

    // Filtramos los leads que le corresponden a este usuario
    let misLeads = window.state.consultas;
    
    if (uRole === 'Vendedor') {
        misLeads = misLeads.filter(c => c.userId === uId);
    } else if (uRole === 'Encargado') {
        const sucUsers = window.state.usuarios.filter(u => u.sucursalId === uSuc && u.rol !== 'Admin').map(u => u.id);
        misLeads = misLeads.filter(c => sucUsers.includes(c.userId));
    }

    let alertas = [];

    // Revisamos los historiales buscando seguimientos agendados para HOY o en el PASADO (atrasados)
    misLeads.forEach(lead => {
        if(lead.historial) {
            lead.historial.forEach(h => {
                if(!h.completado && h.proximoContacto && h.proximoContacto <= today) {
                    alertas.push({ lead: lead, historia: h });
                }
            });
        }
    });

    if (alertas.length > 0) {
        // Mostramos el contenedor y activamos el punto rojo parpadeante
        notifContainer.classList.remove('hidden');
        badge.classList.remove('hidden');
        
        // Ordenamos para que las más atrasadas salgan primero
        list.innerHTML = alertas.sort((a,b) => new Date(a.historia.proximoContacto) - new Date(b.historia.proximoContacto)).map(alerta => {
            const isAtrasado = alerta.historia.proximoContacto < today;
            const estadoTexto = isAtrasado ? 'Atrasado' : 'Para Hoy';
            const colorClass = isAtrasado ? 'text-rose-500' : 'text-amber-500';
            
            return `
                <div class="p-4 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                        <p class="font-black text-sm text-neutral-800 dark:text-neutral-200 cursor-pointer hover:underline" onclick="window.openDetalleLead('${alerta.lead.id}')">
                            Llamar a ${alerta.lead.nombre}
                        </p>
                        <span class="text-[10px] font-bold uppercase tracking-widest ${colorClass}">
                            ${estadoTexto}
                        </span>
                    </div>
                    <p class="text-xs text-neutral-500 font-bold mb-3">"${alerta.historia.texto}"</p>
                    <button onclick="window.markHistoryCompleted('${alerta.lead.id}', '${alerta.historia.id}')" class="w-full py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500 rounded-lg text-[10px] font-black uppercase hover:bg-green-200 dark:hover:bg-green-800 transition-colors">
                        Marcar como Realizado
                    </button>
                </div>
            `;
        }).join('');
    } else {
        // Siempre mostramos la campanita, pero ocultamos el punto rojo de alerta
        notifContainer.classList.remove('hidden'); 
        badge.classList.add('hidden');
        list.innerHTML = `
            <div class="p-6 text-center text-xs font-bold text-neutral-500 uppercase tracking-widest">
                No hay seguimientos agendados para hoy.
            </div>
        `;
    }
};

// --- NAVEGACIÓN ---
window.switchTab = (tabId) => {
    // Ocultar todas las vistas
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Mostrar la elegida
    const view = document.getElementById(`view-${tabId}`);
    if (view) {
        view.classList.remove('hidden');
    }

    // Limpiar botones del nav
    document.querySelectorAll('.nav-btn').forEach(el => {
        el.classList.remove('bg-neutral-100', 'dark:bg-neutral-800', 'text-green-600', 'dark:text-green-500');
    });

    // Pintar botón activo
    const activeBtn = document.getElementById(`nav-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-neutral-100', 'dark:bg-neutral-800', 'text-green-600', 'dark:text-green-500');
    }

    // Actualizar título
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
    if (titleEl) {
        titleEl.innerText = titles[tabId] || 'Panel';
    }

    // Lógica para cerrar menú lateral en móviles al cambiar de pestaña
    const sidebar = document.getElementById('sidebar');
    const isPinned = localStorage.getItem('sidebarPinned') !== 'false';
    
    if (window.innerWidth < 1024 || !isPinned) {
        if (sidebar && sidebar.classList.contains('translate-x-0')) {
            window.toggleSidebar();
        }
    }
    
    // Al cambiar de tab, refrescamos por las dudas la campanita
    if(window.updateNotifications) {
        window.updateNotifications();
    }
};

window.openModal = (id) => {
    const m = document.getElementById(id);
    if (m) {
        m.classList.remove('hidden');
    }
};

window.closeModal = (id) => {
    const m = document.getElementById(id);
    if (m) {
        m.classList.add('hidden');
    }
};
