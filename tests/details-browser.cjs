const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const vm = require('node:vm');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const inventory = JSON.parse(fs.readFileSync(path.join(root,'accounts.json'),'utf8')).accounts;
const available = inventory.filter(a => /in\s*stock/i.test(a.status));
assert(available.length > 1);
const id = String(available[0].id), oldId = String(available[1].id);
const catalogContext = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'acc_details/catalog.js'),'utf8'),catalogContext);
const known = catalogContext.window.HERO_GALLERY_CATALOG.find(s => s.id === 'D.Va/ACADEMY');
assert(known);
const snapshot = {
  accountId:id, accountLabel:'Account #'+id, inventoryStatus:'complete', capturedAt:'2026-10-13T12:00:00Z',
  balances:{mythicPrisms:80,overwatchCoins:800,credits:20000,competitivePoints:3000,legacyCompetitivePoints:null},
  ownedSkinIds:[known.id,'Genji/FUTURE_SKIN'],ownedWeaponSkinIds:['weapon/Reaper/Hard_Light','weapon/Genji/FUTURE_WEAPON'],
  ownedWeaponVariants:[{hero:'D.Va',name:'Golden'}],
  uncataloguedOwnedItems:[{hero:'Mauga',category:'skins',name:'<img src=x onerror=alert(1)>'}],
  competitive:{ranks:{tank:'Gold 3',damage:'Placement 2/10'}},
  profile:{accountLevel:669,endorsementLevel:5,timePlayedHours:1325,gamesPlayed:10,gamesWon:6,
    roleStats:{tank:{timePlayedHours:2,gamesWon:1}},heroesPlayed:[{hero:'Ana',level:44,timePlayedHours:120}]}
};
let mode = 'ready';
const manifest = {schemaVersion:2,accounts:{[id]:{file:'acc_details/data/'+id+'.json'}}};
const server = http.createServer((req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  res.setHeader('Content-Type','application/json');
  if (pathname === '/account_details.json') {
    if (mode === 'unavailable') {res.writeHead(503);res.end('{}');return;}
    res.end(JSON.stringify(mode === 'inline' ? {schemaVersion:1,accounts:{[id]:snapshot}} : mode === 'badPath' ? {schemaVersion:2,accounts:{[id]:{file:'../private.json'}}} : manifest));return;
  }
  if (pathname === '/acc_details/data/'+id+'.json') {
    res.end(JSON.stringify({...snapshot,...(mode === 'mismatch' ? {accountId:oldId} : {})}));return;
  }
  if (pathname === '/acc_details') {res.writeHead(301,{Location:'/acc_details/'});res.end();return;}
  const file = path.resolve(root,'.'+(pathname.endsWith('/') ? pathname+'index.html' : pathname));
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = 'http://127.0.0.1:'+server.address().port;
  for (const scenario of [{engine:chromium,name:'Chromium desktop',viewport:{width:1440,height:960}},
    {engine:webkit,name:'WebKit mobile / legacy dialog',viewport:{width:414,height:896},legacy:true}]) {
    const browser = await scenario.engine.launch({headless:true,...(scenario.engine === chromium && process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE}: {})});
    try {
      const context = await browser.newContext({viewport:scenario.viewport,reducedMotion:'reduce'});
      await context.route('**/*',route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
      if (scenario.legacy) await context.addInitScript(() => {
        Array.prototype.at=undefined;Object.hasOwn=undefined;window.structuredClone=undefined;
        if (window.HTMLDialogElement) {HTMLDialogElement.prototype.showModal=undefined;HTMLDialogElement.prototype.close=undefined;}
      });
      const errors=[];
      const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
      mode='ready';
      await page.goto(base+'/?lang=en&case=initial#accounts');
      const newLink=page.locator('.account-card a[href*="/acc_details/"]').first();
      await newLink.waitFor();
      assert.equal(await page.locator('.account-card').count(),available.length);
      assert.match(await newLink.textContent(),/View Details/);
      assert.equal(await page.locator('.account-card a[href="'+available[1].screenshot+'"]').count(),1,'Old screenshot must remain unchanged');
      const [details]=await Promise.all([page.waitForEvent('popup'),newLink.click()]);
      details.on('pageerror',e=>errors.push(e.message));
      await details.waitForFunction(()=>document.body.classList.contains('has-account'));
      assert.equal(new URL(details.url()).hash,'#'+id);
      assert.equal(await details.locator('.skin-card').count(),3,'Unknown IDs retained as no-image cards');
      assert.equal(await details.locator('#skinGrid img[src="x"]').count(),0,'Untrusted labels cannot create markup');
      assert.equal(await details.locator('#tabWeaponCount').textContent(),'2');
      assert.match(await details.locator('#pageEyebrow').textContent(),/Complete record/);
      assert.equal(await details.locator('[data-balance="legacyCompetitivePoints"]').textContent(),'—');
      await details.locator('button.skin-card').first().click();
      assert(await details.locator('#skinDialog').isVisible());
      if (scenario.legacy) assert(await details.locator('#skinDialog').evaluate(n=>n.classList.contains('legacy-dialog')));
      await details.keyboard.press('Escape');
      assert(!(await details.locator('#skinDialog').isVisible()));
      assert.equal(await details.locator('button.skin-card').first().evaluate(n=>document.activeElement===n),true);
      for (const lang of ['en','fr','de','ar','ja']) {
        await details.goto(base+'/acc_details/?lang='+lang+'#'+id);
        await details.waitForFunction(()=>document.body.classList.contains('has-account'));
        assert.equal(await details.locator('html').getAttribute('lang'),lang);
        assert.equal(await details.locator('html').getAttribute('dir'),lang==='ar'?'rtl':'ltr');
        assert(await details.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),lang+' overflow');
        for (const tab of ['weapons','variants','overview','statistics','competitive','skins']) {
          await details.locator('[data-tab="'+tab+'"]').click();
          assert(await details.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),lang+' '+tab+' overflow');
        }
        assert.equal(await details.locator('#tabSkinCount').textContent(),new Intl.NumberFormat(lang).format(3));
      }
      await details.locator('#languageTrigger').click();
      await details.locator('[data-language-value="fr"]').click();
      assert.equal(new URL(details.url()).hash,'#'+id,'Language switch retains account');
      assert.equal(await details.locator('html').getAttribute('lang'),'fr');
      assert.equal(await details.locator('#lookupTitle').textContent(),'Découvrez chaque détail.');
      await details.locator('#accountLookupId').fill('9999999999');
      await details.locator('#accountLookupForm button').click();
      await details.waitForFunction(()=>document.getElementById('accountLookupStatus').classList.contains('error'));
      assert(!(await details.locator('.site-shell').isVisible()),'No other account shown when ID absent');
      for (const broken of ['mismatch','badPath','unavailable']) {
        mode=broken;
        await details.goto(base+'/acc_details/?lang=en&case='+broken+'#'+id);
        await details.waitForFunction(()=>document.getElementById('accountLookupStatus').classList.contains('error'));
        assert(!(await details.locator('.site-shell').isVisible()),broken);
      }
      mode='inline';
      await details.goto(base+'/acc_details/?lang=en&case=inline#'+id);
      await details.waitForFunction(()=>document.body.classList.contains('has-account'));
      assert.equal(await details.locator('.skin-card').count(),3,'Legacy inline document supported');
      mode='unavailable';
      await page.goto(base+'/?lang=en&case=unavailable#accounts');
      await page.locator('.account-card').first().waitFor();
      assert.equal(await page.locator('.account-card').count(),available.length,'Index failure must not break stock');
      assert.equal(await page.locator('.account-card a[href*="/acc_details/"]').count(),0);
      mode='ready';
      await details.goto(base+'/acc_details/?lang=en&case=ready#'+id);
      await details.waitForFunction(()=>document.body.classList.contains('has-account'));
      if (scenario.legacy) {
        for (const width of [320,390,414]) {
          await details.setViewportSize({width,height:896});
          assert(await details.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'width '+width);
          await details.locator('#mobileMenuToggle').click();
          assert.equal(await details.locator('#mobileNav').getAttribute('data-open'),'true');
          await details.locator('#mobileMenuToggle').click();
        }
      }
      if (process.env.SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});
        await details.screenshot({path:path.join(process.env.SCREENSHOT_DIR,scenario.legacy?'details-mobile.png':'details-desktop.png'),fullPage:true});
      }
      assert.deepEqual(errors,[]);
      console.log(JSON.stringify({scenario:scenario.name,languages:5,stock:inventory.length,available:available.length,legacyScreenshot:true,pageErrors:errors}));
    } finally {await browser.close();}
  }
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
