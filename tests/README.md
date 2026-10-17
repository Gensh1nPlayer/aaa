# Compatibility checks

Run node tests/skin-compatibility.cjs using Node.js.
It checks skin-name precedence, markup escaping, currency highlighting,
endorsement aliases and Safari 14's known syntax/API restrictions.

- `node tests/skin-context.cjs`: hero ownership, full-title matching, same-name mythic collisions, Bundle inheritance and the complete current skin catalog.
- `node tests/skin-rarities.cjs`: homepage rarity fallback, exact full titles, explicit hero aliases and ambiguous-title rejection; existing special rules retain priority.
- `node tests/identity-layout-browser.cjs`: real #191 and controlled dense-tag fixtures at four widths in Chromium/WebKit; balanced ID/level, nonoverlapping secondary tags, stored tag aliases, long levels and RTL.

Stock/detail display updates:

- `node tests/details-account-display.cjs`: shared lossless level parsing and Stock labels.
- `node tests/details-stock-browser.cjs`: color groups with all four existing sort modes, Stock labels, version precedence, long levels, numeric compatibility and mobile cards.
- `node tests/floating-launcher-browser.cjs`: the floating Search / Home launchers stay centred and motionless through a full breathing cycle while scrolling (Chromium and WebKit, phone and desktop); centring uses no transforms and the breathing keyframes animate glow only.
- `node tests/ios14-compat-browser.cjs`: early iOS 14 Safari (before 14.5) in WebKit — `replaceChildren()` with no arguments that leaves old children, and ignored flex `gap`. `assets/compat.js` must keep Account Details from stacking repeated content and restore icon/label spacing.
- `node tests/details-manual-snapshot.cjs`: manual editor save/reload and actual offline collector re-export; set `MANAGER_PACKAGE` and `COLLECTOR_PACKAGE` to the local packages. Uses temporary fixtures only.
- `node tests/currency-contract.cjs`: all nine currencies, preference priority, rate validation, races, timeout, expiry and honest USD fallback.
- `node tests/currency-browser.cjs`: currency keyboard interaction, mobile layout, RTL and rate failure/expiry in Chromium and WebKit.
- `node tools/sync-site-footer.cjs --check`: six public pages match the shared static footer template and load the shared navigation styles; omit `--check` after editing `assets/site-footer.html` to synchronize them.
- `node tests/brand-assets.cjs`: all six pages use the new vector identity, current sharing artwork, matching legacy aliases, SVG/PNG/ICO/touch icons and manifest. Rebuild icons with `SHARP_MODULE` then `node tools/build-brand-assets.cjs`; run `node tools/sync-brand.cjs --check` to verify static references after synchronization.

Brand source files are `assets/logo.svg` and `assets/roshine-wordmark.svg` (approved path-only vectors, no font dependency). To synchronize a brand edit: rebuild icon sizes, run `tools/sync-site-footer.cjs`, then `tools/sync-brand.cjs`; render `tools/social-card.html` with `tools/render-social-card.cjs`. Legacy PNG and preview URLs deliberately serve the new artwork for backwards compatibility.
- `node tests/site-footer-browser.cjs`: shared footer, icon navigation, five-language links, FAQ legibility and disclosed non-USD fee in desktop Chromium / mobile WebKit. Set `TEST_TLS_KEY` and `TEST_TLS_CERT` to local test PEM files, plus `PLAYWRIGHT_MODULE` and optional `CHROME_EXECUTABLE`. Uses HTTPS because Authenticator upgrades insecure subresources. `FOOTER_SCREENSHOT_DIR` optionally saves visual checks.
- `node tests/stock-display-browser.cjs`: integrated price sorting, stable IDs, compound levels, UTC file timestamp, saved currency, conversion, translated price filters and responsive header.
- `node tests/inventory-updated.cjs`: exact-content GitHub timestamp verification, local Last-Modified, invalid/future timestamps, failure and stale-response protection.
- `node tests/currency-live.cjs --live`: optional external read-only FX/IP smoke check; not deterministic and may be rate-limited.

The active stock file is `accounts.json`; account IDs and original USD values are not rewritten by display conversion.
The FX service supplies latest published daily observations, not tick-by-tick trading quotes. Quotes are fetched on demand,
shown with their publication date, expire from the browser cache after one hour, and fall back to explicitly labeled USD on failure.
Currency selection priority is saved manual choice, supported browser region, IP currency suggestion, then EUR.
Non-USD prices include a 2.5% conversion fee (original USD × rate × 1.025), disclosed next to inventory results. USD and failed-rate fallback have no fee. Selection changes always start from the original USD value, never the previous converted display.
Public inventory update times require the GitHub commit's immutable file content to match the loaded inventory exactly;
GitHub Pages deployment headers and page visit time are not treated as inventory edit times. Unknown remains unknown.

Browser checks use Playwright with Chromium and WebKit:

1. Install Playwright and its browsers, or set PLAYWRIGHT_MODULE to an existing installation.
2. Optionally set CHROME_EXECUTABLE to an existing Chrome executable.
3. Generate a local, disposable TLS certificate with OpenSSL:
   openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 1 -subj /CN=localhost
4. Set TEST_TLS_KEY and TEST_TLS_CERT to those files, then run node tests/browser-compatibility.cjs.
   HTTPS models the production Authenticator Content Security Policy; it upgrades HTTP resource requests.
5. Optionally set SCREENSHOT_DIR to save desktop/mobile screenshots.

The WebKit scenarios disable Array.at, String.at, Object.hasOwn and structuredClone
to exercise older browser API limits. They are modern WebKit tests, not an iOS 14 device emulator.
Tests cover five languages, inventory/filter behavior, a single shared inventory request,
page exceptions, horizontal overflow, reduced motion and the auxiliary pages.

Account details integration:

- node tests/details-contract.cjs
- node tests/image-sources.cjs (GitHub-first artwork, Fandom fallback, unchanged IDs)
- node tests/esports-catalog.cjs (OWL OW1/OW2 and OWCS Home/Away identity, existing IDs, verified Shop/Stadium metadata)
- node tests/catalog-format.cjs (compact catalog.js expands to the committed records; rewrites are stable and lossless)
- node tests/hero-gallery-import.cjs
- node tests/details-browser.cjs (same Playwright / Chrome variables; no TLS required)
- node tests/details-images-browser.cjs (original artwork and source failure fallback; no TLS required)
- node tests/details-skin-effects.cjs (name colors/glow parity with stock, Mythic/Ultra labels, escaping and five languages)

`node tools/refresh-esports-catalog.cjs` refreshes reference artwork and source/order metadata
from the Wiki league pages and all 54 Foxy hero pages, preserving existing IDs and primary images.
`--esports-only` refreshes league additions without re-fetching hero order metadata.
This command never edits inventory or snapshots. It requires network access and may be rate-limited.

`acc_details/catalog.js` is stored in a compact form and expands to the full records when loaded. Edit it only through
`tools/catalog-format.cjs` (`read` / `write`, used by the refresh tools); `node tools/catalog-format.cjs` re-compacts it in place.
Stock name-color groups remain the first sorting key; verified esports, Shop/Stadium sources
precede ordinary skins within each group, followed by the selected comparator and reference order.
Rarity labels use Wiki colors independently of the unchanged shared Stock name effects.
The homepage loads a compact generated rarity dictionary rather than the full artwork catalog.
`node tools/build-skin-rarities.cjs` rebuilds that dictionary after local catalog edits;
the catalog refresh command runs it automatically. Only skin-description names use the fallback,
not arbitrary inventory prose. Common names stay white with no glow; unknown/ambiguous names stay plain.
- node tests/language-browser.cjs (all five selectors, Japanese single-line labels, no checkmarks; TLS variables recommended for Auth)
- node tests/auth-regressions.cjs (TLS variables required; RFC vectors, strict Hex input, stale async results, storage failures and language URL persistence)
- node tests/policy-regressions.cjs (storage failures, keyboard language selection, English-based warranty conditions and scrollable small-screen 404)
- node tests/site-regressions.cjs (invalid inventory rows, card reuse, stable IDs, language reload, storage failures and secondary text contrast)
- node tests/collector-bridge.cjs (Windows; set COLLECTOR_PACKAGE to the local website-ready package)

The legacy collector bridge requires a package containing import-to-site.ps1; the current local
manager uses its authenticated import/save APIs instead. Its real Python export/edit/re-export
integration is verified by the manager's tests/review-export-bridge.cjs with COLLECTOR_PACKAGE
set to the active local collector directory. Neither test runs the game or publishes GitHub.

The details checks cover unchanged old screenshot links, per-account data lookup,
schema-1 compatibility, complete/partial fidelity, privacy filtering, ID mismatch,
malformed paths, index failure, unknown catalog entries, five languages, mobile widths,
and a disabled-native-dialog fallback with keyboard focus restoration.
Browser fixtures stay in the test HTTP server and are never written to public stock.
The details-browser suite uses fixed account fixtures, including #185 with the new
details method; no real account needs a screenshot for that test to pass.
Overview's most-played heroes are checked using unsorted recorded playtimes,
while the full Statistics table must retain its recorded order.

Import recovery checks inject filesystem errors in disposable fixture directories.
An index commit failure restores an existing snapshot byte-for-byte, or removes
only the new snapshot created by that import. If rollback also fails, the error
identifies the retained .rollback backup or new file that needs manual recovery.
These checks do not prove cross-file atomicity during power loss or process termination.
