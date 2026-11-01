import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function syntaxCheck(name, source) {
  const file = join('/tmp', 'novaai-' + name.replace(/[^a-z0-9]/gi, '-') + '.js');
  writeFileSync(file, source);
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  try { unlinkSync(file); } catch {}
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || name + ' syntax check failed');
  process.stdout.write('PASS syntax: ' + name + '\n');
}

const server = readFileSync('nova-server.txt', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.start !== 'node nova-server.txt') throw new Error('Render start command mismatch');
for (const route of ["app.get('/health'", "app.post('/api/live'", "app.get('/api/live/selftest'", "app.get('/api/feed'"]) if (!server.includes(route)) throw new Error('Required backend route missing: ' + route);
if (server.includes('nova-ai-mlxf.onrender.com')) throw new Error('Legacy website URL remains in server');
syntaxCheck('backend', server);

for (const file of ['s-tier.js','nova-suite.js','mode-registry.js','mode-workspace.js']) syntaxCheck(file, readFileSync(file,'utf8'));
const tier = readFileSync('s-tier.js', 'utf8');
const workspace = readFileSync('mode-workspace.js', 'utf8');
const registry = readFileSync('mode-registry.js', 'utf8');
for (const [label, fragment] of [
  ['Chat & Study route', "window.NovaModeWorkspace?.openGroup('chat-study')"],
  ['Create route', "window.NovaModeWorkspace?.openGroup('create')"],
  ['Explore route', "window.NovaModeWorkspace?.openGroup('explore')"],
  ['Voice Chat route', "window.NovaModeWorkspace?.openGroup('voice')"]
]) if (!tier.includes(fragment)) throw new Error('Workspace entry point missing: ' + label);
if (!workspace.includes("openGroup(group){if(!REG.groups.some(g=>g.id===group))return false;show(group);return true;}")) throw new Error('Workspace group launcher contract missing');
if (!registry.includes("{id:'builder',group:'create'")) throw new Error('Create workspace has no App & Website Builder mode');
if (!registry.includes("{id:'voice',group:'voice'")) throw new Error('Voice workspace has no dedicated voice mode');
if (!tier.includes("tr=(a,b)=>a") || !workspace.includes("tr=(en,hi)=>en")) throw new Error('New workspace UI must use English labels');
if (!html.includes("h.id='hi'")) throw new Error('Legacy home renderer no longer creates the S-Tier mount point');


for (const file of ['scripts/runtime-smoke.mjs','scripts/smoke.mjs','scripts/wait-live.mjs']) syntaxCheck(file, readFileSync(file,'utf8'));

if (!html.includes('id="msgs"')) throw new Error('Previous standard chat UI input was not found');
if (!['src="/mode-registry.js"','src="/mode-workspace.js"','src="/nova-suite.js"','src="/s-tier.js"'].every(x=>html.includes(x))) throw new Error('NOVA four-workspace UI scripts are not connected in the homepage');
if (!['nova-home','nova-hero','nova-workspaces','nova-tool-grid'].every(x=>html.includes(x))) throw new Error('Cosmic India dashboard UI components missing');
if (!html.includes('localStorage.getItem(\'nova\')') || !html.includes('localStorage.setItem(\'nova\',JSON.stringify(S))')) throw new Error('Existing Nova chat storage contract changed');
if (html.includes('id="nova-future-style"') || html.includes('id="nova-future-script"') || html.includes('nova-living-core') || html.includes('INDIAN SOUL • FUTURE INTELLIGENCE')) throw new Error('New Indian future UI should not remain after restoring the previous UI');
if (html.includes('CHAT · LEARN · MASTER') || html.includes('IMAGINE · DESIGN · CREATE') || html.includes('RESEARCH · DISCOVER · EXPLORE')) throw new Error('New four-workspace visual shell remains in restored standard UI');
if (!html.includes('id="dset"')) throw new Error('Settings panel missing from restored UI');
if (!html.includes('id="photo"')) throw new Error('Image/photo panel missing from restored UI');
if (!/@media\(max-width:760px\)\{#side\{position:fixed;[^}]*transform:translateX\(-100%\)/.test(html) || !html.includes('#side.open{transform:none}') || html.includes('#side,#main{position:relative')) throw new Error('Mobile navigation drawer must remain fixed, initially off-canvas, and openable');
if (!server.includes("app.get('/s-tier.js'") || !server.includes("app.get('/nova-suite.js'")) throw new Error('Existing optional feature asset routes missing');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(x => x.trim());
if (!scripts.length) throw new Error('No inline frontend JavaScript found');
scripts.forEach((source, i) => syntaxCheck('frontend-' + (i + 1), source));
process.stdout.write('PASS previous standard UI, storage compatibility, required assets, and project syntax checks\n');
