/**
 * Audit inspection step 5 — Soil Testing & Soil Report (design 83). UI ONLY.
 *
 * One card: Soil Report Availability (required), a local "Upload file" picker for the report (type /
 * size checked, never uploaded), the "Reported Soil Parameters" area with notes, and on the right
 * the plot / zone and laboratory type-ahead inputs (native <datalist>), Report Verification Status
 * and Test Date.
 *
 * Reported parameters are never typed in: they appear only as read from an uploaded report (no
 * fixed parameter list). Nothing reads reports here, so the area always shows its empty state. When
 * integrated the report goes to `POST /uploads` (UploadPurpose.SOIL_TEST_REPORT,
 * db/migrations/0021_soil_management.sql) and the classification of values is BR-40's.
 *
 * Primary ("Save", as design 83 labels it) validates locally and goes to step 6; Save as Draft only
 * shows the demo message.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AUDIT_ROUTES } from './audit-nav';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AuditStepFileDropComponent } from './audit-step-1-6-file-drop.component';
import {
  AUDIT_STEP_DEFAULT_AUDIT_ID,
  AUDIT_STEP_NOTES_MAX,
  AUDIT_STEPS_1_6_STYLES,
  auditStepFocusFirstInvalid,
  auditStepRouteId,
} from './audit-step-1-6-shared';
import { AUDIT_STEP_COMMON_STRINGS as C } from './audit-step-1-6-shared.strings';
import { AUDIT_STEP5_STRINGS as T } from './audit-step-5-soil.strings';
import { AuditStepShellComponent } from './audit-step-shell.component';
import {
  AUDIT_STEP5_LAB_OPTIONS,
  AUDIT_STEP5_REPORT_AVAILABILITY_OPTIONS,
  AUDIT_STEP5_REPORT_VERIFICATION_OPTIONS,
  mockAuditStepExtras,
  type AuditStepProfileExtras,
} from './audit-steps-1-6.mock';
import { mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditDetailRecord } from './audit.types';

const STEP = 5;
const ID_AVAILABILITY = 's5-availability';

interface Step5Form {
  availability: string;
  notes: string;
  plotZone: string;
  verification: string;
  testDate: string;
  laboratory: string;
}

function emptyForm(): Step5Form {
  return { availability: '', notes: '', plotZone: '', verification: '', testDate: '', laboratory: '' };
}

@Component({
  selector: 'tohfa-audit-step-5-soil',
  standalone: true,
  imports: [CommonModule, FormsModule, AuditStepShellComponent, AuditStepFileDropComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    AUDIT_STEPS_1_6_STYLES,
    `
      .params-box {
        display: flex;
        flex-direction: column;
        gap: var(--space-8);
        padding: var(--space-12);
        border: var(--border-input);
        border-radius: var(--tohfa-radius-input);
      }
      .params-box .audit-empty-icon {
        color: var(--tohfa-slate);
      }
      .params-box textarea.audit-control {
        min-height: calc(var(--space-32) * 2);
      }
    `,
  ],
  template: `
    <tohfa-audit-step-shell
      [title]="S.SECTION_5"
      icon="science"
      [auditId]="audit().id"
      [farmerName]="audit().farmerName"
      [stepLabel]="T.STEP_PILL"
      [backLink]="routes.inspection(audit().id)"
      [primaryLabel]="S.SHELL_SAVE"
      (primary)="onSave()"
    >
      <div class="step-error-summary" role="alert" *ngIf="errorList().length > 0">
        {{ C.errorSummaryAnnounce(errorList().length) }}
        <ul>
          <li *ngFor="let e of errorList()">
            <a [href]="'#' + e.id" (click)="focusField($event, e.id)">{{ e.message }}</a>
          </li>
        </ul>
      </div>

      <section class="audit-card" aria-labelledby="s5-head">
        <h2 class="audit-card-head" id="s5-head">
          <span class="material-symbols-outlined" aria-hidden="true">science</span>
          {{ S.SECTION_5 }}
        </h2>
        <div class="audit-card-body">
          <div class="step-cols">
            <div class="step-fields">
              <div class="audit-field">
                <label class="audit-label required" [for]="idAvailability">{{ T.REPORT_AVAILABILITY }}</label>
                <div class="audit-select-wrap">
                  <select
                    class="audit-control"
                    required
                    aria-required="true"
                    [id]="idAvailability"
                    [class.is-placeholder]="form.availability === ''"
                    [attr.aria-invalid]="errors()[idAvailability] ? 'true' : null"
                    [attr.aria-describedby]="errors()[idAvailability] ? idAvailability + '-error' : null"
                    [(ngModel)]="form.availability"
                    (ngModelChange)="revalidate()"
                  >
                    <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                    <option *ngFor="let o of availabilityOptions" [value]="o.value">{{ o.label }}</option>
                  </select>
                </div>
                <p class="audit-field-error" [id]="idAvailability + '-error'" *ngIf="errors()[idAvailability]">
                  {{ errors()[idAvailability] }}
                </p>
              </div>

              <div class="audit-field">
                <label class="audit-label" for="s5-report">{{ T.REPORT_DOCUMENT }}</label>
                <tohfa-audit-step-file-drop inputId="s5-report" variant="button"></tohfa-audit-step-file-drop>
              </div>

              <div class="audit-field">
                <span class="audit-label" id="s5-params-label">{{ T.REPORTED_PARAMETERS }}</span>
                <div class="params-box" role="group" aria-labelledby="s5-params-label">
                  <div class="audit-empty">
                    <span class="material-symbols-outlined audit-empty-icon" aria-hidden="true">science</span>
                    <p class="audit-empty-title">{{ T.NO_PARAMETERS_TITLE }}</p>
                    <p class="audit-empty-hint">{{ T.NO_PARAMETERS_HINT }}</p>
                  </div>
                  <label class="audit-label" for="s5-notes">{{ T.NOTES }}</label>
                  <textarea
                    id="s5-notes"
                    class="audit-control"
                    [placeholder]="C.NOTES_PLACEHOLDER"
                    [maxLength]="notesMax"
                    aria-describedby="s5-notes-count"
                    [(ngModel)]="form.notes"
                  ></textarea>
                  <p class="audit-counter" id="s5-notes-count" [attr.aria-label]="C.counterLabel(form.notes.length, notesMax)">
                    {{ C.counter(form.notes.length, notesMax) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="step-fields">
              <div class="audit-field">
                <label class="audit-label" for="s5-plot">{{ T.PLOT_ZONE }}</label>
                <div class="audit-input-icon-wrap">
                  <input
                    id="s5-plot"
                    class="audit-control"
                    type="text"
                    list="s5-plot-list"
                    autocomplete="off"
                    [placeholder]="C.SELECT_PLACEHOLDER"
                    [(ngModel)]="form.plotZone"
                  />
                  <span class="material-symbols-outlined audit-input-icon" aria-hidden="true">search</span>
                </div>
                <datalist id="s5-plot-list">
                  <option *ngFor="let p of extras().plotOptions" [value]="p"></option>
                </datalist>
              </div>

              <div class="audit-field">
                <label class="audit-label" for="s5-verification">{{ T.REPORT_VERIFICATION }}</label>
                <div class="audit-select-wrap">
                  <select
                    id="s5-verification"
                    class="audit-control"
                    [class.is-placeholder]="form.verification === ''"
                    [(ngModel)]="form.verification"
                  >
                    <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                    <option *ngFor="let o of verificationOptions" [value]="o.value">{{ o.label }}</option>
                  </select>
                </div>
              </div>

              <div class="audit-field">
                <label class="audit-label" for="s5-test-date">{{ T.TEST_DATE }}</label>
                <input id="s5-test-date" class="audit-control" type="date" [(ngModel)]="form.testDate" />
              </div>

              <div class="audit-field">
                <label class="audit-label" for="s5-lab">{{ T.LABORATORY }}</label>
                <div class="audit-input-icon-wrap">
                  <input
                    id="s5-lab"
                    class="audit-control"
                    type="text"
                    list="s5-lab-list"
                    autocomplete="off"
                    [placeholder]="C.SELECT_PLACEHOLDER"
                    [(ngModel)]="form.laboratory"
                  />
                  <span class="material-symbols-outlined audit-input-icon" aria-hidden="true">search</span>
                </div>
                <datalist id="s5-lab-list">
                  <option *ngFor="let o of labOptions" [value]="o.label"></option>
                </datalist>
              </div>
            </div>
          </div>
        </div>
      </section>
    </tohfa-audit-step-shell>
  `,
})
export class AuditStep5SoilComponent {
  readonly S = S;
  readonly T = T;
  readonly C = C;
  readonly routes = AUDIT_ROUTES;
  readonly notesMax = AUDIT_STEP_NOTES_MAX;
  readonly idAvailability = ID_AVAILABILITY;
  readonly availabilityOptions = AUDIT_STEP5_REPORT_AVAILABILITY_OPTIONS;
  readonly verificationOptions = AUDIT_STEP5_REPORT_VERIFICATION_OPTIONS;
  readonly labOptions = AUDIT_STEP5_LAB_OPTIONS;

  @ViewChild(AuditStepShellComponent) private shell?: AuditStepShellComponent;

  private readonly router = inject(Router);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly audit = signal<AuditDetailRecord>(mockAuditById(AUDIT_STEP_DEFAULT_AUDIT_ID));
  readonly extras = signal<AuditStepProfileExtras>(mockAuditStepExtras(AUDIT_STEP_DEFAULT_AUDIT_ID, []));
  form: Step5Form = emptyForm();
  readonly errors = signal<Readonly<Record<string, string>>>({});
  readonly errorList = computed(() => {
    const message = this.errors()[ID_AVAILABILITY];
    return message === undefined ? [] : [{ id: ID_AVAILABILITY, message }];
  });
  private submitted = false;

  constructor() {
    auditStepRouteId((id) => {
      const audit = mockAuditById(id);
      this.audit.set(audit);
      this.extras.set(mockAuditStepExtras(audit.id, audit.plotIds));
      this.form = emptyForm();
      this.submitted = false;
      this.errors.set({});
    });
  }

  private validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (this.form.availability === '') errors[ID_AVAILABILITY] = T.ERROR_REPORT_AVAILABILITY;
    return errors;
  }

  revalidate(): void {
    if (this.submitted) this.errors.set(this.validate());
  }

  focusField(event: Event, id: string): void {
    event.preventDefault();
    this.host.nativeElement.querySelector<HTMLElement>(`#${id}`)?.focus();
  }

  onSave(): void {
    this.submitted = true;
    const errors = this.validate();
    this.errors.set(errors);
    if (Object.keys(errors).length > 0) {
      // The shell already announced "Saved"; withdraw it — the role="alert" summary speaks instead.
      this.shell?.clearStatus();
      auditStepFocusFirstInvalid(this.host.nativeElement);
      return;
    }
    void this.router.navigateByUrl(AUDIT_ROUTES.step(this.audit().id, STEP + 1));
  }
}
