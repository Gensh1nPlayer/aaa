'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const window = {};
for (const file of ['weapon-catalog.js', 'image-sources.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(root, 'acc_details', file), 'utf8'), {window});
}
const api = window.DetailsImageSources;
assert.equal(typeof api.variant, 'function', 'per-hero variant resolver is required');
assert.equal(typeof api.weapon, 'function');
assert.equal(typeof api.load, 'function');
const resolve = (hero, name) => api.variant({hero, name});
for (const name of ['Golden', 'Jade', 'Crimson Wolf']) {
  const tracer = resolve('Tracer', name);
  assert.equal(tracer.hero, 'Tracer');
  assert.equal(tracer.imageAvailable, true);
  assert.notEqual(tracer.preview, tracer.image);
  assert.equal(api.candidates(tracer, true)[0], tracer.preview);
  assert.equal(api.candidates(tracer)[0], tracer.image);
  assert.match(tracer.fallbackImage, /static\.wikia\.nocookie\.net/, 'the earlier Wiki reference remains a fallback');
  for (const hero of ['Ana', 'Genji', 'Mercy']) {
    const item = resolve(hero, name);
    assert.equal(item.hero, hero);
    assert.equal(item.imageAvailable, true, 'every hero has its own native capture');
    assert.notEqual(item.image, tracer.image, 'never borrow another hero weapon');
  }
  const unknown = resolve('Unknown', name);
  assert.equal(unknown.imageAvailable, false);
  assert.deepEqual(Array.from(api.candidates(unknown)), []);
}
const tracer = resolve('Tracer', 'Crimson Wolf');
const ashe = resolve('Ashe', 'Crimson Wolf');
assert.equal(ashe.imageAvailable, true);
assert.notEqual(tracer.image, ashe.image, 'different heroes have different real assets');
assert.match(ashe.fallbackImage, /bnetcmsus-a\.akamaihd\.net/, 'the official Ashe reference remains a fallback');
// User-captured native screenshots: one own image per hero and variant, all packaged locally.
const slug = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
assert.equal(window.HERO_GALLERY_VARIANT_IMAGES.length, 54 * 4, 'every hero x Golden / Jade / Galactic / Crimson Wolf');
assert.equal(new Set(window.HERO_GALLERY_VARIANT_IMAGES.map(entry => entry.hero + '/' + entry.name)).size, 54 * 4);
assert.equal(new Set(window.HERO_GALLERY_VARIANT_IMAGES.map(entry => entry.image)).size, 54 * 4, 'no shared image files');
for (const entry of window.HERO_GALLERY_VARIANT_IMAGES) {
  assert.equal(entry.image, `assets/weapons/variants/${slug(entry.hero)}-${slug(entry.name)}.webp`, 'image named after its own hero');
  assert.equal(entry.preview, entry.image.replace(/\.webp$/, '-thumb.webp'));
  for (const url of [entry.image, entry.preview]) checkPackagedImage(url);
}
for(const [hero,name] of [['Tracer','Galactic'],['Vendetta','Crimson Wolf'],...['D.Va','Ashe','Hanzo','Junkrat','Reaper','Soldier 76'].map(hero=>[hero,'Golden'])]) {
  const item=api.variant({hero,name,owned:true,image:tracer.image,preview:tracer.preview});
  assert.equal(item.owned,true,'keep ownership');
  assert.equal(item.imageAvailable,true);
  assert.equal(item.image,`assets/weapons/variants/${slug(hero)}-${slug(name)}.webp`,'snapshot image metadata never overrides the catalog');
}
const strayed=api.variant({hero:'Unknown',name:'Jade',owned:true,image:tracer.image,preview:tracer.preview});
assert.equal(strayed.image,null);
assert.equal(strayed.preview,null,'images cannot leak from snapshot metadata');
assert.equal(api.variant({hero:'Ana',name:'Jade',image:tracer.image,preview:tracer.preview}).image, 'assets/weapons/variants/ana-jade.webp', 'reject stale generic images');
assert.equal(resolve(' tracer ', 'JADE').image, resolve('Tracer', 'Jade').image);
assert.equal(resolve('Tracer', 'future variant').imageAvailable, false);
const original = {hero:'Tracer', name:'Jade', owned:true};
api.variant(original);
assert.deepEqual(original, {hero:'Tracer', name:'Jade', owned:true}, 'do not mutate snapshots');
const catalog = window.HERO_GALLERY_WEAPONS;
assert.equal(new Set(catalog.map(x => x.id)).size, catalog.length);
for (const [hero, name] of [['Mercy','Rose Gold'],['Ana','Frostmourne'],['Sojourn','Eternal Crystal']]) {
  const entry = catalog.find(x => x.hero === hero && x.name === name);
  assert(entry, hero + ' / ' + name + ' is catalogued');
  const item = api.weapon({hero, name, owned:true});
  assert.equal(item.owned, true);
  assert.equal(item.id, entry.id);
  assert.equal(item.imageAvailable, true);
}
assert.equal(api.weapon({hero:'Lúcio',name:'Treblemaker'}).imageAvailable,true);
function checkPackagedImage(url) {
 const local=path.resolve(root,'acc_details',url);
 assert(local.startsWith(path.join(root,'acc_details','assets','weapons')+path.sep));
 const bytes=fs.readFileSync(local);assert(bytes.length>1000,'packaged image exists: '+url);
 if(/\.jpe?g$/i.test(url)) assert(bytes[0]===255&&bytes[1]===216&&bytes[2]===255,'JPEG signature: '+url);
 else {assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}
}
for(const item of catalog.filter(x=>x.image?.startsWith('assets/weapons/'))){
 for(const url of [item.image,item.preview])checkPackagedImage(url);
}
for(const [hero,name] of [['Mercy','Merciful Magitech'],['Soldier 76','Deliverance'],['Reinhardt','Bound Demon']]){
 const entry=catalog.find(x=>x.hero===hero&&x.name===name);
 assert(entry.officialImage.startsWith('https://bnetcmsus-a.akamaihd.net/'));
 assert(!entry.image.includes('bnetcmsus-a.akamaihd.net'),'official promotional scenes do not replace isolated weapon artwork');
}
for(const [hero,name,stem,rarity,scale] of [['Ana','Frostmourne','ana-frostmourne-native','legendary',1.03],['Soldier 76','Deliverance','soldier76-deliverance-native','mythic',1.18]]) {
 const item=api.weapon({hero,name});
 assert.equal(item.image,`assets/weapons/${stem}.jpg`);
 assert.equal(item.preview,`assets/weapons/${stem}-thumb.webp`);
 assert.equal(item.rarity,rarity);
 assert.equal(item.imageScale,scale);
 assert(!item.imageContext.includes('AI-assisted'),'native screenshot replaces AI-assisted reference');
}
for(const input of [{hero:'Hanzo',name:'Tokyo Redel'},{hero:'Hanzo',name:'Tokyo Rebel'},{hero:'Hanzo',id:'weapon/Hanzo/Tokyo_Rebel'},{id:'weapon/Hanzo/Tokyo_Redel'}]) {
  assert.equal(api.weapon(input).name,'Tokyo Rebel');
  assert.equal(api.weapon(input).id,'weapon/Hanzo/Tokyo_Redel','legacy snapshot IDs stay stable');
}
assert.equal(api.weapon({id:'weapon/Mercy/Rose_Gold',hero:'Mercy',name:'unmatched',uncatalogued:true}).name, 'Rose Gold');
assert.equal(api.weapon({hero:'Ana',name:'Hard Light'}).imageAvailable, false);
assert.equal(api.weapon({hero:'Soldier: 76',name:'Deliverance'}).hero, 'Soldier 76');
assert.equal(api.weapon({hero:'Ana',id:'weapon/Mercy/Rose_Gold',name:'Rose Gold'}).hero,'Ana');
assert.equal(api.weapon({hero:'Ana',id:'weapon/Mercy/Rose_Gold',name:'Rose Gold'}).imageAvailable,false,'explicit hero wins over conflicting ID');
for (const [hero,name,canonical] of [['Genji','Nerf Sungerang','Nerf Slingerang'],['Genji','Slingerang','Nerf Slingerang'],['Tracer','Gelfire','Nerf Gelfire Pro'],['Tracer','GelFirePro','Nerf Gelfire Pro']]) {
  assert.equal(api.weapon({hero,name}).name,canonical);
  assert.equal(api.weapon({hero:'Ana',name}).imageAvailable,false,'aliases are hero-specific');
}
const actualPairs=[];
for(const file of fs.readdirSync(path.join(root,'acc_details/data')).filter(file=>file.endsWith('.json'))) {
  const snapshot=JSON.parse(fs.readFileSync(path.join(root,'acc_details/data',file),'utf8'));
  for(const item of snapshot.ownedWeaponVariants||[]) {
    const resolved=api.variant(item);
    assert.equal(resolved.imageAvailable,true,'owned pair shows its own native capture: '+item.hero+' / '+item.name);
    assert.equal(resolved.image,`assets/weapons/variants/${slug(item.hero)}-${slug(item.name)}.webp`);
    actualPairs.push(item.hero+' / '+item.name);
  }
}
assert.equal(new Set(actualPairs).size,6,'all six known owned pairs still exist in snapshots');
console.log(JSON.stringify({specialWeapons:catalog.length,variantAssets:window.HERO_GALLERY_VARIANT_IMAGES.length,heroIsolation:true,snapshotUnchanged:true}));

// Opt-in network verification. GET bytes stay in memory; no image files are exported.
async function live() {
  const records = [...catalog, ...window.HERO_GALLERY_VARIANT_IMAGES];
  const titles = [...new Set(records.filter(x => x.image?.includes('static.wikia.nocookie.net')).map(x => 'File:' + decodeURIComponent(x.image.split('/images/')[1].split('/').slice(2,-2).join('/'))))];
  const metadata = new Map();
  for (let i=0; i<titles.length; i+=40) {
    const url = 'https://overwatch.fandom.com/api.php?' + new URLSearchParams({action:'query',prop:'imageinfo',iiprop:'url|size|mime',titles:titles.slice(i,i+40).join('|'),format:'json'});
    const response = await fetch(url, {signal:AbortSignal.timeout(30000)});
    assert.equal(response.status, 200);
    const data = await response.json();
    for (const page of Object.values(data.query.pages)) {
      const info = page.imageinfo?.[0];
      if (info) metadata.set(new URL(info.url).pathname.split('/revision/')[0], info);
    }
  }
  const jobs = records.filter(x => x.image).flatMap(item => ['preview','image'].map(key => ({item,key})));
  let next=0, checked=0;
  await Promise.all(Array.from({length:4}, async () => {
    while (next<jobs.length) {
      const {item,key} = jobs[next++];
      const url = item[key];
      if (!/^https:\/\//.test(url)) {
        checkPackagedImage(url);
        checked++;continue;
      }
      if(url.includes('static.wikia.nocookie.net')) {
        const info = metadata.get(new URL(url).pathname.split('/revision/')[0]);
        assert(info, 'uploaded Wiki file metadata: ' + item.hero + ' / ' + item.name);
        assert(info.width>300 && info.height>171 && info.size>1000);
      }
      const response = await fetch(url, {signal:AbortSignal.timeout(30000)});
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(response.status, 200, url);
      assert.match(response.headers.get('content-type') || '', /^image\//, url);
      assert(bytes.length>1000, 'not an empty/HTML/placeholder response');
      const png = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
      const webp = bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP';
      const jpeg = bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
      assert(png || webp || jpeg, 'PNG/WebP/JPEG signature required: ' + url);
      if (png) assert(!(bytes.readUInt32BE(16)===300 && bytes.readUInt32BE(20)===171), 'reject Wiki placeholder');
      if (webp && bytes.toString('ascii',12,16)==='VP8X') assert(!(bytes.readUIntLE(24,3)+1===300 && bytes.readUIntLE(27,3)+1===171), 'reject Wiki WebP placeholder');
      checked++;
      if(!url.includes('static.wikia.nocookie.net')) console.log(JSON.stringify({hero:item.hero,name:item.name,key,url,status:response.status,type:response.headers.get('content-type'),bytes:bytes.length}));
    }
  }));
  console.log(JSON.stringify({liveGETs:checked,uploadedFiles:metadata.size,status:200,responseSignatures:true,noImageExports:true,missingCatalogImages:catalog.filter(x=>!x.image).map(x=>x.hero+' / '+x.name)}));
}
if (process.argv.includes('--live')) live().catch(error => {console.error(error); process.exitCode=1;});
