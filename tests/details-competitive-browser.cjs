'use strict';
// Competitive tab (points beside the title, four queues, History Season only when entered) and skin
// pages (five full rows per page at every grid width, numbered pager).
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const real = JSON.parse(fs.readFileSync(path.join(root, 'acc_details/data/194.json'), 'utf8'));
const plain = {...real, accountId: '123', accountLabel: 'Account #123', competitive: {season: '', ranks: {tank: 'Placement 0/10', damage: 'Gold 2', support: '', openQueue: ''}}};
const history = {...plain, accountId: '124', accountLabel: 'Account #124', profile: {...plain.profile, historicalRanks: [
  {season: '2026: Season 3', ranks: {tank: 'Diamond 4', damage: '', support: '', openQueue: 'Master 3'}}]}};
const types = {'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
  if (pathname === '/accounts.json') return json({accounts: [{id: 123, level: '1413 - OW2', price: '$50'}, {id: 124, level: '1413 - OW2', price: '$50'}]});
  if (pathname === '/account_details.json') return json({schemaVersion: 1, accounts: {123: plain, 124: history}});
  const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless: true, ...(process.env.CHROME_EXECUTABLE ? {executablePath: process.env.CHROME_EXECUTABLE} : {})});
  try {
    for (const [name, viewport, columns] of [['wide', {width: 1600, height: 1000}, 5], ['laptop', {width: 1440, height: 1000}, 4], ['phone', {width: 390, height: 844}, 2]]) {
      const page = await browser.newPage({viewport}), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
      await page.goto(base + '/acc_details/?lang=en#123');
      await page.waitForFunction(() => document.body && document.body.classList.contains('has-account'));
      await page.locator('[data-tab="competitive"]').click();
      assert.deepEqual(await page.locator('#competitiveSummary h2').allInnerTexts(), ['Current Season'], 'no History Season without entries');
      const roles = await page.locator('#competitiveSummary .competitive-card').evaluateAll(cards => cards.map(card => [card.querySelector('.role-label').textContent.trim(), card.querySelector('.rank-value').textContent, Boolean(card.querySelector('img.role-icon'))]));
      assert.deepEqual(roles, [['Tank', 'Placement 0/10', true], ['Damage', 'Gold 2', true], ['Open Queue', 'Placement 0/10', true]], 'uncollected Open Queue defaults to Placement 0/10');
      const points = await page.locator('#competitivePoints .balance-item').evaluateAll(items => items.map(item => [item.dataset.currency, item.querySelector('img.balance-icon').getAttribute('src'), item.querySelector('strong').className]));
      assert.deepEqual(points, [['competitivePoints', 'assets/wallet/competitive-points.png', 'balance-value-threshold'], ['legacyCompetitivePoints', 'assets/wallet/legacy-competitive-points.png', 'balance-value-critical']], 'same icons and value colours as Overview');
      const title = await page.locator('#placeholderTitle').boundingBox(), box = await page.locator('#competitivePoints').boundingBox();
      if (name !== 'phone') assert(box.x > title.x + title.width && box.y < title.y + title.height, 'points sit to the right of the title');
      await page.goto(base + '/acc_details/?lang=en#124');
      await page.waitForFunction(() => document.querySelector('#pageEyebrow').textContent.includes('#124'));
      await page.locator('[data-tab="competitive"]').click();
      assert.deepEqual(await page.locator('#competitiveSummary h2, #competitiveSummary h3').allInnerTexts(), ['Current Season', 'History Season', '2026: Season 3']);
      assert.equal(await page.locator('#competitiveSummary .competitive-cards').nth(1).locator('.competitive-card').count(), 2, 'history shows only entered queues');

      await page.locator('[data-tab="skins"]').click();
      assert.equal(await page.locator('#skinGrid .skin-card').count(), columns * 5, `${name}: five full rows of ${columns}`);
      const total = Math.ceil((real.ownedSkinIds.length + real.uncataloguedOwnedItems.filter(item => item.category === 'skins').length) / (columns * 5));
      const pager = async () => (await page.locator('#pagination').innerText()).replace(/\s+/g, ' ').trim();
      assert.equal(await pager(), `‹ 1 2 3 4 … ${total} ›`);
      assert(!/Previous|Next/.test(await pager()), 'arrows only, no words');
      assert.equal(await page.locator('#pagination .page-arrow').first().getAttribute('aria-label'), 'Previous page');
      await page.locator('#pagination .page-number', {hasText: /^4$/}).click();
      assert.equal(await pager(), `‹ 1 … 3 4 5 … ${total} ›`);
      assert.equal(await page.locator('#pagination [aria-current="page"]').innerText(), '4');
      await page.locator('#pagination .page-number', {hasText: new RegExp(`^${total}$`)}).click();
      assert.equal(await page.locator('#pagination .page-arrow').last().isDisabled(), true, 'next arrow disabled on the last page');
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({scenario: name, columns, perPage: columns * 5, pages: total, competitivePointsBesideTitle: name !== 'phone', openQueueDefault: true, historyOnlyWhenEntered: true}));
      await page.close();
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
