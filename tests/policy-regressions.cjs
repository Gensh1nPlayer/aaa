'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
// Isolated ephemeral server; no fixtures or writes to public account data.
const allowed = /^(?:\/(?:terms|privacy)\/(?:index\.html)?|\/404\.html|\/assets\/[^/]+)$/;
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!allowed.test(pathname)) { res.writeHead(404); res.end(); return; }
  const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
const failures = [];
let passed = 0;
async function check(name, run) {
  try { await run(); passed++; console.log('PASS ' + name); }
  catch (error) { failures.push(name + ': ' + error.message); console.error('FAIL ' + name + ': ' + error.message); }
}
const terms = {
  // Independently specified semantic anchors: cause, proof, recovery first,
  // failed recovery, equal value/refund/fair compensation, case/stock,
  // continued eligible SMS, paid eligible services, no guaranteed approval.
  en: [/previous-owner issue/, /review the available proof/, /try recovery first/, /If recovery fails/, /equal-value replacement, refund, or fair compensation/, /case and available stock/, /Eligible OW2 accounts.*continued.*SMS/, /paid.*eligible accounts and regions/, /appeal.*eligible store accounts/, /never guaranteed.*official review/],
  fr: [/ancien propriétaire/, /preuves disponibles/, /d’abord.*récupérer/, /Si la récupération échoue/, /remplacement de valeur équivalente.*remboursement.*compensation équitable/, /cas.*stock disponible/, /OW2 éligibles.*assistance continue.*SMS/, /payant.*comptes et régions éligibles/, /appel.*comptes éligibles du magasin/, /jamais garantis.*examen officiel/],
  de: [/Vorbesitzer/, /verfügbaren Nachweise/, /zuerst.*wiederherzustellen/, /Scheitert die Wiederherstellung/, /gleichwertigen Ersatz.*Rückerstattung.*angemessene Entschädigung/, /Einzelfall.*verfügbarem Bestand/, /Berechtigte OW2-Accounts.*fortlaufende.*SMS/, /kostenpflichtig.*berechtigte Accounts und Regionen/, /Einspruch.*berechtigte Shop-Accounts/, /nie garantiert.*offiziellen Prüfung/],
  ar: [/المالك السابق/, /الأدلة المتاحة/, /الاسترداد أولاً/, /إذا فشل الاسترداد/, /بديلاً بنفس القيمة.*استرداد المبلغ.*تعويضاً عادلاً/, /الحالة والمخزون المتاح/, /OW2 المؤهلة.*مساعدة مستمرة.*SMS/, /مدفوعة.*للحسابات والمناطق المؤهلة/, /استئناف الحظر.*حسابات المتجر المؤهلة/, /غير مضمونة.*للمراجعة الرسمية/],
  ja: [/元所有者/, /利用可能な証拠/, /まず復旧/, /復旧できない場合/, /同等価値の交換.*返金.*適正な補償/, /状況と在庫/, /対象のOW2.*継続的.*SMS/, /有料.*対象アカウントと地域/, /BAN異議申し立て.*対象のストアアカウント/, /保証されず.*公式審査/]
};
async function initialized(page, lang) {
  await page.waitForFunction(lang => document.documentElement.lang === lang && document.querySelectorAll('#policyTocLinks a').length === 10, lang, { timeout: 3000 });
  assert.equal(await page.locator('#langSelect').inputValue(), lang);
  assert.equal(await page.locator('[aria-selected="true"]').getAttribute('data-language-value'), lang);
}
async function focused(page, lang) {
  assert.equal(await page.evaluate(() => document.activeElement.dataset.languageValue), lang);
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  async function localPage(browser, options) {
    const page = await browser.newPage(options);
    await page.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    return page;
  }
  try {
    const engines = process.env.POLICY_CHROMIUM_ONLY ? [['Chromium', chromium]] : [['Chromium', chromium], ['WebKit', webkit]];
    for (const [name, engine] of engines) {
      const browser = await engine.launch({ headless: true, ...(engine === chromium && process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}) });
      try {
        for (const pageName of ['terms', 'privacy']) {
          for (const mode of ['getter', 'get', 'set', 'normal']) {
            await check(`${name} ${pageName} storage ${mode}`, async () => {
              const context = await browser.newContext({ locale: 'ja-JP' });
              try {
                await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
                await context.addInitScript(mode => {
                  window.__ROSHINE_EDGE_LANG__ = 'de';
                  if (mode === 'getter') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
                  else {
                    localStorage.setItem('roshine_lang', 'en');
                    if (mode !== 'normal') Storage.prototype[mode === 'get' ? 'getItem' : 'setItem'] = () => { throw new DOMException('blocked', 'SecurityError'); };
                  }
                }, mode);
                const page = await context.newPage(), errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto(`${base}/${pageName}/?lang=fr`);
                await initialized(page, 'fr');
                await page.locator('#languageTrigger').click();
                await page.locator('[data-language-value="ar"]').click();
                await initialized(page, 'ar');
                assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
                assert.equal(new URL(page.url()).searchParams.get('lang'), 'ar');
                assert.equal(await page.locator('#languageMenu').isVisible(), false);
                assert.equal(await page.evaluate(() => document.activeElement.id), 'languageTrigger');
                await page.goto(`${base}/${pageName}/?lang=invalid`);
                await initialized(page, mode === 'getter' || mode === 'get' ? 'de' : 'en');
                assert.deepEqual(errors, []);
              } finally { await context.close(); }
            });
          }
          await check(`${name} ${pageName} keyboard`, async () => {
            const page = await localPage(browser);
            try {
              await page.goto(`${base}/${pageName}/?lang=fr`);
              await initialized(page, 'fr');
              const trigger = page.locator('#languageTrigger');
              await trigger.focus();
              await page.keyboard.press('ArrowDown'); await focused(page, 'fr');
              await page.keyboard.press('ArrowDown'); await focused(page, 'de');
              assert.equal(await page.locator('html').getAttribute('lang'), 'fr', 'focus does not commit');
              await page.keyboard.press('End'); await focused(page, 'zh');
              await page.keyboard.press('ArrowDown'); await focused(page, 'zh');
              await page.keyboard.press('Home'); await focused(page, 'en');
              await page.keyboard.press('ArrowUp'); await focused(page, 'en');
              await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
              await page.keyboard.press('Enter'); await initialized(page, 'de');
              assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
              await page.keyboard.press('ArrowUp'); await focused(page, 'de');
              await page.keyboard.press('Escape');
              assert.equal(await page.evaluate(() => document.activeElement.id), 'languageTrigger');
              assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
              await page.keyboard.press('Space'); await focused(page, 'de');
              await page.keyboard.press('ArrowDown'); await page.keyboard.press('Space'); await initialized(page, 'ar');
              await page.keyboard.press('ArrowDown'); await focused(page, 'ar');
              await page.keyboard.press('Tab');
              assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
              assert.equal(await page.evaluate(() => document.activeElement.closest('#languagePicker') === null), true, 'Tab leaves picker');
              await trigger.focus(); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Shift+Tab');
              assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
              assert.equal(await page.evaluate(() => !!document.activeElement.closest('#languageMenu')), false);
              assert.equal(await page.locator('html').getAttribute('lang'), 'ar');
            } finally { await page.close(); }
          });
        }
        for (const [lang, patterns] of Object.entries(terms)) {
          await check(`${name} ${lang} warranty contract`, async () => {
            const page = await localPage(browser);
            try {
              await page.goto(`${base}/terms/?lang=${lang}`); await initialized(page, lang);
              const text = await page.locator('#policyContent h2').nth(5).evaluate(h => h.nextElementSibling.textContent);
              for (const pattern of patterns) assert.match(text, pattern);
              assert.doesNotMatch(text, /unlimited|illimitée|unbegrenzt|غير محدود|無制限|full compensation|compensation complète|volle Entschädigung|تعويضاً كاملاً/);
              if (lang === 'en') {
                const fallback = await localPage(browser, { javaScriptEnabled: false });
                try {
                  await fallback.goto(`${base}/terms/`);
                  assert.equal(await fallback.locator('#policyContent h2').nth(5).evaluate(h => h.nextElementSibling.textContent), text, 'static fallback matches English');
                } finally { await fallback.close(); }
              }
            } finally { await page.close(); }
          });
        }
        for (const width of [320, 568]) await check(`${name} 404 wheel ${width}x240`, async () => {
          const page = await localPage(browser, { viewport: { width, height: 240 }, reducedMotion: 'reduce' });
          try {
            await page.goto(`${base}/404.html`);
            const home=new URL(await page.locator('#homeLink').getAttribute('href'),base);
            assert.equal(home.pathname, '/', 'home path is preserved');
            assert.equal(home.searchParams.get('lang'),await page.locator('html').getAttribute('lang'),'home link preserves selected language');
            await page.mouse.move(width / 2, 180);
            await page.mouse.wheel(700, 1800);
            await page.waitForFunction(() => window.scrollY > 0, null, { timeout: 3000 });
            const metrics = await page.locator('.actions a').last().evaluate(link => ({ bottom: link.getBoundingClientRect().bottom, x: scrollX, width: document.documentElement.scrollWidth, viewport: innerWidth }));
            assert(metrics.bottom <= 240, 'last action reachable by wheel');
            assert.equal(metrics.x, 0); assert(metrics.width <= metrics.viewport, 'no horizontal overflow');
            await page.locator('.actions a').last().click({ trial: true });
          } finally { await page.close(); }
        });
      } finally { await browser.close(); }
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
  console.log(`${passed} passed; ${failures.length} failed`);
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
