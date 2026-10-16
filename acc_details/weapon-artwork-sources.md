# Weapon artwork provenance and framing

Checked 2026-10-16. This catalog records public reference artwork, not account ownership.
The four user-approved competitive variant pairs remain unchanged.

## Primary images

- Ana / Frostmourne: user-supplied screenshot, edited with the built-in image tool to remove overlay text and logos and extend the blurred backdrop to a wide frame. This is **not an official unedited original**. WebP full image is 1672 × 941; thumbnail is 800 pixels wide. The original upload and edited PNG are retained outside the public repository.
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

## Frostmourne edit prompt

Built-in image editing; edit target is the user's Ana Frostmourne screenshot.
Remove the top-left avatar, top-right NEWS and bottom attribution lettering; inpaint only the blurred background in those areas.
Keep the complete rifle, crystal energy, materials, orientation, leather sling and charms.
Extend the blurred background horizontally to a 16:9 composition, center the weapon, retain safe margins, and add no text, logos or new objects.
The result is an AI-assisted cleaned reference, so pixel-identical preservation is not asserted.
