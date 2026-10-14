/**
 * BR-80: SQL for the warehouse performance read. Every figure is an exact COUNT or SUM over one
 * warehouse and an inclusive IST day window ([from 00:00 IST, to + 1 day 00:00 IST)), the same window
 * the reports module uses. Quantities stay NUMERIC in SQL and leave as text, so no float touches them.
 * Nothing is written.
 */
import type { Executor } from '../../db/pool.js';
import type { WarehousePerformance } from './warehouse-performance.schema.js';

export interface PerformanceWindow {
  warehouseId: string;
  from: string;
  to: string;
}

export type PerformanceFigures = Omit<WarehousePerformance, 'warehouseId' | 'from' | 'to'>;

export interface WarehousePerformanceRepo {
  figures(db: Executor, window: PerformanceWindow): Promise<PerformanceFigures>;
}

/** $2 = from, $3 = to (IST dates); $1 is always the warehouse id. */
const inWindow = (column: string): string =>
  `${column} >= ($2::date)::timestamp AT TIME ZONE 'Asia/Kolkata'
   AND ${column} < (($3::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')`;

const FULFILLED_STATUSES = ['PICKED_UP', 'DELIVERED'];

export const warehousePerformanceRepo: WarehousePerformanceRepo = {
  async figures(db, { warehouseId, from, to }) {
    const params = [warehouseId, from, to];

    const orders = await db.query<{ status: PerformanceFigures['orders']['byStatus'][number]['status']; count: number }>(
      `SELECT o.status::text AS status, COUNT(*)::int AS count
         FROM orders o
        WHERE o.warehouse_id = $1 AND ${inWindow('o.placed_at')}
        GROUP BY o.status ORDER BY o.status::text`,
      params,
    );

    const receiptsByStatus = await db.query<{ status: PerformanceFigures['receiving']['byStatus'][number]['status']; count: number }>(
      `SELECT gr.status::text AS status, COUNT(*)::int AS count
         FROM goods_receipts gr
        WHERE gr.warehouse_id = $1 AND ${inWindow('gr.received_at')}
        GROUP BY gr.status ORDER BY gr.status::text`,
      params,
    );
    const receiptQty = await db.query<{ gross: string; accepted: string; rejected: string }>(
      `SELECT COALESCE(SUM(gr.gross_qty_kg), 0)::numeric(14,3)::text AS gross,
              COALESCE(SUM(gr.accepted_qty_kg), 0)::numeric(14,3)::text AS accepted,
              COALESCE(SUM(gr.rejected_qty_kg), 0)::numeric(14,3)::text AS rejected
         FROM goods_receipts gr
        WHERE gr.warehouse_id = $1 AND ${inWindow('gr.received_at')}`,
      params,
    );

    // return_requests has no warehouse_id of its own (0046_returns.sql): scope on the order's.
    const returns = await db.query<{ status: PerformanceFigures['returns']['byStatus'][number]['status']; count: number }>(
      `SELECT r.status::text AS status, COUNT(*)::int AS count
         FROM return_requests r JOIN orders o ON o.id = r.order_id
        WHERE o.warehouse_id = $1 AND ${inWindow('r.created_at')}
        GROUP BY r.status ORDER BY r.status::text`,
      params,
    );

    const movements = await db.query<{ movement_type: PerformanceFigures['stockMovements'][number]['movementType']; entries: number; qty: string }>(
      `SELECT l.movement_type::text AS movement_type, COUNT(*)::int AS entries, SUM(l.qty_delta)::numeric(14,3)::text AS qty
         FROM stock_ledger l
        WHERE l.warehouse_id = $1 AND ${inWindow('l.created_at')}
        GROUP BY l.movement_type ORDER BY l.movement_type::text`,
      params,
    );

    const placed = orders.rows.reduce((sum, row) => sum + row.count, 0);
    const count = (status: string): number => orders.rows.find((row) => row.status === status)?.count ?? 0;
    const qty = receiptQty.rows[0]!;
    return {
      orders: {
        placed,
        fulfilled: FULFILLED_STATUSES.reduce((sum, status) => sum + count(status), 0),
        cancelled: count('CANCELLED'),
        byStatus: orders.rows,
      },
      receiving: {
        goodsReceipts: receiptsByStatus.rows.reduce((sum, row) => sum + row.count, 0),
        byStatus: receiptsByStatus.rows,
        grossQtyKg: qty.gross,
        acceptedQtyKg: qty.accepted,
        rejectedQtyKg: qty.rejected,
      },
      returns: {
        requested: returns.rows.reduce((sum, row) => sum + row.count, 0),
        byStatus: returns.rows,
      },
      stockMovements: movements.rows.map((row) => ({ movementType: row.movement_type, entries: row.entries, qtyKg: row.qty })),
    };
  },
};
