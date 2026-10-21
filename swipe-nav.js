/* Deslizar a la izquierda o a la derecha para cambiar de sección (solo con el dedo: celular y tablet).
   El contenido sigue al dedo; al soltar con suficiente recorrido, la sección actual sale hacia ese lado y la nueva
   entra desde el lado opuesto, con la misma curva y duración en ambos sentidos. Si no alcanza, vuelve a su lugar.
   En la primera y la última sección el contenido se mueve con resistencia para indicar que no hay más.
   Cada app llama a swipeNav({...}) con:
     items()   -> botones de la barra de secciones, en orden
     enabled() -> (opcional) false cuando no se debe cambiar de sección (ventanas abiertas, inicio de sesión…)
     content() -> (opcional) el contenido de la sección visible (sin barras fijas); se consulta antes y después del cambio
   No se activa si el gesto empieza en un campo, en algo que ya se desliza de lado (tablas, gráficos, franjas)
   ni en los bordes de la pantalla, que el celular usa para "volver". */
(function(){
  var OUT=170, IN=240, EASE_IN='cubic-bezier(.4,0,1,1)', EASE_OUT='cubic-bezier(.22,.8,.24,1)', SHIFT=.32;
  function reduce(){ try{ return matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){ return false; } }
  function scrollsX(el){
    for(;el&&el!==document.body&&el!==document.documentElement;el=el.parentElement){
      var ox=getComputedStyle(el).overflowX;
      if((ox==='auto'||ox==='scroll')&&el.scrollWidth>el.clientWidth+2) return true;
    }
    return false;
  }
  function setT(el,x,op,dur,ease){ if(!el) return;
    el.style.transition=dur?'transform '+dur+'ms '+ease+', opacity '+dur+'ms '+ease:'none';
    el.style.transform='translate3d('+x+'px,0,0)'; el.style.opacity=String(op); el.style.willChange='transform,opacity'; }
  function clear(el){ if(!el) return; el.style.transition=''; el.style.transform=''; el.style.opacity=''; el.style.willChange=''; }
  window.swipeNav=function(o){
    var sx=0, sy=0, st=0, track=false, decided=false, drag=false, busy=false, el=null, list=[], i=-1, lx=0, lt=0, vx=0;
    function load(){ list=[].slice.call(o.items()).filter(function(b){ return b.offsetParent!==null&&!b.hidden&&!b.disabled; });
      i=-1; list.forEach(function(b,k){ if(b.getAttribute('aria-current')==='page'||b.getAttribute('aria-selected')==='true') i=k; }); }
    function back(){ var e=el; setT(e,0,1,220,EASE_OUT); setTimeout(function(){ clear(e); },240); }
    document.addEventListener('touchstart',function(e){
      track=false;
      if(busy||e.touches.length!==1) return;
      if(o.enabled&&!o.enabled()) return;
      var t=e.target, p=e.touches[0];
      if(t.closest&&t.closest('input,textarea,select,[contenteditable="true"],[data-noswipe]')) return;
      if(scrollsX(t)) return;
      if(p.clientX<24||p.clientX>window.innerWidth-24) return;
      sx=lx=p.clientX; sy=p.clientY; st=lt=Date.now(); vx=0; track=true; decided=false; drag=false; el=null;
    },{passive:true});
    document.addEventListener('touchmove',function(e){
      if(!track) return;
      var p=e.touches[0], dx=p.clientX-sx, dy=p.clientY-sy, now=Date.now();
      if(!decided){
        if(Math.abs(dx)<8&&Math.abs(dy)<8) return;
        decided=true;
        if(Math.abs(dx)<Math.abs(dy)*1.4){ track=false; return; }   // desplazamiento vertical: no es un cambio de sección
        load(); if(i<0){ track=false; return; }
        el=o.content&&o.content(); drag=true;
      }
      if(!drag) return;
      var has=dx<0?i<list.length-1:i>0, x=has?dx:dx*.25;
      setT(el,x,has?1-Math.min(.35,Math.abs(dx)/window.innerWidth*.6):1,0);
      vx=(p.clientX-lx)/Math.max(1,now-lt); lx=p.clientX; lt=now;
    },{passive:true});
    document.addEventListener('touchend',function(e){
      if(!track) return; track=false;
      var p=e.changedTouches[0], dx=p.clientX-sx, dy=p.clientY-sy;
      if(window.getSelection&&String(window.getSelection())){ if(drag) back(); return; }
      if(!drag){   // gesto rápido sin movimientos intermedios
        if(Date.now()-st>700||Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*2) return;
        load(); if(i<0) return; el=o.content&&o.content();
      }
      var dir=dx<0?1:-1, j=i+dir, W=window.innerWidth;
      var go=j>=0&&j<list.length&&(Math.abs(dx)>Math.min(90,W*.22)||(Math.abs(vx)>.45&&Math.abs(dx)>30));
      if(!go){ if(drag) back(); return; }
      if(reduce()){ clear(el); list[j].click(); return; }
      busy=true; var cur=el;
      setT(cur,-dir*W*SHIFT,0,OUT,EASE_IN);
      setTimeout(function(){
        clear(cur); list[j].click();
        var nel=o.content&&o.content();
        setT(nel,dir*W*SHIFT,0,0); if(nel) void nel.offsetWidth;
        requestAnimationFrame(function(){ setT(nel,0,1,IN,EASE_OUT); setTimeout(function(){ clear(nel); busy=false; },IN+30); });
        if(!nel) busy=false;
      },OUT);
    },{passive:true});
    document.addEventListener('touchcancel',function(){ if(track&&drag) back(); track=false; },{passive:true});
  };
})();
