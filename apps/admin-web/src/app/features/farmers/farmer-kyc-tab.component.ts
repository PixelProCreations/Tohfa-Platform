/**
 * Farmers Management → Farmer Details → KYC tab (SA-M3-S05).
 *
 * Data, all from docs/openapi.yaml, each call gated by its own permission and re-checked by the API:
 * - GET /v1/admin/farmers/{id} (`farmer.profile.view_all`): name and Farmer ID for the dialog
 *   subtitle, `aadhaarLast4` for the masked document number, the zone, and the primary land
 *   location's survey number, area and village for the land ownership proof. Skipped when the page
 *   hands the already-loaded profile in through `farmer`.
 * - GET /v1/admin/farmers/{id}/documents (`farmer.document.view`): Identity proof = the newest
 *   ID_PROOF row; Land ownership proof = the newest FARM_DOC row (step 4's mandatory farm/land
 *   record). The signed `readUrl` expires after 15 minutes (BR-54c), so View and Download each
 *   re-fetch the list for a fresh URL instead of reusing the one loaded with the tab.
 * - GET /v1/admin/farmers/{id}/bank-accounts (`farmer.bank_account.view`): Bank details (kind BANK,
 *   account number last 4 only, BR-53a) and UPI IDs (kind UPI).
 * - GET /v1/admin/payouts?farmerId= (`payout.view`): Payout history (preview), newest first.
 *
 * Spec gaps (shown as "—" with a tooltip, never invented): the document's sub-type (Aadhaar,
 * Patta / Chitta …) and original file name; the reviewer's name (only the `verifiedBy` user id);
 * a verification note (only `rejectReason`); a payout's destination bank. Reject is disabled: the
 * API can verify an approved farmer's document but has no endpoint to reject one.
 */
import { CommonModule, formatDate } from '@angular/common';
import type { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  LOCALE_ID,
  computed,
  inject,
  signal,
  type OnChanges,
  type SimpleChanges,
} from '@angular/core';
import { RbacService } from '../../core/rbac.service';
import {
  FarmerKycDocumentDialogComponent,
  type KycBadgeTone,
  type KycDetailRow,
  type KycDetailSection,
  type KycNote,
} from './farmer-kyc-document-dialog.component';
import {
  FarmerKycService,
  fileKind,
  formatBytes,
  formatMoney,
  type AdminFarmerPayoutDestination,
  type PayoutStatus,
  type PayoutSummary,
} from './farmer-kyc-tab.service';
import { FARMER_KYC_STRINGS as S } from './farmer-kyc-tab.strings';
import { FarmersService, type AdminFarmerDetail, type AdminFarmerDocument, type AdminFarmerLandLocation } from './farmers.service';

type LoadState = 'idle' | 'loading' | 'ready' | 'error' | 'forbidden';
type SectionKey = 'identity' | 'land' | 'bank';
type Badge = { label: string; tone: KycBadgeTone };

/** How many payouts the preview card lists. */
const PAYOUT_PREVIEW_LIMIT = 3;

const DOC_BADGE: Record<AdminFarmerDocument['verificationStatus'], Badge> = {
  VERIFIED: { label: S.STATUS_VERIFIED, tone: 'success' },
  UNVERIFIED: { label: S.STATUS_PENDING, tone: 'warning' },
  REJECTED: { label: S.STATUS_REJECTED, tone: 'danger' },
};

const PAYOUT_TONE: Record<PayoutStatus, KycBadgeTone | 'info'> = {
  REQUESTED: 'info',
  PENDING_APPROVAL: 'info',
  APPROVED: 'info',
  PROCESSING: 'warning',
  PAID: 'success',
  FAILED: 'danger',
  REVERSED: 'neutral',
};

/** One document box (Identity proof / Land ownership proof), shared by the tab and the dialog. */
interface DocSectionVm {
  key: 'identity' | 'land';
  title: string;
  icon: string;
  tileTone: 'danger' | 'amber';
  doc: AdminFarmerDocument | null;
  badge: Badge;
  emptyText: string;
  /** Rows beside the icon tile. */
  topRows: KycDetailRow[];
  refLabel: string;
  fileMeta: string;
  /** Rows below, full width. */
  bottomRows: KycDetailRow[];
  note: KycNote;
  dialogTitle: string;
  dialogSections: KycDetailSection[];
  dialogNote: KycNote;
}

function newest(docs: readonly AdminFarmerDocument[], type: AdminFarmerDocument['docType']): AdminFarmerDocument | null {
  // The API lists documents oldest first; the newest upload of a type is the current one.
  const ofType = docs.filter((d) => d.docType === type);
  return ofType[ofType.length - 1] ?? null;
}

function primaryLocation(f: AdminFarmerDetail | null): AdminFarmerLandLocation | null {
  if (!f) return null;
  return f.landLocations.find((l) => l.isPrimary) ?? f.landLocations[0] ?? null;
}

function errorState(err: HttpErrorResponse): LoadState {
  return err.status === 403 ? 'forbidden' : 'error';
}

@Component({
  selector: 'tohfa-farmer-kyc-tab',
  standalone: true,
  imports: [CommonModule, FarmerKycDocumentDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: grid;
        grid-template-columns: minmax(0, 2.4fr) minmax(0, 1fr);
        gap: var(--space-18);
        align-items: start;
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .icon {
        font-size: var(--icon-btn);
      }
      [aria-disabled='true'] {
        cursor: not-allowed;
        opacity: 0.6;
      }
      .muted {
        color: var(--tohfa-muted);
        font-weight: var(--fw-regular);
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: var(--space-18);
        min-width: 0;
      }

      /* ---------- Card heads ---------- */
      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .card-title .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-brown);
      }
      .card-sub {
        margin: var(--space-6) 0 var(--space-16);
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .side-head {
        margin-bottom: var(--space-14);
      }
      .card-empty {
        margin: 0;
        padding: var(--space-8) 0;
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
      }
      .sections {
        display: flex;
        flex-direction: column;
        gap: var(--space-12);
      }

      /* ---------- Collapsible section ---------- */
      .section {
        border: var(--border-card);
        border-radius: var(--r-card);
        background: var(--tohfa-surface);
      }
      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-10);
        margin: 0;
        padding: var(--space-14) var(--space-16);
      }
      .toggle {
        display: inline-flex;
        align-items: center;
        gap: var(--space-10);
        padding: 0;
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--tohfa-ink);
        font-family: var(--font);
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .toggle .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-slate);
      }
      .toggle:focus-visible,
      .file-link:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .section-body {
        padding: 0 var(--space-16) var(--space-16);
      }

      .top {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: var(--space-16);
        align-items: start;
      }
      .tile {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-24) * 2);
        height: calc(var(--space-24) * 2);
        border-radius: var(--r-md);
      }
      .tile .icon {
        font-size: var(--icon-dialog-close);
      }
      .tile-danger {
        background: var(--err-bg);
        color: var(--err);
      }
      .tile-amber {
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-amber);
      }
      .actions {
        display: flex;
        gap: var(--space-8);
      }
      .actions .tohfa-btn {
        padding: var(--space-8) var(--space-14);
        font-size: var(--fs-dense);
      }
      .actions .tohfa-btn-secondary {
        color: var(--tohfa-ink);
      }
      .btn-reject {
        min-width: calc(var(--space-28) * 4);
        border: 1px solid var(--err);
        border-radius: var(--r-md);
        background: var(--tohfa-surface);
        color: var(--err);
      }

      dl {
        margin: 0;
      }
      .rows {
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
        font-size: var(--fs-cell);
      }
      .bottom {
        margin-top: var(--space-16);
      }
      .row {
        display: grid;
        grid-template-columns: calc(var(--space-32) * 5) minmax(0, 1fr);
        align-items: start;
      }
      .top .row {
        grid-template-columns: calc(var(--space-32) * 5.2) minmax(0, 1fr);
      }
      .row dt {
        color: var(--tohfa-slate);
      }
      .row dd {
        display: flex;
        gap: var(--space-4);
        margin: 0;
        font-weight: var(--fw-bold);
        overflow-wrap: anywhere;
      }
      /* The design separates label and value with a colon. */
      .row dd::before {
        content: ':';
        color: var(--tohfa-slate);
        font-weight: var(--fw-regular);
      }
      .file-link {
        padding: 0;
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--info);
        font-family: var(--font);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        text-decoration: underline;
        cursor: pointer;
      }
      .file-meta {
        display: block;
        margin-top: var(--space-4);
        font-size: var(--fs-badge);
        font-weight: var(--fw-semi);
        color: var(--tohfa-muted);
      }
      .row.note-row {
        align-items: center;
      }
      .note {
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        gap: var(--space-8);
        padding: var(--space-10) var(--space-14);
        border-radius: var(--r-md);
        font-weight: var(--fw-bold);
      }
      .note.ok {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .note.danger {
        background: var(--err-bg);
        color: var(--err);
      }
      .section-empty {
        margin: 0;
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
      }
      .error-line {
        margin: var(--space-10) 0 0;
        font-size: var(--fs-dense);
        color: var(--err);
      }

      /* Bank accounts */
      .bank + .bank {
        margin-top: var(--space-14);
        padding-top: var(--space-14);
        border-top: var(--border-divider);
      }
      .bank-flags {
        display: flex;
        gap: var(--space-6);
        margin-bottom: var(--space-10);
      }

      /* ---------- Right column lists ---------- */
      .list {
        display: flex;
        flex-direction: column;
        gap: var(--space-12);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .item {
        padding: var(--space-14) var(--space-14);
        border: var(--border-card);
        border-radius: var(--r-md);
      }
      .item-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-10);
      }
      .item-main {
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        overflow-wrap: anywhere;
      }
      .item-sub {
        margin-top: var(--space-8);
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }

      @media (max-width: 1100px) {
        :host {
          grid-template-columns: minmax(0, 1fr);
        }
        .top {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .actions {
          grid-column: 1 / -1;
        }
      }
    `,
  ],
  template: `
    <!-- ================= Left: KYC Verification ================= -->
    <section class="tohfa-card" aria-labelledby="kyc-title">
      <h2 class="card-title" id="kyc-title">
        <span class="material-symbols-outlined icon" aria-hidden="true">badge</span>{{ S.KYC_TITLE }}
      </h2>
      <p class="card-sub">{{ S.KYC_SUBTITLE }}</p>

      <p class="tohfa-banner tohfa-banner-info" *ngIf="docsState() === 'loading' || farmerState() === 'loading'" role="status">
        {{ S.LOADING }}
      </p>
      <p class="tohfa-banner tohfa-banner-danger" *ngIf="farmerState() === 'error'" role="alert">{{ S.FARMER_LOAD_ERROR }}</p>
      <p class="tohfa-banner tohfa-banner-warning" *ngIf="docsState() === 'forbidden'">{{ S.DOCUMENTS_NO_ACCESS }}</p>
      <div *ngIf="docsState() === 'error'" role="alert">
        <p class="tohfa-banner tohfa-banner-danger">{{ S.DOCUMENTS_LOAD_ERROR }}</p>
        <button type="button" class="tohfa-btn tohfa-btn-secondary" (click)="loadDocuments()">{{ S.RETRY }}</button>
      </div>
      <p class="tohfa-banner tohfa-banner-danger" *ngIf="urlError()" role="alert">{{ urlError() }}</p>

      <div class="sections">
        <!-- Identity proof / Land ownership proof -->
        <ng-container *ngIf="docsState() === 'ready'">
          <section class="section" *ngFor="let vm of docSections(); trackBy: trackSection">
            <h3 class="section-head">
              <button
                type="button"
                class="toggle"
                [attr.aria-expanded]="expanded()[vm.key]"
                [attr.aria-controls]="'kyc-section-' + vm.key"
                (click)="toggle(vm.key)"
              >
                <span class="material-symbols-outlined icon" aria-hidden="true">{{ expanded()[vm.key] ? 'expand_more' : 'chevron_right' }}</span>
                {{ vm.title }}
              </button>
              <span class="tohfa-badge tohfa-badge-{{ vm.badge.tone }}">{{ vm.badge.label }}</span>
            </h3>

            <div class="section-body" [id]="'kyc-section-' + vm.key" *ngIf="expanded()[vm.key]">
              <p class="section-empty" *ngIf="!vm.doc">{{ vm.emptyText }}</p>

              <ng-container *ngIf="vm.doc as doc">
                <div class="top">
                  <span class="tile tile-{{ vm.tileTone }}" aria-hidden="true">
                    <span class="material-symbols-outlined icon">{{ vm.icon }}</span>
                  </span>
                  <dl class="rows">
                    <div class="row" *ngFor="let r of vm.topRows">
                      <dt>{{ r.label }}</dt>
                      <dd *ngIf="r.value !== null; else dashCell" [title]="r.hint ?? ''">{{ r.value }}</dd>
                      <ng-template #dashCell><dd class="muted" [title]="r.hint ?? S.NOT_IN_API">{{ S.DASH }}</dd></ng-template>
                    </div>
                    <div class="row">
                      <dt>{{ vm.refLabel }}</dt>
                      <dd>
                        <span>
                          <button type="button" class="file-link" [title]="S.FILE_NAME_NOT_IN_API" (click)="view(vm)">
                            {{ S.OPEN_DOCUMENT }}
                          </button>
                          <span class="file-meta">{{ vm.fileMeta }}</span>
                        </span>
                      </dd>
                    </div>
                  </dl>
                  <div class="actions">
                    <!-- Not [disabled] while fetching: a disabled button drops focus, and the dialog
                         returns focus to whatever had it when it opened. view() ignores re-clicks. -->
                    <button type="button" class="tohfa-btn tohfa-btn-secondary" [attr.aria-busy]="busy() ? 'true' : null" (click)="view(vm)">
                      <span class="material-symbols-outlined icon" aria-hidden="true">visibility</span>{{ S.BTN_VIEW }}
                    </button>
                    <button
                      type="button"
                      class="tohfa-btn tohfa-btn-secondary"
                      [attr.aria-disabled]="downloadHint(doc) ? 'true' : null"
                      [title]="downloadHint(doc) ?? S.BTN_DOWNLOAD"
                      (click)="download(doc)"
                    >
                      <span class="material-symbols-outlined icon" aria-hidden="true">download</span>{{ S.BTN_DOWNLOAD }}
                    </button>
                    <button type="button" class="tohfa-btn btn-reject" aria-disabled="true" [title]="S.REJECT_NOT_IN_API">
                      {{ S.BTN_REJECT }}
                    </button>
                  </div>
                </div>

                <dl class="rows bottom">
                  <div class="row" *ngFor="let r of vm.bottomRows">
                    <dt>{{ r.label }}</dt>
                    <dd *ngIf="r.value !== null; else dashCell2" [title]="r.hint ?? ''">{{ r.value }}</dd>
                    <ng-template #dashCell2><dd class="muted" [title]="r.hint ?? S.NOT_IN_API">{{ S.DASH }}</dd></ng-template>
                  </div>
                  <div class="row note-row">
                    <dt>{{ vm.note.label }}</dt>
                    <dd *ngIf="vm.note.text !== null; else dashNote">
                      <span class="note" [ngClass]="vm.note.tone">
                        <span class="material-symbols-outlined icon" aria-hidden="true">{{ vm.note.tone === 'ok' ? 'check_circle' : 'error' }}</span>
                        {{ vm.note.text }}
                      </span>
                    </dd>
                    <ng-template #dashNote><dd class="muted" [title]="vm.note.hint ?? S.NOT_IN_API">{{ S.DASH }}</dd></ng-template>
                  </div>
                </dl>
              </ng-container>
            </div>
          </section>
        </ng-container>

        <!-- Bank details (collapsed by default) -->
        <section class="section">
          <h3 class="section-head">
            <button
              type="button"
              class="toggle"
              [attr.aria-expanded]="expanded().bank"
              aria-controls="kyc-section-bank"
              (click)="toggle('bank')"
            >
              <span class="material-symbols-outlined icon" aria-hidden="true">{{ expanded().bank ? 'expand_more' : 'chevron_right' }}</span>
              {{ S.SECTION_BANK }}
            </button>
            <span *ngIf="bankBadge() as b" class="tohfa-badge tohfa-badge-{{ b.tone }}">{{ b.label }}</span>
          </h3>
          <div class="section-body" id="kyc-section-bank" *ngIf="expanded().bank">
            <p class="section-empty" *ngIf="destState() === 'loading'" role="status">{{ S.LOADING }}</p>
            <p class="section-empty" *ngIf="destState() === 'forbidden'">{{ S.BANK_NO_ACCESS }}</p>
            <p class="section-empty" *ngIf="destState() === 'error'" role="alert">{{ S.BANK_LOAD_ERROR }}</p>
            <ng-container *ngIf="destState() === 'ready'">
              <p class="section-empty" *ngIf="banks().length === 0">{{ S.BANK_EMPTY }}</p>
              <div class="bank" *ngFor="let b of banks()">
                <div class="bank-flags">
                  <span class="tohfa-badge tohfa-badge-sm" [ngClass]="b.isVerified ? 'tohfa-badge-success' : 'tohfa-badge-warning'">
                    {{ b.isVerified ? S.STATUS_VERIFIED : S.STATUS_PENDING }}
                  </span>
                  <span *ngIf="b.isDefault" class="tohfa-badge tohfa-badge-sm tohfa-badge-amber-tint">{{ S.DEFAULT_DESTINATION }}</span>
                </div>
                <dl class="rows">
                  <div class="row">
                    <dt>{{ S.ACCOUNT_HOLDER }}</dt>
                    <dd>{{ b.accountHolderName }}</dd>
                  </div>
                  <div class="row">
                    <dt>{{ S.BANK_NAME }}</dt>
                    <dd [class.muted]="!b.bankName">{{ b.bankName ?? S.DASH }}</dd>
                  </div>
                  <div class="row">
                    <dt>{{ S.BRANCH }}</dt>
                    <dd [class.muted]="!b.branchName">{{ b.branchName ?? S.DASH }}</dd>
                  </div>
                  <div class="row">
                    <dt>{{ S.IFSC }}</dt>
                    <dd [class.muted]="!b.ifsc">{{ b.ifsc ?? S.DASH }}</dd>
                  </div>
                  <div class="row">
                    <dt>{{ S.ACCOUNT_NUMBER }}</dt>
                    <dd [class.muted]="!b.accountNumberLast4">
                      {{ b.accountNumberLast4 ? S.maskedAccount(b.accountNumberLast4) : S.DASH }}
                    </dd>
                  </div>
                  <div class="row">
                    <dt>{{ S.ADDED_ON }}</dt>
                    <dd>{{ b.createdAt | date: 'd MMM y' }}</dd>
                  </div>
                </dl>
              </div>
            </ng-container>
          </div>
        </section>
      </div>
    </section>

    <!-- ================= Right column ================= -->
    <div class="col">
      <section class="tohfa-card" aria-labelledby="kyc-upi-title">
        <div class="side-head">
          <h2 class="card-title" id="kyc-upi-title">
            <span class="material-symbols-outlined icon" aria-hidden="true">link</span>{{ S.UPI_TITLE }}
          </h2>
        </div>
        <p class="card-empty" *ngIf="destState() === 'loading'" role="status">{{ S.LOADING }}</p>
        <p class="card-empty" *ngIf="destState() === 'forbidden'">{{ S.UPI_NO_ACCESS }}</p>
        <p class="card-empty" *ngIf="destState() === 'error'" role="alert">{{ S.UPI_LOAD_ERROR }}</p>
        <ng-container *ngIf="destState() === 'ready'">
          <ul class="list" *ngIf="upis().length > 0; else noUpi">
            <li class="item item-line" *ngFor="let u of upis()">
              <span class="item-main">{{ u.upiVpa ?? S.DASH }}</span>
              <span class="tohfa-badge tohfa-badge-sm" [ngClass]="u.isVerified ? 'tohfa-badge-success' : 'tohfa-badge-warning'">
                {{ u.isVerified ? S.STATUS_VERIFIED : S.UPI_UNVERIFIED }}
              </span>
            </li>
          </ul>
          <ng-template #noUpi><p class="card-empty">{{ S.UPI_EMPTY }}</p></ng-template>
        </ng-container>
      </section>

      <section class="tohfa-card" aria-labelledby="kyc-payout-title">
        <div class="side-head">
          <h2 class="card-title" id="kyc-payout-title">
            <span class="material-symbols-outlined icon" aria-hidden="true">account_balance_wallet</span>{{ S.PAYOUTS_TITLE }}
          </h2>
        </div>
        <p class="card-empty" *ngIf="payoutState() === 'loading'" role="status">{{ S.LOADING }}</p>
        <p class="card-empty" *ngIf="payoutState() === 'forbidden'">{{ S.PAYOUTS_NO_ACCESS }}</p>
        <p class="card-empty" *ngIf="payoutState() === 'error'" role="alert">{{ S.PAYOUTS_LOAD_ERROR }}</p>
        <ng-container *ngIf="payoutState() === 'ready'">
          <ul class="list" *ngIf="payouts().length > 0; else noPayouts">
            <li class="item" *ngFor="let p of payouts()">
              <div class="item-line">
                <span class="item-main">{{ p.payoutNumber }}</span>
                <span class="tohfa-badge tohfa-badge-sm tohfa-badge-{{ payoutTone(p.status) }}">{{ payoutLabel(p.status) }}</span>
              </div>
              <div class="item-sub">
                {{ S.RUPEE }}{{ money(p.amount) }} ·
                <span [title]="S.PAYOUT_DESTINATION_NOT_IN_API">{{ S.payoutTo(S.DASH) }}</span>
                · {{ p.requestedAt | date: 'd MMM y' }}
              </div>
            </li>
          </ul>
          <ng-template #noPayouts><p class="card-empty">{{ S.PAYOUTS_EMPTY }}</p></ng-template>
        </ng-container>
      </section>
    </div>

    <!-- Document dialog -->
    <tohfa-farmer-kyc-document-dialog
      *ngIf="dialog() as d"
      [document]="d.doc"
      [title]="d.vm.dialogTitle"
      [subtitle]="dialogSubtitle()"
      [icon]="d.vm.icon"
      [statusLabel]="d.vm.badge.label"
      [statusTone]="d.vm.badge.tone"
      [fileLabel]="d.vm.title"
      [sections]="d.vm.dialogSections"
      [note]="d.vm.dialogNote"
      [showFileTools]="d.vm.key === 'land'"
      [downloadHint]="downloadHint(d.doc)"
      (download)="download(d.doc)"
      (closed)="dialog.set(null)"
    ></tohfa-farmer-kyc-document-dialog>
  `,
})
export class FarmerKycTabComponent implements OnChanges {
  private readonly farmers = inject(FarmersService);
  private readonly kyc = inject(FarmerKycService);
  private readonly rbac = inject(RbacService);
  private readonly locale = inject(LOCALE_ID);

  /** The farmer's id (`AdminFarmerDetail.id`, a uuid). */
  @Input({ required: true }) farmerId = '';
  /** The profile the page already loaded; when absent the tab fetches it itself. */
  @Input() farmer: AdminFarmerDetail | null = null;

  readonly S = S;

  // ---------- Permissions (UI courtesy; the API re-checks each one) ----------
  readonly canViewDocuments = computed(() => this.rbac.can('farmer.document.view'));
  readonly canViewBank = computed(() => this.rbac.can('farmer.bank_account.view'));
  readonly canViewPayouts = computed(() => this.rbac.can('payout.view'));

  // ---------- State ----------
  readonly profile = signal<AdminFarmerDetail | null>(null);
  readonly farmerState = signal<LoadState>('idle');
  readonly documents = signal<AdminFarmerDocument[]>([]);
  readonly docsState = signal<LoadState>('idle');
  readonly destinations = signal<AdminFarmerPayoutDestination[]>([]);
  readonly destState = signal<LoadState>('idle');
  readonly payouts = signal<PayoutSummary[]>([]);
  readonly payoutState = signal<LoadState>('idle');
  readonly expanded = signal<Record<SectionKey, boolean>>({ identity: true, land: true, bank: false });
  readonly dialog = signal<{ vm: DocSectionVm; doc: AdminFarmerDocument } | null>(null);
  readonly busy = signal(false);
  readonly urlError = signal<string | null>(null);

  // ---------- Derived ----------
  readonly banks = computed(() => this.destinations().filter((d) => d.kind === 'BANK'));
  readonly upis = computed(() => this.destinations().filter((d) => d.kind === 'UPI'));

  readonly bankBadge = computed<Badge | null>(() => {
    if (this.destState() !== 'ready') return null;
    const banks = this.banks();
    if (banks.length === 0) return { label: S.STATUS_NOT_ADDED, tone: 'neutral' };
    return banks.every((b) => b.isVerified) ? { label: S.STATUS_VERIFIED, tone: 'success' } : { label: S.STATUS_PENDING, tone: 'warning' };
  });

  readonly dialogSubtitle = computed(() => {
    const f = this.profile();
    return f ? S.farmerLine(f.fullName, f.tohfaFarmerId) : '';
  });

  readonly docSections = computed<DocSectionVm[]>(() => {
    const f = this.profile();
    const docs = this.documents();
    return [this.identitySection(newest(docs, 'ID_PROOF'), f), this.landSection(newest(docs, 'FARM_DOC'), f)];
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['farmer'] && this.farmer) {
      this.profile.set(this.farmer);
      this.farmerState.set('ready');
    }
    if (changes['farmerId'] && this.farmerId !== '') this.loadAll();
  }

  loadAll(): void {
    this.dialog.set(null);
    this.urlError.set(null);
    if (!this.farmer || this.farmer.id !== this.farmerId) this.loadFarmer();
    this.loadDocuments();
    this.loadDestinations();
    this.loadPayouts();
  }

  loadDocuments(): void {
    if (!this.canViewDocuments()) {
      this.docsState.set('forbidden');
      return;
    }
    this.docsState.set('loading');
    this.farmers.documents(this.farmerId).subscribe({
      next: (res) => {
        this.documents.set(res.items);
        this.docsState.set('ready');
      },
      error: (err: HttpErrorResponse) => this.docsState.set(errorState(err)),
    });
  }

  toggle(key: SectionKey): void {
    this.expanded.update((e) => ({ ...e, [key]: !e[key] }));
  }

  trackSection(_: number, vm: DocSectionVm): string {
    return vm.key;
  }

  /** Re-fetches the list for a fresh signed URL (they expire after 15 minutes), then opens the dialog. */
  view(vm: DocSectionVm): void {
    const doc = vm.doc;
    if (!doc || this.busy()) return;
    this.withFreshDocument(doc.id, (fresh) => {
      const current = this.docSections().find((s) => s.key === vm.key);
      if (current) this.dialog.set({ vm: current, doc: fresh });
    });
  }

  /**
   * Opens the file in a new tab with a URL fetched just now. The tab is opened synchronously, inside
   * the click, so popup blockers allow it; it is pointed at the signed URL once the fetch returns.
   */
  download(doc: AdminFarmerDocument): void {
    if (this.downloadHint(doc) !== null || this.busy()) return;
    const target = window.open('', '_blank');
    if (target) target.opener = null;
    this.withFreshDocument(
      doc.id,
      (fresh) => {
        if (fresh.readUrl === null) {
          target?.close();
          this.urlError.set(S.DOCUMENT_NO_FILE);
          return;
        }
        if (target) target.location.href = fresh.readUrl;
        else window.open(fresh.readUrl, '_blank', 'noopener');
      },
      () => target?.close(),
    );
  }

  downloadHint(doc: AdminFarmerDocument): string | null {
    if (!this.canViewDocuments()) return S.NOT_PERMITTED;
    if (doc.readUrl === null) return S.DOCUMENT_NO_FILE;
    return null;
  }

  money(amount: string): string {
    return formatMoney(amount);
  }

  payoutLabel(status: PayoutStatus): string {
    return S.PAYOUT_STATUS[status] ?? status;
  }

  payoutTone(status: PayoutStatus): string {
    return PAYOUT_TONE[status] ?? 'neutral';
  }

  // ---------- Private ----------

  private loadFarmer(): void {
    this.farmerState.set('loading');
    this.farmers.get(this.farmerId).subscribe({
      next: (f) => {
        this.profile.set(f);
        this.farmerState.set('ready');
      },
      error: () => this.farmerState.set('error'),
    });
  }

  private loadDestinations(): void {
    if (!this.canViewBank()) {
      this.destState.set('forbidden');
      return;
    }
    this.destState.set('loading');
    this.kyc.payoutDestinations(this.farmerId).subscribe({
      next: (res) => {
        this.destinations.set(res.items);
        this.destState.set('ready');
      },
      error: (err: HttpErrorResponse) => this.destState.set(errorState(err)),
    });
  }

  private loadPayouts(): void {
    if (!this.canViewPayouts()) {
      this.payoutState.set('forbidden');
      return;
    }
    this.payoutState.set('loading');
    this.kyc.payouts(this.farmerId, PAYOUT_PREVIEW_LIMIT).subscribe({
      next: (res) => {
        this.payouts.set(res.items);
        this.payoutState.set('ready');
      },
      error: (err: HttpErrorResponse) => this.payoutState.set(errorState(err)),
    });
  }

  private withFreshDocument(docId: string, then: (doc: AdminFarmerDocument) => void, onFail?: () => void): void {
    this.busy.set(true);
    this.urlError.set(null);
    this.farmers.documents(this.farmerId).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.documents.set(res.items);
        const fresh = res.items.find((d) => d.id === docId);
        if (!fresh) {
          onFail?.();
          this.urlError.set(S.DOCUMENT_GONE);
          return;
        }
        then(fresh);
      },
      error: () => {
        this.busy.set(false);
        onFail?.();
        this.urlError.set(S.DOCUMENT_URL_ERROR);
      },
    });
  }

  private date(value: string | null, withTime: boolean): string | null {
    return value === null ? null : formatDate(value, withTime ? 'd MMM y, h:mm a' : 'd MMM y', this.locale);
  }

  /** Verification rows and note common to both documents. REJECTED reads "Reviewed …". */
  private verification(doc: AdminFarmerDocument | null, titleCase: boolean): { rows: KycDetailRow[]; note: KycNote } {
    const rejected = doc?.verificationStatus === 'REJECTED';
    const L = titleCase
      ? { submitted: S.DLG_SUBMITTED_ON, on: rejected ? S.DLG_REVIEWED_ON : S.DLG_VERIFIED_ON, by: rejected ? S.DLG_REVIEWED_BY : S.DLG_VERIFIED_BY }
      : { submitted: S.SUBMITTED_ON, on: rejected ? S.REVIEWED_ON : S.VERIFIED_ON, by: rejected ? S.REVIEWED_BY : S.VERIFIED_BY };
    const rows: KycDetailRow[] = [
      { label: L.submitted, value: this.date(doc?.uploadedAt ?? null, false) },
      { label: L.on, value: this.date(doc?.verifiedAt ?? null, true) },
      {
        label: L.by,
        value: doc?.verifiedBy ? S.reviewerId(doc.verifiedBy) : null,
        hint: doc?.verifiedBy ? `${S.REVIEWER_ID_HINT}: ${doc.verifiedBy}` : undefined,
      },
    ];
    const note: KycNote = rejected
      ? { label: titleCase ? S.DLG_REJECT_REASON : S.REJECT_REASON, text: doc?.rejectReason ?? null, tone: 'danger' }
      : { label: titleCase ? S.DLG_VERIFICATION_NOTE : S.VERIFICATION_NOTE, text: null, tone: 'ok', hint: S.NOTE_NOT_IN_API };
    return { rows, note };
  }

  private fileMeta(doc: AdminFarmerDocument | null): string {
    return doc ? S.fileMeta(fileKind(doc.mimeType), formatBytes(doc.sizeBytes)) : '';
  }

  private badge(doc: AdminFarmerDocument | null): Badge {
    return doc ? DOC_BADGE[doc.verificationStatus] : { label: S.STATUS_NOT_SUBMITTED, tone: 'neutral' };
  }

  private identitySection(doc: AdminFarmerDocument | null, f: AdminFarmerDetail | null): DocSectionVm {
    const number = f?.aadhaarLast4 ? S.maskedAadhaar(f.aadhaarLast4) : null;
    const tab = this.verification(doc, false);
    const dlg = this.verification(doc, true);
    return {
      key: 'identity',
      title: S.SECTION_IDENTITY,
      icon: 'badge',
      tileTone: 'danger',
      doc,
      badge: this.badge(doc),
      emptyText: S.IDENTITY_EMPTY,
      topRows: [
        { label: S.DOCUMENT_TYPE, value: S.DOC_TYPE_ID_PROOF, hint: S.SUBTYPE_NOT_IN_API },
        { label: S.DOCUMENT_NUMBER, value: number, hint: S.AADHAAR_FROM_PROFILE },
      ],
      refLabel: S.UPLOADED_DOCUMENT,
      fileMeta: this.fileMeta(doc),
      bottomRows: tab.rows,
      note: tab.note,
      dialogTitle: S.DIALOG_IDENTITY_TITLE,
      dialogNote: dlg.note,
      dialogSections: [
        {
          title: S.DLG_VERIFICATION_DETAILS,
          rows: [
            { label: S.DLG_DOCUMENT_TYPE, value: S.DOC_TYPE_ID_PROOF, hint: S.SUBTYPE_NOT_IN_API },
            { label: S.DLG_DOCUMENT_NUMBER, value: number, hint: S.AADHAAR_FROM_PROFILE },
            ...dlg.rows,
          ],
        },
      ],
    };
  }

  private landSection(doc: AdminFarmerDocument | null, f: AdminFarmerDetail | null): DocSectionVm {
    const land = primaryLocation(f);
    const survey = land?.surveyNumber ?? null;
    const area = land?.areaAcres != null ? `${land.areaAcres.toFixed(2)}${S.UNIT_ACRES}` : null;
    const village = land?.village ?? null;
    const zone = f?.zone?.name ?? null;
    const tab = this.verification(doc, false);
    const dlg = this.verification(doc, true);
    return {
      key: 'land',
      title: S.SECTION_LAND,
      icon: 'location_on',
      tileTone: 'amber',
      doc,
      badge: this.badge(doc),
      emptyText: S.LAND_EMPTY,
      topRows: [
        { label: S.PROOF_TYPE, value: S.DOC_TYPE_FARM_DOC, hint: S.SUBTYPE_NOT_IN_API },
        { label: S.SURVEY_NUMBER, value: survey, hint: S.LAND_FROM_PRIMARY },
      ],
      refLabel: S.DOCUMENT_REFERENCE,
      fileMeta: this.fileMeta(doc),
      bottomRows: [
        { label: S.LAND_AREA, value: area, hint: S.LAND_FROM_PRIMARY },
        { label: S.VILLAGE, value: village, hint: S.LAND_FROM_PRIMARY },
        { label: S.ZONE, value: zone },
        ...tab.rows,
      ],
      note: tab.note,
      dialogTitle: S.DIALOG_LAND_TITLE,
      dialogNote: dlg.note,
      dialogSections: [
        {
          title: S.DLG_DOCUMENT_DETAILS,
          rows: [
            { label: S.DLG_PROOF_TYPE, value: S.DOC_TYPE_FARM_DOC, hint: S.SUBTYPE_NOT_IN_API },
            { label: S.DLG_SURVEY_NUMBER, value: survey, hint: S.LAND_FROM_PRIMARY },
            { label: S.DLG_DOCUMENT_REFERENCE, value: this.fileMeta(doc), hint: S.FILE_NAME_NOT_IN_API, reference: true },
            { label: S.DLG_LAND_AREA, value: area, hint: S.LAND_FROM_PRIMARY },
            { label: S.DLG_VILLAGE, value: village, hint: S.LAND_FROM_PRIMARY },
            { label: S.DLG_ZONE, value: zone },
          ],
        },
        { title: S.DLG_VERIFICATION_DETAILS, rows: dlg.rows },
      ],
    };
  }
}
