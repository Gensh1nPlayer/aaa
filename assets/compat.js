// Older iOS Safari compatibility, loaded before every other script (not deferred).
// 1. replaceChildren(): early iOS 14 Safari keeps the old children when it is called with no
//    arguments, so every "clear, then append" render stacked new content under the old one
//    (repeated capture label, repeated Overview sections). Use one reliable implementation everywhere.
// 2. Flex gap: Safari before 14.1 (iOS < 14.5) ignores `gap` on flex containers, collapsing spacing
//    between chips, icons and labels. Only on such browsers, mirror each flex gap as child margins.
(function () {
  'use strict';

  [window.Element, window.Document, window.DocumentFragment].forEach(function (type) {
    if (!type || !type.prototype) return;
    type.prototype.replaceChildren = function () {
      var nodes = Array.prototype.slice.call(arguments);
      while (this.lastChild) this.removeChild(this.lastChild);
      if (nodes.length) this.append.apply(this, nodes);
    };
  });

  function supportsFlexGap() {
    var box = document.createElement('div');
    box.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden;pointer-events:none';
    box.appendChild(document.createElement('div'));
    box.appendChild(document.createElement('div'));
    document.documentElement.appendChild(box);
    var supported = box.scrollHeight === 1;
    box.parentNode.removeChild(box);
    return supported;
  }

  function px(value) {
    var number = parseFloat(value);
    return isFinite(number) ? number : 0;
  }

  // Margin = the element's own stylesheet margin + the container's gap; the own margin is read once,
  // before this script first touches the element, so re-runs never accumulate.
  var baseMargins = new WeakMap();
  function addGap(element, property, amount) {
    var base = baseMargins.get(element);
    if (!base) { base = {}; baseMargins.set(element, base); }
    if (!(property in base)) base[property] = px(getComputedStyle(element)[property]);
    element.style[property] = (base[property] + amount) + 'px';
  }

  // Flex items are in-flow elements and also bare text (e.g. an icon <img> followed by a label).
  function inFlow(node) {
    if (node.nodeType === 3) return /\S/.test(node.nodeValue);
    if (node.nodeType !== 1) return false;
    var style = getComputedStyle(node);
    return style.display !== 'none' && style.position !== 'absolute' && style.position !== 'fixed';
  }

  function fixContainer(container) {
    var style = getComputedStyle(container);
    if (style.display !== 'flex' && style.display !== 'inline-flex') return;
    var columnGap = px(style.columnGap), rowGap = px(style.rowGap);
    if (!columnGap && !rowGap) return;
    var vertical = style.flexDirection.indexOf('column') === 0;
    var reverse = style.flexDirection.indexOf('reverse') > 0;
    var wraps = style.flexWrap !== 'nowrap';
    var mainGap = vertical ? rowGap : columnGap, crossGap = vertical ? columnGap : rowGap;
    var mainSide = vertical ? (reverse ? 'marginTop' : 'marginBottom') : (reverse ? 'marginInlineStart' : 'marginInlineEnd');
    var mainOpposite = vertical ? (reverse ? 'marginBottom' : 'marginTop') : (reverse ? 'marginInlineEnd' : 'marginInlineStart');
    var crossSide = vertical ? 'marginInlineEnd' : 'marginBottom';
    var items = Array.prototype.filter.call(container.childNodes, inFlow);
    items.forEach(function (item, index) {
      var next = items[index + 1];
      // Text cannot take a margin: put the gap on the element on the other side of it.
      if (mainGap && next) {
        if (item.nodeType === 1) addGap(item, mainSide, mainGap);
        else if (next.nodeType === 1) addGap(next, mainOpposite, mainGap);
      }
      if (wraps && crossGap && item.nodeType === 1) addGap(item, crossSide, crossGap);
    });
  }

  function polyfillFlexGap(root) {
    var scope = root || document;
    if (scope.nodeType === 1) fixContainer(scope);
    Array.prototype.forEach.call(scope.querySelectorAll('*'), fixContainer);
  }

  window.RoshineCompat = {supportsFlexGap: supportsFlexGap, polyfillFlexGap: polyfillFlexGap};
  if (supportsFlexGap()) return;

  document.documentElement.classList.add('no-flex-gap');
  var timer = null;
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { timer = null; polyfillFlexGap(document); }, 120);
  }
  function start() {
    polyfillFlexGap(document);
    // Pages render most content after load (stock cards, account tabs); follow those changes.
    new MutationObserver(schedule).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class']});
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
