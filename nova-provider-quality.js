'use strict';

const QUALITY_EVIDENCE = require('./provider-quality-evidence.json');
const TIER_2_ROUTES = new Set(['code', 'deep-research']);
const ACCEPTED_TIERS = new Set(['T1', 'T2']);

function isQualifyingEvidence(record, evidence = QUALITY_EVIDENCE) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
  if (!ACCEPTED_TIERS.has(String(record.tier || '').toUpperCase())) return false;
  if (!Number.isFinite(record.score) || record.score < Number(evidence.minimumScore || 90) || record.score > 100) return false;
  if (!Number.isInteger(record.testCount) || record.testCount < Number(evidence.minimumCases || 100)) return false;
  if (record.evaluationSetVersion !== evidence.evaluationSetVersion) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(record.evaluatedAt || ''))) return false;
  if (!/^[a-f0-9]{40}$/i.test(String(record.evidenceCommitSha || ''))) return false;
  if (typeof record.reportPath !== 'string' || !record.reportPath.trim()) return false;
  return true;
}

function gateProvidersForRoute(providers, route, evidence = QUALITY_EVIDENCE) {
  const input = Array.isArray(providers) ? providers : [];
  if (!TIER_2_ROUTES.has(String(route || ''))) {
    return {
      providers: input,
      requiresTier2: false,
      blocked: false,
      excludedModels: []
    };
  }

  const allowed = [];
  const excludedModels = [];
  for (const provider of input) {
    const models = Array.isArray(provider.models) ? provider.models : [];
    const accepted = models.filter(modelId => {
      const match = (Array.isArray(evidence.models) ? evidence.models : []).find(
        record => record && record.providerId === provider.id && record.modelId === modelId
      );
      const ok = isQualifyingEvidence(match, evidence);
      if (!ok) excludedModels.push({ providerId: provider.id, modelId: String(modelId) });
      return ok;
    });
    if (accepted.length) allowed.push({ ...provider, models: accepted });
  }

  return {
    providers: allowed,
    requiresTier2: true,
    blocked: allowed.length === 0,
    excludedModels
  };
}

module.exports = {
  QUALITY_EVIDENCE,
  TIER_2_ROUTES,
  gateProvidersForRoute,
  isQualifyingEvidence
};
