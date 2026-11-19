import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { ApiError } from '../../../../shell/api/client';
import {
  ADMIN_MOBILE_PATTERN,
  createAdminAccount,
  disableAdminAccount,
  type AdminAccountRole,
  type AdminAccountStatusDto,
} from '../../api/adminAccounts';
import { adminErrorKey } from '../../api/errors';
import { useAdminMutation } from '../../api/hooks';
import { createSubAdmin } from '../../api/subAdmins';
import { t, type TranslationKey } from '../../i18n';
import type { Can } from '../../permissions/can';
import { useWarehouseOptions } from '../warehouse/shared/useWarehouseOptions';

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const ADMIN_PALETTE = {
  primaryOrange: '#F0562A',
  primaryOrangeLight: '#FFF1EB',
  primaryOrangeBorder: '#FAD9CC',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textHeading: '#6B230B',
  textPrimary: '#1F1714',
  textSecondary: '#786F68',
  textMuted: '#9C938C',
  borderSoft: '#EDE7DE',
  blueBg: '#EBF3FA',
  blueText: '#1D6399',
  blueBorder: '#BFDBFE',
  dangerBg: '#FEE2E2',
  dangerText: '#DC2626',
  dangerBorder: '#FECACA',
  successBg: '#DCFCE7',
  successText: '#15803D',
  inactivePillBg: '#F5F1EB',
  inactivePillText: '#786F68',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
export function AdminBackChevronIcon({ color = '#1F1714', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserIcon({ color = ADMIN_PALETTE.textSecondary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function PhoneIcon({ color = ADMIN_PALETTE.textSecondary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ color = ADMIN_PALETTE.blueText, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ color = ADMIN_PALETTE.textSecondary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BanIcon({ color = ADMIN_PALETTE.dangerText, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
export type AdminRoleType = 'SA' | 'TA' | 'FA' | 'SW' | 'MW';

export interface AdminAccountData {
  id?: string | undefined;
  fullName: string;
  mobile: string;
  role: AdminRoleType;
  warehouse?: string | undefined;
  status?: ('ACTIVE' | 'PENDING' | 'DISABLED') | undefined;
}

export interface CreateAdminAccountScreenProps {
  initialData?: AdminAccountData | null | undefined;
  /**
   * The signed-in admin's permission check (/auth/me codes). Fail closed: with
   * none, every role and the disable action are unavailable. Which roles may be
   * created is decided by the `admin.*.create` codes, never by a role name here.
   */
  can?: Can | undefined;
  onBack?: (() => void) | undefined;
  /** Fires only after the server accepted a create (201). Never on a failed or unsent call. */
  onSuccess?: ((account: AdminAccountData) => void) | undefined;
  onViewDirectory?: (() => void) | undefined;
}

/** The create permission for each role button (docs/rbac.json; the server checks the same code). */
const ROLE_CREATE_CODE: Record<'SA' | 'TA' | 'FA' | 'SW', string> = {
  SA: 'admin.super_admin.create',
  TA: 'admin.tohfa_admin.create',
  FA: 'admin.farmer_admin.create',
  SW: 'admin.sub_wh_admin.create',
};
const DISABLE_CODE = 'admin.account.disable';
const WAREHOUSE_LIST_CODE = 'warehouse.all.view';

/** The role value POST /admin/accounts takes; SW goes through POST /admin/sub-warehouse-admins instead. */
const ACCOUNT_API_ROLE: Record<'SA' | 'TA' | 'FA', AdminAccountRole> = {
  SA: 'SUPER_ADMIN',
  TA: 'TOHFA_ADMIN',
  FA: 'FARMER_ADMIN',
};

const DENY_ALL: Can = () => false;
const MOBILE_COUNTRY_CODE = '+91';
const MOBILE_DIGITS = 10;

interface CreateInput {
  role: 'SA' | 'TA' | 'SW';
  fullName: string;
  mobileE164: string;
  warehouseId: string | undefined;
}

interface CreatedAccount {
  userId: string;
  adminCode: string;
  fullName: string;
  role: AdminRoleType;
  mobile: string;
  warehouse: string | undefined;
}

/** The national number from what was typed or pasted ("+91 98765 43210" and "98765 43210" both work). */
function nationalDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length === MOBILE_DIGITS + 2 && digits.startsWith('91') ? digits.slice(2) : digits;
}

/** A taken mobile / full warehouse (create) and the last Super Admin (disable) are both 409; say which. */
function conflictAwareErrorKey(error: unknown, conflictKey: TranslationKey): TranslationKey {
  if (error instanceof ApiError && error.problem.code === 'CONFLICT') return conflictKey;
  return adminErrorKey(error);
}

export function CreateAdminAccountScreen({
  initialData,
  can = DENY_ALL,
  onBack,
  onSuccess,
  onViewDirectory,
}: CreateAdminAccountScreenProps) {
  const isEditing = !!initialData?.id;

  const [fullName, setFullName] = useState(initialData?.fullName ?? '');
  const [mobile, setMobile] = useState(initialData?.mobile ?? '');
  const [pickedRole, setPickedRole] = useState<AdminRoleType | null>(null);
  const [warehouseId, setWarehouseId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<'ACTIVE' | 'PENDING' | 'DISABLED'>(initialData?.status ?? 'ACTIVE');

  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [created, setCreated] = useState<CreatedAccount | null>(null);

  // Role availability comes from the caller's permission codes, not from a role name.
  const roleOptions: { key: AdminRoleType; label: string; allowed: boolean; name: string }[] = [
    { key: 'SA', label: 'SA', allowed: can(ROLE_CREATE_CODE.SA), name: 'Super Admin' },
    { key: 'TA', label: 'TA', allowed: can(ROLE_CREATE_CODE.TA), name: 'TOHFA Admin' },
    { key: 'FA', label: 'FA', allowed: can(ROLE_CREATE_CODE.FA), name: 'Field / Finance Admin' },
    { key: 'SW', label: 'SW', allowed: can(ROLE_CREATE_CODE.SW), name: 'Sub Warehouse Admin' },
  ];
  const allRolesGrantable = roleOptions.every((r) => r.allowed);
  // Least privilege first: the default is the lowest role this caller may create that the app can send.
  const defaultRole: AdminRoleType =
    (['SW', 'TA', 'SA', 'FA'] as const).find((k) => roleOptions.some((r) => r.key === k && r.allowed)) ?? 'SW';
  const selectedRole: AdminRoleType = isEditing ? (initialData?.role ?? defaultRole) : (pickedRole ?? defaultRole);
  const roleGrantable = selectedRole === 'MW' ? false : can(ROLE_CREATE_CODE[selectedRole]);
  // POST /admin/accounts needs exactly one zoneId for a Farmer Admin and no zone list is served, so the
  // call cannot be built; it is not sent rather than sent to a certain 422.
  const zoneBlocked = !isEditing && selectedRole === 'FA';

  // Live sub-warehouses for the SW picker (GET /warehouses, warehouse.all.view). Only fetched when it can be used.
  const warehouses = useWarehouseOptions({
    enabled: !isEditing && selectedRole === 'SW' && can(WAREHOUSE_LIST_CODE),
    activeOnly: true,
  });
  const subWarehouses = warehouses.options.filter((o) => o.type === 'SUB');
  const warehouseName = isEditing
    ? initialData?.warehouse
    : subWarehouses.find((o) => o.warehouseId === warehouseId)?.warehouseName;

  const createMutation = useAdminMutation<CreateInput, CreatedAccount>({
    mutationFn: async (input) => {
      if (input.role === 'SW') {
        const res = await createSubAdmin({
          fullName: input.fullName,
          mobile: input.mobileE164,
          warehouseId: input.warehouseId ?? '',
        });
        return {
          userId: res.userId,
          adminCode: res.adminCode,
          fullName: res.fullName,
          role: 'SW',
          mobile: input.mobileE164,
          warehouse: undefined,
        };
      }
      const res = await createAdminAccount({
        role: ACCOUNT_API_ROLE[input.role],
        fullName: input.fullName,
        mobile: input.mobileE164,
      });
      return {
        userId: res.userId,
        adminCode: res.adminCode,
        fullName: res.fullName,
        role: input.role,
        mobile: input.mobileE164,
        warehouse: undefined,
      };
    },
  });

  const disableMutation = useAdminMutation<string, AdminAccountStatusDto>({
    mutationFn: (id) => disableAdminAccount(id),
  });

  const handleRoleSelect = (roleKey: AdminRoleType, allowed: boolean) => {
    if (isEditing) return;
    if (!allowed) {
      Alert.alert(t('adminAccount.restricted.title'), t('adminAccount.restricted.body'));
      return;
    }
    createMutation.reset();
    setPickedRole(roleKey);
    if (roleKey !== 'SW') setWarehouseId(undefined);
  };

  const handleSave = () => {
    // Editing has no server route (no update endpoint exists), so there is nothing to save: the
    // button is disabled and this is never reached; it must never report an update that was not sent.
    if (isEditing || zoneBlocked || !roleGrantable || createMutation.isPending) return;
    if (!fullName.trim()) {
      Alert.alert(t('adminAccount.validation.title'), t('adminAccount.validation.name'));
      return;
    }
    const digits = nationalDigits(mobile);
    const mobileE164 = `${MOBILE_COUNTRY_CODE}${digits}`;
    if (digits.length !== MOBILE_DIGITS || !ADMIN_MOBILE_PATTERN.test(mobileE164)) {
      Alert.alert(t('adminAccount.validation.title'), t('adminAccount.validation.mobile'));
      return;
    }
    if (selectedRole === 'SW' && warehouseId === undefined) {
      Alert.alert(t('adminAccount.validation.title'), t('adminAccount.validation.warehouse'));
      return;
    }
    if (selectedRole !== 'SA' && selectedRole !== 'TA' && selectedRole !== 'SW') return;
    const sentWarehouse = warehouseName;
    createMutation.mutate(
      { role: selectedRole, fullName: fullName.trim(), mobileE164, warehouseId },
      // Only a real 201 gets here: the credentials modal is the success state.
      { onSuccess: (res) => setCreated({ ...res, warehouse: sentWarehouse }) },
    );
  };

  const handleFinishCreate = () => {
    const account = created;
    setCreated(null);
    if (account === null) return;
    onSuccess?.({
      id: account.userId,
      fullName: account.fullName,
      mobile: nationalDigits(account.mobile),
      role: account.role,
      warehouse: account.warehouse,
      status: 'ACTIVE',
    });
    onBack?.();
  };

  const canDisable = can(DISABLE_CODE);
  const handleToggleDisable = () => {
    // Only DISABLE exists on the server; there is no re-enable route.
    if (status === 'DISABLED' || !canDisable || disableMutation.isPending) return;
    const id = initialData?.id;
    if (id === undefined) return;
    Alert.alert(
      t('adminAccount.disable.confirmTitle'),
      t('adminAccount.disable.confirmBody', { name: fullName }),
      [
        { text: t('adminAccount.disable.cancel'), style: 'cancel' },
        {
          text: t('adminAccount.disable.confirmAction'),
          style: 'destructive',
          onPress: () => {
            disableMutation.mutate(id, {
              // Only a real 200: the status shown is the server's, not an assumption.
              onSuccess: (res) => {
                setStatus(res.status);
                Alert.alert(t('adminAccount.disable.doneTitle'), t('adminAccount.disable.doneBody', { name: res.fullName }));
              },
            });
          },
        },
      ],
    );
  };

  const isDisabledAccount = status === 'DISABLED';
  const primaryDisabled = isEditing || zoneBlocked || !roleGrantable || createMutation.isPending;
  const disableUnavailable = isDisabledAccount || !canDisable || disableMutation.isPending;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={ADMIN_PALETTE.pageBg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AdminBackChevronIcon />
          </TouchableOpacity>

          {onViewDirectory && (
            <TouchableOpacity
              style={styles.directoryBtn}
              onPress={onViewDirectory}
              activeOpacity={0.7}
            >
              <Text style={styles.directoryBtnText}>All Admins</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>
            {isEditing ? 'Manage Admin Account' : 'Create Admin Account'}
          </Text>
          <Text style={styles.screenSubtitle}>Hierarchy rule applies — see below</Text>
        </View>

        {/* Hierarchy Rule Card */}
        <View style={styles.ruleCard}>
          <Text style={styles.ruleCardTitle}>Who can create whom</Text>

          <View style={styles.ruleItemRow}>
            <View style={styles.ruleBadge}>
              <Text style={styles.ruleBadgeText}>1</Text>
            </View>
            <Text style={styles.ruleItemText}>
              <Text style={styles.ruleItemBold}>Super Admin</Text> creates SA, TA, and MW
            </Text>
          </View>

          <View style={styles.ruleItemRow}>
            <View style={styles.ruleBadge}>
              <Text style={styles.ruleBadgeText}>2</Text>
            </View>
            <Text style={styles.ruleItemText}>
              <Text style={styles.ruleItemBold}>TOHFA Admin</Text> creates FA and SW
            </Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Full name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <UserIcon />
              </View>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Anitha Raghavan"
                placeholderTextColor={ADMIN_PALETTE.textMuted}
                autoCapitalize="words"
                editable={!isEditing}
              />
            </View>
          </View>

          {/* Mobile number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Mobile number</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <PhoneIcon />
              </View>
              <Text style={styles.countryCodePrefix}>+91</Text>
              <TextInput
                style={[styles.input, { paddingLeft: 4 }]}
                value={mobile}
                onChangeText={setMobile}
                placeholder="98765 43210"
                placeholderTextColor={ADMIN_PALETTE.textMuted}
                keyboardType="phone-pad"
                maxLength={14}
                editable={!isEditing}
              />
            </View>
          </View>

          {/* Assign role */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Assign role</Text>
            <View style={styles.roleSegmentRow}>
              {roleOptions.map((role) => {
                const isSelected = selectedRole === role.key;
                const isAllowed = role.allowed;

                return (
                  <TouchableOpacity
                    key={role.key}
                    style={[
                      styles.roleSegmentBtn,
                      isSelected && styles.roleSegmentBtnActive,
                      !isAllowed && styles.roleSegmentBtnDisabled,
                    ]}
                    onPress={() => handleRoleSelect(role.key, isAllowed)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !isAllowed, selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.roleSegmentText,
                        isSelected && styles.roleSegmentTextActive,
                        !isAllowed && styles.roleSegmentTextDisabled,
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Helper Caption */}
            <Text style={styles.roleHelperCaption}>
              {!allRolesGrantable
                ? t('adminAccount.roleHelper.restricted')
                : 'As Super Admin, you can provision Super Admin (SA), Tohfa Admin (TA), Field Admin (FA), and Sub Warehouse (SW).'}
            </Text>
          </View>

          {/* Assigned warehouse (if SW) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Assigned warehouse (if SW)</Text>
            <TouchableOpacity
              style={[
                styles.selectInputContainer,
                (selectedRole !== 'SW' || isEditing) && styles.selectInputDisabled,
              ]}
              onPress={() => {
                if (selectedRole === 'SW' && !isEditing) {
                  setShowWarehouseModal(true);
                }
              }}
              activeOpacity={selectedRole === 'SW' && !isEditing ? 0.7 : 1}
            >
              <Text
                style={[
                  styles.selectInputText,
                  (selectedRole !== 'SW' || isEditing) && styles.selectInputTextDisabled,
                ]}
                numberOfLines={1}
              >
                {selectedRole === 'SW'
                  ? (warehouseName ?? t('adminAccount.warehouse.placeholder'))
                  : 'Not applicable for ' + selectedRole}
              </Text>
              <ChevronDownIcon color={selectedRole === 'SW' ? ADMIN_PALETTE.textSecondary : ADMIN_PALETTE.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Info Notice Box */}
          <View style={styles.infoNoticeBox}>
            <View style={styles.infoNoticeIcon}>
              <LockIcon />
            </View>
            <Text style={styles.infoNoticeText}>{t('adminAccount.create.infoNotice')}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionBlock}>
            <TouchableOpacity
              style={[styles.primaryButton, primaryDisabled && styles.actionUnavailable]}
              onPress={handleSave}
              disabled={primaryDisabled}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ disabled: primaryDisabled, busy: createMutation.isPending }}
            >
              <CheckCircleIcon size={19} />
              <Text style={styles.primaryButtonText}>
                {createMutation.isPending ? t('adminAccount.create.saving') : isEditing ? 'Save Changes' : 'Create Account'}
              </Text>
            </TouchableOpacity>
            {isEditing ? <Text style={styles.noteText}>{t('adminAccount.edit.unavailable')}</Text> : null}
            {zoneBlocked ? <Text style={styles.noteText}>{t('adminAccount.create.zoneUnavailable')}</Text> : null}
            {createMutation.error !== null ? (
              <Text style={styles.errorText}>{t(conflictAwareErrorKey(createMutation.error, 'adminAccount.error.conflict'))}</Text>
            ) : null}

            {isEditing && (
              <TouchableOpacity
                style={[
                  styles.disableButton,
                  isDisabledAccount && styles.enableButton,
                  disableUnavailable && styles.actionUnavailable,
                ]}
                onPress={handleToggleDisable}
                disabled={disableUnavailable}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ disabled: disableUnavailable, busy: disableMutation.isPending }}
              >
                <BanIcon color={isDisabledAccount ? ADMIN_PALETTE.successText : ADMIN_PALETTE.dangerText} />
                <Text
                  style={[
                    styles.disableButtonText,
                    isDisabledAccount && styles.enableButtonText,
                  ]}
                >
                  {disableMutation.isPending
                    ? t('adminAccount.disable.saving')
                    : isDisabledAccount
                      ? 'Reactivate This Account'
                      : 'Disable This Account'}
                </Text>
              </TouchableOpacity>
            )}
            {isEditing && isDisabledAccount ? <Text style={styles.noteText}>{t('adminAccount.reactivate.unavailable')}</Text> : null}
            {isEditing && !isDisabledAccount && !canDisable ? (
              <Text style={styles.noteText}>{t('adminAccount.disable.noPermission')}</Text>
            ) : null}
            {disableMutation.error !== null ? (
              <Text style={styles.errorText}>{t(conflictAwareErrorKey(disableMutation.error, 'adminAccount.error.lastSuperAdmin'))}</Text>
            ) : null}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Warehouse Selector Modal */}
      <Modal
        visible={showWarehouseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWarehouseModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Assigned Warehouse</Text>
            <Text style={styles.modalSubtitle}>Choose the regional hub or sub-warehouse for this admin</Text>

            <View style={styles.modalList}>
              {warehouses.isLoading ? (
                <Text style={styles.noteText}>{t('adminAccount.warehouse.loading')}</Text>
              ) : warehouses.error !== null && warehouses.error !== undefined ? (
                <Text style={styles.errorText}>{t(adminErrorKey(warehouses.error))}</Text>
              ) : subWarehouses.length === 0 ? (
                <Text style={styles.noteText}>{t('adminAccount.warehouse.empty')}</Text>
              ) : (
                subWarehouses.map((opt) => (
                  <TouchableOpacity
                    key={opt.warehouseId}
                    style={[
                      styles.modalOptionRow,
                      warehouseId === opt.warehouseId && styles.modalOptionRowSelected,
                    ]}
                    onPress={() => {
                      setWarehouseId(opt.warehouseId);
                      setShowWarehouseModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        warehouseId === opt.warehouseId && styles.modalOptionTextSelected,
                      ]}
                    >
                      {opt.warehouseName}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowWarehouseModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Created Credentials Modal: opens only from a real 201 */}
      <Modal
        visible={created !== null}
        transparent
        animationType="slide"
        onRequestClose={handleFinishCreate}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.successIconCircle}>
              <CheckCircleIcon color="#15803D" size={32} />
            </View>
            <Text style={styles.modalTitle}>Admin Account Created</Text>
            <Text style={styles.modalSubtitle}>
              {t('adminAccount.created.subtitle', { name: created?.fullName ?? '', role: created?.role ?? '' })}
            </Text>

            <View style={styles.credsCard}>
              <View style={styles.credRow}>
                <Text style={styles.credLabel}>Mobile / User ID</Text>
                <Text style={styles.credValue}>
                  {MOBILE_COUNTRY_CODE} {nationalDigits(created?.mobile ?? '')}
                </Text>
              </View>
              <View style={styles.credDivider} />
              <View style={styles.credRow}>
                <Text style={styles.credLabel}>{t('adminAccount.created.adminCode')}</Text>
                <Text style={[styles.credValue, { color: ADMIN_PALETTE.primaryOrange, fontWeight: '800' }]}>
                  {created?.adminCode ?? ''}
                </Text>
              </View>
            </View>

            <Text style={styles.credsNotice}>{t('adminAccount.created.notice')}</Text>
            <Text style={styles.credsNotice}>{t('adminAccount.created.directoryNote')}</Text>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleFinishCreate}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryBtnText}>Done & Return</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ADMIN_PALETTE.pageBg,
  },
  container: {
    flex: 1,
    backgroundColor: ADMIN_PALETTE.pageBg,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ADMIN_PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  directoryBtn: {
    backgroundColor: ADMIN_PALETTE.primaryOrangeLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.primaryOrangeBorder,
  },
  directoryBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.primaryOrange,
  },

  // Title Block
  titleBlock: {
    marginBottom: 18,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ADMIN_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: ADMIN_PALETTE.textSecondary,
    lineHeight: 18,
  },

  // Rule Card
  ruleCard: {
    backgroundColor: '#FFFDFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.primaryOrangeBorder,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  ruleCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: ADMIN_PALETTE.textPrimary,
    marginBottom: 12,
  },
  ruleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ADMIN_PALETTE.primaryOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  ruleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ADMIN_PALETTE.primaryOrange,
  },
  ruleItemText: {
    fontSize: 12.5,
    color: ADMIN_PALETTE.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  ruleItemBold: {
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
  },

  // Form Section
  formSection: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 8,
  },
  countryCodePrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: ADMIN_PALETTE.textPrimary,
    paddingVertical: 0,
  },

  // Role Segment Row
  roleSegmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  roleSegmentBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: ADMIN_PALETTE.inactivePillBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleSegmentBtnActive: {
    backgroundColor: ADMIN_PALETTE.primaryOrange,
    borderColor: ADMIN_PALETTE.primaryOrange,
    shadowColor: ADMIN_PALETTE.primaryOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  roleSegmentBtnDisabled: {
    backgroundColor: '#F3EFE9',
    opacity: 0.55,
  },
  roleSegmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: ADMIN_PALETTE.inactivePillText,
  },
  roleSegmentTextActive: {
    color: '#FFFFFF',
  },
  roleSegmentTextDisabled: {
    color: ADMIN_PALETTE.textMuted,
  },
  roleHelperCaption: {
    fontSize: 11.5,
    color: ADMIN_PALETTE.textSecondary,
    lineHeight: 16,
    marginTop: 4,
  },

  // Select Input
  selectInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    paddingHorizontal: 14,
    height: 50,
  },
  selectInputDisabled: {
    backgroundColor: '#FAF8F5',
  },
  selectInputText: {
    fontSize: 13.5,
    color: ADMIN_PALETTE.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  selectInputTextDisabled: {
    color: ADMIN_PALETTE.textMuted,
  },

  // Info Notice Box
  infoNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: ADMIN_PALETTE.blueBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.blueBorder,
    marginTop: 4,
  },
  infoNoticeIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  infoNoticeText: {
    fontSize: 12,
    color: ADMIN_PALETTE.blueText,
    lineHeight: 17,
    flex: 1,
    fontWeight: '500',
  },

  // Action Buttons
  actionBlock: {
    marginTop: 12,
    gap: 10,
  },
  actionUnavailable: {
    opacity: 0.5,
  },
  noteText: {
    fontSize: 11.5,
    color: ADMIN_PALETTE.textSecondary,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12.5,
    color: ADMIN_PALETTE.dangerText,
    lineHeight: 17,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN_PALETTE.primaryOrange,
    borderRadius: 14,
    height: 52,
    gap: 8,
    shadowColor: ADMIN_PALETTE.primaryOrange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN_PALETTE.dangerBg,
    borderRadius: 14,
    height: 48,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.dangerBorder,
    gap: 8,
  },
  disableButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: ADMIN_PALETTE.dangerText,
  },
  enableButton: {
    backgroundColor: ADMIN_PALETTE.successBg,
    borderColor: '#86EFAC',
  },
  enableButtonText: {
    color: ADMIN_PALETTE.successText,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: ADMIN_PALETTE.textHeading,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: ADMIN_PALETTE.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 17,
  },
  modalList: {
    gap: 8,
    marginBottom: 16,
  },
  modalOptionRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: ADMIN_PALETTE.pageBg,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
  },
  modalOptionRowSelected: {
    backgroundColor: ADMIN_PALETTE.primaryOrangeLight,
    borderColor: ADMIN_PALETTE.primaryOrange,
  },
  modalOptionText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: ADMIN_PALETTE.textPrimary,
  },
  modalOptionTextSelected: {
    color: ADMIN_PALETTE.primaryOrange,
    fontWeight: '700',
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: ADMIN_PALETTE.textSecondary,
  },

  // Success Creds Modal
  successIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: ADMIN_PALETTE.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  credsCard: {
    backgroundColor: ADMIN_PALETTE.pageBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    marginBottom: 14,
  },
  credRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  credLabel: {
    fontSize: 12,
    color: ADMIN_PALETTE.textSecondary,
    fontWeight: '600',
  },
  credValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
  },
  credDivider: {
    height: 1,
    backgroundColor: ADMIN_PALETTE.borderSoft,
    marginVertical: 8,
  },
  credsNotice: {
    fontSize: 11.5,
    color: ADMIN_PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  modalPrimaryBtn: {
    backgroundColor: ADMIN_PALETTE.primaryOrange,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
