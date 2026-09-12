# Sakura1Tap Asset Register

This file records external and self-authored visual assets used by Sakura1Tap.

## Active Assets

| Asset | Type | Local file | Source URL | Author | License | Usage | Modified |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Zen Dots 400 | Display font | `src/assets/fonts/zen-dots-400.ttf` | https://fonts.google.com/specimen/Zen+Dots | Yoshimichi Ohira | OFL-1.1 | Home title font for the spatial entry page | Self-hosted only; no glyph edits |
| Sometype Mono 400 | Mono font | `src/assets/fonts/sometype-mono-400.ttf` | https://fonts.google.com/specimen/Sometype+Mono | Ryoichi Tsunekawa | SIL OFL 1.1 | Home interface/body/accent text | Self-hosted only; no glyph edits |
| Sometype Mono 600 | Mono font | `src/assets/fonts/sometype-mono-600.ttf` | https://fonts.google.com/specimen/Sometype+Mono | Ryoichi Tsunekawa | SIL OFL 1.1 | Slightly stronger labels and links | Self-hosted only; no glyph edits |
| Cherry blossom | SVG symbol | `src/assets/symbols/openclipart-cherry-blossom.svg` | https://openclipart.org/detail/216154/cherry-blossom | yamachem | CC0 / Public Domain via Openclipart | Low-opacity sakura glyph inside the spatial core | Used as filtered, scaled SVG layer |
| Sakura orbit glyph | SVG symbol | `src/assets/symbols/sakura-orbit-glyph.svg` | Project-authored | Sakura1Tap | Project asset | Thin-line orbit/sakura signal glyph inside the spatial core | Authored for this project |
| Sakura favicon | SVG icon | `public/favicon.svg` | Project-authored | Sakura1Tap | Project asset | Browser tab icon and favicon request target | Authored for this project |
| CSS-generated grain | Texture system | `src/components/home/HomeExperience.css` | Project-authored | Sakura1Tap | Project asset | Low-intensity grain layer and pointer-responsive field texture | CSS only; no external texture file |
| Ferndale Studio 07 1K HDR | HDRI environment | `src/assets/hdri/ferndale_studio_07_1k.hdr` | https://polyhaven.com/a/ferndale_studio_07 | Poly Haven | CC0 | Artifact Lab environment reflection and soft studio response | Runtime preview version only; 1,578,021 bytes; larger 2K/4K+ variants not downloaded |
| Digital Artifact Core | Procedural 3D object | `src/components/artifact/ArtifactCore.tsx` | Project-authored | Sakura1Tap | Project asset | Central core, shard shell, orbit rings, glyph plane, and distortion field for `/artifact-lab` | Programmatic geometry; no external 3D model |
| Procedural distortion field | Procedural mask / field | `src/components/artifact/ArtifactCore.tsx` | Project-authored | Sakura1Tap | Project asset | First-pass distortion/ripple field while Foam 003 remains a deferred mask candidate | Programmatic rings and additive shell; no texture file |

## Deferred Candidate Assets

These assets have clear upstream licenses but are not currently downloaded or referenced at runtime.

| Asset | Type | Source URL | Author | License | Resolution / size status | Intended use | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Metal 049 A | PBR material | https://ambientcg.com/view?id=metal049a | ambientCG | CC0 | License confirmed; local download skipped because file size could not be verified through the current TLS connection | Future metal shell roughness/normal pass | Deferred, not active |
| Foam 003 | PBR / mask material | https://ambientcg.com/view?id=Foam003 | ambientCG | CC0 | License confirmed; local download skipped because file size could not be verified through the current TLS connection | Future distortion/ripple mask, not literal foam | Deferred, not active |

## Rejected Assets

| Asset | Source URL | Reason |
| --- | --- | --- |
| SVG Repo Orbit | https://www.svgrepo.com/svg/410719/orbit | The attempted download returned a Vercel Security Checkpoint HTML document with script content instead of a clean SVG, so it was deleted and not used. |

## Size Notes

Current downloaded asset sizes:

- `zen-dots-400.ttf`: 34,840 bytes
- `sometype-mono-400.ttf`: 38,332 bytes
- `sometype-mono-600.ttf`: 38,272 bytes
- `openclipart-cherry-blossom.svg`: 16,118 bytes
- `sakura-orbit-glyph.svg`: 1,100 bytes
- `favicon.svg`: 683 bytes
- `ferndale_studio_07_1k.hdr`: 1,578,021 bytes

Total active downloaded asset size: approximately 1.70 MB.

## License Notes

- Google Fonts font files are self-hosted and used under their upstream OFL licenses.
- Openclipart states uploads use Creative Commons Zero 1.0 Public Domain License.
- The Sakura orbit glyph and CSS grain are project-authored assets and have no external license dependency.
- Poly Haven states its assets are CC0 and can be used commercially without attribution.
- ambientCG states its assets are CC0 and can be used commercially without attribution; Metal 049 A and Foam 003 are deferred until runtime-sized files are selected and verified.
