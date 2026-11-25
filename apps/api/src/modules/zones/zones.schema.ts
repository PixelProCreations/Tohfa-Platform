import { z } from 'zod';

export const listZonesQuery = z
  .object({
    status: z
      .preprocess(
        (val) => (typeof val === 'string' ? val.toUpperCase() : val),
        z.enum(['ACTIVE', 'INACTIVE', 'ALL']),
      )
      .default('ACTIVE')
      .optional(),
    warehouseId: z.string().uuid().optional(),
  })
  .strict();
export type ListZonesQuery = z.infer<typeof listZonesQuery>;

export const zoneIdParams = z
  .object({
    id: z.string().uuid(),
  })
  .strict();
export type ZoneIdParams = z.infer<typeof zoneIdParams>;

export const adminZoneListItemSchema = z
  .object({
    id: z.string().uuid(),
    code: z.string(),
    shortCode: z.string(),
    name: z.string(),
    warehouseId: z.string().uuid().nullable(),
    warehouseName: z.string().nullable(),
    description: z.string().nullable(),
    taluks: z.array(z.string()),
    isActive: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .strict();
export type AdminZoneListItem = z.infer<typeof adminZoneListItemSchema>;

export const publicZoneListItemSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    warehouseTown: z.string(),
  })
  .strict();
export type PublicZoneListItem = z.infer<typeof publicZoneListItemSchema>;

export const zoneManagerSchema = z
  .object({
    userId: z.string().uuid(),
    fullName: z.string(),
    mobile: z.string(),
  })
  .strict();
export type ZoneManager = z.infer<typeof zoneManagerSchema>;

export const adminZoneDetailSchema = z
  .object({
    id: z.string().uuid(),
    code: z.string(),
    shortCode: z.string(),
    name: z.string(),
    warehouseId: z.string().uuid().nullable(),
    warehouseName: z.string().nullable(),
    description: z.string().nullable(),
    taluks: z.array(z.string()),
    manager: zoneManagerSchema.nullable(),
    isActive: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .strict();
export type AdminZoneDetail = z.infer<typeof adminZoneDetailSchema>;
