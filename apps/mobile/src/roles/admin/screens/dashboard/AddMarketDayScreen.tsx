/**
 * Add Market Day — the design's form, over the live warehouse list.
 *
 * SPEC GAP, reported rather than faked: docs/openapi.yaml has no endpoint that
 * creates a market day (GET /admin/sales/market-day is a read of one day's
 * sales; the warehouse's own `is_market_day_venue` / `market_day_of_week` have
 * no mobile write). So Save is shown, DISABLED, with an i18n explanation, and
 * it is wired to nothing: it can never report a success the server never gave.
 * The old `onSave` prop — which the host answered with "// Save market day
 * logic here" — is gone rather than left looking live.
 *
 * What IS live: the warehouse picker, which lists the real warehouses from
 * GET /warehouses (warehouse.all.view) and carries their uuids, not the
 * fixture's four names. Date and time stay as the design's local pickers; they
 * have nowhere to go yet.
 *
 * The fixture's hardcoded palette is left exactly as it was.
 */
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon, ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { useMarketDayVenues } from '../../api/marketDayHooks';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

const P = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  orange: '#E8562A',
  orangeBg: '#FFECE8',
  ink: '#5D2510',
  darkBrown: '#5D2510',
  body: '#6B6560',
  muted: '#9A8F88',
  lightGray: '#B0A9A3',
  border: '#EDE9E4',
  red: '#E8562A',
  danger: '#E53935',
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const START_TIMES = [
  '12:00 AM', '12:30 AM', '01:00 AM', '01:30 AM', '02:00 AM', '02:30 AM',
  '03:00 AM', '03:30 AM', '04:00 AM', '04:30 AM', '05:00 AM', '05:30 AM',
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
];

const END_TIMES = [
  '12:00 AM', '12:30 AM', '01:00 AM', '01:30 AM', '02:00 AM', '02:30 AM',
  '03:00 AM', '03:30 AM', '04:00 AM', '04:30 AM', '05:00 AM', '05:30 AM',
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
];

export interface AddMarketDayScreenProps {
  onBack: () => void;
  /** Permission check from /auth/me. Missing means nothing is permitted (fail closed). */
  can?: Can | undefined;
}

export function AddMarketDayScreen({ onBack, can }: AddMarketDayScreenProps) {
  const canViewWarehouses = can !== undefined && can('warehouse.all.view');
  const network = useMarketDayVenues({ enabled: canViewWarehouses });
  const [warehouseId, setWarehouseId] = useState<string>('');
  const warehouse = network.warehouses.find((w) => w.id === warehouseId)?.name ?? '';
  const [date, setDate] = useState<number>(14);
  const [month, setMonth] = useState<string>('SEP');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const _validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!warehouseId) newErrors.warehouse = t('pricingMarketDay.add.error.warehouse');
    if (!startTime) newErrors.startTime = t('pricingMarketDay.add.error.startTime');
    if (!endTime) newErrors.endTime = t('pricingMarketDay.add.error.endTime');
    
    if (startTime && endTime) {
      // Convert times to minutes for comparison
      const parseTime = (time: string) => {
        const parts = time.split(' ');
        const timePart = parts[0] ?? '0:00';
        const period = parts[1] ?? 'AM';
        const timeSegments = timePart.split(':');
        let hours = Number(timeSegments[0] ?? '0');
        const minutes = Number(timeSegments[1] ?? '0');
        
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        
        return hours * 60 + minutes;
      };
      
      const startMinutes = parseTime(startTime);
      const endMinutes = parseTime(endTime);
      
      if (endMinutes <= startMinutes) {
        newErrors.endTime = t('pricingMarketDay.add.error.endBeforeStart');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // There is no create endpoint, so nothing is submitted. validate() still
  // runs on the fields so the form behaves, but Save stays disabled and no
  // success is ever shown.
  const formComplete = warehouseId !== '' && startTime !== '' && endTime !== '' && validateQuietly(startTime, endTime);

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('pricingMarketDay.back')}
        >
          <Icon name="chevron_right" size={20} color={P.ink} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.title}>{t('pricingMarketDay.add.title')}</Text>
        <Text style={styles.subtitle}>{t('pricingMarketDay.add.subtitle')}</Text>

        {/* Warehouse Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('pricingMarketDay.add.warehouse')}</Text>
          <TouchableOpacity
            style={[styles.input, errors.warehouse ? styles.inputError : undefined]}
            onPress={() => setShowWarehousePicker(!showWarehousePicker)}
            activeOpacity={0.7}
          >
            <Text style={[styles.inputText, !warehouse && styles.inputPlaceholder]}>
              {warehouse === '' ? t('pricingMarketDay.add.warehousePlaceholder') : warehouse}
            </Text>
            <Icon name="expand_more" size={20} color={P.muted} />
          </TouchableOpacity>
          {errors.warehouse && <Text style={styles.errorText}>{errors.warehouse}</Text>}
          
          {showWarehousePicker && (
            <View style={styles.picker}>
              {network.isLoading ? <AdminLoadingState /> : null}
              {network.error !== null && network.error !== undefined ? (
                <AdminErrorState error={network.error} onRetry={network.refresh} />
              ) : null}
              {network.warehouses.map((wh) => (
                <TouchableOpacity
                  key={wh.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setWarehouseId(wh.id);
                    setShowWarehousePicker(false);
                    setErrors({ ...errors, warehouse: '' });
                  }}
                  activeOpacity={0.7}
                  testID={`pricingMarketDay.add.warehouse.${wh.id}`}
                >
                  <Text style={styles.pickerItemText}>{wh.name}</Text>
                  {warehouseId === wh.id && <Icon name="check" size={18} color={P.orange} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Date Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('pricingMarketDay.add.date')}</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(!showDatePicker)}
            activeOpacity={0.7}
          >
            <Text style={styles.inputText}>
              {date} {month} 2026
            </Text>
            <Icon name="expand_more" size={20} color={P.muted} />
          </TouchableOpacity>
          
          {showDatePicker && (
            <View style={styles.picker}>
              <View style={styles.datePickerRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColumnTitle}>{t('pricingMarketDay.add.date')}</Text>
                  <ScrollView 
                    style={styles.dateScroll}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.pickerItem, { borderBottomWidth: 0 }]}
                        onPress={() => setDate(d)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.pickerItemText}>{d}</Text>
                        {date === d && <Icon name="check" size={18} color={P.orange} />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateColumnTitle}>Month</Text>
                  <ScrollView 
                    style={styles.dateScroll}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {MONTHS.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.pickerItem, { borderBottomWidth: 0, borderRightWidth: 0 }]}
                        onPress={() => setMonth(m)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.pickerItemText}>{m}</Text>
                        {month === m && <Icon name="check" size={18} color={P.orange} />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              <TouchableOpacity
                style={styles.pickerDoneBtn}
                onPress={() => setShowDatePicker(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerDoneBtnText}>{t('pricingCeiling.close')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Start Time Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('pricingMarketDay.add.startTime')}</Text>
          <TouchableOpacity
            style={[styles.input, errors.startTime ? styles.inputError : undefined]}
            onPress={() => setShowStartTimePicker(!showStartTimePicker)}
            activeOpacity={0.7}
          >
            <Text style={[styles.inputText, !startTime && styles.inputPlaceholder]}>
              {startTime === '' ? t('pricingMarketDay.add.selectTime') : startTime}
            </Text>
            <Icon name="expand_more" size={20} color={P.muted} />
          </TouchableOpacity>
          {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
          
          {showStartTimePicker && (
            <View style={styles.timePicker}>
              <ScrollView 
                style={styles.timePickerScroll}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {START_TIMES.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.pickerItem, { borderBottomWidth: 0 }]}
                    onPress={() => {
                      setStartTime(time);
                      setShowStartTimePicker(false);
                      setErrors({ ...errors, startTime: '' });
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerItemText}>{time}</Text>
                    {startTime === time && <Icon name="check" size={18} color={P.orange} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* End Time Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('pricingMarketDay.add.endTime')}</Text>
          <TouchableOpacity
            style={[styles.input, errors.endTime ? styles.inputError : undefined]}
            onPress={() => setShowEndTimePicker(!showEndTimePicker)}
            activeOpacity={0.7}
          >
            <Text style={[styles.inputText, !endTime && styles.inputPlaceholder]}>
              {endTime === '' ? t('pricingMarketDay.add.selectTime') : endTime}
            </Text>
            <Icon name="expand_more" size={20} color={P.muted} />
          </TouchableOpacity>
          {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
          
          {showEndTimePicker && (
            <View style={styles.timePicker}>
              <ScrollView 
                style={styles.timePickerScroll}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {END_TIMES.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.pickerItem, { borderBottomWidth: 0 }]}
                    onPress={() => {
                      setEndTime(time);
                      setShowEndTimePicker(false);
                      setErrors({ ...errors, endTime: '' });
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerItemText}>{time}</Text>
                    {endTime === time && <Icon name="check" size={18} color={P.orange} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Save Button. No create endpoint exists (see the docblock): it is
            visible, disabled, and wired to nothing. */}
        <TouchableOpacity
          style={[styles.saveBtn, styles.saveBtnDisabled]}
          disabled
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          testID="pricingMarketDay.add.save"
        >
          <Text style={styles.saveBtnText}>{t('pricingMarketDay.add.save')}</Text>
        </TouchableOpacity>
        <Text style={styles.unavailableText} testID="pricingMarketDay.add.unavailable">
          {t('pricingMarketDay.add.unavailable')}
        </Text>
        {formComplete ? null : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** The design's "end after start" check, without touching the error state. */
function validateQuietly(startTime: string, endTime: string): boolean {
  return minutesOfDay(endTime) > minutesOfDay(startTime);
}

function minutesOfDay(time: string): number {
  const parts = time.split(' ');
  const timePart = parts[0] ?? '0:00';
  const period = parts[1] ?? 'AM';
  const segments = timePart.split(':');
  let hours = Number(segments[0] ?? '0');
  const minutes = Number(segments[1] ?? '0');
  if (period === 'PM' && hours !== 12) hours += 12;
  else if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 6,
    letterSpacing: -0.3,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  subtitle: {
    fontSize: 13,
    color: P.lightGray,
    marginBottom: 24,
    lineHeight: 18,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: P.darkBrown,
    marginBottom: 8,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: P.danger,
  },
  inputText: {
    fontSize: 15,
    color: P.darkBrown,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  inputPlaceholder: {
    color: P.lightGray,
  },
  errorText: {
    fontSize: 12,
    color: P.danger,
    marginTop: 4,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  picker: {
    backgroundColor: P.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.border,
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timePicker: {
    backgroundColor: P.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.border,
    marginTop: 8,
    maxHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timePickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
  },
  pickerItemText: {
    fontSize: 15,
    color: P.darkBrown,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  datePickerRow: {
    flexDirection: 'row',
    height: 200,
  },
  dateColumn: {
    flex: 1,
  },
  dateColumnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: P.body,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
    textAlign: 'center',
    fontFamily: 'Manrope, system-ui, sans-serif',
    backgroundColor: P.pageBg,
  },
  dateScroll: {
    flex: 1,
  },
  pickerDoneBtn: {
    backgroundColor: P.orange,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  pickerDoneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  saveBtn: {
    backgroundColor: P.orange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  unavailableText: {
    fontSize: 12,
    color: P.lightGray,
    marginTop: 10,
    lineHeight: 17,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
});
