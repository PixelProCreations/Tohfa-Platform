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

function CloseIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface TohfaAdminProfileScreenProps {
  onBack?: () => void;
  onSignOut?: () => void;
}

export function TohfaAdminProfileScreen({
  onBack,
  onSignOut,
}: TohfaAdminProfileScreenProps) {
  // Navigation View State
  const [currentView, setCurrentView] = useState<'main' | 'edit' | 'confirm_password' | 'success' | 'security'>('main');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // User Profile Data State (TOHFA Operations Admin)
  const [fullName, setFullName] = useState('Priya Sundaram');
  const [language, setLanguage] = useState<'English' | 'Tamil'>('English');
  const [adminId] = useState('TOHFA-OP-0012');
  const [accountId] = useState('ACC-000012');
  const [accountStatus] = useState('Active');
  const [activeRole] = useState('TOHFA Admin');
  const [availableRoles] = useState('TOHFA Admin, Super Admin');
  const [assignedDepartment] = useState('Supply Chain, Allocations & Marketplace Operations');
  const [assignedHub] = useState('Central Marketplace & Logistics Hub (All Hubs)');
  const [accountCreated] = useState('15 Jan 2024');
  const [lastLogin] = useState('24 Sep 2026, 09:15');

  // Contact Info (Locked / Read-only)
  const [mobileNumber, setMobileNumber] = useState('+91 98000 00002');
  const [emailAddress, setEmailAddress] = useState('operations@tohfa.test');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Edit Buffer Fields
  const [editName, setEditName] = useState(fullName);
  const [editLanguage, setEditLanguage] = useState<'English' | 'Tamil'>(language);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Toast / Feedback Notices
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

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
    setConfirmPasswordInput('');
    setCurrentView('success');
  };

  const handleSimulatePhotoUpload = () => {
    Alert.alert('Upload Photo', 'Select image from device storage or camera', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Choose Sample Photo',
        onPress: () => setProfilePhoto('priya_avatar.jpg'),
      },
    ]);
  };

  const handleSavePreferences = () => {
    setFeedbackToast('Preferences saved successfully');
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleResetPreferences = () => {
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

  // ─── 1. SECURITY & PREFERENCES VIEW ───────────────────────────────────────
  if (currentView === 'security') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Brand Orange Header */}
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
          {/* Account Security Section */}
          <Text style={styles.sectionHeader}>Account security</Text>
          {!isChangingPassword ? (
            <TouchableOpacity
              style={styles.changePasswordOutlineBtn}
              onPress={() => setIsChangingPassword(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.changePasswordOutlineBtnText}>Change Password</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <View style={styles.card}>
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
              </View>

              <View style={[styles.editActionButtonsContainer, { marginBottom: 16 }]}>
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

          {/* Application Preferences Section */}
          <Text style={[styles.sectionHeader, { marginTop: 14 }]}>Application preferences</Text>
          <View style={styles.card}>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.tableLabel}>Application language</Text>
              <Text style={styles.tableValueBold}>{language}</Text>
            </View>
          </View>

          <Text style={styles.languageNoticeText}>
            English and Tamil are available. Change your language from your profile.
          </Text>

          {/* Notification Preferences Sub-Card */}
          <View style={styles.card}>
            <Text style={styles.notificationCardHeader}>Notification preferences</Text>
            <Text style={styles.notificationPendingNotice}>
              Notification categories for the TOHFA Admin role have been configured for allocations, price alerts and buyer escalations.
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

          {/* Sign Out Section (Orange button matching user requirement) */}
          <Text style={styles.sectionHeader}>Sign out</Text>
          <TouchableOpacity
            style={styles.solidSignOutBtn}
            onPress={() => setShowSignOutConfirm(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.solidSignOutBtnText}>Sign Out of This Device</Text>
          </TouchableOpacity>

          {showSignOutConfirm && (
            <View style={styles.signOutConfirmCard}>
              <Text style={styles.signOutConfirmTitle}>Sign out of your account?</Text>

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
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── 2. EDIT PROFILE VIEW ─────────────────────────────────────────────────
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
          <Text style={styles.headerSubtitle}>
            Update your personal details and application preferences.
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Full Name */}
            <Text style={styles.fieldLabel}>Full name</Text>
            <View style={styles.textInputBox}>
              <TextInput
                style={styles.textInputField}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter full name"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            {/* Profile Photo */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Profile photo</Text>
            <View style={styles.photoUploadRow}>
              <View style={styles.avatarCircleSmall}>
                <Text style={styles.avatarInitialSmall}>
                  {editName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.noPhotoText}>
                {profilePhoto ? 'Photo selected' : 'No photo chosen'}
              </Text>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={handleSimulatePhotoUpload}
                activeOpacity={0.8}
              >
                <Text style={styles.uploadBtnText}>Upload Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Language Selection */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Language</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownSelectorText}>{editLanguage}</Text>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>

            {isLanguageDropdownOpen && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={[styles.dropdownItem, editLanguage === 'English' && styles.dropdownItemSelected]}
                  onPress={() => {
                    setEditLanguage('English');
                    setIsLanguageDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownItemText, editLanguage === 'English' && styles.dropdownItemTextSelected]}>
                    English
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dropdownItem, editLanguage === 'Tamil' && styles.dropdownItemSelected, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    setEditLanguage('Tamil');
                    setIsLanguageDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownItemText, editLanguage === 'Tamil' && styles.dropdownItemTextSelected]}>
                    Tamil
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Read-Only Mobile Number */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Mobile number</Text>
            <View style={styles.readOnlyInputBox}>
              <Text style={styles.readOnlyInputText}>{mobileNumber}</Text>
            </View>
            <Text style={styles.lockedNoticeText}>Controlled by TOHFA governance (Read-only)</Text>

            {/* Read-Only Email Address */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Email address</Text>
            <View style={styles.readOnlyInputBox}>
              <Text style={styles.readOnlyInputText}>{emailAddress}</Text>
            </View>
            <Text style={styles.lockedNoticeText}>Controlled by TOHFA governance (Read-only)</Text>

            {/* Read-Only Admin ID */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Admin ID</Text>
            <View style={styles.readOnlyInputBox}>
              <Text style={styles.readOnlyInputText}>{adminId}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[styles.editActionButtonsContainer, { marginTop: 18 }]}>
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

  // ─── 3. CONFIRM PASSWORD VIEW ─────────────────────────────────────────────
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
          <Text style={styles.headerSubtitle}>
            Manage your personal information and account details.
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.confirmPasswordCard}>
            <View style={styles.lockIconContainer}>
              <LockIcon size={34} color={adminColors.brand} />
            </View>

            <Text style={styles.confirmPasswordTitle}>Confirm your password</Text>
            <Text style={styles.confirmPasswordSubtitle}>
              You are updating sensitive account settings. For your security, enter your password to continue.
            </Text>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Password</Text>
          <View style={styles.textInputBox}>
            <TextInput
              style={styles.textInputField}
              value={confirmPasswordInput}
              onChangeText={setConfirmPasswordInput}
              secureTextEntry
              placeholder="Enter password"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

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

  // ─── 4. SUCCESS VIEW ──────────────────────────────────────────────────────
  if (currentView === 'success') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <Text style={[styles.headerTitle, { marginLeft: 4 }]}>Profile</Text>
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <CheckmarkCircleIcon size={36} color={adminColors.success.text} />
          </View>

          <Text style={styles.successTitle}>Profile updated</Text>
          <Text style={styles.successSubtitle}>
            Your TOHFA Admin profile information has been saved successfully.
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

  // ─── 5. MAIN PROFILE VIEW (MATCHING FARMER ADMIN PROFILE) ─────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Manage your personal information and account details.
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
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>PS</Text>
            </View>

            <View style={styles.heroInfoCol}>
              <View style={styles.nameRoleRow}>
                <Text style={styles.heroNameText}>{fullName}</Text>
                <View style={styles.roleBadgePill}>
                  <Text style={styles.roleBadgePillText}>{activeRole}</Text>
                </View>
              </View>

              <Text style={styles.heroIdSub}>Admin ID: {adminId}</Text>
            </View>
          </View>

          {/* Department / Hub Grid */}
          <View style={styles.heroGridBox}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Department</Text>
              <Text style={styles.gridValueBold} numberOfLines={1}>Supply Chain Operations</Text>
            </View>
            <View style={styles.gridDividerVertical} />
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Scope</Text>
              <Text style={styles.gridValueBold}>All Warehouses</Text>
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

        {/* Section: Personal Information */}
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
            <Text style={styles.infoRowLabel}>Admin ID</Text>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoRowValue}>{adminId}</Text>
              <View style={styles.readOnlyPillBadge}>
                <Text style={styles.readOnlyPillBadgeText}>Read-only</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Assigned hub</Text>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoRowValue}>All Warehouses</Text>
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

        {/* Controlled notice card */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeCardText}>
            Your official details are managed by TOHFA governance and cannot be modified directly.
          </Text>
        </View>

        {/* Section: Account Information */}
        <Text style={styles.sectionHeader}>Account information</Text>
        <View style={styles.card}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Account ID</Text>
            <Text style={styles.tableValueBold}>{accountId}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Admin ID</Text>
            <Text style={styles.tableValueBold}>{adminId}</Text>
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

        {/* Section: Role Information */}
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

        {/* Roles assigned by TOHFA notice card */}
        <View style={styles.prohibitionNoticeCard}>
          <ProhibitionIcon size={18} color={adminColors.muted} />
          <Text style={styles.prohibitionNoticeText}>
            Roles are assigned by TOHFA governance. You cannot edit your role or give yourself more permissions.
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

        <View style={{ height: 40 }} />
      </ScrollView>
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
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 4,
    marginLeft: 4,
  },
  feedbackToastBanner: {
    backgroundColor: adminColors.brandTint,
    paddingVertical: 10,
    paddingHorizontal: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.brand,
    alignItems: 'center',
  },
  feedbackToastText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
  },

  // Hero Card
  heroCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    ...adminType.title,
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  heroInfoCol: {
    flex: 1,
  },
  nameRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroNameText: {
    ...adminType.title,
    fontSize: 17,
    fontWeight: '800',
    color: adminColors.ink,
  },
  roleBadgePill: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.brand,
  },
  roleBadgePillText: {
    ...adminType.caption,
    fontSize: 10,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  heroIdSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 3,
  },
  heroGridBox: {
    flexDirection: 'row',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: adminSpacing.md,
  },
  gridCol: {
    flex: 1,
  },
  gridDividerVertical: {
    width: 1,
    backgroundColor: adminColors.border,
    marginHorizontal: 10,
  },
  gridLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
    marginBottom: 2,
  },
  gridValueBold: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  editProfileOutlineBtn: {
    height: 44,
    borderRadius: adminRadius.xl,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  editProfileOutlineBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // Cards & Sections
  sectionHeader: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: adminSpacing.xs,
    marginLeft: 4,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  infoRowLabel: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13,
  },
  infoRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoRowValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    fontSize: 13,
  },
  editablePillBadge: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  editablePillBadgeText: {
    ...adminType.caption,
    fontSize: 9.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  readOnlyPillBadge: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  readOnlyPillBadgeText: {
    ...adminType.caption,
    fontSize: 9.5,
    fontWeight: '700',
    color: adminColors.muted,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  tableLabel: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13,
  },
  tableValueBold: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
    fontSize: 13,
  },
  noticeCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  noticeCardText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    lineHeight: 18,
  },
  prohibitionNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  prohibitionNoticeText: {
    flex: 1,
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    lineHeight: 18,
  },
  securityPreferencesBtn: {
    height: 48,
    borderRadius: adminRadius.xl,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    marginTop: 4,
    ...adminShadow.sm,
  },
  securityPreferencesBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // Security View Styles
  changePasswordOutlineBtn: {
    height: 48,
    borderRadius: adminRadius.xl,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    marginBottom: adminSpacing.md,
  },
  changePasswordOutlineBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  languageNoticeText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: adminSpacing.md,
    marginLeft: 4,
  },
  notificationCardHeader: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 6,
  },
  notificationPendingNotice: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  prefActionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: adminSpacing.lg,
  },
  savePreferencesBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.xl,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  savePreferencesBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  resetPreferencesBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.xl,
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
  solidSignOutBtn: {
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: adminRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  solidSignOutBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  signOutConfirmCard: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    backgroundColor: adminColors.card,
    ...adminShadow.sm,
  },
  signOutConfirmTitle: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brand,
    marginBottom: adminSpacing.md,
  },
  signOutConfirmActionBtn: {
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: adminRadius.xl,
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
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutConfirmCancelBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Edit Form Inputs
  fieldLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 4,
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
  lockedNoticeText: {
    ...adminType.caption,
    color: adminColors.info.text,
    marginTop: 4,
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
    marginTop: 4,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
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
  editActionButtonsContainer: {
    gap: 10,
  },
  primarySaveBtn: {
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: adminRadius.xl,
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
    borderRadius: adminRadius.xl,
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

  // Password Checklist
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

  // Confirm Password Card
  confirmPasswordCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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

  // Success View
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
    borderRadius: adminRadius.xl,
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
});
