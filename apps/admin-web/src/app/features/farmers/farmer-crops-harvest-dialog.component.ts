/**
 * Plant & Crops → "Record Harvest" dialog.
 *
 * UI ONLY. Emits the harvest date, whole-kg quantity, grade, source and notes; the host tab closes
 * the crop as Harvested in local state. When the API lands this becomes the planting PATCH
 * (`actualHarvestOn`, `actualYieldKg`, `status: HARVESTED`) guarded by its own rbac.json permission
 * and recorded in audit_log.
 *
 * Validation kept from the system: the harvest date may not precede planting (DB check
 * `farm_crops_harvest_after_planting_chk`), and the quantity is a whole number of kilograms, as the
 * admin app's "Quantity (whole kg)" field asks. The quantity stays a digit string end to end — it is
 * never parsed into a float.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
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
import { DialogFocusDirective } from './dialog-focus.directive';
import { CROP_DIALOG_STYLES, formatCropDay, isIsoDay, utcDayMs } from './farmer-crops-shared';
import {
  CROPS_MOCK_TODAY,
  CROP_GRADE_OPTIONS,
  CROP_STAGES,
  HARVEST_SOURCE_OPTIONS,
  type CropGradeMock,
  type FarmerCropRecordMock,
  type HarvestSourceMock,
} from './farmer-crops.mock';
import { CROPS_LIMITS, FARMER_CROPS_STRINGS as S } from './farmer-crops-tab.strings';

export interface HarvestResult {
  harvestedOn: string;
  /** Whole kilograms, validated as a digit string before conversion. */
  yieldKg: number;
  grade: CropGradeMock | null;
  source: HarvestSourceMock | null;
  notes: string;
}

/** A positive whole number written with digits only: no sign, decimal point or exponent. */
const WHOLE_KG = /^[1-9]\d{0,9}$/;

let nextId = 0;

@Component({
  selector: 'tohfa-farmer-crops-harvest-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    CROP_DIALOG_STYLES,
    `
      .editing {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        margin-bottom: var(--space-18);
        padding: var(--space-12) var(--space-18);
        border-radius: var(--r-md);
        background: var(--tohfa-amber);
        color: var(--tohfa-neutral-white);
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .summary {
        display: flex;
        align-items: center;
        gap: var(--space-18);
        padding: var(--space-16) var(--space-18);
        border: var(--border-card);
        border-radius: var(--r-md);
      }
      .summary-text {
        flex: 1;
        min-width: 0;
      }
      .cap {
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .crop-name {
        margin: var(--space-4) 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .status-line {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .status-line .icon,
      .meta .icon {
        font-size: var(--icon-row-action);
      }
      .crop-id {
        text-align: right;
      }
      .crop-id strong {
        display: block;
        margin-top: var(--space-4);
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-8) var(--space-18);
        margin: var(--space-10) 0 var(--space-18);
        padding: 0;
        list-style: none;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .meta li {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
      }
      .meta strong {
        color: var(--tohfa-ink);
      }
      .date-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }
      .note {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        margin-top: var(--space-4);
        padding: var(--space-14) var(--space-18);
        border-radius: var(--r-md);
        background: var(--err-bg);
        color: var(--err);
        font-size: var(--fs-dense);
      }
      .note .icon {
        flex: none;
      }
      .cd-foot .tohfa-btn {
        flex: 1;
      }
    `,
  ],
  template: `
    <div class="tohfa-dialog-scrim" (click)="dismissed.emit()">
      <div
        class="tohfa-dialog cd"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="ids.title"
        tohfaDialogFocus
        (dialogClose)="dismissed.emit()"
        (click)="$event.stopPropagation()"
      >
        <header class="cd-head">
          <span class="material-symbols-outlined cd-head-icon" aria-hidden="true">agriculture</span>
          <h2 class="cd-title" [id]="ids.title">{{ S.HARVEST_TITLE }}</h2>
          <button type="button" class="cd-close" [attr.aria-label]="S.BTN_CLOSE" [title]="S.BTN_CLOSE" (click)="dismissed.emit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
        </header>

        <div class="cd-body">
          <p class="editing">
            <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.editingFor(farmerName, farmerCode) }}
          </p>

          <section class="summary" [attr.aria-label]="S.CROP">
            <span class="thumb" role="img" [attr.aria-label]="S.PHOTO_ALT">
              <span class="material-symbols-outlined icon" aria-hidden="true">image</span>
            </span>
            <div class="summary-text">
              <p class="cap">{{ S.CROP }}</p>
              <h3 class="crop-name">{{ S.cropWithPlot(crop.name, crop.plot) }}</h3>
              <p class="status-line">
                <span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>{{ S.STATUS_LABEL[crop.status] }}
              </p>
            </div>
            <div class="crop-id">
              <p class="cap">{{ S.CROP_ID }}</p>
              <strong>{{ crop.displayId }}</strong>
            </div>
          </section>

          <ul class="meta">
            <li>
              <span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>{{ S.PLANTED }}
              <strong>{{ day(crop.plantedOn) }}</strong>
            </li>
            <li>
              <span class="material-symbols-outlined icon" aria-hidden="true">eco</span>{{ S.CURRENT_STAGE_SHORT }}
              <span class="tohfa-badge tohfa-badge-sm tohfa-badge-success">{{ stageLabel }}</span>
            </li>
            <li>
              <span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>{{ S.EXPECTED_HARVEST_SHORT }}
              <strong>{{ crop.expectedHarvestOn ? day(crop.expectedHarvestOn) : S.NO_DATE }}</strong>
            </li>
          </ul>

          <div class="form-row">
            <div class="field">
              <label class="field-label" [for]="ids.date">{{ S.HARVEST_DATE }} <span class="req" aria-hidden="true">*</span></label>
              <div class="date-wrap">
                <input
                  [id]="ids.date"
                  type="date"
                  class="tohfa-input"
                  required
                  aria-required="true"
                  data-autofocus
                  [min]="crop.plantedOn"
                  [class.invalid]="dateError()"
                  [attr.aria-invalid]="dateError()"
                  [attr.aria-describedby]="dateError() ? ids.dateErr : null"
                  [ngModel]="harvestDate()"
                  (ngModelChange)="harvestDate.set($event)"
                />
              </div>
              <p class="error" *ngIf="dateError()" [id]="ids.dateErr">{{ S.ERR_HARVEST_DATE }}</p>
            </div>
            <div class="field">
              <label class="field-label" [for]="ids.qty">{{ S.HARVEST_QTY }} <span class="req" aria-hidden="true">*</span></label>
              <input
                [id]="ids.qty"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                class="tohfa-input"
                required
                aria-required="true"
                [placeholder]="S.HARVEST_QTY_PLACEHOLDER"
                [class.invalid]="qtyError()"
                [attr.aria-invalid]="qtyError()"
                [attr.aria-describedby]="qtyError() ? ids.qtyErr : null"
                [ngModel]="quantity()"
                (ngModelChange)="quantity.set($event)"
              />
              <p class="error" *ngIf="qtyError()" [id]="ids.qtyErr">{{ S.ERR_HARVEST_QTY }}</p>
            </div>
            <div class="field">
              <label class="field-label" [for]="ids.grade">{{ S.HARVEST_GRADE }}</label>
              <div class="select-wrap">
                <select [id]="ids.grade" class="tohfa-input" [ngModel]="grade()" (ngModelChange)="grade.set($event)">
                  <option [ngValue]="null">{{ S.HARVEST_GRADE_PLACEHOLDER }}</option>
                  <option *ngFor="let g of grades" [ngValue]="g.value">{{ g.label }}</option>
                </select>
                <span class="material-symbols-outlined chev" aria-hidden="true">expand_more</span>
              </div>
            </div>
            <div class="field">
              <label class="field-label" [for]="ids.source">{{ S.HARVEST_SOURCE }}</label>
              <div class="select-wrap">
                <select [id]="ids.source" class="tohfa-input" [ngModel]="source()" (ngModelChange)="source.set($event)">
                  <option [ngValue]="null">{{ S.HARVEST_SOURCE_PLACEHOLDER }}</option>
                  <option *ngFor="let s of sources" [ngValue]="s.value">{{ s.label }}</option>
                </select>
                <span class="material-symbols-outlined chev" aria-hidden="true">expand_more</span>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.notes">{{ S.HARVEST_NOTES }}</label>
            <textarea
              [id]="ids.notes"
              class="tohfa-input"
              rows="3"
              [attr.maxlength]="maxNotes"
              [attr.aria-describedby]="ids.counter"
              [placeholder]="S.HARVEST_NOTES_PLACEHOLDER"
              [ngModel]="notes()"
              (ngModelChange)="notes.set($event)"
            ></textarea>
            <span class="counter" [id]="ids.counter" [attr.aria-label]="S.counterAria(notes().length, maxNotes)">
              {{ S.counter(notes().length, maxNotes) }}
            </span>
          </div>

          <p class="note" role="note">
            <span class="material-symbols-outlined icon" aria-hidden="true">warning</span>{{ S.HARVEST_WARNING }}
          </p>
        </div>

        <footer class="cd-foot">
          <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="dismissed.emit()">{{ S.BTN_CANCEL }}</button>
          <button type="button" class="tohfa-btn tohfa-btn-primary-l" [disabled]="!valid()" (click)="submit()">
            {{ S.BTN_RECORD_HARVEST }}
          </button>
        </footer>
      </div>
    </div>
  `,
})
export class FarmerCropsHarvestDialogComponent implements OnInit {
  private readonly locale = inject(LOCALE_ID);

  @Input({ required: true }) crop!: FarmerCropRecordMock;
  @Input() farmerName = '';
  @Input() farmerCode = '';
  @Output() readonly dismissed = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<HarvestResult>();

  readonly S = S;
  readonly grades = CROP_GRADE_OPTIONS;
  readonly sources = HARVEST_SOURCE_OPTIONS;
  readonly maxNotes = CROPS_LIMITS.harvestNotes;

  private readonly uid = nextId++;
  readonly ids = {
    title: `ch-title-${this.uid}`,
    date: `ch-date-${this.uid}`,
    dateErr: `ch-date-err-${this.uid}`,
    qty: `ch-qty-${this.uid}`,
    qtyErr: `ch-qty-err-${this.uid}`,
    grade: `ch-grade-${this.uid}`,
    source: `ch-source-${this.uid}`,
    notes: `ch-notes-${this.uid}`,
    counter: `ch-counter-${this.uid}`,
  };

  readonly harvestDate = signal('');
  readonly quantity = signal('');
  readonly grade = signal<CropGradeMock | null>(null);
  readonly source = signal<HarvestSourceMock | null>(null);
  readonly notes = signal('');

  private readonly plantedMs = signal(Number.NaN);

  readonly dateValid = computed(() => isIsoDay(this.harvestDate()) && utcDayMs(this.harvestDate()) >= this.plantedMs());
  readonly qtyValid = computed(() => WHOLE_KG.test(this.quantity().trim()));
  /** Errors show once the field holds something; an empty required field only disables the button. */
  readonly dateError = computed(() => this.harvestDate() !== '' && !this.dateValid());
  readonly qtyError = computed(() => this.quantity().trim() !== '' && !this.qtyValid());
  readonly valid = computed(() => this.dateValid() && this.qtyValid());

  get stageLabel(): string {
    const stage = this.crop.stageIndex === null ? null : CROP_STAGES[this.crop.stageIndex];
    return stage ? S.STAGE_LABEL[stage.code] : S.NO_STAGE;
  }

  ngOnInit(): void {
    this.plantedMs.set(utcDayMs(this.crop.plantedOn));
    // Placeholder "today": the design opens with the harvest date pre-filled.
    this.harvestDate.set(CROPS_MOCK_TODAY >= this.crop.plantedOn ? CROPS_MOCK_TODAY : this.crop.plantedOn);
  }

  day(iso: string): string {
    return formatCropDay(iso, this.locale);
  }

  submit(): void {
    if (!this.valid()) return;
    this.confirmed.emit({
      harvestedOn: this.harvestDate(),
      yieldKg: Number(this.quantity().trim()),
      grade: this.grade(),
      source: this.source(),
      notes: this.notes().trim(),
    });
  }
}
