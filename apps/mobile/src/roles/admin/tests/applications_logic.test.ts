/**
 * Farmer application review (Module 1, Phase 2D): the pure decisions behind the
 * pending list, the review screen and the reject screen. The screens only pass
 * values through these, so plain-Node vitest covers the rules here and the
 * render tests (applications_*.test.tsx) cover the wiring.
 */
import { describe, expect, it } from 'vitest';
import type { Problem } from '@tohfa/shared-types';
import { ApiError } from '../../../shell/api/client';
import type { ApplicationRowView } from '../api/farmerTypes';
import { t } from '../i18n';
import {
  applicationAccess,
  applicationErrorKey,
  listStatusParam,
  maskAadhaar,
  PENDING_REVIEW_STATUSES,
  pendingRows,
  searchApplications,
  statusTone,
  toPendingApplicationItem,
  validateRejectReason,
} from '../screens/registration/applications/applicationLogic';

function row(over: Partial<ApplicationRowView> = {}): ApplicationRowView {
  return {
    id: 'a-1',
    name: 'Kavitha Raman',
    initials: 'KR',
    mobile: '9876500001',
    status: 'SUBMITTED',
    isDraft: false,
    village: 'Ketti',
    district: 'Nilgiris',
    farmingType: 'Organic',
    primaryCrops: ['Carrot'],
    statedAreaAcres: 2,
    locationCount: 1,
    boundaryCount: 1,
    documentCount: 2,
    aadhaarLast4: '1234',
    submittedAt: '2026-11-01T05:00:00Z',
    createdAt: '2026-10-30T05:00:00Z',
    zoneId: null,
    slaDueAt: null,
    documentsComplete: null,
    applicationCode: null,
    kycStatus: null,
    ...over,
  };
}

function problem(code: string, status: number, meta?: Record<string, unknown>): ApiError {
  return new ApiError({ type: 'about:blank', title: 'x', status, code, ...(meta ? { meta } : {}) } as Problem);
}

const allow = (codes: readonly string[]) => (c: string) => codes.includes(c);

describe('applicationAccess (fail closed, codes only)', () => {
  it('denies everything when no `can` is given', () => {
    expect(applicationAccess(undefined)).toEqual({ canList: false, canView: false, canDecide: false });
  });

  it('a SUPER/TOHFA-like grant can list, view and decide', () => {
    const can = allow([
      'farmer.application.list_pending',
      'farmer.application.view',
      'farmer.application.approve',
      'farmer.application.reject',
    ]);
    expect(applicationAccess(can)).toEqual({ canList: true, canView: true, canDecide: true });
  });

  it('a Farmer-Admin-like grant (approve at view level, no reject) can view but not decide', () => {
    const can = allow(['farmer.application.list_pending', 'farmer.application.view', 'farmer.application.approve']);
    expect(applicationAccess(can)).toEqual({ canList: true, canView: true, canDecide: false });
  });

  it('reject alone does not allow deciding either', () => {
    expect(applicationAccess(allow(['farmer.application.reject'])).canDecide).toBe(false);
  });
});

describe('pending list', () => {
  it('drafts never appear in the pending list (status DRAFT or isDraft)', () => {
    const rows = [
      row({ id: 'd1', status: 'DRAFT', isDraft: true }),
      row({ id: 'd2', status: 'SUBMITTED', isDraft: true }),
      row({ id: 'p1', status: 'SUBMITTED' }),
      row({ id: 'p2', status: 'DOCS_REVIEW' }),
      row({ id: 'p3', status: 'FARM_VERIFICATION' }),
      row({ id: 'p4', status: 'AUDIT' }),
      row({ id: 'x1', status: 'APPROVED' }),
      row({ id: 'x2', status: 'REJECTED' }),
      row({ id: 'x3', status: 'INFO_REQUESTED' }),
    ];
    expect(pendingRows(rows).map((r) => r.id)).toEqual(['p1', 'p2', 'p3', 'p4']);
  });

  it('only sends status values the server list filter accepts', () => {
    expect(PENDING_REVIEW_STATUSES).toEqual(['SUBMITTED', 'DOCS_REVIEW', 'FARM_VERIFICATION', 'AUDIT']);
    expect(listStatusParam('ALL')).toBeUndefined();
    expect(listStatusParam('DOCS_REVIEW')).toBe('DOCS_REVIEW');
  });

  it('search matches name, mobile and village; it never filters by zone or role', () => {
    const rows = [row({ id: '1', name: 'Kavitha', village: 'Ketti' }), row({ id: '2', name: 'Murugan', village: 'Ooty', mobile: '9000000002' })];
    expect(searchApplications(rows, 'kav').map((r) => r.id)).toEqual(['1']);
    expect(searchApplications(rows, 'ooty').map((r) => r.id)).toEqual(['2']);
    expect(searchApplications(rows, '000002').map((r) => r.id)).toEqual(['2']);
    expect(searchApplications(rows, '   ').map((r) => r.id)).toEqual(['1', '2']);
  });

  it('the item handed to the host is built from the row, never a fixture', () => {
    const item = toPendingApplicationItem(row({ village: null, district: 'Nilgiris' }));
    expect(item.id).toBe('a-1');
    expect(item.name).toBe('Kavitha Raman');
    expect(item.location).toBe('Nilgiris');
    expect(item.badgeLabel).toBe(t('farmerApps.status.SUBMITTED'));
    expect(item.phone).toBe('9876500001');
    expect(item.aadhaar).toBe('XXXX XXXX 1234');
    expect(item.farmSize).toBeUndefined();
  });

  it('status tones: approved success, rejected danger, in review warning', () => {
    expect(statusTone('APPROVED')).toBe('success');
    expect(statusTone('REJECTED')).toBe('danger');
    expect(statusTone('SUBMITTED')).toBe('warning');
  });
});

describe('BR-33b: Aadhaar is shown as the last 4 digits only', () => {
  it('BR-33b: masks to XXXX XXXX last4', () => {
    expect(maskAadhaar('4821')).toBe('XXXX XXXX 4821');
  });

  it('BR-33b: a missing or malformed value is not available, never a full number', () => {
    expect(maskAadhaar(null)).toBe(t('farmerApps.notAvailable'));
    expect(maskAadhaar('123456789012')).toBe(t('farmerApps.notAvailable'));
  });
});

describe('reject reason (spec: 5-500 characters)', () => {
  it('needs at least 5 characters after trimming', () => {
    expect(validateRejectReason('   abcd  ')).toBe('tooShort');
    expect(validateRejectReason('abcde')).toBeNull();
  });

  it('allows at most 500 characters', () => {
    expect(validateRejectReason('x'.repeat(500))).toBeNull();
    expect(validateRejectReason('x'.repeat(501))).toBe('tooLong');
  });
});

describe('applicationErrorKey', () => {
  it('BR-69: an approval refused for zero farm locations gets its own message', () => {
    const err = problem('VALIDATION_FAILED', 422, { missingSteps: [3] });
    expect(applicationErrorKey(err)).toBe('farmerApps.error.noLocations');
  });

  it('BR-135: an applicant holding an admin role gets its own message', () => {
    expect(applicationErrorKey(problem('CONFLICT', 409, { rule: 'BR-135' }))).toBe('farmerApps.error.adminApplicant');
  });

  it('anything else goes through the admin error mapping', () => {
    expect(applicationErrorKey(problem('FORBIDDEN', 403))).toBe('admin.error.FORBIDDEN');
    expect(applicationErrorKey(problem('CONFLICT', 409))).toBe('admin.error.CONFLICT');
    expect(applicationErrorKey(problem('VALIDATION_FAILED', 422))).toBe('admin.error.VALIDATION_FAILED');
    expect(applicationErrorKey(new Error('boom'))).toBe('admin.error.generic');
  });
});
