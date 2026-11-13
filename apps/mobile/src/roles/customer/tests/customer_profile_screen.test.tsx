import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

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
    absoluteFillObject: {},
  },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
  StatusBar: 'StatusBar',
  Modal: (props: any) => (props.visible ? React.createElement('Modal', props, props.children) : null),
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

import { CustomerProfileScreen } from '../screens/CustomerProfileScreen';

describe('CustomerProfileScreen (Screens 74, 75, 76, 79 & Email Verification)', () => {
  const mockNavigate = vi.fn();
  const mockBack = vi.fn();
  const mockSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in Empty Mode (Screen 74: new user create profile)', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <CustomerProfileScreen
          initialMode="empty"
          onNavigate={mockNavigate}
          onBack={mockBack}
        />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('My Profile');
    expect(json).toContain('your profile details');
    expect(json).toContain('Personal details');
    expect(json).toContain('Please enter your name');
    expect(json).toContain('Please enter your Number');
    expect(json).toContain('Please enter your email');
    expect(json).toContain('Please enter your Age');
    expect(json).toContain('Select language');
    expect(json).toContain('Address details');
    expect(json).toContain('Please enter your address');
    expect(json).toContain('Select city');
    expect(json).toContain('Please enter your pincode');
    expect(json).toContain('Select State');
    expect(json).toContain('Location on Map');
  });

  it('renders in View Mode (Screen 75: existing user details with Verify now button)', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <CustomerProfileScreen
          initialMode="view"
          onNavigate={mockNavigate}
          onBack={mockBack}
        />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Arun Kumar');
    expect(json).toContain('+91 99944 99944');
    expect(json).toContain('suresh12345@gmail.com');
    expect(json).toContain('Verify now >');
    expect(json).toContain('Age 30');
    expect(json).toContain('English');
    expect(json).toContain('12, Tea Garden Road, Ooty, Nilgiris - 643001.');
    expect(json).toContain('Ooty');
    expect(json).toContain('643001');
    expect(json).toContain('Tamil Nadu, India');
    expect(json).toContain('Selected Location');
  });

  it('transitions to Edit Mode (Screen 76) when pencil button is pressed and saves changes', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <CustomerProfileScreen
          initialMode="view"
          onNavigate={mockNavigate}
          onBack={mockBack}
          onSave={mockSave}
        />
      );
    });

    // Press Edit Profile pencil button
    const editBtn = tree.root.findByProps({ accessibilityLabel: 'Edit Profile' });
    await act(async () => {
      editBtn.props.onPress();
    });

    let json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Edit Profile');
    expect(json).toContain('Update your details');
    expect(json).toContain('Save Changes');

    // Press Save Changes button
    const saveBtn = tree.root.findByProps({ accessibilityLabel: 'Save Changes' });
    await act(async () => {
      saveBtn.props.onPress();
    });

    expect(mockSave).toHaveBeenCalled();
    json = JSON.stringify(tree.toJSON());
    expect(json).toContain('My Profile');
    expect(json).toContain('your profile details');
  });

  it('executes the full email verification flow (Image 4 & 5)', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <CustomerProfileScreen
          initialMode="view"
          onNavigate={mockNavigate}
          onBack={mockBack}
        />
      );
    });

    // Click "Verify now >" on email
    const verifyNowBtn = tree.root.findByProps({ accessibilityLabel: 'Verify now' });
    await act(async () => {
      verifyNowBtn.props.onPress();
    });

    let json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Please enter 4-digit PIN Sent to');
    expect(json).toContain("Didn't receive the PIN?");

    // Press "Continue" in OTP Modal
    const continueBtn = tree.root.findByProps({ accessibilityLabel: 'Continue' });
    await act(async () => {
      continueBtn.props.onPress();
    });

    json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Email Verified!');
    expect(json).toContain('Your email address has been successfully verified.');

    // Press "Continue to Profile" in Success Modal
    const continueToProfileBtn = tree.root.findByProps({ accessibilityLabel: 'Continue to Profile' });
    await act(async () => {
      continueToProfileBtn.props.onPress();
    });

    // Email is now verified (Screen 79: no "Verify now >" button)
    json = JSON.stringify(tree.toJSON());
    expect(json).not.toContain('Verify now >');
  });

  it('navigates back when Back button is pressed', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <CustomerProfileScreen
          initialMode="view"
          onNavigate={mockNavigate}
          onBack={mockBack}
        />
      );
    });

    const backBtn = tree.root.findByProps({ accessibilityLabel: 'Back' });
    await act(async () => {
      backBtn.props.onPress();
    });

    expect(mockBack).toHaveBeenCalled();
  });
});

