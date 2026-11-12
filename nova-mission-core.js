'use strict';

const STATES = Object.freeze({
  DRAFT: 'draft',
  PLANNED: 'planned',
  RUNNING: 'running',
  WAITING_APPROVAL: 'waiting_approval',
  VERIFYING: 'verifying',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
});

const TRANSITIONS = Object.freeze({
  [STATES.DRAFT]: Object.freeze({ plan: STATES.PLANNED, cancel: STATES.CANCELLED }),
  [STATES.PLANNED]: Object.freeze({ start: STATES.RUNNING, cancel: STATES.CANCELLED }),
  [STATES.RUNNING]: Object.freeze({
    request_approval: STATES.WAITING_APPROVAL,
    verify: STATES.VERIFYING,
    fail: STATES.FAILED,
    cancel: STATES.CANCELLED
  }),
  [STATES.WAITING_APPROVAL]: Object.freeze({
    approve: STATES.PLANNED,
    reject: STATES.FAILED,
    cancel: STATES.CANCELLED
  }),
  [STATES.VERIFYING]: Object.freeze({
    complete: STATES.COMPLETED,
    fail: STATES.FAILED,
    cancel: STATES.CANCELLED
  }),
  [STATES.FAILED]: Object.freeze({ retry: STATES.PLANNED, cancel: STATES.CANCELLED }),
  [STATES.COMPLETED]: Object.freeze({}),
  [STATES.CANCELLED]: Object.freeze({})
});

function assertText(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(name + ' must be a non-empty string');
  }
}

function createMission(input, options = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('mission input must be an object');
  }
  assertText(input.id, 'id');
  assertText(input.ownerId, 'ownerId');
  assertText(input.title, 'title');
  const now = options.now || new Date().toISOString();
  return Object.freeze({
    id: input.id,
    ownerId: input.ownerId,
    title: input.title.trim(),
    description: typeof input.description === 'string' ? input.description : '',
    workspace: ['learn', 'build', 'agents', 'intelligence'].includes(input.workspace)
      ? input.workspace : 'agents',
    state: STATES.DRAFT,
    version: 0,
    createdAt: now,
    updatedAt: now,
    attempts: 0,
    events: Object.freeze([Object.freeze({
      sequence: 1,
      type: 'mission.created',
      from: null,
      to: STATES.DRAFT,
      actorId: input.ownerId,
      at: now,
      data: Object.freeze({})
    })]),
    evidence: Object.freeze([])
  });
}

function transitionMission(mission, action, options = {}) {
  if (!mission || typeof mission !== 'object') throw new TypeError('mission is required');
  assertText(action, 'action');
  const nextState = TRANSITIONS[mission.state] && TRANSITIONS[mission.state][action];
  if (!nextState) throw new Error('Invalid mission transition: ' + mission.state + ' -> ' + action);

  const actorId = options.actorId || mission.ownerId;
  assertText(actorId, 'actorId');
  const now = options.now || new Date().toISOString();
  const data = options.data && typeof options.data === 'object' && !Array.isArray(options.data)
    ? Object.freeze({ ...options.data }) : Object.freeze({});

  if (action === 'complete') {
    const proof = options.verification;
    if (!proof || proof.passed !== true || !Array.isArray(proof.checks) || proof.checks.length === 0) {
      throw new Error('Completion requires passing verification evidence');
    }
    if (proof.checks.some(check => !check || check.passed !== true || typeof check.name !== 'string' || !check.name.trim())) {
      throw new Error('Every verification check must be named and passing');
    }
  }

  const event = Object.freeze({
    sequence: mission.events.length + 1,
    type: 'mission.' + action,
    from: mission.state,
    to: nextState,
    actorId,
    at: now,
    data
  });
  const evidence = action === 'complete'
    ? Object.freeze([...mission.evidence, Object.freeze({
        type: 'verification',
        passed: true,
        checks: Object.freeze(options.verification.checks.map(check => Object.freeze({ ...check }))),
        at: now,
        actorId
      })])
    : mission.evidence;

  return Object.freeze({
    ...mission,
    state: nextState,
    version: mission.version + 1,
    updatedAt: now,
    attempts: action === 'start' ? mission.attempts + 1 : mission.attempts,
    events: Object.freeze([...mission.events, event]),
    evidence
  });
}

function appendEvidence(mission, evidence, options = {}) {
  if (!mission || mission.state !== STATES.VERIFYING) {
    throw new Error('Evidence can only be added while verifying');
  }
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    throw new TypeError('evidence must be an object');
  }
  assertText(evidence.kind, 'evidence.kind');
  assertText(evidence.summary, 'evidence.summary');
  const at = options.now || new Date().toISOString();
  const actorId = options.actorId || mission.ownerId;
  const item = Object.freeze({
    kind: evidence.kind,
    summary: evidence.summary,
    reference: typeof evidence.reference === 'string' ? evidence.reference : null,
    at,
    actorId
  });
  return Object.freeze({
    ...mission,
    version: mission.version + 1,
    updatedAt: at,
    evidence: Object.freeze([...mission.evidence, item]),
    events: Object.freeze([...mission.events, Object.freeze({
      sequence: mission.events.length + 1,
      type: 'proof.evidence_recorded',
      from: mission.state,
      to: mission.state,
      actorId,
      at,
      data: Object.freeze({ kind: item.kind, summary: item.summary })
    })])
  });
}

module.exports = { STATES, TRANSITIONS, createMission, transitionMission, appendEvidence };
