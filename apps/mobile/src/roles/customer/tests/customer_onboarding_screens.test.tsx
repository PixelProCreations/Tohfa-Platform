/**
 * Onboarding profile steps (Name -> Age & gender -> Harvest preferences) against
 * PATCH /customers/me (BR-160, BR-190, BR-191). The profile module's network calls are
 * mocked at module level; the hooks run on a real QueryClient.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import type * as ProfileModule from '../api/profile';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Problem } from '@tohfa/shared-types';
import { ApiError, NetworkError } from '../../../shell/api/client';

const mocks = vi.hoisted(() => ({
  fetchProfile: vi.fn(),
  patchProfile: vi.fn(),
}));

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, hairlineWidth: 1, absoluteFill: {}, absoluteFillObject: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
  StatusBar: 'StatusBar',
}));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar' }));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect', Line: 'Line' }));

vi.mock('../api/profile', async (importOriginal) => {
  const actual = await importOriginal<typeof ProfileModule>();
  return {
    ...actual,
    useCustomerProfile: () =>
      useQuery({ queryKey: actual.profileQueryKeys.me, queryFn: () => mocks.fetchProfile(), retry: false }),
    useUpdateCustomerProfile: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (input: unknown) => mocks.patchProfile(input),
        onSuccess: (p: unknown) => qc.setQueryData(actual.profileQueryKeys.me, p),
      });
    },
  };
});

import { CustomerProfileNameScreen } from '../screens/CustomerProfileNameScreen';
import { CustomerProfileAgeGenderScreen } from '../screens/CustomerProfileAgeGenderScreen';
import { CustomerProfileHarvestPreferencesScreen } from '../screens/CustomerProfileHarvestPreferencesScreen';

const baseProfile = {
  id: 'c1',
  customerCode: 'CUS-1',
  fullName: 'TOHFA Customer',
  mobile: '+919876543210',
  email: null,
  emailVerified: false,
  age: null,
  gender: null,
  harvestPreferences: [] as string[],
  photoKey: null,
  customerType: 'RETAIL',
  businessName: null,
  gstin: null,
  gstVerified: false,
  defaultAddressId: null,
  preferredLocale: 'en',
  profileComplete: false,
  missingFields: ['fullName', 'age', 'gender', 'harvestPreferences'],
  createdAt: '2026-01-01T00:00:00Z',
};

const apiError = (code: string, status: number, errors?: Record<string, string[]>) =>
  new ApiError({ type: 'about:blank', title: code, status, code: code as Problem['code'], ...(errors ? { errors } : {}) } as Problem);

const flush = () => act(async () => {
  await new Promise((r) => setTimeout(r, 0));
});

async function mount(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<QueryClientProvider client={qc}>{el}</QueryClientProvider>);
  });
  await flush();
  return tree;
}

const press = async (tree: renderer.ReactTestRenderer, label: string) => {
  const node = tree.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];
  if (!node) throw new Error(`no pressable ${label}`);
  await act(async () => {
    await node.props.onPress();
  });
  await flush();
};
const type = async (tree: renderer.ReactTestRenderer, label: string, value: string) => {
  const input = tree.root.findByProps({ accessibilityLabel: label });
  await act(async () => {
    input.props.onChangeText(value);
  });
};
const text = (tree: renderer.ReactTestRenderer) => JSON.stringify(tree.toJSON());

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetchProfile.mockResolvedValue(baseProfile);
  mocks.patchProfile.mockImplementation(async (input: Record<string, unknown>) => ({ ...baseProfile, ...input }));
});

describe('BR-190 CustomerProfileNameScreen: PATCH fullName on Next', () => {
  it('sends the trimmed name and moves to Age & gender', async () => {
    const nav = vi.fn();
    const tree = await mount(<CustomerProfileNameScreen onNavigate={nav} />);
    // The sign-up placeholder name is never prefilled.
    expect(tree.root.findByProps({ accessibilityLabel: 'Your name' }).props.value).toBe('');
    await type(tree, 'Your name', '  Priya  ');
    await press(tree, 'Continue');
    expect(mocks.patchProfile).toHaveBeenCalledWith({ fullName: 'Priya' });
    expect(nav).toHaveBeenCalledWith('CustomerProfileAgeGender');
  });

  it('prefills a real saved name', async () => {
    mocks.fetchProfile.mockResolvedValue({ ...baseProfile, fullName: 'Arun' });
    const tree = await mount(<CustomerProfileNameScreen onNavigate={vi.fn()} />);
    expect(tree.root.findByProps({ accessibilityLabel: 'Your name' }).props.value).toBe('Arun');
  });

  it('shows a spinner while saving', async () => {
    let resolve!: (v: unknown) => void;
    mocks.patchProfile.mockReturnValue(new Promise((r) => (resolve = r)));
    const tree = await mount(<CustomerProfileNameScreen onNavigate={vi.fn()} />);
    await type(tree, 'Your name', 'Priya');
    const btn = tree.root.findAll((n) => n.props.accessibilityLabel === 'Continue' && typeof n.props.onPress === 'function')[0]!;
    await act(async () => {
      void btn.props.onPress();
    });
    expect(tree.root.findAllByProps({ testID: 'name-saving' }).length).toBeGreaterThan(0);
    await act(async () => {
      resolve({ ...baseProfile, fullName: 'Priya' });
    });
    await flush();
  });

  it('maps a 422 field error to the input and stays on the screen', async () => {
    mocks.patchProfile.mockRejectedValue(apiError('VALIDATION_FAILED', 422, { 'body.fullName': ['Name is too long'] }));
    const nav = vi.fn();
    const tree = await mount(<CustomerProfileNameScreen onNavigate={nav} />);
    await type(tree, 'Your name', 'Priya');
    await press(tree, 'Continue');
    expect(text(tree)).toContain('Name is too long');
    expect(nav).not.toHaveBeenCalled();
  });

  it('shows the offline message on a network error; Skip still works and sends nothing', async () => {
    mocks.patchProfile.mockRejectedValue(new NetworkError('offline', 'offline'));
    const nav = vi.fn();
    const tree = await mount(<CustomerProfileNameScreen onNavigate={nav} />);
    await type(tree, 'Your name', 'Priya');
    await press(tree, 'Continue');
    expect(text(tree)).toContain("You're offline");
    mocks.patchProfile.mockClear();
    await press(tree, 'Skip');
    expect(mocks.patchProfile).not.toHaveBeenCalled();
    expect(nav).toHaveBeenCalledWith('CustomerLoadingMarket');
  });
});

describe('BR-190 CustomerProfileAgeGenderScreen: PATCH age + gender', () => {
  it('sends age and the API gender enum, then moves to preferences', async () => {
    const nav = vi.fn();
    const tree = await mount(<CustomerProfileAgeGenderScreen onNavigate={nav} />);
    await type(tree, 'Your age', '29');
    await press(tree, 'Prefer not to say');
    await press(tree, 'Next Step');
    expect(mocks.patchProfile).toHaveBeenCalledWith({ age: 29, gender: 'PREFER_NOT_TO_SAY' });
    expect(nav).toHaveBeenCalledWith('CustomerProfilePreferences');
  });

  it('rejects an age outside 13..120 without calling the API', async () => {
    const nav = vi.fn();
    const tree = await mount(<CustomerProfileAgeGenderScreen onNavigate={nav} />);
    await type(tree, 'Your age', '9');
    await press(tree, 'Next Step');
    expect(text(tree)).toContain('Age must be between 13 and 120.');
    expect(mocks.patchProfile).not.toHaveBeenCalled();
    expect(nav).not.toHaveBeenCalled();
  });

  it('moves on without a PATCH when nothing was entered', async () => {
    const nav = vi.fn();
    const tree = await mount(<CustomerProfileAgeGenderScreen onNavigate={nav} />);
    await press(tree, 'Next Step');
    expect(mocks.patchProfile).not.toHaveBeenCalled();
    expect(nav).toHaveBeenCalledWith('CustomerProfilePreferences');
  });

  it('maps a server age error to the age field', async () => {
    mocks.patchProfile.mockRejectedValue(apiError('VALIDATION_FAILED', 422, { 'body.age': ['must be >= 13'] }));
    const nav = vi.fn();
    const tree = await mount(<CustomerProfileAgeGenderScreen onNavigate={nav} />);
    await type(tree, 'Your age', '30');
    await press(tree, 'Next Step');
    expect(tree.root.findByProps({ testID: 'age-error' }).props.children).toBe('must be >= 13');
    expect(nav).not.toHaveBeenCalled();
  });
});

describe('BR-191 CustomerProfileHarvestPreferencesScreen: two UI groups -> one harvestPreferences array', () => {
  it('sends eat:/care: prefixed slugs and moves to permissions', async () => {
    const nav = vi.fn();
    const tree = await mount(<CustomerProfileHarvestPreferencesScreen onNavigate={nav} />);
    await press(tree, 'Vegetarian');
    await press(tree, 'Gluten free');
    await press(tree, 'Pesticide free');
    await press(tree, 'Proceed to permissions');
    expect(mocks.patchProfile).toHaveBeenCalledWith({
      harvestPreferences: ['eat:veg', 'eat:gluten_free', 'care:pesticide_free'],
    });
    expect(nav).toHaveBeenCalledWith('CustomerPermissions');
  });

  it('prefills saved selections and skips the PATCH when unchanged', async () => {
    mocks.fetchProfile.mockResolvedValue({ ...baseProfile, harvestPreferences: ['eat:vegan', 'care:organic'] });
    const nav = vi.fn();
    const tree = await mount(<CustomerProfileHarvestPreferencesScreen onNavigate={nav} />);
    expect(tree.root.findByProps({ accessibilityLabel: 'Vegan' }).props.accessibilityState).toEqual({ selected: true });
    await press(tree, 'Proceed to permissions');
    expect(mocks.patchProfile).not.toHaveBeenCalled();
    expect(nav).toHaveBeenCalledWith('CustomerPermissions');
  });

  it('shows the mapped API error and stays on the screen', async () => {
    mocks.patchProfile.mockRejectedValue(apiError('INTERNAL', 500));
    const nav = vi.fn();
    const tree = await mount(<CustomerProfileHarvestPreferencesScreen onNavigate={nav} />);
    await press(tree, 'Organic');
    await press(tree, 'Proceed to permissions');
    expect(tree.root.findAllByProps({ testID: 'preferences-error' }).length).toBeGreaterThan(0);
    expect(nav).not.toHaveBeenCalled();
  });
});
