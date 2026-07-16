type D1Statement = {
  all<T>(): Promise<{ results?: T[] }>
  bind(...values: unknown[]): D1Statement
  first<T>(): Promise<T | null>
  run(): Promise<unknown>
}

type D1Database = {
  prepare(query: string): D1Statement
}

type FunctionContext = {
  env: { REACTION_DB?: D1Database }
  request: Request
}

type ScoreRow = {
  averageMs: number
  nickname: string
  updatedAt: string
}

const headers = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
}

let schemaInitialization: Promise<void> | null = null

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { headers, status })
}

function requireDatabase(context: FunctionContext) {
  const database = context.env.REACTION_DB
  if (!database) throw new Error('REACTION_DB binding is missing')
  return database
}

function ensureSchema(database: D1Database) {
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
      await database.prepare('CREATE INDEX IF NOT EXISTS idx_reaction_scores_average ON reaction_scores (average_ms, updated_at)').run()
      await database.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_reaction_scores_nickname ON reaction_scores (nickname)').run()
    })().catch((error) => {
      schemaInitialization = null
      throw error
    })
  }
  return schemaInitialization
}

async function listScores(database: D1Database) {
  const result = await database.prepare(`
    SELECT nickname, average_ms AS averageMs, updated_at AS updatedAt
    FROM reaction_scores
    WHERE average_ms BETWEEN 80 AND 1500
    ORDER BY average_ms ASC, updated_at ASC
    LIMIT 10
  `).all<ScoreRow>()
  return (result.results ?? []).map((entry, index) => ({ ...entry, rank: index + 1 }))
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown leaderboard error'
  const missingBinding = message.includes('REACTION_DB binding is missing')
  return json({ error: missingBinding ? '排行榜数据库尚未绑定' : '排行榜服务暂时不可用' }, missingBinding ? 503 : 500)
}

export const onRequestGet = async (context: FunctionContext) => {
  try {
    const database = requireDatabase(context)
    await ensureSchema(database)
    return json({ entries: await listScores(database) })
  } catch (error) {
    return errorResponse(error)
  }
}

export const onRequestPost = async (context: FunctionContext) => {
  try {
    const contentLength = Number(context.request.headers.get('content-length') ?? 0)
    if (contentLength > 4096) return json({ error: '提交内容过大' }, 413)

    const database = requireDatabase(context)
    await ensureSchema(database)
    const body = await context.request.json() as {
      nickname?: unknown
      results?: unknown
    }

    const nickname = typeof body.nickname === 'string' ? body.nickname.trim().normalize('NFKC') : ''
    const results = Array.isArray(body.results) ? body.results : []

    if (!/^[\p{L}\p{N}_-]{2,16}$/u.test(nickname)) return json({ error: '昵称格式不正确' }, 400)
    if (results.length !== 5 || !results.every((value) => Number.isInteger(value) && value >= 80 && value <= 1500)) {
      return json({ error: '成绩数据不正确' }, 400)
    }

    const averageMs = Math.round(results.reduce((sum: number, value) => sum + Number(value), 0) / results.length)
    const existing = await database.prepare('SELECT average_ms AS averageMs FROM reaction_scores WHERE nickname = ?').bind(nickname).first<{ averageMs: number }>()
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

    const saved = await database.prepare('SELECT average_ms AS averageMs FROM reaction_scores WHERE nickname = ?').bind(nickname).first<{ averageMs: number }>()
    const entries = await listScores(database)
    const rank = entries.find((entry) => entry.nickname === nickname && entry.averageMs === saved?.averageMs)?.rank ?? null
    return json({ bestAverageMs: saved?.averageMs ?? averageMs, entries, improved, isNew, rank })
  } catch (error) {
    return errorResponse(error)
  }
}
