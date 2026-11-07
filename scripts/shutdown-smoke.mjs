import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const port = 18787 + (process.pid % 1000);
const child = spawn(process.execPath, ['nova-server.txt'], {
  env: { ...process.env, PORT: String(port), LLM_KEY: 'shutdown-test', LLM_MODEL: 'shutdown-test', SELFTEST_ON_START: '0' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let stdout = '';
let stderr = '';
child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });

try {
  const deadline = Date.now() + 10000;
  let ready = false;
  while (Date.now() < deadline && child.exitCode === null) {
    try {
      const response = await fetch('http://127.0.0.1:' + port + '/health', { signal: AbortSignal.timeout(700) });
      if (response.status === 200) { ready = true; break; }
    } catch {}
    await sleep(100);
  }
  assert.equal(ready, true, 'NOVA server did not become healthy. stdout=' + stdout + ' stderr=' + stderr);

  child.kill('SIGTERM');
  const exit = await Promise.race([
    once(child, 'exit'),
    sleep(5000).then(() => null)
  ]);
  assert.ok(exit, 'NOVA server did not exit within 5 seconds after SIGTERM');
  assert.equal(exit[0], 0, 'NOVA server exited unexpectedly. stderr=' + stderr);
  assert.match(stdout, /NOVA graceful shutdown requested: SIGTERM/);
  assert.match(stdout, /NOVA graceful shutdown complete/);
  console.log('PASS graceful SIGTERM shutdown and request-draining lifecycle');
} finally {
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
}
