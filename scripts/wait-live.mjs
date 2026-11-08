const BASE=process.env.NOVAAI_URL||'https://novaai-4auo.onrender.com';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let last='No response';
for(let i=0;i<36;i++){
  try{
    const [m,h,health,icon]=await Promise.all([
      fetch(BASE+'/manifest.webmanifest',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/health',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/icons/nova-emblem.svg',{signal:AbortSignal.timeout(12000)})
    ]);
    const manifest=await m.json().catch(()=>({}));
    const html=await h.text();
    const healthData=await health.json().catch(()=>({}));
    const svg=await icon.text();
    const referenceResponse=await fetch(BASE+'/nova-reference.js',{signal:AbortSignal.timeout(12000)});
    const reference=await referenceResponse.text();
    last='manifest HTTP '+m.status+', homepage HTTP '+h.status+', health HTTP '+health.status+', icon HTTP '+icon.status;
    if(m.ok&&h.ok&&health.ok&&icon.ok&&referenceResponse.ok&&['NOVA Build / नोवा बिल्ड','NOVA Learn / नोवा लर्न','NOVA Agents / नोवा एजेंट्स','body.nova-dashboard-home #box'].every(x=>reference.includes(x))&&!reference.includes('id=\"nrAsk\"')&&!reference.includes('data-nr=')&&manifest.short_name==='NOVA'&&healthData.status==='ok'&&html.includes('<html lang="en">')&&html.includes('id="msgs"')&&html.includes('id="dset"')&&html.includes('id="photo"')&&html.includes("localStorage.getItem('nova')")&&html.includes("localStorage.setItem('nova',JSON.stringify(S))")&&['nova-home','nova-hero','nova-workspaces','nova-tool-grid'].every(x=>html.includes(x))&&['src="/mode-registry.js"','src="/mode-workspace.js"','src="/nova-suite.js"','src="/s-tier.js"','src="/nova-reference.js"'].every(x=>html.includes(x))&&!html.includes('id="novaSplash"')&&!html.includes('id="novaLivingCore"')&&html.includes('hi:{')&&!html.includes('id="nova-future-style"')&&!html.includes('id="nova-future-script"')&&!html.includes('nova-living-core')&&!html.includes('INDIAN SOUL • FUTURE INTELLIGENCE')&&svg.includes('<svg')){
      const reference=await fetch(BASE+'/nova-reference.js',{signal:AbortSignal.timeout(12000)});const refText=await reference.text();if(!reference.ok||!refText.includes('nr-hero')||!refText.includes('nr-cards')||!refText.includes('nr-journey'))throw new Error('Reference dashboard asset is not live or is incomplete');
      console.log('PASS Render serves NOVA reference dashboard, three workspaces, photo/voice bridges, legacy chat storage, Settings/image panels, health endpoint and PWA identity');
      process.exit(0);
    }
  }catch(e){last=String(e.message||e)}
  console.log('Waiting for Render deployment ('+(i+1)+'/36): '+last);
  await sleep(10000);
}
throw new Error('Render did not serve the restored standard NOVA UI within six minutes: '+last);
