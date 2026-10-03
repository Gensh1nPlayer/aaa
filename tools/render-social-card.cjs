const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({
    headless:true,
    ...(process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {})
  });
  try {
    const page = await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
    await page.goto(pathToFileURL(path.join(__dirname,'social-card.html')).href);
    await page.evaluate(() => document.fonts.ready);
    assert(await page.evaluate(() => [...document.images].every(img => img.complete && img.naturalWidth > 0)), 'Missing image');
    assert(await page.evaluate(() => document.documentElement.scrollWidth === 1200 && document.documentElement.scrollHeight === 630));
    await page.screenshot({path:path.join(__dirname,'../assets/og-social-v2.jpg'),type:'jpeg',quality:94});
    console.log('Rendered 1200 × 630 JPEG, all hero images loaded.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
