/* Lumen — app principal */
(function(){
'use strict';
var L=window.Liturgia;

/* ---------- Íconos ---------- */
var IP={
 home:'M3 11l9-7 9 7v9h-6v-6H9v6H3z', rosary:'M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 14v8M9 18h6',
 church:'M12 2v4M10 4h4M5 21V11l7-5 7 5v10M9 21v-5a3 3 0 0 1 6 0v5M3 21h18',
 book:'M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h12M12 7v6M9.5 9.5h5', user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
 check:'M5 12l5 5 9-10', back:'M15 6l-6 6 6 6', undo:'M4 4v6h6M5 15a8 8 0 1 0 2-8L4 10', speaker:'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12',
 stop:'M7 7h10v10H7z', pause:'M8 5v14M16 5v14', search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4', down:'M6 9l6 6 6-6',
 sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4', chevR:'M9 6l6 6-6 6', chevL:'M15 6l-6 6 6 6', copy:'M8 8h12v12H8zM4 16V4h12'
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
var BASE={name:'',accent:'lima',mode:'dark',rate:1,voice:'',guided:false,done:{},ros:{}}, S={};
function KEY(){ return 'lumen:v1'+(Cloud.user?':'+Cloud.user.uid:''); }
function loadLocal(){ S=JSON.parse(JSON.stringify(BASE)); try{ var t=JSON.parse(localStorage.getItem('lumen:theme')||'null'); if(t){ S.accent=t.accent||S.accent; S.mode=t.mode||S.mode; } var raw=localStorage.getItem(KEY()); if(raw){ var o=JSON.parse(raw); for(var k in o) S[k]=o[k]; } }catch(e){} }
function saveLocal(){ try{ localStorage.setItem(KEY(),JSON.stringify(S)); localStorage.setItem('lumen:theme',JSON.stringify({accent:S.accent,mode:S.mode})); }catch(e){} }
function save(){ saveLocal(); Cloud.push(); }
function prune(o,days){ var lim=dkey(new Date(Date.now()-days*864e5)), r={}; for(var k in o) if(k.slice(0,10)>=lim) r[k]=o[k]; return r; }

/* ---------- Cuenta (Firebase, mismo proyecto que Mind Focus y PowerFit) ---------- */
var Cloud={auth:null,db:null,user:null,wait:false,ref:null,unsub:null,t:null,noAccess:false,loginPending:false,
 init:function(){
  var self=this;
  if(!window.firebase||!window.FIREBASE_CONFIG) return; // sin Firebase: funciona solo en este navegador
  try{ firebase.initializeApp(window.FIREBASE_CONFIG); self.auth=firebase.auth(); self.auth.languageCode='es'; self.db=firebase.firestore(); }catch(e){ console.warn(e); self.auth=null; return; }
  try{ self.db.enablePersistence({synchronizeTabs:true}).catch(function(){}); }catch(e){}
  self.wait=true;
  self.auth.onAuthStateChanged(function(u){
   self.wait=false; if(self.unsub){ self.unsub(); self.unsub=null; } clearTimeout(self.t);
   if(!u){ self.user=null; self.ref=null; self.noAccess=false; loadLocal(); applyTheme(); render(); return; }
   if(self.loginPending){ self.loginPending=false; playSplash(); }
   self.user={email:u.email,uid:u.uid}; self.noAccess=false; loadLocal(); applyTheme(); U.tab='home';
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
  self.unsub=self.ref.onSnapshot(function(sn){
   if(first){ first=false; if(!sn.exists){ self.push(true); return; } }
   if(!sn.exists||sn.metadata.hasPendingWrites) return;
   var d=sn.data()||{};
   ['done','ros','name','guided','rate','accent','mode'].forEach(function(k){ if(d[k]!==undefined) S[k]=d[k]; });
   saveLocal(); applyTheme();
   var a=document.activeElement; if(!(a&&(a.id==='bq'||a.id==='nm'))) render();
  },function(e){ console.warn('firestore',e); if(e&&e.code==='permission-denied'){ self.noAccess=true; render(); } else toast('No se pudo leer tu cuenta. Revisa tu conexión.'); });
 },
 push:function(now){
  if(!this.ref||this.noAccess) return; var self=this; clearTimeout(this.t);
  this.t=setTimeout(function(){ if(!self.ref) return;
   self.ref.set({done:prune(S.done,400),ros:prune(S.ros,7),name:S.name,guided:S.guided,rate:S.rate,accent:S.accent,mode:S.mode,upd:Date.now()})
    .catch(function(){ toast('No se pudo guardar en tu cuenta. Revisa tu conexión.'); }); },now?0:600);
 },
 wipe:function(){ if(this.ref) this.ref.delete().catch(function(){}); }
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
function sayNext(my){
 if(my!==gen) return;
 if(QI>=Q.length){ speaking=null; updSay(); var cb=TTS_DONE; TTS_DONE=null; if(cb) cb(); return; }
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
function speak(text,id,done){
 if(!/^misa:/.test(id||'')) M.playing=false;
 if(!/^rosa:/.test(id||'')) R.playing=false;
 if(!TTS){ ttsHelp(); return; }
 if(speaking===id){ stopSpeak(); updSay(); return; }
 TTS_DONE=done||null;
 var ss=window.speechSynthesis; gen++; var my=gen; clearTimeout(watch);
 try{ if(ss.speaking||ss.pending) ss.cancel(); }catch(e){}
 Q=chunks(text); QI=0; started=false; speaking=id; updSay();
 if(!Q.length){ speaking=null; updSay(); return; }
 sayNext(my); // en el mismo toque (requisito de iPhone)
 watch=setTimeout(function(){ // Android a veces ignora la primera orden: reintenta una vez
  if(my!==gen||started) return;
  try{ ss.cancel(); }catch(e){} gen++; my=gen; QI=0; sayNext(my);
  watch=setTimeout(function(){ if(my===gen&&!started&&!ss.speaking){ gen++; speaking=null; updSay(); ttsHelp(); } },3000);
 },450);
}
function stopSpeak(){ TTS_DONE=null; gen++; clearTimeout(watch); if(TTS){ try{ speechSynthesis.cancel(); }catch(e){} } speaking=null; }
if(TTS){ try{ speechSynthesis.getVoices(); }catch(e){} }

function sayBtn(id,label){ var on=speaking===id; return '<button class="say'+(on?' on':'')+'" data-a="say" data-id="'+id+'" data-l="'+esc(label||'Escuchar')+'" aria-pressed="'+on+'">'+ic(on?'stop':'speaker',16)+'<span>'+(on?'Detener':(label||'Escuchar'))+'</span></button>'; }
function updSay(){ var bs=document.querySelectorAll('[data-a=say]'); for(var i=0;i<bs.length;i++){ var b=bs[i], on=b.getAttribute('data-id')===speaking; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); b.innerHTML=ic(on?'stop':'speaker',16)+'<span>'+(on?'Detener':(b.getAttribute('data-l')||'Escuchar'))+'</span>'; }
 updMass(); updRos(); }

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

/* ---------- Biblia (Reina-Valera 1909, dominio público) ---------- */
var IDX=[], BOOKS={};
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
function prayerSay(pr){ return pr.t+'. '+pr.parts.map(function(x){ return (x.h?x.h+'. ':'')+(x.say||x.text); }).join(' '); }

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
function setMassDate(d){ M.stop(); M.idx=0; if(d&&dkey(d)===dkey(new Date())) d=null; U.mdate=d; render(); try{ window.scrollTo(0,0); }catch(e){} }
function massParts(m){ var a=[]; (m===undefined?viewMass():m||[]).forEach(function(s){ s.parts.forEach(function(p){ a.push(p); }); }); return a; }

/* ---------- Reproductor de la Misa ---------- */
var M={idx:0,playing:false,
 play:function(i){ var ps=massParts(); if(!ps.length) return;
  if(i>=ps.length){ M.playing=false; M.idx=0; if(!U.mdate) setDone('misa',true); updMass(); toast('Misa completa. Pueden ir en paz.'); return; }
  M.idx=i; M.playing=true; var p=ps[i];
  speak(p.h+'. '+p.text,'misa:'+i,function(){ setTimeout(function(){ if(M.playing&&!speaking) M.play(i+1); },900); });
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
   if(k>=STEPS.length){ R.playing=false; setDone('ros',true); toast('Rosario completado'); }
   if(U.tab==='rosary') render(); setTimeout(function(){ if(R.playing&&!speaking) R.play(); },600); });
  R.playing=true; updRos(); }
};
function updRos(){ var b=$('rosBtn'); if(b) b.innerHTML=R.playing?ic('pause',20)+'Pausar':ic('play',20)+'Rezar con voz'; }
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
  +'<div class="stack" style="gap:6px"><h1>'+greet()+(S.name?',<br>'+esc(S.name):'')+'</h1>'+(info?litBadge(info):'')+'</div>'
  +(info?'<div class="daycard"><span class="lbar" style="background:'+(LCOL[info.cel.c]||'#999')+'"></span><div class="stack" style="gap:4px;min-width:0"><span class="label">Hoy celebramos</span><b>'+esc(info.cel.n)+'</b>'+(info.commem?'<span class="small muted">Santo del día: '+esc(info.commem.n)+'</span>':'')+'</div></div>':'')
  +'<div class="quote"><div class="between"><span class="label ac">Frase del día</span>'+(fr?sayBtn('frase'):'')+'</div>'+(fr?'<p>'+esc(fr.t)+'</p><div class="between"><span class="ref">'+esc(fr.ref)+'</span><button class="say" data-a="copy">'+ic('copy',16)+'<span>Copiar</span></button></div>':'<p class="muted" style="font-size:18px">Cargando el Evangelio de hoy…</p>')+'</div>'
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
 var out=head+'<div class="stack" style="gap:8px"><button class="btn playbig" id="massBtn" data-a="massPlay"></button><div class="between small"><span class="muted" id="massProg"></span>'+(M.idx>0?'<button class="link" data-a="massRestart">Empezar desde el inicio</button>':'')+'</div></div>';
 mass.forEach(function(s){
  out+='<section class="stack"><h2>'+esc(s.title)+'</h2>';
  s.parts.forEach(function(p){
   var isR=!!p.ref, body;
   if(p.verses&&p.verses.length) body='<p class="verses">'+p.verses.map(function(v){ return '<sup>'+v.v+'</sup>'+esc(v.t); }).join(' ')+'</p>';
   else body='<p class="ptext">'+esc(p.missing?p.text.replace(/^[^.]*\.\s*/,''):p.text)+'</p>';
   out+='<details class="part'+(p.gospel?' gos':'')+'" data-part="'+p.i+'"'+(isR?' open':'')+'><summary><span class="stack" style="gap:2px;min-width:0"><b>'+esc(p.h)+'</b>'+(p.ref?'<span class="small ref">'+esc(p.ref)+'</span>':'')+'</span><button class="pbtn" data-a="massFrom" data-v="'+p.i+'" aria-label="Escuchar desde '+esc(p.h)+'">'+ic('play',14)+'</button></summary>'+body+'</details>';
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
 var cnt=s.k==='am'?'<div class="counter"><b class="num">'+s.n+'</b><span>/ '+(s.d!=null?10:3)+'</span></div>':'<div class="counter"><b style="font-size:48px">'+stepTitle(s).toUpperCase()+'</b></div>';
 return head
  +'<div class="panel"><span class="label ac">'+set[0]+' · '+mys+'</span><h3 style="font-size:26px">'+esc(myst)+'</h3></div>'
  +strip
  +'<div class="stack" style="align-items:center;gap:2px">'+cnt+'<span class="label">'+(s.k==='am'?'Ave María':'Cuenta '+(i+1)+' de '+STEPS.length)+'</span></div>'
  +'<div class="prayer"><p>'+esc(stepText(s))+'</p><div class="between">'+sayBtn('ros-'+i)+'<button class="say" id="rosBtn" data-a="rosPlay"></button></div></div>'
  +'<div class="ctl"><button class="icon-btn" data-a="rprev" aria-label="Cuenta anterior">'+ic('undo',22)+'</button><button class="btn" data-a="rnext">Siguiente cuenta</button></div>';
}

function vBible(){
 if(!LIT.ready) return '<header><h1>BIBLIA</h1></header>'+loading();
 if(U.bk&&U.ch) return vChapter();
 if(U.bk){ var n=IDX[U.bk-1][1], g=''; for(var c=1;c<=n;c++) g+='<button data-a="chap" data-v="'+c+'">'+c+'</button>';
  return '<header class="row"><button class="icon-btn" data-a="bback" aria-label="Volver">'+ic('back')+'</button><h1>'+esc(IDX[U.bk-1][0]).toUpperCase()+'</h1></header><p class="muted small">'+n+' capítulos</p><div class="chgrid">'+g+'</div>'; }
 var q=U.q.trim().toLowerCase(), from=U.test==='at'?1:40, to=U.test==='at'?39:66, list=[];
 for(var i=from;i<=to;i++){ var nm=IDX[i-1][0]; if(!q||nm.toLowerCase().indexOf(q)>=0) list.push(i); }
 var lect=LIT.mass?massParts(LIT.mass).filter(function(p){ return p.ref; }):[];
 return '<header><h1>BIBLIA</h1></header>'
  +'<label class="field" for="bq">'+ic('search',18)+'<input id="bq" type="search" data-a="bq" placeholder="Buscar libro" value="'+esc(U.q)+'" autocomplete="off"></label>'
  +(lect.length?'<div class="panel" style="gap:0"><div class="between" style="margin-bottom:6px"><span class="label ac">Lecturas de hoy</span><button class="say" data-a="tab" data-v="misa">'+ic('play',14)+'<span>Misa de hoy</span></button></div>'+lect.map(function(p){ return '<div class="kv"><span class="muted">'+esc(p.h)+'</span><b>'+esc(p.ref)+'</b></div>'; }).join('')+'</div>':'')
  +'<div class="seg" style="grid-template-columns:repeat(2,minmax(0,1fr))">'+[['at','Antiguo Testamento'],['nt','Nuevo Testamento']].map(function(x){ return '<button class="'+(U.test===x[0]?'on':'')+'" data-a="test" data-v="'+x[0]+'">'+x[1]+'</button>'; }).join('')+'</div>'
  +(list.length?'<div class="books">'+list.map(function(b){ return '<button class="book" data-a="book" data-v="'+b+'"><b>'+esc(IDX[b-1][0])+'</b><span class="small muted">'+IDX[b-1][1]+' capítulos</span></button>'; }).join('')+'</div>':'<div class="empty muted">Ningún libro coincide con “'+esc(U.q)+'”.</div>')
  +'<p class="small muted">Reina-Valera 1909 (dominio público), con ortografía actualizada. Esta edición no incluye Tobías, Judit, Sabiduría, Eclesiástico, Baruc ni 1 y 2 Macabeos.</p>';
}
var CHAP={};
function vChapter(){
 var b=U.bk, c=U.ch, key=b+':'+c, bk=BOOKS_DATA[b];
 var head='<header class="row"><button class="icon-btn" data-a="cback" aria-label="Volver">'+ic('back')+'</button><h1>'+esc(IDX[b-1][0]).toUpperCase()+' '+c+'</h1></header>';
 if(!bk){ Bible.get(b).then(function(d){ BOOKS_DATA[b]=d; render(); },function(){ toast('No se pudo abrir el libro. Revisa tu conexión.'); }); return head+loading(); }
 var vs=bk.c[c-1]||[], n=IDX[b-1][1];
 return head+'<div>'+sayBtn('cap-'+key,'Escuchar capítulo')+'</div><div class="reader">'+vs.map(function(t,i){ return '<p><sup>'+(i+1)+'</sup>'+esc(t)+'</p>'; }).join('')+'</div>'
  +'<div class="grid2"><button class="btn soft" data-a="chap" data-v="'+(c-1)+'"'+(c<=1?' disabled':'')+'>'+ic('chevL',18)+'Anterior</button><button class="btn soft" data-a="chap" data-v="'+(c+1)+'"'+(c>=n?' disabled':'')+'>Siguiente'+ic('chevR',18)+'</button></div>';
}
var BOOKS_DATA={};

function vPray(){
 var id=U.pid, pr=PRAY_CACHE[id], back='<header class="row"><button class="icon-btn" data-a="pback" aria-label="Volver">'+ic('back')+'</button><h1>'+esc((PRAY[id]||{}).t||'').toUpperCase()+'</h1></header>';
 if(!pr){ loadPrayer(id).then(render,function(){ toast('No se pudo cargar la oración. Revisa tu conexión.'); }); return back+loading(); }
 var rut=RUT.some(function(r){ return r[0]===id; });
 return back+'<div>'+sayBtn('pray-'+id)+'</div>'
  +pr.parts.map(function(p){ return '<div class="panel" style="gap:8px">'+(p.h?'<span class="label ac">'+esc(p.h)+'</span>':'')+'<p class="ptext">'+esc(p.text)+'</p></div>'; }).join('')
  +(rut?'<button class="btn'+(isDone(id)?' soft':'')+'" data-a="done" data-id="'+id+'">'+(isDone(id)?'Rezada hoy ✓':'Marcar como rezada')+'</button>':'');
}

function voiceGuide(){
 var ios=isIOS();
 var steps=ios?['Abre Ajustes › Accesibilidad › Contenido leído › Voces › Español.','Descarga una voz <b>Mejorada</b> o <b>Premium</b> (por ejemplo Paulina o Mónica).','Vuelve a Lumen, elígela arriba en <b>Voz</b> y toca <b>Probar voz</b>.','Si no suena nada, quita el modo silencio del iPhone.']
  :['Abre Ajustes › Sistema › Idioma › <b>Salida de texto a voz</b>.','Elige el motor <b>Servicios de voz de Google</b>.','En ⚙️ › Instalar datos de voz › Español, descarga la voz de mayor calidad.','Vuelve a Lumen, elige una voz <b>Google español</b> arriba y toca <b>Probar voz</b>.'];
 return '<details class="guide"><summary>¿La voz suena robótica? Mejórala en '+(ios?'tu iPhone':'tu Android')+'</summary><ol>'+steps.map(function(x){ return '<li>'+x+'</li>'; }).join('')+'</ol><p class="small muted">Consejo: una velocidad de 0.9× suena más natural.</p></details>'; }
function vMe(){
 var vs=rankedVoices();
 return '<header><h1>PERFIL</h1></header>'
  +'<div class="panel"><label class="label" for="nm">Tu nombre</label><input class="inp" id="nm" data-a="name" value="'+esc(S.name)+'" placeholder="¿Cómo te llamas?" autocomplete="given-name"></div>'
  +'<div class="panel"><span class="label">Apariencia</span>'
  +'<div class="seg" style="grid-template-columns:repeat(2,minmax(0,1fr));background:var(--surface2)"><button class="'+(S.mode==='dark'?'on':'')+'" data-a="mode" data-v="dark">Oscuro</button><button class="'+(S.mode==='light'?'on':'')+'" data-a="mode" data-v="light">Claro</button></div>'
  +'<span class="small muted">Color de acento</span><div class="swatches">'+Object.keys(ACCENTS).map(function(k){ var c=ACCENTS[k], on=S.accent===k; return '<button class="sw'+(on?' on':'')+'" data-a="accent" data-v="'+k+'" aria-pressed="'+on+'" aria-label="'+c[0]+'"><i style="background:'+c[1]+'">'+(on?ic('check',18,3):'')+'</i>'+c[0]+'</button>'; }).join('')+'</div></div>'
  +'<div class="panel"><span class="label">Lectura en voz alta</span>'
  +(TTS?'<label class="small muted" for="vsel">Voz</label><select class="inp" id="vsel" data-a="voice"><option value="">Automática (recomendada)</option>'+vs.map(function(v,k){ return '<option value="'+esc(v.name)+'"'+(v.name===S.voice?' selected':'')+'>'+esc(v.name)+' ('+v.lang+')'+(k===0?' · mejor disponible':'')+'</option>'; }).join('')+'</select>'
   +'<div class="between"><label class="small muted" for="rate">Velocidad</label><span class="small num" id="rateV">'+(+S.rate||1).toFixed(1)+'×</span></div><input type="range" id="rate" data-a="rate" min="0.6" max="1.4" step="0.1" value="'+(S.rate||1)+'">'
   +'<div>'+sayBtn('test','Probar voz')+'</div>'+voiceGuide()
   :'<p class="small muted">Este navegador no permite lectura en voz alta. Usa Chrome (Android) o Safari (iPhone).</p>')+'</div>'
  +'<div class="panel"><span class="label">Instalar como app</span>'+(Inst.standalone()?'<p class="small muted">Lumen ya está instalada en este dispositivo.</p>':Inst.can()?Inst.body(false):'<p class="small muted">En Android abre esta página en Chrome y toca ⋮ › <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>. En iPhone abre en Safari, toca Compartir › <b>Agregar a pantalla de inicio</b>.</p>')+'</div>'
  +(Cloud.user?'<div class="panel"><span class="label">Cuenta</span><p class="small" style="overflow-wrap:anywhere">'+esc(Cloud.user.email)+'</p><div class="grid2"><button class="btn soft" data-a="resetPass">Cambiar contraseña</button><button class="btn soft" data-a="logout">Cerrar sesión</button></div><p class="small muted">Es la misma cuenta de Mind Focus y PowerFit.</p></div>':'')
  +'<div class="panel"><span class="label">Tus datos</span><p class="small muted">'+(Cloud.user?'Se guardan en tu cuenta y en este dispositivo.':'Se guardan en este dispositivo.')+'</p>'
  +(U.confirmReset?'<p class="small">¿Borrar racha, rutina y progreso del Rosario?</p><div class="grid2"><button class="btn soft" data-a="resetNo">Cancelar</button><button class="btn danger" data-a="resetYes">Sí, borrar</button></div>':'<button class="btn danger" data-a="reset">Borrar mis datos</button>')
  +'</div>';
}

/* ---------- Render ---------- */
var TABS=[['misa','Misa','church'],['rosary','Rosario','rosary'],['home','Hoy','sun'],['bible','Biblia','book'],['me','Perfil','user']];
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
 if(a==='tab'){ if(v==='bible'&&U.tab==='bible'){ U.bk=null; U.ch=null; } go(v); return; }
 if(a==='say'){ var id=el.getAttribute('data-id'); speak(sayText(id),id); return; }
 if(a==='done'){ var id2=el.getAttribute('data-id'); setDone(id2,!isDone(id2)); render(); return; }
 if(a==='open'){ if(v==='misa'){ go('misa'); return; } if(v==='ros'){ go('rosary'); return; } U.pid=v; go('pray'); return; }
 if(a==='pback'){ go('home'); return; }
 if(a==='copy'){ if(!LIT.frase) return; var txt=LIT.frase.t+' ('+LIT.frase.ref+')';
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(function(){ toast('Frase copiada'); },function(){ toast(txt,5000); }); } else toast(txt,5000); return; }
 if(a==='massPlay'){ if(M.playing) M.stop(); else M.play(M.idx); return; }
 if(a==='massFrom'){ M.play(+v); return; }
 if(a==='mprev'||a==='mnext'){ var b0=U.mdate?new Date(U.mdate):new Date(); b0.setDate(b0.getDate()+(a==='mprev'?-1:1)); setMassDate(b0); return; }
 if(a==='mtoday'){ setMassDate(null); return; }
 if(a==='massRestart'){ M.stop(); M.idx=0; render(); return; }
 if(a==='rset'){ R.playing=false; stopSpeak(); U.rosSet=v; render(); return; }
 if(a==='rosPlay'){ if(R.playing){ R.playing=false; stopSpeak(); updSay(); } else R.play(); return; }
 if(a==='rnext'||a==='rprev'){
  var i=rosI(); i=a==='rnext'?Math.min(STEPS.length,i+1):Math.max(0,i-1); S.ros[rosKey()]=i;
  if(i>=STEPS.length){ setDone('ros',true); toast('Rosario completado'); }
  save(); var wasPlaying=R.playing; R.playing=false; stopSpeak(); render(); if(wasPlaying&&i<STEPS.length) R.play(); return; }
 if(a==='rreset'){ S.ros[rosKey()]=0; save(); render(); return; }
 if(a==='book'){ U.bk=+v; U.ch=null; render(); window.scrollTo(0,0); return; }
 if(a==='chap'){ U.ch=+v; stopSpeak(); render(); window.scrollTo(0,0); return; }
 if(a==='bback'){ U.bk=null; render(); return; }
 if(a==='cback'){ U.ch=null; stopSpeak(); render(); return; }
 if(a==='mode'){ S.mode=v; applyTheme(); save(); render(); return; }
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
document.addEventListener('submit',function(e){ if(e.target.id==='authForm'){ e.preventDefault(); authSubmit(); }
 if(e.target.id==='nameForm'){ e.preventDefault(); var v=($('nameIn').value||'').trim().slice(0,40); if(!v){ $('nameIn').focus(); return; } S.name=v; save(); closeName(); render(); toast('Paz y bien, '+v); } });
document.addEventListener('change',function(e){
 var a=e.target.getAttribute('data-a');
 if(a==='voice'){ S.voice=e.target.value; save(); }
 if(a==='mdate'&&e.target.value){ var q=e.target.value.split('-'); setMassDate(new Date(+q[0],+q[1]-1,+q[2])); }
 if(a==='rate'){ S.rate=parseFloat(e.target.value)||1; save(); }
 if(a==='name'){ S.name=e.target.value.trim().slice(0,40); save(); }
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
 dismissed:function(){ try{ return Date.now()-(+localStorage.getItem('lumen:installDismiss')||0)<7*864e5; }catch(e){ return false; } },
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
function askName(){
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
