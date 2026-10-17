'use strict';
// Mechanical migration of static public pages; never edits inventory data.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname,'..');
const pages = ['index.html','acc_details/index.html','auth/index.html','privacy/index.html','terms/index.html','404.html'];
const icons = '<link rel="icon" href="/assets/favicon.svg?v=1" type="image/svg+xml">\n  <link rel="icon" href="/assets/favicon-32.png?v=1" type="image/png" sizes="32x32">\n  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=1" sizes="180x180">\n  <link rel="manifest" href="/site.webmanifest">';
let changed = 0;
for(const page of pages) {
  const file = path.join(root,page), before = fs.readFileSync(file,'utf8');
  let html = before.replace(/\r\n/g,'\n');
  if(!html.includes('/assets/favicon.svg?v=1')) html = html.replace(/<link rel="icon"[^>]*>/,icons);
  html = html.replace(/(<a\b(?=[^>]*\bclass="brand")[^>]*>)[\s\S]*?<\/a>/g,(_,open)=>open+'<img class="brand-lockup" src="/assets/roshine-wordmark.svg" alt="Roshine" width="176" height="36">'+(page==='404.html'?'':'<img class="brand-compact" src="/assets/logo.svg" alt="" width="36" height="36">')+'</a>');
  html = html.replace('class="panel-title-logo" src="./logo.png"','class="panel-title-logo" src="/assets/logo.svg"');
  html = html.replace(/src="(?:\.\.\/|\.\/|\/)?assets\/logo\.png"/g,'src="/assets/logo.svg"');
  html = html.replaceAll('og-social-v2.jpg','og-social-v3.jpg');
  html = html.replace('"logo":"https://roshine.love/assets/logo.png"','"logo":"https://roshine.love/assets/icon-512.png"');
  html = html.replace(/(<meta (?:property="og:image:alt"|name="twitter:image:alt") content=")[^"]*("\s*\/?>)/g,'$1Roshine Overwatch account store — OW1 and OW2 inventory, rare skins and guided handover$2');
  const social = [
    ['property','og:type','website'],['property','og:site_name','Roshine Account Store'],
    ['property','og:image:type','image/jpeg'],['property','og:image:width','1200'],['property','og:image:height','630'],
    ['property','og:image:alt','Roshine Overwatch account store — OW1 and OW2 inventory, rare skins and guided handover'],
    ['name','twitter:card','summary_large_image'],['name','twitter:image','https://roshine.love/assets/og-social-v3.jpg']
  ];
  for(const [attribute,key,value] of social)if(!html.includes(attribute+'="'+key+'"'))html=html.replace('</head>','  <meta '+attribute+'="'+key+'" content="'+value+'">\n</head>');
  if(html!==before.replace(/\r\n/g,'\n')){changed++;if(!process.argv.includes('--check'))fs.writeFileSync(file,html);}
}
if(process.argv.includes('--check')&&changed)throw new Error(changed+' pages need brand synchronization');
console.log(JSON.stringify({pages:pages.length,changed,check:process.argv.includes('--check')}));
