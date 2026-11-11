import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import type { StaffMember } from './types';

// ─── Local SVG Icons ──────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadSimpleIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 8l-5-5-5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="3" x2="12" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarOutlineIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RadioSelectedIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" />
      <Circle cx="12" cy="12" r="5" fill={color} />
    </Svg>
  );
}

function RadioUnselectedIcon({ size = 22, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function EyeIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EyeSlashIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface CreateStaffAccountScreenProps {
  onBack: () => void;
  onSave?: (staffData?: unknown) => void;
  onCancel?: () => void;
  staff?: StaffMember | null | undefined;
  role?: string | undefined;
}

export function CreateStaffAccountScreen({
  onBack,
  onSave,
  onCancel,
  staff,
  role,
}: CreateStaffAccountScreenProps) {
  const isEditing = Boolean(staff);

  // Parse name if editing
  const nameParts = staff?.name ? staff.name.split(' ') : [];
  const initialFirst = nameParts[0] || '';
  const initialMiddle = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
  const initialLast = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  // Section 1: Personal Details
  const [createStaffPhoto, setCreateStaffPhoto] = useState<string | null>(null);
  const [createStaffFirstName, setCreateStaffFirstName] = useState(initialFirst);
  const [createStaffMiddleName, setCreateStaffMiddleName] = useState(initialMiddle);
  const [createStaffLastName, setCreateStaffLastName] = useState(initialLast || '');
  const [createStaffDob, setCreateStaffDob] = useState('');
  const [createStaffGender, setCreateStaffGender] = useState('Select');
  const [createStaffMarital, setCreateStaffMarital] = useState('Select');
  const [createStaffGuardian, setCreateStaffGuardian] = useState('');
  const [createStaffNationality, setCreateStaffNationality] = useState('Indian');
  const [createStaffLanguage, setCreateStaffLanguage] = useState('Select');
  const [createStaffBloodGroup, setCreateStaffBloodGroup] = useState('Select');

  // Section 2: Contact Details
  const [createStaffMobile, setCreateStaffMobile] = useState(staff?.phone || '');
  const [createStaffAltMobile, setCreateStaffAltMobile] = useState('');
  const [createStaffEmail, setCreateStaffEmail] = useState(staff?.email || '');
  const [createStaffAddress, setCreateStaffAddress] = useState('');
  const [createStaffState, setCreateStaffState] = useState('Tamil Nadu');
  const [createStaffDistrict, setCreateStaffDistrict] = useState('Nilgiris');
  const [createStaffCity, setCreateStaffCity] = useState(staff?.warehouse || 'Ooty');
  const [createStaffPin, setCreateStaffPin] = useState('643001');

  // Section 3: ID Proof & Verification
  const [createStaffIdType, setCreateStaffIdType] = useState('Select...');
  const [createStaffIdNumber, setCreateStaffIdNumber] = useState('');
  const [createStaffIdName, setCreateStaffIdName] = useState('');

  // Section 4: Bank Account Details
  const [createStaffAccountHolder, setCreateStaffAccountHolder] = useState(staff?.name || '');
  const [createStaffBankName, setCreateStaffBankName] = useState('');
  const [createStaffAccountNumber, setCreateStaffAccountNumber] = useState('');
  const [createStaffConfirmAccount, setCreateStaffConfirmAccount] = useState('');
  const [createStaffIfsc, setCreateStaffIfsc] = useState('');
  const [createStaffBranch, setCreateStaffBranch] = useState('');
  const [createStaffAccountType, setCreateStaffAccountType] = useState('Select...');
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [createStaffBankProof, setCreateStaffBankProof] = useState<string | null>(null);

  // Section 5: Employment Details
  const [createStaffId] = useState(staff?.id || 'Generated on save');
  const [createStaffEmployeeId, setCreateStaffEmployeeId] = useState(staff?.id || '');
  const [createStaffJoiningDate, setCreateStaffJoiningDate] = useState('10-10-2026');
  const [createStaffEmploymentType, setCreateStaffEmploymentType] = useState('Full-time');
  const [createStaffDepartment, setCreateStaffDepartment] = useState('Warehouse Operations');
  const [createStaffDesignation, setCreateStaffDesignation] = useState(staff?.roleTitle || 'Loading & Sorting Staff');
  const [createStaffEmploymentStatus, setCreateStaffEmploymentStatus] = useState('Active');
  const [createStaffWorkLocation, setCreateStaffWorkLocation] = useState(staff?.warehouse || 'Main Warehouse, Ooty (WH-MAIN)');

  // Section 6: Role & Access Management
  const [createStaffAccountAccess, setCreateStaffAccountAccess] = useState<'login' | 'no_login'>('login');
  const [createStaffApplicationRole, setCreateStaffApplicationRole] = useState(staff?.roleTitle || 'Warehouse Staff');

  // Section 8: Emergency Contact
  const [createStaffEmergencyName, setCreateStaffEmergencyName] = useState('');
  const [createStaffEmergencyRel, setCreateStaffEmergencyRel] = useState('Select...');
  const [createStaffEmergencyPhone, setCreateStaffEmergencyPhone] = useState('');
  const [createStaffEmergencyAltPhone, setCreateStaffEmergencyAltPhone] = useState('');
  const [createStaffEmergencyAddress, setCreateStaffEmergencyAddress] = useState('');

  // Section 9: Document Uploads
  const [createStaffDocAddressProof, setCreateStaffDocAddressProof] = useState<string | null>(null);
  const [createStaffDocAppointmentLetter, setCreateStaffDocAppointmentLetter] = useState<string | null>(null);
  const [createStaffDocAgreement, setCreateStaffDocAgreement] = useState<string | null>(null);
  const [createStaffDocEducation, setCreateStaffDocEducation] = useState<string | null>(null);
  const [createStaffDocExperience, setCreateStaffDocExperience] = useState<string | null>(null);
  const [createStaffDocOther, setCreateStaffDocOther] = useState<string | null>(null);

  // Dropdown & Modal states
  const [openDropdownField, setOpenDropdownField] = useState<string | null>(null);
  const [showStaffDobCalendar, setShowStaffDobCalendar] = useState(false);
  const [staffDobYear, setStaffDobYear] = useState(1992);
  const [staffDobMonth, setStaffDobMonth] = useState(3);
  const [staffDobDay, setStaffDobDay] = useState(12);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const renderInlineDropdown = (
    fieldKey: string,
    options: readonly string[],
    currentVal: string,
    onSelect: (val: string) => void
  ) => {
    if (openDropdownField !== fieldKey) return null;
    return (
      <View style={styles.workforceInlineDropdownMenu}>
        {options.map((opt) => {
          const isSelectHeader = opt === 'Select' || opt === 'Select...';
          const isSelected = currentVal === opt && !isSelectHeader;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.workforceInlineDropdownItem,
                isSelected && styles.workforceInlineDropdownItemActive,
              ]}
              onPress={() => {
                onSelect(opt);
                setOpenDropdownField(null);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.workforceInlineDropdownItemText,
                  isSelected && styles.workforceInlineDropdownItemTextActive,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const handleCreateStaffAccount = () => {
    if (!createStaffFirstName.trim()) {
      Alert.alert('Required Field', 'Please enter the first name.');
      return;
    }
    if (!createStaffLastName.trim()) {
      Alert.alert('Required Field', 'Please enter the last name.');
      return;
    }
    if (!createStaffMobile.trim()) {
      Alert.alert('Required Field', 'Please enter a valid primary mobile number.');
      return;
    }
    if (!createStaffEmail.trim()) {
      Alert.alert('Required Field', 'Please enter an email address.');
      return;
    }

    const fullName = [createStaffFirstName.trim(), createStaffMiddleName.trim(), createStaffLastName.trim()]
      .filter(Boolean)
      .join(' ');

    const newStaffData = {
      id: isEditing ? staff?.id : `STF-${Math.floor(1000 + Math.random() * 9000)}`,
      name: fullName,
      phone: createStaffMobile,
      email: createStaffEmail,
      warehouse: createStaffWorkLocation,
      roleTitle: createStaffApplicationRole,
      type: createStaffApplicationRole.toLowerCase().includes('driver') ? 'driver' : 'warehouse',
      status: createStaffAccountAccess === 'login' ? 'Pending activation' : 'Active',
    };

    Alert.alert(
      isEditing ? 'Account Updated' : 'Account Created',
      `Staff account for "${fullName}" has been successfully ${isEditing ? 'updated' : 'created'}.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onSave) onSave(newStaffData);
            onBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.rootWrapper}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} translucent={false} />
      <SafeAreaView style={styles.topSafeArea} />
      <View style={styles.container}>
      {/* Header Banner matching Screenshot 1-5 */}
      <View style={styles.workforceHeaderBanner}>
        <View style={styles.workforceHeaderTitleRow}>
          <TouchableOpacity
            style={styles.workforceBackBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.workforceHeaderTitle}>
            {isEditing ? 'Edit account' : 'Create account'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.workforceCreateScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD 1: Personal Details */}
        <View style={styles.workforceCreateCard}>
          <View style={styles.workforceCardHeader}>
            <View style={styles.workforceCardHeaderLeft}>
              <View style={styles.workforceStepBadge}>
                <Text style={styles.workforceStepBadgeText}>1</Text>
              </View>
              <View style={styles.workforceCardHeaderTextCol}>
                <Text style={styles.workforceCreateCardTitle}>Personal Details</Text>
                <Text style={styles.workforceCreateCardSubtitle}>Basic details of the staff member.</Text>
              </View>
            </View>
          </View>
          <View style={styles.workforceCardDivider} />

          {/* Profile Photo optional */}
          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Profile Photo</Text>
              <Text style={styles.workforceOptionalText}>optional</Text>
            </View>
            <View style={styles.workforcePhotoRow}>
              <View style={styles.workforcePhotoPlaceholder}>
                <Text style={styles.workforcePhotoPlaceholderQuestion}>
                  {createStaffPhoto ? '✓' : '?'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.workforceUploadPhotoBtn}
                onPress={() => {
                  setCreateStaffPhoto('profile_photo.jpg');
                  Alert.alert('Photo Selected', 'Sample photo selected: profile_photo.jpg');
                }}
                activeOpacity={0.75}
              >
                <UploadSimpleIcon size={16} color={adminColors.ink} />
                <Text style={styles.workforceUploadPhotoBtnText}>
                  {createStaffPhoto ? 'Change photo' : 'Upload photo'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.workforceFormHelperText}>JPG or PNG, within the 5 MB limit.</Text>
          </View>

          {/* First Name * */}
          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>First Name</Text>
              <Text style={styles.requiredStar}> *</Text>
            </View>
            <TextInput
              style={styles.workforceFormInput}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              value={createStaffFirstName}
              onChangeText={setCreateStaffFirstName}
            />
          </View>

          {/* Middle Name optional */}
          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Middle Name</Text>
              <Text style={styles.workforceOptionalText}>optional</Text>
            </View>
            <TextInput
              style={styles.workforceFormInput}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              value={createStaffMiddleName}
              onChangeText={setCreateStaffMiddleName}
            />
          </View>

          {/* Last Name * */}
          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Last Name</Text>
              <Text style={styles.requiredStar}> *</Text>
            </View>
            <TextInput
              style={styles.workforceFormInput}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              value={createStaffLastName}
              onChangeText={setCreateStaffLastName}
            />
          </View>

          {/* Date of Birth optional */}
          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Date of Birth</Text>
              <Text style={styles.workforceOptionalText}>optional</Text>
            </View>
            <View style={styles.workforceInputWithIconRow}>
              <TextInput
                style={styles.workforceInputEmbedded}
                placeholder="dd-mm-yyyy"
                placeholderTextColor={adminColors.placeholder}
                value={createStaffDob}
                onChangeText={setCreateStaffDob}
              />
              <TouchableOpacity
                onPress={() => setShowStaffDobCalendar(true)}
                activeOpacity={0.7}
              >
                <CalendarOutlineIcon size={20} color={adminColors.brand} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Gender */}
          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Gender</Text>
            <TouchableOpacity
              style={styles.workforceFormSelect}
              onPress={() => setOpenDropdownField((prev) => (prev === 'gender' ? null : 'gender'))}
              activeOpacity={0.75}
            >
              <Text style={createStaffGender !== 'Select' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                {createStaffGender}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {renderInlineDropdown('gender', ['Select', 'Male', 'Female', 'Other'], createStaffGender, (val) => setCreateStaffGender(val))}
          </View>

          {/* Marital Status */}
          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Marital Status</Text>
            <TouchableOpacity
              style={styles.workforceFormSelect}
              onPress={() => setOpenDropdownField((prev) => (prev === 'marital' ? null : 'marital'))}
              activeOpacity={0.75}
            >
              <Text style={createStaffMarital !== 'Select' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                {createStaffMarital}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {renderInlineDropdown('marital', ['Select', 'Married', 'Unmarried'], createStaffMarital, (val) => setCreateStaffMarital(val))}
          </View>

          {/* Father's / Guardian's Name optional */}
          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Father's / Guardian's Name</Text>
              <Text style={styles.workforceOptionalText}>optional</Text>
            </View>
            <TextInput
              style={styles.workforceFormInput}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              value={createStaffGuardian}
              onChangeText={setCreateStaffGuardian}
            />
          </View>

          {/* Nationality optional */}
          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Nationality</Text>
              <Text style={styles.workforceOptionalText}>optional</Text>
            </View>
            <TextInput
              style={styles.workforceFormInput}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              value={createStaffNationality}
              onChangeText={setCreateStaffNationality}
            />
          </View>

          {/* Preferred Language optional */}
          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Preferred Language</Text>
              <Text style={styles.workforceOptionalText}>optional</Text>
            </View>
            <TouchableOpacity
              style={styles.workforceFormSelect}
              onPress={() => setOpenDropdownField((prev) => (prev === 'language' ? null : 'language'))}
              activeOpacity={0.75}
            >
              <Text style={createStaffLanguage !== 'Select' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                {createStaffLanguage}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {renderInlineDropdown('language', ['Select', 'Tamil', 'English', 'Hindi', 'Malayalam', 'Kannada'], createStaffLanguage, (val) => setCreateStaffLanguage(val))}
          </View>

          {/* Blood Group */}
          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Blood Group</Text>
            <TouchableOpacity
              style={styles.workforceFormSelect}
              onPress={() => setOpenDropdownField((prev) => (prev === 'bloodGroup' ? null : 'bloodGroup'))}
              activeOpacity={0.75}
            >
              <Text style={createStaffBloodGroup !== 'Select' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                {createStaffBloodGroup}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {renderInlineDropdown('bloodGroup', ['Select', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], createStaffBloodGroup, (val) => setCreateStaffBloodGroup(val))}
          </View>
        </View>

        {/* CARD 2: Contact Details */}
        <View style={styles.workforceCreateCard}>
          <View style={styles.workforceCardHeader}>
            <View style={styles.workforceCardHeaderLeft}>
              <View style={styles.workforceStepBadge}>
                <Text style={styles.workforceStepBadgeText}>2</Text>
              </View>
              <View style={styles.workforceCardHeaderTextCol}>
                <Text style={styles.workforceCreateCardTitle}>Contact Details</Text>
                <Text style={styles.workforceCreateCardSubtitle}>How to reach the staff member.</Text>
              </View>
            </View>
          </View>
          <View style={styles.workforceCardDivider} />

          {/* Primary Mobile Number * */}
          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Primary Mobile Number</Text>
              <Text style={styles.requiredStar}> *</Text>
            </View>
            <TextInput
              style={styles.workforceFormInput}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              value={createStaffMobile}
              onChangeText={setCreateStaffMobile}
              keyboardType="phone-pad"
            />
            <Text style={styles.workforceFormHelperText}>10-digit Indian mobile number.</Text>
          </View>

          {/* Alternate Mobile Number */}
          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Alternate Mobile Number</Text>
            <TextInput
              style={styles.workforceFormInput}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              value={createStaffAltMobile}
              onChangeText={setCreateStaffAltMobile}
              keyboardType="phone-pad"
            />
          </View>

          {/* Email Address * */}
          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Email Address</Text>
              <Text style={styles.requiredStar}> *</Text>
            </View>
            <TextInput
              style={styles.workforceFormInput}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              value={createStaffEmail}
              onChangeText={setCreateStaffEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.workforceFormHelperText}>Also used as the login username.</Text>
          </View>

          {/* Current Address */}
          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Current Address</Text>
            <TextInput
              style={[styles.workforceFormInput, styles.workforceFormMultiline]}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              value={createStaffAddress}
              onChangeText={setCreateStaffAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* State */}
          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>State</Text>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffState}
              onChangeText={setCreateStaffState}
            />
          </View>

          {/* District */}
          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>District</Text>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffDistrict}
              onChangeText={setCreateStaffDistrict}
            />
          </View>

          {/* City */}
          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>City</Text>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffCity}
              onChangeText={setCreateStaffCity}
            />
          </View>

          {/* PIN Code */}
          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>PIN Code</Text>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffPin}
              onChangeText={setCreateStaffPin}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* CARD 3: ID Proof & Verification */}
        <View style={styles.workforceCreateCard}>
          <View style={styles.workforceCardHeader}>
            <View style={styles.workforceCardHeaderLeft}>
              <View style={styles.workforceStepBadge}>
                <Text style={styles.workforceStepBadgeText}>3</Text>
              </View>
              <View style={styles.workforceCardHeaderTextCol}>
                <Text style={styles.workforceCreateCardTitle}>ID Proof & Verification</Text>
                <Text style={styles.workforceCreateCardSubtitle}>Government ID documents.</Text>
              </View>
            </View>
          </View>
          <View style={styles.workforceCardDivider} />

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>ID Proof</Text>
            <TouchableOpacity
              style={styles.workforceFormSelect}
              onPress={() => setOpenDropdownField((prev) => (prev === 'idProofType' ? null : 'idProofType'))}
              activeOpacity={0.75}
            >
              <Text style={createStaffIdType !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                {createStaffIdType}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {renderInlineDropdown('idProofType', ['Select...', 'Aadhaar Card', 'PAN Card', 'Voter ID', 'Driving Licence', 'Passport'], createStaffIdType, (val) => setCreateStaffIdType(val))}
            <Text style={styles.workforceFormHelperText}>The accepted types are subject to TOHFA policy.</Text>
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>ID Proof Number</Text>
            <TextInput
              style={styles.workforceFormInput}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              value={createStaffIdNumber}
              onChangeText={setCreateStaffIdNumber}
            />
            <Text style={styles.workforceFormHelperText}>Choose the ID type first.</Text>
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>ID Proof Name</Text>
            <TextInput
              style={styles.workforceFormInput}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              value={createStaffIdName}
              onChangeText={setCreateStaffIdName}
            />
          </View>
        </View>

        {/* CARD 4: Bank Account Details */}
        <View style={styles.workforceCreateCard}>
          <View style={styles.workforceCardHeader}>
            <View style={styles.workforceCardHeaderLeft}>
              <View style={styles.workforceStepBadge}>
                <Text style={styles.workforceStepBadgeText}>4</Text>
              </View>
              <View style={styles.workforceCardHeaderTextCol}>
                <Text style={styles.workforceCreateCardTitle}>Bank Account Details</Text>
                <Text style={styles.workforceCreateCardSubtitle}>Optional. If you start, the required bank fields must be completed.</Text>
              </View>
            </View>
          </View>
          <View style={styles.workforceCardDivider} />

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffAccountHolder}
              onChangeText={setCreateStaffAccountHolder}
            />
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Bank Name</Text>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffBankName}
              onChangeText={setCreateStaffBankName}
            />
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Account Number</Text>
            <View style={styles.workforceInputWithIconRow}>
              <TextInput
                style={styles.workforceInputEmbedded}
                value={createStaffAccountNumber}
                onChangeText={setCreateStaffAccountNumber}
                secureTextEntry={!showAccountNumber}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                onPress={() => setShowAccountNumber(!showAccountNumber)}
                activeOpacity={0.7}
              >
                {showAccountNumber ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
              </TouchableOpacity>
            </View>
            <Text style={styles.workforceFormHelperText}>9 to 18 digits. Shown masked after saving, and never stored in full.</Text>
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Confirm Account Number</Text>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffConfirmAccount}
              onChangeText={setCreateStaffConfirmAccount}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>IFSC Code</Text>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffIfsc}
              onChangeText={setCreateStaffIfsc}
              autoCapitalize="characters"
            />
            <Text style={styles.workforceFormHelperText}>Like SBIN0001234.</Text>
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Branch Name</Text>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffBranch}
              onChangeText={setCreateStaffBranch}
            />
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Account Type</Text>
            <TouchableOpacity
              style={styles.workforceFormSelect}
              onPress={() => setOpenDropdownField((prev) => (prev === 'accountType' ? null : 'accountType'))}
              activeOpacity={0.75}
            >
              <Text style={createStaffAccountType !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                {createStaffAccountType}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {renderInlineDropdown('accountType', ['Select...', 'Savings', 'Current', 'Salary'], createStaffAccountType, (val) => setCreateStaffAccountType(val))}
          </View>

          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Cancelled Cheque / Bank Proof</Text>
              <Text style={styles.workforceOptionalText}>optional</Text>
            </View>
            <View style={styles.workforceUploadDropZone}>
              <UploadSimpleIcon size={24} color={adminColors.brand} />
              <Text style={styles.workforceUploadDropZoneTitle}>
                {createStaffBankProof || 'Drag and drop a file here'}
              </Text>
              <Text style={styles.workforceUploadDropZoneSubtitle}>PDF, JPG or PNG · up to 5 MB</Text>
              <TouchableOpacity
                style={styles.workforceBrowseFilesBtn}
                onPress={() => {
                  setCreateStaffBankProof('cancelled_cheque.pdf');
                  Alert.alert('File Attached', 'Attached sample file: cancelled_cheque.pdf');
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.workforceBrowseFilesBtnText}>Browse Files</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* CARD 5: Employment Details */}
        <View style={styles.workforceCreateCard}>
          <View style={styles.workforceCardHeader}>
            <View style={styles.workforceCardHeaderLeft}>
              <View style={styles.workforceStepBadge}>
                <Text style={styles.workforceStepBadgeText}>5</Text>
              </View>
              <View style={styles.workforceCardHeaderTextCol}>
                <Text style={styles.workforceCreateCardTitle}>Employment Details</Text>
                <Text style={styles.workforceCreateCardSubtitle}>Choices come from configured TOHFA records. payroll is set here.</Text>
              </View>
            </View>
          </View>
          <View style={styles.workforceCardDivider} />

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Staff ID</Text>
            <TextInput
              style={[styles.workforceFormInput, { backgroundColor: '#F3EFEA', color: adminColors.muted }]}
              value={createStaffId}
              editable={false}
            />
          </View>

          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Employee ID</Text>
              <Text style={styles.workforceOptionalText}>optional</Text>
            </View>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffEmployeeId}
              onChangeText={setCreateStaffEmployeeId}
            />
            <Text style={styles.workforceFormHelperText}>Must be unique. Separate from the generated Staff ID.</Text>
          </View>

          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Date of Joining</Text>
              <Text style={styles.workforceOptionalText}>optional</Text>
            </View>
            <View style={styles.workforceInputWithIconRow}>
              <TextInput
                style={styles.workforceInputEmbedded}
                value={createStaffJoiningDate}
                onChangeText={setCreateStaffJoiningDate}
              />
              <CalendarOutlineIcon size={20} color={adminColors.brand} />
            </View>
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Employment Type</Text>
            <TouchableOpacity
              style={styles.workforceFormSelect}
              onPress={() => setOpenDropdownField((prev) => (prev === 'employmentType' ? null : 'employmentType'))}
              activeOpacity={0.75}
            >
              <Text style={styles.workforceFormSelectText}>{createStaffEmploymentType}</Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {renderInlineDropdown('employmentType', ['Select...', 'Full-time', 'Part-time', 'Contract', 'Daily Wage'], createStaffEmploymentType, (val) => setCreateStaffEmploymentType(val))}
            <Text style={styles.workforceFormHelperText}>Example list: configurable.</Text>
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Department</Text>
            <TouchableOpacity
              style={styles.workforceFormSelect}
              onPress={() => setOpenDropdownField((prev) => (prev === 'department' ? null : 'department'))}
              activeOpacity={0.75}
            >
              <Text style={styles.workforceFormSelectText}>{createStaffDepartment}</Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {renderInlineDropdown('department', ['Select...', 'Warehouse Operations', 'Logistics & Fleet', 'Quality Assurance', 'Inventory Management'], createStaffDepartment, (val) => setCreateStaffDepartment(val))}
            <Text style={styles.workforceFormHelperText}>Example list: configurable, not official.</Text>
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Designation</Text>
            <TouchableOpacity
              style={styles.workforceFormSelect}
              onPress={() => setOpenDropdownField((prev) => (prev === 'designation' ? null : 'designation'))}
              activeOpacity={0.75}
            >
              <Text style={styles.workforceFormSelectText}>{createStaffDesignation}</Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {renderInlineDropdown('designation', ['Select...', 'Loading & Sorting Staff', 'Forklift Operator', 'Warehouse Staff', 'Fleet Driver', 'Supervisor'], createStaffDesignation, (val) => setCreateStaffDesignation(val))}
            <Text style={styles.workforceFormHelperText}>Example list: configurable.</Text>
          </View>

          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Employment Status</Text>
              <Text style={styles.workforceOptionalText}>optional</Text>
            </View>
            <TouchableOpacity
              style={styles.workforceFormSelect}
              onPress={() => setOpenDropdownField((prev) => (prev === 'employmentStatus' ? null : 'employmentStatus'))}
              activeOpacity={0.75}
            >
              <Text style={styles.workforceFormSelectText}>{createStaffEmploymentStatus}</Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {renderInlineDropdown('employmentStatus', ['Select...', 'Active', 'Probation', 'Notice Period', 'On Leave'], createStaffEmploymentStatus, (val) => setCreateStaffEmploymentStatus(val))}
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Work Location</Text>
            <TouchableOpacity
              style={styles.workforceFormSelect}
              onPress={() => setOpenDropdownField((prev) => (prev === 'workLocation' ? null : 'workLocation'))}
              activeOpacity={0.75}
            >
              <Text style={styles.workforceFormSelectText}>{createStaffWorkLocation}</Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {renderInlineDropdown('workLocation', ['Select...', 'Main Warehouse, Ooty (WH-MAIN)', 'Sub Warehouse, Coonoor (WH-SUB-01)', 'Sub Warehouse, Kotagiri (WH-SUB-02)'], createStaffWorkLocation, (val) => setCreateStaffWorkLocation(val))}
          </View>
        </View>

        {/* CARD 6: Role & Access Management */}
        <View style={styles.workforceCreateCard}>
          <View style={styles.workforceCardHeader}>
            <View style={styles.workforceCardHeaderLeft}>
              <View style={styles.workforceStepBadge}>
                <Text style={styles.workforceStepBadgeText}>6</Text>
              </View>
              <View style={styles.workforceCardHeaderTextCol}>
                <Text style={styles.workforceCreateCardTitle}>Role & Access Management</Text>
                <Text style={styles.workforceCreateCardSubtitle}>What this person can do in TOHFA Admin. Limited to roles you may create.</Text>
              </View>
            </View>
          </View>
          <View style={styles.workforceCardDivider} />

          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Account Access</Text>
              <Text style={styles.requiredStar}> *</Text>
            </View>

            {/* Radio Option 1 */}
            <TouchableOpacity
              style={createStaffAccountAccess === 'login' ? styles.workforceRadioCardSelected : styles.workforceRadioCard}
              onPress={() => setCreateStaffAccountAccess('login')}
              activeOpacity={0.8}
            >
              {createStaffAccountAccess === 'login' ? (
                <RadioSelectedIcon size={22} color={adminColors.brand} />
              ) : (
                <RadioUnselectedIcon size={22} color={adminColors.muted} />
              )}
              <View style={styles.workforceRadioTextCol}>
                <Text style={styles.workforceRadioTitle}>Application login</Text>
                <Text style={styles.workforceRadioSub}>An admin account with a role. Starts as Pending activation.</Text>
              </View>
            </TouchableOpacity>

            {/* Radio Option 2 */}
            <TouchableOpacity
              style={createStaffAccountAccess === 'no_login' ? styles.workforceRadioCardSelected : styles.workforceRadioCard}
              onPress={() => setCreateStaffAccountAccess('no_login')}
              activeOpacity={0.8}
            >
              {createStaffAccountAccess === 'no_login' ? (
                <RadioSelectedIcon size={22} color={adminColors.brand} />
              ) : (
                <RadioUnselectedIcon size={22} color={adminColors.muted} />
              )}
              <View style={styles.workforceRadioTextCol}>
                <Text style={styles.workforceRadioTitle}>No application access</Text>
                <Text style={styles.workforceRadioSub}>A warehouse staff record without a login. Needs a warehouse.</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Application Role</Text>
              <Text style={styles.requiredStar}> *</Text>
            </View>
            <TouchableOpacity
              style={styles.workforceFormSelect}
              onPress={() => setOpenDropdownField((prev) => (prev === 'appRole' ? null : 'appRole'))}
              activeOpacity={0.75}
            >
              <Text style={styles.workforceFormSelectText}>{createStaffApplicationRole}</Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {renderInlineDropdown('appRole', ['Select...', 'Super Admin', 'TOHFA Admin', 'Farmer Admin', 'Main Warehouse Admin', 'Sub warehouse Admin', 'Warehouse Staff', 'Driver'], createStaffApplicationRole, (val) => setCreateStaffApplicationRole(val))}
            <Text style={styles.workforceFormHelperText}>Only roles you may create are listed. The server checks this again.</Text>
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Login Email / Username</Text>
            <TextInput
              style={[styles.workforceFormInput, { borderStyle: 'dashed' }]}
              placeholder="email address"
              placeholderTextColor={adminColors.placeholder}
              value={createStaffEmail}
              onChangeText={setCreateStaffEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.workforceFormHelperText}>Choose a role to see what it can do.</Text>
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Account Status</Text>
            <View style={styles.workforceStatusBadgeBox}>
              <Text style={styles.workforceStatusBadgeText}>Pending activation</Text>
              <Text style={styles.workforceStatusHelper}>Never Active at creation.</Text>
            </View>
          </View>
        </View>

        {/* CARD 8: Emergency Contact */}
        <View style={styles.workforceCreateCard}>
          <View style={styles.workforceCardHeader}>
            <View style={styles.workforceCardHeaderLeft}>
              <View style={styles.workforceStepBadge}>
                <Text style={styles.workforceStepBadgeText}>8</Text>
              </View>
              <View style={styles.workforceCardHeaderTextCol}>
                <Text style={styles.workforceCreateCardTitle}>Emergency Contact</Text>
                <Text style={styles.workforceCreateCardSubtitle}>Optional. If you start, the name, relationship and number are required.</Text>
              </View>
            </View>
          </View>
          <View style={styles.workforceCardDivider} />

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Contact Person Name</Text>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffEmergencyName}
              onChangeText={setCreateStaffEmergencyName}
            />
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Relationship</Text>
            <TouchableOpacity
              style={styles.workforceFormSelect}
              onPress={() => setOpenDropdownField((prev) => (prev === 'relationship' ? null : 'relationship'))}
              activeOpacity={0.75}
            >
              <Text style={createStaffEmergencyRel !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                {createStaffEmergencyRel}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
            {renderInlineDropdown('relationship', ['Select...', 'Spouse', 'Parent', 'Sibling', 'Child', 'Relative', 'Friend', 'Other'], createStaffEmergencyRel, (val) => setCreateStaffEmergencyRel(val))}
          </View>

          <View style={styles.workforceFormField}>
            <Text style={styles.workforceFormLabel}>Primary Contact Number</Text>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffEmergencyPhone}
              onChangeText={setCreateStaffEmergencyPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Alternate Contact Number</Text>
              <Text style={styles.workforceOptionalText}>optional</Text>
            </View>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffEmergencyAltPhone}
              onChangeText={setCreateStaffEmergencyAltPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.workforceFormField}>
            <View style={styles.workforceFormLabelRow}>
              <Text style={styles.workforceFormLabel}>Contact Address</Text>
              <Text style={styles.workforceOptionalText}>optional</Text>
            </View>
            <TextInput
              style={styles.workforceFormInput}
              value={createStaffEmergencyAddress}
              onChangeText={setCreateStaffEmergencyAddress}
            />
          </View>
        </View>

        {/* CARD 9: Document Uploads */}
        <View style={styles.workforceCreateCard}>
          <View style={styles.workforceCardHeader}>
            <View style={styles.workforceCardHeaderLeft}>
              <View style={styles.workforceStepBadge}>
                <Text style={styles.workforceStepBadgeText}>9</Text>
              </View>
              <View style={styles.workforceCardHeaderTextCol}>
                <Text style={styles.workforceCreateCardTitle}>Document Uploads</Text>
                <Text style={styles.workforceCreateCardSubtitle}>Required only where policy says so. PDF, JPG or PNG within the configured size limit.</Text>
              </View>
            </View>
          </View>
          <View style={styles.workforceCardDivider} />

          {/* Info callout */}
          <View style={styles.workforcePolicyCallout}>
            <Text style={styles.workforcePolicyCalloutText}>
              Requirements follow policy, not a blanket rule: only the documents marked Required block creation. Files are checked for type and size here and again on the server. Uploads are simulated in this prototype.
            </Text>
          </View>

          {/* Document list items */}
          {[
            { title: 'ID Proof', sub: 'Managed in ID Proof & Verification', file: createStaffIdNumber ? 'id_document_scan.pdf' : null, setFile: () => setCreateStaffIdNumber('XXXX XXXX 4190') },
            { title: 'Address Proof', sub: 'Policy: optional', file: createStaffDocAddressProof, setFile: () => setCreateStaffDocAddressProof('address_proof.pdf') },
            { title: 'Bank Proof', sub: 'Managed in Bank Account Details', file: createStaffBankProof, setFile: () => setCreateStaffBankProof('cancelled_cheque.pdf') },
            { title: 'Appointment Letter', sub: 'Policy: optional', file: createStaffDocAppointmentLetter, setFile: () => setCreateStaffDocAppointmentLetter('appointment_letter.pdf') },
            { title: 'Employment Agreement', sub: 'Policy: required for a contract (proposed)', file: createStaffDocAgreement, setFile: () => setCreateStaffDocAgreement('employment_agreement.pdf') },
            { title: 'Educational Certificates', sub: 'Policy: optional', file: createStaffDocEducation, setFile: () => setCreateStaffDocEducation('degree_certificate.pdf') },
            { title: 'Experience Certificate', sub: 'Policy: optional', file: createStaffDocExperience, setFile: () => setCreateStaffDocExperience('experience_letter.pdf') },
            { title: 'Other Supporting Documents', sub: 'Policy: optional', file: createStaffDocOther, setFile: () => setCreateStaffDocOther('supporting_document.pdf') },
          ].map((doc, idx) => (
            <View key={doc.title} style={[styles.workforceDocItem, idx === 7 && { borderBottomWidth: 0 }]}>
              <Text style={styles.workforceDocItemTitle}>{doc.title}</Text>
              <Text style={styles.workforceDocItemSub}>{doc.sub}</Text>
              <View style={styles.workforceDocPill}>
                <Text style={styles.workforceDocPillText}>Optional</Text>
              </View>
              <Text style={styles.workforceDocFileText}>{doc.file || 'No file'}</Text>
              <Text style={styles.workforceDocVerificationLabel}>Verification</Text>
              <View style={styles.workforceDocVerificationPill}>
                <Text style={styles.workforceDocVerificationPillText}>
                  {doc.file ? 'Pending verification' : 'Not submitted'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.workforceDocActionBtn}
                onPress={() => {
                  doc.setFile();
                  Alert.alert('File Attached', `Attached sample file for ${doc.title}.`);
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.workforceDocActionBtnText}>Browse Files</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Docked Action Bar */}
      <View style={styles.workforceDockedActionsContainer}>
        <View style={styles.workforceDockedActionsRow}>
          <TouchableOpacity
            style={styles.workforceCreatePrimaryBtn}
            onPress={handleCreateStaffAccount}
            activeOpacity={0.85}
          >
            <Text style={styles.workforceCreatePrimaryBtnText}>
              {isEditing ? 'Save Changes' : 'Create Account'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.workforceCreateCancelBtn}
            onPress={onCancel || onBack}
            activeOpacity={0.85}
          >
            <Text style={styles.workforceCreateCancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Modal */}
      <Modal visible={showStaffDobCalendar} transparent animationType="fade">
        <View style={styles.staffCalOverlay}>
          <View style={styles.staffCalCard}>
            <View style={styles.staffCalHeader}>
              <Text style={styles.staffCalTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={() => setShowStaffDobCalendar(false)}>
                <Text style={{ fontSize: 18, color: adminColors.muted }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.staffCalNavRow}>
              <TouchableOpacity
                onPress={() => {
                  if (staffDobMonth === 0) {
                    setStaffDobMonth(11);
                    setStaffDobYear((y) => y - 1);
                  } else {
                    setStaffDobMonth((m) => m - 1);
                  }
                }}
              >
                <Text style={{ fontSize: 18, color: adminColors.brand }}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.staffCalMonthText}>
                {months[staffDobMonth]} {staffDobYear}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (staffDobMonth === 11) {
                    setStaffDobMonth(0);
                    setStaffDobYear((y) => y + 1);
                  } else {
                    setStaffDobMonth((m) => m + 1);
                  }
                }}
              >
                <Text style={{ fontSize: 18, color: adminColors.brand }}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.staffCalDaysGrid}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.staffCalDayCell,
                    staffDobDay === d && styles.staffCalDayCellSelected,
                  ]}
                  onPress={() => setStaffDobDay(d)}
                >
                  <Text
                    style={[
                      styles.staffCalDayText,
                      staffDobDay === d && styles.staffCalDayTextSelected,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.staffCalButtons}>
              <TouchableOpacity
                style={styles.staffCalCancelBtn}
                onPress={() => setShowStaffDobCalendar(false)}
              >
                <Text style={styles.staffCalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.staffCalApplyBtn}
                onPress={() => {
                  const dayStr = String(staffDobDay).padStart(2, '0');
                  const monthStr = String(staffDobMonth + 1).padStart(2, '0');
                  setCreateStaffDob(`${dayStr}-${monthStr}-${staffDobYear}`);
                  setShowStaffDobCalendar(false);
                }}
              >
                <Text style={styles.staffCalApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    <SafeAreaView style={styles.bottomSafeArea} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  topSafeArea: {
    flex: 0,
    backgroundColor: adminColors.brand,
  },
  bottomSafeArea: {
    flex: 0,
    backgroundColor: adminColors.card,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  workforceHeaderBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  workforceHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workforceBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceHeaderTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '800',
  },
  workforceCreateScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  workforceCreateCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 16,
    ...(adminShadow?.sm || {}),
  },
  workforceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workforceCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  workforceStepBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  workforceStepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brand,
  },
  workforceCardHeaderTextCol: {
    flex: 1,
  },
  workforceCreateCardTitle: {
    ...adminType.body,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceCreateCardSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
  },
  workforceCardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginTop: 12,
    marginBottom: 16,
  },
  workforceFormField: {
    marginBottom: 14,
  },
  workforceFormLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  workforceFormLabel: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  workforceOptionalText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginLeft: 6,
    marginBottom: 6,
  },
  requiredStar: {
    color: adminColors.danger.text,
    fontWeight: '700',
  },
  workforcePhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 6,
  },
  workforcePhotoPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  workforcePhotoPlaceholderQuestion: {
    fontSize: 22,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  workforceUploadPhotoBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  workforceUploadPhotoBtnText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  workforceFormInput: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    height: 44,
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
  },
  workforceFormMultiline: {
    height: 74,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  workforceInputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    height: 44,
  },
  workforceInputEmbedded: {
    flex: 1,
    height: 44,
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
    padding: 0,
  },
  workforceFormSelect: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workforceFormSelectText: {
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
  },
  workforceFormSelectPlaceholder: {
    ...adminType.body,
    fontSize: 14,
    color: adminColors.muted,
  },
  workforceFormHelperText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
  },
  workforceInlineDropdownMenu: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 8,
    ...(adminShadow?.sm || {}),
  },
  workforceInlineDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  workforceInlineDropdownItemActive: {
    backgroundColor: adminColors.brandTint,
  },
  workforceInlineDropdownItemText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  workforceInlineDropdownItemTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  workforceRadioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    marginBottom: 8,
    gap: 12,
  },
  workforceRadioCardSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
    marginBottom: 8,
    gap: 12,
  },
  workforceRadioTextCol: {
    flex: 1,
  },
  workforceRadioTitle: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  workforceRadioSub: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
  },
  workforceStatusBadgeBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  workforceStatusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  workforceStatusHelper: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  workforceUploadDropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    borderRadius: 12,
    backgroundColor: adminColors.canvas,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  workforceUploadDropZoneTitle: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 10,
  },
  workforceUploadDropZoneSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 4,
    marginBottom: 12,
  },
  workforceBrowseFilesBtn: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 8,
    backgroundColor: adminColors.card,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  workforceBrowseFilesBtnText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  workforcePolicyCallout: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  workforcePolicyCalloutText: {
    ...adminType.caption,
    fontSize: 11.5,
    color: '#1E40AF',
    lineHeight: 16,
  },
  workforceDocItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  workforceDocItemTitle: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  workforceDocItemSub: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
  },
  workforceDocPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
    marginBottom: 4,
  },
  workforceDocPillText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '600',
  },
  workforceDocFileText: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 4,
  },
  workforceDocVerificationLabel: {
    fontSize: 11,
    color: adminColors.muted,
  },
  workforceDocVerificationPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
    marginBottom: 8,
  },
  workforceDocVerificationPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  workforceDocActionBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 6,
    backgroundColor: adminColors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  workforceDocActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
  },
  workforceDockedActionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 20,
    ...(adminShadow?.md || {}),
  },
  workforceDockedActionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  workforceCreatePrimaryBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceCreatePrimaryBtnText: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  workforceCreateCancelBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceCreateCancelBtnText: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  staffCalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  staffCalCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...(adminShadow?.lg || {}),
  },
  staffCalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  staffCalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 16,
  },
  staffCalNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: adminSpacing.sm,
  },
  staffCalMonthText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    fontSize: 15,
  },
  staffCalDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  staffCalDayCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffCalDayCellSelected: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.full,
  },
  staffCalDayText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
  },
  staffCalDayTextSelected: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  staffCalButtons: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.lg,
  },
  staffCalCancelBtn: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffCalCancelText: {
    ...adminType.body,
    color: adminColors.muted,
    fontWeight: '600',
  },
  staffCalApplyBtn: {
    flex: 1,
    height: 42,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffCalApplyText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '600',
  },
});

