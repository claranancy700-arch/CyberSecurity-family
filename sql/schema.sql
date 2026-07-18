-- CyberTech-Family complaint registrations
CREATE TABLE IF NOT EXISTS registrations (
  local_id TEXT PRIMARY KEY,
  complaint_id TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_payment',
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  organization TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  has_proof TEXT NOT NULL DEFAULT '',
  proof_details TEXT NOT NULL DEFAULT '',
  contact_method TEXT NOT NULL DEFAULT '',
  tx_hash TEXT NOT NULL DEFAULT '',
  admin_notes TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  admitted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations (status);
CREATE INDEX IF NOT EXISTS idx_registrations_complaint_id ON registrations (complaint_id);
CREATE INDEX IF NOT EXISTS idx_registrations_submitted_at ON registrations (submitted_at DESC);
