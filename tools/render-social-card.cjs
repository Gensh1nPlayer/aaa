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
    assert(await page.evaluate(() => {
      const boxes=['.header','.headline','.support','.features','.footer'].map(selector=>document.querySelector(selector).getBoundingClientRect());
      const [header,headline,support,features,footer]=boxes;
      return boxes.every(b=>b.left>=0&&b.top>=0&&b.right<=1200&&b.bottom<=630)&&
        header.bottom<headline.top&&headline.right<support.left&&Math.max(headline.bottom,support.bottom)<features.top&&features.bottom<footer.top;
    }),'Preview sections overlap or escape the export frame');
    const output=process.env.SOCIAL_CARD_OUTPUT || path.join(__dirname,'../assets/og-social-v4.jpg');
    require('node:fs').mkdirSync(path.dirname(output),{recursive:true});
    await page.screenshot({path:output,type:'jpeg',quality:94});
    // Older shared URLs retain the new branding, without breaking old previews.
    if(!process.env.SOCIAL_CARD_OUTPUT)for(const name of ['og-social-v3.jpg','og-social-v2.jpg','og-social.jpg','og.jpg'])require('node:fs').copyFileSync(output,path.join(__dirname,'../assets',name));
    console.log(JSON.stringify({output,width:1200,height:630,allImagesLoaded:true,draft:Boolean(process.env.SOCIAL_CARD_OUTPUT)}));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
