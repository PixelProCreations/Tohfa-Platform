/**
 * Farmer Detail (Farmers Management, Phase 2C): the pure decisions behind the
 * 9-tab screen in screens/farmers/detail/. No React renderer exists in this
 * app's plain-Node vitest, so every gate, every value and every DESIGN-ONLY
 * action lives in detail/model.ts and is tested here; the wiring between the
 * shell and the hooks is checked on the source in farmerDetail_wiring.test.ts.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ApiError, NetworkError } from '../../../shell/api/client';
import type {
  FarmerDetailView,
  FarmerDocumentView,
  FarmerRatingView,
  FarmerSubscriptionView,
  PayoutDestinationView,
} from '../api/farmerTypes';
import en from '../i18n/farmerDetail.en.json';
import {
  accountBadge,
  certificationBadge,
  designActionReducer,
  DESIGN_ACTION_IDLE,
  documentRows,
  bankRows,
  editRatingDraft,
  EDIT_RATING_SAVE_AVAILABLE,
  FARMER_DETAIL_CODES,
  FARMER_DETAIL_TABS,
  farmerDetailAccess,
  farmerDetailFetchIds,
  farmerDetailViewState,
  isNotFoundError,
  kycBadge,
  landLocationCards,
  maskAadhaar,
  normalizeDetailTab,
  PENDING_RBAC_CODES,
  personalRows,
  ratingCategoryRows,
  ratingHero,
  ratingTierCapsule,
  auditRows,
  soilTypesLabel,
  subscriptionRows,
} from '../screens/farmers/detail/model';

const RBAC = fs.readFileSync(path.resolve(__dirname, '../../../../../../docs/rbac.json'), 'utf8');
const DASH = en['farmerDetail.noValue'];

const allow = (codes: readonly string[]) => (c: string) => codes.includes(c);
const ALL = Object.values(FARMER_DETAIL_CODES);

function problem(code: string, status: number) {
  return new ApiError({ type: 'about:blank', title: code, status, code } as never);
}

function farmer(over: Partial<FarmerDetailView> = {}): FarmerDetailView {
  return {
    id: 'f-1',
    farmerCode: 'TOHFA-F-2026-0042',
    name: 'Lakshmi Devi',
    initials: 'LD',
    mobile: '+919000000042',
    email: null,
    status: 'active',
    accountStatus: 'ACTIVE',
    applicationStatus: 'APPROVED',
    kycStatus: 'VERIFIED',
    zoneId: 'z-1',
    zoneName: 'Kotagiri',
    aadhaarLast4: '4321',
    dob: null,
    gender: null,
    farmingExperienceYears: null,
    address: { line1: '4 Tea Estate Road', line2: null, village: 'Kil Kotagiri', taluk: null, district: 'Nilgiris', pincode: '643217' },
    isMarketBlocked: false,
    marketBlockReason: null,
    landLocations: [
      {
        id: 'loc-1',
        name: 'North slope',
        surveyNumber: '112/3',
        areaAcres: 2.5,
        address: null,
        village: 'Kil Kotagiri',
        taluk: null,
        district: 'Nilgiris',
        centroid: { lat: 11.4321, lng: 76.8765 },
        hasBoundary: true,
        isPrimary: true,
        plots: [{ id: 'p-1', name: 'Bed A', areaAcres: 0.5, soilType: 'Clay loam', irrigationType: 'Drip', sunExposure: null }],
      },
    ],
    certification: { total: 1, verifiedCurrent: 0, verifiedExpired: 1, unverified: 0, rejected: 0, expired: 1, qualifying: 0, nextQualifyingExpiry: null },
    overallRating: 74,
    ratingTierCode: 'GOOD',
    ratingTierLabel: 'Good',
    registeredAt: '2026-01-10T04:30:00Z',
    approvedAt: '2026-01-12T05:00:00Z',
    farmingType: null,
    farmProfile: null,
    lifecycle: null,
    lastAuditAt: null,
    ...over,
  };
}

function doc(over: Partial<FarmerDocumentView> = {}): FarmerDocumentView {
  return {
    id: 'd-1',
    docType: 'ID_PROOF',
    mimeType: 'application/pdf',
    sizeBytes: 1000,
    isMandatory: true,
    verificationStatus: 'UNVERIFIED',
    isVerified: false,
    verifiedAt: null,
    rejectReason: null,
    uploadedAt: '2026-01-10T04:30:00Z',
    readUrl: null,
    fileName: null,
    ...over,
  };
}

describe('Farmer Detail access (fail closed, code-only)', () => {
  it('missing can denies everything', () => {
    const a = farmerDetailAccess(undefined);
    expect(Object.values(a).every((v) => v === false)).toBe(true);
  });

  it('without farmer.profile.view_all nothing else is granted, whatever else is held', () => {
    const a = farmerDetailAccess(allow(ALL.filter((c) => c !== FARMER_DETAIL_CODES.view)));
    expect(Object.values(a).every((v) => v === false)).toBe(true);
  });

  it('Edit is hidden without farmer.profile.edit', () => {
    expect(farmerDetailAccess(allow([FARMER_DETAIL_CODES.view])).canEdit).toBe(false);
    expect(farmerDetailAccess(allow([FARMER_DETAIL_CODES.view, 'farmer.profile.edit'])).canEdit).toBe(true);
  });

  it('Disable needs farmer.account.disable', () => {
    expect(farmerDetailAccess(allow([FARMER_DETAIL_CODES.view])).canDisable).toBe(false);
    expect(farmerDetailAccess(allow([FARMER_DETAIL_CODES.view, 'farmer.account.disable'])).canDisable).toBe(true);
  });

  it('Deactivate stays hidden when can has no farmer.account.deactivate (nobody holds it yet)', () => {
    const tohfaLike = allow(ALL.filter((c) => c !== 'farmer.account.deactivate'));
    expect(farmerDetailAccess(tohfaLike).canDeactivate).toBe(false);
    expect(farmerDetailAccess(tohfaLike).canDisable).toBe(true);
  });

  it('Verify document only with farmer.document.verify (and the documents themselves need farmer.document.view)', () => {
    const viewer = farmerDetailAccess(allow([FARMER_DETAIL_CODES.view, 'farmer.document.view']));
    expect(viewer.canViewDocuments).toBe(true);
    expect(viewer.canVerifyDocuments).toBe(false);
    const verifier = farmerDetailAccess(allow([FARMER_DETAIL_CODES.view, 'farmer.document.view', 'farmer.document.verify']));
    expect(verifier.canVerifyDocuments).toBe(true);
  });

  it('Edit Rating hidden without farmer.rating.edit', () => {
    expect(farmerDetailAccess(allow(ALL.filter((c) => c !== 'farmer.rating.edit'))).canEditRating).toBe(false);
    expect(farmerDetailAccess(allow([FARMER_DETAIL_CODES.view, 'farmer.rating.edit'])).canEditRating).toBe(true);
  });

  it('BR-53a: bank accounts only with farmer.bank_account.view', () => {
    expect(farmerDetailAccess(allow([FARMER_DETAIL_CODES.view])).canViewBankAccounts).toBe(false);
    expect(farmerDetailAccess(allow([FARMER_DETAIL_CODES.view, 'farmer.bank_account.view'])).canViewBankAccounts).toBe(true);
  });

  it('plot/soil design actions follow viewing the page (owner: bring the design, decide later)', () => {
    expect(farmerDetailAccess(allow([FARMER_DETAIL_CODES.view])).canUseRecordDesignActions).toBe(true);
    expect(farmerDetailAccess(allow([])).canUseRecordDesignActions).toBe(false);
  });

  it('every code it checks exists in docs/rbac.json, except the two the owner has not defined yet', () => {
    for (const c of ALL) {
      if ((PENDING_RBAC_CODES as readonly string[]).includes(c)) continue;
      expect(RBAC.includes(`"${c}"`), c).toBe(true);
    }
    expect([...PENDING_RBAC_CODES].sort()).toEqual(['farmer.account.deactivate', 'farmer.rating.edit']);
  });
});

describe('Farmer Detail fetch gating (no API call without view_all)', () => {
  it('without view_all no query gets an id', () => {
    const ids = farmerDetailFetchIds(farmerDetailAccess(allow(ALL.filter((c) => c !== FARMER_DETAIL_CODES.view))), 'f-1');
    expect(ids).toEqual({ farmer: undefined, documents: undefined, bankAccounts: undefined, subscription: undefined, rating: undefined });
  });

  it('missing can: no query gets an id', () => {
    const ids = farmerDetailFetchIds(farmerDetailAccess(undefined), 'f-1');
    expect(Object.values(ids).every((v) => v === undefined)).toBe(true);
  });

  it('each tab query needs its own read code too', () => {
    const ids = farmerDetailFetchIds(farmerDetailAccess(allow([FARMER_DETAIL_CODES.view])), 'f-1');
    expect(ids).toEqual({ farmer: 'f-1', documents: undefined, bankAccounts: undefined, subscription: undefined, rating: undefined });
    const all = farmerDetailFetchIds(farmerDetailAccess(allow(ALL)), 'f-1');
    expect(all).toEqual({ farmer: 'f-1', documents: 'f-1', bankAccounts: 'f-1', subscription: 'f-1', rating: 'f-1' });
  });
});

describe('Farmer Detail view state', () => {
  const base = { canView: true, hasFarmerId: true, isLoading: false, error: null, hasFarmer: false };

  it('denied without view_all (a neutral not-available state)', () => {
    expect(farmerDetailViewState({ ...base, canView: false, hasFarmer: true })).toBe('denied');
  });

  it('loading while the profile is fetched', () => {
    expect(farmerDetailViewState({ ...base, isLoading: true })).toBe('loading');
  });

  it('BR-108a: a 404 (out of scope or missing) is the not-found state, not an error', () => {
    expect(isNotFoundError(problem('NOT_FOUND', 404))).toBe(true);
    expect(farmerDetailViewState({ ...base, error: problem('NOT_FOUND', 404) })).toBe('notFound');
  });

  it('any other failure is the error state', () => {
    expect(isNotFoundError(new NetworkError('offline'))).toBe(false);
    expect(farmerDetailViewState({ ...base, error: new NetworkError('offline') })).toBe('error');
    expect(farmerDetailViewState({ ...base, error: problem('INTERNAL', 500) })).toBe('error');
  });

  it('no farmer id is not found', () => {
    expect(farmerDetailViewState({ ...base, hasFarmerId: false })).toBe('notFound');
  });

  it('a loaded profile is ready even while a refresh fails', () => {
    expect(farmerDetailViewState({ ...base, hasFarmer: true, error: new NetworkError('x') })).toBe('ready');
  });
});

describe('Farmer Detail tabs', () => {
  it('the design 9 tabs, in order', () => {
    expect(FARMER_DETAIL_TABS).toEqual(['Personal', 'Farm & land', 'Soil', 'Product listing', 'KYC', 'Ratings', 'Subscription', 'Audit', 'History']);
  });

  it("Dev's old tab names still land on the right tab (App.tsx keeps 'Overview'/'Farm')", () => {
    expect(normalizeDetailTab(undefined)).toBe('Personal');
    expect(normalizeDetailTab('Overview')).toBe('Personal');
    expect(normalizeDetailTab('Farm')).toBe('Farm & land');
    expect(normalizeDetailTab('KYC')).toBe('KYC');
  });
});

describe('Personal tab', () => {
  it('BR-33b: Aadhaar is never shown beyond the last four digits', () => {
    expect(maskAadhaar('4321')).toBe('XXXX XXXX 4321');
    expect(maskAadhaar(null)).toBe(DASH);
    expect(maskAadhaar('123456789012')).toBe(DASH);
    const rows = personalRows(farmer({ aadhaarLast4: '4321' }));
    const aadhaar = rows.find((r) => r.label === en['farmerDetail.personal.aadhaar']);
    expect(aadhaar?.value).toBe('XXXX XXXX 4321');
    expect(aadhaar?.locked).toBe(true);
    expect(JSON.stringify(rows)).not.toMatch(/[0-9]{5,}4321/);
  });

  it('shows the API values and the locked mobile (Dev behaviour preserved)', () => {
    const rows = personalRows(farmer());
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r]));
    expect(byLabel[en['farmerDetail.personal.name']]?.value).toBe('Lakshmi Devi');
    expect(byLabel[en['farmerDetail.personal.farmerId']]?.value).toBe('TOHFA-F-2026-0042');
    expect(byLabel[en['farmerDetail.personal.phone']]?.value).toBe('+919000000042');
    expect(byLabel[en['farmerDetail.personal.phone']]?.locked).toBe(true);
    expect(byLabel[en['farmerDetail.personal.zone']]?.value).toBe('Kotagiri');
    expect(byLabel[en['farmerDetail.personal.address']]?.value).toBe('4 Tea Estate Road, Kil Kotagiri, Nilgiris, 643217');
  });

  it('fields with no API show a dash, never fixture text', () => {
    const rows = personalRows(farmer({ zoneName: null }));
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));
    expect(byLabel[en['farmerDetail.personal.farmingType']]).toBe(DASH);
    expect(byLabel[en['farmerDetail.personal.farmProfile']]).toBe(DASH);
    expect(byLabel[en['farmerDetail.personal.zone']]).toBe(DASH);
    expect(JSON.stringify(rows)).not.toMatch(/Natural|Mixed vegetable|Coonoor|Ramesh/);
  });

  it('a DISABLED farmer is shown as Disabled, never as Pending', () => {
    expect(accountBadge('disabled')).toEqual({ label: en['farmerDetail.status.disabled'], tone: 'danger' });
    expect(accountBadge('active').tone).toBe('success');
  });

  it('badges come from the API: KYC status and the certification summary', () => {
    expect(kycBadge('VERIFIED')).toEqual({ label: en['farmerDetail.badge.kycVerified'], tone: 'success' });
    expect(kycBadge('PENDING').tone).toBe('warning');
    expect(certificationBadge(farmer().certification)).toEqual({ label: en['farmerDetail.badge.certExpired'], tone: 'danger' });
    expect(certificationBadge({ ...farmer().certification, expired: 0, verifiedExpired: 0, verifiedCurrent: 1 })?.tone).toBe('success');
    expect(certificationBadge({ ...farmer().certification, total: 0, expired: 0, verifiedExpired: 0 })).toBeNull();
  });

  it("the rating tier capsule shows the API's 0-100 score and tier label (Dev behaviour, not converted to stars)", () => {
    expect(ratingTierCapsule(farmer())).toBe('★ 74 · Good');
    expect(ratingTierCapsule(farmer({ overallRating: null, ratingTierLabel: null }))).toBe(`★ ${DASH}`);
  });
});

describe('Farm & land tab', () => {
  it('cards come from the land locations, plots read-only; no GPS/centroid ever reaches the view', () => {
    const cards = landLocationCards(farmer());
    expect(cards).toHaveLength(1);
    expect(cards[0]?.title).toBe('North slope');
    expect(cards[0]?.plots.map((p) => p.name)).toEqual(['Bed A']);
    expect(cards[0]?.hasBoundary).toBe(true);
    const text = JSON.stringify(cards);
    expect(text).not.toMatch(/11\.43|76\.87|centroid|lat|lng/);
  });

  it('plot codes and the submitted date have no API: a dash, never PLT-00124-1', () => {
    const card = landLocationCards(farmer())[0];
    expect(card?.submitted).toBe(DASH);
    expect(JSON.stringify(card)).not.toMatch(/PLT-|Tomato|Rectangular/);
  });

  it('Soil shows the plot soil types the API sends, or a dash', () => {
    expect(soilTypesLabel(farmer())).toBe('Clay loam');
    expect(soilTypesLabel(farmer({ landLocations: [] }))).toBe(DASH);
  });
});

describe('KYC tab', () => {
  it('rows are the API documents; Verify only with farmer.document.verify and only for an unverified document', () => {
    const docs = [doc(), doc({ id: 'd-2', docType: 'FARM_DOC', verificationStatus: 'VERIFIED', isVerified: true })];
    const viewer = documentRows(docs, farmerDetailAccess(allow([FARMER_DETAIL_CODES.view, 'farmer.document.view'])));
    expect(viewer.map((r) => r.canVerify)).toEqual([false, false]);
    const verifier = documentRows(
      docs,
      farmerDetailAccess(allow([FARMER_DETAIL_CODES.view, 'farmer.document.view', 'farmer.document.verify'])),
    );
    expect(verifier.map((r) => r.canVerify)).toEqual([true, false]);
    expect(verifier[0]?.label).toBe(en['farmerDetail.kyc.docType.ID_PROOF']);
    expect(verifier[1]?.status).toBe(en['farmerDetail.kyc.status.VERIFIED']);
  });

  it('BR-53a: bank rows carry the last four digits only', () => {
    const dest: PayoutDestinationView = {
      id: 'b-1',
      kind: 'BANK',
      accountHolderName: 'Lakshmi Devi',
      accountNumberLast4: '9876',
      ifsc: 'SBIN0001234',
      bankName: 'State Bank',
      branchName: null,
      upiVpa: null,
      isVerified: true,
      isDefault: true,
    };
    const rows = bankRows([dest]);
    expect(rows[0]?.value).toBe('State Bank · XXXX 9876');
    expect(rows[0]?.tone).toBe('success');
  });
});

describe('Ratings tab (read-only, BR-06)', () => {
  const rating: FarmerRatingView = {
    isRated: true,
    status: 'COMPLETE',
    overallRating: 74,
    ratingTierCode: 'GOOD',
    ratedAt: '2026-10-15T05:00:00Z',
    periodLabel: '2026-Q4',
    source: 'AUDIT',
    sourceAuditId: 'a-1',
    categories: [
      { code: 'CERTIFICATION', score: 8, maxScore: 10 },
      { code: 'NEW_CODE', score: null, maxScore: 10 },
    ],
    history: null,
  };

  it('the hero shows the API figure out of 100, not stars', () => {
    expect(ratingHero(rating).score).toBe('74 / 100');
    expect(ratingHero({ ...rating, isRated: false, overallRating: null, ratedAt: null }).score).toBe(`${DASH} / 100`);
  });

  it('category labels are the client catalogue; an unknown code shows the code', () => {
    const rows = ratingCategoryRows(rating);
    expect(rows[0]).toEqual({ code: 'CERTIFICATION', label: en['farmerDetail.rating.category.CERTIFICATION'], score: '8/10' });
    expect(rows[1]).toEqual({ code: 'NEW_CODE', label: 'NEW_CODE', score: `${DASH}/10` });
  });

  it('Edit Rating Save is unwired: no endpoint (DESIGN-ONLY, owner decision pending)', () => {
    expect(EDIT_RATING_SAVE_AVAILABLE).toBe(false);
    expect(editRatingDraft(rating)).toEqual({ CERTIFICATION: 8, NEW_CODE: null });
  });
});

describe('Subscription and Audit tabs', () => {
  it('subscription rows come from the API; plan name and payment history have no API', () => {
    const sub: FarmerSubscriptionView = {
      hasSubscription: true,
      tier: 'PAID',
      status: 'ACTIVE',
      periodStart: '2026-01-10T00:00:00Z',
      periodEnd: '2027-01-10T00:00:00Z',
      limitsEnforced: false,
      listingLimit: null,
      planName: null,
      paymentHistory: null,
    };
    const rows = Object.fromEntries(subscriptionRows(sub).map((r) => [r.label, r.value]));
    expect(rows[en['farmerDetail.subscription.plan']]).toBe(en['farmerDetail.subscription.tier.PAID']);
    expect(rows[en['farmerDetail.subscription.status']]).toBe(en['farmerDetail.subscription.state.ACTIVE']);
    expect(rows[en['farmerDetail.subscription.paymentHistory']]).toBe(DASH);
    expect(JSON.stringify(rows)).not.toMatch(/Basic/);
  });

  it('audit rows: certification from the summary, audit fields a dash', () => {
    const rows = Object.fromEntries(auditRows(farmer()).map((r) => [r.label, r.value]));
    expect(rows[en['farmerDetail.audit.certification']]).toBe(en['farmerDetail.audit.cert.expired']);
    expect(rows[en['farmerDetail.audit.latestAudit']]).toBe(DASH);
    expect(rows[en['farmerDetail.audit.nextAudit']]).toBe(DASH);
    expect(JSON.stringify(rows)).not.toMatch(/AUD-2026/);
  });
});

describe('DESIGN-ONLY actions (Disable, Deactivate, plot/soil Verify, Flag, Request correction)', () => {
  it('opening a modal remembers the record; confirming changes nothing and shows the not-available note', () => {
    let s = designActionReducer(DESIGN_ACTION_IDLE, { type: 'open', kind: 'verify', record: 'North slope' });
    expect(s).toMatchObject({ kind: 'verify', record: 'North slope', notice: false });
    const before = landLocationCards(farmer());
    s = designActionReducer(s, { type: 'confirm' });
    expect(s).toMatchObject({ kind: 'verify', record: 'North slope', notice: true });
    // The displayed state is derived from the API view only: nothing a confirm does can change it.
    expect(landLocationCards(farmer())).toEqual(before);
  });

  it('a reason-required action asks for the reason first, and still never succeeds', () => {
    for (const kind of ['flag', 'correction', 'disable', 'deactivate'] as const) {
      let s = designActionReducer(DESIGN_ACTION_IDLE, { type: 'open', kind, record: 'X' });
      s = designActionReducer(s, { type: 'confirm' });
      expect(s).toMatchObject({ kind, reasonMissing: true, notice: false });
      s = designActionReducer(s, { type: 'reason', value: 'Boundary looks wrong' });
      s = designActionReducer(s, { type: 'confirm' });
      expect(s).toMatchObject({ kind, reasonMissing: false, notice: true });
    }
  });

  it('close resets to idle', () => {
    const s = designActionReducer({ ...DESIGN_ACTION_IDLE, kind: 'flag', reason: 'x' }, { type: 'close' });
    expect(s).toEqual(DESIGN_ACTION_IDLE);
  });
});
