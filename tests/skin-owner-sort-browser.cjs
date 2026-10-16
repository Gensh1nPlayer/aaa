'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
// Same names AND rarities deliberately exercise a hero-sensitive sorting cache.
const skins=[['Zarya','Brick'],['Bastion','Brick'],['Mercy','Noire'],['Widowmaker','Noire']]
 .map(([hero,name],i)=>({id:hero+'/TEST_'+i,hero,name,rarity:'legendary',image:'/art.svg'}));
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/account_details.json'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({schemaVersion:1,accounts:{123:{accountId:'123',ownedSkinIds:skins.map(s=>s.id)}}}));}
 if(pathname==='/accounts.json'){res.setHeader('Content-Type','application/json');return res.end('{"accounts":[]}');}
 if(pathname==='/acc_details/catalog.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.HERO_GALLERY_CATALOG='+JSON.stringify(skins));}
 if(pathname==='/art.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"/>');}
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true,...(engine===chromium&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  try{
   const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
   await page.goto('http://127.0.0.1:'+server.address().port+'/acc_details/#123');
   await page.waitForFunction(()=>document.body.classList.contains('has-account'));await page.locator('[data-tab="skins"]').click();
   for(const sort of ['rarity','name','hero','featured','rarity']){
    await page.selectOption('#sortFilter',sort);
    assert.deepEqual(await page.locator('#skinGrid .card-hero').allTextContents(),['Bastion','Widowmaker',...(sort==='name'?['Zarya','Mercy']:['Mercy','Zarya'])],sort+' cannot reuse another hero color tier');
    const cards=page.locator('#skinGrid .skin-card');
    assert.equal(await cards.nth(0).locator('.ac-special-skin-ultra-rare').count(),1);
    assert.equal(await cards.nth(1).locator('.ac-special-skin-collector').count(),1);
    assert.equal(await cards.nth(2).locator('.card-name .ac-special-skin').count(),0);
    assert.equal(await cards.nth(3).locator('.card-name .ac-special-skin').count(),0);
   }
   assert.deepEqual(errors,[]);console.log((engine===chromium?'Chromium':'WebKit')+': same-name/same-rarity ownership, color sorting and cache isolation passed');
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
