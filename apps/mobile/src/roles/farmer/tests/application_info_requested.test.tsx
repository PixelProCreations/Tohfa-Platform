import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';
import { createAsyncStorageMock } from '../../../tests/mocks/asyncStorageMock';

vi.mock('@react-native-async-storage/async-storage', () => createAsyncStorageMock());
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  ScrollView: 'ScrollView',
  StyleSheet: { create: <T,>(s: T): T => s },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('@tohfa/mobile-ui', () => ({
  ErrorState: 'ErrorState',
  Icon: 'Icon',
  SafeAreaView: 'SafeAreaView',
  Skeleton: 'Skeleton',
}));

const apiMocks = vi.hoisted(() => ({
  fetchApplicationStatus: vi.fn(),
  getFarmerApplicationDraft: vi.fn(),
  resubmitFarmerApplication: vi.fn(),
  saveFarmerApplicationStep: vi.fn(),
  submitFarmerApplication: vi.fn(),
}));

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/auth')>();
  return {
    ...actual,
    fetchApplicationStatus: apiMocks.fetchApplicationStatus,
  };
});

vi.mock('../api/registration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/registration')>();
  return {
    ...actual,
    getFarmerApplicationDraft: apiMocks.getFarmerApplicationDraft,
    resubmitFarmerApplication: apiMocks.resubmitFarmerApplication,
    saveFarmerApplicationStep: apiMocks.saveFarmerApplicationStep,
    submitFarmerApplication: apiMocks.submitFarmerApplication,
  };
});

import { t } from '../../../i18n/farmer';
import { useRegistrationDraftStore } from '../storage/registrationDraft';
import { ApplicationStatusScreen } from '../screens/auth/ApplicationStatusScreen';
import { Step5Review } from '../screens/registration/Step5Review';

const APP_ID = '9a4d5f80-1111-4444-8888-222222222222';

function texts(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  return (node.children ?? []).flatMap(texts);
}

function allText(tree: renderer.ReactTestRenderer): string {
  return texts(tree.toJSON()).join('\n');
}

function byTestId(tree: renderer.ReactTestRenderer, id: string): ReactTestInstance[] {
  return tree.root.findAll((n) => typeof n.type === 'string' && n.props['testID'] === id);
}

beforeEach(() => {
  vi.clearAllMocks();
  useRegistrationDraftStore.setState({
    draft: { applicationId: 'draft-temp', currentStep: 1 },
    hasHydrated: true,
  });
});

describe('Farmer INFO_REQUESTED display & resubmit flow (Task 5)', () => {
  it('displays requested items & message in INFO_REQUESTED and reopens requested step for resubmit', async () => {
    apiMocks.fetchApplicationStatus.mockResolvedValueOnce({
      applicationId: APP_ID,
      status: 'INFO_REQUESTED',
      submittedAt: '2026-11-10T05:00:00Z',
      expectedDecisionBy: '2026-11-15T05:00:00Z',
      infoRequest: {
        items: ['FMB_SKETCH', 'AADHAAR'],
        message: 'Please redraw boundary and upload clear Aadhaar scan.',
        requestedAt: '2026-11-12T05:00:00Z',
      },
      steps: [
        { status: 'DOCS_REVIEW', reachedAt: '2026-11-10T06:00:00Z', note: null },
        { status: 'INFO_REQUESTED', reachedAt: '2026-11-12T05:00:00Z', note: 'Please redraw boundary and upload clear Aadhaar scan.' },
      ],
    });
    apiMocks.getFarmerApplicationDraft.mockResolvedValueOnce({
      id: APP_ID,
      mobile: '+919870000002',
      fullName: 'Lakshmi Narayanan',
      status: 'INFO_REQUESTED',
      isDraft: false,
      currentStep: 5,
      completedSteps: [1, 2, 3, 4],
      step1Personal: { fullName: 'Lakshmi Narayanan', mobile: '+919870000002', village: 'Coonoor', taluk: 'Coonoor', district: 'Nilgiris', pincode: '643101' },
      step2FarmDetails: { farmName: 'Lakshmi Farms', experienceYears: 6, totalAreaAcres: 3.5, primaryCrops: ['Tea'] },
      step3Location: { locations: [{ key: 'l1', label: 'Plot A', areaAcres: 3.5, latitude: 11.35, longitude: 76.79 }] },
      step4Documents: { documents: [{ docType: 'ID_PROOF', docSubType: 'AADHAAR', fileName: 'aadhaar.jpg', fileUrl: 'https://files.example/a.jpg' }] },
      submittedAt: '2026-11-10T05:00:00Z',
      createdAt: '2026-11-09T05:00:00Z',
    });

    const onNavigate = vi.fn();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<ApplicationStatusScreen applicationId={APP_ID} onNavigate={onNavigate} />);
    });

    const text = allText(tree);
    expect(text).toContain(t('farmer.applicationStatus.infoRequested.bannerTitle'));
    expect(text).toContain(t('farmer.applicationStatus.item.FMB_SKETCH'));
    expect(text).toContain(t('farmer.applicationStatus.item.AADHAAR'));
    expect(text).toContain('Please redraw boundary and upload clear Aadhaar scan.');

    await act(async () => {
      await (byTestId(tree, 'farmer.applicationStatus.resubmitBtn')[0]!.props['onPress'] as () => Promise<void>)();
    });

    const draftState = useRegistrationDraftStore.getState().draft;
    expect(draftState.applicationId).toBe(APP_ID);
    expect(draftState.isResubmit).toBe(true);
    expect(draftState.currentStep).toBe(3);
    expect(onNavigate).toHaveBeenCalledWith('Register');
  });

  it('shows rejection reason from server steps when status is REJECTED', async () => {
    apiMocks.fetchApplicationStatus.mockResolvedValueOnce({
      applicationId: APP_ID,
      status: 'REJECTED',
      submittedAt: '2026-11-10T05:00:00Z',
      infoRequest: null,
      steps: [{ status: 'REJECTED', reachedAt: '2026-11-13T05:00:00Z', note: 'Land proof did not match.' }],
    });

    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<ApplicationStatusScreen applicationId={APP_ID} onNavigate={vi.fn()} />);
    });

    const text = allText(tree);
    expect(byTestId(tree, 'farmer.applicationStatus.rejectedCard')).toHaveLength(1);
    expect(text).toContain('Land proof did not match.');
    expect(byTestId(tree, 'farmer.applicationStatus.resubmitBtn')).toHaveLength(0);
  });

  it('Step5Review calls resubmitFarmerApplication instead of submitFarmerApplication when draft.isResubmit is true', async () => {
    apiMocks.saveFarmerApplicationStep.mockResolvedValue({});
    apiMocks.resubmitFarmerApplication.mockResolvedValueOnce({ id: APP_ID, status: 'DOCS_REVIEW', step: 5, createdAt: '2026-11-09T05:00:00Z' });
    const onSubmitSuccess = vi.fn();

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <Step5Review
          draft={{
            applicationId: APP_ID,
            currentStep: 5,
            isResubmit: true,
            step1: { fullName: 'Lakshmi Narayanan', mobile: '+919870000002', aadhaarLast4: '4321', village: 'Coonoor', taluk: 'Coonoor', district: 'Nilgiris', pincode: '643101' },
            step2: { farmName: 'Lakshmi Farms', typeOfFarming: 'Organic', experienceYears: 6, totalAreaAcres: 3.5, numberOfFarms: 1, primaryCrops: ['Tea'] },
            step3: { locations: [{ id: 'l1', label: 'Plot A', areaAcres: 3.5, latitude: 11.35, longitude: 76.79 }] },
            step4: {
              documents: [
                { docType: 'ID_PROOF', docSubType: 'Aadhaar', fileName: 'aadhaar.jpg', fileUrl: 'https://files.example/a.jpg' },
                { docType: 'FARM_DOC', docSubType: 'Patta', fileName: 'patta.pdf', fileUrl: 'https://files.example/p.pdf' },
              ],
            },
          }}
          onSubmitSuccess={onSubmitSuccess}
          onBack={vi.fn()}
        />,
      );
    });

    expect(allText(tree)).toContain(t('farmer.registration.resubmit'));
    // Accept terms checkbox
    const touchables = tree.root.findAll((n) => (n.type as unknown) === 'TouchableOpacity');
    const termsTouch = touchables.find((n) => texts(n.children as unknown as ReactTestRendererJSON).join(' ').includes('Terms'))!;
    act(() => (termsTouch.props['onPress'] as () => void)());

    await act(async () => {
      await (byTestId(tree, 'farmer.registration.submitBtn')[0]!.props['onPress'] as () => Promise<void>)();
    });

    expect(apiMocks.resubmitFarmerApplication).toHaveBeenCalledWith(APP_ID);
    expect(apiMocks.submitFarmerApplication).not.toHaveBeenCalled();
    expect(onSubmitSuccess).toHaveBeenCalledWith(APP_ID);
  });
});
