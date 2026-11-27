/**
 * "Audit submitted successfully" popup (UI ONLY), opened from Review & Submit on the completed
 * Audit Inspection overview. Nothing is submitted anywhere. OK, Escape and a backdrop click all emit
 * `closed`; the host then navigates to the Audit Schedule & Assignment list. Focus handling (initial
 * focus on OK, trap, Escape, focus return) is DialogFocusDirective.
 */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogFocusDirective } from '../farmers/dialog-focus.directive';
import { AUDIT_SUBMIT_SUCCESS_STRINGS as T } from './audit-submit-success-dialog.strings';

@Component({
  selector: 'tohfa-audit-submit-success-dialog',
  standalone: true,
  imports: [DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-24);
        background: color-mix(in srgb, var(--tohfa-ink) 45%, transparent);
      }
      .dialog {
        box-sizing: border-box;
        width: 100%;
        max-width: calc(var(--space-32) * 12);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-12);
        padding: var(--space-24);
        border-radius: var(--r-dialog);
        background: var(--tohfa-surface);
        box-shadow: var(--shadow-dialog);
        font-family: var(--font);
        color: var(--tohfa-ink);
        text-align: center;
      }
      .icon-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-32) * 2);
        height: calc(var(--space-32) * 2);
        border-radius: 50%;
        background: var(--ok-bg);
        color: var(--ok);
      }
      .icon-wrap .material-symbols-outlined {
        font-size: calc(var(--space-32) * 1.5);
      }
      h2 {
        margin: 0;
        font-size: var(--fs-title-dialog);
        font-weight: var(--fw-xbold);
      }
      p {
        margin: 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        min-width: calc(var(--space-32) * 4);
        margin-top: var(--space-8);
      }
    `,
  ],
  template: `
    <div class="backdrop" (click)="onBackdrop($event)">
      <div
        class="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="submit-ok-title"
        aria-describedby="submit-ok-desc"
        tohfaDialogFocus
        (dialogClose)="close()"
      >
        <span class="icon-wrap" aria-hidden="true">
          <span class="material-symbols-outlined">check_circle</span>
        </span>
        <h2 id="submit-ok-title">{{ T.TITLE }}</h2>
        <p id="submit-ok-desc">{{ T.message(auditId, farmerName) }}</p>
        <button type="button" class="tohfa-btn tohfa-btn-primary" data-autofocus (click)="close()">
          {{ T.OK }}
        </button>
      </div>
    </div>
  `,
})
export class AuditSubmitSuccessDialogComponent {
  @Input({ required: true }) auditId = '';
  @Input({ required: true }) farmerName = '';

  @Output() readonly closed = new EventEmitter<void>();

  protected readonly T = T;

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  close(): void {
    this.closed.emit();
  }
}
