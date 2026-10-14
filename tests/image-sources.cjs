'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {prioritize}=require('../tools/prioritize-skin-images.cjs'),images=require('../acc_details/image-sources.js');
const primary='https://raw.githubusercontent.com/ValentinZeller/overwatch_skins/main/image/hero/Ana/BASTET.webp';
const fandom='https://static.wikia.nocookie.net/overwatch_gamepedia/images/1/11/Ana_Skin_Bastet.png';
const original=[{id:'Ana/BASTET',hero:'Ana',name:'Bastet',image:fandom,preview:fandom+'?thumb',fallbackImage:primary},
 {id:'fandom/Ana_New',hero:'Ana',name:'New Skin',image:fandom},
 {id:'fandom/Ana_Bastet',hero:'Ana',name:'Bastet',image:fandom}];
const before=JSON.stringify(original);
const result=prioritize(original,['image/hero/Ana/BASTET.webp','image/hero/Ana/BASTET_web.webp']);
assert.deepEqual(result.catalog.map(x=>x.id),original.map(x=>x.id));assert.equal(JSON.stringify(original),before);
assert.equal(result.catalog[0].image,primary);assert.match(result.catalog[0].preview,/_web\.webp$/);
assert.equal(result.catalog[0].fallbackImage,fandom);assert.equal(result.catalog[1].image,fandom);
assert.equal(result.catalog[2].image,primary,'exact hero + game name may supply artwork without changing ID');
assert.equal(images.candidates(original[0],true)[0],primary,'old Fandom-first entries also prioritize GitHub');
assert.equal(images.candidates(result.catalog[0])[0],primary);
assert.deepEqual(images.candidates(result.catalog[0]),[primary,result.catalog[0].preview,fandom,fandom+'?thumb'],'full artwork precedes thumbnails within each source');
assert.deepEqual(images.candidates({image:fandom,preview:result.catalog[0].preview,fallbackImage:primary,fallbackPreview:fandom+'?thumb'}),[primary,result.catalog[0].preview,fandom,fandom+'?thumb'],'a primary original in a legacy fallback field still precedes its thumbnail');
assert.deepEqual(images.candidates({image:fandom,preview:fandom+'?thumb',fallbackImage:fandom+'?other-original'}),[fandom,fandom+'?other-original',fandom+'?thumb'],'all recorded originals precede thumbnails for Fandom-only entries');
assert.deepEqual(images.candidates({preview:result.catalog[0].preview}),[result.catalog[0].preview],'preview-only entries retain their recorded artwork');
assert.deepEqual(images.candidates({image:primary,preview:primary,fallbackImage:fandom}),[primary,fandom],'duplicate artwork URLs are attempted once');
assert.deepEqual(images.candidates({}),[]);
assert(images.candidates(result.catalog[0]).includes(fandom));
assert.equal(images.sourcePage(result.catalog[0]),'https://github.com/ValentinZeller/overwatch_skins');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../acc_details/catalog.js'),'utf8'),context);
for(const item of context.window.HERO_GALLERY_CATALOG){
 if(images.candidates(item).some(url=>url.startsWith('https://raw.githubusercontent.com/ValentinZeller/overwatch_skins/')))assert.match(item.image,/^https:\/\/raw\.githubusercontent\.com\/ValentinZeller\/overwatch_skins\//);
}
console.log('Image sources: GitHub priority, verified-path thumbnails, Fandom fallback, unchanged IDs and old-entry compatibility passed.');
