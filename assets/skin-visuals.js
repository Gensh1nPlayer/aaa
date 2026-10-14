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
  'Haroeris', 'Dance Party', 'Good and Evil', 'Mayhem Biker', 'Zen-Nakji',
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
  'Hello Kitty', 'Cinnamoroll', 'Pompompurin', 'My Melody', 'Kuromi', 'Keroppi',
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
  // Collection titles and individual skins; visual grouping is not a claim of exclusivity.
  'YoRHa', 'Project YoRHa', 'LE SSERAFIM Mega', 'Blue Flame', 'Fawksey James',
  'exo-FAUNA', 'exo-L2PUS', 'exo-L5O', 'exo-L50', 'exo-PANT6RA', 'exo-URS4', 'exo-VU7PES',
  'White Rabbit', 'Raging Rabbit', 'Bunny Business', 'Siberian Hare',
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
  'Butcher', 'Barbarian', 'Nightraven', 'Hatred’s Reckoning', "Hatred's Reckoning",
  'Lich Queen', 'Devourer', 'Xal’atath', "Xal'atath", 'Blackhand', 'Sin’dorei', "Sin'dorei", 'Magni',
  'Feria Shen', 'Wei Qing', 'Shayol Wei', 'Viper Ning', 'Yueshan', 'Wuchen', 'Scarlet Bride',
  'YOASOBI', 'Dragon Star', 'Spirit Star', 'Fire Star', 'Fox Star', 'Space Star', 'Date Night', 'Scuba'
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
    pattern: /\b(?:Illidan(?:\s+Genji)?|Tyrande(?:\s+Symmetra)?|BlizzCon\s+Virtual\s+Ticket\s+2016|BlizzCon(?:\s+2016)?\s+Bastion|BlizzCon(?:\s+2017)?\s+Winston)(?![A-Za-z0-9_])/gi,
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
  { pattern: /\bRoyal(?=\s*(?:\(|$|[,/;•<]))/gi, className: 'ac-special-skin-rare' },
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
    pattern: /\b(?:Heart\s+of\s+Hope|Tokyo\s+Rebel|Void\s+Dancer|Cyber\s+Demon|Zeus|Amaterasu|Galactic\s+Emperor|Adventurer|A-7000\s+Wargod|Onryō|Grand\s+Beast|Ancient\s+Caller|Vengeance|Calamity\s+Empress|Anubis|Spellbinder|Thor|Pixiu|Horang|Ultraviolet\s+Sentinel|Divine\s+Druid|Cyber\s+Fuel|Divine\s+Desperado|Magma\s+Titan|Celestial\s+Guardian|Hop\s+Online!|Volted\s+Overdrive|Ra|Ascendant\s+Phoenix|World\s+Forger|Bound\s+Demon|Midnight\s+Sun|Deliverance|Lead\s+Rose|Dame\s+Chance|Merciful\s+Magitech|Steel\s+Death|Gilded|Iridescent|Dawn|Blazing\s+Sunsetter|Spirit\s+Keeper|Star\s+Shooter|Sumi-ichimonji|Koi\s+of\s+Duality|Capsule\s+Cannon|Eternal\s+Crystal)(?![A-Za-z0-9_])/gi,
    className: 'ac-special-skin-mythic'
  },
  { pattern: esportsSkinPattern, className: 'ac-special-skin-esports' },
  { pattern: esportsAliasPattern, className: 'ac-special-skin-esports' },
  {
    pattern: /\b(?:OW[12]\s+)?(?:OWCS|OWWC|OWL(?!\s+Tokens\b)|Overwatch\s+(?:League|Champions\s+Series|World\s+Cup)|(?:Overwatch\s+)?Contenders|League\s+White\s*\/\s*Gr[ae]y\s+Skins?)(?:\s+20\d{2})?(?![A-Za-z0-9_])/gi,
    className: 'ac-special-skin-esports'
  }
];
// Keep a bundle in one span, inheriting its strongest configured tier.
function skinMatchClass(rule, match) {
  if (rule.className !== 'ac-special-skin-bundle') return rule.className;
  const tierOrder = ['ultra-rare', 'collector', 'rare', 'mythic', 'esports', 'shop'];
  for (const tier of tierOrder) {
    const className = `ac-special-skin-${tier}`;
    if (specialSkinRules.some(candidate => {
      if (candidate.className !== className) return false;
      const result = new RegExp(candidate.pattern.source, candidate.pattern.flags.replace('g', '')).exec(match);
      return result && !(candidate.excludeMatch && candidate.excludeMatch.test(result[0]));
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
function formatName(rawName) {
  let styled = escapeAccountText(rawName);
  let prefix = "__ROSHINE_NAME_";
  while (styled.includes(prefix)) prefix += "_";
  const protectedMatches = [];
  specialSkinRules.forEach(rule => {
    styled = styled.replace(rule.pattern, match => {
      if (rule.excludeMatch && rule.excludeMatch.test(match)) return match;
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
return Object.freeze({rules:specialSkinRules,matchClass:skinMatchClass,formatName,rareSkinNames,shopSkinNames,owlTeamNames});
});

