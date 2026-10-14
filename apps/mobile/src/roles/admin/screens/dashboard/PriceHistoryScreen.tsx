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

// ─── Design Tokens ───────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand,
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: adminColors.muted,

  // Actions
  orangeBtn: adminColors.brand,
};

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

// Sliders / Tune Filter Icon (Exact Material Symbols tune)
function FilterSlidersIcon({ size = 20, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="12" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="18" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CircleInfoIcon({ size = 18, color = '#9C4A1A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 8h.01M11 12h2v4h-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface PriceHistoryRecord {
  id: string;
  crop: string;
  grade: string;
  cropGrade: string;
  datePill: string;
  previousPrice: string;
  newPrice: string;
  frequency: string;
  effectiveDate: string;
  created: string;
  actor: string;
}

export const SAMPLE_PRICE_HISTORY: PriceHistoryRecord[] = [
  {
    id: 'ph-1',
    crop: 'Carrot',
    grade: 'Grade 1',
    cropGrade: 'Carrot · G1',
    datePill: '30 Sep',
    previousPrice: '₹95.00/kg',
    newPrice: '₹100.00/kg',
    frequency: 'Weekly',
    effectiveDate: '30 Sep 2026',
    created: '30 Sep 2026, 6:00 AM',
    actor: 'System (SA-configured)',
  },
  {
    id: 'ph-2',
    crop: 'Carrot',
    grade: 'Grade 1',
    cropGrade: 'Carrot · G1',
    datePill: '23 Sep',
    previousPrice: '₹90.00/kg',
    newPrice: '₹95.00/kg',
    frequency: 'Weekly',
    effectiveDate: '29 Sep 2026',
    created: '23 Sep 2026, 6:00 AM',
    actor: 'System (SA-configured)',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface PriceHistoryScreenProps {
  onBack: () => void;
}

export function PriceHistoryScreen({ onBack }: PriceHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PriceHistoryRecord | null>(null);

  // Filter States (Screenshot 3 Left)
  const [selectedCrop, setSelectedCrop] = useState<'All' | 'Carrot' | 'Cabbage'>('All');
  const [selectedDateRange, setSelectedDateRange] = useState<'Today' | 'Last 7 Days' | 'Custom'>('Today');

  const filteredHistory = SAMPLE_PRICE_HISTORY.filter((item) => {
    if (selectedCrop !== 'All' && !item.cropGrade.toLowerCase().includes(selectedCrop.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return item.cropGrade.toLowerCase().includes(q) || item.crop.toLowerCase().includes(q);
    }
    return true;
  });

  const handleHeaderBack = () => {
    if (showFilters) {
      setShowFilters(false);
    } else if (selectedRecord) {
      setSelectedRecord(null);
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Matching Screenshot 2, 3 Left & Image 1 Detail ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleHeaderBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Price History</Text>
          </View>

          {/* Top Right Circular Filter Button */}
          <TouchableOpacity
            style={[styles.filterIconCircle, showFilters && styles.filterIconCircleActive]}
            onPress={() => {
              if (!showFilters && selectedRecord) {
                setSelectedRecord(null);
              }
              setShowFilters(!showFilters);
            }}
            activeOpacity={0.8}
            accessibilityLabel="Toggle filters"
          >
            <FilterSlidersIcon size={20} color={THEME.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showFilters ? (
          /* ─── Filter Panel (Screenshot 3 Left) ─── */
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeaderRow}>
              <FilterSlidersIcon size={18} color={THEME.titleRustDark} />
              <Text style={styles.filtersHeading}>Filters</Text>
            </View>

            {/* Sub-section: Crop */}
            <Text style={styles.filterGroupLabel}>Crop</Text>
            <View style={styles.chipsRow}>
              {(['All', 'Carrot', 'Cabbage'] as const).map((crop) => {
                const isSelected = selectedCrop === crop;
                return (
                  <TouchableOpacity
                    key={crop}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setSelectedCrop(crop)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {crop}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sub-section: Date Range */}
            <Text style={[styles.filterGroupLabel, { marginTop: adminSpacing.md }]}>
              Date Range
            </Text>
            <View style={styles.chipsRow}>
              {(['Today', 'Last 7 Days', 'Custom'] as const).map((range) => {
                const isSelected = selectedDateRange === range;
                return (
                  <TouchableOpacity
                    key={range}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setSelectedDateRange(range)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Buttons: Apply & Clear */}
            <View style={styles.filterButtonsRow}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setSelectedRecord(null);
                  setShowFilters(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setSelectedCrop('All');
                  setSelectedDateRange('Today');
                  setSelectedRecord(null);
                  setShowFilters(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : selectedRecord ? (
          /* ─── Price History Detail View (Image 1 Request) ─── */
          <>
            <View style={styles.detailCard}>
              {/* Row 1: Crop & Grade */}
              <View style={styles.detailGridRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Crop</Text>
                  <Text style={styles.detailValue}>{selectedRecord.crop}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Grade</Text>
                  <Text style={styles.detailValue}>{selectedRecord.grade}</Text>
                </View>
              </View>

              {/* Row 2: Previous Price & New Price */}
              <View style={[styles.detailGridRow, { marginTop: adminSpacing.lg }]}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Previous Price</Text>
                  <Text style={styles.detailValue}>{selectedRecord.previousPrice}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>New Price</Text>
                  <Text style={styles.detailValue}>{selectedRecord.newPrice}</Text>
                </View>
              </View>

              {/* Row 3: Frequency & Effective Date */}
              <View style={[styles.detailGridRow, { marginTop: adminSpacing.lg }]}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Frequency</Text>
                  <Text style={styles.detailValue}>{selectedRecord.frequency}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Effective Date</Text>
                  <Text style={styles.detailValue}>{selectedRecord.effectiveDate}</Text>
                </View>
              </View>

              {/* Row 4: Created & Actor */}
              <View style={[styles.detailGridRow, { marginTop: adminSpacing.lg }]}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>{selectedRecord.created}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Actor</Text>
                  <Text style={styles.detailValue}>{selectedRecord.actor}</Text>
                </View>
              </View>
            </View>

            {/* Button: Back to History */}
            <TouchableOpacity
              style={styles.backToHistoryBtn}
              onPress={() => setSelectedRecord(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.backToHistoryBtnText}>Back to History</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ─── Normal View with Search & Price History Cards (Screenshot 2) ─── */
          <>
            {/* Search Bar */}
            <View style={styles.searchBar}>
              <SearchIcon size={18} color={THEME.labelMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Crop, product, category"
                placeholderTextColor={THEME.labelMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Price History Cards (Clicking opens Detail View Image 1) */}
            {filteredHistory.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.priceCard}
                onPress={() => setSelectedRecord(item)}
                activeOpacity={0.85}
              >
                {/* Header Row */}
                <View style={styles.priceCardHeader}>
                  <Text style={styles.priceCropTitle}>{item.cropGrade}</Text>
                  <View style={styles.datePill}>
                    <Text style={styles.datePillText}>{item.datePill}</Text>
                  </View>
                </View>

                {/* 3 Columns Row */}
                <View style={styles.priceColsRow}>
                  <View style={styles.priceCol}>
                    <Text style={styles.colLabel}>Previous</Text>
                    <Text style={styles.colValue}>{item.previousPrice.replace('/kg', '')}</Text>
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={styles.colLabel}>New</Text>
                    <Text style={styles.colValue}>{item.newPrice.replace('/kg', '')}</Text>
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={styles.colLabel}>Frequency</Text>
                    <Text style={styles.colValue}>{item.frequency}</Text>
                  </View>
                </View>

                {/* Subline Row */}
                <View style={styles.effectiveRow}>
                  <Text style={styles.effectiveLabel}>Effective</Text>
                  <Text style={styles.effectiveValue}>{item.datePill}</Text>
                </View>
              </TouchableOpacity>
            ))}

          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  // Header
  header: {
    backgroundColor: THEME.headerBg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.white,
    letterSpacing: -0.3,
  },
  filterIconCircle: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },

  // Scroll Body
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },

  // Search Bar (Screenshot 2)
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.ink,
    paddingVertical: 0,
  },

  // Price History Card (Screenshot 2)
  priceCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  priceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceCropTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.ink,
  },
  datePill: {
    backgroundColor: '#F3ECE4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.sm,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.labelMuted,
  },

  // 3 Columns Row
  priceColsRow: {
    flexDirection: 'row',
    marginTop: adminSpacing.md,
    gap: adminSpacing.md,
  },
  priceCol: {
    flex: 1,
  },
  colLabel: {
    fontSize: 12,
    color: THEME.labelMuted,
    fontWeight: '500',
  },
  colValue: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.ink,
    marginTop: 4,
  },

  // Effective Row
  effectiveRow: {
    marginTop: adminSpacing.md,
  },
  effectiveLabel: {
    fontSize: 12,
    color: THEME.labelMuted,
    fontWeight: '500',
  },
  effectiveValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.ink,
    marginTop: 2,
  },

  // Info Notice Card (Screenshot 2 Bottom)
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: 4,
    gap: adminSpacing.sm,
  },
  infoBannerText: {
    flex: 1,
    ...adminType.rowMeta,
    fontSize: 12,
    color: THEME.titleRustDark,
    lineHeight: 18,
  },

  // Filters Panel (Screenshot 3 Left)
  filtersContainer: {
    paddingTop: adminSpacing.xs,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  filtersHeading: {
    ...adminType.title,
    fontSize: 16,
    color: THEME.ink,
  },
  filterGroupLabel: {
    ...adminType.caption,
    fontSize: 13,
    color: THEME.ink,
    marginBottom: adminSpacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  chip: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: THEME.headerBg,
    borderColor: THEME.headerBg,
  },
  chipText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '600',
    color: THEME.ink,
  },
  chipTextActive: {
    color: THEME.white,
    fontWeight: '700',
  },

  // Apply & Clear Buttons
  filterButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.xl,
  },
  applyBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: THEME.orangeBtn,
  },
  clearBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.canvas,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    ...adminType.caption,
    fontSize: 14,
    color: THEME.labelMuted,
  },

  // Price History Detail Screen (Image 1 Request)
  detailCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  detailGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: THEME.labelMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.ink,
    marginTop: 4,
  },
  backToHistoryBtn: {
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    backgroundColor: '#FFF8F5',
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToHistoryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.titleRustDark,
  },
});
