'use strict';
// Keep theme controls static, including pages with a strict network policy.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = ['index.html','acc_details/index.html','auth/index.html','privacy/index.html','terms/index.html','404.html'];
const button = '<button type="button" id="themeToggle" class="theme-toggle" aria-label="Switch to light theme" title="Switch to light theme" aria-pressed="false"><svg class="theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg><svg class="theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 14A9 9 0 0 1 10 3.2 9 9 0 1 0 20.8 14Z"/></svg></button>';
let changed = 0;
for (const page of pages) {
  const file = path.join(root,page), before = fs.readFileSync(file,'utf8');
  let html = before.replace(/\r\n/g,'\n');
  if (!html.includes('src="/assets/site-theme.js?v=1"')) html = html.replace('<head>','<head>\n  <script src="/assets/site-theme.js?v=1"></script>');
  if (!html.includes('/assets/site-theme.css?')) html = html.replace('</head>','  <link rel="stylesheet" href="/assets/site-theme.css?v=2">\n</head>');
  html = html.replace('/assets/site-theme.css?v=1','/assets/site-theme.css?v=2');
  html = html.replace('assets/main.js?v=55','assets/main.js?v=56');
  html = html.replace('assets/error-language.js?v=1','assets/error-language.js?v=2');
  html = html.replace('/assets/site-chrome.css?v=1','/assets/site-chrome.css?v=2');
  html = html.replace(/<a (?![^>]*\bid=)([^>]*href="\.\.\/auth\/"[^>]*class="btn btn-outline"[^>]*)>/, '<a id="authBtn" $1>');
  if (!html.includes('id="themeToggle"')) {
    html = page === '404.html' ? html.replace('<main class="card">','<main class="card">\n    '+button) : html.replace('<div class="header-actions">','<div class="header-actions">\n      '+button);
  }
  // Insert immediately after the language picker; preserve DOM and keyboard order.
  html = html.replace(/^[ \t]*<button type="button" id="themeToggle"[^\n]*<\/button>\n?/m,'');
  const pickerStart = html.indexOf(page === '404.html' ? '<div class="error-language language-picker"' : '<div class="language-picker" id="languagePicker"');
  if (pickerStart < 0) throw new Error('Missing language picker: '+page);
  const tail = html.slice(pickerStart);
  let depth = 0, end = -1;
  for (const match of tail.matchAll(/<div\b[^>]*>|<\/div>/g)) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (!depth) { end = pickerStart + match.index + match[0].length; break; }
  }
  if (end < 0) throw new Error('Unclosed language picker: '+page);
  html = html.slice(0,end)+'\n      '+button+html.slice(end);
  if (html !== before.replace(/\r\n/g,'\n')) { changed++; if (!process.argv.includes('--check')) fs.writeFileSync(file,html); }
}
if (process.argv.includes('--check') && changed) throw new Error(changed+' pages need theme synchronization');
console.log(JSON.stringify({pages:pages.length,changed,check:process.argv.includes('--check')}));
