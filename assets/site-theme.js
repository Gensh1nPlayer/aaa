/* Runs before styles paint. Dark is the default, independent of OS settings. */
(function () {
  'use strict';
  var root = document.documentElement;
  var key = 'roshine.theme';
  var theme = 'dark';
  try { if (localStorage.getItem(key) === 'light') theme = 'light'; } catch (_) {}
  root.setAttribute('data-theme', theme);
  function apply(value) {
    root.setAttribute('data-theme', value === 'light' ? 'light' : 'dark');
    sync();
  }
  function sync() {
    var button = document.getElementById('themeToggle');
    if (!button) return;
    var light = root.getAttribute('data-theme') === 'light';
    var labels = {
      en: ['Switch to light theme', 'Switch to dark theme'],
      fr: ['Passer au thème clair', 'Passer au thème sombre'],
      de: ['Zum hellen Design wechseln', 'Zum dunklen Design wechseln'],
      ar: ['التبديل إلى المظهر الفاتح', 'التبديل إلى المظهر الداكن'],
      ja: ['ライトテーマに切り替え', 'ダークテーマに切り替え'],
      zh: ['切换至亮色主题', '切换至暗色主题']
    };
    var copy = labels[(root.lang || 'en').split('-')[0]] || labels.en;
    button.setAttribute('aria-label', copy[light ? 1 : 0]);
    button.setAttribute('title', copy[light ? 1 : 0]);
    button.setAttribute('aria-pressed', String(light));
  }
  function init() {
    var button = document.getElementById('themeToggle');
    if (!button) return;
    button.addEventListener('click', function () {
      var value = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      apply(value);
      try { localStorage.setItem(key, value); } catch (_) {}
    });
    sync();
    new MutationObserver(sync).observe(root, {attributes: true, attributeFilter: ['lang']});
  }
  window.addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) apply(event.newValue);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
