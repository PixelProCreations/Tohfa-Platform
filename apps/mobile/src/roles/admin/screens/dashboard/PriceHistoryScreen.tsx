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
import { t } from '../../i18n';

// ─── Icons ───────────────────────────────────────────────────────────────────

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

function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="12" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="18" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
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

function CircleInfoIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
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
    previousPrice: '₹95.00',
    newPrice: '₹100.00',
    frequency: 'Weekly',
    effectiveDate: '30 Sep',
    created: '30 Sep 2026, 6:00 AM',
    actor: 'System (SA-configured)',
  },
  {
    id: 'ph-2',
    crop: 'Carrot',
    grade: 'Grade 1',
    cropGrade: 'Carrot · G1',
    datePill: '23 Sep',
    previousPrice: '₹90.00',
    newPrice: '₹95.00',
    frequency: 'Weekly',
    effectiveDate: '29 Sep',
    created: '23 Sep 2026, 6:00 AM',
    actor: 'System (SA-configured)',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface PriceHistoryScreenProps {
  onBack: () => void;
  itemName?: string | undefined;
  category?: string | undefined;
  currentPrice?: number | undefined;
}

export function PriceHistoryScreen({ onBack, itemName, category, currentPrice }: PriceHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PriceHistoryRecord | null>(null);

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
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleHeaderBack}
              activeOpacity={0.7}
              accessibilityLabel={t('priceHistory.backLabel')}
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('priceHistory.title')}</Text>
          </View>

          <TouchableOpacity
            style={[styles.filterIconCircle, showFilters && styles.filterIconCircleActive]}
            onPress={() => {
              if (!showFilters && selectedRecord) {
                setSelectedRecord(null);
              }
              setShowFilters(!showFilters);
            }}
            activeOpacity={0.8}
            accessibilityLabel={t('priceHistory.filters.title')}
          >
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* VIEW 1: Filter Panel */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersHeading}>{t('priceHistory.filters.title')}</Text>

            <Text style={styles.filterGroupLabel}>{t('priceHistory.filters.crop')}</Text>
            <View style={styles.chipsRow}>
              {(['All', 'Carrot', 'Cabbage'] as const).map((crop) => {
                const isActive = selectedCrop === crop;
                return (
                  <TouchableOpacity
                    key={crop}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedCrop(crop)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {crop}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.filterGroupLabel, styles.filterGroupSpacing]}>
              {t('priceHistory.filters.dateRange')}
            </Text>
            <View style={styles.chipsRow}>
              {(['Today', 'Last 7 Days', 'Custom'] as const).map((dr) => {
                const isActive = selectedDateRange === dr;
                return (
                  <TouchableOpacity
                    key={dr}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedDateRange(dr)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {dr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.filterButtonsRow}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilters(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>{t('priceHistory.filters.apply')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setSelectedCrop('All');
                  setSelectedDateRange('Today');
                  setSearchQuery('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.clearBtnText}>{t('priceHistory.filters.clearAll')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* VIEW 2: Detail View */}
        {!showFilters && selectedRecord && (
          <View>
            <Text style={styles.sectionHeading}>{t('priceHistory.section.detail')}</Text>

            <View style={styles.detailCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cropTitleText}>{selectedRecord.cropGrade}</Text>
                <View style={styles.datePill}>
                  <Text style={styles.datePillText}>{selectedRecord.datePill}</Text>
                </View>
              </View>

              <View style={styles.detailGridRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('priceHistory.label.previousPrice')}</Text>
                  <Text style={styles.detailValue}>{selectedRecord.previousPrice}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('priceHistory.label.newPrice')}</Text>
                  <Text style={styles.detailValue}>{selectedRecord.newPrice}</Text>
                </View>
              </View>

              <View style={[styles.detailGridRow, styles.gridRowSpacing]}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('priceHistory.label.frequency')}</Text>
                  <Text style={styles.detailValue}>{selectedRecord.frequency}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('priceHistory.label.effectiveDate')}</Text>
                  <Text style={styles.detailValue}>{selectedRecord.effectiveDate}</Text>
                </View>
              </View>

              <View style={styles.gridRowSpacing}>
                <Text style={styles.detailLabel}>{t('priceHistory.label.created')}</Text>
                <Text style={styles.detailValue}>{selectedRecord.created}</Text>
              </View>

              <View style={styles.gridRowSpacing}>
                <Text style={styles.detailLabel}>{t('priceHistory.label.actor')}</Text>
                <Text style={styles.detailValue}>{selectedRecord.actor}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.backToHistoryBtn}
              onPress={() => setSelectedRecord(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.backToHistoryBtnText}>{t('priceHistory.action.backToHistory')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* VIEW 3: List View */}
        {!showFilters && !selectedRecord && (
          <View>
            {/* Search Bar on Canvas */}
            <View style={styles.searchBar}>
              <SearchIcon size={18} color={adminColors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Crop, product, category"
                placeholderTextColor={adminColors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {filteredHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('priceHistory.empty')}</Text>
              </View>
            ) : (
              filteredHistory.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyCard}
                  onPress={() => setSelectedRecord(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cropTitleText}>{item.cropGrade}</Text>
                    <View style={styles.datePill}>
                      <Text style={styles.datePillText}>{item.datePill}</Text>
                    </View>
                  </View>

                  <View style={styles.historyColsRow}>
                    <View style={styles.historyCol}>
                      <Text style={styles.colLabel}>Previous</Text>
                      <Text style={styles.colValue}>{item.previousPrice}</Text>
                    </View>
                    <View style={styles.historyCol}>
                      <Text style={styles.colLabel}>New</Text>
                      <Text style={styles.colValue}>{item.newPrice}</Text>
                    </View>
                    <View style={styles.historyCol}>
                      <Text style={styles.colLabel}>Frequency</Text>
                      <Text style={styles.colValue}>{item.frequency}</Text>
                    </View>
                  </View>

                  <View style={styles.effectiveRow}>
                    <Text style={styles.effectiveLabel}>Effective</Text>
                    <Text style={styles.effectiveValue}>{item.effectiveDate}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Info Notice Banner */}
            <View style={styles.infoBanner}>
              <CircleInfoIcon size={18} color={adminColors.brandDeep} />
              <Text style={styles.infoBannerText}>
                Money values are displayed exactly as returned by the API — never recalculated with frontend floating-point arithmetic. Newest changes shown first.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

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
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  filterIconCircle: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconCircleActive: {
    backgroundColor: adminColors.brandDeep,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
    padding: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  historyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  cropTitleText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '800',
  },
  datePill: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  datePillText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.ink,
  },
  historyColsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyCol: {
    flex: 1,
  },
  colLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  colValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  effectiveRow: {
    marginTop: adminSpacing.md,
  },
  effectiveLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  effectiveValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.brandSoft.bg,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginTop: adminSpacing.xs,
    gap: adminSpacing.sm,
  },
  infoBannerText: {
    flex: 1,
    ...adminType.caption,
    color: adminColors.ink,
    lineHeight: 18,
    opacity: 0.85,
  },
  filtersContainer: {
    paddingTop: adminSpacing.xs,
  },
  filtersHeading: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  filterGroupLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  filterGroupSpacing: {
    marginTop: adminSpacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  chip: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
  },
  chipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  chipText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  chipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  filterButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.xl,
  },
  applyBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  clearBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
  },
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  detailGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridRowSpacing: {
    marginTop: adminSpacing.md,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  detailValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  backToHistoryBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToHistoryBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  bottomSpacer: {
    height: 40,
  },
});
