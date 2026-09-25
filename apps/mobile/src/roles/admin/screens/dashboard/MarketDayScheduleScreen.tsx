/**
 * Screen 43 — Market Day Schedule
 * Shows live market day dates by warehouse with toggles to enable/disable
 * and ability to add new market days.
 */
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@tohfa/mobile-ui';

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
};

interface MarketDay {
  id: string;
  date: number;
  month: string;
  warehouse: string;
  timeRange: string;
  isActive: boolean;
}

export type { MarketDay };

const MOCK_DAYS: MarketDay[] = [
  { id: '1', date: 14, month: 'SEP', warehouse: 'Ooty Warehouse', timeRange: '6:00 AM – 11:00 AM', isActive: true },
  { id: '2', date: 17, month: 'SEP', warehouse: 'Coonoor Warehouse', timeRange: '6:00 AM – 11:00 AM', isActive: true },
  { id: '3', date: 21, month: 'SEP', warehouse: 'Kotagiri Warehouse', timeRange: '6:00 AM – 11:00 AM', isActive: false },
  { id: '4', date: 24, month: 'SEP', warehouse: 'Gudalur Market', timeRange: '6:00 AM – 11:00 AM', isActive: true },
];

export { MOCK_DAYS };

interface MarketDayScheduleScreenProps {
  onBack: () => void;
  onAddMarketDay: () => void;
  onToggle: (id: string, value: boolean) => void;
  days?: MarketDay[];
  onDaysChange?: (days: MarketDay[]) => void;
}

export function MarketDayScheduleScreen({
  onBack,
  onAddMarketDay,
  onToggle,
  days: propDays,
  onDaysChange,
}: MarketDayScheduleScreenProps) {
  const [days, setDays] = useState(propDays || MOCK_DAYS);

  useEffect(() => {
    if (propDays) {
      setDays(propDays);
    }
  }, [propDays]);

  const handleToggle = (id: string, value: boolean) => {
    const newDays = days.map((d) => (d.id === id ? { ...d, isActive: value } : d));
    setDays(newDays);
    if (onDaysChange) onDaysChange(newDays);
    onToggle(id, value);
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
        <Text style={styles.title}>Market Day Schedule</Text>
        <Text style={styles.subtitle}>Live market day dates by warehouse</Text>

        {/* Market Day List */}
        <View style={styles.dayList}>
          {days.map((day) => (
            <View key={day.id} style={styles.dayCard}>
              <View style={styles.dateBox}>
                <Text style={styles.dateNum}>{day.date}</Text>
                <Text style={styles.dateMonth}>{day.month}</Text>
              </View>

              <View style={styles.dayInfo}>
                <Text style={styles.warehouseName}>{day.warehouse}</Text>
                <Text style={styles.timeRange}>{day.timeRange}</Text>
              </View>

              <Switch
                value={day.isActive}
                onValueChange={(value) => handleToggle(day.id, value)}
                trackColor={{ false: P.border, true: P.orangeBg }}
                thumbColor={day.isActive ? P.orange : P.muted}
                ios_backgroundColor={P.border}
              />
            </View>
          ))}
        </View>

        {/* Add Button */}
        <TouchableOpacity style={styles.addMarketBtn} onPress={onAddMarketDay} activeOpacity={0.8}>
          <Icon name="add" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.addMarketBtnText}>Add Market Day</Text>
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
    marginBottom: 20,
    lineHeight: 18,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  dayList: {
    gap: 12,
    marginBottom: 20,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    borderRadius: 14,
    padding: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    minWidth: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FDF3F0',
  },
  dateNum: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5D2510',
    lineHeight: 22,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: P.red,
    letterSpacing: 0.5,
    marginTop: 1,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  dayInfo: {
    flex: 1,
  },
  warehouseName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  timeRange: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#1A1A1A',
    lineHeight: 17.6,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  addMarketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addMarketBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
});
