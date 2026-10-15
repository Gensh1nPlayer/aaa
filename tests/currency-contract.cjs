'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/currency.js'), 'utf8');
const quotes = {EUR:0.9, GBP:0.8, CAD:1.4, AUD:1.5, AED:3.67, KRW:1300, JPY:150, CNY:7.2};
function harness({saved=null, languages=['en-US'], fetcher, blocked=false}={}) {
  let now = Date.parse('2026-10-16T12:00:00Z');
  const calls=[], events=[], documentEvents=[], timers=new Map(), domListeners=new Map(); let timerId=0;
  class Clock extends Date { static now() { return now; } }
  const window = {dispatchEvent:e=>events.push(e), addEventListener() {}};
  const storage = new Map(saved === null ? [] : [['roshine.currency', saved]]);
  Object.defineProperty(window,'localStorage',{get() { if(blocked) throw Error('denied'); return {getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}; }});
  const context = {window, document:{readyState:'loading',getElementById:()=>null,dispatchEvent:e=>documentEvents.push(e),addEventListener:(name,fn)=>domListeners.set(name,fn)}, navigator:{languages, language:languages[0]}, Date:Clock, Intl, AbortController,
    CustomEvent:class {constructor(type, options) {this.type=type;this.detail=options.detail;}},
    setTimeout:(fn,delay)=>{timers.set(++timerId,{fn,at:now+delay});return timerId;}, clearTimeout:id=>timers.delete(id),
    fetch:async (url,options)=>{calls.push({url,options});if(fetcher)return fetcher(url,options);return {ok:true,json:async()=>Object.entries(quotes).map(([quote,rate])=>({base:'USD',quote,rate,date:'2026-10-16'})),text:async()=> 'EUR'};}};
  vm.runInNewContext(source,context);
  return {api:window.RoshineCurrency,calls,events,documentEvents,storage,timers,ready:()=>domListeners.get('DOMContentLoaded')(), advance(ms) {now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn();}}};
}
test('saved choice wins; all nine symbols and one decimal; convert original USD each time',async()=>{
  const h=harness({saved:'EUR',languages:['ja-JP']});await h.api.init();
  assert.equal(h.api.code,'EUR');assert.equal(h.api.format(10),'€9.0');
  const expected={USD:'$10.0',EUR:'€9.0',GBP:'£8.0',CAD:'CA$14.0',AUD:'A$15.0',AED:'د.إ 36.7',KRW:'₩13,000.0',JPY:'¥1,500.0',CNY:'CN¥72.0'};
  for(const [code,value] of Object.entries(expected)){await h.api.select(code);assert.equal(h.api.format(10),value);}
  assert.equal(h.calls.length,1);assert.equal(h.storage.get('roshine.currency'),'CNY');
  assert.throws(()=>h.api.format('10'),/finite number/);assert.throws(()=>h.api.format(Infinity),/finite number/);
  assert.throws(()=>h.api.select('BTC'),/Unsupported/);
  assert(h.events.every(e=>e.type==='currencychange' && e.detail.code));
  assert(h.documentEvents.every(e=>e.type==='roshine:currency-changed' && e.detail.code));
  assert.equal(h.documentEvents.length,h.events.length);
  const {format}=h.api;assert.equal(format(10),'CN¥72.0');
});
test('DOMContentLoaded auto init uses the public event contract',async()=>{
  const h=harness({saved:'GBP'});assert.equal(h.calls.length,0);await h.ready();assert.equal(h.api.code,'GBP');assert.equal(h.documentEvents.at(-1).detail.code,'GBP');
});
test('browser regions in preference order; bare languages and unsupported regions do not guess',async()=>{
  for(const [languages,code] of [[['en-US'],'USD'],[['en-GB'],'GBP'],[['en-AU'],'AUD'],[['en-CA','en-US'],'CAD'],[['zh-Hans-CN'],'CNY'],[['en','ja-JP'],'JPY'],[['de-DE'],'EUR'],[['ar-AE'],'AED'],[['ko-KR'],'KRW'],[['en-u-rg-gbzzzz'],'EUR']]){
    const h=harness({languages});await h.api.init();assert.equal(h.api.code,code);assert(!h.calls.some(c=>c.url.includes('ipapi')) || languages[0]==='en-u-rg-gbzzzz');
  }
});
test('IP only when no browser match; invalid saved values ignored; default EUR on failure',async()=>{
  for(const ip of ['GBP','xxx',null]){
    const h=harness({saved:'BTC',languages:['en'],fetcher:async url=>{
      if(url.includes('ipapi')){if(ip===null)throw Error('offline');return {ok:true,text:async()=>ip};}
      return {ok:true,json:async()=>Object.entries(quotes).map(([quote,rate])=>({base:'USD',quote,rate,date:'2026-10-16'}))};
    }});await h.api.init();assert.equal(h.api.code,ip==='GBP'?'GBP':'EUR');assert.equal(h.calls.filter(c=>c.url.includes('ipapi')).length,1);
    assert(!h.storage.has('roshine.currency') || h.storage.get('roshine.currency')==='BTC','automatic detection is not a manual preference');
  }
  const blocked=harness({blocked:true,languages:['en-AU']});await blocked.api.init();await blocked.api.select('JPY');assert.equal(blocked.api.code,'JPY');
});
test('network failure displays USD, preserves preference and retries same selection',async()=>{
  let fail=true;
  const h=harness({saved:'EUR',fetcher:async()=>{if(fail)throw Error('offline');return {ok:true,json:async()=>[{base:'USD',quote:'EUR',rate:0.9,date:'2026-10-16'}]};}});
  await h.api.init();assert.equal(h.api.code,'USD');assert.equal(h.api.selectedCode,'EUR');assert.equal(h.api.status,'error');assert.equal(h.api.format(10),'$10.0');
  fail=false;await h.api.select('EUR');assert.equal(h.api.code,'EUR');assert.equal(h.calls.length,2);
});
test('malformed, old, future, missing and non-positive quotes never mislabel USD',async()=>{
  for(const row of [null,{base:'EUR',quote:'EUR',rate:0.9,date:'2026-10-16'},...['2026-09-01','2026-10-17','2026-02-30','invalid'].map(date=>({base:'USD',quote:'EUR',rate:0.9,date})),...[0,-1,'0.9',NaN,Infinity].map(rate=>({base:'USD',quote:'EUR',rate,date:'2026-10-16'}))]){
    const h=harness({saved:'EUR',fetcher:async()=>({ok:true,json:async()=>row?[row]:[]})});await h.api.init();assert.equal(h.api.code,'USD');assert.equal(h.api.format(10),'$10.0');
  }
});
test('fetch and observation timestamps expire honestly and switching refreshes',async()=>{
  const h=harness({saved:'EUR'});await h.api.init();assert.equal(h.api.rateDate,'2026-10-16');assert.equal(h.api.fetchedAt,'2026-10-16T12:00:00.000Z');
  h.advance(3600001);assert.equal(h.api.code,'USD');assert.equal(h.api.status,'stale');assert.equal(h.api.format(10),'$10.0');
  await h.api.select('EUR');assert.equal(h.api.code,'EUR');assert.equal(h.calls.length,2);
});
test('late FX and IP responses cannot override manual selection; init deduplicates',async()=>{
  let resolve;
  const h=harness({saved:'EUR',fetcher:()=>new Promise(r=>{resolve=r;})});const first=h.api.init();const second=h.api.init();
  await h.api.select('USD');resolve({ok:true,json:async()=>[{base:'USD',quote:'EUR',rate:0.9,date:'2026-10-16'}]});await Promise.all([first,second]);assert.equal(h.api.code,'USD');assert.equal(h.calls.length,1);
  let resolveIP;
  const ip=harness({languages:['en'],fetcher:()=>new Promise(r=>{resolveIP=r;})});const detecting=ip.api.init();await ip.api.select('USD');resolveIP({ok:true,text:async()=> 'JPY'});await detecting;assert.equal(ip.api.selectedCode,'USD');assert.equal(ip.calls.length,1);
});
test('concurrent non-USD selections share a fetch and last manual selection wins',async()=>{
  let resolve;
  const h=harness({languages:['en-US'],fetcher:()=>new Promise(r=>{resolve=r;})});await h.api.init();
  const first=h.api.select('EUR'),second=h.api.select('GBP');
  resolve({ok:true,json:async()=>[{base:'USD',quote:'EUR',rate:0.9,date:'2026-10-16'},{base:'USD',quote:'GBP',rate:0.8,date:'2026-10-16'}]});
  await Promise.all([first,second]);assert.equal(h.api.code,'GBP');assert.equal(h.api.format(10),'£8.0');assert.equal(h.calls.length,1);
});
test('timeout settles even when fetch ignores abort; HTTP errors do not convert',async()=>{
  const h=harness({saved:'EUR',fetcher:()=>new Promise(()=>{})});const pending=h.api.init();h.advance(8001);await pending;assert.equal(h.api.code,'USD');assert.equal(h.api.status,'error');
  const bad=harness({saved:'EUR',fetcher:async()=>({ok:false,status:429})});await bad.api.init();assert.equal(bad.api.code,'USD');
});
module.exports={harness};
