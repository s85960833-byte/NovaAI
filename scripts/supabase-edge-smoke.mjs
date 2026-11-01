import { readFileSync } from 'node:fs';

const client = readFileSync('nova-business-cloud.js', 'utf8');
const url = client.match(/url:'([^']+)'/)?.[1];
const key = client.match(/key:'(sb_publishable_[^']+)'/)?.[1];
if (!url || !key) throw new Error('Supabase public project configuration is missing from the Company Cloud client.');

const endpoint = url.replace(/\/$/, '') + '/functions/v1/nova-bi-api/me';
const headers = { apikey: key, Accept: 'application/json' };

const unauthenticated = await fetch(endpoint, {
  method: 'GET',
  headers,
  signal: AbortSignal.timeout(15000),
});
if (unauthenticated.status !== 401) {
  const body = (await unauthenticated.text()).slice(0, 500);
  throw new Error('Unauthenticated Edge Function request must return 401; got ' + unauthenticated.status + ': ' + body);
}
process.stdout.write('PASS Edge Function rejects requests without a user JWT (401)\n');

const preflight = await fetch(endpoint, {
  method: 'OPTIONS',
  headers: {
    ...headers,
    Origin: 'https://novaai-4auo.onrender.com',
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'authorization,apikey,content-type',
  },
  signal: AbortSignal.timeout(15000),
});
const allowOrigin = preflight.headers.get('access-control-allow-origin');
const allowHeaders = (preflight.headers.get('access-control-allow-headers') || '').toLowerCase();
if (![200, 204].includes(preflight.status) || allowOrigin !== '*' || !allowHeaders.includes('authorization') || !allowHeaders.includes('apikey')) {
  throw new Error('Edge Function CORS preflight failed: status=' + preflight.status + ', allow-origin=' + allowOrigin + ', allow-headers=' + allowHeaders);
}
process.stdout.write('PASS Edge Function CORS preflight\n');
const deleteEndpoint = endpoint.replace(/\\/me$/, '/datasets/00000000-0000-4000-8000-000000000000');
const deletePreflight = await fetch(deleteEndpoint, {
  method: 'OPTIONS',
  headers: {
    ...headers,
    Origin: 'https://novaai-4auo.onrender.com',
    'Access-Control-Request-Method': 'DELETE',
    'Access-Control-Request-Headers': 'authorization,apikey,content-type',
  },
  signal: AbortSignal.timeout(15000),
});
const allowMethods = (deletePreflight.headers.get('access-control-allow-methods') || '').toUpperCase();
if (![200, 204].includes(deletePreflight.status) || !allowMethods.split(',').map(x => x.trim()).includes('DELETE')) {
  throw new Error('Edge Function DELETE CORS preflight failed: status=' + deletePreflight.status + ', allow-methods=' + allowMethods);
}
process.stdout.write('PASS Edge Function CORS preflight allows authenticated DELETE requests\\n');

