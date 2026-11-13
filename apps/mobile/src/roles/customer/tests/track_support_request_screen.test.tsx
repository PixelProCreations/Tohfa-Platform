import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  ScrollView: 'ScrollView',
  StyleSheet: {
    create: (s: Record<string, unknown>) => s,
  },
  Text: 'Text',
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

import { TrackSupportRequestScreen } from '../screens/TrackSupportRequestScreen';

describe('TrackSupportRequestScreen', () => {
  const mockBack = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all sections matching the exact design', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <TrackSupportRequestScreen onBack={mockBack} onNavigate={mockNavigate} />
      );
    });

    const json = JSON.stringify(tree.toJSON());

    // Header
    expect(json).toContain('Track request');

    // Support ID
    expect(json).toContain('Support ID');
    expect(json).toContain('SUP-20261115-0039');

    // Request Summary
    expect(json).toContain('Request Summary');
    expect(json).toContain('Order ID');
    expect(json).toContain('ORD-20260712-0028');
    expect(json).toContain('Product');
    expect(json).toContain('Royal Gala (1 kg)');
    expect(json).toContain('Issue type');
    expect(json).toContain('Product support');
    expect(json).toContain('Submitted on');
    expect(json).toContain('15 Nov 2026, 9:41 AM');

    // Request Status
    expect(json).toContain('Request Status');
    expect(json).toContain('Request received');
    expect(json).toContain('Your request has been successfully submitted.');
    expect(json).toContain('Under review');
    expect(json).toContain('15 Nov 2026, 11:20 AM');
    expect(json).toContain('Our support team will check the details and content you within 24 hours.');
    expect(json).toContain('Resolution');
    expect(json).toContain('Pending');
    expect(json).toContain("We'll help you with a solution (replacement, refund or other support).");

    // Request Updates
    expect(json).toContain('Request Updates');
    expect(json).toContain('Support Team');
    expect(json).toContain("We are reviewing your request. We'll update you soon.");
    expect(json).toContain('Your request has been received.');

    // Cancel Button
    expect(json).toContain('Cancel Request');
  });

  it('calls onBack when header back button is pressed', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <TrackSupportRequestScreen onBack={mockBack} onNavigate={mockNavigate} />
      );
    });

    const backBtn = tree.root.findByProps({ accessibilityLabel: 'Go back' });
    await act(async () => {
      backBtn.props.onPress();
    });

    expect(mockBack).toHaveBeenCalled();
  });

  it('opens cancel confirmation alert when Cancel Request is pressed', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <TrackSupportRequestScreen onBack={mockBack} onNavigate={mockNavigate} />
      );
    });

    const cancelBtn = tree.root.findByProps({ accessibilityLabel: 'Cancel Request' });
    await act(async () => {
      cancelBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Cancel Support Request',
      'Are you sure you want to cancel this support request?',
      expect.any(Array)
    );
  });
});

