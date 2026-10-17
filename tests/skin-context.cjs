'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const visuals=require('../assets/skin-visuals.js');
const regular=[
 ['Tracer','Hot Pink','rare'],['Zarya','Brick','rare'],
 ['Cassidy','Royal','epic'],['Moira','Royal','rare'],['Reaper','Royal','rare'],
 ['Bastion','Dawn','rare'],['Orisa','Dawn','rare'],['Zarya','Dawn','epic'],
 ['Pharah','Anubis','epic'],['Zenyatta','Ra','legendary'],
 ['Brigitte','Ice Queen','epic'],['Junker Queen','Punker Queen','epic'],
 ['Symmetra','Cobra Queen','epic'],['Moira','Demon Queen','legendary'],['Echo','Slime Queen','epic'],
 ['Ana','Night Owl','legendary'],['Ana','Snow Owl','legendary'],['Lúcio','Snow Fox','legendary'],
 ['Zenyatta','Autumn Fox','legendary'],['Ana','Bog Witch','legendary'],
 ['Genji','Pink','legendary'],['Zarya','LEGO Brick','legendary'],['Mercy','Illidan','legendary'],
 ['Genji','Royal Guard','legendary'],['Tracer','Royal Blue','rare'],
 ['Mercy','Stadium All-Star','legendary'],['D.Va','2019 Atlantic All-Stars','legendary'],
 // Event / loot-box skins that share a shop or collab name (2026-10-17).
 ['Cassidy','Vigilante','legendary'],['Mercy','Witch','legendary'],['Torbjörn','Magni','legendary'],['Wrecking Ball','Ein','legendary']
];
for(const text of ['Vigilante Cassidy','Vigilante McCree','Witch Mercy','Magni Torbjörn','Ein Wrecking Ball'])
 assert(!visuals.formatName(text,{}).includes('ac-special-skin'),`${text} stays plain on stock cards`);
for(const [hero,name] of [['Genji','Vigilante'],['Kiriko','Witch'],['Torbjörn','Diamond Magni']]){
 assert(visuals.formatName(name,{hero,rarity:'legendary'}).includes('ac-special-skin-shop'),`${hero} / ${name} keeps the shop effect`);
 assert(visuals.formatName(name+' '+hero,{}).includes('ac-special-skin-shop'),`${name} ${hero} keeps the shop effect on stock cards`);
}
for(const [hero,name,rarity] of regular){
 const html=visuals.formatName(name,{hero,rarity});
 assert(!html.includes('ac-special-skin'),`${hero} / ${name} is not a configured special item: ${html}`);
}
const special=[
 ['Mercy','Pink','legendary','ultra-rare'],['Mercy','Pink Mercy','legendary','ultra-rare'],
 ['Mercy','Rose Gold','legendary','ultra-rare'],['Bastion','Brick','legendary','ultra-rare'],
 ['Genji','Illidan','legendary','ultra-rare'],['Symmetra','Tyrande','legendary','ultra-rare'],
 ['Mercy','Royal Knight','legendary','rare'],['Mercy','Royal Gladiator','legendary','rare'],
 ['Roadhog','Midas','legendary','rare'],['Zenyatta','Clockwork','legendary','rare'],
 ['Mei','MM-Mei','legendary','rare'],['Widowmaker','Noire','legendary','collector'],
 ['Sombra','Demon Hunter','legendary','collector'],['Ana','Ra','mythic','mythic'],
 ['Reaper','Anubis','mythic','mythic'],['Genji','Cyber Demon','mythic','mythic'],
 ['Ana','Future Mythic','mythic','mythic'],['Sombra','Gilded Hunter','legendary','shop'],
 ['Juno','Hello Kitty Skin','legendary','shop'],['Doomfist','Shango Reborn','legendary','shop'],
 ['Kiriko','Some New Bundle','legendary','bundle'],['Ana','Overwatch World Cup Emea','unknown','esports'],
 ['D.Va','Overwatch League Gray Away','unknown','esports'],['Hazard','Away OWCS','unknown','esports']
];
for(const [hero,name,rarity,tier] of special){
 const html=visuals.formatName(name,{hero,rarity});
 assert.equal(html,`<span class="ac-special-skin ac-special-skin-${tier}">${name}</span>`,`${hero} / ${name}`);
}
for(const name of ['Hot Pink','Hot Pink Tracer','Brick Zarya','Zarya Brick','Royal','Royal Moira','Night Owl Ana','Snow Fox Lucio','Ice Queen Brigitte','Anubis Pharah']){
 assert(!visuals.formatName(name).includes('ac-special-skin'),`Stock title must not be partially promoted: ${name}`);
}
for(const [name,tier] of [['Pink Mercy','ultra-rare'],['Brick Bastion','ultra-rare'],['Royal (LA Gladiators)','rare'],['Pink Tracer Bundle','bundle'],['Brick Zarya Bundle','bundle'],['Hot Pink Bundle','bundle']]){
 assert(visuals.formatName(name).includes('ac-special-skin-'+tier),`${name}: ${visuals.formatName(name)}`);
 if(tier==='bundle')assert(!visuals.formatName(name).includes('ultra-rare'),name);
}
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../acc_details/catalog.js'),'utf8'),context);
const catalog=context.window.HERO_GALLERY_CATALOG;
let colored=0;
for(const skin of catalog){
 const html=visuals.formatName(skin.name,skin);
 const plain=skin.name.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
 if(html!==plain){
  colored++;
  assert(/^<span class="ac-special-skin [\w-]+">/.test(html)&&html.endsWith('</span>'),`Only full item names may receive skin effects: ${skin.hero}/${skin.name}`);
  assert.equal(html.replace(/^<span[^>]*>/,'').replace(/<\/span>$/,''),plain);
 }
}
assert.equal(visuals.formatName('<img src=x onerror=alert(1)> Clockwork',{hero:'Zenyatta',rarity:'legendary'}),'&lt;img src=x onerror=alert(1)&gt; Clockwork');
assert.equal(visuals.formatName('Hard Light',{hero:'Reaper',kind:'weapon',rarity:'legendary'}),'<span class="ac-special-skin ac-special-weapon-hard-light">Hard Light</span>');
assert.equal(visuals.formatName('Los Muertos',{hero:'Junkrat',id:'weapon/Junkrat/Los_Muertos',rarity:'legendary'}),'<span class="ac-special-skin ac-special-weapon-los-muertos">Los Muertos</span>');
console.log(JSON.stringify({catalogEntries:catalog.length,colored,negativeCases:regular.length,positiveCases:special.length,fullTitleEffects:true}));
