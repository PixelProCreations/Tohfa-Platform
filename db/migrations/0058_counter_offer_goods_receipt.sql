-- =============================================================================
-- 0058_counter_offer_goods_receipt.sql
-- BR-10: link a quality counter-offer to the goods receipt it was made on.
--
-- POST /v1/admin/goods-receipts/{id}/counter-offer used to INSERT into
-- counter_offers with columns that never existed (goods_receipt_id, offered_by,
-- offered_by_user_id), so every call failed with Postgres 42703. The fix writes
-- the offer on the LISTING behind the receipt's purchase order
-- (goods_receipts.purchase_order_id -> purchase_orders.listing_id), so the
-- farmer's existing accept / reject / counter endpoints and the expiry sweep act
-- on it unchanged. listing_id stays NOT NULL; this nullable column only records
-- which receipt a warehouse admin's quality counter-offer came from. Every
-- listing-negotiation row keeps it NULL. Treating a quality counter-offer as a
-- round of the listing negotiation is an UNCONFIRMED default (docs/rules.md
-- BR-10): the rules list the quality counter-offer as a second surface that is
-- not specified yet.
-- =============================================================================

-- +migrate Up
ALTER TABLE counter_offers
    ADD COLUMN IF NOT EXISTS goods_receipt_id uuid REFERENCES goods_receipts (id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_counter_offers_goods_receipt_id
    ON counter_offers (goods_receipt_id);

COMMENT ON COLUMN counter_offers.goods_receipt_id IS
    'BR-10: the goods receipt a warehouse admin made this quality counter-offer on '
    '(POST /v1/admin/goods-receipts/{id}/counter-offer). NULL for every listing-negotiation '
    'row. The offer itself belongs to listing_id, the listing behind the receipt''s purchase '
    'order, so the farmer answers it through the listing counter-offer endpoints.';

-- +migrate Down
DROP INDEX IF EXISTS idx_counter_offers_goods_receipt_id;
ALTER TABLE counter_offers DROP COLUMN IF EXISTS goods_receipt_id;
