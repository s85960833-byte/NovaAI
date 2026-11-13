'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const server = fs.readFileSync(path.join(__dirname, '..', 'nova-server.txt'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', 'nova-app.js'), 'utf8');

test('restricted or uncleared keyless providers have no active endpoint', () => {
  for (const endpoint of [
    'proxy.cors.dev',
    'query1.finance.yahoo.com',
    'query2.finance.yahoo.com',
    'duckduckgo.com/html',
    'site.api.espn.com',
    'api.open-meteo.com',
    'geocoding-api.open-meteo.com',
    'https://wttr.in/',
    'news.google.com/rss',
    'feeds.bbci.co.uk',
    'api.coingecko.com',
    'api.exchange.coinbase.com',
    'api.worldbank.org',
    'eonet.gsfc.nasa.gov/api/v3/events',
    'hacker-news.firebaseio.com',
    'image.pollinations.ai/prompt',
    'wikipedia.org/',
    'api.wikimedia.org/',
    'api.frankfurter.app/'
  ]) assert.equal(server.includes(endpoint), false, endpoint + ' must not be called');
});

test('publisher RSS and Google News fail closed pending rights', () => {
  assert.match(server, /const FEEDS = Object\.freeze\(\{\}\)/);
  assert.match(server, /Publisher RSS is disabled pending written commercial-use permission/);
  assert.match(server, /Google News RSS is restricted to personal non-commercial use and is disabled/);
  assert.doesNotMatch(server, /google-news-fallback/);
});

test('uncleared weather, market, statistics, and natural-event routes fail closed', () => {
  assert.match(server, /Open-Meteo free API is non-commercial only/);
  assert.match(server, /Weather data is unavailable: no commercially licensed provider is configured/);
  assert.match(server, /CoinGecko Demo API plan has no commercial rights/);
  assert.match(server, /Coinbase Market Data terms restrict use to personal\/research/);
  assert.match(server, /World Bank API commercial use depends on dataset-specific terms/);
  assert.match(server, /NASA EONET metadata and linked source rights are not cleared/);
  assert.match(server, /Hacker News API does not grant NOVA blanket commercial republication rights/);
  assert.match(server, /Currency conversion is disabled until NOVA can verify/);
  assert.match(server, /Wikipedia article search is disabled until NOVA verifies page-specific licences/);
  assert.match(server, /Wikipedia current-events content is disabled pending page-specific licence/);
  assert.match(server, /Wikipedia extracts are disabled pending page-specific licence/);
  assert.doesNotMatch(server, /T\('fx'/);
  assert.doesNotMatch(server, /name: 'wikipedia'/);
  assert.match(server, /ESPN unofficial scoreboard feed is disabled/);
  assert.match(server, /TheSportsDB free tier is not cleared for a commercial published app/);
});

test('open metadata and public-domain records carry explicit attribution or licence fields', () => {
  assert.match(server, /GDELT Project open data; cite and link/);
  assert.match(server, /attribution: 'GDELT Project', attributionUrl: 'https:\/\/www\.gdeltproject\.org\//);
  assert.match(server, /license: 'CC0-1\.0 \(metadata only\)'/);
  assert.match(server, /license: 'CC0-1\.0 \(OpenAlex metadata\)'/);
  assert.ok(server.includes("attribution: 'U.S. Geological Survey (USGS)'"));
  assert.ok(server.includes("Earthquake data courtesy of the U.S. Geological Survey (USGS)."));
  assert.match(server, /attributionUrl: safeUrl\(s\.attributionUrl\)/);
  assert.match(server, /licenseUrl: safeUrl\(s\.licenseUrl\)/);
});

test('live source attribution and licence metadata are passed through and rendered by the browser UI', () => {
  assert.ok(app.includes('a:s.attribution,au:s.attributionUrl,lic:s.license,lu:s.licenseUrl,ln:s.licenseNote'));
  assert.ok(app.includes('s.a||s.au||s.lic||s.lu||s.ln'));
  assert.ok(app.includes('Credit/source'));
  assert.ok(app.includes('Licence details'));
  assert.ok(app.includes('noopener noreferrer nofollow'));
});

test('keyless general web fallback is GDELT only', () => {
  assert.match(server, /name: 'gdelt', run: async \(\) => \(\{ items: await gdelt\(q/);
  assert.doesNotMatch(server, /name: 'wikipedia'/);
  assert.doesNotMatch(server, /gnews\(qq|gnews\(sq/);
});
