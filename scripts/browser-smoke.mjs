import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE=process.env.NOVAAI_URL||'http://127.0.0.1:8787';
const browser=await chromium.launch({headless:true});
const errors=[],cspErrors=[];
const track=page=>{
 page.on('pageerror',e=>errors.push(String(e.message||e)));
 page.on('console',msg=>{if(msg.type()==='error'&&/content security policy|refused to (?:load|execute|apply)/i.test(msg.text()))cspErrors.push(msg.text())});
};

try{
 const desktop=await browser.newPage({viewport:{width:1365,height:900}});
 track(desktop);
 await desktop.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.min.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{onAuthStateChange(){},getSession:async()=>({data:{session:null}})}})};'}));
 await desktop.goto(BASE,{waitUntil:'domcontentloaded'});
 const csp=await desktop.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
 assert.ok(csp.includes("script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net"),'script CSP must allow only reviewed self/CDN script sources');
 assert.doesNotMatch(csp,/script-src[^;]*'unsafe-inline'/,'script CSP must not permit inline execution');
 assert.match(csp,/worker-src[^;]*https:\/\/cdn\.jsdelivr\.net/,'worker CSP must allow the pinned PDF.js worker origin');
 const pdfSmoke=await desktop.evaluate(async()=>{
  const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/legacy/build/pdf.worker.mjs';
  const stream='BT /F1 12 Tf 20 100 Td (NOVA PDF smoke) Tj ET';
  const objects=[
   '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
   '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
   '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
   '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
   '5 0 obj << /Length '+stream.length+' >> stream\n'+stream+'\nendstream endobj'
  ];
  let source='%PDF-1.4\n';const offsets=[0];
  for(const object of objects){offsets.push(new TextEncoder().encode(source).length);source+=object+'\n'}
  const xrefOffset=new TextEncoder().encode(source).length;
  source+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
  for(const offset of offsets.slice(1))source+=String(offset).padStart(10,'0')+' 00000 n \n';
  source+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xrefOffset+'\n%%EOF';
  const loadingTask=pdfjs.getDocument({data:new TextEncoder().encode(source),isEvalSupported:false});
  const pdf=await loadingTask.promise;
  const page=await pdf.getPage(1),content=await page.getTextContent();
  const text=content.items.map(item=>item.str).join(' ');
  await loadingTask.destroy();
  return {version:pdfjs.version,text};
 });
 assert.equal(pdfSmoke.version,'6.5.438','PDF.js version must match the patched pinned release');
 assert.match(pdfSmoke.text,/NOVA PDF smoke/,'patched PDF.js must extract text from a synthetic untrusted PDF');
 console.log('PASS patched PDF.js module, worker, CSP and synthetic PDF text extraction');
 await desktop.locator('#hi .nr-card[data-group="learn"]').waitFor({state:'visible',timeout:15000});
 await desktop.waitForFunction(()=>document.body.classList.contains('nova-dashboard-home'));
 const desktopState=await desktop.evaluate(()=>({
  width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
  columns:getComputedStyle(document.querySelector('#hi .nr-cards')).gridTemplateColumns.split(' ').length,
  composer:getComputedStyle(document.querySelector('#box')).display,
  bilingual:document.querySelector('#hi .nr-cards')?.innerText||''
 }));
 assert.ok(desktopState.scrollWidth<=desktopState.width+1,'desktop horizontal overflow');
 assert.equal(desktopState.columns,3,'desktop should show three workspace cards');
 assert.equal(desktopState.composer,'none','global composer must be hidden on workspace home');
 for(const label of ['NOVA Build / नोवा बिल्ड','NOVA Learn / नोवा लर्न','NOVA Agents / नोवा एजेंट्स'])assert.ok(desktopState.bilingual.includes(label),'missing bilingual card '+label);
 assert.equal(await desktop.locator('#hi [data-nr]').count(),0,'home must not expose direct photo/voice agent shortcuts');
 assert.equal(await desktop.locator('#hi #nrAsk').count(),0,'home must not expose a global AI prompt');
 const searchPlaceholder=await desktop.locator('#nrGlobalSearch').getAttribute('placeholder');
 assert.ok(searchPlaceholder.includes('सेव की गई चैट खोजें'),'saved-chat search placeholder must be bilingual');
 console.log('PASS desktop workspace home, bilingual cards, no global assistant shortcuts, no overflow');

 // A legacy key remains usable in this tab after migration, but must be scrubbed from durable storage.
 await desktop.evaluate(()=>{const state=JSON.parse(localStorage.getItem('nova')||'{}');state.cfg={...(state.cfg||{}),base:'https://api.example.test/v1',model:'test-model',key:'legacy-test-key'};localStorage.setItem('nova',JSON.stringify(state));});
 await desktop.reload({waitUntil:'domcontentloaded'});
 const migrated=await desktop.evaluate(()=>JSON.parse(localStorage.getItem('nova')||'{}').cfg?.key||'');
 assert.equal(migrated,'','legacy BYOK key must be removed from localStorage during migration');
 await desktop.evaluate(()=>document.querySelector('#cfg').onclick());
 assert.equal(await desktop.locator('#key').inputValue(),'legacy-test-key','legacy key should remain usable in the active tab after migration');
 await desktop.locator('#csave').click();
 const savedKey=await desktop.evaluate(()=>JSON.parse(localStorage.getItem('nova')||'{}').cfg?.key||'');
 assert.equal(savedKey,'','saving provider settings must not persist the API key');
 await desktop.reload({waitUntil:'domcontentloaded'});
 await desktop.evaluate(()=>document.querySelector('#cfg').onclick());
 assert.equal(await desktop.locator('#key').inputValue(),'','BYOK key must not survive a page reload');
 await desktop.locator('#dcfg').evaluate(el=>el.close());
 console.log('PASS BYOK legacy-key migration, active-tab use and non-persistent key storage');

 const learn=desktop.locator('#hi .nr-card[data-group="learn"]');
 await learn.click();
 await desktop.locator('#novaModes.open').waitFor();
 assert.equal(await desktop.locator('#novaModes').getAttribute('role'),'dialog');
 assert.equal(await desktop.locator('#novaModes').getAttribute('aria-modal'),'true');
 assert.equal(await desktop.locator('#novaModes').getAttribute('aria-hidden'),'false');
 assert.equal(await desktop.evaluate(()=>document.activeElement.id),'nmTitle','opening a workspace should move focus into the dialog');
 const learnText=await desktop.locator('#nmContent').innerText();
 assert.ok(learnText.includes('Photo Questions / फोटो वाले सवाल'),'Learn should contain photo questions');
 assert.ok(!learnText.includes('History Archive'),'History Archive must not be in Learn');
 assert.ok(!learnText.includes('Live Voice'),'voice must not be in Learn');
 await desktop.locator('#nmClose').click();
 await desktop.waitForFunction(()=>!document.querySelector('#novaModes').classList.contains('open'));
 assert.equal(await desktop.evaluate(()=>document.activeElement.dataset.group),'learn','closing with Escape should restore focus to the launch card');
 console.log('PASS keyboard open/close, dialog semantics, focus entry/restoration and Learn isolation');

 const agents=desktop.locator('#hi .nr-card[data-group="agents"]');
 await agents.click();
 await desktop.locator('#novaModes.open').waitFor();
 const agentsWorkspace=await desktop.locator('#nmContent').innerText();
 assert.ok(agentsWorkspace.includes('Business Intelligence / बिज़नेस इंटेलिजेंस'));
 assert.ok(agentsWorkspace.includes('Company Account Cloud / कंपनी अकाउंट क्लाउड'));
 await desktop.locator('#nmContent [data-quick="openBusinessIntelligence"]').click();
 await desktop.locator('#novaBusiness.show').waitFor();
 assert.ok((await desktop.locator('#nbBody').innerText()).includes('Business Intelligence Dashboard / बिज़नेस इंटेलिजेंस डैशबोर्ड'));
 await desktop.keyboard.press('Escape');
 await desktop.waitForFunction(()=>!document.querySelector('#novaBusiness').classList.contains('show'));
 assert.equal(await desktop.locator('#novaModes').evaluate(el=>el.classList.contains('open')),true,'Agents workspace should remain open after closing Business Intelligence');
 await desktop.locator('#nmContent [data-quick="openCompanyCloud"]').click();
 await desktop.locator('#novaBICloud.show').waitFor();
 const cloudText=await desktop.locator('#ncbContent').innerText();
 assert.ok(cloudText.includes('Sign in to your company workspace / अपने कंपनी वर्कस्पेस में साइन इन करें'));
 assert.ok(cloudText.includes('Create account / खाता बनाएँ'));
 await desktop.keyboard.press('Escape');
 await desktop.waitForFunction(()=>!document.querySelector('#novaBICloud').classList.contains('show'));
 assert.equal(await desktop.locator('#novaModes').evaluate(el=>el.classList.contains('open')),true,'Agents workspace should remain open after closing Company Cloud');
 await desktop.keyboard.press('Escape');
 await desktop.waitForFunction(()=>!document.querySelector('#novaModes').classList.contains('open'));
 console.log('PASS Business Intelligence and Company Cloud launch only from Agents; nested dialogs restore focus');

 // Exercise a complete Agents chat round trip against deterministic local API responses.
 const modeChatRequests=[];
 await desktop.route('**/api/config',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({model:'browser-test-model',image:true})}));
 await desktop.route('**/api/chat/completions',async route=>{
  const payload=route.request().postDataJSON();
  modeChatRequests.push(payload);
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{role:'assistant',content:'NOVA_CHAT_FLOW_OK_'+modeChatRequests.length}}]})});
 });
 const imageRequests=[];
 const testImage='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/Yf8AAAAASUVORK5CYII=';
 await desktop.route('**/api/image',async route=>{
  imageRequests.push(route.request().postDataJSON());
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jobId:'browser-image-job'})});
 });
 await desktop.route('**/api/image/status/browser-image-job',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:'done',image:testImage})}));
 await desktop.locator('#hi .nr-card[data-group="agents"]').click();
 await desktop.locator('#novaModes.open').waitFor();
 await desktop.locator('#nmContent [data-mode="general"]').click();
 await desktop.locator('#nmInput').fill('Please verify the NOVA chat round trip.');
 await desktop.locator('#nmSend').click();
 await desktop.waitForFunction(()=>[...document.querySelectorAll('#nmContent .nmchat .nmbubble.assistant')].some(el=>el.textContent.includes('NOVA_CHAT_FLOW_OK')));
 assert.equal(modeChatRequests.length,1,'Agents chat must make exactly one backend request');
 assert.ok(modeChatRequests[0].messages.some(m=>String(m.content).includes('Please verify the NOVA chat round trip.')),'Agents chat request must include the submitted user message');
 const persistedModeHistory=await desktop.evaluate(()=>JSON.parse(localStorage.getItem('nova_modes_v1')||'{}').histories?.general||[]);
 assert.ok(persistedModeHistory.some(m=>m.role==='user'&&m.text==='Please verify the NOVA chat round trip.'),'Agents chat must persist the user message in its own mode history');
 assert.ok(persistedModeHistory.some(m=>m.role==='assistant'&&m.text==='NOVA_CHAT_FLOW_OK_1'),'Agents chat must persist the assistant reply in its own mode history');
 console.log('PASS Agents chat round trip, backend request, assistant response and per-mode history persistence');

 // Simulate the browser speech-recognition API to test the voice-to-chat bridge without claiming hardware microphone access.
 await desktop.locator('#nmBack').click();
 await desktop.locator('#nmContent [data-mode="voice"]').click();
 await desktop.locator('#nmVoiceLang').waitFor();
 await desktop.locator('#nmVoiceLang').selectOption('hi-IN');
 await desktop.evaluate(()=>{
  window.__novaVoiceLang='';
  window.SpeechRecognition=class{
   constructor(){this.lang='';}
   start(){window.__novaVoiceLang=this.lang;setTimeout(()=>this.onresult?.({results:[[{transcript:'Voice transcript smoke test'}]]}),0);}
   stop(){}
  };
 });
 await desktop.locator('#nmMic').click();
 await desktop.waitForFunction(()=>[...document.querySelectorAll('#nmContent .nmchat .nmbubble.assistant')].some(el=>el.textContent.includes('NOVA_CHAT_FLOW_OK_2')));
 assert.equal(await desktop.evaluate(()=>window.__novaVoiceLang),'hi-IN','voice recognition must use the selected Hindi (India) language');
 assert.equal(modeChatRequests.length,2,'voice transcription must submit exactly one additional chat request');
 const voiceHistory=await desktop.evaluate(()=>JSON.parse(localStorage.getItem('nova_modes_v1')||'{}').histories?.voice||[]);
 assert.ok(voiceHistory.some(m=>m.role==='user'&&m.text==='Voice transcript smoke test'),'voice transcript must enter the Voice mode history');
 assert.ok(voiceHistory.some(m=>m.role==='assistant'&&m.text==='NOVA_CHAT_FLOW_OK_2'),'voice reply must persist in the Voice mode history');
 console.log('PASS mocked voice recognition, Hindi language selection, transcription-to-chat bridge and Voice history persistence');
 await desktop.locator('#nmClose').click();
 await desktop.waitForFunction(()=>!document.querySelector('#novaModes').classList.contains('open'));

 // The Build workspace Image Studio action must reveal the existing image composer from the dashboard.
 await desktop.locator('#hi .nr-card[data-group="build"]').click();
 await desktop.locator('#novaModes.open').waitFor();
 await desktop.locator('#nmContent [data-quick="openImageStudio"]').click();
 await desktop.locator('#imbar').waitFor({state:'visible',timeout:5000});
 assert.equal(await desktop.locator('#box').isVisible(),true,'Image Studio must reveal the composer while the workspace dashboard is mounted');
 assert.equal(await desktop.locator('#in').isVisible(),true,'Image Studio prompt must be reachable from NOVA Build');
 await desktop.locator('#imopt').waitFor({state:'visible'});
 await desktop.locator('#imopt button[aria-pressed="true"]').click();
 await desktop.locator('#in').fill('A small blue geometric star on a dark background');
 await desktop.locator('#send').click();
 await desktop.locator('#log img.thumb[src^="data:image/png;base64,"]').waitFor({state:'visible',timeout:12000});
 assert.equal(imageRequests.length,1,'Build Image Studio must submit one image-generation job');
 assert.ok(imageRequests[0].prompt.includes('blue geometric star'),'image-generation request must include the user's prompt');
 console.log('PASS NOVA Build Image Studio launch, async image job polling and rendered image result');
 await desktop.locator('#imbar').click();
 await desktop.waitForFunction(()=>!document.body.classList.contains('nova-image-mode'));
 assert.equal(await desktop.locator('#box').isVisible(),false,'closing Image Studio must restore the clean workspace home');
 await desktop.locator('#hi .nr-card[data-group="learn"]').click();
 await desktop.locator('#novaModes.open').waitFor();
 await desktop.locator('#nmContent [data-quick="openPhoto"]').click();
 await desktop.locator('#photo').waitFor({state:'visible'});
 await desktop.locator('#pclose2').click();
 await desktop.waitForFunction(()=>document.querySelector('#photo').hidden);
 console.log('PASS Learn Photo Questions launcher opens and closes the existing photo-question panel');

 const mobileContext=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const mobile=await mobileContext.newPage();
 track(mobile);
 await mobile.goto(BASE,{waitUntil:'domcontentloaded'});
 await mobile.locator('#hi .nr-card[data-group="build"]').waitFor({state:'visible',timeout:15000});
 const mobileState=await mobile.evaluate(()=>({
  width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
  columns:getComputedStyle(document.querySelector('#hi .nr-cards')).gridTemplateColumns.split(' ').length,
  card:document.querySelector('#hi .nr-card')?.getBoundingClientRect().toJSON()
 }));
 assert.ok(mobileState.scrollWidth<=mobileState.width+1,'mobile horizontal overflow');
 assert.equal(mobileState.columns,1,'mobile should stack workspace cards in one column');
 assert.ok(mobileState.card.height>=140,'mobile workspace card touch target is too small');
 await mobile.locator('#nrGlobalSearch').fill('saved physics');
 await mobile.keyboard.press('Enter');
 await mobile.waitForFunction(()=>document.querySelector('#side')?.classList.contains('open'));
 assert.equal(await mobile.locator('#q').inputValue(),'saved physics','top search should route to saved-chat search and open the mobile drawer');
 await mobile.locator('#scrim').tap({position:{x:360,y:450}});
 await mobile.waitForFunction(()=>!document.querySelector('#side')?.classList.contains('open'));
 await mobile.locator('#hi .nr-card[data-group="build"]').tap();
 await mobile.locator('#novaModes.open').waitFor();
 const buildText=await mobile.locator('#nmContent').innerText();
 assert.ok(buildText.includes('NOVA Build / नोवा बिल्ड'));
 assert.ok(buildText.includes('Image Studio / इमेज स्टूडियो'));
 assert.ok(!buildText.includes('Live Voice / लाइव वॉइस'));
 assert.ok(!buildText.includes('Photo Questions / फोटो वाले सवाल'));
 await mobile.locator('#nmClose').tap();
 await mobile.locator('#hi .nr-card[data-group="agents"]').tap();
 await mobile.locator('#novaModes.open').waitFor();
 const agentsText=await mobile.locator('#nmContent').innerText();
 assert.ok(agentsText.includes('Live Voice / लाइव वॉइस'));
 assert.ok(agentsText.includes('Agents Studio / एजेंट स्टूडियो'));
 assert.ok(agentsText.includes('History Archive / इतिहास संग्रह'));
 assert.ok(!agentsText.includes('Photo Questions / फोटो वाले सवाल'));
 await mobile.locator('#nmContent [data-mode="general"]').tap();
 await mobile.locator('#nmCompose').waitFor({state:'visible'});
 assert.equal(await mobile.locator('#nmInput').isVisible(),true,'Agents chat composer should remain available inside Agents');
 const inputLabel=await mobile.locator('#nmInput').getAttribute('aria-label');
 assert.ok(inputLabel.includes('NOVA को संदेश'));
 await mobile.keyboard.press('Escape');
 await mobile.waitForFunction(()=>!document.querySelector('#novaModes').classList.contains('open'));
 console.log('PASS Android-sized touch navigation, strict Build/Agents placement and Agents-only chat composer');
 await mobileContext.close();

 const reducedContext=await browser.newContext({viewport:{width:412,height:915},reducedMotion:'reduce'});
 const reduced=await reducedContext.newPage();
 track(reduced);
 await reduced.goto(BASE,{waitUntil:'domcontentloaded'});
 await reduced.locator('#hi .nr-card').first().waitFor({state:'visible',timeout:15000});
 const motion=await reduced.evaluate(()=>({
  lite:document.documentElement.classList.contains('nova-lite-motion'),
  transition:getComputedStyle(document.querySelector('#hi .nr-card')).transitionDuration
 }));
 assert.equal(motion.lite,true,'reduced-motion must enable NOVA lite motion');
 assert.ok(motion.transition==='0s'||motion.transition==='0.01ms','workspace card transitions must be disabled for reduced motion');
 console.log('PASS reduced-motion mode and transition suppression');
 await reducedContext.close();

 assert.deepEqual(errors,[],'browser runtime errors: '+errors.join('; '));
 assert.deepEqual(cspErrors,[],'browser CSP violations: '+cspErrors.join('; '));
 console.log('PASS no browser page errors or CSP violations');
}finally{
 await browser.close();
}