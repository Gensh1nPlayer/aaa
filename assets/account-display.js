(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RoshineAccountDisplay = api;
})(typeof window === 'object' ? window : null, function () {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  function parseLevel(raw) {
    const original = String(raw ?? '');
    let main = original.replace(/<br\s*\/?\s*>/gi, ' ').replace(/\s+/g, ' ').trim();
    const versions = [], tags = [];
    main = main.replace(/\bOW([12])\b/gi, (_, version) => {
      const label = `OW${version}`;
      if (!versions.includes(label)) versions.push(label);
      return ' ';
    });
    main = main.replace(/\bpremium(?:\s*account)?\b/gi, () => {
      if (!tags.some(tag => tag.className === 'premium')) tags.push({text:'Premium Account', className:'premium'});
      return ' ';
    }).replace(/\b(bronze|silver|golden|gold|platinum|plat|diamond)\s*border\b/gi, (_, tier) => {
      const canonical = {golden:'gold', plat:'platinum'}[tier.toLowerCase()] || tier.toLowerCase();
      const text = `${canonical[0].toUpperCase()}${canonical.slice(1)} Border`;
      if (!tags.some(tag => tag.text === text)) tags.push({text, className:'border-tier'});
      return ' ';
    }).replace(/\bstacked(?:\s*account)?\b/gi, () => {
      if (!tags.some(tag => tag.className === 'stacked')) tags.push({text:'Stacked Account', className:'stacked'});
      return ' ';
    });
    main = main.replace(/^\s*(?:level|lv\.?)\s*/i, '').replace(/\s*\+\s*/g, ' + ')
      .replace(/\s+/g, ' ').replace(/^[\s\-–—•·]+|[\s\-–—•·]+$/g, '').trim();
    return {raw:original, main, versions, tags};
  }
  function levelHTML(raw) {
    const parsed = parseLevel(raw);
    return {
      main:escape(`Lv. ${parsed.main || '—'}`), title:escape(parsed.raw || 'Lv. —'),
      versions:parsed.versions.map(version => `<span class="ac-level-tag game-version game-version-${version.toLowerCase()}">${version}</span>`).join(''),
      tags:parsed.tags.map(tag => `<span class="ac-level-tag ${tag.className}">${escape(tag.text)}</span>`).join('')
    };
  }
  function isPremium(row) {
    if (!row || typeof row !== 'object') return false;
    const flags = ['top500Eligible','top500Eligiable','top500_eligible','top500Eligibility','top500','isTop500Eligible'];
    const readBooleanFlag = value => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value > 0;
      const normalized = String(value ?? '').replace(/<[^>]*>/g, ' ').trim().toLowerCase();
      if (/^(?:✓|✔|yes|true|1|available|eligible|free)$/i.test(normalized)) return true;
      if (/^(?:✘|✖|×|no|false|0|unavailable|not eligible|none)$/i.test(normalized)) return false;
      return /(?:free\s+(?:name\s+)?change|name\s+change\s+available)/i.test(normalized);
    };
    const eligible = flags.some(key => readBooleanFlag(row[key]));
    const containsTop500 = value => /\btop\s*500(?:\s+(?:challenger\s+tier\s+eligible|eligible))?\b/i.test(String(value ?? '')
      .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
      .replace(/\b(?:no|not|without)\s+top\s*500(?:\s+(?:challenger\s+tier\s+eligible|eligible))?\b/gi, ' ')
      .replace(/\btop\s*500(?:\s+(?:challenger\s+tier\s+eligible|eligible))?\s*(?:[:=\-]\s*)?(?:no|false|ineligible|not\s+eligible)\b/gi, ' '));
    const text = Object.values(row).filter(value => ['string','number','boolean'].includes(typeof value)).join(' ');
    return Number.parseFloat(String(row.price ?? '').replace(/[^0-9.]/g, '')) >= 100 || eligible || flags.some(key => containsTop500(row[key])) || containsTop500(text);
  }
  function stockTags(row) {
    if (!row || typeof row !== 'object') return [];
    const tags = parseLevel(row.level).tags;
    // Highlights contain prose and skin names: accept only complete label fields.
    const fields = String(row.highlights ?? '').replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<[^>]*>/g, ' ').split(/[\n\r•·|;,]+/);
    fields.forEach(field => {
      const label = field.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '').trim();
      if (!/^(?:(?:bronze|silver|golden|gold|platinum|plat|diamond)\s*border|stacked\s+account|premium\s+account)$/i.test(label)) return;
      parseLevel(label).tags.forEach(tag => {
        if (!tags.some(other => other.text === tag.text)) tags.push(tag);
      });
    });
    if (isPremium(row) && !tags.some(tag => tag.className === 'premium')) tags.unshift({text:'Premium Account', className:'premium'});
    tags.sort((a, b) => Number(b.className === 'premium') - Number(a.className === 'premium'));
    return tags;
  }
  return Object.freeze({parseLevel, levelHTML, stockTags, isPremium});
});
