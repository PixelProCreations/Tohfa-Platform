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
 *
 * Hidden (plan phase 8), because no API reports them: the "Security Status"
 * grid (password / 2FA / session states), the "Login Security" rows (login
 * methods, trusted device) and the password-changed date. The design showed
 * fixed values there; the server has no endpoint for any of them.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminSpacing, adminType } from '../../../theme';
import { Card, SectionTitle, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { roleLabelFor } from './mappers';
import { BlockIcon, KeyIcon, MenuCard, MenuRow, profileLayout, StatusRow } from './ProfileParts';
import type { WarehouseScreenBaseProps } from './types';

export interface SecurityScreenProps extends WarehouseScreenBaseProps {
  onChangePassword?: (() => void) | undefined;
  onViewSessionSecurity?: (() => void) | undefined;
}

export function SecurityScreen({ scope, onBack, onChangePassword, onViewSessionSecurity }: SecurityScreenProps) {
  return (
    <WalletScreen title="Security" onBack={onBack}>
      <ScrollView contentContainerStyle={profileLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {onChangePassword ? (
          <>
            <SectionTitle>PASSWORD</SectionTitle>
            <MenuCard>
              <MenuRow
                icon={<KeyIcon />}
                title="Password"
                subtitle="••••••••••"
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
            2FA management is provisioned at the organizational policy level by system administrators for {roleLabelFor(scope)} accounts.
          </Text>
        </Card>

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

function ViewLink({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button">
      <Text style={styles.viewLink}>View</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  twoFaHeader: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginBottom: adminSpacing.xs },
  twoFaTitle: { ...adminType.rowTitle, color: adminColors.ink, flex: 1 },
  twoFaText: { ...adminType.rowMeta, color: adminColors.muted },

  viewLink: { ...adminType.rowTitle, color: adminColors.brand },
});
