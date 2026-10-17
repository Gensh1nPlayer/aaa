'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),failures=[];
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'acc_details/data/191.json'),'utf8'));
snapshot.competitive.ranks={tank:'Placement 0/10',damage:'Gold 3',support:'Champion 2',openQueue:'Unranked'};
const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
function check(ok,message){if(!ok)failures.push(message);}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{for(const engine of process.env.DETAILS_AUDIT?[chromium]:[chromium,webkit]){
  const browser=await engine.launch({headless:true,...(engine===chromium&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  try{
   const context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'});
   await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
   await context.addInitScript(()=>localStorage.setItem('roshine.theme','light'));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const lang of process.env.DETAILS_AUDIT?['zh']:['en','fr','de','ar','ja','zh']){
    await page.goto('http://127.0.0.1:'+server.address().port+'/acc_details/?lang='+lang+'#191');
    await page.waitForSelector('body.has-account');
    await page.evaluate(data=>HeroGallery.loadSnapshot(data),snapshot);
    for(const width of process.env.DETAILS_AUDIT?[1440]:[320,390,768,1440]){
     await page.setViewportSize({width,height:960});
     for(const tab of ['overview','statistics','competitive','skins','weapons','variants']){
      await page.locator('[data-tab="'+tab+'"]').click();
      const label=engine.name()+' '+lang+' '+width+' '+tab;
      const metrics=await page.evaluate(()=>{
       const panel=[...document.querySelectorAll('.main-content > .panel')].find(n=>!n.hidden),style=getComputedStyle(panel);
       const out={panel:{shadow:style.boxShadow,bg:style.backgroundImage,padding:style.padding,border:style.borderRadius},wide:document.documentElement.scrollWidth>innerWidth+1,low:[],cards:[]};
       const lum=rgb=>rgb.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((v,c,i)=>v+c*[.2126,.7152,.0722][i],0);
       for(const n of panel.querySelectorAll('.account-metric span,.account-metric strong,.account-card strong,.account-card small,.role-label,.account-section h2,.account-table th,.account-table td,.rank-value,.placeholder-copy p,.competitive-summary h3,.result-line,.result-hint,.card-hero,.catalog-label')){
        if(!n.getBoundingClientRect().height)continue;const s=getComputedStyle(n),rgb=s.color.match(/[\d.]+/g).slice(0,3).map(Number);
        const contrast=(lum([250,248,255])+.05)/(lum(rgb)+.05);if(contrast<4.5)out.low.push({text:n.textContent.slice(0,45),color:s.color,contrast});
       }
       for(const n of panel.querySelectorAll('.account-card,.account-metric,.account-hero,.competitive-card')){
        const s=getComputedStyle(n);if(n.getBoundingClientRect().height)out.cards.push({radius:parseFloat(s.borderRadius),padding:parseFloat(s.paddingInlineStart)});
       }
       return out;
      });
      check(!metrics.wide,label+' horizontal overflow');
      if(['overview','statistics','skins','weapons','variants'].includes(tab))check(metrics.panel.shadow==='none'&&metrics.panel.bg==='none',label+' accidental outer panel '+JSON.stringify(metrics.panel));
      check(!metrics.low.length,label+' low contrast '+JSON.stringify(metrics.low));
      check(metrics.cards.every(c=>c.radius>=10&&c.padding>=14),label+' card spacing '+JSON.stringify(metrics.cards));
      if(tab==='statistics')check(await page.locator('.account-table').first().evaluate(n=>getComputedStyle(n).borderCollapse)==='separate',label+' table rounded corners');
      if(tab==='competitive')check(!(await page.locator('#placeholderText').textContent()).includes('A blank field'),label+' removed copy');
      if(tab==='skins'){
       const sizes=await page.locator('.filters select').evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n),c=document.createElement('canvas').getContext('2d');c.font=s.font;return {id:n.id,width:n.getBoundingClientRect().width,required:Math.max(...[...n.options].map(o=>c.measureText(o.text).width))+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight)+2};}));
       for(const size of sizes)check(size.width+2>=size.required,label+' clipped menu '+JSON.stringify(size));
       check(!/\bIDs\b/i.test(await page.locator('#skinSearch').getAttribute('placeholder')),label+' shorter placeholder');
      }
      if(process.env.DETAILS_SCREENSHOT_DIR&&lang==='zh'&&[390,1440].includes(width)&&engine===chromium){fs.mkdirSync(process.env.DETAILS_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.DETAILS_SCREENSHOT_DIR,tab+'-zh-light-'+width+'.png')});}
     }
    }
   }
   check(!errors.length,engine.name()+' runtime '+JSON.stringify(errors));
  }finally{await browser.close();}
 }}finally{server.close();}
 if(failures.length){console.error(failures.join('\n'));throw Error(failures.length+' details regressions');}
 console.log(process.env.DETAILS_AUDIT?'PASS: targeted Chinese/light desktop reproduction.':'PASS: all six languages, four widths, both browsers; light text contrast, panel spacing, round tables and untruncated filters.');
})().catch(e=>{console.error(e);process.exitCode=1;});
