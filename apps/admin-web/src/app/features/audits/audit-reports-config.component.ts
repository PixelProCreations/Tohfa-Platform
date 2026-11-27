/**
 * Audit Management → Audit Reports & Tier Configuration (design 98). UI ONLY.
 *
 * A page that, as drawn, opens the "generate audit report" dialog over itself on load. The form is
 * local state: "Export Report" validates (Report type required, Date to on or after Date from),
 * announces "Export started (demo — not stored)" and closes the dialog. Nothing is generated or
 * sent — there is no audit-report endpoint in docs/openapi.yaml yet (specification gap, see
 * audit-reports.mock.ts).
 *
 * Cancel, the X, Escape and a backdrop click close the dialog and return to Report History
 * (AUDIT_ROUTES.reportHistory). "Generate report" on the page reopens the dialog after an export.
 *
 * Option sources: audit types / zones / auditors / statuses from audit.mock.ts; farmers and farms
 * from audit-history.mock.ts; report types, red-flag and export options from audit-reports.mock.ts
 * (the last two are placeholders). Tier configuration itself is not drawn in design 98 — only the
 * hint that the tier filter appears once tiers are configured.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DialogFocusDirective } from '../farmers/dialog-focus.directive';
import { AUDIT_HISTORY_MOCK } from './audit-history.mock';
import { AUDIT_ROUTES } from './audit-nav';
import { AUDIT_STATUS_META, AUDIT_TYPE_LABEL } from './audit-presentation';
import { AUDIT_REPORTS_CONFIG_STRINGS as L } from './audit-reports-config.strings';
import {
  AUDIT_REPORT_EXPORT_TYPES,
  AUDIT_REPORT_RED_FLAG_OPTIONS,
  AUDIT_REPORT_TYPES,
  type AuditReportExportType,
  type AuditReportRedFlagFilter,
  type AuditReportType,
} from './audit-reports.mock';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AUDIT_AUDITORS, AUDIT_FILTER_STATUSES, AUDIT_TYPES, AUDIT_ZONES } from './audit.mock';
import type { AuditType, AuditUiStatus } from './audit.types';

interface FarmOption {
  readonly value: string;
  readonly label: string;
}

/** Distinct values in first-seen order. */
function distinct<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

const FARMERS: readonly string[] = distinct(AUDIT_HISTORY_MOCK.map((r) => r.farmerName)).sort((a, b) =>
  a.localeCompare(b),
);

const FARMS: readonly FarmOption[] = distinct(AUDIT_HISTORY_MOCK.map((r) => `${r.farmName}|${r.zone}`))
  .map((key) => {
    const [farm = '', zone = ''] = key.split('|');
    return { value: `farm:${farm}`, label: L.farmZoneOption(farm, zone) };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

let nextId = 0;

@Component({
  selector: 'tohfa-audit-reports-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    `
      .page-card {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-18);
        background: var(--tohfa-surface);
        border: var(--border-card);
        border-radius: var(--r-card);
      }
      .page-hint {
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .page-actions {
        display: flex;
        gap: var(--space-10);
      }
      .page-status {
        margin: 0;
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
        color: var(--ok);
      }
      .cfg-dialog {
        position: relative;
        box-sizing: border-box;
        max-width: calc(var(--space-32) * 20);
        max-height: 90vh;
        overflow-y: auto;
        margin: 0 var(--space-16);
      }
      .cfg-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        margin-bottom: var(--space-16);
      }
      .cfg-title {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        margin: 0;
        font-size: var(--fs-title-dialog);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-ink);
      }
      .cfg-title .material-symbols-outlined {
        font-size: var(--icon-dialog-close);
        color: var(--tohfa-amber);
      }
      .cfg-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-4);
        border: none;
        border-radius: var(--r-circle);
        background: none;
        color: var(--tohfa-slate);
        cursor: pointer;
      }
      .cfg-close:hover {
        background: var(--tohfa-page);
      }
      .cfg-close:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .cfg-close .material-symbols-outlined {
        font-size: var(--icon-dialog-close);
      }
      .cfg-section {
        margin: 0 0 var(--space-16);
        padding: var(--space-10) var(--space-12);
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-dense);
        font-weight: var(--fw-xbold);
      }
      .cfg-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-12);
        margin-top: var(--space-18);
      }
      .cfg-actions .tohfa-btn {
        width: 100%;
        justify-content: center;
        min-height: var(--tohfa-min-touch-target);
      }
      select.placeholder {
        color: var(--tohfa-muted);
      }
      select option {
        color: var(--tohfa-ink);
      }
    `,
  ],
  template: `
    <header class="audit-page-header">
      <div>
        <div class="audit-title-row">
          <span class="audit-title-tile" aria-hidden="true">
            <span class="material-symbols-outlined">summarize</span>
          </span>
          <h1 class="audit-title">{{ L.TITLE }}</h1>
        </div>
        <p class="audit-subtitle">{{ L.SUBTITLE }}</p>
      </div>
    </header>

    <section class="page-card">
      <p class="page-hint">{{ L.PAGE_HINT }}</p>
      <div class="page-actions">
        <a class="tohfa-btn audit-btn-outline" [routerLink]="reportHistoryLink">{{ L.BTN_HISTORY }}</a>
        <button type="button" class="tohfa-btn tohfa-btn-primary" (click)="open()">
          <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ L.BTN_OPEN }}
        </button>
      </div>
    </section>

    <p class="page-status" aria-live="polite">{{ status() }}</p>

    <div *ngIf="dialogOpen()" class="tohfa-dialog-scrim" (click)="dismiss()">
      <div
        class="tohfa-dialog cfg-dialog"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="ids.title"
        [attr.aria-describedby]="ids.description"
        tohfaDialogFocus
        (dialogClose)="dismiss()"
        (click)="$event.stopPropagation()"
      >
        <div class="cfg-head">
          <h2 class="cfg-title" [id]="ids.title">
            <span class="material-symbols-outlined" aria-hidden="true">summarize</span>{{ L.TITLE }}
          </h2>
          <button type="button" class="cfg-close" [attr.aria-label]="L.CLOSE" [title]="L.CLOSE" (click)="dismiss()">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
        <p class="sr-only" [id]="ids.description">{{ L.DIALOG_DESCRIPTION }}</p>

        <form novalidate (ngSubmit)="exportReport()">
          <p class="cfg-section">{{ L.SECTION_REPORTS }}</p>

          <div class="audit-form-grid">
            <div class="audit-field">
              <label class="audit-label required" [for]="ids.reportType">{{ L.FIELD_REPORT_TYPE }}</label>
              <span class="audit-select-wrap">
                <select
                  class="audit-control"
                  [class.placeholder]="reportType() === ''"
                  [id]="ids.reportType"
                  name="reportType"
                  required
                  data-autofocus
                  [attr.aria-invalid]="reportTypeError() ? 'true' : null"
                  [attr.aria-describedby]="reportTypeError() ? ids.reportTypeError : null"
                  [ngModel]="reportType()"
                  (ngModelChange)="setReportType($event)"
                >
                  <option value="">{{ L.SELECT_PLACEHOLDER }}</option>
                  <option *ngFor="let t of reportTypes" [value]="t">{{ L.REPORT_TYPE_LABEL[t] }}</option>
                </select>
              </span>
              <p *ngIf="reportTypeError()" class="audit-field-error" [id]="ids.reportTypeError">
                {{ L.ERROR_REPORT_TYPE }}
              </p>
            </div>

            <div class="audit-field">
              <label class="audit-label" [for]="ids.auditType">{{ L.FIELD_AUDIT_TYPE }}</label>
              <span class="audit-select-wrap">
                <select
                  class="audit-control"
                  [class.placeholder]="auditType() === ''"
                  [id]="ids.auditType"
                  name="auditType"
                  [ngModel]="auditType()"
                  (ngModelChange)="auditType.set($event)"
                >
                  <option value="">{{ L.SELECT_PLACEHOLDER }}</option>
                  <option *ngFor="let t of auditTypes" [value]="t">{{ typeLabels[t] }}</option>
                </select>
              </span>
            </div>

            <div class="audit-field">
              <label class="audit-label" [for]="ids.dateFrom">{{ L.FIELD_DATE_FROM }}</label>
              <input
                class="audit-control"
                type="date"
                [id]="ids.dateFrom"
                name="dateFrom"
                [attr.max]="dateTo() || null"
                [ngModel]="dateFrom()"
                (ngModelChange)="setDateFrom($event)"
              />
            </div>

            <div class="audit-field">
              <label class="audit-label" [for]="ids.dateTo">{{ L.FIELD_DATE_TO }}</label>
              <input
                class="audit-control"
                type="date"
                [id]="ids.dateTo"
                name="dateTo"
                [attr.min]="dateFrom() || null"
                [attr.aria-invalid]="dateError() ? 'true' : null"
                [attr.aria-describedby]="dateError() ? ids.dateError : null"
                [ngModel]="dateTo()"
                (ngModelChange)="setDateTo($event)"
              />
              <p *ngIf="dateError()" class="audit-field-error" [id]="ids.dateError">{{ L.ERROR_DATE_ORDER }}</p>
            </div>

            <div class="audit-field">
              <label class="audit-label" [for]="ids.farmer">{{ L.FIELD_FARMER }}</label>
              <span class="audit-select-wrap">
                <select
                  class="audit-control"
                  [class.placeholder]="farmer() === ''"
                  [id]="ids.farmer"
                  name="farmer"
                  [ngModel]="farmer()"
                  (ngModelChange)="farmer.set($event)"
                >
                  <option value="">{{ L.SELECT_PLACEHOLDER }}</option>
                  <option *ngFor="let f of farmers" [value]="f">{{ f }}</option>
                </select>
              </span>
            </div>

            <div class="audit-field">
              <label class="audit-label" [for]="ids.farmZone">{{ L.FIELD_FARM_ZONE }}</label>
              <span class="audit-select-wrap">
                <select
                  class="audit-control"
                  [class.placeholder]="farmZone() === ''"
                  [id]="ids.farmZone"
                  name="farmZone"
                  [ngModel]="farmZone()"
                  (ngModelChange)="farmZone.set($event)"
                >
                  <option value="">{{ L.SELECT_PLACEHOLDER }}</option>
                  <optgroup [label]="L.ZONES_GROUP">
                    <option *ngFor="let z of zones" [value]="'zone:' + z">{{ L.zoneOption(z) }}</option>
                  </optgroup>
                  <optgroup [label]="L.FARMS_GROUP">
                    <option *ngFor="let f of farms" [value]="f.value">{{ f.label }}</option>
                  </optgroup>
                </select>
              </span>
            </div>

            <div class="audit-field">
              <label class="audit-label" [for]="ids.auditor">{{ L.FIELD_AUDITOR }}</label>
              <span class="audit-select-wrap">
                <select
                  class="audit-control"
                  [class.placeholder]="auditor() === ''"
                  [id]="ids.auditor"
                  name="auditor"
                  [attr.aria-describedby]="ids.tierHint"
                  [ngModel]="auditor()"
                  (ngModelChange)="auditor.set($event)"
                >
                  <option value="">{{ L.SELECT_PLACEHOLDER }}</option>
                  <option *ngFor="let a of auditors" [value]="a.id">{{ a.name }}</option>
                </select>
              </span>
              <!-- Design 98 draws this hint under Auditor (left column). -->
              <p class="audit-helper" [id]="ids.tierHint">{{ L.TIER_FILTER_HINT }}</p>
            </div>

            <div class="audit-field">
              <label class="audit-label" [for]="ids.auditStatus">{{ L.FIELD_AUDIT_STATUS }}</label>
              <span class="audit-select-wrap">
                <select
                  class="audit-control"
                  [class.placeholder]="auditStatus() === ''"
                  [id]="ids.auditStatus"
                  name="auditStatus"
                  [attr.aria-describedby]="ids.tierHint"
                  [ngModel]="auditStatus()"
                  (ngModelChange)="auditStatus.set($event)"
                >
                  <option value="">{{ L.SELECT_PLACEHOLDER }}</option>
                  <option *ngFor="let s of statuses" [value]="s">{{ statusMeta[s].label }}</option>
                </select>
              </span>
            </div>

            <div class="audit-field">
              <label class="audit-label" [for]="ids.redFlag">{{ L.FIELD_RED_FLAG }}</label>
              <span class="audit-select-wrap">
                <select
                  class="audit-control"
                  [class.placeholder]="redFlag() === ''"
                  [id]="ids.redFlag"
                  name="redFlag"
                  [ngModel]="redFlag()"
                  (ngModelChange)="redFlag.set($event)"
                >
                  <option value="">{{ L.SELECT_PLACEHOLDER }}</option>
                  <option *ngFor="let r of redFlagOptions" [value]="r">{{ L.RED_FLAG_LABEL[r] }}</option>
                </select>
              </span>
            </div>

            <div class="audit-field">
              <label class="audit-label" [for]="ids.exportType">{{ L.FIELD_EXPORT_TYPE }}</label>
              <span class="audit-select-wrap">
                <select
                  class="audit-control"
                  [id]="ids.exportType"
                  name="exportType"
                  [ngModel]="exportType()"
                  (ngModelChange)="exportType.set($event)"
                >
                  <option *ngFor="let e of exportTypes" [value]="e">{{ L.EXPORT_TYPE_LABEL[e] }}</option>
                </select>
              </span>
            </div>
          </div>

          <div class="cfg-actions">
            <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="dismiss()">{{ L.BTN_CANCEL }}</button>
            <button type="submit" class="tohfa-btn tohfa-btn-primary-l">
              <span class="material-symbols-outlined icon" aria-hidden="true">download</span>{{ L.BTN_EXPORT }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AuditReportsConfigComponent {
  readonly L = L;
  readonly reportHistoryLink = AUDIT_ROUTES.reportHistory;
  readonly reportTypes = AUDIT_REPORT_TYPES;
  readonly auditTypes = AUDIT_TYPES;
  readonly typeLabels = AUDIT_TYPE_LABEL;
  readonly zones = AUDIT_ZONES;
  readonly farmers = FARMERS;
  readonly farms = FARMS;
  readonly auditors = AUDIT_AUDITORS;
  readonly statuses = AUDIT_FILTER_STATUSES;
  readonly statusMeta = AUDIT_STATUS_META;
  readonly redFlagOptions = AUDIT_REPORT_RED_FLAG_OPTIONS;
  readonly exportTypes = AUDIT_REPORT_EXPORT_TYPES;

  private readonly router = inject(Router);

  private readonly uid = nextId++;
  readonly ids = {
    title: `arc-title-${this.uid}`,
    description: `arc-desc-${this.uid}`,
    reportType: `arc-report-type-${this.uid}`,
    reportTypeError: `arc-report-type-error-${this.uid}`,
    auditType: `arc-audit-type-${this.uid}`,
    dateFrom: `arc-date-from-${this.uid}`,
    dateTo: `arc-date-to-${this.uid}`,
    dateError: `arc-date-error-${this.uid}`,
    farmer: `arc-farmer-${this.uid}`,
    farmZone: `arc-farm-zone-${this.uid}`,
    auditor: `arc-auditor-${this.uid}`,
    tierHint: `arc-tier-hint-${this.uid}`,
    auditStatus: `arc-audit-status-${this.uid}`,
    redFlag: `arc-red-flag-${this.uid}`,
    exportType: `arc-export-type-${this.uid}`,
  } as const;

  /** Design 98: the dialog is open when the page loads. */
  readonly dialogOpen = signal(true);
  readonly status = signal('');
  readonly submitted = signal(false);

  readonly reportType = signal<AuditReportType | ''>('');
  readonly auditType = signal<AuditType | ''>('');
  /** YYYY-MM-DD or ''. */
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly farmer = signal('');
  /** `zone:<name>` or `farm:<name>` or ''. */
  readonly farmZone = signal('');
  readonly auditor = signal('');
  readonly auditStatus = signal<AuditUiStatus | ''>('');
  readonly redFlag = signal<AuditReportRedFlagFilter | ''>('');
  readonly exportType = signal<AuditReportExportType>('ALL');

  reportTypeError(): boolean {
    return this.submitted() && this.reportType() === '';
  }

  dateError(): boolean {
    const from = this.dateFrom();
    const to = this.dateTo();
    // ISO days compare correctly as strings.
    return from !== '' && to !== '' && to < from;
  }

  setReportType(value: AuditReportType | '' | null): void {
    this.reportType.set(value ?? '');
  }

  setDateFrom(value: string | null): void {
    this.dateFrom.set(value ?? '');
  }

  setDateTo(value: string | null): void {
    this.dateTo.set(value ?? '');
  }

  open(): void {
    this.status.set('');
    this.submitted.set(false);
    this.dialogOpen.set(true);
  }

  /** Cancel / X / Escape / backdrop: close and go back to Report History. */
  dismiss(): void {
    this.dialogOpen.set(false);
    void this.router.navigateByUrl(AUDIT_ROUTES.reportHistory);
  }

  exportReport(): void {
    this.submitted.set(true);
    if (this.reportType() === '' || this.dateError()) {
      // Move focus to the first invalid control so keyboard and screen-reader users land on it.
      const firstInvalid = this.reportType() === '' ? this.ids.reportType : this.ids.dateTo;
      setTimeout(() => document.getElementById(firstInvalid)?.focus());
      return;
    }
    this.dialogOpen.set(false);
    this.status.set(L.EXPORT_STARTED_DEMO);
  }
}
