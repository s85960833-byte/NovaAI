'use strict';

const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

function resolveTimeZone(value, fallback = DEFAULT_TIME_ZONE) {
  const candidate = String(value || '').trim();
  for (const zone of [candidate, fallback, DEFAULT_TIME_ZONE]) {
    if (!zone || zone.length > 64) continue;
    try {
      new Intl.DateTimeFormat('en', { timeZone: zone });
      return zone;
    } catch {}
  }
  return DEFAULT_TIME_ZONE;
}

function formatCurrentDateTime(value, now = new Date()) {
  const timeZone = resolveTimeZone(value);
  const formatted = new Intl.DateTimeFormat('en-IN', {
    timeZone,
    dateStyle: 'full',
    timeStyle: 'long'
  }).format(now);
  return { timeZone, formatted, iso: now.toISOString() };
}

module.exports = { DEFAULT_TIME_ZONE, resolveTimeZone, formatCurrentDateTime };
