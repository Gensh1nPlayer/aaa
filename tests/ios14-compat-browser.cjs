'use strict';
// Early iOS 14 Safari (< 14.5): replaceChildren() with no arguments keeps the old children, and flex
// `gap` is ignored. assets/compat.js must stop repeated content and restore flex spacing.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const {webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const types = {'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'};
// Fixture: a real full snapshot (profile, role stats, balances) served as stock #123.
const snapshot = {...JSON.parse(fs.readFileSync(path.join(root, 'acc_details/data/194.json'), 'utf8')), accountId: '123', accountLabel: 'Account #123'};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
  if (pathname === '/accounts.json') return json({accounts: [{id: 123, level: '1413 - OW2', price: '$50'}]});
  if (pathname === '/account_details.json') return json({schemaVersion: 1, accounts: {123: snapshot}});
  const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file));
});
// The defective iOS 14 behaviour, installed before the page's own scripts.
const zeroArgumentReplaceIsNoop = () => {
  for (const proto of [Element.prototype, Document.prototype, DocumentFragment.prototype]) {
    const native = proto.replaceChildren;
    proto.replaceChildren = function (...nodes) { if (nodes.length) return native.apply(this, nodes); };
  }
};
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await webkit.launch({headless: true});
  try {
    const context = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
    await context.addInitScript(zeroArgumentReplaceIsNoop);
    await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/acc_details/?lang=en#123');
    await page.waitForFunction(() => document.body && document.body.classList.contains('has-account'));
    for (const tab of ['statistics', 'overview', 'statistics', 'overview']) {
      await page.locator(`[data-tab="${tab}"]`).click();
      await page.waitForTimeout(150);
    }
    const eyebrow = await page.locator('#pageEyebrow').innerText();
    assert.equal((eyebrow.match(/ACCOUNT #123/gi) || []).length, 1, 'capture label is replaced, not stacked: ' + eyebrow);
    assert(!/Enter a stock ID/i.test(eyebrow), 'the empty-state label is cleared');
    assert.equal(await page.getByText('Account overview', {exact: true}).count(), 1, 'Overview sections render once');
    assert.equal(await page.getByText('No account snapshot is available').count(), 0, 'no stale placeholder');

    // Flex gap fallback: emulate an engine that ignores flex gap after the polyfill has read it.
    const spacing = await page.evaluate(() => {
      const label = document.querySelector('.role-label');
      const icon = label.querySelector('.role-icon');
      const gap = parseFloat(getComputedStyle(label).columnGap);
      window.RoshineCompat.polyfillFlexGap(document);
      label.style.columnGap = '0px';
      const textStart = (() => { const range = document.createRange(); range.selectNodeContents(label); const rects = [...range.getClientRects()]; return rects[rects.length - 1].left; })();
      return {gap, iconToText: textStart - icon.getBoundingClientRect().right, supported: window.RoshineCompat.supportsFlexGap()};
    });
    assert(spacing.supported, 'modern WebKit supports flex gap, so the fallback stays off by default');
    assert(Math.abs(spacing.iconToText - spacing.gap) < 1.5, `icon keeps its ${spacing.gap}px gap to the role text without flex gap (got ${spacing.iconToText})`);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({scenario: 'WebKit with iOS 14 replaceChildren defect', repeatedContent: false, flexGapFallback: true, pageErrors: errors}));
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
