document.addEventListener("DOMContentLoaded", () => {
      // --- Background Rain Animation ---
      const canvas = document.getElementById('bg-canvas');
      const ctx = canvas.getContext('2d');
      let width, height;
      const drops = [];
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      let rainFrame = 0;
      let resizeTimer = 0;

      function initRain() {
        width = canvas.width = window.innerWidth || document.documentElement.clientWidth || 1080;
        height = canvas.height = window.innerHeight || document.documentElement.clientHeight || 1920;
        drops.length = 0;
        const numDrops = Math.floor(width / 15); // Adjust density
        for (let i = 0; i < numDrops; i++) {
          drops.push({
            x: Math.random() * width,
            y: Math.random() * height,
            speed: Math.random() * 1.5 + 0.5,
            length: Math.random() * 15 + 10,
            opacity: Math.random() * 0.4 + 0.1,
            // Randomly choose between cyan and purple
            color: Math.random() > 0.5 ? '41, 182, 255' : '183, 124, 255'
          });
        }
      }

      const scheduleRainResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(initRain, 120);
      };

      function drawRain() {
        ctx.clearRect(0, 0, width, height);
        drops.forEach(drop => {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x, drop.y + drop.length);
          ctx.strokeStyle = `rgba(${drop.color}, ${drop.opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          drop.y += drop.speed;
          if (drop.y > height) {
            drop.y = -drop.length;
            drop.x = Math.random() * width;
          }
        });
        rainFrame = requestAnimationFrame(drawRain);
      }
      if (!prefersReducedMotion.matches) {
        window.addEventListener('resize', scheduleRainResize, { passive: true });
        initRain();
        drawRain();
      } else {
        canvas.hidden = true;
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          cancelAnimationFrame(rainFrame);
        } else if (!prefersReducedMotion.matches) {
          cancelAnimationFrame(rainFrame);
          drawRain();
        }
      });
      // ---------------------------------

      const mobileMenuToggle = document.getElementById('mobileMenuToggle');
      const mobileNav = document.getElementById('mobileNav');
      const currentA11y = () => (i18n[document.documentElement.lang] || i18n.en).a11y;
      const closeMobileNav = ({ restoreFocus = false } = {}) => {
        mobileNav?.setAttribute('data-open', 'false');
        mobileNav?.setAttribute('aria-hidden', 'true');
        mobileMenuToggle?.setAttribute('aria-expanded', 'false');
        mobileMenuToggle?.setAttribute('aria-label', currentA11y().openNav);
        if (restoreFocus) mobileMenuToggle?.focus();
      };
      mobileMenuToggle?.addEventListener('click', () => {
        const willOpen = mobileMenuToggle.getAttribute('aria-expanded') !== 'true';
        mobileMenuToggle.setAttribute('aria-expanded', String(willOpen));
        mobileMenuToggle.setAttribute('aria-label', willOpen ? currentA11y().closeNav : currentA11y().openNav);
        mobileNav?.setAttribute('data-open', String(willOpen));
        mobileNav?.setAttribute('aria-hidden', String(!willOpen));
        if (willOpen) window.setTimeout(() => mobileNav?.querySelector('a')?.focus(), 40);
      });
      mobileNav?.addEventListener('click', event => {
        if (event.target.closest('a')) closeMobileNav();
      });

      const accountInventory = {
        all: [],
        collator: new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
      };

      function parseNumber(value) {
        if (value === null || value === undefined || value === '') return 0;
        const normalized = String(value).replace(/,/g, '');
        const match = normalized.match(/-?\d+(?:\.\d+)?/);
        return match ? Number(match[0]) || 0 : 0;
      }

      function parseTaggedAmount(acct, fieldName, labelPattern) {
        const directValue = acct?.[fieldName];
        if (directValue !== null && directValue !== undefined && String(directValue).trim() !== '') {
          return parseNumber(directValue);
        }

        const sources = [acct?.balance, acct?.highlights, acct?.summary]
          .filter(Boolean)
          .join(' ')
          .replace(/<br\s*\/?>(?:\s*)/gi, ' ');
        const match = sources.match(new RegExp(`([\\d,]+(?:\\.\\d+)?)\\s*${labelPattern}\\b`, 'i'));
        return match ? parseNumber(match[1]) : 0;
      }

      function getPlaytime(acct) {
        const directValue = acct?.playtime;
        if (directValue !== null && directValue !== undefined && String(directValue).trim() !== '') {
          return parseNumber(directValue);
        }
        const balance = String(acct?.balance ?? '').replace(/<br\s*\/?>(?:\s*)/gi, ' ');
        const match = balance.match(/([\d,]+(?:\.\d+)?)\s*(?:h|hours?)\b/i);
        return match ? parseNumber(match[1]) : 0;
      }

      function getCredits(acct) {
        return parseTaggedAmount(acct, 'credits', 'Credits?');
      }

      function getCoins(acct) {
        return parseTaggedAmount(acct, 'coins', '(?:Overwatch\\s*)?Coins?');
      }

      function getMythicPrisms(acct) {
        const directValue = acct?.mythicPrisms ?? acct?.prisms;
        if (directValue !== null && directValue !== undefined && String(directValue).trim() !== '') {
          return parseNumber(directValue);
        }
        return parseTaggedAmount(acct, 'mythicPrisms', 'Mythic\\s+Prisms?');
      }

      function getCompetitivePoints(acct) {
        const legacyPoints = parseTaggedAmount(acct, 'legacyCompetitivePoints', 'Legacy\\s+Competitive\\s+Points?');
        const competitivePoints = parseTaggedAmount(acct, 'competitivePoints', '(?:Competitive|Comp)\\s+Points?');
        return legacyPoints + competitivePoints;
      }

      function getLevelTotal(acct) {
        const levelText = String(acct?.level ?? '').replace(/OW[12]/gi, '');
        const values = levelText.match(/\d+(?:\.\d+)?/g);
        return values?.length
          ? values.reduce((sum, value) => sum + Number(value), 0)
          : 0;
      }

      function accountMatchesType(acct, type) {
        if (type === 'all') return true;
        const levelText = String(acct?.level ?? '').toLowerCase();
        return type === 'ow1' ? levelText.includes('ow1') : levelText.includes('ow2');
      }

      function getAccountStatus(acct) {
        const status = String(acct?.status ?? '').toLowerCase();
        if (status.includes('sold')) return 'sold';
        if (status.includes('pending')) return 'pending';
        return 'instock';
      }

      function accountMatchesStatus(acct, status) {
        return status === 'all' || getAccountStatus(acct) === status;
      }

      function accountMatchesPrice(acct, range) {
        const price = parseNumber(acct?.price);
        if (range === 'under30') return price < 30;
        if (range === '30to100') return price >= 30 && price <= 100;
        if (range === 'over100') return price > 100;
        return true;
      }

      function readBooleanFlag(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value > 0;
        const normalized = String(value ?? '')
          .replace(/<[^>]*>/g, ' ')
          .trim()
          .toLowerCase();
        if (!normalized) return false;
        if (/^(?:✓|✔|yes|true|1|available|eligible|free)$/i.test(normalized)) return true;
        if (/^(?:✘|✖|×|no|false|0|unavailable|not eligible|none)$/i.test(normalized)) return false;
        return /(?:free\s+(?:name\s+)?change|name\s+change\s+available)/i.test(normalized);
      }

      function hasFreeNameChange(acct) {
        const directValue = acct?.nameChange ?? acct?.freeNameChange ?? acct?.freeRename;
        return readBooleanFlag(directValue);
      }

      function accountMatchesNameChange(acct, value) {
        if (value === 'all') return true;
        return hasFreeNameChange(acct) === (value === 'yes');
      }

      const TOP500_ELIGIBILITY_PATTERN = /\btop\s*500(?:\s+(?:challenger\s+tier\s+eligible|eligible))?\b/i;
      const TOP500_NEGATIVE_PATTERNS = [
        /\b(?:no|not|without)\s+top\s*500(?:\s+(?:challenger\s+tier\s+eligible|eligible))?\b/gi,
        /\btop\s*500(?:\s+(?:challenger\s+tier\s+eligible|eligible))?\s*(?:[:=\-]\s*)?(?:no|false|ineligible|not\s+eligible)\b/gi
      ];

      function containsTop500EligibilityKeyword(value) {
        let normalized = String(value ?? '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (!normalized) return false;
        TOP500_NEGATIVE_PATTERNS.forEach(pattern => {
          normalized = normalized.replace(pattern, ' ');
        });
        return TOP500_ELIGIBILITY_PATTERN.test(normalized);
      }

      function hasTop500Eligibility(acct) {
        const directKeys = [
          'top500Eligible', 'top500Eligiable', 'top500_eligible',
          'top500Eligibility', 'top500', 'isTop500Eligible'
        ];

        for (const key of directKeys) {
          const rawValue = acct?.[key];
          if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') continue;
          if (readBooleanFlag(rawValue)) return true;
          if (containsTop500EligibilityKeyword(rawValue)) return true;
        }

        const searchableText = Object.values(acct ?? {})
          .filter(value => value !== null && value !== undefined)
          .join(' ');

        // Accepted keywords (case-insensitive): TOP 500, Top 500,
        // Top 500 Eligible, and Top 500 Challenger Tier Eligible.
        return containsTop500EligibilityKeyword(searchableText);
      }

      function accountMatchesSearch(acct, query) {
        const normalizedQuery = String(query ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
        if (!normalizedQuery) return true;

        const searchableText = Object.values(acct ?? {})
          .filter(value => value !== null && value !== undefined)
          .join(' ')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (/^top\s*500(?:\s+eligible)?$/i.test(normalizedQuery)) {
          return hasTop500Eligibility(acct);
        }
        if (normalizedQuery === 'grandmaster') {
          return /\b(?:grandmaster|gm)\b/i.test(searchableText);
        }
        if (/^mythic\s+prisms?$/i.test(normalizedQuery)) {
          return getMythicPrisms(acct) > 0 || /\bmythic\s+prisms?\b/i.test(searchableText);
        }
        return searchableText.toLocaleLowerCase().includes(normalizedQuery);
      }

      function compareAccounts(a, b, sortValue) {
        if (!sortValue || sortValue === 'recommended') return 0;
        const [field, direction = 'desc'] = String(sortValue).split('-');
        const directionFactor = direction === 'desc' ? -1 : 1;
        let result = 0;

        switch (field) {
          case 'level':
            result = getLevelTotal(a) - getLevelTotal(b);
            break;
          case 'playtime':
            result = getPlaytime(a) - getPlaytime(b);
            break;
          case 'price':
            result = parseNumber(a?.price) - parseNumber(b?.price);
            break;
          case 'credits':
            result = getCredits(a) - getCredits(b);
            break;
          case 'coins':
            result = getCoins(a) - getCoins(b);
            break;
          case 'mythicPrisms':
            result = getMythicPrisms(a) - getMythicPrisms(b);
            break;
          default:
            return 0;
        }

        if (result === 0) {
          result = accountInventory.collator.compare(String(a?.id ?? ''), String(b?.id ?? ''));
        }
        return result * directionFactor;
      }

      function escapeUiText(value) {
        return String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      function getAccountFilterControls() {
        return {
          search: document.getElementById('accountSearch'),
          type: document.getElementById('accountTypeFilter'),
          status: document.getElementById('accountStatusFilter'),
          price: document.getElementById('accountPriceFilter'),
          nameChange: document.getElementById('accountNameChangeFilter'),
          sort: document.getElementById('accountSort')
        };
      }

      function getActiveAccountFilters(ui = getAccountUiText()) {
        const controls = getAccountFilterControls();
        const active = [];
        const query = controls.search?.value.trim() || '';
        if (query) active.push({ key: 'search', label: `${ui.searchLabel}: ${query}` });
        if (controls.type?.value && controls.type.value !== 'all') {
          active.push({ key: 'type', label: controls.type.selectedOptions[0]?.textContent || controls.type.value });
        }
        if (controls.status?.value && controls.status.value !== 'instock') {
          active.push({ key: 'status', label: controls.status.selectedOptions[0]?.textContent || controls.status.value });
        }
        if (controls.price?.value && controls.price.value !== 'all') {
          active.push({ key: 'price', label: controls.price.selectedOptions[0]?.textContent || controls.price.value });
        }
        if (controls.nameChange?.value && controls.nameChange.value !== 'all') {
          active.push({ key: 'nameChange', label: controls.nameChange.selectedOptions[0]?.textContent || controls.nameChange.value });
        }
        if (controls.sort?.value && controls.sort.value !== 'recommended') {
          active.push({ key: 'sort', label: controls.sort.selectedOptions[0]?.textContent || controls.sort.value });
        }
        return active;
      }

      function updateAccountFilterUi(ui = getAccountUiText(), shownCount = null) {
        const controls = getAccountFilterControls();
        const active = getActiveAccountFilters(ui);
        const activeContainer = document.getElementById('activeAccountFilters');
        const resetButton = document.getElementById('resetAccountFilters');
        const countBadge = document.getElementById('mobileFilterCount');
        const applyLabel = document.getElementById('applyAccountFiltersLabel');

        if (activeContainer) {
          activeContainer.hidden = active.length === 0;
          activeContainer.innerHTML = active.length
            ? `<span class="active-filter-heading">${escapeUiText(ui.activeFilters)}</span>` + active.map(item => `
                <button class="active-filter-chip" type="button" data-clear-filter="${item.key}" title="${escapeUiText(ui.clearFilter)}">
                  <span class="active-filter-chip-label">${escapeUiText(item.label)}</span>
                  <span class="active-filter-chip-x" aria-hidden="true">×</span>
                </button>`).join('')
            : '';
        }
        if (resetButton) resetButton.disabled = active.length === 0;
        if (countBadge) {
          countBadge.hidden = active.length === 0;
          countBadge.textContent = String(active.length);
        }
        if (applyLabel && shownCount !== null) {
          applyLabel.textContent = ui.applyFilters.replace('{count}', String(shownCount));
        }

        const normalizedQuery = controls.search?.value.trim().toLocaleLowerCase() || '';
        document.querySelectorAll('[data-account-keyword]').forEach(button => {
          const keyword = String(button.dataset.accountKeyword ?? '').trim().toLocaleLowerCase();
          button.setAttribute('aria-pressed', String(Boolean(keyword) && keyword === normalizedQuery));
        });
      }

      function clearAccountFilter(key) {
        const controls = getAccountFilterControls();
        if (key === 'search' && controls.search) controls.search.value = '';
        if (key === 'type' && controls.type) controls.type.value = 'all';
        if (key === 'status' && controls.status) controls.status.value = 'instock';
        if (key === 'price' && controls.price) controls.price.value = 'all';
        if (key === 'nameChange' && controls.nameChange) controls.nameChange.value = 'all';
        if (key === 'sort' && controls.sort) controls.sort.value = 'recommended';
        renderAccounts();
      }

      function resetAccountFilters() {
        const controls = getAccountFilterControls();
        if (controls.search) controls.search.value = '';
        if (controls.type) controls.type.value = 'all';
        if (controls.status) controls.status.value = 'instock';
        if (controls.price) controls.price.value = 'all';
        if (controls.nameChange) controls.nameChange.value = 'all';
        if (controls.sort) controls.sort.value = 'recommended';
        renderAccounts();
      }

      function openAccountFilters() {
        document.body.classList.add('filter-drawer-open');
        const panel = document.getElementById('accountsFilterPanel');
        panel?.setAttribute('role', 'dialog');
        panel?.setAttribute('aria-modal', 'true');
        document.getElementById('mobileFilterToggle')?.setAttribute('aria-expanded', 'true');
        window.setTimeout(() => document.getElementById('accountSearch')?.focus({ preventScroll: true }), 180);
      }

      function closeAccountFilters({ restoreFocus = false } = {}) {
        document.body.classList.remove('filter-drawer-open');
        const panel = document.getElementById('accountsFilterPanel');
        panel?.setAttribute('role', 'region');
        panel?.removeAttribute('aria-modal');
        const toggle = document.getElementById('mobileFilterToggle');
        toggle?.setAttribute('aria-expanded', 'false');
        if (restoreFocus) toggle?.focus({ preventScroll: true });
      }

      window.refreshAccountFilterUi = () => updateAccountFilterUi(getAccountUiText());

      async function copyAccountId(id, button) {
        const ui = getAccountUiText();
        const value = `#${id}`;
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          const input = document.createElement('textarea');
          input.value = value;
          input.setAttribute('readonly', '');
          input.style.position = 'fixed';
          input.style.opacity = '0';
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          input.remove();
        }
        if (button) {
          button.textContent = `✓ ${ui.copied}`;
          window.setTimeout(() => { button.textContent = `# ${ui.copyId}`; }, 1400);
        }
      }

      function renderAccounts() {
        const grid = document.getElementById('accountsGrid');
        const searchInput = document.getElementById('accountSearch');
        const typeFilter = document.getElementById('accountTypeFilter');
        const statusFilter = document.getElementById('accountStatusFilter');
        const priceFilter = document.getElementById('accountPriceFilter');
        const nameChangeFilter = document.getElementById('accountNameChangeFilter');
        const sortSelect = document.getElementById('accountSort');
        const results = document.getElementById('accountsResults');
        if (!grid || !searchInput || !typeFilter || !statusFilter || !priceFilter || !nameChangeFilter || !sortSelect || !results) return;

        const ui = getAccountUiText();
        const query = searchInput.value.trim();
        const visibleAccounts = accountInventory.all
          .filter(acct => accountMatchesType(acct, typeFilter.value))
          .filter(acct => accountMatchesStatus(acct, statusFilter.value))
          .filter(acct => accountMatchesPrice(acct, priceFilter.value))
          .filter(acct => accountMatchesNameChange(acct, nameChangeFilter.value))
          .filter(acct => accountMatchesSearch(acct, query))
          .slice()
          .sort((a, b) => compareAccounts(a, b, sortSelect.value));

        grid.classList.toggle('is-single-result', visibleAccounts.length === 1);
        grid.innerHTML = '';
        results.textContent = ui.results
          .replace('{shown}', visibleAccounts.length)
          .replace('{total}', accountInventory.all.length);
        updateAccountFilterUi(ui, visibleAccounts.length);

        if (!visibleAccounts.length) {
          grid.innerHTML = `<div class="accounts-empty">${ui.empty}</div>`;
          return;
        }

          visibleAccounts.forEach(acct => {
            const { id, highlights = '', weapons = '', rank = '', screenshot = '' } = acct;
            const hasWeapons = String(weapons ?? '').trim().length > 0;
            const level = String(acct.level ?? '');
            const status = String(acct.status ?? 'In Stock');
            const price = String(acct.price ?? '0');
            const freeNameChange = hasFreeNameChange(acct);
            const top500Eligible = hasTop500Eligibility(acct);
            const creditsAmount = getCredits(acct);
            const coinsAmount = getCoins(acct);
            const playtimeAmount = getPlaytime(acct);
            const mythicPrismsAmount = getMythicPrisms(acct);
            const competitivePointsAmount = getCompetitivePoints(acct);

            let statusClass = 'status-instock';
            let statusText = status;
            if (status.toLowerCase().includes('sold')) {
              statusClass = 'status-sold';
              statusText = ui.statusSold;
            } else if (status.toLowerCase().includes('pending')) {
              statusClass = 'status-pending';
              statusText = ui.statusPending;
            } else if (status.toLowerCase().includes('stock')) {
              statusText = ui.statusInStock;
            }

            // Determine if account is "valuable" (price > $100 or contains "Top 500")
            let isValuable = false;
            let numPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
            if (!isNaN(numPrice) && numPrice >= 100) isValuable = true;
            if (top500Eligible) isValuable = true;

            // Special Mythic/Skin rules are the source of truth for configured items.
            // Shared rules below only cover general labels that are not special items.
            // Store display tiers, not Blizzard rarity/availability claims. See skin-visual-rules.md.
            const skinNamesSource = names => [...new Set(names)].sort((a, b) => b.length - a.length)
              .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')).join('|');
            const skinNamesPattern = names => new RegExp(`\\b(?:${skinNamesSource(names)})(?![A-Za-z0-9_])`, 'gi');
            const rareSkinNames = [
              'Ange de la Mort', 'Pirate Ship', 'Dallas Happi', 'Shanghai Happi', 'Happi',
              'Dallas Summer', 'Shanghai Summer', 'Rock Climber', 'Chained King',
              'Wicked Reign', 'Wicked', 'Tiger Luchador', 'Lion Luchador', 'Luchador',
              'Royal Gladiator', 'Royal Knight', 'Clockwork', 'Thunder', 'Flying Ace',
              'Sylvanas Windrunner', 'Sylvanas', 'Zhulong', 'Zhulang', 'Solaris',
              'Haroeris', 'Dance Party', 'Good and Evil', 'Mayhem Biker', 'Zen-Nakji',
              'Crimson Summer', 'Boleiro', 'GOAT', 'GOATS', 'Charged Climber', 'Reigning Climber'
            ];
            const shopSkinNames = [
              // Verified shop/collaboration releases. Free rewards are not inferred as paid.
              'Saitama', 'Terrible Tornado', 'Genos',
              'Spike Spiegel', 'Spike', 'Faye Valentine', 'Faye', 'Ed', 'Jet Black', 'Jet',
              'Porsche', 'Lich King', 'Thrall', 'Diamond Magni',
              'Deku', 'Uravity', 'All Might', 'Himiko Toga', 'Tomura Shigaraki',
              'Chun-Li', 'Juri', 'Cammy', 'Ryu', 'Dhalsim', 'Guile', 'M. Bison', 'Blanka',
              'Optimus Prime', 'Megatron', 'Bumblebee', 'Arcee',
              'ANTIFRAGILE Dazzle', 'ANTIFRAGILE Traysi', 'ANTIFRAGILE Kira-Kira',
              'ANTIFRAGILE BB', 'ANTIFRAGILE Slay Star', 'LE SSERAFIM FEARLESS', 'LE SSERAFIM',
              'Cardboard', 'Turtleship', 'Turtle Ship', 'Cyberdragon', 'Cyber Dragon',
              'Street Runner', 'Honey Bee', 'Cleric', 'Beach Rescue', 'Owl Guardian', 'Gilded Hunter'
            ];
            // 20 franchises plus historical identities. Abbreviations are inventory
            // conventions; standalone words like Shock, Spark and Fuel are too broad.
            const owlTeamNames = [
              'Atlanta Reign', 'ATL', 'Boston Uprising', 'BOS', 'Chengdu Hunters', 'CDH',
              'Dallas Fuel', 'DAL', 'Florida Mayhem', 'FLO Mayhem', 'FLA', 'Guangzhou Charge', 'GZC',
              'Hangzhou Spark', 'HZS', 'Houston Outlaws', 'HOU', 'London Spitfire', 'LDN',
              'Los Angeles Gladiators', 'LA Gladiators', 'LAG', 'GLA',
              'Los Angeles Valiant', 'LA Valiant', 'LAV', 'New York Excelsior', 'NY Excelsior', 'NYXL', 'NYE',
              'Paris Eternal', 'PAR', 'Philadelphia Fusion', 'PHL Fusion', 'PHI',
              'San Francisco Shock', 'SF Shock', 'SFS', 'Seoul Dynasty', 'SEO',
              'Seoul Infernal', 'SIN', 'Shanghai Dragons', 'SH Dragon', 'SH Dragons', 'SHD', 'Toronto Defiant', 'TOR',
              'Vancouver Titans', 'VAN', 'Vegas Eternal', 'VEG', 'Washington Justice', 'WAS'
            ];
            const esportsSkinPattern = new RegExp(
              `\\b(?:OW[12]\\s+)?(?:${skinNamesSource(owlTeamNames.filter(name => name.includes(' ')))})(?:\\s+20\\d{2})?(?![A-Za-z0-9_])`, 'gi');
            const esportsAliasPattern = new RegExp(
              `\\b(?:OW[12]\\s+)?(?:${skinNamesSource(owlTeamNames.filter(name => !name.includes(' ')))})(?:\\s+20\\d{2})?(?![A-Za-z0-9_])`, 'g');
            const specialSkinRules = [
              {
                pattern: /\b(?:[\p{L}\p{N}][\p{L}\p{N}'’.-]*(?:\s+(?:(?:&amp;|&)\s+)?)){1,12}Bundle\b/giu,
                className: 'ac-special-skin-bundle'
              },
              {
                pattern: /\b(?:Illidan(?:\s+Genji)?|Tyrande(?:\s+Symmetra)?|BlizzCon\s+Virtual\s+Ticket\s+2016|BlizzCon(?:\s+2016)?\s+Bastion|BlizzCon(?:\s+2017)?\s+Winston)(?![A-Za-z0-9_])/gi,
                className: 'ac-special-skin-ultra-rare'
              },
              {
                pattern: /\b(?:Noire(?:\s+Widow(?:maker)?(?:\s+Skin)?)?|Demon\s+Hunter(?:\s+Sombra)?)(?![A-Za-z0-9_])/gi,
                className: 'ac-special-skin-collector'
              },
              {
                pattern: /\b(?:Pink\s+Mercy|Rose\s+Gold(?:\s+Mercy)?|(?:LEGO\s+)?Brick(?:\s+Bastion)?|Pink)(?![A-Za-z0-9_])(?=\s*(?:$|[,/;:•(<]|&(?:amp;)?|Bundle\b|Skin\b|Mega\b|Ultra\b))/gi,
                className: 'ac-special-skin-ultra-rare'
              },
              { pattern: skinNamesPattern(rareSkinNames), className: 'ac-special-skin-rare' },
              { pattern: /\bMM\b/g, className: 'ac-special-skin-rare' },
              { pattern: /\bRoyal(?=\s*(?:\(|$|[,/;•<]))/gi, className: 'ac-special-skin-rare' },
              {
                pattern: /\b(?:(?:20\d{2}\s+)?(?:Atlantic|Pacific)\s+All[-\s]+Stars?|All[-\s]+Stars)(?:\s+Skins?)?(?![A-Za-z0-9_])/gi,
                className: 'ac-special-skin-rare'
              },
              { pattern: /\bNerf\s+Gelfire\s+Pro\s+Weapon\b/gi, className: 'ac-special-weapon-nerf-gelfire' },
              { pattern: /\bHard\s+Light\s+Weapon\b/gi, className: 'ac-special-weapon-hard-light' },
              { pattern: /\bLos\s+Muertos\s+Weapon\b/gi, className: 'ac-special-weapon-los-muertos' },
              {
                pattern: /\b(?:Nerf\s+Sungerang\s+Weapon|OWL\s+Tokens|Mythic\s+Prisms)(?![A-Za-z0-9_])/gi,
                className: 'ac-special-skin-pink'
              },
              { pattern: /\bMidas(?![A-Za-z0-9_])/gi, className: 'ac-special-skin-gold' },
              { pattern: /\bHeart\s+of\s+Hope(?![A-Za-z0-9_])/gi, className: 'ac-special-skin-hope' },
              // Complete shop titles such as Gilded Hunter / Owl Guardian must win
              // before the broader Mythic aspect Gilded or the league acronym OWL.
              { pattern: skinNamesPattern(shopSkinNames), className: 'ac-special-skin-shop' },
              {
                pattern: /\b(?:Cyber\s+Demon|Zeus|Amaterasu|Galactic\s+Emperor|Adventurer|A-7000\s+Wargod|Onryō|Grand\s+Beast|Ancient\s+Caller|Vengeance|Calamity\s+Empress|Anubis|Spellbinder|Thor|Pixiu|Horang|Ultraviolet\s+Sentinel|Divine\s+Druid|Cyber\s+Fuel|Divine\s+Desperado|Magma\s+Titan|Celestial\s+Guardian|Hop\s+Online!|Volted\s+Overdrive|Ra|Ascendant\s+Phoenix|World\s+Forger|Bound\s+Demon|Midnight\s+Sun|Deliverance|Lead\s+Rose|Dame\s+Chance|Merciful\s+Magitech|Steel\s+Death|Gilded|Iridescent|Dawn|Blazing\s+Sunsetter|Spirit\s+Keeper|Star\s+Shooter|Sumi-ichimonji|Koi\s+of\s+Duality|Capsule\s+Cannon|Eternal\s+Crystal)(?![A-Za-z0-9_])/gi,
                className: 'ac-special-skin-mythic'
              },
              { pattern: esportsSkinPattern, className: 'ac-special-skin-esports' },
              { pattern: esportsAliasPattern, className: 'ac-special-skin-esports' },
              {
                pattern: /\b(?:OW[12]\s+)?(?:OWCS|OWWC|OWL(?!\s+Tokens\b)|Overwatch\s+(?:League|Champions\s+Series|World\s+Cup)|(?:Overwatch\s+)?Contenders|League\s+White\s*\/\s*Gr[ae]y\s+Skins?)(?:\s+20\d{2})?(?![A-Za-z0-9_])/gi,
                className: 'ac-special-skin-esports'
              }
            ];
            // Keep a bundle in one span, inheriting its strongest configured tier.
            function skinMatchClass(rule, match) {
              if (rule.className !== 'ac-special-skin-bundle') return rule.className;
              const tierOrder = ['ultra-rare', 'collector', 'rare', 'gold', 'mythic', 'hope', 'esports', 'shop'];
              for (const tier of tierOrder) {
                const className = `ac-special-skin-${tier}`;
                if (specialSkinRules.some(candidate => candidate.className === className &&
                    new RegExp(candidate.pattern.source, candidate.pattern.flags.replace('g', '')).test(match))) {
                  return className;
                }
              }
              return rule.className;
            }
            const specialWeaponChoicePattern = /\bChoice\s+of\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:additional\s+)?Gold\s*\/\s*Jade\s*\/\s*Galactic(?:\s*\/\s*Crimson\s+Wolf)?\s+Weapon(?:s|\s+Skins?)?\b/gi;
            const sharedColorRules = [
              { pattern: /Top 500 Challenger Tier/g, className: 'ac-color-red' },
              { pattern: /TOP 500/g, className: 'ac-color-red' },
              { pattern: /Top 500/g, className: 'ac-color-red' },
              { pattern: /Hide My Name/g, className: 'ac-color-red' },
              { pattern: /Stacked Account/g, className: 'ac-color-red' },
              { pattern: /Premium Battle Pass/g, className: 'ac-color-purple' },
              { pattern: /Premium BP/g, className: 'ac-color-purple' },
              { pattern: /Ultimate BP/g, className: 'ac-color-purple' },
              { pattern: /\bGalactic\b/gi, className: 'ac-weapon-galactic' },
              { pattern: /\bCrimson\s+Wolf\b/gi, className: 'ac-weapon-crimson-wolf' },
              { pattern: /Japanese/g, className: 'ac-color-pink' },
              { pattern: /Grandmaster/g, className: 'ac-color-pink' },
              { pattern: /Master/g, className: 'ac-color-pink' },
              { pattern: /Comic Book/g, className: 'ac-color-pink' },
              { pattern: /Endorsement Level 4/g, className: 'ac-color-pink' },
              { pattern: /Endorsement Level 5/g, className: 'ac-color-pink-strong' },
              { pattern: /D\.VA/g, className: 'ac-color-blue' },
              { pattern: /\bGolden\b/gi, className: 'ac-weapon-golden' },
              { pattern: /OW1 - Season/g, className: 'ac-color-gold' },
              { pattern: /Competitor/g, className: 'ac-color-gold' },
              { pattern: /\bJade\b/gi, className: 'ac-weapon-jade' },
              { pattern: /Endorsement Level 2/g, className: 'ac-color-green-bright' },
              { pattern: /Endorsement Level 3/g, className: 'ac-color-green-bright' },
              { pattern: /DPS Main/g, className: 'ac-color-green' },
              { pattern: /Sup Main/g, className: 'ac-color-green' },
              { pattern: /Tank Main/g, className: 'ac-color-green' }
            ];

            // Custom Color Dictionary
            function applyColorMap(text) {
              if (!text) return text;
              let res = escapeAccountTextWithBreaks(text);
              const protectedSpecialSkins = [];
              const protectSpecialSkin = rule => {
                res = res.replace(rule.pattern, match => {
                  const token = `__COLOR_SPECIAL_SKIN_${protectedSpecialSkins.length}__`;
                  protectedSpecialSkins.push({ match, className: skinMatchClass(rule, match) });
                  return token;
                });
              };

              // Protect all configured special series before broader terms such as
              // "Pink", "Master" and "Galactic" are processed.
              specialSkinRules.forEach(protectSpecialSkin);

              const protectedWeaponChoices = [];
              res = res.replace(specialWeaponChoicePattern, match => {
                const token = `__COLOR_WEAPON_CHOICE_${protectedWeaponChoices.length}__`;
                protectedWeaponChoices.push(match);
                return token;
              });

              // Normalize aliases before applying color classes.
              res = res.replace(/Support Main/g, 'Sup Main');
              const protectedColorSpans = [];
              sharedColorRules.forEach(({ pattern, className }) => {
                res = res.replace(pattern, match => {
                  const token = `__COLOR_SHARED_${protectedColorSpans.length}__`;
                  protectedColorSpans.push({ match, className });
                  return token;
                });
              });

              // Gold
              res = res.replace(
                  /Edition\s*\((2016|2017|2018|2019|2020)\)/g,
                  'Edition (<span class="ac-color-gold">$1</span>)'
              );

              protectedColorSpans.forEach((entry, index) => {
                res = res.replace(
                  `__COLOR_SHARED_${index}__`,
                  `<span class="${entry.className}">${entry.match}</span>`
                );
              });

              protectedSpecialSkins.forEach((entry, index) => {
                res = res.replace(
                  `__COLOR_SPECIAL_SKIN_${index}__`,
                  `<span class="ac-special-skin ${entry.className}">${entry.match}</span>`
                );
              });
              protectedWeaponChoices.forEach((match, index) => {
                res = res.replace(
                  `__COLOR_WEAPON_CHOICE_${index}__`,
                  `<span class="ac-special-weapon-choice">${match}</span>`
                );
              });
              return res;
            }


            function highlightRankText(text) {
              if (!text) return '';
              let res = String(text);
              const protectedRanks = [];
              const protectedReadyLabels = [];

              // Fresh Rank Ready is a positive state and always uses the green status style.
              res = res.replace(/\bFresh\s+Rank\s+Ready\b/gi, (match) => {
                const token = `__FRESH_RANK_READY_${protectedReadyLabels.length}__`;
                protectedReadyLabels.push(match);
                return token;
              });

              // Protect Master / Grandmaster / GM before applying the general color map.
              // This prevents the pink "Master" rule from creating nested/conflicting spans.
              res = res.replace(/\b(Grandmaster\s*\d*|Master\s*\d*|GM\s*\d*)\b/gi, (match) => {
                const token = `__RANK_COLOR_${protectedRanks.length}__`;
                protectedRanks.push(match);
                return token;
              });

              // Apply all shared color rules to rank text.
              res = applyColorMap(res);

              // Restore protected high-rank terms using the dedicated red rank style.
              protectedRanks.forEach((rankText, index) => {
                res = res.replace(
                  `__RANK_COLOR_${index}__`,
                  `<span class="ac-highlight-rank-master">${rankText}</span>`
                );
              });

              protectedReadyLabels.forEach((readyText, index) => {
                res = res.replace(
                  `__FRESH_RANK_READY_${index}__`,
                  `<span class="ac-rank-ready">${readyText}</span>`
                );
              });

              return res;
            }

            function formatAvailability(flag) {
              return flag
                ? `<span class="ac-availability-yes">${ui.yes}</span>`
                : `<span class="ac-availability-no">${ui.no}</span>`;
            }

            // Keep long level labels readable by separating the numeric level from metadata.
            function escapeAccountText(value) {
              return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
            }

            // Inventory data intentionally uses <br> for line breaks. Escape every
            // other tag first, then restore only this harmless formatting tag.
            function escapeAccountTextWithBreaks(value) {
              return escapeAccountText(value).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
            }

            function safeExternalUrl(value) {
              try {
                const url = new URL(String(value || ''), window.location.href);
                return /^(https?):$/.test(url.protocol) ? url.href : '';
              } catch {
                return '';
              }
            }

            function formatLevelDisplay(rawLevel) {
              let normalized = String(rawLevel ?? '')
                .replace(/<br\s*\/?\s*>/gi, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              const original = normalized;
              const tags = [];

              const isStacked = /\bstacked account\b/i.test(normalized);
              normalized = normalized.replace(/\bstacked account\b/gi, ' ');

              const borderMatches = normalized.match(/\b(?:bronze|silver|golden|gold|platinum|diamond)\s+border\b/gi) || [];
              borderMatches.forEach(label => {
                if (!tags.some(tag => tag.text.toLowerCase() === label.toLowerCase())) {
                  tags.push({ text: label, className: 'border-tier' });
                }
              });
              normalized = normalized.replace(/\b(?:bronze|silver|golden|gold|platinum|diamond)\s+border\b/gi, ' ');

              const versions = [];
              normalized = normalized.replace(/\bOW([12])\b/gi, (_, version) => {
                const label = `OW${version}`;
                if (!versions.includes(label)) versions.push(label);
                return ' ';
              });

              normalized = normalized
                .replace(/^\s*(?:level|lv\.?)\s*/i, '')
                .replace(/\s*-\s*/g, ' ')
                .replace(/\s*\+\s*/g, ' + ')
                .replace(/\s+/g, ' ')
                .replace(/^[+\-–—•·\s]+|[+\-–—•·\s]+$/g, '')
                .trim();

              if (isStacked) tags.push({ text: 'Stacked Account', className: 'stacked' });

              const mainText = normalized ? `Lv. ${normalized}` : 'Lv. —';
              const versionTags = versions.map(label => (
                `<span class="ac-level-tag game-version game-version-${label.toLowerCase()}">${escapeAccountText(label)}</span>`
              )).join('');
              return {
                main: escapeAccountText(mainText),
                title: escapeAccountText(original || mainText),
                versions: versionTags,
                tags: tags.map(tag => `<span class="ac-level-tag ${tag.className}">${escapeAccountText(tag.text)}</span>`).join('')
              };
            }

            const levelDisplay = formatLevelDisplay(level);
            const screenshotUrl = safeExternalUrl(screenshot);
            // Highlight skin names while keeping hero names and common abbreviations neutral.
            // Keep longer/more specific aliases before shorter ones to avoid partial matches.
            const heroAliasPatterns = [
              // Tank
              'D\\.?\\s*Va',
              'Wrecking\\s+Ball', 'Hammond', 'Ball',
              'Junker\\s+Queen', 'Junk\\s+Queen', 'JQ',
              'Reinhardt', 'Rein',
              'Roadhog', 'Hog',
              'Ramattra', 'Ram',
              'Doomfist', 'Doom',
              'Winston', 'Orisa', 'Zarya', 'Sigma', 'Sig', 'Mauga', 'Hazard',

              // Damage
              'Soldier\\s*:?\\s*76', 'Soldier', 'S\\s*76',
              'Sojourn', 'Soj',
              'Torbj[öo]rn', 'Torb',
              'Widowmaker', 'Widow',
              'Junkrat', 'Junk',
              'Cassidy', 'Cass',
              'Bastion', 'Genji', 'Hanzo', 'Mei', 'Pharah', 'Reaper',
              'Sombra', 'Symmetra', 'Sym', 'Tracer', 'Venture', 'Vendetta',
              'Ashe', 'Echo', 'Freja',

              // Support
              'Baptiste', 'Bap',
              'Brigitte', 'Brig',
              'Life\\s*weaver', 'LW',
              'Zenyatta', 'Zen',
              'L[úu]cio', 'Mercy', 'Moira', 'Ana', 'Illari', 'Juno',
              'Kiriko', 'Kiri', 'Wuyang'
            ];

            const heroAliasPattern = `(?:${heroAliasPatterns.join('|')})`;
            const heroSeparatorPattern = '(?:\\/|\\\\|•|&|\\band\\b)';
            const heroSequencePattern = `${heroAliasPattern}(?:(?:\\s*${heroSeparatorPattern}\\s*|\\s+)${heroAliasPattern})*\\s*(?:\\([^)]*\\))?`;
            const heroSequenceRegex = new RegExp(`^${heroSequencePattern}$`, 'i');
            const leadingHeroRegex = new RegExp(`^(${heroAliasPattern})(\\s+)(.+)$`, 'i');
            const trailingHeroRegex = new RegExp(`^(.+?)(\\s+)(${heroSequencePattern})$`, 'i');
            const attachedSoldier76Regex = /^(.+?)(\s*:\s*76)$/i;

            function styleSkinName(rawName) {
              let styled = escapeAccountText(rawName);
              const protectedMatches = [];

              specialSkinRules.forEach(rule => {
                styled = styled.replace(rule.pattern, match => {
                  const token = `__SPECIAL_SKIN_${protectedMatches.length}__`;
                  protectedMatches.push({ match, className: skinMatchClass(rule, match) });
                  return token;
                });
              });

              protectedMatches.forEach((entry, index) => {
                styled = styled.replace(
                  `__SPECIAL_SKIN_${index}__`,
                  `<span class="ac-special-skin ${entry.className}">${entry.match}</span>`
                );
              });

              return `<span class="ac-skin-name">${styled}</span>`;
            }

            function styleSkinItem(rawItem) {
              const item = String(rawItem ?? '').trim();
              if (!item) return '';

              // Pink Mercy is a complete skin name, not the adjective "Pink"
              // followed by the hero name "Mercy". Handle it before hero parsing.
              if (/\b(?:Pink|Rose\s+Gold)\s+Mercy\b/i.test(item) || /\bBundle\b/i.test(item)) return styleSkinName(item);

              // A pure hero name or hero list stays in the regular text style.
              if (heroSequenceRegex.test(item)) return escapeAccountText(item);

              // Hero-first format, e.g. "D.Va LE SSERAFIM Bundle".
              const leadingHero = item.match(leadingHeroRegex);
              if (leadingHero && !heroSequenceRegex.test(leadingHero[3])) {
                return `${escapeAccountText(leadingHero[1])}${escapeAccountText(leadingHero[2])}${styleSkinName(leadingHero[3])}`;
              }

              // Skin-first format, including abbreviated hero suffixes such as
              // "Queen/Rugby JQ", "Bounty Hunter Bap" and "Cardboard Rein/Brig".
              const trailingHero = item.match(trailingHeroRegex);
              if (trailingHero) {
                return `${styleSkinName(trailingHero[1])}${escapeAccountText(trailingHero[2])}${escapeAccountText(trailingHero[3])}`;
              }

              // Soldier: 76 is often shortened in the source data to ":76",
              // e.g. "Biker:76" or "Infinite Guard: 76".
              const attachedSoldier76 = item.match(attachedSoldier76Regex);
              if (attachedSoldier76 && attachedSoldier76[1].trim()) {
                return `${styleSkinName(attachedSoldier76[1].trimEnd())}${escapeAccountText(attachedSoldier76[2])}`;
              }

              // No explicit hero marker is present, so treat the item as a skin name.
              return `${styleSkinName(item)}`;
            }

            function styleSkinDescriptionLine(rawLine) {
              const line = String(rawLine ?? '').replace(/^\s*✨\s*/, '').trim();
              let category = '';
              let body = line;
              const categoryMatch = line.match(/^([^,:]{2,48}):\s*(.+)$/);
              if (categoryMatch && !/\bSoldier$/i.test(categoryMatch[1]) &&
                  /(?:skins?|owcs|owl|owwc|mvp|all[- ]?stars?|team|decennium)/i.test(categoryMatch[1])) {
                category = categoryMatch[1].trim();
                body = categoryMatch[2].trim();
              }

              const styledItems = body
                .split(/(\s*[,，;；]\s*)/)
                .map((item, index) => index % 2
                  ? `<span aria-hidden="true">${escapeAccountText(item)}</span>`
                  : styleSkinItem(item))
                .filter(Boolean)
                .join('');

              const esportsCategory = /\b(?:OW[12]|OWL|OWCS|OWWC|League|Team|Contenders)\b/i.test(category);
              const categoryHtml = category
                ? `<span class="ac-skin-category${esportsCategory ? ' ac-special-skin-esports' : ''}">${escapeAccountText(category)}:</span> `
                : '';
              return `<span class="ac-highlight-line ac-skin-line"><span class="ac-highlight-icon">✨</span> ${categoryHtml}${styledItems}</span>`;
            }

            const highlightLines = String(highlights || '')
              .split(/<br\s*\/?\s*>/i)
              .map(line => line.trim())
              .filter(Boolean);
            const styledHighlights = highlightLines
              .map(line => {
                if (/^\s*✨/.test(line)) return styleSkinDescriptionLine(line);
                return `<span class="ac-highlight-line">${applyColorMap(line)}</span>`;
              })
              .join('');
            const highlightsPlainLength = String(highlights || '').replace(/<[^>]*>/g, ' ').length;
            const highlightsCollapsible = highlightLines.length > 5 || highlightsPlainLength > 430;

            const numberFormatter = new Intl.NumberFormat(document.documentElement.lang || 'en');
            const resourceValueClass = (value, yellowThreshold, pinkThreshold = null) => {
              if (pinkThreshold !== null && value >= pinkThreshold) return ' ac-resource-value-critical';
              return value >= yellowThreshold ? ' ac-resource-value-threshold' : '';
            };
            const resourceItems = [
              creditsAmount > 0 ? `<div class="ac-resource-item">
                <span class="ac-resource-label">${ui.credits}</span>
                <span class="ac-resource-value${resourceValueClass(creditsAmount, 10000, 20000)}">${numberFormatter.format(creditsAmount)}</span>
              </div>` : '',
              coinsAmount > 0 ? `<div class="ac-resource-item">
                <span class="ac-resource-label">${ui.coins}</span>
                <span class="ac-resource-value${resourceValueClass(coinsAmount, 800, 2000)}">${numberFormatter.format(coinsAmount)}</span>
              </div>` : '',
              playtimeAmount > 0 ? `<div class="ac-resource-item">
                <span class="ac-resource-label">${ui.playtime}</span>
                <span class="ac-resource-value"><span class="${resourceValueClass(playtimeAmount, 100, 300).trim()}">${numberFormatter.format(playtimeAmount)}</span>H</span>
              </div>` : '',
              competitivePointsAmount > 0 ? `<div class="ac-resource-item ac-resource-item-competitive">
                <span class="ac-resource-label">${ui.compPointsAll}</span>
                <span class="ac-resource-value${resourceValueClass(competitivePointsAmount, 3000, 9000)}">${numberFormatter.format(competitivePointsAmount)}</span>
              </div>` : ''
            ].filter(Boolean).join('');
            const resourceItemCount = [creditsAmount, coinsAmount, playtimeAmount, competitivePointsAmount]
              .filter(amount => amount > 0).length;
            const resourceStrip = resourceItems
              ? `<div class="ac-resource-strip" style="--resource-count:${resourceItemCount};">${resourceItems}</div>`
              : '';

            const rankText = String(rank || '').trim();
            const rankFact = rankText ? highlightRankText(rankText) : '—';
            const mythicPrismsValueClass = mythicPrismsAmount > 50 ? ' ac-highlight-mythic-prisms' : '';
            const prismsFact = mythicPrismsAmount > 0
              ? `<div class="ac-keyfact is-premium"><span class="ac-keyfact-label">${ui.mythicPrisms}</span><span class="ac-keyfact-value${mythicPrismsValueClass}">${numberFormatter.format(mythicPrismsAmount)}</span></div>`
              : '';

            const card = document.createElement('div');
            card.className = 'account-card';
            // Give valuable accounts a special glowing border
            if (isValuable) {
              card.style.boxShadow = '0 0 15px rgba(250, 204, 21, 0.3)';
              card.style.border = '1px solid rgba(250, 204, 21, 0.5)';
            }
            
            card.innerHTML = `
              <div class="ac-header">
                <div class="ac-title-row">
                  <div class="ac-title-block">
                    <h3 class="ac-level-title ${isValuable ? 'is-valuable' : ''}" title="${levelDisplay.title}">
                      <span class="ac-level-main">${levelDisplay.main}</span>
                      ${levelDisplay.versions ? `<span class="ac-level-inline-meta">${levelDisplay.versions}</span>` : ''}
                    </h3>
                    ${levelDisplay.tags ? `<div class="ac-level-meta">${levelDisplay.tags}</div>` : ''}
                  </div>
                  <span class="ac-status ${statusClass}">${escapeAccountText(statusText)}</span>
                </div>
                ${isValuable ? '<div class="ac-premium-badge">🔥 ' + ui.premiumAccount + '</div>' : ''}
              </div>
              <div class="ac-price-row">
                <div class="ac-price">${escapeAccountText(price)}</div>
                <div class="ac-account-id">ID #${escapeAccountText(id)}</div>
              </div>
              <div class="ac-keyfacts">
                <div class="ac-keyfact ac-keyfact-wide ac-keyfact-rank">
                  <span class="ac-keyfact-label">${ui.rank}</span>
                  <span class="ac-keyfact-value">${rankFact}</span>
                </div>
                ${resourceStrip}
                <div class="ac-keyfact ac-keyfact-boolean ${freeNameChange ? 'is-positive' : 'is-negative'}">
                  <span class="ac-keyfact-label">${ui.freeRename}</span>
                  <span class="ac-keyfact-value">${formatAvailability(freeNameChange)}</span>
                </div>
                <div class="ac-keyfact ac-keyfact-boolean ${top500Eligible ? 'is-positive' : 'is-negative'}">
                  <span class="ac-keyfact-label">${ui.top500Eligible}</span>
                  <span class="ac-keyfact-value">${formatAvailability(top500Eligible)}</span>
                </div>
                ${prismsFact}
              </div>
              ${styledHighlights ? `
                <div class="ac-highlights">
                  <div class="ac-highlights-content ${highlightsCollapsible ? 'is-collapsed' : ''}">${styledHighlights}</div>
                  ${highlightsCollapsible ? `
                    <button class="ac-highlights-toggle" type="button" aria-expanded="false">
                      <span class="ac-highlights-toggle-label">${ui.showMore}</span>
                      <span class="ac-highlights-toggle-arrow" aria-hidden="true">⌄</span>
                    </button>` : ''}
                </div>` : ''}
              ${hasWeapons ? `<div class="ac-details">
                <div class="ac-detail"><strong>${ui.weapons}:</strong><br>${applyColorMap(weapons)}</div>
              </div>` : ''}
              <div class="ac-utility-actions">
                <button type="button" class="btn btn-outline" data-copy-account="${escapeAccountText(id)}"># ${ui.copyId}</button>
              </div>
              <div class="ac-actions">
                <a href="${screenshotUrl || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" ${!screenshotUrl ? 'data-missing-screenshot="true"' : ''}>📸 ${ui.viewSkins}</a>
                <a href="https://discord.gg/WYqfYXW29U" target="_blank" rel="noopener noreferrer" class="btn btn-primary">${ui.buyNow}</a>
              </div>
            `;
            const highlightsToggle = card.querySelector('.ac-highlights-toggle');
            const highlightsContent = card.querySelector('.ac-highlights-content');
            highlightsToggle?.addEventListener('click', () => {
              const willExpand = highlightsToggle.getAttribute('aria-expanded') !== 'true';
              highlightsToggle.setAttribute('aria-expanded', String(willExpand));
              highlightsToggle.classList.toggle('is-expanded', willExpand);
              highlightsContent?.classList.toggle('is-collapsed', !willExpand);
              const label = highlightsToggle.querySelector('.ac-highlights-toggle-label');
              if (label) label.textContent = willExpand ? ui.showLess : ui.showMore;
            });

            card.querySelector('[data-missing-screenshot]')?.addEventListener('click', (event) => {
              event.preventDefault();
              alert(ui.missingScreenshot);
            });
            card.querySelector('[data-copy-account]')?.addEventListener('click', event => {
              copyAccountId(id, event.currentTarget);
            });
            grid.appendChild(card);
          });
      }

      window.renderAccounts = renderAccounts;

      async function loadAccounts() {
        try {
          const response = await fetch('accounts.json?t=' + new Date().getTime(), { cache: 'no-store' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          accountInventory.all = Array.isArray(data.accounts) ? data.accounts : [];
          renderAccounts();
        } catch (error) {
          console.error('Error fetching accounts:', error);
          const grid = document.getElementById('accountsGrid');
          const results = document.getElementById('accountsResults');
          const ui = getAccountUiText();
          if (results) results.textContent = ui.results.replace('{shown}', '0').replace('{total}', '0');
          grid?.classList.remove('is-single-result');
          if (grid) grid.innerHTML = `<div class="accounts-empty">${ui.loadError}</div>`;
        }
      }

      document.getElementById('accountSearch')?.addEventListener('input', renderAccounts);
      document.getElementById('accountTypeFilter')?.addEventListener('change', renderAccounts);
      document.getElementById('accountStatusFilter')?.addEventListener('change', renderAccounts);
      document.getElementById('accountPriceFilter')?.addEventListener('change', renderAccounts);
      document.getElementById('accountNameChangeFilter')?.addEventListener('change', renderAccounts);
      document.getElementById('accountSort')?.addEventListener('change', renderAccounts);
      document.getElementById('resetAccountFilters')?.addEventListener('click', resetAccountFilters);
      document.getElementById('activeAccountFilters')?.addEventListener('click', (event) => {
        const chip = event.target.closest('[data-clear-filter]');
        if (chip) clearAccountFilter(chip.dataset.clearFilter);
      });
      document.getElementById('accountPopularSearches')?.addEventListener('click', event => {
        const chip = event.target.closest('[data-account-keyword]');
        const search = document.getElementById('accountSearch');
        if (!chip || !search) return;
        const keyword = String(chip.dataset.accountKeyword ?? '').trim();
        const isActive = search.value.trim().toLocaleLowerCase() === keyword.toLocaleLowerCase();
        search.value = isActive ? '' : keyword;
        renderAccounts();
      });
      document.getElementById('mobileFilterToggle')?.addEventListener('click', openAccountFilters);
      document.getElementById('closeAccountFilters')?.addEventListener('click', () => closeAccountFilters({ restoreFocus: true }));
      document.getElementById('accountsFilterBackdrop')?.addEventListener('click', () => closeAccountFilters({ restoreFocus: true }));
      document.getElementById('applyAccountFilters')?.addEventListener('click', () => closeAccountFilters({ restoreFocus: true }));
      function trapFocus(container, event) {
        if (event.key !== 'Tab' || !container) return;
        const focusable = [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
          .filter(element => element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && document.body.classList.contains('filter-drawer-open')) {
          closeAccountFilters({ restoreFocus: true });
        }
        if (event.key === 'Escape' && mobileNav?.getAttribute('data-open') === 'true') {
          closeMobileNav({ restoreFocus: true });
        }
        if (document.body.classList.contains('filter-drawer-open')) {
          trapFocus(document.getElementById('accountsFilterPanel'), event);
        } else if (mobileNav?.getAttribute('data-open') === 'true') {
          trapFocus(mobileNav, event);
        }
      });
      window.addEventListener('resize', () => {
        if (window.innerWidth > 700 && document.body.classList.contains('filter-drawer-open')) {
          closeAccountFilters();
        }
      });
      loadAccounts();
    });

    const LANG_KEY = "roshine_lang";
    const LINKS = {
      discord: "https://discord.gg/WYqfYXW29U",
      email: "mailto:roshine_store@roshine.love",
      auth: "./auth/"
    };

    const i18n = {
      en: {
        metaTitle:"Roshine Account Store",
        metaDesc:"Premium Overwatch accounts with secure delivery.",
        nav: { home:"Home", accounts:"Accounts", services:"Services", warranty:"Warranty", faq:"FAQ", contact:"Contact" },
        accountsKicker:"🎮 INVENTORY",
        accountsTitle:"Accounts",
        accountsDesc:"Browse our currently available stock. Select an account and order via Discord.",
        accountsUpdateLabel:"Next planned inventory update:",
        accountsUpdateValue:"In 7 Days",
        accountsUpdateTime:{ day:"{count} Day", days:"{count} Days", hour:"{count} Hour", hours:"{count} Hours", underHour:"Under 1 Hour" },
        auth:"Authenticator",
        a11y:{ skip:"Skip to inventory", openNav:"Open navigation", closeNav:"Close navigation", mobileNav:"Mobile navigation" },
        heroKicker:"⚡ Trusted since 2021",
        heroTitle:"ROSHINE ACCOUNT STORE",
        heroSubbrand:"",
        heroIntro:"Since 2021, Roshine Account Store has delivered curated Overwatch accounts with a streamlined purchase flow and long-term support. Five years in operation, built for consistency, clarity, and buyer confidence.",
        ctaExplore:"View Stock & Purchase",
        servicesKicker:"✨ SERVICES",
        servicesTitle:"Listings & Ordering",
        servicesDesc:"Browse our live inventory above, then order via Discord by sending the account ID or a screenshot.",
        servicesList:[
          "📄 Browse the listings and filter by availability, game version, price, account features, or keywords.",
          "🧾 Copy the account ID (or screenshot the row you want).",
          "💬 Join Discord and send the ID/screenshot to confirm availability and total.",
          "✅ After payment, receive login info and the security handover package."
        ],
        btnDiscord:"Order via Discord",

        warrantyKicker:"🛡️ WARRANTY",
        warrantyTitle:"Warranty & Security",
        warrantyDesc:"Clear scope, transparent process, long-term protection.",
        warrantyCards:[
          { icon:"🛡️", badge:"PRIMARY", badgeType:"primary", title:"Lifetime Security Warranty",
            desc:"If the account is reclaimed, hacked, or permanently lost due to previous owner issues, we provide a full replacement (equal value) or full compensation." },
          { icon:"📂", badge:"PROOF", badgeType:"primary", title:"Verified Ownership Handover",
            desc:"You receive the security handover package (as applicable): original email access, Battle.net/Steam, authenticator transfer support, account ID, and available recovery details." },
          { icon:"⚡", badge:"FAST", badgeType:"primary", title:"Fast Delivery",
            desc:"Most accounts are delivered within 5 minutes after confirmed payment (rare high-tier accounts may require extra preparation)." },
          { icon:"♾️", badge:"FREE", badgeType:"primary", title:"Unlimited Free Unlock Support (OW2)",
            desc:"If unlock-related issues occur on eligible Overwatch 2 accounts, we provide unlimited assistance." },
          { icon:"🔄", badge:"PAID", badgeType:"paid", title:"Region Update Service",
            desc:"Optional paid service. Region changes are handled only when supported by platform policy." },
          { icon:"🚫", badge:"PAID", badgeType:"paid", title:"Unban Appeal Assistance",
            desc:"Optional paid service. We help prepare and submit an appeal; approval is not guaranteed and depends on official review." }
        ],

        faqKicker:"❓ FAQ",
        faqTitle:"Frequently Asked Questions",
        faqDesc:"Quick answers to the questions that most buyers ask before ordering.",
        faq1:"Are the accounts safe? — Every account comes from a real player and has a normal play history—not a scripted, botted, studio-farmed, or mass-produced account. We exclude accounts with known histories of cheating, abuse, or other rule violations. Key listing details can be cross-checked against official in-game and Battle.net records during verification.",
        faq2:"How fast is delivery? — Most orders are delivered within 5 minutes after payment. Rare top-tier accounts may require additional preparation time.",
        faq3:"Payment methods supported? — Credit card, PayPal, crypto, and selected gift cards. Confirm availability and fees on Discord.",
        faq4:"How often is the stock updated? — Sales status is updated in real time as accounts are sold, while new stock is typically added every 7 days. The countdown above shows the next planned stock update.",
        faq5:{
          question:"How to use the Battle.net Authenticator?",
          intro:"roshine.love/auth is a private tool for Battle.net Authenticator. Paste the Private Key from the delivered account information, then copy the current code into the Battle.net app when verification is requested.",
          linkLabel:"roshine.love/auth",
          sections:[
            { icon:"📌", title:"Authenticator notice", items:["Codes refresh every 30 seconds.", "Each code can be used only once.", "If a code expires, wait for the next code and try again."] }
          ]
        },
        faq6:{
          question:"How do I log in to my Overwatch account?",
          intro:"Use the Battle.net credentials supplied with the account and complete Authenticator verification only when the app requests it.",
          sections:[{ icon:"🎮", title:"Overwatch account login", ordered:true, items:["Open the Battle.net Desktop App.", "Sign in with the provided Battle.net credentials.", "Complete verification with the current Authenticator code if requested."] }]
        },
        faq7:{
          question:"How do I access the account email?",
          intro:"Use the email information supplied with the account. The exact verification method depends on whether an authenticator is attached.",
          sections:[{ icon:"✉️", title:"Account email access", items:["Sign in to live.com with the provided email details.", "If an authenticator is attached, use Google Authenticator and the provided QR code; otherwise sign in with the email and password.", "After access, add your own recovery email for better security."] }]
        },
        faq8:"When should I update the account security information? — Keep the same device and a stable IP, and wait about 7 days before changing the password, recovery email, region or other security settings. This reduces security locks and verification issues but cannot eliminate platform risk.",
        faq9:{
          question:"How do I keep the account secure?",
          intro:"Save the delivered account information immediately and protect every login and recovery channel.",
          sections:[{ icon:"🔐", title:"Account security recommendations", items:["Keep the email, authenticator and recovery details secure.", "Avoid public or unstable IP addresses, VPNs, proxies and shared networks.", "Never share the account information with others."] }]
        },
        btnStock:"View stock",
        btnOrder:"Order via Discord",

        contactKicker:"💬 CONTACT",
        contactTitle:"Reach us",
        contactDesc:"For the fastest response, message us on Discord with the account ID (or a screenshot). You can also email us anytime.",
        btnContact:"Discord",
        btnEmail:"Email",
        footerNav: { home:"Home", services:"Services", contact:"Contact", privacy:"Privacy", terms:"Terms" },

        footer1:"© 2021–2026 Roshine Account Store.",
        footer2:"All rights reserved — your reliable account supplier."
      },

      fr: {
        metaTitle:"Roshine Account Store",
        metaDesc:"Comptes Overwatch premium avec livraison sécurisée.",
        nav: { home:"Accueil", accounts:"Comptes", services:"Services", warranty:"Garantie", faq:"FAQ", contact:"Contact" },
        accountsKicker:"🎮 INVENTAIRE",
        accountsTitle:"Comptes",
        accountsDesc:"Parcourez les comptes actuellement disponibles, utilisez les filtres, puis commandez via Discord.",
        accountsUpdateLabel:"Prochaine mise à jour prévue du stock :",
        accountsUpdateValue:"Dans 7 jours",
        accountsUpdateTime:{ day:"{count} jour", days:"{count} jours", hour:"{count} heure", hours:"{count} heures", underHour:"Moins d’une heure" },
        auth:"Authenticator",
        a11y:{ skip:"Aller à l’inventaire", openNav:"Ouvrir la navigation", closeNav:"Fermer la navigation", mobileNav:"Navigation mobile" },
        heroKicker:"⚡ Fiable depuis 2021",
        heroTitle:"ROSHINE",
        heroSubbrand:"Boutique de comptes Overwatch",
        heroIntro:"Depuis 2021, Roshine Account Store propose des comptes Overwatch sélectionnés, avec un processus d’achat simple et un support durable. Cinq ans d’activité, axés sur la clarté, la stabilité et la confiance.",
        ctaExplore:"Voir le stock & acheter",
        servicesKicker:"✨ SERVICES",
        servicesTitle:"Liste & Commande",
        servicesDesc:"Consultez l’inventaire disponible ci-dessus, puis commandez via Discord en envoyant l’ID du compte ou une capture.",
        servicesList:[
          "📄 Parcourez les comptes et filtrez par disponibilité, version du jeu, prix, caractéristiques ou mots-clés.",
          "🧾 Copiez l’ID du compte (ou capturez la ligne).",
          "💬 Rejoignez Discord et envoyez l’ID/la capture pour confirmer.",
          "✅ Après paiement, recevez les accès et le pack de sécurité."
        ],
        btnDiscord:"Commander via Discord",

        warrantyKicker:"🛡️ GARANTIE",
        warrantyTitle:"Garantie & Sécurité",
        warrantyDesc:"Périmètre clair, processus transparent, protection durable.",
        warrantyCards:[
          { icon:"🛡️", badge:"PRIORITÉ", badgeType:"primary", title:"Garantie sécurité à vie",
            desc:"En cas de récupération par l’ancien propriétaire, piratage ou perte permanente liée au précédent propriétaire : remplacement équivalent ou remboursement complet." },
          { icon:"📂", badge:"PREUVE", badgeType:"primary", title:"Transfert vérifié",
            desc:"Pack de sécurité (si applicable) : accès e-mail d’origine, Battle.net/Steam, assistance Authenticator, ID du compte et infos de récupération disponibles." },
          { icon:"⚡", badge:"RAPIDE", badgeType:"primary", title:"Livraison rapide",
            desc:"La plupart des comptes sont livrés sous 5 minutes après confirmation du paiement (comptes premium : préparation possible)." },
          { icon:"♾️", badge:"GRATUIT", badgeType:"primary", title:"Support unlock illimité (OW2)",
            desc:"Pour les comptes Overwatch 2 éligibles : assistance illimitée en cas de problème de déverrouillage." },
          { icon:"🔄", badge:"PAYANT", badgeType:"paid", title:"Changement de région",
            desc:"Service payant optionnel. Uniquement si la politique de la plateforme le permet." },
          { icon:"🚫", badge:"PAYANT", badgeType:"paid", title:"Assistance appel de bannissement",
            desc:"Service payant optionnel. Aide à la soumission d’appel, sans garantie d’acceptation (décision officielle)." }
        ],

        faqKicker:"❓ FAQ",
        faqTitle:"Questions fréquentes",
        faqDesc:"Réponses rapides avant de passer commande.",
        faq1:"Les comptes sont-ils sûrs ? — Chaque compte provient d’un vrai joueur et possède un historique de jeu normal ; il ne s’agit pas d’un compte scripté, automatisé, produit en ferme ou en masse. Nous excluons les comptes ayant un historique connu de triche, d’abus ou d’autres infractions. Les informations essentielles de l’annonce peuvent être recoupées avec les données officielles en jeu et Battle.net lors de la vérification.",
        faq2:"Quel est le délai de livraison ? — La plupart des commandes sont livrées sous 5 minutes après paiement. Les comptes haut de gamme peuvent nécessiter un délai supplémentaire.",
        faq3:"Quels moyens de paiement sont acceptés ? — Carte bancaire, PayPal, crypto et certaines cartes cadeaux. La disponibilité et les frais sont à confirmer sur Discord.",
        faq4:"À quelle fréquence le stock est-il mis à jour ? — Le statut des ventes est actualisé en temps réel et de nouveaux comptes sont généralement ajoutés tous les 7 jours. Le compte à rebours ci-dessus indique la prochaine mise à jour prévue.",
        faq5:{
          question:"Comment utiliser Battle.net Authenticator ?",
          intro:"roshine.love/auth est un outil privé pour Battle.net Authenticator. Collez la Private Key fournie avec le compte, puis copiez le code actuel dans l’application Battle.net lorsqu’une vérification est demandée.",
          linkLabel:"roshine.love/auth",
          sections:[
            { icon:"📌", title:"Informations Authenticator", items:["Les codes sont renouvelés toutes les 30 secondes.", "Chaque code ne peut être utilisé qu’une seule fois.", "Si un code expire, attendez le suivant puis réessayez."] }
          ]
        },
        faq6:{
          question:"Comment se connecter au compte Overwatch ?",
          intro:"Utilisez les identifiants Battle.net fournis avec le compte et effectuez la vérification Authenticator uniquement si l’application la demande.",
          sections:[{ icon:"🎮", title:"Connexion au compte Overwatch", ordered:true, items:["Ouvrez l’application de bureau Battle.net.", "Connectez-vous avec les identifiants Battle.net fournis.", "Si demandé, terminez la vérification avec le code Authenticator actuel."] }]
        },
        faq7:{
          question:"Comment accéder à l’e-mail du compte ?",
          intro:"Utilisez les informations d’e-mail fournies avec le compte. La méthode de vérification dépend de la présence ou non d’un authentificateur.",
          sections:[{ icon:"✉️", title:"Accès à l’e-mail du compte", items:["Connectez-vous à live.com avec les informations d’e-mail fournies.", "Si un authentificateur est associé, utilisez Google Authenticator et le QR code fourni ; sinon utilisez l’e-mail et le mot de passe.", "Après connexion, ajoutez votre propre e-mail de récupération."] }]
        },
        faq8:"Quand modifier les informations de sécurité du compte ? — Conservez le même appareil et une IP stable, puis attendez environ 7 jours avant de modifier le mot de passe, l’e-mail de récupération, la région ou d’autres réglages. Cela réduit les blocages et problèmes de vérification sans supprimer tout risque de plateforme.",
        faq9:{
          question:"Comment protéger le compte ?",
          intro:"Enregistrez immédiatement les informations livrées et protégez tous les moyens de connexion et de récupération.",
          sections:[{ icon:"🔐", title:"Recommandations de sécurité", items:["Protégez l’e-mail, l’authentificateur et les données de récupération.", "Évitez les IP publiques ou instables, VPN, proxys et réseaux partagés.", "Ne partagez jamais les informations du compte."] }]
        },
        btnStock:"Voir le stock",
        btnOrder:"Commander via Discord",

        contactKicker:"💬 CONTACT",
        contactTitle:"Nous contacter",
        contactDesc:"Le plus rapide : Discord (envoyez l’ID ou une capture). Sinon, vous pouvez aussi nous écrire par e-mail.",
        btnContact:"Discord",
        btnEmail:"Email",
        footerNav: { home:"Accueil", services:"Services", contact:"Contact", privacy:"Confidentialité", terms:"Conditions" },

        footer1:"© 2021–2026 Roshine Account Store.",
        footer2:"Tous droits réservés — votre fournisseur fiable."
      },

      de: {
        metaTitle:"Roshine Account Store",
        metaDesc:"Premium-Overwatch-Konten mit sicherer Übergabe.",
        nav: { home:"Home", accounts:"Accounts", services:"Services", warranty:"Garantie", faq:"FAQ", contact:"Kontakt" },
        accountsKicker:"🎮 INVENTAR",
        accountsTitle:"Accounts",
        accountsDesc:"Durchsuche den verfügbaren Bestand, nutze die Filter und bestelle anschließend über Discord.",
        accountsUpdateLabel:"Nächste geplante Bestandsaktualisierung:",
        accountsUpdateValue:"In 7 Tagen",
        accountsUpdateTime:{ day:"{count} Tag", days:"{count} Tage", hour:"{count} Stunde", hours:"{count} Stunden", underHour:"Unter 1 Stunde" },
        auth:"Authenticator",
        a11y:{ skip:"Zum Inventar springen", openNav:"Navigation öffnen", closeNav:"Navigation schließen", mobileNav:"Mobile Navigation" },
        heroKicker:"⚡ Vertrauenswürdig seit 2021",
        heroTitle:"ROSHINE",
        heroSubbrand:"Overwatch Account Store",
        heroIntro:"Seit 2021 liefert Roshine Account Store kuratierte Overwatch-Accounts mit einem klaren Kaufprozess und langfristigem Support. Fünf Jahre Betrieb – für Beständigkeit, Transparenz und Vertrauen.",
        ctaExplore:"Bestand ansehen & kaufen",
        servicesKicker:"✨ SERVICES",
        servicesTitle:"Listings & Bestellung",
        servicesDesc:"Sieh dir den verfügbaren Bestand oben an und bestelle anschließend per Discord mit Account-ID oder Screenshot.",
        servicesList:[
          "📄 Accounts nach Verfügbarkeit, Spielversion, Preis, Merkmalen oder Stichwörtern filtern.",
          "🧾 Account-ID kopieren (oder Zeile screenshotten).",
          "💬 Discord beitreten und ID/Screenshot zur Bestätigung senden.",
          "✅ Nach Zahlung: Login-Daten und Sicherheits-Übergabepaket erhalten."
        ],
        btnDiscord:"Über Discord bestellen",

        warrantyKicker:"🛡️ GARANTIE",
        warrantyTitle:"Garantie & Sicherheit",
        warrantyDesc:"Klare Regeln, transparenter Ablauf, langfristiger Schutz.",
        warrantyCards:[
          { icon:"🛡️", badge:"TOP", badgeType:"primary", title:"Lebenslange Sicherheitsgarantie",
            desc:"Bei Rückforderung, Hack oder dauerhaftem Verlust durch Vorbesitzer-Themen: gleichwertiger Ersatz oder volle Rückerstattung." },
          { icon:"📂", badge:"NACHWEIS", badgeType:"primary", title:"Verifizierte Übergabe",
            desc:"Sicherheits-Paket (falls zutreffend): Original-E-Mail, Battle.net/Steam, Authenticator-Unterstützung, Account-ID und verfügbare Recovery-Daten." },
          { icon:"⚡", badge:"SCHNELL", badgeType:"primary", title:"Schnelle Lieferung",
            desc:"Meist innerhalb von 5 Minuten nach Zahlungsbestätigung (seltene High-Tier-Accounts können mehr Zeit brauchen)." },
          { icon:"♾️", badge:"KOSTENLOS", badgeType:"primary", title:"Unbegrenzter Unlock-Support (OW2)",
            desc:"Für berechtigte Overwatch-2-Accounts: unbegrenzte Hilfe bei Unlock-Problemen." },
          { icon:"🔄", badge:"PAID", badgeType:"paid", title:"Regionsänderung",
            desc:"Optionaler Paid-Service. Nur wenn es die Plattform-Richtlinien zulassen." },
          { icon:"🚫", badge:"PAID", badgeType:"paid", title:"Unban-Einspruch Hilfe",
            desc:"Optionaler Paid-Service. Wir helfen beim Einreichen – keine Erfolgsgarantie (offizielle Entscheidung)." }
        ],

        faqKicker:"❓ FAQ",
        faqTitle:"Häufige Fragen",
        faqDesc:"Kurzantworten für den schnellen Kaufentscheid.",
        faq1:"Sind die Accounts sicher? — Jeder Account stammt von einem echten Spieler und hat eine normale Spielhistorie; es handelt sich nicht um Script-, Bot-, Farm- oder Massenware. Accounts mit bekannter Cheat-, Missbrauchs- oder sonstiger Regelverstoß-Historie werden ausgeschlossen. Wichtige Angaben können bei der Prüfung mit offiziellen In-Game- und Battle.net-Daten abgeglichen werden.",
        faq2:"Wie schnell erfolgt die Lieferung? — Die meisten Bestellungen werden innerhalb von 5 Minuten nach Zahlung geliefert. Seltene High-Tier-Accounts können etwas mehr Zeit benötigen.",
        faq3:"Welche Zahlungsmethoden werden unterstützt? — Karte, PayPal, Krypto und ausgewählte Geschenkkarten. Verfügbarkeit und Gebühren bitte auf Discord bestätigen.",
        faq4:"Wie oft wird der Bestand aktualisiert? — Der Verkaufsstatus wird in Echtzeit aktualisiert; neue Accounts werden in der Regel alle 7 Tage ergänzt. Der Countdown oben zeigt die nächste geplante Bestandsaktualisierung.",
        faq5:{
          question:"Wie wird der Battle.net Authenticator verwendet?",
          intro:"roshine.love/auth ist ein privates Tool für Battle.net Authenticator. Füge den mit dem Account gelieferten Private Key ein und kopiere bei einer Abfrage den aktuellen Code in die Battle.net App.",
          linkLabel:"roshine.love/auth",
          sections:[
            { icon:"📌", title:"Authenticator-Hinweise", items:["Codes werden alle 30 Sekunden erneuert.", "Jeder Code kann nur einmal verwendet werden.", "Ist ein Code abgelaufen, warte auf den nächsten und versuche es erneut."] }
          ]
        },
        faq6:{
          question:"Wie melde ich mich beim Overwatch-Account an?",
          intro:"Nutze die mit dem Account gelieferten Battle.net-Zugangsdaten und bestätige den Authenticator-Code nur, wenn die App ihn anfordert.",
          sections:[{ icon:"🎮", title:"Overwatch-Account anmelden", ordered:true, items:["Öffne die Battle.net Desktop App.", "Melde dich mit den gelieferten Battle.net-Zugangsdaten an.", "Schließe bei Bedarf die Prüfung mit dem aktuellen Authenticator-Code ab."] }]
        },
        faq7:{
          question:"Wie greife ich auf die Account-E-Mail zu?",
          intro:"Nutze die mit dem Account gelieferten E-Mail-Daten. Die Verifizierung hängt davon ab, ob ein Authenticator verknüpft ist.",
          sections:[{ icon:"✉️", title:"Zugriff auf die Account-E-Mail", items:["Melde dich mit den gelieferten E-Mail-Daten bei live.com an.", "Ist ein Authenticator verknüpft, nutze Google Authenticator und den gelieferten QR-Code; andernfalls E-Mail und Passwort.", "Füge nach dem Zugriff deine eigene Recovery-E-Mail hinzu."] }]
        },
        faq8:"Wann sollte ich die Sicherheitsdaten ändern? — Nutze dasselbe Gerät und eine stabile IP und warte etwa 7 Tage, bevor du Passwort, Recovery-E-Mail, Region oder andere Sicherheitseinstellungen änderst. Das reduziert Sperren und Prüfprobleme, kann Plattformrisiken aber nicht ausschließen.",
        faq9:{
          question:"Wie halte ich den Account sicher?",
          intro:"Speichere die gelieferten Informationen sofort und schütze alle Login- und Recovery-Wege.",
          sections:[{ icon:"🔐", title:"Sicherheitsempfehlungen", items:["Schütze E-Mail, Authenticator und Recovery-Daten.", "Vermeide öffentliche oder instabile IPs, VPNs, Proxys und geteilte Netzwerke.", "Teile die Account-Informationen niemals mit anderen."] }]
        },
        btnStock:"Bestand ansehen",
        btnOrder:"Über Discord bestellen",

        contactKicker:"💬 KONTAKT",
        contactTitle:"Kontakt",
        contactDesc:"Am schnellsten über Discord (ID oder Screenshot senden). Alternativ per E-Mail erreichbar.",
        btnContact:"Discord",
        btnEmail:"Email",
        footerNav: { home:"Home", services:"Services", contact:"Kontakt", privacy:"Datenschutz", terms:"AGB" },

        footer1:"© 2021–2026 Roshine Account Store.",
        footer2:"Alle Rechte vorbehalten — dein zuverlässiger Anbieter."
      },

      ar: {
        metaTitle:"Roshine Account Store",
        metaDesc:"حسابات أوفرواتش مميزة مع تسليم آمن.",
        nav: { home:"الرئيسية", accounts:"الحسابات", services:"الخدمات", warranty:"الضمان", faq:"الأسئلة", contact:"تواصل" },
        accountsKicker:"🎮 المخزون",
        accountsTitle:"الحسابات",
        accountsDesc:"تصفّح الحسابات المتاحة حاليًا، واستخدم الفلاتر، ثم اطلب عبر Discord.",
        accountsUpdateLabel:"موعد تحديث المخزون المخطط التالي:",
        accountsUpdateValue:"خلال 7 أيام",
        accountsUpdateTime:{ day:"{count} يوم", days:"{count} أيام", hour:"{count} ساعة", hours:"{count} ساعات", underHour:"أقل من ساعة" },
        auth:"Authenticator",
        a11y:{ skip:"الانتقال إلى المخزون", openNav:"فتح التنقل", closeNav:"إغلاق التنقل", mobileNav:"التنقل عبر الهاتف" },
        heroKicker:"⚡ موثوق منذ 2021",
        heroTitle:"ROSHINE",
        heroSubbrand:"متجر حسابات Overwatch",
        heroIntro:"منذ 2021 يقدّم Roshine Account Store حسابات Overwatch مختارة بعناية مع خطوات شراء واضحة ودعم طويل المدى. خمس سنوات تشغيل مبنية على الثبات والوضوح والثقة.",
        ctaExplore:"عرض المخزون والشراء",
        servicesKicker:"✨ الخدمات",
        servicesTitle:"القائمة والطلب",
        servicesDesc:"تصفّح المخزون المتاح أعلاه، ثم اطلب عبر Discord بإرسال ID الحساب أو لقطة شاشة.",
        servicesList:[
          "📄 تصفّح الحسابات وفلتر حسب التوفر وإصدار اللعبة والسعر والميزات أو الكلمات المفتاحية.",
          "🧾 انسخ ID الحساب (أو التقط لقطة للصف).",
          "💬 انضم إلى Discord وأرسل ID/اللقطة للتأكيد.",
          "✅ بعد الدفع: استلام بيانات الدخول وحزمة التسليم الأمني."
        ],
        btnDiscord:"اطلب عبر Discord",

        warrantyKicker:"🛡️ الضمان",
        warrantyTitle:"الضمان والأمان",
        warrantyDesc:"نطاق واضح، عملية شفافة، حماية طويلة المدى.",
        warrantyCards:[
          { icon:"🛡️", badge:"أساسي", badgeType:"primary", title:"ضمان أمني مدى الحياة",
            desc:"في حال الاسترجاع من المالك السابق أو الاختراق أو الفقدان الدائم بسبب مشاكل المالك السابق: استبدال بقيمة مماثلة أو تعويض كامل." },
          { icon:"📂", badge:"إثبات", badgeType:"primary", title:"تسليم موثّق",
            desc:"حزمة أمان (حسب توفرها): وصول البريد الأصلي، Battle.net / Steam، دعم نقل Authenticator، رقم الحساب ومعلومات الاسترداد المتاحة." },
          { icon:"⚡", badge:"سريع", badgeType:"primary", title:"تسليم سريع",
            desc:"يتم تسليم معظم الطلبات خلال 5 دقائق بعد تأكيد الدفع (قد تتطلب الحسابات المميزة وقتاً إضافياً)." },
          { icon:"♾️", badge:"مجاني", badgeType:"primary", title:"دعم Unlock مجاني غير محدود (OW2)",
            desc:"للحسابات المؤهلة في Overwatch 2: مساعدة غير محدودة في مشاكل الفتح." },
          { icon:"🔄", badge:"مدفوع", badgeType:"paid", title:"خدمة تغيير المنطقة",
            desc:"خدمة مدفوعة اختيارياً. يتم التنفيذ فقط وفق سياسة المنصة." },
          { icon:"🚫", badge:"مدفوع", badgeType:"paid", title:"مساعدة استئناف الحظر",
            desc:"خدمة مدفوعة اختيارياً. نساعد في إعداد وتقديم الاستئناف دون ضمان القبول (قرار رسمي)." }
        ],

        faqKicker:"❓ الأسئلة",
        faqTitle:"الأسئلة الشائعة",
        faqDesc:"إجابات سريعة قبل الطلب.",
        faq1:"هل الحسابات آمنة؟ — كل حساب مصدره لاعب حقيقي وله سجل لعب طبيعي، وليس حساب سكربت أو بوت أو مزرعة أو إنتاج جماعي. نستبعد الحسابات التي لها سجل معروف في الغش أو الإساءة أو مخالفة القواعد. ويمكن مطابقة المعلومات الأساسية في كل عرض مع بيانات اللعبة وBattle.net الرسمية أثناء التحقق.",
        faq2:"ما سرعة التسليم؟ — يتم تسليم معظم الطلبات خلال 5 دقائق بعد الدفع. قد تتطلب الحسابات المميزة وقتًا إضافيًا للتحضير.",
        faq3:"ما طرق الدفع المدعومة؟ — البطاقات وPayPal والعملات الرقمية وبعض بطاقات الهدايا. يرجى تأكيد التوفر والرسوم عبر Discord.",
        faq4:"كم مرة يتم تحديث المخزون؟ — يتم تحديث حالة المبيعات فورًا، وتُضاف حسابات جديدة عادةً كل 7 أيام. يعرض العدّ التنازلي أعلاه موعد التحديث المخطط التالي.",
        faq5:{
          question:"كيف تستخدم Battle.net Authenticator؟",
          intro:"roshine.love/auth أداة خاصة لـ Battle.net Authenticator. ألصق Private Key المرفق بمعلومات الحساب، ثم انسخ الرمز الحالي إلى تطبيق Battle.net عند طلب التحقق.",
          linkLabel:"roshine.love/auth",
          sections:[
            { icon:"📌", title:"ملاحظات Authenticator", items:["تتجدد الرموز كل 30 ثانية.", "لا يمكن استخدام كل رمز إلا مرة واحدة.", "إذا انتهت صلاحية الرمز فانتظر الرمز التالي وحاول مجددًا."] }
          ]
        },
        faq6:{
          question:"كيف تسجّل الدخول إلى حساب Overwatch؟",
          intro:"استخدم بيانات Battle.net المرفقة بالحساب وأكمل تحقق Authenticator فقط عندما يطلب التطبيق ذلك.",
          sections:[{ icon:"🎮", title:"تسجيل الدخول إلى حساب Overwatch", ordered:true, items:["افتح تطبيق Battle.net لسطح المكتب.", "سجّل الدخول باستخدام بيانات Battle.net المقدمة.", "أكمل التحقق بالرمز الحالي من Authenticator عند الطلب."] }]
        },
        faq7:{
          question:"كيف تصل إلى بريد الحساب؟",
          intro:"استخدم معلومات البريد المرفقة بالحساب. تعتمد طريقة التحقق على ما إذا كان Authenticator مرتبطًا.",
          sections:[{ icon:"✉️", title:"الوصول إلى بريد الحساب", items:["سجّل الدخول إلى live.com بمعلومات البريد المقدمة.", "إذا كان Authenticator مرتبطًا، استخدم Google Authenticator ورمز QR المقدم؛ وإلا استخدم البريد وكلمة المرور.", "بعد الدخول أضف بريد الاسترداد الخاص بك."] }]
        },
        faq8:"متى يجب تحديث معلومات أمان الحساب؟ — استخدم الجهاز نفسه وIP ثابتًا وانتظر نحو 7 أيام قبل تغيير كلمة المرور أو بريد الاسترداد أو المنطقة أو إعدادات الأمان الأخرى. يقلل ذلك مشكلات القفل والتحقق لكنه لا يلغي مخاطر المنصة.",
        faq9:{
          question:"كيف تحافظ على أمان الحساب؟",
          intro:"احفظ معلومات الحساب فور التسليم واحمِ جميع وسائل الدخول والاسترداد.",
          sections:[{ icon:"🔐", title:"توصيات أمان الحساب", items:["حافظ على أمان البريد وAuthenticator وبيانات الاسترداد.", "تجنب عناوين IP العامة أو غير المستقرة وVPN والبروكسي والشبكات المشتركة.", "لا تشارك معلومات الحساب مع الآخرين."] }]
        },
        btnStock:"عرض المخزون",
        btnOrder:"اطلب عبر Discord",

        contactKicker:"💬 تواصل",
        contactTitle:"تواصل معنا",
        contactDesc:"للرد الأسرع: Discord (أرسل ID أو لقطة). ويمكنك أيضًا مراسلتنا عبر البريد الإلكتروني.",
        btnContact:"Discord",
        btnEmail:"Email",
        footerNav: { home:"الرئيسية", services:"الخدمات", contact:"تواصل", privacy:"الخصوصية", terms:"الشروط" },

        footer1:"© 2021–2026 Roshine Account Store.",
        footer2:"جميع الحقوق محفوظة — المورّد الموثوق للحسابات."
      },

      zh: {
        metaTitle:"Roshine 账号商店",
        metaDesc:"高质量守望先锋账号，安全交付。",
        nav: { home:"主页", accounts:"库存", services:"服务", warranty:"售后", faq:"常见问题", contact:"联系" },
        accountsKicker:"🎮 库存",
        accountsTitle:"账号库存",
        accountsDesc:"浏览当前可售库存，选择账号后通过 Discord 下单。",
        accountsUpdateLabel:"下次计划更新库存：",
        accountsUpdateValue:"7 天后",
        accountsUpdateTime:{ day:"{count} 天", days:"{count} 天", hour:"{count} 小时", hours:"{count} 小时", underHour:"不足 1 小时" },
        auth:"Authenticator",
        a11y:{ skip:"跳到账号库存", openNav:"打开导航", closeNav:"关闭导航", mobileNav:"移动端导航" },
        heroKicker:"⚡ 自 2021 年稳定运营",
        heroTitle:"ROSHINE",
        heroSubbrand:"守望先锋账号商店",
        heroIntro:"Roshine Account Store 自 2021 年起持续提供精选 Overwatch 账号，流程清晰、交付稳定、支持长期售后。已稳定运行 5 年，专注于可靠性与买家信心。",
        ctaExplore:"查看库存并购买",
        servicesKicker:"✨ 服务",
        servicesTitle:"库存与下单",
        servicesDesc:"浏览上方当前可售库存，通过 Discord 发送账号 ID 或截图即可确认并购买。",
        servicesList:[
          "📄 浏览账号，并按库存状态、游戏版本、价格、账号特征或关键词筛选。",
          "🧾 复制账号 ID（或截图对应行）。",
          "💬 加入 Discord 发送 ID/截图，确认库存与总价。",
          "✅ 付款后交付登录信息与安全资料包。"
        ],
        btnDiscord:"通过 Discord 下单",

        warrantyKicker:"🛡️ 质保",
        warrantyTitle:"质保与安全",
        warrantyDesc:"范围明确、流程透明、长期保障更可控。",
        warrantyCards:[
          { icon:"🛡️", badge:"核心", badgeType:"primary", title:"终身安全质保",
            desc:"若因原持有人找回/被盗/永久丢失等安全问题导致账号失效：提供等值替换或全额补偿。" },
          { icon:"📂", badge:"凭证", badgeType:"primary", title:"完整资料交接",
            desc:"安全资料包（按实际情况）：原邮箱权限、Battle.net / Steam、令牌转移协助、账号 ID 及可用恢复资料。" },
          { icon:"⚡", badge:"极速", badgeType:"primary", title:"极速交付",
            desc:"多数订单在确认付款后 5 分钟内完成交付（少数顶级账号可能需要额外整理时间）。" },
          { icon:"♾️", badge:"免费", badgeType:"primary", title:"OW2 免费解锁支持（不限次）",
            desc:"仅适用于守望先锋 2 账号：如出现解锁相关问题，提供不限次数协助。" },
          { icon:"🔄", badge:"付费", badgeType:"paid", title:"区服变更服务",
            desc:"可选付费服务。仅在平台政策允许范围内协助区服调整。" },
          { icon:"🚫", badge:"付费", badgeType:"paid", title:"解封申诉协助",
            desc:"可选付费服务。协助整理并提交申诉材料；最终结果以官方审核为准（不保证通过）。" }
        ],

        faqKicker:"❓ FAQ",
        faqTitle:"常见问题",
        faqDesc:"下单前最常问的几个点，直接看这里。",
        faq1:"账号是否安全？— 所有账号均来自真人玩家并具有正常游戏记录，不是脚本号、机器人号、工作室批量号或其他破坏游戏规则的账号。我们不会上架存在已知作弊、滥用或其他违规历史的账号；每条商品描述中的关键信息均可在核验时通过游戏内与 Battle.net 官方记录交叉确认。",
        faq2:"多久交付？— 大部分订单在付款后 5 分钟内完成交付；少数顶级账号可能需要额外整理时间。",
        faq3:"支持哪些付款方式？— 支持信用卡、PayPal、虚拟货币及部分礼品卡；具体可用方式与手续费请在 Discord 确认。",
        faq4:"库存多久更新？— 账号销售状态会实时更新；新库存通常每 7 天补充一次。上方倒计时显示下一次计划更新时间。",
        faq5:{
          question:"如何使用 Battle.net Authenticator？",
          intro:"roshine.love/auth 是 Battle.net Authenticator 的私人工具。粘贴随账号资料交付的 Private Key；需要验证时，将当前验证码复制到 Battle.net App 即可。",
          linkLabel:"roshine.love/auth",
          sections:[
            { icon:"📌", title:"Authenticator 使用提示", items:["验证码每 30 秒自动刷新。", "每个验证码只能使用一次。", "如果验证码已过期，请等待新验证码生成后重试。"] }
          ]
        },
        faq6:{
          question:"如何登录 Overwatch 账号？",
          intro:"使用随账号交付的 Battle.net 登录信息；仅在客户端要求验证时输入 Authenticator 验证码。",
          sections:[{ icon:"🎮", title:"Overwatch 账号登录", ordered:true, items:["打开 Battle.net 桌面客户端。", "使用交付的 Battle.net 账号信息登录。", "如系统要求验证，请输入 Authenticator 当前显示的验证码。"] }]
        },
        faq7:{
          question:"如何登录账号邮箱？",
          intro:"使用随账号交付的邮箱信息登录；具体验证方式取决于邮箱是否绑定了验证器。",
          sections:[{ icon:"✉️", title:"账号邮箱登录", items:["使用交付的邮箱信息登录 live.com。", "如果邮箱绑定了验证器，请使用 Google Authenticator 扫描交付的二维码完成验证；未绑定时直接使用邮箱和密码登录。", "成功进入邮箱后，建议添加你自己的恢复邮箱以提高安全性。"] }]
        },
        faq8:"什么时候修改账号安全信息？— 建议保持同一设备与稳定 IP 使用约 7 天后，再修改密码、恢复邮箱、地区或其他安全设置。这样可降低安全锁定与验证问题，但无法完全消除平台风险。",
        faq9:{
          question:"如何保障账号安全？",
          intro:"交付后立即保存全部账号资料，并保护好所有登录与恢复渠道。",
          sections:[{ icon:"🔐", title:"账号安全建议", items:["妥善保管邮箱、Authenticator 与恢复资料。", "避免使用公共或不稳定 IP、VPN、代理及共享网络。", "不要向其他人分享账号资料。"] }]
        },
        btnStock:"查看库存",
        btnOrder:"Discord 下单",

        contactKicker:"💬 联系",
        contactTitle:"联系我们",
        contactDesc:"最快方式：Discord（发送账号 ID 或截图）。也可随时通过邮箱联系我们。",
        btnContact:"Discord",
        btnEmail:"Email",
        footerNav: { home:"主页", services:"服务", contact:"联系", privacy:"隐私", terms:"条款" },

        footer1:"© 2021–2026 Roshine Account Store。",
        footer2:"All rights reserved — your reliable account supplier."
      }
    };

    const INVENTORY_COUNTDOWN_HOUR_MS = 60 * 60 * 1000;
    let inventoryCountdownTimer = 0;

    function getNextInventoryUpdate(element, now = Date.now()) {
      const anchor = Date.parse(element?.dataset.updateAt || '');
      const repeatHours = Number(element?.dataset.repeatHours || 168);
      const interval = repeatHours * INVENTORY_COUNTDOWN_HOUR_MS;
      if (!Number.isFinite(anchor) || !Number.isFinite(interval) || interval <= 0) return null;
      if (anchor > now) return anchor;
      const completedIntervals = Math.floor((now - anchor) / interval) + 1;
      return anchor + completedIntervals * interval;
    }

    function formatCountdownUnit(template, count) {
      return String(template || '').replace('{count}', String(count));
    }

    function updateInventoryCountdown(lang = document.documentElement.lang || 'en', now = Date.now()) {
      const element = document.getElementById('accountsUpdateValue');
      if (!element) return;
      const target = getNextInventoryUpdate(element, now);
      const translations = i18n[lang] || i18n.en;
      const units = translations.accountsUpdateTime || i18n.en.accountsUpdateTime;
      if (!target) {
        element.textContent = translations.accountsUpdateValue || i18n.en.accountsUpdateValue;
        return;
      }

      const remaining = Math.max(0, target - now);
      const totalHours = Math.floor(remaining / INVENTORY_COUNTDOWN_HOUR_MS);
      if (totalHours < 1) {
        element.textContent = units.underHour;
      } else {
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;
        const parts = [];
        if (days > 0) parts.push(formatCountdownUnit(days === 1 ? units.day : units.days, days));
        if (hours > 0) parts.push(formatCountdownUnit(hours === 1 ? units.hour : units.hours, hours));
        element.textContent = parts.join(' ');
      }

      element.dataset.targetTimestamp = String(target);
      try {
        const locale = { en:'en-US', fr:'fr-FR', de:'de-DE', ar:'ar', zh:'zh-CN' }[lang] || lang;
        element.title = new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai'
        }).format(new Date(target));
      } catch {
        element.title = new Date(target).toISOString();
      }
    }

    function startInventoryCountdown() {
      window.clearInterval(inventoryCountdownTimer);
      updateInventoryCountdown();
      inventoryCountdownTimer = window.setInterval(() => updateInventoryCountdown(), 60 * 1000);
    }

    const accountUiI18n = {
      en: {
        toolsAria:"Account inventory controls",
        filterSort:"Filter & Sort", filterSubtitle:"Refine the inventory results", resetFilters:"Reset filters", closeFilters:"Close filters",
        activeFilters:"Active filters", clearFilter:"Remove this filter", searchLabel:"Search", applyFilters:"Show {count} accounts",
        popularSearches:"Popular searches", popularSearchesAria:"Popular account searches",
        showMore:"Show more skins", showLess:"Show fewer skins", playtime:"Playtime", credits:"Credits", coins:"Coins",
        mythicPrisms:"Mythic Prisms",
        compPointsAll:"Comp Points (All)",
        searchPlaceholder:"Search accounts",
        searchAria:"Search accounts",
        typeAria:"Filter Overwatch version",
        typeOptions:["Overwatch Version", "OW1", "OW2"],
        statusAria:"Filter account status", statusOptions:["In Stock", "Sold", "Pending", "All Statuses"],
        priceAria:"Filter price range", priceOptions:["Price Range", "< $30", "$30–$100", "> $100"],
        nameChangeAria:"Filter free name change", nameChangeOptions:["Free Name Change", "Free Name: Yes", "Free Name: No"],
        sortAria:"Sort accounts",
        sortGroups:["Price", "Account progress", "Wallet or Balance"],
        sortOptions:["Recommended", "Price: Low to High", "Price: High to Low", "Level: High to Low", "Level: Low to High", "Playtime: High to Low", "Playtime: Low to High", "Coins: High to Low", "Coins: Low to High", "Credits: High to Low", "Credits: Low to High", "Mythic Prisms: High to Low"],
        results:"{shown} / {total} accounts",
        empty:"No accounts match the current search and filters.",
        loadError:"Unable to load account inventory.",
        rank:"Rank", price:"Price", level:"Level", statusLabel:"Status", weapons:"Weapons",
        freeRename:"Free rename", top500Eligible:"TOP500 Eligible",
        yes:"Yes", no:"No", viewSkins:"View Skins", buyNow:"Buy Now", copyId:"Copy ID", copied:"Copied",
        missingScreenshot:"The screenshot link is missing from this account.",
        premiumAccount:"Premium Account", statusInStock:"In Stock", statusSold:"Sold", statusPending:"Pending"
      },
      fr: {
        toolsAria:"Contrôles de l’inventaire des comptes",
        filterSort:"Filtres et tri", filterSubtitle:"Affinez les résultats de l’inventaire", resetFilters:"Réinitialiser", closeFilters:"Fermer les filtres",
        activeFilters:"Filtres actifs", clearFilter:"Retirer ce filtre", searchLabel:"Recherche", applyFilters:"Afficher {count} comptes",
        popularSearches:"Recherches populaires", popularSearchesAria:"Recherches populaires de comptes",
        showMore:"Afficher plus de skins", showLess:"Afficher moins de skins", playtime:"Temps de jeu", credits:"Crédits", coins:"Coins",
        mythicPrisms:"Prismes mythiques",
        compPointsAll:"Pts compét. (total)",
        searchPlaceholder:"Rechercher des comptes",
        searchAria:"Rechercher dans les comptes",
        typeAria:"Filtrer la version d’Overwatch",
        typeOptions:["Version d’Overwatch", "OW1", "OW2"],
        statusAria:"Filtrer le statut du compte", statusOptions:["En stock", "Vendu", "En attente", "Tous les statuts"],
        priceAria:"Filtrer la tranche de prix", priceOptions:["Tranche de prix", "Moins de 30 $", "30–100 $", "Plus de 100 $"],
        nameChangeAria:"Filtrer le renommage gratuit", nameChangeOptions:["Renommage gratuit", "Renommage : Oui", "Renommage : Non"],
        sortAria:"Trier les comptes",
        sortGroups:["Prix", "Progression du compte", "Portefeuille ou solde"],
        sortOptions:["Recommandé", "Prix : croissant", "Prix : décroissant", "Niveau : décroissant", "Niveau : croissant", "Temps de jeu : décroissant", "Temps de jeu : croissant", "Coins : décroissant", "Coins : croissant", "Crédits : décroissant", "Crédits : croissant", "Prismes mythiques : décroissant"],
        results:"{shown} / {total} comptes",
        empty:"Aucun compte ne correspond à la recherche et aux filtres actuels.",
        loadError:"Impossible de charger l’inventaire des comptes.",
        rank:"Rang", price:"Prix", level:"Niveau", statusLabel:"Statut", weapons:"Armes",
        freeRename:"Renommage gratuit", top500Eligible:"Éligible TOP500",
        yes:"Oui", no:"Non", viewSkins:"Voir les skins", buyNow:"Acheter", copyId:"Copier l’ID", copied:"Copié",
        missingScreenshot:"Le lien de capture est absent pour ce compte.",
        premiumAccount:"Compte Premium", statusInStock:"En stock", statusSold:"Vendu", statusPending:"En attente"
      },
      de: {
        toolsAria:"Steuerung des Account-Inventars",
        filterSort:"Filtern & sortieren", filterSubtitle:"Inventarergebnisse eingrenzen", resetFilters:"Filter zurücksetzen", closeFilters:"Filter schließen",
        activeFilters:"Aktive Filter", clearFilter:"Diesen Filter entfernen", searchLabel:"Suche", applyFilters:"{count} Accounts anzeigen",
        popularSearches:"Beliebte Suchen", popularSearchesAria:"Beliebte Account-Suchen",
        showMore:"Mehr Skins anzeigen", showLess:"Weniger Skins anzeigen", playtime:"Spielzeit", credits:"Credits", coins:"Coins",
        mythicPrisms:"Mythische Prismen",
        compPointsAll:"Comp-Punkte (gesamt)",
        searchPlaceholder:"Accounts suchen",
        searchAria:"Accounts suchen",
        typeAria:"Nach Overwatch-Version filtern",
        typeOptions:["Overwatch-Version", "OW1", "OW2"],
        statusAria:"Account-Status filtern", statusOptions:["Auf Lager", "Verkauft", "Ausstehend", "Alle Status"],
        priceAria:"Preisspanne filtern", priceOptions:["Preisspanne", "Unter 30 $", "30–100 $", "Über 100 $"],
        nameChangeAria:"Kostenlose Umbenennung filtern", nameChangeOptions:["Kostenlose Umbenennung", "Umbenennung: Ja", "Umbenennung: Nein"],
        sortAria:"Accounts sortieren",
        sortGroups:["Preis", "Account-Fortschritt", "Wallet oder Guthaben"],
        sortOptions:["Empfohlen", "Preis: aufsteigend", "Preis: absteigend", "Level: absteigend", "Level: aufsteigend", "Spielzeit: absteigend", "Spielzeit: aufsteigend", "Coins: absteigend", "Coins: aufsteigend", "Credits: absteigend", "Credits: aufsteigend", "Mythische Prismen: absteigend"],
        results:"{shown} / {total} Accounts",
        empty:"Keine Accounts entsprechen der aktuellen Suche und den Filtern.",
        loadError:"Das Account-Inventar konnte nicht geladen werden.",
        rank:"Rang", price:"Preis", level:"Level", statusLabel:"Status", weapons:"Waffen",
        freeRename:"Kostenlose Umbenennung", top500Eligible:"TOP500-berechtigt",
        yes:"Ja", no:"Nein", viewSkins:"Skins ansehen", buyNow:"Jetzt kaufen", copyId:"ID kopieren", copied:"Kopiert",
        missingScreenshot:"Für diesen Account fehlt der Screenshot-Link.",
        premiumAccount:"Premium-Account", statusInStock:"Auf Lager", statusSold:"Verkauft", statusPending:"Ausstehend"
      },
      ar: {
        toolsAria:"أدوات التحكم في مخزون الحسابات",
        filterSort:"تصفية وترتيب", filterSubtitle:"تخصيص نتائج المخزون", resetFilters:"إعادة ضبط الفلاتر", closeFilters:"إغلاق الفلاتر",
        activeFilters:"الفلاتر النشطة", clearFilter:"إزالة هذا الفلتر", searchLabel:"البحث", applyFilters:"عرض {count} حساب",
        popularSearches:"عمليات البحث الشائعة", popularSearchesAria:"عمليات البحث الشائعة عن الحسابات",
        showMore:"عرض المزيد من السكنات", showLess:"عرض سكنات أقل", playtime:"وقت اللعب", credits:"Credits", coins:"Coins",
        mythicPrisms:"Mythic Prisms",
        compPointsAll:"نقاط التنافس (الإجمالي)",
        searchPlaceholder:"البحث في الحسابات",
        searchAria:"البحث في الحسابات",
        typeAria:"تصفية حسب إصدار Overwatch",
        typeOptions:["إصدار Overwatch", "OW1", "OW2"],
        statusAria:"تصفية حالة الحساب", statusOptions:["متوفر", "مباع", "قيد الانتظار", "كل الحالات"],
        priceAria:"تصفية نطاق السعر", priceOptions:["نطاق السعر", "أقل من 30$", "30$–100$", "أكثر من 100$"],
        nameChangeAria:"تصفية تغيير الاسم المجاني", nameChangeOptions:["تغيير الاسم مجانًا", "تغيير الاسم: نعم", "تغيير الاسم: لا"],
        sortAria:"ترتيب الحسابات",
        sortGroups:["السعر", "تقدم الحساب", "المحفظة أو الرصيد"],
        sortOptions:["موصى به", "السعر: تصاعدي", "السعر: تنازلي", "المستوى: تنازلي", "المستوى: تصاعدي", "وقت اللعب: تنازلي", "وقت اللعب: تصاعدي", "Coins: تنازلي", "Coins: تصاعدي", "Credits: تنازلي", "Credits: تصاعدي", "Mythic Prisms: من الأعلى للأدنى"],
        results:"{shown} / {total} حساب",
        empty:"لا توجد حسابات تطابق البحث والفلاتر الحالية.",
        loadError:"تعذر تحميل مخزون الحسابات.",
        rank:"الرتبة", price:"السعر", level:"المستوى", statusLabel:"الحالة", weapons:"الأسلحة",
        freeRename:"تغيير اسم مجاني", top500Eligible:"مؤهل TOP500",
        yes:"نعم", no:"لا", viewSkins:"عرض السكنات", buyNow:"اشترِ الآن", copyId:"نسخ ID", copied:"تم النسخ",
        missingScreenshot:"رابط الصور غير متوفر لهذا الحساب.",
        premiumAccount:"حساب مميز", statusInStock:"متوفر", statusSold:"مباع", statusPending:"قيد الانتظار"
      },
      zh: {
        toolsAria:"账号库存筛选与排序",
        filterSort:"筛选与排序", filterSubtitle:"快速缩小库存范围", resetFilters:"清除筛选", closeFilters:"关闭筛选",
        activeFilters:"当前筛选", clearFilter:"移除此筛选条件", searchLabel:"检索", applyFilters:"查看 {count} 个账号",
        popularSearches:"热门搜索", popularSearchesAria:"热门账号搜索",
        showMore:"展开更多皮肤", showLess:"收起皮肤详情", playtime:"游戏时长", credits:"Credits", coins:"Coins",
        mythicPrisms:"神话棱晶",
        compPointsAll:"竞技点数（总计）",
        searchPlaceholder:"搜索账号",
        searchAria:"搜索账号",
        typeAria:"筛选守望先锋版本",
        typeOptions:["守望先锋版本", "OW1", "OW2"],
        statusAria:"筛选库存状态", statusOptions:["有库存", "已售出", "待处理", "全部状态"],
        priceAria:"筛选价格区间", priceOptions:["价格区间", "低于 $30", "$30–$100", "高于 $100"],
        nameChangeAria:"筛选免费改名", nameChangeOptions:["免费改名", "改名：有", "改名：无"],
        sortAria:"账号排序",
        sortGroups:["价格", "账号进度", "钱包或余额"],
        sortOptions:["推荐排序", "价格：从低到高", "价格：从高到低", "等级：从高到低", "等级：从低到高", "游戏时长：从多到少", "游戏时长：从少到多", "Coins：从多到少", "Coins：从少到多", "Credits：从多到少", "Credits：从少到多", "神话棱晶：从多到少"],
        results:"显示 {shown} / 共 {total} 个账号",
        empty:"没有符合当前检索及筛选条件的账号。",
        loadError:"账号库存加载失败。",
        rank:"段位", price:"价格", level:"等级", statusLabel:"状态", weapons:"武器",
        freeRename:"免费改名", top500Eligible:"TOP500 资格",
        yes:"有", no:"无", viewSkins:"查看皮肤", buyNow:"立即购买", copyId:"复制 ID", copied:"已复制",
        missingScreenshot:"该账号暂未提供皮肤截图链接。",
        premiumAccount:"精品账号", statusInStock:"有库存", statusSold:"已售出", statusPending:"待处理"
      }
    };

    function getAccountUiText(lang = document.documentElement.lang) {
      return accountUiI18n[lang] || accountUiI18n.en;
    }

    function setSelectOptionText(selectId, labels) {
      const select = document.getElementById(selectId);
      if (!select) return;
      labels.forEach((label, index) => {
        if (select.options[index]) select.options[index].textContent = label;
      });
    }

    function setSelectGroupText(selectId, labels) {
      const groups = document.getElementById(selectId)?.querySelectorAll('optgroup') || [];
      labels.forEach((label, index) => {
        if (groups[index]) groups[index].label = label;
      });
    }

    function createCustomSelectOption(option, menu) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'accounts-select-option';
      button.dataset.selectValue = option.value;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(option.selected));
      button.tabIndex = option.selected ? 0 : -1;
      button.textContent = option.textContent;
      menu.appendChild(button);
    }

    function getCustomSelectParts(picker) {
      return {
        select: picker?.querySelector('select'),
        trigger: picker?.querySelector('[data-select-trigger]'),
        value: picker?.querySelector('[data-select-value]'),
        menu: picker?.querySelector('[data-select-menu]')
      };
    }

    function syncCustomSelectPicker(picker) {
      const { select, trigger, value, menu } = getCustomSelectParts(picker);
      if (!picker || !select || !trigger || !value || !menu) return;

      const selected = select.selectedOptions[0];
      value.textContent = selected?.textContent || '';
      const controlLabel = select.getAttribute('aria-label') || 'Choose an option';
      trigger.setAttribute('aria-label', `${controlLabel}: ${value.textContent}`);
      menu.setAttribute('aria-label', controlLabel);
      menu.replaceChildren();

      [...select.children].forEach(child => {
        if (child.tagName === 'OPTION') {
          createCustomSelectOption(child, menu);
          return;
        }
        if (child.tagName !== 'OPTGROUP') return;
        const group = document.createElement('div');
        group.className = 'accounts-select-group';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', child.label);
        const label = document.createElement('div');
        label.className = 'accounts-select-group-label';
        label.setAttribute('aria-hidden', 'true');
        label.textContent = child.label;
        group.appendChild(label);
        [...child.children].forEach(option => createCustomSelectOption(option, group));
        menu.appendChild(group);
      });
    }

    function syncAllCustomSelectPickers() {
      document.querySelectorAll('[data-select-picker]').forEach(syncCustomSelectPicker);
    }

    function positionCustomSelectMenu(picker) {
      const { trigger, menu } = getCustomSelectParts(picker);
      if (!trigger || !menu || menu.hidden) return;
      picker.dataset.placement = 'bottom';
      menu.style.maxHeight = 'none';
      const triggerRect = trigger.getBoundingClientRect();
      const viewportPadding = 12;
      const spaceBelow = Math.max(0, window.innerHeight - triggerRect.bottom - viewportPadding);
      const spaceAbove = Math.max(0, triggerRect.top - viewportPadding);
      const desiredHeight = Math.min(menu.scrollHeight, 520);
      const openAbove = spaceBelow < Math.min(desiredHeight, 220) && spaceAbove > spaceBelow;
      picker.dataset.placement = openAbove ? 'top' : 'bottom';
      const availableHeight = openAbove ? spaceAbove : spaceBelow;
      menu.style.maxHeight = `${Math.max(96, Math.min(520, Math.floor(availableHeight)))}px`;
    }

    function setCustomSelectOpen(picker, open, focusTarget = 'selected') {
      const { trigger, menu } = getCustomSelectParts(picker);
      if (!picker || !trigger || !menu) return;
      if (open) {
        document.querySelectorAll('[data-select-picker][data-open="true"]').forEach(otherPicker => {
          if (otherPicker !== picker) setCustomSelectOpen(otherPicker, false);
        });
      }
      picker.dataset.open = String(open);
      trigger.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      if (!open) return;
      positionCustomSelectMenu(picker);
      window.requestAnimationFrame(() => {
        const options = [...menu.querySelectorAll('[data-select-value]')];
        if (!options.length) return;
        const target = focusTarget === 'last'
          ? options.at(-1)
          : menu.querySelector('[aria-selected="true"]') || options[0];
        target?.focus({ preventScroll: true });
      });
    }

    function initCustomSelectPicker(picker) {
      const { select, trigger, menu } = getCustomSelectParts(picker);
      if (!picker || !select || !trigger || !menu || picker.dataset.initialized === 'true') return;
      picker.dataset.initialized = 'true';
      syncCustomSelectPicker(picker);

      trigger.addEventListener('click', () => {
        setCustomSelectOpen(picker, menu.hidden);
      });
      trigger.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          setCustomSelectOpen(picker, true, event.key === 'ArrowUp' ? 'last' : 'selected');
        } else if (event.key === 'Escape' && !menu.hidden) {
          event.preventDefault();
          setCustomSelectOpen(picker, false);
        }
      });
      menu.addEventListener('click', event => {
        const option = event.target.closest('[data-select-value]');
        if (!option) return;
        select.value = option.dataset.selectValue;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        syncCustomSelectPicker(picker);
        setCustomSelectOpen(picker, false);
        trigger.focus({ preventScroll: true });
      });
      menu.addEventListener('keydown', event => {
        const options = [...menu.querySelectorAll('[data-select-value]')];
        const currentIndex = options.indexOf(document.activeElement);
        let nextIndex = currentIndex;
        if (event.key === 'ArrowDown') nextIndex = Math.min(options.length - 1, currentIndex + 1);
        else if (event.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1);
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = options.length - 1;
        else if (event.key === 'Escape') {
          event.preventDefault();
          setCustomSelectOpen(picker, false);
          trigger.focus({ preventScroll: true });
          return;
        } else if (event.key === 'Tab') {
          setCustomSelectOpen(picker, false);
          return;
        } else {
          return;
        }
        event.preventDefault();
        options.forEach((option, index) => { option.tabIndex = index === nextIndex ? 0 : -1; });
        options[nextIndex]?.focus({ preventScroll: true });
      });
      select.addEventListener('change', () => syncCustomSelectPicker(picker));
    }

    function initAllCustomSelectPickers() {
      const pickers = [...document.querySelectorAll('[data-select-picker]')];
      pickers.forEach(initCustomSelectPicker);
      document.addEventListener('pointerdown', event => {
        pickers.forEach(picker => {
          if (!picker.contains(event.target)) setCustomSelectOpen(picker, false);
        });
      });
      window.addEventListener('resize', () => {
        pickers.forEach(picker => {
          if (window.innerWidth <= 700) setCustomSelectOpen(picker, false);
          else if (picker.dataset.open === 'true') positionCustomSelectMenu(picker);
        });
      }, { passive: true });
    }

    function initLanguagePicker() {
      const picker = document.getElementById('languagePicker');
      const select = document.getElementById('langSelect');
      const trigger = document.getElementById('languageTrigger');
      const triggerValue = document.getElementById('languageTriggerValue');
      const menu = document.getElementById('languageMenu');
      if (!picker || !select || !trigger || !triggerValue || !menu) return;

      const getOptions = () => [...menu.querySelectorAll('[data-language-value]')];
      const sync = () => {
        const selected = select.options[select.selectedIndex];
        const label = selected?.textContent?.trim() || select.value.toUpperCase();
        triggerValue.textContent = label;
        trigger.setAttribute('aria-label', `Language: ${label}`);
        getOptions().forEach(option => {
          const isSelected = option.dataset.languageValue === select.value;
          option.setAttribute('aria-selected', String(isSelected));
          option.tabIndex = isSelected ? 0 : -1;
        });
      };
      const setOpen = (open, focusSelected = false) => {
        picker.dataset.open = String(open);
        trigger.setAttribute('aria-expanded', String(open));
        menu.hidden = !open;
        if (open && focusSelected) {
          window.requestAnimationFrame(() => {
            (menu.querySelector('[aria-selected="true"]') || getOptions()[0])?.focus({ preventScroll: true });
          });
        }
      };

      trigger.addEventListener('click', () => setOpen(menu.hidden));
      trigger.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          setOpen(true, true);
        } else if (event.key === 'Escape') {
          setOpen(false);
        }
      });
      menu.addEventListener('click', event => {
        const option = event.target.closest('[data-language-value]');
        if (!option) return;
        select.value = option.dataset.languageValue;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        setOpen(false);
        trigger.focus({ preventScroll: true });
      });
      menu.addEventListener('keydown', event => {
        const options = getOptions();
        const currentIndex = options.indexOf(document.activeElement);
        let nextIndex = currentIndex;
        if (event.key === 'ArrowDown') nextIndex = Math.min(options.length - 1, currentIndex + 1);
        else if (event.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1);
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = options.length - 1;
        else if (event.key === 'Escape') {
          event.preventDefault();
          setOpen(false);
          trigger.focus({ preventScroll: true });
          return;
        } else if (event.key === 'Tab') {
          setOpen(false);
          return;
        } else {
          return;
        }
        event.preventDefault();
        options[nextIndex]?.focus({ preventScroll: true });
      });
      select.addEventListener('change', sync);
      document.addEventListener('pointerdown', event => {
        if (!picker.contains(event.target)) setOpen(false);
      });
      sync();
    }

    function detectLang(){
      const urlLang = new URLSearchParams(window.location.search).get("lang");
      if (urlLang && i18n[urlLang]) return urlLang;

      const saved = localStorage.getItem(LANG_KEY);
      if (saved && saved !== "zh" && i18n[saved]) return saved;

      const nav = (navigator.language || "en").toLowerCase();
      if (nav.startsWith("zh")) return "en";
      if (nav.startsWith("fr")) return "fr";
      if (nav.startsWith("de")) return "de";
      if (nav.startsWith("ar")) return "ar";
      return "en";
    }

    function setList(elId, items){
      const el = document.getElementById(elId);
      el.innerHTML = "";
      items.forEach(txt=>{
        const li = document.createElement("li");
        li.textContent = txt;
        el.appendChild(li);
      });
    }

    function setWarrantyCards(cards){
      const grid = document.getElementById("warrantyGrid");
      if (!grid) return;
      grid.innerHTML = "";

      cards.forEach(c=>{
        const card = document.createElement("div");
        card.className = "warranty-card";

        const top = document.createElement("div");
        top.className = "wcard-top";

        const titleWrap = document.createElement("div");
        titleWrap.className = "wcard-title-wrap";

        const icon = document.createElement("span");
        icon.className = "wcard-icon";
        icon.textContent = c.icon || "🛡️";

        const title = document.createElement("span");
        title.className = "wcard-title";
        title.textContent = c.title || "";

        titleWrap.appendChild(icon);
        titleWrap.appendChild(title);

        const badge = document.createElement("span");
        badge.className = "wcard-badge " + (c.badgeType === "paid" ? "badge-paid" : "badge-primary");
        badge.textContent = c.badge || "";

        top.appendChild(titleWrap);
        top.appendChild(badge);

        const desc = document.createElement("p");
        desc.className = "wcard-desc";
        desc.textContent = c.desc || "";

        card.appendChild(top);
        card.appendChild(desc);
        grid.appendChild(card);
      });
    }

    function setFaqItem(id, value){
      const item = document.getElementById(id);
      if (!item) return;
      const summary = item.querySelector('summary');
      const answer = item.querySelector('.faq-answer');
      if (!summary || !answer) return;

      if (!value || typeof value !== 'object') {
        const parts = String(value || '').split(/\s*—\s*/);
        summary.textContent = parts.shift() || '';
        answer.classList.remove('faq-guide');
        answer.textContent = parts.join(' — ').trim();
        return;
      }

      summary.textContent = value.question || '';
      answer.classList.add('faq-guide');
      answer.textContent = '';

      const intro = document.createElement('p');
      intro.className = 'faq-guide-intro';
      const introText = String(value.intro || '');
      const linkLabel = String(value.linkLabel || 'roshine.love/auth');
      const linkPosition = introText.indexOf(linkLabel);
      if (linkPosition >= 0) {
        intro.append(document.createTextNode(introText.slice(0, linkPosition)));
        const link = document.createElement('a');
        link.className = 'faq-auth-link';
        link.href = './auth/';
        link.textContent = linkLabel;
        intro.append(link, document.createTextNode(introText.slice(linkPosition + linkLabel.length)));
      } else {
        intro.textContent = introText;
      }
      answer.appendChild(intro);

      const grid = document.createElement('div');
      grid.className = 'faq-guide-grid';
      const sections = value.sections || [];
      if (sections.length === 1) grid.classList.add('is-single');
      sections.forEach(section => {
        const block = document.createElement('section');
        block.className = 'faq-guide-block';

        const heading = document.createElement('h4');
        const icon = document.createElement('span');
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = section.icon || '•';
        heading.append(icon, document.createTextNode(section.title || ''));

        const list = document.createElement(section.ordered ? 'ol' : 'ul');
        list.className = `faq-guide-list${section.ordered ? ' is-ordered' : ''}`;
        (section.items || []).forEach(text => {
          const listItem = document.createElement('li');
          listItem.textContent = text;
          list.appendChild(listItem);
        });

        block.append(heading, list);
        grid.appendChild(block);
      });
      answer.appendChild(grid);
    }

    function applyLang(lang){
      if (!i18n[lang]) lang = "en";
      const t = i18n[lang];

      document.documentElement.lang = lang;
      document.documentElement.dir  = (lang === "ar" ? "rtl" : "ltr");

      if (t.metaTitle) document.title = t.metaTitle;
      const md = document.querySelector('meta[name="description"]');
      if (md && t.metaDesc) md.setAttribute("content", t.metaDesc);

      const sel = document.getElementById("langSelect");
      if (sel) sel.value = lang;

      document.getElementById("navHome").textContent = t.nav.home;
      if (t.nav.accounts) document.getElementById("navAccounts").textContent = t.nav.accounts;
      document.getElementById("navServices").textContent = t.nav.services;
      document.getElementById("navWarranty").textContent = t.nav.warranty;
      document.getElementById("navFaq").textContent = t.nav.faq;
      document.getElementById("navContact").textContent = t.nav.contact;

      document.getElementById("mobileNavHome").textContent = t.nav.home;
      document.getElementById("mobileNavAccounts").textContent = t.nav.accounts || t.nav.home;
      document.getElementById("mobileNavServices").textContent = t.nav.services;
      document.getElementById("mobileNavWarranty").textContent = t.nav.warranty;
      document.getElementById("mobileNavFaq").textContent = t.nav.faq;
      document.getElementById("mobileNavContact").textContent = t.nav.contact;
      document.getElementById("mobileNavAuth").textContent = t.auth;
      document.getElementById("skipLink").textContent = t.a11y.skip;
      document.getElementById("mobileNav").setAttribute("aria-label", t.a11y.mobileNav);
      const mobileToggle = document.getElementById("mobileMenuToggle");
      mobileToggle?.setAttribute("aria-label", mobileToggle.getAttribute("aria-expanded") === "true" ? t.a11y.closeNav : t.a11y.openNav);

      document.getElementById("authBtnText").textContent = t.auth;

      document.getElementById("heroKicker").textContent = t.heroKicker;
      document.getElementById("heroTitle").textContent = t.heroTitle;
      
      const subbrand = document.getElementById("heroSubbrand");
      if (t.heroSubbrand) {
        subbrand.textContent = t.heroSubbrand;
        subbrand.style.display = "block";
      } else {
        subbrand.style.display = "none";
      }
      
      document.getElementById("heroIntro").textContent = t.heroIntro;
      document.getElementById("ctaExplore").textContent = t.ctaExplore;

      if (t.accountsKicker) document.getElementById("accountsKicker").textContent = t.accountsKicker;
      if (t.accountsTitle) document.getElementById("accountsTitle").textContent = t.accountsTitle;
      if (t.accountsDesc) document.getElementById("accountsDesc").textContent = t.accountsDesc;
      if (t.accountsUpdateLabel) document.getElementById("accountsUpdateLabel").textContent = t.accountsUpdateLabel;
      updateInventoryCountdown(lang);

      const accountUi = getAccountUiText(lang);
      const accountTools = document.querySelector('.accounts-tools');
      const accountSearch = document.getElementById('accountSearch');
      const accountTypeFilter = document.getElementById('accountTypeFilter');
      const accountStatusFilter = document.getElementById('accountStatusFilter');
      const accountPriceFilter = document.getElementById('accountPriceFilter');
      const accountNameChangeFilter = document.getElementById('accountNameChangeFilter');
      const accountSort = document.getElementById('accountSort');
      const accountPopularSearches = document.getElementById('accountPopularSearches');
      const accountPopularSearchesLabel = document.getElementById('accountPopularSearchesLabel');
      const mobileFilterLabel = document.getElementById('mobileFilterLabel');
      const resetAccountFiltersLabel = document.getElementById('resetAccountFiltersLabel');
      const accountsFilterTitle = document.getElementById('accountsFilterTitle');
      const accountsFilterSubtitle = document.getElementById('accountsFilterSubtitle');
      const closeAccountFilters = document.getElementById('closeAccountFilters');
      if (mobileFilterLabel) mobileFilterLabel.textContent = accountUi.filterSort;
      if (resetAccountFiltersLabel) resetAccountFiltersLabel.textContent = accountUi.resetFilters;
      if (accountsFilterTitle) accountsFilterTitle.textContent = accountUi.filterSort;
      if (accountsFilterSubtitle) accountsFilterSubtitle.textContent = accountUi.filterSubtitle;
      if (closeAccountFilters) closeAccountFilters.setAttribute('aria-label', accountUi.closeFilters);
      if (accountTools) accountTools.setAttribute('aria-label', accountUi.toolsAria);
      if (accountSearch) {
        accountSearch.placeholder = accountUi.searchPlaceholder;
        accountSearch.setAttribute('aria-label', accountUi.searchAria);
      }
      if (accountTypeFilter) accountTypeFilter.setAttribute('aria-label', accountUi.typeAria);
      if (accountStatusFilter) accountStatusFilter.setAttribute('aria-label', accountUi.statusAria);
      if (accountPriceFilter) accountPriceFilter.setAttribute('aria-label', accountUi.priceAria);
      if (accountNameChangeFilter) accountNameChangeFilter.setAttribute('aria-label', accountUi.nameChangeAria);
      if (accountSort) accountSort.setAttribute('aria-label', accountUi.sortAria);
      if (accountPopularSearches) accountPopularSearches.setAttribute('aria-label', accountUi.popularSearchesAria);
      if (accountPopularSearchesLabel) accountPopularSearchesLabel.textContent = `${accountUi.popularSearches}:`;
      setSelectOptionText('accountTypeFilter', accountUi.typeOptions);
      setSelectOptionText('accountStatusFilter', accountUi.statusOptions);
      setSelectOptionText('accountPriceFilter', accountUi.priceOptions);
      setSelectOptionText('accountNameChangeFilter', accountUi.nameChangeOptions);
      setSelectOptionText('accountSort', accountUi.sortOptions);
      setSelectGroupText('accountSort', accountUi.sortGroups);
      syncAllCustomSelectPickers();
      window.refreshAccountFilterUi?.();
      window.renderAccounts?.();

      document.getElementById("servicesKicker").textContent = t.servicesKicker;
      document.getElementById("servicesTitle").textContent = t.servicesTitle;
      document.getElementById("servicesDesc").textContent = t.servicesDesc;
      setList("servicesList", t.servicesList);
      document.getElementById("btnDiscord").textContent = t.btnDiscord;

      document.getElementById("warrantyKicker").textContent = t.warrantyKicker;
      document.getElementById("warrantyTitle").textContent = t.warrantyTitle;
      document.getElementById("warrantyDesc").textContent = t.warrantyDesc;
      setWarrantyCards(t.warrantyCards || []);

      document.getElementById("faqKicker").textContent = t.faqKicker;
      document.getElementById("faqTitle").textContent = t.faqTitle;
      document.getElementById("faqDesc").textContent = t.faqDesc;

      setFaqItem("faq1", t.faq1);
      setFaqItem("faq2", t.faq2);
      setFaqItem("faq3", t.faq3);
      setFaqItem("faq4", t.faq4);
      setFaqItem("faq5", t.faq5);
      setFaqItem("faq6", t.faq6);
      setFaqItem("faq7", t.faq7);
      setFaqItem("faq8", t.faq8);
      setFaqItem("faq9", t.faq9);

      document.getElementById("contactKicker").textContent = t.contactKicker;
      document.getElementById("contactTitle").textContent = t.contactTitle;
      document.getElementById("contactDesc").textContent = t.contactDesc;
      document.getElementById("btnContact").textContent = t.btnContact;
      document.getElementById("btnEmail").textContent = t.btnEmail;

      document.getElementById("footerLine1").textContent = t.footer1;
      document.getElementById("footerLine2").textContent = t.footer2;

      if (t.footerNav){
        document.getElementById("footHome").textContent = t.footerNav.home;
        document.getElementById("footServices").textContent = t.footerNav.services;
        document.getElementById("footContact").textContent = t.footerNav.contact;
        document.getElementById("footPrivacy").textContent = t.footerNav.privacy;
        document.getElementById("footTerms").textContent = t.footerNav.terms;
      }

      document.getElementById("btnDiscord").href = LINKS.discord;
      document.getElementById("btnContact").href = LINKS.discord;
      document.getElementById("btnEmail").href = LINKS.email;
      document.getElementById("authBtn").href = LINKS.auth;
    }

    applyLang(detectLang());
    initLanguagePicker();
    initAllCustomSelectPickers();
    startInventoryCountdown();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) updateInventoryCountdown();
    });
    document.getElementById("langSelect").addEventListener("change", (e)=>{
      const lang = e.target.value;
      applyLang(lang);
      localStorage.setItem(LANG_KEY, lang);
    });
