import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
if (!readme.includes('Only non-paid, adult-supervised buyer-interest conversations') ||
    !readme.includes('Do not accept payments, deposits, customer data or confidential information') ||
    !pitchReadiness.includes('Decision: LIMITED DISCOVERY ONLY') ||
    !pitchReadiness.includes('NOT READY FOR PAID SALE OR PRODUCTION CUSTOMER ONBOARDING') ||
    !pitchReadiness.includes('No payments, deposits, paid onboarding or confidential-data processing') ||
    !pitchKit.includes('Non-paid, adult-supervised discovery only') ||
    !pitchKit.includes('No payment, deposit, paid trial, customer onboarding or confidential-data processing') ||
    !pitchScript.includes('For supervised, non-paid discovery only') ||
    !pitchScript.includes('Do not offer a paid product or customer-data onboarding') ||
    !pitchScript.includes('Do not request payment, confidential data, passwords or API keys')) {
  throw new Error('Pitch materials must consistently allow supervised non-paid discovery only and block paid sales, deposits and customer-data onboarding');
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
const rateLimitMigration = readFileSync('supabase/migrations/20261101163655_nova_bi_api_rate_limits.sql', 'utf8');
if (!/security definer\s+set search_path = public, pg_temp/.test(rateLimitMigration)) throw new Error('Original applied rate-limit migration must retain its historical search_path; forward hardening belongs in a separate migration');
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
const accountClient = readFileSync('nova-account.js', 'utf8');
const workspaceMigration = readFileSync('supabase/migrations/20261108093219_nova_user_workspace_sync.sql', 'utf8');
syntaxCheck('nova-account.js', accountClient);
if (!html.includes('id="novaAccountDialog"') || !html.includes('id="novaAccountMount"') || !html.includes('/nova-account.js')) throw new Error('NOVA account UI is not mounted in settings');
if (!server.includes("app.get('/nova-account.js'")) throw new Error('NOVA account script route is missing');
function cloudClientExportAvailable(){return readFileSync('nova-business-cloud.js','utf8').includes('getClient:ensureClient')}
if (!cloudClientExportAvailable()) throw new Error('NOVA account must reuse the shared Supabase client');
if (!accountClient.includes('signInWithPassword') || !accountClient.includes('.auth.signUp') || !accountClient.includes('resetPasswordForEmail') || !accountClient.includes('.auth.resend')) throw new Error('NOVA account auth flows are incomplete');
if (!accountClient.includes("localStorage.getItem(SYNC_KEY)==='true'") || !accountClient.includes('Sync my chats') || !accountClient.includes('nova_user_workspaces')) throw new Error('Optional account cloud sync controls are missing');
if (!accountClient.includes('Delete cloud backup') || !accountClient.includes("from('nova_user_workspaces').delete()")) throw new Error('User cloud-backup deletion control is missing');
if (!accountClient.includes("table().update({payload,schema_version:1,updated_at})") || !accountClient.includes(".eq('updated_at',remote.updated_at).select('user_id').maybeSingle()") || !accountClient.includes("insertError.code!=='23505'") || accountClient.includes("table().upsert(")) throw new Error('Cloud sync must use compare-and-swap updates and retry first-insert races rather than last-write-wins upserts');
if (!accountClient.includes('pendingSync=true') || !accountClient.includes('if(pendingSync){pendingSync=false;queueMicrotask(()=>syncNow())}')) throw new Error('Local edits made during an active sync must be queued for a follow-up sync');
if (!accountClient.includes('deletedChatIds:Array.isArray(raw.deletedChatIds)')) throw new Error('Cloud sync snapshot must include chat deletion tombstones');

for (const fragment of ['enable row level security','to authenticated','(select auth.uid())','with check (user_id = (select auth.uid()))','payload_size']) {
  if (!workspaceMigration.toLowerCase().includes(fragment)) throw new Error('Per-user workspace migration is missing security control: '+fragment);
}
if (workspaceMigration.includes('service_role') || workspaceMigration.includes('to anon')) throw new Error('Per-user workspace table must not expose anonymous or service-role access');
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
if (!tier.includes('function localizeBilingual(root)')) throw new Error('S-tier workspace cards and settings must follow the selected interface language');
if (!tier.includes('tr=(a,b)=>hi()?b:a') || !workspace.includes('tr=(en,hi)=>isHi()?hi:en')) throw new Error('Workspace labels must follow the selected English/Hindi interface language');
if (!tier.includes('Three connected workspaces for learning, building and AI agents.') || !tier.includes("tr('THREE WORKSPACES','तीन वर्कस्पेस')") || tier.includes('Four connected spaces') || tier.includes('चार वर्कस्पेस')) throw new Error('Home copy must consistently describe exactly three workspaces in both languages');
if (!tier.includes('function ambientAtmosphere()') || !tier.includes('function settings()') || !tier.includes('function boot(){ambientAtmosphere();accent();settings();')) throw new Error('S-tier background motion and settings must load without mounting a competing home dashboard');
const reference = readFileSync('nova-reference.js', 'utf8');
if (![html,reference,tier,workspace].every(source=>source.includes('Noto Sans Devanagari'))) throw new Error('Hindi/Devanagari font fallback is missing from a primary NOVA surface');
if (!html.includes('src=\"/nova-reference.js\"') || !['data-group=\"build\"','data-group=\"learn\"','data-group=\"agents\"',"tr('NOVA Build','नोवा बिल्ड')","tr('NOVA Learn','नोवा लर्न')","tr('NOVA Agents','नोवा एजेंट्स')"].every(x=>reference.includes(x)) || !reference.includes('tr=(en,hi)=>isHi()?hi:en') || !reference.includes('body.nova-dashboard-home:not(.nova-image-mode) #box') || !appScript.includes("document.body.classList.toggle('nova-image-mode',!!IM)") || !reference.includes("document.body.classList.remove('nova-dashboard-home')") || reference.includes('id=\"nrAsk\"') || reference.includes('data-nr=') || reference.includes('NovaWorkspaceActions') || !reference.includes('nova-reference-style')) throw new Error('Reference home must be bilingual and keep photo/voice/chat actions inside their workspaces');
if (!appScript.includes("h.id='hi'")) throw new Error('Externalized legacy home renderer no longer creates the S-Tier mount point');
if (!appScript.includes("document.body.classList.add('nova-dashboard-home')") || appScript.includes('NOVA ASSISTANT')) throw new Error('Legacy dashboard must render only the NOVA workspace mount and must not expose a global assistant card');
if (!reference.includes("const root=$('#hi');") || !reference.includes("const host=$('#log');") || reference.includes('#novaSHome')) throw new Error('Reference dashboard must mount into #hi and observe #log for future home renders');


for (const file of ['scripts/runtime-smoke.mjs','scripts/browser-smoke.mjs','scripts/smoke.mjs','scripts/wait-live.mjs','scripts/company-cloud-browser.mjs','scripts/supabase-edge-smoke.mjs','scripts/smoke-free-image.mjs']) syntaxCheck(file, readFileSync(file,'utf8'));

if (!html.includes('id="msgs"')) throw new Error('Previous standard chat UI input was not found');
if (!html.includes('id="uiLang"') || !html.includes('id="uiLangTop"') || !html.includes('<option value="en">English</option>') || !html.includes('<option value="hi">हिंदी</option>') || !appScript.includes("uiLang:'en'") || !appScript.includes("const ui=()=>S.uiLang==='hi'?'hi':'en'") || !appScript.includes("$('uiLangTop').onchange") || !appScript.includes("const L=['English','हिन्दी|Hindi'];") || !appScript.includes("window.dispatchEvent(new CustomEvent('nova:ui-language-changed'")) throw new Error('Global English/Hindi interface language switch is missing');
if (!appScript.includes("document.documentElement.dir='ltr'") || appScript.includes("const custom=S.tr&&S.tr[S.rl]")) throw new Error('Interface language must remain independent from chat reply language and direction');
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
if (!appScript.includes('backend hosted on Render') || !appScript.includes('Optional account-based cloud sync is OFF by default') || !appScript.includes('image attachments are excluded')) throw new Error('NOVA backend and cloud-sync privacy disclosures are missing');
if (!html.includes('id="photo"')) throw new Error('Image/photo panel missing');
if (!appScript.includes('async function pollImageJob(') || !appScript.includes("API+'/image/status/'") || !appScript.includes('pollImageJob(j.jobId,sig)') || !appScript.includes("sig.addEventListener('abort',abort,{once:true})") || !appScript.includes("e1?.status===429")) throw new Error('Image studio must abort polling promptly and must not bypass server image rate limits');
if (!/@media\(max-width:760px\)\{#side\{position:fixed;[^}]*transform:translateX\(-100%\)/.test(html) || !html.includes('#side.open{transform:none}') || html.includes('#side,#main{position:relative')) throw new Error('Mobile navigation drawer must remain fixed, initially off-canvas, and openable');
if (!server.includes("app.get('/s-tier.js'") || !server.includes("app.get('/nova-suite.js'") || !server.includes("app.get('/nova-business-core.js'") || !server.includes("app.get('/nova-business.js'") || !server.includes("app.get('/nova-business-cloud.js'") || !server.includes("app.get('/nova-account.js'")) throw new Error('Existing optional feature asset routes missing');
if (!server.includes("const CACHE='nova-shell-v19-entry-gate'") || !server.includes("'/nova-account.js'")) throw new Error('NOVA account client must be part of the versioned offline shell');
// Frontend entry points are external files and are syntax-checked above.

const entryClient = readFileSync('nova-entry.js', 'utf8');
syntaxCheck('nova-entry.js', entryClient);
if (!html.includes('id="novaEntryGate"') || html.includes('id="novaEntryVideo"') ||
    !html.includes('nova-entry-core') || !html.includes('A NEW ERA OF INTELLIGENCE') ||
    !html.includes('/nova-entry.js') ||
    !entryClient.includes("localStorage.setItem(PLAYED_KEY, '1')") ||
    !entryClient.includes("document.cookie = COOKIE_KEY + '=1") ||
    !entryClient.includes("gate.addEventListener(type") ||
    !entryClient.includes("window.setTimeout(finish, duration)")) {
  throw new Error('NOVA crisp, non-interactive, persistent one-time motion intro is missing');
}

process.stdout.write('PASS previous standard UI, storage compatibility, required assets, and project syntax checks\n');
process.stdout.write('PASS NOVA video-first entry gate markup, interaction, asset integrity, and streaming route\n');
