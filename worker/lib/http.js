const JSON_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
}

export function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    headers: { ...JSON_HEADERS, ...extraHeaders },
    status,
  })
}

export function toHeadResponse(response) {
  return new Response(null, { headers: response.headers, status: response.status })
}

/**
 * Best-effort flood guard. Workers isolates are short lived, so this is not a security
 * boundary — it just stops a single client hammering the D1 write path in a hot isolate.
 * The leaderboard itself only ever accepts improvements, so rankings cannot be poisoned.
 */
const buckets = new Map()

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now - bucket.start >= windowMs) {
    buckets.set(key, { start: now, count: 1 })
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now - v.start >= windowMs) buckets.delete(k)
    }
    return { allowed: true, retryAfter: 0 }
  }
  bucket.count += 1
  if (bucket.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.start + windowMs - now) / 1000) }
  }
  return { allowed: true, retryAfter: 0 }
}

export function clientKey(request) {
  return request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown'
}

export function apiError(error) {
  const message = error instanceof Error ? error.message : 'Unknown API error'
  const missingBinding = message.includes('REACTION_DB binding is missing')
  console.error('API request failed', error)
  return json(
    { error: missingBinding ? '排行榜数据库尚未绑定' : '服务暂时不可用' },
    missingBinding ? 503 : 500,
  )
}
