(function () {
  'use strict';

  const labels = { live: 'Live', beta: 'Beta', hidden: 'Hidden' };
  const planLabel = plan => plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : plan === 'ultra' ? 'Ultra' : 'Not offered';
  let registry = null;
  let flags = null;

  function decorate() {
    if (!registry || !flags) return;

    document.querySelectorAll('#hi .nr-card[data-group]').forEach(card => {
      const item = (registry.workspaces || []).find(workspace => workspace.id === card.dataset.group);
      if (!item || item.status === 'hidden' || (item.flag && flags[item.flag] === false)) {
        card.hidden = true;
        return;
      }
      card.hidden = false;
      card.dataset.registryStatus = item.status;
      card.dataset.registryPlan = item.planTier;
      let badge = card.querySelector('.nr-registry-status');
      if (!badge) {
        badge = document.createElement('small');
        badge.className = 'nr-registry-status';
        badge.setAttribute('aria-label', 'Feature availability');
        badge.style.cssText = 'display:inline-block;margin-top:8px;padding:3px 8px;border:1px solid #8495d1;border-radius:99px;font-size:10px;font-weight:800;color:#d8e3ff;background:#101d50';
        card.append(badge);
      }
      const statusText = labels[item.status] + ' · ' + planLabel(item.planTier);
      if (badge.textContent !== statusText) badge.textContent = statusText;
    });

    document.querySelectorAll('#nmContent [data-mode]').forEach(button => {
      const item = (registry.uiModes || []).find(mode => mode.id === button.dataset.mode);
      if (!item || item.status === 'hidden' || (item.flag && flags[item.flag] === false)) {
        button.hidden = true;
        return;
      }
      button.hidden = false;
      button.dataset.registryStatus = item.status;
      button.dataset.registryPlan = item.planTier;
    });

    document.querySelectorAll('#nmContent [data-quick]').forEach(button => {
      const item = (registry.quickActions || []).find(action => action.id === button.dataset.quick);
      if (!item || item.status === 'hidden' || (item.flag && flags[item.flag] === false)) {
        button.hidden = true;
        return;
      }
      button.hidden = false;
      button.dataset.registryStatus = item.status;
      button.dataset.registryPlan = item.planTier;
    });
  }

  async function initialise() {
    try {
      const responses = await Promise.all([
        fetch('/FEATURE_REGISTRY.json', { cache: 'no-store', credentials: 'same-origin' }),
        fetch('/api/features', { cache: 'no-store', credentials: 'same-origin' })
      ]);
      if (!responses[0].ok || !responses[1].ok) throw new Error('Feature registry unavailable');
      const values = await Promise.all(responses.map(response => response.json()));
      registry = values[0];
      flags = values[1].flags;
      if (!Array.isArray(registry.workspaces) || !Array.isArray(registry.uiModes) || !Array.isArray(registry.quickActions) || !flags) {
        throw new Error('Feature registry invalid');
      }
      window.NovaFeatureRegistry = registry;
      window.NovaRuntimeFeatureFlags = Object.freeze(flags);
      decorate();
      new MutationObserver(decorate).observe(document.body, { childList: true, subtree: true });
    } catch {
      document.querySelectorAll('#hi .nr-card[data-group]').forEach(card => {
        card.dataset.registryStatus = 'unverified';
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();
