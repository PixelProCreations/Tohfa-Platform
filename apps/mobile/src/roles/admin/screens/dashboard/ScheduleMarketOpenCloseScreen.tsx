/**
 * Schedule Market Open / Close Screen (SA-M2-S02 / SA-M2-S03)
 * Unified scheduling screen for automated market opening and closing windows.
 * Reused across Super Admin and TOHFA Admin shells with RBAC gating.
 *
 * Ported from origin/Superadmin-main. docs/openapi.yaml has no endpoint that
 * schedules a market open/close (GET /admin/sales/market-day is a read of one
 * day's sales), so nothing is saved from here: the form is fully drawn, date and
 * time start unchosen (shown as the no-value dash, also in the Summary card), and
 * Save hands the choice to the host through `onSave`; without `onSave` or the
 * permission it is disabled. The date list is the next seven days and the time
 * list is hourly 06:00 to 22:00, both in IST.
 */
import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors } from '../../theme';
import {
  BackArrowIcon,
  CalendarIcon,
  ChevronDownIcon,
  HistoryClockIcon,
  RepeatIcon,
  StoreIcon,
} from '../../components/AdminIcons';
import { t, type TranslationKey } from '../../i18n';
import type { Can } from '../../permissions/can';
import { formatAdminDay, formatAdminTime } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { scheduleStyles as styles } from './scheduleMarketStyles';

/**
 * Gated by market.schedule.manage (docs/rbac.json, BR-106a: Super Admin and
 * TOHFA Admin only). It used to borrow sales.market_day.view while that code
 * did not exist; a view permission must not unlock a scheduling action.
 */
export const SCHEDULE_MARKET_CODES = { manage: 'market.schedule.manage' } as const;

function ScheduleOpenPlayIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M10 8.5L16 12L10 15.5V8.5Z" fill={color} />
    </Svg>
  );
}

function ScheduleCloseCrossIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
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
  initialMode?: 'open' | 'close' | undefined;
  initialDate?: string | undefined;
  initialTime?: string | undefined;
  initialRepeat?: ScheduleRepeatOption | undefined;
  can: Can;
  onBack: () => void;
  onSave?: ((schedule: MarketScheduleData) => void) | undefined;
}

const REPEAT_OPTIONS: readonly { value: ScheduleRepeatOption; labelKey: TranslationKey }[] = [
  { value: 'One Time', labelKey: 'saSchedule.repeat.oneTime' },
  { value: 'Daily', labelKey: 'saSchedule.repeat.daily' },
  { value: 'Weekly', labelKey: 'saSchedule.repeat.weekly' },
  { value: 'Monthly', labelKey: 'saSchedule.repeat.monthly' },
  { value: 'Custom', labelKey: 'saSchedule.repeat.custom' },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_CHOICES = 7;
const FIRST_HOUR = 6;
const LAST_HOUR = 22;

/** The next seven IST days, today first. */
function dateChoices(now: Date): string[] {
  return Array.from({ length: DATE_CHOICES }, (_, i) => formatAdminDay(new Date(now.getTime() + i * DAY_MS)));
}

/** Hourly slots, 06:00 to 22:00 IST (IST = UTC+05:30, so hour h is h-6 at :30 UTC). */
function timeChoices(): string[] {
  return Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) =>
    formatAdminTime(new Date(Date.UTC(2000, 0, 1, FIRST_HOUR + i - 6, 30))),
  );
}

export function ScheduleMarketOpenCloseScreen({
  initialMode = 'open',
  initialDate = '',
  initialTime = '',
  initialRepeat = 'One Time',
  can,
  onBack,
  onSave,
}: ScheduleMarketOpenCloseScreenProps) {
  const [mode, setMode] = useState<'open' | 'close'>(initialMode);
  const [date, setDate] = useState<string>(initialDate);
  const [time, setTime] = useState<string>(initialTime);
  const [repeat, setRepeat] = useState<ScheduleRepeatOption>(initialRepeat);

  const [showRepeatDropdown, setShowRepeatDropdown] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dates = useMemo(() => dateChoices(new Date()), []);
  const times = useMemo(() => timeChoices(), []);

  const hasPermission = can(SCHEDULE_MARKET_CODES.manage);
  const submitEnabled = hasPermission && onSave !== undefined && date !== '' && time !== '';
  const isModeOpen = mode === 'open';
  const repeatLabel = t(REPEAT_OPTIONS.find((o) => o.value === repeat)?.labelKey ?? 'saSchedule.repeat.oneTime');
  const dateText = date === '' ? ADMIN_NO_VALUE : date;
  const timeText = time === '' ? ADMIN_NO_VALUE : time;

  const handleSave = () => {
    if (!submitEnabled || !onSave) return;
    onSave({ mode, date, time, repeat });
    onBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('saSchedule.back')}
        >
          <BackArrowIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('saSchedule.title')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[styles.segmentTab, isModeOpen ? styles.segmentTabActive : styles.segmentTabInactive]}
            onPress={() => setMode('open')}
            activeOpacity={0.8}
          >
            <ScheduleOpenPlayIcon size={18} color={isModeOpen ? adminColors.onBrand : adminColors.muted} />
            <Text style={[styles.segmentTabText, isModeOpen ? styles.segmentTabTextActive : styles.segmentTabTextInactive]}>
              {t('saSchedule.scheduleOpen')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, !isModeOpen ? styles.segmentTabActive : styles.segmentTabInactive]}
            onPress={() => setMode('close')}
            activeOpacity={0.8}
          >
            <ScheduleCloseCrossIcon size={18} color={!isModeOpen ? adminColors.onBrand : adminColors.muted} />
            <Text style={[styles.segmentTabText, !isModeOpen ? styles.segmentTabTextActive : styles.segmentTabTextInactive]}>
              {t('saSchedule.scheduleClose')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBanner}>
          <View style={styles.infoIconBadge}>
            <Text style={styles.infoIconLetter}>i</Text>
          </View>
          <Text style={styles.infoText}>{isModeOpen ? t('saSchedule.infoOpen') : t('saSchedule.infoClose')}</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {isModeOpen ? t('saSchedule.openDate') : t('saSchedule.closeDate')} <Text style={styles.asterisk}>*</Text>
            </Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
              <View style={styles.inputLeft}>
                <CalendarIcon size={18} color={adminColors.muted} />
                <Text style={styles.inputValue}>{dateText}</Text>
              </View>
              <CalendarIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {isModeOpen ? t('saSchedule.openTime') : t('saSchedule.closeTime')} <Text style={styles.asterisk}>*</Text>
            </Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
              <View style={styles.inputLeft}>
                <HistoryClockIcon size={18} color={adminColors.muted} />
                <Text style={styles.inputValue}>{timeText}</Text>
              </View>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t('saSchedule.repeat')} <Text style={styles.optionalText}>{t('saSchedule.optional')}</Text>
            </Text>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setShowRepeatDropdown(!showRepeatDropdown)}
              activeOpacity={0.7}
            >
              <View style={styles.inputLeft}>
                <RepeatIcon size={18} color={adminColors.muted} />
                <Text style={styles.inputValue}>{repeatLabel}</Text>
              </View>
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>

            {showRepeatDropdown && (
              <View style={styles.dropdownCard}>
                {REPEAT_OPTIONS.map((opt, idx) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.dropdownItem, idx < REPEAT_OPTIONS.length - 1 && styles.dropdownItemBorder]}
                    onPress={() => {
                      setRepeat(opt.value);
                      setShowRepeatDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownItemText, repeat === opt.value && styles.dropdownItemTextSelected]}>
                      {t(opt.labelKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <StoreIcon size={20} color={adminColors.success.text} />
            <Text style={styles.summaryTitle}>{t('saSchedule.summary')}</Text>
          </View>
          <View style={styles.summaryHeaderDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('saSchedule.action')}</Text>
            <Text style={styles.summaryValue}>
              {t('saSchedule.summaryValue', {
                value: isModeOpen ? t('saSchedule.actionOpen') : t('saSchedule.actionClose'),
              })}
            </Text>
          </View>
          <View style={styles.summaryRowDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('saSchedule.date')}</Text>
            <Text style={styles.summaryValue}>{t('saSchedule.summaryValue', { value: dateText })}</Text>
          </View>
          <View style={styles.summaryRowDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('saSchedule.time')}</Text>
            <Text style={styles.summaryValue}>{t('saSchedule.summaryValue', { value: timeText })}</Text>
          </View>
          <View style={styles.summaryRowDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('saSchedule.summaryRepeat')}</Text>
            <Text style={styles.summaryValue}>{t('saSchedule.summaryValue', { value: repeatLabel })}</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>{t('saSchedule.cancel')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, !submitEnabled && styles.submitBtnDisabled]}
          onPress={handleSave}
          disabled={!submitEnabled}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>
            {isModeOpen ? t('saSchedule.submitOpen') : t('saSchedule.submitClose')}
          </Text>
        </TouchableOpacity>
      </View>

      <PickerModal
        visible={showTimePicker}
        title={t('saSchedule.selectTime')}
        options={times}
        selected={time}
        onPick={(v) => {
          setTime(v);
          setShowTimePicker(false);
        }}
        onClose={() => setShowTimePicker(false)}
      />
      <PickerModal
        visible={showDatePicker}
        title={t('saSchedule.selectDate')}
        options={dates}
        selected={date}
        onPick={(v) => {
          setDate(v);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: readonly string[];
  selected: string;
  onPick: (value: string) => void;
  onClose: () => void;
}

function PickerModal({ visible, title, options, selected, onPick, onClose }: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerModalContent}>
          <Text style={styles.pickerModalTitle}>{title}</Text>
          <ScrollView style={styles.pickerModalScroll}>
            {options.map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.pickerModalItem, selected === value && styles.pickerModalItemSelected]}
                onPress={() => onPick(value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerModalItemText, selected === value && styles.pickerModalItemTextSelected]}>
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
