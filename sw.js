// Coffee Archive PWA shell — network-first; private coffee data is not cached here.
const CACHE="coffee-archive-v1.7.0";
const CORE=["./","./index.html","./manifest.webmanifest","./assets/icon.svg","./assets/splash.svg"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith("coffee-archive-")&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=="GET"||url.origin!==self.location.origin)return;
  // A version probe must never be satisfied from a previous offline cache.
  if(url.pathname.endsWith("/version.json")){
    event.respondWith(fetch(new Request(request,{cache:"no-store"})));
    return;
  }
  const navigate=request.mode==="navigate";
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const fresh=await fetch(navigate?new Request(request,{cache:"no-store"}):request);
      if(fresh.ok){
        const target=navigate?new Request("./index.html",{method:"GET"}):request;
        event.waitUntil(cache.put(target,fresh.clone()).catch(()=>{}));
      }
      return fresh;
    }catch(err){
      const target=navigate?new Request("./index.html",{method:"GET"}):request;
      const cached=await cache.match(target);
      if(cached)return cached;
      throw err;
    }
  })());
});
