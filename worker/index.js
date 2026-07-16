const JSON_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
}

let schemaInitialization = null

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    headers: { ...JSON_HEADERS, ...extraHeaders },
    status,
  })
}

function requireDatabase(env) {
  if (!env.REACTION_DB) throw new Error('REACTION_DB binding is missing')
  return env.REACTION_DB
}

function ensureSchema(database) {
  if (!schemaInitialization) {
    schemaInitialization = (async () => {
      await database.prepare(`
        CREATE TABLE IF NOT EXISTS reaction_scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id TEXT NOT NULL UNIQUE,
          nickname TEXT NOT NULL,
          average_ms INTEGER NOT NULL,
          trials_json TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `).run()
      await database.prepare(
        'CREATE INDEX IF NOT EXISTS idx_reaction_scores_average ON reaction_scores (average_ms, updated_at)',
      ).run()
      await database.prepare(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_reaction_scores_nickname ON reaction_scores (nickname)',
      ).run()
    })().catch((error) => {
      schemaInitialization = null
      throw error
    })
  }
  return schemaInitialization
}

async function listScores(database) {
  const result = await database.prepare(`
    SELECT nickname, average_ms AS averageMs, updated_at AS updatedAt
    FROM reaction_scores
    WHERE average_ms BETWEEN 80 AND 1500
    ORDER BY average_ms ASC, updated_at ASC
    LIMIT 10
  `).all()
  return (result.results ?? []).map((entry, index) => ({ ...entry, rank: index + 1 }))
}

function errorResponse(error) {
  const message = error instanceof Error ? error.message : 'Unknown leaderboard error'
  const missingBinding = message.includes('REACTION_DB binding is missing')
  return json(
    { error: missingBinding ? '排行榜数据库尚未绑定' : '排行榜服务暂时不可用' },
    missingBinding ? 503 : 500,
  )
}

async function handleGet(env) {
  try {
    const database = requireDatabase(env)
    await ensureSchema(database)
    return json({ entries: await listScores(database) })
  } catch (error) {
    return errorResponse(error)
  }
}

async function handlePost(request, env) {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0)
    if (contentLength > 4096) return json({ error: '提交内容过大' }, 413)

    const database = requireDatabase(env)
    await ensureSchema(database)
    const body = await request.json()
    const nickname = typeof body.nickname === 'string' ? body.nickname.trim().normalize('NFKC') : ''
    const results = Array.isArray(body.results) ? body.results : []

    if (!/^[\p{L}\p{N}_-]{2,16}$/u.test(nickname)) return json({ error: '昵称格式不正确' }, 400)
    if (
      results.length !== 5
      || !results.every((value) => Number.isInteger(value) && value >= 80 && value <= 1500)
    ) {
      return json({ error: '成绩数据不正确' }, 400)
    }

    const averageMs = Math.round(results.reduce((sum, value) => sum + value, 0) / results.length)
    const existing = await database.prepare(
      'SELECT average_ms AS averageMs FROM reaction_scores WHERE nickname = ?',
    ).bind(nickname).first()
    const isNew = existing === null
    const improved = isNew || averageMs < existing.averageMs

    await database.prepare(`
      INSERT INTO reaction_scores (player_id, nickname, average_ms, trials_json)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(nickname) DO UPDATE SET
        average_ms = excluded.average_ms,
        trials_json = excluded.trials_json,
        updated_at = CURRENT_TIMESTAMP
      WHERE excluded.average_ms < reaction_scores.average_ms
    `).bind(`id:${nickname}`, nickname, averageMs, JSON.stringify(results)).run()

    const saved = await database.prepare(
      'SELECT average_ms AS averageMs FROM reaction_scores WHERE nickname = ?',
    ).bind(nickname).first()
    const entries = await listScores(database)
    const rank = entries.find(
      (entry) => entry.nickname === nickname && entry.averageMs === saved?.averageMs,
    )?.rank ?? null
    return json({ bestAverageMs: saved?.averageMs ?? averageMs, entries, improved, isNew, rank })
  } catch (error) {
    return errorResponse(error)
  }
}

async function handleLeaderboard(request, env) {
  if (request.method === 'GET' || request.method === 'HEAD') {
    const response = await handleGet(env)
    return request.method === 'HEAD'
      ? new Response(null, { headers: response.headers, status: response.status })
      : response
  }
  if (request.method === 'POST') return handlePost(request, env)
  return json({ error: '请求方法不支持' }, 405, { Allow: 'GET, HEAD, POST' })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/reaction-leaderboard') {
      return handleLeaderboard(request, env)
    }
    return env.ASSETS.fetch(request)
  },
}
