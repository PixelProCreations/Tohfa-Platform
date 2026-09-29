import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

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

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SettingsSubScreen =
  | 'dashboard' // M16-S01
  | 'profile' // M16-S02
  | 'security' // M16-S03
  | 'change_password' // M16-S04
  | 'session_security' // M16-S05
  | 'help_support' // M16-S06
  | 'about'; // M16-S07

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

function UserIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ShieldLockIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="9" y="10" width="6" height="5" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M10 10V8a2 2 0 0 1 4 0v2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function BellIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HelpCircleIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoIcon({ color = PALETTE.primary }: { color?: string }) {
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

export interface SubWarehouseSettingsScreenProps {
  onBack?: (() => void) | undefined;
  onLogout?: (() => void) | undefined;
}

export function SubWarehouseSettingsScreen({ onBack, onLogout }: SubWarehouseSettingsScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<SettingsSubScreen>('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Notification toggles
  const [notifReceiving, setNotifReceiving] = useState(true);
  const [notifSales, setNotifSales] = useState(true);
  const [notifStock, setNotifStock] = useState(true);
  const [notifFinance, setNotifFinance] = useState(false);

  // Password change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

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
          setCurrentScreen('security');
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

  // ─── Subscreen: M16-S02 My Profile ──────────────────────────────────────────
  if (currentScreen === 'profile') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('dashboard')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>My Profile</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileAvatarCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>RK</Text>
            </View>
            <Text style={styles.profileName}>Rajesh Kannan</Text>
            <Text style={styles.profileRole}>Sub-Warehouse Administrator</Text>
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedText}>Active · Verified</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Employee ID</Text>
              <Text style={styles.infoVal}>EMP-SW-0842</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Warehouse</Text>
              <Text style={styles.infoVal}>Coonoor Warehouse (SW-04)</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoVal}>+91 98765 43210</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoVal}>rajesh.k@tohfa.ag</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <Text style={[styles.infoVal, { color: PALETTE.greenText }]}>Active</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Login</Text>
              <Text style={styles.infoVal}>Today · 08:30 AM (IST)</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Subscreen: M16-S03 Security ───────────────────────────────────────────
  if (currentScreen === 'security') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('dashboard')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Security</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentScreen('change_password')} activeOpacity={0.75}>
              <View style={styles.menuLeft}>
                <Text style={styles.menuTitle}>Change Password</Text>
                <Text style={styles.menuSub}>Last changed 45 days ago</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentScreen('session_security')} activeOpacity={0.75}>
              <View style={styles.menuLeft}>
                <Text style={styles.menuTitle}>Session & Device Security</Text>
                <Text style={styles.menuSub}>1 active session on Android</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Subscreen: M16-S04 Change Password ─────────────────────────────────────
  if (currentScreen === 'change_password') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('security')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Change Password</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
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
              placeholder="Enter new password (min 6 chars)"
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
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCurrentScreen('security')} activeOpacity={0.75}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleUpdatePassword} activeOpacity={0.8}>
                <Text style={styles.submitBtnText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Subscreen: M16-S05 Session & Security ──────────────────────────────────
  if (currentScreen === 'session_security') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('security')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Session & Security</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoCard}>
            <Text style={styles.cardHeaderTitle}>Current Active Session</Text>
            <View style={styles.sessionBox}>
              <Text style={styles.sessionDevice}>Pixel 8 · Android 14</Text>
              <Text style={styles.sessionDetails}>TOHFA Sub Warehouse Admin v2.4.1</Text>
              <Text style={styles.sessionIp}>IP: 106.51.72.18 · Coonoor, Nilgiris</Text>
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>Active Now</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Subscreen: M16-S06 Help & Support ─────────────────────────────────────
  if (currentScreen === 'help_support') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('dashboard')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Help & Support</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoCard}>
            <Text style={styles.cardHeaderTitle}>Contact Support</Text>
            <Text style={styles.supportDesc}>
              Our technical and warehouse support desk is active 24/7 for sub-warehouse operations.
            </Text>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => Alert.alert('Support Hotline', 'Calling Toll-free 1800-TOHFA-AG (1800-864-3224)...')}
              activeOpacity={0.75}
            >
              <Text style={styles.contactBtnText}>📞 Call Toll-Free: 1800-TOHFA-AG</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: '#F3F4F6' }]}
              onPress={() => Alert.alert('Support Email', 'Opening mail to support@tohfa.ag...')}
              activeOpacity={0.75}
            >
              <Text style={[styles.contactBtnText, { color: PALETTE.textInk }]}>✉️ Email: support@tohfa.ag</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardHeaderTitle}>Frequently Asked Questions</Text>
            <TouchableOpacity
              style={styles.faqRow}
              onPress={() => Alert.alert('Receiving QC', 'If a batch fails inspection, log the defect in Module 2 (Receiving QC) and select return or price markdown.')}
              activeOpacity={0.7}
            >
              <Text style={styles.faqQ}>How to handle produce QC rejection?</Text>
              <ChevronRightIcon />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.faqRow}
              onPress={() => Alert.alert('Cash Reconciliation', 'Reconcile cashier cash deposits under Module 8 (Wallet & Cash Top-Up) before closing the day.')}
              activeOpacity={0.7}
            >
              <Text style={styles.faqQ}>How to reconcile daily cash deposits?</Text>
              <ChevronRightIcon />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Subscreen: M16-S07 About TOHFA ────────────────────────────────────────
  if (currentScreen === 'about') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('dashboard')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>About TOHFA</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.aboutCard}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>🌱 TOHFA</Text>
            </View>
            <Text style={styles.appName}>TOHFA Sub Warehouse Admin</Text>
            <Text style={styles.appVersion}>Version 2.4.1 (Build 2026.09)</Text>
            <Text style={styles.appDesc}>
              Agricultural Produce Supply Chain & Warehouse Intelligence Platform.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <TouchableOpacity style={styles.infoRow} onPress={() => Alert.alert('Privacy Policy', 'TOHFA complies with agricultural data privacy regulations.')} activeOpacity={0.7}>
              <Text style={styles.infoLabel}>Privacy Policy</Text>
              <ChevronRightIcon />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.infoRow} onPress={() => Alert.alert('Terms of Service', 'Standard enterprise warehouse license agreement applies.')} activeOpacity={0.7}>
              <Text style={styles.infoLabel}>Terms of Service</Text>
              <ChevronRightIcon />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Default: M16-S01 Settings Dashboard ────────────────────────────────────
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
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.headerSubtitle}>Module 16 · App Preferences & Account Configuration</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Account */}
        <Text style={styles.sectionHeading}>Account</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentScreen('profile')} activeOpacity={0.75}>
            <View style={styles.iconBox}>
              <UserIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>My Profile</Text>
              <Text style={styles.menuSub}>Rajesh Kannan · EMP-SW-0842</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentScreen('security')} activeOpacity={0.75}>
            <View style={styles.iconBox}>
              <ShieldLockIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>Security</Text>
              <Text style={styles.menuSub}>Password & session management</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>

        {/* Section 2: Notifications */}
        <Text style={styles.sectionHeading}>Notification Preferences</Text>
        <View style={styles.menuCard}>
          <View style={styles.switchRow}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>Receiving Alerts</Text>
              <Text style={styles.menuSub}>QC rejections & farmer dispatch updates</Text>
            </View>
            <Switch
              value={notifReceiving}
              onValueChange={setNotifReceiving}
              trackColor={{ false: '#D1D5DB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>Sales & Orders</Text>
              <Text style={styles.menuSub}>New HORECA/B2B orders & payments</Text>
            </View>
            <Switch
              value={notifSales}
              onValueChange={setNotifSales}
              trackColor={{ false: '#D1D5DB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>Low Stock Warnings</Text>
              <Text style={styles.menuSub}>Crate thresholds & spoilage reminders</Text>
            </View>
            <Switch
              value={notifStock}
              onValueChange={setNotifStock}
              trackColor={{ false: '#D1D5DB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 3: Support */}
        <Text style={styles.sectionHeading}>Support & About</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentScreen('help_support')} activeOpacity={0.75}>
            <View style={styles.iconBox}>
              <HelpCircleIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>Help & Support</Text>
              <Text style={styles.menuSub}>FAQs, hotline & issue reporting</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentScreen('about')} activeOpacity={0.75}>
            <View style={styles.iconBox}>
              <InfoIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>About TOHFA</Text>
              <Text style={styles.menuSub}>Version 2.4.1 (Build 2026.09)</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>

        {/* Section 4: Account Actions */}
        <Text style={styles.sectionHeading}>Account Actions</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => setShowLogoutModal(true)} activeOpacity={0.75}>
            <View style={[styles.iconBox, { backgroundColor: PALETTE.redBg }]}>
              <LogoutIcon />
            </View>
            <View style={styles.menuLeft}>
              <Text style={[styles.menuTitle, { color: PALETTE.redText }]}>Logout</Text>
              <Text style={styles.menuSub}>Sign out of Coonoor Warehouse terminal</Text>
            </View>
            <ChevronRightIcon color={PALETTE.redText} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ─── M16-S08 Logout Confirmation Modal ─── */}
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
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
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: '500',
    marginTop: 2,
    marginLeft: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.primaryLight,
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
  },
  menuSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginLeft: 68,
  },
  profileAvatarCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 19,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  verifiedPill: {
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.greenText,
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
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
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
  supportDesc: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  contactBtn: {
    backgroundColor: PALETTE.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  faqQ: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
    flex: 1,
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
    fontSize: 12,
    color: PALETTE.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  logoutIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
    marginBottom: 20,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
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
