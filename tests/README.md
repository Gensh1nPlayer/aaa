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
