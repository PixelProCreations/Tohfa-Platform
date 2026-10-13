/**
 * Loading / error / empty / ready switch shared by every warehouse screen.
 *
 * Visuals come from @tohfa/mobile-ui's ErrorState/EmptyState (no role-level
 * components/ directory — apps/mobile/CLAUDE.md); copy comes from the admin
 * catalogue, errors through adminErrorKey so the user never sees raw server
 * text or a raw error code.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { EmptyState, ErrorState } from '@tohfa/mobile-ui';
import { adminErrorKey } from '../../../api/errors';
import { t, type TranslationKey } from '../../../i18n';
import { adminTheme } from '../../../theme';
import type { ViewState } from './queryViewState';

export interface AsyncStatesProps {
  state: ViewState;
  error: unknown;
  onRetry: () => void;
  emptyTitleKey?: TranslationKey | undefined;
  emptyMessageKey?: TranslationKey | undefined;
  children: React.ReactNode;
}

export function AsyncStates(props: AsyncStatesProps): React.JSX.Element {
  switch (props.state) {
    case 'loading':
      return (
        <View style={[styles.center, { padding: adminTheme.spacing.xl }]}>
          <ActivityIndicator
            color={adminTheme.colors.primary}
            accessibilityLabel={t('admin.common.loading')}
          />
        </View>
      );
    case 'error':
      return (
        <ErrorState
          title={t('admin.errors.title')}
          message={t(adminErrorKey(props.error))}
          retryTitle={t('admin.common.retry')}
          onRetry={props.onRetry}
        />
      );
    case 'empty':
      return (
        <EmptyState
          title={t(props.emptyTitleKey ?? 'admin.common.empty')}
          message={props.emptyMessageKey === undefined ? undefined : t(props.emptyMessageKey)}
        />
      );
    case 'ready':
      return <>{props.children}</>;
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
