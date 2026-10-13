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
 *
 * Live (plan phase 8): the account is GET /auth/me; Edit Profile saves the
 * display name and the language radio saves preferredLocale, both through
 * PATCH /auth/me (auth.profile.edit_own, BR-82). Mobile and email are locked
 * identity fields (BR-33: the server refuses either with 403 FIELD_LOCKED), so
 * both are shown read-only and the edit page no longer offers an email field.
 * The saved language is the account's preference only; it does not switch the
 * app's display language here.
 *
 * Hidden, because GET /auth/me has no such field: the Admin ID, the Access
 * Level and the password-changed date.
 */
import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
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
import { isMainScope } from './mappers';
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
import type { AccountProfileView, WarehouseScreenBaseProps } from './types';

/** openapi `fullName` minLength (RegisterRequest / admin create). */
const FULL_NAME_MIN_LENGTH = 2;

type ProfileLanguage = AccountProfileView['preferredLocale'];

export interface UserProfileScreenProps extends WarehouseScreenBaseProps {
  /** The live account (GET /auth/me); undefined until it loads. */
  profile?: AccountProfileView | undefined;
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  /** PATCH /auth/me {fullName}; `onDone` after the server saved it. Without it Edit Profile is not offered. */
  onSaveName?: ((fullName: string, onDone: () => void) => void) | undefined;
  isSavingName?: boolean | undefined;
  saveNameError?: unknown;
  /** PATCH /auth/me {preferredLocale}. Without it the language card is read-only. */
  onChangeLanguage?: ((locale: ProfileLanguage) => void) | undefined;
  isSavingLanguage?: boolean | undefined;
  languageError?: unknown;
  /** Main's Security card: open the change-password form. */
  onChangePassword?: (() => void) | undefined;
  /** Main's Security card: sign out (host navigates to login). Without it the signed-out state is shown. */
  onLogout?: (() => void) | undefined;
}

type ProfileView = 'profile' | 'edit' | 'updated' | 'signedOut';

/** docs/openapi.yaml UpdateCurrentUserRequest fullName maxLength (the request schema's bound). */
const FULL_NAME_MAX_LENGTH = 120;

const LANGUAGES: readonly { value: ProfileLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'Tamil (தமிழ்)' },
];

export function UserProfileScreen({
  scope,
  onBack,
  profile,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onSaveName,
  isSavingName = false,
  saveNameError,
  onChangeLanguage,
  isSavingLanguage = false,
  languageError,
  onChangePassword,
  onLogout,
}: UserProfileScreenProps) {
  const isMain = isMainScope(scope);
  const [view, setView] = useState<ProfileView>('profile');
  const [editName, setEditName] = useState('');
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const openEdit = () => {
    setEditName(profile?.fullName ?? '');
    setView('edit');
  };

  const requestSave = () => {
    const trimmed = editName.trim();
    if (trimmed.length < FULL_NAME_MIN_LENGTH || trimmed.length > FULL_NAME_MAX_LENGTH) {
      Alert.alert(t('profile.edit.invalidTitle'), t('profile.edit.nameLength', { min: FULL_NAME_MIN_LENGTH, max: FULL_NAME_MAX_LENGTH }));
      return;
    }
    setConfirmSave(true);
  };

  const save = () => {
    setConfirmSave(false);
    if (!onSaveName || isSavingName) return;
    onSaveName(editName.trim(), () => setView('updated'));
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
            <WalletButton label={isSavingName ? t('profile.edit.saving') : 'Save Changes'} onPress={requestSave} disabled={isSavingName} />
            <WalletButton label="Cancel" variant="neutral" onPress={() => setView('profile')} disabled={isSavingName} />
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
              <Text style={styles.lockedText}>{profile?.mobileNumber ?? t('profile.noValue')}</Text>
              <LockIcon color={adminColors.muted} />
            </View>
            <Text style={styles.inputLabel}>Email Address</Text>
            {/* Locked identity field (BR-33): PATCH /auth/me refuses it with 403 FIELD_LOCKED. */}
            <View style={[styles.input, styles.inputLocked]}>
              <Text style={styles.lockedText}>{profile?.email ?? t('profile.noValue')}</Text>
              <LockIcon color={adminColors.muted} />
            </View>
          </Card>
          {saveNameError !== null && saveNameError !== undefined ? (
            <InfoNote tone="danger">{t(adminErrorKey(saveNameError))}</InfoNote>
          ) : null}
          <InfoNote tone="brandSoft">{t('profile.edit.lockedNote')}</InfoNote>
        </ScrollView>
        <ConfirmDialog
          visible={confirmSave}
          title="Save Changes?"
          message={t('profile.edit.confirmMessage')}
          confirmLabel="Confirm"
          icon={<PencilIcon color={adminColors.brand} />}
          onConfirm={save}
          onCancel={() => setConfirmSave(false)}
        />
      </WalletScreen>
    );
  }

  const state = profile !== undefined ? 'ready' : queryViewState({ isLoading, error, itemCount: 0 });
  if (state !== 'ready' || profile === undefined) {
    return (
      <WalletScreen title="Profile" onBack={onBack}>
        {state === 'loading' ? <AdminLoadingState /> : <AdminErrorState error={error} onRetry={onRetry} />}
      </WalletScreen>
    );
  }
  const account = profile;
  const noValue = t('profile.noValue');

  return (
    <WalletScreen title="Profile" onBack={onBack}>
      <ScrollView
        contentContainerStyle={profileLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /> : undefined}
      >
        <Card centered>
          <View style={styles.avatar}>
            <UserIcon size={28} />
          </View>
          <Text style={styles.name}>{account.fullName}</Text>
          <Text style={styles.subtitle}>
            {account.roleLabel} · {account.warehouseLabel}
          </Text>
          <View style={styles.badgeRow}>
            <StatusBadge label={account.status} tone={account.statusTone} />
            {isMain ? <StatusBadge label={account.warehouseLabel} tone="brandSoft" /> : null}
          </View>
          {isMain && account.lastLogin !== null ? (
            <Text style={styles.loginLine}>{t('profile.lastLoginLine', { when: account.lastLogin })}</Text>
          ) : null}
        </Card>

        <SectionTitle>PROFILE INFORMATION</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Full Name', value: account.fullName },
              { label: 'Role', value: account.roleLabel },
            ],
            [{ label: isMain ? 'Warehouse Scope' : 'Warehouse', value: account.warehouseLabel }],
          ]}
        />

        <SectionTitle>CONTACT INFORMATION</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Mobile Number', value: account.mobileNumber ?? noValue },
              { label: 'Email', value: account.email ?? noValue },
            ],
          ]}
        />

        {isMain ? (
          <>
            <SectionTitle>ACCOUNT & ACCESS</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Created Date', value: account.createdDate ?? noValue },
                  { label: 'Last Login', value: account.lastLogin ?? noValue },
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
            const selected = option.value === account.preferredLocale;
            const disabled = onChangeLanguage === undefined || isSavingLanguage;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.languageRow, index > 0 && styles.languageRowDivided]}
                onPress={() => {
                  if (!selected && onChangeLanguage && !isSavingLanguage) onChangeLanguage(option.value);
                }}
                disabled={disabled}
                activeOpacity={0.75}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled }}
              >
                <Text style={[styles.languageText, selected && styles.languageTextSelected]}>{option.label}</Text>
                <View style={[styles.radio, selected && styles.radioSelected]} />
              </TouchableOpacity>
            );
          })}
        </View>
        {languageError !== null && languageError !== undefined ? (
          <View style={styles.editButton}>
            <InfoNote tone="danger">{t(adminErrorKey(languageError))}</InfoNote>
          </View>
        ) : null}

        {onSaveName ? (
          <View style={styles.editButton}>
            <WalletButton label="Edit Profile" icon={<PencilIcon />} onPress={openEdit} />
          </View>
        ) : null}

        {isMain ? (
          <>
            <SectionTitle>SECURITY</SectionTitle>
            <MenuCard>
              {onChangePassword ? (
                <MenuRow icon={<KeyIcon />} title="Change Password" subtitle="Update your password" onPress={onChangePassword} />
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
