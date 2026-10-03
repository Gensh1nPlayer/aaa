# Social preview artwork

The 1200 × 630 JPEG is rendered from social-card.html; layout and copy stay editable.
Set PLAYWRIGHT_MODULE if Playwright is installed outside this repository.
Set CHROME_EXECUTABLE to use an existing Chrome installation.

Run node tools/render-social-card.cjs to regenerate assets/og-social-v2.jpg.
The artwork uses the store's existing logo, Bahnschrift with Arial fallbacks,
and Blizzard hero portraits. The orange/white composition references the game's
hero-selection interface. Portraits are decorative, not account screenshots.

Portrait source URLs (resolved through OverFast's hero metadata):

- Kiriko: https://d15f34w2p8l1cc.cloudfront.net/overwatch/408603fe037e8576078eaac5eab2fb251489ced4003b11f5f522776d43d0b83d.png
- Genji: https://d15f34w2p8l1cc.cloudfront.net/overwatch/156b12c20b1aea872c1eeb5bb37a7de1047b2ab30ecefd0663a8925badde1ea8.png
- Mercy: https://d15f34w2p8l1cc.cloudfront.net/overwatch/3bfb8bd8ec827e53d870f1238ab73d8aa1f5dbfbcfaaf7f96ffcd35b5c6102ab.png

Roshine is an independent store; this design does not claim Blizzard affiliation.
