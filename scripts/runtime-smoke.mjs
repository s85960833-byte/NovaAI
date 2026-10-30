const BASE=process.env.NOVAAI_URL||'http://127.0.0.1:8787';
async function req(path,options={}){return fetch(BASE+path,{...options,signal:AbortSignal.timeout(12000)})}
async function expect(name,path,options,check){const r=await req(path,options);const body=await r.text();if(!check(r,body))throw new Error(name+' failed: HTTP '+r.status+' '+body.slice(0,160));console.log('PASS '+name);return body}
let ready=false;for(let i=0;i<30;i++){try{const r=await req('/api/config');if(r.ok){ready=true;break}}catch{}await new Promise(x=>setTimeout(x,500))}
if(!ready)throw new Error('local Express server did not become ready');
const html=await expect('frontend shell','/',{},(r,b)=>r.ok&&b.includes('/mode-registry.js')&&b.includes('/mode-workspace.js'));
await expect('mode registry asset','/mode-registry.js',{},(r,b)=>r.ok&&b.includes('NovaModeRegistry')&&b.includes('Government Scheme Finder')&&!/[\\u0900-\\u097F]/.test(b));
await expect('mode workspace asset','/mode-workspace.js',{},(r,b)=>r.ok&&b.includes('nova_modes_v1')&&b.includes('nova_mode_cache_v1'));
const config=JSON.parse(await expect('server config','/api/config',{},(r,b)=>r.ok&&JSON.parse(b).model==='test-model'));
const manifest=JSON.parse(await expect('PWA manifest','/manifest.webmanifest',{},(r,b)=>r.ok&&JSON.parse(b).name==='Nova AI'&&JSON.parse(b).lang==='en'));
await expect('PWA service worker','/sw.js',{},(r,b)=>r.ok&&b.includes('nova-shell-v2-en')&&b.includes("u.pathname.startsWith('/api/')")&&b.includes("/icons/icon-512.png"));
await expect('PWA icon 192','/icons/icon-192.png',{},(r,b)=>r.ok);
await expect('PWA icon 512','/icons/icon-512.png',{},(r,b)=>r.ok);
await expect('chat validation','/api/chat/completions',{method:'POST',headers:{'content-type':'application/json'},body:'{}'},(r)=>r.status===400);
await expect('search validation','/api/search',{method:'POST',headers:{'content-type':'application/json'},body:'{}'},(r)=>r.status===400);
await expect('image validation','/api/image',{method:'POST',headers:{'content-type':'application/json'},body:'{}'},(r)=>r.status===400);
await expect('transcription validation','/api/transcribe',{method:'POST',headers:{'content-type':'audio/webm'},body:new Uint8Array()},(r)=>r.status===400);
console.log('PASS local runtime smoke tests');
