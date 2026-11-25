/**
 * AuditDetailsFarmerRecordsScreen — the full design of origin/Superadmin-main
 * ported onto live data. Pins:
 *
 *   - every section the design draws is present on the tab the DESIGN puts it
 *     on (Category Scores, Corrective actions, Red flag and Activity are on
 *     Details, not Inspection);
 *   - a field with no endpoint behind it (audit code, participants, purpose,
 *     duration, farming type, FMB sketch, soil report, evidence, red-flag
 *     history, activity timeline, ...) renders the em-dash — it is neither
 *     dropped nor filled with the design's sample value;
 *   - the fields that ARE backed render the server's values;
 *   - BR-05b: the control that raises a red flag is withheld unless the audit
 *     is COMPLETED, so it cannot be tapped into the server's 409;
 *   - source guards: no hex, no numeric fontSize, no role literals, no sample
 *     values copied from the mock.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as AuditsModule from '../api/audits';
import type { AuditDetailDto, AuditStatus, AuditSummaryDto } from '../api/audits';
import type * as FarmersModule from '../api/farmers';
import type * as CertsModule from '../api/certifications';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  Modal: 'Modal',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Ellipse: 'Ellipse',
  G: 'G',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));
vi.mock('@tohfa/mobile-ui', () => ({ Icon: 'Icon', SafeAreaView: 'SafeAreaView', ScreenStatusBar: 'ScreenStatusBar' }));

const api = vi.hoisted(() => ({
  getAudit: vi.fn(),
  listAudits: vi.fn(),
  getFarmer: vi.fn(),
  listFarmerDocuments: vi.fn(),
  listCertifications: vi.fn(),
}));
vi.mock('../api/audits', async (importOriginal) => ({
  ...(await importOriginal<typeof AuditsModule>()),
  getAudit: api.getAudit,
  listAudits: api.listAudits,
}));
vi.mock('../api/farmers', async (importOriginal) => ({
  ...(await importOriginal<typeof FarmersModule>()),
  getFarmer: api.getFarmer,
  listFarmerDocuments: api.listFarmerDocuments,
}));
vi.mock('../api/certifications', async (importOriginal) => ({
  ...(await importOriginal<typeof CertsModule>()),
  listCertifications: api.listCertifications,
}));

import { AuditDetailsFarmerRecordsScreen } from '../screens/audits/AuditDetailsFarmerRecordsScreen';
import {
  activityRows,
  canClearRedFlagNow,
  canRaiseRedFlagNow,
  certDocDetail,
  certificationRows,
  correctiveActionCards,
  documentCards,
  documentRows,
  farmLandRows,
  farmerRows,
  inspectionHeaderRows,
  inspectionSummaryRows,
  overviewRows,
  previousAuditCards,
  redFlagRows,
  summaryRows,
  type RecordRow,
} from '../screens/audits/auditDetailsRecordsFormat';
import { makeCan } from '../permissions/can';
import { en } from '../i18n';

const DASH = '—';
const AUDIT_ID = '00000000-0000-4000-8000-0000000000a1';
const FARMER_ID = '00000000-0000-4000-8000-0000000000f1';
const noop = () => undefined;

function audit(over: Partial<AuditDetailDto> = {}): AuditDetailDto {
  return {
    id: AUDIT_ID,
    farmerId: FARMER_ID,
    tohfaFarmerId: 'TOHFA-F-2026-0001',
    farmerName: 'Backed Farmer Name',
    farmId: null,
    farmName: 'Backed Farm Name',
    zoneId: null,
    zoneName: 'Backed Zone',
    fiscalYear: '2026-27',
    quarter: 3,
    auditType: 'INTERNAL',
    status: 'SCHEDULED',
    scheduledFor: '2026-10-28T04:30:00.000Z',
    startedAt: null,
    completedAt: null,
    auditorUserId: null,
    auditorName: 'Backed Auditor',
    externalAgencyName: null,
    totalScore: null,
    maxScore: 100,
    tier: null,
    majorViolationsCount: 0,
    findingCounts: { major: 2, minor: 3, observation: 0, openMajor: 1 },
    redFlagged: false,
    summary: null,
    reportUpload: null,
    redFlagReason: null,
    redFlaggedAt: null,
    redFlaggedByName: null,
    cancelledReason: null,
    cancelledAt: null,
    createdByName: 'Creator',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-08T03:30:00.000Z',
    categoryScores: [],
    findings: [],
    ...over,
  };
}

function summary(over: Partial<AuditSummaryDto> = {}): AuditSummaryDto {
  const { categoryScores: _c, findings: _f, ...rest } = audit();
  return { ...rest, ...over };
}

const FARMER_DTO = {
  id: FARMER_ID,
  tohfaFarmerId: 'TOHFA-F-2026-0001',
  fullName: 'Backed Farmer Name',
  mobile: '+91 90000 11111',
  email: null,
  accountStatus: 'ACTIVE',
  applicationStatus: 'APPROVED',
  kycStatus: 'VERIFIED',
  zone: { id: 'z1', name: 'Backed Zone' },
  aadhaarLast4: null,
  dob: null,
  gender: null,
  farmingExperienceYears: null,
  address: { line1: null, line2: null, village: null, taluk: null, district: 'Nilgiris', pincode: null },
  isMarketBlocked: false,
  marketBlockReason: null,
  landLocations: [
    {
      id: 'loc-1',
      name: 'Backed Land Name',
      surveyNumber: null,
      areaAcres: 1.5,
      address: null,
      village: 'Backed Village',
      taluk: null,
      district: 'Nilgiris',
      centroid: null,
      hasBoundary: false,
      isPrimary: true,
      plots: [{ id: 'p1', name: 'Backed Plot', areaAcres: 1, soilType: null, irrigationType: null, sunExposure: null }],
    },
  ],
  certificationSummary: {
    total: 1,
    verified: 1,
    verifiedCurrent: 1,
    verifiedExpired: 0,
    unverified: 0,
    rejected: 0,
    expired: 0,
    qualifying: 1,
    nextQualifyingExpiry: null,
  },
  rating: { overallRating: null, ratingTier: null },
  approvedAt: null,
  createdAt: '2026-01-10T00:00:00.000Z',
};

const CERT_DTO = {
  id: 'cert-1',
  farmerId: FARMER_ID,
  certType: 'PGS' as const,
  customTypeName: null,
  certNumber: 'BACKED-CERT-NUMBER',
  issuingBody: 'Backed Issuing Body',
  issuedOn: '2025-09-24',
  expiresOn: '2026-09-24',
  documentUrl: 'https://example.invalid/doc.pdf',
  verificationStatus: 'VERIFIED' as const,
  daysToExpiry: 30,
  blocksListings: false,
  createdAt: '2025-09-24T00:00:00.000Z',
};

function page<T>(items: T[]) {
  return { items, page: { nextCursor: null, hasMore: false } };
}

async function flush() {
  for (let i = 0; i < 8; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

async function mount(el: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<QueryClientProvider client={client}>{el}</QueryClientProvider>);
  });
  await flush();
  return tree;
}

const textsOf = (tree: renderer.ReactTestRenderer) =>
  tree.root.findAllByType('Text' as React.ElementType).map((n) => [n.props.children].flat().join(''));

const byId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);

function press(tree: renderer.ReactTestRenderer, label: string) {
  const hit = tree.root
    .findAllByType('TouchableOpacity' as React.ElementType)
    .find((n) =>
      n.findAllByType('Text' as React.ElementType).some((c) => [c.props.children].flat().join('') === label),
    );
  expect(hit, `touchable "${label}"`).toBeDefined();
  act(() => {
    hit?.props.onPress?.();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getAudit.mockResolvedValue(audit());
  api.listAudits.mockResolvedValue(page<AuditSummaryDto>([]));
  api.getFarmer.mockResolvedValue(FARMER_DTO);
  api.listFarmerDocuments.mockResolvedValue({ items: [] });
  api.listCertifications.mockResolvedValue(page([CERT_DTO]));
});

const ALL_CAN = makeCan(['audit.view', 'audit.schedule', 'audit.red_flag.manage', 'farmer.view', 'certification.view']);

// ─── Gap fields: every row with no endpoint behind it renders the dash ────────

describe('AuditDetailsFarmerRecordsScreen — gap fields render an em-dash', () => {
  const full = audit({
    status: 'COMPLETED',
    findings: [
      {
        id: 'f1',
        auditId: AUDIT_ID,
        severity: 'MAJOR',
        categoryCode: 'SOIL_LAND',
        description: 'desc',
        correctiveAction: 'Backed corrective action',
        dueDate: '2026-02-17',
        resolvedAt: '2026-02-14T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  });

  const everyRowSet = (): RecordRow[] => [
    ...summaryRows(full),
    ...overviewRows(full),
    ...farmerRows(full, undefined),
    ...farmLandRows(full, undefined),
    ...certificationRows(undefined),
    ...documentRows([]),
    ...redFlagRows(full),
    ...activityRows(),
    ...inspectionHeaderRows(full),
    ...inspectionSummaryRows(full),
    ...certDocDetail(undefined, undefined).rows,
  ];

  it('no gap row is ever given a value', () => {
    for (const r of everyRowSet()) {
      if (r.source === 'gap') expect(r.value, r.id).toBe(DASH);
    }
  });

  it('names every gap field the design shows, so none is silently dropped', () => {
    const gapIds = everyRowSet()
      .filter((r) => r.source === 'gap')
      .map((r) => r.id);
    for (const id of [
      'summary.participants',
      'summary.purpose',
      'summary.updatedBy',
      'overview.duration',
      'overview.purpose',
      'farmer.farmingType',
      'farmLand.fmbSketch',
      'documents.soil',
      'redFlag.history',
      'activity.timeline',
      'inspection.audit',
      'inspection.evidenceCount',
    ]) {
      expect(gapIds, id).toContain(id);
    }
  });

  it('the audit code is the dash, because only the uuid exists', () => {
    const codeRow = inspectionHeaderRows(full).find((r) => r.id === 'inspection.audit');
    expect(codeRow?.value).toBe(DASH);
    expect(previousAuditCards([summary({ id: 'other' })], AUDIT_ID)[0]?.title.startsWith(DASH)).toBe(true);
  });

  it('a corrective action shows its backed fields and dashes the rest', () => {
    const [card] = correctiveActionCards(full);
    expect(card?.code).toBe(DASH);
    expect(card?.actionText).toContain('Backed corrective action');
    expect(card?.responsibleText).toContain(DASH);
    expect(card?.evidenceText).toContain(DASH);
  });

  it('document cards with no endpoint say "not on file" rather than naming a file', () => {
    const cards = documentCards(undefined);
    expect(cards.map((c) => c.id)).toEqual(['doc.fmb', 'doc.cert', 'doc.external']);
    expect(cards.filter((c) => c.source === 'gap').every((c) => !c.onFile)).toBe(true);
  });

  it('renders a dash, not an absent row, for every gap field on screen', async () => {
    const tree = await mount(<AuditDetailsFarmerRecordsScreen auditId={AUDIT_ID} can={ALL_CAN} onBack={noop} />);
    for (const id of ['summary.participants', 'overview.purpose', 'farmer.farmingType', 'farmLand.fmbSketch']) {
      const nodes = byId(tree, `auditRecords.value.${id}`);
      expect(nodes.length, id).toBe(1);
      expect([nodes[0]?.props.children].flat().join(''), id).toBe(DASH);
    }
  });
});

// ─── Backed fields come from the hooks ───────────────────────────────────────

describe('AuditDetailsFarmerRecordsScreen — backed fields', () => {
  it('renders the audit, farmer, land, certification and document reads', async () => {
    const tree = await mount(<AuditDetailsFarmerRecordsScreen auditId={AUDIT_ID} can={ALL_CAN} onBack={noop} />);
    const texts = textsOf(tree).join('\n');

    expect(api.getAudit).toHaveBeenCalledWith(AUDIT_ID, expect.anything());
    expect(api.getFarmer).toHaveBeenCalledWith(FARMER_ID, expect.anything());
    expect(api.listCertifications).toHaveBeenCalled();

    expect(texts).toContain('Backed Farmer Name');
    expect(texts).toContain('Backed Auditor');
    expect(texts).toContain('+91 90000 11111');
    expect(texts).toContain('Backed Land Name');
    expect(texts).toContain('Backed Plot');
    expect(texts).toContain('BACKED-CERT-NUMBER');
    expect(texts).toContain('Q3 2026-27');
  });

  it('shows every section the design puts on the Details tab', async () => {
    const tree = await mount(<AuditDetailsFarmerRecordsScreen auditId={AUDIT_ID} can={ALL_CAN} onBack={noop} />);
    const texts = textsOf(tree);
    for (const heading of [
      'Overview',
      'Farmer',
      'Farm & Land',
      'Certifications',
      'Previous Audits',
      'Documents',
      'Category Scores',
      'Corrective actions',
      'Red flag',
      'Activity',
    ]) {
      expect(texts, heading).toContain(heading);
    }
  });

  it('carries the design bottom bar: Edit schedule, Reschedule, Cancel', async () => {
    const tree = await mount(
      <AuditDetailsFarmerRecordsScreen
        auditId={AUDIT_ID}
        can={ALL_CAN}
        onBack={noop}
        onEditSchedule={noop}
        onReschedule={noop}
        onCancelSchedule={noop}
      />,
    );
    const texts = textsOf(tree);
    expect(texts).toContain('Edit schedule');
    expect(texts).toContain('Reschedule');
    expect(texts).toContain('Cancel');
  });

  it('opens the certification document preview modal', async () => {
    // `Modal` is mocked as a plain host element, so its children are always in
    // the tree; what it does with `visible` is the thing to assert.
    const tree = await mount(<AuditDetailsFarmerRecordsScreen auditId={AUDIT_ID} can={ALL_CAN} onBack={noop} />);
    const modal = () =>
      tree.root
        .findAllByType('Modal' as React.ElementType)
        .find((n) => n.findAll((c) => c.props.testID === 'auditRecords.certDocModal').length > 0);

    expect(byId(tree, 'auditRecords.certDocModal').length).toBe(1);
    expect(modal()?.props.visible).toBe(false);
    press(tree, 'Open certification record');
    expect(modal()?.props.visible).toBe(true);
  });

  it('disables reschedule and cancel without audit.schedule', async () => {
    const tree = await mount(
      <AuditDetailsFarmerRecordsScreen
        auditId={AUDIT_ID}
        can={makeCan(['audit.view'])}
        onBack={noop}
        onReschedule={noop}
        onCancelSchedule={noop}
      />,
    );
    const btn = byId(tree, 'auditRecords.action.reschedule')[0];
    expect(btn?.props.disabled).toBe(true);
  });
});

// ─── BR-05b: red flag is COMPLETED-only ──────────────────────────────────────

describe('BR-05b: an audit can be red-flagged only once it is COMPLETED', () => {
  const statuses: AuditStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'CANCELLED'];

  it('withholds the raise control on every non-COMPLETED status', () => {
    for (const status of statuses) {
      expect(canRaiseRedFlagNow(audit({ status }), true), status).toBe(false);
    }
    expect(canRaiseRedFlagNow(audit({ status: 'COMPLETED' }), true)).toBe(true);
  });

  it('withholds it without audit.red_flag.manage even when COMPLETED', () => {
    expect(canRaiseRedFlagNow(audit({ status: 'COMPLETED' }), false)).toBe(false);
  });

  it('still allows clearing a flag that is actually set, whatever the status', () => {
    expect(canClearRedFlagNow(audit({ status: 'CANCELLED', redFlagged: true }), true)).toBe(true);
    expect(canClearRedFlagNow(audit({ status: 'COMPLETED', redFlagged: false }), true)).toBe(false);
  });

  it('does not render the raise control on a SCHEDULED audit', async () => {
    const tree = await mount(<AuditDetailsFarmerRecordsScreen auditId={AUDIT_ID} can={ALL_CAN} onBack={noop} />);
    expect(byId(tree, 'auditRecords.redFlag.raise').length).toBe(0);
    expect(textsOf(tree)).toContain('An audit can be red-flagged only once it is completed.');
  });

  it('renders the raise control on a COMPLETED audit with the permission', async () => {
    api.getAudit.mockResolvedValue(audit({ status: 'COMPLETED', totalScore: 80, tier: 'GOOD' }));
    const tree = await mount(<AuditDetailsFarmerRecordsScreen auditId={AUDIT_ID} can={ALL_CAN} onBack={noop} />);
    expect(byId(tree, 'auditRecords.redFlag.raise').length).toBe(1);
  });

  it('hides it on a COMPLETED audit without audit.red_flag.manage', async () => {
    api.getAudit.mockResolvedValue(audit({ status: 'COMPLETED' }));
    const tree = await mount(
      <AuditDetailsFarmerRecordsScreen auditId={AUDIT_ID} can={makeCan(['audit.view'])} onBack={noop} />,
    );
    expect(byId(tree, 'auditRecords.redFlag.raise').length).toBe(0);
  });
});

// ─── Source guards ───────────────────────────────────────────────────────────

describe('AuditDetailsFarmerRecordsScreen source guards', () => {
  const dir = path.resolve(__dirname, '../screens/audits');
  const sources = ['AuditDetailsFarmerRecordsScreen.tsx', 'auditDetailsRecordsFormat.ts'].map((f) =>
    fs.readFileSync(path.join(dir, f), 'utf8'),
  );

  it('has no hex colour, numeric fontSize, fontFamily, role literal or `as any`', () => {
    for (const src of sources) {
      expect(src).not.toMatch(/(['"`])#[0-9A-Fa-f]{3,8}\1|\brgba?\s*\(/);
      expect(src).not.toMatch(/fontSize\s*:\s*[0-9]/);
      expect(src).not.toMatch(/fontFamily/);
      expect(src).not.toMatch(/SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN/);
      expect(src).not.toMatch(/\bas any\b/);
    }
  });

  it('copies no sample value from the design mock', () => {
    for (const src of sources) {
      expect(src).not.toMatch(/AUD-2026|FMR-00|PLT-00|CERT-2026|CA-2026|FND-2026|fmb-sketch|Priya Nair|Ramesh Kumar|Demo plot/);
    }
  });

  it('every t() key the screen uses has an English string', () => {
    const missing: string[] = [];
    for (const src of sources) {
      for (const m of src.matchAll(/tr\(\s*'(admin\.audits\.records\.[^']+)'/g)) {
        const key = m[1] as string;
        if (!key.includes('${') && !Object.prototype.hasOwnProperty.call(en, key)) missing.push(key);
      }
    }
    expect(missing).toEqual([]);
  });
});
