(() => {
  'use strict';

  const form = document.getElementById('accountLookupForm');
  const input = document.getElementById('accountLookupId');
  const status = document.getElementById('accountLookupStatus');
  const detailsUrl = new URL(document.querySelector('meta[name="account-details-data"]')?.content || '../account_details.json', document.baseURI);
  let revision = 0;
  let statusState = null;
  const t = (message, values) => window.DetailsI18n.t(message, values);

  function showStatus(message, error = false, values = {}) {
    statusState = { message, error, values };
    status.textContent = t(message, values);
    status.classList.toggle('error', error);
  }

  function selectedId() {
    try { return decodeURIComponent(window.location.hash.slice(1)); }
    catch { return ''; }
  }

  async function loadSelectedAccount() {
    const currentRevision = ++revision;
    const id = selectedId();
    input.value = id;
    document.body.classList.remove('has-account');
    window.HeroGallery.clearSnapshot();
    if (!id) {
      showStatus(window.location.hash ? 'Invalid stock ID. Please try again.' : 'Enter a stock ID or select View Details from account stock.', Boolean(window.location.hash));
      return;
    }
    if (!/^[1-9]\d{0,9}$/.test(id)) {
      showStatus('Enter a valid stock ID, such as 18.', true);
      return;
    }

    showStatus('Looking up account #{id}…', false, { id });
    try {
      const response = await fetch(detailsUrl, { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error('data-unavailable');
      const documentData = await response.json();
      if (!documentData || ![1, 2].includes(documentData.schemaVersion) || !documentData.accounts || typeof documentData.accounts !== 'object' || Array.isArray(documentData.accounts)) throw new Error('invalid-data');
      if (currentRevision !== revision) return;
      let entry = Object.prototype.hasOwnProperty.call(documentData.accounts, id) ? documentData.accounts[id] : null;
      if (!entry) {
        showStatus('No collected details are available for account #{id}. Check the stock ID or try again later.', true, { id });
        return;
      }
      if (entry.file !== undefined) {
        if (entry.file !== `acc_details/data/${id}.json`) throw new Error('invalid-path');
        const snapshotResponse = await fetch(new URL(entry.file, detailsUrl), { credentials: 'same-origin', cache: 'no-store' });
        if (!snapshotResponse.ok) throw new Error('data-unavailable');
        entry = await snapshotResponse.json();
        if (currentRevision !== revision) return;
      }
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('invalid-data');
      if (entry.accountId !== undefined && String(entry.accountId) !== id) throw new Error('id-mismatch');
      window.HeroGallery.loadSnapshot({ ...entry, accountId: id });
      document.body.classList.add('has-account');
      showStatus('Account #{id} loaded. Only recorded details are shown.', false, { id });
      // Stock metadata is optional: a stock outage must not hide collected details.
      try {
        const stockResponse = await fetch(new URL('accounts.json', detailsUrl), { credentials: 'same-origin', cache: 'no-store' });
        if (!stockResponse.ok) return;
        const stockData = await stockResponse.json();
        if (currentRevision !== revision) return;
        const rows = Array.isArray(stockData) ? stockData : stockData?.accounts;
        const matches = Array.isArray(rows) ? rows.filter(row => row && String(row.id) === id) : [];
        window.HeroGallery.setStockAccount?.(matches.length === 1 ? matches[0] : null);
      } catch { /* The snapshot remains usable without optional stock labels. */ }
    } catch (error) {
      if (currentRevision !== revision) return;
      console.error('Account details load failed:', error);
      showStatus(error.message === 'data-unavailable' ? 'Account data is temporarily unavailable. Please try again later.' : 'Account data is invalid. Please contact the store.', true);
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const id = input.value.trim().replace(/^#/, '');
    if (!/^[1-9]\d{0,9}$/.test(id)) {
      showStatus('Enter a valid stock ID, such as 18.', true);
      return;
    }
    if (window.location.hash === `#${id}`) loadSelectedAccount();
    else window.location.hash = id;
  });
  window.addEventListener('hashchange', loadSelectedAccount);
  window.addEventListener('roshine:language-changed', () => {
    if (statusState) showStatus(statusState.message, statusState.error, statusState.values);
  });
  loadSelectedAccount();
})();
