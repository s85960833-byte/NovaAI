const BASE=process.env.NOVAAI_URL||'http://127.0.0.1:8787';
async function req(path,options={}){return fetch(BASE+path,{...options,signal:AbortSignal.timeout(12000)})}
async function expect(name,path,options,check){const r=await req(path,options);const body=await r.text();if(!check(r,body))throw new Error(name+' failed: HTTP '+r.status+' '+body.slice(0,160));console.log('PASS '+name);return body}
let ready=false;for(let i=0;i<30;i++){try{const r=await req('/api/config');if(r.ok){ready=true;break}}catch{}await new Promise(x=>setTimeout(x,500))}
if(!ready)throw new Error('local Express server did not become ready');
await expect('bilingual frontend shell','/',{},(r,b)=>r.ok&&b.includes('<html lang="en">')&&b.includes('/mode-registry.js')&&b.includes('/mode-workspace.js')&&b.includes('Install App')&&b.includes("const L=['English','हिन्दी|Hindi'];")&&b.includes('hi:{'));
await expect('bilingual mode registry asset','/mode-registry.js',{},(r,b)=>r.ok&&b.includes('NovaModeRegistry')&&b.includes('Government Scheme Finder')&&b.includes('योजना ढूँढो'));
await expect('mode workspace asset','/mode-workspace.js',{},(r,b)=>r.ok&&b.includes('nova_modes_v1')&&b.includes('nova_mode_cache_v1')&&b.includes('फ़ाइल तैयार:'));
const config=JSON.parse(await expect('server config','/api/config',{},(r,b)=>r.ok&&JSON.parse(b).model==='test-model'));
const manifest=JSON.parse(await expect('bilingual PWA manifest','/manifest.webmanifest',{},(r,b)=>r.ok&&JSON.parse(b).name==='Nova AI'&&JSON.parse(b).lang==='hi'));
await expect('PWA service worker','/sw.js',{},(r,b)=>r.ok&&b.includes('nova-shell-v3-bilingual')&&b.includes("u.pathname.startsWith('/api/')")&&b.includes("/icons/icon-512.png"));
await expect('PWA icon 192','/icons/icon-192.png',{},(r,b)=>r.ok);
await expect('PWA icon 512','/icons/icon-512.png',{},(r,b)=>r.ok);
await expect('chat validation','/api/chat/completions',{method:'POST',headers:{'content-type':'application/json'},body:'{}'},r=>r.status===400);
await expect('search validation','/api/search',{method:'POST',headers:{'content-type':'application/json'},body:'{}'},r=>r.status===400);
await expect('image validation','/api/image',{method:'POST',headers:{'content-type':'application/json'},body:'{}'},r=>r.status===400);
await expect('image job status validation','/api/image/status/not-a-real-job',{},r=>r.status===404);
await expect('transcription validation','/api/transcribe',{method:'POST',headers:{'content-type':'audio/webm'},body:new Uint8Array()},r=>r.status===400);
console.log('PASS local runtime smoke tests');
