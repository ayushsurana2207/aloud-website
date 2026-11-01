CREATE TABLE early_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
