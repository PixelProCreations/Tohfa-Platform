/**
 * Farmers Management → Verification & Compliance (list). UI ONLY: placeholder rows
 * (farmer-compliance.mock.ts); every action button and Export is inert until the API exists.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DataTableCellDirective,
  DataTableComponent,
  type Column,
  type Row,
} from '../../shared/data-table/data-table.component';
import {
  COMPLIANCE_KPIS,
  COMPLIANCE_MOCK,
  COMPLIANCE_TOTAL,
  type CertificationRow,
  type CertificationStatus,
} from './farmer-compliance.mock';
import { FARMER_COMPLIANCE_STRINGS as S } from './farmer-compliance.strings';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info';

const STATUS_BADGE: Record<CertificationStatus, { label: string; tone: BadgeTone }> = {
  EXPIRED: { label: S.STATUS_EXPIRED, tone: 'danger' },
  VERIFIED: { label: S.STATUS_VERIFIED, tone: 'success' },
  PENDING: { label: S.STATUS_PENDING, tone: 'info' },
  EXPIRING_SOON: { label: S.STATUS_EXPIRING_SOON, tone: 'warning' },
};

/** The one contextual action per status (design: Mark Verified / Mark Unverified / Block Listings). */
const PRIMARY_ACTION: Record<CertificationStatus, string> = {
  EXPIRED: S.ACTION_BLOCK_LISTINGS,
  VERIFIED: S.ACTION_MARK_UNVERIFIED,
  PENDING: S.ACTION_MARK_VERIFIED,
  EXPIRING_SOON: S.ACTION_MARK_VERIFIED,
};

@Component({
  selector: 'tohfa-farmer-compliance',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent, DataTableCellDirective],
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
      .crumbs {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-6);
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .crumbs a {
        color: inherit;
        text-decoration: none;
      }
      .crumbs a:hover {
        color: var(--tohfa-ink);
      }
      .crumbs [aria-current='page'] {
        color: var(--tohfa-ink);
        font-weight: var(--fw-semi);
      }
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-16);
      }
      .page-title {
        margin: 0;
        font-size: var(--fs-title);
        font-weight: var(--fw-xbold);
        line-height: 1.2;
      }
      .export-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
        cursor: default;
      }

      .kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(calc(var(--space-32) * 6), 1fr));
        gap: var(--space-16);
      }
      .kpi {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }
      .kpi-label {
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .kpi-value {
        font-size: var(--fs-title);
        font-weight: var(--fw-xbold);
      }
      .kpi-value.success {
        color: var(--tohfa-success);
      }
      .kpi-value.warning {
        color: var(--tohfa-warning);
      }
      .kpi-value.danger {
        color: var(--tohfa-error);
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
        align-items: center;
        gap: var(--space-12);
        white-space: nowrap;
      }
      .row-actions button {
        padding: 0;
        border: none;
        background: none;
        font: inherit;
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
        color: var(--tohfa-amber);
        cursor: default;
      }
      .row-actions button.kebab {
        display: inline-flex;
        color: var(--tohfa-slate);
      }
      .row-actions button:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }

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
      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-16);
        border-top: var(--border-divider);
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
    `,
  ],
  template: `
    <nav class="crumbs" [attr.aria-label]="S.BREADCRUMB_LABEL">
      <a routerLink="/dashboard">{{ S.CRUMB_DASHBOARD }}</a><span aria-hidden="true">/</span>
      <a routerLink="/farmers">{{ S.CRUMB_FARMERS }}</a><span aria-hidden="true">/</span>
      <span aria-current="page">{{ S.CRUMB_CURRENT }}</span>
    </nav>

    <header class="page-header">
      <h1 class="page-title">{{ S.TITLE }}</h1>
      <!-- Inert: no export endpoint yet. -->
      <button
        type="button"
        class="tohfa-btn tohfa-btn-outline-amber export-btn"
        aria-disabled="true"
        [title]="S.NOT_AVAILABLE_YET"
      >
        <span class="material-symbols-outlined icon" aria-hidden="true">download</span
        >{{ S.BTN_EXPORT }}
      </button>
    </header>

    <section class="kpis">
      <div class="tohfa-card kpi">
        <span class="kpi-label">{{ S.KPI_TOTAL }}</span>
        <span class="kpi-value">{{ kpis.total }}</span>
      </div>
      <div class="tohfa-card kpi">
        <span class="kpi-label">{{ S.KPI_VERIFIED }}</span>
        <span class="kpi-value success">{{ kpis.verified }}</span>
      </div>
      <div class="tohfa-card kpi">
        <span class="kpi-label">{{ S.KPI_PENDING }}</span>
        <span class="kpi-value warning">{{ kpis.pending }}</span>
      </div>
      <div class="tohfa-card kpi">
        <span class="kpi-label">{{ S.KPI_EXPIRED }}</span>
        <span class="kpi-value danger">{{ kpis.expired }}</span>
      </div>
    </section>

    <div class="table-wrap">
      <tohfa-data-table
        [columns]="columns"
        [rows]="rows"
        [total]="rows.length"
        [page]="1"
        [pageSize]="rows.length"
        [emptyMessage]="S.EMPTY"
      >
        <ng-template tohfaCell="status" let-row>
          <span class="tohfa-badge tohfa-badge-{{ badge(row).tone }}">
            <span class="status-dot" aria-hidden="true"></span>{{ badge(row).label }}
          </span>
        </ng-template>
        <ng-template tohfaCell="actions" let-row>
          <!-- Inert: verification workflow and portal links are not built yet. -->
          <span class="row-actions">
            <button type="button" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET">
              {{ S.ACTION_VERIFY_PORTAL }}
            </button>
            <button type="button" aria-disabled="true" [title]="S.NOT_AVAILABLE_YET">
              {{ primaryAction(row) }}
            </button>
            <button
              type="button"
              class="kebab"
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
        <span class="range">{{ S.showing(1, rows.length, total) }}</span>
        <div class="pager">
          <button type="button" disabled>{{ S.PREV }}</button>
          <button type="button" class="active" aria-current="page">1</button>
          <button type="button" disabled>{{ S.NEXT }}</button>
        </div>
      </div>
    </div>
  `,
})
export class FarmerComplianceComponent {
  readonly S = S;
  readonly kpis = COMPLIANCE_KPIS;
  readonly total = COMPLIANCE_TOTAL;

  readonly columns: readonly Column[] = [
    { key: 'farmerName', header: S.COL_FARMER },
    { key: 'certType', header: S.COL_TYPE },
    { key: 'certNumber', header: S.COL_NUMBER },
    { key: 'authority', header: S.COL_AUTHORITY },
    { key: 'issuedDate', header: S.COL_ISSUED },
    { key: 'expiryDate', header: S.COL_EXPIRY },
    { key: 'status', header: S.COL_STATUS },
    { key: 'actions', header: S.COL_ACTIONS },
  ];

  readonly rows: readonly Row[] = COMPLIANCE_MOCK.map((r) => ({ ...r, actions: null }));

  badge(row: Row): { label: string; tone: BadgeTone } {
    return STATUS_BADGE[(row as unknown as CertificationRow).status];
  }

  primaryAction(row: Row): string {
    return PRIMARY_ACTION[(row as unknown as CertificationRow).status];
  }
}
