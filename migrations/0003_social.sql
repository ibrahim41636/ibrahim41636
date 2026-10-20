-- Social publishing queue: one row per post per channel. Article posts are queued automatically by
-- the Worker cron (source_key makes that idempotent); staff can add, edit or cancel posts at /ar/admin/social/.
CREATE TABLE IF NOT EXISTS social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT UNIQUE,          -- "ar/slug:launch:linkedin"; NULL for manual posts
  channel TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'ar',
  variant TEXT NOT NULL,           -- launch | takeaway | faq | evergreen | manual
  title TEXT,
  text TEXT NOT NULL,
  link TEXT,
  image TEXT,
  scheduled_at TEXT NOT NULL,      -- UTC "YYYY-MM-DD HH:MM:SS"
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | publishing | published | failed | cancelled
  attempts INTEGER NOT NULL DEFAULT 0,
  external_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_social_due ON social_posts (status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_leads_utm ON leads (utm_source, submitted_at);
