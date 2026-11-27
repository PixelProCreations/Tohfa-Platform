/**
 * Verification & Compliance → "Block Listings" dialog.
 *
 * UI ONLY. Emits the selected listing IDs, reason and remarks; the host tab flips those listings
 * to Blocked in local state. When the API lands this becomes a bulk deactivate call guarded by its
 * rbac.json permission and recorded in audit_log.
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
import type { CertificationListingMock, CertificationRecordMock } from './farmer-verification.mock';
import { CERT_STATUS_META, PRODUCE_TONE_CLASS, VERIFICATION_DIALOG_STYLES } from './farmer-verification-shared';
import { FARMER_VERIFICATION_STRINGS as S, VERIFICATION_REMARKS_MAX } from './farmer-verification-tab.strings';

export type BlockReasonCode = (typeof S.BLOCK_REASONS)[number]['code'];

export interface BlockResult {
  listingIds: string[];
  reason: BlockReasonCode;
  remarks: string;
}

let nextId = 0;

@Component({
  selector: 'tohfa-farmer-verification-block-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    VERIFICATION_DIALOG_STYLES,
    `
      .cert-card {
        display: flex;
        align-items: center;
        gap: var(--space-16);
        margin-bottom: var(--space-14);
        padding: var(--space-18) var(--space-20);
        border: 1px solid var(--err-bd);
        border-radius: var(--r-md);
        background: var(--err-bg);
      }
      .cert-card.ok {
        border-color: var(--ok-bd);
        background: var(--ok-bg);
      }
      .cert-text {
        flex: 1;
        min-width: 0;
      }
      .cert-name {
        margin: 0 0 var(--space-4);
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .cert-meta {
        margin: 0;
        font-size: var(--fs-dense);
        line-height: 1.6;
        color: var(--tohfa-slate);
      }
      .warn {
        margin-bottom: var(--space-14);
        color: var(--tohfa-ink);
      }

      /* ---------- Listings table card ---------- */
      .table-card {
        margin-bottom: var(--space-18);
        border: var(--border-card);
        border-radius: var(--r-md);
        overflow: hidden;
      }
      .table-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-14) var(--space-18);
      }
      .table-title {
        display: inline-flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .table-title .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-amber);
      }
      .count-chip {
        padding: var(--space-4) var(--space-10);
        border-radius: var(--r-sm);
        background: var(--tohfa-page);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        color: var(--tohfa-slate);
      }
      .table-scroll {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th {
        padding: var(--space-12) var(--space-18);
        border-top: var(--border-divider);
        border-bottom: var(--border-divider);
        background: var(--tohfa-page);
        font-size: var(--fs-table-header);
        font-weight: var(--fw-xbold);
        letter-spacing: 0.3px;
        text-align: left;
        text-transform: uppercase;
        color: var(--tohfa-muted);
      }
      td {
        padding: var(--space-10) var(--space-18);
        border-bottom: var(--border-divider);
        font-size: var(--fs-cell);
        white-space: nowrap;
      }
      tr:last-child td {
        border-bottom: none;
      }
      .col-check {
        width: var(--space-20);
        padding-right: 0;
      }
      .col-check input {
        width: var(--space-16);
        height: var(--space-16);
        margin: 0;
        vertical-align: middle;
      }
      .id {
        font-weight: var(--fw-bold);
      }
      .product {
        display: inline-flex;
        align-items: center;
        gap: var(--space-8);
      }
      .initial {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--space-20);
        height: var(--space-20);
        border-radius: var(--r-xs);
        font-size: var(--fs-badge);
        font-weight: var(--fw-xbold);
      }
      .tone-amber {
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-amber);
      }
      .tone-brown {
        background: var(--tohfa-page);
        color: var(--tohfa-brown);
      }
      .tone-red {
        background: var(--err-bg);
        color: var(--err);
      }
      .tone-green {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .muted-cell {
        color: var(--tohfa-slate);
      }
      .dot::before {
        content: '';
        display: inline-block;
        width: var(--space-6);
        height: var(--space-6);
        margin-right: var(--space-4);
        border-radius: var(--r-circle);
        background: currentColor;
      }
      .empty {
        padding: var(--space-18);
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
        border-top: var(--border-divider);
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-20);
      }

      @media (max-width: 760px) {
        .form-row {
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
          <span class="vd-head-tile" aria-hidden="true"><span class="material-symbols-outlined icon">block</span></span>
          <div class="vd-head-text">
            <h2 class="vd-title" [id]="ids.title">{{ S.BLOCK_TITLE }}</h2>
            <p class="vd-sub" [id]="ids.sub">{{ S.blockSubtitle(cert.name) }}</p>
          </div>
          <button type="button" class="vd-close" [attr.aria-label]="S.BTN_CLOSE" [title]="S.BTN_CLOSE" (click)="dismissed.emit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
        </header>

        <div class="vd-body">
          <section class="cert-card" [class.ok]="meta.tone === 'ok'" [attr.aria-labelledby]="ids.name">
            <span class="cert-tile on-tint" [ngClass]="meta.tone" aria-hidden="true">
              <span class="material-symbols-outlined icon">{{ cert.icon }}</span>
            </span>
            <div class="cert-text">
              <h3 class="cert-name" [id]="ids.name">{{ cert.name }}</h3>
              <p class="cert-meta">
                {{ S.certLine(cert.certNo, cert.issuedBy) }}<br />
                {{ metaLine() }}
              </p>
            </div>
            <span class="tohfa-badge tohfa-badge-lg pill on-tint" [ngClass]="meta.badge">
              <span class="material-symbols-outlined icon" aria-hidden="true">{{ meta.icon }}</span>{{ S.STATUS_LABEL[cert.status] }}
            </span>
          </section>

          <div class="warn" role="note">
            <span class="material-symbols-outlined icon" aria-hidden="true">info</span>
            <div><strong class="inline">{{ S.BLOCK_WHAT_TITLE }}</strong> {{ S.BLOCK_WHAT_BODY }}</div>
          </div>

          <section class="table-card" [attr.aria-labelledby]="ids.table">
            <div class="table-head">
              <h3 class="table-title" [id]="ids.table">
                <span class="material-symbols-outlined icon" aria-hidden="true">inventory_2</span>{{ S.LISTINGS_TITLE }}
              </h3>
              <span class="count-chip">{{ S.listingsCount(listings.length) }}</span>
            </div>
            <div class="table-scroll" *ngIf="listings.length > 0; else noListings">
              <table [attr.aria-labelledby]="ids.table">
                <thead>
                  <tr>
                    <th scope="col" class="col-check">
                      <input
                        type="checkbox"
                        class="tohfa-checkbox"
                        [attr.aria-label]="S.SELECT_ALL"
                        [disabled]="activeIds().length === 0"
                        [checked]="allSelected()"
                        [indeterminate]="someSelected()"
                        (change)="toggleAll()"
                      />
                    </th>
                    <th scope="col">{{ S.COL_LISTING_ID }}</th>
                    <th scope="col">{{ S.COL_PRODUCT }}</th>
                    <th scope="col">{{ S.COL_CATEGORY }}</th>
                    <th scope="col">{{ S.COL_STOCK }}</th>
                    <th scope="col">{{ S.COL_STATUS }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let l of listings">
                    <td class="col-check">
                      <input
                        type="checkbox"
                        class="tohfa-checkbox"
                        [attr.aria-label]="S.selectListing(l.id, l.product)"
                        [disabled]="l.status !== 'ACTIVE'"
                        [checked]="selected().has(l.id)"
                        (change)="toggle(l.id)"
                      />
                    </td>
                    <td class="id">{{ l.id }}</td>
                    <td>
                      <span class="product">
                        <span class="initial" [ngClass]="toneClass[l.tone]" aria-hidden="true">{{ l.product.charAt(0) }}</span>{{ l.product }}
                      </span>
                    </td>
                    <td class="muted-cell">{{ l.category }}</td>
                    <td class="muted-cell">{{ S.stockKg(l.stockKg) }}</td>
                    <td>
                      <span
                        class="tohfa-badge tohfa-badge-sm dot"
                        [ngClass]="l.status === 'ACTIVE' ? 'tohfa-badge-success' : 'tohfa-badge-danger'"
                      >
                        {{ S.LISTING_STATUS_LABEL[l.status] }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noListings><p class="empty">{{ S.NO_LISTINGS }}</p></ng-template>
          </section>

          <div class="form-row">
            <div class="field">
              <label class="field-label" [for]="ids.reason">{{ S.BLOCK_REASON }} <span class="req" aria-hidden="true">*</span></label>
              <div class="select-wrap">
                <select
                  [id]="ids.reason"
                  class="tohfa-input"
                  required
                  aria-required="true"
                  [ngModel]="reason()"
                  (ngModelChange)="reason.set($event)"
                >
                  <option *ngFor="let r of reasons" [ngValue]="r.code">{{ r.label }}</option>
                </select>
                <span class="material-symbols-outlined chev" aria-hidden="true">expand_more</span>
              </div>
            </div>
            <div class="field">
              <label class="field-label" [for]="ids.remarks">{{ S.REMARKS_OPTIONAL }}</label>
              <textarea
                [id]="ids.remarks"
                class="tohfa-input"
                rows="3"
                [attr.maxlength]="max"
                [attr.aria-describedby]="ids.counter"
                [placeholder]="S.blockRemarksPlaceholder(date(cert.expiryDate))"
                [ngModel]="remarks()"
                (ngModelChange)="remarks.set($event)"
              ></textarea>
              <span class="counter" [id]="ids.counter" [attr.aria-label]="S.counterAria(remarks().length, max)">
                {{ S.counter(remarks().length, max) }}
              </span>
            </div>
          </div>
        </div>

        <footer class="vd-foot">
          <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="dismissed.emit()">{{ S.BTN_CANCEL }}</button>
          <button type="button" class="tohfa-btn tohfa-btn-danger-l" [disabled]="selected().size === 0" (click)="submit()">
            <span class="material-symbols-outlined icon" aria-hidden="true">block</span>{{ S.BTN_CONFIRM_BLOCK }}
          </button>
        </footer>
      </div>
    </div>
  `,
})
export class FarmerVerificationBlockDialogComponent implements OnInit {
  private readonly locale = inject(LOCALE_ID);

  @Input({ required: true }) cert!: CertificationRecordMock;
  /** Every listing tagged with `cert`; already-blocked rows are shown but cannot be selected. */
  @Input() listings: CertificationListingMock[] = [];
  @Output() readonly dismissed = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<BlockResult>();

  readonly S = S;
  readonly reasons = S.BLOCK_REASONS;
  readonly toneClass = PRODUCE_TONE_CLASS;
  readonly max = VERIFICATION_REMARKS_MAX;

  private readonly uid = nextId++;
  readonly ids = {
    title: `vb-title-${this.uid}`,
    sub: `vb-sub-${this.uid}`,
    name: `vb-name-${this.uid}`,
    table: `vb-table-${this.uid}`,
    reason: `vb-reason-${this.uid}`,
    remarks: `vb-remarks-${this.uid}`,
    counter: `vb-counter-${this.uid}`,
  };

  readonly activeIds = signal<string[]>([]);
  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly reason = signal<BlockReasonCode>('CERT_EXPIRED');
  readonly remarks = signal('');

  readonly allSelected = computed(() => this.activeIds().length > 0 && this.selected().size === this.activeIds().length);
  readonly someSelected = computed(() => this.selected().size > 0 && !this.allSelected());

  get meta() {
    return CERT_STATUS_META[this.cert.status];
  }

  ngOnInit(): void {
    // The design opens with every active listing ticked: blocking all of them is the default.
    const active = this.listings.filter((l) => l.status === 'ACTIVE').map((l) => l.id);
    this.activeIds.set(active);
    this.selected.set(new Set(active));
    this.reason.set(this.cert.status === 'EXPIRED' ? 'CERT_EXPIRED' : 'CERT_UNVERIFIED');
  }

  metaLine(): string {
    const c = this.cert;
    if (c.status === 'VERIFIED') return S.verifiedLine(this.date(c.expiryDate), this.date(c.lastVerifiedOn), c.verifiedBy);
    if (c.status === 'EXPIRED') return S.expiredLine(this.date(c.expiryDate), this.date(c.lastVerifiedOn));
    return S.lastVerifiedLine(this.date(c.expiryDate), this.date(c.lastVerifiedOn));
  }

  date(isoDate: string): string {
    return formatDate(isoDate, 'd MMM y', this.locale);
  }

  toggle(id: string): void {
    this.selected.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleAll(): void {
    this.selected.set(this.allSelected() ? new Set() : new Set(this.activeIds()));
  }

  submit(): void {
    if (this.selected().size === 0) return;
    this.confirmed.emit({ listingIds: [...this.selected()], reason: this.reason(), remarks: this.remarks().trim() });
  }
}
