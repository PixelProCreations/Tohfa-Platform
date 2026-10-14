import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { adminColors } from '../../theme';
import { HandoverConfirmationScreen } from './HandoverConfirmationScreen';
import { HandoverDetailsScreen } from './HandoverDetailsScreen';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas, // #F3EFE9 — App canvas soft cream
  card: adminColors.card, // #FFFFFF — Card surface
  border: adminColors.border, // #EEDCD3 — Border stroke
  borderLight: '#F3ECE4',

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink, // Dark ink for titles
  muted: adminColors.muted, // Secondary gray
  labelDark: '#374151',

  // Actions & Highlights
  orangeBtn: adminColors.brand,
  orangeTint: adminColors.brandTint,
  orangeText: adminColors.brandDeep,

  // Status Badges
  completedBg: '#DCFCE7',
  completedText: '#15803D',
  inTransitBg: '#E0F2FE',
  inTransitText: '#0369A1',
  pendingBg: '#FEF3C7',
  pendingText: '#B45309',
};

// ─── SVG Icons Matching Exact Design Mockup ──────────────────────────────────

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

function SearchIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Filter Dual Sliders Icon matching screenshot:
 * 2 horizontal slider tracks with vertical knobs
 */
function FilterSlidersIcon({ size = 18, color = '#7A2E14' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top track: knob on left */}
      <Line x1="4" y1="8" x2="8" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="20" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="10" cy="8" r="2.5" stroke={color} strokeWidth="2" fill={THEME.white} />

      {/* Bottom track: knob on right */}
      <Line x1="4" y1="16" x2="14" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="18" y1="16" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="16" cy="16" r="2.5" stroke={color} strokeWidth="2" fill={THEME.white} />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = '#4B5563' }: { size?: number; color?: string }) {
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
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* ─── Terracotta Header ─── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setIsFilterPageOpen(false)}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filter Records</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Refine by batch, record type, status, or destination
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.filterPagePad}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.filterPageCard}>
            {/* Filter Section: Handover Batch */}
            <Text style={[styles.modalSectionLabel, { marginTop: 0 }]}>HANDOVER BATCH</Text>
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
            <Text style={styles.modalSectionLabel}>RECORD TYPE</Text>
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
            <Text style={styles.modalSectionLabel}>STATUS</Text>
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
            <Text style={styles.modalSectionLabel}>DESTINATION</Text>
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
              <Text style={styles.filterPageResetText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterPageApplyBtn}
              onPress={applyModalFilters}
              activeOpacity={0.85}
            >
              <Text style={styles.filterPageApplyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Terracotta Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Handover History</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Review completed and previous actives.
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
          <SearchIcon size={19} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search collection, handover, purchase, farmer ID"
            placeholderTextColor="#9CA3AF"
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
          <FilterSlidersIcon size={18} color="#7A2E14" />
          <Text style={styles.filtersBtnText}>Filters</Text>
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
                  style={{ marginLeft: 6 }}
                >
                  <CloseIcon size={14} color="#7A2E14" />
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
                  style={{ marginLeft: 6 }}
                >
                  <CloseIcon size={14} color="#7A2E14" />
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
                  style={{ marginLeft: 6 }}
                >
                  <CloseIcon size={14} color="#7A2E14" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.clearAllChip}
              onPress={clearAllFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.clearAllChipText}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Record Count */}
        <Text style={styles.recordsCount}>
          {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}
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
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
          </View>
        ))}

        {filteredRecords.length === 0 && (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateTitle}>No matching records found</Text>
            <Text style={styles.emptyStateSub}>
              Try clearing filters or adjusting your search term.
            </Text>
            <TouchableOpacity
              style={styles.emptyClearBtn}
              onPress={clearAllFilters}
            >
              <Text style={styles.emptyClearBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet Matching Exact UI Mockup ──────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
    paddingLeft: 42,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Search input
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.ink,
    padding: 0,
  },

  // Filters Button
  filtersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  filtersBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },

  // Active filter chips
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  filterChipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE8DC',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F6C7B2',
  },
  filterChipActiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.titleRustDark,
  },
  clearAllChip: {
    backgroundColor: '#F3ECE4',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5D8CC',
  },
  clearAllChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },

  // Count text
  recordsCount: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 12,
    marginBottom: 8,
  },

  // Record Card
  recordCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 12,
  },
  recordTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 6,
  },
  recordMeta: {
    fontSize: 12,
    fontWeight: '400',
    color: THEME.muted,
    marginBottom: 3,
  },
  statusBadgeCompleted: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.completedBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  statusBadgeCompletedText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: THEME.completedText,
  },
  subReferenceText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: THEME.ink,
    marginTop: 4,
    marginBottom: 4,
  },
  viewDetailsWrap: {
    marginTop: 6,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },

  // Empty state
  emptyStateBox: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.ink,
  },
  emptyStateSub: {
    fontSize: 12,
    color: THEME.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyClearBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEE8DC',
  },
  emptyClearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.titleRustDark,
  },

  // ─── Filter Page Styles ───
  filterPagePad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  filterPageCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  filterPageActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalSectionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 10,
  },
  filterChipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F4EF',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E8DFD5',
    gap: 6,
  },
  modalChipSelected: {
    backgroundColor: '#FEE8DC',
    borderColor: adminColors.brand,
  },
  modalChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  modalChipTextSelected: {
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
  filterPageResetBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: THEME.white,
  },
  filterPageResetText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.muted,
  },
  filterPageApplyBtn: {
    flex: 1,
    backgroundColor: THEME.orangeBtn,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  filterPageApplyText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.white,
  },
});
