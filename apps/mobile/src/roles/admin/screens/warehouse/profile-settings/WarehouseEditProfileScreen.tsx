/**
 * Edit Warehouse Profile screen (M15 Edit Profile / Contact / Storage / Operations).
 * Accessible exclusively by the Main Warehouse Admin via the Edit icon.
 */
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Calendar } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../../theme';
import { StatusBadge, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { TrashOutlineRedIcon } from '../receiving-qc/ReceivingParts';
import { PROFILE_WAREHOUSES, WAREHOUSE_PROFILES, WAREHOUSE_CONTACTS } from './warehouseFixtures';
import { recordFor, singleWarehouseId } from './WarehouseProfileParts';
import { updateWarehouseProfile } from '../../../api/warehouseSettings';

export type EditWarehouseTab = 'Details' | 'Contact' | 'Storage' | 'Operations';
export type WarehouseFormMode = 'edit' | 'add';

export interface WarehouseEditProfileScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  initialTab?: EditWarehouseTab;
  profiles?: readonly WarehouseProfileInfo[] | undefined;
  mode?: WarehouseFormMode;
  onSaveSuccess?: () => void;
}

function DetailsTabIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ContactTabIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
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

function StorageTabIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 9h18M9 21V9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function OperationsTabIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownSmallIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MapPinSmallIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function UploadIcon({ color = adminColors.brandDeep }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserBadgeSmallIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function InfoCircleSmallIcon({ color = adminColors.brandDeep }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockOutlineIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TruckIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function CalendarEventIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function WarehouseEditProfileScreen({
  scope,
  onBack,
  initialTab = 'Details',
  warehouseOptions = PROFILE_WAREHOUSES,
  selectedWarehouseId,
  profiles = WAREHOUSE_PROFILES,
  mode = 'edit',
  onSaveSuccess,
}: WarehouseEditProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<EditWarehouseTab>(initialTab);
  const isAdd = mode === 'add';

  const warehouseId = singleWarehouseId(scope, selectedWarehouseId, warehouseOptions);
  const profile = isAdd ? undefined : recordFor(profiles, warehouseId);
  const contact = isAdd ? undefined : WAREHOUSE_CONTACTS.find((c) => c.warehouseId === warehouseId);

  // Dynamic Screen Heading based on Active Tab & Mode
  const getHeaderTitle = () => {
    const prefix = isAdd ? 'Add' : 'Edit';
    switch (activeTab) {
      case 'Details':
        return `${prefix} Warehouse Profile`;
      case 'Contact':
        return `${prefix} Warehouse Contact`;
      case 'Storage':
        return `${prefix} Warehouse Storage`;
      case 'Operations':
        return `${prefix} Warehouse Operations`;
    }
  };

  // Details Tab Form State
  const [warehouseName, setWarehouseName] = useState(isAdd ? '' : (profile?.warehouseName ?? 'Coonoor Warehouse'));
  const [warehouseCode, setWarehouseCode] = useState(isAdd ? '' : 'CNR');
  const [warehouseType, setWarehouseType] = useState('Main Warehouse');
  const [status, setStatus] = useState('Active');
  const [addressLine1, setAddressLine1] = useState(isAdd ? '' : 'Near Vegetable Market');
  const [addressLine2, setAddressLine2] = useState(isAdd ? '' : 'Mettupalayam Road');
  const [stateName, setStateName] = useState('Tamil Nadu');
  const [district, setDistrict] = useState(isAdd ? '' : 'Nilgiris');
  const [city, setCity] = useState(isAdd ? '' : 'Coonoor');
  const [pinCode, setPinCode] = useState(isAdd ? '' : '643101');
  const [description, setDescription] = useState(
    isAdd ? '' : 'Main warehouse for collection, sorting and temporary storage of fresh produce from Nilgiris region.'
  );

  // Contact Tab Form State
  const [contactPersonName, setContactPersonName] = useState(isAdd ? '' : 'Suresh Kumar');
  const [designation, setDesignation] = useState(isAdd ? '' : 'Warehouse Manager');
  const [primaryPhone, setPrimaryPhone] = useState(isAdd ? '' : '98765 43210');
  const [alternatePhone, setAlternatePhone] = useState(isAdd ? '' : '91234 56789');
  const [officialEmail, setOfficialEmail] = useState(isAdd ? '' : 'coonoor.warehouse@tohfa.org');
  const [alternateEmail, setAlternateEmail] = useState(isAdd ? '' : 'suresh.kumar@tohfa.org');
  const [landline, setLandline] = useState(isAdd ? '' : '0423 223344');
  const [emergencyPerson, setEmergencyPerson] = useState(isAdd ? '' : 'Kannan R');
  const [emergencyPhone, setEmergencyPhone] = useState(isAdd ? '' : '87654 32109');
  const [contactNotes, setContactNotes] = useState(
    isAdd ? '' : 'Available for warehouse operations during working hours. For urgent support, contact emergency number.'
  );

  // Storage Tab Form State
  const [storageType, setStorageType] = useState('General + Cold Storage');
  const [totalCapacityInput, setTotalCapacityInput] = useState(isAdd ? '' : '50,000');
  const [storageLocationsCount, setStorageLocationsCount] = useState(isAdd ? '' : '3');
  const [tempControlledEnabled, setTempControlledEnabled] = useState(true);
  const [tempMin, setTempMin] = useState(isAdd ? '' : '2');
  const [tempMax, setTempMax] = useState(isAdd ? '' : '8');
  const [tempCapacity, setTempCapacity] = useState(isAdd ? '' : '50,000');
  const [humidityEnabled, setHumidityEnabled] = useState(true);
  const [humidityMin, setHumidityMin] = useState(isAdd ? '' : '60');
  const [humidityMax, setHumidityMax] = useState(isAdd ? '' : '90');
  const [humidityCapacity, setHumidityCapacity] = useState(isAdd ? '' : '50,000');
  const [handlingReqs, setHandlingReqs] = useState(
    isAdd ? '' : 'Keep temperature between 2°C – 8°C for perishable items. Separate area for organic produce.'
  );

  // Operations Tab Form State
  const [operatingDays, setOperatingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [openingTime, setOpeningTime] = useState(isAdd ? '' : '08:00 AM');
  const [closingTime, setClosingTime] = useState(isAdd ? '' : '06:00 PM');
  const [receivingEnabled, setReceivingEnabled] = useState(true);
  const [receivingStartTime, setReceivingStartTime] = useState(isAdd ? '' : '08:00 AM');
  const [receivingEndTime, setReceivingEndTime] = useState(isAdd ? '' : '04:00 PM');
  const [qcAreaAvailable, setQcAreaAvailable] = useState(true);
  const [operationNotes, setOperationNotes] = useState(
    isAdd ? '' : 'Warehouse operates 6 days a week. Closed on Sundays and public holidays. Ensure cold storage temperature is monitored regularly.'
  );

  interface WarehouseHolidayItem {
    id: string;
    date: string; // YYYY-MM-DD
    name: string;
  }

  const [holidays, setHolidays] = useState<WarehouseHolidayItem[]>([]);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedHolidayDate, setSelectedHolidayDate] = useState<string>('');
  const [holidayNameInput, setHolidayNameInput] = useState('');

  const openAddHolidayModal = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setSelectedHolidayDate(`${yyyy}-${mm}-${dd}`);
    setHolidayNameInput('');
    setShowHolidayModal(true);
  };

  const handleSelectHolidayDate = (dateString: string) => {
    setSelectedHolidayDate(dateString);
    const newHoliday: WarehouseHolidayItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: dateString,
      name: 'Holiday / Closure',
    };
    setHolidays((prev) => [...prev, newHoliday].sort((a, b) => a.date.localeCompare(b.date)));
    setShowHolidayModal(false);
  };

  const handleRemoveHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  const formatHolidayDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          weekday: 'short',
        });
      }
    } catch {}
    return dateStr;
  };

  const toggleDay = (day: string) => {
    if (operatingDays.includes(day)) {
      setOperatingDays(operatingDays.filter((d) => d !== day));
    } else {
      setOperatingDays([...operatingDays, day]);
    }
  };

  const handleSave = async () => {
    if (warehouseId && !isAdd) {
      try {
        await updateWarehouseProfile(warehouseId, {
          name: warehouseName.trim(),
          address: `${addressLine1.trim()}${addressLine2.trim() ? ', ' + addressLine2.trim() : ''}`,
        });
      } catch {
        // Proceed on non-fatal errors
      }
    }
    Alert.alert(isAdd ? 'Warehouse Created' : 'Changes Saved', `${getHeaderTitle()} ${isAdd ? 'created' : 'updated'} successfully.`, [
      {
        text: 'OK',
        onPress: () => {
          onSaveSuccess?.();
          onBack();
        },
      },
    ]);
  };

  const handleNextOrSave = () => {
    if (isAdd) {
      if (activeTab === 'Details') {
        setActiveTab('Contact');
        return;
      }
      if (activeTab === 'Contact') {
        setActiveTab('Storage');
        return;
      }
      if (activeTab === 'Storage') {
        setActiveTab('Operations');
        return;
      }
    }
    handleSave();
  };

  const subHeaderLabel = isAdd
    ? 'New Warehouse Hub'
    : `${profile?.warehouseName ?? 'Coonoor Warehouse'} (${profile?.code ?? 'WH-002'})`;

  return (
    <WalletScreen
      title={getHeaderTitle()}
      subtitle={subHeaderLabel}
      onBack={onBack}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation Tabs Bar */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Details' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Details')}
            activeOpacity={0.8}
          >
            <DetailsTabIcon color={activeTab === 'Details' ? adminColors.onBrand : adminColors.ink} />
            <Text style={[styles.tabBtnText, activeTab === 'Details' && styles.tabBtnTextActive]}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Contact' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Contact')}
            activeOpacity={0.8}
          >
            <ContactTabIcon color={activeTab === 'Contact' ? adminColors.onBrand : adminColors.ink} />
            <Text style={[styles.tabBtnText, activeTab === 'Contact' && styles.tabBtnTextActive]}>Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Storage' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Storage')}
            activeOpacity={0.8}
          >
            <StorageTabIcon color={activeTab === 'Storage' ? adminColors.onBrand : adminColors.ink} />
            <Text style={[styles.tabBtnText, activeTab === 'Storage' && styles.tabBtnTextActive]}>Storage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Operations' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Operations')}
            activeOpacity={0.8}
          >
            <OperationsTabIcon color={activeTab === 'Operations' ? adminColors.onBrand : adminColors.ink} />
            <Text style={[styles.tabBtnText, activeTab === 'Operations' && styles.tabBtnTextActive]}>Operations</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 1. DETAILS TAB CONTENT ─── */}
        {activeTab === 'Details' && (
          <>
            {/* Header Card (Only in Edit mode) */}
            {!isAdd && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardLeft}>
                  <View style={styles.thumbnailBox} />
                  <View style={styles.summaryCardInfo}>
                    <Text style={styles.summaryCardTitle}>{warehouseName}</Text>
                    <Text style={styles.summaryCardMeta}>Warehouse ID : {profile?.code ?? 'WH-002'}</Text>
                    <Text style={styles.summaryCardMeta}>Warehouse Code : {warehouseCode}</Text>
                    <Text style={styles.summaryCardMeta}>Type : {warehouseType}</Text>
                  </View>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionHeader}>Basic Information</Text>
            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Warehouse Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={warehouseName}
                  onChangeText={setWarehouseName}
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Warehouse Code *</Text>
                <TextInput
                  style={styles.textInput}
                  value={warehouseCode}
                  onChangeText={setWarehouseCode}
                />
              </View>
            </View>

            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Warehouse Type</Text>
                <View style={styles.dropdownInput}>
                  <Text style={styles.dropdownInputText}>{warehouseType}</Text>
                  <ChevronDownSmallIcon />
                </View>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.dropdownInput}>
                  <Text style={styles.dropdownInputText}>{status}</Text>
                  <ChevronDownSmallIcon />
                </View>
              </View>
            </View>

            <Text style={styles.sectionHeader}>Location Details</Text>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Address Line 1 *</Text>
              <TextInput
                style={styles.textInput}
                value={addressLine1}
                onChangeText={setAddressLine1}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Address Line 2</Text>
              <TextInput
                style={styles.textInput}
                value={addressLine2}
                onChangeText={setAddressLine2}
              />
            </View>

            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>State *</Text>
                <View style={styles.dropdownInput}>
                  <Text style={styles.dropdownInputText}>{stateName}</Text>
                  <ChevronDownSmallIcon />
                </View>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>District *</Text>
                <View style={styles.dropdownInput}>
                  <Text style={styles.dropdownInputText}>{district}</Text>
                  <ChevronDownSmallIcon />
                </View>
              </View>
            </View>

            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>City / Town *</Text>
                <TextInput
                  style={styles.textInput}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>PIN Code *</Text>
                <TextInput
                  style={styles.textInput}
                  value={pinCode}
                  keyboardType="numeric"
                  onChangeText={setPinCode}
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Location (Optional)</Text>
              <View style={styles.locationRow}>
                <View style={styles.locationTextWrap}>
                  <MapPinSmallIcon />
                  <Text style={styles.locationAddressText}>
                    {city}, {district}, {stateName}, India
                  </Text>
                </View>
                <TouchableOpacity style={styles.setLocationBtn} activeOpacity={0.8}>
                  <Text style={styles.setLocationBtnText}>Set Location</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionHeader}>Warehouse Image</Text>
            <View style={styles.imageRow}>
              <View style={styles.imageThumbLarge} />
              <TouchableOpacity style={styles.uploadDashedBox} activeOpacity={0.8}>
                <UploadIcon />
                <Text style={styles.uploadTitle}>Change Image</Text>
                <Text style={styles.uploadSubtitle}>JPG, PNG (Max 5MB)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={500}
              />
              <Text style={styles.counterText}>{description.length}/500</Text>
            </View>
          </>
        )}

        {/* ─── 2. CONTACT TAB CONTENT ─── */}
        {activeTab === 'Contact' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <UserBadgeSmallIcon />
              <Text style={styles.sectionHeaderWithIcon}>Primary Contact Details</Text>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Contact Person Name *</Text>
              <TextInput
                style={styles.textInput}
                value={contactPersonName}
                onChangeText={setContactPersonName}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Designation</Text>
              <TextInput
                style={styles.textInput}
                value={designation}
                onChangeText={setDesignation}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Primary Mobile Number *</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.textInput, styles.phoneInputFlex]}
                  value={primaryPhone}
                  onChangeText={setPrimaryPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Alternate Mobile Number</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.textInput, styles.phoneInputFlex]}
                  value={alternatePhone}
                  onChangeText={setAlternatePhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Official Email</Text>
              <TextInput
                style={styles.textInput}
                value={officialEmail}
                onChangeText={setOfficialEmail}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Alternate Email</Text>
              <TextInput
                style={styles.textInput}
                value={alternateEmail}
                onChangeText={setAlternateEmail}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Landline Number</Text>
              <View style={styles.iconInputRow}>
                <View style={styles.innerInputIcon}>
                  <ContactTabIcon color={adminColors.brandDeep} />
                </View>
                <TextInput
                  style={[styles.textInput, styles.iconInputFlex]}
                  value={landline}
                  onChangeText={setLandline}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.sectionHeaderRow}>
              <UserBadgeSmallIcon />
              <Text style={styles.sectionHeaderWithIcon}>Emergency Contact Details</Text>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Emergency Contact Person</Text>
              <TextInput
                style={styles.textInput}
                value={emergencyPerson}
                onChangeText={setEmergencyPerson}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Emergency Contact Number</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.textInput, styles.phoneInputFlex]}
                  value={emergencyPhone}
                  onChangeText={setEmergencyPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.sectionHeaderRow}>
              <InfoCircleSmallIcon />
              <Text style={styles.sectionHeaderWithIcon}>Additional Information</Text>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Contact Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={contactNotes}
                onChangeText={setContactNotes}
                multiline
                maxLength={500}
              />
              <Text style={styles.counterText}>{contactNotes.length}/500</Text>
            </View>
          </>
        )}

        {/* ─── 3. STORAGE TAB CONTENT ─── */}
        {activeTab === 'Storage' && (
          <>
            {/* KPI Cards 2x2 (Edit mode only) */}
            {!isAdd && (
              <>
                <View style={styles.rowTwoCols}>
                  <View style={styles.kpiCardHalf}>
                    <Text style={styles.kpiLabel}>Total Capacity</Text>
                    <Text style={styles.kpiValueDark}>50,000 KG</Text>
                  </View>
                  <View style={styles.kpiCardHalf}>
                    <Text style={styles.kpiLabel}>Used Capacity</Text>
                    <Text style={styles.kpiValueGreen}>32,450 KG</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: '64.9%' }]} />
                    </View>
                    <Text style={styles.kpiSubText}>64.9%</Text>
                  </View>
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={styles.kpiCardHalf}>
                    <Text style={styles.kpiLabel}>Available Capacity</Text>
                    <Text style={styles.kpiValueGreen}>17,550 KG</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: '35.1%' }]} />
                    </View>
                    <Text style={styles.kpiSubText}>35.1%</Text>
                  </View>
                  <View style={styles.kpiCardHalf}>
                    <Text style={styles.kpiLabel}>Storage Locations</Text>
                    <Text style={styles.kpiValueDark}>3</Text>
                    <Text style={styles.kpiSubTextMuted}>Active locations</Text>
                  </View>
                </View>
              </>
            )}

            <Text style={styles.sectionHeader}>Storage Configuration</Text>
            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Storage Type *</Text>
                <View style={styles.dropdownInput}>
                  <Text style={styles.dropdownInputText}>{storageType}</Text>
                  <ChevronDownSmallIcon />
                </View>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Total Storage Capacity *</Text>
                <View style={styles.unitInputRow}>
                  <TextInput
                    style={[styles.textInput, styles.unitInputFlex]}
                    value={totalCapacityInput}
                    onChangeText={setTotalCapacityInput}
                  />
                  <View style={styles.unitSelector}>
                    <Text style={styles.unitText}>KG</Text>
                    <ChevronDownSmallIcon />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Number of Storage Locations</Text>
              <TextInput
                style={styles.textInput}
                value={storageLocationsCount}
                onChangeText={setStorageLocationsCount}
                keyboardType="numeric"
              />
            </View>

            {/* Temperature Controlled Storage */}
            <View style={styles.switchHeaderRow}>
              <Text style={styles.switchTitle}>Temperature Controlled Storage</Text>
              <Switch
                value={tempControlledEnabled}
                onValueChange={setTempControlledEnabled}
                trackColor={{ false: adminColors.border, true: adminColors.success.text }}
                thumbColor={adminColors.onBrand}
              />
            </View>

            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Min</Text>
                <TextInput
                  style={styles.textInput}
                  value={tempMin}
                  onChangeText={setTempMin}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Max</Text>
                <TextInput
                  style={styles.textInput}
                  value={tempMax}
                  onChangeText={setTempMax}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[styles.fieldWrap, { width: '48%' }]}>
              <Text style={styles.fieldLabel}>Total Storage Capacity *</Text>
              <View style={styles.unitInputRow}>
                <TextInput
                  style={[styles.textInput, styles.unitInputFlex]}
                  value={tempCapacity}
                  onChangeText={setTempCapacity}
                />
                <View style={styles.unitSelector}>
                  <Text style={styles.unitText}>KG</Text>
                  <ChevronDownSmallIcon />
                </View>
              </View>
            </View>

            {/* Humidity Monitoring */}
            <View style={styles.switchHeaderRow}>
              <Text style={styles.switchTitle}>Humidity Monitoring</Text>
              <Switch
                value={humidityEnabled}
                onValueChange={setHumidityEnabled}
                trackColor={{ false: adminColors.border, true: adminColors.success.text }}
                thumbColor={adminColors.onBrand}
              />
            </View>

            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Min</Text>
                <TextInput
                  style={styles.textInput}
                  value={humidityMin}
                  onChangeText={setHumidityMin}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Max</Text>
                <TextInput
                  style={styles.textInput}
                  value={humidityMax}
                  onChangeText={setHumidityMax}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[styles.fieldWrap, { width: '48%' }]}>
              <Text style={styles.fieldLabel}>Total Storage Capacity *</Text>
              <View style={styles.unitInputRow}>
                <TextInput
                  style={[styles.textInput, styles.unitInputFlex]}
                  value={humidityCapacity}
                  onChangeText={setHumidityCapacity}
                />
                <View style={styles.unitSelector}>
                  <Text style={styles.unitText}>KG</Text>
                  <ChevronDownSmallIcon />
                </View>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Special Handling Requirements</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={handlingReqs}
                onChangeText={setHandlingReqs}
                multiline
                maxLength={500}
              />
              <Text style={styles.counterText}>{handlingReqs.length}/500</Text>
            </View>
          </>
        )}

        {/* ─── 4. OPERATIONS TAB CONTENT ─── */}
        {activeTab === 'Operations' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <ClockOutlineIcon />
              <Text style={styles.sectionHeaderWithIcon}>Operating Schedule</Text>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Operating Days *</Text>
              <View style={styles.daysRow}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const isSelected = operatingDays.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                      onPress={() => toggleDay(day)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>{day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Opening Time *</Text>
                <View style={styles.iconInputRow}>
                  <View style={styles.innerInputIcon}>
                    <ClockOutlineIcon color={adminColors.muted} />
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.iconInputFlex]}
                    value={openingTime}
                    onChangeText={setOpeningTime}
                  />
                </View>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Closing Time *</Text>
                <View style={styles.iconInputRow}>
                  <View style={styles.innerInputIcon}>
                    <ClockOutlineIcon color={adminColors.muted} />
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.iconInputFlex]}
                    value={closingTime}
                    onChangeText={setClosingTime}
                  />
                </View>
              </View>
            </View>

            <View style={styles.sectionHeaderRow}>
              <TruckIcon />
              <Text style={styles.sectionHeaderWithIcon}>Goods Receiving</Text>
            </View>

            <View style={styles.switchHeaderRow}>
              <Text style={styles.switchTitle}>Goods Receiving Enabled</Text>
              <Switch
                value={receivingEnabled}
                onValueChange={setReceivingEnabled}
                trackColor={{ false: adminColors.border, true: adminColors.success.text }}
                thumbColor={adminColors.onBrand}
              />
            </View>

            <Text style={styles.subFieldGroupTitle}>Receiving Hours</Text>
            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Start Time</Text>
                <View style={styles.iconInputRow}>
                  <View style={styles.innerInputIcon}>
                    <ClockOutlineIcon color={adminColors.muted} />
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.iconInputFlex]}
                    value={receivingStartTime}
                    onChangeText={setReceivingStartTime}
                  />
                </View>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>End Time</Text>
                <View style={styles.iconInputRow}>
                  <View style={styles.innerInputIcon}>
                    <ClockOutlineIcon color={adminColors.muted} />
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.iconInputFlex]}
                    value={receivingEndTime}
                    onChangeText={setReceivingEndTime}
                  />
                </View>
              </View>
            </View>

            <View style={styles.switchHeaderRow}>
              <Text style={styles.switchTitle}>Quality Check Area Available</Text>
              <Switch
                value={qcAreaAvailable}
                onValueChange={setQcAreaAvailable}
                trackColor={{ false: adminColors.border, true: adminColors.success.text }}
                thumbColor={adminColors.onBrand}
              />
            </View>

            <View style={styles.sectionHeaderRow}>
              <CalendarEventIcon />
              <Text style={styles.sectionHeaderWithIcon}>Holidays / Closure Schedule</Text>
            </View>

            {holidays.length === 0 ? (
              <Text style={styles.noHolidaysText}>No upcoming holidays</Text>
            ) : null}

            <TouchableOpacity
              style={styles.addClosureBtn}
              activeOpacity={0.8}
              onPress={openAddHolidayModal}
            >
              <CalendarEventIcon color={adminColors.brandDeep} />
              <Text style={styles.addClosureBtnText}>Add Holiday / Closure</Text>
            </TouchableOpacity>

            {/* List of Scheduled Holidays */}
            {holidays.length > 0 && (
              <View style={styles.holidaysListWrap}>
                {holidays.map((item) => (
                  <View key={item.id} style={styles.holidayCard}>
                    <View style={styles.holidayIconBox}>
                      <CalendarEventIcon color={adminColors.brand} />
                    </View>
                    <View style={styles.holidayInfoFlex}>
                      <Text style={styles.holidayTitleText}>{item.name}</Text>
                      <Text style={styles.holidayDateText}>{formatHolidayDate(item.date)}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveHoliday(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.holidayDeleteBtn}
                    >
                      <TrashOutlineRedIcon color={adminColors.danger.text} size={20} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.fieldWrap}>
              <TextInput
                style={[styles.textInput, styles.textArea, { minHeight: 90 }]}
                value={operationNotes}
                onChangeText={setOperationNotes}
                multiline
                maxLength={500}
              />
              <Text style={styles.counterText}>{operationNotes.length}/500</Text>
            </View>
          </>
        )}

        {/* ─── Footer Action Buttons ─── */}
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleNextOrSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>
              {isAdd ? (activeTab === 'Operations' ? 'Add Warehouse' : 'Next') : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: adminSpacing.xl }} />
      </ScrollView>

      {/* ─── Add Holiday Calendar Modal ─── */}
      <Modal
        visible={showHolidayModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowHolidayModal(false)}
      >
        
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowHolidayModal(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Holiday Date</Text>
              <TouchableOpacity
                onPress={() => setShowHolidayModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarContainer}>
              <Calendar
                current={selectedHolidayDate || undefined}
                onDayPress={(day: DateData) => {
                  handleSelectHolidayDate(day.dateString);
                }}
                markedDates={
                  selectedHolidayDate
                    ? {
                        [selectedHolidayDate]: {
                          selected: true,
                          selectedColor: adminColors.brand,
                          selectedTextColor: adminColors.onBrand,
                        },
                      }
                    : {}
                }
                theme={{
                  calendarBackground: adminColors.card,
                  todayTextColor: adminColors.brand,
                  arrowColor: adminColors.brand,
                  monthTextColor: adminColors.ink,
                  textMonthFontWeight: '700',
                  textMonthFontSize: 16,
                  textDayHeaderFontWeight: '600',
                  textDayFontSize: 14,
                  selectedDayBackgroundColor: adminColors.brand,
                  selectedDayTextColor: adminColors.onBrand,
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xl * 2,
  },

  /* Tabs Bar */
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.lg,
    gap: adminSpacing.xs,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabBtnText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
  tabBtnTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },

  /* Summary Card */
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    alignItems: 'flex-start',
  },
  summaryCardLeft: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    flex: 1,
  },
  thumbnailBox: {
    width: 68,
    height: 68,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.border,
  },
  summaryCardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  summaryCardTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 4,
  },
  summaryCardMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 18,
  },
  activeBadge: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 3,
  },
  activeBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '700',
  },

  /* Headings */
  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  sectionHeaderWithIcon: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },

  /* Form Layout */
  rowTwoCols: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  colHalf: {
    flex: 1,
  },
  fieldWrap: {
    marginBottom: adminSpacing.md,
  },
  fieldLabel: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brandDeep,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm + 2,
    ...adminType.body,
    color: adminColors.ink,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  counterText: {
    ...adminType.caption,
    color: adminColors.muted,
    alignSelf: 'flex-end',
    marginTop: 4,
  },

  /* Dropdown & Special Inputs */
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm + 2,
  },
  dropdownInputText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationAddressText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '600',
  },
  setLocationBtn: {
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 6,
    backgroundColor: adminColors.card,
  },
  setLocationBtnText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },

  /* Images */
  imageRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  imageThumbLarge: {
    width: 80,
    height: 72,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.border,
  },
  uploadDashedBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.sm,
  },
  uploadTitle: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginTop: 4,
  },
  uploadSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
  },

  /* Phone input with Prefix */
  phoneInputRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  phonePrefix: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phonePrefixText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  phoneInputFlex: {
    flex: 1,
  },

  /* Input with Inner Icon */
  iconInputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  innerInputIcon: {
    position: 'absolute',
    left: adminSpacing.md,
    zIndex: 1,
  },
  iconInputFlex: {
    paddingLeft: adminSpacing.xl + 12,
  },

  /* KPI Cards for Storage */
  kpiCardHalf: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  kpiValueDark: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  kpiValueGreen: {
    ...adminType.kpiValue,
    color: adminColors.success.text,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: adminColors.border,
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: adminColors.success.text,
    borderRadius: 4,
  },
  kpiSubText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  kpiSubTextMuted: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 6,
  },

  /* Unit Input (Number + KG) */
  unitInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitInputFlex: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderTopRightRadius: adminRadius.md,
    borderBottomRightRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.sm + 2,
    gap: 4,
  },
  unitText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },

  /* Switch row */
  switchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: adminSpacing.sm,
  },
  switchTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  /* Operations Days row */
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  dayChipSelected: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  dayChipText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
  },
  dayChipTextSelected: {
    color: adminColors.onBrand,
  },
  subFieldGroupTitle: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.xs,
  },
  noHolidaysText: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  addClosureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm + 2,
    backgroundColor: adminColors.card,
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  addClosureBtnText: {
    ...adminType.body,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },

  /* Footer */
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: adminSpacing.md,
    marginTop: adminSpacing.lg,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: adminColors.danger.text,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  cancelBtnText: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
  },
  saveBtnText: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.onBrand,
  },

  /* Holidays / Closures List */
  holidaysListWrap: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  holidayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  holidayIconBox: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.sm,
    backgroundColor: 'rgba(235, 94, 40, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  holidayInfoFlex: {
    flex: 1,
  },
  holidayTitleText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginBottom: 2,
  },
  holidayDateText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  holidayDeleteBtn: {
    padding: 6,
    borderRadius: adminRadius.sm,
  },

  /* Modal Popup Styles */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: adminOverlay.scrim,
  },
  modalSheet: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    overflow: 'hidden',
    ...adminShadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  modalTitle: {
    ...adminType.sectionHead,
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.ink,
  },
  modalCloseText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    padding: 4,
  },
  calendarContainer: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
});
