/**
 * Admin root: query client -> session from `GET /auth/me` -> AdminHome.
 *
 * The session (scope + can()) is built once here with `buildAdminSession`
 * and provided through AdminSessionProvider, so no screen re-derives scope or
 * reads a warehouse id from anywhere else (BR-30). A profile with no admin
 * role, or a SUB_WH_ADMIN with no warehouse (BR-25), stops here with a
 * message instead of rendering unscoped screens.
 *
 * Mounting this component (and setting the bearer token beforehand) is the
 * host's job — today nothing in index.js / roles/farmer/App.tsx renders it
 * (see apps/mobile/CLAUDE.md "Known transitional state").
 *
 * New admin modules are added in navigation/adminEntries.ts, not here.
 */
import React, { useMemo } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { EmptyState } from '@tohfa/mobile-ui';
import { queryClient } from '../../shell/api/queryClient';
import { fetchCurrentUser } from '../../shell/auth/api';
import { useAdminQuery } from './api/hooks';
import { adminKeys } from './api/queryKeys';
import { t } from './i18n';
import { AdminHome } from './navigation/AdminHome';
import { AsyncStates } from './screens/warehouse/shared/AsyncStates';
import { queryViewState } from './screens/warehouse/shared/queryViewState';
import { AdminSessionProvider, buildAdminSession } from './session/AdminSession';
import { adminTheme } from './theme';

export function TohfaAdminApp(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={[styles.screen, { backgroundColor: adminTheme.colors.surface }]}>
        <StatusBar barStyle="light-content" backgroundColor={adminTheme.colors.primaryPressed} />
        <AdminSessionGate />
      </SafeAreaView>
    </QueryClientProvider>
  );
}

function AdminSessionGate(): React.JSX.Element {
  const me = useAdminQuery([...adminKeys.all, 'session'], () => fetchCurrentUser());
  const state = queryViewState(me, () => false);
  // Memoised so the provided session (and its can()) keeps its identity across
  // renders instead of re-rendering every consumer.
  const result = useMemo(
    () => (me.data === undefined ? undefined : buildAdminSession(me.data)),
    [me.data],
  );

  return (
    <AsyncStates state={state} error={me.error} onRetry={() => void me.refetch()}>
      {result === undefined ? null : <SessionView result={result} />}
    </AsyncStates>
  );
}

function SessionView(props: {
  result: ReturnType<typeof buildAdminSession>;
}): React.JSX.Element {
  const { result } = props;
  if (result.kind === 'error') {
    return (
      <EmptyState
        title={t(
          result.reason === 'WAREHOUSE_REQUIRED'
            ? 'admin.scope.warehouseRequired'
            : 'admin.scope.notAdmin',
        )}
      />
    );
  }
  return (
    <AdminSessionProvider session={result.session}>
      <AdminHome />
    </AdminSessionProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
