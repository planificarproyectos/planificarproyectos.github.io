/* Lumen — app principal */
(function(){
'use strict';
var L=window.Liturgia;

/* ---------- Íconos ---------- */
var IP={
 x:'M6 6l12 12M18 6 6 18', share:'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v12M7 8l5-5 5 5', cal:'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4', plan:'M5 4h14v16H5zM9 9h6M9 13h6M9 17h3',
 apps:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
 chat:'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5A8 8 0 1 1 21 12z', bulb:'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z',
 key:'M15 7a4 4 0 1 1-3.9 5H7v3H4v-3H2v-3h9.1A4 4 0 0 1 15 7z', out:'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10', trash:'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13', dl:'M12 4v11M7 10l5 5 5-5M5 20h14',
 home:'M3 11l9-7 9 7v9h-6v-6H9v6H3z', rosary:'M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 14v8M9 18h6',
 church:'M12 2v4M10 4h4M5 21V11l7-5 7 5v10M9 21v-5a3 3 0 0 1 6 0v5M3 21h18',
 book:'M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h12M12 7v6M9.5 9.5h5', user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
 check:'M5 12l5 5 9-10', back:'M15 6l-6 6 6 6', undo:'M4 4v6h6M5 15a8 8 0 1 0 2-8L4 10', speaker:'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12',
 stop:'M7 7h10v10H7z', pause:'M8 5v14M16 5v14', search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4', down:'M6 9l6 6 6-6',
 sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4', lock:'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4', chevR:'M9 6l6 6-6 6', chevL:'M15 6l-6 6 6 6', copy:'M8 8h12v12H8zM4 16V4h12'
};
function ic(n,s,w){ s=s||20; w=w||2;
 if(n==='play') return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>';
 return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+IP[n]+'"/></svg>'; }
function logo(s){ return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 32 32" role="img" aria-label="Lumen"><circle cx="16" cy="16" r="13" fill="none" stroke="var(--accent)" stroke-width="2"/><path d="M16 6v20M10 12h12" stroke="var(--fg)" stroke-width="3" stroke-linecap="round"/></svg>'; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function $(id){ return document.getElementById(id); }

/* ---------- Fechas ---------- */
var DAYS=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
var MONTHS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function dkey(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
var NOW=new Date(), TODAY=dkey(NOW);
function longDate(d){ var s=DAYS[d.getDay()]+', '+d.getDate()+' de '+MONTHS[d.getMonth()]; return s.charAt(0).toUpperCase()+s.slice(1); }
function greet(){ var h=new Date().getHours(); return h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches'; }

/* ---------- Toast ---------- */
var tt; function toast(m,ms){ var t=$('toast'); t.textContent=m; t.hidden=false; clearTimeout(tt); tt=setTimeout(function(){ t.hidden=true; },ms||2200); }

/* ---------- Colores ---------- */
var ACCENTS={lima:['Lima','#C6F432','#4D7A00'],dorado:['Dorado','#E3B95B','#8A6510'],azul:['Azul','#3D8BFF','#1F5FD1'],naranja:['Naranja','#FF8A1F','#B35400'],rosa:['Rosa','#FF4FA3','#C2186B'],cian:['Cian','#22E0E0','#007C85'],morado:['Morado','#A97BFF','#6A3FD1'],amarillo:['Amarillo','#FFD60A','#8A6D00'],coral:['Coral','#FF5A5F','#C62828'],mariano:['Mariano','#7FA7E6','#2F5FA8']};

/* ---------- Estado guardado ---------- */
var BASE={name:'',accent:'lima',mode:'dark',rate:1,voice:'',guided:false,done:{},ros:{},plans:{},rem:null}, S={};
function KEY(){ return 'lumen:v1'+(Cloud.user?':'+Cloud.user.uid:''); }
function loadLocal(){ S=JSON.parse(JSON.stringify(BASE)); try{ var t=JSON.parse(localStorage.getItem('lumen:theme')||'null'); if(t){ S.accent=t.accent||S.accent; S.mode=t.mode||S.mode; } var raw=localStorage.getItem(KEY()); if(raw){ var o=JSON.parse(raw); for(var k in o) S[k]=o[k]; } }catch(e){} }
function saveLocal(){ try{ localStorage.setItem(KEY(),JSON.stringify(S)); localStorage.setItem('lumen:theme',JSON.stringify({accent:S.accent,mode:S.mode})); }catch(e){} }
function save(){ saveLocal(); Cloud.push(); }
function prune(o,days){ var lim=dkey(new Date(Date.now()-days*864e5)), r={}; for(var k in o) if(k.slice(0,10)>=lim) r[k]=o[k]; return r; }

/* ---------- Cuenta (Firebase, mismo proyecto que Mind Focus y PowerFit) ---------- */
var Cloud={auth:null,db:null,user:null,wait:false,ref:null,unsub:null,prof:null,unsubP:null,perfilOk:false,t:null,noAccess:false,loginPending:false,
 init:function(){
  var self=this;
  if(!window.firebase||!window.FIREBASE_CONFIG) return; // sin Firebase: funciona solo en este navegador
  try{ firebase.initializeApp(window.FIREBASE_CONFIG); self.auth=firebase.auth(); self.auth.languageCode='es'; self.db=firebase.firestore(); }catch(e){ console.warn(e); self.auth=null; return; }
  try{ self.db.enablePersistence({synchronizeTabs:true}).catch(function(){}); }catch(e){}
  self.wait=true;
  self.auth.onAuthStateChanged(function(u){
   self.wait=false; if(self.unsub){ self.unsub(); self.unsub=null; } if(self.unsubP){ self.unsubP(); self.unsubP=null; } self.perfilOk=false; self.prof=null; clearTimeout(self.t);
   if(!u){ self.user=null; self.ref=null; self.noAccess=false; loadLocal(); applyTheme(); render(); return; }
   if(self.loginPending){ self.loginPending=false; playSplash(); }
   self.user={email:u.email,uid:u.uid,created:u.metadata&&Date.parse(u.metadata.creationTime)}; self.noAccess=false; loadLocal(); applyTheme(); U.tab='home';
   self.ref=self.db.collection('users').doc(u.uid).collection('lumen').doc('data');
   render();
   var me=u.uid;
   self.ensureAccess(u).then(function(ok){ if(!self.user||self.user.uid!==me) return; if(!ok){ self.noAccess=true; render(); return; } self.sub(); });
  });
 },
 ensureAccess:function(u){
  // Autorregistro: mismo esquema de Mind Focus y PowerFit; revocado = sin acceso.
  var em=(u.email||'').toLowerCase(), ref=this.db.collection('invitaciones').doc(em), now=Date.now();
  return ref.get().then(function(sn){
   if(!sn.exists) return ref.set({email:em,estado:'activo',uid:u.uid,activado:now,ultimoUso:now,autoregistro:true}).then(function(){return true;});
   var d=sn.data()||{}; if(d.estado==='revocado') return false;
   var upd={estado:'activo',uid:u.uid,ultimoUso:now}; if(!d.activado) upd.activado=now;
   return ref.update(upd).then(function(){return true;},function(){return true;});
  }).catch(function(e){ console.warn('acceso',e); return true; });
 },
 sub:function(){
  var self=this, first=true;
  // Perfil compartido Wellness Apps: users/{uid}/perfil/datos (nombre). Tema y color siguen siendo propios de Lumen.
  self.prof=self.db.collection('users').doc(self.user.uid).collection('perfil').doc('datos');
  self.unsubP=self.prof.onSnapshot(function(sn){ var d=sn.exists?sn.data():null;
   if(d&&typeof d.nombre==='string'){ self.perfilOk=true; if(d.nombre!==S.name){ S.name=d.nombre; saveLocal(); var a=document.activeElement; if(!(a&&(a.id==='bq'||a.id==='nm'))) render(); } return; }
   if(!self.perfilOk){ self.perfilOk=true; if(S.name) self.prof.set({nombre:S.name,upd:Date.now()},{merge:true}).catch(function(){}); }
  },function(){});
  self.unsub=self.ref.onSnapshot(function(sn){
   if(first){ first=false; if(!sn.exists){ self.push(true); return; } }
   if(!sn.exists||sn.metadata.hasPendingWrites) return;
   var d=sn.data()||{};
   ['done','ros','name','guided','rate','accent','mode','plans','rem'].forEach(function(k){ if(d[k]!==undefined&&!(k==='name'&&(self.perfilOk||!d[k]))) S[k]=d[k]; });
   saveLocal(); applyTheme();
   var a=document.activeElement; if(!(a&&(a.id==='bq'||a.id==='nm'))) render();
  },function(e){ console.warn('firestore',e); if(e&&e.code==='permission-denied'){ self.noAccess=true; render(); } else toast('No se pudo leer tu cuenta. Revisa tu conexión.'); });
 },
 push:function(now){
  if(!this.ref||this.noAccess) return; var self=this; clearTimeout(this.t);
  this.t=setTimeout(function(){ if(!self.ref) return;
   self.ref.set({done:prune(S.done,400),ros:prune(S.ros,7),name:S.name,guided:S.guided,rate:S.rate,accent:S.accent,mode:S.mode,plans:S.plans||{},rem:S.rem||null,upd:Date.now()})
    .catch(function(){ toast('No se pudo guardar en tu cuenta. Revisa tu conexión.'); }); },now?0:600);
 },
 wipe:function(){ if(this.ref) this.ref.delete().catch(function(){}); },
 pushName:function(v){ if(!this.prof){ toast('Nombre guardado'); return; }
  this.prof.set({nombre:v,upd:Date.now()},{merge:true}).then(function(){ toast('Nombre guardado para Mind Focus, PowerFit y Lumen'); },function(){ toast('Guardado en Lumen; no se pudo compartir con las otras apps.'); }); }
};
loadLocal();
function applyTheme(){
 var c=ACCENTS[S.accent]||ACCENTS.lima, light=S.mode==='light', r=document.documentElement;
 r.setAttribute('data-theme',light?'light':'dark');
 r.style.setProperty('--accent',c[1]); r.style.setProperty('--accent-fg',light?c[2]:c[1]);
 var m=document.querySelector('meta[name=theme-color]'); if(m) m.setAttribute('content',light?'#F3F2EE':'#111315');
 var f=$('fav'); if(f) f.setAttribute('href','data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="11" fill="#111315"/><circle cx="24" cy="24" r="15" fill="none" stroke="'+c[1]+'" stroke-width="3.5"/><path d="M24 12v24M17 19h14" stroke="#F2F2EE" stroke-width="4.5" stroke-linecap="round"/></svg>'));
}
applyTheme();

/* ---------- Rutina y racha ---------- */
function doneToday(){ return S.done[TODAY]||[]; }
function isDone(id){ return doneToday().indexOf(id)>=0; }
function setDone(id,on){ var a=doneToday().slice(), i=a.indexOf(id); if(on&&i<0)a.push(id); if(!on&&i>=0)a.splice(i,1); S.done[TODAY]=a; save(); }
function streak(){ var n=0, d=new Date(); if(!(S.done[dkey(d)]||[]).length) d.setDate(d.getDate()-1);
 while((S.done[dkey(d)]||[]).length){ n++; d.setDate(d.getDate()-1); } return n; }

/* ---------- Voz (lectura en voz alta) ----------
   Compatible con Android (Chrome) y iPhone (Safari): lee por frases cortas, arranca en el mismo toque,
   reintenta si el motor no empezó y elige automáticamente la mejor voz en español. */
var TTS_DONE=null;
var TTS=('speechSynthesis' in window)&&typeof SpeechSynthesisUtterance!=='undefined', speaking=null, Q=[], QI=0, gen=0, started=false, watch=null;
window.__lumenUtt=[];
function voices(){ if(!TTS) return []; try{ return speechSynthesis.getVoices().filter(function(v){ return /^es([-_]|$)/i.test(v.lang||''); }); }catch(e){ return []; } }
var VPREF={'es-co':12,'es-mx':11,'es-us':10,'es-419':10,'es-es':8};
var NOVELTY=/eddy|flo\b|grandma|grandpa|reed|rocko|sandy|shelley|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|espeak/i;
function voiceScore(v){ var n=(v.name||'')+' '+(v.voiceURI||''), sc=VPREF[(v.lang||'').replace('_','-').toLowerCase()]||5;
 if(/premium/i.test(n)) sc+=60; else if(/enhanced|mejorad/i.test(n)) sc+=45;
 if(/neural|natural|online/i.test(n)) sc+=40;
 if(/google/i.test(n)) sc+=35;
 if(/siri/i.test(n)) sc+=30;
 if(/compact/i.test(n)) sc-=15;
 if(NOVELTY.test(n)) sc-=80;
 return sc; }
function rankedVoices(){ return voices().slice().sort(function(a,b){ return voiceScore(b)-voiceScore(a); }); }
function pickVoice(){
 var vs=rankedVoices(); if(!vs.length) return null;
 if(S.voice){ var m=vs.filter(function(x){ return x.name===S.voice; })[0]; if(m) return m; }
 return vs[0];
}
function chunks(t){
 var parts=String(t||'').replace(/\s+/g,' ').trim().match(/[^.!?;:]+[.!?;:]*/g)||[], out=[];
 parts.forEach(function(p){ p=p.trim(); if(!p) return;
  while(p.length>180){ var cut=p.lastIndexOf(',',180); if(cut<60) cut=p.lastIndexOf(' ',180); if(cut<1) cut=180; out.push(p.slice(0,cut+1).trim()); p=p.slice(cut+1).trim(); }
  if(p) out.push(p); });
 return out;
}
function isIOS(){ var u=navigator.userAgent||''; return /iphone|ipad|ipod/i.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1); }
function ttsHelp(){
 if(!TTS) return toast('Este navegador no tiene lectura en voz alta. Abre Lumen en Chrome (Android) o Safari (iPhone).',6000);
 if(isIOS()) return toast('No se escucha: quita el modo silencio del iPhone y sube el volumen. Si sigue igual, revisa Ajustes › Accesibilidad › Contenido leído › Voces › Español.',8000);
 toast('No se escucha: sube el volumen multimedia y revisa Ajustes › Idioma › Salida de texto a voz (motor de Google con español instalado).',8000);
}
function speakRoot(){ var id=speaking||'';
 if(/^misa:/.test(id)) return document.querySelector('[data-part="'+id.slice(5)+'"]');
 if(/^(ros-|rosa:)/.test(id)) return document.querySelector('.prayer');
 if(/^pray-/.test(id)) return document.querySelector('#app .wrap');
 if(id==='frase') return document.querySelector('.quote');
 if(/^cap-/.test(id)) return document.querySelector('.reader');
 return null; }
function clearMark(){ var ms=document.querySelectorAll('mark.speakmark'); for(var i=0;i<ms.length;i++){ var m=ms[i], par=m.parentNode; while(m.firstChild) par.insertBefore(m.firstChild,m); par.removeChild(m); par.normalize(); } }
function markChunk(ch){
 try{ clearMark(); var root=speakRoot(); if(!root||!ch) return;
  var key=ch.replace(/^[\s.,;:¡¿]+/,'').slice(0,24); if(key.length<3) return;
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null), n;
  while((n=w.nextNode())){ var k=n.nodeValue.indexOf(key); if(k<0) continue;
   var end=Math.min(n.nodeValue.length,k+ch.trim().length), r=document.createRange(); r.setStart(n,k); r.setEnd(n,end);
   var mk=document.createElement('mark'); mk.className='speakmark'; r.surroundContents(mk); break; }
 }catch(e){}
}
function sayNext(my){
 if(my!==gen) return;
 if(QI>=Q.length){ var fin=speaking; clearMark(); speaking=null; if(AUD&&AUD.kind==='say'&&AUD.id===fin) AUD=null; updSay(); var cb=TTS_DONE; TTS_DONE=null; if(cb) cb(); return; }
 markChunk(Q[QI]);
 var u=new SpeechSynthesisUtterance(Q[QI]), v=pickVoice();
 if(v){ u.voice=v; u.lang=v.lang; } else u.lang='es-ES';
 u.rate=S.rate||1; u.pitch=1; u.volume=1;
 u.onstart=function(){ if(my===gen) started=true; };
 u.onend=function(){ if(my!==gen) return; started=true; var last=Q[QI]||''; QI++; setTimeout(function(){ sayNext(my); },/[.!?]$/.test(last)?320:(/[;:]$/.test(last)?220:90)); };
 u.onerror=function(e){ if(my!==gen) return; var er=e&&e.error; if(er==='interrupted'||er==='canceled') return;
  if(er==='not-allowed'||er==='audio-busy'||er==='synthesis-unavailable'||er==='language-unavailable'||er==='voice-unavailable'){ if(!started){ speaking=null; updSay(); ttsHelp(); return; } }
  QI++; sayNext(my); };
 window.__lumenUtt.push(u); if(window.__lumenUtt.length>40) window.__lumenUtt.shift(); // evita que el navegador descarte la frase en curso
 try{ speechSynthesis.speak(u); if(speechSynthesis.paused) speechSynthesis.resume(); }catch(e){}
}
function speak(text,id,done,from){
 if(!/^misa:/.test(id||'')) M.playing=false;
 if(!/^rosa:/.test(id||'')) R.playing=false;
 if(!TTS){ ttsHelp(); return; }
 if(speaking===id){ stopSpeak(); if(AUD&&AUD.id===id&&AUD.kind==='say') AUD=null; updSay(); return; }
 TTS_DONE=done||null;
 var ss=window.speechSynthesis; gen++; var my=gen; clearTimeout(watch);
 try{ if(ss.speaking||ss.pending) ss.cancel(); }catch(e){}
 audStart(text,id);
 Q=chunks(text); QI=Math.max(0,Math.min(from||0,Q.length-1)); started=false; speaking=id; updSay();
 if(!Q.length){ speaking=null; updSay(); return; }
 sayNext(my); // en el mismo toque (requisito de iPhone)
 watch=setTimeout(function(){ // Android a veces ignora la primera orden: reintenta una vez
  if(my!==gen||started) return;
  try{ ss.cancel(); }catch(e){} gen++; my=gen; QI=0; sayNext(my);
  watch=setTimeout(function(){ if(my===gen&&!started&&!ss.speaking){ gen++; speaking=null; updSay(); ttsHelp(); } },3000);
 },450);
}
function stopSpeak(){ clearMark(); TTS_DONE=null; gen++; clearTimeout(watch); if(TTS){ try{ speechSynthesis.cancel(); }catch(e){} } speaking=null; }
if(TTS){ try{ speechSynthesis.getVoices(); }catch(e){} }

function sayBtn(id,label){ var on=speaking===id; return '<button class="say'+(on?' on':'')+'" data-a="say" data-id="'+id+'" data-l="'+esc(label||'Escuchar')+'" aria-pressed="'+on+'">'+ic(on?'stop':'speaker',16)+'<span>'+(on?'Detener':(label||'Escuchar'))+'</span></button>'; }
function updSay(){ var bs=document.querySelectorAll('[data-a=say]'); for(var i=0;i<bs.length;i++){ var b=bs[i], on=b.getAttribute('data-id')===speaking; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); b.innerHTML=ic(on?'stop':'speaker',16)+'<span>'+(on?'Detener':(b.getAttribute('data-l')||'Escuchar'))+'</span>'; }
 updMass(); updRos(); syncWake(); if(POCKET) pocketNow(); updFloat(); }

/* ---------- Reproductor flotante ----------
   Recuerda lo último que se escucha (Misa, Rosario o una lectura) y, al cambiar de sección, muestra un botón flotante
   del color de énfasis para pausar, reanudar, volver a esa sección o detener. La Misa y el Rosario reanudan desde la
   parte en curso; las demás lecturas, desde la frase donde se pausó. */
var AUD=null;
function audActive(){ return !!speaking||M.playing||R.playing; }
function audStart(text,id){ if(id==='test') return;
 var keep=AUD&&AUD.id===id?AUD:null, kind=/^misa:/.test(id)?'misa':/^rosa:/.test(id)?'rosa':'say';
 var tab=kind==='misa'?'misa':kind==='rosa'?'rosary':/^cap-/.test(id)?'bible':/^pray-/.test(id)?'pray':'home';
 var label='Lectura';
 if(id==='frase') label='Frase del día';
 else if(/^cap-/.test(id)){ var a=id.slice(4).split(':'); label=((IDX[+a[0]-1]||[])[0]||'Biblia')+' '+a[1]; }
 else if(/^pray-/.test(id)) label=((PRAY[id.slice(5)]||{}).t)||'Oración';
 AUD={kind:kind,id:id,text:text,tab:keep?keep.tab:tab,label:label,bk:keep?keep.bk:U.bk,ch:keep?keep.ch:U.ch,pid:keep?keep.pid:U.pid,qi:0,paused:false}; }
function audLabel(){
 if(AUD.kind==='misa'){ var p=massParts()[M.idx]; return 'Misa · '+((p&&p.h)||'Parte '+(M.idx+1)); }
 if(AUD.kind==='rosa'){ var st=STEPS[rosI()]; return 'Rosario · '+(st?stepTitle(st):'Completado'); }
 return AUD.label; }
function audHere(){ if(!AUD) return false;
 if(AUD.tab==='bible') return U.tab==='bible'&&U.bk===AUD.bk&&U.ch===AUD.ch;
 if(AUD.tab==='pray') return U.tab==='pray'&&U.pid===AUD.pid;
 return U.tab===AUD.tab; }
function updFloat(){
 if(AUD&&AUD.kind==='say'&&!speaking&&!AUD.paused) AUD=null;
 var el=$('afloat');
 if(!el){ el=document.createElement('div'); el.id='afloat'; el.hidden=true; el.setAttribute('role','region'); el.setAttribute('aria-label','Reproductor de Lumen'); document.body.appendChild(el); }
 var show=!!AUD&&!audHere()&&!needAuth();
 document.body.classList.toggle('afon',show);
 if(!show){ el.hidden=true; return; }
 var on=audActive();
 el.innerHTML='<button class="af-pp" data-a="afToggle" aria-label="'+(on?'Pausar':'Reanudar')+'">'+ic(on?'pause':'play',20,2.6)+'</button>'+
  '<button class="af-go" data-a="afGo" aria-label="Ir a lo que suena"><small>'+(on?'Escuchando':'En pausa')+'</small><b>'+esc(audLabel())+'</b></button>'+
  '<button class="af-x" data-a="afStop" aria-label="Detener">'+ic('x',18,2.4)+'</button>';
 el.hidden=false; }
function audToggle(){ if(!AUD) return;
 if(audActive()){
  if(AUD.kind==='misa') M.stop();
  else if(AUD.kind==='rosa'){ R.playing=false; stopSpeak(); updSay(); }
  else { AUD.qi=QI; AUD.paused=true; stopSpeak(); updSay(); }
  return; }
 if(AUD.kind==='misa') M.play(M.idx);
 else if(AUD.kind==='rosa') R.play();
 else speak(AUD.text,AUD.id,null,AUD.qi); }
function audGo(){ if(!AUD) return;
 if(AUD.tab==='bible'){ U.bk=AUD.bk; U.ch=AUD.ch; }
 if(AUD.tab==='pray') U.pid=AUD.pid;
 go(AUD.tab); }
function audStop(){ if(!AUD) return;
 if(AUD.kind==='misa') M.stop(); else { R.playing=false; stopSpeak(); }
 AUD=null; updSay(); }
/* Modo bolsillo: pantalla negra que ignora toques; se desbloquea manteniendo presionado */
var POCKET=false, pkT=null;
function pocketNow(){ var t='';
 if(M.playing){ var ps=massParts(); t=(ps[M.idx]||{}).h||'Misa'; }
 else if(R.playing){ var st=STEPS[rosI()]; t=st?stepTitle(st):'Rosario'; }
 else if(speaking) t='Escuchando';
 else t='En pausa';
 var el=$('pkNow'); if(el) el.textContent=t; }
function pocketOn(){ var o=$('pocket'); if(!o) return; POCKET=true; o.hidden=false; pocketNow(); syncWake(); }
function pocketOff(){ var o=$('pocket'); if(o) o.hidden=true; POCKET=false; o.classList.remove('hold'); syncWake(); }
(function(){ var o=document.getElementById('pocket'); if(!o) return;
 function stop(e){ e.preventDefault(); e.stopPropagation(); }
 ['click','dblclick','contextmenu','touchmove','wheel'].forEach(function(ev){ o.addEventListener(ev,stop,{passive:false}); });
 o.addEventListener('pointerdown',function(e){ stop(e); o.classList.add('hold'); clearTimeout(pkT); pkT=setTimeout(function(){ pocketOff(); if(navigator.vibrate) try{ navigator.vibrate(30); }catch(x){} },2000); });
 ['pointerup','pointercancel','pointerleave'].forEach(function(ev){ o.addEventListener(ev,function(e){ clearTimeout(pkT); o.classList.remove('hold'); }); });
})();
/* Pantalla encendida mientras se escucha (Wake Lock) */
var WL=null, wlBusy=false;
function syncWake(){
 var want=!!speaking||M.playing||R.playing||POCKET;
 if(!('wakeLock' in navigator)) return;
 if(want&&!WL&&!wlBusy&&document.visibilityState==='visible'){ wlBusy=true;
  navigator.wakeLock.request('screen').then(function(l){ wlBusy=false; WL=l; l.addEventListener('release',function(){ if(WL===l) WL=null; }); if(!(speaking||M.playing||R.playing)){ l.release().catch(function(){}); } })
   .catch(function(){ wlBusy=false; }); }
 else if(!want&&WL){ var l=WL; WL=null; l.release().catch(function(){}); }
}
document.addEventListener('visibilitychange',function(){ if(document.visibilityState!=='visible') return;
 setTimeout(function(){ var ss=window.speechSynthesis; if((M.playing||R.playing||speaking)&&ss&&!ss.speaking&&!ss.pending){ if(AUD&&AUD.kind==='say'){ AUD.qi=QI; AUD.paused=true; } gen++; M.playing=false; R.playing=false; speaking=null; updSay(); toast('El audio se detuvo al salir de Lumen. Toca ▶ para continuar donde ibas.',5000); } else syncWake(); },700); });

/* ---------- Oraciones ---------- */
var PR={
 pn:'Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.',
 am:'Dios te salve, María, llena eres de gracia; el Señor es contigo. Bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.',
 gl:'Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.',
 ag:'Ángel de mi guarda, dulce compañía, no me desampares ni de noche ni de día. No me dejes solo, que me perdería. Amén.'
};
PR.salve='Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra; Dios te salve. A ti llamamos los desterrados hijos de Eva; a ti suspiramos, gimiendo y llorando en este valle de lágrimas. Ea, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos, y después de este destierro muéstranos a Jesús, fruto bendito de tu vientre. Oh clementísima, oh piadosa, oh dulce Virgen María. Ruega por nosotros, santa Madre de Dios, para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo. Amén.';
PR.fatima='Oh Jesús mío, perdona nuestros pecados, líbranos del fuego del infierno, lleva al cielo a todas las almas, especialmente a las más necesitadas de tu misericordia.';
PR.cruz='Por la señal de la santa cruz, de nuestros enemigos líbranos, Señor, Dios nuestro. En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.';
PR.ofr='Señor mío y Dios mío, te ofrezco este día: lo que piense, diga y haga, mis alegrías y mis cansancios. Úneme a tu Hijo Jesús y haz que todo sea para tu gloria y el bien de los demás. Santa María, Madre mía, y mi ángel de la guarda, acompáñenme hoy. Amén.';
PR.contri='Jesús, mi Señor y Redentor, me arrepiento de todo corazón de mis pecados, porque te ofenden a ti, que eres tan bueno. Con la ayuda de tu gracia propongo no volver a pecar, confesarme y reparar el mal que haya hecho. Perdóname, Señor, por tu infinita misericordia. Amén.';
PR.angelus=['El ángel del Señor anunció a María. Y concibió por obra del Espíritu Santo.','He aquí la esclava del Señor. Hágase en mí según tu palabra.','Y el Verbo se hizo carne. Y habitó entre nosotros.'];
PR.angelusFin='Ruega por nosotros, santa Madre de Dios, para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo. Oremos: Señor, derrama tu gracia en nuestros corazones; que, habiendo conocido por el anuncio del ángel la encarnación de tu Hijo, por su pasión y su cruz lleguemos a la gloria de la resurrección. Por Jesucristo, nuestro Señor. Amén.';
PR.regina='Reina del cielo, alégrate, aleluya. Porque el que mereciste llevar en tu seno, aleluya, ha resucitado según su palabra, aleluya. Ruega por nosotros a Dios, aleluya. Gózate y alégrate, Virgen María, aleluya, porque en verdad ha resucitado el Señor, aleluya. Oremos: Dios nuestro, que por la resurrección de tu Hijo llenaste de alegría al mundo, concédenos, por intercesión de la Virgen María, alcanzar los gozos de la vida eterna. Por Cristo, nuestro Señor. Amén.';
PR.cor1='Padre Eterno, te ofrezco el Cuerpo y la Sangre, el Alma y la Divinidad de tu amadísimo Hijo, nuestro Señor Jesucristo, como propiciación de nuestros pecados y los del mundo entero.';
PR.cor2='Por su dolorosa Pasión, ten misericordia de nosotros y del mundo entero.';
PR.cor3='Santo Dios, Santo Fuerte, Santo Inmortal, ten piedad de nosotros y del mundo entero.';
PR.examen=['Ponte en presencia de Dios. Respira despacio y recuerda que Él te mira con amor.','Da gracias. Piensa en los regalos de este día, grandes y pequeños, y agradécelos.','Pide luz al Espíritu Santo para ver tu día con sus ojos.','Repasa el día hora por hora: ¿dónde amaste?, ¿dónde te faltó paciencia, verdad o generosidad?','Pide perdón por tus faltas con un acto de contrición.','Haz un propósito sencillo y concreto para mañana y ponlo en manos de Dios.'];

/* ---------- Biblia católica (73 libros) ----------
   1-66: Reina-Valera 1909 (dominio público). 17 Ester y 27 Daniel con sus partes griegas, y 67-73 (Tobías, Judit,
   1 y 2 Macabeos, Sabiduría, Eclesiástico y Baruc) de la Santa Biblia libre para el mundo (eBible.org, dominio público).
   Los números de libro no cambian; el orden católico de lectura está en AT_ORDER y NT_ORDER */
var IDX=[], BOOKS={};
var AT_ORDER=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,67,68,17,69,70,18,19,20,21,22,71,72,23,24,25,73,26,27,28,29,30,31,32,33,34,35,36,37,38,39];
var NT_ORDER=[]; for(var _n=40;_n<=66;_n++) NT_ORDER.push(_n);
var Bible={
 get:function(i){ if(BOOKS[i]) return BOOKS[i];
  BOOKS[i]=fetch('biblia/'+i+'.json').then(function(r){ if(!r.ok) throw 0; return r.json(); }).catch(function(e){ delete BOOKS[i]; throw e; });
  return BOOKS[i]; },
 range:function(b,c,v1,v2){ return Bible.get(b).then(function(bk){ var ch=bk.c[c-1]||[]; return ch.slice(v1-1,v2||ch.length).join(' '); }); }
};

/* ---------- Oraciones del día ---------- */
function easterSeason(){ return LIT.info&&LIT.info.season==='pas'; }
var PRAY={
 ofr:{t:'Ofrecimiento del día',parts:[{text:function(){ return PR.ofr; }}]},
 man:{t:'Oración de la mañana',parts:[{h:'Invocación',text:function(){ return 'Señor, ábreme los labios. Y mi boca proclamará tu alabanza.'; }},{h:'Salmo 63',bible:[19,63,1,8]},{h:'Cántico de Zacarías (Lucas 1, 68-79)',bible:[42,1,68,79]},{h:'Padre Nuestro',text:function(){ return PR.pn; }}]},
 ang:{t:'Ángelus',parts:[{text:function(){ if(easterSeason()) return PR.regina; return PR.angelus.map(function(x){ return x+' '+PR.am; }).join(' ')+' '+PR.angelusFin; }}]},
 cor:{t:'Coronilla de la Misericordia',parts:[{h:'Inicio',text:function(){ return PR.pn+' '+PR.am+' '+L.T.credo; }},{h:'En cada decena',text:function(){ return 'Cuenta grande: '+PR.cor1+' Cuentas pequeñas, diez veces: '+PR.cor2; },say:function(){ var s=''; for(var d=0;d<5;d++){ s+=' '+PR.cor1; for(var i=0;i<10;i++) s+=' '+PR.cor2; } return s; }},{h:'Al final, tres veces',text:function(){ return PR.cor3; },say:function(){ return PR.cor3+' '+PR.cor3+' '+PR.cor3+' Jesús, en ti confío.'; }}]},
 tar:{t:'Oración de la tarde',parts:[{h:'Invocación',text:function(){ return 'Dios mío, ven en mi auxilio. Señor, date prisa en socorrerme.'; }},{h:'Salmo 121',bible:[19,121,1,8]},{h:'Cántico de María (Lucas 1, 46-55)',bible:[42,1,46,55]},{h:'Padre Nuestro',text:function(){ return PR.pn; }}]},
 exa:{t:'Examen de conciencia',parts:[{h:'Seis pasos',text:function(){ return PR.examen.map(function(x,i){ return (i+1)+'. '+x; }).join(' '); }},{h:'Acto de contrición',text:function(){ return PR.contri; }}]},
 noc:{t:'Oración de la noche',parts:[{h:'Salmo 4',bible:[19,4,1,8]},{h:'Cántico de Simeón (Lucas 2, 29-32)',bible:[42,2,29,32]},{h:'Salve',text:function(){ return PR.salve; }}]},
 pn:{t:'Padre Nuestro',parts:[{text:function(){ return PR.pn; }}]},
 am:{t:'Ave María',parts:[{text:function(){ return PR.am; }}]},
 gl:{t:'Gloria',parts:[{text:function(){ return PR.gl; }}]},
 credo:{t:'Credo',parts:[{text:function(){ return L.T.credo; }}]},
 salve:{t:'Salve',parts:[{text:function(){ return PR.salve; }}]},
 ag:{t:'Ángel de la guarda',parts:[{text:function(){ return PR.ag; }}]},
 contri:{t:'Acto de contrición',parts:[{text:function(){ return PR.contri; }}]},
 esp:{t:'Comunión espiritual',parts:[{text:function(){ return L.T.espiritual.replace(/^Comunión espiritual\.\s*/,''); }}]}
};
var PRAY_CACHE={};
function loadPrayer(id){
 if(PRAY_CACHE[id]) return Promise.resolve(PRAY_CACHE[id]);
 var p=PRAY[id];
 return Promise.all(p.parts.map(function(x){
  if(x.bible) return Bible.range(x.bible[0],x.bible[1],x.bible[2],x.bible[3]).then(function(t){ return {h:x.h,text:t}; });
  return {h:x.h,text:x.text(),say:x.say?x.say():null};
 })).then(function(parts){ PRAY_CACHE[id]={t:p.t,parts:parts}; return PRAY_CACHE[id]; });
}
function normT(t){ return String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-zñ ]/g,' ').replace(/\s+/g,' ').trim(); }
function withTitle(h,text){ if(!h) return text; return normT(text).indexOf(normT(h))===0?text:h+'. '+text; }
function prayerSay(pr){ var parts=pr.parts.map(function(x){ return withTitle(x.h,x.say||x.text); }).join(' '); return withTitle(pr.t,parts); }

var RUT=[
 ['ofr','Al despertar','Ofrecimiento del día','1 min'],
 ['man','Mañana','Oración de la mañana','Salmo y Benedictus'],
 ['ang','12:00','Ángelus','3 min'],
 ['misa','Hoy','Misa de hoy','Lecturas y Evangelio'],
 ['ros','Día','Santo Rosario','20 min'],
 ['cor','15:00','Coronilla de la Misericordia','8 min'],
 ['tar','Tarde','Oración de la tarde','Salmo y Magníficat'],
 ['exa','Noche','Examen de conciencia','10 min'],
 ['noc','Al dormir','Oración de la noche','Salmo y Nunc dimittis']
];
function rutName(id){ if(id==='ang'&&easterSeason()) return 'Regina Coeli'; return (RUT.filter(function(r){ return r[0]===id; })[0]||[])[2]; }

/* ---------- Liturgia del día ---------- */
var LIT={ready:false,err:false,info:null,mass:null,key:null,frase:null};
function loadLit(){
 return Promise.all(['datos/calendario.json','datos/leccionario.json','biblia/indice.json'].map(function(u){ return fetch(u).then(function(r){ if(!r.ok) throw 0; return r.json(); }); }))
  .then(function(a){ L.setData(a[0],a[1]); L.setNames(a[2]); IDX=a[2]; LIT.ready=true; refreshDay(); })
  .catch(function(){ LIT.err=true; render(); });
}
function refreshDay(){
 var d=new Date(); TODAY=dkey(d); NOW=d;
 if(!LIT.ready||LIT.key===TODAY) return;
 LIT.key=TODAY; LIT.info=L.day(new Date(d.getFullYear(),d.getMonth(),d.getDate())); LIT.mass=null; LIT.frase=null; M.idx=0; M.playing=false;
 buildMass(LIT.info).then(function(secs){ if(LIT.key!==TODAY) return; LIT.mass=secs; LIT.frase=pickFrase(secs); render(); })
  .catch(function(){ LIT.massErr=true; render(); });
}
function pickFrase(secs){
 var g=null; secs.forEach(function(s){ s.parts.forEach(function(p){ if(p.gospel) g=p; }); });
 if(!g||!g.verses||!g.verses.length) return null;
 var vs=g.verses, cand=vs.filter(function(v){ return v.t.length>=50&&v.t.length<=220; }), v=cand.length?cand[cand.length-1]:vs[vs.length-1];
 return {t:v.t,ref:IDX[g.book-1][0]+' '+v.c+', '+v.v};
}
function buildMass(info){
 var rds=L.readingsFor(info), T=L.T, secs=[];
 function sec(t){ var s={title:t,parts:[]}; secs.push(s); return s; }
 var ini=sec('Ritos iniciales');
 if(info.special==='viernes') ini.parts.push({h:'Celebración de la Pasión',text:T.viernes});
 else {
  if(info.special==='vigilia') ini.parts.push({h:'Vigilia Pascual',text:T.vigilia});
  ini.parts.push({h:'Señal de la cruz y saludo',text:T.senal+' '+T.saludo});
  ini.parts.push({h:'Acto penitencial',text:T.confieso});
  ini.parts.push({h:'Señor, ten piedad',text:T.kyrie});
  if(info.gloria) ini.parts.push({h:'Gloria',text:T.gloria});
  ini.parts.push({h:'Oración colecta',text:T.colecta});
 }
 var w=sec('Liturgia de la Palabra');
 return Promise.all(rds.map(function(rd){
  var p=L.parseRef(rd.ref);
  if(!p) return null;
  if(p.dc||!p.book) return {h:rd.label,ref:L.refEs(p),missing:true,text:rd.label+'. Hoy se lee del libro de '+(p.dc||'')+', que no está incluido en la Biblia de esta app.'};
  return Bible.get(p.book).then(function(bk){ var part=L.readingPart(info,rd,bk,p); part.book=p.book; part.kind=rd.tipo; return part; });
 })).then(function(parts){
  parts.forEach(function(x){ if(x) w.parts.push(x); });
  if(info.special!=='viernes') w.parts.push({h:'Homilía',text:T.homilia});
  if(info.credo) w.parts.push({h:'Credo',text:T.credo});
  if(info.special!=='viernes') w.parts.push({h:'Oración de los fieles',text:T.fieles});
  L.tailSections(info).forEach(function(s){ secs.push(s); });
  var n=0; secs.forEach(function(s){ s.parts.forEach(function(p){ p.i=n++; }); });
  return secs;
 });
}
var SEL={key:null,info:null,mass:null,err:false};
function viewMass(){ return U.mdate?SEL.mass:LIT.mass; }
function loadSel(d){ var key=dkey(d); if(SEL.key===key) return;
 SEL={key:key,info:L.day(new Date(d.getFullYear(),d.getMonth(),d.getDate())),mass:null,err:false};
 buildMass(SEL.info).then(function(m){ if(SEL.key!==key) return; SEL.mass=m; render(); },function(){ if(SEL.key===key){ SEL.err=true; render(); } }); }
function setMassDate(d){ M.stop(); M.idx=0; if(AUD&&AUD.kind==='misa') AUD=null; if(d&&dkey(d)===dkey(new Date())) d=null; U.mdate=d; render(); try{ window.scrollTo(0,0); }catch(e){} }
function massParts(m){ var a=[]; (m===undefined?viewMass():m||[]).forEach(function(s){ s.parts.forEach(function(p){ a.push(p); }); }); return a; }

/* ---------- Reproductor de la Misa ---------- */
var M={idx:0,playing:false,
 play:function(i){ var ps=massParts(); if(!ps.length) return;
  if(i>=ps.length){ M.playing=false; M.idx=0; AUD=null; if(!U.mdate) setDone('misa',true); updSay(); toast('Misa completa. Pueden ir en paz.'); return; }
  M.idx=i; M.playing=true; var p=ps[i];
  speak(withTitle(p.h,p.text),'misa:'+i,function(){ setTimeout(function(){ if(M.playing&&!speaking) M.play(i+1); },900); });
  M.playing=true; updMass();
  var el=document.querySelector('[data-part="'+i+'"]'); if(el){ if(el.tagName==='DETAILS') el.open=true; try{ el.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){} }
 },
 stop:function(){ M.playing=false; stopSpeak(); updSay(); }
};
function updMass(){
 var b=$('massBtn'); if(b){ b.innerHTML=M.playing?ic('pause',22)+'Pausar':ic('play',22)+(M.idx>0?'Continuar la Misa':'Escuchar la Misa'); }
 var ps=document.querySelectorAll('[data-part]'); for(var i=0;i<ps.length;i++) ps[i].classList.toggle('now',M.playing&&+ps[i].getAttribute('data-part')===M.idx);
 var pr=$('massProg'); if(pr){ var n=massParts().length; pr.textContent=n?('Parte '+(M.idx+1)+' de '+n):''; }
}

/* ---------- Rosario ---------- */
var MYS={
 gozosos:['Gozosos',['La Anunciación del ángel a María','La Visitación de María a su prima Isabel','El Nacimiento del Hijo de Dios en Belén','La Presentación de Jesús en el Templo','El Niño Jesús perdido y hallado en el Templo']],
 dolorosos:['Dolorosos',['La Oración de Jesús en el Huerto','La Flagelación del Señor','La Coronación de espinas','Jesús con la cruz a cuestas camino del Calvario','La Crucifixión y muerte de Nuestro Señor']],
 gloriosos:['Gloriosos',['La Resurrección del Señor','La Ascensión del Señor al cielo','La Venida del Espíritu Santo','La Asunción de María al cielo','La Coronación de María como Reina de cielo y tierra']],
 luminosos:['Luminosos',['El Bautismo de Jesús en el Jordán','Las bodas de Caná','El anuncio del Reino de Dios','La Transfiguración del Señor','La Institución de la Eucaristía']]
};
var BYDAY=['gloriosos','gozosos','dolorosos','gloriosos','luminosos','dolorosos','gozosos'];
var ORD=['Primer','Segundo','Tercer','Cuarto','Quinto'];
var STEPS=(function(){ var st=[{k:'cr',b:'cross'},{k:'pn',b:'b0'}];
 for(var i=1;i<=3;i++) st.push({k:'am',b:'i'+i,n:i,intro:['por el aumento de la fe','por el aumento de la esperanza','por el aumento de la caridad'][i-1]});
 st.push({k:'gl',b:'g0'});
 for(var d=0;d<5;d++){ st.push({k:'pn',b:'D'+d,d:d}); for(var n=1;n<=10;n++) st.push({k:'am',b:'d'+d+'s'+n,d:d,n:n}); st.push({k:'gl',b:'g'+(d+1),d:d}); }
 st.push({k:'salve',b:'medal'}); return st; })();
var U={mdate:null,tab:'home',test:'nt',q:'',bk:null,ch:null,pid:null,confirmReset:false,rosSet:BYDAY[new Date().getDay()]};
function rosKey(){ return TODAY+':'+U.rosSet; }
function rosI(){ return Math.min(S.ros[rosKey()]||0,STEPS.length); }
function stepTitle(s){ return s.k==='cr'?'Señal de la cruz y Credo':s.k==='pn'?'Padre Nuestro':s.k==='am'?'Ave María':s.k==='gl'?'Gloria':'Salve'; }
function stepText(s){
 var set=MYS[U.rosSet];
 if(s.k==='cr') return PR.cruz+' '+L.T.credo;
 if(s.k==='pn') return (s.d!=null?ORD[s.d]+' misterio '+set[0].toLowerCase()+': '+set[1][s.d]+'. ':'')+PR.pn;
 if(s.k==='am') return (s.intro?'Ave María '+s.intro+'. ':'')+PR.am;
 if(s.k==='gl') return PR.gl+(s.d!=null?' '+PR.fatima:'');
 return PR.salve;
}
var R={playing:false,
 play:function(){ var i=rosI(); if(i>=STEPS.length) return;
  R.playing=true; speak(stepText(STEPS[i]),'rosa:'+i,function(){ if(!R.playing) return; var k=rosI()+1; S.ros[rosKey()]=k; save();
   if(k>=STEPS.length){ R.playing=false; AUD=null; setDone('ros',true); toast('Rosario completado'); }
   if(U.tab==='rosary') render(); setTimeout(function(){ if(R.playing&&!speaking) R.play(); },600); });
  R.playing=true; updRos(); }
};
function updRos(){ var b=$('rosBtn'); if(b) b.innerHTML=R.playing?ic('pause',22)+'Pausar':ic('play',22)+(rosI()>0?'Continuar el Rosario':'Rezar el Rosario'); }
function rosarySvg(cur){
 var pts=[], x=26, G=19;
 function add(id,type,dx){ x+=dx; pts.push({id:id,t:type,x:x}); }
 add('cross','cross',0); add('b0','big',28); for(var i=1;i<=3;i++) add('i'+i,'s',i===1?24:G); add('g0','g',G);
 for(var d=0;d<5;d++){ add('D'+d,'big',24); for(var n=1;n<=10;n++) add('d'+d+'s'+n,'s',n===1?24:G); add('g'+(d+1),'g',G); }
 add('medal','medal',30); var W=x+28, H=78;
 function y(px){ return 40+7*Math.sin(px/70); }
 var order={}; STEPS.forEach(function(s,i){ order[s.b]=i; });
 var path='M'+pts.map(function(p){ return p.x.toFixed(1)+' '+y(p.x).toFixed(1); }).join(' L');
 var out='<svg id="rsvg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Rosario: cuenta '+(Math.min(cur,STEPS.length-1)+1)+' de '+STEPS.length+'"><path d="'+path+'" fill="none" stroke="var(--line)" stroke-width="2"/>';
 var curX=0;
 pts.forEach(function(p){ var i=order[p.id], done=i<cur, now=i===cur, cy=y(p.x), fill=done||now?'var(--accent)':'var(--surface2)', st=done||now?'var(--accent)':'var(--line)';
  if(now){ curX=p.x; out+='<circle cx="'+p.x+'" cy="'+cy+'" r="'+(p.t==='s'?13:17)+'" fill="var(--accent)" opacity=".25"/>'; }
  if(p.t==='cross') out+='<g fill="'+fill+'" stroke="'+st+'"><rect x="'+(p.x-3)+'" y="'+(cy-15)+'" width="6" height="30" rx="2"/><rect x="'+(p.x-10)+'" y="'+(cy-8)+'" width="20" height="6" rx="2"/></g>';
  else if(p.t==='big') out+='<circle cx="'+p.x+'" cy="'+cy+'" r="10" fill="'+fill+'" stroke="'+st+'" stroke-width="1.5"/>';
  else if(p.t==='s') out+='<circle cx="'+p.x+'" cy="'+cy+'" r="6.5" fill="'+fill+'" stroke="'+st+'" stroke-width="1.5"/>';
  else if(p.t==='g') out+='<rect x="'+(p.x-4.5)+'" y="'+(cy-4.5)+'" width="9" height="9" transform="rotate(45 '+p.x+' '+cy+')" fill="'+fill+'" stroke="'+st+'"/>';
  else out+='<ellipse cx="'+p.x+'" cy="'+cy+'" rx="10" ry="13" fill="'+fill+'" stroke="'+st+'" stroke-width="1.5"/><path d="M'+p.x+' '+(cy-6)+'v12M'+(p.x-4)+' '+(cy-2)+'h8" stroke="'+(done||now?'var(--accent-ink)':'var(--muted)')+'" stroke-width="2" stroke-linecap="round"/>';
 });
 return {svg:out+'</svg>',x:curX};
}

/* ---------- Respuestas del pueblo ---------- */
var WHOLE=/^(Acto penitencial|Señor, ten piedad|Gloria|Credo|Santo|Padre Nuestro|Cordero de Dios|Comunión espiritual)$/;
var SPLITS=[['Santa María, Madre de Dios','Amén.'],['Danos hoy nuestro pan','Amén.'],['Como era en el principio','Amén.'],['Ruega por nosotros, santa Madre de Dios','Amén.']];
var RESP=['Y con tu espíritu.','Te alabamos, Señor.','Gloria a ti, Señor Jesús.','Gloria a ti, Señor.','Lo tenemos levantado hacia el Señor.','Es justo y necesario.','Bendito seas por siempre, Señor.',
 'El Señor reciba de tus manos este sacrificio, para alabanza y gloria de su nombre, para nuestro bien y el de toda su santa Iglesia.','Señor, no soy digno de que entres en mi casa, pero una palabra tuya bastará para sanarme.',
 'Anunciamos tu muerte, proclamamos tu resurrección. ¡Ven, Señor Jesús!','Demos gracias a Dios, aleluya, aleluya.','Demos gracias a Dios.','Te rogamos, óyenos.','Tuyo es el reino, tuyo el poder y la gloria, por siempre, Señor.','Aleluya, aleluya, aleluya.','Honor y gloria a ti, Señor Jesús.','Amén.'];
function fmt(text,whole){
 var t=esc(text);
 if(whole) return '<span class="resp">'+t+'</span>';
 var marks=[];
 SPLITS.forEach(function(sp){ var a=esc(sp[0]), i=0, k;
  while((k=t.indexOf(a,i))>=0){ var e=t.indexOf(esc(sp[1]),k); e=e<0?t.length:e+sp[1].length; marks.push([k,e]); i=e; } });
 RESP.forEach(function(r){ var a=esc(r), i=0, k; while((k=t.indexOf(a,i))>=0){ var e=k+a.length; if(!marks.some(function(m){ return k<m[1]&&e>m[0]; })) marks.push([k,e]); i=e; } });
 marks.sort(function(x,y){ return x[0]-y[0]; });
 var out='', pos=0; marks.forEach(function(m){ if(m[0]<pos) return; out+=t.slice(pos,m[0])+'<span class="resp">'+t.slice(m[0],m[1])+'</span>'; pos=m[1]; });
 return out+t.slice(pos);
}

/* ---------- Pantallas ---------- */
var LCOL={green:'#3E9B4F',purple:'#7A4FC0',white:'#F2F2EE',red:'#D23B3B',rose:'#E68AB3',black:'#222'};
function litBadge(info){ return '<span class="row small" style="gap:8px"><i class="ldot" style="background:'+(LCOL[info.cel.c]||'#999')+'"></i><span class="muted">'+esc(info.colorName)+' · '+esc(info.seasonName||'')+' · Ciclo '+info.cycle+(info.sunday?'':' · Año '+info.wcyc)+'</span></span>'; }
function loading(t){ return '<div class="panel"><p class="muted">'+(LIT.err?'No se pudieron cargar los datos. Revisa tu conexión y vuelve a abrir Lumen.':(t||'Cargando…'))+'</p></div>'; }

function ring(n,tot){ var r=44, c=2*Math.PI*r, f=tot?n/tot:0;
 return '<svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label="'+n+' de '+tot+' oraciones hoy"><circle cx="56" cy="56" r="'+r+'" fill="none" stroke="var(--surface2)" stroke-width="10"/>'
  +'<circle cx="56" cy="56" r="'+r+'" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+(c*f).toFixed(1)+' '+c.toFixed(1)+'" transform="rotate(-90 56 56)"/>'
  +'<text x="56" y="56" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="34" fill="var(--fg)">'+n+'<tspan font-size="18" fill="var(--muted)">/'+tot+'</tspan></text>'
  +'<text x="56" y="76" text-anchor="middle" font-size="11" font-weight="700" fill="var(--muted)" letter-spacing="1">HOY</text></svg>'; }
function vHome(){
 var info=LIT.info, dn=doneToday().length, set=BYDAY[new Date().getDay()], ri=S.ros[TODAY+':'+set]||0, dec=Math.max(0,Math.min(5,Math.floor((ri-6)/12)+(ri>=STEPS.length?1:0)));
 var wk=''; for(var i=6;i>=0;i--){ var d=new Date(); d.setDate(d.getDate()-i); var on=(S.done[dkey(d)]||[]).length>0;
  wk+='<div><span'+(i===0?' style="color:var(--fg);font-weight:700"':'')+'>'+'DLMMJVS'.charAt(d.getDay())+'</span><i class="dot'+(on?' on':'')+(i===0?' today':'')+'" style="display:block"></i></div>'; }
 var fr=LIT.frase, st=streak(), next=RUT.filter(function(r){ return !isDone(r[0]); })[0];
 return '<header class="between"><span class="row" style="gap:8px">'+logo(30)+'<span style="font-family:var(--f-display);font-weight:700;font-size:24px;letter-spacing:2px">LU<span style="color:var(--accent-fg)">MEN</span></span></span><span class="small muted">'+longDate(NOW)+'</span></header>'
  +((!S.name&&!needAuth())?'<button class="card" data-a="tab" data-v="me" style="border:1px solid var(--accent-fg)">'+ic('user',24)+'<span class="grow"><b>Configura tu nombre</b><span>Ve a Cuenta y escribe cómo quieres que te saludemos</span></span>'+ic('chevR',20)+'</button>':'')
  +'<div class="stack" style="gap:6px"><h1>'+greet()+(S.name?',<br>'+esc(S.name):'')+'</h1>'+(info?litBadge(info):'')+'</div>'
  +(info?'<div class="daycard"><span class="lbar" style="background:'+(LCOL[info.cel.c]||'#999')+'"></span><div class="stack" style="gap:4px;min-width:0"><span class="label">Hoy celebramos</span><b>'+esc(info.cel.n)+'</b>'+(info.commem?'<span class="small muted">Santo del día: '+esc(info.commem.n)+'</span>':'')+'</div></div>':'')
  +'<div class="quote"><div class="between"><span class="label ac">Frase del día</span>'+(fr?sayBtn('frase'):'')+'</div>'+(fr?'<p>'+esc(fr.t)+'</p><div class="between"><span class="ref">'+esc(fr.ref)+'</span><span class="row" style="gap:6px"><button class="say" data-a="copy">'+ic('copy',16)+'<span>Copiar</span></button><button class="say" data-a="shareFrase">'+ic('share',16)+'<span>Compartir</span></button></span></div>':'<p class="muted" style="font-size:18px">Cargando el Evangelio de hoy…</p>')+'</div>'
  +homePlanCard()
  +'<div class="panel prog"><div class="row" style="gap:16px;align-items:center">'+ring(dn,RUT.length)
  +'<div class="stack" style="gap:6px;flex:1;min-width:0"><span class="label">Tu progreso</span><span class="row" style="gap:6px;align-items:baseline"><b class="big num">'+st+'</b><span class="small muted">'+(st===1?'día seguido':'días seguidos')+'</span></span>'
  +(next?'<button class="nextbtn" data-a="open" data-v="'+next[0]+'"><span class="small muted">Siguiente:</span> <b>'+esc(rutName(next[0]))+'</b>'+ic('chevR',16)+'</button>':'<span class="small" style="color:var(--accent-fg);font-weight:700">¡Rutina completa! Gloria a Dios.</span>')+'</div></div>'
  +'<div class="week">'+wk+'</div></div>'
  +'<div class="grid2"><button class="qa" data-a="tab" data-v="misa"><span class="qi">'+ic('church',22)+'</span><b>Misa de hoy</b><span class="small muted">'+(isDone('misa')?'Escuchada ✓':'Lecturas y Evangelio')+'</span></button>'
  +'<button class="qa" data-a="tab" data-v="rosary"><span class="qi">'+ic('rosary',22)+'</span><b>Santo Rosario</b><span class="small muted">'+(ri>=STEPS.length?'Rezado ✓':'Misterios '+MYS[set][0]+' · '+dec+'/5')+'</span></button></div>'
  +'<section class="stack"><div class="between"><h2>Rutina de hoy</h2><span class="small muted num">'+dn+'/'+RUT.length+'</span></div>'
  +RUT.map(function(r){ var on=isDone(r[0]); return '<div class="item'+(on?' done':'')+'"><span class="t">'+r[1]+'</span><button class="grow linkrow" data-a="open" data-v="'+r[0]+'"><b>'+esc(rutName(r[0]))+'</b><span class="small muted">'+r[3]+'</span></button><button class="check'+(on?' on':'')+'" data-a="done" data-id="'+r[0]+'" aria-pressed="'+on+'" aria-label="'+(on?'Desmarcar ':'Marcar ')+esc(rutName(r[0]))+'">'+ic('check',16,3)+'</button></div>'; }).join('')
  +'</section>'
  +'<section class="stack"><h2>Oraciones</h2><div class="chips cwrap">'
  +['pn','am','gl','credo','salve','ag','contri','esp'].map(function(k){ return '<button class="chip" data-a="open" data-v="'+k+'">'+PRAY[k].t+'</button>'; }).join('')+'</div></section>';
}

function vHoy(){
 var d=U.mdate, info, mass, err;
 if(d){ if(LIT.ready) loadSel(d); info=SEL.info; mass=SEL.mass; err=SEL.err; } else { d=NOW; info=LIT.info; mass=LIT.mass; err=LIT.massErr; }
 var t0=new Date(); t0.setHours(0,0,0,0); var d0=new Date(d); d0.setHours(0,0,0,0); var dd=Math.round((d0-t0)/864e5);
 var title=dd===0?'MISA DE HOY':dd===-1?'MISA DE AYER':dd===1?'MISA DE MAÑANA':'MISA DEL '+d.getDate()+' DE '+MONTHS[d.getMonth()].toUpperCase();
 var nav='<div class="datebar"><button class="icon-btn" data-a="mprev" aria-label="Día anterior">'+ic('chevL')+'</button>'
  +'<label class="datepick" for="mdate">'+'<span>'+longDate(d)+(d.getFullYear()!==t0.getFullYear()?' de '+d.getFullYear():'')+'</span><input type="date" id="mdate" data-a="mdate" value="'+dkey(d)+'" aria-label="Elegir fecha"></label>'
  +'<button class="icon-btn" data-a="mnext" aria-label="Día siguiente">'+ic('chevR')+'</button></div>'
  +(dd!==0?'<button class="link" data-a="mtoday" style="align-self:center;color:var(--accent-fg)">Volver a hoy</button>':'');
 var head='<header class="stack" style="gap:10px"><h1>'+title+'</h1>'+nav+'</header>';
 if(!info) return head+loading();
 head+='<div class="panel" style="gap:6px">'+litBadge(info)+'<b style="font-size:18px;line-height:1.3">'+esc(info.cel.n)+'</b>'+(info.commem?'<span class="small muted">Santo del día: '+esc(info.commem.n)+'</span>':'')+'</div>';
 if(!mass) return head+loading(err?'No se pudieron cargar las lecturas. Revisa tu conexión.':'Preparando las lecturas…');
 var out=head+'<div class="stack" style="gap:8px"><div class="row" style="gap:8px"><button class="btn playbig" id="massBtn" data-a="massPlay" style="flex:1"></button><button class="icon-btn lockbtn" data-a="pocket" aria-label="Modo bolsillo: bloquear pantalla">'+ic('lock',24)+'</button></div>'+(('wakeLock' in navigator)?'<p class="small muted" style="text-align:center">La pantalla se mantendrá encendida mientras escuchas. Si la bloqueas o sales de Lumen, el audio se detiene.</p>':'')+'<div class="between small"><span class="muted" id="massProg"></span>'+(M.idx>0?'<button class="link" data-a="massRestart">Empezar desde el inicio</button>':'')+'</div></div>';
 mass.forEach(function(s){
  out+='<section class="stack"><h2>'+esc(s.title)+'</h2>';
  s.parts.forEach(function(p){
   var isR=!!p.ref, body;
   if(p.verses&&p.verses.length) body='<p class="verses">'+p.verses.map(function(v){ return '<sup>'+v.v+'</sup>'+esc(v.t); }).join(' ')+'</p>';
   else body='<p class="ptext">'+(p.missing?esc(p.text.replace(/^[^.]*\.\s*/,'')):fmt(p.text,WHOLE.test(p.h)))+'</p>';
   out+='<details class="part'+(p.gospel?' gos':'')+'" data-part="'+p.i+'"'+(isR?' open':'')+'><summary><span class="stack" style="gap:2px;min-width:0"><b>'+esc(p.h)+'</b>'+(p.ref?(p.verses&&p.verses.length?'<button class="small ref reflink" data-a="goread" data-v="'+p.i+'" aria-label="Abrir '+esc(p.ref)+' en la Biblia">'+esc(p.ref)+' ›</button>':'<span class="small ref">'+esc(p.ref)+'</span>'):'')+'</span><button class="pbtn" data-a="massFrom" data-v="'+p.i+'" aria-label="Escuchar desde '+esc(p.h)+'">'+ic('play',14)+'</button></summary>'+body+'</details>';
  });
  out+='</section>';
 });
 return out+'<p class="small muted">Lecturas según el Leccionario de la Misa. Texto bíblico: Reina-Valera 1909 (dominio público).</p>';
}

function vRosary(){
 var i=rosI(), set=MYS[U.rosSet];
 var chips='<div class="chips" role="group" aria-label="Misterios">'+Object.keys(MYS).map(function(k){ return '<button class="chip'+(k===U.rosSet?' on':'')+'" data-a="rset" data-v="'+k+'">'+MYS[k][0]+(k===BYDAY[new Date().getDay()]?' · hoy':'')+'</button>'; }).join('')+'</div>';
 var head='<header><h1>SANTO ROSARIO</h1></header>'+chips;
 var rs=rosarySvg(i);
 var strip='<div class="rstrip" id="rstrip">'+rs.svg+'</div>';
 if(i>=STEPS.length) return head+strip+'<div class="empty"><span class="big">Amén</span><h3 style="font-size:24px">Rosario completado</h3><p class="muted small">Misterios '+set[0]+' · '+longDate(NOW)+'</p><button class="btn ghost" data-a="rreset">Rezar de nuevo</button></div>';
 var s=STEPS[i], mys=s.d!=null?ORD[s.d]+' misterio':(s.k==='salve'?'Final':'Oraciones iniciales'), myst=s.d!=null?set[1][s.d]:(s.k==='salve'?'Salve y despedida':'Misterios '+set[0]);
 var cnt=s.k==='am'?'<div class="counter"><b class="num">'+s.n+'</b><span>/ '+(s.d!=null?10:3)+'</span></div>':'<div class="counter"><b style="font-size:38px;text-align:center">'+stepTitle(s).toUpperCase()+'</b></div>';
 return head
  +'<div class="panel"><span class="label ac">'+set[0]+' · '+mys+'</span><h3 style="font-size:26px">'+esc(myst)+'</h3></div>'
  +'<div class="stack" style="gap:8px"><div class="row" style="gap:8px"><button class="btn playbig" id="rosBtn" data-a="rosPlay" style="flex:1"></button><button class="icon-btn lockbtn" data-a="pocket" aria-label="Modo bolsillo: bloquear pantalla">'+ic('lock',24)+'</button></div>'
  +'<div class="between small"><span class="muted">Cuenta '+(i+1)+' de '+STEPS.length+'</span>'+(i>0?'<button class="link" data-a="rosRestart">Empezar desde el inicio</button>':'')+'</div></div>'
  +strip
  +'<div class="stack" style="align-items:center;gap:2px">'+cnt+(s.k==='am'?'<span class="label">Ave María</span>':'')+'</div>'
  +'<div class="prayer"><p>'+fmt(stepText(s))+'</p></div>'
  +'<div class="ctl"><button class="icon-btn" data-a="rprev" aria-label="Cuenta anterior">'+ic('undo',22)+'</button><button class="btn" data-a="rnext">Siguiente cuenta</button></div>';
}

function vBible(){
 if(!LIT.ready) return '<header><h1>BIBLIA</h1></header>'+loading();
 if(U.bk&&U.ch) return vChapter();
 if(U.plan) return vPlans();
 if(U.bk){ var n=IDX[U.bk-1][1], g=''; for(var c=1;c<=n;c++) g+='<button data-a="chap" data-v="'+c+'">'+c+'</button>';
  return '<header class="row"><button class="icon-btn" data-a="bback" aria-label="Volver">'+ic('back')+'</button><h1>'+esc(IDX[U.bk-1][0]).toUpperCase()+'</h1></header><p class="muted small">'+n+' capítulos</p><div class="chgrid">'+g+'</div>'; }
 var q=nrm(U.q).replace(/[\d,:.\-–]+$/,'').trim(), list=[];
 (U.test==='at'?AT_ORDER:NT_ORDER).forEach(function(i){ if(!IDX[i-1]) return; var nm=nrm(IDX[i-1][0]); if(!q||nm.indexOf(q)>=0||BS.items) list.push(i); });
 var lect=LIT.mass?massParts(LIT.mass).filter(function(p){ return p.ref; }):[];
 return '<header><h1>BIBLIA</h1></header>'
  +'<form class="field" id="bqForm" role="search">'+ic('search',18)+'<input id="bq" type="search" data-a="bq" placeholder="Libro, cita (Juan 3,16) o palabras" value="'+esc(U.q)+'" autocomplete="off" enterkeyhint="search" aria-label="Buscar en la Biblia"><button class="say" type="submit">Buscar</button></form>'+searchResults()
  +(lect.length?'<div class="panel" style="gap:0"><div class="between" style="margin-bottom:6px"><span class="label ac">Lecturas de hoy</span><button class="say" data-a="tab" data-v="misa">'+ic('play',14)+'<span>Misa de hoy</span></button></div>'+lect.map(function(p){ return '<button class="kv kvbtn" data-a="goread" data-v="'+p.i+'"><span class="muted">'+esc(p.h)+'</span><b>'+esc(p.ref)+'</b></button>'; }).join('')+'</div>':'')
  +plansPanel()
  +'<div class="seg" style="grid-template-columns:repeat(2,minmax(0,1fr))">'+[['at','Antiguo Testamento'],['nt','Nuevo Testamento']].map(function(x){ return '<button class="'+(U.test===x[0]?'on':'')+'" data-a="test" data-v="'+x[0]+'">'+x[1]+'</button>'; }).join('')+'</div>'
  +(list.length?'<div class="books">'+list.map(function(b){ return '<button class="book" data-a="book" data-v="'+b+'"><b>'+esc(IDX[b-1][0])+'</b><span class="small muted">'+IDX[b-1][1]+' capítulos</span></button>'; }).join('')+'</div>':'<div class="empty muted">Ningún libro coincide con “'+esc(U.q)+'”.</div>')
  +'<p class="small muted">Biblia católica completa, 73 libros. Reina-Valera 1909 (dominio público), con ortografía actualizada; Tobías, Judit, 1 y 2 Macabeos, Sabiduría, Eclesiástico, Baruc, Ester y Daniel de la Santa Biblia libre para el mundo (eBible.org, dominio público).</p>';
}
var CHAP={};
function nrm(t){ return String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim(); }
var ABR={gn:1,gen:1,ex:2,lv:3,lev:3,nm:4,num:4,dt:5,deut:5,jos:6,jue:7,jc:7,rt:8,'1 s':9,'1 sam':9,'1 sm':9,'2 s':10,'2 sam':10,'2 sm':10,'1 r':11,'1 re':11,'1 rey':11,'2 r':12,'2 re':12,'2 rey':12,'1 cr':13,'1 cro':13,'2 cr':14,'2 cro':14,esd:15,neh:16,ne:16,est:17,jb:18,sal:19,salmo:19,sl:19,ps:19,pr:20,prov:20,ecl:21,qo:21,cant:22,ct:22,is:23,isa:23,jer:24,jr:24,lam:25,ez:26,dn:27,dan:27,os:28,jl:29,am:30,abd:31,jon:32,miq:33,mi:33,nah:34,na:34,hab:35,sof:36,ag:37,zac:38,za:38,mal:39,mt:40,mat:40,mc:41,mr:41,mar:41,lc:42,luc:42,jn:43,ju:43,hch:44,hech:44,rom:45,rm:45,ro:45,'1 cor':46,'1 co':46,'2 cor':47,'2 co':47,gal:48,ga:48,ef:49,efe:49,flp:50,fil:50,col:51,'1 tes':52,'1 ts':52,'2 tes':53,'2 ts':53,'1 tim':54,'1 tm':54,'2 tim':55,'2 tm':55,tit:56,tt:56,flm:57,heb:58,hb:58,sant:59,stgo:59,st:59,'1 pe':60,'1 pd':60,'2 pe':61,'2 pd':61,'1 jn':62,'2 jn':63,'3 jn':64,jds:65,jud:65,ap:66,apoc:66,tob:67,tb:67,jdt:68,judit:68,'1 mac':69,'1 m':69,'1 mc':69,'2 mac':70,'2 m':70,'2 mc':70,sab:71,sb:71,eclo:72,si:72,sir:72,eclesiastico:72,bar:73};
function findBook(name){ var n=nrm(name).replace(/\.$/,'').replace(/^(i{1,3})\s+/,function(m,r){ return r.length+' '; }).replace(/^(\d)(?=[a-z])/,'$1 ');
 if(ABR[n]) return ABR[n];
 for(var i=0;i<IDX.length;i++) if(nrm(IDX[i][0])===n) return i+1;
 var hit=0, cnt=0; for(var j=0;j<IDX.length;j++){ if(nrm(IDX[j][0]).indexOf(n)===0){ hit=j+1; cnt++; } } return cnt>=1&&n.length>=2?hit:0; }
function parseCita(q){
 var m=/^\s*((?:[1-3]|i{1,3})?\s*[a-zA-ZáéíóúñÁÉÍÓÚÑ ]+?)\.?\s*(\d+)(?:\s*[,:.]\s*(\d+)(?:\s*[-–]\s*(\d+))?)?\s*$/.exec(q||''); if(!m) return null;
 var b=findBook(m[1]); if(!b) return null; var c=+m[2]; if(c<1||c>IDX[b-1][1]) return null;
 return {b:b,c:c,v1:m[3]?+m[3]:0,v2:m[4]?+m[4]:(m[3]?+m[3]:0)}; }
function goCita(ci,from){ U.vsel=null; U.tab='bible'; U.bk=ci.b; U.ch=ci.c; U.hl=ci.v1?[ci.v1,ci.v2]:null; U.from=from||null; stopSpeak(); render(); setTimeout(scrollHl,60); }
function scrollHl(){ var el=document.querySelector('.reader .hlv'); if(el) try{ el.scrollIntoView({block:'center'}); }catch(e){} else try{ window.scrollTo(0,0); }catch(e){} }
var BS={q:'',busy:false,items:null,done:0};
function bibleSearch(q){
 var nq=nrm(q); if(nq.length<3){ toast('Escribe al menos 3 letras'); return; }
 BS={q:q,busy:true,items:[],done:0}; render(); var my=BS;
 var chain=Promise.resolve();
 for(var b=1;b<=IDX.length;b++)(function(b){ chain=chain.then(function(){ if(BS!==my) return; return Bible.get(b).then(function(bk){ BOOKS_DATA[b]=bk;
   bk.c.forEach(function(ch,ci){ ch.forEach(function(t,vi){ if(my.items.length<150&&nrm(t).indexOf(nq)>=0) my.items.push({b:b,c:ci+1,v:vi+1,t:t}); }); });
   my.done=b; if(b%11===0&&U.tab==='bible') render(); },function(){}); }); })(b);
 chain.then(function(){ if(BS!==my) return; my.busy=false; if(U.tab==='bible') render(); });
}
function hlText(t,q){ var e=esc(t), n=nrm(q); var plain=nrm(t); var k=plain.indexOf(n); if(k<0) return e;
 var a=esc(t.slice(0,k)), m=esc(t.slice(k,k+q.length)), z=esc(t.slice(k+q.length)); return a+'<mark class="qhit">'+m+'</mark>'+z; }
function searchResults(){
 if(!BS.items) return '';
 var h='<div class="panel" style="gap:8px"><div class="between"><span class="label ac">Resultados para “'+esc(BS.q)+'”</span><button class="link" data-a="bsClear">Cerrar</button></div>';
 if(BS.busy) h+='<p class="small muted">Buscando… '+Math.round(BS.done/(IDX.length||73)*100)+'%</p>';
 if(!BS.busy&&!BS.items.length) h+='<p class="small muted">No se encontró ese texto. Prueba con menos palabras o una cita como “Juan 3,16”.</p>';
 h+=BS.items.map(function(x){ return '<button class="hitrow" data-a="gohit" data-b="'+x.b+'" data-c="'+x.c+'" data-v="'+x.v+'"><b>'+esc(IDX[x.b-1][0])+' '+x.c+', '+x.v+'</b><span>'+hlText(x.t,BS.q)+'</span></button>'; }).join('');
 if(BS.items.length>=150) h+='<p class="small muted">Se muestran los primeros 150 resultados.</p>';
 return h+'</div>'; }
function vChapter(){
 var b=U.bk, c=U.ch, key=b+':'+c, bk=BOOKS_DATA[b];
 var head='<header class="row"><button class="icon-btn" data-a="cback" aria-label="Volver">'+ic('back')+'</button><h1>'+esc(IDX[b-1][0]).toUpperCase()+' '+c+'</h1></header>';
 if(!bk){ Bible.get(b).then(function(d){ BOOKS_DATA[b]=d; render(); },function(){ toast('No se pudo abrir el libro. Revisa tu conexión.'); }); return head+loading(); }
 var vs=bk.c[c-1]||[], n=IDX[b-1][1];
 var hl=U.hl; return head+(U.from==='misa'?'<button class="link" data-a="tab" data-v="misa" style="align-self:flex-start;color:var(--accent-fg)">← Volver a la Misa</button>':U.plan?'<button class="link" data-a="cback" style="align-self:flex-start;color:var(--accent-fg)">← Volver al plan</button>':'')+'<div>'+sayBtn('cap-'+key,'Escuchar capítulo')+'</div><div class="reader">'+vs.map(function(t,i){ if(!t) return ''; var on=hl&&i+1>=hl[0]&&i+1<=hl[1], sel=U.vsel&&U.vsel.indexOf(i+1)>=0; return '<p data-a="vsel" data-v="'+(i+1)+'" class="'+(on?'hlv':'')+(sel?' sel':'')+'"><sup>'+(i+1)+'</sup>'+esc(t)+'</p>'; }).join('')+'</div>'
  +vselBar()
  +'<div class="grid2"><button class="btn soft" data-a="chap" data-v="'+(c-1)+'"'+(c<=1?' disabled':'')+'>'+ic('chevL',18)+'Anterior</button><button class="btn soft" data-a="chap" data-v="'+(c+1)+'"'+(c>=n?' disabled':'')+'>Siguiente'+ic('chevR',18)+'</button></div>';
}
var BOOKS_DATA={};

/* ---------- Planes de lectura ----------
   Cada plan reparte capítulos en días. El avance vive en S.plans[id] = {start:'AAAA-MM-DD', done:{día:1}} y se guarda en la cuenta */
var PLANS=[
 {id:'ev30',t:'Evangelios en 30 días',d:'Mateo, Marcos, Lucas y Juan, unos 3 capítulos al día',days:30,books:[40,41,42,43]},
 {id:'nt90',t:'Nuevo Testamento en 90 días',d:'Los 27 libros, unos 3 capítulos al día',days:90,books:NT_ORDER},
 {id:'sal30',t:'Salmos en 30 días',d:'Cinco salmos al día',days:30,books:[19]},
 {id:'pro31',t:'Proverbios en 31 días',d:'Un capítulo por día',days:31,books:[20]},
 {id:'bib365',t:'La Biblia en un año',d:'Antiguo y Nuevo Testamento cada día, los 73 libros',days:365,split:true}];
var PLANC={};
function chapList(books){ var l=[]; books.forEach(function(b){ var n=(IDX[b-1]||[])[1]||0; for(var c=1;c<=n;c++) l.push([b,c]); }); return l; }
function spread(list,days){ var out=[]; for(var d=0;d<days;d++) out.push(list.slice(Math.round(d*list.length/days),Math.round((d+1)*list.length/days))); return out; }
function planDays(p){ if(PLANC[p.id]&&PLANC[p.id].n===IDX.length) return PLANC[p.id].d;
 var d=p.split?(function(){ var at=spread(chapList(AT_ORDER),p.days), nt=spread(chapList(NT_ORDER),p.days); return at.map(function(x,i){ return x.concat(nt[i]); }); })():spread(chapList(p.books),p.days);
 PLANC[p.id]={n:IDX.length,d:d}; return d; }
function dayLabel(chs){ var g=[]; chs.forEach(function(x){ var l=g[g.length-1]; if(l&&l.b===x[0]&&l.e===x[1]-1) l.e=x[1]; else g.push({b:x[0],s:x[1],e:x[1]}); });
 return g.map(function(r){ return IDX[r.b-1][0]+' '+(r.s===r.e?r.s:r.s+'-'+r.e); }).join(' · '); }
function planById(id){ return PLANS.filter(function(p){ return p.id===id; })[0]; }
function planToday(id){ var st=S.plans&&S.plans[id]; if(!st) return 0; var a=st.start.split('-'), d0=new Date(+a[0],+a[1]-1,+a[2]); return Math.max(0,Math.round((new Date(NOW.getFullYear(),NOW.getMonth(),NOW.getDate())-d0)/864e5)); }
function planDone(id){ var st=S.plans&&S.plans[id]; return st?Object.keys(st.done||{}).length:0; }
function activePlans(){ return PLANS.filter(function(p){ return S.plans&&S.plans[p.id]; }); }
function planNext(p){ var st=S.plans[p.id], days=planDays(p); for(var i=0;i<days.length;i++) if(!(st.done||{})[i]) return i; return -1; }
function plansPanel(){ var act=activePlans();
 return '<div class="panel"><div class="between"><span class="label ac">Planes de lectura</span><button class="link" data-a="plans">'+(act.length?'Ver todos':'Elegir un plan')+'</button></div>'
  +(act.length?act.map(function(p){ var i=planNext(p), days=planDays(p), dn=planDone(p.id);
    return '<button class="kv kvbtn" data-a="plan" data-v="'+p.id+'"><span class="stack" style="gap:2px;min-width:0;text-align:left"><b>'+esc(p.t)+'</b><span class="small muted">'+(i<0?'¡Plan completo!':'Día '+(i+1)+': '+esc(dayLabel(days[i])))+'</span></span><span class="small num muted">'+Math.round(dn/p.days*100)+'%</span></button>'; }).join('')
   :'<span class="small muted">Lee la Biblia con un plan diario: los Evangelios en 30 días, el Nuevo Testamento en 90, los Salmos o la Biblia completa en un año.</span>')+'</div>'; }
function homePlanCard(){ if(!IDX.length) return ''; var p=activePlans().filter(function(x){ return planNext(x)>=0; })[0]; if(!p) return '';
 var i=planNext(p); return '<button class="card" data-a="openplan" data-v="'+p.id+'">'+ic('plan',22)+'<span class="grow"><b>'+esc(p.t)+' · día '+(i+1)+'</b><span>'+esc(dayLabel(planDays(p)[i]))+'</span></span>'+ic('chevR',20)+'</button>'; }
function vPlans(){
 var head='<header class="row"><button class="icon-btn" data-a="planback" aria-label="Volver">'+ic('back')+'</button><h1>PLANES DE LECTURA</h1></header>';
 if(U.plan==='*') return head+PLANS.map(function(p){ var on=S.plans&&S.plans[p.id], dn=planDone(p.id);
   return '<div class="panel"><div class="between"><b>'+esc(p.t)+'</b>'+(on?'<span class="small num" style="color:var(--accent-fg)">'+Math.round(dn/p.days*100)+'%</span>':'')+'</div><span class="small muted">'+esc(p.d)+' · '+p.days+' días</span>'
    +(on?'<div class="bars"><i><b style="width:'+(dn/p.days*100)+'%"></b></i></div><button class="btn soft" data-a="plan" data-v="'+p.id+'">Continuar</button>':'<button class="btn" data-a="planStart" data-v="'+p.id+'">Empezar hoy</button>')+'</div>'; }).join('');
 var p=planById(U.plan); if(!p) return head;
 var st=S.plans&&S.plans[p.id]; if(!st) return head+'<div class="panel"><b>'+esc(p.t)+'</b><span class="small muted">'+esc(p.d)+'</span><button class="btn" data-a="planStart" data-v="'+p.id+'">Empezar hoy</button></div>';
 var days=planDays(p), today=Math.min(planToday(p.id),days.length-1), dn=planDone(p.id), nx=planNext(p);
 var rows=days.map(function(chs,i){ var ok=!!(st.done||{})[i], now=i===nx;
  return '<div class="planrow'+(ok?' ok':'')+(now?' now':'')+'" id="pd'+i+'"><button class="pchk" data-a="planDay" data-v="'+p.id+':'+i+'" aria-pressed="'+ok+'" aria-label="Día '+(i+1)+(ok?' leído':' sin leer')+'">'+(ok?ic('check',16,3):'')+'</button><div class="stack" style="gap:2px;min-width:0"><span class="small muted">Día '+(i+1)+(i===today?' · hoy':'')+'</span><span class="prefs">'+chs.map(function(x){ return '<button class="link" data-a="planRead" data-b="'+x[0]+'" data-c="'+x[1]+'">'+esc(IDX[x[0]-1][0])+' '+x[1]+'</button>'; }).join(' ')+'</span></div></div>'; }).join('');
 return head+'<div class="panel"><b>'+esc(p.t)+'</b><span class="small muted">Empezaste el '+esc(st.start.split('-').reverse().join('/'))+' · '+dn+' de '+p.days+' días leídos'+(dn<today+1&&nx>=0?' · vas '+(today+1-dn)+' día'+(today+1-dn===1?'':'s')+' atrás':'')+'</span><div class="bars"><i><b style="width:'+(dn/p.days*100)+'%"></b></i></div>'
  +'<div class="grid2"><button class="btn soft" data-a="planGoNext" data-v="'+p.id+'"'+(nx<0?' disabled':'')+'>Ir al siguiente</button><button class="btn soft" data-a="planStop" data-v="'+p.id+'">Dejar el plan</button></div></div>'
  +'<div class="stack" style="gap:6px">'+rows+'</div>'; }

/* ---------- Recordatorios en el calendario del celular ----------
   Sin servidor: se genera un archivo .ics con eventos repetidos y aviso a la hora elegida. Funciona en Android y iPhone */
var REMS=[['ang','Ángelus','12:00','d','Reza el Ángelus en Lumen.'],['man','Oración de la mañana','06:30','d','Empieza el día con la oración de la mañana en Lumen.'],
 ['ros','Santo Rosario','19:00','d','Hora de rezar el Rosario con Lumen.'],['plan','Plan de lectura','21:00','d','Tu lectura bíblica de hoy en Lumen.'],['misa','Misa del domingo','09:00','w','Lecturas y Misa del domingo en Lumen.']];
function remState(){ S.rem=S.rem||{}; REMS.forEach(function(r){ if(!S.rem[r[0]]) S.rem[r[0]]={on:r[0]==='ang',t:r[2]}; }); return S.rem; }
function remPanel(){ var st=remState();
 return '<div class="panel"><span class="small muted">Elige tus recordatorios y agrégalos al calendario de tu celular. Te avisará cada día a la hora que escojas, aunque Lumen esté cerrada.</span>'
  +REMS.map(function(r){ var s=st[r[0]]; return '<div class="remrow"><label class="row" style="gap:10px;flex:1;min-width:0"><input type="checkbox" class="rchk" data-a="remOn" data-v="'+r[0]+'"'+(s.on?' checked':'')+'><span class="stack" style="gap:0;min-width:0"><b>'+r[1]+'</b><span class="small muted">'+(r[3]==='w'?'Cada domingo':'Todos los días')+'</span></span></label><input type="time" class="inp rtime" data-a="remT" data-v="'+r[0]+'" value="'+esc(s.t)+'" aria-label="Hora de '+esc(r[1])+'"></div>'; }).join('')
  +'<button class="btn" data-a="remIcs">'+ic('cal',20)+'Agregar al calendario</button><span class="small muted">Para cambiarlos más adelante, bórralos de tu calendario y vuelve a agregarlos desde aquí.</span></div>'; }
function remIcs(){ var st=remState(), on=REMS.filter(function(r){ return st[r[0]].on; }); if(!on.length){ toast('Elige al menos un recordatorio'); return; }
 var p2=function(n){ return String(n).padStart(2,'0'); }, now=new Date(), stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d+/,''), url='https://www.planificarproyectos.com/lumen/';
 var L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Planificar Proyectos//Lumen//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Lumen'];
 on.forEach(function(r){ var t=(st[r[0]].t||r[2]).split(':'), d=new Date(now.getFullYear(),now.getMonth(),now.getDate(),+t[0],+t[1]);
  if(r[3]==='w'){ while(d.getDay()!==0) d.setDate(d.getDate()+1); } if(d<now) d.setDate(d.getDate()+(r[3]==='w'?7:1));
  var ds=d.getFullYear()+p2(d.getMonth()+1)+p2(d.getDate())+'T'+p2(d.getHours())+p2(d.getMinutes())+'00';
  L.push('BEGIN:VEVENT','UID:lumen-'+r[0]+'-'+stamp+'@planificarproyectos.com','DTSTAMP:'+stamp,'DTSTART:'+ds,'DURATION:PT15M',
   'RRULE:'+(r[3]==='w'?'FREQ=WEEKLY;BYDAY=SU':'FREQ=DAILY'),'SUMMARY:'+r[1]+' · Lumen','DESCRIPTION:'+r[4]+' '+url,'URL:'+url,
   'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+r[1],'TRIGGER:PT0M','END:VALARM','END:VEVENT'); });
 L.push('END:VCALENDAR');
 var blob=new Blob([L.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}), a=document.createElement('a');
 a.href=URL.createObjectURL(blob); a.download='lumen-recordatorios.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); },4000);
 toast(isIOS()?'Toca “Agregar todo” para guardarlos en tu calendario':'Abre el archivo descargado con tu app de Calendario',6000); }

/* ---------- Compartir como imagen ----------
   Versículos (tocándolos en un capítulo) o la frase del día se convierten en una imagen 1080×1350 sobre un fondo de cielo distinto cada vez */
function vselBar(){ var n=(U.vsel||[]).length; if(!n) return '';
 return '<div class="vbar" role="region" aria-label="Versículos seleccionados"><span class="small"><b>'+n+'</b> '+(n===1?'versículo':'versículos')+'</span><span class="row" style="gap:6px"><button class="say" data-a="vcopy">'+ic('copy',16)+'<span>Copiar</span></button><button class="say on" data-a="vshare">'+ic('share',16)+'<span>Imagen</span></button><button class="icon-btn" data-a="vclear" aria-label="Quitar selección">'+ic('x',18)+'</button></span></div>'; }
function vselPick(){ var b=U.bk, c=U.ch, bk=BOOKS_DATA[b]; if(!bk||!U.vsel||!U.vsel.length) return null;
 var vs=U.vsel.slice().sort(function(x,y){ return x-y; }), ch=bk.c[c-1]||[], parts=[], s=vs[0], p=vs[0];
 for(var i=1;i<=vs.length;i++){ if(vs[i]===p+1){ p=vs[i]; continue; } parts.push(s===p?String(s):s+'-'+p); s=p=vs[i]; }
 return {text:vs.map(function(v){ return ch[v-1]||''; }).join(' '),ref:IDX[b-1][0]+' '+c+', '+parts.join('. ')}; }
function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function wrapLines(ctx,text,maxW){ var words=String(text).split(/\s+/), lines=[], ln='';
 words.forEach(function(w){ var t=ln?ln+' '+w:w; if(ctx.measureText(t).width>maxW&&ln){ lines.push(ln); ln=w; } else ln=t; }); if(ln) lines.push(ln); return lines; }
/* Fondos "de cielo": cada imagen sale distinta. Se elige una paleta al azar (gloria, cielo, aurora, vitral, rosa mística,
   Pentecostés, sabiduría) y se pintan, en posiciones al azar, una luz que irradia rayos, resplandores, cintas de luz,
   destellos y partículas. Todo es abstracto y la frase va sobre un panel translúcido para que siempre se lea. */
var SKY=[
 {g:['#140a35','#4a1a66','#c24d7a'],b:['#ffd27a','#ff7aa8','#8a5cff','#ffe9b0'],l:'#ffe6a8',a:'#FFD27A'},
 {g:['#06173a','#124c98','#4aa6dc'],b:['#9fe3ff','#ffffff','#ffd98a','#5d8bff'],l:'#fff2c8',a:'#FFE08A'},
 {g:['#03131c','#0b4f58','#4b3a92'],b:['#5ef2c8','#b48cff','#ffe39a','#46c7ff'],l:'#e8fff4',a:'#9BFFE0'},
 {g:['#10042a','#360c58','#6e1236'],b:['#ff4f7b','#4fa3ff','#ffc94f','#b45cff'],l:'#fff0c8',a:'#FFC94F'},
 {g:['#26082c','#6e2462','#d16d96'],b:['#ffb3d1','#fff0c2','#c58cff','#ff8a9b'],l:'#fff3e0',a:'#FFE2A8'},
 {g:['#260407','#7e1716','#d24d26'],b:['#ffd36b','#ff6b3d','#fff3c4','#ff9f5a'],l:'#fff6d6',a:'#FFE08A'},
 {g:['#050f28','#103a66','#1b9696'],b:['#fff6c9','#7cf0e0','#8fb8ff','#ffffff'],l:'#fffbe6',a:'#FFF0A8'}
];
function rnd(a,b){ return a+Math.random()*(b-a); }
function rgba(hex,al){ var n=parseInt(hex.slice(1),16); return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+al+')'; }
function heavenBg(x,W,H){
 var s=SKY[Math.floor(Math.random()*SKY.length)], sx=rnd(.15,.85)*W, sy=rnd(.04,.3)*H, i, g;
 g=x.createLinearGradient(W-sx,H,sx,0); g.addColorStop(0,s.g[0]); g.addColorStop(.55,s.g[1]); g.addColorStop(1,s.g[2]); x.fillStyle=g; x.fillRect(0,0,W,H);
 x.globalCompositeOperation='screen';
 for(i=0;i<6;i++){ var bx=rnd(-.1,1.1)*W, by=rnd(-.05,1.05)*H, br=rnd(.3,.7)*W, c=s.b[i%s.b.length];   // resplandores de color
  g=x.createRadialGradient(bx,by,0,bx,by,br); g.addColorStop(0,rgba(c,rnd(.35,.6))); g.addColorStop(1,rgba(c,0)); x.fillStyle=g; x.fillRect(0,0,W,H); }
 var rc=document.createElement('canvas'); rc.width=W; rc.height=H; var r=rc.getContext('2d'), n=Math.round(rnd(14,26)), off=rnd(0,6.3);   // rayos de luz
 for(i=0;i<n;i++){ var a0=off+i*6.283/n; r.fillStyle=rgba(s.l,rnd(.06,.2)); r.beginPath(); r.moveTo(sx,sy); r.arc(sx,sy,H*1.7,a0,a0+rnd(.03,.12)); r.closePath(); r.fill(); }
 r.globalCompositeOperation='destination-in'; g=r.createRadialGradient(sx,sy,0,sx,sy,H*rnd(.8,1.1)); g.addColorStop(0,'#000'); g.addColorStop(1,'rgba(0,0,0,0)'); r.fillStyle=g; r.fillRect(0,0,W,H);
 x.drawImage(rc,0,0);
 x.lineWidth=2;   // cintas de luz que cruzan la imagen
 for(var k=0;k<3;k++){ var y0=rnd(.1,.9)*H, y1=rnd(0,1)*H, y2=rnd(0,1)*H, y3=rnd(.1,.9)*H, c2=s.b[(k+1)%s.b.length], d1=rnd(-6,6), d2=rnd(-6,6);
  for(var j=0;j<46;j++){ x.strokeStyle=rgba(c2,.045); x.beginPath(); x.moveTo(-60,y0+j*3); x.bezierCurveTo(W*.33,y1+j*d1,W*.66,y2+j*d2,W+60,y3+j*2); x.stroke(); } }
 var hr=rnd(240,420);   // la fuente de luz con su halo
 g=x.createRadialGradient(sx,sy,0,sx,sy,hr); g.addColorStop(0,'rgba(255,255,255,.95)'); g.addColorStop(.18,rgba(s.l,.75)); g.addColorStop(1,rgba(s.l,0)); x.fillStyle=g; x.fillRect(0,0,W,H);
 for(i=1;i<=3;i++){ x.strokeStyle='rgba(255,255,255,'+(.16/i)+')'; x.lineWidth=2; x.beginPath(); x.arc(sx,sy,hr*(.5+i*.38),0,6.283); x.stroke(); }
 for(i=0;i<60;i++){ var px=rnd(0,W), py=rnd(0,H), pr=Math.random()<.8?rnd(2,9):rnd(14,46);   // partículas
  g=x.createRadialGradient(px,py,0,px,py,pr); g.addColorStop(0,rgba(pr>12?s.b[i%s.b.length]:s.l,rnd(.25,.7))); g.addColorStop(1,rgba(s.l,0)); x.fillStyle=g; x.beginPath(); x.arc(px,py,pr,0,6.283); x.fill(); }
 for(i=0;i<10;i++){ var qx=rnd(0,W), qy=rnd(0,H), L=rnd(12,34), t=L*.13;   // destellos de cuatro puntas
  x.fillStyle='rgba(255,255,255,'+rnd(.55,.9)+')'; x.beginPath(); x.moveTo(qx,qy-L); x.lineTo(qx+t,qy-t); x.lineTo(qx+L,qy); x.lineTo(qx+t,qy+t); x.lineTo(qx,qy+L); x.lineTo(qx-t,qy+t); x.lineTo(qx-L,qy); x.lineTo(qx-t,qy-t); x.closePath(); x.fill(); }
 x.globalCompositeOperation='source-over';
 g=x.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.8); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.4)'); x.fillStyle=g; x.fillRect(0,0,W,H);
 return s;
}
function shareImage(text,ref){
 var W=1080,H=1350,P=96, cv=document.createElement('canvas'); cv.width=W; cv.height=H; var x=cv.getContext('2d');
 var disp='"Barlow Condensed","Arial Narrow",sans-serif', body='"DM Sans",system-ui,sans-serif';
 var ready=document.fonts&&document.fonts.load?Promise.all([document.fonts.load('700 48px "Barlow Condensed"'),document.fonts.load('600 60px "Barlow Condensed"'),document.fonts.load('700 36px "DM Sans"')]).catch(function(){}):Promise.resolve();
 return ready.then(function(){
  var s=heavenBg(x,W,H), fg='#FFFFFF', afg=s.a;
  var bx=P-40, by=210, bw=W-2*bx, bh=H-210-200, a1=document.createElement('canvas'), a2=document.createElement('canvas');   // panel de vidrio esmerilado: el fondo reducido y ampliado queda difuminado
  a1.width=Math.round(bw/6); a1.height=Math.round(bh/6); a1.getContext('2d').drawImage(cv,bx,by,bw,bh,0,0,a1.width,a1.height);
  a2.width=Math.round(bw/24); a2.height=Math.round(bh/24); a2.getContext('2d').drawImage(a1,0,0,a2.width,a2.height);
  x.save(); x.beginPath(); if(x.roundRect) x.roundRect(bx,by,bw,bh,44); else x.rect(bx,by,bw,bh); x.clip(); x.imageSmoothingQuality='high'; x.drawImage(a2,bx,by,bw,bh);
  x.fillStyle='rgba(10,6,30,.34)'; x.fillRect(bx,by,bw,bh); x.restore();
  x.strokeStyle='rgba(255,255,255,.3)'; x.lineWidth=2; x.beginPath(); if(x.roundRect) x.roundRect(bx,by,bw,bh,44); else x.rect(bx,by,bw,bh); x.stroke();
  x.shadowColor='rgba(0,0,0,.45)'; x.shadowBlur=14; x.shadowOffsetY=2;
  x.textBaseline='alphabetic'; x.font='700 56px '+disp; x.fillStyle=fg; x.fillText('LU',P,140); var lw=x.measureText('LU').width; x.fillStyle=afg; x.fillText('MEN',P+lw,140);
  var maxW=W-2*P-20, top=300, bottom=H-200-150, fs=86, lines, lh;
  for(;fs>=34;fs-=2){ x.font='600 '+fs+'px '+disp; lines=wrapLines(x,text,maxW); lh=Math.round(fs*1.14); if(lines.length*lh<=bottom-top) break; }
  if(lines.length*lh>bottom-top){ var maxL=Math.floor((bottom-top)/lh); lines=lines.slice(0,maxL); lines[maxL-1]=lines[maxL-1].replace(/\s*\S*$/,'')+' …'; }
  x.font='700 160px '+disp; x.fillStyle=afg; x.fillText('“',P-6,top+70);
  x.font='600 '+fs+'px '+disp; x.fillStyle=fg; var y=top+(bottom-top-lines.length*lh)/2+fs; lines.forEach(function(l){ x.fillText(l,P+10,y); y+=lh; });
  x.font='700 40px '+body; x.fillStyle=afg; x.fillText(ref,P+10,H-200-60);
  x.font='500 30px '+body; x.fillStyle='rgba(255,255,255,.85)'; x.fillText('planificarproyectos.com/lumen',P,H-90);
  x.shadowColor='transparent'; x.shadowBlur=0; x.shadowOffsetY=0;
  return new Promise(function(res){ cv.toBlob(res,'image/png'); });
 }).then(function(blob){ if(!blob){ toast('No se pudo crear la imagen'); return; }
  var name='lumen-'+ref.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.png', file=null;
  try{ file=new File([blob],name,{type:'image/png'}); }catch(e){}
  if(file&&navigator.canShare&&navigator.canShare({files:[file]})) return navigator.share({files:[file],title:ref,text:ref+' · Lumen'}).catch(function(e){ if(e&&e.name!=='AbortError') toast('No se pudo compartir'); });
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); },4000); toast('Imagen guardada en tus descargas');
 });
}

function vPray(){
 var id=U.pid, pr=PRAY_CACHE[id], back='<header class="row"><button class="icon-btn" data-a="pback" aria-label="Volver">'+ic('back')+'</button><h1>'+esc((PRAY[id]||{}).t||'').toUpperCase()+'</h1></header>';
 if(!pr){ loadPrayer(id).then(render,function(){ toast('No se pudo cargar la oración. Revisa tu conexión.'); }); return back+loading(); }
 var rut=RUT.some(function(r){ return r[0]===id; });
 return back+'<div>'+sayBtn('pray-'+id)+'</div>'
  +pr.parts.map(function(p){ return '<div class="panel" style="gap:8px">'+(p.h?'<span class="label ac">'+esc(p.h)+'</span>':'')+'<p class="ptext">'+fmt(p.text)+'</p></div>'; }).join('')
  +(rut?'<button class="btn'+(isDone(id)?' soft':'')+'" data-a="done" data-id="'+id+'">'+(isDone(id)?'Rezada hoy ✓':'Marcar como rezada')+'</button>':'');
}

function pinGuide(){
 var ios=isIOS();
 var st=ios?['Ajustes › Accesibilidad › <b>Acceso guiado</b>: actívalo y crea un código.','Abre Lumen y presiona <b>tres veces</b> el botón lateral › <b>Iniciar</b>.','Para salir: tres veces el botón lateral y escribe tu código.']
  :['Ajustes › Seguridad (o Seguridad y privacidad) › Más ajustes › <b>Fijar aplicaciones</b>: actívalo.','Abre Lumen, ve a <b>Recientes</b>, toca el ícono de Lumen › <b>Fijar</b>.','Para salir: mantén presionados Atrás y Recientes (o desliza hacia arriba y mantén).'];
 return '<div class="panel"><p class="small muted">Toca el candado '+ic('lock',14)+' en Misa o Rosario: la pantalla queda negra y no responde a toques. Para salir, mantén presionado 2 segundos.</p>'
  +'<details class="guide"><summary>Bloquear también los botones del celular</summary><ol>'+st.map(function(x){ return '<li>'+x+'</li>'; }).join('')+'</ol></details></div>'; }
function voiceGuide(){
 var ios=isIOS();
 var steps=ios?['Abre Ajustes › Accesibilidad › Contenido leído › Voces › Español.','Descarga una voz <b>Mejorada</b> o <b>Premium</b> (por ejemplo Paulina o Mónica).','Vuelve a Lumen, elígela arriba en <b>Voz</b> y toca <b>Probar voz</b>.','Si no suena nada, quita el modo silencio del iPhone.']
  :['Abre Ajustes › Sistema › Idioma › <b>Salida de texto a voz</b>.','Elige el motor <b>Servicios de voz de Google</b>.','En ⚙️ › Instalar datos de voz › Español, descarga la voz de mayor calidad.','Vuelve a Lumen, elige una voz <b>Google español</b> arriba y toca <b>Probar voz</b>.'];
 return '<details class="guide"><summary>¿La voz suena robótica? Mejórala en '+(ios?'tu iPhone':'tu Android')+'</summary><ol>'+steps.map(function(x){ return '<li>'+x+'</li>'; }).join('')+'</ol><p class="small muted">Consejo: una velocidad de 0.9× suena más natural.</p></details>'; }
function vMe(){
 var vs=rankedVoices(), u=Cloud.user, cr=u&&u.created?new Date(u.created):null, dark=S.mode!=='light';
 var card=function(a,icn,t,sub,cls){ return '<button class="card'+(cls?' '+cls:'')+'" data-a="'+a+'">'+ic(icn,22)+'<span class="grow"><b>'+t+'</b><span>'+sub+'</span></span>'+ic('chevR',20)+'</button>'; };
 return '<header><h1>CUENTA</h1></header>'
  +'<div class="panel"><div class="prof"><span class="av">'+ic('user',26,2.2)+'</span><div class="stack" style="gap:2px;min-width:0"><b style="overflow-wrap:anywhere">'+esc(S.name||(u&&u.email)||'Sin sesión')+'</b>'
   +(S.name&&u?'<span class="small muted" style="overflow-wrap:anywhere">'+esc(u.email)+'</span>':'')
   +(cr?'<span class="small muted">Cuenta creada el '+cr.getDate()+' '+MONTHS[cr.getMonth()].slice(0,3)+' '+cr.getFullYear()+'</span>':'')+'</div></div></div>'
  +'<div class="panel"><label class="label" for="nm">Tu nombre</label><div class="namerow"><input class="inp" id="nm" maxlength="30" value="'+esc(S.name)+'" placeholder="¿Cómo te llamas?" autocomplete="given-name"><button class="btn" data-a="saveName">Guardar</button></div><span class="small muted">Se usa en Mind Focus, PowerFit y Lumen.</span></div>'
  +'<section class="stack"><h2>Ajustes</h2>'
   +(u?card('resetPass','key','Cambiar contraseña','Te enviamos un correo para crear una nueva'):'')
   +(Inst.standalone()?'<div class="card">'+ic('check',22)+'<span class="grow"><b>App instalada</b><span>Estás usando Lumen como app</span></span></div>':Inst.can()?'<div class="panel">'+Inst.body(false)+'</div>':'<div class="card">'+ic('dl',22)+'<span class="grow"><b>Instalar app</b><span>Android: Chrome › ⋮ › Instalar app. iPhone: Safari › Compartir › Agregar a pantalla de inicio</span></span></div>')
   +'<a class="card" target="_blank" rel="noopener" href="'+esc((window.wellnessWA||function(a,t){return "https://wa.me/573204451740"})('Lumen','soporte',u&&u.email))+'">'+ic('chat',22)+'<span class="grow"><b>Contactar soporte</b><span>Escríbenos por WhatsApp si algo no funciona</span></span>'+ic('chevR',20)+'</a>'
   +'<a class="card" target="_blank" rel="noopener" href="'+esc((window.wellnessWA||function(a,t){return "https://wa.me/573204451740"})('Lumen','recomendacion',u&&u.email))+'">'+ic('bulb',22)+'<span class="grow"><b>Enviar recomendaciones</b><span>Cuéntanos qué mejorarías, por WhatsApp</span></span>'+ic('chevR',20)+'</a>'
   +(u?card('logout','out','Cerrar sesión','Tus datos quedan guardados en tu cuenta'):'')
   +(U.confirmReset?'<div class="panel"><b>¿Borrar racha, rutina y progreso del Rosario?</b><span class="small muted">No se puede deshacer.</span><div class="grid2"><button class="btn soft" data-a="resetNo">Cancelar</button><button class="btn danger" data-a="resetYes">Sí, borrar</button></div></div>'
     :card('reset','trash','Borrar mis datos',u?'Racha, rutina y progreso del Rosario. No se puede deshacer':'Se borran de este dispositivo','danger'))
  +'</section>'
  +'<section class="stack"><h2>Recordatorios</h2>'+remPanel()+'</section>'
  +'<section class="stack"><h2>Modo bolsillo</h2>'+pinGuide()+'</section>'
  +'<section class="stack"><h2>Apariencia</h2><div class="panel"><b class="small">Color de énfasis</b><div class="swatches" role="radiogroup" aria-label="Color de énfasis">'+Object.keys(ACCENTS).map(function(k){ var c=ACCENTS[k], on=S.accent===k; return '<button class="sw'+(on?' on':'')+'" role="radio" data-a="accent" data-v="'+k+'" aria-checked="'+on+'"><i style="background:'+c[1]+'">'+(on?ic('check',18,3):'')+'</i>'+c[0]+'</button>'; }).join('')+'</div></div>'
   +'<div class="panel"><div class="between"><div class="stack" style="gap:2px"><b>Modo oscuro</b><span class="small muted">'+(dark?'Activado':'Desactivado')+' · no depende del celular</span></div><button class="switch" role="switch" aria-checked="'+dark+'" aria-label="Modo oscuro" data-a="dark"></button></div></div></section>'
  +'<section class="stack"><h2>Lectura en voz alta</h2><div class="panel">'
  +(TTS?'<label class="small muted" for="vsel">Voz</label><select class="inp" id="vsel" data-a="voice"><option value="">Automática (recomendada)</option>'+vs.map(function(v,k){ return '<option value="'+esc(v.name)+'"'+(v.name===S.voice?' selected':'')+'>'+esc(v.name)+' ('+v.lang+')'+(k===0?' · mejor disponible':'')+'</option>'; }).join('')+'</select>'
   +'<div class="between"><label class="small muted" for="rate">Velocidad</label><span class="small num" id="rateV">'+(+S.rate||1).toFixed(1)+'×</span></div><input type="range" id="rate" data-a="rate" min="0.6" max="1.4" step="0.1" value="'+(S.rate||1)+'">'
   +'<div>'+sayBtn('test','Probar voz')+'</div>'+voiceGuide()
   :'<p class="small muted">Este navegador no permite lectura en voz alta. Usa Chrome (Android) o Safari (iPhone).</p>')+'</div></section>'
  +'<a class="card" target="_blank" rel="noopener" style="border:1px solid var(--accent-fg)" href="'+esc((window.WELLNESS_APPS_URL||"https://www.planificarproyectos.com/wellness-apps/"))+'">'+ic('apps',22)+'<span class="grow"><b>Conoce más Wellness Apps</b><span>Mind Focus, PowerFit y Lumen en un solo lugar</span></span>'+ic('chevR',20)+'</a>'
  +'<p class="small muted" style="text-align:center">'+(u?'Una cuenta para Mind Focus, PowerFit y Lumen':'Tus datos se guardan en este dispositivo')+'</p>';
}

/* ---------- Render ---------- */
var TABS=[['misa','Misa','church'],['rosary','Rosario','rosary'],['home','Hoy','sun'],['bible','Biblia','book'],['me','Cuenta','user']];
function render(){
 refreshDay();
 var nav=document.querySelector('nav.tabs');
 if(needAuth()||Cloud.noAccess){ nav.hidden=true; $('app').innerHTML='<div class="wrap" style="padding-bottom:24px">'+(Cloud.noAccess?vNoAccess():vAuth())+'</div>'; Inst.show(); return; }
 nav.hidden=false;
 var v={home:vHome,rosary:vRosary,misa:vHoy,bible:vBible,me:vMe,pray:vPray}[U.tab]();
 $('app').innerHTML='<div class="wrap">'+v+'</div>';
 var cur=U.tab==='pray'?'home':U.tab;
 $('navIn').innerHTML=TABS.map(function(t){
  if(t[0]==='home') return '<button class="hoy'+(cur==='home'?' on':'')+'" data-a="tab" data-v="home" aria-current="'+(cur==='home'?'page':'false')+'"><span>'+ic('sun',26,2.2)+'</span>Hoy</button>';
  return '<button class="'+(cur===t[0]?'on':'')+'" data-a="tab" data-v="'+t[0]+'" aria-current="'+(cur===t[0]?'page':'false')+'">'+ic(t[2],22)+t[1]+'</button>'; }).join('');
 updSay();
 if(U.tab==='rosary'){ var st=$('rstrip'), sv=$('rsvg'); if(st&&sv){ var rs=rosarySvg(rosI()); st.scrollLeft=Math.max(0,rs.x-st.clientWidth/2); } }
 Inst.show();
}

function sayText(id){
 if(id==='frase') return LIT.frase?LIT.frase.t+' '+LIT.frase.ref:'';
 if(id==='test') return 'Paz y bien'+(S.name?', '+S.name:'')+'. Así sonará la lectura en voz alta.';
 if(id.indexOf('ros-')===0) return stepText(STEPS[+id.slice(4)]);
 if(id.indexOf('pray-')===0){ var pr=PRAY_CACHE[id.slice(5)]; return pr?prayerSay(pr):''; }
 if(id.indexOf('cap-')===0){ var a=id.slice(4).split(':'), bk=BOOKS_DATA[+a[0]]; return bk?IDX[+a[0]-1][0]+', capítulo '+a[1]+'. '+(bk.c[+a[1]-1]||[]).join(' '):''; }
 return '';
}
function go(tab){ U.tab=tab; U.confirmReset=false; render(); try{ window.scrollTo(0,0); }catch(e){} }

/* ---------- Eventos ---------- */
document.addEventListener('click',function(e){
 var el=e.target.closest('[data-a]'); if(!el||el.disabled) return; var a=el.getAttribute('data-a'), v=el.getAttribute('data-v');
 if(el.closest('summary')&&el.tagName==='BUTTON') e.preventDefault();
 if(a==='tab'){ if(v==='bible'&&U.tab==='bible'){ U.bk=null; U.ch=null; U.plan=null; } go(v); return; }
 if(a==='say'){ var id=el.getAttribute('data-id'); speak(sayText(id),id); return; }
 if(a==='done'){ var id2=el.getAttribute('data-id'); setDone(id2,!isDone(id2)); render(); return; }
 if(a==='open'){ if(v==='misa'){ go('misa'); return; } if(v==='ros'){ go('rosary'); return; } U.pid=v; go('pray'); return; }
 if(a==='pback'){ go('home'); return; }
 if(a==='copy'){ if(!LIT.frase) return; var txt=LIT.frase.t+' ('+LIT.frase.ref+')';
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(function(){ toast('Frase copiada'); },function(){ toast(txt,5000); }); } else toast(txt,5000); return; }
 if(a==='pocket'){ pocketOn(); return; }
 if(a==='shareFrase'){ if(LIT.frase) shareImage(LIT.frase.t,LIT.frase.ref); return; }
 if(a==='vsel'){ if(window.getSelection&&String(window.getSelection())) return; var vn=+v, s0=U.vsel||[]; U.vsel=s0.indexOf(vn)>=0?s0.filter(function(z){ return z!==vn; }):s0.concat(vn); render(); return; }
 if(a==='vclear'){ U.vsel=null; render(); return; }
 if(a==='plans'){ U.plan='*'; U.bk=null; U.ch=null; render(); window.scrollTo(0,0); return; }
 if(a==='plan'||a==='openplan'){ U.tab='bible'; U.plan=v; U.bk=null; U.ch=null; render(); var nx0=planNext(planById(v)||PLANS[0]); setTimeout(function(){ var el=document.getElementById('pd'+Math.max(0,nx0-1)); if(el) try{ el.scrollIntoView({block:'start'}); }catch(x){} },60); return; }
 if(a==='planback'){ U.plan=U.plan&&U.plan!=='*'?'*':null; render(); window.scrollTo(0,0); return; }
 if(a==='remIcs'){ remIcs(); return; }
 if(a==='planStart'){ S.plans=S.plans||{}; S.plans[v]={start:TODAY,done:{}}; save(); U.plan=v; render(); toast('Plan iniciado. ¡Buena lectura!'); return; }
 if(a==='planStop'){ if(S.plans){ delete S.plans[v]; save(); } U.plan='*'; render(); toast('Dejaste el plan'); return; }
 if(a==='planDay'){ var pv=v.split(':'), st=S.plans&&S.plans[pv[0]]; if(!st) return; st.done=st.done||{}; if(st.done[pv[1]]) delete st.done[pv[1]]; else st.done[pv[1]]=1; save(); render(); var pp=planById(pv[0]); if(pp&&planDone(pv[0])>=pp.days) toast('¡Completaste el plan! Gloria a Dios.'); return; }
 if(a==='planRead'){ var pb=+el.getAttribute('data-b'), pc=+el.getAttribute('data-c'); U.vsel=null; U.bk=pb; U.ch=pc; U.hl=null; U.from=null; stopSpeak(); render(); window.scrollTo(0,0); return; }
 if(a==='planGoNext'){ var p3=planById(v), i3=planNext(p3); if(i3<0) return; var x3=planDays(p3)[i3][0]; U.vsel=null; U.bk=x3[0]; U.ch=x3[1]; U.hl=null; U.from=null; stopSpeak(); render(); window.scrollTo(0,0); return; }
 if(a==='vcopy'){ var pk=vselPick(); if(!pk) return; var tx=pk.text+' ('+pk.ref+')'; if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(tx).then(function(){ toast('Versículos copiados'); },function(){ toast(tx,5000); }); else toast(tx,5000); return; }
 if(a==='vshare'){ var pk2=vselPick(); if(pk2) shareImage(pk2.text,pk2.ref); return; }
 if(a==='massPlay'){ if(M.playing) M.stop(); else M.play(M.idx); return; }
 if(a==='afToggle'){ audToggle(); return; }
 if(a==='afGo'){ audGo(); return; }
 if(a==='afStop'){ audStop(); return; }
 if(a==='massFrom'){ M.play(+v); return; }
 if(a==='mprev'||a==='mnext'){ var b0=U.mdate?new Date(U.mdate):new Date(); b0.setDate(b0.getDate()+(a==='mprev'?-1:1)); setMassDate(b0); return; }
 if(a==='mtoday'){ setMassDate(null); return; }
 if(a==='massRestart'){ M.stop(); M.idx=0; if(AUD&&AUD.kind==='misa') AUD=null; render(); return; }
 if(a==='rset'){ R.playing=false; stopSpeak(); if(AUD&&AUD.kind==='rosa') AUD=null; U.rosSet=v; render(); return; }
 if(a==='rosPlay'){ if(R.playing){ R.playing=false; stopSpeak(); updSay(); } else R.play(); return; }
 if(a==='rnext'||a==='rprev'){
  var i=rosI(); i=a==='rnext'?Math.min(STEPS.length,i+1):Math.max(0,i-1); S.ros[rosKey()]=i;
  if(i>=STEPS.length){ setDone('ros',true); toast('Rosario completado'); }
  save(); var wasPlaying=R.playing; R.playing=false; stopSpeak(); render(); if(wasPlaying&&i<STEPS.length) R.play(); return; }
 if(a==='rosRestart'){ R.playing=false; stopSpeak(); if(AUD&&AUD.kind==='rosa') AUD=null; S.ros[rosKey()]=0; save(); render(); return; }
 if(a==='rreset'){ S.ros[rosKey()]=0; save(); render(); return; }
 if(a==='goread'){ var src=U.tab==='misa'?viewMass():LIT.mass; var pp=massParts(src).filter(function(x){ return x.i===+v; })[0]; if(pp&&pp.verses&&pp.verses.length){ var f=pp.verses[0], same=pp.verses.filter(function(x){ return x.c===f.c; }); goCita({b:pp.book,c:f.c,v1:f.v,v2:same[same.length-1].v},U.tab==='misa'?'misa':null); } return; }
 if(a==='gohit'){ goCita({b:+el.getAttribute('data-b'),c:+el.getAttribute('data-c'),v1:+v,v2:+v}); return; }
 if(a==='test'){ U.test=v; U.bk=null; U.ch=null; U.vsel=null; render(); return; }
 if(a==='bsClear'){ BS={q:'',busy:false,items:null,done:0}; render(); return; }
 if(a==='book'){ U.vsel=null; U.bk=+v; U.ch=null; render(); window.scrollTo(0,0); return; }
 if(a==='chap'){ U.vsel=null; U.hl=null; U.ch=+v; stopSpeak(); render(); window.scrollTo(0,0); return; }
 if(a==='bback'){ U.vsel=null; U.bk=null; render(); return; }
 if(a==='cback'){ U.vsel=null; if(U.plan) U.bk=null; U.hl=null; U.from=null; U.ch=null; stopSpeak(); render(); return; }
 if(a==='mode'){ S.mode=v; applyTheme(); save(); render(); return; }
 if(a==='dark'){ S.mode=S.mode==='light'?'dark':'light'; applyTheme(); save(); render(); return; }
 if(a==='saveName'){ var nv=(($('nm')||{}).value||'').trim().slice(0,30); if(!nv){ toast('Escribe tu nombre.'); return; } S.name=nv; save(); Cloud.pushName(nv); render(); return; }
 if(a==='accent'){ S.accent=v; applyTheme(); save(); render(); return; }
 if(a==='reset'){ U.confirmReset=true; render(); return; }
 if(a==='resetNo'){ U.confirmReset=false; render(); return; }
 if(a==='resetYes'){ S.done={}; S.ros={}; save(); U.confirmReset=false; render(); toast('Datos borrados'); return; }
 if(a==='nameNo'){ try{ localStorage.setItem('lumen:askName',dkey(new Date())); }catch(x){} closeName(); return; }
 if(a==='authMode'){ U.authMode=v; render(); return; }
 if(a==='logout'){ stopSpeak(); if(Cloud.auth) Cloud.auth.signOut(); return; }
 if(a==='resetPass'){ if(Cloud.auth&&Cloud.user) Cloud.auth.sendPasswordResetEmail(Cloud.user.email,{url:RESET_URL}).then(function(){ toast('Te enviamos un correo a '+Cloud.user.email); },function(err){ toast(authErr(err)); }); return; }
 if(a==='instGo'){ var pr=Inst.prompt; if(!pr) return; pr.prompt(); (pr.userChoice||Promise.resolve({})).then(function(c){ if(c&&c.outcome==='accepted') Inst.prompt=null; else { try{ localStorage.setItem('lumen:installDismiss',Date.now()); }catch(x){} } Inst.show(); if(U.tab==='me') render(); }); return; }
 if(a==='instNo'){ try{ localStorage.setItem('lumen:installDismiss',Date.now()); }catch(x){} Inst.show(); return; }
});
document.addEventListener('submit',function(e){ if(e.target.id==='bqForm'){ e.preventDefault(); var qv=($('bq').value||'').trim(); U.q=qv; if(!qv) return; var ci=parseCita(qv); if(ci){ BS={q:'',busy:false,items:null,done:0}; goCita(ci); } else bibleSearch(qv); try{ $('bq').blur(); }catch(x){} return; } if(e.target.id==='authForm'){ e.preventDefault(); authSubmit(); }
 if(e.target.id==='nameForm'){ e.preventDefault(); var v=($('nameIn').value||'').trim().slice(0,30); if(!v){ $('nameIn').focus(); return; } S.name=v; save(); closeName(); render(); toast('Paz y bien, '+v); } });
document.addEventListener('change',function(e){
 var a=e.target.getAttribute('data-a');
 if(a==='voice'){ S.voice=e.target.value; save(); }
 if(a==='mdate'&&e.target.value){ var q=e.target.value.split('-'); setMassDate(new Date(+q[0],+q[1]-1,+q[2])); }
 if(a==='rate'){ S.rate=parseFloat(e.target.value)||1; save(); }
 if(a==='remOn'){ remState()[e.target.getAttribute('data-v')].on=e.target.checked; save(); }
 if(a==='remT'&&e.target.value){ remState()[e.target.getAttribute('data-v')].t=e.target.value; save(); }
});
document.addEventListener('input',function(e){
 var a=e.target.getAttribute('data-a');
 if(a==='bq'){ U.q=e.target.value; var pos=e.target.selectionStart; render(); var n=$('bq'); if(n){ n.focus(); try{ n.setSelectionRange(pos,pos); }catch(x){} } }
 if(a==='rate'){ var r=$('rateV'); if(r) r.textContent=parseFloat(e.target.value).toFixed(1)+'×'; }
});
document.addEventListener('visibilitychange',function(){ if(!document.hidden&&dkey(new Date())!==TODAY) render(); });
if(TTS&&speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged',function(){ if(U.tab==='me') render(); });

/* ---------- Instalar como app ---------- */
var Inst={prompt:null,
 standalone:function(){ try{ return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true; }catch(e){ return false; } },
 ios:function(){ var u=navigator.userAgent||''; return /iphone|ipad|ipod/i.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1); },
 can:function(){ return !this.standalone()&&(!!this.prompt||this.ios()); },
 dismissed:function(){ try{ return Date.now()-(+localStorage.getItem('lumen:installDismiss')||0)<12*36e5; }catch(e){ return false; } },
 body:function(inBar){
  if(this.prompt) return '<div class="row">'+logo(40)+'<div class="stack" style="gap:2px;flex:1;min-width:0"><b>Instala Lumen</b><span class="muted small">Ábrela desde tu pantalla de inicio, a pantalla completa y más rápido.</span></div></div>'+
   '<div class="grid2">'+(inBar?'<button class="btn soft" data-a="instNo">Ahora no</button>':'')+'<button class="btn" data-a="instGo"'+(inBar?'':' style="grid-column:1/-1"')+'>Instalar</button></div>';
  return '<div class="row">'+logo(40)+'<div class="stack" style="gap:2px;flex:1;min-width:0"><b>Instala Lumen en tu iPhone</b><span class="muted small">En Safari:</span></div></div>'+
   '<ol><li>Toca <b>Compartir</b> (el cuadro con la flecha hacia arriba).</li><li>Elige <b>Agregar a pantalla de inicio</b> y luego <b>Agregar</b>.</li></ol>'+
   (inBar?'<button class="btn soft" data-a="instNo">Entendido</button>':'');
 },
 show:function(){ var el=document.getElementById('install'); if(!el) return;
  var sp=document.getElementById('splash');
  var nb=document.getElementById('namebox'); var on=this.can()&&!this.dismissed()&&!needAuth()&&(!nb||nb.hidden)&&(!sp||sp.classList.contains('out'));
  if(!on){ el.hidden=true; return; }
  el.innerHTML=this.body(true); el.hidden=false; }
};
window.addEventListener('beforeinstallprompt',function(e){ e.preventDefault(); Inst.prompt=e; Inst.show(); if(U.tab==='me') render(); });
window.addEventListener('appinstalled',function(){ Inst.prompt=null; document.getElementById('install').hidden=true; toast('Lumen quedó instalada'); if(U.tab==='me') render(); });

function needAuth(){ return !!Cloud.auth&&(!Cloud.user||Cloud.wait); }
function brandBig(){ return '<span class="row" style="gap:10px;justify-content:center">'+logo(52)+'<span style="font-family:var(--f-display);font-weight:700;font-size:38px;letter-spacing:3px">LU<span style="color:var(--accent-fg)">MEN</span></span></span>'; }
function vAuth(){
 if(Cloud.wait) return '<div class="stack full" style="align-items:center">'+brandBig()+'<p class="muted">Cargando…</p></div>';
 var m=U.authMode||'login';
 var T={login:['Inicia sesión','Entrar'],register:['Crea tu cuenta','Crear cuenta'],reset:['Recupera tu contraseña','Enviar correo']}[m];
 return '<div class="stack full" style="gap:20px">'+
  '<div class="stack" style="align-items:center;text-align:center;gap:10px">'+brandBig()+'<p class="muted">Reza, lee y vive tu fe cada día. Todo queda guardado en tu cuenta.</p></div>'+
  '<form id="authForm" class="panel" novalidate><h2>'+T[0]+'</h2>'+
  '<label class="stack" style="gap:6px" for="aEmail"><span class="label">Correo</span><input class="inp" id="aEmail" type="email" autocomplete="email" inputmode="email" required style="font-size:16px" value="'+esc(U.authEmail||'')+'"></label>'+
  (m!=='reset'?'<label class="stack" style="gap:6px" for="aPass"><span class="label">Contraseña</span><input class="inp" id="aPass" type="password" autocomplete="'+(m==='register'?'new-password':'current-password')+'" required minlength="6" style="font-size:16px"></label>':'')+
  (m==='register'?'<label class="stack" style="gap:6px" for="aPass2"><span class="label">Repite la contraseña</span><input class="inp" id="aPass2" type="password" autocomplete="new-password" required minlength="6" style="font-size:16px"></label>':'')+
  '<p id="aMsg" class="small" role="status" style="min-height:1em"></p>'+
  '<button class="btn" type="submit" id="aBtn">'+T[1]+'</button>'+
  (m==='login'?'<button class="link" type="button" data-a="authMode" data-v="reset" style="align-self:center">¿Olvidaste tu contraseña?</button>':'')+
  '</form>'+
  (m==='login'?'<p class="muted small" style="text-align:center">¿No tienes cuenta? <button class="link" data-a="authMode" data-v="register" style="color:var(--accent-fg)">Crear cuenta</button></p><p class="muted small" style="text-align:center">Si ya usas Mind Focus o PowerFit, entra con la misma cuenta.</p>'
   :'<p class="muted small" style="text-align:center"><button class="link" data-a="authMode" data-v="login" style="color:var(--accent-fg)">Volver a iniciar sesión</button></p>')+
 '</div>';
}
function vNoAccess(){ return '<div class="stack full" style="align-items:center;text-align:center;gap:14px">'+brandBig()+'<h2>Sin acceso</h2><p class="muted">Tu cuenta no tiene acceso a Lumen. Escríbenos a través de planificarproyectos.com.</p><button class="btn soft" data-a="logout">Cerrar sesión</button></div>'; }
function authErr(e){
 var c=(e&&e.code)||'';
 if(/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return 'Correo o contraseña incorrectos.';
 if(c==='auth/email-already-in-use') return 'Ya existe una cuenta con ese correo. Inicia sesión.';
 if(c==='auth/weak-password') return 'La contraseña debe tener al menos 6 caracteres.';
 if(c==='auth/invalid-email'||c==='auth/missing-email') return 'Revisa que el correo esté bien escrito.';
 if(c==='auth/too-many-requests') return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
 if(c==='auth/network-request-failed') return 'Sin conexión. Revisa tu internet.';
 return 'No se pudo completar. Intenta de nuevo.';
}
var RESET_URL='https://www.planificarproyectos.com/lumen/';
function authSubmit(){
 var m=U.authMode||'login', em=(document.getElementById('aEmail').value||'').trim(), msg=document.getElementById('aMsg'), btn=document.getElementById('aBtn');
 var p=document.getElementById('aPass'), p2=document.getElementById('aPass2'); U.authEmail=em;
 function show(t,ok){ msg.textContent=t; msg.style.color=ok?'var(--accent-fg)':'#E86A62'; }
 if(!em) return show('Escribe tu correo.');
 if(m==='register'&&p.value!==p2.value) return show('Las contraseñas no coinciden.');
 var label=btn.textContent; btn.disabled=true; btn.textContent='Un momento…'; if(m!=='reset') Cloud.loginPending=true;
 var job=m==='login'?Cloud.auth.signInWithEmailAndPassword(em,p.value)
  :m==='register'?Cloud.auth.createUserWithEmailAndPassword(em,p.value)
  :Cloud.auth.sendPasswordResetEmail(em,{url:RESET_URL});
 job.then(function(){ if(m==='reset'){ show('Te enviamos un correo para restablecer tu contraseña.',true); btn.disabled=false; btn.textContent=label; } })
  .catch(function(e){ Cloud.loginPending=false; show(authErr(e)); btn.disabled=false; btn.textContent=label; });
}


/* ---------- Pedir el nombre ---------- */
function askName(){ return; // reemplazado por el aviso en Hoy (igual que Mind Focus y PowerFit)
 var box=$('namebox'); if(!box||!box.hidden) return;
 if(needAuth()||Cloud.noAccess||S.name) return;
 try{ if(localStorage.getItem('lumen:askName')===dkey(new Date())) return; }catch(e){}
 box.innerHTML='<form class="namecard" id="nameForm" novalidate>'+logo(44)+'<h2>¿Cómo te llamas?</h2><p class="muted small">Así Lumen te saludará por tu nombre cada día.</p>'
  +'<input class="inp" id="nameIn" autocomplete="given-name" maxlength="40" placeholder="Tu nombre" style="font-size:16px" aria-label="Tu nombre">'
  +'<div class="grid2"><button class="btn soft" type="button" data-a="nameNo">Ahora no</button><button class="btn" type="submit">Guardar</button></div></form>';
 box.hidden=false; $('install').hidden=true;
 setTimeout(function(){ var i=$('nameIn'); if(i) i.focus(); },50);
}
function closeName(){ var box=$('namebox'); if(box){ box.hidden=true; box.innerHTML=''; } Inst.show(); }

/* ---------- Bienvenida ---------- */
var splashT0=Date.now(), splashTimer=null;
function hideSplash(){ var el=document.getElementById('splash'); if(!el) return;
 clearTimeout(splashTimer); splashTimer=setTimeout(function(){ el.classList.add('out'); Inst.show(); setTimeout(askName,1200); }, Math.max(0,2300-(Date.now()-splashT0))); }
function playSplash(){ var el=document.getElementById('splash'); if(!el) return;
 el.classList.remove('out'); el.classList.add('replay'); void el.offsetWidth; el.classList.remove('replay'); splashT0=Date.now(); hideSplash(); }


/* ---------- Arranque ---------- */
Cloud.init(); render(); hideSplash(); loadLit();
if('serviceWorker' in navigator) window.addEventListener('load',function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); });
})();
