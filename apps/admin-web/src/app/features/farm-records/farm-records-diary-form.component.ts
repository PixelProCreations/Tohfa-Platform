/**
 * Add Farm Records → Diary tab ("Diary Records" card).
 *
 * UI ONLY. There is no admin (on-behalf) diary write endpoint, so Save validates locally, shows a
 * "Saved (demo — not stored)" status, emits the draft through `saved` and clears the form. Option lists
 * and limits are reused from the Farmer Records diary editor (../farmers/farmer-diary-edit.mock.ts).
 * Photos are placeholder tiles only — the add tile never opens a file chooser or loads an image.
 * The "+ Add" buttons beside the selects are inert: their add-option dialogs have no design yet.
 *
 * When integrated: contract in docs/openapi.yaml, a `requirePermission` code in docs/rbac.json, an
 * audit_log row with the write, and the wage sent as integer paise.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DIARY_CATEGORIES, DIARY_CROPS, DIARY_PLOTS } from '../farmers/farmer-diary-edit.mock';
import { FARM_RECORDS_FORM_STYLES } from './farm-records-add.styles';
import { FARM_RECORDS_LIMITS, FARM_RECORDS_REFERENCE_DATE } from './farm-records.mock';
import { FARM_RECORDS_STRINGS as S } from './farm-records.strings';

/** What `saved` emits. Hours and wage stay strings so no float arithmetic touches them. */
export interface FarmRecordsDiaryDraft {
  /** ISO date (yyyy-MM-dd). */
  readonly date: string;
  readonly plotId: string;
  readonly categoryKey: string;
  readonly activityKey: string;
  readonly minutes: number;
  readonly linkedCropId: string | null;
  readonly notes: string;
  readonly workers: readonly { readonly name: string; readonly hours: string; readonly wageRupees: string }[];
  readonly photoCount: number;
}

interface WorkerRow {
  readonly uid: number;
  name: string;
  hours: string;
  wageRupees: string;
}

type FieldKey = 'date' | 'plot' | 'category' | 'activity' | 'minutes';

const L = FARM_RECORDS_LIMITS.diary;
const DIGITS = /^\d+$/;
const HOURS = /^(\d{1,2})(?:\.(\d{1,2}))?$/;
const WAGE = new RegExp(`^[1-9]\\d{0,${L.wageMaxChars - 1}}$`);
/** The design pre-fills "Time spent" with 0. */
const DEFAULT_MINUTES = '0';

/** > 0 and ≤ 24 with at most two decimals, compared as integers (no float parsing). */
function validHours(value: string): boolean {
  const m = HOURS.exec(value.trim());
  if (!m) return false;
  const whole = Number(m[1]);
  const frac = Number((m[2] ?? '0').padEnd(2, '0'));
  if (whole > L.hoursMax || (whole === L.hoursMax && frac > 0)) return false;
  return whole > 0 || frac > 0;
}

let nextId = 0;

@Component({
  selector: 'tohfa-farm-records-diary-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    FARM_RECORDS_FORM_STYLES,
    `
      input[type='date'] {
        padding-right: var(--space-32);
      }
      /* The native picker indicator is laid invisibly over the calendar icon so clicking it opens the picker. */
      input[type='date']::-webkit-calendar-picker-indicator {
        position: absolute;
        right: var(--space-12);
        opacity: 0;
        cursor: pointer;
      }

      /* ---------- Workforce ---------- */
      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        margin-bottom: var(--space-8);
      }
      .section-head .field-label {
        margin: 0;
      }
      .link-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4);
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--tohfa-amber);
        font-family: var(--font);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .link-btn:hover:not(:disabled) {
        color: var(--tohfa-amber-hover);
      }
      .link-btn:disabled {
        color: var(--tohfa-disabled-fg);
        cursor: not-allowed;
      }
      .link-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .workers {
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .worker {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) auto;
        align-items: start;
        gap: var(--space-10);
      }
      .sub-label {
        display: block;
        margin: 0 0 var(--space-6);
        font-size: var(--fs-cap);
        font-weight: var(--fw-semi);
        color: var(--tohfa-slate);
      }
      .del-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--tohfa-min-touch-target);
        height: var(--tohfa-min-touch-target);
        margin-top: calc(var(--space-6) + var(--fs-cap) * 1.4);
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--err);
        cursor: pointer;
      }
      .del-btn:hover {
        background: var(--err-bg);
      }
      .del-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .wf-empty {
        margin: 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-muted);
      }

      /* ---------- Photos ---------- */
      .photos {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-10);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .photos li {
        position: relative;
      }
      .tile {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-20) * 3);
        height: calc(var(--space-20) * 3);
        border-radius: var(--r-md);
      }
      .tile-photo {
        border: 1px solid var(--neutral-status-bd);
        background: var(--neutral-status-bg);
        color: var(--tohfa-muted);
      }
      .tile-photo > .icon {
        font-size: var(--icon-dialog-close);
      }
      .tile-x {
        position: absolute;
        top: calc(var(--space-6) * -1);
        right: calc(var(--space-6) * -1);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--space-20);
        height: var(--space-20);
        padding: 0;
        border: none;
        border-radius: var(--r-circle);
        background: var(--tohfa-ink);
        color: var(--tohfa-surface);
        cursor: pointer;
      }
      .tile-x .icon {
        font-size: var(--icon-row-action);
      }
      .tile-x:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .tile-add {
        border: 1px dashed var(--purple-bd);
        background: var(--purple-bg);
        color: var(--purple);
        cursor: pointer;
      }
      .tile-add .icon {
        font-size: var(--icon-dialog-close);
      }
      .tile-add:hover:not(:disabled) {
        border-color: var(--purple);
      }
      .tile-add:disabled {
        border-color: var(--tohfa-border);
        background: var(--tohfa-disabled-bg);
        color: var(--tohfa-disabled-fg);
        cursor: not-allowed;
      }
      .tile-add:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
    `,
  ],
  template: `
    <form class="tohfa-card card" novalidate [attr.aria-labelledby]="ids.title" (ngSubmit)="save()">
      <h2 class="card-head" [id]="ids.title">
        <span class="material-symbols-outlined icon" aria-hidden="true">calendar_month</span>{{ S.DIARY_CARD }}
      </h2>

      <div class="card-body">
        <!-- ================= Left column ================= -->
        <div class="col">
          <div class="field">
            <label class="field-label" [for]="ids.date">{{ S.DIARY_DATE }} <span class="req" aria-hidden="true">*</span></label>
            <div class="control">
              <input
                type="date"
                class="tohfa-input"
                name="date"
                [id]="ids.date"
                required
                aria-required="true"
                [class.invalid]="err('date')"
                [attr.aria-invalid]="err('date') ? 'true' : null"
                [attr.aria-describedby]="err('date') ? ids.date + '-err' : null"
                [ngModel]="date()"
                (ngModelChange)="date.set($event ?? '')"
              />
              <span class="material-symbols-outlined trail" aria-hidden="true">calendar_today</span>
            </div>
            <p class="field-error" *ngIf="err('date') as e" [id]="ids.date + '-err'">{{ e }}</p>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.category">{{ S.DIARY_CATEGORY }} <span class="req" aria-hidden="true">*</span></label>
            <div class="row">
              <div class="control">
                <select
                  class="tohfa-input"
                  name="category"
                  [id]="ids.category"
                  required
                  aria-required="true"
                  [class.placeholder]="!categoryKey()"
                  [class.invalid]="err('category')"
                  [attr.aria-invalid]="err('category') ? 'true' : null"
                  [attr.aria-describedby]="err('category') ? ids.category + '-err' : null"
                  [ngModel]="categoryKey()"
                  (ngModelChange)="onCategory($event)"
                >
                  <option value="" disabled>{{ S.DIARY_CATEGORY_PLACEHOLDER }}</option>
                  <option *ngFor="let c of categories" [value]="c.key">{{ c.label }}</option>
                </select>
                <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
              </div>
              <ng-container *ngTemplateOutlet="addBtn"></ng-container>
            </div>
            <p class="field-error" *ngIf="err('category') as e" [id]="ids.category + '-err'">{{ e }}</p>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.minutes">{{ S.DIARY_MINUTES }} <span class="req" aria-hidden="true">*</span></label>
            <input
              type="number"
              inputmode="numeric"
              class="tohfa-input"
              name="minutes"
              autocomplete="off"
              step="1"
              [min]="0"
              [max]="limits.minutesMax"
              [id]="ids.minutes"
              required
              aria-required="true"
              [class.invalid]="err('minutes')"
              [attr.aria-invalid]="err('minutes') ? 'true' : null"
              [attr.aria-describedby]="err('minutes') ? ids.minutes + '-err' : null"
              [ngModel]="minutes()"
              (ngModelChange)="minutes.set($event === null || $event === undefined ? '' : String($event))"
            />
            <p class="field-error" *ngIf="err('minutes') as e" [id]="ids.minutes + '-err'">{{ e }}</p>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.notes">{{ S.DIARY_NOTES }}</label>
            <textarea
              class="tohfa-input"
              name="notes"
              rows="5"
              [id]="ids.notes"
              [attr.maxlength]="limits.notesMax"
              [attr.aria-describedby]="ids.notes + '-counter'"
              [placeholder]="S.DIARY_NOTES_PLACEHOLDER"
              [ngModel]="notes()"
              (ngModelChange)="notes.set(($event ?? '').slice(0, limits.notesMax))"
            ></textarea>
            <span class="counter" [id]="ids.notes + '-counter'" [attr.aria-label]="S.counterAria(notes().length, limits.notesMax)">
              {{ S.counter(notes().length, limits.notesMax) }}
            </span>
          </div>
        </div>

        <!-- ================= Right column ================= -->
        <div class="col">
          <div class="field">
            <label class="field-label" [for]="ids.plot">{{ S.DIARY_PLOT }} <span class="req" aria-hidden="true">*</span></label>
            <div class="row">
              <div class="control">
                <select
                  class="tohfa-input"
                  name="plot"
                  [id]="ids.plot"
                  required
                  aria-required="true"
                  [class.placeholder]="!plotId()"
                  [class.invalid]="err('plot')"
                  [attr.aria-invalid]="err('plot') ? 'true' : null"
                  [attr.aria-describedby]="err('plot') ? ids.plot + '-err' : null"
                  [ngModel]="plotId()"
                  (ngModelChange)="onPlot($event)"
                >
                  <option value="" disabled>{{ S.DIARY_PLOT_PLACEHOLDER }}</option>
                  <option *ngFor="let p of plots" [value]="p.id">{{ p.name }}</option>
                </select>
                <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
              </div>
              <ng-container *ngTemplateOutlet="addBtn"></ng-container>
            </div>
            <p class="field-error" *ngIf="err('plot') as e" [id]="ids.plot + '-err'">{{ e }}</p>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.activity">{{ S.DIARY_ACTIVITY }} <span class="req" aria-hidden="true">*</span></label>
            <div class="row">
              <div class="control">
                <select
                  class="tohfa-input"
                  name="activity"
                  [id]="ids.activity"
                  required
                  aria-required="true"
                  [disabled]="activities().length === 0"
                  [class.placeholder]="!activityKey()"
                  [class.invalid]="err('activity')"
                  [attr.aria-invalid]="err('activity') ? 'true' : null"
                  [attr.aria-describedby]="err('activity') ? ids.activity + '-err' : null"
                  [ngModel]="activityKey()"
                  (ngModelChange)="activityKey.set($event ?? '')"
                >
                  <option value="" disabled>
                    {{ activities().length === 0 ? S.DIARY_ACTIVITY_PLACEHOLDER_NO_CATEGORY : S.DIARY_ACTIVITY_PLACEHOLDER }}
                  </option>
                  <option *ngFor="let a of activities()" [value]="a.key">{{ a.label }}</option>
                </select>
                <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
              </div>
              <ng-container *ngTemplateOutlet="addBtn"></ng-container>
            </div>
            <p class="field-error" *ngIf="err('activity') as e" [id]="ids.activity + '-err'">{{ e }}</p>
          </div>

          <div class="field">
            <label class="field-label" [for]="ids.crop">{{ S.DIARY_LINKED_CROP }}</label>
            <div class="control">
              <select
                class="tohfa-input"
                name="crop"
                [id]="ids.crop"
                [class.placeholder]="!linkedCropId()"
                [ngModel]="linkedCropId()"
                (ngModelChange)="linkedCropId.set($event ?? '')"
              >
                <option value="">{{ S.DIARY_LINKED_CROP_NONE }}</option>
                <option *ngFor="let c of crops()" [value]="c.id">{{ c.name }}</option>
              </select>
              <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
            </div>
          </div>

          <section [attr.aria-labelledby]="ids.wf">
            <div class="section-head">
              <h3 class="field-label" [id]="ids.wf">{{ S.DIARY_WORKFORCE }}</h3>
              <button type="button" class="link-btn" [disabled]="workers().length >= limits.workersMax" (click)="addWorker()">
                {{ S.DIARY_ADD_WORKER }}<span class="material-symbols-outlined icon" aria-hidden="true">add</span>
              </button>
            </div>
            <ul class="workers" *ngIf="workers().length > 0; else noWorkers">
              <li class="worker" *ngFor="let w of workers(); let i = index; trackBy: trackWorker">
                <div class="field">
                  <label class="sub-label" [for]="ids.row + w.uid + '-name'">{{ S.workerLabel(i + 1) }}</label>
                  <input
                    type="text"
                    class="tohfa-input"
                    autocomplete="off"
                    maxlength="120"
                    [name]="'worker-' + w.uid"
                    [id]="ids.row + w.uid + '-name'"
                    [class.invalid]="rowErr(w.uid, 'name')"
                    [attr.aria-invalid]="rowErr(w.uid, 'name') ? 'true' : null"
                    [attr.aria-describedby]="rowErr(w.uid, 'name') ? ids.row + w.uid + '-name-err' : null"
                    [ngModel]="w.name"
                    (ngModelChange)="patchWorker(w.uid, { name: $event ?? '' })"
                  />
                  <p class="field-error" *ngIf="rowErr(w.uid, 'name') as e" [id]="ids.row + w.uid + '-name-err'">{{ e }}</p>
                </div>
                <div class="field">
                  <label class="sub-label" [for]="ids.row + w.uid + '-hours'">
                    <span aria-hidden="true">{{ S.DIARY_COL_HOURS }}</span><span class="sr-only">{{ S.hoursLabel(i + 1) }}</span>
                  </label>
                  <input
                    type="text"
                    inputmode="decimal"
                    class="tohfa-input"
                    autocomplete="off"
                    [name]="'hours-' + w.uid"
                    [id]="ids.row + w.uid + '-hours'"
                    [attr.maxlength]="limits.hoursMaxChars"
                    [class.invalid]="rowErr(w.uid, 'hours')"
                    [attr.aria-invalid]="rowErr(w.uid, 'hours') ? 'true' : null"
                    [attr.aria-describedby]="rowErr(w.uid, 'hours') ? ids.row + w.uid + '-hours-err' : null"
                    [ngModel]="w.hours"
                    (ngModelChange)="patchWorker(w.uid, { hours: decimalOnly($event) })"
                  />
                  <p class="field-error" *ngIf="rowErr(w.uid, 'hours') as e" [id]="ids.row + w.uid + '-hours-err'">{{ e }}</p>
                </div>
                <div class="field">
                  <label class="sub-label" [for]="ids.row + w.uid + '-wage'">
                    <span aria-hidden="true">{{ S.DIARY_COL_WAGE }}</span><span class="sr-only">{{ S.wageLabel(i + 1) }}</span>
                  </label>
                  <input
                    type="text"
                    inputmode="numeric"
                    class="tohfa-input"
                    autocomplete="off"
                    [name]="'wage-' + w.uid"
                    [id]="ids.row + w.uid + '-wage'"
                    [attr.maxlength]="limits.wageMaxChars"
                    [class.invalid]="rowErr(w.uid, 'wage')"
                    [attr.aria-invalid]="rowErr(w.uid, 'wage') ? 'true' : null"
                    [attr.aria-describedby]="rowErr(w.uid, 'wage') ? ids.row + w.uid + '-wage-err' : null"
                    [ngModel]="w.wageRupees"
                    (ngModelChange)="patchWorker(w.uid, { wageRupees: digitsOnly($event) })"
                  />
                  <p class="field-error" *ngIf="rowErr(w.uid, 'wage') as e" [id]="ids.row + w.uid + '-wage-err'">{{ e }}</p>
                </div>
                <button
                  type="button"
                  class="del-btn"
                  [attr.aria-label]="S.removeWorker(i + 1)"
                  [title]="S.removeWorker(i + 1)"
                  (click)="removeWorker(w.uid)"
                >
                  <span class="material-symbols-outlined icon" aria-hidden="true">delete</span>
                </button>
              </li>
            </ul>
            <ng-template #noWorkers>
              <p class="wf-empty">{{ S.DIARY_NO_WORKERS }}</p>
            </ng-template>
          </section>

          <section [attr.aria-labelledby]="ids.photos">
            <h3 class="field-label" [id]="ids.photos">{{ S.DIARY_PHOTOS }}</h3>
            <ul class="photos">
              <li *ngFor="let p of photos(); let i = index; trackBy: trackPhoto">
                <span class="tile tile-photo" role="img" [attr.aria-label]="S.photoLabel(i + 1)">
                  <span class="material-symbols-outlined icon" aria-hidden="true">image</span>
                </span>
                <button
                  type="button"
                  class="tile-x"
                  [attr.aria-label]="S.removePhoto(i + 1)"
                  [title]="S.removePhoto(i + 1)"
                  (click)="removePhoto(p)"
                >
                  <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
                </button>
              </li>
              <li *ngIf="photos().length < limits.photosMax">
                <!-- Local placeholder only: adds a neutral tile, never opens a file chooser. -->
                <button
                  type="button"
                  class="tile tile-add"
                  [attr.aria-label]="S.DIARY_ADD_PHOTO"
                  [title]="S.DIARY_ADD_PHOTO"
                  (click)="addPhoto()"
                >
                  <span class="material-symbols-outlined icon" aria-hidden="true">add_a_photo</span>
                </button>
              </li>
            </ul>
            <p class="sr-only" aria-live="polite">{{ S.photosRemaining(photos().length, limits.photosMax) }}</p>
          </section>
        </div>
      </div>
    </form>

    <div class="foot">
      <p class="form-error" *ngIf="submitted() && hasErrors()" role="alert">{{ S.ERR_FORM }}</p>
      <p class="status" role="status">{{ savedMessage() }}</p>
      <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="onCancel()">{{ S.BTN_CANCEL }}</button>
      <button type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="save()">{{ S.BTN_SAVE }}</button>
    </div>

    <ng-template #addBtn>
      <!-- Inert: the add-option dialog has no design yet. -->
      <button type="button" class="tohfa-btn tohfa-btn-outline-amber add-btn" aria-disabled="true" [title]="S.ADD_OPTION_NOT_AVAILABLE">
        <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.BTN_ADD }}
      </button>
    </ng-template>
  `,
})
export class FarmRecordsDiaryFormComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Cancel was confirmed (or the form was clean); the host leaves the screen. */
  @Output() readonly cancel = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<FarmRecordsDiaryDraft>();

  readonly S = S;
  readonly String = String;
  readonly limits = L;
  readonly plots = DIARY_PLOTS;
  readonly categories = DIARY_CATEGORIES;

  private readonly uid = nextId++;
  readonly ids = {
    title: `frd-title-${this.uid}`,
    date: `frd-date-${this.uid}`,
    plot: `frd-plot-${this.uid}`,
    category: `frd-category-${this.uid}`,
    activity: `frd-activity-${this.uid}`,
    minutes: `frd-minutes-${this.uid}`,
    crop: `frd-crop-${this.uid}`,
    notes: `frd-notes-${this.uid}`,
    wf: `frd-wf-${this.uid}`,
    row: `frd-row-${this.uid}-`,
    photos: `frd-photos-${this.uid}`,
  };

  private nextLocal = 0;

  readonly date = signal(FARM_RECORDS_REFERENCE_DATE);
  readonly plotId = signal('');
  readonly categoryKey = signal('');
  readonly activityKey = signal('');
  readonly minutes = signal(DEFAULT_MINUTES);
  readonly linkedCropId = signal('');
  readonly notes = signal('');
  readonly workers = signal<readonly WorkerRow[]>(this.blankWorkers());
  readonly photos = signal<readonly number[]>([]);
  readonly submitted = signal(false);
  readonly savedMessage = signal('');

  readonly activities = computed(() => this.categories.find((c) => c.key === this.categoryKey())?.activities ?? []);
  readonly crops = computed(() => DIARY_CROPS.filter((c) => c.plotId === this.plotId()));

  private readonly fieldErrors = computed<Partial<Record<FieldKey, string>>>(() => {
    const errors: Partial<Record<FieldKey, string>> = {};
    if (!this.date()) errors.date = S.ERR_REQUIRED;
    if (!this.plotId()) errors.plot = S.ERR_REQUIRED;
    if (!this.categoryKey()) errors.category = S.ERR_REQUIRED;
    if (!this.activityKey()) errors.activity = S.ERR_REQUIRED;
    const m = this.minutes().trim();
    if (!m) errors.minutes = S.ERR_REQUIRED;
    else if (!DIGITS.test(m) || Number(m) < L.minutesMin || Number(m) > L.minutesMax) {
      errors.minutes = S.minutesRange(L.minutesMin, L.minutesMax);
    }
    return errors;
  });

  /** A completely blank worker line is ignored; a partly filled one must be complete. */
  private readonly rowErrors = computed(() => {
    const out = new Map<string, string>();
    for (const w of this.workers()) {
      if (this.isBlankWorker(w)) continue;
      if (!w.name.trim()) out.set(`${w.uid}:name`, S.ERR_WORKER_NAME);
      if (!w.hours) out.set(`${w.uid}:hours`, S.ERR_REQUIRED);
      else if (!validHours(w.hours)) out.set(`${w.uid}:hours`, S.hoursRange(L.hoursMax));
      if (!w.wageRupees) out.set(`${w.uid}:wage`, S.ERR_REQUIRED);
      else if (!WAGE.test(w.wageRupees)) out.set(`${w.uid}:wage`, S.WAGE_WHOLE);
    }
    return out;
  });

  readonly hasErrors = computed(() => Object.keys(this.fieldErrors()).length > 0 || this.rowErrors().size > 0);

  err(key: FieldKey): string | null {
    return this.submitted() ? (this.fieldErrors()[key] ?? null) : null;
  }

  rowErr(uid: number, key: 'name' | 'hours' | 'wage'): string | null {
    return this.submitted() ? (this.rowErrors().get(`${uid}:${key}`) ?? null) : null;
  }

  onPlot(id: string | null): void {
    this.plotId.set(id ?? '');
    // The linked crop must be growing on the chosen plot (BR-42b), so a stale choice is cleared.
    if (!this.crops().some((c) => c.id === this.linkedCropId())) this.linkedCropId.set('');
  }

  onCategory(key: string | null): void {
    this.categoryKey.set(key ?? '');
    if (!this.activities().some((a) => a.key === this.activityKey())) this.activityKey.set('');
  }

  addWorker(): void {
    if (this.workers().length >= L.workersMax) return;
    const uid = this.nextLocal++;
    this.workers.update((rows) => [...rows, { uid, name: '', hours: '', wageRupees: '' }]);
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`#${this.ids.row}${uid}-name`)?.focus());
  }

  removeWorker(uid: number): void {
    this.workers.update((rows) => rows.filter((r) => r.uid !== uid));
  }

  patchWorker(uid: number, patch: Partial<Omit<WorkerRow, 'uid'>>): void {
    this.workers.update((rows) => rows.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));
  }

  addPhoto(): void {
    if (this.photos().length >= L.photosMax) return;
    this.photos.update((p) => [...p, this.nextLocal++]);
  }

  removePhoto(id: number): void {
    this.photos.update((p) => p.filter((x) => x !== id));
  }

  digitsOnly(value: string | null): string {
    return (value ?? '').replace(/\D/g, '');
  }

  decimalOnly(value: string | null): string {
    const cleaned = (value ?? '').replace(/[^\d.]/g, '');
    const dot = cleaned.indexOf('.');
    return dot < 0 ? cleaned : cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
  }

  trackWorker(_: number, w: WorkerRow): number {
    return w.uid;
  }

  trackPhoto(_: number, id: number): number {
    return id;
  }

  /** True when anything differs from the blank form. Used by the host's leave confirmation. */
  isDirty(): boolean {
    return (
      this.date() !== FARM_RECORDS_REFERENCE_DATE ||
      this.plotId() !== '' ||
      this.categoryKey() !== '' ||
      this.activityKey() !== '' ||
      this.minutes().trim() !== DEFAULT_MINUTES ||
      this.linkedCropId() !== '' ||
      this.notes().trim() !== '' ||
      this.workers().some((w) => !this.isBlankWorker(w)) ||
      this.photos().length > 0
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
      date: this.date(),
      plotId: this.plotId(),
      categoryKey: this.categoryKey(),
      activityKey: this.activityKey(),
      minutes: Number(this.minutes().trim()),
      linkedCropId: this.linkedCropId() || null,
      notes: this.notes().trim(),
      workers: this.workers()
        .filter((w) => !this.isBlankWorker(w))
        .map((w) => ({ name: w.name.trim(), hours: w.hours.trim(), wageRupees: w.wageRupees })),
      photoCount: this.photos().length,
    });
    this.reset();
    this.savedMessage.set(S.SAVED_DEMO);
  }

  private reset(): void {
    this.submitted.set(false);
    this.date.set(FARM_RECORDS_REFERENCE_DATE);
    this.plotId.set('');
    this.categoryKey.set('');
    this.activityKey.set('');
    this.minutes.set(DEFAULT_MINUTES);
    this.linkedCropId.set('');
    this.notes.set('');
    this.workers.set(this.blankWorkers());
    this.photos.set([]);
  }

  /** The design shows one empty workforce line by default. */
  private blankWorkers(): WorkerRow[] {
    return [{ uid: this.nextLocal++, name: '', hours: '', wageRupees: '' }];
  }

  private isBlankWorker(w: WorkerRow): boolean {
    return !w.name.trim() && !w.hours && !w.wageRupees;
  }
}
