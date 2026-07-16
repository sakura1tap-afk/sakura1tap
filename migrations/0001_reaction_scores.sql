CREATE TABLE IF NOT EXISTS reaction_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  average_ms INTEGER NOT NULL,
  trials_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reaction_scores_average
  ON reaction_scores (average_ms, updated_at);
