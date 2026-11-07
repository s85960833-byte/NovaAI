'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { secureProviderBase } = require('../nova-provider-url');

test('secure provider URLs accept HTTPS and normalize trailing slashes', () => {
  assert.equal(
    secureProviderBase('LLM_BASE', 'https://api.example.test/v1///', 'https://fallback.test', false),
    'https://api.example.test/v1'
  );
});

test('secure provider URLs reject insecure public HTTP', () => {
  assert.throws(() => secureProviderBase('LLM_BASE', 'http://api.example.test/v1', 'https://fallback.test', false), /must use HTTPS/);
});

test('secure provider URLs allow HTTP only for explicit local development hosts', () => {
  assert.equal(secureProviderBase('LLM_BASE', 'http://127.0.0.1:8080/v1', 'https://fallback.test', true), 'http://127.0.0.1:8080/v1');
  assert.equal(secureProviderBase('LLM_BASE', 'http://localhost:8080/v1', 'https://fallback.test', true), 'http://localhost:8080/v1');
  assert.throws(() => secureProviderBase('LLM_BASE', 'http://localhost:8080/v1', 'https://fallback.test', false), /must use HTTPS/);
  assert.throws(() => secureProviderBase('LLM_BASE', 'http://127.0.0.2:8080/v1', 'https://fallback.test', true), /must use HTTPS/);
});

test('secure provider URLs reject embedded credentials, query strings and fragments', () => {
  assert.throws(() => secureProviderBase('LLM_BASE', 'https://user:pass@api.example.test/v1', 'https://fallback.test', false), /must not contain URL credentials/);
  assert.throws(() => secureProviderBase('LLM_BASE', 'https://api.example.test/v1?token=secret', 'https://fallback.test', false), /must not contain a query string/);
  assert.throws(() => secureProviderBase('LLM_BASE', 'https://api.example.test/v1#fragment', 'https://fallback.test', false), /must not contain a query string/);
});

test('secure provider URLs reject malformed and non-HTTP protocols', () => {
  assert.throws(() => secureProviderBase('LLM_BASE', 'not a URL', 'https://fallback.test', false), /absolute URL/);
  assert.throws(() => secureProviderBase('LLM_BASE', 'ftp://api.example.test/v1', 'https://fallback.test', false), /must use HTTPS/);
});
