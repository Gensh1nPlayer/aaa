const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const fixtures=[
 ['Genji','Illidan','legendary','ultra-rare'],['Mercy','Pink Mercy','legendary','ultra-rare'],
 ['Roadhog','Midas','legendary','rare'],['Mercy','Royal Knight','legendary','rare'],
 ['Widowmaker','Noire','legendary','collector'],
 ['Sombra','Gilded Hunter','legendary','shop'],['Reaper','OWCS 2024','epic','esports'],
 ['Kiriko','Sample Future Bundle','legendary','bundle'],['Widowmaker','Spellbinder(Iridescent)','mythic','mythic'],
 ['Tracer','Adventurer (Iridescent)','mythic','mythic'],['D.Va','Test Ultra','ultra',null],
 ['Roadhog','Butcher','legendary',null],['Zenyatta','<img src=x onerror=alert(1)> Clockwork','legendary',null],
 ['Tracer','Hot Pink','rare',null],['Zarya','Brick','rare',null],['Cassidy','Royal','epic',null],
 ['Bastion','Dawn','rare',null],['Pharah','Anubis','epic',null],['D.Va','White Rabbit','legendary',null],
 ['Brigitte','Ice Queen','epic',null],['Zenyatta','Ra','legendary',null],
 ['Bastion','Brick','legendary','ultra-rare'],['Mercy','Pink','legendary','ultra-rare'],
 ['Juno','Heart of Hope (Iridescent)','mythic','mythic']
];
const skins=fixtures.map(([hero,name,rarity],i)=>({id:hero+'/TEST_'+i,hero,name,rarity,image:'/fixture-art.svg'}));
const snapshot={accountId:'123',inventoryStatus:'partial',ownedSkinIds:skins.map(s=>s.id)};
const stock={accounts:[{id:123,level:'68 - OW2',price:'$50.00',status:'In Stock',highlights:'✨ Illidan Genji, Pink Mercy, Midas Roadhog, Royal Knight Mercy, Noire Widowmaker, Gilded Hunter Sombra, OWCS 2024 Reaper, Sample Future Bundle, Spellbinder Widowmaker, Hot Pink Tracer, Brick Zarya, Royal Cassidy, Royal, Academy D.Va, Noire Mercy<br>✨ Mob Boss/Executioner/Gladiator Queen JQ, Night Owl/Snow Owl Ana, Ana/Mercy<br>🎮 Premium Battle Pass: Season 9 - Ancient Caller + Blizzard Mythic Gift<br>🎮 Premium Battle Pass: Seasons 13, 14, and 2026 Seasons 1 and 3 — zeus, Sumi-ichimonji, Merciful Magitech + 90 Mythic Prisms<br>🎮 Premium Battle Pass: Season 20, 22-24 + Spellbinder(Iridescent), Adventurer (Iridescent), Heart of Hope (Iridescent), Hop Online!, Celestial Guardian, Cyber Demon, Adventurer, A-7000 Wargod, Divine Druid, Grand Beast'}]};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/accounts.json'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(stock));}
 if(pathname==='/account_details.json'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({schemaVersion:1,accounts:{'123':snapshot}}));}
 if(pathname==='/acc_details/catalog.js'){res.setHeader('Content-Type','text/javascript');return res.end('window.HERO_GALLERY_CATALOG='+JSON.stringify(skins)+';');}
 if(pathname==='/fixture-art.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect width="1920" height="1080" fill="#263a52"/></svg>');}
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
const palette=locator=>locator.evaluate(node=>{const css=getComputedStyle(node);return {color:css.color,background:css.backgroundImage,fill:css.webkitTextFillColor,shadow:css.textShadow,weight:css.fontWeight};});
// Skins are paged (five rows of the current column count).
async function firstPage(page){
 const first=page.locator('#pagination .page-number',{hasText:/^1$/});
 if(await first.count()&&!(await first.getAttribute('aria-current')))await first.click();
}
async function showCard(page,card){
 await firstPage(page);
 const next=page.locator('#pagination .page-arrow').last();
 while(!(await card.count())&&await next.count()&&!(await next.isDisabled()))await next.click();
}
async function acrossPages(page,selector){
 await firstPage(page);
 let total=await page.locator(selector).count();
 const next=page.locator('#pagination .page-arrow').last();
 while(await next.count()&&!(await next.isDisabled())){await next.click();total+=await page.locator(selector).count();}
 await firstPage(page);
 return total;
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 for(const scenario of [{engine:chromium,name:'Chromium desktop',viewport:{width:1440,height:960}},{engine:webkit,name:'WebKit mobile / legacy API',viewport:{width:390,height:844},legacy:true}]){
  const browser=await scenario.engine.launch({headless:true,...(scenario.engine===chromium&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  try{
   const context=await browser.newContext({viewport:scenario.viewport,reducedMotion:'reduce'}),errors=[];
   await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
   if(scenario.legacy)await context.addInitScript(()=>{Array.prototype.at=undefined;Object.hasOwn=undefined;window.structuredClone=undefined;if(window.HTMLDialogElement){HTMLDialogElement.prototype.showModal=undefined;HTMLDialogElement.prototype.close=undefined;}});
   const home=await context.newPage();home.on('pageerror',e=>errors.push(e.message));await home.goto(base+'/?lang=en#accounts');await home.locator('.account-card').waitFor();
   await home.evaluate(()=>document.fonts.ready);
   await home.waitForFunction(()=>getComputedStyle(document.querySelector('.account-card .ac-special-skin-ultra-rare')).fontWeight==='800');
   const colors={};for(const tier of ['ultra-rare','rare','collector','shop','esports','bundle','mythic'])colors[tier]=await palette(home.locator('.account-card .ac-special-skin-'+tier).first());
   for(const [name,rarity] of [['Hot Pink','rare'],['Brick','rare'],['Royal','epic'],['Academy','legendary']])assert.equal(await home.locator('.ac-rarity-name-'+rarity).filter({hasText:new RegExp('^'+name+'$')}).count(),1,'homepage fallback '+name);
   assert.equal(await home.locator('.ac-rarity-name').filter({hasText:'Noire'}).count(),0,'wrong hero cannot inherit fallback color');
   assert.equal(await home.locator('.ac-rarity-name').filter({hasText:/^Royal$/}).count(),1,'only hero-qualified Royal is colored');
   for(const name of ['Mob Boss','Executioner','Gladiator Queen','Night Owl','Snow Owl'])assert.equal(await home.locator('.ac-rarity-name-legendary').filter({hasText:new RegExp('^'+name+'$')}).count(),1,'slash-group member '+name);
   const soft=await palette(home.locator('.ac-rarity-name-legendary').first());
   assert.equal(soft.color,'rgb(216, 181, 106)');assert.equal(soft.shadow,'none');assert.equal(soft.weight,'400');
   assert.equal(colors.esports.color,'rgb(133, 200, 217)');assert.equal(colors.esports.weight,'550');
   assert.equal(colors['ultra-rare'].weight,'800','top collector emphasis stays unchanged');
   for(const name of ['Ancient Caller','zeus','Sumi-ichimonji','Merciful Magitech','Spellbinder(Iridescent)','Adventurer (Iridescent)','Heart of Hope (Iridescent)','Hop Online!','Celestial Guardian','Cyber Demon','Adventurer','A-7000 Wargod','Divine Druid','Grand Beast']){
    const effect=home.locator('.account-card .ac-special-skin-mythic').filter({hasText:new RegExp('^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).first();
    assert.equal(await effect.count(),1,'plain Battle Pass mythic: '+name);assert((await palette(effect)).background.includes('linear-gradient'));
   }
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/acc_details/?lang=en#123');await page.waitForFunction(()=>document.body.classList.contains('has-account'));await page.locator('[data-tab="skins"]').click();
   for(let i=0;i<fixtures.length;i++){
    const [hero,name,rarity,tier]=fixtures[i],card=page.locator('.skin-card')
      .filter({has:page.locator('.card-hero').filter({hasText:new RegExp('^'+hero.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')})})
      .filter({has:page.getByText(name,{exact:true})});
    await showCard(page,card);
    assert.equal(await card.locator('.card-name').textContent(),name,'do not rewrite actual skin names');
    if(tier)assert.deepEqual(await palette(card.locator('.card-name .ac-special-skin-'+tier)),colors[tier],'stock palette/glow parity: '+name);
    else assert.equal(await card.locator('.card-name .ac-special-skin').count(),0,'ordinary or unknown names remain ordinary');
    if(rarity==='mythic'){const label=card.locator('.rarity-label .rarity-text');assert.equal(await label.count(),1);assert((await palette(label)).background.includes('linear-gradient'));}
    if(rarity==='ultra'){const label=card.locator('.rarity-label .rarity-text');assert.equal((await palette(label)).color,'rgb(255, 28, 0)');}
    await card.click();assert.equal(await page.locator('#dialogTitle').textContent(),name);
    if(tier)assert.deepEqual(await palette(page.locator('#dialogTitle .ac-special-skin-'+tier)),colors[tier],'large viewer palette/glow parity: '+name);
    if(rarity==='mythic')assert((await palette(page.locator('#dialogRarity .rarity-text'))).background.includes('linear-gradient'));
    if(rarity==='ultra')assert.equal((await palette(page.locator('#dialogRarity .rarity-text'))).color,'rgb(255, 28, 0)');
    await page.keyboard.press('Escape');
   }
   assert.equal(await acrossPages(page,'#skinGrid img[src="x"]'),0,'names cannot inject HTML');
   for(const lang of ['fr','de','ar','ja']){
    await page.goto(base+'/acc_details/?lang='+lang+'#123');await page.waitForFunction(()=>document.body.classList.contains('has-account'));await page.locator('[data-tab="skins"]').click();
    assert.equal(await acrossPages(page,'.rarity-label[data-rarity="mythic"] .rarity-text'),3);assert.equal(await acrossPages(page,'.rarity-label[data-rarity="ultra"] .rarity-text'),1);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),lang+' layout fits');
   }
   if(process.env.SCREENSHOT_DIR){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await page.goto(base+'/acc_details/?lang=en#123');await page.waitForFunction(()=>document.body.classList.contains('has-account'));await page.locator('[data-tab="skins"]').click();await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,scenario.legacy?'effects-mobile.png':'effects-desktop.png'),fullPage:true});}
   await home.route('**/assets/skin-visuals.js*',route=>route.fulfill({status:404,body:''}));
   await home.reload();await home.locator('.account-card').waitFor();assert.equal(await home.locator('.account-card').count(),1,'missing visual module must not hide stock');
   await page.route('**/assets/skin-visuals.js*',route=>route.fulfill({status:404,body:''}));
   await page.reload();await page.waitForFunction(()=>document.body.classList.contains('has-account'));await page.locator('[data-tab="skins"]').click();
   assert.equal(await acrossPages(page,'.skin-card'),fixtures.length,'missing visual module must not hide recorded skins');
   assert.equal(await acrossPages(page,'#skinGrid img[src="x"]'),0,'plain fallback still escapes names');
   assert.deepEqual(errors,[]);console.log(JSON.stringify({scenario:scenario.name,sharedStockPalette:true,skinNames:fixtures.length,mythicGradient:true,ultraRed:true,languages:5,htmlEscaped:true,pageErrors:errors}));
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
