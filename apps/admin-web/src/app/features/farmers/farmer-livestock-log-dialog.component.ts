/**
 * Farmer Records → Livestock → "Log Production" modal.
 *
 * UI ONLY. Emits the entry; the host tab updates the animal's production count and "Latest" line in
 * local state. There is no admin write route for production yet (see farmer-livestock.mock.ts).
 * The quantity is a whole number kept as a STRING and never parsed as a float; the date defaults to
 * the placeholder dataset's reference "today" and future dates relative to it are rejected.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogFocusDirective } from './dialog-focus.directive';
import {
  LIVESTOCK_NOTES_MAX,
  LIVESTOCK_REFERENCE_DATE,
  PRODUCTION_TYPE_OPTIONS,
  type LivestockOption,
} from './farmer-livestock.mock';
import { LIVESTOCK_DIALOG_STYLES } from './farmer-livestock-shared';
import { FARMER_LIVESTOCK_STRINGS as S } from './farmer-livestock-tab.strings';

export interface LivestockLogEvent {
  /** PRODUCTION_TYPE_OPTIONS value. */
  readonly product: string;
  /** Whole number, kept as a string. */
  readonly quantity: string;
  /** ISO yyyy-MM-dd. */
  readonly date: string;
  readonly notes: string;
}

/** Products an animal can yield, by livestock type; the first entry is the default. */
const PRODUCTS_BY_TYPE: Readonly<Record<string, readonly string[]>> = {
  CATTLE: ['MILK', 'MANURE'],
  BUFFALO: ['MILK', 'MANURE'],
  GOAT: ['MILK', 'MANURE'],
  POULTRY: ['EGGS', 'MANURE'],
  SHEEP: ['WOOL', 'MANURE'],
};
const DEFAULT_PRODUCTS = ['MILK', 'MANURE'];

const QUANTITY_PATTERN = /^[1-9]\d{0,9}$/;

function isRealIsoDate(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

let nextLogId = 0;

@Component({
  selector: 'tohfa-farmer-livestock-log-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    LIVESTOCK_DIALOG_STYLES,
    `
      .ld {
        padding: 0;
      }
      .head {
        display: flex;
        align-items: center;
        gap: var(--space-14);
        padding: var(--space-18) var(--space-24);
        background: var(--tohfa-amber-tint);
      }
      .head-tile {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-24) * 2);
        height: calc(var(--space-24) * 2);
        border-radius: var(--r-md);
        background: var(--tohfa-amber-border);
        color: var(--tohfa-amber);
      }
      .head-tile .icon {
        font-size: var(--icon-dialog-close);
      }
      .head-text {
        flex: 1;
        min-width: 0;
      }
      .title {
        margin: 0;
        font-size: var(--fs-title-dialog);
        font-weight: var(--fw-xbold);
      }
      .subtitle {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .body {
        padding: var(--space-18) var(--space-24) var(--space-24);
      }
      .adding {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        margin: 0 0 var(--space-16);
        padding: var(--space-12) var(--space-16);
        border-radius: var(--r-md);
        background: var(--tohfa-amber);
        color: var(--tohfa-surface);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-4) var(--space-16);
      }
      .field {
        display: flex;
        flex-direction: column;
        margin-bottom: var(--space-14);
      }
      .field.wide {
        grid-column: 1 / -1;
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
      select.tohfa-input {
        appearance: none;
        cursor: pointer;
      }
      .with-trail {
        padding-right: var(--space-32);
      }
      .with-lead {
        padding-left: calc(var(--space-16) + var(--space-24));
      }
      .trail,
      .lead {
        position: absolute;
        font-size: var(--icon-input);
        color: var(--tohfa-slate);
        pointer-events: none;
      }
      .trail {
        right: var(--space-12);
      }
      .lead {
        left: var(--space-12);
        color: var(--tohfa-amber);
      }
      .readonly {
        background: var(--tohfa-amber-tint);
        border-color: var(--tohfa-amber-border);
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
      .error {
        margin-top: var(--space-4);
        font-size: var(--fs-cap);
        color: var(--err);
      }
      .info {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        margin: 0 0 var(--space-18);
        padding: var(--space-12) var(--space-16);
        border-radius: var(--r-md);
        background: var(--ok-bg);
        color: var(--ok);
        font-size: var(--fs-dense);
      }
      .foot {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-12);
      }
      .foot .tohfa-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
        font-size: var(--fs-button-l);
      }
      .foot .tohfa-btn-outline-amber {
        color: var(--tohfa-amber);
      }
      .foot .tohfa-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      @media (max-width: 720px) {
        .grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <div class="tohfa-dialog-scrim" (click)="dismissed.emit()">
      <div
        class="tohfa-dialog ld"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="ids.title"
        [attr.aria-describedby]="ids.info"
        tohfaDialogFocus
        (dialogClose)="dismissed.emit()"
        (click)="$event.stopPropagation()"
      >
        <div class="head">
          <span class="head-tile" aria-hidden="true">
            <span class="material-symbols-outlined icon">bar_chart</span>
          </span>
          <div class="head-text">
            <h2 class="title" [id]="ids.title">{{ S.LOG_TITLE }}</h2>
            <p class="subtitle">{{ S.LOG_SUBTITLE }}</p>
          </div>
          <button type="button" class="ld-close" [attr.aria-label]="S.BTN_CLOSE" [title]="S.BTN_CLOSE" (click)="dismissed.emit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
        </div>

        <div class="body">
          <p class="adding">
            <span class="material-symbols-outlined icon" aria-hidden="true">person_add</span>{{ S.addingFor(farmerName || S.DEFAULT_FARMER_NAME, farmerCode) }}
          </p>

          <div class="grid">
            <div class="field">
              <label class="tohfa-label tohfa-label-required" [for]="ids.animal">{{ S.LOG_ANIMAL }}</label>
              <div class="control">
                <span class="material-symbols-outlined lead" aria-hidden="true">pets</span>
                <input type="text" [id]="ids.animal" class="tohfa-input readonly with-lead" readonly aria-required="true" [value]="animalLabel" />
              </div>
            </div>

            <div class="field">
              <label class="tohfa-label tohfa-label-required" [for]="ids.product">{{ S.LOG_PRODUCT }}</label>
              <div class="control">
                <select
                  [id]="ids.product"
                  class="tohfa-input with-trail"
                  aria-required="true"
                  data-autofocus
                  [ngModel]="product()"
                  (ngModelChange)="product.set($event)"
                >
                  <option *ngFor="let o of options" [value]="o.value">{{ o.label }}</option>
                </select>
                <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
              </div>
            </div>

            <div class="field">
              <label class="tohfa-label tohfa-label-required" [for]="ids.date">{{ S.LOG_DATE }}</label>
              <div class="control">
                <input
                  type="date"
                  [id]="ids.date"
                  class="tohfa-input with-trail"
                  aria-required="true"
                  [attr.max]="refDate"
                  [attr.aria-invalid]="dateTouched() && !dateValid() ? 'true' : null"
                  [attr.aria-describedby]="dateTouched() && !dateValid() ? ids.dateError : null"
                  [ngModel]="date()"
                  (ngModelChange)="date.set($event ?? ''); dateTouched.set(true)"
                />
                <span class="material-symbols-outlined trail" aria-hidden="true">calendar_today</span>
              </div>
              <span class="error" role="alert" [id]="ids.dateError" *ngIf="dateTouched() && !dateValid()">{{ S.LOG_ERROR_DATE }}</span>
            </div>

            <div class="field">
              <label class="tohfa-label tohfa-label-required" [for]="ids.quantity">{{ S.LOG_QUANTITY }}</label>
              <input
                type="text"
                inputmode="numeric"
                autocomplete="off"
                [id]="ids.quantity"
                class="tohfa-input"
                aria-required="true"
                [attr.aria-invalid]="quantityTouched() && !quantityValid() ? 'true' : null"
                [attr.aria-describedby]="quantityTouched() && !quantityValid() ? ids.quantityError : null"
                [placeholder]="S.LOG_QUANTITY_PLACEHOLDER"
                [ngModel]="quantity()"
                (ngModelChange)="quantity.set(($event ?? '').trim()); quantityTouched.set(true)"
              />
              <span class="error" role="alert" [id]="ids.quantityError" *ngIf="quantityTouched() && !quantityValid()">{{ S.LOG_ERROR_QUANTITY }}</span>
            </div>

            <div class="field wide">
              <label class="tohfa-label" [for]="ids.notes">{{ S.LOG_NOTES }}</label>
              <textarea
                [id]="ids.notes"
                class="tohfa-input"
                rows="3"
                [attr.maxlength]="notesMax"
                [attr.aria-describedby]="ids.counter"
                [placeholder]="S.LOG_NOTES_PLACEHOLDER"
                [ngModel]="notes()"
                (ngModelChange)="notes.set($event ?? '')"
              ></textarea>
              <span class="counter" [id]="ids.counter" [attr.aria-label]="S.counterAria(notes().length, notesMax)">
                {{ S.counter(notes().length, notesMax) }}
              </span>
            </div>
          </div>

          <p class="info" [id]="ids.info">
            <span class="material-symbols-outlined icon" aria-hidden="true">info</span>{{ S.LOG_INFO }}
          </p>

          <div class="foot">
            <button type="button" class="tohfa-btn tohfa-btn-outline-amber" (click)="dismissed.emit()">{{ S.BTN_CANCEL }}</button>
            <button type="button" class="tohfa-btn tohfa-btn-primary" [disabled]="!canSubmit()" (click)="submit()">
              <span class="material-symbols-outlined icon" aria-hidden="true">bar_chart</span>{{ S.LOG_TITLE }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FarmerLivestockLogDialogComponent implements OnInit {
  /** "Cow COW-01 – Lakshmi" */
  @Input({ required: true }) animalLabel!: string;
  /** LIVESTOCK_TYPE_OPTIONS value; picks the products offered. */
  @Input() livestockType = '';
  @Input() farmerName = '';
  @Input() farmerCode = '';
  @Output() readonly dismissed = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<LivestockLogEvent>();

  readonly S = S;
  readonly refDate = LIVESTOCK_REFERENCE_DATE;
  readonly notesMax = LIVESTOCK_NOTES_MAX;

  private readonly uid = nextLogId++;
  readonly ids = {
    title: `lv-log-title-${this.uid}`,
    info: `lv-log-info-${this.uid}`,
    animal: `lv-log-animal-${this.uid}`,
    product: `lv-log-product-${this.uid}`,
    date: `lv-log-date-${this.uid}`,
    dateError: `lv-log-date-error-${this.uid}`,
    quantity: `lv-log-quantity-${this.uid}`,
    quantityError: `lv-log-quantity-error-${this.uid}`,
    notes: `lv-log-notes-${this.uid}`,
    counter: `lv-log-counter-${this.uid}`,
  };

  options: readonly LivestockOption[] = [];
  readonly product = signal('');
  readonly date = signal(LIVESTOCK_REFERENCE_DATE);
  readonly quantity = signal('');
  readonly notes = signal('');
  readonly dateTouched = signal(false);
  readonly quantityTouched = signal(false);

  readonly dateValid = computed(() => isRealIsoDate(this.date()) && this.date() <= LIVESTOCK_REFERENCE_DATE);
  readonly quantityValid = computed(() => QUANTITY_PATTERN.test(this.quantity()));
  readonly canSubmit = computed(() => !!this.product() && this.dateValid() && this.quantityValid());

  ngOnInit(): void {
    const allowed = PRODUCTS_BY_TYPE[this.livestockType] ?? DEFAULT_PRODUCTS;
    this.options = PRODUCTION_TYPE_OPTIONS.filter((o) => allowed.includes(o.value))
      .sort((a, b) => allowed.indexOf(a.value) - allowed.indexOf(b.value))
      .map((o) => ({ value: o.value, label: S.productOption(o.label, o.unit) }));
    this.product.set(this.options[0]?.value ?? '');
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.confirmed.emit({ product: this.product(), quantity: this.quantity(), date: this.date(), notes: this.notes().trim() });
  }
}
