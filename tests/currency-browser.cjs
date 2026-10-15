'use strict';
// Uses existing Playwright only. No installs, no public page edits, no real API traffic.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium,webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname,'..');
const fixture = `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/assets/main.css"><link rel="stylesheet" href="/assets/site-shell.css"><link rel="stylesheet" href="/assets/currency.css">
<script defer src="/assets/currency.js"></script></head><body>
<header class="header"><a class="brand"><img alt="" width="38" height="38"><span class="name">ROSHINE.</span></a>
<nav class="nav"><a>Home</a><a>Accounts</a><a>Services</a></nav><button class="mobile-menu-toggle">☰</button>
<div class="header-actions"><div class="language-picker"><button class="language-trigger">EN<span class="language-chevron"></span></button></div><div id="currencyPicker">
<button id="currencyTrigger" class="language-trigger"><span id="currencyTriggerValue">USD</span><span class="language-chevron" aria-hidden="true"></span></button>
<div id="currencyMenu" hidden></div></div></div></header><button id="after" style="margin-top:100px">After</button><output id="price"></output>
<script>window.changes=[];document.addEventListener('roshine:currency-changed',e=>{
changes.push(e.detail);const f=RoshineCurrency.format;document.getElementById('price').textContent=f(10);
});</script></body></html>`;
const server=http.createServer((req,res)=>{
  if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}
  const name=req.url.slice(1);
  if(!['assets/main.css','assets/site-shell.css','assets/currency.css','assets/currency.js'].includes(name)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',name.endsWith('.css')?'text/css':'text/javascript');res.end(fs.readFileSync(path.join(root,name)));
});
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  for(const engine of [chromium,webkit]){
    const browser=await engine.launch({headless:true,...(engine===chromium && process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
    try{
      for(const width of [1440,320]){
        const context=await browser.newContext({viewport:{width,height:800},locale:'en-GB'});
        const page=await context.newPage(),errors=[],requests=[];let fail=true;
        page.on('pageerror',e=>errors.push(e.message));
        await page.clock.install({time:new Date('2026-10-16T12:00:00Z')});
        await context.route('**/*',async route=>{
          const url=route.request().url();if(url.startsWith(base))return route.continue();
          requests.push(url);
          if(url.includes('api.frankfurter.dev'))return route.fulfill(fail?{status:503,body:'offline'}:{json:[{base:'USD',quote:'GBP',rate:0.8,date:'2026-10-16'},{base:'USD',quote:'JPY',rate:150,date:'2026-10-16'}]});
          return route.abort();
        });
        await page.goto(base);await page.waitForFunction(()=>RoshineCurrency.status==='error');
        assert.equal(await page.locator('#currencyTriggerValue').innerText(),'USD');assert.equal(await page.locator('#price').innerText(),'$10.0');
        assert.match(await page.locator('#currencyStatus').innerText(),/Requested GBP\. Showing USD/);
        assert.equal(await page.locator('#currencyStatus').getAttribute('role'),'status');
        assert.equal(await page.locator('#currencyTrigger').evaluate(el=>getComputedStyle(el).borderRadius),'999px');
        if(width===320){assert.equal(await page.locator('#currencyTrigger').evaluate(el=>el.getBoundingClientRect().width),62);assert.equal(await page.locator('.brand .name').isVisible(),false);}
        const headerFit=await page.locator('.header').evaluate(el=>{const bounds=el.getBoundingClientRect();return [...el.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width && !b.closest('[hidden]')).every(b=>{const r=b.getBoundingClientRect();return r.left>=bounds.left && r.right<=bounds.right;});});assert(headerFit,'header controls fit');
        assert.equal(requests.some(url=>url.includes('ipapi')),false);
        // Repeated initialization must not duplicate listeners or menu options.
        fail=false;await page.evaluate(()=>Promise.all([RoshineCurrency.init(),RoshineCurrency.init()]));
        await page.waitForFunction(()=>RoshineCurrency.code==='GBP');assert.equal(await page.locator('#price').innerText(),'£8.0');
        const trigger=page.locator('#currencyTrigger'), menu=page.locator('#currencyMenu');
        await trigger.focus();await page.keyboard.press('ArrowDown');assert(await menu.isVisible());
        assert.equal(await menu.locator('[role=option]').count(),9);
        assert.equal(await page.evaluate(()=>document.activeElement.dataset.currencyValue),'GBP');
        await page.keyboard.press('End');assert.equal(await page.evaluate(()=>document.activeElement.dataset.currencyValue),'CNY');
        await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.dataset.currencyValue),'USD');
        await page.keyboard.press('j');await page.keyboard.press('Enter');
        await page.waitForFunction(()=>RoshineCurrency.code==='JPY');assert.equal(await page.locator('#price').innerText(),'¥1,500.0');
        assert.equal(await trigger.getAttribute('aria-expanded'),'false');assert.equal(await page.evaluate(()=>document.activeElement.id),'currencyTrigger');
        assert.equal(await page.evaluate(()=>localStorage.getItem('roshine.currency')),'JPY');
        await trigger.click();await page.keyboard.press('Escape');assert(!(await menu.isVisible()));
        await trigger.click();await page.keyboard.press('Tab');assert(!(await menu.isVisible()));
        assert.equal(await page.evaluate(()=>document.activeElement.id),'after');
        await trigger.click();await page.locator('#after').click();assert(!(await menu.isVisible()));
        for(const dir of ['ltr','rtl']){
          await page.evaluate(dir=>document.documentElement.dir=dir,dir);await trigger.click();
          const box=await menu.boundingBox();assert(box.x>=0 && box.x+box.width<=width,`${width} ${dir} menu within viewport`);
          const selected=menu.locator('[aria-selected="true"]');assert.equal(await selected.count(),1);assert.equal(await selected.innerText(),'JPY');
          assert.notEqual(await selected.evaluate(el=>getComputedStyle(el).backgroundImage),'none');
          await page.keyboard.press('Escape');
        }
        // Expiry triggers rerender and makes both label and price USD.
        await page.clock.fastForward(3600001);await page.waitForFunction(()=>RoshineCurrency.status==='stale');
        assert.equal(await page.locator('#price').innerText(),'$10.0');assert.equal(await page.locator('#currencyTriggerValue').innerText(),'USD');
        assert.match(await page.locator('#currencyStatus').innerText(),/Requested JPY\. Showing USD/);
        await page.evaluate(()=>RoshineCurrency.select('JPY'));assert.equal(await page.locator('#price').innerText(),'¥1,500.0');
        assert.deepEqual(errors,[]);console.log(JSON.stringify({engine:engine.name(),width,autoInit:true,keyboard:true,rtl:true,fallback:true,expiry:true,externalIPRequests:0,pageErrors:errors}));
        await context.close();
      }
    }finally{await browser.close();}
  }
}
run().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
