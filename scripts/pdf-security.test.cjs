'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const moduleUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/legacy/build/pdf.mjs';
const workerUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/legacy/build/pdf.worker.mjs';

for (const file of ['nova-app.js', 'mode-workspace.js']) {
  test(file + ' loads patched pinned PDF.js and disables PDF eval for untrusted uploads', () => {
    const source = readFileSync(file, 'utf8');
    assert.ok(source.includes(moduleUrl), 'must use the pinned patched PDF.js module');
    assert.ok(source.includes(workerUrl), 'must use the matching pinned PDF.js module worker');
    assert.match(source, /pdfjsLib\.getDocument\(\{data:await f\.arrayBuffer\(\),isEvalSupported:false\}\)/);
    assert.doesNotMatch(source, /pdf\.js\/2\.16\.105/);
  });
}

test('CSP permits only the pinned CDN origin for the PDF.js module worker', () => {
  const html = readFileSync('index.html', 'utf8');
  const workerPolicy = html.match(/worker-src[^;]*/)?.[0] || '';
  assert.match(workerPolicy, /https:\/\/cdn\.jsdelivr\.net/);
  assert.doesNotMatch(workerPolicy, /cdnjs\.cloudflare\.com/, 'worker policy must not trust an unused CDN');
});
