// Public reference catalog. Ownership is supplied only by an imported account snapshot.
// Sources: https://overwatch.fandom.com/wiki/Weapon_Skins and the game UI.
// Checked 2026-10-16 against the Wiki parse/imageinfo APIs and image GETs.
// ValentinZeller/overwatch_skins currently has hero skins, not weapon artwork.
window.HERO_GALLERY_WEAPONS = [
  ['Reaper', 'Hard Light', 'legendary', '0/05/Reaper_Weapon_Skin_Hard_Light.png', '20240326234000'],
  ['Reinhardt', 'Hard Light', 'legendary', '9/9f/Reinhardt_Weapon_Skin_Hard_Light.png', '20240326234017'],
  ['Mercy', 'Hard Light', 'legendary', 'd/d5/Mercy_Weapon_Skin_Hard_Light_Staff.png', '20240326234406'],
  ['Mercy', 'Rose Gold', 'legendary', 'd/d9/Mercy_Skin_Rose_Gold_Weapon_1.png', '20240623205848'],
  // The Wiki lists these items but has no uploaded image; do not invent CDN URLs.
  ['Ana', 'Frostmourne', 'legendary', null, null],
  ['Sojourn', 'Eternal Crystal', 'mythic', null, null],
  ['Junkrat', 'Los Muertos', 'legendary', 'b/b5/Junkrat_Weapon_Skin_Los_Muertos_Frag_Launcher.png', '20240327004211'],
  ['Soldier 76', 'Los Muertos', 'legendary', '7/72/S76_Weapon_Skin_Los_Muertos.png', '20240327004013'],
  ['Baptiste', 'Nerf Loadout Commander', 'legendary', 'e/ed/Baptiste_Weapon_Skin_Nerf_Loadout_Commander.png', '20250824225432'],
  ['Cassidy', "Nerf or Nothin'", 'legendary', '9/91/Cassidy_Weapon_Skin_Nerf_or_Nothin%27.png', '20260220013951'],
  ['Genji', 'Nerf Slingerang', 'legendary', 'f/fa/Genji_Weapon_Skin_Nerf_Slingerang.png', '20250824225448'],
  ['Hanzo', 'Nerf Big Bad Bow', 'legendary', '4/48/Hanzo_Weapon_Skin_Nerf_Big_Bad_Bow.png', '20250824225502'],
  ['Mei', 'Nerf Super Soaker XP100', 'legendary', 'c/cc/Mei_Weapon_Skin_Nerf_Super_Soaker_XP100.png', '20250824225515'],
  ['Soldier 76', 'Nerf N Series Pinpoint', 'legendary', '0/0d/S76_Weapon_Skin_Nerf_N_Series_Pinpoint.png', '20250824225526'],
  ['Tracer', 'Nerf Gelfire Pro', 'legendary', '4/4d/Tracer_Weapon_Skin_Nerf_Gelfire_Pro.png', '20250824225531'],
  ['Ana', 'Midnight Sun', 'mythic', 'c/c4/Ana_Weapon_Skin_Midnight_Sun.png', '20240924205932'],
  ['Ashe', 'Lead Rose', 'mythic', '0/09/Ashe_Weapon_Skin_Lead_Rose.png', '20250608225921'],
  ['Cassidy', 'Blazing Sunsetter', 'mythic', '9/98/Cassidy_Weapon_Skin_Blazing_Sunsetter.png', '20250827042624'],
  ['Genji', 'Sumi-ichimonji', 'mythic', '7/74/Genji_Weapon_Skin_Sumi-Ichimonji.png', '20260415042638'],
  ['Hanzo', 'Tokyo Rebel', 'mythic', 'b/b8/Hanzo_Weapon_Skin_Tokyo_Redel.png', '20260621003000'],
  ['Juno', 'Star Shooter', 'mythic', '6/6a/Juno_Weapon_Skin_Star_Shooter.png', '20260218194310'],
  ['Kiriko', 'Spirit Keeper', 'mythic', '5/52/Kiriko_Weapon_Skin_Spirit_Keeper.png', '20260126220935'],
  ['Mercy', 'Merciful Magitech', 'mythic', '9/97/Mercy_Weapon_Skin_Merciful_Magitech.png', '20250608230058'],
  ['Orisa', 'Capsule Cannon', 'mythic', 'a/ac/Orisa_Weapon_Skin_Capsule_Cannon.png', '20260126220225'],
  ['Reaper', 'Steel Death', 'mythic', '7/74/Reaper_Weapon_Skin_Steel_Death.png', '20250624221914'],
  ['Reinhardt', 'Bound Demon', 'mythic', 'c/c8/Reinhardt_Weapon_Skin_Bound_Demon.png', '20240924205836'],
  ['Soldier 76', 'Deliverance', 'mythic', '6/6d/S76_Weapon_Skin_Deliverance.png', '20241114125248'],
  ['Widowmaker', 'Dame Chance', 'mythic', 'e/e3/Widowmaker_Weapon_Skin_Dame_Chance.png', '20250319130439'],
  ['Lucio', 'Treblemaker', 'mythic', null, null]
].map(([hero, name, rarity, path, revision]) => {
  const base = path && `https://static.wikia.nocookie.net/overwatch_gamepedia/images/${path}/revision/latest`;
  return { id: `weapon/${hero.replace(/[^a-z0-9]+/gi, '_')}/${name.replace(/[^a-z0-9]+/gi, '_')}`,
    hero, name, rarity, kind: 'weapon', imageAvailable: Boolean(base),
    preview: base ? `${base}/scale-to-width-down/600?cb=${revision}` : null,
    image: base ? `${base}?cb=${revision}` : null,
    imageStatus: base ? 'available' : 'not-uploaded',
    source: 'https://overwatch.fandom.com/wiki/Weapon_Skins' };
});
// Official 2026 artwork: verified weapon-specific images, not guessed Wiki paths.
// Retain the historic Hanzo ID so existing snapshots and collector exports still resolve.
for (const entry of window.HERO_GALLERY_WEAPONS) {
  if ((entry.hero === 'Ana' && entry.name === 'Frostmourne') || (entry.hero === 'Soldier 76' && entry.name === 'Deliverance')) {
    const frost = entry.hero === 'Ana';
    const stem = frost ? 'ana-frostmourne-native' : 'soldier76-deliverance-native';
    Object.assign(entry, {fallbackImage:entry.image,fallbackPreview:entry.preview,
      image:`assets/weapons/${stem}.jpg`,preview:`assets/weapons/${stem}-thumb.webp`,imageScale:frost?1.03:1.18,
      imageAvailable:true,imageStatus:'available',imageContext:'User-captured native game screenshot; original JPEG bytes preserved, framing applied only in the viewer',
      checkedAt:'2026-10-16'});
  }
  if (entry.hero === 'Hanzo' && entry.name === 'Tokyo Rebel') {
    entry.id = 'weapon/Hanzo/Tokyo_Redel';
    entry.aliasIds = ['weapon/Hanzo/Tokyo_Rebel'];
  }
  const official = entry.hero === 'Sojourn' && entry.name === 'Eternal Crystal' ? {
    image: 'https://bnetcmsus-a.akamaihd.net/cms/page_media/sz/SZVMAE66MTBC1785973461341.png',
    source: 'https://overwatch.blizzard.com/en-gb/news/24295381/4/'
  } : entry.hero === 'Hanzo' && entry.name === 'Tokyo Rebel' ? {
    image: 'https://bnetcmsus-a.akamaihd.net/cms/page_media/1m/1MZJSMPN22KF1781145323192.png',
    source: 'https://overwatch.blizzard.com/en-us/news/24271881/'
  } : entry.hero === 'Mercy' && entry.name === 'Merciful Magitech' ? {
    image:'https://bnetcmsus-a.akamaihd.net/cms/page_media/uz/UZFE0OP5WV8R1747187679052.png',referenceOnly:true,
    source:'https://overwatch.blizzard.com/en-gb/news/24186407/',
    sourceImage:'https://bnetcmsus-a.akamaihd.net/cms/page_media/uz/UZFE0OP5WV8R1747187679052.png'
  } : entry.hero === 'Soldier 76' && entry.name === 'Deliverance' ? {
    image:'https://bnetcmsus-a.akamaihd.net/cms/page_media/w1/W1YSPEX46PCU1731024518004.png',referenceOnly:true,
    source:'https://overwatch.blizzard.com/en-gb/news/24143784/',
    sourceImage:'https://bnetcmsus-a.akamaihd.net/cms/page_media/w1/W1YSPEX46PCU1731024518004.png'
  } : entry.hero === 'Reinhardt' && entry.name === 'Bound Demon' ? {
    image:'https://bnetcmsus-a.akamaihd.net/cms/page_media/5q/5QBOS77W565P1718640974864.png',referenceOnly:true,
    source:'https://overwatch.blizzard.com/en-gb/news/24104748/',
    sourceImage:'https://bnetcmsus-a.akamaihd.net/cms/page_media/5q/5QBOS77W565P1718640974864.png'
  } : entry.hero === 'Lucio' && entry.name === 'Treblemaker' ? {
    image: 'https://bnetcmsus-a.akamaihd.net/cms/gallery/57KC14S2WFJ11790794793169.png',
    source: 'https://overwatch.blizzard.com/es-es/news/24303008/sacia-tu-hambre-en-el-reinado-de-talon-temporada-5-doctrine-sombrio/'
  } : null;
  if (official?.referenceOnly) Object.assign(entry, {
    officialImage:official.image,officialSource:official.source,officialImageContext:'Official promotional scene with hero; reference only, not an isolated weapon view',checkedAt:'2026-10-16'
  });
  else if (official) Object.assign(entry, {fallbackImage:entry.image,fallbackPreview:entry.preview}, official, {
    preview: official.preview || official.image, imageAvailable: true, imageStatus: 'available',
    imageContext: 'Official 2026 weapon artwork', checkedAt: '2026-10-16'
  });
}
window.HERO_GALLERY_VARIANTS = ['Golden', 'Jade', 'Galactic', 'Crimson Wolf'];
// Only the four user-approved hero/variant image pairs. Missing pairs stay missing.
window.HERO_GALLERY_VARIANT_IMAGES = [
  ['Tracer', 'Golden', '4/4e/GoldenWeaponExample.png', '20230928070729'],
  ['Tracer', 'Jade', '3/34/Tracers_Jade_Weapon.png', '20240317021415'],
  ['Tracer', 'Crimson Wolf', 'b/b0/Tracertalon.png', '20260211033126']
].map(([hero, name, path, revision]) => {
  const base = `https://static.wikia.nocookie.net/overwatch_gamepedia/images/${path}/revision/latest`;
  return { hero, name, preview: `${base}/scale-to-width-down/600?cb=${revision}`,
    image: `${base}?cb=${revision}`, source: 'https://overwatch.fandom.com/wiki/Weapon_Variants' };
});
// Exact hero-specific 2026 official reference; never reuse this rifle for other heroes.
window.HERO_GALLERY_VARIANT_IMAGES.push({hero:'Ashe',name:'Crimson Wolf',
  image:'https://bnetcmsus-a.akamaihd.net/cms/gallery/RBQ9I0GPDYQG1770142587282.png',
  preview:'https://bnetcmsus-a.akamaihd.net/cms/gallery/RBQ9I0GPDYQG1770142587282.png',
  source:'https://overwatch.blizzard.com/en-gb/news/24246206/',
  imageContext:'Official 2026 competitive weapon reference',checkedAt:'2026-10-16'
});
