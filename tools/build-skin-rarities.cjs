'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),window={};
vm.runInNewContext(fs.readFileSync(path.join(root,'acc_details/catalog.js'),'utf8'),{window});
const heroKey=x=>String(x).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const nameKey=x=>String(x).normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
const names={};
for(const item of window.HERO_GALLERY_CATALOG){
 if(!['common','rare','epic','legendary','ultra','mythic'].includes(item.rarity))continue;
 const name=nameKey(item.name),hero=heroKey(item.hero),row=names[name]||(names[name]={});
 if(Object.prototype.hasOwnProperty.call(row,hero)&&row[hero]!==item.rarity)row[hero]=null;else if(!Object.prototype.hasOwnProperty.call(row,hero))row[hero]=item.rarity;
}
const source=`// Generated from acc_details/catalog.js by tools/build-skin-rarities.cjs. No artwork or ownership data.\n(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RoshineSkinRarities=api;})(typeof window==='object'?window:globalThis,function(){\n'use strict';\nconst names=${JSON.stringify(names)};\nconst key=x=>String(x||'').normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\\s+/g,' ');\nfunction classFor(name,heroes){const row=names[key(name)];if(!row)return '';const values=heroes?heroes.length?heroes.map(hero=>row[hero]):[]:Object.values(row);if(!values.length||values.some(value=>!value)||new Set(values).size!==1)return '';return 'ac-rarity-name-'+values[0];}\nreturn Object.freeze({classFor});\n});\n`;
fs.writeFileSync(path.join(root,'assets/skin-rarities.js'),source);
console.log(JSON.stringify({names:Object.keys(names).length,bytes:Buffer.byteLength(source)}));
