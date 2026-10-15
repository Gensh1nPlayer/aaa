const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const vm = require('node:vm');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
// Fixed public-boundary fixtures, not assumptions about current stock order.
// #185 intentionally uses the new details method, with no screenshot required.
const inventory = [
  {id:183,level:'68 - OW2',status:'In Stock',price:'$20',screenshot:''},
  {id:185,level:'39 - OW2',status:'In Stock',price:'$30',screenshot:''},
  {id:456,level:'52 - OW2',status:'In Stock',price:'$40',screenshot:'https://example.invalid/legacy-screenshot'}
];
const available = inventory.filter(a => /in\s*stock/i.test(a.status));
assert(available.length > 1);
const id = String(available[0].id), oldId = String(available[1].id);
const catalogContext = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'acc_details/catalog.js'),'utf8'),catalogContext);
const known = catalogContext.window.HERO_GALLERY_CATALOG.find(s => s.id === 'D.Va/ACADEMY');
assert(known);
const snapshot = {
  accountId:id, accountLabel:'Account #'+id, accountVersion:'OW1', inventoryStatus:'complete', capturedAt:'2026-10-14T05:44:31.605241+08:00',
  balances:{mythicPrisms:80,overwatchCoins:800,credits:20000,competitivePoints:3000,legacyCompetitivePoints:null},
  ownedSkinIds:[known.id,'Genji/FUTURE_SKIN'],ownedWeaponSkinIds:['weapon/Reaper/Hard_Light','weapon/Genji/FUTURE_WEAPON'],
  ownedWeaponVariants:[{hero:'D.Va',name:'Golden'}],
  uncataloguedOwnedItems:[{hero:'Mauga',category:'skins',name:'<img src=x onerror=alert(1)>'}],
  competitive:{ranks:{tank:'Gold 3',damage:'Placement 2/10'}},
  profile:{accountLevel:669,endorsementLevel:5,timePlayedHours:1325,gamesPlayed:10,gamesWon:6,
    roleStats:{tank:{timePlayedHours:2,gamesWon:1}},heroesPlayed:[
      {hero:'Reaper',level:29,timePlayedHours:5},
      {hero:'Zenyatta',level:10,timePlayedHours:4},
      {hero:'Soldier 76',level:38,timePlayedHours:44},
      {hero:'D.Va',level:null,timePlayedHours:67},
      {hero:'Ana',level:44,timePlayedHours:null}
    ]}
};
let mode = 'ready';
const manifest = {schemaVersion:2,accounts:{[id]:{file:'acc_details/data/'+id+'.json'},185:{file:'acc_details/data/185.json'}}};
const server = http.createServer((req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  res.setHeader('Content-Type','application/json');
  if (pathname === '/accounts.json') {res.end(JSON.stringify({accounts:inventory}));return;}
  if (pathname === '/account_details.json') {
    if (mode === 'unavailable') {res.writeHead(503);res.end('{}');return;}
    res.end(JSON.stringify(mode === 'inline' ? {schemaVersion:1,accounts:{[id]:snapshot}} : mode === 'badPath' ? {schemaVersion:2,accounts:{[id]:{file:'../private.json'}}} : manifest));return;
  }
  if (pathname === '/acc_details/data/'+id+'.json') {
    const data={...snapshot,...(mode === 'mismatch' ? {accountId:oldId} : {})};
    if(mode==='missingWallet')data.balances={overwatchCoins:80,credits:1450};
    if(mode==='nullWallet')data.balances={mythicPrisms:null,competitivePoints:null,overwatchCoins:80,credits:1450};
    if(mode==='zeroWallet')data.balances={mythicPrisms:0,competitivePoints:0,overwatchCoins:80,credits:1450};
    if(mode==='absentWallet')delete data.balances;
    res.end(JSON.stringify(data));return;
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
      const context = await browser.newContext({viewport:scenario.viewport,reducedMotion:'reduce',timezoneId:scenario.legacy?'Asia/Shanghai':'America/Los_Angeles'});
      let imageMode='primary',imageRequests=[];
      const imageFixture=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jP90AAAAASUVORK5CYII=','base64');
      await context.route('**/*',route => {
        const url=new URL(route.request().url());
        if(url.hostname==='127.0.0.1')return route.continue();
        if(route.request().resourceType()==='image'&&(url.hostname==='raw.githubusercontent.com'&&url.pathname.includes('/ValentinZeller/overwatch_skins/')||url.hostname==='static.wikia.nocookie.net')) {
          imageRequests.push(url.href);
          return imageMode==='fallback'&&url.hostname==='raw.githubusercontent.com'?route.fulfill({status:404,body:''}):route.fulfill({status:200,contentType:'image/png',body:imageFixture});
        }
        return route.abort();
      });
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
      const mainBackground=await page.evaluate(()=>({color:getComputedStyle(document.body).backgroundColor,image:getComputedStyle(document.body).backgroundImage,glow:getComputedStyle(document.body,'::after').backgroundImage}));
      assert.equal(await page.locator('.account-card').count(),available.length);
      assert.match(await newLink.textContent(),/View Details/);
      assert.equal(await page.locator('.account-card a[href$="#185"]').count(),1,'#185 uses details without requiring a screenshot');
      assert.equal(await page.locator('.account-card a[href="'+inventory[2].screenshot+'"]').count(),1,'Legacy links remain supported without depending on real stock order');
      const [details]=await Promise.all([page.waitForEvent('popup'),newLink.click()]);
      details.on('pageerror',e=>errors.push(e.message));
      await details.waitForFunction(()=>document.body.classList.contains('has-account'));
      assert.equal(new URL(details.url()).hash,'#'+id);
      assert.equal(await details.locator('.tabs [data-tab]').first().getAttribute('data-tab'),'overview');
      assert.equal(await details.locator('.tab.active').getAttribute('data-tab'),'overview');
      assert(await details.locator('#accountPanel').isVisible());
      const mostPlayed=details.locator('.account-section').filter({has:details.locator('h2',{hasText:'Most played heroes'})});
      assert.deepEqual(await mostPlayed.locator('tbody tr td:first-child').allTextContents(),['D.Va','Soldier 76','Reaper'],'Overview uses descending known playtime, not input order');
      await details.locator('[data-tab="statistics"]').click();
      const heroStatistics=details.locator('.account-section').filter({has:details.locator('h2',{hasText:'Hero levels and playtime'})});
      assert.deepEqual(await heroStatistics.locator('tbody tr td:first-child').allTextContents(),snapshot.profile.heroesPlayed.map(hero=>hero.hero),'Overview must not mutate the recorded statistics order');
      await details.locator('[data-tab="overview"]').click();
      assert.equal(await details.locator('.account-summary').count(),0);
      assert.equal(await details.locator('#headerAccountId').count(),0);
      assert(await details.locator('#accountPanel #overviewBalances').isVisible());
      assert.equal(await details.locator('#overviewBalances .balance-item').count(),5);
      assert.equal(await details.locator('#accountLevel').evaluate(node=>getComputedStyle(node).fontSize),await details.locator('#accountLevelValue').evaluate(node=>getComputedStyle(node).fontSize));
      await details.locator('[data-tab="skins"]').click();
      assert(!(await details.locator('#overviewBalances').isVisible()));
      assert.equal(await details.locator('#sortFilter').inputValue(),'rarity');
      assert.equal(await details.locator('#accountVersion').textContent(),'OW1');
      assert.equal(await details.locator('.skin-card').count(),3,'Unknown IDs retained as no-image cards');
      assert.equal(await details.locator('#skinGrid img[src="x"]').count(),0,'Untrusted labels cannot create markup');
      assert.equal(await details.locator('#tabWeaponCount').textContent(),'2');
      assert.match(await details.locator('#pageEyebrow').textContent(),/Complete record/);
      assert.deepEqual(await details.evaluate(()=>({color:getComputedStyle(document.body).backgroundColor,image:getComputedStyle(document.body).backgroundImage,glow:getComputedStyle(document.body,'::after').backgroundImage})),mainBackground,'Detail page must share the main background');
      assert.equal(await details.locator('#void-starfield').count(),1,'Use the main starfield, not another effect');
      assert.equal(await details.locator('#snapshotNotice').count(),0,'Requested notice must be removed');
      assert.equal(await details.locator('.lookup-hero').evaluate(node=>getComputedStyle(node).borderTopWidth),'0px','Introduction must not be a card');
      assert.equal(await details.locator('.lookup-hero').evaluate(node=>getComputedStyle(node).backgroundImage),'none');
      assert.equal(await details.locator('.lookup-hero').evaluate(node=>getComputedStyle(node).boxShadow),'none');
      assert.notEqual(await details.locator('.lookup-form').evaluate(node=>getComputedStyle(node).borderTopWidth),'0px','Lookup form remains a card');
      assert.equal(await details.locator('#pageEyebrow time').textContent(),'2026-10-13 21:44:31 UTC');
      assert.equal(await details.locator('#pageEyebrow time').getAttribute('datetime'),'2026-10-13T21:44:31.605Z');
      assert.equal(await details.locator('[data-balance="legacyCompetitivePoints"]').textContent(),'—');
      assert.equal(await details.locator('[data-balance="mythicPrisms"]').textContent(),'80');
      assert.equal(await details.locator('[data-balance="competitivePoints"]').textContent(),'3,000');
      await details.waitForFunction(()=>document.querySelector('.skin-card img')?.naturalWidth>0);
      assert.match(await details.locator('.skin-card img').first().getAttribute('src'),/ValentinZeller\/overwatch_skins/,'GitHub artwork must be first');
      imageMode='fallback';imageRequests=[];
      await details.reload();await details.waitForFunction(()=>document.body.classList.contains('has-account'));
      await details.locator('[data-tab="skins"]').click();
      await details.waitForFunction(()=>document.querySelector('.skin-card img')?.naturalWidth>0);
      assert.match(await details.locator('.skin-card img').first().getAttribute('src'),/static\.wikia\.nocookie\.net/,'Fandom is attempted only after GitHub fails');
      assert(imageRequests.findIndex(url=>url.includes('static.wikia'))>imageRequests.findIndex(url=>url.includes('ValentinZeller')));
      assert(!(await details.locator('.skin-card .card-art').first().evaluate(node=>node.classList.contains('image-error'))));
      imageMode='primary';
      for(const walletCase of ['missingWallet','nullWallet','zeroWallet','absentWallet']) {
        mode=walletCase;
        await details.goto(base+'/acc_details/?lang=en&case='+walletCase+'#'+id);
        await details.waitForFunction(()=>document.body.classList.contains('has-account'));
        assert.equal(await details.locator('[data-balance="mythicPrisms"]').textContent(),'0',walletCase);
        assert.equal(await details.locator('[data-balance="competitivePoints"]').textContent(),'0',walletCase);
        assert.equal(await details.locator('[data-balance="overwatchCoins"]').textContent(),walletCase==='absentWallet'?'—':'80');
        assert.equal(await details.locator('[data-balance="credits"]').textContent(),walletCase==='absentWallet'?'—':'1,450');
        assert.equal(await details.locator('[data-balance="legacyCompetitivePoints"]').textContent(),'—');
      }
      mode='ready';
      await details.goto(base+'/acc_details/?lang=en&case=walletRestored#'+id);
      await details.waitForFunction(()=>document.body.classList.contains('has-account'));
      await details.locator('[data-tab="skins"]').click();
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
        assert.equal(await details.locator('#pageEyebrow time').textContent(),'2026-10-13 21:44:31 UTC',lang+' UTC timestamp must not follow browser locale/timezone');
        assert.equal(await details.locator('#pageEyebrow time').getAttribute('dir'),'ltr');
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
      await details.locator('[data-tab="skins"]').click();
      assert.equal(await details.locator('.skin-card').count(),3,'Legacy inline document supported');
      mode='unavailable';
      await page.goto(base+'/?lang=en&case=unavailable#accounts');
      await page.locator('.account-card').first().waitFor();
      assert.equal(await page.locator('.account-card').count(),available.length,'Index failure must not break stock');
      assert.equal(await page.locator('.account-card a[href*="/acc_details/"]').count(),0);
      mode='ready';
      await details.goto(base+'/acc_details/?lang=en&case=ready#'+id);
      await details.waitForFunction(()=>document.body.classList.contains('has-account'));
      const mythic=catalogContext.window.HERO_GALLERY_CATALOG.find(item=>item.rarity==='mythic');
      const rare=catalogContext.window.HERO_GALLERY_CATALOG.find(item=>item.rarity==='rare');
      await details.evaluate(input=>window.HeroGallery.loadSnapshot(input),{...snapshot,ownedSkinIds:[rare.id,known.id,mythic.id,'Genji/FUTURE_SKIN'],uncataloguedOwnedItems:[]});
      await details.locator('[data-tab="skins"]').click();
      assert.deepEqual(await details.locator('.skin-card').evaluateAll(nodes=>nodes.map(n=>n.dataset.rarity)),['mythic','legendary','rare','unknown']);
      await details.locator('#sortFilter').selectOption('name');await details.locator('#resetButton').click();
      assert.equal(await details.locator('#sortFilter').inputValue(),'rarity','Reset should restore the new default');
      assert.deepEqual(await details.locator('.skin-card').evaluateAll(nodes=>nodes.map(n=>n.dataset.rarity)),['mythic','legendary','rare','unknown']);
      await details.evaluate(input=>window.HeroGallery.loadSnapshot(input),snapshot);
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
