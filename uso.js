/* Medición de uso compartida por Proyecta, Lumen, Mind Focus y PowerFit, para el dashboard de Wellness Apps.
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
      comparar:'Comparador abierto',informe:'Informes generados',excel:'Exportaciones a Excel',compartir:'Proyectos compartidos'}};
  var APPS={mindfocus:'Mind Focus',powerfit:'PowerFit',lumen:'Lumen',proyecta:'Proyecta'};
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
    U.db=db; U.uid=user.uid; U.email=String(user.email||'').toLowerCase(); U.app=app; U.dia=null; U.pend=0; sesion(); };
  U.stop=function(){ flush(); U.db=null; U.uid=null; U.dia=null; };
  U.ev=function(nombre,n){ if(!U.uid||!U.app||!(EVENTOS[U.app]||{})[nombre]) return; var ev={}, ed={}; ev[nombre]=inc(n); ed[hoy()]={}; ed[hoy()][nombre]=inc(n);
    put(cuando({ultimoUso:Date.now(),ev:ev,evDia:ed})); };
  // Minutos de uso: uno por cada minuto con la app visible; se guardan cada 5 o al ocultarla
  setInterval(function(){ if(U.uid&&document.visibilityState==='visible'){ U.pend++; if(U.pend>=5) flush(); } },60000);
  // Si la app queda abierta y se vuelve a usar otro día, cuenta una sesión nueva
  document.addEventListener('visibilitychange',function(){ if(!U.uid) return; if(document.visibilityState==='visible') sesion(); else flush(); });
  window.addEventListener('pagehide',flush);
  window.Uso=U;
})();
