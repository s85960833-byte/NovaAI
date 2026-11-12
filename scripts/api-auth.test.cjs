'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createSupabaseUserMiddleware, normalizeSupabaseAuthUrl } = require('../nova-api-auth');

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

async function run(middleware, authorization) {
  const req = { headers: { authorization }, get(name) { return this.headers[name]; } };
  const res = responseRecorder();
  let nextCalled = false;
  await middleware(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
}

test('Supabase auth URL must be an HTTPS origin only', () => {
  assert.equal(normalizeSupabaseAuthUrl('https://project.supabase.co'), 'https://project.supabase.co/auth/v1/user');
  for (const value of ['http://project.supabase.co', 'https://user:pass@project.supabase.co', 'https://project.supabase.co/path', 'https://project.supabase.co/?x=1', 'not-a-url', '']) {
    assert.throws(() => normalizeSupabaseAuthUrl(value));
  }
});

test('auth middleware requires a bounded Bearer token before network access', async () => {
  let calls = 0;
  const middleware = createSupabaseUserMiddleware({
    supabaseUrl: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
    fetchImpl: async () => { calls++; throw new Error('must not call'); }
  });
  for (const header of [undefined, 'Basic abc', 'Bearer ', 'Bearer ' + 'x'.repeat(8193)]) {
    const result = await run(middleware, header);
    assert.equal(result.res.statusCode, 401);
    assert.equal(result.nextCalled, false);
  }
  assert.equal(calls, 0);
});

test('valid Supabase user is attached to the request without trusting client claims', async () => {
  let request;
  const middleware = createSupabaseUserMiddleware({
    supabaseUrl: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, status: 200, json: async () => ({ id: 'user-123', email: 'verified@example.test', user_metadata: { role: 'admin' } }) };
    }
  });
  const result = await run(middleware, 'Bearer signed.jwt.token');
  assert.equal(result.nextCalled, true);
  assert.equal(result.req.novaUser.id, 'user-123');
  assert.equal(result.req.novaUser.email, 'verified@example.test');
  assert.equal(Object.hasOwn(result.req.novaUser, 'role'), false);
  assert.equal(request.url, 'https://project.supabase.co/auth/v1/user');
  assert.equal(request.options.headers.apikey, 'sb_publishable_test');
  assert.equal(request.options.headers.Authorization, 'Bearer signed.jwt.token');
});

test('invalid tokens are rejected and upstream failures fail closed', async () => {
  const invalid = createSupabaseUserMiddleware({
    supabaseUrl: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
    fetchImpl: async () => ({ ok: false, status: 401 })
  });
  const invalidResult = await run(invalid, 'Bearer expired.token');
  assert.equal(invalidResult.res.statusCode, 401);
  assert.equal(invalidResult.nextCalled, false);

  const malformedUser = createSupabaseUserMiddleware({
    supabaseUrl: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ email: 'no-id@example.test' }) })
  });
  const malformedResult = await run(malformedUser, 'Bearer token.without.user.id');
  assert.equal(malformedResult.res.statusCode, 401);
  assert.equal(malformedResult.nextCalled, false);

  const unavailable = createSupabaseUserMiddleware({
    supabaseUrl: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
    fetchImpl: async () => { throw new Error('network unavailable'); }
  });
  const unavailableResult = await run(unavailable, 'Bearer valid-looking.token');
  assert.equal(unavailableResult.res.statusCode, 503);
  assert.equal(unavailableResult.nextCalled, false);
});

test('authentication configuration fails at startup instead of silently failing open', () => {
  assert.throws(() => createSupabaseUserMiddleware({ publishableKey: 'sb_publishable_test' }), /SUPABASE_URL/);
  assert.throws(() => createSupabaseUserMiddleware({ supabaseUrl: 'https://project.supabase.co' }), /SUPABASE_PUBLISHABLE_KEY/);
});

test('Express API routes are gated before JSON body parsing when enabled', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const server = fs.readFileSync(path.join(__dirname, '..', 'nova-server.txt'), 'utf8');
  const gate = server.indexOf("app.use('/api', (q, r, next) => {\n  if (q.path === '/config' || q.path === '/feed') return next();");
  const parser = server.indexOf("app.use(express.json({ limit: '6mb' }));");
  assert.ok(gate >= 0, 'API auth gate must exist');
  assert.ok(parser > gate, 'unauthenticated requests must be rejected before JSON parsing');
  assert.match(server, /const apiAuthRequired = E\.NOVA_API_AUTH_REQUIRED === '1'/);
  assert.match(server, /userId: q\.novaUser\?\.id \|\| null/);
  assert.match(server, /job\.userId !== q\.novaUser\?\.id/);
  assert.match(server, /imageRateKey = q\.novaUser\?\.id \? 'user:' \+ q\.novaUser\.id : 'ip:' \+ q\.ip/);
  assert.match(server, /liveRateKey = q\.novaUser\?\.id \? 'user:' \+ q\.novaUser\.id : 'ip:' \+ q\.ip/);
});

test('browser attaches Supabase access tokens to same-origin protected API requests', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const client = fs.readFileSync(path.join(__dirname, '..', 'nova-account.js'), 'utf8');
  assert.match(client, /getClient\(\)\.auth\.getSession\(\)/);
  assert.match(client, /headers\.set\('Authorization','Bearer '\+token\)/);
  assert.match(client, /target\.pathname\.startsWith\('\/api\/'\)/);
});
