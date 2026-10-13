(() => {
  'use strict';
  const header = document.querySelector('.header');
  const toggle = document.getElementById('mobileMenuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const picker = document.getElementById('languagePicker');
  const languageTrigger = document.getElementById('languageTrigger');
  const languageMenu = document.getElementById('languageMenu');

  function closeMobile(restoreFocus = false) {
    mobileNav.dataset.open = 'false';
    mobileNav.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', window.DetailsI18n.t('Open navigation'));
    if (restoreFocus) toggle.focus();
  }

  function closeLanguage(restoreFocus = false) {
    picker.dataset.open = 'false';
    languageMenu.hidden = true;
    languageTrigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) languageTrigger.focus();
  }

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    closeLanguage();
    mobileNav.dataset.open = String(open);
    mobileNav.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', window.DetailsI18n.t(open ? 'Close navigation' : 'Open navigation'));
    if (open) mobileNav.querySelector('a')?.focus();
  });
  mobileNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMobile();
  });
  languageTrigger.addEventListener('click', () => {
    const open = picker.dataset.open !== 'true';
    closeMobile();
    picker.dataset.open = String(open);
    languageMenu.hidden = !open;
    languageTrigger.setAttribute('aria-expanded', String(open));
    if (open) languageMenu.querySelector('[aria-selected="true"]')?.focus();
  });
  languageMenu.addEventListener('click', event => {
    const option = event.target.closest('[data-language-value]');
    if (!option) return;
    window.DetailsI18n.setLanguage(option.dataset.languageValue);
    closeLanguage(true);
  });
  picker.addEventListener('keydown', event => {
    const options = Array.from(languageMenu.querySelectorAll('button'));
    if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault();
      picker.dataset.open = 'true'; languageMenu.hidden = false;
      languageTrigger.setAttribute('aria-expanded','true');
      const current = options.indexOf(document.activeElement);
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 :
        (current + (event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
      options[index].focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!picker.contains(event.target)) closeLanguage();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (picker.dataset.open === 'true') closeLanguage(true);
    else if (mobileNav.dataset.open === 'true') closeMobile(true);
  });
  window.addEventListener('scroll', () => header.classList.toggle('rd-scrolled', window.scrollY > 40), { passive: true });
})();
