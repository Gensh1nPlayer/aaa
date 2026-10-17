'use strict';
// Static includes: no runtime HTML fetch (Authenticator keeps connect-src 'none').
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname,'..');
const pages = ['index.html','acc_details/index.html','auth/index.html','privacy/index.html','terms/index.html','404.html'];
const start = '<!-- ROSHINE SHARED FOOTER -->', end = '<!-- /ROSHINE SHARED FOOTER -->';
const template = fs.readFileSync(path.join(root,'assets/site-footer.html'),'utf8').trim();
const block = start+'\n'+template+'\n'+end;
const globe = '<svg class="language-globe" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/></svg>';
const coin = '<svg class="currency-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.7-1.8-1-3-1-1.7 0-3 .8-3 2s1.2 1.9 3 2.5 3 1.3 3 2.5-1.3 2-3 2c-1.2 0-2.3-.3-3-1M12 5.5v13"/></svg>';
let mismatches = 0;
for (const page of pages) {
  const file = path.join(root,page), before = fs.readFileSync(file,'utf8');
  let html = before.replace(/\r\n/g,'\n');
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a >= 0 && b > a) html = html.slice(0,a)+block+html.slice(b+end.length);
  else if (/<footer class="footer">[\s\S]*?<\/footer>/.test(html)) html = html.replace(/<footer class="footer">[\s\S]*?<\/footer>/,block);
  else html = html.replace('</main>','</main>\n\n  '+block);
  // Details has nested layout containers: keep the global footer outside the gallery grid.
  if (page === 'acc_details/index.html') {
    const begin = html.indexOf(start), finish = html.indexOf(end) + end.length;
    html = html.slice(0,begin) + html.slice(finish);
    html = html.replace(/\s*<dialog id="skinDialog"/, '\n\n  '+block+'\n\n  <dialog id="skinDialog"');
  }
  if (!html.includes('/assets/site-footer.css?v=1')) html = html.replace('</head>','  <link rel="stylesheet" href="/assets/site-footer.css?v=1">\n</head>');
  if (!html.includes('/assets/site-chrome.css?v=1')) html = html.replace('</head>','  <link rel="stylesheet" href="/assets/site-chrome.css?v=1">\n</head>');
  if (!html.includes('/assets/site-footer.js?v=1')) html = html.replace('</body>','  <script src="/assets/site-footer.js?v=1" defer></script>\n</body>');
  if (html.includes('id="languageTrigger"') && !html.includes('class="language-globe"')) html = html.replace(/(<button[^>]+id="languageTrigger"[^>]*>)/,'$1'+globe);
  if (html.includes('id="currencyTrigger"') && !html.includes('class="currency-icon"')) html = html.replace(/(<button[^>]+id="currencyTrigger"[^>]*>)/,'$1'+coin);
  if (page === '404.html') html = html.replace('<body>','<body class="rf-error-page">');
  if (page === 'auth/index.html') html = html.replace('<div class="foot" id="footer"></div>','<div class="foot" id="footer" hidden></div>');
  html = html.replace(/^[ \t]+$/gm,'');
  if (html !== before.replace(/\r\n/g,'\n')) {
    mismatches++;
    if (!process.argv.includes('--check')) fs.writeFileSync(file,html);
  }
}
if (process.argv.includes('--check') && mismatches) throw new Error(mismatches+' pages need footer synchronization');
console.log(JSON.stringify({pages:pages.length,updated:mismatches,check:process.argv.includes('--check')}));
