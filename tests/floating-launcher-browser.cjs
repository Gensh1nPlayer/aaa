'use strict';
// The floating Search / Home launchers stay centred and still through a whole breathing cycle while the
// page scrolls. iOS 14 Safari left a transform-centred, animated, backdrop-filtered fixed bar off-centre
// and jittering, so centring must not depend on transforms and the animation must not move it.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
for (const file of ['assets/redesign.css', 'assets/floating-launcher.css']) {
  const css = fs.readFileSync(path.join(root, file), 'utf8');
  for (const [, body] of css.matchAll(/@keyframes\s+rd(?:Search|Home)Breath\s*{([\s\S]*?)}\s*}/g)) assert(!/transform/.test(body), `${file}: breathing keyframes must not animate transform`);
}
const types = {'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const [name, engine] of [['Chromium', chromium], ['WebKit', webkit]]) {
    const browser = await engine.launch({headless: true, ...(engine === chromium && process.env.CHROME_EXECUTABLE ? {executablePath: process.env.CHROME_EXECUTABLE} : {})});
    try {
      for (const [label, url, selector] of [['home', '/?lang=en', '#rdSearchLauncher'], ['details', '/acc_details/?lang=en', '.rd-home-launcher']]) {
        for (const width of [390, 1280]) {
          const page = await browser.newPage({viewport: {width, height: 844}});
          await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
          await page.goto(base + url);
          await page.locator(selector).waitFor();
          const boxes = [];
          for (let step = 0; step < 18; step++) {  // 18 x 200 ms covers the 3.2 s breathing cycle
            await page.evaluate(y => window.scrollTo(0, y), step * 150);
            await page.waitForTimeout(200);
            boxes.push(await page.locator(selector).evaluate(node => { const r = node.getBoundingClientRect(); return {left: r.left, right: r.right, top: r.top}; }));
          }
          for (const box of boxes) assert(Math.abs((box.left + box.right) / 2 - width / 2) < 1, `${name} ${label} ${width}px: launcher centred (${box.left}-${box.right})`);
          const spread = key => Math.max(...boxes.map(b => b[key])) - Math.min(...boxes.map(b => b[key]));
          assert(spread('left') < 0.5 && spread('top') < 0.5, `${name} ${label} ${width}px: launcher does not move (${spread('left')}, ${spread('top')})`);
          await page.close();
        }
      }
      console.log(JSON.stringify({scenario: name, centred: true, motionless: true}));
    } finally { await browser.close(); }
  }
  server.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
