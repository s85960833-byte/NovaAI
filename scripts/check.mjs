import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function syntaxCheck(name, source) {
  const file = join('/tmp', 'novaai-' + name.replace(/[^a-z0-9]/gi, '-') + '.js');
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

if (pkg.scripts?.start !== 'node nova-server.txt') throw new Error('Render start command and package.json are out of sync');
if (!server.includes("app.post('/api/live'") || !server.includes("app.get('/api/live/selftest'") || !server.includes("app.get('/api/feed'")) throw new Error('Expected live API routes are missing');
if (server.includes('nova-ai-mlxf.onrender.com')) throw new Error('Legacy website URL remains in the active server file');
syntaxCheck('backend', server);

const scripts = [...html.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi)].map(match => match[1]).filter(x => x.trim());
if (!scripts.length) throw new Error('No inline frontend JavaScript was found');
scripts.forEach((source, i) => syntaxCheck('frontend-' + (i + 1), source));

if (process.exitCode) process.exit(process.exitCode);
process.stdout.write('PASS project structure and syntax checks\n');
