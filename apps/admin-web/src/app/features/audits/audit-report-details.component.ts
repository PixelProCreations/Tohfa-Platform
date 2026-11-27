/**
 * Audit Management → Report Details (design 100). UI ONLY.
 *
 * Reads the report id from `:id` (AUDIT_ROUTES.reportDetail) and shows the matching placeholder
 * report from audit-reports.mock.ts; unknown ids show the Audit Summary Report. The KPI tiles are the
 * report's own summary values, not recomputed from the rows shown ("Showing 8 of 42 rows").
 *
 * Links: Audit ID → AUDIT_ROUTES.detail(id); farmer name → Audit History searched for that farmer
 * (there is no farmer id in the report rows to link to the farmer profile).
 * Inert: Download Report (no report file has been designed; no report endpoint exists in the spec).
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  DataTableCellDirective,
  DataTableComponent,
  type Column,
  type Row,
} from '../../shared/data-table/data-table.component';
import { formatAuditDateTime24 } from './audit-format';
import { AUDIT_ROUTE_PARAMS, AUDIT_ROUTES } from './audit-nav';
import { AUDIT_STATUS_META, AUDIT_TYPE_LABEL, auditStatusPillClass } from './audit-presentation';
import { AUDIT_REPORT_DETAILS_STRINGS as L } from './audit-report-details.strings';
import {
  mockAuditReportDetail,
  type AuditReportKpiKey,
  type AuditReportRecord,
} from './audit-reports.mock';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';

const KPI_META: Readonly<Record<AuditReportKpiKey, { readonly label: string; readonly icon: string }>> = {
  count: { label: L.KPI_COUNT, icon: 'description' },
  completed: { label: L.KPI_COMPLETED, icon: 'check_circle' },
  average: { label: L.KPI_AVERAGE, icon: 'star' },
  findings: { label: L.KPI_FINDINGS, icon: 'layers' },
  coverage: { label: L.KPI_COVERAGE, icon: 'event_busy' },
};

@Component({
  selector: 'tohfa-audit-report-details',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent, DataTableCellDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    `
      .panel {
        padding: var(--space-18);
        background: var(--tohfa-surface);
        border: var(--border-card);
        border-radius: var(--r-card);
        min-width: 0;
      }
      .report-name {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-brown);
      }
      .report-name::before {
        content: '';
        width: var(--space-4);
        height: var(--space-16);
        border-radius: var(--r-pill);
        background: var(--tohfa-amber);
      }
      .report-generated {
        margin: var(--space-4) 0 var(--space-14);
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .tiles {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: var(--space-12);
        margin: 0;
      }
      .tile {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
        padding: var(--space-14);
        border: var(--border-card);
        border-radius: var(--r-md);
        min-width: 0;
      }
      .tile-icon {
        font-size: var(--icon-btn);
        color: var(--tohfa-amber);
      }
      .tile-label {
        margin: 0;
        font-size: var(--fs-cap);
        font-weight: var(--fw-semi);
        color: var(--tohfa-ink);
      }
      .tile-value {
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-ink);
      }
      .panel-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0 0 var(--space-12);
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-brown);
      }
      .panel-title .material-symbols-outlined {
        font-size: var(--icon-btn);
      }
      /* Tinted header row inside the card (design 100). */
      .tinted ::ng-deep th {
        padding-left: var(--space-10);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        text-transform: none;
        letter-spacing: 0;
        font-size: var(--fs-badge);
      }
      .tinted ::ng-deep td {
        padding-left: var(--space-10);
        font-size: var(--fs-dense);
      }
      .compliance-note {
        display: flex;
        align-items: flex-start;
        gap: var(--space-8);
        margin: 0;
        padding: var(--space-10) var(--space-12);
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
      }
      .compliance-note .material-symbols-outlined {
        font-size: var(--icon-btn);
        color: var(--tohfa-amber);
      }
      .id-cell {
        font-weight: var(--fw-bold);
        color: var(--tohfa-ink);
        text-decoration: none;
      }
      .farmer-link {
        color: var(--info);
        font-weight: var(--fw-semi);
        text-decoration: none;
      }
      .id-cell:hover,
      .farmer-link:hover {
        text-decoration: underline;
      }
      .id-cell:focus-visible,
      .farmer-link:focus-visible {
        outline: none;
        border-radius: var(--r-xs);
        box-shadow: var(--tohfa-focus-ring);
      }
      .muted {
        color: var(--tohfa-slate);
      }
      .score {
        font-weight: var(--fw-bold);
      }
      .records-footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        margin-top: var(--space-14);
      }
      .download-btn {
        min-height: var(--tohfa-min-touch-target);
        cursor: default;
      }
      .empty-line {
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }

      @media (max-width: 1200px) {
        .tiles {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      @media (max-width: 640px) {
        .tiles {
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
            <span class="material-symbols-outlined">assignment</span>
          </span>
          <h1 class="audit-title">{{ L.TITLE }}</h1>
        </div>
        <p class="audit-subtitle">{{ L.SUBTITLE }}</p>
      </div>
    </header>

    <section class="panel" aria-labelledby="ard-name">
      <h2 class="report-name" id="ard-name">{{ report().name }}</h2>
      <p class="report-generated">
        <time [attr.datetime]="report().generatedAt">{{ generatedLabel() }}</time>
      </p>
      <dl class="tiles" [attr.aria-label]="L.KPI_REGION">
        <div class="tile" *ngFor="let kpi of report().kpis">
          <span class="material-symbols-outlined tile-icon" aria-hidden="true">{{ kpiMeta[kpi.key].icon }}</span>
          <dt class="tile-label">{{ kpiMeta[kpi.key].label }}</dt>
          <dd class="tile-value">{{ kpi.value }}</dd>
        </div>
      </dl>
    </section>

    <div class="audit-grid-2">
      <section class="panel" aria-labelledby="ard-coverage">
        <h2 class="panel-title" id="ard-coverage">
          <span class="material-symbols-outlined" aria-hidden="true">groups</span>{{ L.MISSING_COVERAGE }}
        </h2>
        <tohfa-data-table
          class="tinted"
          [embedded]="true"
          [columns]="coverageColumns"
          [rows]="coverageRows()"
          [total]="coverageRows().length"
          [page]="1"
          [pageSize]="pageSizeFor(coverageRows().length)"
          [emptyMessage]="L.NO_MISSING_COVERAGE"
        >
          <ng-template tohfaCell="farmerName" let-row
            ><span class="score">{{ row.farmerName }}</span></ng-template
          >
          <ng-template tohfaCell="quarter" let-row
            ><span class="muted">{{ row.quarter }}</span></ng-template
          >
        </tohfa-data-table>
      </section>

      <section class="panel" aria-labelledby="ard-compliance">
        <h2 class="panel-title" id="ard-compliance">
          <span class="material-symbols-outlined" aria-hidden="true">shield</span>{{ L.COMPLIANCE_INFO }}
        </h2>
        <p class="compliance-note">
          <span class="material-symbols-outlined" aria-hidden="true">warning</span>{{ report().complianceNote }}
        </p>
      </section>
    </div>

    <section class="panel" aria-labelledby="ard-records">
      <h2 class="panel-title" id="ard-records">
        <span class="material-symbols-outlined" aria-hidden="true">description</span>{{ L.AUDIT_RECORDS }}
      </h2>
      <tohfa-data-table
        class="tinted"
        [embedded]="true"
        [columns]="recordColumns"
        [rows]="recordRows()"
        [total]="recordRows().length"
        [page]="1"
        [pageSize]="pageSizeFor(recordRows().length)"
        [emptyMessage]="L.NO_RECORDS"
      >
        <ng-template tohfaCell="auditId" let-row>
          <a class="id-cell" [routerLink]="auditLink(row)" [attr.aria-label]="L.auditAria(recordOf(row).auditId)">{{
            recordOf(row).auditId
          }}</a>
        </ng-template>
        <ng-template tohfaCell="farmerName" let-row>
          <a
            class="farmer-link"
            [routerLink]="historyLink"
            [queryParams]="{ q: recordOf(row).farmerName }"
            [attr.aria-label]="L.farmerAria(recordOf(row).farmerName)"
            >{{ recordOf(row).farmerName }}</a
          >
        </ng-template>
        <ng-template tohfaCell="type" let-row><span class="muted">{{ typeOf(row) }}</span></ng-template>
        <ng-template tohfaCell="date" let-row>
          <time class="muted" [attr.datetime]="recordOf(row).date">{{ recordOf(row).date }}</time>
        </ng-template>
        <ng-template tohfaCell="status" let-row>
          <span [class]="statusPill(row)">{{ statusLabel(row) }}</span>
        </ng-template>
        <ng-template tohfaCell="score" let-row><span class="score">{{ recordOf(row).score }}</span></ng-template>
      </tohfa-data-table>

      <div class="records-footer">
        <p class="empty-line">{{ L.showingRows(report().records.length, report().totalRecords) }}</p>
        <!-- Inert: no report file has been designed. -->
        <button
          type="button"
          class="tohfa-btn tohfa-btn-primary download-btn"
          aria-disabled="true"
          [title]="L.DOWNLOAD_INERT"
        >
          <span class="material-symbols-outlined icon" aria-hidden="true">download</span>{{ L.BTN_DOWNLOAD }}
        </button>
      </div>
    </section>
  `,
})
export class AuditReportDetailsComponent {
  readonly L = L;
  readonly kpiMeta = KPI_META;
  readonly historyLink = AUDIT_ROUTES.history;

  private readonly route = inject(ActivatedRoute);

  /** The report id from `:id` ('' when absent → the Audit Summary Report). */
  readonly reportId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get(AUDIT_ROUTE_PARAMS.id) ?? '')),
    { initialValue: this.route.snapshot.paramMap.get(AUDIT_ROUTE_PARAMS.id) ?? '' },
  );

  readonly report = computed(() => mockAuditReportDetail(this.reportId()));

  readonly generatedLabel = computed(() => L.generatedAt(formatAuditDateTime24(this.report().generatedAt)));

  readonly coverageColumns: readonly Column[] = [
    { key: 'farmerName', header: L.COL_FARMER },
    { key: 'quarter', header: L.COL_QUARTER },
  ];

  readonly recordColumns: readonly Column[] = [
    { key: 'auditId', header: L.COL_AUDIT_ID },
    { key: 'farmerName', header: L.COL_FARMER },
    { key: 'type', header: L.COL_TYPE },
    { key: 'date', header: L.COL_DATE },
    { key: 'status', header: L.COL_STATUS },
    { key: 'score', header: L.COL_SCORE },
  ];

  readonly coverageRows = computed<readonly Row[]>(() =>
    this.report().missingCoverage.map((g) => ({ ...g })),
  );

  readonly recordRows = computed<readonly Row[]>(() => this.report().records.map((r) => ({ ...r })));

  /** One page holding every row, so the shared table never draws its own pager. */
  pageSizeFor(n: number): number {
    return Math.max(1, n);
  }

  recordOf(row: Row): AuditReportRecord {
    return row as unknown as AuditReportRecord;
  }

  auditLink(row: Row): string {
    return AUDIT_ROUTES.detail(this.recordOf(row).auditId);
  }

  typeOf(row: Row): string {
    return AUDIT_TYPE_LABEL[this.recordOf(row).type];
  }

  statusPill(row: Row): string {
    return auditStatusPillClass(this.recordOf(row).status, true);
  }

  statusLabel(row: Row): string {
    return AUDIT_STATUS_META[this.recordOf(row).status].label;
  }
}
