/* Main-page opt-in: load this script with defer before main.js. Auto-inits at DOM ready.
 * Required DOM: #currencyPicker > button#currencyTrigger + #currencyMenu.
 * Optional: #currencyTriggerValue (preserves your chevron), #currencyStatus.
 * init() builds the nine menu options and returns Promise<snapshot>.
 * select(code) saves a manual preference and returns Promise<snapshot>.
 * format(originalUSD:number) returns symbol + grouped amount, exactly one decimal.
 * Read-only: code (actual displayed currency), selectedCode (requested), status,
 * rateDate, fetchedAt, codes, snapshot. Both events carry detail = snapshot:
 * window: currencychange; document: roshine:currency-changed.
 * status: idle | loading | ready | error | stale. No persisted FX cache.
 * Rates: https://frankfurter.dev/ (daily observations, NOT live quotes).
 * IP fallback: https://ipapi.co/api/#specific-location-field-1 (currency only).
 */
(function (window, document) {
  'use strict';
  if (window.RoshineCurrency) return;
  const CODES = Object.freeze(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'AED', 'KRW', 'JPY', 'CNY']);
  const SYMBOLS = {USD:'$', EUR:'€', GBP:'£', CAD:'CA$', AUD:'A$', AED:'د.إ\u00a0', KRW:'₩', JPY:'¥', CNY:'CN¥'};
  const REGIONS = {US:'USD', GB:'GBP', CA:'CAD', AU:'AUD', AE:'AED', KR:'KRW', JP:'JPY', CN:'CNY'};
  // Euro-area regions only; never infer currency from a bare language (e.g. "en").
  'AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK BG AX AD MC SM VA'.split(' ').forEach(region => { REGIONS[region] = 'EUR'; });
  const FX_URL = 'https://api.frankfurter.dev/v2/rates?base=USD&quotes=EUR,GBP,CAD,AUD,AED,KRW,JPY,CNY';
  const IP_URL = 'https://ipapi.co/currency/';
  const STORAGE_KEY = 'roshine.currency';
  const FETCH_TTL = 60 * 60 * 1000;
  const MAX_RATE_AGE = 7 * 24 * 60 * 60 * 1000; // allows weekends/bank holidays
  const number = new Intl.NumberFormat('en-US', {minimumFractionDigits:1, maximumFractionDigits:1});
  let selectedCode = 'USD', status = 'idle', source = 'default';
  let rates = Object.create(null), fetched = null, pendingRates = null, initialization = null;
  let revision = 0, expiryTimer = null, ui = null;
  const validCode = code => typeof code === 'string' && CODES.includes(code);
  function fresh(code) {
    const row = rates[code], now = Date.now();
    return !!row && fetched !== null && now >= fetched && now - fetched < FETCH_TTL && now >= row.time && now - row.time < MAX_RATE_AGE;
  }
  function actualCode() { return selectedCode === 'USD' || fresh(selectedCode) ? selectedCode : 'USD'; }
  function snapshot() {
    const code = actualCode();
    return Object.freeze({code, selectedCode, status:status === 'ready' && code !== selectedCode ? 'stale' : status, source,
      rateDate:code === 'USD' ? null : rates[code].date,
      fetchedAt:fetched === null ? null : new Date(fetched).toISOString()});
  }
  function readSaved() { try { const code = window.localStorage.getItem(STORAGE_KEY); return validCode(code) ? code : null; } catch (_) { return null; } }
  function save(code) { try { window.localStorage.setItem(STORAGE_KEY, code); } catch (_) { /* private mode / quota */ } }
  function browserCurrency() {
    const languages = Array.from(navigator.languages || []);
    if (navigator.language && !languages.includes(navigator.language)) languages.push(navigator.language);
    for (const language of languages) {
      try {
        // Intl.Locale ignores Unicode extensions when reading the explicit region.
        const region = new Intl.Locale(language).region;
        if (REGIONS[region]) return REGIONS[region];
      } catch (_) { /* malformed browser locale: try the next preference */ }
    }
    return null;
  }
  async function request(url, kind) {
    const controller = new AbortController();
    let timer;
    try {
      return await Promise.race([
        (async () => {
          const response = await fetch(url, {method:'GET', mode:'cors', credentials:'omit', referrerPolicy:'no-referrer', cache:'no-store', signal:controller.signal});
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return kind === 'text' ? response.text() : response.json();
        })(),
        new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Request timed out')); }, 8000); })
      ]);
    } finally { clearTimeout(timer); }
  }
  function loadRates() {
    if (pendingRates) return pendingRates;
    pendingRates = (async () => {
      const rows = await request(FX_URL, 'json');
      if (!Array.isArray(rows)) throw new Error('Invalid rates response');
      const next = Object.create(null), now = Date.now();
      rows.forEach(row => {
        if (!row || row.base !== 'USD' || !validCode(row.quote) || row.quote === 'USD' || typeof row.rate !== 'number' || !Number.isFinite(row.rate) || row.rate <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) return;
        const time = Date.parse(row.date + 'T00:00:00Z');
        if (!Number.isFinite(time) || new Date(time).toISOString().slice(0,10) !== row.date || time > now || now - time >= MAX_RATE_AGE) return;
        // Reject ambiguous duplicate quotes instead of accepting a last-writer rate.
        if (Object.prototype.hasOwnProperty.call(next, row.quote)) throw new Error('Duplicate quote');
        next[row.quote] = {rate:row.rate, date:row.date, time};
      });
      rates = next;
      fetched = now;
    })().finally(() => { pendingRates = null; });
    return pendingRates;
  }
  function publish() {
    clearTimeout(expiryTimer);
    const state = snapshot();
    render(state);
    if (state.code !== 'USD') {
      const delay = Math.min(fetched + FETCH_TTL, rates[state.code].time + MAX_RATE_AGE) - Date.now();
      expiryTimer = setTimeout(() => { status = 'stale'; publish(); }, Math.max(1, delay));
    }
    window.dispatchEvent(new CustomEvent('currencychange', {detail:state}));
    document.dispatchEvent(new CustomEvent('roshine:currency-changed', {detail:state}));
    return state;
  }
  async function apply(code, origin, token) {
    selectedCode = code; source = origin;
    if (code === 'USD' || fresh(code)) { status = 'ready'; return publish(); }
    status = 'loading'; publish();
    try {
      await loadRates();
      if (token !== revision) return snapshot();
      status = fresh(code) ? 'ready' : 'error';
    } catch (_) { if (token !== revision) return snapshot(); status = 'error'; }
    return publish();
  }
  function select(code) {
    if (!validCode(code)) throw new RangeError('Unsupported currency: ' + code);
    save(code);
    return apply(code, 'manual', ++revision);
  }
  function init() {
    bind();
    if (initialization) return initialization;
    if (status !== 'idle') {
      if (snapshot().status === 'error' || snapshot().status === 'stale') return apply(selectedCode, source, ++revision);
      render(snapshot()); return Promise.resolve(snapshot());
    }
    const token = ++revision;
    initialization = (async () => {
      const saved = readSaved();
      if (saved) return apply(saved, 'saved', token);
      const browser = browserCurrency();
      if (browser) return apply(browser, 'browser', token);
      status = 'loading'; publish();
      let ip;
      try { ip = (await request(IP_URL, 'text')).trim(); } catch (_) { /* EUR default */ }
      if (token !== revision) return snapshot();
      return apply(validCode(ip) ? ip : 'EUR', validCode(ip) ? 'ip' : 'default', token);
    })().finally(() => { initialization = null; });
    return initialization;
  }
  function format(usd) {
    if (typeof usd !== 'number' || !Number.isFinite(usd)) throw new TypeError('USD amount must be a finite number');
    const code = actualCode(), value = usd * (code === 'USD' ? 1 : rates[code].rate);
    if (!Number.isFinite(value)) throw new RangeError('Converted amount is out of range');
    return SYMBOLS[code] + number.format(value);
  }
  function render(state) {
    if (!ui) return;
    const {picker, trigger, menu, value, notice} = ui;
    value.textContent = state.code;
    trigger.setAttribute('aria-label', 'Currency: ' + state.code);
    picker.dataset.currency = state.code;
    picker.dataset.currencyStatus = state.status;
    picker.setAttribute('aria-busy', String(state.status === 'loading'));
    const message = state.code !== 'USD'
      ? 'Daily FX rates dated ' + state.rateDate + '; fetched ' + state.fetchedAt + '. Prices are estimates.'
      : state.selectedCode !== 'USD' ? 'Requested ' + state.selectedCode + '. Showing USD. ' + (state.status === 'loading' ? 'Exchange rates loading.' : 'Exchange rates unavailable or expired. Select a currency to retry.') : 'Prices in USD.';
    trigger.title = message; notice.textContent = message;
    menu.querySelectorAll('[data-currency-value]').forEach(option => { option.setAttribute('aria-selected', String(option.dataset.currencyValue === state.code)); });
  }
  function bind() {
    const picker = document.getElementById('currencyPicker');
    const trigger = document.getElementById('currencyTrigger');
    const menu = document.getElementById('currencyMenu');
    if (!picker || !trigger || !menu || !picker.contains(trigger) || !picker.contains(menu)) return;
    if (ui && ui.picker === picker && ui.trigger === trigger && ui.menu === menu) return;
    if (ui) ui.cleanup();
    picker.classList.add('currency-picker'); trigger.classList.add('currency-trigger'); menu.classList.add('currency-menu');
    const header = picker.closest('.header');
    if (header) header.classList.add('currency-enabled-header');
    trigger.type = 'button'; trigger.setAttribute('aria-haspopup', 'listbox'); trigger.setAttribute('aria-controls', 'currencyMenu');
    menu.setAttribute('role', 'listbox'); menu.setAttribute('aria-label', 'Currency');
    let value = document.getElementById('currencyTriggerValue');
    if (!value || !trigger.contains(value)) { value = document.createElement('span'); value.id = 'currencyTriggerValue'; trigger.replaceChildren(value); }
    let notice = document.getElementById('currencyStatus');
    if (!notice || !picker.contains(notice)) { notice = document.createElement('span'); notice.id = 'currencyStatus'; picker.appendChild(notice); }
    notice.classList.add('currency-status'); notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite');
    trigger.setAttribute('aria-describedby', 'currencyStatus');
    const options = CODES.map(code => {
      const option = document.createElement('button'); option.type = 'button'; option.className = 'currency-option';
      option.dataset.currencyValue = code; option.setAttribute('role', 'option'); option.tabIndex = -1; option.textContent = code;
      return option;
    });
    menu.replaceChildren(...options);
    function close(restore) { picker.dataset.open = 'false'; menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); if (restore) trigger.focus(); }
    function open(index) {
      picker.dataset.open = 'true'; menu.hidden = false; trigger.setAttribute('aria-expanded', 'true');
      options[index === undefined ? Math.max(0, CODES.indexOf(actualCode())) : index].focus();
    }
    const listeners = [];
    function on(target, type, listener) { target.addEventListener(type, listener); listeners.push(() => target.removeEventListener(type, listener)); }
    on(trigger, 'click', () => { if (menu.hidden) open(); else close(false); });
    on(trigger, 'keydown', event => {
      if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) { event.preventDefault(); open(event.key === 'End' || event.key === 'ArrowUp' ? options.length - 1 : event.key === 'Home' ? 0 : undefined); }
      if (event.key === 'Escape') close(false);
    });
    on(menu, 'click', event => { const option = event.target.closest('[data-currency-value]'); if (option && menu.contains(option)) { close(true); select(option.dataset.currencyValue); } });
    on(menu, 'keydown', event => {
      const index = options.indexOf(document.activeElement);
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % options.length;
      if (event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = options.length - 1;
      if (next !== undefined) { event.preventDefault(); options[next].focus(); }
      else if (event.key === 'Escape') { event.preventDefault(); close(true); }
      else if (event.key === 'Tab') close(false);
      else if (/^[a-z]$/i.test(event.key)) {
        const ordered = options.slice(index + 1).concat(options.slice(0, index + 1));
        const match = ordered.find(option => option.dataset.currencyValue.startsWith(event.key.toUpperCase()));
        if (match) { event.preventDefault(); match.focus(); }
      }
    });
    on(document, 'click', event => { if (!picker.contains(event.target)) close(false); });
    on(picker, 'focusout', event => { if (!picker.contains(event.relatedTarget)) close(false); });
    ui = {picker, trigger, menu, value, notice, cleanup:() => listeners.forEach(remove => remove())};
    close(false); render(snapshot());
  }
  window.RoshineCurrency = Object.freeze({init, format, select, codes:CODES,
    get code() { return actualCode(); }, get selectedCode() { return selectedCode; },
    get status() { return snapshot().status; }, get rateDate() { return snapshot().rateDate; },
    get fetchedAt() { return snapshot().fetchedAt; }, get snapshot() { return snapshot(); }});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})(window, document);
