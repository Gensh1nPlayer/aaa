'use strict';
// Rebuild raster compatibility logos, touch icons and ICO from the approved SVG.
const fs = require('node:fs'), path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname,'..'), assets = path.join(root,'assets');
(async () => {
  const symbol = fs.readFileSync(path.join(assets,'logo.svg'),'utf8');
  const tile = symbol.replace(/(<title[\s>])/, '<rect x="48" y="48" width="416" height="416" rx="86" fill="#080813"/>$1');
  fs.writeFileSync(path.join(assets,'favicon.svg'),tile);
  fs.writeFileSync(path.join(root,'acc_details/favicon.svg'),tile);
  for(const [name,size] of [['favicon-16.png',16],['favicon-32.png',32],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512],['logo.png',512]]) {
    await sharp(Buffer.from(tile)).resize(size,size).flatten({background:'#080813'}).png().toFile(path.join(assets,name));
  }
  fs.copyFileSync(path.join(assets,'logo.png'),path.join(root,'auth/logo.png'));
  const pngs=['favicon-16.png','favicon-32.png'].map(name=>fs.readFileSync(path.join(assets,name)));
  const header=Buffer.alloc(6+16*pngs.length);header.writeUInt16LE(1,2);header.writeUInt16LE(pngs.length,4);
  let offset=header.length;
  pngs.forEach((png,index)=>{const pos=6+index*16,size=index===0?16:32;header[pos]=size;header[pos+1]=size;header.writeUInt16LE(1,pos+4);header.writeUInt16LE(32,pos+6);header.writeUInt32LE(png.length,pos+8);header.writeUInt32LE(offset,pos+12);offset+=png.length;});
  fs.writeFileSync(path.join(root,'favicon.ico'),Buffer.concat([header,...pngs]));
  console.log(JSON.stringify({icons:[16,32,180,192,512],legacyAliases:['assets/logo.png','auth/logo.png','acc_details/favicon.svg'],ico:true}));
})().catch(error=>{console.error(error);process.exitCode=1;});
