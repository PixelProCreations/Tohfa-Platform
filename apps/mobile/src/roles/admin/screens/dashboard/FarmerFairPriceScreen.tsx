import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="6" r="2.2" fill={color} />
      <Circle cx="16" cy="12" r="2.2" fill={color} />
      <Circle cx="10" cy="18" r="2.2" fill={color} />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data ───────────────────────────────────────────────────────────────────

interface FairPriceRecord {
  id: string;
  name: string;
  categoryGrade: string;
  ceiling: string;
  frequency: string;
  effectiveFrom: string;
  status: string;
}

const DEFAULT_RECORDS: FairPriceRecord[] = [
  {
    id: 'fp-1',
    name: 'Carrot',
    categoryGrade: 'Vegetables · Grade 1',
    ceiling: '₹100.00/kg',
    frequency: 'Weekly',
    effectiveFrom: '30 Sep 2026',
    status: 'Active',
  },
  {
    id: 'fp-2',
    name: 'Cabbage',
    categoryGrade: 'Vegetables · Grade 2',
    ceiling: '₹100.00/kg',
    frequency: 'Weekly',
    effectiveFrom: '30 Sep 2026',
    status: 'Active',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export interface FarmerFairPriceScreenProps {
  onBack: () => void;
}

export function FarmerFairPriceScreen({ onBack }: FarmerFairPriceScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = DEFAULT_RECORDS.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryGrade.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Fair Price</Text>

          <View style={styles.filterBtnWrap}>
            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
              <FilterSlidersIcon size={18} color={adminColors.onBrand} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.headerSubtitle}>
          View current TOHFA fair-price ceilings used for produce listing and purchase decisions
        </Text>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Crop, product, crop code, category"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Card List */}
        {filtered.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cropName}>{item.name}</Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.categoryText}>{item.categoryGrade}</Text>

            <View style={styles.columnsRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Fair Price Ceiling</Text>
                <Text style={styles.colVal}>{item.ceiling}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Frequency</Text>
                <Text style={styles.colVal}>{item.frequency}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Effective From</Text>
                <Text style={styles.colVal}>{item.effectiveFrom}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: adminSpacing.xxl }} />
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
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
    flex: 1,
  },
  filterBtnWrap: {
    alignItems: 'flex-end',
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.onBrand,
    marginTop: 4,
    opacity: 0.95,
    lineHeight: 17,
  },

  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
  },

  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cropName: {
    ...adminType.body,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  categoryText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
    marginBottom: adminSpacing.sm,
  },

  columnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  colLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },
  colVal: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 2,
  },
});
