/**
 * BR-100: availability shown to customers and admins never exceeds the shelf.
 *
 * WHY THIS EXISTS. A DIRECT counter sale draws pooled batch stock (qty_available, through the
 * stock ledger) without touching any allocation row (BR-95, owner decision 2026-10-11). The stored
 * allocation `available_qty` (allocated - consumed - reserved) can therefore count stock that is no
 * longer on the shelf. Every read that presents ONLINE or LIVE_MARKET availability goes through
 * these fragments instead of reading `a.available_qty` raw, so the catalog, the cart, the allocation
 * dashboard and the market-day screen cannot offer what a counter sale already took.
 *
 * The free shelf of a batch is its qty_available minus the claims that are not in the ledger yet:
 *   - cart holds: reserved_qty of every allocation row of the batch (BR-22). A row's own reservation
 *     is already outside its available_qty but is still physically on the shelf, so all rows count;
 *   - pending UPI DIRECT and MARKET sales: their order_items name the batch but write the SALE
 *     ledger row only at the confirm (BR-94). Online checkout writes its ledger row immediately, so
 *     no ONLINE order is a hold.
 *
 * One batch has at most one allocation row per channel (UNIQUE (batch_id, channel)), so capping a
 * single channel's row is capping that channel's per-batch figure. A figure summed over several
 * channels of one batch must be capped per batch with `shelfFreeSql` (see the cart breakdown).
 *
 * Reads only. These fragments never change what an allocation write does (reserved / consumed).
 * Farm anonymity (BR-16): only quantities are read here; no farmer column is touched.
 */

/** Unclaimed shelf quantity of the batch aliased `batch`, never below zero. numeric(12,3). */
export function shelfFreeSql(batch: string): string {
  return `GREATEST(0::numeric,
      ${batch}.qty_available
      - COALESCE((SELECT SUM(shelf_a.reserved_qty) FROM allocations shelf_a WHERE shelf_a.batch_id = ${batch}.id), 0)
      - COALESCE((SELECT SUM(shelf_oi.qty_kg)
                    FROM order_items shelf_oi
                    JOIN orders shelf_o ON shelf_o.id = shelf_oi.order_id
                   WHERE shelf_oi.batch_id = ${batch}.id
                     AND shelf_oi.status = 'PENDING'
                     AND shelf_o.status = 'PENDING_PAYMENT'
                     AND shelf_o.channel IN ('DIRECT', 'MARKET')), 0)
    )::numeric(12,3)`;
}

/**
 * Effective availability of the allocation row aliased `allocation` on the batch aliased `batch`:
 * its stored available_qty, capped by the batch's unclaimed shelf. numeric(12,3).
 */
export function effectiveAvailableSql(allocation: string, batch: string): string {
  return `GREATEST(0::numeric, LEAST(${allocation}.available_qty, ${shelfFreeSql(batch)}))::numeric(12,3)`;
}
