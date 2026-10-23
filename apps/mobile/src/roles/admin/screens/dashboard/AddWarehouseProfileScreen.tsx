import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminShadow,
} from '../../theme';

export interface AddWarehouseProfileScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

// ─── SVG Icons Matching Exact Visuals ────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabDocumentIcon({ size = 18, color = '#1A1412' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="10" y1="9" x2="8" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TabPhoneIcon({ size = 18, color = '#1A1412' }: { size?: number; color?: string }) {
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

function TabStorageIcon({ size = 18, color = '#1A1412' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4.5" width="16" height="4.5" rx="1.2" stroke={color} strokeWidth="2" fill="none" />
      <Rect x="5" y="9" width="14" height="11" rx="1.2" stroke={color} strokeWidth="2" fill="none" />
      <Line x1="10" y1="13" x2="14" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TabClockIcon({ size = 18, color = '#1A1412' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PlaceholderImageIcon({ size = 26, color = '#736B66' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path d="m21 15-5-5L5 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = '#1A1412' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MapPinOrangeIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function UploadTrayIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 3v11M16 7l-4-4-4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserOutlineIcon({ size = 18, color = '#1A1412' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function EmergencyUserAlertIcon({ size = 18, color = '#D9534F' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Line x1="19" y1="8" x2="19" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="19" y1="16" x2="19.01" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 18, color = '#1A1412' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12.01" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LandlinePhoneIcon({ size = 16, color = '#666666' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BlueClockIcon({ size = 18, color = '#2B6CB0' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DeliveryTruckIcon({ size = 18, color = '#2B6CB0' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 3h15v13H1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function CalendarScheduleIcon({ size = 18, color = '#6B46C1' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      <Line x1="7.99" y1="14" x2="8.01" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="14" x2="12.02" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="14" x2="16.02" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SuccessCheckLargeIcon({ size = 48, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" fill={adminColors.success.bg} />
      <Path d="M8 12.5l2.8 2.8L16.5 9" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Reusable Toggle Component Matching Exact Green Pill Visual ─────────────

function GreenToggleSwitch({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.toggleTrack,
        active ? styles.toggleTrackActive : styles.toggleTrackInactive,
      ]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.toggleThumb,
          active ? styles.toggleThumbActive : styles.toggleThumbInactive,
        ]}
      />
    </TouchableOpacity>
  );
}

type TabType = 'Details' | 'Contact' | 'Storage' | 'Operations';

export function AddWarehouseProfileScreen({
  onBack,
  onSuccess,
}: AddWarehouseProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Details');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeTab]);

  // Form State: Tab 1 Details
  const [warehouseName, setWarehouseName] = useState('');
  const warehouseCode = 'autogenerat';
  const [warehouseLocation, setWarehouseLocation] = useState('Select...');
  const [status, setStatus] = useState('Active');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [stateVal, setStateVal] = useState('Select...');
  const [districtVal, setDistrictVal] = useState('Select...');
  const [cityTown, setCityTown] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [locationPinned, setLocationPinned] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [description, setDescription] = useState(
    'Main hub warehouse serving central Nilgiris tea & fresh produce collections with integrated cold chain storage.'
  );

  // Form State: Tab 2 Contact
  const [contactName, setContactName] = useState('');
  const [designation, setDesignation] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [altEmail, setAltEmail] = useState('');
  const [landlineNumber, setLandlineNumber] = useState('');
  const [emergencyContactPerson, setEmergencyContactPerson] = useState('');
  const [emergencyContactNumber, setEmergencyContactNumber] = useState('');
  const [contactNotes, setContactNotes] = useState(
    'Primary facility manager available during peak morning inbounds (06:00 - 14:00). Escalate off-hour logistics to emergency contact.'
  );

  // Form State: Tab 3 Storage (Matching Screenshots 1 & 2)
  const [totalCapacityKpi] = useState('0 KG');
  const [usedCapacityKpi] = useState('0 KG');
  const [availableCapacityKpi] = useState('0 KG');
  const [storageLocationsCount] = useState('0');

  const [storageType, setStorageType] = useState('Select...');
  const [configCapacity, setConfigCapacity] = useState('');
  const configUnit = 'KG';
  const [numStorageLocations, setNumStorageLocations] = useState('');

  const [tempControlledEnabled, setTempControlledEnabled] = useState(true);
  const [tempMin, setTempMin] = useState('');
  const [tempMax, setTempMax] = useState('');
  const [tempCapacity, setTempCapacity] = useState('');
  const tempUnit = 'KG';

  const [humidityEnabled, setHumidityEnabled] = useState(true);
  const [humidityMin, setHumidityMin] = useState('');
  const [humidityMax, setHumidityMax] = useState('');
  const [humidityCapacity, setHumidityCapacity] = useState('');
  const humidityUnit = 'KG';

  const [specialHandlingReq, setSpecialHandlingReq] = useState(
    'Cold chain maintained at 2-4 C for high perishables. Regular humidity checks logged twice daily.'
  );

  // Form State: Tab 4 Operations (Matching Screenshot 3)
  const [selectedDays, setSelectedDays] = useState<string[]>([
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ]);
  const [openingTime, setOpeningTime] = useState('12:00 AM');
  const [closingTime, setClosingTime] = useState('12:00 PM');
  const [goodsReceivingEnabled, setGoodsReceivingEnabled] = useState(true);
  const [receivingStartTime, setReceivingStartTime] = useState('12:00 AM');
  const [receivingEndTime, setReceivingEndTime] = useState('12:00 PM');
  const [qcAreaAvailable, setQcAreaAvailable] = useState(true);
  const [holidaysNotes, setHolidaysNotes] = useState(
    'Standard holiday closures align with regional agricultural holidays. Facility operates with emergency shift staff on Sundays.'
  );

  // Dropdown States
  const [openDropdown, setOpenDropdown] = useState<
    'location' | 'status' | 'state' | 'district' | 'storageType' | 'configUnit' | 'tempUnit' | 'humidityUnit' | null
  >(null);

  // Confirmation Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Dynamic Header Title
  const headerTitle = useMemo(() => {
    switch (activeTab) {
      case 'Details':
        return 'Add Warehouse Profile';
      case 'Contact':
        return 'Add Warehouse Contact';
      case 'Storage':
        return 'Add Warehouse Storage';
      case 'Operations':
        return 'Add Warehouse Operations';
      default:
        return 'Add Warehouse Profile';
    }
  }, [activeTab]);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleNextFromDetails = () => {
    setActiveTab('Contact');
  };

  const handleNextFromContact = () => {
    setActiveTab('Storage');
  };

  const handleNextFromStorage = () => {
    setActiveTab('Operations');
  };

  const handleSubmitAll = () => {
    setShowSuccessModal(true);
  };

  const handleFinishSuccess = () => {
    setShowSuccessModal(false);
    if (onSuccess) onSuccess();
    else onBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Orange Header Banner (Matching exact mockup) ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (activeTab === 'Operations') setActiveTab('Storage');
              else if (activeTab === 'Storage') setActiveTab('Contact');
              else if (activeTab === 'Contact') setActiveTab('Details');
              else onBack();
            }}
            activeOpacity={0.8}
            accessibilityLabel="Back"
          >
            <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 4 Top Tabs Pills (Matching Screenshots 1, 2, 3) ── */}
        <View style={styles.tabsRow}>
          {/* Tab 1: Details */}
          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'Details' ? styles.tabPillActive : styles.tabPillInactive,
            ]}
            onPress={() => setActiveTab('Details')}
            activeOpacity={0.85}
          >
            <TabDocumentIcon
              size={18}
              color={activeTab === 'Details' ? '#FFFFFF' : '#1A1412'}
            />
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'Details' ? styles.tabPillTextActive : styles.tabPillTextInactive,
              ]}
            >
              Details
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Contact */}
          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'Contact' ? styles.tabPillActive : styles.tabPillInactive,
            ]}
            onPress={() => setActiveTab('Contact')}
            activeOpacity={0.85}
          >
            <TabPhoneIcon
              size={18}
              color={activeTab === 'Contact' ? '#FFFFFF' : '#1A1412'}
            />
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'Contact' ? styles.tabPillTextActive : styles.tabPillTextInactive,
              ]}
            >
              Contact
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Storage */}
          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'Storage' ? styles.tabPillActive : styles.tabPillInactive,
            ]}
            onPress={() => setActiveTab('Storage')}
            activeOpacity={0.85}
          >
            <TabStorageIcon
              size={18}
              color={activeTab === 'Storage' ? '#FFFFFF' : '#1A1412'}
            />
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'Storage' ? styles.tabPillTextActive : styles.tabPillTextInactive,
              ]}
            >
              Storage
            </Text>
          </TouchableOpacity>

          {/* Tab 4: Operations */}
          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'Operations' ? styles.tabPillActive : styles.tabPillInactive,
            ]}
            onPress={() => setActiveTab('Operations')}
            activeOpacity={0.85}
          >
            <TabClockIcon
              size={18}
              color={activeTab === 'Operations' ? '#FFFFFF' : '#1A1412'}
            />
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'Operations' ? styles.tabPillTextActive : styles.tabPillTextInactive,
              ]}
            >
              Operations
            </Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: DETAILS
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Details' && (
          <View style={styles.tabContentContainer}>
            {/* ── Warehouse Profile Preview Card ── */}
            <View style={styles.profileSummaryCard}>
              <View style={styles.profileImagePlaceholder}>
                <PlaceholderImageIcon size={28} color="#736B66" />
              </View>
              <View style={styles.profileSummaryInfo}>
                <Text style={styles.profileNameDashes}>
                  {warehouseName.trim() ? warehouseName.trim() : '----'}
                </Text>
                <Text style={styles.profileMetaLine}>
                  Warehouse ID : <Text style={styles.profileMetaVal}>WH-0004</Text>
                </Text>
                <Text style={styles.profileMetaLine}>
                  Warehouse Code : <Text style={styles.profileMetaVal}>{warehouseCode}</Text>
                </Text>
                <Text style={styles.profileMetaLine}>
                  Type : <Text style={styles.profileMetaVal}>Central Storage</Text>
                </Text>
              </View>
            </View>

            {/* ── Section: Basic Information ── */}
            <Text style={styles.sectionHeading}>Basic Information</Text>

            <View style={styles.formRowTwoCols}>
              {/* Warehouse Name * */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>
                  Warehouse Name <Text style={styles.asterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder=""
                  placeholderTextColor="#9E9E9E"
                  value={warehouseName}
                  onChangeText={setWarehouseName}
                />
              </View>

              {/* Warehouse Code * */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>
                  Warehouse Code <Text style={styles.asterisk}>*</Text>
                </Text>
                <TextInput
                  style={[styles.textInput, styles.disabledInput]}
                  value={warehouseCode}
                  editable={false}
                />
              </View>
            </View>

            <View style={[styles.formRowTwoCols, { marginTop: 14 }]}>
              {/* Warehouse Location Dropdown */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>Warehouse Location</Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setOpenDropdown(openDropdown === 'location' ? null : 'location')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>
                    {warehouseLocation}
                  </Text>
                  <ChevronDownIcon size={16} color="#1A1412" />
                </TouchableOpacity>

                {openDropdown === 'location' && (
                  <View style={styles.dropdownPopoverMenu}>
                    <TouchableOpacity
                      style={[styles.dropdownItem, styles.dropdownItemActive]}
                      onPress={() => {
                        setWarehouseLocation('Select...');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, styles.dropdownItemTextActive]}>
                        Select...
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setWarehouseLocation('Ooty');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Ooty</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setWarehouseLocation('Kotagiri');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Kotagiri</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setWarehouseLocation('Coonoor');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Coonoor</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setWarehouseLocation('Gudalur Market');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Gudalur Market</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Status Dropdown */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>Status</Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownBtnText}>{status}</Text>
                  <ChevronDownIcon size={16} color="#1A1412" />
                </TouchableOpacity>

                {openDropdown === 'status' && (
                  <View style={styles.dropdownPopoverMenu}>
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        status === 'Active' ? styles.dropdownItemActive : null,
                      ]}
                      onPress={() => {
                        setStatus('Active');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          status === 'Active' ? styles.dropdownItemTextActive : null,
                        ]}
                      >
                        Active
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        status === 'Inactive' ? styles.dropdownItemActive : null,
                      ]}
                      onPress={() => {
                        setStatus('Inactive');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          status === 'Inactive' ? styles.dropdownItemTextActive : null,
                        ]}
                      >
                        Inactive
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* ── Section: Location Details ── */}
            <Text style={[styles.sectionHeading, { marginTop: 22 }]}>Location Details</Text>

            {/* Address Line 1 * */}
            <Text style={styles.inputLabel}>
              Address Line 1 <Text style={styles.asterisk}>*</Text>
            </Text>
            <View style={styles.inputWithIconContainer}>
              <TextInput
                style={styles.fullWidthInput}
                placeholder=""
                placeholderTextColor="#9E9E9E"
                value={addressLine1}
                onChangeText={setAddressLine1}
              />
            </View>

            {/* Address Line 2 */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Address Line 2</Text>
            <TextInput
              style={styles.textInput}
              placeholder=""
              placeholderTextColor="#9E9E9E"
              value={addressLine2}
              onChangeText={setAddressLine2}
            />

            {/* State * & District * */}
            <View style={[styles.formRowTwoCols, { marginTop: 14 }]}>
              {/* State * */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>
                  State <Text style={styles.asterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setOpenDropdown(openDropdown === 'state' ? null : 'state')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>
                    {stateVal}
                  </Text>
                  <ChevronDownIcon size={16} color="#1A1412" />
                </TouchableOpacity>

                {openDropdown === 'state' && (
                  <View style={styles.dropdownPopoverMenu}>
                    <TouchableOpacity
                      style={[styles.dropdownItem, styles.dropdownItemActive]}
                      onPress={() => {
                        setStateVal('Tamil Nadu');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, styles.dropdownItemTextActive]}>
                        Tamil Nadu
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setStateVal('Kerala');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Kerala</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setStateVal('Karnataka');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Karnataka</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* District * */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>
                  District <Text style={styles.asterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setOpenDropdown(openDropdown === 'district' ? null : 'district')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>
                    {districtVal}
                  </Text>
                  <ChevronDownIcon size={16} color="#1A1412" />
                </TouchableOpacity>

                {openDropdown === 'district' && (
                  <View style={styles.dropdownPopoverMenu}>
                    <TouchableOpacity
                      style={[styles.dropdownItem, styles.dropdownItemActive]}
                      onPress={() => {
                        setDistrictVal('Select...');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, styles.dropdownItemTextActive]}>
                        Select...
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setDistrictVal('Nilgiris');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Nilgiris</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setDistrictVal('Ooty');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Ooty</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setDistrictVal('Kotagiri');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Kotagiri</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* City / Town * & PIN Code * */}
            <View style={[styles.formRowTwoCols, { marginTop: 14 }]}>
              {/* City / Town * */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>
                  City / Town <Text style={styles.asterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder=""
                  placeholderTextColor="#9E9E9E"
                  value={cityTown}
                  onChangeText={setCityTown}
                />
              </View>

              {/* PIN Code * */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>
                  PIN Code <Text style={styles.asterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder=""
                  placeholderTextColor="#9E9E9E"
                  keyboardType="numeric"
                  value={pinCode}
                  onChangeText={setPinCode}
                />
              </View>
            </View>

            {/* Location (Optional) */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Location (Optional)</Text>
            <View style={styles.locationActionRow}>
              <TouchableOpacity
                style={styles.locationLinkBtn}
                onPress={() => {
                  setLocationPinned(!locationPinned);
                  Alert.alert(
                    'GPS Location',
                    locationPinned ? 'Location cleared.' : 'GPS Coordinates pinned: 11.4102° N, 76.6950° E'
                  );
                }}
                activeOpacity={0.8}
              >
                <MapPinOrangeIcon size={18} color={adminColors.brand} />
                <Text style={styles.locationLinkText}>
                  {locationPinned ? 'Coordinates: 11.4102° N, 76.6950° E' : 'Add location'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.setLocationBtn}
                onPress={() => {
                  setLocationPinned(true);
                  Alert.alert('Map Location', 'Selected on map: Ooty Central Agro-Hub.');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.setLocationBtnText}>Set Location</Text>
              </TouchableOpacity>
            </View>

            {/* ── Section: Warehouse Image ── */}
            <Text style={[styles.sectionHeading, { marginTop: 22 }]}>Warehouse Image</Text>
            <View style={styles.warehouseImageUploadRow}>
              <View style={styles.warehouseImageThumbnailBox}>
                <PlaceholderImageIcon size={26} color="#736B66" />
              </View>
              <TouchableOpacity
                style={styles.dashedUploadBox}
                onPress={() => {
                  setImageUploaded(!imageUploaded);
                  Alert.alert('Image Upload', 'Warehouse photo attached successfully.');
                }}
                activeOpacity={0.8}
              >
                <UploadTrayIcon size={22} color={adminColors.brand} />
                <Text style={styles.dashedUploadTitle}>Change Image</Text>
                <Text style={styles.dashedUploadSubtitle}>JPG, PNG (Max 5MB)</Text>
              </TouchableOpacity>
            </View>

            {/* ── Section: Description ── */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Description</Text>
            <TextInput
              style={styles.descriptionTextArea}
              multiline
              numberOfLines={4}
              maxLength={500}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter warehouse description..."
              placeholderTextColor="#9E9E9E"
            />
            <Text style={styles.charCounter}>{description.length}/500</Text>

            {/* ── Bottom Button: Next ── */}
            <TouchableOpacity
              style={styles.primaryNextBtn}
              onPress={handleNextFromDetails}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryNextBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: CONTACT
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Contact' && (
          <View style={styles.tabContentContainer}>
            {/* ── Section: Primary Contact Details () ── */}
            <View style={styles.sectionHeaderWithIcon}>
              <UserOutlineIcon size={18} color="#1A1412" />
              <Text style={styles.sectionHeadingWithIcon}>Primary Contact Details</Text>
            </View>

            {/* Contact Person Name * */}
            <Text style={styles.inputLabel}>
              Contact Person Name <Text style={styles.asterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder=""
              placeholderTextColor="#9E9E9E"
              value={contactName}
              onChangeText={setContactName}
            />

            {/* Designation */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Designation</Text>
            <TextInput
              style={styles.textInput}
              placeholder=""
              placeholderTextColor="#9E9E9E"
              value={designation}
              onChangeText={setDesignation}
            />

            {/* Primary Mobile Number * */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>
              Primary Mobile Number <Text style={styles.asterisk}>*</Text>
            </Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.phoneFlexInput]}
                placeholder=""
                placeholderTextColor="#9E9E9E"
                keyboardType="phone-pad"
                value={primaryPhone}
                onChangeText={setPrimaryPhone}
              />
            </View>

            {/* Alternate Mobile Number */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Alternate Mobile Number</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.phoneFlexInput]}
                placeholder=""
                placeholderTextColor="#9E9E9E"
                keyboardType="phone-pad"
                value={altPhone}
                onChangeText={setAltPhone}
              />
            </View>

            {/* Official Email */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Official Email</Text>
            <TextInput
              style={styles.textInput}
              placeholder=""
              placeholderTextColor="#9E9E9E"
              keyboardType="email-address"
              autoCapitalize="none"
              value={officialEmail}
              onChangeText={setOfficialEmail}
            />

            {/* Alternate Email */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Alternate Email</Text>
            <TextInput
              style={styles.textInput}
              placeholder=""
              placeholderTextColor="#9E9E9E"
              keyboardType="email-address"
              autoCapitalize="none"
              value={altEmail}
              onChangeText={setAltEmail}
            />

            {/* Landline Number with receiver icon */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Landline Number</Text>
            <View style={styles.landlineInputContainer}>
              <LandlinePhoneIcon size={16} color="#666666" />
              <TextInput
                style={styles.landlineTextInput}
                placeholder=""
                placeholderTextColor="#9E9E9E"
                keyboardType="phone-pad"
                value={landlineNumber}
                onChangeText={setLandlineNumber}
              />
            </View>

            {/* ── Section: Emergency Contact Details (! in Coral Red) ── */}
            <View style={[styles.sectionHeaderWithIcon, { marginTop: 24 }]}>
              <EmergencyUserAlertIcon size={18} color="#D9534F" />
              <Text style={[styles.sectionHeadingWithIcon, { color: '#D9534F' }]}>
                Emergency Contact Details
              </Text>
            </View>

            {/* Emergency Contact Person */}
            <Text style={styles.inputLabel}>Emergency Contact Person</Text>
            <TextInput
              style={styles.textInput}
              placeholder=""
              placeholderTextColor="#9E9E9E"
              value={emergencyContactPerson}
              onChangeText={setEmergencyContactPerson}
            />

            {/* Emergency Contact Number */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Emergency Contact Number</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.phoneFlexInput]}
                placeholder=""
                placeholderTextColor="#9E9E9E"
                keyboardType="phone-pad"
                value={emergencyContactNumber}
                onChangeText={setEmergencyContactNumber}
              />
            </View>

            {/* ── Section: Additional Information (ⓘ) ── */}
            <View style={[styles.sectionHeaderWithIcon, { marginTop: 24 }]}>
              <InfoCircleIcon size={18} color="#1A1412" />
              <Text style={styles.sectionHeadingWithIcon}>Additional Information</Text>
            </View>

            {/* Contact Notes */}
            <Text style={styles.inputLabel}>Contact Notes</Text>
            <TextInput
              style={styles.descriptionTextArea}
              multiline
              numberOfLines={4}
              maxLength={500}
              value={contactNotes}
              onChangeText={setContactNotes}
              placeholder="Enter contact notes..."
              placeholderTextColor="#9E9E9E"
            />
            <Text style={styles.charCounter}>{contactNotes.length}/500</Text>

            {/* ── Bottom Buttons: Previous & Next ── */}
            <View style={styles.twoBottomButtonsRow}>
              <TouchableOpacity
                style={styles.previousOutlineBtn}
                onPress={() => setActiveTab('Details')}
                activeOpacity={0.85}
              >
                <Text style={styles.previousOutlineBtnText}>Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextSolidBtn}
                onPress={handleNextFromContact}
                activeOpacity={0.85}
              >
                <Text style={styles.nextSolidBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: STORAGE (EXACT MATCH TO IMAGES 1 & 2)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Storage' && (
          <View style={styles.tabContentContainer}>
            {/* ── 4 Top KPI Capacity Cards (2x2 Grid) ── */}
            <View style={styles.kpiGridRow}>
              {/* Card 1: Total Capacity */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Total Capacity</Text>
                <Text style={styles.kpiValueDark}>{totalCapacityKpi}</Text>
              </View>

              {/* Card 2: Used Capacity */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Used Capacity</Text>
                <Text style={styles.kpiValueGreen}>{usedCapacityKpi}</Text>
                <View style={styles.kpiProgressBarTrack}>
                  <View style={[styles.kpiProgressBarFill, { width: '0%' }]} />
                </View>
                <Text style={styles.kpiSubText}>0%</Text>
              </View>
            </View>

            <View style={[styles.kpiGridRow, { marginTop: 12 }]}>
              {/* Card 3: Available Capacity */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Available Capacity</Text>
                <Text style={styles.kpiValueGreen}>{availableCapacityKpi}</Text>
                <View style={styles.kpiProgressBarTrack}>
                  <View style={[styles.kpiProgressBarFill, { width: '0%' }]} />
                </View>
                <Text style={styles.kpiSubText}>0%</Text>
              </View>

              {/* Card 4: Storage Locations */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Storage Locations</Text>
                <Text style={styles.kpiValueDark}>{storageLocationsCount}</Text>
                <Text style={styles.kpiSubTextNoBar}>Active locations</Text>
              </View>
            </View>

            {/* ── Section: Storage Configuration ── */}
            <Text style={[styles.sectionHeading, { marginTop: 22 }]}>Storage Configuration</Text>

            <View style={styles.formRowTwoCols}>
              {/* Storage Type * */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>
                  Storage Type <Text style={styles.asterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setOpenDropdown(openDropdown === 'storageType' ? null : 'storageType')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>
                    {storageType}
                  </Text>
                  <ChevronDownIcon size={16} color="#1A1412" />
                </TouchableOpacity>

                {openDropdown === 'storageType' && (
                  <View style={styles.dropdownPopoverMenu}>
                    <TouchableOpacity
                      style={[styles.dropdownItem, styles.dropdownItemActive]}
                      onPress={() => {
                        setStorageType('Select...');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, styles.dropdownItemTextActive]}>Select...</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setStorageType('Ambient Storage');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Ambient Storage</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setStorageType('Cold Storage');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Cold Storage</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setStorageType('Dry Bulk');
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Dry Bulk</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Total Storage Capacity * with unit KG */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>
                  Total Storage Capacity <Text style={styles.asterisk}>*</Text>
                </Text>
                <View style={styles.capacityInputContainer}>
                  <TextInput
                    style={styles.capacityTextInput}
                    placeholder=""
                    placeholderTextColor="#9E9E9E"
                    keyboardType="numeric"
                    value={configCapacity}
                    onChangeText={setConfigCapacity}
                  />
                  <TouchableOpacity
                    style={styles.capacityUnitBtn}
                    onPress={() => setOpenDropdown(openDropdown === 'configUnit' ? null : 'configUnit')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.capacityUnitText}>{configUnit}</Text>
                    <ChevronDownIcon size={14} color="#666666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Number of Storage Locations */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Number of Storage Locations</Text>
            <TextInput
              style={styles.textInput}
              placeholder=""
              placeholderTextColor="#9E9E9E"
              keyboardType="numeric"
              value={numStorageLocations}
              onChangeText={setNumStorageLocations}
            />

            {/* ── Section: Temperature Controlled Storage (With Green Toggle) ── */}
            <View style={styles.sectionHeaderWithToggle}>
              <Text style={styles.sectionTitleWithToggle}>Temperature Controlled Storage</Text>
              <GreenToggleSwitch
                active={tempControlledEnabled}
                onToggle={() => setTempControlledEnabled(!tempControlledEnabled)}
              />
            </View>

            <View style={styles.formRowTwoCols}>
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>Min</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder=""
                  placeholderTextColor="#9E9E9E"
                  keyboardType="numeric"
                  value={tempMin}
                  onChangeText={setTempMin}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>Max</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder=""
                  placeholderTextColor="#9E9E9E"
                  keyboardType="numeric"
                  value={tempMax}
                  onChangeText={setTempMax}
                />
              </View>
            </View>

            {/* Total Storage Capacity * */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>
              Total Storage Capacity <Text style={styles.asterisk}>*</Text>
            </Text>
            <View style={[styles.capacityInputContainer, { width: '50%' }]}>
              <TextInput
                style={styles.capacityTextInput}
                placeholder=""
                placeholderTextColor="#9E9E9E"
                keyboardType="numeric"
                value={tempCapacity}
                onChangeText={setTempCapacity}
              />
              <TouchableOpacity
                style={styles.capacityUnitBtn}
                onPress={() => setOpenDropdown(openDropdown === 'tempUnit' ? null : 'tempUnit')}
                activeOpacity={0.8}
              >
                <Text style={styles.capacityUnitText}>{tempUnit}</Text>
                <ChevronDownIcon size={14} color="#666666" />
              </TouchableOpacity>
            </View>

            {/* ── Section: Humidity Monitoring (With Green Toggle) ── */}
            <View style={[styles.sectionHeaderWithToggle, { marginTop: 22 }]}>
              <Text style={styles.sectionTitleWithToggle}>Humidity Monitoring</Text>
              <GreenToggleSwitch
                active={humidityEnabled}
                onToggle={() => setHumidityEnabled(!humidityEnabled)}
              />
            </View>

            <View style={styles.formRowTwoCols}>
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>Min</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder=""
                  placeholderTextColor="#9E9E9E"
                  keyboardType="numeric"
                  value={humidityMin}
                  onChangeText={setHumidityMin}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>Max</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder=""
                  placeholderTextColor="#9E9E9E"
                  keyboardType="numeric"
                  value={humidityMax}
                  onChangeText={setHumidityMax}
                />
              </View>
            </View>

            {/* Total Storage Capacity * */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>
              Total Storage Capacity <Text style={styles.asterisk}>*</Text>
            </Text>
            <View style={[styles.capacityInputContainer, { width: '50%' }]}>
              <TextInput
                style={styles.capacityTextInput}
                placeholder=""
                placeholderTextColor="#9E9E9E"
                keyboardType="numeric"
                value={humidityCapacity}
                onChangeText={setHumidityCapacity}
              />
              <TouchableOpacity
                style={styles.capacityUnitBtn}
                onPress={() => setOpenDropdown(openDropdown === 'humidityUnit' ? null : 'humidityUnit')}
                activeOpacity={0.8}
              >
                <Text style={styles.capacityUnitText}>{humidityUnit}</Text>
                <ChevronDownIcon size={14} color="#666666" />
              </TouchableOpacity>
            </View>

            {/* ── Special Handling Requirements ── */}
            <Text style={[styles.inputLabel, { marginTop: 18 }]}>Special Handling Requirements</Text>
            <TextInput
              style={styles.descriptionTextArea}
              multiline
              numberOfLines={4}
              maxLength={500}
              value={specialHandlingReq}
              onChangeText={setSpecialHandlingReq}
              placeholder="Enter special handling instructions..."
              placeholderTextColor="#9E9E9E"
            />
            <Text style={styles.charCounter}>{specialHandlingReq.length}/500</Text>

            {/* ── Bottom Buttons: Previous & Next (Image 1 & 2) ── */}
            <View style={styles.twoBottomButtonsRow}>
              <TouchableOpacity
                style={styles.previousOutlineBtn}
                onPress={() => setActiveTab('Contact')}
                activeOpacity={0.85}
              >
                <Text style={styles.previousOutlineBtnText}>Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextSolidBtn}
                onPress={handleNextFromStorage}
                activeOpacity={0.85}
              >
                <Text style={styles.nextSolidBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 4: OPERATIONS (EXACT MATCH TO IMAGE 3)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Operations' && (
          <View style={styles.tabContentContainer}>
            {/* ── Section: Operating Schedule (🕒) ── */}
            <View style={styles.sectionHeaderWithIcon}>
              <BlueClockIcon size={18} color="#2B6CB0" />
              <Text style={styles.sectionHeadingWithIcon}>Operating Schedule</Text>
            </View>

            {/* Operating Days * */}
            <Text style={styles.inputLabel}>
              Operating Days <Text style={styles.asterisk}>*</Text>
            </Text>
            <View style={styles.dayPillsRow}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayPillBtn,
                      isSelected ? styles.dayPillBtnSelected : styles.dayPillBtnUnselected,
                    ]}
                    onPress={() => toggleDay(day)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dayPillText,
                        isSelected ? styles.dayPillTextSelected : styles.dayPillTextUnselected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Opening Time * & Closing Time * */}
            <View style={[styles.formRowTwoCols, { marginTop: 14 }]}>
              {/* Opening Time * */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>
                  Opening Time <Text style={styles.asterisk}>*</Text>
                </Text>
                <View style={styles.timeInputBox}>
                  <TabClockIcon size={16} color="#666666" />
                  <TextInput
                    style={styles.timeTextInput}
                    value={openingTime}
                    onChangeText={setOpeningTime}
                  />
                </View>
              </View>

              {/* Closing Time * */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>
                  Closing Time <Text style={styles.asterisk}>*</Text>
                </Text>
                <View style={styles.timeInputBox}>
                  <TabClockIcon size={16} color="#666666" />
                  <TextInput
                    style={styles.timeTextInput}
                    value={closingTime}
                    onChangeText={setClosingTime}
                  />
                </View>
              </View>
            </View>

            {/* ── Section: Goods Receiving (🚚) ── */}
            <View style={[styles.sectionHeaderWithIcon, { marginTop: 22 }]}>
              <DeliveryTruckIcon size={18} color="#2B6CB0" />
              <Text style={styles.sectionHeadingWithIcon}>Goods Receiving</Text>
            </View>

            <View style={styles.rowBetween}>
              <Text style={styles.labelBold}>Goods Receiving Enabled</Text>
              <GreenToggleSwitch
                active={goodsReceivingEnabled}
                onToggle={() => setGoodsReceivingEnabled(!goodsReceivingEnabled)}
              />
            </View>

            <Text style={styles.subHeadingMuted}>Receiving Hours</Text>

            <View style={styles.formRowTwoCols}>
              {/* Start Time */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabelSmall}>Start Time</Text>
                <View style={styles.timeInputBox}>
                  <TabClockIcon size={16} color="#666666" />
                  <TextInput
                    style={styles.timeTextInput}
                    value={receivingStartTime}
                    onChangeText={setReceivingStartTime}
                  />
                </View>
              </View>

              {/* End Time */}
              <View style={styles.formCol}>
                <Text style={styles.inputLabelSmall}>End Time</Text>
                <View style={styles.timeInputBox}>
                  <TabClockIcon size={16} color="#666666" />
                  <TextInput
                    style={styles.timeTextInput}
                    value={receivingEndTime}
                    onChangeText={setReceivingEndTime}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.rowBetween, { marginTop: 18 }]}>
              <Text style={styles.labelBold}>Quality Check Area Available</Text>
              <GreenToggleSwitch
                active={qcAreaAvailable}
                onToggle={() => setQcAreaAvailable(!qcAreaAvailable)}
              />
            </View>

            {/* ── Section: Holidays / Closure Schedule (📅) ── */}
            <View style={[styles.sectionHeaderWithIcon, { marginTop: 22 }]}>
              <CalendarScheduleIcon size={18} color="#6B46C1" />
              <Text style={styles.sectionHeadingWithIcon}>Holidays / Closure Schedule</Text>
            </View>

            <Text style={styles.noHolidaysText}>No upcoming holidays</Text>

            <TouchableOpacity
              style={styles.addHolidayBtn}
              onPress={() => Alert.alert('Add Holiday', 'Calendar schedule picker opened.')}
              activeOpacity={0.8}
            >
              <CalendarScheduleIcon size={16} color={adminColors.brand} />
              <Text style={styles.addHolidayBtnText}>Add Holiday / Closure</Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.descriptionTextArea, { marginTop: 12 }]}
              multiline
              numberOfLines={3}
              maxLength={500}
              value={holidaysNotes}
              onChangeText={setHolidaysNotes}
              placeholder="Enter holiday coverage notes..."
              placeholderTextColor="#9E9E9E"
            />
            <Text style={styles.charCounter}>{holidaysNotes.length}/500</Text>

            {/* ── Bottom Button: Save & Review (Exact match to Image 3) ── */}
            <TouchableOpacity
              style={styles.saveAndReviewBtn}
              onPress={handleSubmitAll}
              activeOpacity={0.85}
            >
              <Text style={styles.saveAndReviewBtnText}>Save &amp; Review</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Saved Successfully Confirmation Modal ── */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleFinishSuccess}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successDialogCard}>
            <SuccessCheckLargeIcon size={56} color={adminColors.success.text} />
            <Text style={styles.successDialogTitle}>Warehouse Created</Text>
            <Text style={styles.successDialogSub}>
              Warehouse profile &amp; storage configuration for{' '}
              <Text style={{ fontWeight: '700', color: '#1A1412' }}>
                {warehouseName.trim() || 'Central Warehouse'}
              </Text>{' '}
              have been saved successfully.
            </Text>

            <TouchableOpacity
              style={styles.successDialogDoneBtn}
              onPress={handleFinishSuccess}
              activeOpacity={0.85}
            >
              <Text style={styles.successDialogDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: StatusBar.currentHeight ? 6 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
  },

  // ── Tabs Bar ──
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabPillActive: {
    backgroundColor: adminColors.brand,
    ...adminShadow.sm,
  },
  tabPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3DF',
  },
  tabPillText: {
    fontSize: 12,
    marginTop: 5,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabPillTextInactive: {
    color: '#1A1412',
    fontWeight: '500',
  },

  // ── Tab Content ──
  tabContentContainer: {
    backgroundColor: '#FAF8F5',
  },

  // ── Profile Summary Card (Screenshot 1) ──
  profileSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE5E0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    ...adminShadow.sm,
  },
  profileImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#D1CECA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSummaryInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileNameDashes: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1412',
    marginBottom: 4,
    letterSpacing: 1,
  },
  profileMetaLine: {
    fontSize: 12.5,
    color: '#736B66',
    fontWeight: '500',
    marginTop: 2,
  },
  profileMetaVal: {
    color: '#1A1412',
    fontWeight: '600',
  },

  // ── Form Elements ──
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1412',
    marginBottom: 12,
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeadingWithIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1412',
    marginLeft: 8,
  },
  formRowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  formCol: {
    flex: 1,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2B2523',
    marginBottom: 6,
  },
  inputLabelSmall: {
    fontSize: 12,
    color: '#706864',
    marginBottom: 6,
  },
  labelBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1412',
  },
  subHeadingMuted: {
    fontSize: 12.5,
    color: '#706864',
    marginTop: 10,
    marginBottom: 6,
  },
  asterisk: {
    color: '#D9534F',
    fontWeight: '700',
  },
  textInput: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E0DB',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1A1412',
  },
  disabledInput: {
    backgroundColor: '#F6F4F1',
    color: '#6B6B6B',
  },
  fullWidthInput: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E0DB',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1A1412',
  },
  inputWithIconContainer: {
    position: 'relative',
  },

  // Dropdown Button
  dropdownBtn: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E0DB',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownBtnText: {
    fontSize: 14,
    color: '#1A1412',
    fontWeight: '500',
    flex: 1,
  },
  dropdownPopoverMenu: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A4A4A',
    zIndex: 999,
    overflow: 'hidden',
    ...adminShadow.md,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  dropdownItemActive: {
    backgroundColor: '#6B6B6B',
  },
  dropdownItemText: {
    fontSize: 13.5,
    color: '#1A1412',
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Location row
  locationActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  locationLinkText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: adminColors.brand,
    marginLeft: 6,
  },
  setLocationBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: adminColors.brand,
    backgroundColor: '#FFFFFF',
  },
  setLocationBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.brand,
  },

  // Warehouse Image Row
  warehouseImageUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warehouseImageThumbnailBox: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#D1CECA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashedUploadBox: {
    flex: 1,
    height: 76,
    marginLeft: 12,
    borderWidth: 1.5,
    borderColor: '#D4C8BE',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashedUploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brand,
    marginTop: 2,
  },
  dashedUploadSubtitle: {
    fontSize: 11,
    color: '#8A8480',
    marginTop: 1,
  },

  // Description / Textarea
  descriptionTextArea: {
    height: 84,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E0DB',
    padding: 12,
    fontSize: 13.5,
    color: '#1A1412',
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 11,
    color: '#8A8480',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },

  // Primary Next Button
  primaryNextBtn: {
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...adminShadow.sm,
  },
  primaryNextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Two Bottom Buttons
  twoBottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  previousOutlineBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0DAD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previousOutlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1412',
  },
  nextSolidBtn: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...adminShadow.sm,
  },
  nextSolidBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Save & Review full width button on Operations tab
  saveAndReviewBtn: {
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    ...adminShadow.sm,
  },
  saveAndReviewBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Phone Inputs
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBox: {
    width: 60,
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E0DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1412',
  },
  phoneFlexInput: {
    flex: 1,
  },
  landlineInputContainer: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E0DB',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  landlineTextInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1A1412',
    height: 46,
  },

  // ── Tab 3: Storage KPI Cards (Exact match to Image 1 & 2) ──
  kpiGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAE5E0',
    padding: 14,
    height: 98,
    justifyContent: 'flex-start',
  },
  kpiLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6E6660',
    fontWeight: '500',
    marginBottom: 4,
  },
  kpiValueDark: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#1A1412',
  },
  kpiValueGreen: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#1B8738',
  },
  kpiProgressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8E2D9',
    marginTop: 6,
    overflow: 'hidden',
  },
  kpiProgressBarFill: {
    height: '100%',
    backgroundColor: '#1B8738',
    borderRadius: 2,
  },
  kpiSubText: {
    fontSize: 11,
    color: '#8C847E',
    marginTop: 4,
  },
  kpiSubTextNoBar: {
    fontSize: 11,
    color: '#8C847E',
    marginTop: 14,
  },

  // Capacity with Unit input box
  capacityInputContainer: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E0DB',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  capacityTextInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1A1412',
  },
  capacityUnitBtn: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E0DB',
    backgroundColor: '#FDFBF9',
  },
  capacityUnitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1412',
    marginRight: 4,
  },

  // Toggle Switch Header Row
  sectionHeaderWithToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitleWithToggle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1412',
  },

  // Green Toggle Switch
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: '#2E7D32',
  },
  toggleTrackInactive: {
    backgroundColor: '#D1CECA',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    ...adminShadow.sm,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleThumbInactive: {
    alignSelf: 'flex-start',
  },

  // ── Tab 4: Operations Styles (Exact match to Image 3) ──
  dayPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  dayPillBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillBtnSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0DB',
  },
  dayPillBtnUnselected: {
    backgroundColor: '#F5F3EF',
    borderWidth: 1,
    borderColor: '#EAE5E0',
  },
  dayPillText: {
    fontSize: 12.5,
  },
  dayPillTextSelected: {
    fontWeight: '700',
    color: '#1A1412',
  },
  dayPillTextUnselected: {
    color: '#9E9792',
  },

  timeInputBox: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E0DB',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeTextInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13.5,
    color: '#1A1412',
    height: 46,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  noHolidaysText: {
    fontSize: 13,
    color: '#8A8480',
    marginBottom: 8,
  },
  addHolidayBtn: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addHolidayBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.brand,
  },

  // Confirmation Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successDialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  successDialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1412',
    marginTop: 14,
  },
  successDialogSub: {
    fontSize: 13.5,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  successDialogDoneBtn: {
    marginTop: 20,
    width: '100%',
    height: 46,
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...adminShadow.sm,
  },
  successDialogDoneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
