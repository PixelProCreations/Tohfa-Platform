import type { Executor } from '../../db/pool.js';
import type { DeliverySlot } from '../orders/orders.schema.js';

export interface SlotRow {
  slot: DeliverySlot;
  capacity: number;
  booked: number;
  isActive: boolean;
}

/** BR-201: read-only slot queries. Booking stays in orders.repo checkAndBookDeliverySlot (FOR UPDATE). */
export interface DeliverySlotsRepo {
  /** A live (not deleted) warehouse with this id exists. */
  warehouseExists(db: Executor, warehouseId: string): Promise<boolean>;
  listSlots(db: Executor, warehouseId: string, date: string): Promise<SlotRow[]>;
  getSlot(db: Executor, warehouseId: string, date: string, slot: DeliverySlot): Promise<SlotRow | null>;
  /** Raw system_config.delivery_slot_cutoff_minutes; undefined when the row is missing. */
  getCutoffMinutesRaw(db: Executor): Promise<unknown>;
}

const SLOT_COLUMNS = `slot, capacity_orders AS capacity, booked_orders AS booked, is_active AS "isActive"`;

export const deliverySlotsRepo: DeliverySlotsRepo = {
  async warehouseExists(db, warehouseId) {
    const res = await db.query(
      `SELECT 1 FROM warehouses WHERE id = $1 AND deleted_at IS NULL`,
      [warehouseId],
    );
    return (res.rowCount ?? 0) > 0;
  },

  async listSlots(db, warehouseId, date) {
    const res = await db.query<SlotRow>(
      `SELECT ${SLOT_COLUMNS}
         FROM delivery_slots
        WHERE warehouse_id = $1 AND slot_date = $2::date`,
      [warehouseId, date],
    );
    return res.rows;
  },

  async getSlot(db, warehouseId, date, slot) {
    const res = await db.query<SlotRow>(
      `SELECT ${SLOT_COLUMNS}
         FROM delivery_slots
        WHERE warehouse_id = $1 AND slot_date = $2::date AND slot = $3`,
      [warehouseId, date, slot],
    );
    return res.rows[0] ?? null;
  },

  async getCutoffMinutesRaw(db) {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'delivery_slot_cutoff_minutes'`,
    );
    return res.rows[0]?.value;
  },
};
