import type { Executor } from '../../db/pool.js';
import { effectiveAvailableSql, shelfFreeSql } from '../../db/shelfAvailability.js';
import type { ProduceGrade } from './cart.schema.js';

/** BR-100: the ONLINE row's availability capped by the batch's unclaimed shelf. */
const ONLINE_EFFECTIVE = effectiveAvailableSql('a', 'b');

export interface CartRecord {
  id: string;
  customer_id: string;
  warehouse_id: string | null;
  status: 'ACTIVE' | 'LOCKED' | 'CONVERTED' | 'EXPIRED';
  subtotal: string;
  locked_at: Date | null;
  locked_until: Date | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface CartItemRecord {
  id: string;
  cart_id: string;
  productId: string;
  name: string;
  grade: ProduceGrade;
  qtyKg: string;
  unitPrice: string;
  lineTotal: string;
  allocationId: string | null;
  status: 'HELD' | 'RELEASED' | 'CONVERTED' | 'EXPIRED';
  reservedUntil: Date | null;
}

export interface AllocationRecord {
  id: string;
  batch_id: string;
  warehouse_id: string;
  allocated_qty: string;
  consumed_qty: string;
  reserved_qty: string;
  available_qty: string;
}

export interface CartRepo {
  getCartLockHours(db: Executor): Promise<number>;

  findActiveCart(db: Executor, customerId: string): Promise<CartRecord | null>;

  createActiveCart(
    db: Executor,
    customerId: string,
    warehouseId?: string | null,
  ): Promise<CartRecord>;

  getCartItems(db: Executor, cartId: string): Promise<CartItemRecord[]>;

  findActiveRetailPrice(
    db: Executor,
    cropId: string,
    grade: ProduceGrade,
  ): Promise<{ price: string; cropName: string } | null>;

  findAndLockOnlineAllocation(
    db: Executor,
    params: {
      cropId: string;
      grade: ProduceGrade;
      warehouseId?: string | null;
      requiredQty: string;
    },
  ): Promise<AllocationRecord | null>;

  getAvailableStockBreakdown(
    db: Executor,
    params: {
      cropId: string;
      grade: ProduceGrade;
      warehouseId?: string | null;
    },
  ): Promise<{ totalAvailable: string; onlineAvailable: string; onlineAllocationAvailable: string }>;

  reserveAllocation(
    db: Executor,
    allocationId: string,
    qtyKg: string,
  ): Promise<void>;

  releaseAllocation(
    db: Executor,
    allocationId: string,
    qtyKg: string,
  ): Promise<void>;

  findHeldCartItem(
    db: Executor,
    cartId: string,
    cropId: string,
    grade: ProduceGrade,
  ): Promise<{ id: string; qtyKg: string; allocationId: string | null } | null>;

  upsertCartItem(
    db: Executor,
    params: {
      cartId: string;
      cropId: string;
      grade: ProduceGrade;
      qtyKg: string;
      unitPrice: string;
      lineTotal: string;
      allocationId: string;
      reservedUntil: Date;
    },
  ): Promise<void>;

  updateCartLockAndSubtotal(
    db: Executor,
    cartId: string,
    warehouseId: string | null,
    lockHours: number,
  ): Promise<CartRecord>;

  clearCart(db: Executor, cartId: string): Promise<void>;

  reapExpiredCarts(
    db: Executor,
    batchSize?: number,
  ): Promise<{ scanned: number; expiredCarts: number; releasedLines: number }>;
}

export const cartRepo: CartRepo = {
  async getCartLockHours(db) {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'cart_lock_hours' LIMIT 1`,
    );
    if (res.rows.length > 0 && res.rows[0]?.value != null) {
      const val = Number(res.rows[0].value);
      if (!isNaN(val) && val > 0) return val;
    }
    return 24;
  },

  async findActiveCart(db, customerId) {
    const res = await db.query<CartRecord>(
      `SELECT id, customer_id, warehouse_id, status, subtotal::text,
              locked_at, locked_until, created_at, updated_at
         FROM carts
        WHERE customer_id = $1
          AND status IN ('ACTIVE', 'LOCKED')
        ORDER BY created_at DESC
        LIMIT 1`,
      [customerId],
    );
    return res.rows[0] ?? null;
  },

  async createActiveCart(db, customerId, warehouseId = null) {
    const res = await db.query<CartRecord>(
      `INSERT INTO carts (customer_id, warehouse_id, status, subtotal)
       VALUES ($1, $2, 'ACTIVE', 0)
       RETURNING id, customer_id, warehouse_id, status, subtotal::text,
                 locked_at, locked_until, created_at, updated_at`,
      [customerId, warehouseId],
    );
    return res.rows[0]!;
  },

  async getCartItems(db, cartId) {
    const res = await db.query<CartItemRecord>(
      `SELECT ci.id, ci.cart_id, ci.crop_id AS "productId", cm.name, ci.grade,
              ci.qty_kg::text AS "qtyKg", ci.unit_price::text AS "unitPrice",
              ci.line_total::text AS "lineTotal", ci.allocation_id AS "allocationId",
              ci.status, ci.reserved_until AS "reservedUntil"
         FROM cart_items ci
         JOIN crop_master cm ON cm.id = ci.crop_id
        WHERE ci.cart_id = $1
          AND ci.status = 'HELD'
        ORDER BY ci.created_at ASC`,
      [cartId],
    );
    return res.rows;
  },

  async findActiveRetailPrice(db, cropId, grade) {
    const res = await db.query<{ price: string; cropName: string }>(
      `WITH active_retail AS (
         SELECT price
           FROM retail_prices
          WHERE crop_id = $1 AND grade = $2
            AND effective_from <= CURRENT_DATE
            AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
          ORDER BY effective_from DESC
          LIMIT 1
       ),
       active_fair AS (
         SELECT ceiling_price AS price
           FROM fair_prices
          WHERE crop_id = $1 AND grade = $2
            AND effective_from <= CURRENT_DATE
            AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
          ORDER BY effective_from DESC
          LIMIT 1
       )
       SELECT COALESCE(
                (SELECT price::text FROM active_retail),
                (SELECT price::text FROM active_fair),
                '50.00'
              ) AS price,
              cm.name AS "cropName"
         FROM crop_master cm
        WHERE cm.id = $1
        LIMIT 1`,
      [cropId, grade],
    );
    return res.rows[0] ?? null;
  },

  async findAndLockOnlineAllocation(db, params) {
    // BR-100: a cart may reserve only what is on the shelf. The candidate must cover the request
    // with its EFFECTIVE availability (the ONLINE row capped by the batch's unclaimed shelf), not
    // just its stored available_qty, because a DIRECT counter sale draws the batch without touching
    // the allocation (BR-95). BR-12c is unchanged: only the ONLINE row is a candidate, never RESERVE.
    //
    // The batch row is locked as well as the allocation: a DIRECT/MARKET sale (sales.repo) and the
    // stock ledger trigger lock the batch, so while we hold it neither the shelf nor its pending
    // UPI holds can move under us. Lock order is allocation then batch, as at checkout
    // (orders.repo); the sale path locks batch then the LIVE_MARKET row, a different row, so no
    // cycle.
    const res = await db.query<AllocationRecord>(
      `SELECT a.id, a.batch_id, a.warehouse_id, a.allocated_qty::text,
              a.consumed_qty::text, a.reserved_qty::text, a.available_qty::text
         FROM allocations a
         JOIN inventory_batches b ON b.id = a.batch_id
        WHERE a.channel = 'ONLINE'
          AND b.crop_id = $1
          AND b.grade = $2
          AND ($3::uuid IS NULL OR a.warehouse_id = $3)
          AND b.status = 'ACTIVE'
          AND a.available_qty >= $4::numeric
          AND ${ONLINE_EFFECTIVE} >= $4::numeric
        ORDER BY ${ONLINE_EFFECTIVE} DESC, b.created_at ASC
        LIMIT 1
        FOR UPDATE OF a, b`,
      [
        params.cropId,
        params.grade,
        params.warehouseId ?? null,
        params.requiredQty,
      ],
    );
    const candidate = res.rows[0];
    if (candidate === undefined) return null;

    // Re-check under the locks, in a fresh statement. If the row was changed by a transaction we
    // waited for, PostgreSQL re-evaluates the WHERE clause against the new allocation row but the
    // shelf sub-selects keep the first statement's snapshot, so the figure above can be stale.
    const recheck = await db.query<{ ok: boolean }>(
      `SELECT ${ONLINE_EFFECTIVE} >= $2::numeric AS ok
         FROM allocations a
         JOIN inventory_batches b ON b.id = a.batch_id
        WHERE a.id = $1 AND b.status = 'ACTIVE'`,
      [candidate.id, params.requiredQty],
    );
    return recheck.rows[0]?.ok === true ? candidate : null;
  },

  async getAvailableStockBreakdown(db, params) {
    // BR-100: both figures are capped per batch by the batch's unclaimed shelf. The total sums every
    // channel of a batch first and caps that sum, so it can never exceed what is on the shelf even
    // though four allocation rows share one batch. `onlineAllocationAvailable` is the stored ONLINE
    // bucket figure, kept only to tell a BR-12c "above the Online bucket" refusal apart from a
    // "not on the shelf" one.
    const res = await db.query<{
      totalAvailable: string;
      onlineAvailable: string;
      onlineAllocationAvailable: string;
    }>(
      `SELECT COALESCE(SUM(LEAST(per_batch.all_channels, per_batch.shelf_free)), 0)::numeric(14,3)::text
                AS "totalAvailable",
              COALESCE(SUM(LEAST(per_batch.online, per_batch.shelf_free)), 0)::numeric(14,3)::text
                AS "onlineAvailable",
              COALESCE(SUM(per_batch.online), 0)::numeric(14,3)::text
                AS "onlineAllocationAvailable"
         FROM (
           SELECT ch.all_channels, ch.online, ${shelfFreeSql('b')} AS shelf_free
             FROM inventory_batches b
             JOIN LATERAL (
               SELECT SUM(a.available_qty) AS all_channels,
                      COALESCE(SUM(a.available_qty) FILTER (WHERE a.channel = 'ONLINE'), 0) AS online
                 FROM allocations a
                WHERE a.batch_id = b.id
                  AND ($3::uuid IS NULL OR a.warehouse_id = $3)
             ) ch ON ch.all_channels IS NOT NULL
            WHERE b.crop_id = $1
              AND b.grade = $2
              AND b.status = 'ACTIVE'
         ) per_batch`,
      [params.cropId, params.grade, params.warehouseId ?? null],
    );
    return (
      res.rows[0] ?? {
        totalAvailable: '0.000',
        onlineAvailable: '0.000',
        onlineAllocationAvailable: '0.000',
      }
    );
  },

  async reserveAllocation(db, allocationId, qtyKg) {
    await db.query(
      `UPDATE allocations
          SET reserved_qty = reserved_qty + $2::numeric,
              updated_at = now()
        WHERE id = $1`,
      [allocationId, qtyKg],
    );
  },

  async releaseAllocation(db, allocationId, qtyKg) {
    await db.query(
      `UPDATE allocations
          SET reserved_qty = GREATEST(0, reserved_qty - $2::numeric),
              updated_at = now()
        WHERE id = $1`,
      [allocationId, qtyKg],
    );
  },

  async findHeldCartItem(db, cartId, cropId, grade) {
    const res = await db.query<{ id: string; qtyKg: string; allocationId: string | null }>(
      `SELECT id, qty_kg::text AS "qtyKg", allocation_id AS "allocationId"
         FROM cart_items
        WHERE cart_id = $1 AND crop_id = $2 AND grade = $3 AND status = 'HELD'
        LIMIT 1`,
      [cartId, cropId, grade],
    );
    return res.rows[0] ?? null;
  },

  async upsertCartItem(db, params) {
    await db.query(
      `INSERT INTO cart_items (
         cart_id, crop_id, grade, qty_kg, unit_price, line_total,
         allocation_id, reserved_until, status
       )
       VALUES ($1, $2, $3, $4::numeric, $5::numeric, $6::numeric, $7, $8, 'HELD')
       ON CONFLICT (cart_id, crop_id, grade)
       DO UPDATE SET
         qty_kg = cart_items.qty_kg + EXCLUDED.qty_kg,
         unit_price = EXCLUDED.unit_price,
         line_total = (cart_items.qty_kg + EXCLUDED.qty_kg) * EXCLUDED.unit_price,
         allocation_id = EXCLUDED.allocation_id,
         reserved_until = EXCLUDED.reserved_until,
         status = 'HELD',
         updated_at = now()`,
      [
        params.cartId,
        params.cropId,
        params.grade,
        params.qtyKg,
        params.unitPrice,
        params.lineTotal,
        params.allocationId,
        params.reservedUntil,
      ],
    );
  },

  async updateCartLockAndSubtotal(db, cartId, warehouseId, lockHours) {
    const res = await db.query<CartRecord>(
      `UPDATE carts
          SET warehouse_id = COALESCE($2, warehouse_id),
              status = 'LOCKED',
              locked_at = now(),
              locked_until = now() + ($3 || ' hours')::interval,
              subtotal = (
                SELECT COALESCE(SUM(line_total), 0)
                  FROM cart_items
                 WHERE cart_id = $1 AND status = 'HELD'
              ),
              updated_at = now()
        WHERE id = $1
        RETURNING id, customer_id, warehouse_id, status, subtotal::text,
                  locked_at, locked_until, created_at, updated_at`,
      [cartId, warehouseId, lockHours],
    );
    return res.rows[0]!;
  },

  async clearCart(db, cartId) {
    const itemsRes = await db.query<{ allocation_id: string; qty_kg: string }>(
      `SELECT allocation_id, qty_kg::text
         FROM cart_items
        WHERE cart_id = $1 AND status = 'HELD' AND allocation_id IS NOT NULL`,
      [cartId],
    );

    for (const item of itemsRes.rows) {
      await db.query(
        `UPDATE allocations
            SET reserved_qty = GREATEST(0, reserved_qty - $2::numeric),
                updated_at = now()
          WHERE id = $1`,
        [item.allocation_id, item.qty_kg],
      );
    }

    await db.query(
      `UPDATE cart_items
          SET status = 'RELEASED',
              updated_at = now()
        WHERE cart_id = $1 AND status = 'HELD'`,
      [cartId],
    );

    await db.query(
      `UPDATE carts
          SET subtotal = 0,
              status = 'ACTIVE',
              locked_at = NULL,
              locked_until = NULL,
              updated_at = now()
        WHERE id = $1`,
      [cartId],
    );
  },

  async reapExpiredCarts(db, batchSize = 500) {
    const cartsRes = await db.query<{ id: string }>(
      `SELECT id
         FROM carts
        WHERE status IN ('ACTIVE', 'LOCKED')
          AND locked_until IS NOT NULL
          AND locked_until <= now()
        ORDER BY locked_until ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED`,
      [batchSize],
    );

    let releasedLines = 0;

    for (const cart of cartsRes.rows) {
      const itemsRes = await db.query<{ id: string; allocation_id: string; qty_kg: string }>(
        `SELECT id, allocation_id, qty_kg::text
           FROM cart_items
          WHERE cart_id = $1 AND status = 'HELD'`,
        [cart.id],
      );

      for (const item of itemsRes.rows) {
        if (item.allocation_id) {
          await db.query(
            `UPDATE allocations
                SET reserved_qty = GREATEST(0, reserved_qty - $2::numeric),
                    updated_at = now()
              WHERE id = $1`,
            [item.allocation_id, item.qty_kg],
          );
        }
        releasedLines++;
      }

      await db.query(
        `UPDATE cart_items
            SET status = 'EXPIRED',
                updated_at = now()
          WHERE cart_id = $1 AND status = 'HELD'`,
        [cart.id],
      );

      await db.query(
        `UPDATE carts
            SET status = 'EXPIRED',
                updated_at = now()
          WHERE id = $1`,
        [cart.id],
      );
    }

    return {
      scanned: cartsRes.rows.length,
      expiredCarts: cartsRes.rows.length,
      releasedLines,
    };
  },
};
