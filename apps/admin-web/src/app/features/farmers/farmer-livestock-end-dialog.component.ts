/**
 * Farmer Records → Livestock → "End this animal's record?" modal (SA-M3-S12h).
 *
 * UI ONLY. Emits the chosen event type, date and reason; the host tab marks the animal Ended in
 * local state. The farmer-side contract is POST /farmers/me/livestock/animals/{id}/lifecycle-events
 * (eventType SOLD | TRANSFERRED | CULLED | DECEASED, reason ≤ 500); ending is terminal (BR-47).
 * The API only requires eventType; the design additionally requires the date and the reason, so
 * End Record stays disabled until both are filled.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogFocusDirective } from './dialog-focus.directive';
import {
  END_REASON_OPTIONS,
  LIVESTOCK_END_REASON_MAX,
  LIVESTOCK_REFERENCE_DATE,
  type LivestockEndEvent,
} from './farmer-livestock.mock';
import { LIVESTOCK_DIALOG_STYLES } from './farmer-livestock-shared';
import { FARMER_LIVESTOCK_STRINGS as S } from './farmer-livestock-tab.strings';

let nextEndId = 0;

@Component({
  selector: 'tohfa-farmer-livestock-end-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    LIVESTOCK_DIALOG_STYLES,
    `
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        margin-bottom: var(--space-18);
      }
      .title {
        margin: 0;
        font-size: var(--fs-title-dialog);
        font-weight: var(--fw-xbold);
      }
      .ld-close {
        border-color: var(--tohfa-border);
        background: var(--tohfa-surface);
      }
      .editing {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        margin: 0 0 var(--space-14);
        padding: var(--space-12) var(--space-16);
        border-radius: var(--r-md);
        background: var(--tohfa-amber);
        color: var(--tohfa-surface);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .animal {
        margin: 0 0 var(--space-16);
        padding: var(--space-10) var(--space-14);
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-md);
        background: var(--tohfa-surface);
      }
      .animal dt {
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .animal dd {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .field {
        display: flex;
        flex-direction: column;
        margin-bottom: var(--space-16);
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
      .trail {
        position: absolute;
        right: var(--space-12);
        font-size: var(--icon-input);
        color: var(--tohfa-slate);
        pointer-events: none;
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
      .warn {
        display: flex;
        align-items: flex-start;
        gap: var(--space-10);
        margin: 0 0 var(--space-18);
        padding: var(--space-14) var(--space-16);
        border-radius: var(--r-md);
        background: var(--err-bg);
        color: var(--err);
        font-size: var(--fs-dense);
        line-height: 1.5;
      }
      .warn .icon {
        flex: none;
        font-size: var(--icon-btn);
      }
      .foot {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-12);
      }
      .foot .tohfa-btn-outline-amber {
        font-size: var(--fs-button-l);
        color: var(--tohfa-amber);
      }
      .foot .tohfa-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
        [attr.aria-describedby]="ids.warn"
        tohfaDialogFocus
        (dialogClose)="dismissed.emit()"
        (click)="$event.stopPropagation()"
      >
        <div class="head">
          <h2 class="title" [id]="ids.title">{{ S.END_TITLE }}</h2>
          <button type="button" class="ld-close" [attr.aria-label]="S.BTN_CLOSE" [title]="S.BTN_CLOSE" (click)="dismissed.emit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
        </div>

        <p class="editing">
          <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.editingFor(farmerName || S.DEFAULT_FARMER_NAME, farmerCode) }}
        </p>

        <dl class="animal">
          <dt>{{ S.END_ANIMAL }}</dt>
          <dd>{{ animalLabel }}</dd>
        </dl>

        <div class="field">
          <label class="tohfa-label tohfa-label-required" [for]="ids.event">{{ S.END_WHAT_HAPPENED }}</label>
          <div class="control">
            <select
              [id]="ids.event"
              class="tohfa-input with-trail"
              aria-required="true"
              data-autofocus
              [ngModel]="eventType()"
              (ngModelChange)="eventType.set($event)"
            >
              <option *ngFor="let o of options" [value]="o.value">{{ o.label }}</option>
            </select>
            <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
          </div>
        </div>

        <div class="field">
          <label class="tohfa-label tohfa-label-required" [for]="ids.date">{{ S.END_DATE }}</label>
          <div class="control">
            <input
              type="date"
              [id]="ids.date"
              class="tohfa-input with-trail"
              aria-required="true"
              [ngModel]="date()"
              (ngModelChange)="date.set($event ?? '')"
            />
            <span class="material-symbols-outlined trail" aria-hidden="true">calendar_today</span>
          </div>
        </div>

        <div class="field">
          <label class="tohfa-label tohfa-label-required" [for]="ids.reason">{{ S.END_REASON }}</label>
          <textarea
            [id]="ids.reason"
            class="tohfa-input"
            rows="3"
            aria-required="true"
            [attr.maxlength]="max"
            [attr.aria-describedby]="ids.counter"
            [placeholder]="S.END_REASON_PLACEHOLDER"
            [ngModel]="reason()"
            (ngModelChange)="reason.set($event)"
          ></textarea>
          <span class="counter" [id]="ids.counter" [attr.aria-label]="S.counterAria(reason().length, max)">
            {{ S.counter(reason().length, max) }}
          </span>
        </div>

        <p class="warn" [id]="ids.warn">
          <span class="material-symbols-outlined icon" aria-hidden="true">warning</span>{{ S.END_WARNING }}
        </p>

        <div class="foot">
          <button type="button" class="tohfa-btn tohfa-btn-outline-amber" (click)="dismissed.emit()">{{ S.BTN_CANCEL }}</button>
          <button type="button" class="tohfa-btn tohfa-btn-danger-l" [disabled]="!canSubmit()" (click)="submit()">
            {{ S.BTN_END_RECORD }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class FarmerLivestockEndDialogComponent {
  /** "Cow COW-01" */
  @Input({ required: true }) animalLabel!: string;
  @Input() farmerName = '';
  @Input() farmerCode = '';
  @Output() readonly dismissed = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<LivestockEndEvent>();

  readonly S = S;
  readonly options = END_REASON_OPTIONS;
  readonly max = LIVESTOCK_END_REASON_MAX;

  private readonly uid = nextEndId++;
  readonly ids = {
    title: `lv-end-title-${this.uid}`,
    warn: `lv-end-warn-${this.uid}`,
    event: `lv-end-event-${this.uid}`,
    date: `lv-end-date-${this.uid}`,
    reason: `lv-end-reason-${this.uid}`,
    counter: `lv-end-counter-${this.uid}`,
  };

  readonly eventType = signal(END_REASON_OPTIONS[0]?.value ?? '');
  /** Defaults to the placeholder dataset's reference "today", as in the design. */
  readonly date = signal(LIVESTOCK_REFERENCE_DATE);
  readonly reason = signal('');

  readonly canSubmit = computed(() => !!this.eventType() && !!this.date() && this.reason().trim().length > 0);

  submit(): void {
    if (!this.canSubmit()) return;
    this.confirmed.emit({ eventType: this.eventType(), date: this.date(), reason: this.reason().trim() });
  }
}
