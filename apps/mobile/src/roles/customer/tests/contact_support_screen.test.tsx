import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  Image: 'Image',
  Modal: 'Modal',
  ScrollView: 'ScrollView',
  StyleSheet: {
    create: (s: Record<string, unknown>) => s,
  },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('@tohfa/mobile-ui', () => ({
  SafeAreaView: 'SafeAreaView',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  Rect: 'Rect',
}));

vi.mock('../assets/images/products', () => ({
  ProductImages: {
    fruitApple: 101,
    foryouLettuce: 102,
  },
}));

import { ContactSupportScreen } from '../screens/ContactSupportScreen';

describe('ContactSupportScreen', () => {
  const mockBack = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all sections matching the exact design', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ContactSupportScreen onBack={mockBack} onNavigate={mockNavigate} />
      );
    });

    const json = JSON.stringify(tree.toJSON());

    // Header
    expect(json).toContain('Contact Support');

    // Banner
    expect(json).toContain("We're Here to help!");
    expect(json).toContain('Get quick support for orders, payments, products or any other issues.');

    // Related to options
    expect(json).toContain('Related to');
    expect(json).toContain('My Order');
    expect(json).toContain('Product');
    expect(json).toContain('Review');
    expect(json).toContain('Other');

    // Select order
    expect(json).toContain('Select order');
    expect(json).toContain('ORD-20261115-0039');
    expect(json).toContain('15 Jul 2026 · 3 items');

    // Select product
    expect(json).toContain('Select product');
    expect(json).toContain('Fresh apples');
    expect(json).toContain('Fuji');
    expect(json).toContain('Green Curly Lettuce');

    // Issue types
    expect(json).toContain('Issue type');
    expect(json).toContain('Product support');
    expect(json).toContain('Order status');
    expect(json).toContain('Payment & refund');
    expect(json).toContain('Return & replacement');
    expect(json).toContain('Pickup / delivery');

    // Tell us more & Add Photos
    expect(json).toContain('Tell us more');
    expect(json).toContain('Describe your issue or question...');
    expect(json).toContain('0/500');
    expect(json).toContain('Add Photos (optional)');

    // Submit button
    expect(json).toContain('Send to Support');
  });

  it('calls onBack when header back button is pressed', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<ContactSupportScreen onBack={mockBack} />);
    });

    const backBtn = tree.root.findByProps({ accessibilityLabel: 'Go back' });
    await act(async () => {
      backBtn.props.onPress();
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('switches related tab correctly', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<ContactSupportScreen onBack={mockBack} />);
    });

    const otherTab = tree.root.findByProps({ accessibilityLabel: 'Related to Other' });
    await act(async () => {
      otherTab.props.onPress();
    });

    const json = JSON.stringify(tree.toJSON());
    // In 'other' mode, "Select order" section is hidden
    expect(json).not.toContain('Select order');
  });

  it('opens exact success feedback modal on submitting support request with all details', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ContactSupportScreen onBack={mockBack} onNavigate={mockNavigate} />
      );
    });

    const sendBtn = tree.root.findByProps({ accessibilityLabel: 'Send to Support' });
    await act(async () => {
      sendBtn.props.onPress();
    });

    const json = JSON.stringify(tree.toJSON());

    // Popup Title & Subtitle
    expect(json).toContain('Support Request Submitted!');
    expect(json).toContain("We've received your request and our support team will get back to you soon.");

    // Support ID Card
    expect(json).toContain('Support ID');
    expect(json).toContain('SUP-20261115-0039');
    expect(json).toContain('Open');

    // Request Summary
    expect(json).toContain('Request Summary');
    expect(json).toContain('Order ID');
    expect(json).toContain('Product');
    expect(json).toContain('Issue type');
    expect(json).toContain('Submitted on');
    expect(json).toContain('15 Nov 2026, 9:41 AM');

    // What happens next timeline
    expect(json).toContain('What happens next?');
    expect(json).toContain('Request received');
    expect(json).toContain('Under review');
    expect(json).toContain('Resolution');

    // Action buttons
    expect(json).toContain('Track Request');
    expect(json).toContain('Continue Shopping');

    // Test Track Request button press
    const trackBtn = tree.root.findByProps({ accessibilityLabel: 'Track Request' });
    await act(async () => {
      trackBtn.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('TrackSupportRequest', expect.anything());

    // Test Continue Shopping button press
    const shopBtn = tree.root.findAllByProps({ accessibilityLabel: 'Continue Shopping' })[0]!;
    await act(async () => {
      shopBtn.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('switches to Product tab, renders exact product support UI, and opens modal on Submit Request', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ContactSupportScreen onBack={mockBack} onNavigate={mockNavigate} />
      );
    });

    const productTab = tree.root.findByProps({ accessibilityLabel: 'Related to Product' });
    await act(async () => {
      productTab.props.onPress();
    });

    let json = JSON.stringify(tree.toJSON());

    // Banner for Product
    expect(json).toContain('Need help with an ordered product?');
    expect(json).toContain("Tell us what's wrong and we'll get it sorted for you.");

    // Select order and select product remain visible
    expect(json).toContain('Select order');
    expect(json).toContain('ORD-20261115-0039');
    expect(json).toContain('Select product');
    expect(json).toContain('Fresh apples');

    // Product issue types
    expect(json).toContain('Quality issue');
    expect(json).toContain('Damaged item');
    expect(json).toContain('Wrong item');
    expect(json).toContain('Missing item');
    expect(json).toContain('Weight / quantity issue');

    // Helper text
    expect(json).toContain('You can add up to 5 images (JPG, PNG)');

    // Button label is "Submit Request"
    expect(json).toContain('Submit Request');

    // Click Submit Request
    const submitBtn = tree.root.findByProps({ accessibilityLabel: 'Submit Request' });
    await act(async () => {
      submitBtn.props.onPress();
    });

    json = JSON.stringify(tree.toJSON());

    // Modal popup appears with product details
    expect(json).toContain('Support Request Submitted!');
    expect(json).toContain('SUP-20261115-0039');
    expect(json).toContain('Quality issue');
    expect(json).toContain('Track Request');
    expect(json).toContain('Continue Shopping');
  });

  it('switches to Other tab, renders exact General support UI, and opens modal on Submit Request', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ContactSupportScreen onBack={mockBack} onNavigate={mockNavigate} />
      );
    });

    const otherTab = tree.root.findByProps({ accessibilityLabel: 'Related to Other' });
    await act(async () => {
      otherTab.props.onPress();
    });

    let json = JSON.stringify(tree.toJSON());

    // Banner for General Support
    expect(json).toContain('General support');
    expect(json).toContain("Need help with something else? Let us know and we'll assist you.");

    // Select order and select product are hidden
    expect(json).not.toContain('Select order');
    expect(json).not.toContain('Select product');

    // 8 General support issue types
    expect(json).toContain('Account & Profile');
    expect(json).toContain('Notifications');
    expect(json).toContain('Payments & wallet');
    expect(json).toContain('Addresses');
    expect(json).toContain('App issue / technical');
    expect(json).toContain('Policies');
    expect(json).toContain('(Return, Refund, etc.)');
    expect(json).toContain('Report a concern');

    // Button label is "Submit Request"
    expect(json).toContain('Submit Request');

    // Click Submit Request
    const submitBtn = tree.root.findByProps({ accessibilityLabel: 'Submit Request' });
    await act(async () => {
      submitBtn.props.onPress();
    });

    json = JSON.stringify(tree.toJSON());

    // Modal popup appears
    expect(json).toContain('Support Request Submitted!');
    expect(json).toContain('SUP-20261115-0039');
    expect(json).toContain('Account & Profile');
    expect(json).toContain('Track Request');
    expect(json).toContain('Continue Shopping');
  });

  it('switches to Review tab, renders exact Review & Feedback UI, and opens modal on Submit Review', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ContactSupportScreen onBack={mockBack} onNavigate={mockNavigate} />
      );
    });

    const reviewTab = tree.root.findByProps({ accessibilityLabel: 'Related to Review' });
    await act(async () => {
      reviewTab.props.onPress();
    });

    let json = JSON.stringify(tree.toJSON());

    // Header & Banner for Review & Feedback (Screen 65)
    expect(json).toContain('Review & Feedback');
    expect(json).toContain('Share your experience');
    expect(json).toContain('Tell other about the product quality, freshness and your overall experience.');

    // Select order card remains visible
    expect(json).toContain('Select order');
    expect(json).toContain('ORD-20261115-0039');

    // Review your items
    expect(json).toContain('Review your items');
    expect(json).toContain('Fresh apples');
    expect(json).toContain('Excellent');
    expect(json).toContain('Fuji');
    expect(json).toContain('Green Curly Lettuce');
    expect(json).toContain('Tap to rate');

    // Overall rating
    expect(json).toContain('Overall rating');
    expect(json).toContain('0.0');

    // Your Review
    expect(json).toContain('Your Review');

    // What did you like?
    expect(json).toContain('What did you like?');
    expect(json).toContain('Product quality');
    expect(json).toContain('Packaging');
    expect(json).toContain('Delivery / Pickup');
    expect(json).toContain('Communication');

    // Button label is "Submit Review"
    expect(json).toContain('Submit Review');

    // Click Submit Review
    const submitBtn = tree.root.findByProps({ accessibilityLabel: 'Submit Review' });
    await act(async () => {
      submitBtn.props.onPress();
    });

    json = JSON.stringify(tree.toJSON());

    // Screen 66 Thank You modal popup appears
    expect(json).toContain('Thank you for your review!');
    expect(json).toContain('Reviewed');
    expect(json).toContain('Write Review');
    expect(json).toContain('Review Another Product');
    expect(json).toContain('Continue Shopping');
  });
});
