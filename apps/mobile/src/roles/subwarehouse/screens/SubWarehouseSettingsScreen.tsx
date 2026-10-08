import React, { useState } from 'react';
import {
  Alert,
  Modal,
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
import { SubWarehouseUserProfileScreen } from './SubWarehouseUserProfileScreen';
import { SubWarehouseNotificationSettingsScreen } from './SubWarehouseNotificationSettingsScreen';
import { SubWarehouseSecurityScreen } from './SubWarehouseSecurityScreen';
import { SubWarehouseHelpSupportScreen } from './SubWarehouseHelpSupportScreen';
import { SubWarehouseSessionSecurityScreen } from './SubWarehouseSessionSecurityScreen';
import { SubWarehouseAboutScreen } from './SubWarehouseAboutScreen';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F3EFEA',

  amberText:     '#B45309',
  greenText:     '#15803D',
  greenBg:       '#DCFCE7',
  redText:       '#DC2626',
  redBg:         '#FEE2E2',

  iconBoxBg:     '#FBF1EA',
  iconColor:     '#8B5E3C',

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SettingsSubScreen =
  | 'dashboard' // Main Settings List
  | 'profile' // Profile Screen
  | 'notifications' // Notification Settings
  | 'security' // Security Screen
  | 'change_password' // Change Password
  | 'session_security' // Session & Security
  | 'help_support' // Help & Support
  | 'about'; // About TOHFA

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function SettingsGearIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2.2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserIcon({ color = PALETTE.iconColor }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function BellIcon({ color = PALETTE.iconColor }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldSecurityIcon({ color = PALETTE.iconColor }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function KeyPasswordIcon({ color = PALETTE.iconColor }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="4" stroke={color} strokeWidth="2" />
      <Circle cx="7" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="17" cy="12" r="1.5" fill={color} />
    </Svg>
  );
}

function DeviceSessionIcon({ color = PALETTE.iconColor }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="13" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M5 18h7M8.5 14v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="15" y="8" width="7" height="11" rx="1.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function HelpCircleIcon({ color = PALETTE.iconColor }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoIcon({ color = PALETTE.iconColor }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LogoutIcon({ color = '#DC2626' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
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

export interface SubWarehouseSettingsScreenProps {
  onBack?: (() => void) | undefined;
  onLogout?: (() => void) | undefined;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
}

export function SubWarehouseSettingsScreen({ onBack, onLogout, onTabChange }: SubWarehouseSettingsScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<SettingsSubScreen>('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Password change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleTabPress = (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => {
    if (tab === 'More') {
      setCurrentScreen('dashboard');
    } else if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleUpdatePassword = () => {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert('Validation Error', 'Please fill in all password fields.');
      return;
    }
    if (newPass.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Password Mismatch', 'New password and confirm password do not match.');
      return;
    }

    Alert.alert('Success', 'Your password has been changed successfully.', [
      {
        text: 'OK',
        onPress: () => {
          setCurrentPass('');
          setNewPass('');
          setConfirmPass('');
          setCurrentScreen('dashboard');
        },
      },
    ]);
  };

  const handlePerformLogout = () => {
    setShowLogoutModal(false);
    if (onLogout) {
      onLogout();
    } else {
      Alert.alert('Logged Out', 'You have been logged out from Sub Warehouse Admin.');
    }
  };

  // ─── Subscreen: Profile ───────────────────────────────────────────────────
  if (currentScreen === 'profile') {
    return (
      <SubWarehouseUserProfileScreen
        onBack={() => setCurrentScreen('dashboard')}
        {...(onTabChange ? { onTabChange } : {})}
      />
    );
  }

  // ─── Subscreen: Notifications ─────────────────────────────────────────────
  if (currentScreen === 'notifications') {
    return (
      <SubWarehouseNotificationSettingsScreen
        onBack={() => setCurrentScreen('dashboard')}
        {...(onTabChange ? { onTabChange } : {})}
      />
    );
  }

  // ─── Subscreen: Help & Support ────────────────────────────────────────────
  if (currentScreen === 'help_support') {
    return (
      <SubWarehouseHelpSupportScreen
        onBack={() => setCurrentScreen('dashboard')}
        {...(onTabChange ? { onTabChange } : {})}
      />
    );
  }

  // ─── Subscreen: Security ──────────────────────────────────────────────────
  if (currentScreen === 'security') {
    return (
      <SubWarehouseSecurityScreen
        onBack={() => setCurrentScreen('dashboard')}
        onChangePassword={() => setCurrentScreen('change_password')}
        onViewSessionSecurity={() => setCurrentScreen('session_security')}
        {...(onTabChange ? { onTabChange } : {})}
      />
    );
  }

  // ─── Subscreen: Change Password ───────────────────────────────────────────
  if (currentScreen === 'change_password') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentScreen('dashboard')}
              activeOpacity={0.75}
            >
              <ArrowBackIcon size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Change Password</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionHeading}>UPDATE CREDENTIALS</Text>
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.inputField}
              value={currentPass}
              onChangeText={setCurrentPass}
              placeholder="Enter current password"
              secureTextEntry
              placeholderTextColor={PALETTE.textMuted}
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.inputField}
              value={newPass}
              onChangeText={setNewPass}
              placeholder="Enter new password (min 6 characters)"
              secureTextEntry
              placeholderTextColor={PALETTE.textMuted}
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.inputField}
              value={confirmPass}
              onChangeText={setConfirmPass}
              placeholder="Re-enter new password"
              secureTextEntry
              placeholderTextColor={PALETTE.textMuted}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCurrentScreen('dashboard')}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleUpdatePassword}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

      </SafeAreaView>
    );
  }

  // ─── Subscreen: Session & Security ────────────────────────────────────────
  if (currentScreen === 'session_security') {
    return (
      <SubWarehouseSessionSecurityScreen
        onBack={() => setCurrentScreen('dashboard')}
        onLogout={onLogout}
        {...(onTabChange ? { onTabChange } : {})}
      />
    );
  }

  // ─── Subscreen: About TOHFA ───────────────────────────────────────────────
  if (currentScreen === 'about') {
    return (
      <SubWarehouseAboutScreen
        onBack={() => setCurrentScreen('dashboard')}
        {...(onTabChange ? { onTabChange } : {})}
      />
    );
  }

  // ─── Main Settings Dashboard (Landing) ────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.75}>
              <ArrowBackIcon size={22} />
            </TouchableOpacity>
          )}
          <View style={styles.headerTitleRow}>
            <SettingsGearIcon size={22} />
            <Text style={styles.headerTitleText}>Settings</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: ACCOUNT */}
        <Text style={styles.sectionHeading}>ACCOUNT</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentScreen('profile')} activeOpacity={0.75}>
            <View style={styles.iconBox}>
              <UserIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>Profile</Text>
              <Text style={styles.menuSub}>Personal account information</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentScreen('notifications')} activeOpacity={0.75}>
            <View style={styles.iconBox}>
              <BellIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>Notification Settings</Text>
              <Text style={styles.menuSub}>Manage your notifications</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>

        {/* Section 2: SECURITY */}
        <Text style={styles.sectionHeading}>SECURITY</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentScreen('security')} activeOpacity={0.75}>
            <View style={styles.iconBox}>
              <ShieldSecurityIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>Security</Text>
              <Text style={styles.menuSub}>Password & login security</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentScreen('change_password')} activeOpacity={0.75}>
            <View style={styles.iconBox}>
              <KeyPasswordIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>Change Password</Text>
              <Text style={styles.menuSub}>Update your password</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentScreen('session_security')} activeOpacity={0.75}>
            <View style={styles.iconBox}>
              <DeviceSessionIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>Session & Security</Text>
              <Text style={styles.menuSub}>Login history & current session</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>

        {/* Section 3: SUPPORT */}
        <Text style={styles.sectionHeading}>SUPPORT</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentScreen('help_support')} activeOpacity={0.75}>
            <View style={styles.iconBox}>
              <HelpCircleIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>Help & Support</Text>
              <Text style={styles.menuSub}>Get help or contact support</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>

        {/* Section 4: ABOUT */}
        <Text style={styles.sectionHeading}>ABOUT</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentScreen('about')} activeOpacity={0.75}>
            <View style={styles.iconBox}>
              <InfoIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>About TOHFA</Text>
              <Text style={styles.menuSub}>App information & legal</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>

        {/* Section 5: LOGOUT */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => setShowLogoutModal(true)} activeOpacity={0.75}>
            <View style={[styles.iconBox, { backgroundColor: PALETTE.redBg }]}>
              <LogoutIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={[styles.menuTitle, { color: PALETTE.redText, fontWeight: '700' }]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>


      {/* ─── Logout Confirmation Modal ─── */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.logoutIconCircle}>
              <LogoutIcon color="#DC2626" />
            </View>
            <Text style={styles.modalTitle}>Logout?</Text>
            <Text style={styles.modalDesc}>Are you sure you want to logout from Sub Warehouse Admin?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowLogoutModal(false)} activeOpacity={0.75}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalLogoutBtn} onPress={handlePerformLogout} activeOpacity={0.8}>
                <Text style={styles.modalLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#8B5E3C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: PALETTE.iconBoxBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLeft: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginLeft: 72,
  },
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  sessionBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessionDevice: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  sessionDetails: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  sessionIp: {
    fontSize: 11,
    color: PALETTE.textMuted,
    marginTop: 4,
  },
  activeTag: {
    alignSelf: 'flex-start',
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 8,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  formCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 6,
    marginTop: 10,
  },
  inputField: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: PALETTE.textInk,
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  submitBtn: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aboutCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: PALETTE.primaryLight,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.primary,
  },
  appName: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  appVersion: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  appDesc: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 60,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  logoutIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  modalLogoutBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  modalLogoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
