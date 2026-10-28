import React, { useMemo, useState } from 'react';
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

import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function ResizeHandleIcon({ size = 12, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Line x1="10" y1="4" x2="4" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="11" y1="8" x2="8" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
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

function ChevronDownIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GlobeIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2" />
      <Path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
}

function BellOutlineIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LogOutIcon({ size = 20, color = adminColors.danger.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Interactive Pill Switch (Matching Screenshot 1 & 3) ─────────────────────

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

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerAdminProfileScreenProps {
  onBack?: () => void;
  onSwitchRole?: () => void;
  onSignOut?: () => void;
}

export function FarmerAdminProfileScreen({
  onBack,
  onSwitchRole,
  onSignOut,
}: FarmerAdminProfileScreenProps) {
  // Navigation View State
  const [currentView, setCurrentView] = useState<'main' | 'edit' | 'confirm_password' | 'success' | 'security' | 'change_password'>('main');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // User Profile Data State
  const [fullName, setFullName] = useState('Suresh Kumar');
  const [language, setLanguage] = useState<'English' | 'Tamil'>('English');
  const [farmerId] = useState('FR-00100');
  const [accountId] = useState('ACC-000100');
  const [accountStatus] = useState('Active');
  const [activeRole, setActiveRole] = useState('Farmer Admin');
  const [availableRoles] = useState('Farmer, Farmer Admin');
  const [assignedZone] = useState('Coonoor');
  const [accountCreated] = useState('12 Jun 2024');
  const [lastLogin] = useState('10 Oct 2026, 08:45');
  const [rolePermissions] = useState('Assigned by TOHFA');

  // Contact Info (Locked / Read-only)
  const [mobileNumber, setMobileNumber] = useState('+919876500100');
  const [emailAddress, setEmailAddress] = useState('suresh.kumar@example.org');
  const [address, setAddress] = useState('12 Hill Road, Coonoor, Nilgiris 643101');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Edit Buffer Fields
  const [editName, setEditName] = useState(fullName);
  const [editLanguage, setEditLanguage] = useState<'English' | 'Tamil'>(language);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [editMobile, setEditMobile] = useState(mobileNumber.replace(/\s+/g, ''));
  const [editEmail, setEditEmail] = useState(emailAddress);
  const [editAddress, setEditAddress] = useState(address);
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  // Notification Preferences State (Matching Screenshot 1 & 3)
  const [notifications, setNotifications] = useState({
    produceListings: true,
    disputes: false,
    handovers: true,
    community: true,
    farmerRatings: true,
    farmerSupport: true,
  });

  // Change Password Form State (Matching Screenshot 2)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Toast / Feedback Notices
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Switch Role Confirmation Modal State
  const [switchRoleModalVisible, setSwitchRoleModalVisible] = useState(false);


  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleOpenEdit = () => {
    setEditName(fullName);
    setEditLanguage(language);
    setIsLanguageDropdownOpen(false);
    setCurrentView('edit');
  };

  const handleSaveChanges = () => {
    setFullName(editName.trim() || fullName);
    setLanguage(editLanguage);
    setIsLanguageDropdownOpen(false);
    setFeedbackToast('Profile updated successfully');
    setCurrentView('main');
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleConfirmAndSave = () => {
    setFullName(editName.trim() || fullName);
    setLanguage(editLanguage);
    setMobileNumber(editMobile);
    setEmailAddress(editEmail);
    setAddress(editAddress);
    setConfirmPasswordInput('');
    setCurrentView('success');
  };

  const handleSimulatePhotoUpload = () => {
    Alert.alert('Upload Photo', 'Select image from device storage or camera', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Choose Sample Photo',
        onPress: () => setProfilePhoto('suresh_avatar.jpg'),
      },
    ]);
  };

  // Toggle single notification preference
  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Save Preferences
  const handleSavePreferences = () => {
    setFeedbackToast('Preferences saved successfully');
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  // Reset Preferences to defaults (Screenshot 1 defaults)
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

  // Password validation requirements
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
    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (
      !passwordRequirements.length ||
      !passwordRequirements.upper ||
      !passwordRequirements.lower ||
      !passwordRequirements.number ||
      !passwordRequirements.special
    ) {
      setPasswordError('Please satisfy all password requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordError(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
    setFeedbackToast('Password updated successfully');
    setCurrentView('security');
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleConfirmRoleSwitch = () => {
    setSwitchRoleModalVisible(false);
    setActiveRole('Farmer');
    onSwitchRole?.();
  };

  const handleSignOutConfirm = () => {
    setShowSignOutConfirm(true);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 4: SECURITY & PREFERENCES SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentView === 'security') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Terracotta Header */}
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
            <Text style={styles.headerTitle}>{t('farmerSecurity.title') || 'Security & Preferences'}</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {t('farmerSecurity.subtitle') || 'Manage your password, preferences, sessions and role.'}
          </Text>
        </View>

        {feedbackToast && (
          <View style={styles.feedbackToastBanner}>
            <Text style={styles.feedbackToastText}>{feedbackToast}</Text>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Security Card */}
          <View style={styles.secCard}>
            <View style={styles.secCardHeaderRow}>
              <View style={styles.secIconWrap}>
                <ShieldIcon size={20} color={adminColors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.secCardTitle}>Account Security</Text>
                <Text style={styles.secCardSubtitle}>Password & credential management</Text>
              </View>
            </View>

            {!isChangingPassword ? (
              <TouchableOpacity
                style={styles.changePasswordModernBtn}
                onPress={() => setIsChangingPassword(true)}
                activeOpacity={0.8}
              >
                <LockIcon size={18} color={adminColors.brand} />
                <Text style={styles.changePasswordModernBtnText}>Change Password</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ marginTop: 12 }}>
                {/* Current Password */}
                <Text style={styles.fieldLabel}>Current Password</Text>
                <View style={styles.textInputBox}>
                  <TextInput
                    style={styles.textInputField}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    placeholder="Enter current password"
                    placeholderTextColor={adminColors.placeholder}
                  />
                </View>

                {/* New Password */}
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>New Password</Text>
                <View style={styles.textInputBox}>
                  <TextInput
                    style={styles.textInputField}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    placeholder="Enter new password"
                    placeholderTextColor={adminColors.placeholder}
                  />
                </View>

                {/* Confirm New Password */}
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Confirm New Password</Text>
                <View style={styles.textInputBox}>
                  <TextInput
                    style={styles.textInputField}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholder="Re-enter new password"
                    placeholderTextColor={adminColors.placeholder}
                  />
                </View>

                {/* Password Requirements Checklist */}
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Password requirements</Text>

                <View style={styles.reqItemRow}>
                  <Text style={[styles.reqBullet, passwordRequirements.length && styles.reqBulletMet]}>
                    {passwordRequirements.length ? '✓' : '•'}
                  </Text>
                  <Text style={[styles.reqText, passwordRequirements.length && styles.reqTextMet]}>
                    8–64 characters
                  </Text>
                </View>

                <View style={styles.reqItemRow}>
                  <Text style={[styles.reqBullet, passwordRequirements.upper && styles.reqBulletMet]}>
                    {passwordRequirements.upper ? '✓' : '•'}
                  </Text>
                  <Text style={[styles.reqText, passwordRequirements.upper && styles.reqTextMet]}>
                    An uppercase letter
                  </Text>
                </View>

                <View style={styles.reqItemRow}>
                  <Text style={[styles.reqBullet, passwordRequirements.lower && styles.reqBulletMet]}>
                    {passwordRequirements.lower ? '✓' : '•'}
                  </Text>
                  <Text style={[styles.reqText, passwordRequirements.lower && styles.reqTextMet]}>
                    A lowercase letter
                  </Text>
                </View>

                <View style={styles.reqItemRow}>
                  <Text style={[styles.reqBullet, passwordRequirements.number && styles.reqBulletMet]}>
                    {passwordRequirements.number ? '✓' : '•'}
                  </Text>
                  <Text style={[styles.reqText, passwordRequirements.number && styles.reqTextMet]}>
                    A number
                  </Text>
                </View>

                <View style={styles.reqItemRow}>
                  <Text style={[styles.reqBullet, passwordRequirements.special && styles.reqBulletMet]}>
                    {passwordRequirements.special ? '✓' : '•'}
                  </Text>
                  <Text style={[styles.reqText, passwordRequirements.special && styles.reqTextMet]}>
                    A special character
                  </Text>
                </View>

                {passwordError && (
                  <Text style={styles.passwordErrorText}>{passwordError}</Text>
                )}

                {/* Action Buttons: Update Password and Cancel */}
                <View style={[styles.editActionButtonsContainer, { marginTop: 16, marginBottom: 8 }]}>
                  <TouchableOpacity
                    style={styles.primarySaveBtn}
                    onPress={handleUpdatePassword}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primarySaveBtnText}>Update Password</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelNeutralBtn}
                    onPress={() => {
                      setIsChangingPassword(false);
                      setPasswordError(null);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelNeutralBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Application Preferences Card */}
          <View style={styles.secCard}>
            <View style={styles.secCardHeaderRow}>
              <View style={styles.secIconWrap}>
                <GlobeIcon size={20} color={adminColors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.secCardTitle}>Application Preferences</Text>
                <Text style={styles.secCardSubtitle}>Language and alert configurations</Text>
              </View>
            </View>

            <Text style={styles.secFieldLabel}>Application language</Text>
            <View style={styles.languagePillRow}>
              <TouchableOpacity
                style={[styles.languagePill, language === 'English' && styles.languagePillActive]}
                onPress={() => setLanguage('English')}
                activeOpacity={0.8}
              >
                <Text style={[styles.languagePillText, language === 'English' && styles.languagePillTextActive]}>
                  English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.languagePill, language === 'Tamil' && styles.languagePillActive]}
                onPress={() => setLanguage('Tamil')}
                activeOpacity={0.8}
              >
                <Text style={[styles.languagePillText, language === 'Tamil' && styles.languagePillTextActive]}>
                  Tamil (தமிழ்)
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.languageNoticeText}>
              English and Tamil are available. Change your language from your profile.
            </Text>

            {/* Notification Preferences Sub-Card */}
            <View style={styles.notificationInfoBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <BellOutlineIcon size={16} color={adminColors.brand} />
                <Text style={styles.notificationCardHeader}>Notification preferences</Text>
              </View>
              <Text style={styles.notificationPendingNotice}>
                Notification categories for the Farmer Admin role have not been confirmed yet. They will appear here once the owner finalizes them.
              </Text>
            </View>

            {/* Action Buttons: Save Preferences and Reset to Defaults */}
            <View style={styles.prefActionButtonsRow}>
              <TouchableOpacity
                style={styles.savePreferencesBtn}
                onPress={handleSavePreferences}
                activeOpacity={0.8}
              >
                <Text style={styles.savePreferencesBtnText}>Save Preferences</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetPreferencesBtn}
                onPress={handleResetPreferences}
                activeOpacity={0.8}
              >
                <Text style={styles.resetPreferencesBtnText}>Reset to Defaults</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Out Card */}
          <View style={[styles.secCard, styles.signOutCardBorder]}>
            <View style={styles.secCardHeaderRow}>
              <View style={[styles.secIconWrap, styles.signOutIconWrap]}>
                <LogOutIcon size={20} color={adminColors.danger.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.secCardTitle, { color: adminColors.danger.text }]}>Sign out</Text>
                <Text style={styles.secCardSubtitle}>End your session on this device</Text>
              </View>
            </View>

            {!showSignOutConfirm ? (
              <TouchableOpacity
                style={styles.modernSignOutBtn}
                onPress={handleSignOutConfirm}
                activeOpacity={0.85}
              >
                <LogOutIcon size={18} color={adminColors.card} />
                <Text style={styles.modernSignOutBtnText}>Sign Out of This Device</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.modernSignOutConfirmBox}>
                <Text style={styles.signOutConfirmTitle}>Sign out of your account?</Text>
                <Text style={styles.signOutConfirmSub}>
                  Are you sure you want to sign out? You will need your credentials to sign back in.
                </Text>

                <View style={styles.signOutButtonsRow}>
                  <TouchableOpacity
                    style={styles.signOutConfirmActionBtn}
                    onPress={() => onSignOut?.()}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.signOutConfirmActionBtnText}>Sign Out</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.signOutConfirmCancelBtn}
                    onPress={() => setShowSignOutConfirm(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.signOutConfirmCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ─── SWITCH ROLE CONFIRMATION MODAL ────────────────────────────────── */}
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
                Switch to <Text style={{ fontWeight: '800' }}>Smallholder Farmer</Text>? Switching refreshes your navigation, dashboard and permissions together. Your Farmer ID and profile stay the same.
              </Text>

              <View style={styles.roleOptionCardActive}>
                <Text style={styles.roleOptionTitle}>Smallholder Farmer</Text>
                <Text style={styles.roleOptionSub}>
                  Personal farm management, produce listings, and crop harvest ledger.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primarySaveBtn}
                onPress={handleConfirmRoleSwitch}
                activeOpacity={0.85}
              >
                <Text style={styles.primarySaveBtnText}>Switch to Farmer</Text>
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

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2.5: CONFIRM PASSWORD SCREEN (Image 3)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentView === 'confirm_password') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Terracotta Header */}
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
          <Text style={styles.headerSubtitle}>
            Manage your personal information and account details.
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Card with lock icon, title, subtitle matching Image 3 */}
          <View style={styles.confirmPasswordCard}>
            <View style={styles.lockIconContainer}>
              <LockIcon size={34} color={adminColors.brand} />
            </View>

            <Text style={styles.confirmPasswordTitle}>Confirm your password</Text>
            <Text style={styles.confirmPasswordSubtitle}>
              You are changing your mobile number or email. For your security, enter your password to continue.
            </Text>
          </View>

          {/* Password Input Field */}
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

          {/* Buttons matching Image 3 */}
          <View style={{ marginTop: 24, gap: 12 }}>
            <TouchableOpacity
              style={styles.primarySaveBtn}
              onPress={handleConfirmAndSave}
              activeOpacity={0.85}
            >
              <Text style={styles.primarySaveBtnText}>Confirm and Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelNeutralBtn}
              onPress={() => setCurrentView('edit')}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelNeutralBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 3: PROFILE UPDATED CONFIRMATION (Screenshot 5)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentView === 'success') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Terracotta Header */}
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
            <Text style={styles.headerTitle}>{t('farmerProfile.updated.title') || 'Profile Updated'}</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {t('farmerProfile.updated.subtitle') || 'Your profile has been updated successfully.'}
          </Text>
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <CheckmarkCircleIcon size={32} color={adminColors.success.text} />
          </View>

          <Text style={styles.successTitle}>{t('farmerProfile.updated.title') || 'Profile Updated'}</Text>
          <Text style={styles.successSubtitle}>
            {t('farmerProfile.updated.subtitle') || 'Your profile has been updated successfully.'}
          </Text>

          <TouchableOpacity
            style={styles.backToProfileBtn}
            onPress={() => setCurrentView('main')}
            activeOpacity={0.85}
          >
            <Text style={styles.backToProfileBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: EDIT PROFILE SCREEN (Screenshots 3 & 4 without Demo Server details)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentView === 'edit') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Terracotta Header */}
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
            <Text style={styles.headerTitle}>{t('farmerProfile.edit.title') || 'Edit Profile'}</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Update your personal information below.
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Edit Form Card (Matching Screenshot 1) */}
          <View style={styles.card}>
            {/* Field: Full Name (Editable) */}
            <Text style={styles.fieldLabel}>
              Full Name <Text style={{ color: adminColors.danger.text }}>*</Text>
            </Text>
            <View style={styles.textInputBox}>
              <TextInput
                style={styles.textInputField}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter full name"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            {/* Field: Mobile Number (Locked / Read-only) */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
              Mobile Number
            </Text>
            <View style={styles.readOnlyInputBox}>
              <Text style={styles.readOnlyInputText}>{mobileNumber}</Text>
            </View>
            <Text style={styles.lockedNoticeText}>
              Locked (BR-82). Contact TOHFA support to change this.
            </Text>

            {/* Field: Email Address (Locked / Read-only) */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Email Address</Text>
            <View style={styles.readOnlyInputBox}>
              <Text style={styles.readOnlyInputText}>{emailAddress}</Text>
            </View>
            <Text style={styles.lockedNoticeText}>
              Locked (BR-82). Contact TOHFA support to change this.
            </Text>

            {/* Field: Language (Dropdown) */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
              Language <Text style={{ color: adminColors.danger.text }}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setIsLanguageDropdownOpen((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownSelectorText}>{editLanguage}</Text>
              <ChevronDownIcon size={20} color={adminColors.ink} />
            </TouchableOpacity>

            {isLanguageDropdownOpen && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    editLanguage === 'English' && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setEditLanguage('English');
                    setIsLanguageDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      editLanguage === 'English' && styles.dropdownItemTextSelected,
                    ]}
                  >
                    English
                  </Text>
                  {editLanguage === 'English' && (
                    <CheckmarkCircleIcon size={18} color={adminColors.brand} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    { borderBottomWidth: 0 },
                    editLanguage === 'Tamil' && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setEditLanguage('Tamil');
                    setIsLanguageDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      editLanguage === 'Tamil' && styles.dropdownItemTextSelected,
                    ]}
                  >
                    Tamil
                  </Text>
                  {editLanguage === 'Tamil' && (
                    <CheckmarkCircleIcon size={18} color={adminColors.brand} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Read-Only Summary Section (Screenshot 1) */}
          <Text style={styles.sectionHeader}>Read-only</Text>
          <View style={styles.card}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Farmer ID</Text>
              <Text style={styles.tableValueBold}>{farmerId}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Account ID</Text>
              <Text style={styles.tableValueBold}>{accountId}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Assigned zone</Text>
              <Text style={styles.tableValueBold}>{assignedZone}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Account status</Text>
              <Text style={styles.tableValueBold}>{accountStatus}</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.tableLabel}>Role permissions</Text>
              <Text style={styles.tableValueBold}>{rolePermissions}</Text>
            </View>
          </View>

          {/* Subtext note (Screenshot 1) */}
          <Text style={styles.immediateSaveNotice}>
            Saving updates your name and language immediately.
          </Text>

          {/* Action Buttons: Save Changes and Cancel (Screenshot 1) */}
          <View style={styles.editActionButtonsContainer}>
            <TouchableOpacity
              style={styles.primarySaveBtn}
              onPress={handleSaveChanges}
              activeOpacity={0.85}
            >
              <Text style={styles.primarySaveBtnText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelNeutralBtn}
              onPress={() => setCurrentView('main')}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelNeutralBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: MY PROFILE SCREEN (Screenshots 1 & 2)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header (Screenshot 1) */}
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
          <Text style={styles.headerTitle}>{t('farmerProfile.title') || 'My Profile'}</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {t('farmerProfile.subtitle') || 'Manage your personal information and account details.'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Summary Card (Screenshot 1) */}
        <View style={styles.card}>
          <View style={styles.profileHeaderTopRow}>
            <View style={styles.avatarCircleLarge}>
              <Text style={styles.avatarInitialLarge}>S</Text>
            </View>

            <View style={styles.profileNameWrap}>
              <Text style={styles.profileNameText}>{fullName}</Text>
              <Text style={styles.profileIdText}>{farmerId}</Text>
            </View>
          </View>

          <View style={styles.profileTwoColGrid}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Farmer ID</Text>
              <Text style={styles.gridValueBold}>{farmerId}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Account status</Text>
              <Text style={styles.gridValueBold}>{accountStatus}</Text>
            </View>
          </View>

          <View style={styles.profileTwoColGrid}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Active role</Text>
              <Text style={styles.gridValueBold}>{activeRole}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Zone</Text>
              <Text style={styles.gridValueBold}>{assignedZone}</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editProfileOutlineBtn}
            onPress={handleOpenEdit}
            activeOpacity={0.8}
          >
            <Text style={styles.editProfileOutlineBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Personal Information (Screenshot 1) */}
        <Text style={styles.sectionHeader}>Personal information</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Full name</Text>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoRowValue}>{fullName}</Text>
              <View style={styles.editablePillBadge}>
                <Text style={styles.editablePillBadgeText}>Editable</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Mobile number</Text>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoRowValue}>{mobileNumber}</Text>
              <View style={styles.readOnlyPillBadge}>
                <Text style={styles.readOnlyPillBadgeText}>Read-only</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Email address</Text>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoRowValue}>{emailAddress}</Text>
              <View style={styles.readOnlyPillBadge}>
                <Text style={styles.readOnlyPillBadgeText}>Read-only</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Language</Text>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoRowValue}>{language}</Text>
              <View style={styles.editablePillBadge}>
                <Text style={styles.editablePillBadgeText}>Editable</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Profile photo</Text>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoRowValue}>
                {profilePhoto ? 'Uploaded' : 'Not provided'}
              </Text>
              <View style={styles.editablePillBadge}>
                <Text style={styles.editablePillBadgeText}>Editable</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Farmer ID</Text>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoRowValue}>{farmerId}</Text>
              <View style={styles.readOnlyPillBadge}>
                <Text style={styles.readOnlyPillBadgeText}>Read-only</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Assigned zone</Text>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoRowValue}>{assignedZone}</Text>
              <View style={styles.readOnlyPillBadge}>
                <Text style={styles.readOnlyPillBadgeText}>Read-only</Text>
              </View>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoRowLabel}>Account status</Text>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoRowValue}>{accountStatus}</Text>
              <View style={styles.readOnlyPillBadge}>
                <Text style={styles.readOnlyPillBadgeText}>Read-only</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Controlled notice card (Screenshot 1 & 2) */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeCardText}>
            Your name is controlled by TOHFA's farmer registration, so it cannot be changed here.
          </Text>
        </View>

        {/* Section: Account Information (Screenshot 2) */}
        <Text style={styles.sectionHeader}>Account information</Text>
        <View style={styles.card}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Account ID</Text>
            <Text style={styles.tableValueBold}>{accountId}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Farmer ID</Text>
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

        {/* Section: Role Information (Screenshot 2) */}
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

        {/* Switch Role Button (Screenshot 2) */}
        <TouchableOpacity
          style={styles.switchRoleOutlineBtn}
          onPress={() => setSwitchRoleModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.switchRoleOutlineBtnText}>Switch Role</Text>
        </TouchableOpacity>

        {/* Roles assigned by TOHFA notice card (Screenshot 2) */}
        <View style={styles.prohibitionNoticeCard}>
          <ProhibitionIcon size={18} color={adminColors.muted} />
          <Text style={styles.prohibitionNoticeText}>
            Roles are assigned by TOHFA. You cannot edit your role or give yourself more permissions.
          </Text>
        </View>

        {/* Security & Preferences Button (Screenshot 2) */}
        <TouchableOpacity
          style={styles.securityPreferencesBtn}
          onPress={() => setCurrentView('security')}
          activeOpacity={0.8}
        >
          <Text style={styles.securityPreferencesBtnText}>Security & Preferences</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── SWITCH ROLE CONFIRMATION MODAL ────────────────────────────────── */}
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
              Switch to <Text style={{ fontWeight: '800' }}>Smallholder Farmer</Text>? Switching refreshes your navigation, dashboard and permissions together. Your Farmer ID and profile stay the same.
            </Text>

            <View style={styles.roleOptionCardActive}>
              <Text style={styles.roleOptionTitle}>Smallholder Farmer</Text>
              <Text style={styles.roleOptionSub}>
                Personal farm management, produce listings, and crop harvest ledger.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primarySaveBtn}
              onPress={handleConfirmRoleSwitch}
              activeOpacity={0.85}
            >
              <Text style={styles.primarySaveBtnText}>Switch to Farmer</Text>
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

// ─── STYLES (Strictly conforming to PR #117 Admin Theme Tokens) ───────────────

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

  // Profile Header Card (Screenshot 1)
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
  },

  // Personal Information Rows (Screenshot 1)
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
    color: adminColors.ink,
  },
  infoAddressRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  infoAddressTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoAddressValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
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
  editablePillBadge: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  editablePillBadgeText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },

  // Controlled Notice Card (Screenshot 1)
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

  // Account Information Table (Screenshot 2)
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

  // Switch Role & Security Buttons (Screenshot 2)
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

  // Security & Preferences Screen (Screenshots 1 & 3)
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
    marginTop: -8,
    marginBottom: 14,
  },
  notificationCardHeader: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 6,
  },
  notificationPendingNotice: {
    ...adminType.caption,
    fontSize: 12.5,
    color: adminColors.muted,
    lineHeight: 18,
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
    width: 13,
    height: 13,
    borderRadius: 6.5,
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
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  toggleLabel: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    flex: 1,
  },
  notificationFooterNotice: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 18,
    marginTop: 12,
  },

  prefActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  savePreferencesBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  savePreferencesBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brand,
  },
  resetPreferencesBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
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
    color: adminColors.ink,
  },
  roleRadioText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },

  solidSignOutBtn: {
    backgroundColor: adminColors.danger.text,
    height: 48,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  solidSignOutBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.card,
  },
  signOutConfirmCard: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: adminColors.danger.text,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    backgroundColor: adminColors.card,
    ...adminShadow.sm,
  },
  signOutConfirmTitle: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.danger.text,
    marginBottom: adminSpacing.md,
  },
  signOutConfirmActionBtn: {
    backgroundColor: adminColors.danger.text,
    height: 48,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  signOutConfirmActionBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  signOutConfirmCancelBtn: {
    backgroundColor: adminColors.card,
    height: 48,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutConfirmCancelBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },

  // Security & Preferences Modern Card Styles
  secCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  secCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: adminSpacing.md,
  },
  secIconWrap: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secCardTitle: {
    ...adminType.sectionHead,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  secCardSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
  },
  changePasswordModernBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: adminRadius.xl,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
    marginTop: 4,
  },
  changePasswordModernBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brand,
  },
  secFieldLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.ink,
    fontSize: 13,
    marginBottom: 8,
  },
  languagePillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  languagePill: {
    flex: 1,
    height: 42,
    borderRadius: adminRadius.xl,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languagePillActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  languagePillText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.muted,
  },
  languagePillTextActive: {
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  notificationInfoBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  signOutCardBorder: {
    borderColor: adminColors.danger.border,
  },
  signOutIconWrap: {
    backgroundColor: adminColors.danger.bg,
  },
  modernSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: adminRadius.xl,
    backgroundColor: adminColors.danger.text,
    marginTop: 4,
    ...adminShadow.sm,
  },
  modernSignOutBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.card,
  },
  modernSignOutConfirmBox: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    padding: adminSpacing.md,
    marginTop: 4,
  },
  signOutConfirmSub: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 18,
    marginBottom: adminSpacing.md,
  },
  signOutButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Change Password Screen Styles (Screenshot 2)
  reqItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reqBullet: {
    ...adminType.caption,
    color: adminColors.muted,
    marginRight: 6,
    width: 14,
  },
  reqBulletMet: {
    color: adminColors.success.text,
    fontWeight: '800',
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
    marginTop: 10,
  },

  // Edit Profile Form Styles (Screenshots 3 & 4)
  fieldLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 4,
  },
  photoUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  avatarCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitialSmall: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  noPhotoText: {
    ...adminType.body,
    color: adminColors.muted,
    flex: 1,
  },
  uploadBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: adminRadius.full,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
  },
  uploadBtnText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  photoHintText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 4,
  },
  readOnlyInputBox: {
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.canvas,
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.md,
  },
  readOnlyInputText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  toHfaControlledNotice: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    marginTop: 4,
  },
  textInputBox: {
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.md,
  },
  textInputField: {
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  textAreaContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
  },
  textAreaField: {
    ...adminType.body,
    color: adminColors.ink,
    padding: adminSpacing.sm,
    minHeight: 70,
  },
  resizeHandleContainer: {
    position: 'absolute',
    right: 4,
    bottom: 4,
  },
  passwordPromptNotice: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 14,
  },
  lockedNoticeText: {
    ...adminType.caption,
    color: adminColors.info.text,
    marginTop: adminSpacing.xs,
  },
  dropdownSelector: {
    height: 48,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
  },
  dropdownSelectorText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownMenu: {
    marginTop: adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownItemSelected: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownItemTextSelected: {
    ...adminType.body,
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
  immediateSaveNotice: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 14,
    marginTop: 4,
  },
  editActionButtonsContainer: {
    gap: 8,
  },
  primarySaveBtn: {
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySaveBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  cancelNeutralBtn: {
    backgroundColor: adminColors.card,
    height: 48,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelNeutralBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Confirm Password View Styles (Image 3)
  confirmPasswordCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: 28,
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

  // Success View Styles (Screenshot 5)
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
    borderRadius: adminRadius.md,
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
});
