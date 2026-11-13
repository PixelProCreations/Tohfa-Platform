import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  ImageBackground: 'ImageBackground',
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
}));

vi.mock('@tohfa/mobile-ui', () => ({
  SafeAreaView: 'SafeAreaView',
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  Rect: 'Rect',
}));

vi.mock('../assets/images', () => ({
  tohfaMarketLogo: 1,
  profileAdsBanner: 2,
  profileOrdersIcon: 3,
  profileWalletIcon: 4,
  profileWishlistIcon: 5,
}));

import { CustomerAccountScreen } from '../screens/CustomerAccountScreen';

describe('CustomerAccountScreen (Screen 73 · My Account)', () => {
  const mockNavigate = vi.fn();
  const mockBack = vi.fn();
  const mockSignOut = vi.fn();
  const mockViewProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user details correctly', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <CustomerAccountScreen
          userName="Suresh"
          userPhone="+91 99944 99944"
          userEmail="suresh1234567890@gmail.com"
          onNavigate={mockNavigate}
          onBack={mockBack}
          onSignOut={mockSignOut}
          onViewProfile={mockViewProfile}
        />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Suresh');
    expect(json).toContain('+91 99944 99944');
    expect(json).toContain('suresh1234567890@gmail.com');
    expect(json).toContain('View profile');
  });

  it('renders 3 summary cards (Orders, Wallet, Wishlist)', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <CustomerAccountScreen
          walletBalance="₹ 1,250"
          activeOrdersCount="No active Orders"
          wishlistCount="3 items"
          onNavigate={mockNavigate}
        />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('No active Orders');
    expect(json).toContain('Orders');
    expect(json).toContain('₹ 1,250');
    expect(json).toContain('Wallet');
    expect(json).toContain('3 items');
    expect(json).toContain('Wishlist');
  });

  it('renders all 6 menu options and footer branding', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <CustomerAccountScreen
          onNavigate={mockNavigate}
          onSignOut={mockSignOut}
        />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('My Orders');
    expect(json).toContain('Track, Manage and view your order history');
    expect(json).toContain('My Wallet');
    expect(json).toContain('Add money, view balance and transaction history');
    expect(json).toContain('Account settings');
    expect(json).toContain('Manage language, untis and settings');
    expect(json).toContain('Contact Support');
    expect(json).toContain('Get help for Orders, payments and other issues');
    expect(json).toContain('Help & FAQs');
    expect(json).toContain('Find answers to common questions');
    expect(json).toContain('Logout');
    expect(json).toContain("Come back soon. We'll miss you.");
    expect(json).toContain('© 2026 TOHFA Market. All rights reserved. App Version 1.0.0');
  });

  it('navigates to OrderHistory when Orders card or menu item is pressed', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <CustomerAccountScreen
          onNavigate={mockNavigate}
          onBack={mockBack}
          onSignOut={mockSignOut}
        />
      );
    });

    const ordersBtn = tree.root.findByProps({ accessibilityLabel: 'Orders' });
    await act(async () => {
      ordersBtn.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('OrderHistory');

    const myOrdersItem = tree.root.findByProps({ accessibilityLabel: 'My Orders' });
    await act(async () => {
      myOrdersItem.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('OrderHistory');
  });

  it('navigates to Topup when Wallet card or menu item is pressed', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <CustomerAccountScreen
          onNavigate={mockNavigate}
          onBack={mockBack}
          onSignOut={mockSignOut}
        />
      );
    });

    const walletBtn = tree.root.findByProps({ accessibilityLabel: 'Wallet' });
    await act(async () => {
      walletBtn.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('Topup');

    const myWalletItem = tree.root.findByProps({ accessibilityLabel: 'My Wallet' });
    await act(async () => {
      myWalletItem.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('Topup');
  });

  it('calls onBack when back button is pressed', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <CustomerAccountScreen
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

  it('calls onSignOut when Logout is pressed', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <CustomerAccountScreen
          onNavigate={mockNavigate}
          onSignOut={mockSignOut}
        />
      );
    });

    const logoutBtn = tree.root.findByProps({ accessibilityLabel: 'Logout' });
    await act(async () => {
      logoutBtn.props.onPress();
    });
    expect(mockSignOut).toHaveBeenCalled();
  });
});
