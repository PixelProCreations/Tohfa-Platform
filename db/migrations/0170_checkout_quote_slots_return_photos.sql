-- =============================================================================
-- 0170_checkout_quote_slots_return_photos.sql
-- BR-200 (pre-checkout quote / handling fee), BR-201 (delivery slot availability and cutoff),
-- BR-203 (cart line stock flag), BR-204 (return photos).
--
--  - orders.handling_fee: the configured per-order handling fee, stored on the order so the order
--    total is reproducible from its own columns (subtotal + delivery + handling + gst - discount).
--    Existing orders get 0, which is what they were charged.
--  - return_requests.photo_keys: storage keys of up to five ISSUE_PHOTO uploads the customer
--    attached when filing the return (EXIF/GPS stripped at upload, BR-16). Keys, never URLs, so
--    the URL is minted at read time.
--  - system_config: the business values behind the quote, the slot cutoff and the low-stock flag
--    (CLAUDE.md 2.7). Implementer defaults; product decision pending.
-- =============================================================================

-- +migrate Up
ALTER TABLE orders
    ADD COLUMN handling_fee numeric(12,2) NOT NULL DEFAULT 0
        CONSTRAINT orders_handling_fee_chk CHECK (handling_fee >= 0);

ALTER TABLE return_requests
    ADD COLUMN photo_keys text[] NOT NULL DEFAULT '{}'
        CONSTRAINT return_requests_photo_keys_max_chk CHECK (cardinality(photo_keys) <= 5);

-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('handling_fee',
     '0.00'::jsonb, 'number',
     'BR-200: flat per-order handling fee in rupees, added to every online order (pickup and delivery). Not subject to GST (GST is on the goods subtotal, BR-98). Implementer default 0 (product decision pending).'),
    ('delivery_slot_cutoff_minutes',
     '120'::jsonb, 'number',
     'BR-201: minutes before a delivery slot starts (Asia/Kolkata) at which the slot is shown as closed for new orders. Implementer default 120 (product decision pending).'),
    ('cart_low_stock_threshold_kg',
     '2'::jsonb, 'number',
     'BR-203: a held cart line is flagged LOW_STOCK when the further ONLINE availability of the same product and grade (BR-100 shelf-capped) is below this many kg. Implementer default 2 (product decision pending).')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down
DELETE FROM system_config
 WHERE key IN ('handling_fee', 'delivery_slot_cutoff_minutes', 'cart_low_stock_threshold_kg');
ALTER TABLE return_requests DROP COLUMN IF EXISTS photo_keys;
ALTER TABLE orders DROP COLUMN IF EXISTS handling_fee;
