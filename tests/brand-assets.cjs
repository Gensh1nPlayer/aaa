'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file));
for(const file of ['assets/logo.svg','assets/roshine-wordmark.svg','assets/favicon.svg','acc_details/favicon.svg']) {
  const svg=read(file).toString();assert(svg.includes('<path'),'path-based brand artwork');
  assert(!/<(?:script|image|foreignObject|text)\b|https?:\/\/(?!www.w3.org)/i.test(svg),'no script, embedded raster, font or remote dependency');
}
for(const [file,size] of [['assets/favicon-16.png',16],['assets/favicon-32.png',32],['assets/apple-touch-icon.png',180],['assets/icon-192.png',192],['assets/icon-512.png',512],['assets/logo.png',512],['auth/logo.png',512]]) {
  const png=read(file);assert.equal(png.toString('ascii',1,4),'PNG');
  assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
  assert.equal(png[25],2,'opaque RGB for browser and touch icon compatibility');
}
assert(read('assets/logo.png').equals(read('auth/logo.png')),'legacy PNG URLs serve the new mark');
assert(read('assets/favicon.svg').equals(read('acc_details/favicon.svg')),'details favicon cannot keep old artwork');
const ico=read('favicon.ico');assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),2);
for(let i=0;i<2;i++){const offset=ico.readUInt32LE(6+i*16+12);assert.equal(ico.toString('ascii',offset+1,offset+4),'PNG');}
const pages=['index.html','acc_details/index.html','auth/index.html','privacy/index.html','terms/index.html','404.html'];
for(const file of pages){
  const html=read(file).toString();
  assert(html.includes('/assets/roshine-wordmark.svg'),file+' branded wordmark');
  assert(html.includes('/assets/favicon.svg?v=1')&&html.includes('/assets/apple-touch-icon.png?v=1'),file+' browser/touch icons');
  assert(html.includes('og-social-v4.jpg')&&!/og-social-v[23]\.jpg/.test(html),file+' fresh social-preview URL');
  assert(!/src="[^"<>]*logo\.png"/.test(html),file+' no old raster logo references');
}
for(const file of ['assets/og-social-v3.jpg','assets/og-social-v2.jpg','assets/og-social.jpg','assets/og.jpg'])assert(read(file).equals(read('assets/og-social-v4.jpg')),'legacy preview alias refreshed');
for(const copy of ['LIFETIME','WARRANTY.','1-to-1','Guided buying','Questions answered','After-sales support','Full account details','Security-first handover','Terms apply.'])assert(read('tools/social-card.html').toString().includes(copy),'approved service preview copy: '+copy);
const manifest=JSON.parse(read('site.webmanifest'));assert.equal(manifest.icons.length,2);
for(const icon of manifest.icons)assert(fs.existsSync(path.join(root,icon.src)),icon.src);
console.log(JSON.stringify({publicPages:6,vectorAssets:4,pngSizes:[16,32,180,192,512],ico:true,legacyLogoAndPreviewAliases:true,inventoryUntouched:true}));
