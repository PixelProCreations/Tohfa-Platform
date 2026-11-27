/**
 * Pieces shared by the Plant & Crops tab, its Edit Crop page and its two dialogs: UTC calendar-date
 * helpers, the status → pill mapping, stage progress helpers, and the dialog / form chrome. Kept in
 * one place so the screens cannot drift apart visually.
 *
 * Dates: every value is an ISO calendar day (`yyyy-MM-dd`). They are built with `Date.UTC` and
 * formatted in UTC. Angular's `formatDate('2026-10-13', …)` would parse a date-only string as *local*
 * midnight, which is the classic way "13 Oct" becomes "12 Oct"; going through UTC on both sides
 * cannot shift a day.
 */
import { formatDate } from '@angular/common';
import { CROP_STAGES, type FarmCropStatusMock, type FarmerCropRecordMock } from './farmer-crops.mock';

const DAY_MS = 86_400_000;
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Milliseconds at UTC midnight of an ISO calendar day, or NaN for anything else. */
export function utcDayMs(iso: string): number {
  const m = ISO_DAY.exec(iso);
  if (!m) return Number.NaN;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // Reject rolled-over dates such as 2026-02-31.
  return new Date(ms).toISOString().slice(0, 10) === iso ? ms : Number.NaN;
}

export function isIsoDay(iso: string): boolean {
  return !Number.isNaN(utcDayMs(iso));
}

export function addDays(iso: string, days: number): string {
  return new Date(utcDayMs(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((utcDayMs(to) - utcDayMs(from)) / DAY_MS);
}

/** "13 Oct 2026", always the stored calendar day. */
export function formatCropDay(iso: string, locale: string): string {
  return formatDate(new Date(utcDayMs(iso)), 'd MMM y', locale, '+0000');
}

export interface CropStatusMeta {
  /** Theme badge modifier from theme.css. */
  readonly badge: 'tohfa-badge-info' | 'tohfa-badge-success' | 'tohfa-badge-neutral' | 'tohfa-badge-danger';
}

/** Planned blue, Growing green, Harvested grey (design); Failed red. */
export const CROP_STATUS_META: Record<FarmCropStatusMock, CropStatusMeta> = {
  PLANNED: { badge: 'tohfa-badge-info' },
  GROWING: { badge: 'tohfa-badge-success' },
  HARVESTED: { badge: 'tohfa-badge-neutral' },
  FAILED: { badge: 'tohfa-badge-danger' },
};

export type StageSegmentState = 'done' | 'current' | 'upcoming';

/** One state per stage, derived only from the record's stage index. */
export function stageSegments(crop: FarmerCropRecordMock): StageSegmentState[] {
  return CROP_STAGES.map((_, i) => {
    if (crop.stageIndex === null || i > crop.stageIndex) return 'upcoming';
    if (crop.status === 'HARVESTED' || i < crop.stageIndex) return 'done';
    return 'current';
  });
}

/** Styles common to the two crop dialogs. Every value is a theme variable. */
export const CROP_DIALOG_STYLES = `
  :host {
    font-family: var(--font);
    color: var(--tohfa-ink);
  }
  .icon {
    font-size: var(--icon-btn);
  }
  .cd {
    display: flex;
    flex-direction: column;
    max-width: calc(var(--space-32) * 22);
    width: calc(100vw - var(--space-32) * 2);
    max-height: calc(100vh - var(--space-32) * 2);
    padding: 0;
    overflow: hidden;
  }
  .cd.wide {
    max-width: calc(var(--space-32) * 32);
    background: var(--tohfa-page);
  }
  .cd-head {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    padding: var(--space-24) var(--space-28) var(--space-16);
  }
  .cd.wide .cd-head {
    border-bottom: var(--border-divider);
  }
  .cd-head-icon {
    font-size: var(--icon-dialog-close);
    color: var(--ok);
  }
  .cd-title {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--fs-title-dialog);
    font-weight: var(--fw-xbold);
    line-height: 1.2;
  }
  .cd-close {
    display: inline-flex;
    flex: none;
    padding: var(--space-8);
    border: 1px solid var(--tohfa-border);
    border-radius: var(--r-sm);
    background: var(--tohfa-surface);
    color: var(--tohfa-ink);
    cursor: pointer;
  }
  .cd.wide .cd-close {
    border-color: transparent;
    background: none;
  }
  .cd-close .icon {
    font-size: var(--icon-dialog-close);
  }
  .cd-close:focus-visible {
    outline: none;
    box-shadow: var(--tohfa-focus-ring);
  }
  .cd-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: var(--space-8) var(--space-28) var(--space-18);
  }
  .cd.wide .cd-body {
    padding-top: var(--space-18);
  }
  .cd-foot {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-14);
    padding: var(--space-14) var(--space-28) var(--space-24);
  }
  .cd-foot .tohfa-btn {
    min-height: var(--tohfa-min-touch-target);
    border-radius: var(--tohfa-radius-button);
  }

  /* ---------- Placeholder thumbnail ---------- */
  .thumb {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: calc(var(--space-28) * 2);
    height: calc(var(--space-28) * 2);
    border: 1px solid var(--neutral-status-bd);
    border-radius: var(--r-sm);
    background: var(--neutral-status-bg);
    color: var(--tohfa-muted);
  }
  .thumb .icon {
    font-size: var(--icon-dialog-close);
  }

  /* ---------- Fields ---------- */
  .form-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-14) var(--space-20);
  }
  .field {
    display: flex;
    flex-direction: column;
    min-width: 0;
    margin-bottom: var(--space-14);
  }
  .form-row .field {
    margin-bottom: 0;
  }
  .form-row + .field,
  .form-row + .form-row {
    margin-top: var(--space-14);
  }
  .field-label {
    display: block;
    margin: 0 0 var(--space-8);
    font-size: var(--fs-cell);
    font-weight: var(--fw-bold);
  }
  .req {
    color: var(--err);
  }
  .tohfa-input {
    min-height: var(--tohfa-min-touch-target);
    border-radius: var(--tohfa-radius-input);
  }
  .tohfa-input.invalid {
    border-color: var(--err);
  }
  textarea.tohfa-input {
    min-height: calc(var(--space-32) * 3);
    resize: vertical;
  }
  .select-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .select-wrap select {
    appearance: none;
    padding-right: var(--space-32);
    cursor: pointer;
  }
  .select-wrap .chev {
    position: absolute;
    right: var(--space-12);
    font-size: var(--icon-input);
    color: var(--tohfa-slate);
    pointer-events: none;
  }
  .counter {
    display: block;
    margin-top: var(--space-4);
    font-size: var(--fs-cap);
    color: var(--tohfa-muted);
    text-align: right;
  }
  .error {
    margin: var(--space-6) 0 0;
    font-size: var(--fs-dense);
    color: var(--err);
  }

  @media (max-width: 760px) {
    .cd-head,
    .cd-body,
    .cd-foot {
      padding-left: var(--space-16);
      padding-right: var(--space-16);
    }
    .form-row {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;
