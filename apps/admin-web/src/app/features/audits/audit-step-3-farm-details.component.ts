/**
 * Audit inspection step 3 — Farm Details Verification (design 81). UI ONLY.
 *
 * Read-only farm profile (name, farm id, location, GPS, area — from mockAuditById), then the
 * auditor's observations: farming type (with the profile value as helper), crops grown (multi-select
 * disclosure of checkboxes), plot / zone and water source (type-ahead inputs backed by a native
 * <datalist>), irrigation type, farm records availability, the required "Farm Details Verification"
 * and notes. Local state only.
 *
 * Save & Next validates locally and goes to step 4; Save as Draft only shows the demo message.
 * When integrated: answers go to an audit-section endpoint docs/openapi.yaml does not define yet
 * (spec gap — see audit-steps-1-6.mock.ts); the profile is never edited from here.
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
import {
  AUDIT_STEP_DEFAULT_AUDIT_ID,
  AUDIT_STEP_NOTES_MAX,
  AUDIT_STEPS_1_6_STYLES,
  auditStepFocusFirstInvalid,
  auditStepOptionLabel,
  auditStepRouteId,
} from './audit-step-1-6-shared';
import { AUDIT_STEP_COMMON_STRINGS as C } from './audit-step-1-6-shared.strings';
import { AUDIT_STEP3_STRINGS as T } from './audit-step-3-farm-details.strings';
import { AuditStepShellComponent } from './audit-step-shell.component';
import {
  AUDIT_STEP3_CROP_OPTIONS,
  AUDIT_STEP3_DETAILS_VERIFICATION_OPTIONS,
  AUDIT_STEP3_FARMING_TYPE_OPTIONS,
  AUDIT_STEP3_IRRIGATION_OPTIONS,
  AUDIT_STEP3_RECORDS_OPTIONS,
  AUDIT_STEP_WATER_SOURCE_OPTIONS,
  mockAuditStepExtras,
  type AuditStepProfileExtras,
} from './audit-steps-1-6.mock';
import { mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditDetailRecord } from './audit.types';

const STEP = 3;

interface Step3Form {
  farmingType: string;
  crops: string[];
  plotZone: string;
  waterSource: string;
  irrigation: string;
  records: string;
  detailsVerification: string;
  notes: string;
}

function emptyForm(): Step3Form {
  return {
    farmingType: '',
    crops: [],
    plotZone: '',
    waterSource: '',
    irrigation: '',
    records: '',
    detailsVerification: '',
    notes: '',
  };
}

const ID_DETAILS_VERIFICATION = 's3-details-verification';

@Component({
  selector: 'tohfa-audit-step-3-farm-details',
  standalone: true,
  imports: [CommonModule, FormsModule, AuditStepShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    AUDIT_STEPS_1_6_STYLES,
    `
      .multi-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-8);
        text-align: left;
        cursor: pointer;
      }
      .multi-trigger.is-placeholder .multi-value {
        color: var(--tohfa-muted);
      }
      .multi-value {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .multi-trigger .material-symbols-outlined {
        flex: none;
        font-size: var(--icon-input);
        color: var(--tohfa-slate);
      }
      .multi-panel {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-8) var(--space-16);
        margin: 0;
        padding: var(--space-10) var(--space-12);
        border: var(--border-card);
        border-radius: var(--tohfa-radius-input);
        background: var(--tohfa-surface);
      }
      .multi-panel legend {
        padding: 0;
        float: left;
        width: 100%;
        margin-bottom: var(--space-4);
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .multi-option {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
        min-height: calc(var(--space-14) * 2);
        font-size: var(--fs-dense);
        cursor: pointer;
      }
      .multi-option input {
        accent-color: var(--tohfa-amber);
      }
    `,
  ],
  template: `
    <tohfa-audit-step-shell
      [title]="S.SECTION_3"
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
          <section class="audit-card step-card" aria-labelledby="s3-profile-head">
            <h2 class="audit-card-head" id="s3-profile-head">
              <span class="material-symbols-outlined" aria-hidden="true">person</span>
              {{ T.CARD_PROFILE }}
            </h2>
            <div class="step-card-body">
              <dl class="audit-kv">
                <div class="audit-kv-row step-kv-row" *ngFor="let row of profileRows()">
                  <dt class="audit-kv-label">
                    {{ row.label }}
                    <span class="material-symbols-outlined step-lock" role="img" [attr.aria-label]="C.LOCKED">lock</span>
                  </dt>
                  <dd class="audit-kv-value">{{ row.value }}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section class="audit-card step-card" aria-labelledby="s3-details-head">
            <h2 class="audit-card-head" id="s3-details-head">
              <span class="material-symbols-outlined" aria-hidden="true">eco</span>
              {{ T.CARD_DETAILS }}
            </h2>
            <div class="step-card-body">
              <div class="audit-field">
                <label class="audit-label" for="s3-farming-type">{{ T.FARMING_TYPE }}</label>
                <div class="audit-select-wrap">
                  <select
                    id="s3-farming-type"
                    class="audit-control"
                    aria-describedby="s3-farming-type-help"
                    [class.is-placeholder]="form.farmingType === ''"
                    [(ngModel)]="form.farmingType"
                  >
                    <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                    <option *ngFor="let o of farmingTypeOptions" [value]="o.value">{{ o.label }}</option>
                  </select>
                </div>
                <p class="audit-helper" id="s3-farming-type-help">{{ profileFarmingTypeHelp() }}</p>
              </div>

              <div class="audit-field">
                <span class="audit-label" id="s3-crops-label">{{ T.CROPS }}</span>
                <button
                  type="button"
                  id="s3-crops"
                  class="audit-control multi-trigger"
                  [class.is-placeholder]="form.crops.length === 0"
                  aria-labelledby="s3-crops-label s3-crops"
                  aria-controls="s3-crops-panel"
                  [attr.aria-expanded]="cropsOpen()"
                  (click)="cropsOpen.set(!cropsOpen())"
                  (keydown.escape)="cropsOpen.set(false)"
                >
                  <span class="multi-value">{{ cropsSummary() }}</span>
                  <span class="material-symbols-outlined" aria-hidden="true">tune</span>
                </button>
                <fieldset
                  class="multi-panel"
                  id="s3-crops-panel"
                  *ngIf="cropsOpen()"
                  (keydown.escape)="closeCrops()"
                >
                  <legend>{{ T.CROPS_OPTIONS_LABEL }}</legend>
                  <label class="multi-option" *ngFor="let o of cropOptions">
                    <input
                      type="checkbox"
                      [checked]="form.crops.includes(o.value)"
                      (change)="toggleCrop(o.value)"
                    />
                    {{ o.label }}
                  </label>
                </fieldset>
              </div>

              <div class="audit-field">
                <label class="audit-label" for="s3-plot">{{ T.PLOT_ZONE }}</label>
                <div class="audit-input-icon-wrap">
                  <input
                    id="s3-plot"
                    class="audit-control"
                    type="text"
                    list="s3-plot-list"
                    autocomplete="off"
                    [placeholder]="C.SELECT_PLACEHOLDER"
                    [(ngModel)]="form.plotZone"
                  />
                  <span class="material-symbols-outlined audit-input-icon" aria-hidden="true">search</span>
                </div>
                <datalist id="s3-plot-list">
                  <option *ngFor="let p of extras().plotOptions" [value]="p"></option>
                </datalist>
              </div>

              <div class="audit-field">
                <label class="audit-label" for="s3-water">{{ T.WATER_SOURCE }}</label>
                <div class="audit-input-icon-wrap">
                  <input
                    id="s3-water"
                    class="audit-control"
                    type="text"
                    list="s3-water-list"
                    autocomplete="off"
                    [placeholder]="C.SELECT_PLACEHOLDER"
                    [(ngModel)]="form.waterSource"
                  />
                  <span class="material-symbols-outlined audit-input-icon" aria-hidden="true">search</span>
                </div>
                <datalist id="s3-water-list">
                  <option *ngFor="let o of waterSourceOptions" [value]="o.label"></option>
                </datalist>
              </div>
            </div>
          </section>
        </div>

        <div class="step-col">
          <section class="audit-card step-card" aria-labelledby="s3-infra-head">
            <h2 class="audit-card-head" id="s3-infra-head">
              <span class="material-symbols-outlined" aria-hidden="true">settings</span>
              {{ T.CARD_INFRA }}
            </h2>
            <div class="step-card-body">
              <div class="audit-field">
                <label class="audit-label" for="s3-irrigation">{{ T.IRRIGATION }}</label>
                <div class="audit-select-wrap">
                  <select
                    id="s3-irrigation"
                    class="audit-control"
                    [class.is-placeholder]="form.irrigation === ''"
                    [(ngModel)]="form.irrigation"
                  >
                    <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                    <option *ngFor="let o of irrigationOptions" [value]="o.value">{{ o.label }}</option>
                  </select>
                </div>
              </div>
              <div class="audit-field">
                <label class="audit-label" for="s3-records">{{ T.RECORDS }}</label>
                <div class="audit-select-wrap">
                  <select
                    id="s3-records"
                    class="audit-control"
                    [class.is-placeholder]="form.records === ''"
                    [(ngModel)]="form.records"
                  >
                    <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                    <option *ngFor="let o of recordsOptions" [value]="o.value">{{ o.label }}</option>
                  </select>
                </div>
              </div>
              <div class="audit-field">
                <label class="audit-label required" [for]="idDetails">{{ T.DETAILS_VERIFICATION }}</label>
                <div class="audit-select-wrap">
                  <select
                    class="audit-control"
                    required
                    aria-required="true"
                    [id]="idDetails"
                    [class.is-placeholder]="form.detailsVerification === ''"
                    [attr.aria-invalid]="errors()[idDetails] ? 'true' : null"
                    [attr.aria-describedby]="errors()[idDetails] ? idDetails + '-error' : null"
                    [(ngModel)]="form.detailsVerification"
                    (ngModelChange)="revalidate()"
                  >
                    <option value="">{{ C.SELECT_PLACEHOLDER }}</option>
                    <option *ngFor="let o of detailsVerificationOptions" [value]="o.value">{{ o.label }}</option>
                  </select>
                </div>
                <p class="audit-field-error" [id]="idDetails + '-error'" *ngIf="errors()[idDetails]">
                  {{ errors()[idDetails] }}
                </p>
              </div>
            </div>
          </section>

          <section class="audit-card step-card" aria-labelledby="s3-notes-head">
            <h2 class="audit-card-head" id="s3-notes-head">
              <span class="material-symbols-outlined" aria-hidden="true">description</span>
              {{ T.CARD_NOTES }}
            </h2>
            <div class="step-card-body">
              <div class="audit-field">
                <label class="sr-only" for="s3-notes">{{ T.NOTES_LABEL }}</label>
                <textarea
                  id="s3-notes"
                  class="audit-control"
                  [placeholder]="C.NOTES_PLACEHOLDER"
                  [maxLength]="notesMax"
                  aria-describedby="s3-notes-count"
                  [(ngModel)]="form.notes"
                ></textarea>
                <p class="audit-counter" id="s3-notes-count" [attr.aria-label]="C.counterLabel(form.notes.length, notesMax)">
                  {{ C.counter(form.notes.length, notesMax) }}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </tohfa-audit-step-shell>
  `,
})
export class AuditStep3FarmDetailsComponent {
  readonly S = S;
  readonly T = T;
  readonly C = C;
  readonly routes = AUDIT_ROUTES;
  readonly notesMax = AUDIT_STEP_NOTES_MAX;
  readonly idDetails = ID_DETAILS_VERIFICATION;
  readonly farmingTypeOptions = AUDIT_STEP3_FARMING_TYPE_OPTIONS;
  readonly cropOptions = AUDIT_STEP3_CROP_OPTIONS;
  readonly waterSourceOptions = AUDIT_STEP_WATER_SOURCE_OPTIONS;
  readonly irrigationOptions = AUDIT_STEP3_IRRIGATION_OPTIONS;
  readonly recordsOptions = AUDIT_STEP3_RECORDS_OPTIONS;
  readonly detailsVerificationOptions = AUDIT_STEP3_DETAILS_VERIFICATION_OPTIONS;

  @ViewChild(AuditStepShellComponent) private shell?: AuditStepShellComponent;

  private readonly router = inject(Router);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly audit = signal<AuditDetailRecord>(mockAuditById(AUDIT_STEP_DEFAULT_AUDIT_ID));
  readonly extras = signal<AuditStepProfileExtras>(mockAuditStepExtras(AUDIT_STEP_DEFAULT_AUDIT_ID, []));
  form: Step3Form = emptyForm();
  readonly cropsOpen = signal(false);
  /** Mirrors form.crops so the trigger's summary is a signal (OnPush). */
  private readonly selectedCrops = signal<readonly string[]>([]);
  readonly errors = signal<Readonly<Record<string, string>>>({});
  readonly errorList = computed(() => {
    const message = this.errors()[ID_DETAILS_VERIFICATION];
    return message === undefined ? [] : [{ id: ID_DETAILS_VERIFICATION, message }];
  });
  private submitted = false;

  readonly profileRows = computed(() => {
    const a = this.audit();
    return [
      { label: T.FARM_NAME, value: a.farmName },
      { label: T.FARM_ID, value: a.farmCode ?? S.DASH },
      { label: T.FARM_LOCATION, value: a.location },
      { label: T.GPS, value: a.gps ?? S.DASH },
      { label: T.FARM_AREA, value: a.areaAcres === null ? S.DASH : T.acres(a.areaAcres) },
    ];
  });

  readonly profileFarmingTypeHelp = computed(() => {
    const v = this.audit().farmingType ?? this.extras().profileFarmingType;
    return v === null ? T.NOT_RECORDED : T.recordedOnProfile(v);
  });

  readonly cropsSummary = computed(() => {
    const crops = this.selectedCrops();
    if (crops.length === 0) return C.SELECT_PLACEHOLDER;
    return crops.map((v) => auditStepOptionLabel(AUDIT_STEP3_CROP_OPTIONS, v)).join(', ');
  });

  constructor() {
    auditStepRouteId((id) => {
      const audit = mockAuditById(id);
      this.audit.set(audit);
      this.extras.set(mockAuditStepExtras(audit.id, audit.plotIds));
      this.form = emptyForm();
      this.selectedCrops.set([]);
      this.cropsOpen.set(false);
      this.submitted = false;
      this.errors.set({});
    });
  }

  toggleCrop(value: string): void {
    this.form.crops = this.form.crops.includes(value)
      ? this.form.crops.filter((c) => c !== value)
      : AUDIT_STEP3_CROP_OPTIONS.map((o) => o.value).filter((v) => v === value || this.form.crops.includes(v));
    this.selectedCrops.set([...this.form.crops]);
  }

  closeCrops(): void {
    this.cropsOpen.set(false);
    this.host.nativeElement.querySelector<HTMLElement>('#s3-crops')?.focus();
  }

  private validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (this.form.detailsVerification === '') errors[ID_DETAILS_VERIFICATION] = T.ERROR_DETAILS_VERIFICATION;
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
