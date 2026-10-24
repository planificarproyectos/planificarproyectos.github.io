/* Música de fondo de Lumen mientras habla la voz: canto en estilo gregoriano (modo dórico) con órgano suave,
   generado por el navegador (Web Audio). No usa archivos ni grabaciones: no pesa nada y no tiene derechos de autor.
   Suena a la mitad del volumen de la voz, en bucle, solo mientras se lee en voz alta. Se apaga en Ajustes › Lectura en voz alta. */
(function(){
'use strict';
var KEY='lumen:musica', ctx=null, master=null, verb=null, timer=null, playing=false, idle=0, nextT=0;
function on(){ try{ return localStorage.getItem(KEY)!=='0'; }catch(e){ return true; } }
function setOn(v){ try{ localStorage.setItem(KEY,v?'1':'0'); }catch(e){} if(!v) stop(); }
var VOL=0.5;   // mitad de la voz
// Escala de re dórico (Hz): Re3 Mi3 Fa3 Sol3 La3 Si3 Do4 Re4 Mi4
var N={D:146.83,E:164.81,F:174.61,G:196.00,A:220.00,B:246.94,C:261.63,d:293.66,e:329.63};
// Frases tipo neuma (nota, duración en pulsos); terminan en la final (Re) o en la recitación (La)
var FR=[
 'D1 F1 G1 A2 A1 G1 A1 B1 A2 G1 F1 G1 A3',
 'A1 A1 A1 B1 C2 B1 A1 G1 A2 F1 G1 F1 E1 D3',
 'F1 G1 A2 d2 C1 B1 A2 G1 A1 F1 E1 D3',
 'D1 E1 F1 G1 F1 E1 D2 C1 D1 F1 G1 A3',
 'A2 G1 A1 C1 d2 C1 B1 A1 G1 A2 G1 F1 E2 D3',
 'C1 D1 F1 E1 G1 F1 E1 D2 E1 F1 D3'
].map(function(f){ return f.split(' ').map(function(x){ return [N[x[0]]||N.D*0.88, +x.slice(1)]; }); });
var PULSO=0.62;
function build(){
 var A=window.AudioContext||window.webkitAudioContext; if(!A) return false;
 ctx=new A(); master=ctx.createGain(); master.gain.value=0.0001; master.connect(ctx.destination);
 // Reverberación de iglesia: respuesta al impulso sintética de ~4 s
 verb=ctx.createConvolver(); var len=ctx.sampleRate*4, ir=ctx.createBuffer(2,len,ctx.sampleRate);
 for(var c=0;c<2;c++){ var d=ir.getChannelData(c); for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2); }
 verb.buffer=ir; var wet=ctx.createGain(); wet.gain.value=0.55; verb.connect(wet); wet.connect(master);
 // Órgano: bordón Re2 + La2 sostenido
 [[73.42,.05],[110,.035],[146.83,.02]].forEach(function(p){ var o=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter();
  o.type='triangle'; o.frequency.value=p[0]; f.type='lowpass'; f.frequency.value=600; g.gain.value=p[1]; o.connect(f); f.connect(g); g.connect(master); g.connect(verb); o.start(); });
 return true;
}
// Una nota "cantada": diente de sierra con formantes de vocal "o" y vibrato suave
function nota(f,t,d){
 var o=ctx.createOscillator(), o2=ctx.createOscillator(), g=ctx.createGain(), v=ctx.createOscillator(), vg=ctx.createGain();
 o.type='sawtooth'; o2.type='sawtooth'; o.frequency.value=f; o2.frequency.value=f*1.004;
 v.frequency.value=5; vg.gain.value=f*0.006; v.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
 var f1=ctx.createBiquadFilter(), f2=ctx.createBiquadFilter(), lp=ctx.createBiquadFilter();
 f1.type='bandpass'; f1.frequency.value=480; f1.Q.value=5; f2.type='bandpass'; f2.frequency.value=850; f2.Q.value=6; lp.type='lowpass'; lp.frequency.value=1800;
 o.connect(lp); o2.connect(lp); lp.connect(f1); lp.connect(f2); f1.connect(g); f2.connect(g);
 g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.22,t+0.12); g.gain.setValueAtTime(0.22,t+d-0.1); g.gain.linearRampToValueAtTime(0.0001,t+d+0.06);
 g.connect(master); g.connect(verb);
 [o,o2,v].forEach(function(x){ x.start(t); x.stop(t+d+0.1); });
}
function programar(){
 if(!playing) return;
 while(nextT<ctx.currentTime+4){
  var fr=FR[Math.floor(Math.random()*FR.length)];
  fr.forEach(function(n){ nota(n[0],nextT,n[1]*PULSO); nextT+=n[1]*PULSO; });
  nextT+=PULSO*2.5;   // respiración entre frases
 }
}
function start(){
 if(!on()) return;
 if(!ctx&&!build()) return;
 if(ctx.state==='suspended') try{ ctx.resume(); }catch(e){}
 if(playing) return; playing=true;
 nextT=Math.max(ctx.currentTime+0.3,nextT);
 master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(Math.max(master.gain.value,0.0001),ctx.currentTime);
 master.gain.linearRampToValueAtTime(VOL*0.6,ctx.currentTime+2.5);
 programar(); clearInterval(timer); timer=setInterval(programar,1000);
}
function stop(){
 if(!ctx||!playing) return; playing=false; clearInterval(timer);
 master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value,ctx.currentTime);
 master.gain.linearRampToValueAtTime(0.0001,ctx.currentTime+1.5);
 setTimeout(function(){ if(!playing&&ctx) try{ ctx.suspend(); }catch(e){} nextT=0; },1700);
}
// Suena mientras la voz lee; se apaga 2 s después de que la voz se detiene (las pausas entre frases son más cortas)
setInterval(function(){
 var ss=window.speechSynthesis, habla=!!(ss&&(ss.speaking||ss.pending)&&!ss.paused);
 if(habla){ idle=0; start(); } else if(playing&&(idle+=500)>=2000) stop();
},500);
// El navegador solo deja empezar audio tras un toque: lo preparamos en el primer toque
document.addEventListener('pointerdown',function(){ if(on()&&!ctx) build(); if(ctx&&ctx.state==='suspended'&&on()) try{ ctx.resume(); }catch(e){} },{passive:true});
document.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('[data-a="musica"]'); if(!b) return;
 var v=!on(); setOn(v); b.setAttribute('aria-checked',v); var s=b.parentNode&&b.parentNode.querySelector('.mus-st'); if(s) s.textContent=v?'Activada':'Desactivada'; });
window.LumenMusica={on:on,setOn:setOn};
})();
