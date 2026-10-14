// Design id: M16-S04
/**
 * Settings (account hub) for the Main and Sub warehouse admins (FINAL_LIST #84).
 *
 * Was SubWarehouseSettingsScreen, which also drew every child screen itself
 * through a `currentScreen` switch. The children are ProfileFlow routes now;
 * this screen lists them (`onOpen`) and keeps the two states that are really
 * its own:
 *   - the inline change-password form: POST /auth/me/change-password
 *     (plan phase 8) through the flow (`onSubmitPassword`). A success ends
 *     EVERY session of the account on the server, this one included, so the
 *     screen signs out right away (`onPasswordChanged`, the host's login
 *     route) instead of leaving a dead session on screen. The owner dropped the unreachable Main stub
 *     (MainWarehouseChangePasswordScreen); Security's "Password" row opens this
 *     same state through the 'ChangePassword' route (initialView).
 *   - the logout confirmation and signed-out state, absorbing
 *     MainWarehouseSignOutConfirmScreen and MainWarehouseSignedOutScreen.
 *
 * Gate: none beyond login (auth.principal.view_own and auth.password.change_own
 * are `all` for both roles). Notification Settings is listed too:
 * notification.own.view is `all` for every role. Main differs only in the header label ("Main
 * Warehouse Admin · All Warehouses").
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { NEW_PASSWORD_MAX_LENGTH, NEW_PASSWORD_MIN_LENGTH, type ChangePasswordBody } from '../../../api/profile';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { Card, InfoNote, SectionTitle, WalletButton, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { passwordChangeErrorKey, passwordFormErrorKey, roleLabelFor, scopeLabelFor } from './mappers';
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
  /** POST /auth/me/change-password; `onDone` runs after the server accepted it. Without it the form cannot submit. */
  onSubmitPassword?: ((body: ChangePasswordBody, onDone: () => void) => void) | undefined;
  isChangingPassword?: boolean | undefined;
  /** The last change-password failure (a wrong current password has its own message). */
  passwordError?: unknown;
  /** The password changed and every session was revoked: sign out. Without it the signed-out state is shown. */
  onPasswordChanged?: (() => void) | undefined;
}

type SettingsView = 'hub' | 'changePassword' | 'signedOut';

export function SettingsScreen({
  scope,
  onBack,
  initialView = 'hub',
  onOpen,
  onLogout,
  onSubmitPassword,
  isChangingPassword = false,
  passwordError,
  onPasswordChanged,
}: SettingsScreenProps) {
  const [view, setView] = useState<SettingsView>(initialView);
  const [showLogout, setShowLogout] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const accountLabel = `${roleLabelFor(scope)} · ${scopeLabelFor(scope)}`;

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
    const invalid = passwordFormErrorKey({ current: currentPass, next: newPass, confirm: confirmPass });
    if (invalid !== null) {
      Alert.alert(t('profile.password.invalidTitle'), t(invalid, { min: NEW_PASSWORD_MIN_LENGTH, max: NEW_PASSWORD_MAX_LENGTH }));
      return;
    }
    if (!onSubmitPassword || isChangingPassword) return;
    onSubmitPassword({ currentPassword: currentPass, newPassword: newPass }, () => {
      resetPasswordForm();
      // Every session is gone on the server now, this one included: leave for login.
      Alert.alert(t('profile.password.changedTitle'), t('profile.password.changedBody'));
      if (onPasswordChanged) onPasswordChanged();
      else setView('signedOut');
    });
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
            {passwordError !== null && passwordError !== undefined ? (
              <View style={styles.formError}>
                <InfoNote tone="danger">{t(passwordChangeErrorKey(passwordError))}</InfoNote>
              </View>
            ) : null}
            <View style={styles.formActions}>
              <WalletButton label="Cancel" variant="neutral" flex onPress={closePasswordForm} disabled={isChangingPassword} />
              <WalletButton
                label={isChangingPassword ? t('profile.password.updating') : 'Update Password'}
                flex
                onPress={handleUpdatePassword}
                disabled={isChangingPassword}
              />
            </View>
            <View style={styles.formError}>
              <InfoNote tone="info">{t('profile.password.signOutNote')}</InfoNote>
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
          {/* notification.own.view is `all` for every role (docs/rbac.json): no client gate. */}
          {onOpen ? (
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
        message={`Are you sure you want to sign out of your ${roleLabelFor(scope)} account?`}
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
  formError: { marginTop: adminSpacing.md },
});
