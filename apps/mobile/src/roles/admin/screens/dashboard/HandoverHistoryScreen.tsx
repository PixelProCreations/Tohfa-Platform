import React, { useMemo, useState } from 'react';
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
import { HandoverConfirmationScreen } from './HandoverConfirmationScreen';
import { HandoverDetailsScreen } from './HandoverDetailsScreen';

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

function SearchIcon({ size = 18, color = adminColors.placeholder }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="8" x2="8" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="20" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="10" cy="8" r="2.5" stroke={color} strokeWidth="2" fill={adminColors.card} />

      <Line x1="4" y1="16" x2="14" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="18" y1="16" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="16" cy="16" r="2.5" stroke={color} strokeWidth="2" fill={adminColors.card} />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Types & Mock Data ───────────────────────────────────────────────────────

export interface HandoverRecord {
  id: string;
  type: 'Handover' | 'Collection';
  date: string;
  subtitle: string;
  cropQty: string;
  destination: string;
  status?: 'Completed' | 'In Transit' | 'Pending';
  subReference?: string;
}

const INITIAL_RECORDS: HandoverRecord[] = [
  {
    id: 'HO-2026-0002',
    type: 'Handover',
    date: '6 Oct 2026',
    subtitle: '6 Oct 2026 · 1 collection',
    cropQty: 'Carrot · 30 KG',
    destination: 'Destination: Main Warehouse',
    status: 'Completed',
  },
  {
    id: 'COL-0006',
    type: 'Collection',
    date: '5 Oct 2026',
    subtitle: '5 Oct 2026 · Selvi · FR-00242',
    cropQty: 'Carrot · 30 KG',
    destination: 'Destination: Main Warehouse',
    subReference: 'In HO-2026-0002',
  },
  {
    id: 'HO-2026-0001',
    type: 'Handover',
    date: '2 Oct 2026',
    subtitle: '2 Oct 2026 · 2 collections',
    cropQty: 'Potato · 50 KG',
    destination: 'Destination: Main Warehouse',
    status: 'Completed',
  },
  {
    id: 'COL-0005',
    type: 'Collection',
    date: '1 Oct 2026',
    subtitle: '1 Oct 2026 · Mani · FR-00219',
    cropQty: 'Potato · 25 KG',
    destination: 'Destination: Main Warehouse',
    subReference: 'In HO-2026-0001',
  },
];

export interface HandoverHistoryScreenProps {
  onBack: () => void;
  onNavigateToHandover?: (handoverId: string) => void;
}

export function HandoverHistoryScreen({
  onBack,
  onNavigateToHandover,
}: HandoverHistoryScreenProps) {
  // Navigation to Handover Confirmation & Details
  const [selectedHandoverId, setSelectedHandoverId] = useState<string | null>(null);
  const [selectedHandoverDetailsId, setSelectedHandoverDetailsId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHandoverFilter, setActiveHandoverFilter] = useState<string | null>('HO-2026-0002');
  const [isFilterPageOpen, setIsFilterPageOpen] = useState(false);

  // Popup Modal Filters State
  const [modalTypeFilter, setModalTypeFilter] = useState<'All' | 'Handover' | 'Collection'>('All');
  const [modalStatusFilter, setModalStatusFilter] = useState<'All' | 'Completed' | 'In Transit' | 'Pending'>('All');
  const [modalDestinationFilter, setModalDestinationFilter] = useState<'All' | 'Main Warehouse' | 'Sub-Warehouse'>('All');
  const [modalHandoverId, setModalHandoverId] = useState<string | null>('HO-2026-0002');

  // Applied Filters State (mirrors modal upon apply)
  const [appliedTypeFilter, setAppliedTypeFilter] = useState<'All' | 'Handover' | 'Collection'>('All');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<'All' | 'Completed' | 'In Transit' | 'Pending'>('All');
  const [appliedDestinationFilter, setAppliedDestinationFilter] = useState<'All' | 'Main Warehouse' | 'Sub-Warehouse'>('All');

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return INITIAL_RECORDS.filter((rec) => {
      // 1. Specific Handover filter chip
      if (activeHandoverFilter) {
        const matchesHandover =
          rec.id === activeHandoverFilter ||
          (rec.subReference && rec.subReference.includes(activeHandoverFilter));
        if (!matchesHandover) return false;
      }

      // 2. Type filter
      if (appliedTypeFilter !== 'All' && rec.type !== appliedTypeFilter) {
        return false;
      }

      // 3. Status filter
      if (appliedStatusFilter !== 'All') {
        if (rec.status !== appliedStatusFilter) return false;
      }

      // 4. Destination filter
      if (appliedDestinationFilter !== 'All') {
        if (!rec.destination.toLowerCase().includes(appliedDestinationFilter.toLowerCase())) {
          return false;
        }
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = rec.id.toLowerCase().includes(q);
        const matchesSubtitle = rec.subtitle.toLowerCase().includes(q);
        const matchesCrop = rec.cropQty.toLowerCase().includes(q);
        const matchesSubRef = rec.subReference?.toLowerCase().includes(q);
        return matchesId || matchesSubtitle || matchesCrop || matchesSubRef;
      }

      return true;
    });
  }, [
    activeHandoverFilter,
    appliedTypeFilter,
    appliedStatusFilter,
    appliedDestinationFilter,
    searchQuery,
  ]);

  const hasActiveFilters =
    Boolean(activeHandoverFilter) ||
    appliedTypeFilter !== 'All' ||
    appliedStatusFilter !== 'All' ||
    appliedDestinationFilter !== 'All';

  const clearAllFilters = () => {
    setActiveHandoverFilter(null);
    setAppliedTypeFilter('All');
    setAppliedStatusFilter('All');
    setAppliedDestinationFilter('All');
    setModalHandoverId(null);
    setModalTypeFilter('All');
    setModalStatusFilter('All');
    setModalDestinationFilter('All');
  };

  const applyModalFilters = () => {
    setActiveHandoverFilter(modalHandoverId);
    setAppliedTypeFilter(modalTypeFilter);
    setAppliedStatusFilter(modalStatusFilter);
    setAppliedDestinationFilter(modalDestinationFilter);
    setIsFilterPageOpen(false);
  };

  const resetModalFilters = () => {
    setModalHandoverId(null);
    setModalTypeFilter('All');
    setModalStatusFilter('All');
    setModalDestinationFilter('All');
  };

  // If viewing Filter Page
  if (isFilterPageOpen) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* ─── Header ─── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setIsFilterPageOpen(false)}
              activeOpacity={0.7}
              accessibilityLabel={t('handoverHistory.backLabel')}
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('handoverHistory.filterPage.title')}</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {t('handoverHistory.filterPage.subtitle')}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.filterPagePad}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.filterPageCard}>
            {/* Filter Section: Handover Batch */}
            <Text style={[styles.modalSectionLabel, { marginTop: 0 }]}>
              {t('handoverHistory.filterPage.handoverBatch')}
            </Text>
            <View style={styles.filterChipGroup}>
              {['HO-2026-0002', 'HO-2026-0001'].map((hId) => {
                const isSelected = modalHandoverId === hId;
                return (
                  <TouchableOpacity
                    key={hId}
                    style={[
                      styles.modalChip,
                      isSelected && styles.modalChipSelected,
                    ]}
                    onPress={() => setModalHandoverId(isSelected ? null : hId)}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        isSelected && styles.modalChipTextSelected,
                      ]}
                    >
                      {hId}
                    </Text>
                    {isSelected && <CheckmarkIcon size={14} color={adminColors.brand} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filter Section: Record Type */}
            <Text style={styles.modalSectionLabel}>{t('handoverHistory.filterPage.recordType')}</Text>
            <View style={styles.filterChipGroup}>
              {(['All', 'Handover', 'Collection'] as const).map((type) => {
                const isSelected = modalTypeFilter === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.modalChip,
                      isSelected && styles.modalChipSelected,
                    ]}
                    onPress={() => setModalTypeFilter(type)}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        isSelected && styles.modalChipTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                    {isSelected && <CheckmarkIcon size={14} color={adminColors.brand} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filter Section: Status */}
            <Text style={styles.modalSectionLabel}>{t('handoverHistory.filterPage.status')}</Text>
            <View style={styles.filterChipGroup}>
              {(['All', 'Completed', 'In Transit', 'Pending'] as const).map((st) => {
                const isSelected = modalStatusFilter === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.modalChip,
                      isSelected && styles.modalChipSelected,
                    ]}
                    onPress={() => setModalStatusFilter(st)}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        isSelected && styles.modalChipTextSelected,
                      ]}
                    >
                      {st}
                    </Text>
                    {isSelected && <CheckmarkIcon size={14} color={adminColors.brand} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filter Section: Destination */}
            <Text style={styles.modalSectionLabel}>{t('handoverHistory.filterPage.destination')}</Text>
            <View style={styles.filterChipGroup}>
              {(['All', 'Main Warehouse', 'Sub-Warehouse'] as const).map((dest) => {
                const isSelected = modalDestinationFilter === dest;
                return (
                  <TouchableOpacity
                    key={dest}
                    style={[
                      styles.modalChip,
                      isSelected && styles.modalChipSelected,
                    ]}
                    onPress={() => setModalDestinationFilter(dest)}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        isSelected && styles.modalChipTextSelected,
                      ]}
                    >
                      {dest}
                    </Text>
                    {isSelected && <CheckmarkIcon size={14} color={adminColors.brand} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Action Buttons: Reset & Apply Filters */}
          <View style={styles.filterPageActionRow}>
            <TouchableOpacity
              style={styles.filterPageResetBtn}
              onPress={resetModalFilters}
              activeOpacity={0.8}
            >
              <Text style={styles.filterPageResetText}>{t('handoverHistory.filterPage.reset')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterPageApplyBtn}
              onPress={applyModalFilters}
              activeOpacity={0.85}
            >
              <Text style={styles.filterPageApplyText}>{t('handoverHistory.filterPage.apply')}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: adminSpacing.xl }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // If viewing details page for Handover, render HandoverDetailsScreen
  if (selectedHandoverDetailsId) {
    return (
      <HandoverDetailsScreen
        handoverId={selectedHandoverDetailsId}
        status="Completed"
        onBack={() => setSelectedHandoverDetailsId(null)}
        onViewHistory={() => {
          setSelectedHandoverDetailsId(null);
          setSelectedHandoverId(null);
        }}
      />
    );
  }

  // If viewing details for HO-2026-0002, render HandoverConfirmationScreen
  if (selectedHandoverId) {
    return (
      <HandoverConfirmationScreen
        handoverId={selectedHandoverId}
        status="Completed"
        onBack={() => setSelectedHandoverId(null)}
        onViewHistory={() => setSelectedHandoverId(null)}
        onViewHandoverDetails={() => {
          setSelectedHandoverDetailsId(selectedHandoverId);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel={t('handoverHistory.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('handoverHistory.title')}</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {t('handoverHistory.subtitle')}
        </Text>
      </View>

      {/* ─── Scroll Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Input Box */}
        <View style={styles.searchBox}>
          <SearchIcon size={19} color={adminColors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('handoverHistory.searchPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Filters Button */}
        <TouchableOpacity
          style={styles.filtersBtn}
          onPress={() => {
            // Sync modal state with current applied filters
            setModalHandoverId(activeHandoverFilter);
            setModalTypeFilter(appliedTypeFilter);
            setModalStatusFilter(appliedStatusFilter);
            setModalDestinationFilter(appliedDestinationFilter);
            setIsFilterPageOpen(true);
          }}
          activeOpacity={0.8}
        >
          <FilterSlidersIcon size={18} color={adminColors.brandDeep} />
          <Text style={styles.filtersBtnText}>{t('handoverHistory.filters')}</Text>
        </TouchableOpacity>

        {/* Active Filter Chips Row */}
        {hasActiveFilters && (
          <View style={styles.chipsRow}>
            {activeHandoverFilter && (
              <View style={styles.filterChipActive}>
                <Text style={styles.filterChipActiveText}>
                  Handover: {activeHandoverFilter}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setActiveHandoverFilter(null);
                    setModalHandoverId(null);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ marginLeft: adminSpacing.xs }}
                >
                  <CloseIcon size={14} color={adminColors.brandDeep} />
                </TouchableOpacity>
              </View>
            )}

            {appliedTypeFilter !== 'All' && (
              <View style={styles.filterChipActive}>
                <Text style={styles.filterChipActiveText}>
                  Type: {appliedTypeFilter}
                </Text>
                <TouchableOpacity
                  onPress={() => setAppliedTypeFilter('All')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ marginLeft: adminSpacing.xs }}
                >
                  <CloseIcon size={14} color={adminColors.brandDeep} />
                </TouchableOpacity>
              </View>
            )}

            {appliedStatusFilter !== 'All' && (
              <View style={styles.filterChipActive}>
                <Text style={styles.filterChipActiveText}>
                  Status: {appliedStatusFilter}
                </Text>
                <TouchableOpacity
                  onPress={() => setAppliedStatusFilter('All')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ marginLeft: adminSpacing.xs }}
                >
                  <CloseIcon size={14} color={adminColors.brandDeep} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.clearAllChip}
              onPress={clearAllFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.clearAllChipText}>{t('handoverHistory.clearAll')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Record Count */}
        <Text style={styles.recordsCount}>
          {filteredRecords.length === 1
            ? t('handoverHistory.recordsCountSingle', { count: filteredRecords.length })
            : t('handoverHistory.recordsCount', { count: filteredRecords.length })}
        </Text>

        {/* ─── Record Cards ─── */}
        {filteredRecords.map((item) => (
          <View key={item.id} style={styles.recordCard}>
            {/* Card Header Title */}
            <Text style={styles.recordTitle}>
              {item.id} · {item.type}
            </Text>

            {/* Subtitle Details */}
            <Text style={styles.recordMeta}>{item.subtitle}</Text>
            <Text style={styles.recordMeta}>{item.cropQty}</Text>
            <Text style={styles.recordMeta}>{item.destination}</Text>

            {/* Optional Status Pill (e.g. Completed) */}
            {item.status && (
              <View style={styles.statusBadgeCompleted}>
                <Text style={styles.statusBadgeCompletedText}>{item.status}</Text>
              </View>
            )}

            {/* Optional Sub-Reference (e.g. In HO-2026-0002) */}
            {item.subReference && (
              <Text style={styles.subReferenceText}>{item.subReference}</Text>
            )}

            {/* View Details Action Link */}
            <TouchableOpacity
              style={styles.viewDetailsWrap}
              onPress={() => {
                if (item.type === 'Collection') {
                  setSelectedHandoverDetailsId('HO-2026-0002');
                } else if (onNavigateToHandover) {
                  onNavigateToHandover(item.id);
                } else {
                  setSelectedHandoverId(item.id.startsWith('HO') ? item.id : 'HO-2026-0002');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.viewDetailsText}>{t('handoverHistory.viewDetails')}</Text>
            </TouchableOpacity>
          </View>
        ))}

        {filteredRecords.length === 0 && (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateTitle}>{t('handoverHistory.emptyTitle')}</Text>
            <Text style={styles.emptyStateSub}>
              {t('handoverHistory.emptySub')}
            </Text>
            <TouchableOpacity
              style={styles.emptyClearBtn}
              onPress={clearAllFilters}
            >
              <Text style={styles.emptyClearBtnText}>{t('handoverHistory.resetFilters')}</Text>
            </TouchableOpacity>
          </View>
        )}

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
  headerRow: {
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
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: adminSpacing.xs,
    paddingLeft: 42,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },

  // Search input
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },

  // Filters Button
  filtersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    marginTop: adminSpacing.md,
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  filtersBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },

  // Active filter chips
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  filterChipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingVertical: adminSpacing.xs,
    paddingHorizontal: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.brand,
  },
  filterChipActiveText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  clearAllChip: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    paddingVertical: adminSpacing.xs,
    paddingHorizontal: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  clearAllChipText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
  },

  // Count text
  recordsCount: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },

  // Record Card
  recordCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  recordTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 6,
  },
  recordMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 3,
  },
  statusBadgeCompleted: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  statusBadgeCompletedText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.success.text,
  },
  subReferenceText: {
    ...adminType.rowMeta,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 4,
    marginBottom: 4,
  },
  viewDetailsWrap: {
    marginTop: 6,
  },
  viewDetailsText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },

  // Empty state
  emptyStateBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.xl,
    alignItems: 'center',
    marginTop: adminSpacing.lg,
    ...adminShadow.sm,
  },
  emptyStateTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  emptyStateSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyClearBtn: {
    marginTop: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.brandTint,
  },
  emptyClearBtnText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // ─── Filter Page Styles ───
  filterPagePad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  filterPageCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: adminSpacing.lg,
  },
  filterPageActionRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  modalSectionLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  filterChipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  modalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.full,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: 6,
  },
  modalChipSelected: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  modalChipText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  modalChipTextSelected: {
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
  filterPageResetBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    backgroundColor: adminColors.card,
  },
  filterPageResetText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  filterPageApplyBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
  },
  filterPageApplyText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
});
