/**
 * Pieces shared by the Assets tab and its three modals: UTC date helpers, the asset view model
 * (next-service-due and overdue), and the modal chrome styles. Kept in one place so the tab and the
 * modals cannot disagree about a date or drift apart visually.
 */
import { formatDate } from '@angular/common';
import {
  ASSET_CATEGORIES,
  ASSET_SOURCES,
  ASSET_TYPES,
  ASSETS_REFERENCE_DATE,
  type FarmerAssetMock,
} from './farmer-assets.mock';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * yyyy-MM-dd → epoch ms at UTC midnight. Dates are built and formatted in UTC on purpose: parsing a
 * date-only string as local time and formatting it in another zone is how "27 Nov 2024" turns into
 * "26 Nov 2024".
 */
export function isoDateToUtcMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

export function addDaysIso(iso: string, days: number): string {
  return new Date(isoDateToUtcMs(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** "27 Nov 2024", always in UTC. */
export function formatIsoDate(iso: string, locale: string): string {
  return formatDate(isoDateToUtcMs(iso), 'd MMM y', locale, 'UTC');
}

export interface AssetView {
  readonly asset: FarmerAssetMock;
  readonly categoryLabel: string;
  readonly typeLabel: string;
  readonly sourceLabel: string;
  /** Spec generated column: COALESCE(last_serviced_on, purchased_on) + service_interval_days. */
  readonly nextServiceDueOn: string;
  /** Next service due before the reference date ("today"). ISO strings compare correctly as text. */
  readonly overdue: boolean;
}

export function toAssetView(asset: FarmerAssetMock, today: string = ASSETS_REFERENCE_DATE): AssetView {
  const nextServiceDueOn = addDaysIso(asset.lastServicedOn ?? asset.purchasedOn, asset.serviceIntervalDays);
  return {
    asset,
    categoryLabel: ASSET_CATEGORIES.find((c) => c.code === asset.category)?.label ?? asset.category,
    typeLabel: ASSET_TYPES.find((t) => t.code === asset.typeCode)?.label ?? asset.typeCode,
    sourceLabel: ASSET_SOURCES.find((s) => s.code === asset.source)?.label ?? asset.source,
    nextServiceDueOn,
    overdue: nextServiceDueOn < today,
  };
}

/** Modal chrome common to Record Service, Edit Asset and Retire Asset. Every value is a theme variable. */
export const ASSET_DIALOG_STYLES = `
  :host {
    font-family: var(--font);
    color: var(--tohfa-ink);
  }
  .icon {
    font-size: var(--icon-btn);
  }
  .ad {
    display: flex;
    flex-direction: column;
    width: calc(100vw - var(--space-32) * 2);
    max-height: calc(100vh - var(--space-32) * 2);
    padding: 0;
    overflow: hidden;
  }
  .ad-narrow {
    max-width: calc(var(--space-20) * 24);
  }
  .ad-wide {
    max-width: calc(var(--space-20) * 30);
  }

  /* ---------- Header ---------- */
  .ad-head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    column-gap: var(--space-12);
    padding: var(--space-24) var(--space-28) var(--space-16);
  }
  .ad-head-icon {
    font-size: var(--icon-dialog-close);
    color: var(--tohfa-amber);
  }
  .ad-head-icon.danger {
    color: var(--err);
  }
  .ad-title {
    margin: 0;
    font-size: var(--fs-title-dialog);
    font-weight: var(--fw-xbold);
    line-height: 1.2;
  }
  .ad-sub {
    grid-column: 2 / span 2;
    margin: var(--space-6) 0 0;
    font-size: var(--fs-dense);
    color: var(--tohfa-slate);
  }
  .ad-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--space-16) * 2);
    height: calc(var(--space-16) * 2);
    padding: 0;
    border: var(--border-card);
    border-radius: var(--r-sm);
    background: var(--tohfa-surface);
    color: var(--tohfa-ink);
    cursor: pointer;
  }
  .ad-close:hover {
    background: var(--tohfa-page);
  }
  .ad-close:focus-visible {
    outline: none;
    box-shadow: var(--tohfa-focus-ring);
  }

  /* ---------- Body ---------- */
  .ad-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-16);
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 var(--space-28) var(--space-4);
  }
  .ad-banner {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    margin: 0;
    padding: var(--space-12) var(--space-16);
    border-radius: var(--r-md);
    background: var(--tohfa-amber);
    color: var(--tohfa-surface);
    font-size: var(--fs-cell);
    font-weight: var(--fw-bold);
  }
  .ad-banner .icon {
    font-size: var(--icon-nav);
  }
  .note {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    margin: 0;
    padding: var(--space-12) var(--space-16);
    border-radius: var(--r-md);
    background: var(--tohfa-amber-tint);
    color: var(--tohfa-brown);
    font-size: var(--fs-dense);
  }
  .note.danger {
    background: var(--err-bg);
    color: var(--err);
  }
  .note .icon {
    flex: none;
    font-size: var(--icon-input);
  }

  /* ---------- Fields ---------- */
  .grid2 {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-16);
  }
  .field {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .field-label {
    display: block;
    margin: 0 0 var(--space-8);
    font-size: var(--fs-cell);
    font-weight: var(--fw-xbold);
  }
  .req {
    color: var(--err);
  }
  .control {
    position: relative;
    display: flex;
    align-items: center;
  }
  .tohfa-input {
    min-height: var(--tohfa-min-touch-target);
    border-radius: var(--tohfa-radius-input);
    font-size: var(--fs-body);
  }
  .tohfa-input.invalid {
    border-color: var(--err);
  }
  select.tohfa-input {
    appearance: none;
    padding-right: var(--space-32);
    cursor: pointer;
  }
  .trail {
    position: absolute;
    right: var(--space-12);
    font-size: var(--icon-input);
    color: var(--tohfa-slate);
    pointer-events: none;
  }
  .lead {
    position: absolute;
    left: var(--space-12);
    color: var(--tohfa-slate);
    font-size: var(--fs-body);
    pointer-events: none;
  }
  .with-lead {
    padding-left: var(--space-28);
  }
  input[type='date'] {
    padding-right: var(--space-32);
  }
  input[type='date']::-webkit-calendar-picker-indicator {
    position: absolute;
    right: var(--space-10);
    opacity: 0;
    cursor: pointer;
  }
  textarea.tohfa-input {
    min-height: calc(var(--space-24) * 3);
    resize: vertical;
  }
  .counter {
    align-self: flex-end;
    margin-top: var(--space-4);
    font-size: var(--fs-cap);
    color: var(--tohfa-muted);
  }
  .field-error {
    margin: var(--space-4) 0 0;
    font-size: var(--fs-cap);
    color: var(--err);
  }

  /* ---------- Footer: two equal buttons ---------- */
  .ad-foot {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-12);
    padding: var(--space-18) var(--space-28) var(--space-24);
  }
  .ad-foot.divided {
    margin: 0 var(--space-28);
    padding-left: 0;
    padding-right: 0;
    border-top: var(--border-divider);
  }
  .ad-foot .tohfa-btn {
    min-height: var(--tohfa-min-touch-target);
    border-radius: var(--tohfa-radius-button);
    font-size: var(--fs-button-l);
  }
  .btn-cancel-ok {
    border: 1px solid var(--ok);
    background: var(--tohfa-surface);
    color: var(--ok);
  }
  .btn-cancel-ok:hover:not(:disabled) {
    background: var(--ok-bg);
  }
  .btn-cancel-amber {
    border: 1px solid var(--tohfa-amber);
    background: var(--tohfa-surface);
    color: var(--tohfa-amber);
  }
  .btn-cancel-amber:hover:not(:disabled) {
    background: var(--tohfa-amber-tint);
  }

  @media (max-width: 640px) {
    .ad-head,
    .ad-body,
    .ad-foot {
      padding-left: var(--space-16);
      padding-right: var(--space-16);
    }
    .ad-foot.divided {
      margin: 0 var(--space-16);
    }
    .grid2 {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;
