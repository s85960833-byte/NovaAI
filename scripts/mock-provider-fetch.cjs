'use strict';

const fs = require('node:fs');
const originalFetch = global.fetch;

global.fetch = async function mockedProviderFetch(input, init) {
  const url = typeof input === 'string' ? input : input && input.url;
  if (typeof url === 'string' && url.startsWith('https://mock.provider.invalid/')) {
    if (process.env.NOVA_MOCK_FETCH_LOG) fs.appendFileSync(process.env.NOVA_MOCK_FETCH_LOG, 'called\n');
    return new Response('PRIVATE_PROVIDER_BODY_SENTINEL', {
      status: 500,
      headers: { 'content-type': 'text/plain' }
    });
  }
  return originalFetch(input, init);
};
