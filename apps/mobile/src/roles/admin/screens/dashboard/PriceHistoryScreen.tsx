/**
 * Screen 42 — Price History
 * Shows historical price changes with a bar chart and detailed list
 * for a specific produce item over the last 6 updates.
 */
import React from 'react';
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

const P = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  orange: '#E8562A',
  orangeLight: '#FFCCBB',
  orangeLighter: '#FFE5DC',
  ink: '#5D2510',
  darkBrown: '#5D2510',
  body: '#6B6560',
  muted: '#9A8F88',
  lightGray: '#B0A9A3',
  border: '#EDE9E4',
};

interface PriceHistoryItem {
  month: string;
  year: number;
  price: number;
}

const HISTORY: PriceHistoryItem[] = [
  { month: 'Apr', year: 2026, price: 33 },
  { month: 'May', year: 2026, price: 35 },
  { month: 'Jun', year: 2026, price: 34 },
  { month: 'Jul', year: 2026, price: 38 },
  { month: 'Aug', year: 2026, price: 40 },
  { month: 'Sep', year: 2026, price: 42 },
];

interface PriceHistoryScreenProps {
  onBack: () => void;
  itemName?: string;
  category?: string;
  currentPrice?: number;
}

export function PriceHistoryScreen({
  onBack,
  itemName = 'Carrots',
  category = 'Vegetables',
  currentPrice = 42,
}: PriceHistoryScreenProps) {
  const maxPrice = Math.max(...HISTORY.map((h) => h.price));

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
        <Text style={styles.title}>Price History</Text>
        <Text style={styles.subtitle}>
          {itemName} · {category} · Last {HISTORY.length} updates
        </Text>

        {/* Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartGrid}>
            {HISTORY.map((item, idx) => {
              const heightPercent = (item.price / maxPrice) * 100;
              const isRecent = idx >= HISTORY.length - 2;
              return (
                <View key={idx} style={styles.barColumn}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${heightPercent}%`,
                          backgroundColor: isRecent ? P.orange : P.orangeLighter,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.month}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Detailed List */}
        <View style={styles.detailList}>
          {[...HISTORY].reverse().map((item, idx) => (
            <View key={idx} style={styles.detailRow}>
              <Text style={styles.detailMonth}>
                {item.month} {item.year}
              </Text>
              <Text style={styles.detailPrice}>₹{item.price}/kg</Text>
            </View>
          ))}
        </View>

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
    fontSize: 24,
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
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  chartCard: {
    backgroundColor: P.cardBg,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: P.border,
  },
  chartGrid: {
    flexDirection: 'row',
    height: 160,
    alignItems: 'flex-end',
    gap: 12,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    width: '100%',
    height: 140,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: P.body,
    marginTop: 8,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  detailList: {
    backgroundColor: P.cardBg,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: P.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
  },
  detailMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: P.body,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  detailPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: P.darkBrown,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
});
