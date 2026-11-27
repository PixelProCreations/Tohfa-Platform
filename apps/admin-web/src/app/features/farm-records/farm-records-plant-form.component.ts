/**
 * Add Farm Records → Plant tab ("Plant Records" card).
 *
 * UI ONLY. The spec has no plant record (docs/openapi.yaml, db/migrations), so Save validates locally,
 * shows a "Saved (demo — not stored)" status, emits the draft through `saved` and clears the form.
 * Plant types and grades come from db/seed/001_reference.sql; variants and limits are placeholders (see
 * farm-records.mock.ts). The "+ Add" buttons are inert: their add-option dialogs have no design yet.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FARM_RECORDS_FORM_STYLES } from './farm-records-add.styles';
import { FARM_RECORDS_LIMITS, PLANT_GRADES, PLANT_TYPES } from './farm-records.mock';
import { FARM_RECORDS_STRINGS as S } from './farm-records.strings';

/** What `saved` emits. The area stays a one-decimal string so it is never a float. */
export interface FarmRecordsPlantDraft {
  readonly plantTypeCode: string;
  readonly variantCode: string;
  readonly areaAcres: string;
  readonly gradeCode: string;
  readonly expectedHarvestDays: number;
  readonly notes: string;
}

type FieldKey = 'type' | 'variant' | 'area' | 'grade' | 'harvestDays';

const L = FARM_RECORDS_LIMITS;
/** Up to 4 whole digits and at most one decimal — "one decimal" per the design's label. */
const AREA = /^(\d{1,4})(?:\.(\d))?$/;
const DIGITS = /^\d+$/;

let nextId = 0;

@Component({
  selector: 'tohfa-farm-records-plant-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [FARM_RECORDS_FORM_STYLES],
  template: `
    <form class="tohfa-card card" novalidate [attr.aria-labelledby]="ids.title" (ngSubmit)="save()">
      <h2 class="card-head" [id]="ids.title">
        <span class="material-symbols-outlined icon" aria-hidden="true">eco</span>{{ S.PLANT_CARD }}
      </h2>

      <div class="card-body">
        <div class="col">
          <div class="field">
            <label class="field-label" [for]="ids.type">{{ S.PLANT_TYPE }} <span class="req" aria-hidden="true">*</span></label>
            <div class="row">
              <div class="control">
                <select
                  class="tohfa-input"
                  name="plantType"
                  [id]="ids.type"
                  required
                  aria-required="true"
                  [class.placeholder]="!typeCode()"
                  [class.invalid]="err('type')"
                  [attr.aria-invalid]="err('type') ? 'true' : null"
                  [attr.aria-describedby]="err('type') ? ids.type + '-err' : null"
                  [ngModel]="typeCode()"
                  (ngModelChange)="onType($event)"
                >
                  <option value="" disabled>{{ S.PLANT_TYPE_PLACEHOLDER }}</option>
                  <option *ngFor="let t of types" [value]="t.code">{{ t.label }}</option>
                </select>
                <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
              </div>
              <ng-container *ngTemplateOutlet="addBtn"></ng-container>
            </div>
            <p class="field-error" *ngIf="err('type') as e" [id]="ids.type + '-err'">{{ e }}</p>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.area">{{ S.PLANT_AREA }} <span class="req" aria-hidden="true">*</span></label>
            <div class="row">
              <input
                type="text"
                inputmode="decimal"
                class="tohfa-input"
                name="area"
                autocomplete="off"
                [id]="ids.area"
                required
                aria-required="true"
                [attr.maxlength]="limits.plantAreaMaxChars"
                [placeholder]="S.PLANT_AREA_PLACEHOLDER"
                [class.invalid]="err('area')"
                [attr.aria-invalid]="err('area') ? 'true' : null"
                [attr.aria-describedby]="err('area') ? ids.area + '-err' : null"
                [ngModel]="area()"
                (ngModelChange)="area.set(decimalOnly($event))"
              />
              <ng-container *ngTemplateOutlet="addBtn"></ng-container>
            </div>
            <p class="field-error" *ngIf="err('area') as e" [id]="ids.area + '-err'">{{ e }}</p>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.harvestDays">{{ S.PLANT_HARVEST_DAYS }} <span class="req" aria-hidden="true">*</span></label>
            <input
              type="text"
              inputmode="numeric"
              class="tohfa-input"
              name="harvestDays"
              autocomplete="off"
              [id]="ids.harvestDays"
              required
              aria-required="true"
              [attr.maxlength]="limits.harvestDaysMaxChars"
              [placeholder]="S.PLANT_HARVEST_DAYS_PLACEHOLDER"
              [class.invalid]="err('harvestDays')"
              [attr.aria-invalid]="err('harvestDays') ? 'true' : null"
              [attr.aria-describedby]="err('harvestDays') ? ids.harvestDays + '-err' : null"
              [ngModel]="harvestDays()"
              (ngModelChange)="harvestDays.set(($event ?? '').replace(nonDigit, ''))"
            />
            <p class="field-error" *ngIf="err('harvestDays') as e" [id]="ids.harvestDays + '-err'">{{ e }}</p>
          </div>
        </div>

        <div class="col">
          <div class="field">
            <label class="field-label" [for]="ids.variant">{{ S.PLANT_VARIANT }} <span class="req" aria-hidden="true">*</span></label>
            <div class="row">
              <div class="control">
                <select
                  class="tohfa-input"
                  name="variant"
                  [id]="ids.variant"
                  required
                  aria-required="true"
                  [disabled]="variants().length === 0"
                  [class.placeholder]="!variantCode()"
                  [class.invalid]="err('variant')"
                  [attr.aria-invalid]="err('variant') ? 'true' : null"
                  [attr.aria-describedby]="err('variant') ? ids.variant + '-err' : null"
                  [ngModel]="variantCode()"
                  (ngModelChange)="variantCode.set($event ?? '')"
                >
                  <option value="" disabled>
                    {{ variants().length === 0 ? S.PLANT_VARIANT_PLACEHOLDER_NO_TYPE : S.PLANT_VARIANT_PLACEHOLDER }}
                  </option>
                  <option *ngFor="let v of variants()" [value]="v.code">{{ v.label }}</option>
                </select>
                <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
              </div>
              <ng-container *ngTemplateOutlet="addBtn"></ng-container>
            </div>
            <p class="field-error" *ngIf="err('variant') as e" [id]="ids.variant + '-err'">{{ e }}</p>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.grade">{{ S.PLANT_GRADE }} <span class="req" aria-hidden="true">*</span></label>
            <div class="row">
              <div class="control">
                <select
                  class="tohfa-input"
                  name="grade"
                  [id]="ids.grade"
                  required
                  aria-required="true"
                  [class.placeholder]="!gradeCode()"
                  [class.invalid]="err('grade')"
                  [attr.aria-invalid]="err('grade') ? 'true' : null"
                  [attr.aria-describedby]="err('grade') ? ids.grade + '-err' : null"
                  [ngModel]="gradeCode()"
                  (ngModelChange)="gradeCode.set($event ?? '')"
                >
                  <option value="" disabled>{{ S.PLANT_GRADE_PLACEHOLDER }}</option>
                  <option *ngFor="let g of grades" [value]="g.code">{{ g.label }}</option>
                </select>
                <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
              </div>
              <ng-container *ngTemplateOutlet="addBtn"></ng-container>
            </div>
            <p class="field-error" *ngIf="err('grade') as e" [id]="ids.grade + '-err'">{{ e }}</p>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.notes">{{ S.PLANT_NOTES }}</label>
            <textarea
              class="tohfa-input"
              name="notes"
              rows="4"
              [id]="ids.notes"
              [attr.maxlength]="limits.plantNotesMax"
              [attr.aria-describedby]="ids.notes + '-counter'"
              [ngModel]="notes()"
              (ngModelChange)="notes.set(($event ?? '').slice(0, limits.plantNotesMax))"
            ></textarea>
            <span class="counter" [id]="ids.notes + '-counter'" [attr.aria-label]="S.counterAria(notes().length, limits.plantNotesMax)">
              {{ S.counter(notes().length, limits.plantNotesMax) }}
            </span>
          </div>
        </div>
      </div>
    </form>

    <div class="foot">
      <p class="form-error" *ngIf="submitted() && hasErrors()" role="alert">{{ S.ERR_FORM }}</p>
      <p class="status" role="status">{{ savedMessage() }}</p>
      <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="onCancel()">{{ S.BTN_CANCEL }}</button>
      <button type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="save()">{{ S.BTN_SAVE_PLANT }}</button>
    </div>

    <ng-template #addBtn>
      <!-- Inert: the add-option dialog has no design yet. -->
      <button type="button" class="tohfa-btn tohfa-btn-outline-amber add-btn" aria-disabled="true" [title]="S.ADD_OPTION_NOT_AVAILABLE">
        <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.BTN_ADD }}
      </button>
    </ng-template>
  `,
})
export class FarmRecordsPlantFormComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Cancel was confirmed (or the form was clean); the host leaves the screen. */
  @Output() readonly cancel = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<FarmRecordsPlantDraft>();

  readonly S = S;
  readonly limits = L;
  readonly types = PLANT_TYPES;
  readonly grades = PLANT_GRADES;
  readonly nonDigit = /\D/g;

  private readonly uid = nextId++;
  readonly ids = {
    title: `frp-title-${this.uid}`,
    type: `frp-type-${this.uid}`,
    variant: `frp-variant-${this.uid}`,
    area: `frp-area-${this.uid}`,
    grade: `frp-grade-${this.uid}`,
    harvestDays: `frp-harvest-${this.uid}`,
    notes: `frp-notes-${this.uid}`,
  };

  readonly typeCode = signal('');
  readonly variantCode = signal('');
  readonly area = signal('');
  readonly gradeCode = signal('');
  readonly harvestDays = signal('');
  readonly notes = signal('');
  readonly submitted = signal(false);
  readonly savedMessage = signal('');

  readonly variants = computed(() => this.types.find((t) => t.code === this.typeCode())?.variants ?? []);

  private readonly fieldErrors = computed<Partial<Record<FieldKey, string>>>(() => {
    const errors: Partial<Record<FieldKey, string>> = {};
    if (!this.typeCode()) errors.type = S.ERR_REQUIRED;
    if (!this.variantCode()) errors.variant = S.ERR_REQUIRED;
    if (!this.gradeCode()) errors.grade = S.ERR_REQUIRED;

    const a = this.area().trim();
    const m = AREA.exec(a);
    if (!a) errors.area = S.ERR_REQUIRED;
    // Compared as integers (whole and tenths), never as a float; the regex already caps it at 9,999.9.
    else if (!m || (Number(m[1]) === 0 && Number(m[2] ?? '0') === 0)) errors.area = S.areaFormat(L.plantAreaMax);

    const d = this.harvestDays().trim();
    if (!d) errors.harvestDays = S.ERR_REQUIRED;
    else if (!DIGITS.test(d) || Number(d) < L.harvestDaysMin || Number(d) > L.harvestDaysMax) {
      errors.harvestDays = S.harvestDaysRange(L.harvestDaysMin, L.harvestDaysMax);
    }
    return errors;
  });

  readonly hasErrors = computed(() => Object.keys(this.fieldErrors()).length > 0);

  err(key: FieldKey): string | null {
    return this.submitted() ? (this.fieldErrors()[key] ?? null) : null;
  }

  onType(code: string | null): void {
    this.typeCode.set(code ?? '');
    if (!this.variants().some((v) => v.code === this.variantCode())) this.variantCode.set('');
  }

  decimalOnly(value: string | null): string {
    const cleaned = (value ?? '').replace(/[^\d.]/g, '');
    const dot = cleaned.indexOf('.');
    return dot < 0 ? cleaned : cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
  }

  /** True when anything differs from the blank form. */
  isDirty(): boolean {
    return [this.typeCode(), this.variantCode(), this.area(), this.gradeCode(), this.harvestDays(), this.notes()].some(
      (v) => v.trim() !== '',
    );
  }

  onCancel(): void {
    if (this.isDirty() && !window.confirm(S.LEAVE_CONFIRM)) return;
    this.cancel.emit();
  }

  save(): void {
    this.savedMessage.set('');
    this.submitted.set(true);
    if (this.hasErrors()) {
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    this.saved.emit({
      plantTypeCode: this.typeCode(),
      variantCode: this.variantCode(),
      areaAcres: this.area().trim(),
      gradeCode: this.gradeCode(),
      expectedHarvestDays: Number(this.harvestDays().trim()),
      notes: this.notes().trim(),
    });
    this.submitted.set(false);
    this.typeCode.set('');
    this.variantCode.set('');
    this.area.set('');
    this.gradeCode.set('');
    this.harvestDays.set('');
    this.notes.set('');
    this.savedMessage.set(S.SAVED_DEMO);
  }
}
