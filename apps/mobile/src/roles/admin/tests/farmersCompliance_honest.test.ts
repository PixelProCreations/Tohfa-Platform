/**
 * Verification & Compliance (screens/farmers/SuperAdminVerificationComplianceScreen.tsx),
 * Farm Records (SuperAdminFarmRecordsListScreen.tsx) and the flow that feeds them
 * (FarmerManagementFlow.tsx) used to show invented people (Ramesh Kumar, Selvi
 * Murugan, M. Anand ...) when the live list was empty, and, for real farmers,
 * invented compliance: KYC derived from account status, a "PGS-India / Organic"
 * certificate expiring 2027-12-31, a "Completed" audit, a 4.5 / 5.0 rating.
 *
 * These tests pin the honest mapping (./complianceMappers.ts: the real value or
 * the dash) and scan the source so a literal cannot creep back in. Pure and
 * source-level, so plain-Node vitest covers it; the rendered states are in
 * farmersCompliance_states.test.tsx.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CertificationDto } from '../api/certifications';
import type { FarmerRowView } from '../api/farmerTypes';
import { ADMIN_NO_VALUE } from '../utils/noValue';
import { t } from '../i18n';
import {
  certificationFields,
  pickCertification,
  toComplianceFarmer,
  type CertificationReadState,
} from '../screens/farmers/complianceMappers';

const ADMIN = path.join(__dirname, '..');
const FARMERS = path.join(ADMIN, 'screens/farmers');
const read = (abs: string) => fs.readFileSync(abs, 'utf8');
/** Source without comments, so a docblock may name what the code must not contain. */
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '');

const NOW = new Date('2026-11-24T06:00:00.000Z');

/** A farmer the API knows nothing compliance-wise about: pending KYC, never rated, no zone. */
function bareRow(over: Partial<FarmerRowView> = {}): FarmerRowView {
  return {
    id: 'f-1',
    farmerCode: 'TOHFA-F-2026-0001',
    name: 'Arun Kumar',
    initials: 'AK',
    mobile: '9876500001',
    zoneId: null,
    zoneName: null,
    status: 'active',
    accountStatus: 'ACTIVE',
    applicationStatus: 'APPROVED',
    kycStatus: 'PENDING',
    overallRating: null,
    ratingTierCode: null,
    ratingTierLabel: null,
    landLocationCount: 0,
    isMarketBlocked: false,
    registeredAt: '2026-09-01T00:00:00.000Z',
    farmingType: null,
    farmName: null,
    subscriptionLabel: null,
    hasExpiredCertification: null,
    ...over,
  };
}

function cert(over: Partial<CertificationDto> = {}): CertificationDto {
  return {
    id: 'c-1',
    farmerId: 'f-1',
    certType: 'PGS',
    customTypeName: null,
    certNumber: 'PGS-0001',
    expiresOn: '2027-03-15',
    verificationStatus: 'VERIFIED',
    blocksListings: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

const readable = (items: CertificationDto[]): CertificationReadState => ({ enabled: true, isLoading: false, error: null, items });

const INVENTED = ['PGS-India / Organic', '2027-12-31', 'Completed', '4.5', '5.0', 'Tier A', 'Today', 'Nilgiris', 'Verified'];

describe('Compliance card: a farmer the API says nothing compliance-wise about', () => {
  const fields = certificationFields({ enabled: true, isLoading: true, error: null, items: [] }, NOW);
  const item = toComplianceFarmer(bareRow(), fields);

  it('BR-06: an unrated farmer shows the dash for score and tier, not 4.5 / 5.0 and Tier A', () => {
    expect(item.ratingScore).toBe(ADMIN_NO_VALUE);
    expect(item.ratingTier).toBe(ADMIN_NO_VALUE);
  });

  it('shows the real KYC status (Pending) for an ACTIVE account, never a status derived from the account', () => {
    expect(item.kycStatus).toBe(t('farmersList.kyc.PENDING'));
    expect(item.kycTone).toBe('neutral');
  });

  it('a farmer with no zone is located by the dash, not "Nilgiris"', () => {
    expect(item.zone).toBe(ADMIN_NO_VALUE);
  });

  it('the internal audit and the last-updated date have no per-farmer source, so they are dashes', () => {
    expect(item.auditStatus).toBe(ADMIN_NO_VALUE);
    expect(item.lastUpdated).toBe(ADMIN_NO_VALUE);
  });

  it('no invented value appears anywhere on the mapped farmer', () => {
    const blob = JSON.stringify(item);
    for (const fake of INVENTED) expect(blob.includes(fake), fake).toBe(false);
  });

  it('carries the real id and farmer code so the flow can find the live farmer again', () => {
    expect(item.id).toBe('f-1');
    expect(item.farmerId).toBe('TOHFA-F-2026-0001');
    expect(item.name).toBe('Arun Kumar');
  });

  it('has no badge unless the server says the farmer is blocked from the market', () => {
    expect(item.badge).toBeUndefined();
    expect(toComplianceFarmer(bareRow({ isMarketBlocked: true }), fields).badge).toBe(t('superAdmin.compliance.badge.marketBlocked'));
  });
});

describe('Compliance card: what the API does send is shown as sent', () => {
  it('BR-06: the 0-100 score and the tier label are the server values, not a 0-5 figure', () => {
    const item = toComplianceFarmer(bareRow({ overallRating: 82, ratingTierCode: 'GOOD', ratingTierLabel: 'Good', zoneName: 'Coonoor' }), certificationFields(readable([]), NOW));
    expect(item.ratingScore).toBe(t('farmersList.card.ratingValue', { score: 82 }));
    expect(item.ratingScore).toBe('82/100');
    expect(item.ratingTier).toBe('Good');
    expect(item.zone).toBe('Coonoor');
  });

  it('KYC follows the server status: Verified is success, Rejected is danger', () => {
    const f = certificationFields(readable([]), NOW);
    const verified = toComplianceFarmer(bareRow({ kycStatus: 'VERIFIED' }), f);
    const rejected = toComplianceFarmer(bareRow({ kycStatus: 'REJECTED' }), f);
    expect(verified.kycStatus).toBe(t('farmersList.kyc.VERIFIED'));
    expect(verified.kycTone).toBe('success');
    expect(rejected.kycStatus).toBe(t('farmersList.kyc.REJECTED'));
    expect(rejected.kycTone).toBe('danger');
  });

  it('a disabled account with VERIFIED KYC is still KYC Verified (the two are different things)', () => {
    const item = toComplianceFarmer(bareRow({ accountStatus: 'DISABLED', status: 'disabled', kycStatus: 'VERIFIED' }), certificationFields(readable([]), NOW));
    expect(item.kycStatus).toBe(t('farmersList.kyc.VERIFIED'));
  });
});

describe('Certification fields: from GET /admin/certifications, or the dash', () => {
  it('is the dash while the read is in flight, has failed, or is not permitted (nothing is known)', () => {
    for (const state of [
      { enabled: true, isLoading: true, error: null, items: [] },
      { enabled: true, isLoading: false, error: new Error('boom'), items: [] },
      { enabled: false, isLoading: false, error: null, items: [cert()] },
    ] satisfies CertificationReadState[]) {
      const f = certificationFields(state, NOW);
      expect(f.certificationType).toBe(ADMIN_NO_VALUE);
      expect(f.certExpiry).toBe(ADMIN_NO_VALUE);
      expect(f.certStatus).toBe(ADMIN_NO_VALUE);
    }
  });

  it('a farmer with no certificate on record says so; type and expiry are the dash', () => {
    const f = certificationFields(readable([]), NOW);
    expect(f.certStatus).toBe(t('superAdmin.compliance.cert.none'));
    expect(f.certificationType).toBe(ADMIN_NO_VALUE);
    expect(f.certExpiry).toBe(ADMIN_NO_VALUE);
  });

  it('a verified, unexpired certificate shows its real type, expiry day and Verified', () => {
    const f = certificationFields(readable([cert({ certType: 'NPOP', expiresOn: '2027-03-15', daysToExpiry: 111 })]), NOW);
    expect(f.certificationType).toBe(t('superAdmin.compliance.cert.type.NPOP'));
    expect(f.certExpiry).toBe('15 Mar 2027');
    expect(f.certStatus).toBe(t('superAdmin.compliance.cert.status.VERIFIED'));
    expect(f.certTone).toBe('success');
  });

  it('a verified certificate past its expiry is Expired, not Verified', () => {
    const f = certificationFields(readable([cert({ expiresOn: '2026-10-01', daysToExpiry: -54 })]), NOW);
    expect(f.certStatus).toBe(t('superAdmin.compliance.cert.status.EXPIRED'));
    expect(f.certTone).toBe('danger');
  });

  it('works out expiry from the date when the server sent no daysToExpiry', () => {
    expect(certificationFields(readable([cert({ expiresOn: '2026-11-23' })]), NOW).certStatus).toBe(t('superAdmin.compliance.cert.status.EXPIRED'));
    expect(certificationFields(readable([cert({ expiresOn: '2026-11-25' })]), NOW).certStatus).toBe(t('superAdmin.compliance.cert.status.VERIFIED'));
  });

  it('an unverified certificate is Unverified (neutral) and a rejected one is Rejected (danger)', () => {
    const unverified = certificationFields(readable([cert({ verificationStatus: 'UNVERIFIED' })]), NOW);
    const rejected = certificationFields(readable([cert({ verificationStatus: 'REJECTED' })]), NOW);
    expect(unverified.certStatus).toBe(t('superAdmin.compliance.cert.status.UNVERIFIED'));
    expect(unverified.certTone).toBe('neutral');
    expect(rejected.certStatus).toBe(t('superAdmin.compliance.cert.status.REJECTED'));
    expect(rejected.certTone).toBe('danger');
  });

  it('an OTHER certificate shows the scheme name the server sent', () => {
    const f = certificationFields(readable([cert({ certType: 'OTHER', customTypeName: 'Jaivik Bharat' })]), NOW);
    expect(f.certificationType).toBe('Jaivik Bharat');
  });

  it('shows the current verified certificate in preference to an older expired one', () => {
    const expired = cert({ id: 'old', expiresOn: '2025-01-01', daysToExpiry: -692 });
    const current = cert({ id: 'new', certType: 'NPOP', expiresOn: '2027-06-30', daysToExpiry: 218 });
    expect(pickCertification([expired, current], NOW)?.id).toBe('new');
    expect(pickCertification([current, expired], NOW)?.id).toBe('new');
  });

  it('with only unqualified certificates, shows the one expiring last', () => {
    const a = cert({ id: 'a', verificationStatus: 'UNVERIFIED', expiresOn: '2027-01-01' });
    const b = cert({ id: 'b', verificationStatus: 'UNVERIFIED', expiresOn: '2028-01-01' });
    expect(pickCertification([a, b], NOW)?.id).toBe('b');
    expect(pickCertification([], NOW)).toBeUndefined();
  });
});

describe('Verification & Compliance / Farm Records / Flow: no fixture and no invented literal', () => {
  const compliance = code(read(path.join(FARMERS, 'SuperAdminVerificationComplianceScreen.tsx')));
  const records = code(read(path.join(FARMERS, 'SuperAdminFarmRecordsListScreen.tsx')));
  const flow = code(read(path.join(FARMERS, 'FarmerManagementFlow.tsx')));
  const mapper = code(read(path.join(FARMERS, 'complianceMappers.ts')));

  it('the demo constants are gone and the fixtures file no longer exists', () => {
    for (const src of [compliance, records, flow, mapper]) {
      expect(src).not.toMatch(/DEMO_ALL_FARMERS|DEMO_APPLICATIONS|DEMO_COMPLIANCE_FARMERS|FARM_RECORD_ENTRIES|farmerManagementFixtures/);
    }
    expect(fs.existsSync(path.join(FARMERS, 'farmerManagementFixtures.ts'))).toBe(false);
  });

  it('no `?? \'literal\'` or `|| \'literal\'` fallback survives in the three screens or the mapper', () => {
    for (const [name, src] of Object.entries({ compliance, records, flow, mapper })) {
      expect(src, name).not.toMatch(/\?\?\s*['"`][^'"`]+['"`]/);
      expect(src, name).not.toMatch(/\|\|\s*['"`][^'"`]+['"`]/);
    }
  });

  it('the dash is ADMIN_NO_VALUE, never typed inline', () => {
    for (const [name, src] of Object.entries({ compliance, records, flow, mapper })) {
      expect(src, name).not.toContain('—');
    }
    expect(mapper).toMatch(/ADMIN_NO_VALUE/);
    expect(compliance).toMatch(/ADMIN_NO_VALUE|complianceMappers/);
  });

  it('both list screens draw loading / error / empty through the shared states and queryViewState', () => {
    for (const src of [compliance, records]) {
      expect(src).toMatch(/AdminLoadingState/);
      expect(src).toMatch(/AdminErrorState/);
      expect(src).toMatch(/AdminEmptyState/);
      expect(src).toMatch(/queryViewState/);
    }
  });

  it('the compliance screen reads certifications behind certification.view and never reads a hex colour', () => {
    expect(compliance).toMatch(/useCertificationList/);
    expect(compliance).toMatch(/certification\.view/);
    expect(compliance).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    expect(records).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
  });

  it('the flow takes the live list through the honest mapper and has no hard-coded zone or farm list', () => {
    expect(flow).toMatch(/toDesignFarmerItem/);
    expect(records).not.toMatch(/'Coonoor'|'Ooty'|'Kotagiri'/);
  });

  it('none of the invented strings survives as a literal anywhere under screens/farmers/', () => {
    const LITERALS = ['Ramesh Kumar', 'Selvi', '4.5 / 5.0', 'PGS-India / Organic', 'Tier A', 'Completed', 'Wild Eden Organic Farms'];
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(abs);
        else if (/\.tsx?$/.test(entry.name)) files.push(abs);
      }
    };
    walk(FARMERS);
    expect(files.length).toBeGreaterThan(10);
    for (const f of files) {
      const src = code(read(f));
      for (const literal of LITERALS) {
        expect(src.includes(literal), `${path.relative(ADMIN, f)}: ${literal}`).toBe(false);
      }
    }
  });

  it('the demo default props are gone: no screen defaults a farmer name to a person', () => {
    for (const file of ['FarmerPayoutTabSection.tsx', 'FarmerBankAccountDetailsScreen.tsx', 'FarmRecordsSection.tsx', 'AdminAddFarmRecordScreen.tsx']) {
      expect(code(read(path.join(FARMERS, file))), file).not.toMatch(/farmerName\s*=\s*['"`]/);
    }
    expect(code(read(path.join(FARMERS, 'AdminFarmMapScreen.tsx')))).not.toMatch(/\?\?\s*['"`]/);
  });
});
