# Root clutter archive

Files moved out of the repository root on 2026-09-12. **Nothing here was deleted.** Every
entry was verified byte-for-byte against what the site actually ships before it was moved,
so no shipped asset depends on this directory.

The root previously carried ~390 MB of local scratch material that `.gitignore` excluded
from the repository (only this archive directory itself is versioned). Moving these here
keeps the originals recoverable while leaving the working tree readable.

## Why each item is safe to have moved

| Archived | Original path | Size | Evidence |
| --- | --- | --- | --- |
| `source-library/素材库/*.mp4` (4) | `素材库/` | 38.0 MB | SHA-256 identical to `public/art/videos/` copies, which `/lab` loads. These were the original downloads. |
| `whiteangel-dlc/` | `白天使dlc修改版3.0/` | 12.6 MB | All 22 shared files are SHA-256 identical to `public/live2d/WhiteAngelOriginal/` (`无口天使 5.moc3` = `3B444B15…`, 2,794,112 B). Only `model3.json` differs, and the shipped one is newer/larger (`1.6 KB` vs `1.5 KB`), so this DLC contributed nothing the site did not already have. |
| `whiteangel-dlc.zip` | `白天使dlc修改版3.0.zip` | 9.3 MB | Zip of the directory above; 53 entries, same content. |
| `background-candidate.png` | root | **7 bytes** | A truncated download: PNG signature plus three bytes, nothing decodable. |
| `background-candidate-view.png` | root | 3.2 KB | 743×558 preview, referenced nowhere in source or docs. |
| `chatgpt-image-20260620.png` | root | 2.9 MB | 1672×941 PNG, referenced nowhere. `_archive/public-unused/images/fantasy-road.png` is the same 2.94 MB, so this is very likely a copy of an image already archived. |
| `vite-live2d-sdk.log` | root | ~0 | Local build log, referenced nowhere. |
| `source-library/素材库/*` (non-video) | `素材库/` | 329.3 MB | Candidate models/textures listed in `docs/ASSET_LIBRARY.md`; none is imported by shipped code. |

Search evidence: `git grep -I -e 素材库 -e 白天使` returns only `.gitignore` and
`docs/ASSET_LIBRARY.md` — no source file references either directory.

## Licence status of the source library

`docs/ASSET_LIBRARY.md` carried these flags, and they travel with the files. Keep them
attached if any of this is ever promoted back into `public/`:

| File | Flag | Note |
| --- | --- | --- |
| `anime_head_-_mako_kill_la_kill.glb` | **blocked** | Filename names an existing IP. Do not ship. |
| `anime_girl_with_red_hoodie.glb` | **license-check** | Confirm source and licence before any public use. |
| `stella.glb` | **license-check** | Same. |
| `kenney_new-platformer-pack-1.1.zip` | OK, attribution optional | Kenney (kenney.nl), CC0. |
| `cc0___sakura_cherry_blossom.glb`, `rogland_clear_night_4k.exr`, `dark_rock_4k.blend.zip`, `gothic_statue_4k.blend.zip`, `chinese_chandelier_4k.blend.zip`, `dna_hologram.glb`, `2d_hand_creation_rigged.glb`, `simple_rigged_stickman_for_2d_animations.glb`, the four `.mp4` files | candidate / user-provided | Not currently shipped; no licence recorded. |

## Sizes (MB)

`cc0___sakura_cherry_blossom.glb` 73.9 · `rogland_clear_night_4k.exr` 92.6 ·
`dark_rock_4k.blend.zip` 63.6 · `gothic_statue_4k.blend.zip` 37.3 ·
`chinese_chandelier_4k.blend.zip` 28.2 · `285224_medium.mp4` 16.7 · `stella.glb` 13.1 ·
`anime_girl_with_red_hoodie.glb` 9.3 · `dna_hologram.glb` 9.1 · `285205_medium.mp4` 7.6 ·
`272021_medium.mp4` 7.3 · `285240_medium.mp4` 6.4 · `2d_hand_creation_rigged.glb` 4.8 ·
`kenney_new-platformer-pack-1.1.zip` 3.1 · `anime_head_-_mako_kill_la_kill.glb` 2.8 ·
`simple_rigged_stickman_for_2d_animations.glb` 0.3

## Related inconsistency (not fixed here)

`docs/ASSET_LIBRARY.md` still lists `dna_hologram.glb`, `2d_hand_creation_rigged.glb` and
the Kenney pack as **active**, pointing at `public/art/models/` and `public/art/game/`.
Neither directory exists — `public/art/` was archived into `_archive/public-unused/` in
`c02300a`. The components that load them (`ArcaneRelicHologram.tsx`, `SurrealHandRelic.tsx`,
`EntryMiniGame.tsx`) are also unreachable from `src/main.tsx`. Those doc rows describe a
build that is no longer shipped and should be corrected when the unreachable components are
finally removed.
