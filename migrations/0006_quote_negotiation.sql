-- One round of negotiation per request (functions/api/payments.ts): on a first proposal the client
-- may ask once for a discount or a different payment schedule; the revised proposal is final.
ALTER TABLE quotes ADD COLUMN negotiable INTEGER NOT NULL DEFAULT 1;
ALTER TABLE quotes ADD COLUMN change_request TEXT;        -- JSON: {"discount":bool,"schedule":bool,"note":"..."}
ALTER TABLE quotes ADD COLUMN change_requested_at TEXT;
ALTER TABLE quotes ADD COLUMN replaces TEXT;              -- quote_id of the proposal this one revises
