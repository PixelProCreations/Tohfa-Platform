/**
 * Farmers Management → Farmer Details → Verification & Compliance tab.
 *
 * UI ONLY. There is no certification endpoint wired yet, so every value comes from
 * `farmer-verification.mock.ts` and every action (Mark Unverified, Block Listings, Remove Record)
 * changes local state only — nothing is persisted and no permission is checked. When the API
 * lands, the mock import is replaced by a service call, each action gains its `requirePermission`
 * code from docs/rbac.json, and each mutation writes its audit_log row server-side.
 *
 * "Verify on Issuer Portal" deliberately navigates nowhere yet: the issuing bodies' lookup URLs are
 * not part of any ground-truth file, so the buttons only select which portal the right-hand card
 * describes. "Correct Record" has no approved dialog design; it is wired to require a reason and
 * otherwise does nothing.
 */
import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, LOCALE_ID, ViewChild, computed, inject, signal, type ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FARMER_VERIFICATION_MOCK,
  type CertificationListingMock,
  type CertificationRecordMock,
} from './farmer-verification.mock';
import { FarmerVerificationBlockDialogComponent, type BlockResult } from './farmer-verification-block-dialog.component';
import { FarmerVerificationRemoveDialogComponent, type RemoveResult } from './farmer-verification-remove-dialog.component';
import { CERT_STATUS_META, type StatusMeta } from './farmer-verification-shared';
import { FARMER_VERIFICATION_STRINGS as S } from './farmer-verification-tab.strings';
import { FarmerVerificationUnverifyDialogComponent, type UnverifyResult } from './farmer-verification-unverify-dialog.component';

type OpenDialog = { kind: 'unverify'; certId: string } | { kind: 'block'; certId: string } | { kind: 'remove' } | null;

let nextId = 0;

@Component({
  selector: 'tohfa-farmer-verification-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FarmerVerificationUnverifyDialogComponent,
    FarmerVerificationBlockDialogComponent,
    FarmerVerificationRemoveDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .icon {
        font-size: var(--icon-btn);
      }

      /* ---------- Tab heading ---------- */
      .tab-head {
        display: flex;
        align-items: flex-start;
        gap: var(--space-12);
        margin-bottom: var(--space-16);
      }
      .tab-head > .icon {
        margin-top: var(--space-4);
        font-size: var(--icon-nav);
        color: var(--tohfa-amber);
      }
      .tab-title {
        margin: 0;
        font-size: var(--fs-page);
        font-weight: var(--fw-bold);
      }
      .tab-sub {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }

      /* ---------- Layout ---------- */
      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
        align-items: start;
        gap: var(--space-16);
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--space-16);
      }

      /* ---------- Certification cards ---------- */
      .cert.alert {
        border-color: var(--err-bd);
        background: color-mix(in srgb, var(--err-bg) 45%, var(--tohfa-surface));
      }
      .cert-top {
        display: flex;
        align-items: flex-start;
        gap: var(--space-14);
      }
      .cert-tile {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-20) * 2);
        height: calc(var(--space-20) * 2);
        border-radius: var(--r-sm);
      }
      .cert-tile .icon {
        font-size: var(--icon-nav);
      }
      .cert-tile.ok {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .cert-tile.err {
        background: var(--err-bg);
        color: var(--err);
      }
      .cert-text {
        flex: 1;
        min-width: 0;
      }
      .cert-name {
        margin: 0 0 var(--space-6);
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .cert-name:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .cert-meta {
        margin: 0;
        font-size: var(--fs-dense);
        line-height: 1.7;
        color: var(--tohfa-slate);
      }
      .pill {
        gap: var(--space-4);
      }
      .pill .icon {
        font-size: var(--fs-cell);
      }
      .cert-banner {
        margin-top: var(--space-14);
        border: none;
        font-weight: var(--fw-bold);
      }
      .cert-banner .icon {
        flex: none;
      }
      .cert-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-10);
        margin-top: var(--space-14);
      }
      .btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
        font-size: var(--fs-cell);
      }
      .btn-outline-amber {
        background: var(--tohfa-surface);
      }
      .btn-outline-danger {
        padding: var(--space-8) var(--space-14);
        border: 1px solid var(--err);
        background: var(--tohfa-surface);
        color: var(--err);
      }
      .btn-outline-danger:hover:not(:disabled) {
        background: var(--err-bg);
      }
      .btn-danger {
        padding: var(--space-8) var(--space-14);
        font-size: var(--fs-cell);
      }
      .blocked-state {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-6);
        min-height: var(--tohfa-min-touch-target);
        border: 1px dashed var(--err-bd);
        border-radius: var(--tohfa-radius-button);
        background: var(--err-bg);
        color: var(--err);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .empty {
        margin: 0;
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
      }

      /* ---------- Right-hand cards ---------- */
      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0 0 var(--space-14);
        font-size: var(--fs-card);
        font-weight: var(--fw-xbold);
      }
      .card-title .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-brown);
      }
      .portal-label {
        margin: 0 0 var(--space-6);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
      }
      .portal-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
        padding: 0;
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--tohfa-brown);
        font-family: var(--font);
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
        text-decoration: underline;
        text-underline-offset: var(--space-4);
        cursor: pointer;
      }
      .portal-link:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .help {
        margin: var(--space-14) 0 0;
        font-size: var(--fs-dense);
        line-height: 1.6;
        color: var(--tohfa-slate);
      }
      .field-label {
        display: block;
        margin: 0 0 var(--space-8);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
      }
      .req {
        color: var(--err);
      }
      textarea.tohfa-input {
        min-height: calc(var(--space-32) * 3);
        border-radius: var(--tohfa-radius-input);
        font-size: var(--fs-body);
        resize: vertical;
      }

      @media (max-width: 1000px) {
        .grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      @media (max-width: 560px) {
        .cert-actions {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <header class="tab-head">
      <span class="material-symbols-outlined icon" aria-hidden="true">verified_user</span>
      <div>
        <h2 class="tab-title">{{ S.TITLE }}</h2>
        <p class="tab-sub">{{ S.SUBTITLE }}</p>
      </div>
    </header>

    <div class="grid">
      <!-- ================= Certification records ================= -->
      <div class="stack">
        <section
          *ngFor="let c of certs(); trackBy: trackById"
          class="tohfa-card cert"
          [class.alert]="c.status !== 'VERIFIED'"
          [attr.aria-labelledby]="certHeadingId(c.id)"
        >
          <div class="cert-top">
            <span class="cert-tile" [ngClass]="meta(c).tone" aria-hidden="true">
              <span class="material-symbols-outlined icon">{{ c.icon }}</span>
            </span>
            <div class="cert-text">
              <h3 class="cert-name" [id]="certHeadingId(c.id)" tabindex="-1">{{ c.name }}</h3>
              <p class="cert-meta">
                {{ S.certLine(c.certNo, c.issuedBy) }}<br />
                {{ metaLine(c) }}
              </p>
            </div>
            <span class="tohfa-badge tohfa-badge-lg pill" [ngClass]="meta(c).badge">
              <span class="material-symbols-outlined icon" aria-hidden="true">{{ meta(c).icon }}</span>{{ S.STATUS_LABEL[c.status] }}
            </span>
          </div>

          <div class="tohfa-banner tohfa-banner-danger cert-banner" *ngIf="c.status !== 'VERIFIED'">
            <span class="material-symbols-outlined icon" aria-hidden="true">error</span>{{ S.BLOCKED_BANNER }}
          </div>

          <div class="cert-actions">
            <button
              type="button"
              class="tohfa-btn tohfa-btn-outline-amber btn btn-outline-amber"
              [attr.aria-controls]="ids.portal"
              (click)="portalCertId.set(c.id)"
            >
              <span class="material-symbols-outlined icon" aria-hidden="true">open_in_new</span>{{ S.BTN_VERIFY_PORTAL }}
            </button>

            <button
              *ngIf="c.status === 'VERIFIED'; else notVerified"
              type="button"
              class="tohfa-btn btn btn-outline-danger"
              (click)="open({ kind: 'unverify', certId: c.id })"
            >
              <span class="material-symbols-outlined icon" aria-hidden="true">block</span>{{ S.BTN_MARK_UNVERIFIED }}
            </button>
            <ng-template #notVerified>
              <div class="blocked-state" role="status" *ngIf="blockedCount(c.id) > 0; else blockBtn">
                <span class="material-symbols-outlined icon" aria-hidden="true">lock</span>{{ S.listingsBlocked(blockedCount(c.id)) }}
              </div>
              <ng-template #blockBtn>
                <button type="button" class="tohfa-btn tohfa-btn-danger-l btn btn-danger" (click)="open({ kind: 'block', certId: c.id })">
                  <span class="material-symbols-outlined icon" aria-hidden="true">block</span>{{ S.BTN_BLOCK_LISTINGS }}
                </button>
              </ng-template>
            </ng-template>
          </div>
        </section>

        <section class="tohfa-card" *ngIf="certs().length === 0">
          <p class="empty">{{ S.NO_RECORDS }}</p>
        </section>
      </div>

      <div class="stack">
        <!-- ================= Verify on Issuer Portal ================= -->
        <section class="tohfa-card" [id]="ids.portal" [attr.aria-labelledby]="ids.portalTitle">
          <h3 class="card-title" [id]="ids.portalTitle">
            <span class="material-symbols-outlined icon" aria-hidden="true">open_in_new</span>{{ S.PORTAL_TITLE }}
          </h3>
          <ng-container *ngIf="portalCert() as p">
            <p class="portal-label">{{ S.PORTAL_LABEL }}</p>
            <!-- No navigation yet: the portal URLs are not in any ground-truth file (see file header). -->
            <button
              type="button"
              class="portal-link"
              [attr.aria-label]="S.portalLinkLabel(p.portalHost, p.name)"
              [attr.aria-describedby]="ids.portalHelp"
            >
              {{ p.portalHost }}<span class="material-symbols-outlined icon" aria-hidden="true">open_in_new</span>
            </button>
          </ng-container>
          <p class="help" [id]="ids.portalHelp">{{ S.PORTAL_HELP }}</p>
        </section>

        <!-- ================= Correct or remove a record ================= -->
        <section class="tohfa-card" [attr.aria-labelledby]="ids.correctTitle">
          <h3 class="card-title" [id]="ids.correctTitle">
            <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.CORRECT_TITLE }}
          </h3>
          <label class="field-label" [for]="ids.reason">{{ S.REASON }} <span class="req" aria-hidden="true">*</span></label>
          <textarea
            #reasonInput
            [id]="ids.reason"
            class="tohfa-input"
            rows="4"
            required
            aria-required="true"
            [ngModel]="correctionReason()"
            (ngModelChange)="correctionReason.set($event)"
          ></textarea>
          <div class="cert-actions">
            <button
              type="button"
              class="tohfa-btn tohfa-btn-outline-amber btn btn-outline-amber"
              [disabled]="!hasReason() || certs().length === 0"
              (click)="correct()"
            >
              <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.BTN_CORRECT }}
            </button>
            <button
              type="button"
              class="tohfa-btn btn btn-outline-danger"
              [disabled]="!hasReason() || certs().length === 0"
              (click)="open({ kind: 'remove' })"
            >
              <span class="material-symbols-outlined icon" aria-hidden="true">delete</span>{{ S.BTN_REMOVE }}
            </button>
          </div>
        </section>
      </div>
    </div>

    <!-- ================= Dialogs ================= -->
    <ng-container *ngIf="dialog() as d">
      <tohfa-farmer-verification-unverify-dialog
        *ngIf="d.kind === 'unverify' && certById(d.certId) as c"
        [cert]="c"
        (dismissed)="close()"
        (confirmed)="applyUnverify(c.id, $event)"
      />
      <tohfa-farmer-verification-block-dialog
        *ngIf="d.kind === 'block' && certById(d.certId) as c"
        [cert]="c"
        [listings]="listingsFor(c.id)"
        (dismissed)="close()"
        (confirmed)="applyBlock(c.id, $event)"
      />
      <tohfa-farmer-verification-remove-dialog
        *ngIf="d.kind === 'remove'"
        [records]="certs()"
        [initialId]="defaultRemovalId()"
        [initialRemarks]="correctionReason().trim()"
        (dismissed)="close()"
        (confirmed)="applyRemove($event)"
      />
    </ng-container>
  `,
})
export class FarmerVerificationTabComponent {
  private readonly locale = inject(LOCALE_ID);

  @ViewChild('reasonInput') private reasonInput?: ElementRef<HTMLTextAreaElement>;

  /** Display name of the farmer; reserved for confirmation copy once the API is wired. */
  @Input() farmerName = 'the farmer';

  readonly S = S;

  private readonly uid = nextId++;
  readonly ids = {
    portal: `ver-portal-${this.uid}`,
    portalTitle: `ver-portal-title-${this.uid}`,
    portalHelp: `ver-portal-help-${this.uid}`,
    correctTitle: `ver-correct-title-${this.uid}`,
    reason: `ver-reason-${this.uid}`,
  };

  // ---------- State (local only; see the file header) ----------
  readonly certs = signal<CertificationRecordMock[]>(FARMER_VERIFICATION_MOCK.certifications.map((c) => ({ ...c })));
  readonly listings = signal<CertificationListingMock[]>(FARMER_VERIFICATION_MOCK.listings.map((l) => ({ ...l })));
  /** Reason label recorded when a certificate is marked unverified here, keyed by cert ID. */
  readonly unverifyReasons = signal<Readonly<Record<string, string>>>({});
  readonly portalCertId = signal<string | null>(FARMER_VERIFICATION_MOCK.certifications[0]?.id ?? null);
  readonly correctionReason = signal(FARMER_VERIFICATION_MOCK.correctionReasonDraft);
  readonly dialog = signal<OpenDialog>(null);

  // ---------- Derived ----------
  readonly portalCert = computed(() => this.certs().find((c) => c.id === this.portalCertId()) ?? this.certs()[0] ?? null);
  readonly hasReason = computed(() => this.correctionReason().trim() !== '');
  /** The design opens Remove Record on the problem certificate, so prefer one that is not verified. */
  readonly defaultRemovalId = computed(() => (this.certs().find((c) => c.status !== 'VERIFIED') ?? this.certs()[0])?.id ?? null);

  trackById(_: number, c: CertificationRecordMock): string {
    return c.id;
  }

  certHeadingId(certId: string): string {
    return `ver-cert-${this.uid}-${certId}`;
  }

  meta(c: CertificationRecordMock): StatusMeta {
    return CERT_STATUS_META[c.status];
  }

  date(isoDate: string): string {
    return formatDate(isoDate, 'd MMM y', this.locale);
  }

  metaLine(c: CertificationRecordMock): string {
    switch (c.status) {
      case 'VERIFIED':
        return S.verifiedLine(this.date(c.expiryDate), this.date(c.lastVerifiedOn), c.verifiedBy);
      case 'EXPIRED':
        return S.expiredLine(this.date(c.expiryDate), this.date(c.lastVerifiedOn));
      case 'UNVERIFIED': {
        const reason = this.unverifyReasons()[c.id];
        return reason ? S.unverifiedLine(this.date(c.expiryDate), reason) : S.lastVerifiedLine(this.date(c.expiryDate), this.date(c.lastVerifiedOn));
      }
    }
  }

  certById(id: string): CertificationRecordMock | undefined {
    return this.certs().find((c) => c.id === id);
  }

  listingsFor(certId: string): CertificationListingMock[] {
    return this.listings().filter((l) => l.certId === certId);
  }

  blockedCount(certId: string): number {
    return this.listings().filter((l) => l.certId === certId && l.status === 'BLOCKED').length;
  }

  open(d: Exclude<OpenDialog, null>): void {
    this.dialog.set(d);
  }

  /** Cancel / X / Escape / backdrop. The dialog directive returns focus to the opener. */
  close(): void {
    this.dialog.set(null);
  }

  /** No approved design exists for the correction flow yet; the button only enforces the reason. */
  correct(): void {
    // Intentionally inert until the Correct Record dialog is designed.
  }

  applyUnverify(certId: string, result: UnverifyResult): void {
    const label = S.UNVERIFY_REASONS.find((r) => r.code === result.reason)?.label ?? '';
    this.certs.update((list) => list.map((c) => (c.id === certId ? { ...c, status: 'UNVERIFIED' } : c)));
    this.unverifyReasons.update((m) => ({ ...m, [certId]: label }));
    this.dialog.set(null);
    this.focusCertHeading(certId);
  }

  applyBlock(certId: string, result: BlockResult): void {
    const ids = new Set(result.listingIds);
    this.listings.update((list) => list.map((l) => (l.certId === certId && ids.has(l.id) ? { ...l, status: 'BLOCKED' } : l)));
    this.dialog.set(null);
    this.focusCertHeading(certId);
  }

  applyRemove(result: RemoveResult): void {
    this.certs.update((list) => list.filter((c) => c.id !== result.certId));
    this.listings.update((list) => list.filter((l) => l.certId !== result.certId));
    if (this.portalCertId() === result.certId) this.portalCertId.set(this.certs()[0]?.id ?? null);
    this.correctionReason.set('');
    this.dialog.set(null);
    // Clearing the reason disables Remove Record, so the focus the dialog would return there is
    // lost; move it to the (now empty) reason field instead.
    setTimeout(() => this.reasonInput?.nativeElement.focus());
  }

  /** The button that opened the dialog is replaced by the new state, so focus the card heading. */
  private focusCertHeading(certId: string): void {
    setTimeout(() => document.getElementById(this.certHeadingId(certId))?.focus());
  }
}
