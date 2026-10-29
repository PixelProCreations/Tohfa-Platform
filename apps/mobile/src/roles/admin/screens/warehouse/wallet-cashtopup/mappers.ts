/**
 * The wallet & cash top-up decisions, kept pure (no react-native import) so
 * plain-Node vitest covers every money and gating rule
 * (../../../tests/wallet_cashtopup.test.ts, mappers_wallet.test.ts):
 *
 *  - CLAUDE.md 2.2: Money strings become integer paise and are displayed with
 *    money/paise.ts formatPaise; an unknown amount is '—', never '₹0', and no
 *    paisa is dropped.
 *  - BR-18 / BR-30: a top-up is only sent with real uuids (customer in the path,
 *    warehouse in the body; a Sub scope is pinned to its own warehouse) and a
 *    fiscal cash tag.
 *  - BR-19: no client-side cap. system_config.cash_topup_cap is not exposed to
 *    the app, so the server's 422 CASH_LIMIT_EXCEEDED is the only check.
 *  - BR-18d / CLAUDE.md 2.4: one Idempotency-Key per logical top-up (the
 *    customer is part of the fingerprint), reused on retry.
 *  - BR-74: the daily summary is only asked for a uuid warehouse the caller
 *    may see, and a failure is an error state, never zeros.
 */
import { fromPaise, parseMoney, toPaise, type Money, type Paise } from '@tohfa/shared-types';
import { ApiError, NetworkError } from '../../../../../shell/api/client';
import type { AdminCustomerDetailDto, WalletTransactionDto } from '../../../api/customers';
import { adminErrorKey } from '../../../api/errors';
import type { SystemCashFiguresDto } from '../../../api/finance';
import type { CashTopupCreate, CustomerLookupQuery, SaleCustomerMatchDto } from '../../../api/wallet';
import type { TranslationKey } from '../../../i18n';
import { formatPaise, parseRupeesToPaise } from '../../../money/paise';
import type { CashTopUpDraft, TopUpHistoryRow, WalletCustomer, WalletTransactionRecord, WarehouseScope } from './types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for a server uuid; a customer code or a fixture id ('WH-OOTY') is not one. */
export function isUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

// ─── Money ───────────────────────────────────────────────────────────────────

/** A Money decimal string as exact integer paise; null when absent or not money. */
export function moneyToPaise(m: Money | string | null | undefined): Paise | null {
  if (m === null || m === undefined || m === '') return null;
  try {
    return toPaise(parseMoney(String(m)));
  } catch {
    return null;
  }
}

/** '₹1,234.56' / '₹2,000' / '-₹750' for a Money string; '—' when unknown. */
export function formatWalletMoney(m: Money | string | null | undefined): string {
  const paise = moneyToPaise(m);
  return paise === null ? '—' : formatPaise(paise);
}

/** formatPaise for a value that may be unknown. */
export function formatPaiseOrDash(paise: Paise | null | undefined): string {
  return paise === null || paise === undefined ? '—' : formatPaise(paise);
}

// ─── Dates ───────────────────────────────────────────────────────────────────

export function formatIstDate(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatIstTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
}

// ─── Server rows ─────────────────────────────────────────────────────────────

const TXN_TYPE_LABELS: Record<string, string> = {
  TOPUP_CASH: 'Cash Top-Up',
  TOPUP_DIGITAL: 'Digital Top-Up',
  ORDER_DEBIT: 'Purchase',
  ORDER_REFUND: 'Refund',
  PAYOUT_DEBIT: 'Payout',
  SALE_CREDIT: 'Sale Credit',
  SUBSCRIPTION_DEBIT: 'Subscription',
  ADJUSTMENT: 'Adjustment',
};

/**
 * A wallet ledger row (WalletTransaction) for the receipt / detail screens.
 * Only what the server sent: the POST cash-topup response carries no
 * fiscalCashTag or warehouseId today, so those are '—'. `performedBy` is a
 * user uuid, never a name, so "Processed By" is '—' until the API names the
 * admin. The previous balance is balanceAfter - amount of the same row, exact
 * in integer paise. `warehouseName` is the caller's name for dto.warehouseId.
 */
export function mapWalletTransactionDtoToRecord(dto: WalletTransactionDto, warehouseName?: string): WalletTransactionRecord {
  const dateStr = formatIstDate(dto.performedAt);
  const timeStr = formatIstTime(dto.performedAt);
  const dateTime = dateStr && timeStr ? `${dateStr}, ${timeStr}` : (dto.performedAt ?? '—');
  const amount = moneyToPaise(dto.amount);
  const after = moneyToPaise(dto.balanceAfter);
  const warehouseId = dto.warehouseId ?? undefined;

  return {
    transactionId: dto.id,
    type: TXN_TYPE_LABELS[dto.txnType] ?? dto.txnType,
    amount: formatPaiseOrDash(amount),
    previousBalance: amount === null || after === null ? '—' : formatPaise(after - amount),
    newBalance: formatPaiseOrDash(after),
    // Negative rule: no transaction status is shown.
    status: '—',
    fiscalCashTag: dto.fiscalCashTag ?? '—',
    referenceId: dto.fiscalCashTag ?? dto.refId ?? undefined,
    dateTime,
    createdAt: dateTime,
    processedBy: '—',
    warehouseId,
    warehouseName: warehouseId === undefined ? '—' : (warehouseName ?? '—'),
  };
}

/** A wallet ledger row as a top-up history row; the customer comes from the caller, never from performedBy. */
export function mapWalletTransactionDtoToHistoryRow(
  dto: WalletTransactionDto,
  customerName?: string,
  customerId?: string,
): TopUpHistoryRow {
  return {
    id: dto.id,
    customerName: customerName ?? '—',
    customerId: customerId ?? '—',
    fiscalTag: dto.fiscalCashTag ?? '—',
    amount: formatWalletMoney(dto.amount),
    date: formatIstDate(dto.performedAt),
    time: formatIstTime(dto.performedAt),
    status: 'Completed',
    warehouseId: dto.warehouseId ?? '',
  };
}

/** A counter-lookup match as the wallet customer (masked mobile as sent, BR-92g). */
export function mapCustomerLookupMatchToWalletCustomer(dto: SaleCustomerMatchDto): WalletCustomer {
  const balancePaise = moneyToPaise(dto.walletBalance);
  return {
    name: dto.name,
    id: dto.customerCode,
    customerId: isUuid(dto.customerId) ? dto.customerId : undefined,
    mobile: dto.mobileMasked,
    balance: formatPaiseOrDash(balancePaise),
    balancePaise,
    // Negative rule: totals -> '—'
    totalCredited: '—',
    totalUsed: '—',
  };
}

/** A customer detail as the wallet customer. */
export function mapCustomerDetailToWalletCustomer(dto: AdminCustomerDetailDto): WalletCustomer {
  const balancePaise = moneyToPaise(dto.walletBalance);
  return {
    name: dto.name,
    id: dto.customerCode,
    customerId: isUuid(dto.id) ? dto.id : undefined,
    mobile: dto.mobileMasked,
    balance: formatPaiseOrDash(balancePaise),
    balancePaise,
    totalCredited: '—',
    totalUsed: '—',
  };
}

/**
 * A customer-search row as the wallet customer. The row's `id` falls back to
 * its code upstream, so it only becomes the path id when it is a real uuid.
 */
export function walletCustomerFromSearch(c: {
  name: string;
  code: string;
  id?: string | undefined;
  phone?: string | undefined;
  balance?: string | undefined;
}): WalletCustomer {
  const balancePaise = c.balance === undefined ? null : parseRupeesToPaise(c.balance);
  return {
    name: c.name,
    id: c.code,
    customerId: isUuid(c.id) ? c.id : undefined,
    mobile: c.phone,
    balance: formatPaiseOrDash(balancePaise),
    balancePaise,
  };
}

// ─── Cash top-up ─────────────────────────────────────────────────────────────

export type CashTopupBlockReason = 'customer' | 'warehouse' | 'amount' | 'tag';

export type CashTopupRequest =
  | { ok: true; customerId: string; body: CashTopupCreate }
  | { ok: false; reason: CashTopupBlockReason };

/**
 * The POST /admin/wallets/{customerId}/cash-topup request for a draft, or why
 * it cannot be sent. BR-30: a Sub scope tops up at its own warehouse whatever
 * the draft says. The amount leaves as the Money string of the exact paise.
 */
export function buildCashTopupRequest(draft: CashTopUpDraft, scope: WarehouseScope): CashTopupRequest {
  if (!isUuid(draft.customerId)) return { ok: false, reason: 'customer' };
  const warehouseId = scope.warehouseId ?? draft.warehouseId;
  if (!isUuid(warehouseId)) return { ok: false, reason: 'warehouse' };
  if (!Number.isSafeInteger(draft.topUpAmountPaise) || draft.topUpAmountPaise <= 0) return { ok: false, reason: 'amount' };
  const tag = (draft.fiscalCashTag ?? '').trim();
  if (tag === '') return { ok: false, reason: 'tag' };
  return {
    ok: true,
    customerId: draft.customerId,
    body: { amount: fromPaise(draft.topUpAmountPaise), warehouseId, fiscalCashTag: tag },
  };
}

export interface CashTopupSubmitDeps {
  /** useIdempotencyKey().keyFor: the same fingerprint reuses its key. */
  keyFor: (fingerprint: unknown) => string;
  post: (customerId: string, body: CashTopupCreate, idempotencyKey: string) => Promise<WalletTransactionDto>;
}

/**
 * Send one top-up. A retry of the same body carries the same key, so the
 * server replays the original 201 and money moves once (BR-18d); an edited
 * amount, tag, warehouse or customer is a new top-up with a new key.
 */
export function submitCashTopup(
  request: { customerId: string; body: CashTopupCreate },
  deps: CashTopupSubmitDeps,
): Promise<WalletTransactionDto> {
  const key = deps.keyFor({ customerId: request.customerId, ...request.body });
  return deps.post(request.customerId, request.body, key);
}

/**
 * The message for a failed top-up. A 409 CONFLICT is a fiscal tag already used
 * by another top-up (a replay of ours returns 201 since BR-18d). No answer or
 * a 5xx may have credited the wallet; a retry sends the same key, so the
 * server returns that credit instead of making a second one.
 */
export function cashTopupErrorKey(err: unknown): TranslationKey {
  if (err instanceof NetworkError) return 'wallet.topup.error.outcomeUnknown';
  if (err instanceof ApiError) {
    if (err.problem.status >= 500) return 'wallet.topup.error.outcomeUnknown';
    if (err.is('CONFLICT')) return 'wallet.topup.error.tagUsed';
  }
  return adminErrorKey(err);
}

const LOOKUP_MOBILE_RE = /^\+?[0-9]{10,15}$/;
const LOOKUP_CODE_MAX = 40;

/**
 * The counter lookup for what was typed (BR-91i: exact matches only). A full
 * mobile number (spaces and dashes ignored) is `mobile`; anything that is not
 * all digits is a customer `code`; a partial number asks nothing (the server
 * would answer 422).
 */
export function cashTopupLookupQuery(text: string): CustomerLookupQuery | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const compact = trimmed.replace(/[\s-]/g, '');
  if (LOOKUP_MOBILE_RE.test(compact)) return { mobile: compact };
  if (/^\+?[0-9]+$/.test(compact)) return null;
  return { code: trimmed.slice(0, LOOKUP_CODE_MAX) };
}

// ─── Daily cash summary (BR-74) ──────────────────────────────────────────────

export type DailySummaryGate =
  | { enabled: true; warehouseId: string }
  | { enabled: false; reason: 'forbidden' | 'selectWarehouse' };

/**
 * Whether GET /admin/finance/daily-summary may be asked, and for which
 * warehouse. It needs finance.cash_close.manage and one warehouse uuid: a Main
 * admin on "All warehouses" would get 422 (finance.shared.ts targetWarehouse),
 * so it must pick one first. A Sub scope is always its own warehouse (BR-30).
 */
export function dailySummaryGate(input: {
  scope: WarehouseScope;
  selectedWarehouseId: string | undefined;
  canView: boolean;
}): DailySummaryGate {
  if (!input.canView) return { enabled: false, reason: 'forbidden' };
  const warehouseId = input.scope.warehouseId ?? input.selectedWarehouseId;
  if (!isUuid(warehouseId)) return { enabled: false, reason: 'selectWarehouse' };
  return { enabled: true, warehouseId };
}

export type DailyCashView = 'forbidden' | 'selectWarehouse' | 'loading' | 'error' | 'ready';

export function dailyCashView(input: { gate: DailySummaryGate; isLoading: boolean; error: unknown; hasData: boolean }): DailyCashView {
  if (!input.gate.enabled) return input.gate.reason;
  if (input.hasData) return 'ready';
  if (input.isLoading) return 'loading';
  if (input.error !== null && input.error !== undefined) return 'error';
  return 'loading';
}

export interface DailyCashFigures {
  openingCash: Paise | null;
  directSales: Paise | null;
  cashTopUps: Paise | null;
  expenses: Paise | null;
  expectedClosing: Paise | null;
}

/** The summary's `system` figures in exact paise (null where the server sent no money value). */
export function toDailyCashFigures(system: SystemCashFiguresDto): DailyCashFigures {
  return {
    openingCash: moneyToPaise(system.openingCash),
    directSales: moneyToPaise(system.cashSales),
    cashTopUps: moneyToPaise(system.cashTopUps),
    expenses: moneyToPaise(system.cashExpenses),
    expectedClosing: moneyToPaise(system.expectedClosing),
  };
}
