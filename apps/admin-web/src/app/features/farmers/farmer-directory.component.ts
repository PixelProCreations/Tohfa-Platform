/**
 * Farmers Management → Farmer Directory (design SA-M3-S01).
 *
 * Data comes from GET /v1/admin/farmers (cursor paged) and GET /v1/admin/farmers/summary,
 * both `farmer.profile.view_all`. Scope is enforced by the API: a Farmer Admin simply
 * receives fewer rows, so this screen never filters for security.
 *
 * Spec gaps (design shows them, docs/openapi.yaml does not provide them):
 * - `AdminFarmerListItem` has no farming method and no certification status, so those
 *   columns render "—" and their filters are disabled.
 * - `listAdminFarmers` has no `kycStatus` filter, so the KYC filter is disabled rather than
 *   filtering one page client-side (which would misreport the page counts).
 * - The list is cursor paged without a total, so "of N" is shown only when no filter is
 *   active, using the summary's `totalFarmers`.
 * - No export endpoint exists yet; that control is rendered but inert. The "Farm Records" quick
 *   action opens the UI-only Farm Records list (`/farmers/farm-records`). The farmer name and the eye icon open the Farmer
 *   Details screen (`/farmers/:id`).
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { RbacService } from '../../core/rbac.service';
import { DataTableCellDirective, DataTableComponent, type Column, type Row } from '../../shared/data-table/data-table.component';
import {
  FarmersService,
  type AdminFarmerAccountStatus,
  type AdminFarmerKycStatus,
  type AdminFarmerListItem,
  type AdminFarmerListQuery,
  type AdminFarmerSummary,
} from './farmers.service';
import { FARMERS_STRINGS as S } from './farmers.strings';

type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

type FarmerRow = {
  id: string;
  farmerId: string;
  name: string;
  mobile: string;
  zone: string | null;
  farmingMethod: null;
  kyc: AdminFarmerKycStatus;
  certification: null;
  rating: number | null;
  status: AdminFarmerAccountStatus;
  actions: null;
};

type KpiTone = 'amber' | 'success' | 'warning' | 'neutral' | 'danger';

interface Kpi {
  label: string;
  icon: string;
  tone: KpiTone;
  value: (s: AdminFarmerSummary) => number;
}

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_BADGE: Record<AdminFarmerAccountStatus, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: S.STATUS_ACTIVE, tone: 'success' },
  PENDING: { label: S.STATUS_PENDING, tone: 'warning' },
  DISABLED: { label: S.STATUS_DISABLED, tone: 'neutral' },
};

const KYC_BADGE: Record<AdminFarmerKycStatus, { label: string; tone: BadgeTone }> = {
  VERIFIED: { label: S.KYC_VERIFIED, tone: 'success' },
  PENDING: { label: S.KYC_PENDING, tone: 'warning' },
  REJECTED: { label: S.KYC_REJECTED, tone: 'danger' },
};

/** "+919876543210" → "98765 43210"; anything else is shown as received. */
function formatMobile(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `${m[1]} ${m[2]}` : e164;
}

function toRow(item: AdminFarmerListItem): FarmerRow {
  return {
    id: item.id,
    farmerId: item.tohfaFarmerId,
    name: item.fullName,
    mobile: formatMobile(item.mobile),
    zone: item.zone?.name ?? null,
    farmingMethod: null,
    kyc: item.kycStatus,
    certification: null,
    rating: item.overallRating,
    status: item.accountStatus,
    actions: null,
  };
}

@Component({
  selector: 'tohfa-farmer-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataTableComponent, DataTableCellDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--space-18);
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .icon {
        font-size: var(--icon-btn);
      }

      /* ---------- Page header ---------- */
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-16);
      }
      .page-title {
        margin: 0 0 var(--space-6);
        font-size: var(--fs-page);
        font-weight: var(--fw-xbold);
        line-height: 1.2;
      }
      .breadcrumb {
        display: flex;
        gap: var(--space-4);
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
      }
      .breadcrumb a {
        color: inherit;
        text-decoration: none;
      }
      .breadcrumb a:hover {
        color: var(--tohfa-amber);
      }
      .header-actions {
        display: flex;
        gap: var(--space-10);
      }
      .header-actions .tohfa-btn-secondary {
        color: var(--tohfa-ink);
      }

      /* ---------- KPI row ---------- */
      .kpis {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: var(--space-14);
      }
      .kpi-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-8);
      }
      .kpi-card .tohfa-kpi-label {
        font-size: var(--fs-dense);
        padding-top: var(--space-6);
      }
      .kpi-card .tohfa-kpi-val {
        margin: var(--space-14) 0 var(--space-4);
      }
      .tohfa-kpi-chip .icon {
        font-size: var(--icon-kpi-chip);
      }
      .tone-amber {
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-amber);
      }
      .tone-success {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .tone-warning {
        background: var(--warn-bg);
        color: var(--warn);
      }
      .tone-neutral {
        background: var(--neutral-status-bg);
        color: var(--neutral-status);
      }
      .tone-danger {
        background: var(--err-bg);
        color: var(--err);
      }

      /* ---------- Quick actions ---------- */
      .section-title {
        margin: 0 0 var(--space-14);
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .quick-actions {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--space-10);
      }
      .qa-tile {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-8);
        padding: var(--space-14);
        min-height: 72px;
        background: var(--tohfa-surface);
        border: var(--border-card);
        border-radius: var(--r-md);
        color: var(--tohfa-ink);
        font-family: var(--font);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        text-decoration: none;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease;
      }
      .qa-tile:hover {
        background: var(--tohfa-page);
        border-color: var(--tohfa-amber-border);
      }
      .qa-tile:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .qa-tile .icon {
        color: var(--tohfa-amber);
        font-size: var(--icon-nav);
      }
      [aria-disabled='true'] {
        cursor: default;
      }

      /* ---------- Filters ---------- */
      .filters {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-10);
      }
      .search {
        position: relative;
        flex: 1 1 260px;
        max-width: 345px;
      }
      .search .icon {
        position: absolute;
        left: var(--space-14);
        top: 50%;
        transform: translateY(-50%);
        color: var(--tohfa-muted);
        font-size: var(--icon-input);
        pointer-events: none;
      }
      .search .tohfa-input {
        padding: var(--space-10) var(--space-14) var(--space-10) 38px;
        border-radius: var(--r-md);
      }
      .filter-pill {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-10) var(--space-12) var(--space-10) var(--space-14);
        background: var(--tohfa-surface);
        border: var(--border-input);
        border-radius: var(--r-md);
        font-size: var(--fs-cell);
        font-weight: var(--fw-semi);
        color: var(--tohfa-ink);
        cursor: pointer;
      }
      .filter-pill:focus-within {
        border-color: var(--tohfa-amber);
        box-shadow: var(--tohfa-focus-ring);
      }
      .filter-pill select {
        appearance: none;
        border: none;
        background: transparent;
        font: inherit;
        color: inherit;
        padding: 0;
        outline: none;
        cursor: inherit;
      }
      .filter-pill .icon {
        font-size: var(--icon-chevron);
        color: var(--tohfa-slate);
      }
      .filter-pill.locked {
        cursor: not-allowed;
      }
      .clear-filters {
        border: none;
        background: none;
        padding: 0 var(--space-4);
        color: var(--tohfa-brown);
        font-family: var(--font);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .clear-filters:hover {
        color: var(--tohfa-brown-deep);
      }

      /* ---------- Table cells ---------- */
      .strong {
        font-weight: var(--fw-bold);
      }
      .row-actions {
        display: inline-flex;
        gap: var(--space-8);
      }
      .row-actions button {
        display: inline-flex;
        padding: 0;
        border: none;
        background: none;
        color: var(--tohfa-slate);
        cursor: default;
      }
      .row-actions a {
        display: inline-flex;
        color: var(--tohfa-slate);
        border-radius: var(--r-xs);
      }
      .row-actions a:hover,
      .name-link:hover {
        color: var(--tohfa-amber);
      }
      .row-actions a:focus-visible,
      .name-link:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .row-actions .icon {
        font-size: var(--icon-nav);
      }
      .name-link {
        color: inherit;
        text-decoration: none;
        border-radius: var(--r-xs);
      }
      .error {
        margin: 0;
      }
    `,
  ],
  template: `
    <!-- Page header -->
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ S.TITLE }}</h1>
        <nav class="breadcrumb" aria-label="breadcrumb">
          <a routerLink="/dashboard">{{ S.BREADCRUMB_DASHBOARD }}</a>
          <span>/</span>
          <span>{{ S.BREADCRUMB_MODULE }}</span>
          <span>/</span>
          <span>{{ S.BREADCRUMB_CURRENT }}</span>
        </nav>
      </div>
      <div class="header-actions">
        <button type="button" class="tohfa-btn tohfa-btn-secondary" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET">
          <span class="material-symbols-outlined icon">download</span>{{ S.BTN_EXPORT }}
        </button>
      </div>
    </header>

    <!-- KPI cards -->
    <section class="kpis">
      <div class="tohfa-kpi-card kpi-card" *ngFor="let kpi of kpis">
        <div class="kpi-top">
          <span class="tohfa-kpi-label">{{ kpi.label }}</span>
          <span class="tohfa-kpi-chip tone-{{ kpi.tone }}">
            <span class="material-symbols-outlined icon">{{ kpi.icon }}</span>
          </span>
        </div>
        <div class="tohfa-kpi-val">{{ summary() ? kpi.value(summary()!) : '—' }}</div>
      </div>
    </section>

    <!-- Quick actions -->
    <section class="tohfa-card">
      <h2 class="section-title">{{ S.QUICK_ACTIONS }}</h2>
      <div class="quick-actions">
        <a class="qa-tile" routerLink="/farmers/farm-records">
          <span class="material-symbols-outlined icon" aria-hidden="true">description</span>{{ S.QA_FARM_RECORDS }}
        </a>
        <a class="qa-tile" routerLink="/approvals">
          <span class="material-symbols-outlined icon">shield</span>{{ S.QA_APPROVALS_INBOX }}
        </a>
        <a class="qa-tile" routerLink="/farmer-applications">
          <span class="material-symbols-outlined icon">person</span>{{ S.QA_FARMERS_APPLICATIONS }}
        </a>
        <a *ngIf="canCreate()" class="qa-tile" routerLink="/farmers/new">
          <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.QA_ADD_FARMER }}
        </a>
      </div>
    </section>

    <!-- Filters -->
    <section class="tohfa-card filters">
      <label class="search">
        <span class="material-symbols-outlined icon">search</span>
        <input
          class="tohfa-input"
          type="search"
          maxlength="100"
          [placeholder]="S.SEARCH_PLACEHOLDER"
          [ngModel]="search()"
          (ngModelChange)="onSearch($event)"
        />
      </label>

      <label class="filter-pill">
        <span>{{ S.FILTER_ZONE }}</span>
        <select [ngModel]="zoneId()" (ngModelChange)="setZone($event)">
          <option value="">{{ S.FILTER_ALL }}</option>
          <option *ngFor="let z of summary()?.zones ?? []" [value]="z.id">{{ z.name }}</option>
        </select>
        <span class="material-symbols-outlined icon">expand_more</span>
      </label>

      <label class="filter-pill">
        <span>{{ S.FILTER_STATUS }}</span>
        <select [ngModel]="status()" (ngModelChange)="setStatus($event)">
          <option value="">{{ S.FILTER_ALL }}</option>
          <option *ngFor="let s of statusOptions" [value]="s.value">{{ s.label }}</option>
        </select>
        <span class="material-symbols-outlined icon">expand_more</span>
      </label>

      <label class="filter-pill locked" *ngFor="let f of unsupportedFilters" [title]="S.FILTER_NOT_IN_SPEC">
        <span>{{ f }}</span>
        <select disabled>
          <option>{{ S.FILTER_ALL }}</option>
        </select>
        <span class="material-symbols-outlined icon">expand_more</span>
      </label>

      <button type="button" class="clear-filters" (click)="clearFilters()">{{ S.CLEAR_FILTERS }}</button>
    </section>

    <p class="tohfa-banner tohfa-banner-danger error" *ngIf="loadError()" role="alert">{{ S.LOAD_ERROR }}</p>

    <!-- Directory table -->
    <tohfa-data-table
      [columns]="columns"
      [rows]="rows()"
      [total]="null"
      [hasMore]="hasMore()"
      [page]="page()"
      [pageSize]="pageSize"
      [emptyMessage]="S.EMPTY"
      [footerLabel]="footerLabel()"
      [prevLabel]="S.PREV"
      [nextLabel]="S.NEXT"
      (pageChange)="goToPage($event)"
    >
      <ng-template tohfaCell="farmerId" let-row>
        <span class="strong">{{ row.farmerId }}</span>
      </ng-template>
      <ng-template tohfaCell="name" let-row>
        <a class="name-link" [routerLink]="['/farmers', row.id]">{{ row.name }}</a>
      </ng-template>
      <ng-template tohfaCell="kyc" let-row>
        <span class="tohfa-badge tohfa-badge-{{ kycBadge(row).tone }}">{{ kycBadge(row).label }}</span>
      </ng-template>
      <ng-template tohfaCell="rating" let-row>
        <span class="strong" *ngIf="row.rating !== null; else noRating">
          {{ row.rating | number: '1.0-1' }}{{ S.RATING_SUFFIX }}
        </span>
        <ng-template #noRating>—</ng-template>
      </ng-template>
      <ng-template tohfaCell="status" let-row>
        <span class="tohfa-badge tohfa-badge-{{ statusBadge(row).tone }}">{{ statusBadge(row).label }}</span>
      </ng-template>
      <ng-template tohfaCell="actions" let-row>
        <span class="row-actions">
          <a [routerLink]="['/farmers', row.id]" [title]="S.ACTION_VIEW" [attr.aria-label]="S.ACTION_VIEW">
            <span class="material-symbols-outlined icon">visibility</span>
          </a>
          <a
            *ngIf="canEdit(); else editDisabled"
            [routerLink]="['/farmers', row.id, 'edit']"
            [title]="S.ACTION_EDIT"
            [attr.aria-label]="S.ACTION_EDIT"
          >
            <span class="material-symbols-outlined icon">edit</span>
          </a>
          <ng-template #editDisabled>
            <button type="button" aria-disabled="true" [title]="S.ACTION_EDIT_NOT_PERMITTED" [attr.aria-label]="S.ACTION_EDIT">
              <span class="material-symbols-outlined icon">edit</span>
            </button>
          </ng-template>
          <button type="button" aria-disabled="true" [title]="S.ACTION_MORE" [attr.aria-label]="S.ACTION_MORE">
            <span class="material-symbols-outlined icon">more_vert</span>
          </button>
        </span>
      </ng-template>
    </tohfa-data-table>
  `,
})
export class FarmerDirectoryComponent implements OnInit {
  private readonly service = inject(FarmersService);
  private readonly rbac = inject(RbacService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchInput = new Subject<string>();

  readonly S = S;
  readonly pageSize = PAGE_SIZE;

  /** POST /admin/farmers (createAdminFarmer) is guarded by `farmer.profile.edit`; there is no separate create code. */
  readonly canCreate = computed(() => this.rbac.can('farmer.profile.edit'));
  /** PATCH /admin/farmers/{id} — the row pencil opens Edit Farmer Profile. */
  readonly canEdit = computed(() => this.rbac.can('farmer.profile.edit'));

  readonly kpis: readonly Kpi[] = [
    { label: S.KPI_TOTAL, icon: 'groups', tone: 'amber', value: (s) => s.totalFarmers },
    { label: S.KPI_ACTIVE, icon: 'verified', tone: 'success', value: (s) => s.activeFarmers },
    { label: S.KPI_PENDING_APPLICATIONS, icon: 'pending_actions', tone: 'warning', value: (s) => s.pendingApplications },
    { label: S.KPI_INACTIVE, icon: 'person_off', tone: 'neutral', value: (s) => s.inactiveFarmers },
    { label: S.KPI_EXPIRED_CERTIFICATIONS, icon: 'error', tone: 'danger', value: (s) => s.expiredCertifications },
  ];

  readonly columns: readonly Column[] = [
    { key: 'farmerId', header: S.COL_FARMER_ID },
    { key: 'name', header: S.COL_FARMER_NAME },
    { key: 'mobile', header: S.COL_MOBILE },
    { key: 'zone', header: S.COL_ZONE },
    { key: 'farmingMethod', header: S.COL_FARMING_METHOD },
    { key: 'kyc', header: S.COL_KYC },
    { key: 'certification', header: S.COL_CERTIFICATION },
    { key: 'rating', header: S.COL_RATING },
    { key: 'status', header: S.COL_STATUS },
    { key: 'actions', header: S.COL_ACTIONS },
  ];

  readonly statusOptions = (Object.keys(STATUS_BADGE) as AdminFarmerAccountStatus[]).map((value) => ({
    value,
    label: STATUS_BADGE[value].label,
  }));

  readonly unsupportedFilters = [S.FILTER_FARMING_METHOD, S.FILTER_KYC, S.FILTER_CERTIFICATION];

  readonly summary = signal<AdminFarmerSummary | null>(null);
  readonly rows = signal<FarmerRow[]>([]);
  readonly hasMore = signal(false);
  readonly page = signal(1);
  readonly loadError = signal(false);

  readonly search = signal('');
  readonly zoneId = signal('');
  readonly status = signal<AdminFarmerAccountStatus | ''>('');

  /** cursors[i] fetches page i + 1; page 1 has no cursor. */
  private cursors: Array<string | undefined> = [undefined];

  readonly footerLabel = computed(() => {
    const count = this.rows().length;
    if (count === 0) return '';
    const first = (this.page() - 1) * this.pageSize + 1;
    const filtered = this.search().trim() !== '' || this.zoneId() !== '' || this.status() !== '';
    // The list endpoint reports no total; the summary's total is only true of the unfiltered list.
    const total = filtered ? null : (this.summary()?.totalFarmers ?? null);
    return S.showing(first, first + count - 1, total);
  });

  ngOnInit(): void {
    this.service.summary().subscribe({
      next: (s) => this.summary.set(s),
      error: () => this.summary.set(null),
    });

    this.searchInput
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());

    this.reload();
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.searchInput.next(value.trim());
  }

  setZone(value: string): void {
    this.zoneId.set(value);
    this.reload();
  }

  setStatus(value: AdminFarmerAccountStatus | ''): void {
    this.status.set(value);
    this.reload();
  }

  clearFilters(): void {
    this.search.set('');
    this.searchInput.next('');
    this.zoneId.set('');
    this.status.set('');
    this.reload();
  }

  goToPage(page: number): void {
    // Only pages whose cursor we hold are reachable; the table only offers those.
    if (page < 1 || page > this.cursors.length) return;
    this.fetch(page);
  }

  kycBadge(row: Row): { label: string; tone: BadgeTone } {
    return KYC_BADGE[(row as FarmerRow).kyc];
  }

  statusBadge(row: Row): { label: string; tone: BadgeTone } {
    return STATUS_BADGE[(row as FarmerRow).status];
  }

  private reload(): void {
    this.cursors = [undefined];
    this.fetch(1);
  }

  private fetch(page: number): void {
    const query: AdminFarmerListQuery = { limit: this.pageSize };
    const q = this.search().trim();
    const cursor = this.cursors[page - 1];
    const zoneId = this.zoneId();
    const status = this.status();
    if (q !== '') query.q = q;
    if (zoneId !== '') query.zoneId = zoneId;
    if (status !== '') query.status = status;
    if (cursor !== undefined) query.cursor = cursor;

    this.service.list(query).subscribe({
      next: (res) => {
        this.loadError.set(false);
        this.rows.set(res.items.map(toRow));
        this.page.set(page);
        this.hasMore.set(res.page.hasMore);
        this.cursors = this.cursors.slice(0, page);
        if (res.page.hasMore && res.page.nextCursor !== null) this.cursors.push(res.page.nextCursor);
      },
      error: () => {
        this.loadError.set(true);
        this.rows.set([]);
        this.hasMore.set(false);
      },
    });
  }
}
