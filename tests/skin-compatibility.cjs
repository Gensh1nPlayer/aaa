const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/main.js'), 'utf8');
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert(a >= 0 && b > a, `Missing source seam: ${start}`);
  return source.slice(a, b);
}
const api = vm.runInNewContext(`(() => {
  ${section('const skinNamesSource', 'const specialWeaponChoicePattern')}
  ${section('const specialWeaponChoicePattern', 'function highlightRankText')}
  ${section('function escapeAccountText(value)', 'function safeExternalUrl')}
  ${section('const heroAliasPatterns', 'const highlightLines')}
  return { styleSkinItem, styleSkinDescriptionLine, applyColorMap, rareSkinNames, shopSkinNames, owlTeamNames };
})()`);
const cases = [
  ['Blizzard Mythic Gift', 'shop'],
  ['Blizzard Mythic Gift — Choose 1 Mythic Skin', 'shop'],
  ['Blizzard Mythic Gift - Any 1 Mythic Skin', 'shop'],
  ['10-Years Cheers Tracer', 'shop'], ['Comic Book Tracer', 'shop'],
  ['Cupid Hanzo', 'shop'], ['Cupid', 'shop'],
  ['Cupid Bundles', 'shop'], ['Cupid Kiriko Bundle', 'shop'],
  ['Cupid Juno Bundle', 'shop'], ['Charming Soldier: 76', 'shop'],
  ...['YoRHa Mega Bundle', 'LE SSERAFIM Ultra Bundle', 'LE SSERAFIM FEARLESS Mega Bundle',
    'LE SSERAFIM Mega', 'exo-FAUNA Mega Bundle', 'White Rabbit Mega Bundle',
    'Ultrawatch Mega Bundle', 'Lifeguard Mega Bundle', 'My Hero Academia Mega Bundle',
    'Masked Mischief Mega Bundle', 'asked Mischief Mega Bundle', 'Witches Mega Bundle',
    'Black Cats Mega Bundle', "Hatred's Reckoning Mega Bundle", "Xal'atath Symmetra Bundle",
    'Druid Mauga', 'Skull Genji'].map(name => [name, 'shop']),
  ['Blue Flame Kiriko', 'shop'], ['exo-L2PUS Ashe', 'shop'],
  ['Raging Rabbit Vendetta', 'shop'], ['Cyber Oni Hanzo', 'shop'],
  ['Black Cat Mercy', 'shop'], ['Ultrawatch Ana', 'shop'],
  ['Lifeguard Kiriko', 'shop'], ['Infernal Witch Symmetra', 'shop'],
  ['Garou Wuyang', 'shop'], ['Mephisto Ramattra', 'shop'],
  ['Wing Zero Mercy', 'shop'], ['Snake Eyes Genji', 'shop'],
  ['Queen D.Va Bundle', 'shop'], ['Divine Druid Mercy', 'mythic'],
  ['Pink', 'ultra-rare'], ['Pink Mercy', 'ultra-rare'], ['Rose Gold Mercy', 'ultra-rare'],
  ['Brick', 'ultra-rare'], ['LEGO Brick', 'ultra-rare'], ['LEGO Brick Bastion', 'ultra-rare'],
  ['Illidan Genji', 'ultra-rare'], ['Tyrande Symmetra', 'ultra-rare'],
  ['BlizzCon Virtual Ticket 2016', 'ultra-rare'],
  ['blizzcon  virtual ticket 2016', 'ultra-rare'],
  ['BlizzCon Virtual Ticket 2016 Bundle', 'ultra-rare'],
  ['MM', 'rare'], ['Royal (LA Gladiators)', 'rare'], ['Chained  King Reaper', 'rare'],
  ['Happi (Dallas & Shanghai)', 'rare'], ['2019 Atlantic All-Stars Mercy', 'rare'],
  ['2020 Atlantic All-Stars Rein', 'rare'], ['2020 Pacific All-Stars D.Va', 'rare'],
  ['All-Stars Skins', 'rare'], ['Midas Roadhog', 'rare'],
  ['OW1 SFS 2018 Hanzo/Rein', 'esports'], ['OW1 Contenders Sigma', 'esports'],
  ['OWCS 2024 Orisa', 'esports'], ['OWWC Bap', 'esports'], ['OWL Soldier: 76', 'esports'],
  ['Pink Mercy Bundle', 'ultra-rare'], ['Royal Knight Mercy Bundle', 'rare'],
  ['Nyan Café Kiriko Bundle', 'shop'], ['Hello Kitty and Friends Mega Bundle', 'shop'],
  ['Formalwear Mega Bundle', 'shop'], ['unknown future bundle', 'bundle'],
  ['Juri Kiriko Bundle', 'shop'], ['Himiko Toga Kiriko Bundle', 'shop'],
  ['Ashe LE SSERAFIM FEARLESS Bundle', 'shop'], ['Cyber Demon Genji', 'mythic'],
  ['Galactic Emperor Sigma', 'mythic'], ['Heart of Hope Juno', 'mythic'],
  ['Tokyo Rebel Hanzo', 'mythic'], ['Void Dancer Widowmaker', 'mythic'],
  ['Nerf Sungerang Weapon: Genji', 'weapon-nerf-gelfire'],
  ['Nerf Gelfire Pro Weapon: Tracer', 'weapon-nerf-gelfire'],
  ['Nerf Slingerang Weapon: Genji', 'weapon-nerf-gelfire'],
  ['OWL Guardian Mercy', 'shop'], ['Gilded Hunter Sombra', 'shop'],
  ['Hard Light Weapon: Rein', 'weapon-hard-light'], ['Noire Widow', 'collector'],
  ...api.rareSkinNames.map(name => [name, 'rare']),
  ...api.shopSkinNames.map(name => [name, 'shop']),
  ...api.owlTeamNames.map(name => [name + ' Tracer', 'esports'])
];
let tested = 0;
for (const [name, tier] of cases) {
  const html = api.styleSkinItem(name);
  const expectedClass = tier.startsWith('weapon-') ? `ac-special-${tier}` : `ac-special-skin-${tier}`;
  assert(html.includes(expectedClass), `${name} -> ${html}; expected ${tier}`);
  assert(api.applyColorMap(name).includes(expectedClass), `Non-sparkle rendering: ${name}`);
  assert(!/__SPECIAL_SKIN_\d+__/.test(html), `Leaked placeholder: ${name}`);
  if (/Bundle/i.test(name)) {
    assert.equal((html.match(/class="ac-special-skin /g) || []).length, 1, `Split bundle: ${name}`);
  }
  tested++;
}
for (const text of ['Junker Queen', 'Junker  Queen', 'Junk Queen', 'Pink Cat', 'Brickhouse', 'MMR: Gold', 'was sold', 'All-Star Cassidy (Stadium)', 'Shockwave', 'Fuel', 'Mythical', 'Credit', 'D.Va Doom Hazard Genji Torb Ana Brig Juno Kiriko Wuyang']) {
  assert(!api.styleSkinItem(text).includes('class="ac-special-skin '), `False positive: ${text}`);
  tested++;
}
const examples = [
  '✨ Fenrir Reaper, Infinite Guard: 76',
  '✨ OW1 Team Skin: Seoul Dynasty Tracer',
  '✨ OWCS: D.Va Doom Hazard Genji Torb Ana Brig Juno Kiriko Wuyang',
  '✨ OWL Collection: OW1 SFS Doom/Pharah, LA Gladiators JQ/Ram/Zarya/Ana, Dallas Fuel Ball, Guangzhou Charge Pharah, OWCS Bap/Wuyang/Widow, OWWC Bap, OW1 Seoul Dynasty D.Va, OW1 Toronto Defiant D.Va/Widow, OWCS 2024 Orisa, OW1 LA Valiant Orisa, New York Excelsior Rein, OWL Soldier: 76, OW1 Houston Outlaws Zen',
  '✨ OWL Collection: OWWC Junk Queen, OWCS Mauga/Widow/Bap, OWCS 2024 Orisa, OW1 Vancouver Titans Orisa, OW1 Hangzhou Spark Rein, OW1 SFS 2018 Hanzo/Rein, OW1 Contenders Sigma, Chengdu Hunters Winston/Bastion, OW1 LA Valiant Winston, Vegas Eternal Ball, London Spitfire Ashe/Genji, OWL Bastion, Guangzhou Charge Bastion, LA Gladiators Pharah, OW1 LA Valiant 2018 Tracer, OW1 Paris Eternal Widow',
  '✨ OW1 League White/Gray Skins: D.Va，Ball，Ashe，Bastion，Genji，Hanzo，Mei，Tracer，Ana，Brig，Mercy，Zen'
];
for (const line of examples) {
  const html = api.styleSkinDescriptionLine(line);
  assert(html.includes('✨</span> '), 'Sparkle spacing regressed');
  assert(!/__SPECIAL_SKIN_\d+__/.test(html), 'Leaked placeholder');
  if (line.includes('OWL') || line.includes('OWCS') || line.includes('Team Skin')) assert(html.includes('ac-special-skin-esports'));
  tested++;
}
for (const text of ['2,100 OWL Tokens', '80 Mythic Prisms', '2100 OWL Tokens', '2\u202f100 OWL Tokens', 'OWL Tokens']) {
  for (const render of [api.applyColorMap, api.styleSkinItem]) {
    const html = render(text);
    assert(html.includes(`class="ac-special-skin ac-special-currency">${text}</span>`), `Currency amount split: ${html}`);
    assert(!html.includes('ac-special-skin-esports'), `Currency became esports: ${html}`);
  }
  tested++;
}
const unsafe = api.styleSkinItem('<img src=x onerror=alert(1)> Pink Mercy');
for (const name of ['Cupid Bundles', 'Cupid Kiriko Bundle', 'Cupid Juno Bundle', 'Charming Soldier: 76']) {
  const html = api.styleSkinDescriptionLine('✨ ' + name);
  assert(html.includes('ac-special-skin-shop'), name);
  assert.equal(html.replace(/<[^>]+>/g, ''), '✨ ' + name, 'Preserve complete title');
  assert(!html.includes('ac-skin-category'), 'Soldier colon is not a category');
}
assert(!unsafe.includes('<img'), 'Inventory HTML escaped');
assert(unsafe.includes('&lt;img'), 'Original text is retained safely');
tested++;
const lineHtml = api.styleSkinDescriptionLine(examples[2]);
assert(!lineHtml.includes('ac-skin-name'), 'Plain OWCS hero sequence must stay neutral');
assert(!api.styleSkinDescriptionLine('✨ OWL Soldier: 76').includes('ac-skin-category'), 'Soldier: 76 is not a category heading');
assert(api.styleSkinDescriptionLine('✨ Pink Mercy，Brick; Midas').includes('，'), 'Original punctuation is retained');
console.log(JSON.stringify({passed:tested,rareAliases:api.rareSkinNames.length,shopAliases:api.shopSkinNames.length,teamAliases:api.owlTeamNames.length}));
if (process.argv.includes('--fixtures')) {
  console.log(JSON.stringify({cases:cases.slice(0,36).map(([name,tier]) => ({name,tier,html:api.styleSkinDescriptionLine('✨ ' + name)})),examples:examples.map(name => ({name,html:api.styleSkinDescriptionLine(name)}))}));
}


for (let level = 2; level <= 5; level++) {
  for (const label of ['Endorsement Level ', 'Endorsement Lv. ', 'endorsement lv ']) {
    const html = api.applyColorMap(label + level);
    assert.equal(html, '<span class="ac-endorsement-' + level + '">Endorsement Lv. ' + level + '</span>');
  }
}
assert(!api.applyColorMap('Endorsement Level 20').includes('ac-endorsement'));
assert.equal(api.applyColorMap('Endorsement Level 1'), 'Endorsement Lv. 1');
for (const name of ["Cyber Detective","Hashimoto","Music Festival","Archangel","Yatagarasu","Water Warrior","Bai Ze","Inari","Sea Soldier","Azure Drake","8-Bit","Vigilante","Lucky Lioness"]) {
  assert(api.styleSkinItem(name).includes('ac-special-skin-shop'), name);
  assert(!api.applyColorMap(name + 'xyz').includes('ac-special-skin-shop'), name + ' boundary');
}

// iOS 14 cannot parse lookbehind and has no Array.prototype.at.
assert(!/\(\?<[=!]/.test(source), 'RegExp lookbehind breaks iOS 14 parsing');
assert(!/\.at\s*\(/.test(source), 'Array.at breaks Safari 14 menu keyboard navigation');
for (const text of ['Junker Queen Bundle', 'Junk Queen Bundle']) {
  assert(!api.styleSkinItem(text).includes('ac-special-skin-shop'), text);
}
for (const text of ['Queen D.Va', 'Druid Mauga', 'Skull Genji']) {
  assert(api.styleSkinItem(text).includes('ac-special-skin-shop'), text);
}
for (const text of ['Divine Druid Mercy', 'Divine Druid Mercy Bundle']) {
  assert(api.styleSkinItem(text).includes('ac-special-skin-mythic'), text);
}
console.log('Safari 14 syntax and contextual skin rules passed.');
