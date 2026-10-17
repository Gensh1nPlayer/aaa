# Social preview artwork

The 1200 × 630 JPEG is rendered from social-card.html; layout and copy stay editable.
Set PLAYWRIGHT_MODULE if Playwright is installed outside this repository.
Set CHROME_EXECUTABLE to use an existing Chrome installation.

Run node tools/render-social-card.cjs to regenerate assets/og-social-v4.jpg.
The renderer also refreshes the legacy og-social-v3.jpg / og-social-v2.jpg / og-social.jpg / og.jpg aliases.
The service-first artwork uses the approved path-only Roshine wordmark, Segoe UI with Arial fallbacks,
and the site's dark violet palette. It highlights lifetime security warranty (terms apply),
live one-to-one buying / questions / after-sales support, full account details and security-first handover.
There are no invented testimonials, online-now indicators, 24/7 claims or guaranteed ban-free claims.

For a draft, set `SOCIAL_CARD_OUTPUT` to a local JPEG path before rendering. This leaves every public
preview image and legacy alias untouched. The renderer checks image loading, 1200 × 630 dimensions
and nonoverlapping layout bounds. The approved service-first version uses the fresh v4 URL in
all six pages' Open Graph and Twitter metadata. Future artwork changes should use another fresh
versioned preview URL so new shares do not reuse old image caches.

Historical hero portrait source URLs (not used in the new service-first artwork):

- Kiriko: https://d15f34w2p8l1cc.cloudfront.net/overwatch/408603fe037e8576078eaac5eab2fb251489ced4003b11f5f522776d43d0b83d.png
- Genji: https://d15f34w2p8l1cc.cloudfront.net/overwatch/156b12c20b1aea872c1eeb5bb37a7de1047b2ab30ecefd0663a8925badde1ea8.png
- Mercy: https://d15f34w2p8l1cc.cloudfront.net/overwatch/3bfb8bd8ec827e53d870f1238ab73d8aa1f5dbfbcfaaf7f96ffcd35b5c6102ab.png

Roshine is an independent store; this design does not claim Blizzard affiliation.
