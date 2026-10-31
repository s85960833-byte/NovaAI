const BASE=process.env.NOVAAI_URL||'https://novaai-4auo.onrender.com';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let last='No response';
for(let i=0;i<36;i++){
  try{
    const [m,h,suite,tier,registry,workspace]=await Promise.all([
      fetch(BASE+'/manifest.webmanifest',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/nova-suite.js',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/s-tier.js',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/mode-registry.js',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/mode-workspace.js',{signal:AbortSignal.timeout(12000)})
    ]);
    const manifest=await m.json().catch(()=>({}));
    const html=await h.text();
    const suiteText=await suite.text();
    const tierText=await tier.text();
    const registryText=await registry.text();
    const workspaceText=await workspace.text();
    const suiteMarkers=['Project Brain','Reality Check','AI Council','Digital Hands','Time Machine','Model Arena','Watchtower','Knowledge Vault','Trust Shield','Idea-to-Business'];
    last='manifest HTTP '+m.status+' lang='+manifest.lang+', homepage HTTP '+h.status+', suite HTTP '+suite.status+', home HTTP '+tier.status+', registry HTTP '+registry.status+', workspace HTTP '+workspace.status;
    if(m.ok&&h.ok&&suite.ok&&tier.ok&&registry.ok&&workspace.ok&&manifest.lang==='hi'&&manifest.display==='standalone'&&html.includes("const L=['English','हिन्दी|Hindi'];")&&html.includes('hi:{')&&html.includes('/mode-workspace.js')&&html.includes('/mode-registry.js')&&html.includes('/nova-suite.js')&&html.includes('id="nova-indian-heritage"')&&html.includes('--acc:#e8a34b')&&suiteMarkers.every(x=>suiteText.includes(x))&&suiteText.includes('auditCouncilCitations')&&suiteText.includes('INVALID SOURCE ID')&&suiteText.includes('Citation audit warning')&&suiteText.includes('Nova Build Studio')&&suiteText.includes('nsImageStudio')&&['Nova Study','Nova Build','Nova Chat','Nova Voice','data-cat="study"','data-cat="build"','data-cat="chat"','data-cat="voice"'].every(x=>tierText.includes(x))&&['Nova Study','Nova Build','Nova Chat','Nova Voice · Voice Chat'].every(x=>registryText.includes(x))&&workspaceText.includes('openGroup(group)')&&!workspaceText.includes("add(top,'novaModesTop'")){ 
      console.log('PASS Render serves bilingual revision, Indian heritage theme, and AI Council citation audit');
      process.exit(0);
    }
  }catch(e){last=String(e.message||e)}
  console.log('Waiting for Render deployment ('+(i+1)+'/36): '+last);
  await sleep(10000);
}
throw new Error('Render did not serve the merged bilingual S-Tier Studio revision within six minutes: '+last);
