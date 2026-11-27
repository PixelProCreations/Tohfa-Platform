/**
 * Farmer Details → Produce Listing tab.
 *
 * Data source — SPEC GAP. docs/openapi.yaml has no farmer-scoped listing read for admins:
 * - `GET /v1/admin/listings` (`listPendingListings`, `listing.queue.view_pending`) filters by
 *   `status`, `cropId` and `zoneId` only. Paging that all-farmer queue and filtering it by
 *   `farmerId` in the browser would show a partial, page-dependent subset with wrong counts, so
 *   this tab does not do it.
 * - `GET /v1/listings` is the farmer's own list (`listing.view_own`), not callable for another farmer.
 * - No endpoint returns per-farmer listing counts, and `GET /v1/admin/audit-log` can only narrow to
 *   one listing (`entityId`), which needs the listing ids this tab cannot fetch.
 *
 * So the tab renders the real layout with honest empty states: stat tiles show "—", the table and
 * side cards are empty, and filters / search / date range / export / row actions are disabled with
 * a "Not available yet" tooltip. "View All" links to the existing admin queue at `/listings`.
 *
 * The row/summary rendering is already typed against `AdminListing` (docs/openapi.yaml), so wiring
 * a future `GET /v1/admin/farmers/{id}/listings` only needs to fill `listings`.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { format as formatMoney, parseMoney } from '@tohfa/shared-types';
import { RbacService } from '../../core/rbac.service';
import { DataTableCellDirective, DataTableComponent, type Column } from '../../shared/data-table/data-table.component';
import { FARMER_LISTINGS_STRINGS as S } from './farmer-listings-tab.strings';

/** docs/openapi.yaml `ListingStatus`. */
type ListingStatus = keyof typeof S.STATUS;
/** docs/openapi.yaml `Grade`. */
type Grade = keyof typeof S.GRADE;
type Tone = 'warning' | 'success' | 'info' | 'danger' | 'purple' | 'neutral';

/** The fields of docs/openapi.yaml `AdminListing` this tab renders. Money/Quantity are decimal strings. */
export interface FarmerListing {
  id: string;
  listingNumber?: string;
  cropName: string;
  grade: Grade;
  quantityKg: string;
  askingPricePerKg: string;
  finalPricePerKg?: string | null;
  activeCounterOffer?: { pricePerKg: string } | null;
  photos: string[];
  status: ListingStatus;
  createdAt: string;
}

type ListingRow = {
  id: string;
  listingId: string;
  produce: string;
  initial: string;
  photo: string | null;
  grade: string;
  quantity: string;
  price: string;
  listedAt: string;
  status: ListingStatus;
  actions: null;
};

const STATUS_TONE: Record<ListingStatus, Tone> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  COUNTER_OFFERED: 'purple',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
  EXPIRED: 'neutral',
  FULFILLED: 'info',
};

/** Statuses an admin could still edit — FULFILLED ("Sold") never shows Edit, per the design. */
const EDITABLE: ReadonlySet<ListingStatus> = new Set<ListingStatus>(['PENDING_APPROVAL', 'COUNTER_OFFERED']);

function isStatus(value: unknown): value is ListingStatus {
  return typeof value === 'string' && value in STATUS_TONE;
}

/** "1234.5" → "₹1,234.50" through the shared Money helpers; never a float. */
function rupees(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  try {
    return formatMoney(parseMoney(value));
  } catch {
    return null;
  }
}

/**
 * The price the design calls "Counter Price": the live counter-offer if one is open, else the
 * agreed final price, else the farmer's asking price (all per kg).
 */
function counterPrice(l: FarmerListing): string {
  const value = rupees(l.activeCounterOffer?.pricePerKg ?? l.finalPricePerKg ?? l.askingPricePerKg);
  return value === null ? '—' : value + S.PER_KG;
}

/** "150.000" → "150 kg" by trimming the decimal string; Quantity is never parsed as a float. */
function quantity(q: string): string {
  const trimmed = q.includes('.') ? q.replace(/0+$/, '').replace(/\.$/, '') : q;
  return trimmed + S.UNIT_KG;
}

@Component({
  selector: 'tohfa-farmer-listings-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent, DataTableCellDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: grid;
        grid-template-columns: var(--layout-profile-row);
        gap: var(--space-14);
        align-items: start;
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        min-width: 0;
      }
      .icon {
        font-size: var(--icon-btn);
      }
      [aria-disabled='true'] {
        cursor: not-allowed;
      }
      .muted {
        color: var(--tohfa-muted);
      }

      /* ---------- Card heads ---------- */
      .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-10);
      }
      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .card-title .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-brown);
      }
      .subtitle {
        margin: var(--space-6) 0 var(--space-14);
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        color: var(--tohfa-brown);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        text-decoration: underline;
        background: none;
        border: none;
        padding: 0;
        font-family: var(--font);
      }
      .link .icon {
        font-size: var(--icon-row-action);
      }
      .link[aria-disabled='true'] {
        color: var(--tohfa-muted);
      }

      /* ---------- Stat tiles ---------- */
      .stats {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: var(--space-10);
        margin-bottom: var(--space-14);
      }
      .stat {
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
        padding: var(--space-14);
        border: var(--border-card);
        border-radius: var(--r-stat-mini);
        background: var(--tohfa-surface);
      }
      .stat-label {
        font-size: var(--fs-label);
        font-weight: var(--fw-semi);
        color: var(--tohfa-slate);
      }
      .stat-val {
        font-size: var(--fs-title-login);
        font-weight: var(--fw-bold);
        line-height: 1.1;
      }
      .tone-warning .stat-label {
        color: var(--warn);
      }
      .tone-success .stat-label,
      .tone-success .stat-val {
        color: var(--ok);
      }
      .tone-danger .stat-label,
      .tone-danger .stat-val {
        color: var(--err);
      }
      .stat-val.muted {
        color: var(--tohfa-muted);
      }

      /* ---------- Filter row ---------- */
      .filters {
        display: grid;
        grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr auto;
        gap: var(--space-10);
        margin-bottom: var(--space-14);
      }
      .search {
        position: relative;
        display: flex;
        align-items: center;
      }
      .search .icon {
        position: absolute;
        left: var(--space-12);
        color: var(--tohfa-muted);
        font-size: var(--icon-input);
      }
      .search input {
        padding-left: var(--space-32);
        cursor: not-allowed;
      }
      .search input:disabled {
        background: var(--tohfa-surface);
      }
      .dropdown {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-6);
        padding: var(--space-10) var(--space-12);
        border: var(--border-input);
        border-radius: var(--r-tab);
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        font-family: var(--font);
        font-size: var(--fs-dense);
        text-align: left;
      }
      .dropdown .icon {
        font-size: var(--icon-chevron);
        color: var(--tohfa-slate);
      }
      .export {
        min-height: 44px;
      }

      /* ---------- Table cells ---------- */
      .strong {
        font-weight: var(--fw-bold);
      }
      .produce {
        display: inline-flex;
        align-items: center;
        gap: var(--space-8);
      }
      .thumb {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: var(--r-xs);
        object-fit: cover;
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .thumb.lg {
        width: 42px;
        height: 42px;
        border-radius: var(--r-sm);
        font-size: var(--fs-card);
      }
      .pill {
        gap: var(--space-4);
      }
      .pill .icon {
        font-size: var(--fs-cell);
      }
      .row-actions {
        display: inline-flex;
        align-items: center;
        gap: var(--space-10);
      }
      .row-actions button {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        padding: 0;
        border: none;
        background: none;
        color: var(--info);
        font-family: var(--font);
        font-size: var(--fs-cell);
        font-weight: var(--fw-semi);
      }
      .row-actions .kebab {
        color: var(--tohfa-slate);
      }
      .row-actions .icon {
        font-size: var(--icon-row-action);
      }

      /* ---------- Summary card ---------- */
      .eyebrow {
        margin: var(--space-10) 0 var(--space-8);
        color: var(--err);
        font-size: var(--fs-badge);
        font-weight: var(--fw-bold);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .recent {
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .recent-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--space-10);
        padding: var(--space-12);
        border: var(--border-card);
        border-radius: var(--r-stat-mini);
      }
      .recent-title {
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .recent-meta {
        margin-top: var(--space-4);
        font-size: var(--fs-badge);
        color: var(--tohfa-muted);
      }
      .recent-side {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-8);
      }
      .recent-price {
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .card-empty {
        margin: 0;
        padding: var(--space-12) 0;
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
      }
      .activity-head {
        margin-bottom: var(--space-12);
      }

      @media (max-width: 1200px) {
        :host {
          grid-template-columns: minmax(0, 1fr);
        }
        .stats {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .filters {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
    `,
  ],
  template: `
    <!-- Left: Produce Listing -->
    <section class="tohfa-card" aria-labelledby="produce-listing-title">
      <div class="card-head">
        <h2 class="card-title" id="produce-listing-title">
          <span class="material-symbols-outlined icon" aria-hidden="true">stacks</span>{{ S.TITLE }}
        </h2>
      </div>
      <p class="subtitle">{{ S.SUBTITLE }}</p>

      <!-- Stat tiles: no per-farmer count endpoint exists, so each shows "—" (spec gap). -->
      <div class="stats">
        <div class="stat" [title]="S.NO_FARMER_LISTINGS_API">
          <span class="stat-label">{{ S.STAT_TOTAL }}</span>
          <span class="stat-val muted">—</span>
        </div>
        <div class="stat tone-warning" [title]="S.NO_FARMER_LISTINGS_API">
          <span class="stat-label">{{ S.STAT_PENDING }}</span>
          <span class="stat-val muted">—</span>
        </div>
        <div class="stat tone-success" [title]="S.NO_FARMER_LISTINGS_API">
          <span class="stat-label">{{ S.STAT_APPROVED }}</span>
          <span class="stat-val muted">—</span>
        </div>
        <div class="stat tone-danger" [title]="S.NO_FARMER_LISTINGS_API">
          <span class="stat-label">{{ S.STAT_REJECTED }}</span>
          <span class="stat-val muted">—</span>
        </div>
        <div class="stat" [title]="S.NO_FARMER_LISTINGS_API">
          <span class="stat-label">{{ S.STAT_TOTAL_QTY }}</span>
          <span class="stat-val muted">—</span>
        </div>
      </div>

      <!-- Filters: no farmer-scoped endpoint to send them to, so all are disabled. -->
      <div class="filters">
        <label class="search" [title]="S.NO_FARMER_LISTINGS_API">
          <span class="material-symbols-outlined icon" aria-hidden="true">search</span>
          <input
            type="search"
            class="tohfa-input tohfa-input-filter"
            [placeholder]="S.SEARCH_PLACEHOLDER"
            [attr.aria-label]="S.SEARCH_PLACEHOLDER"
            disabled
          />
        </label>
        <button type="button" class="dropdown" aria-disabled="true" [title]="S.NO_FARMER_LISTINGS_API">
          {{ S.FILTER_ALL_STATUS }}<span class="material-symbols-outlined icon" aria-hidden="true">expand_more</span>
        </button>
        <button type="button" class="dropdown" aria-disabled="true" [title]="S.NO_FARMER_LISTINGS_API">
          {{ S.FILTER_ALL_CROPS }}<span class="material-symbols-outlined icon" aria-hidden="true">expand_more</span>
        </button>
        <button type="button" class="dropdown" aria-disabled="true" [title]="S.NO_FARMER_LISTINGS_API">
          {{ S.FILTER_ALL_GRADES }}<span class="material-symbols-outlined icon" aria-hidden="true">expand_more</span>
        </button>
        <button type="button" class="dropdown" aria-disabled="true" [title]="S.NO_FARMER_LISTINGS_API">
          <span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>{{ S.FILTER_DATE_RANGE }}
        </button>
        <button type="button" class="tohfa-btn tohfa-btn-outline-amber export" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET">
          <span class="material-symbols-outlined icon" aria-hidden="true">download</span>{{ S.BTN_EXPORT }}
        </button>
      </div>

      <tohfa-data-table
        [embedded]="true"
        [columns]="columns"
        [rows]="rows()"
        [total]="null"
        [hasMore]="false"
        [page]="1"
        [footerLabel]="footer()"
        [prevLabel]="S.PAGER_PREV"
        [nextLabel]="S.PAGER_NEXT"
        [emptyMessage]="S.TABLE_EMPTY"
      >
        <ng-template tohfaCell="listingId" let-row>
          <span class="strong">{{ row.listingId }}</span>
        </ng-template>
        <ng-template tohfaCell="produce" let-row>
          <span class="produce">
            <img *ngIf="row.photo; else initialTile" class="thumb" [src]="row.photo" alt="" />
            <ng-template #initialTile>
              <span class="thumb" aria-hidden="true">{{ row.initial }}</span>
            </ng-template>
            {{ row.produce }}
          </span>
        </ng-template>
        <ng-template tohfaCell="status" let-row>
          <span class="tohfa-badge tohfa-badge-sm pill tohfa-badge-{{ toneOf(row.status) }}">
            <span *ngIf="row.status === 'FULFILLED'" class="material-symbols-outlined icon" aria-hidden="true">shopping_cart</span>
            {{ statusLabel(row.status) }}
          </span>
        </ng-template>
        <ng-template tohfaCell="actions" let-row>
          <!-- No admin listing detail route or admin edit endpoint exists yet. -->
          <span class="row-actions">
            <button type="button" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET">
              <span class="material-symbols-outlined icon" aria-hidden="true">visibility</span>{{ S.ACTION_VIEW }}
            </button>
            <button *ngIf="isEditable(row.status)" type="button" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET">
              <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.ACTION_EDIT }}
            </button>
            <button type="button" class="kebab" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET" [attr.aria-label]="S.ACTION_MORE">
              <span class="material-symbols-outlined icon" aria-hidden="true">more_vert</span>
            </button>
          </span>
        </ng-template>
      </tohfa-data-table>
    </section>

    <!-- Right column -->
    <div class="col">
      <section class="tohfa-card" aria-labelledby="listing-summary-title">
        <div class="card-head">
          <h2 class="card-title" id="listing-summary-title">
            <span class="material-symbols-outlined icon" aria-hidden="true">stacks</span>{{ S.SUMMARY_TITLE }}
          </h2>
          <a *ngIf="canViewQueue(); else viewAllOff" class="link" routerLink="/listings" [title]="S.VIEW_ALL_HINT">
            {{ S.VIEW_ALL }}<span class="material-symbols-outlined icon" aria-hidden="true">arrow_forward</span>
          </a>
          <ng-template #viewAllOff>
            <button type="button" class="link" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET">
              {{ S.VIEW_ALL }}<span class="material-symbols-outlined icon" aria-hidden="true">arrow_forward</span>
            </button>
          </ng-template>
        </div>
        <p class="eyebrow">{{ S.RECENTLY_LISTED }}</p>
        <ul class="recent" *ngIf="recent().length > 0; else noRecent">
          <li class="recent-item" *ngFor="let r of recent()">
            <img *ngIf="r.photo; else recentInitial" class="thumb lg" [src]="r.photo" alt="" />
            <ng-template #recentInitial>
              <span class="thumb lg" aria-hidden="true">{{ r.initial }}</span>
            </ng-template>
            <div>
              <div class="recent-title">{{ S.produceTitle(r.produce, r.grade) }}</div>
              <div class="recent-meta">{{ S.listedMeta(r.listedAt, r.quantity) }}</div>
            </div>
            <div class="recent-side">
              <span class="tohfa-badge tohfa-badge-sm tohfa-badge-{{ toneOf(r.status) }}">{{ statusLabel(r.status) }}</span>
              <span class="recent-price">{{ r.price }}</span>
            </div>
          </li>
        </ul>
        <ng-template #noRecent>
          <p class="card-empty" [title]="S.NO_FARMER_LISTINGS_API">{{ S.RECENT_EMPTY }}</p>
        </ng-template>
      </section>

      <section class="tohfa-card" aria-labelledby="listing-activity-title">
        <div class="card-head activity-head">
          <h2 class="card-title" id="listing-activity-title">
            <span class="material-symbols-outlined icon" aria-hidden="true">history</span>{{ S.ACTIVITY_TITLE }}
          </h2>
        </div>
        <!-- No farmer-scoped listing status history in the spec (gap); see the file header. -->
        <p class="card-empty" [title]="S.NO_FARMER_LISTINGS_API">{{ S.ACTIVITY_EMPTY }}</p>
      </section>
    </div>
  `,
})
export class FarmerListingsTabComponent {
  private readonly rbac = inject(RbacService);

  /** The farmer whose listings this tab shows. Kept for the farmer-scoped endpoint once it exists. */
  @Input({ required: true }) farmerId = '';

  readonly S = S;

  readonly columns: readonly Column[] = [
    { key: 'listingId', header: S.COL_LISTING_ID },
    { key: 'produce', header: S.COL_PRODUCE },
    { key: 'grade', header: S.COL_GRADE },
    { key: 'quantity', header: S.COL_QUANTITY },
    { key: 'price', header: S.COL_COUNTER_PRICE },
    { key: 'listedAt', header: S.COL_LISTED_DATE },
    { key: 'status', header: S.COL_STATUS },
    { key: 'actions', header: S.COL_ACTIONS },
  ];

  /** UI courtesy only; the API re-checks `listing.queue.view_pending` on `/listings`. */
  readonly canViewQueue = computed(() => this.rbac.can('listing.queue.view_pending'));

  /**
   * The farmer's listings, newest first. Stays empty: docs/openapi.yaml has no farmer-scoped admin
   * listing endpoint to fill it from (see the file header).
   */
  readonly listings = signal<readonly FarmerListing[]>([]);

  readonly rows = computed<ListingRow[]>(() => this.listings().map((l) => this.toRow(l)));
  readonly recent = computed(() => this.rows().slice(0, 2));
  readonly footer = computed(() => S.showing(this.rows().length === 0 ? 0 : 1, this.rows().length));

  // Cell templates hand rows over as the table's untyped `Row`, hence `unknown` + a guard.
  toneOf(status: unknown): Tone {
    return isStatus(status) ? STATUS_TONE[status] : 'neutral';
  }

  statusLabel(status: unknown): string {
    return isStatus(status) ? S.STATUS[status] : '—';
  }

  isEditable(status: unknown): boolean {
    return isStatus(status) && EDITABLE.has(status);
  }

  private toRow(l: FarmerListing): ListingRow {
    return {
      id: l.id,
      listingId: l.listingNumber ?? l.id.slice(0, 8),
      produce: l.cropName,
      initial: l.cropName.charAt(0).toUpperCase(),
      photo: l.photos[0] ?? null,
      grade: S.GRADE[l.grade],
      quantity: quantity(l.quantityKg),
      price: counterPrice(l),
      listedAt: new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: l.status,
      actions: null,
    };
  }
}
