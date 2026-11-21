/* Arc & Ink · Noorullah Adel · MIT. Change VERSION after editing cached assets. */
const VERSION="85465c6b";
const ASSETS=[
  "index.html",
  "styles.css",
  "js/geometry.js",
  "js/atlas.js",
  "js/game.js",
  "manifest.webmanifest",
  "icons/mark.svg",
  "icons/apple.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable.png"
];
(function scopeWorker(self,caches,fetch,URL){
  'use strict';
  const scope=new URL(self.registration.scope);
  const prefix='arc-and-ink::'+scope.href+'::';
  const current=prefix+VERSION;
  const paths=ASSETS.map(path=>new URL(path,scope).href);
  const allowed=new Set(paths);
  const entry=new URL('index.html',scope).href;
  self.addEventListener('install',event=>{
    // A worker with a missing runtime file never becomes the offline version.
    event.waitUntil(caches.open(current).then(cache=>cache.addAll(paths)));
  });
  self.addEventListener('activate',event=>{
    event.waitUntil((async()=>{
      for(const name of await caches.keys())if(name.startsWith(prefix)&&name!==current)await caches.delete(name);
      await self.clients.claim();
    })());
  });
  self.addEventListener('fetch',event=>{
    if(event.request.method!=='GET')return;
    const url=new URL(event.request.url);
    if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
    url.search='';url.hash='';
    let key=url.href;
    if(key===scope.href)key=entry;
    if(!allowed.has(key))return;
    event.respondWith((async()=>{
      const cache=await caches.open(current),hit=await cache.match(key);
      if(hit)return hit;
      const response=await fetch(event.request);
      if(response.ok)await cache.put(key,response.clone());
      return response;
    })());
  });
})(self,caches,fetch,URL);
