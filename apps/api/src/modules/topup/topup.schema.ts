import { z } from 'zod';
import { type Money } from '@tohfa/shared-types';

const moneySchema = z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/);

export const topupModes = ['UPI', 'CARD', 'NETBANKING'] as const;
export type TopupMode = (typeof topupModes)[number];

export const createTopupSchema = z.object({
  amount: moneySchema,
  mode: z.enum(topupModes),
});
export type CreateTopupInput = {
  amount: Money;
  mode: TopupMode;
};

export const topupIntentResponseSchema = z.object({
  topupId: z.string().uuid(),
  gateway: z.literal('RAZORPAY'),
  gatewayOrderId: z.string(),
  amount: moneySchema,
  currency: z.literal('INR'),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
  razorpayKeyId: z.string(),
  presetAmounts: z.array(moneySchema).optional(),
});
export type TopupIntentResponse = {
  topupId: string;
  gateway: 'RAZORPAY';
  gatewayOrderId: string;
  amount: Money;
  currency: 'INR';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  razorpayKeyId: string;
  presetAmounts?: Money[];
};

export const razorpayWebhookBodySchema = z.object({
  event: z.string(),
  created_at: z.number().int().optional(),
  payload: z.record(z.unknown()).optional(),
});
export type RazorpayWebhookBody = z.infer<typeof razorpayWebhookBodySchema>;

export const webhookResponseSchema = z.object({
  received: z.boolean(),
  duplicate: z.boolean().optional(),
});
export type WebhookResponse = z.infer<typeof webhookResponseSchema>;

export const customerIdParamSchema = z.object({
  customerId: z.string().uuid(),
});
export type CustomerIdParam = z.infer<typeof customerIdParamSchema>;

export const cashTopupCreateSchema = z.object({
  amount: moneySchema,
  warehouseId: z.string().uuid(),
  fiscalCashTag: z.string().min(3).max(60),
  remarks: z.string().max(300).optional(),
});
export type CashTopupCreateInput = {
  amount: Money;
  warehouseId: string;
  fiscalCashTag: string;
  remarks?: string | undefined;
};

/**
 * GET /admin/wallets/cash-topup/customers/lookup (BR-91i). Exact `mobile` OR exact `code`, never
 * both and never a name/partial search: this lookup ignores the BR-91 warehouse-history gate, so
 * it must only answer "is this the person standing at the counter", not let anyone browse.
 * The `mobile` pattern is the sales counter lookup's (docs/openapi.yaml lookupAdminSaleCustomer).
 */
export const cashTopupCustomerLookupQuery = z
  .object({
    mobile: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
    code: z.string().min(1).max(40).optional(),
  })
  .strict()
  .superRefine((query, ctx) => {
    const given = [query.mobile, query.code].filter((v) => v !== undefined).length;
    if (given !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mobile'], message: 'Exactly one of mobile or code is required.' });
    }
  });
export type CashTopupCustomerLookupQuery = z.infer<typeof cashTopupCustomerLookupQuery>;

/** The match shape is the sales counter's SaleCustomerMatch (same allow-list, masked mobile). */
export { customerLookupResponse as cashTopupCustomerLookupResponse } from '../sales/sales.schema.js';
export type { CustomerLookupResponse as CashTopupCustomerLookupResponse } from '../sales/sales.schema.js';
