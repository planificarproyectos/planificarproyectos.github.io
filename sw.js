// Service worker del sitio principal. No toca las apps con su propio SW.
const C='pp-site-v2';
const PRE=['/','/hero.webp','/favicon.svg','/app-icon-192.png'];
const SKIP=/^\/(mindfocus|powerfit|lumen|proyecta|wellness-apps)\//;
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(PRE)).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('pp-site-')&&x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||SKIP.test(u.pathname))return;
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res})
    .catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('/'):undefined))));
});
