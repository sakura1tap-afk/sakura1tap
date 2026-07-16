import { json, toHeadResponse } from '../lib/http.js'

export async function handleHealth(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json({ error: '请求方法不支持' }, 405, { Allow: 'GET, HEAD' })
  }

  let database = 'unavailable'
  let status = 503

  if (env.REACTION_DB) {
    try {
      await env.REACTION_DB.prepare('SELECT 1 AS ok').first()
      database = 'ready'
      status = 200
    } catch (error) {
      console.error('Health check database probe failed', error)
    }
  }

  const response = json({
    database,
    service: 'sakura1tap',
    status: status === 200 ? 'ok' : 'degraded',
  }, status)

  return request.method === 'HEAD' ? toHeadResponse(response) : response
}
