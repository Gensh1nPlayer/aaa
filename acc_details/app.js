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
  const state = { tab: 'skins', hero: 'all', heroQuery: '', search: '', rarity: 'all', sort: 'featured', page: 1, snapshot: null };
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

  function setSkinImage(image, candidates, onFailure) {
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
    badge.hidden = level === null || level === undefined;
    $(valueId).textContent = badge.hidden ? '' : formatNumber(level);
    badge.classList.toggle('is-high-level', !badge.hidden && level > 600);
  }

  function renderHeader() {
    const snapshot = state.snapshot;
    const balanceThresholds = {
      overwatchCoins: [800, 2000],
      credits: [10000, 20000],
      competitivePoints: [3000, 9000],
      legacyCompetitivePoints: [3000, 9000]
    };
    $('pageEyebrow').textContent = snapshot ? `${snapshot.accountLabel || t('Account snapshot')} · ${t(snapshot.inventoryStatus === 'complete' ? 'Complete record' : 'Partial record')} · ${snapshot.capturedAt ? new Date(snapshot.capturedAt).toLocaleString(document.documentElement.lang) : t('Capture date unavailable')}` : t('Enter a stock ID to view account details');
    $('snapshotNotice').hidden = !snapshot;
    $('snapshotNotice').textContent = t('Unrecorded items remain unknown; a complete record describes collection coverage, not a full skin catalog.');
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
    $('headerAccountId').hidden = !snapshot?.accountId;
    $('headerAccountIdValue').textContent = snapshot?.accountId ? `#${snapshot.accountId}` : '';
    if (snapshot?.accountId) $('headerAccountId').setAttribute('aria-label', `Account stock ID #${snapshot.accountId}`);
    else $('headerAccountId').removeAttribute('aria-label');
    setAccountLevelBadge('headerAccountLevel', 'headerAccountLevelValue', snapshot?.profile?.accountLevel);
    setEndorsementBadge('headerEndorsement', 'headerEndorsementValue', snapshot?.profile?.endorsementLevel);
    $('profileBadges').hidden = !snapshot;
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
    $('dialogTitle').textContent = skin.name;
    $('dialogRarity').textContent = rarityLabel(skin.rarity);
    $('dialogRarity').dataset.rarity = skin.rarity;
    setSkinImage($('dialogImage'), [skin.image, skin.fallbackImage]);
    $('dialogImage').alt = `${skin.hero} · ${skin.name}`;
    $('dialogPreview').href = skin.preview || skin.image;
    $('dialogSource').href = skin.image;
    $('dialogCatalogSource').href = skin.sourcePage || skin.source;
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
      setSkinImage(img, [skin.preview, skin.image, skin.fallbackImage], () => art.classList.add('image-error'));
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      art.append(img, element('span', 'image-fallback', skin.hero.slice(0, 2).toUpperCase()));
    }
    const meta = element('div', 'card-meta');
    const bottom = element('div', 'card-bottom');
    bottom.append(element('span', '', skin.uncatalogued ? 'In-game name' : rarityLabel(skin.rarity)),
      element('span', 'catalog-label', skin.uncatalogued ? 'No image' : state.snapshot ? 'OWNED' : 'CATALOG'));
    meta.append(element('span', 'card-hero', skin.hero), element('strong', 'card-name', skin.name), bottom);
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
    setAccountLevelBadge('accountLevel', 'accountLevelValue', snapshot?.profile?.accountLevel);
    setEndorsementBadge('accountEndorsement', 'accountEndorsementValue', snapshot?.profile?.endorsementLevel);
    $('accountPanelBadges').hidden = $('accountLevel').hidden && $('accountEndorsement').hidden;
    if (!snapshot) {
      content.append(element('p', 'account-empty', 'No account snapshot is available for this link. Please contact the store.'));
      return;
    }
    const profile = snapshot.profile;
    const metrics = element('div', 'account-metrics');
    if (profile.accountLevel !== null) metrics.append(accountMetric('Account Level', formatNumber(profile.accountLevel)));
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
      const shown = state.tab === 'statistics' ? heroes : heroes.slice(0, 3);
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
      accountLevel: nullableNumber(profile.accountLevel, 'account level'),
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
      const value = input.balances?.[key] ?? null;
      if (value !== null && (!Number.isSafeInteger(value) || value < 0)) throw new TypeError(`${key} must be a nonnegative integer or null`);
      balances[key] = value;
    }
    if (input.competitive !== undefined && (!input.competitive || typeof input.competitive !== 'object' || Array.isArray(input.competitive))) throw new TypeError('competitive must be an object');
    if (input.competitive?.ranks !== undefined && (!input.competitive.ranks || typeof input.competitive.ranks !== 'object' || Array.isArray(input.competitive.ranks))) throw new TypeError('competitive.ranks must be an object');
    const competitive = { season: typeof input.competitive?.season === 'string' ? input.competitive.season.slice(0, 40) : '', ranks: {} };
    for (const key of Object.keys(rankLabels)) competitive.ranks[key] = typeof input.competitive?.ranks?.[key] === 'string' ? input.competitive.ranks[key].slice(0, 40) : '';
    const profile = normalizeProfile(input.profile);
    if (input.capturedAt && Number.isNaN(Date.parse(input.capturedAt))) throw new TypeError('capturedAt must be a valid date');
    return {
      region: typeof input.region === 'string' ? input.region.slice(0, 16) : '',
      accountId: typeof input.accountId === 'string' ? input.accountId.slice(0, 60) : '',
      accountLabel: typeof input.accountLabel === 'string' ? input.accountLabel.slice(0, 60) : '',
      capturedAt: input.capturedAt || '',
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
    loadSnapshot(input) { state.snapshot = normalizeSnapshot(input); resetSelection(); render(); },
    clearSnapshot() { state.snapshot = null; resetSelection(); closeDialog(); render(); },
    getCatalogSize() { return catalog.length; }
  });

  function resetSelection() {
    state.hero = 'all'; state.heroQuery = ''; state.search = ''; state.rarity = 'all'; state.sort = 'featured'; state.page = 1; state.tab = 'skins';
    $('heroSearch').value = ''; $('skinSearch').value = ''; $('rarityFilter').value = 'all'; $('sortFilter').value = 'featured';
  }

  document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { state.tab = button.dataset.tab; render(); }));
  document.querySelectorAll('[data-tab-link]').forEach((button) => button.addEventListener('click', () => { state.tab = button.dataset.tabLink; render(); }));
  $('heroSearch').addEventListener('input', (event) => { state.heroQuery = event.target.value.trim().toLocaleLowerCase(); renderHeroList(); });
  $('skinSearch').addEventListener('input', (event) => { state.search = event.target.value.trim().toLocaleLowerCase(); state.page = 1; renderSkins(); });
  $('rarityFilter').addEventListener('change', (event) => { state.rarity = event.target.value; state.page = 1; renderSkins(); });
  $('sortFilter').addEventListener('change', (event) => { state.sort = event.target.value; state.page = 1; renderSkins(); });
  $('resetButton').addEventListener('click', () => {
    state.hero = 'all'; state.heroQuery = ''; state.search = ''; state.rarity = 'all'; state.sort = 'featured'; state.page = 1;
    $('heroSearch').value = ''; $('skinSearch').value = ''; $('rarityFilter').value = 'all'; $('sortFilter').value = 'featured';
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
