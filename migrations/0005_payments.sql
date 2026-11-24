-- Quotes and payment schedules (functions/api/payments.ts). Amounts are in halalas, VAT inclusive
-- unless named subtotal. The offer documents are e-mailed to the client and not stored here.
CREATE TABLE IF NOT EXISTS quotes (
  quote_id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  lang TEXT NOT NULL DEFAULT 'ar',
  title TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  vat INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  documents TEXT,
  valid_until TEXT NOT NULL,
  created_at TEXT NOT NULL,
  accepted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_quotes_lead ON quotes (lead_id, created_at);

CREATE TABLE IF NOT EXISTS quote_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  label TEXT NOT NULL,
  trigger TEXT NOT NULL,
  percent REAL NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  due_at TEXT,
  paid_at TEXT,
  invoice_id TEXT,
  invoice_url TEXT,
  payment_id TEXT,
  paid_by TEXT,
  reminders INTEGER NOT NULL DEFAULT 0,
  last_reminder_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_milestones_quote ON quote_milestones (quote_id, seq);
CREATE INDEX IF NOT EXISTS idx_milestones_due ON quote_milestones (status, due_at);
