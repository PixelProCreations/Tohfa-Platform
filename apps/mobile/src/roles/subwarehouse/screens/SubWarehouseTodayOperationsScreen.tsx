import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primarySoft: '#FEF1EC',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  greenBadgeBg: '#E8F5E9',
  greenBadgeText: '#0D9488',
  amberBadgeBg: '#FEF3C7',
  amberBadgeText: '#D97706',
  redBadgeBg: '#FEE2E2',
  redBadgeText: '#DC2626',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

// Exact horizontal slider icon matching reference image mockup (-|-, |--, --|)
function FilterSlidersIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 3 horizontal slider tracks */}
      <Path
        d="M3 6h18M3 12h18M3 18h18"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Vertical slider adjustment ticks */}
      <Path
        d="M16 3.5v5M8 9.5v5M15 15.5v5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 14, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="11" width="16" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface ActivityItem {
  id: string;
  activityId?: string;
  title: string;
  category: string;
  subtitle: string;
  time: string;
  status: 'Completed' | 'Pending' | 'Open';
  moduleType: 'receiving' | 'material_handling' | 'storage' | 'verification' | 'operational_issue';
  action?: string;
  reference?: string;
  notes?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

export interface SubWarehouseTodayOperationsScreenProps {
  onBack: () => void;
  onTabChange?: (tab: SubWHTab) => void;
  onNavigateToReceiving?: () => void;
  onNavigateToMaterialHandling?: () => void;
  onNavigateToStorage?: () => void;
  onNavigateToStockVerification?: () => void;
  onNavigateToOperationalIssues?: () => void;
  onSelectActivity?: (activity: ActivityItem) => void;
}

const ALL_TODAY_ACTIVITIES: ActivityItem[] = [
  {
    id: 'a1',
    activityId: 'ACT-004820',
    title: 'Goods Receiving',
    category: 'Receiving',
    subtitle: 'GRN-00291 · Tomato · Grade 1 · 140 KG',
    time: '10:42 AM',
    status: 'Completed',
    moduleType: 'receiving',
    timeOfDay: 'morning',
    action: 'GRN-00291 received and verified · Tomato Grade 1 · 140 KG',
    reference: 'Related GRN GRN-00291',
    notes: 'Received in good condition from Main Warehouse (Ooty Hub).',
  },
  {
    id: 'a2',
    activityId: 'ACT-004821',
    title: 'Material Handling',
    category: 'Material Handling',
    subtitle: 'Packaging Box · Issued 20 units',
    time: '09:50 AM',
    status: 'Completed',
    moduleType: 'material_handling',
    timeOfDay: 'morning',
    action: 'Packaging boxes issued for order fulfillment · 20 units',
    reference: 'Related Order ORD-1018',
    notes: 'Issued to packing station 1.',
  },
  {
    id: 'a3',
    activityId: 'ACT-004822',
    title: 'Storage Activity',
    category: 'Storage',
    subtitle: 'Tomato moved to Cold Storage · Rack 02',
    time: '09:35 AM',
    status: 'Completed',
    moduleType: 'storage',
    timeOfDay: 'morning',
    action: 'Tomato moved to Cold Storage · Rack 02, Section A',
    reference: 'Related Batch BAT-COO-00241',
    notes: 'Relocated to make room for incoming Section B stock.',
  },
  {
    id: 'a4',
    activityId: 'ACT-004823',
    title: 'Stock Verification',
    category: 'Verification',
    subtitle: 'Tomato · Grade 1 · Variance -5 KG',
    time: '08:20 AM',
    status: 'Pending',
    moduleType: 'verification',
    timeOfDay: 'morning',
    action: 'Physical stock verification conducted · Tomato Grade 1',
    reference: 'Variance Check VER-2026-09',
    notes: 'Variance of -5 KG detected during morning cycle count.',
  },
  {
    id: 'a5',
    activityId: 'ACT-004824',
    title: 'Operational Issue',
    category: 'Issues',
    subtitle: 'Cold storage maintenance required',
    time: '08:05 AM',
    status: 'Open',
    moduleType: 'operational_issue',
    timeOfDay: 'morning',
    action: 'Cold storage maintenance required in Section A',
    reference: 'Issue Ticket ISS-0028',
    notes: 'Cooling unit running above target temperature.',
  },
  {
    id: 'a6',
    activityId: 'ACT-004825',
    title: 'Goods Receiving',
    category: 'Receiving',
    subtitle: 'GRN-00290 · Potato · Grade 2 · 220 KG',
    time: '07:45 AM',
    status: 'Completed',
    moduleType: 'receiving',
    timeOfDay: 'morning',
    action: 'GRN-00290 received and stored in ambient dock area',
    reference: 'Related GRN GRN-00290',
    notes: 'Direct grower shipment accepted.',
  },
  {
    id: 'a7',
    activityId: 'ACT-004826',
    title: 'Storage Activity',
    category: 'Storage',
    subtitle: 'Potato placed in Ambient Rack 03',
    time: '07:55 AM',
    status: 'Completed',
    moduleType: 'storage',
    timeOfDay: 'morning',
    action: 'Potato allocated to Rack 03 Shelf 01',
    reference: 'Batch BAT-COO-00238',
    notes: 'Pallet position confirmed.',
  },
  {
    id: 'a8',
    activityId: 'ACT-004827',
    title: 'Stock Verification',
    category: 'Verification',
    subtitle: 'Carrot · Grade 1 · Count 80 KG (0 Variance)',
    time: '07:15 AM',
    status: 'Completed',
    moduleType: 'verification',
    timeOfDay: 'morning',
    action: 'Cycle count verified · Carrot Grade 1 in Rack 02 Shelf 03',
    reference: 'Verification Log VER-2026-08',
    notes: '100% matched with physical weigh scale.',
  },
];

const HORIZONTAL_PILLS = ['All', 'Receiving', 'Storage', 'Verification', 'Material Handling', 'Issues'];

interface FilterState {
  module: string;
  status: string;
  timeOfDay: string;
  sortOrder: 'newest' | 'oldest';
}

const DEFAULT_FILTERS: FilterState = {
  module: 'All',
  status: 'All',
  timeOfDay: 'All',
  sortOrder: 'newest',
};

export function SubWarehouseTodayOperationsScreen({
  onBack,
  onTabChange,
  onNavigateToReceiving,
  onNavigateToMaterialHandling,
  onNavigateToStorage,
  onNavigateToStockVerification,
  onNavigateToOperationalIssues,
  onSelectActivity,
}: SubWarehouseTodayOperationsScreenProps) {
  const [activeQuickPill, setActiveQuickPill] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filter Modal State
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.module !== 'All' ||
      filters.status !== 'All' ||
      filters.timeOfDay !== 'All' ||
      filters.sortOrder !== 'newest'
    );
  }, [filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.module !== 'All') count++;
    if (filters.status !== 'All') count++;
    if (filters.timeOfDay !== 'All') count++;
    if (filters.sortOrder !== 'newest') count++;
    return count;
  }, [filters]);

  // Compute filtered activities based on both quick pill and modal filters
  const filteredActivities = useMemo(() => {
    let list = [...ALL_TODAY_ACTIVITIES];

    // Quick pill filter
    if (activeQuickPill !== 'All') {
      list = list.filter((item) => item.category === activeQuickPill);
    }

    // Modal filters
    if (filters.module !== 'All') {
      list = list.filter((item) => {
        if (filters.module === 'Receiving') return item.category === 'Receiving';
        if (filters.module === 'Storage') return item.category === 'Storage';
        if (filters.module === 'Verification') return item.category === 'Verification';
        if (filters.module === 'Material Handling') return item.category === 'Material Handling';
        if (filters.module === 'Issues') return item.category === 'Issues';
        return true;
      });
    }

    if (filters.status !== 'All') {
      list = list.filter((item) => item.status === filters.status);
    }

    if (filters.timeOfDay !== 'All') {
      list = list.filter((item) => item.timeOfDay === filters.timeOfDay.toLowerCase());
    }

    if (filters.sortOrder === 'oldest') {
      list.reverse();
    }

    return list;
  }, [activeQuickPill, filters]);

  // Count matching items for draft modal filter
  const draftMatchCount = useMemo(() => {
    let list = [...ALL_TODAY_ACTIVITIES];
    if (draftFilters.module !== 'All') {
      list = list.filter((item) => {
        if (draftFilters.module === 'Receiving') return item.category === 'Receiving';
        if (draftFilters.module === 'Storage') return item.category === 'Storage';
        if (draftFilters.module === 'Verification') return item.category === 'Verification';
        if (draftFilters.module === 'Material Handling') return item.category === 'Material Handling';
        if (draftFilters.module === 'Issues') return item.category === 'Issues';
        return true;
      });
    }
    if (draftFilters.status !== 'All') {
      list = list.filter((item) => item.status === draftFilters.status);
    }
    if (draftFilters.timeOfDay !== 'All') {
      list = list.filter((item) => item.timeOfDay === draftFilters.timeOfDay.toLowerCase());
    }
    return list.length;
  }, [draftFilters]);

  const handleOpenFilterModal = () => {
    setDraftFilters({ ...filters });
    setShowFilterModal(true);
  };

  const handleApplyFilters = () => {
    setFilters({ ...draftFilters });
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setActiveQuickPill('All');
  };

  const handleItemPress = (item: ActivityItem) => {
    if (onSelectActivity) {
      onSelectActivity(item);
      return;
    }
    switch (item.moduleType) {
      case 'receiving':
        if (onNavigateToReceiving) onNavigateToReceiving();
        else onTabChange?.('Receiving');
        break;
      case 'material_handling':
        if (onNavigateToMaterialHandling) onNavigateToMaterialHandling();
        break;
      case 'storage':
        if (onNavigateToStorage) onNavigateToStorage();
        break;
      case 'verification':
        if (onNavigateToStockVerification) onNavigateToStockVerification();
        else onTabChange?.('Inventory');
        break;
      case 'operational_issue':
        if (onNavigateToOperationalIssues) onNavigateToOperationalIssues();
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header matching reference image with aligned filter button ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Today's Operations</Text>
            <Text style={styles.headerSubtitle}>24 Activities · 24 Sep 2026</Text>
          </View>

          <TouchableOpacity
            style={[styles.filterHeaderBtn, hasActiveFilters && styles.filterHeaderBtnActive]}
            onPress={handleOpenFilterModal}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Filter operations"
          >
            <FilterSlidersIcon size={20} color="#FFFFFF" />
            {hasActiveFilters && (
              <View style={styles.filterBadgeIndicator}>
                <Text style={styles.filterBadgeIndicatorText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── 2x2 Metric Grid ─── */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>3</Text>
            <Text style={styles.metricLabel}>RECEIVING</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>8</Text>
            <Text style={styles.metricLabel}>STORAGE</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>2</Text>
            <Text style={styles.metricLabel}>VERIFICATION</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>3</Text>
            <Text style={styles.metricLabel}>ISSUES</Text>
          </View>
        </View>

        {/* ─── Active Filter Banner (if filter applied) ─── */}
        {hasActiveFilters && (
          <View style={styles.activeFilterBanner}>
            <Text style={styles.activeFilterBannerText}>
              Filters Active ({activeFiltersCount}): {filters.module !== 'All' ? filters.module : ''}
              {filters.status !== 'All' ? ` · ${filters.status}` : ''}
              {filters.timeOfDay !== 'All' ? ` · ${filters.timeOfDay}` : ''}
            </Text>
            <TouchableOpacity onPress={handleResetFilters} activeOpacity={0.7}>
              <Text style={styles.clearFilterText}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Horizontal Filter Pills ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {HORIZONTAL_PILLS.map((pill) => {
            const isActive = activeQuickPill === pill;
            return (
              <TouchableOpacity
                key={pill}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveQuickPill(pill)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {pill}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Activity List ─── */}
        <View style={styles.listContainer}>
          {filteredActivities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No matching operations</Text>
              <Text style={styles.emptySub}>Try adjusting your filter selection to view operations.</Text>
              <TouchableOpacity style={styles.resetFiltersBtn} onPress={handleResetFilters} activeOpacity={0.8}>
                <Text style={styles.resetFiltersBtnText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredActivities.map((item) => {
              const isCompleted = item.status === 'Completed';
              const isPending = item.status === 'Pending';

              const badgeBg = isCompleted
                ? PALETTE.greenBadgeBg
                : isPending
                ? PALETTE.amberBadgeBg
                : PALETTE.redBadgeBg;

              const badgeTextColor = isCompleted
                ? PALETTE.greenBadgeText
                : isPending
                ? PALETTE.amberBadgeText
                : PALETTE.redBadgeText;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.activityCard}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.badgeText, { color: badgeTextColor }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                  <Text style={styles.cardDate}>{item.time}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ─── Filter Page / Modal for Today's Operations ─── */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <SafeAreaView style={styles.modalRoot}>
          <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <CloseIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>Filter Operations</Text>
                <Text style={styles.modalSubtitle}>Today's Operations · 24 Sep 2026</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDraftFilters(DEFAULT_FILTERS)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Scope Notice Card */}
            <View style={styles.scopeCard}>
              <View style={styles.scopeIconWrap}>
                <LockIcon size={16} color={PALETTE.primary} />
              </View>
              <View style={styles.scopeTextWrap}>
                <Text style={styles.scopeTitle}>Coonoor Warehouse — Assigned Scope</Text>
                <Text style={styles.scopeDesc}>
                  Filters apply strictly to today's operations logged within this facility.
                </Text>
              </View>
            </View>

            {/* Section 1: Activity Module */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionHeader}>ACTIVITY MODULE</Text>
              <View style={styles.chipsWrap}>
                {[
                  { key: 'All', label: 'All Modules' },
                  { key: 'Receiving', label: 'Goods Receiving' },
                  { key: 'Storage', label: 'Storage Activity' },
                  { key: 'Verification', label: 'Stock Verification' },
                  { key: 'Material Handling', label: 'Material Handling' },
                  { key: 'Issues', label: 'Operational Issues' },
                ].map((mod) => {
                  const isSel = draftFilters.module === mod.key;
                  return (
                    <TouchableOpacity
                      key={mod.key}
                      style={[styles.chip, isSel && styles.chipSelected]}
                      onPress={() => setDraftFilters({ ...draftFilters, module: mod.key })}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                        {mod.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 2: Status */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionHeader}>STATUS</Text>
              <View style={styles.chipsWrap}>
                {[
                  { key: 'All', label: 'All Statuses' },
                  { key: 'Completed', label: 'Completed' },
                  { key: 'Pending', label: 'Pending' },
                  { key: 'Open', label: 'Open Issues' },
                ].map((st) => {
                  const isSel = draftFilters.status === st.key;
                  return (
                    <TouchableOpacity
                      key={st.key}
                      style={[styles.chip, isSel && styles.chipSelected]}
                      onPress={() => setDraftFilters({ ...draftFilters, status: st.key })}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Time Period */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionHeader}>TIME OF DAY</Text>
              <View style={styles.chipsWrap}>
                {[
                  { key: 'All', label: 'All Day' },
                  { key: 'morning', label: 'Morning (06:00 - 12:00)' },
                  { key: 'afternoon', label: 'Afternoon (12:00 - 18:00)' },
                  { key: 'evening', label: 'Evening (18:00 - 24:00)' },
                ].map((tod) => {
                  const isSel = draftFilters.timeOfDay === tod.key;
                  return (
                    <TouchableOpacity
                      key={tod.key}
                      style={[styles.chip, isSel && styles.chipSelected]}
                      onPress={() => setDraftFilters({ ...draftFilters, timeOfDay: tod.key })}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                        {tod.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 4: Sort Order */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionHeader}>SORT ORDER</Text>
              <View style={styles.chipsWrap}>
                {[
                  { key: 'newest', label: 'Newest First' },
                  { key: 'oldest', label: 'Oldest First' },
                ].map((so) => {
                  const isSel = draftFilters.sortOrder === so.key;
                  return (
                    <TouchableOpacity
                      key={so.key}
                      style={[styles.chip, isSel && styles.chipSelected]}
                      onPress={() => setDraftFilters({ ...draftFilters, sortOrder: so.key as any })}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                        {so.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Modal Bottom Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalResetBtn}
              onPress={() => setDraftFilters(DEFAULT_FILTERS)}
              activeOpacity={0.75}
            >
              <Text style={styles.modalResetBtnText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalApplyBtn}
              onPress={handleApplyFilters}
              activeOpacity={0.8}
            >
              <CheckmarkIcon size={18} color="#FFFFFF" />
              <Text style={styles.modalApplyBtnText}>
                Apply Filters ({draftMatchCount})
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 6,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  filterHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  filterHeaderBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderColor: '#FFFFFF',
  },
  filterBadgeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
  },
  filterBadgeIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.primary,
  },

  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricVal: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.6,
  },

  activeFilterBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1,
    borderColor: '#FCD9CE',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeFilterBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
    flex: 1,
    marginRight: 8,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '800',
    color: PALETTE.primary,
    textDecorationLine: 'underline',
  },

  filtersScroll: {
    marginBottom: 16,
    paddingLeft: 16,
  },
  filtersContent: {
    paddingRight: 24,
    gap: 10,
  },
  filterPill: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
  },
  filterPillActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  resetFiltersBtn: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetFiltersBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  activityCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },

  // Modal Styles
  modalRoot: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  modalHeader: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  modalTitleWrap: {
    flex: 1,
    marginLeft: 6,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  modalResetText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalBody: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  modalContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 20,
  },
  scopeCard: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    gap: 12,
  },
  scopeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeTextWrap: {
    flex: 1,
  },
  scopeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  scopeDesc: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    lineHeight: 16,
  },
  filterSection: {
    gap: 10,
  },
  sectionHeader: {
    fontSize: 11.5,
    fontWeight: '800',
    color: PALETTE.textSecondary,
    letterSpacing: 0.8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  chipSelected: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  modalFooter: {
    backgroundColor: PALETTE.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  modalResetBtn: {
    width: '32%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.pageBg,
  },
  modalResetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  modalApplyBtn: {
    flex: 1,
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modalApplyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
