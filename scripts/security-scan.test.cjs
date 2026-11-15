'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const patterns = [
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/g,
  /\bAIza[0-9A-Za-z_-]{35}\b/g,
  /\bsb_secret_[A-Za-z0-9_-]{20,}\b/g
];

function walk(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git','node_modules','coverage','artifacts','test-results','playwright-report'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (full.startsWith(path.join(root, 'assets', 'entry-video'))) continue;
      walk(full, output);
    } else if (/\.(?:js|cjs|mjs|txt|json|html|yml|yaml|sql|md)$/.test(entry.name) && entry.name !== 'package-lock.json') {
      output.push(full);
    }
  }
  return output;
}

test('common committed credential patterns are absent from repository text files', () => {
  const findings = [];
  for (const file of walk(root)) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) findings.push(path.relative(root, file) + ': ' + String(pattern));
    }
  }
  assert.deepEqual(findings, []);
});

test('.env and credential files remain ignored by Git', () => {
  const ignore = read('.gitignore').split(/\r?\n/).map(value => value.trim());
  for (const rule of ['.env','.env.*','*.pem','*.key','*.p12','*.pfx','credentials*.json']) {
    assert.ok(ignore.includes(rule), 'missing ignore rule ' + rule);
  }
  assert.ok(ignore.includes('!.env.example'));
});

test('browser entry points do not contain server-only credential environment reads', () => {
  const client = [
    'index.html','nova-app.js','nova-account.js','nova-config.js',
    'nova-reference.js','mode-registry.js','mode-workspace.js'
  ].map(read).join('\n');
  for (const name of [
    'LLM_KEY','GROQ_API_KEY','OPENROUTER_API_KEY','CLOUDFLARE_API_TOKEN',
    'SUPABASE_SERVICE_ROLE_KEY','HORDE_API_KEY'
  ]) {
    assert.equal(client.includes('process.env.' + name), false, name + ' must not be read by browser code');
  }
});

test('manual security headers and bounded same-origin API throttling remain; wildcard CORS stays absent', () => {
  const server = read('nova-server.txt');
  for (const name of [
    'X-Content-Type-Options','X-Frame-Options','Referrer-Policy',
    'Strict-Transport-Security','Content-Security-Policy'
  ]) assert.ok(server.includes(name), 'missing header ' + name);
  assert.match(server, /rateWindow\(hits, q\.ip/);
  assert.doesNotMatch(server, /Access-Control-Allow-Origin[^\n]*\*/i);
});
