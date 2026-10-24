/* Medición de uso compartida por Proyecta, Lumen, Mind Focus y PowerFit, para el dashboard de Planificar Proyectos Apps.
   - Solo cuenta cuántas veces y cuándo se usa cada cosa; nunca guarda el contenido de lo que la persona hace.
   - Se guarda en stats/{uid} (el mismo documento que ya usaba Mind Focus), dentro de apps.{app}:
       sesiones, ultimoUso,
       dias:{'YYYY-MM-DD':sesiones},
       ev:{evento:n}                         total por función
       evDia:{'YYYY-MM-DD':{evento:n}}       funciones por día, para ver tendencias
       horas:{'0'..'23':n}                   actividad (sesiones y funciones) por hora del día, hora local
       semana:{'0'..'6':n}                   actividad por día de la semana (0 = domingo)
       min, minDia:{'YYYY-MM-DD':n}          minutos con la app abierta y en primer plano
     y además ultimoUso y email en la raíz del documento, para saber quién usó qué y cuándo.
   - Uso.start(db, user, 'mindfocus') al iniciar sesión cuenta una sesión (y otra si la app sigue abierta al día siguiente).
   - Uso.ev('registro') cuenta un uso de una función. Los nombres válidos están en Uso.EVENTOS, que el dashboard
     también usa para mostrar el nombre de cada función.
   - Los minutos se acumulan mientras la app está visible y se guardan cada 5 minutos o al salir, para no escribir
     en cada minuto.
   - Si no hay sesión o falla la red, no hace nada y no molesta a la persona. */
(function(){
  var EVENTOS={
    mindfocus:{registro:'Registros guardados',cronometro:'Registros con cronómetro',manual:'Registros manuales',pomodoro:'Pomodoros',
      sueno:'Sueño registrado',favorito:'Favoritos guardados',analisis:'Análisis abierto',csv:'Exportaciones CSV'},
    powerfit:{entreno_iniciado:'Entrenos iniciados',entreno_terminado:'Entrenos terminados',rutina_creada:'Rutinas creadas',
      ejercicio_visto:'Ejercicios consultados',progreso:'Progreso abierto'},
    lumen:{misa:'Lecturas de la Misa',rosario:'Rosarios rezados',oracion:'Oraciones marcadas',biblia:'Capítulos de la Biblia',
      compartir:'Imágenes compartidas',plan:'Días de planes de lectura',voz:'Lecturas en voz alta',recordatorio:'Recordatorios creados'},
    proyecta:{proyecto_creado:'Proyectos creados',asistente:'Proyectos con el asistente',version:'Versiones guardadas',
      comparar:'Comparador abierto',informe:'Informes generados',excel:'Exportaciones a Excel',compartir:'Proyectos compartidos'},
    cotizador:{guardar:'Cotizaciones guardadas',pdf:'PDF de cotización',carpeta:'Carpetas completas',cobro:'Cuentas de cobro'}};
  var APPS={mindfocus:'Mind Focus',powerfit:'PowerFit',lumen:'Lumen',proyecta:'Proyecta',cotizador:'Cotizador'};
  function hoy(){ var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  var U={EVENTOS:EVENTOS, APPS:APPS, db:null, uid:null, email:'', app:null, dia:null, pend:0};
  function inc(n){ return firebase.firestore.FieldValue.increment(n||1); }
  function put(app){ if(!U.db||!U.uid) return; var o={}; o[U.app]=app;
    U.db.collection('stats').doc(U.uid).set({email:U.email,ultimoUso:Date.now(),apps:o},{merge:true}).catch(function(){}); }
  // Hora y día de la semana de esta actividad, para ver cuándo se usa cada app
  function cuando(o){ var t=new Date(), h={}, s={}; h[t.getHours()]=inc(1); s[t.getDay()]=inc(1); o.horas=h; o.semana=s; return o; }
  function sesion(){ var d=hoy(); if(U.dia===d) return; U.dia=d; var dias={}; dias[d]=inc(1); put(cuando({sesiones:inc(1),ultimoUso:Date.now(),dias:dias})); }
  function flush(){ if(!U.pend||!U.uid) return; var n=U.pend, md={}; U.pend=0; md[hoy()]=inc(n); put({min:inc(n),minDia:md}); }
  U.start=function(db,user,app){ if(!db||!user||!window.firebase||!firebase.firestore) return;
    U.db=db; U.uid=user.uid; U.email=String(user.email||'').toLowerCase(); U.app=app; U.dia=null; U.pend=0; sesion(); vigilar();
    U.esAdmin(db,user).then(function(a){ U.adm=a; pintarCuenta(); arco(); }); };
  /* Etiqueta del tipo de cuenta (familiar, empresarial, mixto o administrador) en la sección Cuenta de cada app:
     cualquier elemento con el atributo data-cuenta-tipo la recibe, también si la app lo vuelve a dibujar. Se actualiza en vivo. */
  U.cuenta=null; U.adm=false;
  U.setCuenta=function(d,adm){ U.cuenta=d||{}; if(adm!=null) U.adm=adm; pintarCuenta(); arco(); };
  // Administrador: la primera vez queda con el arcoíris elegido (luego puede cambiarlo en el selector de color, como cualquiera)
  function arco(){ if(!U.adm||!window.Apariencia||!Apariencia.set) return; try{ if(localStorage.getItem('pp:rbInit')) return; localStorage.setItem('pp:rbInit','1'); }catch(e){ return; }
    setTimeout(function(){ if(!(Apariencia.real&&Apariencia.real.rb)) Apariencia.set({rb:true}); },1500); }
  function etiqueta(){ if(U.adm) return ['Administrador','adm'];
    var d=U.cuenta; if(!d) return null; var t=U.tipoDe(d), e=String(d.empresa||'').trim();
    return [(t==='familiar'?'Cuenta familiar':t==='empresarial'?'Cuenta empresarial':'Cuenta empresarial y familiar')+(e&&t!=='familiar'?' · '+e:''),t]; }
  function pintarCuenta(){ var et=etiqueta(); Array.prototype.forEach.call(document.querySelectorAll('[data-cuenta-tipo]'),function(el){
      if(!et){ el.hidden=true; return; } el.hidden=false; el.className='cta-pill cta-'+et[1]; if(el.textContent!==et[0]) el.textContent=et[0]; }); }
  (function(){ var st=document.createElement('style');
    st.textContent='.cta-pill{display:inline-block;width:fit-content;max-width:100%;font-size:.74rem;font-weight:700;padding:.2rem .6rem;border-radius:99px;line-height:1.35;margin-top:4px;white-space:normal}'
      +'.cta-familiar{background:rgba(59,158,224,.16);color:#3B9EE0}.cta-empresarial{background:rgba(120,170,20,.18);color:#7DB51A}'
      +'.cta-mixto{background:rgba(155,107,232,.18);color:#A47BEA}.cta-adm{background:rgba(255,190,40,.18);color:#E0A21A}';
    (document.head||document.documentElement).appendChild(st);
    var pend=false; new MutationObserver(function(){ if(pend) return; pend=true; setTimeout(function(){ pend=false;
      if(document.querySelector('[data-cuenta-tipo]:empty')) pintarCuenta(); },0); }).observe(document.documentElement,{childList:true,subtree:true}); })();
  U.stop=function(){ flush(); if(U.unsubA){ U.unsubA(); U.unsubA=null; } U.db=null; U.uid=null; U.dia=null; };
  /* Acceso en vivo: si desde el panel de Planificar Proyectos Apps el administrador revoca la cuenta o le quita esta app
     (invitaciones/{correo}.apps.{app} = false), la app se recarga y muestra que no tiene acceso. Proyecta vigila su
     propia aprobación, así que aquí no se incluye. */
  function vigilar(){ if(U.unsubA){ U.unsubA(); U.unsubA=null; } if(!U.email) return; var app=U.app;
    U.unsubA=U.db.collection('invitaciones').doc(U.email).onSnapshot(function(sn){ var d=sn.exists?sn.data():null; U.setCuenta(d||{});
      if(app!=='proyecta'&&d&&!d.admin&&(d.estado==='revocado'||(d.apps&&d.apps[app]===false))) location.reload(); },function(){}); }
  U.ev=function(nombre,n){ if(!U.uid||!U.app||!(EVENTOS[U.app]||{})[nombre]) return; var ev={}, ed={}; ev[nombre]=inc(n); ed[hoy()]={}; ed[hoy()][nombre]=inc(n);
    put(cuando({ultimoUso:Date.now(),ev:ev,evDia:ed})); };
  // Minutos de uso: uno por cada minuto con la app visible; se guardan cada 5 o al ocultarla
  setInterval(function(){ if(U.uid&&document.visibilityState==='visible'){ U.pend++; if(U.pend>=5) flush(); } },60000);
  // Si la app queda abierta y se vuelve a usar otro día, cuenta una sesión nueva
  document.addEventListener('visibilitychange',function(){ if(!U.uid) return; if(document.visibilityState==='visible') sesion(); else flush(); });
  window.addEventListener('pagehide',flush);
  /* Administradores: la cuenta principal (ROOT) y las que ella u otro administrador marquen en el panel, guardadas en
     admins/{uid}. Las reglas de Firestore usan la misma lista. U.esAdmin(db,user) responde con una promesa true/false. */
  /* Tipos de cuenta (los asigna el administrador en el panel; invitaciones/{correo}.tipo y .empresa):
     familiar = Mind Focus, PowerFit, Lumen (marca Wellness Apps); empresarial = apps para empresas (Proyecta y las que
     se agreguen a U.EMP); mixto = todas (marca Planificar Proyectos Apps). Sin tipo guardado: mixto si tiene Proyecta aprobado. */
  U.FAM=['mindfocus','powerfit','lumen']; U.EMP=['proyecta','cotizador'];
  // Apps empresariales exclusivas de una empresa (además del tipo de cuenta): el Cotizador es solo de Planificar Proyectos SAS
  U.PP_EMP='planificar-proyectos-sas'; U.SOLO={cotizador:U.PP_EMP};
  U.TIPOS={familiar:'Familiar',empresarial:'Empresarial',mixto:'Empresarial y familiar'};
  U.tipoDe=function(i){ return i&&U.TIPOS[i.tipo]?i.tipo:(i&&i.proyecta==='aprobado'?'mixto':'familiar'); };
  U.appsDeTipo=function(t){ return t==='familiar'?U.FAM:t==='empresarial'?U.EMP:U.FAM.concat(U.EMP); };
  U.marcaDe=function(t){ return t==='familiar'?'w':'pp'; };
  // Datos que se guardan al asignar un tipo: abre las apps del tipo y cierra las demás (Proyecta usa su aprobación)
  U.accesoTipo=function(t){ var on=U.appsDeTipo(t),d={tipo:t,apps:{}};
    U.FAM.concat(U.EMP).forEach(function(a){ if(a==='proyecta'){ d.proyecta=on.indexOf(a)>=0?'aprobado':'denegado'; d.proyectaRes=Date.now(); } else d.apps[a]=on.indexOf(a)>=0; });
    return d; };
  U.ROOT='AQaEMcKNYfWEhcHVdc8N0ghxeZk1';
  U.esAdmin=function(db,user){ if(!user) return Promise.resolve(false); if(user.uid===U.ROOT) return Promise.resolve(true);
    try{ return db.collection('admins').doc(user.uid).get().then(function(sn){ return sn.exists; },function(){ return false; }); }catch(e){ return Promise.resolve(false); } };
  /* Sesión que no se borre: se pide al navegador guardar los datos de forma permanente. En iPhone (Safari y apps
     agregadas a la pantalla de inicio) los datos de una página, incluida la sesión de Firebase, se pueden borrar si
     no se usan por unos días o falta espacio; con este permiso el sistema los conserva. No muestra ningún aviso. */
  try{ if(navigator.storage&&navigator.storage.persist) navigator.storage.persisted().then(function(p){ if(!p) return navigator.storage.persist(); }).catch(function(){}); }catch(e){}
  window.Uso=U;
})();
