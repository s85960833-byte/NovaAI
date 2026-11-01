(function(){
'use strict';
const REG=window.NovaModeRegistry;if(!REG)return;
const STORE='nova_modes_v1',CACHE='nova_mode_cache_v1',API='/api';
const $=s=>document.querySelector(s);
let active=null,activeGroup=null,upload=null,scheme=null,recognition=null,offline=false;
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(e){return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const data=()=>read(STORE,{version:1,histories:{},lastMode:'general'});
const saveData=x=>write(STORE,x);
const lowData=()=>data().lowData!==false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const language=()=>{const selected=document.querySelector('#lang')?.value;if(selected==='English'||selected==='Hindi')return selected;try{const saved=JSON.parse(localStorage.getItem('nova')||'{}').rl;if(saved==='Hindi'||saved==='English')return saved}catch(e){}return 'English'};
const isHi=()=>language()==='Hindi';
const tr=(en,hi)=>isHi()?hi:en;
function syncStaticLabels(){const back=$('#nmBack'),close=$('#nmClose'),title=$('#nmTitle'),file=$('#nmFile'),mic=$('#nmMic'),send=$('#nmSend');if(back)back.textContent='←';if(close)close.textContent=tr('Close','बंद करें');if(title&&!active)title.textContent=tr('Nova AI · Modes','Nova AI · मोड्स');if(file)file.textContent='📎 '+tr('Attach file/photo','फ़ाइल/फोटो जोड़ें');if(mic)mic.textContent='🎙 '+tr('Speak','बोलें');if(send)send.textContent=tr('Send','भेजें');if(input)input.placeholder=active==='document'?tr('Upload a bill, notice, or form, or type a question…','बिल, नोटिस या फॉर्म अपलोड करें, या सवाल लिखें…'):active==='photo'?tr('Choose a photo of the question or type it…','सवाल की फोटो चुनें या सवाल लिखें…'):tr('Type your question…','अपना सवाल लिखें…')}
const mode=id=>{const m=REG.modes.find(x=>x.id===id)||REG.modes[0];return {...m,name:isHi()?(m.nameHi||m.name):m.name,desc:isHi()?(m.descHi||m.desc):m.desc,prompt:isHi()?(m.promptHi||m.prompt):m.prompt};};
const history=id=>{const d=data();return d.histories[id]||(d.histories[id]=[])};
const css=`
#novaModes{position:fixed;inset:0;z-index:1000;background:var(--bg,#120d1b);color:var(--fg,#f3ecf8);display:none;flex-direction:column;font:16px/1.5 system-ui,sans-serif}
#novaModes *{box-sizing:border-box}#novaModes.open{display:flex}
.nmhead{display:flex;align-items:center;gap:10px;padding:12px;border-bottom:1px solid var(--bd,#33264a)}.nmhead strong{flex:1}.nmhead button,.nmbar button,.nmmode{border:1px solid var(--bd,#33264a);border-radius:12px;background:var(--card,#221832);color:inherit;padding:9px}
.nmcontent{overflow:auto;flex:1;padding:14px;max-width:900px;width:100%;margin:auto}.nmgroup{margin:12px 0 22px}.nmgroup h3{font-size:15px;color:var(--mut,#a899bb)}.nmcards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:9px}.nmmode{text-align:left;display:flex;flex-direction:column;gap:3px;min-height:78px}.nmmode small{color:var(--mut,#a899bb)}.nmchat{display:flex;flex-direction:column;gap:10px}.nmbubble{white-space:pre-wrap;overflow-wrap:anywhere;padding:11px 14px;border-radius:15px;background:var(--card,#221832);max-width:92%}.nmbubble.user{align-self:flex-end;background:var(--ub,#2c2142)}.nmcompose{position:sticky;bottom:0;background:var(--bg,#120d1b);padding:10px;border-top:1px solid var(--bd,#33264a)}.nmcompose textarea{width:100%;min-height:62px;max-height:140px;background:var(--card,#221832);color:inherit;border:1px solid var(--bd,#33264a);border-radius:14px;padding:10px}.nmbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.nmbar button.primary{background:var(--acc,#e8c58e);color:#231a30}.nmbar input{max-width:220px}.nmhint{font-size:13px;color:var(--mut,#a899bb)}.nmscheme{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:8px 0}.nmscheme label{font-size:13px}.nmscheme input,.nmscheme select{display:block;width:100%;padding:8px;border-radius:10px}.nmstatus{font-size:13px;color:var(--mut,#a899bb);min-height:20px}
@media(max-width:600px){.nmcontent{padding:10px}.nmbar button{flex:1}.nmmode{min-height:72px}}
`;
const st=document.createElement('style');st.textContent=css;document.head.append(st);
const root=document.createElement('section');root.id='novaModes';root.innerHTML=`
<header class="nmhead"><button id="nmBack">←</button><strong id="nmTitle">${tr('Nova AI · Modes','Nova AI · मोड्स')}</strong><button id="nmClose">${tr('Close','बंद करें')}</button></header>
<main class="nmcontent" id="nmContent"></main>
<footer class="nmcompose" id="nmCompose" hidden><div class="nmhint" id="nmUploadName"></div><textarea id="nmInput" placeholder="${tr('Type your question…','अपना सवाल लिखें…')}"></textarea><div class="nmbar"><button id="nmFile">📎 ${tr('Attach file/photo','फ़ाइल/फोटो जोड़ें')}</button><input id="nmPick" type="file" accept=".pdf,.txt,.md,.csv,image/*" hidden><button id="nmMic">🎙 ${tr('Speak','बोलें')}</button><button id="nmSend" class="primary">${tr('Send','भेजें')}</button></div><div class="nmstatus" id="nmStatus" aria-live="polite"></div></footer>`;
document.body.append(root);
const content=$('#nmContent'),compose=$('#nmCompose'),input=$('#nmInput');
function show(groupFilter){syncStaticLabels();root.classList.add('open');drawHome(groupFilter)}
function hide(){root.classList.remove('open');stopSpeech()}
function drawHome(groupFilter){
 syncStaticLabels();active=null;activeGroup=groupFilter||null;upload=null;compose.hidden=true;$('#nmBack').hidden=true;$('#nmTitle').textContent=tr('Nova AI · Modes','Nova AI · मोड्स');
 content.innerHTML=REG.groups.filter(g=>!groupFilter||g.id===groupFilter).map(g=>'<section class="nmgroup"><h3>'+esc(isHi()?(g.nameHi||g.name):g.name)+'</h3><div class="nmcards">'+REG.modes.filter(m=>m.group===g.id).map(m=>{const v=mode(m.id);return '<button class="nmmode" data-mode="'+m.id+'"><b>'+esc(v.name)+'</b><small>'+esc(v.desc)+'</small></button>'}).join('')+'</div></section>').join('')+'<button id="nmLowData" class="nmmode" type="button">'+tr('Low Data / Lite Mode','कम डेटा / लाइट मोड')+'</button><p class="nmhint">'+tr('Each mode has its own chat history. Your existing Nova chats and settings remain unchanged. Saved chats are available offline.','हर मोड की अलग चैट हिस्ट्री है। आपकी पुरानी Nova चैट और सेटिंग्स सुरक्षित हैं। सेव की गई चैट ऑफलाइन भी खुलेंगी।')+'</p>';
 const low=$('#nmLowData');const paintLow=()=>{low.textContent=isHi()?'कम डेटा मोड: '+(lowData()?'चालू':'बंद')+' · छोटी फ़ाइलें और छोटा संदर्भ':'Low Data Mode: '+(lowData()?'On':'Off')+' · Smaller uploads and shorter context';};paintLow();low.onclick=()=>{const d=data();d.lowData=d.lowData===false;saveData(d);paintLow()};
 content.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>openMode(b.dataset.mode));
}
function drawChat(){
 syncStaticLabels();const m=mode(active),h=history(active);$('#nmBack').hidden=false;$('#nmTitle').textContent=m.name;compose.hidden=false;
 const controls=active==='schemes'?'<div class="nmscheme"><label>'+tr('Age','उम्र')+'<input id="nmAge" type="number" min="1" max="120" placeholder="'+tr('Age','उम्र')+'"></label><label>'+tr('State','राज्य')+'<input id="nmState" placeholder="'+tr('State','राज्य')+'"></label><label>'+tr('Work/status','काम / स्थिति')+'<input id="nmWork" placeholder="'+tr('e.g. student, farmer','जैसे छात्र, किसान')+'"></label><label>'+tr('Annual income (₹)','सालाना आय (₹)')+'<input id="nmIncome" type="number" min="0" placeholder="'+tr('Income','आय')+'"></label></div>':active==='voice'?'<label class="nmhint">'+tr('Reply language','जवाब की भाषा')+' <select id="nmVoiceLang"><option value="hi-IN">'+tr('Hindi (India)','हिन्दी (भारत)')+'</option><option value="en-IN">'+tr('English (India)','अंग्रेज़ी (भारत)')+'</option><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option></select></label>':'';
 content.innerHTML=controls+'<div class="nmchat">'+h.map(x=>'<div class="nmbubble '+(x.role==='user'?'user':'assistant')+'">'+esc(x.text)+'</div>').join('')+'</div>';
 $('#nmStatus').textContent=navigator.onLine?'':tr('Offline: saved chats are available; new AI replies require an internet connection.','ऑफलाइन: सेव की गई चैट उपलब्ध हैं; नए AI जवाब के लिए इंटरनेट चाहिए।');
 const vl=$('#nmVoiceLang');if(vl){const d=data();if(!d.voiceLangUserSet){d.voiceLang=isHi()?'hi-IN':'en-IN';saveData(d)}vl.value=d.voiceLang||'hi-IN';vl.onchange=()=>{const next=data();next.voiceLang=vl.value;next.voiceLangUserSet=true;saveData(next)}}
 content.scrollTop=content.scrollHeight;input.placeholder=active==='document'?tr('Upload a bill, notice, or form, or type a question…','बिल, नोटिस या फॉर्म अपलोड करें, या सवाल लिखें…'):active==='photo'?tr('Choose a photo of the question or type it…','सवाल की फोटो चुनें या सवाल लिखें…'):tr('Type your question…','अपना सवाल लिखें…');
}
function openMode(id){active=id;const d=data();d.lastMode=id;saveData(d);upload=null;$('#nmUploadName').textContent='';drawChat()}
function stopSpeech(){try{if(recognition)recognition.stop()}catch(e){}recognition=null}
async function extractFile(f){
 if(f.size>8*1024*1024)throw Error(tr('Keep files under 8 MB.','फ़ाइल 8 MB से छोटी रखें।'));
 if(f.type.startsWith('image/')){if(f.size>(lowData()?1.5:4)*1024*1024)throw Error(lowData()?tr('In Low Data Mode, keep photos under 1.5 MB.','कम डेटा मोड में फोटो 1.5 MB से छोटी रखें।'):tr('Keep photos under 4 MB.','फोटो 4 MB से छोटी रखें।'));return {image:await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result));r.onerror=no;r.readAsDataURL(f)}),text:tr('Read and explain the content in this image in clear English.','इस फोटो में मौजूद सामग्री को सरल हिंदी में पढ़कर समझाएँ।')};}
 if(/\.pdf$/i.test(f.name)||f.type==='application/pdf'){
   if(!window.pdfjsLib){$('#nmStatus').textContent=tr('Loading PDF reader…','PDF रीडर लोड हो रहा है…');await new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';s.onload=ok;s.onerror=()=>no(Error(tr('PDF reader is unavailable','PDF रीडर उपलब्ध नहीं है')));document.head.append(s)});window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';}
   const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;let out='';
   for(let p=1;p<=Math.min(pdf.numPages,lowData()?8:20);p++){const page=await pdf.getPage(p),tc=await page.getTextContent();out+=tc.items.map(x=>x.str).join(' ')+'\n';}
   if(!out.trim())throw Error(tr('No selectable text was found in the PDF. Upload a clear image of the page instead.','PDF में पढ़ने योग्य टेक्स्ट नहीं मिला। कृपया पेज की साफ़ फोटो अपलोड करें।'));return {text:out.slice(0,lowData()?8000:18000)};
 }
 if(/text\/|\.txt$|\.md$|\.csv$/i.test(f.type+' '+f.name))return {text:(await f.text()).slice(0,lowData()?8000:18000)};
 throw Error(tr('This file type is not supported. Use PDF, TXT, MD, CSV, or an image.','यह फ़ाइल टाइप सपोर्ट नहीं है। PDF, TXT, MD, CSV या फोटो इस्तेमाल करें।'));
}
function cacheGet(k){const c=read(CACHE,{}),x=c[k];if(!x||Date.now()-x.at>12*60*60*1000)return null;return x.text}
function cacheSet(k,text){const c=read(CACHE,{});c[k]={at:Date.now(),text};const keys=Object.keys(c);while(keys.length>80)delete c[keys.shift()];write(CACHE,c)}
function cacheKey(id,text){const s=text.trim().toLowerCase().replace(/\s+/g,' ');let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return id+'|'+(h>>>0).toString(36)}
async function schemeSources(profile){
 const age=profile?.age,state=profile?.state,work=profile?.work,income=profile?.income;
 if(!age||!state||!work||income==='')throw Error(tr('Enter your age, state, work/status, and annual income to search for schemes.','योजना खोजने के लिए उम्र, राज्य, काम और सालाना आय भरें।'));
 const q='government schemes '+state+' '+work+' eligibility benefits application age '+age+' annual income '+income;
 const r=await fetch(API+'/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q})});
 if(!r.ok)throw Error(tr('Official scheme search is unavailable right now. Please try again later.','अभी सरकारी योजना खोज उपलब्ध नहीं है। कृपया बाद में फिर कोशिश करें।'));
 const j=await r.json(),official=(j.results||[]).filter(x=>{try{return /(^|\.)(gov\.in|nic\.in)$/i.test(new URL(x.url).hostname)}catch(e){return false}});
 return {profile:{age,state,work,income},results:official.slice(0,6)};
}
async function send(){
 if(!active)return;const m=mode(active),question=input.value.trim();if(!question&&!upload)return;
 const schemeInput=active==='schemes'?{age:$('#nmAge')?.value,state:$('#nmState')?.value.trim(),work:$('#nmWork')?.value.trim(),income:$('#nmIncome')?.value}:null;
 const d=data(),h=d.histories[active]||(d.histories[active]=[]),now=Date.now();
 d.limits=d.limits||[];d.limits=d.limits.filter(t=>now-t<10*60*1000);if(d.limits.length>=20){$('#nmStatus').textContent=tr('Please pause. The limit is 20 new requests per 10 minutes.','कृपया थोड़ा रुकें। 10 मिनट में अधिकतम 20 नए अनुरोध भेज सकते हैं।');return}
 if(!navigator.onLine){$('#nmStatus').textContent=tr('Offline mode: saved chats are available, but new AI replies are not.','ऑफलाइन मोड: सेव चैट उपलब्ध हैं, लेकिन नए AI जवाब नहीं मिलेंगे।');return}
 d.limits.push(now);saveData(d);
 let q=question||upload?.text||tr('Explain this content','इस सामग्री को समझाएँ'),file=upload;upload=null;$('#nmUploadName').textContent='';
 const userText=question||('📎 '+(file?.name||'Uploaded file'));h.push({role:'user',text:userText,at:now});if(h.length>100)h.splice(0,h.length-100);saveData(d);input.value='';drawChat();$('#nmStatus').textContent=tr('Preparing your answer…','जवाब तैयार हो रहा है…');
 try{
   let extra='',profile=null,sourceLinks=[];
   if(active==='schemes'){const x=await schemeSources(schemeInput);profile=x.profile;if(!x.results.length)throw Error(tr('No official government sources were found right now. Please check the official portal directly.','अभी कोई आधिकारिक सरकारी स्रोत नहीं मिला। कृपया सीधे सरकारी पोर्टल देखें।'));sourceLinks=x.results.map(z=>({title:z.title,url:z.url}));extra='\nUse only the official government-domain sources listed below. If eligibility cannot be verified from them, clearly say so.\n'+JSON.stringify(x.results);}
   if(file?.text)extra+='\nUploaded content (for this request only; do not store it permanently):\n'+file.text;
   if(profile)extra+='\nUser eligibility details: '+JSON.stringify(profile);
   const voiceLabels={'hi-IN':'Hindi (India)','en-IN':'English (India)','en-US':'English (US)','en-GB':'English (UK)'};
   const selectedVoice=active==='voice'?(data().voiceLang||(isHi()?'hi-IN':'en-IN')):null;
   const voiceInstruction=selectedVoice?' In Voice Chat, respond in '+(voiceLabels[selectedVoice]||'Hindi')+' using short, natural sentences suitable for speech.':'';
   const prompt=m.prompt+voiceInstruction+(active==='math'||active==='photo'?' Independently verify the final answer.':'');
   const messages=[{role:'system',content:prompt},...h.slice(-(lowData()?4:8)).map(x=>({role:x.role,content:x.text}))];
   let last=messages[messages.length-1];const appendInstruction=text=>{if(Array.isArray(last.content))last.content.unshift({type:'text',text});else last.content+='\n'+text};
   if(file?.image){last={role:'user',content:[{type:'text',text:q+'\n'+extra},{type:'image_url',image_url:{url:file.image}}]};messages[messages.length-1]=last;}
   else if(extra)last.content+=extra;
   if(active==='shopkeeper'&&/GST/i.test(q)){
     const gst=(q.match(/(?:₹|Rs\.?\s*)?([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:at|@)?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i)||[]);
     if(gst.length){
       const base=Number(gst[1].replace(/,/g,'')),rate=Number(gst[2]),tax=base*rate/100;
       if(Number.isFinite(base)&&Number.isFinite(rate)&&base>=0&&rate>=0&&rate<=100)appendInstruction('Calculation check (user-provided rate): taxable amount ₹'+base.toFixed(2)+'; GST rate '+rate+'%; GST ₹'+tax.toFixed(2)+'; total ₹'+(base+tax).toFixed(2)+'. Determine CGST/SGST versus IGST based on the transaction location.');
     }else appendInstruction('Ask for the applicable GST rate first; never guess the rate.');
   }
   const ck=cacheKey(active,q+extra),cached=file?.image?null:cacheGet(ck);let answer=cached;
   if(!answer){
     const cfg=await fetch(API+'/config');if(!cfg.ok)throw Error(tr('The AI service is not configured yet.','AI सेवा अभी कॉन्फ़िगर नहीं है।'));
     const config=await cfg.json(),r=await fetch(API+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:config.model,stream:false,max_tokens:lowData()?500:900,messages})});
     const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(tr('The AI provider is unavailable.','AI सेवा अभी उपलब्ध नहीं है।'));
     answer=String(j.choices?.[0]?.message?.content||'').trim();if(!answer)throw Error('The AI returned an empty response.');if(!file?.image)cacheSet(ck,answer);
   }
   if(active==='document'&&/(RTI|right to information|complaint|application|draft)/i.test(q)&&!answer.includes('This is not legal advice.'))answer+='\n\n'+tr('This is not legal advice.','ये कानूनी सलाह नहीं है।');
   if(active==='schemes'&&!answer.includes('Please verify details on the official website'))answer+='\n\n'+tr('Please verify details on the official website.','पक्का करने के लिए आधिकारिक साइट देखें।');
   h.push({role:'assistant',text:answer,at:Date.now()});if(h.length>100)h.splice(0,h.length-100);saveData(d);drawChat();if(active==='voice')speak(answer);
   $('#nmStatus').textContent=cached?tr('Answer from cache','कैश से जवाब मिला'):tr('Answer ready','जवाब तैयार है');
 }catch(e){h.push({role:'assistant',text:'⚠️ '+String(e.message||e),at:Date.now()});if(h.length>100)h.splice(0,h.length-100);saveData(d);drawChat();$('#nmStatus').textContent='';}
}
function speak(text){if(!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(text);u.lang=data().voiceLang||'en-IN';speechSynthesis.cancel();speechSynthesis.speak(u)}
function voice(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){$('#nmStatus').textContent=tr('Speech recognition is not available in this browser. You can type your question instead.','इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। आप सवाल टाइप कर सकते हैं।');return}stopSpeech();recognition=new SR();recognition.lang=data().voiceLang||'en-IN';recognition.interimResults=false;recognition.onresult=e=>{input.value=e.results[0][0].transcript;send()};recognition.onerror=()=>$('#nmStatus').textContent=tr('Microphone unavailable. Check browser permissions or type your question.','माइक उपलब्ध नहीं है। ब्राउज़र अनुमति जाँचें या सवाल टाइप करें।');recognition.start();$('#nmStatus').textContent=tr('Listening…','सुन रहा है…')}
$('#nmClose').onclick=hide;$('#nmBack').onclick=()=>drawHome(activeGroup);$('#nmSend').onclick=send;$('#nmMic').onclick=voice;
$('#nmFile').onclick=()=>$('#nmPick').click();$('#nmPick').onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{upload={...await extractFile(f),name:f.name};$('#nmUploadName').textContent=tr('File ready: ','फ़ाइल तैयार: ')+f.name+tr(' (not stored on the server after submission)',' (भेजने के बाद सर्वर पर सेव नहीं होती)');}catch(err){$('#nmStatus').textContent=err.message}};
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
document.querySelector('#lang')?.addEventListener('change',()=>{syncStaticLabels();const b1=$('#novaModesTop'),b2=$('#novaModesSide'),b3=$('#novaModesHome');if(b1)b1.textContent=tr('☷ Modes','☷ मोड्स');if(b2)b2.textContent=tr('☷ Open Modes','☷ मोड्स खोलें');if(b3)b3.textContent=tr('☷ Open All Modes','☷ सभी मोड्स खोलें');if(root.classList.contains('open')){if(active)drawChat();else drawHome(activeGroup);}});
window.addEventListener('online',()=>{offline=false;if(active)drawChat()});window.addEventListener('offline',()=>{offline=true;if(active)drawChat()});
window.NovaModeWorkspace=Object.freeze({openGroup(group){if(!REG.groups.some(g=>g.id===group))return false;show(group);return true;},openMode(id){const m=REG.modes.find(x=>x.id===id);if(!m)return false;activeGroup=m.group;root.classList.add('open');openMode(id);return true;},close:hide});
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
})();
