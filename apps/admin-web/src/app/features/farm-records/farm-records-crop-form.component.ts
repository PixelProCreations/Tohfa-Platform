/**
 * Add Farm Records → "Crops" tab body: five stacked section cards and the Cancel / Save Crop footer.
 * The page title, subtitle and tab pills belong to the farm-records shell.
 *
 * UI ONLY. Nothing is sent anywhere:
 * - "Generate" fills the Crop Code from a local counter in the BR-150 format (`CRP-` + 3 digits);
 *   the real code is server-generated, so the value is a placeholder.
 * - The upload tile and buttons open the browser's file chooser and show the chosen file's name.
 *   No file is read, previewed or uploaded.
 * - Every "+ Add" button is inert (aria-disabled): there is no design for adding a new option yet.
 * - Save Crop validates, announces "Saved (demo — not stored)" and emits `saved`.
 *
 * Option lists come from ../farmers/farmer-crops.mock.ts (re-exported by farm-records-crop.mock.ts).
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CROP_CATEGORY_OPTIONS,
  CROP_CLASSIFICATION_OPTIONS,
  CROP_CODE_NEXT_SEQUENCE,
  CROP_DESCRIPTION_MAX,
  CROP_FAMILY_OPTIONS,
  CROP_FILE_ACCEPT,
  CROP_FILE_MAX_BYTES,
  CROP_FILE_TYPES,
  CROP_LOCAL_NAME_MAX,
  CROP_NAME_MAX,
  CROP_NOTES_MAX,
  CROP_STAGES,
  SCIENTIFIC_NAME_OPTIONS,
  SEASON_OPTIONS,
  SOIL_OPTIONS,
  SPECIES_VARIETY_OPTIONS,
  SUPPORTED_GRADE_OPTIONS,
  ZONE_OPTIONS,
  emptyCropDraft,
  formatCropCode,
  type CropFormDraft,
} from './farm-records-crop.mock';
import { FARM_RECORDS_CROP_FORM_STRINGS as S } from './farm-records-crop-form.strings';
import { FARM_RECORDS_STRINGS as SHARED_S } from './farm-records.strings';

type SelectKey = 'category' | 'scientificName' | 'family' | 'classification' | 'variety' | 'season' | 'zone' | 'soil' | 'gradeSupported';
type RequiredKey = 'name' | 'code' | 'category' | 'scientificName' | 'family' | 'classification' | 'variety' | 'season';
type FileKind = 'image' | 'document';

/** The design marks these with an asterisk; everything else is optional. */
const REQUIRED_KEYS: readonly RequiredKey[] = ['name', 'code', 'category', 'scientificName', 'family', 'classification', 'variety', 'season'];

const WHOLE_DAYS = /^\d{1,4}$/;
const POSITIVE_DAYS = /^[1-9]\d{0,3}$/;

/** Shared across instances so a second Generate in the same session never repeats a code. */
let nextCodeSequence = CROP_CODE_NEXT_SEQUENCE;
let nextId = 0;

@Component({
  selector: 'tohfa-farm-records-crop-form',
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
      form {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
      }

      /* ---------- Section cards with tinted header ---------- */
      .section {
        padding: 0;
        overflow: hidden;
      }
      .section-head {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        margin: 0;
        padding: var(--space-12) var(--space-16);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
      }
      .section-head .icon {
        font-size: var(--icon-row-action);
      }
      .section-body {
        padding: var(--space-16);
      }
      .hint {
        margin: 0 0 var(--space-12);
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }

      /* ---------- Fields ---------- */
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-14) var(--space-16);
      }
      .field {
        display: flex;
        flex-direction: column;
        min-width: 0;
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
      .tohfa-input[readonly] {
        cursor: default;
      }
      select.tohfa-input {
        appearance: none;
        padding-right: var(--space-32);
        cursor: pointer;
      }
      select.tohfa-input.placeholder {
        color: var(--tohfa-muted);
      }
      select.tohfa-input option {
        color: var(--tohfa-ink);
      }
      textarea.tohfa-input {
        min-height: calc(var(--space-32) * 2.5);
        resize: vertical;
      }
      .trail {
        position: absolute;
        right: var(--space-12);
        font-size: var(--icon-input);
        color: var(--tohfa-muted);
        pointer-events: none;
      }
      .side-btn {
        flex: none;
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
        padding: 0 var(--space-16);
        color: var(--tohfa-amber);
        font-weight: var(--fw-bold);
      }
      .side-btn .icon {
        font-size: var(--icon-row-action);
      }
      .help {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .field-error {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-cap);
        color: var(--err);
      }
      .half {
        grid-column: 1;
      }

      /* ---------- Upload tile (section 1) ---------- */
      .upload-row {
        display: flex;
        align-items: flex-start;
        gap: var(--space-10);
      }
      .upload-tile {
        display: inline-flex;
        flex: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-4);
        width: calc(var(--space-32) * 4);
        min-height: calc(var(--space-28) * 2);
        padding: var(--space-8);
        border: 1px dashed var(--tohfa-amber);
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-amber);
        font: inherit;
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .upload-tile .icon {
        font-size: var(--icon-row-action);
      }
      .upload-tile:focus-visible,
      .dashed-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .upload-row .help {
        margin: 0;
      }
      .file-name {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
        overflow-wrap: anywhere;
      }

      /* ---------- Growth stages ---------- */
      .stage-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--space-12) var(--space-14);
        align-items: end;
      }
      .total {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: var(--tohfa-min-touch-target);
        margin: 0;
        padding: 0 var(--space-12);
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }

      /* ---------- Notes card ---------- */
      .notes-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
        gap: var(--space-16);
        align-items: start;
      }
      .files {
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
        padding-top: var(--space-20);
      }
      .dashed-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-8);
        width: 100%;
        min-height: var(--tohfa-min-touch-target);
        border: 1px dashed var(--tohfa-amber);
        border-radius: var(--tohfa-radius-button);
        background: transparent;
        color: var(--tohfa-amber);
        font: inherit;
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .dashed-btn:hover {
        background: var(--tohfa-amber-tint);
      }
      .dashed-btn .icon {
        font-size: var(--icon-row-action);
      }

      /* ---------- Footer ---------- */
      .foot {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
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
      }
      .error-summary {
        margin: 0;
      }

      @media (max-width: 960px) {
        .stage-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 720px) {
        .grid,
        .notes-grid,
        .stage-grid {
          grid-template-columns: minmax(0, 1fr);
        }
        .upload-row {
          flex-direction: column;
        }
      }
    `,
  ],
  template: `
    <form novalidate [attr.aria-label]="S.FORM_LABEL" (ngSubmit)="save()">
      <p *ngIf="submitted && !isValid()" class="tohfa-banner tohfa-banner-danger error-summary" role="alert">{{ S.ERROR_SUMMARY }}</p>

      <!-- ===== Section 1 ===== -->
      <section class="tohfa-card section" [attr.aria-labelledby]="id('s1')">
        <h3 class="section-head" [id]="id('s1')">
          <span class="material-symbols-outlined icon" aria-hidden="true">psychiatry</span>{{ S.SECTION_BASIC }}
        </h3>
        <div class="section-body grid">
          <div class="field">
            <label class="tohfa-label tohfa-label-required" [for]="id('name')">{{ S.CROP_NAME }}</label>
            <input
              [id]="id('name')"
              name="name"
              class="tohfa-input"
              autocomplete="off"
              aria-required="true"
              [attr.maxlength]="limits.name"
              [class.invalid]="showError('name')"
              [attr.aria-invalid]="showError('name') ? true : null"
              [attr.aria-describedby]="showError('name') ? id('name-err') : null"
              [(ngModel)]="form.name"
            />
            <p class="field-error" *ngIf="showError('name')" [id]="id('name-err')">{{ S.ERR_REQUIRED }}</p>
          </div>

          <div class="field">
            <label class="tohfa-label tohfa-label-required" [for]="id('code')">{{ S.CROP_CODE }}</label>
            <div class="row">
              <div class="control">
                <input
                  [id]="id('code')"
                  name="code"
                  class="tohfa-input"
                  readonly
                  aria-required="true"
                  [class.invalid]="showError('code')"
                  [attr.aria-invalid]="showError('code') ? true : null"
                  [attr.aria-describedby]="id('code-help') + (showError('code') ? ' ' + id('code-err') : '')"
                  [value]="form.code"
                />
              </div>
              <button type="button" class="tohfa-btn tohfa-btn-outline-amber side-btn" [attr.aria-disabled]="form.code !== '' ? true : null" (click)="generateCode()">
                {{ S.BTN_GENERATE }}
              </button>
            </div>
            <p class="help" [id]="id('code-help')">{{ S.CROP_CODE_HELP }}</p>
            <p class="field-error" *ngIf="showError('code')" [id]="id('code-err')">{{ S.ERR_CODE_REQUIRED }}</p>
          </div>

          <ng-container *ngTemplateOutlet="selectField; context: { key: 'category', label: S.CROP_CATEGORY, list: options.category }"></ng-container>

          <div class="field">
            <label class="tohfa-label" [for]="id('local')">{{ S.LOCAL_NAME }}</label>
            <input [id]="id('local')" name="localName" class="tohfa-input" autocomplete="off" [attr.maxlength]="limits.localName" [(ngModel)]="form.localName" />
          </div>

          <div class="field">
            <label class="tohfa-label" [for]="id('desc')">{{ S.DESCRIPTION }}</label>
            <textarea [id]="id('desc')" name="description" class="tohfa-input" rows="4" [attr.maxlength]="limits.description" [(ngModel)]="form.description"></textarea>
          </div>

          <div class="field">
            <span class="tohfa-label" [id]="id('img-label')">{{ S.UPLOAD_CROP_IMAGE }}</span>
            <div class="upload-row">
              <button
                type="button"
                class="upload-tile"
                [attr.aria-labelledby]="id('img-label') + ' ' + id('img-btn')"
                [attr.aria-describedby]="id('img-help') + ' ' + id('img-file')"
                (click)="imageInput.click()"
              >
                <span class="material-symbols-outlined icon" aria-hidden="true">upload</span>
                <span [id]="id('img-btn')">{{ S.BTN_UPLOAD }}</span>
              </button>
              <p class="help" [id]="id('img-help')">{{ S.UPLOAD_HELP }}</p>
            </div>
            <p class="file-name" [id]="id('img-file')" aria-live="polite">{{ fileLabel('image') }}</p>
            <p class="field-error" *ngIf="fileError.image" role="alert">{{ fileError.image }}</p>
          </div>
        </div>
      </section>

      <!-- ===== Section 2 ===== -->
      <section class="tohfa-card section" [attr.aria-labelledby]="id('s2')">
        <h3 class="section-head" [id]="id('s2')">
          <span class="material-symbols-outlined icon" aria-hidden="true">eco</span>{{ S.SECTION_BOTANICAL }}
        </h3>
        <div class="section-body grid">
          <ng-container *ngTemplateOutlet="selectField; context: { key: 'scientificName', label: S.SCIENTIFIC_NAME, list: options.scientificName }"></ng-container>
          <ng-container *ngTemplateOutlet="selectField; context: { key: 'family', label: S.CROP_FAMILY, list: options.family }"></ng-container>
          <ng-container *ngTemplateOutlet="selectField; context: { key: 'classification', label: S.CROP_TYPE, list: options.classification }"></ng-container>
          <ng-container *ngTemplateOutlet="selectField; context: { key: 'variety', label: S.SPECIES, list: options.variety }"></ng-container>
        </div>
      </section>

      <!-- ===== Section 3 ===== -->
      <section class="tohfa-card section" [attr.aria-labelledby]="id('s3')">
        <h3 class="section-head" [id]="id('s3')">
          <span class="material-symbols-outlined icon" aria-hidden="true">park</span>{{ S.SECTION_GROWING }}
        </h3>
        <div class="section-body grid">
          <ng-container *ngTemplateOutlet="selectField; context: { key: 'season', label: S.SEASON, list: options.season }"></ng-container>
          <ng-container *ngTemplateOutlet="selectField; context: { key: 'zone', label: S.ZONE, list: options.zone }"></ng-container>
          <ng-container *ngTemplateOutlet="selectField; context: { key: 'soil', label: S.SOIL, list: options.soil }"></ng-container>

          <div class="field">
            <label class="tohfa-label" [for]="id('exam')">{{ S.EXAM_HARVEST_DAYS }}</label>
            <input
              [id]="id('exam')"
              name="examHarvestDays"
              class="tohfa-input"
              inputmode="numeric"
              autocomplete="off"
              [class.invalid]="showExamError()"
              [attr.aria-invalid]="showExamError() ? true : null"
              [attr.aria-describedby]="showExamError() ? id('exam-err') : null"
              [(ngModel)]="form.examHarvestDays"
            />
            <p class="field-error" *ngIf="showExamError()" [id]="id('exam-err')">{{ S.ERR_POSITIVE_DAYS }}</p>
          </div>

          <div class="half">
            <ng-container *ngTemplateOutlet="selectField; context: { key: 'gradeSupported', label: S.GRADES_SUPPORTED, list: options.gradeSupported }"></ng-container>
          </div>
        </div>
      </section>

      <!-- ===== Section 4 ===== -->
      <section class="tohfa-card section" [attr.aria-labelledby]="id('s4')">
        <h3 class="section-head" [id]="id('s4')">
          <span class="material-symbols-outlined icon" aria-hidden="true">stacks</span>{{ S.SECTION_STAGES }}
        </h3>
        <div class="section-body">
          <p class="hint" [id]="id('stages-hint')">{{ S.STAGES_HINT }}</p>
          <div class="stage-grid">
            <div class="field" *ngFor="let st of stages; let i = index">
              <label class="tohfa-label" [for]="id('stage-' + i)">{{ S.stageDaysLabel(i + 1, S.STAGE_LABEL[st.code] ?? st.code) }}</label>
              <input
                [id]="id('stage-' + i)"
                [name]="'stage-' + i"
                class="tohfa-input"
                inputmode="numeric"
                autocomplete="off"
                [placeholder]="S.ENTER_DAYS"
                [class.invalid]="showStageError(i)"
                [attr.aria-invalid]="showStageError(i) ? true : null"
                [attr.aria-describedby]="showStageError(i) ? id('stage-err-' + i) : id('stages-hint')"
                [(ngModel)]="form.stageDays[i]"
              />
              <p class="field-error" *ngIf="showStageError(i)" [id]="id('stage-err-' + i)">{{ S.ERR_WHOLE_DAYS }}</p>
            </div>
            <p class="total" aria-live="polite">{{ S.totalDays(totalDays()) }}</p>
          </div>
        </div>
      </section>

      <!-- ===== Notes and files ===== -->
      <section class="tohfa-card" [attr.aria-label]="S.SECTION_NOTES">
        <div class="notes-grid">
          <div class="field">
            <label class="tohfa-label" [for]="id('notes')">{{ S.NOTES }}</label>
            <textarea
              [id]="id('notes')"
              name="notes"
              class="tohfa-input"
              rows="4"
              [placeholder]="S.NOTES_PLACEHOLDER"
              [attr.maxlength]="limits.notes"
              [attr.aria-describedby]="id('notes-help')"
              [(ngModel)]="form.notes"
            ></textarea>
            <p class="help" [id]="id('notes-help')">{{ S.NOTES_HELP }}</p>
          </div>
          <div class="files">
            <button type="button" class="dashed-btn" [attr.aria-describedby]="id('img-file')" (click)="imageInput.click()">
              <span class="material-symbols-outlined icon" aria-hidden="true">upload</span>{{ S.UPLOAD_CROP_IMAGE }}
            </button>
            <button type="button" class="dashed-btn" [attr.aria-describedby]="id('doc-file')" (click)="documentInput.click()">
              <span class="material-symbols-outlined icon" aria-hidden="true">upload</span>{{ S.UPLOAD_CROP_DOCUMENT }}
            </button>
            <p class="file-name" [id]="id('doc-file')" aria-live="polite">{{ fileLabel('document') }}</p>
            <p class="field-error" *ngIf="fileError.document" role="alert">{{ fileError.document }}</p>
          </div>
        </div>
      </section>

      <!-- Hidden native choosers: local only, the chosen file is never read or uploaded. -->
      <input #imageInput type="file" hidden tabindex="-1" aria-hidden="true" [accept]="fileAccept" (change)="onFile('image', $event)" />
      <input #documentInput type="file" hidden tabindex="-1" aria-hidden="true" [accept]="fileAccept" (change)="onFile('document', $event)" />

      <div class="foot">
        <p class="status" aria-live="polite">{{ statusMessage }}</p>
        <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="onCancel()">{{ S.BTN_CANCEL }}</button>
        <button type="submit" class="tohfa-btn tohfa-btn-primary-l">{{ S.BTN_SAVE }}</button>
      </div>

      <!-- Shared select + inert "+ Add" row. -->
      <ng-template #selectField let-key="key" let-label="label" let-list="list">
        <div class="field">
          <label class="tohfa-label" [class.tohfa-label-required]="isRequired(key)" [for]="id(key)">{{ label }}</label>
          <div class="row">
            <div class="control">
              <select
                [id]="id(key)"
                [name]="key"
                class="tohfa-input"
                [class.placeholder]="selectValue(key) === ''"
                [attr.aria-required]="isRequired(key) ? true : null"
                [class.invalid]="showError(key)"
                [attr.aria-invalid]="showError(key) ? true : null"
                [attr.aria-describedby]="showError(key) ? id(key + '-err') : null"
                [ngModel]="selectValue(key)"
                (ngModelChange)="setSelect(key, $event)"
              >
                <option value="">{{ S.SELECT_PLACEHOLDER }}</option>
                <option *ngFor="let o of list" [value]="o">{{ o }}</option>
              </select>
              <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
            </div>
            <!-- Inert: no design exists yet for adding a new option. -->
            <button type="button" class="tohfa-btn tohfa-btn-outline-amber side-btn" aria-disabled="true" [title]="S.ADD_NOT_AVAILABLE">
              <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.BTN_ADD }}<span class="sr-only">: {{ label }}</span>
            </button>
          </div>
          <p class="field-error" *ngIf="showError(key)" [id]="id(key + '-err')">{{ S.ERR_REQUIRED }}</p>
        </div>
      </ng-template>
    </form>
  `,
})
export class FarmRecordsCropFormComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  @Output() readonly cancel = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<void>();

  readonly S = S;
  readonly stages = CROP_STAGES;
  readonly fileAccept = CROP_FILE_ACCEPT;
  readonly limits = {
    name: CROP_NAME_MAX,
    localName: CROP_LOCAL_NAME_MAX,
    description: CROP_DESCRIPTION_MAX,
    notes: CROP_NOTES_MAX,
  };
  readonly options: Readonly<Record<SelectKey, readonly string[]>> = {
    category: CROP_CATEGORY_OPTIONS,
    scientificName: SCIENTIFIC_NAME_OPTIONS,
    family: CROP_FAMILY_OPTIONS,
    classification: CROP_CLASSIFICATION_OPTIONS,
    variety: SPECIES_VARIETY_OPTIONS,
    season: SEASON_OPTIONS,
    zone: ZONE_OPTIONS,
    soil: SOIL_OPTIONS,
    gradeSupported: SUPPORTED_GRADE_OPTIONS,
  };

  private readonly uid = nextId++;

  form: CropFormDraft = emptyCropDraft(CROP_STAGES.length);
  /** Chosen file names, local only. */
  files: Record<FileKind, string> = { image: '', document: '' };
  fileError: Record<FileKind, string> = { image: '', document: '' };
  /** Errors appear after the first save attempt, not while the admin is still typing. */
  submitted = false;
  statusMessage = '';

  id(suffix: string): string {
    return `frc-${this.uid}-${suffix}`;
  }

  isRequired(key: string): boolean {
    return (REQUIRED_KEYS as readonly string[]).includes(key);
  }

  selectValue(key: SelectKey): string {
    return this.form[key];
  }

  setSelect(key: SelectKey, value: string): void {
    this.form[key] = value ?? '';
  }

  /** True when anything differs from the blank form. */
  isDirty(): boolean {
    return (
      JSON.stringify(this.form) !== JSON.stringify(emptyCropDraft(CROP_STAGES.length)) ||
      !!this.files.image ||
      !!this.files.document
    );
  }

  /** Confirm-if-dirty, then ask the shell to leave. */
  onCancel(): void {
    if (this.isDirty() && !window.confirm(SHARED_S.LEAVE_CONFIRM)) return;
    this.cancel.emit();
  }

  generateCode(): void {
    if (this.form.code) return;
    this.form.code = formatCropCode(nextCodeSequence++);
  }

  fileLabel(kind: FileKind): string {
    return this.files[kind] ? S.chosenFile(this.files[kind]) : S.NO_FILE;
  }

  onFile(kind: FileKind, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Reset so choosing the same file again still fires `change`.
    input.value = '';
    if (!file) return;
    if (!CROP_FILE_TYPES.includes(file.type)) {
      this.fileError[kind] = S.ERR_FILE_TYPE;
      return;
    }
    if (file.size > CROP_FILE_MAX_BYTES) {
      this.fileError[kind] = S.ERR_FILE_TOO_LARGE;
      return;
    }
    this.fileError[kind] = '';
    this.files[kind] = file.name;
  }

  totalDays(): number {
    return this.form.stageDays.reduce((sum, d) => sum + (WHOLE_DAYS.test(d.trim()) ? Number(d.trim()) : 0), 0);
  }

  private missing(key: RequiredKey): boolean {
    return this.form[key].trim() === '';
  }

  showError(key: string): boolean {
    return this.submitted && this.isRequired(key) && this.missing(key as RequiredKey);
  }

  private examInvalid(): boolean {
    const v = this.form.examHarvestDays.trim();
    return v !== '' && !POSITIVE_DAYS.test(v);
  }

  showExamError(): boolean {
    return this.submitted && this.examInvalid();
  }

  private stageInvalid(i: number): boolean {
    const v = (this.form.stageDays[i] ?? '').trim();
    return v !== '' && !WHOLE_DAYS.test(v);
  }

  showStageError(i: number): boolean {
    return this.submitted && this.stageInvalid(i);
  }

  isValid(): boolean {
    return (
      REQUIRED_KEYS.every((k) => !this.missing(k)) &&
      !this.examInvalid() &&
      this.form.stageDays.every((_, i) => !this.stageInvalid(i))
    );
  }

  save(): void {
    this.submitted = true;
    this.statusMessage = '';
    if (!this.isValid()) {
      // Move focus to the first field the admin has to fix.
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    this.statusMessage = S.SAVED_DEMO;
    this.saved.emit();
  }
}
