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
    last='manifest HTTP '+m.status+', homepage HTTP '+h.status+', health HTTP '+health.status+', icon HTTP '+icon.status;
    if(m.ok&&h.ok&&health.ok&&icon.ok&&manifest.short_name==='NOVA'&&healthData.status==='ok'&&html.includes('<html lang="en">')&&html.includes('id="msgs"')&&html.includes('id="dset"')&&html.includes('id="photo"')&&html.includes("localStorage.getItem('nova')")&&html.includes("localStorage.setItem('nova',JSON.stringify(S))")&&!html.includes('id="novaSplash"')&&!html.includes('id="novaLivingCore"')&&html.includes('hi:{')&&svg.includes('<svg')){
      console.log('PASS Render serves the previous standard NOVA chat UI, Settings/image panels, legacy chat storage, health endpoint and PWA identity');
      process.exit(0);
    }
  }catch(e){last=String(e.message||e)}
  console.log('Waiting for Render deployment ('+(i+1)+'/36): '+last);
  await sleep(10000);
}
throw new Error('Render did not serve the restored standard NOVA UI within six minutes: '+last);
