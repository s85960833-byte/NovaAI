'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

for (const file of ['nova-app.js', 'mode-workspace.js']) {
  test(file + ' disables PDF.js eval for untrusted PDF uploads', () => {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /pdfjsLib\.getDocument\(\{data:await f\.arrayBuffer\(\),isEvalSupported:false\}\)/);
    assert.match(source, /pdf\.js\/2\.16\.105\/pdf\.min\.js/);
    assert.match(source, /pdf\.js\/2\.16\.105\/pdf\.worker\.min\.js/);
  });
}
