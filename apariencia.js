/* Apariencia compartida por Proyecta, Lumen, Mind Focus y PowerFit: el color de énfasis y el modo oscuro que la persona
   elige en cualquiera de ellas se aplica en todas.
   - Se guarda en la cuenta, en users/{uid}/perfil/apariencia ({accent:'#RRGGBB', mode:'dark'|'light'}), junto al nombre
     que ya comparten las apps, y cada app lo escucha en vivo: si se cambia en una, las otras abiertas cambian solas.
   - Como todas las apps están en el mismo sitio, también se recuerda en este navegador (clave wellness:apariencia) para
     pintar el color correcto antes de que cargue la cuenta. Proyecta lo desactiva (Apariencia.noLocal = true) porque
     no guarda nada en el navegador.
   - Apariencia.picker(acc) devuelve el selector: una sola fila con los 8 colores y un último botón para elegir cualquier
     color a mano. Los toques se atienden aquí mismo; cada app solo registra Apariencia.on(fn) para aplicar el cambio.
   - Si la cuenta aún no tiene apariencia compartida, la primera app que se abre la crea con su color y modo actuales. */
(function(){
  var ACC=[['Lima','#C6F432'],['Azul','#3D8BFF'],['Naranja','#FF8A1F'],['Rosa','#FF4FA3'],['Cian','#22E0E0'],['Morado','#A97BFF'],['Amarillo','#FFD60A'],['Coral','#FF5A5F']];
  var KEY='wellness:apariencia', DEF={accent:'#C6F432',mode:'dark'};
  function hex(c){ c=String(c||'').trim(); if(/^#[0-9a-f]{3}$/i.test(c)) c='#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]; return /^#[0-9a-f]{6}$/i.test(c)?c.toUpperCase():null; }
  function rgb(h){ var n=parseInt(h.slice(1),16); return [n>>16&255,n>>8&255,n&255]; }
  function toHex(a){ return '#'+a.map(function(v){ return ('0'+Math.round(Math.max(0,Math.min(255,v))).toString(16)).slice(-2); }).join('').toUpperCase(); }
  function lum(a){ var c=a.map(function(v){ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }); return .2126*c[0]+.7152*c[1]+.0722*c[2]; }
  function contrast(a,b){ var x=lum(a),y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
  // Texto sobre el color de énfasis: oscuro o blanco, el que más contraste tenga
  function ink(h){ var c=rgb(h); return contrast(c,[17,19,21])>=contrast(c,[255,255,255])?'#111315':'#FFFFFF'; }
  // Versión del color para textos y detalles en modo claro: se oscurece hasta leerse bien sobre fondo claro (4,5:1)
  function forLight(h){ var c=rgb(h), bg=[243,242,238]; for(var i=0;i<20&&contrast(c,bg)<4.5;i++) c=c.map(function(v){ return v*.9; }); return toHex(c); }
  var ALIAS={'#C6F135':'#C6F432'};   // el lima que usaba Proyecta es el mismo de las demás apps
  function norm(s){ s=s||{}; var h=hex(s.accent); return {accent:ALIAS[h]||h||DEF.accent, mode:s.mode==='light'?'light':'dark'}; }

  var A={accents:ACC, state:null, noLocal:false, ref:null, unsub:null, fns:[], hex:hex, ink:ink, forLight:forLight, norm:norm};
  A.local=function(){ try{ var t=JSON.parse(localStorage.getItem(KEY)||'null'); return t?norm(t):null; }catch(e){ return null; } };
  function keep(){ if(A.noLocal) return; try{ localStorage.setItem(KEY,JSON.stringify(A.state)); }catch(e){} }
  // preview: el selector de color manual sigue abierto; las apps aplican el color pero no redibujan (destruirían el selector)
  function emit(preview){ var s=A.state; A.fns.forEach(function(f){ try{ f(s,!!preview); }catch(e){ console.warn(e); } }); }
  A.on=function(f){ A.fns.push(f); };
  // Cambia la apariencia: se aplica de inmediato y se guarda en la cuenta (si hay sesión). preview = solo mostrar, sin guardar
  A.set=function(p,preview){ A.state=norm(Object.assign({},A.state||A.local()||DEF,p)); emit(preview);
    if(preview) return; keep();
    if(A.ref) A.ref.set({accent:A.state.accent,mode:A.state.mode,upd:Date.now()},{merge:true}).catch(function(){}); };
  // Escucha la apariencia de la cuenta. seed() da el color y modo actuales de la app, para crearla si aún no existe
  A.connect=function(db,uid,seed){ A.disconnect(); if(!db||!uid) return;
    A.ref=db.collection('users').doc(uid).collection('perfil').doc('apariencia');
    A.unsub=A.ref.onSnapshot(function(sn){
      if(sn.metadata&&sn.metadata.hasPendingWrites) return;
      if(!sn.exists){ var s=norm(seed&&seed()); A.state=s; keep(); A.ref.set({accent:s.accent,mode:s.mode,upd:Date.now()},{merge:true}).catch(function(){}); return; }
      var d=norm(sn.data()); if(A.state&&d.accent===A.state.accent&&d.mode===A.state.mode) return;
      A.state=d; keep(); emit();
    },function(e){ console.warn('apariencia',e); }); };
  A.disconnect=function(){ if(A.unsub){ try{ A.unsub(); }catch(e){} } A.unsub=null; A.ref=null; };

  A.picker=function(acc){ acc=hex(acc)||DEF.accent; var own=!ACC.some(function(x){ return x[1]===acc; });
    return '<div class="ap-row" role="radiogroup" aria-label="Color de énfasis">'
      +ACC.map(function(x){ return '<button type="button" class="ap-sw" role="radio" data-ap-acc="'+x[1]+'" aria-checked="'+(x[1]===acc)+'" aria-label="'+x[0]+'" title="'+x[0]+'" style="--c:'+x[1]+'"></button>'; }).join('')
      +'<label class="ap-sw ap-own" role="radio" aria-checked="'+own+'" title="Elegir otro color" style="--c:'+(own?acc:'transparent')+'"><input type="color" data-ap-own value="'+acc.toLowerCase()+'" aria-label="Elegir otro color"></label></div>'; };
  document.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('[data-ap-acc]'); if(b){ e.preventDefault(); e.stopPropagation(); A.set({accent:b.getAttribute('data-ap-acc')}); } },true);
  // El selector de color avisa mientras se arrastra (vista previa) y al cerrarlo (se guarda)
  document.addEventListener('input',function(e){ if(e.target.matches&&e.target.matches('[data-ap-own]')) A.set({accent:e.target.value},true); },true);
  document.addEventListener('change',function(e){ if(e.target.matches&&e.target.matches('[data-ap-own]')) A.set({accent:e.target.value}); },true);

  var css=document.createElement('style');
  css.textContent='.ap-row{display:flex;gap:8px;align-items:center;width:100%;max-width:420px}'
    // Medidas fijadas con .ap-row>.ap-sw para que los estilos de botón de cada app (p. ej. altura mínima de 44 px) no los deformen
    +'.ap-row>.ap-sw{display:block;flex:1 1 0;min-width:0;min-height:0;width:auto;height:auto;max-width:38px;aspect-ratio:1/1;margin:0;border-radius:50%;border:0;padding:0;background:var(--c);cursor:pointer;position:relative;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}'
    +'.ap-sw[aria-checked=true]{box-shadow:0 0 0 2px var(--ap-bg,#111315),0 0 0 4px var(--c)}'
    +'.ap-row>.ap-own{background:conic-gradient(#ff4f4f,#ffd60a,#c6f432,#22e0e0,#3d8bff,#a97bff,#ff4fa3,#ff4f4f);overflow:hidden}'
    +'.ap-own::after{content:"";position:absolute;inset:26%;border-radius:50%;background:var(--c);box-shadow:0 0 0 2px rgba(255,255,255,.9)}'
    +'.ap-own[aria-checked=false]::after{background:rgba(17,19,21,.55);box-shadow:none;-webkit-mask:none}'
    +'.ap-own[aria-checked=true]{box-shadow:0 0 0 2px var(--ap-bg,#111315),0 0 0 4px var(--c)}'
    +'.ap-own input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0}'
    +'.ap-sw:focus-visible,.ap-own:focus-within{outline:2px solid var(--c);outline-offset:4px}';
  document.head.appendChild(css);
  window.Apariencia=A;
})();
