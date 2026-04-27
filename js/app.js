// ==========================================
//        IMPORTACIONES Y CONFIG FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = { 
  apiKey: "AIzaSyDCQSEAMGBfd8MgMMEgaYZ5jAjhaPYfeng", 
  authDomain: "rivasauto.firebaseapp.com", 
  projectId: "rivasauto", 
  storageBucket: "rivasauto.firebasestorage.app", 
  messagingSenderId: "281188948058", 
  appId: "1:281188948058:web:fa17ccc44d58159da2e063" 
};

const app = initializeApp(firebaseConfig); 
const db = getFirestore(app); 
window.db = db;

// ==========================================
//             ESTADO GLOBAL DE LA APP
// ==========================================
const state = {
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

// ==========================================
//             PWA E INSTALACIÓN
// ==========================================
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => { 
  e.preventDefault(); 
  deferredPrompt = e; 
  document.getElementById('login-install-btn').classList.remove('hidden'); 
  document.getElementById('sidebar-install-btn').classList.remove('hidden'); 
});

window.installPWA = async () => { 
  if (deferredPrompt) { 
    deferredPrompt.prompt(); 
    const { outcome } = await deferredPrompt.userChoice; 
    if (outcome === 'accepted') { 
      document.getElementById('login-install-btn').classList.add('hidden'); 
      document.getElementById('sidebar-install-btn').classList.add('hidden'); 
    } 
    deferredPrompt = null; 
  } 
};

// ==========================================
//             UTILIDADES GLOBALES
// ==========================================
const formatMoney = (a) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(a);
const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
const checkDocStatus = (docs) => docs && docs.c08 && docs.verificacion && docs.libreDeuda;
const formatWhatsAppLink = (phone, text) => `https://wa.me/549${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
const generateId = () => Math.random().toString(36).substring(2, 9);

window.toggleDarkMode = () => { 
  state.isDarkMode = !state.isDarkMode; 
  document.documentElement.classList.toggle('dark', state.isDarkMode); 
  document.getElementById('theme-icon').setAttribute('data-lucide', state.isDarkMode ? 'sun' : 'moon'); 
  lucide.createIcons(); 
};

window.togglePwd = (id) => { 
  const i = document.getElementById(id); 
  i.type = i.type === 'password' ? 'text' : 'password'; 
};

window.toggleSidebar = () => { 
  state.isSidebarOpen = !state.isSidebarOpen; 
  document.getElementById('sidebar').classList.toggle('-translate-x-full', !state.isSidebarOpen); 
  const b = document.getElementById('sidebar-backdrop'); 
  
  if(state.isSidebarOpen) { 
    b.classList.remove('hidden'); 
    setTimeout(() => b.classList.remove('opacity-0'), 10); 
  } else { 
    b.classList.add('opacity-0'); 
    setTimeout(() => b.classList.add('hidden'), 300); 
  } 
};

window.switchTab = (tabId) => { 
  state.activeTab = tabId; 
  document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden')); 
  document.getElementById(`view-${tabId}`).classList.remove('hidden'); 
  if(state.isSidebarOpen) toggleSidebar(); 
  window.renderNav(); 
};

window.openModal = (id) => {
  document.getElementById(id).classList.remove('hidden');
};

window.closeModal = (id) => { 
  document.getElementById(id).classList.add('hidden'); 
  if(id === 'modal-detalle-auto'){ 
    state.selectedAutoId = null; 
    state.isVentaMode = false; 
  } 
};

window.toggleNotifications = () => { 
  document.getElementById('notif-dropdown').classList.toggle('hidden'); 
};

// ==========================================
//      SISTEMA BASE: FIREBASE WRAPPERS
// ==========================================
window.fbAdd = async (collName, data) => { 
  try { 
    return await addDoc(collection(db, collName), data); 
  } catch (e) { 
    console.error("Error adding doc: ", e); 
  } 
};

window.fbUpdate = async (collName, idStr, data) => { 
  try { 
    await updateDoc(doc(db, collName, idStr), data); 
  } catch (e) { 
    console.error("Error updating doc: ", e); 
  } 
};

window.fbDelete = async (collName, idStr) => { 
  try { 
    await deleteDoc(doc(db, collName, idStr)); 
  } catch (e) { 
    console.error("Error deleting doc: ", e); 
  } 
};

// ==========================================
//         INICIALIZACIÓN Y LOGIN
// ==========================================
function setupRealtimeSync() {
  const collections = ['sucursales', 'usuarios', 'autos', 'transacciones', 'ventas', 'consultas', 'formularios', 'comisiones'];
  
  collections.forEach(collName => {
    onSnapshot(collection(db, collName), (snapshot) => {
      const arr = []; 
      snapshot.forEach((doc) => { 
        arr.push({ id: doc.id, ...doc.data() }); 
      });
      
      if(collName === 'sucursales') state.sucursales = arr;
      if(collName === 'usuarios') state.usuarios = arr;
      if(collName === 'autos') state.autos = arr;
      if(collName === 'transacciones') state.transacciones = arr;
      if(collName === 'ventas') state.ventas = arr;
      if(collName === 'consultas') state.consultas = arr;
      if(collName === 'formularios') state.formularios = arr;
      if(collName === 'comisiones') state.comisiones = arr;
      
      if (state.currentUser) { 
        const updatedUser = state.usuarios.find(u => u.id === state.currentUser.id); 
        if(updatedUser) state.currentUser = updatedUser; 
        window.initSelects(); 
        if(window.renderAllViews) window.renderAllViews(); 
      }
    });
  });
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

function checkSessionAndReady() {
  const savedSession = localStorage.getItem('erp_session');
  if (savedSession) { 
    const user = state.usuarios.find(u => u.id === savedSession); 
    if (user && !user.isFirstLogin) { 
      state.currentUser = user; 
      window.launchApp(); 
    } 
  }
  
  const loader = document.getElementById('loader-screen'); 
  loader.style.opacity = '0';
  setTimeout(() => { 
    loader.style.display = 'none'; 
    if (!state.currentUser) { 
      document.getElementById('auth-wrapper').classList.remove('hidden'); 
    } 
  }, 500);
}

window.handleLogin = (e) => { 
  e.preventDefault(); 
  const em = document.getElementById('login-email').value.toLowerCase(); 
  const pw = document.getElementById('login-pwd').value; 
  const err = document.getElementById('login-error'); 
  
  const u = state.usuarios.find(x => x.email.toLowerCase() === em && x.password === pw); 
  
  if(u) { 
    err.classList.add('hidden'); 
    state.currentUser = u; 
    if(u.isFirstLogin) { 
      document.getElementById('login-form').classList.add('hidden'); 
      document.getElementById('pwd-change-form').classList.remove('hidden'); 
      document.getElementById('auth-title').innerText = "Cambiar Contraseña"; 
    } else { 
      window.launchApp(); 
    } 
  } else { 
    err.classList.remove('hidden'); 
  } 
};

window.handlePwdChange = async (e) => { 
  e.preventDefault(); 
  const p1 = document.getElementById('new-pwd').value; 
  const p2 = document.getElementById('confirm-pwd').value; 
  const err = document.getElementById('pwd-error'); 
  
  if(p1 !== p2) { 
    err.classList.remove('hidden'); 
  } else { 
    err.classList.add('hidden'); 
    state.currentUser.password = p1; 
    state.currentUser.isFirstLogin = false; 
    await window.fbUpdate("usuarios", state.currentUser.id, { password: p1, isFirstLogin: false }); 
    window.launchApp(); 
  } 
};

window.launchApp = () => { 
  document.getElementById('auth-wrapper').classList.add('hidden'); 
  document.getElementById('app-wrapper').classList.remove('hidden'); 
  
  localStorage.setItem('erp_session', state.currentUser.id); 
  document.getElementById('user-name').innerText = state.currentUser.nombre; 
  document.getElementById('user-role').innerText = state.currentUser.rol; 
  document.getElementById('user-avatar').innerText = state.currentUser.nombre.charAt(0).toUpperCase(); 
  
  state.cajaFilterUser = 'all'; 
  window.initSelects(); 
  window.renderAllViews(); 
  window.switchTab('autos'); 
};

window.logout = () => { 
  state.currentUser = null; 
  localStorage.removeItem('erp_session'); 
  document.getElementById('app-wrapper').classList.add('hidden'); 
  document.getElementById('auth-wrapper').classList.remove('hidden'); 
  document.getElementById('login-form').classList.remove('hidden'); 
  document.getElementById('pwd-change-form').classList.add('hidden'); 
  document.getElementById('auth-title').innerText = "Iniciar Sesión"; 
  document.getElementById('login-form').reset(); 
  document.getElementById('pwd-change-form').reset(); 
};

// ==========================================
//             VISTAS DE INTERFAZ (RENDER)
// ==========================================
window.renderNav = () => {
  if(!state.currentUser) return; 
  const isAd = state.currentUser.rol === 'Admin';
  
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
    <button onclick="switchTab('${t.id}')" class="w-full flex items-center space-x-3 py-3 px-4 rounded-2xl transition-all font-bold text-sm ${state.activeTab === t.id ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}">
      <i data-lucide="${t.icon}" class="w-5 h-5"></i>
      <span>${t.label}</span>
    </button>
  `).join(''); 
  
  lucide.createIcons();
};

window.renderAllViews = () => { 
  if(!state.currentUser) return; 
  if(window.renderCajaView) window.renderCajaView(); 
  if(window.renderVentasView) window.renderVentasView();
  if(window.renderFacturasView) window.renderFacturasView(); 
  if(window.renderAutosView) window.renderAutosView(); 
  if(window.renderClientesView) window.renderClientesView(); 
  if(window.renderFormulariosView) window.renderFormulariosView();
  if(window.renderPersonalView) window.renderPersonalView();
  if(window.renderResumenesView) window.renderResumenesView(); 
  if(window.renderAdminView) window.renderAdminView(); 
  lucide.createIcons(); 
};

// ==========================================
//               FLOTA Y AUTOS
// ==========================================
window.toggleAutosViewMode = (mode) => { 
  state.autosViewMode = mode; 
  window.renderAutosView(); 
};

window.renderAutosView = () => {
  const container = document.getElementById('autos-container');
  
  document.getElementById('btn-view-grid').className = state.autosViewMode === 'grid' ? 'p-2 rounded-lg bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white transition-colors' : 'p-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors';
  document.getElementById('btn-view-list').className = state.autosViewMode === 'list' ? 'p-2 rounded-lg bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white transition-colors' : 'p-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors';
  
  const autosValidos = state.autos.filter(a => a.estado !== 'Vendido');
  
  if (autosValidos.length === 0) { 
    container.innerHTML = '<div class="col-span-full py-12 text-center text-neutral-500 font-bold">No hay vehículos en la flota.</div>'; 
    return; 
  }

  if (state.autosViewMode === 'grid') {
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 fade-in">
        ${autosValidos.map(auto => {
          const totalGastos = auto.gastos?.reduce((s, g) => s + Number(g.monto), 0) || 0; 
          const sName = state.sucursales.find(x => x.id === auto.sucursalId)?.nombre || 'Sin Asignar';
          
          let bClass = 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'; 
          if(auto.estado === 'Disponible') bClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'; 
          if(auto.estado === 'A Ingresar') bClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500 border border-amber-300 dark:border-amber-700';
          
          return `
            <div onclick="openDetalleAuto('${auto.id}')" class="group cursor-pointer bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-2 shadow-sm hover:shadow-lg transition-all hover:border-green-500/50">
              <div class="bg-neutral-50/50 dark:bg-neutral-800/50 rounded-[2rem] p-6 h-full flex flex-col relative">
                <div class="flex justify-between items-start mb-4">
                  <div class="flex flex-col space-y-1">
                    <div class="flex space-x-2">
                      <span class="px-3 py-1 text-[10px] font-bold uppercase rounded-xl ${bClass}">
                        ${auto.estado}
                      </span>
                    </div>
                    <span class="text-xs text-neutral-500 font-bold ml-1">
                      <i data-lucide="map-pin" class="w-3 h-3 inline"></i> ${sName} | <span class="uppercase text-[10px]">${auto.condicion || 'Propio'}</span>
                    </span>
                  </div>
                  <div class="bg-white dark:bg-neutral-900 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <span class="font-mono text-sm font-bold">${auto.patente}</span>
                  </div>
                </div>
                <div class="mb-4">
                  <h3 class="text-2xl font-black">${auto.marca} <br/><span class="text-neutral-500">${auto.modelo}</span></h3>
                  <p class="text-sm text-neutral-400 mt-1 font-bold">Año ${auto.año} • ${auto.color || ''} • ${auto.km || 0} km</p>
                </div>
                <div class="mt-auto space-y-3">
                  <div class="flex justify-between items-center p-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                    <span class="text-xs font-bold text-neutral-500 uppercase">Precio</span>
                    <span class="text-lg font-black">${formatMoney(auto.precio)}</span>
                  </div>
                  <div class="flex justify-between items-center px-2">
                    <span class="text-xs text-neutral-500 font-bold">
                      <i data-lucide="wrench" class="w-3 h-3 inline"></i> Inversión
                    </span>
                    <span class="text-sm font-bold">${formatMoney(totalGastos)}</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-[2rem] shadow-sm overflow-hidden fade-in">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-xs uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-800/30">
                <th class="px-6 py-4 font-bold">Vehículo</th>
                <th class="px-6 py-4 font-bold">Patente</th>
                <th class="px-6 py-4 font-bold">Detalles</th>
                <th class="px-6 py-4 font-bold">Estado</th>
                <th class="px-6 py-4 font-bold text-right">Precio Venta</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/50">
              ${autosValidos.map(auto => {
                let bClass = 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'; 
                if(auto.estado === 'Disponible') bClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'; 
                if(auto.estado === 'A Ingresar') bClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500';
                
                return `
                  <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors" onclick="openDetalleAuto('${auto.id}')">
                    <td class="px-6 py-4">
                      <p class="font-bold">${auto.marca} ${auto.modelo}</p>
                      <p class="text-xs text-neutral-500 font-bold mt-1">Año ${auto.año}</p>
                    </td>
                    <td class="px-6 py-4 font-mono text-sm font-bold uppercase">${auto.patente}</td>
                    <td class="px-6 py-4 text-xs text-neutral-600 dark:text-neutral-400 font-bold capitalize">
                      ${auto.color || '-'} • ${auto.km || 0} km • <span class="uppercase">${auto.condicion || 'Propio'}</span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-2 py-1 text-[10px] font-bold uppercase rounded-md ${bClass}">${auto.estado}</span>
                    </td>
                    <td class="px-6 py-4 text-right font-black text-lg">${formatMoney(auto.precio)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  lucide.createIcons();
};

window.openModalCreateAuto = () => { 
  state.editingAutoId = null; 
  document.getElementById('form-auto').reset(); 
  document.getElementById('modal-auto-title').innerText = "Alta Vehículo"; 
  window.openModal('modal-auto'); 
};

window.editAuto = (id) => { 
  const a = state.autos.find(x => x.id === id); 
  state.editingAutoId = id; 
  document.getElementById('auto-marca').value = a.marca; 
  document.getElementById('auto-modelo').value = a.modelo; 
  document.getElementById('auto-color').value = a.color || ''; 
  document.getElementById('auto-km').value = a.km || ''; 
  document.getElementById('auto-anio').value = a.año; 
  document.getElementById('auto-patente').value = a.patente; 
  document.getElementById('auto-precio').value = a.precio; 
  document.getElementById('auto-costo').value = a.costo || 0; 
  document.getElementById('auto-condicion').value = a.condicion || 'Propio'; 
  document.getElementById('auto-sucursal').value = a.sucursalId; 
  document.getElementById('modal-auto-title').innerText = "Editar Vehículo"; 
  window.closeModal('modal-detalle-auto'); 
  window.openModal('modal-auto'); 
};

window.deleteAuto = async (id) => { 
  if(confirm('¿Estás seguro de eliminar este vehículo de manera permanente?')) { 
    await window.fbDelete("autos", id); 
    window.closeModal('modal-detalle-auto'); 
  } 
};

// Event listener para el Formulario de Autos
document.getElementById('form-auto').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const obj = { 
    marca: document.getElementById('auto-marca').value, 
    modelo: document.getElementById('auto-modelo').value, 
    color: document.getElementById('auto-color').value, 
    km: Number(document.getElementById('auto-km').value), 
    año: Number(document.getElementById('auto-anio').value), 
    patente: document.getElementById('auto-patente').value.toUpperCase(), 
    precio: Number(document.getElementById('auto-precio').value), 
    costo: Number(document.getElementById('auto-costo').value), 
    condicion: document.getElementById('auto-condicion').value, 
    sucursalId: document.getElementById('auto-sucursal').value 
  };
  
  if(state.editingAutoId) { 
    await window.fbUpdate("autos", state.editingAutoId, obj); 
  } else { 
    await window.fbAdd("autos", { 
      ...obj, 
      estado: 'Disponible', 
      gastos: [], 
      documentacion: { c08: false, verificacion: false, libreDeuda: false, vtv: '' } 
    }); 
  }
  
  window.closeModal('modal-auto'); 
  e.target.reset(); 
  window.initSelects();
});

// ==========================================
//          DETALLE AUTO 360 Y FLUJOS
// ==========================================
window.switchDASection = (s) => { 
  state.daActiveSection = s; 
  window.renderDetalleAuto(); 
};

window.toggleDoc = async (id, k) => { 
  const a = state.autos.find(x => x.id === id); 
  const docs = a.documentacion; 
  docs[k] = !docs[k]; 
  await window.fbUpdate("autos", id, { documentacion: docs }); 
  window.renderDetalleAuto(); 
};

window.updateVTV = async (id, v) => { 
  const a = state.autos.find(x => x.id === id); 
  const docs = a.documentacion; 
  docs.vtv = v; 
  await window.fbUpdate("autos", id, { documentacion: docs }); 
  window.renderDetalleAuto(); 
};

window.openDetalleAuto = (id) => { 
  state.selectedAutoId = id; 
  state.daActiveSection = 'crm'; 
  state.isVentaMode = false; 
  
  // Reseteamos ventaData permuta al abrir una ficha limpia
  state.ventaData.tienePermuta = false;
  
  window.renderDetalleAuto(); 
  window.openModal('modal-detalle-auto'); 
};

window.openModalIngreso = (id) => {
  state.pendingIngresoAutoId = id; 
  document.getElementById('ingreso-precio').value = ''; 
  document.getElementById('ingreso-aviso-gastos').classList.add('hidden'); 
  document.getElementById('btn-ingreso-gastos').classList.add('hidden'); 
  
  window.closeModal('modal-detalle-auto'); 
  window.openModal('modal-ingreso-auto');
};

window.confirmarIngresoAuto = async () => { 
  const p = Number(document.getElementById('ingreso-precio').value); 
  
  if(p > 0) { 
    await window.fbUpdate("autos", state.pendingIngresoAutoId, { estado: 'Disponible', precio: p }); 
    document.getElementById('ingreso-aviso-gastos').classList.remove('hidden'); 
    document.getElementById('btn-ingreso-gastos').classList.remove('hidden'); 
  } else { 
    alert("Debe establecer un precio mayor a 0."); 
  } 
};

window.abrirCajaParaGastos = () => { 
  window.closeModal('modal-ingreso-auto'); 
  window.switchTab('caja'); 
  window.openModal('modal-caja'); 
  setTimeout(() => { 
    document.getElementById('caja-auto').value = state.pendingIngresoAutoId; 
    document.getElementById('caja-tipo').value = 'gasto'; 
  }, 500); 
};

window.renderDetalleAuto = () => {
  const a = state.autos.find(x => x.id === state.selectedAutoId); 
  if(!a) return;
  
  const tg = a.gastos?.reduce((ac, g) => ac + g.monto, 0) || 0;
  
  document.getElementById('da-header-actions').innerHTML = `
    <button type="button" onclick="editAuto('${a.id}')" class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition">
      <i data-lucide="edit-2" class="w-4 h-4"></i>
    </button>
    <button type="button" onclick="deleteAuto('${a.id}')" class="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 rounded-full transition">
      <i data-lucide="trash-2" class="w-4 h-4"></i>
    </button>
    <div class="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-2"></div>
    <button type="button" onclick="closeModal('modal-detalle-auto')" class="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-full">
      <i data-lucide="x" class="w-5 h-5"></i>
    </button>
  `;
  
  let html = '';
  
  if(!state.isVentaMode) {
    
    // MODO VISTA NORMAL
    html += `
      <div class="bg-black text-white dark:bg-white dark:text-black rounded-[2rem] p-8 mb-6 relative overflow-hidden border border-neutral-800 dark:border-neutral-200">
        <div class="flex justify-between items-start relative z-10">
          <div>
            <span class="bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 text-[10px] uppercase px-3 py-1 rounded-lg font-bold">
              ${a.estado}
            </span>
            <span class="ml-2 bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 text-[10px] uppercase px-3 py-1 rounded-lg font-bold">
              ${a.condicion || 'Propio'}
            </span>
            <h2 class="text-3xl font-black mt-3">${a.marca} ${a.modelo}</h2>
            <p class="text-sm mt-1 opacity-80 font-bold">Año ${a.año} • ${a.color||''} • ${a.km||0} km</p>
          </div>
          <div class="text-right">
            <p class="text-xs uppercase font-bold opacity-60">Precio Venta</p>
            <p class="text-3xl font-black mt-1">${formatMoney(a.precio)}</p>
          </div>
        </div>
    `;
    
    if (state.currentUser.rol === 'Admin' && a.costo > 0) { 
      html += `<p class="mt-4 text-xs font-bold text-neutral-400">Costo Base Original: ${formatMoney(a.costo)}</p>`; 
    }
    
    if(a.estado === 'A Ingresar') {
      html += `
        <div class="mt-8 pt-6 border-t border-white/10 dark:border-black/10">
          <button onclick="openModalIngreso('${a.id}')" class="w-full py-4 bg-amber-500 text-black font-black rounded-2xl shadow hover:bg-amber-400 transition-all">
            Marcar como Disponible / Fijar Precio
          </button>
        </div>
      `;
    } else if (a.estado !== 'Vendido') { 
      if (state.currentUser.rol === 'Admin' || state.currentUser.rol === 'Vendedor' || state.currentUser.rol === 'Encargado') { 
        html += `
          <div class="mt-8 pt-6 border-t border-white/10 dark:border-black/10">
            <button onclick="state.isVentaMode=true; renderDetalleAuto()" class="w-full py-4 bg-green-600 text-white dark:bg-green-500 dark:text-black font-black rounded-2xl shadow hover:bg-green-700 transition-all">
              Cerrar Venta con Cliente
            </button>
          </div>
        `; 
      } 
    } else {
      html += `
        <div class="mt-8 pt-6 border-t border-white/10 dark:border-black/10">
          <button onclick="generarBoletoDesdeVendido('${a.id}')" class="w-full py-4 bg-white text-black font-black rounded-2xl shadow hover:bg-neutral-200 transition-all">
            <i data-lucide="file-text" class="w-5 h-5 inline mr-2"></i> Generar Boleto de esta Unidad
          </button>
        </div>
      `;
    }
    
    html += `</div>`;
    
    html += `
      <div class="flex space-x-4 border-b border-neutral-200 dark:border-neutral-800 mb-6 overflow-x-auto no-scrollbar">
        <button onclick="switchDASection('crm')" class="pb-3 font-bold border-b-2 flex items-center ${state.daActiveSection === 'crm' ? 'border-green-600 text-green-600' : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'}">
          <i data-lucide="users" class="w-4 h-4 mr-2"></i> Leads
        </button>
        <button onclick="switchDASection('doc')" class="pb-3 font-bold border-b-2 flex items-center ${state.daActiveSection === 'doc' ? 'border-green-600 text-green-600' : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'}">
          <i data-lucide="file-check" class="w-4 h-4 mr-2"></i> Papeles
        </button>
      </div>
    `;
    
    if(state.daActiveSection === 'doc') {
      html += `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${[{k:'c08', l:'08 Firmado'},{k:'verificacion', l:'Verificación (12D)'},{k:'libreDeuda', l:'Libre Deuda'}].map(i => `
            <div onclick="toggleDoc('${a.id}','${i.k}')" class="p-5 rounded-2xl border-2 flex items-center space-x-4 cursor-pointer transition-colors ${a.documentacion[i.k] ? 'border-green-600 bg-green-50/50 dark:bg-green-900/10' : 'border-neutral-200 dark:border-neutral-700'}">
              <div class="w-6 h-6 rounded-full flex items-center justify-center ${a.documentacion[i.k] ? 'bg-green-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800'}">
                ${a.documentacion[i.k] ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}
              </div>
              <span class="font-bold">${i.l}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else if(state.daActiveSection === 'crm') {
       html += `
         <div>
           <form onsubmit="handleDA_CRMSubmit(event, '${a.id}')" class="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 mb-6">
             <h4 class="font-bold mb-4 text-sm uppercase text-neutral-500 tracking-wider">Cargar Interesado</h4>
             <div class="grid grid-cols-2 gap-4">
               <input id="dac-nombre" required placeholder="Nombre" class="w-full mb-4 rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-green-500 font-bold" />
               <input id="dac-tel" required placeholder="Teléfono" class="w-full mb-4 rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-green-500 font-bold" />
             </div>
             <textarea id="dac-nota" placeholder="Notas..." class="w-full mb-4 rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none resize-none focus:border-green-500 font-bold"></textarea>
             <button type="submit" class="w-full py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform">
               Guardar Lead
             </button>
           </form>
         </div>
       `;
    }
  } else {
    
    // MODO CERRAR VENTA (Checkout Modal)
    html += `
      <button type="button" onclick="state.isVentaMode=false; renderDetalleAuto()" class="mb-6 text-sm font-bold flex items-center hover:underline text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
        <i data-lucide="arrow-left" class="w-4 h-4 mr-1"></i> Volver a Ficha
      </button>
    `;
    
    // Ganancia visible sólo para Admin
    if (state.currentUser.rol === 'Admin') {
      html += `
        <div class="bg-black dark:bg-white text-white dark:text-black rounded-[2rem] p-6 mb-6 flex justify-between shadow-xl border border-neutral-800 dark:border-neutral-200">
          <div>
            <p class="text-xs uppercase opacity-70 mb-1 font-bold">Costo Inversión Total</p>
            <p class="text-xl font-bold">${formatMoney((a.costo||0) + tg)}</p>
          </div>
          <div class="text-right">
            <p class="text-xs uppercase opacity-70 mb-1 font-bold">Ganancia Bruta Est.</p>
            <p class="text-xl font-black text-green-400 dark:text-green-600">${formatMoney(a.precio - ((a.costo||0) + tg))}</p>
          </div>
        </div>
      `;
    }

    html += `
      <form onsubmit="handleDAVentaSubmit(event, '${a.id}')">
        
        <div class="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 mb-6">
          <h4 class="font-bold mb-4 text-sm uppercase text-neutral-500 tracking-wider">Datos Comprador</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input id="vent-comp-nombre" required placeholder="Nombre y Apellido" class="col-span-2 w-full rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="vent-comp-tel" required placeholder="Teléfono" class="col-span-2 w-full rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="vent-comp-dni" required placeholder="D.N.I" class="col-span-2 md:col-span-1 w-full rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="vent-comp-domicilio" required placeholder="Domicilio" class="col-span-2 md:col-span-3 w-full rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
          </div>
        </div>
        
        <div class="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 mb-6">
          <h4 class="font-bold mb-4 text-sm uppercase text-neutral-500 tracking-wider">Formas de Pago Aplicadas</h4>
          
          <label class="flex items-center space-x-2 mb-2 font-bold cursor-pointer">
            <input type="checkbox" id="chk-efectivo" onchange="document.getElementById('div-efectivo').classList.toggle('hidden', !this.checked)" class="w-5 h-5 text-green-600 rounded"> 
            <span>Efectivo / Transferencia (Inmediato a Caja)</span>
          </label>
          <div id="div-efectivo" class="hidden pl-8 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 fade-in">
            <input id="val-efectivo" type="number" placeholder="Monto ($)" class="rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-bold text-lg outline-none focus:border-green-500">
            <input id="nota-efectivo" type="text" placeholder="Nota / Banco..." class="rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:border-green-500 font-bold">
          </div>
          
          <label class="flex items-center space-x-2 mb-2 font-bold cursor-pointer">
            <input type="checkbox" id="chk-credito" onchange="document.getElementById('div-credito').classList.toggle('hidden', !this.checked)" class="w-5 h-5 text-green-600 rounded"> 
            <span>Crédito Pre-Aprobado (Pendiente)</span>
          </label>
          <div id="div-credito" class="hidden pl-8 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl fade-in">
            <input id="val-credito" type="number" placeholder="Monto ($)" class="col-span-2 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 font-bold outline-none focus:border-green-500">
            <input id="cuotas-credito" type="number" placeholder="Cant. Cuotas" class="rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 font-bold outline-none focus:border-green-500">
            <input id="venc-credito" type="date" class="rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 text-xs font-bold outline-none focus:border-green-500" title="1º Vencimiento">
            <input id="nota-credito" type="text" placeholder="Entidad / Financiera..." class="col-span-4 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 font-bold outline-none focus:border-green-500">
          </div>
          
          <label class="flex items-center space-x-2 mb-2 font-bold cursor-pointer">
            <input type="checkbox" id="chk-pagare" onchange="document.getElementById('div-pagare').classList.toggle('hidden', !this.checked)" class="w-5 h-5 text-green-600 rounded"> 
            <span>Pagaré Personal (Pendiente)</span>
          </label>
          <div id="div-pagare" class="hidden pl-8 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl fade-in">
            <input id="val-pagare" type="number" placeholder="Monto ($)" class="col-span-2 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 font-bold outline-none focus:border-green-500">
            <input id="cuotas-pagare" type="number" placeholder="Cant. Cuotas" class="rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 font-bold outline-none focus:border-green-500">
            <input id="venc-pagare" type="date" class="rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 text-xs font-bold outline-none focus:border-green-500" title="1º Vencimiento">
            <input id="nota-pagare" type="text" placeholder="Detalle / Aval..." class="col-span-4 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 font-bold outline-none focus:border-green-500">
          </div>
        </div>
        
        <div class="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 mb-8">
          <div class="flex justify-between items-center mb-6">
            <h4 class="font-bold flex items-center text-neutral-700 dark:text-neutral-300">
              <i data-lucide="repeat" class="w-5 h-5 mr-2 opacity-60"></i> Recibe Vehículo en Permuta
            </h4>
            
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" id="vent-hasperm" class="sr-only toggle-checkbox" onchange="document.getElementById('permuta-fields').classList.toggle('hidden', !this.checked); state.ventaData.tienePermuta=this.checked;" ${state.ventaData.tienePermuta ? 'checked' : ''} />
              <div class="toggle-label bg-neutral-300 dark:bg-neutral-600 relative">
                <div class="absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${state.ventaData.tienePermuta ? 'translate-x-6' : ''}"></div>
              </div>
            </label>
          </div>
          
          <div id="permuta-fields" class="${state.ventaData.tienePermuta ? '' : 'hidden'} grid grid-cols-2 md:grid-cols-3 gap-4 fade-in">
            <input id="p-marca" placeholder="Marca" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="p-modelo" placeholder="Modelo" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="p-color" placeholder="Color" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="p-km" type="number" placeholder="Km" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="p-anio" type="number" placeholder="Año" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500" />
            <input id="p-pat" placeholder="Patente" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 uppercase outline-none font-bold focus:border-green-500" />
            
            <select id="p-condicion" class="rounded-xl px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none font-bold focus:border-green-500">
              <option value="Propio">Propio</option>
              <option value="Consignación">Consignación</option>
            </select>
            
            <div class="col-span-2 mt-2">
              <label class="block text-xs font-bold uppercase mb-2 text-neutral-500">Valor Real de Toma / Costo ($)</label>
              <input id="p-valor" type="number" placeholder="Ingresará a la flota con este costo base" class="w-full rounded-xl px-4 py-4 text-lg font-black bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 outline-none focus:border-green-500" />
            </div>
          </div>
        </div>
        
        <button type="submit" class="w-full py-5 bg-green-600 text-white font-black text-lg rounded-2xl shadow-xl hover:bg-green-700 hover:scale-[1.01] transition-transform">
          Confirmar Cierre de Venta
        </button>
      </form>
    `;
  }
  
  document.getElementById('da-content').innerHTML = html;
  lucide.createIcons();
};

// ==========================================
//          CRM: CARGA DE LEADS
// ==========================================
window.handleGlobalLeadSubmit = async (e) => { 
  e.preventDefault(); 
  await window.fbAdd("consultas", { 
    autoId: null, 
    nombre: document.getElementById('gl-nombre').value, 
    telefono: document.getElementById('gl-tel').value, 
    marcaInteres: document.getElementById('gl-interes').value, 
    estadoLead: document.getElementById('gl-estado').value, 
    notas: document.getElementById('gl-nota').value, 
    recordatorio: new Date().toISOString().split('T')[0], 
    fecha: new Date().toISOString().split('T')[0] 
  }); 
  
  window.closeModal('modal-nuevo-lead'); 
  e.target.reset(); 
};

window.handleDA_CRMSubmit = async (e, autoId) => { 
  e.preventDefault(); 
  const a = state.autos.find(x => x.id === autoId);
  
  await window.fbAdd("consultas", { 
    autoId: autoId, 
    marcaInteres: a.marca, 
    nombre: document.getElementById('dac-nombre').value, 
    telefono: document.getElementById('dac-tel').value, 
    notas: document.getElementById('dac-nota').value, 
    estadoLead: 'Tibio', 
    recordatorio: new Date().toISOString().split('T')[0], 
    fecha: new Date().toISOString().split('T')[0] 
  }); 
  
  document.getElementById('dac-nombre').value = ''; 
  document.getElementById('dac-tel').value = ''; 
  document.getElementById('dac-nota').value = '';
};

// ==========================================
//          CONFIRMAR CIERRE VENTA
// ==========================================
window.handleDAVentaSubmit = async (e, autoId) => {
  e.preventDefault(); 
  const auto = state.autos.find(x => x.id === autoId);
  
  // Determinamos quién registra (Admin o Vendedor)
  let userQueRegistra = state.currentUser;
  
  // Si el Admin está cerrando, lo ideal es asignar el ingreso a él, o si quieres al vendedor, se puede mejorar a futuro.
  // De momento usamos el usuario en sesión.
  
  const vEf = document.getElementById('chk-efectivo')?.checked ? Number(document.getElementById('val-efectivo').value) : 0;
  const vCr = document.getElementById('chk-credito')?.checked ? Number(document.getElementById('val-credito').value) : 0;
  const vPa = document.getElementById('chk-pagare')?.checked ? Number(document.getElementById('val-pagare').value) : 0;
  const vPe = state.ventaData.tienePermuta ? Number(document.getElementById('p-valor').value) : 0;
  
  const tVenta = vEf + vCr + vPa + vPe;

  if(tVenta <= 0) {
    return alert("Debe especificar al menos una forma de pago válida o permuta.");
  }

  const fDate = new Date().toISOString().split('T')[0];

  // 1. Ingresar Efectivo a Caja Directo
  if(vEf > 0) {
    await window.fbAdd("transacciones", { 
      fecha: fDate, 
      descripcion: `Cobro Venta: ${auto.marca} ${auto.modelo} (${document.getElementById('nota-efectivo').value||'Efectivo'})`, 
      tipo: 'ingreso', 
      categoria: 'Venta Vehículos', 
      valor: vEf, 
      userId: userQueRegistra.id, 
      sucursalId: userQueRegistra.sucursalId, 
      tipoComprobante: 'X', 
      numComprobante: '',
      iva: 0, 
      estadoCobro: 'disponible', 
      fechaAcreditacion: null 
    });
  }
  
  // 2. Ingresar Pendiente Credito a Caja
  if(vCr > 0) {
    await window.fbAdd("transacciones", { 
      fecha: fDate, 
      descripcion: `Cobro Crédito: ${auto.marca} ${auto.modelo} (${document.getElementById('nota-credito').value||'-'})`, 
      tipo: 'ingreso', 
      categoria: 'Venta Vehículos', 
      valor: vCr, 
      userId: userQueRegistra.id, 
      sucursalId: userQueRegistra.sucursalId, 
      tipoComprobante: 'X', 
      numComprobante: '',
      iva: 0, 
      estadoCobro: 'pendiente', 
      fechaAcreditacion: document.getElementById('venc-credito').value 
    });
  }
  
  // 3. Ingresar Pendiente Pagare a Caja
  if(vPa > 0) {
    await window.fbAdd("transacciones", { 
      fecha: fDate, 
      descripcion: `Cobro Pagaré: ${auto.marca} ${auto.modelo} (${document.getElementById('nota-pagare').value||'-'})`, 
      tipo: 'ingreso', 
      categoria: 'Venta Vehículos', 
      valor: vPa, 
      userId: userQueRegistra.id, 
      sucursalId: userQueRegistra.sucursalId, 
      tipoComprobante: 'X', 
      numComprobante: '',
      iva: 0, 
      estadoCobro: 'pendiente', 
      fechaAcreditacion: document.getElementById('venc-pagare').value 
    });
  }

  // 4. Registro de Venta Histórica
  let metodos = [];
  if(vEf > 0) metodos.push('Efectivo');
  if(vCr > 0) metodos.push('Crédito');
  if(vPa > 0) metodos.push('Pagaré');
  if(vPe > 0) metodos.push('Permuta');
  
  const cuotas = Math.max(Number(document.getElementById('cuotas-credito')?.value||0), Number(document.getElementById('cuotas-pagare')?.value||0));

  const ventaGuardadaRef = await window.fbAdd("ventas", {
    fecha: fDate, 
    autoDesc: `${auto.marca} ${auto.modelo} (${auto.patente})`,
    compradorNombre: document.getElementById('vent-comp-nombre').value, 
    compradorTelefono: document.getElementById('vent-comp-tel').value,
    compradorDNI: document.getElementById('vent-comp-dni').value,
    compradorDomicilio: document.getElementById('vent-comp-domicilio').value,
    montoTotal: tVenta, 
    metodoPago: metodos.join(' + '), 
    cuotasTotales: cuotas, 
    cuotasPagadas: 0, 
    tienePermuta: state.ventaData.tienePermuta,
    detallePermuta: state.ventaData.tienePermuta ? `${document.getElementById('p-marca').value} ${document.getElementById('p-modelo').value}` : null
  });

  // 5. Auto en Permuta ingresa a Flota "A Ingresar"
  if(state.ventaData.tienePermuta) {
    await window.fbAdd("autos", { 
      marca: document.getElementById('p-marca').value, 
      modelo: document.getElementById('p-modelo').value, 
      color: document.getElementById('p-color').value, 
      km: Number(document.getElementById('p-km').value||0),
      año: Number(document.getElementById('p-anio').value), 
      patente: document.getElementById('p-pat').value.toUpperCase(), 
      precio: 0, 
      costo: vPe, 
      condicion: document.getElementById('p-condicion').value, 
      estado: 'A Ingresar', 
      sucursalId: auto.sucursalId, 
      gastos: [], 
      documentacion: {c08: false, verificacion: false, libreDeuda: false, vtv: ''} 
    });
  }
  
  // 6. Auto actual se marca como vendido
  await window.fbUpdate("autos", autoId, { estado: 'Vendido' }); 
  
  // 7. Armar la data pre-cargada para el Modal Confirmación Boleto
  state.tempFormData = {
    auto: auto,
    comprador: document.getElementById('vent-comp-nombre').value, 
    telefono: document.getElementById('vent-comp-tel').value, 
    dni: document.getElementById('vent-comp-dni').value, 
    domicilio: document.getElementById('vent-comp-domicilio').value,
    monto: tVenta, 
    efectivo: vEf, 
    saldo: vCr + vPa, 
    cuotas: cuotas, 
    valCuota: '',
    permuta: state.ventaData.tienePermuta ? { 
      marca: document.getElementById('p-marca').value, 
      modelo: document.getElementById('p-modelo').value, 
      anio: document.getElementById('p-anio').value, 
      patente: document.getElementById('p-pat').value.toUpperCase(), 
      tasado: document.getElementById('p-valor').value 
    } : null
  };

  window.closeModal('modal-detalle-auto'); 
  
  // Configuramos el botón de confirmación de boleto
  document.getElementById('btn-go-to-boleto').onclick = () => {
     window.closeModal('modal-confirm-boleto');
     window.switchTab('formularios'); 
     window.openModalBoleto(state.ventaData.tienePermuta ? 'permuta' : 'simple', state.tempFormData);
  };
  
  window.openModal('modal-confirm-boleto');
};

window.generarBoletoDesdeVendido = (autoId) => {
  const a = state.autos.find(x => x.id === autoId); 
  const v = state.ventas.find(venta => venta.autoDesc.includes(a.patente));
  
  const prefillData = { 
    auto: a, 
    comprador: v ? v.compradorNombre : '', 
    dni: v ? v.compradorDNI : '', 
    domicilio: v ? v.compradorDomicilio : '', 
    monto: v ? v.montoTotal : a.precio, 
    efectivo: v ? v.montoTotal : a.precio 
  };
  
  window.closeModal('modal-detalle-auto'); 
  window.switchTab('formularios'); 
  window.openModalBoleto(v && v.tienePermuta ? 'permuta' : 'simple', prefillData);
};

// ==========================================
//           RENDERS TABLAS Y EXTRAS
// ==========================================

window.renderClientesView = () => { 
  const table = document.getElementById('crm-table'); 
  
  if (state.consultas.length === 0) { 
    table.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-neutral-500 font-bold">No hay clientes en la base de datos.</td></tr>`; 
  } else { 
    table.innerHTML = state.consultas.slice().reverse().map(c => { 
      const a = c.autoId ? state.autos.find(x => x.id === c.autoId) : null; 
      let lClass = 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'; 
      if(c.estadoLead === 'Caliente') lClass = 'bg-black text-white dark:bg-white dark:text-black'; 
      if(c.estadoLead === 'Tibio') lClass = 'bg-neutral-400 text-neutral-900 dark:bg-neutral-600 dark:text-white'; 
      
      return `
        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
          <td class="px-6 py-4">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center mr-4 font-black text-lg">
                ${c.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <p class="font-bold">${c.nombre}</p>
                <span class="inline-flex px-2 py-0.5 mt-1 rounded-md text-[10px] font-black uppercase tracking-widest ${lClass}">
                  ${c.estadoLead}
                </span>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 text-sm font-bold">
            ${c.telefono}
          </td>
          <td class="px-6 py-4">
            ${a ? `<span class="font-bold text-sm text-green-600 dark:text-green-500 cursor-pointer hover:underline" onclick="openDetalleAuto('${a.id}')">${a.marca} ${a.modelo}</span>` : `<span class="font-bold text-sm">${c.marcaInteres}</span>`}
            <p class="text-xs text-neutral-500 italic mt-1 max-w-[200px] truncate">"${c.notas}"</p>
          </td>
          <td class="px-6 py-4 text-sm font-bold">
            ${formatDate(c.recordatorio)}
          </td>
          <td class="px-6 py-4">
            <a href="${formatWhatsAppLink(c.telefono, `Hola ${c.nombre}, me comunico de RIVAS AUTO.`)}" target="_blank" class="px-4 py-2 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md transition-transform hover:scale-105 hover:bg-green-700 inline-block">
              Contactar
            </a>
          </td>
        </tr>
      `; 
    }).join(''); 
  } 
};

window.renderVentasView = () => { 
  if(state.currentUser?.rol !== 'Admin') return; 
  
  const table = document.getElementById('ventas-table'); 
  if (state.ventas.length === 0) { 
    table.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-neutral-500 font-bold">No hay ventas registradas.</td></tr>`; 
  } else { 
    table.innerHTML = state.ventas.slice().reverse().map(v => { 
      let badge = ''; 
      if (v.metodoPago.includes('Crédito') || v.metodoPago.includes('Pagaré')) { 
        const p = v.cuotasTotales - v.cuotasPagadas; 
        badge = `<span class="block mt-1 text-[10px] ${p > 0 ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' : 'text-green-600 bg-green-50 dark:bg-green-900/30'} px-2 py-0.5 rounded font-bold">${p} Pendientes</span>`; 
      } 
      
      return `
        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors" onclick="openDetalleVenta('${v.id}')">
          <td class="px-6 py-4 text-sm text-neutral-500">${formatDate(v.fecha)}</td>
          <td class="px-6 py-4">
            <p class="font-bold text-sm">${v.compradorNombre}</p>
            <p class="text-xs text-neutral-500 flex items-center mt-1"><i data-lucide="phone" class="w-3 h-3 mr-1"></i>${v.compradorTelefono}</p>
          </td>
          <td class="px-6 py-4 font-bold text-sm">${v.autoDesc}</td>
          <td class="px-6 py-4 text-right font-black">${formatMoney(v.montoTotal)}</td>
          <td class="px-6 py-4 text-center">
            <span class="text-xs uppercase font-bold text-neutral-700 dark:text-neutral-300">${v.metodoPago}</span>
            ${badge}
          </td>
        </tr>
      `; 
    }).join(''); 
  } 
  lucide.createIcons(); 
};

window.openDetalleVenta = (id) => { 
  const v = state.ventas.find(x => x.id === id); 
  if(!v) return; 
  
  let pagosHTML = ''; 
  if(v.metodoPago.includes('Crédito') || v.metodoPago.includes('Pagaré')) { 
    pagosHTML = `
      <div class="mt-6 p-6 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-[2rem]">
        <div class="flex justify-between items-center mb-4">
          <h4 class="font-bold uppercase text-xs tracking-wider">Estado Crédito/Pagaré</h4>
          <span class="font-black text-xl text-indigo-600 dark:text-indigo-400">${v.cuotasPagadas} / ${v.cuotasTotales} Pagadas</span>
        </div>
        ${v.cuotasPagadas < v.cuotasTotales ? `
          <button onclick="registrarCuotaVenta('${v.id}')" class="w-full py-4 bg-black text-white dark:bg-white dark:text-black font-bold rounded-2xl shadow hover:scale-[1.01] transition-transform">
            Registrar Pago de 1 Cuota
          </button>
        ` : `
          <div class="text-center text-green-600 dark:text-green-400 font-bold p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
            Plan Finalizado
          </div>
        `}
      </div>
    `; 
  } 
  
  document.getElementById('venta-detail-content').innerHTML = `
    <div class="space-y-4 text-sm">
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Fecha</span>
        <span class="font-bold">${formatDate(v.fecha)}</span>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Comprador</span>
        <span class="font-bold text-right">${v.compradorNombre} <br><span class="text-xs text-neutral-400">DNI: ${v.compradorDNI}</span></span>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Teléfono</span>
        <a href="${formatWhatsAppLink(v.compradorTelefono,'Hola')}" target="_blank" class="font-bold text-green-500 hover:underline">${v.compradorTelefono}</a>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Domicilio</span>
        <span class="font-bold text-right">${v.compradorDomicilio}</span>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Vehículo</span>
        <span class="font-bold text-right">${v.autoDesc}</span>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Monto Operación</span>
        <span class="font-black text-lg">${formatMoney(v.montoTotal)}</span>
      </div>
      <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <span class="text-neutral-500">Métodos Combinados</span>
        <span class="font-bold uppercase">${v.metodoPago}</span>
      </div>
      ${v.tienePermuta ? `
        <div class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <span class="text-neutral-500">Permuta Entregada</span>
          <span class="font-bold text-right">${v.detallePermuta}</span>
        </div>
      ` : ''}
    </div>
    ${pagosHTML}
  `; 
  
  // Botón Asignar Comisión (Exclusivo Admin)
  if(state.currentUser.rol === 'Admin') {
    document.getElementById('venta-detail-content').innerHTML += `
      <div class="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <button onclick="openModalComisionPorVenta('${v.id}')" class="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow hover:bg-green-700 transition-colors">
          <i data-lucide="award" class="w-5 h-5 inline mr-2"></i>Asignar Comisión a Personal
        </button>
      </div>
    `;
  }
  
  window.openModal('modal-detalle-venta'); 
  lucide.createIcons();
};

window.registrarCuotaVenta = async (id) => { 
  const v = state.ventas.find(x => x.id === id); 
  if(v && v.cuotasPagadas < v.cuotasTotales) { 
    await window.fbUpdate("ventas", id, { cuotasPagadas: v.cuotasPagadas + 1 }); 
    window.closeModal('modal-detalle-venta'); 
  } 
};

// CAJA
window.renderCajaView = () => {
  let myTrans = state.transacciones;
  
  if(state.currentUser.rol === 'Vendedor') { 
    myTrans = myTrans.filter(t => t.userId === state.currentUser.id); 
  } else if (state.currentUser.rol === 'Encargado') { 
    myTrans = myTrans.filter(t => t.sucursalId === state.currentUser.sucursalId); 
  }

  if(state.currentUser.rol !== 'Vendedor') {
    const fc = document.getElementById('caja-filters-container'); 
    fc.classList.remove('hidden');
    
    let users = state.currentUser.rol === 'Encargado' ? state.usuarios.filter(u => u.sucursalId === state.currentUser.sucursalId) : state.usuarios;
    
    fc.innerHTML = `
      <div class="flex-1 min-w-[200px]">
        <label class="text-xs font-bold text-neutral-500 block mb-1">Filtrar por Vendedor</label>
        <select onchange="state.cajaFilterUser=this.value; renderCajaView()" class="w-full bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 outline-none">
          <option value="all">Todas las cajas permitidas</option>
          ${users.map(u => `
            <option value="${u.id}" ${state.cajaFilterUser === u.id ? 'selected' : ''}>${u.nombre}</option>
          `).join('')}
        </select>
      </div>
    `;
    
    if(state.cajaFilterUser !== 'all') { 
      myTrans = myTrans.filter(t => t.userId === state.cajaFilterUser); 
    }
  }

  if (state.currentUser.rol === 'Admin') { 
    document.getElementById('btn-ver-pendientes').classList.remove('hidden'); 
    document.getElementById('btn-ver-pendientes').classList.add('inline-flex'); 
  }

  const sorted = [...myTrans].sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
  let saldo = 0; 
  
  const transWithSaldo = sorted.map(t => { 
    if(t.estadoCobro !== 'pendiente') { 
      saldo += t.tipo === 'ingreso' ? Number(t.valor) : -Number(t.valor); 
    } 
    return { ...t, saldoDisponible: saldo }; 
  });
  
  const ing = transWithSaldo.filter(t => t.tipo === 'ingreso' && t.estadoCobro !== 'pendiente').reduce((a,c) => a + c.valor, 0); 
  const egr = transWithSaldo.filter(t => t.tipo === 'gasto').reduce((a,c) => a + c.valor, 0);

  document.getElementById('caja-stats').innerHTML = `
    <div class="relative p-6 bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
      <h3 class="text-sm font-medium text-neutral-500 mb-1">Saldo Real Disponible</h3>
      <p class="text-3xl font-black ${saldo >= 0 ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-400'}">${formatMoney(saldo)}</p>
    </div>
    <div class="relative p-6 bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
      <h3 class="text-sm font-medium text-neutral-500 mb-1">Ingresos Efectivizados</h3>
      <p class="text-3xl font-black text-green-600 dark:text-green-500">${formatMoney(ing)}</p>
    </div>
    <div class="relative p-6 bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
      <h3 class="text-sm font-medium text-neutral-500 mb-1">Egresos Registrados</h3>
      <p class="text-3xl font-black text-rose-600 dark:text-rose-400">${formatMoney(egr)}</p>
    </div>
  `;

  if (transWithSaldo.length === 0) { 
    document.getElementById('caja-table').innerHTML = `<tr><td colspan="4" class="text-center py-8 text-neutral-500 font-bold">Sin movimientos.</td></tr>`; 
  } else {
    document.getElementById('caja-table').innerHTML = transWithSaldo.slice().reverse().map(t => {
      const u = state.usuarios.find(x => x.id === t.userId); 
      const s = state.sucursales.find(x => x.id === t.sucursalId);
      
      return `
        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${t.estadoCobro === 'pendiente' ? 'opacity-50' : ''}">
          <td class="px-6 py-4">
            <div class="flex items-center space-x-4">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${t.tipo === 'ingreso' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}">
                <i data-lucide="${t.tipo === 'ingreso' ? 'trending-up' : 'trending-down'}" class="w-5 h-5"></i>
              </div>
              <div>
                <p class="text-sm font-bold flex items-center">
                  ${t.descripcion}
                  ${t.estadoCobro === 'pendiente' ? '<span class="ml-2 text-[10px] bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300 px-1 rounded">Pendiente</span>' : ''}
                </p>
                <div class="flex items-center space-x-2 mt-1">
                  <span class="text-xs text-neutral-500 uppercase">${t.categoria}</span>
                  ${t.tipoComprobante !== 'X' ? `<span class="bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300 text-[10px] font-bold px-1.5 py-0.5 rounded">Fac ${t.tipoComprobante}</span>` : ''}
                </div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <p class="text-sm font-bold">${u ? u.nombre : '-'}</p>
            <p class="text-xs text-neutral-500">${s ? s.nombre : ''}</p>
          </td>
          <td class="px-6 py-4 text-sm font-bold text-right ${t.tipo === 'ingreso' ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-400'}">
            ${t.tipo === 'ingreso' ? '+' : '-'}${formatMoney(t.valor)}
          </td>
          <td class="px-6 py-4 text-sm font-bold text-right">
            ${t.estadoCobro === 'pendiente' ? '-' : formatMoney(t.saldoDisponible)}
          </td>
        </tr>
      `;
    }).join('');
  }
  lucide.createIcons();
}

window.openModalPendientes = () => { 
  const p = state.transacciones.filter(t => t.estadoCobro === 'pendiente'); 
  
  if (p.length === 0) { 
    document.getElementById('pendientes-list-content').innerHTML = `<p class="text-center text-neutral-500 py-6 font-bold">Sin cobros pendientes.</p>`; 
  } else { 
    document.getElementById('pendientes-list-content').innerHTML = p.map(t => `
      <div class="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl mb-3">
        <div>
          <p class="font-bold text-sm text-neutral-900 dark:text-white">${t.descripcion}</p>
          <p class="text-xs text-amber-700 dark:text-amber-400 font-bold mt-1">Acreditación: ${formatDate(t.fechaAcreditacion)}</p>
        </div>
        <div class="text-right">
          <p class="font-black text-green-600 dark:text-green-500 mb-2">${formatMoney(t.valor)}</p>
          <button onclick="marcarCobrado('${t.id}')" class="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black text-xs font-bold rounded-lg hover:scale-105 transition-transform">
            Acreditado
          </button>
        </div>
      </div>
    `).join(''); 
  } 
  window.openModal('modal-pendientes'); 
};

window.marcarCobrado = async (id) => { 
  await window.fbUpdate("transacciones", id, { estadoCobro: 'disponible' }); 
  window.closeModal('modal-pendientes'); 
}

window.agregarCategoria = async () => { 
  const n = prompt('Nueva categoría (ej. Gastos Taller):'); 
  if (n && n.trim() !== '') { 
    state.categoriasGasto.push(n.trim()); 
    window.initSelects(); 
  } 
};

window.handleComprobanteChange = (val) => { 
  const c = document.getElementById('caja-iva-container'); 
  const i = document.getElementById('caja-iva'); 
  if(val === 'A') { 
    c.classList.remove('hidden'); 
    i.required = true; 
  } else { 
    c.classList.add('hidden'); 
    i.required = false; 
    i.value = ''; 
  } 
};

document.getElementById('form-caja').addEventListener('submit', async (e) => {
  e.preventDefault(); 
  
  const f = document.getElementById('caja-fecha').value; 
  const t = document.getElementById('caja-tipo').value; 
  const d = document.getElementById('caja-desc').value; 
  const c = document.getElementById('caja-cat').value; 
  const v = Number(document.getElementById('caja-monto').value); 
  const a = document.getElementById('caja-auto').value || null; 
  const compTipo = document.getElementById('caja-comprobante').value; 
  const compNum = document.getElementById('caja-comp-num').value; 
  const iva = Number(document.getElementById('caja-iva').value || 0);
  
  await window.fbAdd("transacciones", { 
    userId: state.currentUser.id, 
    sucursalId: state.currentUser.sucursalId, 
    fecha: f, 
    tipo: t, 
    descripcion: d, 
    categoria: c, 
    valor: v, 
    autoId: a, 
    tipoComprobante: compTipo, 
    numComprobante: compNum, 
    iva: iva, 
    estadoCobro: 'disponible' 
  });
  
  if(a && t === 'gasto') { 
    const auto = state.autos.find(x => x.id === a); 
    const nwGastos = [...(auto.gastos || []), { 
      id: generateId(), 
      fecha: f, 
      descripcion: d, 
      categoria: c, 
      monto: v 
    }]; 
    await window.fbUpdate("autos", a, { gastos: nwGastos }); 
  }
  
  window.closeModal('modal-caja'); 
  e.target.reset(); 
  window.initSelects();
});

window.renderFacturasView = () => { 
  if(state.currentUser?.rol !== 'Admin') return; 
  
  const facturas = state.transacciones.filter(t => ['A','B','C'].includes(t.tipoComprobante)); 
  const totalEmitido = facturas.reduce((a,c) => a + c.valor, 0); 
  const totalIva = facturas.reduce((a,c) => a + (c.iva || 0), 0); 
  
  document.getElementById('facturas-summary').innerHTML = `
    <div class="p-8 bg-black dark:bg-neutral-800 rounded-3xl text-white shadow-xl border border-neutral-800 dark:border-neutral-700">
      <p class="text-neutral-400 text-sm font-bold uppercase tracking-wider mb-2">Monto Facturado (Global)</p>
      <p class="text-5xl font-black">${formatMoney(totalEmitido)}</p>
    </div>
    <div class="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <p class="text-neutral-500 dark:text-neutral-400 text-sm font-bold uppercase tracking-wider mb-2">IVA Acumulado (Fac. A)</p>
      <p class="text-5xl font-black text-neutral-900 dark:text-white">${formatMoney(totalIva)}</p>
    </div>
  `; 
  
  const table = document.getElementById('facturas-table'); 
  
  if(facturas.length === 0) { 
    table.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-neutral-500 font-bold">No hay facturas.</td></tr>`; 
  } else { 
    table.innerHTML = facturas.slice().reverse().map(f => { 
      const u = state.usuarios.find(x => x.id === f.userId); 
      return `
        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
          <td class="px-6 py-4">
            <span class="inline-block bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200 font-bold text-[10px] uppercase px-2 py-1 rounded mb-1">
              Tipo ${f.tipoComprobante}
            </span>
            <p class="font-mono text-sm font-bold">${f.numComprobante || 'S/N'}</p>
          </td>
          <td class="px-6 py-4 text-sm text-neutral-500">${formatDate(f.fecha)}</td>
          <td class="px-6 py-4">
            <p class="font-bold">${f.descripcion}</p>
            <p class="text-xs text-neutral-400 mt-1">Por: ${u ? u.nombre : '-'}</p>
          </td>
          <td class="px-6 py-4 text-right font-black text-lg">${formatMoney(f.valor)}</td>
          <td class="px-6 py-4 text-center">
            ${f.tipoComprobante === 'A' ? `
              <button onclick="openDetalleFactura('${f.id}')" class="text-xs font-bold uppercase tracking-wider bg-black text-white dark:bg-neutral-700 px-4 py-2 rounded-xl hover:bg-neutral-800 transition-colors">
                Ver Detalle
              </button>
            ` : '<span class="text-neutral-300 dark:text-neutral-700">-</span>'}
          </td>
        </tr>
      `; 
    }).join(''); 
  } 
};

window.openDetalleFactura = (id) => { 
  const t = state.transacciones.find(x => x.id === id); 
  const subtotal = t.valor - (t.iva || 0); 
  
  document.getElementById('factura-detail-content').innerHTML = `
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-black text-white flex items-center justify-center text-3xl font-black mx-auto mb-3 rounded-2xl shadow-md border border-neutral-800">A</div>
      <p class="font-mono text-neutral-500 font-bold">${t.numComprobante}</p>
    </div>
    <div class="space-y-4 mb-8">
      <div class="flex justify-between text-sm">
        <span class="text-neutral-500 font-bold uppercase tracking-wider">Fecha:</span> 
        <span class="font-bold">${formatDate(t.fecha)}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-neutral-500 font-bold uppercase tracking-wider">Operación:</span> 
        <span class="font-bold text-right">${t.descripcion}</span>
      </div>
    </div>
    <div class="border-t border-neutral-200 dark:border-neutral-700 pt-6 space-y-3">
      <div class="flex justify-between text-sm">
        <span class="text-neutral-500 font-bold uppercase tracking-wider">Subtotal:</span> 
        <span class="font-bold text-lg">${formatMoney(subtotal)}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-neutral-500 font-bold uppercase tracking-wider">IVA:</span> 
        <span class="font-bold text-lg">${formatMoney(t.iva)}</span>
      </div>
      <div class="flex justify-between text-xl mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <span class="font-black uppercase tracking-wider">Total:</span> 
        <span class="font-black text-2xl text-green-600 dark:text-green-500">${formatMoney(t.valor)}</span>
      </div>
    </div>
  `; 
  window.openModal('modal-detalle-factura'); 
};

// ADMIN Y RESUMENES
window.renderAdminView = () => { 
  if(state.currentUser?.rol !== 'Admin') return; 
  
  const sucList = document.getElementById('admin-suc-list'); 
  if (state.sucursales.length === 0) { 
    sucList.innerHTML = '<p class="text-neutral-500 text-center py-4 font-bold">No hay sucursales.</p>'; 
  } else { 
    sucList.innerHTML = state.sucursales.map(s => `
      <div class="flex justify-between items-center p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <span class="font-bold text-sm">${s.nombre}</span>
        <div class="flex space-x-1">
          <button onclick="editSucursal('${s.id}')" class="p-2 text-neutral-500 hover:text-green-600 transition-colors">
            <i data-lucide="edit-2" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteSucursal('${s.id}')" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `).join(''); 
  } 
  
  document.getElementById('new-user-suc').innerHTML = state.sucursales.map(s => `<option value="${s.id}">${s.nombre}</option>`).join(''); 
  
  const usrList = document.getElementById('admin-users-list'); 
  if (state.usuarios.length === 0) { 
    usrList.innerHTML = '<p class="text-neutral-500 text-center py-4 font-bold">No hay usuarios.</p>'; 
  } else { 
    usrList.innerHTML = state.usuarios.map(u => { 
      const s = state.sucursales.find(x => x.id == u.sucursalId); 
      return `
        <div class="flex justify-between items-center p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <div>
            <p class="font-bold text-sm">${u.nombre}</p>
            <p class="text-[10px] font-bold text-neutral-500 mt-1 uppercase tracking-wider">
              ${u.rol} • ${s ? s.nombre : '-'} • ${u.email}
            </p>
          </div>
          <div class="flex space-x-1">
            <button onclick="editUser('${u.id}')" class="p-2 text-neutral-500 hover:text-green-600 transition-colors">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteUser('${u.id}')" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `; 
    }).join(''); 
  } 
  lucide.createIcons(); 
};

window.handleSaveSucursal = async (e) => { 
  e.preventDefault(); 
  const n = document.getElementById('new-suc-name').value; 
  if(state.editingSucursalId) { 
    await window.fbUpdate("sucursales", state.editingSucursalId, { nombre: n }); 
  } else { 
    await window.fbAdd("sucursales", { nombre: n }); 
  } 
  window.resetSucForm(); 
};

window.editSucursal = (id) => { 
  state.editingSucursalId = id; 
  document.getElementById('new-suc-name').value = state.sucursales.find(s => s.id === id).nombre; 
  document.getElementById('new-suc-cancel').classList.remove('hidden'); 
};

window.deleteSucursal = async (id) => { 
  if(confirm('¿Seguro de eliminar esta sucursal permanentemente?')) { 
    await window.fbDelete("sucursales", id); 
  } 
};

window.resetSucForm = () => { 
  state.editingSucursalId = null; 
  document.getElementById('new-suc-name').value = ''; 
  document.getElementById('new-suc-cancel').classList.add('hidden'); 
};

window.handleSaveUser = async (e) => { 
  e.preventDefault(); 
  const n = document.getElementById('new-user-name').value; 
  const em = document.getElementById('new-user-email').value; 
  const r = document.getElementById('new-user-rol').value; 
  const s = document.getElementById('new-user-suc').value; 
  const p = document.getElementById('new-user-pwd').value; 
  
  if(state.editingUserId) { 
    const d = { nombre: n, email: em, rol: r, sucursalId: s }; 
    if(p) { 
      d.password = p; 
      d.isFirstLogin = true; 
    } 
    await window.fbUpdate("usuarios", state.editingUserId, d); 
  } else { 
    await window.fbAdd("usuarios", { nombre: n, email: em, rol: r, sucursalId: s, password: p, isFirstLogin: true }); 
  } 
  window.resetUserForm(); 
};

window.editUser = (id) => { 
  state.editingUserId = id; 
  const u = state.usuarios.find(x => x.id === id); 
  document.getElementById('new-user-name').value = u.nombre; 
  document.getElementById('new-user-email').value = u.email; 
  document.getElementById('new-user-rol').value = u.rol; 
  document.getElementById('new-user-suc').value = u.sucursalId; 
  document.getElementById('new-user-pwd').required = false; 
  document.getElementById('new-user-cancel').classList.remove('hidden'); 
};

window.deleteUser = async (id) => { 
  if(id === state.currentUser.id) return alert('No puedes eliminar tu propio usuario en sesión.'); 
  if(confirm('¿Eliminar usuario del sistema?')) { 
    await window.fbDelete("usuarios", id); 
  } 
};

window.resetUserForm = () => { 
  state.editingUserId = null; 
  document.getElementById('new-user-name').value = ''; 
  document.getElementById('new-user-email').value = ''; 
  document.getElementById('new-user-pwd').value = ''; 
  document.getElementById('new-user-pwd').required = true; 
  document.getElementById('new-user-cancel').classList.add('hidden'); 
};

window.renderResumenesView = () => { 
  if(state.currentUser?.rol !== 'Admin') return; 
  
  const ing = state.transacciones.filter(t => t.tipo === 'ingreso').reduce((a,c) => a + c.valor, 0); 
  let egr = state.transacciones.filter(t => t.tipo === 'gasto').reduce((a,c) => a + c.valor, 0); 
  
  const cats = state.transacciones.filter(t => t.tipo === 'gasto').reduce((a,c) => { 
    a[c.categoria] = (a[c.categoria] || 0) + c.valor; 
    return a; 
  }, {}); 
  
  state.autos.forEach(a => { 
    a.gastos?.forEach(g => { 
      cats[g.categoria] = (cats[g.categoria] || 0) + g.monto; 
      egr += g.monto; 
    }); 
  }); 
  
  const max = Math.max(...Object.values(cats), 1); 
  
  let catHTML = ''; 
  if(Object.keys(cats).length === 0) { 
    catHTML = '<p class="text-neutral-500 py-4 font-bold">Sin datos de gastos en el periodo.</p>'; 
  } else { 
    catHTML = Object.entries(cats).sort((a,b) => b[1] - a[1]).map(([c,v]) => `
      <div class="mb-4">
        <div class="flex justify-between text-sm mb-2">
          <span class="text-neutral-600 dark:text-neutral-300 font-bold uppercase tracking-wider text-[10px]">${c}</span>
          <span class="font-black">${formatMoney(v)}</span>
        </div>
        <div class="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-3">
          <div class="bg-green-600 h-3 rounded-full" style="width: ${(v/max)*100}%"></div>
        </div>
      </div>
    `).join(''); 
  } 
  
  document.getElementById('dashboard-content').innerHTML = `
    <div class="bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 p-8 rounded-[2rem] shadow-sm">
      <h3 class="font-black text-2xl mb-8">Flujo de Fondos Operativo</h3>
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <span class="text-neutral-500 font-bold uppercase tracking-wider text-xs">Ingresos Totales</span>
          <span class="font-black text-xl text-green-600 dark:text-green-500">${formatMoney(ing)}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-neutral-500 font-bold uppercase tracking-wider text-xs">Egresos (Caja + Taller)</span>
          <span class="font-black text-xl text-rose-600 dark:text-rose-400">${formatMoney(egr)}</span>
        </div>
        <div class="pt-6 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
          <span class="font-black text-xl uppercase">Balance Neto</span>
          <span class="font-black text-3xl ${ing - egr >= 0 ? 'text-black dark:text-white' : 'text-rose-600'}">${formatMoney(ing - egr)}</span>
        </div>
      </div>
    </div>
    
    <div class="bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 p-8 rounded-[2rem] shadow-sm">
      <h3 class="font-black text-2xl mb-8">Distribución de Gastos</h3>
      ${catHTML}
    </div>
  `; 
};

window.initSelects = () => { 
  document.getElementById('caja-cat').innerHTML = state.categoriasGasto.map(c => `<option value="${c}">${c}</option>`).join(''); 
  document.getElementById('auto-sucursal').innerHTML = state.sucursales.map(s => `<option value="${s.id}">${s.nombre}</option>`).join(''); 
  document.getElementById('caja-auto').innerHTML = `<option value="">-- Gasto General de Agencia --</option>` + state.autos.map(a => `<option value="${a.id}">${a.marca} ${a.modelo} (${a.patente})</option>`).join(''); 
  document.getElementById('caja-fecha').value = new Date().toISOString().split('T')[0]; 
};
  </script>
