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
  InfoCircleIcon,
  RepeatIcon,
  StoreIcon,
} from '../../components/AdminIcons';
import { t } from '../../i18n';

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
            <HistoryClockIcon
              size={18}
              color={isModeOpen ? adminColors.onBrand : adminColors.muted}
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
            <HistoryClockIcon
              size={18}
              color={!isModeOpen ? adminColors.onBrand : adminColors.muted}
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
          <View style={styles.infoIconBox}>
            <InfoCircleIcon size={18} color={adminColors.info.text} />
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
              {isModeOpen ? t('scheduleMarket.openDate') : t('scheduleMarket.closeDate')}
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
              {isModeOpen ? t('scheduleMarket.openTime') : t('scheduleMarket.closeTime')}
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
            <Text style={styles.fieldLabel}>{t('scheduleMarket.repeat')}</Text>
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
            <StoreIcon size={20} color={adminColors.success.text} />
            <Text style={styles.summaryTitle}>{t('scheduleMarket.summary')}</Text>
          </View>
          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('scheduleMarket.action')}</Text>
            <Text style={styles.summaryColon}>:</Text>
            <Text style={styles.summaryValue}>
              {isModeOpen ? t('scheduleMarket.actionOpen') : t('scheduleMarket.actionClose')}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('scheduleMarket.date')}</Text>
            <Text style={styles.summaryColon}>:</Text>
            <Text style={styles.summaryValue}>{date}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('scheduleMarket.time')}</Text>
            <Text style={styles.summaryColon}>:</Text>
            <Text style={styles.summaryValue}>{time}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('scheduleMarket.repeat')}</Text>
            <Text style={styles.summaryColon}>:</Text>
            <Text style={styles.summaryValue}>{repeat}</Text>
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
    borderRadius: adminRadius.lg,
    padding: adminSpacing.xs,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: adminRadius.md,
    gap: adminSpacing.xs,
  },
  segmentTabActive: {
    backgroundColor: adminColors.success.text,
  },
  segmentTabInactive: {
    backgroundColor: adminColors.card,
  },
  segmentTabText: {
    ...adminType.rowTitle,
    fontWeight: '600',
  },
  segmentTabTextActive: {
    color: adminColors.onBrand,
  },
  segmentTabTextInactive: {
    color: adminColors.ink,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
    gap: adminSpacing.sm,
  },
  infoIconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    ...adminType.caption,
    color: adminColors.info.text,
    flex: 1,
    lineHeight: 18,
  },
  formSection: {
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  fieldGroup: {
    gap: adminSpacing.xs,
  },
  fieldLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    height: ADMIN_BUTTON_HEIGHT,
  },
  inputLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  inputValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '500',
  },
  dropdownCard: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    marginTop: adminSpacing.xs,
    ...adminShadow.sm,
  },
  dropdownItem: {
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownItemTextSelected: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  summaryTitle: {
    ...adminType.sectionHead,
    color: adminColors.success.text,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    ...adminType.body,
    color: adminColors.muted,
    width: 70,
  },
  summaryColon: {
    ...adminType.body,
    color: adminColors.muted,
    width: 20,
  },
  summaryValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
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
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  cancelBtnText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    ...adminType.body,
    color: adminColors.onBrand,
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

