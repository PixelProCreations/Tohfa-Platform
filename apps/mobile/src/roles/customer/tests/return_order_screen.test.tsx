import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  Image: 'Image',
  Modal: 'Modal',
  Platform: { OS: 'ios', select: vi.fn((obj: Record<string, unknown>) => obj.ios || obj.default) },
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

import { ReturnOrderScreen } from '../screens/ReturnOrderScreen';
import { ReturnSubmittedModal } from '../components/ReturnSubmittedModal';

describe('ReturnOrderScreen (Screen 67 · Return Order)', () => {
  const mockNavigate = vi.fn();
  const mockBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders exact Screen 67 elements and layout', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ReturnOrderScreen onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    const root = tree.root;
    const allTexts = root.findAllByType('Text' as never).map((node) => node.props.children);
    const flattenedTexts = allTexts.flat(Infinity).filter(Boolean);

    expect(flattenedTexts).toContain('Return Order');
    expect(flattenedTexts).toContain('Request a Return');
    expect(flattenedTexts).toContain('Select the item and reason for return.');
    expect(flattenedTexts).toContain('ORD-20261115-0039');
    expect(flattenedTexts).toContain('Select product');
    expect(flattenedTexts).toContain('Reason for return');
    expect(flattenedTexts).toContain('Describe the issue');
    expect(flattenedTexts).toContain('Add Photos (optional)');
    expect(flattenedTexts).toContain('Request Return');
  });

  it('calls onBack when back arrow is pressed', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ReturnOrderScreen onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    const backButton = tree.root.findByProps({ accessibilityLabel: 'Back' });
    await act(async () => {
      backButton.props.onPress();
    });

    expect(mockBack).toHaveBeenCalled();
  });

  it('toggles product selection and adds photos', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ReturnOrderScreen onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    const fujiItem = tree.root.findByProps({
      accessibilityLabel: 'Select product Fuji',
    });
    await act(async () => {
      fujiItem.props.onPress();
    });

    const addPhotoBtn = tree.root.findByProps({ accessibilityLabel: 'Add Photo' });
    await act(async () => {
      addPhotoBtn.props.onPress();
    });

    const removePhotoBtns = tree.root.findAllByProps({
      accessibilityLabel: 'Remove photo',
    });
    expect(removePhotoBtns.length).toBe(1);

    await act(async () => {
      removePhotoBtns[0]?.props.onPress();
    });

    const removePhotoBtnsAfter = tree.root.findAllByProps({
      accessibilityLabel: 'Remove photo',
    });
    expect(removePhotoBtnsAfter.length).toBe(0);
  });

  it('opens ReturnSubmittedModal on Request Return press and tracks return request', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ReturnOrderScreen onNavigate={mockNavigate} onBack={mockBack} />
      );
    });

    const submitBtn = tree.root.findByProps({ accessibilityLabel: 'Request Return' });
    await act(async () => {
      submitBtn.props.onPress();
    });

    const trackBtns = tree.root.findAllByProps({
      accessibilityLabel: 'Track Return Request',
    });
    expect(trackBtns[0]).toBeDefined();

    await act(async () => {
      trackBtns[0]?.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      'TrackSupportRequest',
      expect.objectContaining({
        supportId: 'RET-20260715-0147',
        orderNumber: 'ORD-20261115-0039',
      })
    );
  });
});

describe('ReturnSubmittedModal Component', () => {
  it('renders correctly and handles button callbacks', async () => {
    const handleClose = vi.fn();
    const handleTrack = vi.fn();
    const handleContinue = vi.fn();

    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ReturnSubmittedModal
          visible={true}
          onClose={handleClose}
          onTrackReturn={handleTrack}
          onContinueShopping={handleContinue}
          returnId="RET-20260715-0147"
          orderNumber="ORD-20260715-0039"
          productName="Fresh apples (1 kg)"
        />
      );
    });

    const trackBtn = tree.root.findByProps({
      accessibilityLabel: 'Track Return Request',
    });
    await act(async () => {
      trackBtn.props.onPress();
    });
    expect(handleClose).toHaveBeenCalled();
    expect(handleTrack).toHaveBeenCalled();

    const continueBtn = tree.root.findByProps({
      accessibilityLabel: 'Continue Shopping',
    });
    await act(async () => {
      continueBtn.props.onPress();
    });
    expect(handleContinue).toHaveBeenCalled();
  });
});

