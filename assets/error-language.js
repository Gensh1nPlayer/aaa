(function () {
  'use strict';
  const languages=['en','fr','de','ar','ja','zh'];
  const copy={
    en:['LOST IN THE INVENTORY','This page is not in stock.','The link may be old, incomplete, or already moved. Return to the live inventory, or ask us on Discord if you were looking for a specific account.','Browse live stock','Ask on Discord'],
    fr:['PAGE INTROUVABLE','Cette page est introuvable.','Ce lien est peut-être ancien, incomplet ou déplacé. Consultez le stock ou contactez-nous sur Discord.','Voir le stock','Demander sur Discord'],
    de:['SEITE NICHT GEFUNDEN','Diese Seite ist nicht verfügbar.','Der Link ist möglicherweise veraltet, unvollständig oder verschoben. Zum Bestand zurückkehren oder auf Discord fragen.','Bestand ansehen','Auf Discord fragen'],
    ar:['الصفحة غير موجودة','هذه الصفحة غير متاحة.','قد يكون الرابط قديمًا أو غير مكتمل أو تم نقله. راجع المخزون أو تواصل معنا على Discord.','تصفح المخزون','اسأل على Discord'],
    ja:['ページが見つかりません','このページは見つかりません。','リンクが古い、不完全、または移動済みの可能性があります。在庫をご覧いただくか、Discordでお問い合わせください。','在庫を見る','Discordで相談'],
    zh:['页面未找到','这个页面暂不在库。','链接可能已过期、不完整或已移动。请返回实时库存；如在寻找特定账号，也可以在 Discord 上联系我们。','浏览实时库存','在 Discord 咨询']
  };
  const trigger=document.getElementById('languageTrigger'),menu=document.getElementById('languageMenu'),picker=document.getElementById('languagePicker');
  function close(focus=false){menu.hidden=true;picker.dataset.open='false';trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus();}
  function apply(lang,persist=false){
    if(!languages.includes(lang))lang='en';
    document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
    const strings=copy[lang];
    ['.kicker','main.card h1','main.card > p','#homeLink','.actions a:last-child'].forEach((s,i)=>{document.querySelector(s).textContent=strings[i];});
    document.title=strings[1]+' · Roshine';
    const selected=menu.querySelector('[data-language-value="'+lang+'"]');
    document.getElementById('languageTriggerValue').textContent=selected.textContent;
    trigger.setAttribute('aria-label',(lang==='zh'?'语言':'Language')+': '+selected.textContent);
    menu.querySelectorAll('button').forEach(n=>{const active=n===selected;n.setAttribute('aria-selected',String(active));n.tabIndex=active?0:-1;});
    const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url.pathname+url.search+url.hash);
    if(persist){try{localStorage.setItem('roshine_lang',lang);}catch(_){}}
    document.querySelectorAll('#homeLink,#brandLink').forEach(n=>{const target=new URL(n.href);target.searchParams.set('lang',lang);n.href=target.pathname+target.search+target.hash;});
  }
  trigger.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;picker.dataset.open=String(open);trigger.setAttribute('aria-expanded',String(open));if(open)menu.querySelector('[aria-selected="true"]').focus();});
  menu.addEventListener('click',e=>{const n=e.target.closest('[data-language-value]');if(n){apply(n.dataset.languageValue,true);close(true);}});
  picker.addEventListener('keydown',e=>{if(e.key==='Escape'){close(true);return;}if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;e.preventDefault();menu.hidden=false;picker.dataset.open='true';trigger.setAttribute('aria-expanded','true');const options=Array.from(menu.querySelectorAll('button')),current=options.indexOf(document.activeElement);options[e.key==='Home'?0:e.key==='End'?options.length-1:(current+(e.key==='ArrowUp'?-1:1)+options.length)%options.length].focus();});
  document.addEventListener('click',e=>{if(!picker.contains(e.target))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Tab')close();});
  let saved='';try{saved=localStorage.getItem('roshine_lang');}catch(_){}
  const parameter=new URLSearchParams(location.search).get('lang'),browser=(navigator.language||'en').split('-')[0];
  apply(languages.includes(parameter)?parameter:languages.includes(saved)?saved:browser);
})();
