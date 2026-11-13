'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const server = fs.readFileSync(path.join(__dirname, '..', 'nova-server.txt'), 'utf8');

test('unlicensed keyless commercial feeds are absent from active server routes', () => {
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
    'feeds.bbci.co.uk'
  ]) assert.equal(server.includes(endpoint), false, endpoint + ' must not be called');
});

test('publisher RSS, Google News, weather and unofficial sports routes fail closed', () => {
  assert.match(server, /const FEEDS = Object\.freeze\(\{\}\)/);
  assert.match(server, /Publisher RSS is disabled pending written commercial-use permission/);
  assert.match(server, /Google News RSS is restricted to personal non-commercial use and is disabled/);
  assert.match(server, /Open-Meteo free API is non-commercial only/);
  assert.match(server, /Weather data is unavailable: no commercially licensed provider is configured/);
  assert.match(server, /ESPN unofficial scoreboard feed is disabled/);
  assert.match(server, /TheSportsDB free tier is not cleared for a commercial published app/);
});
