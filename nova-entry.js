(() => {
  'use strict';
  const gate = document.getElementById('novaEntryGate');
  const video = document.getElementById('novaEntryVideo');
  if (!gate) return;

  const PLAYED_KEY = 'nova_intro_completed_v1';
  const hasPlayed = () => {
    try { return localStorage.getItem(PLAYED_KEY) === '1'; }
    catch (_) { return false; }
  };
  const rememberPlayed = () => {
    try { localStorage.setItem(PLAYED_KEY, '1'); }
    catch (_) {}
  };

  // Once the intro has begun/completed, never replay it on reloads or revisits.
  if (hasPlayed()) {
    if (video) video.pause();
    gate.remove();
    return;
  }

  let entered = false;
  let fallbackTimer = 0;
  const enter = () => {
    if (entered) return;
    entered = true;
    rememberPlayed();
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    gate.classList.add('is-leaving');
    gate.setAttribute('aria-hidden', 'true');
    if (video) video.pause();
    window.setTimeout(() => gate.remove(), 360);
  };

  if (!video) {
    enter();
    return;
  }

  video.loop = false;
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.addEventListener('playing', rememberPlayed, { once: true });
  video.addEventListener('ended', enter, { once: true });
  video.addEventListener('error', enter, { once: true });

  // Autoplay failure must not leave a blocking screen or demand a manual tap.
  fallbackTimer = window.setTimeout(() => {
    if (video.paused && video.currentTime === 0) enter();
  }, 2500);

  try {
    const playback = video.play();
    if (playback && typeof playback.catch === 'function') playback.catch(enter);
  } catch (_) {
    enter();
  }
})();