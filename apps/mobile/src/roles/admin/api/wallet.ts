/**
 * The warehouse cash top-up and the counter customer lookup it starts from
 * (docs/openapi.yaml):
 *   POST /admin/wallets/{customerId}/cash-topup  createCashTopup          wallet.cash_topup.process (BR-18, BR-19, BR-30)
 *   GET  /admin/wallets/cash-topup/customers/lookup  lookupCashTopupCustomer  wallet.cash_topup.process (BR-91i, BR-92g)
 *
 * The top-up is a REAL money write: the server credits the wallet ledger and
 * returns that ledger row (WalletTransaction). So, root CLAUDE.md 2.4, it never
 * leaves without an Idempotency-Key, and the caller reuses one key for every
 * retry of the same body (screens/warehouse/wallet-cashtopup/mappers.ts
 * submitCashTopup, through api/hooks.ts useIdempotencyKey). BR-18: the client
 * never asserts the credit; the screen shows the server's row.
 *
 * BR-19: the cap is the server's (422 CASH_LIMIT_EXCEEDED); the form's check
 * against config/businessThresholds is UX only. BR-30: `warehouseId` is the
 * caller's warehouse (the mappers pin a Sub scope to its own); this module
 * never picks one.
 *
 * The lookup sends exactly one of mobile / code (exact matches only: there is
 * no name or partial search) and no warehouse. It is gated by the top-up's own
 * code, which Main and Sub both hold; the sales counter lookup
 * (sales.sale.create) is not held by MAIN_WH_ADMIN, so a Main top-up could not
 * find its customer through it. It skips the BR-91 warehouse-history gate on
 * purpose (BR-91i: a first top-up at this warehouse must find the customer)
 * and masks the mobile (BR-92g).
 *
 * Money stays the API's decimal string (`Money`); the mappers turn it into
 * integer paise. No UI imports, so the Main Warehouse admin can reuse it.
 */
import type { ErrorCode, GenericProblemCode, Money } from '@tohfa/shared-types';
import type { WalletTransactionDto } from './customers';
import { adminGet, adminPost } from './http';

export type { WalletTransactionDto } from './customers';

/** docs/openapi.yaml CashTopupCreate. */
export interface CashTopupCreate {
  /** Decimal string, at most INR 10,000.00 per transaction (BR-19). */
  amount: Money;
  warehouseId: string;
  /** 3..60 characters (BR-18). */
  fiscalCashTag: string;
  /** Up to 300 characters. */
  remarks?: string | undefined;
}

/** docs/openapi.yaml SaleCustomerMatch (both lookups answer with it): the mobile masked, no e-mail or address (BR-92g). */
export interface SaleCustomerMatchDto {
  customerId: string;
  customerCode: string;
  name: string;
  /** MaskedMobile, e.g. `******1234`. */
  mobileMasked: string;
  walletBalance: Money;
}

/** lookupCashTopupCustomer: exactly one of these (422 otherwise, and for any other parameter such as `q`). */
export type CustomerLookupQuery = { mobile: string } | { code: string };

export interface CustomerLookupResponse {
  items: SaleCustomerMatchDto[];
}

/**
 * Problem codes these two endpoints answer with. The spec documents 401, 403,
 * 404 and 422 CASH_LIMIT_EXCEEDED on the top-up; the server
 * (apps/api/src/modules/topup/topup.service.ts) also sends 422
 * FISCAL_TAG_REQUIRED, 403 WAREHOUSE_SCOPE_VIOLATION and 409 CONFLICT (the
 * fiscal tag is already used, which today includes a replay of our own
 * top-up; see mappers.ts cashTopupErrorKey), and the shared idempotency
 * contract 409 IDEMPOTENCY_KEY_REUSED.
 */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'INTERNAL',
  'CASH_LIMIT_EXCEEDED',
  'FISCAL_TAG_REQUIRED',
  'WAREHOUSE_SCOPE_VIOLATION',
  'IDEMPOTENCY_KEY_REUSED',
];

export class MissingIdempotencyKeyError extends Error {
  constructor() {
    super('A cash top-up must carry an Idempotency-Key');
    this.name = 'MissingIdempotencyKeyError';
  }
}

/**
 * Credit `customerId`'s wallet with cash taken at the counter; resolves to the
 * server's ledger row (201). The body is rebuilt field by field, so nothing
 * else the caller holds (a balance, a customer code) can ride along.
 */
export function createCashTopup(
  customerId: string,
  body: CashTopupCreate,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<WalletTransactionDto> {
  if (idempotencyKey.trim() === '') return Promise.reject(new MissingIdempotencyKeyError());
  const payload: CashTopupCreate = {
    amount: body.amount,
    warehouseId: body.warehouseId,
    fiscalCashTag: body.fiscalCashTag,
    ...(body.remarks === undefined ? {} : { remarks: body.remarks }),
  };
  return adminPost<WalletTransactionDto>(`/admin/wallets/${encodeURIComponent(customerId)}/cash-topup`, payload, {
    idempotencyKey,
    signal,
  });
}

/** Counter lookup for a cash top-up; no match is an empty `items`, never 403 (BR-91i). */
export function lookupCustomers(query: CustomerLookupQuery, signal?: AbortSignal): Promise<CustomerLookupResponse> {
  // Rebuilt field by field: exactly one parameter leaves, whatever the caller's object holds.
  const params = 'mobile' in query ? { mobile: query.mobile } : { code: query.code };
  return adminGet<CustomerLookupResponse>('/admin/wallets/cash-topup/customers/lookup', params, signal);
}
