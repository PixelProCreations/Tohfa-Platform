/**
 * Pure decisions behind the redesigned document review (origin/Superadmin-main
 * AdminApplicationDetailScreen, 2026-11-19): which document categories the
 * reviewer sees, what each one's state is, and where the application stands in
 * the lifecycle. No React, so plain-Node vitest covers it
 * (tests/applications_documents.test.tsx); the sections only render what it
 * returns.
 *
 * Why this file exists at all: the design draws three fixed document cards
 * ("ID Proof", "Farm Documents (Land Deed)", "Certification") with hard-coded
 * file names, sizes and Verified badges. None of that is data. Here the cards
 * come from the application's own `documents` array, and a category nothing
 * filled is reported as such rather than drawn with a placeholder.
 *
 * Three states, deliberately distinct — "no document" and "the API has no such
 * field" are not the same fact, and a reviewer has to be able to tell them
 * apart before asking the applicant for anything:
 *   supplied     the applicant uploaded at least one document here
 *   notSupplied  this application collects the category, and nothing came
 *   unavailable  the application never carries the category at all
 */
import type { ApplicationReviewBlockerDto, ApplicationReviewGateDto, ApplicationStatus } from '../../../api/farmerApplications';
import type { ApplicationDetailView, ApplicationDocumentView } from '../../../api/farmerTypes';
import { t, type TranslationKey } from '../../../i18n';

export type DocumentCategoryState = 'supplied' | 'notSupplied' | 'unavailable';

export interface DocumentCategoryView {
  /** The API's own `docType` for a document category, or a derived key for the two that are not documents. */
  key: string;
  /** The documents the applicant supplied here, in the order the API sent them. Empty unless `supplied`. */
  documents: ApplicationDocumentView[];
  state: DocumentCategoryState;
  /**
   * Why the category is empty, for the line under its title. Null when
   * supplied; the section renders the dash alongside it.
   */
  emptyReasonKey: TranslationKey | null;
}

/**
 * The two document types the server's own completeness check requires before
 * an application counts as documents-complete
 * (apps/api/src/modules/farmer-applications/farmer-applications.service.ts:
 * `docTypes.includes('ID_PROOF') && docTypes.includes('FARM_DOC')`). They are
 * listed here so a missing one is drawn as a gap rather than simply not drawn
 * — not as a guess at what the design meant by its three fixed cards.
 */
export const COLLECTED_DOC_TYPES = ['ID_PROOF', 'FARM_DOC'] as const;

/**
 * The FMB sketch the design shows beside the documents is not a document: the
 * only FMB signal the API carries is `hasBoundary` on each land location
 * (step 3). It is reported here so the review reads as one list, but it is
 * never counted among the uploaded documents.
 */
function fmbCategory(app: ApplicationDetailView): DocumentCategoryView {
  const drawn = app.locations.some((l) => l.hasBoundary);
  return {
    key: 'FMB_SKETCH',
    documents: [],
    state: drawn ? 'supplied' : 'notSupplied',
    emptyReasonKey: drawn ? null : 'farmerApps.doc.notSupplied',
  };
}

/**
 * Bank details appear in the design's missing-information list, but a farmer
 * application has no bank step at all — payout destinations are recorded
 * against a farmer, which exists only after approval. The card stays drawn
 * with the dash so the gap is visible instead of implied.
 */
function bankCategory(): DocumentCategoryView {
  return { key: 'BANK_DETAILS', documents: [], state: 'unavailable', emptyReasonKey: 'farmerApps.doc.notCollected' };
}

/**
 * Every category the reviewer sees: first the ones the applicant actually
 * supplied (in the order the API sent the first document of each), then the
 * collected types that are missing, then the FMB sketch and bank details.
 */
export function documentCategories(app: ApplicationDetailView): DocumentCategoryView[] {
  const supplied = new Map<string, ApplicationDocumentView[]>();
  for (const document of app.documents) {
    // A document with no docType is still a document the applicant uploaded.
    const key = document.docType ?? 'UNKNOWN';
    const bucket = supplied.get(key);
    if (bucket === undefined) supplied.set(key, [document]);
    else bucket.push(document);
  }

  const out: DocumentCategoryView[] = [];
  for (const [key, documents] of supplied) {
    out.push({ key, documents, state: 'supplied', emptyReasonKey: null });
  }
  for (const key of COLLECTED_DOC_TYPES) {
    if (supplied.has(key)) continue;
    out.push({ key, documents: [], state: 'notSupplied', emptyReasonKey: 'farmerApps.doc.notSupplied' });
  }
  out.push(fmbCategory(app), bankCategory());
  return out;
}

export type DocumentVerificationState = 'verified' | 'rejected' | 'pending' | 'unknown';

/**
 * Whether the documents are verified (from server per-document review states).
 */
export function documentVerificationState(app: ApplicationDetailView): DocumentVerificationState {
  if (app.documentVerification === 'verified') return 'verified';
  if (app.documentVerification === 'rejected') return 'rejected';
  if (app.documentVerification === 'pending') return 'pending';
  return 'unknown';
}

export type DocumentReviewStage = 'requested' | 'allVerified' | 'underReview' | 'unknown';

/** The design's stage-2 line, from the fields the API really sends. */
export function documentReviewStage(app: ApplicationDetailView): DocumentReviewStage {
  if (app.status === 'INFO_REQUESTED' || (app.infoRequest !== null && app.infoRequest.trim() !== '')) return 'requested';
  if (documentVerificationState(app) === 'verified') return 'allVerified';
  return app.documents.length === 0 ? 'unknown' : 'underReview';
}

function blockerCountText(count: number, oneKey: TranslationKey, otherKey: TranslationKey): string {
  return count === 1 ? t(oneKey) : t(otherKey, { count });
}

/**
 * Human-readable explanation of why an advance/approve gate is blocked (BR-214).
 * Returns null when the gate is met (or when no blockers exist and stage allows).
 */
export function gateBlockerSummary(
  gate: ApplicationReviewGateDto | null | undefined,
  opts: { requireFarmVerificationStage?: boolean; status?: ApplicationStatus } = {},
): string | null {
  if (opts.requireFarmVerificationStage && opts.status !== 'FARM_VERIFICATION') {
    if (opts.status === 'DOCS_REVIEW') {
      // If docs gate itself isn't met yet, name that too; otherwise instruct to advance.
      const blockers = gate?.blockers ?? [];
      const docSummary = formatBlockers(blockers.filter((b) => !b.kind.startsWith('FMB_')));
      return docSummary ?? t('farmerApps.gate.mustAdvance');
    }
    return opts.status === undefined ? null : t('farmerApps.gate.stageNotReviewable', { status: t(`farmerApps.status.${opts.status}` satisfies TranslationKey) });
  }
  if (!gate || gate.met) return null;
  return formatBlockers(gate.blockers);
}

function formatBlockers(blockers: readonly ApplicationReviewBlockerDto[]): string | null {
  if (blockers.length === 0) return null;
  const missingDocs = blockers.filter((b) => b.kind === 'MISSING_DOCUMENT_TYPE').length;
  const pendingDocs = blockers.filter((b) => b.kind === 'DOCUMENT_PENDING').length;
  const rejectedDocs = blockers.filter((b) => b.kind === 'DOCUMENT_REJECTED').length;
  const pendingFmb = blockers.filter((b) => b.kind === 'FMB_PENDING').length;
  const rejectedFmb = blockers.filter((b) => b.kind === 'FMB_REJECTED').length;
  const parts: string[] = [];
  if (missingDocs > 0) parts.push(blockerCountText(missingDocs, 'farmerApps.gate.docsMissing.one', 'farmerApps.gate.docsMissing.other'));
  if (rejectedDocs > 0) parts.push(blockerCountText(rejectedDocs, 'farmerApps.gate.docsRejected.one', 'farmerApps.gate.docsRejected.other'));
  if (pendingDocs > 0) parts.push(blockerCountText(pendingDocs, 'farmerApps.gate.docsPending.one', 'farmerApps.gate.docsPending.other'));
  if (rejectedFmb > 0) parts.push(blockerCountText(rejectedFmb, 'farmerApps.gate.fmbRejected.one', 'farmerApps.gate.fmbRejected.other'));
  if (pendingFmb > 0) parts.push(blockerCountText(pendingFmb, 'farmerApps.gate.fmbPending.one', 'farmerApps.gate.fmbPending.other'));
  return parts.length > 0 ? parts.join(' · ') : null;
}

export type LifecycleStageKey = 'submitted' | 'docsReview' | 'farmVerification' | 'decision';
/** The design's four dot styles: green tick, brand (in progress), amber (sent back), grey (not reached). */
export type LifecycleDot = 'done' | 'inProgress' | 'warning' | 'pending';

export interface LifecycleStageView {
  key: LifecycleStageKey;
  /** 1-based, printed in the dot when it is not ticked. */
  number: number;
  dot: LifecycleDot;
  /** The line under the stage title; null = the "not available" dash. */
  lineKey: TranslationKey | null;
}

/**
 * The design's progression tracker, read off the server's own status. The
 * design drove it from a local "tracking status" the reviewer could set; no
 * endpoint persists such a choice yet, so here it only reports the server.
 *
 * There is no audit stage: audit work is a separate flow (owner decision
 * 2026-11-25), so the review runs Submitted -> Documents Under Review
 * (-> Documents Requested) -> Farm Verification -> Approved / Rejected. A
 * legacy AUDIT status still reads as farm verification in progress, the last
 * review stage it can honestly be said to have reached.
 *
 * A REJECTED application says nothing about which stages it passed before the
 * rejection, so its middle stages are left grey with the dash.
 */
export function lifecycleStages(app: ApplicationDetailView, status: ApplicationStatus): LifecycleStageView[] {
  const requested = status === 'INFO_REQUESTED' || (documentReviewStage(app) === 'requested' && (status === 'SUBMITTED' || status === 'DOCS_REVIEW'));
  const pastDocs = status === 'FARM_VERIFICATION' || status === 'AUDIT' || status === 'APPROVED';
  const rejected = status === 'REJECTED';

  const docs: LifecycleStageView = requested
    ? { key: 'docsReview', number: 2, dot: 'warning', lineKey: 'farmerApps.tracking.line.docsRequested' }
    : pastDocs
      ? { key: 'docsReview', number: 2, dot: 'done', lineKey: 'farmerApps.tracking.stageState.done' }
      : status === 'DOCS_REVIEW'
        ? { key: 'docsReview', number: 2, dot: 'inProgress', lineKey: 'farmerApps.tracking.line.docsInProgress' }
        : { key: 'docsReview', number: 2, dot: 'pending', lineKey: rejected ? null : 'farmerApps.tracking.stageState.pending' };

  const farm: LifecycleStageView =
    status === 'FARM_VERIFICATION' || status === 'AUDIT'
      ? { key: 'farmVerification', number: 3, dot: 'inProgress', lineKey: 'farmerApps.tracking.line.visitInProgress' }
      : status === 'APPROVED'
        ? { key: 'farmVerification', number: 3, dot: 'done', lineKey: 'farmerApps.tracking.stageState.done' }
        : { key: 'farmVerification', number: 3, dot: 'pending', lineKey: rejected ? null : 'farmerApps.tracking.line.visitPending' };

  return [
    { key: 'submitted', number: 1, dot: 'done', lineKey: 'farmerApps.tracking.stageState.done' },
    docs,
    farm,
    { key: 'decision', number: 4, dot: status === 'APPROVED' ? 'done' : 'pending', lineKey: decisionLineKey(status) },
  ];
}

/** The final stage's line: "Approved by Admin" / "Application Rejected" / "Pending Admin Decision". */
export function decisionLineKey(status: ApplicationStatus): TranslationKey {
  if (status === 'APPROVED') return 'farmerApps.tracking.decision.approved';
  if (status === 'REJECTED') return 'farmerApps.tracking.decision.rejected';
  return 'farmerApps.tracking.decision.pending';
}

/**
 * The options of the design's "Update Tracking Status" picker, minus its two
 * audit entries (owner decision 2026-11-25), each tied to the API status it
 * stands for. The picker is drawn but disabled until the stage-change endpoint
 * is wired; this list is what it will offer.
 */
export const TRACKING_STATUS_OPTIONS: readonly { status: ApplicationStatus; labelKey: TranslationKey }[] = [
  { status: 'SUBMITTED', labelKey: 'farmerApps.tracking.option.SUBMITTED' },
  { status: 'DOCS_REVIEW', labelKey: 'farmerApps.tracking.option.DOCS_REVIEW' },
  { status: 'INFO_REQUESTED', labelKey: 'farmerApps.tracking.option.INFO_REQUESTED' },
  { status: 'FARM_VERIFICATION', labelKey: 'farmerApps.tracking.option.FARM_VERIFICATION' },
  { status: 'APPROVED', labelKey: 'farmerApps.tracking.option.APPROVED' },
  { status: 'REJECTED', labelKey: 'farmerApps.tracking.option.REJECTED' },
];

/** The picker's current value: the option for the server's status (a legacy AUDIT reads as farm verification). */
export function trackingOptionFor(status: ApplicationStatus): TranslationKey | null {
  const shown = status === 'AUDIT' ? 'FARM_VERIFICATION' : status;
  return TRACKING_STATUS_OPTIONS.find((o) => o.status === shown)?.labelKey ?? null;
}

/**
 * The design's three document cards, in its order: identity proof, land
 * document, certification (optional). Each card carries what the applicant
 * actually uploaded under that docType; any other docType the server sends
 * gets a card of its own after them, so no upload is hidden.
 */
export const DESIGN_DOC_TYPES = ['ID_PROOF', 'FARM_DOC', 'CERTIFICATE'] as const;

export interface DocumentCardView {
  key: string;
  documents: ApplicationDocumentView[];
}

export function documentCards(app: ApplicationDetailView): DocumentCardView[] {
  const byType = new Map<string, ApplicationDocumentView[]>();
  for (const document of app.documents) {
    const key = document.docType ?? 'UNKNOWN';
    const bucket = byType.get(key);
    if (bucket === undefined) byType.set(key, [document]);
    else bucket.push(document);
  }
  const cards: DocumentCardView[] = DESIGN_DOC_TYPES.map((key) => ({ key, documents: byType.get(key) ?? [] }));
  for (const [key, documents] of byType) {
    if (!(DESIGN_DOC_TYPES as readonly string[]).includes(key)) cards.push({ key, documents });
  }
  return cards;
}

/**
 * The categories the design's "What is missing?" chips would name. Derived
 * from the application, so the chips can never offer something it did supply.
 */
export function missingCategories(app: ApplicationDetailView): DocumentCategoryView[] {
  return documentCategories(app).filter((c) => c.state !== 'supplied');
}
