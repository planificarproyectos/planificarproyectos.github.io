/* Dashboard de administración de Wellness Apps. Solo aparece con la cuenta administradora (ADMIN_UID); para cualquier
   otra persona el hub queda igual.
   - Lee solo dos colecciones: invitaciones (acceso de cada cuenta) y stats (conteos de uso que guarda /uso.js en cada
     app). Nunca lee el contenido de las personas (registros, entrenos, proyectos…).
   - Mind Focus guardaba antes sus conteos en la raíz de stats/{uid} (sesiones, dias, registros, cronometro, manual,
     analisis, csv): se suman a sus métricas.
   - Gráficas: personas activas, sesiones y minutos por día, horario de uso (hora y día de la semana), funciones en
     detalle con su tendencia, comparación entre apps, crecimiento de cuentas y el detalle de cada persona.
   - Acciones: invitar, revocar o reactivar el acceso, aprobar o denegar Proyecta (también con el interruptor de cada cuenta) y eliminar los datos de una cuenta.
     La cuenta de inicio de sesión solo se puede borrar en la consola de Firebase (desde la web no hay permisos). */
(function(){
  var ADMIN_UID='AQaEMcKNYfWEhcHVdc8N0ghxeZk1';
  var APPS=(window.Uso&&Uso.APPS)||{mindfocus:'Mind Focus',powerfit:'PowerFit',lumen:'Lumen',proyecta:'Proyecta'};
  var EVENTOS=(window.Uso&&Uso.EVENTOS)||{};
  // Acceso por app (sin dato = con acceso; Proyecta usa su aprobación)
  var APP_ORD=['mindfocus','powerfit','lumen','proyecta'];
  function appOn(i){var ap=(i&&i.apps)||{},o={};APP_ORD.forEach(function(a){o[a]=a==='proyecta'?(i&&i.proyecta)==='aprobado':ap[a]!==false});return o}
  var DIA=864e5, SUBS=['entradas','config','powerfit','lumen','proyecta','perfil'];
  var S={db:null,me:null,inv:[],stats:{},users:[],upd:0,app:'mindfocus',q:'',sure:'',del:null,delOut:null,invMsg:null,busy:false,err:'',ver:null,verFoco:false};
  var $=function(id){return document.getElementById(id)};
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function nf(n){return (+n||0).toLocaleString('es-CO')}
  function ymd(t){var d=new Date(t);return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
  function fecha(t){return t?new Date(t).toLocaleDateString('es-CO',{day:'numeric',month:'short',year:'numeric'}):'—'}
  function hace(t){if(!t)return 'nunca';var m=Math.round((Date.now()-t)/6e4);if(m<2)return 'ahora';if(m<60)return 'hace '+m+' min';var h=Math.round(m/60);if(h<24)return 'hace '+h+' h';var d=Math.round(h/24);return d<31?'hace '+d+' d':fecha(t)}
  function sum(o){var s=0;for(var k in o)s+=+o[k]||0;return s}
  function lastDay(dias){var k=Object.keys(dias||{}).filter(function(x){return dias[x]>0}).sort();return k.length?Date.parse(k[k.length-1]+'T12:00:00'):0}

  /* Métricas de una app para una cuenta: {sesiones, ultimoUso, dias, ev, evDia, horas, semana, min, minDia}.
     En Mind Focus se suman los conteos antiguos (y registrosDia alimenta la tendencia diaria de "registro") */
  function appData(st,app){st=st||{};var a=(st.apps&&st.apps[app])||{},cp=function(o){return Object.assign({},o||{})},
      r={sesiones:+a.sesiones||0,ultimoUso:+a.ultimoUso||0,dias:cp(a.dias),ev:cp(a.ev),evDia:{},horas:cp(a.horas),semana:cp(a.semana),min:+a.min||0,minDia:cp(a.minDia)};
    for(var k in (a.evDia||{}))r.evDia[k]=cp(a.evDia[k]);
    if(app==='mindfocus'){r.sesiones+=+st.sesiones||0;
      for(var d in (st.dias||{}))r.dias[d]=(r.dias[d]||0)+(+st.dias[d]||0);
      [['registros','registro'],['cronometro','cronometro'],['manual','manual'],['analisis','analisis'],['csv','csv']].forEach(function(p){if(st[p[0]])r.ev[p[1]]=(r.ev[p[1]]||0)+(+st[p[0]]||0)});
      for(var f in (st.registrosDia||{})){var e=r.evDia[f]||(r.evDia[f]={});e.registro=(+e.registro||0)+(+st.registrosDia[f]||0)}
      if(!r.ultimoUso)r.ultimoUso=lastDay(st.dias)}
    return r}

  /* ---------- Gráficas (un solo color, el de énfasis, porque todas muestran cantidades) ----------
     Cada barra lleva su valor exacto en data-tip: se ve al pasar el mouse, al tocarla o al llegar con el teclado. */
  var SEM=['dom','lun','mar','mié','jue','vie','sáb'],SEML=['domingos','lunes','martes','miércoles','jueves','viernes','sábados'],SEMD=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],ORD=[1,2,3,4,5,6,0];
  function hora12(h){h=+h;return h===0?'12 a. m.':h<12?h+' a. m.':h===12?'12 m.':(h-12)+' p. m.'}
  function ult(n){var a=[],now=Date.now();for(var i=n-1;i>=0;i--)a.push(ymd(now-i*DIA));return a}
  function corta(k){return new Date(Date.parse(k+'T12:00:00')).toLocaleDateString('es-CO',{day:'numeric',month:'short'})}
  // items: [{v, t: texto del valor}]; o.x: etiquetas del eje inferior (se reparten a lo ancho); o.max: escala fija (para comparar gráficas)
  function barras(items,o){o=o||{};var mx=o.max||Math.max.apply(null,items.map(function(i){return +i.v||0}).concat([1]));
    return '<div class="vb'+(o.cls?' '+o.cls:'')+'" role="group" aria-label="'+esc(o.aria||'')+'" style="height:'+(o.h||110)+'px">'+items.map(function(it){var v=+it.v||0;
      return '<span class="c" tabindex="0" data-tip="'+esc(it.t)+'" aria-label="'+esc(it.t)+'"><i'+(v?'':' class="z"')+' style="height:'+(v?Math.max(4,v/mx*100):2)+'%"></i></span>'}).join('')+'</div>'
      +(o.x?'<div class="vb-x">'+o.x.map(function(l){return '<span>'+esc(l)+'</span>'}).join('')+'</div>':'')}
  function spark(vals){var mx=Math.max.apply(null,vals.concat([1])),n=vals.length,pts=vals.map(function(v,i){return (i/(n-1)*100).toFixed(1)+','+(17-(v/mx)*15).toFixed(1)}).join(' ');
    return '<svg class="spark" viewBox="0 0 100 18" preserveAspectRatio="none" aria-hidden="true"><polyline points="'+pts+'"/></svg>'}
  function dias30x(d){return [corta(d[0]),corta(d[14]),'Hoy']}
  var NUEVO='Se empieza a medir desde esta versión; vuelve en unos días para ver la tendencia.';
  // Actividad de una app para el ranking (en Mind Focus cronómetro y manual ya están dentro de "registro")
  function actividad(d,app){var t=0;for(var k in d.ev)if(!(app==='mindfocus'&&(k==='cronometro'||k==='manual')))t+=+d.ev[k]||0;return t}
  function usaApp(d){return d.sesiones>0||sum(d.ev)>0||Object.keys(d.dias).length>0}

  // Une invitaciones y stats en una lista de cuentas
  function armar(){var byUid={},byEm={},out=[];
    S.inv.forEach(function(i){var u={id:i.id,email:(i.email||i.id||'').toLowerCase(),inv:i,uid:i.uid||'',st:null};out.push(u);if(u.uid)byUid[u.uid]=u;byEm[u.email]=u});
    Object.keys(S.stats).forEach(function(uid){var st=S.stats[uid],em=String(st.email||'').toLowerCase(),u=byUid[uid]||byEm[em];
      if(!u){u={id:em||uid,email:em||uid,inv:null,uid:uid,st:null};out.push(u)}u.st=st;if(!u.uid)u.uid=uid});
    out.forEach(function(u){u.apps={};var last=Math.max(+(u.inv&&u.inv.ultimoUso)||0,+(u.st&&u.st.ultimoUso)||0);
      Object.keys(APPS).forEach(function(a){var d=appData(u.st,a);u.apps[a]=d;if(d.ultimoUso>last)last=d.ultimoUso});
      u.last=last;u.admin=u.uid===ADMIN_UID||!!(u.inv&&u.inv.admin);u.estado=(u.inv&&u.inv.estado)||'sin registro'});
    out.sort(function(a,b){return b.last-a.last});S.users=out}

  function cargar(){if(!S.db||S.busy)return;S.busy=true;S.err='';pintar();
    Promise.all([S.db.collection('invitaciones').get(),S.db.collection('stats').get()]).then(function(r){
      S.inv=r[0].docs.map(function(d){var x=d.data();x.id=d.id;return x});S.stats={};r[1].docs.forEach(function(d){S.stats[d.id]=d.data()});
      armar();S.upd=Date.now()}).catch(function(e){S.err='No se pudieron cargar los datos ('+(e.code||e.message)+').'}).then(function(){S.busy=false;pintar()})}

  /* ---------- Secciones ---------- */
  function kpi(v,l){return '<div class="kpi"><b>'+v+'</b><span>'+l+'</span></div>'}
  function resumen(){var now=Date.now(),U=S.users.filter(function(u){return u.inv}),ses=0;
    S.users.forEach(function(u){for(var a in u.apps)ses+=u.apps[a].sesiones});
    return '<section class="card wide"><h3>Resumen <span>general</span></h3><p class="sub">Todas las cuentas de Wellness Apps.</p><div class="kpis">'
      +kpi(nf(U.length),'Cuentas registradas')+kpi(nf(U.filter(function(u){return u.estado==='activo'}).length),'Activas')
      +kpi(nf(U.filter(function(u){return u.estado==='revocado'}).length),'Revocadas')+kpi(nf(U.filter(function(u){return u.inv.proyecta==='pendiente'}).length),'Pendientes de Proyecta')
      +kpi(nf(S.users.filter(function(u){return u.last>now-7*DIA}).length),'Usaron alguna app (7 días)')+kpi(nf(S.users.filter(function(u){return u.last>now-30*DIA}).length),'Usaron alguna app (30 días)')
      +kpi(nf(ses),'Sesiones en total')+'</div></section>'}

  function porApp(){var a=S.app,now=Date.now(),us=S.users.filter(function(u){return usaApp(u.apps[a])}),D=ult(30);
    var h='<section class="card wide"><h3>Por <span>aplicación</span></h3><p class="sub">Uso de cada app. Solo se cuentan veces y minutos; nunca se lee lo que cada persona registra.</p><div class="chips" role="group" aria-label="Aplicación">'
      +Object.keys(APPS).map(function(k){return '<button class="chip" type="button" data-adm="app" data-k="'+k+'" aria-pressed="'+(k===a)+'">'+esc(APPS[k])+'</button>'}).join('')+'</div>';
    if(!us.length)return h+'<div class="empty">Aún no hay datos de uso de '+esc(APPS[a])+'. '+NUEVO+'</div></section>';
    // Sumas de todas las personas que usan la app
    var ses=0,ev={},horas={},semana={},minT=0,minD={},sesD={},evD={},conMin=0,quien={};
    us.forEach(function(u){var d=u.apps[a];ses+=d.sesiones;minT+=d.min;if(d.min>0)conMin++;
      for(var k in d.ev){ev[k]=(ev[k]||0)+(+d.ev[k]||0);if(d.ev[k]>0)quien[k]=(quien[k]||0)+1}
      for(var x in d.horas)horas[x]=(horas[x]||0)+(+d.horas[x]||0);
      for(var y in d.semana)semana[y]=(semana[y]||0)+(+d.semana[y]||0);
      for(var m in d.minDia)minD[m]=(minD[m]||0)+(+d.minDia[m]||0);
      for(var s in d.dias)sesD[s]=(sesD[s]||0)+(+d.dias[s]||0);
      for(var f in d.evDia){var o=evD[f]||(evD[f]={});for(var g in d.evDia[f])o[g]=(o[g]||0)+(+d.evDia[f][g]||0)}});
    var activos=function(n){return us.filter(function(u){var d=u.apps[a];return d.ultimoUso>now-n*DIA||Object.keys(d.dias).some(function(k){return d.dias[k]>0&&Date.parse(k+'T23:59:59')>now-n*DIA})}).length};
    h+='<div class="kpis">'+kpi(nf(us.length),'Personas que la usan')+kpi(nf(activos(7)),'Activas 7 días')+kpi(nf(activos(30)),'Activas 30 días')+kpi(nf(ses),'Sesiones')+'</div>';
    // Personas activas y sesiones por día
    var pDia=D.map(function(k){return us.filter(function(u){return (u.apps[a].dias[k]||0)>0}).length});
    h+='<div class="duo"><div><div class="lbl">Personas activas por día · 30 días</div>'
      +barras(D.map(function(k,i){return {v:pDia[i],t:corta(k)+': '+pDia[i]+(pDia[i]===1?' persona':' personas')}}),{aria:'Personas activas por día, últimos 30 días',x:dias30x(D)})+'</div>'
      +'<div><div class="lbl">Sesiones por día · 30 días</div>'
      +barras(D.map(function(k){var n=sesD[k]||0;return {v:n,t:corta(k)+': '+n+(n===1?' sesión':' sesiones')}}),{aria:'Sesiones por día, últimos 30 días',x:dias30x(D)})+'</div></div>';
    // Tiempo de uso (minutos con la app abierta y en primer plano)
    var min30=D.reduce(function(t,k){return t+(minD[k]||0)},0),sesConMin=0;
    Object.keys(minD).forEach(function(k){if(minD[k]>0)sesConMin+=sesD[k]||0});
    h+='<div class="lbl">Tiempo de uso</div>';
    if(!minT)h+='<div class="empty">Aún no hay minutos medidos. '+NUEVO+'</div>';
    else h+='<div class="kpis">'+kpi(dur(minT),'Tiempo total medido')+kpi(dur(min30),'Últimos 30 días')+kpi(dur(minT/Math.max(1,conMin)),'Promedio por persona')+kpi(sesConMin?dur(minT/sesConMin):'—','Promedio por sesión')+'</div>'
      +'<div class="lbl sm">Minutos por día · 30 días</div>'
      +barras(D.map(function(k){var n=minD[k]||0;return {v:n,t:corta(k)+': '+dur(n)}}),{aria:'Minutos de uso por día, últimos 30 días',x:dias30x(D)});
    // Horario de uso: por hora del día y por día de la semana (lunes a domingo)
    var hv=[],sv=[];for(var i=0;i<24;i++)hv.push(+horas[i]||0);ORD.forEach(function(d){sv.push(+semana[d]||0)});
    h+='<div class="lbl">Horario de uso</div>';
    if(!sum(horas))h+='<div class="empty">Aún no hay horas de uso medidas. '+NUEVO+'</div>';
    else{var ph=hv.indexOf(Math.max.apply(null,hv)),pd=ORD[sv.indexOf(Math.max.apply(null,sv))];
      h+='<p class="pico">Hora pico: <b>'+hora12(ph)+'</b> · Día con más uso: <b>los '+SEML[pd]+'</b></p><div class="duo"><div><div class="lbl sm">Por hora del día</div>'
        +barras(hv.map(function(n,i){return {v:n,t:hora12(i)+': '+nf(n)+(n===1?' uso':' usos')}}),{aria:'Uso por hora del día',x:['12 a. m.','6 a. m.','12 m.','6 p. m.','11 p. m.']})
        +'</div><div><div class="lbl sm">Por día de la semana</div>'
        +barras(sv.map(function(n,i){return {v:n,t:SEMD[ORD[i]]+': '+nf(n)+(n===1?' uso':' usos')}}),{aria:'Uso por día de la semana',cls:'wk',x:ORD.map(function(d){return SEM[d]})})+'</div></div>'}
    // Funciones en detalle: total, últimos 7 y 30 días, cuántas personas la usan y su tendencia
    var labels=EVENTOS[a]||{},keys=Object.keys(labels).concat(Object.keys(ev).filter(function(k){return !labels[k]}));
    var F=keys.map(function(k){var serie=D.map(function(d){return +((evD[d]||{})[k])||0});
        return {k:k,n:labels[k]||k,tot:+ev[k]||0,d7:serie.slice(-7).reduce(function(t,v){return t+v},0),d30:serie.reduce(function(t,v){return t+v},0),p:quien[k]||0,s:serie}})
      .sort(function(x,y){return y.tot-x.tot||y.d30-x.d30});
    var mt=Math.max.apply(null,F.map(function(f){return f.tot}).concat([1]));
    h+='<div class="lbl">Funciones en detalle</div><p class="sub sm">El total cuenta desde que se mide cada función; los últimos 7 y 30 días y la línea de tendencia se miden desde esta versión.</p><div class="fns">'
      +F.map(function(f){return '<div class="fn'+(f.tot?'':' off')+'"><div class="fn-h"><b>'+esc(f.n)+'</b><span class="num">'+nf(f.tot)+'</span></div><div class="tr"><i style="width:'+(f.tot/mt*100)+'%"></i></div>'
        +'<div class="fn-m"><span>7 días: <b>'+nf(f.d7)+'</b></span><span>30 días: <b>'+nf(f.d30)+'</b></span><span>Personas: <b>'+nf(f.p)+'</b> ('+Math.round(f.p/us.length*100)+' %)</span></div>'
        +'<div class="fn-s" tabindex="0" data-tip="'+esc(f.n+' · últimos 30 días: '+nf(f.d30))+'" aria-label="'+esc(f.n+', últimos 30 días: '+nf(f.d30))+'">'+spark(f.s)+'</div></div>'}).join('')+'</div>';
    // Tendencia de las funciones más usadas: pequeños múltiplos con la misma escala para poder compararlas
    var top=F.filter(function(f){return f.d30>0}).sort(function(x,y){return y.d30-x.d30}).slice(0,4);
    h+='<div class="lbl">Tendencia de las funciones más usadas · 30 días</div>';
    if(!top.length)h+='<div class="empty">Aún no hay uso diario de funciones. '+NUEVO+'</div>';
    else{var mxs=Math.max.apply(null,top.map(function(f){return Math.max.apply(null,f.s)}).concat([1]));
      h+='<p class="sub sm">Las funciones con más uso en 30 días, todas en la misma escala (máximo '+nf(mxs)+' en un día).</p><div class="mult">'+top.map(function(f){
        return '<div><div class="mult-h"><span>'+esc(f.n)+'</span><b>'+nf(f.d30)+'</b></div>'+barras(f.s.map(function(n,i){return {v:n,t:corta(D[i])+': '+nf(n)}}),{aria:f.n+', uso diario en 30 días',h:56,max:mxs})+'</div>'}).join('')+'</div>'}
    return h+'</section>'}
  function dur(m){m=Math.round(+m||0);if(m<60)return m+' min';var h=Math.floor(m/60),r=m%60;return h+' h'+(r?' '+r+' min':'')}

  /* Comparación entre apps: tres gráficas separadas, cada una con su propia escala */
  function comparar(){var now=Date.now(),R=Object.keys(APPS).map(function(a){var ses=0,min=0,act=0;
      S.users.forEach(function(u){var d=u.apps[a];if(!usaApp(d))return;ses+=d.sesiones;min+=d.min;
        if(d.ultimoUso>now-30*DIA||Object.keys(d.dias).some(function(k){return d.dias[k]>0&&Date.parse(k+'T23:59:59')>now-30*DIA}))act++});
      return {a:a,ses:ses,min:min,act:act}});
    var hb=function(key,fmt,titulo){var mx=Math.max.apply(null,R.map(function(r){return r[key]}).concat([1]));
      return '<div><div class="lbl sm">'+titulo+'</div><div class="hbars">'+R.map(function(r){return '<div class="hbar" tabindex="0" data-tip="'+esc(APPS[r.a]+': '+fmt(r[key]))+'"><span>'+esc(APPS[r.a])+'</span><b>'+fmt(r[key])+'</b><div class="tr"><i style="width:'+(r[key]/mx*100)+'%"></i></div></div>'}).join('')+'</div></div>'};
    return '<section class="card wide"><h3>Comparación entre <span>apps</span></h3><p class="sub">Cada gráfica tiene su propia escala. El tiempo de uso se mide desde esta versión.</p><div class="trio">'
      +hb('ses',nf,'Sesiones (total)')+hb('act',nf,'Personas activas · 30 días')+hb('min',dur,'Tiempo de uso')+'</div></section>'}

  /* Crecimiento de cuentas: cuentas nuevas por mes, según la fecha de activación o de invitación */
  function crecimiento(){var M=[],now=new Date();for(var i=11;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth()-i,1);M.push({y:d.getFullYear(),m:d.getMonth(),n:0})}
    var tot=0,antes=0,ini=new Date(M[0].y,M[0].m,1).getTime();
    S.inv.forEach(function(i){var t=+i.activado||+i.invitado||0;if(!t)return;tot++;if(t<ini){antes++;return}var d=new Date(t);M.forEach(function(x){if(x.y===d.getFullYear()&&x.m===d.getMonth())x.n++})});
    var lbl=function(x){return new Date(x.y,x.m,1).toLocaleDateString('es-CO',{month:'short',year:'2-digit'})},n12=M.reduce(function(t,x){return t+x.n},0);
    return '<section class="card"><h3>Crecimiento de <span>cuentas</span></h3><p class="sub">Cuentas nuevas por mes, según la fecha en que se activaron o fueron invitadas.</p>'
      +'<p class="pico"><b>'+nf(tot)+'</b> cuentas en total · <b>'+nf(n12)+'</b> nuevas en los últimos 12 meses'+(antes?' · '+nf(antes)+' antes':'')+'</p>'
      +(tot?barras(M.map(function(x){return {v:x.n,t:lbl(x)+': '+x.n+(x.n===1?' cuenta nueva':' cuentas nuevas')}}),{aria:'Cuentas nuevas por mes, últimos 12 meses',x:[lbl(M[0]),lbl(M[6]),lbl(M[11])]})
        :'<div class="empty">Aún no hay cuentas con fecha de activación.</div>')+'</section>'}

  function ranking(){var r=S.users.map(function(u){var per={},t=0;Object.keys(APPS).forEach(function(a){var n=actividad(u.apps[a],a);if(n){per[a]=n;t+=n}});return {u:u,per:per,t:t}})
      .filter(function(x){return x.t>0}).sort(function(a,b){return b.t-a.t}).slice(0,10);
    return '<section class="card"><h3>Usuarios con más <span>actividad</span></h3><p class="sub">Suma de lo que cada persona hizo en todas las apps (registros, entrenos, oraciones, proyectos…).</p>'
      +(r.length?'<div class="rank">'+r.map(function(x){return '<div class="rk"><div style="min-width:0"><button type="button" class="em lnk" data-adm="ver" data-id="'+esc(x.u.id)+'" aria-label="Ver el detalle de '+esc(x.u.email)+'">'+esc(x.u.email)+'</button><small>'
        +Object.keys(x.per).map(function(a){return esc(APPS[a])+' '+nf(x.per[a])}).join(' · ')+'</small></div><b>'+nf(x.t)+'</b></div>'}).join('')+'</div>'
        :'<div class="empty">Aún no hay actividad medida.</div>')+'</section>'}

  function solicitudes(){var L=S.users.filter(function(u){return u.inv&&u.inv.proyecta&&!u.admin}),pend=L.filter(function(u){return u.inv.proyecta==='pendiente'}).sort(function(a,b){return (+a.inv.proyectaSol||0)-(+b.inv.proyectaSol||0)}),
      ok=L.filter(function(u){return u.inv.proyecta==='aprobado'}),no=L.filter(function(u){return u.inv.proyecta==='denegado'});
    var row=function(u,btns,info){return '<div class="urow"><div class="top"><span class="em">'+esc(u.email)+'</span></div><div class="meta"><span>'+info+'</span></div><div class="acts">'+btns+'</div></div>'};
    return '<section class="card"><h3>Solicitudes de <span>Proyecta</span>'+(pend.length?'<span class="badge">'+pend.length+'</span>':'')+'</h3><p class="sub">Proyecta pide aprobación antes de dar acceso.</p>'
      +(pend.length?'<div class="ulist">'+pend.map(function(u){return row(u,'<button class="sbtn" data-adm="pry" data-v="denegado" data-id="'+esc(u.id)+'">Denegar</button><button class="sbtn pri" data-adm="pry" data-v="aprobado" data-id="'+esc(u.id)+'">Aprobar</button>','Pidió acceso '+hace(+u.inv.proyectaSol))}).join('')+'</div>':'<div class="empty">No hay solicitudes pendientes.</div>')
      +(ok.length?'<details><summary>Con acceso ('+ok.length+')</summary><div class="ulist">'+ok.map(function(u){return row(u,'<button class="sbtn warn'+(S.sure==='pq:'+u.id?' sure':'')+'" data-adm="pryq" data-id="'+esc(u.id)+'">'+(S.sure==='pq:'+u.id?'¿Seguro? Toca de nuevo':'Quitar acceso')+'</button>','Aprobado '+fecha(+u.inv.proyectaRes))}).join('')+'</div></details>':'')
      +(no.length?'<details><summary>Denegadas ('+no.length+')</summary><div class="ulist">'+no.map(function(u){return row(u,'<button class="sbtn pri" data-adm="pry" data-v="aprobado" data-id="'+esc(u.id)+'">Aprobar</button>','Denegado '+fecha(+u.inv.proyectaRes))}).join('')+'</div></details>':'')
      +'</section>'}

  function pill(u){if(u.admin)return '<span class="pill ok">Administrador</span>';var e=u.estado;
    return e==='activo'?'<span class="pill ok">Activo</span>':e==='revocado'?'<span class="pill no">Revocado</span>':e==='pendiente'?'<span class="pill wait">Pendiente</span>':'<span class="pill">Sin registro de acceso</span>'}
  function cuentas(){var q=S.q.trim().toLowerCase(),L=S.users.filter(function(u){return !q||u.email.indexOf(q)>=0});
    var h='<section class="card wide"><h3>Cuentas de <span>usuario</span></h3><p class="sub">Revocar quita el acceso a todas las apps (Mind Focus, PowerFit, Lumen y Proyecta); sus datos no se borran. Eliminar borra sus datos para siempre.</p>'
      +'<div class="searchrow"><label class="field"><input id="admQ" type="search" placeholder="Buscar usuario por correo" value="'+esc(S.q)+'" autocomplete="off" aria-label="Buscar cuenta por correo"></label><span class="adm-upd">'+L.length+' de '+S.users.length+'</span></div>';
    if(S.delOut)h+=resultadoEliminar();
    h+='<div class="ulist">'+(L.length?L.map(cuentaRow).join(''):'<div class="empty">Ninguna cuenta coincide.</div>')+'</div>';
    return h+invitar()+'</section>'}
  function cuentaRow(u){var apps=Object.keys(APPS).filter(function(a){return usaApp(u.apps[a])}),ses=0;apps.forEach(function(a){ses+=u.apps[a].sesiones});
    var i=u.inv||{},desde=i.activado||i.invitado,acts='<button class="sbtn" data-adm="ver" data-id="'+esc(u.id)+'">Ver detalle</button>';
    if(!u.admin&&u.inv){
      if(u.estado==='revocado')acts+='<button class="sbtn" data-adm="react" data-id="'+esc(u.id)+'">Reactivar</button>';
      else acts+='<button class="sbtn warn'+(S.sure==='rev:'+u.id?' sure':'')+'" data-adm="rev" data-id="'+esc(u.id)+'">'+(S.sure==='rev:'+u.id?'¿Seguro? Toca de nuevo':'Revocar acceso')+'</button>';
    }
    if(!u.admin)acts+='<button class="sbtn warn" data-adm="del" data-id="'+esc(u.id)+'">Eliminar datos</button>';
    // Acceso por app: un interruptor por cada una, más "Todas" y "Ninguna". Cada app lo escucha en vivo y deja entrar o
    // saca a la persona. Mind Focus, PowerFit y Lumen: apps.{app} (sin dato = con acceso). Proyecta: aprobado / denegado.
    var on=appOn(i),nOn=APP_ORD.filter(function(a){return on[a]}).length,
      pry=u.admin?'':'<div class="app-acc"><div class="app-acc-h"><b>Acceso a apps</b><span>'+(nOn===APP_ORD.length?'Todas':nOn?nOn+' de '+APP_ORD.length:'Ninguna')+'</span>'
      +'<button type="button" class="sbtn sm" data-adm="appall" data-v="1" data-id="'+esc(u.id)+'"'+(nOn===APP_ORD.length?' disabled':'')+'>Todas</button>'
      +'<button type="button" class="sbtn sm" data-adm="appall" data-v="0" data-id="'+esc(u.id)+'"'+(nOn?'':' disabled')+'>Ninguna</button></div><div class="app-sws">'
      +APP_ORD.map(function(a){return '<div class="pry-sw"><span>'+esc(APPS[a])+(a==='proyecta'&&i.proyecta==='pendiente'?' <span class="pill wait">Pidió acceso</span>':'')+'</span>'
        +'<button type="button" class="sw" role="switch" aria-checked="'+on[a]+'" data-adm="appsw" data-app="'+a+'" data-id="'+esc(u.id)+'" aria-label="Acceso a '+esc(APPS[a])+' de '+esc(u.email)+'"><i></i></button></div>'}).join('')+'</div></div>';
    var h='<div class="urow"><div class="top"><span class="em">'+esc(u.email)+'</span>'+pill(u)+'</div>'
      +'<div class="meta"><span>'+(i.autoregistro?'Se registró solo':i.invitado?'Invitado':'Cuenta')+(desde?' · '+fecha(+desde):'')+'</span><span>Último uso: '+hace(u.last)+'</span><span>Sesiones: '+nf(ses)+'</span>'
      +'</div>'
      +(apps.length?'<div class="row2">'+apps.map(function(a){return '<span class="tag">'+esc(APPS[a])+'</span>'}).join('')+'</div>':'')
      +pry+(acts?'<div class="acts">'+acts+'</div>':'');
    if(S.del===u.id)h+='<div class="confirm" role="alert"><b>¿Eliminar los datos de '+esc(u.email)+'?</b><span>Se borran para siempre, sin forma de recuperarlos:</span><ul><li>Sus registros, configuración, entrenos, oraciones y proyectos en todas las apps.</li><li>Su perfil, sus estadísticas de uso y su registro de acceso.</li></ul><span>La cuenta para iniciar sesión se borra aparte, en la consola de Firebase.</span><div class="row2"><button class="sbtn" data-adm="delno">Cancelar</button><button class="sbtn warn sure" data-adm="delsi" data-id="'+esc(u.id)+'">Sí, eliminar todo</button></div></div>';
    return h+'</div>'}
  function resultadoEliminar(){var o=S.delOut;
    return '<div class="confirm" style="margin-bottom:12px"><b>'+(o.fallos?'Eliminación incompleta':'Datos eliminados')+' · '+esc(o.email)+'</b><ul>'+o.partes.map(function(p){return '<li>'+esc(p[0])+': '+(p[1]?'eliminado'+(p[2]!=null?' ('+p[2]+')':''):'<b>no se pudo</b> ('+esc(p[2])+')')+'</li>'}).join('')+'</ul>'
      +'<span>Falta borrar su cuenta de inicio de sesión: ábrela en la consola de Firebase, busca el correo y elimínala.</span>'
      +'<div class="row2"><a class="sbtn pri" href="https://console.firebase.google.com/project/bitacora-jornada/authentication/users" target="_blank" rel="noopener">Abrir consola de Firebase</a><button class="sbtn" data-adm="copy" data-v="'+esc(o.email)+'">Copiar correo</button><button class="sbtn" data-adm="delok">Cerrar</button></div></div>'}
  function invitar(){var m=S.invMsg;
    return '<div class="lbl">Invitar a una persona</div><form id="admInv" class="searchrow" novalidate><label class="field"><input id="admInvEm" type="email" inputmode="email" placeholder="Correo de la persona" autocomplete="off"></label><button class="sbtn pri" type="submit">Invitar</button></form><div class="msg'+(m&&m.ok?' ok':'')+'" id="admInvSt">'+esc(m?m.st:'')+'</div>'
      +(m&&m.text?'<div class="invout"><textarea id="admInvTxt" readonly aria-label="Mensaje de invitación">'+esc(m.text)+'</textarea><div class="row2"><button class="sbtn" data-adm="copy" data-src="admInvTxt">Copiar mensaje</button><a class="sbtn pri" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(m.text)+'">Enviar por WhatsApp</a></div></div>':'')}
  function invTexto(em){return 'Hola, te invito a Wellness Apps: Mind Focus (registro de actividades y productividad), PowerFit (entrenamiento en casa) y Lumen (oración diaria). Crea tu cuenta con este correo ('+em+') aquí: https://www.planificarproyectos.com/wellness-apps/'}

  /* Detalle de una persona: sus sesiones, minutos y funciones en cada app, y a qué horas usa las apps */
  function detalle(){var u=S.ver&&porId(S.ver);if(!u)return '';
    var apps=Object.keys(APPS).filter(function(a){return usaApp(u.apps[a])}),ses=0,min=0,hv=[];for(var i=0;i<24;i++)hv.push(0);
    apps.forEach(function(a){var d=u.apps[a];ses+=d.sesiones;min+=d.min;for(var x in d.horas)hv[+x]+=+d.horas[x]||0});
    var h='<div class="sheet-bg" data-adm="verx"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="verT"><div class="sheet-h"><div style="min-width:0"><div class="kicker">Detalle de la cuenta</div><h3 id="verT" class="em">'+esc(u.email)+'</h3></div>'
      +'<button type="button" class="x" data-adm="verx" aria-label="Cerrar detalle">✕</button></div><div class="row2">'+pill(u)+'<span class="tag">Último uso: '+hace(u.last)+'</span></div>'
      +'<div class="kpis">'+kpi(nf(ses),'Sesiones')+kpi(min?dur(min):'—','Tiempo de uso medido')+kpi(nf(apps.length),apps.length===1?'App que usa':'Apps que usa')+'</div>';
    if(!apps.length)return h+'<div class="empty">Esta cuenta aún no tiene uso medido en ninguna app.</div></div>';
    h+=apps.map(function(a){var d=u.apps[a],L=EVENTOS[a]||{},ks=Object.keys(d.ev).filter(function(k){return d.ev[k]>0}).sort(function(x,y){return d.ev[y]-d.ev[x]});
      return '<div class="uapp"><div class="fn-h"><b>'+esc(APPS[a])+'</b><span>'+hace(d.ultimoUso||lastDay(d.dias))+'</span></div><div class="fn-m"><span>Sesiones: <b>'+nf(d.sesiones)+'</b></span><span>Tiempo: <b>'+(d.min?dur(d.min):'—')+'</b></span><span>Días con uso: <b>'+nf(Object.keys(d.dias).filter(function(k){return d.dias[k]>0}).length)+'</b></span></div>'
        +(ks.length?'<ul class="uev">'+ks.map(function(k){return '<li><span>'+esc(L[k]||k)+'</span><b>'+nf(d.ev[k])+'</b></li>'}).join('')+'</ul>':'<p class="sub sm">Sin funciones medidas todavía.</p>')+'</div>'}).join('');
    h+='<div class="lbl">A qué horas usa las apps</div>'+(sum(hv)?barras(hv.map(function(n,i){return {v:n,t:hora12(i)+': '+nf(n)+(n===1?' uso':' usos')}}),{aria:'Uso por hora del día de esta cuenta',h:90,x:['12 a. m.','6 a. m.','12 m.','6 p. m.','11 p. m.']})
      :'<div class="empty">Aún no hay horas de uso medidas. '+NUEVO+'</div>');
    return h+'</div>'}

  /* Valor exacto de cada barra: aparece al pasar el mouse, al tocar o al enfocar con el teclado */
  var tip=null;function verTip(el){if(!tip){tip=document.createElement('div');tip.className='admtip';tip.setAttribute('role','tooltip');document.body.appendChild(tip)}
    var t=el&&el.getAttribute('data-tip');if(!t){tip.hidden=true;return}tip.textContent=t;tip.hidden=false;
    var r=el.getBoundingClientRect(),w=tip.offsetWidth,x=Math.min(window.innerWidth-w-8,Math.max(8,r.left+r.width/2-w/2)),y=r.top-tip.offsetHeight-8;
    tip.style.left=x+'px';tip.style.top=(y<8?r.bottom+8:y)+'px'}
  function sinTip(){if(tip)tip.hidden=true}
  ['pointerover','focusin'].forEach(function(ev){document.addEventListener(ev,function(e){var el=e.target.closest&&e.target.closest('#adm [data-tip]');if(el)verTip(el);else if(ev==='pointerover')sinTip()})});
  document.addEventListener('focusout',sinTip);window.addEventListener('scroll',sinTip,{passive:true});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&S.ver){e.preventDefault();var b=document.querySelector('#adm .sheet [data-adm="verx"]');if(b)b.click()}});

  function pintar(){var el=$('adm');if(!el)return;if(!S.me){el.hidden=true;el.innerHTML='';return}
    var f=document.activeElement&&document.activeElement.id,pos=f==='admQ'?document.activeElement.selectionStart:null;
    el.hidden=false;
    el.innerHTML='<div class="adm-head wide"><div><div class="kicker">Solo administración</div><h2>Panel de <span>control</span></h2></div><div class="adm-upd"><span>'+(S.busy?'Cargando…':S.upd?'Actualizado '+new Date(S.upd).toLocaleTimeString('es-CO',{hour:'numeric',minute:'2-digit'}):'')+'</span><button class="sbtn" data-adm="load" type="button"'+(S.busy?' disabled':'')+'>Actualizar</button></div></div>'
      +(S.err?'<div class="empty wide" role="alert">'+esc(S.err)+'</div>':'')
      +(S.upd?resumen()+cuentas()+solicitudes()+detalle()+comparar()+porApp()+ranking()+crecimiento():'');   // primero lo que se administra (cuentas y accesos), luego las métricas
    sinTip();document.body.classList.toggle('adm-sheet',!!(S.ver&&porId(S.ver)));
    if(S.verFoco){S.verFoco=false;var cx=document.querySelector('#adm .sheet .x');if(cx)cx.focus()}
    else if(f==='admQ'){var q=$('admQ');if(q){q.focus();if(pos!=null)q.setSelectionRange(pos,pos)}}}

  /* ---------- Acciones ---------- */
  function upd(id,data,ok){return S.db.collection('invitaciones').doc(id).update(data).then(function(){if(ok)ok();cargarSilencio()}).catch(function(e){alert('No se pudo guardar: '+(e.code||e.message))})}
  function cargarSilencio(){S.busy=false;cargar()}
  function borrarSub(base,sub){return base.collection(sub).get().then(function(sn){var docs=sn.docs,p=Promise.resolve();
    for(var i=0;i<docs.length;i+=400)(function(ch){p=p.then(function(){var b=S.db.batch();ch.forEach(function(d){b.delete(d.ref)});return b.commit()})})(docs.slice(i,i+400));
    return p.then(function(){return docs.length})})}
  function eliminar(u){var partes=[],p=Promise.resolve(),base=u.uid?S.db.collection('users').doc(u.uid):null,nombres={entradas:'Registros de Mind Focus',config:'Configuración de Mind Focus',powerfit:'Datos de PowerFit',lumen:'Datos de Lumen',proyecta:'Proyectos de Proyecta',perfil:'Perfil y apariencia'};
    if(base)SUBS.forEach(function(s){p=p.then(function(){return borrarSub(base,s).then(function(n){partes.push([nombres[s],true,n])},function(e){partes.push([nombres[s],false,e.code||e.message])})})});
    if(u.uid)p=p.then(function(){return S.db.collection('stats').doc(u.uid).delete().then(function(){partes.push(['Estadísticas de uso',true])},function(e){partes.push(['Estadísticas de uso',false,e.code||e.message])})});
    if(u.inv)p=p.then(function(){return S.db.collection('invitaciones').doc(u.id).delete().then(function(){partes.push(['Registro de acceso',true])},function(e){partes.push(['Registro de acceso',false,e.code||e.message])})});
    return p.then(function(){S.delOut={email:u.email,partes:partes,fallos:partes.some(function(x){return !x[1]})}})}
  function porId(id){for(var i=0;i<S.users.length;i++)if(S.users[i].id===id)return S.users[i];return null}
  var sureT=0;function seguro(k){if(S.sure===k){S.sure='';return true}S.sure=k;clearTimeout(sureT);sureT=setTimeout(function(){S.sure='';pintar()},4000);pintar();return false}

  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-adm]');if(!b||!S.me)return;var a=b.getAttribute('data-adm'),id=b.getAttribute('data-id');
    if(a==='load')return cargar();
    if(a==='app'){S.app=b.getAttribute('data-k');return pintar()}
    if(a==='ver'){S.ver=id;S.verFoco=true;return pintar()}
    if(a==='verx'){var vid=S.ver;S.ver=null;pintar();var vb=document.querySelector('[data-adm="ver"][data-id="'+(window.CSS&&CSS.escape?CSS.escape(vid):vid)+'"]');if(vb)vb.focus();return}
    if(a==='pry')return upd(id,{proyecta:b.getAttribute('data-v'),proyectaRes:Date.now()});
    if(a==='appsw'||a==='appall'){var w=porId(id);if(!w)return;var data={email:w.email},
        list=a==='appsw'?[b.getAttribute('data-app')]:APP_ORD,on=a==='appsw'?b.getAttribute('aria-checked')!=='true':b.getAttribute('data-v')==='1';
      list.forEach(function(k){if(k==='proyecta'){data.proyecta=on?'aprobado':'denegado';data.proyectaRes=Date.now()}else{data.apps=data.apps||{};data.apps[k]=on}});
      if(a==='appsw')b.setAttribute('aria-checked',on);b.disabled=true;
      return S.db.collection('invitaciones').doc(id).set(data,{merge:true})
        .then(cargarSilencio,function(e){if(a==='appsw')b.setAttribute('aria-checked',!on);b.disabled=false;alert('No se pudo guardar: '+(e.code||e.message))})}
    if(a==='pryq'){if(seguro('pq:'+id))upd(id,{proyecta:'denegado',proyectaRes:Date.now()});return}
    if(a==='rev'){if(seguro('rev:'+id))upd(id,{estado:'revocado',revocado:Date.now()});return}
    if(a==='react'){var u=porId(id);return upd(id,{estado:u&&u.uid?'activo':'pendiente'})}
    if(a==='del'){S.del=S.del===id?null:id;return pintar()}
    if(a==='delno'){S.del=null;return pintar()}
    if(a==='delsi'){var v=porId(id);if(!v)return;b.disabled=true;b.textContent='Eliminando…';S.del=null;eliminar(v).then(function(){S.busy=false;cargar()});return}
    if(a==='delok'){S.delOut=null;return pintar()}
    if(a==='copy'){var t=b.getAttribute('data-v')||(($(b.getAttribute('data-src'))||{}).value||'');
      (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent='Copiado'},function(){var x=$(b.getAttribute('data-src'));if(x)x.select();b.textContent='Selecciona y copia'})}});
  document.addEventListener('input',function(e){if(e.target.id==='admQ'){S.q=e.target.value;pintar()}});
  document.addEventListener('submit',function(e){if(e.target.id!=='admInv')return;e.preventDefault();var em=$('admInvEm').value.trim().toLowerCase();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){S.invMsg={st:'Escribe un correo válido.'};return pintar()}
    var ex=porId(em);if(ex&&ex.inv&&ex.estado!=='revocado'){S.invMsg={st:'Esa persona ya tiene acceso o una invitación pendiente.',text:invTexto(em)};return pintar()}
    S.db.collection('invitaciones').doc(em).set(ex&&ex.inv?{estado:'pendiente',invitado:Date.now()}:{email:em,estado:'pendiente',invitado:Date.now()},{merge:true})
      .then(function(){S.invMsg={ok:true,st:'Invitación creada para '+em+'. Envíale el mensaje.',text:invTexto(em)};S.busy=false;cargar()},function(x){S.invMsg={st:'No se pudo invitar: '+(x.code||x.message)};pintar()})});

  window.Adm={user:function(u){var admin=!!(u&&u.uid===ADMIN_UID);document.body.classList.toggle('admin',admin);
    if(!admin){S.me=null;S.users=[];S.upd=0;return pintar()}
    if(S.me===u.uid)return;S.me=u.uid;try{S.db=firebase.firestore()}catch(e){S.err='No se pudo conectar con la base de datos.'}cargar()}};
})();
