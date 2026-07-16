import { apiError, json } from './lib/http.js'
import { handleHealth } from './routes/health.js'
import { handleReactionLeaderboard } from './routes/reactionLeaderboard.js'

const API_ROUTES = new Map([
  ['/api/health', handleHealth],
  ['/api/reaction-leaderboard', handleReactionLeaderboard],
])

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
    if (!contentType.includes('text/html')) return response

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
