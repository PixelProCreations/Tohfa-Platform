/**
 * Verification & Compliance → "Remove Record" dialog.
 *
 * UI ONLY. Emits the chosen record, reason and remarks; the host tab drops that record from local
 * state. When the API lands this becomes a delete call guarded by its rbac.json permission and
 * recorded in audit_log.
 */
import { CommonModule, formatDate } from '@angular/common';
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
import type { CertificationRecordMock } from './farmer-verification.mock';
import { CERT_STATUS_META, VERIFICATION_DIALOG_STYLES } from './farmer-verification-shared';
import { FARMER_VERIFICATION_STRINGS as S, VERIFICATION_REMARKS_MAX } from './farmer-verification-tab.strings';

export type RemoveReasonCode = (typeof S.REMOVE_REASONS)[number]['code'];

export interface RemoveResult {
  certId: string;
  reason: RemoveReasonCode;
  remarks: string;
}

let nextId = 0;

@Component({
  selector: 'tohfa-farmer-verification-remove-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    VERIFICATION_DIALOG_STYLES,
    `
      .vd-head-tile .icon {
        font-size: var(--icon-dialog-close);
      }
      .record-field {
        margin-bottom: var(--space-18);
      }
      .record-field select {
        border-color: var(--tohfa-brown);
      }
      .helper {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        margin: var(--space-8) 0 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .helper .icon {
        font-size: var(--fs-card);
      }
      .cols {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: var(--space-20);
        margin-bottom: var(--space-24);
      }
      .detail {
        padding: var(--space-18);
        border: var(--border-card);
        border-radius: var(--r-md);
      }
      .detail-head {
        display: flex;
        align-items: center;
        gap: var(--space-12);
        margin-bottom: var(--space-6);
      }
      .detail-name {
        flex: 1;
        min-width: 0;
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }

      @media (max-width: 760px) {
        .cols {
          grid-template-columns: minmax(0, 1fr);
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
          <span class="vd-head-tile" aria-hidden="true"><span class="material-symbols-outlined icon">delete</span></span>
          <div class="vd-head-text">
            <h2 class="vd-title" [id]="ids.title">{{ S.REMOVE_TITLE }}</h2>
            <p class="vd-sub" [id]="ids.sub">{{ S.REMOVE_SUBTITLE }}</p>
          </div>
          <button type="button" class="vd-close" [attr.aria-label]="S.BTN_CLOSE" [title]="S.BTN_CLOSE" (click)="dismissed.emit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
        </header>

        <div class="vd-body">
          <div class="record-field">
            <label class="field-label" [for]="ids.record">{{ S.SELECT_RECORD }} <span class="req" aria-hidden="true">*</span></label>
            <div class="select-wrap">
              <select
                [id]="ids.record"
                class="tohfa-input"
                required
                aria-required="true"
                [attr.aria-describedby]="ids.helper"
                [ngModel]="selectedId()"
                (ngModelChange)="selectedId.set($event)"
              >
                <option *ngFor="let r of records" [ngValue]="r.id">
                  {{ S.recordOption(r.name, r.certNo, S.STATUS_LABEL[r.status]) }}
                </option>
              </select>
              <span class="material-symbols-outlined chev" aria-hidden="true">expand_more</span>
            </div>
            <p class="helper" [id]="ids.helper">
              <span class="material-symbols-outlined icon" aria-hidden="true">info</span>{{ availableText() }}
            </p>
          </div>

          <div class="cols">
            <section class="detail" *ngIf="selected() as c" [attr.aria-labelledby]="ids.name" aria-live="polite">
              <div class="detail-head">
                <span class="cert-tile" [ngClass]="meta(c).tone" aria-hidden="true">
                  <span class="material-symbols-outlined icon">{{ c.icon }}</span>
                </span>
                <h3 class="detail-name" [id]="ids.name">{{ c.name }}</h3>
                <span class="tohfa-badge tohfa-badge-lg pill" [ngClass]="meta(c).badge">
                  <span class="material-symbols-outlined icon" aria-hidden="true">{{ meta(c).icon }}</span>{{ S.STATUS_LABEL[c.status] }}
                </span>
              </div>
              <dl class="kv-list">
                <div class="kv"><dt>{{ S.CERTIFICATE_NO }}</dt><dd>{{ c.certNo }}</dd></div>
                <div class="kv"><dt>{{ S.ISSUED_BY }}</dt><dd>{{ c.issuedBy }}</dd></div>
                <div class="kv"><dt>{{ S.ISSUE_DATE }}</dt><dd>{{ date(c.issueDate) }}</dd></div>
                <div class="kv"><dt>{{ S.EXPIRY_DATE }}</dt><dd>{{ date(c.expiryDate) }}</dd></div>
                <div class="kv"><dt>{{ S.LAST_VERIFIED_ON }}</dt><dd>{{ date(c.lastVerifiedOn) }}</dd></div>
                <div class="kv"><dt>{{ S.VERIFIED_BY }}</dt><dd>{{ c.verifiedBy }}</dd></div>
              </dl>
            </section>

            <div>
              <div class="field">
                <label class="field-label" [for]="ids.reason">{{ S.REMOVE_REASON }} <span class="req" aria-hidden="true">*</span></label>
                <div class="select-wrap">
                  <select
                    [id]="ids.reason"
                    class="tohfa-input"
                    required
                    aria-required="true"
                    [ngModel]="reason()"
                    (ngModelChange)="reason.set($event)"
                  >
                    <option [ngValue]="null" disabled>{{ S.SELECT_REASON_PLACEHOLDER }}</option>
                    <option *ngFor="let r of reasons" [ngValue]="r.code">{{ r.label }}</option>
                  </select>
                  <span class="material-symbols-outlined chev" aria-hidden="true">expand_more</span>
                </div>
              </div>
              <div class="field">
                <label class="field-label" [for]="ids.remarks">{{ S.REMARKS }} <span class="req" aria-hidden="true">*</span></label>
                <textarea
                  [id]="ids.remarks"
                  class="tohfa-input"
                  rows="3"
                  required
                  aria-required="true"
                  [attr.maxlength]="max"
                  [attr.aria-describedby]="ids.counter"
                  [placeholder]="S.REMOVE_REMARKS_PLACEHOLDER"
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
            <span class="material-symbols-outlined icon" aria-hidden="true">warning</span>
            <div>
              <strong>{{ S.REMOVE_WARN_TITLE }}</strong>
              <ng-container *ngIf="records.length > 1">
                {{ records.length === 2 ? S.REMOVE_WARN_OTHERS : S.REMOVE_WARN_OTHERS_PLURAL }}
              </ng-container>
              {{ S.REMOVE_WARN_HISTORY }}
            </div>
          </div>
        </div>

        <footer class="vd-foot">
          <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="dismissed.emit()">{{ S.BTN_CANCEL }}</button>
          <button type="button" class="tohfa-btn tohfa-btn-danger-l" [disabled]="!canConfirm()" (click)="submit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">delete</span>{{ S.BTN_CONFIRM_REMOVE }}
          </button>
        </footer>
      </div>
    </div>
  `,
})
export class FarmerVerificationRemoveDialogComponent implements OnInit {
  private readonly locale = inject(LOCALE_ID);

  @Input({ required: true }) records: CertificationRecordMock[] = [];
  /** Record pre-selected when the dialog opens; falls back to the first record. */
  @Input() initialId: string | null = null;
  /** Pre-fills Remarks (the reason the admin already typed on the tab). */
  @Input() initialRemarks = '';
  @Output() readonly dismissed = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<RemoveResult>();

  readonly S = S;
  readonly reasons = S.REMOVE_REASONS;
  readonly max = VERIFICATION_REMARKS_MAX;

  private readonly uid = nextId++;
  readonly ids = {
    title: `vr-title-${this.uid}`,
    sub: `vr-sub-${this.uid}`,
    record: `vr-record-${this.uid}`,
    helper: `vr-helper-${this.uid}`,
    name: `vr-name-${this.uid}`,
    reason: `vr-reason-${this.uid}`,
    remarks: `vr-remarks-${this.uid}`,
    counter: `vr-counter-${this.uid}`,
  };

  readonly selectedId = signal<string | null>(null);
  readonly reason = signal<RemoveReasonCode | null>(null);
  readonly remarks = signal('');

  readonly selected = computed(() => this.records.find((r) => r.id === this.selectedId()) ?? null);
  readonly canConfirm = computed(() => this.selected() !== null && this.reason() !== null && this.remarks().trim() !== '');

  ngOnInit(): void {
    const initial = this.records.find((r) => r.id === this.initialId) ?? this.records[0];
    this.selectedId.set(initial?.id ?? null);
    this.remarks.set(this.initialRemarks.slice(0, this.max));
  }

  availableText(): string {
    return S.recordsAvailable(this.records.map((r) => r.name));
  }

  meta(c: CertificationRecordMock) {
    return CERT_STATUS_META[c.status];
  }

  date(isoDate: string): string {
    return formatDate(isoDate, 'd MMM y', this.locale);
  }

  submit(): void {
    const c = this.selected();
    const reason = this.reason();
    if (!c || reason === null || !this.canConfirm()) return;
    this.confirmed.emit({ certId: c.id, reason, remarks: this.remarks().trim() });
  }
}
