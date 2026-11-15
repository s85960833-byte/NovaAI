import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const base = process.env.NOVAAI_URL || 'http://localhost:8787';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));

try {
  // Keep the test deterministic and avoid external Supabase CDN dependencies.
  await page.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `window.supabase={createClient:function(){return {auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({error:null})}}}};`
    })
  );

  const response = await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 15000 });
  assert.equal(response?.status(), 200, 'NOVA homepage must respond locally');

  // This suite tests a workflow, not the intro animation.
  await page.evaluate(() => localStorage.setItem('nova_intro_completed_v2', '1'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#novaEntryGate').waitFor({ state: 'detached', timeout: 7000 });
  await page.waitForFunction(() => typeof window.NovaBusiness?.open === 'function', null, { timeout: 10000 });
  await page.evaluate(() => window.NovaBusiness.open());
  await page.locator('#novaBusiness.show').waitFor({ state: 'visible', timeout: 7000 });
  await page.locator('#nbNav [data-view="data"]').click();

  const fixturePath = resolve('samples/demo-expenses.csv');
  const fixtureBytes = await readFile(fixturePath);
  const expectedDigest = 'sha256:' + createHash('sha256').update(fixtureBytes).digest('hex');

  await page.locator('#nbFile').setInputFiles(fixturePath);
  await page.waitForFunction(() => {
    const status = document.querySelector('#nbDataStatus')?.textContent || '';
    return /SHA-256 ready|SHA-256 unavailable|Import failed:/.test(status);
  }, null, { timeout: 10000 });
  const importDiagnostic = await page.evaluate(() => ({
    status: document.querySelector('#nbDataStatus')?.textContent || '(missing status element)',
    secureContext: window.isSecureContext,
    cryptoAvailable: typeof window.crypto !== 'undefined',
    subtleAvailable: !!window.crypto?.subtle,
    digestAvailable: typeof window.crypto?.subtle?.digest === 'function'
  }));
  assert.match(importDiagnostic.status, /SHA-256 ready/,
    'CSV import must produce a source digest in a secure browser context: ' + JSON.stringify(importDiagnostic));
  const beforeAnalysis = await page.evaluate(() => ({
    buttonDisabled: document.querySelector('#nbAnalyze')?.disabled,
    selectedType: document.querySelector('#nbType')?.value,
    columnMapping: [...document.querySelectorAll('#nbMapping [data-map]')].map(node => ({ key: node.dataset.map, value: node.value })),
    status: document.querySelector('#nbDataStatus')?.textContent || '',
    parsedRows: window.NovaBusiness?.snapshot?.().dataset?.rowCount ?? null
  }));
  assert.equal(beforeAnalysis.selectedType, 'expenses',
    'Expense demo must select the expense analysis mode: ' + JSON.stringify(beforeAnalysis));
  assert.equal(beforeAnalysis.columnMapping.find(x => x.key === 'amount')?.value, 'Amount (INR)',
    'Currency-suffixed amount headers must be auto-mapped safely: ' + JSON.stringify(beforeAnalysis));
  assert.equal(beforeAnalysis.columnMapping.find(x => x.key === 'category')?.value, 'Category',
    'Expense category should auto-map: ' + JSON.stringify(beforeAnalysis));
  assert.equal(beforeAnalysis.buttonDisabled, false,
    'Analyze must be enabled after a successful import: ' + JSON.stringify(beforeAnalysis));
  await page.locator('#nbAnalyze').click();
  await page.waitForFunction(() => {
    const analysis = window.NovaBusiness?.snapshot?.().analysis;
    const status = document.querySelector('#nbDataStatus')?.textContent || '';
    return analysis?.total === 212000 || status.startsWith('Analysis failed:');
  }, null, { timeout: 10000 });
  const analysisDiagnostic = await page.evaluate(() => ({
    analysis: window.NovaBusiness?.snapshot?.().analysis || null,
    dataset: window.NovaBusiness?.snapshot?.().dataset ? {
      name: window.NovaBusiness.snapshot().dataset.name,
      rowCount: window.NovaBusiness.snapshot().dataset.rowCount,
      type: window.NovaBusiness.snapshot().dataset.type
    } : null,
    status: document.querySelector('#nbDataStatus')?.textContent || '',
    buttonDisabled: document.querySelector('#nbAnalyze')?.disabled
  }));
  assert.equal(analysisDiagnostic.analysis?.total, 212000,
    'Imported demo expense analysis must match expected total: ' + JSON.stringify({ beforeAnalysis, analysisDiagnostic }));
  await page.locator('#nbNav [data-view="proof"]').click();
  await page.locator('#nbProofExport').waitFor({ state: 'visible', timeout: 5000 });

  const proofText = await page.locator('#nbBody').innerText();
  assert.match(proofText, /Source-file SHA-256:/, 'proof screen should expose the exact source digest');
  assert.ok(proofText.includes(expectedDigest), 'proof screen digest must match independently hashed source bytes');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#nbProofExport').click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'nova-action-proof-bundle.json');
  const bundlePath = await download.path();
  assert.ok(bundlePath, 'proof bundle download must materialize');
  const bundle = JSON.parse(await readFile(bundlePath, 'utf8'));

  assert.equal(bundle.schemaVersion, 'nova-proof-bundle/1');
  assert.equal(bundle.proof.status, 'PASS');
  assert.equal(bundle.proof.failed, 0);
  assert.equal(bundle.proof.metadata.sourceFileSha256, expectedDigest);
  assert.equal(bundle.analysis.sourceFileSha256, expectedDigest);
  assert.equal(bundle.analysis.total, 212000);
  assert.equal(bundle.proof.metadata.sourceRowCount, 12);
  assert.equal(bundle.proof.metadata.calculationVersion, 'nova-business-core-0.1.0');
  assert.equal(typeof bundle.proof.metadata.columnMapping.amount, 'string');
  assert.equal(Object.hasOwn(bundle, 'rawCsv'), false, 'portable proof bundle must not include raw uploaded CSV bytes');

  assert.deepEqual(errors, [], 'browser workflow must not throw page errors');
  console.log('[NOVA BI proof browser] PASS: imported CSV SHA-256 matches independent Node digest and portable proof bundle exports calculation metadata without raw CSV bytes');
} finally {
  await browser.close();
}
