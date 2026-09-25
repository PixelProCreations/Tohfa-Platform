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
  currentUserRole?: ('SUPER_ADMIN' | 'TOHFA_ADMIN') | undefined;
  onBack?: (() => void) | undefined;
  onSuccess?: ((account: AdminAccountData) => void) | undefined;
  onViewDirectory?: (() => void) | undefined;
}

const WAREHOUSE_OPTIONS = [
  'Not applicable for this role',
  'Ooty Central Main Warehouse (MW)',
  'Coonoor Sub-Warehouse (SW)',
  'Kotagiri Sub-Warehouse (SW)',
  'Gudalur Sub-Warehouse (SW)',
  'Ketti Valley Field Depot (SW)',
];

export function CreateAdminAccountScreen({
  initialData,
  currentUserRole = 'SUPER_ADMIN',
  onBack,
  onSuccess,
  onViewDirectory,
}: CreateAdminAccountScreenProps) {
  const isEditing = !!initialData?.id;

  const [fullName, setFullName] = useState(initialData?.fullName ?? '');
  const [mobile, setMobile] = useState(initialData?.mobile ?? '');
  const [selectedRole, setSelectedRole] = useState<AdminRoleType>(initialData?.role ?? 'FA');
  const [warehouse, setWarehouse] = useState(
    initialData?.warehouse ?? (initialData?.role === 'SW' ? 'Coonoor Sub-Warehouse (SW)' : 'Not applicable for this role')
  );
  const [status, setStatus] = useState<'ACTIVE' | 'PENDING' | 'DISABLED'>(initialData?.status ?? 'ACTIVE');

  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [createdModalVisible, setCreatedModalVisible] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{ password: string; mobile: string }>({
    password: '',
    mobile: '',
  });

  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  // Role availability rules
  const roleOptions: { key: AdminRoleType; label: string; allowed: boolean; name: string }[] = [
    { key: 'SA', label: 'SA', allowed: isSuperAdmin, name: 'Super Admin' },
    { key: 'TA', label: 'TA', allowed: isSuperAdmin, name: 'TOHFA Admin' },
    { key: 'FA', label: 'FA', allowed: true, name: 'Field / Finance Admin' },
    { key: 'SW', label: 'SW', allowed: true, name: 'Sub Warehouse Admin' },
  ];

  const handleRoleSelect = (roleKey: AdminRoleType, allowed: boolean) => {
    if (!allowed) {
      Alert.alert(
        'Permission Restricted',
        'Only Super Admin accounts can provision Super Admin (SA) and TOHFA Admin (TA) accounts.'
      );
      return;
    }
    setSelectedRole(roleKey);
    if (roleKey === 'SW') {
      if (warehouse === 'Not applicable for this role') {
        setWarehouse('Coonoor Sub-Warehouse (SW)');
      }
    } else {
      setWarehouse('Not applicable for this role');
    }
  };

  const handleSave = () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter the admin full name.');
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (selectedRole === 'SW' && warehouse === 'Not applicable for this role') {
      Alert.alert('Validation Error', 'Please assign a sub-warehouse location for SW admin.');
      return;
    }

    if (isEditing) {
      Alert.alert('Account Updated', `Admin account for ${fullName} has been updated.`);
      onSuccess?.({
        id: initialData.id,
        fullName,
        mobile: cleanMobile,
        role: selectedRole,
        warehouse,
        status,
      });
      onBack?.();
    } else {
      // Generate temporary secure password
      const tempPass = 'Tohfa@' + Math.floor(1000 + Math.random() * 9000);
      setGeneratedCreds({ password: tempPass, mobile: cleanMobile });
      setCreatedModalVisible(true);
    }
  };

  const handleFinishCreate = () => {
    setCreatedModalVisible(false);
    onSuccess?.({
      fullName,
      mobile: mobile.replace(/\D/g, ''),
      role: selectedRole,
      warehouse,
      status: 'ACTIVE',
    });
    onBack?.();
  };

  const handleToggleDisable = () => {
    const nextStatus = status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    Alert.alert(
      nextStatus === 'DISABLED' ? 'Disable Admin Account' : 'Reactivate Admin Account',
      `Are you sure you want to ${nextStatus === 'DISABLED' ? 'disable' : 'activate'} login access for ${fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextStatus === 'DISABLED' ? 'Disable Account' : 'Activate',
          style: nextStatus === 'DISABLED' ? 'destructive' : 'default',
          onPress: () => {
            setStatus(nextStatus);
            Alert.alert('Status Updated', `Admin account status is now ${nextStatus}.`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ADMIN_PALETTE.pageBg} />
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
              {!isSuperAdmin
                ? 'SA and TA are greyed out — your account (TOHFA Admin) cannot create those roles.'
                : 'As Super Admin, you can provision Super Admin (SA), Tohfa Admin (TA), Field Admin (FA), and Sub Warehouse (SW).'}
            </Text>
          </View>

          {/* Assigned warehouse (if SW) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Assigned warehouse (if SW)</Text>
            <TouchableOpacity
              style={[
                styles.selectInputContainer,
                selectedRole !== 'SW' && styles.selectInputDisabled,
              ]}
              onPress={() => {
                if (selectedRole === 'SW') {
                  setShowWarehouseModal(true);
                }
              }}
              activeOpacity={selectedRole === 'SW' ? 0.7 : 1}
            >
              <Text
                style={[
                  styles.selectInputText,
                  selectedRole !== 'SW' && styles.selectInputTextDisabled,
                ]}
                numberOfLines={1}
              >
                {selectedRole === 'SW' ? warehouse : 'Not applicable for ' + selectedRole}
              </Text>
              <ChevronDownIcon color={selectedRole === 'SW' ? ADMIN_PALETTE.textSecondary : ADMIN_PALETTE.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Info Notice Box */}
          <View style={styles.infoNoticeBox}>
            <View style={styles.infoNoticeIcon}>
              <LockIcon />
            </View>
            <Text style={styles.infoNoticeText}>
              A temporary password will be generated. The new admin sets a permanent one on first login.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionBlock}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <CheckCircleIcon size={19} />
              <Text style={styles.primaryButtonText}>
                {isEditing ? 'Save Changes' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity
                style={[
                  styles.disableButton,
                  status === 'DISABLED' && styles.enableButton,
                ]}
                onPress={handleToggleDisable}
                activeOpacity={0.85}
              >
                <BanIcon color={status === 'DISABLED' ? ADMIN_PALETTE.successText : ADMIN_PALETTE.dangerText} />
                <Text
                  style={[
                    styles.disableButtonText,
                    status === 'DISABLED' && styles.enableButtonText,
                  ]}
                >
                  {status === 'DISABLED' ? 'Reactivate This Account' : 'Disable This Account'}
                </Text>
              </TouchableOpacity>
            )}
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
              {WAREHOUSE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalOptionRow,
                    warehouse === opt && styles.modalOptionRowSelected,
                  ]}
                  onPress={() => {
                    setWarehouse(opt);
                    setShowWarehouseModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      warehouse === opt && styles.modalOptionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
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

      {/* Created Credentials Modal */}
      <Modal
        visible={createdModalVisible}
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
              Temporary sign-in credentials for {fullName} ({selectedRole})
            </Text>

            <View style={styles.credsCard}>
              <View style={styles.credRow}>
                <Text style={styles.credLabel}>Mobile / User ID</Text>
                <Text style={styles.credValue}>+91 {generatedCreds.mobile}</Text>
              </View>
              <View style={styles.credDivider} />
              <View style={styles.credRow}>
                <Text style={styles.credLabel}>Temporary Password</Text>
                <Text style={[styles.credValue, { color: ADMIN_PALETTE.primaryOrange, fontWeight: '800' }]}>
                  {generatedCreds.password}
                </Text>
              </View>
            </View>

            <Text style={styles.credsNotice}>
              An SMS with sign-in instructions has been queued. The admin will be prompted to set a new password on initial sign-in.
            </Text>

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
