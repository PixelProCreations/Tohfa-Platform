/**
 * The redesigned document review of the application screen (origin/Superadmin-main,
 * 2026-11-19), merged into the wired detail/* sections.
 *
 * What is checked here is the honesty of the port, because the design file this
 * came from has no API at all — every document name, category, date and
 * verification badge in it is a placeholder:
 *   - every document category the reviewer sees is derived from the real
 *     `documents` array (`docType` / `docSubType`), never from a fixed list of
 *     designed category names;
 *   - a category the applicant did not supply is drawn with the "not available"
 *     dash, never invented and never silently dropped;
 *   - the verification badge cannot claim "Document Verified", because
 *     `ApplicationDetailView.documentVerification` is always null — there is no
 *     per-application document verification endpoint;
 *   - Mark verified and Send request for information are drawn as designed but
 *     disabled, and pressing anything on this screen issues no mutation;
 *   - the lifecycle tracker's stage lines come from the application's own
 *     status and `infoRequest`, not from a local tracking state.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Image: 'Image',
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  RefreshControl: 'RefreshControl',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect' }));
vi.mock('@tohfa/mobile-ui', () => ({ Icon: 'Icon', SafeAreaView: 'SafeAreaView', ScreenStatusBar: 'ScreenStatusBar' }));

const hooks = vi.hoisted(() => ({
  useApplication: vi.fn(),
  useApplicationList: vi.fn(),
  useApproveApplication: vi.fn(),
  useRejectApplication: vi.fn(),
}));
vi.mock('../api/farmerHooks', () => hooks);

import type { ApplicationDetailView, ApplicationDocumentView } from '../api/farmerTypes';
import { t } from '../i18n';
import { AdminApplicationDetailScreen } from '../screens/registration/AdminApplicationDetailScreen';
import {
  documentCategories,
  documentReviewStage,
  documentVerificationState,
  lifecycleStages,
} from '../screens/registration/detail/documentReview';

const APP_ID = '0b9c7a52-3f7e-4b55-9a51-6f2b1f0c1a01';
const ALL_CODES = [
  'farmer.application.list_pending',
  'farmer.application.view',
  'farmer.application.approve',
  'farmer.application.reject',
];
const allow = (codes: readonly string[]) => (c: string) => codes.includes(c);
const DASH = t('farmerApps.notAvailable');

/**
 * Literals the 2026-11-19 design file hard-codes as placeholder data. None of
 * them may ever render, and none may appear in the ported source either (see
 * the source-guard test below).
 */
const DESIGN_FIXTURES = [
  'Great Earth Organic Farm',
  'Kumar',
  'APP-2026-0101',
  'TOHFA-2026-4817',
  'aadhaar_suresh.pdf',
  'land_deed.pdf',
  'PGS Organic / NPOP certificate',
  '3782 4591 0023',
  '11.4064, 76.6932',
  '±8 m (High)',
  '12 / 06 / 1985',
  '+91 98765 43210',
  'Kotagiri Village, Kotagiri Taluk, The Nilgiris',
  '05 Oct 2026',
  '10 Oct 2026',
  'Valid till 15 Mar 2027',
  'All requirements met. Ready for approval.',
  'Review in progress.',
  'Identity proof re-upload',
  'Please re-upload a clear scan of your identity proof',
  'M3-S03',
  'Audit Scheduled',
  'Schedule Audit',
];

function doc(over: Partial<ApplicationDocumentView> = {}): ApplicationDocumentView {
  return { docType: 'ID_PROOF', docSubType: 'Aadhaar Card', fileName: 'id.jpg', fileUrl: 'https://files.example/id.jpg', ...over };
}

function detail(over: Partial<ApplicationDetailView> = {}): ApplicationDetailView {
  return {
    id: APP_ID,
    status: 'DOCS_REVIEW',
    isDecided: false,
    isDraft: false,
    currentStep: 5,
    completedSteps: [1, 2, 3, 4],
    submittedAt: '2026-11-02T05:00:00Z',
    createdAt: '2026-11-01T05:00:00Z',
    applicant: {
      name: 'Revathi Selvam',
      mobile: '9876512345',
      dob: '1985-04-02',
      gender: 'Female',
      aadhaarLast4: '4821',
      preferredLocale: 'ta',
      address: {
        line1: '12 Market Road',
        line2: null,
        text: null,
        village: 'Ketti',
        taluk: 'Coonoor',
        district: 'Nilgiris',
        pincode: '643215',
      },
    },
    farming: {
      farmName: 'Selvam Farm',
      typeOfFarming: 'Natural',
      experienceYears: 6,
      statedAreaAcres: 3.5,
      statedNumberOfFarms: 1,
      waterSource: 'Well',
      primaryCrops: ['Beans', 'Potato'],
    },
    locations: [
      {
        id: 'loc-1',
        label: 'North field',
        areaAcres: 3.5,
        calculatedAreaAcres: null,
        village: 'Ketti',
        taluk: 'Coonoor',
        district: 'Nilgiris',
        hasBoundary: true,
        gps: null,
      },
    ],
    documents: [doc()],
    tohfaFarmerId: null,
    decidedAt: null,
    rejectionReason: null,
    infoRequest: null,
    zoneId: null,
    applicationCode: null,
    reviewHistory: null,
    documentVerification: null,
    declaration: null,
    ...over,
  };
}

interface DecisionState {
  run: ReturnType<typeof vi.fn>;
  finish: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  isPending: boolean;
  error: unknown;
}

let live: { application: ApplicationDetailView | undefined; isLoading: boolean; error: unknown };
let approve: DecisionState;
let reject: DecisionState;

function decision(): DecisionState {
  return { run: vi.fn(), finish: vi.fn(), reset: vi.fn(), isPending: false, error: null };
}

beforeEach(() => {
  vi.clearAllMocks();
  live = { application: detail(), isLoading: false, error: null };
  approve = decision();
  reject = decision();
  hooks.useApplication.mockImplementation(() => ({ ...live, refresh: vi.fn(), isRefreshing: false }));
  hooks.useApproveApplication.mockImplementation(() => approve);
  hooks.useRejectApplication.mockImplementation(() => reject);
});

function texts(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  const own = typeof node.props['placeholder'] === 'string' ? [node.props['placeholder'] as string] : [];
  return [...own, ...(node.children ?? []).flatMap(texts)];
}

function allText(tree: renderer.ReactTestRenderer): string {
  return texts(tree.toJSON()).join('\n');
}

function byTestId(tree: renderer.ReactTestRenderer, id: string): ReactTestInstance[] {
  return tree.root.findAll((n) => typeof n.type === 'string' && n.props['testID'] === id);
}

function mount(props: Partial<React.ComponentProps<typeof AdminApplicationDetailScreen>> = {}): renderer.ReactTestRenderer {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <AdminApplicationDetailScreen applicationId={APP_ID} can={allow(ALL_CODES)} onBack={vi.fn()} {...props} />,
    );
  });
  return tree;
}

// ---------------------------------------------------------------------------
// The categories themselves (pure, so no renderer needed)
// ---------------------------------------------------------------------------

describe('documentCategories: driven by the application, never by a designed list', () => {
  it('reports one supplied category per docType actually present, in the order the API sent them', () => {
    const app = detail({
      documents: [doc({ docType: 'FARM_DOC', docSubType: 'Patta', fileName: 'patta.pdf' }), doc()],
    });
    const uploaded = documentCategories(app).filter((c) => c.documents.length > 0);
    expect(uploaded.map((c) => c.key)).toEqual(['FARM_DOC', 'ID_PROOF']);
    expect(uploaded.every((c) => c.state === 'supplied')).toBe(true);
    expect(uploaded[0]!.documents.map((d) => d.docSubType)).toEqual(['Patta']);
  });

  it('groups several documents of one docType into that one category', () => {
    const app = detail({
      documents: [doc({ docSubType: 'Aadhaar Card' }), doc({ docSubType: 'Voter ID', fileName: 'voter.pdf' })],
    });
    const idProof = documentCategories(app).find((c) => c.key === 'ID_PROOF')!;
    expect(idProof.state).toBe('supplied');
    expect(idProof.documents).toHaveLength(2);
  });

  it('keeps a docType the client does not know as its own category rather than discarding it', () => {
    const app = detail({ documents: [doc({ docType: 'NEW_SERVER_TYPE', docSubType: null })] });
    const keys = documentCategories(app).map((c) => c.key);
    expect(keys).toContain('NEW_SERVER_TYPE');
  });

  it('shows a category the applicant did not supply as absent, and invents nothing for it', () => {
    const app = detail({ documents: [doc()] }); // ID proof only
    const landProof = documentCategories(app).find((c) => c.key === 'FARM_DOC')!;
    expect(landProof.state).toBe('notSupplied');
    expect(landProof.documents).toEqual([]);
  });

  it('reports bank details as unavailable: a farmer application collects none at all', () => {
    const bank = documentCategories(detail()).find((c) => c.key === 'BANK_DETAILS')!;
    expect(bank.state).toBe('unavailable');
    expect(bank.documents).toEqual([]);
  });

  it('reads the FMB sketch from the land locations, the only place the API carries one', () => {
    const drawn = documentCategories(detail()).find((c) => c.key === 'FMB_SKETCH')!;
    expect(drawn.state).toBe('supplied');
    const none = documentCategories(
      detail({ locations: [{ ...detail().locations[0]!, hasBoundary: false }] }),
    ).find((c) => c.key === 'FMB_SKETCH')!;
    expect(none.state).toBe('notSupplied');
  });

  it('never claims a document is verified: the application carries no verification at all', () => {
    expect(documentVerificationState(detail())).toBe('unknown');
  });
});

describe('documentReviewStage: the designed stage lines, from real fields only', () => {
  it('is "under review" while documents are present and nothing was requested back', () => {
    expect(documentReviewStage(detail())).toBe('underReview');
  });

  it('is "requested" when the server recorded an information request', () => {
    expect(documentReviewStage(detail({ infoRequest: 'Re-upload the land record.' }))).toBe('requested');
  });

  it('is unknown — not "all verified" — when no document has been uploaded', () => {
    expect(documentReviewStage(detail({ documents: [] }))).toBe('unknown');
  });
});

describe('lifecycleStages: from the application status, not a local tracker', () => {
  it('marks the decision stage done only once the server decided', () => {
    const pending = lifecycleStages(detail(), 'DOCS_REVIEW');
    expect(pending.find((s) => s.key === 'decision')!.state).toBe('pending');
    const approved = lifecycleStages(detail({ status: 'APPROVED' }), 'APPROVED');
    expect(approved.find((s) => s.key === 'decision')!.state).toBe('done');
  });

  it('marks the document stage done once the application moved past it', () => {
    const stages = lifecycleStages(detail({ status: 'AUDIT' }), 'AUDIT');
    expect(stages.find((s) => s.key === 'docsReview')!.state).toBe('done');
    expect(stages.find((s) => s.key === 'audit')!.state).toBe('current');
  });
});

// ---------------------------------------------------------------------------
// What the reviewer actually sees
// ---------------------------------------------------------------------------

describe('document review section: what renders', () => {
  it('renders a card per supplied category, labelled from the real docType', () => {
    live.application = detail({
      documents: [doc(), doc({ docType: 'FARM_DOC', docSubType: 'Patta', fileName: 'patta.pdf' })],
    });
    const text = allText(mount());
    expect(text).toContain(t('farmerApps.doc.type.ID_PROOF'));
    expect(text).toContain(t('farmerApps.doc.type.FARM_DOC'));
    expect(text).toContain('Patta');
  });

  it('draws an absent category with the dash instead of hiding the gap', () => {
    live.application = detail({ documents: [doc()] });
    const text = allText(mount());
    expect(text).toContain(t('farmerApps.doc.type.FARM_DOC'));
    expect(text).toContain(t('farmerApps.doc.notSupplied'));
    expect(text).toContain(t('farmerApps.doc.category.BANK_DETAILS'));
    expect(text).toContain(DASH);
  });

  it('BR-33b: an identity proof shows the masked Aadhaar and never twelve digits', () => {
    const text = allText(mount());
    expect(text).toContain('XXXX XXXX 4821');
    expect(text).not.toMatch(/\d{12}/);
  });

  it('shows "Documents Under Review" while the review is open', () => {
    expect(allText(mount())).toContain(t('farmerApps.doc.reviewStage.underReview'));
  });

  it('shows "Documents Requested" once the server recorded an information request', () => {
    live.application = detail({ infoRequest: 'Re-upload the land record.' });
    const text = allText(mount());
    expect(text).toContain(t('farmerApps.doc.reviewStage.requested'));
    expect(text).toContain('Re-upload the land record.');
  });

  it('leaves every verification badge dashed, because nothing can report a verified document', () => {
    const text = allText(mount());
    expect(text).not.toContain(t('farmerApps.doc.badge.verified'));
    expect(text).toContain(t('farmerApps.doc.verifyUnavailable'));
  });
});

describe('controls with no endpoint stay inert', () => {
  it('Mark verified is disabled and pressing it runs no mutation', () => {
    const tree = mount();
    const buttons = byTestId(tree, 'farmerApps.markVerified');
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) {
      expect(b.props['disabled']).toBe(true);
      expect(b.props['onPress']).toBeUndefined();
    }
    expect(approve.run).not.toHaveBeenCalled();
    expect(reject.run).not.toHaveBeenCalled();
  });

  it('the request-for-information form is drawn but its send button is disabled and explains why', () => {
    const tree = mount();
    const send = byTestId(tree, 'farmerApps.sendMoreInfo');
    expect(send).toHaveLength(1);
    expect(send[0]!.props['disabled']).toBe(true);
    expect(send[0]!.props['onPress']).toBeUndefined();
    expect(allText(tree)).toContain(t('farmerApps.moreInfo.unavailable'));
    expect(approve.run).not.toHaveBeenCalled();
  });

  it('the tracking-status control is drawn but cannot be changed from this screen', () => {
    const tree = mount();
    const control = byTestId(tree, 'farmerApps.updateTracking');
    expect(control).toHaveLength(1);
    expect(control[0]!.props['disabled']).toBe(true);
    expect(allText(tree)).toContain(t('farmerApps.tracking.updateUnavailable'));
  });

  it('the document preview opens from the real document and names no designed file', () => {
    const tree = mount();
    act(() => {
      (byTestId(tree, 'farmerApps.preview')[0]!.props['onPress'] as () => void)();
    });
    const text = allText(tree);
    expect(text).toContain(t('farmerApps.doc.previewTitle'));
    expect(text).toContain('id.jpg');
  });
});

describe('the decided presentations', () => {
  it('an approved application reads "Approved by Admin" in the tracker', () => {
    live.application = detail({ status: 'APPROVED', isDecided: true, decidedAt: '2026-11-10T05:00:00Z' });
    const text = allText(mount());
    expect(text).toContain(t('farmerApps.tracking.decision.approved'));
    expect(text).toContain(t('farmerApps.status.APPROVED'));
  });

  it('a rejected application reads "Application Rejected" and keeps the reason the server gave', () => {
    live.application = detail({ status: 'REJECTED', isDecided: true, rejectionReason: 'Land records did not match.' });
    const text = allText(mount());
    expect(text).toContain(t('farmerApps.tracking.decision.rejected'));
    expect(text).toContain('Land records did not match.');
  });

  it('a pending application reads "Pending Admin Decision"', () => {
    expect(allText(mount())).toContain(t('farmerApps.tracking.decision.pending'));
  });
});

describe('no design fixture survives the port', () => {
  it('renders none of the design file placeholder values, in any state', () => {
    for (const app of [
      detail(),
      detail({ documents: [] }),
      detail({ status: 'APPROVED', isDecided: true }),
      detail({ status: 'REJECTED', isDecided: true }),
      detail({ infoRequest: 'Re-upload the land record.' }),
    ]) {
      live.application = app;
      const text = allText(mount());
      for (const fixture of DESIGN_FIXTURES) {
        expect(text, `rendered design fixture "${fixture}"`).not.toContain(fixture);
      }
    }
  });
});
