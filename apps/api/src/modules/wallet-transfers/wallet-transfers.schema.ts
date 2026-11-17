import { z } from 'zod';

/** Matches `Money` in docs/openapi.yaml; positive-only checks happen in the service. */
const moneySchema = z.string().regex(/^[0-9]{1,10}(\.[0-9]{1,2})?$/);
/** E.164, same rule as users_mobile_e164_chk (0002). */
const mobileSchema = z.string().regex(/^\+[1-9][0-9]{7,14}$/);

export const transferLookupBody = z.object({ mobile: mobileSchema }).strict();
export type TransferLookupBody = z.infer<typeof transferLookupBody>;

export const transferRecipientSchema = z
  .object({
    displayName: z.string(),
    mobileMasked: z.string(),
  })
  .strict();
export type TransferRecipient = z.infer<typeof transferRecipientSchema>;

export const TRANSFER_NOTE_MAX = 100;

/**
 * BR-150k: the note is shown to the recipient, so it is plain text only. Control, zero-width and
 * bidi-override characters and angle brackets are removed, whitespace runs collapse to one space,
 * and a note that is empty after that is treated as absent.
 */
export function sanitizeTransferNote(raw: string): string | undefined {
  const cleaned = raw
    .normalize('NFC')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length === 0 ? undefined : cleaned;
}

export const createTransferBody = z
  .object({
    recipientMobile: mobileSchema,
    amount: moneySchema,
    // Sanitising only ever shortens, so the 100-char limit holds before and after.
    note: z.string().max(TRANSFER_NOTE_MAX).transform(sanitizeTransferNote).optional(),
  })
  .strict();
export type CreateTransferBody = z.infer<typeof createTransferBody>;

export const walletTransferSchema = z
  .object({
    id: z.string().uuid(),
    direction: z.enum(['SENT', 'RECEIVED']),
    amount: moneySchema,
    counterparty: transferRecipientSchema,
    note: z.string().nullable(),
    status: z.literal('COMPLETED'),
    createdAt: z.string(),
  })
  .strict();
export type WalletTransfer = z.infer<typeof walletTransferSchema>;

/** POST response: the transfer plus the sender's balance after the debit. */
export const createTransferResponse = walletTransferSchema
  .extend({ balanceAfter: moneySchema })
  .strict();
export type CreateTransferResponse = z.infer<typeof createTransferResponse>;

export const listTransfersQuery = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListTransfersQuery = z.infer<typeof listTransfersQuery>;

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** GET /admin/wallet-transfers (BR-150l). Dates are inclusive Asia/Kolkata calendar days. */
export const adminListTransfersQuery = z
  .object({
    customerId: z.string().uuid().optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    minAmount: moneySchema.optional(),
    maxAmount: moneySchema.optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type AdminListTransfersQuery = z.infer<typeof adminListTransfersQuery>;

const adminTransferPartySchema = z
  .object({ customerId: z.string().uuid(), fullName: z.string(), mobile: z.string() })
  .strict();

export const adminWalletTransferSchema = z
  .object({
    id: z.string().uuid(),
    amount: moneySchema,
    note: z.string().nullable(),
    status: z.literal('COMPLETED'),
    createdAt: z.string(),
    sender: adminTransferPartySchema,
    recipient: adminTransferPartySchema,
    debitTxnId: z.string().uuid(),
    creditTxnId: z.string().uuid(),
  })
  .strict();
export type AdminWalletTransfer = z.infer<typeof adminWalletTransferSchema>;

export const adminListTransfersResponse = z
  .object({
    items: z.array(adminWalletTransferSchema),
    page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }).strict(),
  })
  .strict();
export type AdminListTransfersResponse = z.infer<typeof adminListTransfersResponse>;

export const listTransfersResponse = z
  .object({
    items: z.array(walletTransferSchema),
    page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }).strict(),
  })
  .strict();
export type ListTransfersResponse = z.infer<typeof listTransfersResponse>;
