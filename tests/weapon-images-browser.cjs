'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http'), vm = require('node:vm');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const window = {};
for (const file of ['weapon-catalog.js','image-sources.js']) vm.runInNewContext(fs.readFileSync(path.join(root,'acc_details',file),'utf8'), {window});
const api = window.DetailsImageSources;
const variant = (hero,name) => api.variant({hero,name});
const jade = variant('Tracer','Jade'), galactic = variant('Tracer','Galactic');
const snapshot = {accountId:'123',inventoryStatus:'partial',ownedSkinIds:['Mercy/TEST'],
  ownedWeaponSkinIds:['weapon/Mercy/Rose_Gold','weapon/Reaper/Hard_Light','weapon/Ana/Frostmourne'],
  ownedWeaponVariants:[...['Golden','Jade','Galactic','Crimson Wolf'].map(name=>({hero:'Tracer',name})),{hero:'Vendetta',name:'Crimson Wolf'},{hero:'Ana',name:'Jade'},...['D.Va','Ashe','Hanzo','Junkrat','Reaper','Soldier 76'].map(hero=>({hero,name:'Golden'}))],
  uncataloguedOwnedItems:[{category:'weapons',hero:'Sojourn',name:'Eternal Crystal'}]};
const server = http.createServer((req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  const json = value => {res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
  if(pathname==='/accounts.json')return json({accounts:[{id:123,level:'68 - OW2',price:'$50'}]});
  if(pathname==='/account_details.json')return json({schemaVersion:1,accounts:{123:snapshot}});
  if(pathname==='/acc_details/catalog.js'){res.setHeader('Content-Type','text/javascript');return res.end('window.HERO_GALLERY_CATALOG=[{id:"Mercy/TEST",hero:"Mercy",name:"Pink Mercy",rarity:"legendary",image:"/skin.svg"}];');}
  if(pathname==='/skin.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"/>');}
  const file = path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    for(const [engine,width] of [[chromium,1440],[webkit,390]]) {
      const browser = await engine.launch({headless:true,...(engine===chromium&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
      try {
        const page = await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'});
        const errors=[], requests=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.route('**/*',async route=>{
          const url = route.request().url();
          if(new URL(url).hostname==='127.0.0.1')return route.continue();
          if(!['static.wikia.nocookie.net','image.jeuxvideo.com','i.imgur.com'].includes(new URL(url).hostname))return route.abort();
          requests.push(url);
          // Two independent failure modes: HTTP failure and Wiki's successful placeholder.
          if(url===jade.preview)return route.fulfill({status:404,body:''});
          const placeholder=url===galactic.preview;
          const w=placeholder?300:url.includes('scale-to-width-down')?600:1200;
          const h=placeholder?171:750;
          return route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#345"/></svg>`});
        });
        if(engine===webkit)await page.addInitScript(()=>{HTMLDialogElement.prototype.showModal=undefined;HTMLDialogElement.prototype.close=undefined;});
        await page.goto('http://127.0.0.1:'+server.address().port+'/acc_details/?lang=en#123');
        await page.waitForFunction(()=>document.body.classList.contains('has-account'));
        await page.locator('[data-tab="variants"]').click();
        const cards=page.locator('#variantGrid .skin-card');
        assert.equal(await cards.count(),12);
        for(const [hero,name] of [['Tracer','Golden'],['Tracer','Jade'],['Tracer','Galactic'],['Tracer','Crimson Wolf'],['Vendetta','Crimson Wolf'],...['D.Va','Ashe','Hanzo','Junkrat','Reaper','Soldier 76'].map(hero=>[hero,'Golden'])]) {
          const card=page.locator('#variantGrid button').filter({hasText:hero}).filter({hasText:name});
          await card.scrollIntoViewIfNeeded();
          await card.locator('img').evaluate(img=>img.complete&&img.naturalWidth?Promise.resolve():new Promise(resolve=>img.addEventListener('load',resolve,{once:true})));
          const expected=variant(hero,name);
          assert.equal(await card.locator('img').getAttribute('src'),hero==='Tracer'&&['Jade','Galactic'].includes(name)?expected.image:expected.preview);
          assert.equal(await card.locator('img').evaluate(img=>getComputedStyle(img).objectFit),'contain');
          await card.click();
          assert.equal(await page.locator('#dialogTitle').textContent(),name);
          assert.equal(await page.locator('#dialogHero').textContent(),hero.toUpperCase());
          assert.equal(await page.locator('#dialogImage').getAttribute('src'),expected.image);
          assert.equal(await page.locator('#dialogImage').evaluate(img=>getComputedStyle(img).objectFit),'contain');
          await page.locator('#closeDialog').click();
          assert(await card.evaluate(node=>node===document.activeElement),'focus returns to originating weapon card');
        }
        const ana=page.locator('#variantGrid button').filter({hasText:'Ana'});
        assert.equal(await ana.locator('img').getAttribute('src'),null);
        assert(await ana.locator('.card-art').evaluate(node=>node.classList.contains('image-error')));
        await ana.click(); assert(await page.locator('#dialogImageFallback').isVisible());
        assert.equal(await page.locator('#dialogImage').getAttribute('src'),null);
        await page.locator('#closeDialog').click();
        assert(requests.includes(jade.preview)&&requests.includes(jade.image),'404 falls through to same-hero original');
        assert(requests.includes(galactic.preview)&&requests.includes(galactic.image),'300x171 placeholder falls through to same-hero original');
        await page.locator('[data-tab="weapons"]').click();
        assert.equal(await page.locator('#weaponGrid button').count(),4);
        for(const [name,available] of [['Rose Gold',true],['Frostmourne',false],['Eternal Crystal',false]]) {
          const card=page.locator('#weaponGrid button').filter({hasText:name});
          await card.click();assert.equal(await page.locator('#dialogTitle').textContent(),name);
          assert.equal(await page.locator('#dialogImageFallback').isVisible(),!available);
          await page.locator('#closeDialog').click();
        }
        await page.locator('[data-tab="skins"]').click();
        await page.locator('#skinGrid button').click();
        assert.equal(await page.locator('#dialogImage').getAttribute('data-weapon-image'),null,'weapon framing does not leak into skins');
        assert.equal(await page.locator('#dialogTitle').textContent(),'Pink Mercy');
        await page.locator('#closeDialog').click();
        // All candidates fail: leave an honest missing state and stop retrying.
        const exhausted=await page.evaluate(async()=>{
          const image=new Image();document.body.append(image);
          const item={image:'/missing-weapon-original',preview:'/missing-weapon-thumb'};
          let failures=0;
          await new Promise(resolve=>DetailsImageSources.load(image,item,true,()=>{failures++;resolve();}));
          const result={failures,src:image.getAttribute('src')};image.remove();return result;
        });
        assert.deepEqual(exhausted,{failures:1,src:null});
        const cancelled=await page.evaluate(()=>{
          const image=new Image(),callbacks=[];
          const oldCancel=DetailsImageSources.load(image,{image:'/old-original',preview:'/old-thumb'},false,()=>callbacks.push('old'));
          const oldError=image.onerror,oldLoad=image.onload;
          oldCancel();
          const newCancel=DetailsImageSources.load(image,{image:'/new-original'},false,()=>callbacks.push('new'));
          const newError=image.onerror;
          oldError();oldLoad();oldCancel();
          const result={src:image.getAttribute('src'),newHandlerIntact:image.onerror===newError,callbacks};
          newCancel();return result;
        });
        assert.deepEqual(cancelled,{src:'/new-original',newHandlerIntact:true,callbacks:[]},'cancelled callbacks cannot mutate the next image');
        // Capture a pending dialog callback, close, then open a skin; the old callback is inert.
        await page.evaluate(()=>{
          window.weaponLoads=[];const original=DetailsImageSources.load;
          DetailsImageSources.load=(image,...args)=>{
            const cancel=original(image,...args);
            if(image.id==='dialogImage')window.weaponLoads.push({error:image.onerror,load:image.onload});
            return cancel;
          };
        });
        await page.locator('[data-tab="variants"]').click();
        await page.locator('#variantGrid button').filter({hasText:'Vendetta'}).click();
        await page.locator('#closeDialog').click();
        await page.locator('[data-tab="skins"]').click();
        await page.locator('#skinGrid button').click();
        const stale=await page.evaluate(()=>{
          const image=document.getElementById('dialogImage'),src=image.src;
          for(const callback of window.weaponLoads){callback.error?.();callback.load?.();}
          return {unchanged:image.src===src,fallback:!document.getElementById('dialogImageFallback').hidden};
        });
        assert.deepEqual(stale,{unchanged:true,fallback:false});
        await page.locator('#closeDialog').click();
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'responsive layout fits');
        assert.deepEqual(errors,[]);
        console.log(JSON.stringify({engine:engine===chromium?'Chromium':'WebKit legacy dialog',width,variants:12,actualOwnedPairs:6,specialWeapons:4,thumbnailAndDialog:true,fallbacks:['404','Wiki placeholder','exhausted'],heroIsolation:true,staleCallbacksCancelled:true,pageErrors:errors}));
      }finally{await browser.close();}
    }
  }finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
