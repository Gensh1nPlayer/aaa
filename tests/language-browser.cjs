'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');
const {chromium,webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname,'..');
const languages = ['en','fr','de','ar','ja','zh'];
const modules = [
  {file:'index.html',url:'/',name:'main'},
  {file:'auth/index.html',url:'/auth/',name:'auth'},
  {file:'acc_details/index.html',url:'/acc_details/',name:'details',hash:'#123'},
  {file:'privacy/index.html',url:'/privacy/',name:'privacy'},
  {file:'terms/index.html',url:'/terms/',name:'terms'},
  {file:'404.html',url:'/404.html',name:'404'}
];
for (const module of modules) assert(fs.readFileSync(path.join(root,module.file),'utf8').includes('id="languagePicker"'));
assert(!fs.readFileSync(path.join(root,'tools/social-card.html'),'utf8').includes('id="languagePicker"'),'share artwork has no language selector');
const serve = (req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  if (pathname === '/account_details.json') {
    res.setHeader('Content-Type','application/json');
    res.end(JSON.stringify({schemaVersion:1,accounts:{'123':{accountId:'123',inventoryStatus:'complete',ownedSkinIds:[]}}}));return;
  }
  const file = path.resolve(root,'.'+(pathname.endsWith('/') ? pathname+'index.html' : pathname));
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
};
const tls = process.env.TEST_TLS_KEY && process.env.TEST_TLS_CERT;
const server = tls ? https.createServer({key:fs.readFileSync(process.env.TEST_TLS_KEY),cert:fs.readFileSync(process.env.TEST_TLS_CERT)},serve) : http.createServer(serve);

async function inspectMenu(page,language,moduleName) {
  const trigger = page.locator('#languageTrigger');
  await trigger.click();
  assert.equal(await trigger.getAttribute('aria-expanded'),'true',moduleName+' open state');
  const menu = page.locator('#languageMenu');
  assert(await menu.isVisible());
  assert.equal(await menu.locator('[role="option"]').count(),languages.length);
  const metrics = await menu.evaluate(menu => {
    const japanese = menu.querySelector('[data-language-value="ja"]');
    const selected = menu.querySelector('[aria-selected="true"]');
    const range = document.createRange();range.selectNodeContents(japanese);
    const text = range.getBoundingClientRect(), box = japanese.getBoundingClientRect(), menuBox = menu.getBoundingClientRect();
    const style = getComputedStyle(japanese);
    return {
      text:japanese.textContent.trim(),lines:range.getClientRects().length,textLeft:text.left,textRight:text.right,
      contentLeft:box.left+parseFloat(style.paddingLeft),contentRight:box.right-parseFloat(style.paddingRight),
      menuLeft:menuBox.left,menuRight:menuBox.right,viewport:innerWidth,selectedCount:menu.querySelectorAll('[aria-selected="true"]').length,
      selectedLanguage:selected?.dataset.languageValue,selectedBackground:selected && getComputedStyle(selected).backgroundImage,
      options:Array.from(menu.querySelectorAll('[role="option"]')).map(option => ({text:option.textContent,before:getComputedStyle(option,'::before').content,after:getComputedStyle(option,'::after').content}))
    };
  });
  assert.equal(metrics.selectedCount,1,moduleName+' exactly one active option');
  assert.equal(metrics.selectedLanguage,language,moduleName+' aria-selected');
  assert(await menu.locator('[aria-selected="true"]').evaluate(n=>{const s=getComputedStyle(n);return s.backgroundImage!=='none'||s.backgroundColor!=='rgba(0, 0, 0, 0)';}),moduleName+' keeps selected background');
  for (const option of metrics.options) assert(!/[✓✔√]/.test(option.text+option.before+option.after),moduleName+' removes selected checkmarks');
  assert.equal(metrics.text,'日本語',moduleName+' retains the Japanese label');
  assert.equal(metrics.lines,1,moduleName+' Japanese label fits one line');
  assert(metrics.textLeft >= metrics.contentLeft-1 && metrics.textRight <= metrics.contentRight+1,moduleName+' Japanese label fits its padded content area');
  assert(metrics.menuLeft >= -1 && metrics.menuRight <= metrics.viewport+1,moduleName+' menu stays inside viewport');
  assert.equal(await trigger.locator('span').first().textContent(),language === 'ja' ? '日本語' : language === 'zh' ? '简体中文' : language.toUpperCase(),moduleName+' accessible trigger label');
  assert.deepEqual(await menu.locator('[data-language-value]').evaluateAll(nodes=>nodes.map(n=>n.dataset.languageValue)),languages,'Chinese follows Japanese');
}

(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = (tls ? 'https' : 'http')+'://127.0.0.1:'+server.address().port;
  for (const scenario of [
    {engine:chromium,name:'Chromium desktop',viewport:{width:1440,height:960}},
    {engine:webkit,name:'WebKit mobile / Safari 14 API limits',viewport:{width:320,height:896},legacy:true}
  ]) {
    const browser = await scenario.engine.launch({headless:true,...(scenario.engine === chromium && process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE}: {})});
    try {
      const context = await browser.newContext({viewport:scenario.viewport,ignoreHTTPSErrors:true,reducedMotion:'reduce'});
      await context.route('**/*',route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
      if (scenario.legacy) await context.addInitScript(() => {Array.prototype.at=undefined;String.prototype.at=undefined;Object.hasOwn=undefined;window.structuredClone=undefined;});
      const page = await context.newPage(), errors=[], localFailures=[], authScripts=[];
      page.on('pageerror',error => errors.push(error.message));
      page.on('requestfailed',request => {if(new URL(request.url()).hostname === '127.0.0.1')localFailures.push({url:request.url(),error:request.failure()?.errorText});});
      page.on('response',response => {if(page.url().includes('/auth/') && response.url().includes('/assets/void-effects.js'))authScripts.push({url:response.url(),status:response.status()});});
      for (const module of modules) {
        for (const [index,language] of languages.entries()) {
          const hash = module.hash || '';
          await page.goto(base+module.url+'?lang='+language+hash);
          await page.waitForFunction(language => document.documentElement.lang === language,language);
          await page.locator('#void-starfield').waitFor({state:'attached',timeout:5000});
          assert.equal(await page.locator('html').getAttribute('dir'),language === 'ar' ? 'rtl' : 'ltr',module.name+' text direction');
          if(module.name==='auth') {
            assert.equal(await page.locator('#privacyHint').isVisible(),false,'no redundant privacy note');
            assert((await page.locator('#authIntro').textContent()).includes('40'),'delivered 40-character key instruction');
            if(language==='zh') assert.equal(await page.locator('#panelTitleText').textContent(),'战网安全令');
          }
          if(module.name==='main') {
            assert(await page.locator('#currencyTrigger').isVisible(),'currency stays visible after language change');
            assert.equal(await page.locator('#currencyTrigger .currency-icon').count(),1,'currency icon preserved');
            const gap=await page.locator('.rd-secondary-cta').evaluate(node=>parseFloat(getComputedStyle(node).columnGap));
            assert(gap>=8&&gap<=12,'compact order button arrow gap');
            assert.equal(await page.evaluate(()=>window.RoshineGameTerms.translate('Rank Reset','zh')),'段位重置');
          }
          await inspectMenu(page,language,module.name);
          if (language === 'ja' && process.env.SCREENSHOT_DIR) {
            await page.locator('#languageMenu [aria-selected="true"]').focus();
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            assert(await page.locator('#languageMenu').isVisible(),module.name+' open menu screenshot');
            fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});
            await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,module.name+'-'+(scenario.legacy?'mobile':'desktop')+'-ja.png')});
          }
          const nextLanguage = languages[(index+1)%languages.length];
          await page.locator('#languageMenu [data-language-value="'+nextLanguage+'"]').click();
          await page.waitForFunction(language => document.documentElement.lang === language,nextLanguage);
          assert.equal(new URL(page.url()).hash,hash,module.name+' language change preserves hash');
          assert(!(await page.locator('#languageMenu').isVisible()));
          assert.equal(await page.locator('#languageTrigger').getAttribute('aria-expanded'),'false');
          await inspectMenu(page,nextLanguage,module.name);
          await page.locator('#languageMenu [aria-selected="true"]').focus();
          await page.keyboard.press('Escape');
          assert(!(await page.locator('#languageMenu').isVisible()),module.name+' Escape closes menu');
          assert.equal(await page.locator('#languageTrigger').evaluate(node => node === document.activeElement),true,module.name+' Escape restores focus');
        }
        console.log(JSON.stringify({scenario:scenario.name,module:module.name,languages,checkmarks:false,japaneseSingleLine:true,ariaSelected:true,activeBackground:true}));
      }
      assert.deepEqual(errors,[]);
      assert.deepEqual(localFailures,[]);
      assert.equal(authScripts.length,languages.length);
      assert(authScripts.every(response => response.status === 200));
      console.log(JSON.stringify({scenario:scenario.name,pageErrors:errors,localRequestFailures:localFailures,authStarfieldLoads:authScripts.length}));
    } finally {await browser.close();}
  }
})().catch(error => {console.error(error);process.exitCode=1;}).finally(() => server.close());
