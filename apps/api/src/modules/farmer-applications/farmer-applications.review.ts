/**
 * Admin review of a farmer application: document (BR-215) and FMB (BR-216) review state, and the
 * stage gates built on it (BR-214). Pure functions only — no I/O — so the gate the service enforces
 * and the gate the admin detail DISPLAYS are the same code, and both are unit-testable.
 *
 * WHY review state is derived from content rather than stored on it: the applicant owns the
 * step-3/step-4 JSON and re-sends the whole array on every save (see
 * db/migrations/0201_application_review.sql). A decision is therefore bound to a key/fingerprint
 * computed from the content it judged. When the applicant replaces a file or redraws a boundary,
 * the current content has no matching decision and reads as PENDING — nobody has to remember to
 * reset it.
 */
import { createHash } from 'node:crypto';

/** The document types submit already requires (BR-69); the docs gate requires them VERIFIED. */
export const REQUIRED_DOCUMENT_TYPES = ['ID_PROOF', 'FARM_DOC'] as const;

/** The request-info checklist (BR-217). Mirrors `fash_requested_items_chk` in migration 0201. */
export const INFO_REQUEST_ITEMS = [
  'FMB_SKETCH',
  'AADHAAR',
  'PATTA_CHITTA',
  'BANK_DETAILS',
  'CERTIFICATE',
  'OTHER',
] as const;
export type InfoRequestItem = (typeof INFO_REQUEST_ITEMS)[number];

/** Mirrors `fash_reason_code_chk` in migration 0201 and `rejectApplicationBody.reasonCode`. */
export const REJECT_REASON_CODES = [
  'DOCUMENTS_INVALID',
  'LAND_NOT_VERIFIED',
  'DUPLICATE_APPLICANT',
  'OUTSIDE_SERVICE_AREA',
  'OTHER',
] as const;

export type ReviewDecision = 'VERIFIED' | 'REJECTED';
export type ReviewStatus = 'PENDING' | ReviewDecision;
export type ReviewSubjectType = 'DOCUMENT' | 'FMB';

/** One row of `farmer_application_reviews`. */
export interface ApplicationReviewRow {
  id: string;
  application_id: string;
  subject_type: ReviewSubjectType;
  subject_key: string;
  content_fingerprint: string;
  decision: ReviewDecision;
  reason: string | null;
  reviewed_by: string;
  created_at: Date;
}

export interface ReviewStateView {
  status: ReviewStatus;
  reason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface ApplicationDocumentView {
  documentKey: string;
  docType: string;
  docSubType: string | null;
  fileName: string | null;
  fileUrl: string;
  /** ID_PROOF and FARM_DOC: must be VERIFIED before the application can advance (BR-214). */
  required: boolean;
  review: ReviewStateView;
}

export interface ApplicationLocationView {
  locationId: string;
  label: string | null;
  areaAcres: number | null;
  calculatedAreaAcres: number | null;
  calculatedAreaHectares: number | null;
  gpsCaptured: boolean | null;
  latitude: number | null;
  longitude: number | null;
  village: string | null;
  taluk: string | null;
  district: string | null;
  hasBoundary: boolean;
  fmbPolygon: Record<string, unknown> | null;
  fmbReview: ReviewStateView;
}

export type ReviewBlocker =
  | { kind: 'MISSING_DOCUMENT_TYPE'; docType: string }
  | { kind: 'DOCUMENT_PENDING'; documentKey: string; docType: string }
  | { kind: 'DOCUMENT_REJECTED'; documentKey: string; docType: string; reason: string | null }
  | { kind: 'FMB_PENDING'; locationId: string; label: string | null }
  | { kind: 'FMB_REJECTED'; locationId: string; label: string | null; reason: string | null };

const PENDING: ReviewStateView = { status: 'PENDING', reason: null, reviewedBy: null, reviewedAt: null };

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/** JSON with object keys sorted, so equal content fingerprints equal whatever the key order. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/**
 * BR-215: a document's identity. The docType is part of it, so re-classifying the same file
 * (an Aadhaar re-labelled OTHER) is a different document and is reviewed again.
 */
export function documentKeyOf(docType: string, fileUrl: string): string {
  return sha256Hex(`${docType}|${fileUrl}`).slice(0, 32);
}

/** BR-216: what an FMB decision judged — the boundary and the acreage claimed for it. */
export function fmbFingerprintOf(location: Record<string, unknown>): string {
  return sha256Hex(
    canonicalJson({ fmbPolygon: location['fmbPolygon'] ?? null, areaAcres: location['areaAcres'] ?? null }),
  );
}

/** The step-3 location id, or a positional fallback for a legacy row saved without one. */
export function locationIdOf(location: Record<string, unknown>, index: number): string {
  const raw = location['id'];
  return typeof raw === 'string' && raw.length > 0 ? raw : `idx-${index}`;
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Latest decision per subject key (rows may arrive in any order). */
function latestBySubject(reviews: readonly ApplicationReviewRow[], type: ReviewSubjectType): Map<string, ApplicationReviewRow> {
  const latest = new Map<string, ApplicationReviewRow>();
  for (const row of reviews) {
    if (row.subject_type !== type) continue;
    const seen = latest.get(row.subject_key);
    if (seen === undefined || row.created_at.getTime() >= seen.created_at.getTime()) {
      latest.set(row.subject_key, row);
    }
  }
  return latest;
}

function stateOf(row: ApplicationReviewRow | undefined, fingerprint: string): ReviewStateView {
  // A decision about different content (replaced file, redrawn boundary) is not a decision
  // about this content.
  if (row === undefined || row.content_fingerprint !== fingerprint) return PENDING;
  return {
    status: row.decision,
    reason: row.reason,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.created_at.toISOString(),
  };
}

/** The step-4 documents with their identity and current review state. Malformed entries are skipped. */
export function applicationDocuments(
  step4Documents: Record<string, unknown> | null | undefined,
  reviews: readonly ApplicationReviewRow[],
): ApplicationDocumentView[] {
  const listed = step4Documents?.['documents'];
  if (!Array.isArray(listed)) return [];
  const latest = latestBySubject(reviews, 'DOCUMENT');
  const views: ApplicationDocumentView[] = [];
  for (const entry of listed) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const doc = entry as Record<string, unknown>;
    const docType = str(doc['docType']);
    const fileUrl = str(doc['fileUrl']);
    if (docType === null || fileUrl === null) continue;
    const documentKey = documentKeyOf(docType, fileUrl);
    views.push({
      documentKey,
      docType,
      docSubType: str(doc['docSubType']),
      fileName: str(doc['fileName']),
      fileUrl,
      required: (REQUIRED_DOCUMENT_TYPES as readonly string[]).includes(docType),
      review: stateOf(latest.get(documentKey), documentKey),
    });
  }
  return views;
}

/** The step-3 land locations with their FMB geometry and current FMB review state. */
export function applicationLocations(
  step3Location: Record<string, unknown> | null | undefined,
  reviews: readonly ApplicationReviewRow[],
): ApplicationLocationView[] {
  const listed = step3Location?.['locations'];
  if (!Array.isArray(listed)) return [];
  const latest = latestBySubject(reviews, 'FMB');
  const views: ApplicationLocationView[] = [];
  listed.forEach((entry, index) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return;
    const location = entry as Record<string, unknown>;
    const locationId = locationIdOf(location, index);
    const polygon = location['fmbPolygon'];
    const fmbPolygon =
      polygon !== null && typeof polygon === 'object' && !Array.isArray(polygon)
        ? (polygon as Record<string, unknown>)
        : null;
    views.push({
      locationId,
      label: str(location['label']),
      areaAcres: num(location['areaAcres']),
      calculatedAreaAcres: num(location['calculatedAreaAcres']),
      calculatedAreaHectares: num(location['calculatedAreaHectares']),
      gpsCaptured: typeof location['gpsCaptured'] === 'boolean' ? location['gpsCaptured'] : null,
      latitude: num(location['latitude']),
      longitude: num(location['longitude']),
      village: str(location['village']),
      taluk: str(location['taluk']),
      district: str(location['district']),
      hasBoundary: fmbPolygon !== null,
      fmbPolygon,
      fmbReview: stateOf(latest.get(locationId), fmbFingerprintOf(location)),
    });
  });
  return views;
}

/**
 * BR-214 docs gate: both required types present, every document of a required type VERIFIED,
 * and no document of ANY type REJECTED. Empty means the gate is met.
 */
export function documentGateBlockers(documents: readonly ApplicationDocumentView[]): ReviewBlocker[] {
  const blockers: ReviewBlocker[] = [];
  for (const docType of REQUIRED_DOCUMENT_TYPES) {
    if (!documents.some((d) => d.docType === docType)) {
      blockers.push({ kind: 'MISSING_DOCUMENT_TYPE', docType });
    }
  }
  for (const doc of documents) {
    if (doc.review.status === 'REJECTED') {
      blockers.push({ kind: 'DOCUMENT_REJECTED', documentKey: doc.documentKey, docType: doc.docType, reason: doc.review.reason });
    } else if (doc.required && doc.review.status === 'PENDING') {
      blockers.push({ kind: 'DOCUMENT_PENDING', documentKey: doc.documentKey, docType: doc.docType });
    }
  }
  return blockers;
}

/** BR-214 approval gate (FMB half): every location's FMB review VERIFIED. */
export function fmbGateBlockers(locations: readonly ApplicationLocationView[]): ReviewBlocker[] {
  const blockers: ReviewBlocker[] = [];
  for (const location of locations) {
    if (location.fmbReview.status === 'REJECTED') {
      blockers.push({ kind: 'FMB_REJECTED', locationId: location.locationId, label: location.label, reason: location.fmbReview.reason });
    } else if (location.fmbReview.status === 'PENDING') {
      blockers.push({ kind: 'FMB_PENDING', locationId: location.locationId, label: location.label });
    }
  }
  return blockers;
}
