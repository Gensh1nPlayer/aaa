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

      function accountMatchesTop500(acct, value) {
        if (value === 'all') return true;
        return hasTop500Eligibility(acct) === (value === 'yes');
      }

      function accountMatchesSearch(acct, query) {
        if (!query) return true;
        const searchableText = Object.values(acct ?? {})
          .filter(value => value !== null && value !== undefined)
          .join(' ')
          .replace(/<[^>]*>/g, ' ')
          .toLocaleLowerCase();
        return searchableText.includes(query);
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
          top500: document.getElementById('accountTop500Filter'),
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
        if (controls.top500?.value && controls.top500.value !== 'all') {
          active.push({ key: 'top500', label: controls.top500.selectedOptions[0]?.textContent || controls.top500.value });
        }
        if (controls.sort?.value && controls.sort.value !== 'recommended') {
          active.push({ key: 'sort', label: controls.sort.selectedOptions[0]?.textContent || controls.sort.value });
        }
        return active;
      }

      function updateAccountFilterUi(ui = getAccountUiText(), shownCount = null) {
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
      }

      function clearAccountFilter(key) {
        const controls = getAccountFilterControls();
        if (key === 'search' && controls.search) controls.search.value = '';
        if (key === 'type' && controls.type) controls.type.value = 'all';
        if (key === 'status' && controls.status) controls.status.value = 'instock';
        if (key === 'price' && controls.price) controls.price.value = 'all';
        if (key === 'nameChange' && controls.nameChange) controls.nameChange.value = 'all';
        if (key === 'top500' && controls.top500) controls.top500.value = 'all';
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
        if (controls.top500) controls.top500.value = 'all';
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
        const top500Filter = document.getElementById('accountTop500Filter');
        const sortSelect = document.getElementById('accountSort');
        const results = document.getElementById('accountsResults');
        if (!grid || !searchInput || !typeFilter || !statusFilter || !priceFilter || !nameChangeFilter || !top500Filter || !sortSelect || !results) return;

        const ui = getAccountUiText();
        const query = searchInput.value.trim().toLocaleLowerCase();
        const visibleAccounts = accountInventory.all
          .filter(acct => accountMatchesType(acct, typeFilter.value))
          .filter(acct => accountMatchesStatus(acct, statusFilter.value))
          .filter(acct => accountMatchesPrice(acct, priceFilter.value))
          .filter(acct => accountMatchesNameChange(acct, nameChangeFilter.value))
          .filter(acct => accountMatchesTop500(acct, top500Filter.value))
          .filter(acct => accountMatchesSearch(acct, query))
          .slice()
          .sort((a, b) => compareAccounts(a, b, sortSelect.value));

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
            const { id, highlights = '', weapons = '', balance = '', rank = '', screenshot = '' } = acct;
            const level = String(acct.level ?? '');
            const status = String(acct.status ?? 'In Stock');
            const price = String(acct.price ?? '0');
            const freeNameChange = hasFreeNameChange(acct);
            const top500Eligible = hasTop500Eligibility(acct);
            const creditsAmount = getCredits(acct);
            const coinsAmount = getCoins(acct);
            const playtimeAmount = getPlaytime(acct);
            const mythicPrismsAmount = getMythicPrisms(acct);

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

            // Shared priority color rules. These are protected before the broader
            // legacy replacements run, preventing nested spans and color overrides.
            const specialSkinRules = [
              {
                pattern: /\b(?:Pink\s+Mercy|Noire|Los\s+Muertos\s+Weapon|LE\s+SSERAFIM|Nerf\s+Gelfire\s+Pro\s+Weapon|Hard\s+Light\s+Weapon|Nerf\s+Sungerang\s+Weapon|Ange\s+de\s+la\s+Mort|Rose\s+Gold|Thunder|Haroeris|Luchador|All[-\s]Stars|OWL\s+Tokens|Good\s+and\s+Evil|Mayhem\s+Biker|Mythic\s+Prisms)(?![A-Za-z0-9_])/gi,
                className: 'ac-special-skin-pink'
              },
              { pattern: /\bMidas(?![A-Za-z0-9_])/gi, className: 'ac-special-skin-gold' },
              { pattern: /\bHeart\s+of\s+Hope(?![A-Za-z0-9_])/gi, className: 'ac-special-skin-hope' },
              {
                pattern: /\b(?:Cyber\s+Demon|Zeus|Amaterasu|Galactic\s+Emperor|Adventurer|A-7000\s+Wargod|Onryō|Grand\s+Beast|Ancient\s+Caller|Vengeance|Calamity\s+Empress|Anubis|Spellbinder|Thor|Pixiu|Horang|Ultraviolet\s+Sentinel|Divine\s+Druid|Cyber\s+Fuel|Divine\s+Desperado|Magma\s+Titan|Celestial\s+Guardian|Hop\s+Online!|Volted\s+Overdrive|Ra|Ascendant\s+Phoenix|World\s+Forger|Bound\s+Demon|Midnight\s+Sun|Deliverance|Lead\s+Rose|Dame\s+Chance|Merciful\s+Magitech|Steel\s+Death|Gilded|Iridescent|Dawn|Blazing\s+Sunsetter|Spirit\s+Keeper|Star\s+Shooter|Sumi-ichimonji)(?![A-Za-z0-9_])/gi,
                className: 'ac-special-skin-mythic'
              }
            ];
            const specialWeaponChoicePattern = /\bChoice\s+of\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:additional\s+)?Gold\s*\/\s*Jade\s*\/\s*Galactic\s+Weapon(?:s|\s+Skins?)?\b/gi;

            // Custom Color Dictionary
            function applyColorMap(text) {
              if (!text) return text;
              let res = escapeAccountTextWithBreaks(text);
              const protectedSpecialSkins = [];
              const protectSpecialSkin = (pattern, className) => {
                res = res.replace(pattern, match => {
                  const token = `__COLOR_SPECIAL_SKIN_${protectedSpecialSkins.length}__`;
                  protectedSpecialSkins.push({ match, className });
                  return token;
                });
              };

              // Protect all configured special series before broader terms such as
              // "Pink", "Master" and "Galactic" are processed.
              specialSkinRules.forEach(rule => protectSpecialSkin(rule.pattern, rule.className));

              const protectedWeaponChoices = [];
              res = res.replace(specialWeaponChoicePattern, match => {
                const token = `__COLOR_WEAPON_CHOICE_${protectedWeaponChoices.length}__`;
                protectedWeaponChoices.push(match);
                return token;
              });

              // Red
			  res = res.replace(/Top 500 Challenger Tier/g, '<span style="color: #ef4444; font-weight: 700;">Top 500 Challenger Tier</span>');
			  res = res.replace(/TOP 500/g, '<span style="color: #ef4444; font-weight: 700;">TOP 500</span>');
              res = res.replace(/Top 500/g, '<span style="color: #ef4444; font-weight: 700;">TOP 500</span>');
              res = res.replace(/Hide My Name/g, '<span style="color: #ef4444; font-weight: 700;">Hide My Name</span>');
              res = res.replace(/Stacked Account/g, '<span style="color: #ef4444; font-weight: 700;">Stacked Account</span>');
              // Purple
              res = res.replace(/Premium Battle Pass/g, '<span style="color: #c084fc; font-weight: 700;">Premium Battle Pass</span>');
              res = res.replace(/Premium BP/g, '<span style="color: #c084fc; font-weight: 700;">Premium BP</span>');
			  res = res.replace(/Ultimate BP/g, '<span style="color: #c084fc; font-weight: 700;">Ultimate BP</span>');
			  res = res.replace(/Galactic Emperor/g, '<span style="color: #c084fc; font-weight: 700;">Galactic Emperor</span>');
              res = res.replace(/Galactic/g, '<span style="color: #c084fc; font-weight: 700;">Galactic</span>');
              res = res.replace(/Anubis/g, '<span style="color: #c084fc; font-weight: 700;">Anubis</span>');
              res = res.replace(/Calamity Empress/g, '<span style="color: #c084fc; font-weight: 700;">Calamity Empress</span>');
              res = res.replace(/A-7000 Wargod/g, '<span style="color: #c084fc; font-weight: 700;">A-7000 Wargod</span>');
              res = res.replace(/Amaterasu/g, '<span style="color: #c084fc; font-weight: 700;">Amaterasu</span>');
              res = res.replace(/Vengeance/g, '<span style="color: #c084fc; font-weight: 700;">Vengeance</span>');
              res = res.replace(/Lead Rose/g, '<span style="color: #c084fc; font-weight: 700;">Lead Rose</span>');
              res = res.replace(/Ultraviolet Sentinel/g, '<span style="color: #c084fc; font-weight: 700;">Ultraviolet Sentinel</span>');
              res = res.replace(/Zeus/g, '<span style="color: #c084fc; font-weight: 700;">Zeus</span>');
			  res = res.replace(/Adventurer/g, '<span style="color: #c084fc; font-weight: 700;">Adventurer</span>');
              res = res.replace(/Deliverance/g, '<span style="color: #c084fc; font-weight: 700;">Deliverance</span>');
              res = res.replace(/Steel Death/g, '<span style="color: #c084fc; font-weight: 700;">Steel Death</span>');
              res = res.replace(/Onryō/g, '<span style="color: #c084fc; font-weight: 700;">Onryō</span>');
              res = res.replace(/Pixiu/g, '<span style="color: #c084fc; font-weight: 700;">Pixiu</span>');
              res = res.replace(/Blazing Sunsetter/g, '<span style="color: #c084fc; font-weight: 700;">Blazing Sunsetter</span>');
			  res = res.replace(/Celestial Guardian/g, '<span style="color: #c084fc; font-weight: 700;">Celestial Guardian</span>');
              res = res.replace(/Ancient Caller/g, '<span style="color: #c084fc; font-weight: 700;">Ancient Caller</span>');
              res = res.replace(/Midnight Sun/g, '<span style="color: #c084fc; font-weight: 700;">Midnight Sun</span>');
              res = res.replace(/Spellbinder/g, '<span style="color: #c084fc; font-weight: 700;">Spellbinder</span>');
              res = res.replace(/Cyber Demon/g, '<span style="color: #c084fc; font-weight: 700;">Cyber Demon</span>');
              res = res.replace(/Thor/g, '<span style="color: #c084fc; font-weight: 700;">Thor</span>');
              res = res.replace(/Grand Beast/g, '<span style="color: #c084fc; font-weight: 700;">Grand Beast</span>');
              res = res.replace(/Spirit Keeper/g, '<span style="color: #c084fc; font-weight: 700;">Spirit Keeper</span>');
              res = res.replace(/Horang/g, '<span style="color: #c084fc; font-weight: 700;">Horang</span>');
              res = res.replace(/Cyber Fuel/g, '<span style="color: #c084fc; font-weight: 700;">Cyber Fuel</span>');
              res = res.replace(/Star Shooter/g, '<span style="color: #c084fc; font-weight: 700;">Star Shooter</span>');
              res = res.replace(/Heart of Hope/g, '<span style="color: #c084fc; font-weight: 700;">Heart of Hope</span>');
              res = res.replace(/Divine Druid/g, '<span style="color: #c084fc; font-weight: 700;">Divine Druid</span>');
              res = res.replace(/Hop Online!/g, '<span style="color: #c084fc; font-weight: 700;">Hop Online!</span>');
			  res = res.replace(/Sumi-ichimonji/g, '<span style="color: #c084fc; font-weight: 700;">Sumi-ichimonji</span>');
              // Blue
              res = res.replace(/D\.VA/g, '<span style="color: #60a5fa; font-weight: 700;">D.VA</span>');
              // Gold
              res = res.replace(/Golden/g, '<span style="color: #facc15; font-weight: 700;">Golden</span>');
              res = res.replace(/OW1 - Season/g, '<span style="color: #facc15; font-weight: 700;">OW1 - Season</span>');
              res = res.replace(/Competitor/g, '<span style="color: #facc15; font-weight: 700;">Competitor</span>');
              res = res.replace(
                  /Edition\s*\((2016|2017|2018|2019|2020)\)/g,
                  'Edition (<span style="color:#facc15;font-weight:700;">$1</span>)'
              );
              // Pink
              res = res.replace(/Los Muertos Weapon/g, '<span style="color: #F379F3; font-weight: 700;">Los Muertos Weapon</span>');
			  res = res.replace(/LE SSERAFIM/g, '<span style="color: #F379F3; font-weight: 700;">LE SSERAFIM</span>');
              res = res.replace(/Nerf Gelfire Pro Weapon/g, '<span style="color: #F379F3; font-weight: 700;">Nerf Gelfire Pro Weapon</span>');
              res = res.replace(/Hard Light Weapon/g, '<span style="color: #F379F3; font-weight: 700;">Hard Light Weapon</span>');
			  res = res.replace(/Japanese/g, '<span style="color: #F379F3; font-weight: 700;">Japanese</span>');
              res = res.replace(/Nerf Sungerang Weapon/g, '<span style="color: #F379F3; font-weight: 700;">Nerf Sungerang Weapon</span>');
              res = res.replace(/Ange de la Mort/g, '<span style="color: #F379F3; font-weight: 700;">Ange de la Mort</span>');
              res = res.replace(/Rose Gold/g, '<span style="color: #F379F3; font-weight: 700;">Rose Gold</span>');
              res = res.replace(/Thunder/g, '<span style="color: #F379F3; font-weight: 700;">Thunder</span>');
              res = res.replace(/Haroeris/g, '<span style="color: #F379F3; font-weight: 700;">Haroeris</span>');			  
              res = res.replace(/Midas/g, '<span style="color: #F379F3; font-weight: 700;">Midas</span>');
              res = res.replace(/Mythic Prisms/g, '<span style="color: #F379F3; font-weight: 700;">Mythic Prisms</span>');
			  res = res.replace(/Mayhem Biker/g, '<span style="color: #F379F3; font-weight: 700;">Mayhem Biker</span>');
              res = res.replace(/Good and Evil/g, '<span style="color: #F379F3; font-weight: 700;">Good and Evil</span>');
              res = res.replace(/OWL Tokens/g, '<span style="color: #F379F3; font-weight: 700;">OWL Tokens</span>');
			  res = res.replace(/Grandmaster/g, '<span style="color: #F379F3; font-weight: 700;">Grandmaster</span>');
              res = res.replace(/Master/g, '<span style="color: #F379F3; font-weight: 700;">Master</span>');
              res = res.replace(/Luchador/g, '<span style="color: #F379F3; font-weight: 700;">Luchador</span>');
              res = res.replace(/All-Stars/g, '<span style="color: #F379F3; font-weight: 700;">All-Stars</span>');
              res = res.replace(/Comic Book/g, '<span style="color: #F379F3; font-weight: 700;">Comic Book</span>');
              res = res.replace(/Pink/g, '<span style="color: #F379F3; font-weight: 700;">Pink</span>');
              res = res.replace(/Noire/g, '<span style="color: #F379F3; font-weight: 700;">Noire</span>');
              res = res.replace(/Endorsement Level 4/g, '<span style="color: #F379F3; font-weight: 700;">Endorsement Level 4</span>');
              res = res.replace(/Endorsement Level 5/g, '<span style="color: #F379F3; font-weight: 800;">Endorsement Level 5</span>');
              res = res.replace(/Brick/g, '<span style="color: #f472b6; font-weight: 700;">Brick</span>');
              // Green
              res = res.replace(/JADE/g, '<span style="color: #4ade80; font-weight: 700;">JADE</span>');
              res = res.replace(/Endorsement Level 2/g, '<span style="color: #00ff7f; font-weight: 700;">Endorsement Level 2</span>');
              res = res.replace(/Endorsement Level 3/g, '<span style="color: #00ff7f; font-weight: 700;">Endorsement Level 3</span>');
              res = res.replace(/DPS Main/g, '<span style="color: #4ade80; font-weight: 700;">DPS Main</span>');
              res = res.replace(/Sup Main/g, '<span style="color: #4ade80; font-weight: 700;">Sup Main</span>');
              res = res.replace(/Support Main/g, '<span style="color: #4ade80; font-weight: 700;">Sup Main</span>');
              res = res.replace(/Tank Main/g, '<span style="color: #4ade80; font-weight: 700;">Tank Main</span>');

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

            function highlightBalanceText(text) {
              if (!text) return '';
              let res = escapeAccountTextWithBreaks(text);

              // Playtime greater than 300H: yellow
              res = res.replace(/(\d[\d,]*)\s*H\b/gi, (match, rawNum) => {
                const num = Number(String(rawNum).replace(/,/g, ''));
                return num > 300 ? `<span class="ac-highlight-yellow">${match}</span>` : match;
              });

              // Games greater than 1000G: yellow
              res = res.replace(/(\d[\d,]*)\s*G\b/gi, (match, rawNum) => {
                const num = Number(String(rawNum).replace(/,/g, ''));
                return num > 1000 ? `<span class="ac-highlight-yellow">${match}</span>` : match;
              });

              // Coins / Overwatch Coins greater than 800: yellow
              res = res.replace(/(\d[\d,]*)\s*(?:Overwatch\s*)?Coins\b/gi, (match, rawNum) => {
                const num = Number(String(rawNum).replace(/,/g, ''));
                return num > 800 ? `<span class="ac-highlight-yellow">${match}</span>` : match;
              });
              // Any amount of Mythic Prisms: pink
              res = res.replace(/\b\d[\d,]*\s+Mythic\s+Prisms\b/gi, (match) => {
                return `<span class="ac-highlight-mythic-prisms">${match}</span>`;
              });

              // Credits greater than 10000: yellow
              res = res.replace(/(\d[\d,]*)\s*Credits\b/gi, (match, rawNum) => {
                const num = Number(String(rawNum).replace(/,/g, ''));
                return num > 10000 ? `<span class="ac-highlight-yellow">${match}</span>` : match;
              });

              // Competitive points variants greater than 3000: yellow + bold
              res = res.replace(
                /(\d[\d,]*)\s*((?:Legacy\s*)?(?:Competitive|Comp)\s*Points)\b/gi,
                (match, rawNum, label) => {
                  const num = Number(String(rawNum).replace(/,/g, ''));
                  return num > 3000 ? `<span class="ac-highlight-yellow">${rawNum} ${label}</span>` : match;
                }
              );

              // Apply the same animated Gold/Jade/Galactic effect when this
              // description appears in the balance block instead of weapons.
              res = res.replace(
                specialWeaponChoicePattern,
                match => `<span class="ac-special-weapon-choice">${match}</span>`
              );

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

              versions.forEach(label => tags.unshift({
                text: label,
                className: `game-version game-version-${label.toLowerCase()}`
              }));
              if (isStacked) tags.push({ text: 'Stacked Account', className: 'stacked' });

              const mainText = normalized ? `Lv. ${normalized}` : 'Lv. —';
              return {
                main: escapeAccountText(mainText),
                title: escapeAccountText(original || mainText),
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
            const heroSequencePattern = `${heroAliasPattern}(?:\\s*${heroSeparatorPattern}\\s*${heroAliasPattern})*\\s*(?:\\([^)]*\\))?`;
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
                  protectedMatches.push({ match, className: rule.className });
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
              if (/\bPink\s+Mercy\b/i.test(item)) return styleSkinName(item);

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
              if (categoryMatch && /(?:skins?|owcs|owl|owwc|mvp|all[- ]?stars?|team|decennium)/i.test(categoryMatch[1])) {
                category = categoryMatch[1].trim();
                body = categoryMatch[2].trim();
              }

              const styledItems = body
                .split(/\s*,\s*/)
                .map(styleSkinItem)
                .filter(Boolean)
                .join('<span aria-hidden="true">, </span>');

              const categoryHtml = category
                ? `<span class="ac-skin-category">${escapeAccountText(category)}:</span> `
                : '';
              return `<span class="ac-highlight-line ac-skin-line"><span class="ac-highlight-icon">✨</span>${categoryHtml}${styledItems}</span>`;
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
            const compactRank = String(rank || '').replace(/<br\s*\/?\s*>/gi, ' • ');
            const rankFact = compactRank ? highlightRankText(compactRank) : '—';
            const prismsFact = mythicPrismsAmount > 0
              ? `<div class="ac-keyfact is-premium"><span class="ac-keyfact-label">${ui.mythicPrisms}</span><span class="ac-keyfact-value ac-highlight-mythic-prisms">${numberFormatter.format(mythicPrismsAmount)}</span></div>`
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
                <div class="ac-resource-strip">
                  <div class="ac-resource-item">
                    <span class="ac-resource-label">${ui.credits}</span>
                    <span class="ac-resource-value">${numberFormatter.format(creditsAmount)}</span>
                  </div>
                  <div class="ac-resource-item">
                    <span class="ac-resource-label">${ui.coins}</span>
                    <span class="ac-resource-value">${numberFormatter.format(coinsAmount)}</span>
                  </div>
                  <div class="ac-resource-item">
                    <span class="ac-resource-label">${ui.playtime}</span>
                    <span class="ac-resource-value">${numberFormatter.format(playtimeAmount)}H</span>
                  </div>
                </div>
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
              <div class="ac-details">
                ${balance ? `<div class="ac-detail"><strong>${ui.balancePlaytime}:</strong><br>${highlightBalanceText(balance)}</div>` : ''}
                ${weapons ? `<div class="ac-detail"><strong>${ui.weapons}:</strong><br>${applyColorMap(weapons)}</div>` : ''}
              </div>
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
          if (grid) grid.innerHTML = `<div class="accounts-empty">${ui.loadError}</div>`;
        }
      }

      document.getElementById('accountSearch')?.addEventListener('input', renderAccounts);
      document.getElementById('accountTypeFilter')?.addEventListener('change', renderAccounts);
      document.getElementById('accountStatusFilter')?.addEventListener('change', renderAccounts);
      document.getElementById('accountPriceFilter')?.addEventListener('change', renderAccounts);
      document.getElementById('accountNameChangeFilter')?.addEventListener('change', renderAccounts);
      document.getElementById('accountTop500Filter')?.addEventListener('change', renderAccounts);
      document.getElementById('accountSort')?.addEventListener('change', renderAccounts);
      document.getElementById('resetAccountFilters')?.addEventListener('click', resetAccountFilters);
      document.getElementById('activeAccountFilters')?.addEventListener('click', (event) => {
        const chip = event.target.closest('[data-clear-filter]');
        if (chip) clearAccountFilter(chip.dataset.clearFilter);
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
      sheet: "https://docs.google.com/spreadsheets/d/1s9sxHj3EVNLUlRb3li9XV8QKBxr2jI0cr12tTgvnB3s/edit?gid=327074105#gid=327074105",
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
          "📄 Open the listings and filter by price, rank, or skins.",
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
        faq1:"How often is the list updated? — The Google Sheet is the source of truth, and sold accounts are marked quickly.",
        faq2:"Payment methods? — Credit card, PayPal, crypto, and selected gift cards. Confirm availability and fees on Discord.",
        faq3:"How fast is delivery? — Most orders are delivered within 5 minutes after payment. Rare top-tier accounts may require additional preparation time.",
        faq4:"Are the accounts safe? — All accounts come from real players, not mass-produced scripts or studios. Each has normal usage history with no restrictions.",
        faq5:"Authenticator? — A private tool for Battle.net Authenticator. Use the Authenticator, paste your Private Key from the account info you received, then copy the code into the Battle.net app to verify.",
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
        servicesDesc:"Consultez l’inventaire en temps réel sur Google Sheet, puis commandez via Discord en envoyant l’ID ou une capture.",
        servicesList:[
          "📄 Ouvrez la liste et filtrez (prix, rang, skins).",
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
        faq1:"Mise à jour de la liste ? — Google Sheet fait foi, et les comptes vendus sont marqués rapidement.",
        faq2:"Paiement ? — Carte, PayPal, crypto et certaines cartes cadeaux. Disponibilité/frais à confirmer sur Discord.",
        faq3:"Délai de livraison ? — La plupart des commandes sont livrées sous 5 minutes après paiement. Les comptes haut de gamme peuvent nécessiter un délai supplémentaire.",
        faq4:"Les comptes sont-ils sûrs ? — Tous les comptes proviennent de vrais joueurs, pas de scripts ou productions de masse. Historique normal, sans restriction.",
        faq5:"Authenticator ? — Outil privé pour Battle.net Authenticator. Utilisez la page Authenticator, collez votre Private Key, puis copiez le code dans l’app Battle.net pour valider.",
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
        servicesDesc:"Inventar live im Google Sheet ansehen und dann per Discord bestellen (ID oder Screenshot senden).",
        servicesList:[
          "📄 Listings öffnen und nach Preis, Rang oder Skins filtern.",
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
        faq1:"Wie oft wird aktualisiert? — Google Sheet ist maßgeblich, verkaufte Accounts werden schnell markiert.",
        faq2:"Zahlung? — Karte, PayPal, Krypto und ausgewählte Geschenkkarten. Verfügbarkeit/Gebühren auf Discord bestätigen.",
        faq3:"Wie schnell erfolgt die Lieferung? — Die meisten Bestellungen werden innerhalb von 5 Minuten nach Zahlung geliefert. Seltene High-Tier-Accounts können etwas mehr Zeit benötigen.",
        faq4:"Sind die Accounts sicher? — Alle Accounts stammen von echten Spielern, nicht aus Script- oder Massenproduktion. Normale Nutzungshistorie, keine Einschränkungen.",
        faq5:"Authenticator? — Privates Tool für Battle.net Authenticator. Öffne die Authenticator-Seite, füge den Private Key ein und kopiere den Code in die Battle.net App zur Verifizierung.",
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
        servicesDesc:"تصفّح المخزون المباشر في Google Sheet ثم اطلب عبر Discord بإرسال ID أو لقطة شاشة.",
        servicesList:[
          "📄 افتح القائمة وفلتر حسب السعر/الرتبة/الهيئات.",
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
        faq1:"كم يتم التحديث؟ — Google Sheet هو المرجع ويتم تمييز الحسابات المباعة بسرعة.",
        faq2:"طرق الدفع؟ — بطاقة، PayPal، عملات رقمية وبعض بطاقات الهدايا. التأكيد على Discord.",
        faq3:"ما سرعة التسليم؟ — يتم تسليم معظم الطلبات خلال 5 دقائق بعد الدفع. قد تتطلب الحسابات المميزة وقتًا إضافيًا للتحضير.",
        faq4:"هل الحسابات آمنة؟ — جميع الحسابات من لاعبين حقيقيين، وليست ناتجة عن سكربتات أو إنتاج جماعي. سجل استخدام طبيعي بدون قيود.",
        faq5:"Authenticator؟ — أداة خاصة لـ Battle.net Authenticator. استخدم صفحة Authenticator، ألصق Private Key ثم انسخ الرمز إلى تطبيق Battle.net للتحقق.",
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
        servicesDesc:"Google Sheet 实时展示库存；通过 Discord 发送账号 ID 或截图即可确认并购买。",
        servicesList:[
          "📄 打开列表，按价格/段位/皮肤筛选。",
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
        faq1:"列表多久更新？— 以 Google Sheet 为准，售出会尽快标记。",
        faq2:"支持什么支付方式？— 信用卡、PayPal、虚拟货币及部分礼品卡；可用性与手续费请 Discord 确认。",
        faq3:"多久交付？— 大部分订单在付款后 5 分钟内完成交付；少数顶级账号可能需要额外整理时间。",
        faq4:"账号是否安全？— 所有账号均来自真实玩家，并非脚本或工作室批量生产；均为正常使用记录，无任何限制。",
        faq5:"Authenticator 是什么？— 这是 Battle.net Authenticator 的私人工具。打开 Authenticator 页面，粘贴你收到的账号信息中的 Private Key，然后把验证码复制到 Battle.net App 完成验证。",
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
        showMore:"Show more skins", showLess:"Show fewer skins", playtime:"Playtime", credits:"Credits", coins:"Coins",
        mythicPrisms:"Mythic Prisms",
        searchPlaceholder:"Search account keywords, e.g. Cyber Demon",
        searchAria:"Search account keywords",
        typeAria:"Filter game version",
        typeOptions:["All versions", "OW1", "OW2"],
        statusAria:"Filter availability status", statusOptions:["In stock", "All statuses", "Pending", "Sold"],
        priceAria:"Filter price range", priceOptions:["All prices", "Under $30", "$30–$100", "Over $100"],
        nameChangeAria:"Filter free name change", nameChangeOptions:["Free rename: All", "Free rename: Yes", "Free rename: No"],
        top500Aria:"Filter TOP500 eligibility", top500Options:["TOP500 Eligible: All", "TOP500 Eligible: Yes", "TOP500 Eligible: No"],
        sortAria:"Sort accounts",
        sortGroups:["Price", "Account progress", "Resources"],
        sortOptions:["Recommended", "Price: Low to High", "Price: High to Low", "Level: High to Low", "Level: Low to High", "Playtime: High to Low", "Playtime: Low to High", "Coins: High to Low", "Coins: Low to High", "Credits: High to Low", "Credits: Low to High"],
        results:"{shown} / {total} accounts",
        empty:"No accounts match the current search and filters.",
        loadError:"Unable to load account inventory.",
        rank:"Rank", price:"Price", level:"Level", statusLabel:"Status", balancePlaytime:"Balance & Playtime", weapons:"Weapons",
        freeRename:"Free rename", top500Eligible:"TOP500 Eligible",
        yes:"Yes", no:"No", viewSkins:"View Skins", buyNow:"Buy Now", copyId:"Copy ID", copied:"Copied",
        missingScreenshot:"The screenshot link is missing from this account.",
        premiumAccount:"Premium Account", statusInStock:"In Stock", statusSold:"Sold", statusPending:"Pending"
      },
      fr: {
        toolsAria:"Contrôles de l’inventaire des comptes",
        filterSort:"Filtres et tri", filterSubtitle:"Affinez les résultats de l’inventaire", resetFilters:"Réinitialiser", closeFilters:"Fermer les filtres",
        activeFilters:"Filtres actifs", clearFilter:"Retirer ce filtre", searchLabel:"Recherche", applyFilters:"Afficher {count} comptes",
        showMore:"Afficher plus de skins", showLess:"Afficher moins de skins", playtime:"Temps de jeu", credits:"Crédits", coins:"Coins",
        mythicPrisms:"Prismes mythiques",
        searchPlaceholder:"Rechercher un mot-clé, ex. Cyber Demon",
        searchAria:"Rechercher dans les comptes",
        typeAria:"Filtrer la version du jeu",
        typeOptions:["Toutes les versions", "OW1", "OW2"],
        statusAria:"Filtrer la disponibilité", statusOptions:["En stock", "Tous les statuts", "En attente", "Vendu"],
        priceAria:"Filtrer la tranche de prix", priceOptions:["Tous les prix", "Moins de 30 $", "30–100 $", "Plus de 100 $"],
        nameChangeAria:"Filtrer le renommage gratuit", nameChangeOptions:["Renommage gratuit : Tous", "Renommage gratuit : Oui", "Renommage gratuit : Non"],
        top500Aria:"Filtrer l’éligibilité TOP500", top500Options:["Éligible TOP500 : Tous", "Éligible TOP500 : Oui", "Éligible TOP500 : Non"],
        sortAria:"Trier les comptes",
        sortGroups:["Prix", "Progression du compte", "Ressources"],
        sortOptions:["Recommandé", "Prix : croissant", "Prix : décroissant", "Niveau : décroissant", "Niveau : croissant", "Temps de jeu : décroissant", "Temps de jeu : croissant", "Coins : décroissant", "Coins : croissant", "Crédits : décroissant", "Crédits : croissant"],
        results:"{shown} / {total} comptes",
        empty:"Aucun compte ne correspond à la recherche et aux filtres actuels.",
        loadError:"Impossible de charger l’inventaire des comptes.",
        rank:"Rang", price:"Prix", level:"Niveau", statusLabel:"Statut", balancePlaytime:"Solde et temps de jeu", weapons:"Armes",
        freeRename:"Renommage gratuit", top500Eligible:"Éligible TOP500",
        yes:"Oui", no:"Non", viewSkins:"Voir les skins", buyNow:"Acheter", copyId:"Copier l’ID", copied:"Copié",
        missingScreenshot:"Le lien de capture est absent pour ce compte.",
        premiumAccount:"Compte Premium", statusInStock:"En stock", statusSold:"Vendu", statusPending:"En attente"
      },
      de: {
        toolsAria:"Steuerung des Account-Inventars",
        filterSort:"Filtern & sortieren", filterSubtitle:"Inventarergebnisse eingrenzen", resetFilters:"Filter zurücksetzen", closeFilters:"Filter schließen",
        activeFilters:"Aktive Filter", clearFilter:"Diesen Filter entfernen", searchLabel:"Suche", applyFilters:"{count} Accounts anzeigen",
        showMore:"Mehr Skins anzeigen", showLess:"Weniger Skins anzeigen", playtime:"Spielzeit", credits:"Credits", coins:"Coins",
        mythicPrisms:"Mythische Prismen",
        searchPlaceholder:"Accounts durchsuchen, z. B. Cyber Demon",
        searchAria:"Accounts nach Stichwort durchsuchen",
        typeAria:"Spielversion filtern",
        typeOptions:["Alle Versionen", "OW1", "OW2"],
        statusAria:"Verfügbarkeit filtern", statusOptions:["Auf Lager", "Alle Status", "Ausstehend", "Verkauft"],
        priceAria:"Preisspanne filtern", priceOptions:["Alle Preise", "Unter 30 $", "30–100 $", "Über 100 $"],
        nameChangeAria:"Kostenlose Umbenennung filtern", nameChangeOptions:["Kostenlose Umbenennung: Alle", "Kostenlose Umbenennung: Ja", "Kostenlose Umbenennung: Nein"],
        top500Aria:"TOP500-Berechtigung filtern", top500Options:["TOP500-berechtigt: Alle", "TOP500-berechtigt: Ja", "TOP500-berechtigt: Nein"],
        sortAria:"Accounts sortieren",
        sortGroups:["Preis", "Account-Fortschritt", "Ressourcen"],
        sortOptions:["Empfohlen", "Preis: aufsteigend", "Preis: absteigend", "Level: absteigend", "Level: aufsteigend", "Spielzeit: absteigend", "Spielzeit: aufsteigend", "Coins: absteigend", "Coins: aufsteigend", "Credits: absteigend", "Credits: aufsteigend"],
        results:"{shown} / {total} Accounts",
        empty:"Keine Accounts entsprechen der aktuellen Suche und den Filtern.",
        loadError:"Das Account-Inventar konnte nicht geladen werden.",
        rank:"Rang", price:"Preis", level:"Level", statusLabel:"Status", balancePlaytime:"Guthaben & Spielzeit", weapons:"Waffen",
        freeRename:"Kostenlose Umbenennung", top500Eligible:"TOP500-berechtigt",
        yes:"Ja", no:"Nein", viewSkins:"Skins ansehen", buyNow:"Jetzt kaufen", copyId:"ID kopieren", copied:"Kopiert",
        missingScreenshot:"Für diesen Account fehlt der Screenshot-Link.",
        premiumAccount:"Premium-Account", statusInStock:"Auf Lager", statusSold:"Verkauft", statusPending:"Ausstehend"
      },
      ar: {
        toolsAria:"أدوات التحكم في مخزون الحسابات",
        filterSort:"تصفية وترتيب", filterSubtitle:"تخصيص نتائج المخزون", resetFilters:"إعادة ضبط الفلاتر", closeFilters:"إغلاق الفلاتر",
        activeFilters:"الفلاتر النشطة", clearFilter:"إزالة هذا الفلتر", searchLabel:"البحث", applyFilters:"عرض {count} حساب",
        showMore:"عرض المزيد من السكنات", showLess:"عرض سكنات أقل", playtime:"وقت اللعب", credits:"Credits", coins:"Coins",
        mythicPrisms:"Mythic Prisms",
        searchPlaceholder:"ابحث بكلمة مفتاحية، مثل Cyber Demon",
        searchAria:"البحث في الحسابات بالكلمات المفتاحية",
        typeAria:"تصفية إصدار اللعبة",
        typeOptions:["كل الإصدارات", "OW1", "OW2"],
        statusAria:"تصفية حالة التوفر", statusOptions:["متوفر", "كل الحالات", "قيد الانتظار", "مباع"],
        priceAria:"تصفية نطاق السعر", priceOptions:["كل الأسعار", "أقل من 30$", "30$–100$", "أكثر من 100$"],
        nameChangeAria:"تصفية تغيير الاسم المجاني", nameChangeOptions:["تغيير اسم مجاني: الكل", "تغيير اسم مجاني: نعم", "تغيير اسم مجاني: لا"],
        top500Aria:"تصفية أهلية TOP500", top500Options:["مؤهل TOP500: الكل", "مؤهل TOP500: نعم", "مؤهل TOP500: لا"],
        sortAria:"ترتيب الحسابات",
        sortGroups:["السعر", "تقدم الحساب", "الموارد"],
        sortOptions:["موصى به", "السعر: تصاعدي", "السعر: تنازلي", "المستوى: تنازلي", "المستوى: تصاعدي", "وقت اللعب: تنازلي", "وقت اللعب: تصاعدي", "Coins: تنازلي", "Coins: تصاعدي", "Credits: تنازلي", "Credits: تصاعدي"],
        results:"{shown} / {total} حساب",
        empty:"لا توجد حسابات تطابق البحث والفلاتر الحالية.",
        loadError:"تعذر تحميل مخزون الحسابات.",
        rank:"الرتبة", price:"السعر", level:"المستوى", statusLabel:"الحالة", balancePlaytime:"الرصيد ووقت اللعب", weapons:"الأسلحة",
        freeRename:"تغيير اسم مجاني", top500Eligible:"مؤهل TOP500",
        yes:"نعم", no:"لا", viewSkins:"عرض السكنات", buyNow:"اشترِ الآن", copyId:"نسخ ID", copied:"تم النسخ",
        missingScreenshot:"رابط الصور غير متوفر لهذا الحساب.",
        premiumAccount:"حساب مميز", statusInStock:"متوفر", statusSold:"مباع", statusPending:"قيد الانتظار"
      },
      zh: {
        toolsAria:"账号库存筛选与排序",
        filterSort:"筛选与排序", filterSubtitle:"快速缩小库存范围", resetFilters:"清除筛选", closeFilters:"关闭筛选",
        activeFilters:"当前筛选", clearFilter:"移除此筛选条件", searchLabel:"检索", applyFilters:"查看 {count} 个账号",
        showMore:"展开更多皮肤", showLess:"收起皮肤详情", playtime:"游戏时长", credits:"Credits", coins:"Coins",
        mythicPrisms:"神话棱晶",
        searchPlaceholder:"检索账号关键词，例如 Cyber Demon",
        searchAria:"检索账号关键词",
        typeAria:"筛选游戏版本",
        typeOptions:["全部版本", "OW1", "OW2"],
        statusAria:"筛选库存状态", statusOptions:["有库存", "全部状态", "待处理", "已售出"],
        priceAria:"筛选价格区间", priceOptions:["全部价格", "低于 $30", "$30–$100", "高于 $100"],
        nameChangeAria:"筛选免费改名", nameChangeOptions:["免费改名：全部", "免费改名：有", "免费改名：无"],
        top500Aria:"筛选 TOP500 资格", top500Options:["TOP500 资格：全部", "TOP500 资格：有", "TOP500 资格：无"],
        sortAria:"账号排序",
        sortGroups:["价格", "账号进度", "资源"],
        sortOptions:["推荐排序", "价格：从低到高", "价格：从高到低", "等级：从高到低", "等级：从低到高", "游戏时长：从多到少", "游戏时长：从少到多", "Coins：从多到少", "Coins：从少到多", "Credits：从多到少", "Credits：从少到多"],
        results:"显示 {shown} / 共 {total} 个账号",
        empty:"没有符合当前检索及筛选条件的账号。",
        loadError:"账号库存加载失败。",
        rank:"段位", price:"价格", level:"等级", statusLabel:"状态", balancePlaytime:"余额与游戏时长", weapons:"武器",
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

    function detectLang(){
      const urlLang = new URLSearchParams(window.location.search).get("lang");
      if (urlLang && i18n[urlLang]) return urlLang;

      const saved = localStorage.getItem(LANG_KEY);
      if (saved && i18n[saved]) return saved;

      const nav = (navigator.language || "en").toLowerCase();
      if (nav.startsWith("zh")) return "zh";
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
      const parts = String(value || '').split(/\s*—\s*/);
      const summary = item.querySelector('summary');
      const answer = item.querySelector('.faq-answer');
      if (summary) summary.textContent = parts.shift() || '';
      if (answer) answer.textContent = parts.join(' — ').trim();
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
      const accountTop500Filter = document.getElementById('accountTop500Filter');
      const accountSort = document.getElementById('accountSort');
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
      if (accountTop500Filter) accountTop500Filter.setAttribute('aria-label', accountUi.top500Aria);
      if (accountSort) accountSort.setAttribute('aria-label', accountUi.sortAria);
      setSelectOptionText('accountTypeFilter', accountUi.typeOptions);
      setSelectOptionText('accountStatusFilter', accountUi.statusOptions);
      setSelectOptionText('accountPriceFilter', accountUi.priceOptions);
      setSelectOptionText('accountNameChangeFilter', accountUi.nameChangeOptions);
      setSelectOptionText('accountTop500Filter', accountUi.top500Options);
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
