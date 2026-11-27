/**
 * Audit Management → Audit History (design 96). UI ONLY.
 *
 * Rows are placeholder data (audit-history.mock.ts). Search, the Audit Type / Zone / Date range /
 * Result filters, column sorting and paging all run client-side. When integrated they become query
 * parameters of `GET /admin/audits` (status COMPLETED) and this screen filters for convenience only
 * (apps/admin-web/CLAUDE.md "Data tables and scope"). An optional `?q=` query parameter pre-fills the
 * search (the Report Details screen links farmer names here).
 *
 * The table is drawn here rather than with `<tohfa-data-table>` because the shared table has no
 * sortable headers and this change is limited to new files. Follow-up: add sorting (with aria-sort)
 * to shared/data-table and move this table onto it.
 *
 * Links: Audit ID and "View" → AUDIT_ROUTES.detail(id).
 * Inert (no design for the output): Export and the per-row download icon.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatAuditDate, formatAuditDateLong } from './audit-format';
import {
  AUDIT_HISTORY_DEFAULT_PAGE_SIZE,
  AUDIT_HISTORY_MOCK,
  AUDIT_HISTORY_PAGE_SIZES,
  AUDIT_HISTORY_SCORE_MAX,
  AUDIT_HISTORY_SCORE_PILL_THRESHOLD,
  type AuditHistoryRow,
} from './audit-history.mock';
import { AUDIT_HISTORY_STRINGS as L } from './audit-history.strings';
import { AUDIT_ROUTES } from './audit-nav';
import { AUDIT_STATUS_META, AUDIT_TYPE_LABEL, auditStatusPillClass, auditToneClass } from './audit-presentation';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AUDIT_TYPES, AUDIT_ZONES } from './audit.mock';
import type { AuditTone, AuditType, AuditZone } from './audit.types';

type SortKey = 'id' | 'farmer' | 'farmZone' | 'type' | 'date' | 'major' | 'minor' | 'score' | 'status';
type SortDir = 'asc' | 'desc';
type ResultFilter = '' | 'AT_OR_ABOVE' | 'BELOW' | 'FINDINGS' | 'NO_FINDINGS';

interface SortableColumn {
  readonly key: SortKey;
  readonly header: string;
  readonly align: 'left' | 'center';
}

interface HistoryKpi {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  /** Card tint; `null` = plain white card. */
  readonly tint: AuditTone | null;
  readonly iconTone: AuditTone | 'amber';
}

/** Sort value per column. Strings compare with localeCompare, numbers numerically. */
const SORT_VALUE: Readonly<Record<SortKey, (r: AuditHistoryRow) => string | number>> = {
  id: (r) => r.id,
  farmer: (r) => r.farmerName,
  farmZone: (r) => `${r.farmName} ${r.zone}`,
  type: (r) => AUDIT_TYPE_LABEL[r.type],
  // ISO days sort correctly as strings.
  date: (r) => r.auditDate,
  major: (r) => r.majorFindings,
  minor: (r) => r.minorFindings,
  score: (r) => r.score,
  status: (r) => AUDIT_STATUS_META[r.status].label,
};

function hasFindings(r: AuditHistoryRow): boolean {
  return r.majorFindings + r.minorFindings > 0;
}

@Component({
  selector: 'tohfa-audit-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    `
      .filter-card {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: var(--space-12);
        padding: var(--space-16);
        background: var(--tohfa-surface);
        border: var(--border-card);
        border-radius: var(--r-card);
      }
      .filter-card .audit-search {
        flex: 2 1 calc(var(--space-32) * 7);
      }
      .filter-card .audit-search .tohfa-input {
        width: 100%;
        min-height: var(--tohfa-min-touch-target);
      }
      .filter-field {
        flex: 1 1 calc(var(--space-32) * 4);
      }
      .filter-actions {
        display: flex;
        gap: var(--space-10);
      }
      .date-range {
        position: relative;
      }
      .date-btn {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        text-align: left;
        cursor: pointer;
      }
      .date-btn .date-text {
        flex: 1;
        color: var(--tohfa-muted);
      }
      .date-btn.active .date-text {
        color: var(--tohfa-ink);
      }
      .date-btn .material-symbols-outlined {
        font-size: var(--icon-input);
        color: var(--tohfa-slate);
      }
      .date-popover {
        position: absolute;
        top: calc(100% + var(--space-6));
        left: 0;
        z-index: 10;
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
        width: calc(var(--space-32) * 8);
        padding: var(--space-14);
        background: var(--tohfa-surface);
        border: var(--border-card);
        border-radius: var(--r-md);
        box-shadow: var(--shadow-dialog);
      }
      .date-popover-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-8);
      }
      .reset-btn,
      .export-btn {
        min-height: var(--tohfa-min-touch-target);
      }
      .export-btn {
        cursor: default;
      }

      .kpi-row {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--space-12);
      }
      .kpi {
        display: flex;
        align-items: flex-start;
        gap: var(--space-12);
        padding: var(--space-18);
        background: var(--tohfa-surface);
        border: var(--border-card);
        border-radius: var(--r-card);
      }
      .kpi.tone-bg-success {
        background: var(--ok-bg);
        border-color: var(--ok-bd);
      }
      .kpi.tone-bg-danger {
        background: var(--err-bg);
        border-color: var(--err-bd);
      }
      .kpi-icon {
        font-size: var(--icon-dialog-close);
      }
      .kpi-text {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }
      .kpi-label {
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
      }
      .kpi.tone-bg-danger .kpi-label {
        color: var(--err);
      }
      .kpi:not(.tone-bg-danger) .kpi-label {
        color: var(--tohfa-ink);
      }

      .table-scroll {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-family: var(--font);
      }
      th,
      td {
        padding: var(--space-12) var(--space-14);
        text-align: left;
        white-space: nowrap;
      }
      th {
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-badge);
        font-weight: var(--fw-xbold);
      }
      th.center,
      td.center {
        text-align: center;
      }
      td {
        border-bottom: var(--border-divider);
        color: var(--tohfa-ink);
        font-size: var(--fs-dense);
        vertical-align: middle;
      }
      tbody tr:last-child td {
        border-bottom: none;
      }
      tbody tr:hover td {
        background: var(--tohfa-page);
      }
      .sort-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        padding: 0;
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: inherit;
        font: inherit;
        cursor: pointer;
      }
      .sort-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .sort-btn .material-symbols-outlined {
        font-size: var(--icon-row-action);
        color: var(--tohfa-slate);
      }
      .sort-btn.sorted .material-symbols-outlined {
        color: var(--tohfa-amber);
      }
      .id-link,
      .view-link {
        color: var(--info);
        font-weight: var(--fw-bold);
        text-decoration: none;
      }
      .id-link:hover,
      .view-link:hover {
        text-decoration: underline;
      }
      .id-link:focus-visible,
      .view-link:focus-visible,
      .download-btn:focus-visible {
        outline: none;
        border-radius: var(--r-xs);
        box-shadow: var(--tohfa-focus-ring);
      }
      .farmer-cell {
        font-weight: var(--fw-bold);
      }
      .farm-cell {
        color: var(--tohfa-slate);
      }
      .num-cell {
        font-weight: var(--fw-bold);
      }
      .status-pill .material-symbols-outlined {
        font-size: var(--icon-row-action);
      }
      .row-actions {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
      }
      .row-sep {
        color: var(--info);
        font-weight: var(--fw-bold);
      }
      .download-btn {
        display: inline-flex;
        padding: 0;
        border: none;
        background: none;
        color: var(--info);
        cursor: default;
      }
      .download-btn .material-symbols-outlined {
        font-size: var(--icon-row-action);
      }
      .empty {
        padding: var(--space-24);
        text-align: center;
        color: var(--tohfa-slate);
      }

      .history-footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
      }
      .history-footer .audit-table-range {
        font-weight: var(--fw-semi);
      }
      .footer-right {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-16);
      }
      .rows-per-page {
        display: inline-flex;
        align-items: center;
        gap: var(--space-8);
        font-size: var(--fs-dense);
        color: var(--tohfa-ink);
      }
      .rows-per-page .audit-select-wrap select.audit-control {
        min-height: calc(var(--space-15) * 2);
        padding-top: var(--space-4);
        padding-bottom: var(--space-4);
        font-size: var(--fs-dense);
      }
      .audit-pager button .material-symbols-outlined {
        font-size: var(--icon-chevron);
        vertical-align: middle;
      }

      @media (max-width: 900px) {
        .kpi-row {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `,
  ],
  template: `
    <header class="audit-page-header">
      <div>
        <div class="audit-title-row">
          <span class="audit-title-tile" aria-hidden="true">
            <span class="material-symbols-outlined">history</span>
          </span>
          <h1 class="audit-title">{{ L.TITLE }}</h1>
        </div>
        <p class="audit-subtitle">{{ L.SUBTITLE }}</p>
      </div>
    </header>

    <section class="filter-card" [attr.aria-label]="L.FILTERS_REGION">
      <label class="audit-search">
        <span class="material-symbols-outlined" aria-hidden="true">search</span>
        <span class="sr-only">{{ L.SEARCH_LABEL }}</span>
        <input
          class="tohfa-input"
          type="search"
          maxlength="100"
          [placeholder]="L.SEARCH_PLACEHOLDER"
          [ngModel]="search()"
          (ngModelChange)="setSearch($event)"
        />
      </label>

      <label class="audit-field filter-field">
        <span class="audit-label">{{ L.FILTER_TYPE }}</span>
        <span class="audit-select-wrap">
          <select class="audit-control" [ngModel]="type()" (ngModelChange)="setFilter(type, $event)">
            <option value="">{{ L.ALL }}</option>
            <option *ngFor="let t of types" [value]="t">{{ typeLabels[t] }}</option>
          </select>
        </span>
      </label>

      <label class="audit-field filter-field">
        <span class="audit-label">{{ L.FILTER_ZONE }}</span>
        <span class="audit-select-wrap">
          <select class="audit-control" [ngModel]="zone()" (ngModelChange)="setFilter(zone, $event)">
            <option value="">{{ L.ALL_ZONES }}</option>
            <option *ngFor="let z of zones" [value]="z">{{ z }}</option>
          </select>
        </span>
      </label>

      <div class="audit-field filter-field date-range" (keydown.escape)="closeDates(true)">
        <span class="audit-label" id="ah-date-label">{{ L.FILTER_DATE }}</span>
        <button
          #dateBtn
          type="button"
          class="audit-control date-btn"
          [class.active]="dateFrom() !== '' || dateTo() !== ''"
          aria-haspopup="dialog"
          [attr.aria-expanded]="datesOpen()"
          aria-controls="ah-date-range"
          aria-labelledby="ah-date-label ah-date-text"
          (click)="datesOpen.set(!datesOpen())"
        >
          <span class="material-symbols-outlined" aria-hidden="true">calendar_month</span>
          <span class="date-text" id="ah-date-text">{{ dateLabel() }}</span>
          <span class="material-symbols-outlined" aria-hidden="true">expand_more</span>
        </button>
        <div
          *ngIf="datesOpen()"
          id="ah-date-range"
          class="date-popover"
          role="dialog"
          [attr.aria-label]="L.DATE_RANGE_DIALOG"
        >
          <label class="audit-field">
            <span class="audit-label">{{ L.DATE_FROM }}</span>
            <input
              class="audit-control"
              type="date"
              [attr.max]="dateTo() || null"
              [ngModel]="dateFrom()"
              (ngModelChange)="setFilter(dateFrom, $event)"
            />
          </label>
          <label class="audit-field">
            <span class="audit-label">{{ L.DATE_TO }}</span>
            <input
              class="audit-control"
              type="date"
              [attr.min]="dateFrom() || null"
              [ngModel]="dateTo()"
              (ngModelChange)="setFilter(dateTo, $event)"
            />
          </label>
          <div class="date-popover-actions">
            <button type="button" class="tohfa-btn audit-btn-outline" (click)="clearDates()">
              {{ L.DATE_CLEAR }}
            </button>
            <button type="button" class="tohfa-btn tohfa-btn-primary" (click)="closeDates(true)">
              {{ L.DATE_DONE }}
            </button>
          </div>
        </div>
      </div>

      <label class="audit-field filter-field">
        <span class="audit-label">{{ L.FILTER_RESULT }}</span>
        <span class="audit-select-wrap">
          <select class="audit-control" [ngModel]="result()" (ngModelChange)="setFilter(result, $event)">
            <option value="">{{ L.ALL }}</option>
            <option *ngFor="let r of resultOptions" [value]="r.value">{{ r.label }}</option>
          </select>
        </span>
      </label>

      <div class="filter-actions">
        <button type="button" class="tohfa-btn tohfa-btn-outline-amber reset-btn" (click)="reset()">
          <span class="material-symbols-outlined icon" aria-hidden="true">restart_alt</span>{{ L.BTN_RESET }}
        </button>
        <!-- Inert: no export format has been designed. -->
        <button
          type="button"
          class="tohfa-btn tohfa-btn-primary export-btn"
          aria-disabled="true"
          [title]="L.EXPORT_INERT"
        >
          <span class="material-symbols-outlined icon" aria-hidden="true">download</span>{{ L.BTN_EXPORT }}
        </button>
      </div>
    </section>

    <section class="kpi-row" [attr.aria-label]="L.KPI_REGION">
      <div *ngFor="let kpi of kpis()" class="kpi" [ngClass]="kpi.tint === null ? '' : 'tone-bg-' + kpi.tint">
        <span class="material-symbols-outlined kpi-icon tone-fg-{{ kpi.iconTone }}" aria-hidden="true">{{
          kpi.icon
        }}</span>
        <span class="kpi-text">
          <span class="kpi-label">{{ kpi.label }}</span>
          <span class="audit-kpi-value">{{ kpi.value }}</span>
        </span>
      </div>
    </section>

    <p class="sr-only" aria-live="polite">{{ L.resultCount(sorted().length) }}</p>

    <div class="audit-table-wrap">
      <div class="table-scroll">
        <table>
          <caption class="sr-only">{{ L.TABLE_CAPTION }}</caption>
          <thead>
            <tr>
              <th
                *ngFor="let col of columns"
                scope="col"
                [class.center]="col.align === 'center'"
                [attr.aria-sort]="ariaSort(col.key)"
              >
                <button
                  type="button"
                  class="sort-btn"
                  [class.sorted]="sortKey() === col.key"
                  [attr.aria-label]="L.sortBy(col.header)"
                  (click)="toggleSort(col.key)"
                >
                  {{ col.header }}
                  <span class="material-symbols-outlined" aria-hidden="true">{{ sortIcon(col.key) }}</span>
                </button>
              </th>
              <th scope="col" class="center">{{ L.COL_ACTIONS }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of pageRows(); trackBy: trackById">
              <td>
                <a class="id-link" [routerLink]="detailLink(row)">{{ row.id }}</a>
              </td>
              <td class="farmer-cell">{{ row.farmerName }}</td>
              <td class="farm-cell">{{ L.farmZone(row.farmName, row.zone) }}</td>
              <td>
                <span [class]="typePill(row)">{{ typeLabels[row.type] }}</span>
              </td>
              <td>
                <time [attr.datetime]="row.auditDate" [attr.title]="dateLong(row)">{{ date(row) }}</time>
              </td>
              <td class="center num-cell">{{ row.majorFindings }}</td>
              <td class="center num-cell">{{ row.minorFindings }}</td>
              <td>
                <span [class]="scorePill(row)">{{ L.scoreOutOf(row.score, scoreMax) }}</span>
              </td>
              <td>
                <span [class]="statusPill(row)">
                  <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
                  {{ statusLabel(row) }}
                </span>
              </td>
              <td class="center">
                <span class="row-actions">
                  <a class="view-link" [routerLink]="detailLink(row)" [attr.aria-label]="L.viewAria(row.id)">{{
                    L.ACTION_VIEW
                  }}</a>
                  <span class="row-sep" aria-hidden="true">|</span>
                  <!-- Inert: no report file has been designed. -->
                  <button
                    type="button"
                    class="download-btn"
                    aria-disabled="true"
                    [title]="L.DOWNLOAD_INERT"
                    [attr.aria-label]="L.downloadAria(row.id)"
                  >
                    <span class="material-symbols-outlined" aria-hidden="true">download</span>
                  </button>
                </span>
              </td>
            </tr>
            <tr *ngIf="pageRows().length === 0">
              <td class="empty" [attr.colspan]="columns.length + 1">{{ L.EMPTY }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="history-footer">
      <span class="audit-table-range">{{ footerLabel() }}</span>
      <div class="footer-right">
        <label class="rows-per-page">
          <span>{{ L.ROWS_PER_PAGE }}</span>
          <span class="audit-select-wrap">
            <select class="audit-control" [ngModel]="pageSize()" (ngModelChange)="setPageSize($event)">
              <option *ngFor="let size of pageSizes" [ngValue]="size">{{ size }}</option>
            </select>
          </span>
        </label>
        <nav class="audit-pager" [attr.aria-label]="L.PAGER_LABEL">
          <button type="button" [disabled]="page() <= 1" [attr.aria-label]="L.PREV" (click)="goToPage(page() - 1)">
            <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
          </button>
          <button
            *ngFor="let p of pages()"
            type="button"
            [class.active]="p === page()"
            [attr.aria-current]="p === page() ? 'page' : null"
            [attr.aria-label]="L.pageAria(p)"
            (click)="goToPage(p)"
          >
            {{ p }}
          </button>
          <button
            type="button"
            [disabled]="page() >= lastPage()"
            [attr.aria-label]="L.NEXT"
            (click)="goToPage(page() + 1)"
          >
            <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
          </button>
        </nav>
      </div>
    </div>
  `,
})
export class AuditHistoryComponent {
  readonly L = L;
  readonly types = AUDIT_TYPES;
  readonly typeLabels = AUDIT_TYPE_LABEL;
  readonly zones = AUDIT_ZONES;
  readonly pageSizes = AUDIT_HISTORY_PAGE_SIZES;
  readonly scoreMax = AUDIT_HISTORY_SCORE_MAX;

  readonly resultOptions: readonly { value: ResultFilter; label: string }[] = [
    { value: 'AT_OR_ABOVE', label: L.resultAtOrAbove(AUDIT_HISTORY_SCORE_PILL_THRESHOLD) },
    { value: 'BELOW', label: L.resultBelow(AUDIT_HISTORY_SCORE_PILL_THRESHOLD) },
    { value: 'FINDINGS', label: L.RESULT_FINDINGS },
    { value: 'NO_FINDINGS', label: L.RESULT_NO_FINDINGS },
  ];

  readonly columns: readonly SortableColumn[] = [
    { key: 'id', header: L.COL_ID, align: 'left' },
    { key: 'farmer', header: L.COL_FARMER, align: 'left' },
    { key: 'farmZone', header: L.COL_FARM_ZONE, align: 'left' },
    { key: 'type', header: L.COL_TYPE, align: 'left' },
    { key: 'date', header: L.COL_DATE, align: 'left' },
    { key: 'major', header: L.COL_MAJOR, align: 'center' },
    { key: 'minor', header: L.COL_MINOR, align: 'center' },
    { key: 'score', header: L.COL_SCORE, align: 'left' },
    { key: 'status', header: L.COL_STATUS, align: 'left' },
  ];

  @ViewChild('dateBtn') private dateBtn?: ElementRef<HTMLButtonElement>;

  readonly search = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('q') ?? '');
  readonly type = signal<AuditType | ''>('');
  readonly zone = signal<AuditZone | ''>('');
  readonly result = signal<ResultFilter>('');
  /** YYYY-MM-DD or ''. */
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly datesOpen = signal(false);
  /** `null` = the mock's own order (design 96). */
  readonly sortKey = signal<SortKey | null>(null);
  readonly sortDir = signal<SortDir>('asc');
  readonly page = signal(1);
  readonly pageSize = signal(AUDIT_HISTORY_DEFAULT_PAGE_SIZE);

  /** KPIs over every completed audit (not the filtered set), as the schedule list does. */
  readonly kpis = computed<readonly HistoryKpi[]>(() => {
    const rows = AUDIT_HISTORY_MOCK;
    const completed = rows.filter((r) => r.status === 'COMPLETED').length;
    const average =
      rows.length === 0 ? 0 : Math.round(rows.reduce((sum, r) => sum + r.score, 0) / rows.length);
    return [
      { key: 'total', label: L.KPI_TOTAL, value: String(rows.length), icon: 'assignment', tint: null, iconTone: 'amber' },
      { key: 'completed', label: L.KPI_COMPLETED, value: String(completed), icon: 'check_circle', tint: 'success', iconTone: 'success' },
      { key: 'average', label: L.KPI_AVERAGE, value: L.scoreOutOf(average, AUDIT_HISTORY_SCORE_MAX), icon: 'bar_chart', tint: null, iconTone: 'amber' },
      { key: 'findings', label: L.KPI_FINDINGS, value: String(rows.filter(hasFindings).length), icon: 'warning', tint: 'danger', iconTone: 'danger' },
    ];
  });

  readonly dateLabel = computed(() => {
    const from = this.dateFrom();
    const to = this.dateTo();
    if (from === '' && to === '') return L.DATE_PLACEHOLDER;
    return L.dateRangeActive(
      from === '' ? L.DATE_ANY : formatAuditDate(from),
      to === '' ? L.DATE_ANY : formatAuditDate(to),
    );
  });

  readonly filtered = computed<readonly AuditHistoryRow[]>(() => {
    const q = this.search().trim().toLowerCase();
    const type = this.type();
    const zone = this.zone();
    const result = this.result();
    const from = this.dateFrom();
    const to = this.dateTo();
    return AUDIT_HISTORY_MOCK.filter((r) => {
      if (type !== '' && r.type !== type) return false;
      if (zone !== '' && r.zone !== zone) return false;
      if (from !== '' && r.auditDate < from) return false;
      if (to !== '' && r.auditDate > to) return false;
      if (result === 'AT_OR_ABOVE' && r.score < AUDIT_HISTORY_SCORE_PILL_THRESHOLD) return false;
      if (result === 'BELOW' && r.score >= AUDIT_HISTORY_SCORE_PILL_THRESHOLD) return false;
      if (result === 'FINDINGS' && !hasFindings(r)) return false;
      if (result === 'NO_FINDINGS' && hasFindings(r)) return false;
      if (q === '') return true;
      return [r.id, r.farmerName, r.farmName, r.zone].some((v) => v.toLowerCase().includes(q));
    });
  });

  readonly sorted = computed<readonly AuditHistoryRow[]>(() => {
    const key = this.sortKey();
    const rows = this.filtered();
    if (key === null) return rows;
    const value = SORT_VALUE[key];
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    // Copy before sorting; ties keep the mock order (Array.prototype.sort is stable).
    return [...rows].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      const cmp =
        typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return cmp * dir;
    });
  });

  readonly lastPage = computed(() => Math.max(1, Math.ceil(this.sorted().length / this.pageSize())));

  readonly pages = computed<readonly number[]>(() =>
    Array.from({ length: this.lastPage() }, (_, i) => i + 1),
  );

  readonly pageRows = computed<readonly AuditHistoryRow[]>(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  readonly footerLabel = computed(() => {
    const total = this.sorted().length;
    const first = total === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1;
    const last = Math.min(this.page() * this.pageSize(), total);
    return L.showing(first, last, total);
  });

  setSearch(value: string | null): void {
    this.search.set(value ?? '');
    this.page.set(1);
  }

  /** Sets one filter signal and returns to page 1. */
  setFilter<T extends string>(target: { set(value: T): void }, value: T | null): void {
    target.set((value ?? '') as T);
    this.page.set(1);
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  clearDates(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.page.set(1);
  }

  closeDates(restoreFocus: boolean): void {
    if (!this.datesOpen()) return;
    this.datesOpen.set(false);
    if (restoreFocus) this.dateBtn?.nativeElement.focus();
  }

  /** Clears search, every filter and the sort; keeps the chosen page size. */
  reset(): void {
    this.search.set('');
    this.type.set('');
    this.zone.set('');
    this.result.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.datesOpen.set(false);
    this.sortKey.set(null);
    this.sortDir.set('asc');
    this.page.set(1);
  }

  /** First click sorts ascending; clicking the sorted column again flips the direction. */
  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.page.set(1);
  }

  ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey() !== key) return 'unfold_more';
    return this.sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  goToPage(p: number): void {
    this.page.set(Math.min(Math.max(1, p), this.lastPage()));
  }

  trackById(_: number, row: AuditHistoryRow): string {
    return row.id;
  }

  detailLink(row: AuditHistoryRow): string {
    return AUDIT_ROUTES.detail(row.id);
  }

  date(row: AuditHistoryRow): string {
    return formatAuditDate(row.auditDate);
  }

  dateLong(row: AuditHistoryRow): string {
    return formatAuditDateLong(row.auditDate);
  }

  typePill(row: AuditHistoryRow): string {
    return auditToneClass(row.type === 'INTERNAL' ? 'info' : 'purple', true);
  }

  scorePill(row: AuditHistoryRow): string {
    return auditToneClass(row.score >= AUDIT_HISTORY_SCORE_PILL_THRESHOLD ? 'success' : 'warning', true);
  }

  statusPill(row: AuditHistoryRow): string {
    return `${auditStatusPillClass(row.status, true)} status-pill`;
  }

  statusLabel(row: AuditHistoryRow): string {
    return AUDIT_STATUS_META[row.status].label;
  }
}
