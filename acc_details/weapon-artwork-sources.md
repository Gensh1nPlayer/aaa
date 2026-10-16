# Weapon artwork provenance and framing

Checked 2026-10-16. This catalog records public reference artwork, not account ownership.

## Weapon variants (Golden, Jade, Galactic, Crimson Wolf)

All 216 hero × variant pairs (54 heroes × 4) use the user's own native game captures from 2026-10-16
(216 JPEGs, 1918 × 1078, one per hero and variant, taken in the in-game weapon viewer). Files live in
`assets/weapons/variants/<hero>-<variant>.webp` (1920 × 1080, the same size as the skin originals) and
`<hero>-<variant>-thumb.webp` (960 × 540, the same size as the other native weapon thumbnails; variant cards display thumbnails).

- Filenames were mapped to catalog heroes with an explicit alias list (e.g. BAP → Baptiste, DOCTORINE → Doctrine, GLODEN → Golden); all 216 pairs resolved with no gaps or duplicates.
- Framing: each hero's four captures share camera and pose, so the pixels that change between variants locate the recoloured weapon; the whole in-focus object that carries the recolour (the full weapon, or the full hero model for D.Va, D.Mon, Bastion, Doomfist, Echo, Lifeweaver, Jetpack Cat, Moira) is kept. A 16:9 crop adds a safe margin (7 % of the height), trims the capture's 6 px rounded-corner border, never enlarges by more than 1.25×, and is identical for all four variants of a hero. Every crop was checked on contact sheets; no weapon is cut.
- No AI repainting, recolouring or retouching; only cropping and resizing (Lanczos), WebP quality 88 / 84.
- The four earlier references (Tracer Golden / Jade / Crimson Wolf from the Wiki, Ashe Crimson Wolf official) remain as same-hero fallbacks. A hero never falls back to another hero's weapon.

## Primary images

- Ana / Frostmourne: replaced by the user's native game capture `FROST ANA.jpg` on 2026-10-16. Full-size `ana-frostmourne-native.jpg` retains the source JPEG byte-for-byte (1918 × 1078); WebP thumbnail is 960 × 540. Only page framing (1.03× centered) trims background; the rifle, sling and muzzle remain inside the frame. No AI repainting. The previous AI-assisted reference is no longer displayed.
- Soldier: 76 / Deliverance: replaced by the user's native `DEILVERANCE.jpg` capture. Full-size `soldier76-deliverance-native.jpg` retains the original JPEG bytes (1918 × 1078); WebP thumbnail is 960 × 540. Centered 1.18× page framing trims excess background without cutting the weapon. The Wiki weapon image remains a fallback; the official promotional reference remains recorded separately. Source filename spelling does not change the catalog name Deliverance.
- Hanzo / Tokyo Rebel: [official Season 3 article](https://overwatch.blizzard.com/en-us/news/24271881/).
- Sojourn / Eternal Crystal: [official Season 4 article](https://overwatch.blizzard.com/en-gb/news/24295381/4/).
- Lucio / Treblemaker: [official Season 5 article](https://overwatch.blizzard.com/es-es/news/24303008/sacia-tu-hambre-en-el-reinado-de-talon-temporada-5-doctrine-sombrio/).
- Other weapons retain their existing hero-specific Wiki artwork. Stable snapshot IDs and ownership are unchanged.

## Additional official references

These are promotional scenes containing the hero and weapon, not isolated weapon renders.
They are stored as `officialImage`, `officialSource` and `officialImageContext` in the catalog.
They deliberately do not replace the clearer isolated weapon images displayed by default.

| Hero / weapon | Official article | Image |
| --- | --- | --- |
| Mercy / Merciful Magitech | [Season 16 midseason](https://overwatch.blizzard.com/en-gb/news/24186407/) | [3840 × 2160 scene](https://bnetcmsus-a.akamaihd.net/cms/page_media/uz/UZFE0OP5WV8R1747187679052.png) |
| Soldier: 76 / Deliverance | [Season 13 midseason](https://overwatch.blizzard.com/en-gb/news/24143784/) | [3840 × 2160 scene](https://bnetcmsus-a.akamaihd.net/cms/page_media/w1/W1YSPEX46PCU1731024518004.png) |
| Reinhardt / Bound Demon | [Season 11 midseason](https://overwatch.blizzard.com/en-gb/news/24104748/) | [1920 × 1080 scene](https://bnetcmsus-a.akamaihd.net/cms/page_media/5q/5QBOS77W565P1718640974864.png) |

This is not a claim that every weapon has an official isolated render or that every CDN URL has been live-tested.

## Layout

Weapon and variant cards use a wide 16:9 frame, centered `contain`, and safe padding.
The grid is three columns on desktop, two on medium screens and one on phones.
The weapon viewer has a bounded, consistent image stage; portraits and panoramas fit without cropping or stretching.
Hero skin viewers retain their existing natural-ratio layout.
Differing weapon image ratios use a dimmed, softly blurred copy of the successfully loaded image as background; the sharp foreground stays fully contained. Missing images and normal hero skin viewers do not inherit this backdrop.

## Historical Frostmourne edit prompt (superseded)

Built-in image editing; edit target is the user's Ana Frostmourne screenshot.
Remove the top-left avatar, top-right NEWS and bottom attribution lettering; inpaint only the blurred background in those areas.
Keep the complete rifle, crystal energy, materials, orientation, leather sling and charms.
Extend the blurred background horizontally to a 16:9 composition, center the weapon, retain safe margins, and add no text, logos or new objects.
The result is an AI-assisted cleaned reference, so pixel-identical preservation is not asserted.
