'use strict';
// Run with TEST_TLS_KEY / TEST_TLS_CERT, PLAYWRIGHT_MODULE and optional CHROME_EXECUTABLE.
// AUTH_BASELINE_REF=80ed21bf serves the original page from Git without changing the checkout.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const {execFileSync} = require('node:child_process');
const {createHmac} = require('node:crypto');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const source = process.env.AUTH_BASELINE_REF
  ? execFileSync('git', ['show', `${process.env.AUTH_BASELINE_REF}:auth/index.html`], {cwd:root})
  : fs.readFileSync(path.join(root, 'auth/index.html'));
const key = Buffer.from('12345678901234567890').toString('hex');
const other = Buffer.from('09876543210987654321').toString('hex');
function expected(secret, seconds) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(seconds / 30)));
  const mac = createHmac('sha1', Buffer.from(secret, 'hex')).update(counter).digest();
  return String((mac.readUInt32BE(mac[19] & 15) & 0x7fffffff) % 100000000).padStart(8, '0');
}
const server = https.createServer({key:fs.readFileSync(process.env.TEST_TLS_KEY), cert:fs.readFileSync(process.env.TEST_TLS_CERT)}, (req,res) => {
  if (new URL(req.url, 'https://localhost').pathname.startsWith('/auth/')) {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); res.end(source);
  } else { res.writeHead(204); res.end(); }
});
async function harness(page, {storage} = {}) {
  await page.addInitScript(({storage}) => {
    window.testNow = 59000;
    Date.now = () => window.testNow;
    window.testIntervals = [];
    window.setInterval = fn => { window.testIntervals.push(fn); return window.testIntervals.length; };
    if (storage) Object.defineProperty(Storage.prototype, storage, {value() { throw new DOMException('Blocked', 'SecurityError'); }});
    // Compute real browser HMAC first, then hold only delivery to deterministically order completions.
    const sign = crypto.subtle.sign.bind(crypto.subtle);
    window.testJobs = [];
    window.testHold = false;
    crypto.subtle.sign = async (...args) => {
      const held = window.testHold;
      const real = sign(...args);
      if (!held) return real;
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      const job = {release, ready:false, done:false, fail:false};
      window.testJobs.push(job);
      const result = await real;
      job.ready = true;
      await gate;
      job.done = true;
      if (job.fail) throw new Error('delayed test error');
      return result;
    };
  }, {storage});
}
async function input(page, value) { await page.locator('#secret').fill(value); }
async function code(page, value) { await page.waitForFunction(value => document.getElementById('code').textContent === value, value, {timeout:1800}); }
async function hold(page, value) {
  await page.evaluate(() => { window.testHold = true; });
  await input(page, value);
  await page.waitForFunction(() => window.testJobs.some(j => j.ready));
}
async function release(page, fail = false) {
  await page.evaluate(fail => { for (const j of window.testJobs) { j.fail = fail; j.release(); } }, fail);
  await page.waitForFunction(() => window.testJobs.every(j => j.done));
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 20)));
}
const cases = [
  ['RFC 6238 SHA-1 eight-digit vectors and variable key lengths', {}, async page => {
    for (const [seconds, value] of [[59,'94287082'],[1111111109,'07081804'],[1111111111,'14050471'],[1234567890,'89005924'],[2000000000,'69279037'],[20000000000,'65353130']]) {
      assert.equal(expected(key, seconds), value);
      await page.evaluate(seconds => { window.testNow = seconds * 1000; }, seconds);
      await input(page, ''); await input(page, key); await code(page, value);
    }
    for (const secret of ['ab', 'abcdef', other]) {
      await input(page, secret); await code(page, expected(secret, 20000000000));
    }
  }],
  ['strict whole Hex validation and allowed prefix/whitespace', {}, async page => {
    await input(page, ' 0x31 32\t33\n34 '); await code(page, expected('31323334', 59));
    for (const bad of ['abZZcd', 'ab-cd', 'ab:cd', '0x0x12', 'abc', 'ab\u200bcd']) {
      await input(page, bad);
      await page.waitForFunction(() => document.getElementById('status').classList.contains('err'), null, {timeout:1800});
      assert.equal(await page.locator('#code').textContent(), '--------');
    }
  }],
  ['older key success cannot overwrite latest key', {}, async page => {
    await hold(page, key);
    await page.evaluate(() => { window.testHold = false; });
    await input(page, other); await code(page, expected(other, 59));
    await release(page); assert.equal(await page.locator('#code').textContent(), expected(other, 59));
  }],
  ['Clear invalidates pending crypto', {}, async page => {
    await hold(page, key); await page.locator('#clear').click(); await release(page);
    assert.equal(await page.locator('#secret').inputValue(), '');
    assert.equal(await page.locator('#code').textContent(), '--------');
    assert.equal(await page.locator('#status').textContent(), '');
  }],
  ['obsolete crypto errors cannot overwrite latest success', {}, async page => {
    await hold(page, key); await page.evaluate(() => { window.testHold = false; });
    await input(page, other); await code(page, expected(other, 59)); await release(page, true);
    assert.equal(await page.locator('#code').textContent(), expected(other, 59));
    assert.equal(await page.locator('#status').textContent(), '');
  }],
  ['Clear then same key rejects the old request version', {}, async page => {
    await hold(page, key); await page.locator('#clear').click();
    await page.evaluate(() => { window.testHold = false; });
    await input(page, key); await code(page, expected(key, 59)); await release(page, true);
    assert.equal(await page.locator('#code').textContent(), expected(key, 59));
    assert.equal(await page.locator('#status').textContent(), '');
  }],
  ['older success cannot erase a new validation error', {}, async page => {
    await hold(page, key); await input(page, 'abc');
    assert.equal(await page.locator('#status').textContent(), 'Invalid Private Key');
    await release(page);
    assert.equal(await page.locator('#code').textContent(), '--------');
    assert.equal(await page.locator('#status').textContent(), 'Invalid Private Key');
  }],
  ...[false,true].map(fail => [`expired time-window ${fail ? 'error' : 'success'} refreshes immediately`, {}, async page => {
    await hold(page, key);
    await page.evaluate(() => { window.testNow = 60000; window.testHold = false; });
    await release(page, fail); await code(page, expected(key, 60));
    assert.equal(await page.locator('#status').textContent(), '');
  }]),
  ['timer refresh coalesces pending work and catches new window', {}, async page => {
    await hold(page, key);
    await page.evaluate(() => { window.testNow = 59500; window.testIntervals.forEach(fn => fn()); });
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 20)));
    assert.equal(await page.evaluate(() => window.testJobs.length), 1);
    await page.evaluate(() => { window.testNow = 60000; window.testHold = false; window.testIntervals.forEach(fn => fn()); });
    await code(page, expected(key, 60)); await release(page);
    assert.equal(await page.locator('#code').textContent(), expected(key, 60));
  }],
  ...['getItem', 'setItem'].map(storage => [`storage ${storage} blocked: startup, language and reload`, {storage}, async page => {
    await input(page, key); await code(page, expected(key, 59));
    await page.locator('#languageTrigger').click(); await page.locator('[data-language-value="ja"]').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
    assert.equal(new URL(page.url()).searchParams.get('lang'), 'ja');
    await page.reload(); assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
    await input(page, other); await code(page, expected(other, 59));
  }]),
  ['language URL preserves query key, duplicate parameters, path and hash', {url:`/auth/${key}?lang=en&key=${other}&extra=a%20b&extra=c#keep`}, async page => {
    assert.equal(await page.locator('#secret').inputValue(), other);
    await page.locator('#languageTrigger').click(); await page.locator('[data-language-value="ar"]').click();
    const url = new URL(page.url());
    assert.equal(url.pathname, `/auth/${key}`); assert.equal(url.hash, '#keep');
    assert.equal(url.searchParams.get('key'), other); assert.deepEqual(url.searchParams.getAll('extra'), ['a b','c']);
    assert.equal(url.searchParams.get('lang'), 'ar');
    await page.reload(); assert.equal(await page.locator('html').getAttribute('lang'), 'ar');
    assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
    assert.equal(await page.locator('#secret').inputValue(), other);
  }],
  ['path key compatibility', {url:`/auth/${key}`}, async page => {
    assert.equal(await page.locator('#secret').inputValue(), key); await code(page, expected(key, 59));
  }]
];
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let failed = 0, passed = 0;
  try {
    for (const [name, engine] of [['Chromium',chromium],['WebKit',webkit]]) {
      const browser = await engine.launch({headless:true, ...(name === 'Chromium' && process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {})});
      try {
        for (const [label, options, run] of cases) {
          const context = await browser.newContext({ignoreHTTPSErrors:true, locale:'en-US'});
          try {
            await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
            const page = await context.newPage(), errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await harness(page, options);
            await page.goto(`https://127.0.0.1:${server.address().port}${options.url || '/auth/'}`);
            await run(page); assert.deepEqual(errors, []);
            passed++; console.log(`PASS ${name}: ${label}`);
          } catch (error) { failed++; console.error(`FAIL ${name}: ${label}: ${error.message.split('\n')[0]}`); }
          finally { await context.close(); }
        }
      } finally { await browser.close(); }
    }
    console.log(`Auth regressions: ${passed} passed, ${failed} failed; source=${process.env.AUTH_BASELINE_REF || 'working tree'}`);
    if (failed) process.exitCode = 1;
  } finally { await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error.message); process.exitCode = 1; server.close(); });
