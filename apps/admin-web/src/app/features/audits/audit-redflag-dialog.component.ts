/**
 * "Red-flag this audit?" dialog (design 95, SA-M5-S05a). UI ONLY.
 *
 * Opened from the Red flag card of Audit Details & Farmer Records (AuditDetailFullComponent). The
 * summary rows are inputs so the host passes the audit's own mock values. Nothing is sent anywhere:
 * "Red-flag Audit" only emits `confirmed` and the host updates its local card state. There is no
 * red-flag endpoint or column yet (docs/openapi.yaml, db/migrations/0027_audits.sql) — a
 * specification gap to close before this is integrated.
 *
 * The confirm button stays disabled until at least one finding type is ticked and the reason is
 * non-blank. Focus handling (initial focus, trap, Escape, focus return) is DialogFocusDirective;
 * backdrop click and the close X emit `closed`.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { DialogFocusDirective } from '../farmers/dialog-focus.directive';
import { AUDIT_REDFLAG_DIALOG_STRINGS as R } from './audit-redflag-dialog.strings';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';

/** What the host receives when the admin confirms. */
export interface AuditRedFlagConfirmation {
  readonly minor: boolean;
  readonly major: boolean;
  /** Trimmed, never empty. */
  readonly reason: string;
}

@Component({
  selector: 'tohfa-audit-redflag-dialog',
  standalone: true,
  imports: [CommonModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
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
        max-width: calc(var(--space-32) * 15);
        max-height: calc(100vh - var(--space-24) * 2);
        overflow-y: auto;
        border-radius: var(--r-dialog);
        background: var(--tohfa-surface);
        box-shadow: var(--shadow-dialog);
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .head {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        padding: var(--space-16) var(--space-18);
        border-bottom: var(--border-divider);
      }
      .head-icon {
        font-size: var(--icon-btn);
        color: var(--err);
      }
      .head h2 {
        flex: 1;
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .close {
        display: inline-flex;
        padding: var(--space-4);
        border: none;
        border-radius: var(--r-xs);
        background: transparent;
        color: var(--tohfa-slate);
        cursor: pointer;
      }
      .close .material-symbols-outlined {
        font-size: var(--icon-dialog-close);
      }
      .close:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .body {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        padding: var(--space-14) var(--space-14) var(--space-16);
      }
      .summary {
        margin: 0;
        padding: 0 var(--space-12);
        border: var(--border-card);
        border-radius: var(--r-sm);
      }
      .summary-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-10);
        padding: var(--space-8) 0;
        border-bottom: var(--border-divider);
        font-size: var(--fs-cap);
      }
      .summary-row:last-child {
        border-bottom: none;
      }
      .summary-row dt {
        color: var(--tohfa-slate);
        font-weight: var(--fw-semi);
      }
      .summary-row dd {
        margin: 0;
        color: var(--tohfa-ink);
        font-weight: var(--fw-xbold);
        text-align: right;
      }
      fieldset {
        margin: 0;
        padding: 0;
        border: none;
        min-width: 0;
      }
      .checks {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-10);
      }
      .check-tile {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: var(--space-8);
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-8) var(--space-10);
        border: var(--border-card);
        border-radius: var(--r-sm);
        background: var(--tohfa-surface);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .check-tile.checked {
        border-color: var(--tohfa-amber);
        background: var(--tohfa-amber-tint);
      }
      .check-tile:focus-within {
        box-shadow: var(--tohfa-focus-ring);
      }
      .check-tile input {
        width: var(--space-16);
        height: var(--space-16);
        margin: 0;
        accent-color: var(--tohfa-amber);
        cursor: pointer;
      }
      .check-tile input:focus-visible {
        outline: none;
      }
      .reason-label {
        font-size: var(--fs-cap);
      }
      .footer {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-10);
      }
      .footer .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
      }
      @media (max-width: 480px) {
        .checks,
        .footer {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <div class="backdrop" (click)="onBackdrop($event)">
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rf-dialog-title"
        aria-describedby="rf-dialog-desc"
        tohfaDialogFocus
        (dialogClose)="close()"
      >
        <div class="head">
          <span class="material-symbols-outlined head-icon" aria-hidden="true">flag</span>
          <h2 id="rf-dialog-title">{{ R.TITLE }}</h2>
          <button type="button" class="close" [attr.aria-label]="R.CLOSE" (click)="close()">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
        <p class="sr-only" id="rf-dialog-desc">{{ R.DESCRIPTION }}</p>

        <form class="body" novalidate (submit)="confirm($event)">
          <dl class="summary" [attr.aria-label]="R.SUMMARY_LABEL">
            <div class="summary-row">
              <dt>{{ R.ROW_AUDIT }}</dt>
              <dd>{{ auditId }}</dd>
            </div>
            <div class="summary-row">
              <dt>{{ R.ROW_FARM }}</dt>
              <dd>{{ farmName }}</dd>
            </div>
            <div class="summary-row">
              <dt>{{ R.ROW_MINOR }}</dt>
              <dd>{{ minorFindings }}</dd>
            </div>
            <div class="summary-row">
              <dt>{{ R.ROW_MAJOR }}</dt>
              <dd>{{ majorFindings }}</dd>
            </div>
          </dl>

          <fieldset>
            <legend class="sr-only">{{ R.FINDING_TYPES }}</legend>
            <div class="checks">
              <label class="check-tile" [class.checked]="minor()">
                <input
                  type="checkbox"
                  data-autofocus
                  [checked]="minor()"
                  (change)="minor.set($any($event.target).checked)"
                />
                {{ R.CHECK_MINOR }}
              </label>
              <label class="check-tile" [class.checked]="major()">
                <input type="checkbox" [checked]="major()" (change)="major.set($any($event.target).checked)" />
                {{ R.CHECK_MAJOR }}
              </label>
            </div>
          </fieldset>

          <div class="audit-field">
            <label class="audit-label required reason-label" for="rf-dialog-reason">{{ R.REASON }}</label>
            <textarea
              id="rf-dialog-reason"
              class="audit-control"
              required
              aria-required="true"
              [placeholder]="R.REASON_PLACEHOLDER"
              [value]="reason()"
              (input)="reason.set($any($event.target).value)"
            ></textarea>
          </div>

          <p class="sr-only" id="rf-dialog-hint">{{ R.CONFIRM_HINT }}</p>
          <div class="footer">
            <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="close()">{{ R.CANCEL }}</button>
            <button
              type="submit"
              class="tohfa-btn tohfa-btn-primary-l"
              [disabled]="!canConfirm()"
              [attr.aria-describedby]="canConfirm() ? null : 'rf-dialog-hint'"
            >
              {{ R.CONFIRM }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AuditRedFlagDialogComponent {
  @Input({ required: true }) auditId = '';
  @Input({ required: true }) farmName = '';
  @Input({ required: true }) minorFindings = 0;
  @Input({ required: true }) majorFindings = 0;

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<AuditRedFlagConfirmation>();

  protected readonly R = R;

  readonly minor = signal(false);
  readonly major = signal(false);
  readonly reason = signal('');

  readonly canConfirm = computed(() => (this.minor() || this.major()) && this.reason().trim() !== '');

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  close(): void {
    this.closed.emit();
  }

  confirm(event: Event): void {
    event.preventDefault();
    if (!this.canConfirm()) return;
    this.confirmed.emit({ minor: this.minor(), major: this.major(), reason: this.reason().trim() });
  }
}
