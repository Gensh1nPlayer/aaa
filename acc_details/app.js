(() => {
  'use strict';

  const catalog = Array.isArray(window.HERO_GALLERY_CATALOG) ? window.HERO_GALLERY_CATALOG : [];
  const byId = new Map(catalog.map((skin) => [skin.id, skin]));
  const weaponCatalog = Array.isArray(window.HERO_GALLERY_WEAPONS) ? window.HERO_GALLERY_WEAPONS : [];
  const weaponById = new Map(weaponCatalog.map((weapon) => [weapon.id, weapon]));
  const variantNames = Array.isArray(window.HERO_GALLERY_VARIANTS) ? window.HERO_GALLERY_VARIANTS : [];
  const featured = [
    'Soldier_76/ALPINE_76', 'Bastion/ANTIQUE', 'Symmetra/ARCHITECH',
    'Pharah/ASP', 'Bastion/AVALANCHE', 'Doomfist/BLACKHAND',
    'Sombra/DEMON_HUNTER', 'D.Va/ACADEMY', 'Genji/BAIHU', 'Roadhog/BAJIE'
  ];
  const featuredOrder = new Map(featured.map((id, index) => [id, index]));
  const rarityOrder = new Map(['mythic', 'ultra', 'evolution', 'legendary', 'epic', 'rare', 'common', 'unknown'].map((value, index) => [value, index]));
  const pageSize = 24;
  const state = { tab: 'overview', hero: 'all', heroQuery: '', search: '', rarity: 'all', sort: 'rarity', page: 1, snapshot: null };
  let stockAccount = null;
  const stockColorTiers = new Map();
  let modalReturnFocus = null;
  const $ = (id) => document.getElementById(id);
  const t = (message, values) => window.DetailsI18n.t(message, values);
  const formatNumber = (value) => value.toLocaleString(document.documentElement.lang || 'en');
  const compareText = (a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' });
  const rarityLabel = (value) => t(({ mythic: 'Mythic', ultra: 'Ultra', evolution: 'Evolution', legendary: 'Legendary', epic: 'Epic', rare: 'Rare', common: 'Common', unknown: 'Unclassified' })[value] || value);
  const isDefaultSkin = (skin) => skin && ['overwatch', 'overwatchclassic'].includes(skin.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const rankLabels = { tank: 'Tank', damage: 'Damage', support: 'Support', openQueue: 'Open Queue' };
  const rankTiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Champion'];
  const roleIcons = { tank: 'assets/roles/tank.svg', damage: 'assets/roles/damage.svg', support: 'assets/roles/support.svg' };

  function captureDate(value) {
    // Python exports microseconds; trim to milliseconds for older Safari's ISO parser.
    return new Date(typeof value === 'string' ? value.replace(/(\.\d{3})\d+(?=Z|[+-]\d{2}:?\d{2}$)/, '$1') : value);
  }

  function renderCaptureLabel(snapshot) {
    const label = $('pageEyebrow');
    label.replaceChildren();
    if (!snapshot) { label.textContent = t('Enter a stock ID to view account details'); return; }
    label.append(document.createTextNode(`${snapshot.accountLabel || t('Account snapshot')} · ${t(snapshot.inventoryStatus === 'complete' ? 'Complete record' : 'Partial record')} · `));
    if (!snapshot.capturedAt) { label.append(document.createTextNode(t('Capture date unavailable'))); return; }
    const iso = captureDate(snapshot.capturedAt).toISOString();
    const time = document.createElement('time');
    time.className = 'capture-time'; time.dateTime = iso; time.dir = 'ltr';
    time.title = t('Captured at (UTC)');
    time.textContent = iso.slice(0, 19).replace('T', ' ') + ' UTC';
    label.append(time);
  }

  function setSkinImage(image, candidates, onFailure) {
    image.onload = null; image.onerror = null;
    const urls = [...new Set(candidates.filter(Boolean))];
    if (!urls.length) { image.removeAttribute('src'); onFailure?.(); return; }
    let index = 0;
    const tryFallback = () => {
      index++;
      if (index < urls.length) image.src = urls[index];
      else onFailure?.();
    };
    image.referrerPolicy = 'no-referrer';
    image.onerror = tryFallback;
    image.onload = () => {
      if (image.src.includes('static.wikia.nocookie.net') && image.naturalWidth === 300 && image.naturalHeight === 171) tryFallback();
    };
    image.src = urls[0];
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = typeof text === 'string' ? t(text) : text;
    return node;
  }

  function renderSkinName(node, skin) {
    const visuals = window.RoshineSkinVisuals;
    if (!visuals) { node.textContent = skin.name; return; }
    const styled = visuals.formatName(skin.name);
    // A newly catalogued Mythic remains colored even before its name is added to the dictionary.
    node.innerHTML = skin.rarity === 'mythic' && !styled.includes('class="ac-special-skin ')
      ? `<span class="ac-special-skin ac-special-skin-mythic">${styled}</span>` : styled;
    node.title = skin.name;
  }

  function renderRarity(node, rarity, label) {
    node.dataset.rarity = rarity;
    const effect = rarity === 'mythic' ? 'ac-special-skin-mythic' : rarity === 'ultra' ? 'ac-special-skin-ultra-rare' : '';
    node.replaceChildren(element('span', effect ? `ac-special-skin ${effect}` : '', label));
  }

  function roleLabel(key, label) {
    const wrapper = element('span', 'role-label');
    if (roleIcons[key]) {
      const icon = element('img', 'role-icon');
      icon.src = roleIcons[key];
      icon.alt = '';
      wrapper.append(icon);
    }
    wrapper.append(document.createTextNode(t(label)));
    return wrapper;
  }

  function rankTier(value) {
    const match = /^([a-z]+)(?:\s+[1-5])?$/i.exec(value.trim());
    return match ? rankTiers.find((tier) => tier.toLowerCase() === match[1].toLowerCase())?.toLowerCase() || '' : '';
  }

  function rankCard(key, label, value) {
    const tier = rankTier(value);
    const card = element('div', `competitive-card${tier ? ` tier-${tier}` : ''}`);
    card.append(roleLabel(key, label), element('strong', 'rank-value', value));
    return card;
  }

  function currentItems() {
    if (!state.snapshot) return [];
    return [...state.snapshot.ownedSkinIds.map((id) => byId.get(id) || unmatchedItem(id)),
      ...state.snapshot.uncataloguedOwnedItems.filter((item) => item.category === 'skins').map((item) => ({
        ...item, id: `uncatalogued/${item.hero}/${item.name}`, rarity: 'unknown', uncatalogued: true
      }))];
  }

  function currentWeapons() {
    return state.snapshot ? [...state.snapshot.ownedWeaponSkinIds.map((id) => weaponById.get(id) || unmatchedItem(id, true)),
      ...state.snapshot.uncataloguedOwnedItems.filter((item) => item.category === 'weapons').map((item) => ({
        ...item, id: `uncatalogued/${item.hero}/${item.name}`, rarity: 'unknown', uncatalogued: true
      }))] : [];
  }

  function currentVariants() {
    return state.snapshot ? [...state.snapshot.ownedWeaponVariants,
      ...state.snapshot.uncataloguedOwnedItems.filter((item) => item.category === 'variants')] : [];
  }

  function missingCount() {
    return state.snapshot ? state.snapshot.ownedSkinIds.filter((id) => !byId.has(id)).length : 0;
  }

  function unmatchedItem(id, weapon = false) {
    const parts = id.split('/');
    const hero = (parts[weapon ? 1 : 0] || 'Unknown').replace(/_/g, ' ');
    const name = (parts.slice(weapon ? 2 : 1).join('/') || id).replace(/_/g, ' ');
    return { id, hero, name, rarity: 'unknown', uncatalogued: true };
  }

  function setEndorsementBadge(id, valueId, level) {
    const badge = $(id);
    const valid = Number.isInteger(level) && level >= 1 && level <= 5;
    badge.hidden = !valid;
    $(valueId).textContent = valid ? String(level) : '';
    if (valid) badge.dataset.endorsementTier = String(level);
    else delete badge.dataset.endorsementTier;
  }

  function setAccountLevelBadge(id, valueId, level) {
    const badge = $(id);
    const parsed = window.RoshineAccountDisplay?.parseLevel(level);
    badge.hidden = level === null || level === undefined || String(level).trim() === '';
    $(valueId).textContent = badge.hidden ? '' : parsed ? parsed.main || '—' : String(level);
    badge.title = String(level ?? '');
    // A compound level is a display string, never a sum.
    badge.classList.toggle('is-high-level', !badge.hidden && /^\d+$/.test(parsed?.main || String(level)) && Number(parsed?.main || level) > 600);
  }

  function stockColorTier(skin) {
    const key = JSON.stringify([skin.name, skin.rarity]);
    if (stockColorTiers.has(key)) return stockColorTiers.get(key);
    const html = window.RoshineSkinVisuals?.formatName(skin.name) || '';
    // Mythic, Shop and Bundle share exactly the same Stock gradient.
    const groups = [['ultra-rare'], ['collector'], ['rare'], ['mythic', 'shop', 'bundle'], ['esports']];
    const matched = groups.findIndex(tiers => tiers.some(tier => html.includes(`ac-special-skin-${tier}"`)));
    const rank = matched >= 0 ? matched : skin.rarity === 'mythic' ? 3 : groups.length;
    stockColorTiers.set(key, rank);
    return rank;
  }

  function renderHeader() {
    const snapshot = state.snapshot;
    const balanceThresholds = {
      overwatchCoins: [800, 2000],
      credits: [10000, 20000],
      competitivePoints: [3000, 9000],
      legacyCompetitivePoints: [3000, 9000]
    };
    renderCaptureLabel(snapshot);
    $('tabSkinCount').textContent = formatNumber(currentItems().length);
    $('tabWeaponCount').textContent = formatNumber(currentWeapons().length);
    $('tabVariantCount').textContent = state.snapshot ? formatNumber(currentVariants().length) : '';
    document.querySelectorAll('[data-balance]').forEach((node) => {
      const value = snapshot?.balances?.[node.dataset.balance];
      const available = Number.isInteger(value) && value >= 0;
      const [yellow, pink] = balanceThresholds[node.dataset.balance] || [Infinity, Infinity];
      node.textContent = available ? formatNumber(value) : '—';
      node.classList.toggle('balance-value-threshold', available && value >= yellow && value < pink);
      node.classList.toggle('balance-value-critical', available && value >= pink);
      node.closest('.balance-item').classList.toggle('is-premium', node.dataset.balance === 'mythicPrisms' && available && value > 0);
    });
  }

  function renderHeroList() {
    const items = state.tab === 'weapons' ? currentWeapons() : state.tab === 'variants' ? currentVariants() : currentItems();
    const counts = new Map();
    items.forEach((skin) => counts.set(skin.hero, (counts.get(skin.hero) || 0) + 1));
    const heroes = [...counts.keys()].sort(compareText);
    const list = $('heroList');
    list.replaceChildren();
    const addHero = (name, count) => {
      if (name !== 'all' && !name.toLocaleLowerCase().includes(state.heroQuery)) return;
      const button = element('button', `hero-option${state.hero === name ? ' active' : ''}`);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(state.hero === name));
      button.append(element('span', '', name === 'all' ? 'All heroes' : name), element('span', 'hero-count', formatNumber(count)));
      button.addEventListener('click', () => { state.hero = name; state.page = 1; render(); });
      list.append(button);
    };
    addHero('all', items.length);
    heroes.forEach((name) => addHero(name, counts.get(name)));
  }

  function filteredItems() {
    const search = state.search;
    const items = currentItems().filter((skin) =>
      (state.hero === 'all' || skin.hero === state.hero) &&
      (state.rarity === 'all' || skin.rarity === state.rarity) &&
      (!search || `${skin.hero} ${skin.name} ${skin.id}`.toLocaleLowerCase().includes(search))
    );
    items.sort((a, b) => {
      const tier = stockColorTier(a) - stockColorTier(b);
      if (tier) return tier;
      if (state.sort === 'featured') {
        const aFeatured = featuredOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bFeatured = featuredOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        if (aFeatured !== bFeatured) return aFeatured - bFeatured;
      }
      if (state.sort === 'rarity') {
        const rarity = (rarityOrder.get(a.rarity) ?? 99) - (rarityOrder.get(b.rarity) ?? 99);
        if (rarity) return rarity;
      }
      if (state.sort === 'name') return compareText(a.name, b.name) || compareText(a.hero, b.hero);
      return compareText(a.hero, b.hero) || compareText(a.name, b.name);
    });
    return items;
  }

  function openSkin(skin, trigger) {
    $('dialogHero').textContent = skin.hero.toUpperCase();
    renderSkinName($('dialogTitle'), skin);
    renderRarity($('dialogRarity'), skin.rarity, rarityLabel(skin.rarity));
    const imageWrap = $('dialogImage').parentElement;
    imageWrap.classList.remove('image-error');
    $('dialogImageFallback').hidden = true;
    setSkinImage($('dialogImage'), window.DetailsImageSources.candidates(skin), () => {
      imageWrap.classList.add('image-error');
      $('dialogImageFallback').textContent = t('Image unavailable');
      $('dialogImageFallback').hidden = false;
    });
    $('dialogImage').alt = `${skin.hero} · ${skin.name}`;
    $('dialogPreview').href = window.DetailsImageSources.candidates(skin,true)[0] || '';
    $('dialogSource').href = window.DetailsImageSources.candidates(skin)[0] || '';
    $('dialogCatalogSource').href = window.DetailsImageSources.sourcePage(skin) || '';
    $('dialogNote').textContent = t(state.snapshot ? 'This account snapshot records the item as owned. Check it against the game client.' : 'Catalog information does not confirm ownership for any account.');
    openDialog(trigger);
  }

  function openDialog(trigger) {
    const dialog = $('skinDialog');
    modalReturnFocus = trigger || document.activeElement;
    document.body.classList.add('details-modal-open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else {
      dialog.classList.add('legacy-dialog');
      dialog.setAttribute('open', '');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      $('dialogBackdrop').hidden = false;
    }
    $('closeDialog').focus();
  }

  function closeDialog() {
    const dialog = $('skinDialog');
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    $('dialogBackdrop').hidden = true;
    document.body.classList.remove('details-modal-open');
    if (modalReturnFocus?.isConnected) modalReturnFocus.focus();
  }

  function makeCard(skin) {
    const card = element(skin.uncatalogued ? 'div' : 'button', 'skin-card');
    if (!skin.uncatalogued) card.type = 'button';
    card.dataset.rarity = skin.rarity;
    card.setAttribute('aria-label', `${skin.hero}，${skin.name}，${rarityLabel(skin.rarity)}`);
    const art = element('div', 'card-art');
    if (skin.uncatalogued) {
      art.classList.add('image-error');
      art.append(element('span', 'image-fallback', 'Image unavailable'));
    } else {
      const img = element('img');
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      setSkinImage(img, window.DetailsImageSources.candidates(skin), () => art.classList.add('image-error'));
      art.append(img, element('span', 'image-fallback', skin.hero.slice(0, 2).toUpperCase()));
    }
    const meta = element('div', 'card-meta');
    const bottom = element('div', 'card-bottom');
    const rarity = element('span', 'rarity-label');
    renderRarity(rarity, skin.rarity, skin.uncatalogued ? t('In-game name') : rarityLabel(skin.rarity));
    const name = element('strong', 'card-name');
    renderSkinName(name, skin);
    bottom.append(rarity,
      element('span', 'catalog-label', skin.uncatalogued ? 'No image' : state.snapshot ? 'OWNED' : 'CATALOG'));
    meta.append(element('span', 'card-hero', skin.hero), name, bottom);
    card.append(art, meta);
    if (!skin.uncatalogued) card.addEventListener('click', () => openSkin(skin, card));
    return card;
  }

  function pageButton(label, disabled, onClick) {
    const button = element('button', 'page-button', label);
    button.type = 'button';
    button.disabled = disabled;
    button.addEventListener('click', onClick);
    return button;
  }

  function renderSkins() {
    const items = filteredItems();
    const pages = Math.max(1, Math.ceil(items.length / pageSize));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * pageSize;
    const end = Math.min(items.length, start + pageSize);
    $('pageTitle').textContent = state.hero === 'all' ? t('All heroes') : state.hero;
    $('resultText').textContent = t('{count} recorded skins · Showing {range}', { count:formatNumber(items.length), range:items.length ? `${start + 1}–${end}` : '0' }) + (missingCount() ? t(' · {count} catalog IDs unmatched',{count:missingCount()}) : '');
    $('resultHint').textContent = t('Choose an item for details');
    $('emptyState').hidden = items.length > 0;
    $('skinGrid').replaceChildren(...items.slice(start, end).map(makeCard));
    const nav = $('pagination');
    nav.replaceChildren();
    if (pages > 1) {
      nav.append(
        pageButton('← Previous', state.page === 1, () => { state.page--; renderSkins(); window.scrollTo({ top: 0, behavior: 'smooth' }); }),
        element('span', 'page-label', `${state.page} / ${pages}`),
        pageButton('Next →', state.page === pages, () => { state.page++; renderSkins(); window.scrollTo({ top: 0, behavior: 'smooth' }); })
      );
    }
  }

  function renderWeapons() {
    const items = currentWeapons().filter((item) => state.hero === 'all' || item.hero === state.hero);
    $('weaponNotice').textContent = t('The snapshot records {count} weapon skins. Unrecorded items are not assumed unowned; default weapons are excluded.', {count:items.length});
    $('weaponGrid').replaceChildren(...items.map(makeCard));
  }

  function renderVariants() {
    const items = currentVariants().filter((item) => state.hero === 'all' || item.hero === state.hero);
    $('variantNotice').textContent = t('The snapshot records {count} unlocked weapon variants. Default variants are excluded; unscanned heroes remain unknown.', {count:items.length});
    const grid = $('variantGrid');
    grid.replaceChildren();
    for (const item of items) {
      const card = element('div', 'variant-card');
      const swatch = element('span', `variant-swatch variant-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
      card.append(swatch, element('span', 'card-hero', item.hero), element('strong', 'card-name', item.name), element('span', 'variant-owned', '✓ OWNED'));
      grid.append(card);
    }
    if (!items.length) grid.append(element('p', 'account-empty', state.snapshot ? 'No weapon variants are recorded in this selection.' : 'No account snapshot has been loaded.'));
  }

  function accountMetric(label, value) {
    const card = element('div', 'account-metric');
    card.append(element('span', '', label), element('strong', '', value));
    return card;
  }

  function accountSection(title, child) {
    const section = element('section', 'account-section');
    section.append(element('h2', '', title), child);
    return section;
  }

  function accountTable(headers, rows) {
    const table = element('table', 'account-table');
    const head = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach((header) => headerRow.append(element('th', '', header)));
    head.append(headerRow);
    const body = document.createElement('tbody');
    for (const cells of rows) {
      const row = document.createElement('tr');
      cells.forEach((cell) => {
        const td = element('td');
        td.append(cell instanceof Node ? cell : document.createTextNode(cell));
        row.append(td);
      });
      body.append(row);
    }
    table.append(head, body);
    return table;
  }

  function renderAccountPanel() {
    const snapshot = state.snapshot;
    const content = $('accountContent');
    content.replaceChildren();
    $('accountHeading').textContent = snapshot?.accountId ? `ID #${snapshot.accountId}` : 'Account snapshot';
    $('accountEyebrow').textContent = t(state.tab === 'statistics' ? 'ACCOUNT / STATISTICS' : 'ACCOUNT / OVERVIEW');
    const stock = stockAccount && String(stockAccount.id) === snapshot?.accountId ? stockAccount : null;
    const profileLevel = snapshot?.profile?.accountLevel;
    const level = typeof profileLevel === 'string' ? profileLevel
      : String(stock?.level ?? '').includes('+') ? stock.level : profileLevel ?? stock?.level;
    setAccountLevelBadge('accountLevel', 'accountLevelValue', level);
    setEndorsementBadge('accountEndorsement', 'accountEndorsementValue', snapshot?.profile?.endorsementLevel);
    const display = window.RoshineAccountDisplay;
    const versions = typeof profileLevel === 'string' ? display?.parseLevel(profileLevel).versions || [] : [];
    if (!versions.length && snapshot?.accountVersion) versions.push(snapshot.accountVersion);
    if (!versions.length) versions.push(...(display?.parseLevel(stock?.level).versions || []));
    const version = versions.join(' / ');
    $('accountVersion').replaceChildren(...versions.map(value => element('span', `details-version game-version-${value.toLowerCase()}`, value)));
    $('accountVersion').hidden = !version;
    let labels = $('accountStockTags');
    if (!labels) {
      labels = element('div', 'account-stock-tags'); labels.id = 'accountStockTags';
      $('accountPanelBadges').after(labels);
    }
    const tags = [...(display?.stockTags(stock) || []), ...(display?.parseLevel(level).tags || [])];
    labels.replaceChildren(...tags.filter((tag, index) => tags.findIndex(other => other.text === tag.text) === index)
      .map(tag => element('span', `details-stock-tag ${tag.className}`, tag.text)));
    labels.hidden = !labels.children.length;
    $('accountPanelBadges').hidden = $('accountLevel').hidden && $('accountEndorsement').hidden && !version;
    $('overviewBalances').hidden = state.tab !== 'overview' || !snapshot;
    if (!snapshot) {
      content.append(element('p', 'account-empty', 'No account snapshot is available for this link. Please contact the store.'));
      return;
    }
    const profile = snapshot.profile;
    const metrics = element('div', 'account-metrics');
    if (state.tab === 'statistics' && level !== null && level !== undefined) metrics.append(accountMetric('Account Level', String(level)));
    if (profile.timePlayedHours !== null) metrics.append(accountMetric('Time Played', t('{count} hrs', {count:formatNumber(profile.timePlayedHours)})));
    if (profile.gamesPlayed !== null) metrics.append(accountMetric('Games Played', formatNumber(profile.gamesPlayed)));
    if (profile.gamesWon !== null) metrics.append(accountMetric('Games Won', formatNumber(profile.gamesWon)));
    if (metrics.children.length) content.append(accountSection(state.tab === 'overview' ? 'Account overview' : 'All-mode statistics', metrics));
    const roleNames = { tank: 'Tank', damage: 'Damage', support: 'Support' };
    const roleRows = Object.entries(roleNames).filter(([key]) => {
      const role = profile.roleStats[key];
      return role.timePlayedHours !== null || role.gamesWon !== null;
    });
    if (roleRows.length) {
      if (state.tab === 'statistics') {
        content.append(accountSection('Role statistics', accountTable(['Role', 'Time Played', 'Games Won'], roleRows.map(([key, label]) => {
          const role = profile.roleStats[key];
          return [roleLabel(key, label), role.timePlayedHours === null ? '—' : t('{count} hrs', {count:formatNumber(role.timePlayedHours)}), role.gamesWon === null ? '—' : formatNumber(role.gamesWon)];
        }))));
      } else {
        const cards = element('div', 'account-cards');
        for (const [key, label] of roleRows) {
          const role = profile.roleStats[key];
          const card = element('div', 'account-card');
          card.append(roleLabel(key, label));
          if (role.timePlayedHours !== null) card.append(element('strong', '', t('{count} hrs', {count:formatNumber(role.timePlayedHours)})));
          if (role.gamesWon !== null) card.append(element('small', '', t('{count} wins', {count:formatNumber(role.gamesWon)})));
          cards.append(card);
        }
        content.append(accountSection('By role', cards));
      }
    }
    const heroes = profile.heroesPlayed;
    if (heroes.length) {
      const shown = state.tab === 'statistics' ? heroes : heroes.slice().sort((a, b) =>
        (b.timePlayedHours ?? -1) - (a.timePlayedHours ?? -1)
      ).slice(0, 3);
      content.append(accountSection(state.tab === 'overview' ? 'Most played heroes' : 'Hero levels and playtime', accountTable(['Hero', 'Hero Level', 'Time Played'], shown.map((item) => [
        item.hero, item.level === null ? '—' : formatNumber(item.level), item.timePlayedHours === null ? '—' : t('{count} hrs', {count:formatNumber(item.timePlayedHours)})
      ]))));
    }
    if (!content.children.length) content.append(element('p', 'account-empty', 'This snapshot does not include overview or statistics data yet.'));
  }

  function renderTab() {
    const collectionTab = ['skins', 'weapons', 'variants'].includes(state.tab);
    document.querySelector('.sidebar').hidden = !collectionTab;
    document.querySelector('.workspace').classList.toggle('no-sidebar', !collectionTab);
    document.querySelectorAll('[data-tab]').forEach((button) => {
      const active = button.dataset.tab === state.tab;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    $('skinsPanel').hidden = state.tab !== 'skins';
    $('weaponsPanel').hidden = state.tab !== 'weapons';
    $('variantsPanel').hidden = state.tab !== 'variants';
    $('accountPanel').hidden = !['overview', 'statistics'].includes(state.tab);
    $('placeholderPanel').hidden = ['skins', 'weapons', 'variants'].includes(state.tab) || !$('accountPanel').hidden;
    if (state.tab === 'weapons') renderWeapons();
    if (state.tab === 'variants') renderVariants();
    $('placeholderPanel').classList.toggle('competitive-view', state.tab === 'competitive' && Boolean(state.snapshot));
    if (!$('accountPanel').hidden) renderAccountPanel();
    if (!$('placeholderPanel').hidden) {
      $('placeholderTitle').textContent = t('Competitive');
      $('placeholderText').textContent = t(state.snapshot
        ? 'Recorded seasons, ranks and competitive points. A blank field has not been collected.'
        : 'No competitive account data is available. Load a snapshot to view ranks and seasons.');
    }
    const summary = $('competitiveSummary');
    summary.hidden = state.tab !== 'competitive' || !state.snapshot;
    summary.replaceChildren();
    if (!summary.hidden) {
      const competitive = state.snapshot.competitive;
      if (competitive.season || Object.values(competitive.ranks).some(Boolean)) summary.append(element('h2', '', competitive.season || 'Current season'));
      const cards = element('div', 'competitive-cards');
      for (const [key, label] of Object.entries(rankLabels)) {
        if (!competitive.ranks[key]) continue;
        cards.append(rankCard(key, label, competitive.ranks[key]));
      }
      for (const [key, label] of [['competitivePoints', 'Competitive Points'], ['legacyCompetitivePoints', 'Legacy Competitive Points']]) {
        const value = state.snapshot.balances[key];
        if (value === null) continue;
        const card = element('div', 'competitive-card');
        card.append(element('span', '', label), element('strong', '', formatNumber(value)));
        cards.append(card);
      }
      if (cards.children.length) summary.append(cards);
      if (state.snapshot.profile.historicalRanks.length) {
        summary.append(element('h2', '', 'Rank history'));
        for (const season of state.snapshot.profile.historicalRanks) {
          summary.append(element('h3', '', season.season));
          const historyCards = element('div', 'competitive-cards');
          for (const [key, label] of Object.entries(rankLabels)) {
            if (!season.ranks[key]) continue;
            historyCards.append(rankCard(key, label, season.ranks[key]));
          }
          summary.append(historyCards);
        }
      }
      if (!summary.children.length) summary.append(element('p', 'account-empty', 'This snapshot does not include competitive data yet.'));
    }
  }

  function render() {
    renderHeader();
    if (['skins', 'weapons', 'variants'].includes(state.tab)) renderHeroList();
    if (state.tab === 'skins') renderSkins();
    renderTab();
  }

  function nullableNumber(value, name, integer = true, minimum = 0, maximum = Infinity) {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'number' || !Number.isFinite(value) || (integer && !Number.isSafeInteger(value)) || value < minimum || value > maximum) throw new TypeError(`${name} must be a valid number or null`);
    return value;
  }

  function normalizeProfile(input) {
    if (input !== undefined && (!input || typeof input !== 'object' || Array.isArray(input))) throw new TypeError('profile must be an object');
    const profile = input || {};
    const levelPattern = /^\s*(?:(?:level|lv\.?)\s*)?\d+(?:,\d{3})*(?:\s*\+\s*\d+(?:,\d{3})*)*(?:\s*(?:[-–—•·]\s*)?(?:OW[12]|(?:bronze|silver|golden|gold|platinum|diamond)\s*border|stacked(?:\s*account)?|premium(?:\s*account)?))*\s*$/i;
    if (typeof profile.accountLevel === 'string' && (profile.accountLevel.length > 500 || !levelPattern.test(profile.accountLevel))) throw new TypeError('account level must be a supported level string of at most 500 characters');
    const roleStats = {};
    for (const key of ['tank', 'damage', 'support']) {
      const role = profile.roleStats?.[key] || {};
      roleStats[key] = {
        timePlayedHours: nullableNumber(role.timePlayedHours, `${key} playtime`, false),
        gamesWon: nullableNumber(role.gamesWon, `${key} wins`)
      };
    }
    const heroesPlayed = Array.isArray(profile.heroesPlayed) ? profile.heroesPlayed.slice(0, 100).map((item) => ({
      hero: typeof item?.hero === 'string' ? item.hero.slice(0, 60) : '',
      level: nullableNumber(item?.level, 'hero level'),
      timePlayedHours: nullableNumber(item?.timePlayedHours, 'hero playtime', false)
    })).filter((item) => item.hero) : [];
    const historicalRanks = Array.isArray(profile.historicalRanks) ? profile.historicalRanks.slice(0, 100).map((item) => {
      const ranks = {};
      for (const key of Object.keys(rankLabels)) ranks[key] = typeof item?.ranks?.[key] === 'string' ? item.ranks[key].slice(0, 40) : '';
      return { season: typeof item?.season === 'string' ? item.season.slice(0, 40) : '', ranks };
    }).filter((item) => item.season && Object.values(item.ranks).some(Boolean)) : [];
    return {
      endorsementLevel: nullableNumber(profile.endorsementLevel, 'endorsement level', true, 0, 5),
      accountLevel: typeof profile.accountLevel === 'string' ? profile.accountLevel : nullableNumber(profile.accountLevel, 'account level'),
      timePlayedHours: nullableNumber(profile.timePlayedHours, 'total playtime', false),
      gamesPlayed: nullableNumber(profile.gamesPlayed, 'Games Played'),
      gamesWon: nullableNumber(profile.gamesWon, 'Games Won'),
      roleStats, heroesPlayed, historicalRanks
    };
  }

  function normalizeSnapshot(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('snapshot must be an object');
    if (!Array.isArray(input.ownedSkinIds) || !input.ownedSkinIds.every((id) => typeof id === 'string')) throw new TypeError('ownedSkinIds must be an array of strings');
    if (input.balances !== undefined && (!input.balances || typeof input.balances !== 'object' || Array.isArray(input.balances))) throw new TypeError('balances must be an object');
    const balances = {};
    for (const key of ['mythicPrisms', 'overwatchCoins', 'credits', 'competitivePoints', 'legacyCompetitivePoints', 'lootBoxes']) {
      // Also support older snapshots exported before the unscanned-zero policy.
      const value = input.balances?.[key] ?? (key === 'mythicPrisms' || key === 'competitivePoints' ? 0 : null);
      if (value !== null && (!Number.isSafeInteger(value) || value < 0)) throw new TypeError(`${key} must be a nonnegative integer or null`);
      balances[key] = value;
    }
    if (input.competitive !== undefined && (!input.competitive || typeof input.competitive !== 'object' || Array.isArray(input.competitive))) throw new TypeError('competitive must be an object');
    if (input.competitive?.ranks !== undefined && (!input.competitive.ranks || typeof input.competitive.ranks !== 'object' || Array.isArray(input.competitive.ranks))) throw new TypeError('competitive.ranks must be an object');
    const competitive = { season: typeof input.competitive?.season === 'string' ? input.competitive.season.slice(0, 40) : '', ranks: {} };
    for (const key of Object.keys(rankLabels)) competitive.ranks[key] = typeof input.competitive?.ranks?.[key] === 'string' ? input.competitive.ranks[key].slice(0, 40) : '';
    const profile = normalizeProfile(input.profile);
    if (input.capturedAt && Number.isNaN(captureDate(input.capturedAt).getTime())) throw new TypeError('capturedAt must be a valid date');
    return {
      region: typeof input.region === 'string' ? input.region.slice(0, 16) : '',
      accountId: typeof input.accountId === 'string' ? input.accountId.slice(0, 60) : '',
      accountLabel: typeof input.accountLabel === 'string' ? input.accountLabel.slice(0, 60) : '',
      capturedAt: input.capturedAt || '',
      accountVersion: ['OW1', 'OW2'].includes(input.accountVersion) ? input.accountVersion : '',
      balances,
      competitive,
      profile,
      ownedSkinIds: [...new Set(input.ownedSkinIds)].filter((id) => !isDefaultSkin(byId.get(id))),
      ownedWeaponSkinIds: Array.isArray(input.ownedWeaponSkinIds) ? [...new Set(input.ownedWeaponSkinIds)].filter((id) => typeof id === 'string') : [],
      ownedWeaponVariants: Array.isArray(input.ownedWeaponVariants) ? input.ownedWeaponVariants.filter((item) =>
        item && typeof item.hero === 'string' && typeof item.name === 'string' && variantNames.includes(item.name) && item.name !== 'Default'
      ).map((item) => ({ hero: item.hero.slice(0, 60), name: item.name })) : [],
      uncataloguedOwnedItems: Array.isArray(input.uncataloguedOwnedItems) ? input.uncataloguedOwnedItems.filter((item) =>
        item && typeof item.hero === 'string' && typeof item.name === 'string' &&
        ['skins', 'weapons', 'variants'].includes(item.category) && item.hero && item.name &&
        item.hero.length <= 60 && item.name.length <= 100
      ).map((item) => ({ hero: item.hero, category: item.category, name: item.name })) : [],
      inventoryStatus: input.inventoryStatus === 'complete' ? 'complete' : 'partial'
    };
  }

  window.HeroGallery = Object.freeze({
    setStockAccount(row) { stockAccount = row && typeof row === 'object' ? row : null; render(); },
    loadSnapshot(input) { state.snapshot = normalizeSnapshot(input); resetSelection(); render(); },
    clearSnapshot() { state.snapshot = null; stockAccount = null; resetSelection(); closeDialog(); render(); },
    getCatalogSize() { return catalog.length; }
  });

  function resetSelection() {
    state.hero = 'all'; state.heroQuery = ''; state.search = ''; state.rarity = 'all'; state.sort = 'rarity'; state.page = 1; state.tab = 'overview';
    $('heroSearch').value = ''; $('skinSearch').value = ''; $('rarityFilter').value = 'all'; $('sortFilter').value = 'rarity';
  }

  document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { state.tab = button.dataset.tab; render(); }));
  document.querySelectorAll('[data-tab-link]').forEach((button) => button.addEventListener('click', () => { state.tab = button.dataset.tabLink; render(); }));
  $('heroSearch').addEventListener('input', (event) => { state.heroQuery = event.target.value.trim().toLocaleLowerCase(); renderHeroList(); });
  $('skinSearch').addEventListener('input', (event) => { state.search = event.target.value.trim().toLocaleLowerCase(); state.page = 1; renderSkins(); });
  $('rarityFilter').addEventListener('change', (event) => { state.rarity = event.target.value; state.page = 1; renderSkins(); });
  $('sortFilter').addEventListener('change', (event) => { state.sort = event.target.value; state.page = 1; renderSkins(); });
  $('resetButton').addEventListener('click', () => {
    state.hero = 'all'; state.heroQuery = ''; state.search = ''; state.rarity = 'all'; state.sort = 'rarity'; state.page = 1;
    $('heroSearch').value = ''; $('skinSearch').value = ''; $('rarityFilter').value = 'all'; $('sortFilter').value = 'rarity';
    render();
  });
  const backdrop = element('div', 'dialog-backdrop');
  backdrop.id = 'dialogBackdrop'; backdrop.hidden = true;
  document.body.append(backdrop);
  $('closeDialog').addEventListener('click', closeDialog);
  backdrop.addEventListener('click', closeDialog);
  $('skinDialog').addEventListener('click', (event) => { if (event.target === $('skinDialog')) closeDialog(); });
  $('skinDialog').addEventListener('close', () => {
    document.body.classList.remove('details-modal-open');
    if (modalReturnFocus?.isConnected) modalReturnFocus.focus();
  });
  document.addEventListener('keydown', event => {
    const dialog = $('skinDialog');
    if (!dialog.hasAttribute('open')) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDialog(); }
    if (event.key === 'Tab') {
      const focusable = Array.from(dialog.querySelectorAll('button,a[href]'));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('roshine:language-changed', render);

  render();
})();
