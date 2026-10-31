const BASE=process.env.NOVAAI_URL||'https://novaai-4auo.onrender.com';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let last='No response';
for(let i=0;i<36;i++){
  try{
    const [m,h,suite,tier,registry,workspace,brandIcon]=await Promise.all([
      fetch(BASE+'/manifest.webmanifest',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/nova-suite.js',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/s-tier.js',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/mode-registry.js',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/mode-workspace.js',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/icons/nova-emblem.svg',{signal:AbortSignal.timeout(12000)})
    ]);
    const manifest=await m.json().catch(()=>({}));
    const html=await h.text();
    const suiteText=await suite.text();
    const tierText=await tier.text();
    const registryText=await registry.text();
    const workspaceText=await workspace.text();
    const brandSvg=await brandIcon.text();
    const suiteMarkers=['Project Brain','Reality Check','AI Council','Digital Hands','Time Machine','Model Arena','Watchtower','Knowledge Vault','Trust Shield','Idea-to-Business'];
    last='manifest HTTP '+m.status+' lang='+manifest.lang+', homepage HTTP '+h.status+', suite HTTP '+suite.status+', home HTTP '+tier.status+', registry HTTP '+registry.status+', workspace HTTP '+workspace.status;
    if(m.ok&&h.ok&&suite.ok&&tier.ok&&registry.ok&&workspace.ok&&brandIcon.ok&&brandSvg.includes('<svg')&&manifest.lang==='en-IN'&&manifest.display==='standalone'&&manifest.short_name==='NOVA'&&html.includes("const L=['English','हिन्दी|Hindi'];")&&html.includes('hi:{')&&html.includes('/mode-workspace.js')&&html.includes('/mode-registry.js')&&html.includes('/nova-suite.js')&&html.includes('id="nova-indian-heritage"')&&html.includes('--acc:#e8a34b')&&suiteMarkers.every(x=>suiteText.includes(x))&&suiteText.includes('auditCouncilCitations')&&suiteText.includes('INVALID SOURCE ID')&&suiteText.includes('Citation audit warning')&&suiteText.includes('const auditedAnswer=auditCouncilCitations(answer,found.length)')&&suiteText.includes('const auditedFinal=auditCouncilCitations(final,found.length)')&&suiteText.includes('Nova Build Studio')&&suiteText.includes('nsImageStudio')&&suiteText.includes('nsAppBuilder')&&suiteText.includes("openMode('builder')")&&['Chat &amp; Study','Voice Chat','Create','Explore','data-cat="chat-study"','data-cat="create"','data-cat="explore"','data-cat="voice"','hiEl.replaceChildren(e)',"n.id==='hi'"].every(x=>tierText.includes(x))&&['Chat & Study','Voice Chat','Create','Explore'].every(x=>registryText.includes(x))&&registryText.includes("id:'builder',group:'create'")&&workspaceText.includes('openGroup(group)')&&!workspaceText.includes("add(top,'novaModesTop'")&&tierText.includes('n-brandbar')&&tierText.includes('n-living-core')&&tierText.includes('id="novaLivingCore"')&&tierText.includes('nCoreOrbitA')&&tierText.includes('function livingCore()')&&tierText.includes('function ambientAtmosphere()')&&tierText.includes('novaAtmosphere')&&tierText.includes('nova-aurora')&&tierText.includes('requestAnimationFrame(draw)')&&tierText.includes('nova-lite-motion')&&tierText.includes('IntersectionObserver')&&tierText.includes('DESIGNED IN INDIA · BUILT FOR THE WORLD')&&tierText.includes('smooth-performance layer')&&tierText.includes('setTimeout(finish,1450)')&&tierText.includes('novaTurn 54s linear infinite')&&tierText.includes('novaSealTurn 42s linear infinite')&&tierText.includes('prefers-reduced-motion:no-preference')&&tierText.includes('novaRoyalSheen 11s ease-in-out infinite')&&html.includes('nova-performance-polish')&&html.includes('novaFastReveal')){ 
      console.log('PASS Render serves NOVA royal brand, lightweight motion, fast rendering, install icon, bilingual revision and AI Council citation audit');
      process.exit(0);
    }
  }catch(e){last=String(e.message||e)}
  console.log('Waiting for Render deployment ('+(i+1)+'/36): '+last);
  await sleep(10000);
}
throw new Error('Render did not serve the merged bilingual S-Tier Studio revision within six minutes: '+last);
