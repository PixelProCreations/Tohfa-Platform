/**
 * Settings hub for all non-warehouse admin roles (Tohfa, Farmer Admin, Super Admin).
 * Delegates to the shared warehouse sub-screens (SecurityScreen,
 * SessionSecurityScreen, HelpSupportScreen, AboutScreen,
 * NotificationSettingsScreen) which are role-agnostic by design.
 *
 * The bottom tab bar is NOT rendered here — the host dashboard owns tabs.
 * Gate: every signed-in admin reaches this screen; individual rows gate on
 * the caller's `can` for sensitive actions.
 *
 * Design source: origin/tofhafarmfin-rbac TohfaAdminSettingsScreen.tsx.
 * Changes: removed bottom tab bar and tab-navigation props; fail-closed
 * default for `can`; @tohfa/mobile-ui SafeAreaView + ScreenStatusBar;
 * i18n keys; role prop dropped (unused in design logic).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';

import { NEW_PASSWORD_MAX_LENGTH, NEW_PASSWORD_MIN_LENGTH } from '../../api/profile';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors, adminSpacing } from '../../theme';
import { Card, InfoNote, SectionTitle, WalletButton, WalletScreen } from '../warehouse/wallet-cashtopup/WalletParts';
import {
  AboutIcon,
  BellIcon,
  ConfirmDialog,
  DeviceIcon,
  HelpCircleIcon,
  KeyIcon,
  LogoutIcon,
  ShieldIcon,
  UserIcon,
} from '../warehouse/profile-settings/ProfileParts';
import { AboutScreen } from '../warehouse/profile-settings/AboutScreen';
import { HelpSupportScreen } from '../warehouse/profile-settings/HelpSupportScreen';
import { NotificationSettingsScreen } from '../warehouse/profile-settings/NotificationSettingsScreen';
import { SecurityScreen } from '../warehouse/profile-settings/SecurityScreen';
import { SessionSecurityScreen } from '../warehouse/profile-settings/SessionSecurityScreen';
import { passwordChangeErrorKey, passwordFormErrorKey } from '../warehouse/profile-settings/mappers';
import { useAdminHelp, useChangePassword, useMySessions, useNotificationPreferences, useSavePreferences } from '../warehouse/profile-settings/useProfileData';
import { settingsStyles as styles } from './settingsStyles';

// ─── Icons ───────────────────────────────────────────────────────────────────

function SettingsGearIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BackArrowIcon({ size = 24, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Menu Row ────────────────────────────────────────────────────────────────

function SettingsMenuRow({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconChip, danger && styles.iconChipDanger]}>{icon}</View>
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      {!danger && <ChevronRightIcon />}
    </TouchableOpacity>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface TohfaAdminSettingsScreenProps {
  onBack?: () => void;
  can: Can;
  onNavigateProfile?: () => void;
  onSignOut?: () => void;
}

type InnerView = 'hub' | 'changePassword' | 'security' | 'sessionSecurity' | 'helpSupport' | 'about' | 'notifications';


export function TohfaAdminSettingsScreen({
  onBack,
  can,
  onNavigateProfile,
  onSignOut,
}: TohfaAdminSettingsScreenProps) {
  const [view, setView] = useState<InnerView>('hub');
  const [showLogout, setShowLogout] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // All hooks are called unconditionally before the early-return sub-views (rules of hooks).
  // The scope is a stable all-warehouses scope: Tohfa/FA/SA admins are not scoped to one warehouse.
  const scope = useMemo(() => ({ warehouseId: undefined as string | undefined, warehouseName: t('profile.scope.allWarehouses') }), []);

  // Live data for the sub-screens (plan phase 8).
  const sessions = useMySessions(scope);
  const help = useAdminHelp(scope);
  const prefs = useNotificationPreferences(scope);
  const save = useSavePreferences();

  // After a save failure re-fetch the server's stored state (a partial save may
  // have written some categories before stopping).
  const refreshedForSaveError = useRef<unknown>(null);
  useEffect(() => {
    if (save.error === null || save.error === undefined || save.error === refreshedForSaveError.current) return;
    refreshedForSaveError.current = save.error;
    prefs.refresh();
  });

  // The same wired write the warehouse Settings uses: POST /auth/me/change-password.
  // That shared screen is not reused whole because it is worded and labelled for
  // warehouse admins ("Main Warehouse Admin" header, English literals).
  const change = useChangePassword();

  const resetPasswordForm = () => {
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    change.reset();
  };

  const closePasswordForm = () => {
    resetPasswordForm();
    setView('hub');
  };

  const handleUpdatePassword = () => {
    const invalid = passwordFormErrorKey({ current: currentPass, next: newPass, confirm: confirmPass });
    if (invalid !== null) {
      Alert.alert(t('profile.password.invalidTitle'), t(invalid, { min: NEW_PASSWORD_MIN_LENGTH, max: NEW_PASSWORD_MAX_LENGTH }));
      return;
    }
    // Success is only ever reported from the server's answer (run's onDone).
    change.run({ currentPassword: currentPass, newPassword: newPass }, () => {
      resetPasswordForm();
      // The server revoked every session of the account, this one included: leave for login.
      Alert.alert(t('profile.password.changedTitle'), t('profile.password.changedBody'));
      if (onSignOut) onSignOut();
      else setView('hub');
    });
  };

  if (view === 'security') {
    return (
      <SecurityScreen
        scope={scope}
        can={can}
        onBack={() => setView('hub')}
        onChangePassword={() => setView('changePassword')}
        onViewSessionSecurity={() => setView('sessionSecurity')}
      />
    );
  }
  if (view === 'sessionSecurity') {
    return (
      <SessionSecurityScreen
        scope={scope}
        can={can}
        onBack={() => setView('hub')}
        sessions={sessions.sessions}
        isLoading={sessions.isLoading}
        error={sessions.error}
        onRetry={sessions.refresh}
        onRefresh={sessions.refresh}
        isRefreshing={sessions.isRefreshing}
        onLogout={onSignOut}
      />
    );
  }
  if (view === 'helpSupport') {
    return (
      <HelpSupportScreen
        scope={scope}
        can={can}
        onBack={() => setView('hub')}
        help={help.help}
        isLoading={help.isLoading}
        error={help.error}
        onRetry={help.refresh}
        onRefresh={help.refresh}
        isRefreshing={help.isRefreshing}
        onReportIssue={() => Alert.alert(t('tohfaHome.notAvailable.title'), t('tohfaHome.notAvailable.body'))}
      />
    );
  }
  if (view === 'about') {
    return <AboutScreen scope={scope} can={can} onBack={() => setView('hub')} />;
  }
  if (view === 'notifications') {
    return (
      <NotificationSettingsScreen
        scope={scope}
        can={can}
        onBack={() => setView('hub')}
        preferences={prefs.preferences}
        isLoading={prefs.isLoading}
        error={prefs.error}
        onRetry={prefs.refresh}
        onRefresh={prefs.refresh}
        isRefreshing={prefs.isRefreshing}
        onSave={(changes) => save.run(changes)}
        isSaving={save.isPending}
        saveError={save.error}
      />
    );
  }
  if (view === 'changePassword') {
    return (
      <WalletScreen
        title={t('settings.changePassword.title')}
        subtitle={t('settings.changePassword.subtitle')}
        onBack={closePasswordForm}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SectionTitle>{t('settings.changePassword.subtitle').toUpperCase()}</SectionTitle>
          <Card>
            <Text style={styles.inputLabel}>{t('settings.changePassword.current')}</Text>
            <TextInput style={styles.input} value={currentPass} onChangeText={setCurrentPass} placeholder={t('settings.changePassword.placeholder.current')} placeholderTextColor={adminColors.placeholder} secureTextEntry />
            <Text style={styles.inputLabel}>{t('settings.changePassword.new')}</Text>
            <TextInput style={styles.input} value={newPass} onChangeText={setNewPass} placeholder={t('settings.changePassword.placeholder.new', { min: NEW_PASSWORD_MIN_LENGTH })} placeholderTextColor={adminColors.placeholder} secureTextEntry />
            <Text style={styles.inputLabel}>{t('settings.changePassword.confirm')}</Text>
            <TextInput style={styles.input} value={confirmPass} onChangeText={setConfirmPass} placeholder={t('settings.changePassword.placeholder.confirm')} placeholderTextColor={adminColors.placeholder} secureTextEntry />
            {change.error !== null && change.error !== undefined ? (
              <View style={localStyles.formNote}>
                <InfoNote tone="danger">{t(passwordChangeErrorKey(change.error))}</InfoNote>
              </View>
            ) : null}
            <View style={styles.formActions}>
              <WalletButton label={t('settings.changePassword.cancel')} variant="neutral" flex onPress={closePasswordForm} disabled={change.isPending} />
              <WalletButton
                label={change.isPending ? t('profile.password.updating') : t('settings.changePassword.update')}
                flex
                onPress={handleUpdatePassword}
                disabled={change.isPending}
              />
            </View>
            <View style={localStyles.formNote}>
              <InfoNote tone="info">{t('profile.password.signOutNote')}</InfoNote>
            </View>
          </Card>
        </ScrollView>
      </WalletScreen>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Go back">
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <SettingsGearIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>{t('settings.title')}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, localStyles.scrollPad]} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>{t('settings.section.account')}</Text>
        <View style={styles.menuCard}>
          <>
            <SettingsMenuRow
              icon={<UserIcon size={20} color={adminColors.brand} />}
              title={t('settings.row.profile')}
              subtitle={t('settings.row.profile.sub')}
              onPress={onNavigateProfile ?? (() => Alert.alert(t('tohfaHome.notAvailable.title'), t('tohfaHome.notAvailable.body')))}
            />
            <View style={styles.menuDivider} />
          </>
          <SettingsMenuRow icon={<BellIcon size={20} color={adminColors.brand} />} title={t('settings.row.notifications')} subtitle={t('settings.row.notifications.sub')} onPress={() => setView('notifications')} />
        </View>

        <Text style={styles.sectionHeader}>{t('settings.section.security')}</Text>
        <View style={styles.menuCard}>
          <SettingsMenuRow icon={<ShieldIcon size={20} color={adminColors.brand} />} title={t('settings.row.security')} subtitle={t('settings.row.security.sub')} onPress={() => setView('security')} />
          <View style={styles.menuDivider} />
          <SettingsMenuRow icon={<KeyIcon size={20} color={adminColors.brand} />} title={t('settings.row.changePassword')} subtitle={t('settings.row.changePassword.sub')} onPress={() => setView('changePassword')} />
          <View style={styles.menuDivider} />
          <SettingsMenuRow icon={<DeviceIcon size={20} color={adminColors.brand} />} title={t('settings.row.session')} subtitle={t('settings.row.session.sub')} onPress={() => setView('sessionSecurity')} />
        </View>

        <Text style={styles.sectionHeader}>{t('settings.section.support')}</Text>
        <View style={styles.menuCard}>
          <SettingsMenuRow icon={<HelpCircleIcon size={20} color={adminColors.brand} />} title={t('settings.row.help')} subtitle={t('settings.row.help.sub')} onPress={() => setView('helpSupport')} />
        </View>

        <Text style={styles.sectionHeader}>{t('settings.section.about')}</Text>
        <View style={styles.menuCard}>
          <SettingsMenuRow icon={<AboutIcon size={20} color={adminColors.brand} />} title={t('settings.row.about')} subtitle={t('settings.row.about.sub')} onPress={() => setView('about')} />
        </View>

        <View style={localStyles.spacer} />
        <View style={styles.menuCard}>
          <SettingsMenuRow icon={<LogoutIcon size={20} color={adminColors.danger.text} />} title={t('settings.row.logout')} danger onPress={() => setShowLogout(true)} />
        </View>
        <View style={localStyles.bottomPad} />
      </ScrollView>

      <ConfirmDialog
        visible={showLogout}
        title={t('settings.logout.title')}
        message={t('settings.logout.message')}
        confirmLabel={t('settings.logout.confirm')}
        destructive
        icon={<LogoutIcon />}
        onConfirm={() => { setShowLogout(false); onSignOut?.(); }}
        onCancel={() => setShowLogout(false)}
      />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  scrollPad: { paddingBottom: 0 },
  spacer: { height: 16 },
  bottomPad: { height: 32 },
  formNote: { marginTop: adminSpacing.md },
});
