export type AssetKind = 'hdri' | 'live2d' | 'model' | 'texture' | 'visual-reference'
export type RuntimeMediaKind = AssetKind | 'game-pack' | 'video'
export type AssetStatus = 'active' | 'blocked' | 'candidate' | 'future' | 'license-check'
export type LoadingTier = 'entry' | 'future' | 'lazy' | 'main-optional' | 'reference' | 'static'

export type SiteAsset = {
  id: string
  kind: RuntimeMediaKind
  loadingTier: LoadingTier
  notes: string
  sourcePath: string
  status: AssetStatus
  url?: string
}

export const siteAssets = [
  {
    id: 'study-model',
    kind: 'model',
    loadingTier: 'entry',
    notes: 'Current main scene model. CC BY 4.0 attribution is recorded in public/models/study-attribution.txt.',
    sourcePath: 'public/models/study.glb',
    status: 'active',
    url: '/models/study.glb',
  },
  {
    id: 'entry-background',
    kind: 'texture',
    loadingTier: 'entry',
    notes: 'Current boot background. Candidate for WebP/AVIF optimization.',
    sourcePath: 'public/images/fantasy-road.png',
    status: 'active',
    url: '/images/fantasy-road.png',
  },
  {
    id: 'white-angel-original',
    kind: 'live2d',
    loadingTier: 'entry',
    notes: 'Current Live2D entry identity asset. Keep inside Entry module unless a later design decision moves it.',
    sourcePath: 'public/live2d/WhiteAngelOriginal',
    status: 'active',
  },
  {
    id: 'fern-live2d',
    kind: 'live2d',
    loadingTier: 'entry',
    notes: 'Current Live2D entry support asset. Keep license notes with the Live2D asset audit.',
    sourcePath: 'public/live2d/Fern',
    status: 'active',
  },
  {
    id: 'arcane-relic-hologram',
    kind: 'model',
    loadingTier: 'main-optional',
    notes: 'Temporary Universe relic hologram copied from 素材库/dna_hologram.glb. Loaded lazily in MainScene with a procedural world-sigil fallback.',
    sourcePath: '素材库/dna_hologram.glb',
    status: 'active',
    url: '/art/models/dna_hologram.glb',
  },
  {
    id: 'surreal-hand-relic',
    kind: 'model',
    loadingTier: 'main-optional',
    notes: 'Surreal creator-hand artifact copied from 素材库/2d_hand_creation_rigged.glb. Used as a secondary installation object in the main 3D stage.',
    sourcePath: '素材库/2d_hand_creation_rigged.glb',
    status: 'active',
    url: '/art/models/2d_hand_creation_rigged.glb',
  },
  {
    id: 'kenney-new-platformer',
    kind: 'game-pack',
    loadingTier: 'entry',
    notes: 'Kenney New Platformer Pack copied from 素材库/kenney_new-platformer-pack-1.1.zip. Used for the playable Entry buffer.',
    sourcePath: '素材库/kenney_new-platformer-pack-1.1.zip',
    status: 'active',
    url: '/art/game/kenney-new-platformer/',
  },
  {
    id: 'panel-video-272021',
    kind: 'video',
    loadingTier: 'main-optional',
    notes: 'User-provided MP4 for interactive media-glass panel playback.',
    sourcePath: '素材库/272021_medium.mp4',
    status: 'active',
    url: '/art/videos/272021_medium.mp4',
  },
  {
    id: 'panel-video-285205',
    kind: 'video',
    loadingTier: 'main-optional',
    notes: 'User-provided MP4 for interactive media-glass panel playback.',
    sourcePath: '素材库/285205_medium.mp4',
    status: 'active',
    url: '/art/videos/285205_medium.mp4',
  },
  {
    id: 'dark-rock',
    kind: 'texture',
    loadingTier: 'lazy',
    notes: 'Candidate black rock / ink material. Extract lower-resolution texture maps before production use.',
    sourcePath: '素材库/dark_rock_4k.blend.zip',
    status: 'candidate',
  },
  {
    id: 'rogland-night',
    kind: 'hdri',
    loadingTier: 'future',
    notes: 'Large night EXR. Requires a reduced 1k/2k environment version before runtime use.',
    sourcePath: '素材库/rogland_clear_night_4k.exr',
    status: 'candidate',
  },
  {
    id: 'sakura-blossom-reference',
    kind: 'model',
    loadingTier: 'reference',
    notes: 'Very large sakura model. Use as visual reference only; prefer procedural petals for runtime.',
    sourcePath: '素材库/cc0___sakura_cherry_blossom.glb',
    status: 'candidate',
  },
  {
    id: 'gothic-statue',
    kind: 'model',
    loadingTier: 'future',
    notes: 'Future Source archive artifact candidate. Do not load in the first redesign slice.',
    sourcePath: '素材库/gothic_statue_4k.blend.zip',
    status: 'future',
  },
  {
    id: 'chinese-chandelier',
    kind: 'model',
    loadingTier: 'future',
    notes: 'Future oriental cyber light reference. Needs conversion and optimization.',
    sourcePath: '素材库/chinese_chandelier_4k.blend.zip',
    status: 'future',
  },
  {
    id: 'anime-ip-head',
    kind: 'visual-reference',
    loadingTier: 'reference',
    notes: 'Potential existing-IP model. Do not ship publicly without license review.',
    sourcePath: '素材库/anime_head_-_mako_kill_la_kill.glb',
    status: 'blocked',
  },
] as const satisfies readonly SiteAsset[]

export type SiteAssetId = (typeof siteAssets)[number]['id']

export function getSiteAsset(id: SiteAssetId) {
  return siteAssets.find((asset) => asset.id === id)
}

export function getAssetsByStatus(status: AssetStatus) {
  return siteAssets.filter((asset) => asset.status === status)
}
