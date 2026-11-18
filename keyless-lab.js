(() => {
  'use strict';
  const form = document.getElementById('searchForm');
  const query = document.getElementById('query');
  const language = document.getElementById('language');
  const button = document.getElementById('searchButton');
  const clear = document.getElementById('clearButton');
  const status = document.getElementById('status');
  const summary = document.getElementById('summary');
  const results = document.getElementById('results');
  const escText = value => String(value || '');
  function node(tag, cls, value) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (value != null) el.textContent = escText(value);
    return el;
  }
  function render(items) {
    results.replaceChildren();
    if (!items.length) { results.append(node('div','empty','No results were returned by the keyless sources.')); return; }
    items.forEach(item => {
      const article = node('article','result'), title = node('h3'), link = node('a');
      link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.textContent = escText(item.title || 'Open source'); title.append(link); article.append(title);
      article.append(node('div','meta',[item.publisher || 'Source', item.date || 'Date not supplied', item.quality || 'other'].filter(Boolean).join(' · ')));
      if (item.snippet) article.append(node('p','snippet',item.snippet));
      results.append(article);
    });
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const q = query.value.trim();
    if (q.length < 2) { status.textContent = 'Enter at least 2 characters.'; return; }
    button.disabled = true; status.textContent = 'Searching public keyless sources…';
    summary.textContent = ''; results.replaceChildren(node('div','empty','Fetching source results…'));
    try {
      const response = await fetch('/api/keyless-search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, lang: language.value }), signal: AbortSignal.timeout(22000)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Search unavailable.');
      render(data.results || []); status.textContent = 'Search complete.';
      summary.replaceChildren(
        node('span','pill',(data.results || []).length + ' sources'),
        node('span','pill','No AI key used'),
        node('span','pill','Retrieved ' + new Date(data.retrievedAt).toLocaleTimeString())
      );
      if (data.providers && data.providers.length) summary.append(document.createTextNode('  Sources: ' + data.providers.join(', ')));
    } catch (error) {
      status.textContent = error && error.name === 'TimeoutError' ? 'Search timed out. Try again.' : (error.message || 'Search failed.');
      summary.textContent = ''; results.replaceChildren(node('div','empty','No verified results to show.'));
    } finally { button.disabled = false; }
  });
  clear.addEventListener('click', () => {
    query.value = ''; status.textContent = 'Ready.'; summary.textContent = 'No search performed yet.';
    results.replaceChildren(node('div','empty','Your source links will appear here.')); query.focus();
  });
})();
