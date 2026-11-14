import fs from 'node:fs';
import assert from 'node:assert/strict';

const path = 'artifacts/novaai-production-sbom.spdx.json';
const doc = JSON.parse(fs.readFileSync(path, 'utf8'));
assert.match(doc.spdxVersion || '', /^SPDX-2\./, 'SBOM must declare an SPDX 2.x version');
assert.ok(Array.isArray(doc.packages) && doc.packages.length > 0, 'SBOM must contain packages');
const unknown = doc.packages.filter(p => !p.licenseConcluded || p.licenseConcluded === 'NOASSERTION').length;
console.log('Validated production SBOM packages:', doc.packages.length);
console.log('Packages requiring manual license verification:', unknown);
