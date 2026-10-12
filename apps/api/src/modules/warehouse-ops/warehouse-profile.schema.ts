/**
 * BR-80: warehouse profile writes. `PATCH /v1/warehouses/{id}` edits the contact phone and the
 * operating hours and NOTHING else: the body is `.strict()`, so name, code, type, city, address,
 * coordinates, capacity and status are rejected with 422 instead of being silently ignored.
 *
 * UNCONFIRMED DEFAULT (owner approval pending): `warehouses.operating_hours` is a free jsonb column
 * and no document defines its format. This is the one minimal, strict shape the API accepts: all
 * seven weekdays, each `{ "closed": true }` or `{ "closed": false, "open": "HH:MM", "close": "HH:MM" }`
 * (24-hour clock, `open` strictly before `close`; an overnight shift is not representable).
 * The contact phone is E.164, like every other phone field in the API.
 */
import { z } from 'zod';

export const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be a 24-hour HH:MM time');

const closedDay = z.object({ closed: z.literal(true) }).strict();
const openDay = z
  .object({ closed: z.literal(false), open: time, close: time })
  .strict()
  // HH:MM strings of the same width compare correctly as text.
  .refine((day) => day.open < day.close, { message: '"open" must be earlier than "close"', path: ['close'] });
const day = z.union([closedDay, openDay]);

export const operatingHoursSchema = z
  .object({
    mon: day,
    tue: day,
    wed: day,
    thu: day,
    fri: day,
    sat: day,
    sun: day,
  })
  .strict();
export type OperatingHours = z.infer<typeof operatingHoursSchema>;

const contactPhone = z.string().regex(/^\+[1-9][0-9]{7,14}$/, 'Must be a valid E.164 phone number (+91...)');

/** PATCH /v1/warehouses/{id}. `null` clears the value. */
export const updateWarehouseProfileBody = z
  .object({
    contactPhone: contactPhone.nullable().optional(),
    operatingHours: operatingHoursSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => value.contactPhone !== undefined || value.operatingHours !== undefined, {
    message: 'At least one of contactPhone or operatingHours must be provided',
  });
export type UpdateWarehouseProfileBody = z.infer<typeof updateWarehouseProfileBody>;
