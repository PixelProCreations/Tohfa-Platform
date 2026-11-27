/**
 * Farmers Management → Farmer Details → History tab.
 *
 * UI ONLY. There is no farmer-history endpoint wired yet, so the timeline renders
 * `farmer-history.mock.ts`. The year dropdown and the search box filter that list locally; when the
 * API lands both become query parameters on a service call and the route gets its
 * `requirePermission` code from docs/rbac.json.
 *
 * The square filter button beside the search box is deliberately inert: the approved design does not
 * show the panel it opens, so it renders but performs no action.
 */
import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { FARMER_HISTORY_MOCK, type FarmerHistoryEntryMock, type FarmerHistoryKindMock } from './farmer-history.mock';
import { FARMER_HISTORY_STRINGS as S } from './farmer-history-tab.strings';

type Tone = 'amber' | 'green';

/** Material Symbols glyph and tile tint per entry kind, as drawn in the design. */
const KIND_VISUAL: Record<FarmerHistoryKindMock, { icon: string; tone: Tone }> = {
  LISTING_SUBMITTED: { icon: 'shopping_basket', tone: 'amber' },
  AUDIT_COMPLETED: { icon: 'verified', tone: 'green' },
  RATING_UPDATED: { icon: 'star', tone: 'amber' },
  LISTING_APPROVED: { icon: 'check_circle', tone: 'green' },
};

interface TimelineEntry extends FarmerHistoryEntryMock {
  icon: string;
  tone: Tone;
  dateText: string;
}

function yearOf(isoDate: string): string {
  return isoDate.slice(0, 4);
}

let nextHistoryId = 0;

@Component({
  selector: 'tohfa-farmer-history-tab',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .icon {
        font-size: var(--icon-btn);
      }
      .sr-only {
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

      /* ---------- Tab heading ---------- */
      .tab-head {
        display: flex;
        align-items: flex-start;
        gap: var(--space-12);
        margin-bottom: var(--space-18);
      }
      .tab-head > .icon {
        margin-top: var(--space-4);
        font-size: var(--icon-dialog-close);
        color: var(--tohfa-amber);
      }
      .tab-title {
        margin: 0;
        font-size: var(--fs-page);
        font-weight: var(--fw-bold);
      }
      .tab-sub {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }

      /* ---------- Toolbar ---------- */
      .toolbar {
        display: grid;
        grid-template-columns: calc(var(--space-32) * 6) minmax(0, 1fr) auto;
        gap: var(--space-10);
        align-items: center;
        margin-bottom: var(--space-20);
      }
      .control {
        position: relative;
        display: flex;
        align-items: center;
      }
      .lead,
      .trail {
        position: absolute;
        font-size: var(--icon-input);
        color: var(--tohfa-slate);
        pointer-events: none;
      }
      .lead {
        left: var(--space-14);
      }
      .trail {
        right: var(--space-12);
      }
      .tohfa-input {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--r-md);
        padding-left: calc(var(--space-14) + var(--icon-input) + var(--space-8));
      }
      select.tohfa-input {
        appearance: none;
        padding-right: var(--space-32);
        cursor: pointer;
      }
      .filter-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--tohfa-min-touch-target) + var(--space-4));
        height: calc(var(--tohfa-min-touch-target) + var(--space-4));
        border: var(--border-card);
        border-radius: var(--r-md);
        background: var(--tohfa-surface);
        color: var(--tohfa-slate);
        cursor: pointer;
      }
      .filter-btn:hover {
        background: var(--tohfa-page);
      }
      .filter-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .filter-btn .icon {
        font-size: var(--icon-nav);
      }

      /* ---------- Year group ---------- */
      .year-group + .year-group {
        margin-top: var(--space-24);
      }
      .year-chip {
        display: inline-block;
        margin: 0 0 var(--space-14);
        padding: var(--space-6) var(--space-14);
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }

      /* ---------- Timeline ---------- */
      .timeline {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      /* The vertical rail, centred on the dot column. */
      .timeline::before {
        content: '';
        position: absolute;
        top: var(--space-16);
        bottom: var(--space-16);
        left: calc(var(--space-20) / 2 - 1px);
        width: 2px;
        background: var(--tohfa-border);
      }
      .entry {
        display: grid;
        grid-template-columns: var(--space-20) minmax(0, 1fr);
        column-gap: var(--space-12);
        align-items: center;
      }
      .dot {
        position: relative;
        box-sizing: border-box;
        width: var(--space-20);
        height: var(--space-20);
        border: 2.5px solid var(--tohfa-amber);
        border-radius: var(--r-circle);
        background: var(--tohfa-page);
      }
      .dot.green {
        border-color: var(--ok);
      }
      .card {
        display: grid;
        grid-template-columns: auto minmax(0, 2fr) minmax(0, 3fr);
        align-items: center;
        column-gap: var(--space-16);
        padding: var(--space-14) var(--space-18);
        border: var(--border-card);
        border-radius: var(--r-md);
        background: var(--tohfa-surface);
      }
      .tile {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-20) * 2);
        height: calc(var(--space-20) * 2);
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-amber);
      }
      .tile.green {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .tile .icon {
        font-size: var(--icon-nav);
      }
      .entry-title {
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .entry-date {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        margin-top: var(--space-4);
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .entry-date .icon {
        font-size: var(--fs-cell);
      }
      .entry-desc {
        margin: 0;
        padding-left: var(--space-16);
        border-left: var(--border-card);
        font-size: var(--fs-cell);
      }

      .empty {
        margin: 0;
        padding: var(--space-24);
        border: var(--border-card);
        border-radius: var(--r-md);
        background: var(--tohfa-surface);
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
        text-align: center;
      }

      @media (max-width: 900px) {
        .toolbar {
          grid-template-columns: minmax(0, 1fr) auto;
        }
        .toolbar .year {
          grid-column: 1 / -1;
        }
        .card {
          grid-template-columns: auto minmax(0, 1fr);
          row-gap: var(--space-10);
        }
        .entry-desc {
          grid-column: 1 / -1;
          padding: var(--space-10) 0 0;
          border-left: none;
          border-top: var(--border-divider);
        }
      }
    `,
  ],
  template: `
    <section [attr.aria-label]="S.regionLabel(farmerName)">
      <header class="tab-head">
        <span class="material-symbols-outlined icon" aria-hidden="true">history</span>
        <div>
          <h2 class="tab-title">{{ S.TITLE }}</h2>
          <p class="tab-sub">{{ S.SUBTITLE }}</p>
        </div>
      </header>

      <!-- ================= Toolbar ================= -->
      <div class="toolbar">
        <div class="control year">
          <label class="sr-only" [for]="ids.year">{{ S.YEAR_LABEL }}</label>
          <span class="material-symbols-outlined lead" aria-hidden="true">calendar_today</span>
          <select [id]="ids.year" class="tohfa-input" [value]="year()" (change)="onYear($event)">
            <option *ngFor="let y of years" [value]="y" [selected]="y === year()">{{ y }}</option>
          </select>
          <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
        </div>

        <div class="control">
          <label class="sr-only" [for]="ids.search">{{ S.SEARCH_LABEL }}</label>
          <span class="material-symbols-outlined lead" aria-hidden="true">search</span>
          <input
            [id]="ids.search"
            type="search"
            class="tohfa-input"
            autocomplete="off"
            [placeholder]="S.SEARCH_PLACEHOLDER"
            [value]="query()"
            (input)="onQuery($event)"
          />
        </div>

        <!-- Inert on purpose: the design does not show the filter panel this button opens. -->
        <button type="button" class="filter-btn" [attr.aria-label]="S.BTN_FILTER" [title]="S.BTN_FILTER">
          <span class="material-symbols-outlined icon" aria-hidden="true">tune</span>
        </button>
      </div>

      <!-- ================= Timeline ================= -->
      <div>
        <section class="year-group" *ngFor="let g of groups()" [attr.aria-labelledby]="ids.year + '-' + g.year">
          <h3 class="year-chip" [id]="ids.year + '-' + g.year">{{ g.year }}</h3>
          <ol class="timeline" [attr.aria-label]="S.timelineLabel(g.year)">
            <li class="entry" *ngFor="let e of g.entries; let i = index">
              <span class="dot" [class.green]="i % 2 === 1" aria-hidden="true"></span>
              <article class="card">
                <span class="tile" [class.green]="e.tone === 'green'" aria-hidden="true">
                  <span class="material-symbols-outlined icon">{{ e.icon }}</span>
                </span>
                <div>
                  <h4 class="entry-title">{{ e.title }}</h4>
                  <span class="entry-date">
                    <span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>
                    <time [attr.datetime]="e.date">{{ e.dateText }}</time>
                  </span>
                </div>
                <p class="entry-desc">{{ e.description }}</p>
              </article>
            </li>
          </ol>
        </section>

        <p class="empty" *ngIf="groups().length === 0" role="status">{{ S.EMPTY }}</p>
      </div>
    </section>
  `,
})
export class FarmerHistoryTabComponent {
  private readonly locale = inject(LOCALE_ID);

  /** Display name used for the tab region's accessible label. */
  @Input() farmerName = 'the farmer';

  readonly S = S;

  private readonly uid = nextHistoryId++;
  readonly ids = {
    year: `history-year-${this.uid}`,
    search: `history-search-${this.uid}`,
  };

  private readonly entries: readonly TimelineEntry[] = FARMER_HISTORY_MOCK.map((e) => ({
    ...e,
    ...KIND_VISUAL[e.kind],
    dateText: formatDate(e.date, 'dd MMM y', this.locale),
  }));

  /** Distinct years present in the data, newest first. */
  readonly years: readonly string[] = [...new Set(this.entries.map((e) => yearOf(e.date)))].sort((a, b) => b.localeCompare(a));

  readonly year = signal<string>(this.years[0] ?? '');
  readonly query = signal('');

  readonly groups = computed(() => {
    const year = this.year();
    const q = this.query().trim().toLowerCase();
    const matches = this.entries.filter(
      (e) =>
        yearOf(e.date) === year && (q === '' || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)),
    );
    return matches.length === 0 ? [] : [{ year, entries: matches }];
  });

  onYear(event: Event): void {
    this.year.set((event.target as HTMLSelectElement).value);
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
