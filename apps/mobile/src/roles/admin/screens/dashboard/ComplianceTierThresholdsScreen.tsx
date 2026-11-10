/**
 * Compliance Tier Thresholds Screen / Alert Threshold Config Screen
 * Exact implementation of Image 5 / Image 4 right.
 * Supports configuring categories, trigger conditions, warehouse scoping,
 * and target notification roles.
 */
import React, { useState } from 'react';
import {
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

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../theme';
import {
  BackArrowIcon,
  BuildingWarehouseIcon,
  CashBillIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  GearSettingsIcon,
  HistoryClockIcon,
  PackageBoxIcon,
  RepeatIcon,
  ShoppingCartIcon,
  UserAvatarIcon,
} from '../../components/AdminIcons';
import { t } from '../../i18n';

export interface AlertThresholdData {
  id?: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  thresholdValue: string;
  thresholdUnit: string;
  appliesTo: 'all' | 'specific';
  notifyRoles: string[];
  isActive: boolean;
}

export interface ComplianceTierThresholdsScreenProps {
  initialData?: AlertThresholdData | undefined;
  can?: (permission: string) => boolean;
  onBack: () => void;
  onSave?: (data: AlertThresholdData) => void;
}

const CATEGORY_OPTIONS = [
  { label: 'Stock', icon: PackageBoxIcon },
  { label: 'Warehouse Capacity', icon: BuildingWarehouseIcon },
  { label: 'Stock Aging', icon: HistoryClockIcon },
  { label: 'No Stock Update', icon: RepeatIcon },
  { label: 'Product Quality', icon: CheckCircleIcon },
  { label: 'Farmer Operations', icon: UserAvatarIcon },
  { label: 'Customer Orders', icon: ShoppingCartIcon },
  { label: 'Finance & Payments', icon: CashBillIcon },
  { label: 'Audit & Compliance', icon: ClipboardListIcon },
  { label: 'System & Integration', icon: GearSettingsIcon },
];

const CONDITION_OPTIONS = [
  'Stock is less than or equal to',
  'Stock is greater than',
  'Capacity reaches above percentage',
  'Aging days exceed',
  'Audit score is below',
];

const VALUE_OPTIONS = ['25', '50', '100', '200', '500', '1000'];
const UNIT_OPTIONS = ['Kg', 'Boxes', 'Liters', 'Days', '%'];

const NOTIFY_ROLES = [
  'TOHFA Admins',
  'Warehouse Admins',
  'Farmer Admins',
  'Customer',
  'Farmer',
];

export function ComplianceTierThresholdsScreen({
  initialData,
  onBack,
  onSave,
}: ComplianceTierThresholdsScreenProps) {
  const [name, setName] = useState(initialData?.name || 'Low Stock Alert');
  const [description, setDescription] = useState(
    initialData?.description ||
      'Get alerted when the stock of a product falls below the configured minimum level'
  );
  const [category, setCategory] = useState(initialData?.category || 'Stock');
  const [condition, setCondition] = useState(
    initialData?.condition || 'Stock is less than or equal to'
  );
  const [thresholdValue, setThresholdValue] = useState(
    initialData?.thresholdValue || '100'
  );
  const [thresholdUnit, setThresholdUnit] = useState(
    initialData?.thresholdUnit || 'Kg'
  );
  const [appliesTo, setAppliesTo] = useState<'all' | 'specific'>(
    initialData?.appliesTo || 'all'
  );
  const [notifyRoles, setNotifyRoles] = useState<string[]>(
    initialData?.notifyRoles || ['TOHFA Admins', 'Warehouse Admins']
  );
  const [isActive, setIsActive] = useState(
    initialData?.isActive !== undefined ? initialData.isActive : true
  );

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);
  const [showValueDropdown, setShowValueDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const toggleNotifyRole = (role: string) => {
    setNotifyRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        id: initialData?.id || `threshold-${Date.now()}`,
        name,
        description,
        category,
        condition,
        thresholdValue,
        thresholdUnit,
        appliesTo,
        notifyRoles,
        isActive,
      });
    }
    onBack();
  };

  const selectedCategoryObj = CATEGORY_OPTIONS.find((c) => c.label === category) || CATEGORY_OPTIONS[0]!;
  const CategoryIconComponent = selectedCategoryObj.icon;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <BackArrowIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compliance Tier Thresholds</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Basic information */}
        <Text style={styles.sectionTitle}>1. Basic information</Text>
        <View style={styles.sectionBody}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Alert Name *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Alert Name"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={250}
              placeholder="Description"
              placeholderTextColor={adminColors.placeholder}
            />
            <Text style={styles.charCounter}>{`${description.length} / 250`}</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category *</Text>
            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownLeft}>
                <CategoryIconComponent size={18} color={adminColors.brand} />
                <Text style={styles.dropdownValue}>{category}</Text>
              </View>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Trigger Condition */}
        <Text style={styles.sectionTitle}>2. Trigger Condition</Text>
        <View style={styles.sectionBody}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Alert Condition *</Text>
            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => setShowConditionDropdown(!showConditionDropdown)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownValue}>{condition}</Text>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Threshold Value *</Text>
            <View style={styles.sideBySideRow}>
              <TouchableOpacity
                style={[styles.dropdownBox, styles.flexHalf]}
                onPress={() => setShowValueDropdown(!showValueDropdown)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{thresholdValue}</Text>
                <ChevronDownIcon size={16} color={adminColors.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dropdownBox, styles.flexHalf]}
                onPress={() => setShowUnitDropdown(!showUnitDropdown)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{thresholdUnit}</Text>
                <ChevronDownIcon size={16} color={adminColors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Applies to *</Text>
            <View style={styles.sideBySideRow}>
              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setAppliesTo('all')}
                activeOpacity={0.7}
              >
                <View style={[styles.radioOuter, appliesTo === 'all' && styles.radioOuterSelected]}>
                  {appliesTo === 'all' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>All Warehouses</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setAppliesTo('specific')}
                activeOpacity={0.7}
              >
                <View style={[styles.radioOuter, appliesTo === 'specific' && styles.radioOuterSelected]}>
                  {appliesTo === 'specific' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>Specific Warehouse</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. Notification Settings */}
        <Text style={styles.sectionTitle}>3. Notification Settings</Text>
        <View style={styles.sectionBody}>
          <Text style={styles.fieldLabel}>Notify to *</Text>
          <View style={styles.checkboxList}>
            {NOTIFY_ROLES.map((role) => {
              const isChecked = notifyRoles.includes(role);
              return (
                <TouchableOpacity
                  key={role}
                  style={styles.checkboxCard}
                  onPress={() => toggleNotifyRole(role)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkboxOuter, isChecked && styles.checkboxOuterSelected]}>
                    {isChecked && <CheckCircleIcon size={14} color={adminColors.onBrand} />}
                  </View>
                  <Text style={styles.checkboxLabel}>{role}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Alert Status */}
        <Text style={styles.sectionTitle}>4. Alert Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status</Text>
          <View style={styles.switchWrapper}>
            <Text style={styles.switchStateText}>{isActive ? 'Active' : 'Inactive'}</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: adminColors.border, true: adminColors.brand }}
              thumbColor={adminColors.onBrand}
            />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>Save Alert Threshold</Text>
        </TouchableOpacity>
      </View>

      {/* Category Dropdown Modal (Matching Image 5 Popup) */}
      <Modal
        visible={showCategoryDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryDropdown(false)}
        >
          <View style={styles.categoryMenuCard}>
            {CATEGORY_OPTIONS.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.categoryMenuItem,
                    idx < CATEGORY_OPTIONS.length - 1 && styles.categoryMenuItemBorder,
                  ]}
                  onPress={() => {
                    setCategory(item.label);
                    setShowCategoryDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <IconComp size={18} color={adminColors.brand} />
                  <Text style={styles.categoryMenuText}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Condition Dropdown Modal */}
      <Modal
        visible={showConditionDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConditionDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConditionDropdown(false)}
        >
          <View style={styles.selectionMenuCard}>
            {CONDITION_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={styles.selectionMenuItem}
                onPress={() => {
                  setCondition(c);
                  setShowConditionDropdown(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.selectionMenuText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Value Dropdown Modal */}
      <Modal
        visible={showValueDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowValueDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowValueDropdown(false)}
        >
          <View style={styles.selectionMenuCard}>
            {VALUE_OPTIONS.map((v) => (
              <TouchableOpacity
                key={v}
                style={styles.selectionMenuItem}
                onPress={() => {
                  setThresholdValue(v);
                  setShowValueDropdown(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.selectionMenuText}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Unit Dropdown Modal */}
      <Modal
        visible={showUnitDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUnitDropdown(false)}
        >
          <View style={styles.selectionMenuCard}>
            {UNIT_OPTIONS.map((u) => (
              <TouchableOpacity
                key={u}
                style={styles.selectionMenuItem}
                onPress={() => {
                  setThresholdUnit(u);
                  setShowUnitDropdown(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.selectionMenuText}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontWeight: '700',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  sectionBody: {
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  fieldGroup: {
    gap: adminSpacing.xs,
  },
  fieldLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    ...adminType.body,
    color: adminColors.ink,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingVertical: adminSpacing.sm,
  },
  charCounter: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'right',
    marginTop: 2,
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  dropdownValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '500',
  },
  sideBySideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  flexHalf: {
    flex: 1,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: adminColors.brand,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: adminColors.brand,
  },
  radioLabel: {
    ...adminType.body,
    color: adminColors.ink,
  },
  checkboxList: {
    gap: adminSpacing.xs,
  },
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    gap: adminSpacing.sm,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOuterSelected: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  checkboxLabel: {
    ...adminType.body,
    color: adminColors.ink,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 52,
    marginBottom: adminSpacing.lg,
  },
  statusLabel: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  switchStateText: {
    ...adminType.body,
    color: adminColors.brandDeep,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 80,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.5,
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  categoryMenuCard: {
    width: 260,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  categoryMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  categoryMenuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  categoryMenuText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  selectionMenuCard: {
    width: 260,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.xs,
    ...adminShadow.md,
  },
  selectionMenuItem: {
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
  },
  selectionMenuText: {
    ...adminType.body,
    color: adminColors.ink,
  },
});

