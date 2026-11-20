import { z } from 'zod';

export const walletOwnerTypes = ['CUSTOMER', 'FARMER'] as const;
export type WalletOwnerType = (typeof walletOwnerTypes)[number];

export const walletStatuses = ['ACTIVE', 'FROZEN'] as const;
export type WalletStatus = (typeof walletStatuses)[number];

export const walletTxnTypes = [
  'TOPUP_CASH',
  'TOPUP_DIGITAL',
  'ORDER_DEBIT',
  'ORDER_REFUND',
  'PAYOUT_DEBIT',
  'SALE_CREDIT',
  'SUBSCRIPTION_DEBIT',
  'ADJUSTMENT',
  // BR-150: the two legs of a customer-to-customer transfer (migration 0110).
  'TRANSFER_OUT',
  'TRANSFER_IN',
] as const;
export type WalletTxnType = (typeof walletTxnTypes)[number];

/**
 * BR-129 (owner decision 2026-10-27, option c): the only status a ledger row can have. True by
 * construction: a row is written only in the transaction that settles the money, so pending and
 * failed top-ups never reach the ledger. Set by the serializer, never stored. A pending or failed
 * feed, if ever added, comes from a separate non-ledger source and widens this by a new rule.
 */
export const walletTxnStatuses = ['COMPLETED'] as const;
export type WalletTxnStatus = (typeof walletTxnStatuses)[number];

/** Matches Money string format in OpenAPI. */
const moneySchema = z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/);

/** Response representation of a Wallet. Keep aligned with docs/openapi.yaml. */
export const walletResponse = z
  .object({
    id: z.string().uuid(),
    ownerType: z.enum(walletOwnerTypes),
    balance: moneySchema,
    currency: z.literal('INR'),
    status: z.enum(walletStatuses),
    updatedAt: z.string().nullable().optional(),
    /** BR-193: only on GET /wallets/me. */
    topupLimits: z.object({ min: moneySchema, max: moneySchema }).strict().optional(),
  })
  .strict();
export type WalletResponse = z.infer<typeof walletResponse>;

/** Response representation of a single transaction entry. */
export const walletTransactionResponse = z
  .object({
    id: z.string().uuid(),
    walletId: z.string().uuid(),
    txnType: z.enum(walletTxnTypes),
    amount: moneySchema, // Signed: negative for DEBIT
    balanceAfter: moneySchema,
    refType: z.string().nullable(),
    refId: z.string().uuid().nullable(),
    fiscalCashTag: z.string().nullable(),
    warehouseId: z.string().uuid().nullable(),
    performedBy: z.string().uuid().nullable(),
    performedAt: z.string(),
    remarks: z.string().nullable(),
    status: z.enum(walletTxnStatuses),
    /** BR-197: own-ledger display fields. */
    txnCode: z.string().optional(),
    orderNumber: z.string().nullable().optional(),
  })
  .strict();
export type WalletTransactionResponse = z.infer<typeof walletTransactionResponse>;

const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

/** GET /v1/wallets/me/transactions query parameters */
export const listMyTransactionsQuery = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(walletTxnTypes).optional(),
    // BR-183: a bare date (YYYY-MM-DD) means the whole UTC day (from = 00:00:00.000Z, to = 23:59:59.999Z).
    from: z
      .union([z.string().datetime(), z.string().regex(dateOnly, 'from must be a date or date-time')])
      .transform((v) => (dateOnly.test(v) ? `${v}T00:00:00.000Z` : v))
      .optional(),
    to: z
      .union([z.string().datetime(), z.string().regex(dateOnly, 'to must be a date or date-time')])
      .transform((v) => (dateOnly.test(v) ? `${v}T23:59:59.999Z` : v))
      .optional(),
    // BR-129: every ledger row is COMPLETED, so this filter only validates the value.
    status: z.enum(walletTxnStatuses).optional(),
    tab: z.enum(['all', 'credits', 'debits', 'refunds']).default('all'),
  })
  .strict();
export type ListMyTransactionsQuery = z.infer<typeof listMyTransactionsQuery>;

export const listTransactionsResponse = z
  .object({
    items: z.array(walletTransactionResponse),
    page: z.object({
      nextCursor: z.string().nullable(),
      hasMore: z.boolean(),
    }),
  })
  .strict();
export type ListTransactionsResponse = z.infer<typeof listTransactionsResponse>;
