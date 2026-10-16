const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'accounts.json')));
const stock = (inventory.accounts || inventory).find(row => String(row.id) === '191');
const screenshotDir = process.env.IDENTITY_SCREENSHOT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'roshine-identity-'));
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', ({'.js':'text/javascript', '.css':'text/css', '.html':'text/html', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch({headless:true, ...(name === 'chromium' && process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {})});
    try {
      const page = await browser.newPage({viewport:{width:1440, height:1000}});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
      await page.goto(`http://127.0.0.1:${server.address().port}/acc_details/?lang=en#191`);
      await page.locator('#accountStockTags .premium').waitFor();
      assert.equal(await page.locator('#accountHeading').textContent(), 'ID #191');
      assert.equal(await page.locator('#accountLevelValue').textContent(), '347 + 361');
      assert.equal(await page.locator('#accountVersion').textContent(), 'OW1');
      assert.equal(await page.locator('#accountEndorsementValue').textContent(), '3');
      assert.deepEqual(await page.locator('#accountStockTags > span').allTextContents(), ['Premium Account']);
      for (const width of [1440, 768, 390, 320]) {
        await page.setViewportSize({width, height:1000});
        for (const dense of [false, true]) {
          await page.evaluate(({stock, dense}) => HeroGallery.setStockAccount(dense ? {...stock, highlights:'Premium Battle Pass: Season 12<br>SilverBorder • Golden Border • Plat Border • Diamond Border • Stacked Account'} : stock), {stock, dense});
          if (dense) assert.deepEqual(await page.locator('#accountStockTags > span').allTextContents(), ['Premium Account','Silver Border','Gold Border','Platinum Border','Diamond Border','Stacked Account']);
          const geometry = await page.evaluate(() => {
            const rect = node => { const r = node.getBoundingClientRect(); return {x:r.x, y:r.y, right:r.right, bottom:r.bottom, width:r.width, height:r.height}; };
            const heading = document.getElementById('accountHeading'), level = document.getElementById('accountLevel');
            // Text rectangles compare the actual glyph lines, independently of badge padding.
            const textRect = node => { const range = document.createRange(); range.selectNodeContents(node); return rect(range); };
            const badges = [...document.querySelectorAll('#accountPanelBadges .details-version, #accountEndorsement, #accountStockTags > span')].filter(node => !node.hidden);
            return {heading:rect(heading), level:rect(level), headingText:textRect(heading), levelText:textRect(level),
              headingFont:getComputedStyle(heading).fontSize, levelFont:getComputedStyle(level).fontSize,
              badges:badges.map(rect), group:rect(document.getElementById('accountPanelBadges')),
              viewport:innerWidth, scroll:document.documentElement.scrollWidth};
          });
          assert.equal(geometry.headingFont, geometry.levelFont, 'ID and level use balanced type');
          assert(geometry.scroll <= width, `${name}/${width}: no horizontal overflow`);
          if (width >= 768) assert(Math.abs(geometry.headingText.bottom - geometry.levelText.bottom) <= 2, 'ID and level share a text baseline: ' + JSON.stringify(geometry));
          assert(geometry.group.y >= Math.max(geometry.heading.bottom, geometry.level.bottom), 'secondary labels are below identity');
          for (const badge of geometry.badges) {
            assert(badge.x >= 0 && badge.right <= width, 'all labels remain inside viewport');
            assert.equal(badge.height, 30, 'secondary labels use consistent heights');
          }
          for (let i = 0; i < geometry.badges.length; i++) for (let j = i + 1; j < geometry.badges.length; j++) {
            const a = geometry.badges[i], b = geometry.badges[j];
            assert(a.right <= b.x + .5 || b.right <= a.x + .5 || a.bottom <= b.y + .5 || b.bottom <= a.y + .5, 'labels must not overlap');
          }
          await page.locator('.account-hero').screenshot({path:path.join(screenshotDir, `${name}-${width}-${dense ? 'labels' : '191'}.png`)});
        }
      }
      await page.evaluate(() => {
        HeroGallery.setStockAccount({id:191, level:'11 - OW2', price:'$20'});
        HeroGallery.loadSnapshot({accountId:'191', ownedSkinIds:[], profile:{accountLevel:'111111111 + 222222222 - OW1 OW2'}});
      });
      assert.equal(await page.locator('#accountVersion').textContent(), 'OW1OW2');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'long compound level wraps');
      await page.evaluate(() => {
        HeroGallery.setStockAccount({id:191, level:'11', highlights:'Stacked Account', price:'$20'});
        HeroGallery.loadSnapshot({accountId:'191', ownedSkinIds:[], profile:{accountLevel:11}});
      });
      assert(await page.locator('#accountPanelBadges').isVisible(), 'stored tags remain visible without version or endorsement');
      assert.deepEqual(await page.locator('#accountStockTags > span').allTextContents(), ['Stacked Account']);
      await page.goto(`http://127.0.0.1:${server.address().port}/acc_details/?lang=ar#191`);
      await page.locator('#accountStockTags .premium').waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'RTL mobile fits');
      assert.deepEqual(errors, []);
      console.log(`${name}: real #191, dense labels, four widths, baseline, long OW1+OW2 level, tags-only and RTL passed.`);
    } finally { await browser.close(); }
  }
  console.log('Identity screenshots: ' + screenshotDir);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
