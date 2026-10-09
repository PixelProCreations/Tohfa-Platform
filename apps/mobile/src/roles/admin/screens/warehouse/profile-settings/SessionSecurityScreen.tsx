/**
 * Session & Security for the Main and Sub warehouse admins (FINAL_LIST #83).
 *
 * Was SubWarehouseSessionSecurityScreen. Gate: none beyond login
 * (auth.session.revoke_own and auth.principal.view_own are `all` for both
 * roles). Only the CURRENT session can be logged out here: ending other
 * sessions is auth.session.terminate_other, SUPER_ADMIN only, so no
 * "log out other devices" control is offered.
 *
 * The session facts are mock (no session-list endpoint for the signed-in
 * user: SPEC_GAPS W4l-3); the location no longer names a warehouse.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { Card, InfoCard, SectionTitle, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { CURRENT_SESSION, LOGIN_HISTORY } from './fixtures';
import { ConfirmDialog, DangerOutlineButton, LogoutIcon, MenuCard, profileLayout, StatusDot, StatusRow } from './ProfileParts';
import type { CurrentSessionInfo, LoginHistoryItem, WarehouseScreenBaseProps } from './types';

export interface SessionSecurityScreenProps extends WarehouseScreenBaseProps {
  session?: CurrentSessionInfo | undefined;
  loginHistory?: readonly LoginHistoryItem[] | undefined;
  /** Log out this session (host navigates to login). Without it the screen just goes back. */
  onLogout?: (() => void) | undefined;
}

export function SessionSecurityScreen({
  onBack,
  session = CURRENT_SESSION,
  loginHistory = LOGIN_HISTORY,
  onLogout,
}: SessionSecurityScreenProps) {
  const [remembered, setRemembered] = useState(true);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const logout = () => {
    setConfirmLogout(false);
    if (onLogout) onLogout();
    else onBack();
  };

  return (
    <WalletScreen title="Session & Security" onBack={onBack}>
      <ScrollView contentContainerStyle={profileLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>CURRENT SESSION</SectionTitle>
        <View style={styles.currentSession}>
          <View style={styles.activeRow}>
            <StatusDot color={adminColors.success.text} />
            <Text style={styles.activeText}>Active</Text>
          </View>
          <InfoCard
            rows={[
              [
                { label: 'Device', value: session.device },
                { label: 'Browser', value: session.browser },
              ],
              [
                { label: 'Location', value: session.location },
                { label: 'Last Active', value: session.lastActive },
              ],
            ]}
          />
        </View>

        <SectionTitle>SESSION INFORMATION</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Session ID', value: session.sessionId },
              { label: 'Status', value: 'Active' },
            ],
            [
              { label: 'Started', value: session.started },
              { label: 'Last Active', value: session.lastActive },
            ],
          ]}
        />

        <SectionTitle>TRUSTED DEVICE</SectionTitle>
        <MenuCard>
          <StatusRow
            label="This device is remembered"
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

        <SectionTitle>LOGIN HISTORY</SectionTitle>
        <Card>
          {loginHistory.map((item, index) => (
            <View key={item.id} style={[styles.historyRow, index > 0 && styles.historyRowDivided]}>
              <View style={styles.historyText}>
                <Text style={styles.historyDevice}>{item.device}</Text>
                <Text style={styles.historyTime}>{item.time}</Text>
              </View>
              <Text style={[styles.historyResult, item.result === 'Failed' && styles.historyResultFailed]}>{item.result}</Text>
            </View>
          ))}
        </Card>

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
  historyResultFailed: { color: adminColors.danger.text },

  logoutButton: { marginTop: adminSpacing.xl },
});
