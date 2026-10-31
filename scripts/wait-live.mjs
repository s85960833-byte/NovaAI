const BASE=process.env.NOVAAI_URL||'https://novaai-4auo.onrender.com';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let last='No response';
for(let i=0;i<36;i++){
  try{
    const [m,h,suite]=await Promise.all([
      fetch(BASE+'/manifest.webmanifest',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/nova-suite.js',{signal:AbortSignal.timeout(12000)})
    ]);
    const manifest=await m.json().catch(()=>({}));
    const html=await h.text();
    const suiteText=await suite.text();
    const suiteMarkers=['Project Brain','Reality Check','AI Council','Digital Hands','Time Machine','Model Arena','Watchtower','Knowledge Vault','Trust Shield','Idea-to-Business'];
    last='manifest HTTP '+m.status+' lang='+manifest.lang+', homepage HTTP '+h.status+', suite HTTP '+suite.status;
    if(m.ok&&h.ok&&suite.ok&&manifest.lang==='hi'&&manifest.display==='standalone'&&html.includes("const L=['English','हिन्दी|Hindi'];")&&html.includes('hi:{')&&html.includes('/mode-workspace.js')&&html.includes('/mode-registry.js')&&html.includes('/nova-suite.js')&&html.includes('id="nova-indian-heritage"')&&html.includes('--acc:#e8a34b')&&suiteMarkers.every(x=>suiteText.includes(x))&&suiteText.includes('auditCouncilCitations')&&suiteText.includes('INVALID SOURCE ID')&&suiteText.includes('Citation audit warning')){
      console.log('PASS Render serves bilingual revision, Indian heritage theme, and AI Council citation audit');
      process.exit(0);
    }
  }catch(e){last=String(e.message||e)}
  console.log('Waiting for Render deployment ('+(i+1)+'/36): '+last);
  await sleep(10000);
}
throw new Error('Render did not serve the merged bilingual S-Tier Studio revision within six minutes: '+last);
