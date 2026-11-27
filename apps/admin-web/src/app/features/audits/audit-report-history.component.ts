/**
 * Audit Management → Report History (design 99). UI ONLY.
 *
 * Rows are placeholder data (audit-reports.mock.ts). The search filters rows client-side. When
 * integrated, the list comes from an audit-reports endpoint that does not exist in
 * docs/openapi.yaml yet (specification gap — see the mock's header).
 *
 * Links: "Preview" (Ready rows) → AUDIT_ROUTES.reportDetail(id).
 * Inert (no design / nothing to call): Filter, Download CSV and Retry.
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
import { formatAuditDateTime24 } from './audit-format';
import { AUDIT_ROUTES } from './audit-nav';
import { auditToneClass } from './audit-presentation';
import { AUDIT_REPORT_HISTORY_STRINGS as L } from './audit-report-history.strings';
import { AUDIT_REPORT_ROWS, type AuditReportRow, type AuditReportStatus } from './audit-reports.mock';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditStatusMeta } from './audit.types';

const REPORT_STATUS_META: Readonly<Record<AuditReportStatus, AuditStatusMeta>> = {
  READY: { label: L.STATUS_READY, tone: 'success' },
  GENERATING: { label: L.STATUS_GENERATING, tone: 'warning' },
  FAILED: { label: L.STATUS_FAILED, tone: 'danger' },
};

@Component({
  selector: 'tohfa-audit-report-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataTableComponent, DataTableCellDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    `
      .toolbar {
        display: flex;
        align-items: center;
        gap: var(--space-10);
      }
      .toolbar .audit-search .tohfa-input {
        width: 100%;
      }
      .filter-btn {
        min-height: var(--tohfa-min-touch-target);
        cursor: default;
      }
      /* Design 99: the tinted header row is upper-case and brown. */
      .audit-table-wrap ::ng-deep th {
        color: var(--tohfa-brown);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .audit-table-wrap ::ng-deep td {
        white-space: normal;
      }
      .name-cell {
        display: inline-flex;
        align-items: center;
        gap: var(--space-8);
        font-weight: var(--fw-bold);
        white-space: nowrap;
      }
      .name-cell .material-symbols-outlined {
        font-size: var(--icon-btn);
        color: var(--tohfa-amber);
      }
      .by-cell {
        font-weight: var(--fw-bold);
        white-space: nowrap;
      }
      .filters-cell {
        display: inline-block;
        max-width: calc(var(--space-32) * 6);
        color: var(--tohfa-slate);
      }
      .count-cell {
        font-weight: var(--fw-bold);
        white-space: nowrap;
      }
      .time-cell {
        white-space: nowrap;
      }
      .link-action {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        padding: 0;
        border: none;
        background: none;
        color: var(--tohfa-amber-active);
        font-family: var(--font);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
      }
      .link-action.is-inert {
        cursor: default;
      }
      .link-action:hover:not(.is-inert) {
        text-decoration: underline;
      }
      .link-action:focus-visible {
        outline: none;
        border-radius: var(--r-xs);
        box-shadow: var(--tohfa-focus-ring);
      }
      .link-action .material-symbols-outlined {
        font-size: var(--icon-row-action);
      }
      .hint {
        display: inline-block;
        max-width: calc(var(--space-32) * 7);
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
    `,
  ],
  template: `
    <header class="audit-page-header">
      <div>
        <div class="audit-title-row">
          <span class="audit-title-tile" aria-hidden="true">
            <span class="material-symbols-outlined">description</span>
          </span>
          <h1 class="audit-title">{{ L.TITLE }}</h1>
        </div>
        <p class="audit-subtitle">{{ L.SUBTITLE }}</p>
      </div>
    </header>

    <div class="toolbar">
      <label class="audit-search">
        <span class="material-symbols-outlined" aria-hidden="true">search</span>
        <span class="sr-only">{{ L.SEARCH_LABEL }}</span>
        <input
          class="tohfa-input"
          type="search"
          maxlength="100"
          [placeholder]="L.SEARCH_PLACEHOLDER"
          [ngModel]="search()"
          (ngModelChange)="search.set($event ?? '')"
        />
      </label>
      <!-- Inert: no filter panel has been designed. -->
      <button
        type="button"
        class="tohfa-btn tohfa-btn-outline-amber filter-btn"
        aria-disabled="true"
        [title]="L.FILTER_INERT"
      >
        <span class="material-symbols-outlined icon" aria-hidden="true">tune</span>{{ L.BTN_FILTER }}
      </button>
    </div>

    <p class="sr-only" aria-live="polite">{{ L.resultCount(filtered().length) }}</p>

    <div class="audit-table-wrap">
      <tohfa-data-table
        [columns]="columns"
        [rows]="tableRows()"
        [total]="tableRows().length"
        [page]="1"
        [pageSize]="pageSize"
        [emptyMessage]="L.EMPTY"
      >
        <ng-template tohfaCell="name" let-row>
          <span class="name-cell">
            <span class="material-symbols-outlined" aria-hidden="true">{{ rowOf(row).icon }}</span>
            {{ rowOf(row).name }}
          </span>
        </ng-template>
        <ng-template tohfaCell="time" let-row>
          <span class="audit-two-line time-cell">
            <span class="audit-two-line-sub">{{ rowOf(row).status === 'READY' ? L.GENERATED : L.REQUESTED }}</span>
            <time [attr.datetime]="rowOf(row).timestamp">{{ timeOf(row) }}</time>
          </span>
        </ng-template>
        <ng-template tohfaCell="generatedBy" let-row>
          <span class="by-cell">{{ rowOf(row).generatedBy }}</span>
        </ng-template>
        <ng-template tohfaCell="filtersApplied" let-row>
          <span class="filters-cell">{{ rowOf(row).filtersApplied }}</span>
        </ng-template>
        <ng-template tohfaCell="auditCount" let-row>
          <span class="count-cell">{{ countOf(row) }}</span>
        </ng-template>
        <ng-template tohfaCell="status" let-row>
          <span [class]="statusPill(row)">{{ statusLabel(row) }}</span>
        </ng-template>
        <ng-template tohfaCell="actions" let-row>
          <ng-container [ngSwitch]="rowOf(row).status">
            <span *ngSwitchCase="'READY'" class="audit-actions">
              <a class="link-action" [routerLink]="previewLink(row)" [attr.aria-label]="L.previewAria(rowOf(row).name)">
                <span class="material-symbols-outlined" aria-hidden="true">visibility</span>{{ L.ACTION_PREVIEW }}
              </a>
              <span class="audit-action-sep" aria-hidden="true">|</span>
              <!-- Inert: no CSV layout has been designed. -->
              <button
                type="button"
                class="link-action is-inert"
                aria-disabled="true"
                [title]="L.DOWNLOAD_INERT"
                [attr.aria-label]="L.downloadAria(rowOf(row).name)"
              >
                <span class="material-symbols-outlined" aria-hidden="true">download</span>{{ L.ACTION_DOWNLOAD }}
              </button>
            </span>
            <span *ngSwitchCase="'GENERATING'" class="hint">{{ L.GENERATING_HINT }}</span>
            <!-- Inert: report generation is not connected. -->
            <button
              *ngSwitchCase="'FAILED'"
              type="button"
              class="link-action is-inert"
              aria-disabled="true"
              [title]="L.RETRY_INERT"
              [attr.aria-label]="L.retryAria(rowOf(row).name)"
            >
              <span class="material-symbols-outlined" aria-hidden="true">refresh</span>{{ L.ACTION_RETRY }}
            </button>
          </ng-container>
        </ng-template>
      </tohfa-data-table>
    </div>
  `,
})
export class AuditReportHistoryComponent {
  readonly L = L;
  /** Every report fits on one page (design 99 shows no pager). */
  readonly pageSize = Math.max(1, AUDIT_REPORT_ROWS.length);

  readonly columns: readonly Column[] = [
    { key: 'name', header: L.COL_NAME },
    { key: 'time', header: L.COL_TIME },
    { key: 'generatedBy', header: L.COL_BY },
    { key: 'filtersApplied', header: L.COL_FILTERS },
    { key: 'auditCount', header: L.COL_COUNT },
    { key: 'status', header: L.COL_STATUS },
    { key: 'actions', header: L.COL_ACTIONS },
  ];

  readonly search = signal('');

  readonly filtered = computed<readonly AuditReportRow[]>(() => {
    const q = this.search().trim().toLowerCase();
    if (q === '') return AUDIT_REPORT_ROWS;
    // "Audit or farmer": the report name, its filters (where farmer names appear) and the requester.
    return AUDIT_REPORT_ROWS.filter((r) =>
      [r.name, r.filtersApplied, r.generatedBy].some((v) => v.toLowerCase().includes(q)),
    );
  });

  readonly tableRows = computed<readonly Row[]>(() =>
    this.filtered().map((r) => ({ ...r, time: null, actions: null })),
  );

  rowOf(row: Row): AuditReportRow {
    return row as unknown as AuditReportRow;
  }

  timeOf(row: Row): string {
    return formatAuditDateTime24(this.rowOf(row).timestamp);
  }

  countOf(row: Row): string {
    const n = this.rowOf(row).auditCount;
    return n === null ? S.DASH : L.auditCount(n);
  }

  statusPill(row: Row): string {
    return auditToneClass(REPORT_STATUS_META[this.rowOf(row).status].tone, true);
  }

  statusLabel(row: Row): string {
    return REPORT_STATUS_META[this.rowOf(row).status].label;
  }

  previewLink(row: Row): string {
    return AUDIT_ROUTES.reportDetail(this.rowOf(row).id);
  }
}
