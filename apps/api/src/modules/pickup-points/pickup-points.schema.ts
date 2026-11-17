import { z } from 'zod';

/** GET /v1/pickup-points query (docs/openapi.yaml `listPickupPoints`). lat and lng come together. */
export const listPickupPointsQuery = z
  .object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
  })
  .strict()
  .refine((q) => (q.lat === undefined) === (q.lng === undefined), {
    message: 'lat and lng must be provided together',
    path: ['lat'],
  });
export type ListPickupPointsQuery = z.infer<typeof listPickupPointsQuery>;

const hoursDay = z.union([
  z.object({ closed: z.literal(true) }).strict(),
  z.object({ closed: z.literal(false), open: z.string(), close: z.string() }).strict(),
]);
export const openingHoursSchema = z
  .object({ mon: hoursDay, tue: hoursDay, wed: hoursDay, thu: hoursDay, fri: hoursDay, sat: hoursDay, sun: hoursDay })
  .strict();

/** Allow-list: every key a customer may see (BR-170). Nothing else is ever serialised. */
export const pickupPointSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    address: z.string().nullable(),
    phone: z.string().nullable(),
    openingHours: openingHoursSchema.nullable(),
    isOpenNow: z.boolean(),
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    distanceKm: z.number().nullable().optional(),
    isNearest: z.boolean().optional(),
  })
  .strict();
export type PickupPoint = z.infer<typeof pickupPointSchema>;

export const pickupPointsResponse = z.object({ items: z.array(pickupPointSchema) }).strict();
