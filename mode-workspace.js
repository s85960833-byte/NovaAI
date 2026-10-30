(function(){
'use strict';
const REG=window.NovaModeRegistry;if(!REG)return;
const STORE='nova_modes_v1',CACHE='nova_mode_cache_v1',API='/api';
const $=s=>document.querySelector(s);
let active=null,upload=null,scheme=null,recognition=null,offline=false;
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(e){return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const data=()=>read(STORE,{version:1,histories:{},lastMode:'general'});
const saveData=x=>write(STORE,x);
const lowData=()=>data().lowData!==false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mode=id=>REG.modes.find(x=>x.id===id)||REG.modes[0];
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
<header class="nmhead"><button id="nmBack">←</button><strong id="nmTitle">Nova AI · Modes</strong><button id="nmClose">Off</button></header>
<main class="nmcontent" id="nmContent"></main>
<footer class="nmcompose" id="nmCompose" hidden><div class="nmhint" id="nmUploadName"></div><textarea id="nmInput" placeholder="Type your question…"></textarea><div class="nmbar"><button id="nmFile">📎 Attach file/photo</button><input id="nmPick" type="file" accept=".pdf,.txt,.md,.csv,image/*" hidden><button id="nmMic">🎙 Speak</button><button id="nmSend" class="primary">Send</button></div><div class="nmstatus" id="nmStatus" aria-live="polite"></div></footer>`;
document.body.append(root);
const content=$('#nmContent'),compose=$('#nmCompose'),input=$('#nmInput');
function show(){root.classList.add('open');drawHome()}
function hide(){root.classList.remove('open');stopSpeech()}
function drawHome(){
 active=null;upload=null;compose.hidden=true;$('#nmBack').hidden=true;$('#nmTitle').textContent='Nova AI · Modes';
 content.innerHTML=REG.groups.map(g=>'<section class="nmgroup"><h3>'+esc(g.name)+'</h3><div class="nmcards">'+REG.modes.filter(m=>m.group===g.id).map(m=>'<button class="nmmode" data-mode="'+m.id+'"><b>'+esc(m.name)+'</b><small>'+esc(m.desc)+'</small></button>').join('')+'</div></section>').join('')+'<button id="nmLowData" class="nmmode" type="button">Low Data / Lite Mode</button><p class="nmhint">Each mode has its own chat history. Your existing Nova chats and settings remain unchanged. Saved chats are available offline.</p>';
 const low=$('#nmLowData');const paintLow=()=>{low.textContent='Low Data Mode: '+(lowData()?'On':'Off')+' · Smaller uploads and shorter context';};paintLow();low.onclick=()=>{const d=data();d.lowData=d.lowData===false;saveData(d);paintLow()};
 content.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>openMode(b.dataset.mode));
}
function drawChat(){
 const m=mode(active),h=history(active);$('#nmBack').hidden=false;$('#nmTitle').textContent=m.name;compose.hidden=false;
 const controls=active==='schemes'?'<div class="nmscheme"><label>Age<input id="nmAge" type="number" min="1" max="120" placeholder="Age"></label><label>State<input id="nmState" placeholder="State"></label><label>Work/status<input id="nmWork" placeholder="e.g. student, farmer"></label><label>Annual income (₹)<input id="nmIncome" type="number" min="0" placeholder="Income"></label></div>':active==='voice'?'<label class="nmhint">Reply language <select id="nmVoiceLang"><option value="en-IN">English (India)</option><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option></select></label>':'';
 content.innerHTML=controls+'<div class="nmchat">'+h.map(x=>'<div class="nmbubble '+(x.role==='user'?'user':'assistant')+'">'+esc(x.text)+'</div>').join('')+'</div>';
 $('#nmStatus').textContent=navigator.onLine?'':'Offline: saved chats are available; new AI replies require an internet connection.';
 const vl=$('#nmVoiceLang');if(vl){vl.value=data().voiceLang||'hi-IN';vl.onchange=()=>{const d=data();d.voiceLang=vl.value;saveData(d)}}
 content.scrollTop=content.scrollHeight;input.placeholder=active==='document'?'Upload a bill, notice, or form, or type a question…':active==='photo'?'Choose a photo of the question or type it…':'Type your question…';
}
function openMode(id){active=id;const d=data();d.lastMode=id;saveData(d);upload=null;$('#nmUploadName').textContent='';drawChat()}
function stopSpeech(){try{if(recognition)recognition.stop()}catch(e){}recognition=null}
async function extractFile(f){
 if(f.size>8*1024*1024)throw Error('Keep files under 8 MB.');
 if(f.type.startsWith('image/')){if(f.size>(lowData()?1.5:4)*1024*1024)throw Error(lowData()?'In Low Data Mode, keep photos under 1.5 MB.':'Keep photos under 4 MB.');return {image:await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result));r.onerror=no;r.readAsDataURL(f)}),text:'Read and explain the content in this image in clear English.'};}
 if(/\.pdf$/i.test(f.name)||f.type==='application/pdf'){
   if(!window.pdfjsLib){$('#nmStatus').textContent='Loading PDF reader…';await new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';s.onload=ok;s.onerror=()=>no(Error('PDF reader is unavailable'));document.head.append(s)});window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';}
   const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;let out='';
   for(let p=1;p<=Math.min(pdf.numPages,lowData()?8:20);p++){const page=await pdf.getPage(p),tc=await page.getTextContent();out+=tc.items.map(x=>x.str).join(' ')+'\n';}
   if(!out.trim())throw Error('No selectable text was found in the PDF. Upload a clear image of the page instead.');return {text:out.slice(0,lowData()?8000:18000)};
 }
 if(/text\/|\.txt$|\.md$|\.csv$/i.test(f.type+' '+f.name))return {text:(await f.text()).slice(0,lowData()?8000:18000)};
 throw Error('This file type is not supported. Use PDF, TXT, MD, CSV, or an image.');
}
function cacheGet(k){const c=read(CACHE,{}),x=c[k];if(!x||Date.now()-x.at>12*60*60*1000)return null;return x.text}
function cacheSet(k,text){const c=read(CACHE,{});c[k]={at:Date.now(),text};const keys=Object.keys(c);while(keys.length>80)delete c[keys.shift()];write(CACHE,c)}
function cacheKey(id,text){const s=text.trim().toLowerCase().replace(/\s+/g,' ');let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return id+'|'+(h>>>0).toString(36)}
async function schemeSources(profile){
 const age=profile?.age,state=profile?.state,work=profile?.work,income=profile?.income;
 if(!age||!state||!work||income==='')throw Error('Enter your age, state, work/status, and annual income to search for schemes.');
 const q='government schemes '+state+' '+work+' eligibility benefits application age '+age+' annual income '+income;
 const r=await fetch(API+'/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q})});
 if(!r.ok)throw Error('Official scheme search is unavailable right now. Please try again later.');
 const j=await r.json(),official=(j.results||[]).filter(x=>{try{return /(^|\.)(gov\.in|nic\.in)$/i.test(new URL(x.url).hostname)}catch(e){return false}});
 return {profile:{age,state,work,income},results:official.slice(0,6)};
}
async function send(){
 if(!active)return;const m=mode(active),question=input.value.trim();if(!question&&!upload)return;
 const schemeInput=active==='schemes'?{age:$('#nmAge')?.value,state:$('#nmState')?.value.trim(),work:$('#nmWork')?.value.trim(),income:$('#nmIncome')?.value}:null;
 const d=data(),h=d.histories[active]||(d.histories[active]=[]),now=Date.now();
 d.limits=d.limits||[];d.limits=d.limits.filter(t=>now-t<10*60*1000);if(d.limits.length>=20){$('#nmStatus').textContent='Please pause. The limit is 20 new requests per 10 minutes.';return}
 if(!navigator.onLine){$('#nmStatus').textContent='Offline mode: saved chats are available, but new AI replies are not.';return}
 d.limits.push(now);saveData(d);
 let q=question||upload?.text||'Explain this content',file=upload;upload=null;$('#nmUploadName').textContent='';
 const userText=question||('📎 '+(file?.name||'Uploaded file'));h.push({role:'user',text:userText,at:now});if(h.length>100)h.splice(0,h.length-100);saveData(d);input.value='';drawChat();$('#nmStatus').textContent='Preparing your answer…';
 try{
   let extra='',profile=null,sourceLinks=[];
   if(active==='schemes'){const x=await schemeSources(schemeInput);profile=x.profile;if(!x.results.length)throw Error('No official government sources were found right now. Please check the official portal directly.');sourceLinks=x.results.map(z=>({title:z.title,url:z.url}));extra='\nUse only the official government-domain sources listed below. If eligibility cannot be verified from them, clearly say so.\n'+JSON.stringify(x.results);}
   if(file?.text)extra+='\nUploaded content (for this request only; do not store it permanently):\n'+file.text;
   if(profile)extra+='\nUser eligibility details: '+JSON.stringify(profile);
   const voiceLabels={'en-IN':'English (India)','en-US':'English (US)','en-GB':'English (UK)'};
   const selectedVoice=active==='voice'?(data().voiceLang||'en-IN'):null;
   const voiceInstruction=selectedVoice?' In Voice Chat, respond in '+(voiceLabels[selectedVoice]||'English')+' using short, natural sentences suitable for speech.':'';
   const prompt=m.prompt+voiceInstruction+(active==='math'||active==='photo'?' Independently verify the final answer.':'');
   const messages=[{role:'system',content:prompt},...h.slice(-(lowData()?4:8)).map(x=>({role:x.role,content:x.text}))];
   let last=messages[messages.length-1];const appendInstruction=text=>{if(Array.isArray(last.content))last.content.unshift({type:'text',text});else last.content+='\n'+text};
   if(file?.image){last={role:'user',content:[{type:'text',text:q+'\n'+extra},{type:'image_url',image_url:{url:file.image}}]};messages[messages.length-1]=last;}
   else if(extra)last.content+=extra;
   if(active==='shopkeeper'&&/GST/i.test(q)){
     const gst=(q.match(/(?:₹|Rs\.?\s*)?([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:at|@|पर)?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i)||[]);
     if(gst.length){
       const base=Number(gst[1].replace(/,/g,'')),rate=Number(gst[2]),tax=base*rate/100;
       if(Number.isFinite(base)&&Number.isFinite(rate)&&base>=0&&rate>=0&&rate<=100)appendInstruction('Calculation check (user-provided rate): taxable amount ₹'+base.toFixed(2)+'; GST rate '+rate+'%; GST ₹'+tax.toFixed(2)+'; total ₹'+(base+tax).toFixed(2)+'. Determine CGST/SGST versus IGST based on the transaction location.');
     }else appendInstruction('Ask for the applicable GST rate first; never guess the rate.');
   }
   const ck=cacheKey(active,q+extra),cached=file?.image?null:cacheGet(ck);let answer=cached;
   if(!answer){
     const cfg=await fetch(API+'/config');if(!cfg.ok)throw Error('The AI service is not configured yet.');
     const config=await cfg.json(),r=await fetch(API+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:config.model,stream:false,max_tokens:lowData()?500:900,messages})});
     const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||'The AI provider is unavailable.');
     answer=String(j.choices?.[0]?.message?.content||'').trim();if(!answer)throw Error('The AI returned an empty response.');if(!file?.image)cacheSet(ck,answer);
   }
   if(active==='document'&&/(RTI|right to information|complaint|application|draft)/i.test(q)&&!answer.includes('This is not legal advice.'))answer+='\n\nThis is not legal advice.';
   if(active==='schemes'&&!answer.includes('Please verify details on the official website'))answer+='\n\nPlease verify details on the official website.';
   h.push({role:'assistant',text:answer,at:Date.now()});if(h.length>100)h.splice(0,h.length-100);saveData(d);drawChat();if(active==='voice')speak(answer);
   $('#nmStatus').textContent=cached?'Answer from cache':'Answer ready';
 }catch(e){h.push({role:'assistant',text:'⚠️ '+String(e.message||e),at:Date.now()});if(h.length>100)h.splice(0,h.length-100);saveData(d);drawChat();$('#nmStatus').textContent='';}
}
function speak(text){if(!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(text);u.lang=data().voiceLang||'en-IN';speechSynthesis.cancel();speechSynthesis.speak(u)}
function voice(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){$('#nmStatus').textContent='Speech recognition is not available in this browser. You can type your question instead.';return}stopSpeech();recognition=new SR();recognition.lang=data().voiceLang||'en-IN';recognition.interimResults=false;recognition.onresult=e=>{input.value=e.results[0][0].transcript;send()};recognition.onerror=()=>$('#nmStatus').textContent='Microphone unavailable. Check browser permissions or type your question.';recognition.start();$('#nmStatus').textContent='Listening…'}
$('#nmClose').onclick=hide;$('#nmBack').onclick=drawHome;$('#nmSend').onclick=send;$('#nmMic').onclick=voice;
$('#nmFile').onclick=()=>$('#nmPick').click();$('#nmPick').onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{upload={...await extractFile(f),name:f.name};$('#nmUploadName').textContent='File ready: '+f.name+' (not stored on the server after submission)';}catch(err){$('#nmStatus').textContent=err.message}};
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
window.addEventListener('online',()=>{offline=false;if(active)drawChat()});window.addEventListener('offline',()=>{offline=true;if(active)drawChat()});
function addLaunchers(){
 const top=$('#top'),side=$('#side');
 const add=(host,id,label)=>{if(!host||document.getElementById(id))return;const b=document.createElement('button');b.id=id;b.type='button';b.textContent=label;b.addEventListener('click',show);host.append(b)};
 add(top,'novaModesTop','☷ Modes');add(side,'novaModesSide','☷ Open Modes');
 const home=document.createElement('button');home.id='novaModesHome';home.type='button';home.textContent='☷ Open All Modes';home.addEventListener('click',show);
 const hi=$('#hi');if(hi)hi.append(home);
 const settings=$('#dset');if(settings){const b=document.createElement('button');b.type='button';b.textContent='☷ Modes';b.onclick=()=>{if(settings.open)settings.close();show()};settings.append(b)}
}
addLaunchers();
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
})();
