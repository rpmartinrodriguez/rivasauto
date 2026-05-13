// ==========================================
// js/app.js
// ==========================================

// Generador de IDs simples
window.generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};

// Actualizador Global de Vistas (Auto-Refresco Local)
window.reRenderActiveViews = () => {
    if (window.renderAutosView) window.renderAutosView();
    if (window.renderClientesView) window.renderClientesView();
    if (window.renderFormulariosView) window.renderFormulariosView();
    if (window.renderPersonalView) window.renderPersonalView();
    if (window.renderDashboard) window.renderDashboard();
    if (window.renderCajaView) window.renderCajaView();
    
    // Si hay un modal abierto, lo actualizamos también
    if (window.state && window.state.selectedAutoId && window.renderDetalleAuto && document.getElementById('modal-detalle-auto') && !document.getElementById('modal-detalle-auto').classList.contains('hidden')) {
        window.renderDetalleAuto();
    }
};

// --- FUNCIONES FIREBASE CRUD ---
window.fbAdd = async (coleccion, data) => {
    try {
        const docRef = await window.addDoc(window.collection(window.db, coleccion), data);
        data.id = docRef.id;
        
        if(window.state[coleccion]) {
            window.state[coleccion].push(data);
        }
        
        // Magia: Forzamos el refresco visual al instante sin F5
        window.reRenderActiveViews();
        
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
        
        if(window.state[coleccion]) {
            const index = window.state[coleccion].findIndex(item => item.id === id);
            if(index !== -1) {
                window.state[coleccion][index] = { ...window.state[coleccion][index], ...data };
            }
        }
        
        // Magia: Forzamos el refresco visual al instante sin F5
        window.reRenderActiveViews();
        
    } catch (e) {
        console.error("Error actualizando documento: ", e);
        throw e;
    }
};

window.fbDelete = async (coleccion, id) => {
    try {
        const docRef = window.doc(window.db, coleccion, id);
        await window.deleteDoc(docRef);
        
        if(window.state[coleccion]) {
            window.state[coleccion] = window.state[coleccion].filter(item => item.id !== id);
        }
        
        // Magia: Forzamos el refresco visual al instante sin F5
        window.reRenderActiveViews();
        
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

window.bootApp = async () => {
    try {
        const [
            autosSnap, usuariosSnap, sucursalesSnap, transaccionesSnap, 
            ventasSnap, formulariosSnap, consultasSnap, comisionesSnap, cierresSnap
        ] = await Promise.all([
            window.getDocs(window.collection(window.db, "autos")),
            window.getDocs(window.collection(window.db, "usuarios")),
            window.getDocs(window.collection(window.db, "sucursales")),
            window.getDocs(window.collection(window.db, "transacciones")),
            window.getDocs(window.collection(window.db, "ventas")),
            window.getDocs(window.collection(window.db, "formularios")),
            window.getDocs(window.collection(window.db, "consultas")),
            window.getDocs(window.collection(window.db, "comisiones")),
            window.getDocs(window.collection(window.db, "cierres_personal"))
        ]);

        window.state.autos = autosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.state.usuarios = usuariosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.state.sucursales = sucursalesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.state.transacciones = transaccionesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.state.ventas = ventasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.state.formularios = formulariosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.state.consultas = consultasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.state.comisiones = comisionesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.state.cierres_personal = cierresSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (window.initSelects) window.initSelects();
        
        window.checkSessionAndReady();

    } catch (error) {
        console.error("Error cargando datos de Firebase:", error);
        window.checkSessionAndReady(); // Desbloquea la pantalla si hay error de red
    }
};

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        window.bootApp();
    }, 100);
});
