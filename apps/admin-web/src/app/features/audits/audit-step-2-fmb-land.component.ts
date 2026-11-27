/**
 * Audit inspection step 2 — FMB & Land Verification (design 80). UI ONLY.
 *
 * Left: the FMB sketch on file (its "View" is inert — no document viewer exists), a local
 * "Upload / Replace FMB Sketch" drop zone, notes (500 characters) and a multi-file "Supporting
 * Evidence" drop zone. Files are only chosen locally (type / size checked), never uploaded.
 * Right: survey reference number and six verification selects; "FMB Document Available" is required.
 *
 * Save & Next validates locally and goes to step 3; Save as Draft only shows the demo message.
 * When integrated: files go to `POST /uploads`, answers to an audit-section endpoint that
 * docs/openapi.yaml does not define yet (spec gap — see audit-steps-1-6.mock.ts).
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
  type AuditStepOption,
} from './audit-step-1-6-shared';
import { AUDIT_STEP_COMMON_STRINGS as C } from './audit-step-1-6-shared.strings';
import { AUDIT_STEP2_STRINGS as T } from './audit-step-2-fmb-land.strings';
import { AuditStepShellComponent } from './audit-step-shell.component';
import {
  AUDIT_STEP2_BOUNDARY_OPTIONS,
  AUDIT_STEP2_FMB_AVAILABLE_OPTIONS,
  AUDIT_STEP2_LAND_BOUNDARY_OPTIONS,
  AUDIT_STEP2_LEGIBILITY_OPTIONS,
  AUDIT_STEP2_LOCATION_OPTIONS,
  AUDIT_STEP2_PLOT_MAPPING_OPTIONS,
  mockAuditStepExtras,
  type AuditStepProfileExtras,
} from './audit-steps-1-6.mock';
import { mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditDetailRecord } from './audit.types';

const STEP = 2;

type Step2SelectKey =
  | 'fmbAvailable'
  | 'legibility'
  | 'boundary'
  | 'location'
  | 'plotMapping'
  | 'landBoundary';

interface Step2Select {
  readonly key: Step2SelectKey;
  readonly id: string;
  readonly label: string;
  readonly options: readonly AuditStepOption[];
  readonly required: boolean;
  readonly error: string;
}

/** Design 80, top to bottom. */
const SELECTS: readonly Step2Select[] = [
  { key: 'fmbAvailable', id: 's2-fmb-available', label: T.FMB_AVAILABLE, options: AUDIT_STEP2_FMB_AVAILABLE_OPTIONS, required: true, error: T.ERROR_FMB_AVAILABLE },
  { key: 'legibility', id: 's2-legibility', label: T.LEGIBILITY, options: AUDIT_STEP2_LEGIBILITY_OPTIONS, required: false, error: '' },
  { key: 'boundary', id: 's2-boundary', label: T.BOUNDARY, options: AUDIT_STEP2_BOUNDARY_OPTIONS, required: false, error: '' },
  { key: 'location', id: 's2-location', label: T.LOCATION, options: AUDIT_STEP2_LOCATION_OPTIONS, required: false, error: '' },
  { key: 'plotMapping', id: 's2-plot-mapping', label: T.PLOT_MAPPING, options: AUDIT_STEP2_PLOT_MAPPING_OPTIONS, required: false, error: '' },
  { key: 'landBoundary', id: 's2-land-boundary', label: T.LAND_BOUNDARY, options: AUDIT_STEP2_LAND_BOUNDARY_OPTIONS, required: false, error: '' },
];

interface Step2Form {
  surveyNumber: string;
  notes: string;
  selects: Record<Step2SelectKey, string>;
}

function emptyForm(surveyNumber: string | null): Step2Form {
  return {
    surveyNumber: surveyNumber ?? '',
    notes: '',
    selects: { fmbAvailable: '', legibility: '', boundary: '', location: '', plotMapping: '', landBoundary: '' },
  };
}

@Component({
  selector: 'tohfa-audit-step-2-fmb-land',
  standalone: true,
  imports: [CommonModule, FormsModule, AuditStepShellComponent, AuditStepFileDropComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    AUDIT_STEPS_1_6_STYLES,
    `
      .upload-label {
        color: var(--info);
      }
    `,
  ],
  template: `
    <tohfa-audit-step-shell
      [title]="S.SECTION_2"
      icon="verified_user"
      [auditId]="audit().id"
      [farmerName]="audit().farmerName"
      [stepLabel]="T.STEP_PILL"
      [backLink]="routes.inspection(audit().id)"
      [primaryLabel]="S.SHELL_SAVE_NEXT"
      primaryIcon="arrow_forward"
      (primary)="onSaveNext()"
    >
      <div class="step-error-summary" role="alert" *ngIf="errorList().length > 0">
        {{ C.errorSummaryAnnounce(errorList().length) }}
        <ul>
          <li *ngFor="let e of errorList()">
            <a [href]="'#' + e.id" (click)="focusField($event, e.id)">{{ e.message }}</a>
          </li>
        </ul>
      </div>

      <div class="step-cols">
        <div class="step-col">
          <section class="audit-card step-card" aria-labelledby="s2-fmb-head">
            <h2 class="audit-card-head" id="s2-fmb-head">
              <span class="material-symbols-outlined" aria-hidden="true">map</span>
              {{ T.CARD_FMB }}
            </h2>
            <div class="step-card-body">
              <div class="step-doc-row" *ngIf="extras().fmbFile as fmb; else noFmb">
                <span class="step-doc-name">
                  <span class="material-symbols-outlined" aria-hidden="true">description</span>
                  <span>
                    <span class="step-doc-title">{{ T.FMB_FILE_TITLE }}</span>
                    <span class="step-doc-sub">{{ fmb.name }} ({{ C.fileSize(fmb.sizeBytes) }})</span>
                  </span>
                </span>
                <button
                  type="button"
                  class="step-view-btn"
                  aria-disabled="true"
                  [attr.aria-label]="T.viewFmbLabel(fmb.name)"
                  [title]="C.NOT_AVAILABLE_YET"
                >
                  <span class="material-symbols-outlined" aria-hidden="true">visibility</span>
                  {{ C.VIEW }}
                </button>
              </div>
              <ng-template #noFmb>
                <p class="audit-helper">{{ T.FMB_NONE }}</p>
              </ng-template>

              <div class="audit-field">
                <label class="audit-label upload-label" for="s2-fmb-upload">{{ T.UPLOAD_REPLACE }}</label>
                <tohfa-audit-step-file-drop inputId="s2-fmb-upload"></tohfa-audit-step-file-drop>
              </div>
            </div>
          </section>

          <section class="audit-card step-card" aria-labelledby="s2-notes-head">
            <h2 class="audit-card-head" id="s2-notes-head">
              <span class="material-symbols-outlined" aria-hidden="true">description</span>
              {{ T.CARD_NOTES }}
            </h2>
            <div class="step-card-body">
              <div class="audit-field">
                <label class="sr-only" for="s2-notes">{{ T.NOTES_LABEL }}</label>
                <textarea
                  id="s2-notes"
                  class="audit-control"
                  [placeholder]="C.NOTES_PLACEHOLDER"
                  [maxLength]="notesMax"
                  aria-describedby="s2-notes-count"
                  [(ngModel)]="form.notes"
                ></textarea>
                <p class="audit-counter" id="s2-notes-count" [attr.aria-label]="C.counterLabel(form.notes.length, notesMax)">
                  {{ C.counter(form.notes.length, notesMax) }}
                </p>
              </div>
            </div>
          </section>

          <section class="audit-card step-card" aria-labelledby="s2-evidence-head">
            <h2 class="audit-card-head" id="s2-evidence-head">
              <span class="material-symbols-outlined" aria-hidden="true">attach_file</span>
              {{ T.CARD_EVIDENCE }}
            </h2>
            <div class="step-card-body">
              <label class="sr-only" for="s2-evidence">{{ T.EVIDENCE_LABEL }}</label>
              <tohfa-audit-step-file-drop
                inputId="s2-evidence"
                [title]="T.EVIDENCE_TITLE"
                [multiple]="true"
              ></tohfa-audit-step-file-drop>
            </div>
          </section>
        </div>

        <section class="audit-card step-card" aria-labelledby="s2-land-head">
          <h2 class="audit-card-head" id="s2-land-head">
            <span class="material-symbols-outlined" aria-hidden="true">landscape</span>
            {{ T.CARD_LAND }}
          </h2>
          <div class="step-card-body">
            <div class="audit-field">
              <label class="audit-label" for="s2-survey">{{ T.SURVEY_NUMBER }}</label>
              <input
                id="s2-survey"
                class="audit-control"
                type="text"
                [placeholder]="T.SURVEY_PLACEHOLDER"
                aria-describedby="s2-survey-help"
                [(ngModel)]="form.surveyNumber"
              />
              <p class="audit-helper" id="s2-survey-help">
                {{ extras().surveyNumber === null ? T.SURVEY_NOT_ON_RECORD : T.surveyOnRecord(extras().surveyNumber ?? '') }}
              </p>
            </div>

            <div class="audit-field" *ngFor="let f of selects">
              <label class="audit-label" [class.required]="f.required" [for]="f.id">{{ f.label }}</label>
              <div class="audit-select-wrap">
                <select
                  class="audit-control"
                  [id]="f.id"
                  [required]="f.required"
                  [attr.aria-required]="f.required ? 'true' : null"
                  [class.is-placeholder]="form.selects[f.key] === ''"
                  [attr.aria-invalid]="errors()[f.id] ? 'true' : null"
                  [attr.aria-describedby]="errors()[f.id] ? f.id + '-error' : null"
                  [(ngModel)]="form.selects[f.key]"
                  (ngModelChange)="revalidate()"
                >
                  <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                  <option *ngFor="let o of f.options" [value]="o.value">{{ o.label }}</option>
                </select>
              </div>
              <p class="audit-field-error" [id]="f.id + '-error'" *ngIf="errors()[f.id]">{{ errors()[f.id] }}</p>
            </div>
          </div>
        </section>
      </div>
    </tohfa-audit-step-shell>
  `,
})
export class AuditStep2FmbLandComponent {
  readonly S = S;
  readonly T = T;
  readonly C = C;
  readonly routes = AUDIT_ROUTES;
  readonly notesMax = AUDIT_STEP_NOTES_MAX;
  readonly selects = SELECTS;

  @ViewChild(AuditStepShellComponent) private shell?: AuditStepShellComponent;

  private readonly router = inject(Router);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly audit = signal<AuditDetailRecord>(mockAuditById(AUDIT_STEP_DEFAULT_AUDIT_ID));
  readonly extras = signal<AuditStepProfileExtras>(mockAuditStepExtras(AUDIT_STEP_DEFAULT_AUDIT_ID, []));
  form: Step2Form = emptyForm(null);
  /** Error message by control id. */
  readonly errors = signal<Readonly<Record<string, string>>>({});
  readonly errorList = computed(() =>
    SELECTS.filter((f) => this.errors()[f.id] !== undefined).map((f) => ({
      id: f.id,
      message: this.errors()[f.id] ?? '',
    })),
  );
  private submitted = false;

  constructor() {
    auditStepRouteId((id) => {
      const audit = mockAuditById(id);
      const extras = mockAuditStepExtras(audit.id, audit.plotIds);
      this.audit.set(audit);
      this.extras.set(extras);
      this.form = emptyForm(extras.surveyNumber);
      this.submitted = false;
      this.errors.set({});
    });
  }

  private validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const f of SELECTS) {
      if (f.required && this.form.selects[f.key] === '') errors[f.id] = f.error;
    }
    return errors;
  }

  revalidate(): void {
    if (this.submitted) this.errors.set(this.validate());
  }

  focusField(event: Event, id: string): void {
    event.preventDefault();
    this.host.nativeElement.querySelector<HTMLElement>(`#${id}`)?.focus();
  }

  onSaveNext(): void {
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
