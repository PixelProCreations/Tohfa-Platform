import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  ADMIN_BUTTON_HEIGHT,
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export interface AddWarehouseProfileScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

type TabType = 'Details' | 'Contact' | 'Storage' | 'Operations';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabDocumentIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
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

function TabPhoneIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
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

function TabStorageIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="3.27" y1="6.96" x2="12" y2="12.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="22.08" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="20.73" y1="6.96" x2="12" y2="12.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabClockIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SuccessCheckIcon({ size = 48, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={adminColors.success.bg} />
      <Path d="M8 12.5l2.5 2.5 5.5-5.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function AddWarehouseProfileScreen({
  onBack,
  onSuccess,
}: AddWarehouseProfileScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('Details');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form Fields - Details
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseCode] = useState('WH-AUTO-' + Math.floor(1000 + Math.random() * 9000));
  const [zone, setZone] = useState('Zone 1 (Nilgiris)');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Ooty');
  const [state, setState] = useState('Tamil Nadu');
  const [pinCode, setPinCode] = useState('643001');
  const [description, setDescription] = useState('');

  // Form Fields - Contact
  const [contactName, setContactName] = useState('');
  const [designation, setDesignation] = useState('Warehouse Manager');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Form Fields - Storage
  const [totalCapacityKg, setTotalCapacityKg] = useState('50000');
  const [hasColdStorage, setHasColdStorage] = useState(true);
  const [coldCapacityKg, setColdCapacityKg] = useState('15000');
  const [hasDryStorage, setHasDryStorage] = useState(true);
  const [dryCapacityKg, setDryCapacityKg] = useState('35000');
  const [loadingBays, setLoadingBays] = useState('4');

  // Form Fields - Operations
  const [openTime, setOpenTime] = useState('06:00 AM');
  const [closeTime, setCloseTime] = useState('08:00 PM');
  const [shifts, setShifts] = useState('2');
  const [openSundays, setOpenSundays] = useState(false);

  const handleSave = () => {
    if (!warehouseName.trim()) {
      Alert.alert('Required Field', 'Please enter a warehouse name.');
      setActiveTab('Details');
      return;
    }
    setShowSuccessModal(true);
  };

  const handleModalDone = () => {
    setShowSuccessModal(false);
    onSuccess?.();
    onBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Add Warehouse Profile</Text>
            <Text style={styles.headerSubtitle}>Create a new regional warehouse facility</Text>
          </View>
        </View>

        {/* Tab Strip */}
        <View style={styles.tabBar}>
          {(['Details', 'Contact', 'Storage', 'Operations'] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.75}
              >
                {tab === 'Details' ? <TabDocumentIcon size={16} color={isActive ? adminColors.onBrand : adminColors.ink} /> : null}
                {tab === 'Contact' ? <TabPhoneIcon size={16} color={isActive ? adminColors.onBrand : adminColors.ink} /> : null}
                {tab === 'Storage' ? <TabStorageIcon size={16} color={isActive ? adminColors.onBrand : adminColors.ink} /> : null}
                {tab === 'Operations' ? <TabClockIcon size={16} color={isActive ? adminColors.onBrand : adminColors.ink} /> : null}
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content Form */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'Details' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Facility Details</Text>

            <Text style={styles.fieldLabel}>Warehouse Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Ooty Central Hub"
              placeholderTextColor={adminColors.muted}
              value={warehouseName}
              onChangeText={setWarehouseName}
            />

            <Text style={styles.fieldLabel}>Warehouse Code (Auto-generated)</Text>
            <TextInput
              style={[styles.textInput, styles.readOnlyInput]}
              value={warehouseCode}
              editable={false}
            />

            <Text style={styles.fieldLabel}>Operating Zone</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Zone name"
              placeholderTextColor={adminColors.muted}
              value={zone}
              onChangeText={setZone}
            />

            <Text style={styles.fieldLabel}>Address Line 1</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Street or building number"
              placeholderTextColor={adminColors.muted}
              value={addressLine1}
              onChangeText={setAddressLine1}
            />

            <Text style={styles.fieldLabel}>Address Line 2</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Area or landmark"
              placeholderTextColor={adminColors.muted}
              value={addressLine2}
              onChangeText={setAddressLine2}
            />

            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>City / Town</Text>
                <TextInput
                  style={styles.textInput}
                  value={city}
                  onChangeText={setCity}
                  placeholderTextColor={adminColors.muted}
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>State</Text>
                <TextInput
                  style={styles.textInput}
                  value={state}
                  onChangeText={setState}
                  placeholderTextColor={adminColors.muted}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>PIN Code</Text>
            <TextInput
              style={styles.textInput}
              value={pinCode}
              onChangeText={setPinCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor={adminColors.muted}
            />

            <Text style={styles.fieldLabel}>Facility Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Additional facility details or notes"
              placeholderTextColor={adminColors.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {activeTab === 'Contact' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Personnel & Contacts</Text>

            <Text style={styles.fieldLabel}>Primary Contact Person</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Manager or Supervisor name"
              placeholderTextColor={adminColors.muted}
              value={contactName}
              onChangeText={setContactName}
            />

            <Text style={styles.fieldLabel}>Designation</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Lead Operations Manager"
              placeholderTextColor={adminColors.muted}
              value={designation}
              onChangeText={setDesignation}
            />

            <Text style={styles.fieldLabel}>Primary Phone</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 9876543210"
              placeholderTextColor={adminColors.muted}
              value={primaryPhone}
              onChangeText={setPrimaryPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>Alternate Phone</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Optional alternate number"
              placeholderTextColor={adminColors.muted}
              value={altPhone}
              onChangeText={setAltPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>Official Email Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. ooty.wh@tohfa.agri"
              placeholderTextColor={adminColors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.divider} />

            <Text style={styles.sectionSubHeader}>Emergency Response</Text>

            <Text style={styles.fieldLabel}>Emergency Contact Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Safety officer name"
              placeholderTextColor={adminColors.muted}
              value={emergencyContact}
              onChangeText={setEmergencyContact}
            />

            <Text style={styles.fieldLabel}>Emergency Phone</Text>
            <TextInput
              style={styles.textInput}
              placeholder="24x7 phone number"
              placeholderTextColor={adminColors.muted}
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              keyboardType="phone-pad"
            />
          </View>
        )}

        {activeTab === 'Storage' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Storage & Infrastructure</Text>

            <Text style={styles.fieldLabel}>Total Capacity (kg)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 50000"
              placeholderTextColor={adminColors.muted}
              value={totalCapacityKg}
              onChangeText={setTotalCapacityKg}
              keyboardType="number-pad"
            />

            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <Text style={styles.switchLabel}>Cold Storage Zone</Text>
                <Text style={styles.switchSubLabel}>Temperature controlled (2°C - 8°C)</Text>
              </View>
              <Switch
                value={hasColdStorage}
                onValueChange={setHasColdStorage}
                trackColor={{ false: adminColors.border, true: adminColors.brand }}
                thumbColor={adminColors.card}
              />
            </View>

            {hasColdStorage ? (
              <>
                <Text style={styles.fieldLabel}>Cold Storage Capacity (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 15000"
                  placeholderTextColor={adminColors.muted}
                  value={coldCapacityKg}
                  onChangeText={setColdCapacityKg}
                  keyboardType="number-pad"
                />
              </>
            ) : null}

            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <Text style={styles.switchLabel}>Dry Storage Zone</Text>
                <Text style={styles.switchSubLabel}>Ambient storage for grains and pulses</Text>
              </View>
              <Switch
                value={hasDryStorage}
                onValueChange={setHasDryStorage}
                trackColor={{ false: adminColors.border, true: adminColors.brand }}
                thumbColor={adminColors.card}
              />
            </View>

            {hasDryStorage ? (
              <>
                <Text style={styles.fieldLabel}>Dry Storage Capacity (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 35000"
                  placeholderTextColor={adminColors.muted}
                  value={dryCapacityKg}
                  onChangeText={setDryCapacityKg}
                  keyboardType="number-pad"
                />
              </>
            ) : null}

            <Text style={styles.fieldLabel}>Loading & Unloading Bays</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Number of bays (e.g. 4)"
              placeholderTextColor={adminColors.muted}
              value={loadingBays}
              onChangeText={setLoadingBays}
              keyboardType="number-pad"
            />
          </View>
        )}

        {activeTab === 'Operations' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Operating Schedule</Text>

            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Opening Time</Text>
                <TextInput
                  style={styles.textInput}
                  value={openTime}
                  onChangeText={setOpenTime}
                  placeholderTextColor={adminColors.muted}
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Closing Time</Text>
                <TextInput
                  style={styles.textInput}
                  value={closeTime}
                  onChangeText={setCloseTime}
                  placeholderTextColor={adminColors.muted}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Operating Shifts</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 2 shifts"
              placeholderTextColor={adminColors.muted}
              value={shifts}
              onChangeText={setShifts}
              keyboardType="number-pad"
            />

            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <Text style={styles.switchLabel}>Weekend Operations (Sunday)</Text>
                <Text style={styles.switchSubLabel}>Facility receives goods on Sundays</Text>
              </View>
              <Switch
                value={openSundays}
                onValueChange={setOpenSundays}
                trackColor={{ false: adminColors.border, true: adminColors.brand }}
                thumbColor={adminColors.card}
              />
            </View>
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.actionsRow}>
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
            <Text style={styles.saveBtnText}>Save & Create</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleModalDone}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <SuccessCheckIcon />
            <Text style={styles.modalTitle}>Warehouse Created</Text>
            <Text style={styles.modalMessage}>
              Warehouse profile &quot;{warehouseName}&quot; ({warehouseCode}) has been registered successfully.
            </Text>
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={handleModalDone}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
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
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  backBtn: {
    padding: adminSpacing.xs,
    marginRight: adminSpacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.9,
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    gap: adminSpacing.xs,
    paddingBottom: adminSpacing.xs,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.xs + 2,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: adminColors.brandDeep,
  },
  tabLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  sectionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: adminSpacing.md,
  },
  sectionSubHeader: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: adminSpacing.sm,
  },
  fieldLabel: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: adminSpacing.xs,
  },
  textInput: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm + 4,
    paddingVertical: adminSpacing.sm,
    color: adminColors.ink,
    fontSize: 13,
    marginBottom: adminSpacing.xs,
  },
  readOnlyInput: {
    backgroundColor: adminColors.brandTint,
    color: adminColors.brandDeep,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  rowTwoCol: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  colHalf: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    marginBottom: adminSpacing.xs,
  },
  switchTextCol: {
    flex: 1,
    marginRight: adminSpacing.sm,
  },
  switchLabel: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  switchSubLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xl,
  },
  cancelBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
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
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
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
    paddingHorizontal: adminSpacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  modalTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 18,
    fontWeight: '800',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  modalMessage: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: adminSpacing.lg,
    lineHeight: 18,
  },
  modalDoneBtn: {
    width: '100%',
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '700',
    fontSize: 14,
  },
});
