import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const results = [];
const humanGates = [
  'Render Staging exact SHA and Health Check Path',
  'Approved provider eligibility, terms, credentials and spend controls',
  'Real authorised Supabase login, email delivery, refresh and redirect tests',
  'Throwaway-project two-user RLS isolation test',
  'Physical Android layout, camera and microphone tests',
  'Independent security and privacy review',
  'Verified backup and restore test',
  'Owner release approval'
];

function record(name, status, detail = '') {
  results.push({ name, status, detail });
  process.stdout.write((status === 'PASS' ? 'PASS ' : status === 'SKIP' ? 'SKIP ' : 'FAIL ') +
    name + (detail ? ' — ' + detail : '') + '\n');
}

function command(label, executable, args, options = {}) {
  process.stdout.write('\n$ ' + label + '\n');
  const isNpm = executable === 'npm';
  const result = spawnSync(
    isNpm && process.platform === 'win32' ? 'npm.cmd' : executable,
    args,
    {
      cwd: root,
      encoding: 'utf8',
      stdio: 'inherit',
      shell: isNpm && process.platform === 'win32',
      env: { ...process.env, ...options.env }
    }
  );
  const ok = result.status === 0 && !result.error;
  record(label, ok ? 'PASS' : 'FAIL', ok ? '' : (result.error?.message || 'exit ' + result.status));
  return ok;
}

async function waitForHealth(url, child, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Local test server exited before readiness');
    try {
      const response = await fetch(url + '/health', { signal: AbortSignal.timeout(800) });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.status === 'ok' && body.ready === true) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('Local test server health timeout');
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve => child.once('exit', resolve)),
    new Promise(resolve => setTimeout(resolve, 3000))
  ]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

async function run() {
  process.stdout.write('NOVA AI automated release checks (local tests only)\n');
  process.stdout.write('No production URL, real provider, real Supabase project, or real account is called.\n');

  if (!command('node scripts/check.mjs', process.execPath, ['scripts/check.mjs'])) {
    // Keep running independent tests to produce a complete diagnostic table.
  }

  const testScripts = Object.keys(pkg.scripts)
    .filter(name => name.startsWith('test:') &&
      name !== 'test:rls-isolation' &&
      name !== 'test:mobile-layout' &&
      name !== 'test:release-check-contract')
    .sort();

  for (const name of testScripts) {
    command('npm run ' + name, 'npm', ['run', name]);
  }

  // Browser/runtime checks use a local server with fake keys and no provider calls.
  const port = String(18787 + (process.pid % 900));
  const baseUrl = 'http://127.0.0.1:' + port;
  const env = {
    ...process.env,
    PORT: port,
    NODE_ENV: 'test',
    LLM_KEY: 'release-check-fake-key',
    LLM_MODEL: 'release-check-mock-model',
    LLM_BASE: 'https://mock.release-check.invalid/v1',
    NOVA_API_AUTH_REQUIRED: '0',
    NOVA_USAGE_QUOTA_REQUIRED: '0',
    AI_DISABLED: '0',
    SELFTEST_ON_START: '0',
    LIVE_SELFTEST_ENABLED: '0',
    NOVAAI_URL: baseUrl
  };
  let child;
  try {
    child = spawn(process.execPath, ['nova-server.txt'], {
      cwd: root, env, stdio: 'ignore'
    });
    await waitForHealth(baseUrl, child);
    record('local mock-key server readiness', 'PASS');

    command('node scripts/runtime-smoke.mjs', process.execPath, ['scripts/runtime-smoke.mjs'], { NOVAAI_URL: baseUrl });
    command('node scripts/browser-smoke.mjs', process.execPath, ['scripts/browser-smoke.mjs'], { NOVAAI_URL: baseUrl });
    command('npm run test:mobile-layout', 'npm', ['run', 'test:mobile-layout'], { NOVAAI_URL: baseUrl });
    command('node scripts/company-cloud-browser.mjs', process.execPath, ['scripts/company-cloud-browser.mjs'], { NOVAAI_URL: baseUrl });
    command('node scripts/bi-proof-browser.mjs', process.execPath, ['scripts/bi-proof-browser.mjs'], { NOVAAI_URL: baseUrl });
  } catch (error) {
    record('local browser/runtime test server', 'FAIL', error.message);
  } finally {
    await stopServer(child);
  }

  // Graceful shutdown has its own isolated child server and fake credentials.
  command('node scripts/shutdown-smoke.mjs', process.execPath, ['scripts/shutdown-smoke.mjs']);

  // This audit may require internet access. It never contacts a production app/provider.
  command('npm audit --omit=dev --audit-level=high', 'npm', ['audit', '--omit=dev', '--audit-level=high']);

  record('throwaway PostgreSQL migration/RLS integration', 'SKIP',
    'run in disposable CI PostgreSQL or a dedicated throwaway database; never point it at a hosted production database');
  record('real Supabase RLS isolation', 'SKIP',
    'run npm run test:rls-isolation only with explicit throwaway database confirmation');

  process.stdout.write('\nAUTOMATED RESULT TABLE\n');
  process.stdout.write('| Check | Result | Detail |\n|---|---|---|\n');
  for (const item of results) {
    process.stdout.write('| ' + item.name.replace(/\|/g, '/') + ' | ' + item.status +
      ' | ' + item.detail.replace(/\|/g, '/') + ' |\n');
  }

  process.stdout.write('\nHUMAN GATES\n');
  for (const gate of humanGates) process.stdout.write('| ' + gate + ' | UNVERIFIED |\n');

  const failed = results.filter(item => item.status === 'FAIL').length;
  const skipped = results.filter(item => item.status === 'SKIP').length;
  const allHumanVerified = false; // Intentionally fail-closed; owner evidence is required.
  const releaseGo = failed === 0 && skipped === 0 && allHumanVerified;
  process.stdout.write('\nAutomated failures: ' + failed + '; skipped checks: ' + skipped + '; human gates unverified: ' + humanGates.length + '\n');
  process.stdout.write(releaseGo ? 'RELEASE: GO\n' : 'RELEASE: NO-GO\n');
  process.exitCode = releaseGo ? 0 : 1;
}

run().catch(error => {
  process.stderr.write('Release check crashed safely: ' + error.message + '\nRELEASE: NO-GO\n');
  process.exitCode = 1;
});
