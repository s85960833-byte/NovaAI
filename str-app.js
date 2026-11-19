(function(){
'use strict';
const root=document.getElementById('strApp');
if(!root||window.NovaSTR)return;
const $=id=>document.getElementById(id);
const dict={
en:{
back:'Nova',replyLabel:'Reply language',contentLabel:'Website content',createSpec:'Create starter plan',specEyebrow:'LOCAL STARTER PLAN',specTitle:'Review your starter plan',localBadge:'Local rules · No AI',sectionsTitle:'Page sections',assumedTitle:'Assumptions to review',placeholderTitle:'Details you still need',buildBlocked:'Full AI website generation and ZIP export are not enabled yet. This plan is a reviewable outline only.',analyzing:'Preparing a local starter plan…',specReady:'Starter plan ready. Review every assumption before using it.',specError:'The starter plan could not be created. Please check the prompt and try again.',unsafeError:'This request cannot be used to create a plan.',localNote:'Your prompt and starter plan stay inside Nova. No AI provider is used in this preview phase.',headline:'A clear idea. A complete build.',
subhead:'Describe the app or website you want. STR will turn your idea into a structured plan, a preview and a downloadable package.',
promptLabel:'What would you like to build?',promptPlaceholder:'Describe your shop website…',
saveDraft:'Save draft',clear:'Clear',localNote:'Your draft is saved only on this device. It is not sent to an AI provider in this phase.',
stageSpec:'01 · Spec',stageSpecDesc:'Understand the idea and list assumptions.',
stageBuild:'02 · Build',stageBuildDesc:'Generate the site in small, resumable sections.',
stageCheck:'03 · Quality',stageCheckDesc:'Check safety, mobile layout and completeness.',
footer:'STR is in setup. Build generation will be enabled after the secure pipeline is ready.',
tagline:'Short prompt. Complete app.',skipIntro:'Skip intro',owner:'Owner mode',empty:'Write a short description first.',
saved:'Draft saved on this device.',saveError:'This browser could not save the draft. Please try again.',
cleared:'Draft cleared.',welcome:'You can choose Hindi or English. You can change this any time.',savePlan:'Save plan edits',specSaved:'Plan changes saved on this device.',conversionBlocked:'Content conversion needs a verified provider and is not available yet.',voiceUnavailable:'On-device speech recognition is not available in this build. Please type your idea.',approveSpec:'Approve this plan',reapproveSpec:'Approve revised plan',approvedLabel:'Approved on this device',notApproved:'Not approved yet.',needsApproval:'Changes made · approval needed.',diffTitle:'Changes from the starter plan',specApproved:'Plan approved and saved on this device.',approvalUnavailable:'Secure approval verification is unavailable in this browser.',buildLocal:'Build local preview',pauseBuild:'Pause local preview',resumeBuild:'Resume local preview',rebuildPreview:'Rebuild local preview',buildNeedsApproval:'Approve the spec before building.',buildReady:'Ready to build a local preview. No AI provider will be used.',buildStarting:'Starting local preview…',buildProgress:'Rendering preview chunk {done} of {total}…',buildPaused:'Build paused. You can resume it on this device.',buildDone:'Local preview ready. No AI provider was used.',buildError:'Local preview could not be completed.',previewTitle:'Local website preview',downloadZip:'Download ZIP',zipReady:'ZIP package downloaded. It includes the static preview and bilingual guide.',zipError:'ZIP creation failed. Please rebuild the preview and try again.'
},
hi:{
back:'Nova',replyLabel:'उत्तर भाषा',contentLabel:'वेबसाइट की भाषा',createSpec:'शुरुआती योजना बनाएँ',specEyebrow:'स्थानीय शुरुआती योजना',specTitle:'अपनी शुरुआती योजना जाँचें',localBadge:'स्थानीय नियम · AI नहीं',sectionsTitle:'पेज के हिस्से',assumedTitle:'जाँचने वाली मान्यताएँ',placeholderTitle:'अभी जरूरी जानकारी',buildBlocked:'पूरा AI वेबसाइट निर्माण और ZIP export अभी चालू नहीं हैं। यह केवल समीक्षा के लिए शुरुआती रूपरेखा है।',analyzing:'स्थानीय शुरुआती योजना बनाई जा रही है…',specReady:'शुरुआती योजना तैयार है। इस्तेमाल से पहले हर मान्यता जाँचें।',specError:'योजना नहीं बन पाई। विवरण जाँचकर दोबारा कोशिश करें।',unsafeError:'इस अनुरोध से योजना नहीं बनाई जा सकती।',localNote:'आपका prompt और शुरुआती योजना Nova के अंदर रहते हैं। इस preview में कोई AI provider इस्तेमाल नहीं होता।',headline:'एक स्पष्ट विचार। पूरा build।',
subhead:'जिस app या website की जरूरत है, उसका वर्णन करें। STR उसे योजना, preview और download package में बदलेगा।',
promptLabel:'आप क्या बनाना चाहते हैं?',promptPlaceholder:'मेरी दुकान की वेबसाइट बनाओ…',
saveDraft:'ड्राफ्ट सुरक्षित करें',clear:'साफ़ करें',localNote:'आपका ड्राफ्ट केवल इसी डिवाइस पर सुरक्षित है। इस चरण में यह किसी AI provider को नहीं भेजा जाता।',
stageSpec:'01 · योजना',stageSpecDesc:'विचार समझें और मान्यताओं की सूची बनाएँ।',
stageBuild:'02 · निर्माण',stageBuildDesc:'वेबसाइट को छोटे, दोबारा शुरू हो सकने वाले हिस्सों में बनाएँ।',
stageCheck:'03 · गुणवत्ता',stageCheckDesc:'सुरक्षा, मोबाइल layout और सभी जरूरी हिस्सों की जाँच करें।',
footer:'STR अभी तैयार हो रहा है। सुरक्षित build pipeline तैयार होने के बाद generation चालू होगी।',
tagline:'छोटा सा प्रॉम्प्ट, पूरा ऐप।',skipIntro:'इंट्रो छोड़ें',owner:'मालिक मोड',empty:'पहले छोटा-सा विवरण लिखें।',
saved:'ड्राफ्ट इसी डिवाइस पर सुरक्षित हो गया।',saveError:'इस browser में ड्राफ्ट सुरक्षित नहीं हो पाया। दोबारा कोशिश करें।',
cleared:'ड्राफ्ट साफ़ कर दिया गया।',welcome:'आप हिंदी या English चुन सकते हैं। आप इसे कभी भी बदल सकते हैं।',savePlan:'योजना में बदलाव सुरक्षित करें',specSaved:'योजना में किए गए बदलाव इसी डिवाइस पर सुरक्षित हो गए।',conversionBlocked:'Content बदलने के लिए verified provider चाहिए; यह सुविधा अभी उपलब्ध नहीं है।',voiceUnavailable:'इस build में डिवाइस पर चलने वाली voice typing उपलब्ध नहीं है। कृपया अपना विचार टाइप करें।',approveSpec:'इस योजना को मंज़ूरी दें',reapproveSpec:'बदली योजना को फिर मंज़ूरी दें',approvedLabel:'इस डिवाइस पर मंज़ूर',notApproved:'अभी मंज़ूरी नहीं दी गई।',needsApproval:'बदलाव किए गए हैं · फिर मंज़ूरी ज़रूरी है।',diffTitle:'शुरुआती योजना से बदलाव',specApproved:'योजना मंज़ूर होकर इसी डिवाइस पर सुरक्षित हो गई।',approvalUnavailable:'इस browser में सुरक्षित approval verification उपलब्ध नहीं है।',buildLocal:'स्थानीय preview बनाएँ',pauseBuild:'preview रोकें',resumeBuild:'preview फिर शुरू करें',rebuildPreview:'preview दोबारा बनाएँ',buildNeedsApproval:'बनाने से पहले spec को मंज़ूरी दें।',buildReady:'स्थानीय preview तैयार है। कोई AI provider इस्तेमाल नहीं होगा।',buildStarting:'स्थानीय preview शुरू हो रहा है…',buildProgress:'preview का chunk {done} / {total} बनाया जा रहा है…',buildPaused:'निर्माण रुका है। इसी डिवाइस पर फिर शुरू कर सकते हैं।',buildDone:'स्थानीय preview तैयार है। कोई AI provider इस्तेमाल नहीं हुआ।',buildError:'स्थानीय preview पूरा नहीं हो पाया।',previewTitle:'वेबसाइट का स्थानीय preview',downloadZip:'ZIP डाउनलोड करें',zipReady:'ZIP पैकेज डाउनलोड हो गया। इसमें static preview और हिंदी-अंग्रेज़ी guide है।',zipError:'ZIP नहीं बन पाया। Preview दोबारा बनाएँ और कोशिश करें।'
}
};
let lang='en', replyLang='en', replyLangExplicit=false, contentLang='en', contentLangTouched=false, dbPromise=null, introShown=false, currentSpec=null, originalSpec=null, currentApproval=null, currentFieldValues={}, originalFieldValues={}, currentBuild=null, buildRunning=false, buildPauseRequested=false;
function readInitialLanguage(){
 try{const v=localStorage.getItem('str_ui_lang');if(v==='hi'||v==='en')return v;}catch(e){}
 try{const n=JSON.parse(localStorage.getItem('nova')||'{}');return n.uiLang==='hi'?'hi':'en';}catch(e){return 'en';}
}
function setLanguage(next,persist){
 const previous=lang;
 lang=next==='hi'?'hi':'en';
 let savedReply='';try{savedReply=localStorage.getItem('str_reply_lang')||'';}catch(e){}if(!replyLangExplicit)replyLang=lang;
 const reply=$('strReplyLang'),content=$('strContentLang');
 if(reply)reply.value=replyLang;
 if(content)content.value=contentLang;
 root.querySelectorAll('[data-str]').forEach(el=>{const k=el.getAttribute('data-str');if(dict[lang][k]!=null)el.textContent=dict[lang][k];});
 root.querySelectorAll('[data-str-placeholder]').forEach(el=>{const k=el.getAttribute('data-str-placeholder');if(dict[lang][k])el.placeholder=dict[lang][k];});
 $('strLangHi').setAttribute('aria-pressed',String(lang==='hi'));
 $('strLangEn').setAttribute('aria-pressed',String(lang==='en'));
 $('strQuota').textContent=dict[lang].owner;
 if(persist){try{localStorage.setItem('str_ui_lang',lang);if(!localStorage.getItem('str_reply_lang'))localStorage.setItem('str_reply_lang',replyLang);}catch(e){}}
 if(currentSpec&&!$('strSpecPanel').hidden)renderSpec({spec:currentSpec,notice:{hi:dict.hi.specReady,en:dict.en.specReady}});
}
function openDb(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return;}
  const req=indexedDB.open('nova-str-local',1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('drafts'))db.createObjectStore('drafts',{keyPath:'id'});};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('IndexedDB open failed'));
 });
 return dbPromise;
}
async function putDraft(record){
 const db=await openDb();
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(record);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Draft save failed'));tx.onabort=()=>reject(tx.error||new Error('Draft save aborted'));
 });
}
async function pruneExpiredDrafts(){
 const db=await openDb();
 const all=await new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readonly'),req=tx.objectStore('drafts').getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error||new Error('Draft retention check failed'));});
 const cutoff=Date.now()-7*24*60*60*1000;
 const expired=all.filter(d=>Number(d.updatedAt||d.createdAt||0)<cutoff);
 if(!expired.length)return;
 await new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite'),store=tx.objectStore('drafts');expired.forEach(d=>store.delete(d.id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Draft retention cleanup failed'));});
}
async function getLatestDraft(){
 await pruneExpiredDrafts();
 const db=await openDb();
 return await new Promise((resolve,reject)=>{
  const tx=db.transaction('drafts','readonly'),req=tx.objectStore('drafts').getAll();
  req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>b.updatedAt-a.updatedAt)[0]||null);
  req.onerror=()=>reject(req.error||new Error('Draft read failed'));
 });
}
async function clearDrafts(){
 const db=await openDb();
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').clear();
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Draft clear failed'));
 });
}
function status(message){$('strStatus').textContent=message;}

function appendText(parent,tag,text,className){
 const node=document.createElement(tag);if(className)node.className=className;node.textContent=String(text==null?'':text);parent.appendChild(node);return node;
}
function clientId(){
 try{
  let id=localStorage.getItem('str_client_id');
  if(!/^[A-Za-z0-9_-]{16,64}$/.test(id||'')){
   id=window.crypto&&typeof crypto.randomUUID==='function'?crypto.randomUUID().replace(/-/g,''):'str'+Date.now().toString(36)+Math.random().toString(36).slice(2,18);
   localStorage.setItem('str_client_id',id);
  }
  return id;
 }catch(e){return 'str'+Date.now().toString(36)+Math.random().toString(36).slice(2,18);}
}
async function persistSpecEdits(options={}){
 try{
  const previous=await getLatestDraft(),now=Date.now(),prompt=$('strPrompt').value.trim();
  if(!prompt||!currentSpec)return false;
  await putDraft({
   id:previous&&previous.id||('str-'+now+'-'+Math.random().toString(36).slice(2,8)),
   prompt,spec:currentSpec,originalSpec:originalSpec||currentSpec,
   fieldValues:{...currentFieldValues},originalFieldValues:{...originalFieldValues},
   approval:currentApproval,build:currentBuild||null,status:'spec_ready',
   createdAt:previous&&previous.createdAt||now,updatedAt:now,
   uiLang:lang,contentLang,replyLang,specVersion:1
  });
  renderApprovalPanel();
  if(!options.quiet)status(dict[lang].specSaved);
  return true;
 }catch(e){if(!options.quiet)status(dict[lang].saveError);return false;}
}
function flattenEditableSpec(spec,fieldValues){
 const out={};
 if(!spec)return out;
 out['Project name']=spec.name||'';
 (spec.pages||[]).forEach(page=>{
  Object.entries(page.title||{}).forEach(([locale,value])=>{out['Page '+page.id+' title · '+locale]=value;});
  (page.sections||[]).forEach(section=>{
   Object.entries(section.content&&section.content.heading||{}).forEach(([locale,value])=>{out['Section '+section.id+' heading · '+locale]=value;});
   Object.entries(section.content&&section.content.body||{}).forEach(([locale,value])=>{out['Section '+section.id+' description · '+locale]=value;});
  });
 });
 (spec.assumed||[]).forEach(item=>{out['Assumption · '+item.field]=item.value;});
 Object.entries(fieldValues||{}).forEach(([key,value])=>{out['Missing detail · '+key]=value;});
 return out;
}
function buildSpecDiff(){
 const before=flattenEditableSpec(originalSpec||currentSpec,originalFieldValues);
 const after=flattenEditableSpec(currentSpec,currentFieldValues);
 return [...new Set([...Object.keys(before),...Object.keys(after)])].sort()
  .filter(key=>String(before[key]??'')!==String(after[key]??''))
  .map(key=>({key,before:String(before[key]??''),after:String(after[key]??'')}));
}
function renderApprovalPanel(){
 const list=$('strSpecDiffList'),panel=$('strSpecDiff'),state=$('strApprovalState'),button=$('strApproveSpec');
 if(!list||!panel||!state||!button)return;
 const changes=buildSpecDiff();
 list.replaceChildren();
 changes.forEach(change=>{
  const item=document.createElement('li');
  item.textContent=change.key+': '+(change.before||'—')+' → '+(change.after||'—');
  list.appendChild(item);
 });
 panel.hidden=!changes.length;
 state.textContent=currentApproval?dict[lang].approvedLabel:changes.length?dict[lang].needsApproval:dict[lang].notApproved;
 button.disabled=!currentSpec;
 button.textContent=currentApproval?dict[lang].reapproveSpec:dict[lang].approveSpec;
 renderBuildPanel();
}
function markSpecChanged(){
 if(currentApproval)currentApproval=null;
 currentBuild=null;
 renderApprovalPanel();
 renderBuildPanel();
}
function canonicalize(value){
 if(Array.isArray(value))return value.map(canonicalize);
 if(value&&typeof value==='object'){
  const out={};Object.keys(value).sort().forEach(key=>{out[key]=canonicalize(value[key]);});return out;
 }
 return value;
}
async function computeSpecFingerprint(){
 if(!currentSpec||!window.crypto||!crypto.subtle)throw new Error('Secure hash unavailable');
 const payload=canonicalize({spec:currentSpec,fieldValues:currentFieldValues});
 const bytes=new TextEncoder().encode(JSON.stringify(payload));
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
}
async function approveSpec(){
 const button=$('strApproveSpec');
 if(!currentSpec)return;
 button.disabled=true;
 try{
  const saved=await persistSpecEdits({quiet:true});
  if(!saved)throw new Error('Could not save the spec before approval');
  const hash=await computeSpecFingerprint();
  currentApproval={algorithm:'SHA-256',hash,approvedAt:Date.now(),version:1};
  const approvedSaved=await persistSpecEdits({quiet:true});
  if(!approvedSaved){currentApproval=null;throw new Error('Could not save approval record');}
  renderApprovalPanel();
  status(dict[lang].specApproved);
 }catch(e){
  currentApproval=null;renderApprovalPanel();status(dict[lang].approvalUnavailable);
 }finally{button.disabled=false;}
}
function escapePreviewText(value){
 return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function localizedCopy(value,locale){
 if(!value||typeof value!=='object')return '';
 if(locale==='hinglish')return value.hinglish||value.en||value.hi||'';
 return value[locale]||value.en||value.hi||'';
}
function buildLocalChunks(spec,locale){
 const titleFallback=spec.name||'Website preview';
 const primary=/^#[0-9a-f]{6}$/i.test(spec.colors&&spec.colors.primary||'')?spec.colors.primary:'#1E1B4B';
 const accent=/^#[0-9a-f]{6}$/i.test(spec.colors&&spec.colors.accent||'')?spec.colors.accent:'#F59E0B';
 const lang=locale==='hi'?'hi':'en';
 const chunks=[];
 chunks.push('<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'none\'; connect-src \'none\'; img-src data:; font-src \'none\'; style-src \'unsafe-inline\'; form-action \'none\'; base-uri \'none\'; object-src \'none\'"><title>'+escapePreviewText(titleFallback)+'</title><style>:root{color-scheme:light;--primary:'+primary+';--accent:'+accent+'}*{box-sizing:border-box}body{margin:0;background:#f8fafc;color:#0f172a;font:16px/1.65 system-ui,-apple-system,"Segoe UI",sans-serif}main{width:min(100% - 32px,920px);margin:0 auto;padding:28px 0 64px}.hero{padding:40px 28px;border-radius:20px;background:var(--primary);color:#fff}.eyebrow{color:#fde68a;font-size:12px;letter-spacing:.12em;text-transform:uppercase}.hero h1{font-size:clamp(30px,6vw,48px);line-height:1.1;margin:12px 0}.hero p{max-width:65ch}.section{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-top:18px;box-shadow:0 8px 24px rgba(15,23,42,.05)}.section h2{margin:0 0 8px;color:var(--primary)}.section p{white-space:pre-wrap}.section li{margin:6px 0}.contact-list{padding-left:20px}.accent{display:inline-block;margin-top:10px;padding:8px 14px;border-radius:999px;background:var(--accent);color:#1e1b4b;font-weight:700}.preview-footer{padding:24px;text-align:center;color:#64748b;font-size:12px}@media(max-width:560px){main{width:min(100% - 20px,920px)}.hero,.section{padding:22px}}</style></head><body><main>');
 (spec.pages||[]).forEach(page=>{
  const pageTitle=localizedCopy(page.title,locale)||titleFallback;
  const description=localizedCopy(spec.seo&&spec.seo.desc,locale);
  chunks.push('<article><header class="hero"><div class="eyebrow">'+escapePreviewText(spec.kind||'Website')+'</div><h1>'+escapePreviewText(pageTitle)+'</h1>'+(description?'<p>'+escapePreviewText(description)+'</p>':'')+'<span class="accent">Welcome</span></header>');
  (page.sections||[]).forEach(section=>{
   const heading=localizedCopy(section.content&&section.content.heading,locale)||'Details';
   const body=localizedCopy(section.content&&section.content.body,locale);
   let extra='';
   if(section.type==='features'&&Array.isArray(spec.features)&&spec.features.length){
    extra='<ul>'+spec.features.slice(0,20).map(item=>'<li>'+escapePreviewText(item)+'</li>').join('')+'</ul>';
   }
   if(section.type==='contact'&&spec.contact){
    const entries=Object.entries(spec.contact).filter(([,value])=>typeof value==='string'&&value.trim());
    if(entries.length)extra+='<ul class="contact-list">'+entries.map(([key,value])=>'<li><strong>'+escapePreviewText(key)+':</strong> '+escapePreviewText(value)+'</li>').join('')+'</ul>';
   }
   const safeId=/^[A-Za-z0-9_-]{1,80}$/.test(section.id||'')?section.id:'section';
   chunks.push('<section class="section" id="'+safeId+'"><h2>'+escapePreviewText(heading)+'</h2>'+(body?'<p>'+escapePreviewText(body)+'</p>':'')+extra+'</section>');
  });
  chunks.push('</article>');
 });
 chunks.push('</main><footer class="preview-footer">Local preview · Built inside Nova STR · No AI provider used</footer></body></html>');
 return chunks;
}
function renderBuildPanel(){
 const button=$('strBuildLocal'),label=$('strBuildStatus'),progress=$('strBuildProgress'),frame=$('strPreviewFrame');
 if(!button||!label||!progress||!frame)return;
 const done=currentBuild&&Number.isSafeInteger(currentBuild.doneChunks)?currentBuild.doneChunks:0;
 const total=currentBuild&&Number.isSafeInteger(currentBuild.totalChunks)?currentBuild.totalChunks:0;
 progress.textContent=total?done+'/'+total:'0/0';
 if(buildRunning)button.textContent=dict[lang].pauseBuild;
 else if(currentBuild&&['paused','building'].includes(currentBuild.status))button.textContent=dict[lang].resumeBuild;
 else if(currentBuild&&currentBuild.status==='complete')button.textContent=dict[lang].rebuildPreview;
 else button.textContent=dict[lang].buildLocal;
 button.disabled=!currentSpec||!currentApproval||buildRunning&&buildPauseRequested;
 if(!currentSpec||!currentApproval)label.textContent=dict[lang].buildNeedsApproval;
 else if(currentBuild&&currentBuild.status==='complete')label.textContent=dict[lang].buildDone;
 else if(currentBuild&&currentBuild.status==='paused')label.textContent=dict[lang].buildPaused;
 else if(currentBuild&&currentBuild.status==='building')label.textContent=dict[lang].buildStarting;
 else label.textContent=dict[lang].buildReady;
 const ready=!!(currentBuild&&currentBuild.status==='complete'&&typeof currentBuild.html==='string');
 frame.hidden=!ready;
 if(ready)frame.srcdoc=currentBuild.html;else if(frame.hasAttribute('srcdoc'))frame.removeAttribute('srcdoc');
}
async function persistBuildProgress(){
 const latest=await getLatestDraft();
 if(!latest||!currentBuild)return false;
 await putDraft({...latest,build:currentBuild,updatedAt:Date.now()});
 return true;
}
async function startLocalBuild(){
 if(buildRunning){buildPauseRequested=true;return;}
 if(!currentSpec||!currentApproval){status(dict[lang].buildNeedsApproval);renderBuildPanel();return;}
 buildRunning=true;buildPauseRequested=false;renderBuildPanel();
 try{
  const approvedHash=await computeSpecFingerprint();
  if(approvedHash!==currentApproval.hash){
   currentApproval=null;currentBuild=null;await persistSpecEdits({quiet:true});
   renderApprovalPanel();renderBuildPanel();status(dict[lang].needsApproval);return;
  }
  const chunks=buildLocalChunks(currentSpec,contentLang);
  if(currentBuild&&currentBuild.approvedHash===approvedHash&&currentBuild.status!=='complete'&&Array.isArray(currentBuild.htmlParts)&&currentBuild.totalChunks===chunks.length){
   currentBuild.status='building';
  }else{
   currentBuild={v:1,status:'building',approvedHash,totalChunks:chunks.length,doneChunks:0,htmlParts:[],html:'',createdAt:Date.now(),updatedAt:Date.now()};
  }
  await persistBuildProgress();
  for(let index=currentBuild.doneChunks;index<chunks.length;index++){
   if(buildPauseRequested){
    currentBuild.status='paused';currentBuild.updatedAt=Date.now();await persistBuildProgress();
    status(dict[lang].buildPaused);renderBuildPanel();return;
   }
   currentBuild.htmlParts[index]=chunks[index];
   currentBuild.doneChunks=index+1;
   currentBuild.updatedAt=Date.now();
   await persistBuildProgress();
   const progressText=dict[lang].buildProgress.replace('{done}',String(currentBuild.doneChunks)).replace('{total}',String(currentBuild.totalChunks));
   $('strBuildStatus').textContent=progressText;
   $('strBuildProgress').textContent=currentBuild.doneChunks+'/'+currentBuild.totalChunks;
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  if(buildPauseRequested){
   currentBuild.status='paused';currentBuild.updatedAt=Date.now();await persistBuildProgress();
   status(dict[lang].buildPaused);return;
  }
  currentBuild.html=currentBuild.htmlParts.join('');
  if(currentBuild.html.length>250000)throw new Error('Local preview output exceeded its safe size limit.');
  currentBuild.htmlParts=[];
  currentBuild.status='complete';currentBuild.updatedAt=Date.now();
  await persistBuildProgress();
  renderBuildPanel();status(dict[lang].buildDone);
 }catch(e){
  if(currentBuild){currentBuild.status='failed';currentBuild.updatedAt=Date.now();try{await persistBuildProgress();}catch(ignore){}}
  renderBuildPanel();status(dict[lang].buildError);
 }finally{
  buildRunning=false;buildPauseRequested=false;renderBuildPanel();
 }
}

function copyKey(){return contentLang==='hinglish'?'hinglish':contentLang;}
function editLabel(parent,text){
 const label=document.createElement('label');label.className='str-spec-copy-editor';
 appendText(label,'span',text);
 parent.appendChild(label);return label;
}
function commitCopy(copy,key,input,maxLength,required){
 const value=input.value.trim().slice(0,maxLength);
 if(!value&&required){input.value=copy[key]||'';return false;}
 if(value)copy[key]=value;else delete copy[key];
 return true;
}
function renderSpec(payload){
 currentSpec=payload.spec;
 const panel=$('strSpecPanel');panel.hidden=false;
 $('strSpecNotice').textContent=payload.notice&&payload.notice[lang]||dict[lang].specReady;
 const meta=$('strSpecMeta');meta.replaceChildren();
 const contentName=currentSpec.content_lang==='hi'?'हिंदी':currentSpec.content_lang==='hinglish'?'Hinglish':'English';
 [currentSpec.kind,contentName,currentSpec.pages.length+' page(s)'].forEach(v=>appendText(meta,'span',v,'str-spec-chip'));
 const nameLabel=document.createElement('label');nameLabel.className='str-spec-name-label';
 appendText(nameLabel,'span',lang==='hi'?'प्रोजेक्ट का नाम':'Project name');
 const nameInput=document.createElement('input');nameInput.id='strSpecName';nameInput.type='text';nameInput.maxLength=100;nameInput.value=currentSpec.name;nameInput.setAttribute('aria-label',lang==='hi'?'प्रोजेक्ट का नाम':'Project name');
 nameInput.addEventListener('change',async()=>{const value=nameInput.value.trim().slice(0,100);if(!value){nameInput.value=currentSpec.name;return;}currentSpec.name=value;currentSpec.seo.title.hi=value;currentSpec.seo.title.en=value;markSpecChanged();await persistSpecEdits();});
 nameLabel.appendChild(nameInput);meta.appendChild(nameLabel);
 const key=copyKey(), languageName=key==='hi'?'हिंदी':key==='hinglish'?'Hinglish':'English';
 const sections=$('strSpecSections');sections.replaceChildren();
 currentSpec.pages.forEach(page=>{
  const card=document.createElement('details');card.className='str-spec-page';card.open=true;
  card.setAttribute('data-str-page-id',page.id);
  const summary=document.createElement('summary');
  summary.textContent=(page.title&&(page.title[key]||page.title.en||page.title.hi))||'Page';
  card.appendChild(summary);
  const titleLabel=editLabel(card,(lang==='hi'?'पेज शीर्षक':'Page title')+' · '+languageName);
  const titleInput=document.createElement('input');titleInput.type='text';titleInput.maxLength=120;titleInput.value=page.title&&page.title[key]||'';titleInput.setAttribute('data-str-field','page-title');titleInput.setAttribute('aria-label',(lang==='hi'?'पेज शीर्षक':'Page title')+' '+page.id+' '+languageName);
  titleInput.addEventListener('change',()=>{if(commitCopy(page.title,key,titleInput,120,key!=='hinglish')){summary.textContent=page.title[key]||page.title.en||page.title.hi;markSpecChanged();}});
  titleLabel.appendChild(titleInput);
  const convert=document.createElement('button');convert.type='button';convert.disabled=true;convert.className='str-convert-disabled';convert.textContent=lang==='hi'?'भाषा बदलें':'Convert';convert.title=dict[lang].conversionBlocked;card.appendChild(convert);
  page.sections.forEach(section=>{
   const row=document.createElement('article');row.className='str-spec-section';row.setAttribute('data-str-section-id',section.id);
   const headingLabel=editLabel(row,(lang==='hi'?'सेक्शन शीर्षक':'Section heading')+' · '+languageName);
   const headingInput=document.createElement('input');headingInput.type='text';headingInput.maxLength=160;headingInput.value=section.content.heading[key]||'';headingInput.setAttribute('data-str-field','heading');headingInput.setAttribute('aria-label',(lang==='hi'?'सेक्शन शीर्षक':'Section heading')+' '+section.id+' '+languageName);
   headingInput.addEventListener('change',()=>{if(commitCopy(section.content.heading,key,headingInput,160,key!=='hinglish'))markSpecChanged();});
   headingLabel.appendChild(headingInput);
   const sectionConvert=document.createElement('button');sectionConvert.type='button';sectionConvert.disabled=true;sectionConvert.className='str-convert-disabled';sectionConvert.textContent=lang==='hi'?'भाषा बदलें':'Convert';sectionConvert.title=dict[lang].conversionBlocked;row.appendChild(sectionConvert);
   const bodyLabel=editLabel(row,(lang==='hi'?'विवरण':'Description')+' · '+languageName);
   const bodyInput=document.createElement('textarea');bodyInput.rows=3;bodyInput.maxLength=600;bodyInput.value=section.content.body[key]||'';bodyInput.setAttribute('data-str-field','body');bodyInput.setAttribute('aria-label',(lang==='hi'?'विवरण':'Description')+' '+section.id+' '+languageName);
   bodyInput.addEventListener('change',()=>{if(commitCopy(section.content.body,key,bodyInput,600,key!=='hinglish'))markSpecChanged();});
   bodyLabel.appendChild(bodyInput);
   const display=document.createElement('p');display.className='str-copy-preview';display.textContent=section.content.heading[key]||section.content.heading.en||section.content.heading.hi;
   row.appendChild(display);
   card.appendChild(row);
  });
  sections.appendChild(card);
 });
 const assumed=$('strAssumed');assumed.replaceChildren();
 currentSpec.assumed.forEach(item=>{
  const row=document.createElement('li');row.className='str-assumption-row';
  appendText(row,'span',item.field,'str-assumption-field');
  const input=document.createElement('input');input.type='text';input.maxLength=200;input.value=item.value;input.setAttribute('aria-label',(lang==='hi'?'मान्यता संपादित करें: ':'Edit assumption: ')+item.field);
  input.addEventListener('change',async()=>{item.value=input.value.trim().slice(0,200);markSpecChanged();await persistSpecEdits();});
  row.appendChild(input);
  appendText(row,'small',item.why&&item.why[lang]||'','str-assumption-why');
  assumed.appendChild(row);
 });
 const placeholders=$('strPlaceholders');placeholders.replaceChildren();
 currentSpec.placeholders.forEach(item=>{
  const row=document.createElement('li');row.className='str-placeholder-row';
  appendText(row,'label',item,'str-placeholder-label');
  const input=document.createElement('input');input.type='text';input.maxLength=300;input.placeholder=lang==='hi'?'यह जानकारी यहाँ भरें':'Enter this detail here';input.value=currentFieldValues[item]||'';input.setAttribute('aria-label',item);
  input.addEventListener('change',async()=>{const value=input.value.trim().slice(0,300);if(value)currentFieldValues[item]=value;else delete currentFieldValues[item];markSpecChanged();await persistSpecEdits();});
  row.appendChild(input);placeholders.appendChild(row);
 });
 renderApprovalPanel();
}
async function createSpec(){
 const prompt=$('strPrompt').value.trim();
 if(!prompt){status(dict[lang].empty);$('strPrompt').focus();return;}
 const button=$('strCreateSpec');button.disabled=true;button.textContent=dict[lang].analyzing;status('');
 try{
  const response=await fetch('/api/str/spec',{
   method:'POST',credentials:'same-origin',
   headers:{'content-type':'application/json','x-str-client-id':clientId()},
   body:JSON.stringify({prompt,uiLang:lang,contentLang})
  });
  let data={};try{data=await response.json();}catch(e){}
  if(!response.ok){
   if(response.status===422&&data.message)status(data.message[lang]||dict[lang].unsafeError);
   else if(response.status===429)status(lang==='hi'?'STR की अनुरोध सीमा पूरी हुई। कुछ देर बाद फिर कोशिश करें।':'STR request limit reached. Please retry shortly.');
   else status(dict[lang].specError);
   return;
  }
  if(!data.spec||data.aiGenerated!==false||data.mode!=='local_rules_no_provider')throw new Error('Unexpected local spec response');
  currentFieldValues={};originalFieldValues={};originalSpec=JSON.parse(JSON.stringify(data.spec));currentApproval=null;
  renderSpec(data);
  const previous=await getLatestDraft(),now=Date.now();
  await putDraft({id:previous&&previous.id||('str-'+now+'-'+Math.random().toString(36).slice(2,8)),prompt,spec:currentSpec,originalSpec:originalSpec||currentSpec,status:'spec_ready',createdAt:previous&&previous.createdAt||now,updatedAt:now,uiLang:lang,contentLang,replyLang,specVersion:1,fieldValues:{...currentFieldValues},originalFieldValues:{...originalFieldValues},approval:currentApproval,build:null});
  status(dict[lang].specReady);
 }catch(e){status(dict[lang].specError);}
 finally{button.disabled=false;button.textContent=dict[lang].createSpec;}
}

async function saveDraft(){
 const prompt=$('strPrompt').value.trim();
 if(!prompt){status(dict[lang].empty);$('strPrompt').focus();return;}
 try{
  const previous=await getLatestDraft();
  const now=Date.now();
  await putDraft({id:previous&&previous.id||('str-'+now+'-'+Math.random().toString(36).slice(2,8)),prompt,status:currentSpec?'spec_ready':'draft',createdAt:previous&&previous.createdAt||now,updatedAt:now,uiLang:lang,contentLang,replyLang,specVersion:1,spec:currentSpec||undefined,originalSpec:originalSpec||undefined,fieldValues:{...currentFieldValues},originalFieldValues:{...originalFieldValues},approval:currentApproval,build:currentBuild||null});
  status(dict[lang].saved);
 }catch(e){status(dict[lang].saveError);}
}
async function restoreDraft(){
 try{
  const d=await getLatestDraft();
  if(d&&d.prompt){
   $('strPrompt').value=d.prompt;
   currentFieldValues=d.fieldValues&&typeof d.fieldValues==='object'&&!Array.isArray(d.fieldValues)?{...d.fieldValues}:{};
   originalFieldValues=d.originalFieldValues&&typeof d.originalFieldValues==='object'&&!Array.isArray(d.originalFieldValues)?{...d.originalFieldValues}:{};
   originalSpec=d.originalSpec&&d.originalSpec.v===1?d.originalSpec:(d.spec&&d.spec.v===1?JSON.parse(JSON.stringify(d.spec)):null);
   currentApproval=d.approval&&d.approval.algorithm==='SHA-256'&&/^[a-f0-9]{64}$/.test(d.approval.hash||'')&&Number.isFinite(d.approval.approvedAt)?d.approval:null;
   currentBuild=d.build&&d.build.v===1&&Array.isArray(d.build.htmlParts)&&Number.isSafeInteger(d.build.doneChunks)&&Number.isSafeInteger(d.build.totalChunks)?d.build:null;
   if(d.contentLang==='hi'||d.contentLang==='en'||d.contentLang==='hinglish'){contentLang=d.contentLang;contentLangTouched=true;$('strContentLang').value=contentLang;}
   if(d.replyLang==='hi'||d.replyLang==='en'){replyLang=d.replyLang;$('strReplyLang').value=replyLang;}
   if(d.spec&&d.spec.v===1){try{currentSpec=d.spec;if(currentApproval){try{if(await computeSpecFingerprint()!==currentApproval.hash)currentApproval=null;}catch(e){currentApproval=null;}}if(!currentApproval||!currentBuild||currentBuild.approvedHash!==currentApproval.hash)currentBuild=null;renderSpec({spec:d.spec,notice:{hi:dict.hi.specReady,en:dict.en.specReady}});}catch(e){currentSpec=null;currentApproval=null;currentBuild=null;}}
  }
 }catch(e){}
}
function playIntro(){
 if(introShown)return;introShown=true;
 let seen=false;try{seen=sessionStorage.getItem('str_intro_seen')==='1';}catch(e){}
 if(seen||window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const intro=$('strIntro');intro.hidden=false;
 const finish=()=>{if(intro.classList.contains('str-done'))return;intro.classList.add('str-done');setTimeout(()=>{intro.hidden=true;intro.classList.remove('str-done');},220);try{sessionStorage.setItem('str_intro_seen','1');}catch(e){}};
 const skip=$('strSkipIntro');skip.disabled=true;setTimeout(()=>{skip.disabled=false;},300);skip.addEventListener('click',finish,{once:true});
 setTimeout(finish,2400);
}
function inferContentLanguage(value){return /[\u0900-\u097f]/.test(value)?'hi':'en';}
function open(){
 const side=document.getElementById('side');if(side)side.classList.remove('open');
 root.hidden=false;document.body.classList.add('str-open');status('');
 restoreDraft();playIntro();
}
function close(){
 root.hidden=true;document.body.classList.remove('str-open');
 try{$('strIntro').hidden=true;}catch(e){}
}
$('strBack').addEventListener('click',close);
$('strLangHi').addEventListener('click',()=>setLanguage('hi',true));
$('strReplyLang').addEventListener('change',event=>{replyLang=event.target.value==='hi'?'hi':'en';replyLangExplicit=true;try{localStorage.setItem('str_reply_lang',replyLang);}catch(e){}});
$('strContentLang').addEventListener('change',event=>{contentLang=event.target.value==='hinglish'?'hinglish':event.target.value==='hi'?'hi':'en';contentLangTouched=true;try{localStorage.setItem('str_content_lang',contentLang);}catch(e){}if(currentSpec)renderSpec({spec:currentSpec,notice:{hi:dict.hi.specReady,en:dict.en.specReady}});});
$('strPrompt').addEventListener('input',event=>{if(contentLangTouched)return;contentLang=inferContentLanguage(event.target.value);$('strContentLang').value=contentLang;});
$('strLangEn').addEventListener('click',()=>setLanguage('en',true));
$('strSaveDraft').addEventListener('click',saveDraft);
$('strSavePlan').addEventListener('click',persistSpecEdits);
$('strApproveSpec').addEventListener('click',approveSpec);
$('strBuildLocal').addEventListener('click',startLocalBuild);
$('strCreateSpec').addEventListener('click',createSpec);
$('strClearDraft').addEventListener('click',async()=>{
 $('strPrompt').value='';currentSpec=null;originalSpec=null;currentApproval=null;currentFieldValues={};originalFieldValues={};currentBuild=null;$('strSpecPanel').hidden=true;
 try{await clearDrafts();status(dict[lang].cleared);}catch(e){status(dict[lang].saveError);}
});
window.addEventListener('nova:state-saved',()=>{
 if(!root.hidden)return;
 try{const n=JSON.parse(localStorage.getItem('nova')||'{}');if(!localStorage.getItem('str_ui_lang'))setLanguage(n.uiLang==='hi'?'hi':'en',false);}catch(e){}
});
setLanguage(readInitialLanguage(),false);
try{
 const savedReply=localStorage.getItem('str_reply_lang');
 const savedContent=localStorage.getItem('str_content_lang');
 replyLang=savedReply==='hi'?'hi':savedReply==='en'?'en':lang;replyLangExplicit=!!savedReply;
 contentLang=savedContent==='hinglish'?'hinglish':savedContent==='hi'?'hi':savedContent==='en'?'en':'en';
 contentLangTouched=!!savedContent;
 $('strReplyLang').value=replyLang;$('strContentLang').value=contentLang;
}catch(e){replyLang=lang;}
restoreDraft();
window.NovaSTR=Object.freeze({open,close,getLanguage:()=>lang,createSpec});
})();
// STR navigation stays isolated from Nova chat state.
document.addEventListener('DOMContentLoaded',function(){const b=document.getElementById('nStr');if(b)b.addEventListener('click',function(){if(window.NovaSTR)window.NovaSTR.open();});});
