(() => {
  'use strict';
  const gate = document.getElementById('novaEntryGate');
  const video = document.getElementById('novaEntryVideo');
  if (!gate) return;

  let entered = false;
  let fallbackTimer = 0;
  const enter = () => {
    if (entered) return;
    entered = true;
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    gate.classList.add('is-leaving');
    gate.setAttribute('aria-hidden', 'true');
    if (video) video.pause();
    window.setTimeout(() => {
      gate.hidden = true;
      gate.remove();
    }, 360);
  };

  // The intro is a one-shot, muted experience. Its end event opens the app.
  if (!video) {
    enter();
    return;
  }
  video.loop = false;
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.addEventListener('ended', enter, { once: true });
  video.addEventListener('error', enter, { once: true });

  // If autoplay is blocked or media cannot start, never leave the user stuck
  // on the entry screen waiting for a manual tap.
  fallbackTimer = window.setTimeout(() => {
    if (video.paused && video.currentTime === 0) enter();
  }, 1800);

  const playback = video.play();
  if (playback && typeof playback.then === 'function') {
    playback.then(() => {
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = 0;
      }
    }).catch(enter);
  }
})();