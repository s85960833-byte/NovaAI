(() => {
  'use strict';
  const gate = document.getElementById('novaEntryGate');
  const video = document.getElementById('novaEntryVideo');
  const hint = document.getElementById('novaEntryHint');
  if (!gate) return;

  let language = 'en';
  try {
    const state = JSON.parse(localStorage.getItem('nova') || '{}');
    if (state && state.uiLang === 'hi') language = 'hi';
  } catch (_) {}
  if (hint) hint.textContent = language === 'hi'
    ? 'प्रवेश करने के लिए कहीं भी टैप करें'
    : 'TAP ANYWHERE TO ENTER';
  gate.setAttribute('aria-label', language === 'hi' ? 'NOVA में प्रवेश करें' : 'Enter NOVA');

  let entered = false;
  const enter = () => {
    if (entered) return;
    entered = true;
    gate.classList.add('is-leaving');
    gate.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
      gate.hidden = true;
      if (video) video.pause();
    }, 360);
  };

  gate.addEventListener('click', enter);
  gate.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      enter();
    }
  });

  if (video) {
    video.muted = true;
    const playback = video.play();
    if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  }
})();
