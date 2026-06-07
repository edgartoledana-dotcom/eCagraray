-- =============================================================================
-- e-Cagraray Sessions Table — supports token validation, expiry, inactivity
-- =============================================================================

CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY NOT NULL,
  user_id       TEXT NOT NULL,
  token_hash    TEXT NOT NULL,       -- SHA-256 of the session token (never store raw token)
  expires_at    TEXT NOT NULL,       -- ISO timestamp when session expires
  last_activity TEXT NOT NULL,       -- ISO timestamp of last verified request
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  remember      INTEGER NOT NULL DEFAULT 0,  -- 1 = "remember me" (long expiry)
  ip_address    TEXT DEFAULT '',
  user_agent    TEXT DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_activity ON sessions(last_activity);

-- Cleanup expired sessions periodically via a trigger or app-level logic
