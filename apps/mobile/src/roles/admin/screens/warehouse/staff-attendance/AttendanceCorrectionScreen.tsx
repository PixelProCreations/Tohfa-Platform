/**
 * SA-M14-S02 · Attendance Correction Screen
 * Exact implementation matching Image 3 (Form + Review Correction Modal).
 * Super Admin exclusive feature for correcting attendance discrepancies.
 * Token-safe using adminColors, adminRadius, adminSpacing, adminType, adminShadow.
 */
import React, { useState } from 'react';
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../../theme';
import { AdminCalendarPickerModal } from '../../../components/AdminCalendarPickerModal';
import type { AttendanceRecord, StaffMember, WarehouseScreenBaseProps } from './types';

export interface AttendanceCorrectionScreenProps extends WarehouseScreenBaseProps {
  role?: string | undefined;
  staff?: StaffMember | undefined;
  record?: AttendanceRecord | undefined;
  onSuccess?: () => void;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PersonAvatarIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={adminColors.brandDeep} strokeWidth="1.8" />
      <Path
        d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7"
        stroke={adminColors.brandDeep}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={adminColors.muted} strokeWidth="1.8" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={adminColors.muted} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.muted} strokeWidth="1.8" />
      <Path d="M12 7v5l3 2" stroke={adminColors.muted} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={adminColors.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ModalCalendarCheckIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={adminColors.success.text} strokeWidth="1.8" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={adminColors.success.text} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M9 15l2 2 4-4" stroke={adminColors.success.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.muted} strokeWidth="1.6" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={adminColors.muted} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AttendanceCorrectionScreen({
  staff,
  record,
  onBack,
  onSuccess,
}: AttendanceCorrectionScreenProps) {
  const memberName = record?.name || staff?.name || 'Karthik Kumar';
  const memberId = staff?.staffId || (record?.type === 'driver' ? 'DRV-0018' : 'SWA-002');
  const currentStatus = (record?.status || staff?.attendance || 'Absent') as 'Present' | 'Absent' | 'On Leave';
  const recordDate = record?.dateText || '04 Nov 2026';

  // Form State
  const [selectedDate, setSelectedDate] = useState('20 Oct 2026');
  const [dateCalendarOpen, setDateCalendarOpen] = useState(false);
  const [updatedStatus, setUpdatedStatus] = useState<'Present' | 'Absent' | 'On Leave'>('Present');
  const [checkInTime, _setCheckInTime] = useState('09:15 AM');
  const [checkOutTime, _setCheckOutTime] = useState('06:05 PM');
  const [reasonCategory, setReasonCategory] = useState('Missed Punch / Incorrect Marking');
  const [remarks, setRemarks] = useState('');

  // Dropdown / Modal states
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const handleConfirm = () => {
    setShowReviewModal(false);
    Alert.alert(
      'Attendance Corrected',
      `Attendance for ${memberName} on ${selectedDate} has been updated to ${updatedStatus}.`,
      [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.();
            onBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attendance Correction</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Staff Card */}
        <View style={styles.staffCard}>
          <View style={styles.avatarCircle}>
            <PersonAvatarIcon />
          </View>
          <View style={styles.staffMeta}>
            <Text style={styles.staffName}>{memberName}</Text>
            <Text style={styles.staffSub}>
              Admin ID: {memberId} · Active
            </Text>
          </View>
        </View>

        {/* Section 1: Attendance Record */}
        <Text style={styles.sectionTitle}>Attendance Record</Text>
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Attendance Date</Text>
              <Text style={styles.metaValue}>{recordDate}</Text>
            </View>
          </View>

          <View style={[styles.metaRow, { marginTop: 12 }]}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Shift</Text>
              <Text style={styles.metaValue}>09:00 AM - 06:00 PM</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Current Status</Text>
              <View style={[
                styles.statusPillBadge,
                currentStatus === 'Present' ? styles.statusPillPresent :
                currentStatus === 'On Leave' ? styles.statusPillLeave : styles.statusPillAbsent
              ]}>
                <Text style={[
                  styles.statusPillBadgeText,
                  currentStatus === 'Present' ? styles.statusPillTextPresent :
                  currentStatus === 'On Leave' ? styles.statusPillTextLeave : styles.statusPillTextAbsent
                ]}>{currentStatus}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Correction Details */}
        <Text style={styles.sectionTitle}>Correction Details</Text>
        <View style={styles.card}>
          {/* Select Date */}
          <Text style={styles.inputLabel}>
            Select Date <Text style={styles.asterisk}>*</Text>
          </Text>
          <View style={styles.dateInputRow}>
            <Text style={styles.dateText}>{selectedDate}</Text>
            <TouchableOpacity
              onPress={() => setDateCalendarOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Pick attendance date"
            >
              <CalendarIcon />
            </TouchableOpacity>
          </View>

          {/* Updated Status */}
          <Text style={styles.inputLabel}>
            Updated Status <Text style={styles.asterisk}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dropdownSelector}
            onPress={() => setShowStatusPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownText}>{updatedStatus}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>

          {/* Check-in & Check-out Time */}
          <View style={styles.timeRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>
                Check-in Time <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.timeInputBox}>
                <ClockIcon />
                <Text style={styles.timeText}>{checkInTime}</Text>
              </View>
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>
                Check-out Time <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.timeInputBox}>
                <ClockIcon />
                <Text style={styles.timeText}>{checkOutTime}</Text>
              </View>
            </View>
          </View>

          {/* Reason Category */}
          <Text style={styles.inputLabel}>
            Reason Category <Text style={styles.asterisk}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dropdownSelector}
            onPress={() => setShowReasonPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownText}>{reasonCategory}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>

          {/* Reason / Remarks */}
          <Text style={styles.inputLabel}>
            Reason / Remarks <Text style={styles.asterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.remarksInput}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Enter reason or remarks for attendance correction..."
            placeholderTextColor={adminColors.muted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={() => setShowReviewModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.reviewBtnText}>Review Correction</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ─── Modal 1: Status Picker ─── */}
      <Modal visible={showStatusPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusPicker(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerModalTitle}>Select Status</Text>
            {(['Present', 'Absent', 'On Leave'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.pickerOption,
                  updatedStatus === s && styles.pickerOptionActive,
                ]}
                onPress={() => {
                  setUpdatedStatus(s);
                  setShowStatusPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    updatedStatus === s && styles.pickerOptionTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Modal 2: Reason Category Picker ─── */}
      <Modal visible={showReasonPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowReasonPicker(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerModalTitle}>Select Reason Category</Text>
            {[
              'Missed Punch / Incorrect Marking',
              'System Offline / Machine Error',
              'Authorized Field Duty / External Run',
              'Late Punch In (Traffic / Weather)',
              'Supervisor Special Approval',
            ].map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.pickerOption,
                  reasonCategory === r && styles.pickerOptionActive,
                ]}
                onPress={() => {
                  setReasonCategory(r);
                  setShowReasonPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    reasonCategory === r && styles.pickerOptionTextActive,
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Modal 3: Review Correction Modal (Matching Image 3 Left Phone) ─── */}
      <Modal visible={showReviewModal} transparent animationType="fade">
        <View style={styles.reviewOverlay}>
          <View style={styles.reviewCard}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowReviewModal(false)}
              activeOpacity={0.7}
            >
              <CloseIcon />
            </TouchableOpacity>

            {/* Icon Header */}
            <View style={styles.modalIconWrap}>
              <ModalCalendarCheckIcon />
            </View>

            <Text style={styles.reviewModalTitle}>Review Correction</Text>
            <Text style={styles.reviewModalSub}>
              Please review the attendance correction details before confirming.
            </Text>

            {/* Details Table */}
            <View style={styles.reviewTableCard}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Staff name</Text>
                <Text style={styles.tableValue}>{memberName}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Staff ID</Text>
                <Text style={styles.tableValue}>{memberId}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Attendance Date</Text>
                <Text style={styles.tableValue}>{selectedDate}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Shift</Text>
                <Text style={styles.tableValue}>09:00 AM - 06:00 PM</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Current Status</Text>
                <View style={[
                  styles.statusPillSmallBadge,
                  currentStatus === 'Present' ? styles.statusPillPresent :
                  currentStatus === 'On Leave' ? styles.statusPillLeave : styles.statusPillAbsent
                ]}>
                  <Text style={[
                    styles.statusPillSmallBadgeText,
                    currentStatus === 'Present' ? styles.statusPillTextPresent :
                    currentStatus === 'On Leave' ? styles.statusPillTextLeave : styles.statusPillTextAbsent
                  ]}>{currentStatus}</Text>
                </View>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Updated Status</Text>
                <View style={styles.presentPillSmall}>
                  <Text style={styles.presentPillTextSmall}>{updatedStatus}</Text>
                </View>
              </View>

              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.tableLabel}>Reason Category</Text>
                <Text style={[styles.tableValue, { flex: 1, textAlign: 'right' }]}>
                  {reasonCategory}
                </Text>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalEditBtn}
                onPress={() => setShowReviewModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalEditBtnText}>Edit Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmBtnText}>Confirm Correction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AdminCalendarPickerModal
        visible={dateCalendarOpen}
        format="DD MMM YYYY"
        value={selectedDate}
        onSelect={setSelectedDate}
        onClose={() => setDateCalendarOpen(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  statusPillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: adminRadius.full,
    alignSelf: 'flex-start',
  },
  statusPillPresent: {
    backgroundColor: '#DCFCE7',
  },
  statusPillLeave: {
    backgroundColor: '#FEF3C7',
  },
  statusPillAbsent: {
    backgroundColor: '#FEE2E2',
  },
  statusPillBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPillTextPresent: {
    color: '#16A34A',
  },
  statusPillTextLeave: {
    color: '#D97706',
  },
  statusPillTextAbsent: {
    color: '#DC2626',
  },
  statusPillSmallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  statusPillSmallBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  contentPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 16,
    paddingBottom: 36,
  },

  // Staff Card
  staffCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    ...adminShadow.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  staffMeta: {
    flex: 1,
  },
  staffName: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 16,
    marginBottom: 2,
  },
  staffSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },

  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 14,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 4,
  },
  metaValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 14,
  },
  absentPill: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.danger.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  absentPillText: {
    ...adminType.rowMeta,
    color: adminColors.danger.text,
    fontWeight: '700',
  },

  // Inputs
  inputLabel: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  asterisk: {
    color: adminColors.danger.text,
  },
  dateInputRow: {
    height: 44,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  dateText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownSelector: {
    height: 44,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  dropdownText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInputBox: {
    height: 44,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  timeText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
  },
  remarksInput: {
    minHeight: 70,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    ...adminType.body,
    color: adminColors.ink,
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    fontWeight: '600',
  },
  reviewBtn: {
    flex: 1.2,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },

  // Picker modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pickerModal: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: 20,
    ...adminShadow.lg,
  },
  pickerModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 14,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: adminRadius.sm,
    marginBottom: 4,
  },
  pickerOptionActive: {
    backgroundColor: adminColors.brandTint,
  },
  pickerOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  pickerOptionTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },

  // Review Modal
  reviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  reviewCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: 20,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  reviewModalTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 18,
    marginBottom: 6,
  },
  reviewModalSub: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  reviewTableCard: {
    width: '100%',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 18,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  tableLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  tableValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 13,
  },
  absentPillSmall: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  absentPillTextSmall: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontWeight: '700',
    fontSize: 11,
  },
  presentPillSmall: {
    backgroundColor: adminColors.success.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  presentPillTextSmall: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '700',
    fontSize: 11,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalEditBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEditBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
});

