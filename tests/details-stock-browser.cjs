const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const skins=[
 ['Mercy','Pink Mercy','legendary'],['Genji','Illidan','legendary'],['Widowmaker','Noire','legendary'],
 ['Roadhog','Midas','legendary'],['Genji','Future Mythic','mythic'],['Reaper','OWCS 2024','epic'],
 ['Sombra','Gilded Hunter','legendary'],['Kiriko','Sample Future Bundle','legendary'],
 ['D.Va','Academy','legendary'],['Bastion','Antique','epic'],
 ['Bastion','Sample Shop','epic','shop',10],['Bastion','Sample Stadium','epic','stadium',20],
 ['Bastion','Default Cyan','rare'],['Bastion','Default White','common']
].map(([hero,name,rarity,acquisition,referenceOrder],i)=>({id:hero+'/TEST_'+i,hero,name,rarity,acquisition,referenceOrder,image:'/art.svg'}));
let failStock=false;
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
 if(pathname==='/accounts.json'){
  if(failStock){res.writeHead(503);return res.end();}
  return json({accounts:[{id:123,level:'1 + 222 - OW1 SilverBorder Stacked Account',price:'$110'}]});
 }
 if(pathname==='/account_details.json')return json({schemaVersion:1,accounts:{123:{accountId:'123',ownedSkinIds:skins.map(s=>s.id),profile:{accountLevel:'1 + 222 - OW1',timePlayedHours:123,gamesPlayed:456,gamesWon:222,roleStats:{tank:{timePlayedHours:123}}}}}});
 if(pathname==='/acc_details/catalog.js'){res.setHeader('Content-Type','text/javascript');return res.end('window.HERO_GALLERY_CATALOG='+JSON.stringify(skins));}
 if(pathname==='/art.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#263a52"/></svg>');}
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');
 res.end(fs.readFileSync(file));
});
// Skins are paged (five rows of the current column count); collect every page in order.
async function allCardNames(page){
 const first=page.locator('#pagination .page-number',{hasText:/^1$/});
 if(await first.count()&&!(await first.getAttribute('aria-current')))await first.click();
 const names=await page.locator('#skinGrid .card-name').allTextContents();
 const next=page.locator('#pagination .page-arrow').last();
 while(await next.count()&&!(await next.isDisabled())){await next.click();names.push(...await page.locator('#skinGrid .card-name').allTextContents());}
 if(await first.count())await first.click();
 return names;
}
async function showSelector(page,selector){
 const first=page.locator('#pagination .page-number',{hasText:/^1$/});
 if(await first.count()&&!(await first.getAttribute('aria-current')))await first.click();
 const next=page.locator('#pagination .page-arrow').last();
 while(!(await page.locator(selector).count())&&await next.count()&&!(await next.isDisabled()))await next.click();
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 for(const [engine,width] of [[chromium,1440],[webkit,390]]){
  const browser=await engine.launch({headless:true,...(engine===chromium&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  try{
   const page=await browser.newPage({viewport:{width,height:960}}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
   await page.goto('http://127.0.0.1:'+server.address().port+'/acc_details/?lang=en#123');
   await page.locator('#accountStockTags .premium').waitFor();
   assert.equal(await page.locator('#accountLevelValue').textContent(),'1 + 222');
   assert.equal(await page.locator('#accountVersion').textContent(),'OW1');
   assert.deepEqual(await page.locator('#accountStockTags > span').allTextContents(),['Premium Account','Silver Border','Stacked Account']);
   assert.equal(await page.locator('.game-version-ow1').evaluate(n=>getComputedStyle(n).color),'rgb(255, 240, 166)');
   assert.equal(await page.locator('.account-card').count(),1,'only recorded Tank role is shown');
   if(width<=620){
    const metrics=page.locator('.account-metrics'),last=metrics.locator('.account-metric').last();
    assert.equal(await metrics.locator('.account-metric').count(),3);
    assert.equal(await last.evaluate(n=>getComputedStyle(n).gridColumn),'1 / -1');
    assert(Math.abs((await metrics.boundingBox()).width-(await last.boundingBox()).width)<1,'odd last metric fills mobile row');
   }
   await page.evaluate(()=>HeroGallery.loadSnapshot({accountId:'123',ownedSkinIds:[],profile:{accountLevel:'111111111 + 222222222 - OW1 Silver Border Stacked Account Premium Account',timePlayedHours:123,gamesPlayed:456,gamesWon:222,roleStats:{tank:{timePlayedHours:123}}}}));
   assert.equal(await page.locator('#accountLevelValue').textContent(),'111111111 + 222222222');
   assert.equal(await page.locator('#accountStockTags > span').count(),3,'long level labels deduplicate Stock tags');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'long level/tags fit viewport');
   if(process.env.DETAILS_SCREENSHOT_DIR){
    fs.mkdirSync(process.env.DETAILS_SCREENSHOT_DIR,{recursive:true});
    await page.screenshot({path:path.join(process.env.DETAILS_SCREENSHOT_DIR,`overview-${width}.png`),fullPage:true});
   }
   await page.evaluate(()=>HeroGallery.loadSnapshot({accountId:'123',ownedSkinIds:[],accountVersion:'OW1',profile:{accountLevel:'111 - OW2'}}));
   assert.equal(await page.locator('#accountVersion').textContent(),'OW2','manual string beats conflicting stock and snapshot version');
   await page.evaluate(()=>{HeroGallery.loadSnapshot({accountId:'123',accountVersion:'OW1',ownedSkinIds:[],profile:{accountLevel:669}});HeroGallery.setStockAccount({id:123,level:'68 - OW2'});});
   assert.equal(await page.locator('#accountLevelValue').textContent(),'669','ordinary stock numeric level cannot replace snapshot');
   assert.equal(await page.locator('#accountVersion').textContent(),'OW1','explicit snapshot version beats stock fallback');
   await page.evaluate(()=>HeroGallery.setStockAccount({id:123,level:68}));
   assert.equal(await page.locator('#accountLevelValue').textContent(),'669','numeric stock level is supported without replacing numeric snapshot');
   await page.evaluate(()=>HeroGallery.setStockAccount({id:123,level:'1 + 222 - OW1 SilverBorder Stacked Account',price:'$110'}));
   await page.evaluate(ids=>HeroGallery.loadSnapshot({accountId:'123',ownedSkinIds:ids,profile:{accountLevel:223}}),skins.map(s=>s.id));
   assert.equal(await page.locator('#accountLevelValue').textContent(),'1 + 222','numeric snapshot uses same-ID stock compound');
   await page.locator('[data-tab="skins"]').click();
   await page.evaluate(()=>{
    const visuals=window.RoshineSkinVisuals;window.nameFormatCalls=0;
    window.RoshineSkinVisuals={...visuals,formatName(name){window.nameFormatCalls++;return visuals.formatName(name);}};
   });
   for(const sort of ['rarity','featured','hero','name']){
    const before=await page.evaluate(()=>window.nameFormatCalls);
    await page.selectOption('#sortFilter',sort);
    assert.equal(await page.evaluate(()=>window.nameFormatCalls)-before,await page.locator('#skinGrid .skin-card').count(),'cached classification adds no name-regex calls during comparisons; only card rendering formats names');
    const names=await allCardNames(page);
    assert.deepEqual(names.slice(0,2),sort==='name'?['Illidan','Pink Mercy']:['Illidan','Pink Mercy']);
    assert.deepEqual(names.slice(2,4),['Noire','Midas']);
    assert.deepEqual(names.slice(4,7),sort==='name'?['Future Mythic','Gilded Hunter','Sample Future Bundle']:['Future Mythic','Sample Future Bundle','Gilded Hunter'],'same-gradient items use the selected comparator, not a mythic/shop/bundle tier');
    assert.equal(names[7],'OWCS 2024','esports follows the shared gradient group');
    assert.deepEqual(names.slice(8,10),['Sample Shop','Sample Stadium'],'verified Shop/Stadium precede ordinary skins inside the Stock color tier');
    assert.deepEqual(names.slice(10),['name','rarity'].includes(sort)?['Academy','Antique','Default Cyan','Default White']:['Antique','Default Cyan','Default White','Academy']);
   }
   await page.selectOption('#rarityFilter','epic');
   assert.deepEqual(await page.locator('#skinGrid .card-name').allTextContents(),['OWCS 2024','Sample Shop','Sample Stadium','Antique']);
   await page.fill('#skinSearch','antique');assert.equal(await page.locator('.skin-card').count(),1);
   await page.locator('#resetButton').click();assert.equal((await allCardNames(page)).length,skins.length);
   for(const [rarity,color] of [['common','rgb(255, 255, 255)'],['rare','rgb(11, 156, 207)'],['epic','rgb(237, 60, 239)'],['legendary','rgb(255, 156, 0)']]) {
    await showSelector(page,`.rarity-label[data-rarity="${rarity}"] .rarity-text`);
    assert.equal(await page.locator(`.rarity-label[data-rarity="${rarity}"] .rarity-text`).first().evaluate(n=>getComputedStyle(n).color),color);
   }
   for(const selector of ['#skinSearch','#rarityFilter','#sortFilter','#resetButton'])assert(await page.locator(selector).evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>=14),'readable control font: '+selector);
   for(const selector of ['#rarityFilter','#sortFilter'])assert.deepEqual(await page.locator(selector).evaluate(n=>({background:getComputedStyle(n).backgroundColor,color:getComputedStyle(n).color,minHeight:getComputedStyle(n).minHeight})),{background:'rgb(17, 18, 36)',color:'rgb(231, 225, 247)',minHeight:'42px'},'native select matches dark controls');
   await page.locator('#resetButton').hover();
   assert.deepEqual(await page.locator('#resetButton').evaluate(n=>({color:getComputedStyle(n).color,background:getComputedStyle(n).backgroundColor})),{color:'rgb(239, 236, 251)',background:'rgb(37, 35, 65)'},'hover retains bright text against dark background');
   const box=await page.locator('.card-art').first().boundingBox();assert(box.width>80&&box.height>80,'flex cards retain artwork size');
   if(process.env.DETAILS_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.DETAILS_SCREENSHOT_DIR,`skins-${width}.png`),fullPage:true});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'responsive overflow');
   for(const value of [111,'111 - OW2','111 - OW1','1 + 222 - OW1',null]){
    await page.evaluate(value=>HeroGallery.loadSnapshot({accountId:'123',ownedSkinIds:[],profile:{accountLevel:value}}),value);
    assert.equal(await page.locator('#accountLevelValue img').count(),0);
    assert.equal(await page.locator('#accountLevelValue').textContent(),value===null||typeof value==='number'?'1 + 222':String(value).replace(/ - OW[12]$/,''));
   }
   for(const raw of ['<img src=x onerror=alert(1)> - OW2','arbitrary text','111 - OW3','-1','1 +','1'.repeat(501)]){
    assert(await page.evaluate(raw=>{try{HeroGallery.loadSnapshot({accountId:'123',ownedSkinIds:[],profile:{accountLevel:raw}});return false;}catch(error){return error instanceof TypeError;}},raw),'invalid manual level rejected');
   }
   await page.evaluate(()=>{HeroGallery.loadSnapshot({accountId:'456',ownedSkinIds:[]});HeroGallery.setStockAccount({id:123,level:'999 - OW1',price:'$999'});});
   assert(await page.locator('#accountStockTags').isHidden(),'wrong stock ID cannot leak labels');
   failStock=true;await page.reload();await page.waitForFunction(()=>document.body.classList.contains('has-account'));
   assert.equal(await page.locator('#accountLevelValue').textContent(),'1 + 222');failStock=false;
   assert.deepEqual(errors,[]);
   console.log(JSON.stringify({engine:width===390?'WebKit mobile':'Chromium desktop',sorts:4,compoundLevels:true,stockFailure:true,overflow:false}));
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
