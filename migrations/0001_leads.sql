-- Lead log for the website forms (no attachments are stored).
CREATE TABLE IF NOT EXISTS lead_counters (
  year INTEGER PRIMARY KEY,
  value INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  lead_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  service TEXT, industry TEXT, company TEXT, contact_name TEXT, email TEXT, phone TEXT, location TEXT,
  source_page TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
  urgent INTEGER DEFAULT 0,
  ip_hash TEXT,
  delivered INTEGER DEFAULT 0,
  payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_ip_time ON leads (ip_hash, submitted_at);
CREATE INDEX IF NOT EXISTS idx_leads_service ON leads (service);
