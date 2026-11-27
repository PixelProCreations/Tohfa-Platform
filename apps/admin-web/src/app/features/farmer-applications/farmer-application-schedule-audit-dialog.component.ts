/**
 * Schedule Audit dialog (SA-M3-S016c, design 59), opened from the review screen of an APPROVED
 * application.
 *
 * UI-ONLY by explicit request: no API call is made. Everything shown is the placeholder data of
 * farmer-application-review.mock.ts (Audit ID, farmer code, farm, auditor names). "Schedule Audit"
 * and "Save Draft" only report back to the review screen, which updates its own local state.
 * When this is integrated, POST /admin/audits (`audit.schedule`, BR-03) is the contract.
 */
import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogFocusDirective } from '../farmers/dialog-focus.directive';
import {
  MOCK_AUDITORS,
  MOCK_AUDIT_DATE,
  MOCK_AUDIT_DURATION_MINUTES,
  MOCK_AUDIT_ID,
  MOCK_AUDIT_START,
} from './farmer-application-review.mock';
import { APPLICATION_REVIEW_STRINGS as S } from './farmer-application-review.strings';

/** Times are India Standard Time; the confirmation text is formatted in that offset. */
const IST_OFFSET = '+05:30';

/** Smallest audit length the form accepts — form hygiene for the placeholder, not a business rule. */
const MIN_DURATION_MINUTES = 15;

/** UI-only start-time slots, 07:00–17:00 every 30 minutes. */
const START_SLOTS: ReadonlyArray<{ value: string; label: string }> = (() => {
  const slots: Array<{ value: string; label: string }> = [];
  for (let minutes = 7 * 60; minutes <= 17 * 60; minutes += 30) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const label = `${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
    slots.push({ value, label });
  }
  return slots;
})();

/** What the review screen records when the audit is scheduled locally. */
export interface LocalAuditScheduled {
  message: string;
  auditId: string;
  auditor: string;
}

@Component({
  selector: 'tohfa-farmer-application-schedule-audit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
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
        width: 100%;
        max-width: 800px;
        max-height: calc(100vh - 48px);
        overflow-y: auto;
        padding: var(--space-28);
        border-radius: var(--r-dialog-wide);
        background: var(--tohfa-surface);
        box-shadow: var(--shadow-dialog);
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .head {
        display: flex;
        align-items: flex-start;
        gap: var(--space-14);
        margin-bottom: var(--space-18);
      }
      .hero {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        flex: none;
        border-radius: var(--r-md);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-amber);
      }
      .head-text {
        flex: 1;
        min-width: 0;
      }
      .head h2 {
        margin: 0;
        font-size: var(--fs-title-dialog);
        font-weight: var(--fw-bold);
      }
      .head p {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .close {
        border: none;
        background: transparent;
        color: var(--tohfa-ink);
        cursor: pointer;
        padding: var(--space-4);
        border-radius: var(--r-xs);
      }
      .close .material-symbols-outlined {
        font-size: var(--icon-dialog-close);
      }
      .close:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      fieldset {
        margin: 0 0 var(--space-14);
        padding: 0;
        border: var(--border-card);
        border-radius: var(--r-card);
        overflow: hidden;
      }
      legend {
        float: left;
        width: 100%;
        display: flex;
        align-items: center;
        gap: var(--space-8);
        padding: var(--space-12) var(--space-14);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      legend .material-symbols-outlined {
        font-size: var(--icon-btn);
      }
      .section-body {
        clear: both;
        padding: var(--space-14);
        display: grid;
        gap: var(--space-14);
      }
      .row-3 {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--space-14);
      }
      .row-2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-14);
      }
      @media (max-width: 720px) {
        .row-3,
        .row-2 {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      .field {
        min-width: 0;
      }
      .tohfa-input.readonly {
        background: var(--tohfa-disabled-bg);
        color: var(--tohfa-slate);
        font-size: var(--fs-cell);
        font-weight: var(--fw-semi);
      }
      .lock {
        font-size: var(--icon-row-action);
        color: var(--tohfa-muted);
        vertical-align: text-top;
      }
      .error {
        margin: var(--space-6) 0 0;
        font-size: var(--fs-dense);
        color: var(--err);
      }
      .info {
        display: flex;
        gap: var(--space-8);
        align-items: flex-start;
        padding: var(--space-10) var(--space-12);
        border-radius: var(--r-sm);
        background: var(--info-bg);
        color: var(--info);
        font-size: var(--fs-dense);
      }
      .info .material-symbols-outlined {
        font-size: var(--icon-btn);
      }
      .footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-10);
        margin-top: var(--space-18);
      }
      .footer .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
      }
    `,
  ],
  template: `
    <div class="backdrop" (click)="onBackdrop($event)">
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sa-title"
        aria-describedby="sa-sub"
        tohfaDialogFocus
        (dialogClose)="close()"
      >
        <div class="head">
          <span class="hero" aria-hidden="true"><span class="material-symbols-outlined">event_available</span></span>
          <div class="head-text">
            <h2 id="sa-title">{{ S.SA_TITLE }}</h2>
            <p id="sa-sub">{{ S.SA_SUBTITLE }}</p>
          </div>
          <button type="button" class="close" (click)="close()" [attr.aria-label]="S.CLOSE">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <form (ngSubmit)="submit()" novalidate>
          <fieldset>
            <legend><span class="material-symbols-outlined" aria-hidden="true">calendar_month</span>{{ S.SA_SECTION_INFO }}</legend>
            <div class="section-body">
              <div class="field">
                <label class="tohfa-label" for="sa-id">
                  {{ S.SA_AUDIT_ID }} <span class="material-symbols-outlined lock" aria-hidden="true">lock</span>
                </label>
                <input id="sa-id" type="text" class="tohfa-input readonly" [value]="auditId" readonly />
              </div>
              <div class="row-3">
                <div class="field">
                  <label class="tohfa-label tohfa-label-required" for="sa-date">{{ S.SA_DATE }}</label>
                  <input
                    id="sa-date"
                    name="date"
                    type="date"
                    class="tohfa-input"
                    data-autofocus
                    [(ngModel)]="date"
                    [attr.aria-invalid]="showErrors() && !date"
                    [attr.aria-describedby]="showErrors() && !date ? 'sa-date-err' : null"
                  />
                  <p class="error" id="sa-date-err" *ngIf="showErrors() && !date">{{ S.SA_ERR_DATE }}</p>
                </div>
                <div class="field">
                  <label class="tohfa-label tohfa-label-required" for="sa-start">{{ S.SA_START }}</label>
                  <select
                    id="sa-start"
                    name="start"
                    class="tohfa-input"
                    [(ngModel)]="start"
                    [attr.aria-invalid]="showErrors() && !start"
                    [attr.aria-describedby]="showErrors() && !start ? 'sa-start-err' : null"
                  >
                    <option value="">{{ S.SA_START_PLACEHOLDER }}</option>
                    <option *ngFor="let slot of slots" [value]="slot.value">{{ slot.label }}</option>
                  </select>
                  <p class="error" id="sa-start-err" *ngIf="showErrors() && !start">{{ S.SA_ERR_START }}</p>
                </div>
                <div class="field">
                  <label class="tohfa-label" for="sa-duration">{{ S.SA_DURATION }}</label>
                  <input
                    id="sa-duration"
                    name="duration"
                    type="number"
                    class="tohfa-input"
                    [min]="minDuration"
                    step="15"
                    [(ngModel)]="duration"
                    [attr.aria-invalid]="showErrors() && !durationValid()"
                    [attr.aria-describedby]="showErrors() && !durationValid() ? 'sa-duration-err' : null"
                  />
                  <p class="error" id="sa-duration-err" *ngIf="showErrors() && !durationValid()">{{ S.SA_ERR_DURATION }}</p>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend><span class="material-symbols-outlined" aria-hidden="true">person</span>{{ S.SA_SECTION_FARMER }}</legend>
            <div class="section-body">
              <div class="row-2">
                <div class="field">
                  <label class="tohfa-label tohfa-label-required" for="sa-farmer">{{ S.SA_FARMER }}</label>
                  <select id="sa-farmer" name="farmer" class="tohfa-input" [(ngModel)]="farmer">
                    <option [value]="farmerCode">{{ S.SA_FARMER_OPTION(fullName, farmerCode) }}</option>
                  </select>
                </div>
                <div class="field">
                  <label class="tohfa-label tohfa-label-required" for="sa-farm">{{ S.SA_FARM }}</label>
                  <select id="sa-farm" name="farm" class="tohfa-input" [(ngModel)]="farm">
                    <option [value]="farmName">{{ S.SA_FARM_OPTION(farmName, zone, zoneCode) }}</option>
                  </select>
                </div>
              </div>
              <div class="info">
                <span class="material-symbols-outlined" aria-hidden="true">info</span>
                <span>{{ S.SA_FARMER_NOTE }}</span>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend><span class="material-symbols-outlined" aria-hidden="true">groups</span>{{ S.SA_SECTION_AUDITOR }}</legend>
            <div class="section-body">
              <div class="field">
                <label class="tohfa-label tohfa-label-required" for="sa-auditor">{{ S.SA_AUDITOR }}</label>
                <select
                  id="sa-auditor"
                  name="auditor"
                  class="tohfa-input"
                  [(ngModel)]="auditor"
                  [attr.aria-invalid]="showErrors() && !auditor"
                  [attr.aria-describedby]="showErrors() && !auditor ? 'sa-auditor-err' : null"
                >
                  <option *ngFor="let name of auditors" [value]="name">{{ name }}</option>
                </select>
                <p class="error" id="sa-auditor-err" *ngIf="showErrors() && !auditor">{{ S.SA_ERR_AUDITOR }}</p>
              </div>
            </div>
          </fieldset>

          <div class="footer">
            <button type="submit" class="tohfa-btn tohfa-btn-primary-l">
              <span class="material-symbols-outlined" aria-hidden="true">event_available</span>{{ S.SA_SUBMIT }}
            </button>
            <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="saveDraft()">{{ S.SA_SAVE_DRAFT }}</button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class FarmerApplicationScheduleAuditDialogComponent implements OnInit {
  @Input({ required: true }) fullName = '';
  /** Placeholder farmer code from the mock record ("FMR-00101"). */
  @Input({ required: true }) farmerCode = '';
  @Input({ required: true }) farmName = '';
  @Input({ required: true }) zone = '';
  @Input({ required: true }) zoneCode = '';

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly scheduled = new EventEmitter<LocalAuditScheduled>();
  @Output() readonly drafted = new EventEmitter<string>();

  protected readonly S = S;
  protected readonly slots = START_SLOTS;
  protected readonly auditors = MOCK_AUDITORS;
  protected readonly auditId = MOCK_AUDIT_ID;
  protected readonly minDuration = MIN_DURATION_MINUTES;

  readonly showErrors = signal(false);

  date = MOCK_AUDIT_DATE;
  start = MOCK_AUDIT_START;
  duration: number | null = MOCK_AUDIT_DURATION_MINUTES;
  auditor = MOCK_AUDITORS[0] ?? '';
  /** Single-option selects, bound so the design's prefilled value shows as selected. */
  farmer = '';
  farm = '';

  ngOnInit(): void {
    this.farmer = this.farmerCode;
    this.farm = this.farmName;
  }

  durationValid(): boolean {
    return typeof this.duration === 'number' && Number.isFinite(this.duration) && this.duration >= MIN_DURATION_MINUTES;
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    this.showErrors.set(true);
    if (!this.date || !this.start || !this.durationValid() || !this.auditor) return;
    const instant = new Date(`${this.date}T${this.start}:00${IST_OFFSET}`);
    const when = formatDate(instant, 'dd MMM yyyy, hh:mm a', 'en-US', IST_OFFSET);
    this.scheduled.emit({ message: S.SA_SCHEDULED(when), auditId: this.auditId, auditor: this.auditor });
  }

  /** A draft needs no validation; it only closes the dialog with a confirmation. */
  saveDraft(): void {
    this.drafted.emit(S.SA_DRAFT_SAVED);
  }
}
