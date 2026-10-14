-- =============================================================================
-- 0025_farm_assets.sql
--
-- Backs three near-identical mock screens (apps/mobile/src/roles/farmer/
-- screens/farm/{MachineryListScreen,ToolsListScreen,EquipmentListScreen}.tsx,
-- plus their Add*/Edit* counterparts) that are really ONE concept: a
-- maintenance-tracked farm asset. Three near-identical tables would be the
-- premature duplication root CLAUDE.md warns against — one table with a
-- `category` enum and a couple of nullable category-specific columns is the
-- right shape, the same call 0023_crops_extra_fields.sql made for seed/grade
-- detail on farm_crops rather than a separate table per crop family.
--
-- `farm_id` (not `plot_id`): a machine/tool/equipment item belongs to a land
-- location, not a planted patch of ground — plots are for crops
-- (0003_farmers_and_farms.sql). A farmer operation with land in multiple
-- locations has multiple `farms` rows (farms.farmer_id), so scoping through
-- `farms.farmer_id` here is enough; no plot join needed.
--
-- OUT OF SCOPE: TreesListScreen.tsx (FarmInventoryScreen's 4th category) is a
-- plantings concept (species/zone/fruit-bearing), not a maintenance-tracked
-- asset, and was not requested. Nothing here supports it.
--
-- NEXT-SERVICE-DUE DESIGN CHOICE (the mocks settle this for us):
-- AddToolScreen.tsx / AddMachineryScreen.tsx / AddEquipmentScreen.tsx all
-- collect `purchaseDate` + a REQUIRED `serviceInterval` (days) and show the
-- info line "Next-due date is calculated from this interval and the last
-- service." — there is no due-date input field anywhere in the mocks. So
-- `next_service_due_on` is GENERATED ALWAYS AS STORED from
-- (last_serviced_on, coalescing to purchased_on when the asset has never
-- been serviced) + service_interval_days. This is the strongest version of
-- "computed at read time, never stored stale" (root CLAUDE.md / the
-- totalLabourCostPaise comment in farm-diary.schema.ts): Postgres itself
-- keeps it in lockstep with the three source columns, so there is no service-
-- layer code path that could forget to recompute it. `status`
-- (OK/DUE_SOON/OVERDUE) and `dueNote` ("12 days overdue") are display-only —
-- computed in farm-assets.service.ts from this column vs current_date, never
-- persisted (see that file).
--
-- service_interval_days/cost_paise stay NULLABLE at the database level even
-- though every current mock Add screen requires an interval — the API layer
-- (farm-assets.schema.ts createFarmAssetBody) enforces that today. Keeping
-- the column nullable leaves room for a future entry path (e.g. admin bulk
-- import) that genuinely has no interval, without a migration.
--
-- cost_paise is integer paise, never numeric/decimal — root CLAUDE.md §2.2.
-- =============================================================================

-- +migrate Up

CREATE TABLE farm_assets (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id                uuid NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    category               text NOT NULL CHECK (category IN ('TOOL', 'EQUIPMENT', 'MACHINERY')),
    name                   text NOT NULL,
    make_model             text,
    fuel_type              text,           -- machinery-specific (AddMachineryScreen/EditMachineryScreen); nullable for tool/equipment
    coverage_area_acres    numeric(10,2) CHECK (coverage_area_acres IS NULL OR coverage_area_acres >= 0),  -- equipment-specific (AddEquipmentScreen/EditEquipmentScreen)
    purchased_on           date,
    cost_paise             integer CHECK (cost_paise IS NULL OR cost_paise >= 0),
    service_interval_days  integer CHECK (service_interval_days IS NULL OR service_interval_days > 0),
    last_serviced_on       date,
    -- See header comment: computed, never written directly. NULL when there is
    -- no interval, or neither a purchase date nor a last-service date to count
    -- from — `date + integer` and COALESCE both propagate NULL, so no CASE is
    -- needed.
    next_service_due_on    date GENERATED ALWAYS AS (
                               COALESCE(last_serviced_on, purchased_on) + service_interval_days
                           ) STORED,
    notes                  text,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz,
    deleted_at             timestamptz
);

CREATE INDEX idx_farm_assets_farm_id ON farm_assets (farm_id);
CREATE INDEX idx_farm_assets_category ON farm_assets (category);
CREATE INDEX idx_farm_assets_due ON farm_assets (next_service_due_on) WHERE deleted_at IS NULL;

COMMENT ON COLUMN farm_assets.cost_paise IS
    'Integer paise, not rupees — root CLAUDE.md section 2.2, money is never '
    'a float. Deliberately an integer column, not numeric/decimal.';

COMMENT ON COLUMN farm_assets.next_service_due_on IS
    'GENERATED column, not application-written: COALESCE(last_serviced_on, '
    'purchased_on) + service_interval_days. Matches the mock Add screens'' own '
    'copy ("Next-due date is calculated from this interval and the last '
    'service."). The farmer-facing OK/DUE_SOON/OVERDUE status and dueNote '
    'string are derived from this at read time in farm-assets.service.ts and '
    'are never stored.';

-- +migrate Down

DROP TABLE IF EXISTS farm_assets;
