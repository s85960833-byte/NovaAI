'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createOwnerGuard, parseOwnerIds } = require('../str/auth');

const OWNER_ID = '11111111-2222-4333-8444-555555555555';
const OTHER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const TOKEN = 'test.supabase.access.token.value-long-enough-for-validation';

function request(token = TOKEN) {
  const headers = token ? { authorization: 'Bearer ' + token } : {};
  return { get: name => headers[String(name).toLowerCase()] };
}
function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}
async function invoke(guard, req = request()) {
  const res = response();
  let nextCalled = false;
  await guard(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
}
function authFetch(userId, status = 200) {
  return async (url, options) => {
    assert.equal(String(url), 'https://project.example/auth/v1/user');
    assert.equal(options.method, 'GET');
    assert.equal(options.headers.apikey, 'sb_publishable_testkey0123456789012345abcdef');
    assert.equal(options.headers.Authorization, 'Bearer ' + TOKEN);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => ({ id: userId })
    };
  };
}

test('owner allow-list parser accepts UUIDs and marks malformed entries invalid', () => {
  const good = parseOwnerIds(OWNER_ID + ', ' + OTHER_ID);
  assert.equal(good.invalid, false);
  assert.deepEqual([...good.ids], [OWNER_ID, OTHER_ID]);
  const bad = parseOwnerIds(OWNER_ID + ',not-an-id');
  assert.equal(bad.invalid, true);
  assert.equal(bad.ids.size, 1);
  assert.equal(parseOwnerIds('').ids.size, 0);
});

test('STR owner gate requires a bearer session before checking configuration', async () => {
  const guard = createOwnerGuard({ ownerIds: [], fetchImpl: async () => { throw new Error('must not fetch'); } });
  const result = await invoke(guard, request(null));
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.res.body.code, 'STR_AUTH_REQUIRED');
  assert.equal(result.nextCalled, false);
});

test('STR owner gate fails closed when no owner UUID has been configured', async () => {
  const guard = createOwnerGuard({ ownerIds: [], fetchImpl: async () => { throw new Error('must not fetch'); } });
  const result = await invoke(guard);
  assert.equal(result.res.statusCode, 503);
  assert.equal(result.res.body.code, 'STR_OWNER_GATE_NOT_CONFIGURED');
  assert.equal(result.nextCalled, false);
});

test('STR owner gate rejects an invalid Supabase session', async () => {
  const guard = createOwnerGuard({
    ownerIds: [OWNER_ID],
    projectUrl: 'https://project.example',
    publishableKey: 'sb_publishable_testkey0123456789012345abcdef',
    fetchImpl: authFetch(null, 401)
  });
  const result = await invoke(guard);
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.res.body.code, 'STR_SESSION_INVALID');
  assert.equal(result.nextCalled, false);
});

test('STR owner gate denies a valid NOVA account that is not allow-listed', async () => {
  const guard = createOwnerGuard({
    ownerIds: [OWNER_ID],
    projectUrl: 'https://project.example',
    publishableKey: 'sb_publishable_testkey0123456789012345abcdef',
    fetchImpl: authFetch(OTHER_ID)
  });
  const result = await invoke(guard);
  assert.equal(result.res.statusCode, 403);
  assert.equal(result.res.body.code, 'STR_OWNER_NOT_ALLOWED');
  assert.equal(result.nextCalled, false);
});

test('STR owner gate admits only a valid Supabase user whose UUID is allow-listed', async () => {
  const guard = createOwnerGuard({
    ownerIds: [OWNER_ID],
    projectUrl: 'https://project.example',
    publishableKey: 'sb_publishable_testkey0123456789012345abcdef',
    fetchImpl: authFetch(OWNER_ID)
  });
  const result = await invoke(guard);
  assert.equal(result.res.statusCode, 200);
  assert.equal(result.nextCalled, true);
  assert.deepEqual(result.req.strOwner, { id: OWNER_ID });
});

test('STR owner gate returns a closed 503 when Supabase verification is unavailable', async () => {
  const guard = createOwnerGuard({
    ownerIds: [OWNER_ID],
    projectUrl: 'https://project.example',
    publishableKey: 'sb_publishable_testkey0123456789012345abcdef',
    fetchImpl: async () => { throw new Error('network timeout'); }
  });
  const result = await invoke(guard);
  assert.equal(result.res.statusCode, 503);
  assert.equal(result.res.body.code, 'STR_AUTH_UNAVAILABLE');
  assert.equal(result.nextCalled, false);
});


test('STR owner gate fails closed when the owner allow-list contains an invalid UUID', async () => {
  const guard = createOwnerGuard({
    ownerIds: [OWNER_ID, 'not-a-uuid'],
    projectUrl: 'https://project.example',
    publishableKey: 'sb_publishable_testkey0123456789012345abcdef',
    fetchImpl: async () => { throw new Error('must not fetch'); }
  });
  const result = await invoke(guard);
  assert.equal(result.res.statusCode, 503);
  assert.equal(result.res.body.code, 'STR_OWNER_GATE_NOT_CONFIGURED');
  assert.equal(result.nextCalled, false);
});

test('STR owner gate returns a closed 503 for Supabase upstream errors', async () => {
  const guard = createOwnerGuard({
    ownerIds: [OWNER_ID],
    projectUrl: 'https://project.example',
    publishableKey: 'sb_publishable_testkey0123456789012345abcdef',
    fetchImpl: authFetch(null, 503)
  });
  const result = await invoke(guard);
  assert.equal(result.res.statusCode, 503);
  assert.equal(result.res.body.code, 'STR_AUTH_UNAVAILABLE');
  assert.equal(result.nextCalled, false);
});

test('STR owner gate rejects malformed user payloads without granting access', async () => {
  const guard = createOwnerGuard({
    ownerIds: [OWNER_ID],
    projectUrl: 'https://project.example',
    publishableKey: 'sb_publishable_testkey0123456789012345abcdef',
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ id: 'not-a-uuid' }) })
  });
  const result = await invoke(guard);
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.res.body.code, 'STR_SESSION_INVALID');
  assert.equal(result.nextCalled, false);
});

test('STR owner gate fails closed when Supabase returns an unreadable user body', async () => {
  const guard = createOwnerGuard({
    ownerIds: [OWNER_ID],
    projectUrl: 'https://project.example',
    publishableKey: 'sb_publishable_testkey0123456789012345abcdef',
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new Error('invalid json'); } })
  });
  const result = await invoke(guard);
  assert.equal(result.res.statusCode, 503);
  assert.equal(result.res.body.code, 'STR_AUTH_UNAVAILABLE');
  assert.equal(result.nextCalled, false);
});

test('STR owner gate rejects malformed bearer headers and never logs or reflects credentials', async () => {
  const guard = createOwnerGuard({ ownerIds: [OWNER_ID], fetchImpl: async () => { throw new Error('must not fetch'); } });
  const result = await invoke(guard, request('short token'));
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.res.body.code, 'STR_AUTH_REQUIRED');
  assert.equal(JSON.stringify(result.res.body).includes(TOKEN), false);
});
