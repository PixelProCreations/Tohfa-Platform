/**
 * CustomerProfileScreen (Screens 74, 75, 76, 79 & email verification) against
 * GET/PATCH /customers/me, the default address and the email OTP endpoints
 * (BR-160, BR-190, BR-191). Network functions are mocked at module level; the
 * React Query hooks run on a real QueryClient.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import type * as ProfileModule from '../api/profile';
import type * as AddressesModule from '../api/addresses';
import type * as I18nModule from '../../../i18n/customer';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Problem } from '@tohfa/shared-types';
import { ApiError } from '../../../shell/api/client';

const mocks = vi.hoisted(() => ({
  fetchProfile: vi.fn(),
  patchProfile: vi.fn(),
  requestEmailOtp: vi.fn(),
  verifyEmailOtp: vi.fn(),
  listAddresses: vi.fn(),
  updateAddress: vi.fn(),
  createAddress: vi.fn(),
  setLocale: vi.fn(),
}));

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  Platform: {
    OS: 'android',
    select: (obj: Record<string, unknown>) => obj['android'] ?? obj['default'],
  },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: {
    create: (s: Record<string, unknown>) => s,
    hairlineWidth: 1,
    absoluteFill: {},
    absoluteFillObject: {},
  },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
  StatusBar: 'StatusBar',
  Modal: (props: any) => (props.visible ? React.createElement('Modal', props, props.children) : null),
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 48, bottom: 24, left: 0, right: 0 }),
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  Rect: 'Rect',
}));

vi.mock('../assets/images', () => ({
  branchLeavesTopLeft: 1,
  profileEmailVerified: 2,
  profileAvatarMale: 3,
  profileAvatarFemale: 4,
  satelliteMapCoimbatore: 5,
}));

vi.mock('../../../i18n/customer', async (importOriginal) => {
  const actual = await importOriginal<typeof I18nModule>();
  return { ...actual, setLocale: mocks.setLocale };
});

vi.mock('../api/profile', async (importOriginal) => {
  const actual = await importOriginal<typeof ProfileModule>();
  return {
    ...actual,
    requestEmailOtp: mocks.requestEmailOtp,
    verifyEmailOtp: mocks.verifyEmailOtp,
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

vi.mock('../api/addresses', async (importOriginal) => {
  const actual = await importOriginal<typeof AddressesModule>();
  return {
    ...actual,
    useAddresses: () =>
      useQuery({ queryKey: actual.addressQueryKeys.list, queryFn: () => mocks.listAddresses(), retry: false }),
    useUpdateAddress: () =>
      useMutation({ mutationFn: (v: { id: string; input: unknown }) => mocks.updateAddress(v.id, v.input) }),
    useCreateAddress: () => useMutation({ mutationFn: (input: unknown) => mocks.createAddress(input) }),
  };
});

import { CustomerProfileScreen } from '../screens/CustomerProfileScreen';

const apiProfile = {
  id: 'c1',
  customerCode: 'CUS-1',
  fullName: 'Meena Raj',
  mobile: '+919876543210',
  email: 'meena@example.com',
  emailVerified: false,
  age: 34,
  gender: 'FEMALE',
  harvestPreferences: [],
  photoKey: null,
  customerType: 'RETAIL',
  businessName: null,
  gstin: null,
  gstVerified: false,
  defaultAddressId: 'a1',
  preferredLocale: 'en',
  profileComplete: true,
  missingFields: [],
  createdAt: '2026-01-01T00:00:00Z',
};
const apiAddress = {
  id: 'a1',
  label: 'HOME',
  line1: '4, Lake View Street',
  line2: 'Race Course',
  city: 'Coimbatore',
  district: null,
  state: 'Tamil Nadu',
  pincode: '641018',
  lat: null,
  lng: null,
  landmark: null,
  contactPhone: null,
  nearestPickupPointId: null,
  isDefault: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
};

const apiError = (code: string, status: number, retryAfterSeconds: number | null = null, extra: object = {}) =>
  new ApiError(
    { type: 'about:blank', title: code, status, code: code as Problem['code'], ...extra } as Problem,
    { retryAfterSeconds },
  );

const flush = () =>
  act(async () => {
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
const pressable = (tree: renderer.ReactTestRenderer, label: string) => {
  const node = tree.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];
  if (!node) throw new Error(`no pressable ${label}`);
  return node;
};
const press = async (tree: renderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    await pressable(tree, label).props.onPress();
  });
  await flush();
};
const inputWithPlaceholder = (tree: renderer.ReactTestRenderer, placeholder: string) =>
  tree.root.findAll((n) => n.props.placeholder === placeholder && typeof n.props.onChangeText === 'function')[0]!;
const typeInto = async (tree: renderer.ReactTestRenderer, placeholder: string, value: string) => {
  await act(async () => {
    inputWithPlaceholder(tree, placeholder).props.onChangeText(value);
  });
};
const text = (tree: renderer.ReactTestRenderer) => JSON.stringify(tree.toJSON());

describe('CustomerProfileScreen (Screens 74, 75, 76, 79 & Email Verification)', () => {
  const mockNavigate = vi.fn();
  const mockBack = vi.fn();
  const mockSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchProfile.mockResolvedValue(apiProfile);
    mocks.listAddresses.mockResolvedValue([apiAddress]);
    mocks.patchProfile.mockImplementation(async (input: Record<string, unknown>) => ({ ...apiProfile, ...input }));
    mocks.updateAddress.mockImplementation(async (_id: string, input: Record<string, unknown>) => ({ ...apiAddress, ...input }));
    mocks.createAddress.mockImplementation(async (input: Record<string, unknown>) => ({ ...apiAddress, ...input }));
    mocks.requestEmailOtp.mockResolvedValue({ email: 'meena@example.com', expiresAt: '2026-11-17T10:10:00Z' });
    mocks.verifyEmailOtp.mockResolvedValue({ ...apiProfile, emailVerified: true });
  });

  it('BR-190: renders Empty Mode placeholders for a new account (placeholder name, no address)', async () => {
    mocks.fetchProfile.mockResolvedValue({
      ...apiProfile,
      fullName: 'TOHFA Customer',
      email: null,
      age: null,
      gender: null,
      defaultAddressId: null,
      profileComplete: false,
    });
    mocks.listAddresses.mockResolvedValue([]);
    const tree = await mount(<CustomerProfileScreen initialMode="empty" onNavigate={mockNavigate} onBack={mockBack} />);

    const json = text(tree);
    expect(json).toContain('My Profile');
    expect(json).toContain('your profile details');
    expect(json).toContain('Personal details');
    expect(json).toContain('Please enter your name');
    expect(json).not.toContain('TOHFA Customer');
    expect(json).toContain('+91 98765 43210');
    expect(json).toContain('Please enter your email');
    expect(json).toContain('Please enter your Age');
    expect(json).toContain('Address details');
    expect(json).toContain('Please enter your address');
    expect(json).toContain('Select city');
    expect(json).toContain('Please enter your pincode');
    expect(json).toContain('Select State');
    expect(json).toContain('Location on Map');
  });

  it('BR-160: renders View Mode from GET /customers/me + the default address (no demo data)', async () => {
    const tree = await mount(<CustomerProfileScreen initialMode="view" onNavigate={mockNavigate} onBack={mockBack} />);

    const json = text(tree);
    expect(json).toContain('Meena Raj');
    expect(json).toContain('+91 98765 43210');
    expect(json).toContain('meena@example.com');
    expect(json).toContain('Verify now >');
    expect(json).toContain('Age 34');
    expect(json).toContain('English');
    expect(json).toContain('4, Lake View Street, Race Course');
    expect(json).toContain('Coimbatore');
    expect(json).toContain('641018');
    expect(json).toContain('Tamil Nadu');
    expect(json).toContain('Selected Location');
    expect(json).not.toContain('Arun Kumar');
  });

  it('shows a loading state, then error + retry when the profile cannot load', async () => {
    mocks.fetchProfile.mockReturnValue(new Promise(() => undefined));
    const loading = await mount(<CustomerProfileScreen initialMode="view" />);
    expect(loading.root.findAllByProps({ testID: 'profile-loading' }).length).toBeGreaterThan(0);

    mocks.fetchProfile.mockRejectedValue(apiError('INTERNAL', 500));
    const failed = await mount(<CustomerProfileScreen initialMode="view" />);
    expect(failed.root.findAllByProps({ testID: 'profile-error' }).length).toBeGreaterThan(0);
    mocks.fetchProfile.mockResolvedValue(apiProfile);
    await press(failed, 'Retry');
    expect(text(failed)).toContain('Meena Raj');
  });

  it('BR-191: Edit Mode saves only changed fields (fullName/age/gender/preferredLocale) and the default address', async () => {
    const tree = await mount(
      <CustomerProfileScreen initialMode="view" onNavigate={mockNavigate} onBack={mockBack} onSave={mockSave} />,
    );
    await press(tree, 'Edit Profile');
    let json = text(tree);
    expect(json).toContain('Edit Profile');
    expect(json).toContain('Update your details');
    expect(json).toContain('Save Changes');
    // Mobile stays read-only in edit mode.
    expect(tree.root.findAll((n) => n.props.placeholder === 'Please enter your Number').length).toBe(0);

    await typeInto(tree, 'Please enter your name', 'Meena R');
    await typeInto(tree, 'Please enter your Age', '35');
    await press(tree, 'Male');
    await press(tree, 'Language');
    await typeInto(tree, 'Please enter your pincode', '641002');
    await press(tree, 'Save Changes');

    expect(mocks.patchProfile).toHaveBeenCalledWith({
      fullName: 'Meena R',
      age: 35,
      gender: 'MALE',
      preferredLocale: 'ta',
    });
    expect(mocks.setLocale).toHaveBeenCalledWith('ta');
    expect(mocks.updateAddress).toHaveBeenCalledWith('a1', {
      line1: '4, Lake View Street, Race Course',
      line2: null,
      city: 'Coimbatore',
      pincode: '641002',
      state: 'Tamil Nadu',
    });
    expect(mocks.createAddress).not.toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
    json = text(tree);
    expect(json).toContain('My Profile');
    expect(json).toContain('your profile details');
  });

  it('creates a default address when the customer has none', async () => {
    mocks.listAddresses.mockResolvedValue([]);
    const tree = await mount(<CustomerProfileScreen initialMode="edit" />);
    await typeInto(tree, 'Please enter your address', '9 Temple Road');
    await typeInto(tree, 'Select city', 'Madurai');
    await typeInto(tree, 'Please enter your pincode', '625001');
    await press(tree, 'Save Changes');
    expect(mocks.createAddress).toHaveBeenCalledWith(
      expect.objectContaining({ line1: '9 Temple Road', city: 'Madurai', pincode: '625001', isDefault: true, label: 'HOME' }),
    );
    expect(mocks.patchProfile).not.toHaveBeenCalled();
  });

  it('validates age and pincode locally and maps a 422 field error from the API', async () => {
    const tree = await mount(<CustomerProfileScreen initialMode="edit" />);
    await typeInto(tree, 'Please enter your Age', '150');
    await typeInto(tree, 'Please enter your pincode', '12');
    await press(tree, 'Save Changes');
    expect(text(tree)).toContain('Age must be between 13 and 120.');
    expect(text(tree)).toContain('Enter a valid 6-digit pincode');
    expect(mocks.patchProfile).not.toHaveBeenCalled();

    await typeInto(tree, 'Please enter your Age', '40');
    await typeInto(tree, 'Please enter your pincode', '641018');
    mocks.patchProfile.mockRejectedValue(
      apiError('VALIDATION_FAILED', 422, null, { errors: { 'body.age': ['age is not allowed'] } }),
    );
    await press(tree, 'Save Changes');
    expect(tree.root.findByProps({ testID: 'profile-age-error' }).props.children).toBe('age is not allowed');
    expect(tree.root.findAllByProps({ testID: 'profile-save-error' }).length).toBeGreaterThan(0);
    expect(text(tree)).toContain('Edit Profile');
  });

  it('BR-160: executes the full email verification flow (request OTP -> 6-digit code -> verified)', async () => {
    const tree = await mount(<CustomerProfileScreen initialMode="view" onNavigate={mockNavigate} onBack={mockBack} />);

    await press(tree, 'Verify now');
    expect(mocks.requestEmailOtp).toHaveBeenCalledWith('meena@example.com');

    let json = text(tree);
    expect(json).toContain('Please enter 6-digit PIN Sent to');
    expect(json).toContain('meen*@example.com');
    expect(json).toContain("Didn't receive the PIN?");
    expect(json).toContain('Resend in 60s');
    expect(pressable(tree, 'Continue').props.disabled).toBe(true);

    // Paste the whole code into the first box.
    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: 'PIN digit 1' }).props.onChangeText('123456');
    });
    await press(tree, 'Continue');
    expect(mocks.verifyEmailOtp).toHaveBeenCalledWith({ email: 'meena@example.com', code: '123456' });

    json = text(tree);
    expect(json).toContain('Email Verified!');
    expect(json).toContain('Your email address has been successfully verified.');

    await press(tree, 'Continue to Profile');
    json = text(tree);
    expect(json).not.toContain('Verify now >');
  });

  it('shows OTP_INVALID inside the modal and honours a 429 retryAfterSeconds resend cooldown', async () => {
    const tree = await mount(<CustomerProfileScreen initialMode="view" />);
    await press(tree, 'Verify now');
    mocks.verifyEmailOtp.mockRejectedValue(apiError('OTP_INVALID', 422));
    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: 'PIN digit 1' }).props.onChangeText('999999');
    });
    await press(tree, 'Continue');
    expect(tree.root.findAllByProps({ testID: 'email-otp-error' }).length).toBeGreaterThan(0);
    expect(text(tree)).toContain('That code is not correct or has expired.');
    expect(text(tree)).not.toContain('Email Verified!');

    // A rejected resend with Retry-After drives the countdown.
    mocks.requestEmailOtp.mockRejectedValue(apiError('OTP_RESEND_TOO_SOON', 429, 42));
    const fresh = await mount(<CustomerProfileScreen initialMode="view" />);
    await press(fresh, 'Verify now');
    expect(text(fresh)).toContain('42');
  });

  it("503 EMAIL_NOT_CONFIGURED -> 'Email verification isn't available right now' and hides Verify now", async () => {
    mocks.requestEmailOtp.mockRejectedValue(apiError('EMAIL_NOT_CONFIGURED', 503));
    const tree = await mount(<CustomerProfileScreen initialMode="view" />);
    await press(tree, 'Verify now');
    const json = text(tree);
    expect(json).toContain("Email verification isn't available right now");
    expect(json).not.toContain('Verify now >');
    expect(json).not.toContain('PIN Sent to');
  });

  it('navigates back when Back button is pressed', async () => {
    const tree = await mount(<CustomerProfileScreen initialMode="view" onNavigate={mockNavigate} onBack={mockBack} />);
    await press(tree, 'Back');
    expect(mockBack).toHaveBeenCalled();
  });
});
