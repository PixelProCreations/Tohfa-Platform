/**
 * Audit Management → Audit Schedule & Assignment (design 75). UI ONLY.
 *
 * Rows are placeholder data (audit.mock.ts, design 75 verbatim). Search, Zone / Audit Type / Auditor /
 * Status filters, the date range and paging all run client-side. When integrated, they become query
 * parameters of `GET /admin/audits` (listAudits) and this screen filters for convenience only (see
 * apps/admin-web/CLAUDE.md "Data tables and scope").
 *
 * Links: "View" → AUDIT_ROUTES.detail(id); "Update" (In Progress) → AUDIT_ROUTES.inspection(id).
 * Inert by design (no designs exist for them): Export, Reschedule, Cancel and Review.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  DataTableCellDirective,
  DataTableComponent,
  type Column,
  type Row,
} from '../../shared/data-table/data-table.component';
import { auditDayOf, formatAuditDate, formatAuditDateTime12 } from './audit-format';
import { AUDIT_ROUTES } from './audit-nav';
import { AUDIT_STATUS_META, AUDIT_TYPE_LABEL, auditStatusPillClass } from './audit-presentation';
import { AUDIT_SCHEDULE_LIST_STRINGS as L } from './audit-schedule-list.strings';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import {
  AUDIT_AUDITORS,
  AUDIT_FILTER_STATUSES,
  AUDIT_LIST_MOCK,
  AUDIT_LIST_PAGE_SIZE,
  AUDIT_TYPES,
  AUDIT_ZONES,
} from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditKpi, AuditListRow, AuditType, AuditUiStatus, AuditZone } from './audit.types';

/** One entry in the Actions cell. `link === null` = inert (no design yet). */
interface RowAction {
  readonly label: string;
  readonly link: string | null;
  /** Amber text, as the design shows the secondary actions. */
  readonly accent: boolean;
}

type ActionKind = 'UPDATE' | 'RESCHEDULE' | 'CANCEL' | 'REVIEW';

/** Design 75: which actions follow "View" for each status. */
const ACTIONS_BY_STATUS: Readonly<Record<AuditUiStatus, readonly ActionKind[]>> = {
  IN_PROGRESS: ['UPDATE'],
  SCHEDULED: ['RESCHEDULE', 'CANCEL'],
  COMPLETED: [],
  OVERDUE: ['RESCHEDULE'],
  PENDING_REVIEW: ['REVIEW'],
  UPCOMING: ['RESCHEDULE', 'CANCEL'],
  POST_SCHEDULED_DATE: ['RESCHEDULE'],
  CANCELLED: [],
};

const ACTION_LABEL: Readonly<Record<ActionKind, string>> = {
  UPDATE: L.ACTION_UPDATE,
  RESCHEDULE: L.ACTION_RESCHEDULE,
  CANCEL: L.ACTION_CANCEL,
  REVIEW: L.ACTION_REVIEW,
};

@Component({
  selector: 'tohfa-audit-schedule-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataTableComponent, DataTableCellDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    `
      .kpi-head {
        display: flex;
        align-items: center;
        gap: var(--space-8);
      }
      .export-btn {
        min-height: calc(var(--space-20) * 2);
        cursor: default;
      }
      .date-range {
        position: relative;
      }
      .date-btn {
        min-height: calc(var(--space-20) * 2);
      }
      .date-btn.active {
        border-color: var(--tohfa-amber);
        color: var(--tohfa-brown);
      }
      .date-popover {
        position: absolute;
        top: calc(100% + var(--space-6));
        right: 0;
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
      .count {
        margin: 0;
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        color: var(--tohfa-slate);
      }
      .id-cell {
        font-weight: var(--fw-bold);
      }
      .farmer-cell {
        display: inline-block;
        max-width: calc(var(--space-32) * 6);
        white-space: normal;
      }
      .zone-cell {
        color: var(--tohfa-brown);
      }
    `,
  ],
  template: `
    <header class="audit-page-header">
      <div>
        <div class="audit-title-row">
          <span class="material-symbols-outlined audit-title-icon" aria-hidden="true">shield</span>
          <h1 class="audit-title">{{ L.TITLE }}</h1>
        </div>
        <p class="audit-subtitle">{{ L.SUBTITLE }}</p>
      </div>
    </header>

    <section class="audit-kpis" [attr.aria-label]="L.KPI_REGION">
      <div class="tohfa-kpi-card audit-kpi" *ngFor="let kpi of kpis()">
        <div class="kpi-head">
          <span class="material-symbols-outlined audit-kpi-icon tone-fg-{{ kpi.tone }}" aria-hidden="true">{{
            kpi.icon
          }}</span>
          <span class="audit-kpi-value">{{ kpi.value }}</span>
        </div>
        <span class="audit-kpi-label">{{ kpi.label }}</span>
      </div>
    </section>

    <section class="audit-filters" [attr.aria-label]="L.FILTERS_REGION">
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

      <label class="audit-filter-pill">
        <span>{{ L.FILTER_ZONE }}</span>
        <select [ngModel]="zone()" (ngModelChange)="setFilter(zone, $event)">
          <option value="">{{ L.FILTER_ALL }}</option>
          <option *ngFor="let z of zones" [value]="z">{{ z }}</option>
        </select>
        <span class="material-symbols-outlined" aria-hidden="true">expand_more</span>
      </label>

      <label class="audit-filter-pill">
        <span>{{ L.FILTER_TYPE }}</span>
        <select [ngModel]="type()" (ngModelChange)="setFilter(type, $event)">
          <option value="">{{ L.FILTER_ALL }}</option>
          <option *ngFor="let t of types" [value]="t">{{ typeLabels[t] }}</option>
        </select>
        <span class="material-symbols-outlined" aria-hidden="true">expand_more</span>
      </label>

      <label class="audit-filter-pill">
        <span>{{ L.FILTER_AUDITOR }}</span>
        <select [ngModel]="auditor()" (ngModelChange)="setFilter(auditor, $event)">
          <option value="">{{ L.FILTER_ALL }}</option>
          <option *ngFor="let a of auditors" [value]="a.name">{{ a.name }}</option>
        </select>
        <span class="material-symbols-outlined" aria-hidden="true">expand_more</span>
      </label>

      <div class="date-range" (keydown.escape)="closeDates(true)">
        <button
          #dateBtn
          type="button"
          class="audit-filter-pill date-btn"
          [class.active]="dateFrom() !== '' || dateTo() !== ''"
          aria-haspopup="dialog"
          [attr.aria-expanded]="datesOpen()"
          aria-controls="audit-date-range"
          (click)="datesOpen.set(!datesOpen())"
        >
          {{ dateLabel() }}
          <span class="material-symbols-outlined" aria-hidden="true">calendar_month</span>
        </button>
        <div
          *ngIf="datesOpen()"
          id="audit-date-range"
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

      <label class="audit-filter-pill">
        <span>{{ L.FILTER_STATUS }}</span>
        <select [ngModel]="status()" (ngModelChange)="setFilter(status, $event)">
          <option value="">{{ L.FILTER_ALL }}</option>
          <option *ngFor="let s of statuses" [value]="s">{{ statusMeta[s].label }}</option>
        </select>
        <span class="material-symbols-outlined" aria-hidden="true">expand_more</span>
      </label>

      <!-- Inert: no export format has been designed. -->
      <button
        type="button"
        class="tohfa-btn tohfa-btn-primary export-btn"
        aria-disabled="true"
        [title]="L.EXPORT_INERT"
      >
        <span class="material-symbols-outlined icon" aria-hidden="true">download</span>{{ L.BTN_EXPORT }}
      </button>
    </section>

    <p class="sr-only" aria-live="polite">{{ L.resultCount(filtered().length) }}</p>

    <!-- The shared table renders rows only (its footer stays hidden: total <= pageSize, no
         footerLabel); the footer below always shows the pager, even for a single page (design 75). -->
    <div class="audit-table-wrap">
      <tohfa-data-table
        [columns]="columns"
        [rows]="pageRows()"
        [total]="pageRows().length"
        [page]="1"
        [pageSize]="pageSize"
        [emptyMessage]="L.EMPTY"
      >
        <ng-template tohfaCell="id" let-row><span class="id-cell">{{ row.id }}</span></ng-template>
        <ng-template tohfaCell="farmer" let-row>
          <span class="farmer-cell">{{ L.farmerFarm(row.farmerName, row.farmName) }}</span>
        </ng-template>
        <ng-template tohfaCell="zone" let-row><span class="zone-cell">{{ row.zone }}</span></ng-template>
        <ng-template tohfaCell="type" let-row>{{ typeLabelOf(row) }}</ng-template>
        <ng-template tohfaCell="scheduledAt" let-row>{{ scheduledOf(row) }}</ng-template>
        <ng-template tohfaCell="status" let-row>
          <span [class]="pillClass(row)">{{ statusLabel(row) }}</span>
        </ng-template>
        <ng-template tohfaCell="updatedOn" let-row>{{ updatedOf(row) }}</ng-template>
        <ng-template tohfaCell="actions" let-row>
          <span class="audit-actions">
            <a class="audit-action" [routerLink]="detailLink(row)" [attr.aria-label]="L.actionAria(L.ACTION_VIEW, row.id)">{{
              L.ACTION_VIEW
            }}</a>
            <ng-container *ngFor="let action of actionsOf(row)">
              <span class="audit-action-sep" aria-hidden="true">-</span>
              <a
                *ngIf="action.link !== null; else inertAction"
                class="audit-action"
                [class.accent]="action.accent"
                [routerLink]="action.link"
                [attr.aria-label]="L.actionAria(action.label, row.id)"
                >{{ action.label }}</a
              >
              <ng-template #inertAction>
                <!-- Inert: no design for this action yet. -->
                <button
                  type="button"
                  class="audit-action is-inert"
                  [class.accent]="action.accent"
                  aria-disabled="true"
                  [title]="S.NO_DESIGN_YET"
                  [attr.aria-label]="L.actionInertAria(action.label, row.id)"
                >
                  {{ action.label }}
                </button>
              </ng-template>
            </ng-container>
          </span>
        </ng-template>
      </tohfa-data-table>

      <div class="audit-table-footer">
        <span class="audit-table-range">{{ footerLabel() }}</span>
        <div class="audit-pager">
          <button type="button" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">
            {{ L.PREV }}
          </button>
          <button type="button" class="active" aria-current="page">{{ page() }}</button>
          <button type="button" [disabled]="page() >= lastPage()" (click)="goToPage(page() + 1)">
            {{ L.NEXT }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AuditScheduleListComponent {
  readonly S = S;
  readonly L = L;
  readonly pageSize = AUDIT_LIST_PAGE_SIZE;
  readonly zones = AUDIT_ZONES;
  readonly types = AUDIT_TYPES;
  readonly typeLabels = AUDIT_TYPE_LABEL;
  readonly auditors = AUDIT_AUDITORS;
  readonly statuses = AUDIT_FILTER_STATUSES;
  readonly statusMeta = AUDIT_STATUS_META;

  @ViewChild('dateBtn') private dateBtn?: ElementRef<HTMLButtonElement>;

  readonly columns: readonly Column[] = [
    { key: 'index', header: L.COL_INDEX },
    { key: 'id', header: L.COL_AUDIT_ID },
    { key: 'farmer', header: L.COL_FARMER_FARM },
    { key: 'zone', header: L.COL_ZONE },
    { key: 'type', header: L.COL_TYPE },
    { key: 'scheduledAt', header: L.COL_SCHEDULED },
    { key: 'auditorName', header: L.COL_AUDITOR },
    { key: 'status', header: L.COL_STATUS },
    { key: 'updatedOn', header: L.COL_UPDATED },
    { key: 'actions', header: L.COL_ACTIONS },
  ];

  /** KPI counts over every row (design 75: 10 / 3 / 2 / 1 / 2 / 2), not the filtered set. */
  readonly kpis = computed<readonly AuditKpi[]>(() => {
    const count = (s: AuditUiStatus): number => AUDIT_LIST_MOCK.filter((r) => r.status === s).length;
    return [
      { key: 'total', label: L.KPI_TOTAL, value: AUDIT_LIST_MOCK.length, icon: 'calendar_month', tone: 'amber' },
      { key: 'scheduled', label: L.KPI_SCHEDULED, value: count('SCHEDULED'), icon: 'event', tone: 'info' },
      { key: 'inProgress', label: L.KPI_IN_PROGRESS, value: count('IN_PROGRESS'), icon: 'autorenew', tone: 'warning' },
      { key: 'pendingReview', label: L.KPI_PENDING_REVIEW, value: count('PENDING_REVIEW'), icon: 'description', tone: 'neutral' },
      { key: 'completed', label: L.KPI_COMPLETED, value: count('COMPLETED'), icon: 'check_circle', tone: 'success' },
      { key: 'overdue', label: L.KPI_OVERDUE, value: count('OVERDUE'), icon: 'warning', tone: 'danger' },
    ];
  });

  readonly search = signal('');
  readonly zone = signal<AuditZone | ''>('');
  readonly type = signal<AuditType | ''>('');
  readonly auditor = signal('');
  readonly status = signal<AuditUiStatus | ''>('');
  /** YYYY-MM-DD or ''. */
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly datesOpen = signal(false);
  readonly page = signal(1);

  readonly dateLabel = computed(() => {
    const from = this.dateFrom();
    const to = this.dateTo();
    if (from === '' && to === '') return L.DATE_RANGE;
    return L.dateRangeActive(
      from === '' ? L.DATE_ANY : formatAuditDate(from),
      to === '' ? L.DATE_ANY : formatAuditDate(to),
    );
  });

  readonly filtered = computed<readonly AuditListRow[]>(() => {
    const q = this.search().trim().toLowerCase();
    const zone = this.zone();
    const type = this.type();
    const auditor = this.auditor();
    const status = this.status();
    const from = this.dateFrom();
    const to = this.dateTo();
    return AUDIT_LIST_MOCK.filter((r) => {
      if (zone !== '' && r.zone !== zone) return false;
      if (type !== '' && r.type !== type) return false;
      if (auditor !== '' && r.auditorName !== auditor) return false;
      if (status !== '' && r.status !== status) return false;
      // ISO days compare correctly as strings.
      const day = auditDayOf(r.scheduledAt);
      if (from !== '' && day < from) return false;
      if (to !== '' && day > to) return false;
      if (q === '') return true;
      return [r.id, r.farmerName, r.farmName, r.auditorName].some((v) =>
        v.toLowerCase().includes(q),
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
      .map((r, i) => ({
        ...r,
        index: start + i + 1,
        farmer: null,
        actions: null,
        // Built once per row (not per change-detection pass) so *ngFor keeps its DOM.
        rowActions: this.buildActions(r),
      }));
  });

  readonly footerLabel = computed(() => {
    const total = this.filtered().length;
    const first = total === 0 ? 0 : (this.page() - 1) * this.pageSize + 1;
    const last = Math.min(this.page() * this.pageSize, total);
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

  goToPage(p: number): void {
    this.page.set(Math.min(Math.max(1, p), this.lastPage()));
  }

  private rowOf(row: Row): AuditListRow {
    return row as unknown as AuditListRow;
  }

  typeLabelOf(row: Row): string {
    return AUDIT_TYPE_LABEL[this.rowOf(row).type];
  }

  scheduledOf(row: Row): string {
    return formatAuditDateTime12(this.rowOf(row).scheduledAt);
  }

  updatedOf(row: Row): string {
    return formatAuditDate(this.rowOf(row).updatedOn);
  }

  pillClass(row: Row): string {
    return auditStatusPillClass(this.rowOf(row).status, true);
  }

  statusLabel(row: Row): string {
    return AUDIT_STATUS_META[this.rowOf(row).status].label;
  }

  detailLink(row: Row): string {
    return AUDIT_ROUTES.detail(this.rowOf(row).id);
  }

  actionsOf(row: Row): readonly RowAction[] {
    return (row['rowActions'] as readonly RowAction[] | undefined) ?? [];
  }

  private buildActions(r: AuditListRow): readonly RowAction[] {
    return ACTIONS_BY_STATUS[r.status].map((kind) => ({
      label: ACTION_LABEL[kind],
      link: kind === 'UPDATE' ? AUDIT_ROUTES.inspection(r.id) : null,
      accent: true,
    }));
  }
}
