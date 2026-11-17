import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  Image: 'Image',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: {
    OS: 'android',
    select: (obj: Record<string, unknown>) => obj['android'] ?? obj['default'],
  },
  StatusBar: 'StatusBar',
  StyleSheet: {
    create: (s: Record<string, unknown>) => s,
  },
}));

vi.mock('@tohfa/mobile-ui', () => ({
  ScreenStatusBar: 'ScreenStatusBar',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Path: 'Path',
}));

import { CustomerLoginScreen } from '../screens/CustomerLoginScreen';

describe('CustomerLoginScreen', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Welcome Back title, subtitle, phone input, and terms checkbox', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<CustomerLoginScreen onNavigate={mockNavigate} />);
    });

    const root = tree.root;
    const allText = root.findAllByType('Text').map((node) => node.props.children);
    expect(allText).toContain('Welcome Back!');
    expect(allText).toContain("Let's get you Stated");
    expect(allText).toContain('I agree to terms and conditions');

    const input = root.findByType('TextInput');
    expect(input.props.placeholder).toBe('Please enter phone number');
    expect(input.props.keyboardType).toBe('phone-pad');
  });

  it('toggles terms agreement checkbox when pressed', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<CustomerLoginScreen onNavigate={mockNavigate} />);
    });

    const checkboxes = tree.root.findAllByType('TouchableOpacity');
    const termsRow = checkboxes.find(
      (b) => b.props.accessibilityRole === 'checkbox'
    );
    expect(termsRow).toBeDefined();

    expect(termsRow?.props.accessibilityState.checked).toBe(false);

    await act(async () => {
      termsRow?.props.onPress();
    });

    expect(termsRow?.props.accessibilityState.checked).toBe(true);
  });

  it('navigates to CustomerOtp when action button is pressed', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<CustomerLoginScreen onNavigate={mockNavigate} />);
    });

    const input = tree.root.findByType('TextInput');
    await act(async () => {
      input.props.onChangeText('9876543210');
    });

    const button = tree.root
      .findAllByType('TouchableOpacity')
      .find((b) => b.props.accessibilityRole === 'button');
    expect(button).toBeDefined();

    await act(async () => {
      button?.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('CustomerOtp', {
      mobile: '9876543210',
    });
  });

  it('does not render any black bottom bar or home indicator', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<CustomerLoginScreen onNavigate={mockNavigate} />);
    });

    const allViews = tree.root.findAllByType('View');
    for (const v of allViews) {
      const style = v.props.style;
      if (Array.isArray(style)) {
        for (const s of style) {
          if (s && s.backgroundColor) {
            expect(s.backgroundColor).not.toBe('#000000');
            expect(s.backgroundColor).not.toBe('#1E1E1E');
          }
        }
      } else if (style && style.backgroundColor) {
        expect(style.backgroundColor).not.toBe('#000000');
        expect(style.backgroundColor).not.toBe('#1E1E1E');
      }
    }
  });
});

