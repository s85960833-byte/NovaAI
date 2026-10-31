import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function syntaxCheck(name, source) {
  const ext = name.endsWith('-test') ? '.mjs' : '.js';
  const file = join('/tmp', 'novaai-' + name.replace(/[^a-z0-9]/gi, '-') + ext);
  writeFileSync(file, source);
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  try { unlinkSync(file); } catch {}
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || (name + ' syntax check failed\n'));
    process.exitCode = 1;
  } else {
    process.stdout.write('PASS syntax: ' + name + '\n');
  }
}

const server = readFileSync('nova-server.txt', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const modeRegistry = readFileSync('mode-registry.js', 'utf8');
const modeWorkspace = readFileSync('mode-workspace.js', 'utf8');

if (pkg.scripts?.start !== 'node nova-server.txt') throw new Error('Render start command and package.json are out of sync');
if (!server.includes("app.post('/api/live'") || !server.includes("app.get('/api/live/selftest'") || !server.includes("app.get('/api/feed'")) throw new Error('Expected live API routes are missing');
if (server.includes('nova-ai-mlxf.onrender.com')) throw new Error('Legacy website URL remains in the active server file');
syntaxCheck('backend', server);
syntaxCheck('s-tier-experience', readFileSync('s-tier.js','utf8'));
syntaxCheck('i18n-experience', readFileSync('nova-i18n.js','utf8'));
if ((html.match(/name="viewport"/g)||[]).length!==1 || !html.includes('id="novaSplash"') || !html.includes('id="novaApp" hidden')) throw new Error('First-paint splash or single viewport contract missing');
if (!server.includes('nova-shell-v5-mobile-first-paint') || !server.includes("e.request.mode==='navigate'")) throw new Error('Network-first service worker cache contract missing');
if (!server.includes("app.get('/health'") || !server.includes("app.get('/s-tier.js'")) throw new Error('S-tier health or asset route missing');
if (!server.includes('You are Nova AI, a free, India-first AI assistant.') || !server.includes("timeZone: 'Asia/Kolkata'")) throw new Error('Truth-first IST system prompt missing');
if (!html.includes('/s-tier.js')) throw new Error('S-tier experience bundle is not loaded');
syntaxCheck('mode-registry', modeRegistry);
syntaxCheck('mode-workspace', modeWorkspace);
syntaxCheck('runtime-smoke-test', readFileSync('scripts/runtime-smoke.mjs','utf8'));
syntaxCheck('production-smoke-test', readFileSync('scripts/smoke.mjs','utf8'));

const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(x => x.trim());
if (!scripts.length) throw new Error('No inline frontend JavaScript was found');
scripts.forEach((source, i) => syntaxCheck('frontend-' + (i + 1), source));

if (!server.includes("app.get('/mode-registry.js'") || !server.includes("app.get('/mode-workspace.js'")) throw new Error('Mode assets are not served by the backend');
if (!html.includes('/mode-registry.js') || !html.includes('/mode-workspace.js')) throw new Error('Mode workspace scripts are not loaded by the frontend');
if (!html.includes("localStorage.getItem('nova')") || !html.includes("localStorage.setItem('nova',JSON.stringify(S))")) throw new Error('Legacy Nova chat storage contract changed');
if (!server.includes('GROQ_API_KEY') || !server.includes('OPENROUTER_API_KEY')) throw new Error('Optional free provider fallback is missing');
if (process.exitCode) process.exit(process.exitCode);
process.stdout.write('PASS project structure and syntax checks\n');
