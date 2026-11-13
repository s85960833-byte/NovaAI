'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const server = fs.readFileSync(path.join(__dirname, '..', 'nova-server.txt'), 'utf8');

test('restricted keyless commercial sources are absent from active server routes', () => {
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
    'image.pollinations.ai/prompt'
  ]) assert.equal(server.includes(endpoint), false, endpoint + ' must not be called');
});

test('publisher RSS and Google News fail closed pending rights', () => {
  assert.match(server, /const FEEDS = Object\.freeze\(\{\}\)/);
  assert.match(server, /Publisher RSS is disabled pending written commercial-use permission/);
  assert.match(server, /Google News RSS is restricted to personal non-commercial use and is disabled/);
  assert.doesNotMatch(server, /google-news-fallback/);
});

test('restricted or unclear weather, market, statistics and natural-event sources fail closed', () => {
  assert.match(server, /Open-Meteo free API is non-commercial only/);
  assert.match(server, /Weather data is unavailable: no commercially licensed provider is configured/);
  assert.match(server, /CoinGecko Demo API plan has no commercial rights/);
  assert.match(server, /Coinbase Market Data terms restrict use to personal\/research/);
  assert.match(server, /World Bank API commercial use depends on dataset-specific terms/);
  assert.match(server, /NASA EONET metadata and linked source rights are not cleared/);
  assert.match(server, /Hacker News API does not grant NOVA blanket commercial republication rights/);
  assert.match(server, /ESPN unofficial scoreboard feed is disabled/);
  assert.match(server, /TheSportsDB free tier is not cleared for a commercial published app/);
});

test('commercially reusable open metadata carries attribution or licence notices', () => {
  assert.match(server, /GDELT Project open data; cite and link/);
  assert.match(server, /license: 'CC0-1\.0 \(metadata only\)'/);
  assert.match(server, /license: 'CC0-1\.0 \(OpenAlex metadata\)'/);
  assert.match(server, /licenseNote: 'Most Wikipedias use CC BY-SA 4\.0; check page-level exceptions'/);
  assert.match(server, /publisher: 'USGS'/);
  assert.match(server, /attribution: 'U\\.S\\. Geological Survey \\(USGS\\)'/);
  assert.match(server, /Earthquake data courtesy of the U\\.S\\. Geological Survey \\(USGS\\)\\./);
});

test('keyless GDELT route is used instead of Google News RSS for general fallback', () => {
  assert.match(server, /name: 'gdelt', run: async \(\) => \(\{ items: await gdelt\(q/);
  assert.doesNotMatch(server, /gnews\(qq|gnews\(sq/);
});
