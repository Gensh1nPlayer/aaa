const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'accounts.json'), 'utf8')).accounts;
const available = inventory.filter(a => /in\s*stock/i.test(a.status));
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const tls = process.env.TEST_TLS_KEY && process.env.TEST_TLS_CERT;
const serve = (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const name = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
  const file = path.resolve(root, '.' + name);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
};
const server = tls
  ? https.createServer({key:fs.readFileSync(process.env.TEST_TLS_KEY),cert:fs.readFileSync(process.env.TEST_TLS_CERT)}, serve)
  : http.createServer(serve);

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = (tls ? 'https' : 'http') + '://127.0.0.1:' + server.address().port;
  const browsers = [];
  try {
    for (const scenario of [
      {name:'Chrome desktop', engine:chromium, viewport:{width:1440,height:960}},
      {name:'WebKit mobile with Safari 14 API limits', engine:webkit, viewport:{width:414,height:896}, legacy:true},
      {name:'WebKit reduced motion', engine:webkit, viewport:{width:414,height:896}, legacy:true, reducedMotion:'reduce'}
    ]) {
      const browser = await scenario.engine.launch({
        headless:true,
        ...(scenario.engine === chromium && process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {})
      });
      browsers.push(browser);
      const context = await browser.newContext({viewport:scenario.viewport,ignoreHTTPSErrors:true,reducedMotion:scenario.reducedMotion || 'no-preference'});
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
      });
      if (scenario.legacy) await context.addInitScript(() => {
        Array.prototype.at = undefined;
        String.prototype.at = undefined;
        Object.hasOwn = undefined;
        window.structuredClone = undefined;
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      let requests = 0;
      page.on('request', req => { if (new URL(req.url()).pathname === '/accounts.json') requests++; });
      for (const lang of ['en','fr','de','ar','ja']) {
        const before = requests;
        await page.goto(base + '/?lang=' + lang + '#accounts');
        await page.locator('.account-card').first().waitFor();
        assert.equal(await page.locator('.account-card').count(), available.length, lang + ' inventory count');
        assert.equal(await page.locator('#rdAvailableCount').textContent(), String(available.length));
        assert.equal(requests - before, 1, 'Inventory must be fetched once');
        assert.equal(await page.locator('#bg-canvas, .bg-animation, .bg-animation-3').count(), 0);
        assert.equal(await page.locator('#void-starfield').count(), 1);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), lang + ' horizontal overflow');
      }
      if (scenario.viewport.width < 700) {
        await page.locator('#mobileFilterToggle').click();
        await page.locator('#accountSearch').fill('no-such-account-xyz');
        assert.equal(await page.locator('.account-card').count(), 0);
        assert(await page.locator('.accounts-empty').isVisible());
        await page.locator('#accountSearch').fill('');
        await page.locator('#closeAccountFilters').click();
      } else {
        await page.evaluate(() => document.querySelector('#accountStatusFilter').closest('[data-select-picker]').querySelector('button').focus());
        await page.keyboard.press('ArrowUp');
        await page.waitForFunction(() => document.activeElement.hasAttribute('data-select-value'));
        await page.keyboard.press('Escape');
      }
      await page.locator('#accountTypeFilter').selectOption('ow1', {force:true});
      assert.equal(await page.locator('.account-card').count(), available.filter(a => /\bOW1\b/i.test(a.level)).length);
      await page.locator('#accountTypeFilter').selectOption('all', {force:true});
      await page.locator('#accountStatusFilter').selectOption('sold', {force:true});
      assert.equal(await page.locator('.account-card').count(), inventory.filter(a => /sold/i.test(a.status)).length);
      await page.locator('#accountStatusFilter').selectOption('instock', {force:true});
      await page.locator('#accounts').scrollIntoViewIfNeeded();
      if (process.env.SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.SCREENSHOT_DIR, {recursive:true});
        await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR, scenario.legacy ? (scenario.reducedMotion ? 'webkit-reduced.png' : 'webkit-mobile.png') : 'chrome-desktop.png')});
      }
      for (const url of ['/auth/','/privacy/','/terms/','/404.html']) {
        await page.goto(base + url + '?lang=en');
        await page.locator('#void-starfield').waitFor({state:'attached',timeout:5000}).catch(async error => {
          console.log(JSON.stringify(await page.evaluate(() => ({url:location.href,title:document.title,state:document.readyState,scripts:[...document.scripts].map(s => s.src),body:document.body.innerText.slice(0,120)}))));
          throw error;
        });
        assert.equal(await page.locator('#bg-canvas, .bg-animation, .bg-animation-3').count(), 0);
        assert.equal(await page.locator('#void-starfield').count(), 1, url + ' visible starfield');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), url + ' horizontal overflow');
      }
      assert.deepEqual(errors, [], scenario.name);
      console.log(JSON.stringify({scenario:scenario.name,inventory:inventory.length,available:available.length,languages:5,requestsPerLoad:1,pageErrors:errors}));
      await context.close();
    }
  } finally {
    await Promise.all(browsers.map(browser => browser.close()));
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode=1; });
