/**
 * "Generate Audit Report" dialog (design 97). UI ONLY.
 *
 * Opened from the dashboard's "Generate Audit Report" quick action. The admin picks a report type
 * (3 x 2 tile grid with radio-group semantics: one tab stop, arrow keys / Home / End move and select)
 * and four filters; the tinted preview recomputes from audit-generate-report.mock.ts. Nothing is
 * generated or stored: "Generate Report" only emits `generated` with the choice, and the host shows
 * a "Report requested (demo — not stored)" status. There is no report endpoint yet (spec gap).
 *
 * "Custom" date range has no date picker (kept deliberately simple); it previews like This quarter.
 * Focus handling is DialogFocusDirective; backdrop click and the close X emit `closed`.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DialogFocusDirective } from '../farmers/dialog-focus.directive';
import { AUDIT_GENERATE_REPORT_STRINGS as G } from './audit-generate-report-dialog.strings';
import {
  AUDIT_REPORT_AUDIT_TYPES,
  AUDIT_REPORT_DATE_RANGES,
  AUDIT_REPORT_DEFAULT_FILTERS,
  AUDIT_REPORT_DEFAULT_TYPE,
  AUDIT_REPORT_PREVIEW_BASE,
  AUDIT_REPORT_RANGE_SHARE,
  AUDIT_REPORT_STATUSES,
  AUDIT_REPORT_STATUS_SHARE,
  AUDIT_REPORT_TIERS_CONFIGURED,
  AUDIT_REPORT_TYPES,
  AUDIT_REPORT_TYPE_SHARE,
  AUDIT_REPORT_ZONES,
  AUDIT_REPORT_ZONE_SHARE,
  type AuditReportFilters,
  type AuditReportRequest,
  type AuditReportTypeKey,
} from './audit-generate-report.mock';
import { AUDIT_TYPE_LABEL, auditStatusLabel } from './audit-presentation';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditUiStatus } from './audit.types';

interface PreviewRow {
  readonly label: string;
  readonly value: string;
}

/** Arrow keys that move the selected report tile (linear, as a radio group). */
const REPORT_KEY_STEP: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

@Component({
  selector: 'tohfa-audit-generate-report-dialog',
  standalone: true,
  imports: [CommonModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-24);
        background: color-mix(in srgb, var(--tohfa-ink) 45%, transparent);
      }
      .dialog {
        box-sizing: border-box;
        width: 100%;
        max-width: calc(var(--space-32) * 20);
        max-height: calc(100vh - var(--space-24) * 2);
        overflow-y: auto;
        padding: var(--space-16) var(--space-18) var(--space-18);
        border-radius: var(--r-dialog);
        background: var(--tohfa-surface);
        box-shadow: var(--shadow-dialog);
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .head {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        margin-bottom: var(--space-18);
      }
      .head-icon {
        font-size: var(--icon-btn);
        color: var(--tohfa-amber);
      }
      .head h2 {
        flex: 1;
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .close {
        display: inline-flex;
        padding: var(--space-4);
        border: none;
        border-radius: var(--r-xs);
        background: transparent;
        color: var(--tohfa-slate);
        cursor: pointer;
      }
      .close .material-symbols-outlined {
        font-size: var(--icon-dialog-close);
      }
      .close:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .group-label {
        margin: 0 0 var(--space-10);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        color: var(--tohfa-brown);
      }
      .reports {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--space-8);
        margin-bottom: var(--space-14);
      }
      .report-tile {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-6);
        min-height: calc(var(--space-24) * 2);
        padding: var(--space-10) var(--space-8);
        border: var(--border-card);
        border-radius: var(--r-sm);
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        font-family: var(--font);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        text-align: center;
        cursor: pointer;
      }
      .report-tile:hover:not([aria-checked='true']) {
        background: var(--tohfa-page);
      }
      .report-tile[aria-checked='true'] {
        border-color: var(--tohfa-amber);
        background: var(--tohfa-amber-tint);
      }
      .report-tile:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .report-tile .material-symbols-outlined {
        font-size: var(--icon-btn);
        color: var(--tohfa-amber);
      }
      .filters {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--space-10);
        margin-bottom: var(--space-14);
      }
      .filter-label {
        font-size: var(--fs-badge);
      }
      .filters .audit-control {
        font-size: var(--fs-cap);
      }
      .lead-icon {
        position: absolute;
        top: 50%;
        left: var(--space-10);
        transform: translateY(-50%);
        font-size: var(--icon-row-action);
        color: var(--tohfa-slate);
        pointer-events: none;
      }
      .with-lead-icon select.audit-control {
        padding-left: calc(var(--space-10) + var(--icon-row-action) + var(--space-6));
      }
      .preview {
        margin-bottom: var(--space-14);
        padding: var(--space-12) var(--space-12);
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
      }
      .preview h3 {
        margin: 0 0 var(--space-8);
        font-size: var(--fs-cap);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-brown);
      }
      .preview dl {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }
      .preview-row {
        display: flex;
        justify-content: space-between;
        gap: var(--space-10);
        font-size: var(--fs-cap);
      }
      .preview-row dt {
        color: var(--tohfa-slate);
      }
      .preview-row dd {
        margin: 0;
        color: var(--tohfa-ink);
        font-weight: var(--fw-xbold);
        text-align: right;
      }
      .preview-note {
        display: flex;
        gap: var(--space-6);
        align-items: flex-start;
        margin: var(--space-10) 0 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-brown);
      }
      .preview-note .material-symbols-outlined {
        font-size: var(--icon-row-action);
      }
      .footer {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-10);
      }
      .footer .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
      }
      @media (max-width: 640px) {
        .reports,
        .filters {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 420px) {
        .reports,
        .filters,
        .footer {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <div class="backdrop" (click)="onBackdrop($event)">
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gr-dialog-title"
        aria-describedby="gr-dialog-desc"
        tohfaDialogFocus
        (dialogClose)="close()"
      >
        <div class="head">
          <span class="material-symbols-outlined head-icon" aria-hidden="true">description</span>
          <h2 id="gr-dialog-title">{{ G.TITLE }}</h2>
          <button type="button" class="close" [attr.aria-label]="G.CLOSE" (click)="close()">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
        <p class="sr-only" id="gr-dialog-desc">{{ G.DESCRIPTION }}</p>

        <form novalidate (submit)="generate($event)">
          <p class="group-label" id="gr-reports-label">{{ G.REPORTS }}</p>
          <div class="reports" role="radiogroup" aria-labelledby="gr-reports-label">
            <button
              *ngFor="let r of reportTypes; let i = index"
              type="button"
              role="radio"
              class="report-tile"
              [attr.data-report]="r.key"
              [attr.data-autofocus]="r.key === reportType() ? '' : null"
              [attr.aria-checked]="r.key === reportType()"
              [attr.tabindex]="r.key === reportType() ? 0 : -1"
              (click)="reportType.set(r.key)"
              (keydown)="onReportKey($event, i)"
            >
              <span class="material-symbols-outlined" aria-hidden="true">{{ r.icon }}</span>
              {{ G.REPORT_LABELS[r.key] }}
            </button>
          </div>

          <div class="filters">
            <div class="audit-field">
              <label class="audit-label filter-label" for="gr-range">{{ G.DATE_RANGE }}</label>
              <div class="audit-select-wrap with-lead-icon">
                <span class="material-symbols-outlined lead-icon" aria-hidden="true">calendar_today</span>
                <select id="gr-range" class="audit-control" (change)="setRange($any($event.target).value)">
                  <option *ngFor="let d of dateRanges" [value]="d" [selected]="d === filters().dateRange">
                    {{ G.DATE_RANGE_LABELS[d] }}
                  </option>
                </select>
              </div>
            </div>
            <div class="audit-field">
              <label class="audit-label filter-label" for="gr-zone">{{ G.ZONE }}</label>
              <div class="audit-select-wrap">
                <select id="gr-zone" class="audit-control" (change)="setZone($any($event.target).value)">
                  <option value="ALL" [selected]="filters().zone === 'ALL'">{{ G.ALL_ZONES }}</option>
                  <option *ngFor="let z of zones" [value]="z" [selected]="z === filters().zone">{{ z }}</option>
                </select>
              </div>
            </div>
            <div class="audit-field">
              <label class="audit-label filter-label" for="gr-status">{{ G.AUDIT_STATUS }}</label>
              <div class="audit-select-wrap">
                <select id="gr-status" class="audit-control" (change)="setStatus($any($event.target).value)">
                  <option value="ALL" [selected]="filters().status === 'ALL'">{{ G.ALL_STATUSES }}</option>
                  <option *ngFor="let s of statuses" [value]="s" [selected]="s === filters().status">
                    {{ statusLabel(s) }}
                  </option>
                </select>
              </div>
            </div>
            <div class="audit-field">
              <label class="audit-label filter-label" for="gr-type">{{ G.AUDIT_TYPE }}</label>
              <div class="audit-select-wrap">
                <select id="gr-type" class="audit-control" (change)="setType($any($event.target).value)">
                  <option value="ALL" [selected]="filters().type === 'ALL'">{{ G.ALL_TYPES }}</option>
                  <option *ngFor="let t of auditTypes" [value]="t" [selected]="t === filters().type">
                    {{ typeLabel[t] }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <section class="preview" aria-labelledby="gr-preview-title" aria-live="polite">
            <h3 id="gr-preview-title">{{ previewTitle() }}</h3>
            <dl>
              <div class="preview-row" *ngFor="let row of previewRows()">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </div>
            </dl>
            <p class="preview-note" *ngIf="showTierNote()">
              <span class="material-symbols-outlined" aria-hidden="true">info</span>
              <span>{{ G.PREVIEW_TIER_NOTE }}</span>
            </p>
          </section>

          <div class="footer">
            <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="close()">{{ G.CANCEL }}</button>
            <button type="submit" class="tohfa-btn tohfa-btn-primary-l">{{ G.GENERATE }}</button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AuditGenerateReportDialogComponent {
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly generated = new EventEmitter<AuditReportRequest>();

  protected readonly G = G;
  protected readonly reportTypes = AUDIT_REPORT_TYPES;
  protected readonly dateRanges = AUDIT_REPORT_DATE_RANGES;
  protected readonly zones = AUDIT_REPORT_ZONES;
  protected readonly statuses = AUDIT_REPORT_STATUSES;
  protected readonly auditTypes = AUDIT_REPORT_AUDIT_TYPES;
  protected readonly typeLabel = AUDIT_TYPE_LABEL;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly reportType = signal<AuditReportTypeKey>(AUDIT_REPORT_DEFAULT_TYPE);
  readonly filters = signal<AuditReportFilters>(AUDIT_REPORT_DEFAULT_FILTERS);

  readonly previewTitle = computed(() => G.previewTitle(G.REPORT_LABELS[this.reportType()]));

  readonly showTierNote = computed(
    () => this.reportType() === 'COMPLIANCE_SUMMARY' && !AUDIT_REPORT_TIERS_CONFIGURED,
  );

  readonly previewRows = computed<readonly PreviewRow[]>(() => {
    const f = this.filters();
    const b = AUDIT_REPORT_PREVIEW_BASE;
    const rangeZone =
      AUDIT_REPORT_RANGE_SHARE[f.dateRange] * (f.zone === 'ALL' ? 1 : AUDIT_REPORT_ZONE_SHARE[f.zone]);
    const share =
      rangeZone *
      (f.status === 'ALL' ? 1 : AUDIT_REPORT_STATUS_SHARE[f.status] ?? 0) *
      (f.type === 'ALL' ? 1 : AUDIT_REPORT_TYPE_SHARE[f.type]);
    const n = (base: number): number => Math.round(base * share);
    const audits = n(b.audits);
    const score = audits === 0 ? S.DASH : G.slash(b.scoreAvg, b.scoreLow, b.scoreHigh);

    const rows: PreviewRow[] = [{ label: G.PREVIEW_FILTERS, value: this.filtersLabel(f) }];
    switch (this.reportType()) {
      case 'AUDIT_SUMMARY':
        rows.push(
          { label: G.PREVIEW_AUDIT_COUNT, value: String(audits) },
          { label: G.PREVIEW_SCORE, value: score },
          { label: G.PREVIEW_FINDINGS, value: G.slash(n(b.majorFindings), n(b.minorFindings)) },
        );
        break;
      case 'FARMER_AUDIT_HISTORY':
        rows.push(
          { label: G.PREVIEW_FARMERS, value: String(n(b.farmers)) },
          { label: G.PREVIEW_AUDIT_COUNT, value: String(audits) },
          { label: G.PREVIEW_REPEAT_FARMERS, value: String(n(b.repeatFarmers)) },
        );
        break;
      case 'QUARTERLY_COVERAGE': {
        // Farms due depend on period and zone only; status / type narrow the audited side.
        const due = Math.round(b.farmsDue * rangeZone);
        const coverage = due === 0 ? S.DASH : G.percent(Math.min(100, Math.round((audits / due) * 100)));
        rows.push(
          { label: G.PREVIEW_FARMS_DUE, value: String(due) },
          { label: G.PREVIEW_FARMS_AUDITED, value: String(audits) },
          { label: G.PREVIEW_COVERAGE, value: coverage },
        );
        break;
      }
      case 'FINDINGS_VIOLATIONS':
        rows.push(
          { label: G.PREVIEW_FINDINGS, value: G.slash(n(b.majorFindings), n(b.minorFindings)) },
          { label: G.PREVIEW_OBSERVATIONS, value: String(n(b.observations)) },
          { label: G.PREVIEW_AUDITS_WITH_FINDINGS, value: String(n(b.auditsWithFindings)) },
        );
        break;
      case 'CORRECTIVE_ACTION':
        rows.push(
          { label: G.PREVIEW_CA_OPEN_CLOSED, value: G.slash(n(b.caOpen), n(b.caClosed)) },
          { label: G.PREVIEW_CA_OVERDUE, value: String(n(b.caOverdue)) },
        );
        break;
      case 'COMPLIANCE_SUMMARY':
        rows.push(
          { label: G.PREVIEW_AUDIT_COUNT, value: String(audits) },
          { label: G.PREVIEW_SCORE, value: score },
          {
            label: G.PREVIEW_TIER_CONFIG,
            value: AUDIT_REPORT_TIERS_CONFIGURED ? S.DASH : G.PREVIEW_TIER_MISSING,
          },
        );
        break;
    }
    return rows;
  });

  statusLabel(status: AuditUiStatus): string {
    return auditStatusLabel(status);
  }

  setRange(value: string): void {
    const range = AUDIT_REPORT_DATE_RANGES.find((d) => d === value);
    if (range !== undefined) this.patch({ dateRange: range });
  }

  setZone(value: string): void {
    this.patch({ zone: AUDIT_REPORT_ZONES.find((z) => z === value) ?? 'ALL' });
  }

  setStatus(value: string): void {
    this.patch({ status: AUDIT_REPORT_STATUSES.find((s) => s === value) ?? 'ALL' });
  }

  setType(value: string): void {
    this.patch({ type: AUDIT_REPORT_AUDIT_TYPES.find((t) => t === value) ?? 'ALL' });
  }

  onReportKey(event: KeyboardEvent, index: number): void {
    const count = AUDIT_REPORT_TYPES.length;
    let next: number;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else {
      const step = REPORT_KEY_STEP[event.key];
      if (step === undefined) return;
      next = (index + step + count) % count;
    }
    event.preventDefault();
    const target = AUDIT_REPORT_TYPES[next];
    if (target === undefined) return;
    this.reportType.set(target.key);
    setTimeout(() => {
      this.host.nativeElement.querySelector<HTMLElement>(`[data-report="${target.key}"]`)?.focus();
    });
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  close(): void {
    this.closed.emit();
  }

  generate(event: Event): void {
    event.preventDefault();
    this.generated.emit({ reportType: this.reportType(), filters: this.filters() });
  }

  private patch(change: Partial<AuditReportFilters>): void {
    this.filters.update((f) => ({ ...f, ...change }));
  }

  /** "This quarter · All zones", plus status / type when they narrow the report. */
  private filtersLabel(f: AuditReportFilters): string {
    const parts: string[] = [G.DATE_RANGE_LABELS[f.dateRange], f.zone === 'ALL' ? G.ALL_ZONES : f.zone];
    if (f.status !== 'ALL') parts.push(auditStatusLabel(f.status));
    if (f.type !== 'ALL') parts.push(AUDIT_TYPE_LABEL[f.type]);
    return G.filtersApplied(parts);
  }
}
