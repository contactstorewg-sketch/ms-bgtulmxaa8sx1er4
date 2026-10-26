var C='buteurs-v11',F=['./','index.html','app.js?v=11','style.css?v=11','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(C).then(function(c){return c.addAll(F)}).catch(function(){}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x.indexOf('buteurs-')===0&&x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
// Réseau d'abord : on veut toujours l'analyse la plus récente ; le cache sert seulement hors ligne.
self.addEventListener('fetch',function(e){var q=e.request;if(q.method!=='GET'||new URL(q.url).origin!==location.origin)return;
e.respondWith(fetch(q,{cache:'no-store'}).then(function(r){if(r&&r.ok){var cp=r.clone();caches.open(C).then(function(c){c.put(q,cp)})}return r}).catch(function(){return caches.match(q,{ignoreSearch:true}).then(function(r){return r||(q.mode==='navigate'?caches.match('index.html'):undefined)})}))});
