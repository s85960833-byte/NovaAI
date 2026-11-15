'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../nova-business-core.js');

const fixture = (name) => fs.readFileSync(path.join(__dirname, '..', 'samples', name), 'utf8');

test('SHA-256 proof hashing matches a published test vector and is deterministic for demo files', async () => {
  const expected = 'sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  assert.equal(await core.sha256Hex('abc'), expected);
  assert.equal(await core.sha256Hex(Uint8Array.from([0x61, 0x62, 0x63])), expected);
  assert.equal(await core.sha256Hex(Buffer.from('abc', 'utf8')), expected);
  const fileBytes = Buffer.from(fixture('demo-expenses.csv'), 'utf8');
  const first = await core.sha256Hex(fileBytes);
  const second = await core.sha256Hex(fileBytes);
  assert.match(first, /^sha256:[0-9a-f]{64}$/);
  assert.equal(first, second);
});

test('synthetic expense fixture validates and exposes budget/spend review signals', () => {
  const parsed = core.parseCSV(fixture('demo-expenses.csv'));
  assert.equal(parsed.rowCount, 12);
  assert.deepEqual(parsed.warnings, []);
  const result = core.analyzeExpenses(parsed.rows, {
    amount: 'Amount (INR)',
    category: 'Category',
    date: 'Date',
    currency: 'INR',
    monthlyBudget: 100000
  });
  assert.equal(result.validRows, 12);
  assert.equal(result.invalidRows, 0);
  assert.equal(result.total, 212000);
  assert.equal(result.monthlyBudget, 100000);
  assert.equal(result.budgetOverruns.length, 1);
  assert.equal(result.budgetOverruns[0].month, '2026-11');
  assert.equal(result.budgetOverruns[0].overrun, 18000);
  assert.equal(result.spendAlerts.length, 1);
  assert.ok(result.spendAlerts[0].changePct >= 25);
});

test('synthetic client fixture calculates contribution only from supplied direct costs', () => {
  const parsed = core.parseCSV(fixture('demo-clients.csv'));
  assert.equal(parsed.rowCount, 4);
  assert.deepEqual(parsed.warnings, []);
  const result = core.analyzeClients(parsed.rows, {
    client: 'Client',
    revenue: 'Revenue (INR)',
    directCost: 'Direct Cost (INR)'
  });
  assert.equal(result.validRows, 4);
  assert.equal(result.invalidRows, 0);
  assert.equal(result.totalRevenue, 800000);
  assert.equal(result.totalDirectCost, 530000);
  assert.equal(result.totalContribution, 270000);
});

test('synthetic task fixture calculates team-level metrics on a fixed reference date', () => {
  const parsed = core.parseCSV(fixture('demo-team-tasks.csv'));
  assert.equal(parsed.rowCount, 7);
  assert.deepEqual(parsed.warnings, []);
  const result = core.analyzeTasks(parsed.rows, {
    status: 'Status',
    team: 'Team',
    createdAt: 'Created Date',
    completedAt: 'Completed Date',
    dueDate: 'Due Date'
  }, '2026-11-12');
  assert.equal(result.total, 7);
  assert.equal(result.completed, 3);
  assert.equal(result.open, 4);
  assert.equal(result.overdue, 2);
  assert.equal(result.averageCycleDays, 4);
});

test('synthetic project-risk scenario returns a bounded heuristic, not a probability claim', () => {
  const result = core.scoreProjectRisk({
    dueDate: '2026-11-20',
    progressPct: 35,
    blockers: 3
  }, '2026-11-12');
  assert.equal(result.kind, 'project-risk');
  assert.equal(result.daysUntilDue, 9);
  assert.ok(Number.isFinite(result.score));
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.match(result.confidence, /Heuristic only/);
});

test('synthetic digital-twin scenario matches transparent input arithmetic', () => {
  const result = core.simulateScenario({
    monthlyBaseline: 250000,
    currency: 'INR',
    automationSharePct: 25,
    realizationPct: 50,
    oneTimeCost: 30000,
    horizonMonths: 12
  });
  assert.equal(result.assumedMonthlyGrossSaving, 31250);
  assert.equal(result.estimatedNetImpact, 345000);
  assert.equal(result.kind, 'scenario');
  assert.match(result.label, /not a forecast/);
});
