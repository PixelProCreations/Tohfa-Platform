-- =============================================================================
-- 0052_task_alert_states.sql
-- Per-user state for the derived Tasks and Alerts worklists (BR-77, BR-78).
--
-- Tasks and alerts are NOT stored: GET /v1/admin/tasks and /alerts derive them live from
-- return_requests, goods_receipts, orders, inventory_batches and warehouses. The only thing
-- stored is what ONE user did to ONE item of their own list: dismissed or snoozed an alert,
-- marked a task done. `item_key` is the stable key the API derives for the item
-- (for example 'BATCH_NEAR_EXPIRY:<batch uuid>'); there is deliberately no foreign key,
-- because the item is not a row.
--
-- Deliberately NOT append-only and NOT audited: it is the user's own list preference, in the
-- same family as announcement_reads (0048). A row whose condition has cleared is deleted when
-- its owner next lists, so a condition that recurs starts un-dismissed.
--
-- Also seeds the three business thresholds the derivation reads. All three values are
-- PLACEHOLDERS the owner has not confirmed (same situation as low_stock_threshold_kg).
-- =============================================================================

-- +migrate Up

CREATE TABLE task_alert_states (
    user_id       uuid        NOT NULL REFERENCES users (id),
    kind          text        NOT NULL,
    item_key      text        NOT NULL,
    state         text        NOT NULL,
    snoozed_until timestamptz,
    updated_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, kind, item_key),
    CONSTRAINT task_alert_states_kind_chk
        CHECK (kind IN ('TASK', 'ALERT')),
    CONSTRAINT task_alert_states_item_key_chk
        CHECK (char_length(item_key) BETWEEN 1 AND 200),
    -- A task can only be marked done; an alert can only be dismissed or snoozed.
    CONSTRAINT task_alert_states_kind_state_chk
        CHECK ((kind = 'TASK' AND state = 'DONE')
            OR (kind = 'ALERT' AND state IN ('DISMISSED', 'SNOOZED'))),
    -- snoozed_until exists exactly when the state is SNOOZED.
    CONSTRAINT task_alert_states_snooze_chk
        CHECK ((state = 'SNOOZED') = (snoozed_until IS NOT NULL))
);

COMMENT ON TABLE task_alert_states IS
    'BR-78: one user''s own dismiss/snooze/done state for an item of the derived tasks/alerts lists. Absence of a row means the item is open/active. Not append-only, not audited.';

-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('alert_batch_expiry_days',
     '7'::jsonb, 'number',
     'BR-77: an ACTIVE inventory batch with stock left raises a BATCH_NEAR_EXPIRY alert when its expiry_on is on or before today (Asia/Kolkata) plus this many days; a batch already past its expiry still counts. PLACEHOLDER: no source document defines the horizon, the client must confirm it. When the row is missing or not a non-negative integer the alert type is not raised.'),
    ('alert_capacity_utilization_percent',
     '90'::jsonb, 'number',
     'BR-77: a warehouse with a capacity raises a CAPACITY_NEAR_FULL alert when used_kg * 100 / capacity_kg is at least this percentage (used_kg as in the capacity endpoint: ACTIVE batches). PLACEHOLDER: no source document defines the level, the client must confirm it. When the row is missing or not a number from 0 to 100 the alert type is not raised.'),
    ('alert_snooze_max_hours',
     '168'::jsonb, 'number',
     'BR-78: the furthest ahead, in hours, an alert may be snoozed (POST /v1/admin/alerts/{itemKey}/snooze, body.until). PLACEHOLDER: no source document defines the cap (the design only shows a 1-hour snooze), the client must confirm it. When the row is missing or not a positive integer the service uses 168.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down

DELETE FROM system_config WHERE key IN
    ('alert_batch_expiry_days', 'alert_capacity_utilization_percent', 'alert_snooze_max_hours');

DROP TABLE IF EXISTS task_alert_states;
