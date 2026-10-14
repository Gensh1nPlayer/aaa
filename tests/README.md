# Compatibility checks

Run node tests/skin-compatibility.cjs using Node.js.
It checks skin-name precedence, markup escaping, currency highlighting,
endorsement aliases and Safari 14's known syntax/API restrictions.

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
- node tests/hero-gallery-import.cjs
- node tests/details-browser.cjs (same Playwright / Chrome variables; no TLS required)
- node tests/details-images-browser.cjs (original artwork and source failure fallback; no TLS required)
- node tests/language-browser.cjs (all five selectors, Japanese single-line labels, no checkmarks; TLS variables recommended for Auth)
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
