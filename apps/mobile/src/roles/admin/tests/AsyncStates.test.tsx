import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';

// Host-string components so react-test-renderer can render them (the global
// stub in src/tests/setup.ts returns props, which is not a valid element).
vi.mock('react-native', () => ({
  View: 'View',
  ActivityIndicator: 'ActivityIndicator',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
}));

vi.mock('@tohfa/mobile-ui', () => ({
  EmptyState: 'EmptyState',
  ErrorState: 'ErrorState',
  useTheme: () => ({ colors: { primary: 'p' } }),
}));

import { ApiError } from '../../../shell/api/client';
import { AsyncStates } from '../screens/warehouse/shared/AsyncStates';
import { t } from '../i18n';

function render(el: React.ReactElement): ReactTestRenderer {
  let r!: ReactTestRenderer;
  act(() => {
    r = renderer.create(el);
  });
  return r;
}

describe('AsyncStates', () => {
  it('renders a spinner while loading', () => {
    const r = render(<AsyncStates state="loading" error={null} onRetry={() => undefined}>{'x'}</AsyncStates>);
    const spinner = r.root.find((n) => (n.type as unknown) === 'ActivityIndicator');
    expect(spinner.props.accessibilityLabel).toBe(t('admin.common.loading'));
  });

  it('renders the translated error and wires retry', () => {
    const onRetry = vi.fn();
    const err = new ApiError({ type: 'about:blank', title: 't', status: 404, code: 'NOT_FOUND' });
    const r = render(<AsyncStates state="error" error={err} onRetry={onRetry}>{'x'}</AsyncStates>);
    const node = r.root.find((n) => (n.type as unknown) === 'ErrorState');
    expect(node.props.message).toBe(t('admin.errors.NOT_FOUND'));
    expect(node.props.retryTitle).toBe(t('admin.common.retry'));
    node.props.onRetry();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders the empty state with the caller-chosen key', () => {
    const r = render(
      <AsyncStates state="empty" error={null} onRetry={() => undefined} emptyTitleKey="admin.common.empty">
        {'x'}
      </AsyncStates>,
    );
    expect(r.root.find((n) => (n.type as unknown) === 'EmptyState').props.title).toBe(t('admin.common.empty'));
  });

  it('renders children when ready', () => {
    const r = render(<AsyncStates state="ready" error={null} onRetry={() => undefined}>{'content'}</AsyncStates>);
    expect(r.toJSON()).toBe('content');
  });
});
