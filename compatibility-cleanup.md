# Safari 14 compatibility and background cleanup

## Root cause

The original assets/main.js contained RegExp lookbehind literals in the contextual
Queen/Druid skin rule. Safari added that syntax in 16.4. Older iOS engines reject
the entire script during parsing, before loadAccounts can fetch or render the inventory.
Static content and the independent redesign script can still appear normally.

Replaced lookbehind with ordinary context matching and explicit exclusions;
Junker Queen remains neutral and Divine Druid keeps its Mythic tier.
Replaced Array.at in filter-menu keyboard navigation with indexed array access;
Safari added Array.at in 15.4.

Official references:
- https://webkit.org/blog/13966/webkit-features-in-safari-16-4/
- https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/

## Removed obsolete work

- Hidden rain canvas, its animation loop, resize and visibility listeners.
- Old floating blurred blobs and unused background markup across main/Auth/policy pages.
- Disabled CSS star layer, unused star keyframes and superseded background declarations.
- Unused pink/green color variants and duplicate Comic Book color replacement.
- A second inventory fetch: hero statistics now use the inventory-loaded event.

The active canvas starfield, visible grid and atmospheric glow remain.
Reveal animation now degrades to visible content if IntersectionObserver is unavailable.
Changed CSS/JS version URLs are updated on every consumer page.
Inventory data, account ownership, prices and statuses are unchanged.

## Social preview

New orange/white hero-selection artwork uses actual Kiriko, Genji and Mercy portraits
and the store logo. Main preview title and description are shorter. Every page now uses
assets/og-social-v2.jpg so old cached image URLs do not replace the new design.
The original image files are retained for existing external links.

## Verification

- Skin compatibility suite: 399 cases plus endorsement and Safari syntax/context checks.
- Chromium desktop and modern WebKit mobile/API-restricted/reduced-motion scenarios:
  five languages, stock counts, filters, single inventory request, auxiliary pages,
  no page exceptions or horizontal overflow.
- Source syntax checks and git diff --check.
- Social image: 1200 × 630 JPEG, all portraits loaded; visually reviewed at preview size.

An actual iPhone running iOS 14 was not connected. The old-engine syntax failure
is confirmed by the source and official support dates; final device behavior still
requires checking the updated site on that phone.
