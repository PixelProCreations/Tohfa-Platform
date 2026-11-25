/**
 * End-to-end wiring tests for Module 1 Task 4 (`verifyDocument`, `verifyFmb`,
 * `advance`, `requestInfo`, `addNote`, `approve` with note, `reject` reasonCode,
 * `reviewHistory`, `INFO_REQUESTED`, and `reviewGates` blockers).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  Modal: ({ visible, children }: { visible?: boolean; children?: React.ReactNode }) =>
    visible ? React.createElement('Modal', null, children) : null,
  Platform: { OS: 'ios', select: <T,>(o: { ios?: T; default?: T }) => o.ios ?? o.default },
  RefreshControl: 'RefreshControl',
  ScrollView: 'ScrollView',
  StyleSheet: { create: <T,>(s: T): T => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  Polygon: 'Polygon',
  Rect: 'Rect',
}));
vi.mock('@tohfa/mobile-ui', () => ({
  FarmBoundaryMap: 'FarmBoundaryMap',
  Icon: 'Icon',
  SafeAreaView: 'SafeAreaView',
  ScreenStatusBar: 'ScreenStatusBar',
  isFarmMapAvailable: () => false,
}));

const hooks = vi.hoisted(() => ({
  useApplication: vi.fn(),
  useApplicationList: vi.fn(),
  useApproveApplication: vi.fn(),
  useRejectApplication: vi.fn(),
  useAdvanceApplication: vi.fn(),
  useReviewApplicationDocument: vi.fn(),
  useReviewApplicationFmb: vi.fn(),
  useAddApplicationNote: vi.fn(),
  useRequestApplicationInfo: vi.fn(),
}));
vi.mock('../api/farmerHooks', () => hooks);

import type { Problem } from '@tohfa/shared-types';
import { ApiError } from '../../../shell/api/client';
import type { ApplicationDetailView } from '../api/farmerTypes';
import { t } from '../i18n';
import { AdminApplicationDetailScreen } from '../screens/registration/AdminApplicationDetailScreen';

const APP_ID = '0b9c7a52-3f7e-4b55-9a51-6f2b1f0c1a01';
const FULL_CODES = [
  'farmer.application.list_pending',
  'farmer.application.view',
  'farmer.application.approve',
  'farmer.application.reject',
  'farmer.application.request_info',
  'farmer.application.advance',
  'farmer.application.verify_document',
  'farmer.application.verify_fmb',
  'farmer.application.add_note',
];
const VIEW_ONLY_CODES = ['farmer.application.list_pending', 'farmer.application.view'];
const allow = (codes: readonly string[]) => (c: string) => codes.includes(c);

interface ActionMock {
  run: ReturnType<typeof vi.fn>;
  finish: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  isPending: boolean;
  error: unknown;
}

function makeAction(): ActionMock {
  return { run: vi.fn(), finish: vi.fn(), reset: vi.fn(), isPending: false, error: null };
}

function problem(code: string, status: number): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code } as Problem);
}

function makeDetail(over: Partial<ApplicationDetailView> = {}): ApplicationDetailView {
  return {
    id: APP_ID,
    status: 'DOCS_REVIEW',
    isDecided: false,
    isDraft: false,
    currentStep: 5,
    completedSteps: [1, 2, 3, 4],
    submittedAt: '2026-11-10T05:00:00Z',
    createdAt: '2026-11-09T05:00:00Z',
    applicant: {
      name: 'Lakshmi Narayan',
      mobile: '9876500010',
      dob: '1980-03-14',
      gender: 'Female',
      aadhaarLast4: '4821',
      preferredLocale: 'en',
      address: {
        line1: '14 Temple St',
        line2: null,
        text: null,
        village: 'Ketti',
        taluk: 'Coonoor',
        district: 'Nilgiris',
        pincode: '643215',
      },
    },
    farming: {
      farmName: 'Lakshmi Eco Farm',
      typeOfFarming: 'Organic',
      experienceYears: 8,
      statedAreaAcres: 2.5,
      statedNumberOfFarms: 1,
      waterSource: 'Borewell',
      primaryCrops: ['Carrot', 'Beans'],
    },
    locations: [
      {
        id: 'loc-1',
        label: 'Main Plot',
        areaAcres: 2.5,
        calculatedAreaAcres: 2.45,
        village: 'Ketti',
        taluk: 'Coonoor',
        district: 'Nilgiris',
        hasBoundary: true,
        gps: { lat: 11.35, lng: 76.78 },
        fmbReview: { status: 'PENDING', reason: null, reviewedBy: null, reviewedAt: null },
      },
    ],
    documents: [
      {
        documentKey: 'ID_PROOF:Aadhaar Card',
        docType: 'ID_PROOF',
        docSubType: 'Aadhaar Card',
        fileName: 'aadhaar.jpg',
        fileUrl: 'https://files.example/aadhaar.jpg',
        required: true,
        review: { status: 'PENDING', reason: null, reviewedBy: null, reviewedAt: null },
      },
    ],
    tohfaFarmerId: null,
    decidedAt: null,
    rejectionReason: null,
    rejectionReasonCode: null,
    infoRequest: null,
    infoRequestDetail: null,
    zoneId: null,
    applicationCode: 'APP-001',
    reviewHistory: [],
    documentVerification: 'pending',
    reviewGates: {
      farmVerification: {
        met: false,
        blockers: [{ kind: 'DOCUMENT_PENDING', documentKey: 'ID_PROOF:Aadhaar Card' }],
      },
      approval: {
        met: false,
        blockers: [{ kind: 'DOCUMENT_PENDING', documentKey: 'ID_PROOF:Aadhaar Card' }],
      },
    },
    declaration: null,
    ...over,
  };
}

let live: { application: ApplicationDetailView | undefined; isLoading: boolean; error: unknown };
let approve: ActionMock;
let reject: ActionMock;
let advance: ActionMock;
let verifyDoc: ActionMock;
let verifyFmb: ActionMock;
let addNote: ActionMock;
let requestInfo: ActionMock;

beforeEach(() => {
  vi.clearAllMocks();
  live = { application: makeDetail(), isLoading: false, error: null };
  approve = makeAction();
  reject = makeAction();
  advance = makeAction();
  verifyDoc = makeAction();
  verifyFmb = makeAction();
  addNote = makeAction();
  requestInfo = makeAction();
  hooks.useApplication.mockImplementation(() => ({ ...live, refresh: vi.fn(), isRefreshing: false }));
  hooks.useApproveApplication.mockImplementation(() => approve);
  hooks.useRejectApplication.mockImplementation(() => reject);
  hooks.useAdvanceApplication.mockImplementation(() => advance);
  hooks.useReviewApplicationDocument.mockImplementation(() => verifyDoc);
  hooks.useReviewApplicationFmb.mockImplementation(() => verifyFmb);
  hooks.useAddApplicationNote.mockImplementation(() => addNote);
  hooks.useRequestApplicationInfo.mockImplementation(() => requestInfo);
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

function press(tree: renderer.ReactTestRenderer, id: string) {
  act(() => {
    (byTestId(tree, id)[0]!.props['onPress'] as () => void)();
  });
}

function typeText(tree: renderer.ReactTestRenderer, id: string, value: string) {
  act(() => {
    (byTestId(tree, id)[0]!.props['onChangeText'] as (v: string) => void)(value);
  });
}

function mount(codes: readonly string[] = FULL_CODES): renderer.ReactTestRenderer {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <AdminApplicationDetailScreen applicationId={APP_ID} can={allow(codes)} onBack={vi.fn()} />,
    );
  });
  return tree;
}

describe('Task 4 wired controls: document verification', () => {
  it('verifies a document on success, shows feedback, and handles server error', () => {
    const tree = mount();
    press(tree, 'farmerApps.markVerified.ID_PROOF');
    expect(verifyDoc.run).toHaveBeenCalledWith(
      { documentKey: 'ID_PROOF:Aadhaar Card', decision: 'VERIFIED' },
      expect.any(Function),
    );
    const onDone = verifyDoc.run.mock.calls[0]![1] as () => void;
    act(() => onDone());
    expect(verifyDoc.finish).toHaveBeenCalledTimes(1);
    expect(allText(tree)).toContain(t('farmerApps.doc.verifiedSuccess'));

    verifyDoc.error = problem('FORBIDDEN', 403);
    act(() => {
      tree.update(<AdminApplicationDetailScreen applicationId={APP_ID} can={allow(FULL_CODES)} onBack={vi.fn()} />);
    });
    expect(allText(tree)).toContain(t('admin.error.FORBIDDEN'));
  });

  it('rejects a document with a validated reason and denies without permission', () => {
    const deniedTree = mount(VIEW_ONLY_CODES);
    const deniedBtn = byTestId(deniedTree, 'farmerApps.markVerified.ID_PROOF')[0]!;
    expect(deniedBtn.props['disabled']).toBe(true);
    expect(deniedBtn.props['accessibilityHint']).toBe(t('farmerApps.doc.permissionDenied'));

    const tree = mount();
    press(tree, 'farmerApps.rejectDoc.ID_PROOF');
    typeText(tree, 'farmerApps.docRejectReasonInput', 'Blurry scan');
    press(tree, 'farmerApps.docRejectConfirm');
    expect(verifyDoc.run).toHaveBeenCalledWith(
      { documentKey: 'ID_PROOF:Aadhaar Card', decision: 'REJECTED', reason: 'Blurry scan' },
      expect.any(Function),
    );
  });
});

describe('Task 4 wired controls: FMB boundary verification', () => {
  it('verifies FMB, rejects FMB with reason, surfaces server failure, and checks permission', () => {
    const deniedTree = mount(VIEW_ONLY_CODES);
    expect(byTestId(deniedTree, 'farmerApps.fmbVerify.loc-1')[0]!.props['disabled']).toBe(true);
    expect(byTestId(deniedTree, 'farmerApps.fmbVerify')[0]!.props['accessibilityHint']).toBe(t('farmerApps.fmb.permissionDenied'));

    const tree = mount();
    press(tree, 'farmerApps.fmbVerify.loc-1');
    expect(verifyFmb.run).toHaveBeenCalledWith(
      { locationId: 'loc-1', decision: 'VERIFIED' },
      expect.any(Function),
    );
    act(() => (verifyFmb.run.mock.calls[0]![1] as () => void)());
    expect(verifyFmb.finish).toHaveBeenCalledTimes(1);
    expect(allText(tree)).toContain(t('farmerApps.fmb.verifiedSuccess'));

    press(tree, 'farmerApps.fmbReject.loc-1');
    typeText(tree, 'farmerApps.fmbRejectReasonInput', 'Boundary crosses road');
    press(tree, 'farmerApps.fmbRejectConfirm');
    expect(verifyFmb.run).toHaveBeenLastCalledWith(
      { locationId: 'loc-1', decision: 'REJECTED', reason: 'Boundary crosses road' },
      expect.any(Function),
    );

    verifyFmb.error = problem('APPLICATION_FMB_NOT_VERIFIED', 422);
    act(() => {
      tree.update(<AdminApplicationDetailScreen applicationId={APP_ID} can={allow(FULL_CODES)} onBack={vi.fn()} />);
    });
    expect(allText(tree)).toContain(t('admin.error.APPLICATION_FMB_NOT_VERIFIED'));
  });
});

describe('Task 4 wired controls: advance, gates, request info, notes, history, and approval notes', () => {
  it('blocks advancing while docs gate is unmet, then advances when met and surfaces server failure', () => {
    const blockedTree = mount();
    const blockedBtn = byTestId(blockedTree, 'farmerApps.advanceToFarmVerification')[0]!;
    expect(blockedBtn.props['disabled']).toBe(true);
    expect(allText(blockedTree)).toContain(t('farmerApps.gate.docsPending.one'));

    const deniedTree = mount(VIEW_ONLY_CODES);
    expect(byTestId(deniedTree, 'farmerApps.advanceToFarmVerification')[0]!.props['accessibilityHint']).toBe(
      t('farmerApps.tracking.moveDenied'),
    );

    live.application = makeDetail({
      reviewGates: {
        farmVerification: { met: true, blockers: [] },
        approval: { met: false, blockers: [] },
      },
    });
    const tree = mount();
    press(tree, 'farmerApps.advanceToFarmVerification');
    expect(advance.run).toHaveBeenCalledWith({ toStatus: 'FARM_VERIFICATION' }, expect.any(Function));
    act(() => (advance.run.mock.calls[0]![1] as () => void)());
    expect(advance.finish).toHaveBeenCalledTimes(1);
    expect(allText(tree)).toContain(t('farmerApps.tracking.movedSuccess'));

    advance.error = problem('APPLICATION_DOCUMENTS_NOT_VERIFIED', 422);
    act(() => {
      tree.update(<AdminApplicationDetailScreen applicationId={APP_ID} can={allow(FULL_CODES)} onBack={vi.fn()} />);
    });
    expect(allText(tree)).toContain(t('admin.error.APPLICATION_DOCUMENTS_NOT_VERIFIED'));
  });

  it('adds review notes, renders reviewHistory entries, shows INFO_REQUESTED banner, and sends approve note', () => {
    live.application = makeDetail({
      status: 'INFO_REQUESTED',
      infoRequest: 'Upload clear Aadhaar photo',
      infoRequestDetail: {
        items: ['AADHAAR'],
        message: 'Upload clear Aadhaar photo',
        requestedAt: '2026-11-11T08:00:00Z',
        requestedBy: 'admin-1',
        open: true,
      },
      reviewHistory: [
        {
          id: 'h1',
          eventType: 'NOTE',
          fromStatus: null,
          toStatus: 'DOCS_REVIEW',
          note: 'Checked survey number',
          reasonCode: null,
          requestedItems: null,
          actorId: 'admin-1',
          createdAt: '2026-11-10T06:00:00Z',
        },
        {
          id: 'h2',
          eventType: 'TRANSITION',
          fromStatus: 'DOCS_REVIEW',
          toStatus: 'INFO_REQUESTED',
          note: 'Upload clear Aadhaar photo',
          reasonCode: null,
          requestedItems: ['AADHAAR'],
          actorId: 'admin-1',
          createdAt: '2026-11-11T08:00:00Z',
        },
      ],
    });
    const tree = mount();
    const text = allText(tree);
    expect(text).toContain('Checked survey number');
    expect(text).toContain('AADHAAR');
    expect(text).toContain(t('farmerApps.status.INFO_REQUESTED'));

    typeText(tree, 'farmerApps.reviewNotes', 'Verified by field officer');
    press(tree, 'farmerApps.saveProgress');
    expect(addNote.run).toHaveBeenCalledWith({ note: 'Verified by field officer' }, expect.any(Function));
    act(() => (addNote.run.mock.calls[0]![1] as () => void)());
    expect(addNote.finish).toHaveBeenCalledTimes(1);
    expect(allText(tree)).toContain(t('farmerApps.decision.noteSaved'));

    live.application = makeDetail({
      status: 'FARM_VERIFICATION',
      reviewGates: { farmVerification: { met: true, blockers: [] }, approval: { met: true, blockers: [] } },
    });
    act(() => {
      tree.update(<AdminApplicationDetailScreen applicationId={APP_ID} can={allow(FULL_CODES)} onBack={vi.fn()} />);
    });
    press(tree, 'farmerApps.approve');
    typeText(tree, 'farmerApps.approve.notes', 'Ready for onboarding');
    press(tree, 'farmerApps.approve.confirm');
    expect(approve.run).toHaveBeenCalledWith({ note: 'Ready for onboarding' }, expect.any(Function));
  });

  it('surfaces request-info validation error and server failure', () => {
    const tree = mount();
    press(tree, 'farmerApps.openRequestInfo');
    press(tree, 'farmerApps.requestInfo.send');
    expect(allText(tree)).toContain(t('farmerApps.requestInfo.validation.items'));
    expect(requestInfo.run).not.toHaveBeenCalled();

    requestInfo.error = problem('CONFLICT', 409);
    act(() => {
      tree.update(<AdminApplicationDetailScreen applicationId={APP_ID} can={allow(FULL_CODES)} onBack={vi.fn()} />);
    });
    expect(allText(tree)).toContain(t('admin.error.CONFLICT'));
  });
});
