/* Deslizar a la izquierda o a la derecha para cambiar de sección (solo con el dedo: celular y tablet).
   Cada app llama a swipeNav({...}) con:
     items()   -> botones de la barra de secciones, en orden
     enabled() -> (opcional) false cuando no se debe cambiar de sección (ventanas abiertas, inicio de sesión…)
     content() -> (opcional) elemento que se anima al cambiar
   No se activa si el gesto empieza en un campo, en algo que ya se desliza de lado (tablas, gráficos, franjas)
   ni en los bordes de la pantalla, que el celular usa para "volver". */
(function(){
  var css=document.createElement('style');
  css.textContent='@keyframes swn-l{from{opacity:.35;transform:translateX(28px)}to{opacity:1;transform:none}}'+
    '@keyframes swn-r{from{opacity:.35;transform:translateX(-28px)}to{opacity:1;transform:none}}'+
    '.swn-l{animation:swn-l .22s ease-out}.swn-r{animation:swn-r .22s ease-out}'+
    '@media (prefers-reduced-motion:reduce){.swn-l,.swn-r{animation:none}}';
  document.head.appendChild(css);
  function scrollsX(el){
    for(;el&&el!==document.body&&el!==document.documentElement;el=el.parentElement){
      var ox=getComputedStyle(el).overflowX;
      if((ox==='auto'||ox==='scroll')&&el.scrollWidth>el.clientWidth+2) return true;
    }
    return false;
  }
  window.swipeNav=function(o){
    var sx=0, sy=0, st=0, on=false;
    document.addEventListener('touchstart',function(e){
      on=false;
      if(e.touches.length!==1) return;
      if(o.enabled&&!o.enabled()) return;
      var t=e.target, p=e.touches[0];
      if(t.closest&&t.closest('input,textarea,select,[contenteditable="true"],[data-noswipe]')) return;
      if(scrollsX(t)) return;
      if(p.clientX<24||p.clientX>window.innerWidth-24) return;
      sx=p.clientX; sy=p.clientY; st=Date.now(); on=true;
    },{passive:true});
    document.addEventListener('touchend',function(e){
      if(!on) return; on=false;
      var p=e.changedTouches[0], dx=p.clientX-sx, dy=p.clientY-sy;
      if(Date.now()-st>700||Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*2) return;
      var sel=window.getSelection&&String(window.getSelection()); if(sel) return;
      var list=[].slice.call(o.items()).filter(function(b){ return b.offsetParent!==null&&!b.hidden&&!b.disabled; });
      var i=-1; list.forEach(function(b,k){ if(b.getAttribute('aria-current')==='page'||b.getAttribute('aria-selected')==='true') i=k; });
      if(i<0) return;
      var j=dx<0?i+1:i-1; if(j<0||j>=list.length) return;
      list[j].click();
      var c=o.content&&o.content();
      if(c){ c.classList.remove('swn-l','swn-r'); void c.offsetWidth; c.classList.add(dx<0?'swn-l':'swn-r'); setTimeout(function(){ c.classList.remove('swn-l','swn-r'); },260); }
    },{passive:true});
    document.addEventListener('touchcancel',function(){ on=false; },{passive:true});
  };
})();
