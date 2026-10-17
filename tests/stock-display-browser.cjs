'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const rows = [
  {id:9,level:'111 - OW2',price:'$40',status:'In Stock'},
  {id:4,level:'1 + 222 - OW1 Silver Border Stacked Account',price:'$10',status:'In Stock'},
  {id:2,level:'111 - OW1',price:'$30',status:'In Stock'}
];
const server = http.createServer((req,res)=>{
  const name = new URL(req.url,'http://localhost').pathname;
  if(name==='/accounts.json') {
    res.setHeader('Content-Type','application/json');
    res.setHeader('Last-Modified','Wed, 01 Jan 2020 12:34:56 GMT');
    res.end(JSON.stringify({accounts:rows}));return;
  }
  if(name==='/account_details.json'){res.setHeader('Content-Type','application/json');res.end('{"schemaVersion":2,"accounts":{}}');return;}
  const file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  for(const engine of [chromium,webkit]){
    const browser=await engine.launch({headless:true,...(engine===chromium&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
    try{
      const context=await browser.newContext({locale:'en-US',viewport:{width:1440,height:960},reducedMotion:'reduce'});
      let fail=false;
      await context.route('**/*',route=>{
        const url=route.request().url();
        if(url.startsWith(base))return route.continue();
        if(url.startsWith('https://api.frankfurter.dev/'))return fail?route.fulfill({status:503,body:'{}'}):route.fulfill({contentType:'application/json',body:JSON.stringify(Object.entries({EUR:.9,GBP:.8,CAD:1.4,AUD:1.5,AED:3.67,KRW:1300,JPY:150,CNY:7.2}).map(([quote,rate])=>({base:'USD',quote,rate,date:new Date().toISOString().slice(0,10)})))});
        return route.abort();
      });
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+'/?lang=en#accounts');
      await page.waitForFunction(()=>document.querySelectorAll('.account-card').length===3);
      assert.equal(await page.locator('#accountSort').inputValue(),'price-asc');
      assert.deepEqual(await page.locator('[data-copy-account]').evaluateAll(nodes=>nodes.map(node=>node.dataset.copyAccount)),['4','2','9']);
      assert.match(await page.locator('.account-card').first().locator('.ac-level-title').textContent(),/Lv\. 1 \+ 222/);
      assert.equal(await page.locator('[data-account-keyword="Fresh Rank Ready"]').count(),0);
      assert.equal(await page.locator('#accountsLastUpdatedValue').getAttribute('datetime'),'2020-01-01T12:34:56Z');
      assert.match(await page.locator('#accountsLastUpdatedValue').textContent(),/UTC/);
      assert.deepEqual(await page.locator('.header-actions').evaluate(node=>[...node.children].map(child=>child.id)),['authBtn','currencyPicker','languagePicker','themeToggle']);
      await page.locator('#currencyTrigger').click();
      assert.equal(await page.locator('[data-currency-value]').count(),9);
      await page.locator('[data-currency-value="EUR"]').click();
      await page.waitForFunction(()=>RoshineCurrency.code==='EUR');
      assert.equal(await page.locator('.ac-price').first().textContent(),'€9.2');
      assert.match(await page.locator('#rdPriceRange').textContent(),/€9\.2.*€36\.9/);
      assert.match(await page.locator('#accountPriceFilter option[value="under30"]').textContent(),/€27\.7/);
      await page.locator('#langSelect').selectOption('fr',{force:true});
      assert.match(await page.locator('#accountPriceFilter option[value="under30"]').textContent(),/€27\.7/);
      await page.reload();
      await page.waitForFunction(()=>RoshineCurrency.code==='EUR');
      assert.equal(await page.locator('.ac-price').first().textContent(),'€9.2');
      if(process.env.SCREENSHOT_DIR){
        fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});
        await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'stock-currency-'+(engine===chromium?'chromium':'webkit')+'.png')});
      }
      for(const width of [1180,1024,768,390,320]){
        await page.setViewportSize({width,height:900});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow at '+width);
        const boxes=await page.locator('.header-actions').evaluate(node=>[...node.children].filter(child=>getComputedStyle(child).display!=='none').map(child=>{const b=child.getBoundingClientRect();return {left:b.left,right:b.right};}));
        assert(boxes.every(box=>box.left>=0&&box.right<=width+1),'header controls outside viewport at '+width+': '+JSON.stringify({boxes,metrics:await page.locator('.header').evaluate(n=>({grid:getComputedStyle(n).gridTemplateColumns,children:[...n.children].map(c=>({class:c.className,width:c.getBoundingClientRect().width,display:getComputedStyle(c).display,order:getComputedStyle(c).order}))}))}));
      }
      await page.setViewportSize({width:1440,height:960});
      fail=true;await page.reload();
      await page.waitForFunction(()=>RoshineCurrency.status==='error');
      assert.equal(await page.locator('#currencyTriggerValue').textContent(),'USD');
      assert.equal(await page.locator('.ac-price').first().textContent(),'$10.0');
      assert.match(await page.locator('#currencyTrigger').getAttribute('title'),/Showing USD/);
      fail=false;
      await page.locator('#currencyTrigger').click();await page.locator('[data-currency-value="EUR"]').click();
      await page.waitForFunction(()=>RoshineCurrency.code==='EUR');
      assert.equal(await page.locator('.ac-price').first().textContent(),'€9.2');
      assert.deepEqual(errors,[]);
      console.log((engine===chromium?'Chromium':'WebKit')+': sorted stable IDs, compound level, UTC file date, nine currencies, saved choice, failure/retry, translated filters, responsive header passed');
      await context.close();
    }finally{await browser.close();}
  }
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
