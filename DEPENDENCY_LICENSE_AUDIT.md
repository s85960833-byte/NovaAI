# NOVA Dependency License Inventory

**Review date:** 12 November 2026  
**Repository:** `s85960833-byte/NovaAI`  
**Branch reviewed:** `fix/nova-home-learn-first-mobile-20261109`  
**Source:** `package-lock.json` (lockfile v3)  
**Scope:** npm dependency metadata only; not a complete legal/IP clearance.

## Summary

- Locked package records with versions: **72**
- License metadata counts: `Apache-2.0`: 3; `MIT`: 66; `ISC`: 2; `BSD-3-Clause`: 1
- Missing declared license metadata: **0**
- GPL/AGPL identifiers in this npm lockfile: **none detected**.
- This does **not** establish that every source file, icon, font, image, video, copied snippet, hosted script or API dataset is clean for resale.

## Complete locked package list

| Package | Locked version | Declared license | Use |
|---|---:|---|---|
| `@playwright/test` | `1.56.1` | Apache-2.0 | Development |
| `accepts` | `1.3.8` | MIT | Runtime |
| `array-flatten` | `1.1.1` | MIT | Runtime |
| `body-parser` | `1.20.9` | MIT | Runtime |
| `bytes` | `3.1.2` | MIT | Runtime |
| `call-bind-apply-helpers` | `1.0.2` | MIT | Runtime |
| `call-bound` | `1.0.4` | MIT | Runtime |
| `content-disposition` | `0.5.4` | MIT | Runtime |
| `content-type` | `1.0.5` | MIT | Runtime |
| `cookie` | `0.7.2` | MIT | Runtime |
| `cookie-signature` | `1.0.7` | MIT | Runtime |
| `debug` | `2.6.9` | MIT | Runtime |
| `depd` | `2.0.0` | MIT | Runtime |
| `destroy` | `1.2.0` | MIT | Runtime |
| `dunder-proto` | `1.0.1` | MIT | Runtime |
| `ee-first` | `1.1.1` | MIT | Runtime |
| `encodeurl` | `2.0.1` | MIT | Runtime |
| `es-define-property` | `1.0.1` | MIT | Runtime |
| `es-errors` | `1.3.0` | MIT | Runtime |
| `es-object-atoms` | `1.1.2` | MIT | Runtime |
| `escape-html` | `1.0.3` | MIT | Runtime |
| `etag` | `1.8.1` | MIT | Runtime |
| `express` | `4.22.3` | MIT | Runtime |
| `finalhandler` | `1.3.2` | MIT | Runtime |
| `forwarded` | `0.2.0` | MIT | Runtime |
| `fresh` | `0.5.2` | MIT | Runtime |
| `fsevents` | `2.3.2` | MIT | Development |
| `function-bind` | `1.1.2` | MIT | Runtime |
| `get-intrinsic` | `1.3.0` | MIT | Runtime |
| `get-proto` | `1.0.1` | MIT | Runtime |
| `gopd` | `1.2.0` | MIT | Runtime |
| `has-symbols` | `1.1.0` | MIT | Runtime |
| `hasown` | `2.0.4` | MIT | Runtime |
| `http-errors` | `2.0.1` | MIT | Runtime |
| `iconv-lite` | `0.4.24` | MIT | Runtime |
| `inherits` | `2.0.4` | ISC | Runtime |
| `ipaddr.js` | `1.9.1` | MIT | Runtime |
| `math-intrinsics` | `1.1.0` | MIT | Runtime |
| `media-typer` | `0.3.0` | MIT | Runtime |
| `merge-descriptors` | `1.0.3` | MIT | Runtime |
| `methods` | `1.1.2` | MIT | Runtime |
| `mime` | `1.6.0` | MIT | Runtime |
| `mime-db` | `1.52.0` | MIT | Runtime |
| `mime-types` | `2.1.35` | MIT | Runtime |
| `ms` | `2.0.0` | MIT | Runtime |
| `negotiator` | `0.6.3` | MIT | Runtime |
| `object-inspect` | `1.13.4` | MIT | Runtime |
| `on-finished` | `2.4.2` | MIT | Runtime |
| `parseurl` | `1.3.3` | MIT | Runtime |
| `path-to-regexp` | `0.1.13` | MIT | Runtime |
| `playwright` | `1.56.1` | Apache-2.0 | Development |
| `playwright-core` | `1.56.1` | Apache-2.0 | Development |
| `proxy-addr` | `2.0.8` | MIT | Runtime |
| `qs` | `6.16.2` | BSD-3-Clause | Runtime |
| `range-parser` | `1.2.1` | MIT | Runtime |
| `raw-body` | `2.5.3` | MIT | Runtime |
| `safe-buffer` | `5.2.1` | MIT | Runtime |
| `safer-buffer` | `2.1.2` | MIT | Runtime |
| `send` | `0.19.2` | MIT | Runtime |
| `send/node_modules/ms` | `2.1.3` | MIT | Runtime |
| `serve-static` | `1.16.3` | MIT | Runtime |
| `setprototypeof` | `1.2.0` | ISC | Runtime |
| `side-channel` | `1.1.1` | MIT | Runtime |
| `side-channel-list` | `1.0.1` | MIT | Runtime |
| `side-channel-map` | `1.0.1` | MIT | Runtime |
| `side-channel-weakmap` | `1.0.2` | MIT | Runtime |
| `statuses` | `2.0.2` | MIT | Runtime |
| `toidentifier` | `1.0.1` | MIT | Runtime |
| `type-is` | `1.6.18` | MIT | Runtime |
| `unpipe` | `1.0.0` | MIT | Runtime |
| `utils-merge` | `1.0.1` | MIT | Runtime |
| `vary` | `1.1.2` | MIT | Runtime |

## Important external runtime components

- Supabase JavaScript UMD client is loaded from jsDelivr at `@supabase/supabase-js@2.119.0`; it is not listed in this npm lockfile. Verify its exact upstream package licence, CDN availability, integrity pinning and commercial terms separately.
- NOVA Business Intelligence Edge Function imports `@supabase/server` through Deno configuration. Its dependency tree and licences are managed separately from npm and must be inventoried from Deno lock/import metadata before resale clearance.
- Render, Supabase hosted services, jsDelivr, AI/search/news/weather/finance/sports providers, and any provider-proxied assets are service dependencies, not npm packages.
- The entry animation is stored as base64 text parts under `assets/entry-video/`. Its underlying video provenance, creator, music/audio rights and assignment evidence have not yet been independently verified.
- The repository includes legacy-looking files `nova-server.js`, `index.htmlnova-ai-1.html` and `index.htmlnova-ai-1.htmlnova-ai.html`. Production starts `nova-server.txt`; the other files are not proven active or legally cleared. Preserve until owner confirms archival/deletion policy.

## Resale interpretation

MIT, ISC, BSD-3-Clause and Apache-2.0 are generally permissive, but each licence's notice, attribution, patent and redistribution conditions still apply. Include upstream licence texts and notices in the distributed buyer package. This metadata scan is not a substitute for source/provenance review, notice-bundle inspection, SBOM verification or legal advice.

## Remaining clearance tasks

1. Verify the full Deno dependency graph and licences for `supabase/functions/nova-bi-api`.
2. Inventory and licence-check all static assets, fonts, icons, entry video/audio, embedded code and third-party scripts.
3. Verify upstream source repositories and licence texts for all locked packages, not only the lockfile's `license` field.
4. Add a reproducible SBOM and third-party notices bundle to the release pipeline.
5. Obtain owner evidence that all original code/assets are owned or properly assigned; confirm contributor/contractor IP assignments.
6. Re-run the audit on the exact release tag and record its SHA.

**Status: PRELIMINARY PASS for declared npm lockfile metadata only; overall IP/licence clearance remains INCOMPLETE.**
