const BASE=process.env.NOVAAI_URL||'http://127.0.0.1:8787';
async function req(path,options={}){return fetch(BASE+path,{...options,signal:AbortSignal.timeout(12000)})}
async function expect(name,path,options,check){const r=await req(path,options);const body=await r.text();if(!check(r,body))throw new Error(name+' failed: HTTP '+r.status+' '+body.slice(0,180));console.log('PASS '+name);return body}
let ready=false;for(let i=0;i<30;i++){try{const r=await req('/api/config');if(r.ok){ready=true;break}}catch{}await new Promise(x=>setTimeout(x,500))}
if(!ready)throw new Error('local Express server did not become ready');
const html=await expect('previous standard chat UI','/',{},(r,b)=>r.ok&&b.includes('<html lang="en">')&&b.includes('id="msgs"')&&b.includes('id="dset"')&&b.includes('id="photo"')&&['nova-home','nova-hero','nova-workspaces','nova-tool-grid'].every(x=>b.includes(x))&&!b.includes('id="nova-future-style"')&&!b.includes('id="nova-future-script"')&&!b.includes('nova-living-core')&&!b.includes('INDIAN SOUL • FUTURE INTELLIGENCE'));
await expect('NOVA workspace scripts connected','/',{},(r,b)=>r.ok&&['src="/nova-config.js"','src="/nova-app.js"','src="/mode-registry.js"','src="/mode-workspace.js"','src="/nova-suite.js"','src="/s-tier.js"'].every(x=>b.includes(x))&&!/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(b));
await expect('externalized NOVA app script','/nova-app.js',{},(r,b)=>r.ok&&b.includes('const CFG=Object.assign')&&b.includes("localStorage.getItem('nova')")&&b.includes('const persistable=()=>')&&b.includes('JSON.stringify(persistable())')&&b.length>100000);
await expect('externalized NOVA config script','/nova-config.js',{},(r,b)=>r.ok&&b.includes('window.NOVA_CONFIG'));
await expect('Business Intelligence scripts included on homepage','/',{},(r,b)=>r.ok&&b.includes('src="/nova-business-core.js"')&&b.includes('src="/nova-business.js"')&&b.includes('src="/nova-business-cloud.js"'));
await expect('standard UI language dictionaries','/nova-app.js',{},(r,b)=>r.ok&&b.includes('hi:{')&&b.includes('phSolve:'));
await expect('standard UI Settings and image panels','/',{},(r,b)=>r.ok&&b.includes('id="dset"')&&b.includes('id="photo"')&&b.includes('id="pprev"'));
await expect('instant health endpoint','/health',{},(r,b)=>{const j=JSON.parse(b);return r.ok&&j.ok===true&&j.ready===true&&j.service==='nova-ai'&&j.status==='ok'});
await expect('HTTP security headers and full CSP policy','/health',{},r=>{const csp=r.headers.get('content-security-policy')||'';return r.ok&&r.headers.get('x-content-type-options')==='nosniff'&&r.headers.get('x-frame-options')==='DENY'&&r.headers.get('referrer-policy')==='strict-origin-when-cross-origin'&&r.headers.get('permissions-policy')==='camera=(self), microphone=(self), geolocation=()'&&csp.includes("default-src 'self'")&&csp.includes("script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net")&&csp.includes("object-src 'none'")&&csp.includes("base-uri 'none'")&&csp.includes("form-action 'self'")&&csp.includes("frame-ancestors 'none'")&&!/script-src[^;]*unsafe-inline/.test(csp)&&r.headers.get('strict-transport-security')==='max-age=31536000; includeSubDomains'&&!r.headers.has('x-powered-by')});
await expect('optional S-tier feature bundle','/s-tier.js',{},(r,b)=>r.ok&&b.length>1000);
await expect('reference dashboard asset and home mount','/nova-reference.js',{},(r,b)=>r.ok&&b.includes("const root=$('#hi');")&&b.includes("const host=$('#log');")&&!b.includes('#novaSHome')&&b.includes('data-group=\"build\"')&&b.includes('data-group=\"learn\"')&&b.includes('data-group=\"agents\"'));
await expect('NOVA Build feature bundle','/nova-suite.js',{},(r,b)=>r.ok&&b.includes('Project Brain')&&b.includes('AI Council')&&b.includes('Idea-to-Business'));
await expect('Business Intelligence calculation engine','/nova-business-core.js',{},(r,b)=>r.ok&&b.includes('analyzeExpenses')&&b.includes('simulateScenario')&&b.includes('makeProof'));
await expect('Business Intelligence workspace','/nova-business.js',{},(r,b)=>r.ok&&b.includes('Cost Leak Detector')&&b.includes('Project Risk Predictor')&&b.includes('Action Proof'));
await expect('Business Intelligence cloud/auth client','/nova-business-cloud.js',{},(r,b)=>r.ok&&b.includes('createClient')&&b.includes('nova-bi-api'));
await expect('mode registry asset','/mode-registry.js',{},(r,b)=>r.ok&&b.includes('NovaModeRegistry'));
await expect('mode workspace asset','/mode-workspace.js',{},(r,b)=>r.ok&&b.includes('NovaModeWorkspace'));
const config=JSON.parse(await expect('server config','/api/config',{},(r,b)=>r.ok&&JSON.parse(b).model==='test-model'));
await expect('PWA manifest','/manifest.webmanifest',{},(r,b)=>r.ok&&JSON.parse(b).name.toLowerCase().includes('nova'));
await expect('PWA service worker','/sw.js',{},(r,b)=>r.ok&&b.length>100&&b.includes('nova-config.js')&&b.includes('nova-app.js')&&b.includes('nova-reference.js')&&b.includes('nova-business-core.js')&&b.includes('nova-business-cloud.js'));
await expect('PWA icon 192','/icons/icon-192.png',{},r=>r.ok);
await expect('PWA icon 512','/icons/icon-512.png',{},r=>r.ok);
await expect('chat validation','/api/chat/completions',{method:'POST',headers:{'content-type':'application/json'},body:'{}'},r=>r.status===400);
await expect('malformed JSON API body returns JSON 400','/api/search',{method:'POST',headers:{'content-type':'application/json'},body:'{'},(r,b)=>r.status===400&&JSON.parse(b).error==='Request body must be valid JSON');
const oversizedJson='{"q":"'+'x'.repeat(6*1024*1024)+'"}';
await expect('oversized JSON API body returns JSON 413','/api/search',{method:'POST',headers:{'content-type':'application/json'},body:oversizedJson},(r,b)=>r.status===413&&JSON.parse(b).error==='Request body is too large');
await expect('search validation','/api/search',{method:'POST',headers:{'content-type':'application/json'},body:'{}'},r=>r.status===400);
await expect('image validation','/api/image',{method:'POST',headers:{'content-type':'application/json'},body:'{}'},r=>r.status===400);
await expect('image job status validation','/api/image/status/not-a-real-job',{},r=>r.status===404);
await expect('provider fan-out self-test is disabled by default','/api/live/selftest',{},r=>r.status===404);
await expect('transcription validation','/api/transcribe',{method:'POST',headers:{'content-type':'audio/webm'},body:new Uint8Array()},r=>r.status===400);
await expect('previous home UI without new four-workspace redesign','/',{},(r,b)=>r.ok&&b.includes('nova-home')&&b.includes('nova-workspaces')&&!b.includes('CHAT & STUDY')&&!b.includes('VOICE CHAT'));
// Verify throttling runs before JSON parsing: request 61 must be rejected
// even when its body is malformed, rather than spending parser work first.
const parseOrderIp='198.51.100.241';
for(let i=0;i<60;i++){
 const response=await req('/api/config',{headers:{'x-forwarded-for':parseOrderIp}});
 if(response.status!==200) throw new Error('API rate limit blocked pre-parser setup request '+(i+1)+': HTTP '+response.status);
}
const malformedAfterLimit=await req('/api/search',{method:'POST',headers:{'x-forwarded-for':parseOrderIp,'content-type':'application/json'},body:'{'});
if(malformedAfterLimit.status!==429) throw new Error('API request was parsed before rate limiting: HTTP '+malformedAfterLimit.status);
console.log('PASS API throttling occurs before JSON body parsing');

// Exercise the real Express middleware with an isolated test client IP.
const rateLimitIp='198.51.100.240';
for(let i=0;i<60;i++){
 const response=await req('/api/config',{headers:{'x-forwarded-for':rateLimitIp}});
 if(response.status!==200) throw new Error('API rate limit blocked request '+(i+1)+' before the configured threshold: HTTP '+response.status);
}
const blocked=await req('/api/config',{headers:{'x-forwarded-for':rateLimitIp}});
if(blocked.status!==429) throw new Error('API rate limit did not reject request 61: HTTP '+blocked.status);
console.log('PASS integrated per-IP API rate limit (60 allowed, 61st blocked)');
await expect('SEO robots policy','/robots.txt',{},(r,b)=>r.ok&&b.includes('Allow: /')&&b.includes('Disallow: /api/')&&b.includes('/sitemap.xml'));
await expect('SEO sitemap','/sitemap.xml',{},(r,b)=>r.ok&&b.includes('<urlset')&&b.includes('https://novaai-4auo.onrender.com/'));
await expect('SEO page metadata','/',{},(r,b)=>r.ok&&b.includes('name="description"')&&b.includes('property="og:title"')&&b.includes('rel="canonical"'));
console.log('PASS local runtime smoke tests');
