# AGENTS.md

This file defines how AI coding agents should work inside the `sakura1tap` repository.

The guidance is adapted for this project from common agent-skill patterns, including security auditing, skill optimization, deliberate tool use, repository-aware navigation, Git workflow discipline, and natural Chinese communication. Do not treat the referenced skills as installed runtime tools; treat this document as the source of truth for this repository.

## Project Identity

`Sakura1Tap` is an interactive personal website and front-end experiment hub. It is not a generic portfolio template.

Core experience:

- A boot/loading layer that preloads the entry background and GLB model.
- A Live2D entry stage with character focus, feedback, particles, and transition effects.
- A Three.js / React Three Fiber main scene with camera-bound section navigation.
- Four main content nodes: About, Work, Source, and Play.
- A Play toolbox that currently contains the Canvas-based `Blackout Run` game.

Preserve the site's identity: immersive, minimal, black/white with warm paper tones, soft fantasy atmosphere, Live2D presence, and strong interaction polish.

## Current Tech Stack

- React 19
- TypeScript
- Vite
- Three.js
- React Three Fiber
- Drei
- Framer Motion
- Live2D Cubism runtime / custom Cubism SDK wrapper
- HTML5 Canvas 2D
- Lucide React icons
- Global CSS in `src/style.css`

Package scripts:

```bash
npm run dev
npm run build
npm run preview
```

Before considering a code task complete, run or at least reason through `npm run build`. If the environment cannot run the command, state that clearly in the final report.

## Operating Principles

### 1. Think in small, safe changes

Prefer narrow, reviewable edits. Avoid broad rewrites unless the user explicitly asks for a redesign.

Before changing code, identify:

- The user-facing goal.
- The smallest set of files needed.
- Which experience layer is affected: Boot, Live2D Entry, Main Scene, Play, Game, Styling, or Build.
- Possible regressions.

### 2. Preserve working interaction flows

Do not casually break these flows:

- Initial boot overlay -> Live2D entry -> main page.
- `/` main route.
- `/play` toolbox route.
- `/play/blackout` game route.
- WebGL availability fallback.
- Live2D model load status and error status.
- GLB model buffer reuse from boot into main scene.

If touching `src/App.tsx`, verify route state, `entered`, `bootComplete`, `live2dReady`, `modelBuffer`, and navigation behavior.

### 3. Security Auditor rules

Treat all code changes as needing a light security review.

Check for:

- Secret leakage: never commit `.env`, API keys, tokens, cookies, private URLs, or credentials.
- Unsafe HTML injection: avoid `dangerouslySetInnerHTML` unless the content is sanitized and the reason is documented.
- Untrusted input: do not pass user-controlled content directly into DOM, URLs, fetch targets, or script loaders without validation.
- External resources: avoid adding third-party scripts or CDNs unless necessary and explained.
- Supply-chain risk: do not add dependencies casually. Prefer existing stack first.
- Asset licensing: when adding models, images, fonts, or audio, document source and license in README or a source note.
- File safety: never add `node_modules`, `dist`, large temporary zips, or local backups.

When the task involves dependencies, scripts, external assets, auth, deployment, or dynamic content, include a security note in the final response.

### 4. Skill Optimizer rules

Optimize instructions and code for usefulness, not complexity.

When editing agent-facing instructions:

- Remove vague advice.
- Prefer project-specific rules over generic best practices.
- Convert repeated patterns into checklists.
- Keep instructions short enough that future agents will actually read them.
- Mark speculative plans as plans, not current features.

When editing code:

- Prefer simple abstractions over clever ones.
- Do not introduce a framework just to solve a local problem.
- Keep naming consistent with existing files and classes.
- Preserve TypeScript strictness.

### 5. Superpowers-style deliberate workflow

For non-trivial tasks, use a deliberate loop:

1. Understand the current behavior.
2. Locate the smallest relevant files.
3. Make the minimal change.
4. Check build/type/style implications.
5. Explain what changed and why.

Do not skip repository reading. Do not guess file structure if GitHub access is available.

### 6. Agent-Reach-style context reach

When a task is vague, actively gather nearby context before editing.

Useful context targets:

- `package.json` for stack and scripts.
- `src/App.tsx` for routing and top-level state.
- `src/components/BootOverlay.tsx` for boot flow.
- `src/components/Live2DEntry.tsx` and `src/components/Live2DStage.tsx` for entry and Live2D.
- `src/live2d/CubismSdkModel.ts` for Live2D internals.
- `src/components/MainPage.tsx` for main scene and nodes.
- `src/components/PlayPage.tsx`, `src/components/PlayGamePage.tsx`, and `src/components/DodgeGame.tsx` for Play.
- `src/style.css` for layout and visual behavior.
- `index.html` for runtime scripts.
- `vite.config.ts` and `tsconfig*.json` for build behavior.

Prefer searching before editing. If multiple similarly named components exist, inspect imports to confirm which one is active.

### 7. GitNexus-style repository and Git discipline

Before writing to GitHub:

- Confirm the target branch. Default is `main` unless the user asks for a branch or PR.
- Check whether the target file exists before creating it.
- Use clear commit messages.
- Do not mix unrelated changes in one commit.
- Do not edit generated files or dependency directories.

For final reports, include:

- Files changed.
- What changed.
- Validation performed or not performed.
- Any risks or follow-up tasks.

### 8. Humanizer-zh communication rules

The repository owner mainly communicates in Chinese. Use natural Chinese when reporting to the user, unless the user asks for English.

Style:

- Be direct and practical.
- Explain technical changes in human terms first, code terms second.
- Avoid stiff translation tone.
- Do not overuse buzzwords.
- When something is uncertain, say so plainly.
- For project summaries, make them suitable for a student portfolio or presentation.

Code comments should usually be English if the surrounding code is English. User-facing Chinese copy inside the website may remain Chinese.

## Project-Specific Do / Don't

### Do

- Preserve Live2D entry as a core identity feature.
- Preserve the warm fantasy / minimal interactive tone.
- Prefer lazy loading for heavy pages or assets.
- Keep WebGL fallbacks functional.
- Keep mobile layout in mind for Live2D, Three.js, and Canvas.
- Use existing dependencies before adding new ones.
- Keep planned features clearly marked as planned.
- Keep README and AGENTS updated when project direction changes.

### Don't

- Do not replace the site with a normal template portfolio.
- Do not add heavy UI frameworks such as Ant Design, MUI, or Tailwind unless explicitly requested.
- Do not remove the boot overlay, Live2D stage, or 3D main scene without direct instruction.
- Do not hardcode secrets or private deployment data.
- Do not commit `node_modules`, `dist`, `.env`, `.zip`, `.bak`, generated logs, or local-only assets.
- Do not introduce router/deployment rewrites without checking current manual History API behavior.
- Do not add copyrighted assets without attribution notes.

## File Map

```text
index.html                         Runtime root and Live2D Cubism core script
src/main.tsx                       React root mount
src/App.tsx                        Top-level app state, manual routes, lazy pages
src/components/BootOverlay.tsx     Boot/loading overlay and GLB preload
src/components/Live2DEntry.tsx     Live2D entry UI and enter button
src/components/Live2DStage.tsx     WebGL Live2D stage and model orchestration
src/live2d/CubismSdkModel.ts       Custom Cubism model loader, update, draw, focus
src/data/mainSections.ts           Main page section content, camera, hotspot, and icon config
src/components/MainPage.tsx        3D main scene, section rendering, wheel navigation
src/components/main/MainScene.tsx  R3F/Three main scene, camera rig, model, and energy field
src/components/main/DetailLayer.tsx Main page node detail overlay
src/components/main/MainPanel.tsx  Main page title, body, and primary action
src/components/main/SceneHotspots.tsx Main page scene hotspot buttons
src/components/main/TechStrip.tsx  Main page bottom tech strip
src/components/PlayPage.tsx        Play toolbox intro page
src/components/PlayGamePage.tsx    Fullscreen Blackout Run wrapper
src/components/DodgeGame.tsx       Canvas game implementation
src/components/CursorParticles.tsx Entry cursor/firefly particles
src/style.css                      Global visual system and responsive styling
```

## Common Task Playbooks

### Add or edit a main-page section

1. Update the section config in `src/data/mainSections.ts`.
2. Keep the section key type-safe.
3. Provide label, metric, camera, model rotation, hotspot, title, body, and details.
4. Check wheel navigation and hotspot placement.
5. Update README if it changes the site's public feature list.

### Change Live2D behavior

1. Inspect `Live2DEntry.tsx`, `Live2DStage.tsx`, and `CubismSdkModel.ts` together.
2. Keep model loading timeout and error states.
3. Do not block entry forever if one decorative behavior fails.
4. Preserve pointer focus and feedback behavior unless intentionally changing it.
5. Test desktop and mobile layout assumptions.

### Add a Play module

1. Add the module metadata to the Play page.
2. Create a separate component for the interactive program.
3. Add route handling in `src/App.tsx` if it needs fullscreen mode.
4. Keep Canvas/WebGL loops cleaned up on unmount.
5. Add keyboard or touch support where reasonable.

### Change styling

1. Locate the relevant class in `src/style.css` before adding new selectors.
2. Prefer CSS variables for section accent behavior.
3. Avoid global changes that affect unrelated pages.
4. Check both desktop and narrow screens.
5. Keep the visual tone consistent: minimal, warm, interactive, not noisy.

### Add dependencies

1. Justify why existing stack cannot solve it.
2. Prefer small, maintained packages.
3. Check browser compatibility and bundle cost.
4. Update README if the dependency becomes part of the project identity.

## Definition of Done

A task is done when:

- The requested behavior is implemented.
- The change is as small as practical.
- TypeScript and build implications were checked.
- No unrelated files were changed.
- No generated or secret files were added.
- The final response explains changed files and validation.

For larger changes, also include follow-up recommendations.

## Current Optimization Backlog

1. Create and maintain `README.md`.
2. Replace placeholder content with real personal/project copy.
3. Improve mobile layout for Live2D, main nodes, and Play.
4. Optimize heavy assets and loading behavior.
5. Split `src/style.css` into maintainable style modules when it becomes painful.
6. Expand Play toolbox beyond `Blackout Run`.
7. Consider React Router only after route count grows.
8. Add deployment notes and changelog.
