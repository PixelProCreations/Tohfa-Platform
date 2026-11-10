/**
 * Screen: Set Fair Price Ceilings
 * Exact UI implementation matching Image 3 Left.
 * Super Admin Level 1 Authority to set fair price ceilings.
 */
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  ADMIN_BUTTON_HEIGHT,
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export interface UpdateFairPriceScreenProps {
  onBack: () => void;
  onSave?: (newPrice: number, data?: { crop: string; grade: string; frequency: string; reason: string }) => void;
  itemName?: string;
  category?: string;
  currentPrice?: number;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DropdownChevronIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TomatoThumbnailIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Circle cx="20" cy="23" r="14" fill="#E53935" />
      <Path d="M20 9c0 3-2 5-5 5M20 9c0 3 2 5 5 5M20 9v5M16 8c2 2 4 1 4 1s2 1 4-1" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function UpdateFairPriceScreen({
  onBack,
  onSave,
  itemName = 'Tomato',
  category: _category = 'Vegetables',
  currentPrice = 150,
}: UpdateFairPriceScreenProps) {
  const [crop, setCrop] = useState(itemName);
  const [grade, setGrade] = useState('Grade 1 (G1)');
  const [ceilingAmount, setCeilingAmount] = useState(String(currentPrice));
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [effectiveFrom, setEffectiveFrom] = useState('20 Oct 2026');
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [effectiveTime, setEffectiveTime] = useState('10:00 AM');
  const [reason, setReason] = useState('');

  const handleSave = () => {
    const numericPrice = parseFloat(ceilingAmount) || currentPrice;
    if (onSave) {
      onSave(numericPrice, { crop, grade, frequency, reason });
    }
    onBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Fair Price Ceilings</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Crop Selector Card ─── */}
          <TouchableOpacity style={styles.cropSelectorCard} activeOpacity={0.8} onPress={() => setCropModalVisible(true)}>
            <View style={styles.cropSelectorLeft}>
              <TomatoThumbnailIcon size={34} />
              <View style={styles.cropSelectorMeta}>
                <Text style={styles.cropName}>{crop}</Text>
                <Text style={styles.cropSubtitle}>Crop</Text>
              </View>
            </View>
            <DropdownChevronIcon size={20} color={adminColors.muted} />
          </TouchableOpacity>

          {/* ─── Form Container ─── */}
          <View style={styles.formCard}>
            {/* Grade Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Grade <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity style={styles.dropdownInput} activeOpacity={0.8} onPress={() => setGradeModalVisible(true)}>
                <Text style={styles.dropdownInputValue}>{grade}</Text>
                <DropdownChevronIcon size={18} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            {/* Ceiling Amount Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Ceiling Amount (₹/kg) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={ceilingAmount}
                onChangeText={setCeilingAmount}
                keyboardType="numeric"
                placeholder="150"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            {/* Frequency Selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Frequency <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.frequencyRow}>
                {(['Daily', 'Weekly', 'Monthly'] as const).map((freq) => {
                  const isSelected = frequency === freq;
                  return (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyPill,
                        isSelected && styles.frequencyPillActive,
                      ]}
                      onPress={() => setFrequency(freq)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected ? <View style={styles.radioDot} /> : null}
                      </View>
                      <Text style={[styles.frequencyText, isSelected && styles.frequencyTextActive]}>
                        {freq}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Effective Date & Time */}
            <View style={styles.dateTimeRow}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Effective From</Text>
                <View style={styles.iconInputWrap}>
                  <CalendarIcon size={18} color={adminColors.muted} />
                  <TextInput
                    style={styles.iconInput}
                    value={effectiveFrom}
                    onChangeText={setEffectiveFrom}
                    placeholder="20 Oct 2026"
                    placeholderTextColor={adminColors.placeholder}
                  />
                </View>
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>Time</Text>
                <View style={styles.iconInputWrap}>
                  <ClockIcon size={18} color={adminColors.muted} />
                  <TextInput
                    style={styles.iconInput}
                    value={effectiveTime}
                    onChangeText={setEffectiveTime}
                    placeholder="10:00 AM"
                    placeholderTextColor={adminColors.placeholder}
                  />
                </View>
              </View>
            </View>

            {/* Reason for Changes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Reason for Changes</Text>
              <View style={styles.textareaContainer}>
                <TextInput
                  style={styles.textarea}
                  value={reason}
                  onChangeText={(text) => {
                    if (text.length <= 200) setReason(text);
                  }}
                  placeholder="State the reason for ceiling adjustment..."
                  placeholderTextColor={adminColors.placeholder}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Text style={styles.charCounter}>{reason.length} / 200</Text>
              </View>
            </View>
          </View>

          {/* ─── Bottom Actions ─── */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.primarySaveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Save Changes"
            >
              <Text style={styles.primarySaveBtnText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCancelBtn}
              onPress={onBack}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.secondaryCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Crop Selection Modal ─── */}
      <Modal
        visible={cropModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCropModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCropModalVisible(false)}>
          <View style={styles.dropdownModalCard}>
            <Text style={styles.dropdownModalTitle}>Select Crop</Text>
            {['Tomato', 'Carrot', 'Potato', 'Cabbage', 'Beans', 'Chilli'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.dropdownOptionRow, crop === item && styles.dropdownOptionRowActive]}
                onPress={() => {
                  setCrop(item);
                  setCropModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownOptionText, crop === item && styles.dropdownOptionTextActive]}>
                  {item}
                </Text>
                {crop === item && (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke={adminColors.brand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ─── Grade Selection Modal ─── */}
      <Modal
        visible={gradeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGradeModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setGradeModalVisible(false)}>
          <View style={styles.dropdownModalCard}>
            <Text style={styles.dropdownModalTitle}>Select Grade</Text>
            {['Grade 1 (G1)', 'Grade 2 (G2)', 'Grade 3 (G3)'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.dropdownOptionRow, grade === item && styles.dropdownOptionRowActive]}
                onPress={() => {
                  setGrade(item);
                  setGradeModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownOptionText, grade === item && styles.dropdownOptionTextActive]}>
                  {item}
                </Text>
                {grade === item && (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke={adminColors.brand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cropSelectorCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    ...adminShadow.sm,
  },
  cropSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropSelectorMeta: {
    marginLeft: 12,
  },
  cropName: {
    color: adminColors.ink,
    fontSize: 16,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 20,
  },
  cropSubtitle: {
    color: adminColors.muted,
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 16,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 20,
    ...adminShadow.sm,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    includeFontPadding: false,
  },
  requiredStar: {
    color: adminColors.danger.text,
  },
  dropdownInput: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownInputValue: {
    color: adminColors.ink,
    fontSize: 14,
    includeFontPadding: false,
  },
  textInput: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    paddingHorizontal: 12,
    height: 44,
    color: adminColors.ink,
    fontSize: 14,
    includeFontPadding: false,
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.canvas,
    overflow: 'hidden',
  },
  frequencyPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: adminColors.card,
  },
  frequencyPillActive: {
    backgroundColor: adminColors.brandTint,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: adminColors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  radioCircleActive: {
    borderColor: adminColors.brand,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: adminColors.brand,
  },
  frequencyText: {
    color: adminColors.muted,
    fontSize: 13,
    fontWeight: '500',
    includeFontPadding: false,
  },
  frequencyTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    paddingHorizontal: 10,
    height: 44,
  },
  iconInput: {
    flex: 1,
    marginLeft: 8,
    color: adminColors.ink,
    fontSize: 13,
    includeFontPadding: false,
    padding: 0,
  },
  textareaContainer: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    padding: 10,
  },
  textarea: {
    color: adminColors.ink,
    fontSize: 13,
    minHeight: 80,
    padding: 0,
    includeFontPadding: false,
  },
  charCounter: {
    alignSelf: 'flex-end',
    color: adminColors.muted,
    fontSize: 11,
    marginTop: 4,
    includeFontPadding: false,
  },
  bottomActions: {
    gap: 12,
  },
  primarySaveBtn: {
    backgroundColor: adminColors.brand,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  primarySaveBtnText: {
    color: adminColors.onBrand,
    fontSize: 15,
    fontWeight: '700',
    includeFontPadding: false,
  },
  secondaryCancelBtn: {
    backgroundColor: adminColors.card,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCancelBtnText: {
    color: adminColors.ink,
    fontSize: 15,
    fontWeight: '600',
    includeFontPadding: false,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  dropdownModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  dropdownModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: adminSpacing.md,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: adminRadius.sm,
    marginBottom: 4,
  },
  dropdownOptionRowActive: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownOptionText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
  },
  dropdownOptionTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
});
