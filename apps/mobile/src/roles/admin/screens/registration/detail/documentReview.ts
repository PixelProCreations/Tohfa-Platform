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
import type { ApplicationStatus } from '../../../api/farmerApplications';
import type { ApplicationDetailView, ApplicationDocumentView } from '../../../api/farmerTypes';
import type { TranslationKey } from '../../../i18n';

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

export type DocumentVerificationState = 'verified' | 'pending' | 'unknown';

/**
 * Whether the documents are verified. Always `unknown` today:
 * `ApplicationDetailView.documentVerification` is null because the API has no
 * per-application document verification (the farmers module has one, for a
 * farmer that exists; an applicant is not one). The design's green "Verified"
 * badge therefore has nothing behind it, and the badge renders the dash.
 */
export function documentVerificationState(app: ApplicationDetailView): DocumentVerificationState {
  return app.documentVerification === null ? 'unknown' : 'verified';
}

export type DocumentReviewStage = 'requested' | 'allVerified' | 'underReview' | 'unknown';

/** The design's stage-2 line, from the fields the API really sends. */
export function documentReviewStage(app: ApplicationDetailView): DocumentReviewStage {
  // `infoRequest` is the server's own record that documents were asked for.
  if (app.infoRequest !== null && app.infoRequest.trim() !== '') return 'requested';
  if (documentVerificationState(app) === 'verified') return 'allVerified';
  return app.documents.length === 0 ? 'unknown' : 'underReview';
}

export type LifecycleStageKey = 'submitted' | 'docsReview' | 'farmVerification' | 'audit' | 'decision';
export type LifecycleStageState = 'done' | 'current' | 'pending';

export interface LifecycleStageView {
  key: LifecycleStageKey;
  state: LifecycleStageState;
}

/**
 * How far the application has moved, read off its status. The design drove
 * this from a local "tracking status" the reviewer could set from a dropdown;
 * no endpoint moves an application between these states, so here the tracker
 * only reports what the server says.
 */
const STATUS_STAGE: Record<ApplicationStatus, number> = {
  DRAFT: 0,
  SUBMITTED: 1,
  DOCS_REVIEW: 2,
  INFO_REQUESTED: 2,
  FARM_VERIFICATION: 3,
  AUDIT: 4,
  APPROVED: 5,
  REJECTED: 5,
};

const STAGE_INDEX: readonly { key: LifecycleStageKey; index: number }[] = [
  { key: 'submitted', index: 1 },
  { key: 'docsReview', index: 2 },
  { key: 'farmVerification', index: 3 },
  { key: 'audit', index: 4 },
  { key: 'decision', index: 5 },
];

export function lifecycleStages(app: ApplicationDetailView, status: ApplicationStatus): LifecycleStageView[] {
  const reached = STATUS_STAGE[status];
  return STAGE_INDEX.map(({ key, index }) => ({
    key,
    state: reached > index ? 'done' : reached === index ? (index === 5 ? 'done' : 'current') : 'pending',
  }));
}

/** The final stage's line: "Approved by Admin" / "Application Rejected" / "Pending Admin Decision". */
export function decisionLineKey(status: ApplicationStatus): TranslationKey {
  if (status === 'APPROVED') return 'farmerApps.tracking.decision.approved';
  if (status === 'REJECTED') return 'farmerApps.tracking.decision.rejected';
  return 'farmerApps.tracking.decision.pending';
}

/**
 * The categories the design's "What is missing?" chips would name. Derived
 * from the application, so the chips can never offer something it did supply.
 */
export function missingCategories(app: ApplicationDetailView): DocumentCategoryView[] {
  return documentCategories(app).filter((c) => c.state !== 'supplied');
}
