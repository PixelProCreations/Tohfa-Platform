/**
 * Add Farm Records → "Livestock" tab body: the "Livestock Records" card with a five-step stepper —
 * Basic Information, Feed Record, Production Record, Breeding Record, Health Record — and the
 * Back / Next / Save Livestock footer. The page title, subtitle and tab pills belong to the shell.
 *
 * UI ONLY. Nothing is sent anywhere:
 * - Next validates the current step's required fields inline (focus moves to the first invalid one);
 *   Back and the completed-step circles return to an earlier step with every value kept.
 * - Save Livestock validates every step, announces "Saved (demo — not stored)" and emits `saved`.
 * - The photo tile opens the browser's file chooser and shows the chosen name; nothing is read or
 *   uploaded.
 * - Every "+ Add" button is inert (aria-disabled): no design exists yet for adding a new option.
 * - The design has no Cancel button, so none is rendered. The shell can call `requestCancel()`,
 *   which confirms-if-dirty and then emits `cancel`.
 *
 * Breeding records only apply to female animals (BR-140: the API refuses them for a MALE animal),
 * so step 4's fields become optional when step 1's Gender is Male. Fat % is accepted for milk only
 * by the API, so it is required only while the production type is Milk (or not yet chosen).
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ADMINISTRATION_ROUTE_OPTIONS,
  APPEARANCE_BY_PRODUCT,
  BREEDING_METHOD_OPTIONS,
  BREED_COLOR_OPTIONS,
  BREED_OPTIONS_BY_TYPE,
  CALVING_OPTIONS,
  CALVING_OUTCOME_OPTIONS,
  CHECKUP_TYPE_OPTIONS,
  DELIVERY_TYPE_OPTIONS,
  DIAGNOSIS_OPTIONS,
  EXAMINATION_METHOD_OPTIONS,
  FEED_PLAN_OPTIONS,
  FEED_SOURCE_OPTIONS,
  FEED_TYPE_OPTIONS,
  FINDINGS_OPTIONS,
  FREQUENCY_OPTIONS,
  GENDER_OPTIONS,
  HEALTH_STATUS_OPTIONS,
  INSEMINATION_TYPE_OPTIONS,
  LIVESTOCK_FORM_ID_MAX,
  LIVESTOCK_FORM_NOTES_MAX,
  LIVESTOCK_NAME_MAX,
  LIVESTOCK_PHOTO_ACCEPT,
  LIVESTOCK_TAG_MAX,
  LIVESTOCK_TYPE_OPTIONS,
  MEDICINE_TYPE_OPTIONS,
  ORGANIC_STATUS_OPTIONS,
  PREGNANCY_CHECK_TYPE_OPTIONS,
  PREGNANCY_RESULT_OPTIONS,
  PRODUCTION_SECTION_OPTIONS,
  PRODUCTION_TYPE_OPTIONS,
  QUALITY_GRADE_BY_PRODUCT,
  SIRE_OPTIONS,
  SOURCE_FARM_OPTIONS,
  SYMPTOM_OPTIONS,
  TARGET_PARASITE_OPTIONS,
  TREATMENT_REQUIRED_OPTIONS,
  TREATMENT_TYPE_OPTIONS,
  emptyLivestockDraft,
  type LivestockFormDraft,
  type LivestockOption,
} from './farm-records-livestock.mock';
import { FARM_RECORDS_LIVESTOCK_FORM_STRINGS as S } from './farm-records-livestock-form.strings';
import { FARM_RECORDS_STRINGS as SHARED_S } from './farm-records.strings';

type Draft = LivestockFormDraft;
type FieldKey = keyof Draft;
type FieldKind = 'select' | 'text' | 'decimal' | 'date' | 'textarea';

interface FieldDef {
  readonly key: FieldKey;
  readonly label: string;
  readonly kind: FieldKind;
  /** Required when this returns true. Absent = optional. */
  readonly required?: (d: Draft) => boolean;
  readonly options?: (d: Draft) => readonly LivestockOption[];
  /** Trailing unit inside the input ("litres", "%"). */
  readonly suffix?: (d: Draft) => string;
  /** Extra check after "required", e.g. a numeric range. Returns an error message or null. */
  readonly check?: (value: string) => string | null;
  readonly maxLength?: number;
  readonly placeholder?: string;
  /** The design draws a "+ Add" button beside the control. */
  readonly add?: boolean;
  /** The design shows a "0 / 500" counter under the box. */
  readonly counter?: boolean;
  /** Spans the full form width. */
  readonly full?: boolean;
}

const always = (): boolean => true;
const femaleOnly = (d: Draft): boolean => d.gender !== 'MALE';
const fixed =
  (options: readonly LivestockOption[]) =>
  (): readonly LivestockOption[] =>
    options;
const unitFor = (productType: string): string => PRODUCTION_TYPE_OPTIONS.find((o) => o.value === productType)?.unit ?? '';

const positive = (v: string): string | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? null : S.ERROR_POSITIVE;
};
const percent = (v: string): string | null => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? null : S.ERROR_PERCENT;
};

const notes = (key: FieldKey, counter: boolean, full = true): FieldDef => ({
  key,
  label: S.NOTES,
  kind: 'textarea',
  maxLength: LIVESTOCK_FORM_NOTES_MAX,
  placeholder: S.NOTES_PLACEHOLDER,
  counter,
  full,
});
const pick = (key: FieldKey, label: string, options: (d: Draft) => readonly LivestockOption[], required: (d: Draft) => boolean = always): FieldDef => ({
  key,
  label,
  kind: 'select',
  required,
  options,
  add: true,
});

const STEP_FIELDS: readonly (readonly FieldDef[])[] = [
  [
    pick('livestockType', S.LIVESTOCK_TYPE, fixed(LIVESTOCK_TYPE_OPTIONS)),
    { key: 'livestockId', label: S.LIVESTOCK_ID, kind: 'text', required: always, maxLength: LIVESTOCK_FORM_ID_MAX },
    pick('breed', S.SPECIES, (d) => BREED_OPTIONS_BY_TYPE[d.livestockType] ?? []),
    pick('gender', S.GENDER, fixed(GENDER_OPTIONS)),
    pick('sourceFarm', S.SOURCE_FARM, fixed(SOURCE_FARM_OPTIONS)),
    pick('organicStatus', S.ORGANIC_STATUS, fixed(ORGANIC_STATUS_OPTIONS)),
    // The API's tag is free text (1..40); the design draws an "+ Add" beside it, kept as drawn.
    { key: 'tag', label: S.TAG, kind: 'text', required: always, maxLength: LIVESTOCK_TAG_MAX, add: true },
    { key: 'name', label: S.NAME, kind: 'text', maxLength: LIVESTOCK_NAME_MAX, placeholder: S.OPTIONAL },
    { key: 'acquiredOn', label: S.ACQUIRED_ON, kind: 'date', required: always },
    notes('basicNotes', false, false),
  ],
  [
    pick('feedPlan', S.FEED_PLAN, fixed(FEED_PLAN_OPTIONS)),
    pick('feedType', S.FEED_TYPE, fixed(FEED_TYPE_OPTIONS)),
    pick('feedSource', S.FEED_SOURCE, fixed(FEED_SOURCE_OPTIONS)),
    notes('feedNotes', true),
  ],
  [
    pick('productionType', S.PRODUCTION_TYPE, fixed(PRODUCTION_TYPE_OPTIONS)),
    pick('productionSection', S.PRODUCTION_SECTION, fixed(PRODUCTION_SECTION_OPTIONS)),
    {
      key: 'productionQuantity',
      label: S.PRODUCTION_QUANTITY,
      kind: 'decimal',
      required: always,
      suffix: (d) => unitFor(d.productionType),
      check: positive,
      add: true,
    },
    pick('productionGender', S.PRODUCTION_GENDER, fixed(GENDER_OPTIONS), () => false),
    {
      key: 'fatPercent',
      label: S.FAT_PERCENT,
      kind: 'decimal',
      required: (d) => d.productionType === '' || d.productionType === 'MILK',
      suffix: () => S.PERCENT,
      check: percent,
      add: true,
    },
    pick('qualityGrade', S.QUALITY_GRADE, (d) => QUALITY_GRADE_BY_PRODUCT[d.productionType] ?? []),
    pick('appearanceType', S.APPEARANCE_TYPE, (d) => APPEARANCE_BY_PRODUCT[d.productionType] ?? []),
    notes('productionNotes', true),
  ],
  [
    pick('breedType', S.BREED_TYPE, (d) => BREED_OPTIONS_BY_TYPE[d.livestockType] ?? [], femaleOnly),
    pick('sire', S.SIRE, fixed(SIRE_OPTIONS), femaleOnly),
    pick('breedingMethod', S.BREEDING_METHOD, fixed(BREEDING_METHOD_OPTIONS), femaleOnly),
    pick('breedColor', S.BREED_COLOR, fixed(BREED_COLOR_OPTIONS), femaleOnly),
    pick('inseminationType', S.INSEMINATION_TYPE, fixed(INSEMINATION_TYPE_OPTIONS), femaleOnly),
    pick('pregnancyCheckType', S.PREGNANCY_CHECK_TYPE, fixed(PREGNANCY_CHECK_TYPE_OPTIONS), femaleOnly),
    pick('pregnancyResult', S.PREGNANCY_RESULT, fixed(PREGNANCY_RESULT_OPTIONS), femaleOnly),
    pick('examinationMethod', S.EXAMINATION_METHOD, fixed(EXAMINATION_METHOD_OPTIONS), femaleOnly),
    pick('calving', S.CALVING, fixed(CALVING_OPTIONS), femaleOnly),
    pick('calvingOutcome', S.CALVING_OUTCOME, fixed(CALVING_OUTCOME_OPTIONS), femaleOnly),
    pick('deliveryType', S.DELIVERY_TYPE, fixed(DELIVERY_TYPE_OPTIONS), femaleOnly),
    // Drawn with an "+ Add" beside it, as in the design.
    { key: 'expectedDeliveryDay', label: S.EXPECTED_DELIVERY_DAY, kind: 'date', required: femaleOnly, add: true },
    notes('breedingNotes', false),
  ],
  [
    pick('checkupType', S.CHECKUP_TYPE, fixed(CHECKUP_TYPE_OPTIONS)),
    pick('healthStatus', S.HEALTH_STATUS, fixed(HEALTH_STATUS_OPTIONS)),
    pick('treatmentType', S.TREATMENT_TYPE, fixed(TREATMENT_TYPE_OPTIONS)),
    pick('medicineType', S.MEDICINE_TYPE, fixed(MEDICINE_TYPE_OPTIONS)),
    pick('frequency', S.FREQUENCY, fixed(FREQUENCY_OPTIONS)),
    pick('symptoms', S.SYMPTOMS, fixed(SYMPTOM_OPTIONS)),
    pick('examinationFindings', S.EXAMINATION_FINDINGS, fixed(FINDINGS_OPTIONS)),
    pick('diagnosis', S.DIAGNOSIS, fixed(DIAGNOSIS_OPTIONS)),
    pick('treatmentRequired', S.TREATMENT_REQUIRED, fixed(TREATMENT_REQUIRED_OPTIONS)),
    pick('targetParasite', S.TARGET_PARASITE, fixed(TARGET_PARASITE_OPTIONS)),
    pick('administrationRoute', S.ADMINISTRATION_ROUTE, fixed(ADMINISTRATION_ROUTE_OPTIONS)),
    notes('healthNotes', false),
  ],
];

const LAST_STEP = STEP_FIELDS.length - 1;

let nextId = 0;

@Component({
  selector: 'tohfa-farm-records-livestock-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .icon {
        font-size: var(--icon-btn);
      }
      [aria-disabled='true'] {
        cursor: not-allowed;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* ---------- Card ---------- */
      .card {
        padding: 0;
        overflow: hidden;
      }
      .card-head {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        margin: 0;
        padding: var(--space-14) var(--space-18);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .card-head .icon {
        font-size: var(--icon-nav);
      }
      .card-body {
        display: flex;
        flex-direction: column;
        gap: var(--space-16);
        padding: var(--space-18);
      }

      /* ---------- Stepper ---------- */
      .steps {
        display: flex;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .step {
        position: relative;
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: center;
        gap: var(--space-6);
        text-align: center;
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        color: var(--tohfa-muted);
      }
      /* Connector from the previous step's circle to this one. */
      .step:not(:first-child)::before {
        content: '';
        position: absolute;
        top: calc(var(--space-14) - 1px);
        right: calc(50% + var(--space-24));
        left: calc(-50% + var(--space-24));
        height: 2px;
        border-radius: var(--r-pill);
        background: var(--tohfa-border);
      }
      .step.done::before,
      .step.current::before {
        background: var(--tohfa-amber);
      }
      .step-dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-14) * 2);
        height: calc(var(--space-14) * 2);
        padding: 0;
        border: 2px solid var(--tohfa-border);
        border-radius: var(--r-circle);
        background: var(--tohfa-surface);
        color: inherit;
        font: inherit;
      }
      .step-dot .icon {
        font-size: var(--icon-row-action);
      }
      button.step-dot {
        cursor: pointer;
      }
      button.step-dot:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .step.done {
        color: var(--tohfa-ink);
      }
      .step.done .step-dot,
      .step.current .step-dot {
        border-color: var(--tohfa-amber);
        background: var(--tohfa-amber);
        color: var(--tohfa-surface);
      }
      .step.current {
        color: var(--tohfa-amber);
      }

      .strip {
        margin: 0;
        padding: var(--space-10) var(--space-14);
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-dense);
        font-weight: var(--fw-xbold);
      }
      .strip:focus {
        outline: none;
      }

      /* ---------- Photo tile (step 1) ---------- */
      .photo {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-8);
        width: 100%;
        min-height: calc(var(--space-32) * 3.5);
        padding: var(--space-16);
        border: 1px dashed var(--tohfa-amber-border);
        border-radius: var(--r-md);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-ink);
        font: inherit;
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .photo:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .avatar {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-28) * 2);
        height: calc(var(--space-28) * 2);
        border-radius: var(--r-circle);
        background: var(--tohfa-primary-pale);
        color: var(--tohfa-brown);
      }
      .avatar > .icon {
        font-size: var(--icon-dialog-close);
      }
      .badge {
        position: absolute;
        right: calc(var(--space-4) * -1);
        bottom: calc(var(--space-4) * -1);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--space-20);
        height: var(--space-20);
        border-radius: var(--r-circle);
        background: var(--tohfa-amber);
        color: var(--tohfa-surface);
      }
      .badge .icon {
        font-size: var(--fs-cap);
      }
      .photo-name {
        font-size: var(--fs-cap);
        font-weight: var(--fw-regular);
        color: var(--tohfa-slate);
        overflow-wrap: anywhere;
      }

      /* ---------- Fields ---------- */
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-14) var(--space-16);
        align-items: start;
      }
      .field {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .field.full {
        grid-column: 1 / -1;
      }
      .field .tohfa-label {
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }
      .row {
        display: flex;
        align-items: flex-start;
        gap: var(--space-8);
      }
      .row > .control {
        flex: 1;
        min-width: 0;
      }
      .control {
        position: relative;
        display: flex;
        align-items: center;
      }
      .tohfa-input {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-input);
      }
      .tohfa-input.invalid {
        border-color: var(--err);
      }
      select.tohfa-input {
        appearance: none;
        cursor: pointer;
      }
      select.tohfa-input.placeholder {
        color: var(--tohfa-muted);
      }
      select.tohfa-input option {
        color: var(--tohfa-ink);
      }
      .with-trail {
        padding-right: calc(var(--space-32) + var(--space-16));
      }
      .trail {
        position: absolute;
        right: var(--space-12);
        font-size: var(--icon-input);
        color: var(--tohfa-muted);
        pointer-events: none;
      }
      .suffix {
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }
      input[type='date']::-webkit-calendar-picker-indicator {
        position: absolute;
        right: var(--space-10);
        opacity: 0;
        cursor: pointer;
      }
      textarea.tohfa-input {
        min-height: calc(var(--space-32) * 2.5);
        resize: vertical;
      }
      .add-btn {
        flex: none;
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
        padding: 0 var(--space-16);
        color: var(--tohfa-amber);
        font-weight: var(--fw-bold);
      }
      .add-btn .icon {
        font-size: var(--icon-row-action);
      }
      .counter {
        align-self: flex-end;
        margin-top: var(--space-4);
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .field-error {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-cap);
        color: var(--err);
      }
      .error-summary {
        margin: 0;
      }

      /* ---------- Footer ---------- */
      .foot {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-12);
      }
      .foot .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }
      .status {
        flex: 1;
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--ok);
        text-align: right;
      }

      @media (max-width: 720px) {
        .grid {
          grid-template-columns: minmax(0, 1fr);
        }
        .step-label {
          display: none;
        }
      }
    `,
  ],
  template: `
    <section class="tohfa-card card" [attr.aria-labelledby]="ids.title">
      <h3 class="card-head" [id]="ids.title">
        <span class="material-symbols-outlined icon" aria-hidden="true">pets</span>{{ S.CARD_TITLE }}
      </h3>

      <div class="card-body">
        <ol class="steps" [attr.aria-label]="S.STEPPER_LABEL">
          <li
            *ngFor="let name of S.STEPS; let i = index"
            class="step"
            [class.done]="i < step()"
            [class.current]="i === step()"
            [attr.aria-current]="i === step() ? 'step' : null"
          >
            <button *ngIf="i < step(); else plainDot" type="button" class="step-dot" [attr.aria-label]="S.goToStep(name)" (click)="goTo(i)">
              <span class="material-symbols-outlined icon" aria-hidden="true">check</span>
            </button>
            <ng-template #plainDot>
              <span class="step-dot" aria-hidden="true">{{ i + 1 }}</span>
            </ng-template>
            <span class="step-label" aria-hidden="true">{{ name }}</span>
            <span class="sr-only">{{ stepStatus(i) }}</span>
          </li>
        </ol>

        <h4 class="strip" [id]="ids.strip" tabindex="-1">{{ S.stepStrip(step() + 1, S.STEPS.length, S.STEPS[step()] ?? '') }}</h4>

        <p *ngIf="hasErrors()" class="tohfa-banner tohfa-banner-danger error-summary" role="alert">{{ S.ERROR_SUMMARY }}</p>

        <ng-container *ngIf="step() === 0">
          <!-- Local only: opens the file chooser and shows the name; the file is never read or uploaded. -->
          <button type="button" class="photo" [attr.aria-describedby]="ids.photoName" (click)="photoInput.click()">
            <span class="avatar" aria-hidden="true">
              <span class="material-symbols-outlined icon">pets</span>
              <span class="badge"><span class="material-symbols-outlined icon">photo_camera</span></span>
            </span>
            <span>{{ S.ADD_PHOTO }}</span>
            <span class="photo-name" [id]="ids.photoName" aria-live="polite">{{ photoName() ? S.chosenPhoto(photoName()) : '' }}</span>
          </button>
          <input #photoInput type="file" hidden tabindex="-1" aria-hidden="true" [accept]="photoAccept" (change)="onPhoto($event)" />
        </ng-container>

        <div class="grid">
          <div class="field" *ngFor="let f of fields(); trackBy: trackField" [class.full]="f.full">
            <label class="tohfa-label" [class.tohfa-label-required]="isRequired(f)" [for]="fieldId(f.key)">{{ f.label }}</label>

            <div class="row">
              <ng-container [ngSwitch]="f.kind">
                <div *ngSwitchCase="'select'" class="control">
                  <select
                    [id]="fieldId(f.key)"
                    class="tohfa-input with-trail"
                    [class.placeholder]="draft()[f.key] === ''"
                    [class.invalid]="errorFor(f.key)"
                    [attr.aria-required]="isRequired(f) ? true : null"
                    [attr.aria-invalid]="errorFor(f.key) ? true : null"
                    [attr.aria-describedby]="errorFor(f.key) ? fieldId(f.key) + '-err' : null"
                    [ngModel]="draft()[f.key]"
                    (ngModelChange)="setField(f.key, $event)"
                  >
                    <option value="">{{ S.SELECT_PLACEHOLDER }}</option>
                    <option *ngFor="let o of optionsFor(f)" [value]="o.value">{{ o.label }}</option>
                  </select>
                  <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                </div>

                <div *ngSwitchCase="'date'" class="control">
                  <input
                    type="date"
                    [id]="fieldId(f.key)"
                    class="tohfa-input with-trail"
                    [class.invalid]="errorFor(f.key)"
                    [attr.aria-required]="isRequired(f) ? true : null"
                    [attr.aria-invalid]="errorFor(f.key) ? true : null"
                    [attr.aria-describedby]="errorFor(f.key) ? fieldId(f.key) + '-err' : null"
                    [ngModel]="draft()[f.key]"
                    (ngModelChange)="setField(f.key, $event ?? '')"
                  />
                  <span class="material-symbols-outlined trail" aria-hidden="true">calendar_today</span>
                </div>

                <div *ngSwitchCase="'textarea'" class="control">
                  <textarea
                    [id]="fieldId(f.key)"
                    class="tohfa-input"
                    rows="4"
                    [placeholder]="f.placeholder ?? ''"
                    [attr.maxlength]="f.maxLength ?? null"
                    [attr.aria-describedby]="f.counter ? fieldId(f.key) + '-count' : null"
                    [ngModel]="draft()[f.key]"
                    (ngModelChange)="setField(f.key, $event)"
                  ></textarea>
                </div>

                <div *ngSwitchDefault class="control">
                  <input
                    type="text"
                    [id]="fieldId(f.key)"
                    class="tohfa-input"
                    [class.with-trail]="f.suffix"
                    [class.invalid]="errorFor(f.key)"
                    [placeholder]="f.placeholder ?? ''"
                    [attr.inputmode]="f.kind === 'decimal' ? 'decimal' : null"
                    [attr.maxlength]="f.maxLength ?? null"
                    autocomplete="off"
                    [attr.aria-required]="isRequired(f) ? true : null"
                    [attr.aria-invalid]="errorFor(f.key) ? true : null"
                    [attr.aria-describedby]="describedBy(f)"
                    [ngModel]="draft()[f.key]"
                    (ngModelChange)="setField(f.key, $event)"
                  />
                  <span *ngIf="f.suffix" class="trail suffix" [id]="fieldId(f.key) + '-unit'">{{ f.suffix(draft()) }}</span>
                </div>
              </ng-container>

              <!-- Inert: no design exists yet for adding a new option. -->
              <button *ngIf="f.add" type="button" class="tohfa-btn tohfa-btn-outline-amber add-btn" aria-disabled="true" [title]="S.ADD_NOT_AVAILABLE">
                <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.BTN_ADD }}<span class="sr-only">: {{ f.label }}</span>
              </button>
            </div>

            <span
              *ngIf="f.counter"
              class="counter"
              [id]="fieldId(f.key) + '-count'"
              [attr.aria-label]="S.counterAria(draft()[f.key].length, f.maxLength ?? 0)"
            >
              {{ S.counter(draft()[f.key].length, f.maxLength ?? 0) }}
            </span>
            <p class="field-error" [id]="fieldId(f.key) + '-err'" *ngIf="errorFor(f.key) as e">{{ e }}</p>
          </div>
        </div>
      </div>
    </section>

    <div class="foot">
      <button *ngIf="step() > 0" type="button" class="tohfa-btn tohfa-btn-cancel" (click)="back()">{{ S.BTN_BACK }}</button>
      <p class="status" aria-live="polite">{{ statusMessage() }}</p>
      <button *ngIf="step() < lastStep; else saveBtn" type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="next()">{{ S.BTN_NEXT }}</button>
      <ng-template #saveBtn>
        <button type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="save()">{{ S.BTN_SAVE }}</button>
      </ng-template>
    </div>
  `,
})
export class FarmRecordsLivestockFormComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Emitted by `requestCancel()` — the design has no Cancel button, so the shell triggers it. */
  @Output() readonly cancel = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<void>();

  readonly S = S;
  readonly lastStep = LAST_STEP;
  readonly photoAccept = LIVESTOCK_PHOTO_ACCEPT;

  private readonly uid = nextId++;
  readonly ids = {
    prefix: `frl-${this.uid}-`,
    title: `frl-${this.uid}-title`,
    strip: `frl-${this.uid}-strip`,
    photoName: `frl-${this.uid}-photo-name`,
  };

  readonly step = signal(0);
  readonly draft = signal<Draft>(emptyLivestockDraft());
  /** Chosen photo file name, local only. */
  readonly photoName = signal('');
  /** Errors of the current step, populated after a Next / Save attempt and refreshed on each edit. */
  readonly errors = signal<Partial<Record<FieldKey, string>>>({});
  readonly statusMessage = signal('');

  readonly fields = computed(() => STEP_FIELDS[this.step()] ?? []);
  readonly hasErrors = computed(() => Object.keys(this.errors()).length > 0);

  /** True when anything differs from the blank form. */
  isDirty(): boolean {
    return JSON.stringify(this.draft()) !== JSON.stringify(emptyLivestockDraft()) || this.photoName() !== '';
  }

  /** Public: lets the shell leave this form (the design draws no Cancel button here). */
  requestCancel(): void {
    if (this.isDirty() && !window.confirm(SHARED_S.LEAVE_CONFIRM)) return;
    this.cancel.emit();
  }

  trackField(_: number, f: FieldDef): string {
    return f.key;
  }

  fieldId(key: FieldKey): string {
    return this.ids.prefix + key;
  }

  isRequired(f: FieldDef): boolean {
    return f.required ? f.required(this.draft()) : false;
  }

  optionsFor(f: FieldDef): readonly LivestockOption[] {
    return f.options ? f.options(this.draft()) : [];
  }

  errorFor(key: FieldKey): string | null {
    return this.errors()[key] ?? null;
  }

  describedBy(f: FieldDef): string | null {
    const ids = [f.suffix ? this.fieldId(f.key) + '-unit' : '', this.errorFor(f.key) ? this.fieldId(f.key) + '-err' : ''].filter(Boolean);
    return ids.length > 0 ? ids.join(' ') : null;
  }

  stepStatus(i: number): string {
    const status = i < this.step() ? S.STEP_DONE : i === this.step() ? S.STEP_CURRENT : S.STEP_UPCOMING;
    return S.stepStatus(S.STEPS[i] ?? '', status);
  }

  setField(key: FieldKey, value: string): void {
    this.statusMessage.set('');
    this.draft.update((d) => {
      const next: Draft = { ...d, [key]: value ?? '' };
      // Dependent lists: a value that is not offered for the new type is cleared rather than kept invisibly.
      if (key === 'livestockType') {
        const breeds = BREED_OPTIONS_BY_TYPE[value] ?? [];
        if (!breeds.some((o) => o.value === next.breed)) next.breed = '';
        if (!breeds.some((o) => o.value === next.breedType)) next.breedType = '';
      }
      if (key === 'productionType') {
        if (!(QUALITY_GRADE_BY_PRODUCT[value] ?? []).some((o) => o.value === next.qualityGrade)) next.qualityGrade = '';
        if (!(APPEARANCE_BY_PRODUCT[value] ?? []).some((o) => o.value === next.appearanceType)) next.appearanceType = '';
        // The API accepts fatPercent for milk only.
        if (value !== '' && value !== 'MILK') next.fatPercent = '';
      }
      return next;
    });
    if (this.hasErrors()) this.errors.set(this.validate(this.step()));
  }

  onPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Reset so choosing the same file again still fires `change`.
    input.value = '';
    if (file) this.photoName.set(file.name);
  }

  back(): void {
    if (this.step() === 0) return;
    this.goTo(this.step() - 1);
  }

  next(): void {
    if (!this.validateCurrent()) return;
    this.goTo(this.step() + 1);
  }

  /** Returns to an earlier (completed) step; values are kept. Moving forward always goes through Next. */
  goTo(index: number): void {
    if (index < 0 || index > LAST_STEP) return;
    if (index > this.step() && !this.validateCurrent()) return;
    this.errors.set({});
    this.step.set(index);
    setTimeout(() => {
      const strip = this.host.nativeElement.querySelector<HTMLElement>(`#${this.ids.strip}`);
      strip?.focus();
      strip?.scrollIntoView({ block: 'nearest' });
    });
  }

  save(): void {
    // Every step validated on its way forward, but step 1's gender can change what step 4 requires.
    for (let i = 0; i <= LAST_STEP; i++) {
      const errs = this.validate(i);
      if (Object.keys(errs).length > 0) {
        if (i !== this.step()) this.goTo(i);
        this.errors.set(errs);
        this.focusFirstError();
        return;
      }
    }
    this.statusMessage.set(S.SAVED_DEMO);
    this.saved.emit();
  }

  private validateCurrent(): boolean {
    const errs = this.validate(this.step());
    this.errors.set(errs);
    if (Object.keys(errs).length === 0) return true;
    this.focusFirstError();
    return false;
  }

  private validate(stepIndex: number): Partial<Record<FieldKey, string>> {
    const d = this.draft();
    const errs: Partial<Record<FieldKey, string>> = {};
    for (const f of STEP_FIELDS[stepIndex] ?? []) {
      const value = d[f.key].trim();
      if (!value) {
        if (f.required?.(d)) errs[f.key] = S.ERROR_REQUIRED;
        continue;
      }
      const problem = f.check?.(value) ?? null;
      if (problem) errs[f.key] = problem;
    }
    return errs;
  }

  private focusFirstError(): void {
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  }
}
