/**
 * Farmer Records → Livestock → "Livestock Record Saved Successfully!" modal (SA-M3-S12f).
 *
 * UI ONLY: the record was saved to local state by the host tab. "View Livestock Record" and
 * "Close" both hand control back to the host, which returns to the livestock list.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogFocusDirective } from './dialog-focus.directive';
import { LIVESTOCK_DIALOG_STYLES } from './farmer-livestock-shared';
import { FARMER_LIVESTOCK_STRINGS as S } from './farmer-livestock-tab.strings';

let nextSavedId = 0;

@Component({
  selector: 'tohfa-farmer-livestock-saved-dialog',
  standalone: true,
  imports: [CommonModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    LIVESTOCK_DIALOG_STYLES,
    `
      .ld {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .ld-close {
        position: absolute;
        top: var(--space-16);
        right: var(--space-16);
      }
      .hero {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-32) * 2);
        height: calc(var(--space-32) * 2);
        border-radius: var(--r-circle);
        background: var(--ok-bg);
      }
      .hero-dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-24) * 2);
        height: calc(var(--space-24) * 2);
        border-radius: var(--r-circle);
        background: var(--ok);
        color: var(--tohfa-surface);
      }
      .hero-dot .icon {
        font-size: var(--icon-dialog-close);
      }
      .title {
        margin: var(--space-18) 0 var(--space-10);
        font-size: var(--fs-title-dialog);
        font-weight: var(--fw-xbold);
      }
      .body {
        margin: 0 0 var(--space-18);
        font-size: var(--fs-cell);
        line-height: 1.6;
        color: var(--tohfa-slate);
      }
      .body strong {
        color: var(--tohfa-ink);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--space-8) var(--space-20);
        width: 100%;
        margin: 0 0 var(--space-18);
        padding: var(--space-12) var(--space-16);
        border-radius: var(--r-md);
        background: var(--ok-bg);
        list-style: none;
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }
      .chips li {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
      }
      .chips .icon {
        font-size: var(--icon-row-action);
        color: var(--ok);
      }
      .actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-12);
        width: 100%;
      }
      .actions .tohfa-btn {
        width: 100%;
      }
    `,
  ],
  template: `
    <div class="tohfa-dialog-scrim" (click)="closed.emit()">
      <div
        class="tohfa-dialog ld"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="ids.title"
        [attr.aria-describedby]="ids.body"
        tohfaDialogFocus
        (dialogClose)="closed.emit()"
        (click)="$event.stopPropagation()"
      >
        <button type="button" class="ld-close" [attr.aria-label]="S.BTN_CLOSE" [title]="S.BTN_CLOSE" (click)="closed.emit()">
          <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
        </button>

        <span class="hero" aria-hidden="true">
          <span class="hero-dot"><span class="material-symbols-outlined icon">check</span></span>
        </span>
        <h2 class="title" [id]="ids.title">{{ S.SAVED_TITLE }}</h2>
        <p class="body" [id]="ids.body">
          {{ S.SAVED_BODY_BEFORE }}<br /><strong>{{ animalTitle }}</strong>{{ S.SAVED_BODY_AFTER }}
        </p>

        <ul class="chips">
          <li><span class="material-symbols-outlined icon" aria-hidden="true">pets</span>{{ livestockId }}</li>
          <li><span class="material-symbols-outlined icon" aria-hidden="true">layers</span>{{ S.sectionsUpdated(sections) }}</li>
          <li><span class="material-symbols-outlined icon" aria-hidden="true">history</span>{{ S.SAVED_HISTORY }}</li>
        </ul>

        <div class="actions">
          <button type="button" class="tohfa-btn tohfa-btn-primary-l" data-autofocus (click)="viewRecord.emit()">
            {{ S.BTN_VIEW_RECORD }}<span class="material-symbols-outlined icon" aria-hidden="true">open_in_new</span>
          </button>
          <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="closed.emit()">{{ S.BTN_CLOSE }}</button>
        </div>
      </div>
    </div>
  `,
})
export class FarmerLivestockSavedDialogComponent {
  /** "Cow · COW-01 · Lakshmi" */
  @Input({ required: true }) animalTitle!: string;
  /** "COW-01" */
  @Input({ required: true }) livestockId!: string;
  /** Number of stepper sections saved — always the full five in this design. */
  @Input() sections = 5;
  @Output() readonly viewRecord = new EventEmitter<void>();
  @Output() readonly closed = new EventEmitter<void>();

  readonly S = S;
  private readonly uid = nextSavedId++;
  readonly ids = { title: `lv-saved-title-${this.uid}`, body: `lv-saved-body-${this.uid}` };
}
