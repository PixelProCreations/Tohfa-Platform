/**
 * Pure view helpers for the farmer Dashboard's live widgets: the audit and
 * certification mini-cards, the Active Crops preview, and the counter-offer
 * alert ordering. No React and no i18n import (the screen picks the keys), so
 * they unit-test in plain Node (tests/dashboard.test.ts) -- the same reason the
 * audit screens' helpers live in api/audits.ts.
 */
import { isUpcoming, istDateParts, type AuditStatus, type FarmerAuditSummary } from '../../api/audits';
import type { ActiveFarmCropsResult, FarmCropStatus, PlotFarmCrop } from '../../api/crops';
import { parseServerTime, toIsoTimestamp, type CounterOffer, type Listing } from '../../api/listings';

/**
 * One independently loaded dashboard widget. Each widget has its own fetch
 * and its own state, so a failing crops call never blanks the audit card or
 * the rest of the dashboard.
 */
export type WidgetState<T> =
  | { kind: 'loading' }
  | { kind: 'error'; error: unknown }
  | { kind: 'ready'; data: T };

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Day number (days since the epoch) of a value's calendar date in IST, or
 * null when unparseable. A plain `YYYY-MM-DD` (e.g. farm_crops.planted_on) is
 * already a calendar date and is not shifted; a timestamp -- ISO or the
 * Postgres text form Hermes cannot parse -- is normalized first.
 */
function istDayNumber(value: string): number | null {
  const dateOnly = DATE_ONLY_RE.exec(value.trim());
  if (dateOnly !== null) {
    return Math.round(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) / DAY_MS);
  }
  const parts = istDateParts(toIsoTimestamp(value));
  if (parts === null) return null;
  return Math.round(Date.UTC(parts.year, parts.monthIndex, parts.day) / DAY_MS);
}

/** IST calendar days from `now` to `value`: 0 = today, 1 = tomorrow, negative = past. */
export function istDayDiff(value: string, now: Date): number | null {
  const target = istDayNumber(value);
  const today = istDayNumber(now.toISOString());
  if (target === null || today === null) return null;
  return target - today;
}

function compareNumbers(a: number, b: number): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

/** Epoch ms of a server timestamp, with an unparseable one sorting last. */
function serverTimeOrLast(value: string): number {
  const ms = parseServerTime(value);
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
}

function dayNumberOrLast(value: string | null): number {
  const day = value === null ? null : istDayNumber(value);
  return day === null ? Number.POSITIVE_INFINITY : day;
}

// ---------------------------------------------------------------------------
// Audit mini-card (GET /farmers/me/audits)
// ---------------------------------------------------------------------------

export const UPCOMING_AUDIT_STATUSES: readonly AuditStatus[] = ['SCHEDULED', 'IN_PROGRESS'];

/**
 * The audit the mini-card is about. An audit already IN_PROGRESS is happening
 * now, so it wins over any scheduled one; otherwise the earliest scheduled.
 */
export function selectNextAudit(items: readonly FarmerAuditSummary[]): FarmerAuditSummary | null {
  const upcoming = items.filter(isUpcoming);
  const inProgress = upcoming.filter((a) => a.status === 'IN_PROGRESS');
  const pool = inProgress.length > 0 ? inProgress : upcoming;
  return (
    [...pool].sort((a, b) => compareNumbers(serverTimeOrLast(a.scheduledFor), serverTimeOrLast(b.scheduledFor)))[0] ??
    null
  );
}

export type AuditCountdown =
  | { kind: 'none' }
  | { kind: 'inProgress' }
  | { kind: 'today' }
  | { kind: 'tomorrow' }
  | { kind: 'inDays'; days: number }
  /** Still SCHEDULED but its day has passed: show the date, never a negative countdown. */
  | { kind: 'past'; day: number; monthIndex: number }
  | { kind: 'unknown' };

export function auditCountdown(next: FarmerAuditSummary | null, now: Date): AuditCountdown {
  if (next === null) return { kind: 'none' };
  if (next.status === 'IN_PROGRESS') return { kind: 'inProgress' };
  const days = istDayDiff(next.scheduledFor, now);
  if (days === null) return { kind: 'unknown' };
  if (days === 0) return { kind: 'today' };
  if (days === 1) return { kind: 'tomorrow' };
  if (days > 1) return { kind: 'inDays', days };
  const parts = istDateParts(toIsoTimestamp(next.scheduledFor));
  return parts === null ? { kind: 'unknown' } : { kind: 'past', day: parts.day, monthIndex: parts.monthIndex };
}

// ---------------------------------------------------------------------------
// Active Crops preview (api/crops.ts listAllActiveFarmCrops)
// ---------------------------------------------------------------------------

/** The design's three preview cards; "View all" opens ActiveCropsScreen for the rest. */
export const DASHBOARD_CROP_PREVIEW_LIMIT = 3;

const CROP_STATUS_ORDER: Record<FarmCropStatus, number> = { GROWING: 0, PLANNED: 1, HARVESTED: 2, FAILED: 3 };

export interface CropPreview {
  shown: PlotFarmCrop[];
  /** Every active crop fetched, not just the shown ones. */
  total: number;
  hiddenCount: number;
  /** False when the loader gave up on a looping cursor, so `total` is a lower bound. */
  totalIsExact: boolean;
}

/** In the ground first, then planned; within each, the soonest expected harvest first. */
export function selectCropPreview(result: ActiveFarmCropsResult, limit: number): CropPreview {
  const sorted = [...result.items].sort(
    (a, b) =>
      CROP_STATUS_ORDER[a.crop.status] - CROP_STATUS_ORDER[b.crop.status] ||
      compareNumbers(dayNumberOrLast(a.crop.expectedHarvestOn), dayNumberOrLast(b.crop.expectedHarvestOn)) ||
      a.crop.cropName.localeCompare(b.crop.cropName),
  );
  const shown = sorted.slice(0, Math.max(0, limit));
  return { shown, total: sorted.length, hiddenCount: sorted.length - shown.length, totalIsExact: result.complete };
}

export interface CropCardView {
  id: string;
  name: string;
  plotName: string;
  status: FarmCropStatus;
  /** Whole days since planting; null with no planting date, or one still ahead. */
  daysOld: number | null;
  /** IST calendar days to the expected harvest (negative = overdue); null when not recorded. */
  daysToHarvest: number | null;
  /** 0-100 from planting to expected harvest; null without both dates -- never a guessed figure. */
  progressPercent: number | null;
}

export function cropCardView({ crop, plot }: PlotFarmCrop, now: Date): CropCardView {
  // Negative = planted that many days ago.
  const plantedDiff = crop.plantedOn === null ? null : istDayDiff(crop.plantedOn, now);
  const daysToHarvest = crop.expectedHarvestOn === null ? null : istDayDiff(crop.expectedHarvestOn, now);

  let progressPercent: number | null = null;
  if (plantedDiff !== null && daysToHarvest !== null) {
    const span = daysToHarvest - plantedDiff;
    const elapsed = 0 - plantedDiff;
    if (span > 0) progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / span) * 100)));
  }

  return {
    id: crop.id,
    name: crop.cropName,
    plotName: plot.name,
    status: crop.status,
    daysOld: plantedDiff === null || plantedDiff > 0 ? null : 0 - plantedDiff,
    daysToHarvest,
    progressPercent,
  };
}

// ---------------------------------------------------------------------------
// Certification card (api/farmer.ts listAllMyCertifications)
// ---------------------------------------------------------------------------

// The status function lives in api/farmer.ts so the market-access banner
// (`evalMarketBlock`) and this card share one implementation; re-exported here
// for the dashboard's existing imports.
export { summarizeCertifications, type CertSummary } from '../../api/farmer';

// ---------------------------------------------------------------------------
// Counter-offer alert
// ---------------------------------------------------------------------------

export type PendingCounterOfferListing = Listing & { activeCounterOffer: CounterOffer };

/**
 * BR-10/BR-11: only an offer the server still reports as PENDING is
 * actionable; soonest expiry first. Expiries are parsed with
 * `parseServerTime` because the listings repo emits Postgres text timestamps
 * (`2026-10-05 07:42:36.490266+00`) that `new Date()` cannot parse on Hermes.
 */
export function soonestPendingCounterOffers(listings: readonly Listing[]): PendingCounterOfferListing[] {
  return listings
    .filter(
      (l): l is PendingCounterOfferListing => l.activeCounterOffer != null && l.activeCounterOffer.status === 'PENDING',
    )
    .sort((a, b) =>
      compareNumbers(serverTimeOrLast(a.activeCounterOffer.expiresAt), serverTimeOrLast(b.activeCounterOffer.expiresAt)),
    );
}
