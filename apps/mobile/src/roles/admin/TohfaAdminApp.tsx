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
 * Sign-out: the host passes `onSignOut` (navigate to its login screen), the
 * same contract as CustomerMainApp — admin code never imports another role.
 * Before calling it, the admin side forgets the shared client's tokens
 * (shell `clearLocalAuth`) and clears the query cache so the next account on
 * this device sees nothing of this one (BR-30). A successful password change
 * MUST go through this path: the server has already ended every session.
 *
 * New admin modules are added in navigation/adminEntries.ts, not here.
 */
import React, { useMemo } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Button, EmptyState } from '@tohfa/mobile-ui';
import { clearLocalAuth } from '../../shell/api/client';
import { queryClient } from '../../shell/api/queryClient';
import { fetchCurrentUser, logout } from '../../shell/auth/api';
import { useAdminQuery } from './api/hooks';
import { adminKeys } from './api/queryKeys';
import { t } from './i18n';
import { AdminHome } from './navigation/AdminHome';
import { AsyncStates } from './screens/warehouse/shared/AsyncStates';
import { queryViewState } from './screens/warehouse/shared/queryViewState';
import { AdminSessionProvider, buildAdminSession } from './session/AdminSession';
import { createAdminSignOut, type AdminSignOut } from './session/signOut';
import { adminTheme } from './theme';

export interface TohfaAdminAppProps {
  /** Host navigation to its sign-in screen, called after the device is cleared. */
  onSignOut: () => void;
}

export function TohfaAdminApp(props: TohfaAdminAppProps): React.JSX.Element {
  const { onSignOut } = props;
  const signOut = useMemo(
    () =>
      createAdminSignOut({
        logout,
        clearLocalAuth,
        clearCache: () => queryClient.clear(),
        onSignOut,
      }),
    [onSignOut],
  );
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={[styles.screen, { backgroundColor: adminTheme.colors.surface }]}>
        <StatusBar barStyle="light-content" backgroundColor={adminTheme.colors.primaryPressed} />
        <AdminSessionGate signOut={signOut} />
      </SafeAreaView>
    </QueryClientProvider>
  );
}

function AdminSessionGate(props: { signOut: AdminSignOut }): React.JSX.Element {
  const me = useAdminQuery(adminKeys.session(), () => fetchCurrentUser());
  const state = queryViewState(me, () => false);
  // Memoised so the provided session (and its can()) keeps its identity across
  // renders instead of re-rendering every consumer.
  const result = useMemo(
    () => (me.data === undefined ? undefined : buildAdminSession(me.data)),
    [me.data],
  );

  return (
    <AsyncStates state={state} error={me.error} onRetry={() => void me.refetch()}>
      {result === undefined ? null : <SessionView result={result} signOut={props.signOut} />}
    </AsyncStates>
  );
}

function SessionView(props: {
  result: ReturnType<typeof buildAdminSession>;
  signOut: AdminSignOut;
}): React.JSX.Element {
  const { result } = props;
  if (result.kind === 'error') {
    // A dead end must still offer a way out.
    return (
      <View style={[styles.screen, { padding: adminTheme.spacing.lg }]}>
        <EmptyState
          title={t(
            result.reason === 'WAREHOUSE_REQUIRED'
              ? 'admin.scope.warehouseRequired'
              : 'admin.scope.notAdmin',
          )}
        />
        <Button
          title={t('admin.profile.signOut')}
          variant="outline"
          onPress={() => void props.signOut.signOut()}
        />
      </View>
    );
  }
  return (
    <AdminSessionProvider session={result.session}>
      <AdminHome signOut={props.signOut} />
    </AdminSessionProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
