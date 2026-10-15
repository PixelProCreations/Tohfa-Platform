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

import { t } from '../../i18n';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

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

function SearchIcon({ size = 18, color = adminColors.placeholder }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface ApprovedInputItem {
  id: string;
  name: string;
  code: string;
  category: 'Bio-input' | 'Fertilizer' | 'Manure' | 'Soil Amendment';
  subcategory: string;
  farmingType: 'Natural Farming' | 'Organic' | 'Natural';
  status: 'Active' | 'Discontinued';
  approvedDate: string;
  manufacturer: string;
  method: string;
  usage: string;
  frequency: string;
  crops: string[];
}

export const SAMPLE_INPUTS: ApprovedInputItem[] = [
  {
    id: 'INP-00125',
    name: 'Jeevamirtha',
    code: 'INP-00125',
    category: 'Bio-input',
    subcategory: 'Microbial Culture',
    farmingType: 'Natural Farming',
    status: 'Active',
    approvedDate: '10 Mar 2026',
    manufacturer: 'Farmer-prepared',
    method: 'Soil drench',
    usage: 'As configured',
    frequency: 'As configured',
    crops: ['Carrot', 'Cabbage', 'Beans'],
  },
  {
    id: 'INP-00118',
    name: 'Panchagavya',
    code: 'INP-00118',
    category: 'Bio-input',
    subcategory: 'Plant Growth Promoter',
    farmingType: 'Organic',
    status: 'Active',
    approvedDate: '15 Feb 2026',
    manufacturer: 'Farmer-prepared',
    method: 'Foliar spray',
    usage: 'As configured',
    frequency: 'As configured',
    crops: ['Tomato', 'Potato', 'Carrot'],
  },
  {
    id: 'INP-00096',
    name: 'Neem Cake',
    code: 'INP-00096',
    category: 'Soil Amendment',
    subcategory: 'Botanical Fertilizer',
    farmingType: 'Organic',
    status: 'Discontinued',
    approvedDate: '01 Jan 2025',
    manufacturer: 'Certified Bio Solutions',
    method: 'Basal application',
    usage: 'As configured',
    frequency: 'As configured',
    crops: ['Beans', 'Cabbage', 'Beetroot'],
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ApprovedInputsScreenProps {
  onBack: () => void;
  onSelectInput: (inputItem: ApprovedInputItem) => void;
}

export function ApprovedInputsScreen({
  onBack,
  onSelectInput,
}: ApprovedInputsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Fertilizer' | 'Manure' | 'Bio-input'>('All');
  const [selectedFarmingType, setSelectedFarmingType] = useState<'All' | 'Organic' | 'Natural'>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Discontinued'>('All');

  // Filtered List
  const filteredInputs = SAMPLE_INPUTS.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.manufacturer.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;

    const matchesFarmingType =
      selectedFarmingType === 'All' ||
      (selectedFarmingType === 'Natural' && (item.farmingType === 'Natural Farming' || item.farmingType === 'Natural')) ||
      item.farmingType === selectedFarmingType;

    const matchesStatus =
      selectedStatus === 'All' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesFarmingType && matchesStatus;
  });

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSelectedFarmingType('All');
    setSelectedStatus('All');
  };

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
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('approvedInputs.title')}</Text>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.8}
            accessibilityLabel="Filter inputs"
          >
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          {t('approvedInputs.subtitle')}
        </Text>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Filter Section ─── */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeaderRow}>
              <FilterSlidersIcon size={18} color={adminColors.brandDeep} />
              <Text style={styles.filtersHeaderTitle}>{t('approvedInputs.filtersTitle')}</Text>
            </View>

            {/* 1. Category */}
            <Text style={styles.filterGroupLabel}>{t('approvedInputs.filterByCategory')}</Text>
            <View style={styles.chipRow}>
              {(['All', 'Fertilizer', 'Manure', 'Bio-input'] as const).map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Farming Type */}
            <Text style={styles.filterGroupLabel}>{t('approvedInputs.filterByFarmingType')}</Text>
            <View style={styles.chipRow}>
              {(['All', 'Organic', 'Natural'] as const).map((type) => {
                const isActive = selectedFarmingType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedFarmingType(type)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Status */}
            <Text style={styles.filterGroupLabel}>{t('approvedInputs.filterByStatus')}</Text>
            <View style={styles.chipRow}>
              {(['All', 'Active', 'Discontinued'] as const).map((status) => {
                const isActive = selectedStatus === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedStatus(status)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Buttons: Apply & Clear */}
            <View style={styles.filterActionRow}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilters(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>{t('approvedInputs.applyFilters')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.clearBtnText}>{t('approvedInputs.resetFilters')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Search Bar ─── */}
        {!showFilters && (
          <View style={styles.searchBar}>
            <SearchIcon size={18} color={adminColors.placeholder} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('approvedInputs.searchPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        {/* ─── Cards List ─── */}
        {!showFilters && (
          <View style={styles.listContainer}>
            {filteredInputs.map((item) => {
              const isActive = item.status === 'Active';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.inputCard}
                  onPress={() => onSelectInput(item)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.inputCardTitle}>{item.name}</Text>
                  <Text style={styles.inputCardSubtitle}>
                    {item.code} · {item.category}
                  </Text>

                  {/* Badges Row */}
                  <View style={styles.badgesRow}>
                    <View style={styles.neutralBadge}>
                      <Text style={styles.neutralBadgeText}>{item.farmingType}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        isActive ? styles.badgeActive : styles.badgeDiscontinued,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isActive ? styles.badgeTextActive : styles.badgeTextDiscontinued,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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

  // Header
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  backBtn: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
    marginLeft: adminSpacing.xs,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    ...adminType.body,
    color: adminColors.brandTint,
    marginTop: adminSpacing.xs,
    fontWeight: '500',
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },

  // List Container
  listContainer: {
    gap: adminSpacing.md,
  },
  inputCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  inputCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  inputCardSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  neutralBadge: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
  neutralBadgeText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  statusBadge: {
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
  statusBadgeText: {
    ...adminType.caption,
  },
  badgeActive: {
    backgroundColor: adminColors.success.bg,
  },
  badgeTextActive: {
    color: adminColors.success.text,
  },
  badgeDiscontinued: {
    backgroundColor: adminColors.muted,
  },
  badgeTextDiscontinued: {
    color: adminColors.onBrand,
  },

  // Filters Section
  filtersContainer: {
    paddingTop: adminSpacing.xs,
    marginBottom: adminSpacing.lg,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  filtersHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  filterGroupLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  filterChip: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  filterActionRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.lg,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
