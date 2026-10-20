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

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../theme';

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
      <StatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="chevron_right" size={20} color={adminColors.ink} style={{ transform: [{ rotate: '180deg' }] }} />
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
                trackColor={{ false: adminColors.border, true: adminColors.brandTint }}
                thumbColor={day.isActive ? adminColors.brand : adminColors.muted}
                ios_backgroundColor={adminColors.border}
              />
            </View>
          ))}
        </View>

        {/* Add Button */}
        <TouchableOpacity style={styles.addMarketBtn} onPress={onAddMarketDay} activeOpacity={0.8}>
          <Icon name="add" size={22} color={adminColors.onBrand} style={{ marginRight: 8 }} />
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
    backgroundColor: adminColors.canvas,
  },
  header: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
  },
  title: {
    ...adminType.title,
    fontSize: 20,
    color: adminColors.brandDeep,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.lg,
    lineHeight: 18,
  },
  dayList: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  dateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
    minWidth: 44,
    height: 44,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
  },
  dateNum: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.brandDeep,
    lineHeight: 22,
  },
  dateMonth: {
    ...adminType.caption,
    fontSize: 10,
    fontWeight: '800',
    color: adminColors.brand,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  dayInfo: {
    flex: 1,
  },
  warehouseName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 2,
  },
  timeRange: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 17.6,
  },
  addMarketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    ...adminShadow.md,
  },
  addMarketBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
});
