'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)].map(match => {
  const attrs = match[1];
  const text = match[2].replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#8203;/g, ' ').replace(/\s+/g, ' ').trim();
  const aria = (attrs.match(/\baria-label=["']([^"']*)/i) || [])[1] || '';
  const title = (attrs.match(/\btitle=["']([^"']*)/i) || [])[1] || '';
  const id = (attrs.match(/\bid=["']([^"']*)/i) || [])[1] || '(no id)';
  return { id, text, aria, title };
});

test('static buttons expose an accessible name', () => {
  const unnamed = buttons.filter(button => !button.text && !button.aria && !button.title).map(button => button.id);
  assert.deepEqual(unnamed, []);
});
