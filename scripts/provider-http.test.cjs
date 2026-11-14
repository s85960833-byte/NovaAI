'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { safeRedirectTarget, readBoundedBuffer, readBoundedText } = require('../nova-http');

test('provider URLs require public HTTPS hostnames', () => {
  assert.equal(safeRedirectTarget('https://api.example.com/path').hostname, 'api.example.com');
  for (const value of [
    'http://api.example.com/',
    'https://localhost/',
    'https://x.local/',
    'https://service.internal/',
    'https://127.0.0.1/',
    'https://[::1]/',
    'https://user:pass@api.example.com/',
    'https://api.example.com:8443/'
  ]) assert.throws(() => safeRedirectTarget(value));
});

test('provider redirects are restricted to the original host', () => {
  assert.equal(
    safeRedirectTarget('https://api.example.com/next', 'api.example.com').pathname,
    '/next'
  );
  assert.throws(() => safeRedirectTarget('https://attacker.example/next', 'api.example.com'), /cross-host/);
});

test('response reader returns small bodies intact', async () => {
  const response = new Response('verified response');
  assert.equal(await readBoundedText(response, 100), 'verified response');
});

test('response reader cancels bodies that exceed the byte limit', async () => {
  const response = new Response('0123456789');
  await assert.rejects(readBoundedText(response, 5), /response too large/);
});

test('binary response reader enforces the byte cap and preserves bytes', async () => {
  const response = new Response(new Uint8Array([0, 1, 2, 255]));
  const result = await readBoundedBuffer(response, 4);
  assert.deepEqual([...result], [0, 1, 2, 255]);
  await assert.rejects(readBoundedBuffer(new Response(new Uint8Array(10)), 5), /response too large/);
});
