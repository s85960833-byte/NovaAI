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
if (pkg.engines?.node !== '22.x') throw new Error('Render and CI must use the same pinned Node.js 22 LTS runtime');
for (const route of ["app.get('/health'", "app.post('/api/live'", "app.get('/api/live/selftest'", "app.get('/api/feed'", "app.get('/nova-reference.js'"]) if (!server.includes(route)) throw new Error('Required backend route missing: ' + route);
if (server.includes('nova-ai-mlxf.onrender.com')) throw new Error('Legacy website URL remains in server');
if (!server.includes('Your developer is Thakur Shreyansh Singh ji.') || !server.includes("Respond in the user's language while keeping the developer name exactly as written.") || server.includes('Respond in English only, regardless of the user')) throw new Error('Developer identity must be exact and compatible with the user language');
if (!server.includes("via: 'arxiv+science-rss-fallback'") || !server.includes("T('openalex', async () =>") || !server.includes("feedCat('science', 6)")) throw new Error('Live science retrieval must fall back to independent arXiv and science RSS when OpenAlex fails');
syntaxCheck('backend', server);
const liveSmoke=readFileSync('scripts/smoke.mjs','utf8');
syntaxCheck('live production smoke',liveSmoke);
if (!liveSmoke.includes("process.env.NOVA_LIVE_FULL_TESTS === '1'") || !liveSmoke.includes('invalid-input guard') || !liveSmoke.includes('SKIP full provider')) throw new Error('Live production smoke must avoid provider/API credit use unless explicitly opted in');

for (const file of ['s-tier.js','nova-suite.js','mode-registry.js','mode-workspace.js','nova-reference.js']) syntaxCheck(file, readFileSync(file,'utf8'));
const tier = readFileSync('s-tier.js', 'utf8');
const workspace = readFileSync('mode-workspace.js', 'utf8');
const registry = readFileSync('mode-registry.js', 'utf8');
for (const [label, fragment] of [
  ['NOVA Learn route', "window.NovaModeWorkspace?.openGroup('learn')"],
  ['NOVA Build route', "window.NovaModeWorkspace?.openGroup('build')"],
  ['NOVA Agents route', "window.NovaModeWorkspace?.openGroup('agents')"]
]) if (!tier.includes(fragment)) throw new Error('Workspace entry point missing: ' + label);
if (!workspace.includes("openGroup(group){if(!REG.groups.some(g=>g.id===group))return false;show(group);return true;}")) throw new Error('Workspace group launcher contract missing');
if (!registry.includes("{id:'builder',group:'build'")) throw new Error('NOVA Build has no App & Website Builder mode');
if (!registry.includes("{id:'document',group:'agents'")) throw new Error('NOVA Agents has no document assistant mode');
if (!tier.includes('NOVA Learn / नोवा लर्न') || !tier.includes('NOVA Build / नोवा बिल्ड') || !tier.includes('NOVA Agents / नोवा एजेंट्स')) throw new Error('Three bilingual workspace cards are missing');
if (!tier.includes('tr=(a,b)=>`${a} / ${b}`') || !workspace.includes('tr=(en,hi)=>`${en} / ${hi}`')) throw new Error('Workspace labels must display both Hindi and English');
if (!tier.includes('Three connected workspaces for learning, building and AI agents.') || !tier.includes("tr('THREE WORKSPACES','तीन वर्कस्पेस')") || tier.includes('Four connected spaces') || tier.includes('चार वर्कस्पेस')) throw new Error('Home copy must consistently describe exactly three workspaces in both languages');
if (!['n-journey','novaHomePrompt','novaHomeSend','n-feature-grid','data-home-action="photo"','data-home-action="voice"'].every(x=>tier.includes(x)) || !tier.includes("$('#send')?.click()")) throw new Error('Reference-inspired home journey, ask bar, feature cards and working shortcuts are missing');
const reference = readFileSync('nova-reference.js', 'utf8');
if (!html.includes('src=\"/nova-reference.js\"') || !reference.includes('data-group=\"build\"') || !reference.includes('data-group=\"learn\"') || !reference.includes('data-group=\"agents\"') || !reference.includes('NovaWorkspaceActions?.openPhoto') || !reference.includes('NovaWorkspaceActions?.startVoice') || !reference.includes('nova-reference-style')) throw new Error('Reference-inspired dashboard, workspace navigation or existing photo/voice action bridges are missing');
if (!html.includes("h.id='hi'")) throw new Error('Legacy home renderer no longer creates the S-Tier mount point');
if (!reference.includes("const root=$('#hi');") || !reference.includes("const host=$('#log');") || reference.includes('#novaSHome')) throw new Error('Reference dashboard must mount into #hi and observe #log for future home renders');


for (const file of ['scripts/runtime-smoke.mjs','scripts/smoke.mjs','scripts/wait-live.mjs','scripts/smoke-free-image.mjs']) syntaxCheck(file, readFileSync(file,'utf8'));

if (!html.includes('id="msgs"')) throw new Error('Previous standard chat UI input was not found');
if (!html.includes("typeof en==='string'&&typeof hi==='string'") || !html.includes("return en+' / '+hi")) throw new Error('Core NOVA interface must render English and Hindi together');
if (!['src="/mode-registry.js"','src="/mode-workspace.js"','src="/nova-suite.js"','src="/s-tier.js"'].every(x=>html.includes(x))) throw new Error('NOVA Learn, Build and Agents workspace scripts are not connected in the homepage');
if (!['nova-home','nova-hero','nova-workspaces','nova-tool-grid'].every(x=>html.includes(x))) throw new Error('NOVA dashboard UI components missing');
if (!html.includes('localStorage.getItem(\'nova\')') || !html.includes('localStorage.setItem(\'nova\',JSON.stringify(S))')) throw new Error('Existing Nova chat storage contract changed');

if (html.includes('CHAT · LEARN · MASTER') || html.includes('IMAGINE · DESIGN · CREATE') || html.includes('RESEARCH · DISCOVER · EXPLORE')) throw new Error('Old four-workspace visual shell remains');
if (!html.includes('id="dset"')) throw new Error('Settings panel missing');
if (html.includes('Nova AI has no server of its own') || html.includes('Nova AI का अपना कोई सर्वर नहीं है।')) throw new Error('Outdated privacy disclosure incorrectly says NOVA has no backend');
if (!html.includes('backend hosted on Render') || !html.includes('account-based cloud chat sync')) throw new Error('NOVA backend and local-storage privacy disclosures are missing');
if (!html.includes('id="photo"')) throw new Error('Image/photo panel missing');
if (!html.includes('async function pollImageJob(') || !html.includes("API+'/image/status/'") || !html.includes('pollImageJob(j.jobId,sig)') || !html.includes("sig.addEventListener('abort',abort,{once:true})") || !html.includes("e1?.status===429")) throw new Error('Image studio must abort polling promptly and must not bypass server image rate limits');
if (!/@media\(max-width:760px\)\{#side\{position:fixed;[^}]*transform:translateX\(-100%\)/.test(html) || !html.includes('#side.open{transform:none}') || html.includes('#side,#main{position:relative')) throw new Error('Mobile navigation drawer must remain fixed, initially off-canvas, and openable');
if (!server.includes("app.get('/s-tier.js'") || !server.includes("app.get('/nova-suite.js'")) throw new Error('Existing optional feature asset routes missing');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(x => x.trim());
if (!scripts.length) throw new Error('No inline frontend JavaScript found');
scripts.forEach((source, i) => syntaxCheck('frontend-' + (i + 1), source));
process.stdout.write('PASS previous standard UI, storage compatibility, required assets, and project syntax checks\n');
