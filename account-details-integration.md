# Account details / local collector integration

Baseline: origin/main bc83588, 182 stock records, 24 in stock at implementation.
accounts.json is unchanged, SHA-256:
4B69FF45FBA234EC21D399561003B943D68DA808B356A62CD946694DD0EC5167.
If stock changes before release, merge the latest stock and verify its new baseline instead.

## Changes

- Selectively added acc_details from the supplied archive, not its older homepage or inventory.
- View Skins renamed View Details in all five enabled languages.
- A lightweight optional index controls routing: no detail entry keeps the exact original screenshot link.
- Initial index is empty. No sample ownership records or real account snapshots published.
- Imported detail records live in acc_details/data/ID.json; only the selected record is fetched.
- Import validates stock membership / source ID, deduplicates items, preserves complete/partial and null/zero,
  whitelists fields, and locks writes. Existing entries require --replace.
- Legacy schemaVersion 1 inline data remains supported.
- Unknown skin/weapon IDs render no-image cards rather than disappear. Unscanned items remain unknown.
- Details UI supports EN/FR/DE/AR/JA, preserves ID on language changes, and returns with language context.
- Old-browser dialog, focus restoration, aspect-ratio and reduced-motion fallbacks added.
- Collector stays local. The separate website-ready package adds import-to-site.ps1,
  blocks partial import unless -AllowPartial is explicit, and never commits or uploads.
- Supplied catalogs match exactly: 1,997 skins, 25 weapon skins, 4 variants, 54 heroes.

## Evidence

- 399 existing skin/format compatibility cases.
- Existing import regression and new complete/partial/ID/privacy/immutable-stock contract.
- Collector's 34 offline unit tests.
- Offline OCR self-test: HEROES EVENTS read correctly; bundled English model used.
- Actual PowerShell bridge run against a disposable website fixture with the collector example schema.
- Chromium desktop and WebKit mobile workflow in five languages; old screenshot links, unknown items,
  native-dialog-disabled fallback, 320/390/414 widths, ID mismatch, broken index/path and legacy data.
- Existing full browser regression across homepage, Authenticator, privacy, terms and 404.

WebKit tests use a current engine with selected new APIs disabled. They are not iOS 14 hardware tests.
No game account was logged in or collected during this integration. Catalog completeness / all-hero
collection accuracy is not established by an offline self-test. External image hosting can fail;
the page keeps records and shows a no-image fallback.
