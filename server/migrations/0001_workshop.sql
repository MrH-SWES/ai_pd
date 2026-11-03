CREATE TABLE questions (id TEXT PRIMARY KEY, question TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'general', status TEXT NOT NULL DEFAULT 'pending', answer TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX questions_status_created ON questions(status, created_at);
CREATE TABLE entries (id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', body TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX entries_kind_created ON entries(kind, created_at);
CREATE TABLE rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
