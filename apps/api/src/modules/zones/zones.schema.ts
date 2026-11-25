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

export const createZoneBody = z
  .object({
    code: z.string().trim().min(2).max(40),
    name: z.string().trim().min(2).max(120),
    warehouseId: z.string().uuid().optional(),
    description: z.string().trim().max(1000).optional(),
    taluks: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
    isActive: z.boolean().default(true),
  })
  .strict();
export type CreateZoneBody = z.infer<typeof createZoneBody>;

export const updateZoneBody = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    warehouseId: z.string().uuid().nullable().optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    taluks: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field must be supplied' });
export type UpdateZoneBody = z.infer<typeof updateZoneBody>;

export const transferZoneFarmersBody = z
  .object({
    targetZoneId: z.string().uuid('targetZoneId must be a UUID'),
    farmerIds: z.array(z.string().uuid()).min(1).max(500).optional(),
    reason: z.string().trim().min(3, 'reason must be at least 3 characters').max(500),
  })
  .strict();
export type TransferZoneFarmersBody = z.infer<typeof transferZoneFarmersBody>;
