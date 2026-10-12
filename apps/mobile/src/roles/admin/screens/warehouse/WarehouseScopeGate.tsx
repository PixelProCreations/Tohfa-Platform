/**
 * Renders the Sub Warehouse screens only once the admin's own warehouse is
 * known (BR-30). The scope comes from GET /auth/me via useWarehousePermissions;
 * this gate decides what to show until then:
 *
 *   - loading: the scope is still being fetched;
 *   - error:   the account has no SUB_WH_ADMIN warehouse, or every /auth/me
 *              attempt failed. Retry starts the fetch again; Sign out leaves.
 *              There is deliberately no fallback warehouse (fail closed);
 *   - ready:   `children(scope)`.
 *
 * The scope is a display/request hint only; the server filters every Sub
 * request to the caller's warehouse whatever the client sends.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../i18n';
import { scopeGateState } from '../../permissions/warehousePermissions';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../theme';
import type { WarehouseScope } from './finance-expenses/types';

export interface WarehouseScopeGateProps {
  /** From useWarehousePermissions: undefined = loading, null = no Sub warehouse. */
  subScope: WarehouseScope | null | undefined;
  /** True once every /auth/me attempt has failed. */
  failed: boolean;
  onRetry: () => void;
  onSignOut: () => void;
  children: (scope: WarehouseScope) => React.ReactNode;
}

export function WarehouseScopeGate({ subScope, failed, onRetry, onSignOut, children }: WarehouseScopeGateProps) {
  const state = scopeGateState(subScope, failed);

  if (state === 'ready' && subScope) return <>{children(subScope)}</>;

  if (state === 'loading') {
    return (
      <View style={styles.screen} accessibilityLiveRegion="polite">
        <ActivityIndicator size="large" color={adminColors.brand} />
        <Text style={styles.caption}>{t('warehouseScope.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title} accessibilityRole="header">
        {t('warehouseScope.error.title')}
      </Text>
      <Text style={styles.body}>
        {subScope === null ? t('warehouseScope.error.noAssignment') : t('warehouseScope.error.failed')}
      </Text>
      <TouchableOpacity style={[styles.button, styles.primary]} onPress={onRetry} accessibilityRole="button">
        <Text style={[styles.buttonText, styles.primaryText]}>{t('warehouseScope.retry')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.secondary]} onPress={onSignOut} accessibilityRole="button">
        <Text style={[styles.buttonText, styles.secondaryText]}>{t('warehouseScope.signOut')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.xl,
    backgroundColor: adminColors.canvas,
  },
  caption: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: adminSpacing.md,
    textAlign: 'center',
  },
  title: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    textAlign: 'center',
  },
  body: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xl,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.md,
  },
  primary: {
    backgroundColor: adminColors.brand,
  },
  secondary: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  buttonText: {
    ...adminType.rowTitle,
  },
  primaryText: {
    color: adminColors.onBrand,
  },
  secondaryText: {
    color: adminColors.ink,
  },
});
