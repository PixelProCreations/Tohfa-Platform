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

import { ReviewFeedbackScreen } from '../screens/ReviewFeedbackScreen';

describe('ReviewFeedbackScreen (Screen 65 · Write a Review & Feedback)', () => {
  const mockBack = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders exact Screen 65 design without any Related to tabs', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ReviewFeedbackScreen onBack={mockBack} onNavigate={mockNavigate} />
      );
    });

    const json = JSON.stringify(tree.toJSON());

    // Header
    expect(json).toContain('Review & Feedback');

    // DOES NOT contain "Related to"
    expect(json).not.toContain('Related to');
    expect(json).not.toContain('My Order');

    // Banner
    expect(json).toContain('Share your experience');
    expect(json).toContain('Tell other about the product quality, freshness and your overall experience.');

    // Select order card
    expect(json).toContain('ORD-20261115-0039');
    expect(json).toContain('15 Jul 2026 · 3 items');

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
    expect(json).toContain('Describe your issue or question...');
    expect(json).toContain('0/500');

    // What did you like?
    expect(json).toContain('What did you like?');
    expect(json).toContain('Product quality');
    expect(json).toContain('Packaging');
    expect(json).toContain('Delivery / Pickup');
    expect(json).toContain('Communication');

    // Submit button
    expect(json).toContain('Submit Review');
  });

  it('calls onBack when header back button is pressed', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<ReviewFeedbackScreen onBack={mockBack} />);
    });

    const backBtn = tree.root.findByProps({ accessibilityLabel: 'Go back' });
    await act(async () => {
      backBtn.props.onPress();
    });

    expect(mockBack).toHaveBeenCalled();
  });

  it('opens Screen 66 Thank You popup modal on Submit Review', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ReviewFeedbackScreen onBack={mockBack} onNavigate={mockNavigate} />
      );
    });

    const submitBtn = tree.root.findByProps({ accessibilityLabel: 'Submit Review' });
    await act(async () => {
      submitBtn.props.onPress();
    });

    const json = JSON.stringify(tree.toJSON());

    // Modal popup appears (Screen 66)
    expect(json).toContain('Thank you for your review!');
    expect(json).toContain('Reviewed');
    expect(json).toContain('Write Review');
    expect(json).toContain('Review Another Product');
    expect(json).toContain('Continue Shopping');
  });
});

