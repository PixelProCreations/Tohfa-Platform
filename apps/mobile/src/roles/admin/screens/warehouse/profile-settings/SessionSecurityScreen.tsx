/**
 * Session & Security for the Main and Sub warehouse admins (FINAL_LIST #83).
 *
 * Was SubWarehouseSessionSecurityScreen. Gate: none beyond login
 * (auth.session.revoke_own and auth.principal.view_own are `all` for both
 * roles). Only the CURRENT session can be logged out here: ending other
 * sessions is auth.session.terminate_other, `none` for both warehouse roles,
 * so no "log out other devices" control is offered.
 *
 * Live (plan phase 8, BR-67): the list is GET /auth/me/sessions, the
 * account's own LIVE sessions (neither revoked nor expired), newest first:
 * device platform, user agent, when it started, when it was last seen, the
 * last-seen IP and when it expires. Exactly those fields.
 *
 * Hidden, because the API cannot provide them: the "Current Session" card
 * (the access token carries no session id, so the server cannot say which row
 * is this device, and the app does not guess), the session id, the location,
 * the "trusted device" switch and the login history (only live sessions are
 * returned; there are no failed or past logins).
 */
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { t } from '../../../i18n';
import { adminSpacing } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { InfoCard, InfoNote, SectionTitle, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { ConfirmDialog, DangerOutlineButton, LogoutIcon, profileLayout } from './ProfileParts';
import type { SessionRowView, WarehouseScreenBaseProps } from './types';

export interface SessionSecurityScreenProps extends WarehouseScreenBaseProps {
  /** The live sessions (GET /auth/me/sessions). */
  sessions?: readonly SessionRowView[] | undefined;
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  /** Log out this session (host navigates to login). Without it the screen just goes back. */
  onLogout?: (() => void) | undefined;
}

export function SessionSecurityScreen({
  onBack,
  sessions = [],
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLogout,
}: SessionSecurityScreenProps) {
  const [confirmLogout, setConfirmLogout] = useState(false);

  const logout = () => {
    setConfirmLogout(false);
    if (onLogout) onLogout();
    else onBack();
  };

  const state = queryViewState({ isLoading, error, itemCount: sessions.length });
  const noValue = t('profile.noValue');

  return (
    <WalletScreen title="Session & Security" onBack={onBack}>
      <ScrollView
        contentContainerStyle={profileLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /> : undefined}
      >
        <SectionTitle>{t('profile.sessions.title')}</SectionTitle>
        {state === 'loading' ? (
          <AdminLoadingState />
        ) : state === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : state === 'empty' ? (
          <AdminEmptyState title={t('profile.sessions.empty')} />
        ) : (
          <>
            <InfoNote>{t('profile.sessions.note')}</InfoNote>
            {sessions.map((session) => (
              <View key={session.id} style={styles.session}>
                <InfoCard
                  rows={[
                    [
                      { label: t('profile.sessions.device'), value: session.device },
                      { label: t('profile.sessions.lastActive'), value: session.lastActive ?? noValue },
                    ],
                    [
                      { label: t('profile.sessions.started'), value: session.started },
                      { label: t('profile.sessions.expires'), value: session.expires },
                    ],
                    [
                      { label: t('profile.sessions.ip'), value: session.ip ?? noValue },
                      { label: t('profile.sessions.userAgent'), value: session.userAgent ?? noValue },
                    ],
                  ]}
                />
              </View>
            ))}
          </>
        )}

        <View style={styles.logoutButton}>
          <DangerOutlineButton label="Logout Current Session" onPress={() => setConfirmLogout(true)} />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmLogout}
        title="Logout Current Session"
        message="Are you sure you want to end your active session on this device?"
        confirmLabel="Logout"
        destructive
        icon={<LogoutIcon />}
        onConfirm={logout}
        onCancel={() => setConfirmLogout(false)}
      />
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  session: { marginTop: adminSpacing.md },
  logoutButton: { marginTop: adminSpacing.xl },
});
