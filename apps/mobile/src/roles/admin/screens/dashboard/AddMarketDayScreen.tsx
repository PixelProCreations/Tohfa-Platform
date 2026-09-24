/**
 * Add Market Day Screen
 * Configure a new market day with warehouse, date, and time selection
 */
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import type { MarketDay } from './MarketDayScheduleScreen';

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

const WAREHOUSES = ['Ooty Warehouse', 'Coonoor Warehouse', 'Kotagiri Warehouse', 'Gudalur Market'];

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

interface AddMarketDayScreenProps {
  onBack: () => void;
  onSave: (marketDay: Omit<MarketDay, 'id' | 'isActive'>) => void;
}

export function AddMarketDayScreen({ onBack, onSave }: AddMarketDayScreenProps) {
  const [warehouse, setWarehouse] = useState<string>('');
  const [date, setDate] = useState<number>(14);
  const [month, setMonth] = useState<string>('SEP');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!warehouse) newErrors.warehouse = 'Please select a warehouse';
    if (!startTime) newErrors.startTime = 'Please select a start time';
    if (!endTime) newErrors.endTime = 'Please select an end time';
    
    if (startTime && endTime) {
      // Convert times to minutes for comparison
      const parseTime = (time: string) => {
        const [timePart, period] = time.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        
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
        newErrors.endTime = 'End time must be after start time';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    
    const timeRange = `${startTime} – ${endTime}`;
    
    onSave({
      date,
      month,
      warehouse,
      timeRange,
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="chevron_right" size={20} color={P.ink} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.title}>Add Market Day</Text>
        <Text style={styles.subtitle}>Configure a new market day</Text>

        {/* Warehouse Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Warehouse</Text>
          <TouchableOpacity
            style={[styles.input, errors.warehouse && styles.inputError]}
            onPress={() => setShowWarehousePicker(!showWarehousePicker)}
            activeOpacity={0.7}
          >
            <Text style={[styles.inputText, !warehouse && styles.inputPlaceholder]}>
              {warehouse || 'Select warehouse'}
            </Text>
            <Icon name="expand_more" size={20} color={P.muted} />
          </TouchableOpacity>
          {errors.warehouse && <Text style={styles.errorText}>{errors.warehouse}</Text>}
          
          {showWarehousePicker && (
            <View style={styles.picker}>
              {WAREHOUSES.map((wh) => (
                <TouchableOpacity
                  key={wh}
                  style={styles.pickerItem}
                  onPress={() => {
                    setWarehouse(wh);
                    setShowWarehousePicker(false);
                    setErrors({ ...errors, warehouse: '' });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerItemText}>{wh}</Text>
                  {warehouse === wh && <Icon name="check" size={18} color={P.orange} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Date Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Market Date</Text>
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
                  <Text style={styles.dateColumnTitle}>Day</Text>
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
                <Text style={styles.pickerDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Start Time Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Start Time</Text>
          <TouchableOpacity
            style={[styles.input, errors.startTime && styles.inputError]}
            onPress={() => setShowStartTimePicker(!showStartTimePicker)}
            activeOpacity={0.7}
          >
            <Text style={[styles.inputText, !startTime && styles.inputPlaceholder]}>
              {startTime || 'Select start time'}
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
          <Text style={styles.label}>End Time</Text>
          <TouchableOpacity
            style={[styles.input, errors.endTime && styles.inputError]}
            onPress={() => setShowEndTimePicker(!showEndTimePicker)}
            activeOpacity={0.7}
          >
            <Text style={[styles.inputText, !endTime && styles.inputPlaceholder]}>
              {endTime || 'Select end time'}
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

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save Market Day</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
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
});
