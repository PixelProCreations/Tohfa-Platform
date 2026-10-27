import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

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

function HorizontalSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
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

function ChevronDownIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarEventIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
      <Rect x="7" y="13" width="2" height="2" fill={color} />
      <Rect x="11" y="13" width="2" height="2" fill={color} />
      <Rect x="15" y="13" width="2" height="2" fill={color} />
      <Rect x="7" y="17" width="2" height="2" fill={color} />
      <Rect x="11" y="17" width="2" height="2" fill={color} />
    </Svg>
  );
}

// ─── Interfaces & Data Types ─────────────────────────────────────────────────

export type CeilingCategory = 'Vegetables' | 'Root crops & bulbs' | 'Spices';
export type CeilingGrade = 'Grade 1' | 'Grade 2' | 'Grade 3';
export type CeilingStatus = 'Current' | 'Scheduled' | 'No ceiling' | 'Historical';

export interface FairPriceCeilingRecord {
  id: string;
  product: string;
  category: CeilingCategory;
  grade: CeilingGrade;
  ceilingText: string;
  priceVal: number;
  effectiveText: string;
  effectiveFrom: string;
  effectiveUntil: string;
  status: CeilingStatus;
  updatedBy: string;
  lastUpdated: string;
  reason: string;
  recentChanges?: {
    date: string;
    admin: string;
    changeText: string;
  }[];
  hasRetailLink?: boolean;
}

// ─── 15 Initial Records Matching Exact Mockup Requirements ───────────────────

export const INITIAL_FAIR_PRICE_CEILINGS: FairPriceCeilingRecord[] = [
  {
    id: 'FP-0001',
    product: 'Tomato',
    category: 'Vegetables',
    grade: 'Grade 1',
    ceilingText: '₹60.00/KG',
    priceVal: 60.0,
    effectiveText: 'Effective 1 Sep 2026 – ongoing · Set by Super Admin',
    effectiveFrom: '1 Sep 2026',
    effectiveUntil: 'No end date',
    status: 'Current',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '1 Sep 2026, 10:00',
    reason: 'Regular ceiling review (demo)',
    recentChanges: [
      {
        date: '1 Sep 2026, 10:00',
        admin: 'Demo Super Admin',
        changeText: '₹55.00/kg to ₹60.00/kg (applied)',
      },
    ],
    hasRetailLink: true,
  },
  {
    id: 'FP-0002',
    product: 'Tomato',
    category: 'Vegetables',
    grade: 'Grade 2',
    ceilingText: '₹50.00/KG',
    priceVal: 50.0,
    effectiveText: 'Effective 1 Sep 2026 – ongoing · Set by Super Admin',
    effectiveFrom: '1 Sep 2026',
    effectiveUntil: 'No end date',
    status: 'Current',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '1 Sep 2026, 10:00',
    reason: 'Regular ceiling review (demo)',
    hasRetailLink: true,
  },
  {
    id: 'FP-0003',
    product: 'Tomato',
    category: 'Vegetables',
    grade: 'Grade 3',
    ceilingText: '₹40.00/KG',
    priceVal: 40.0,
    effectiveText: 'Effective 1 Sep 2026 – ongoing · Set by Super Admin',
    effectiveFrom: '1 Sep 2026',
    effectiveUntil: 'No end date',
    status: 'Current',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '1 Sep 2026, 10:00',
    reason: 'Regular ceiling review (demo)',
    hasRetailLink: true,
  },
  {
    id: 'FP-0004',
    product: 'Carrot',
    category: 'Vegetables',
    grade: 'Grade 1',
    ceilingText: 'New ceiling ₹68.00/KG',
    priceVal: 68.0,
    effectiveText: 'Effective 20 Oct 2026 · Set by Super Admin',
    effectiveFrom: '20 Oct 2026',
    effectiveUntil: 'No end date',
    status: 'Scheduled',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '14 Oct 2026, 11:30',
    reason: 'Upcoming seasonal adjustment',
    recentChanges: [
      {
        date: '14 Oct 2026, 11:30',
        admin: 'Demo Super Admin',
        changeText: 'Scheduled ₹70.00/kg to ₹68.00/kg',
      },
    ],
    hasRetailLink: false,
  },
  {
    id: 'FP-0005',
    product: 'Carrot',
    category: 'Vegetables',
    grade: 'Grade 2',
    ceilingText: '₹55.00/KG',
    priceVal: 55.0,
    effectiveText: 'Effective 1 Sep 2026 – ongoing · Set by Super Admin',
    effectiveFrom: '1 Sep 2026',
    effectiveUntil: 'No end date',
    status: 'Current',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '1 Sep 2026, 10:00',
    reason: 'Regular ceiling review (demo)',
    hasRetailLink: true,
  },
  {
    id: 'FP-0006',
    product: 'Garlic',
    category: 'Spices',
    grade: 'Grade 1',
    ceilingText: 'No ceiling has been set for this product and grade.',
    priceVal: 0,
    effectiveText: 'No effective date recorded',
    effectiveFrom: '—',
    effectiveUntil: '—',
    status: 'No ceiling',
    updatedBy: '—',
    lastUpdated: '—',
    reason: 'Uncapped market pricing',
    hasRetailLink: false,
  },
  {
    id: 'FP-0013',
    product: 'Potato',
    category: 'Root crops & bulbs',
    grade: 'Grade 1',
    ceilingText: '₹35.00/KG',
    priceVal: 35.0,
    effectiveText: 'Effective 1 Apr 2026 – ongoing · Set by Demo Super Admin',
    effectiveFrom: '1 Apr 2026',
    effectiveUntil: 'No end date',
    status: 'Current',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '1 Apr 2026, 09:00',
    reason: 'Initial ceiling (demo)',
    recentChanges: [
      {
        date: '1 Apr 2026, 09:00',
        admin: 'Demo Super Admin',
        changeText: '— to ₹35.00/kg (applied)',
      },
    ],
    hasRetailLink: true,
  },
  {
    id: 'FP-0014',
    product: 'Potato',
    category: 'Root crops & bulbs',
    grade: 'Grade 2',
    ceilingText: '₹28.00/KG',
    priceVal: 28.0,
    effectiveText: 'Effective 1 Apr 2026 – ongoing · Set by Demo Super Admin',
    effectiveFrom: '1 Apr 2026',
    effectiveUntil: 'No end date',
    status: 'Current',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '1 Apr 2026, 09:00',
    reason: 'Initial ceiling (demo)',
    hasRetailLink: true,
  },
  {
    id: 'FP-0007',
    product: 'Beans',
    category: 'Vegetables',
    grade: 'Grade 1',
    ceilingText: '₹80.00/KG',
    priceVal: 80.0,
    effectiveText: 'Effective 1 Aug 2026 – ongoing · Set by Super Admin',
    effectiveFrom: '1 Aug 2026',
    effectiveUntil: 'No end date',
    status: 'Current',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '1 Aug 2026, 10:00',
    reason: 'Quarterly update',
    hasRetailLink: true,
  },
  {
    id: 'FP-0008',
    product: 'Beans',
    category: 'Vegetables',
    grade: 'Grade 2',
    ceilingText: '₹70.00/KG',
    priceVal: 70.0,
    effectiveText: 'Effective 1 Aug 2026 – ongoing · Set by Super Admin',
    effectiveFrom: '1 Aug 2026',
    effectiveUntil: 'No end date',
    status: 'Current',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '1 Aug 2026, 10:00',
    reason: 'Quarterly update',
    hasRetailLink: true,
  },
  {
    id: 'FP-0009',
    product: 'Cabbage',
    category: 'Vegetables',
    grade: 'Grade 1',
    ceilingText: '₹30.00/KG',
    priceVal: 30.0,
    effectiveText: 'Effective 1 Jul 2026 – ongoing · Set by Super Admin',
    effectiveFrom: '1 Jul 2026',
    effectiveUntil: 'No end date',
    status: 'Current',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '1 Jul 2026, 10:00',
    reason: 'Initial ceiling (demo)',
    hasRetailLink: true,
  },
  {
    id: 'FP-0010',
    product: 'Cabbage',
    category: 'Vegetables',
    grade: 'Grade 2',
    ceilingText: '₹25.00/KG',
    priceVal: 25.0,
    effectiveText: 'Effective 1 Jul 2026 – ongoing · Set by Super Admin',
    effectiveFrom: '1 Jul 2026',
    effectiveUntil: 'No end date',
    status: 'Current',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '1 Jul 2026, 10:00',
    reason: 'Initial ceiling (demo)',
    hasRetailLink: true,
  },
  {
    id: 'FP-0011',
    product: 'Ginger',
    category: 'Root crops & bulbs',
    grade: 'Grade 1',
    ceilingText: '₹120.00/KG',
    priceVal: 120.0,
    effectiveText: 'Effective 1 Jun 2026 – ongoing · Set by Super Admin',
    effectiveFrom: '1 Jun 2026',
    effectiveUntil: 'No end date',
    status: 'Current',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '1 Jun 2026, 09:00',
    reason: 'Market rate stabilization',
    hasRetailLink: true,
  },
  {
    id: 'FP-0012',
    product: 'Onion',
    category: 'Root crops & bulbs',
    grade: 'Grade 1',
    ceilingText: '₹45.00/KG',
    priceVal: 45.0,
    effectiveText: 'Effective 1 May 2026 – ongoing · Set by Super Admin',
    effectiveFrom: '1 May 2026',
    effectiveUntil: 'No end date',
    status: 'Current',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '1 May 2026, 09:00',
    reason: 'Regular ceiling review (demo)',
    hasRetailLink: true,
  },
  {
    id: 'FP-0015',
    product: 'Onion',
    category: 'Root crops & bulbs',
    grade: 'Grade 2',
    ceilingText: '₹38.00/KG',
    priceVal: 38.0,
    effectiveText: 'Effective 1 Jan 2026 – 30 Apr 2026 · Expired',
    effectiveFrom: '1 Jan 2026',
    effectiveUntil: '30 Apr 2026',
    status: 'Historical',
    updatedBy: 'Demo Super Admin',
    lastUpdated: '1 Jan 2026, 09:00',
    reason: 'Historic ceiling cycle',
    recentChanges: [
      {
        date: '1 Jan 2026, 09:00',
        admin: 'Demo Super Admin',
        changeText: 'Initial setup of Grade 2 Onion',
      },
    ],
    hasRetailLink: false,
  },
];

// Backward-compatible alias
export const SAMPLE_FAIR_PRICES = INITIAL_FAIR_PRICE_CEILINGS;
export type FairPriceItem = FairPriceCeilingRecord;

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FairPriceCeilingScreenProps {
  onBack: () => void;
  onNavigateToRetailPricing?: (() => void) | undefined;
  onNavigateToBreakdown?: ((item?: any) => void) | undefined;
  onNavigateToHistory?: ((item?: any) => void) | undefined;
  onSelectPriceItem?: ((item?: any) => void) | undefined;
  onUpdatePrice?: ((item?: any) => void) | undefined;
  onBulkUpdate?: (() => void) | undefined;
  onViewHistory?: ((item?: any) => void) | undefined;
}

export function FairPriceCeilingScreen({
  onBack,
  onNavigateToRetailPricing = () => {},
  onNavigateToBreakdown: _onNavigateToBreakdown,
  onNavigateToHistory,
}: FairPriceCeilingScreenProps) {
  // ── States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCeiling, setSelectedCeiling] = useState<FairPriceCeilingRecord | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Active filter state
  const [appliedCategory, setAppliedCategory] = useState<'All' | 'Vegetables' | 'Root crops & bulbs'>('All');
  const [appliedGrade, setAppliedGrade] = useState<'All' | 'Grade 1' | 'Grade 2' | 'Grade 3'>('All');
  const [appliedInForceDate, setAppliedInForceDate] = useState('');
  const [appliedRecords, setAppliedRecords] = useState<'Current' | 'Scheduled' | 'Historical' | 'All'>('Current');

  // Draft filter state for inside the modal
  const [draftCategory, setDraftCategory] = useState<'All' | 'Vegetables' | 'Root crops & bulbs'>('All');
  const [draftGrade, setDraftGrade] = useState<'All' | 'Grade 1' | 'Grade 2' | 'Grade 3'>('All');
  const [draftInForceDate, setDraftInForceDate] = useState('');
  const [draftRecords, setDraftRecords] = useState<'Current' | 'Scheduled' | 'Historical' | 'All'>('Current');

  // Open dropdown toggles in the modal
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [recordsDropdownOpen, setRecordsDropdownOpen] = useState(false);

  // Sync draft filters when modal opens
  const openFiltersModal = () => {
    setDraftCategory(appliedCategory);
    setDraftGrade(appliedGrade);
    setDraftInForceDate(appliedInForceDate);
    setDraftRecords(appliedRecords);
    setCategoryDropdownOpen(false);
    setGradeDropdownOpen(false);
    setRecordsDropdownOpen(false);
    setFilterModalVisible(true);
  };

  const handleApplyFilters = () => {
    setAppliedCategory(draftCategory);
    setAppliedGrade(draftGrade);
    setAppliedInForceDate(draftInForceDate);
    setAppliedRecords(draftRecords);
    setFilterModalVisible(false);
  };

  const handleResetFilters = () => {
    setDraftCategory('All');
    setDraftGrade('All');
    setDraftInForceDate('');
    setDraftRecords('All');
    setAppliedCategory('All');
    setAppliedGrade('All');
    setAppliedInForceDate('');
    setAppliedRecords('All');
    setFilterModalVisible(false);
  };

  // Filter computation
  const filteredRecords = useMemo(() => {
    return INITIAL_FAIR_PRICE_CEILINGS.filter((rec) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesName =
          rec.product.toLowerCase().includes(q) ||
          rec.category.toLowerCase().includes(q) ||
          rec.grade.toLowerCase().includes(q) ||
          rec.id.toLowerCase().includes(q);
        if (!matchesName) return false;
      }

      // 2. Category
      if (appliedCategory !== 'All' && rec.category !== appliedCategory) {
        return false;
      }

      // 3. Grade
      if (appliedGrade !== 'All' && rec.grade !== appliedGrade) {
        return false;
      }

      // 4. Records status
      if (appliedRecords !== 'All' && rec.status !== appliedRecords) {
        return false;
      }

      return true;
    });
  }, [searchQuery, appliedCategory, appliedGrade, appliedRecords]);

  // Dynamic counter string matching Image 2 top
  const countLabel = useMemo(() => {
    const total = INITIAL_FAIR_PRICE_CEILINGS.length;
    const count = filteredRecords.length;
    if (appliedRecords === 'Current' && appliedCategory === 'All' && appliedGrade === 'All') {
      return `${count} of ${total} ceiling records · current`;
    }
    if (count === total) {
      return `${total} ceiling records`;
    }
    const tags: string[] = [];
    if (appliedRecords !== 'All') tags.push(appliedRecords.toLowerCase());
    if (appliedCategory !== 'All') tags.push(appliedCategory);
    if (appliedGrade !== 'All') tags.push(appliedGrade);
    return `${count} of ${total} ceiling records${tags.length > 0 ? ` · ${tags.join(', ')}` : ''}`;
  }, [filteredRecords.length, appliedRecords, appliedCategory, appliedGrade]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Orange Gradient Header Matching Image 1 ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Fair Price Management
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search Bar with Right Filter Icon ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.searchFilterBtn}
            onPress={openFiltersModal}
            activeOpacity={0.7}
            accessibilityLabel="Open filters"
          >
            <HorizontalSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ── Dynamic Subtitle Counter ── */}
        <Text style={styles.recordCountText}>{countLabel}</Text>

        {/* ── List of Ceiling Cards ── */}
        {filteredRecords.map((item) => {
          const isCurrent = item.status === 'Current';
          const isScheduled = item.status === 'Scheduled';
          const isNoCeiling = item.status === 'No ceiling';

          return (
            <View key={item.id} style={styles.ceilingCard}>
              {/* Card Header Row */}
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>
                  {item.product} · {item.grade}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    isCurrent && styles.badgeCurrent,
                    isScheduled && styles.badgeScheduled,
                    isNoCeiling && styles.badgeNoCeiling,
                    item.status === 'Historical' && styles.badgeHistorical,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isCurrent && styles.badgeCurrentText,
                      isScheduled && styles.badgeScheduledText,
                      isNoCeiling && styles.badgeNoCeilingText,
                      item.status === 'Historical' && styles.badgeHistoricalText,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Subtext 1: Category & Ceiling */}
              <Text style={styles.cardSubtitle1}>
                {item.category}
                {item.status !== 'No ceiling' ? ` · Ceiling ${item.ceilingText}` : ` · ${item.ceilingText}`}
              </Text>

              {/* Subtext 2: Effective date / Super Admin */}
              {item.status !== 'No ceiling' && (
                <Text style={styles.cardSubtitle2}>{item.effectiveText}</Text>
              )}

              {/* Action Links Row */}
              <View style={styles.cardActionsRow}>
                {item.status !== 'No ceiling' && (
                  <TouchableOpacity
                    onPress={() => setSelectedCeiling(item)}
                    activeOpacity={0.7}
                    style={styles.cardActionBtn}
                  >
                    <Text style={styles.cardActionBold}>View</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => {
                    if (onNavigateToHistory) {
                      onNavigateToHistory(item);
                    } else {
                      setSelectedCeiling(item);
                    }
                  }}
                  activeOpacity={0.7}
                  style={styles.cardActionBtn}
                >
                  <Text style={styles.cardActionRegular}>History</Text>
                </TouchableOpacity>

                {item.hasRetailLink && (
                  <TouchableOpacity
                    onPress={onNavigateToRetailPricing}
                    activeOpacity={0.7}
                    style={styles.cardActionBtn}
                  >
                    <Text style={styles.cardActionRegular}>Retail Price Management</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ── Ceiling Details Bottom Sheet Modal (Image 1 Right) ── */}
      <Modal
        visible={selectedCeiling !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCeiling(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedCeiling(null)}
        >
          <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>
              Ceiling {selectedCeiling?.id || 'FP-0013'}
            </Text>

            {/* Spec Table with Dotted Dividers */}
            <View style={styles.specCard}>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Product</Text>
                <Text style={styles.specValBold}>{selectedCeiling?.product}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Category</Text>
                <Text style={styles.specValBold}>{selectedCeiling?.category}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Grade</Text>
                <Text style={styles.specValBold}>{selectedCeiling?.grade}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Fair price ceiling</Text>
                <Text style={styles.specValBold}>
                  {selectedCeiling && selectedCeiling.priceVal > 0
                    ? `₹${selectedCeiling.priceVal.toFixed(2)}/kg`
                    : '—'}
                </Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Effective from</Text>
                <Text style={styles.specValBold}>{selectedCeiling?.effectiveFrom}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Effective until</Text>
                <Text style={styles.specValBold}>{selectedCeiling?.effectiveUntil}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Status</Text>
                <Text style={styles.specValBold}>{selectedCeiling?.status}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Updated by</Text>
                <Text style={styles.specValBold}>{selectedCeiling?.updatedBy}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Last updated</Text>
                <Text style={styles.specValBold}>{selectedCeiling?.lastUpdated}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Reason</Text>
                <Text style={styles.specValBold}>{selectedCeiling?.reason}</Text>
              </View>
            </View>

            {/* Recent Changes Sub-section */}
            <Text style={styles.recentChangesHeading}>Recent changes</Text>
            <View style={styles.recentChangesBlock}>
              <Text style={styles.recentChangeDate}>
                {selectedCeiling?.recentChanges?.[0]?.date || '1 Apr 2026, 09:00'} ·{' '}
                {selectedCeiling?.recentChanges?.[0]?.admin || 'Demo Super Admin'}
              </Text>
              <Text style={styles.recentChangeText}>
                {selectedCeiling?.recentChanges?.[0]?.changeText ||
                  `— to ₹${selectedCeiling?.priceVal.toFixed(2)}/kg (applied)`}
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setSelectedCeiling(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetCloseText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Filters Bottom Sheet Modal (Images 2, 3, 4) ── */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable style={styles.filterSheetContainer} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.filterSheetHeading}>Filters</Text>

            {/* 1. Category Field */}
            <Text style={styles.filterFieldLabel}>Category</Text>
            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => {
                setCategoryDropdownOpen(!categoryDropdownOpen);
                setGradeDropdownOpen(false);
                setRecordsDropdownOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownSelectedText}>{draftCategory}</Text>
              <ChevronDownIcon size={18} color={adminColors.ink} />
            </TouchableOpacity>

            {/* Category Dropdown Menu Matching Image 2 */}
            {categoryDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {(['All', 'Vegetables', 'Root crops & bulbs'] as const).map((cat) => {
                  const isSelected = draftCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                      onPress={() => {
                        setDraftCategory(cat);
                        setCategoryDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          isSelected && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 2. Grade Field */}
            <Text style={styles.filterFieldLabel}>Grade</Text>
            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => {
                setGradeDropdownOpen(!gradeDropdownOpen);
                setCategoryDropdownOpen(false);
                setRecordsDropdownOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownSelectedText}>{draftGrade}</Text>
              <ChevronDownIcon size={18} color={adminColors.ink} />
            </TouchableOpacity>

            {/* Grade Dropdown Menu Matching Image 3 */}
            {gradeDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {(['All', 'Grade 1', 'Grade 2', 'Grade 3'] as const).map((g) => {
                  const isSelected = draftGrade === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                      onPress={() => {
                        setDraftGrade(g);
                        setGradeDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          isSelected && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 3. In force on Date Input */}
            <Text style={styles.filterFieldLabel}>In force on</Text>
            <View style={styles.dateInputBox}>
              <TextInput
                style={styles.dateTextInput}
                placeholder="dd-mm-yyyy"
                placeholderTextColor={adminColors.placeholder}
                value={draftInForceDate}
                onChangeText={setDraftInForceDate}
              />
              <CalendarEventIcon size={18} color={adminColors.muted} />
            </View>

            {/* 4. Records Field */}
            <Text style={styles.filterFieldLabel}>Records</Text>
            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => {
                setRecordsDropdownOpen(!recordsDropdownOpen);
                setCategoryDropdownOpen(false);
                setGradeDropdownOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownSelectedText}>{draftRecords}</Text>
              <ChevronDownIcon size={18} color={adminColors.ink} />
            </TouchableOpacity>

            {/* Records Dropdown Menu Matching Image 4 */}
            {recordsDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {(['Current', 'Scheduled', 'Historical', 'All'] as const).map((r) => {
                  const isSelected = draftRecords === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                      onPress={() => {
                        setDraftRecords(r);
                        setRecordsDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          isSelected && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Modal Footer Buttons Row (Apply & Reset Pills) */}
            <View style={styles.filterActionsRow}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApplyFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={handleResetFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles strictly conforming to adminTheme ────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: adminSpacing.xs,
    marginRight: adminSpacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.9,
    fontSize: 12,
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
  },

  infoCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  infoCardText: {
    ...adminType.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: adminColors.muted,
  },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: adminSpacing.sm,
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  searchFilterBtn: {
    padding: 4,
  },

  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: adminColors.card,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  actionPillText: {
    ...adminType.rowTitle,
    fontSize: 12.5,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },

  recordCountText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },

  ceilingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    ...adminType.rowTitle,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  statusBadgeText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeCurrent: {
    backgroundColor: adminColors.success.bg,
  },
  badgeCurrentText: {
    color: adminColors.success.text,
  },
  badgeScheduled: {
    backgroundColor: adminColors.info.bg,
  },
  badgeScheduledText: {
    color: adminColors.info.text,
  },
  badgeNoCeiling: {
    backgroundColor: adminColors.border,
  },
  badgeNoCeilingText: {
    color: adminColors.muted,
  },
  badgeHistorical: {
    backgroundColor: adminColors.border,
  },
  badgeHistoricalText: {
    color: adminColors.muted,
  },

  cardSubtitle1: {
    ...adminType.body,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
  },
  cardSubtitle2: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
  },

  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.lg,
    marginTop: 12,
  },
  cardActionBtn: {
    paddingVertical: 2,
  },
  cardActionBold: {
    ...adminType.rowTitle,
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  cardActionRegular: {
    ...adminType.rowTitle,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // ── Bottom Sheet Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: adminSpacing.lg,
    maxHeight: '90%',
  },
  sheetTitle: {
    ...adminType.title,
    fontSize: 19,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  specCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  specKey: {
    ...adminType.body,
    fontSize: 12.5,
    color: adminColors.muted,
  },
  specValBold: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  dottedDivider: {
    height: 1,
    borderWidth: 0.5,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 2,
  },
  recentChangesHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 6,
  },
  recentChangesBlock: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  recentChangeDate: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
  },
  recentChangeText: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 2,
  },
  sheetCloseBtn: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCloseText: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // ── Filter Sheet
  filterSheetContainer: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  filterSheetHeading: {
    ...adminType.title,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  filterFieldLabel: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 10,
    marginBottom: 6,
  },
  dropdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
  },
  dropdownSelectedText: {
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  dropdownMenu: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    marginTop: 4,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  dropdownOption: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 11,
    backgroundColor: adminColors.card,
  },
  dropdownOptionSelected: {
    backgroundColor: adminColors.muted,
  },
  dropdownOptionText: {
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  dropdownOptionTextSelected: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  dateInputBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
  },
  dateTextInput: {
    flex: 1,
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    gap: adminSpacing.md,
  },
  applyBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: adminColors.card,
  },
  applyBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  resetBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: adminColors.card,
  },
  resetBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
