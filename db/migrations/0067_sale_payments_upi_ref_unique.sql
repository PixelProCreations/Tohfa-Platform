-- =============================================================================
-- 0067_sale_payments_upi_ref_unique.sql
-- SWA Module 6 (Direct / Market sales), BR-94: one UPI payment confirms at most one sale.
--
-- 0060 gave sale_payments.upi_txn_ref no uniqueness, and the gateway check in the UPI confirm
-- (sales.service.ts gatewayUpiVerifier) only asks "is this reference a captured payment of this
-- amount?". The gateway payment carries no reference back to our sale (the counter collects UPI
-- outside a gateway order), so the same captured reference could confirm any number of pending
-- sales of the same amount: one real payment, several completed sales and invoices.
--
-- A partial UNIQUE index makes the database refuse the second confirm. Partial because every
-- non-UPI row, and every UPI row still PENDING, has upi_txn_ref NULL. The service maps the
-- violation (23505 on uq_sale_payments_upi_txn_ref) to 409 CONFLICT with
-- meta.reason = UPI_TXN_REF_ALREADY_USED, inside the confirm transaction, so nothing of the second
-- sale is written.
--
-- If a database already holds two rows with the same non-NULL upi_txn_ref this migration fails
-- on purpose: those rows are the double-confirm this closes and need a human decision first.
-- =============================================================================

-- +migrate Up

CREATE UNIQUE INDEX uq_sale_payments_upi_txn_ref
    ON sale_payments (upi_txn_ref)
    WHERE upi_txn_ref IS NOT NULL;

COMMENT ON INDEX uq_sale_payments_upi_txn_ref IS
    'BR-94: a UPI gateway reference confirms at most one sale payment.';

-- +migrate Down

DROP INDEX IF EXISTS uq_sale_payments_upi_txn_ref;
