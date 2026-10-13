/**
 * Cash top-up: form validation, wire body, result and error mapping.
 *
 * Pure functions so every money rule is unit-tested without React
 * (tests/mappers_wallet.test.ts):
 *  - BR-19: the amount becomes integer paise at once (never a float) and the
 *    Rs 10,000 cap is pre-checked as a UX guard only — the server's 422
 *    `CASH_LIMIT_EXCEEDED` is the enforcement and is still handled.
 *  - BR-18: the fiscal cash tag is mandatory; its 3..60 length is the
 *    `CashTopupCreate.fiscalCashTag` contract in docs/openapi.yaml (docs/rules.md
 *    sets no length of its own).
 *  - BR-30: the warehouse is always the caller's scope warehouse.
 */
import { ApiError, NetworkError } from '../../../../../shell/api/client';
import type { QueryKey } from '@tanstack/react-query';
import { adminErrorKey } from '../../../api/errors';
import { adminKeys } from '../../../api/queryKeys';
import { AdminTimeoutError } from '../../../api/http';
import {
  WALLET_TRANSACTION_TYPES,
  type CashTopupBody,
  type WalletTransactionTypeDto,
  type WalletTransactionDto,
} from '../../../api/wallet';
import { exceedsCashTopupCap } from '../../../config/businessThresholds';
import type { TranslationKey } from '../../../i18n';
import {
  paiseToMoney,
  parseRupeesToPaise,
  tryParseRupeesToPaise,
  type Paise,
} from '../../../money/paise';

/** docs/openapi.yaml `CashTopupCreate.fiscalCashTag` minLength/maxLength (contract, not a business threshold). */
export const FISCAL_TAG_MIN_LENGTH = 3;
export const FISCAL_TAG_MAX_LENGTH = 60;
/** docs/openapi.yaml `CashTopupCreate.remarks` maxLength. */
export const REMARKS_MAX_LENGTH = 300;

/** The customer being topped up, as the (blocked) counter lookup would supply it. */
export interface TopupCustomer {
  customerId: string;
  name: string;
  customerCode: string;
  /** BR-92g: only ever the masked mobile. */
  mobileMasked: string;
  walletBalancePaise: Paise | null;
}

export interface CashTopupForm {
  amountText: string;
  fiscalTag: string;
  remarks: string;
}

export function emptyCashTopupForm(): CashTopupForm {
  return { amountText: '', fiscalTag: '', remarks: '' };
}

export interface ValidCashTopup {
  amountPaise: Paise;
  fiscalTag: string;
  remarks: string | null;
}

export type CashTopupValidation =
  | { ok: true; value: ValidCashTopup }
  | { ok: false; errors: { amount?: TranslationKey; fiscalTag?: TranslationKey; remarks?: TranslationKey } };

export function validateCashTopupForm(form: CashTopupForm): CashTopupValidation {
  const errors: { amount?: TranslationKey; fiscalTag?: TranslationKey; remarks?: TranslationKey } = {};

  const amountPaise = tryParseRupeesToPaise(form.amountText);
  if (amountPaise === null || amountPaise <= 0) {
    errors.amount = 'admin.wallet.topup.errors.amountInvalid';
  } else if (exceedsCashTopupCap(amountPaise)) {
    errors.amount = 'admin.wallet.topup.errors.amountAboveCap';
  }

  const fiscalTag = form.fiscalTag.trim();
  if (fiscalTag === '') errors.fiscalTag = 'admin.errors.FISCAL_TAG_REQUIRED';
  else if (fiscalTag.length < FISCAL_TAG_MIN_LENGTH) errors.fiscalTag = 'admin.wallet.topup.errors.fiscalTagTooShort';
  else if (fiscalTag.length > FISCAL_TAG_MAX_LENGTH) errors.fiscalTag = 'admin.wallet.topup.errors.fiscalTagTooLong';

  const remarks = form.remarks.trim();
  if (remarks.length > REMARKS_MAX_LENGTH) errors.remarks = 'admin.wallet.topup.errors.remarksTooLong';

  if (Object.keys(errors).length > 0 || amountPaise === null) return { ok: false, errors };
  return { ok: true, value: { amountPaise, fiscalTag, remarks: remarks === '' ? null : remarks } };
}

/** BR-30: `warehouseId` must be `scope.warehouseId`; nothing else is accepted. */
export function buildCashTopupBody(value: ValidCashTopup, warehouseId: string): CashTopupBody {
  const body: CashTopupBody = {
    amount: paiseToMoney(value.amountPaise),
    warehouseId,
    fiscalCashTag: value.fiscalTag,
  };
  if (value.remarks !== null) body.remarks = value.remarks;
  return body;
}

/**
 * What `useIdempotencyKey().keyFor` hashes. The customer is in the PATH, not
 * the body, so it is added here: the same body for a different customer is a
 * different operation and must never replay this key.
 */
export function cashTopupIdempotencyFingerprint(
  customerId: string,
  body: CashTopupBody,
): { customerId: string } & CashTopupBody {
  return { customerId, ...body };
}

/**
 * Cache prefixes a successful top-up makes stale: the customer's wallet and
 * customer rows (balance), and the warehouse's daily cash summary (BR-74
 * `cashTopUps`). Scoped by warehouse like every admin key.
 */
export function cashTopupInvalidationKeys(warehouseId: string | null): QueryKey[] {
  return [
    adminKeys.resource(warehouseId, 'wallet'),
    adminKeys.resource(warehouseId, 'customers'),
    adminKeys.resource(warehouseId, 'dailySummary'),
  ];
}

export interface CashTopupResult {
  /** The server's wallet_transactions id — the receipt reference. */
  transactionId: string;
  topupId: string | null;
  amountPaise: Paise;
  balanceAfterPaise: Paise;
  fiscalCashTag: string | null;
  performedAt: string;
  txnTypeKey: TranslationKey;
}

const TXN_TYPE_LABEL: Record<WalletTransactionTypeDto, TranslationKey> = {
  TOPUP_CASH: 'admin.wallet.txnType.TOPUP_CASH',
  TOPUP_DIGITAL: 'admin.wallet.txnType.TOPUP_DIGITAL',
  ORDER_DEBIT: 'admin.wallet.txnType.ORDER_DEBIT',
  ORDER_REFUND: 'admin.wallet.txnType.ORDER_REFUND',
  PAYOUT_DEBIT: 'admin.wallet.txnType.PAYOUT_DEBIT',
  SALE_CREDIT: 'admin.wallet.txnType.SALE_CREDIT',
  SUBSCRIPTION_DEBIT: 'admin.wallet.txnType.SUBSCRIPTION_DEBIT',
  ADJUSTMENT: 'admin.wallet.txnType.ADJUSTMENT',
};

export function walletTxnTypeLabelKey(type: string): TranslationKey {
  return (WALLET_TRANSACTION_TYPES as readonly string[]).includes(type)
    ? TXN_TYPE_LABEL[type as WalletTransactionTypeDto]
    : 'admin.wallet.txnType.unknown';
}

/** Strict parsing: a malformed server amount is a contract bug and throws. */
export function toCashTopupResult(dto: WalletTransactionDto): CashTopupResult {
  return {
    transactionId: dto.id,
    topupId: dto.refId,
    amountPaise: parseRupeesToPaise(dto.amount),
    balanceAfterPaise: parseRupeesToPaise(dto.balanceAfter),
    fiscalCashTag: dto.fiscalCashTag,
    performedAt: dto.performedAt,
    txnTypeKey: walletTxnTypeLabelKey(dto.txnType),
  };
}

/**
 * Cash top-up copy for the errors where the generic text would mislead:
 *  - 409 CONFLICT: the fiscal tag is unique (db uq_topups_fiscal_cash_tag).
 *    The server inserts the top-up row BEFORE its idempotency check, so even
 *    an identical replay of a top-up that already succeeded answers 409 here,
 *    not the original 201. The copy therefore says "check the wallet first".
 *  - 404: the customer has no wallet (or does not exist).
 *  - network / timeout: the request may or may not have reached the server;
 *    the retry reuses the Idempotency-Key, but see the 409 note above.
 */
export function cashTopupErrorKey(error: unknown): TranslationKey {
  if (error instanceof NetworkError || error instanceof AdminTimeoutError) {
    return 'admin.wallet.topup.errors.uncertain';
  }
  if (error instanceof ApiError) {
    const code = error.problem.code as string;
    if (code === 'CONFLICT') return 'admin.wallet.topup.errors.CONFLICT';
    if (code === 'NOT_FOUND') return 'admin.wallet.topup.errors.NOT_FOUND';
  }
  return adminErrorKey(error);
}
