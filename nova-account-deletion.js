'use strict';

const ACCOUNT_DELETION_CONFIRMATION = 'DELETE MY NOVA ACCOUNT';
const USER_ROW_TABLES = Object.freeze([
  ['nova_user_workspaces', 'user_id'],
  ['nova_bi_memberships', 'user_id'],
  ['nova_bi_organizations', 'created_by'],
  ['nova_bi_datasets', 'created_by'],
  ['nova_bi_analyses', 'created_by'],
  ['nova_bi_workflow_proposals', 'created_by'],
  ['nova_bi_workflow_approvals', 'actor_id']
]);

function normalizeSupabaseRestOrigin(value) {
  let url;
  try { url = new URL(String(value || '')); } catch { throw new Error('SUPABASE_URL must be configured'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.pathname && url.pathname !== '/')) {
    throw new Error('SUPABASE_URL must be a clean HTTPS project origin');
  }
  return url.origin;
}

function createAccountDeletionHandler(options = {}) {
  const enabled = options.enabled === true;
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  let restOrigin = null;
  try { restOrigin = normalizeSupabaseRestOrigin(options.supabaseUrl); } catch {}

  async function adminGet(table, params) {
    if (!restOrigin || typeof options.serviceRoleKey !== 'string' || !options.serviceRoleKey.trim()) {
      throw new Error('Account deletion admin configuration is unavailable');
    }
    const url = new URL('/rest/v1/' + table, restOrigin);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'error',
      headers: {
        apikey: options.serviceRoleKey,
        Authorization: 'Bearer ' + options.serviceRoleKey,
        Accept: 'application/json',
        Prefer: 'count=exact',
        Range: '0-0'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('Deletion planning query failed');
    return response;
  }

  async function countRows(table, column, userId) {
    const response = await adminGet(table, { select: 'id', [column]: 'eq.' + userId });
    const range = response.headers.get('content-range') || '';
    const separator = range.lastIndexOf('/');
    if (separator < 0) throw new Error('Deletion planning count was not returned');
    const totalText = range.slice(separator + 1);
    if (totalText === '*') throw new Error('Deletion planning count is unavailable');
    const total = Number(totalText);
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('Deletion planning count was invalid');
    return total;
  }

  async function sharedOwnerOrganizations(userId) {
    const owners = await adminGet('nova_bi_memberships', {
      select: 'organization_id', user_id: 'eq.' + userId, role: 'eq.owner', status: 'eq.active'
    });
    const rows = await owners.json();
    if (!Array.isArray(rows)) throw new Error('Deletion planning membership response is invalid');
    const blocked = [];
    for (const row of rows) {
      if (typeof row.organization_id !== 'string') throw new Error('Deletion planning organization id is invalid');
      const members = await adminGet('nova_bi_memberships', {
        select: 'user_id', organization_id: 'eq.' + row.organization_id
      });
      const memberRows = await members.json();
      if (!Array.isArray(memberRows)) throw new Error('Deletion planning member response is invalid');
      if (memberRows.some(member => member.user_id !== userId)) blocked.push(row.organization_id);
    }
    return [...new Set(blocked)];
  }

  async function createDeletionPlan(userId) {
    const sharedOwnerBlocks = await sharedOwnerOrganizations(userId);
    if (sharedOwnerBlocks.length) {
      return { blocked: true, reason: 'shared_company_ownership_transfer_required', organizationIds: sharedOwnerBlocks };
    }
    const counts = {};
    for (const [table, column] of USER_ROW_TABLES) counts[table] = await countRows(table, column, userId);
    counts.nova_bi_audit_events_retained = await countRows('nova_bi_audit_events', 'actor_id', userId);
    return {
      blocked: false,
      counts,
      storage: { status: 'not_assessed', reason: 'No approved user Storage bucket/prefix inventory is configured.' },
      backups: { status: 'retention_review_required' },
      executionReady: false
    };
  }

  return async function deleteAccount(req, res) {
    if (!enabled) return res.status(404).json({ error: 'account_deletion_disabled' });
    const userId = req.novaUser && req.novaUser.id;
    if (typeof userId !== 'string' || !userId) return res.status(401).json({ error: 'authentication_required' });
    if (!req.body || req.body.confirm !== ACCOUNT_DELETION_CONFIRMATION) {
      return res.status(400).json({ error: 'explicit_account_deletion_confirmation_required' });
    }
    if (typeof fetchImpl !== 'function' || !restOrigin || !options.serviceRoleKey) {
      return res.status(503).json({ error: 'account_deletion_admin_not_configured' });
    }
    try {
      const plan = await createDeletionPlan(userId);
      if (plan.blocked) {
        return res.status(409).json({ error: plan.reason, organization_ids: plan.organizationIds });
      }
      if (String(req.query && req.query.dry_run || '').toLowerCase() === 'true') {
        return res.status(200).json({ dry_run: true, plan });
      }
      // Cross-service destructive execution stays blocked until ownership, audit,
      // Storage, transactional data deletion, session revocation and retention
      // rules are approved and covered by a separate reviewed migration.
      return res.status(503).json({ error: 'account_deletion_execution_requires_approved_data_lifecycle' });
    } catch {
      return res.status(503).json({ error: 'account_deletion_planning_unavailable' });
    }
  };
}

module.exports = { ACCOUNT_DELETION_CONFIRMATION, USER_ROW_TABLES, createAccountDeletionHandler, normalizeSupabaseRestOrigin };
