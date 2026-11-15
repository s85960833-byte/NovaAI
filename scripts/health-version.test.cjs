'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'nova-server.txt'), 'utf8');
const runtimeSmoke = fs.readFileSync(path.join(__dirname, 'runtime-smoke.mjs'), 'utf8');
const smoke = fs.readFileSync(path.join(__dirname, 'smoke.mjs'), 'utf8');
const deployVerifier = fs.readFileSync(path.join(__dirname, 'verify-staging-deploy.mjs'), 'utf8');
const occurrences = (source, value) => source.split(value).length - 1;

test('exactly one lightweight health route is registered before API auth middleware', () => {
  assert.equal(occurrences(server, "app.get('/health'"), 1);
  const routeIndex = server.indexOf("app.get('/health'");
  const authIndex = server.indexOf("app.use('/api'");
  assert.ok(routeIndex >= 0 && authIndex > routeIndex);
  const route = server.slice(routeIndex, server.indexOf("\napp.get('/version'", routeIndex));
  assert.match(route, /Cache-Control', 'no-store'/);
  assert.match(route, /ok: !shuttingDown/);
  assert.match(route, /ready: !shuttingDown/);
  assert.match(route, /service: 'nova-ai'/);
  assert.match(route, /status: shuttingDown \? 'shutting_down' : 'ok'/);
  assert.doesNotMatch(route, /fetch\s*\(|supabase|provider/i);
});

test('version route exposes only Render commit metadata and has no external dependency', () => {
  assert.equal(occurrences(server, "app.get('/version'"), 1);
  const start = server.indexOf("app.get('/version'");
  const end = server.indexOf("\n});", start);
  const route = server.slice(start, end > start ? end : undefined);
  assert.ok(route.includes("process.env.RENDER_GIT_COMMIT || 'unknown'"));
  assert.match(route, /Cache-Control', 'no-store'/);
  assert.doesNotMatch(route, /fetch\s*\(|supabase|provider/i);
});

test('runtime and staging smoke scripts verify health, HTTP status and deployed SHA', () => {
  assert.ok(runtimeSmoke.includes("health endpoint disables caching"));
  assert.ok(runtimeSmoke.includes("version endpoint exposes Render commit or unknown"));
  assert.ok(smoke.includes("deployment /version endpoint"));
  assert.ok(deployVerifier.includes("HTTP ${response.status}"));
  assert.ok(deployVerifier.includes("version.commit"));
  assert.ok(deployVerifier.includes("EXPECTED_PR_SHA"));
  assert.ok(!deployVerifier.includes("HTTP $DIL1"));
});
