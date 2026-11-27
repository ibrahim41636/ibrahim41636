-- Client portal (functions/api/portal.ts): one private link per request that follows it from
-- submission to completion, the 3 hour proposal timer, meetings, the electronic contract, the
-- technical work stages and the Google Drive archive. Every change is additive.

-- Request level: the client's private portal link, when the first proposal is due, and the archive folder.
ALTER TABLE leads ADD COLUMN portal_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_portal ON leads (portal_token);
ALTER TABLE leads ADD COLUMN quote_due_at TEXT;
ALTER TABLE leads ADD COLUMN drive_folder_id TEXT;
ALTER TABLE leads ADD COLUMN drive_folder_url TEXT;

-- What changed in a proposal version, as written for the client.
ALTER TABLE quotes ADD COLUMN revision_note TEXT;

-- The work stage whose completion makes an instalment due (NULL for payments due on approval).
ALTER TABLE quote_milestones ADD COLUMN stage_seq INTEGER;

-- Meetings the client asks for to discuss the proposal and scope. The request is kept as written.
CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT NOT NULL,
  quote_id TEXT NOT NULL,
  mode TEXT NOT NULL,                       -- online | office | site | phone
  preferred TEXT NOT NULL,                  -- the client's preferred times
  topics TEXT,
  status TEXT NOT NULL DEFAULT 'requested', -- requested | scheduled | held | cancelled
  requested_at TEXT NOT NULL,
  scheduled_at TEXT,                        -- agreed time, Riyadh local "YYYY-MM-DD HH:MM"
  location TEXT,                            -- meeting link or address
  outcome TEXT,                             -- summary recorded after the meeting, shown to the client
  needs_revision INTEGER NOT NULL DEFAULT 0,
  held_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_meetings_lead ON meetings (lead_id, requested_at);

-- The electronic contract: details entered by the client, the acceptance record, and the issued
-- document (frozen at issue, signed and stamped by Selorin).
CREATE TABLE IF NOT EXISTS contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_no TEXT NOT NULL UNIQUE,
  lead_id TEXT NOT NULL,
  quote_id TEXT NOT NULL UNIQUE,
  lang TEXT NOT NULL DEFAULT 'ar',
  legal_name TEXT NOT NULL,
  cr_number TEXT,
  address TEXT,
  signatory_name TEXT NOT NULL,
  signatory_title TEXT NOT NULL,
  signatory_phone TEXT NOT NULL,
  signatory_email TEXT NOT NULL,
  accepted_at TEXT NOT NULL,
  accept_ip_hash TEXT,
  accept_agent TEXT,
  status TEXT NOT NULL DEFAULT 'details',   -- details | issued | countersigned
  issued_at TEXT,
  document TEXT,
  drive_file_id TEXT,
  countersigned_at TEXT,
  countersigned_file TEXT,
  start_override INTEGER NOT NULL DEFAULT 0 -- staff started the work before the signed copy arrived
);

-- Technical work stages from the proposal's methodology.
CREATE TABLE IF NOT EXISTS work_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | active | done
  started_at TEXT,
  completed_at TEXT,
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_stages_quote ON work_stages (quote_id, seq);

-- Small key/value store: contract profile, signature and stamp images, Drive root folder.
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);

-- One row per timer alert already sent, so the cron never repeats one.
CREATE TABLE IF NOT EXISTS sla_alerts (key TEXT PRIMARY KEY, at TEXT NOT NULL);
