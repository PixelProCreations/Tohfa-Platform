import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Platform: { OS: 'ios', select: (o: Record<string, unknown>) => o['ios'] ?? o['default'] },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, hairlineWidth: 1 },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
  StatusBar: 'StatusBar',
  Modal: (props: { visible?: boolean; children?: React.ReactNode }) => (props.visible ? React.createElement('Modal', props, props.children) : null),
}));
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 48, bottom: 24, left: 0, right: 0 }),
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Path: 'Path' }));

const apiGet = vi.fn();
const apiDelete = vi.fn();
vi.mock('../../../shell/api/client', async (orig) => {
  const actual = (await orig()) as { api: object };
  return {
    ...actual,
    api: { ...actual.api, get: (...a: unknown[]) => apiGet(...a), delete: (...a: unknown[]) => apiDelete(...a) },
  };
});
const logoutMock = vi.fn(() => Promise.resolve());
vi.mock('../api/auth', () => ({ logout: () => logoutMock() }));

import { ApiError } from '../../../shell/api/client';
import { parseMarkdown } from '../api/legal';
import { CustomerPrivacyPolicyScreen } from '../screens/CustomerPrivacyPolicyScreen';
import { CustomerTermsScreen } from '../screens/CustomerTermsScreen';
import { CustomerAccountSettingsScreen } from '../screens/CustomerAccountSettingsScreen';

const DOC = {
  title: 'Privacy Policy',
  version: 3,
  lastUpdated: '2026-11-12T10:00:00Z',
  language: 'en',
  body: '# 1. Introduction\n\nWelcome to **TOHFA**.\n\n## 2.1 Personal Information\n\n- Full name\n- Mobile number\n',
};

function wrap(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  return <QueryClientProvider client={qc}>{el}</QueryClientProvider>;
}
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });
const render = async (el: React.ReactElement) => {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(wrap(el));
  });
  await flush();
  return tree;
};
const text = (tree: renderer.ReactTestRenderer) => JSON.stringify(tree.toJSON());
const conflict = (reason: string) =>
  new ApiError({ type: 'about:blank', title: 'Conflict', status: 409, code: 'CONFLICT' as never, meta: { reason } });

beforeEach(() => {
  apiGet.mockReset();
  apiDelete.mockReset();
  logoutMock.mockClear();
});

describe('parseMarkdown (BR-172)', () => {
  it('parses headings, bullets, numbered and paragraphs, stripping inline markers', () => {
    const blocks = parseMarkdown('# A\n\nHello **bold** [link](http://x)\nsecond line\n\n- one\n* two\n\n1. first\n### C');
    expect(blocks).toEqual([
      { kind: 'heading', level: 1, text: 'A' },
      { kind: 'paragraph', text: 'Hello bold link second line' },
      { kind: 'bullet', text: 'one' },
      { kind: 'bullet', text: 'two' },
      { kind: 'numbered', index: 1, text: 'first' },
      { kind: 'heading', level: 3, text: 'C' },
    ]);
  });
});

describe('BR-172 legal screens', () => {
  it('shows a loading indicator while fetching', async () => {
    apiGet.mockReturnValue(new Promise(() => {}));
    const tree = await render(<CustomerPrivacyPolicyScreen />);
    expect(tree.root.findAllByType('ActivityIndicator' as unknown as React.ElementType).length).toBe(1);
  });

  it('renders markdown headings, bullets and the API last-updated date', async () => {
    apiGet.mockResolvedValue(DOC);
    const tree = await render(<CustomerPrivacyPolicyScreen />);
    const out = text(tree);
    expect(out).toContain('1. Introduction');
    expect(out).toContain('2.1 Personal Information');
    expect(out).toContain('Welcome to TOHFA.');
    expect(out).toContain('Full name');
    expect(out).toContain('Mobile number');
    expect(out).toContain('Last Updated: 12/11/2026');
  });

  it('Terms screen requests the terms slug and renders it', async () => {
    apiGet.mockResolvedValue({ ...DOC, title: 'Terms & Conditions', body: '# 4. Products\n\nText' });
    const tree = await render(<CustomerTermsScreen />);
    expect(apiGet.mock.calls[0]![0]).toContain('/legal/terms');
    expect(text(tree)).toContain('4. Products');
  });

  it('shows error with Retry, and retry refetches', async () => {
    apiGet.mockRejectedValueOnce(new Error('boom')).mockRejectedValueOnce(new Error('boom')).mockResolvedValue(DOC);
    const tree = await render(<CustomerPrivacyPolicyScreen />);
    expect(text(tree)).toContain('Retry');
    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: 'Retry' }).props.onPress();
    });
    await flush();
    expect(text(tree)).toContain('1. Introduction');
  });
});

describe('BR-160 delete account', () => {
  const open = async (props: Record<string, unknown> = {}) => {
    const tree = await render(<CustomerAccountSettingsScreen {...props} />);
    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: 'Delete account' }).props.onPress();
    });
    return tree;
  };
  const press = async (tree: renderer.ReactTestRenderer, label: string) => {
    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: label }).props.onPress();
    });
    await flush();
  };

  it('confirm success deletes, logs out and calls onAccountDeleted', async () => {
    apiDelete.mockResolvedValue(undefined);
    const done = vi.fn();
    const tree = await open({ onAccountDeleted: done });
    await press(tree, 'Delete');
    expect(apiDelete).toHaveBeenCalledWith('/customers/me');
    expect(logoutMock).toHaveBeenCalled();
    expect(done).toHaveBeenCalled();
  });

  it('falls back to onNavigate SignOut', async () => {
    apiDelete.mockResolvedValue(undefined);
    const nav = vi.fn();
    const tree = await open({ onNavigate: nav });
    await press(tree, 'Delete');
    expect(nav).toHaveBeenCalledWith('SignOut');
  });

  it('409 WALLET_NOT_EMPTY shows wallet message and stays', async () => {
    apiDelete.mockRejectedValue(conflict('WALLET_NOT_EMPTY'));
    const done = vi.fn();
    const tree = await open({ onAccountDeleted: done });
    await press(tree, 'Delete');
    expect(text(tree)).toContain('Your wallet still has money. Withdraw or use it before deleting your account.');
    expect(done).not.toHaveBeenCalled();
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it('409 OPEN_ORDERS shows orders message', async () => {
    apiDelete.mockRejectedValue(conflict('OPEN_ORDERS'));
    const tree = await open();
    await press(tree, 'Delete');
    expect(text(tree)).toContain('You have orders in progress. You can delete your account once they are delivered.');
  });

  it('cancel does not call the API', async () => {
    const tree = await open();
    await press(tree, 'Cancel');
    expect(apiDelete).not.toHaveBeenCalled();
    expect(tree.root.findAllByProps({ accessibilityLabel: 'Delete' }).length).toBe(0);
  });
});
