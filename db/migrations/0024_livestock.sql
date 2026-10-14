-- =============================================================================
-- 0024_livestock.sql
--
-- Backs the farmer app's mock livestock screens (LivestockScreen,
-- RegisterAnimalScreen, AnimalDetailScreen, DairyProduceScreen,
-- SaleTransferCullScreen) with real tables. Nothing here existed before this
-- migration — no animal/livestock table, rbac permission or rules.md mention
-- predates it (confirmed by grep across the repo).
--
-- Three tables:
--   livestock_animals            one row per animal the farmer keeps
--   livestock_production_logs    daily produce logging (milk/curd/paneer/...)
--   livestock_lifecycle_events   append-only record of an animal leaving the
--                                 herd (sold/transferred/culled/deceased)
--
-- OWNERSHIP. Animals belong to the farmer's operation as a whole
-- (farm_id -> farms.farmer_id), not to one plot — see root CLAUDE.md's
-- "farm-land-locations-model" note: a farmer is one operation with land in
-- multiple locations, and livestock are not zone-scoped the way farm_crops
-- are plot-scoped. This mirrors how `farms` itself is the ownership anchor
-- for anything that belongs to the operation rather than to one zone.
--
-- SPECIES is a small fixed enum (matching the mock's SPECIES_OPTIONS), not a
-- separate taxonomy table like crop_master: unlike crops, there is no
-- admin-manageable variety list for livestock in the mock UI, so a CHECK
-- constraint is the right amount of structure — the same reasoning
-- crops.schema.ts documents for its own seed_quantity_unit/expected_grade
-- CHECK-constrained enums (0023_crops_extra_fields.sql).
--
-- MONEY. livestock_lifecycle_events.sale_price_paise is integer paise, never
-- numeric/decimal — root CLAUDE.md §2.2, the same choice
-- 0023_crops_extra_fields.sql made for farm_crops.seed_cost_paise.
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- livestock_animals
-- -----------------------------------------------------------------------------
CREATE TABLE livestock_animals (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id            uuid NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    -- Farmer's own identifier (e.g. "C-014"). Unique per farm, not globally —
    -- two different farmers may both call an animal "C-014".
    tag                text NOT NULL,
    name               text,
    species            text NOT NULL CHECK (species IN ('CATTLE', 'BUFFALO', 'GOAT', 'POULTRY', 'SHEEP')),
    breed              text,
    gender             text NOT NULL CHECK (gender IN ('FEMALE', 'MALE')),
    date_of_birth      date,
    source             text NOT NULL DEFAULT 'BORN_ON_FARM' CHECK (source IN ('BORN_ON_FARM', 'PURCHASED')),
    -- Only meaningful when source = 'PURCHASED'. Left as a soft app-level
    -- validation (livestock.schema.ts) rather than a CHECK: a DB constraint
    -- tying purchased_on/source_farm to source would need to also allow both
    -- NULL when source = 'PURCHASED' but not yet recorded, which buys little
    -- extra safety for the complexity — the same trade-off crops.schema.ts
    -- documents for choosing application-level range checks over exhaustive
    -- CHECKs.
    purchased_on       date,
    source_farm        text,
    organic_status     text NOT NULL DEFAULT 'CONVENTIONAL' CHECK (organic_status IN ('ORGANIC', 'TRANSITIONING', 'CONVENTIONAL')),
    lifecycle_status   text NOT NULL DEFAULT 'ACTIVE' CHECK (lifecycle_status IN ('ACTIVE', 'SOLD', 'TRANSFERRED', 'CULLED', 'DECEASED')),
    -- Post-medication withdrawal window: while this is >= current_date, the
    -- animal's produce should not be marked organic-sellable. Display-only for
    -- now (no BR enforces it yet — there is no genuine cross-table invariant
    -- to check at the database level here, only a UI badge on
    -- LivestockScreen's "Withdrawal active" alert).
    withdrawal_until   date,
    notes              text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz,
    deleted_at         timestamptz
);

-- Farmer's own tag is unique within their herd, not across all farmers'.
CREATE UNIQUE INDEX uq_livestock_animals_farm_tag
    ON livestock_animals (farm_id, tag) WHERE deleted_at IS NULL;

CREATE INDEX ix_livestock_animals_farm_status
    ON livestock_animals (farm_id, lifecycle_status) WHERE deleted_at IS NULL;

COMMENT ON COLUMN livestock_animals.withdrawal_until IS
    'Post-medication milk/meat withdrawal window. Display-only (LivestockScreen '
    '"Withdrawal active" badge) -- no business rule keys off it yet.';

-- -----------------------------------------------------------------------------
-- livestock_production_logs
-- -----------------------------------------------------------------------------
CREATE TABLE livestock_production_logs (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id       uuid NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    -- Nullable: flock-level egg collection (FlockEggItem) has no single bird
    -- to attribute the count to. Per-animal milk yield and value-added
    -- produce batches both carry an animal_id when there is one to record.
    animal_id     uuid REFERENCES livestock_animals (id),
    product_type  text NOT NULL CHECK (product_type IN ('MILK', 'CURD', 'PANEER', 'BUTTER', 'GHEE', 'BUTTERMILK', 'CHEESE', 'EGGS')),
    quantity      numeric(10,3) NOT NULL CHECK (quantity > 0),
    unit          text NOT NULL CHECK (unit IN ('LITERS', 'KG', 'COUNT')),
    logged_on     date NOT NULL DEFAULT current_date,
    -- Free text like "Batch #3, cultured 24hr" for value-added produce.
    batch_info    text,
    -- Number of milking sessions that day. Only meaningful for MILK.
    sessions      integer,
    notes         text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    deleted_at    timestamptz
);

-- Produce history log view lists a farm's entries newest-logged-date-first.
CREATE INDEX ix_livestock_production_logs_farm_date
    ON livestock_production_logs (farm_id, logged_on DESC) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- livestock_lifecycle_events -- append-only (root CLAUDE.md §2.3)
-- -----------------------------------------------------------------------------
CREATE TABLE livestock_lifecycle_events (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id      uuid NOT NULL REFERENCES livestock_animals (id),
    event_type     text NOT NULL CHECK (event_type IN ('SOLD', 'TRANSFERRED', 'CULLED', 'DECEASED')),
    event_date     date NOT NULL DEFAULT current_date,
    -- Buyer name or destination farm. Only meaningful for SOLD/TRANSFERRED.
    counterparty   text,
    -- Integer paise, not rupees -- root CLAUDE.md §2.2. Only meaningful for SOLD.
    sale_price_paise integer CHECK (sale_price_paise IS NULL OR sale_price_paise >= 0),
    reason         text,
    notes          text,
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_livestock_lifecycle_events_animal
    ON livestock_lifecycle_events (animal_id, event_date DESC);

-- BR-47: an animal that has already left the herd (sold/transferred/culled/
-- deceased) cannot leave it a second time. Enforced here, not only in
-- application code, for the same race-condition reason BR-46's partial
-- unique index is on the database rather than a check-then-write in the
-- service (0023_crops_extra_fields.sql).
CREATE UNIQUE INDEX uq_livestock_lifecycle_events_one_per_animal
    ON livestock_lifecycle_events (animal_id);

COMMENT ON INDEX uq_livestock_lifecycle_events_one_per_animal IS
    'BR-47: an animal can exit the herd at most once. A second SOLD/TRANSFERRED/'
    'CULLED/DECEASED event for the same animal_id is rejected at the database '
    'level, so a race between two concurrent requests cannot both win.';

COMMENT ON TABLE livestock_lifecycle_events IS
    'Append-only (root CLAUDE.md §2.3) -- an animal''s exit from the herd is a '
    'permanent fact. Recording an event flips livestock_animals.lifecycle_status '
    'in the same transaction (livestock.service.ts#recordLifecycleEvent); the '
    'event row itself is never updated or deleted.';

-- Reuses the platform's append-only helper (0001_extensions_and_enums.sql) --
-- the same one audit_log, stock_ledger, wallet_transactions and
-- order_status_history already apply, rather than a bespoke trigger function.
SELECT app_make_append_only('livestock_lifecycle_events');

-- +migrate Down

-- DROP TABLE cascades away the append-only triggers this table's Up side
-- created via app_make_append_only, the same way every other ledger table's
-- Down migration relies on cascade rather than dropping them individually.
DROP TABLE IF EXISTS livestock_lifecycle_events;
DROP TABLE IF EXISTS livestock_production_logs;
DROP TABLE IF EXISTS livestock_animals;
