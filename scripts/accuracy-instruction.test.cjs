'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'nova-app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const a0 = app.indexOf('const ACCP=');
const a1 = app.indexOf(';\nconst HS=', a0);
const accp = app.slice(a0, a1);
const s0 = app.indexOf('function syncAcc()');
const s1 = app.indexOf("\n$('ultset').onchange", s0);
const sync = app.slice(s0, s1);
test('accuracy instruction is always part of every system prompt', () => {
  assert.ok(accp.includes("'\\n\\n'+ACC"));
  assert.ok(app.includes('UNIVERSAL ACCURACY RULES'));
});
test('legacy saved opt-out cannot remove accuracy instruction', () => {
  assert.doesNotMatch(accp, /S\.acc/);
  assert.match(sync, /S\.acc=true/);
});
test('legacy false preference is migrated and persisted as true', () => {
  assert.match(sync, /const changed=S\.acc!==true;S\.acc=true/);
  assert.match(sync, /if\(changed\)save\(\)/);
});
test('top-bar accuracy status is read-only and accessible', () => {
  assert.match(html, /id="acc"[^>]*aria-pressed="true"[^>]*aria-disabled="true"[^>]*disabled/);
  assert.match(sync, /\$\('acc'\)\.disabled=true/);
  assert.match(sync, /\$\('acc'\)\.setAttribute\('aria-label',t\('accOn'\)\)/);
});
test('settings accuracy checkbox is checked and disabled', () => {
  assert.match(html, /id="accset" checked disabled/);
  assert.match(sync, /\$\('accset'\)\.checked=true;\$\('accset'\)\.disabled=true/);
});
test('no user interaction handler can switch accuracy instruction off', () => {
  assert.doesNotMatch(app, /const setAcc=v=>/);
  assert.doesNotMatch(app, /\$\('acc'\)\.onclick=/);
  assert.doesNotMatch(app, /\$\('accset'\)\.onchange=/);
});
test('English UI labels say safeguard is always on', () => {
  assert.match(app, /accT:'Maximum accuracy is always on'/);
  assert.match(app, /accD:'Always on:/);
  assert.match(app, /accOn:'Maximum accuracy is always on'/);
});
test('Hindi UI labels say safeguard is always on', () => {
  assert.match(app, /accT:'अधिकतम सटीकता हमेशा चालू है'/);
  assert.match(app, /accD:'यह हमेशा चालू रहता है:/);
  assert.match(app, /accOn:'अधिकतम सटीकता हमेशा चालू है'/);
});
test('optional extended-history instruction remains independent', () => {
  assert.match(accp, /S\.ult!==false/);
  assert.match(app, /\$\('ultset'\)\.onchange/);
});
test('accuracy changes add no external analytics request', () => {
  assert.doesNotMatch(sync, /fetch\(|XMLHttpRequest|sendBeacon/);
  assert.doesNotMatch(accp, /sendBeacon|analyticsEndpoint/);
});
