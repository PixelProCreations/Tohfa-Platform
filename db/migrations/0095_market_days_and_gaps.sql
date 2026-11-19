-- Migration 0095: Market days, stock adjustment code & evidence, critical stock config, and allocation enhancements
-- Supports Market Day CRUD (BR-162), Stock Adjustment evidence & stable code (BR-164, BR-16),
-- Critical stock threshold (BR-165), and per-warehouse/grade allocation config (BR-166).

-- +migrate Up

-- 1. Stable adjustment code on stock_adjustments
CREATE SEQUENCE IF NOT EXISTS stock_adjustment_code_seq START WITH 100;
ALTER TABLE stock_adjustments ADD COLUMN IF NOT EXISTS adjustment_code text;
UPDATE stock_adjustments SET adjustment_code = 'ADJ-' || lpad(nextval('stock_adjustment_code_seq')::text, 6, '0') WHERE adjustment_code IS NULL;
ALTER TABLE stock_adjustments ALTER COLUMN adjustment_code SET NOT NULL;
ALTER TABLE stock_adjustments ALTER COLUMN adjustment_code SET DEFAULT ('ADJ-' || lpad(nextval('stock_adjustment_code_seq')::text, 6, '0'));
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_adjustments_code ON stock_adjustments(adjustment_code);

-- 2. Evidence photos on stock adjustments
CREATE TABLE IF NOT EXISTS stock_adjustment_evidence (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_id uuid        NOT NULL REFERENCES stock_adjustments(id) ON DELETE CASCADE,
    url           text        NOT NULL CHECK (btrim(url) <> ''),
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_adjustment_evidence_adj ON stock_adjustment_evidence(adjustment_id);

-- 3. Critical stock threshold in system_config
INSERT INTO system_config (key, value, data_type, description)
VALUES (
    'critical_stock_threshold_kg',
    '10',
    'number',
    'Critical stock threshold in kg. Inventory groups below this threshold count as critical stock on the inventory health dashboard.'
)
ON CONFLICT (key) DO NOTHING;

-- 4. Allocation config per-warehouse and produce grade override
ALTER TABLE allocation_config ADD COLUMN IF NOT EXISTS warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE;
ALTER TABLE allocation_config ADD COLUMN IF NOT EXISTS grade text;
CREATE INDEX IF NOT EXISTS idx_allocation_config_warehouse ON allocation_config(warehouse_id);

CREATE OR REPLACE FUNCTION public.app_allocation_config_sum_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    v_window        date;
    v_crop_id       uuid;
    v_warehouse_id  uuid;
    v_grade         text;
    v_sum           numeric(6,2);
    v_count         integer;
BEGIN
    v_window       := COALESCE(NEW.effective_from, OLD.effective_from);
    v_crop_id      := COALESCE(NEW.crop_id, OLD.crop_id);
    v_warehouse_id := COALESCE(NEW.warehouse_id, OLD.warehouse_id);
    v_grade        := COALESCE(NEW.grade, OLD.grade);

    SELECT COALESCE(SUM(percentage), 0), COUNT(*)
      INTO v_sum, v_count
      FROM allocation_config
     WHERE effective_from = v_window
       AND crop_id IS NOT DISTINCT FROM v_crop_id
       AND warehouse_id IS NOT DISTINCT FROM v_warehouse_id
       AND grade IS NOT DISTINCT FROM v_grade;

    IF v_count > 0 AND v_sum <> 100 THEN
        RAISE EXCEPTION
            'BR-12b: allocation percentages for window % sum to %, must be 100', v_window, v_sum
            USING ERRCODE = '23514', HINT = 'code: ALLOCATION_SUM_INVALID';
    END IF;

    RETURN NULL;
END
$function$;

DROP INDEX IF EXISTS idx_allocation_config_default_unique;
DROP INDEX IF EXISTS idx_allocation_config_crop_unique;
CREATE UNIQUE INDEX IF NOT EXISTS uq_allocation_config_dimensions
  ON allocation_config (channel, effective_from, warehouse_id, crop_id, grade) NULLS NOT DISTINCT;

-- 5. Market days schedule
CREATE TABLE IF NOT EXISTS market_days (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id  uuid        NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    market_date   date        NOT NULL,
    start_time    text        NOT NULL CHECK (btrim(start_time) <> ''),
    end_time      text        NOT NULL CHECK (btrim(end_time) <> ''),
    is_active     boolean     NOT NULL DEFAULT true,
    notes         text,
    created_by    uuid        REFERENCES users(id),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz,
    CONSTRAINT uq_market_days_warehouse_date UNIQUE (warehouse_id, market_date)
);
CREATE INDEX IF NOT EXISTS idx_market_days_warehouse ON market_days(warehouse_id, market_date);

-- +migrate Down

DROP TABLE IF EXISTS market_days;
ALTER TABLE allocation_config DROP COLUMN IF EXISTS grade;
ALTER TABLE allocation_config DROP COLUMN IF EXISTS warehouse_id;
DELETE FROM system_config WHERE key = 'critical_stock_threshold_kg';
DROP TABLE IF EXISTS stock_adjustment_evidence;
DROP INDEX IF EXISTS uq_stock_adjustments_code;
ALTER TABLE stock_adjustments DROP COLUMN IF EXISTS adjustment_code;
DROP SEQUENCE IF EXISTS stock_adjustment_code_seq;
