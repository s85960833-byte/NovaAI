const BASE=process.env.NOVAAI_URL||'https://novaai-4auo.onrender.com';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let last='No response';
for(let i=0;i<36;i++){
  try{
    const [m,h]=await Promise.all([
      fetch(BASE+'/manifest.webmanifest',{signal:AbortSignal.timeout(12000)}),
      fetch(BASE+'/',{signal:AbortSignal.timeout(12000)})
    ]);
    const manifest=await m.json().catch(()=>({}));
    const html=await h.text();
    last='manifest HTTP '+m.status+' lang='+manifest.lang+', homepage HTTP '+h.status;
    if(m.ok&&h.ok&&manifest.lang==='hi'&&manifest.display==='standalone'&&html.includes("const L=['English','हिन्दी|Hindi'];")&&html.includes('hi:{')&&html.includes('nova_modes_v1')){
      console.log('PASS Render serves merged bilingual revision');
      process.exit(0);
    }
  }catch(e){last=String(e.message||e)}
  console.log('Waiting for Render deployment ('+(i+1)+'/36): '+last);
  await sleep(10000);
}
throw new Error('Render did not serve the merged bilingual revision within six minutes: '+last);
