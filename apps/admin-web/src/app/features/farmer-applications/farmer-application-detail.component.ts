/**
 * Farmers Management → Farmer Applications → Application Review (SA-M3-S016a/b, designs 55–59).
 *
 * UI-ONLY by explicit request: this screen makes NO API calls. The record comes from the static
 * placeholder data in farmer-application-review.mock.ts (keyed by application code, with a generic
 * fallback so the page never errors) and every action — Mark Verified, Request More Information,
 * Save Progress, Approve, Reject, Schedule Audit — only updates the record held on this screen.
 * Reloading the page restores the mock data. When the screen is integrated, the contract is
 * GET/POST /v1/admin/farmer-applications/{id}/… in docs/openapi.yaml (see
 * farmer-application-review.service.ts, deliberately left unused here).
 *
 * Permissions: with no API there is nothing to authorize against, so this preview treats the
 * viewer as holding every review permission (farmer.application.approve / reject / request_info /
 * verify_document / verify_fmb / add_note, audit.schedule). Restore the `rbac.canMutate(...)`
 * gates per action when integrating — and remember the API re-checks each one.
 *
 * Which layout shows is decided from the record:
 *
 *   status                                    | layout
 *   ------------------------------------------+-------------------------------------------------
 *   Pending Review, Request Document, On Hold | 'pending' (design 55/56) while identity proof,
 *                                             |   land proof or the FMB sketch is unverified
 *   same statuses, those three verified       | 'ready'   (design 57)
 *   Approved and the audit stages after it,   | 'decided' (design 58); Schedule Audit only while
 *   Rejected                                  |   Approved; Rejected shows its reason
 *
 * Bank details are shown and can be verified but never block approval (design 58 approves with
 * them Pending). Dates are formatted in UTC so a value never shifts a day between viewers.
 */
import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DialogFocusDirective } from '../farmers/dialog-focus.directive';
import {
  FarmerApplicationScheduleAuditDialogComponent,
  type LocalAuditScheduled,
} from './farmer-application-schedule-audit-dialog.component';
import {
  MOCK_DECISION_DATE,
  mockApplicationReview,
  type MockApplicationReview,
  type MockDocKind,
  type MockHistoryItem,
  type MockInfoItem,
  type MockRejectCode,
  type MockReviewDocument,
  type MockReviewState,
  type MockReviewStatus,
} from './farmer-application-review.mock';
import { APPLICATION_REVIEW_STRINGS as S } from './farmer-application-review.strings';

type Layout = 'pending' | 'ready' | 'decided';
type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
interface Pill {
  label: string;
  tone: Tone;
}

const DOC_TITLE: Record<MockDocKind, string> = {
  IDENTITY: S.DOC_IDENTITY,
  LAND: S.DOC_LAND,
  BANK: S.DOC_BANK,
};

const DOC_ICON: Record<MockDocKind, string> = {
  IDENTITY: 'badge',
  LAND: 'description',
  BANK: 'account_balance',
};

const STATUS_LABEL: Record<MockReviewStatus, string> = {
  PENDING_REVIEW: S.STATUS_PENDING_REVIEW,
  REQUEST_DOCUMENT: S.STATUS_REQUEST_DOCUMENT,
  ON_HOLD: S.STATUS_ON_HOLD,
  APPROVED: S.STATUS_APPROVED,
  AUDIT_SCHEDULED: S.STATUS_AUDIT_SCHEDULED,
  AUDIT_IN_PROGRESS: S.STATUS_AUDIT_IN_PROGRESS,
  AUDIT_COMPLETED: S.STATUS_AUDIT_COMPLETED,
  FINAL_APPROVED: S.STATUS_FINAL_APPROVED,
  REJECTED: S.STATUS_REJECTED,
};

const STATUS_TONE: Record<MockReviewStatus, Tone> = {
  PENDING_REVIEW: 'warning',
  REQUEST_DOCUMENT: 'info',
  ON_HOLD: 'neutral',
  APPROVED: 'success',
  AUDIT_SCHEDULED: 'success',
  AUDIT_IN_PROGRESS: 'success',
  AUDIT_COMPLETED: 'success',
  FINAL_APPROVED: 'success',
  REJECTED: 'danger',
};

/** Statuses that are still awaiting a decision. Everything else is 'decided'. */
const UNDECIDED: ReadonlySet<MockReviewStatus> = new Set<MockReviewStatus>(['PENDING_REVIEW', 'REQUEST_DOCUMENT', 'ON_HOLD']);

const STATE_PILL: Record<MockReviewState, Pill> = {
  PENDING: { label: S.PILL_PENDING, tone: 'warning' },
  VERIFIED: { label: S.PILL_VERIFIED, tone: 'success' },
  MISSING: { label: S.PILL_MISSING, tone: 'danger' },
};

/** The design's five chips. */
const INFO_CHIPS: ReadonlyArray<{ item: MockInfoItem; label: string }> = [
  { item: 'IDENTITY', label: S.RI_CHIP_IDENTITY },
  { item: 'FMB', label: S.RI_CHIP_FMB },
  { item: 'LAND', label: S.RI_CHIP_LAND },
  { item: 'BANK', label: S.RI_CHIP_BANK },
  { item: 'OTHER', label: S.RI_CHIP_OTHER },
];

const REJECT_CODES: ReadonlyArray<{ code: MockRejectCode; label: string }> = [
  { code: 'DOCUMENTS_INVALID', label: S.REASON_DOCUMENTS_INVALID },
  { code: 'LAND_NOT_VERIFIED', label: S.REASON_LAND_NOT_VERIFIED },
  { code: 'DUPLICATE_APPLICANT', label: S.REASON_DUPLICATE_APPLICANT },
  { code: 'OUTSIDE_SERVICE_AREA', label: S.REASON_OUTSIDE_SERVICE_AREA },
  { code: 'OTHER', label: S.REASON_OTHER },
];

/** Form bounds kept from docs/openapi.yaml (message 5..1000, reject reason 5..500); notes 500 per design 57. */
const MESSAGE_MIN = 5;
const MESSAGE_MAX = 1000;
const NOTE_MAX = 500;
const REJECT_MAX = 500;
const APPROVE_NOTE_MAX = 500;

interface DocRowVm {
  kind: MockDocKind;
  title: string;
  icon: string;
  /** Pending table "Details" column. */
  details: string;
  /** Ready / decided list sub-line. */
  subline: string;
  submitted: string;
  pill: Pill;
  doc: MockReviewDocument;
}

interface RequirementVm {
  label: string;
  pill: Pill;
}

function fmtDate(value: string | null | undefined): string {
  return value ? formatDate(value, 'dd MMM yyyy', 'en-US', 'UTC') : S.DASH;
}

function fmtStamp(value: string): string {
  return formatDate(value, 'd MMM yyyy, HH:mm', 'en-US', 'UTC');
}

function joinPhrases(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

function capitalise(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

@Component({
  selector: 'tohfa-farmer-application-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DialogFocusDirective, FarmerApplicationScheduleAuditDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .material-symbols-outlined {
        font-size: var(--icon-btn);
      }
      .back {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-8);
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
        color: var(--tohfa-slate);
        text-decoration: none;
      }
      .back:hover {
        color: var(--tohfa-ink);
      }
      .page-title {
        margin: 0;
        font-size: var(--fs-title);
        font-weight: var(--fw-bold);
      }
      .page-sub {
        margin: var(--space-4) 0 var(--space-18);
        font-size: var(--fs-body);
        color: var(--tohfa-slate);
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }
      .muted {
        color: var(--tohfa-muted);
      }

      /* ---------- Header card ---------- */
      .head-card {
        display: flex;
        align-items: center;
        gap: var(--space-16);
        flex-wrap: wrap;
        margin-bottom: var(--space-16);
      }
      .avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        flex: none;
        border-radius: var(--r-circle);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-page);
        font-weight: var(--fw-bold);
      }
      .who {
        flex: 1 1 220px;
        min-width: 0;
      }
      .who h2 {
        margin: 0;
        font-size: var(--fs-page);
        font-weight: var(--fw-bold);
      }
      .app-id {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        margin-top: var(--space-4);
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .icon-btn {
        display: inline-flex;
        padding: 2px;
        border: none;
        border-radius: var(--r-xs);
        background: transparent;
        color: var(--tohfa-slate);
        cursor: pointer;
      }
      .icon-btn .material-symbols-outlined {
        font-size: var(--icon-row-action);
      }
      .icon-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .head-blocks {
        display: flex;
        align-items: center;
        gap: var(--space-24);
        flex-wrap: wrap;
      }
      .hb {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-6);
        margin: 0;
      }
      .hb dt {
        font-size: var(--fs-label);
        color: var(--tohfa-muted);
      }
      .hb dd {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        margin: 0;
        font-size: var(--fs-body);
        font-weight: var(--fw-bold);
      }
      .hb dd .material-symbols-outlined {
        font-size: var(--icon-row-action);
        color: var(--tohfa-slate);
      }
      .leaf {
        color: var(--ok);
      }
      .hb dd .leaf .material-symbols-outlined,
      .leaf .material-symbols-outlined {
        color: var(--ok);
      }
      .state-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: var(--space-10) var(--space-16);
        border-radius: var(--r-sm);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .state-block small {
        font-size: var(--fs-label);
        font-weight: var(--fw-semi);
      }
      .state-block .row {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
      }
      .state-success {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .state-danger {
        background: var(--err-bg);
        color: var(--err);
      }
      .dot::before {
        content: '•';
        margin-right: var(--space-4);
      }

      /* ---------- Grid & cards ---------- */
      .cols {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: var(--space-16);
        align-items: start;
      }
      @media (max-width: 1000px) {
        .cols {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: var(--space-16);
        min-width: 0;
      }
      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0 0 var(--space-14);
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .card-title .material-symbols-outlined {
        font-size: var(--icon-nav);
        color: var(--tohfa-amber);
      }
      .card-title.history {
        color: var(--tohfa-amber);
      }

      /* Label/value rows (design 55 card 01, design 57/58 "Farming") */
      .kv {
        margin: 0;
      }
      .kv-row {
        display: flex;
        justify-content: space-between;
        gap: var(--space-12);
        padding: var(--space-6) 0;
        font-size: var(--fs-cell);
      }
      .kv-row dt {
        color: var(--tohfa-slate);
      }
      .kv-row dd {
        margin: 0;
        font-weight: var(--fw-bold);
        text-align: right;
      }
      /* Stacked label-over-value grid (design 55 cards 02/03, design 57 card 01) */
      .grid {
        display: grid;
        grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr));
        gap: var(--space-14) var(--space-16);
        margin: 0;
      }
      .grid.four {
        --cols: 4;
      }
      @media (max-width: 720px) {
        .grid,
        .grid.four {
          --cols: 2;
        }
      }
      .grid dt {
        font-size: var(--fs-label);
        color: var(--tohfa-muted);
        margin-bottom: var(--space-4);
      }
      .grid dd {
        margin: 0;
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        overflow-wrap: anywhere;
      }
      .note {
        margin-top: var(--space-4);
        font-size: var(--fs-label);
        font-weight: var(--fw-medium);
        color: var(--tohfa-slate);
      }

      /* ---------- FMB rows ---------- */
      .file-row {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        margin-top: var(--space-12);
        padding: var(--space-10) var(--space-12);
        border-radius: var(--r-sm);
        background: var(--tohfa-page);
        flex-wrap: wrap;
      }
      .file-row > .material-symbols-outlined {
        color: var(--err);
      }
      .file-meta {
        flex: 1 1 160px;
        min-width: 0;
      }
      .file-meta small {
        display: block;
        font-size: var(--fs-label);
        color: var(--tohfa-muted);
      }
      .file-meta strong {
        font-size: var(--fs-cell);
      }
      .actions {
        display: inline-flex;
        gap: var(--space-8);
        flex-wrap: wrap;
      }

      /* ---------- KYC table (design 55) ---------- */
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--fs-cell);
      }
      th {
        padding: var(--space-8) var(--space-6);
        text-align: left;
        font-size: var(--fs-label);
        font-weight: var(--fw-semi);
        color: var(--tohfa-slate);
        border-bottom: var(--border-divider);
      }
      td {
        padding: var(--space-10) var(--space-6);
        border-bottom: var(--border-divider);
        vertical-align: middle;
      }
      tr:last-child td {
        border-bottom: none;
      }
      .doc-name {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
      }
      .doc-name .material-symbols-outlined {
        color: var(--tohfa-slate);
      }
      .btn-xs {
        padding: 6px 10px;
        font-size: var(--fs-label);
        min-height: 32px;
      }

      /* ---------- KYC rows (design 57/58) ---------- */
      .doc-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-12);
      }
      .doc-item {
        display: flex;
        align-items: center;
        gap: var(--space-12);
        flex-wrap: wrap;
      }
      .tile {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        flex: none;
        border-radius: var(--r-sm);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
      }
      .doc-text {
        flex: 1 1 160px;
        min-width: 0;
      }
      .doc-text strong {
        display: block;
        font-size: var(--fs-cell);
      }
      .doc-text small {
        font-size: var(--fs-label);
        color: var(--tohfa-muted);
      }

      /* ---------- Notes, banners ---------- */
      .info,
      .banner {
        display: flex;
        gap: var(--space-8);
        align-items: flex-start;
        margin-top: var(--space-14);
        padding: var(--space-10) var(--space-12);
        border-radius: var(--r-sm);
        font-size: var(--fs-dense);
        line-height: 1.45;
      }
      .info {
        background: var(--info-bg);
        color: var(--info);
      }
      .banner {
        margin: 0 0 var(--space-14);
      }
      .banner-danger {
        background: var(--err-bg);
        color: var(--err);
      }
      .banner-success {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .banner strong {
        font-weight: var(--fw-bold);
      }

      /* ---------- Request info ---------- */
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-8);
      }
      .chip {
        padding: 7px 12px;
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-sm);
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        font-family: var(--font);
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
        cursor: pointer;
      }
      .chip[aria-pressed='true'] {
        background: var(--tohfa-amber-tint);
        border-color: var(--tohfa-amber);
        color: var(--tohfa-brown);
      }
      .chip:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .chip:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      .group {
        margin: 0 0 var(--space-14);
        padding: 0;
        border: none;
      }
      .group legend {
        padding: 0;
      }
      textarea.tohfa-input {
        min-height: 92px;
        resize: vertical;
      }
      .error {
        margin: var(--space-6) 0 0;
        font-size: var(--fs-dense);
        color: var(--err);
      }
      .counter {
        margin-top: var(--space-4);
        text-align: right;
        font-size: var(--fs-label);
        color: var(--tohfa-muted);
      }
      .block-btn {
        width: 100%;
        min-height: var(--tohfa-min-touch-target);
        margin-top: var(--space-14);
      }
      .advance-btn {
        margin: 0 0 var(--space-14);
      }
      .row-head {
        padding: var(--space-10) var(--space-6);
        font-size: var(--fs-cell);
        font-weight: var(--fw-regular);
        color: var(--tohfa-ink);
        border-bottom: var(--border-divider);
      }
      tr:last-child .row-head {
        border-bottom: none;
      }
      .doc-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .field + .field {
        margin-top: var(--space-14);
      }

      /* ---------- Requirements ---------- */
      .req-box {
        padding: var(--space-14);
        border-radius: var(--r-sm);
        background: var(--tohfa-page);
        margin-bottom: var(--space-14);
      }
      .req-box h4 {
        margin: 0 0 var(--space-8);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .req-list {
        list-style: none;
        margin: 0 0 var(--space-14);
        padding: 0;
      }
      .req-box .req-list {
        margin: 0;
      }
      .req-list li {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        padding: var(--space-6) 0;
        font-size: var(--fs-cell);
      }
      .req-list li span.text {
        flex: 1;
      }
      .ic-success {
        color: var(--ok);
      }
      .ic-warning {
        color: var(--warn);
      }
      .ic-danger {
        color: var(--err);
      }
      .ic-neutral {
        color: var(--tohfa-muted);
      }
      .readonly-box {
        min-height: 60px;
        padding: var(--space-10) var(--space-12);
        border: var(--border-input);
        border-radius: var(--r-tab);
        font-size: var(--fs-cell);
        white-space: pre-wrap;
      }
      .readonly-box p {
        margin: 0;
      }
      .readonly-box p + p {
        margin-top: var(--space-8);
      }

      /* ---------- History ---------- */
      .history-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-8);
      }
      .history-item {
        padding: var(--space-10) var(--space-12);
        border-radius: var(--r-sm);
        background: var(--tohfa-page);
        font-size: var(--fs-dense);
      }
      .history-item.ok {
        background: var(--ok-bg);
      }
      .history-item.bad {
        background: var(--err-bg);
      }
      .history-item .when {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        color: var(--tohfa-slate);
      }
      .history-item .when .material-symbols-outlined {
        font-size: var(--icon-row-action);
      }
      .history-item strong {
        display: block;
        margin-top: var(--space-4);
        font-size: var(--fs-cell);
      }
      .history-item.ok strong {
        color: var(--ok);
      }
      .history-item.bad strong {
        color: var(--err);
      }
      .history-item p {
        margin: var(--space-4) 0 0;
        color: var(--tohfa-slate);
      }

      /* ---------- Footer ---------- */
      .footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-12);
        margin-top: var(--space-18);
        flex-wrap: wrap;
      }
      .footer .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        min-width: 200px;
      }
      .btn-reject {
        background: var(--tohfa-surface);
        color: var(--err);
        border: 1px solid var(--err);
        border-radius: var(--r-md);
        padding: 12px 26px;
        font-size: var(--fs-button-l);
      }
      .btn-reject:hover:not(:disabled) {
        background: var(--err-bg);
      }
      .btn-outline-full {
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-md);
        padding: 10px 16px;
        font-size: var(--fs-cell);
      }
      .btn-outline-full:hover:not(:disabled) {
        background: var(--tohfa-page);
      }
      .msg {
        margin: 0 0 var(--space-12);
        padding: var(--space-10) var(--space-12);
        border-radius: var(--r-sm);
        font-size: var(--fs-dense);
      }
      .msg-ok {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .msg-err {
        background: var(--err-bg);
        color: var(--err);
      }
      .msg:empty {
        display: none;
      }

      /* ---------- Modals ---------- */
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
      .modal {
        width: 100%;
        max-width: 480px;
        padding: var(--space-24);
        border-radius: var(--r-dialog);
        background: var(--tohfa-surface);
        box-shadow: var(--shadow-dialog);
      }
      .modal h2 {
        margin: 0 0 var(--space-6);
        font-size: var(--fs-title-dialog);
        font-weight: var(--fw-bold);
      }
      .modal > p {
        margin: 0 0 var(--space-14);
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-8);
        margin-top: var(--space-18);
      }
      .modal-actions .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
      }
    `,
  ],
  template: `
    <a class="back" routerLink="/farmer-applications">
      <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>{{ S.BACK }}
    </a>
    <h1 class="page-title">{{ S.TITLE }}</h1>
    <p class="page-sub">{{ S.SUBTITLE }}</p>

    <!-- Polite live region for outcomes; errors use role=alert below. -->
    <p class="sr-only" aria-live="polite">{{ statusMsg() }}</p>

    <ng-container *ngIf="app() as a">
      <p class="msg msg-ok" *ngIf="statusMsg()">{{ statusMsg() }}</p>
      <p class="msg msg-err" *ngIf="errorMsg()" role="alert">{{ errorMsg() }}</p>

      <!-- ================= Header ================= -->
      <section class="tohfa-card head-card" aria-labelledby="applicant-name">
        <span class="avatar" aria-hidden="true">{{ initials() }}</span>
        <div class="who">
          <h2 id="applicant-name" tabindex="-1">{{ a.fullName }}</h2>
          <span class="app-id">
            {{ S.APPLICATION_ID }}: {{ a.applicationCode }}
            <button type="button" class="icon-btn" (click)="copyId()" [attr.aria-label]="S.COPY_ID" [title]="S.COPY_ID">
              <span class="material-symbols-outlined" aria-hidden="true">content_copy</span>
            </button>
          </span>
        </div>

        <dl class="head-blocks" *ngIf="layout() === 'pending'">
          <div class="hb">
            <dt>{{ S.HEAD_STATUS }}</dt>
            <dd><span class="tohfa-badge tohfa-badge-lg dot" [ngClass]="'tohfa-badge-' + statusTone()">{{ statusLabel() }}</span></dd>
          </div>
          <div class="hb">
            <dt>{{ S.HEAD_ZONE }}</dt>
            <dd><span class="material-symbols-outlined" aria-hidden="true">location_on</span>{{ a.zone }}</dd>
          </div>
          <div class="hb">
            <dt>{{ S.HEAD_METHOD }}</dt>
            <dd class="leaf"><span class="material-symbols-outlined" aria-hidden="true">eco</span>{{ a.farmingMethod }}</dd>
          </div>
          <div class="hb">
            <dt>{{ S.HEAD_SUBMITTED_ON }}</dt>
            <dd><span class="material-symbols-outlined" aria-hidden="true">calendar_today</span>{{ submittedOn() }}</dd>
          </div>
        </dl>

        <dl class="head-blocks" *ngIf="layout() !== 'pending'">
          <div class="hb">
            <dt class="sr-only">{{ S.HEAD_STATUS }}</dt>
            <dd>
              <span class="state-block" [ngClass]="a.status === 'REJECTED' ? 'state-danger' : 'state-success'">
                <span class="row">
                  <span class="material-symbols-outlined" aria-hidden="true">{{ a.status === 'REJECTED' ? 'cancel' : 'check_circle' }}</span>
                  {{ layout() === 'ready' ? S.DOCS_COMPLETE : statusLabel() }}
                </span>
                <small *ngIf="layout() === 'ready'">{{ S.READY_FOR_APPROVAL }}</small>
              </span>
            </dd>
          </div>
          <div class="hb">
            <dt>{{ S.HEAD_SUBMITTED }}</dt>
            <dd><span class="material-symbols-outlined" aria-hidden="true">calendar_today</span>{{ submittedOn() }}</dd>
          </div>
          <div class="hb">
            <dt>{{ a.status === 'REJECTED' ? S.HEAD_REJECTED : S.HEAD_APPROVED }}</dt>
            <dd>
              <span class="material-symbols-outlined" aria-hidden="true" *ngIf="a.decidedAt">calendar_today</span>{{ decidedOn() }}
            </dd>
          </div>
          <div class="hb">
            <dt>{{ S.HEAD_ZONE }}</dt>
            <dd><span class="material-symbols-outlined" aria-hidden="true">location_on</span>{{ a.zone }}</dd>
          </div>
        </dl>
      </section>

      <!-- ================= PENDING (design 55/56) ================= -->
      <div class="cols" *ngIf="layout() === 'pending'">
        <div class="col">
          <section class="tohfa-card" aria-labelledby="c-applicant">
            <h3 class="card-title" id="c-applicant">
              <span class="material-symbols-outlined" aria-hidden="true">person</span>01 {{ S.CARD_APPLICANT_DETAILS }}
            </h3>
            <dl class="kv">
              <div class="kv-row"><dt>{{ S.F_NAME }}</dt><dd>{{ a.fullName }}</dd></div>
              <div class="kv-row"><dt>{{ S.F_PHONE }}</dt><dd>{{ a.phone }}</dd></div>
              <div class="kv-row"><dt>{{ S.F_ADDRESS }}</dt><dd>{{ a.address }}</dd></div>
              <div class="kv-row"><dt>{{ S.F_SUBMITTED }}</dt><dd>{{ submittedOn() }}</dd></div>
            </dl>
          </section>

          <ng-container *ngTemplateOutlet="farmCard; context: { $implicit: '02', compact: true }"></ng-container>

          <section class="tohfa-card" aria-labelledby="c-farming">
            <h3 class="card-title" id="c-farming">
              <span class="material-symbols-outlined" aria-hidden="true">eco</span>03 {{ S.CARD_FARMING_DETAILS }}
            </h3>
            <dl class="grid">
              <div><dt>{{ S.F_FARMING_TYPE }}</dt><dd>{{ a.farmingMethod }}</dd></div>
              <div><dt>{{ S.F_CROPS }}</dt><dd>{{ a.crops }}</dd></div>
            </dl>
          </section>

          <section class="tohfa-card" aria-labelledby="c-kyc">
            <h3 class="card-title" id="c-kyc">
              <span class="material-symbols-outlined" aria-hidden="true">description</span>04 {{ S.CARD_KYC }}
            </h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">{{ S.COL_DOCUMENT }}</th>
                  <th scope="col">{{ S.COL_DETAILS }}</th>
                  <th scope="col">{{ S.COL_SUBMITTED_ON }}</th>
                  <th scope="col">{{ S.COL_STATUS }}</th>
                  <th scope="col">{{ S.COL_ACTION }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of docRows(); trackBy: trackRow">
                  <th scope="row" class="row-head">
                    <span class="doc-name"><span class="material-symbols-outlined" aria-hidden="true">{{ row.icon }}</span>{{ row.title }}</span>
                  </th>
                  <td>{{ row.details }}</td>
                  <td>{{ row.submitted }}</td>
                  <td><span class="tohfa-badge" [ngClass]="'tohfa-badge-' + row.pill.tone">{{ row.pill.label }}</span></td>
                  <td>
                    <span class="actions">
                      <button
                        *ngIf="row.doc.status !== 'MISSING'"
                        type="button"
                        class="tohfa-btn tohfa-btn-secondary btn-xs"
                        [attr.aria-label]="S.PREVIEW + ' ' + row.title"
                        (click)="filePlaceholder(row.title)"
                      >{{ S.PREVIEW }}</button>
                      <button
                        *ngIf="row.doc.status === 'PENDING'"
                        type="button"
                        class="tohfa-btn tohfa-btn-outline-amber btn-xs"
                        [attr.aria-label]="S.MARK_VERIFIED + ' ' + row.title"
                        (click)="verifyDocument(row.kind)"
                      >{{ S.MARK_VERIFIED }}</button>
                      <span *ngIf="row.doc.status === 'MISSING'" class="muted">{{ S.DASH }}</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="info">
              <span class="material-symbols-outlined" aria-hidden="true">info</span>
              <span>{{ S.DOC_NOTE_PENDING }}</span>
            </div>
          </section>
        </div>

        <div class="col">
          <section class="tohfa-card" aria-labelledby="c-request">
            <h3 class="card-title" id="c-request">
              <span class="material-symbols-outlined" aria-hidden="true">mail</span>05 {{ S.CARD_REQUEST_INFO }}
            </h3>
            <p class="banner banner-success" *ngIf="a.infoRequest">
              <span class="material-symbols-outlined" aria-hidden="true">schedule_send</span>
              <span>{{ S.RI_OPEN(formatDay(a.infoRequest.requestedAt)) }}</span>
            </p>
            <fieldset class="group" [attr.aria-describedby]="riTouched() && riItems().length === 0 ? 'ri-items-err' : null">
              <legend class="tohfa-label tohfa-label-required">{{ S.RI_WHAT_MISSING }}</legend>
              <div class="chips">
                <button
                  *ngFor="let chip of infoChips"
                  type="button"
                  class="chip"
                  [attr.aria-pressed]="riItems().includes(chip.item)"
                  (click)="toggleChip(chip.item)"
                >{{ chip.label }}</button>
              </div>
              <p class="error" id="ri-items-err" *ngIf="riTouched() && riItems().length === 0">{{ S.RI_ERR_ITEMS }}</p>
            </fieldset>
            <div class="field">
              <label class="tohfa-label tohfa-label-required" for="ri-message">{{ S.RI_MESSAGE }}</label>
              <textarea
                id="ri-message"
                class="tohfa-input"
                [placeholder]="S.RI_PLACEHOLDER"
                [maxLength]="messageMax"
                [(ngModel)]="riMessage"
                [attr.aria-invalid]="riTouched() && riMessage.trim().length < messageMin"
                [attr.aria-describedby]="riTouched() && riMessage.trim().length < messageMin ? 'ri-msg-err' : null"
              ></textarea>
              <p class="error" id="ri-msg-err" *ngIf="riTouched() && riMessage.trim().length < messageMin">{{ S.RI_ERR_MESSAGE }}</p>
            </div>
            <div class="info">
              <span class="material-symbols-outlined" aria-hidden="true">info</span>
              <span>{{ S.RI_NOTE }}</span>
            </div>
            <button type="button" class="tohfa-btn tohfa-btn-primary-l block-btn" (click)="sendRequestInfo()">
              <span class="material-symbols-outlined" aria-hidden="true">send</span>{{ S.RI_SEND }}
            </button>
          </section>

          <section class="tohfa-card" aria-labelledby="c-decision">
            <h3 class="card-title" id="c-decision">
              <span class="material-symbols-outlined" aria-hidden="true">gavel</span>06 {{ S.CARD_DECISION }}
            </h3>
            <p class="banner banner-danger" *ngIf="blockedSentence()" id="blocked-msg">
              <span class="material-symbols-outlined" aria-hidden="true">warning</span>
              <span><strong>{{ S.BLOCKED_PREFIX }}</strong> {{ blockedSentence() }}</span>
            </p>
            <ng-container *ngTemplateOutlet="notesEditor"></ng-container>
          </section>

          <ng-container *ngTemplateOutlet="historyCard"></ng-container>
        </div>
      </div>

      <!-- ================= READY (design 57) and DECIDED (design 58) ================= -->
      <div class="cols" *ngIf="layout() !== 'pending'">
        <div class="col">
          <section class="tohfa-card" aria-labelledby="c-applicant2">
            <h3 class="card-title" id="c-applicant2">
              <span class="material-symbols-outlined" aria-hidden="true">person</span>01 · {{ S.CARD_APPLICANT }}
            </h3>
            <dl class="grid" *ngIf="layout() === 'ready'">
              <div><dt>{{ S.F_NAME }}</dt><dd>{{ a.fullName }}</dd></div>
              <div><dt>{{ S.F_ZONE }}</dt><dd>{{ a.zone }}</dd></div>
              <div><dt>{{ S.F_PHONE }}</dt><dd>{{ a.phone }}</dd></div>
              <div><dt>{{ S.F_APPLICATION_ID }}</dt><dd>{{ a.applicationCode }}</dd></div>
              <div><dt>{{ S.F_ADDRESS }}</dt><dd>{{ a.address }}</dd></div>
              <div><dt>{{ S.F_SUBMITTED }}</dt><dd>{{ submittedOn() }}</dd></div>
            </dl>
            <dl class="kv" *ngIf="layout() === 'decided'">
              <div class="kv-row"><dt>{{ S.F_NAME }}</dt><dd>{{ a.fullName }}</dd></div>
              <div class="kv-row"><dt>{{ S.F_PHONE }}</dt><dd>{{ a.phone }}</dd></div>
              <div class="kv-row"><dt>{{ S.F_ADDRESS }}</dt><dd>{{ a.address }}</dd></div>
              <div class="kv-row"><dt>{{ S.F_ZONE }}</dt><dd>{{ a.zone }}</dd></div>
              <div class="kv-row"><dt>{{ S.F_APPLICATION_ID }}</dt><dd>{{ a.applicationCode }}</dd></div>
              <div class="kv-row">
                <dt>{{ S.F_APPLICATION_STATUS }}</dt>
                <dd><span class="tohfa-badge" [ngClass]="'tohfa-badge-' + statusTone()">{{ statusLabel() }}</span></dd>
              </div>
              <div class="kv-row"><dt>{{ S.F_SUBMITTED }}</dt><dd>{{ submittedOn() }}</dd></div>
              <div class="kv-row">
                <dt>{{ a.status === 'REJECTED' ? S.HEAD_REJECTED : S.F_APPROVED }}</dt><dd>{{ decidedOn() }}</dd>
              </div>
            </dl>
          </section>

          <ng-container *ngTemplateOutlet="farmCard; context: { $implicit: '02 ·', compact: false }"></ng-container>

          <section class="tohfa-card" aria-labelledby="c-kyc2">
            <h3 class="card-title" id="c-kyc2">
              <span class="material-symbols-outlined" aria-hidden="true">description</span>03 · {{ S.CARD_KYC }}
            </h3>
            <ul class="doc-list">
              <li class="doc-item" *ngFor="let row of docRows(); trackBy: trackRow">
                <span class="tile" aria-hidden="true"><span class="material-symbols-outlined">{{ row.icon }}</span></span>
                <span class="doc-text">
                  <strong>{{ row.title }}</strong>
                  <small>{{ row.subline }}</small>
                </span>
                <span class="tohfa-badge" [ngClass]="'tohfa-badge-' + row.pill.tone">
                  <span class="material-symbols-outlined" aria-hidden="true" *ngIf="row.pill.tone === 'success'" style="font-size: var(--icon-row-action)">check_circle</span>
                  {{ row.pill.label }}
                </span>
                <span class="actions" *ngIf="row.kind !== 'BANK' && row.doc.status !== 'MISSING'">
                  <button type="button" class="tohfa-btn tohfa-btn-outline-amber btn-xs" [attr.aria-label]="S.PREVIEW + ' ' + row.title" (click)="filePlaceholder(row.title)">
                    <span class="material-symbols-outlined" aria-hidden="true">visibility</span>{{ S.PREVIEW }}
                  </button>
                  <button type="button" class="tohfa-btn tohfa-btn-outline-amber btn-xs" [attr.aria-label]="S.DOWNLOAD + ' ' + row.title" (click)="filePlaceholder(row.title)">
                    <span class="material-symbols-outlined" aria-hidden="true">download</span>{{ S.DOWNLOAD }}
                  </button>
                </span>
                <span class="actions" *ngIf="row.kind === 'BANK' && row.doc.status === 'VERIFIED'">
                  <button type="button" class="tohfa-btn tohfa-btn-secondary btn-xs" (click)="filePlaceholder(row.title)">
                    <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>{{ S.VIEW_ACCOUNT }}
                  </button>
                </span>
                <span class="actions" *ngIf="row.doc.status === 'PENDING' && undecided()">
                  <button
                    type="button"
                    class="tohfa-btn tohfa-btn-outline-amber btn-xs"
                    [attr.aria-label]="S.MARK_VERIFIED + ' ' + row.title"
                    (click)="verifyDocument(row.kind)"
                  >{{ S.MARK_VERIFIED }}</button>
                </span>
              </li>
            </ul>
            <div class="info" *ngIf="layout() === 'ready'">
              <span class="material-symbols-outlined" aria-hidden="true">info</span>
              <span>{{ S.DOC_NOTE_COMPLETE }}</span>
            </div>
          </section>
        </div>

        <div class="col">
          <section class="tohfa-card" aria-labelledby="c-farming2">
            <h3 class="card-title" id="c-farming2">
              <span class="material-symbols-outlined" aria-hidden="true">eco</span>04 · {{ S.CARD_FARMING }}
            </h3>
            <dl class="kv">
              <div class="kv-row"><dt>{{ S.F_FARMING_TYPE }}</dt><dd>{{ a.farmingMethod }}</dd></div>
              <div class="kv-row"><dt>{{ S.F_CROPS }}</dt><dd>{{ a.crops }}</dd></div>
              <div class="kv-row"><dt>{{ S.F_DECLARATION }}</dt><dd>{{ a.declaration }}</dd></div>
            </dl>
          </section>

          <!-- design 57: Requirements for Approval -->
          <section class="tohfa-card" aria-labelledby="c-req" *ngIf="layout() === 'ready'">
            <h3 class="card-title" id="c-req">
              <span class="material-symbols-outlined" aria-hidden="true">fact_check</span>05 · {{ S.CARD_REQUIREMENTS }}
            </h3>
            <ng-container *ngTemplateOutlet="reqList"></ng-container>
            <p class="banner banner-success">
              <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
              <span><strong>{{ S.READY_TITLE }}</strong><br />{{ S.READY_BODY }}</span>
            </p>
            <ng-container *ngTemplateOutlet="notesEditor"></ng-container>
          </section>

          <!-- design 58: Decision (read-only) -->
          <section class="tohfa-card" aria-labelledby="c-dec2" *ngIf="layout() === 'decided'">
            <h3 class="card-title" id="c-dec2">
              <span class="material-symbols-outlined" aria-hidden="true">task_alt</span>05 · {{ S.CARD_DECISION }}
            </h3>
            <div class="req-box">
              <h4>{{ S.REQUIREMENTS_SUB }}</h4>
              <ng-container *ngTemplateOutlet="reqList"></ng-container>
            </div>
            <div class="field" *ngIf="a.status === 'REJECTED'">
              <span class="tohfa-label" id="ro-reason">{{ S.REJECTION_REASON }}</span>
              <div class="readonly-box" aria-labelledby="ro-reason"><p>{{ rejectionText() }}</p></div>
            </div>
            <div class="field">
              <span class="tohfa-label" id="ro-notes">{{ S.REVIEW_NOTES }}</span>
              <div class="readonly-box" aria-labelledby="ro-notes">
                <p *ngIf="a.reviewNotes">{{ a.reviewNotes }}</p>
                <p class="muted" *ngIf="!a.reviewNotes">{{ S.NOTES_EMPTY }}</p>
              </div>
            </div>
          </section>

          <ng-container *ngTemplateOutlet="historyCard"></ng-container>
        </div>
      </div>

      <!-- ================= Footer ================= -->
      <div class="footer">
        <!-- design 56: Approve (disabled while blocked) then Reject -->
        <ng-container *ngIf="layout() === 'pending'">
          <button
            type="button"
            class="tohfa-btn tohfa-btn-primary-l"
            [disabled]="!canApproveNow()"
            [title]="blockedSentence() ? S.BLOCKED_PREFIX + ' ' + blockedSentence() : ''"
            [attr.aria-describedby]="blockedSentence() ? 'blocked-msg' : null"
            (click)="showApprove.set(true)"
          >
            <span class="material-symbols-outlined" aria-hidden="true">check</span>{{ S.APPROVE }}
          </button>
          <button type="button" class="tohfa-btn btn-reject" (click)="openReject()">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>{{ S.REJECT }}
          </button>
        </ng-container>
        <!-- design 57: Reject then Approve Application -->
        <ng-container *ngIf="layout() === 'ready'">
          <button type="button" class="tohfa-btn btn-reject" (click)="openReject()">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>{{ S.REJECT }}
          </button>
          <button type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="showApprove.set(true)">
            <span class="material-symbols-outlined" aria-hidden="true">check</span>{{ S.APPROVE_APPLICATION }}
          </button>
        </ng-container>
        <button *ngIf="a.status === 'APPROVED'" type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="showSchedule.set(true)">
          <span class="material-symbols-outlined" aria-hidden="true">event_available</span>{{ S.SCHEDULE_AUDIT }}
        </button>
      </div>

      <!-- ================= Shared fragments ================= -->
      <ng-template #farmCard let-num let-compact="compact">
        <section class="tohfa-card" aria-labelledby="c-farm">
          <h3 class="card-title" id="c-farm">
            <span class="material-symbols-outlined" aria-hidden="true">{{ compact ? 'landscape' : 'location_on' }}</span>{{ num }} {{ S.CARD_FARM_LAND }}
          </h3>
          <dl class="grid" [class.four]="compact">
            <div><dt>{{ compact ? S.F_LOCATION : S.F_FARM_LOCATION }}</dt><dd>{{ a.farmLocation }}</dd></div>
            <div *ngIf="compact"><dt>{{ S.F_ZONE }}</dt><dd>{{ a.zoneCode }}</dd></div>
            <div><dt>{{ S.F_LAND_AREA }}</dt><dd>{{ a.landArea }}</dd></div>
            <div *ngIf="compact">
              <dt>{{ S.F_FMB_SKETCH }}</dt>
              <dd><span class="tohfa-badge" [ngClass]="'tohfa-badge-' + fmbPill().tone">{{ fmbPill().label }}</span></dd>
            </div>
            <div *ngIf="!compact"><dt>{{ S.F_AREA_TYPE }}</dt><dd>{{ a.areaType }}</dd></div>
          </dl>
          <!-- Design 55 shows only the pill while the sketch is missing; a submitted sketch gets a file row. -->
          <div class="file-row" *ngIf="!compact || a.fmb.status !== 'MISSING'">
            <span class="material-symbols-outlined" aria-hidden="true">map</span>
            <span class="file-meta">
              <small>{{ S.F_FMB_SKETCH }}</small>
              <strong>{{ a.fmb.fileName ? S.FMB_FILE(a.fmb.fileName, a.fmb.fileSize ?? S.DASH) : S.FMB_NOT_UPLOADED }}</strong>
            </span>
            <span class="tohfa-badge" *ngIf="compact || a.fmb.status !== 'VERIFIED'" [ngClass]="'tohfa-badge-' + fmbPill().tone">{{ fmbPill().label }}</span>
            <span class="actions" *ngIf="a.fmb.fileName">
              <button type="button" class="tohfa-btn tohfa-btn-outline-amber btn-xs" [attr.aria-label]="S.VIEW + ' ' + S.F_FMB_SKETCH" (click)="filePlaceholder(S.F_FMB_SKETCH)">
                <span class="material-symbols-outlined" aria-hidden="true">visibility</span>{{ S.VIEW }}
              </button>
              <button type="button" class="tohfa-btn tohfa-btn-outline-amber btn-xs" [attr.aria-label]="S.DOWNLOAD + ' ' + S.F_FMB_SKETCH" (click)="filePlaceholder(S.F_FMB_SKETCH)">
                <span class="material-symbols-outlined" aria-hidden="true">download</span>{{ S.DOWNLOAD }}
              </button>
              <button
                *ngIf="a.fmb.status === 'PENDING' && undecided()"
                type="button"
                class="tohfa-btn tohfa-btn-outline-amber btn-xs"
                [attr.aria-label]="S.MARK_VERIFIED + ' ' + S.F_FMB_SKETCH"
                (click)="verifyFmb()"
              >{{ S.MARK_VERIFIED }}</button>
            </span>
          </div>
        </section>
      </ng-template>

      <ng-template #reqList>
        <ul class="req-list">
          <li *ngFor="let r of requirements()">
            <span class="material-symbols-outlined" aria-hidden="true" [ngClass]="'ic-' + r.pill.tone">
              {{ r.pill.tone === 'success' ? 'check_circle' : r.pill.tone === 'danger' ? 'cancel' : 'schedule' }}
            </span>
            <span class="text">{{ r.label }}</span>
            <span class="tohfa-badge tohfa-badge-sm" [ngClass]="'tohfa-badge-' + r.pill.tone">{{ r.pill.label }}</span>
          </li>
        </ul>
      </ng-template>

      <ng-template #notesEditor>
        <div class="field">
          <label class="tohfa-label" for="review-notes">{{ S.REVIEW_NOTES }}</label>
          <textarea
            id="review-notes"
            class="tohfa-input"
            [placeholder]="S.NOTES_PLACEHOLDER"
            [maxLength]="noteMax"
            [(ngModel)]="noteText"
            aria-describedby="notes-counter"
          ></textarea>
          <div class="counter" id="notes-counter">{{ S.NOTES_COUNTER(noteText.length, noteMax) }}</div>
        </div>
        <button type="button" class="tohfa-btn btn-outline-full block-btn" [disabled]="noteText.trim().length === 0" (click)="saveNote()">
          <span class="material-symbols-outlined" aria-hidden="true">save</span>{{ S.SAVE_PROGRESS }}
        </button>
      </ng-template>

      <ng-template #historyCard>
        <section class="tohfa-card" aria-labelledby="c-history" *ngIf="history().length">
          <h3 class="card-title history" id="c-history">
            <span class="material-symbols-outlined" aria-hidden="true">history</span>{{ S.CARD_HISTORY }}
          </h3>
          <ol class="history-list">
            <li *ngFor="let h of history()" class="history-item" [class.ok]="h.tone === 'ok'" [class.bad]="h.tone === 'bad'">
              <span class="when"><span class="material-symbols-outlined" aria-hidden="true">calendar_today</span>{{ historyWhen(h) }}</span>
              <strong>{{ h.label }}</strong>
              <p *ngIf="h.note">{{ h.note }}</p>
            </li>
          </ol>
        </section>
      </ng-template>

      <!-- ================= Approve dialog ================= -->
      <div class="backdrop" *ngIf="showApprove()" (click)="onBackdrop($event, 'approve')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="approve-title" tohfaDialogFocus (dialogClose)="showApprove.set(false)">
          <h2 id="approve-title">{{ S.APPROVE_TITLE }}</h2>
          <p>{{ S.APPROVE_BODY }}</p>
          <label class="tohfa-label" for="approve-note">{{ S.APPROVE_NOTE }}</label>
          <textarea id="approve-note" class="tohfa-input" data-autofocus [maxLength]="approveNoteMax" [(ngModel)]="approveNote"></textarea>
          <div class="modal-actions">
            <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="showApprove.set(false)">{{ S.CANCEL }}</button>
            <button type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="confirmApprove()">{{ S.APPROVE_CONFIRM }}</button>
          </div>
        </div>
      </div>

      <!-- ================= Reject dialog ================= -->
      <div class="backdrop" *ngIf="showReject()" (click)="onBackdrop($event, 'reject')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="reject-title" aria-describedby="reject-body" tohfaDialogFocus (dialogClose)="showReject.set(false)">
          <h2 id="reject-title">{{ S.REJECT_TITLE }}</h2>
          <p id="reject-body">{{ S.REJECT_BODY }}</p>
          <div class="field">
            <label class="tohfa-label tohfa-label-required" for="reject-code">{{ S.REJECT_CODE }}</label>
            <select id="reject-code" class="tohfa-input" data-autofocus [(ngModel)]="rejectCode">
              <option *ngFor="let c of rejectCodes" [value]="c.code">{{ c.label }}</option>
            </select>
          </div>
          <div class="field">
            <label class="tohfa-label tohfa-label-required" for="reject-reason">{{ S.REJECT_REASON }}</label>
            <textarea
              id="reject-reason"
              class="tohfa-input"
              [placeholder]="S.REJECT_PLACEHOLDER"
              [maxLength]="rejectMax"
              [(ngModel)]="rejectReason"
              [attr.aria-invalid]="rejectTouched() && rejectReason.trim().length < messageMin"
              [attr.aria-describedby]="rejectTouched() && rejectReason.trim().length < messageMin ? 'reject-err' : null"
            ></textarea>
            <p class="error" id="reject-err" *ngIf="rejectTouched() && rejectReason.trim().length < messageMin">{{ S.REJECT_ERR }}</p>
          </div>
          <div class="modal-actions">
            <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="showReject.set(false)">{{ S.CANCEL }}</button>
            <button type="button" class="tohfa-btn btn-reject" (click)="confirmReject()">{{ S.REJECT_CONFIRM }}</button>
          </div>
        </div>
      </div>

      <tohfa-farmer-application-schedule-audit-dialog
        *ngIf="showSchedule()"
        [fullName]="a.fullName"
        [farmerCode]="a.farmerCode"
        [farmName]="a.farmName"
        [zone]="a.zone"
        [zoneCode]="a.zoneCode"
        (closed)="showSchedule.set(false)"
        (scheduled)="onAuditScheduled($event)"
        (drafted)="onAuditDrafted($event)"
      ></tohfa-farmer-application-schedule-audit-dialog>
    </ng-container>
  `,
})
export class FarmerApplicationDetailComponent implements OnInit {
  protected readonly S = S;
  protected readonly infoChips = INFO_CHIPS;
  protected readonly rejectCodes = REJECT_CODES;
  protected readonly messageMin = MESSAGE_MIN;
  protected readonly messageMax = MESSAGE_MAX;
  protected readonly noteMax = NOTE_MAX;
  protected readonly rejectMax = REJECT_MAX;
  protected readonly approveNoteMax = APPROVE_NOTE_MAX;

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The record on screen. Local actions replace it immutably; nothing is persisted. */
  readonly app = signal<MockApplicationReview | null>(null);
  readonly statusMsg = signal('');
  readonly errorMsg = signal('');

  readonly showApprove = signal(false);
  readonly showReject = signal(false);
  readonly showSchedule = signal(false);

  readonly riItems = signal<MockInfoItem[]>([]);
  readonly riTouched = signal(false);
  readonly rejectTouched = signal(false);
  riMessage = '';
  noteText = '';
  approveNote = '';
  rejectCode: MockRejectCode = 'DOCUMENTS_INVALID';
  rejectReason = '';

  // ---------- Stage ----------
  readonly undecided = computed(() => {
    const a = this.app();
    return !!a && UNDECIDED.has(a.status);
  });

  /** Identity proof, land proof and the FMB sketch verified — bank details do not gate (design 58). */
  readonly gateMet = computed(() => {
    const a = this.app();
    if (!a) return false;
    return this.docState(a, 'IDENTITY') === 'VERIFIED' && this.docState(a, 'LAND') === 'VERIFIED' && a.fmb.status === 'VERIFIED';
  });

  readonly canApproveNow = computed(() => this.undecided() && this.gateMet());

  readonly layout = computed<Layout>(() => {
    if (!this.undecided()) return 'decided';
    return this.gateMet() ? 'ready' : 'pending';
  });

  // ---------- Header ----------
  readonly initials = computed(() => {
    const parts = (this.app()?.fullName ?? '').trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase() || S.DASH;
  });
  readonly statusLabel = computed(() => {
    const a = this.app();
    return a ? STATUS_LABEL[a.status] : S.DASH;
  });
  readonly statusTone = computed<Tone>(() => {
    const a = this.app();
    return a ? STATUS_TONE[a.status] : 'neutral';
  });
  readonly submittedOn = computed(() => fmtDate(this.app()?.submittedAt));
  readonly decidedOn = computed(() => fmtDate(this.app()?.decidedAt));

  readonly fmbPill = computed<Pill>(() => STATE_PILL[this.app()?.fmb.status ?? 'MISSING']);

  // ---------- Documents ----------
  readonly docRows = computed<DocRowVm[]>(() => {
    const a = this.app();
    if (!a) return [];
    return a.documents.map((doc) => {
      const submitted = fmtDate(doc.submittedAt);
      let details: string;
      let subline: string;
      if (doc.kind === 'BANK') {
        details = doc.number && doc.ifsc ? S.BANK_DETAIL(doc.number, doc.ifsc) : S.DASH;
        subline = details;
      } else {
        details = doc.number ?? S.DASH;
        const parts = [doc.number ? S.DOC_NUMBER(doc.number) : '', doc.submittedAt ? S.DOC_SUBMITTED(submitted) : ''].filter(Boolean);
        subline = parts.length ? parts.join(' · ') : S.DASH;
      }
      return { kind: doc.kind, title: DOC_TITLE[doc.kind], icon: DOC_ICON[doc.kind], details, subline, submitted, pill: STATE_PILL[doc.status], doc };
    });
  });

  readonly requirements = computed<RequirementVm[]>(() => {
    const a = this.app();
    if (!a) return [];
    const farm: Pill = a.fmb.status === 'VERIFIED' ? { label: S.PILL_PROVIDED, tone: 'success' } : STATE_PILL[a.fmb.status];
    return [
      { label: S.DOC_IDENTITY, pill: STATE_PILL[this.docState(a, 'IDENTITY')] },
      { label: S.DOC_LAND, pill: STATE_PILL[this.docState(a, 'LAND')] },
      { label: S.DOC_BANK, pill: STATE_PILL[this.docState(a, 'BANK')] },
      { label: S.REQ_FARM, pill: farm },
    ];
  });

  /**
   * "Approval is blocked: …". The record's own sentence (the design's wording) is shown until the
   * reviewer changes a document or the FMB state; after that it is derived from the live state.
   */
  readonly blockedSentence = computed(() => {
    const a = this.app();
    if (!a || !this.undecided() || this.gateMet()) return '';
    if (a.blockedNote) return a.blockedNote;
    const phrases: string[] = [];
    for (const kind of ['IDENTITY', 'LAND'] as const) {
      const state = this.docState(a, kind);
      if (state === 'MISSING') phrases.push(S.BLOCK_DOC_MISSING(DOC_TITLE[kind]));
      else if (state === 'PENDING') phrases.push(S.BLOCK_DOC_PENDING(DOC_TITLE[kind]));
    }
    if (a.fmb.status === 'MISSING') phrases.push(S.BLOCK_FMB_MISSING);
    else if (a.fmb.status === 'PENDING') phrases.push(S.BLOCK_FMB_PENDING);
    return phrases.length ? `${capitalise(joinPhrases(phrases))}.` : '';
  });

  // ---------- History ----------
  readonly history = computed<MockHistoryItem[]>(() => [...(this.app()?.history ?? [])].sort((x, y) => y.at.localeCompare(x.at)));
  readonly rejectionText = computed(() => {
    const a = this.app();
    const code = REJECT_CODES.find((c) => c.code === a?.rejectionCode)?.label;
    return [code, a?.rejectionReason ?? ''].filter(Boolean).join(' · ') || S.DASH;
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => this.load(params.get('id') ?? ''));
  }

  private load(code: string): void {
    const record = mockApplicationReview(code);
    this.app.set(record);
    this.statusMsg.set('');
    this.errorMsg.set('');
    this.riItems.set(record.infoDraft ? [...record.infoDraft.items] : []);
    this.riMessage = record.infoDraft?.message ?? '';
    this.riTouched.set(false);
    this.noteText = UNDECIDED.has(record.status) ? record.reviewNotes : '';
  }

  // ---------- Template helpers ----------
  trackRow = (_: number, row: DocRowVm): string => row.kind;
  formatDay(value: string | null | undefined): string {
    return fmtDate(value);
  }
  historyWhen(h: MockHistoryItem): string {
    return S.HISTORY_WHEN(fmtStamp(h.at), h.actor);
  }

  onBackdrop(event: MouseEvent, which: 'approve' | 'reject'): void {
    if (event.target !== event.currentTarget) return;
    if (which === 'approve') this.showApprove.set(false);
    else this.showReject.set(false);
  }

  copyId(): void {
    const value = this.app()?.applicationCode ?? '';
    const clip = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    if (!clip) {
      this.errorMsg.set(S.COPY_FAILED);
      return;
    }
    clip.writeText(value).then(
      () => this.announce(S.COPIED),
      () => this.errorMsg.set(S.COPY_FAILED),
    );
  }

  /** Preview / Download / View Account: there are no files in this UI-only build. */
  filePlaceholder(what: string): void {
    this.announce(S.FILE_PLACEHOLDER(what));
  }

  toggleChip(item: MockInfoItem): void {
    this.riItems.update((items) => (items.includes(item) ? items.filter((i) => i !== item) : [...items, item]));
  }

  // ---------- Local actions ----------
  verifyDocument(kind: MockDocKind): void {
    this.patch((a) => ({
      ...a,
      blockedNote: null,
      documents: a.documents.map((d) => (d.kind === kind ? { ...d, status: 'VERIFIED' } : d)),
    }));
    this.announce(S.DOC_VERIFIED_MSG(DOC_TITLE[kind]));
  }

  verifyFmb(): void {
    this.patch((a) => ({ ...a, blockedNote: null, fmb: { ...a.fmb, status: 'VERIFIED' } }));
    this.announce(S.FMB_VERIFIED_MSG);
  }

  sendRequestInfo(): void {
    this.riTouched.set(true);
    const message = this.riMessage.trim();
    if (this.riItems().length === 0 || message.length < MESSAGE_MIN) return;
    const at = new Date().toISOString();
    const items = this.riItems();
    this.patch((a) => ({
      ...a,
      status: 'REQUEST_DOCUMENT',
      infoRequest: { items, message, requestedAt: at },
      history: [...a.history, { at, actor: S.ACTOR_REVIEWER, label: S.STATUS_REQUEST_DOCUMENT, tone: 'neutral', note: message }],
    }));
    this.riItems.set([]);
    this.riMessage = '';
    this.riTouched.set(false);
    this.announce(S.RI_SENT);
  }

  /** Save Progress: the text stays in the box (it is the current review note) and is logged. */
  saveNote(): void {
    const note = this.noteText.trim();
    if (!note) return;
    this.patch((a) => ({
      ...a,
      reviewNotes: note,
      history: [...a.history, { at: new Date().toISOString(), actor: S.ACTOR_REVIEWER, label: S.STATUS_NOTE, tone: 'neutral', note }],
    }));
    this.announce(S.NOTE_SAVED);
  }

  openReject(): void {
    this.rejectTouched.set(false);
    this.showReject.set(true);
  }

  confirmApprove(): void {
    if (!this.canApproveNow()) return;
    const note = this.approveNote.trim();
    this.patch((a) => ({
      ...a,
      status: 'APPROVED',
      decidedAt: MOCK_DECISION_DATE,
      history: [...a.history, { at: new Date().toISOString(), actor: S.ACTOR_REVIEWER, label: S.STATUS_APPROVED, tone: 'ok', ...(note ? { note } : {}) }],
    }));
    this.showApprove.set(false);
    this.approveNote = '';
    this.noteText = '';
    this.announce(S.APPROVED_MSG);
    this.focusHeading();
  }

  confirmReject(): void {
    this.rejectTouched.set(true);
    const reason = this.rejectReason.trim();
    if (reason.length < MESSAGE_MIN) return;
    const code = this.rejectCode;
    this.patch((a) => ({
      ...a,
      status: 'REJECTED',
      decidedAt: MOCK_DECISION_DATE,
      rejectionCode: code,
      rejectionReason: reason,
      history: [...a.history, { at: new Date().toISOString(), actor: S.ACTOR_REVIEWER, label: S.STATUS_REJECTED, tone: 'bad', note: reason }],
    }));
    this.showReject.set(false);
    this.rejectReason = '';
    this.noteText = '';
    this.announce(S.REJECTED_MSG);
    this.focusHeading();
  }

  onAuditScheduled(event: LocalAuditScheduled): void {
    this.patch((a) => ({
      ...a,
      status: 'AUDIT_SCHEDULED',
      history: [
        ...a.history,
        { at: new Date().toISOString(), actor: S.ACTOR_REVIEWER, label: S.STATUS_AUDIT_SCHEDULED, tone: 'neutral', note: S.SA_HISTORY_NOTE(event.auditId, event.auditor) },
      ],
    }));
    this.showSchedule.set(false);
    this.announce(event.message);
    this.focusHeading();
  }

  onAuditDrafted(message: string): void {
    this.showSchedule.set(false);
    this.announce(message);
  }

  private patch(change: (a: MockApplicationReview) => MockApplicationReview): void {
    const a = this.app();
    if (a) this.app.set(change(a));
  }

  private announce(message: string): void {
    this.errorMsg.set('');
    this.statusMsg.set(message);
  }

  /**
   * A decision swaps the layout, removing the button that opened the dialog, so the dialog's own
   * focus return has nowhere to go. Land focus on the applicant heading instead of the body.
   */
  private focusHeading(): void {
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('#applicant-name')?.focus());
  }

  private docState(a: MockApplicationReview, kind: MockDocKind): MockReviewState {
    return a.documents.find((d) => d.kind === kind)?.status ?? 'MISSING';
  }
}
