// Single source for storefront and account-details skin effects.
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.RoshineSkinVisuals=api;
})(typeof window==="object"?window:globalThis,function(){
"use strict";
const skinNamesSource = names => [...new Set(names)].sort((a, b) => b.length - a.length)
  .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
    .replace(/'/g, "(?:'|&#039;|&#39;|&apos;)")).join('|');
const skinNamesPattern = names => new RegExp(`\\b(?:${skinNamesSource(names)})(?![A-Za-z0-9_])`, 'gi');
const rareSkinNames = [
  'Midas', 'Ange de la Mort', 'Pirate Ship', 'Dallas Happi', 'Shanghai Happi', 'Happi',
  'Dallas Summer', 'Shanghai Summer', 'Rock Climber', 'Chained King',
  'Wicked Reign', 'Wicked', 'Tiger Luchador', 'Lion Luchador', 'Luchador',
  'Royal Gladiator', 'Royal Knight', 'Clockwork', 'Thunder', 'Flying Ace',
  'Sylvanas Windrunner', 'Sylvanas', 'Zhulong', 'Zhulang', 'Solaris',
  'Haroeris', 'Dance Party', 'Good and Evil', 'Mayhem Biker', 'Mayhem Biker: 76', 'MM-Mei', 'Zen-Nakji',
  'Crimson Summer', 'Boleiro', 'GOAT', 'GOATS', 'Charged Climber', 'Reigning Climber'
];
const shopSkinNames = [
  // Verified shop/collaboration releases. Free rewards are not inferred as paid.
  'Saitama', 'Terrible Tornado', 'Genos',
  'Spike Spiegel', 'Spike', 'Faye Valentine', 'Faye', 'Ed', 'Jet Black', 'Jet',
  'Porsche', 'Lich King', 'Thrall', 'Diamond Magni',
  'Deku', 'Uravity', 'All Might', 'Himiko Toga', 'Tomura Shigaraki',
  'Chun-Li', 'Juri', 'Cammy', 'Ryu', 'Dhalsim', 'Guile', 'M. Bison', 'Blanka',
  'Optimus Prime', 'Megatron', 'Bumblebee', 'Arcee',
  'ANTIFRAGILE Dazzle', 'ANTIFRAGILE Traysi', 'ANTIFRAGILE Kira-Kira',
  'ANTIFRAGILE BB', 'ANTIFRAGILE Slay Star', 'LE SSERAFIM FEARLESS', 'LE SSERAFIM',
  'Cardboard', 'Turtleship', 'Turtle Ship', 'Cyberdragon', 'Cyber Dragon',
  'Street Runner', 'Honey Bee', 'Cleric', 'Beach Rescue', 'Owl Guardian', 'Gilded Hunter',
  // Bundle collection names verified in the source notes (2026-09-12).
  'Hello Kitty', 'Hello Kitty and Friends', 'Cinnamoroll', 'Pompompurin', 'My Melody', 'Kuromi', 'Keroppi',
  'Nyan Café', 'Nyan Cafe', 'Formalwear', 'Heir', 'Evening Wear', 'Poolside', 'Witch', 'FEARLESS',
  '2B', '9S', 'A2', 'Commander White', 'Adam',
  'Izanami', 'Sekhmet', 'Nezha', 'Artemis', 'Shango', 'Fancy Fleece', 'Fancy Fangs',
  'Street Rebel',
  // User-requested Cupid collection and Charming Soldier: 76.
  'Cupid', 'Cupid Bundles', 'Charming', '10-Years Cheers', 'Comic Book',
  // User-selected visual group; not a claim of official collaboration rarity.
  'Cyber Detective', 'Hashimoto', 'Music Festival', 'Archangel', 'Yatagarasu',
  'Water Warrior', 'Bai Ze', 'Inari', 'Sea Soldier', 'Azure Drake',
  '8-Bit', 'Vigilante', 'Lucky Lioness',
  'Blizzard Mythic Gift', 'Blizzard Mythic Gift — Choose 1 Mythic Skin',
  'Blizzard Mythic Gift - Any 1 Mythic Skin',
  // Collection titles and individual skins; visual grouping is not a claim of exclusivity.
  'YoRHa', 'Project YoRHa', 'LE SSERAFIM Mega', 'Blue Flame', 'Fawksey James',
  'exo-FAUNA', 'exo-L2PUS', 'exo-L5O', 'exo-L50', 'exo-PANT6RA', 'exo-URS4', 'exo-VU7PES',
  // White Rabbit is also D.Va's ordinary Legendary; named Bundles use the bundle rule.
  'Raging Rabbit', 'Bunny Business', 'Siberian Hare',
  'Heavenly Hop', 'Spacebun', 'Bash Bunny',
  'Ultrawatch', 'Lifeguard', 'Masked Mischief', 'asked Mischief',
  'Heist', 'Cyber Oni', 'Oni', 'Witches', 'Infernal Witch', 'Black Cats', 'Black Cat',
  'My Hero Academia', 'One-Punch Man', 'One Punch Man', 'Garou', 'Hellish Blizzard', 'Mumen Rider',
  'Cowboy Bebop', 'Ein', 'Avatar: The Last Airbender', 'Aang', 'Appa', 'Zuko', 'Toph', 'Suki', 'Katara',
  'Gundam Wing', 'Wing Zero', 'Wing Gundam Zero', 'Epyon', 'Gundam Epyon',
  'Deathscythe', 'Gundam Deathscythe Hell', 'Tallgeese',
  'G.I. Joe', 'Snake Eyes', 'Scarlett', 'Baroness', 'Cobra Commander', 'Destro',
  'Persona 5', 'Phantom Thieves', 'Joker', 'Panther', 'Fox',
  'Mephisto', 'Paladin', 'Warlock', 'Rogue', 'Lilith', 'Inarius', 'Imperius', 'Azmodan',
  'Barbarian', 'Nightraven', 'Hatred’s Reckoning', "Hatred's Reckoning",
  'Lich Queen', 'Devourer', 'Xal’atath', "Xal'atath", 'Blackhand', 'Sin’dorei', "Sin'dorei", 'Magni',
  'Feria Shen', 'Wei Qing', 'Shayol Wei', 'Viper Ning', 'Yueshan', 'Wuchen', 'Scarlet Bride',
  'YOASOBI', 'Dragon Star', 'Spirit Star', 'Fire Star', 'Fox Star', 'Space Star', 'Date Night', 'Scuba',
  'My Melody Skin', 'Kuromi Skin', 'Hello Kitty Skin', 'Cinnamoroll Skin', 'Keroppi Skin', 'Pompompurin Skin',
  'Scarlet Bride Viper', 'Shango Reborn', 'Artemis Reborn', 'Sekhmet Reborn', 'Izanami Reborn', 'Nezha Reborn',
  'Charming: 76'
];
// 20 franchises plus historical identities. Abbreviations are inventory
// conventions; standalone words like Shock, Spark and Fuel are too broad.
const owlTeamNames = [
  'Atlanta Reign', 'ATL', 'Boston Uprising', 'BOS', 'Chengdu Hunters', 'CDH',
  'Dallas Fuel', 'DAL', 'Florida Mayhem', 'FLO Mayhem', 'FLA', 'Guangzhou Charge', 'GZC',
  'Hangzhou Spark', 'HZS', 'Houston Outlaws', 'HOU', 'London Spitfire', 'LDN',
  'Los Angeles Gladiators', 'LA Gladiators', 'LAG', 'GLA',
  'Los Angeles Valiant', 'LA Valiant', 'LAV', 'New York Excelsior', 'NY Excelsior', 'NYXL', 'NYE',
  'Paris Eternal', 'PAR', 'Philadelphia Fusion', 'PHL Fusion', 'PHI',
  'San Francisco Shock', 'SF Shock', 'SFS', 'Seoul Dynasty', 'SEO',
  'Seoul Infernal', 'SIN', 'Shanghai Dragons', 'SH Dragon', 'SH Dragons', 'SHD', 'Toronto Defiant', 'TOR',
  'Vancouver Titans', 'VAN', 'Vegas Eternal', 'VEG', 'Washington Justice', 'WAS'
];
const esportsSkinPattern = new RegExp(
  `\\b(?:OW[12]\\s+)?(?:${skinNamesSource(owlTeamNames.filter(name => name.includes(' ')))})(?:\\s+20\\d{2})?(?![A-Za-z0-9_])`, 'gi');
const esportsAliasPattern = new RegExp(
  `\\b(?:OW[12]\\s+)?(?:${skinNamesSource(owlTeamNames.filter(name => !name.includes(' ')))})(?:\\s+20\\d{2})?(?![A-Za-z0-9_])`, 'g');
const specialSkinRules = [
  {
    // Protect the amount and currency together, before league names.
    pattern: /\b(?:\d+(?:[,\u00a0\u202f ]\d{3})*(?:\.\d+)?\s+)?(?:OWL\s+Tokens?|Mythic\s+Prisms?)(?![A-Za-z0-9_])/gi,
    className: 'ac-special-currency'
  },
  {
    pattern: /\b(?:[\p{L}\p{N}](?:[\p{L}\p{N}'’.-]|&#0?39;|&apos;)*(?:\s+(?:(?:&amp;|&)\s+)?)){1,12}Bundle\b/giu,
    className: 'ac-special-skin-bundle'
  },
  {
    pattern: /\b(?:Illidan(?:\s+Genji)?|Tyrande(?:\s+Symmetra)?|Frostmourne(?:\s+Weapon)?|BlizzCon\s+Virtual\s+Ticket\s+2016|BlizzCon(?:\s+2016)?\s+Bastion|BlizzCon(?:\s+2017)?\s+Winston)(?![A-Za-z0-9_])/gi,
    className: 'ac-special-skin-ultra-rare'
  },
  {
    pattern: /\b(?:Noire(?:\s+Widow(?:maker)?(?:\s+Skin)?)?|Demon\s+Hunter(?:\s+Sombra)?)(?![A-Za-z0-9_])/gi,
    className: 'ac-special-skin-collector'
  },
  {
    pattern: /\b(?:Pink\s+Mercy|Rose\s+Gold(?:\s+Mercy)?|(?:LEGO\s+)?Brick(?:\s+Bastion)?|Pink)(?![A-Za-z0-9_])(?=\s*(?:$|[,/;:•(<]|&(?:amp;)?|Bundle\b|Skin\b|Mega\b|Ultra\b))/gi,
    className: 'ac-special-skin-ultra-rare'
  },
  { pattern: skinNamesPattern(rareSkinNames), className: 'ac-special-skin-rare' },
  { pattern: /\bMM\b/g, className: 'ac-special-skin-rare' },
  { pattern: /\bRoyal\s*\(\s*(?:LA|Los\s+Angeles)\s+Gladiators\s*\)/gi, className: 'ac-special-skin-rare' },
  {
    pattern: /\b(?:(?:20\d{2}\s+)?(?:Atlantic|Pacific)\s+All[-\s]+Stars?|All[-\s]+Stars)(?:\s+Skins?)?(?![A-Za-z0-9_])/gi,
    className: 'ac-special-skin-rare'
  },
  { pattern: /\bNerf\s+(?:Gelfire\s+Pro|Sungerang|Slingerang)(?:\s+Weapon)?\b/gi, className: 'ac-special-weapon-nerf-gelfire' },
  { pattern: /\bHard\s+Light\s+Weapon\b/gi, className: 'ac-special-weapon-hard-light' },
  { pattern: /\bLos\s+Muertos\s+Weapon\b/gi, className: 'ac-special-weapon-los-muertos' },
  // Complete shop titles such as Gilded Hunter / Owl Guardian must win
  // before the broader Mythic aspect Gilded or the league acronym OWL.
  { pattern: skinNamesPattern(shopSkinNames), className: 'ac-special-skin-shop' },
  // Short collaboration titles must not recolor hero names or a Mythic title.
  {
    // Match context as text: Safari 14 cannot parse RegExp lookbehind.
    pattern: /\b(?:(?:Junker|Junk)\s+Queen|Divine\s+Druid|Queen|Druid|Skull(?=\s*(?:Genji\b|Bundle\b|$)))(?![A-Za-z0-9_])/gi,
    excludeMatch: /^(?:(?:Junker|Junk)\s+Queen|Divine\s+Druid)$/i,
    className: 'ac-special-skin-shop'
  },
  {
    pattern: /\b(?:Heart\s+of\s+Hope|Tokyo\s+Rebel|Void\s+Dancer|Cyber\s+Demon|Zeus|Amaterasu|Galactic\s+Emperor|Adventurer|A-7000\s+Wargod|Onryō|Grand\s+Beast|Ancient\s+Caller|Vengeance|Calamity\s+Empress|Anubis|Spellbinder|Thor|Pixiu|Horang|Ultraviolet\s+Sentinel|Divine\s+Druid|Cyber\s+Fuel|Divine\s+Desperado|Magma\s+Titan|Celestial\s+Guardian|Hop\s+Online!|Volted\s+Overdrive|Ra|Ascendant\s+Phoenix|World\s+Forger|Bound\s+Demon|Midnight\s+Sun|Deliverance|Lead\s+Rose|Dame\s+Chance|Merciful\s+Magitech|Steel\s+Death|Gilded|Iridescent|Dawn|Blazing\s+Sunsetter|Spirit\s+Keeper|Star\s+Shooter|Sumi-ichimonji|Koi\s+of\s+Duality|Capsule\s+Cannon|Eternal\s+Crystal|Treblemaker)(?![A-Za-z0-9_])(?:\s*\((?:Iridescent|Gilded|Dawn)\))?/gi,
    className: 'ac-special-skin-mythic'
  },
  { pattern: esportsSkinPattern, className: 'ac-special-skin-esports' },
  { pattern: esportsAliasPattern, className: 'ac-special-skin-esports' },
  {
    pattern: /\b(?:OW[12]\s+)?(?:OWCS|OWWC|OWL(?!\s+Tokens\b)|Overwatch\s+(?:League|Champions\s+Series|World\s+Cup)|(?:Overwatch\s+)?Contenders|League\s+White\s*\/\s*Gr[ae]y\s+Skins?)(?:\s+20\d{2})?(?![A-Za-z0-9_])/gi,
    className: 'ac-special-skin-esports'
  }
];
// Hero ownership matters: Brick/Pink are also ordinary names on other heroes.
// These are display constraints, not changes to the catalog or account ownership.
const identityKey = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const heroAliases = {
  dva:['D.Va','D Va'], wreckingball:['Wrecking Ball','Hammond','Ball'], junkerqueen:['Junker Queen','Junk Queen','JQ'],
  reinhardt:['Reinhardt','Rein'], roadhog:['Roadhog','Hog'], ramattra:['Ramattra','Ram'], doomfist:['Doomfist','Doom'],
  soldier76:['Soldier: 76','Soldier 76','Soldier','S76'], sojourn:['Sojourn','Soj'], torbjorn:['Torbjörn','Torbjorn','Torb'],
  widowmaker:['Widowmaker','Widow'], junkrat:['Junkrat','Junk'], cassidy:['Cassidy','Cass','McCree'],
  symmetra:['Symmetra','Sym'], baptiste:['Baptiste','Bap'], brigitte:['Brigitte','Brig'],
  lifeweaver:['Lifeweaver','Life Weaver','LW'], zenyatta:['Zenyatta','Zen'], lucio:['Lúcio','Lucio'], kiriko:['Kiriko','Kiri'],
  sigma:['Sigma','Sig']
};
const heroNames = ['Winston','Orisa','Zarya','Mauga','Hazard','Bastion','Genji','Hanzo','Mei','Pharah','Reaper','Sombra',
  'Tracer','Venture','Vendetta','Ashe','Echo','Freja','Mercy','Moira','Ana','Illari','Juno','Wuyang',
  'Anran','Emre','Sierra','Shion','D.Mon','Jetpack Cat'];
heroNames.forEach(name => { heroAliases[identityKey(name)] = [name]; });
const heroSource = Object.values(heroAliases).flat().sort((a,b) => b.length-a.length)
  .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g,'\\s*')).join('|');
const heroSequence = new RegExp(`^(?:${heroSource})(?:(?:\\s*(?:/|\\\\|&|and)\\s*|\\s+)(?:${heroSource}))*$`, 'i');
function heroKeys(text) {
  const source = String(text || '').trim();
  if (!heroSequence.test(source)) return [];
  const found = source.match(new RegExp(heroSource, 'gi')) || [];
  return found.map(name => Object.keys(heroAliases).find(key => heroAliases[key].some(alias => identityKey(alias) === identityKey(name)))).filter(Boolean);
}
const ownedNames = new Map();
function own(names, heroes) { names.split('|').forEach(name => ownedNames.set(identityKey(name), heroes.map(identityKey))); }
own('Pink|Pink Mercy|Rose Gold|Rose Gold Mercy', ['Mercy']);
own('Brick|LEGO Brick|Brick Bastion|LEGO Brick Bastion', ['Bastion']);
own('Illidan|Illidan Genji', ['Genji']); own('Tyrande|Tyrande Symmetra', ['Symmetra']);
own('Noire|Noire Widow|Noire Widowmaker|Noire Widowmaker Skin', ['Widowmaker']);
own('Demon Hunter|Demon Hunter Sombra', ['Sombra']);
own('BlizzCon Bastion|BlizzCon 2016 Bastion|BlizzCon Virtual Ticket 2016', ['Bastion']);
own('BlizzCon Winston|BlizzCon 2017 Winston', ['Winston']);
own('Frostmourne|Frostmourne Weapon', ['Ana']);
own('Royal Knight|Royal Gladiator|Royal (LA Gladiators)|Royal (Los Angeles Gladiators)', ['Mercy']);
own('Midas', ['Roadhog']); own('Ange de la Mort|Sylvanas|Sylvanas Windrunner', ['Widowmaker']);
own('Pirate Ship', ['Bastion']); own('Dallas Happi|Shanghai Happi|Happi|Dallas Summer|Shanghai Summer|Crimson Summer', ['Genji']);
own('Rock Climber|Charged Climber|Reigning Climber', ['Zarya']);
own('Chained King|Tiger Luchador|Lion Luchador|Luchador', ['Reaper']); own('Wicked|Wicked Reign', ['Moira']);
own('Clockwork|Zen-Nakji', ['Zenyatta']); own('Thunder', ['Doomfist']); own('Flying Ace', ['Winston']);
own('Zhulong|Zhulang', ['Sombra']); own('Haroeris', ['Ana']); own('Good and Evil', ['Echo']);
own('MM|MM-Mei', ['Mei']); own('Mayhem Biker|Mayhem Biker: 76', ['Soldier 76']);
own('Boleiro', ['Lucio']); own('GOAT|GOATS', ['Brigitte']);
own('2018 Pacific All-Stars', ['Genji']); own('2018 Atlantic All-Stars', ['Tracer']);
own('2019 Pacific All-Stars', ['Lucio']); own('2019 Atlantic All-Stars', ['Mercy']);
own('2020 Pacific All-Stars', ['D.Va']); own('2020 Atlantic All-Stars', ['Reinhardt']);
own('All-Stars|All-Stars Skins', ['Genji','Tracer','Lucio','Mercy','D.Va','Reinhardt']);
own('Cyber Demon|Koi of Duality', ['Genji']); own('Zeus', ['Junker Queen']); own('Amaterasu', ['Kiriko']);
own('Galactic Emperor', ['Sigma']); own('Adventurer', ['Tracer']); own('A-7000 Wargod|Ra', ['Ana']);
own('Onryō|Tokyo Rebel', ['Hanzo']); own('Grand Beast', ['Orisa']); own('Ancient Caller', ['Moira']);
own('Vengeance|Celestial Guardian', ['Mercy']); own('Calamity Empress', ['Ashe']); own('Anubis', ['Reaper']);
own('Spellbinder|Void Dancer', ['Widowmaker']); own('Thor', ['Reinhardt']); own('Pixiu', ['Zenyatta']);
own('Heart of Hope', ['Juno']); own('Horang', ['D.Va']); own('Ultraviolet Sentinel', ['Sojourn']);
own('Divine Druid', ['Lifeweaver']); own('Cyber Fuel', ['Junkrat']); own('Divine Desperado', ['Cassidy']);
own('Magma Titan', ['Doomfist']); own('Hop Online!', ['Mei']); own('Volted Overdrive', ['Soldier 76']);
own('Ascendant Phoenix', ['Illari']); own('World Forger', ['Mauga']);
own('Sumi-ichimonji', ['Genji']); own('Merciful Magitech', ['Mercy']); own('Treblemaker', ['Lucio']);

function titleContext(source, offset, length) {
  // Preserve offsets, while semicolons in escaped entities are not list separators.
  const safe = source.replace(/&(?:#[0-9]+|#x[0-9a-f]+|amp|lt|gt|quot|apos);/gi,
    match => /^&amp;$/i.test(match) ? '&'+' '.repeat(match.length-1) : ' '.repeat(match.length));
  let before = safe.slice(0,offset).split(/[,;，；\n•+]|<br\s*\/?>/i).pop().trim();
  let after = safe.slice(offset+length).split(/[,;，；\n•+]|<br\s*\/?>/i)[0].trim();
  before = before.replace(/^[✨⭐✦✧🎁\s]+/, '').trim();
  if (before.includes(':')) before = before.slice(before.lastIndexOf(':')+1).trim();
  return {before, after};
}
function acceptMatch(rule, match, offset, source, context) {
  if (rule.excludeMatch && rule.excludeMatch.test(match)) return false;
  if (rule.className === 'ac-special-currency') return true;
  const parts = context?.hero
    ? {before:source.slice(0,offset).trim(), after:source.slice(offset+match.length).trim()}
    : titleContext(source,offset,match.length);
  const mythic = rule.className === 'ac-special-skin-mythic';
  const before = parts.before, after = parts.after.replace(mythic ? /^(?::|[-–—])\s*/ : /^:\s*/, '');
  const precedingHeroes = heroKeys(mythic ? before.replace(/\s*[-–—]\s*$/,'') : before), followingHeroes = heroKeys(after);
  const league = rule.className === 'ac-special-skin-esports';
  // A list's first item may follow season metadata, but arbitrary prose still fails.
  const seasonPrefix = mythic && !context?.hero &&
    /\b(?:Premium|Ultimate)\s+Battle\s+Pass\b/i.test(source.slice(0,offset)) &&
    /[-–—]\s*$/.test(before) &&
    !before.replace(/\b(?:and|seasons?)\b/gi,'').replace(/[\d\s,()\-–—]/g,'');
  const beforeAllowed = !before || precedingHeroes.length || seasonPrefix || (league && /^(?:OW[12]\s*)?(?:Away|Home)?\s*$/i.test(before));
  const afterAllowed = !after || followingHeroes.length ||
    /^\((?:Dallas\s*&\s*Shanghai)\)$/i.test(after) ||
    (league && /^(?:(?:20\d{2}|Home|Away|White|Gr[ae]y|Asia|Amer|Emea|Skins?)\s*)+$/i.test(after));
  if (!beforeAllowed || !afterAllowed) return false;
  const baseMatch = match.replace(/\s*\((?:Iridescent|Gilded|Dawn)\)$/i,'');
  const owners = ownedNames.get(identityKey(baseMatch.replace(/&#0?39;|&apos;/g,"'")));
  const explicitHeroes = context?.hero ? [identityKey(context.hero)] : [];
  // Canonicalize abbreviated stock hero names as well as structured hero names.
  const canonical = explicitHeroes.map(key => Object.keys(heroAliases).find(hero => hero===key || heroAliases[hero].some(alias => identityKey(alias)===key)) || key);
  if (owners && [...canonical,...precedingHeroes,...followingHeroes].some(hero => !owners.includes(hero))) return false;
  if (rule.className === 'ac-special-skin-mythic' && /^(?:Dawn|Gilded|Iridescent)$/i.test(baseMatch) &&
      [...canonical,...precedingHeroes,...followingHeroes].length && context?.rarity !== 'mythic') return false;
  if (context && context.rarity && context.rarity !== 'unknown' && context.rarity !== 'mythic' && rule.className === 'ac-special-skin-mythic') return false;
  return true;
}
// Keep a bundle in one span, inheriting its strongest configured tier.
function skinMatchClass(rule, match, context) {
  if (rule.className !== 'ac-special-skin-bundle') return rule.className;
  const title = match.replace(/\s+(?:(?:Mega|Ultra)\s+)?Bundle$/i, '').trim();
  const tierOrder = ['ultra-rare', 'collector', 'rare', 'mythic', 'esports', 'shop'];
  for (const tier of tierOrder) {
    const className = `ac-special-skin-${tier}`;
    if (specialSkinRules.some(candidate => {
      if (candidate.className !== className) return false;
      const result = new RegExp(candidate.pattern.source, candidate.pattern.flags.replace('g', '')).exec(title);
      return result && acceptMatch(candidate,result[0],result.index,title,context);
    })) {
      return className;
    }
  }
  return rule.className;
}
function escapeAccountText(value) {
        return String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      // Inventory data intentionally uses <br> for line breaks. Escape every
      // other tag first, then restore only this harmless formatting tag.
      function escapeAccountTextWithBreaks(value) {
        return escapeAccountText(value).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
      }
function formatName(rawName, context) {
  if (context && context.hero) {
    const name = escapeAccountText(rawName);
    const weapon = context.kind === 'weapon' || String(context.id || '').startsWith('weapon/');
    const lookupName = weapon && /^(?:Hard\s+Light|Los\s+Muertos)$/i.test(name) ? name+' Weapon' : name;
    let className = '';
    for (const rule of specialSkinRules) {
      const matches = lookupName.matchAll(new RegExp(rule.pattern.source,rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags+'g'));
      for (const match of matches) {
        if (acceptMatch(rule,match[0],match.index,lookupName,context)) {
          className = skinMatchClass(rule,match[0],context);
          break;
        }
      }
      if (className) break;
    }
    if (!className && context.rarity === 'mythic') className = 'ac-special-skin-mythic';
    return className ? `<span class="ac-special-skin ${className}">${name}</span>` : name;
  }
  let styled = escapeAccountText(rawName);
  let prefix = "__ROSHINE_NAME_";
  while (styled.includes(prefix)) prefix += "_";
  const protectedMatches = [];
  specialSkinRules.forEach(rule => {
    styled = styled.replace(rule.pattern, (match,offset,source) => {
      if (!acceptMatch(rule,match,offset,source)) return match;
      const token = prefix + protectedMatches.length + "__";
      protectedMatches.push({match, className:skinMatchClass(rule,match)});
      return token;
    });
  });
  protectedMatches.forEach((entry,index) => {
    styled = styled.replace(prefix + index + "__", '<span class="ac-special-skin ' + entry.className + '">' + entry.match + '</span>');
  });
  return styled;
}
return Object.freeze({rules:specialSkinRules,matchClass:skinMatchClass,acceptMatch,formatName,heroKeys,rareSkinNames,shopSkinNames,owlTeamNames});
});
