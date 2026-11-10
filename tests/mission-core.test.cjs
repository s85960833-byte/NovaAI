'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { STATES, createMission, transitionMission, appendEvidence } = require('../nova-mission-core');

const base = () => createMission({
  id: 'mission-1', ownerId: 'user-1', title: 'Build a test website',
  workspace: 'build'
}, { now: '2026-11-10T10:00:00.000Z' });

test('creates a draft mission with an initial immutable audit event', () => {
  const mission = base();
  assert.equal(mission.state, STATES.DRAFT);
  assert.equal(mission.version, 0);
  assert.equal(mission.events.length, 1);
  assert.equal(mission.events[0].type, 'mission.created');
  assert.equal(mission.workspace, 'build');
  assert.ok(Object.isFrozen(mission));
});

test('enforces the planned execution and verification lifecycle', () => {
  let mission = base();
  mission = transitionMission(mission, 'plan');
  mission = transitionMission(mission, 'start');
  assert.equal(mission.state, STATES.RUNNING);
  assert.equal(mission.attempts, 1);
  mission = transitionMission(mission, 'verify');
  assert.equal(mission.state, STATES.VERIFYING);
  mission = appendEvidence(mission, { kind: 'browser-test', summary: 'Homepage loaded successfully' });
  mission = transitionMission(mission, 'complete', {
    verification: { passed: true, checks: [{ name: 'homepage-load', passed: true }] }
  });
  assert.equal(mission.state, STATES.COMPLETED);
  assert.equal(mission.evidence.length, 2);
  assert.equal(mission.events.at(-1).type, 'mission.complete');
  assert.equal(mission.version, 5);
});

test('does not allow completion without passing verification evidence', () => {
  let mission = base();
  mission = transitionMission(mission, 'plan');
  mission = transitionMission(mission, 'start');
  mission = transitionMission(mission, 'verify');
  assert.throws(() => transitionMission(mission, 'complete'), /requires passing verification/);
  assert.throws(() => transitionMission(mission, 'complete', {
    verification: { passed: true, checks: [{ name: 'failed-check', passed: false }] }
  }), /Every verification check/);
});

test('requires approval before resuming a gated mission', () => {
  let mission = base();
  mission = transitionMission(mission, 'plan');
  mission = transitionMission(mission, 'start');
  mission = transitionMission(mission, 'request_approval');
  assert.equal(mission.state, STATES.WAITING_APPROVAL);
  assert.throws(() => transitionMission(mission, 'verify'), /Invalid mission transition/);
  mission = transitionMission(mission, 'approve', { actorId: 'approver-1' });
  assert.equal(mission.state, STATES.RUNNING);
  assert.equal(mission.events.at(-1).actorId, 'approver-1');
});

test('failed missions can retry, terminal missions cannot restart', () => {
  let mission = base();
  mission = transitionMission(mission, 'plan');
  mission = transitionMission(mission, 'start');
  mission = transitionMission(mission, 'fail');
  mission = transitionMission(mission, 'retry');
  assert.equal(mission.state, STATES.PLANNED);
  assert.throws(() => transitionMission(mission, 'complete'), /Invalid mission transition/);
});

test('rejects malformed missions and evidence outside verification', () => {
  assert.throws(() => createMission({ id: 'x', ownerId: 'u' }), /title/);
  assert.throws(() => appendEvidence(base(), { kind: 'test', summary: 'not allowed yet' }), /only be added while verifying/);
});
