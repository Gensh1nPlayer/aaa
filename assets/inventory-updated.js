/*
 * Integration (after successful inventory parsing):
 *   void window.RoshineInventoryUpdated.update({
 *     sourceText, lastModified: response.headers.get('Last-Modified')
 *   });
 * Pass the unmodified response.text(), not reserialized JSON. Place
 * #accountsLastUpdatedLabel and <time id="accountsLastUpdatedValue"> before
 * the planned countdown. This module does not create/reorder page elements.
 * update() resolves {status, source, timestamp, reason}; render() refreshes UI.
 * Visible time is YYYY-MM-DD HH:mm:ss UTC; datetime and result retain ISO Z.
 * The time element exposes data-source: github-commit, http-last-modified,
 * or unknown. This attribute describes provenance, not a signature check.
 * A document lang mutation also refreshes all copy without network requests.
 *
 * Production proof is exact decoded text equality with accounts.json at the
 * latest file commit. The timestamp is Git committer time, not filesystem edit
 * time, sale time or deployment time. A delayed deployment may remain unknown.
 * Local HTTP metadata proves only the server's file modification timestamp.
 * No timestamp is synthesized from visit time. Date.now() only rejects futures.
 * GitHub schema: https://docs.github.com/en/rest/commits/commits#list-commits
 */
(function (root) {
  'use strict';

  const copy = {
    en: { inventory: 'Inventory last updated', file: 'File last modified', unknown: 'Unknown',
      github: 'Git committer time for accounts.json; its content exactly matches the loaded inventory. This is not a deployment or sale timestamp.',
      http: 'Last-Modified from the local accounts.json response; server file metadata, not a verified inventory edit time.',
      unavailable: 'The loaded inventory modification time could not be verified. Deployment and visit times are not used.' },
    fr: { inventory: 'Dernière mise à jour du stock', file: 'Dernière modification du fichier', unknown: 'Inconnue',
      github: 'Date du commit Git de accounts.json dont le contenu correspond exactement au stock chargé. Ce n’est pas la date de déploiement ni de vente.',
      http: 'En-tête Last-Modified de la réponse locale accounts.json : métadonnée du fichier serveur, sans vérification de la modification du stock.',
      unavailable: 'La date de modification du stock chargé n’a pas pu être vérifiée. Les dates de déploiement et de visite ne sont pas utilisées.' },
    de: { inventory: 'Bestand zuletzt aktualisiert', file: 'Datei zuletzt geändert', unknown: 'Unbekannt',
      github: 'Git-Committer-Zeit für accounts.json; der Inhalt entspricht exakt dem geladenen Bestand. Kein Bereitstellungs- oder Verkaufszeitpunkt.',
      http: 'Last-Modified der lokalen accounts.json-Antwort: Dateimetadaten des Servers, kein verifizierter Zeitpunkt einer Bestandsänderung.',
      unavailable: 'Der Änderungszeitpunkt des geladenen Bestands konnte nicht verifiziert werden. Bereitstellungs- und Besuchszeiten werden nicht verwendet.' },
    ar: { inventory: 'آخر تحديث للمخزون', file: 'آخر تعديل للملف', unknown: 'غير معروف',
      github: 'وقت مُثبّت التغيير في Git لملف accounts.json؛ محتواه مطابق تمامًا للمخزون المحمّل. ليس وقت النشر أو البيع.',
      http: 'ترويسة Last-Modified من استجابة accounts.json المحلية؛ بيانات تعديل ملف الخادم وليست وقت تعديل مخزون تم التحقق منه.',
      unavailable: 'تعذر التحقق من وقت تعديل المخزون المحمّل. لا يُستخدم وقت النشر أو الزيارة.' },
    ja: { inventory: '在庫の最終更新', file: 'ファイルの最終変更', unknown: '不明',
      github: '読み込んだ在庫と内容が完全に一致する accounts.json の Git コミッター日時です。デプロイや販売の日時ではありません。',
      http: 'ローカルの accounts.json レスポンスの Last-Modified です。サーバーのファイル情報であり、在庫編集日時は検証されていません。',
      unavailable: '読み込んだ在庫の変更日時を検証できませんでした。デプロイ日時や閲覧日時は使用しません。' }
  };
  let generation = 0;
  const unknown = reason => Object.freeze({ status: 'unknown', source: null, timestamp: null, reason });
  let state = unknown('not-loaded');

  function render() {
    const text = copy[document.documentElement.lang] || copy.en;
    const value = document.getElementById('accountsLastUpdatedValue');
    const label = document.getElementById('accountsLastUpdatedLabel');
    const local = state.source === 'http-last-modified';
    const explanation = state.status !== 'known' ? text.unavailable : local ? text.http : text.github;
    if (label) {
      label.textContent = local ? text.file : text.inventory;
      label.setAttribute('title', explanation);
    }
    if (value) {
      value.textContent = state.timestamp
        ? state.timestamp.replace('T', ' ').replace(/Z$/, ' UTC')
        : text.unknown;
      value.setAttribute('data-source', state.source || 'unknown');
      value.setAttribute('title', explanation);
      value.setAttribute('dir', 'ltr');
      if (state.timestamp) value.setAttribute('datetime', state.timestamp);
      else value.removeAttribute('datetime');
    }
    return state;
  }

  function timestamp(raw, http) {
    if (typeof raw !== 'string') return null;
    // Round trips reject Date.parse normalization (e.g. February 30), wrong
    // weekdays, ambiguous local times, and arbitrary numeric date strings.
    const format = http
      ? /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/
      : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    if (!format.test(raw)) return null;
    const milliseconds = Date.parse(raw);
    if (!Number.isFinite(milliseconds) || milliseconds < 0 || milliseconds > Date.now()) return null;
    const date = new Date(milliseconds);
    const iso = date.toISOString().replace('.000Z', 'Z');
    if ((http ? date.toUTCString() : iso) !== raw) return null;
    return iso;
  }

  async function verify(sourceText) {
    const controller = new AbortController();
    const timer = root.setTimeout(() => controller.abort(), 8000);
    const options = { cache: 'no-store', credentials: 'omit', signal: controller.signal };
    try {
      const response = await root.fetch('https://api.github.com/repos/Gensh1nPlayer/aaa/commits?path=accounts.json&per_page=1', {
        ...options, headers: { Accept: 'application/vnd.github+json' }
      });
      if (!response.ok) return unknown('github-unavailable');
      const commits = await response.json();
      const latest = Array.isArray(commits) ? commits[0] : null;
      const date = timestamp(latest?.commit?.committer?.date, false);
      if (!date || !/^[a-f0-9]{40}$/i.test(latest?.sha || '')) return unknown('invalid-commit');
      const raw = await root.fetch(`https://raw.githubusercontent.com/Gensh1nPlayer/aaa/${latest.sha}/accounts.json`, options);
      if (!raw.ok) return unknown('github-unavailable');
      if (await raw.text() !== sourceText) return unknown('content-mismatch');
      return Object.freeze({ status: 'known', source: 'github-commit', timestamp: date, reason: null });
    } catch {
      return unknown('github-unavailable');
    } finally {
      root.clearTimeout(timer);
    }
  }

  async function update({ sourceText, lastModified } = {}) {
    const current = ++generation;
    state = unknown('verifying');
    render();
    let result = unknown('missing-source');
    if (typeof sourceText === 'string' && sourceText.length) {
      const hostname = root.location.hostname.toLowerCase();
      if (['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname)) {
        const date = timestamp(lastModified, true);
        result = date
          ? Object.freeze({ status: 'known', source: 'http-last-modified', timestamp: date, reason: null })
          : unknown('invalid-last-modified');
      } else {
        // All public hosts use the same proof, including custom/preview domains.
        // A Pages Last-Modified can change on deployment without an inventory edit.
        result = await verify(sourceText);
      }
    }
    if (current === generation) {
      state = result;
      render();
    }
    return result;
  }

  root.RoshineInventoryUpdated = Object.freeze({ update, render });
  if (root.MutationObserver) {
    new root.MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
})(window);
