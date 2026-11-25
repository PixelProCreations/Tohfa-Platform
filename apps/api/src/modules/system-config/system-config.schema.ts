import { z } from 'zod';

export const configDataTypes = ['string', 'number', 'boolean', 'json'] as const;
export type ConfigDataType = (typeof configDataTypes)[number];

export const configKeyParams = z
  .object({
    key: z.string().trim().min(1).max(120),
  })
  .strict();

export const updateSystemConfigBody = z
  .object({
    value: z.unknown(),
    reason: z.string().trim().min(3).max(500).optional(),
  })
  .strict()
  .refine((b) => 'value' in b && b.value !== undefined, { message: 'value is required' });
export type UpdateSystemConfigBody = z.infer<typeof updateSystemConfigBody>;

export const systemConfigItemResponse = z.object({
  id: z.string().uuid(),
  key: z.string(),
  value: z.unknown(),
  dataType: z.enum(configDataTypes),
  description: z.string().nullable(),
  isEditable: z.boolean(),
  updatedAt: z.string().nullable(),
});
export type SystemConfigItemResponse = z.infer<typeof systemConfigItemResponse>;
