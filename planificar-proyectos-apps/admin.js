/* Dashboard de administración de Planificar Proyectos Apps. Solo aparece con una cuenta administradora: la principal (ADMIN_UID) o las que
   se marquen como administradoras en el panel (admins/{uid}); para cualquier otra persona el hub queda igual.
   - Lee invitaciones (acceso de cada cuenta), admins (administradores) y stats (conteos de uso que guarda /uso.js en cada
     app). Nunca lee el contenido de las personas (registros, entrenos, proyectos…).
   - Mind Focus guardaba antes sus conteos en la raíz de stats/{uid} (sesiones, dias, registros, cronometro, manual,
     analisis, csv): se suman a sus métricas.
   - Gráficas: personas activas, sesiones y minutos por día, horario de uso (hora y día de la semana), funciones en
     detalle con su tendencia, comparación entre apps, crecimiento de cuentas y el detalle de cada persona.
   - Tipos de cuenta: familiar (Wellness Apps), empresarial o mixto (Planificar Proyectos Apps); filtros por tipo.
   - Empresas: el administrador las crea, renombra y elimina; toda cuenta empresarial o mixta debe tener una.
   - Acciones: invitar, revocar o reactivar el acceso, aprobar o denegar Proyecta (también con el interruptor de cada cuenta) y eliminar los datos de una cuenta.
     La cuenta de inicio de sesión solo se puede borrar en la consola de Firebase (desde la web no hay permisos). */
(function(){
  var ADMIN_UID='AQaEMcKNYfWEhcHVdc8N0ghxeZk1';
  var APPS=(window.Uso&&Uso.APPS)||{mindfocus:'Mind Focus',powerfit:'PowerFit',lumen:'Lumen',proyecta:'Proyecta'};
  var EVENTOS=(window.Uso&&Uso.EVENTOS)||{};
  // Acceso por app (sin dato = con acceso; Proyecta usa su aprobación)
  var APP_ORD=['mindfocus','powerfit','lumen','proyecta','cotizador','radar','coordinabim'];
  function appOn(i){var ap=(i&&i.apps)||{},o={};APP_ORD.forEach(function(a){o[a]=a==='proyecta'?(i&&i.proyecta)==='aprobado':ap[a]!==false});return o}
  // Tipos de cuenta (ver /uso.js): familiar, empresarial o mixto, más el nombre de la empresa (opcional)
  var UU=window.Uso||{},TIPOS=UU.TIPOS||{familiar:'Familiar',empresarial:'Empresarial',mixto:'Empresarial y familiar'},
    tipoDe=UU.tipoDe||function(i){return i&&TIPOS[i.tipo]?i.tipo:(i&&i.proyecta==='aprobado'?'mixto':'familiar')},
    accesoTipo=UU.accesoTipo||function(t){var f=t!=='empresarial',e=t!=='familiar';return {tipo:t,apps:{mindfocus:f,powerfit:f,lumen:f},proyecta:e?'aprobado':'denegado',proyectaRes:Date.now()}};
  var PP_EMP=(window.Uso&&Uso.PP_EMP)||'planificar-proyectos-sas';
  function empById(id){for(var i=0;i<S.emp.length;i++)if(S.emp[i].id===id)return S.emp[i];return null}
  function empOpts(sel,ph){return '<option value="">'+esc(ph||'Elige la empresa')+'</option>'+S.emp.map(function(e){return '<option value="'+esc(e.id)+'"'+(e.id===sel?' selected':'')+'>'+esc(e.nombre)+'</option>'}).join('')}
  var DEL=function(){return firebase.firestore.FieldValue.delete()};
  /* Empresas: solo el administrador las crea, renombra y elimina (empresas/{id}.nombre). Cada cuenta empresarial o mixta
     queda asignada a una (invitaciones/{correo}.empresaId y .empresa con el nombre, para la etiqueta en las apps). */
  function empresas(){var n=function(id){return S.users.filter(function(u){return u.empresaId===id}).length},sin=S.users.filter(function(u){return u.sinEmp}).length;
    return '<section class="card wide"><h3>Empresas</h3><p class="sub">Toda cuenta empresarial debe pertenecer a una empresa. Toca una empresa para ver sus usuarios.</p>'
      +(sin?'<p class="msg" role="alert">⚠ '+sin+' cuenta'+(sin===1?'':'s')+' empresarial'+(sin===1?'':'es')+' sin empresa. Asígnales una en Cuentas de usuario.</p>':'')
      +'<div class="ulist">'+(S.emp.length?S.emp.map(function(e){var k=n(e.id);
        if(S.empRen===e.id)return '<form class="searchrow emp-ren" data-id="'+esc(e.id)+'" novalidate><label class="field"><input id="admEmpRen" type="text" maxlength="60" value="'+esc(e.nombre)+'" aria-label="Nuevo nombre de '+esc(e.nombre)+'"></label><button class="sbtn pri" type="submit">Guardar</button><button class="sbtn" type="button" data-adm="empren" data-id="">Cancelar</button></form>';
        return '<div class="urow"><div class="utop" style="cursor:default"><button type="button" class="link" data-adm="empfil" data-id="'+esc(e.id)+'" style="background:none;border:0;color:inherit;font:inherit;font-weight:700;cursor:pointer;padding:0;text-align:left">'+esc(e.nombre)+'</button>'
          +'<span class="usum">'+k+' usuario'+(k===1?'':'s')+'</span><span class="row2" style="margin:0"><button type="button" class="sbtn sm" data-adm="empren" data-id="'+esc(e.id)+'">Renombrar</button>'
          +(k||e.id===PP_EMP?'':'<button type="button" class="sbtn sm warn'+(S.sure==='emp:'+e.id?' sure':'')+'" data-adm="empdel" data-id="'+esc(e.id)+'">'+(S.sure==='emp:'+e.id?'¿Seguro?':'Eliminar')+'</button>')+'</span></div></div>'}).join(''):'<div class="empty">Aún no hay empresas.</div>')+'</div>'
      +'<div class="lbl">Nueva empresa</div><form id="admEmpNew" class="searchrow" novalidate><label class="field"><input id="admEmpNom" type="text" maxlength="60" placeholder="Nombre de la empresa" autocomplete="off"></label><button class="sbtn pri" type="submit">Crear</button></form>'
      +'<div class="msg'+(/^(Empresa )/.test(S.empMsg||'')?' ok':'')+'" role="status">'+esc(S.empMsg||'')+'</div></section>'}
  function tipoPill(u){return u.admin?'':'<span class="pill tipo t-'+u.tipo+'">'+esc(TIPOS[u.tipo])+'</span>'+(u.sinEmp?'<span class="pill no">⚠ Sin empresa</span>':'')}
  var DIA=864e5, SUBS=['entradas','config','powerfit','lumen','proyecta','perfil'];
  var S={db:null,me:null,inv:[],stats:{},admins:{},uopen:null,users:[],upd:0,app:'mindfocus',q:'',sure:'',del:null,delOut:null,invMsg:null,busy:false,err:'',ver:null,verFoco:false,filt:'todos',invTipo:'familiar',emp:[],empFil:'',empRen:null,empMsg:'',needEmp:null,invEmpId:''};
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
      u.last=last;u.admin=u.uid===ADMIN_UID||!!(u.uid&&S.admins[u.uid]);u.estado=(u.inv&&u.inv.estado)||'sin registro';
      u.tipo=u.admin?'mixto':tipoDe(u.inv);u.empresaId=String((u.inv&&u.inv.empresaId)||'');var ee=empById(u.empresaId);u.empresa=ee?ee.nombre:'';u.sinEmp=!u.admin&&u.tipo!=='familiar'&&!ee});
    out.sort(function(a,b){return b.last-a.last});S.users=out}

  function cargar(){if(!S.db||S.busy)return;S.busy=true;S.err='';pintar();
    Promise.all([S.db.collection('invitaciones').get(),S.db.collection('stats').get(),S.db.collection('admins').get().catch(function(){return {docs:[]}}),S.db.collection('empresas').get().catch(function(){return {docs:[]}})]).then(function(r){
      S.emp=r[3].docs.map(function(d){var x=d.data()||{};return {id:d.id,nombre:String(x.nombre||''),creada:x.creada||0}}).sort(function(a,b){return a.nombre.localeCompare(b.nombre,'es')});
      // Planificar Proyectos SAS: empresa fija (su id da acceso al Cotizador); se crea si falta y no se puede eliminar
      if(!S.emp.some(function(e){return e.id===PP_EMP})){S.emp.unshift({id:PP_EMP,nombre:'Planificar Proyectos SAS',creada:Date.now()});S.db.collection('empresas').doc(PP_EMP).set({nombre:'Planificar Proyectos SAS',creada:Date.now(),por:S.me},{merge:true}).catch(function(){})}
      S.admins={};r[2].docs.forEach(function(d){S.admins[d.id]=d.data()||{}});
      S.inv=r[0].docs.map(function(d){var x=d.data();x.id=d.id;return x});S.stats={};r[1].docs.forEach(function(d){S.stats[d.id]=d.data()});
      armar();S.upd=Date.now()}).catch(function(e){S.err='No se pudieron cargar los datos ('+(e.code||e.message)+').'}).then(function(){S.busy=false;pintar()})}

  /* ---------- Secciones ---------- */
  function kpi(v,l){return '<div class="kpi"><b>'+v+'</b><span>'+l+'</span></div>'}
  function resumen(){var now=Date.now(),U=S.users.filter(function(u){return u.inv}),ses=0;
    S.users.forEach(function(u){for(var a in u.apps)ses+=u.apps[a].sesiones});
    return '<section class="card wide"><h3>Resumen <span>general</span></h3><p class="sub">Todas las cuentas de Planificar Proyectos Apps.</p><div class="kpis">'
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
    var row=function(u,btns,info){return '<div class="urow open"><div class="top"><span class="em">'+esc(u.email)+'</span></div><div class="meta"><span>'+info+'</span></div><div class="acts">'+btns+'</div></div>'};
    return '<section class="card wide"><h3>Solicitudes de <span>Proyecta</span>'+(pend.length?'<span class="badge">'+pend.length+'</span>':'')+'</h3><p class="sub">Proyecta pide aprobación antes de dar acceso.</p>'
      +(pend.length?'<div class="ulist">'+pend.map(function(u){return row(u,'<button class="sbtn" data-adm="pry" data-v="denegado" data-id="'+esc(u.id)+'">Denegar</button><button class="sbtn pri" data-adm="pry" data-v="aprobado" data-id="'+esc(u.id)+'">Aprobar</button>','Pidió acceso '+hace(+u.inv.proyectaSol))}).join('')+'</div>':'<div class="empty">No hay solicitudes pendientes.</div>')
      +(ok.length?'<details><summary>Con acceso ('+ok.length+')</summary><div class="ulist">'+ok.map(function(u){return row(u,'<button class="sbtn warn'+(S.sure==='pq:'+u.id?' sure':'')+'" data-adm="pryq" data-id="'+esc(u.id)+'">'+(S.sure==='pq:'+u.id?'¿Seguro? Toca de nuevo':'Quitar acceso')+'</button>','Aprobado '+fecha(+u.inv.proyectaRes))}).join('')+'</div></details>':'')
      +(no.length?'<details><summary>Denegadas ('+no.length+')</summary><div class="ulist">'+no.map(function(u){return row(u,'<button class="sbtn pri" data-adm="pry" data-v="aprobado" data-id="'+esc(u.id)+'">Aprobar</button>','Denegado '+fecha(+u.inv.proyectaRes))}).join('')+'</div></details>':'')
      +'</section>'}

  function pill(u){if(u.admin)return '<span class="pill ok">Administrador</span>';var e=u.estado;
    return e==='activo'?'<span class="pill ok">Activo</span>':e==='revocado'?'<span class="pill no">Revocado</span>':e==='pendiente'?'<span class="pill wait">Pendiente</span>':'<span class="pill">Sin registro de acceso</span>'}
  function cuentas(){var q=S.q.trim().toLowerCase(),L=S.users.filter(function(u){return (S.filt==='todos'||(!u.admin&&u.tipo===S.filt))&&(!S.empFil||u.empresaId===S.empFil)&&(!q||u.email.indexOf(q)>=0||u.empresa.toLowerCase().indexOf(q)>=0)});
    var cnt=function(t){return S.users.filter(function(u){return !u.admin&&u.tipo===t}).length};
    var h='<section class="card wide"><h3>Cuentas de <span>usuario</span></h3><p class="sub">Revocar quita el acceso a todas las apps (Mind Focus, PowerFit, Lumen y Proyecta); sus datos no se borran. Eliminar borra sus datos para siempre.</p>'
      +'<div class="searchrow"><label class="field"><input id="admQ" type="search" placeholder="Buscar por correo o empresa" value="'+esc(S.q)+'" autocomplete="off" aria-label="Buscar cuenta por correo"></label><span class="adm-upd">'+L.length+' de '+S.users.length+'</span></div>'
      +(S.empFil&&empById(S.empFil)?'<div class="tfilt"><span class="pill t-empresarial">Empresa: '+esc(empById(S.empFil).nombre)+'</span><button type="button" class="sbtn sm" data-adm="empfil" data-id="">Quitar filtro</button></div>':'')
      +'<div class="tfilt" role="group" aria-label="Filtrar por tipo de cuenta">'+[['todos','Todos',S.users.length]].concat(Object.keys(TIPOS).map(function(t){return [t,TIPOS[t],cnt(t)]})).map(function(f){return '<button type="button" class="sbtn sm'+(S.filt===f[0]?' pri':'')+'" data-adm="filt" data-k="'+f[0]+'" aria-pressed="'+(S.filt===f[0])+'">'+esc(f[1])+' · '+f[2]+'</button>'}).join('')+'</div>';
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
    // Administrador: mismas opciones que la cuenta principal (este panel, todas las apps, Proyecta sin aprobación).
    // Se guarda en admins/{uid}; la cuenta principal no se puede quitar y nadie se quita a sí mismo (para no quedar fuera).
    var root=u.uid===ADMIN_UID,yo=u.uid===S.me,
      adm=root?'':!u.uid?'<div class="pry-sw adm-sw"><span>Administrador <small>· podrás activarlo cuando inicie sesión por primera vez</small></span></div>'
        :'<div class="pry-sw adm-sw"><span>Administrador'+(yo?' <small>· no puedes quitártelo a ti mismo</small>':'')+'</span><button type="button" class="sw" role="switch" aria-checked="'+u.admin+'" data-adm="admsw" data-id="'+esc(u.id)+'"'+(yo?' disabled':'')+' aria-label="Administrador: '+esc(u.email)+'"><i></i></button></div>';
    // Tipo de cuenta y empresa: el tipo abre las apps que le corresponden y cierra las demás; los interruptores afinan
    var tip=u.admin||!u.inv?'':'<div class="app-acc"><div class="app-acc-h"><b>Tipo de cuenta</b></div><div class="tfilt" role="radiogroup" aria-label="Tipo de cuenta de '+esc(u.email)+'">'
      +Object.keys(TIPOS).map(function(t){return '<button type="button" class="sbtn sm'+(u.tipo===t?' pri':'')+'" role="radio" aria-checked="'+(u.tipo===t)+'" data-adm="tipo" data-k="'+t+'" data-id="'+esc(u.id)+'">'+esc(TIPOS[t])+'</button>'}).join('')+'</div>'
      +(u.tipo==='familiar'&&S.needEmp!==u.id?'':'<label class="field"><select data-empsel="'+esc(u.id)+'" aria-label="Empresa de '+esc(u.email)+'">'+empOpts(u.empresaId,S.emp.length?'Elige la empresa':'Primero crea una empresa')+'</select></label>')
      +(S.needEmp===u.id?'<p class="msg" role="alert">Elige primero la empresa; luego se guarda el tipo de cuenta.</p>':u.sinEmp?'<p class="msg" role="alert">Las cuentas empresariales deben tener empresa.</p>':'')+'</div>';
    var on=appOn(i),nOn=APP_ORD.filter(function(a){return on[a]}).length,
      pry=u.admin?adm:adm+'<div class="app-acc"><div class="app-acc-h"><b>Acceso a apps</b><span>'+(nOn===APP_ORD.length?'Todas':nOn?nOn+' de '+APP_ORD.length:'Ninguna')+'</span>'
      +'<button type="button" class="sbtn sm" data-adm="appall" data-v="1" data-id="'+esc(u.id)+'"'+(nOn===APP_ORD.length?' disabled':'')+'>Todas</button>'
      +'<button type="button" class="sbtn sm" data-adm="appall" data-v="0" data-id="'+esc(u.id)+'"'+(nOn?'':' disabled')+'>Ninguna</button></div><div class="app-sws">'
      +APP_ORD.map(function(a){return '<div class="pry-sw"><span>'+esc(APPS[a])+(a==='proyecta'&&i.proyecta==='pendiente'?' <span class="pill wait">Pidió acceso</span>':'')+'</span>'
        +'<button type="button" class="sw" role="switch" aria-checked="'+on[a]+'" data-adm="appsw" data-app="'+a+'" data-id="'+esc(u.id)+'" aria-label="Acceso a '+esc(APPS[a])+' de '+esc(u.email)+'"><i></i></button></div>'}).join('')+'</div></div>';
    // Cerrada, la cuenta es una sola línea (correo, estado, apps con acceso y último uso); al tocarla se despliegan los
    // detalles para activar, desactivar y administrar. Solo una abierta a la vez
    var abierta=S.uopen===u.id||S.del===u.id,
      resumen=u.admin?'Todas las apps':u.estado==='revocado'?'Sin acceso':nOn+' de '+APP_ORD.length+' apps';
    var h='<div class="urow'+(abierta?' open':'')+'"><button type="button" class="utop" data-adm="uopen" data-id="'+esc(u.id)+'" aria-expanded="'+abierta+'">'
      +'<span class="em">'+esc(u.email)+(u.empresa?' <small class="emp">· '+esc(u.empresa)+'</small>':'')+'</span>'+tipoPill(u)+(i.proyecta==='pendiente'&&!u.admin?'<span class="pill wait">Pidió Proyecta</span>':'')+pill(u)
      +'<span class="usum">'+resumen+' · '+hace(u.last)+'</span><svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>';
    if(abierta)h+='<div class="meta"><span>'+(i.autoregistro?'Se registró solo':i.invitado?'Invitado':'Cuenta')+(desde?' · '+fecha(+desde):'')+'</span><span>Último uso: '+hace(u.last)+'</span><span>Sesiones: '+nf(ses)+'</span>'
      +'</div>'
      +(apps.length?'<div class="row2">'+apps.map(function(a){return '<span class="tag">'+esc(APPS[a])+'</span>'}).join('')+'</div>':'')
      +tip+pry+(acts?'<div class="acts">'+acts+'</div>':'');
    if(S.del===u.id)h+='<div class="confirm" role="alert"><b>¿Eliminar los datos de '+esc(u.email)+'?</b><span>Se borran para siempre, sin forma de recuperarlos:</span><ul><li>Sus registros, configuración, entrenos, oraciones y proyectos en todas las apps.</li><li>Su perfil, sus estadísticas de uso y su registro de acceso.</li></ul><span>La cuenta para iniciar sesión se borra aparte, en la consola de Firebase.</span><div class="row2"><button class="sbtn" data-adm="delno">Cancelar</button><button class="sbtn warn sure" data-adm="delsi" data-id="'+esc(u.id)+'">Sí, eliminar todo</button></div></div>';
    return h+'</div>'}
  function resultadoEliminar(){var o=S.delOut;
    return '<div class="confirm" style="margin-bottom:12px"><b>'+(o.fallos?'Eliminación incompleta':'Datos eliminados')+' · '+esc(o.email)+'</b><ul>'+o.partes.map(function(p){return '<li>'+esc(p[0])+': '+(p[1]?'eliminado'+(p[2]!=null?' ('+p[2]+')':''):'<b>no se pudo</b> ('+esc(p[2])+')')+'</li>'}).join('')+'</ul>'
      +'<span>Falta borrar su cuenta de inicio de sesión: ábrela en la consola de Firebase, busca el correo y elimínala.</span>'
      +'<div class="row2"><a class="sbtn pri" href="https://console.firebase.google.com/project/planificar-proyectos-apps/authentication/users" target="_blank" rel="noopener">Abrir consola de Firebase</a><button class="sbtn" data-adm="copy" data-v="'+esc(o.email)+'">Copiar correo</button><button class="sbtn" data-adm="delok">Cerrar</button></div></div>'}
  function invitar(){var m=S.invMsg;
    return '<div class="lbl">Invitar a una persona</div><div class="tfilt" role="radiogroup" aria-label="Tipo de cuenta de la invitación">'+Object.keys(TIPOS).map(function(t){return '<button type="button" class="sbtn sm'+(S.invTipo===t?' pri':'')+'" role="radio" aria-checked="'+(S.invTipo===t)+'" data-adm="invtipo" data-k="'+t+'">'+esc(TIPOS[t])+'</button>'}).join('')+'</div>'
      +(S.invTipo==='familiar'?'':'<label class="field" style="margin-bottom:10px"><select id="admInvEmp" aria-label="Empresa de la invitación">'+empOpts(S.invEmpId,S.emp.length?'Elige la empresa (obligatoria)':'Primero crea una empresa')+'</select></label>')+'<form id="admInv" class="searchrow" novalidate><label class="field"><input id="admInvEm" type="email" inputmode="email" placeholder="Correo de la persona" autocomplete="off"></label><button class="sbtn pri" type="submit">Invitar</button></form><div class="msg'+(m&&m.ok?' ok':'')+'" id="admInvSt">'+esc(m?m.st:'')+'</div>'
      +(m&&m.text?'<div class="invout"><textarea id="admInvTxt" readonly aria-label="Mensaje de invitación">'+esc(m.text)+'</textarea><div class="row2"><button class="sbtn" data-adm="copy" data-src="admInvTxt">Copiar mensaje</button><a class="sbtn pri" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(m.text)+'">Enviar por WhatsApp</a></div></div>':'')}
  // La invitación usa la marca del tipo de cuenta: Wellness Apps (familiar) o Planificar Proyectos Apps (empresarial o mixto)
  function invTexto(em){var x=porId(em),t=x?x.tipo:S.invTipo,pp=t!=='familiar',
      apps=t==='empresarial'?'Proyecta (gestión de proyectos)':(t==='mixto'?'Proyecta (gestión de proyectos), ':'')+'Mind Focus (registro de actividades y productividad), PowerFit (entrenamiento en casa) y Lumen (oración diaria)';
    return 'Hola, te invito a '+(pp?'Planificar Proyectos Apps':'Wellness Apps')+': '+apps+'. Crea tu cuenta con este correo ('+em+') aquí: https://www.planificarproyectos.com/'+(pp?'planificar-proyectos-apps':'wellness-apps')+'/'}

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
      +(S.upd?resumen()+empresas()+cuentas()+solicitudes()+detalle()+comparar()+porApp()+ranking()+crecimiento():'');   // primero lo que se administra (cuentas y accesos), luego las métricas
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
    if(a==='filt'){S.filt=b.getAttribute('data-k');return pintar()}
    if(a==='invtipo'){S.invTipo=b.getAttribute('data-k');var ie=($('admInvEm')||{}).value;pintar();if($('admInvEm'))$('admInvEm').value=ie||'';return}
    if(a==='empfil'){S.empFil=id||'';S.filt='todos';pintar();if(id){var cs=document.getElementById('admQ');if(cs)cs.scrollIntoView({block:'center'})}return}
    if(a==='empren'){S.empRen=id||null;pintar();var ri=$('admEmpRen');if(ri){ri.focus();ri.select()}return}
    if(a==='empdel'){if(id===PP_EMP)return;if(!seguro('emp:'+id))return pintar();if(S.users.some(function(u){return u.empresaId===id}))return;return S.db.collection('empresas').doc(id).delete().then(function(){S.empMsg='Empresa eliminada.';cargarSilencio()},function(e){alert('No se pudo eliminar: '+(e.code||e.message))})}
    if(a==='tipo'){var tu=porId(id),tk=b.getAttribute('data-k');if(!tu||(tu.tipo===tk&&!tu.sinEmp))return;
      if(tk!=='familiar'&&!empById(tu.empresaId)){S.needEmp=id;S.needTipo=tk;return pintar()}S.needEmp=null;b.disabled=true;
      var td=Object.assign(accesoTipo(tk),{email:tu.email});if(tk==='familiar'){td.empresaId=DEL();td.empresa=DEL()}
      return S.db.collection('invitaciones').doc(id).set(td,{merge:true}).then(cargarSilencio,function(e){b.disabled=false;alert('No se pudo guardar: '+(e.code||e.message))})}
    if(a==='uopen'){S.uopen=S.uopen===id?null:id;S.del=null;return pintar()}
    if(a==='ver'){S.ver=id;S.verFoco=true;return pintar()}
    if(a==='verx'){var vid=S.ver;S.ver=null;pintar();var vb=document.querySelector('[data-adm="ver"][data-id="'+(window.CSS&&CSS.escape?CSS.escape(vid):vid)+'"]');if(vb)vb.focus();return}
    if(a==='pry'){var pv=b.getAttribute('data-v'),pu=porId(id),pd={proyecta:pv,proyectaRes:Date.now()};if(pu){if(pv==='aprobado'&&pu.tipo==='familiar')pd.tipo='mixto';if(pv!=='aprobado'&&pu.tipo==='mixto')pd.tipo='familiar'}return upd(id,pd)}
    if(a==='admsw'){var x=porId(id);if(!x||!x.uid||x.uid===ADMIN_UID||x.uid===S.me)return;var hacer=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',hacer);b.disabled=true;
      var ref=S.db.collection('admins').doc(x.uid);
      // Al volverlo administrador también se le abren todas las apps, para que no quede bloqueado por un acceso anterior
      return (hacer?ref.set({email:x.email,desde:Date.now(),por:S.me}).then(function(){return S.db.collection('invitaciones').doc(x.id)
          .set({email:x.email,apps:{mindfocus:true,powerfit:true,lumen:true},proyecta:'aprobado',proyectaRes:Date.now()},{merge:true})}):ref.delete())
        .then(cargarSilencio,function(e){b.setAttribute('aria-checked',!hacer);b.disabled=false;alert('No se pudo guardar: '+(e.code||e.message))})}
    if(a==='appsw'||a==='appall'){var w=porId(id);if(!w)return;var data={email:w.email},
        list=a==='appsw'?[b.getAttribute('data-app')]:APP_ORD,on=a==='appsw'?b.getAttribute('aria-checked')!=='true':b.getAttribute('data-v')==='1';
      list.forEach(function(k){if(k==='proyecta'){data.proyecta=on?'aprobado':'denegado';data.proyectaRes=Date.now();if(a==='appsw'){if(on&&w.tipo==='familiar')data.tipo='mixto';if(!on&&w.tipo==='mixto')data.tipo='familiar'}}else{data.apps=data.apps||{};data.apps[k]=on}});
      if(a==='appsw')b.setAttribute('aria-checked',on);b.disabled=true;
      return S.db.collection('invitaciones').doc(id).set(data,{merge:true})
        .then(cargarSilencio,function(e){if(a==='appsw')b.setAttribute('aria-checked',!on);b.disabled=false;alert('No se pudo guardar: '+(e.code||e.message))})}
    if(a==='pryq'){if(seguro('pq:'+id)){var qu=porId(id),qd={proyecta:'denegado',proyectaRes:Date.now()};if(qu&&qu.tipo==='mixto')qd.tipo='familiar';upd(id,qd)}return}
    if(a==='rev'){if(seguro('rev:'+id))upd(id,{estado:'revocado',revocado:Date.now()});return}
    if(a==='react'){var u=porId(id);return upd(id,{estado:u&&u.uid?'activo':'pendiente'})}
    if(a==='del'){S.del=S.del===id?null:id;return pintar()}
    if(a==='delno'){S.del=null;return pintar()}
    if(a==='delsi'){var v=porId(id);if(!v)return;b.disabled=true;b.textContent='Eliminando…';S.del=null;eliminar(v).then(function(){S.busy=false;cargar()});return}
    if(a==='delok'){S.delOut=null;return pintar()}
    if(a==='copy'){var t=b.getAttribute('data-v')||(($(b.getAttribute('data-src'))||{}).value||'');
      (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent='Copiado'},function(){var x=$(b.getAttribute('data-src'));if(x)x.select();b.textContent='Selecciona y copia'})}});
  document.addEventListener('input',function(e){if(e.target.id==='admQ'){S.q=e.target.value;pintar()}});
  // Empresa de una cuenta (lista desplegable). Si se pidió un tipo empresarial sin empresa, se guarda junto con la empresa
  document.addEventListener('change',function(e){
    if(e.target.id==='admInvEmp'){S.invEmpId=e.target.value;return}
    var id=e.target.getAttribute&&e.target.getAttribute('data-empsel');if(!id||!S.db)return;var u=porId(id),em=empById(e.target.value);if(!u)return;
    if(!em){if(u.tipo!=='familiar'||S.needEmp===id){e.target.value=u.empresaId;alert('Las cuentas empresariales deben tener empresa.')}return}
    var d={email:u.email,empresaId:em.id,empresa:em.nombre};if(S.needEmp===id){Object.assign(d,accesoTipo(S.needTipo));d.empresaId=em.id;d.empresa=em.nombre;S.needEmp=null}
    S.db.collection('invitaciones').doc(id).set(d,{merge:true}).then(cargarSilencio,function(x){alert('No se pudo guardar: '+(x.code||x.message))})});
  // Crear y renombrar empresas (al renombrar, se actualiza el nombre en todas sus cuentas)
  document.addEventListener('submit',function(e){var f=e.target;
    if(f.id==='admEmpNew'){e.preventDefault();var nm=($('admEmpNom').value||'').trim().replace(/\s+/g,' ');
      if(!nm){S.empMsg='Escribe el nombre de la empresa.';return pintar()}
      if(S.emp.some(function(x){return x.nombre.toLowerCase()===nm.toLowerCase()})){S.empMsg='Ya existe una empresa con ese nombre.';return pintar()}
      S.db.collection('empresas').add({nombre:nm,creada:Date.now(),por:S.me}).then(function(){S.empMsg='Empresa creada: '+nm+'.';cargarSilencio()},function(x){S.empMsg='No se pudo crear: '+(x.code||x.message);pintar()});return}
    if(f.classList&&f.classList.contains('emp-ren')){e.preventDefault();var id=f.getAttribute('data-id'),nn=($('admEmpRen').value||'').trim().replace(/\s+/g,' ');
      if(!nn)return;if(S.emp.some(function(x){return x.id!==id&&x.nombre.toLowerCase()===nn.toLowerCase()})){S.empMsg='Ya existe una empresa con ese nombre.';return pintar()}
      var bt=S.db.batch();bt.update(S.db.collection('empresas').doc(id),{nombre:nn});
      S.users.forEach(function(u){if(u.empresaId===id&&u.inv)bt.update(S.db.collection('invitaciones').doc(u.id),{empresa:nn})});
      bt.commit().then(function(){S.empRen=null;S.empMsg='Empresa renombrada.';cargarSilencio()},function(x){alert('No se pudo renombrar: '+(x.code||x.message))})}});
  document.addEventListener('submit',function(e){if(e.target.id!=='admInv')return;e.preventDefault();var em=$('admInvEm').value.trim().toLowerCase();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){S.invMsg={st:'Escribe un correo válido.'};return pintar()}
    var ex=porId(em);if(ex&&ex.inv&&ex.estado!=='revocado'){S.invMsg={st:'Esa persona ya tiene acceso o una invitación pendiente.',text:invTexto(em)};return pintar()}
    var dat=Object.assign(accesoTipo(S.invTipo),{email:em,estado:'pendiente',invitado:Date.now()}),ie=S.invTipo==='familiar'?null:empById(S.invEmpId);
    if(S.invTipo!=='familiar'&&!ie){S.invMsg={st:'Elige la empresa: las cuentas empresariales deben pertenecer a una.'};return pintar()}
    if(ie){dat.empresaId=ie.id;dat.empresa=ie.nombre}else{dat.empresaId=DEL();dat.empresa=DEL()}
    S.db.collection('invitaciones').doc(em).set(dat,{merge:true})
      .then(function(){S.invMsg={ok:true,st:'Invitación creada para '+em+'. Envíale el mensaje.',text:invTexto(em)};S.busy=false;cargar()},function(x){S.invMsg={st:'No se pudo invitar: '+(x.code||x.message)};pintar()})});

  // Cuenta principal o marcada como administradora (admins/{uid}): ve el panel y las apps solo para administradores
  // (los enlaces con la clase adm-only, como Proyecta)
  var quien=null;
  window.Adm={user:function(u){var uid=u&&u.uid;quien=uid;
    var chk=!u?Promise.resolve(false):window.Uso&&Uso.esAdmin?Uso.esAdmin(firebase.firestore(),u):Promise.resolve(uid===ADMIN_UID);
    chk.then(function(admin){if(quien!==uid)return;document.body.classList.toggle('admin',admin);
      Array.prototype.forEach.call(document.querySelectorAll('.adm-only'),function(e){e.hidden=!admin});
      if(!admin){S.me=null;S.users=[];S.upd=0;return pintar()}
      if(S.me===uid)return;S.me=uid;try{S.db=firebase.firestore()}catch(e){S.err='No se pudo conectar con la base de datos.'}cargar()})}};
})();
