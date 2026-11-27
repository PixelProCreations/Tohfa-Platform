/**
 * Audit Management → Audit Details & Farmer Records, FULL RECORD layout (design 94). UI ONLY.
 *
 * Rendered by AuditDetailComponent (route `/audits/:id`) for every known audit whose status is not
 * UPCOMING — the upcoming layout (design 76) stays in AuditDetailComponent. The switch lives in
 * `auditDetailUsesFullLayout` (audit-detail-full.mock.ts).
 *
 * Data: `mockAuditById(id)` for the header and Audit Information (shared with every audit screen),
 * `mockAuditFullRecord(id)` for everything else. Nothing is fetched; nothing reads the real clock.
 * Category Scores show no total (design 94 draws none); the previous-audit score tone comes from
 * AUDIT_TIER_BANDS (BR-04b) and its maximum from AUDIT_RATING_CATEGORIES, never a literal.
 *
 * Links: tab "Inspection & Findings" → AUDIT_ROUTES.findings(id); "Open farmer profile" → /farmers
 * (as the upcoming layout — the mock has no farmer UUID); "Cancel" → AUDIT_ROUTES.dashboard.
 * "Red-flag Audit" opens AuditRedFlagDialogComponent (design 95). Confirming only updates LOCAL
 * state: the Red flag card shows Flagged / the reason / AUDIT_RED_FLAG_DEMO_ACTOR /
 * AUDIT_RED_FLAG_DEMO_AT, the Activity feed gains a "Red-flagged" entry, the button disappears and
 * an aria-live line says it was not stored. Leaving the page forgets it.
 * Inert (no design / no route): "External audit records", "Open certification record", the FMB
 * sketch file, every "View" and "Edit upcoming audit schedule".
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AUDIT_CORRECTIVE_STATUS_TONE,
  AUDIT_FULL_CERT_STATUS_TONE,
  AUDIT_FULL_VERIFICATION_TONE,
  AUDIT_RED_FLAG_DEMO_ACTOR,
  AUDIT_RED_FLAG_DEMO_AT,
  mockAuditFullRecord,
  type AuditCorrectiveActionStatus,
  type AuditCorrectiveReviewOutcome,
  type AuditFullActivity,
  type AuditFullCertificationStatus,
  type AuditFullDocumentKind,
  type AuditFullDocumentSource,
  type AuditFullEvidence,
  type AuditFullPreviousAudit,
  type AuditFullVerificationStatus,
} from './audit-detail-full.mock';
import {
  AuditRedFlagDialogComponent,
  type AuditRedFlagConfirmation,
} from './audit-redflag-dialog.component';
import { AUDIT_DETAIL_FULL_STRINGS as F } from './audit-detail-full.strings';
import { AUDIT_DETAIL_STRINGS as D } from './audit-detail.strings';
import { formatAuditDate, formatAuditDateTime24, parseAuditDate } from './audit-format';
import { AUDIT_ROUTES } from './audit-nav';
import {
  AUDIT_TYPE_LABEL,
  auditStatusLabel,
  auditStatusPillClass,
  auditToneClass,
} from './audit-presentation';
import { AUDIT_SHARED_STYLES } from './audit-shared.styles';
import { AUDIT_RATING_CATEGORIES, AUDIT_TIER_BANDS, mockAuditById } from './audit.mock';
import { AUDIT_STRINGS as S } from './audit.strings';
import type { AuditTone, AuditUiStatus } from './audit.types';

/** Max total score: 10 categories x 10 (BR-04). Derived from the categories, not a literal. */
const MAX_TOTAL = AUDIT_RATING_CATEGORIES.reduce((sum, c) => sum + c.maxScore, 0);

/**
 * Text tone of the Overview "Status" value. Design 94 draws "Cancelled" red, whereas the module's
 * Cancelled pill is neutral grey (audit-presentation.ts) — so this text-only mapping is separate.
 */
const OVERVIEW_STATUS_TONE: Readonly<Record<AuditUiStatus, AuditTone>> = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  PENDING_REVIEW: 'purple',
  OVERDUE: 'danger',
  UPCOMING: 'purple',
  POST_SCHEDULED_DATE: 'danger',
};

const CERT_STATUS_LABEL: Readonly<Record<AuditFullCertificationStatus, string>> = {
  ACTIVE: F.CERT_ACTIVE,
  EXPIRED: F.CERT_EXPIRED,
};

const VERIFICATION_LABEL: Readonly<Record<AuditFullVerificationStatus, string>> = {
  VERIFIED: F.VERIFICATION_VERIFIED,
  PENDING: F.VERIFICATION_PENDING,
  REJECTED: F.VERIFICATION_REJECTED,
};

const DOCUMENT_SOURCE_LABEL: Readonly<Record<AuditFullDocumentSource, string>> = {
  FARMER_RECORD: F.DOC_SOURCE_FARMER_RECORD,
};

const DOCUMENT_LABEL: Readonly<Record<AuditFullDocumentKind, string>> = {
  IDENTITY_PROOF: F.DOC_IDENTITY_PROOF,
  LAND_OWNERSHIP_PROOF: F.DOC_LAND_OWNERSHIP_PROOF,
  SOIL_REPORT: F.DOC_SOIL_REPORT,
};

const CA_STATUS_LABEL: Readonly<Record<AuditCorrectiveActionStatus, string>> = {
  OPEN: F.CA_OPEN,
  CLOSED: F.CA_CLOSED,
};

const REVIEW_LABEL: Readonly<Record<AuditCorrectiveReviewOutcome, string>> = {
  ACCEPTED: F.REVIEW_ACCEPTED,
  REJECTED: F.REVIEW_REJECTED,
};

interface KvRow {
  readonly label: string;
  readonly value: string;
  /** `tone-fg-*` class for coloured values, or ''. */
  readonly toneClass: string;
}

interface PreviousView {
  readonly id: string;
  readonly title: string;
  readonly meta: string;
  readonly completion: string;
  readonly score: string | null;
  readonly scoreClass: string;
}

interface EvidenceView {
  readonly label: string;
  readonly state: string;
  readonly viewLabel: string;
}

interface CategoryView {
  readonly code: string;
  readonly label: string;
  readonly score: string;
}

interface CorrectiveView {
  readonly id: string;
  readonly pillLabel: string;
  readonly pillClass: string;
  readonly lines: readonly string[];
}

interface ActivityView {
  readonly when: string;
  readonly title: string;
  readonly description: string;
}

/** A red-flag confirmed in the dialog, kept only in this component (never sent anywhere). */
interface LocalRedFlag extends AuditRedFlagConfirmation {
  /** The audit it was raised on, so a route change to another audit does not carry it over. */
  readonly auditId: string;
}

function kv(label: string, value: string, tone: AuditTone | null = null): KvRow {
  return { label, value, toneClass: tone === null ? '' : `tone-fg-${tone}` };
}

@Component({
  selector: 'tohfa-audit-detail-full',
  standalone: true,
  imports: [CommonModule, RouterLink, AuditRedFlagDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    AUDIT_SHARED_STYLES,
    `
      /* .audit-kv-value (ink) is declared after .tone-fg-* in the shared sheet, so at equal
         specificity it would win; coloured values (Cancelled, Expired, Verified) need these. */
      .audit-kv-value.tone-fg-info { color: var(--info); }
      .audit-kv-value.tone-fg-warning { color: var(--warn); }
      .audit-kv-value.tone-fg-success { color: var(--ok); }
      .audit-kv-value.tone-fg-danger { color: var(--err); }
      .audit-kv-value.tone-fg-neutral { color: var(--neutral-status); }
      .head-left {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }
      .head-id {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-8);
        margin: 0;
        font-size: var(--fs-dense);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-ink);
      }
      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-10);
      }
      .full-cols {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--space-14);
        align-items: start;
      }
      .full-bottom {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-14);
        align-items: start;
      }
      .full-col {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        min-width: 0;
      }
      .kv-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-10);
        margin: 0 0 var(--space-12);
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-ink);
      }
      .links {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-6) var(--space-16);
        margin-top: var(--space-12);
      }
      .card-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        padding: 0;
        border: none;
        background: none;
        color: var(--tohfa-amber-active);
        font-family: var(--font);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        text-decoration: none;
        border-radius: var(--r-xs);
        cursor: pointer;
      }
      .card-link:hover {
        color: var(--tohfa-brown-deep);
      }
      .card-link:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .card-link .material-symbols-outlined {
        font-size: var(--icon-row-action);
      }
      .file-link {
        padding: 0;
        border: none;
        background: none;
        color: var(--info);
        font-family: var(--font);
        font-size: inherit;
        font-weight: var(--fw-bold);
        border-radius: var(--r-xs);
      }
      .file-link:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .inert {
        cursor: default;
      }
      .helper {
        margin: var(--space-12) 0 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .empty-line {
        margin: 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .row-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .row-list li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-10);
        padding: var(--space-10) 0;
        border-bottom: var(--border-divider);
        font-size: var(--fs-dense);
      }
      .row-list li:first-child {
        padding-top: 0;
      }
      .row-list li:last-child {
        padding-bottom: 0;
        border-bottom: none;
      }
      .row-label {
        color: var(--tohfa-slate);
        font-weight: var(--fw-medium);
      }
      .row-value {
        color: var(--tohfa-ink);
        font-weight: var(--fw-bold);
        text-align: right;
      }
      .row-sub {
        display: block;
        font-size: var(--fs-cap);
        font-weight: var(--fw-medium);
        color: var(--tohfa-slate);
      }
      .boxed-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
      }
      .boxed-list li {
        padding: var(--space-10) var(--space-12);
        border: var(--border-card);
        border-radius: var(--r-sm);
      }
      .boxed-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-10);
        font-size: var(--fs-dense);
        font-weight: var(--fw-xbold);
        color: var(--tohfa-ink);
      }
      .boxed-line {
        display: block;
        margin-top: var(--space-4);
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .evidence-btn {
        min-height: calc(var(--space-14) * 2);
        padding: var(--space-4) var(--space-12);
        border: var(--border-card);
        border-radius: var(--r-sm);
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        font-family: var(--font);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
      }
      .evidence-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .scores {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--fs-dense);
      }
      .scores th {
        padding: 0 0 var(--space-10);
        border-bottom: var(--border-divider);
        color: var(--tohfa-slate);
        font-size: var(--fs-cap);
        font-weight: var(--fw-semi);
        text-align: left;
      }
      .scores td {
        padding: var(--space-10) 0;
        border-bottom: var(--border-divider);
        color: var(--tohfa-ink);
        font-weight: var(--fw-semi);
      }
      .scores tr:last-child td {
        border-bottom: none;
      }
      .scores .num {
        text-align: right;
        font-weight: var(--fw-xbold);
        white-space: nowrap;
      }
      .ca-lines {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .ca + .ca {
        margin-top: var(--space-14);
        padding-top: var(--space-14);
        border-top: var(--border-divider);
      }
      .red-flag-btn {
        box-sizing: border-box;
        width: 100%;
        min-height: var(--tohfa-min-touch-target);
        margin-top: var(--space-14);
        border: 1px dashed var(--tohfa-border);
        border-radius: var(--tohfa-radius-button);
        background: var(--tohfa-surface);
        color: var(--err);
        font-family: var(--font);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .red-flag-btn {
        cursor: pointer;
      }
      .red-flag-btn:hover {
        background: var(--err-bg);
      }
      .red-flag-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .audit-card-head:focus {
        outline: none;
      }
      .audit-card-head:focus-visible {
        box-shadow: var(--tohfa-focus-ring);
      }
      .flag-status {
        margin: var(--space-12) 0 0;
        font-size: var(--fs-cap);
        font-weight: var(--fw-semi);
        color: var(--ok);
      }
      .flag-status:empty {
        display: none;
      }
      .timeline {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
      }
      .timeline li {
        position: relative;
        padding-left: var(--space-18);
      }
      .timeline li::before {
        content: '';
        position: absolute;
        left: 0;
        top: var(--space-4);
        width: var(--space-8);
        height: var(--space-8);
        border-radius: var(--r-circle);
        background: var(--tohfa-amber);
      }
      .timeline-when {
        display: block;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .timeline-title {
        display: block;
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        color: var(--tohfa-ink);
      }
      .timeline-desc {
        display: block;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      @media (max-width: 1200px) {
        .full-cols {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 900px) {
        .full-cols,
        .full-bottom {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <header class="audit-page-header">
      <div class="head-left">
        <div class="audit-title-row">
          <span class="audit-title-tile" aria-hidden="true">
            <span class="material-symbols-outlined">assignment</span>
          </span>
          <h1 class="audit-title">{{ D.TITLE }}</h1>
        </div>
        <p class="head-id">
          {{ audit().id }}
          <span [class]="statusPillDense()">{{ statusLabel() }}</span>
        </p>
      </div>
    </header>

    <nav class="tabs" [attr.aria-label]="D.TABS_LABEL">
      <a
        class="tohfa-btn tohfa-btn-primary audit-btn"
        aria-current="page"
        [routerLink]="routes.detail(audit().id)"
      >
        <span class="material-symbols-outlined icon" aria-hidden="true">description</span>{{ D.TAB_DETAILS }}
      </a>
      <a class="tohfa-btn audit-btn-outline audit-btn" [routerLink]="routes.findings(audit().id)">
        <span class="material-symbols-outlined icon" aria-hidden="true">fact_check</span>{{ D.TAB_FINDINGS }}
      </a>
    </nav>

    <div class="full-cols">
      <!-- Column 1 -->
      <div class="full-col">
        <section class="audit-card" aria-labelledby="adf-info">
          <h2 class="audit-card-head" id="adf-info">
            <span class="material-symbols-outlined" aria-hidden="true">info</span>{{ D.CARD_AUDIT_INFO }}
          </h2>
          <div class="audit-card-body">
            <p class="kv-head">
              <span>{{ audit().id }}</span>
              <span [class]="statusPillDense()">{{ statusLabel() }}</span>
            </p>
            <dl class="audit-kv">
              <div class="audit-kv-row" *ngFor="let r of infoRows()">
                <dt class="audit-kv-label">{{ r.label }}</dt>
                <dd class="audit-kv-value" [class]="r.toneClass">{{ r.value }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section class="audit-card" aria-labelledby="adf-overview">
          <h2 class="audit-card-head" id="adf-overview">
            <span class="material-symbols-outlined" aria-hidden="true">bar_chart</span>{{ F.CARD_OVERVIEW }}
          </h2>
          <div class="audit-card-body">
            <dl class="audit-kv">
              <div class="audit-kv-row" *ngFor="let r of overviewRows()">
                <dt class="audit-kv-label">{{ r.label }}</dt>
                <dd class="audit-kv-value" [class]="r.toneClass">{{ r.value }}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <!-- Column 2 -->
      <div class="full-col">
        <section class="audit-card" aria-labelledby="adf-farmer">
          <h2 class="audit-card-head" id="adf-farmer">
            <span class="material-symbols-outlined" aria-hidden="true">person</span>{{ F.CARD_FARMER }}
          </h2>
          <div class="audit-card-body">
            <dl class="audit-kv">
              <div class="audit-kv-row" *ngFor="let r of farmerRows()">
                <dt class="audit-kv-label">{{ r.label }}</dt>
                <dd class="audit-kv-value" [class]="r.toneClass">{{ r.value }}</dd>
              </div>
            </dl>
            <div class="links">
              <a class="card-link" routerLink="/farmers">
                <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>{{ D.OPEN_FARMER_PROFILE }}
              </a>
              <button type="button" class="card-link inert" aria-disabled="true" [title]="S.NO_DESIGN_YET">
                <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>{{ F.EXTERNAL_AUDIT_RECORDS }}
              </button>
            </div>
          </div>
        </section>

        <section class="audit-card" aria-labelledby="adf-certs">
          <h2 class="audit-card-head" id="adf-certs">
            <span class="material-symbols-outlined" aria-hidden="true">verified</span>{{ F.CARD_CERTIFICATIONS }}
          </h2>
          <div class="audit-card-body">
            <ng-container *ngIf="certRows().length > 0; else noCert">
              <dl class="audit-kv">
                <div class="audit-kv-row" *ngFor="let r of certRows()">
                  <dt class="audit-kv-label">{{ r.label }}</dt>
                  <dd class="audit-kv-value" [class]="r.toneClass">{{ r.value }}</dd>
                </div>
              </dl>
              <div class="links">
                <button type="button" class="card-link inert" aria-disabled="true" [title]="S.NO_DESIGN_YET">
                  <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>{{ F.OPEN_CERTIFICATION_RECORD }}
                </button>
              </div>
            </ng-container>
            <ng-template #noCert>
              <p class="empty-line">{{ F.CERTIFICATIONS_EMPTY }}</p>
            </ng-template>
          </div>
        </section>

        <section class="audit-card" aria-labelledby="adf-docs">
          <h2 class="audit-card-head" id="adf-docs">
            <span class="material-symbols-outlined" aria-hidden="true">description</span>{{ F.CARD_DOCUMENTS }}
          </h2>
          <div class="audit-card-body">
            <ul class="row-list" *ngIf="documents().length > 0; else noDocs">
              <li *ngFor="let d of documents()">
                <span class="row-label">{{ d.label }}</span>
                <span class="row-value">{{ d.value }}</span>
              </li>
            </ul>
            <ng-template #noDocs>
              <p class="empty-line">{{ F.DOCUMENTS_EMPTY }}</p>
            </ng-template>
          </div>
        </section>
      </div>

      <!-- Column 3 -->
      <div class="full-col">
        <section class="audit-card" aria-labelledby="adf-farm">
          <h2 class="audit-card-head" id="adf-farm">
            <span class="material-symbols-outlined" aria-hidden="true">landscape</span>{{ F.CARD_FARM_LAND }}
          </h2>
          <div class="audit-card-body">
            <dl class="audit-kv">
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ F.FARM_LOCATION }}</dt>
                <dd class="audit-kv-value">{{ record().farm.location }}</dd>
              </div>
              <div class="audit-kv-row">
                <dt class="audit-kv-label">{{ F.FMB_SKETCH }}</dt>
                <dd class="audit-kv-value">
                  <button
                    *ngIf="record().farm.fmbSketchFile as file; else noFmb"
                    type="button"
                    class="file-link inert"
                    aria-disabled="true"
                    [title]="S.NO_DESIGN_YET"
                  >
                    {{ file }}
                  </button>
                  <ng-template #noFmb>{{ S.DASH }}</ng-template>
                </dd>
              </div>
              <div class="audit-kv-row" *ngFor="let p of plotRows()">
                <dt class="audit-kv-label">{{ p.label }}</dt>
                <dd class="audit-kv-value">{{ p.value }}</dd>
              </div>
            </dl>
            <p class="helper" *ngIf="plotRows().length > 0; else noPlots">{{ F.LAND_HELPER }}</p>
            <ng-template #noPlots>
              <p class="helper">{{ F.PLOTS_EMPTY }}</p>
            </ng-template>
          </div>
        </section>

        <section class="audit-card" aria-labelledby="adf-previous">
          <h2 class="audit-card-head" id="adf-previous">
            <span class="material-symbols-outlined" aria-hidden="true">history</span>{{ F.CARD_PREVIOUS_AUDITS }}
          </h2>
          <div class="audit-card-body">
            <ul class="boxed-list" *ngIf="previous().length > 0; else noPrevious">
              <li *ngFor="let p of previous()">
                <span class="boxed-top">
                  <span>{{ p.title }}</span>
                  <span *ngIf="p.score !== null" [class]="p.scoreClass">{{ p.score }}</span>
                </span>
                <span class="boxed-line">{{ p.meta }}</span>
                <span class="boxed-line">{{ p.completion }}</span>
              </li>
            </ul>
            <ng-template #noPrevious>
              <p class="empty-line">{{ F.PREVIOUS_EMPTY }}</p>
            </ng-template>
          </div>
        </section>

        <section class="audit-card" aria-labelledby="adf-evidence">
          <h2 class="audit-card-head" id="adf-evidence">
            <span class="material-symbols-outlined" aria-hidden="true">attach_file</span>{{ F.CARD_EVIDENCE }}
          </h2>
          <div class="audit-card-body">
            <ul class="row-list" *ngIf="evidence().length > 0; else noEvidence">
              <li *ngFor="let e of evidence()">
                <span>
                  <span class="row-value">{{ e.label }}</span>
                  <span class="row-sub">{{ e.state }}</span>
                </span>
                <button
                  type="button"
                  class="evidence-btn inert"
                  aria-disabled="true"
                  [attr.aria-label]="e.viewLabel"
                  [title]="S.NO_DESIGN_YET"
                >
                  {{ F.VIEW }}
                </button>
              </li>
            </ul>
            <ng-template #noEvidence>
              <p class="empty-line">{{ F.EVIDENCE_EMPTY }}</p>
            </ng-template>
          </div>
        </section>
      </div>
    </div>

    <div class="full-bottom">
      <section class="audit-card" aria-labelledby="adf-scores">
        <h2 class="audit-card-head" id="adf-scores">
          <span class="material-symbols-outlined" aria-hidden="true">emoji_events</span>{{ F.CARD_CATEGORY_SCORES }}
        </h2>
        <div class="audit-card-body">
          <table class="scores" aria-labelledby="adf-scores">
            <thead>
              <tr>
                <th scope="col">{{ F.COL_CATEGORY }}</th>
                <th scope="col" class="num">{{ F.COL_SCORE }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of categories()">
                <td>{{ c.label }}</td>
                <td class="num">{{ c.score }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="full-col">
        <section class="audit-card" aria-labelledby="adf-ca">
          <h2 class="audit-card-head" id="adf-ca">
            <span class="material-symbols-outlined" aria-hidden="true">build</span>{{ F.CARD_CORRECTIVE_ACTIONS }}
          </h2>
          <div class="audit-card-body">
            <ng-container *ngIf="corrective().length > 0; else noCa">
              <div class="ca" *ngFor="let c of corrective()">
                <p class="kv-head">
                  <span>{{ c.id }}</span>
                  <span [class]="c.pillClass">{{ c.pillLabel }}</span>
                </p>
                <ul class="ca-lines">
                  <li *ngFor="let line of c.lines">{{ line }}</li>
                </ul>
              </div>
            </ng-container>
            <ng-template #noCa>
              <p class="empty-line">{{ F.CORRECTIVE_EMPTY }}</p>
            </ng-template>
          </div>
        </section>

        <section class="audit-card" aria-labelledby="adf-flag">
          <h2 class="audit-card-head" id="adf-flag" tabindex="-1">
            <span class="material-symbols-outlined" aria-hidden="true">flag</span>{{ F.CARD_RED_FLAG }}
          </h2>
          <div class="audit-card-body">
            <dl class="audit-kv">
              <div class="audit-kv-row" *ngFor="let r of redFlagRows()">
                <dt class="audit-kv-label">{{ r.label }}</dt>
                <dd class="audit-kv-value" [class]="r.toneClass">{{ r.value }}</dd>
              </div>
            </dl>
            <!-- Local only: opens the design-95 dialog; hidden once the audit is flagged. -->
            <button
              *ngIf="!isFlagged()"
              type="button"
              class="red-flag-btn"
              aria-haspopup="dialog"
              (click)="openRedFlag()"
            >
              {{ F.RF_ACTION }}
            </button>
            <p class="flag-status" role="status" aria-live="polite">{{ flagMessage() }}</p>
          </div>
        </section>

        <section class="audit-card" aria-labelledby="adf-activity">
          <h2 class="audit-card-head" id="adf-activity">
            <span class="material-symbols-outlined" aria-hidden="true">timeline</span>{{ F.CARD_ACTIVITY }}
          </h2>
          <div class="audit-card-body">
            <ol class="timeline" *ngIf="activity().length > 0; else noActivity">
              <li *ngFor="let t of activity()">
                <span class="timeline-when">{{ t.when }}</span>
                <span class="timeline-title">{{ t.title }}</span>
                <span class="timeline-desc" *ngIf="t.description !== ''">{{ t.description }}</span>
              </li>
            </ol>
            <ng-template #noActivity>
              <p class="empty-line">{{ F.ACTIVITY_EMPTY }}</p>
            </ng-template>
          </div>
        </section>
      </div>
    </div>

    <div class="audit-footer" role="group" [attr.aria-label]="D.FOOTER_LABEL">
      <a class="tohfa-btn audit-btn-outline audit-btn" [routerLink]="routes.dashboard">{{ F.CANCEL }}</a>
      <!-- Inert: no design for editing a schedule yet. -->
      <button
        type="button"
        class="tohfa-btn tohfa-btn-primary audit-btn inert"
        aria-disabled="true"
        [title]="S.NO_DESIGN_YET"
      >
        <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ F.EDIT_UPCOMING_SCHEDULE }}
      </button>
    </div>

    <tohfa-audit-redflag-dialog
      *ngIf="redFlagOpen()"
      [auditId]="audit().id"
      [farmName]="audit().farmName"
      [minorFindings]="record().redFlag.minorFindings"
      [majorFindings]="record().redFlag.majorFindings"
      (closed)="redFlagOpen.set(false)"
      (confirmed)="onRedFlagConfirmed($event)"
    ></tohfa-audit-redflag-dialog>
  `,
})
export class AuditDetailFullComponent {
  readonly S = S;
  readonly D = D;
  readonly F = F;
  readonly routes = AUDIT_ROUTES;

  /** The audit id (already resolved by AuditDetailComponent from `:id`). */
  readonly auditId = input.required<string>();

  readonly audit = computed(() => mockAuditById(this.auditId()));
  readonly record = computed(() => mockAuditFullRecord(this.auditId()));

  readonly statusLabel = computed(() => auditStatusLabel(this.audit().status));
  readonly statusPillDense = computed(() => auditStatusPillClass(this.audit().status, true));

  readonly infoRows = computed<readonly KvRow[]>(() => {
    const a = this.audit();
    const farm = a.plotIds.length > 0 ? a.plotIds.join(', ') : a.farmName;
    const participants = a.supportingParticipants;
    return [
      kv(D.AUDIT_TYPE, AUDIT_TYPE_LABEL[a.type]),
      kv(F.SCHEDULED, formatAuditDateTime24(a.scheduledAt)),
      kv(F.FARMER, F.farmerWithCode(a.farmerName, a.farmerCode)),
      kv(F.FARM_ZONE, F.farmWithZone(farm, a.zone)),
      kv(D.ASSIGNED_AUDITOR, a.auditorName),
      kv(D.SUPPORTING_PARTICIPANTS, participants.length === 0 ? S.NONE : participants.join(', ')),
      kv(D.AUDIT_PURPOSE, a.purpose ?? S.DASH),
      kv(
        D.LAST_UPDATED,
        a.lastUpdatedAt === null ? S.DASH : D.lastUpdated(formatAuditDateTime24(a.lastUpdatedAt), a.lastUpdatedBy),
      ),
    ];
  });

  readonly overviewRows = computed<readonly KvRow[]>(() => {
    const o = this.record().overview;
    const scheduled = parseAuditDate(o.scheduledAt);
    const quarter = Math.floor(scheduled.getUTCMonth() / 3) + 1;
    return [
      kv(
        F.SCHEDULE,
        F.scheduleWithDuration(
          formatAuditDateTime24(o.scheduledAt),
          o.durationMinutes === null ? null : S.minutes(o.durationMinutes),
        ),
      ),
      kv(F.AUDIT_TYPE, AUDIT_TYPE_LABEL[o.type]),
      kv(F.PURPOSE, o.purpose ?? S.DASH),
      kv(F.STATUS, auditStatusLabel(o.status), OVERVIEW_STATUS_TONE[o.status]),
      kv(F.QUARTER, F.quarter(quarter, scheduled.getUTCFullYear())),
      kv(F.LEAD_AUDITOR, o.leadAuditor),
      kv(F.UPCOMING_AUDIT, o.upcomingAuditOn === null ? S.DASH : formatAuditDate(o.upcomingAuditOn)),
      kv(F.EXTERNAL_ORGANIZATION, o.externalOrganization ?? S.DASH),
      kv(F.NOTES, o.notes ?? S.DASH),
    ];
  });

  readonly farmerRows = computed<readonly KvRow[]>(() => {
    const f = this.record().farmer;
    return [
      kv(D.FARMER_NAME, f.name),
      kv(D.FARMER_ID, f.code),
      kv(F.FARMING_TYPE, f.farmingType ?? S.DASH),
      kv(D.ZONE, f.zone),
      kv(D.REGISTERED, f.registeredOn === null ? S.DASH : formatAuditDate(f.registeredOn)),
      kv(D.CONTACT, f.contact ?? S.DASH),
    ];
  });

  readonly certRows = computed<readonly KvRow[]>(() => {
    const c = this.record().certification;
    if (c === null) return [];
    return [
      kv(F.CERT_TYPE, c.type),
      kv(F.CERT_STATUS, CERT_STATUS_LABEL[c.status], AUDIT_FULL_CERT_STATUS_TONE[c.status]),
      kv(F.CERT_CERTIFIED_DATE, formatAuditDate(c.certifiedOn)),
      kv(F.CERT_EXPIRY_DATE, formatAuditDate(c.expiresOn)),
      kv(F.CERT_DOCUMENT_REF, c.documentRef),
      kv(F.CERT_VERIFICATION, VERIFICATION_LABEL[c.verification], AUDIT_FULL_VERIFICATION_TONE[c.verification]),
    ];
  });

  readonly documents = computed<readonly KvRow[]>(() =>
    this.record().documents.map((d) => kv(DOCUMENT_SOURCE_LABEL[d.source], DOCUMENT_LABEL[d.kind])),
  );

  readonly plotRows = computed<readonly KvRow[]>(() =>
    this.record().farm.plots.map((p) => kv(F.plot(p.id), p.areaAcres === null ? S.DASH : F.acre(p.areaAcres))),
  );

  readonly previous = computed<readonly PreviousView[]>(() =>
    this.record().previousAudits.map((p) => this.previousView(p)),
  );

  readonly evidence = computed<readonly EvidenceView[]>(() =>
    this.record().evidence.map((e) => this.evidenceView(e)),
  );

  readonly categories = computed<readonly CategoryView[]>(() => {
    const scores = this.record().categoryScores;
    return AUDIT_RATING_CATEGORIES.map((c) => {
      const score = scores.find((s) => s.code === c.code)?.score ?? null;
      return {
        code: c.code,
        label: c.label,
        score: score === null ? F.NOT_SCORED : F.categoryScore(score, c.maxScore),
      };
    });
  });

  readonly corrective = computed<readonly CorrectiveView[]>(() =>
    this.record().correctiveActions.map((c) => {
      const lines = [
        F.caSource(c.auditId, c.findingId),
        F.caCorrection(c.correction),
        F.caResponsible(c.responsible, formatAuditDate(c.dueOn)),
      ];
      if (c.completionEvidence !== null) lines.push(F.caEvidence(c.completionEvidence));
      if (c.reviewOutcome !== null) {
        lines.push(F.caReview(REVIEW_LABEL[c.reviewOutcome], c.closedOn === null ? null : formatAuditDate(c.closedOn)));
      }
      return {
        id: c.id,
        pillLabel: CA_STATUS_LABEL[c.status],
        pillClass: auditToneClass(AUDIT_CORRECTIVE_STATUS_TONE[c.status], true),
        lines,
      };
    }),
  );

  readonly redFlagOpen = signal(false);
  private readonly localFlagState = signal<LocalRedFlag | null>(null);

  /** The local red-flag for THIS audit, if one was confirmed on this page. */
  readonly localFlag = computed(() => {
    const flag = this.localFlagState();
    return flag !== null && flag.auditId === this.auditId() ? flag : null;
  });

  readonly isFlagged = computed(() => this.record().redFlag.flagged || this.localFlag() !== null);

  readonly flagMessage = computed(() => (this.localFlag() === null ? '' : F.RF_DONE_DEMO));

  readonly redFlagRows = computed<readonly KvRow[]>(() => {
    const r = this.record().redFlag;
    const local = this.localFlag();
    const flagged = r.flagged || local !== null;
    const reason = local?.reason ?? r.reason;
    const actionBy = local === null ? r.actionBy : AUDIT_RED_FLAG_DEMO_ACTOR;
    const at = local === null ? r.at : AUDIT_RED_FLAG_DEMO_AT;
    return [
      flagged ? kv(F.RF_STATUS, F.RF_FLAGGED, 'danger') : kv(F.RF_STATUS, F.RF_NOT_FLAGGED),
      kv(F.RF_REASON, reason ?? S.DASH),
      kv(F.RF_ACTION_BY, actionBy ?? S.DASH),
      kv(F.RF_TIMESTAMP, at === null ? S.DASH : formatAuditDateTime24(at)),
      kv(F.RF_MINOR, String(r.minorFindings)),
      kv(F.RF_MAJOR, String(r.majorFindings)),
    ];
  });

  readonly activity = computed<readonly ActivityView[]>(() => {
    const entries = this.record().activity.map((t) => this.activityView(t));
    const local = this.localFlag();
    if (local === null) return entries;
    const findings: string[] = [];
    if (local.minor) findings.push(F.RF_FINDING_MINOR);
    if (local.major) findings.push(F.RF_FINDING_MAJOR);
    // Newest first, as the mock feed is ordered.
    return [
      {
        when: F.activityWhen(formatAuditDateTime24(AUDIT_RED_FLAG_DEMO_AT), AUDIT_RED_FLAG_DEMO_ACTOR),
        title: F.RF_ACTIVITY_TITLE,
        description: F.rfActivityDescription(findings, local.reason),
      },
      ...entries,
    ];
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  openRedFlag(): void {
    this.redFlagOpen.set(true);
  }

  onRedFlagConfirmed(result: AuditRedFlagConfirmation): void {
    this.localFlagState.set({ ...result, auditId: this.auditId() });
    this.redFlagOpen.set(false);
    // The opener (the Red-flag button) is removed once flagged, so DialogFocusDirective cannot
    // return focus to it; move focus to the card heading after the re-render instead.
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('[id="adf-flag"]')?.focus());
  }

  private previousView(p: AuditFullPreviousAudit): PreviousView {
    const band =
      p.totalScore === null
        ? undefined
        : AUDIT_TIER_BANDS.find((b) => p.totalScore !== null && p.totalScore >= b.minScore && p.totalScore <= b.maxScore);
    return {
      id: p.id,
      title: F.previousTitle(p.id, AUDIT_TYPE_LABEL[p.type]),
      meta: F.previousMeta(formatAuditDate(p.date), p.majorFindings, p.minorFindings),
      completion: F.previousCompletion(p.completionAuditOn === null ? null : formatAuditDate(p.completionAuditOn)),
      score: p.totalScore === null ? null : F.previousScore(p.totalScore, MAX_TOTAL),
      scoreClass: band === undefined ? '' : `tone-fg-${band.tone}`,
    };
  }

  private evidenceView(e: AuditFullEvidence): EvidenceView {
    const label =
      e.kind === 'FMB_SKETCH'
        ? F.EVIDENCE_FMB_SKETCH
        : F.evidenceCertificate(this.record().certification?.type ?? null);
    return { label, state: e.onFile ? F.ON_FILE : F.NOT_ON_FILE, viewLabel: F.viewLabel(label) };
  }

  private activityView(t: AuditFullActivity): ActivityView {
    let description = t.remark ?? '';
    if (description === '' && t.scheduledFor !== null) {
      description = F.activityScheduledFor(formatAuditDate(t.scheduledFor));
    }
    return {
      when: F.activityWhen(formatAuditDateTime24(t.at), t.actor),
      title: auditStatusLabel(t.status),
      description,
    };
  }
}
