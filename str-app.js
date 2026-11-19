(function(){
'use strict';
const root=document.getElementById('strApp');
if(!root||window.NovaSTR)return;
const $=id=>document.getElementById(id);
const dict={
en:{
back:'Nova',replyLabel:'Reply language',contentLabel:'Website content',headline:'A clear idea. A complete build.',
subhead:'Describe the app or website you want. STR will turn your idea into a structured plan, a preview and a downloadable package.',
promptLabel:'What would you like to build?',promptPlaceholder:'Describe your shop website…',
saveDraft:'Save draft',clear:'Clear',localNote:'Your draft is saved only on this device. It is not sent to an AI provider in this phase.',
stageSpec:'01 · Spec',stageSpecDesc:'Understand the idea and list assumptions.',
stageBuild:'02 · Build',stageBuildDesc:'Generate the site in small, resumable sections.',
stageCheck:'03 · Quality',stageCheckDesc:'Check safety, mobile layout and completeness.',
footer:'STR is in setup. Build generation will be enabled after the secure pipeline is ready.',
tagline:'Short prompt. Complete app.',skipIntro:'Skip intro',owner:'Owner mode',empty:'Write a short description first.',
saved:'Draft saved on this device.',saveError:'This browser could not save the draft. Please try again.',
cleared:'Draft cleared.',welcome:'You can choose Hindi or English. You can change this any time.'
},
hi:{
back:'Nova',replyLabel:'उत्तर भाषा',contentLabel:'वेबसाइट की भाषा',headline:'एक स्पष्ट विचार। पूरा build।',
subhead:'जिस app या website की जरूरत है, उसका वर्णन करें। STR उसे योजना, preview और download package में बदलेगा।',
promptLabel:'आप क्या बनाना चाहते हैं?',promptPlaceholder:'मेरी दुकान की वेबसाइट बनाओ…',
saveDraft:'ड्राफ्ट सुरक्षित करें',clear:'साफ़ करें',localNote:'आपका ड्राफ्ट केवल इसी डिवाइस पर सुरक्षित है। इस चरण में यह किसी AI provider को नहीं भेजा जाता।',
stageSpec:'01 · योजना',stageSpecDesc:'विचार समझें और मान्यताओं की सूची बनाएँ।',
stageBuild:'02 · निर्माण',stageBuildDesc:'वेबसाइट को छोटे, दोबारा शुरू हो सकने वाले हिस्सों में बनाएँ।',
stageCheck:'03 · गुणवत्ता',stageCheckDesc:'सुरक्षा, मोबाइल layout और सभी जरूरी हिस्सों की जाँच करें।',
footer:'STR अभी तैयार हो रहा है। सुरक्षित build pipeline तैयार होने के बाद generation चालू होगी।',
tagline:'छोटा सा प्रॉम्प्ट, पूरा ऐप।',skipIntro:'इंट्रो छोड़ें',owner:'मालिक मोड',empty:'पहले छोटा-सा विवरण लिखें।',
saved:'ड्राफ्ट इसी डिवाइस पर सुरक्षित हो गया।',saveError:'इस browser में ड्राफ्ट सुरक्षित नहीं हो पाया। दोबारा कोशिश करें।',
cleared:'ड्राफ्ट साफ़ कर दिया गया।',welcome:'आप हिंदी या English चुन सकते हैं। आप इसे कभी भी बदल सकते हैं।'
}
};
let lang='en', replyLang='en', contentLang='en', contentLangTouched=false, dbPromise=null, introShown=false;
function readInitialLanguage(){
 try{const v=localStorage.getItem('str_ui_lang');if(v==='hi'||v==='en')return v;}catch(e){}
 try{const n=JSON.parse(localStorage.getItem('nova')||'{}');return n.uiLang==='hi'?'hi':'en';}catch(e){return 'en';}
}
function setLanguage(next,persist){
 const previous=lang;
 lang=next==='hi'?'hi':'en';
 let savedReply='';try{savedReply=localStorage.getItem('str_reply_lang')||'';}catch(e){}if(!savedReply||replyLang===previous)replyLang=lang;
 const reply=$('strReplyLang'),content=$('strContentLang');
 if(reply)reply.value=replyLang;
 if(content)content.value=contentLang;
 root.querySelectorAll('[data-str]').forEach(el=>{const k=el.getAttribute('data-str');if(dict[lang][k]!=null)el.textContent=dict[lang][k];});
 root.querySelectorAll('[data-str-placeholder]').forEach(el=>{const k=el.getAttribute('data-str-placeholder');if(dict[lang][k])el.placeholder=dict[lang][k];});
 $('strLangHi').setAttribute('aria-pressed',String(lang==='hi'));
 $('strLangEn').setAttribute('aria-pressed',String(lang==='en'));
 $('strQuota').textContent=dict[lang].owner;
 if(persist){try{localStorage.setItem('str_ui_lang',lang);if(!localStorage.getItem('str_reply_lang'))localStorage.setItem('str_reply_lang',replyLang);}catch(e){}}
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
async function saveDraft(){
 const prompt=$('strPrompt').value.trim();
 if(!prompt){status(dict[lang].empty);$('strPrompt').focus();return;}
 try{
  const previous=await getLatestDraft();
  const now=Date.now();
  await putDraft({id:previous&&previous.id||('str-'+now+'-'+Math.random().toString(36).slice(2,8)),prompt,status:'draft',createdAt:previous&&previous.createdAt||now,updatedAt:now,uiLang:lang,contentLang,replyLang,specVersion:1});
  status(dict[lang].saved);
 }catch(e){status(dict[lang].saveError);}
}
async function restoreDraft(){
 try{
  const d=await getLatestDraft();
  if(d&&d.prompt){
   $('strPrompt').value=d.prompt;
   if(d.contentLang==='hi'||d.contentLang==='en'||d.contentLang==='hinglish'){contentLang=d.contentLang;contentLangTouched=true;$('strContentLang').value=contentLang;}
   if(d.replyLang==='hi'||d.replyLang==='en'){replyLang=d.replyLang;$('strReplyLang').value=replyLang;}
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
function inferContentLanguage(value){return /[\\u0900-\\u097f]/.test(value)?'hi':'en';}
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
$('strReplyLang').addEventListener('change',event=>{replyLang=event.target.value==='hi'?'hi':'en';try{localStorage.setItem('str_reply_lang',replyLang);}catch(e){}});
$('strContentLang').addEventListener('change',event=>{contentLang=event.target.value==='hinglish'?'hinglish':event.target.value==='hi'?'hi':'en';contentLangTouched=true;try{localStorage.setItem('str_content_lang',contentLang);}catch(e){}});
$('strPrompt').addEventListener('input',event=>{if(contentLangTouched)return;contentLang=inferContentLanguage(event.target.value);$('strContentLang').value=contentLang;});
$('strLangEn').addEventListener('click',()=>setLanguage('en',true));
$('strSaveDraft').addEventListener('click',saveDraft);
$('strClearDraft').addEventListener('click',async()=>{
 $('strPrompt').value='';
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
 replyLang=savedReply==='hi'?'hi':savedReply==='en'?'en':lang;
 contentLang=savedContent==='hinglish'?'hinglish':savedContent==='hi'?'hi':savedContent==='en'?'en':'en';
 contentLangTouched=!!savedContent;
 $('strReplyLang').value=replyLang;$('strContentLang').value=contentLang;
}catch(e){replyLang=lang;}
restoreDraft();
window.NovaSTR=Object.freeze({open,close,getLanguage:()=>lang});
})();
// STR navigation stays isolated from Nova chat state.
document.addEventListener('DOMContentLoaded',function(){const b=document.getElementById('nStr');if(b)b.addEventListener('click',function(){if(window.NovaSTR)window.NovaSTR.open();});});
