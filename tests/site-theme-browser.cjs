'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), https = require('node:https');
const {chromium,webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname,'..');
const pages = ['/', '/acc_details/', '/auth/', '/privacy/', '/terms/', '/404.html'];
const server = https.createServer({key:fs.readFileSync(process.env.TEST_TLS_KEY),cert:fs.readFileSync(process.env.TEST_TLS_CERT)},(req,res) => {
  const pathname = new URL(req.url,'https://localhost').pathname;
  const file = path.resolve(root,'.'+(pathname.endsWith('/') ? pathname+'index.html' : pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='https://127.0.0.1:'+server.address().port;
  try {
    for(const engine of [chromium,webkit]) {
      const browser=await engine.launch({headless:true,...(engine===chromium&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
      try {
        const context=await browser.newContext({viewport:{width:1440,height:960},colorScheme:'light',reducedMotion:'reduce',ignoreHTTPSErrors:true,locale:'en-US'});
        await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
        const page=await context.newPage(),errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        const themes={};
        for(const url of pages) {
          console.log((engine===chromium?'Chromium':'WebKit')+' themes '+url);
          await page.goto(base+url+'?lang=en');
          await page.evaluate(()=>{localStorage.removeItem('roshine.theme');});
          await page.reload();
          assert.equal(await page.locator('html').getAttribute('data-theme'),'dark','default stays dark even for light OS');
          assert.equal(await page.locator('#themeToggle').count(),1);
          await page.locator('#themeToggle').focus();
          await page.locator('#themeToggle').press('Enter');
          assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
          assert.equal(await page.locator('#themeToggle').getAttribute('aria-pressed'),'true');
          assert.equal(await page.evaluate(()=>localStorage.getItem('roshine.theme')),'light');
          await page.reload();
          assert.equal(await page.locator('html').getAttribute('data-theme'),'light','reload preserves choice');
          await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
          assert.equal(await page.locator('body').evaluate(node=>getComputedStyle(node).color),'rgb(41, 35, 60)');
          await page.evaluate(()=>document.documentElement.lang='ja');
          await page.waitForFunction(()=>document.getElementById('themeToggle').title.includes('ダーク'));
          await page.evaluate(()=>document.documentElement.lang='en');
          if(url!=='/404.html') {
            const header=page.locator('.header');
            assert.equal(Math.round((await header.boundingBox()).width),1340,'all desktop headers share width');
            themes[url]=await header.evaluate(n=>getComputedStyle(n).backgroundImage);
            for(const width of [320,390,768,1280,1440]) {
              await page.setViewportSize({width,height:960});
              await page.waitForFunction(width=>innerWidth===width&&matchMedia('(max-width: 560px)').matches===(width<=560),width);
              // Viewport emulation may acknowledge media queries before applying layout.
              // Wait for the responsive CSS state, then assert geometry without retrying it.
              await page.waitForFunction(width=>{
                const header=document.querySelector('.header'),nav=header.querySelector('.nav');
                return getComputedStyle(header).top===(width<=560?'10px':'16px')&&
                  (getComputedStyle(nav).display==='none')===(width<=1240);
              },width);
              await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
              const boxes=await page.locator('.header-actions > *, .header .brand, .header .mobile-menu-toggle').evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).display!=='none').map(n=>{const b=n.getBoundingClientRect();return {id:n.id||n.className,x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};}).filter(b=>b.width&&b.height));
              const diagnostic=await page.locator('.header').evaluate(n=>({inner:innerWidth,media:matchMedia('(max-width: 560px)').matches,width:getComputedStyle(n).width,top:getComputedStyle(n).top,grid:getComputedStyle(n).gridTemplateColumns,rect:n.getBoundingClientRect().toJSON(),sheets:Array.from(document.styleSheets).map(s=>s.href)}));
              for(const box of boxes) assert(box.x>=0&&box.right<=width+1,url+' '+width+' control fits '+JSON.stringify({boxes,diagnostic}));
              for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++)assert(!(boxes[a].x<boxes[b].right-1&&boxes[b].x<boxes[a].right-1&&boxes[a].y<boxes[b].bottom-1&&boxes[b].y<boxes[a].bottom-1),url+' '+width+' overlapping controls '+boxes[a].id+' / '+boxes[b].id);
              const overflow=await page.evaluate(()=>({ok:document.documentElement.scrollWidth<=innerWidth+1,wide:Array.from(document.querySelectorAll('body *')).filter(n=>{const b=n.getBoundingClientRect();return b.width&&getComputedStyle(n).position!=='fixed'&&(b.right>innerWidth+1||b.left< -1);}).slice(0,8).map(n=>({tag:n.tagName,cl:n.className,width:n.getBoundingClientRect().width,right:n.getBoundingClientRect().right}))}));
              assert(overflow.ok,url+' '+width+' horizontal overflow '+JSON.stringify(overflow.wide));
            }
            await page.setViewportSize({width:1440,height:960});
          }
          if(process.env.THEME_SCREENSHOT_DIR&&engine===chromium){
            fs.mkdirSync(process.env.THEME_SCREENSHOT_DIR,{recursive:true});
            await page.screenshot({path:path.join(process.env.THEME_SCREENSHOT_DIR,(url==='/'?'home':url.split('/')[1])+ '-light.png')});
            if(url==='/') {
              await page.locator('#accounts').scrollIntoViewIfNeeded();
              await page.screenshot({path:path.join(process.env.THEME_SCREENSHOT_DIR,'stock-light.png')});
              await page.setViewportSize({width:390,height:844});
              await page.evaluate(()=>window.scrollTo(0,0));
              await page.screenshot({path:path.join(process.env.THEME_SCREENSHOT_DIR,'home-light-mobile.png')});
              await page.setViewportSize({width:1440,height:960});
              await page.evaluate(()=>window.scrollTo(0,0));
            }
          }
          await page.locator('#languageTrigger').click();
          await page.locator('[data-language-value="zh"]').click();
          await page.waitForFunction(()=>document.documentElement.lang==='zh');
          const expected={'/':'帮你找到心仪账号','/acc_details/':'每一处细节，都看得见。','/auth/':'战网安全令','/privacy/':'隐私政策','/terms/':'服务条款','/404.html':'这个页面暂不在库。'};
          assert((await page.locator('h1,.panel-title').allTextContents()).some(s=>s.includes(expected[url])),url+' real Chinese content');
          for(const width of [320,1440]) {
            await page.setViewportSize({width,height:960});
            await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
            assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),url+' Chinese '+width+' fits');
          }
          if(process.env.THEME_SCREENSHOT_DIR&&engine===chromium) await page.screenshot({path:path.join(process.env.THEME_SCREENSHOT_DIR,(url==='/'?'home':url.split('/')[1])+'-zh-light.png')});
          await page.locator('#themeToggle').click();
          assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
        }
        assert.equal(new Set(Object.values(themes)).size,1,'all five headers have identical glass treatment');
        await page.goto(base+'/?lang=en');
        await page.locator('#themeToggle').click();
        await page.goto(base+'/acc_details/?lang=en');
        assert.equal(await page.locator('html').getAttribute('data-theme'),'light','navigation preserves preference');
        await page.goto(base+'/acc_details/?lang=en#191');
        await page.waitForSelector('body.has-account');
        for(const tab of ['overview','skins','weapons','variants','statistics','competitive']) {
          await page.locator('[data-tab="'+tab+'"]').click();
          assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'loaded details '+tab+' fits');
          if(process.env.THEME_SCREENSHOT_DIR&&engine===chromium) await page.screenshot({path:path.join(process.env.THEME_SCREENSHOT_DIR,'details-'+tab+'-light.png')});
        }
        await page.evaluate(()=>window.dispatchEvent(new StorageEvent('storage',{key:'roshine.theme',newValue:'dark'})));
        assert.equal(await page.locator('html').getAttribute('data-theme'),'dark','cross-tab changes applied');
        await page.locator('#themeToggle').click();
        const inkMetrics=await page.evaluate(()=>{
          const fixture=document.createElement('div');fixture.style.background='#faf8ff';
          const classes=['ac-rarity-name-common','ac-rarity-name-rare','ac-rarity-name-epic','ac-rarity-name-legendary','ac-rarity-name-ultra','ac-rarity-name-mythic','ac-special-skin-ultra-rare','ac-special-skin-rare','ac-special-skin-esports','ac-special-skin-collector','ac-special-skin-mythic','ac-special-skin-shop','ac-special-skin-bundle','ac-special-currency','ac-special-weapon-choice','ac-special-weapon-hard-light','ac-special-weapon-nerf-gelfire','ac-special-weapon-los-muertos','ac-endorsement-5'];
          const result=classes.map(name=>{const n=document.createElement('span');n.className=name+' '+(name.startsWith('ac-special-skin-')?'ac-special-skin':'');n.textContent='Example';fixture.append(n);return n;});
          document.body.append(fixture);
          const lum=rgb=>rgb.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((v,c,i)=>v+c*[.2126,.7152,.0722][i],0),bg=lum([250,248,255]);
          const metrics=result.map(n=>{const s=getComputedStyle(n),colors=s.backgroundImage==='none'?[s.color]:s.backgroundImage.match(/rgb\([^)]+\)/g)||[];return {name:n.className,ratios:colors.map(c=>(bg+.05)/(lum(c.match(/[\d.]+/g).slice(0,3).map(Number))+.05)),shadow:s.textShadow,filter:s.filter};});fixture.remove();return metrics;
        });
        for(const ink of inkMetrics){assert(ink.ratios.length&&ink.ratios.every(r=>r>=4.5),'clear light text '+JSON.stringify(ink));assert.equal(ink.shadow,'none');assert.equal(ink.filter,'none');}
        const denied=await browser.newContext({ignoreHTTPSErrors:true});
        await denied.addInitScript(()=>Object.defineProperty(Storage.prototype,'getItem',{value(){throw new Error('denied');}}));
        const privatePage=await denied.newPage();
        await privatePage.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
        await privatePage.goto(base+'/auth/');
        await privatePage.locator('#themeToggle').click();
        assert.equal(await privatePage.locator('html').getAttribute('data-theme'),'light','works when storage is unavailable');
        await denied.close();
        assert.deepEqual(errors,[],'no runtime errors');
        await context.close();
      } finally {await browser.close();}
    }
    console.log('PASS: six pages, two engines, five widths, Chinese layout, theme persistence, keyboard, storage failure, shared glass and 19 text palettes at >=4.5:1 contrast.');
  } finally {server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
