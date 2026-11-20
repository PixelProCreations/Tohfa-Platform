/**
 * BR-201: delivery slot availability. Read-only: nothing here books, holds or changes a slot.
 *
 *  - Slot windows are fixed by the `delivery_slot` enum names, in Asia/Kolkata (UTC+05:30, no DST).
 *  - A `delivery_slots` row gives capacity / booked / is_active for one warehouse-day-slot. No row
 *    means uncapped, exactly as checkout treats it (orders.repo checkAndBookDeliverySlot books only
 *    an existing row), so the list and checkout cannot disagree.
 *  - `bookable` is what checkout enforces (active and booked < capacity); a slot that is not
 *    bookable is refused at quote and checkout with 409 SLOT_FULL.
 *  - `cutoff` = slot start - system_config.delivery_slot_cutoff_minutes. `cutoffPassed` is reported
 *    here and enforced at quote and checkout with 409 SLOT_CUTOFF_PASSED (BR-210).
 */
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { deliverySlots, type DeliverySlot } from '../orders/orders.schema.js';
import { todayInKolkata } from '../orders/orders.pricing.js';
import { deliverySlotsRepo, type DeliverySlotsRepo, type SlotRow } from './delivery-slots.repo.js';
import type { DeliverySlotList, DeliverySlotView, ListDeliverySlotsQuery } from './delivery-slots.schema.js';

/** Documented default when the config row is missing or invalid (migration 0170). */
export const DEFAULT_SLOT_CUTOFF_MINUTES = 120;

const WINDOWS: Record<DeliverySlot, { startHour: number; endHour: number; label: string }> = {
  MORNING_8_12: { startHour: 8, endHour: 12, label: '8 AM - 12 PM' },
  AFTERNOON_12_4: { startHour: 12, endHour: 16, label: '12 PM - 4 PM' },
  EVENING_4_8: { startHour: 16, endHour: 20, label: '4 PM - 8 PM' },
};

function kolkataInstant(date: string, hour: number): Date {
  return new Date(`${date}T${String(hour).padStart(2, '0')}:00:00+05:30`);
}

export function slotStart(date: string, slot: DeliverySlot): Date {
  return kolkataInstant(date, WINDOWS[slot].startHour);
}

export function parseCutoffMinutes(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  return Number.isInteger(n) && n >= 0 ? n : DEFAULT_SLOT_CUTOFF_MINUTES;
}

/** Pure: one slot's availability view. */
export function describeSlot(
  date: string,
  slot: DeliverySlot,
  row: SlotRow | null,
  cutoffMinutes: number,
  now: Date,
): DeliverySlotView {
  const window = WINDOWS[slot];
  const start = kolkataInstant(date, window.startHour);
  const cutoff = new Date(start.getTime() - cutoffMinutes * 60_000);
  const capacity = row === null ? null : row.capacity;
  const booked = row === null ? 0 : row.booked;
  const isActive = row === null ? true : row.isActive;
  const available = capacity === null ? null : Math.max(0, capacity - booked);
  return {
    slot,
    label: window.label,
    date,
    startsAt: start.toISOString(),
    endsAt: kolkataInstant(date, window.endHour).toISOString(),
    cutoff: cutoff.toISOString(),
    cutoffPassed: now.getTime() >= cutoff.getTime(),
    capacity,
    booked,
    available,
    isActive,
    bookable: isActive && (available === null || available > 0),
  };
}

export interface DeliverySlotsService {
  listSlots(query: ListDeliverySlotsQuery, now?: Date): Promise<DeliverySlotList>;
  /** One slot's view (used by the checkout quote, BR-200). Does not check the warehouse. */
  describeOne(executor: Executor, warehouseId: string, date: string, slot: DeliverySlot, now?: Date): Promise<DeliverySlotView>;
}

export function createDeliverySlotsService(deps: { repo?: DeliverySlotsRepo; db?: Executor } = {}): DeliverySlotsService {
  const repo = deps.repo ?? deliverySlotsRepo;
  const db = deps.db ?? pool;

  return {
    async listSlots(query, now = new Date()) {
      if (query.date < todayInKolkata(now)) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'Delivery date cannot be in the past.',
          errors: { 'query.date': ['must be today or later (Asia/Kolkata)'] },
        });
      }
      if (!(await repo.warehouseExists(db, query.warehouseId))) {
        throw new AppError('NOT_FOUND', { detail: `No warehouse with id ${query.warehouseId}.` });
      }
      const [rows, rawCutoff] = await Promise.all([
        repo.listSlots(db, query.warehouseId, query.date),
        repo.getCutoffMinutesRaw(db),
      ]);
      const cutoffMinutes = parseCutoffMinutes(rawCutoff);
      const bySlot = new Map(rows.map((r) => [r.slot, r]));
      return {
        warehouseId: query.warehouseId,
        date: query.date,
        items: deliverySlots.map((slot) => describeSlot(query.date, slot, bySlot.get(slot) ?? null, cutoffMinutes, now)),
      };
    },

    async describeOne(executor, warehouseId, date, slot, now = new Date()) {
      const [row, rawCutoff] = await Promise.all([
        repo.getSlot(executor, warehouseId, date, slot),
        repo.getCutoffMinutesRaw(executor),
      ]);
      return describeSlot(date, slot, row, parseCutoffMinutes(rawCutoff), now);
    },
  };
}

export const deliverySlotsService = createDeliverySlotsService();
