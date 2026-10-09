// Design id: M16-S04
/**
 * Settings (account hub) for the Main and Sub warehouse admins (FINAL_LIST #84).
 *
 * Was SubWarehouseSettingsScreen, which also drew every child screen itself
 * through a `currentScreen` switch. The children are ProfileFlow routes now;
 * this screen lists them (`onOpen`) and keeps the two states that are really
 * its own:
 *   - the inline change-password form (the working flow: validation and
 *     success). The owner dropped the unreachable Main stub
 *     (MainWarehouseChangePasswordScreen); Security's "Password" row opens this
 *     same state through the 'ChangePassword' route (initialView).
 *   - the logout confirmation and signed-out state, absorbing
 *     MainWarehouseSignOutConfirmScreen and MainWarehouseSignedOutScreen.
 *
 * Gate: none beyond login (auth.principal.view_own and auth.password.change_own
 * are `all` for both roles). Notification Settings is listed only with
 * notification.own.view. Main differs only in the header label ("Main
 * Warehouse Admin · All Warehouses").
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { Card, SectionTitle, WalletButton, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { roleLabelOf, scopeLabelOf } from './fixtures';
import {
  AboutIcon,
  BellIcon,
  ConfirmDialog,
  DeviceIcon,
  HelpCircleIcon,
  KeyIcon,
  LogoutIcon,
  MenuCard,
  MenuRow,
  PASSWORD_MIN_LENGTH,
  PROFILE_CODES,
  profileLayout,
  ShieldIcon,
  SignedOutView,
  UserIcon,
} from './ProfileParts';
import type { ProfileRoute, WarehouseScreenBaseProps } from './types';

/**
 * Child routes the hub opens. 'ChangePassword' is this screen's own inline
 * state; inside ProfileFlow the row still goes through the route so hardware
 * back returns to the hub.
 */
export type SettingsChildRoute = Exclude<ProfileRoute, 'Settings'>;

export interface SettingsScreenProps extends WarehouseScreenBaseProps {
  /** 'changePassword' opens straight on the password form (Security's row); back then leaves the screen. */
  initialView?: 'hub' | 'changePassword' | undefined;
  /** Open a child screen. Without it the rows that need it are not shown. */
  onOpen?: ((route: SettingsChildRoute) => void) | undefined;
  /** Sign out (host navigates to its login). Without it the signed-out state is shown. */
  onLogout?: (() => void) | undefined;
}

type SettingsView = 'hub' | 'changePassword' | 'signedOut';

export function SettingsScreen({ scope, can, onBack, initialView = 'hub', onOpen, onLogout }: SettingsScreenProps) {
  const [view, setView] = useState<SettingsView>(initialView);
  const [showLogout, setShowLogout] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const accountLabel = `${roleLabelOf(scope)} · ${scopeLabelOf(scope)}`;

  const resetPasswordForm = () => {
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  // Opened from Security: leaving the form leaves the screen. Opened from the hub row: back to the hub.
  const closePasswordForm = () => {
    resetPasswordForm();
    if (initialView === 'changePassword') onBack();
    else setView('hub');
  };

  const handleUpdatePassword = () => {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert('Validation Error', 'Please fill in all password fields.');
      return;
    }
    if (newPass.length < PASSWORD_MIN_LENGTH) {
      Alert.alert('Validation Error', `New password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Password Mismatch', 'New password and confirm password do not match.');
      return;
    }
    if (newPass === currentPass) {
      Alert.alert('Validation Error', 'New password must be different from the current password.');
      return;
    }
    // No change-password endpoint exists yet (SPEC_GAPS W4l-1): mock success.
    Alert.alert('Success', 'Your password has been changed successfully.', [{ text: 'OK', onPress: closePasswordForm }]);
  };

  const handleLogout = () => {
    setShowLogout(false);
    if (onLogout) onLogout();
    else setView('signedOut');
  };

  if (view === 'signedOut') {
    return <SignedOutView />;
  }

  if (view === 'changePassword') {
    return (
      <WalletScreen title="Change Password" subtitle={accountLabel} onBack={closePasswordForm}>
        <ScrollView contentContainerStyle={profileLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SectionTitle>UPDATE CREDENTIALS</SectionTitle>
          <Card>
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPass}
              onChangeText={setCurrentPass}
              placeholder="Enter current password"
              placeholderTextColor={adminColors.placeholder}
              secureTextEntry
            />
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPass}
              onChangeText={setNewPass}
              placeholder={`Enter new password (min ${PASSWORD_MIN_LENGTH} characters)`}
              placeholderTextColor={adminColors.placeholder}
              secureTextEntry
            />
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPass}
              onChangeText={setConfirmPass}
              placeholder="Re-enter new password"
              placeholderTextColor={adminColors.placeholder}
              secureTextEntry
            />
            <View style={styles.formActions}>
              <WalletButton label="Cancel" variant="neutral" flex onPress={closePasswordForm} />
              <WalletButton label="Update Password" flex onPress={handleUpdatePassword} />
            </View>
          </Card>
        </ScrollView>
      </WalletScreen>
    );
  }

  return (
    <WalletScreen title="Settings" subtitle={accountLabel} onBack={onBack}>
      <ScrollView contentContainerStyle={profileLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>ACCOUNT</SectionTitle>
        <MenuCard>
          {onOpen ? (
            <MenuRow icon={<UserIcon />} title="Profile" subtitle="Personal account information" onPress={() => onOpen('UserProfile')} />
          ) : null}
          {onOpen && can(PROFILE_CODES.notificationView) ? (
            <MenuRow
              icon={<BellIcon />}
              title="Notification Settings"
              subtitle="Manage your notifications"
              onPress={() => onOpen('NotificationSettings')}
            />
          ) : null}
        </MenuCard>

        <SectionTitle>SECURITY</SectionTitle>
        <MenuCard>
          {onOpen ? (
            <MenuRow icon={<ShieldIcon />} title="Security" subtitle="Password & login security" onPress={() => onOpen('Security')} />
          ) : null}
          <MenuRow icon={<KeyIcon />} title="Change Password" subtitle="Update your password" onPress={() => (onOpen ? onOpen('ChangePassword') : setView('changePassword'))}
          />
          {onOpen ? (
            <MenuRow
              icon={<DeviceIcon />}
              title="Session & Security"
              subtitle="Login history & current session"
              onPress={() => onOpen('SessionSecurity')}
            />
          ) : null}
        </MenuCard>

        {onOpen ? (
          <>
            <SectionTitle>SUPPORT</SectionTitle>
            <MenuCard>
              <MenuRow
                icon={<HelpCircleIcon />}
                title="Help & Support"
                subtitle="Get help or contact support"
                onPress={() => onOpen('HelpSupport')}
              />
            </MenuCard>

            <SectionTitle>ABOUT</SectionTitle>
            <MenuCard>
              <MenuRow icon={<AboutIcon />} title="About TOHFA" subtitle="App information & legal" onPress={() => onOpen('About')} />
            </MenuCard>
          </>
        ) : null}

        <View style={profileLayout.gap} />
        <MenuCard>
          <MenuRow icon={<LogoutIcon />} title="Logout" danger onPress={() => setShowLogout(true)} />
        </MenuCard>
      </ScrollView>

      <ConfirmDialog
        visible={showLogout}
        title="Logout?"
        message={`Are you sure you want to sign out of your ${roleLabelOf(scope)} account?`}
        confirmLabel="Logout"
        destructive
        icon={<LogoutIcon />}
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  inputLabel: { ...adminType.rowTitle, color: adminColors.ink, marginTop: adminSpacing.md, marginBottom: adminSpacing.xs },
  input: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  formActions: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.xl },
});
