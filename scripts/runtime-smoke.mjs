const BASE=process.env.NOVAAI_URL||'http://127.0.0.1:8787';
async function req(path,options={}){return fetch(BASE+path,{...options,signal:AbortSignal.timeout(12000)})}
async function expect(name,path,options,check){const r=await req(path,options);const body=await r.text();if(!check(r,body))throw new Error(name+' failed: HTTP '+r.status+' '+body.slice(0,180));console.log('PASS '+name);return body}
let ready=false;for(let i=0;i<30;i++){try{const r=await req('/api/config');if(r.ok){ready=true;break}}catch{}await new Promise(x=>setTimeout(x,500))}
if(!ready)throw new Error('local Express server did not become ready');
const html=await expect('previous standard chat UI','/',{},(r,b)=>r.ok&&b.includes('<html lang="en">')&&b.includes('id="msgs"')&&b.includes('id="dset"')&&b.includes('id="photo"')&&b.includes("localStorage.getItem('nova')")&&b.includes("localStorage.setItem('nova',JSON.stringify(S))")&&['nova-home','nova-hero','nova-workspaces','nova-tool-grid'].every(x=>b.includes(x))&&!b.includes('id="nova-future-style"')&&!b.includes('id="nova-future-script"')&&!b.includes('nova-living-core')&&!b.includes('INDIAN SOUL • FUTURE INTELLIGENCE'));
await expect('NOVA workspace scripts connected','/',{},(r,b)=>r.ok&&['src="/mode-registry.js"','src="/mode-workspace.js"','src="/nova-suite.js"','src="/s-tier.js"'].every(x=>b.includes(x)));
await expect('standard UI language dictionaries','/',{},(r,b)=>r.ok&&b.includes('hi:{')&&b.includes('phSolve:'));
await expect('standard UI Settings and image panels','/',{},(r,b)=>r.ok&&b.includes('id="dset"')&&b.includes('id="photo"')&&b.includes('id="pprev"'));
await expect('instant health endpoint','/health',{},(r,b)=>r.ok&&JSON.parse(b).status==='ok'&&JSON.parse(b).ready===true);
await expect('optional S-tier feature bundle','/s-tier.js',{},(r,b)=>r.ok&&b.length>1000);
await expect('NOVA Build feature bundle','/nova-suite.js',{},(r,b)=>r.ok&&b.includes('Project Brain')&&b.includes('AI Council')&&b.includes('Idea-to-Business'));
await expect('mode registry asset','/mode-registry.js',{},(r,b)=>r.ok&&b.includes('NovaModeRegistry'));
await expect('mode workspace asset','/mode-workspace.js',{},(r,b)=>r.ok&&b.includes('NovaModeWorkspace'));
const config=JSON.parse(await expect('server config','/api/config',{},(r,b)=>r.ok&&JSON.parse(b).model==='test-model'));
await expect('PWA manifest','/manifest.webmanifest',{},(r,b)=>r.ok&&JSON.parse(b).name.toLowerCase().includes('nova'));
await expect('PWA service worker','/sw.js',{},(r,b)=>r.ok&&b.length>100);
await expect('PWA icon 192','/icons/icon-192.png',{},r=>r.ok);
await expect('PWA icon 512','/icons/icon-512.png',{},r=>r.ok);
await expect('chat validation','/api/chat/completions',{method:'POST',headers:{'content-type':'application/json'},body:'{}'},r=>r.status===400);
await expect('search validation','/api/search',{method:'POST',headers:{'content-type':'application/json'},body:'{}'},r=>r.status===400);
await expect('image validation','/api/image',{method:'POST',headers:{'content-type':'application/json'},body:'{}'},r=>r.status===400);
await expect('image job status validation','/api/image/status/not-a-real-job',{},r=>r.status===404);
await expect('transcription validation','/api/transcribe',{method:'POST',headers:{'content-type':'audio/webm'},body:new Uint8Array()},r=>r.status===400);
await expect('previous home UI without new four-workspace redesign','/',{},(r,b)=>r.ok&&b.includes('nova-home')&&b.includes('nova-workspaces')&&!b.includes('CHAT & STUDY')&&!b.includes('VOICE CHAT'));
console.log('PASS local runtime smoke tests');
