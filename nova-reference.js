(()=>{'use strict';
const $=s=>document.querySelector(s),isHi=()=>document.documentElement.lang==='hi'||(()=>{try{return JSON.parse(localStorage.getItem('nova')||'{}').uiLang==='hi'}catch{return false}})(),tr=(en,hi)=>isHi()?hi:en;
const css=`
html,body{background:#050817!important}body{background-image:radial-gradient(ellipse at 75% 10%,#18216b55,transparent 40%),radial-gradient(ellipse at 90% 80%,#5514a522,transparent 38%)!important}
#side{width:218px!important;min-width:218px;background:linear-gradient(180deg,#080d20f5,#090b1bf5)!important;border-right:1px solid #263a7b!important;padding:16px 12px!important;gap:12px!important}
#side .brand{padding:6px 6px 16px!important;border-bottom:1px solid #27366e}#side .brand b{font:800 22px Nunito,"Noto Sans Devanagari","Nirmala UI",Mangal,system-ui;color:#fff}#side .logo,#top .logo{width:40px;height:40px;border-radius:13px;background:linear-gradient(135deg,#12d9ff,#773cff 55%,#ee4dff)!important;color:#fff!important;box-shadow:0 0 22px #5d42ff88}
#side button,#side select,#side input{background:transparent!important;border-color:transparent!important;color:#dce7ff!important}
/* Keep legacy global shortcuts out of the new three-workspace navigation. */
#new,#nPhoto,#nArch,#nImg,#nLive{display:none!important}#side #new{border:1px solid #3156bc!important;background:linear-gradient(100deg,#142b68,#24134c)!important;font-weight:800}#side .nav button{border-radius:12px!important;padding:11px 12px!important;font-weight:700}#side #nHome{background:linear-gradient(100deg,#5324e8,#2610a8)!important;border-color:#8e65ff!important;box-shadow:0 0 18px #743cff66}#side #q{background:#0d1530!important;border:1px solid #29396e!important;border-radius:12px!important}
#top{min-height:66px;padding:10px 18px!important;gap:12px!important;background:#070b1bdc!important;border-bottom:1px solid #25366f!important;backdrop-filter:blur(16px)}#top>b{color:#f6f7ff}#msgs{padding:16px clamp(10px,2vw,26px)!important}
#hi{max-width:1500px!important;width:100%;padding:8px 0 28px!important;margin:0 auto!important;color:#f5f7ff!important}#hi .nr-wrap{display:grid;gap:15px}
#hi .nr-hero{position:relative;isolation:isolate;min-height:285px;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:12px;overflow:hidden;padding:clamp(22px,3vw,38px);border:1px solid #4c59d9;border-radius:26px;background:radial-gradient(ellipse at 76% 40%,#1558d866,transparent 38%),radial-gradient(ellipse at 90% 0%,#bd4bff33,transparent 40%),linear-gradient(115deg,#07132f,#101044 56%,#081c3a);box-shadow:0 0 35px #314bff38,inset 0 1px #ffffff20}
#hi .nr-kicker{color:#8deaff;font-size:10px;font-weight:900;letter-spacing:.22em}#hi .nr-title{font:900 clamp(38px,6vw,68px)/.98 Nunito,"Noto Sans Devanagari","Nirmala UI",Mangal,system-ui;letter-spacing:-.045em;margin:12px 0 10px;color:#fff;text-shadow:0 0 24px #39b9ff55}#hi .nr-title span{background:linear-gradient(90deg,#b9f5ff,#a88aff 70%,#ff85db);background-clip:text;-webkit-background-clip:text;color:transparent}
#hi .nr-tag{font-size:clamp(15px,2vw,20px);font-weight:800;color:#fff;margin:0 0 6px}#hi .nr-desc{max-width:520px;color:#c4d4f5;font-size:13px;line-height:1.65;margin:0}#hi .nr-pill{display:inline-block;margin-top:18px;padding:9px 15px;border:1px solid #a05dff;border-radius:99px;background:linear-gradient(90deg,#5b26d8,#1a4ba7);box-shadow:0 0 20px #9c42ff77;color:white;font-size:12px;font-weight:900}
#hi .nr-scene{position:relative;height:230px;overflow:hidden}#hi .nr-sun{position:absolute;width:180px;height:180px;right:24%;top:4%;border-radius:50%;background:radial-gradient(circle,#ffc45b55,#fa7c3220 48%,transparent 72%)}#hi .nr-city{position:absolute;inset:auto 0 20px;height:110px;background:linear-gradient(0deg,#101e55,#152e6855);clip-path:polygon(0 100%,0 70%,5% 70%,5% 34%,10% 34%,10% 58%,16% 58%,16% 18%,20% 18%,20% 54%,25% 54%,25% 38%,31% 38%,31% 8%,35% 8%,35% 60%,40% 60%,40% 32%,47% 32%,47% 65%,54% 65%,54% 20%,60% 20%,60% 58%,68% 58%,68% 30%,75% 30%,75% 66%,83% 66%,83% 22%,89% 22%,89% 62%,95% 62%,95% 40%,100% 40%,100% 100%)}
#hi .nr-gate{position:absolute;bottom:20px;left:44%;width:78px;height:120px;border:5px solid #ffbd55;border-bottom:0;border-radius:42px 42px 0 0;filter:drop-shadow(0 0 16px #ff9c32);background:linear-gradient(90deg,#a75d2b66,#ffd47b55,#a75d2b66)}#hi .nr-gate:before{content:"";position:absolute;left:50%;top:-22px;transform:translateX(-50%);width:100px;height:16px;border:3px solid #ffc85d;border-radius:4px;background:#8a4b4b}#hi .nr-gate:after{content:"";position:absolute;inset:20px 18px 0;border:2px solid #ffcf72;border-bottom:0;border-radius:30px 30px 0 0}
#hi .nr-train{position:absolute;right:0;bottom:20px;width:54%;height:40px;border-radius:30px 14px 7px 7px;background:linear-gradient(180deg,#f7fbff,#a7d7ef 60%,#3b8acb);box-shadow:0 0 25px #37b9ff99;transform:skewX(-14deg)}#hi .nr-train:before{content:"";position:absolute;left:12%;top:8px;width:58%;height:12px;border-radius:14px;background:repeating-linear-gradient(90deg,#092b65 0 18px,#c7edff 19px 22px)}
#hi .nr-flag{position:absolute;left:5%;top:8px;width:100px;height:54px;transform:rotate(-9deg);border-radius:3px;background:linear-gradient(#ff9933 0 33%,#fff 33% 66%,#138808 66%);box-shadow:0 6px 20px #0007}#hi .nr-flag:after{content:"";position:absolute;width:12px;height:12px;left:44px;top:21px;border:2px solid #234a9a;border-radius:50%}
#hi .nr-ai{position:absolute;right:4%;top:0;width:110px;height:170px;border-radius:60px 60px 36px 36px;border:1px solid #2dd7ff;background:radial-gradient(ellipse at 50% 38%,#3cdbff,#1040a5 38%,#07122d 70%);box-shadow:0 0 38px #10aaff99}#hi .nr-ai:before{content:"";position:absolute;left:20px;right:20px;top:48px;height:38px;border-radius:30px;background:linear-gradient(90deg,#03122b,#6eeaff,#03122b);box-shadow:0 0 18px #33dfff}
#hi .nr-journey{display:grid;grid-template-columns:1fr repeat(3,65px);align-items:center;gap:8px;padding:13px 15px;border:1px solid #3869d5;border-radius:18px;background:linear-gradient(110deg,#0b163b,#15113d);box-shadow:0 0 20px #2759ff33}#hi .nr-journey strong{font-size:12px;color:#e9edff}#hi .nr-journey small{display:block;color:#aebfe8;font-size:9px}#hi .nr-count{text-align:center;border-left:1px solid #4d5bb5;padding-left:7px}#hi .nr-count b{display:block;font-size:20px;color:white}
#hi .nr-ask{display:flex;align-items:center;gap:8px;padding:7px 8px 7px 15px;border:1px solid #398cff;border-radius:99px;background:linear-gradient(100deg,#07142e,#100d32 65%,#251044);box-shadow:0 0 20px #236bff66,inset 0 1px #ffffff22}#hi .nr-ask input{min-width:0;flex:1;border:0;background:transparent;color:white;padding:10px 4px;outline:0}#hi .nr-ask button{width:38px;height:38px;flex:0 0 38px;border:1px solid #536ee4;border-radius:50%;background:#141c4a;color:white}#hi .nr-ask svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.7}#hi .nr-ask .nr-send{background:linear-gradient(135deg,#8b42ff,#dc42ff);box-shadow:0 0 15px #c147ff99}
#hi .nr-section{display:flex;align-items:center;gap:12px;color:#b4c6ef;font-size:10px;font-weight:900;letter-spacing:.22em}#hi .nr-section:before,#hi .nr-section:after{content:"";height:1px;flex:1;background:linear-gradient(90deg,transparent,#5164d8)}#hi .nr-section:after{transform:scaleX(-1)}
#hi .nr-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}#hi .nr-card{min-width:0;min-height:185px;display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:17px;border:1px solid #476bdb;border-radius:20px;color:white;background:radial-gradient(ellipse at 100% 0%,#2960d755,transparent 55%),linear-gradient(145deg,#0d1d4b,#111038 72%,#0a1834);box-shadow:0 12px 28px -16px #000,0 0 18px #304cff30;transition:transform .2s,border-color .2s,box-shadow .2s}#hi .nr-card:hover{transform:translateY(-4px);border-color:#a57aff;box-shadow:0 0 25px #5c4dff66}#hi .nr-card.build{background:radial-gradient(ellipse at 50% 0%,#04baff44,transparent 55%),linear-gradient(145deg,#081b42,#10104a)}#hi .nr-card.learn{background:radial-gradient(ellipse at 50% 0%,#d34dff40,transparent 55%),linear-gradient(145deg,#241044,#140c35)}#hi .nr-card.agent{background:radial-gradient(ellipse at 50% 0%,#ffb32d44,transparent 55%),linear-gradient(145deg,#43230e,#1c1030)}
#hi .nr-card-icon{width:50px;height:50px;display:grid;place-items:center;border-radius:15px;border:1px solid #7ca3ff66;background:#101d50;color:#8deaff}#hi .nr-card-icon svg{width:27px;height:27px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}#hi .nr-card h2{font-size:20px;margin:13px 0 4px;color:#fff}#hi .nr-card p{font-size:11px;line-height:1.55;color:#c2ccef;margin:0}#hi .nr-cta{display:flex;justify-content:space-between;width:100%;margin-top:auto;padding:10px 12px;border:1px solid #6d76ff;border-radius:99px;background:linear-gradient(90deg,#162c82,#3613a3);font-size:11px;font-weight:900}
#hi .nr-bottom{display:grid;grid-template-columns:1.3fr .7fr;gap:12px}#hi .nr-features{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}#hi .nr-feature{padding:13px;border:1px solid #354c9c;border-radius:15px;background:linear-gradient(145deg,#0d1838,#151035)}#hi .nr-feature b{display:block;font-size:12px;color:#f0f3ff}#hi .nr-feature small{display:block;margin-top:4px;color:#aebee4;font-size:10px;line-height:1.4}#hi .nr-made{display:flex;align-items:center;justify-content:center;gap:10px;padding:14px;border:1px solid #a07a40;border-radius:15px;background:linear-gradient(100deg,#162347,#311b3c);color:#ffe29a;font-size:12px;font-weight:900}
#nrSidebarLinks{display:flex;flex-direction:column;gap:5px;padding-top:8px;border-top:1px solid #27366e}#nrSidebarLinks button{text-align:left;padding:10px 12px;border:1px solid transparent;border-radius:11px;background:transparent;color:#dce7ff;font-weight:700}#nrSidebarLinks button:hover{background:#151d42;border-color:#3249a3}
@media(max-width:980px){#hi .nr-hero{grid-template-columns:1fr .8fr}#hi .nr-bottom{grid-template-columns:1fr}}
@media(max-width:760px){#side{width:270px!important;min-width:270px}#top{gap:7px;padding:8px 10px!important}#hi{padding:0 0 18px!important}#hi .nr-hero{grid-template-columns:1fr;min-height:0;padding:20px 17px}#hi .nr-scene{height:150px}#hi .nr-ai{width:72px;height:112px;right:6%}#hi .nr-gate{transform:scale(.78);transform-origin:bottom left;left:43%}#hi .nr-journey{grid-template-columns:1fr repeat(3,50px);padding:10px}#hi .nr-cards{grid-template-columns:1fr;gap:10px}#hi .nr-card{min-height:150px;padding:15px}#hi .nr-features{grid-template-columns:1fr 1fr}#hi .nr-made{grid-column:1/-1}#hi .nr-ask{border-radius:18px;gap:4px;padding:6px}#hi .nr-ask button{width:34px;height:34px;flex-basis:34px}}
@media(max-width:380px){#hi .nr-journey{grid-template-columns:1fr repeat(3,42px)}#hi .nr-title{font-size:37px}}
@media(prefers-reduced-motion:reduce){#hi .nr-card{transition:none!important}}
/* Android/mobile: keep the app canvas edge-to-edge; the sidebar is an overlay drawer. */
@media(max-width:900px), (pointer:coarse) and (max-width:1100px){
  html,body{width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:hidden!important}
  body{display:flex!important;flex-direction:row!important}
  #side{position:fixed!important;inset:0 auto 0 0!important;width:min(84vw,300px)!important;min-width:0!important;max-width:84vw!important;z-index:50!important;transform:translateX(-105%)!important}
  [dir=rtl] #side{inset:0 0 0 auto!important;transform:translateX(105%)!important}
  #side.open{transform:translateX(0)!important}
  [dir=rtl] #side.open{transform:translateX(0)!important}
  #scrim{z-index:49!important}
  #main{display:flex!important;flex:1 1 0%!important;width:100%!important;min-width:0!important;max-width:100vw!important;margin:0!important}
  #top,#msgs,#box{width:100%!important;max-width:100%!important;min-width:0!important}
  #msgs{flex:1 1 0%;overflow-x:hidden!important}
  #log,.w{width:100%!important;max-width:100%!important;min-width:0!important}
  #hi{width:100%!important;max-width:100%!important;margin:0!important;padding-inline:10px!important}
}
@supports(width:100dvw){
  @media(max-width:900px), (pointer:coarse) and (max-width:1100px){
    #main{width:100dvw!important;max-width:100dvw!important}
  }
}

body.nova-dashboard-home:not(.nova-image-mode) #box,body.nova-dashboard-home:not(.nova-image-mode) .note{display:none!important}
#nrGlobalSearch{min-height:44px}
#nrSidebarLinks button{min-height:44px}
#nrSidebarLinks button:focus-visible{outline:3px solid #8deaff;outline-offset:3px}
#hi .nr-card:focus-visible{outline:3px solid #8deaff;outline-offset:4px}
@media(prefers-reduced-motion:reduce){#hi .nr-card{transition:none!important;transform:none!important}#nrSidebarLinks button{transition:none!important}}
@media(hover:none){#hi .nr-card:hover{transform:none!important;box-shadow:0 12px 28px -16px #000,0 0 18px #304cff30}}

`;
function style(){if($('#nova-reference-style'))return;const s=document.createElement('style');s.id='nova-reference-style';s.textContent=css;document.head.append(s)}
const svg={build:'<svg viewBox="0 0 24 24"><path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/></svg>',learn:'<svg viewBox="0 0 24 24"><path d="M2 8 12 3l10 5-10 5L2 8Z"/><path d="M6 10v6c3 3 9 3 12 0v-6"/></svg>',agent:'<svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M9 13h.01M15 13h.01M9 17h6"/></svg>'};
function render(root){
 if(!root||root.dataset.referenceUi==='1')return;
 root.dataset.referenceUi='1';document.body.classList.add('nova-dashboard-home');
 let chats=0,projects=0,apps=0;
 try{const s=JSON.parse(localStorage.getItem('nova')||'{}');chats=Array.isArray(s.chats)?s.chats.length:0}catch{}
 try{const s=JSON.parse(localStorage.getItem('nova_suite_v1')||'{}');projects=Array.isArray(s.projects)?s.projects.length:0;apps=Array.isArray(s.apps)?s.apps.length:0}catch{}
 const hour=new Date().getHours(),g=hour<12?tr('Good morning','सुप्रभात'):hour<17?tr('Welcome back','वापस स्वागत है'):tr('Good evening','शुभ संध्या');
 root.innerHTML=
 '<div class="nr-wrap"><section class="nr-hero"><div><div class="nr-kicker">✦ '+tr('NEXT-GENERATION INTELLIGENCE · MADE FOR INDIA','नई पीढ़ी की बुद्धिमत्ता · भारत के लिए')+'</div><h1 class="nr-title">'+tr('Welcome to','स्वागत है')+'<br><span>NOVA AI</span></h1><p class="nr-tag">'+tr('One AI. Three powerful ways to work, learn, and create.','एक AI। काम, सीखने और निर्माण के तीन शक्तिशाली तरीके।')+'</p><p class="nr-desc">'+g+'. '+tr('Explore your connected AI workspaces, create, and learn — all in one place.','अपने AI वर्कस्पेस खोजें, बनाएँ और सीखें — सब एक ही जगह।')+'</p><div class="nr-pill">✦ '+tr('Smarter · Faster · More Powerful','और स्मार्ट · तेज़ · अधिक शक्तिशाली')+'</div></div><div class="nr-scene" aria-hidden="true"><div class="nr-sun"></div><div class="nr-orbit"></div><div class="nr-flag"></div><div class="nr-ai"></div><div class="nr-city"></div><div class="nr-gate"></div><div class="nr-train"></div></div></section>'+
 '<section class="nr-journey"><strong>✦ '+tr('Your AI Journey','आपकी AI यात्रा')+'<small>'+tr('Your workspaces, one intelligent companion.','आपके वर्कस्पेस, एक बुद्धिमान साथी।')+'</small></strong><span class="nr-count"><b>'+chats+'</b><small>'+tr('Chats','चैट')+'</small></span><span class="nr-count"><b>'+apps+'</b><small>'+tr('Apps','ऐप्स')+'</small></span><span class="nr-count"><b>'+projects+'</b><small>'+tr('Projects','प्रोजेक्ट')+'</small></span></section>'+
 '<div class="nr-section">'+tr('CHOOSE YOUR WORKSPACE','अपना वर्कस्पेस चुनें')+'</div><div class="nr-cards">'+
 '<button class="nr-card build" type="button" data-group="build" aria-label="'+tr('NOVA Build','नोवा बिल्ड')+'"><span class="nr-card-icon" aria-hidden="true">'+svg.build+'</span><h2>NOVA Build / नोवा बिल्ड</h2><p>'+tr('Create apps, websites, SaaS products, dashboards and prototypes with AI.','AI की मदद से ऐप, वेबसाइट, SaaS उत्पाद, डैशबोर्ड और प्रोटोटाइप बनाएँ।')+'</p><span class="nr-cta">'+tr('Start Building','बनाना शुरू करें')+' <b>→</b></span></button>'+
 '<button class="nr-card learn" type="button" data-group="learn" aria-label="'+tr('NOVA Learn','नोवा लर्न')+'"><span class="nr-card-icon" aria-hidden="true">'+svg.learn+'</span><h2>NOVA Learn / नोवा लर्न</h2><p>'+tr('Explore knowledge, study subjects, understand lessons and prepare for exams.','ज्ञान खोजें, विषय पढ़ें, पाठ समझें और परीक्षाओं की तैयारी करें।')+'</p><span class="nr-cta">'+tr('Start Learning','पढ़ना शुरू करें')+' <b>→</b></span></button>'+
 '<button class="nr-card agent" type="button" data-group="agents" aria-label="'+tr('NOVA Agents','नोवा एजेंट्स')+'"><span class="nr-card-icon" aria-hidden="true">'+svg.agent+'</span><h2>NOVA Agents / नोवा एजेंट्स</h2><p>'+tr('Your AI agents for chat, voice, research, documents and guided workflows.','चैट, वॉइस, रिसर्च, दस्तावेज़ और निर्देशित कार्यों के लिए आपके AI एजेंट।')+'</p><span class="nr-cta">'+tr('Meet Your Agents','अपने एजेंट्स खोलें')+' <b>→</b></span></button></div>'+
 '<div class="nr-bottom"><div class="nr-features"><div class="nr-feature"><b>◎ '+tr('Real-Time Web Search','रीयल-टाइम वेब खोज')+'</b><small>'+tr('Find fresh information and sources.','नई जानकारी और स्रोत खोजें।')+'</small></div><div class="nr-feature"><b>▧ '+tr('Multimodal AI','मल्टीमॉडल AI')+'</b><small>'+tr('Text · Image · Voice · Documents','टेक्स्ट · इमेज · वॉइस · दस्तावेज़')+'</small></div><div class="nr-feature"><b>⚡ '+tr('Fast & Lightweight','तेज़ और हल्का')+'</b><small>'+tr('Responsive layout and reduced-motion support.','तेज़ लेआउट और कम मोशन सपोर्ट।')+'</small></div></div><div class="nr-made"><span aria-hidden="true">🇮🇳</span><div>'+tr('MADE FOR INDIA','भारत के लिए')+'<small style="display:block;color:#c8d5ee;font-size:9px">'+tr('BUILT FOR THE WORLD','दुनिया के लिए')+'</small></div></div></div></div>';
 root.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>window.NovaModeWorkspace?.openGroup?.(b.dataset.group)));
}
function boot(){
 style();
 const top=$('#top');
 if(top&&!$('#nrGlobalSearch')){
  const s=document.createElement('input');s.id='nrGlobalSearch';s.type='search';s.autocomplete='off';
  s.placeholder='⌕  '+tr('Search saved chats…','सेव की गई चैट खोजें…');
  s.setAttribute('aria-label',tr('Search saved chats','सेव की गई चैट खोजें'));
  s.style.cssText='flex:1;min-width:70px;max-width:450px;min-height:44px;margin:auto;padding:10px 15px;border:1px solid #354da0;border-radius:99px;background:#0b1230;color:#fff';
  s.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const side=$('#side');side?.classList.add('open');const q=$('#q');if(q&&s.value.trim()){q.value=s.value.trim();q.dispatchEvent(new Event('input',{bubbles:true}));q.focus()}}};
  top.insertBefore(s,top.querySelector('#mode'));
 }
 const side=$('#side'),nav=side?.querySelector('.nav');
 if(nav&&!$('#nrSidebarLinks')){
  const x=document.createElement('div');x.id='nrSidebarLinks';
  const links=[['build','⌘',tr('NOVA Build','नोवा बिल्ड')],['learn','▱',tr('NOVA Learn','नोवा लर्न')],['agents','◈',tr('NOVA Agents','नोवा एजेंट्स')]];
  links.forEach(([key,icon,label])=>{const b=document.createElement('button');b.type='button';b.dataset.k=key;b.textContent=icon+'　'+label;b.addEventListener('click',()=>{window.NovaModeWorkspace?.openGroup?.(key)});x.append(b)});
  nav.after(x);
 }
 const host=$('#log');
 if(host){
  const apply=()=>{const root=$('#hi');if(root&&!root.hidden){render(root);document.body.classList.add('nova-dashboard-home')}else document.body.classList.remove('nova-dashboard-home')};
  apply();
  new MutationObserver(apply).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  window.addEventListener('nova:ui-language-changed',()=>{const root=$('#hi');if(root&&!root.hidden){delete root.dataset.referenceUi;render(root);}const search=$('#nrGlobalSearch');if(search){search.placeholder='⌕  '+tr('Search saved chats…','सेव की गई चैट खोजें…');search.setAttribute('aria-label',tr('Search saved chats','सेव की गई चैट खोजें'));}const links=$('#nrSidebarLinks');if(links){const pairs=[['NOVA Build','नोवा बिल्ड'],['NOVA Learn','नोवा लर्न'],['NOVA Agents','नोवा एजेंट्स']];links.querySelectorAll('button').forEach((b,i)=>{if(pairs[i])b.textContent=['⌘','▱','◈'][i]+'　'+tr(...pairs[i])})}});
 }
}
if($('#log')&&$('#top'))boot();else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();