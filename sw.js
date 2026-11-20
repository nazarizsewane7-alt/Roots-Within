self.window=self;
importScripts('content.js');
const A=self.APP||{meta:{id:'philosong',version:'1.0'}},ID=A.meta.id,SHELL=ID+'-shell-v'+A.meta.version,AUD=ID+'-audio-v1';
const FILES=['./','index.html','content.js','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
const songs=()=>((A.entries||[]).map(e=>e.song&&e.song.file).filter(Boolean));
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(SHELL);await Promise.allSettled(FILES.map(f=>c.add(f)));
 if(A.meta.autoCacheAudio){const a=await caches.open(AUD);await Promise.allSettled(songs().map(f=>a.add(f)))}})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith(ID+'-shell-v')&&k!==SHELL)await caches.delete(k);await clients.claim()})())});
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting()});
async function range(req,res){
 const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range')||'');const buf=await res.arrayBuffer(),n=buf.byteLength;
 const h={'Content-Type':res.headers.get('Content-Type')||'audio/mpeg','Accept-Ranges':'bytes'};
 if(!m||(m[1]===''&&m[2]===''))return new Response(buf,{status:200,headers:{...h,'Content-Length':n}});
 let s,e;if(m[1]===''){const l=+m[2];s=Math.max(0,n-l);e=n-1}else{s=+m[1];e=m[2]===''?n-1:Math.min(+m[2],n-1)}
 if(s>=n||s>e)return new Response(null,{status:416,headers:{...h,'Content-Range':'bytes */'+n}});
 return new Response(buf.slice(s,e+1),{status:206,headers:{...h,'Content-Range':`bytes ${s}-${e}/${n}`,'Content-Length':e-s+1}})}
self.addEventListener('fetch',ev=>{const r=ev.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 if(/\/audio\//.test(u.pathname)){ev.respondWith((async()=>{const c=await caches.open(AUD);let hit=await c.match(u.pathname.split('/').pop()?r.url:r.url,{ignoreSearch:true});
  if(hit)return r.headers.get('range')?range(r,hit):hit;
  try{const net=await fetch(u.href);if(net.ok)ev.waitUntil(c.put(u.href,net.clone()));return r.headers.get('range')?range(r,net.clone()):net}catch(_){return new Response('offline',{status:503})}})());return}
 ev.respondWith((async()=>{const c=await caches.open(SHELL);const hit=await c.match(r,{ignoreSearch:true});
  const f=fetch(r).then(n=>{if(n.ok)c.put(r,n.clone());return n}).catch(()=>null);
  if(hit){ev.waitUntil(f);return hit}const n=await f;if(n)return n;
  return r.mode==='navigate'?(await c.match('index.html')||await c.match('./')):new Response('offline',{status:503})})())});
