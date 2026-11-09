(() => {
  'use strict';
  const gate = document.getElementById('novaEntryGate');
  if (!gate) return;
  const PLAYED_KEY = 'nova_intro_completed_v2';
  const LEGACY_KEY = 'nova_intro_completed_v1';
  const COOKIE_KEY = 'nova_intro_seen_v2';
  const hasPlayed = () => {
    // Accept every marker used by earlier releases so an upgrade never replays an intro.
    for (const key of [PLAYED_KEY, LEGACY_KEY]) {
      try { if (localStorage.getItem(key) === '1') return true; } catch (_) {}
      try { if (sessionStorage.getItem(key) === '1') return true; } catch (_) {}
    }
    try {
      const cookies = document.cookie.split(';').map(item => item.trim());
      return cookies.includes(COOKIE_KEY + '=1') || cookies.includes('nova_intro_seen_v1=1');
    } catch (_) {}
    return false;
  };
  const rememberPlayed = () => {
    try { localStorage.setItem(PLAYED_KEY, '1'); } catch (_) {}
    try { localStorage.setItem(LEGACY_KEY, '1'); } catch (_) {}
    try { sessionStorage.setItem(PLAYED_KEY, '1'); } catch (_) {}
    try { sessionStorage.setItem(LEGACY_KEY, '1'); } catch (_) {}
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