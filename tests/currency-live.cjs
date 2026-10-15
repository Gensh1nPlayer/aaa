'use strict';
// Explicit, read-only smoke check; not part of deterministic tests.
// node tests/currency-live.cjs --live
// Requests FX quotes and only the IP currency field; never logs IP/location data.
const assert = require('node:assert/strict');
async function run(){
  if(!process.argv.includes('--live')){console.log('Skipped: pass --live for two read-only external GET requests.');return;}
  const currencies=['EUR','GBP','CAD','AUD','AED','KRW','JPY','CNY'];
  for(const [name,url] of [['fx','https://api.frankfurter.dev/v2/rates?base=USD&quotes='+currencies.join(',')],['ip','https://ipapi.co/currency/']]){
    const response=await fetch(url,{headers:{Origin:'https://roshine.love'},signal:AbortSignal.timeout(12000)});
    assert.equal(response.ok,true,`${name}: HTTP ${response.status}`);
    const cors=response.headers.get('access-control-allow-origin');assert(['*','https://roshine.love'].includes(cors),`${name}: CORS ${cors}`);
    if(name==='fx'){
      const rows=await response.json();
      for(const code of currencies){const row=rows.find(row=>row.quote===code);assert(row,code+' coverage');assert.equal(row.base,'USD');assert.equal(typeof row.rate,'number');assert(row.rate>0);assert(/^\d{4}-\d{2}-\d{2}$/.test(row.date));const age=Date.now()-Date.parse(row.date+'T00:00:00Z');assert(age>=0 && age<7*86400000,code+' freshness');}
      console.log(JSON.stringify({name,status:response.status,cors,quotes:rows.map(({quote,date})=>({quote,date}))}));
    }else{const currency=(await response.text()).trim();assert(/^[A-Z]{3}$/.test(currency),'IP currency field contract');console.log(JSON.stringify({name,status:response.status,cors,currencyFieldValid:true}));}
  }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
