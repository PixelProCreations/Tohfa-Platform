import { z } from 'zod';

const pincode = z.string().trim().regex(/^[1-9][0-9]{5}$/, 'pincode must be 6 digits');

/** GET /v1/serviceability (docs/openapi.yaml `getServiceability`). Needs a pincode or a lat+lng pair. */
export const serviceabilityQuery = z
  .object({
    pincode: pincode.optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
  })
  .strict()
  .refine((q) => (q.lat === undefined) === (q.lng === undefined), {
    message: 'lat and lng must be provided together',
    path: ['lat'],
  })
  .refine((q) => q.pincode !== undefined || q.lat !== undefined, {
    message: 'Provide a pincode or lat and lng',
    path: ['pincode'],
  });
export type ServiceabilityQuery = z.infer<typeof serviceabilityQuery>;

export const serviceabilityResponse = z
  .object({
    serviceable: z.boolean(),
    nearestPickupPointId: z.string().uuid().optional(),
    deliveryAvailable: z.boolean(),
  })
  .strict();
export type ServiceabilityResponse = z.infer<typeof serviceabilityResponse>;

/** POST /v1/service-area-requests body. */
export const createAreaRequestBody = z
  .object({
    area: z.string().trim().min(2).max(120),
    locality: z.string().trim().min(2).max(120),
    city: z.string().trim().min(2).max(80),
    pincode: pincode.optional(),
    contact: z.string().trim().min(5).max(120).optional(),
  })
  .strict();
export type CreateAreaRequestBody = z.infer<typeof createAreaRequestBody>;

export const areaRequestSchema = z
  .object({
    id: z.string().uuid(),
    area: z.string(),
    locality: z.string(),
    city: z.string(),
    pincode: z.string().nullable(),
    status: z.enum(['NEW', 'REVIEWED', 'SERVED', 'DECLINED']),
    createdAt: z.string(),
  })
  .strict();
export type AreaRequest = z.infer<typeof areaRequestSchema>;

/** Admin view adds who asked (contact is PII; admin-only). */
export const adminAreaRequestSchema = areaRequestSchema
  .extend({ contact: z.string().nullable(), customerId: z.string().uuid().nullable() })
  .strict();
export type AdminAreaRequest = z.infer<typeof adminAreaRequestSchema>;

export const listAreaRequestsQuery = z
  .object({
    status: z.enum(['NEW', 'REVIEWED', 'SERVED', 'DECLINED']).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();
export type ListAreaRequestsQuery = z.infer<typeof listAreaRequestsQuery>;

/** GET /v1/service-area-requests/me (BR-198): the caller's own requests, newest first. */
export const listMyAreaRequestsQuery = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListMyAreaRequestsQuery = z.infer<typeof listMyAreaRequestsQuery>;

export const myAreaRequestListResponse = z
  .object({ items: z.array(areaRequestSchema), total: z.number().int(), page: z.number().int(), limit: z.number().int() })
  .strict();
export type MyAreaRequestList = z.infer<typeof myAreaRequestListResponse>;
