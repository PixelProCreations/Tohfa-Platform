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

import { adminColors, adminRadius, adminSpacing } from '../../theme';

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
  labelMuted: '#78716C',

  // Status Badges
  activeBadgeBg: '#DCFCE7',
  activeBadgeText: '#15803D',
  discontinuedBadgeBg: '#475569',
  discontinuedBadgeText: '#FFFFFF',
  neutralBadgeBg: '#F3F4F6',
  neutralBadgeText: '#4B5563',

  // Accent & Action
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

function SearchIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Matching Screenshot 2 & 3 ─── */}
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

          <Text style={styles.headerTitle}>Approved Inputs</Text>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.8}
            accessibilityLabel="Filter inputs"
          >
            <FilterSlidersIcon size={20} color={THEME.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          View TOHFA-approved inputs available for farmer use
        </Text>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Filter Section (Screenshot 3) ─── */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeaderRow}>
              <FilterSlidersIcon size={18} color={THEME.titleRustDark} />
              <Text style={styles.filtersHeaderTitle}>Filters</Text>
            </View>

            {/* 1. Category */}
            <Text style={styles.filterGroupLabel}>Category</Text>
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
            <Text style={styles.filterGroupLabel}>Farming Type</Text>
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
            <Text style={styles.filterGroupLabel}>Status</Text>
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
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Search Bar (Screenshot 2) ─── */}
        {!showFilters && (
          <View style={styles.searchBar}>
            <SearchIcon size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Input name, code, category, manufacturer"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        {/* ─── Cards List (Screenshot 2) ─── */}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: {
    paddingRight: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
    marginLeft: 6,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
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
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md, // 12px
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: adminSpacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.ink,
    padding: 0,
  },

  // List Container
  listContainer: {
    gap: adminSpacing.md,
  },
  inputCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl, // 16px
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 4,
  },
  inputCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  neutralBadge: {
    backgroundColor: THEME.neutralBadgeBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  neutralBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.neutralBadgeText,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeActive: {
    backgroundColor: THEME.activeBadgeBg,
  },
  badgeTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.activeBadgeText,
  },
  badgeDiscontinued: {
    backgroundColor: THEME.discontinuedBadgeBg,
  },
  badgeTextDiscontinued: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.discontinuedBadgeText,
  },

  // ─── Filters Section (Screenshot 3) ───
  filtersContainer: {
    paddingTop: 4,
    marginBottom: 20,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  filtersHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },
  filterGroupLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.ink,
    marginTop: 8,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: THEME.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: THEME.orangeBtn,
    borderColor: THEME.orangeBtn,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.ink,
  },
  filterChipTextActive: {
    color: THEME.white,
    fontWeight: '700',
  },
  filterActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.orangeBtn,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.ink,
  },
});
