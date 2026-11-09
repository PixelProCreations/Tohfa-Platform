/**
 * Create / Edit Staff Profile Screen:
 * Shared between TOHFA Admin and Warehouse Admins with RBAC gating.
 *
 * Implements:
 * - Image 2: Role & Access Management with Account Access radio cards & Application Role dropdown list.
 * - Image 3: Employment Details section with disabled "Staff ID" ("Generated on save") & "Employee ID optional".
 * - Image 4: Personal Information with Profile photo, First/Middle/Last names, Date of Birth calendar popup,
 *            Gender dropdown list, Marital Status dropdown list, Father's/Guardian's Name.
 * - All dropdowns are in-place dropdown lists (no popups) styled with Admin Theme.
 * - Interactive Calendar popup for selecting any date.
 */
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../../theme';
import {
  BackArrowIcon,
  EmptyState,
  isAllWarehouses,
  SuccessCircleIcon,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  CalendarIcon,
  CheckmarkIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  UploadPhotoIcon,
} from './StaffParts';
import { hasStaffRosterAccess } from './StaffScreen';
import type { StaffMember, WarehouseScreenBaseProps } from './types';

export interface EditStaffProfileScreenProps extends WarehouseScreenBaseProps {
  role?: string | undefined;
  staff?: StaffMember | undefined;
  onSave: (updated: StaffMember) => void;
}

// ─── Dropdown Options ─────────────────────────────────────────────────────────
const GENDER_OPTIONS = ['Select...', 'Male', 'Female', 'Other', 'Prefer not to say'] as const;
const MARITAL_STATUS_OPTIONS = ['Select...', 'Single', 'Married', 'Divorced', 'Widowed'] as const;
const APPLICATION_ROLE_OPTIONS = [
  'Select...',
  'Warehouse Staff',
  'Sub Warehouse Admin',
  'Logistics Coordinator',
  'Inventory Manager',
  'TOHFA Admin',
] as const;
const WAREHOUSE_OPTIONS = [
  'Select...',
  'Main Warehouse, Ooty',
  'Coonoor Warehouse',
  'Kotagiri Warehouse',
  'Mettupalayam Warehouse',
] as const;
const STATUS_OPTIONS = ['Active', 'Inactive', 'Pending activation'] as const;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function EditStaffProfileScreen({
  scope,
  can,
  role: userRole,
  onBack,
  staff,
  onSave,
}: EditStaffProfileScreenProps) {
  const isEditing = Boolean(staff);
  const isDriver = staff?.type === 'driver';
  const isMain = isAllWarehouses(scope);
  const screenTitle = isEditing ? 'Edit account' : 'Create account';

  // ─── Form State ───────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(() => {
    if (staff?.firstName) return staff.firstName;
    if (staff?.name) return staff.name.split(' ')[0] || '';
    return '';
  });
  const [middleName, setMiddleName] = useState(staff?.middleName ?? '');
  const [lastName, setLastName] = useState(() => {
    if (staff?.lastName) return staff.lastName;
    if (staff?.name) {
      const parts = staff.name.split(' ');
      return parts.length > 1 ? parts.slice(1).join(' ') : '';
    }
    return '';
  });
  const [contact, setContact] = useState(staff?.phone ?? '');
  const [email, setEmail] = useState(staff?.email ?? '');
  const [dob, setDob] = useState(staff?.dob ?? (isEditing ? '12-04-1992' : ''));
  const [gender, setGender] = useState(staff?.gender ?? 'Select...');
  const [maritalStatus, setMaritalStatus] = useState(staff?.maritalStatus ?? 'Select...');
  const [guardianName, setGuardianName] = useState(staff?.guardianName ?? '');

  // Employment Details (Image 3)
  const [employeeId, setEmployeeId] = useState(staff?.employeeId ?? '');
  const [warehouseLocation, setWarehouseLocation] = useState(
    staff?.warehouseName ?? (scope.warehouseId ? 'Coonoor Warehouse' : 'Main Warehouse, Ooty')
  );
  const [joiningDate, setJoiningDate] = useState(staff?.joiningDate ?? '01-03-2026');
  const [vehicleDetails, setVehicleDetails] = useState(staff?.vehicleDetails ?? '');

  // Role & Access Management (Image 2)
  const [accountAccess, setAccountAccess] = useState<'login' | 'no_login'>(
    staff?.accountAccess ?? (isEditing && staff?.role?.includes('Admin') ? 'login' : 'no_login')
  );
  const [selectedRole, setSelectedRole] = useState<string>(
    staff?.role ?? 'Warehouse Staff'
  );
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Pending activation'>(
    staff?.status ?? 'Active'
  );
  const [loginEmail, setLoginEmail] = useState(staff?.loginEmail ?? staff?.email ?? '');

  // ─── Dropdown Toggles (In-place dropdown lists, no popup) ──────────────────
  type DropdownKey = 'gender' | 'marital' | 'warehouse' | 'appRole' | 'status' | null;
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);

  const toggleDropdown = (key: DropdownKey) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  // ─── Calendar Modal State (Image 4) ───────────────────────────────────────
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarTargetField, setCalendarTargetField] = useState<'dob' | 'joining'>('dob');
  const [calYear, setCalYear] = useState(1992);
  const [calMonth, setCalMonth] = useState(3); // 0-indexed: April
  const [selectedDay, setSelectedDay] = useState(12);

  const openCalendarFor = (fieldKey: 'dob' | 'joining') => {
    setCalendarTargetField(fieldKey);
    if (fieldKey === 'dob' && dob) {
      const parts = dob.split('-');
      if (parts.length === 3) {
        setSelectedDay(parseInt(parts[0] ?? '12', 10) || 12);
        setCalMonth(Math.max(0, (parseInt(parts[1] ?? '4', 10) || 4) - 1));
        setCalYear(parseInt(parts[2] ?? '1992', 10) || 1992);
      }
    } else if (fieldKey === 'joining' && joiningDate) {
      const parts = joiningDate.split('-');
      if (parts.length === 3) {
        setSelectedDay(parseInt(parts[0] ?? '1', 10) || 1);
        setCalMonth(Math.max(0, (parseInt(parts[1] ?? '3', 10) || 3) - 1));
        setCalYear(parseInt(parts[2] ?? '2026', 10) || 2026);
      }
    }
    setCalendarVisible(true);
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleApplyCalendarDate = () => {
    const dayStr = String(selectedDay).padStart(2, '0');
    const monthStr = String(calMonth + 1).padStart(2, '0');
    const formatted = `${dayStr}-${monthStr}-${calYear}`;
    if (calendarTargetField === 'dob') {
      setDob(formatted);
    } else {
      setJoiningDate(formatted);
    }
    setCalendarVisible(false);
  };

  // Compute days in current calendar month
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstWeekday = new Date(calYear, calMonth, 1).getDay();

  // ─── Roster Permission Check ──────────────────────────────────────────────
  if (!hasStaffRosterAccess(can, scope)) {
    return (
      <WalletScreen title={screenTitle} onBack={onBack}>
        <EmptyState
          title="Staff roster not available"
          subtitle="Your role does not include the warehouse staff roster."
        />
      </WalletScreen>
    );
  }

  // ─── Save / Submit ────────────────────────────────────────────────────────
  const handleSave = () => {
    const fullName = [firstName.trim(), middleName.trim(), lastName.trim()]
      .filter(Boolean)
      .join(' ') || (staff?.name ?? 'New Staff');

    if (!firstName.trim() && !staff?.name) {
      Alert.alert('Required Field', 'Please enter at least First Name.');
      return;
    }

    const updatedMember: StaffMember = {
      id: staff?.id ?? `stf-new-${Date.now()}`,
      name: fullName,
      staffId: staff?.staffId ?? 'STF-0024',
      type: selectedRole === 'Driver' ? 'driver' : 'warehouse',
      role: selectedRole === 'Select...' ? 'Warehouse Staff' : selectedRole,
      status: status,
      attendance: staff?.attendance ?? 'Present',
      phone: contact || staff?.phone || '+91 98765 43210',
      email: email || staff?.email,
      vehicleDetails: vehicleDetails || staff?.vehicleDetails,
      warehouseId: staff?.warehouseId ?? scope.warehouseId ?? 'WH-COON',
      warehouseName: warehouseLocation,
      joiningDate: joiningDate,
      firstName,
      middleName,
      lastName,
      dob,
      gender: gender !== 'Select...' ? gender : undefined,
      maritalStatus: maritalStatus !== 'Select...' ? maritalStatus : undefined,
      guardianName,
      employeeId,
      accountAccess,
      loginEmail,
    };

    onSave(updatedMember);
  };

  return (
    <WalletScreen
      title={screenTitle}
      onBack={onBack}
      footer={
        <View style={styles.dockedFooter}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.saveBtnText}>
              {isEditing ? 'Save Changes' : 'Create Account'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <ScrollView
        contentContainerStyle={[walletLayout.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Profile Photo Section (Image 4) ─── */}
        <View style={styles.cardSection}>
          <Text style={styles.fieldLabel}>
            Profile Photo <Text style={styles.optionalText}>optional</Text>
          </Text>
          <View style={styles.photoRow}>
            <View style={styles.photoAvatar}>
              <Text style={styles.photoAvatarText}>
                {firstName ? firstName[0]?.toUpperCase() : '?'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.uploadBtn}
              activeOpacity={0.75}
              onPress={() => Alert.alert('Upload Photo', 'Choose photo from gallery or take photo.')}
            >
              <UploadPhotoIcon size={18} color={adminColors.ink} />
              <Text style={styles.uploadBtnText}>Upload photo</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.photoHintText}>JPG or PNG, within the 5 MB limit.</Text>
        </View>

        {/* ─── Personal Information (Image 4) ─── */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeading}>Personal information</Text>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              First Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="e.g. Karthik"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          {/* Middle Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Middle Name <Text style={styles.optionalText}>optional</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={middleName}
              onChangeText={setMiddleName}
              placeholder="Enter middle name"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Last Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          {/* Date of Birth with Calendar Popup (Image 4) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Date of Birth <Text style={styles.optionalText}>optional</Text>
            </Text>
            <TouchableOpacity
              style={styles.datePickerInput}
              onPress={() => openCalendarFor('dob')}
              activeOpacity={0.8}
            >
              <Text style={[styles.datePickerValueText, !dob && styles.placeholderText]}>
                {dob || 'DD-MM-YYYY'}
              </Text>
              <CalendarIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Gender: Dropdown List Instead of Popup (Image 4) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <TouchableOpacity
              style={[styles.dropdownTrigger, openDropdown === 'gender' && styles.dropdownTriggerActive]}
              onPress={() => toggleDropdown('gender')}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownValueText, gender === 'Select...' && styles.placeholderText]}>
                {gender}
              </Text>
              <View style={{ transform: [{ rotate: openDropdown === 'gender' ? '180deg' : '0deg' }] }}>
                <ChevronDownIcon size={18} color={adminColors.muted} />
              </View>
            </TouchableOpacity>

            {openDropdown === 'gender' && (
              <View style={styles.inlineDropdownMenu}>
                {GENDER_OPTIONS.map((item, idx) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.inlineDropdownItem,
                      idx > 0 && styles.dropdownItemDivider,
                      gender === item && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setGender(item);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        gender === item && styles.dropdownItemTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {gender === item && item !== 'Select...' && (
                      <CheckmarkIcon size={16} color={adminColors.brand} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Marital Status: Dropdown List Instead of Popup (Image 4) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Marital Status</Text>
            <TouchableOpacity
              style={[styles.dropdownTrigger, openDropdown === 'marital' && styles.dropdownTriggerActive]}
              onPress={() => toggleDropdown('marital')}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownValueText, maritalStatus === 'Select...' && styles.placeholderText]}>
                {maritalStatus}
              </Text>
              <View style={{ transform: [{ rotate: openDropdown === 'marital' ? '180deg' : '0deg' }] }}>
                <ChevronDownIcon size={18} color={adminColors.muted} />
              </View>
            </TouchableOpacity>

            {openDropdown === 'marital' && (
              <View style={styles.inlineDropdownMenu}>
                {MARITAL_STATUS_OPTIONS.map((item, idx) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.inlineDropdownItem,
                      idx > 0 && styles.dropdownItemDivider,
                      maritalStatus === item && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setMaritalStatus(item);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        maritalStatus === item && styles.dropdownItemTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {maritalStatus === item && item !== 'Select...' && (
                      <CheckmarkIcon size={16} color={adminColors.brand} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Father's / Guardian's Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Father's / Guardian's Name <Text style={styles.optionalText}>optional</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={guardianName}
              onChangeText={setGuardianName}
              placeholder="Enter guardian name"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          {/* Mobile number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Mobile number <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Email <Text style={styles.optionalText}>optional</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. staff@tohfa.com"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>
        </View>

        {/* ─── 5 Employment Details (Image 3) ─── */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderWithBadge}>
            <View style={styles.badgeNumber}>
              <Text style={styles.badgeNumberText}>5</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>Employment Details</Text>
              <Text style={styles.sectionSubtext}>
                Choices come from configured TOHFA records. No salary or payroll is set here.
              </Text>
            </View>
          </View>

          {/* Staff ID Input Box (Image 3) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Staff ID</Text>
            <View style={styles.readonlyInputBox}>
              <Text style={styles.readonlyInputText}>
                {staff?.staffId ? staff.staffId : 'Generated on save'}
              </Text>
            </View>
          </View>

          {/* Employee ID optional (Image 3) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Employee ID <Text style={styles.optionalText}>optional</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={employeeId}
              onChangeText={setEmployeeId}
              placeholder="e.g. EMP-1029"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          {/* Assigned Warehouse Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Warehouse Location</Text>
            <TouchableOpacity
              style={[styles.dropdownTrigger, openDropdown === 'warehouse' && styles.dropdownTriggerActive]}
              onPress={() => toggleDropdown('warehouse')}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownValueText, warehouseLocation === 'Select...' && styles.placeholderText]}>
                {warehouseLocation}
              </Text>
              <View style={{ transform: [{ rotate: openDropdown === 'warehouse' ? '180deg' : '0deg' }] }}>
                <ChevronDownIcon size={18} color={adminColors.muted} />
              </View>
            </TouchableOpacity>

            {openDropdown === 'warehouse' && (
              <View style={styles.inlineDropdownMenu}>
                {WAREHOUSE_OPTIONS.map((item, idx) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.inlineDropdownItem,
                      idx > 0 && styles.dropdownItemDivider,
                      warehouseLocation === item && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setWarehouseLocation(item);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        warehouseLocation === item && styles.dropdownItemTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {warehouseLocation === item && item !== 'Select...' && (
                      <CheckmarkIcon size={16} color={adminColors.brand} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Joining Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Joining Date <Text style={styles.optionalText}>optional</Text>
            </Text>
            <TouchableOpacity
              style={styles.datePickerInput}
              onPress={() => openCalendarFor('joining')}
              activeOpacity={0.8}
            >
              <Text style={[styles.datePickerValueText, !joiningDate && styles.placeholderText]}>
                {joiningDate || 'DD-MM-YYYY'}
              </Text>
              <CalendarIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Vehicle Details if driver */}
          {(isDriver || selectedRole === 'Driver') && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicle Details</Text>
              <TextInput
                style={styles.textInput}
                value={vehicleDetails}
                onChangeText={setVehicleDetails}
                placeholder="e.g. TN 43 AB 1234"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
          )}
        </View>

        {/* ─── 6 Role & Access Management (Image 2) ─── */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderWithBadge}>
            <View style={styles.badgeNumber}>
              <Text style={styles.badgeNumberText}>6</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>Role & Access Management</Text>
              <Text style={styles.sectionSubtext}>
                What this person can do in TOHFA Admin. Limited to roles you may create.
              </Text>
            </View>
          </View>

          {/* Account Access Radio Options (Image 2) */}
          <Text style={[styles.inputLabel, { marginTop: adminSpacing.sm }]}>
            Account Access <Text style={styles.requiredStar}>*</Text>
          </Text>

          {/* Option 1: Application login */}
          <TouchableOpacity
            style={[
              styles.accessRadioCard,
              accountAccess === 'login' && styles.accessRadioCardActive,
            ]}
            onPress={() => setAccountAccess('login')}
            activeOpacity={0.85}
          >
            <View style={[styles.radioCircle, accountAccess === 'login' && styles.radioCircleActive]}>
              {accountAccess === 'login' && <View style={styles.radioInnerDot} />}
            </View>
            <View style={styles.radioTextWrap}>
              <Text style={styles.radioTitle}>Application login</Text>
              <Text style={styles.radioDesc}>
                An admin account with a role. Starts as Pending activation.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option 2: No application access */}
          <TouchableOpacity
            style={[
              styles.accessRadioCard,
              accountAccess === 'no_login' && styles.accessRadioCardActive,
            ]}
            onPress={() => setAccountAccess('no_login')}
            activeOpacity={0.85}
          >
            <View style={[styles.radioCircle, accountAccess === 'no_login' && styles.radioCircleActive]}>
              {accountAccess === 'no_login' && <View style={styles.radioInnerDot} />}
            </View>
            <View style={styles.radioTextWrap}>
              <Text style={styles.radioTitle}>No application access</Text>
              <Text style={styles.radioDesc}>
                A warehouse staff record without a login. Needs a warehouse.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Application Role: Dropdown List Instead of Popup (Image 2) */}
          <View style={[styles.inputGroup, { marginTop: adminSpacing.md }]}>
            <Text style={styles.inputLabel}>
              Application Role <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.dropdownTrigger, openDropdown === 'appRole' && styles.dropdownTriggerActive]}
              onPress={() => toggleDropdown('appRole')}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownValueText, selectedRole === 'Select...' && styles.placeholderText]}>
                {selectedRole}
              </Text>
              <View style={{ transform: [{ rotate: openDropdown === 'appRole' ? '180deg' : '0deg' }] }}>
                <ChevronDownIcon size={18} color={adminColors.muted} />
              </View>
            </TouchableOpacity>

            {openDropdown === 'appRole' && (
              <View style={styles.inlineDropdownMenu}>
                {APPLICATION_ROLE_OPTIONS.map((item, idx) => {
                  const isSelectHeader = item === 'Select...';
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.inlineDropdownItem,
                        isSelectHeader && styles.dropdownItemHeader,
                        idx > 0 && styles.dropdownItemDivider,
                        selectedRole === item && !isSelectHeader && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedRole(item);
                        setOpenDropdown(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelectHeader && styles.dropdownItemHeaderText,
                          selectedRole === item && !isSelectHeader && styles.dropdownItemTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                      {selectedRole === item && !isSelectHeader && (
                        <CheckmarkIcon size={16} color={adminColors.brand} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <Text style={styles.roleSubtext}>
              Only roles you may create are listed. The server checks this again.
            </Text>
          </View>

          {/* Login Email / Username if application login */}
          {accountAccess === 'login' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Login Email / Username</Text>
              <TextInput
                style={styles.textInput}
                value={loginEmail}
                onChangeText={setLoginEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="e.g. karthik@tohfa.com"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
          )}

          {/* Account Status Dropdown List */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Status</Text>
            <TouchableOpacity
              style={[styles.dropdownTrigger, openDropdown === 'status' && styles.dropdownTriggerActive]}
              onPress={() => toggleDropdown('status')}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownValueText}>{status}</Text>
              <View style={{ transform: [{ rotate: openDropdown === 'status' ? '180deg' : '0deg' }] }}>
                <ChevronDownIcon size={18} color={adminColors.muted} />
              </View>
            </TouchableOpacity>

            {openDropdown === 'status' && (
              <View style={styles.inlineDropdownMenu}>
                {STATUS_OPTIONS.map((item, idx) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.inlineDropdownItem,
                      idx > 0 && styles.dropdownItemDivider,
                      status === item && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setStatus(item);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        status === item && styles.dropdownItemTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {status === item && (
                      <CheckmarkIcon size={16} color={adminColors.brand} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ─── Interactive Calendar Popup Modal (Image 4) ─── */}
      <Modal
        visible={calendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalCard}>
            {/* Modal Header */}
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>
                {calendarTargetField === 'dob' ? 'Select Date of Birth' : 'Select Date'}
              </Text>
              <TouchableOpacity
                onPress={() => setCalendarVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <CloseIcon size={20} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View style={styles.monthNavRow}>
              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
              >
                <ChevronLeftIcon size={16} color={adminColors.brandDeep} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {`${MONTH_NAMES[calMonth]} ${calYear}`}
              </Text>
              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={handleNextMonth}
                activeOpacity={0.7}
              >
                <ChevronRightIcon size={16} color={adminColors.brandDeep} />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((w, index) => (
                <View key={`wd-${index}`} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{w}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.daysGrid}>
              {Array.from({ length: firstWeekday }).map((_, index) => (
                <View key={`empty-${index}`} style={styles.dayCell} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const dayNum = index + 1;
                const isSelected = dayNum === selectedDay;
                return (
                  <TouchableOpacity
                    key={dayNum}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                    onPress={() => setSelectedDay(dayNum)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        isSelected && styles.dayNumberTextSelected,
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal Buttons */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCalendarVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={handleApplyCalendarDate}
                activeOpacity={0.85}
              >
                <Text style={styles.modalApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </WalletScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const INPUT_HEIGHT = 48;

const styles = StyleSheet.create({
  cardSection: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontSize: 16,
  },
  sectionSubtext: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionHeaderWithBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  badgeNumber: {
    width: 28,
    height: 28,
    borderRadius: adminRadius.md,
    backgroundColor: '#FDF2E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  badgeNumberText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontSize: 14,
  },
  fieldLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  inputLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 13,
    marginBottom: 6,
  },
  inputGroup: {
    marginBottom: adminSpacing.md,
  },
  requiredStar: {
    color: adminColors.danger.text,
  },
  optionalText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '400',
  },
  placeholderText: {
    color: adminColors.placeholder,
  },
  textInput: {
    ...adminType.body,
    height: INPUT_HEIGHT,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    color: adminColors.ink,
  },

  // Readonly input box for Staff ID (Image 3)
  readonlyInputBox: {
    height: INPUT_HEIGHT,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    justifyContent: 'center',
  },
  readonlyInputText: {
    ...adminType.body,
    color: adminColors.muted,
    fontStyle: 'normal',
  },

  // Date Picker trigger with calendar icon (Image 4)
  datePickerInput: {
    height: INPUT_HEIGHT,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerValueText: {
    ...adminType.body,
    color: adminColors.ink,
  },

  // Dropdown Triggers (Inline lists, no popup)
  dropdownTrigger: {
    height: INPUT_HEIGHT,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerActive: {
    borderColor: adminColors.brand,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownValueText: {
    ...adminType.body,
    color: adminColors.ink,
  },

  // Inline Dropdown Menu (Directly under the trigger as in Image 2)
  inlineDropdownMenu: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: adminColors.border,
    borderBottomLeftRadius: adminRadius.md,
    borderBottomRightRadius: adminRadius.md,
    ...adminShadow.sm,
    overflow: 'hidden',
  },
  inlineDropdownItem: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemHeader: {
    backgroundColor: '#555555',
  },
  dropdownItemHeaderText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dropdownItemActive: {
    backgroundColor: '#FFF7ED',
  },
  dropdownItemDivider: {
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  dropdownItemText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
  },
  dropdownItemTextActive: {
    color: adminColors.brand,
    fontWeight: '600',
  },
  roleSubtext: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 6,
    lineHeight: 16,
  },

  // Photo Upload Row (Image 4)
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.lg,
    marginVertical: adminSpacing.sm,
  },
  photoAvatar: {
    width: 60,
    height: 60,
    borderRadius: adminRadius.full,
    backgroundColor: '#FDEEE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAvatarText: {
    ...adminType.title,
    color: adminColors.brandDeep,
    fontSize: 22,
    fontWeight: '700',
  },
  uploadBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.card,
  },
  uploadBtnText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
    fontSize: 14,
  },
  photoHintText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },

  // Account Access Radio Cards (Image 2)
  accessRadioCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    marginTop: adminSpacing.sm,
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  accessRadioCardActive: {
    borderColor: adminColors.brand,
    backgroundColor: '#FFFBF7',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: adminColors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleActive: {
    borderColor: adminColors.brand,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: adminColors.brand,
  },
  radioTextWrap: {
    flex: 1,
  },
  radioTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
  },
  radioDesc: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
    lineHeight: 18,
  },

  // Docked Footer
  dockedFooter: {
    padding: adminSpacing.md,
    flexDirection: 'row',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  saveBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
    fontSize: 15,
  },
  cancelBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 15,
  },

  // Calendar Popup Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  calendarModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.lg,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  calendarModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 16,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.xs,
  },
  navArrowBtn: {
    padding: adminSpacing.xs,
    borderRadius: adminRadius.full,
  },
  calendarMonthText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    fontSize: 15,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  weekdayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.full,
  },
  dayNumberText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
  },
  dayNumberTextSelected: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.lg,
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    ...adminType.body,
    color: adminColors.muted,
    fontWeight: '600',
  },
  modalApplyBtn: {
    flex: 1,
    height: 42,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '600',
  },
});
