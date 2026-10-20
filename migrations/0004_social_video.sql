-- Videos for TikTok / YouTube Shorts posts, and OAuth tokens that rotate (TikTok refresh tokens).
ALTER TABLE social_posts ADD COLUMN video TEXT;

CREATE TABLE IF NOT EXISTS social_tokens (
  channel TEXT PRIMARY KEY,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TEXT -- UTC "YYYY-MM-DD HH:MM:SS"
);
