import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function syntaxCheck(name, source) {
  const extension = name.endsWith('.mjs') ? '.mjs' : '.js';
  const file = join('/tmp', 'novaai-' + name.replace(/[^a-z0-9]/gi, '-') + extension);
  writeFileSync(file, source);
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  try { unlinkSync(file); } catch {}
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || name + ' syntax check failed');
  process.stdout.write('PASS syntax: ' + name + '\n');
}

const server = readFileSync('nova-server.txt', 'utf8');
const providerUrl = readFileSync('nova-provider-url.js', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const gitignore = readFileSync('.gitignore', 'utf8');
const readme = readFileSync('README.md', 'utf8');
const pitchReadiness = readFileSync('PITCH_READINESS.md', 'utf8');
const pitchKit = readFileSync('NOVA_PITCH_KIT.md', 'utf8');
const pitchScript = readFileSync('PITCH_SCRIPT.md', 'utf8');
if (!readme.includes('Only limited concept/discovery conversations are permitted') ||
    !readme.includes('Paid sales, customer onboarding') ||
    !pitchReadiness.includes('Pitch status:** LIMITED CONCEPT DISCOVERY ONLY') ||
    !pitchReadiness.includes('NO-GO for paid sales') ||
    !pitchKit.includes('LIMITED CONCEPT DISCOVERY ONLY') ||
    !pitchKit.includes('No paid sales') ||
    !pitchScript.includes('LIMITED CONCEPT DISCOVERY ONLY') ||
    !pitchScript.includes('Do not offer a paid product')) {
  throw new Error('Pitch materials must allow concept discovery only and keep paid sales and production promises blocked');
}
for (const pattern of ['.env', '.env.*', '*.pem', '*.key', '*.p12', '*.pfx', 'service-account*.json', 'credentials*.json', 'node_modules/']) {
  if (!gitignore.split(/\r?\n/).includes(pattern)) throw new Error('Local secrets and generated files must be ignored: ' + pattern);
}
const verificationWorkflow = readFileSync('.github/workflows/novaai-verification.yml', 'utf8');
if (!/^permissions:\n  contents: read$/m.test(verificationWorkflow)) throw new Error('Verification workflow must use least-privilege read-only repository permissions');
const supabaseDeno = JSON.parse(readFileSync('supabase/functions/nova-bi-api/deno.json', 'utf8'));
if (supabaseDeno.imports?.['@supabase/server'] !== 'npm:@supabase/server@1.9.2') throw new Error('Supabase server SDK must be pinned to a reviewed stable version');
const biEdge = readFileSync('supabase/functions/nova-bi-api/index.ts', 'utf8');
if (!biEdge.includes('return fail("NOVA Business Intelligence request failed", 500);')) throw new Error('Unexpected BI backend failures must return a server-error status');
const rateLimitMigration = readFileSync('supabase/migrations/20261101000010_nova_bi_api_rate_limits.sql', 'utf8');
if (!/security definer\s+set search_path = ''/.test(rateLimitMigration)) throw new Error('Rate-limit SECURITY DEFINER function must use an empty search_path');
const forwardHardening = readFileSync('supabase/migrations/20261106195900_nova_bi_rate_limit_search_path_hardening.sql', 'utf8');
if (!/alter function public\.nova_bi_consume_rate_limit\([\s\S]*?set search_path = ''/i.test(forwardHardening)) throw new Error('Forward migration must harden the already-applied rate-limit function');
if (!/revoke all[\s\S]*?from public, anon, authenticated/i.test(forwardHardening)) throw new Error('Forward migration must keep rate-limit RPC private to service_role');
const rlsIntegration = readFileSync('scripts/supabase-rls-integration.sql', 'utf8');
if (!rlsIntegration.includes('Every public SECURITY DEFINER function must pin an empty search_path')) throw new Error('Database integration test must guard SECURITY DEFINER search_path');
if (!server.includes("secureProviderBase('LLM_BASE'") || !server.includes("secureProviderBase('GROQ_BASE'") || !server.includes("secureProviderBase('OPENROUTER_BASE'") || !server.includes("secureProviderBase('IMAGE_BASE'") || !server.includes("secureProviderBase('HORDE_BASE'")) throw new Error('All secret-bearing provider endpoints must require validated HTTPS URLs');
if (!server.includes('app.disable(\'x-powered-by\')') || !server.includes('nova-business-core.js') || !server.includes('nova-business-cloud.js') || !server.includes("'/nova-reference.js','/nova-business-core.js'")) throw new Error('BI server routes or offline dashboard cache are missing');
if (!server.includes('Content-Security-Policy') || !server.includes('frame-ancestors \'none\'') || !server.includes('camera=(self), microphone=(self), geolocation=()')) throw new Error('Combined browser security policy is incomplete');
const requiredCspFragments = ['http-equiv="Content-Security-Policy"', "default-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'self'"];
const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(match => !/\bsrc\s*=/.test(match[1]));
const appScript = readFileSync('nova-app.js', 'utf8');
const configScript = readFileSync('nova-config.js', 'utf8');
if (inlineScripts.length) throw new Error('Executable script blocks must be externalized; inline event-handler attributes are tracked separately');
const inlineEventAttributes = [...html.matchAll(/\son[a-z]+\s*=/gi)];
if (inlineEventAttributes.length) throw new Error('Inline HTML event-handler attributes are not permitted by the script CSP');
if (!html.includes("script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net") || html.includes("script-src 'self' 'unsafe-inline'")) throw new Error('Script CSP must not allow inline script execution');
if (!server.includes("app.get('/nova-config.js'") || !server.includes("app.get('/nova-app.js'")) throw new Error('Externalized NOVA scripts are not served by the backend');
syntaxCheck('NOVA app external script', appScript);
syntaxCheck('NOVA config external script', configScript);
if (!server.includes("'/nova-config.js','/nova-app.js'")) throw new Error('Externalized scripts are missing from the offline shell cache');
if (!requiredCspFragments.every(fragment => html.includes(fragment))) throw new Error('Document resource Content Security Policy is incomplete');
const cloudClient = readFileSync('nova-business-cloud.js', 'utf8');
if (!cloudClient.includes('const orgId=state.orgId') || !cloudClient.includes('if(state.orgId!==orgId)return')) throw new Error('Company switch must discard stale tenant responses');
if (!cloudClient.includes('if(value!==raw)node.nodeValue=value') || !cloudClient.includes('if(value!==raw)el.setAttribute(attr,value)')) throw new Error('Company Cloud bilingual MutationObserver must skip unchanged DOM values to avoid a self-triggering mutation loop');
if (!cloudClient.includes('queueMicrotask(()=>refresh().catch(e=>say(e.message,true)))')) throw new Error('Supabase auth refresh must run after the auth callback lock is released');
if (pkg.scripts?.start !== 'node nova-server.txt') throw new Error('Render start command mismatch');
if (pkg.engines?.node !== '22.x') throw new Error('Render and CI must use the same pinned Node.js 22 LTS runtime');
for (const route of ["app.get('/health'", "app.post('/api/live'", "app.get('/api/live/selftest'", "app.get('/api/feed'", "app.get('/nova-reference.js'"]) if (!server.includes(route)) throw new Error('Required backend route missing: ' + route);
if (server.includes('nova-ai-mlxf.onrender.com')) throw new Error('Legacy website URL remains in server');
if (!server.includes("r.setHeader('X-Content-Type-Options', 'nosniff')") || !server.includes("r.setHeader('X-Frame-Options', 'DENY')") || !server.includes("r.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')")) throw new Error('Baseline security response headers are missing');
if (!server.includes('r2: false') || !server.includes('maxImageBytes = 8 * 1024 * 1024') || !server.includes("imageBuffer.toString('ascii', 8, 12) === 'WEBP'") || server.includes('fetch(generated') || !server.includes('const freeOnly = body.freeOnly === true') || !server.includes('if (!freeOnly && E.ALLOW_PAID_IMAGE') || !server.includes('const tries = freeOnly ? [] : E.POLLI_KEY')) throw new Error('Community image SSRF, payload validation, or paid-provider bypass guards are missing');
if (!server.includes('Your developer is Thakur Shreyansh Singh ji.') || !server.includes("Respond in the user's language while keeping the developer name exactly as written.") || server.includes('Respond in English only, regardless of the user')) throw new Error('Developer identity must be exact and compatible with the user language');
if (!server.includes("via: 'arxiv+science-rss-fallback'") || !server.includes("T('openalex', async () =>") || !server.includes("feedCat('science', 6)")) throw new Error('Live science retrieval must fall back to independent arXiv and science RSS when OpenAlex fails');
syntaxCheck('provider URL validation', providerUrl);
syntaxCheck('backend', server);
const liveSmoke=readFileSync('scripts/smoke.mjs','utf8');
syntaxCheck('live production smoke',liveSmoke);
if (!liveSmoke.includes("process.env.NOVA_LIVE_FULL_TESTS === '1'") || !liveSmoke.includes('invalid-input guard') || !liveSmoke.includes('SKIP full provider')) throw new Error('Live production smoke must avoid provider/API credit use unless explicitly opted in');

for (const file of ['s-tier.js','nova-suite.js','nova-business-core.js','nova-business.js','nova-business-cloud.js','mode-registry.js','mode-workspace.js','nova-reference.js']) syntaxCheck(file, readFileSync(file,'utf8'));
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
if (!tier.includes('function ambientAtmosphere()') || !tier.includes('function settings()') || !tier.includes('function boot(){ambientAtmosphere();accent();settings();')) throw new Error('S-tier background motion and settings must load without mounting a competing home dashboard');
const reference = readFileSync('nova-reference.js', 'utf8');
if (![html,reference,tier,workspace].every(source=>source.includes('Noto Sans Devanagari'))) throw new Error('Hindi/Devanagari font fallback is missing from a primary NOVA surface');
if (!html.includes('src=\"/nova-reference.js\"') || !['data-group=\"build\"','data-group=\"learn\"','data-group=\"agents\"','NOVA Build / नोवा बिल्ड','NOVA Learn / नोवा लर्न','NOVA Agents / नोवा एजेंट्स'].every(x=>reference.includes(x)) || !reference.includes('tr=(en,hi)=>`${en} / ${hi}`') || !reference.includes('body.nova-dashboard-home #box') || !reference.includes("document.body.classList.remove('nova-dashboard-home')") || reference.includes('id=\"nrAsk\"') || reference.includes('data-nr=') || reference.includes('NovaWorkspaceActions') || !reference.includes('nova-reference-style')) throw new Error('Reference home must be bilingual and keep photo/voice/chat actions inside their workspaces');
if (!appScript.includes("h.id='hi'")) throw new Error('Externalized legacy home renderer no longer creates the S-Tier mount point');
if (!appScript.includes("document.body.classList.add('nova-dashboard-home')") || appScript.includes('NOVA ASSISTANT')) throw new Error('Legacy dashboard must render only the NOVA workspace mount and must not expose a global assistant card');
if (!reference.includes("const root=$('#hi');") || !reference.includes("const host=$('#log');") || reference.includes('#novaSHome')) throw new Error('Reference dashboard must mount into #hi and observe #log for future home renders');


for (const file of ['scripts/runtime-smoke.mjs','scripts/browser-smoke.mjs','scripts/smoke.mjs','scripts/wait-live.mjs','scripts/company-cloud-browser.mjs','scripts/supabase-edge-smoke.mjs','scripts/smoke-free-image.mjs']) syntaxCheck(file, readFileSync(file,'utf8'));

if (!html.includes('id="msgs"')) throw new Error('Previous standard chat UI input was not found');
if (!appScript.includes("typeof en==='string'&&typeof hi==='string'") || !appScript.includes("return en+' / '+hi")) throw new Error('Core NOVA interface must render English and Hindi together');
if (!['src="/mode-registry.js"','src="/mode-workspace.js"','src="/nova-suite.js"','src="/s-tier.js"'].every(x=>html.includes(x))) throw new Error('NOVA Learn, Build and Agents workspace scripts are not connected in the homepage');
if (!['src="/nova-business-core.js"','src="/nova-business.js"','src="/nova-business-cloud.js"'].every(x=>html.includes(x)) || !html.includes('@supabase/supabase-js@2.119.0')) throw new Error('NOVA BI scripts and Supabase client are not connected in the homepage');
if (!['nova-home','nova-hero','nova-workspaces','nova-tool-grid'].every(x=>html.includes(x))) throw new Error('NOVA dashboard UI components missing');
if (!appScript.includes('localStorage.getItem(\'nova\')') || !appScript.includes('const persistable=()=>') || !appScript.includes('JSON.stringify(persistable())') || !appScript.includes('One-time migration: keep any previously saved key available for this tab') || appScript.includes('localStorage.setItem(\'nova\',JSON.stringify(S))')) throw new Error('Nova storage compatibility or BYOK secret-persistence protection changed');
const shareHandler = appScript.slice(appScript.indexOf("$('share').onclick"), appScript.indexOf("$('mem').onclick"));
if (!shareHandler.includes('const exportedConfig={api:CFG.api,brand:CFG.brand,base:k.base,model:k.model}') || !shareHandler.includes('JSON.stringify(exportedConfig)') || shareHandler.includes("key:$('key').value") || shareHandler.includes('JSON.stringify(k)')) throw new Error('Shareable NOVA exports must include provider settings but never a personal API key');
if (!appScript.includes('Your API key is never included') || !appScript.includes('आपकी API key शामिल नहीं होती')) throw new Error('BYOK export privacy disclosure must explain that recipients supply their own keys');

if (html.includes('CHAT · LEARN · MASTER') || html.includes('IMAGINE · DESIGN · CREATE') || html.includes('RESEARCH · DISCOVER · EXPLORE')) throw new Error('Old four-workspace visual shell remains');
if (!html.includes('id="dset"')) throw new Error('Settings panel missing');
if (appScript.includes('Nova AI has no server of its own') || appScript.includes('Nova AI का अपना कोई सर्वर नहीं है।')) throw new Error('Outdated privacy disclosure incorrectly says NOVA has no backend');
if (!appScript.includes('backend hosted on Render') || !appScript.includes('account-based cloud chat sync')) throw new Error('NOVA backend and local-storage privacy disclosures are missing');
if (!html.includes('id="photo"')) throw new Error('Image/photo panel missing');
if (!appScript.includes('async function pollImageJob(') || !appScript.includes("API+'/image/status/'") || !appScript.includes('pollImageJob(j.jobId,sig)') || !appScript.includes("sig.addEventListener('abort',abort,{once:true})") || !appScript.includes("e1?.status===429")) throw new Error('Image studio must abort polling promptly and must not bypass server image rate limits');
if (!/@media\(max-width:760px\)\{#side\{position:fixed;[^}]*transform:translateX\(-100%\)/.test(html) || !html.includes('#side.open{transform:none}') || html.includes('#side,#main{position:relative')) throw new Error('Mobile navigation drawer must remain fixed, initially off-canvas, and openable');
if (!server.includes("app.get('/s-tier.js'") || !server.includes("app.get('/nova-suite.js'") || !server.includes("app.get('/nova-business-core.js'") || !server.includes("app.get('/nova-business.js'") || !server.includes("app.get('/nova-business-cloud.js'")) throw new Error('Existing optional feature asset routes missing');
// Frontend entry points are external files and are syntax-checked above.
process.stdout.write('PASS previous standard UI, storage compatibility, required assets, and project syntax checks\n');
