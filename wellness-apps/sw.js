// Dirección anterior (Wellness Apps). Este service worker borra su caché y se desinstala; la app vive en /planificar-proyectos-apps/.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>/^wellness-/.test(x)).map(x=>caches.delete(x)))).then(()=>self.registration.unregister()).then(()=>self.clients.matchAll()).then(cs=>cs.forEach(c=>c.navigate('/planificar-proyectos-apps/')))));
