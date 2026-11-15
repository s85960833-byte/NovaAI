const STAGING_URL = process.env.NOVAAI_STAGING_URL || 'https://novaai-pr98-staging.onrender.com';
const EXPECTED_SHA = String(process.env.EXPECTED_PR_SHA || '').trim().toLowerCase();

if (!/^[a-f0-9]{40}$/.test(EXPECTED_SHA)) {
  throw new Error('EXPECTED_PR_SHA must be the full 40-character Git commit SHA');
}

async function getJson(path) {
  let response;
  try {
    response = await fetch(new URL(path, STAGING_URL), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
  } catch {
    throw new Error(`GET ${path} failed: staging endpoint is unreachable or timed out`);
  }

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`GET ${path} returned invalid JSON: HTTP ${response.status}`);
  }
  if (!response.ok) {
    throw new Error(`GET ${path} failed: HTTP ${response.status}`);
  }
  return payload;
}

const health = await getJson('/health');
if (health.ok !== true || health.ready !== true || health.service !== 'nova-ai' || health.status !== 'ok') {
  throw new Error('Staging /health payload is not ready');
}
console.log('PASS staging /health');

const version = await getJson('/version');
const deployedSha = String(version.commit || '').toLowerCase();
if (deployedSha !== EXPECTED_SHA) {
  throw new Error(`Staging SHA mismatch: expected ${EXPECTED_SHA}, got ${version.commit || 'missing'}`);
}
console.log('PASS staging /version SHA match: ' + deployedSha);
