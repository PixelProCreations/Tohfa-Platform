/**
 * Verification & Compliance → "Mark as Unverified" dialog.
 *
 * UI ONLY. Emits the chosen reason and remarks; the host tab applies them to local state. When the
 * API lands this becomes a status-change call guarded by its rbac.json permission and recorded in
 * audit_log.
 */
import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, LOCALE_ID, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogFocusDirective } from './dialog-focus.directive';
import type { CertificationRecordMock } from './farmer-verification.mock';
import { CERT_STATUS_META, VERIFICATION_DIALOG_STYLES } from './farmer-verification-shared';
import { FARMER_VERIFICATION_STRINGS as S, VERIFICATION_REMARKS_MAX } from './farmer-verification-tab.strings';

export type UnverifyReasonCode = (typeof S.UNVERIFY_REASONS)[number]['code'];

export interface UnverifyResult {
  reason: UnverifyReasonCode;
  remarks: string;
}

let nextId = 0;

@Component({
  selector: 'tohfa-farmer-verification-unverify-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    VERIFICATION_DIALOG_STYLES,
    `
      .cols {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
        gap: var(--space-24);
        margin-bottom: var(--space-24);
      }
      .left {
        padding-right: var(--space-24);
        border-right: var(--border-divider);
      }
      .summary {
        display: flex;
        align-items: center;
        gap: var(--space-12);
        margin-bottom: var(--space-10);
        padding: var(--space-14) var(--space-16);
        border-radius: var(--r-md);
        background: var(--ok-bg);
      }
      .summary.err {
        background: var(--err-bg);
      }
      .summary-name {
        flex: 1;
        min-width: 0;
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      fieldset {
        margin: 0 0 var(--space-16);
        padding: 0;
        border: none;
      }
      .radio-card {
        display: flex;
        align-items: center;
        gap: var(--space-12);
        min-height: var(--tohfa-min-touch-target);
        margin-bottom: var(--space-10);
        padding: var(--space-10) var(--space-14);
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-md);
        background: var(--tohfa-surface);
        font-size: var(--fs-cell);
        cursor: pointer;
      }
      .radio-card:last-of-type {
        margin-bottom: 0;
      }
      .radio-card:hover {
        background: var(--tohfa-page);
      }
      .radio-card.selected {
        border-color: var(--err);
        background: var(--err-bg);
        font-weight: var(--fw-bold);
      }
      .radio-card input {
        flex: none;
        width: var(--space-18);
        height: var(--space-18);
        margin: 0;
        accent-color: var(--err);
        cursor: pointer;
      }
      .radio-card:focus-within {
        box-shadow: var(--tohfa-focus-ring);
      }
      .radio-card input:focus-visible {
        outline: none;
      }

      @media (max-width: 760px) {
        .cols {
          grid-template-columns: minmax(0, 1fr);
        }
        .left {
          padding-right: 0;
          border-right: none;
        }
      }
    `,
  ],
  template: `
    <div class="tohfa-dialog-scrim" (click)="dismissed.emit()">
      <div
        class="tohfa-dialog vd"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="ids.title"
        [attr.aria-describedby]="ids.sub"
        tohfaDialogFocus
        (dialogClose)="dismissed.emit()"
        (click)="$event.stopPropagation()"
      >
        <header class="vd-head">
          <span class="vd-head-tile" aria-hidden="true"><span class="material-symbols-outlined icon">block</span></span>
          <div class="vd-head-text">
            <h2 class="vd-title" [id]="ids.title">{{ S.UNVERIFY_TITLE }}</h2>
            <p class="vd-sub" [id]="ids.sub">{{ S.unverifySubtitle(cert.name) }}</p>
          </div>
          <button type="button" class="vd-close" [attr.aria-label]="S.BTN_CLOSE" [title]="S.BTN_CLOSE" (click)="dismissed.emit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
        </header>

        <div class="vd-body">
          <div class="cols">
            <section class="left" [attr.aria-labelledby]="ids.name">
              <div class="summary" [class.err]="meta.tone === 'err'">
                <span class="cert-tile on-tint" [ngClass]="meta.tone" aria-hidden="true">
                  <span class="material-symbols-outlined icon">{{ cert.icon }}</span>
                </span>
                <h3 class="summary-name" [id]="ids.name">{{ cert.name }}</h3>
                <span class="tohfa-badge tohfa-badge-sm pill on-tint" [ngClass]="meta.badge">
                  <span class="material-symbols-outlined icon" aria-hidden="true">{{ meta.icon }}</span>{{ S.CURRENTLY_LABEL[cert.status] }}
                </span>
              </div>
              <dl class="kv-list">
                <div class="kv"><dt>{{ S.CERTIFICATE_NO }}</dt><dd>{{ cert.certNo }}</dd></div>
                <div class="kv"><dt>{{ S.ISSUED_BY }}</dt><dd>{{ cert.issuedBy }}</dd></div>
                <div class="kv"><dt>{{ S.ISSUE_DATE }}</dt><dd>{{ date(cert.issueDate) }}</dd></div>
                <div class="kv"><dt>{{ S.EXPIRY_DATE }}</dt><dd>{{ date(cert.expiryDate) }}</dd></div>
                <div class="kv"><dt>{{ S.LAST_VERIFIED_ON }}</dt><dd>{{ date(cert.lastVerifiedOn) }}</dd></div>
                <div class="kv"><dt>{{ S.VERIFIED_BY }}</dt><dd>{{ cert.verifiedBy }}</dd></div>
              </dl>
            </section>

            <div>
              <fieldset>
                <legend class="field-label">{{ S.UNVERIFY_REASON }} <span class="req" aria-hidden="true">*</span></legend>
                <label class="radio-card" *ngFor="let r of reasons" [class.selected]="reason() === r.code">
                  <input
                    type="radio"
                    [name]="ids.radio"
                    [value]="r.code"
                    required
                    [checked]="reason() === r.code"
                    (change)="reason.set(r.code)"
                  />
                  <span>{{ r.label }}</span>
                </label>
              </fieldset>

              <div class="field">
                <label class="field-label" [for]="ids.remarks">{{ S.REMARKS }} <span class="req" aria-hidden="true">*</span></label>
                <textarea
                  [id]="ids.remarks"
                  class="tohfa-input"
                  rows="4"
                  required
                  aria-required="true"
                  [attr.maxlength]="max"
                  [attr.aria-describedby]="ids.counter"
                  [placeholder]="S.UNVERIFY_REMARKS_PLACEHOLDER"
                  [ngModel]="remarks()"
                  (ngModelChange)="remarks.set($event)"
                ></textarea>
                <span class="counter" [id]="ids.counter" [attr.aria-label]="S.counterAria(remarks().length, max)">
                  {{ S.counter(remarks().length, max) }}
                </span>
              </div>
            </div>
          </div>

          <div class="warn" role="note">
            <span class="material-symbols-outlined icon" aria-hidden="true">info</span>
            <div>
              <strong>{{ S.UNVERIFY_WARN_TITLE }}</strong>
              {{ S.UNVERIFY_WARN_BODY }}
            </div>
          </div>
        </div>

        <footer class="vd-foot">
          <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="dismissed.emit()">{{ S.BTN_CANCEL }}</button>
          <button type="button" class="tohfa-btn tohfa-btn-danger-l" [disabled]="!canConfirm()" (click)="submit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">block</span>{{ S.BTN_CONFIRM_UNVERIFY }}
          </button>
        </footer>
      </div>
    </div>
  `,
})
export class FarmerVerificationUnverifyDialogComponent {
  private readonly locale = inject(LOCALE_ID);

  @Input({ required: true }) cert!: CertificationRecordMock;
  @Output() readonly dismissed = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<UnverifyResult>();

  readonly S = S;
  readonly reasons = S.UNVERIFY_REASONS;
  readonly max = VERIFICATION_REMARKS_MAX;

  private readonly uid = nextId++;
  readonly ids = {
    title: `vu-title-${this.uid}`,
    sub: `vu-sub-${this.uid}`,
    name: `vu-name-${this.uid}`,
    radio: `vu-reason-${this.uid}`,
    remarks: `vu-remarks-${this.uid}`,
    counter: `vu-counter-${this.uid}`,
  };

  readonly reason = signal<UnverifyReasonCode | null>(null);
  readonly remarks = signal('');
  readonly canConfirm = computed(() => this.reason() !== null && this.remarks().trim() !== '');

  get meta() {
    return CERT_STATUS_META[this.cert.status];
  }

  date(isoDate: string): string {
    return formatDate(isoDate, 'd MMM y', this.locale);
  }

  submit(): void {
    const reason = this.reason();
    if (reason === null || !this.canConfirm()) return;
    this.confirmed.emit({ reason, remarks: this.remarks().trim() });
  }
}
