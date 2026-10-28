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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

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

// Bottom Tab Navigation Icons (matching TOHFA Admin 5 Tabs)
function TabHomeIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabWorkQueueIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 6h13M8 12h13M8 18h13M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabInventoryIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="m3.3 7 8.7 5 8.7-5M12 22V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabFinanceIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="2" />
      <Line x1="6" y1="12" x2="6.01" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="18" y1="12" x2="18.01" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TabMoreIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
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

export interface TohfaAdminSettingsScreenProps {
  can?: PermissionCheck;
  onBack: () => void;
  onNavigateProfile: () => void;
  onNavigateHome: () => void;
  onNavigateWorkQueue?: () => void;
  onNavigateInventory?: () => void;
  onNavigateFinance?: () => void;
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

export function TohfaAdminSettingsScreen({
  can,
  onBack,
  onNavigateProfile,
  onNavigateHome,
  onNavigateWorkQueue,
  onNavigateInventory,
  onNavigateFinance,
  onNavigateMore,
  onLogout,
}: TohfaAdminSettingsScreenProps) {
  const [view, setView] = useState<InnerSettingsView>('hub');
  const [showLogout, setShowLogout] = useState(false);

  const defaultCan: PermissionCheck = () => true;
  const effectiveCan = can ?? defaultCan;

  // Change Password Form State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const tohfaScope = {
    warehouseId: undefined,
    warehouseName: 'All Warehouses',
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
        scope={tohfaScope}
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
        scope={tohfaScope}
        can={effectiveCan}
        onBack={() => setView('hub')}
        onLogout={onLogout}
      />
    );
  }

  if (view === 'helpSupport') {
    return (
      <HelpSupportScreen
        scope={tohfaScope}
        can={effectiveCan}
        onBack={() => setView('hub')}
      />
    );
  }

  if (view === 'about') {
    return (
      <AboutScreen
        scope={tohfaScope}
        can={effectiveCan}
        onBack={() => setView('hub')}
      />
    );
  }

  if (view === 'notifications') {
    return (
      <NotificationSettingsScreen
        scope={tohfaScope}
        can={effectiveCan}
        onBack={() => setView('hub')}
      />
    );
  }

  if (view === 'changePassword') {
    return (
      <WalletScreen title="Change Password" subtitle="TOHFA Admin · All Warehouses" onBack={() => setView('hub')}>
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

  // ─── Main Hub View (Matching Farmer Admin Settings) ─────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header: Brand Orange with gear icon & "Settings" */}
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

      {/* Bottom Tab Bar for TOHFA Admin (Home, Work Queue, Inventory, Finance, More) */}
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
            if (onNavigateWorkQueue) onNavigateWorkQueue();
            else onBack();
          }}
          accessibilityRole="tab"
          accessibilityLabel="Work Queue"
        >
          <TabWorkQueueIcon active={false} />
          <Text style={styles.tabLabel}>Work Queue</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onNavigateInventory) onNavigateInventory();
            else onBack();
          }}
          accessibilityRole="tab"
          accessibilityLabel="Inventory"
        >
          <TabInventoryIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onNavigateFinance) onNavigateFinance();
            else onBack();
          }}
          accessibilityRole="tab"
          accessibilityLabel="Finance"
        >
          <TabFinanceIcon active={false} />
          <Text style={styles.tabLabel}>Finance</Text>
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
        message="Are you sure you want to sign out of your TOHFA Admin account?"
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

// ─── Stylesheet ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 22,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
  },
  sectionHeader: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: adminSpacing.xs,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    marginBottom: adminSpacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 14,
  },
  menuDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginLeft: 56,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconChipDanger: {
    backgroundColor: adminColors.danger.bg,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  menuTitleDanger: {
    color: adminColors.danger.text,
  },
  menuSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },

  // Inline Change Password Form
  inputLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.md,
    ...adminType.body,
    color: adminColors.ink,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },

  // Bottom Tab Bar
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    height: 58,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    ...adminType.caption,
    fontSize: 10,
    fontWeight: '600',
    color: adminColors.muted,
  },
  tabLabelActive: {
    color: adminColors.brand,
    fontWeight: '800',
  },
});
