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
 * The design's "Current Session" card, session id, location, "trusted device"
 * switch and login history are all shown. Where the API cannot supply a value
 * (the access token carries no session id, so the server cannot say which row
 * is this device; there is no location, no trusted-device flag and no failed or
 * past logins) the value is an em-dash, never a missing element.
 */
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { Card, InfoCard, InfoNote, SectionTitle, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { ConfirmDialog, DangerOutlineButton, LogoutIcon, MenuCard, profileLayout, StatusDot, StatusRow } from './ProfileParts';
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
  const [remembered, setRemembered] = useState(true);
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
        <SectionTitle>{t('profile.sessions.current')}</SectionTitle>
        <View style={styles.currentSession}>
          <View style={styles.activeRow}>
            <StatusDot color={adminColors.success.text} />
            <Text style={styles.activeText}>{t('profile.sessions.active')}</Text>
          </View>
          <InfoCard
            rows={[
              [
                { label: t('profile.sessions.device'), value: noValue },
                { label: t('profile.sessions.browser'), value: noValue },
              ],
              [
                { label: t('profile.sessions.location'), value: noValue },
                { label: t('profile.sessions.lastActive'), value: noValue },
              ],
            ]}
          />
        </View>

        <SectionTitle>{t('profile.sessions.info')}</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: t('profile.sessions.sessionId'), value: noValue },
              { label: t('profile.sessions.status'), value: t('profile.sessions.active') },
            ],
            [
              { label: t('profile.sessions.started'), value: noValue },
              { label: t('profile.sessions.lastActive'), value: noValue },
            ],
          ]}
        />

        <SectionTitle>{t('profile.sessions.trusted')}</SectionTitle>
        <MenuCard>
          <StatusRow
            label={t('profile.sessions.remembered')}
            right={
              <Switch
                value={remembered}
                onValueChange={setRemembered}
                trackColor={{ false: adminColors.border, true: adminColors.brand }}
                thumbColor={adminColors.card}
              />
            }
          />
        </MenuCard>

        <SectionTitle>{t('profile.sessions.history')}</SectionTitle>
        <Card>
          {sessions.length === 0 ? (
            <View style={styles.historyRow}>
              <View style={styles.historyText}>
                <Text style={styles.historyDevice}>{noValue}</Text>
                <Text style={styles.historyTime}>{noValue}</Text>
              </View>
              <Text style={styles.historyResult}>{noValue}</Text>
            </View>
          ) : (
            sessions.map((session, index) => (
              <View key={session.id} style={[styles.historyRow, index > 0 && styles.historyRowDivided]}>
                <View style={styles.historyText}>
                  <Text style={styles.historyDevice}>{session.device}</Text>
                  <Text style={styles.historyTime}>{session.started}</Text>
                </View>
                <Text style={styles.historyResult}>{t('profile.sessions.active')}</Text>
              </View>
            ))
          )}
        </Card>

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
  // The design outlines the current session in green; success.border is the theme's green stroke.
  currentSession: {
    borderWidth: 1.5,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xs,
    backgroundColor: adminColors.success.bg,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
  activeText: { ...adminType.rowTitle, color: adminColors.success.text },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: adminSpacing.sm },
  historyRowDivided: { borderTopWidth: 1, borderTopColor: adminColors.border },
  historyText: { flex: 1 },
  historyDevice: { ...adminType.rowTitle, color: adminColors.ink },
  historyTime: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  historyResult: { ...adminType.caption, color: adminColors.success.text },
  session: { marginTop: adminSpacing.md },
  logoutButton: { marginTop: adminSpacing.xl },
});
