'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http'), vm = require('node:vm');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const window = {};
for (const file of ['weapon-catalog.js','image-sources.js']) vm.runInNewContext(fs.readFileSync(path.join(root,'acc_details',file),'utf8'), {window});
const api = window.DetailsImageSources;
const variant = (hero,name) => api.variant({hero,name});
const jade = variant('Tracer','Jade'), crimson = variant('Tracer','Crimson Wolf');
const snapshot = {accountId:'123',inventoryStatus:'partial',ownedSkinIds:['Mercy/TEST'],
  ownedWeaponSkinIds:['weapon/Mercy/Rose_Gold','weapon/Reaper/Hard_Light','weapon/Ana/Frostmourne','weapon/Soldier_76/Deliverance','weapon/Lucio/Treblemaker','weapon/Hanzo/Tokyo_Redel'],
  ownedWeaponVariants:[...['Golden','Jade','Galactic','Crimson Wolf'].map(name=>({hero:'Tracer',name})),{hero:'Vendetta',name:'Crimson Wolf'},{hero:'Ana',name:'Jade'},{hero:'Ashe',name:'Crimson Wolf'},...['D.Va','Ashe','Hanzo','Junkrat','Reaper','Soldier 76'].map(hero=>({hero,name:'Golden'}))],
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
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');
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
          if(!['static.wikia.nocookie.net','image.jeuxvideo.com','i.imgur.com','bnetcmsus-a.akamaihd.net'].includes(new URL(url).hostname))return route.abort();
          requests.push(url);
          // Two independent failure modes: HTTP failure and Wiki's successful placeholder.
          if(url===jade.preview)return route.fulfill({status:404,body:''});
          const placeholder=url===crimson.preview;
          const w=placeholder?300:url.includes('scale-to-width-down')?600:1200;
          const h=placeholder?171:750;
          return route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#345"/></svg>`});
        });
        if(engine===webkit)await page.addInitScript(()=>{HTMLDialogElement.prototype.showModal=undefined;HTMLDialogElement.prototype.close=undefined;});
        await page.goto('http://127.0.0.1:'+server.address().port+'/acc_details/?lang=en#123');
        await page.waitForFunction(()=>document.body.classList.contains('has-account'));
        await page.locator('[data-tab="variants"]').click();
        const cards=page.locator('#variantGrid .skin-card');
        assert.equal(await cards.count(),13,'ownership cards remain even when images are removed');
        for(const [hero,name] of [['Tracer','Golden'],['Tracer','Jade'],['Tracer','Crimson Wolf'],['Ashe','Crimson Wolf']]) {
          const card=page.locator('#variantGrid button').filter({hasText:hero}).filter({hasText:name});
          await card.scrollIntoViewIfNeeded();
          await card.locator('img').evaluate(img=>img.complete&&img.naturalWidth?Promise.resolve():new Promise(resolve=>img.addEventListener('load',resolve,{once:true})));
          const expected=variant(hero,name);
          assert.equal(await card.locator('img').getAttribute('src'),hero==='Tracer'&&['Jade','Crimson Wolf'].includes(name)?expected.image:expected.preview);
          assert.equal(await card.locator('img').evaluate(img=>getComputedStyle(img).objectFit),'contain');
          assert(await card.locator('img').evaluate(img=>img.parentElement.style.getPropertyValue('--weapon-art-image').includes(img.currentSrc)), 'thumbnail backdrop uses accepted same-hero fallback');
          await card.click();
          assert.equal(await page.locator('#dialogTitle').textContent(),name);
          assert.equal(await page.locator('#dialogHero').textContent(),hero.toUpperCase());
          assert.equal(await page.locator('#dialogImage').getAttribute('src'),expected.image);
          assert.equal(await page.locator('#dialogImage').evaluate(img=>getComputedStyle(img).objectFit),'contain');
          await page.locator('#closeDialog').click();
          assert(await card.evaluate(node=>node===document.activeElement),'focus returns to originating weapon card');
        }
        for(const [hero,name] of [['Ana','Jade'],['Tracer','Galactic'],['Vendetta','Crimson Wolf'],...['D.Va','Ashe','Hanzo','Junkrat','Reaper','Soldier 76'].map(hero=>[hero,'Golden'])]) {
          const card=page.locator('#variantGrid button').filter({hasText:hero}).filter({hasText:name});
          assert.equal(await card.locator('img').getAttribute('src'),null);
          assert.equal(await card.locator('.card-art').evaluate(node=>node.style.getPropertyValue('--weapon-art-image')),'','missing art has no borrowed backdrop');
          assert(await card.locator('.card-art').evaluate(node=>node.classList.contains('image-error')));
          assert(await card.getByText('Image unavailable',{exact:true}).count());
          await card.click(); assert(await page.locator('#dialogImageFallback').isVisible());
          assert.equal(await page.locator('#dialogImage').getAttribute('src'),null);
          await page.locator('#closeDialog').click();
        }
        assert(!requests.some(url=>/jeuxvideo|imgur|Galactic_Weapon|Vendetta/.test(url)),'unapproved images are never requested');
        assert(requests.includes(jade.preview)&&requests.includes(jade.image),'404 falls through to same-hero original');
        assert(requests.includes(crimson.preview)&&requests.includes(crimson.image),'300x171 placeholder falls through to same-hero original');
        await page.locator('[data-tab="weapons"]').click();
        assert.equal(await page.locator('#weaponGrid button').count(),7);
        assert.equal(await page.locator('#weaponGrid').evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length),width===390?1:3,'wide weapon cards instead of tiny mobile tiles');
        let stageHeight=null;
        for(const [name,available] of [['Rose Gold',true],['Frostmourne',true],['Deliverance',true],['Eternal Crystal',true],['Treblemaker',true],['Tokyo Rebel',true]]) {
          const card=page.locator('#weaponGrid button').filter({hasText:name});
          const art=await card.locator('.card-art').boundingBox();assert(Math.abs(art.width/art.height-16/9)<.02,'consistent 16:9 thumbnail');
          await card.click();assert.equal(await page.locator('#dialogTitle').textContent(),name);
          assert.equal(await page.locator('#dialogImageFallback').isVisible(),!available);
          await page.waitForFunction(()=>{const image=document.getElementById('dialogImage');return image.complete&&image.naturalWidth>0;});
          const geometry=await page.locator('#dialogImage').evaluate(img=>({height:img.parentElement.getBoundingClientRect().height,fit:getComputedStyle(img).objectFit,max:innerHeight*.58}));
          assert.equal(geometry.fit,'contain');assert(geometry.height<=geometry.max+1,'bounded stage fits viewport');
          assert(await page.locator('#dialogImage').evaluate(img=>img.parentElement.style.getPropertyValue('--weapon-art-image').includes(img.currentSrc)), 'viewer backdrop uses its accepted original');
          if(name==='Frostmourne')assert.equal(await page.locator('#dialogTitle .ac-special-skin-ultra-rare').count(),1,'Frostmourne uses BlizzCon emphasis without changing rarity');
          if(stageHeight===null)stageHeight=geometry.height;else assert(Math.abs(stageHeight-geometry.height)<1,'all weapons share one viewer size');
          if(['Frostmourne','Deliverance'].includes(name)) {
            assert(await card.locator('img').getAttribute('src').then(src=>src.includes('-native-thumb.webp')),'native thumbnail is selected');
            assert.deepEqual(await page.locator('#dialogImage').evaluate(img=>[img.naturalWidth,img.naturalHeight]),[1918,1078],'original screenshot dimensions retained');
            assert.equal(await page.locator('#dialogImage').evaluate(img=>Number(img.style.getPropertyValue('--weapon-art-scale'))),name==='Frostmourne'?1.03:1.18,'per-weapon safe framing');
            if(process.env.WEAPON_SCREENSHOT_DIR){fs.mkdirSync(process.env.WEAPON_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.WEAPON_SCREENSHOT_DIR,`${name.toLowerCase()}-${width}.png`)});}
          }
          await page.locator('#closeDialog').click();
        }
        await page.locator('[data-tab="skins"]').click();
        await page.locator('#skinGrid button').click();
        assert.equal(await page.locator('#dialogImage').getAttribute('data-weapon-image'),null,'weapon framing does not leak into skins');
        assert.equal(await page.locator('#skinDialog').getAttribute('data-image-kind'),null,'weapon image stage does not leak into skins');
        assert.equal(await page.locator('#dialogImage').evaluate(img=>img.parentElement.style.getPropertyValue('--weapon-art-image')),'','weapon backdrop does not leak into skins');
        assert.equal(await page.locator('#dialogImage').evaluate(img=>img.style.getPropertyValue('--weapon-art-scale')),'','weapon crop does not leak into skins');
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
        const fallbackScale=await page.evaluate(async()=>{
          const image=new Image();document.body.append(image);
          await new Promise((resolve,reject)=>{
            const observer=new MutationObserver(()=>{if(image.style.getPropertyValue('--weapon-art-scale')){observer.disconnect();resolve();}});
            observer.observe(image,{attributes:true,attributeFilter:['style']});
            DetailsImageSources.load(image,{image:'/missing-native',fallbackImage:'/skin.svg',imageScale:1.18},false,()=>{observer.disconnect();reject(new Error('Fallback should load'));});
          });
          const scale=image.style.getPropertyValue('--weapon-art-scale');image.remove();return scale;
        });
        assert.equal(fallbackScale,'1','native framing does not crop different fallback artwork');
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
        console.log(JSON.stringify({engine:engine===chromium?'Chromium':'WebKit legacy dialog',width,variants:13,approvedImages:4,missingImages:9,actualOwnedPairs:6,specialWeapons:7,nativeScreenshots:2,thumbnailAndDialog:true,fallbacks:['404','Wiki placeholder','exhausted'],heroIsolation:true,staleCallbacksCancelled:true,pageErrors:errors}));
      }finally{await browser.close();}
    }
  }finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
