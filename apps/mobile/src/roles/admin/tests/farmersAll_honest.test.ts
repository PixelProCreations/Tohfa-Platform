/**
 * The Farmers Management screen (screens/farmers/AdminAllFarmersScreen.tsx,
 * the design port) used to paint every live farmer as "KYC Verified", with a
 * Verified certificate, "Active · Paid" and a 4.5 rating whatever the API
 * said, and to fall back to invented farmers on an empty list. These tests pin
 * the honest mapping (./allFarmersMappers.ts: real value, or the dash) and
 * scan the source so a literal cannot creep back in.
 *
 * Pure and source-level, so plain-Node vitest covers it; the empty / loading /
 * error states are rendered in farmersAll_states.test.tsx.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ApplicationRowView, FarmerRowView } from '../api/farmerTypes';
import { ADMIN_NO_VALUE } from '../utils/noValue';
import { toDesignApplicationItem, toDesignFarmerItem } from '../screens/farmers/allFarmersMappers';
import { t } from '../i18n';

const ADMIN = path.join(__dirname, '..');
const FARMERS = path.join(ADMIN, 'screens/farmers');
const SCREEN = path.join(FARMERS, 'AdminAllFarmersScreen.tsx');
const read = (abs: string) => fs.readFileSync(abs, 'utf8');
/** Source without comments, so a docblock may name what the code must not contain. */
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '');

/** A farmer the API knows nothing compliance-wise about: unverified KYC, never rated, no zone. */
function bareRow(over: Partial<FarmerRowView> = {}): FarmerRowView {
  return {
    id: 'f-1',
    farmerCode: 'TOHFA-F-2026-0001',
    name: 'Arun Kumar',
    initials: 'AK',
    mobile: '9876500001',
    zoneId: null,
    zoneName: null,
    status: 'pending',
    accountStatus: 'PENDING',
    applicationStatus: 'SUBMITTED',
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

function bareApplication(over: Partial<ApplicationRowView> = {}): ApplicationRowView {
  return {
    id: 'a-1',
    name: 'Meena Raj',
    initials: 'MR',
    mobile: '9876500009',
    status: 'SUBMITTED',
    isDraft: false,
    village: null,
    district: null,
    farmingType: null,
    primaryCrops: [],
    statedAreaAcres: null,
    locationCount: 0,
    boundaryCount: 0,
    documentCount: 0,
    aadhaarLast4: null,
    submittedAt: null,
    createdAt: '2026-10-01T06:00:00.000Z',
    zoneId: null,
    slaDueAt: null,
    documentsComplete: null,
    applicationCode: null,
    kycStatus: null,
    ...over,
  };
}

const INVENTED = ['KYC Verified', 'Active · Paid', 'XXXX XXXX 4321', 'Organic', 'Natural', 'Good', 'Jan 2026', 'The Nilgiris'];

describe('Farmers Management list: a farmer the API says nothing about', () => {
  it('BR-06: an unrated farmer shows the dash, not 4.5, and carries no rating tier', () => {
    const item = toDesignFarmerItem(bareRow());
    expect(item.rating).toBeNull();
    expect(item.ratingTier).toBeUndefined();
  });

  it('shows the real KYC status (Pending), never "KYC Verified"', () => {
    const item = toDesignFarmerItem(bareRow({ kycStatus: 'PENDING' }));
    expect(item.kycVerifiedText).toBe(t('farmersList.kyc.PENDING'));
    expect(item.kycVerifiedText).not.toBe('KYC Verified');
  });

  it('says KYC Verified only for a farmer whose KYC the server verified, and Rejected for a rejected one', () => {
    expect(toDesignFarmerItem(bareRow({ kycStatus: 'VERIFIED' })).kycVerifiedText).toBe(t('farmersList.kyc.VERIFIED'));
    expect(toDesignFarmerItem(bareRow({ kycStatus: 'REJECTED' })).kycVerifiedText).toBe(t('farmersList.kyc.REJECTED'));
  });

  it('carries no certification, subscription, farming type, farm name or Aadhaar value (the list API has none)', () => {
    const item = toDesignFarmerItem(bareRow());
    expect(item.certStatus).toBeUndefined();
    expect(item.hasExpiredCert).toBeUndefined();
    expect(item.subscription).toBeUndefined();
    expect(item.farmingType).toBeUndefined();
    expect(item.farmName).toBeUndefined();
    expect(item.aadhaar).toBeUndefined();
  });

  it('a farmer with no zone is located by the dash, not "The Nilgiris"', () => {
    const item = toDesignFarmerItem(bareRow());
    expect(item.location).toBe(ADMIN_NO_VALUE);
    expect(item.zone).toBeUndefined();
  });

  it('keeps PENDING and DISABLED distinct (a pending account is not a disabled one)', () => {
    expect(toDesignFarmerItem(bareRow({ accountStatus: 'PENDING' })).status).toBe('PENDING');
    expect(toDesignFarmerItem(bareRow({ accountStatus: 'DISABLED' })).status).toBe('DISABLED');
    expect(toDesignFarmerItem(bareRow({ accountStatus: 'ACTIVE' })).status).toBe('ACTIVE');
  });

  it('no invented value appears anywhere on the mapped item', () => {
    const blob = JSON.stringify(toDesignFarmerItem(bareRow()));
    for (const fake of INVENTED) expect(blob.includes(fake), fake).toBe(false);
  });
});

describe('Farmers Management list: what the API does send is shown as sent', () => {
  it('BR-06: the 0-100 score, tier label, zone, mobile, code and registration day are the server values', () => {
    const item = toDesignFarmerItem(
      bareRow({
        overallRating: 82,
        ratingTierLabel: 'Good',
        zoneId: 'z-1',
        zoneName: 'Coonoor',
        accountStatus: 'ACTIVE',
        kycStatus: 'VERIFIED',
        registeredAt: '2026-09-25T06:00:00.000Z',
      }),
    );
    expect(item.rating).toBe(82);
    expect(item.ratingTier).toBe('Good');
    expect(item.location).toBe('Coonoor');
    expect(item.zone).toBe('Coonoor');
    expect(item.mobile).toBe('9876500001');
    expect(item.code).toBe('TOHFA-F-2026-0001');
    expect(item.memberSince).toBe('25 Sep 2026');
  });
});

describe('Applications tab: a real applicant is not given an invented file', () => {
  it('shows dashes for every field the list API does not send', () => {
    const app = toDesignApplicationItem(bareApplication());
    expect(app.code).toBe(ADMIN_NO_VALUE);
    expect(app.address).toBe(ADMIN_NO_VALUE);
    expect(app.zone).toBe(ADMIN_NO_VALUE);
    expect(app.farmingType).toBe(ADMIN_NO_VALUE);
    expect(app.crops).toBe(ADMIN_NO_VALUE);
    expect(app.kycStatus).toBe(ADMIN_NO_VALUE);
    expect(app.farmSize).toBe(ADMIN_NO_VALUE);
    expect(app.landArea).toBe(ADMIN_NO_VALUE);
    expect(app.soilType).toBe(ADMIN_NO_VALUE);
    expect(app.fmbSketch).toBe(ADMIN_NO_VALUE);
    expect(app.reviewNotes).toBe(ADMIN_NO_VALUE);
    expect(app.identityProofNumber).toBe(ADMIN_NO_VALUE);
    expect(app.identityProofStatus).toBeNull();
    expect(app.approvedDate).toBeUndefined();
  });

  it('an unsubmitted application is dated by its creation day, never by a made-up date', () => {
    const app = toDesignApplicationItem(bareApplication({ submittedAt: null, createdAt: '2026-10-01T06:00:00.000Z' }));
    expect(app.submittedDate).toBe('1 Oct 2026');
  });

  it('BR-33b: only the four digits the server sent are shown, in the masked form', () => {
    const app = toDesignApplicationItem(bareApplication({ aadhaarLast4: '9876' }));
    expect(app.identityProofNumber).toBe('XXXX XXXX 9876');
  });

  it('shows the real values the API sends', () => {
    const app = toDesignApplicationItem(
      bareApplication({
        applicationCode: 'APP-2026-0042',
        village: 'Ketti',
        district: 'Nilgiris',
        farmingType: 'Organic',
        primaryCrops: ['Carrot', 'Tea'],
        statedAreaAcres: 2.5,
        submittedAt: '2026-10-05T06:00:00.000Z',
      }),
    );
    expect(app.code).toBe('APP-2026-0042');
    expect(app.address).toBe('Ketti, Nilgiris');
    expect(app.farmingType).toBe('Organic');
    expect(app.crops).toBe('Carrot, Tea');
    expect(app.farmSize).toBe('2.5 acre');
    expect(app.submittedDate).toBe('5 Oct 2026');
  });

  it('does not derive KYC from documentsComplete (the server sends no KYC status for an application)', () => {
    const app = toDesignApplicationItem(bareApplication({ documentsComplete: true }));
    expect(app.kycStatus).toBe(ADMIN_NO_VALUE);
    expect(app.identityProofStatus).toBe('Verified');
  });

  it('labels an INFO_REQUESTED application "Correction Required" and a DOCS_REVIEW one Pending', () => {
    expect(toDesignApplicationItem(bareApplication({ status: 'INFO_REQUESTED' })).status).toBe('Correction Required');
    expect(toDesignApplicationItem(bareApplication({ status: 'DOCS_REVIEW' })).status).toBe('Pending');
    expect(toDesignApplicationItem(bareApplication({ status: 'APPROVED' })).status).toBe('Approved');
    expect(toDesignApplicationItem(bareApplication({ status: 'REJECTED' })).status).toBe('Rejected');
  });

  it('no invented value appears anywhere on the mapped application', () => {
    const blob = JSON.stringify(toDesignApplicationItem(bareApplication()));
    for (const fake of ['4321', 'Red Loam', 'fmb-sketch.pdf', 'Carrot', '3.5', '5 Oct 2026', '10 Oct 2026', 'APP-2026', 'Application submitted for review']) {
      expect(blob.includes(fake), fake).toBe(false);
    }
  });
});

describe('Farmers Management list: no fixture and no invented literal in the live path', () => {
  const screen = code(read(SCREEN));

  it('the screen no longer defines or reads DEMO_ALL_FARMERS / DEMO_APPLICATIONS', () => {
    expect(screen).not.toMatch(/DEMO_ALL_FARMERS|DEMO_APPLICATIONS/);
  });

  it('the screen holds none of the invented strings', () => {
    for (const literal of ['XXXX XXXX 4321', 'Ramesh Kumar', 'Active · Paid', 'KYC Verified', 'Red Loam', 'fmb-sketch.pdf', "'Organic'", "'Natural'"]) {
      expect(screen.includes(literal), literal).toBe(false);
    }
    // no `?? 'some literal'` fallback (the role default is the one unrelated exception)
    expect(screen.replace(/role \?\? 'TOHFA_ADMIN'/, '')).not.toMatch(/\?\?\s*['"`][^'"`]+['"`]/);
    expect(screen).not.toMatch(/\?\s*Number\(farmer\.rating\)[^:]*:\s*'[0-9.]+/); // no fallback rating
  });

  it('the screen does not write the dash itself; it comes from ADMIN_NO_VALUE', () => {
    expect(screen).not.toContain('—');
    const mapper = code(read(path.join(FARMERS, 'allFarmersMappers.ts')));
    expect(mapper).not.toContain('—');
    expect(mapper).toMatch(/ADMIN_NO_VALUE/);
  });

  it('the screen draws loading / error / empty through the shared states and queryViewState', () => {
    expect(screen).toMatch(/AdminLoadingState/);
    expect(screen).toMatch(/AdminErrorState/);
    expect(screen).toMatch(/AdminEmptyState/);
    expect(screen).toMatch(/queryViewState/);
  });

  it('none of the invented compliance strings survives as a hardcoded literal in the live farmers screens', () => {
    // Every file under screens/farmers/ is scanned: the fixtures file and the three screens that used to be
    // exempt here (compliance, farm-records list, flow) were made honest in farmersCompliance_*.test.
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
      for (const literal of ['XXXX XXXX 4321', 'Active · Paid', 'KYC Verified']) {
        expect(src.includes(literal), `${path.relative(ADMIN, f)}: ${literal}`).toBe(false);
      }
    }
  });
});
