import { z } from 'zod';
import { deliverySlots, type DeliverySlot } from '../orders/orders.schema.js';

/** GET /v1/delivery-slots query (BR-201). */
export const listDeliverySlotsQuery = z
  .object({
    warehouseId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  })
  .strict();
export type ListDeliverySlotsQuery = z.infer<typeof listDeliverySlotsQuery>;

export const deliverySlotViewSchema = z
  .object({
    slot: z.enum(deliverySlots),
    label: z.string(),
    date: z.string(),
    startsAt: z.string(),
    endsAt: z.string(),
    /** Instant after which the slot is shown as closed for new orders (informational). */
    cutoff: z.string(),
    cutoffPassed: z.boolean(),
    /** null = no capacity row for this day: uncapped. */
    capacity: z.number().int().nullable(),
    booked: z.number().int(),
    /** capacity - booked, never below 0; null when uncapped. */
    available: z.number().int().nullable(),
    isActive: z.boolean(),
    /** What checkout enforces: active and not full. */
    bookable: z.boolean(),
  })
  .strict();
export type DeliverySlotView = {
  slot: DeliverySlot;
  label: string;
  date: string;
  startsAt: string;
  endsAt: string;
  cutoff: string;
  cutoffPassed: boolean;
  capacity: number | null;
  booked: number;
  available: number | null;
  isActive: boolean;
  bookable: boolean;
};

export interface DeliverySlotList {
  warehouseId: string;
  date: string;
  items: DeliverySlotView[];
}
