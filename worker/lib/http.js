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

export function apiError(error) {
  const message = error instanceof Error ? error.message : 'Unknown API error'
  const missingBinding = message.includes('REACTION_DB binding is missing')
  console.error('API request failed', error)
  return json(
    { error: missingBinding ? '排行榜数据库尚未绑定' : '服务暂时不可用' },
    missingBinding ? 503 : 500,
  )
}
