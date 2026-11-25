import { z } from 'zod';

export const marketDayIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createMarketDaySchema = z.object({
  warehouseId: z.string().uuid(),
  marketDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS'),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS'),
  isActive: z.boolean().optional().default(true),
  notes: z.string().max(1000).nullable().optional(),
});

export type CreateMarketDayInput = z.infer<typeof createMarketDaySchema>;

export const patchMarketDaySchema = z
  .object({
    startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
    isActive: z.boolean().optional(),
    notes: z.string().max(1000).nullable().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided to update' },
  );

export type PatchMarketDayInput = z.infer<typeof patchMarketDaySchema>;

export const listMarketDaysQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type ListMarketDaysQuery = z.infer<typeof listMarketDaysQuerySchema>;

export const marketDayResponseSchema = z.object({
  id: z.string().uuid(),
  warehouseId: z.string().uuid(),
  warehouseName: z.string().optional(),
  marketDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  isActive: z.boolean(),
  notes: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MarketDayResponse = z.infer<typeof marketDayResponseSchema>;
