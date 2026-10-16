'use strict';
// Encoding and thumbnail generation only: composition stays in CSS, not repainted pixels.
const path = require('node:path');
const fs = require('node:fs');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const input = process.argv[2];
if (!input) throw new Error('Pass the folder containing FROST ANA.jpg and DEILVERANCE.jpg');
const output = path.resolve(__dirname, '../acc_details/assets/weapons');
(async () => {
  for (const [source, name] of [['FROST ANA.jpg', 'ana-frostmourne-native'], ['DEILVERANCE.jpg', 'soldier76-deliverance-native']]) {
    const image = sharp(path.join(input, source));
    // The small original JPEG is already efficient: preserve every source byte.
    fs.copyFileSync(path.join(input, source), path.join(output, name + '.jpg'));
    const full = await image.metadata();
    const thumbnail = await image.clone().resize({width:960, withoutEnlargement:true}).webp({quality:90, effort:6}).toFile(path.join(output, name + '-thumb.webp'));
    console.log(JSON.stringify({name, full, thumbnail}));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
