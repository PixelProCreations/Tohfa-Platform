/**
 * Farmers Management → Farmer Details → Payout tab.
 *
 * UI ONLY. There is no farmer-payout endpoint wired yet, so every value comes from
 * `farmer-payout.mock.ts`. Search and the two filters narrow the mock rows locally; "View Details"
 * has no design and no route, so it is an inert (aria-disabled) button. When the API lands, the
 * mock import is replaced by a service call, the summary cards come from the server, and filtering
 * moves server-side with the rest of the table.
 *
 * Dates are ISO calendar strings (yyyy-mm-dd) compared in UTC so a timezone offset can never move
 * a payout across a range boundary. Amounts are `Money` strings formatted through the shared
 * helper, never floats.
 */
import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { format as formatMoney, type Money } from '@tohfa/shared-types';
import { DataTableCellDirective, DataTableComponent, type Column } from '../../shared/data-table/data-table.component';
import { FARMER_PAYOUT_MOCK, PAYOUT_REFERENCE_DATE, type PayoutStatusMock } from './farmer-payout.mock';
import { FARMER_PAYOUT_STRINGS as S } from './farmer-payout-tab.strings';

type DateRange = keyof typeof S.DATE_RANGE;
type StatusFilter = 'ALL' | PayoutStatusMock;
type Tone = 'success' | 'danger' | 'warning';

type PayoutRow = {
  payoutId: string;
  purchaseReference: string;
  date: string;
  amount: string;
  paymentMethod: string;
  status: PayoutStatusMock;
  action: null;
};

const STATUS_TONE: Record<PayoutStatusMock, Tone> = {
  SETTLED: 'success',
  PAID: 'success',
  FAILED: 'danger',
  PENDING: 'warning',
};

const STATUS_ICON: Record<PayoutStatusMock, string> = {
  SETTLED: 'check',
  PAID: 'check',
  FAILED: 'close',
  PENDING: 'schedule',
};

const DATE_RANGES = Object.keys(S.DATE_RANGE) as DateRange[];
const STATUS_FILTERS: StatusFilter[] = ['ALL', 'SETTLED', 'PAID', 'FAILED', 'PENDING'];

function isStatus(value: unknown): value is PayoutStatusMock {
  return typeof value === 'string' && value in STATUS_TONE;
}

/** Whole days from `from` to `to` (both yyyy-mm-dd). */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function inRange(isoDate: string, range: DateRange): boolean {
  const age = daysBetween(isoDate, PAYOUT_REFERENCE_DATE);
  switch (range) {
    case 'ALL':
      return true;
    case 'LAST_30':
      return age >= 0 && age < 30;
    case 'LAST_90':
      return age >= 0 && age < 90;
    case 'THIS_YEAR':
      return isoDate.slice(0, 4) === PAYOUT_REFERENCE_DATE.slice(0, 4) && age >= 0;
  }
}

/**
 * The design shows whole rupees ("₹25,700"); the shared formatter always prints paise
 * ("₹25,700.00"). Drop a trailing ".00" from the formatted string — never via a float — and keep
 * real paise when there are any.
 */
function rupees(m: Money): string {
  const text = formatMoney(m);
  return text.endsWith('.00') ? text.slice(0, -3) : text;
}

let nextId = 0;

@Component({
  selector: 'tohfa-farmer-payout-tab',
  standalone: true,
  imports: [CommonModule, DataTableComponent, DataTableCellDirective],
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
        padding: 0;
        margin: -1px;
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
        margin-bottom: var(--space-16);
      }
      .tab-head > .icon {
        margin-top: var(--space-4);
        font-size: var(--icon-nav);
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

      /* ---------- Summary cards ---------- */
      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--space-14);
        margin: 0 0 var(--space-32);
      }
      .stat {
        display: flex;
        align-items: center;
        gap: var(--space-14);
        min-width: 0;
        padding: var(--space-16);
      }
      .tile {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-11) * 4);
        height: calc(var(--space-11) * 4);
        border-radius: var(--r-md);
      }
      .tile .icon {
        font-size: var(--icon-dialog-close);
      }
      .tile-ok {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .tile-warn {
        background: var(--warn-bg);
        color: var(--warn);
      }
      .tile-err {
        background: var(--err-bg);
        color: var(--err);
      }
      .tile-info {
        background: var(--info-bg);
        color: var(--info);
      }
      .stat dl,
      .stat dd {
        margin: 0;
      }
      .stat-label {
        font-size: var(--fs-cell);
        font-weight: var(--fw-semi);
        color: var(--tohfa-slate);
      }
      .stat-val {
        margin-top: var(--space-4);
        font-size: var(--fs-title-login);
        font-weight: var(--fw-xbold);
        line-height: 1.2;
        overflow-wrap: anywhere;
      }
      .stat-val.date {
        font-size: var(--fs-page);
      }
      .val-warn {
        color: var(--warn);
      }
      .val-err {
        color: var(--err);
      }

      /* ---------- Payout history ---------- */
      .section-title {
        margin: 0;
        font-size: var(--fs-page);
        font-weight: var(--fw-bold);
      }
      .section-sub {
        margin: var(--space-6) 0 var(--space-16);
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .filters {
        display: grid;
        grid-template-columns: minmax(0, 1fr) calc(var(--space-20) * 9) calc(var(--space-20) * 9);
        gap: var(--space-10);
        margin-bottom: var(--space-14);
      }
      .control {
        position: relative;
        display: flex;
        align-items: center;
      }
      .control .lead,
      .control .trail {
        position: absolute;
        color: var(--tohfa-slate);
        font-size: var(--icon-input);
        pointer-events: none;
      }
      .control .lead {
        left: var(--space-14);
      }
      .control .trail {
        right: var(--space-12);
        font-size: var(--icon-nav);
      }
      .search .lead {
        color: var(--tohfa-muted);
      }
      .control .tohfa-input {
        min-height: var(--tohfa-min-touch-target);
        font-size: var(--fs-cell);
      }
      .with-lead {
        padding-left: calc(var(--space-20) + var(--space-20));
      }
      select.tohfa-input {
        padding-right: var(--space-32);
        appearance: none;
        cursor: pointer;
      }

      /* ---------- Table cells ---------- */
      .strong {
        font-weight: var(--fw-bold);
      }
      .pill {
        gap: var(--space-4);
      }
      .pill .icon {
        font-size: var(--fs-cell);
      }
      .view {
        gap: var(--space-6);
        padding: var(--space-6) var(--space-10);
        border-radius: var(--r-sm);
        font-size: var(--fs-cap);
      }
      .view .icon {
        font-size: var(--icon-row-action);
      }
      .view[aria-disabled='true'] {
        cursor: not-allowed;
      }

      @media (max-width: 1100px) {
        .stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .filters {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <header class="tab-head">
      <span class="material-symbols-outlined icon" aria-hidden="true">payments</span>
      <div>
        <h2 class="tab-title">{{ S.TITLE }}</h2>
        <p class="tab-sub">{{ S.SUBTITLE }}</p>
      </div>
    </header>

    <!-- Summary cards: static design values from the mock file, not derived from the rows. -->
    <div class="stats">
      <div class="tohfa-card stat">
        <span class="tile tile-ok" aria-hidden="true"><span class="material-symbols-outlined icon">account_balance_wallet</span></span>
        <dl>
          <dt class="stat-label">{{ S.STAT_TOTAL_PAID }}</dt>
          <dd class="stat-val">{{ totalPaid }}</dd>
        </dl>
      </div>
      <div class="tohfa-card stat">
        <span class="tile tile-warn" aria-hidden="true"><span class="material-symbols-outlined icon">schedule</span></span>
        <dl>
          <dt class="stat-label">{{ S.STAT_PENDING }}</dt>
          <dd class="stat-val val-warn">{{ pendingPayout }}</dd>
        </dl>
      </div>
      <div class="tohfa-card stat">
        <span class="tile tile-err" aria-hidden="true"><span class="material-symbols-outlined icon">cancel</span></span>
        <dl>
          <dt class="stat-label">{{ S.STAT_FAILED }}</dt>
          <dd class="stat-val val-err">{{ failedPayout }}</dd>
        </dl>
      </div>
      <div class="tohfa-card stat">
        <span class="tile tile-info" aria-hidden="true"><span class="material-symbols-outlined icon">calendar_month</span></span>
        <dl>
          <dt class="stat-label">{{ S.STAT_LAST }}</dt>
          <dd class="stat-val date">{{ lastPayout }}</dd>
        </dl>
      </div>
    </div>

    <section [attr.aria-labelledby]="ids.history">
      <h3 class="section-title" [id]="ids.history">{{ S.HISTORY_TITLE }}</h3>
      <p class="section-sub">{{ S.HISTORY_SUBTITLE }}</p>

      <div class="filters" role="search">
        <div class="control search">
          <span class="material-symbols-outlined lead" aria-hidden="true">search</span>
          <input
            type="search"
            class="tohfa-input with-lead"
            [placeholder]="S.SEARCH_PLACEHOLDER"
            [attr.aria-label]="S.SEARCH_LABEL"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
        </div>
        <div class="control">
          <span class="material-symbols-outlined lead" aria-hidden="true">calendar_today</span>
          <select
            class="tohfa-input with-lead"
            [attr.aria-label]="S.DATE_FILTER_LABEL"
            (change)="dateRange.set($any($event.target).value)"
          >
            <option *ngFor="let r of dateRanges" [value]="r" [selected]="r === dateRange()">{{ S.DATE_RANGE[r] }}</option>
          </select>
          <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
        </div>
        <div class="control">
          <select
            class="tohfa-input"
            [attr.aria-label]="S.STATUS_FILTER_LABEL"
            (change)="statusFilter.set($any($event.target).value)"
          >
            <option *ngFor="let s of statusFilters" [value]="s" [selected]="s === statusFilter()">{{ statusOption(s) }}</option>
          </select>
          <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
        </div>
      </div>

      <p class="sr-only" aria-live="polite">{{ S.resultCount(rows().length) }}</p>

      <tohfa-data-table [columns]="columns" [rows]="rows()" [total]="rows().length" [emptyMessage]="S.TABLE_EMPTY">
        <ng-template tohfaCell="payoutId" let-row>
          <span class="strong">{{ row.payoutId }}</span>
        </ng-template>
        <ng-template tohfaCell="amount" let-row>
          <span class="strong">{{ row.amount }}</span>
        </ng-template>
        <ng-template tohfaCell="status" let-row>
          <span class="tohfa-badge tohfa-badge-sm pill tohfa-badge-{{ toneOf(row.status) }}">
            <span class="material-symbols-outlined icon" aria-hidden="true">{{ iconOf(row.status) }}</span>{{ statusLabel(row.status) }}
          </span>
        </ng-template>
        <ng-template tohfaCell="action" let-row>
          <!-- No payout detail design or route exists yet, so the button is inert. -->
          <button
            type="button"
            class="tohfa-btn tohfa-btn-outline-amber view"
            aria-disabled="true"
            [title]="S.NOT_AVAILABLE_YET"
            [attr.aria-label]="S.viewDetailsLabel(row.payoutId)"
          >
            <span class="material-symbols-outlined icon" aria-hidden="true">visibility</span>{{ S.ACTION_VIEW }}
          </button>
        </ng-template>
      </tohfa-data-table>
    </section>
  `,
})
export class FarmerPayoutTabComponent {
  private readonly locale = inject(LOCALE_ID);

  /** Display name of the farmer; reserved for the detail view / API wiring. */
  @Input() farmerName = '';

  readonly S = S;
  readonly dateRanges = DATE_RANGES;
  readonly statusFilters = STATUS_FILTERS;

  private readonly uid = nextId++;
  readonly ids = { history: `payout-history-${this.uid}` };

  readonly columns: readonly Column[] = [
    { key: 'payoutId', header: S.COL_PAYOUT_ID },
    { key: 'purchaseReference', header: S.COL_PURCHASE_REF },
    { key: 'date', header: S.COL_DATE },
    { key: 'amount', header: S.COL_AMOUNT },
    { key: 'paymentMethod', header: S.COL_METHOD },
    { key: 'status', header: S.COL_STATUS },
    { key: 'action', header: S.COL_ACTION },
  ];

  // ---------- Summary (static mock values, see farmer-payout.mock.ts) ----------
  readonly totalPaid = rupees(FARMER_PAYOUT_MOCK.summary.totalPaid);
  readonly pendingPayout = rupees(FARMER_PAYOUT_MOCK.summary.pendingPayout);
  readonly failedPayout = rupees(FARMER_PAYOUT_MOCK.summary.failedPayout);
  readonly lastPayout = this.date(FARMER_PAYOUT_MOCK.summary.lastPayoutDate);

  // ---------- Filters (local only) ----------
  readonly query = signal('');
  readonly dateRange = signal<DateRange>('ALL');
  readonly statusFilter = signal<StatusFilter>('ALL');

  readonly rows = computed<PayoutRow[]>(() => {
    const q = this.query().trim().toLowerCase();
    const range = this.dateRange();
    const status = this.statusFilter();
    return FARMER_PAYOUT_MOCK.rows
      .filter((p) => q === '' || p.payoutId.toLowerCase().includes(q) || p.purchaseReference.toLowerCase().includes(q))
      .filter((p) => status === 'ALL' || p.status === status)
      .filter((p) => inRange(p.date, range))
      .map((p) => ({
        payoutId: p.payoutId,
        purchaseReference: p.purchaseReference,
        date: this.date(p.date),
        amount: rupees(p.amount),
        paymentMethod: p.paymentMethod,
        status: p.status,
        action: null,
      }));
  });

  statusOption(s: StatusFilter): string {
    return s === 'ALL' ? S.STATUS_ALL : S.STATUS[s];
  }

  // Cell templates hand rows over as the table's untyped `Row`, hence `unknown` + a guard.
  toneOf(status: unknown): Tone {
    return isStatus(status) ? STATUS_TONE[status] : 'warning';
  }

  iconOf(status: unknown): string {
    return isStatus(status) ? STATUS_ICON[status] : 'schedule';
  }

  statusLabel(status: unknown): string {
    return isStatus(status) ? S.STATUS[status] : '—';
  }

  private date(isoDate: string): string {
    return formatDate(isoDate, 'dd MMM y', this.locale, 'UTC');
  }
}
