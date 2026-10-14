-- Request tracking: current status on each lead plus a timeline of status changes.
ALTER TABLE leads ADD COLUMN status TEXT NOT NULL DEFAULT 'received';
ALTER TABLE leads ADD COLUMN status_updated_at TEXT;

CREATE TABLE IF NOT EXISTS lead_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  at TEXT NOT NULL,
  notified INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead ON lead_events (lead_id, at);
CREATE INDEX IF NOT EXISTS idx_leads_submitted ON leads (submitted_at);
