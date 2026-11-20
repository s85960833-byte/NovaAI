'use strict';

const express = require('express');
const { sameOrigin, exactKeys, validClientId, consumeWindow, plainObject } = require('./security');
const providerConfig = require('./provider-config.json');
const { eligibleProviders } = require('./provider-router');
const { classifyPrompt } = require('./safety');
const { generateLocalSpec } = require('./spec-engine');
const { createOwnerGuard } = require('./auth');

const RETENTION_DAYS = 7;
const MAX_BODY_BYTES = 20 * 1024;
const CLIENT_LIMIT = 10;
const WINDOW_MS = 60 * 1000;

function createStrRouter() {
  const router = express.Router();
  const rateWindows = new Map();
  const requireOwner = createOwnerGuard();

  router.use((req, res, next) => {
    // STR plans and owner-access responses can contain private draft data; never cache them.
    res.setHeader('Cache-Control', 'no-store');
    if (!sameOrigin(req)) return res.status(403).json({ error: 'STR requests must come from the same Nova origin.' });
    next();
  });

  router.get('/access', requireOwner, (req, res) => res.json({ ok: true, ownerAccess: true }));

  router.get('/health', (req, res) => res.json({
    status: 'ok',
    module: 'str',
    businessModel: 'model_1_owner_only_free',
    generationEnabled: false,
    customerBuildsEnabled: false,
    providerState: 'blocked_unverified',
    retentionDays: RETENTION_DAYS
  }));

  router.get('/limits', (req, res) => res.json({
    generationEnabled: false,
    businessModel: 'model_1_owner_only_free',
    requestsPerMinute: null,
    tokensPerMinute: null,
    requestsPerDay: null,
    tokensPerDay: null,
    unknownLimitsAction: 'block_and_report',
    specPreviewEnabled: true,
    specPreviewMode: 'local_rules_no_provider',
    eligibleOwnerTestProviders: eligibleProviders(providerConfig, 'owner_non_personal_test_data').length,
    eligibleCustomerProviders: eligibleProviders(providerConfig, 'customer_data').length,
    message: {
      hi: 'STR निर्माण अभी बंद है। Provider की सुरक्षित शर्तें और सीमाएँ जाँचने के बाद इसे चालू किया जाएगा।',
      en: 'STR generation is disabled until provider data terms and quotas are verified.'
    }
  }));

  function postGuard(req, res, next) {
    const body = req.body;
    if (!plainObject(body) || Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
      return res.status(413).json({ error: 'STR request is too large or invalid.' });
    }
    const clientId = req.get('x-str-client-id');
    if (!validClientId(clientId)) return res.status(400).json({ error: 'A valid STR client identifier is required.' });
    const key = req.ip + ':' + clientId;
    const state = consumeWindow(rateWindows, key, Date.now(), CLIENT_LIMIT, WINDOW_MS);
    if (!state.allowed) return res.status(state.capacity ? 503 : 429).json({ error: state.capacity ? 'STR rate-limit capacity is temporarily full.' : 'STR request limit reached. Please retry shortly.' });
    next();
  }

  function disabled(res) {
    return res.status(503).json({
      error: 'STR generation is not enabled until provider routing is verified.',
      code: 'STR_PROVIDER_NOT_VERIFIED',
      message: {
        hi: 'STR build अभी उपलब्ध नहीं है। सुरक्षित AI provider और उसकी सीमाएँ जाँचने के बाद इसे चालू किया जाएगा।',
        en: 'STR builds are not available until a safe AI provider and its quotas are verified.'
      }
    });
  }

  router.post('/spec', requireOwner, postGuard, (req, res) => {
    const b = req.body;
    if (!exactKeys(b, ['prompt', 'uiLang', 'contentLang']) ||
        typeof b.prompt !== 'string' || !b.prompt.trim() || b.prompt.length > 1000 ||
        !['hi', 'en'].includes(b.uiLang) || !['hi', 'hinglish', 'en'].includes(b.contentLang)) {
      return res.status(400).json({ error: 'Invalid STR spec request.' });
    }
    const safety = classifyPrompt(b.prompt);
    if (safety.unsafe.length) return res.status(422).json({
      error: 'This STR request is not allowed.',
      code: 'STR_UNSAFE_REQUEST',
      unsafe: safety.unsafe,
      message: {
        hi: safety.messages.map(x => x.hi).join(' '),
        en: safety.messages.map(x => x.en).join(' ')
      }
    });
    try {
      const spec = generateLocalSpec({ prompt: b.prompt, uiLang: b.uiLang, contentLang: b.contentLang });
      return res.status(200).json({
        ok: true,
        mode: 'local_rules_no_provider',
        provider: null,
        aiGenerated: false,
        spec,
        notice: {
          hi: 'यह शुरुआती योजना स्थानीय नियमों से बनी है, AI से नहीं। नाम, कीमत और बाकी मान्यताओं की जाँच करें। पूरा AI build अभी सुरक्षित provider की पुष्टि होने तक बंद है।',
          en: 'This starter plan was assembled with local rules, not AI. Review the name, prices and assumptions. Full AI building remains disabled until a provider is verified.'
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: 'STR could not validate its local starter plan.',
        code: 'STR_LOCAL_SPEC_FAILED'
      });
    }
  });

  router.post('/section', requireOwner, postGuard, (req, res) => {
    const b = req.body;
    if (!exactKeys(b, ['spec', 'sectionId', 'uiLang', 'contentLang']) ||
        !plainObject(b.spec) || typeof b.sectionId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(b.sectionId) ||
        !['hi', 'en'].includes(b.uiLang) || !['hi', 'hinglish', 'en'].includes(b.contentLang)) {
      return res.status(400).json({ error: 'Invalid STR section request.' });
    }
    return disabled(res);
  });

  router.post('/fix', requireOwner, postGuard, (req, res) => {
    const b = req.body;
    if (!exactKeys(b, ['fragment', 'specSlice', 'failures', 'uiLang']) ||
        typeof b.fragment !== 'string' || b.fragment.length > 16000 ||
        !plainObject(b.specSlice) || !Array.isArray(b.failures) || b.failures.length > 10 ||
        b.failures.some(x => typeof x !== 'string' || x.length > 400) || !['hi', 'en'].includes(b.uiLang)) {
      return res.status(400).json({ error: 'Invalid STR fix request.' });
    }
    return disabled(res);
  });

  router.post('/convert', requireOwner, postGuard, (req, res) => {
    const b = req.body;
    if (!exactKeys(b, ['text', 'targetLang', 'uiLang']) ||
        typeof b.text !== 'string' || !b.text.trim() || b.text.length > 1000 ||
        !['hi', 'en'].includes(b.targetLang) || !['hi', 'en'].includes(b.uiLang)) {
      return res.status(400).json({ error: 'Invalid STR conversion request.' });
    }
    return disabled(res);
  });

  return router;
}

module.exports = createStrRouter;
