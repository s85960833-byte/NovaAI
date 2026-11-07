import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE=process.env.NOVAAI_URL||'http://127.0.0.1:8787';
const browser=await chromium.launch({headless:true});
const errors=[];
const track=page=>page.on('pageerror',e=>errors.push(String(e.message||e)));

try{
 const desktop=await browser.newPage({viewport:{width:1365,height:900}});
 track(desktop);
 await desktop.goto(BASE,{waitUntil:'domcontentloaded'});
 await desktop.locator('#novaSHome button.ncat[data-cat="learn"]').waitFor({state:'visible',timeout:15000});
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
 console.log('PASS BYOK legacy-key migration, active-tab use and non-persistent key storage');

 const learn=desktop.locator('#novaSHome button.ncat[data-cat="learn"]');
 await learn.focus();
 await desktop.keyboard.press('Enter');
 await desktop.locator('#novaModes.open').waitFor();
 assert.equal(await desktop.locator('#novaModes').getAttribute('role'),'dialog');
 assert.equal(await desktop.locator('#novaModes').getAttribute('aria-modal'),'true');
 assert.equal(await desktop.locator('#novaModes').getAttribute('aria-hidden'),'false');
 assert.equal(await desktop.evaluate(()=>document.activeElement.id),'nmTitle','opening a workspace should move focus into the dialog');
 const learnText=await desktop.locator('#nmContent').innerText();
 assert.ok(learnText.includes('Photo Questions / फोटो वाले सवाल'),'Learn should contain photo questions');
 assert.ok(!learnText.includes('History Archive'),'History Archive must not be in Learn');
 assert.ok(!learnText.includes('Live Voice'),'voice must not be in Learn');
 await desktop.keyboard.press('Escape');
 await desktop.waitForFunction(()=>!document.querySelector('#novaModes').classList.contains('open'));
 assert.equal(await desktop.evaluate(()=>document.activeElement.dataset.group),'learn','closing with Escape should restore focus to the launch card');
 console.log('PASS keyboard open/close, dialog semantics, focus entry/restoration and Learn isolation');

 const mobileContext=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const mobile=await mobileContext.newPage();
 track(mobile);
 await mobile.goto(BASE,{waitUntil:'domcontentloaded'});
 await mobile.locator('#novaSHome button.ncat[data-cat="build"]').waitFor({state:'visible',timeout:15000});
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
 await mobile.locator('#novaSHome button.ncat[data-cat="build"]').tap();
 await mobile.locator('#novaModes.open').waitFor();
 const buildText=await mobile.locator('#nmContent').innerText();
 assert.ok(buildText.includes('NOVA Build / नोवा बिल्ड'));
 assert.ok(buildText.includes('Image Studio / इमेज स्टूडियो'));
 assert.ok(!buildText.includes('Live Voice / लाइव वॉइस'));
 assert.ok(!buildText.includes('Photo Questions / फोटो वाले सवाल'));
 await mobile.locator('#nmClose').tap();
 await mobile.locator('#novaSHome button.ncat[data-cat="agents"]').tap();
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
 console.log('PASS no browser page errors');
}finally{
 await browser.close();
}