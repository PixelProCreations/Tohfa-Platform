/**
 * UI-only placeholder data — replace with API when this screen is integrated.
 *
 * Static records for the Application Review screen (designs 55–59), keyed by application code so
 * every row of the Farmer Applications list opens a review. Nothing here is real and none of it is
 * a spec: names, zones, methods and mobiles mirror the list rows; the review-only fields (address,
 * documents, FMB sketch, history) are the designs' values. Dates are ISO strings and are formatted
 * in UTC so a value never shifts a day with the viewer's timezone.
 *
 * Deliberately self-contained: it does not import the list's mock, so the two screens can be
 * integrated with the API independently.
 */

export type MockReviewStatus =
  | 'PENDING_REVIEW'
  | 'REQUEST_DOCUMENT'
  | 'ON_HOLD'
  | 'APPROVED'
  | 'AUDIT_SCHEDULED'
  | 'AUDIT_IN_PROGRESS'
  | 'AUDIT_COMPLETED'
  | 'FINAL_APPROVED'
  | 'REJECTED';

export type MockReviewState = 'PENDING' | 'VERIFIED' | 'MISSING';
export type MockDocKind = 'IDENTITY' | 'LAND' | 'BANK';
export type MockInfoItem = 'IDENTITY' | 'FMB' | 'LAND' | 'BANK' | 'OTHER';
export type MockRejectCode = 'DOCUMENTS_INVALID' | 'LAND_NOT_VERIFIED' | 'DUPLICATE_APPLICANT' | 'OUTSIDE_SERVICE_AREA' | 'OTHER';
export type MockHistoryTone = 'ok' | 'bad' | 'neutral';

export interface MockReviewDocument {
  kind: MockDocKind;
  /** Masked number (identity / land) or masked account number (bank); null renders "—". */
  number: string | null;
  /** Bank only. */
  ifsc?: string | null;
  submittedAt: string | null;
  status: MockReviewState;
}

export interface MockFmbSketch {
  status: MockReviewState;
  fileName: string | null;
  fileSize: string | null;
}

export interface MockHistoryItem {
  at: string;
  actor: string;
  label: string;
  tone: MockHistoryTone;
  note?: string;
}

export interface MockInfoRequest {
  items: MockInfoItem[];
  message: string;
  requestedAt: string;
}

export interface MockApplicationReview {
  applicationCode: string;
  fullName: string;
  phone: string;
  address: string;
  zone: string;
  /** The zone's sub-division shown in the pending layout's Farm & Land card ("Zone A"). */
  zoneCode: string;
  farmingMethod: string;
  submittedAt: string;
  /** Approval or rejection date; null while undecided. */
  decidedAt: string | null;
  status: MockReviewStatus;
  crops: string;
  declaration: string;
  farmLocation: string;
  landArea: string;
  areaType: string;
  fmb: MockFmbSketch;
  documents: MockReviewDocument[];
  reviewNotes: string;
  history: MockHistoryItem[];
  /** Pre-filled request-information form (design 55). */
  infoDraft: MockInfoRequest | null;
  /** An open information request waiting on the applicant. */
  infoRequest: MockInfoRequest | null;
  rejectionCode: MockRejectCode | null;
  rejectionReason: string | null;
  /**
   * The design's own blocked sentence, shown verbatim until the reviewer changes a document or the
   * FMB state; after that the sentence is derived from the live state.
   */
  blockedNote: string | null;
  /** Schedule Audit dialog prefill (design 59). */
  farmerCode: string;
  farmName: string;
}

/** Fixed approval / rejection date for local decisions, so the screen matches design 58. */
export const MOCK_DECISION_DATE = '2026-10-10T00:00:00Z';

/** Schedule Audit dialog placeholders (design 59). */
export const MOCK_AUDIT_ID = 'AUD-2026-0043';
export const MOCK_AUDIT_DATE = '2026-10-20';
export const MOCK_AUDIT_START = '10:00';
export const MOCK_AUDIT_DURATION_MINUTES = 120;
export const MOCK_AUDITORS: readonly string[] = ['R. Devi', 'S. Prakash', 'K. Meena', 'A. Joseph'];

interface Base {
  code: string;
  name: string;
  mobile: string;
  zone: string;
  zoneCode: string;
  method: string;
  /** yyyy-MM-dd */
  submitted: string;
  street: string;
  crops: string;
}

const iso = (day: string): string => `${day}T00:00:00Z`;
const suffix = (code: string): string => code.slice(-4);
const firstName = (name: string): string => name.split(' ')[0] ?? name;

function common(b: Base): Omit<MockApplicationReview, 'status' | 'decidedAt' | 'fmb' | 'documents' | 'history' | 'reviewNotes' | 'farmLocation' | 'landArea' | 'areaType'> {
  return {
    applicationCode: b.code,
    fullName: b.name,
    phone: `+91 ${b.mobile}`,
    address: `${b.street}, ${b.zone}`,
    zone: b.zone,
    zoneCode: b.zoneCode,
    farmingMethod: b.method,
    submittedAt: iso(b.submitted),
    crops: b.crops,
    declaration: `${b.method} practices declaration submitted`,
    infoDraft: null,
    infoRequest: null,
    rejectionCode: null,
    rejectionReason: null,
    blockedNote: null,
    farmerCode: `FMR-0${suffix(b.code)}`,
    farmName: `${firstName(b.name)} Farm house`,
  };
}

/** Design 55/56: documents submitted but unverified. */
function pending(b: Base, status: MockReviewStatus, fmb: MockFmbSketch, landArea: string): MockApplicationReview {
  const at = iso(b.submitted);
  return {
    ...common(b),
    status,
    decidedAt: null,
    farmLocation: b.zone,
    landArea,
    areaType: 'Rectangular',
    fmb,
    documents: [
      { kind: 'IDENTITY', number: `XXXX XXXX ${suffix(b.mobile.replace(/\D/g, ''))}`, submittedAt: at, status: 'PENDING' },
      { kind: 'LAND', number: null, submittedAt: at, status: 'PENDING' },
      { kind: 'BANK', number: null, ifsc: null, submittedAt: at, status: 'PENDING' },
    ],
    reviewNotes: '',
    history: [],
  };
}

function verifiedDocs(b: Base, bank: MockReviewState): MockReviewDocument[] {
  const at = iso(b.submitted);
  return [
    { kind: 'IDENTITY', number: 'XXXX XXXX 0000', submittedAt: at, status: 'VERIFIED' },
    { kind: 'LAND', number: 'XXXX XXXX 0977', submittedAt: at, status: 'VERIFIED' },
    bank === 'VERIFIED'
      ? { kind: 'BANK', number: 'XXXX 3456 7890', ifsc: 'SBIN0007512', submittedAt: at, status: 'VERIFIED' }
      : { kind: 'BANK', number: null, ifsc: null, submittedAt: null, status: bank },
  ];
}

function verifiedFmb(b: Base): MockFmbSketch {
  return { status: 'VERIFIED', fileName: `fmb-${suffix(b.code)}.pdf`, fileSize: '1.2 MB' };
}

/** Design 57: everything verified, awaiting the decision. */
function ready(b: Base): MockApplicationReview {
  return {
    ...common(b),
    status: 'PENDING_REVIEW',
    decidedAt: null,
    farmLocation: `Demo plot, ${b.zone}`,
    landArea: '2.0 acre',
    areaType: 'Rectangular',
    fmb: verifiedFmb(b),
    documents: verifiedDocs(b, 'VERIFIED'),
    reviewNotes: 'All requirements met. Ready for approval.',
    history: [],
  };
}

/** Design 58: approved (and the audit stages after it). */
function approved(b: Base, status: MockReviewStatus): MockApplicationReview {
  const history: MockHistoryItem[] = [{ at: iso(b.submitted).replace('T00:00', 'T10:00'), actor: 'Applicant', label: 'Approved', tone: 'ok' }];
  if (status === 'AUDIT_SCHEDULED' || status === 'AUDIT_IN_PROGRESS' || status === 'AUDIT_COMPLETED' || status === 'FINAL_APPROVED') {
    history.unshift({ at: '2026-10-20T10:00:00Z', actor: 'Reviewer', label: 'Audit Scheduled', tone: 'neutral', note: `${MOCK_AUDIT_ID} · R. Devi` });
  }
  if (status === 'AUDIT_COMPLETED' || status === 'FINAL_APPROVED') {
    history.unshift({ at: '2026-10-20T12:00:00Z', actor: 'R. Devi', label: 'Audit Completed', tone: 'ok' });
  }
  if (status === 'FINAL_APPROVED') {
    history.unshift({ at: '2026-10-24T09:30:00Z', actor: 'Reviewer', label: 'Final Approved', tone: 'ok' });
  }
  return {
    ...common(b),
    status,
    decidedAt: MOCK_DECISION_DATE,
    farmLocation: `Demo plot, ${b.zone}`,
    landArea: '2.0 acre',
    areaType: 'Rectangular',
    fmb: verifiedFmb(b),
    documents: verifiedDocs(b, 'PENDING'),
    reviewNotes: 'All requirements met. Ready for approval.',
    history,
  };
}

function rejected(b: Base): MockApplicationReview {
  const at = iso(b.submitted);
  return {
    ...common(b),
    status: 'REJECTED',
    decidedAt: MOCK_DECISION_DATE,
    farmLocation: b.zone,
    landArea: '1.2 acres',
    areaType: 'Irregular',
    fmb: { status: 'MISSING', fileName: null, fileSize: null },
    documents: [
      { kind: 'IDENTITY', number: 'XXXX XXXX 6779', submittedAt: at, status: 'VERIFIED' },
      { kind: 'LAND', number: null, submittedAt: null, status: 'MISSING' },
      { kind: 'BANK', number: null, ifsc: null, submittedAt: null, status: 'PENDING' },
    ],
    reviewNotes: 'Land ownership proof not provided after two reminders.',
    history: [
      { at: '2026-10-10T11:15:00Z', actor: 'Reviewer', label: 'Rejected', tone: 'bad', note: 'Land ownership could not be verified.' },
      { at: '2026-10-02T09:00:00Z', actor: 'Reviewer', label: 'Request Document', tone: 'neutral', note: 'Please upload the patta / chitta for the farm.' },
    ],
    rejectionCode: 'LAND_NOT_VERIFIED',
    rejectionReason: 'Land ownership could not be verified.',
  };
}

const B = {
  sathish: { code: 'APP-2026-0101', name: 'Sathish Kumar', mobile: '99801 00100', zone: 'Ooty', zoneCode: 'Zone A', method: 'Natural', submitted: '2026-10-05', street: 'Thottam Street', crops: 'Carrot, Cabbage' },
  geetha: { code: 'APP-2026-0098', name: 'Geetha Palani', mobile: '97654 22334', zone: 'Coonoor', zoneCode: 'Zone B', method: 'Organic', submitted: '2026-10-10', street: 'Church Road', crops: 'Beans, Potato' },
  bala: { code: 'APP-2026-0094', name: 'Bala Subramaniam', mobile: '96543 33445', zone: 'Kotagiri', zoneCode: 'Zone C', method: 'Biodynamic', submitted: '2026-10-08', street: 'Market Street', crops: 'Tea, Pepper' },
  anitha: { code: 'APP-2026-0087', name: 'Anitha Murthy', mobile: '95432 44556', zone: 'Gudalur', zoneCode: 'Zone D', method: 'Organic', submitted: '2026-10-05', street: 'Temple Road', crops: 'Carrot, Cabbage' },
  ramu: { code: 'APP-2026-0081', name: 'Ramu Perumal', mobile: '94321 55668', zone: 'Kotagiri', zoneCode: 'Zone C', method: 'Natural', submitted: '2026-10-03', street: 'Lake View Road', crops: 'Garlic, Beans' },
  deepa: { code: 'APP-2026-0076', name: 'Deepa Krishnan', mobile: '93210 66779', zone: 'Ooty', zoneCode: 'Zone A', method: 'Organic', submitted: '2026-09-30', street: 'Hill Top Road', crops: 'Potato, Radish' },
  vignesh: { code: 'APP-2026-0070', name: 'Vignesh Raman', mobile: '92109 77890', zone: 'Coonoor', zoneCode: 'Zone B', method: 'Biodynamic', submitted: '2026-09-28', street: 'Bazaar Street', crops: 'Cauliflower, Peas' },
  meena: { code: 'APP-2026-0063', name: 'Meena Ganesan', mobile: '91098 88901', zone: 'Gudalur', zoneCode: 'Zone D', method: 'Natural', submitted: '2026-09-25', street: 'River Side Lane', crops: 'Ginger, Turmeric' },
  suresh: { code: 'APP-2026-0058', name: 'Suresh Pandian', mobile: '90987 99012', zone: 'Kotagiri', zoneCode: 'Zone C', method: 'Organic', submitted: '2026-09-22', street: 'Estate Road', crops: 'Cabbage, Leeks' },
  lakshmi: { code: 'APP-2026-0052', name: 'Lakshmi Narayanan', mobile: '89876 10234', zone: 'Ooty', zoneCode: 'Zone A', method: 'Organic', submitted: '2026-09-19', street: 'Garden Road', crops: 'Carrot, Beetroot' },
  karthik: { code: 'APP-2026-0049', name: 'Karthik Selvam', mobile: '88765 21345', zone: 'Coonoor', zoneCode: 'Zone B', method: 'Natural', submitted: '2026-09-17', street: 'Mill Road', crops: 'Beans, Peas' },
  priya: { code: 'APP-2026-0045', name: 'Priya Venkatesh', mobile: '87654 32456', zone: 'Gudalur', zoneCode: 'Zone D', method: 'Biodynamic', submitted: '2026-09-15', street: 'School Street', crops: 'Pepper, Cardamom' },
  murugan: { code: 'APP-2026-0041', name: 'Murugan Chellappa', mobile: '86543 43567', zone: 'Kotagiri', zoneCode: 'Zone C', method: 'Organic', submitted: '2026-09-12', street: 'Post Office Road', crops: 'Tea, Garlic' },
  revathi: { code: 'APP-2026-0038', name: 'Revathi Sundaram', mobile: '85432 54678', zone: 'Ooty', zoneCode: 'Zone A', method: 'Natural', submitted: '2026-09-10', street: 'Station Road', crops: 'Potato, Cabbage' },
  arjun: { code: 'APP-2026-0034', name: 'Arjun Mohan', mobile: '84321 65789', zone: 'Coonoor', zoneCode: 'Zone B', method: 'Organic', submitted: '2026-09-08', street: 'Forest Lane', crops: 'Carrot, Radish' },
  selvi: { code: 'APP-2026-0031', name: 'Selvi Rajendran', mobile: '83210 76890', zone: 'Gudalur', zoneCode: 'Zone D', method: 'Biodynamic', submitted: '2026-09-05', street: 'Canal Road', crops: 'Ginger, Pepper' },
  dinesh: { code: 'APP-2026-0027', name: 'Dinesh Babu', mobile: '82109 87901', zone: 'Kotagiri', zoneCode: 'Zone C', method: 'Natural', submitted: '2026-09-03', street: 'Valley Road', crops: 'Beans, Leeks' },
  kavitha: { code: 'APP-2026-0023', name: 'Kavitha Ramesh', mobile: '81098 98012', zone: 'Ooty', zoneCode: 'Zone A', method: 'Organic', submitted: '2026-09-01', street: 'Lake Road', crops: 'Cauliflower, Carrot' },
} satisfies Record<string, Base>;

const MISSING_FMB: MockFmbSketch = { status: 'MISSING', fileName: null, fileSize: null };
const pendingFmb = (b: Base): MockFmbSketch => ({ status: 'PENDING', fileName: `fmb-${suffix(b.code)}.pdf`, fileSize: '0.9 MB' });

const RECORDS: MockApplicationReview[] = [
  // Design 55/56 — exactly as drawn.
  {
    ...pending(B.sathish, 'PENDING_REVIEW', MISSING_FMB, '1.8 acres'),
    documents: [
      { kind: 'IDENTITY', number: 'XXXX XXXX 4821', submittedAt: iso('2026-10-05'), status: 'PENDING' },
      { kind: 'LAND', number: null, submittedAt: iso('2026-10-05'), status: 'PENDING' },
      { kind: 'BANK', number: null, ifsc: null, submittedAt: iso('2026-10-05'), status: 'PENDING' },
    ],
    infoDraft: {
      items: ['IDENTITY', 'FMB'],
      message: 'Please re-upload a clear scan of your identity proof and submit a farm sketch (FMB) showing plot boundaries.',
      requestedAt: iso('2026-10-05'),
    },
    blockedNote: 'Identity proof is unverified and the FMB sketch is missing.',
  },
  {
    ...pending(B.geetha, 'REQUEST_DOCUMENT', pendingFmb(B.geetha), '1.4 acres'),
    infoRequest: { items: ['LAND'], message: 'Please upload the patta / chitta for the farm.', requestedAt: '2026-10-11T09:30:00Z' },
    history: [{ at: '2026-10-11T09:30:00Z', actor: 'Reviewer', label: 'Request Document', tone: 'neutral', note: 'Please upload the patta / chitta for the farm.' }],
  },
  {
    ...pending(B.suresh, 'ON_HOLD', pendingFmb(B.suresh), '2.4 acres'),
    reviewNotes: 'On hold until the land survey number is confirmed.',
    history: [{ at: '2026-09-24T15:00:00Z', actor: 'Reviewer', label: 'Note added', tone: 'neutral', note: 'On hold until the land survey number is confirmed.' }],
  },
  pending(B.karthik, 'PENDING_REVIEW', pendingFmb(B.karthik), '1.6 acres'),
  pending(B.priya, 'REQUEST_DOCUMENT', MISSING_FMB, '0.8 acres'),
  pending(B.kavitha, 'ON_HOLD', pendingFmb(B.kavitha), '1.1 acres'),
  // Design 57.
  ready(B.anitha),
  ready(B.ramu),
  // Design 58 and the stages after approval.
  approved(B.bala, 'APPROVED'),
  approved(B.meena, 'APPROVED'),
  approved(B.revathi, 'APPROVED'),
  approved(B.vignesh, 'AUDIT_COMPLETED'),
  approved(B.murugan, 'AUDIT_SCHEDULED'),
  approved(B.selvi, 'AUDIT_IN_PROGRESS'),
  approved(B.dinesh, 'AUDIT_COMPLETED'),
  approved(B.lakshmi, 'FINAL_APPROVED'),
  rejected(B.deepa),
  rejected(B.arjun),
];

const BY_CODE = new Map(RECORDS.map((r) => [r.applicationCode, r]));

/**
 * A deep copy of the record for `code` (so local actions never mutate the shared data); an unknown
 * code gets a generic pending record built from the code itself, so the screen never errors.
 */
export function mockApplicationReview(code: string): MockApplicationReview {
  const found = BY_CODE.get(code);
  const record =
    found ??
    pending(
      { code, name: 'Applicant', mobile: '90000 00000', zone: 'Ooty', zoneCode: 'Zone A', method: 'Organic', submitted: '2026-10-01', street: 'Main Road', crops: 'Carrot' },
      'PENDING_REVIEW',
      MISSING_FMB,
      '1.0 acre',
    );
  return structuredClone(record);
}
