/**
 * Edit Warehouse Profile screen (M15 Edit Profile / Contact / Storage / Operations).
 * Accessible exclusively by the Main Warehouse Admin via the Edit icon.
 */
import React, { useEffect, useState } from 'react';
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
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { OperatingHoursEditor, singleWarehouseId, WAREHOUSE_PROFILE_CODES } from './WarehouseProfileParts';
import type { WarehouseScreenBaseProps, WarehouseSelectionProps } from './types';
import { updateWarehouseProfile } from '../../../api/warehouseSettings';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getWarehouse } from '../../../api/warehouses';
import { AdminLoadingState, AdminErrorState } from '../shared/AsyncStates';
import { buildWarehouseProfileEditBody, operatingHoursToEdit, type OperatingHoursEdit } from './warehouseProfileRules';
import { t } from '../../../i18n';

export type EditWarehouseTab = 'Details' | 'Contact' | 'Storage' | 'Operations';

export interface WarehouseEditProfileScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  initialTab?: EditWarehouseTab;
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
  can,
  onBack,
  initialTab = 'Details',
  warehouseOptions: initialWarehouseOptions,
  selectedWarehouseId,
  onSaveSuccess,
}: WarehouseEditProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<EditWarehouseTab>(initialTab);

  const { scopes: fetchedWarehouseOptions } = useWarehouseOptions();
  const warehouseOptions = initialWarehouseOptions ?? fetchedWarehouseOptions;
  const warehouseId = singleWarehouseId(scope, selectedWarehouseId, warehouseOptions);

  const canEdit = can(WAREHOUSE_PROFILE_CODES.profileEdit);

  const warehouseQuery = useAdminQuery(
    adminKeys.detail('warehouses', warehouseId ?? ''),
    (signal: AbortSignal) => getWarehouse(warehouseId!, signal),
    { enabled: Boolean(warehouseId) },
  );

  const rawWarehouse = warehouseQuery.data;

  // Dynamic Screen Heading based on Active Tab
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'Details':
        return 'Edit Warehouse Profile';
      case 'Contact':
        return 'Edit Warehouse Contact';
      case 'Storage':
        return 'Edit Warehouse Storage';
      case 'Operations':
        return 'Edit Warehouse Operations';
    }
  };

  // State
  const [primaryPhone, setPrimaryPhone] = useState(rawWarehouse?.contactPhone ?? '');
  const [hours, setHours] = useState<OperatingHoursEdit>(() => operatingHoursToEdit(rawWarehouse?.operatingHours));
  const [saveError, setSaveError] = useState<unknown>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (rawWarehouse) {
      setPrimaryPhone(rawWarehouse.contactPhone ?? '');
      setHours(operatingHoursToEdit(rawWarehouse.operatingHours));
    }
  }, [rawWarehouse]);

  if (!canEdit) {
    return (
      <WalletScreen title="Edit Warehouse Profile" onBack={onBack}>
        <View style={{ padding: adminSpacing.lg }}>
          <Text style={{ ...adminType.body, color: adminColors.ink }}>
            {t('profile.edit.notPermitted')}
          </Text>
        </View>
      </WalletScreen>
    );
  }

  if (warehouseQuery.isPending) {
    return (
      <WalletScreen title={getHeaderTitle()} onBack={onBack}>
        <AdminLoadingState />
      </WalletScreen>
    );
  }

  if (warehouseQuery.error) {
    return (
      <WalletScreen title={getHeaderTitle()} onBack={onBack}>
        <AdminErrorState error={warehouseQuery.error} onRetry={() => void warehouseQuery.refetch()} />
      </WalletScreen>
    );
  }

  // Details Tab Form State (Loaded from API, read-only)
  const warehouseName = rawWarehouse?.name ?? '';
  const warehouseCode = rawWarehouse?.code ?? '';
  const warehouseType = rawWarehouse?.type === 'MAIN' ? 'Main Warehouse' : 'Sub Warehouse';
  const status = rawWarehouse?.isActive ? 'Active' : 'Inactive';
  const addressLine1 = rawWarehouse?.address ?? '';
  const addressLine2 = '';
  const stateName = 'Tamil Nadu';
  const district = 'Nilgiris';
  const city = rawWarehouse?.city ?? '';
  const pinCode = rawWarehouse?.pincode ?? '';
  const description = 'Warehouse facility for regional produce collection, sorting and storage.';

  // Contact Tab Form State
  const contactPersonName = 'Warehouse Manager';
  const designation = 'Manager';
  const alternatePhone = '';
  const officialEmail = '';
  const alternateEmail = '';
  const landline = '';
  const emergencyPerson = '';
  const emergencyPhone = '';
  const contactNotes = '';

  // Storage Tab Form State (Read-only reference)
  const storageType = 'General + Cold Storage';
  const totalCapacityInput = rawWarehouse?.capacityKg ?? '—';
  const storageLocationsCount = '—';
  const tempControlledEnabled = true;
  const tempMin = '2';
  const tempMax = '8';
  const tempCapacity = '—';
  const humidityEnabled = true;
  const humidityMin = '60';
  const humidityMax = '90';
  const humidityCapacity = '—';
  const handlingReqs = '';

  // Operations Tab (non-hours fields read-only)
  const receivingEnabled = true;
  const receivingStartTime = '08:00 AM';
  const receivingEndTime = '04:00 PM';
  const qcAreaAvailable = true;
  const operationNotes = '';

  const handleSave = async () => {
    if (!warehouseId) return;
    const current = {
      contactPhone: rawWarehouse?.contactPhone,
      operatingHours: rawWarehouse?.operatingHours,
    };
    const built = buildWarehouseProfileEditBody(current, {
      contactPhone: primaryPhone,
      hours,
    });
    if (!built.ok) {
      if (built.errorKey === 'profile.edit.error.noChanges') {
        Alert.alert('No Changes', 'No changes have been made to save.');
      } else {
        Alert.alert('Invalid Input', t(built.errorKey));
      }
      return;
    }
    setSaveError(null);
    setIsSaving(true);
    try {
      await updateWarehouseProfile(warehouseId, built.value);
      Alert.alert(t('profile.save.success.title'), t('profile.save.success.message'), [
        {
          text: 'OK',
          onPress: () => {
            onSaveSuccess?.();
            onBack();
          },
        },
      ]);
    } catch (err) {
      setSaveError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const subHeaderLabel = `${rawWarehouse?.name ?? 'Warehouse'} (${rawWarehouse?.code ?? ''})`;

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
            {/* Header Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardLeft}>
                <View style={styles.thumbnailBox} />
                <View style={styles.summaryCardInfo}>
                  <Text style={styles.summaryCardTitle}>{warehouseName}</Text>
                  <Text style={styles.summaryCardMeta}>Warehouse Code : {warehouseCode}</Text>
                  <Text style={styles.summaryCardMeta}>Type : {warehouseType}</Text>
                </View>
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{status}</Text>
              </View>
            </View>

            <Text style={styles.sectionHeader}>Basic Information</Text>
            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Warehouse Name *</Text>
                <TextInput
                  style={[styles.textInput, styles.inputDisabled]}
                  value={warehouseName}
                  editable={false}
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Warehouse Code *</Text>
                <TextInput
                  style={[styles.textInput, styles.inputDisabled]}
                  value={warehouseCode}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Warehouse Type</Text>
                <View style={styles.dropdownInput}>
                  <Text style={styles.dropdownInputText}>{warehouseType}</Text>
                </View>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.dropdownInput}>
                  <Text style={styles.dropdownInputText}>{status}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionHeader}>Location Details</Text>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Address Line 1 *</Text>
              <TextInput
                style={[styles.textInput, styles.inputDisabled]}
                value={addressLine1}
                editable={false}
              />
            </View>

            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>City / Town *</Text>
                <TextInput
                  style={[styles.textInput, styles.inputDisabled]}
                  value={city}
                  editable={false}
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>PIN Code *</Text>
                <TextInput
                  style={[styles.textInput, styles.inputDisabled]}
                  value={pinCode}
                  editable={false}
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
                style={[styles.textInput, styles.textArea, styles.inputDisabled]}
                value={description}
                editable={false}
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
              <Text style={styles.fieldLabel}>Contact Person Name</Text>
              <TextInput
                style={[styles.textInput, styles.inputDisabled]}
                value={contactPersonName}
                editable={false}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Designation</Text>
              <TextInput
                style={[styles.textInput, styles.inputDisabled]}
                value={designation}
                editable={false}
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
                  editable={!isSaving}
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
                  style={[styles.textInput, styles.phoneInputFlex, styles.inputDisabled]}
                  value={alternatePhone}
                  editable={false}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Official Email</Text>
              <TextInput
                style={[styles.textInput, styles.inputDisabled]}
                value={officialEmail}
                editable={false}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Landline Number</Text>
              <View style={styles.iconInputRow}>
                <View style={styles.innerInputIcon}>
                  <ContactTabIcon color={adminColors.brandDeep} />
                </View>
                <TextInput
                  style={[styles.textInput, styles.iconInputFlex, styles.inputDisabled]}
                  value={landline}
                  editable={false}
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
                style={[styles.textInput, styles.inputDisabled]}
                value={emergencyPerson}
                editable={false}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Emergency Contact Number</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.textInput, styles.phoneInputFlex, styles.inputDisabled]}
                  value={emergencyPhone}
                  editable={false}
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
                style={[styles.textInput, styles.textArea, styles.inputDisabled]}
                value={contactNotes}
                editable={false}
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

            <Text style={styles.sectionHeader}>Storage Configuration</Text>
            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Storage Type</Text>
                <View style={styles.dropdownInput}>
                  <Text style={styles.dropdownInputText}>{storageType}</Text>
                </View>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Total Storage Capacity</Text>
                <View style={styles.unitInputRow}>
                  <TextInput
                    style={[styles.textInput, styles.unitInputFlex, styles.inputDisabled]}
                    value={totalCapacityInput}
                    editable={false}
                  />
                  <View style={styles.unitSelector}>
                    <Text style={styles.unitText}>KG</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Number of Storage Locations</Text>
              <TextInput
                style={[styles.textInput, styles.inputDisabled]}
                value={storageLocationsCount}
                editable={false}
              />
            </View>

            {/* Temperature Controlled Storage */}
            <View style={styles.switchHeaderRow}>
              <Text style={styles.switchTitle}>Temperature Controlled Storage</Text>
              <Switch
                value={tempControlledEnabled}
                disabled
                trackColor={{ false: adminColors.border, true: adminColors.success.text }}
                thumbColor={adminColors.onBrand}
              />
            </View>

            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Min</Text>
                <TextInput
                  style={[styles.textInput, styles.inputDisabled]}
                  value={tempMin}
                  editable={false}
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Max</Text>
                <TextInput
                  style={[styles.textInput, styles.inputDisabled]}
                  value={tempMax}
                  editable={false}
                />
              </View>
            </View>

            {/* Humidity Monitoring */}
            <View style={styles.switchHeaderRow}>
              <Text style={styles.switchTitle}>Humidity Monitoring</Text>
              <Switch
                value={humidityEnabled}
                disabled
                trackColor={{ false: adminColors.border, true: adminColors.success.text }}
                thumbColor={adminColors.onBrand}
              />
            </View>

            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Min</Text>
                <TextInput
                  style={[styles.textInput, styles.inputDisabled]}
                  value={humidityMin}
                  editable={false}
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Max</Text>
                <TextInput
                  style={[styles.textInput, styles.inputDisabled]}
                  value={humidityMax}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Special Handling Requirements</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, styles.inputDisabled]}
                value={handlingReqs}
                editable={false}
                multiline
                maxLength={500}
              />
            </View>
          </>
        )}

        {/* ─── 4. OPERATIONS TAB CONTENT ─── */}
        {activeTab === 'Operations' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <ClockOutlineIcon />
              <Text style={styles.sectionHeaderWithIcon}>Operating Schedule (7 Days)</Text>
            </View>

            <OperatingHoursEditor value={hours} onChange={setHours} disabled={isSaving} />

            <View style={styles.sectionHeaderRow}>
              <TruckIcon />
              <Text style={styles.sectionHeaderWithIcon}>Goods Receiving</Text>
            </View>

            <View style={styles.switchHeaderRow}>
              <Text style={styles.switchTitle}>Goods Receiving Enabled</Text>
              <Switch
                value={receivingEnabled}
                disabled
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
                    style={[styles.textInput, styles.iconInputFlex, styles.inputDisabled]}
                    value={receivingStartTime}
                    editable={false}
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
                    style={[styles.textInput, styles.iconInputFlex, styles.inputDisabled]}
                    value={receivingEndTime}
                    editable={false}
                  />
                </View>
              </View>
            </View>

            <View style={styles.switchHeaderRow}>
              <Text style={styles.switchTitle}>Quality Check Area Available</Text>
              <Switch
                value={qcAreaAvailable}
                disabled
                trackColor={{ false: adminColors.border, true: adminColors.success.text }}
                thumbColor={adminColors.onBrand}
              />
            </View>

            <View style={styles.sectionHeaderRow}>
              <CalendarEventIcon />
              <Text style={styles.sectionHeaderWithIcon}>Holidays & Closures</Text>
            </View>
            <Text style={styles.noHolidaysText}>Holidays and closures are managed through the central admin calendar.</Text>

            <View style={styles.fieldWrap}>
              <TextInput
                style={[styles.textInput, styles.textArea, styles.inputDisabled]}
                value={operationNotes}
                editable={false}
                multiline
                maxLength={500}
              />
            </View>
          </>
        )}

        {saveError !== null ? (
          <View style={{ marginBottom: adminSpacing.md }}>
            <AdminErrorState error={saveError} onRetry={handleSave} />
          </View>
        ) : null}

        {/* ─── Footer Action Buttons ─── */}
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.8} disabled={isSaving}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8} disabled={isSaving}>
            <Text style={styles.saveBtnText}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: adminSpacing.xl }} />
      </ScrollView>
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
  inputDisabled: {
    backgroundColor: adminColors.canvas,
    color: adminColors.muted,
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
    backgroundColor: adminColors.brandTint,
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
