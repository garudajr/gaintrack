importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
const V='gaintrack-v2',A=['./','index.html','style.css','app.js','config.js','manifest.json','icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{const u=e.request.url;
 if(e.request.method!=='GET'||!(u.startsWith(location.origin)||/gstatic\.com\/firebasejs|cdn\.jsdelivr\.net|cdn\.onesignal\.com/.test(u)))return;
 e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
