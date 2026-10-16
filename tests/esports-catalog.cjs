'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),window={};
vm.runInNewContext(fs.readFileSync(path.join(root,'acc_details/catalog.js'),'utf8'),{window});
const catalog=window.HERO_GALLERY_CATALOG,base={window:{}};
vm.runInNewContext(execFileSync('git',['show','HEAD:acc_details/catalog.js'],{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024}),base);
const byId=new Map(catalog.map(x=>[x.id,x]));assert.equal(byId.size,catalog.length);
for(const old of base.window.HERO_GALLERY_CATALOG){const item=byId.get(old.id);assert(item,'retain old ID '+old.id);assert.equal(item.hero,old.hero);assert.equal(item.name,old.name);assert.equal(item.image,old.image,'existing source priority stays unchanged');}
const records=catalog.filter(x=>/\/OWL_(?:OW1|OW2|OWCS)_/.test(x.id));
for(const item of records){assert.equal(item.acquisition,'esports');assert.equal(item.rarity,'epic');assert.match(item.image,/^https:\/\/static\.wikia\.nocookie\.net\/overwatch_gamepedia\/images\//);assert(!/Weapon/.test(item.image));assert(item.preview.includes('/scale-to-width-down/600'));}
const find=(hero,name)=>catalog.find(x=>x.hero===hero&&x.name===name);
for(const name of ['Overwatch 1 Seoul Dynasty','Overwatch 1 Seoul Dynasty Away','Overwatch 2 Seoul Dynasty','Overwatch 2 Seoul Dynasty Away','OWCS','OWCS Away'])assert(find('Ana',name),'separate Ana / '+name);
assert.notEqual(find('Ana','Overwatch 1 Seoul Dynasty').image,find('Ana','Overwatch 2 Seoul Dynasty').image);
assert.notEqual(find('Ana','OWCS').image,find('Ana','OWCS Away').image);
assert.equal(find('Ana','Midnight Camo').acquisition,'shop');
assert.equal(find('Genji','Stadium Elite').acquisition,'stadium');
assert(find('Ana','Captain Amari').referenceOrder>=0);
assert(records.filter(x=>x.gameVersion==='ow1').length>1400);
assert(records.filter(x=>x.gameVersion==='ow2').length>1400);
console.log(JSON.stringify({total:catalog.length,esportsAdded:records.length,originalIdsPreserved:base.window.HERO_GALLERY_CATALOG.length,shop:catalog.filter(x=>x.acquisition==='shop').length,stadium:catalog.filter(x=>x.acquisition==='stadium').length,heroAndVersionIsolation:true}));
