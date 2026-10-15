const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const filename = path.join(__dirname, '../assets/inventory-updated.js');
const NOW = Date.parse('2026-10-16T12:00:00Z');
const SOURCE = '{"accounts":[{"id":1}]}\n';
const SHA = 'a'.repeat(40);
function harness({ hostname = 'roshine.love', fetch, lang = 'en', timers = {} } = {}) {
  const nodes = Object.fromEntries(['accountsLastUpdatedValue', 'accountsLastUpdatedLabel'].map(id => [id, {
    textContent: '', attrs: {}, setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; }
  }]));
  let onMutation;
  class Clock extends Date { static now() { return NOW; } }
  const document = { documentElement: { lang }, getElementById: id => nodes[id] || null };
  const window = {
    location: { hostname }, fetch, setTimeout, clearTimeout, ...timers,
    MutationObserver: class { constructor(cb) { onMutation = cb; } observe() {} }
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), { window, document, Date: Clock, AbortController });
  return { api: window.RoshineInventoryUpdated, nodes, document, mutate: () => onMutation() };
}
function remote({ raw = SOURCE, date = '2026-10-15T10:20:30Z', commits, failAt, statusAt } = {}) {
  const calls = [];
  return { calls, fetch: async (url, options) => {
    calls.push({ url, options });
    if (calls.length === failAt) throw Error('offline');
    if (calls.length === statusAt) return { ok: false, status: 429 };
    return calls.length === 1
      ? { ok: true, json: async () => commits === undefined ? [{ sha: SHA, commit: { committer: { date }, author: { date: '2020-01-01T00:00:00Z' } } }] : commits }
      : { ok: true, text: async () => raw };
  } };
}
test('local HTTP date is UTC; no network or visit-time substitution', async () => {
  const h = harness({ hostname: 'localhost', fetch: () => { throw Error('unexpected fetch'); } });
  const result = await h.api.update({ sourceText: SOURCE, lastModified: 'Thu, 15 Oct 2026 10:20:30 GMT' });
  assert.equal(result.timestamp, '2026-10-15T10:20:30Z');
  assert.equal(result.source, 'http-last-modified');
  assert.equal(h.nodes.accountsLastUpdatedLabel.textContent, 'File last modified');
  assert.equal(h.nodes.accountsLastUpdatedValue.attrs.datetime, result.timestamp);
  assert.equal(h.nodes.accountsLastUpdatedValue.textContent, '2026-10-15 10:20:30 UTC');
  assert.equal(h.nodes.accountsLastUpdatedValue.attrs['data-source'], 'http-last-modified');
  for (const lastModified of [null, '', 'garbage', '0', '2026-10-15T10:20:30Z', 'Fri, 30 Feb 2026 10:20:30 GMT', 'Sat, 17 Oct 2026 10:20:30 GMT']) {
    const state = await h.api.update({ sourceText: SOURCE, lastModified });
    assert.equal(state.status, 'unknown');
    assert.equal(state.timestamp, null);
    assert.equal(h.nodes.accountsLastUpdatedValue.attrs.datetime, undefined);
    assert.equal(h.nodes.accountsLastUpdatedValue.textContent, 'Unknown');
    assert.equal(h.nodes.accountsLastUpdatedValue.attrs['data-source'], 'unknown');
  }
});
test('verification timeout resolves unknown without an HTTP fallback', async () => {
  let expire; let cleared = false;
  const h = harness({
    timers: { setTimeout(cb, delay) { assert.equal(delay, 8000); expire = cb; return 1; }, clearTimeout() { cleared = true; } },
    fetch: (url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(Error('aborted')), { once: true });
    })
  });
  const pending = h.api.update({ sourceText: SOURCE, lastModified: 'Thu, 15 Oct 2026 10:20:30 GMT' });
  expire();
  assert.equal((await pending).status, 'unknown');
  assert.equal(cleared, true);
});
test('a failed refresh removes the previously verified timestamp', async () => {
  const network = remote(); const h = harness(network);
  await h.api.update({ sourceText: SOURCE });
  assert.equal(h.nodes.accountsLastUpdatedValue.attrs.datetime, '2026-10-15T10:20:30Z');
  const pending = h.api.update({ sourceText: null });
  assert.equal(h.nodes.accountsLastUpdatedValue.textContent, 'Unknown');
  await pending;
  assert.equal(h.nodes.accountsLastUpdatedValue.attrs.datetime, undefined);
  assert.equal(h.nodes.accountsLastUpdatedValue.attrs['data-source'], 'unknown');
});
test('production verifies raw text at immutable SHA and uses committer date', async () => {
  const network = remote(); const h = harness(network);
  const state = await h.api.update({ sourceText: SOURCE, lastModified: 'Fri, 16 Oct 2026 11:59:00 GMT' });
  assert.equal(state.timestamp, '2026-10-15T10:20:30Z');
  assert.equal(state.source, 'github-commit');
  assert.equal(h.nodes.accountsLastUpdatedValue.textContent, '2026-10-15 10:20:30 UTC');
  assert.equal(h.nodes.accountsLastUpdatedValue.attrs.datetime, '2026-10-15T10:20:30Z');
  assert.equal(h.nodes.accountsLastUpdatedValue.attrs['data-source'], 'github-commit');
  const url = new URL(network.calls[0].url);
  assert.equal(url.origin + url.pathname, 'https://api.github.com/repos/Gensh1nPlayer/aaa/commits');
  assert.equal(url.searchParams.get('path'), 'accounts.json');
  assert.equal(url.searchParams.get('per_page'), '1');
  assert.equal(network.calls[1].url, `https://raw.githubusercontent.com/Gensh1nPlayer/aaa/${SHA}/accounts.json`);
  assert.equal(network.calls[0].options.cache, 'no-store');
});
test('exact match required, including whitespace; deployment header never substitutes', async () => {
  for (const raw of [SOURCE.trim(), '{"accounts":[{"id":2}]}', '']) {
    const h = harness(remote({ raw }));
    const state = await h.api.update({ sourceText: SOURCE, lastModified: 'Thu, 15 Oct 2026 10:20:30 GMT' });
    assert.equal(state.status, 'unknown');
    assert.equal(state.reason, 'content-mismatch');
  }
});
test('API/raw failure, HTTP errors, malformed fields, invalid/future dates stay unknown', async () => {
  for (const options of [
    { failAt: 1 }, { failAt: 2 }, { statusAt: 1 }, { statusAt: 2 },
    { commits: [] }, { commits: {} }, { commits: [{ sha: '../main' }] },
    { commits: [{ sha: SHA, committer: { date: '2026-10-15T10:20:30Z' } }] },
    { date: 'invalid' }, { date: '2026-02-30T10:20:30Z' }, { date: '2026-10-17T00:00:00Z' }
  ]) {
    const h = harness(remote(options));
    const state = await h.api.update({ sourceText: SOURCE, lastModified: 'Thu, 15 Oct 2026 10:20:30 GMT' });
    assert.equal(state.timestamp, null, JSON.stringify(options));
    assert.equal(h.nodes.accountsLastUpdatedValue.textContent, 'Unknown');
  }
});
test('all public hosts require GitHub verification; loopback uses only HTTP metadata', async () => {
  for (const hostname of ['gensh1nplayer.github.io', 'www.roshine.love', 'preview.example.com']) {
    const network = remote({ failAt: 1 }); const h = harness({ ...network, hostname });
    assert.equal((await h.api.update({ sourceText: SOURCE, lastModified: 'Thu, 15 Oct 2026 10:20:30 GMT' })).status, 'unknown');
    assert.equal(network.calls.length, 1);
  }
  for (const hostname of ['127.0.0.1', '[::1]']) {
    const h = harness({ hostname });
    assert.equal((await h.api.update({ sourceText: SOURCE, lastModified: 'Thu, 15 Oct 2026 10:20:30 GMT' })).status, 'known');
  }
});
test('five languages refresh without refetch; UTC string stays unchanged', async () => {
  const network = remote(); const h = harness(network);
  await h.api.update({ sourceText: SOURCE });
  const labels = new Set();
  for (const lang of ['en', 'fr', 'de', 'ar', 'ja']) {
    h.document.documentElement.lang = lang; h.mutate();
    labels.add(h.nodes.accountsLastUpdatedLabel.textContent);
    assert.equal(h.nodes.accountsLastUpdatedValue.textContent, '2026-10-15 10:20:30 UTC');
    assert.equal(h.nodes.accountsLastUpdatedValue.attrs.datetime, '2026-10-15T10:20:30Z');
    assert.equal(h.nodes.accountsLastUpdatedValue.attrs['data-source'], 'github-commit');
    assert.ok(h.nodes.accountsLastUpdatedValue.attrs.title);
  }
  assert.equal(labels.size, 5); assert.equal(network.calls.length, 2);
  await h.api.update({});
  const unknowns = new Set();
  for (const lang of ['en', 'fr', 'de', 'ar', 'ja']) {
    h.document.documentElement.lang = lang; h.api.render();
    unknowns.add(h.nodes.accountsLastUpdatedValue.textContent);
  }
  assert.equal(unknowns.size, 5);
});
test('new inventory clears previous result; stale async response cannot overwrite it', async () => {
  let release;
  const network = remote(); const original = network.fetch;
  network.fetch = async (url, options) => {
    if (url.includes('api.github.com')) await new Promise(resolve => { release = resolve; });
    return original(url, options);
  };
  const h = harness(network);
  const old = h.api.update({ sourceText: SOURCE });
  await h.api.update({ sourceText: null });
  release(); await old;
  assert.equal(h.nodes.accountsLastUpdatedValue.textContent, 'Unknown');
});
