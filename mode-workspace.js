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
<header class="nmhead"><button id="nmBack">←</button><strong id="nmTitle">Nova AI · मोड्स</strong><button id="nmClose">बंद</button></header>
<main class="nmcontent" id="nmContent"></main>
<footer class="nmcompose" id="nmCompose" hidden><div class="nmhint" id="nmUploadName"></div><textarea id="nmInput" placeholder="अपना सवाल लिखें…"></textarea><div class="nmbar"><button id="nmFile">📎 फ़ाइल/फोटो</button><input id="nmPick" type="file" accept=".pdf,.txt,.md,.csv,image/*" hidden><button id="nmMic">🎙 बोलें</button><button id="nmSend" class="primary">भेजें</button></div><div class="nmstatus" id="nmStatus" aria-live="polite"></div></footer>`;
document.body.append(root);
const content=$('#nmContent'),compose=$('#nmCompose'),input=$('#nmInput');
function show(){root.classList.add('open');drawHome()}
function hide(){root.classList.remove('open');stopSpeech()}
function drawHome(){
 active=null;upload=null;compose.hidden=true;$('#nmBack').hidden=true;$('#nmTitle').textContent='Nova AI · मोड्स';
 content.innerHTML=REG.groups.map(g=>'<section class="nmgroup"><h3>'+esc(g.name)+'</h3><div class="nmcards">'+REG.modes.filter(m=>m.group===g.id).map(m=>'<button class="nmmode" data-mode="'+m.id+'"><b>'+esc(m.name)+'</b><small>'+esc(m.desc)+'</small></button>').join('')+'</div></section>').join('')+'<p class="nmhint">हर मोड की चैट और बातचीत अलग सेव होती है। पुरानी Nova चैट्स और सेटिंग्स अलग ही रहेंगी।</p>';
 content.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>openMode(b.dataset.mode));
}
function drawChat(){
 const m=mode(active),h=history(active);$('#nmBack').hidden=false;$('#nmTitle').textContent=m.name;compose.hidden=false;
 const controls=active==='schemes'?'<div class="nmscheme"><label>उम्र<input id="nmAge" type="number" min="1" max="120" placeholder="उम्र"></label><label>राज्य<input id="nmState" placeholder="राज्य"></label><label>काम/स्थिति<input id="nmWork" placeholder="जैसे छात्र, किसान"></label><label>वार्षिक आय (₹)<input id="nmIncome" type="number" min="0" placeholder="आय"></label></div>':active==='voice'?'<label class="nmhint">जवाब की भाषा <select id="nmVoiceLang"><option value="hi-IN">हिंदी</option><option value="en-IN">English (India)</option><option value="bn-IN">বাংলা</option><option value="ta-IN">தமிழ்</option><option value="te-IN">తెలుగు</option><option value="mr-IN">मराठी</option><option value="gu-IN">ગુજરાતી</option><option value="pa-IN">ਪੰਜਾਬੀ</option><option value="kn-IN">ಕನ್ನಡ</option><option value="ml-IN">മലയാളം</option></select></label>':'';
 content.innerHTML=controls+'<div class="nmchat">'+h.map(x=>'<div class="nmbubble '+(x.role==='user'?'user':'assistant')+'">'+esc(x.text)+'</div>').join('')+'</div>';
 $('#nmStatus').textContent=navigator.onLine?'':'ऑफ़लाइन: पहले से सेव चैट पढ़ सकते हैं; नया AI जवाब इंटरनेट पर निर्भर है।';
 const vl=$('#nmVoiceLang');if(vl){vl.value=data().voiceLang||'hi-IN';vl.onchange=()=>{const d=data();d.voiceLang=vl.value;saveData(d)}}
 content.scrollTop=content.scrollHeight;input.placeholder=active==='document'?'बिल/नोटिस/फॉर्म अपलोड करें या सवाल लिखें…':active==='photo'?'सवाल की फोटो चुनें या सवाल लिखें…':'अपना सवाल लिखें…';
}
function openMode(id){active=id;const d=data();d.lastMode=id;saveData(d);upload=null;$('#nmUploadName').textContent='';drawChat()}
function stopSpeech(){try{if(recognition)recognition.stop()}catch(e){}recognition=null}
async function extractFile(f){
 if(f.size>8*1024*1024)throw Error('फ़ाइल 8 MB से छोटी रखें।');
 if(f.type.startsWith('image/')){if(f.size>4*1024*1024)throw Error('फ़ोटो 4 MB से छोटी रखें।');return {image:await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result));r.onerror=no;r.readAsDataURL(f)}),text:'इस फ़ोटो में लिखी सामग्री पढ़कर समझाएँ।'};}
 if(/\.pdf$/i.test(f.name)||f.type==='application/pdf'){
   if(!window.pdfjsLib){$('#nmStatus').textContent='PDF रीडर लोड हो रहा है…';await new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';s.onload=ok;s.onerror=()=>no(Error('PDF रीडर उपलब्ध नहीं है'));document.head.append(s)});window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';}
   const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;let out='';
   for(let p=1;p<=Math.min(pdf.numPages,20);p++){const page=await pdf.getPage(p),tc=await page.getTextContent();out+=tc.items.map(x=>x.str).join(' ')+'\n';}
   if(!out.trim())throw Error('PDF में selectable text नहीं मिला; पेज की साफ़ फोटो अपलोड करें।');return {text:out.slice(0,18000)};
 }
 if(/text\/|\.txt$|\.md$|\.csv$/i.test(f.type+' '+f.name))return {text:(await f.text()).slice(0,18000)};
 throw Error('इस फ़ाइल प्रकार का समर्थन नहीं है। PDF, TXT, MD, CSV या फोटो दें।');
}
function cacheGet(k){const c=read(CACHE,{}),x=c[k];if(!x||Date.now()-x.at>12*60*60*1000)return null;return x.text}
function cacheSet(k,text){const c=read(CACHE,{});c[k]={at:Date.now(),text};const keys=Object.keys(c);while(keys.length>80)delete c[keys.shift()];write(CACHE,c)}
function cacheKey(id,text){const s=text.trim().toLowerCase().replace(/\s+/g,' ');let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return id+'|'+(h>>>0).toString(36)}
async function schemeSources(profile){
 const age=profile?.age,state=profile?.state,work=profile?.work,income=profile?.income;
 if(!age||!state||!work||income==='')throw Error('योजना खोजने के लिए उम्र, राज्य, काम और सालाना आय भरें।');
 const q='सरकारी योजना '+state+' '+work+' पात्रता लाभ आवेदन '+age+' वर्ष आय '+income+' official government scheme';
 const r=await fetch(API+'/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q})});
 if(!r.ok)throw Error('अभी आधिकारिक योजनाओं की खोज उपलब्ध नहीं है। बाद में दोबारा कोशिश करें।');
 const j=await r.json(),official=(j.results||[]).filter(x=>{try{return /(^|\.)(gov\.in|nic\.in)$/i.test(new URL(x.url).hostname)}catch(e){return false}});
 return {profile:{age,state,work,income},results:official.slice(0,6)};
}
async function send(){
 if(!active)return;const m=mode(active),question=input.value.trim();if(!question&&!upload)return;
 const schemeInput=active==='schemes'?{age:$('#nmAge')?.value,state:$('#nmState')?.value.trim(),work:$('#nmWork')?.value.trim(),income:$('#nmIncome')?.value}:null;
 const d=data(),h=d.histories[active]||(d.histories[active]=[]),now=Date.now();
 d.limits=d.limits||[];d.limits=d.limits.filter(t=>now-t<10*60*1000);if(d.limits.length>=20){$('#nmStatus').textContent='थोड़ा विराम लें; 10 मिनट में 20 नए सवालों की सीमा है।';return}
 if(!navigator.onLine){$('#nmStatus').textContent='ऑफ़लाइन मोड: सेव चैट उपलब्ध है, नया AI जवाब नहीं।';return}
 d.limits.push(now);saveData(d);
 let q=question||upload?.text||'इस सामग्री को समझाएँ',file=upload;upload=null;$('#nmUploadName').textContent='';
 const userText=question||('📎 '+(file?.name||'अपलोड की गई फ़ाइल'));h.push({role:'user',text:userText,at:now});if(h.length>100)h.splice(0,h.length-100);saveData(d);input.value='';drawChat();$('#nmStatus').textContent='जवाब तैयार हो रहा है…';
 try{
   let extra='',profile=null,sourceLinks=[];
   if(active==='schemes'){const x=await schemeSources(schemeInput);profile=x.profile;if(!x.results.length)throw Error('इस समय कोई आधिकारिक सरकारी स्रोत नहीं मिला। कृपया आधिकारिक पोर्टल पर सीधे जाँचें।');sourceLinks=x.results.map(z=>({title:z.title,url:z.url}));extra='\nकेवल नीचे दिए गए आधिकारिक government domain स्रोतों को उपयोग करें; इनमें से पात्रता सिद्ध न हो तो साफ़ कहें कि पुष्टि नहीं हुई।\n'+JSON.stringify(x.results);}
   if(file?.text)extra+='\nअपलोड की गई सामग्री (केवल इस अनुरोध के लिए; इसे स्थायी रूप से सेव न करें):\n'+file.text;
   if(profile)extra+='\nउपयोगकर्ता की पात्रता जानकारी: '+JSON.stringify(profile);
   const prompt=m.prompt+(active==='math'||active==='photo'?' अंतिम उत्तर को फिर से जाँचें।':'');
   const messages=[{role:'system',content:prompt},...h.slice(-8).map(x=>({role:x.role,content:x.text}))];
   let last=messages[messages.length-1];
   if(file?.image){last={role:'user',content:[{type:'text',text:q+'\n'+extra},{type:'image_url',image_url:{url:file.image}}]};messages[messages.length-1]=last;}
   else if(extra)last.content+=extra;
   if(active==='shopkeeper'&&/GST|जीएसटी/i.test(q)){const gst=(q.match(/(?:₹|Rs\.?\s*)?([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:at|@|पर)?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i)||[]);if(gst.length){const base=Number(gst[1].replace(/,/g,'')),rate=Number(gst[2]),tax=base*rate/100;if(Number.isFinite(base)&&Number.isFinite(rate)&&base>=0&&rate>=0&&rate<=100)last.content+='\nगणना की जाँच (उपयोगकर्ता द्वारा दी गई दर): कर-योग्य मूल्य ₹'+base.toFixed(2)+'; GST दर '+rate+'%; GST ₹'+tax.toFixed(2)+'; कुल ₹'+(base+tax).toFixed(2)+'. CGST/SGST बनाम IGST राज्य के अनुसार तय करें।';}else last.content+='\nपहले लागू GST दर पूछें; दर का अनुमान न लगाएँ।';}
   const ck=cacheKey(active,q+extra),cached=cacheGet(ck);let answer=cached;
   if(!answer){
     const cfg=await fetch(API+'/config');if(!cfg.ok)throw Error('AI सेवा अभी कॉन्फ़िगर नहीं है।');
     const config=await cfg.json(),r=await fetch(API+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:config.model,stream:false,max_tokens:900,messages})});
     const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||'AI provider उपलब्ध नहीं है।');
     answer=String(j.choices?.[0]?.message?.content||'').trim();if(!answer)throw Error('AI से खाली जवाब मिला।');cacheSet(ck,answer);
   }
   if(active==='document'&&/(RTI|सूचना अधिकार|शिकायत|आवेदन|application|ड्राफ्ट|draft)/i.test(q)&&!answer.includes('ये कानूनी सलाह नहीं है।'))answer+='\n\nये कानूनी सलाह नहीं है।';
   if(active==='schemes'&&!answer.includes('पक्का करने के लिए आधिकारिक साइट देखें'))answer+='\n\nपक्का करने के लिए आधिकारिक साइट देखें।';
   h.push({role:'assistant',text:answer,at:Date.now()});if(h.length>100)h.splice(0,h.length-100);saveData(d);drawChat();if(active==='voice')speak(answer);
   $('#nmStatus').textContent=cached?'सेव कैश से जवाब':'जवाब तैयार';
 }catch(e){h.push({role:'assistant',text:'⚠️ '+String(e.message||e),at:Date.now()});if(h.length>100)h.splice(0,h.length-100);saveData(d);drawChat();$('#nmStatus').textContent='';}
}
function speak(text){if(!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(text);u.lang=data().voiceLang||'hi-IN';speechSynthesis.cancel();speechSynthesis.speak(u)}
function voice(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){$('#nmStatus').textContent='इस ब्राउज़र में Speech Recognition उपलब्ध नहीं है; टाइप करके पूछें।';return}stopSpeech();recognition=new SR();recognition.lang=data().voiceLang||'hi-IN';recognition.interimResults=false;recognition.onresult=e=>{input.value=e.results[0][0].transcript;send()};recognition.onerror=()=>$('#nmStatus').textContent='माइक उपलब्ध नहीं; अनुमति जाँचें या टाइप करें।';recognition.start();$('#nmStatus').textContent='सुन रहा हूँ…'}
$('#nmClose').onclick=hide;$('#nmBack').onclick=drawHome;$('#nmSend').onclick=send;$('#nmMic').onclick=voice;
$('#nmFile').onclick=()=>$('#nmPick').click();$('#nmPick').onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{upload={...await extractFile(f),name:f.name};$('#nmUploadName').textContent='फ़ाइल तैयार: '+f.name+' (भेजने के बाद सर्वर पर सेव नहीं होगी)';}catch(err){$('#nmStatus').textContent=err.message}};
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
window.addEventListener('online',()=>{offline=false;if(active)drawChat()});window.addEventListener('offline',()=>{offline=true;if(active)drawChat()});
function addLaunchers(){
 const top=$('#top'),side=$('#side');
 const add=(host,id,label)=>{if(!host||document.getElementById(id))return;const b=document.createElement('button');b.id=id;b.type='button';b.textContent=label;b.addEventListener('click',show);host.append(b)};
 add(top,'novaModesTop','☷ मोड्स');add(side,'novaModesSide','☷ मोड्स खोलें');
 const home=document.createElement('button');home.id='novaModesHome';home.type='button';home.textContent='☷ सभी मोड्स खोलें';home.addEventListener('click',show);
 const hi=$('#hi');if(hi)hi.append(home);
 const settings=$('#dset');if(settings){const b=document.createElement('button');b.type='button';b.textContent='☷ मोड्स पेज';b.onclick=()=>{if(settings.open)settings.close();show()};settings.append(b)}
}
addLaunchers();
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
})();
