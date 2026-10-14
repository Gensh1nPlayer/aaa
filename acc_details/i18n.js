(() => {
  'use strict';
  const languages = ['en', 'fr', 'de', 'ar', 'ja'];
  const entries = {
    'Skin images reference':['Les images proviennent de','Skin-Bilder stammen aus','صور المظاهر مأخوذة من','スキン画像の参照元：'],
    ', with additional entries from the':[', avec des ajouts du',', mit zusätzlichen Einträgen aus', '، مع عناصر إضافية من','、追加項目の参照元：'],
    'Weapon skin names and images reference':['Les noms et images des skins d’armes proviennent de','Namen und Bilder der Waffenskins stammen aus','أسماء وصور مظاهر الأسلحة مأخوذة من','武器スキンの名前と画像の参照元：'],
    '. Ownership comes only from the account snapshot.':['. La possession provient uniquement des données du compte.','. Besitzangaben stammen nur aus der Account-Erfassung.','。 بيانات الملكية تأتي فقط من سجل الحساب.','。所有情報はアカウントデータのみに基づきます。'],
    'Home':['Accueil','Start','الرئيسية','ホーム'],
    'Accounts':['Comptes','Accounts','الحسابات','アカウント'],
    'Services':['Services','Dienste','الخدمات','サービス'],
    'Warranty':['Garantie','Garantie','الضمان','保証'],
    'FAQ':['FAQ','FAQ','الأسئلة الشائعة','よくある質問'],
    'Contact':['Contact','Kontakt','التواصل','お問い合わせ'],
    'Authenticator':['Authentificateur','Authenticator','المصادقة','認証ツール'],
    'Account Details · Roshine':['Détails du compte · Roshine','Accountdetails · Roshine','تفاصيل الحساب · Roshine','アカウント詳細 · Roshine'],
    'Main navigation':['Navigation principale','Hauptnavigation','التنقل الرئيسي','メインナビゲーション'],
    'Mobile navigation':['Navigation mobile','Mobile Navigation','التنقل على الهاتف','モバイルナビゲーション'],
    'Open navigation':['Ouvrir le menu','Menü öffnen','فتح القائمة','メニューを開く'],
    'Close navigation':['Fermer le menu','Menü schließen','إغلاق القائمة','メニューを閉じる'],
    'Language':['Langue','Sprache','اللغة','言語'],
    'ROSHINE STORE':['BOUTIQUE ROSHINE','ROSHINE STORE','متجر ROSHINE','ROSHINE STORE'],
    'OVERWATCH ACCOUNT GALLERY':['GALERIE DE COMPTES OVERWATCH','OVERWATCH ACCOUNT-GALERIE','معرض حسابات OVERWATCH','OVERWATCH アカウントギャラリー'],
    'Explore every detail.':['Découvrez chaque détail.','Entdecke alle Details.','اكتشف كل التفاصيل.','すべての詳細を確認。'],
    "Enter a stock ID to explore the account's recorded skins, currency, levels and statistics.":['Saisissez un ID de stock pour voir les skins, devises, niveaux et statistiques enregistrés.','Gib eine Bestands-ID ein, um erfasste Skins, Währungen, Level und Statistiken zu sehen.','أدخل معرّف الحساب لعرض المظاهر والعملات والمستويات والإحصاءات المسجلة.','在庫IDを入力して、記録されたスキン、通貨、レベル、統計を確認できます。'],
    'ACCOUNT STOCK ID':['ID DU COMPTE','BESTANDS-ID','معرّف الحساب','在庫ID'],
    'e.g. 18':['ex. 18','z. B. 18','مثال: 18','例：18'],
    'VIEW DETAILS':['VOIR LES DÉTAILS','DETAILS ANSEHEN','عرض التفاصيل','詳細を見る'],
    'Enter a stock ID or select View Details from account stock.':['Saisissez un ID ou choisissez Voir les détails dans le stock.','Gib eine ID ein oder wähle Details ansehen im Accountbestand.','أدخل معرّف الحساب أو اختر عرض التفاصيل من المخزون.','在庫IDを入力するか、在庫一覧の「詳細を見る」を選択してください。'],
    'Enter a valid stock ID, such as 18.':['Saisissez un ID valide, par exemple 18.','Gib eine gültige ID ein, z. B. 18.','أدخل معرّفًا صحيحًا، مثل 18.','有効な在庫ID（例：18）を入力してください。'],
    'Invalid stock ID. Please try again.':['ID invalide. Réessayez.','Ungültige ID. Bitte erneut versuchen.','معرّف غير صالح. حاول مجددًا.','在庫IDが無効です。もう一度お試しください。'],
    'Looking up account #{id}…':['Recherche du compte #{id}…','Account #{id} wird geladen…','جارٍ البحث عن الحساب #{id}…','アカウント #{id} を検索中…'],
    'No collected details are available for account #{id}. Check the stock ID or try again later.':['Aucun détail collecté pour le compte #{id}. Vérifiez l’ID ou réessayez plus tard.','Keine erfassten Details für Account #{id}. Prüfe die ID oder versuche es später.','لا توجد تفاصيل مجمّعة للحساب #{id}. تحقق من المعرّف أو حاول لاحقًا.','アカウント #{id} の詳細は未公開です。IDを確認するか、後でお試しください。'],
    'Account #{id} loaded. Only recorded details are shown.':['Compte #{id} chargé. Seules les données enregistrées sont affichées.','Account #{id} geladen. Nur erfasste Daten werden angezeigt.','تم تحميل الحساب #{id}. تُعرض البيانات المسجلة فقط.','アカウント #{id} を読み込みました。記録された情報のみ表示しています。'],
    'Account data is temporarily unavailable. Please try again later.':['Données temporairement indisponibles. Réessayez plus tard.','Accountdaten vorübergehend nicht verfügbar. Bitte später versuchen.','بيانات الحساب غير متاحة مؤقتًا. حاول لاحقًا.','アカウント情報を取得できません。後でお試しください。'],
    'Account data is invalid. Please contact the store.':['Données invalides. Contactez la boutique.','Ungültige Accountdaten. Bitte kontaktiere den Store.','بيانات الحساب غير صالحة. تواصل مع المتجر.','アカウント情報が無効です。ストアにお問い合わせください。'],
    'Account summary':['Résumé du compte','Accountübersicht','ملخص الحساب','アカウント概要'],
    'Account balances':['Devises du compte','Accountguthaben','عملات الحساب','アカウント通貨'],
    'Endorsement Lv.':['Recommandation niv.','Anerkennung Lv.','مستوى الإشادة','推薦レベル'],
    'BACK':['RETOUR','ZURÜCK','رجوع','戻る'],
    'HOME':['ACCUEIL','START','الرئيسية','ホーム'],
    'Back to account stock':['Retour au stock','Zurück zum Accountbestand','العودة إلى المخزون','在庫一覧へ戻る'],
    'Mythic Prisms':['Prismes mythiques','Mythische Prismen','المناشير الأسطورية','ミシック・プリズム'],
    'Overwatch Coins':['Pièces Overwatch','Overwatch-Münzen','عملات Overwatch','オーバーウォッチ・コイン'],
    'Credits':['Crédits','Credits','الرصيد','クレジット'],
    'Competitive Points':['Points de compétition','Wettkampfpunkte','نقاط تنافسية','ライバル・ダスト'],
    'Legacy Competitive Points':['Anciens points de compétition','Alte Wettkampfpunkte','النقاط التنافسية القديمة','レガシー・ライバル・ダスト'],
    'Skins':['Skins','Skins','المظاهر','スキン'],
    'Weapon skins':['Skins d’armes','Waffenskins','مظاهر الأسلحة','武器スキン'],
    'Weapon variants':['Variantes d’armes','Waffenvarianten','تنويعات الأسلحة','武器バリエーション'],
    'Overview':['Aperçu','Übersicht','نظرة عامة','概要'],
    'Statistics':['Statistiques','Statistiken','الإحصاءات','統計'],
    'Competitive':['Compétition','Wettkampf','التنافسي','ライバル・プレイ'],
    'Account detail sections':['Sections du compte','Accountbereiche','أقسام تفاصيل الحساب','アカウント詳細セクション'],
    'Hero filter':['Filtre de héros','Heldenfilter','تصفية الأبطال','ヒーローフィルター'],
    'HEROES':['HÉROS','HELDEN','الأبطال','ヒーロー'],
    'Find a hero...':['Chercher un héros…','Helden suchen…','ابحث عن بطل…','ヒーローを検索…'],
    'Enter a stock ID to view account details':['Saisissez un ID pour voir les détails','Bestands-ID eingeben, um Details zu sehen','أدخل معرّف الحساب لعرض التفاصيل','在庫IDを入力して詳細を表示'],
    'All heroes':['Tous les héros','Alle Helden','كل الأبطال','すべてのヒーロー'],
    'Search skins, heroes or catalog IDs':['Chercher skins, héros ou ID','Skins, Helden oder IDs suchen','بحث بالمظاهر أو الأبطال أو المعرّفات','スキン、ヒーロー、IDを検索'],
    'Search skins, heroes or IDs...':['Chercher skins, héros ou ID…','Skins, Helden oder IDs suchen…','ابحث عن مظاهر أو أبطال أو معرّفات…','スキン、ヒーロー、IDを検索…'],
    'Rarity':['Rareté','Seltenheit','الندرة','レア度'],
    'All rarities':['Toutes les raretés','Alle Seltenheiten','كل درجات الندرة','すべてのレア度'],
    'Mythic':['Mythique','Mythisch','أسطوري','ミシック'],
    'Ultra':['Ultra','Ultra','فائق','ウルトラ'],
    'Evolution':['Évolution','Evolution','تطور','エボリューション'],
    'Legendary':['Légendaire','Legendär','أسطوري','レジェンダリー'],
    'Epic':['Épique','Episch','ملحمي','エピック'],
    'Rare':['Rare','Selten','نادر','レア'],
    'Common':['Commun','Gewöhnlich','عادي','コモン'],
    'Unclassified':['Non classé','Nicht klassifiziert','غير مصنف','未分類'],
    'Sort':['Trier','Sortieren','ترتيب','並べ替え'],
    'Featured first':['À la une','Empfohlen zuerst','المميز أولًا','注目順'],
    'Rarity first':['Par rareté','Nach Seltenheit','حسب الندرة','レア度順'],
    'Hero A–Z':['Héros A–Z','Held A–Z','الأبطال A–Z','ヒーロー A–Z'],
    'Skin A–Z':['Skin A–Z','Skin A–Z','المظاهر A–Z','スキン A–Z'],
    'Reset':['Réinitialiser','Zurücksetzen','إعادة ضبط','リセット'],
    'Choose an item for details':['Sélectionnez un objet','Wähle ein Objekt für Details','اختر عنصرًا للتفاصيل','アイテムを選択して詳細を表示'],
    'No matching skins':['Aucun skin trouvé','Keine passenden Skins','لا توجد مظاهر مطابقة','一致するスキンがありません'],
    'Try another keyword, hero or rarity.':['Essayez un autre mot-clé, héros ou rareté.','Versuche ein anderes Stichwort, einen Helden oder eine Seltenheit.','جرّب كلمة أو بطلًا أو درجة ندرة أخرى.','別のキーワード、ヒーロー、レア度をお試しください。'],
    'Skin pages':['Pages des skins','Skin-Seiten','صفحات المظاهر','スキンのページ'],
    'WEAPON COLLECTION':['COLLECTION D’ARMES','WAFFENSAMMLUNG','مجموعة الأسلحة','武器コレクション'],
    'HERO WEAPONS':['ARMES DES HÉROS','HELDENWAFFEN','أسلحة الأبطال','ヒーローの武器'],
    'ACCOUNT SNAPSHOT':['DONNÉES DU COMPTE','ACCOUNT-AUFNAHME','بيانات الحساب','アカウントデータ'],
    'Account snapshot':['Données du compte','Account-Aufnahme','بيانات الحساب','アカウントデータ'],
    'RANKED HISTORY':['HISTORIQUE CLASSÉ','RANGVERLAUF','سجل الرتب','ランク履歴'],
    'Back to skins':['Retour aux skins','Zurück zu Skins','العودة للمظاهر','スキンへ戻る'],
    'Close':['Fermer','Schließen','إغلاق','閉じる'],
    'Preview image ↗':['Aperçu ↗','Vorschaubild ↗','معاينة الصورة ↗','画像プレビュー ↗'],
    'Original image ↗':['Image originale ↗','Originalbild ↗','الصورة الأصلية ↗','元の画像 ↗'],
    'Catalog source ↗':['Source du catalogue ↗','Katalogquelle ↗','مصدر الفهرس ↗','カタログ出典 ↗'],
    'Complete record':['Collecte complète','Vollständige Erfassung','سجل كامل','収集完了'],
    'Partial record':['Collecte partielle','Teilerfassung','سجل جزئي','一部収集'],
    'Capture date unavailable':['Date inconnue','Erfassungsdatum unbekannt','تاريخ الجمع غير متاح','収集日時不明'],
    'Captured at (UTC)':['Date de capture (UTC)','Erfasst (UTC)','وقت الالتقاط (UTC)','収集日時 (UTC)'],
    'Image unavailable':['Image indisponible','Bild nicht verfügbar','الصورة غير متاحة','画像なし'],
    'In-game name':['Nom en jeu','Name im Spiel','الاسم داخل اللعبة','ゲーム内の名前'],
    'No image':['Sans image','Ohne Bild','بلا صورة','画像なし'],
    'OWNED':['POSSÉDÉ','IM BESITZ','مملوك','所有'],
    'CATALOG':['CATALOGUE','KATALOG','الفهرس','カタログ'],
    '✓ OWNED':['✓ POSSÉDÉ','✓ IM BESITZ','✓ مملوك','✓ 所有'],
    '← Previous':['← Précédent','← Zurück','→ السابق','← 前へ'],
    'Next →':['Suivant →','Weiter →','التالي ←','次へ →'],
    'This account snapshot records the item as owned. Check it against the game client.':['Cet objet est enregistré comme possédé. Vérifiez dans le jeu.','Dieses Objekt ist als vorhanden erfasst. Bitte im Spiel prüfen.','هذا العنصر مسجل كمملوك. تحقق منه داخل اللعبة.','このデータでは所有済みとして記録されています。ゲーム内でもご確認ください。'],
    'Catalog information does not confirm ownership for any account.':['Le catalogue ne confirme pas la possession.','Katalogdaten bestätigen keinen Besitz.','معلومات الفهرس لا تثبت الملكية.','カタログ情報は所有を証明するものではありません。'],
    'No weapon variants are recorded in this selection.':['Aucune variante enregistrée pour cette sélection.','Keine Waffenvarianten in dieser Auswahl erfasst.','لا توجد تنويعات أسلحة مسجلة لهذا الاختيار.','この選択で記録された武器バリエーションはありません。'],
    'No account snapshot has been loaded.':['Aucune donnée de compte chargée.','Keine Accountdaten geladen.','لم تُحمّل بيانات حساب.','アカウントデータが読み込まれていません。'],
    'Account Level':['Niveau du compte','Account-Level','مستوى الحساب','アカウントレベル'],
    'Time Played':['Temps de jeu','Spielzeit','وقت اللعب','プレイ時間'],
    'Games Played':['Parties jouées','Gespielte Partien','المباريات الملعوبة','プレイしたマッチ'],
    'Games Won':['Victoires','Gewonnene Partien','المباريات الفائزة','勝利したマッチ'],
    'ACCOUNT / STATISTICS':['COMPTE / STATISTIQUES','ACCOUNT / STATISTIK','الحساب / الإحصاءات','アカウント / 統計'],
    'ACCOUNT / OVERVIEW':['COMPTE / APERÇU','ACCOUNT / ÜBERSICHT','الحساب / نظرة عامة','アカウント / 概要'],
    'Account overview':['Aperçu du compte','Accountübersicht','نظرة عامة على الحساب','アカウント概要'],
    'All-mode statistics':['Statistiques globales','Statistik aller Modi','إحصاءات كل الأطوار','全モードの統計'],
    'Role statistics':['Statistiques par rôle','Rollenstatistik','إحصاءات الأدوار','ロール別統計'],
    'Role':['Rôle','Rolle','الدور','ロール'],
    'Tank':['Tank','Tank','دبابة','タンク'],
    'Damage':['Dégâts','Schaden','ضرر','ダメージ'],
    'Support':['Soutien','Unterstützung','دعم','サポート'],
    'Open Queue':['File ouverte','Offene Warteschlange','الطابور المفتوح','オープンキュー'],
    'By role':['Par rôle','Nach Rolle','حسب الدور','ロール別'],
    'Most played heroes':['Héros les plus joués','Meistgespielte Helden','الأبطال الأكثر لعبًا','よくプレイするヒーロー'],
    'Hero levels and playtime':['Niveaux et temps de jeu','Heldenlevel und Spielzeit','مستويات الأبطال ووقت اللعب','ヒーローレベルとプレイ時間'],
    'Hero':['Héros','Held','البطل','ヒーロー'],
    'Hero Level':['Niveau du héros','Heldenlevel','مستوى البطل','ヒーローレベル'],
    'Current season':['Saison actuelle','Aktuelle Saison','الموسم الحالي','現在のシーズン'],
    'Rank history':['Historique des rangs','Rangverlauf','سجل الرتب','ランク履歴'],
    'No account snapshot is available for this link. Please contact the store.':['Aucune donnée pour ce lien. Contactez la boutique.','Keine Accountdaten für diesen Link. Kontaktiere den Store.','لا توجد بيانات لهذا الرابط. تواصل مع المتجر.','このリンクのデータはありません。ストアにお問い合わせください。'],
    'This snapshot does not include overview or statistics data yet.':['Cette collecte ne contient pas encore de statistiques.','Diese Erfassung enthält noch keine Übersicht oder Statistik.','هذه البيانات لا تتضمن ملخصًا أو إحصاءات بعد.','概要や統計はまだ記録されていません。'],
    'Recorded seasons, ranks and competitive points. A blank field has not been collected.':['Saisons, rangs et points enregistrés. Un champ vide n’a pas été collecté.','Erfasste Saisons, Ränge und Wettkampfpunkte. Leere Felder wurden nicht erfasst.','المواسم والرتب والنقاط المسجلة. الحقول الفارغة لم تُجمع.','記録されたシーズン、ランク、ライバル・ダスト。空欄は未収集です。'],
    'No competitive account data is available. Load a snapshot to view ranks and seasons.':['Aucune donnée compétitive. Chargez une collecte pour voir les rangs.','Keine Wettkampfdaten vorhanden. Lade eine Erfassung für Ränge und Saisons.','لا توجد بيانات تنافسية. حمّل بيانات الحساب لعرض الرتب والمواسم.','ライバル・プレイ情報はありません。データを読み込んでください。'],
    'This snapshot does not include competitive data yet.':['Cette collecte ne contient pas encore de données compétitives.','Diese Erfassung enthält noch keine Wettkampfdaten.','هذه البيانات لا تتضمن معلومات تنافسية بعد.','ライバル・プレイ情報はまだ記録されていません。'],
    '{count} recorded skins · Showing {range}':['{count} skins enregistrés · Affichage {range}','{count} erfasste Skins · Anzeige {range}','{count} مظهر مسجل · عرض {range}','記録スキン {count} · 表示 {range}'],
    ' · {count} catalog IDs unmatched':[' · {count} ID absents du catalogue',' · {count} IDs nicht im Katalog',' · {count} معرّف خارج الفهرس',' · カタログ未一致 {count}'],
    'The snapshot records {count} weapon skins. Unrecorded items are not assumed unowned; default weapons are excluded.':['{count} skins d’armes enregistrés. Les objets non enregistrés restent inconnus ; armes par défaut exclues.','{count} Waffenskins erfasst. Nicht erfasste Objekte gelten nicht als fehlend; Standardwaffen sind ausgeschlossen.','تم تسجيل {count} مظهر سلاح. العناصر غير المسجلة ليست بالضرورة غير مملوكة؛ الأسلحة الافتراضية مستثناة.','武器スキン {count} 件を記録。未記録のアイテムは未所有を意味しません。デフォルト武器は除外しています。'],
    'The snapshot records {count} unlocked weapon variants. Default variants are excluded; unscanned heroes remain unknown.':['{count} variantes débloquées enregistrées. Variantes par défaut exclues ; héros non analysés inconnus.','{count} freigeschaltete Waffenvarianten erfasst. Standardvarianten ausgeschlossen; nicht erfasste Helden bleiben unbekannt.','تم تسجيل {count} تنويع سلاح مفتوح. التنويعات الافتراضية مستثناة؛ الأبطال غير المفحوصين غير معروفين.','解放済み武器バリエーション {count} 件を記録。デフォルトは除外。未収集のヒーローは不明です。'],
    '{count} hrs':['{count} h','{count} Std.','{count} ساعة','{count} 時間'],
    '{count} wins':['{count} victoires','{count} Siege','{count} فوز','{count} 勝'],
  };
  const originalTexts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.parentElement.closest('script,style') && entries[node.textContent.trim()]) originalTexts.push([node, node.textContent]);
  }
  const attributes = [];
  document.querySelectorAll('[placeholder],[aria-label]').forEach(element => {
    for (const key of ['placeholder','aria-label']) {
      const value = element.getAttribute(key);
      if (entries[value]) attributes.push([element,key,value]);
    }
  });
  let lang = 'en';
  function t(message, values = {}) {
    let result = (entries[message] || [])[languages.indexOf(lang) - 1] || message;
    for (const key of Object.keys(values)) result = result.split('{'+key+'}').join(String(values[key]));
    return result;
  }
  function setLanguage(value, persist = true) {
    lang = languages.includes(value) ? value : 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    originalTexts.forEach(([node,text]) => {
      if (node.isConnected) node.textContent = text.replace(text.trim(), t(text.trim()));
    });
    attributes.forEach(([node,key,value]) => node.setAttribute(key,t(value)));
    document.title = t('Account Details · Roshine');
    const languageLabel = document.querySelector('.language-option[data-language-value="'+lang+'"]').textContent.trim();
    document.querySelector('#languageTrigger span').textContent = languageLabel;
    document.querySelector('#languageTrigger').setAttribute('aria-label',t('Language')+': '+languageLabel);
    document.querySelectorAll('.language-option').forEach(option => {
      option.setAttribute('aria-selected',String(option.dataset.languageValue === lang));
    });
    document.querySelectorAll('a[href^="/"]').forEach(link => {
      const url = new URL(link.href);
      url.searchParams.set('lang',lang);
      link.href = url.pathname + url.search + url.hash;
    });
    const url = new URL(location.href);
    url.searchParams.set('lang',lang);
    history.replaceState(null,'',url.pathname + url.search + url.hash);
    if (persist) { try { localStorage.setItem('roshine_lang',lang); } catch {} }
    window.dispatchEvent(new CustomEvent('roshine:language-changed',{detail:{lang}}));
  }
  let saved = '';
  try { saved = localStorage.getItem('roshine_lang'); } catch {}
  const parameter = new URLSearchParams(location.search).get('lang');
  const browser = (navigator.language || 'en').toLowerCase().split('-')[0];
  const edge = String(window.__ROSHINE_EDGE_LANG__ || '').toLowerCase();
  const initial = languages.includes(parameter) ? parameter : languages.includes(saved) ? saved : languages.includes(edge) ? edge : languages.includes(browser) ? browser : 'en';
  window.DetailsI18n = Object.freeze({t,setLanguage,getLanguage:() => lang});
  setLanguage(initial,false);
})();
