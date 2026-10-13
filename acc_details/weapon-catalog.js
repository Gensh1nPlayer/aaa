// Public reference catalog. Ownership is supplied only by an imported account snapshot.
// Sources: https://overwatch.fandom.com/wiki/Weapon_Skins and the game UI.
window.HERO_GALLERY_WEAPONS = [
  ['Reaper', 'Hard Light', 'legendary', '0/05/Reaper_Weapon_Skin_Hard_Light.png', '20240326234000'],
  ['Reinhardt', 'Hard Light', 'legendary', '9/9f/Reinhardt_Weapon_Skin_Hard_Light.png', '20240326234017'],
  ['Mercy', 'Hard Light', 'legendary', 'd/d5/Mercy_Weapon_Skin_Hard_Light_Staff.png', '20240326234406'],
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
  ['Hanzo', 'Tokyo Redel', 'mythic', 'b/b8/Hanzo_Weapon_Skin_Tokyo_Redel.png', '20260621003000'],
  ['Juno', 'Star Shooter', 'mythic', '6/6a/Juno_Weapon_Skin_Star_Shooter.png', '20260218194310'],
  ['Kiriko', 'Spirit Keeper', 'mythic', '5/52/Kiriko_Weapon_Skin_Spirit_Keeper.png', '20260126220935'],
  ['Mercy', 'Merciful Magitech', 'mythic', '9/97/Mercy_Weapon_Skin_Merciful_Magitech.png', '20250608230058'],
  ['Orisa', 'Capsule Cannon', 'mythic', 'a/ac/Orisa_Weapon_Skin_Capsule_Cannon.png', '20260126220225'],
  ['Reaper', 'Steel Death', 'mythic', '7/74/Reaper_Weapon_Skin_Steel_Death.png', '20250624221914'],
  ['Reinhardt', 'Bound Demon', 'mythic', 'c/c8/Reinhardt_Weapon_Skin_Bound_Demon.png', '20240924205836'],
  ['Soldier 76', 'Deliverance', 'mythic', '6/6d/S76_Weapon_Skin_Deliverance.png', '20241114125248'],
  ['Widowmaker', 'Dame Chance', 'mythic', 'e/e3/Widowmaker_Weapon_Skin_Dame_Chance.png', '20250319130439']
].map(([hero, name, rarity, path, revision]) => {
  const base = `https://static.wikia.nocookie.net/overwatch_gamepedia/images/${path}/revision/latest`;
  return { id: `weapon/${hero.replace(/[^a-z0-9]+/gi, '_')}/${name.replace(/[^a-z0-9]+/gi, '_')}`,
    hero, name, rarity, preview: `${base}/scale-to-width-down/600?cb=${revision}`,
    image: `${base}?cb=${revision}`, source: 'https://overwatch.fandom.com/wiki/Weapon_Skins' };
});
window.HERO_GALLERY_VARIANTS = ['Golden', 'Jade', 'Galactic', 'Crimson Wolf'];
