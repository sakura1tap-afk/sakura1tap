# _archive — assets that are no longer part of the deployed site

Nothing here is deleted. These files used to live under `public/`, which means every
`npm run build` copied them into `dist/` and uploaded them to Cloudflare — even though
no routed page referenced them anymore. They were moved here (same bytes, same layout)
so the deployed bundle only carries what the site actually serves.

`/_archive/` is gitignored, so this folder stays local.

## What is here

| Path | Why it was moved |
| --- | --- |
| `public-unused/live2d/Frieren/` | Not referenced by any page. A spare Live2D model. |
| `public-unused/live2d/WhiteAngel/` | Not referenced by any page. The earlier WhiteAngel export. |
| `public-unused/live2d/Fern/*.png`, `fern.moc3.bak` | `fern.model3.json` loads the `.webp` textures; these are the source PNGs plus a `moc3` backup. |
| `public-unused/live2d/WhiteAngelOriginal/无口天使 5.4096/texture_00.png` | Same: the manifest points at the `.webp`. |
| `public-unused/art-models/` | Only used by `src/components/main/*` and the artifact lab, which are not routed. |
| `public-unused/art-game/` | Only used by the retired `EntryMiniGame`. 1333 files. |
| `public-unused/images/fantasy-road.png` | Was an entry background for a removed design layer. |
| `public-unused/models/study.glb` | Was only used by the retired boot layer / 3D main page. |
| `public-unused/cubism-shaders/` | The vendored TypeScript Cubism SDK carries its own shader sources. |

Total: ~47 MB and ~1400 files removed from the deployed bundle.

## Restoring something

Move it back and rebuild — for example:

```powershell
Move-Item _archive/public-unused/live2d/Frieren public/live2d/Frieren
npm run build
```

If you bring back one of the retired components (`src/components/main/*`,
`EntryMiniGame`, `BootOverlay`, `CursorParticles`, `DodgeGame`, `artifact/*`), move the
matching assets back first — `public-unused/art-models`, `public-unused/art-game`,
`public-unused/models/study.glb` and `public-unused/images/fantasy-road.png` are what
they expect.
