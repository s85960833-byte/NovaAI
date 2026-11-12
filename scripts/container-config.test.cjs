const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
const ignore = fs.readFileSync('.dockerignore', 'utf8').split(/\r?\n/).map(x => x.trim());
const compose = fs.readFileSync('docker-compose.yml', 'utf8');

test('container uses supported Node 22 runtime and production-only dependencies', () => {
  assert.match(dockerfile, /^FROM node:22-/m);
  assert.match(dockerfile, /npm ci --omit=dev/);
  assert.match(dockerfile, /NODE_ENV=production/);
});

test('container drops root privileges and exposes the app health check', () => {
  assert.match(dockerfile, /^USER node$/m);
  assert.match(dockerfile, /HEALTHCHECK[\s\S]*process\\.env\\.PORT[\s\S]*\/health/);
  assert.match(dockerfile, /CMD \["node", "nova-server\.txt"\]/);
});

test('Docker build context excludes local secrets and credential files', () => {
  for (const pattern of ['.env', '.env.*', '*.pem', '*.key', '*.p12', '*.pfx', 'credentials*.json']) {
    assert.ok(ignore.includes(pattern), 'missing .dockerignore entry: ' + pattern);
  }
  assert.ok(!/^COPY\s+\.env\b/m.test(dockerfile), 'must not copy local environment file');
});

test('Compose maps port 3000 and loads secrets from the local env file', () => {
  assert.match(compose, /env_file:\s*\n\s+- \.env/);
  assert.match(compose, /"3000:3000"/);
  assert.match(compose, /restart: unless-stopped/);
});
