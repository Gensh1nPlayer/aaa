const assert = require('node:assert/strict');
const {parseLevel, levelHTML, stockTags, isPremium} = require('../assets/account-display.js');
for (const [raw, main, version] of [['111 - OW2','111','OW2'],['111 - OW1','111','OW1'],['1 + 222 - OW1','1 + 222','OW1']]) {
  assert.equal(parseLevel(raw).raw, raw);
  assert.equal(parseLevel(raw).main, main);
  assert.deepEqual(parseLevel(raw).versions, [version]);
  assert.equal(levelHTML(raw).main, 'Lv. '+main);
}
assert.equal(parseLevel(' 1 + 222 - OW1 SilverBorder Stacked Account ').main,'1 + 222');
assert.deepEqual(stockTags({level:'1 + 222 - OW1 SilverBorder Stacked Account',price:'$100'}).map(t=>t.text),['Premium Account','Silver Border','Stacked Account']);
assert.equal(stockTags({price:'$99'}).length,0);
assert(levelHTML('<img src=x onerror=alert(1)> - OW2').main.includes('&lt;img'));
assert.equal(parseLevel(0).main,'0');
assert.equal(parseLevel('111 +').main,'111 +');
assert.equal(parseLevel('111 - OW1 Premium Account').main,'111');
assert.deepEqual(parseLevel('111 - OW1 Premium').tags,[{text:'Premium Account',className:'premium'}]);
assert.equal(stockTags({level:'111 - OW1 Premium',price:'$100'}).length,1);
assert.equal(stockTags({price:'$20',rank:'No Top 500'}).length,0);
assert.equal(stockTags({price:'$20',rank:'Top 500'}).length,1);
for (const rank of ['No Top 500','Not Top500','Without Top 500 eligible','Top 500: false','Top 500 - ineligible','Top 500 not eligible']) assert.equal(isPremium({price:'$20',rank}),false,rank);
for (const value of [true,2,'<b>eligible</b>','available','✓','free','Top500']) assert.equal(isPremium({top500Eligible:value}),true,String(value));
for (const value of [false,0,-1,'unavailable','not eligible','none']) assert.equal(isPremium({top500Eligible:value}),false,String(value));
assert.equal(isPremium({price:'$100'}),true);
assert.equal(isPremium({price:'$99.99'}),false);
console.log('Details account display: compound levels, raw preservation, labels and escaping passed.');
