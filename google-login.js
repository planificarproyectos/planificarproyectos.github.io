/* "Continuar con Google", compartido por Planificar Proyectos Apps, Mind Focus, PowerFit, Lumen y Proyecta.
   - Cada app pone el botón con GoogleLogin.boton() en su pantalla de inicio de sesión y, al iniciar Firebase, llama a
     GoogleLogin.usar(auth, mostrarMensaje). La sesión resultante es la misma que con correo: onAuthStateChanged de cada
     app hace el resto (acceso, registro en el panel, Proyecta pendiente de aprobación).
   - En computador se abre una ventana de Google (popup). En iPhone y en las apps instaladas se usa redirección, porque
     ahí las ventanas emergentes no regresan; para que la redirección funcione en Safari, el ayudante de Firebase está
     alojado en este mismo dominio (/__/auth/) y authDomain apunta a www.planificarproyectos.com.
   - Si el correo de Google ya tiene cuenta con contraseña, Firebase lo avisa y se pide entrar con la contraseña. */
(function(){
  var G={auth:null,mostrar:null};
  function ios(){ return /iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1); }
  function instalada(){ return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true; }
  var LOGO='<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  G.boton=function(txt){ return '<button type="button" class="g-btn" data-google>'+LOGO+'<span>'+(txt||'Continuar con Google')+'</span></button><div class="g-or" aria-hidden="true"><span>o con tu correo</span></div>'; };
  G.error=function(e){ var c=(e&&e.code)||'';
    if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request'||c==='auth/user-cancelled') return '';
    if(c==='auth/account-exists-with-different-credential') return 'Ese correo ya tiene una cuenta con contraseña. Entra con tu correo y contraseña.';
    if(c==='auth/operation-not-allowed') return 'El inicio con Google aún no está activado. Entra con tu correo.';
    if(c==='auth/unauthorized-domain') return 'Este sitio aún no está autorizado para entrar con Google.';
    if(c==='auth/network-request-failed') return 'Sin conexión. Revisa tu internet.';
    if(c==='auth/too-many-requests') return 'Demasiados intentos. Espera un momento.';
    return 'No se pudo entrar con Google'+(c?' ('+c.replace('auth/','')+')':'')+'.'; };
  G.entrar=function(){ var a=G.auth; if(!a) return Promise.reject({code:'sin-auth'});
    var p=new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt:'select_account'});
    if(ios()||instalada()) return a.signInWithRedirect(p);
    return a.signInWithPopup(p).catch(function(e){ var c=(e&&e.code)||'';
      if(c==='auth/popup-blocked'||c==='auth/operation-not-supported-in-this-environment'||c==='auth/web-storage-unsupported') return a.signInWithRedirect(p);
      throw e; }); };
  // Llamar una vez al iniciar Firebase: guarda auth y muestra el error si se volvió de Google por redirección sin éxito
  // Sin mostrar propio, el mensaje va al párrafo #aMsg que tienen las pantallas de inicio de sesión de todas las apps
  function aMsg(t){ var m=document.getElementById('aMsg'); if(m){ m.textContent=t; } }
  G.usar=function(auth,mostrar){ G.auth=auth; G.mostrar=mostrar||aMsg;
    try{ auth.getRedirectResult().catch(function(e){ var m=G.error(e); if(m&&G.mostrar) G.mostrar(m); }); }catch(e){} };
  document.addEventListener('click',function(ev){ var b=ev.target.closest&&ev.target.closest('[data-google]'); if(!b) return; ev.preventDefault();
    if(!G.auth){ if(G.mostrar) G.mostrar('Sin conexión. Revisa tu internet.'); return; }
    b.disabled=true; G.entrar().then(function(){ b.disabled=false; },function(e){ b.disabled=false; var m=G.error(e); if(m&&G.mostrar) G.mostrar(m); }); });
  // Pantallas escritas en HTML: un <div data-google-slot></div> recibe el botón. Las que se arman en JS usan G.boton()
  function llenar(){ Array.prototype.forEach.call(document.querySelectorAll('[data-google-slot]'),function(s){ if(!s.firstChild) s.innerHTML=G.boton(); }); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',llenar); else llenar();
  var css=document.createElement('style');
  css.textContent='.g-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:46px;padding:10px 14px;border-radius:14px;border:1px solid #dadce0;background:#fff;color:#1f1f1f;font:inherit;font-weight:600;font-size:15px;cursor:pointer;margin:0}'
    +'.g-btn svg{width:20px;height:20px;flex:none}.g-btn:hover{background:#f7f8f8}.g-btn[disabled]{opacity:.6;cursor:wait}'
    +'.g-btn:focus-visible{outline:2px solid #4285F4;outline-offset:2px}'
    +'.g-or{display:flex;align-items:center;gap:10px;margin:12px 0;font-size:12px;opacity:.7}.g-or::before,.g-or::after{content:"";flex:1;height:1px;background:currentColor;opacity:.25}';
  document.head.appendChild(css);
  window.GoogleLogin=G;
})();
