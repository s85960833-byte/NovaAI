'use strict';

// Provider-neutral authorization policy primitives.
// IMPORTANT: This module does NOT authenticate tokens or load memberships.
// Callers must pass a principal verified by a server-side auth adapter and a
// membership loaded from a trusted server-side repository. Never pass request-body claims.
const ROLE_PERMISSIONS = Object.freeze({
  owner: Object.freeze(['dataset:read','dataset:write','dataset:export','dataset:delete','analysis:run','workflow:propose','workflow:approve','member:read','member:invite','member:change_role','audit:read','org:manage']),
  admin: Object.freeze(['dataset:read','dataset:write','dataset:export','dataset:delete','analysis:run','workflow:propose','workflow:approve','member:read','member:invite','member:change_role','audit:read','org:manage']),
  analyst: Object.freeze(['dataset:read','dataset:write','dataset:export','analysis:run','workflow:propose','audit:read']),
  viewer: Object.freeze(['dataset:read','analysis:read','audit:read'])
});
const fail = (code) => { const e = new Error(code); e.code = code; throw e; };

function requirePrincipal(principal) {
  if (!principal || typeof principal !== 'object' ||
      typeof principal.userId !== 'string' || !principal.userId.trim() ||
      typeof principal.sessionId !== 'string' || !principal.sessionId.trim() ||
      principal.verified !== true) fail('UNAUTHENTICATED');
  return Object.freeze({ userId: principal.userId, sessionId: principal.sessionId });
}

function requireMembership(membership, principal, organizationId) {
  const user = requirePrincipal(principal);
  if (!membership || typeof membership !== 'object' ||
      membership.active !== true ||
      membership.userId !== user.userId ||
      membership.organizationId !== organizationId ||
      !Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, membership.role)) {
    fail('FORBIDDEN');
  }
  return Object.freeze({ userId: user.userId, organizationId, role: membership.role });
}

function authorize(membership, principal, organizationId, permission) {
  const trusted = requireMembership(membership, principal, organizationId);
  const allowed = ROLE_PERMISSIONS[trusted.role].includes(permission);
  if (!allowed) fail('FORBIDDEN');
  return trusted;
}

function assertTenantResource(resource, organizationId) {
  if (!resource || typeof resource !== 'object' ||
      typeof organizationId !== 'string' || !organizationId ||
      resource.organizationId !== organizationId) fail('NOT_FOUND');
  return resource;
}

module.exports = Object.freeze({ ROLE_PERMISSIONS, requirePrincipal, requireMembership, authorize, assertTenantResource });
