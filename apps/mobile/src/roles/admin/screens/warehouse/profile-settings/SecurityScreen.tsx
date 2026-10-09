/**
 * Security overview for the Main and Sub warehouse admins (FINAL_LIST #82).
 *
 * Was SubWarehouseSecurityScreen. Gate: none beyond login
 * (auth.password.change_own and auth.session.revoke_own are `all` for both
 * roles). The Password row opens the Settings screen's change-password state
 * (`onChangePassword`, the 'ChangePassword' route); Recent Login Activity and
 * Session History open Session & Security (`onViewSessionSecurity`). Without a
 * handler the row is not shown (the Sub version fell back to an Alert naming
 * its warehouse terminal).
 *
 * 2FA is read-only: it is provisioned by policy, and no code lets a warehouse
 * admin change it.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminSpacing, adminType } from '../../../theme';
import { Card, CheckIcon, SectionTitle, StatusBadge, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { defaultProfile, roleLabelOf } from './fixtures';
import { BlockIcon, KeyIcon, MenuCard, MenuRow, profileLayout, StatusDot, StatusRow } from './ProfileParts';
import type { AdminAccountProfile, WarehouseScreenBaseProps } from './types';

export interface SecurityScreenProps extends WarehouseScreenBaseProps {
  profile?: AdminAccountProfile | undefined;
  onChangePassword?: (() => void) | undefined;
  onViewSessionSecurity?: (() => void) | undefined;
}

export function SecurityScreen({ scope, onBack, profile, onChangePassword, onViewSessionSecurity }: SecurityScreenProps) {
  const account = profile ?? defaultProfile(scope);

  return (
    <WalletScreen title="Security" onBack={onBack}>
      <ScrollView contentContainerStyle={profileLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>SECURITY STATUS</SectionTitle>
        <Card>
          <View style={styles.statusGrid}>
            <StatusCell label="Password" value="Active" color={adminColors.success.text} />
            <StatusCell label="2FA" value="Not Enabled" color={adminColors.muted} />
          </View>
          <View style={styles.divider} />
          <View style={styles.statusGrid}>
            <StatusCell label="Session" value="Secure" color={adminColors.success.text} />
          </View>
        </Card>

        {onChangePassword ? (
          <>
            <SectionTitle>PASSWORD</SectionTitle>
            <MenuCard>
              <MenuRow
                icon={<KeyIcon />}
                title="Password"
                subtitle={`Last changed ${account.passwordChanged} · ••••••••••`}
                onPress={onChangePassword}
              />
            </MenuCard>
          </>
        ) : null}

        <SectionTitle>TWO-FACTOR AUTHENTICATION</SectionTitle>
        <Card>
          <View style={styles.twoFaHeader}>
            <BlockIcon color={adminColors.ink} />
            <Text style={styles.twoFaTitle}>Two-Factor Authentication — Role Protected</Text>
          </View>
          <Text style={styles.twoFaText}>
            2FA management is provisioned at the organizational policy level by system administrators for {roleLabelOf(scope)} accounts.
          </Text>
        </Card>

        <SectionTitle>LOGIN SECURITY</SectionTitle>
        <MenuCard>
          <StatusRow label="Login with Password" right={<EnabledPill label="Enabled" />} />
          <StatusRow label="Login with OTP" right={<EnabledPill label="Available" />} />
          <StatusRow label="Trusted Device" right={<EnabledPill label="Enabled" />} />
        </MenuCard>

        {onViewSessionSecurity ? (
          <>
            <SectionTitle>SECURITY ALERTS</SectionTitle>
            <MenuCard>
              <StatusRow label="Recent Login Activity" right={<ViewLink onPress={onViewSessionSecurity} />} />
              <StatusRow label="Session History" right={<ViewLink onPress={onViewSessionSecurity} />} />
            </MenuCard>
          </>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

function StatusCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statusCell}>
      <Text style={styles.statusLabel}>{label}</Text>
      <View style={styles.statusValueRow}>
        <StatusDot color={color} />
        <Text style={[styles.statusValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

function EnabledPill({ label }: { label: string }) {
  return (
    <View style={styles.pillRow}>
      <CheckIcon size={14} color={adminColors.success.text} />
      <StatusBadge label={label} tone="success" />
    </View>
  );
}

function ViewLink({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button">
      <Text style={styles.viewLink}>View</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  statusGrid: { flexDirection: 'row' },
  statusCell: { flex: 1 },
  statusLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  statusValueRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  statusValue: { ...adminType.rowTitle },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md },

  twoFaHeader: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginBottom: adminSpacing.xs },
  twoFaTitle: { ...adminType.rowTitle, color: adminColors.ink, flex: 1 },
  twoFaText: { ...adminType.rowMeta, color: adminColors.muted },

  pillRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  viewLink: { ...adminType.rowTitle, color: adminColors.brand },
});
