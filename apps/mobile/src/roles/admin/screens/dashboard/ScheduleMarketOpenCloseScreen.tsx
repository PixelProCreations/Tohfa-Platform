/**
 * Schedule Market Open / Close Screen (SA-M2-S02 / SA-M2-S03)
 * Unified scheduling screen for automated market opening and closing windows.
 * Reused across Super Admin and TOHFA Admin shells with RBAC gating.
 */
import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../theme';
import {
  BackArrowIcon,
  CalendarIcon,
  ChevronDownIcon,
  HistoryClockIcon,
  RepeatIcon,
  StoreIcon,
} from '../../components/AdminIcons';
import { t } from '../../i18n';

const MARKET_GREEN = '#00A843';

function ScheduleOpenPlayIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M10 8.5L16 12L10 15.5V8.5Z" fill={color} />
    </Svg>
  );
}

function ScheduleCloseCrossIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M9 9L15 15M15 9L9 15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export type ScheduleRepeatOption = 'One Time' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

export interface MarketScheduleData {
  mode: 'open' | 'close';
  date: string;
  time: string;
  repeat: ScheduleRepeatOption;
}

export interface ScheduleMarketOpenCloseScreenProps {
  initialMode?: 'open' | 'close';
  initialDate?: string;
  initialTime?: string;
  initialRepeat?: ScheduleRepeatOption;
  can?: (permission: string) => boolean;
  onBack: () => void;
  onSave?: (schedule: MarketScheduleData) => void;
}

const REPEAT_OPTIONS: ScheduleRepeatOption[] = [
  'One Time',
  'Daily',
  'Weekly',
  'Monthly',
  'Custom',
];

const AVAILABLE_TIMES = [
  '06:00 AM',
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
  '10:00 PM',
];

const AVAILABLE_DATES = [
  '14 Oct 2026',
  '15 Oct 2026',
  '16 Oct 2026',
  '17 Oct 2026',
  '18 Oct 2026',
  '19 Oct 2026',
  '20 Oct 2026',
];

export function ScheduleMarketOpenCloseScreen({
  initialMode = 'open',
  initialDate = '15 Oct 2026',
  initialTime,
  initialRepeat = 'One Time',
  can,
  onBack,
  onSave,
}: ScheduleMarketOpenCloseScreenProps) {
  const [mode, setMode] = useState<'open' | 'close'>(initialMode);
  const [date, setDate] = useState<string>(initialDate);
  const [time, setTime] = useState<string>(
    initialTime || (initialMode === 'open' ? '08:00 AM' : '06:00 PM')
  );
  const [repeat, setRepeat] = useState<ScheduleRepeatOption>(initialRepeat);

  const [showRepeatDropdown, setShowRepeatDropdown] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const hasPermission = can ? can('market.schedule.manage') : true;

  const handleModeChange = (newMode: 'open' | 'close') => {
    setMode(newMode);
    if (!initialTime) {
      setTime(newMode === 'open' ? '08:00 AM' : '06:00 PM');
    }
  };

  const handleSave = () => {
    if (!hasPermission) return;
    if (onSave) {
      onSave({
        mode,
        date,
        time,
        repeat,
      });
    }
    onBack();
  };

  const isModeOpen = mode === 'open';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header (Brand Orange) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <BackArrowIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('scheduleMarket.title')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Segmented Mode Switcher (Schedule Open / Schedule Close) */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              isModeOpen ? styles.segmentTabActive : styles.segmentTabInactive,
            ]}
            onPress={() => handleModeChange('open')}
            activeOpacity={0.8}
          >
            <ScheduleOpenPlayIcon
              size={18}
              color={isModeOpen ? '#FFFFFF' : adminColors.muted}
            />
            <Text
              style={[
                styles.segmentTabText,
                isModeOpen ? styles.segmentTabTextActive : styles.segmentTabTextInactive,
              ]}
            >
              {t('scheduleMarket.scheduleOpen')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              !isModeOpen ? styles.segmentTabActive : styles.segmentTabInactive,
            ]}
            onPress={() => handleModeChange('close')}
            activeOpacity={0.8}
          >
            <ScheduleCloseCrossIcon
              size={18}
              color={!isModeOpen ? '#FFFFFF' : adminColors.muted}
            />
            <Text
              style={[
                styles.segmentTabText,
                !isModeOpen ? styles.segmentTabTextActive : styles.segmentTabTextInactive,
              ]}
            >
              {t('scheduleMarket.scheduleClose')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconBadge}>
            <Text style={styles.infoIconLetter}>i</Text>
          </View>
          <Text style={styles.infoText}>
            {isModeOpen ? t('scheduleMarket.infoOpen') : t('scheduleMarket.infoClose')}
          </Text>
        </View>

        {/* Form Inputs */}
        <View style={styles.formSection}>
          {/* Date Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {isModeOpen ? 'Open Date' : 'Close Date'} <Text style={styles.asterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.inputLeft}>
                <CalendarIcon size={18} color={adminColors.muted} />
                <Text style={styles.inputValue}>{date}</Text>
              </View>
              <CalendarIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Time Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {isModeOpen ? 'Open Time' : 'Close Time'} <Text style={styles.asterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.inputLeft}>
                <HistoryClockIcon size={18} color={adminColors.muted} />
                <Text style={styles.inputValue}>{time}</Text>
              </View>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Repeat Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Repeat <Text style={styles.optionalText}>(Optional)</Text>
            </Text>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setShowRepeatDropdown(!showRepeatDropdown)}
              activeOpacity={0.7}
            >
              <View style={styles.inputLeft}>
                <RepeatIcon size={18} color={adminColors.muted} />
                <Text style={styles.inputValue}>{repeat}</Text>
              </View>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>

            {/* Repeat Dropdown Menu (Inline / Floating) */}
            {showRepeatDropdown && (
              <View style={styles.dropdownCard}>
                {REPEAT_OPTIONS.map((opt, idx) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.dropdownItem,
                      idx < REPEAT_OPTIONS.length - 1 && styles.dropdownItemBorder,
                    ]}
                    onPress={() => {
                      setRepeat(opt);
                      setShowRepeatDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        repeat === opt && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <StoreIcon size={20} color={MARKET_GREEN} />
            <Text style={styles.summaryTitle}>{t('scheduleMarket.summary')}</Text>
          </View>
          <View style={styles.summaryHeaderDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('scheduleMarket.action')}</Text>
            <Text style={styles.summaryColon}>: {isModeOpen ? t('scheduleMarket.actionOpen') : t('scheduleMarket.actionClose')}</Text>
          </View>
          <View style={styles.summaryRowDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('scheduleMarket.date')}</Text>
            <Text style={styles.summaryColon}>: {date}</Text>
          </View>
          <View style={styles.summaryRowDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('scheduleMarket.time')}</Text>
            <Text style={styles.summaryColon}>: {time}</Text>
          </View>
          <View style={styles.summaryRowDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('scheduleMarket.repeat')}</Text>
            <Text style={styles.summaryColon}>: {repeat}</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>{t('scheduleMarket.cancel')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, !hasPermission && styles.submitBtnDisabled]}
          onPress={handleSave}
          disabled={!hasPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>
            {isModeOpen
              ? t('scheduleMarket.submitOpen')
              : t('scheduleMarket.submitClose')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTimePicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Time</Text>
            <ScrollView style={styles.pickerModalScroll}>
              {AVAILABLE_TIMES.map((tVal) => (
                <TouchableOpacity
                  key={tVal}
                  style={[
                    styles.pickerModalItem,
                    time === tVal && styles.pickerModalItemSelected,
                  ]}
                  onPress={() => {
                    setTime(tVal);
                    setShowTimePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerModalItemText,
                      time === tVal && styles.pickerModalItemTextSelected,
                    ]}
                  >
                    {tVal}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Date</Text>
            <ScrollView style={styles.pickerModalScroll}>
              {AVAILABLE_DATES.map((dVal) => (
                <TouchableOpacity
                  key={dVal}
                  style={[
                    styles.pickerModalItem,
                    date === dVal && styles.pickerModalItemSelected,
                  ]}
                  onPress={() => {
                    setDate(dVal);
                    setShowDatePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerModalItemText,
                      date === dVal && styles.pickerModalItemTextSelected,
                    ]}
                  >
                    {dVal}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: adminSpacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 10,
    gap: adminSpacing.xs,
  },
  segmentTabActive: {
    backgroundColor: MARKET_GREEN,
  },
  segmentTabInactive: {
    backgroundColor: adminColors.card,
  },
  segmentTabText: {
    ...adminType.rowTitle,
    fontWeight: '700',
    fontSize: 13,
  },
  segmentTabTextActive: {
    color: adminColors.onBrand,
  },
  segmentTabTextInactive: {
    color: adminColors.muted,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF3FE',
    borderWidth: 1,
    borderColor: '#D6E6FD',
    borderRadius: 10,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    marginBottom: adminSpacing.lg,
    gap: adminSpacing.sm,
  },
  infoIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconLetter: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  infoText: {
    color: '#1558D6',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  formSection: {
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: adminColors.ink,
    fontWeight: '600',
    fontSize: 13.5,
  },
  asterisk: {
    color: adminColors.danger.text,
    fontWeight: '700',
  },
  optionalText: {
    color: adminColors.muted,
    fontWeight: '400',
    fontSize: 12.5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: adminSpacing.md,
    height: 48,
  },
  inputLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  inputValue: {
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownCard: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: adminSpacing.xs,
    ...adminShadow.md,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: adminSpacing.md,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13.5,
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: MARKET_GREEN,
    borderRadius: 14,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  summaryTitle: {
    color: MARKET_GREEN,
    fontSize: 15,
    fontWeight: '700',
  },
  summaryHeaderDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  summaryRowDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  summaryLabel: {
    color: adminColors.muted,
    fontSize: 13,
    fontWeight: '500',
    width: 80,
  },
  summaryColon: {
    color: adminColors.ink,
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  bottomSpacer: {
    height: 80,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: adminColors.card,
  },
  cancelBtnText: {
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: adminColors.brand,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: adminColors.onBrand,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  pickerModalContent: {
    width: '100%',
    maxHeight: 350,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    ...adminShadow.md,
  },
  pickerModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontWeight: '700',
    marginBottom: adminSpacing.sm,
  },
  pickerModalScroll: {
    maxHeight: 280,
  },
  pickerModalItem: {
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  pickerModalItemSelected: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.xs,
  },
  pickerModalItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  pickerModalItemTextSelected: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
});

