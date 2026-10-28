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

function InfoCircleIcon({ size = 18, color = '#6B6055' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="11" x2="12" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="7.5" r="1.2" fill={color} />
    </Svg>
  );
}

// ─── Data ───────────────────────────────────────────────────────────────────

interface HistoryRecord {
  id: string;
  cropGrade: string;
  recordedDate: string;
  previous: string;
  current: string;
  frequency: string;
  effective: string;
}

const DEFAULT_HISTORY: HistoryRecord[] = [
  {
    id: 'ph-1',
    cropGrade: 'Carrot · G1',
    recordedDate: '30 Sep',
    previous: '₹95.00',
    current: '₹100.00',
    frequency: 'Weekly',
    effective: '30 Sep',
  },
  {
    id: 'ph-2',
    cropGrade: 'Carrot · G1',
    recordedDate: '23 Sep',
    previous: '₹90.00',
    current: '₹95.00',
    frequency: 'Weekly',
    effective: '29 Sep',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export interface FarmerPriceHistoryScreenProps {
  onBack: () => void;
}

export function FarmerPriceHistoryScreen({ onBack }: FarmerPriceHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = DEFAULT_HISTORY.filter((item) =>
    item.cropGrade.toLowerCase().includes(searchQuery.toLowerCase()),
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

          <Text style={styles.headerTitle}>Price History</Text>

          <View style={styles.filterBtnWrap}>
            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
              <FilterSlidersIcon size={18} color={adminColors.onBrand} />
            </TouchableOpacity>
          </View>
        </View>
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
            placeholder="Crop, product, category"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* History Cards */}
        {filtered.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cropTitle}>{item.cropGrade}</Text>
              <Text style={styles.recordedDate}>{item.recordedDate}</Text>
            </View>

            <View style={styles.columnsRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Previous</Text>
                <Text style={styles.colVal}>{item.previous}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>New</Text>
                <Text style={styles.colVal}>{item.current}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Frequency</Text>
                <Text style={styles.colVal}>{item.frequency}</Text>
              </View>
            </View>

            <View style={styles.effectiveRow}>
              <Text style={styles.effectiveLabel}>Effective</Text>
              <Text style={styles.effectiveVal}>{item.effective}</Text>
            </View>
          </View>
        ))}

        {/* Disclaimer Note */}
        <View style={styles.disclaimerBox}>
          <InfoCircleIcon size={18} color="#8C827A" />
          <Text style={styles.disclaimerText}>
            Money values are displayed exactly as returned by the API — never recalculated with
            frontend floating-point arithmetic. Newest changes shown first.
          </Text>
        </View>

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
    marginBottom: adminSpacing.sm,
  },
  cropTitle: {
    ...adminType.body,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  recordedDate: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    fontWeight: '700',
  },

  columnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
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

  effectiveRow: {
    borderTopWidth: 1,
    borderTopColor: '#F5EFE6',
    paddingTop: adminSpacing.xs,
  },
  effectiveLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },
  effectiveVal: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 1,
  },

  disclaimerBox: {
    marginTop: adminSpacing.md,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
  },
  disclaimerText: {
    ...adminType.caption,
    fontSize: 12,
    color: '#6B6055',
    lineHeight: 18,
    flex: 1,
  },
});
