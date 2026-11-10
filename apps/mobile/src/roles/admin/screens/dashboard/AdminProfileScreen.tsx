import React, { useEffect, useMemo, useState } from 'react';
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { fetchMe, logout, type UserMe } from '../../../farmer/api/auth';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── SVG Icons (using strictly adminColors) ──────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function ProhibitionIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkCircleIcon({ size = 32, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RadioCheckedIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RadioUncheckedIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 32, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="10" width="16" height="12" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10V7a5 5 0 0 1 10 0v3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="15.5" r="1.5" fill={color} />
      <Line x1="12" y1="17" x2="12" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Custom Pill Switch ──────────────────────────────────────────────────────

interface PillSwitchProps {
  value: boolean;
  onToggle: () => void;
}

function PillSwitch({ value, onToggle }: PillSwitchProps) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={[
        styles.pillSwitchBase,
        value ? styles.pillSwitchOn : styles.pillSwitchOff,
      ]}
    >
      <View
        style={[
          styles.pillSwitchThumb,
          value ? styles.pillSwitchThumbOn : styles.pillSwitchThumbOff,
        ]}
      />
    </TouchableOpacity>
  );
}

// ─── RBAC Role Data Specifications ──────────────────────────────────────────

export type AdminRoleCode = 'SUPER_ADMIN' | 'TOHFA_ADMIN' | 'FARMER_ADMIN' | 'MAIN_WH_ADMIN' | 'SUB_WH_ADMIN';

export interface AdminProfileScreenProps {
  role?: AdminRoleCode | undefined;
  onBack?: (() => void) | undefined;
  onSignOut?: (() => void) | undefined;
  onSwitchRole?: (() => void) | undefined;
  onNavigateCustomers?: (() => void) | undefined;
  onNavigateBillingInvoices?: (() => void) | undefined;
  onNavigateWarehouseOperations?: (() => void) | undefined;
}

interface RoleRbacConfig {
  activeRole: string;
  roleBadge: string;
  idLabel: string;
  idValue: string;
  accountId: string;
  zoneLabel: string;
  zoneValue: string;
  defaultName: string;
  defaultMobile: string;
  defaultEmail: string;
  defaultAddress: string;
  availableRoles: string;
  switchRoleTarget: string;
  switchRoleDesc: string;
}

const ROLE_RBAC_CONFIGS: Record<AdminRoleCode, RoleRbacConfig> = {
  FARMER_ADMIN: {
    activeRole: 'Farmer Admin',
    roleBadge: 'Farmer Admin',
    idLabel: 'Farmer ID',
    idValue: 'FR-00100',
    accountId: 'ACC-000100',
    zoneLabel: 'Zone',
    zoneValue: 'Coonoor',
    defaultName: 'Suresh Kumar',
    defaultMobile: '+91 98765 00100',
    defaultEmail: 'suresh.kumar@example.org',
    defaultAddress: '12 Hill Road, Coonoor, Nilgiris 643101',
    availableRoles: 'Farmer, Farmer Admin',
    switchRoleTarget: 'Farmer',
    switchRoleDesc: 'Personal farm management, produce listings, and crop harvest ledger.',
  },
  TOHFA_ADMIN: {
    activeRole: 'Tohfa Admin',
    roleBadge: 'Platform Operations Admin',
    idLabel: 'Staff ID',
    idValue: 'TOHFA-OP-0012',
    accountId: 'ACC-000012',
    zoneLabel: 'Assigned zone',
    zoneValue: 'Platform Operations',
    defaultName: 'Priya Sundaram',
    defaultMobile: '+91 98000 00002',
    defaultEmail: 'operations@tohfa.test',
    defaultAddress: 'TOHFA Platform Central Hub, Ooty, Nilgiris 643001',
    availableRoles: 'Tohfa Admin, Super Admin',
    switchRoleTarget: 'Super Admin',
    switchRoleDesc: 'Platform governance, financial authorization, and statewide hub administration.',
  },
  SUPER_ADMIN: {
    activeRole: 'Super Admin',
    roleBadge: 'Super Administrator',
    idLabel: 'Staff ID',
    idValue: 'TOHFA-SA-0001',
    accountId: 'ACC-000001',
    zoneLabel: 'Assigned zone',
    zoneValue: 'Statewide Hubs',
    defaultName: 'Rajesh Kumar',
    defaultMobile: '+91 98000 00001',
    defaultEmail: 'superadmin@tohfa.test',
    defaultAddress: 'Executive Secretariat, Agricultural Directorate, Chennai',
    availableRoles: 'Super Admin, Tohfa Admin',
    switchRoleTarget: 'Tohfa Admin',
    switchRoleDesc: 'Daily supply chain operations, order fulfillment, and dispatch routing.',
  },
  MAIN_WH_ADMIN: {
    activeRole: 'Main warehouse admin',
    roleBadge: 'Main Hub Logistics Controller',
    idLabel: 'Farmer ID',
    idValue: 'FR-00100',
    accountId: 'ACC-000100',
    zoneLabel: 'Zone',
    zoneValue: 'All Warehouses',
    defaultName: 'Suresh Kumar',
    defaultMobile: '+91 98765 00100',
    defaultEmail: 'suresh.kumar@example.org',
    defaultAddress: 'Main Warehouse Logistics Hub, Ooty Road, Nilgiris',
    availableRoles: 'Main Warehouse Admin',
    switchRoleTarget: 'Sub Warehouse',
    switchRoleDesc: 'Local receiving and sorting operations.',
  },
  SUB_WH_ADMIN: {
    activeRole: 'Sub warehouse admin',
    roleBadge: 'Sub Warehouse Operations Lead',
    idLabel: 'Farmer ID',
    idValue: 'FR-00100',
    accountId: 'ACC-000100',
    zoneLabel: 'Zone',
    zoneValue: 'Coonoor',
    defaultName: 'Suresh Kumar',
    defaultMobile: '+91 98765 00100',
    defaultEmail: 'suresh.kumar@example.org',
    defaultAddress: 'Coonoor Sub Warehouse, Market Yard, Nilgiris',
    availableRoles: 'Sub Warehouse Admin',
    switchRoleTarget: 'Farmer',
    switchRoleDesc: 'Farmer operations and produce listing.',
  },
};

// ─── Component Implementation ───────────────────────────────────────────────

export function AdminProfileScreen({
  role = 'FARMER_ADMIN',
  onBack,
  onSignOut,
  onSwitchRole,
}: AdminProfileScreenProps): React.JSX.Element {
  const rbac = ROLE_RBAC_CONFIGS[role] ?? ROLE_RBAC_CONFIGS.FARMER_ADMIN;
  const isWarehouseAdmin = role === 'SUB_WH_ADMIN' || role === 'MAIN_WH_ADMIN';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  // Navigation View State
  const [currentView, setCurrentView] = useState<
    'main' | 'edit' | 'confirm_password' | 'success' | 'security' | 'change_password'
  >('main');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // User Profile Data State
  const [fullName, setFullName] = useState(rbac.defaultName);
  const [farmerId] = useState(rbac.idValue);
  const [accountId] = useState(rbac.accountId);
  const [accountStatus] = useState('Active');
  const [activeRole] = useState(rbac.activeRole);
  const [availableRoles] = useState(rbac.availableRoles);
  const [assignedZone] = useState(rbac.zoneValue);
  const [accountCreated] = useState('12 Jun 2024');
  const [lastLogin] = useState('10 Oct 2026, 08:45');
  const [language, setLanguage] = useState<'English' | 'Tamil'>('English');

  // Contact / Editable fields
  const [mobileNumber, setMobileNumber] = useState(rbac.defaultMobile);
  const [emailAddress, setEmailAddress] = useState(rbac.defaultEmail);
  const [address, setAddress] = useState(rbac.defaultAddress);

  // Edit Buffer Fields
  const [editFullName, setEditFullName] = useState(fullName);
  const [editLanguage, setEditLanguage] = useState<'English' | 'Tamil'>('English');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    produceListings: true,
    disputes: false,
    handovers: true,
    community: true,
    farmerRatings: true,
    farmerSupport: true,
  });

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Feedback Toast
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Switch Role Modal
  const [switchRoleModalVisible, setSwitchRoleModalVisible] = useState(false);

  // Fetch real user info if available
  useEffect(() => {
    fetchMe()
      .then((me: UserMe) => {
        if (me) {
          if (me.fullName) setFullName(me.fullName);
          if (me.email) setEmailAddress(me.email);
          if (me.mobile) setMobileNumber(me.mobile);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenEdit = () => {
    setEditFullName(fullName);
    setEditLanguage(language);
    setCurrentView('edit');
  };

  const handleSaveChanges = () => {
    setFullName(editFullName.trim() || fullName);
    setLanguage(editLanguage);
    setCurrentView('success');
  };

  const handleConfirmAndSave = () => {
    setConfirmPasswordInput('');
    setCurrentView('success');
  };

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePreferences = () => {
    setFeedbackToast('Preferences saved successfully');
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleResetPreferences = () => {
    setNotifications({
      produceListings: true,
      disputes: false,
      handovers: true,
      community: true,
      farmerRatings: true,
      farmerSupport: true,
    });
    setFeedbackToast('Preferences reset to defaults');
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const passwordRequirements = useMemo(() => {
    return {
      length: newPassword.length >= 8 && newPassword.length <= 64,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    };
  }, [newPassword]);

  const handleUpdatePassword = () => {
    setPasswordError(null);
    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    const allMet = Object.values(passwordRequirements).every(Boolean);
    if (!allMet) {
      setPasswordError('Please meet all password requirements listed below');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }
    Alert.alert('Success', 'Password updated successfully.', [
      {
        text: 'OK',
        onPress: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setCurrentView('security');
        },
      },
    ]);
  };

  const handleConfirmRoleSwitch = () => {
    setSwitchRoleModalVisible(false);
    if (onSwitchRole) {
      onSwitchRole();
    } else {
      Alert.alert('Role Switch', `Switched to ${rbac.switchRoleTarget}.`);
    }
  };

  const handleSignOutAction = async () => {
    setShowSignOutConfirm(false);
    try {
      await logout();
    } catch {
      // Ignore logout api errors and proceed
    }
    if (onSignOut) {
      onSignOut();
    }
  };

  // Avatar initial letter (e.g. "S" for Suresh)
  const avatarLetter = (fullName.trim()[0] || 'A').toUpperCase();

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: CHANGE PASSWORD SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (currentView === 'change_password') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentView('security')}
              activeOpacity={0.7}
              accessibilityLabel="Back to Security & Preferences"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Security & Preferences</Text>
          </View>
          <Text style={styles.headerSubtitle}>Manage your password, preferences, sessions and role.</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeader}>Account security</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Current Password</Text>
            <View style={styles.textInputBox}>
              <TextInput
                style={styles.textInputField}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>New Password</Text>
            <View style={styles.textInputBox}>
              <TextInput
                style={styles.textInputField}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Confirm New Password</Text>
            <View style={styles.textInputBox}>
              <TextInput
                style={styles.textInputField}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Password requirements</Text>
            <View style={styles.reqItemRow}>
              <Text style={[styles.reqBullet, passwordRequirements.length && styles.reqBulletMet]}>
                {passwordRequirements.length ? '✓' : '•'}
              </Text>
              <Text style={[styles.reqText, passwordRequirements.length && styles.reqTextMet]}>8–64 characters</Text>
            </View>
            <View style={styles.reqItemRow}>
              <Text style={[styles.reqBullet, passwordRequirements.upper && styles.reqBulletMet]}>
                {passwordRequirements.upper ? '✓' : '•'}
              </Text>
              <Text style={[styles.reqText, passwordRequirements.upper && styles.reqTextMet]}>An uppercase letter</Text>
            </View>
            <View style={styles.reqItemRow}>
              <Text style={[styles.reqBullet, passwordRequirements.lower && styles.reqBulletMet]}>
                {passwordRequirements.lower ? '✓' : '•'}
              </Text>
              <Text style={[styles.reqText, passwordRequirements.lower && styles.reqTextMet]}>A lowercase letter</Text>
            </View>
            <View style={styles.reqItemRow}>
              <Text style={[styles.reqBullet, passwordRequirements.number && styles.reqBulletMet]}>
                {passwordRequirements.number ? '✓' : '•'}
              </Text>
              <Text style={[styles.reqText, passwordRequirements.number && styles.reqTextMet]}>A number</Text>
            </View>
            <View style={styles.reqItemRow}>
              <Text style={[styles.reqBullet, passwordRequirements.special && styles.reqBulletMet]}>
                {passwordRequirements.special ? '✓' : '•'}
              </Text>
              <Text style={[styles.reqText, passwordRequirements.special && styles.reqTextMet]}>A special character</Text>
            </View>

            {passwordError ? <Text style={styles.passwordErrorText}>{passwordError}</Text> : null}
          </View>

          <View style={styles.editActionButtonsContainer}>
            <TouchableOpacity style={styles.primarySaveBtn} onPress={handleUpdatePassword} activeOpacity={0.85}>
              <Text style={styles.primarySaveBtnText}>Update Password</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelNeutralBtn} onPress={() => setCurrentView('security')} activeOpacity={0.8}>
              <Text style={styles.cancelNeutralBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: SECURITY & PREFERENCES SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (currentView === 'security') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentView('main')}
              activeOpacity={0.7}
              accessibilityLabel="Back to Profile"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Security & Preferences</Text>
          </View>
          <Text style={styles.headerSubtitle}>Manage your password, preferences, sessions and role.</Text>
        </View>

        {feedbackToast && (
          <View style={styles.feedbackToastBanner}>
            <Text style={styles.feedbackToastText}>{feedbackToast}</Text>
          </View>
        )}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeader}>Account security</Text>
          <TouchableOpacity
            style={styles.changePasswordOutlineBtn}
            onPress={() => setCurrentView('change_password')}
            activeOpacity={0.8}
          >
            <Text style={styles.changePasswordOutlineBtnText}>Change Password</Text>
          </TouchableOpacity>

          <Text style={styles.sectionHeader}>Preferred language</Text>
          <Text style={styles.languageNoticeText}>
            Select your preferred display language. Content that has not been translated will appear in English.
          </Text>

          <View style={styles.card}>
            <TouchableOpacity style={styles.langOptionRow} onPress={() => setLanguage('English')} activeOpacity={0.75}>
              <Text style={[styles.langText, language === 'English' && styles.langTextActive]}>English</Text>
              {language === 'English' ? <RadioCheckedIcon size={20} /> : <RadioUncheckedIcon size={20} />}
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity style={styles.langOptionRow} onPress={() => setLanguage('Tamil')} activeOpacity={0.75}>
              <Text style={[styles.langText, language === 'Tamil' && styles.langTextActive]}>Tamil (தமிழ்)</Text>
              {language === 'Tamil' ? <RadioCheckedIcon size={20} /> : <RadioUncheckedIcon size={20} />}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>Notification preferences</Text>
          <View style={styles.card}>
            <Text style={styles.notificationCardHeader}>Choose which notifications you receive:</Text>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => handleToggleNotification('produceListings')}
              activeOpacity={0.8}
            >
              <PillSwitch value={notifications.produceListings} onToggle={() => handleToggleNotification('produceListings')} />
              <Text style={styles.toggleLabel}>New produce listings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleRow} onPress={() => handleToggleNotification('disputes')} activeOpacity={0.8}>
              <PillSwitch value={notifications.disputes} onToggle={() => handleToggleNotification('disputes')} />
              <Text style={styles.toggleLabel}>Dispute resolution updates</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleRow} onPress={() => handleToggleNotification('handovers')} activeOpacity={0.8}>
              <PillSwitch value={notifications.handovers} onToggle={() => handleToggleNotification('handovers')} />
              <Text style={styles.toggleLabel}>Sub warehouse handovers</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleRow} onPress={() => handleToggleNotification('community')} activeOpacity={0.8}>
              <PillSwitch value={notifications.community} onToggle={() => handleToggleNotification('community')} />
              <Text style={styles.toggleLabel}>Community alerts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => handleToggleNotification('farmerRatings')}
              activeOpacity={0.8}
            >
              <PillSwitch value={notifications.farmerRatings} onToggle={() => handleToggleNotification('farmerRatings')} />
              <Text style={styles.toggleLabel}>Farmer rating changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => handleToggleNotification('farmerSupport')}
              activeOpacity={0.8}
            >
              <PillSwitch value={notifications.farmerSupport} onToggle={() => handleToggleNotification('farmerSupport')} />
              <Text style={styles.toggleLabel}>Farmer support updates</Text>
            </TouchableOpacity>

            <Text style={styles.notificationFooterNotice}>
              These control informational updates only. Notifications that need your action, and security alerts, are always delivered.
            </Text>
          </View>

          <View style={styles.prefActionButtonsRow}>
            <TouchableOpacity style={styles.savePreferencesBtn} onPress={handleSavePreferences} activeOpacity={0.8}>
              <Text style={styles.savePreferencesBtnText}>Save Preferences</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetPreferencesBtn} onPress={handleResetPreferences} activeOpacity={0.8}>
              <Text style={styles.resetPreferencesBtnText}>Reset to Defaults</Text>
            </TouchableOpacity>
          </View>

          {/* Role Selection Card */}
          <View style={styles.card}>
            <Text style={styles.roleNoticeText}>
              Select the role you want to use. Switching refreshes your navigation, dashboard and permissions together. Your {rbac.idLabel} and profile stay the same.
            </Text>

            <View style={styles.roleRadioRow}>
              <RadioCheckedIcon size={20} color={adminColors.brandDeep} />
              <Text style={styles.roleRadioTextBold}>{rbac.activeRole} — Current Role</Text>
            </View>

            <TouchableOpacity
              style={styles.roleRadioRow}
              onPress={() => setSwitchRoleModalVisible(true)}
              activeOpacity={0.7}
            >
              <RadioUncheckedIcon size={20} color={adminColors.muted} />
              <Text style={styles.roleRadioText}>{rbac.switchRoleTarget}</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Out Section */}
          <Text style={styles.sectionHeader}>Sign out</Text>
          <TouchableOpacity
            style={styles.solidSignOutBtn}
            onPress={() => setShowSignOutConfirm(!showSignOutConfirm)}
            activeOpacity={0.85}
          >
            <Text style={styles.solidSignOutBtnText}>Sign Out</Text>
          </TouchableOpacity>

          {showSignOutConfirm && (
            <View style={styles.signOutConfirmCard}>
              <Text style={styles.signOutConfirmTitle}>Sign out of your account?</Text>
              <TouchableOpacity style={styles.signOutConfirmActionBtn} onPress={handleSignOutAction} activeOpacity={0.85}>
                <Text style={styles.signOutConfirmActionBtnText}>Sign Out</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signOutConfirmCancelBtn}
                onPress={() => setShowSignOutConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.signOutConfirmCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: CONFIRM PASSWORD (FOR SENSITIVE CHANGES)
  // ════════════════════════════════════════════════════════════════════════════
  if (currentView === 'confirm_password') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentView('edit')}
              activeOpacity={0.7}
              accessibilityLabel="Back to Edit Profile"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Confirm Password</Text>
          </View>
          <Text style={styles.headerSubtitle}>Manage your personal information and account details.</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          <View style={styles.confirmPasswordCard}>
            <View style={styles.lockIconContainer}>
              <LockIcon size={34} color={adminColors.brand} />
            </View>
            <Text style={styles.confirmPasswordTitle}>Confirm your password</Text>
            <Text style={styles.confirmPasswordSubtitle}>
              For your account security, enter your password to confirm and save your updated information.
            </Text>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Password</Text>
          <View style={styles.textInputBox}>
            <TextInput
              style={styles.textInputField}
              value={confirmPasswordInput}
              onChangeText={setConfirmPasswordInput}
              secureTextEntry
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={{ marginTop: 24, gap: 12 }}>
            <TouchableOpacity style={styles.primarySaveBtn} onPress={handleConfirmAndSave} activeOpacity={0.85}>
              <Text style={styles.primarySaveBtnText}>Confirm and Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelNeutralBtn} onPress={() => setCurrentView('edit')} activeOpacity={0.8}>
              <Text style={styles.cancelNeutralBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: PROFILE UPDATED CONFIRMATION
  // ════════════════════════════════════════════════════════════════════════════
  if (currentView === 'success') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentView('main')}
              activeOpacity={0.7}
              accessibilityLabel="Back to Profile"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile Updated</Text>
          </View>
          <Text style={styles.headerSubtitle}>Your profile has been updated successfully.</Text>
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <CheckmarkCircleIcon size={32} color={adminColors.success.text} />
          </View>
          <Text style={styles.successTitle}>Profile Updated</Text>
          <Text style={styles.successSubtitle}>Your profile information has been saved successfully.</Text>

          <TouchableOpacity style={styles.backToProfileBtn} onPress={() => setCurrentView('main')} activeOpacity={0.85}>
            <Text style={styles.backToProfileBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: EDIT PROFILE SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (currentView === 'edit') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentView('main')}
              activeOpacity={0.7}
              accessibilityLabel="Back to Profile"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>
          <Text style={styles.headerSubtitle}>Update your personal information below.</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {/* Full Name */}
            <Text style={styles.fieldLabel}>
              Full Name <Text style={{ color: adminColors.danger.text }}>*</Text>
            </Text>
            <View style={styles.textInputBox}>
              <TextInput
                style={styles.textInputField}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Enter full name"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            {/* Mobile Number - Locked (BR-83) */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Mobile Number</Text>
            <View style={styles.readOnlyInputBox}>
              <Text style={styles.readOnlyInputText}>{mobileNumber}</Text>
            </View>

            {/* Email Address - Locked (BR-83) */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Email Address</Text>
            <View style={styles.readOnlyInputBox}>
              <Text style={styles.readOnlyInputText}>{emailAddress}</Text>
            </View>

            {/* Language Selection */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Language</Text>
            <View style={styles.editLanguageRow}>
              <TouchableOpacity
                style={[styles.langChip, editLanguage === 'English' && styles.langChipActive]}
                onPress={() => setEditLanguage('English')}
                activeOpacity={0.8}
              >
                <Text style={[styles.langChipText, editLanguage === 'English' && styles.langChipTextActive]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langChip, editLanguage === 'Tamil' && styles.langChipActive]}
                onPress={() => setEditLanguage('Tamil')}
                activeOpacity={0.8}
              >
                <Text style={[styles.langChipText, editLanguage === 'Tamil' && styles.langChipTextActive]}>Tamil</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* BR-83 Locked Notice Card */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeCardText}>
              Your mobile number and email are locked (BR-83). To change them, contact TOHFA support.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.editActionButtonsContainer}>
            <TouchableOpacity style={styles.primarySaveBtn} onPress={handleSaveChanges} activeOpacity={0.85}>
              <Text style={styles.primarySaveBtnText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelNeutralBtn} onPress={() => setCurrentView('main')} activeOpacity={0.8}>
              <Text style={styles.cancelNeutralBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: MAIN "MY PROFILE" SCREEN (Matching media_1793709515420_c492aaeb.png)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Manage your personal information and account details.
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero Card */}
        <View style={styles.card}>
          <View style={styles.profileHeaderTopRow}>
            <View style={styles.avatarCircleLarge}>
              <Text style={styles.avatarInitialLarge}>{avatarLetter}</Text>
            </View>

            <View style={styles.profileNameWrap}>
              <Text style={styles.profileNameText}>{fullName}</Text>
              <Text style={styles.profileIdText}>{farmerId}</Text>
            </View>
          </View>

          <View style={styles.profileTwoColGrid}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>{rbac.idLabel}</Text>
              <Text style={styles.gridValueBold}>{farmerId}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Account status</Text>
              <View style={styles.statusDotRow}>
                <View style={styles.statusDotGreen} />
                <Text style={styles.gridValueBold}>{accountStatus}</Text>
              </View>
            </View>
          </View>

          <View style={styles.profileTwoColGrid}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Active role</Text>
              <Text style={styles.gridValueBold}>{activeRole}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>{rbac.zoneLabel}</Text>
              <Text style={styles.gridValueBold}>{assignedZone}</Text>
            </View>
          </View>

          {/* Edit Profile Outline Button */}
          <TouchableOpacity
            style={styles.editProfileOutlineBtn}
            onPress={handleOpenEdit}
            activeOpacity={0.8}
          >
            <Text style={styles.editProfileOutlineBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: Personal information */}
        <Text style={styles.sectionHeader}>Personal information</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Full name</Text>
            <Text style={styles.infoRowValue}>{fullName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Mobile number</Text>
            <Text style={styles.infoRowValueLocked}>{mobileNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Email address</Text>
            <Text style={styles.infoRowValueLocked}>{emailAddress}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Language</Text>
            <Text style={styles.infoRowValue}>{language}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>{rbac.idLabel}</Text>
            <Text style={styles.infoRowValueLocked}>{farmerId}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Assigned zone</Text>
            <Text style={styles.infoRowValueLocked}>{assignedZone}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoRowLabel}>Account status</Text>
            <Text style={styles.infoRowValueLocked}>{accountStatus}</Text>
          </View>
        </View>

        {/* BR-83 Locked Notice Card */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeCardText}>
            Your mobile number and email are locked (BR-83). To change them, contact TOHFA support.
          </Text>
        </View>

        {/* Section 2: Account information */}
        <Text style={styles.sectionHeader}>Account information</Text>
        <View style={styles.card}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Account ID</Text>
            <Text style={styles.tableValueBold}>{accountId}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{rbac.idLabel}</Text>
            <Text style={styles.tableValueBold}>{farmerId}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Registered mobile</Text>
            <Text style={styles.tableValueBold}>{mobileNumber}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Registered email</Text>
            <Text style={styles.tableValueBold}>{emailAddress}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Account created</Text>
            <Text style={styles.tableValueBold}>{accountCreated}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Current role</Text>
            <Text style={styles.tableValueBold}>{activeRole}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Account status</Text>
            <Text style={styles.tableValueBold}>{accountStatus}</Text>
          </View>

          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.tableLabel}>Last login</Text>
            <Text style={styles.tableValueBold}>{lastLogin}</Text>
          </View>
        </View>

        {/* Section 3: Role information or Activity (for Warehouse Admins) */}
        {isWarehouseAdmin ? (
          <>
            <Text style={styles.sectionHeader}>Activity</Text>
            <View style={styles.activityContainer}>
              <View style={styles.activityRow}>
                <View style={styles.activityDotCol}>
                  <View style={styles.activityDot} />
                  <View style={styles.activityLine} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Profile Created</Text>
                </View>
              </View>

              <View style={styles.activityRow}>
                <View style={styles.activityDotCol}>
                  <View style={styles.activityDot} />
                  <View style={styles.activityLine} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {role === 'MAIN_WH_ADMIN'
                      ? 'Assigned to Main Warehouse'
                      : `Assigned to ${assignedZone}`}
                  </Text>
                </View>
              </View>

              <View style={styles.activityRow}>
                <View style={styles.activityDotCol}>
                  <View style={styles.activityDot} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Attendance Recorded</Text>
                </View>
              </View>
            </View>
          </>
        ) : isSuperAdmin ? null : (
          <>
            <Text style={styles.sectionHeader}>Role information</Text>
            <View style={styles.card}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Current role</Text>
                <Text style={styles.tableValueBold}>{activeRole}</Text>
              </View>

              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.tableLabel}>Available roles</Text>
                <Text style={styles.tableValueBold}>{availableRoles}</Text>
              </View>
            </View>

            {/* Switch Role Button */}
            <TouchableOpacity
              style={styles.switchRoleOutlineBtn}
              onPress={() => setSwitchRoleModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.switchRoleOutlineBtnText}>Switch Role</Text>
            </TouchableOpacity>

            {/* Roles assigned by TOHFA notice card */}
            <View style={styles.prohibitionNoticeCard}>
              <ProhibitionIcon size={18} color={adminColors.muted} />
              <Text style={styles.prohibitionNoticeText}>
                Roles are assigned by TOHFA. You cannot edit your role or give yourself more permissions.
              </Text>
            </View>

            {/* Security & Preferences Button */}
            <TouchableOpacity
              style={styles.securityPreferencesBtn}
              onPress={() => setCurrentView('security')}
              activeOpacity={0.8}
            >
              <Text style={styles.securityPreferencesBtnText}>Security & Preferences</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Switch Role Confirmation Modal */}
      <Modal
        visible={switchRoleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSwitchRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalSheetTitle}>Switch Role</Text>
              <TouchableOpacity onPress={() => setSwitchRoleModalVisible(false)} activeOpacity={0.7}>
                <CloseIcon size={20} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSheetBodyText}>
              Switch to <Text style={{ fontWeight: '800' }}>{rbac.switchRoleTarget}</Text>? Switching refreshes your navigation, dashboard and permissions together. Your {rbac.idLabel} and profile stay the same.
            </Text>

            <View style={styles.roleOptionCardActive}>
              <Text style={styles.roleOptionTitle}>{rbac.switchRoleTarget}</Text>
              <Text style={styles.roleOptionSub}>{rbac.switchRoleDesc}</Text>
            </View>

            <TouchableOpacity
              style={styles.primarySaveBtn}
              onPress={handleConfirmRoleSwitch}
              activeOpacity={0.85}
            >
              <Text style={styles.primarySaveBtnText}>Switch to {rbac.switchRoleTarget}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelNeutralBtn}
              onPress={() => setSwitchRoleModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelNeutralBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES (Strictly conforming to Admin Theme Tokens) ─────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    paddingRight: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    marginRight: 6,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.onBrand,
    opacity: 0.95,
    marginTop: 6,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
  },

  // Toast Banner
  feedbackToastBanner: {
    backgroundColor: adminColors.brandTint,
    paddingVertical: 8,
    paddingHorizontal: adminSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  feedbackToastText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
    textAlign: 'center',
  },

  // Cards
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
  },

  // Profile Header Card
  profileHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircleLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitialLarge: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  profileNameWrap: {
    flex: 1,
  },
  profileNameText: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
  },
  profileIdText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  profileTwoColGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 2,
  },
  gridValueBold: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: adminColors.success.text,
  },
  editProfileOutlineBtn: {
    height: 44,
    borderRadius: adminRadius.full,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    marginTop: 6,
  },
  editProfileOutlineBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brand,
  },

  // Section Headers
  sectionHeader: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 8,
    marginTop: 4,
  },

  // Personal Information Rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  infoRowLabel: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    flex: 1,
  },
  infoRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoRowValue: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
    textAlign: 'right',
  },
  infoRowValueLocked: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.muted,
    textAlign: 'right',
  },
  readOnlyPillBadge: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  readOnlyPillBadgeText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  lockedPillBadge: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  lockedPillBadgeText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  editablePillBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.success.border,
  },
  editablePillBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '700',
  },

  // Controlled Notice Card
  noticeCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  noticeCardText: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 18,
  },

  // Account Information Table
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  tableLabel: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  tableValueBold: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Switch Role & Security Buttons
  switchRoleOutlineBtn: {
    height: 44,
    borderRadius: adminRadius.full,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    marginBottom: 10,
  },
  switchRoleOutlineBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brand,
  },
  prohibitionNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: 10,
  },
  prohibitionNoticeText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  securityPreferencesBtn: {
    height: 44,
    borderRadius: adminRadius.full,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    marginBottom: 16,
  },
  securityPreferencesBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brand,
  },

  // Security & Preferences Screen
  changePasswordOutlineBtn: {
    height: 44,
    borderRadius: adminRadius.full,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    marginBottom: 14,
  },
  changePasswordOutlineBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brand,
  },
  languageNoticeText: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 18,
    marginTop: -4,
    marginBottom: 12,
  },
  langOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  langText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '500',
  },
  langTextActive: {
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  rowDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  notificationCardHeader: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 12,
  },

  // Custom Pill Switch
  pillSwitchBase: {
    width: 38,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    backgroundColor: adminColors.card,
    paddingHorizontal: 2,
    justifyContent: 'center',
    marginRight: 10,
  },
  pillSwitchOn: {
    borderColor: adminColors.success.text,
    alignItems: 'flex-end',
  },
  pillSwitchOff: {
    borderColor: adminColors.muted,
    alignItems: 'flex-start',
  },
  pillSwitchThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  pillSwitchThumbOn: {
    backgroundColor: adminColors.success.text,
  },
  pillSwitchThumbOff: {
    backgroundColor: adminColors.muted,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  toggleLabel: {
    ...adminType.body,
    color: adminColors.ink,
    flex: 1,
  },
  notificationFooterNotice: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 18,
    marginTop: 10,
    fontStyle: 'italic',
  },
  prefActionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: adminSpacing.md,
  },
  savePreferencesBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePreferencesBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  resetPreferencesBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.full,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  resetPreferencesBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  roleNoticeText: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  roleRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  roleRadioTextBold: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  roleRadioText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },

  // Solid Sign Out Button
  solidSignOutBtn: {
    height: 44,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.danger.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  solidSignOutBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  signOutConfirmCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    marginBottom: adminSpacing.md,
    gap: 10,
  },
  signOutConfirmTitle: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
  },
  signOutConfirmActionBtn: {
    height: 40,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.danger.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutConfirmActionBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  signOutConfirmCancelBtn: {
    height: 40,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  signOutConfirmCancelBtnText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.muted,
  },

  // Edit Profile Screen Styles
  fieldLabel: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  textInputBox: {
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  textInputField: {
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },
  readOnlyInputBox: {
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readOnlyInputText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  editLanguageRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  langChip: {
    flex: 1,
    height: 40,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langChipActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  langChipText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  langChipTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
  editActionButtonsContainer: {
    gap: 12,
    marginTop: 8,
  },
  primarySaveBtn: {
    height: 46,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySaveBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  cancelNeutralBtn: {
    height: 46,
    borderRadius: adminRadius.full,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  cancelNeutralBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.muted,
  },

  // Password Requirements
  reqItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  reqBullet: {
    fontSize: 16,
    color: adminColors.muted,
    marginRight: 8,
    fontWeight: '800',
  },
  reqBulletMet: {
    color: adminColors.success.text,
  },
  reqText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  reqTextMet: {
    color: adminColors.success.text,
    fontWeight: '700',
  },
  passwordErrorText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontWeight: '700',
    marginTop: 8,
  },

  // Confirm Password Screen Styles
  confirmPasswordCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
    ...adminShadow.sm,
  },
  lockIconContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmPasswordTitle: {
    ...adminType.sectionHead,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmPasswordSubtitle: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.muted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 6,
  },

  // Success View Styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: adminSpacing.xl,
    paddingTop: 56,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 6,
  },
  successSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  backToProfileBtn: {
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
  backToProfileBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },

  // Switch Role Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalSheetBox: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    gap: 12,
    ...adminShadow.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSheetTitle: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
  },
  modalSheetBodyText: {
    ...adminType.body,
    color: adminColors.ink,
    lineHeight: 20,
  },
  roleOptionCardActive: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
  },
  roleOptionTitle: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  roleOptionSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },

  // Activity Timeline (Warehouse Admins)
  activityContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityDotCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
  },
  activityDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: adminColors.success.text,
  },
  activityLine: {
    width: 2,
    height: 24,
    backgroundColor: adminColors.success.text,
    marginVertical: 3,
  },
  activityContent: {
    flex: 1,
    paddingTop: 0,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    lineHeight: 18,
  },
});
