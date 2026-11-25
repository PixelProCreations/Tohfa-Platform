-- =============================================================================
-- 0204_payout_reject_and_intimate_templates.sql
-- D2 / D3: Payout rejection metadata columns + notification templates for
-- PAYOUT_INTIMATED and PAYOUT_REJECTED.
-- =============================================================================

-- +migrate Up
ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS rejected_by      uuid        REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS rejected_at      timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS intimated_at     timestamptz,
  ADD COLUMN IF NOT EXISTS intimated_by     uuid        REFERENCES users(id);

ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_rejected_pair_chk;
ALTER TABLE payouts ADD CONSTRAINT payouts_rejected_pair_chk
  CHECK ((rejected_by IS NULL) = (rejected_at IS NULL));

INSERT INTO notification_templates (code, channel, locale, subject, body_template, is_active) VALUES
  ('PAYOUT_INTIMATED', 'IN_APP', 'en', 'Payout Update',
   'Your payout {{reference}} of ₹{{amount}} has been intimated. {{note}}', true),
  ('PAYOUT_INTIMATED', 'PUSH', 'en', 'Payout Update',
   'Payout {{reference}} (₹{{amount}}) intimation sent.', true),
  ('PAYOUT_INTIMATED', 'EMAIL', 'en', 'Payout Intimation — {{reference}}',
   'Dear Farmer, your payout {{reference}} of ₹{{amount}} is scheduled/released. {{note}}', true),
  ('PAYOUT_REJECTED', 'IN_APP', 'en', 'Payout Rejected',
   'Your payout request {{reference}} of ₹{{amount}} was rejected. Reason: {{reason}}', true),
  ('PAYOUT_REJECTED', 'PUSH', 'en', 'Payout Rejected',
   'Payout {{reference}} (₹{{amount}}) rejected: {{reason}}', true)
ON CONFLICT (code, channel, locale) DO NOTHING;

-- +migrate Down
DELETE FROM notification_templates t
 WHERE t.code IN ('PAYOUT_INTIMATED', 'PAYOUT_REJECTED')
   AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.template_id = t.id);

UPDATE payouts
   SET status = 'PENDING_APPROVAL'
 WHERE status = 'REJECTED';

ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_rejected_pair_chk;
ALTER TABLE payouts
  DROP COLUMN IF EXISTS intimated_by,
  DROP COLUMN IF EXISTS intimated_at,
  DROP COLUMN IF EXISTS rejection_reason,
  DROP COLUMN IF EXISTS rejected_at,
  DROP COLUMN IF EXISTS rejected_by;
