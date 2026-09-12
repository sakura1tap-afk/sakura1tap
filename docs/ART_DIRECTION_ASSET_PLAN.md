# Sakura1Tap Art Direction Asset Plan

Updated: 2026-07-08

Status: planning only. No code changes and no asset downloads in this phase.

## 1. Direction Lock

Sakura1Tap is not a personal homepage, portfolio, SaaS page, or normal UI site.

It is a digital interactive space: a high-end front-end effect entrance that can later hide tools, experiments, and backend systems.

Visual target:

- Active Theory / Lusion style spatial motion
- Abstract digital art
- Digital Artifact as the core object
- Thin-line system, controlled glow, dark depth
- Small anime signal fragments, not a full anime illustration page

The asset strategy is not "collect nice assets." The goal is to build a reusable visual world:

1. A custom central artifact.
2. A small lighting and material kit for Three.js.
3. A limited symbol language.
4. A procedural background system.
5. Anime elements used as fragments, masks, or emotional signals.

## 2. Current Asset Need Analysis

### 2.1 Main Visual Artifact

Needed asset role:

- A custom Digital Artifact that behaves like a ritual object / signal engine.
- It should be inspectable, draggable, foldable, and scroll-driven.
- It should not be a downloaded "cool orb" model.

Required layers:

- Outer shell: dark metallic / obsidian surface.
- Inner energy: translucent core, glyph, sakura orbit, scan lines.
- Broken pieces: floating fragments that spread during Expansion / Drift / Exit.
- Anime hint: eye-shaped or halo-shaped emotional signal, very subtle.

Best approach:

- Build the artifact as project-authored geometry or procedural Three.js, then use CC0 materials and HDRI lighting.
- Avoid using a complete stock 3D model as the hero object.

### 2.2 Three.js Model Direction

The model direction should be:

- Abstract artifact, not character.
- Low to medium poly, optimized for browser.
- Physically lit but stylized.
- Supports material changes through scroll state.

Recommended structure:

- Custom Blender/Three geometry for core rings and shard shells.
- 1-2 CC0 PBR materials for surface detail.
- 1 CC0 HDRI for lighting.
- Optional tiny particle field built in code.

Avoid:

- Random Sketchfab or "techno orb" models with unclear provenance.
- Existing IP anime models.
- Heavy 4K model packs directly in first viewport.

### 2.3 SVG Symbols

Needed symbol roles:

- Sakura orbit mark.
- Signal / aperture glyph.
- Thin-line eyes or anime gaze fragment.
- Small seals, ticks, scanning markers.

Best approach:

- Keep Sakura orbit project-authored.
- Use public-domain anime-eye SVG only as a reference/mask candidate.
- Create final glyphs in-house so Sakura1Tap owns its identity.

### 2.4 Textures

Needed texture roles:

- Dark metal / worn shell.
- Rock or obsidian-like roughness for artifact base.
- Ripple / foam / interference texture for displacement masks.
- Starfield/data-noise image for subtle background dust.

Use rules:

- Use 4K source where available.
- Downscale for runtime.
- Prefer JPG/WebP for masks and noncritical background layers.
- Keep original source notes in docs before downloading.

### 2.5 Background

The background should not be a full stock wallpaper.

Needed background roles:

- Spatial darkness.
- Controlled backlight.
- Sparse star/data dust.
- Subtle parallax and pointer-responsive field.

Best approach:

- CSS / shader / canvas generated field as primary.
- HDRI used for 3D lighting, not as a visible wallpaper.
- NASA/ESA deep-field image may be sampled or heavily processed into data dust, with credit.

### 2.6 Anime Illustration Elements

Anime should be a trace, not the whole scene.

Allowed:

- Eye line art.
- Small expression glyph.
- Silhouette or Live2D presence in later phase.
- Sakura / ribbon / halo / iris motifs.

Avoid:

- Full anime girl background.
- Existing IP characters.
- Random AI illustration.
- Large character render as the homepage identity.

## 3. Candidate Asset List

These are candidates only. Do not download all of them. Select a small set per implementation phase.

### A01

name: Digital Artifact Core
type: project-authored 3D model / procedural Three.js object
source: project-authored
license: Sakura1Tap project asset
resolution: geometry target, not raster; runtime LOD required
purpose: main hero object and identity anchor
integration method: create custom artifact geometry using rings, shards, inner glyphs, and scroll-driven material states; use CC0 materials below only as surface inputs

### A02

name: Ferndale Studio 07
type: HDRI lighting
source: https://polyhaven.com/a/ferndale_studio_07
license: CC0 via Poly Haven
resolution: 4K / 8K / 16K options
purpose: warm studio spotlight for artifact lookdev and controlled cinematic lighting
integration method: use as Three.js environment lighting only; do not show as page background; downsample to 1K/2K for runtime if used

### A03

name: Hangar Interior
type: HDRI lighting / spatial reflection candidate
source: https://polyhaven.com/a/hangar_interior
license: CC0 via Poly Haven
resolution: 4K / 8K / 16K / 20K options
purpose: industrial spatial lighting for a hidden-toolbox / digital chamber mood
integration method: use as environment map for metal reflections; crop or blur if used as abstract reflection source

### A04

name: Goegap
type: HDRI lighting / harsh contrast candidate
source: https://polyhaven.com/a/goegap
license: CC0 via Poly Haven
resolution: 4K / 8K / 16K options
purpose: high-contrast warm desert light for artifact silhouette tests
integration method: test in lookdev only; likely too natural for final visible background, but useful for specular shape checks

### A05

name: Metal 049 A
type: PBR material
source: https://ambientcg.com/view?id=metal049a
license: CC0 via ambientCG
resolution: 4K target; verify exact package before download
purpose: dark artifact shell, worn metallic ring, scanable outer surface
integration method: use roughness/normal maps on custom artifact shell; downscale maps for runtime

### A06

name: Rock 035
type: PBR material
source: https://ambientcg.com/view?id=Rock035
license: CC0 via ambientCG
resolution: 4K target; verify exact package before download
purpose: obsidian/stone-like roughness for shard fragments or artifact pedestal
integration method: sample normal/roughness only; recolor in shader/CSS pipeline toward black paper and warm gray

### A07

name: Foam 003
type: procedural PBR texture / distortion mask
source: https://ambientcg.com/view?id=Foam003
license: CC0 via ambientCG
resolution: 4K JPG package available; 8K also available
purpose: ripple, interference, data membrane, portal distortion
integration method: use as grayscale displacement/noise mask, not literal ocean foam; runtime should use compressed derivative

### A08

name: Hubble Ultra Deep Field High Rez
type: public-domain deep-space image
source: https://commons.wikimedia.org/wiki/File:Hubble_ultra_deep_field_high_rez.jpg
license: Public Domain; NASA/ESA credit required by source note
resolution: 6200 x 6200
purpose: star/data dust, cosmic archive texture, subtle background speckles
integration method: heavily process into low-opacity monochrome dust/noise layer; do not use as obvious space wallpaper

### A09

name: Anime Eyes
type: SVG / PNG anime fragment
source: https://freesvg.org/anime-eyes
license: Public Domain / CC0
resolution: SVG scalable; large PNG 2400 px available
purpose: small anime gaze fragment, cursor-focus motif, hidden emotional layer
integration method: use as reference or mask only; final visible glyph should be redrawn into Sakura1Tap's thin-line style

### A10

name: Eyes Manga Anime - 4
type: SVG anime-eye pack
source: https://openclipart.org/detail/344300/eyes-manga-anime-4
license: Openclipart CC0 / Public Domain policy
resolution: SVG scalable; file size about 653 KB
purpose: reference pack for anime eye silhouette variants
integration method: inspect before use; if too large, trace one simplified eye shape manually and credit original candidate in planning notes

### A11

name: Sakura Orbit Glyph
type: SVG symbol
source: project-authored, currently `src/assets/symbols/sakura-orbit-glyph.svg`
license: Sakura1Tap project asset
resolution: SVG scalable
purpose: core identity glyph and orbit signal
integration method: keep as the canonical symbol; expand into a small symbol family instead of replacing it with third-party icons

### A12

name: CSS / Shader Grain Field
type: project-authored procedural texture
source: project-authored, currently `HomeExperience.css`
license: Sakura1Tap project asset
resolution: procedural
purpose: base visual texture, pointer-responsive field, non-stock background identity
integration method: preserve as primary background texture; external images should feed it as masks only, not replace it

## 4. Recommended Phase Selection

Do not adopt all candidates at once.

Phase 1 lookdev set:

1. A01 Digital Artifact Core, project-authored.
2. A02 Ferndale Studio 07, HDRI lighting.
3. A05 Metal 049 A, shell material.
4. A07 Foam 003, distortion mask.
5. A11 Sakura Orbit Glyph, canonical symbol.

Phase 2 optional depth set:

1. A03 Hangar Interior, environment reflection.
2. A08 Hubble Ultra Deep Field High Rez, data dust.
3. A09 or A10 anime eye, heavily simplified.

Do not add A03, A08, A09, or A10 before the artifact shape is stable.

## 5. Rejected / Risky Directions

- Random Sketchfab "tech orb" models: often unclear style ownership, can feel generic, and may reference existing games or IP.
- Full anime character illustration: would turn the page into an anime splash screen instead of a digital artifact space.
- Stock abstract wallpaper: too close to normal website background usage.
- Vecteezy-style "royalty free" anime assets: license and attribution can be tiered or account-dependent; avoid unless individually audited.
- NASA/JWST images as visible wallpaper: acceptable only as processed data/noise material with source credit, not as the page's main art.

## 6. Integration Rules

1. The artifact must remain custom.
2. External assets support material, lighting, masks, or tiny symbols.
3. Every external asset must be copied into `docs/assets.md` only after actual adoption.
4. Runtime versions must be compressed and downsampled.
5. No new asset may bypass license/source recording.
6. No candidate may replace the Sakura1Tap symbol language with a generic pack.

## 7. Open Decisions Before Download

1. Is the artifact 100% DOM/CSS/SVG, Three.js, or Blender-authored GLB?
2. Should anime traces come from simplified eyes, Live2D presence, or project-authored expression glyphs?
3. Is the homepage environment closer to studio void, industrial chamber, or cosmic archive?
4. What is the maximum first-view asset budget for the artifact phase?
