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
const novaSuite = readFileSync('nova-suite.js','utf8');
syntaxCheck('nova-suite', novaSuite);
for (const marker of ['Project Brain','Reality Check','AI Council','Digital Hands','Time Machine','Model Arena','Watchtower','Knowledge Vault','Trust Shield','Idea-to-Business']) if (!novaSuite.includes(marker)) throw new Error('S-Tier Studio feature missing: '+marker);
const council = novaSuite.slice(novaSuite.indexOf("active==='council'"), novaSuite.indexOf("active==='hands'"));
for (const marker of ['/api/search','Researcher','Builder','Critic','Final evidence audit','NOT VERIFIED','Search-result excerpt','renderCouncilText','AbortSignal.timeout(20000)','untrusted data','distinct source domains','q.length>2000','No usable sources were returned by live search','u.username||u.password']) if (!council.includes(marker)) throw new Error('AI Council evidence-safety feature missing: '+marker);
if (!council.includes('No AI can guarantee every answer is correct') || !council.includes('Never invent citations')) throw new Error('AI Council accuracy limitation and anti-fabrication guard missing');
for (const marker of ['auditCouncilCitations','INVALID SOURCE ID','Citation audit warning']) if (!novaSuite.includes(marker)) throw new Error('AI Council citation audit missing: '+marker);
if(!novaSuite.includes('const auditedAnswer=auditCouncilCitations(answer,found.length)')||!novaSuite.includes('const auditedFinal=auditCouncilCitations(final,found.length)'))throw new Error('Council citations must be audited in every expert and final response');
const sTier = readFileSync('s-tier.js', 'utf8');
if (!html.includes('id="novaSplash"') || !html.includes('class="nova-royal-indian"') || !html.includes('class="nova-jaali"') || !html.includes('class="nova-yantra"') || !html.includes('nova-wordmark') || !html.includes('DESIGNED IN INDIA') || !html.includes('novaOrbitTurn')) throw new Error('Royal Indian motion splash markup is missing from first paint');
if (sTier.includes('novaJagran') || sTier.includes('sessionStorage.getItem(\'nova_splash_seen\')')) throw new Error('Legacy Jagran screen or one-time splash suppression remains');
if (!sTier.includes("const e=$('novaSplash')") || !sTier.includes('async function wake(){await splash()}')) throw new Error('Splash must reveal the app without waiting for backend health');
if (sTier.includes('#main,#side{position:relative;z-index:1}')) throw new Error('S-tier styles must not override the mobile sidebar fixed positioning');
if (!sTier.includes('#main{position:relative;z-index:1}#side{z-index:5}')) throw new Error('Mobile sidebar stacking regression guard is missing');
if (!server.includes("app.get('/health'") || !server.includes("app.get('/s-tier.js'") || !server.includes("app.get('/nova-suite.js'")) throw new Error('S-tier health or asset route missing');
if (!html.includes('/nova-suite.js')) throw new Error('S-Tier Studio bundle is not loaded');
if (!server.includes('You are Nova AI, a free, India-first AI assistant.') || !server.includes("timeZone: 'Asia/Kolkata'")) throw new Error('Truth-first IST system prompt missing');
if (!html.includes('/s-tier.js')) throw new Error('S-tier experience bundle is not loaded');
for (const marker of ['Nova Study','Nova Build','Nova Chat','Nova Voice','data-cat="study"','data-cat="build"','data-cat="chat"','data-cat="voice"','THE NOVA EXPERIENCE','LEARN · MASTER · GROW','IMAGINE · CREATE · LAUNCH','THINK · DISCOVER · SOLVE','SPEAK · LISTEN · CONNECT','ncard-enter','@media(max-width:600px)']) if (!readFileSync('s-tier.js','utf8').includes(marker)) throw new Error('Royal four-workspace home missing: '+marker);
if (!readFileSync('s-tier.js','utf8').includes('#mode{display:none!important}')) throw new Error('Legacy mode dropdown must be hidden to keep the four-workspace home clear');
if (!readFileSync('s-tier.js','utf8').includes('hiEl.replaceChildren(e)') || !readFileSync('s-tier.js','utf8').includes("n.id==='hi'")) throw new Error('The four-workspace home must replace the old dashboard and return after New Chat');
if (!modeRegistry.includes("id:'study'") || !modeRegistry.includes("id:'build'") || !modeRegistry.includes("id:'chat'") || !modeRegistry.includes("id:'voice'")) throw new Error('Four mode groups are not registered');
if (!modeWorkspace.includes('openGroup(group)') || modeWorkspace.includes("add(top,'novaModesTop'")) throw new Error('Mode workspace must open only the selected group without the all-modes launcher');
if (!readFileSync('nova-suite.js','utf8').includes('window.NovaSuite=Object.freeze({open,close})')) throw new Error('Nova Build launcher API is missing');
if (!readFileSync('nova-suite.js','utf8').includes('nsAppBuilder') || !readFileSync('nova-suite.js','utf8').includes("openMode('builder')")) throw new Error('App and Website Builder shortcut is missing from Nova Build');
if (!modeRegistry.includes("id:'builder',group:'build'")) throw new Error('App and Website Builder mode is not assigned to Nova Build');
syntaxCheck('mode-registry', modeRegistry);
syntaxCheck('mode-workspace', modeWorkspace);
for (const marker of ["return 'English'",'function syncStaticLabels()','Attach file/photo','The AI service is not configured yet.']) if (!modeWorkspace.includes(marker)) throw new Error('Bilingual Study Mode language regression guard missing: '+marker);
if (modeWorkspace.includes("const language=()=>document.querySelector('#lang')?.value||'Hindi'")) throw new Error('Study Mode must not silently default to Hindi before the language preference loads');
const tierHome = read('s-tier.js');
for (const marker of ['n-brandbar','n-orbit-seal','DESIGNED IN INDIA · BUILT FOR THE WORLD','novaSealTurn']) if (!tierHome.includes(marker)) throw new Error('NOVA premium brand home marker missing: '+marker);
syntaxCheck('runtime-smoke-test', readFileSync('scripts/runtime-smoke.mjs','utf8'));
syntaxCheck('production-smoke-test', readFileSync('scripts/smoke.mjs','utf8'));
syntaxCheck('wait-live-test', readFileSync('scripts/wait-live.mjs','utf8'));

const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(x => x.trim());
if (!scripts.length) throw new Error('No inline frontend JavaScript was found');
scripts.forEach((source, i) => syntaxCheck('frontend-' + (i + 1), source));

if (!server.includes("app.get('/mode-registry.js'") || !server.includes("app.get('/mode-workspace.js'")) throw new Error('Mode assets are not served by the backend');
if (!html.includes('/mode-registry.js') || !html.includes('/mode-workspace.js')) throw new Error('Mode workspace scripts are not loaded by the frontend');
if (!html.includes("localStorage.getItem('nova')") || !html.includes("localStorage.setItem('nova',JSON.stringify(S))")) throw new Error('Legacy Nova chat storage contract changed');
if (!server.includes('GROQ_API_KEY') || !server.includes('OPENROUTER_API_KEY')) throw new Error('Optional free provider fallback is missing');
if (process.exitCode) process.exit(process.exitCode);
process.stdout.write('PASS project structure and syntax checks\n');
