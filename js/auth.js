// ==========================================
// js/auth.js
// ==========================================

window.handleLogin = async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pwd = document.getElementById('login-pwd').value;
  const btnText = document.getElementById('login-btn-text');
  const errorDiv = document.getElementById('login-error');

  if (!email || !pwd) return;

  // Estado de carga en el botón
  if (btnText) {
    btnText.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>';
  }
  if (errorDiv) {
    errorDiv.classList.add('hidden');
  }
  if (window.lucide) window.lucide.createIcons();

  try {
    // Buscar usuario en Firebase
    const usersRef = window.collection(window.db, "usuarios");
    const snapshot = await window.getDocs(usersRef);
    let validUser = null;

    snapshot.forEach(doc => {
      const u = doc.data();
      if (u.email && u.email.toLowerCase() === email && u.password === pwd) {
        validUser = { id: doc.id, ...u };
      }
    });

    if (validUser) {
      window.state.currentUser = validUser;
      localStorage.setItem('rivas_session', JSON.stringify(validUser));
      
      // Lanzar el sistema
      window.launchApp();
    } else {
      if (errorDiv) {
        errorDiv.innerText = "Credenciales incorrectas. Intente nuevamente.";
        errorDiv.classList.remove('hidden');
      }
    }
  } catch (error) {
    console.error("Error en login:", error);
    if (errorDiv) {
      errorDiv.innerText = "Error de conexión con la base de datos.";
      errorDiv.classList.remove('hidden');
    }
  } finally {
    if (btnText) {
      btnText.innerText = "Ingresar al Sistema";
    }
  }
};

window.updateProfileUI = () => {
  const u = window.state.currentUser;
  if (!u) return;

  const nameDisplay = document.getElementById('user-name-display');
  const roleDisplay = document.getElementById('user-role-display');
  const initialDisplay = document.getElementById('user-initial');
  const adminMenu = document.getElementById('admin-menu');

  if (nameDisplay) nameDisplay.innerText = u.nombre || 'Usuario';
  if (roleDisplay) roleDisplay.innerText = u.rol || 'Vendedor';
  if (initialDisplay) initialDisplay.innerText = String(u.nombre || 'U').charAt(0).toUpperCase();

  // Mostrar menú de administración solo si el rol es Admin
  if (adminMenu) {
    if (u.rol === 'Admin') {
      adminMenu.classList.remove('hidden');
    } else {
      adminMenu.classList.add('hidden');
    }
  }
};

window.showLogin = () => {
  // 1. Ocultar Loader
  const loader = document.getElementById('app-loader');
  if (loader) loader.classList.add('hidden');
  
  // 2. Ocultar App
  const appWrapper = document.getElementById('app-wrapper');
  if (appWrapper) appWrapper.classList.add('hidden');
  
  // 3. Mostrar Vista de Login
  const authView = document.getElementById('auth-view');
  if (authView) authView.classList.remove('hidden');
};

window.launchApp = () => {
  // 1. Ocultar Loader
  const loader = document.getElementById('app-loader');
  if (loader) loader.classList.add('hidden');
  
  // 2. Ocultar Vista de Login
  const authView = document.getElementById('auth-view');
  if (authView) authView.classList.add('hidden');
  
  // 3. Mostrar App
  const appWrapper = document.getElementById('app-wrapper');
  if (appWrapper) appWrapper.classList.remove('hidden');

  // 4. Actualizar la UI del perfil lateral
  window.updateProfileUI();
  
  // 5. Forzar el renderizado completo de las vistas
  if (window.renderAllViews) {
    window.renderAllViews();
  }
  
  // 6. Ir a la pestaña de Flota por defecto
  if (window.switchTab) {
    window.switchTab('flota');
  }
};

window.handleLogout = () => {
  if (confirm('¿Estás seguro que deseas cerrar la sesión?')) {
    window.state.currentUser = null;
    localStorage.removeItem('rivas_session');
    
    // Limpiar campos del formulario de login por seguridad
    const emailInput = document.getElementById('login-email');
    const pwdInput = document.getElementById('login-pwd');
    if (emailInput) emailInput.value = '';
    if (pwdInput) pwdInput.value = '';
    
    window.showLogin();
  }
};

// Asignar el evento submit al formulario de login cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', window.handleLogin);
  }
});
