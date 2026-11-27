/**
 * Helpers and styles shared by the Livestock tab, its edit stepper and its two modals, so the four
 * pieces cannot drift apart. UI only — see farmer-livestock.mock.ts.
 */
import { formatDate } from '@angular/common';
import {
  LIVESTOCK_TYPE_OPTIONS,
  PRODUCTION_TYPE_OPTIONS,
  type LivestockOption,
  type LivestockRecordDraft,
} from './farmer-livestock.mock';
import { FARMER_LIVESTOCK_STRINGS as S } from './farmer-livestock-tab.strings';

/**
 * Formats an ISO `yyyy-MM-dd` date as "23 Sep 2025".
 *
 * Angular parses a bare ISO date as *local* midnight, so formatting it in UTC (or any zone west of
 * the browser) would print the day before. Building the instant with Date.UTC and formatting in
 * UTC keeps the calendar day fixed whatever the viewer's timezone.
 */
export function formatLivestockDate(iso: string, locale: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return S.DASH;
  const instant = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return formatDate(instant, 'dd MMM y', locale, 'UTC');
}

/** Label for an option value; free-text values that are not in the list are shown as typed. */
export function optionLabel(options: readonly LivestockOption[], value: string): string {
  if (!value) return '';
  return options.find((o) => o.value === value)?.label ?? value;
}

/** Keeps a stored free-text value selectable even when it is not one of the suggestions. */
export function withCurrent(options: readonly LivestockOption[], value: string): readonly LivestockOption[] {
  if (!value || options.some((o) => o.value === value)) return options;
  return [...options, { value, label: value }];
}

export function livestockTypeLabel(value: string): string {
  return optionLabel(LIVESTOCK_TYPE_OPTIONS, value);
}

/** Unit suffix for a production type ("litres", "eggs", "kg"). */
export function productionUnit(productType: string): string {
  return PRODUCTION_TYPE_OPTIONS.find((o) => o.value === productType)?.unit ?? '';
}

/** "Cow · COW-01 · Lakshmi" */
export function animalTitle(record: LivestockRecordDraft): string {
  return S.animalTitle(livestockTypeLabel(record.livestockType), record.livestockId, record.name.trim());
}

/** Thumbnail placeholder tile (never an image) and the Active / Ended pill. Theme variables only. */
export const LIVESTOCK_SHARED_STYLES = `
  .icon {
    font-size: var(--icon-btn);
  }
  .thumb {
    display: inline-flex;
    flex: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    width: calc(var(--space-32) * 2);
    height: calc(var(--space-32) * 2);
    border: 1px solid var(--neutral-status-bd);
    border-radius: var(--r-sm);
    background: var(--neutral-status-bg);
    color: var(--tohfa-muted);
    font-size: var(--fs-cap);
  }
  .thumb .icon {
    font-size: var(--icon-dialog-close);
  }
  .status-pill {
    border-color: transparent;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
  .btn-icon-only:focus-visible,
  .tohfa-btn:focus-visible {
    outline: none;
    box-shadow: var(--tohfa-focus-ring);
  }
`;

/** Dialog chrome common to the saved and end-record modals. */
export const LIVESTOCK_DIALOG_STYLES = `
  :host {
    font-family: var(--font);
    color: var(--tohfa-ink);
  }
  .icon {
    font-size: var(--icon-btn);
  }
  .ld {
    position: relative;
    max-width: calc(var(--space-32) * 15);
    width: calc(100vw - var(--space-32) * 2);
    max-height: calc(100vh - var(--space-32) * 2);
    overflow-y: auto;
  }
  .ld-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-6);
    border: 1px solid transparent;
    border-radius: var(--r-sm);
    background: none;
    color: var(--tohfa-ink);
    cursor: pointer;
  }
  .ld-close .icon {
    font-size: var(--icon-dialog-close);
  }
  .ld-close:focus-visible,
  .tohfa-btn:focus-visible {
    outline: none;
    box-shadow: var(--tohfa-focus-ring);
  }
  .tohfa-btn {
    min-height: var(--tohfa-min-touch-target);
    border-radius: var(--tohfa-radius-button);
  }
`;
