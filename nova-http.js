'use strict';

const { isIP } = require('node:net');

function safeRedirectTarget(raw, originalHost = '') {
  let target;
  try { target = new URL(String(raw)); } catch { throw new Error('invalid provider URL'); }
  const host = target.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (target.protocol !== 'https:' || target.username || target.password ||
      (target.port && target.port !== '443') || !host || !host.includes('.') || isIP(host) ||
      host === 'localhost' || host.endsWith('.localhost') ||
      host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('unsafe provider URL');
  }
  if (originalHost && host !== originalHost) {
    throw new Error('cross-host provider redirect blocked');
  }
  target.hash = '';
  return target;
}

async function readBoundedText(response, maxBytes = 3 * 1024 * 1024) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        try { await reader.cancel(); } catch { /* retain size-limit error */ }
        throw new Error('response too large');
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, total).toString('utf8');
}

module.exports = { safeRedirectTarget, readBoundedText };
