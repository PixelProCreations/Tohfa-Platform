/**
 * Plant & Crops → "Edit Crop" page, rendered in place of the crop list (back arrow returns to it).
 *
 * UI ONLY. Emits the edited values; the host tab applies them to its local placeholder data. The
 * crop code is read-only because it is server-generated and permanent (BR-150). Crop image and
 * document controls never touch a file: Replace / Remove image toggle the neutral placeholder tile,
 * and the document's download / replace buttons are inert until uploads are integrated.
 *
 * Field labels and the seven-stage day inputs follow the admin app's farm-record crop form
 * (apps/mobile/src/roles/admin/screens/farmers/AdminAddFarmRecordScreen.tsx); option lists and their
 * sources are in farmer-crops.mock.ts.
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
  inject,
  type OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { formatCropDay } from './farmer-crops-shared';
import {
  CROP_CATEGORY_OPTIONS,
  CROP_CLASSIFICATION_OPTIONS,
  CROP_FAMILY_OPTIONS,
  CROP_STAGES,
  SCIENTIFIC_NAME_OPTIONS,
  SEASON_OPTIONS,
  SOIL_OPTIONS,
  SPECIES_VARIETY_OPTIONS,
  SUPPORTED_GRADE_OPTIONS,
  ZONE_OPTIONS,
  type CropMasterMock,
  type FarmerCropRecordMock,
} from './farmer-crops.mock';
import { CROPS_LIMITS, FARMER_CROPS_STRINGS as S } from './farmer-crops-tab.strings';

export interface EditCropResult {
  name: string;
  master: CropMasterMock;
}

type SelectKey = 'category' | 'scientificName' | 'family' | 'classification' | 'variety' | 'season' | 'zone' | 'soil' | 'gradeSupported';

interface EditForm {
  name: string;
  localName: string;
  description: string;
  category: string;
  scientificName: string;
  family: string;
  classification: string;
  variety: string;
  season: string;
  zone: string;
  soil: string;
  examHarvestDays: string;
  gradeSupported: string;
  /** Digit strings, one per stage, same order as CROP_STAGES. */
  stageDays: string[];
  notes: string;
  hasImage: boolean;
}

const WHOLE_DAYS = /^\d{1,4}$/;
const POSITIVE_DAYS = /^[1-9]\d{0,3}$/;

let nextId = 0;

@Component({
  selector: 'tohfa-farmer-crops-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--space-18);
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .icon {
        font-size: var(--icon-btn);
      }

      /* ---------- Header ---------- */
      .head {
        display: flex;
        align-items: flex-start;
        gap: var(--space-12);
      }
      .back {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: var(--tohfa-min-touch-target);
        min-height: var(--tohfa-min-touch-target);
        padding: 0;
        border: none;
        border-radius: var(--r-sm);
        background: none;
        color: var(--tohfa-ink);
        cursor: pointer;
      }
      .back:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .back .icon {
        font-size: var(--icon-dialog-close);
      }
      .title {
        margin: 0;
        font-size: var(--fs-title);
        font-weight: var(--fw-xbold);
        line-height: 1.2;
      }
      .subtitle {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }

      /* ---------- Layout ---------- */
      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--space-14);
        align-items: start;
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        min-width: 0;
      }
      .col > .tohfa-card {
        padding: var(--space-18);
      }
      .card-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-12);
        margin-bottom: var(--space-16);
      }
      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .card-title .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-amber);
      }
      .card-hint {
        margin: 0;
        max-width: 50%;
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
        text-align: right;
      }

      /* ---------- Fields ---------- */
      .field {
        display: flex;
        flex-direction: column;
        min-width: 0;
        margin-bottom: var(--space-14);
      }
      .field:last-child {
        margin-bottom: 0;
      }
      .field-label {
        display: block;
        margin: 0 0 var(--space-8);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }
      .req {
        color: var(--err);
      }
      .tohfa-input {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-input);
      }
      .tohfa-input.invalid {
        border-color: var(--err);
      }
      .tohfa-input.italic {
        font-style: italic;
      }
      .tohfa-input[readonly] {
        padding-right: var(--space-32);
        background: var(--tohfa-disabled-bg);
        color: var(--tohfa-slate);
      }
      .tohfa-input[readonly]:focus {
        border-color: var(--tohfa-border);
        box-shadow: none;
      }
      textarea.tohfa-input {
        min-height: calc(var(--space-32) * 2.5);
        resize: vertical;
      }
      .control {
        position: relative;
        display: flex;
        align-items: center;
      }
      .control select {
        appearance: none;
        padding-right: var(--space-32);
        cursor: pointer;
      }
      .trail {
        position: absolute;
        right: var(--space-12);
        font-size: var(--icon-input);
        color: var(--tohfa-muted);
        pointer-events: none;
      }
      .help {
        display: flex;
        align-items: flex-start;
        gap: var(--space-6);
        margin: var(--space-6) 0 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .help .icon {
        font-size: var(--fs-cell);
      }
      .counter {
        margin-top: var(--space-4);
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
        text-align: right;
      }
      .error {
        margin: var(--space-6) 0 0;
        font-size: var(--fs-cap);
        color: var(--err);
      }

      /* ---------- Crop image ---------- */
      .image-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-12);
      }
      .thumb {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-28) * 2);
        height: calc(var(--space-28) * 2);
        border: 1px solid var(--neutral-status-bd);
        border-radius: var(--r-sm);
        background: var(--neutral-status-bg);
        color: var(--tohfa-muted);
        font-size: var(--fs-cap);
      }
      .thumb.empty {
        border-style: dashed;
      }
      .thumb .icon {
        font-size: var(--icon-dialog-close);
      }
      .btn-sm {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }
      .btn-remove {
        border-color: var(--err);
        color: var(--err);
      }
      .btn-remove:hover:not(:disabled) {
        background: var(--err-bg);
      }

      /* ---------- Growth stages ---------- */
      .stage-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-12) var(--space-12);
      }
      .stage-grid .field {
        margin-bottom: 0;
      }
      .total {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: var(--space-16) 0 0;
        padding: var(--space-12) var(--space-14);
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }

      /* ---------- Document ---------- */
      .doc {
        display: flex;
        align-items: center;
        gap: var(--space-12);
        padding: var(--space-12) var(--space-14);
        border: var(--border-card);
        border-radius: var(--r-md);
      }
      .doc-badge {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-18) * 2);
        height: calc(var(--space-18) * 2);
        border-radius: var(--r-sm);
        background: var(--err);
        color: var(--tohfa-neutral-white);
        font-size: var(--fs-badge-s);
        font-weight: var(--fw-xbold);
      }
      .doc-text {
        flex: 1;
        min-width: 0;
      }
      .doc-name {
        margin: 0;
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        overflow-wrap: anywhere;
      }
      .doc-meta {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: var(--tohfa-min-touch-target);
        min-height: var(--tohfa-min-touch-target);
        padding: 0;
        border: none;
        border-radius: var(--r-sm);
        background: none;
        color: var(--ok);
        cursor: pointer;
      }
      .icon-btn.amber {
        color: var(--tohfa-amber);
      }
      .icon-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .muted {
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-muted);
      }

      /* ---------- Footer ---------- */
      .updated {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0;
        padding: var(--space-12) var(--space-18);
        border-radius: var(--r-md);
        background: var(--tohfa-disabled-bg);
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .foot {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-12);
        padding: var(--space-16) var(--space-18);
        border-top: var(--border-divider);
        background: var(--tohfa-surface);
      }
      .foot .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }

      @media (max-width: 1100px) {
        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 720px) {
        .grid,
        .stage-grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <div class="head">
      <button type="button" class="back" data-autofocus [attr.aria-label]="S.BACK" [title]="S.BACK" (click)="cancelled.emit()">
        <span class="material-symbols-outlined icon" aria-hidden="true">arrow_back</span>
      </button>
      <div>
        <h2 class="title" [id]="ids.title">{{ S.EDIT_TITLE }}</h2>
        <p class="subtitle">{{ S.EDIT_SUBTITLE }}</p>
      </div>
    </div>

    <form class="grid" novalidate [attr.aria-labelledby]="ids.title" (ngSubmit)="save()">
      <!-- Column 1 -->
      <div class="col">
        <section class="tohfa-card" [attr.aria-labelledby]="ids.s1">
          <div class="card-head">
            <h3 class="card-title" [id]="ids.s1">
              <span class="material-symbols-outlined icon" aria-hidden="true">eco</span>{{ S.SECTION_BASIC }}
            </h3>
          </div>

          <div class="field">
            <label class="field-label" [for]="id('name')">{{ S.CROP_NAME }} <span class="req" aria-hidden="true">*</span></label>
            <input
              [id]="id('name')"
              name="name"
              class="tohfa-input"
              required
              aria-required="true"
              [attr.maxlength]="limits.name"
              [class.invalid]="showError('name')"
              [attr.aria-invalid]="showError('name')"
              [attr.aria-describedby]="showError('name') ? id('name-err') : null"
              [(ngModel)]="form.name"
            />
            <p class="error" *ngIf="showError('name')" [id]="id('name-err')">{{ S.ERR_REQUIRED }}</p>
          </div>

          <div class="field">
            <label class="field-label" [for]="id('code')">{{ S.CROP_CODE }}</label>
            <div class="control">
              <input [id]="id('code')" class="tohfa-input" readonly [value]="crop.master.code" [attr.aria-describedby]="id('code-help')" />
              <span class="material-symbols-outlined trail" aria-hidden="true">lock</span>
            </div>
            <p class="help" [id]="id('code-help')">
              <span class="material-symbols-outlined icon" aria-hidden="true">info</span>{{ S.CROP_CODE_HELP }}
            </p>
          </div>

          <ng-container *ngTemplateOutlet="selectField; context: { key: 'category', label: S.CROP_CATEGORY, list: options.category }"></ng-container>

          <div class="field">
            <label class="field-label" [for]="id('local')">{{ S.LOCAL_NAME }}</label>
            <input [id]="id('local')" name="localName" class="tohfa-input" [attr.maxlength]="limits.localName" [(ngModel)]="form.localName" />
          </div>

          <div class="field">
            <label class="field-label" [for]="id('desc')">{{ S.DESCRIPTION }}</label>
            <textarea
              [id]="id('desc')"
              name="description"
              class="tohfa-input"
              rows="3"
              [attr.maxlength]="limits.description"
              [attr.aria-describedby]="id('desc-count')"
              [(ngModel)]="form.description"
            ></textarea>
            <span class="counter" [id]="id('desc-count')" [attr.aria-label]="S.counterAria(form.description.length, limits.description)">
              {{ S.counter(form.description.length, limits.description) }}
            </span>
          </div>

          <div class="field">
            <span class="field-label" [id]="id('img')">{{ S.CROP_IMAGE }}</span>
            <div class="image-row" role="group" [attr.aria-labelledby]="id('img')">
              <span class="thumb" [class.empty]="!form.hasImage" role="img" [attr.aria-label]="form.hasImage ? S.CROP_IMAGE_ALT : S.NO_IMAGE">
                <span class="material-symbols-outlined icon" aria-hidden="true">{{ form.hasImage ? 'image' : 'hide_image' }}</span>
              </span>
              <!-- Local only: toggles the placeholder tile; no file picker until uploads are integrated. -->
              <button type="button" class="tohfa-btn tohfa-btn-outline-amber btn-sm" (click)="form.hasImage = true">
                <span class="material-symbols-outlined icon" aria-hidden="true">image</span>{{ S.REPLACE_IMAGE }}
              </button>
              <button
                type="button"
                class="tohfa-btn tohfa-btn-outline-amber btn-sm btn-remove"
                [disabled]="!form.hasImage"
                (click)="form.hasImage = false"
              >
                <span class="material-symbols-outlined icon" aria-hidden="true">delete</span>{{ S.REMOVE_IMAGE }}
              </button>
            </div>
            <p class="help">{{ S.IMAGE_HINT }}</p>
          </div>
        </section>
      </div>

      <!-- Column 2 -->
      <div class="col">
        <section class="tohfa-card" [attr.aria-labelledby]="ids.s2">
          <div class="card-head">
            <h3 class="card-title" [id]="ids.s2">
              <span class="material-symbols-outlined icon" aria-hidden="true">science</span>{{ S.SECTION_BOTANICAL }}
            </h3>
          </div>
          <ng-container
            *ngTemplateOutlet="selectField; context: { key: 'scientificName', label: S.SCIENTIFIC_NAME, list: options.scientificName, italic: true }"
          ></ng-container>
          <ng-container *ngTemplateOutlet="selectField; context: { key: 'family', label: S.CROP_FAMILY, list: options.family }"></ng-container>
          <ng-container
            *ngTemplateOutlet="selectField; context: { key: 'classification', label: S.CROP_TYPE, list: options.classification }"
          ></ng-container>
          <ng-container *ngTemplateOutlet="selectField; context: { key: 'variety', label: S.SPECIES, list: options.variety }"></ng-container>
        </section>

        <section class="tohfa-card" [attr.aria-labelledby]="ids.s3">
          <div class="card-head">
            <h3 class="card-title" [id]="ids.s3">
              <span class="material-symbols-outlined icon" aria-hidden="true">potted_plant</span>{{ S.SECTION_GROWING }}
            </h3>
          </div>
          <ng-container *ngTemplateOutlet="selectField; context: { key: 'season', label: S.SEASON, list: options.season }"></ng-container>
          <ng-container *ngTemplateOutlet="selectField; context: { key: 'zone', label: S.ZONE, list: options.zone }"></ng-container>
          <ng-container *ngTemplateOutlet="selectField; context: { key: 'soil', label: S.SOIL, list: options.soil }"></ng-container>

          <div class="field">
            <label class="field-label" [for]="id('exam')">{{ S.EXAM_HARVEST_DAYS }} <span class="req" aria-hidden="true">*</span></label>
            <input
              [id]="id('exam')"
              name="examHarvestDays"
              class="tohfa-input"
              inputmode="numeric"
              autocomplete="off"
              required
              aria-required="true"
              [class.invalid]="showExamError()"
              [attr.aria-invalid]="showExamError()"
              [attr.aria-describedby]="showExamError() ? id('exam-err') : null"
              [(ngModel)]="form.examHarvestDays"
            />
            <p class="error" *ngIf="showExamError()" [id]="id('exam-err')">{{ S.ERR_POSITIVE_DAYS }}</p>
          </div>

          <ng-container
            *ngTemplateOutlet="selectField; context: { key: 'gradeSupported', label: S.GRADES_SUPPORTED, list: options.gradeSupported }"
          ></ng-container>
        </section>
      </div>

      <!-- Column 3 -->
      <div class="col">
        <section class="tohfa-card" [attr.aria-labelledby]="ids.s4">
          <div class="card-head">
            <h3 class="card-title" [id]="ids.s4">
              <span class="material-symbols-outlined icon" aria-hidden="true">stacks</span>{{ S.SECTION_STAGES }}
            </h3>
            <p class="card-hint">{{ S.STAGES_HINT }}</p>
          </div>
          <div class="stage-grid">
            <div class="field" *ngFor="let st of stages; let i = index">
              <label class="field-label" [for]="id('stage-' + i)">
                {{ S.stageDaysLabel(i + 1, S.STAGE_LABEL[st.code]) }} <span class="req" aria-hidden="true">*</span>
              </label>
              <input
                [id]="id('stage-' + i)"
                [name]="'stage-' + i"
                class="tohfa-input"
                inputmode="numeric"
                autocomplete="off"
                required
                aria-required="true"
                [class.invalid]="showStageError(i)"
                [attr.aria-invalid]="showStageError(i)"
                [attr.aria-describedby]="showStageError(i) ? id('stage-err-' + i) : null"
                [(ngModel)]="form.stageDays[i]"
              />
              <p class="error" *ngIf="showStageError(i)" [id]="id('stage-err-' + i)">{{ S.ERR_WHOLE_DAYS }}</p>
            </div>
          </div>
          <p class="total" aria-live="polite">
            <span class="material-symbols-outlined icon" aria-hidden="true">calendar_month</span>{{ S.totalDuration(totalDays()) }}
          </p>
        </section>

        <section class="tohfa-card" [attr.aria-labelledby]="ids.s5">
          <div class="card-head">
            <h3 class="card-title" [id]="ids.s5">
              <span class="material-symbols-outlined icon" aria-hidden="true">description</span>{{ S.SECTION_NOTES }}
            </h3>
          </div>
          <div class="field">
            <label class="field-label" [for]="id('notes')">{{ S.NOTES_LIMITED }}</label>
            <textarea
              [id]="id('notes')"
              name="notes"
              class="tohfa-input"
              rows="3"
              [attr.maxlength]="limits.cropNotes"
              [attr.aria-describedby]="id('notes-count')"
              [(ngModel)]="form.notes"
            ></textarea>
            <span class="counter" [id]="id('notes-count')" [attr.aria-label]="S.counterAria(form.notes.length, limits.cropNotes)">
              {{ S.counter(form.notes.length, limits.cropNotes) }}
            </span>
          </div>
          <div class="field">
            <span class="field-label">{{ S.CROP_DOCUMENT }}</span>
            <div class="doc" *ngIf="crop.master.document as doc; else noDoc">
              <span class="doc-badge" aria-hidden="true">{{ S.PDF }}</span>
              <div class="doc-text">
                <p class="doc-name">{{ doc.name }}</p>
                <p class="doc-meta">{{ S.docMeta(doc.sizeLabel) }}</p>
              </div>
              <!-- Inert: no file exists behind the placeholder document. -->
              <button type="button" class="icon-btn" [attr.aria-label]="S.DOWNLOAD_DOC" [title]="S.DOWNLOAD_DOC">
                <span class="material-symbols-outlined icon" aria-hidden="true">download</span>
              </button>
              <!-- Inert: no file picker until uploads are integrated. -->
              <button type="button" class="icon-btn amber" [attr.aria-label]="S.REPLACE_DOC" [title]="S.REPLACE_DOC">
                <span class="material-symbols-outlined icon" aria-hidden="true">sync</span>
              </button>
            </div>
            <ng-template #noDoc><p class="muted">{{ S.NO_DOCUMENT }}</p></ng-template>
          </div>
        </section>
      </div>

      <!-- Shared select field. -->
      <ng-template #selectField let-key="key" let-label="label" let-list="list" let-italic="italic">
        <div class="field">
          <label class="field-label" [for]="id(key)">{{ label }} <span class="req" aria-hidden="true">*</span></label>
          <div class="control">
            <select
              [id]="id(key)"
              [name]="key"
              class="tohfa-input"
              required
              aria-required="true"
              [class.italic]="italic"
              [class.invalid]="showError(key)"
              [attr.aria-invalid]="showError(key)"
              [attr.aria-describedby]="showError(key) ? id(key + '-err') : null"
              [ngModel]="selectValue(key)"
              (ngModelChange)="setSelect(key, $event)"
            >
              <option *ngFor="let o of list" [ngValue]="o">{{ o }}</option>
            </select>
            <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
          </div>
          <p class="error" *ngIf="showError(key)" [id]="id(key + '-err')">{{ S.ERR_REQUIRED }}</p>
        </div>
      </ng-template>

      <!-- Lets Enter in a text field submit, as in any form. -->
      <button type="submit" hidden aria-hidden="true" tabindex="-1"></button>
    </form>

    <p class="updated">
      <span class="material-symbols-outlined icon" aria-hidden="true">info</span>
      {{ S.lastUpdated(day(crop.master.lastUpdatedOn), crop.master.lastUpdatedBy) }}
    </p>

    <div class="foot">
      <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="cancelled.emit()">{{ S.BTN_CANCEL }}</button>
      <button type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="save()">
        <span class="material-symbols-outlined icon" aria-hidden="true">save</span>{{ S.BTN_SAVE }}
      </button>
    </div>
  `,
})
export class FarmerCropsEditComponent implements OnInit {
  private readonly locale = inject(LOCALE_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input({ required: true }) crop!: FarmerCropRecordMock;
  @Output() readonly cancelled = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<EditCropResult>();

  readonly S = S;
  readonly limits = CROPS_LIMITS;
  readonly stages = CROP_STAGES;

  private readonly uid = nextId++;
  readonly ids = {
    title: `ce-title-${this.uid}`,
    s1: `ce-s1-${this.uid}`,
    s2: `ce-s2-${this.uid}`,
    s3: `ce-s3-${this.uid}`,
    s4: `ce-s4-${this.uid}`,
    s5: `ce-s5-${this.uid}`,
  };

  form!: EditForm;
  /** Option lists, each guaranteed to contain the crop's stored value so the select can show it. */
  options!: Record<SelectKey, readonly string[]>;
  /** Errors appear after the first save attempt, not while the admin is still typing. */
  submitted = false;

  ngOnInit(): void {
    const m = this.crop.master;
    this.form = {
      name: this.crop.name,
      localName: m.localName,
      description: m.description,
      category: m.category,
      scientificName: m.scientificName,
      family: m.family,
      classification: m.classification,
      variety: m.variety,
      season: m.season,
      zone: m.zone,
      soil: m.soil,
      examHarvestDays: String(m.examHarvestDays),
      gradeSupported: m.gradeSupported,
      stageDays: CROP_STAGES.map((_, i) => String(m.stageDays[i] ?? 0)),
      notes: m.notes,
      hasImage: m.hasImage,
    };
    const withValue = (list: readonly string[], value: string): readonly string[] =>
      value && !list.includes(value) ? [value, ...list] : list;
    this.options = {
      category: withValue(CROP_CATEGORY_OPTIONS, m.category),
      scientificName: withValue(SCIENTIFIC_NAME_OPTIONS, m.scientificName),
      family: withValue(CROP_FAMILY_OPTIONS, m.family),
      classification: withValue(CROP_CLASSIFICATION_OPTIONS, m.classification),
      variety: withValue(SPECIES_VARIETY_OPTIONS, m.variety),
      season: withValue(SEASON_OPTIONS, m.season),
      zone: withValue(ZONE_OPTIONS, m.zone),
      soil: withValue(SOIL_OPTIONS, m.soil),
      gradeSupported: withValue(SUPPORTED_GRADE_OPTIONS, m.gradeSupported),
    };
  }

  id(suffix: string): string {
    return `ce-${this.uid}-${suffix}`;
  }

  day(iso: string): string {
    return formatCropDay(iso, this.locale);
  }

  selectValue(key: SelectKey): string {
    return this.form[key];
  }

  setSelect(key: SelectKey, value: string): void {
    this.form[key] = value;
  }

  totalDays(): number {
    return this.form.stageDays.reduce((sum, d) => sum + (WHOLE_DAYS.test(d.trim()) ? Number(d.trim()) : 0), 0);
  }

  private requiredMissing(key: SelectKey | 'name'): boolean {
    return this.form[key].trim() === '';
  }

  showError(key: SelectKey | 'name'): boolean {
    return this.submitted && this.requiredMissing(key);
  }

  showExamError(): boolean {
    return this.submitted && !POSITIVE_DAYS.test(this.form.examHarvestDays.trim());
  }

  showStageError(i: number): boolean {
    return this.submitted && !WHOLE_DAYS.test((this.form.stageDays[i] ?? '').trim());
  }

  private isValid(): boolean {
    const keys: (SelectKey | 'name')[] = ['name', ...(Object.keys(this.options) as SelectKey[])];
    return (
      keys.every((k) => !this.requiredMissing(k)) &&
      POSITIVE_DAYS.test(this.form.examHarvestDays.trim()) &&
      this.form.stageDays.every((d) => WHOLE_DAYS.test(d.trim()))
    );
  }

  save(): void {
    this.submitted = true;
    if (!this.isValid()) {
      // Move focus to the first field the admin has to fix.
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const f = this.form;
    this.saved.emit({
      name: f.name.trim(),
      master: {
        ...this.crop.master,
        category: f.category,
        localName: f.localName.trim(),
        description: f.description.trim(),
        scientificName: f.scientificName,
        family: f.family,
        classification: f.classification,
        variety: f.variety,
        season: f.season,
        zone: f.zone,
        soil: f.soil,
        examHarvestDays: Number(f.examHarvestDays.trim()),
        gradeSupported: f.gradeSupported,
        stageDays: f.stageDays.map((d) => Number(d.trim())),
        notes: f.notes.trim(),
        hasImage: f.hasImage,
      },
    });
  }
}
