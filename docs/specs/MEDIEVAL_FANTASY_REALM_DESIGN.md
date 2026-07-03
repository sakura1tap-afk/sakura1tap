# 3D Installation Portfolio Redesign

> Direction reset, 2026-07-03.
> References: Active Theory, Lusion, Bruno Simon, plus user-provided screenshots.

## 1. Target

Build an interactive 3D installation website, not a text-led portfolio.

The page should feel like a dark exhibition room: floating glass panels, luminous relics, dense particles, reflective material, subtle UI, and camera-led navigation.

## 2. Reference Rules

- Active Theory: dark WebGL atmosphere, particles as a primary visual layer, small UI labels.
- Lusion: 3D storytelling, project content embedded into moving spatial scenes.
- Bruno Simon: navigation as exploration, not menu reading.
- User screenshots: main visual is 3D object + particle field + translucent panels; text is secondary.
- Horror/lab-specimen feeling is out of scope: surreal objects should read as artifacts, not body parts on display.

## 3. Visual Hierarchy

1. 3D installation / artifact.
2. Particle field and lighting.
3. Floating translucent panels.
4. Small navigation UI.
5. Text content.

Large hero typography is no longer the direction.

## 4. Current Asset Mapping

| Asset | Runtime role | Status |
| --- | --- | --- |
| `public/art/models/dna_hologram.glb` | temporary luminous relic / particle artifact | active |
| `public/art/models/2d_hand_creation_rigged.glb` | surreal creator-hand relic / secondary installation object | active |
| `public/art/game/kenney-new-platformer/` | playable Entry buffer platformer | active |
| `public/art/videos/*.mp4` | interactive media-glass video panels | active |
| `public/models/study.glb` | secondary physical object | active |
| `public/images/fantasy-road.png` | fallback matte background only | active |
| `dark_rock_4k.blend.zip` | future floor / rough material source | conversion needed |
| `rogland_clear_night_4k.exr` | future environment lighting | downsample needed |
| `gothic_statue_4k.blend.zip` | future archive statue / silhouette | conversion needed |
| `chinese_chandelier_4k.blend.zip` | future suspended light rig | conversion needed |
| `cc0___sakura_cherry_blossom.glb` | future particle source, not direct runtime | extraction needed |

## 5. Implementation Direction

### Main Scene

- Load the 3D stage after entry for the main experience, not only Universe.
- Keep it lazy-loaded, but once the user enters, the visual should be 3D-first.
- Use the relic GLB as the temporary center artifact.
- Use the surreal hand GLB as a secondary object so the scene feels like an authored installation, not only abstract rings.
- Keep the hand small, warm-gray, translucent, and peripheral; it must not dominate the first read.
- Add procedural glass panels, dark floor, cables/rings/frames, and dense particles around the relic.
- Add procedural media-glass screens so the stage has visible content layers without needing project screenshots yet.
- Add suspended cable/rig geometry to bind the panels, relic, and floor into one installation.
- Media-glass screens must become interaction surfaces: click to play/pause, drag to reposition, and later accept real video textures.
- Add liquid reflection / ripple geometry under the artifact so the scene feels spatial instead of poster-like.
- Use particle density and luminous streams as the main visual event.
- Keep text small and off to the edges.

### UI

- Boot remains the true loading layer.
- Entry is a playful buffer layer, not a static hero page.
- Entry should feel like a tiny playable toy inspired by Bruno Simon / platform game buffers, with the real enter button pinned to the top or bottom edge.
- Entry background/effects must stay clean: no old fantasy wallpaper, no colored vignette, no decorative Live2D focus layer.
- Boot should be black/white only, using a simple cross/progress motif.
- Top nav becomes compact pills / ticks.
- Section title becomes small metadata, not giant hero text.
- Bottom rail stays minimal.
- Detail content appears only after intentional open.
- Text must stay small and sparse.
- Do not use numeric progress readouts or decorative numeric sequence labels.
- Loading should use a progress bar only.
- The first screen should not feel like a normal portfolio layout; visible UI must stay on the edges and leave the center to the 3D installation.
- Navigation labels should be accessible but not visually dominant; dots/ticks are preferred over readable menu text.

### Motion

- GSAP timeline handles section transition: panel drift, particle pulse, camera-scan feel.
- Use transforms, opacity, CSS variables.
- Cursor should influence light/ripple, not create a basic ring-only effect.
- Main entry should be timed in seconds: background first, atmosphere second, edge UI third, Three stage fourth, then heavy GLB assets.
- Heavy art assets should be mounted as separate visual layers so their network requests do not start all at once.

## 6. Immediate Slice

This slice should:

- Render `RealmWorldStage` on the main page, not only Universe.
- Shrink main typography.
- Add a screen-panel / installation feel to the 3D scene.
- Remove numeric progress/readout UI from Boot, Entry, Main, and Detail layers.
- Add procedural particle bloom and liquid reflection in the 3D stage.
- Replace the old visible menu/title structure with edge controls, tick navigation, and a single progress line.
- Keep build passing.

## 7. Open Work

- Convert at least one `.blend.zip` asset into a runtime GLB or baked texture.
- Produce a low-res environment map from `rogland_clear_night_4k.exr`.
- Replace temporary DNA relic with a real medieval / surreal artifact.
- Expand asset attribution for the surreal hand model before public launch.
- Replace procedural media-glass textures with real project screenshots once content is ready.
- Replace procedural panel playback with real video textures after video material is selected.
- Upgrade the Entry mini-game from DOM toy to a more complete vehicle/platformer buffer if it proves fun.
- Add visual QA screenshots for desktop and mobile.

## 8. Performance Notes

- The 3D stage chunk is large mainly because it owns Three.js, React Three Fiber, GLTF loading, and the live scene code.
- Runtime optimization is more important than hiding the warning: avoid re-cloning GLB scenes during section changes, cap DPR, reduce mobile particle counts, and remove unused helper libraries from the stage.
- A large async chunk is acceptable for the main 3D world if it stays lazy-loaded and the entry flow remains responsive.
- Next package-level optimization should split/cache Three/R3F vendor code only if we need better long-term browser caching.
- Current main-page reveal schedule:
  - `0.18s`: dark backdrop.
  - `0.55s`: atmosphere layers, mist, cursor light, dust.
  - `0.95s`: edge UI.
  - `1.35s`: Three stage and procedural fallback.
  - `2.25s`: DNA / arcane relic GLB.
  - `3.20s`: surreal hand GLB.
- Current build split:
  - `RealmWorldStage` should stay small and mostly contain scene orchestration code.
  - `three-vendor` owns Three.js / React Three Fiber and may remain large because it is the 3D engine layer.
  - `gsap-vendor`, `motion-vendor`, `react-vendor`, and `live2d-vendor` are split for better long-term caching.
