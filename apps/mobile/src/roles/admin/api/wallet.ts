/**
 * Warehouse cash top-up — docs/openapi.yaml:
 *  - `POST /admin/wallets/{customerId}/cash-topup` (`createCashTopup`,
 *    `wallet.cash_topup.process`, BR-18, BR-19, BR-30)
 *
 * This is a REAL money write: the server credits the customer's wallet ledger.
 * So (root CLAUDE.md §2.4) it always carries an `Idempotency-Key`, and the
 * caller must reuse the same key for an identical retry (see
 * api/hooks.ts `useIdempotencyKey`). `processCashTopup` refuses to send
 * without one rather than let the server fall back to its own per-row key.
 *
 * BR-18: the client never asserts the credit. The result is the server's own
 * `WalletTransaction` ledger row, returned untouched so the screen shows the
 * real transaction id and balance.
 *
 * BR-19: the Rs 10,000 cap is the SERVER's enforcement (422
 * `CASH_LIMIT_EXCEEDED`); the form's pre-check (config/businessThresholds.ts)
 * is a UX guard only.
 *
 * BR-30: `warehouseId` is the caller's scope warehouse; this module never
 * picks one.
 *
 * Customer search (`GET /admin/sales/customers/lookup`) is deliberately NOT
 * wrapped here — see screens/warehouse/availability.ts
 * `cashTopupCustomerLookup` for why it is blocked (BR-91).
 */
import type { Money } from '../money/paise';
import { adminPost } from './http';

/** docs/openapi.yaml `WalletTransactionType`. */
export const WALLET_TRANSACTION_TYPES = [
  'TOPUP_CASH',
  'TOPUP_DIGITAL',
  'ORDER_DEBIT',
  'ORDER_REFUND',
  'PAYOUT_DEBIT',
  'SALE_CREDIT',
  'SUBSCRIPTION_DEBIT',
  'ADJUSTMENT',
] as const;
export type WalletTransactionTypeDto = (typeof WALLET_TRANSACTION_TYPES)[number];

/**
 * Problem codes this endpoint answers with. The spec documents 401/403/404 and
 * 422 `CASH_LIMIT_EXCEEDED`; apps/api/src/modules/topup/topup.service.ts also
 * emits 422 `FISCAL_TAG_REQUIRED`, 403 `WAREHOUSE_SCOPE_VIOLATION` and 409
 * `CONFLICT` (fiscal tag already used), and the shared idempotency contract
 * 409 `IDEMPOTENCY_KEY_REUSED`. The undocumented ones are a spec gap (reported).
 */
export const ERROR_CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'FISCAL_TAG_REQUIRED',
  'CASH_LIMIT_EXCEEDED',
  'WAREHOUSE_SCOPE_VIOLATION',
  'CONFLICT',
  'IDEMPOTENCY_KEY_REUSED',
  'INTERNAL',
] as const;

/** docs/openapi.yaml `CashTopupCreate`. */
export interface CashTopupBody {
  /** Decimal string, max INR 10,000.00 (BR-19). */
  amount: Money;
  warehouseId: string;
  /** 3..60 characters (BR-18). */
  fiscalCashTag: string;
  /** Up to 300 characters. */
  remarks?: string | undefined;
}

/** docs/openapi.yaml `WalletTransaction` — every key always present. */
export interface WalletTransactionDto {
  id: string;
  walletId: string;
  /** Typed as string so an enum value added server-side cannot break parsing. */
  txnType: WalletTransactionTypeDto | string;
  /** Signed: negative for debits. */
  amount: string;
  balanceAfter: string;
  refType: string | null;
  refId: string | null;
  fiscalCashTag: string | null;
  warehouseId: string | null;
  performedBy: string | null;
  performedAt: string;
  remarks: string | null;
}

export class MissingIdempotencyKeyError extends Error {
  constructor() {
    super('A cash top-up must carry an Idempotency-Key');
    this.name = 'MissingIdempotencyKeyError';
  }
}

export function processCashTopup(
  customerId: string,
  body: CashTopupBody,
  idempotencyKey: string,
): Promise<WalletTransactionDto> {
  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
    return Promise.reject(new MissingIdempotencyKeyError());
  }
  // Allow-list: a stray key (customerId, balance, status...) never reaches the wire.
  const wire: CashTopupBody = {
    amount: body.amount,
    warehouseId: body.warehouseId,
    fiscalCashTag: body.fiscalCashTag,
  };
  if (body.remarks !== undefined) wire.remarks = body.remarks;
  return adminPost<WalletTransactionDto>(
    `/admin/wallets/${encodeURIComponent(customerId)}/cash-topup`,
    wire,
    { idempotencyKey },
  );
}
