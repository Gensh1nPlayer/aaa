(function () {
  'use strict';
  const footer = document.querySelector('.roshine-footer');
  if (!footer) return;
  const copy = {
    en: {footerLabel:'Store information',navigation:'Footer navigation',contactLinks:'Contact links',description:'Overwatch accounts. Clear details, guided handover, and support beyond checkout.',since:'Selling since 2021',explore:'Explore',home:'Home',stock:'Account stock',details:'Account details',services:'Services',support:'Support',warranty:'Warranty & security',faq:'FAQ',auth:'Authenticator',connect:'Connect',email:'Email us',contact:'Contact',legal:'Legal',privacy:'Privacy policy',terms:'Terms of service',rights:'All rights reserved.'},
    fr: {footerLabel:'Informations sur la boutique',navigation:'Navigation de pied de page',contactLinks:'Liens de contact',description:'Comptes Overwatch. Informations claires, transfert accompagné et assistance après l’achat.',since:'À votre service depuis 2021',explore:'Découvrir',home:'Accueil',stock:'Comptes en stock',details:'Détails du compte',services:'Services',support:'Assistance',warranty:'Garantie et sécurité',faq:'FAQ',auth:'Authenticator',connect:'Contact',email:'Nous écrire',contact:'Nous contacter',legal:'Informations légales',privacy:'Confidentialité',terms:'Conditions d’utilisation',rights:'Tous droits réservés.'},
    de: {footerLabel:'Shop-Informationen',navigation:'Fußzeilennavigation',contactLinks:'Kontaktlinks',description:'Overwatch-Accounts. Klare Angaben, begleitete Übergabe und Support nach dem Kauf.',since:'Für dich da seit 2021',explore:'Entdecken',home:'Startseite',stock:'Account-Bestand',details:'Account-Details',services:'Leistungen',support:'Support',warranty:'Garantie & Sicherheit',faq:'FAQ',auth:'Authenticator',connect:'Kontakt',email:'E-Mail senden',contact:'Kontakt aufnehmen',legal:'Rechtliches',privacy:'Datenschutz',terms:'Nutzungsbedingungen',rights:'Alle Rechte vorbehalten.'},
    ar: {footerLabel:'معلومات المتجر',navigation:'روابط تذييل الصفحة',contactLinks:'روابط التواصل',description:'حسابات Overwatch. تفاصيل واضحة، وتسليم بإرشاد، ودعم يستمر بعد الشراء.',since:'في خدمتكم منذ 2021',explore:'استكشف',home:'الرئيسية',stock:'الحسابات المتاحة',details:'تفاصيل الحساب',services:'الخدمات',support:'الدعم',warranty:'الضمان والأمان',faq:'الأسئلة الشائعة',auth:'Authenticator',connect:'تواصل معنا',email:'راسلنا بالبريد',contact:'التواصل',legal:'معلومات قانونية',privacy:'سياسة الخصوصية',terms:'شروط الخدمة',rights:'جميع الحقوق محفوظة.'},
    ja: {footerLabel:'ストア情報',navigation:'フッターナビゲーション',contactLinks:'連絡先リンク',description:'Overwatchアカウント。明確な情報、丁寧な引き渡し、購入後も続くサポート。',since:'2021年から販売',explore:'ストア',home:'ホーム',stock:'アカウント在庫',details:'アカウント詳細',services:'サービス',support:'サポート',warranty:'保証と安全性',faq:'よくある質問',auth:'Authenticator',connect:'お問い合わせ',email:'メール',contact:'連絡先',legal:'ポリシー',privacy:'プライバシー',terms:'利用規約',rights:'無断転載を禁じます。'}
  };
  if (window.RoshineZh) copy.zh = window.RoshineZh.footer;
  function sync() {
    const lang = document.documentElement.lang.split('-')[0];
    const text = copy[lang] || copy.en;
    footer.querySelectorAll('[data-rf]').forEach(node => { node.textContent = text[node.dataset.rf] || copy.en[node.dataset.rf]; });
    footer.querySelectorAll('[data-rf-label]').forEach(node => { node.setAttribute('aria-label',text[node.dataset.rfLabel]); });
    footer.setAttribute('aria-label',text.footerLabel);
    const languageTrigger = document.getElementById('languageTrigger');
    if (languageTrigger) languageTrigger.title = languageTrigger.getAttribute('aria-label') || 'Language';
    footer.querySelector('#footerLine1').textContent = '© 2021–' + new Date().getFullYear() + ' Roshine Account Store. ' + text.rights;
    footer.querySelectorAll('a[href^="/"]').forEach(link => {
      const target = new URL(link.getAttribute('href'), location.origin);
      if (copy[lang] && lang !== 'en') target.searchParams.set('lang',lang);
      else target.searchParams.delete('lang');
      link.setAttribute('href',target.pathname + target.search + target.hash);
      if (target.pathname !== '/' && target.pathname === location.pathname.replace(/index\.html$/,'')) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
  }
  sync();
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      document.body.classList.toggle('rf-footer-visible',entries[0].isIntersecting);
    },{threshold:0.15}).observe(footer);
  }
})();
