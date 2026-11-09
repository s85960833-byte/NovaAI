(() => {
  'use strict';
  const gate = document.getElementById('novaEntryGate');
  if (!gate) return;
  const PLAYED_KEY = 'nova_intro_completed_v2';
  const LEGACY_KEY = 'nova_intro_completed_v1';
  const COOKIE_KEY = 'nova_intro_seen_v2';
  const hasPlayed = () => {
    try { if (localStorage.getItem(PLAYED_KEY) === '1') return true; } catch (_) {}
    try { return document.cookie.split(';').some(item => item.trim() === COOKIE_KEY + '=1'); } catch (_) {}
    return false;
  };
  const rememberPlayed = () => {
    try { localStorage.setItem(PLAYED_KEY, '1'); } catch (_) {}
    // Keep the previous marker for compatibility, but do not let it suppress this new intro.
    try { localStorage.setItem(LEGACY_KEY, '1'); } catch (_) {}
    try {
      document.cookie = COOKIE_KEY + '=1; Max-Age=31536000; Path=/; SameSite=Lax' +
        (location.protocol === 'https:' ? '; Secure' : '');
    } catch (_) {}
  };
  if (hasPlayed()) {
    gate.remove();
    return;
  }
  // Persist at first paint, before any tap or navigation can interrupt the intro.
  rememberPlayed();
  let dismissed = false;
  const finish = () => {
    if (dismissed) return;
    dismissed = true;
    gate.classList.add('is-leaving');
    gate.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => gate.remove(), 430);
  };
  // This is a visual-only splash: taps and clicks are intentionally ignored.
  for (const type of ['click', 'pointerdown', 'touchstart']) {
    gate.addEventListener(type, event => {
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });
  }
  gate.addEventListener('keydown', event => {
    event.preventDefault();
    event.stopPropagation();
  });
  const duration = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 250 : 2300;
  window.setTimeout(finish, duration);
})();