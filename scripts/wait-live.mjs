const BASE = process.env.NOVAAI_URL || 'https://novaai-4auo.onrender.com';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let last = 'No response';

for (let i = 0; i < 36; i++) {
  try {
    const [
      manifestResponse,
      homepageResponse,
      healthResponse,
      iconResponse,
      appResponse,
      accountResponse,
      referenceResponse,
      syncMergeResponse
    ] = await Promise.all([
      fetch(BASE + '/manifest.webmanifest', { signal: AbortSignal.timeout(12000) }),
      fetch(BASE + '/', { signal: AbortSignal.timeout(12000) }),
      fetch(BASE + '/health', { signal: AbortSignal.timeout(12000) }),
      fetch(BASE + '/icons/nova-emblem.svg', { signal: AbortSignal.timeout(12000) }),
      fetch(BASE + '/nova-app.js', { signal: AbortSignal.timeout(12000) }),
      fetch(BASE + '/nova-account.js', { signal: AbortSignal.timeout(12000) }),
      fetch(BASE + '/nova-reference.js', { signal: AbortSignal.timeout(12000) }),
      fetch(BASE + '/nova-sync-merge.js', { signal: AbortSignal.timeout(12000) })
    ]);

    const manifest = await manifestResponse.json().catch(() => ({}));
    const homepage = await homepageResponse.text();
    const health = await healthResponse.json().catch(() => ({}));
    const icon = await iconResponse.text();
    const app = await appResponse.text();
    const account = await accountResponse.text();
    const reference = await referenceResponse.text();
    const syncMerge = await syncMergeResponse.text();

    last = [
      'manifest HTTP ' + manifestResponse.status,
      'homepage HTTP ' + homepageResponse.status,
      'health HTTP ' + healthResponse.status,
      'icon HTTP ' + iconResponse.status,
      'app HTTP ' + appResponse.status,
      'account HTTP ' + accountResponse.status,
      'reference HTTP ' + referenceResponse.status,
      'sync merge HTTP ' + syncMergeResponse.status
    ].join(', ');

    const requiredReferenceMarkers = [
      "tr('NOVA Build','नोवा बिल्ड')",
      "tr('NOVA Learn','नोवा लर्न')",
      "tr('NOVA Agents','नोवा एजेंट्स')",
      'body.nova-dashboard-home:not(.nova-image-mode) #box',
      'nr-hero',
      'nr-cards',
      'nr-journey'
    ];
    const requiredAccountMarkers = [
      'novaSignUp',
      'novaSignIn',
      'novaCloudSync',
      'novaDeleteCloud',
      'nova_user_workspaces'
    ];
    const requiredHomepageMarkers = [
      '<html lang="en">',
      'id="msgs"',
      'id="dset"',
      'id="photo"',
      'id="novaAccountDialog"',
      'src="/nova-account.js"',
      'nova-home',
      'nova-hero',
      'nova-workspaces',
      'nova-tool-grid',
      'src="/mode-registry.js"',
      'src="/mode-workspace.js"',
      'src="/nova-suite.js"',
      'src="/s-tier.js"',
      'src="/nova-reference.js"'
    ];

    const passed =
      manifestResponse.ok &&
      homepageResponse.ok &&
      healthResponse.ok &&
      iconResponse.ok &&
      appResponse.ok &&
      accountResponse.ok &&
      referenceResponse.ok &&
      syncMergeResponse.ok &&
      /application\/(?:javascript|x-javascript)/i.test(syncMergeResponse.headers.get('content-type') || '') &&
      syncMerge.includes('mergeMessages') &&
      manifest.short_name === 'NOVA' &&
      health.status === 'ok' &&
      requiredHomepageMarkers.every(marker => homepage.includes(marker)) &&
      requiredReferenceMarkers.every(marker => reference.includes(marker)) &&
      !reference.includes('id="nrAsk"') &&
      !reference.includes('data-nr=') &&
      requiredAccountMarkers.every(marker => account.includes(marker)) &&
      app.includes("localStorage.getItem('nova')") &&
      app.includes('const persistable=()=>') &&
      app.includes('JSON.stringify(persistable())') &&
      !app.includes("localStorage.setItem('nova',JSON.stringify(S))") &&
      app.includes('hi:{') &&
      !homepage.includes('id="novaSplash"') &&
      !homepage.includes('id="novaLivingCore"') &&
      !homepage.includes('id="nova-future-style"') &&
      !homepage.includes('id="nova-future-script"') &&
      !homepage.includes('nova-living-core') &&
      !homepage.includes('INDIAN SOUL • FUTURE INTELLIGENCE') &&
      icon.includes('<svg');

    if (passed) {
      console.log('PASS Render serves the required NOVA dashboard, three workspaces, account/auth/cloud-sync asset, photo/voice bridges, legacy chat storage, Settings/image panels, health endpoint and PWA identity');
      process.exit(0);
    }
  } catch (error) {
    last = String(error.message || error);
  }

  console.log('Waiting for Render deployment (' + (i + 1) + '/36): ' + last);
  await sleep(10000);
}

throw new Error('Render did not serve the required NOVA release assets within six minutes: ' + last);
