/**
 * Farmers Management → Farm Records (list). Reached from the Farmer Directory's "Farm Records" quick
 * action.
 *
 * UI ONLY. docs/openapi.yaml has no farm-records list endpoint, so the rows are the approved design's
 * placeholder data (farm-records.mock.ts) and search / Status / Zone filter and page client-side. When
 * integrated, filtering and paging move to the API and this screen stops filtering for anything but
 * convenience (see apps/admin-web/CLAUDE.md "Data tables and scope").
 *
 * Inert by design (no screen exists for them yet): the "Filter" button, the eye (view) icon and the
 * kebab (more actions) icon.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  DataTableCellDirective,
  DataTableComponent,
  type Column,
  type Row,
} from '../../shared/data-table/data-table.component';
import {
  FARM_RECORDS_MOCK,
  FARM_RECORDS_PAGE_SIZE,
  FARM_RECORD_ZONES,
  type FarmRecordRow,
  type FarmRecordStatus,
} from './farm-records.mock';
import { FARM_RECORDS_STRINGS as S } from './farm-records.strings';

type BadgeTone = 'success' | 'neutral';

const STATUS_BADGE: Record<FarmRecordStatus, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: S.STATUS_ACTIVE, tone: 'success' },
  INACTIVE: { label: S.STATUS_INACTIVE, tone: 'neutral' },
};

/** Farmer "Ramesh Kumar" → "RK", "Kumar" → "K" — the design's avatar letters come from the farmer's name. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();
}

@Component({
  selector: 'tohfa-farm-records-list',
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
        font-size: var(--fs-title);
        font-weight: var(--fw-xbold);
        line-height: 1.2;
      }
      .subtitle {
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .add-link {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
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
        flex: 1 1 calc(var(--space-32) * 8);
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
        padding: var(--space-10) var(--space-14) var(--space-10)
          calc(var(--space-14) + var(--icon-input) + var(--space-6));
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
      .filter-btn {
        min-height: calc(var(--space-20) * 2);
        color: var(--tohfa-amber);
        font-size: var(--fs-cell);
        cursor: default;
      }
      .filter-btn .icon {
        font-size: var(--icon-filter);
      }

      .count {
        margin: 0;
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
      }

      /* ---------- Table cells ---------- */
      .farm {
        display: inline-flex;
        align-items: center;
        gap: var(--space-10);
        font-weight: var(--fw-bold);
        white-space: normal;
      }
      .avatar {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-12) * 2);
        height: calc(var(--space-12) * 2);
        border-radius: var(--r-circle);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-badge);
        font-weight: var(--fw-xbold);
      }
      .status-dot {
        display: inline-block;
        width: var(--space-6);
        height: var(--space-6);
        margin-right: var(--space-4);
        border-radius: var(--r-circle);
        background: currentColor;
      }
      .row-actions {
        display: inline-flex;
        gap: var(--space-8);
      }
      .row-actions button {
        display: inline-flex;
        padding: 0;
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--tohfa-slate);
        cursor: default;
      }
      .row-actions button:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .row-actions .icon {
        font-size: var(--icon-nav);
      }
      /* One frame around the shared table (rows) plus this component's footer. */
      .table-wrap {
        background: var(--tohfa-surface);
        border: var(--border-card);
        border-radius: var(--r-card);
        overflow: hidden;
      }
      .table-wrap ::ng-deep .table-card {
        border: none;
        border-radius: 0;
      }
      /* Footer + pager: same look as shared/data-table. */
      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-16);
        border-top: var(--border-divider);
        background: var(--tohfa-surface);
      }
      .range {
        color: var(--tohfa-slate);
        font-size: var(--fs-dense);
      }
      .pager {
        display: flex;
        align-items: center;
        gap: var(--space-6);
      }
      .pager button {
        box-sizing: border-box;
        min-width: 30px;
        height: 30px;
        padding: 0 var(--space-12);
        line-height: 1;
        border: var(--border-card);
        border-radius: var(--tohfa-radius-button);
        background: var(--tohfa-surface);
        color: var(--tohfa-slate);
        font-family: var(--font);
        font-size: var(--fs-dense);
        font-weight: var(--fw-medium);
        cursor: pointer;
      }
      .pager button:hover:not([disabled]):not(.active) {
        background: var(--tohfa-page);
        color: var(--tohfa-ink);
      }
      .pager button.active {
        background: var(--tohfa-amber);
        border-color: var(--tohfa-amber);
        color: var(--tohfa-neutral-white);
        font-weight: var(--fw-bold);
      }
      .pager button[disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .pager button:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }
    `,
  ],
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ S.LIST_TITLE }}</h1>
        <p class="subtitle">{{ S.LIST_SUBTITLE }}</p>
      </div>
      <a class="tohfa-btn tohfa-btn-primary add-link" routerLink="/farmers/farm-records/new">
        <span class="material-symbols-outlined icon" aria-hidden="true">add</span
        >{{ S.BTN_ADD_FARM_RECORDS }}
      </a>
    </header>

    <section class="tohfa-card filters" [attr.aria-label]="S.SEARCH_LABEL">
      <label class="search">
        <span class="material-symbols-outlined icon" aria-hidden="true">search</span>
        <span class="sr-only">{{ S.SEARCH_LABEL }}</span>
        <input
          class="tohfa-input"
          type="search"
          maxlength="100"
          [placeholder]="S.SEARCH_PLACEHOLDER"
          [ngModel]="search()"
          (ngModelChange)="setSearch($event)"
        />
      </label>

      <label class="filter-pill">
        <span>{{ S.FILTER_STATUS }}</span>
        <select [ngModel]="status()" (ngModelChange)="setStatus($event)">
          <option value="">{{ S.FILTER_ALL }}</option>
          <option *ngFor="let s of statusOptions" [value]="s.value">{{ s.label }}</option>
        </select>
        <span class="material-symbols-outlined icon" aria-hidden="true">expand_more</span>
      </label>

      <label class="filter-pill">
        <span>{{ S.FILTER_ZONE }}</span>
        <select [ngModel]="zone()" (ngModelChange)="setZone($event)">
          <option value="">{{ S.FILTER_ALL }}</option>
          <option *ngFor="let z of zones" [value]="z">{{ z }}</option>
        </select>
        <span class="material-symbols-outlined icon" aria-hidden="true">expand_more</span>
      </label>

      <!-- Inert: the design has no advanced-filter panel yet. -->
      <button
        type="button"
        class="tohfa-btn tohfa-btn-outline-amber filter-btn"
        aria-disabled="true"
        [title]="S.NOT_AVAILABLE_YET"
      >
        <span class="material-symbols-outlined icon" aria-hidden="true">filter_alt</span
        >{{ S.BTN_FILTER }}
      </button>
    </section>

    <p class="count" aria-live="polite">{{ S.recordCount(filtered().length) }}</p>

    <!-- The shared table renders rows only (its footer stays hidden because total <= pageSize and no
         footerLabel is passed); the footer below always shows the pager, even for a single page. -->
    <div class="table-wrap">
      <tohfa-data-table
        [columns]="columns"
        [rows]="pageRows()"
        [total]="pageRows().length"
        [page]="1"
        [pageSize]="pageSize"
        [emptyMessage]="S.EMPTY"
      >
        <ng-template tohfaCell="farmName" let-row>
          <span class="farm">
            <span class="avatar" aria-hidden="true">{{ initialsOf(row) }}</span
            >{{ row.farmName }}
          </span>
        </ng-template>
        <ng-template tohfaCell="landAreaAcres" let-row>{{
          S.acres(row.landAreaAcres)
        }}</ng-template>
        <ng-template tohfaCell="status" let-row>
          <span class="tohfa-badge tohfa-badge-{{ statusBadge(row).tone }}">
            <span class="status-dot" aria-hidden="true"></span>{{ statusBadge(row).label }}
          </span>
        </ng-template>
        <ng-template tohfaCell="actions" let-row>
          <!-- Inert: no farm-record detail screen or action menu exists yet. -->
          <span class="row-actions">
            <button
              type="button"
              aria-disabled="true"
              [title]="S.ACTION_VIEW"
              [attr.aria-label]="S.ACTION_VIEW"
            >
              <span class="material-symbols-outlined icon" aria-hidden="true">visibility</span>
            </button>
            <button
              type="button"
              aria-disabled="true"
              [title]="S.ACTION_MORE"
              [attr.aria-label]="S.ACTION_MORE"
            >
              <span class="material-symbols-outlined icon" aria-hidden="true">more_vert</span>
            </button>
          </span>
        </ng-template>
      </tohfa-data-table>

      <div class="footer">
        <span class="range">{{ footerLabel() }}</span>
        <div class="pager">
          <button type="button" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">
            {{ S.PREV }}
          </button>
          <button type="button" class="active" aria-current="page">{{ page() }}</button>
          <button type="button" [disabled]="page() >= lastPage()" (click)="goToPage(page() + 1)">
            {{ S.NEXT }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class FarmRecordsListComponent {
  readonly S = S;
  readonly pageSize = FARM_RECORDS_PAGE_SIZE;
  readonly zones = FARM_RECORD_ZONES;

  readonly statusOptions = (Object.keys(STATUS_BADGE) as FarmRecordStatus[]).map((value) => ({
    value,
    label: STATUS_BADGE[value].label,
  }));

  readonly columns: readonly Column[] = [
    { key: 'farmName', header: S.COL_FARM_NAME },
    { key: 'farmerName', header: S.COL_FARMER },
    { key: 'farmerCode', header: S.COL_FARMER_ID },
    { key: 'mobile', header: S.COL_MOBILE },
    { key: 'location', header: S.COL_LOCATION },
    { key: 'farmingType', header: S.COL_FARMING_TYPE },
    { key: 'landAreaAcres', header: S.COL_LAND_AREA },
    { key: 'status', header: S.COL_STATUS },
    { key: 'actions', header: S.COL_ACTIONS },
  ];

  readonly search = signal('');
  readonly status = signal<FarmRecordStatus | ''>('');
  readonly zone = signal('');
  readonly page = signal(1);

  readonly filtered = computed<readonly FarmRecordRow[]>(() => {
    const q = this.search().trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    const status = this.status();
    const zone = this.zone();
    return FARM_RECORDS_MOCK.filter((r) => {
      if (status !== '' && r.status !== status) return false;
      if (zone !== '' && r.location !== zone) return false;
      if (q === '') return true;
      return (
        r.farmName.toLowerCase().includes(q) ||
        r.farmerCode.toLowerCase().includes(q) ||
        // Mobile matches on digits so "90000 20003", "9000020003" and "+91 90000…" all work.
        (digits !== '' && r.mobile.replace(/\D/g, '').includes(digits))
      );
    });
  });

  readonly lastPage = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );

  readonly pageRows = computed<readonly Row[]>(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered()
      .slice(start, start + this.pageSize)
      .map((r) => ({ ...r, actions: null }));
  });

  readonly footerLabel = computed(() => {
    const total = this.filtered().length;
    const first = total === 0 ? 0 : (this.page() - 1) * this.pageSize + 1;
    const last = Math.min(this.page() * this.pageSize, total);
    return S.showing(first, last, total);
  });

  goToPage(p: number): void {
    this.page.set(Math.min(Math.max(1, p), this.lastPage()));
  }

  setSearch(value: string | null): void {
    this.search.set(value ?? '');
    this.page.set(1);
  }

  setStatus(value: FarmRecordStatus | ''): void {
    this.status.set(value);
    this.page.set(1);
  }

  setZone(value: string): void {
    this.zone.set(value);
    this.page.set(1);
  }

  initialsOf(row: Row): string {
    return initials((row as unknown as FarmRecordRow).farmerName);
  }

  statusBadge(row: Row): { label: string; tone: BadgeTone } {
    return STATUS_BADGE[(row as unknown as FarmRecordRow).status];
  }
}
