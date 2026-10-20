/**
 * The cash top-up's decisions, kept pure so plain-Node vitest covers every
 * money rule (../../../tests/mappers_wallet.test.ts):
 *
 *  - BR-19: the typed amount becomes integer paise at once (parseRupeesToPaise,
 *    never a float) and is checked against CASH_TOPUP_CAP_PAISE (inclusive).
 *    UX only; the server's 422 CASH_LIMIT_EXCEEDED is the enforcement.
 *  - BR-18: the fiscal cash tag is required, 3..60 characters after trimming
 *    (docs/openapi.yaml CashTopupCreate.fiscalCashTag; docs/rules.md sets no
 *    length of its own). The server credits the wallet only with it.
 *  - BR-30: a Sub scope always tops up at its own warehouse uuid.
 *  - Root CLAUDE.md 2.4: one Idempotency-Key per logical top-up. The customer
 *    is in the path, not the body, so it is part of the fingerprint: the same
 *    body for another customer is another top-up.
 *
 * No React here; WalletFlow.tsx and useWalletData.ts pass values through.
 */
import { fromPaise, type Paise } from '@tohfa/shared-types';
import { ApiError, NetworkError } from '../../../../../shell/api/client';
import { adminErrorKey } from '../../../api/errors';
import type {
  CashTopupCreate,
  CustomerLookupQuery,
  SaleCustomerMatchDto,
  WalletTransactionDto,
} from '../../../api/wallet';
import { CASH_TOPUP_CAP_PAISE, validateTopUpAmount } from '../../../config/businessThresholds';
import type { TranslationKey } from '../../../i18n';
import { formatPaise, parseRupeesToPaise } from '../../../money/paise';
import { customerIdParam, toWalletScreenTransaction, toWalletTxnRow, uuidParam } from '../customers/mappers';
import { monthStart } from '../finance-expenses/mappers';
import { moneyToPaise } from '../orders/mappers';
import type { CashTopupsReportDto } from '../../../api/reports';
import type { WarehouseOption } from '../../../api/warehouseList';
import type { WalletCustomer, WalletTransactionRecord, WarehouseScope } from './types';

/** docs/openapi.yaml CashTopupCreate.fiscalCashTag minLength / maxLength (contract, not a business threshold). */
export const FISCAL_TAG_MIN_LENGTH = 3;
export const FISCAL_TAG_MAX_LENGTH = 60;

/**
 * lookupCashTopupCustomer `code`: maxLength 40. The spec's minLength is 1; the
 * lookup asks from 2 characters so a single keystroke is not a request.
 */
const LOOKUP_MIN_LENGTH = 2;
const CODE_MAX_LENGTH = 40;
/** lookupCashTopupCustomer `mobile` pattern. */
const MOBILE_RE = /^\+?[0-9]{10,15}$/;
/** Digits only (an optional leading +): a mobile number still being typed, not a code. */
const PARTIAL_MOBILE_RE = /^\+?[0-9]*$/;

/**
 * The design's quick-pick amounts (whole rupees, in paise). A UI shortcut, not
 * a business threshold: the cap is still checked on whatever is picked, and
 * system_config exposes no preset list to admins (spec gap).
 */
export const TOP_UP_PRESETS_PAISE: readonly Paise[] = [50_000, 100_000, 200_000, 500_000];

/** The customer being topped up. Only the masked mobile is ever held (BR-92). */
export interface TopUpCustomer {
  customerUuid: string;
  name: string;
  code: string;
  mobileMasked: string;
  /** The wallet balance as last read; null when unknown. */
  balancePaise: Paise | null;
}

// ─── Form ────────────────────────────────────────────────────────────────────

export type AmountCheck = { ok: true; paise: Paise } | { ok: false; errorKey: TranslationKey };

/** BR-19: typed rupees -> integer paise, positive and at most the cap (inclusive). */
export function parseTopUpAmount(text: string, capPaise: Paise = CASH_TOPUP_CAP_PAISE): AmountCheck {
  const paise = parseRupeesToPaise(text);
  if (paise === null) return { ok: false, errorKey: 'wallet.topup.error.amountInvalid' };
  const check = validateTopUpAmount(paise, capPaise);
  if (check.ok) return { ok: true, paise };
  return {
    ok: false,
    errorKey: check.reason === 'CASH_LIMIT_EXCEEDED' ? 'wallet.topup.error.aboveCap' : 'wallet.topup.error.amountInvalid',
  };
}

export type FiscalTagCheck = { ok: true; tag: string } | { ok: false; errorKey: TranslationKey };

/** BR-18: the tag is required and 3..60 characters once trimmed; the trimmed tag is what is sent. */
export function validateFiscalTag(text: string): FiscalTagCheck {
  const tag = text.trim();
  if (tag === '') return { ok: false, errorKey: 'wallet.topup.error.tagRequired' };
  if (tag.length < FISCAL_TAG_MIN_LENGTH) return { ok: false, errorKey: 'wallet.topup.error.tagTooShort' };
  if (tag.length > FISCAL_TAG_MAX_LENGTH) return { ok: false, errorKey: 'wallet.topup.error.tagTooLong' };
  return { ok: true, tag };
}

/**
 * BR-30: the warehouse the cash was collected at. A Sub scope is its own
 * warehouse whatever was selected; the all-warehouses scope needs a selected
 * warehouse uuid (a sample code like 'WH-OOTY' is not one). null = cannot send.
 */
export function topUpWarehouseId(scope: { warehouseId?: string | undefined }, selected: string | undefined): string | null {
  if (scope.warehouseId !== undefined) return uuidParam(scope.warehouseId) ?? null;
  return uuidParam(selected) ?? null;
}

export interface CashTopupInput {
  amountPaise: Paise;
  fiscalCashTag: string;
  warehouseId: string;
}

/** The CashTopupCreate body; the amount is the openapi Money decimal string of the exact paise. */
export function buildCashTopupBody(input: CashTopupInput): CashTopupCreate {
  return {
    amount: fromPaise(input.amountPaise),
    warehouseId: input.warehouseId,
    fiscalCashTag: input.fiscalCashTag,
  };
}

// ─── Idempotency ─────────────────────────────────────────────────────────────

/** What the Idempotency-Key is cached on: the path's customer plus the body. */
export function cashTopupFingerprint(customerId: string, body: CashTopupCreate): { customerId: string } & CashTopupCreate {
  return { customerId, ...body };
}

export interface CashTopupSubmitDeps {
  /** useIdempotencyKey().keyFor: the same fingerprint reuses its key, a changed one gets a new key. */
  keyFor: (fingerprint: unknown) => string;
  post: (customerId: string, body: CashTopupCreate, idempotencyKey: string) => Promise<WalletTransactionDto>;
}

/**
 * Send one top-up. A retry of the same body (after a timeout, say) carries the
 * same key, so the server can recognise the replay and money moves once; an
 * edited amount, tag or customer is a new top-up with a new key.
 */
export function submitCashTopup(
  input: { customerId: string; body: CashTopupCreate },
  deps: CashTopupSubmitDeps,
): Promise<WalletTransactionDto> {
  const key = deps.keyFor(cashTopupFingerprint(input.customerId, input.body));
  return deps.post(input.customerId, input.body, key);
}

// ─── Lookup ──────────────────────────────────────────────────────────────────

/**
 * The lookup query for what was typed (GET /admin/wallets/cash-topup/customers/lookup,
 * BR-91i): a full mobile number (10-15 digits, spaces and dashes ignored) is
 * the exact `mobile` match; anything else of 2..40 characters is the exact
 * `code`. There is no name or partial search on this lookup, so a number still
 * being typed (digits only, under 10) asks nothing, and so does anything the
 * server would refuse (422). null = do not ask.
 */
export function customerLookupQuery(text: string): CustomerLookupQuery | null {
  const trimmed = text.trim();
  const compact = trimmed.replace(/[\s-]/g, '');
  if (MOBILE_RE.test(compact)) return { mobile: compact };
  if (PARTIAL_MOBILE_RE.test(compact)) return null;
  if (trimmed.length < LOOKUP_MIN_LENGTH || trimmed.length > CODE_MAX_LENGTH) return null;
  return { code: trimmed };
}

export type LookupView = 'idle' | 'loading' | 'error' | 'noMatch' | 'ready';

export function customerLookupView(input: { hasQuery: boolean; isLoading: boolean; error: unknown; itemCount: number }): LookupView {
  if (!input.hasQuery) return 'idle';
  if (input.itemCount > 0) return 'ready';
  if (input.isLoading) return 'loading';
  if (input.error !== null && input.error !== undefined) return 'error';
  return 'noMatch';
}

/**
 * Shown by the customers area's Customer Search when its lookup finds no one
 * (kept for customers/CustomerSearchScreen). The wallet flow's own lookup
 * (CustomerLookupScreen) says CASH_LOOKUP_NO_MATCH_KEY instead: the cash
 * top-up lookup applies no BR-91 history gate (BR-91i), so no match there
 * means the mobile or code is wrong, not that the customer is new here.
 */
export const LOOKUP_NO_MATCH_KEY: TranslationKey = 'wallet.lookup.noMatch';
export const CASH_LOOKUP_NO_MATCH_KEY: TranslationKey = 'wallet.lookup.cashNoMatch';

/** A lookup hit as the customer being topped up: uuid apart from the code, masked mobile as sent. */
export function toTopUpCustomer(match: SaleCustomerMatchDto): TopUpCustomer {
  return {
    customerUuid: match.customerId,
    code: match.customerCode,
    name: match.name,
    mobileMasked: match.mobileMasked,
    balancePaise: moneyToPaise(match.walletBalance),
  };
}

/** The customer as the wallet routes carry it (the live Customer Wallet also reads it by uuid). */
export function walletCustomerOf(customer: TopUpCustomer): WalletCustomer {
  return {
    name: customer.name,
    id: customer.code,
    mobile: customer.mobileMasked,
    ...(customer.balancePaise === null ? {} : { balance: formatPaise(customer.balancePaise), balancePaise: customer.balancePaise }),
    customerUuid: customer.customerUuid,
  };
}

/** The live customer of a wallet route, or null when it carries no uuid (a sample or a code only). */
export function topUpCustomerFromWallet(customer: WalletCustomer | undefined): TopUpCustomer | null {
  const customerUuid = customerIdParam(customer?.customerUuid);
  if (customer === undefined || customerUuid === undefined) return null;
  return {
    customerUuid,
    name: customer.name ?? '',
    code: customer.id ?? '',
    mobileMasked: customer.mobile ?? '',
    balancePaise: customer.balancePaise ?? null,
  };
}

// ─── Errors ──────────────────────────────────────────────────────────────────

/**
 * True when the top-up may have landed although the call failed: no answer
 * (timeout, lost connection), a 5xx, or a 409 CONFLICT (see below). The
 * screen then offers "check the wallet" before a retry.
 */
export function isTopUpOutcomeUnknown(err: unknown): boolean {
  if (err instanceof NetworkError) return true;
  if (err instanceof ApiError) return err.problem.status >= 500 || err.is('CONFLICT');
  return false;
}

/**
 * The message for a failed top-up.
 *
 * TODO(server, replay returns 409): replaying a top-up with the same
 * Idempotency-Key and the same body (a retry after a timeout) should return
 * the original 201, but the server inserts the top-up row before its
 * idempotency check, so the replay hits the unique fiscal tag and answers 409
 * CONFLICT, although the money moved once. Being fixed separately. Until then
 * a 409 here means "may already have gone through", not a hard failure, and a
 * timeout says the same, since the retry it invites can only end in that 409.
 * A genuinely reused tag also lands here; checking the wallet settles both.
 */
export function cashTopupErrorKey(err: unknown): TranslationKey {
  if (err instanceof ApiError && err.is('CONFLICT')) return 'wallet.topup.error.mayHaveGoneThrough';
  if (isTopUpOutcomeUnknown(err)) return 'wallet.topup.error.outcomeUnknown';
  return adminErrorKey(err);
}

// ─── Receipt ─────────────────────────────────────────────────────────────────

/**
 * BR-18: the success screen shows the server's ledger row (amount, new
 * balance, transaction id, tag, time), never the draft. The previous balance
 * is balanceAfter - amount in integer paise, exact for a ledger row.
 */
export function toTopUpReceipt(dto: WalletTransactionDto, customer: TopUpCustomer, warehouseName: string | undefined): WalletTransactionRecord {
  const record = toWalletScreenTransaction(toWalletTxnRow(dto, new Date()));
  return {
    ...record,
    customerName: customer.name,
    customerId: customer.code,
    ...(dto.fiscalCashTag === null ? {} : { fiscalCashTag: dto.fiscalCashTag }),
    ...(warehouseName === undefined || warehouseName === '' ? {} : { warehouseName }),
  };
}

// ─── Hub ─────────────────────────────────────────────────────────────────────

/**
 * The wallet hub's report range: month to date, Asia/Kolkata days (`today` is
 * finance-expenses istToday()). One GET /admin/reports/cash-topups call gives
 * both the month (its count / total) and today (its byDay entry).
 */
export function cashTopupsReportRange(today: string): { from: string; to: string } {
  return { from: monthStart(today), to: today };
}

/** The hub's KPIs; a total the server sent malformed is null (shown as no value), never a guess. */
export interface CashTopupKpis {
  todayCount: number;
  todayTotalPaise: Paise | null;
  monthCount: number;
  monthTotalPaise: Paise | null;
}

/**
 * GET /admin/reports/cash-topups (successful CASH top-ups, BR-64) as the hub's
 * KPIs, in integer paise. A day with no top-up has no byDay entry: today is
 * then 0 top-ups and a zero total, which is what the server's aggregate means.
 */
export function toCashTopupKpis(report: CashTopupsReportDto, today: string): CashTopupKpis {
  const day = report.byDay.find((entry) => entry.date === today);
  return {
    todayCount: day?.count ?? 0,
    todayTotalPaise: day === undefined ? 0 : moneyToPaise(day.total),
    monthCount: report.count,
    monthTotalPaise: moneyToPaise(report.total),
  };
}

/** Real picker options (GET /warehouses) as the WarehouseScope list the wallet screens take; uuids only. */
export function toWalletWarehouseScopes(options: readonly WarehouseOption[]): WarehouseScope[] {
  return options
    .filter((option) => uuidParam(option.warehouseId) !== undefined)
    .map((option) => ({ warehouseId: option.warehouseId, warehouseName: option.warehouseName, warehouseCode: option.warehouseCode }));
}
