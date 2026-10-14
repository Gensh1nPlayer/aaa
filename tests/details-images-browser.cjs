'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const vm = require('node:vm');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const catalogContext = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'acc_details/catalog.js'),'utf8'), catalogContext);
const catalog = catalogContext.window.HERO_GALLERY_CATALOG;
const items = ['D.Va/ACADEMY','Ana/BASTET','Genji/BAIHU'].map(id => catalog.find(item => item.id === id));
assert(items.every(Boolean));
const accountId = '123';
const snapshot = {accountId,inventoryStatus:'complete',ownedSkinIds:items.map(item => item.id)};
const primary = url => url.hostname === 'raw.githubusercontent.com' && url.pathname.includes('/ValentinZeller/overwatch_skins/');
const thumbnail = url => /_web\.webp$/.test(url.pathname) || url.pathname.includes('/scale-to-width-down/');
const fixture = (width,height) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#244468"/><path d="M0 0L${width} ${height}M${width} 0L0 ${height}" stroke="#49d7f6" stroke-width="6"/></svg>`;
const server = http.createServer((req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  if (pathname === '/account_details.json') {
    res.setHeader('Content-Type','application/json');
    res.end(JSON.stringify({schemaVersion:1,accounts:{[accountId]:snapshot}}));return;
  }
  if (pathname === '/acc_details/catalog.js') {
    res.setHeader('Content-Type','text/javascript');
    res.end('window.HERO_GALLERY_CATALOG='+JSON.stringify(items)+';');return;
  }
  const file = path.resolve(root,'.'+(pathname.endsWith('/') ? pathname+'index.html' : pathname));
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});

async function waitImage(locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.page().waitForFunction(image => image.complete && image.naturalWidth > 0,await locator.elementHandle());
}

async function assertFilledCard(image) {
  const geometry=await image.evaluate(image=>{
    const img=image.getBoundingClientRect(),box=image.closest('.card-art').getBoundingClientRect(),style=getComputedStyle(image);
    return {fit:style.objectFit,position:style.objectPosition,image:{width:img.width,height:img.height,x:img.x,y:img.y},box:{width:box.width,height:box.height,x:box.x,y:box.y}};
  });
  assert.equal(geometry.fit,'cover','card artwork must fill the frame proportionally, without letterboxing');
  assert.equal(geometry.position,'50% 50%','keep the character centered');
  for(const key of ['width','height','x','y'])assert(Math.abs(geometry.image[key]-geometry.box[key])<1,'card artwork must occupy the full frame: '+key);
}

async function assertNaturalDialog(image) {
  const geometry=await image.evaluate(image=>{
    const img=image.getBoundingClientRect(),box=image.parentElement.getBoundingClientRect(),close=document.getElementById('closeDialog').getBoundingClientRect();
    return {ratio:img.width/img.height,natural:image.naturalWidth/image.naturalHeight,image:{width:img.width,height:img.height,x:img.x,y:img.y},box:{width:box.width,height:box.height,x:box.x,y:box.y},closeTop:close.top,closeBottom:close.bottom};
  });
  assert(Math.abs(geometry.ratio-geometry.natural)<.01,'large artwork must retain its original proportions without cropping or stretching');
  for(const key of ['width','height','x','y'])assert(Math.abs(geometry.image[key]-geometry.box[key])<1,'no empty bars in the large image area: '+key);
  assert(geometry.closeTop>=geometry.box.y&&geometry.closeBottom<=geometry.box.y+geometry.box.height,'close button overlays the image, not an empty header');
  const viewport=await image.page().evaluate(()=>({width:innerWidth,height:innerHeight}));
  const dialog=await image.page().locator('#skinDialog').boundingBox();
  assert(dialog.x>=0&&dialog.y>=0&&dialog.x+dialog.width<=viewport.width+1&&dialog.y+dialog.height<=viewport.height+1,'large viewer stays within the current viewport');
}

(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = 'http://127.0.0.1:'+server.address().port;
  for (const scenario of [
    {engine:chromium,name:'Chromium desktop',viewport:{width:1440,height:960},deviceScaleFactor:1},
    {engine:webkit,name:'WebKit mobile / legacy dialog',viewport:{width:390,height:844},deviceScaleFactor:3,legacy:true}
  ]) {
    const browser = await scenario.engine.launch({headless:true,...(scenario.engine === chromium && process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE}: {})});
    try {
      const context = await browser.newContext({viewport:scenario.viewport,deviceScaleFactor:scenario.deviceScaleFactor,reducedMotion:'reduce'});
      let mode='primary', requests=[];
      await context.route('**/*',route => {
        const url = new URL(route.request().url());
        if (url.hostname === '127.0.0.1') return route.continue();
        if (route.request().resourceType() !== 'image' || !(primary(url) || url.hostname === 'static.wikia.nocookie.net')) return route.abort();
        requests.push(url.href);
        if (mode === 'live') return route.continue();
        if (mode === 'unavailable' || mode === 'fandom' && primary(url) || mode === 'thumbnail' && !thumbnail(url)) return route.fulfill({status:404,body:''});
        const size = thumbnail(url) ? [288,162] : primary(url) ? [1920,1080] : [1000,1000];
        return route.fulfill({contentType:'image/svg+xml',body:fixture(...size)});
      });
      if (scenario.legacy) await context.addInitScript(() => {
        Array.prototype.at=undefined;Object.hasOwn=undefined;window.structuredClone=undefined;
        if (window.HTMLDialogElement) {HTMLDialogElement.prototype.showModal=undefined;HTMLDialogElement.prototype.close=undefined;}
      });
      const page = await context.newPage(), errors=[];
      page.on('pageerror',error => errors.push(error.message));
      async function load(nextMode) {
        mode=nextMode;requests=[];
        await page.goto(base+'/acc_details/?lang=en&imageCase='+mode+'#'+accountId);
        await page.waitForFunction(() => document.body.classList.contains('has-account'));
        assert.equal(await page.locator('.tab.active').getAttribute('data-tab'),'overview');
        await page.locator('[data-tab="skins"]').click();
        assert.equal(await page.locator('#sortFilter').inputValue(),'rarity');
        assert.equal(await page.locator('.skin-card').count(),items.length);
      }
      const card = page.locator('.skin-card').filter({hasText:'Academy'});
      const cardImage = card.locator('img');
      const dialogImage = page.locator('#dialogImage');
      await load('primary');
      await waitImage(cardImage);
      if (process.env.SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});
        await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,scenario.legacy?'skins-mobile.png':'skins-desktop.png'),fullPage:true});
      }
      assert.equal(await cardImage.getAttribute('src'),items[0].image,'cards must load recorded full artwork rather than 288x162 thumbnails');
      assert.equal(await cardImage.evaluate(image => image.naturalWidth),1920);
      assert(!requests.some(url => thumbnail(new URL(url))),'successful originals need no thumbnail request');
      await assertFilledCard(cardImage);
      await card.hover();
      assert.equal(await cardImage.evaluate(image => getComputedStyle(image).transform),'none','hover must not enlarge or crop artwork');
      await card.click();await waitImage(dialogImage);
      assert.equal(await dialogImage.getAttribute('src'),items[0].image);
      await assertNaturalDialog(dialogImage);
      if(!scenario.legacy)assert((await page.locator('#skinDialog').boundingBox()).width>900,'desktop large image should use a wider viewer');
      assert.equal(await page.locator('#dialogSource').getAttribute('href'),items[0].image);
      assert.equal(await page.locator('#dialogPreview').getAttribute('href'),items[0].preview,'explicit preview links retain their recorded thumbnail');
      await page.keyboard.press('Escape');
      await load('thumbnail');await waitImage(cardImage);
      assert.equal(await cardImage.getAttribute('src'),items[0].preview,'a recorded primary thumbnail remains available if originals fail');
      assert.equal(await cardImage.evaluate(image => image.naturalWidth),288);
      await assertFilledCard(cardImage);
      assert(requests.indexOf(items[0].image) < requests.indexOf(items[0].preview));
      await card.click();await waitImage(dialogImage);
      assert.equal(await dialogImage.getAttribute('src'),items[0].preview);
      await assertNaturalDialog(dialogImage);
      await page.keyboard.press('Escape');
      await load('fandom');await waitImage(cardImage);
      assert.equal(await cardImage.getAttribute('src'),items[0].fallbackImage,'Fandom original follows exhaustion of primary sources');
      assert(requests.indexOf(items[0].image) < requests.indexOf(items[0].preview));
      assert(requests.indexOf(items[0].preview) < requests.indexOf(items[0].fallbackImage));
      assert(!requests.includes(items[0].fallbackPreview),'successful Fandom original needs no Fandom thumbnail');
      await assertFilledCard(cardImage);
      await card.click();await waitImage(dialogImage);
      assert.equal(await dialogImage.getAttribute('src'),items[0].fallbackImage);
      await assertNaturalDialog(dialogImage);
      await page.keyboard.press('Escape');
      await load('unavailable');await card.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => Array.from(document.querySelectorAll('.skin-card')).find(card => card.textContent.includes('Academy'))?.querySelector('.card-art').classList.contains('image-error'));
      assert(!(await cardImage.isVisible()));
      assert.equal(await page.locator('.skin-card').count(),items.length,'image failures retain ownership records');
      await card.click();
      await page.waitForFunction(()=>document.querySelector('.dialog-image-wrap')?.classList.contains('image-error'));
      assert(await page.locator('#dialogImageFallback').isVisible());
      await page.keyboard.press('Escape');
      mode='primary';await card.click();await waitImage(dialogImage);
      assert(!(await page.locator('#dialogImageFallback').isVisible()),'opening again clears the old missing-image state');
      await assertNaturalDialog(dialogImage);await page.keyboard.press('Escape');
      if (process.env.LIVE_IMAGE_CHECK === '1') {
        await load('live');
        const measured=[];
        for (const item of items) {
          const image = page.locator('.skin-card').filter({hasText:item.name}).locator('img');
          await waitImage(image);
          measured.push(await image.evaluate(image => ({src:image.currentSrc,width:image.naturalWidth,height:image.naturalHeight,fit:getComputedStyle(image).objectFit})));
          assert.equal(await image.getAttribute('src'),item.image);
          assert((await image.evaluate(image => image.naturalWidth)) >= 1920);
          await assertFilledCard(image);
        }
        if (process.env.SCREENSHOT_DIR) await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,scenario.legacy?'skins-live-mobile.png':'skins-live-desktop.png'),fullPage:true});
        await card.click();await waitImage(dialogImage);
        assert.equal(await dialogImage.getAttribute('src'),items[0].image);
        await assertNaturalDialog(dialogImage);
        if (process.env.SCREENSHOT_DIR) await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,scenario.legacy?'dialog-live-mobile.png':'dialog-live-desktop.png')});
        console.log(JSON.stringify({scenario:scenario.name,liveImages:measured}));
      }
      assert.deepEqual(errors,[]);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      console.log(JSON.stringify({scenario:scenario.name,fullArtwork:true,cardFillsFrame:true,dialogKeepsNaturalRatio:true,dialogWithinViewport:true,primaryThumbnailFallback:true,fandomOriginalFallback:true,noImageFallback:true,defaultRarity:true,pageErrors:errors}));
    } finally {await browser.close();}
  }
})().catch(error => {console.error(error);process.exitCode=1;}).finally(() => server.close());
