import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowWhiteIcon,
  CalendarIcon,
  ChevronDownIcon,
  EyeOffIcon,
  ImageIcon,
  LockIcon,
  UploadIcon,
} from '../../components/AdminIcons';
import { AdminCalendarPickerModal } from '../../components/AdminCalendarPickerModal';
import type { FarmerListItem } from './AdminAllFarmersScreen';
import type { Can } from '../../permissions/can';

interface Props {
  farmer: FarmerListItem;
  initialTab?: any;
  onBack: () => void;
  onSave?: (updatedFarmer: FarmerListItem, activeTab?: any) => void;
  onNavigateToEditCategories?: () => void;
  isAdd?: boolean | undefined;
  role?: string | undefined;
  can?: Can | undefined;
}

export const AdminEditFarmerScreen: React.FC<Props> = ({
  farmer,
  onBack,
  onSave,
  isAdd = false,
  role = 'SUPER_ADMIN',
  can,
}) => {
  // Permission checks
  const canEdit = can ? can('farmer.account.update') : true;
  const isSuperAdmin = role === 'SUPER_ADMIN' || (can ? can('farmer.document.verify') : false);

  // Personal information
  const [fullName, setFullName] = useState(isAdd ? '' : farmer.name || 'Ramesh Kumar');
  const [mobileNumber, setMobileNumber] = useState(isAdd ? '' : '98765 00124');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState(isAdd ? '' : '12 Apr 1982');
  const [genderChips, setGenderChips] = useState(['Male', 'Female']);

  // Identity proof details
  const [idChips, setIdChips] = useState(['Aadhaar Card', 'Voter ID', 'PAN Card', 'Driving License']);
  const [docFullName, setDocFullName] = useState(isAdd ? '' : farmer.name || 'Ramesh Kumar');
  const [aadhaarNumber, setAadhaarNumber] = useState(isAdd ? '' : 'XXXX XXXX 0124');
  const [docDob, setDocDob] = useState(isAdd ? '' : '12 Apr 1982');
  const [calendarTarget, setCalendarTarget] = useState<'dob' | 'docDob' | null>(null);

  // Address
  const [addressLine1, setAddressLine1] = useState(isAdd ? '' : '12 Hill Road');
  const [addressLine2, setAddressLine2] = useState('');
  const [village, setVillage] = useState(isAdd ? '' : 'Coonoor');
  const [pinCode, setPinCode] = useState(isAdd ? '' : '643101');
  const [districtChips, setDistrictChips] = useState(['Coonoor', 'Ooty']);

  // Zone & farm assignment
  const [zoneChips, setZoneChips] = useState(['Coonoor', 'Ooty']);
  const [warehouse, setWarehouse] = useState(isAdd ? 'Select warehouse' : 'Sub Warehouse, Coonoor');
  const [farmingTypeChips, setFarmingTypeChips] = useState(['Organic', 'Natural']);

  // Farm details
  const [farmName, setFarmName] = useState(isAdd ? '' : farmer.farmName || 'Ramesh Kumar Farm');
  const [totalArea, setTotalArea] = useState(isAdd ? '' : '4.25');

  const removeChip = (list: string[], setList: (v: string[]) => void, itemToRemove: string) => {
    setList(list.filter((i) => i !== itemToRemove));
  };

  const handleSave = () => {
    if (!canEdit) {
      Alert.alert('Permission Denied', 'You do not have permission to update farmer records.');
      return;
    }
    const updated: FarmerListItem = {
      ...farmer,
      name: fullName || farmer.name,
      farmName: farmName || farmer.farmName || 'Ramesh Kumar Farm',
      location: `${village || 'Coonoor'}, Nilgiris`,
      mobile: `+91 ${mobileNumber || '98765 00000'}`,
    };
    if (onSave) {
      onSave(updated);
    }
    Alert.alert('Success', isAdd ? 'Farmer profile created successfully.' : 'Farmer profile changes saved successfully.', [
      { text: 'OK', onPress: onBack },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isAdd ? 'Add Farmer Profile' : 'Edit Farmer Profile'}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── SECTION 1: Personal information ─── */}
        <Text style={styles.sectionHeading}>Personal information</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>
            Full name <Text style={styles.reqStar}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder={isAdd ? '' : 'Enter full name'}
            placeholderTextColor={adminColors.placeholder}
          />

          <Text style={styles.fieldLabel}>
            Mobile number <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.phonePrefixBox}>
              <Text style={styles.phonePrefixText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              placeholder={isAdd ? '' : '98765 00000'}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <Text style={styles.fieldLabel}>Email (optional)</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Not provided"
            placeholderTextColor={adminColors.placeholder}
            keyboardType="email-address"
          />

          <Text style={styles.fieldLabel}>Date of birth</Text>
          <View style={styles.pickerInputRow}>
            <Text style={dob ? styles.pickerInputText : styles.pickerPlaceholderText}>
              {dob || 'Select date'}
            </Text>
            <TouchableOpacity
              onPress={() => setCalendarTarget('dob')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Pick date of birth"
            >
              <CalendarIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.pickerWithAddRow}>
            <View style={styles.dropdownInputFlex}>
              <Text style={styles.pickerPlaceholderText}>Select Gender</Text>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </View>
            <TouchableOpacity style={styles.addOutlineBtn} activeOpacity={0.8}>
              <Text style={styles.addOutlineBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Gender Tags */}
          <View style={styles.chipsRow}>
            {genderChips.map((g) => (
              <View key={g} style={styles.chipPill}>
                <Text style={styles.chipText}>{g}</Text>
                <TouchableOpacity onPress={() => removeChip(genderChips, setGenderChips, g)}>
                  <Text style={styles.chipClose}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* ─── SECTION 2: Identity proof details ─── */}
        <Text style={styles.sectionHeading}>Identity proof details</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>
            Identity proof type <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.pickerWithAddRow}>
            <View style={styles.dropdownInputFlex}>
              <Text style={styles.pickerPlaceholderText}>Select ID Proof</Text>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </View>
            <TouchableOpacity style={styles.addOutlineBtn} activeOpacity={0.8}>
              <Text style={styles.addOutlineBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* ID Proof Tags */}
          <View style={styles.chipsRow}>
            {idChips.map((c) => (
              <View key={c} style={styles.chipPill}>
                <Text style={styles.chipText}>{c}</Text>
                <TouchableOpacity onPress={() => removeChip(idChips, setIdChips, c)}>
                  <Text style={styles.chipClose}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <Text style={styles.fieldLabel}>
            Full name as per document <Text style={styles.reqStar}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={docFullName}
            onChangeText={setDocFullName}
            placeholder={isAdd ? '' : 'Ramesh Kumar'}
            placeholderTextColor={adminColors.placeholder}
          />

          <Text style={styles.fieldLabel}>
            Aadhaar number <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.pickerInputRow}>
            <TextInput
              style={[styles.inputBare, { flex: 1 }]}
              value={aadhaarNumber}
              onChangeText={setAadhaarNumber}
              placeholder={isAdd ? '' : 'XXXX XXXX 0124'}
              placeholderTextColor={adminColors.placeholder}
            />
            <EyeOffIcon size={18} color={adminColors.muted} />
          </View>
          <Text style={styles.helperCaption}>
            Masked. Full number is never shown or stored on this screen.
          </Text>

          <Text style={styles.fieldLabel}>Date of birth (as per document)</Text>
          <View style={styles.pickerInputRow}>
            <Text style={docDob ? styles.pickerInputText : styles.pickerPlaceholderText}>
              {docDob || 'Select date'}
            </Text>
            <TouchableOpacity
              onPress={() => setCalendarTarget('docDob')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Pick document date of birth"
            >
              <CalendarIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── SECTION 3: Document upload ─── */}
        <Text style={styles.sectionHeading}>Document upload</Text>
        {isAdd ? (
          <View style={styles.uploadDashedBoxSingle}>
            <UploadIcon size={24} color={adminColors.rustDeep} />
            <View style={styles.uploadDashedSubBanner}>
              <Text style={styles.uploadDashedSubText}>Back · not uploaded</Text>
            </View>
            <TouchableOpacity style={styles.uploadActionBtn} activeOpacity={0.8}>
              <Text style={styles.uploadActionText}>Upload</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.twoCardsRow}>
            {/* Front card */}
            <View style={styles.uploadedFrontCard}>
              <View style={styles.uploadedFrontTop}>
                <ImageIcon size={24} color={adminColors.rustDeep} />
              </View>
              <View style={styles.uploadedFrontMeta}>
                <Text style={styles.uploadDashedSubText}>Front · aadhaar_front.jpg</Text>
                <Text style={styles.uploadedStatusGreen}>Uploaded</Text>
              </View>
              <View style={styles.uploadedActionsRow}>
                <TouchableOpacity style={styles.replaceBtn} activeOpacity={0.8}>
                  <Text style={styles.replaceBtnText}>Replace</Text>
                </TouchableOpacity>
                <View style={styles.actionDivider} />
                <TouchableOpacity style={styles.removeBtn} activeOpacity={0.8}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Back card */}
            <View style={styles.uploadDashedBoxHalf}>
              <UploadIcon size={24} color={adminColors.rustDeep} />
              <View style={styles.uploadDashedSubBanner}>
                <Text style={styles.uploadDashedSubText}>Back · not uploaded</Text>
              </View>
              <TouchableOpacity style={styles.uploadActionBtn} activeOpacity={0.8}>
                <Text style={styles.uploadActionText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <Text style={styles.helperCaption}>
          JPG, PNG or PDF, up to 5 MB. Replacing a verified document creates a new version; the previous version stays in history.
        </Text>

        {/* ─── SECTION 4: Verification details (read-only for this role) ─── */}
        <Text style={styles.sectionHeading}>
          Verification details <Text style={styles.readOnlyNote}>(read-only for this role)</Text>
        </Text>
        <View style={styles.readOnlyVerificationCard}>
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Farmer ID</Text>
            <View style={styles.readOnlyValueLockRow}>
              <Text style={styles.readOnlyValueBold}>
                {isAdd ? 'FMR- 0000' : 'FMR-00124'}
              </Text>
              <LockIcon size={12} color={adminColors.ink} />
            </View>
          </View>
          <View style={styles.readOnlyDivider} />

          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Verification status</Text>
            <Text style={isAdd ? styles.readOnlyValueDash : styles.readOnlyValueSuccess}>
              {isAdd ? '-' : 'Verified'}
            </Text>
          </View>
          <View style={styles.readOnlyDivider} />

          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Verification date</Text>
            <Text style={styles.readOnlyValueBold}>
              {isAdd ? '-' : '2 Nov 2025'}
            </Text>
          </View>
          <View style={styles.readOnlyDivider} />

          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Verified by</Text>
            <Text style={styles.readOnlyValueBold}>
              {isAdd ? '-' : 'Demo Sub Warehouse Admin'}
            </Text>
          </View>
          <View style={styles.readOnlyDivider} />

          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Remarks</Text>
            <Text style={styles.readOnlyValueBold}>
              {isAdd ? '-' : 'Clear scan, matches application details.'}
            </Text>
          </View>
        </View>

        {!isAdd && (
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              No automatic approval exists: a human reviewer with document-verification permission records the decision. Only that role sees Mark as Verified, Reject with Reason and Request Correction.
            </Text>
          </View>
        )}

        {/* ─── SECTION 5: Address ─── */}
        <Text style={styles.sectionHeading}>Address</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>
            Address line 1 <Text style={styles.reqStar}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder={isAdd ? '' : 'Address line 1'}
            placeholderTextColor={adminColors.placeholder}
          />

          <Text style={styles.fieldLabel}>Address line 2</Text>
          <TextInput
            style={styles.input}
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="Optional"
            placeholderTextColor={adminColors.placeholder}
          />

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Village / Town</Text>
              <TextInput
                style={styles.input}
                value={village}
                onChangeText={setVillage}
                placeholder={isAdd ? '' : 'Village / Town'}
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>PIN code</Text>
              <TextInput
                style={styles.input}
                value={pinCode}
                onChangeText={setPinCode}
                keyboardType="numeric"
                placeholder={isAdd ? '' : '643101'}
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>District</Text>
          <View style={styles.pickerWithAddRow}>
            <View style={styles.dropdownInputFlex}>
              <Text style={styles.pickerInputText}>Nilgiris</Text>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </View>
            <TouchableOpacity style={styles.addOutlineBtn} activeOpacity={0.8}>
              <Text style={styles.addOutlineBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* District Tags */}
          <View style={styles.chipsRow}>
            {districtChips.map((d) => (
              <View key={d} style={styles.chipPill}>
                <Text style={styles.chipText}>{d}</Text>
                <TouchableOpacity onPress={() => removeChip(districtChips, setDistrictChips, d)}>
                  <Text style={styles.chipClose}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* ─── SECTION 6: Zone & farm assignment ─── */}
        <Text style={styles.sectionHeading}>Zone & farm assignment</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>
            Zone <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.pickerWithAddRow}>
            <View style={styles.dropdownInputFlex}>
              <Text style={styles.pickerInputText}>Nilgiris</Text>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </View>
            <TouchableOpacity style={styles.addOutlineBtn} activeOpacity={0.8}>
              <Text style={styles.addOutlineBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Zone Tags */}
          <View style={styles.chipsRow}>
            {zoneChips.map((z) => (
              <View key={z} style={styles.chipPill}>
                <Text style={styles.chipText}>{z}</Text>
                <TouchableOpacity onPress={() => removeChip(zoneChips, setZoneChips, z)}>
                  <Text style={styles.chipClose}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Assigned warehouse</Text>
          <View style={styles.pickerInputRow}>
            <Text style={warehouse.startsWith('Select') ? styles.pickerPlaceholderText : styles.pickerInputText}>
              {warehouse}
            </Text>
            <ChevronDownIcon size={18} color={adminColors.muted} />
          </View>

          <Text style={styles.fieldLabel}>Farming type</Text>
          <View style={styles.pickerWithAddRow}>
            <View style={styles.dropdownInputFlex}>
              <Text style={styles.pickerInputText}>Conventional</Text>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </View>
            <TouchableOpacity style={styles.addOutlineBtn} activeOpacity={0.8}>
              <Text style={styles.addOutlineBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Farming type Tags */}
          <View style={styles.chipsRow}>
            {farmingTypeChips.map((t) => (
              <View key={t} style={styles.chipPill}>
                <Text style={styles.chipText}>{t}</Text>
                <TouchableOpacity onPress={() => removeChip(farmingTypeChips, setFarmingTypeChips, t)}>
                  <Text style={styles.chipClose}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* ─── SECTION 7: Farm details ─── */}
        <Text style={styles.sectionHeading}>Farm details</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Farm name</Text>
          <TextInput
            style={styles.input}
            value={farmName}
            onChangeText={setFarmName}
            placeholder={isAdd ? '' : 'Farm name'}
            placeholderTextColor={adminColors.placeholder}
          />

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Total area</Text>
              <View style={styles.unitInputRow}>
                <TextInput
                  style={styles.unitInputField}
                  value={totalArea}
                  onChangeText={setTotalArea}
                  keyboardType="numeric"
                  placeholder=""
                />
                <View style={styles.unitSuffixBox}>
                  <Text style={styles.unitSuffixText}>acres</Text>
                </View>
              </View>
            </View>

            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Plots recorded</Text>
              <View style={styles.readOnlyInputBox}>
                <Text style={styles.readOnlyInputText} numberOfLines={1}>
                  {isAdd ? '' : 'Edited in Farm & Land'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── SECTION 8: Farm FMB & zones on map & Documents (Only on Edit Farmer & Super Admin) ─── */}
        {!isAdd && isSuperAdmin && (
          <>
            <Text style={styles.sectionHeading}>Farm FMB & zones on map</Text>
            <View style={styles.card}>
              {/* Map Preview Grid */}
              <View style={styles.mapContainer}>
                <Svg width="100%" height="150" viewBox="0 0 320 150">
                  <Rect width="320" height="150" fill={adminColors.canvas} />
                  <Rect
                    x="80"
                    y="30"
                    width="110"
                    height="55"
                    rx="4"
                    fill={adminColors.success.bg}
                    stroke={adminColors.success.text}
                    strokeWidth="2.5"
                  />
                  <Rect
                    x="160"
                    y="65"
                    width="80"
                    height="45"
                    rx="4"
                    fill={adminColors.brandSoft.bg}
                    stroke={adminColors.brandSoft.text}
                    strokeWidth="2.5"
                  />
                </Svg>
                <View style={styles.mapTagPill}>
                  <Text style={styles.mapTagPillText}>FMB map (demo)</Text>
                </View>
              </View>

              {/* Plots List */}
              <View style={styles.plotsListContainer}>
                <View style={styles.plotItemRow}>
                  <View style={styles.plotInfoWrap}>
                    <Text style={styles.plotNameText}>Plot 1 · Zone A</Text>
                    <Text style={styles.plotSubText}>2.25 acres · Rectangular · Tomato</Text>
                  </View>
                  <View style={styles.plotActionsRow}>
                    <TouchableOpacity
                      onPress={() => Alert.alert('View', 'View plot 1')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.plotActionText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Edit', 'Edit plot 1')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.plotActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Delete', 'Delete plot 1')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.plotActionText, { color: adminColors.danger.text }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.plotDivider} />

                <View style={styles.plotItemRow}>
                  <View style={styles.plotInfoWrap}>
                    <Text style={styles.plotNameText}>Plot 2 · Zone B</Text>
                    <Text style={styles.plotSubText}>1.5 acres · Even · Carrot</Text>
                  </View>
                  <View style={styles.plotActionsRow}>
                    <TouchableOpacity
                      onPress={() => Alert.alert('View', 'View plot 2')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.plotActionText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Edit', 'Edit plot 2')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.plotActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Delete', 'Delete plot 2')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.plotActionText, { color: adminColors.danger.text }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.addDashedBtn}
                  onPress={() => Alert.alert('Add Plot', 'Open plot zone creation')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addDashedBtnText}>+ Add plot / zone</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ─── SECTION 9: Documents ─── */}
            <Text style={styles.sectionHeading}>Documents</Text>

            {/* Document 1: Identity proof (Aadhaar) */}
            <View style={styles.card}>
              <View style={styles.docHeaderRow}>
                <Text style={styles.docTitleText}>Identity proof (Aadhaar)</Text>
                <View style={styles.verifiedDocBadge}>
                  <Text style={styles.verifiedDocBadgeText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.docSubText}>aadhaar_scan.pdf · Uploaded 2 Nov 2025</Text>
              <View style={styles.docButtonsRow}>
                <TouchableOpacity
                  style={styles.docPreviewBtn}
                  onPress={() => Alert.alert('Preview', 'Preview aadhaar_scan.pdf')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.docPreviewBtnText}>Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.docLockedBtn}
                  disabled
                  activeOpacity={1}
                >
                  <Text style={styles.docLockedBtnText}>Replace (locked)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Document 2: Land ownership proof */}
            <View style={styles.card}>
              <View style={styles.docHeaderRow}>
                <Text style={styles.docTitleText}>Land ownership proof</Text>
                <View style={styles.verifiedDocBadge}>
                  <Text style={styles.verifiedDocBadgeText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.docSubText}>land_ownership.pdf · Uploaded 2 Nov 2025</Text>
              <View style={styles.docButtonsRow}>
                <TouchableOpacity
                  style={styles.docPreviewBtn}
                  onPress={() => Alert.alert('Preview', 'Preview land_ownership.pdf')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.docPreviewBtnText}>Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.docOutlineBrandBtn}
                  onPress={() => Alert.alert('Replace', 'Replace land ownership document')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.docOutlineBrandBtnText}>Replace Document</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Document 3: Farm certification */}
            <View style={[styles.card, styles.docWarningCard]}>
              <View style={styles.docHeaderRow}>
                <Text style={styles.docTitleText}>Farm certification</Text>
                <View style={styles.correctionBadge}>
                  <Text style={styles.correctionBadgeText}>Needs correction</Text>
                </View>
              </View>
              <Text style={styles.docSubText}>cert_copy.pdf · The certificate copy is not legible.</Text>
              <View style={styles.docButtonsRow}>
                <TouchableOpacity
                  style={styles.docPreviewBtn}
                  onPress={() => Alert.alert('Preview', 'Preview cert_copy.pdf')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.docPreviewBtnText}>Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.docSolidBrandBtn}
                  onPress={() => Alert.alert('Replace', 'Replace farm certification document')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.docSolidBrandBtnText}>Replace Document</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Add another document */}
            <TouchableOpacity
              style={styles.addDocDashedBtn}
              onPress={() => Alert.alert('Add Document', 'Upload additional document')}
              activeOpacity={0.8}
            >
              <View style={styles.addDocRow}>
                <UploadIcon size={18} color={adminColors.rustDeep} />
                <Text style={styles.addDocBtnText}>Add another document</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: adminSpacing.xxxl + 80 }} />
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      <AdminCalendarPickerModal
        visible={calendarTarget !== null}
        format="DD MMM YYYY"
        value={calendarTarget === 'dob' ? dob : docDob}
        onSelect={(d) => {
          if (calendarTarget === 'dob') setDob(d);
          else setDocDob(d);
        }}
        onClose={() => setCalendarTarget(null)}
      />
    </SafeAreaView>
  );
};

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xs,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.lg,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.rustDeep,
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.md,
  },
  readOnlyNote: {
    fontSize: 12,
    fontWeight: '400',
    color: adminColors.muted,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  fieldLabel: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
    marginTop: adminSpacing.sm,
  },
  reqStar: {
    color: adminColors.danger.text,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    fontSize: 14,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
  },
  inputBare: {
    fontSize: 14,
    color: adminColors.ink,
    padding: 0,
  },
  phoneInputRow: {
    flexDirection: 'row',
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    overflow: 'hidden',
    backgroundColor: adminColors.card,
  },
  phonePrefixBox: {
    width: 48,
    backgroundColor: adminColors.canvas,
    borderRightWidth: 1,
    borderRightColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: adminSpacing.md,
    fontSize: 14,
    color: adminColors.ink,
  },
  pickerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  pickerWithAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  dropdownInputFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  addOutlineBtn: {
    height: 44,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOutlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brand,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.xs,
    marginTop: adminSpacing.sm,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    gap: adminSpacing.xs,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: adminColors.rustDeep,
  },
  chipClose: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.rustDeep,
    marginLeft: 2,
  },
  pickerInputText: {
    fontSize: 14,
    color: adminColors.ink,
  },
  pickerPlaceholderText: {
    fontSize: 14,
    color: adminColors.placeholder,
  },
  helperCaption: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.xs,
    lineHeight: 15,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  col: {
    flex: 1,
  },
  unitInputRow: {
    flexDirection: 'row',
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    overflow: 'hidden',
    backgroundColor: adminColors.card,
  },
  unitInputField: {
    flex: 1,
    paddingHorizontal: adminSpacing.md,
    fontSize: 14,
    color: adminColors.ink,
  },
  unitSuffixBox: {
    width: 60,
    backgroundColor: adminColors.canvas,
    borderLeftWidth: 1,
    borderLeftColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitSuffixText: {
    fontSize: 12,
    color: adminColors.muted,
  },
  readOnlyInputBox: {
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  readOnlyInputText: {
    fontSize: 13,
    color: adminColors.muted,
  },
  // Upload boxes
  uploadDashedBoxSingle: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.brand,
    borderRadius: adminRadius.xl,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.lg,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  twoCardsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  uploadedFrontCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xl,
    backgroundColor: adminColors.canvas,
    overflow: 'hidden',
  },
  uploadedFrontTop: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.md,
  },
  uploadedFrontMeta: {
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  uploadedStatusGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  uploadedActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    backgroundColor: adminColors.canvas,
  },
  replaceBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  replaceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.rustDeep,
  },
  actionDivider: {
    width: 1,
    backgroundColor: adminColors.border,
  },
  removeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  uploadDashedBoxHalf: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.brand,
    borderRadius: adminRadius.xl,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  uploadDashedSubBanner: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  uploadDashedSubText: {
    fontSize: 11,
    color: adminColors.muted,
  },
  uploadActionBtn: {
    paddingVertical: 2,
    paddingHorizontal: adminSpacing.sm,
  },
  uploadActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.rustDeep,
  },
  // Read-only Verification Details Card
  readOnlyVerificationCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm,
  },
  readOnlyDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  readOnlyLabel: {
    fontSize: 12,
    color: adminColors.muted,
  },
  readOnlyValueLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readOnlyValueBold: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  readOnlyValueDash: {
    fontSize: 14,
    color: adminColors.muted,
  },
  readOnlyValueSuccess: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  disclaimerBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 15,
    color: adminColors.muted,
  },
  // Map card
  mapContainer: {
    borderRadius: adminRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: adminSpacing.md,
  },
  mapTagPill: {
    position: 'absolute',
    bottom: adminSpacing.sm,
    right: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
    ...adminShadow.sm,
  },
  mapTagPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: adminColors.muted,
  },
  plotsListContainer: {
    gap: adminSpacing.sm,
  },
  plotItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.xs,
  },
  plotInfoWrap: {
    flex: 1,
  },
  plotNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  plotSubText: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
  },
  plotDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.xs,
  },
  plotDashText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  plotActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  plotActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  addDashedBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.md,
    backgroundColor: adminColors.canvas,
    marginTop: adminSpacing.xs,
  },
  addDashedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.rustDeep,
  },
  // Document styles
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  docTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  verifiedDocBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  verifiedDocBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  correctionBadge: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  correctionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  docSubText: {
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  docWarningCard: {
    borderColor: adminColors.danger.border,
  },
  docButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  docPreviewBtn: {
    flex: 1,
    height: 38,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docPreviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  docLockedBtn: {
    flex: 1,
    height: 38,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docLockedBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.muted,
  },
  docOutlineBrandBtn: {
    flex: 1,
    height: 38,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docOutlineBrandBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.brand,
  },
  docSolidBrandBtn: {
    flex: 1,
    height: 38,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docSolidBrandBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  addDocDashedBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.md,
    backgroundColor: adminColors.canvas,
    marginBottom: adminSpacing.md,
  },
  addDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  addDocBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.rustDeep,
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    flexDirection: 'row',
    padding: adminSpacing.lg,
    gap: adminSpacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  saveBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});
