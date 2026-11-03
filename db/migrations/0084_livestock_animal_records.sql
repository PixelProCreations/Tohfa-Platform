-- =============================================================================
-- 0084_livestock_animal_records.sql
--
-- Backs the rest of the farmer app's AnimalDetailScreen (health, breeding,
-- feed, housing and hygiene tabs) with real tables, and extends production
-- logging for the screen's produce tab. Rules: BR-136..BR-139 (docs/rules.md).
--
-- Six new tables, one per record kind the screen shows:
--   livestock_health_records     vaccination / deworming / checkup / treatment
--   livestock_breeding_records   heat / insemination / pregnancy check / calving
--   livestock_feed_plans         "Feed reference" card (newest plan = current)
--   livestock_feed_logs          "Daily feed log"
--   livestock_housing_records    housing history (newest start_date = current)
--   livestock_hygiene_logs       hygiene activity log
--
-- OWNERSHIP (BR-136). Each row carries both animal_id and farm_id. farm_id is
-- copied from the animal at insert time so a row can be scoped to a farmer
-- with the same single farms.farmer_id join every other livestock table uses;
-- the API still derives ownership through the animal on every read and write
-- and never returns farm_id (allow-list response schemas).
--
-- DETAILS JSONB. Health and breeding records are discriminated unions with
-- many variant-specific, display-only fields. Those live in `details` (keys are
-- the API's camelCase names). Any field that a rule or a query needs is
-- PROMOTED to a real column instead — next_due_date, the two withdrawal end
-- dates (BR-137), expected_delivery_date, next_check_date — so it can carry a
-- CHECK and an index. A promoted value lives ONLY in its column, never also in
-- `details`, so the two can never disagree.
--
-- None of these dates schedules anything: no reminder or job reads them
-- (BR-38 — everything here is farmer-entered).
--
-- SOFT DELETE. deleted_at on every new table; there is no delete endpoint yet,
-- but every list already filters on it so adding one later is not a rewrite.
-- These are ordinary editable records, not ledgers, so no append-only trigger.
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- livestock_health_records
-- -----------------------------------------------------------------------------
CREATE TABLE livestock_health_records (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id                uuid NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    animal_id              uuid NOT NULL REFERENCES livestock_animals (id),
    record_type            text NOT NULL CHECK (record_type IN ('VACCINATION', 'DEWORMING', 'CHECKUP', 'TREATMENT')),
    record_date            date NOT NULL,
    -- VACCINATION/DEWORMING nextDueDate, CHECKUP followUpDate.
    next_due_date          date,
    -- TREATMENT milkWithdrawal.endDate / meatWithdrawal.endDate. BR-137 raises
    -- livestock_animals.withdrawal_until from these in the same transaction.
    milk_withdrawal_until  date,
    meat_withdrawal_until  date,
    details                jsonb NOT NULL DEFAULT '{}'::jsonb,
    notes                  text,
    attachment_upload_id   uuid REFERENCES uploads (id),
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz,
    deleted_at             timestamptz,
    CONSTRAINT ck_livestock_health_records_next_due
        CHECK (next_due_date IS NULL OR next_due_date >= record_date),
    -- A withdrawal window only ever comes from a treatment (BR-137d); the API
    -- rejects it on other types too, this is the last line of defence.
    CONSTRAINT ck_livestock_health_records_withdrawal_treatment_only
        CHECK (record_type = 'TREATMENT' OR (milk_withdrawal_until IS NULL AND meat_withdrawal_until IS NULL)),
    CONSTRAINT ck_livestock_health_records_withdrawal_after_record
        CHECK ((milk_withdrawal_until IS NULL OR milk_withdrawal_until >= record_date)
           AND (meat_withdrawal_until IS NULL OR meat_withdrawal_until >= record_date))
);

CREATE INDEX ix_livestock_health_records_animal_date
    ON livestock_health_records (animal_id, record_date DESC, created_at DESC) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- livestock_breeding_records
-- -----------------------------------------------------------------------------
CREATE TABLE livestock_breeding_records (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id                 uuid NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    animal_id               uuid NOT NULL REFERENCES livestock_animals (id),
    record_type             text NOT NULL CHECK (record_type IN ('HEAT', 'INSEMINATION', 'PREGNANCY_CHECK', 'CALVING')),
    record_date             date NOT NULL,
    -- PREGNANCY_CHECK only.
    expected_delivery_date  date,
    next_check_date         date,
    details                 jsonb NOT NULL DEFAULT '{}'::jsonb,
    notes                   text,
    attachment_upload_id    uuid REFERENCES uploads (id),
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz,
    deleted_at              timestamptz,
    CONSTRAINT ck_livestock_breeding_records_projected_dates
        CHECK ((expected_delivery_date IS NULL OR expected_delivery_date >= record_date)
           AND (next_check_date IS NULL OR next_check_date >= record_date))
);

CREATE INDEX ix_livestock_breeding_records_animal_date
    ON livestock_breeding_records (animal_id, record_date DESC, created_at DESC) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- livestock_feed_plans
-- -----------------------------------------------------------------------------
CREATE TABLE livestock_feed_plans (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id                uuid NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    animal_id              uuid NOT NULL REFERENCES livestock_animals (id),
    effective_from         date NOT NULL DEFAULT current_date,
    plan_name              text,
    feed_type              text NOT NULL CHECK (feed_type IN ('GREEN_FODDER', 'DRY_FODDER', 'CONCENTRATE_MIX', 'SILAGE', 'MINERAL_MIXTURE', 'PASTURE_GRAZING')),
    source                 text,
    grazing_duration       numeric(6,2) CHECK (grazing_duration > 0),
    grazing_duration_unit  text CHECK (grazing_duration_unit IN ('HOURS_PER_DAY', 'HOURS_PER_WEEK')),
    water_source           text NOT NULL CHECK (water_source IN ('BOREWELL', 'WELL', 'CANAL', 'PIPED_WATER', 'POND_RIVER', 'RAINWATER_STORAGE')),
    start_time             time,
    end_time               time,
    -- [{ name, amount, unit }] — display-only ration lines, never summed by SQL.
    items                  jsonb NOT NULL DEFAULT '[]'::jsonb,
    notes                  text,
    attachment_upload_id   uuid REFERENCES uploads (id),
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz,
    deleted_at             timestamptz,
    -- A duration without its unit (or vice versa) is meaningless.
    CONSTRAINT ck_livestock_feed_plans_grazing_pair
        CHECK ((grazing_duration IS NULL) = (grazing_duration_unit IS NULL))
);

CREATE INDEX ix_livestock_feed_plans_animal_date
    ON livestock_feed_plans (animal_id, effective_from DESC, created_at DESC) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- livestock_feed_logs
-- -----------------------------------------------------------------------------
CREATE TABLE livestock_feed_logs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id     uuid NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    animal_id   uuid NOT NULL REFERENCES livestock_animals (id),
    fed_on      date NOT NULL DEFAULT current_date,
    feed_type   text NOT NULL CHECK (feed_type IN ('GREEN_FODDER', 'DRY_FODDER', 'CONCENTRATE_MIX', 'SILAGE', 'MINERAL_MIXTURE', 'PASTURE_GRAZING')),
    quantity    numeric(10,3) NOT NULL CHECK (quantity > 0),
    unit        text NOT NULL CHECK (unit IN ('KG', 'G', 'BUNDLES')),
    notes       text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz,
    deleted_at  timestamptz
);

CREATE INDEX ix_livestock_feed_logs_animal_date
    ON livestock_feed_logs (animal_id, fed_on DESC, created_at DESC) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- livestock_housing_records
-- -----------------------------------------------------------------------------
CREATE TABLE livestock_housing_records (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id               uuid NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    animal_id             uuid NOT NULL REFERENCES livestock_animals (id),
    housing_type          text NOT NULL CHECK (housing_type IN ('BARN', 'OPEN_SHED', 'PASTURE_FREE_RANGE', 'COOP_PEN', 'STALL')),
    housing_name          text NOT NULL,
    location              text,
    -- Stored as entered. No NPOP minimum-space comparison is made: there is no
    -- grounded threshold in the source documents yet (follow-up).
    indoor_space_value    numeric(10,2) NOT NULL CHECK (indoor_space_value > 0),
    indoor_space_unit     text NOT NULL CHECK (indoor_space_unit IN ('SQ_FT', 'SQ_M', 'ACRES')),
    outdoor_space_value   numeric(10,2) NOT NULL CHECK (outdoor_space_value >= 0),
    outdoor_space_unit    text NOT NULL CHECK (outdoor_space_unit IN ('SQ_FT', 'SQ_M', 'ACRES')),
    start_date            date NOT NULL,
    notes                 text,
    attachment_upload_id  uuid REFERENCES uploads (id),
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz,
    deleted_at            timestamptz
);

CREATE INDEX ix_livestock_housing_records_animal_date
    ON livestock_housing_records (animal_id, start_date DESC, created_at DESC) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- livestock_hygiene_logs
-- -----------------------------------------------------------------------------
CREATE TABLE livestock_hygiene_logs (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id       uuid NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    animal_id     uuid NOT NULL REFERENCES livestock_animals (id),
    performed_on  date NOT NULL DEFAULT current_date,
    activity      text NOT NULL,
    notes         text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    deleted_at    timestamptz
);

CREATE INDEX ix_livestock_hygiene_logs_animal_date
    ON livestock_hygiene_logs (animal_id, performed_on DESC, created_at DESC) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- livestock_production_logs — new product types and produce-tab columns
-- -----------------------------------------------------------------------------
-- 0024 declared the product_type CHECK inline, so Postgres named it
-- livestock_production_logs_product_type_check.
ALTER TABLE livestock_production_logs DROP CONSTRAINT livestock_production_logs_product_type_check;
ALTER TABLE livestock_production_logs ADD CONSTRAINT livestock_production_logs_product_type_check
    CHECK (product_type IN ('MILK', 'CURD', 'PANEER', 'BUTTER', 'GHEE', 'BUTTERMILK', 'CHEESE', 'EGGS', 'MEAT', 'WOOL', 'MANURE'));

ALTER TABLE livestock_production_logs
    ADD COLUMN session               text CHECK (session IN ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT')),
    ADD COLUMN quality_grade         text,
    ADD COLUMN fat_percent           numeric(5,2) CHECK (fat_percent >= 0 AND fat_percent <= 100),
    -- BR-139: forced TRUE by the service when the animal is under withdrawal
    -- on logged_on; the client can set it TRUE but never override it to FALSE.
    ADD COLUMN restricted_from_sale  boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN livestock_production_logs.restricted_from_sale IS
    'BR-139: TRUE when the produce came from an animal whose withdrawal_until >= logged_on '
    '(set by livestock.service.ts#createProductionLog), or when the farmer flagged it.';

COMMENT ON COLUMN livestock_animals.withdrawal_until IS
    'Post-medication milk/meat withdrawal window. Raised (never shortened) by a TREATMENT '
    'health record''s withdrawal end dates (BR-137); production logged on or before it is '
    'stored restricted_from_sale (BR-139).';

-- +migrate Down

COMMENT ON COLUMN livestock_animals.withdrawal_until IS
    'Post-medication milk/meat withdrawal window. Display-only (LivestockScreen '
    '"Withdrawal active" badge) -- no business rule keys off it yet.';

ALTER TABLE livestock_production_logs
    DROP COLUMN IF EXISTS restricted_from_sale,
    DROP COLUMN IF EXISTS fat_percent,
    DROP COLUMN IF EXISTS quality_grade,
    DROP COLUMN IF EXISTS session;

-- Rows using the new product types cannot satisfy the old CHECK; they are
-- removed rather than silently relabelled, so a rollback never invents data.
DELETE FROM livestock_production_logs WHERE product_type IN ('MEAT', 'WOOL', 'MANURE');
ALTER TABLE livestock_production_logs DROP CONSTRAINT IF EXISTS livestock_production_logs_product_type_check;
ALTER TABLE livestock_production_logs ADD CONSTRAINT livestock_production_logs_product_type_check
    CHECK (product_type IN ('MILK', 'CURD', 'PANEER', 'BUTTER', 'GHEE', 'BUTTERMILK', 'CHEESE', 'EGGS'));

DROP TABLE IF EXISTS livestock_hygiene_logs;
DROP TABLE IF EXISTS livestock_housing_records;
DROP TABLE IF EXISTS livestock_feed_logs;
DROP TABLE IF EXISTS livestock_feed_plans;
DROP TABLE IF EXISTS livestock_breeding_records;
DROP TABLE IF EXISTS livestock_health_records;
