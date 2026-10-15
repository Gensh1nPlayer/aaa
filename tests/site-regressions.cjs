const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const stock = JSON.parse(fs.readFileSync(path.join(root, 'accounts.json'), 'utf8'));
const valid = id => ({id,level:'68 - OW2',status:'In Stock',price:'$20',highlights:'Example account'});
let mode = 'stock';
const payloads = {
  stock,
  malformed: {accounts:[valid(183),null,[],{id:'bad'},valid(183),{...valid(999),price:{}},
    {id:{toString:null}},{...valid(999),nameChange:{}},{...valid(999),top500Eligible:{}},
    {...valid(185),futureMetadata:{toString:'not callable'}}]},
  empty: {accounts:[null,[]]},
  invalidDocument: {accounts:{not:'an array'}}
};
const server = http.createServer((req,res) => {
  const url = new URL(req.url,'http://localhost');
  if(url.pathname === '/accounts.json') {res.setHeader('Content-Type','application/json');res.end(JSON.stringify(payloads[mode]));return;}
  const file = path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()) {res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  for(const engine of [chromium,webkit]) {
    const browser=await engine.launch({headless:true,...(engine===chromium&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
    try {
      const context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'});
      await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      mode='malformed';
      await page.goto(base+'/?lang=en#accounts');
      await page.waitForFunction(()=>document.querySelectorAll('.account-card').length===2);
      assert.equal(await page.locator('#rdAvailableCount').textContent(),'2');
      assert.deepEqual(await page.locator('[data-copy-account]').evaluateAll(nodes=>nodes.map(node=>node.dataset.copyAccount)),['183','185']);
      mode='empty';await page.reload();
      await page.locator('.accounts-empty').waitFor();
      assert.equal(await page.locator('#rdAvailableCount').textContent(),'0');
      assert.match(await page.locator('.accounts-empty').textContent(),/No accounts match/);
      mode='invalidDocument';await page.reload();
      await page.locator('.accounts-empty').waitFor();
      assert.match(await page.locator('.accounts-empty').textContent(),/Unable to load/);

      mode='stock';
      await page.goto(base+'/?lang=en&case=preserve#accounts');
      await page.locator('.account-card').first().waitFor();
      await page.locator('#accountStatusFilter').selectOption('all',{force:true});
      await page.waitForFunction(count=>document.querySelectorAll('.account-card').length===count,stock.accounts.length);
      await page.locator('.account-card a[href$="#185"]').waitFor();
      // DOM identity is a deterministic regression oracle for cached card formatting.
      assert(await page.evaluate(()=>{const before=[...document.querySelectorAll('.account-card')];window.renderAccounts();return before.every((node,index)=>node===document.querySelectorAll('.account-card')[index]);}),'Unchanged accounts must reuse cards instead of reformatting all names');
      await page.locator('#accountSearch').fill('#185');
      assert.equal(await page.locator('.account-card').count(),1);
      assert.equal(await page.locator('[data-copy-account]').getAttribute('data-copy-account'),'185');
      await page.locator('#accountSearch').fill('');
      assert.equal(await page.locator('.account-card').count(),stock.accounts.length);
      const times=await page.evaluate(()=>Array.from({length:3},()=>{const start=performance.now();renderAccounts();return +(performance.now()-start).toFixed(1);}));

      await page.locator('#langSelect').selectOption('fr',{force:true});
      assert.equal(new URL(page.url()).searchParams.get('lang'),'fr');
      assert.equal(new URL(page.url()).searchParams.get('case'),'preserve');
      assert.equal(new URL(page.url()).hash,'#accounts');
      await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'fr');

      const contrast=await page.locator('.rd-offer-card small,.rd-story-note small,.rd-hero-stats dd,.rd-key-prices small,.rd-currency-card-head small,.rd-delivery-note span,.rd-currency-notice li,.rd-story-timeline time,.accounts-results,.rd-payment-method span').evaluateAll(nodes=>{
        const luminance=rgb=>rgb.map(value=>{const c=value/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,c,index)=>sum+c*[.2126,.7152,.0722][index],0);
        // #29233e is brighter than these panels outside decorative highlights.
        const background=luminance([41,35,62]);
        return nodes.map(node=>({text:node.textContent,ratio:(luminance(getComputedStyle(node).color.match(/[\d.]+/g).slice(0,3).map(Number))+.05)/(background+.05)}));
      });
      assert(contrast.length>5);assert(contrast.every(item=>item.ratio>=4.5),JSON.stringify(contrast));

      const blocked=await context.newPage(),storageErrors=[];
      blocked.on('pageerror',error=>storageErrors.push(error.message));
      await blocked.addInitScript(()=>{Storage.prototype.getItem=Storage.prototype.setItem=function(){throw new DOMException('Blocked storage','SecurityError');};});
      await blocked.goto(base+'/');await blocked.locator('.account-card').first().waitFor();
      await blocked.locator('#languageTrigger').click();
      assert(await blocked.locator('#languageMenu').isVisible());
      await blocked.locator('[data-language-value="de"]').click();
      assert.equal(await blocked.locator('html').getAttribute('lang'),'de');
      assert((await blocked.locator('.accounts-select-option').count())>0);
      assert.deepEqual(storageErrors,[]);assert.deepEqual(errors,[]);
      console.log(JSON.stringify({engine:engine===chromium?'Chromium':'WebKit',invalidRowsIsolated:true,stableIds:true,cachedCards:true,renderMs:times,languageReload:true,storageFailureSafe:true,labelContrast:true,pageErrors:errors}));
    } finally {await browser.close();}
  }
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
