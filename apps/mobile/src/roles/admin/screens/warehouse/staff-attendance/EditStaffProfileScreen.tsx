/**
 * Edit Staff Profile: form -> confirm -> success, for a driver or a warehouse
 * staff member.
 *
 * Gate (FINAL_LIST 119): entered only from Staff Detail, behind
 * `warehouse.staff.list_view`; the screen checks the code again. That code is
 * read-only and docs/rbac.json has no code for editing a roster member, so the
 * save is a local mock until one exists (SPEC_GAPS W4t-1; no code invented).
 * The "role/permission fields are illustrative" note stays.
 *
 * Absorbs Main MainWarehouseEditStaffScreen (pair M14-S02E): for the Main view
 * the name and contact fields are editable (the Sub design shows them locked)
 * and the success step carries Main's "profile information has been updated"
 * line.
 */
// Design id: M14-S02E
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  BackArrowIcon,
  CheckIcon,
  EmptyState,
  InfoNote,
  isAllWarehouses,
  SuccessCircleIcon,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { ChevronDownIcon, SaveIcon } from './StaffParts';
import { STAFF_ROSTER_CODE } from './StaffScreen';
import type { StaffMember, WarehouseScreenBaseProps } from './types';

type EditStep = 'form' | 'confirm' | 'success';

export interface EditStaffProfileScreenProps extends WarehouseScreenBaseProps {
  staff?: StaffMember | undefined;
  /** "Back to Staff List" on the success step, with the edited member. */
  onSave: (updated: StaffMember) => void;
}

export function EditStaffProfileScreen({ scope, can, onBack, staff, onSave }: EditStaffProfileScreenProps) {
  const isDriver = staff?.type === 'driver';
  const isMain = isAllWarehouses(scope);
  const kind = isDriver ? 'Driver' : 'Staff';
  const titleText = `Edit ${kind} Profile`;
  const nameLabel = `${kind} Name`;

  const [step, setStep] = useState<EditStep>('form');
  const [name, setName] = useState(staff?.name ?? '');
  const [contact, setContact] = useState(staff?.phone ?? '');
  const [status, setStatus] = useState<'Active' | 'Inactive'>(staff?.status ?? 'Active');
  const [vehicleDetails, setVehicleDetails] = useState(staff?.vehicleDetails ?? '');
  const [statusOpen, setStatusOpen] = useState(false);

  if (!can(STAFF_ROSTER_CODE)) {
    return (
      <WalletScreen title={titleText} onBack={onBack}>
        <EmptyState title="Staff roster not available" subtitle="Your role does not include the warehouse staff roster." />
      </WalletScreen>
    );
  }

  const finish = () => {
    if (staff) {
      onSave({ ...staff, name, phone: contact, status, vehicleDetails: vehicleDetails || staff.vehicleDetails });
      return;
    }
    onSave({
      id: `staff-new-${name || 'member'}`,
      name,
      staffId: 'STF-NEW',
      type: isDriver ? 'driver' : 'warehouse',
      role: isDriver ? 'Driver' : 'Warehouse Staff',
      status,
      attendance: 'Present',
      phone: contact,
      warehouseId: scope.warehouseId,
    });
  };

  const headerBack = step === 'success' ? finish : step === 'confirm' ? () => setStep('form') : onBack;

  const field = (label: string, value: string, onChange: (v: string) => void, editable: boolean, placeholder: string) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        editable={editable}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={adminColors.placeholder}
      />
    </View>
  );

  if (step === 'success') {
    return (
      <WalletScreen
        title="Profile Updated"
        onBack={headerBack}
        footer={
          <WalletFooter>
            <WalletButton label="Back to Staff List" icon={<BackArrowIcon size={20} />} onPress={finish} />
          </WalletFooter>
        }
      >
        <View style={styles.successWrap}>
          <SuccessCircleIcon size={56} />
          <Text style={styles.successTitle}>{kind} Profile Updated</Text>
          <Text style={styles.successSubtitle}>{staff?.staffId ?? 'STF-NEW'}</Text>
          {isMain ? (
            <Text style={styles.successSubtitle}>{kind} profile information has been updated.</Text>
          ) : null}
        </View>
      </WalletScreen>
    );
  }

  if (step === 'confirm') {
    return (
      <WalletScreen title={titleText} onBack={headerBack}>
        <ScrollView contentContainerStyle={walletLayout.scrollContent}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Save Changes?</Text>
            <Text style={styles.confirmMessage}>The {kind.toLowerCase()} profile will be updated.</Text>
            <View style={styles.confirmButtons}>
              <WalletButton label="Save" icon={<CheckIcon />} onPress={() => setStep('success')} />
              <WalletButton label="Cancel" variant="neutral" onPress={() => setStep('form')} />
            </View>
          </View>
        </ScrollView>
      </WalletScreen>
    );
  }

  return (
    <WalletScreen
      title={titleText}
      onBack={headerBack}
      footer={
        <WalletFooter>
          <WalletButton label="Save" icon={<SaveIcon />} onPress={() => setStep('confirm')} />
          <WalletButton label="Cancel" variant="neutral" onPress={onBack} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent}>
        <Text style={styles.pageTitle}>{titleText}</Text>
        {field(nameLabel, name, setName, isMain, `Enter ${nameLabel.toLowerCase()}`)}
        {field('Contact', contact, setContact, isMain, 'Enter contact number')}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Status</Text>
          <TouchableOpacity
            style={styles.dropdown}
            activeOpacity={0.8}
            onPress={() => setStatusOpen((open) => !open)}
            accessibilityRole="button"
          >
            <Text style={styles.dropdownText}>{status}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {statusOpen ? (
            <View style={styles.dropdownMenu}>
              {(['Active', 'Inactive'] as const).map((option, index) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.dropdownItem, index > 0 && styles.dropdownItemDivider]}
                  onPress={() => {
                    setStatus(option);
                    setStatusOpen(false);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.dropdownText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        {isDriver ? field('Vehicle Details', vehicleDetails, setVehicleDetails, true, 'e.g. TN 43 AB 1234') : null}

        <InfoNote>
          {isDriver
            ? "Vehicle/license/document fields are shown here as illustrative — they're confirmed against the final driver data model before being made mandatory."
            : "Role and permission fields are shown here as illustrative — they're confirmed against the final staff data model before being made mandatory."}
        </InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}

const INPUT_HEIGHT = 46;

const styles = StyleSheet.create({
  pageTitle: { ...adminType.sectionHead, color: adminColors.brandDeep, marginTop: adminSpacing.sm, marginBottom: adminSpacing.md },
  inputGroup: { marginBottom: adminSpacing.md },
  label: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.sm },
  input: {
    ...adminType.body,
    height: INPUT_HEIGHT,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    color: adminColors.ink,
  },
  inputDisabled: { backgroundColor: adminColors.canvas, color: adminColors.muted },
  dropdown: {
    height: INPUT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
  },
  dropdownText: { ...adminType.body, color: adminColors.ink },
  dropdownMenu: {
    marginTop: adminSpacing.xs,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
  },
  dropdownItem: { paddingHorizontal: adminSpacing.md, paddingVertical: adminSpacing.md },
  dropdownItemDivider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  confirmCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginTop: adminSpacing.md,
  },
  confirmTitle: { ...adminType.title, color: adminColors.ink },
  confirmMessage: { ...adminType.body, color: adminColors.muted, marginTop: adminSpacing.sm },
  confirmButtons: { gap: adminSpacing.sm, marginTop: adminSpacing.lg },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: adminSpacing.xl, gap: adminSpacing.sm },
  successTitle: { ...adminType.title, color: adminColors.ink, textAlign: 'center' },
  successSubtitle: { ...adminType.body, color: adminColors.muted, textAlign: 'center' },
});
