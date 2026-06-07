CREATE TABLE IF NOT EXISTS jit_escalations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '[]',
  justification TEXT NOT NULL DEFAULT '',
  approved_by TEXT DEFAULT '',
  approved_by_name TEXT DEFAULT '',
  requested_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','revoked'))
);

CREATE INDEX IF NOT EXISTS idx_jit_user_id ON jit_escalations(user_id);
CREATE INDEX IF NOT EXISTS idx_jit_expires ON jit_escalations(expires_at);
CREATE INDEX IF NOT EXISTS idx_jit_status ON jit_escalations(status);