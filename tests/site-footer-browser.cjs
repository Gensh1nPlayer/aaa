'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), https = require('node:https');
const {chromium,webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname,'..');
const pages = ['/', '/acc_details/', '/auth/', '/privacy/', '/terms/', '/404.html'];
// Authenticator upgrades insecure subresources: exercise it under real HTTPS.
const server = https.createServer({key:fs.readFileSync(process.env.TEST_TLS_KEY),cert:fs.readFileSync(process.env.TEST_TLS_CERT)},(req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  const file = path.resolve(root,'.'+(pathname.endsWith('/') ? pathname+'index.html' : pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.ico':'image/x-icon','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='https://127.0.0.1:'+server.address().port;
  try {
    for(const [engine,width] of [[chromium,1440],[webkit,390]]) {
      const browser=await engine.launch({headless:true,...(engine===chromium&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
      try {
        const context=await browser.newContext({viewport:{width,height:960},reducedMotion:'reduce',ignoreHTTPSErrors:true});
        await context.route('**/*',route=>{
          const host=new URL(route.request().url()).hostname;
          if(host==='127.0.0.1')return route.continue();
          if(host==='api.frankfurter.dev')return route.fulfill({json:[{base:'USD',quote:'EUR',rate:.9,date:new Date().toISOString().slice(0,10)}]});
          return route.abort();
        });
        const page=await context.newPage(), errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        async function chooseLanguage(lang){
          const trigger=page.locator('#languageTrigger');
          await trigger.focus();await trigger.press('ArrowDown');
          // Authenticator focuses its selected option on the next animation frame.
          await page.waitForFunction(()=>document.activeElement.closest('#languageMenu'));
          await page.locator('[data-language-value="'+lang+'"]').click();
        }
        for(const url of pages) {
          console.log('Checking '+(engine===chromium?'Chromium':'WebKit')+' '+url);
          await page.goto(base+url+'?lang=en');
          const footer=page.locator('.roshine-footer');
          if(process.env.FOOTER_SCREENSHOT_DIR&&url!=='/404.html'){
            fs.mkdirSync(process.env.FOOTER_SCREENSHOT_DIR,{recursive:true});
            await page.locator('.header').screenshot({path:path.join(process.env.FOOTER_SCREENSHOT_DIR,(url==='/'?'home':url.split('/')[1])+'-header-'+width+'.png')});
          }
          await footer.scrollIntoViewIfNeeded();
          assert.equal(await footer.count(),1,url+' one shared footer');
          const logoImages=page.locator('img.brand-lockup,img.rf-wordmark,img.panel-title-logo');
          for(const logo of await logoImages.all()) {
            if(!await logo.isVisible()) continue;
            await logo.scrollIntoViewIfNeeded();
            await logo.evaluate(img=>img.complete&&img.naturalWidth?Promise.resolve():new Promise((resolve,reject)=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',()=>reject(new Error(img.src)),{once:true});}));
            assert(await logo.evaluate(img=>img.naturalWidth>0),'new vector brand asset loads');
          }
          assert.equal(await page.locator('link[rel="apple-touch-icon"]').count(),1);
          assert.equal(await page.locator('link[rel="manifest"]').count(),1);
          assert.equal(await footer.locator('.rf-group').count(),4);
          assert.equal(await footer.locator('.rf-links a').count(),12);
          if(url==='/'){
            assert.equal(await page.locator('#accountsUpdateNote').count(),0,'planned countdown removed');
            assert.equal(await page.locator('#accountsLastUpdatedValue').count(),1,'actual inventory timestamp retained');
          }
          assert(await footer.isVisible());
          assert(await footer.evaluate(node=>node.parentElement===document.body),'footer is outside all content cards/grids');
          if(url!=='/404.html'){
            assert.equal(await page.locator('#languageTrigger .language-globe').count(),1,'language globe on '+url);
            await page.locator('#languageTrigger').click();
            assert.equal(await page.locator('#languageTrigger').getAttribute('aria-expanded'),'true');
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#currencyTrigger .language-globe').count(),0,'currency button remains unchanged');
          }
          for(const lang of ['en','fr','de','ar','ja','zh']) {
            if(url==='/404.html')await page.evaluate(lang=>{document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';},lang);
            else {
              await chooseLanguage(lang);
            }
            try {await page.waitForFunction(lang=>document.querySelector('.rf-group h2').textContent===({en:'Explore',fr:'Découvrir',de:'Entdecken',ar:'استكشف',ja:'ストア',zh:'探索'})[lang],lang);}
            catch(error){throw new Error(url+' '+lang+': '+await page.locator('.rf-group h2').first().textContent()+' / '+error.message);}
            assert.equal(await footer.locator('[data-rf="stock"]').getAttribute('href'),lang==='en'?'/#accounts':'/?lang='+lang+'#accounts');
            assert.equal(await footer.locator('[data-rf="details"]').getAttribute('href'),lang==='en'?'/acc_details/':'/acc_details/?lang='+lang);
            assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow: '+url+' '+lang);
            const box=await footer.boundingBox();assert(box.width<=width+1,'footer fits viewport');
          }
          if(url!=='/404.html'){
            await chooseLanguage('en');
          }else await page.evaluate(()=>{document.documentElement.lang='en';document.documentElement.dir='ltr';});
          await page.locator('.rf-social a').last().focus();
          assert(await page.locator('.rf-social a').last().evaluate(node=>node===document.activeElement),'keyboard access');
          if(url==='/auth/')assert.equal(await page.locator('#footer').isVisible(),false,'no duplicate copyright in authenticator card');
          if(process.env.FOOTER_SCREENSHOT_DIR&&['/','/acc_details/','/auth/'].includes(url)){
            fs.mkdirSync(process.env.FOOTER_SCREENSHOT_DIR,{recursive:true});
            await footer.scrollIntoViewIfNeeded();
            await page.evaluate(()=>document.activeElement.blur());
            if(url!=='/auth/')await page.waitForFunction(()=>document.body.classList.contains('rf-footer-visible'));
            await footer.screenshot({path:path.join(process.env.FOOTER_SCREENSHOT_DIR,(url==='/'?'home':url.split('/')[1])+'-'+width+'.png')});
          }
        }
        // A language change through the actual picker also updates the shared footer.
        await page.goto(base+'/auth/?lang=en');
        await page.locator('#languageTrigger').click();
        await page.locator('[data-language-value="ja"]').click();
        await page.waitForFunction(()=>document.querySelector('.rf-group h2').textContent==='ストア');
        assert.equal(await page.locator('#languageTrigger .language-globe').count(),1,'globe survives locale change');
        await page.goto(base+'/?lang=en');
        assert.equal(await page.locator('#currencyTrigger .currency-icon').count(),1);
        await page.evaluate(()=>RoshineCurrency.select('EUR'));
        assert.equal(await page.evaluate(()=>RoshineCurrency.format(10)),'€9.2');
        assert(await page.locator('#currencyFeeNote').isVisible(),'non-USD fee disclosed visibly');
        assert.match(await page.locator('#currencyFeeNote').textContent(),/2.5%/);
        await page.evaluate(()=>RoshineCurrency.select('USD'));
        assert.equal(await page.evaluate(()=>RoshineCurrency.format(10)),'$10.0');
        assert.equal(await page.locator('#currencyFeeNote').isVisible(),true);
        assert.match(await page.locator('#currencyFeeNote').textContent(),/Crypto: no payment fee and 2.5% off/);
        assert.doesNotMatch(await page.locator('#currencyFeeNote').textContent(),/USD prices have|conversion fee|include a 2.5% payment fee/);
        assert(await page.locator('#faqList summary').first().evaluate(node=>parseFloat(getComputedStyle(node).fontSize)>=17),'FAQ question legibility');
        if(process.env.FOOTER_SCREENSHOT_DIR){
          await page.locator('#faqList summary').first().click();
          await page.locator('#faqList details').first().screenshot({path:path.join(process.env.FOOTER_SCREENSHOT_DIR,'faq-'+width+'.png')});
          const heading=page.locator('#accounts > .section-header');
          // Reveal content-visibility:auto before measuring the capture area.
          await heading.evaluate(node=>{node.scrollIntoView({block:'center'});return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
          await heading.scrollIntoViewIfNeeded();
          await heading.screenshot({path:path.join(process.env.FOOTER_SCREENSHOT_DIR,'inventory-heading-'+width+'.png')});
        }
        // Static HTML remains useful with JS disabled (no runtime fragment fetch).
        const plain=await browser.newPage({javaScriptEnabled:false,viewport:{width,height:960},ignoreHTTPSErrors:true});
        await plain.goto(base+'/acc_details/');assert.equal(await plain.locator('.roshine-footer .rf-group').count(),4);await plain.close();
        assert.deepEqual(errors,[]);
        console.log(JSON.stringify({engine:engine===chromium?'Chromium':'WebKit',width,pages:6,languages:6,staticFallback:true,languageGlobe:true,pageErrors:errors}));
      } finally { await browser.close(); }
    }
  } finally {server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
