const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const manager=process.env.MANAGER_PACKAGE,collector=process.env.COLLECTOR_PACKAGE;
if(!manager||!collector)throw new Error('Set MANAGER_PACKAGE and COLLECTOR_PACKAGE to local packages');
const {fixture}=require(path.join(manager,'tests/server.cjs'));
const {Store}=require(path.join(manager,'lib/store.cjs'));
const {SnapshotReview}=require(path.join(manager,'lib/snapshot-review.cjs'));
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'details-manual-'));
 let browser;
 try{
  const f=await fixture(root),directory=path.join(root,'state');
  const python=path.join(collector,'.venv/Scripts/python.exe');
  const exported=mode=>JSON.parse(execFileSync(python,['-B',path.join(manager,'tests/review-export-fixture.py'),collector,path.join(f.collector,'runs'),mode],{encoding:'utf8'}));
  exported('init');
  await fs.mkdir(path.join(f.repo,'acc_details'),{recursive:true});
  await fs.writeFile(path.join(f.repo,'acc_details/catalog.js'),'window.HERO_GALLERY_CATALOG = [{id:"D.Va/ACADEMY",hero:"D.Va",name:"Academy",rarity:"legendary"}];');
  await fs.writeFile(path.join(f.repo,'acc_details/weapon-catalog.js'),'window.HERO_GALLERY_WEAPONS = [];');
  let store=await new Store(directory).init();await store.configure(f.repo,f.collector,'fixture');
  const {normalizeForSite}=await import(require('node:url').pathToFileURL(path.join(manager,'lib/hero-gallery-import.mjs')));
  for(const raw of ['arbitrary text','111 - OW3','<script>111</script>','-1','1 +','1'.repeat(501)])assert.throws(()=>normalizeForSite({accountId:'182',ownedSkinIds:[],profile:{accountLevel:raw}},'182'),/等级/);
  let review=new SnapshotReview(store),saved=false;
  browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  const page=await browser.newPage();
  await page.exposeFunction('reviewApi',async(action,input)=>{
   if(action==='review-open')return review.open(input.id);
   if(action==='review-save')return review.save(input);
   throw new Error(action);
  });
  await page.exposeFunction('savedResult',()=>{saved=true;});
  const open=async()=>{
   saved=false;await page.setContent('<div id="managerDialog"></div>');
   await page.addScriptTag({path:path.join(manager,'ui/snapshot-review.js')});
   await page.evaluate(()=>SnapshotReview.open({id:'182',api:window.reviewApi,
    dialog:(_title,html)=>{const body=document.getElementById('managerDialog');body.innerHTML=html;return body;},
    close:()=>{},onSaved:()=>window.savedResult(),onError:message=>{throw new Error(message);}}));
  };
  const stockBefore=JSON.stringify(store.data.stock);
  for(const raw of ['111 - OW2','111 - OW1','1 + 222 - OW1']){
   await open();assert.equal(await page.locator('[data-profile="accountLevel"]').getAttribute('type'),'text');
   await page.fill('[data-profile="accountLevel"]',raw);await page.check('#reviewConfirm');await page.click('#reviewSave');
   await page.waitForFunction(()=>document.querySelector('#reviewSave').disabled===false);
   assert.equal(await page.locator('#reviewError').textContent(),'');assert(saved);
   store=await new Store(directory).init();review=new SnapshotReview(store);
   assert.equal(store.data.details['182'].profile.accountLevel,raw);
   assert.equal(JSON.stringify(store.data.stock),stockBefore,'manual save does not implicitly sync stock');
   const output=exported('export');assert.equal(output.profile.accountLevel,raw,'real collector re-export preserves manual text');
   await open();assert.equal(await page.inputValue('[data-profile="accountLevel"]'),raw,'reload is lossless');
  }
  const context=await review.open('182');
  await review.save({ticket:context.ticket,snapshot:context.snapshot,confirm:true,syncFields:['version']});
  // Version sync stays opt-in and adds no duplicate suffix.
  const manual=await review.open('182');manual.snapshot.accountVersion='OW1';
  await review.save({ticket:manual.ticket,snapshot:manual.snapshot,confirm:true,syncFields:['version']});
  assert.equal(store.data.stock.accounts.find(a=>a.id===182).level,'1 + 222 - OW1');
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(f.repo,'accounts.json'),'utf8')),f.stock);
  console.log('Manual UI -> save -> Store reload -> real offline collector export: all three level strings preserved; stock sync opt-in, no data writes outside temporary fixtures.');
 }finally{await browser?.close();await fs.rm(root,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
