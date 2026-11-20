/** Admin management of public pickup points (BR-185). */
import { z } from 'zod';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be zero-padded 24h HH:MM');
const adminHoursDay = z.union([
  z.object({ closed: z.literal(true) }).strict(),
  z
    .object({ closed: z.literal(false), open: hhmm, close: hhmm })
    .strict()
    .refine((d) => d.open < d.close, { message: 'open must be earlier than close (same day)' }),
]);
/**
 * Same shape the public serializer parses (`openingHoursSchema`), but stricter on writes: isOpenNow
 * compares HH:MM as strings, so values must be zero-padded and open < close.
 */
export const adminOpeningHoursSchema = z
  .object({
    mon: adminHoursDay, tue: adminHoursDay, wed: adminHoursDay, thu: adminHoursDay,
    fri: adminHoursDay, sat: adminHoursDay, sun: adminHoursDay,
  })
  .strict();

/**
 * Normalises an Indian mobile (6-9xxxxxxxxx) or landline (STD + number, 10 digits starting 2-5),
 * written with optional +91 / 91 / 0 prefix and spaces or dashes, to E.164. A non-Indian input that is
 * already E.164 (`+`, 8-15 digits) is kept. Anything else is rejected (null).
 */
export function normalisePhone(raw: string): string | null {
  const s = raw.trim().replace(/[\s-]/g, '');
  if (/^\+[1-9]\d{7,14}$/.test(s)) {
    if (s.startsWith('+91')) return /^\+91([6-9]\d{9}|[2-5]\d{9})$/.test(s) ? s : null;
    return s;
  }
  const m = /^(?:\+?91|0)?([6-9]\d{9}|[2-5]\d{9})$/.exec(s);
  return m ? `+91${m[1]}` : null;
}

const publicPhoneField = z.string().transform((v, ctx) => {
  const p = normalisePhone(v);
  if (p === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be an Indian mobile/landline or an E.164 number' });
    return z.NEVER;
  }
  return p;
});

export const pickupPointIdParams = z.object({ warehouseId: z.string().uuid() }).strict();

export const updatePickupPointBody = z
  .object({
    publicPhone: publicPhoneField.nullable().optional(),
    isPublic: z.boolean().optional(),
    openingHours: adminOpeningHoursSchema.nullable().optional(),
  })
  .strict()
  .refine((b) => Object.values(b).some((v) => v !== undefined), { message: 'at least one field is required' });
export type UpdatePickupPointBody = z.infer<typeof updatePickupPointBody>;

/** Admin view: pickup-point columns only, public or not. Never contact_phone / capacity / code. */
export interface AdminPickupPoint {
  id: string;
  name: string;
  address: string | null;
  publicPhone: string | null;
  isPublic: boolean;
  isActive: boolean;
  openingHours: unknown;
}
