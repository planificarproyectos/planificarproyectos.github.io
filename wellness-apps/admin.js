/* Dashboard de administración de Wellness Apps. Solo aparece con la cuenta administradora (ADMIN_UID); para cualquier
   otra persona el hub queda igual.
   - Lee solo dos colecciones: invitaciones (acceso de cada cuenta) y stats (conteos de uso que guarda /uso.js en cada
     app). Nunca lee el contenido de las personas (registros, entrenos, proyectos…).
   - Mind Focus guardaba antes sus conteos en la raíz de stats/{uid} (sesiones, dias, registros, cronometro, manual,
     analisis, csv): se suman a sus métricas.
   - Acciones: invitar, revocar o reactivar el acceso, aprobar o denegar Proyecta y eliminar los datos de una cuenta.
     La cuenta de inicio de sesión solo se puede borrar en la consola de Firebase (desde la web no hay permisos). */
(function(){
  var ADMIN_UID='AQaEMcKNYfWEhcHVdc8N0ghxeZk1';
  var APPS=(window.Uso&&Uso.APPS)||{mindfocus:'Mind Focus',powerfit:'PowerFit',lumen:'Lumen',proyecta:'Proyecta'};
  var EVENTOS=(window.Uso&&Uso.EVENTOS)||{};
  var DIA=864e5, SUBS=['entradas','config','powerfit','lumen','proyecta','perfil'];
  var S={db:null,me:null,inv:[],stats:{},users:[],upd:0,app:'mindfocus',q:'',sure:'',del:null,delOut:null,invMsg:null,busy:false,err:''};
  var $=function(id){return document.getElementById(id)};
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function nf(n){return (+n||0).toLocaleString('es-CO')}
  function ymd(t){var d=new Date(t);return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
  function fecha(t){return t?new Date(t).toLocaleDateString('es-CO',{day:'numeric',month:'short',year:'numeric'}):'—'}
  function hace(t){if(!t)return 'nunca';var m=Math.round((Date.now()-t)/6e4);if(m<2)return 'ahora';if(m<60)return 'hace '+m+' min';var h=Math.round(m/60);if(h<24)return 'hace '+h+' h';var d=Math.round(h/24);return d<31?'hace '+d+' d':fecha(t)}
  function sum(o){var s=0;for(var k in o)s+=+o[k]||0;return s}
  function lastDay(dias){var k=Object.keys(dias||{}).filter(function(x){return dias[x]>0}).sort();return k.length?Date.parse(k[k.length-1]+'T12:00:00'):0}

  /* Métricas de una app para una cuenta: {sesiones, ultimoUso, dias, ev}. En Mind Focus se suman los conteos antiguos */
  function appData(st,app){st=st||{};var a=(st.apps&&st.apps[app])||{},r={sesiones:+a.sesiones||0,ultimoUso:+a.ultimoUso||0,dias:Object.assign({},a.dias||{}),ev:Object.assign({},a.ev||{})};
    if(app==='mindfocus'){r.sesiones+=+st.sesiones||0;
      for(var d in (st.dias||{}))r.dias[d]=(r.dias[d]||0)+(+st.dias[d]||0);
      [['registros','registro'],['cronometro','cronometro'],['manual','manual'],['analisis','analisis'],['csv','csv']].forEach(function(p){if(st[p[0]])r.ev[p[1]]=(r.ev[p[1]]||0)+(+st[p[0]]||0)});
      if(!r.ultimoUso)r.ultimoUso=lastDay(st.dias)}
    return r}
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

  function porApp(){var a=S.app,now=Date.now(),us=S.users.filter(function(u){return usaApp(u.apps[a])}),ses=0,ev={},dias=[];
    us.forEach(function(u){var d=u.apps[a];ses+=d.sesiones;for(var k in d.ev)ev[k]=(ev[k]||0)+(+d.ev[k]||0)});
    for(var i=29;i>=0;i--){var k=ymd(now-i*DIA);dias.push({k:k,n:us.filter(function(u){return (u.apps[a].dias[k]||0)>0}).length})}
    var act=function(n){return us.filter(function(u){return u.apps[a].ultimoUso>now-n*DIA||Object.keys(u.apps[a].dias).some(function(k){return u.apps[a].dias[k]>0&&Date.parse(k+'T23:59:59')>now-n*DIA})}).length};
    var h='<section class="card wide"><h3>Por <span>aplicación</span></h3><p class="sub">Uso de cada app. Solo se cuentan veces; nunca se lee lo que cada persona registra.</p><div class="chips" role="group" aria-label="Aplicación">'
      +Object.keys(APPS).map(function(k){return '<button class="chip" type="button" data-adm="app" data-k="'+k+'" aria-pressed="'+(k===a)+'">'+esc(APPS[k])+'</button>'}).join('')+'</div>';
    if(!us.length)return h+'<div class="empty">Aún no hay datos de uso de '+esc(APPS[a])+'; se empiezan a medir desde esta versión.</div></section>';
    var mx=Math.max.apply(null,dias.map(function(d){return d.n}).concat([1])),evs=Object.keys(ev).filter(function(k){return ev[k]>0}).sort(function(x,y){return ev[y]-ev[x]}),me=evs.length?ev[evs[0]]:1;
    h+='<div class="kpis">'+kpi(nf(us.length),'Personas que la usan')+kpi(nf(act(7)),'Activas 7 días')+kpi(nf(act(30)),'Activas 30 días')+kpi(nf(ses),'Sesiones')+'</div>'
      +'<div class="lbl">Personas activas por día · últimos 30 días</div><div class="bars" role="img" aria-label="Personas activas por día en los últimos 30 días">'
      +dias.map(function(d){return '<i'+(d.n?'':' class="z"')+' style="height:'+Math.max(2,d.n/mx*100)+'%" title="'+fecha(Date.parse(d.k+'T12:00:00'))+': '+d.n+'"></i>'}).join('')
      +'</div><div class="bars-x"><span>'+fecha(Date.parse(dias[0].k+'T12:00:00'))+'</span><span>Máx. '+mx+' al día</span><span>Hoy</span></div>'
      +'<div class="lbl">Funciones más usadas</div>'
      +(evs.length?'<div class="hbars">'+evs.map(function(k){return '<div class="hbar"><span>'+esc((EVENTOS[a]||{})[k]||k)+'</span><b>'+nf(ev[k])+'</b><div class="tr"><i style="width:'+(ev[k]/me*100)+'%"></i></div></div>'}).join('')+'</div>'
        :'<div class="empty">Aún no hay funciones medidas en '+esc(APPS[a])+'; se empiezan a contar desde esta versión.</div>');
    return h+'</section>'}

  function ranking(){var r=S.users.map(function(u){var per={},t=0;Object.keys(APPS).forEach(function(a){var n=actividad(u.apps[a],a);if(n){per[a]=n;t+=n}});return {u:u,per:per,t:t}})
      .filter(function(x){return x.t>0}).sort(function(a,b){return b.t-a.t}).slice(0,10);
    return '<section class="card"><h3>Usuarios con más <span>actividad</span></h3><p class="sub">Suma de lo que cada persona hizo en todas las apps (registros, entrenos, oraciones, proyectos…).</p>'
      +(r.length?'<div class="rank">'+r.map(function(x){return '<div class="rk"><div style="min-width:0"><div class="em">'+esc(x.u.email)+'</div><small>'
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
      +'<div class="searchrow"><label class="field"><input id="admQ" type="search" placeholder="Buscar por correo" value="'+esc(S.q)+'" autocomplete="off" aria-label="Buscar cuenta por correo"></label><span class="adm-upd">'+L.length+' de '+S.users.length+'</span></div>';
    if(S.delOut)h+=resultadoEliminar();
    h+='<div class="ulist">'+(L.length?L.map(cuentaRow).join(''):'<div class="empty">Ninguna cuenta coincide.</div>')+'</div>';
    return h+invitar()+'</section>'}
  function cuentaRow(u){var apps=Object.keys(APPS).filter(function(a){return usaApp(u.apps[a])}),ses=0;apps.forEach(function(a){ses+=u.apps[a].sesiones});
    var i=u.inv||{},desde=i.activado||i.invitado,acts='';
    if(!u.admin&&u.inv){
      if(u.estado==='revocado')acts+='<button class="sbtn" data-adm="react" data-id="'+esc(u.id)+'">Reactivar</button>';
      else acts+='<button class="sbtn warn'+(S.sure==='rev:'+u.id?' sure':'')+'" data-adm="rev" data-id="'+esc(u.id)+'">'+(S.sure==='rev:'+u.id?'¿Seguro? Toca de nuevo':'Revocar acceso')+'</button>';
    }
    if(!u.admin)acts+='<button class="sbtn warn" data-adm="del" data-id="'+esc(u.id)+'">Eliminar datos</button>';
    var h='<div class="urow"><div class="top"><span class="em">'+esc(u.email)+'</span>'+pill(u)+'</div>'
      +'<div class="meta"><span>'+(i.autoregistro?'Se registró solo':i.invitado?'Invitado':'Cuenta')+(desde?' · '+fecha(+desde):'')+'</span><span>Último uso: '+hace(u.last)+'</span><span>Sesiones: '+nf(ses)+'</span>'
      +(i.proyecta?'<span>Proyecta: '+esc(i.proyecta)+'</span>':'')+'</div>'
      +(apps.length?'<div class="row2">'+apps.map(function(a){return '<span class="tag">'+esc(APPS[a])+'</span>'}).join('')+'</div>':'')
      +(acts?'<div class="acts">'+acts+'</div>':'');
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

  function pintar(){var el=$('adm');if(!el)return;if(!S.me){el.hidden=true;el.innerHTML='';return}
    var f=document.activeElement&&document.activeElement.id,pos=f==='admQ'?document.activeElement.selectionStart:null;
    el.hidden=false;
    el.innerHTML='<div class="adm-head wide"><div><div class="kicker">Solo administración</div><h2>Panel de <span>control</span></h2></div><div class="adm-upd"><span>'+(S.busy?'Cargando…':S.upd?'Actualizado '+new Date(S.upd).toLocaleTimeString('es-CO',{hour:'numeric',minute:'2-digit'}):'')+'</span><button class="sbtn" data-adm="load" type="button"'+(S.busy?' disabled':'')+'>Actualizar</button></div></div>'
      +(S.err?'<div class="empty wide" role="alert">'+esc(S.err)+'</div>':'')
      +(S.upd?resumen()+porApp()+ranking()+solicitudes()+cuentas():'');
    if(f==='admQ'){var q=$('admQ');if(q){q.focus();if(pos!=null)q.setSelectionRange(pos,pos)}}}

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
    if(a==='pry')return upd(id,{proyecta:b.getAttribute('data-v'),proyectaRes:Date.now()});
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
