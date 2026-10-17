'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=file=>fs.readFileSync(path.join(root,file),'utf8');
const context={window:{}};vm.runInNewContext(source('assets/zh-cn.js'),context);
const zh=context.window.RoshineZh;
function literal(file,name,indent){
  const match=source(file).match(new RegExp('const '+name+' = (\\{[\\s\\S]*?\\n'+indent+'\\});'));
  assert(match,'dictionary '+file+'/'+name);return vm.runInNewContext('('+match[1]+')').en;
}
function compare(en,translated,label){
  assert(translated!==undefined,'missing Chinese '+label);
  if(typeof en==='string'){assert.equal(typeof translated,'string',label);if(en && label!=='auth.privacyHint')assert(translated.length,label);for(const p of en.match(/\{\w+\}/g)||[])assert(translated.includes(p),'placeholder '+label+' '+p);return;}
  for(const key of Object.keys(en))compare(en[key],translated[key],label+'.'+key);
}
for(const [file,name,indent,section]of [['assets/main.js','i18n','    ','main'],['assets/main.js','accountUiI18n','    ','inventory'],['assets/redesign.js','copy','  ','redesign'],['assets/policy.js','copy','  ','policy'],['auth/index.html','i18n','    ','auth']])compare(literal(file,name,indent),zh[section],section);
const removed=new Set(['Skin images reference',', with additional entries from the','Weapon skin names and images reference','. Ownership comes only from the account snapshot.','Preview image ↗','Original image ↗','Catalog source ↗']);
const entries=source('acc_details/i18n.js').match(/const entries = (\{[\s\S]*?\n  \});/);
const english=vm.runInNewContext('('+entries[1]+')');
for(const key of Object.keys(english))if(!removed.has(key))assert(zh.details[key],'missing details Chinese: '+key);
for(const file of ['index.html','acc_details/index.html','auth/index.html','privacy/index.html','terms/index.html','404.html']){
  const text=source(file);assert.equal((text.match(/data-language-value="zh"/g)||[]).length,1,file+' one Chinese option');
  assert(text.indexOf('data-language-value="zh"')>text.indexOf('data-language-value="ja"'),file+' Chinese after Japanese');
  assert(text.indexOf('/assets/zh-cn.js')<text.indexOf('</head>'),file+' Chinese copy available before app initialization');
}
console.log('PASS: complete Chinese UI dictionaries, placeholders, policies, details and six menus.');
