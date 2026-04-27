// ==========================================
// js/auth.js
// ==========================================

window.handleLogin = (e) => { 
  e.preventDefault(); 
  const em = document.getElementById('login-email').value.toLowerCase(); 
  const pw = document.getElementById('login-pwd').value; 
  const err = document.getElementById('login-error'); 
  
  const u = window.state.usuarios.find(x => x.email.toLowerCase() === em && x.password === pw); 
  
  if(u) { 
    err.classList.add('hidden'); 
    window.state.currentUser = u; 
    
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
    window.state.currentUser.password = p1; 
    window.state.currentUser.isFirstLogin = false; 
    
    // Guarda la nueva contraseña en Firebase
    await window.fbUpdate("usuarios", window.state.currentUser.id, { password: p1, isFirstLogin: false }); 
    window.launchApp(); 
  } 
};

window.launchApp = () => { 
  document.getElementById('auth-wrapper').classList.add('hidden'); 
  document.getElementById('app-wrapper').classList.remove('hidden'); 
  
  // Guardamos un token en el almacenamiento local para no tener que iniciar sesión si refrescamos la pestaña
  localStorage.setItem('erp_session', window.state.currentUser.id); 
  
  document.getElementById('user-name').innerText = window.state.currentUser.nombre; 
  document.getElementById('user-role').innerText = window.state.currentUser.rol; 
  document.getElementById('user-avatar').innerText = window.state.currentUser.nombre.charAt(0).toUpperCase(); 
  
  window.state.cajaFilterUser = 'all'; 
  
  // Arrancamos el pintado de pantallas
  if (window.initSelects) window.initSelects(); 
  if (window.renderAllViews) window.renderAllViews(); 
  
  window.switchTab('autos'); 
};

window.logout = () => { 
  window.state.currentUser = null; 
  localStorage.removeItem('erp_session'); 
  
  document.getElementById('app-wrapper').classList.add('hidden'); 
  document.getElementById('auth-wrapper').classList.remove('hidden'); 
  document.getElementById('login-form').classList.remove('hidden'); 
  document.getElementById('pwd-change-form').classList.add('hidden'); 
  document.getElementById('auth-title').innerText = "Iniciar Sesión"; 
  
  document.getElementById('login-form').reset(); 
  document.getElementById('pwd-change-form').reset(); 
};
