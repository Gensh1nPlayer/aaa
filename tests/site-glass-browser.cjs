'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),https=require('node:https');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const sharp=require(process.env.SHARP_MODULE||'sharp');
const root=path.resolve(__dirname,'..'),failures=[];
const pages=process.env.GLASS_PAGES==='404'?['/404.html']:['/','/acc_details/','/auth/','/privacy/','/terms/','/404.html'];
const server=https.createServer({key:fs.readFileSync(process.env.TEST_TLS_KEY),cert:fs.readFileSync(process.env.TEST_TLS_CERT)},(req,res)=>{
  const name=new URL(req.url,'https://localhost').pathname,file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
function check(value,message){if(!value)failures.push(message);}
async function settle(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function glass(page,selector,label,maxAlpha,optical=false){
  const node=page.locator(selector);
  await node.waitFor({state:'visible'});
  // Inspect the final surface, not an intentional finite menu fade-in frame.
  await node.evaluate(n=>{getComputedStyle(n).opacity;return Promise.all(n.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
  const style=await node.evaluate(n=>{const s=getComputedStyle(n);return {bg:s.backgroundImage+' '+s.backgroundColor,blur:s.backdropFilter||s.webkitBackdropFilter,opacity:s.opacity};});
  const colors=style.bg.match(/rgba?\([^)]+\)/g)||[];
  const alphas=colors.map(c=>{const a=c.match(/[\d.]+/g).map(Number);return a.length===4?a[3]:1;}).filter(a=>a>0);
  check(alphas.length&&alphas.every(a=>a<=maxAlpha),label+' glass alpha '+JSON.stringify(style));
  check(/blur\(/.test(style.blur),label+' backdrop blur '+JSON.stringify(style));
  check(style.opacity==='1',label+' must not fade text with container opacity');
  if(!optical)return;
  const means=[];
  for(const color of ['#000','#fff']){
    await page.evaluate(color=>{
      let probe=document.getElementById('glass-test-probe');
      if(!probe){probe=document.createElement('div');probe.id='glass-test-probe';probe.setAttribute('aria-hidden','true');probe.style.cssText='position:fixed;inset:0;z-index:80;pointer-events:none';document.body.append(probe);}
      probe.style.background=color;
    },color);
    await settle(page);
    const buffer=await node.screenshot(),meta=await sharp(buffer).metadata();
    const sample=await sharp(buffer).extract({left:Math.floor(meta.width*.35),top:meta.height-6,width:3,height:3}).stats();
    means.push(sample.channels.slice(0,3).reduce((s,c)=>s+c.mean,0)/3);
  }
  await page.evaluate(()=>document.getElementById('glass-test-probe').remove());
  const transmission=Math.abs(means[1]-means[0]);
  // A bottom-fixed launcher's blur kernel crosses the viewport edge; allow that
  // compositing loss, while still rejecting the old near-opaque 25/255 result.
  check(transmission>=(selector==='.header'?100:85),label+' actual backdrop transmission '+transmission.toFixed(1)+' / 255');
  console.log(JSON.stringify({label,alphas,blur:style.blur,transmission:Number(transmission.toFixed(1))}));
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='https://127.0.0.1:'+server.address().port;
  try{
    for(const engine of process.env.GLASS_FAST?[process.env.GLASS_ENGINE==='webkit'?webkit:chromium]:[chromium,webkit]){
      const browser=await engine.launch({headless:true,...(engine===chromium&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
      try{
        for(const width of process.env.GLASS_FAST?[1440]:[390,1440]){
          const context=await browser.newContext({viewport:{width,height:960},ignoreHTTPSErrors:true,reducedMotion:'reduce',locale:'en-US'});
          await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
          const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
          for(const url of process.env.GLASS_FAST?['/']:pages){
            await page.goto(base+url+'?lang=en'+(url==='/acc_details/'?'#191':''));
            if(url==='/acc_details/')await page.waitForSelector('body.has-account');
            const order=await page.locator(url==='/404.html'?'main.card > #themeToggle, main.card > #languagePicker':'.header-actions > *').evaluateAll(nodes=>nodes.map(n=>n.id));
            assert.deepEqual(order,url==='/404.html'?['languagePicker','themeToggle']:url==='/'?['authBtn','currencyPicker','languagePicker','themeToggle']:['authBtn','languagePicker','themeToggle'],url+' visual and keyboard control order');
            for(const theme of ['light','dark']){
              const current=await page.locator('html').getAttribute('data-theme');if(current!==theme)await page.locator('#themeToggle').click();
              await settle(page);
              const label=engine.name()+' '+width+' '+url+' '+theme;
              if(url!=='/404.html'){
                await glass(page,'.header',label+' header',theme==='light'?.48:.65,true);
                await page.evaluate(()=>scrollTo(0,350));await settle(page);
                await glass(page,'.header',label+' scrolled header',theme==='light'?.48:.65);
                await page.evaluate(()=>scrollTo(0,0));await settle(page);
              }
              if(url==='/'||url==='/acc_details/'){
                await page.locator('.rd-search-launcher').waitFor({state:'visible'});
                await glass(page,'.rd-search-launcher',label+' launcher',theme==='light'?.6:.7,true);
                await page.locator('.rd-search-launcher').hover();await settle(page);
                await glass(page,'.rd-search-launcher',label+' hovered launcher',theme==='light'?.6:.7);
                await page.mouse.move(0,0);
              }
              await page.locator('#languageTrigger').click();
              await glass(page,'#languageMenu',label+' language menu',theme==='light'?.86:1);
              const menu=await page.locator('#languageMenu').boundingBox();check(menu.x>=0&&menu.x+menu.width<=width+1,label+' language menu fits');
              await page.evaluate(()=>document.activeElement.blur());
              await page.keyboard.press('Escape');check(!await page.locator('#languageMenu').isVisible(),label+' Escape closes menu even without button focus');
              if(url==='/'){
                await page.locator('#currencyTrigger').click();await glass(page,'#currencyMenu',label+' currency menu',theme==='light'?.86:1);await page.keyboard.press('Escape');
                if(width===1440){
                  const trigger=page.locator('.accounts-select-trigger').first();
                  await trigger.scrollIntoViewIfNeeded();
                  // Finish smooth scrolling before issuing the single pointer click.
                  await page.evaluate(()=>new Promise(resolve=>{let previous=scrollY,stable=0;function frame(){stable=previous===scrollY?stable+1:0;previous=scrollY;if(stable>=3)resolve();else requestAnimationFrame(frame);}requestAnimationFrame(frame);}));
                  await trigger.click();
                  assert.equal(await trigger.getAttribute('aria-expanded'),'true',label+' one click opens stock filter');
                  await glass(page,'.accounts-select-menu:visible',label+' stock filter menu',theme==='light'?.86:1);
                  await page.keyboard.press('Escape');
                  assert.equal(await page.locator('.accounts-select-menu:visible').count(),0,label+' Escape closes stock filter');
                  await page.evaluate(()=>scrollTo(0,0));await settle(page);
                }
              }
              if(width===390&&url!=='/404.html'){
                await page.locator('#mobileMenuToggle').click();
                assert.equal(await page.locator('#mobileNav').getAttribute('data-open'),'true',label+' one click opens mobile navigation');
                await glass(page,'#mobileNav',label+' mobile navigation',theme==='light'?.86:1);await page.keyboard.press('Escape');
                assert.equal(await page.locator('#mobileNav').getAttribute('data-open'),'false',label+' Escape closes mobile navigation');
              }
              check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' no horizontal overflow');
              if(process.env.GLASS_SCREENSHOT_DIR&&engine===chromium){fs.mkdirSync(process.env.GLASS_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.GLASS_SCREENSHOT_DIR,(url==='/'?'home':url.split('/')[1])+'-'+theme+'-'+width+'.png')});}
            }
          }
          assert.deepEqual(errors,[],'runtime errors');await context.close();
        }
        if(!process.env.GLASS_FAST){
          const fallback=await browser.newContext({viewport:{width:390,height:960},ignoreHTTPSErrors:true,reducedMotion:'reduce'});
          // Simulate an engine that understands neither spelling of backdrop-filter.
          // Both the declarations and @supports queries become unsupported together.
          await fallback.route('**/*',async route=>{
            if(new URL(route.request().url()).hostname!=='127.0.0.1')return route.abort();
            const response=await route.fetch(),type=response.headers()['content-type']||'';
            if(/text\/(css|html)/.test(type))return route.fulfill({response,body:(await response.text()).replace(/(-webkit-)?backdrop-filter/g,'unavailable-backdrop-filter')});
            return route.fulfill({response});
          });
          const page=await fallback.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
          for(const url of pages){
            await page.goto(base+url+'?lang=en'+(url==='/acc_details/'?'#191':''));
            if(url==='/acc_details/')await page.waitForSelector('body.has-account');
            for(const theme of ['light','dark']){
              if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#themeToggle').click();
              await page.locator('#languageTrigger').click();await settle(page);
              await page.locator('#languageMenu').evaluate(n=>{getComputedStyle(n).opacity;return Promise.all(n.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
              const selectors=['#languageMenu',...(url==='/404.html'?[]:['.header']),...(['/', '/acc_details/'].includes(url)?['.rd-search-launcher']:[])];
              for(const selector of selectors){
                const state=await page.locator(selector).evaluate(n=>{const s=getComputedStyle(n);return {bg:s.backgroundColor,blur:s.backdropFilter||s.webkitBackdropFilter,opacity:s.opacity};});
                const numbers=state.bg.match(/[\d.]+/g).map(Number),alpha=numbers.length===4?numbers[3]:1;
                check(alpha>=.94&&state.opacity==='1'&&state.blur==='none',engine.name()+' '+url+' '+theme+' no-blur readable fallback '+JSON.stringify(state));
              }
              await page.keyboard.press('Escape');
            }
          }
          assert.deepEqual(errors,[],'fallback runtime errors');await fallback.close();
          console.log(engine.name()+': '+pages.length+'-page unsupported-blur fallback passed');
        }
      }finally{await browser.close();}
    }
    assert.deepEqual(failures,[],'glass regressions');
    console.log('PASS: actual glass transmission, scrolling, hovering, menus, mobile navigation and runtime checks.');
  }finally{server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
