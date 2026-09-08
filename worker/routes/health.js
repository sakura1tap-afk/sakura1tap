import { json, toHeadResponse } from '../lib/http.js'

const CRITICAL_ASSETS = [
  { path: '/cinematic/entry-v2.webp', type: 'image/' },
  { path: '/cinematic/entry-v2-mobile.webp', type: 'image/' },
  { path: '/cinematic/bridge.webp', type: 'image/' },
  { path: '/cinematic/awakening.webp', type: 'image/' },
  { path: '/art/videos/272021_medium.mp4', type: 'video/' },
  { path: '/art/videos/285224_medium.mp4', type: 'video/' },
  { path: '/models/study.glb', type: 'model/' },
  { path: '/vendor/live2dcubismcore.min.js', type: 'javascript' },
  { path: '/live2d/Fern/fern.model3.json', type: 'application/json' },
  { path: '/live2d/Fern/fern.4096/texture_02.png', type: 'image/' },
  { path: '/live2d/WhiteAngelOriginal/%E6%97%A0%E5%8F%A3%E5%A4%A9%E4%BD%BF%205.model3.json', type: 'application/json' },
  { path: '/live2d/WhiteAngelOriginal/%E6%97%A0%E5%8F%A3%E5%A4%A9%E4%BD%BF%205.4096/texture_00.png', type: 'image/' },
]

async function probeAsset(request, assets, asset) {
  try {
    const url = new URL(asset.path, request.url)
    const response = await assets.fetch(new Request(url, { method: 'HEAD' }))
    const contentType = response.headers.get('content-type') ?? ''
    return response.ok && contentType.includes(asset.type) ? null : asset.path
  } catch {
    return asset.path
  }
}

export async function handleHealth(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json({ error: '请求方法不支持' }, 405, { Allow: 'GET, HEAD' })
  }

  let database = 'unavailable'
  let databaseReady = false

  if (env.REACTION_DB) {
    try {
      await env.REACTION_DB.prepare('SELECT 1 AS ok').first()
      database = 'ready'
      databaseReady = true
    } catch (error) {
      console.error('Health check database probe failed', error)
    }
  }

  const failedAssets = env.ASSETS
    ? (await Promise.all(CRITICAL_ASSETS.map((asset) => probeAsset(request, env.ASSETS, asset)))).filter(Boolean)
    : CRITICAL_ASSETS.map((asset) => asset.path)
  const assetsReady = failedAssets.length === 0
  const status = databaseReady && assetsReady ? 200 : 503

  const response = json({
    assets: {
      checked: CRITICAL_ASSETS.length,
      failed: failedAssets,
      status: assetsReady ? 'ready' : 'degraded',
    },
    database,
    service: 'sakura1tap',
    status: status === 200 ? 'ok' : 'degraded',
  }, status)

  return request.method === 'HEAD' ? toHeadResponse(response) : response
}
