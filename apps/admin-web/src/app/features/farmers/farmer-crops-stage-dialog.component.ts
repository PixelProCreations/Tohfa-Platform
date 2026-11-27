/**
 * Plant & Crops → "Update Crop Growth Stage" dialog.
 *
 * UI ONLY. Emits the new stage, its dates, notes and the number of placeholder photos; the host tab
 * advances the crop in local state. Only stages after the current one can be chosen, so a crop can
 * never move backwards here, and harvesting is a separate action (Record Harvest).
 *
 * Stage Duration and Days Completed are read from the placeholder data only (the crop's typical
 * stage days and the date the current stage began, measured against CROPS_MOCK_TODAY); nothing
 * agronomic is computed here. "Supporting Photos" adds neutral placeholder tiles — nothing uploads.
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
import {
  CROP_DIALOG_STYLES,
  CROP_STATUS_META,
  addDays,
  daysBetween,
  formatCropDay,
  isIsoDay,
  stageSegments,
  utcDayMs,
  type StageSegmentState,
} from './farmer-crops-shared';
import { CROPS_MOCK_TODAY, CROP_STAGES, type CropStageDefMock, type FarmerCropRecordMock } from './farmer-crops.mock';
import { CROPS_LIMITS, FARMER_CROPS_STRINGS as S } from './farmer-crops-tab.strings';

export interface StageUpdateResult {
  /** Index into CROP_STAGES; always later than the crop's current stage. */
  stageIndex: number;
  stageDate: string;
  completionDate: string;
  notes: string;
  photoCount: number;
}

interface StepView {
  readonly index: number;
  readonly def: CropStageDefMock;
  readonly label: string;
  readonly state: StageSegmentState;
  readonly caption: string;
}

let nextId = 0;

@Component({
  selector: 'tohfa-farmer-crops-stage-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    CROP_DIALOG_STYLES,
    `
      .panel {
        padding: var(--space-16) var(--space-18);
        border: var(--border-card);
        border-radius: var(--r-card);
        background: var(--tohfa-surface);
      }

      /* ---------- Crop header ---------- */
      .crop-head {
        display: flex;
        align-items: center;
        gap: var(--space-14);
      }
      .crop-head-text {
        flex: 1;
        min-width: 0;
      }
      .crop-name {
        margin: 0 0 var(--space-6);
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .crop-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-6) var(--space-18);
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .crop-meta li {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
      }
      .crop-meta .icon,
      .pill .icon {
        font-size: var(--icon-row-action);
      }
      .pill {
        gap: var(--space-4);
      }

      /* ---------- Stepper ---------- */
      .stepper {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        margin: var(--space-20) 0;
        padding: 0;
        list-style: none;
      }
      .step {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
        text-align: center;
      }
      .step + .step::before {
        content: '';
        position: absolute;
        top: calc(var(--space-18) - 1px);
        right: calc(50% + var(--space-24));
        left: calc(-50% + var(--space-24));
        border-top: var(--border-divider);
      }
      .step.done + .step::before {
        border-top: var(--border-stepper-done);
      }
      .step.done + .step.current::before {
        border-top-color: var(--tohfa-amber);
      }
      .dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-18) * 2);
        height: calc(var(--space-18) * 2);
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-circle);
        background: var(--tohfa-surface);
        color: var(--tohfa-slate);
      }
      .dot .icon {
        font-size: var(--icon-nav);
      }
      .step.done .dot {
        border-color: var(--ok);
        background: var(--ok);
        color: var(--tohfa-neutral-white);
      }
      .step.current .dot {
        border-color: var(--tohfa-amber);
        background: var(--tohfa-amber);
        color: var(--tohfa-neutral-white);
      }
      .step-name {
        margin-top: var(--space-6);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .step.upcoming .step-name {
        color: var(--tohfa-slate);
      }
      .step-cap {
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .step.current .step-cap {
        color: var(--tohfa-amber);
        font-weight: var(--fw-bold);
      }

      /* ---------- Two columns ---------- */
      .cols {
        display: grid;
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        gap: var(--space-18);
        align-items: stretch;
      }
      .panel-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0 0 var(--space-16);
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .panel-title .icon {
        color: var(--ok);
      }
      .photos-title {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        margin: var(--space-4) 0;
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .hint {
        margin: 0 0 var(--space-10);
        font-size: var(--fs-cap);
        color: var(--info);
      }
      .photos {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-10);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .photo {
        position: relative;
      }
      .photo .thumb {
        width: calc(var(--space-24) * 3);
        height: calc(var(--space-24) * 3);
      }
      .photo-remove {
        position: absolute;
        top: var(--space-4);
        right: var(--space-4);
        display: inline-flex;
        padding: var(--space-4);
        border: none;
        border-radius: var(--r-circle);
        background: var(--tohfa-ink);
        color: var(--tohfa-neutral-white);
        cursor: pointer;
      }
      .photo-remove .icon {
        font-size: var(--fs-cell);
      }
      .add-photo {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-4);
        width: calc(var(--space-24) * 3);
        height: calc(var(--space-24) * 3);
        border: var(--border-dropzone);
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-amber);
        font-family: var(--font);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .photo-remove:focus-visible,
      .add-photo:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }

      .current {
        display: flex;
        flex-direction: column;
      }
      .kv-list {
        margin: 0;
      }
      .kv {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-6) 0;
        font-size: var(--fs-dense);
      }
      .kv dt {
        display: inline-flex;
        align-items: center;
        gap: var(--space-8);
        color: var(--tohfa-slate);
      }
      .kv dt .icon {
        font-size: var(--icon-row-action);
      }
      .kv dt.strong {
        color: var(--tohfa-ink);
        font-weight: var(--fw-bold);
      }
      .kv dd {
        margin: 0;
        font-weight: var(--fw-bold);
        text-align: right;
      }
      .divider {
        margin: var(--space-12) 0;
        border: none;
        border-top: var(--border-divider);
      }
      .guidance-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: var(--space-10) 0 var(--space-6);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }
      .guidance-title .icon {
        font-size: var(--icon-row-action);
        color: var(--tohfa-slate);
      }
      .guidance {
        margin: 0;
        font-size: var(--fs-dense);
        line-height: 1.5;
        color: var(--tohfa-slate);
      }
      .amber-note {
        display: flex;
        align-items: flex-start;
        gap: var(--space-10);
        margin: auto 0 0;
        padding: var(--space-14) var(--space-16);
        border: 1px solid var(--tohfa-amber-border);
        border-radius: var(--r-md);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-dense);
        line-height: 1.5;
      }
      .amber-note .icon {
        flex: none;
        color: var(--tohfa-amber);
      }
      .current .amber-note {
        margin-top: var(--space-18);
      }
      .final {
        margin: 0;
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
      }

      @media (max-width: 900px) {
        .cols {
          grid-template-columns: minmax(0, 1fr);
        }
        .stepper {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          row-gap: var(--space-14);
        }
        .step + .step::before {
          display: none;
        }
      }
    `,
  ],
  template: `
    <div class="tohfa-dialog-scrim" (click)="dismissed.emit()">
      <div
        class="tohfa-dialog cd wide"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="ids.title"
        tohfaDialogFocus
        (dialogClose)="dismissed.emit()"
        (click)="$event.stopPropagation()"
      >
        <header class="cd-head">
          <span class="material-symbols-outlined cd-head-icon" aria-hidden="true">potted_plant</span>
          <h2 class="cd-title" [id]="ids.title">{{ S.STAGE_TITLE }}</h2>
          <button type="button" class="cd-close" [attr.aria-label]="S.BTN_CLOSE" [title]="S.BTN_CLOSE" (click)="dismissed.emit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
        </header>

        <div class="cd-body">
          <section class="panel crop-head" [attr.aria-labelledby]="ids.name">
            <span class="thumb" role="img" [attr.aria-label]="S.PHOTO_ALT">
              <span class="material-symbols-outlined icon" aria-hidden="true">image</span>
            </span>
            <div class="crop-head-text">
              <h3 class="crop-name" [id]="ids.name">{{ crop.name }}</h3>
              <ul class="crop-meta">
                <li><span class="material-symbols-outlined icon" aria-hidden="true">tag</span>{{ S.cropIdChip(crop.displayId) }}</li>
                <li><span class="material-symbols-outlined icon" aria-hidden="true">location_on</span>{{ crop.plot }}</li>
                <li><span class="material-symbols-outlined icon" aria-hidden="true">bookmark</span>{{ S.acres(crop.areaAcres) }}</li>
              </ul>
            </div>
            <span class="tohfa-badge tohfa-badge-lg pill" [ngClass]="statusBadge">
              <span class="material-symbols-outlined icon" aria-hidden="true">eco</span>{{ S.STATUS_LABEL[crop.status] }}
            </span>
          </section>

          <ol class="stepper" [attr.aria-label]="S.STAGE_PROGRESS_LABEL">
            <li
              *ngFor="let s of steps()"
              class="step"
              [ngClass]="s.state"
              [attr.aria-current]="s.state === 'current' ? 'step' : null"
              [attr.aria-label]="S.stepLabel(s.index + 1, s.label, s.caption)"
            >
              <span class="dot" aria-hidden="true">
                <span class="material-symbols-outlined icon">{{ s.state === 'done' ? 'check' : s.def.icon }}</span>
              </span>
              <span class="step-name" aria-hidden="true">{{ s.label }}</span>
              <span class="step-cap" aria-hidden="true">{{ s.caption }}</span>
            </li>
          </ol>

          <div class="cols">
            <section class="panel" [attr.aria-labelledby]="ids.update">
              <h3 class="panel-title" [id]="ids.update">
                <span class="material-symbols-outlined icon" aria-hidden="true">eco</span>{{ S.UPDATE_DETAILS }}
              </h3>

              <p class="final" *ngIf="options.length === 0; else form">{{ S.FINAL_STAGE }}</p>
              <ng-template #form>
                <div class="field">
                  <label class="field-label" [for]="ids.stage">{{ S.NEW_STAGE }} <span class="req" aria-hidden="true">*</span></label>
                  <div class="select-wrap">
                    <select
                      [id]="ids.stage"
                      class="tohfa-input"
                      required
                      aria-required="true"
                      data-autofocus
                      [ngModel]="newStage()"
                      (ngModelChange)="newStage.set($event)"
                    >
                      <option *ngFor="let o of options" [ngValue]="o.index">{{ o.label }}</option>
                    </select>
                    <span class="material-symbols-outlined chev" aria-hidden="true">expand_more</span>
                  </div>
                </div>

                <div class="form-row">
                  <div class="field">
                    <label class="field-label" [for]="ids.date">{{ S.STAGE_DATE }} <span class="req" aria-hidden="true">*</span></label>
                    <input
                      [id]="ids.date"
                      type="date"
                      class="tohfa-input"
                      required
                      aria-required="true"
                      [min]="minStageDate"
                      [class.invalid]="dateError()"
                      [attr.aria-invalid]="dateError()"
                      [attr.aria-describedby]="dateError() ? ids.dateErr : null"
                      [ngModel]="stageDate()"
                      (ngModelChange)="stageDate.set($event)"
                    />
                    <p class="error" *ngIf="dateError()" [id]="ids.dateErr">{{ S.ERR_STAGE_DATE }}</p>
                  </div>
                  <div class="field">
                    <label class="field-label" [for]="ids.done">{{ S.STAGE_COMPLETION_DATE }} <span class="req" aria-hidden="true">*</span></label>
                    <input
                      [id]="ids.done"
                      type="date"
                      class="tohfa-input"
                      required
                      aria-required="true"
                      [min]="stageDate()"
                      [class.invalid]="completionError()"
                      [attr.aria-invalid]="completionError()"
                      [attr.aria-describedby]="completionError() ? ids.doneErr : null"
                      [ngModel]="completionDate()"
                      (ngModelChange)="completionDate.set($event)"
                    />
                    <p class="error" *ngIf="completionError()" [id]="ids.doneErr">{{ S.ERR_COMPLETION_DATE }}</p>
                  </div>
                </div>

                <div class="field">
                  <label class="field-label" [for]="ids.notes">{{ S.STAGE_NOTES }}</label>
                  <textarea
                    [id]="ids.notes"
                    class="tohfa-input"
                    rows="3"
                    [attr.maxlength]="maxNotes"
                    [attr.aria-describedby]="ids.counter"
                    [placeholder]="S.STAGE_NOTES_PLACEHOLDER"
                    [ngModel]="notes()"
                    (ngModelChange)="notes.set($event)"
                  ></textarea>
                  <span class="counter" [id]="ids.counter" [attr.aria-label]="S.counterAria(notes().length, maxNotes)">
                    {{ S.counter(notes().length, maxNotes) }}
                  </span>
                </div>

                <h4 class="photos-title" [id]="ids.photos">
                  <span class="material-symbols-outlined icon" aria-hidden="true">photo_camera</span>{{ S.PHOTOS }}
                </h4>
                <p class="hint">{{ S.PHOTOS_HINT }}</p>
                <ul class="photos" [attr.aria-labelledby]="ids.photos">
                  <li class="photo" *ngFor="let p of photos(); let i = index; trackBy: trackPhoto">
                    <span class="thumb" role="img" [attr.aria-label]="S.photoLabel(i + 1)">
                      <span class="material-symbols-outlined icon" aria-hidden="true">image</span>
                    </span>
                    <button type="button" class="photo-remove" [attr.aria-label]="S.removePhotoLabel(i + 1)" (click)="removePhoto(p)">
                      <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
                    </button>
                  </li>
                  <li *ngIf="photos().length < maxPhotos">
                    <!-- Local only: adds a placeholder tile; no file picker until uploads are integrated. -->
                    <button type="button" class="add-photo" (click)="addPhoto()">
                      <span class="material-symbols-outlined icon" aria-hidden="true">photo_camera</span>{{ S.ADD_PHOTO }}
                    </button>
                  </li>
                </ul>
              </ng-template>
            </section>

            <section class="panel current" [attr.aria-labelledby]="ids.current">
              <h3 class="panel-title" [id]="ids.current">{{ S.CURRENT_DETAILS }}</h3>
              <dl class="kv-list">
                <div class="kv">
                  <dt class="strong"><span class="material-symbols-outlined icon" aria-hidden="true">eco</span>{{ S.CURRENT_STAGE }}</dt>
                  <dd><span class="tohfa-badge tohfa-badge-success">{{ currentLabel }}</span></dd>
                </div>
                <div class="kv">
                  <dt><span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>{{ S.PLANTED_ON }}</dt>
                  <dd>{{ day(crop.plantedOn) }}</dd>
                </div>
                <div class="kv">
                  <dt><span class="material-symbols-outlined icon" aria-hidden="true">schedule</span>{{ S.STAGE_DURATION }}</dt>
                  <dd>{{ stageDuration === null ? S.NO_DATE : S.illustrativeDays(stageDuration) }}</dd>
                </div>
                <div class="kv">
                  <dt><span class="material-symbols-outlined icon" aria-hidden="true">check_circle</span>{{ S.DAYS_COMPLETED }}</dt>
                  <dd>{{ daysCompleted === null ? S.NO_DATE : S.days(daysCompleted) }}</dd>
                </div>
              </dl>
              <hr class="divider" />
              <dl class="kv-list">
                <div class="kv">
                  <dt class="strong"><span class="material-symbols-outlined icon" aria-hidden="true">local_florist</span>{{ S.NEXT_STAGE }}</dt>
                  <dd>
                    <span class="tohfa-badge tohfa-badge-amber-tint">{{ nextLabel }}</span>
                  </dd>
                </div>
              </dl>
              <ng-container *ngIf="guidance() as g">
                <h4 class="guidance-title">
                  <span class="material-symbols-outlined icon" aria-hidden="true">lightbulb</span>{{ S.STAGE_GUIDANCE_TITLE }}
                </h4>
                <p class="guidance">{{ g }}</p>
              </ng-container>
              <p class="amber-note" role="note">
                <span class="material-symbols-outlined icon" aria-hidden="true">info</span>{{ S.STAGE_NOTE }}
              </p>
            </section>
          </div>
        </div>

        <footer class="cd-foot">
          <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="dismissed.emit()">{{ S.BTN_CANCEL }}</button>
          <button type="button" class="tohfa-btn tohfa-btn-primary-l" [disabled]="!valid()" (click)="submit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">save</span>{{ S.BTN_SAVE_STAGE }}
          </button>
        </footer>
      </div>
    </div>
  `,
})
export class FarmerCropsStageDialogComponent implements OnInit {
  private readonly locale = inject(LOCALE_ID);

  @Input({ required: true }) crop!: FarmerCropRecordMock;
  @Output() readonly dismissed = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<StageUpdateResult>();

  readonly S = S;
  readonly maxNotes = CROPS_LIMITS.stageNotes;
  readonly maxPhotos = CROPS_LIMITS.stagePhotos;

  private readonly uid = nextId++;
  readonly ids = {
    title: `cs-title-${this.uid}`,
    name: `cs-name-${this.uid}`,
    update: `cs-update-${this.uid}`,
    current: `cs-current-${this.uid}`,
    stage: `cs-stage-${this.uid}`,
    date: `cs-date-${this.uid}`,
    dateErr: `cs-date-err-${this.uid}`,
    done: `cs-done-${this.uid}`,
    doneErr: `cs-done-err-${this.uid}`,
    notes: `cs-notes-${this.uid}`,
    counter: `cs-counter-${this.uid}`,
    photos: `cs-photos-${this.uid}`,
  };

  /** Stages later than the current one; the only choices offered. */
  options: { index: number; label: string }[] = [];
  /** The earliest allowed stage date: the day the current stage began, else the planting date. */
  minStageDate = '';
  currentLabel = '';
  nextLabel = '';
  stageDuration: number | null = null;
  daysCompleted: number | null = null;

  readonly newStage = signal<number>(-1);
  readonly stageDate = signal('');
  readonly completionDate = signal('');
  readonly notes = signal('');
  readonly photos = signal<readonly number[]>([]);
  private photoSeq = 0;

  readonly steps = signal<readonly StepView[]>([]);

  readonly dateValid = computed(() => isIsoDay(this.stageDate()) && this.stageDate() >= this.minStageDate);
  readonly completionValid = computed(
    () => isIsoDay(this.completionDate()) && this.dateValid() && utcDayMs(this.completionDate()) >= utcDayMs(this.stageDate()),
  );
  readonly dateError = computed(() => this.stageDate() !== '' && !this.dateValid());
  readonly completionError = computed(() => this.completionDate() !== '' && this.dateValid() && !this.completionValid());
  readonly valid = computed(
    () => this.newStage() > (this.crop.stageIndex ?? -1) && this.newStage() < CROP_STAGES.length && this.completionValid(),
  );
  readonly guidance = computed(() => {
    const def = CROP_STAGES[this.newStage()];
    return def ? S.STAGE_GUIDANCE[def.code] : null;
  });

  get statusBadge(): string {
    return CROP_STATUS_META[this.crop.status].badge;
  }

  ngOnInit(): void {
    const crop = this.crop;
    const current = crop.stageIndex ?? -1;
    const segments = stageSegments(crop);

    this.steps.set(
      CROP_STAGES.map((def, i) => {
        const state = segments[i]!;
        const date = crop.stageDates[i];
        let caption: string;
        if (state === 'current') caption = S.STEP_CURRENT;
        else if (state === 'upcoming') caption = S.STEP_UPCOMING;
        else caption = date ? `(${this.day(date)})` : S.STEP_SKIPPED;
        return { index: i, def, label: S.STAGE_LABEL[def.code], state, caption };
      }),
    );

    this.options = CROP_STAGES.map((def, i) => ({ index: i, label: S.STAGE_LABEL[def.code] })).filter((o) => o.index > current);

    const currentDef = CROP_STAGES[current];
    const nextDef = CROP_STAGES[current + 1];
    this.currentLabel = currentDef ? S.STAGE_LABEL[currentDef.code] : S.NO_STAGE;
    this.nextLabel = nextDef ? S.STAGE_LABEL[nextDef.code] : S.NO_DATE;

    const currentStart = current >= 0 ? (crop.stageDates[current] ?? null) : null;
    this.minStageDate = currentStart ?? crop.plantedOn;
    this.stageDuration = current >= 0 ? (crop.master.stageDays[current] ?? null) : null;
    this.daysCompleted = currentStart ? Math.max(0, daysBetween(currentStart, CROPS_MOCK_TODAY)) : null;

    if (nextDef) {
      // Pre-filled like the design: the next stage, starting "today", ending after its typical days.
      const start = CROPS_MOCK_TODAY >= this.minStageDate ? CROPS_MOCK_TODAY : this.minStageDate;
      this.newStage.set(current + 1);
      this.stageDate.set(start);
      this.completionDate.set(addDays(start, crop.master.stageDays[current + 1] ?? 0));
    }
  }

  day(iso: string): string {
    return formatCropDay(iso, this.locale);
  }

  trackPhoto(_: number, id: number): number {
    return id;
  }

  addPhoto(): void {
    if (this.photos().length >= this.maxPhotos) return;
    this.photos.update((p) => [...p, this.photoSeq++]);
  }

  removePhoto(id: number): void {
    this.photos.update((p) => p.filter((x) => x !== id));
  }

  submit(): void {
    if (!this.valid()) return;
    this.confirmed.emit({
      stageIndex: this.newStage(),
      stageDate: this.stageDate(),
      completionDate: this.completionDate(),
      notes: this.notes().trim(),
      photoCount: this.photos().length,
    });
  }
}
