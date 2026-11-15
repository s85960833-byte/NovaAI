'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const directory = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(directory).filter(name => name.endsWith('.sql')).sort();
const migrations = files.map(name => ({
  name,
  sql: fs.readFileSync(path.join(directory, name), 'utf8')
}));
const tables = new Set();
const protectedTables = new Set();

for (const migration of migrations) {
  for (const match of migration.sql.matchAll(/create\s+table(?:\s+if\s+not\s+exists)?\s+public\.([a-z0-9_]+)/ig)) {
    tables.add(match[1]);
  }
  for (const match of migration.sql.matchAll(/alter\s+table\s+public\.([a-z0-9_]+)\s+enable\s+row\s+level\s+security/ig)) {
    protectedTables.add(match[1]);
  }
}

test('every public table introduced by checked-in migrations enables RLS', () => {
  assert.ok(tables.size > 0, 'migration inventory must discover public tables');
  const missing = [...tables].filter(table => !protectedTables.has(table));
  assert.deepEqual(missing, [], 'public tables missing ENABLE ROW LEVEL SECURITY');
});

test('known per-user and tenant tables remain in the RLS inventory', () => {
  for (const table of [
    'nova_user_workspaces',
    'nova_bi_organizations',
    'nova_bi_memberships',
    'nova_bi_datasets',
    'nova_bi_analyses',
    'nova_bi_workflow_proposals',
    'nova_bi_workflow_approvals',
    'nova_bi_workflow_executions',
    'nova_bi_branding',
    'nova_bi_audit_events',
    'nova_bi_rate_limits'
  ]) {
    assert.ok(tables.has(table), 'missing migration-managed table: ' + table);
    assert.ok(protectedTables.has(table), 'missing RLS on: ' + table);
  }
});
