import { apiError, json } from './lib/http.js'
import { handleHealth } from './routes/health.js'
import { handleReactionLeaderboard } from './routes/reactionLeaderboard.js'

const API_ROUTES = new Map([
  ['/api/health', handleHealth],
  ['/api/reaction-leaderboard', handleReactionLeaderboard],
])

const ASSET_PATH_PATTERN = /\.[a-z0-9]{2,8}$/i
const HASHED_ASSET_PATH_PATTERN = /^\/assets\/.*-[a-z0-9_-]{6,}\.(?:css|js)$/i
const HEAVY_ASSET_PATH_PATTERN = /^\/(?:art|cinematic|images|live2d|models|vendor)\//

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const apiHandler = API_ROUTES.get(url.pathname)
    if (apiHandler) {
      try {
        return await apiHandler(request, env)
      } catch (error) {
        return apiError(error)
      }
    }
    if (url.pathname.startsWith('/api/')) {
      return json({ error: '接口不存在' }, 404)
    }

    const response = await env.ASSETS.fetch(request)
    const contentType = response.headers.get('content-type') ?? ''
    if (ASSET_PATH_PATTERN.test(url.pathname) && contentType.includes('text/html')) {
      return new Response(null, {
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
        status: 404,
      })
    }
    if (!contentType.includes('text/html')) {
      const headers = new Headers(response.headers)
      headers.set('X-Content-Type-Options', 'nosniff')
      if (HASHED_ASSET_PATH_PATTERN.test(url.pathname)) {
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      } else if (HEAVY_ASSET_PATH_PATTERN.test(url.pathname)) {
        headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
      }
      return new Response(response.body, {
        headers,
        status: response.status,
        statusText: response.statusText,
      })
    }

    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    headers.set('Expires', '0')
    headers.set('Pragma', 'no-cache')
    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    })
  },
}
