# Sakura1Tap Optimization Plan

> This document is the working plan for future performance and maintainability optimization.
>
> Codex and other coding agents must read `AGENTS.md` before following this plan.

## 0. Hard Rules

These rules are non-negotiable.

1. Do not change the site's core identity.
   - Keep the Live2D entry.
   - Keep the Boot -> Live2D -> Main flow.
   - Keep the 3D main scene as a core part of the website.
   - Keep the Play toolbox as a future extension area.

2. Do not bypass required entry assets.
   - Do not let users enter the main site before Live2D is ready.
   - Do not let users enter the main site before the main GLB model buffer is ready.
   - Do not replace the entry flow with a generic fallback page unless WebGL is unavailable.

3. Do not trade visual quality for speed without explicit approval.
   - Do not reduce Live2D texture resolution.
   - Do not remove Live2D expressions, motions, physics, or pose files unless they are proven unused.
   - Do not visibly degrade the GLB model.
   - Do not blur, crop, or low-res the background image.

4. One optimization at a time.
   - Make one focused change.
   - Run validation.
   - Report the result.
   - Only then move to the next optimization.

5. Build validation is required.
   - Run `npm run build` after each code change.
   - If touching loading, routing, Vite config, Live2D, Three.js, or Canvas, also run `npm run dev` and manually open the site.
   - If build cannot be run, stop and report why.

6. Avoid high-risk build config changes.
   - Do not add `manualChunks` unless bundle analysis proves the need.
   - Do not alter Vite output behavior as an early optimization.
   - Do not combine Vite config changes with runtime code changes in the same commit.

## 1. Current Stability Notes

Recent optimization attempts caused a white screen after deployment. The high-risk changes were reverted:

- Vite `manualChunks` optimization was reverted.
- App entry parallel mount flow was reverted.

Treat these areas as sensitive:

- `vite.config.ts`
- `src/App.tsx`
- `src/components/Live2DStage.tsx`
- `src/live2d/CubismSdkModel.ts`
- `src/components/BootOverlay.tsx`

Do not modify multiple sensitive files in one step.

## 2. Optimization Philosophy

The goal is not to make the site load instantly by removing its identity.

The goal is:

- keep the full Live2D entry experience;
- keep the main GLB model ready before entry;
- keep image/model clarity;
- reduce unnecessary blocking and repeated work;
- compress assets without visible quality loss;
- make the project easier to maintain;
- avoid breaking the deployed website.

## 3. Priority Roadmap

### P0 - Recovery and Baseline

Before any new optimization:

1. Confirm the current deployed site is no longer white-screening.
2. Run:

```bash
npm install
npm run build
npm run dev
```

3. Open the site locally and verify:

- Boot overlay appears.
- Live2D entry appears.
- Enter button is disabled until ready.
- Clicking enter reaches the 3D main page.
- `/play` works.
- `/play/blackout` works.

4. Record approximate baseline:

- first load time;
- model loading time;
- Live2D ready time;
- total time until Enter is available;
- any console errors.

No optimization should begin before this baseline is known.

### P1 - Safe Asset Optimization

This is the preferred first real optimization phase.

#### 1. Background image compression

Target file:

```text
public/images/fantasy-road.png
```

Allowed:

- Convert to WebP or AVIF if visual quality remains effectively unchanged.
- Keep the original PNG until the replacement is verified.
- Add a fallback if needed.
- Use high-quality settings.

Not allowed:

- Obvious blur.
- Obvious color loss.
- Over-aggressive compression.
- Replacing the background art style.

Suggested approach:

1. Check file size.
2. Generate `fantasy-road.webp` from the original at high quality.
3. Compare visually.
4. Update `BootOverlay.tsx` / CSS references if needed.
5. Run `npm run build`.
6. Test first load.

Acceptance criteria:

- Visual difference is not obvious.
- Boot background still looks clean.
- First-load transfer size decreases.
- No layout or loading regression.

#### 2. GLB size review

Target file:

```text
public/models/study.glb
```

Allowed:

- Inspect file size and structure.
- Use safe GLB optimization tools only if output looks visually equivalent.
- Consider lossless or near-lossless optimization.
- Keep the original until the optimized version is verified.

Not allowed:

- Visible model degradation.
- Removing important geometry.
- Replacing the model.
- Changing the entry rule that model must be ready before entering.

Suggested approach:

1. Check current GLB file size.
2. Inspect whether textures inside the GLB are too large.
3. Try a conservative optimized copy.
4. Compare visual result locally.
5. Replace only after visual verification.

Acceptance criteria:

- Model still looks the same at normal site distance.
- Load time improves or file size decreases meaningfully.
- Main page still renders model correctly.

### P2 - Live2D Loading Logic Optimization

Live2D must remain fully loaded before entry.

Allowed:

- Cache requests with `fetch(..., { cache: 'force-cache' })`.
- Parallelize network fetches where order is not required.
- Decode textures in parallel, then bind them in stable order.
- Avoid repeated framework initialization.
- Avoid repeated model loading on rerender.
- Improve loading status text.

Not allowed:

- Entering before Live2D is ready.
- Lowering Live2D texture quality.
- Removing expressions or motions without proof.
- Disabling physics or pose without explicit approval.

Suggested tasks:

1. Verify whether current parallel texture decoding is stable.
2. If unstable, revert it before trying another Live2D optimization.
3. Check duplicate requests in DevTools Network tab.
4. Add caching hints only if they do not break loading.
5. Keep Live2D initialization order conservative.

Acceptance criteria:

- Live2D appears normally.
- Both models load.
- Mouse focus works.
- Click feedback works.
- No console errors.
- Enter button unlocks only after Live2D ready.

### P3 - Code Maintainability Optimization

This phase improves future development safety.

#### 1. Extract main section config

Current likely target:

```text
src/components/MainPage.tsx
```

Create:

```text
src/data/mainSections.ts
```

Move only static section data:

- section title;
- label;
- body;
- metric;
- details;
- hotspot;
- camera position;
- model rotation;
- accent color;
- orbit.

Do not rewrite Three.js rendering logic in the same step.

Acceptance criteria:

- Main page looks the same.
- Section switching still works.
- TypeScript remains strict.
- `npm run build` passes.

#### 2. Clean duplicate old code

Inspect whether `MainPage.tsx` still contains old Play / DodgeGame code now that these files exist:

```text
src/components/DodgeGame.tsx
src/components/PlayPage.tsx
src/components/PlayGamePage.tsx
```

Allowed:

- Remove unreachable duplicate components.
- Remove unused imports.
- Remove dead code proven unused.

Not allowed:

- Removing active Play routes.
- Removing active game component.
- Changing game behavior in the cleanup commit.

Acceptance criteria:

- No duplicate unused large code remains.
- Play page still opens.
- Blackout Run still works.
- `npm run build` passes.

#### 3. CSS split, later only

Current file:

```text
src/style.css
```

Do this only after the site is stable.

Possible future split:

```text
src/styles/base.css
src/styles/boot.css
src/styles/live2d-entry.css
src/styles/main-page.css
src/styles/play.css
src/styles/responsive.css
```

Rules:

- Do not change visual design while splitting.
- Move CSS in small chunks.
- Validate each page after each split.
- Avoid broad selector rewrites.

### P4 - Build and Bundle Analysis

Only after P1/P2/P3 are stable.

Allowed:

- Add a temporary or dev-only bundle visualizer.
- Generate a bundle report.
- Use the report to decide whether chunk splitting is necessary.

Not allowed initially:

- Adding manual chunk config before measuring.
- Changing Vite output and runtime code in one commit.

Suggested command after adding an analyzer:

```bash
npm run build
```

Acceptance criteria:

- Bundle report identifies actual heavy chunks.
- Any follow-up chunk optimization is backed by evidence.
- No deployment white screen.

## 4. Recommended Work Order for Codex

Use this exact order unless the user changes priorities.

1. Stabilization check
   - Build.
   - Run dev server.
   - Confirm current website flow.

2. Background image optimization
   - Measure PNG size.
   - Create high-quality WebP/AVIF candidate.
   - Compare visually.
   - Update references only after verification.

3. GLB review
   - Measure size.
   - Inspect optimization options.
   - Produce conservative optimized candidate.
   - Compare visually.
   - Replace only if clearly safe.

4. Live2D stability review
   - Confirm current Live2D loading works.
   - Check duplicate network requests.
   - Keep or revert parallel texture decoding depending on stability.

5. MainPage section config extraction
   - Move config only.
   - Do not rewrite rendering.

6. Duplicate code cleanup
   - Remove proven unused old code only.

7. Bundle analysis
   - Measure before changing Vite chunk behavior.

8. CSS split
   - Do last, gradually.

## 5. Commit Rules

Each commit should contain one logical optimization only.

Good commit examples:

```text
optimize: add high quality webp entry background
refactor: extract main page section config
cleanup: remove duplicate play prototype code
analyze: add bundle visualizer script
```

Bad commit examples:

```text
optimize everything
fix site
update stuff
```

## 6. Verification Checklist

After every optimization commit, run:

```bash
npm run build
```

Then manually check:

- `/`
- `/play`
- `/play/blackout`

For entry flow, verify:

- Boot overlay appears.
- Loading text updates.
- Live2D appears.
- Enter button unlocks only after ready.
- Enter transition works.
- Main 3D page appears.

For console:

- No uncaught runtime error.
- No missing module error.
- No failed critical asset request.
- No WebGL context crash.

For visual quality:

- Background remains clear.
- Live2D remains sharp.
- Main model remains visually equivalent.
- Layout remains stable on desktop and mobile.

## 7. Emergency Rollback Rule

If a change causes white screen:

1. Stop adding new changes.
2. Identify the last changed file.
3. Revert the last optimization commit first.
4. Restore website access before continuing.
5. Document the failed attempt in this file or in `CHANGELOG.md`.

Do not stack more changes on top of a broken deployment.

## 8. Notes for User

Current user preference:

- Prioritize optimization, not new features.
- Do not weaken Live2D entry quality.
- Do not allow early entry before Live2D and GLB are ready.
- Asset compression is acceptable only when clarity is preserved.
- Play lazy loading is acceptable and should remain.
- Codex should obey `AGENTS.md` and this optimization plan.
