import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import { Card, SectionTitle, WalletButton, WalletScreen } from '../warehouse/wallet-cashtopup/WalletParts';
import {
  AboutIcon,
  BellIcon,
  ConfirmDialog,
  DeviceIcon,
  HelpCircleIcon,
  KeyIcon,
  LogoutIcon,
  PASSWORD_MIN_LENGTH,
  ShieldIcon,
  UserIcon,
} from '../warehouse/profile-settings/ProfileParts';
import { SecurityScreen } from '../warehouse/profile-settings/SecurityScreen';
import { SessionSecurityScreen } from '../warehouse/profile-settings/SessionSecurityScreen';
import { HelpSupportScreen } from '../warehouse/profile-settings/HelpSupportScreen';
import { AboutScreen } from '../warehouse/profile-settings/AboutScreen';
import { NotificationSettingsScreen } from '../warehouse/profile-settings/NotificationSettingsScreen';
import type { PermissionCheck } from '../warehouse/profile-settings/types';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function TabHomeIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabMoreIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="10.2" y="4" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="16.4" y="4" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="4" y="10.2" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="10.2" y="10.2" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="16.4" y="10.2" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="4" y="16.4" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="10.2" y="16.4" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="16.4" y="16.4" width="3.6" height="3.6" rx="1" fill={color} />
    </Svg>
  );
}

// ─── Settings Row Component ─────────────────────────────────────────────────

interface SettingsMenuRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}

function SettingsMenuRow({ icon, title, subtitle, onPress, danger = false }: SettingsMenuRowProps) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.iconChip, danger && styles.iconChipDanger]}>{icon}</View>
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      {danger ? null : <ChevronRightIcon />}
    </TouchableOpacity>
  );
}

// ─── Component Props ────────────────────────────────────────────────────────

export interface FarmerAdminSettingsScreenProps {
  can?: PermissionCheck;
  onBack: () => void;
  onNavigateProfile: () => void;
  onNavigateHome: () => void;
  onNavigateMore?: () => void;
  onLogout?: () => void;
}

type InnerSettingsView =
  | 'hub'
  | 'changePassword'
  | 'security'
  | 'sessionSecurity'
  | 'helpSupport'
  | 'about'
  | 'notifications';

export function FarmerAdminSettingsScreen({
  can,
  onBack,
  onNavigateProfile,
  onNavigateHome,
  onNavigateMore,
  onLogout,
}: FarmerAdminSettingsScreenProps) {
  const [view, setView] = useState<InnerSettingsView>('hub');
  const [showLogout, setShowLogout] = useState(false);

  const defaultCan: PermissionCheck = () => true;
  const effectiveCan = can ?? defaultCan;

  // Change Password Form State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const farmerScope = {
    warehouseId: 'FR-00100',
    warehouseName: 'Coonoor Zone',
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
      Alert.alert('Validation Error', 'New password must be different from current password.');
      return;
    }
    Alert.alert('Success', 'Your password has been changed successfully.', [
      {
        text: 'OK',
        onPress: () => {
          setCurrentPass('');
          setNewPass('');
          setConfirmPass('');
          setView('hub');
        },
      },
    ]);
  };

  // Subview handlers
  if (view === 'security') {
    return (
      <SecurityScreen
        scope={farmerScope}
        can={effectiveCan}
        onBack={() => setView('hub')}
        onChangePassword={() => setView('changePassword')}
        onViewSessionSecurity={() => setView('sessionSecurity')}
      />
    );
  }

  if (view === 'sessionSecurity') {
    return (
      <SessionSecurityScreen
        scope={farmerScope}
        can={effectiveCan}
        onBack={() => setView('hub')}
        onLogout={onLogout}
      />
    );
  }

  if (view === 'helpSupport') {
    return (
      <HelpSupportScreen
        scope={farmerScope}
        can={effectiveCan}
        onBack={() => setView('hub')}
      />
    );
  }

  if (view === 'about') {
    return (
      <AboutScreen
        scope={farmerScope}
        can={effectiveCan}
        onBack={() => setView('hub')}
      />
    );
  }

  if (view === 'notifications') {
    return (
      <NotificationSettingsScreen
        scope={farmerScope}
        can={effectiveCan}
        onBack={() => setView('hub')}
      />
    );
  }

  if (view === 'changePassword') {
    return (
      <WalletScreen title="Change Password" subtitle="Farmer Admin · Coonoor" onBack={() => setView('hub')}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
              <WalletButton label="Cancel" variant="neutral" flex onPress={() => setView('hub')} />
              <WalletButton label="Update Password" flex onPress={handleUpdatePassword} />
            </View>
          </Card>
        </ScrollView>
      </WalletScreen>
    );
  }

  // ─── Main Hub View (Screenshot 2) ──────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header matching Screenshot 2: Orange background with gear icon & "Settings" */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <SettingsGearIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ACCOUNT Section */}
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <View style={styles.menuCard}>
          <SettingsMenuRow
            icon={<UserIcon size={20} color={adminColors.brand} />}
            title="Profile"
            subtitle="Personal account information"
            onPress={onNavigateProfile}
          />
          <View style={styles.menuDivider} />
          <SettingsMenuRow
            icon={<BellIcon size={20} color={adminColors.brand} />}
            title="Notification Settings"
            subtitle="Manage your notifications"
            onPress={() => setView('notifications')}
          />
        </View>

        {/* SECURITY Section */}
        <Text style={styles.sectionHeader}>SECURITY</Text>
        <View style={styles.menuCard}>
          <SettingsMenuRow
            icon={<ShieldIcon size={20} color={adminColors.brand} />}
            title="Security"
            subtitle="Password & login security"
            onPress={() => setView('security')}
          />
          <View style={styles.menuDivider} />
          <SettingsMenuRow
            icon={<KeyIcon size={20} color={adminColors.brand} />}
            title="Change Password"
            subtitle="Update your password"
            onPress={() => setView('changePassword')}
          />
          <View style={styles.menuDivider} />
          <SettingsMenuRow
            icon={<DeviceIcon size={20} color={adminColors.brand} />}
            title="Session & Security"
            subtitle="Login history & current session"
            onPress={() => setView('sessionSecurity')}
          />
        </View>

        {/* SUPPORT Section */}
        <Text style={styles.sectionHeader}>SUPPORT</Text>
        <View style={styles.menuCard}>
          <SettingsMenuRow
            icon={<HelpCircleIcon size={20} color={adminColors.brand} />}
            title="Help & Support"
            subtitle="Get help or contact support"
            onPress={() => setView('helpSupport')}
          />
        </View>

        {/* ABOUT Section */}
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <View style={styles.menuCard}>
          <SettingsMenuRow
            icon={<AboutIcon size={20} color={adminColors.brand} />}
            title="About TOHFA"
            subtitle="App information & legal"
            onPress={() => setView('about')}
          />
        </View>

        <View style={{ height: 16 }} />

        {/* LOGOUT Card */}
        <View style={styles.menuCard}>
          <SettingsMenuRow
            icon={<LogoutIcon size={20} color={adminColors.danger.text} />}
            title="Logout"
            danger
            onPress={() => setShowLogout(true)}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Bottom Tab Bar matching Screenshot 2 (Home, More) */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={onNavigateHome}
          accessibilityRole="tab"
          accessibilityLabel="Home"
        >
          <TabHomeIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onNavigateMore) onNavigateMore();
            else onBack();
          }}
          accessibilityRole="tab"
          accessibilityLabel="More"
        >
          <TabMoreIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </Pressable>
      </View>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={showLogout}
        title="Logout?"
        message="Are you sure you want to sign out of your Farmer Admin account?"
        confirmLabel="Logout"
        destructive
        icon={<LogoutIcon />}
        onConfirm={() => {
          setShowLogout(false);
          if (onLogout) onLogout();
        }}
        onCancel={() => setShowLogout(false)}
      />
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginLeft: 66,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipDanger: {
    backgroundColor: adminColors.danger.bg,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  menuTitleDanger: {
    color: adminColors.danger.text,
  },
  menuSubtitle: {
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
  },
  bottomTabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: 3,
  },
  tabLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  inputLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
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
  formActions: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.xl,
  },
});
