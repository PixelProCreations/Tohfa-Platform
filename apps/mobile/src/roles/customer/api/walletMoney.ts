/**
 * Pure wallet helpers: amount parsing (decimal string, never floats), display
 * formatting, ledger row presentation, IST dates and E.164 mobile handling.
 * Money arithmetic goes through integer paise (@tohfa/shared-types), never
 * `parseFloat` / `Number` on rupee values.
 */
import { compare, format, fromPaise, toPaise, type Money } from '@tohfa/shared-types';
import type { WalletTransaction, WalletTransactionType } from './wallet';

/** `₹ 1,250.00` (Indian grouping). `—` while the value is unknown. */
export function formatInr(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  try {
    return format(value as Money).replace('₹', '₹ ');
  } catch {
    return '—';
  }
}

/** Compact for chips / copy: `₹1,000` when whole, else `₹1,000.50`. */
export function formatInrCompact(value: string): string {
  const full = format(value as Money);
  return full.endsWith('.00') ? full.slice(0, -3) : full;
}

/** User-typed amount -> Money. Digits with at most 2 decimals, strictly positive. Else null. */
export function parseAmountInput(text: string): Money | null {
  const trimmed = text.trim();
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(trimmed)) return null;
  const money = fromPaise(toPaise(trimmed as Money));
  return toPaise(money) > 0 ? money : null;
}

/** Strip anything that cannot be part of an amount while typing (keeps one dot, 2 decimals). */
export function sanitizeAmountText(text: string): string {
  const cleaned = text.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned.slice(0, 9);
  return `${cleaned.slice(0, dot).slice(0, 9)}.${cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2)}`;
}

export type AmountCheck =
  | { ok: true; amount: Money }
  | { ok: false; reason: 'empty' | 'invalid' | 'below_min' | 'above_max' };

/** Validate a typed amount against optional {min,max} (the server remains the authority). */
export function checkAmount(text: string, limits?: { min: string; max: string } | null): AmountCheck {
  if (text.trim() === '') return { ok: false, reason: 'empty' };
  const amount = parseAmountInput(text);
  if (amount === null) return { ok: false, reason: 'invalid' };
  if (limits) {
    if (compare(amount, limits.min as Money) < 0) return { ok: false, reason: 'below_min' };
    if (compare(amount, limits.max as Money) > 0) return { ok: false, reason: 'above_max' };
  }
  return { ok: true, amount };
}

/** amount > balance, in paise. */
export function exceedsBalance(amount: Money, balance: string | null | undefined): boolean {
  if (balance === null || balance === undefined) return false;
  return compare(amount, balance as Money) > 0;
}

/** Round a shortfall up to whole rupees for the top-up prefill (never below the shortfall). */
export function shortfallToTopupText(shortfall: string | undefined | null): string {
  if (shortfall === undefined || shortfall === null || shortfall === '') return '';
  const paise = toPaise(shortfall as Money);
  if (paise <= 0) return '';
  return String(Math.ceil(paise / 100));
}

/** Amount chips that respect topupLimits; always includes only values in [min,max]. */
export function topupChips(limits?: { min: string; max: string } | null): number[] {
  const base = [500, 1000, 2000, 5000];
  if (!limits) return base;
  const min = Math.ceil(toPaise(limits.min as Money) / 100);
  const max = Math.floor(toPaise(limits.max as Money) / 100);
  return base.filter((v) => v >= min && v <= max);
}

// ── Mobile numbers ──────────────────────────────────────────────────────────

/** Accepts `98765 43210`, `+91 98765 43210`, `091…`; returns E.164 `+919876543210` or null. */
export function normalizeIndianMobile(text: string): string | null {
  const digits = text.replace(/[^\d+]/g, '');
  const m = /^(?:\+91|91|0)?([6-9]\d{9})$/.exec(digits.replace(/^\+/, '+'));
  if (m === null) return null;
  return `+91${m[1]}`;
}

// ── Dates (Asia/Kolkata, deterministic without Intl) ────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function istParts(iso: string): { y: number; mo: number; d: number; h: number; mi: number } | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const s = new Date(t + IST_OFFSET_MS);
  return { y: s.getUTCFullYear(), mo: s.getUTCMonth(), d: s.getUTCDate(), h: s.getUTCHours(), mi: s.getUTCMinutes() };
}

/** `12 Nov 2026, 10:24 AM` in IST. */
export function formatIstDateTime(iso: string): string {
  const p = istParts(iso);
  if (p === null) return '';
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  const mm = String(p.mi).padStart(2, '0');
  return `${p.d} ${MONTHS[p.mo]} ${p.y}, ${String(h12).padStart(2, '0')}:${mm} ${p.h < 12 ? 'AM' : 'PM'}`;
}

/** `YYYY-MM-DD` of the IST day containing `now`, shifted by `addDays`. */
export function istDateString(now: Date, addDays = 0): string {
  const s = new Date(now.getTime() + IST_OFFSET_MS + addDays * 86400000);
  return `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, '0')}-${String(s.getUTCDate()).padStart(2, '0')}`;
}

// ── Ledger rows ─────────────────────────────────────────────────────────────

export type TxVisual = 'topup' | 'order' | 'refund' | 'transfer_in' | 'transfer_out' | 'other';

export interface TxPresentation {
  title: string;
  visual: TxVisual;
  credit: boolean;
}

const TITLES: Record<WalletTransactionType, [string, TxVisual]> = {
  TOPUP_CASH: ['Added to Wallet', 'topup'],
  TOPUP_DIGITAL: ['Added to Wallet', 'topup'],
  ORDER_DEBIT: ['Order Payment', 'order'],
  ORDER_REFUND: ['Order Refund', 'refund'],
  PAYOUT_DEBIT: ['Payout', 'other'],
  SALE_CREDIT: ['Sale Credit', 'other'],
  SUBSCRIPTION_DEBIT: ['Subscription Payment', 'order'],
  ADJUSTMENT: ['Adjustment', 'other'],
  TRANSFER_OUT: ['Money Sent', 'transfer_out'],
  TRANSFER_IN: ['Money Received', 'transfer_in'],
};

export function presentTransaction(tx: Pick<WalletTransaction, 'txnType' | 'amount'>): TxPresentation {
  const [title, visual] = TITLES[tx.txnType] ?? ['Wallet Transaction', 'other' as TxVisual];
  return { title, visual, credit: !tx.amount.startsWith('-') };
}

/** `+ ₹ 1,000.00` / `- ₹ 360.00` from the signed ledger amount. */
export function formatSignedAmount(amount: string): string {
  const debit = amount.startsWith('-');
  const abs = debit ? amount.slice(1) : amount;
  return `${debit ? '-' : '+'} ${formatInr(abs)}`;
}

/** Display code of a ledger row: `TXN-` + first ten hex chars of its id (same derivation as the API's `txnCode`). */
export function txnCodeFromId(id: string): string {
  return `TXN-${id.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
}

// ── Ledger filters ──────────────────────────────────────────────────────────

export type TxTab = 'all' | 'credits' | 'debits' | 'refunds';
export type TxDateRange = 'all' | '7d' | '30d' | 'month';

export interface TransactionFilters {
  tab: TxTab;
  type?: WalletTransactionType | undefined;
  range: TxDateRange;
}

export const DEFAULT_TX_FILTERS: TransactionFilters = { tab: 'all', range: 'all' };

export function activeFilterCount(f: TransactionFilters): number {
  return (f.tab !== 'all' ? 1 : 0) + (f.type !== undefined ? 1 : 0) + (f.range !== 'all' ? 1 : 0);
}

/** Query string pairs for GET /wallets/me/transactions (no cursor/limit). */
export function buildTransactionQuery(f: TransactionFilters, now: Date = new Date()): Record<string, string> {
  const q: Record<string, string> = {};
  if (f.tab !== 'all') q['tab'] = f.tab;
  if (f.type !== undefined) q['type'] = f.type;
  // IST day boundaries expressed as UTC instants (the API reads bare dates as UTC days).
  const istStartUtc = (ymd: string): string => new Date(Date.parse(`${ymd}T00:00:00Z`) - IST_OFFSET_MS).toISOString();
  let fromDay: string | null = null;
  if (f.range === '7d') fromDay = istDateString(now, -6);
  if (f.range === '30d') fromDay = istDateString(now, -29);
  if (f.range === 'month') fromDay = `${istDateString(now).slice(0, 8)}01`;
  if (fromDay !== null) {
    q['from'] = istStartUtc(fromDay);
    q['to'] = new Date(Date.parse(istStartUtc(istDateString(now, 1))) - 1).toISOString();
  }
  return q;
}
