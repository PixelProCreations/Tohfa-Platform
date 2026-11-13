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
  Modal: (props: any) => (props.visible ? React.createElement('Modal', props, props.children) : null),
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

import { OrderHistoryScreen } from '../screens/OrderHistoryScreen';
import { CustomerWalletScreen } from '../screens/CustomerWalletScreen';
import { CustomerSupportScreen } from '../screens/CustomerSupportScreen';
import { CustomerHelpScreen } from '../screens/CustomerHelpScreen';
import { CustomerNotificationsScreen } from '../screens/CustomerNotificationsScreen';
import { CustomerAccountSettingsScreen } from '../screens/CustomerAccountSettingsScreen';
import { CustomerPrivacyPolicyScreen } from '../screens/CustomerPrivacyPolicyScreen';
import { CustomerTermsScreen } from '../screens/CustomerTermsScreen';

describe('Customer Sub-Screens (Orders, Wallet, Support, Help, Notifications)', () => {
  const mockNavigate = vi.fn();
  const mockBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders OrderHistoryScreen with search bar, recent orders, and dates', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <OrderHistoryScreen onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('My Orders');
    expect(json).toContain('Resent Orders');
    expect(json).toContain('Royal Gala');
    expect(json).toContain('ORD-20261105-0039');
    expect(json).toContain('Arrive Tomorrow');
    expect(json).toContain('Fresh Carrot');
    expect(json).toContain('Cauliflower');
    expect(json).toContain('View details');
  });

  it('renders CustomerWalletScreen with balance card, Add Money button, and recent transactions', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CustomerWalletScreen initialBalance={1250} onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('My wallet');
    expect(json).toContain('Wallet Balance');
    expect(json).toContain('1,250.00');
    expect(json).toContain('+ Add Money');
    expect(json).toContain('Recent Transactions');
    expect(json).toContain('Added to Wallet');
    expect(json).toContain('Order Payment');
    expect(json).toContain('Order Refund');
  });

  it('CustomerWalletScreen switches to Add Money view and shows quick select pills', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CustomerWalletScreen initialBalance={1250} onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    // Find and press + Add Money button
    const addMoneyBtn = tree.root.findByProps({ accessibilityLabel: 'Add Money' });
    await act(async () => {
      addMoneyBtn.props.onPress();
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Enter Amount');
    expect(json).toContain('Quick Select Amount');
    expect(json).toContain('Choose Payment Method');
    expect(json).toContain('UPI');
    expect(json).toContain('Debit / Credit Card');
    expect(json).toContain('Net Banking');
  });

  it('renders CustomerSupportScreen with filter tabs and tickets', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CustomerSupportScreen onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Contact Support');
    expect(json).toContain('Open (2)');
    expect(json).toContain('All (5)');
    expect(json).toContain('SUP-20261115-0039');
    expect(json).toContain('Product Support');
  });

  it('renders CustomerHelpScreen with search bar and FAQ categories', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CustomerHelpScreen onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Help & FAQs');
    expect(json).toContain('Orders & Delivery');
    expect(json).toContain('Payments & Wallet');
    expect(json).toContain('Returns & Refunds');
    expect(json).toContain('Products & Quality');
    expect(json).toContain('Account & Profile');
    // Default open question in Orders & Delivery
    expect(json).toContain('1. How can I track my order?');
    expect(json).toContain('You can track your order from My Orders');
  });

  it('CustomerHelpScreen expands another category and toggles questions', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CustomerHelpScreen onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    // Expand Payments & Wallet category
    const paymentsCategoryBtn = tree.root.findByProps({ accessibilityLabel: 'Payments & Wallet' });
    await act(async () => {
      paymentsCategoryBtn.props.onPress();
    });

    let json = JSON.stringify(tree.toJSON());
    expect(json).toContain('1. How can I add money to my TOHFA Wallet?');

    // Toggle question 1 of Payments & Wallet to show its answer
    const q1Btn = tree.root.findByProps({ accessibilityLabel: '1. How can I add money to my TOHFA Wallet?' });
    await act(async () => {
      q1Btn.props.onPress();
    });

    json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Go to My Wallet, tap Add Money, enter the amount and complete the payment.');
  });

  it('renders CustomerNotificationsScreen with Today, Yesterday, and Earlier sections', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CustomerNotificationsScreen onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Notifications');
    expect(json).toContain('Today');
    expect(json).toContain('Order Shipped');
    expect(json).toContain('Wallet Top-up Successful');
    expect(json).toContain('Rate Your Purchase');
    expect(json).toContain('Yesterday');
    expect(json).toContain('Order Out for Delivery');
    expect(json).toContain('Earlier');
    expect(json).toContain('Return Request Updated');
  });

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

  it('renders CustomerPrivacyPolicyScreen with all sections and metadata', async () => {
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
    expect(json).toContain('2. Information We Collect');
    expect(json).toContain('2.1 Personal Information');
    expect(json).toContain('2.2 Address Information');
    expect(json).toContain('2.3 Location Information');
    expect(json).toContain('3. How We Use Your Information');
    expect(json).toContain('4. Payment Information');
    expect(json).toContain('5. Sharing of Information');
    expect(json).toContain('6. Notifications and Communication Preferences');
    expect(json).toContain('7. Data Storage and Security');
    expect(json).toContain('8. Data Retention');
  });

  it('renders CustomerTermsScreen with all sections and metadata', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CustomerTermsScreen onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Terms and condition');
    expect(json).toContain('Terms & Conditions');
    expect(json).toContain('TOHFA Market');
    expect(json).toContain('Last Updated: 12/11/2026');
    expect(json).toContain('1. Introduction');
    expect(json).toContain('2. Eligibility and Account Registration');
    expect(json).toContain('3. Account Information');
    expect(json).toContain('4. Products and Availability');
  });
});

