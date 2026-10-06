import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A', // Brand Orange
  primaryDark: '#D8451B',
  primarySoft: '#FDF1EB',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9', // App canvas soft cream
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  borderSubtle: '#F2ECE5',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  textMuted: '#8C8983',
  orangeDeep: '#7A2E14',
  greenSuccess: '#16A34A',
  greenBg: '#DCFCE7',
  amberWarning: '#D97706',
  amberBg: '#FEF3C7',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 15, color = '#8A827D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PencilEditIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon({ size = 16, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface WarehouseSettingsScreenProps {
  onBack?: () => void;
  warehouseName?: string;
  capacityLimit?: string;
  lowStockThreshold?: string;
  operatingHours?: string;
  assignedStaff?: string;
  onEditThresholdHours?: () => void;
}

export function WarehouseSettingsScreen({
  onBack,
  warehouseName = 'Ooty Warehouse',
  capacityLimit = '6,000 kg',
  lowStockThreshold: initialThreshold = '25%',
  operatingHours: initialHours = '6:00 AM – 6:00 PM',
  assignedStaff: initialStaff = '2 members',
  onEditThresholdHours,
}: WarehouseSettingsScreenProps) {
  const [currentWarehouse, setCurrentWarehouse] = useState(warehouseName);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [hours, setHours] = useState(initialHours);
  const [staffCount, setStaffCount] = useState(initialStaff);

  // Additional settings switches
  const [autoAssignment, setAutoAssignment] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [discrepancyEscalation, setDiscrepancyEscalation] = useState(true);

  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editThresholdInput, setEditThresholdInput] = useState(threshold.replace('%', ''));
  const [editHoursInput, setEditHoursInput] = useState(hours);
  const [editStaffNum, setEditStaffNum] = useState(2);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const WAREHOUSES = ['Kotagiri Warehouse', 'Ooty Warehouse', 'Coonoor Warehouse'];

  const handleOpenEdit = () => {
    if (onEditThresholdHours) {
      onEditThresholdHours();
      return;
    }
    setEditThresholdInput(threshold.replace('%', ''));
    setEditHoursInput(hours);
    const num = parseInt(staffCount, 10);
    setEditStaffNum(isNaN(num) ? 2 : num);
    setIsEditModalVisible(true);
  };

  const handleSaveModal = () => {
    const cleanThresh = editThresholdInput.trim() ? `${editThresholdInput.trim()}%` : '25%';
    const cleanHours = editHoursInput.trim() ? editHoursInput.trim() : '6:00 AM – 6:00 PM';
    const cleanStaff = `${editStaffNum} members`;

    setThreshold(cleanThresh);
    setHours(cleanHours);
    setStaffCount(cleanStaff);
    setIsEditModalVisible(false);

    setSaveSuccessMsg(`Settings updated for ${currentWarehouse}!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Brand Orange Theme) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              style={styles.backBtn}
              accessibilityLabel="Back"
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Warehouse Settings</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {currentWarehouse} · Capacity changes are SA-only
        </Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Toast */}
        {saveSuccessMsg && (
          <View style={styles.successToast}>
            <View style={styles.toastIconCircle}>
              <CheckIcon size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.toastText}>{saveSuccessMsg}</Text>
          </View>
        )}

        {/* Warehouse Selector Chips */}
        <View style={styles.whSelectorWrap}>
          <Text style={styles.sectionMiniLabel}>SELECT WAREHOUSE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {WAREHOUSES.map((wh) => {
              const isSelected = wh === currentWarehouse;
              return (
                <TouchableOpacity
                  key={wh}
                  style={[styles.whChip, isSelected && styles.whChipActive]}
                  onPress={() => setCurrentWarehouse(wh)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.whChipText, isSelected && styles.whChipTextActive]}>
                    {wh}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Primary Settings Card (Matching Table in Screenshot 2) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Threshold & Operating Configurations</Text>
        </View>

        <View style={styles.settingsCard}>
          {/* Row 1: Capacity limit */}
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.rowLabel}>Capacity limit</Text>
              <Text style={styles.rowSub}>Set by System Admin</Text>
            </View>
            <View style={styles.rowRightLock}>
              <Text style={styles.rowValue}>{capacityLimit}</Text>
              <View style={styles.lockBadge}>
                <LockIcon size={13} color="#8A827D" />
                <Text style={styles.lockBadgeText}>SA-only</Text>
              </View>
            </View>
          </View>

          {/* Row 2: Low-stock threshold */}
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.rowLabel}>Low-stock threshold</Text>
              <Text style={styles.rowSub}>Triggers procurement replenishment alert</Text>
            </View>
            <View style={styles.thresholdBadge}>
              <Text style={styles.thresholdText}>{threshold}</Text>
            </View>
          </View>

          {/* Row 3: Operating hours */}
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.rowLabel}>Operating hours</Text>
              <Text style={styles.rowSub}>Receiving & dispatch operational window</Text>
            </View>
            <View style={styles.hoursBadge}>
              <ClockIcon size={14} color={PALETTE.primary} />
              <Text style={styles.hoursText}>{hours}</Text>
            </View>
          </View>

          {/* Row 4: Assigned staff */}
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View>
              <Text style={styles.rowLabel}>Assigned staff</Text>
              <Text style={styles.rowSub}>Active Sub-Warehouse Administrators</Text>
            </View>
            <Text style={[styles.rowValue, styles.rowValueBold]}>{staffCount}</Text>
          </View>
        </View>

        {/* Edit Button (Matching screenshot action) */}
        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={handleOpenEdit}
          activeOpacity={0.8}
        >
          <PencilEditIcon size={18} color={PALETTE.primary} />
          <Text style={styles.outlineActionBtnText}>Edit Threshold & Hours</Text>
        </TouchableOpacity>

        {/* Additional Operational Policies Card */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={styles.sectionHeading}>Automated Operational Rules</Text>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowLabel}>Inbound Storage Auto-Assignment</Text>
              <Text style={styles.rowSub}>Auto-assign storage racks based on product temperature</Text>
            </View>
            <Switch
              value={autoAssignment}
              onValueChange={setAutoAssignment}
              trackColor={{ false: '#D4CDC5', true: '#F98365' }}
              thumbColor={autoAssignment ? PALETTE.primary : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowLabel}>Immediate Low-Stock Push Alerts</Text>
              <Text style={styles.rowSub}>Notify central warehouse when threshold is breached</Text>
            </View>
            <Switch
              value={lowStockAlerts}
              onValueChange={setLowStockAlerts}
              trackColor={{ false: '#D4CDC5', true: '#F98365' }}
              thumbColor={lowStockAlerts ? PALETTE.primary : '#FFFFFF'}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowLabel}>Auto-Escalate Discrepancies</Text>
              <Text style={styles.rowSub}>Escalate quantity mismatches exceeding 10% to SA</Text>
            </View>
            <Switch
              value={discrepancyEscalation}
              onValueChange={setDiscrepancyEscalation}
              trackColor={{ false: '#D4CDC5', true: '#F98365' }}
              thumbColor={discrepancyEscalation ? PALETTE.primary : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Edit Threshold & Hours Modal ─── */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure Threshold & Hours</Text>
              <Text style={styles.modalSub}>{currentWarehouse}</Text>
            </View>

            {/* Threshold Quick Select */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LOW-STOCK THRESHOLD (%)</Text>
              <View style={styles.quickSelectRow}>
                {['15', '20', '25', '30'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.quickThreshBtn,
                      editThresholdInput === val && styles.quickThreshBtnActive,
                    ]}
                    onPress={() => setEditThresholdInput(val)}
                  >
                    <Text
                      style={[
                        styles.quickThreshText,
                        editThresholdInput === val && styles.quickThreshTextActive,
                      ]}
                    >
                      {val}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.textInput}
                value={editThresholdInput}
                onChangeText={setEditThresholdInput}
                keyboardType="numeric"
                placeholder="Custom threshold (e.g. 25)"
                placeholderTextColor="#9C9892"
              />
            </View>

            {/* Operating Hours Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>OPERATING HOURS</Text>
              <TextInput
                style={styles.textInput}
                value={editHoursInput}
                onChangeText={setEditHoursInput}
                placeholder="6:00 AM – 6:00 PM"
                placeholderTextColor="#9C9892"
              />
            </View>

            {/* Staff Count Stepper */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ASSIGNED SWA STAFF</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setEditStaffNum((prev) => Math.max(1, prev - 1))}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{editStaffNum} members</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setEditStaffNum((prev) => Math.min(10, prev + 1))}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveModal}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 8,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '500',
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  toastIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PALETTE.greenSuccess,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    flex: 1,
  },
  whSelectorWrap: {
    marginBottom: 16,
  },
  sectionMiniLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: PALETTE.orangeDeep,
    marginBottom: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  whChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginRight: 8,
  },
  whChipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  whChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  whChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    letterSpacing: -0.2,
  },
  settingsCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderSubtle,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  rowSub: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  rowRightLock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    fontSize: 14,
    color: PALETTE.textSecondary,
  },
  rowValueBold: {
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFE9',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  lockBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#8A827D',
  },
  thresholdBadge: {
    backgroundColor: PALETTE.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F7CFC4',
  },
  thresholdText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.primary,
  },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  hoursText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  outlineActionBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  outlineActionBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.primary,
    marginLeft: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  modalSub: {
    fontSize: 13,
    color: PALETTE.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: PALETTE.textSecondary,
    marginBottom: 6,
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quickThreshBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3EFE9',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  quickThreshBtnActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  quickThreshText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  quickThreshTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: PALETTE.textInk,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    padding: 6,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.primary,
    lineHeight: 22,
  },
  stepperValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F3EFE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  saveBtn: {
    flex: 1.4,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
