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
 *
 * The loading and error views are the shared AdminLoadingState /
 * AdminErrorState (./shared/AsyncStates.tsx), with the gate's own wording.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { t } from '../../i18n';
import { scopeGateState } from '../../permissions/warehousePermissions';
import { adminColors } from '../../theme';
import type { WarehouseScope } from './finance-expenses/types';
import { AdminErrorState, AdminLoadingState, AdminStateButton } from './shared/AsyncStates';

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

  return (
    <View style={styles.screen}>
      {state === 'loading' ? (
        <AdminLoadingState label={t('warehouseScope.loading')} />
      ) : (
        <AdminErrorState
          title={t('warehouseScope.error.title')}
          message={subScope === null ? t('warehouseScope.error.noAssignment') : t('warehouseScope.error.failed')}
          retryLabel={t('warehouseScope.retry')}
          onRetry={onRetry}
        >
          <AdminStateButton label={t('warehouseScope.signOut')} onPress={onSignOut} variant="secondary" />
        </AdminErrorState>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: adminColors.canvas,
  },
});
