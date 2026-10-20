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
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import type { DisputeCategory, DisputeStatus } from './fixtures';

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

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FunnelIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Options Constants ───────────────────────────────────────────────────────

export const DISPUTE_STATUS_OPTIONS: readonly ('All' | DisputeStatus)[] = [
  'All',
  'Under Review',
  'Awaiting TOHFA',
  'Open',
  'Escalated',
  'Resolved',
];

export const DISPUTE_CATEGORY_OPTIONS: readonly ('All' | DisputeCategory)[] = [
  'All',
  'Payment & Payout',
  'Purchase & Collection',
  'Produce Quality & Rejection',
  'Audit & Documentation',
];

export interface DisputeFilterValues {
  searchQuery: string;
  status: 'All' | DisputeStatus;
  category: 'All' | DisputeCategory;
}

export interface FarmerDisputesFilterScreenProps {
  initialFilters: DisputeFilterValues;
  onBack: () => void;
  onApply: (filters: DisputeFilterValues) => void;
  onReset?: () => void;
  disputeCount?: number;
}

export function FarmerDisputesFilterScreen({
  initialFilters,
  onBack,
  onApply,
  onReset,
  disputeCount,
}: FarmerDisputesFilterScreenProps) {
  const [draftSearch, setDraftSearch] = useState(initialFilters.searchQuery);
  const [draftStatus, setDraftStatus] = useState<'All' | DisputeStatus>(initialFilters.status);
  const [draftCategory, setDraftCategory] = useState<'All' | DisputeCategory>(initialFilters.category);

  const handleReset = () => {
    setDraftSearch('');
    setDraftStatus('All');
    setDraftCategory('All');
    if (onReset) {
      onReset();
    }
  };

  const handleApply = () => {
    onApply({
      searchQuery: draftSearch,
      status: draftStatus,
      category: draftCategory,
    });
  };

  const hasActiveFilters = draftStatus !== 'All' || draftCategory !== 'All' || draftSearch.trim().length > 0;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
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
          <Text style={styles.headerTitle}>Filter Disputes</Text>

          <TouchableOpacity
            style={styles.headerResetBtn}
            onPress={handleReset}
            activeOpacity={0.75}
            accessibilityLabel="Reset filters"
          >
            <Text style={styles.headerResetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          Refine disputes by status, category, or keyword
        </Text>
      </View>

      {/* ─── Filter Form Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <Text style={styles.sectionTitle}>SEARCH KEYWORD</Text>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Dispute ID, farmer name, or keyword"
            placeholderTextColor={adminColors.placeholder}
            value={draftSearch}
            onChangeText={setDraftSearch}
            autoCorrect={false}
          />
          {draftSearch.length > 0 && (
            <TouchableOpacity
              onPress={() => setDraftSearch('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section: Status */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>STATUS</Text>
          {draftStatus !== 'All' && (
            <Text style={styles.sectionActiveBadge}>1 Selected</Text>
          )}
        </View>
        <View style={styles.chipsWrap}>
          {DISPUTE_STATUS_OPTIONS.map((st) => {
            const isSelected = draftStatus === st;
            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                ]}
                onPress={() => setDraftStatus(st)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section: Category */}
        <View style={[styles.sectionHeaderRow, { marginTop: adminSpacing.xl }]}>
          <Text style={styles.sectionTitle}>CATEGORY</Text>
          {draftCategory !== 'All' && (
            <Text style={styles.sectionActiveBadge}>1 Selected</Text>
          )}
        </View>
        <View style={styles.chipsWrap}>
          {DISPUTE_CATEGORY_OPTIONS.map((cat) => {
            const isSelected = draftCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                ]}
                onPress={() => setDraftCategory(cat)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active Filter Summary Box */}
        {hasActiveFilters && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Active Filter Selection</Text>
            {draftStatus !== 'All' && (
              <Text style={styles.summaryItem}>• Status: <Text style={styles.summaryItemVal}>{draftStatus}</Text></Text>
            )}
            {draftCategory !== 'All' && (
              <Text style={styles.summaryItem}>• Category: <Text style={styles.summaryItemVal}>{draftCategory}</Text></Text>
            )}
            {draftSearch.trim().length > 0 && (
              <Text style={styles.summaryItem}>• Search: <Text style={styles.summaryItemVal}>"{draftSearch.trim()}"</Text></Text>
            )}
          </View>
        )}

        <View style={{ height: adminSpacing.xxl }} />
      </ScrollView>

      {/* ─── Footer Action Bar ─── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Reset"
        >
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Apply Filters"
        >
          <FunnelIcon size={18} color={adminColors.onBrand} />
          <Text style={styles.applyButtonText}>
            Apply Filters{disputeCount !== undefined ? ` (${disputeCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
    flex: 1,
    marginLeft: adminSpacing.xs,
  },
  headerResetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  headerResetText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 2,
    paddingLeft: 44,
    fontWeight: '500',
  },

  // Scroll Body
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearchText: {
    fontSize: 15,
    color: adminColors.muted,
    fontWeight: '700',
    paddingHorizontal: 4,
  },

  // Sections
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionActiveBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.brand,
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },

  // Chips
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  filterChip: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: adminColors.muted,
  },
  filterChipTextActive: {
    color: adminColors.brand,
    fontWeight: '800',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    padding: adminSpacing.md,
    marginTop: adminSpacing.xl,
    gap: 4,
  },
  summaryTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryItem: {
    fontSize: 13,
    color: adminColors.muted,
    fontWeight: '500',
  },
  summaryItemVal: {
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Footer Actions
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    ...adminShadow.sm,
  },
  resetButton: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  applyButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  applyButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});
