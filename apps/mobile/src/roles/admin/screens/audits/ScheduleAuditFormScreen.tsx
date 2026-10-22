import React, { useState } from 'react';
import {
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
import Svg, { Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── Header & Lock Icons ───────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 15, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.9" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface ScheduleAuditFormScreenProps {
  initialAuditId?: string;
  onBack: () => void;
  onScheduleSuccess?: () => void;
  onSaveDraft?: () => void;
}

export function ScheduleAuditFormScreen({
  initialAuditId = 'AUD-2026-0043',
  onBack,
  onScheduleSuccess,
  onSaveDraft,
}: ScheduleAuditFormScreenProps) {
  const [auditId] = useState(initialAuditId);
  const [date, setDate] = useState('20/10/2026');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [duration, setDuration] = useState('120');

  const [selectedFarmer, setSelectedFarmer] = useState('Lakshmi (FMR-00203)');
  const [selectedFarm, setSelectedFarm] = useState('Lakshmi Farm house · Coonoor, Zone A');
  const [selectedAuditor, setSelectedAuditor] = useState('R. Devi');

  // Dropdown Modal Picker State
  const [pickerModal, setPickerModal] = useState<{
    title: string;
    options: string[];
    onSelect: (val: string) => void;
  } | null>(null);

  const farmerOptions = [
    'Lakshmi (FMR-00203)',
    'Selvi (FMR-00131)',
    'Ramesh Kumar (FMR-00124)',
    'Meena (FMR-00177)',
    'Vijay Anand (FMR-00152)',
  ];

  const farmOptions = [
    'Lakshmi Farm house · Coonoor, Zone A',
    'Selvi village farm · Coonoor, Zone A',
    'Demo plot · Coonoor, Zone A',
    'Highland tea farm · Ooty, Zone B',
    'Valley plantation · Gudalur, Zone D',
  ];

  const auditorOptions = [
    'R. Devi (Lead Auditor)',
    'Priya Nair (Senior Quality Inspector)',
    'S. Mohan (Certification Officer)',
    'Ravi K. (Field Auditor)',
    'AgriCert Co. (External Assessor)',
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header Banner Matching Image 1 ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.7} accessibilityRole="button">
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Audit</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Container Card */}
        <View style={styles.formCard}>
          {/* ── 1 · Audit Information ── */}
          <Text style={styles.sectionHeaderTitle}>1 · Audit information</Text>

          {/* Audit ID (Locked) */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelWithIconRow}>
              <Text style={styles.fieldLabel}>Audit ID</Text>
              <LockIcon />
            </View>
            <View style={styles.disabledInput}>
              <Text style={styles.disabledInputText}>{auditId}</Text>
            </View>
          </View>

          {/* Date & Start Time 2-Column Row */}
          <View style={styles.twoColRow}>
            <View style={styles.colHalf}>
              <Text style={styles.fieldLabel}>Date *</Text>
              <TextInput
                style={styles.textInput}
                value={date}
                onChangeText={setDate}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <View style={styles.colHalf}>
              <Text style={styles.fieldLabel}>Start time *</Text>
              <TextInput
                style={styles.textInput}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:MM AM/PM"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
          </View>

          {/* Duration */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.textInput}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="120"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          {/* ── 2 · Farmer & Farm ── */}
          <Text style={styles.sectionHeaderTitle}>2 · Farmer & farm</Text>

          {/* Farmer Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Farmer *</Text>
            <TouchableOpacity
              style={styles.dropdownPicker}
              onPress={() =>
                setPickerModal({
                  title: 'Select Farmer',
                  options: farmerOptions,
                  onSelect: (val) => setSelectedFarmer(val),
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownPickerText} numberOfLines={1}>
                {selectedFarmer}
              </Text>
              <ChevronDownIcon />
            </TouchableOpacity>
          </View>

          {/* Farm Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Farm *</Text>
            <TouchableOpacity
              style={styles.dropdownPicker}
              onPress={() =>
                setPickerModal({
                  title: 'Select Registered Farm',
                  options: farmOptions,
                  onSelect: (val) => setSelectedFarm(val),
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownPickerText} numberOfLines={1}>
                {selectedFarm}
              </Text>
              <ChevronDownIcon />
            </TouchableOpacity>
            <Text style={styles.fieldHint}>
              Only this farmer&apos;s registered farms are offered. No farmer or farm is created here.
            </Text>
          </View>

          {/* ── 3 · Auditor Assignment ── */}
          <Text style={styles.sectionHeaderTitle}>3 · Auditor assignment</Text>

          {/* Lead Auditor Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Lead auditor (internal) *</Text>
            <TouchableOpacity
              style={styles.dropdownPicker}
              onPress={() =>
                setPickerModal({
                  title: 'Assign Lead Auditor',
                  options: auditorOptions,
                  onSelect: (val) => setSelectedAuditor(val),
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownPickerText} numberOfLines={1}>
                {selectedAuditor}
              </Text>
              <ChevronDownIcon />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Buttons Matching Image 1 ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.scheduleAuditBtn}
          onPress={onScheduleSuccess || onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.scheduleAuditBtnText}>Schedule Audit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveDraftBtn}
          onPress={onSaveDraft || onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.saveDraftBtnText}>Save Draft</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown Options Picker Modal */}
      <Modal
        visible={pickerModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModal(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setPickerModal(null)}
          />

          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{pickerModal?.title}</Text>
            <ScrollView style={styles.modalListScroll}>
              {pickerModal?.options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.modalOptionItem}
                  onPress={() => {
                    pickerModal.onSelect(opt);
                    setPickerModal(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalOptionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setPickerModal(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
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
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 19,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },
  formCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  fieldGroup: {
    marginBottom: adminSpacing.md,
  },
  labelWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
    marginBottom: 6,
  },
  fieldLabel: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  disabledInput: {
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    justifyContent: 'center',
  },
  disabledInputText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    fontWeight: '600',
  },
  twoColRow: {
    flexDirection: 'row',
    columnGap: 12,
    marginBottom: adminSpacing.md,
  },
  colHalf: {
    flex: 1,
  },
  textInput: {
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    fontSize: 13,
    color: adminColors.ink,
  },
  dropdownPicker: {
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownPickerText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  fieldHint: {
    ...adminType.caption,
    fontSize: 11,
    lineHeight: 14,
    color: adminColors.muted,
    marginTop: 4,
  },

  // Bottom Buttons (Image 1)
  bottomBar: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    columnGap: 12,
  },
  scheduleAuditBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleAuditBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  saveDraftBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDraftBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Modal Picker Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: adminOverlay.scrim,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    maxHeight: '60%',
  },
  modalTitle: {
    ...adminType.sectionHead,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  modalListScroll: {
    marginBottom: adminSpacing.md,
  },
  modalOptionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  modalOptionText: {
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  modalCloseBtn: {
    height: 42,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    ...adminType.caption,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
