import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import type * as LegalApi from '../api/legal';

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
  Dimensions: { get: vi.fn(() => ({ width: 390, height: 844 })) },
  Modal: (props: any) => (props.visible ? React.createElement('Modal', props, props.children) : null),
}));

vi.mock('../api/legal', async (orig) => {
  const actual = await orig<typeof LegalApi>();
  return {
    ...actual,
    useLegal: () => ({
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      data: {
        title: 'Doc',
        version: 1,
        language: 'en',
        lastUpdated: '2026-11-12T00:00:00Z',
        body: '# 1. Introduction\n\n- Full name\n',
      },
    }),
  };
});
vi.mock('../api/profile', () => ({ deleteCustomerAccount: vi.fn() }));
vi.mock('../api/auth', () => ({ logout: vi.fn() }));

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
  walletPouchCard: 1,
  profileEmailVerified: 2,
  walletMoneyAddedSuccess: 2,
  profileWalletIcon: 3,
  profileOrdersIcon: 4,
  profileWishlistIcon: 5,
  profileAdsBanner: 6,
  profileAvatarMale: 7,
  profileAvatarFemale: 8,
  satelliteMapCoimbatore: 9,
  tohfaMarketLogo: 10,
}));

vi.mock('../assets/images/products', () => ({
  ProductImages: {
    fruitApple: 1,
    foryouTomatoes: 2,
    vegCarrot: 3,
    foryouLettuce: 4,
    vegCauliflower: 5,
  },
  CategoryImages: {},
  SectionBadges: {},
}));

import { CustomerAccountSettingsScreen } from '../screens/CustomerAccountSettingsScreen';
import { CustomerPrivacyPolicyScreen } from '../screens/CustomerPrivacyPolicyScreen';
import { CustomerTermsScreen } from '../screens/CustomerTermsScreen';

describe('Customer Sub-Screens (Orders, Wallet, Support, Help, Notifications)', () => {
  const mockNavigate = vi.fn();
  const mockBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // OrderHistoryScreen / SearchScreen are server-driven now: see orders_screens.test.tsx and catalog_screens.test.tsx.

  it('renders CustomerAccountSettingsScreen and navigates to Privacy Policy and Terms', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CustomerAccountSettingsScreen onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Account Settings');
    expect(json).toContain('Privacy Policy');
    expect(json).toContain('Read more about how we handle data');
    expect(json).toContain('Terms and condition');
    expect(json).toContain('Know the rules for using our service.');

    // Click Privacy Policy
    const privacyBtn = tree.root.findByProps({ accessibilityLabel: 'Privacy Policy' });
    await act(async () => {
      privacyBtn.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('CustomerPrivacyPolicy');

    // Click Terms and condition
    const termsBtn = tree.root.findByProps({ accessibilityLabel: 'Terms and condition' });
    await act(async () => {
      termsBtn.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('CustomerTerms');
  });

  it('renders CustomerPrivacyPolicyScreen header and API-driven body (BR-172)', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CustomerPrivacyPolicyScreen onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Privacy Policy');
    expect(json).toContain('TOHFA Market');
    expect(json).toContain('Last Updated: 12/11/2026');
    expect(json).toContain('1. Introduction');
    expect(json).toContain('Full name');
  });

  it('renders CustomerTermsScreen header and API-driven body (BR-172)', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CustomerTermsScreen onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Terms and condition');
    expect(json).toContain('TOHFA Market');
    expect(json).toContain('Last Updated: 12/11/2026');
    expect(json).toContain('1. Introduction');
  });
});

