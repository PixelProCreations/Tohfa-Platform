/**
 * Farmer Records → Livestock → Edit Livestock Record (SA-M3-S12a–e): a five-step stepper —
 * Basic Information, Feed Record, Production Record, Breeding Record, Health Record.
 *
 * UI ONLY. Works on a local copy of the animal's record; nothing is sent anywhere. Next / Save
 * validate the current step's required fields and show inline errors; the right-hand summary
 * cards read the draft, so they update as the form changes. Save emits the finished draft and the
 * host tab shows the saved modal. The photo "change" button is inert (no upload in a UI-only
 * build); "remove" clears the placeholder locally.
 *
 * Breeding records only apply to female animals (BR-140: the API refuses them for a MALE animal),
 * so step 4's fields become optional when the animal is male.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  LOCALE_ID,
  Output,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
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
  LIVESTOCK_NAME_MAX,
  LIVESTOCK_NOTES_MAX,
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
  type LivestockAnimal,
  type LivestockOption,
  type LivestockRecordDraft,
} from './farmer-livestock.mock';
import {
  LIVESTOCK_SHARED_STYLES,
  animalTitle,
  formatLivestockDate,
  optionLabel,
  productionUnit,
  withCurrent,
} from './farmer-livestock-shared';
import { FARMER_LIVESTOCK_STRINGS as S } from './farmer-livestock-tab.strings';

type Draft = LivestockRecordDraft;
type FieldKey = Exclude<keyof Draft, 'hasPhoto'>;
type FieldKind = 'select' | 'text' | 'decimal' | 'date' | 'textarea' | 'locked';

interface FieldDef {
  readonly key: FieldKey;
  readonly label: string;
  readonly kind: FieldKind;
  /** Required unless this returns false. Absent = optional. */
  readonly required?: (d: Draft) => boolean;
  readonly options?: (d: Draft) => readonly LivestockOption[];
  /** Trailing unit inside the input ("litres", "%"). */
  readonly suffix?: (d: Draft) => string;
  readonly visible?: (d: Draft) => boolean;
  /** Extra check after "required", e.g. a numeric range. Returns an error message or null. */
  readonly check?: (value: string) => string | null;
  readonly maxLength?: number;
  /** Spans the full form width. */
  readonly full?: boolean;
}

interface SummaryRow {
  readonly label: string;
  readonly value: string;
  readonly kind: 'text' | 'pill' | 'chip';
  readonly tone?: string;
}

const always = (): boolean => true;
const femaleOnly = (d: Draft): boolean => d.gender !== 'MALE';
const fixed =
  (options: readonly LivestockOption[]) =>
  (): readonly LivestockOption[] =>
    options;

const positive = (v: string): string | null => (Number(v) > 0 ? null : S.ERROR_POSITIVE);
const percent = (v: string): string | null => {
  const n = Number(v);
  return v.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 100 ? null : S.ERROR_PERCENT;
};

const STEP_FIELDS: readonly (readonly FieldDef[])[] = [
  [
    { key: 'livestockType', label: S.LIVESTOCK_TYPE, kind: 'select', required: always, options: fixed(LIVESTOCK_TYPE_OPTIONS) },
    { key: 'livestockId', label: S.LIVESTOCK_ID, kind: 'locked' },
    {
      key: 'breed',
      label: S.SPECIES,
      kind: 'select',
      required: always,
      options: (d) => withCurrent(BREED_OPTIONS_BY_TYPE[d.livestockType] ?? [], d.breed),
    },
    { key: 'gender', label: S.GENDER, kind: 'select', required: always, options: fixed(GENDER_OPTIONS) },
    { key: 'sourceFarm', label: S.SOURCE_FARM, kind: 'select', required: always, options: fixed(SOURCE_FARM_OPTIONS) },
    { key: 'organicStatus', label: S.ORGANIC_STATUS, kind: 'select', required: always, options: fixed(ORGANIC_STATUS_OPTIONS) },
    { key: 'tag', label: S.TAG, kind: 'text', required: always, maxLength: LIVESTOCK_TAG_MAX },
    { key: 'name', label: S.NAME, kind: 'text', maxLength: LIVESTOCK_NAME_MAX },
    { key: 'acquiredOn', label: S.ACQUIRED_ON, kind: 'date', required: always },
    { key: 'basicNotes', label: S.NOTES, kind: 'textarea', maxLength: LIVESTOCK_NOTES_MAX, full: true },
  ],
  [
    { key: 'feedPlan', label: S.FEED_PLAN, kind: 'select', required: always, options: (d) => withCurrent(FEED_PLAN_OPTIONS, d.feedPlan), full: true },
    { key: 'feedType', label: S.FEED_TYPE, kind: 'select', required: always, options: fixed(FEED_TYPE_OPTIONS), full: true },
    { key: 'feedSource', label: S.FEED_SOURCE, kind: 'select', required: always, options: (d) => withCurrent(FEED_SOURCE_OPTIONS, d.feedSource), full: true },
    { key: 'feedNotes', label: S.NOTES, kind: 'textarea', maxLength: LIVESTOCK_NOTES_MAX, full: true },
  ],
  [
    { key: 'productionType', label: S.PRODUCTION_TYPE, kind: 'select', required: always, options: fixed(PRODUCTION_TYPE_OPTIONS) },
    { key: 'productionSection', label: S.PRODUCTION_SECTION, kind: 'select', required: always, options: fixed(PRODUCTION_SECTION_OPTIONS) },
    {
      key: 'productionQuantity',
      label: S.PRODUCTION_QUANTITY,
      kind: 'decimal',
      required: always,
      suffix: (d) => productionUnit(d.productionType),
      check: positive,
    },
    { key: 'productionGender', label: S.PRODUCTION_GENDER, kind: 'select', options: fixed(GENDER_OPTIONS) },
    // The API accepts fatPercent for MILK only (422 otherwise), so the field shows for milk only.
    {
      key: 'fatPercent',
      label: S.FAT_PERCENT,
      kind: 'decimal',
      required: always,
      suffix: () => S.PERCENT,
      visible: (d) => d.productionType === 'MILK',
      check: percent,
    },
    {
      key: 'qualityGrade',
      label: S.QUALITY_GRADE,
      kind: 'select',
      required: always,
      options: (d) => withCurrent(QUALITY_GRADE_BY_PRODUCT[d.productionType] ?? [], d.qualityGrade),
    },
    {
      key: 'appearanceType',
      label: S.APPEARANCE_TYPE,
      kind: 'select',
      required: always,
      options: (d) => withCurrent(APPEARANCE_BY_PRODUCT[d.productionType] ?? [], d.appearanceType),
      full: true,
    },
    { key: 'productionNotes', label: S.NOTES, kind: 'textarea', maxLength: LIVESTOCK_NOTES_MAX, full: true },
  ],
  [
    {
      key: 'breedType',
      label: S.BREED_TYPE,
      kind: 'select',
      required: femaleOnly,
      options: (d) => withCurrent(BREED_OPTIONS_BY_TYPE[d.livestockType] ?? [], d.breedType),
    },
    { key: 'sire', label: S.SIRE, kind: 'select', required: femaleOnly, options: (d) => withCurrent(SIRE_OPTIONS, d.sire) },
    { key: 'breedingMethod', label: S.BREEDING_METHOD, kind: 'select', required: femaleOnly, options: fixed(BREEDING_METHOD_OPTIONS) },
    { key: 'breedColor', label: S.BREED_COLOR, kind: 'select', required: femaleOnly, options: (d) => withCurrent(BREED_COLOR_OPTIONS, d.breedColor) },
    { key: 'inseminationType', label: S.INSEMINATION_TYPE, kind: 'select', required: femaleOnly, options: fixed(INSEMINATION_TYPE_OPTIONS) },
    { key: 'pregnancyCheckType', label: S.PREGNANCY_CHECK_TYPE, kind: 'select', required: femaleOnly, options: fixed(PREGNANCY_CHECK_TYPE_OPTIONS) },
    { key: 'pregnancyResult', label: S.PREGNANCY_RESULT, kind: 'select', required: femaleOnly, options: fixed(PREGNANCY_RESULT_OPTIONS) },
    { key: 'examinationMethod', label: S.EXAMINATION_METHOD, kind: 'select', required: femaleOnly, options: fixed(EXAMINATION_METHOD_OPTIONS) },
    { key: 'calving', label: S.CALVING, kind: 'select', required: femaleOnly, options: (d) => withCurrent(CALVING_OPTIONS, d.calving) },
    { key: 'calvingOutcome', label: S.CALVING_OUTCOME, kind: 'select', required: femaleOnly, options: fixed(CALVING_OUTCOME_OPTIONS) },
    { key: 'deliveryType', label: S.DELIVERY_TYPE, kind: 'select', required: femaleOnly, options: fixed(DELIVERY_TYPE_OPTIONS) },
    { key: 'expectedDeliveryDay', label: S.EXPECTED_DELIVERY_DAY, kind: 'date', required: femaleOnly },
    { key: 'breedingNotes', label: S.NOTES, kind: 'textarea', maxLength: LIVESTOCK_NOTES_MAX, full: true },
  ],
  [
    { key: 'checkupType', label: S.CHECKUP_TYPE, kind: 'select', required: always, options: fixed(CHECKUP_TYPE_OPTIONS) },
    { key: 'healthStatus', label: S.HEALTH_STATUS, kind: 'select', required: always, options: fixed(HEALTH_STATUS_OPTIONS) },
    { key: 'treatmentType', label: S.TREATMENT_TYPE, kind: 'select', required: always, options: fixed(TREATMENT_TYPE_OPTIONS) },
    { key: 'medicineType', label: S.MEDICINE_TYPE, kind: 'select', required: always, options: (d) => withCurrent(MEDICINE_TYPE_OPTIONS, d.medicineType) },
    { key: 'frequency', label: S.FREQUENCY, kind: 'select', required: always, options: fixed(FREQUENCY_OPTIONS) },
    { key: 'symptoms', label: S.SYMPTOMS, kind: 'select', required: always, options: (d) => withCurrent(SYMPTOM_OPTIONS, d.symptoms) },
    {
      key: 'examinationFindings',
      label: S.EXAMINATION_FINDINGS,
      kind: 'select',
      required: always,
      options: (d) => withCurrent(FINDINGS_OPTIONS, d.examinationFindings),
    },
    { key: 'diagnosis', label: S.DIAGNOSIS, kind: 'select', required: always, options: (d) => withCurrent(DIAGNOSIS_OPTIONS, d.diagnosis) },
    { key: 'treatmentRequired', label: S.TREATMENT_REQUIRED, kind: 'select', required: always, options: fixed(TREATMENT_REQUIRED_OPTIONS) },
    { key: 'targetParasite', label: S.TARGET_PARASITE, kind: 'select', required: always, options: fixed(TARGET_PARASITE_OPTIONS) },
    { key: 'administrationRoute', label: S.ADMINISTRATION_ROUTE, kind: 'select', required: always, options: fixed(ADMINISTRATION_ROUTE_OPTIONS) },
    { key: 'healthNotes', label: S.NOTES, kind: 'textarea', maxLength: LIVESTOCK_NOTES_MAX, full: true },
  ],
];

const SUMMARY_META: readonly { readonly title: string; readonly icon: string }[] = [
  { title: '', icon: '' },
  { title: S.FEED_SUMMARY, icon: 'eco' },
  { title: S.PRODUCTION_SUMMARY, icon: 'bar_chart' },
  { title: S.BREEDING_SUMMARY, icon: 'female' },
  { title: S.HEALTH_SUMMARY, icon: 'favorite' },
];

/** Placeholder until ngOnInit copies the animal's record in. */
const FARMER_LIVESTOCK_EMPTY_DRAFT: Draft = {
  livestockType: '',
  livestockId: '',
  breed: '',
  gender: '',
  sourceFarm: '',
  organicStatus: '',
  tag: '',
  name: '',
  acquiredOn: '',
  basicNotes: '',
  hasPhoto: false,
  feedPlan: '',
  feedType: '',
  feedSource: '',
  feedNotes: '',
  productionType: '',
  productionSection: '',
  productionQuantity: '',
  productionGender: '',
  fatPercent: '',
  qualityGrade: '',
  appearanceType: '',
  productionNotes: '',
  breedType: '',
  sire: '',
  breedingMethod: '',
  breedColor: '',
  inseminationType: '',
  pregnancyCheckType: '',
  pregnancyResult: '',
  examinationMethod: '',
  calving: '',
  calvingOutcome: '',
  deliveryType: '',
  expectedDeliveryDay: '',
  breedingNotes: '',
  checkupType: '',
  healthStatus: '',
  treatmentType: '',
  medicineType: '',
  frequency: '',
  symptoms: '',
  examinationFindings: '',
  diagnosis: '',
  treatmentRequired: '',
  targetParasite: '',
  administrationRoute: '',
  healthNotes: '',
  nextCheckupOn: '',
};

const LAST_STEP = STEP_FIELDS.length - 1;

let nextEditId = 0;

@Component({
  selector: 'tohfa-farmer-livestock-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    LIVESTOCK_SHARED_STYLES,
    `
      :host {
        display: block;
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .page {
        display: flex;
        flex-direction: column;
        gap: var(--space-18);
      }

      /* ---------- Stepper ---------- */
      .stepper-row {
        display: flex;
        align-items: flex-start;
        gap: var(--space-24);
      }
      .stepper-title {
        flex: none;
        margin: var(--space-6) 0 0;
        font-size: var(--fs-section);
        font-weight: var(--fw-xbold);
      }
      .steps {
        display: flex;
        flex: 1;
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
        color: var(--tohfa-slate);
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
      .step.done::before {
        background: var(--ok);
      }
      /* As in the design, the connector leading into the current step is orange. */
      .step.current::before {
        background: var(--tohfa-amber);
      }
      .step-dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-14) * 2);
        height: calc(var(--space-14) * 2);
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-circle);
        background: var(--tohfa-surface);
        font-size: var(--fs-cap);
      }
      .step-dot .icon {
        font-size: var(--icon-row-action);
      }
      .step.done {
        color: var(--ok);
      }
      .step.done .step-dot {
        border-color: var(--ok);
        background: var(--ok);
        color: var(--tohfa-surface);
      }
      .step.current {
        color: var(--tohfa-amber);
      }
      .step.current .step-dot {
        border-color: var(--tohfa-amber);
        background: var(--tohfa-amber);
        color: var(--tohfa-surface);
      }

      /* ---------- Body ---------- */
      .body {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--space-18);
        align-items: start;
      }
      .body.with-aside {
        grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
      }
      .form-card {
        padding: var(--space-24);
      }
      .step-title {
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .step-title:focus {
        outline: none;
      }
      .step-sub {
        margin: var(--space-4) 0 var(--space-18);
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-14) var(--space-18);
      }
      .grid.basic {
        grid-template-columns: repeat(2, minmax(0, 1fr)) minmax(0, 0.55fr);
      }
      .field {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .field.full {
        grid-column: 1 / -1;
      }
      .optional {
        color: var(--tohfa-muted);
        font-weight: var(--fw-regular);
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
      .tohfa-input[readonly] {
        background: var(--tohfa-disabled-bg);
        color: var(--tohfa-slate);
      }
      .tohfa-input[readonly]:focus {
        border-color: var(--tohfa-border);
        box-shadow: none;
      }
      select.tohfa-input {
        appearance: none;
        cursor: pointer;
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
        margin: 0 0 var(--space-14);
      }
      .male-note {
        margin: 0 0 var(--space-14);
      }

      /* ---------- Photo (step 1) ---------- */
      .photo {
        grid-column: 3;
        grid-row: 1 / span 4;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .photo-tile {
        position: relative;
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-6);
        min-height: calc(var(--space-32) * 5);
        border: 1px solid var(--neutral-status-bd);
        border-radius: var(--r-md);
        background: var(--neutral-status-bg);
        color: var(--tohfa-muted);
        font-size: var(--fs-cap);
      }
      .photo-tile > .icon {
        font-size: var(--icon-dialog-hero);
      }
      .photo-actions {
        position: absolute;
        top: var(--space-8);
        right: var(--space-8);
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }
      .btn-icon-only {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-14) * 2);
        height: calc(var(--space-14) * 2);
        padding: 0;
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-circle);
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        cursor: pointer;
      }
      .btn-icon-only .icon {
        font-size: var(--icon-row-action);
      }
      .btn-icon-only.danger {
        color: var(--err);
      }

      /* ---------- Aside ---------- */
      .aside {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
      }
      .animal {
        display: flex;
        align-items: flex-start;
        gap: var(--space-14);
      }
      .animal-text {
        flex: 1;
        min-width: 0;
      }
      .animal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-10);
      }
      .animal-title {
        margin: 0 0 var(--space-6);
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
      }
      .animal-meta {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        margin: 0;
        font-size: var(--fs-dense);
      }
      .animal-meta div {
        display: flex;
        align-items: center;
        gap: var(--space-6);
      }
      .animal-meta dt {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
        color: var(--tohfa-slate);
      }
      .animal-meta dt .icon {
        font-size: var(--icon-row-action);
        color: var(--tohfa-muted);
      }
      .animal-meta dd {
        margin: 0;
        font-weight: var(--fw-bold);
      }
      .summary-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0 0 var(--space-12);
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
      }
      .summary-title .icon {
        color: var(--ok);
      }
      .summary {
        margin: 0;
      }
      .summary div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-6) 0;
        font-size: var(--fs-dense);
      }
      .summary dt {
        color: var(--tohfa-slate);
      }
      .summary dd {
        margin: 0;
        font-weight: var(--fw-bold);
        text-align: right;
        overflow-wrap: anywhere;
      }
      .date-chip {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4) var(--space-8);
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
      }
      .date-chip .icon {
        font-size: var(--icon-row-action);
      }

      /* ---------- Footer (plain, at the end of the content) ---------- */
      .foot {
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: var(--space-12);
        padding: var(--space-14) 0;
      }
      .foot .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }
      .foot .tohfa-btn-outline-amber {
        padding: var(--space-10) var(--space-24);
        font-size: var(--fs-button-l);
        color: var(--tohfa-amber);
      }

      @media (max-width: 960px) {
        .stepper-row {
          flex-direction: column;
          gap: var(--space-12);
        }
        .steps {
          width: 100%;
        }
        .body.with-aside {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      @media (max-width: 720px) {
        .grid,
        .grid.basic {
          grid-template-columns: minmax(0, 1fr);
        }
        .photo {
          grid-column: auto;
          grid-row: auto;
        }
        .step-label {
          display: none;
        }
      }
    `,
  ],
  template: `
    <div class="page">
      <div class="stepper-row">
        <h2 class="stepper-title">{{ S.STEPPER_TITLE }}</h2>
        <ol class="steps" [attr.aria-label]="S.STEPPER_LABEL">
          <li
            *ngFor="let st of S.STEPS; let i = index"
            class="step"
            [class.done]="i < step()"
            [class.current]="i === step()"
            [attr.aria-current]="i === step() ? 'step' : null"
          >
            <span class="step-dot" aria-hidden="true">
              <span *ngIf="i < step(); else num" class="material-symbols-outlined icon">check</span>
              <ng-template #num>{{ i + 1 }}</ng-template>
            </span>
            <span class="step-label">{{ st.title }}</span>
            <span class="visually-hidden">{{ stepStatus(i) }}</span>
          </li>
        </ol>
      </div>

      <div class="body" [class.with-aside]="step() > 0">
        <section class="tohfa-card form-card" [attr.aria-labelledby]="ids.heading">
          <h3 class="step-title" [id]="ids.heading" tabindex="-1">{{ S.stepHeading(step() + 1, S.STEPS[step()]!.title) }}</h3>
          <p class="step-sub">{{ S.STEPS[step()]!.subtitle }}</p>

          <p *ngIf="hasErrors()" class="tohfa-banner tohfa-banner-danger error-summary" role="alert">{{ S.ERROR_SUMMARY }}</p>
          <p *ngIf="step() === 3 && draft().gender === 'MALE'" class="tohfa-banner tohfa-banner-info male-note">
            {{ S.BREEDING_MALE_NOTE }}
          </p>

          <div class="grid" [class.basic]="step() === 0">
            <ng-container *ngFor="let f of fields(); trackBy: trackField">
              <div class="field" *ngIf="isVisible(f)" [class.full]="f.full">
                <label class="tohfa-label" [class.tohfa-label-required]="isRequired(f)" [for]="fieldId(f.key)">{{ f.label }}</label>

                <ng-container [ngSwitch]="f.kind">
                  <div *ngSwitchCase="'locked'" class="control" [title]="S.LIVESTOCK_ID_LOCKED">
                    <input
                      [id]="fieldId(f.key)"
                      class="tohfa-input with-trail"
                      [value]="draft()[f.key]"
                      readonly
                      [attr.aria-describedby]="ids.locked"
                    />
                    <span class="material-symbols-outlined trail" aria-hidden="true">lock</span>
                    <span class="visually-hidden" [id]="ids.locked">{{ S.LIVESTOCK_ID_LOCKED }}</span>
                  </div>

                  <div *ngSwitchCase="'select'" class="control">
                    <select
                      [id]="fieldId(f.key)"
                      class="tohfa-input with-trail"
                      [class.invalid]="errorFor(f.key)"
                      [attr.aria-required]="isRequired(f)"
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
                      [attr.aria-required]="isRequired(f)"
                      [attr.aria-invalid]="errorFor(f.key) ? true : null"
                      [attr.aria-describedby]="errorFor(f.key) ? fieldId(f.key) + '-err' : null"
                      [ngModel]="draft()[f.key]"
                      (ngModelChange)="setField(f.key, $event ?? '')"
                    />
                    <span class="material-symbols-outlined trail" aria-hidden="true">calendar_today</span>
                  </div>

                  <ng-container *ngSwitchCase="'textarea'">
                    <textarea
                      [id]="fieldId(f.key)"
                      class="tohfa-input"
                      rows="3"
                      [attr.maxlength]="f.maxLength ?? null"
                      [attr.aria-describedby]="fieldId(f.key) + '-count'"
                      [ngModel]="draft()[f.key]"
                      (ngModelChange)="setField(f.key, $event)"
                    ></textarea>
                    <span
                      class="counter"
                      [id]="fieldId(f.key) + '-count'"
                      [attr.aria-label]="S.counterAria(draft()[f.key].length, f.maxLength ?? 0)"
                    >
                      {{ S.counter(draft()[f.key].length, f.maxLength ?? 0) }}
                    </span>
                  </ng-container>

                  <div *ngSwitchDefault class="control">
                    <input
                      type="text"
                      [id]="fieldId(f.key)"
                      class="tohfa-input"
                      [class.with-trail]="f.suffix"
                      [class.invalid]="errorFor(f.key)"
                      [attr.inputmode]="f.kind === 'decimal' ? 'decimal' : null"
                      [attr.maxlength]="f.maxLength ?? null"
                      autocomplete="off"
                      [attr.aria-required]="isRequired(f)"
                      [attr.aria-invalid]="errorFor(f.key) ? true : null"
                      [attr.aria-describedby]="describedBy(f)"
                      [ngModel]="draft()[f.key]"
                      (ngModelChange)="setField(f.key, $event)"
                    />
                    <span *ngIf="f.suffix" class="trail suffix" [id]="fieldId(f.key) + '-unit'">{{ f.suffix(draft()) }}</span>
                  </div>
                </ng-container>

                <p class="field-error" [id]="fieldId(f.key) + '-err'" *ngIf="errorFor(f.key) as e">{{ e }}</p>
              </div>
            </ng-container>

            <div class="photo" *ngIf="step() === 0">
              <span class="tohfa-label">{{ S.ANIMAL_PHOTO }} <span class="optional">{{ S.OPTIONAL }}</span></span>
              <div class="photo-tile" role="img" [attr.aria-label]="draft().hasPhoto ? S.PHOTO_ALT : S.NO_PHOTO">
                <span class="material-symbols-outlined icon" aria-hidden="true">{{ draft().hasPhoto ? 'image' : 'hide_image' }}</span>
                <span *ngIf="!draft().hasPhoto" aria-hidden="true">{{ S.NO_PHOTO }}</span>
                <div class="photo-actions">
                  <!-- Inert: a UI-only build has no upload. -->
                  <button type="button" class="btn-icon-only" [attr.aria-label]="S.BTN_CHANGE_PHOTO" [title]="S.BTN_CHANGE_PHOTO">
                    <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>
                  </button>
                  <button
                    *ngIf="draft().hasPhoto"
                    type="button"
                    class="btn-icon-only danger"
                    [attr.aria-label]="S.BTN_REMOVE_PHOTO"
                    [title]="S.BTN_REMOVE_PHOTO"
                    (click)="removePhoto()"
                  >
                    <span class="material-symbols-outlined icon" aria-hidden="true">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside class="aside" *ngIf="step() > 0" [attr.aria-label]="S.ANIMAL_SUMMARY_LABEL">
          <section class="tohfa-card animal">
            <span class="thumb" role="img" [attr.aria-label]="draft().hasPhoto ? S.PHOTO_ALT : S.NO_PHOTO">
              <span class="material-symbols-outlined icon" aria-hidden="true">{{ draft().hasPhoto ? 'image' : 'hide_image' }}</span>
            </span>
            <div class="animal-text">
              <div class="animal-head">
                <h3 class="animal-title">{{ title() }}</h3>
                <span class="tohfa-badge tohfa-badge-sm tohfa-badge-success status-pill">{{ S.STATUS_ACTIVE }}</span>
              </div>
              <dl class="animal-meta">
                <div>
                  <dt><span class="material-symbols-outlined icon" aria-hidden="true">layers</span>{{ S.CARD_BREED }} :</dt>
                  <dd>{{ draft().breed || S.DASH }}</dd>
                </div>
                <div>
                  <dt><span class="material-symbols-outlined icon" aria-hidden="true">female</span>{{ S.CARD_GENDER }} :</dt>
                  <dd>{{ genderLabel() || S.DASH }}</dd>
                </div>
                <div>
                  <dt><span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>{{ S.CARD_ACQUIRED }} :</dt>
                  <dd>{{ date(draft().acquiredOn) }}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section class="tohfa-card" [attr.aria-labelledby]="ids.summary">
            <h3 class="summary-title" [id]="ids.summary">
              <span class="material-symbols-outlined icon" aria-hidden="true">{{ summaryMeta().icon }}</span>{{ summaryMeta().title }}
            </h3>
            <dl class="summary">
              <div *ngFor="let r of summaryRows()">
                <dt>{{ r.label }}</dt>
                <dd [ngSwitch]="r.kind">
                  <span *ngSwitchCase="'pill'" class="tohfa-badge tohfa-badge-sm status-pill" [ngClass]="r.tone ?? ''">{{ r.value }}</span>
                  <span *ngSwitchCase="'chip'" class="date-chip">
                    <span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>{{ r.value }}
                  </span>
                  <ng-container *ngSwitchDefault>{{ r.value }}</ng-container>
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <div class="foot">
        <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="cancelled.emit()">{{ S.BTN_CANCEL }}</button>
        <button *ngIf="step() > 0" type="button" class="tohfa-btn tohfa-btn-outline-amber" (click)="back()">
          <span class="material-symbols-outlined icon" aria-hidden="true">arrow_back</span>{{ S.back(S.STEPS[step() - 1]!.title) }}
        </button>
        <button *ngIf="step() < lastStep; else saveBtn" type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="next()">
          {{ S.next(S.STEPS[step() + 1]!.title) }}<span class="material-symbols-outlined icon" aria-hidden="true">arrow_forward</span>
        </button>
        <ng-template #saveBtn>
          <button type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="save()">
            <span class="material-symbols-outlined icon" aria-hidden="true">save</span>{{ S.BTN_SAVE }}
          </button>
        </ng-template>
      </div>
    </div>
  `,
})
export class FarmerLivestockEditComponent implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly locale = inject(LOCALE_ID);

  @Input({ required: true }) animal!: LivestockAnimal;
  @Output() readonly cancelled = new EventEmitter<void>();
  /** The finished draft, emitted once every step validates. */
  @Output() readonly saved = new EventEmitter<LivestockRecordDraft>();

  readonly S = S;
  readonly lastStep = LAST_STEP;

  private readonly uid = nextEditId++;
  readonly ids = {
    prefix: `lv-edit-${this.uid}-`,
    heading: `lv-edit-${this.uid}-heading`,
    summary: `lv-edit-${this.uid}-summary`,
    locked: `lv-edit-${this.uid}-locked`,
  };

  readonly step = signal(0);
  readonly draft = signal<Draft>(FARMER_LIVESTOCK_EMPTY_DRAFT);
  /** Errors of the current step, populated after a Next / Save attempt and refreshed on each edit. */
  readonly errors = signal<Partial<Record<FieldKey, string>>>({});

  readonly fields = computed(() => STEP_FIELDS[this.step()] ?? []);
  readonly hasErrors = computed(() => Object.keys(this.errors()).length > 0);
  readonly title = computed(() => animalTitle(this.draft()));
  readonly genderLabel = computed(() => optionLabel(GENDER_OPTIONS, this.draft().gender));
  readonly summaryMeta = computed(() => SUMMARY_META[this.step()] ?? { title: '', icon: '' });
  readonly summaryRows = computed<readonly SummaryRow[]>(() => this.buildSummary(this.step(), this.draft()));

  ngOnInit(): void {
    this.draft.set({ ...this.animal.record });
  }

  trackField(_: number, f: FieldDef): string {
    return f.key;
  }

  fieldId(key: FieldKey): string {
    return this.ids.prefix + key;
  }

  isVisible(f: FieldDef): boolean {
    return f.visible ? f.visible(this.draft()) : true;
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
    const title = S.STEPS[i]?.title ?? '';
    const status = i < this.step() ? S.STEP_DONE : i === this.step() ? S.STEP_CURRENT : S.STEP_UPCOMING;
    return S.stepStatus(title, status);
  }

  date(iso: string): string {
    return iso ? formatLivestockDate(iso, this.locale) : S.DASH;
  }

  setField(key: FieldKey, value: string): void {
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
        if (value !== 'MILK') next.fatPercent = '';
      }
      return next;
    });
    if (this.hasErrors()) this.errors.set(this.validate(this.step()));
  }

  removePhoto(): void {
    this.draft.update((d) => ({ ...d, hasPhoto: false }));
    // The remove button disappears with the photo; keep focus inside the tile's actions.
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('.photo-actions .btn-icon-only')?.focus());
  }

  back(): void {
    if (this.step() === 0) return;
    this.errors.set({});
    this.goTo(this.step() - 1);
  }

  next(): void {
    if (!this.validateCurrent()) return;
    this.goTo(this.step() + 1);
  }

  save(): void {
    // Every step validated on its way forward, but the gender on step 1 can change what step 4 requires.
    for (let i = 0; i <= LAST_STEP; i++) {
      const errs = this.validate(i);
      if (Object.keys(errs).length > 0) {
        if (i !== this.step()) this.goTo(i);
        this.errors.set(errs);
        this.focusFirstError();
        return;
      }
    }
    this.saved.emit({ ...this.draft() });
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
      if (f.visible && !f.visible(d)) continue;
      const value = d[f.key].trim();
      const required = f.required ? f.required(d) : false;
      if (!value) {
        if (required) errs[f.key] = S.ERROR_REQUIRED;
        continue;
      }
      const problem = f.check?.(value) ?? null;
      if (problem) errs[f.key] = problem;
    }
    return errs;
  }

  private goTo(index: number): void {
    this.step.set(index);
    setTimeout(() => {
      const heading = this.host.nativeElement.querySelector<HTMLElement>(`#${this.ids.heading}`);
      heading?.focus();
      heading?.scrollIntoView({ block: 'nearest' });
    });
  }

  private focusFirstError(): void {
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  }

  private buildSummary(stepIndex: number, d: Draft): readonly SummaryRow[] {
    const text = (label: string, value: string): SummaryRow => ({ label, value: value || S.DASH, kind: 'text' });
    switch (stepIndex) {
      case 1:
        return [
          text(S.FEED_PLAN, d.feedPlan),
          text(S.FEED_TYPE, optionLabel(FEED_TYPE_OPTIONS, d.feedType)),
          text(S.FEED_SOURCE, d.feedSource),
        ];
      case 2: {
        const rows = [
          text(S.SUM_PRODUCTION_TYPE, optionLabel(PRODUCTION_TYPE_OPTIONS, d.productionType)),
          text(S.SUM_PRODUCTION_SECTION, optionLabel(PRODUCTION_SECTION_OPTIONS, d.productionSection)),
          text(S.SUM_PRODUCTION_QUANTITY, d.productionQuantity ? S.quantityWithUnit(d.productionQuantity, productionUnit(d.productionType)) : ''),
        ];
        if (d.productionType === 'MILK') rows.push(text(S.FAT_PERCENT, d.fatPercent ? S.percent(d.fatPercent) : ''));
        rows.push(text(S.SUM_QUALITY_GRADE, d.qualityGrade), text(S.SUM_APPEARANCE_TYPE, d.appearanceType));
        return rows;
      }
      case 3:
        return [
          text(S.BREED_TYPE, d.breedType),
          text(S.SIRE, d.sire),
          text(S.BREEDING_METHOD, optionLabel(BREEDING_METHOD_OPTIONS, d.breedingMethod)),
          text(S.SUM_INSEMINATION_TYPE, optionLabel(INSEMINATION_TYPE_OPTIONS, d.inseminationType)),
          text(S.PREGNANCY_RESULT, optionLabel(PREGNANCY_RESULT_OPTIONS, d.pregnancyResult)),
          text(S.EXPECTED_DELIVERY_DAY, d.expectedDeliveryDay ? this.date(d.expectedDeliveryDay) : ''),
        ];
      case 4: {
        const status = HEALTH_STATUS_OPTIONS.find((o) => o.value === d.healthStatus);
        return [
          text(S.SUM_CURRENT_CHECKUP, optionLabel(CHECKUP_TYPE_OPTIONS, d.checkupType)),
          status
            ? { label: S.HEALTH_STATUS, value: status.label, kind: 'pill', tone: `tohfa-badge-${status.tone}` }
            : text(S.HEALTH_STATUS, ''),
          text(S.SUM_TREATMENT, optionLabel(TREATMENT_TYPE_OPTIONS, d.treatmentType)),
          text(S.SUM_MEDICINE, d.medicineType),
          text(S.FREQUENCY, optionLabel(FREQUENCY_OPTIONS, d.frequency)),
          d.nextCheckupOn ? { label: S.SUM_NEXT_CHECKUP, value: this.date(d.nextCheckupOn), kind: 'chip' } : text(S.SUM_NEXT_CHECKUP, ''),
        ];
      }
      default:
        return [];
    }
  }
}
