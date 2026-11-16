-- =============================================================================
-- 0089_batch5_integrity_fixes.sql
-- Batch 5 integrity and spec fixes:
-- 1. fair_prices & retail_prices append-only triggers (BR-08c, P0-32)
-- 2. learning_groups archived_at column (BR-59, P0-33)
-- 3. notifications status CHECK including 'SKIPPED' (BR-52, P0-35)
-- 4. produce_listings rejection_reason_code column (BR-29, P0-37)
-- =============================================================================

-- +migrate Up

-- 1. fair_prices and retail_prices append-only triggers
CREATE OR REPLACE FUNCTION trg_fair_prices_append_only()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'fair_prices is append-only: DELETE is not permitted'
            USING ERRCODE = '23514';
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.id IS DISTINCT FROM OLD.id
           OR NEW.crop_id IS DISTINCT FROM OLD.crop_id
           OR NEW.grade IS DISTINCT FROM OLD.grade
           OR NEW.ceiling_price IS DISTINCT FROM OLD.ceiling_price
           OR NEW.effective_from IS DISTINCT FROM OLD.effective_from
           OR NEW.frequency IS DISTINCT FROM OLD.frequency
           OR NEW.set_by IS DISTINCT FROM OLD.set_by
           OR NEW.notes IS DISTINCT FROM OLD.notes
           OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'fair_prices is append-only: only effective_to and updated_at may be updated'
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fair_prices_append_only ON fair_prices;
CREATE TRIGGER trg_fair_prices_append_only
    BEFORE UPDATE OR DELETE ON fair_prices
    FOR EACH ROW
    EXECUTE FUNCTION trg_fair_prices_append_only();

CREATE OR REPLACE FUNCTION trg_retail_prices_append_only()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'retail_prices is append-only: DELETE is not permitted'
            USING ERRCODE = '23514';
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.id IS DISTINCT FROM OLD.id
           OR NEW.crop_id IS DISTINCT FROM OLD.crop_id
           OR NEW.grade IS DISTINCT FROM OLD.grade
           OR NEW.price IS DISTINCT FROM OLD.price
           OR NEW.markup_pct IS DISTINCT FROM OLD.markup_pct
           OR NEW.gst_inclusive IS DISTINCT FROM OLD.gst_inclusive
           OR NEW.fair_price_id IS DISTINCT FROM OLD.fair_price_id
           OR NEW.effective_from IS DISTINCT FROM OLD.effective_from
           OR NEW.set_by IS DISTINCT FROM OLD.set_by
           OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'retail_prices is append-only: only effective_to and updated_at may be updated'
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_retail_prices_append_only ON retail_prices;
CREATE TRIGGER trg_retail_prices_append_only
    BEFORE UPDATE OR DELETE ON retail_prices
    FOR EACH ROW
    EXECUTE FUNCTION trg_retail_prices_append_only();

-- 2. learning_groups archived_at column
ALTER TABLE learning_groups ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_learning_groups_archived_at ON learning_groups (archived_at);

-- 3. notifications status CHECK including 'SKIPPED'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_status_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_status_check
    CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ', 'SKIPPED'));

-- 4. produce_listings rejection_reason_code column
ALTER TABLE produce_listings ADD COLUMN IF NOT EXISTS rejection_reason_code TEXT;

-- +migrate Down
ALTER TABLE produce_listings DROP COLUMN IF EXISTS rejection_reason_code;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_status_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_status_check
    CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ'));
DROP INDEX IF EXISTS idx_learning_groups_archived_at;
ALTER TABLE learning_groups DROP COLUMN IF EXISTS archived_at;
DROP TRIGGER IF EXISTS trg_retail_prices_append_only ON retail_prices;
DROP FUNCTION IF EXISTS trg_retail_prices_append_only();
DROP TRIGGER IF EXISTS trg_fair_prices_append_only ON fair_prices;
DROP FUNCTION IF EXISTS trg_fair_prices_append_only();
