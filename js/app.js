// ==========================================
// js/app.js
// ==========================================

// Generador de IDs simples
window.generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};

// --- FUNCIONES FIREBASE CRUD ---
// Al usar onSnapshot (tiempo real), ya no necesitamos actualizar window.state manualmente aquí.
// El "escuchador" global detectará el cambio y lo hará automáticamente.
window.fbAdd = async (coleccion, data) => {
    try {
        const docRef = await window.addDoc(window.collection(window.db, coleccion), data);
        return docRef;
    } catch (e) {
        console.error("Error añadiendo documento: ", e);
        throw e;
    }
};

window.fbUpdate = async (coleccion, id, data) => {
    try {
        const docRef = window.doc(window.db, coleccion, id);
        await window.updateDoc(docRef, data);
    } catch (e) {
        console.error("Error actualizando documento: ", e);
        throw e;
    }
};

window.fbDelete = async (coleccion, id) => {
    try {
        const docRef = window.doc(window.db, coleccion, id);
        await window.deleteDoc(docRef);
    } catch (e) {
        console.error("Error eliminando documento: ", e);
        throw e;
    }
};

// --- INICIALIZACIÓN DE LA APP ---
window.checkSessionAndReady = () => {
    const loaderElement = document.getElementById('app-loader');
    if (loaderElement) {
        loaderElement.style.opacity = '0';
        setTimeout(() => {
            loaderElement.classList.add('hidden');
        }, 500);
    }

    const session = localStorage.getItem('rivas_session');
    if (session) {
        window.state.currentUser = JSON.parse(session);
        if (window.launchApp) window.launchApp();
    } else {
        if (window.showLogin) window.showLogin();
    }
};

// Actualizador Global de Vistas (Se dispara solo cuando hay cambios en la base de datos)
window.reRenderActiveViews = () => {
    if (window.renderAutosView) window.renderAutosView();
    if (window.renderClientesView) window.renderClientesView();
    if (window.renderFormulariosView) window.renderFormulariosView();
    if (window.renderPersonalView) window.renderPersonalView();
    if (window.renderDashboard) window.renderDashboard();
    if (window.renderCajaView) window.renderCajaView();
    
    // Si hay un modal abierto, lo actualizamos también (Ej: Si cambian el estado del auto mientras lo miras)
    if (window.state.selectedAutoId && window.renderDetalleAuto && document.getElementById('modal-detalle-auto') && !document.getElementById('modal-detalle-auto').classList.contains('hidden')) {
        window.renderDetalleAuto();
    }
};

window.bootApp = () => {
    const colecciones = [
        "autos", "usuarios", "sucursales", "transacciones", 
        "ventas", "formularios", "consultas", "comisiones", "cierres_personal"
    ];
    
    let loadedCount = 0;
    let isAppReady = false;

    // Aquí está la MAGIA DEL TIEMPO REAL: onSnapshot
    colecciones.forEach(col => {
        window.onSnapshot(window.collection(window.db, col), (snapshot) => {
            // Actualizamos la memoria interna al instante
            window.state[col] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Si la app ya terminó de cargar la primera vez, cualquier cambio repinta la pantalla
            if (isAppReady) {
                window.reRenderActiveViews();
            }

            // Lógica para saber cuándo apagar el Loader inicial
            if (!isAppReady) {
                loadedCount++;
                if (loadedCount === colecciones.length) {
                    isAppReady = true;
                    if (window.initSelects) window.initSelects();
                    window.checkSessionAndReady();
                }
            }
        }, (error) => {
            console.error(`Error en real-time para la colección ${col}:`, error);
            // Si algo falla (ej: sin internet), seguimos adelante para no colgar la app
            if (!isAppReady) {
                loadedCount++;
                if (loadedCount === colecciones.length) {
                    isAppReady = true;
                    window.checkSessionAndReady();
                }
            }
        });
    });
};

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        window.bootApp();
    }, 100);
});
