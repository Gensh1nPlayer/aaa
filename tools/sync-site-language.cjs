'use strict';
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname,'..');
const pages=['index.html','acc_details/index.html','auth/index.html','privacy/index.html','terms/index.html','404.html'];
let changed=0;
for(const page of pages){
  const file=path.join(root,page), before=fs.readFileSync(file,'utf8');
  let html=before.replace(/\r\n/g,'\n');
  html=html.replace('/assets/zh-cn.js?v=1','/assets/zh-cn.js?v=2');
  if(!html.includes('/assets/game-terms.js?v=1'))html=html.replace('<head>','<head>\n  <script src="/assets/game-terms.js?v=1"></script>');
  if(!html.includes('/assets/zh-cn.js?v=2'))html=html.replace('<head>','<head>\n  <script src="/assets/zh-cn.js?v=2"></script>');
  if(page!=='404.html'){
    if(!html.includes('<option value="zh">'))html=html.replace(/(<option value="ja">[^<]+<\/option>)/,'$1<option value="zh">简体中文</option>');
    if(!html.includes('data-language-value="zh"'))html=html.replace(/(<button[^>]*data-language-value="ja"[^>]*>[^<]*<\/button>)/,'$1<button class="language-option" type="button" role="option" data-language-value="zh" aria-selected="false" tabindex="-1">简体中文</button>');
  }
  const versions={'main.js':[56,57],'redesign.js':[13,14],'policy.js':[9,10],'site-footer.js':[2,3],'inventory-updated.js':[1,2]};
  for(const [name,[from,to]]of Object.entries(versions))html=html.replace(name+'?v='+from,name+'?v='+to);
  html=html.replace('i18n.js?v=5','i18n.js?v=6');
  html=html.replace('redesign.css?v=15','redesign.css?v=16');
  if(html!==before.replace(/\r\n/g,'\n')){changed++;if(!process.argv.includes('--check'))fs.writeFileSync(file,html);}
}
if(process.argv.includes('--check')&&changed)throw new Error(changed+' pages need language synchronization');
console.log(JSON.stringify({pages:pages.length,changed,check:process.argv.includes('--check')}));
