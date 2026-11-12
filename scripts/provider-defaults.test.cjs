'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync(new URL('../nova-server.txt', 'file://' + __filename), 'utf8');

test('OpenRouter defaults to its dynamic free-model router', () => {
  assert.match(source, /E\.OPENROUTER_MODEL \|\| 'openrouter\/free'/);
  assert.match(source, /E\.OPENROUTER_API_KEY \? 'openrouter\/free'/);
});

test('Groq chat is enabled only when a model ID is explicitly configured', () => {
  assert.match(source, /const groqChatConfigured = !!\(E\.GROQ_API_KEY && E\.GROQ_MODEL\)/);
  assert.match(source, /if \(E\.GROQ_API_KEY && E\.GROQ_MODEL\) providers\.push/);
  assert.match(source, /: \[E\.GROQ_MODEL\]/);
});

test('retired Groq and stale pinned OpenRouter defaults are absent', () => {
  assert.doesNotMatch(source, /llama-3\.3-70b-versatile/);
  assert.doesNotMatch(source, /meta-llama\/llama-3\.3-70b-instruct:free/);
});
