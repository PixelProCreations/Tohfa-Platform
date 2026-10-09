// Design id: M16-S01
/**
 * The signed-in warehouse admin's own profile (FINAL_LIST #86), for Main and Sub.
 *
 * Was SubWarehouseUserProfileScreen (profile + edit modal + language). It
 * absorbs the unreachable Main twin MainWarehouseProfileScreen and its two
 * pages, MainWarehouseEditProfileScreen and MainWarehouseProfileUpdatedScreen:
 * edit and "Profile Updated" are states of this screen now, not screens.
 *
 * Main-only content (scope.warehouseId undefined), ported from the Main twin:
 * the "All Warehouses" scope chip and admin-id / last-login line on the
 * identity card, the Account & Access card with its "no role / warehouse /
 * permission changes here" notice, and the Security card (password last
 * changed, Change Password, Sign Out). Sub keeps its preferred-language card;
 * both keep the edit page.
 *
 * Gate: viewable with login (auth.principal.view_own is `all` for both roles).
 * Own-profile edit has NO rbac code (SPEC_GAPS §1.14 / W4l-2): the mobile
 * number is a locked identity field and is read-only here; name (and email)
 * edit stays available as both designs had it, pending a code.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  Card,
  InfoCard,
  InfoNote,
  LockIcon,
  SectionTitle,
  StatusBadge,
  SuccessCircleIcon,
  WalletButton,
  WalletFooter,
  WalletScreen,
} from '../wallet-cashtopup/WalletParts';
import { defaultProfile, isMainScope } from './fixtures';
import {
  BlockIcon,
  ConfirmDialog,
  KeyIcon,
  LogoutIcon,
  MenuCard,
  MenuRow,
  PencilIcon,
  profileLayout,
  SignedOutView,
  UserIcon,
} from './ProfileParts';
import type { AdminAccountProfile, ProfileLanguage, WarehouseScreenBaseProps } from './types';

/** openapi `fullName` minLength (RegisterRequest / admin create). */
const FULL_NAME_MIN_LENGTH = 2;

export interface UserProfileScreenProps extends WarehouseScreenBaseProps {
  /** The account to show (defaults to the mock account for the scope). */
  profile?: AdminAccountProfile | undefined;
  /** Main's Security card: open the change-password form. */
  onChangePassword?: (() => void) | undefined;
  /** Main's Security card: sign out (host navigates to login). Without it the signed-out state is shown. */
  onLogout?: (() => void) | undefined;
}

type ProfileView = 'profile' | 'edit' | 'updated' | 'signedOut';

const LANGUAGES: readonly { value: ProfileLanguage; label: string }[] = [
  { value: 'English', label: 'English' },
  { value: 'Tamil', label: 'Tamil (தமிழ்)' },
];

export function UserProfileScreen({ scope, onBack, profile, onChangePassword, onLogout }: UserProfileScreenProps) {
  const isMain = isMainScope(scope);
  const [account, setAccount] = useState<AdminAccountProfile>(() => profile ?? defaultProfile(scope));
  const [view, setView] = useState<ProfileView>('profile');
  const [language, setLanguage] = useState<ProfileLanguage>('English');
  const [editName, setEditName] = useState(account.fullName);
  const [editEmail, setEditEmail] = useState(account.email);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const openEdit = () => {
    setEditName(account.fullName);
    setEditEmail(account.email);
    setView('edit');
  };

  const requestSave = () => {
    if (editName.trim().length < FULL_NAME_MIN_LENGTH) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }
    setConfirmSave(true);
  };

  // No own-profile update endpoint or code exists (SPEC_GAPS W4l-2): local update only.
  const save = () => {
    setConfirmSave(false);
    setAccount((prev) => ({ ...prev, fullName: editName.trim(), email: editEmail.trim() }));
    setView('updated');
  };

  const signOut = () => {
    setConfirmSignOut(false);
    if (onLogout) onLogout();
    else setView('signedOut');
  };

  if (view === 'signedOut') {
    return <SignedOutView />;
  }

  if (view === 'updated') {
    return (
      <WalletScreen
        title="Profile Updated"
        onBack={() => setView('profile')}
        footer={
          <WalletFooter>
            <WalletButton label="Back to Profile" onPress={() => setView('profile')} />
          </WalletFooter>
        }
      >
        <ScrollView contentContainerStyle={profileLayout.scrollContent}>
          <Card centered>
            <View style={styles.successCircle}>
              <SuccessCircleIcon />
            </View>
            <Text style={styles.successTitle}>Profile Updated</Text>
            <Text style={styles.successText}>Your profile information has been updated successfully.</Text>
          </Card>
        </ScrollView>
      </WalletScreen>
    );
  }

  if (view === 'edit') {
    return (
      <WalletScreen
        title="Edit Profile"
        onBack={() => setView('profile')}
        footer={
          <WalletFooter>
            <WalletButton label="Save Changes" onPress={requestSave} />
            <WalletButton label="Cancel" variant="neutral" onPress={() => setView('profile')} />
          </WalletFooter>
        }
      >
        <ScrollView contentContainerStyle={profileLayout.scrollContent} keyboardShouldPersistTaps="handled">
          <SectionTitle>EDIT PROFILE</SectionTitle>
          <Card>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your full name"
              placeholderTextColor={adminColors.placeholder}
            />
            <Text style={styles.inputLabel}>Mobile Number</Text>
            {/* Locked identity field: no rbac code lets an admin change it (SPEC_GAPS §1.14). */}
            <View style={[styles.input, styles.inputLocked]}>
              <Text style={styles.lockedText}>{account.mobileNumber}</Text>
              <LockIcon color={adminColors.muted} />
            </View>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Enter email address"
              placeholderTextColor={adminColors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Card>
          <InfoNote tone="brandSoft">
            Mobile Number, Admin ID, Role and Warehouse Scope are read-only here.
          </InfoNote>
        </ScrollView>
        <ConfirmDialog
          visible={confirmSave}
          title="Save Changes?"
          message="Your name and email will be updated on your admin account."
          confirmLabel="Confirm"
          icon={<PencilIcon color={adminColors.brand} />}
          onConfirm={save}
          onCancel={() => setConfirmSave(false)}
        />
      </WalletScreen>
    );
  }

  return (
    <WalletScreen title="Profile" onBack={onBack}>
      <ScrollView contentContainerStyle={profileLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <Card centered>
          <View style={styles.avatar}>
            <UserIcon size={28} />
          </View>
          <Text style={styles.name}>{account.fullName}</Text>
          <Text style={styles.subtitle}>
            {account.roleLabel} · {account.warehouseLabel}
          </Text>
          <View style={styles.badgeRow}>
            <StatusBadge label={account.status === 'Active' ? 'Active Staff' : 'Inactive'} tone={account.status === 'Active' ? 'success' : 'danger'} />
            {isMain ? <StatusBadge label={account.warehouseLabel} tone="brandSoft" /> : null}
          </View>
          {isMain ? (
            <Text style={styles.loginLine}>
              Admin ID: {account.adminId} · Last login: {account.lastLogin}
            </Text>
          ) : null}
        </Card>

        <SectionTitle>PROFILE INFORMATION</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Full Name', value: account.fullName },
              { label: 'Role', value: account.roleLabel },
            ],
            [
              { label: isMain ? 'Warehouse Scope' : 'Warehouse', value: account.warehouseLabel },
              { label: 'Admin ID', value: account.adminId },
            ],
          ]}
        />

        <SectionTitle>CONTACT INFORMATION</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Mobile Number', value: account.mobileNumber },
              { label: 'Email', value: account.email },
            ],
          ]}
        />

        {isMain ? (
          <>
            <SectionTitle>ACCOUNT & ACCESS</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Access Level', value: account.accessLevel },
                  { label: 'Warehouse Scope', value: account.warehouseLabel },
                ],
                [
                  { label: 'Created Date', value: account.createdDate },
                  { label: 'Last Login', value: account.lastLogin },
                ],
              ]}
            />
            <InfoNote tone="info" icon={<BlockIcon color={adminColors.info.text} />}>
              No Change Role, Change Warehouse, Change Permissions, or Promote Admin here.
            </InfoNote>
          </>
        ) : null}

        <SectionTitle>PREFERRED LANGUAGE</SectionTitle>
        <View style={styles.languageCard}>
          {LANGUAGES.map((option, index) => {
            const selected = option.value === language;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.languageRow, index > 0 && styles.languageRowDivided]}
                onPress={() => setLanguage(option.value)}
                activeOpacity={0.75}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.languageText, selected && styles.languageTextSelected]}>{option.label}</Text>
                <View style={[styles.radio, selected && styles.radioSelected]} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.editButton}>
          <WalletButton label="Edit Profile" icon={<PencilIcon />} onPress={openEdit} />
        </View>

        {isMain ? (
          <>
            <SectionTitle>SECURITY</SectionTitle>
            <MenuCard>
              {onChangePassword ? (
                <MenuRow
                  icon={<KeyIcon />}
                  title="Change Password"
                  subtitle={`Last changed ${account.passwordChanged}`}
                  onPress={onChangePassword}
                />
              ) : null}
              <MenuRow icon={<LogoutIcon />} title="Sign Out" danger onPress={() => setConfirmSignOut(true)} />
            </MenuCard>
          </>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={confirmSignOut}
        title="Sign Out?"
        message="Are you sure you want to sign out of your TOHFA admin account?"
        confirmLabel="Sign Out"
        destructive
        icon={<LogoutIcon />}
        onConfirm={signOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </WalletScreen>
  );
}

// Avatar and radio diameters: icon sizes, not spacing.
const AVATAR = 64;
const SUCCESS_CIRCLE = 64;
const RADIO = 18;

const styles = StyleSheet.create({
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  name: { ...adminType.title, color: adminColors.ink, textAlign: 'center' },
  subtitle: { ...adminType.body, color: adminColors.muted, textAlign: 'center', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.sm },
  loginLine: { ...adminType.rowMeta, color: adminColors.muted, textAlign: 'center', marginTop: adminSpacing.sm },

  languageCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  languageRowDivided: { borderTopWidth: 1, borderTopColor: adminColors.border },
  languageText: { ...adminType.rowTitle, color: adminColors.ink },
  languageTextSelected: { color: adminColors.brand },
  radio: {
    width: RADIO,
    height: RADIO,
    borderRadius: adminRadius.full,
    borderWidth: 2,
    borderColor: adminColors.border,
  },
  radioSelected: { borderColor: adminColors.brand, backgroundColor: adminColors.brand },

  editButton: { marginTop: adminSpacing.xl },

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
  inputLocked: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: adminColors.border },
  lockedText: { ...adminType.body, color: adminColors.muted },

  successCircle: {
    width: SUCCESS_CIRCLE,
    height: SUCCESS_CIRCLE,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  successTitle: { ...adminType.title, color: adminColors.ink, textAlign: 'center' },
  successText: { ...adminType.body, color: adminColors.muted, textAlign: 'center', marginTop: adminSpacing.xs },
});
