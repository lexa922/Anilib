CREATE TABLE IF NOT EXISTS user_library (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  user_score REAL CHECK(user_score >= 0 AND user_score <= 10),
  status TEXT CHECK(status IN ('watching', 'completed', 'dropped', 'plan_to_watch')) DEFAULT 'plan_to_watch',
  episodes_watched INTEGER DEFAULT 0,
  notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL DEFAULT 'Anime Fan',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO user_profile (id, username, avatar_url, bio)
VALUES ('default', 'Anime Fan', 'https://api.dicebear.com/7.x/bottts/svg?seed=AniLib', 'Любитель аніме та якісної аналітики');

