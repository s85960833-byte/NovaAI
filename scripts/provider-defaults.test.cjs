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
  assert.match(source, /const providerConfigured = !!\(\(E\.LLM_KEY && E\.LLM_MODEL\) \|\| \(E\.GROQ_API_KEY && E\.GROQ_MODEL\) \|\| E\.OPENROUTER_API_KEY\)/);
  assert.match(source, /if \(E\.LLM_KEY && E\.LLM_MODEL\) providers\.push/);
  assert.match(source, /const llmChatConfigured = !!\(E\.LLM_KEY && E\.LLM_MODEL\)/);
  assert.match(source, /: \[E\.GROQ_MODEL\]/);
});

test('retired Groq and stale pinned OpenRouter defaults are absent', () => {
  assert.doesNotMatch(source, /llama-3\.3-70b-versatile/);
  assert.doesNotMatch(source, /meta-llama\/llama-3\.3-70b-instruct:free/);
});

test('Render start command stays stable and local startup loads an optional .env file', () => {
  const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', 'file://' + __filename), 'utf8'));
  assert.equal(packageJson.engines.node, '22.x');
  assert.equal(packageJson.scripts.start, 'node nova-server.txt');
  assert.equal(packageJson.scripts['start:local'], 'node --env-file-if-exists=.env nova-server.txt');
});
