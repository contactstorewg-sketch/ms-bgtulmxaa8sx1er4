var C='ms-v10',F=['./','index.html','detector.js','manifest.webmanifest','icon.svg','mp4box.min.js'];
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(C).then(function(c){return c.addAll(F.map(function(u){return new Request(u,{cache:'reload'})}))}).catch(function(){}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
/* Réseau d'abord (sans cache HTTP) pour tout ; le cache ne sert qu'hors ligne */
self.addEventListener('fetch',function(e){var q=e.request;if(q.method!=='GET'||new URL(q.url).origin!==location.origin)return;
  e.respondWith(fetch(q,{cache:'no-store'}).then(function(r){if(r&&r.ok){var cp=r.clone();caches.open(C).then(function(c){c.put(q,cp)})}return r}).catch(function(){return caches.match(q,{ignoreSearch:true}).then(function(r){return r||(q.mode==='navigate'?caches.match('index.html'):undefined)})}))});
self.addEventListener('message',function(e){if(e.data==='skip')self.skipWaiting()});
self.addEventListener('notificationclick',function(e){e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(function(l){if(l.length)return l[0].focus();return clients.openWindow('./')}))});
