import { z } from 'zod';

export const paymentMethodTypes = ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD'] as const;
export type PaymentMethodType = (typeof paymentMethodTypes)[number];

export const paymentMethodIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type PaymentMethodIdParam = z.infer<typeof paymentMethodIdParamSchema>;

export const createPaymentMethodSchema = z.object({
  type: z.enum(paymentMethodTypes),
  label: z.string().trim().min(1, 'Label cannot be empty').max(100),
  isDefault: z.boolean().optional().default(false),
  config: z.record(z.unknown()).optional().default({}),
  isActive: z.boolean().optional().default(true),
});
export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;

export const updatePaymentMethodSchema = z
  .object({
    type: z.enum(paymentMethodTypes).optional(),
    label: z.string().trim().min(1).max(100).optional(),
    isDefault: z.boolean().optional(),
    config: z.record(z.unknown()).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;

export const listPaymentMethodsQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'all']).default('all').optional(),
});
export type ListPaymentMethodsQuery = z.infer<typeof listPaymentMethodsQuerySchema>;

export const paymentMethodResponseSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(paymentMethodTypes),
  label: z.string(),
  isDefault: z.boolean(),
  config: z.record(z.unknown()),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PaymentMethodResponse = z.infer<typeof paymentMethodResponseSchema>;
