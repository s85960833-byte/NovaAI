'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ROUTES,
  routeNovaMessage,
  routeInstruction
} = require('../nova-orchestrator');

function body(text, extra = {}) {
  return {
    ...extra,
    messages: [{ role: 'user', content: text }]
  };
}

test('exports the complete required route vocabulary', () => {
  assert.deepEqual(ROUTES, [
    'chat',
    'live-search',
    'deep-research',
    'code',
    'prompt-writing',
    'document/PDF',
    'image',
    'voice',
    'build-app/site',
    'agent-task'
  ]);
});

test('ordinary messages route to chat', () => {
  const result = routeNovaMessage(body('Explain photosynthesis simply.'));
  assert.equal(result.route, 'chat');
  assert.equal(result.capabilityStatus, 'available');
});

test('time-sensitive prompts route to live search and never claim a missing search', () => {
  const withoutContext = routeNovaMessage(body('What is the latest exam result update?'));
  assert.equal(withoutContext.route, 'live-search');
  assert.equal(withoutContext.hasLiveData, false);
  assert.match(withoutContext.instruction, /no verified live retrieval context/i);

  const withContext = routeNovaMessage({
    messages: [
      { role: 'system', content: '== LIVE DATA == retrieved 2026-11-14. [1] Official source.' },
      { role: 'user', content: 'What is the latest exam result update?' }
    ]
  });
  assert.equal(withContext.hasLiveData, true);
  assert.match(withContext.instruction, /numbered sources/i);
});

test('document context is routed to partial document assistance', () => {
  const result = routeNovaMessage({
    messages: [
      { role: 'system', content: 'Uploaded document (notice.pdf), answer from it.' },
      { role: 'user', content: 'Explain this notice in Hindi.' }
    ]
  });
  assert.equal(result.route, 'document/PDF');
  assert.equal(result.capabilityStatus, 'partial');
});

test('image input routes to vision analysis but does not guarantee provider success', () => {
  const result = routeNovaMessage({
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this picture?' },
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,AA==' } }
      ]
    }]
  });
  assert.equal(result.route, 'image');
  assert.equal(result.hasImage, true);
  assert.match(result.instruction, /configured vision provider/i);
});

test('voice metadata routes speech-originated text', () => {
  const result = routeNovaMessage(body('Please solve this equation.', { novaInputMode: 'voice' }));
  assert.equal(result.route, 'voice');
});

test('deep research is explicitly marked unavailable as a durable workflow', () => {
  const result = routeNovaMessage(body('Do deep research on solar energy in India.'));
  assert.equal(result.route, 'deep-research');
  assert.equal(result.capabilityStatus, 'not_implemented');
  assert.match(result.instruction, /durable deep-research workflow is not implemented/i);
});

test('website/app builder requests fall back to code assistance only', () => {
  const result = routeNovaMessage(body('Build me a website for a coaching centre.'));
  assert.equal(result.route, 'build-app/site');
  assert.equal(result.execution, 'code-assistance-only');
  assert.match(result.instruction, /live preview/i);
});

test('agent requests are single-response only', () => {
  const result = routeNovaMessage(body('Run an agent task to research, compare, and export a report.'));
  assert.equal(result.route, 'agent-task');
  assert.equal(result.capabilityStatus, 'not_implemented');
  assert.match(result.instruction, /do not promise background execution/i);
});

test('prompt-writing and code assistance remain separate intents', () => {
  assert.equal(routeNovaMessage(body('Write a production prompt for a mobile app.')).route, 'prompt-writing');
  assert.equal(routeNovaMessage(body('Debug this JavaScript function.')).route, 'code');
});

test('route instructions clearly expose delivery boundaries', () => {
  const result = routeNovaMessage(body('Create a mobile app.'));
  const prompt = routeInstruction(result);
  assert.match(prompt, /NOVA ORCHESTRATOR/);
  assert.match(prompt, /build-app\/site/);
  assert.match(prompt, /not_implemented/);
});
