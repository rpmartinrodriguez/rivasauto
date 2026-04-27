// ==========================================
// js/app.js
// ==========================================

import { db, collection, addDoc, onSnapshot, getDocs } from "./firebase-config.js";

function setupRealtimeSync() {
  const collections = ['sucursales', 'usuarios', 'autos', 'transacciones', 'ventas', 'consultas', 'formularios', 'comisiones'];
  
  collections.forEach(collName => {
    onSnapshot(collection(db, collName), (snapshot) => {
      const arr = []; 
      snapshot.forEach((doc) => { 
        arr.push({ id: doc.id, ...doc.data() }); 
      });
      
      if(collName === 'sucursales') window.state.sucursales = arr;
      if(collName === 'usuarios') window.state.usuarios = arr;
      if(collName === 'autos') window.state.autos = arr;
      if(collName === 'transacciones') window.state.transacciones = arr;
      if(collName === 'ventas') window.state.ventas = arr;
      if(collName === 'consultas') window.state.consultas = arr;
      if(collName === 'formularios') window.state.formularios = arr;
      if(collName === 'comisiones') window.state.comisiones = arr;
      
      if (window.state.currentUser) { 
        const updatedUser = window.state.usuarios.find(u => u.id === window.state.currentUser.id); 
        if(updatedUser) window.state.currentUser = updatedUser; 
        
        if (window.initSelects) window.initSelects(); 
        if (window.renderAllViews) window.renderAllViews(); 
      }
    });
  });
}

function checkSessionAndReady() {
  const savedSession = localStorage.getItem('erp_session');
  
  if (savedSession) { 
    const user = window.state.usuarios.find(u => u.id === savedSession); 
    if (user && !user.isFirstLogin) { 
      window.state.currentUser = user; 
      if (window.launchApp) window.launchApp(); 
    } 
  }
  
  const loader = document.getElementById('loader-screen'); 
  loader.style.opacity = '0';
  
  setTimeout(() => { 
    loader.style.display = 'none'; 
    if (!window.state.currentUser) { 
      document.getElementById('auth-wrapper').classList.remove('hidden'); 
    } 
  }, 500);
}

async function bootApp() {
  setupRealtimeSync();
  
  setTimeout(async () => {
     const usersSnap = await getDocs(collection(db, "usuarios"));
     
     if(usersSnap.empty) {
        try {
          const sucRef = await addDoc(collection(db, "sucursales"), { nombre: 'Casa Central' });
          await addDoc(collection(db, "usuarios"), { 
            nombre: 'Admin Principal', 
            email: 'admin@rivasauto.com', 
            password: '12345rivasauto', 
            rol: 'Admin', 
            sucursalId: sucRef.id, 
            isFirstLogin: false 
          });
        } catch (err) {
          console.error("Error al crear admin", err);
        }
     }
     
     checkSessionAndReady();
  }, 1500);
}

// Asignamos los Listeners de Formularios Fijos
document.addEventListener("DOMContentLoaded", () => {
  const formCaja = document.getElementById('form-caja');
  if(formCaja) formCaja.addEventListener('submit', window.handleCajaSubmit);
  
  const formAuto = document.getElementById('form-auto');
  if(formAuto) formAuto.addEventListener('submit', window.handleAutoSubmit);
});

// Iniciar Motor
bootApp();
