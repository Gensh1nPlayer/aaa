'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const context={window:{}};vm.runInNewContext(read('assets/zh-cn.js'),context);vm.runInNewContext(read('assets/game-terms.js'),context);
const languages=['fr','de','ar','ja'];
function compare(en,translated,label){
  assert.notEqual(translated,undefined,'missing '+label);
  assert.equal(typeof translated,typeof en,label+' type');
  if(typeof en==='string'){
    if(en)assert(translated.trim(),label+' empty');
    assert.deepEqual((translated.match(/\{\w+\}/g)||[]).sort(),(en.match(/\{\w+\}/g)||[]).sort(),label+' placeholders');
  }else for(const key of Object.keys(en))compare(en[key],translated[key],label+'.'+key);
}
for(const [file,name,indent]of [['assets/main.js','i18n','    '],['assets/main.js','accountUiI18n','    '],['assets/redesign.js','copy','  '],['assets/policy.js','copy','  '],['auth/index.html','i18n','    '],['assets/site-footer.js','copy','  ']]){
  const match=read(file).match(new RegExp('const '+name+' = (\\{[\\s\\S]*?\\n'+indent+'\\});'));
  assert(match,file+' dictionary');const copy=vm.runInNewContext('('+match[1]+')');
  for(const lang of languages)compare(copy.en,copy[lang],file+'/'+name+'/'+lang);
}
assert(read('assets/main.js').includes('credits:"Credits", coins:"Coins"'),'English currency labels remain English');
const zh=context.window.RoshineZh,t=context.window.RoshineGameTerms.translate;
assert.equal(zh.auth.panelTitle,'战网安全令');assert.equal(zh.auth.privacyHint,'');
assert.equal(zh.auth.intro,'输入账号信息里的40位安全令密钥获取战网验证码。');
assert.equal(zh.main.heroTitle,'帮你找到心仪账号');assert(zh.main.heroIntro.includes('排位解锁账号'));
assert(!/高余额账号|排位就绪|神话棱镜|银币|武器变体/.test(read('assets/zh-cn.js')));
assert.equal(zh.details.Credits,'经典货币');assert.equal(zh.details['Weapon Variants'],'武器涂装');
assert.equal(t('Rank Reset / Grandmaster 3 / Placement 0/10','zh'),'段位重置 / 宗师 3 / 定级赛 0/10');
assert.equal(t('Emerald 2 / Champion 5','zh'),'翡翠 2 / 英杰 5');
assert.equal(t('Rank Reset','en'),'Rank Reset');
for(const lang of [...languages,'zh']){assert.notEqual(t('Rank Reset',lang),'Rank Reset');assert.equal(t('account-194 / 111 + 222 - OW1',lang),'account-194 / 111 + 222 - OW1');}
console.log('PASS: all locale dictionary keys/types/placeholders, corrected Chinese terminology and lossless rank display.');
