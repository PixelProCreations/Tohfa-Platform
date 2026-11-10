/**
 * roles/admin/api/farmerMappers.ts: the /admin/farmers and
 * /admin/farmer-applications DTOs -> the Farmers Management view-models.
 *
 * The fixtures below are realistic API bodies and live ONLY in this file. What
 * the API does not send stays null in the view-model (never a demo value), and
 * every mapper copies named fields only (an allow-list), so a field a future
 * server adds cannot reach a screen.
 */
import { describe, expect, it } from 'vitest';
import type { FarmerApplicationDto } from '../api/farmerApplications';
import type {
  AdminFarmerDetailDto,
  AdminFarmerDocumentDto,
  AdminFarmerListItemDto,
  AdminFarmerPayoutDestinationDto,
  AdminFarmerSubscriptionDto,
  FarmRatingDto,
} from '../api/farmers';
import {
  accountStatusUi,
  buildFarmerPatch,
  farmerInitials,
  toApplicationDetail,
  toApplicationRow,
  toEditFarmerForm,
  toFarmerDetail,
  toFarmerDocument,
  toFarmerRating,
  toFarmerRow,
  toFarmerSubscription,
  toPayoutDestination,
} from '../api/farmerMappers';

const FARMER = '33333333-3333-4333-8333-333333333333';
const ZONE = '55555555-5555-4555-8555-555555555555';
const APP = '66666666-6666-4666-8666-666666666666';

const listItem: AdminFarmerListItemDto = {
  id: FARMER,
  tohfaFarmerId: 'TOHFA-F-2026-0114',
  fullName: 'Murugan Selvam',
  mobile: '+919812345678',
  accountStatus: 'ACTIVE',
  applicationStatus: 'APPROVED',
  kycStatus: 'VERIFIED',
  zone: { id: ZONE, code: 'COONOOR', name: 'Coonoor' },
  overallRating: 78,
  ratingTier: { code: 'GOOD', label: 'Good' },
  landLocationCount: 2,
  isMarketBlocked: false,
  createdAt: '2026-01-10T04:30:00.000Z',
};

const detail: AdminFarmerDetailDto = {
  id: FARMER,
  tohfaFarmerId: 'TOHFA-F-2026-0114',
  fullName: 'Murugan Selvam',
  mobile: '+919812345678',
  email: null,
  accountStatus: 'ACTIVE',
  applicationStatus: 'APPROVED',
  kycStatus: 'VERIFIED',
  zone: { id: ZONE, code: 'COONOOR', name: 'Coonoor' },
  aadhaarLast4: '4821',
  dob: '1982-04-12',
  gender: 'MALE',
  farmingExperienceYears: 14,
  address: { line1: '12 Hill Road', line2: null, village: 'Ithalar', taluk: 'Coonoor', district: 'Nilgiris', pincode: '643101' },
  isMarketBlocked: false,
  marketBlockReason: null,
  landLocations: [
    {
      id: '88888888-8888-4888-8888-888888888881',
      name: 'Home plot',
      surveyNumber: '112/3',
      areaAcres: 2.25,
      address: null,
      village: 'Ithalar',
      taluk: 'Coonoor',
      district: 'Nilgiris',
      centroid: { lat: 11.35, lng: 76.79 },
      hasBoundary: true,
      isPrimary: true,
      plots: [
        { id: '99999999-9999-4999-8999-999999999991', name: 'Zone A', areaAcres: 1.25, soilType: 'Loam', irrigationType: 'Drip', sunExposure: null },
      ],
    },
  ],
  certificationSummary: {
    total: 2,
    verified: 1,
    verifiedCurrent: 0,
    verifiedExpired: 1,
    unverified: 1,
    rejected: 0,
    expired: 1,
    qualifying: 0,
    nextQualifyingExpiry: null,
  },
  rating: { overallRating: 78, ratingTier: { code: 'GOOD', label: 'Good' } },
  approvedAt: '2026-01-12T06:00:00.000Z',
  createdAt: '2026-01-10T04:30:00.000Z',
};

describe('farmer list row', () => {
  it('copies the identity, zone, rating and statuses the API sends', () => {
    const row = toFarmerRow(listItem);
    expect(row).toMatchObject({
      id: FARMER,
      farmerCode: 'TOHFA-F-2026-0114',
      name: 'Murugan Selvam',
      initials: 'MS',
      mobile: '+919812345678',
      zoneId: ZONE,
      zoneName: 'Coonoor',
      status: 'active',
      kycStatus: 'VERIFIED',
      applicationStatus: 'APPROVED',
      overallRating: 78,
      ratingTierCode: 'GOOD',
      ratingTierLabel: 'Good',
      landLocationCount: 2,
      isMarketBlocked: false,
      registeredAt: '2026-01-10T04:30:00.000Z',
    });
  });

  it('leaves every design field the API cannot supply as null, never a demo value', () => {
    const row = toFarmerRow(listItem);
    expect(row.farmingType).toBeNull();
    expect(row.farmName).toBeNull();
    expect(row.subscriptionLabel).toBeNull();
    expect(row.hasExpiredCertification).toBeNull();
  });

  it('a farmer never rated and without a zone shows no rating and no zone', () => {
    const row = toFarmerRow({ ...listItem, overallRating: null, ratingTier: null, zone: null });
    expect(row).toMatchObject({ overallRating: null, ratingTierCode: null, ratingTierLabel: null, zoneId: null, zoneName: null });
  });

  it('is an allow-list: an unknown server field never reaches the row (BR-16)', () => {
    const row = toFarmerRow({ ...listItem, farmGps: '11.35,76.79' } as AdminFarmerListItemDto);
    expect(row).not.toHaveProperty('farmGps');
  });
});

describe('account status', () => {
  it('maps PENDING / ACTIVE / DISABLED; a disabled farmer is never shown as pending', () => {
    expect(accountStatusUi('ACTIVE')).toBe('active');
    expect(accountStatusUi('PENDING')).toBe('pending');
    expect(accountStatusUi('DISABLED')).toBe('disabled');
  });

  it("an unknown status is 'unknown'", () => {
    expect(accountStatusUi('SUSPENDED')).toBe('unknown');
  });
});

describe('farmerInitials', () => {
  it('takes the first letter of the first and last words', () => {
    expect(farmerInitials('Ramesh Kumar')).toBe('RK');
    expect(farmerInitials('  selvi  ')).toBe('S');
    expect(farmerInitials('Muthu Kumar S.')).toBe('MS');
  });

  it('is empty for a blank name', () => {
    expect(farmerInitials('   ')).toBe('');
  });
});

describe('farmer detail', () => {
  it('BR-108c: copies profile, address, land locations with plots and the certification summary', () => {
    const view = toFarmerDetail(detail);
    expect(view).toMatchObject({
      id: FARMER,
      farmerCode: 'TOHFA-F-2026-0114',
      name: 'Murugan Selvam',
      initials: 'MS',
      mobile: '+919812345678',
      email: null,
      status: 'active',
      kycStatus: 'VERIFIED',
      zoneName: 'Coonoor',
      dob: '1982-04-12',
      gender: 'MALE',
      farmingExperienceYears: 14,
      address: { line1: '12 Hill Road', line2: null, village: 'Ithalar', taluk: 'Coonoor', district: 'Nilgiris', pincode: '643101' },
      overallRating: 78,
      ratingTierCode: 'GOOD',
      registeredAt: '2026-01-10T04:30:00.000Z',
      approvedAt: '2026-01-12T06:00:00.000Z',
      certification: { total: 2, verifiedCurrent: 0, verifiedExpired: 1, expired: 1, qualifying: 0, nextQualifyingExpiry: null },
    });
    expect(view.landLocations).toHaveLength(1);
    expect(view.landLocations[0]).toMatchObject({
      name: 'Home plot',
      surveyNumber: '112/3',
      areaAcres: 2.25,
      hasBoundary: true,
      isPrimary: true,
      centroid: { lat: 11.35, lng: 76.79 },
    });
    expect(view.landLocations[0]?.plots[0]).toMatchObject({ name: 'Zone A', areaAcres: 1.25, soilType: 'Loam', irrigationType: 'Drip' });
  });

  it('BR-33b: only the last four Aadhaar digits are kept', () => {
    const view = toFarmerDetail(detail);
    expect(view.aadhaarLast4).toBe('4821');
    expect(Object.keys(view).filter((k) => /aadhaar/i.test(k))).toEqual(['aadhaarLast4']);
  });

  it('BR-33b: a malformed aadhaarLast4 is dropped, not shown', () => {
    expect(toFarmerDetail({ ...detail, aadhaarLast4: '123412341234' }).aadhaarLast4).toBeNull();
  });

  it('design fields with no API source are null', () => {
    const view = toFarmerDetail(detail);
    expect(view.farmingType).toBeNull();
    expect(view.farmProfile).toBeNull();
    expect(view.lifecycle).toBeNull();
    expect(view.lastAuditAt).toBeNull();
  });
});

describe('edit form and patch', () => {
  const initial = toEditFarmerForm(detail);

  it('pre-fills the editable and locked fields from the profile', () => {
    expect(initial).toEqual({
      fullName: 'Murugan Selvam',
      email: '',
      dob: '1982-04-12',
      gender: 'MALE',
      farmingExperienceYears: 14,
      addressLine1: '12 Hill Road',
      addressLine2: '',
      village: 'Ithalar',
      taluk: 'Coonoor',
      district: 'Nilgiris',
      pincode: '643101',
      mobile: '+919812345678',
      aadhaarLast4: '4821',
    });
  });

  it('sends nothing when nothing changed', () => {
    expect(buildFarmerPatch(initial, { ...initial }, { canEditLockedFields: false })).toBeNull();
  });

  it('sends only the changed fields, trimmed; a cleared optional field is null', () => {
    const edited = { ...initial, fullName: '  Murugan S  ', village: '  ', email: 'm@example.in' };
    expect(buildFarmerPatch(initial, edited, { canEditLockedFields: false })).toEqual({
      fullName: 'Murugan S',
      village: null,
      email: 'm@example.in',
    });
  });

  it('BR-33a: never sends mobile or aadhaarLast4 for a caller without farmer.profile.edit_locked_field', () => {
    const edited = { ...initial, mobile: '+919800000000', aadhaarLast4: '0000', pincode: '643001' };
    const patch = buildFarmerPatch(initial, edited, { canEditLockedFields: false });
    expect(patch).toEqual({ pincode: '643001' });
  });

  it('BR-33a: a locked-field holder sends a changed mobile and aadhaarLast4, never the key aadhaar', () => {
    const edited = { ...initial, mobile: '+919800000000', aadhaarLast4: '0000' };
    const patch = buildFarmerPatch(initial, edited, { canEditLockedFields: true });
    expect(patch).toEqual({ mobile: '+919800000000', aadhaarLast4: '0000' });
    expect(patch).not.toHaveProperty('aadhaar');
  });

  it('a changed gender or experience is sent as the typed value', () => {
    const edited = { ...initial, gender: null, farmingExperienceYears: 15 };
    expect(buildFarmerPatch(initial, edited, { canEditLockedFields: false })).toEqual({ gender: null, farmingExperienceYears: 15 });
  });
});

describe('documents, payout destinations, subscription, rating', () => {
  const doc: AdminFarmerDocumentDto = {
    id: '44444444-4444-4444-8444-444444444444',
    docType: 'ID_PROOF',
    mimeType: 'application/pdf',
    sizeBytes: 182_000,
    isMandatory: true,
    verificationStatus: 'UNVERIFIED',
    verifiedBy: null,
    verifiedAt: null,
    rejectReason: null,
    uploadedAt: '2026-01-10T04:40:00.000Z',
    readUrl: 'https://storage.example/signed?sig=abc',
  };

  it('BR-108e: a document row carries its verification state and signed URL', () => {
    expect(toFarmerDocument(doc)).toEqual({
      id: doc.id,
      docType: 'ID_PROOF',
      mimeType: 'application/pdf',
      sizeBytes: 182_000,
      isMandatory: true,
      verificationStatus: 'UNVERIFIED',
      isVerified: false,
      verifiedAt: null,
      rejectReason: null,
      uploadedAt: '2026-01-10T04:40:00.000Z',
      readUrl: 'https://storage.example/signed?sig=abc',
      fileName: null,
    });
    expect(toFarmerDocument({ ...doc, verificationStatus: 'VERIFIED' }).isVerified).toBe(true);
  });

  it('BR-53a: a payout destination shows only the last four account digits', () => {
    const bank: AdminFarmerPayoutDestinationDto = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      kind: 'BANK',
      accountHolderName: 'Murugan Selvam',
      accountNumberLast4: '9012',
      ifsc: 'SBIN0001234',
      bankName: 'State Bank of India',
      branchName: 'Coonoor',
      upiVpa: null,
      isVerified: true,
      isDefault: true,
      createdAt: '2026-01-11T00:00:00.000Z',
    };
    expect(toPayoutDestination(bank)).toEqual({
      id: bank.id,
      kind: 'BANK',
      accountHolderName: 'Murugan Selvam',
      accountNumberLast4: '9012',
      ifsc: 'SBIN0001234',
      bankName: 'State Bank of India',
      branchName: 'Coonoor',
      upiVpa: null,
      isVerified: true,
      isDefault: true,
    });
    expect(toPayoutDestination({ ...bank, accountNumberLast4: '123456789012' }).accountNumberLast4).toBeNull();
  });

  it('BR-14b: free-tier limits stay null while the gate is off; no plan name is invented', () => {
    const sub: AdminFarmerSubscriptionDto = {
      farmerId: FARMER,
      current: { tier: 'PAID', status: 'ACTIVE', periodStart: '2026-01-10', periodEnd: '2027-01-10' },
      freeTierLimits: { enforced: false, listingLimit: null },
    };
    expect(toFarmerSubscription(sub)).toEqual({
      hasSubscription: true,
      tier: 'PAID',
      status: 'ACTIVE',
      periodStart: '2026-01-10',
      periodEnd: '2027-01-10',
      limitsEnforced: false,
      listingLimit: null,
      planName: null,
      paymentHistory: null,
    });
    expect(toFarmerSubscription({ ...sub, current: null })).toMatchObject({ hasSubscription: false, tier: null, status: null });
  });

  it('BR-06: the rating view carries the 10 category codes and scores as sent, read-only', () => {
    const rating: FarmRatingDto = {
      farmerId: FARMER,
      periodLabel: '2026-27 Q1',
      status: 'COMPLETE',
      modules: Array.from({ length: 10 }, (_, i) => ({ categoryCode: `CAT_${i + 1}`, score: 7, maxScore: 10 as const })),
      overallRating: 70,
      ratingTier: 'GOOD',
      ratedAt: '2026-10-15T05:00:00.000Z',
      source: 'AUDIT',
      sourceAuditId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    };
    const view = toFarmerRating(rating);
    expect(view).toMatchObject({
      isRated: true,
      overallRating: 70,
      ratingTierCode: 'GOOD',
      ratedAt: '2026-10-15T05:00:00.000Z',
      periodLabel: '2026-27 Q1',
      source: 'AUDIT',
      sourceAuditId: rating.sourceAuditId,
      history: null,
    });
    expect(view.categories).toHaveLength(10);
    expect(view.categories[0]).toEqual({ code: 'CAT_1', score: 7, maxScore: 10 });
    expect(view).not.toHaveProperty('canEdit');
  });

  it('BR-06: a never-rated farmer is not rated and shows no scores', () => {
    const view = toFarmerRating({
      farmerId: FARMER,
      periodLabel: 'CYCLE-1',
      status: 'DRAFT',
      modules: Array.from({ length: 10 }, (_, i) => ({ categoryCode: `CAT_${i + 1}`, score: null, maxScore: 10 as const })),
      overallRating: null,
      ratingTier: null,
      ratedAt: null,
      source: null,
      sourceAuditId: null,
    });
    expect(view.isRated).toBe(false);
    expect(view.overallRating).toBeNull();
    expect(view.categories.every((c) => c.score === null)).toBe(true);
  });
});

describe('applications', () => {
  const application: FarmerApplicationDto = {
    id: APP,
    mobile: '+919876500124',
    fullName: 'Lakshmi Raman',
    preferredLocale: 'ta',
    status: 'SUBMITTED',
    isDraft: false,
    currentStep: 5,
    completedSteps: [1, 2, 3, 4],
    step1Personal: {
      fullName: 'Lakshmi Raman',
      dob: '12 / 04 / 1985',
      gender: 'Female',
      aadhaarLast4: '3390',
      addressLine1: '4 Market Street',
      village: 'Kotagiri',
      taluk: 'Kotagiri',
      district: 'Nilgiris',
      pincode: '643217',
    },
    step2FarmDetails: {
      farmName: 'Great Earth Organic',
      typeOfFarming: 'Organic',
      experienceYears: 9,
      totalAreaAcres: 2.8,
      numberOfFarms: 2,
      waterSource: 'Stream',
      primaryCrops: ['Potato', 'Garlic'],
    },
    step3Location: {
      locations: [
        { id: 'loc-1', label: 'Home plot', areaAcres: 1.5, latitude: 11.42, longitude: 76.86, village: 'Kotagiri' },
        {
          id: 'loc-2',
          label: 'Hill plot',
          areaAcres: 1.1,
          fmbPolygon: { type: 'Polygon', coordinates: [[[76.8, 11.4], [76.81, 11.4], [76.81, 11.41], [76.8, 11.4]]] },
        },
      ],
    },
    step4Documents: {
      documents: [
        { docType: 'ID_PROOF', fileUrl: 'https://storage.example/id.pdf', fileName: 'aadhaar.pdf', docSubType: 'Aadhaar Card' },
        { docType: 'FARM_DOC', fileUrl: 'https://storage.example/patta.pdf', docSubType: 'Patta' },
      ],
    },
    submittedAt: '2026-11-06T05:00:00.000Z',
    createdAt: '2026-11-05T05:00:00.000Z',
  };

  it('a queue row reads name, place, crops, area and counts from the step payloads', () => {
    expect(toApplicationRow(application)).toEqual({
      id: APP,
      name: 'Lakshmi Raman',
      initials: 'LR',
      mobile: '+919876500124',
      status: 'SUBMITTED',
      isDraft: false,
      village: 'Kotagiri',
      district: 'Nilgiris',
      farmingType: 'Organic',
      primaryCrops: ['Potato', 'Garlic'],
      statedAreaAcres: 2.8,
      locationCount: 2,
      boundaryCount: 1,
      documentCount: 2,
      aadhaarLast4: '3390',
      submittedAt: '2026-11-06T05:00:00.000Z',
      createdAt: '2026-11-05T05:00:00.000Z',
      zoneId: null,
      slaDueAt: null,
      documentsComplete: null,
      applicationCode: null,
      kycStatus: null,
    });
  });

  it('the detail carries the five sections the review screen shows', () => {
    const view = toApplicationDetail(application);
    expect(view.applicant).toEqual({
      name: 'Lakshmi Raman',
      mobile: '+919876500124',
      dob: '12 / 04 / 1985',
      gender: 'Female',
      aadhaarLast4: '3390',
      preferredLocale: 'ta',
      address: { line1: '4 Market Street', line2: null, text: null, village: 'Kotagiri', taluk: 'Kotagiri', district: 'Nilgiris', pincode: '643217' },
    });
    expect(view.farming).toEqual({
      farmName: 'Great Earth Organic',
      typeOfFarming: 'Organic',
      experienceYears: 9,
      statedAreaAcres: 2.8,
      statedNumberOfFarms: 2,
      waterSource: 'Stream',
      primaryCrops: ['Potato', 'Garlic'],
    });
    expect(view.locations).toEqual([
      { id: 'loc-1', label: 'Home plot', areaAcres: 1.5, calculatedAreaAcres: null, village: 'Kotagiri', taluk: null, district: null, hasBoundary: false, gps: { lat: 11.42, lng: 76.86 } },
      { id: 'loc-2', label: 'Hill plot', areaAcres: 1.1, calculatedAreaAcres: null, village: null, taluk: null, district: null, hasBoundary: true, gps: null },
    ]);
    expect(view.documents).toEqual([
      { docType: 'ID_PROOF', docSubType: 'Aadhaar Card', fileName: 'aadhaar.pdf', fileUrl: 'https://storage.example/id.pdf' },
      { docType: 'FARM_DOC', docSubType: 'Patta', fileName: null, fileUrl: 'https://storage.example/patta.pdf' },
    ]);
    expect(view).toMatchObject({
      id: APP,
      status: 'SUBMITTED',
      isDecided: false,
      completedSteps: [1, 2, 3, 4],
      submittedAt: '2026-11-06T05:00:00.000Z',
      tohfaFarmerId: null,
      decidedAt: null,
      rejectionReason: null,
      infoRequest: null,
      zoneId: null,
      applicationCode: null,
      reviewHistory: null,
      documentVerification: null,
      declaration: null,
    });
  });

  it('experience falls back to the legacy step-1 field (kept for older drafts)', () => {
    const legacy = { ...application, step1Personal: { farmingExperienceYears: 6 }, step2FarmDetails: {} };
    expect(toApplicationDetail(legacy).farming.experienceYears).toBe(6);
  });

  it('spec-only fields are used when the server sends them', () => {
    const view = toApplicationDetail({
      ...application,
      status: 'APPROVED',
      tohfaFarmerId: 'TOHFA-F-2026-0201',
      decidedAt: '2026-11-08T05:00:00.000Z',
      zoneId: ZONE,
    });
    expect(view).toMatchObject({ isDecided: true, tohfaFarmerId: 'TOHFA-F-2026-0201', decidedAt: '2026-11-08T05:00:00.000Z', zoneId: ZONE });
  });

  it('survives empty or malformed step payloads without inventing values', () => {
    const bare = { ...application, step1Personal: null, step2FarmDetails: null, step3Location: { locations: 'x' }, step4Documents: null };
    const row = toApplicationRow(bare as unknown as FarmerApplicationDto);
    expect(row).toMatchObject({ village: null, district: null, farmingType: null, primaryCrops: [], statedAreaAcres: null, locationCount: 0, boundaryCount: 0, documentCount: 0, aadhaarLast4: null });
  });

  it('BR-33b: a malformed aadhaarLast4 in the step payload is dropped', () => {
    const bad = { ...application, step1Personal: { aadhaarLast4: '123412341234' } };
    expect(toApplicationRow(bad).aadhaarLast4).toBeNull();
    expect(toApplicationDetail(bad).applicant.aadhaarLast4).toBeNull();
  });
});
