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
import Svg, { Circle, Line, Path } from 'react-native-svg';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import type { PricingRecordItem } from '../pricing/MarketPricingOverviewScreen';

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

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface RetailPriceManagementItem {
  id: string;
  product: string;
  grade: 'Grade 1' | 'Grade 2' | 'Grade 3';
  category: 'Vegetables' | 'Root crops & bulbs' | 'Spices';
  ceilingText: string;
  ceilingNum: number;
  retailText: string;
  retailNum: number;
  diffText: string;
  diffNum: number;
  effectiveDate: string;
  status: 'Within ceiling' | 'Action required' | 'No retail price' | 'Review needed' | 'Compliant';
  statusBadge: 'Within ceiling' | 'Action required' | 'No retail price' | 'Review needed';
  actionNote?: string;
  isActionRequired?: boolean;
}

export const INITIAL_RETAIL_MANAGEMENT_ITEMS: RetailPriceManagementItem[] = [
  {
    id: 'rpm-tomato-g1',
    product: 'Tomato',
    grade: 'Grade 1',
    category: 'Vegetables',
    ceilingText: '₹60.00',
    ceilingNum: 60.0,
    retailText: '₹55.00',
    retailNum: 55.0,
    diffText: '₹5.00',
    diffNum: 5.0,
    effectiveDate: 'Effective 10 Oct 2026 - Priya Nair',
    status: 'Within ceiling',
    statusBadge: 'Within ceiling',
  },
  {
    id: 'rpm-carrot-g1',
    product: 'Carrot',
    grade: 'Grade 1',
    category: 'Vegetables',
    ceilingText: '₹70.00',
    ceilingNum: 70.0,
    retailText: '₹74.00',
    retailNum: 74.0,
    diffText: '-₹4.00',
    diffNum: -4.0,
    effectiveDate: 'Effective 9 Oct 2026 - Super Admin',
    status: 'Action required',
    statusBadge: 'Action required',
    actionNote: 'The ceiling was lowered; the price was not rewritten automatically.',
    isActionRequired: true,
  },
  {
    id: 'rpm-tomato-g2',
    product: 'Tomato',
    grade: 'Grade 2',
    category: 'Vegetables',
    ceilingText: '₹50.00',
    ceilingNum: 50.0,
    retailText: '₹50.00',
    retailNum: 50.0,
    diffText: '₹0.00',
    diffNum: 0.0,
    effectiveDate: 'Effective 9 Oct 2026 - Admin',
    status: 'Within ceiling',
    statusBadge: 'Within ceiling',
  },
  {
    id: 'rpm-beans-g1',
    product: 'Beans',
    grade: 'Grade 1',
    category: 'Vegetables',
    ceilingText: '₹80.00',
    ceilingNum: 80.0,
    retailText: '₹75.00',
    retailNum: 75.0,
    diffText: '₹5.00',
    diffNum: 5.0,
    effectiveDate: 'Effective 5 Oct 2026 - Admin',
    status: 'Within ceiling',
    statusBadge: 'Within ceiling',
  },
  {
    id: 'rpm-garlic-g1',
    product: 'Garlic',
    grade: 'Grade 1',
    category: 'Spices',
    ceilingText: '₹90.00',
    ceilingNum: 90.0,
    retailText: 'none',
    retailNum: 0,
    diffText: 'not comparable',
    diffNum: 0,
    effectiveDate: 'Updated 1 Apr 2026',
    status: 'No retail price',
    statusBadge: 'No retail price',
    actionNote: 'Missing retail price.',
  },
];

// Backward-compatible interface for FarmerAdminDashboardScreen & legacy callers
export interface RetailPriceItem {
  id: string;
  cropGrade?: string;
  product: string;
  grade: string;
  purchasePrice: string;
  markup: string;
  expenses: string;
  expensesDetail?: string;
  retailPrice: string;
  customerDiscount: string;
  effectiveDate: string;
  status: 'Active' | 'Pending Review' | 'Review needed' | 'Compliant' | 'Action required' | 'No retail price' | 'Within ceiling';
  category: 'Vegetables' | 'Fruits' | 'Root crops & bulbs' | 'Spices';
  ceilingText?: string;
  ceilingNum?: number;
  retailText?: string;
  retailNum?: number;
  diffText?: string;
  diffNum?: number;
  actionNote?: string;
  isActionRequired?: boolean;
}
export const SAMPLE_RETAIL_PRICES = INITIAL_RETAIL_MANAGEMENT_ITEMS;

// ─── Component Props ──────────────────────────────────────────────────────────

export interface RetailPricingScreenProps {
  onBack: () => void;
  onEditRetailPrice?: (record: PricingRecordItem) => void;
  onSelectBreakdown?: (item?: any) => void;
}

export function RetailPricingScreen({
  onBack,
  onEditRetailPrice,
}: RetailPricingScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<RetailPriceManagementItem[]>(INITIAL_RETAIL_MANAGEMENT_ITEMS);

  // Inline Edit Drawer state for Tomato · Grade 1
  const [drawerInputPrice, setDrawerInputPrice] = useState('58.00');

  // Filter popup state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [appliedCategory, setAppliedCategory] = useState<'All' | 'Vegetables' | 'Root crops & bulbs' | 'Spices'>('All');
  const [appliedGrade, setAppliedGrade] = useState<'All' | 'Grade 1' | 'Grade 2' | 'Grade 3'>('All');
  const [appliedStatus, setAppliedStatus] = useState<'All' | 'Compliant' | 'Action required' | 'No retail price' | 'Review needed'>('All');

  // Draft filter state for inside popup
  const [draftCategory, setDraftCategory] = useState<'All' | 'Vegetables' | 'Root crops & bulbs' | 'Spices'>('All');
  const [draftGrade, setDraftGrade] = useState<'All' | 'Grade 1' | 'Grade 2' | 'Grade 3'>('All');
  const [draftStatus, setDraftStatus] = useState<'All' | 'Compliant' | 'Action required' | 'No retail price' | 'Review needed'>('All');

  // Dropdown open toggles inside filter popup
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const openFilterModal = () => {
    setDraftCategory(appliedCategory);
    setDraftGrade(appliedGrade);
    setDraftStatus(appliedStatus);
    setCategoryDropdownOpen(false);
    setGradeDropdownOpen(false);
    setStatusDropdownOpen(false);
    setFilterModalVisible(true);
  };

  const handleApplyFilter = () => {
    setAppliedCategory(draftCategory);
    setAppliedGrade(draftGrade);
    setAppliedStatus(draftStatus);
    setFilterModalVisible(false);
  };

  const handleResetFilter = () => {
    setDraftCategory('All');
    setDraftGrade('All');
    setDraftStatus('All');
    setAppliedCategory('All');
    setAppliedGrade('All');
    setAppliedStatus('All');
    setFilterModalVisible(false);
  };

  // Live calculation for drawer
  const drawerCalc = useMemo(() => {
    const rawNum = parseFloat(drawerInputPrice.replace(/[^0-9.]/g, '')) || 0;
    const ceiling = 60.0;
    const diff = ceiling - rawNum;
    const isWithin = rawNum <= ceiling;
    return {
      proposed: `₹${rawNum.toFixed(2)}`,
      diffText: diff >= 0 ? `₹${diff.toFixed(2)} below` : `₹${Math.abs(diff).toFixed(2)} above`,
      isWithin,
      statusText: isWithin ? 'Within ceiling' : 'Above ceiling',
    };
  }, [drawerInputPrice]);

  // Filtering items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches =
          item.product.toLowerCase().includes(q) ||
          item.grade.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (appliedCategory !== 'All' && item.category !== appliedCategory) {
        return false;
      }
      if (appliedGrade !== 'All' && item.grade !== appliedGrade) {
        return false;
      }
      if (appliedStatus !== 'All') {
        if (appliedStatus === 'Compliant' && item.status !== 'Within ceiling' && item.status !== 'Compliant') {
          return false;
        }
        if (appliedStatus === 'Action required' && item.status !== 'Action required') {
          return false;
        }
        if (appliedStatus === 'No retail price' && item.status !== 'No retail price') {
          return false;
        }
      }

      return true;
    });
  }, [items, searchQuery, appliedCategory, appliedGrade, appliedStatus]);

  // Handler to open full EditRetailPriceScreen
  const handleEditClick = (item: RetailPriceManagementItem) => {
    if (onEditRetailPrice) {
      const pricingRecord: PricingRecordItem = {
        id: item.id,
        product: item.product,
        grade: item.grade,
        category: item.category,
        badge: item.isActionRequired
          ? 'Action required'
          : item.status === 'No retail price'
          ? 'No retail price'
          : 'Compliant',
        ceiling: `₹${item.ceilingNum.toFixed(2)}/kg`,
        retailPrice: item.retailNum > 0 ? `₹${item.retailNum.toFixed(2)}/kg` : 'none',
        difference: item.diffText,
        updatedAt: item.effectiveDate,
        farmerPurchasePrice: '₹42.00/kg',
        pricingUnit: '₹/kg',
      };
      onEditRetailPrice(pricingRecord);
    }
  };

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
          <Text style={styles.headerTitle} numberOfLines={1}>
            Retail Price Management
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar with Horizontal Sliders Filter Icon */}
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
            onPress={openFilterModal}
            activeOpacity={0.7}
            accessibilityLabel="Open filters"
          >
            <HorizontalSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Counter Subtitle */}
        <Text style={styles.recordCountText}>
          {filteredItems.length} grades
          {appliedStatus !== 'All' ? ` · ${appliedStatus}` : ''}
        </Text>

        {/* ── Item 1: Tomato · Grade 1 ── */}
        {filteredItems.some((i) => i.id === 'rpm-tomato-g1') && (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Tomato · Grade 1</Text>
                <View style={styles.badgeWithinCeiling}>
                  <Text style={styles.badgeWithinCeilingText}>Within ceiling</Text>
                </View>
              </View>

              <Text style={styles.cardSubtitle1}>
                Ceiling ₹60.00 · Retail ₹55.00 · Diff ₹5.00
              </Text>
              <Text style={styles.cardSubtitle2}>
                Effective 10 Oct 2026 - Priya Nair
              </Text>

              <TouchableOpacity
                style={styles.editOutlinedBtn}
                onPress={() => {
                  const itm = items.find((i) => i.id === 'rpm-tomato-g1')!;
                  handleEditClick(itm);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.editOutlinedBtnText}>Edit Retail Price</Text>
              </TouchableOpacity>
            </View>

            {/* ── Edit Drawer Section for Tomato · Grade 1 Matching Image 1 ── */}
            <Text style={styles.drawerSectionHeading}>
              Edit drawer (Tomato · Grade 1)
            </Text>

            <View style={styles.drawerCard}>
              <View style={styles.drawerRow}>
                <Text style={styles.drawerLabel}>Current price</Text>
                <Text style={styles.drawerValBold}>₹55.00</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.drawerRow}>
                <Text style={styles.drawerLabel}>Ceiling in force</Text>
                <Text style={styles.drawerValBold}>₹60.00</Text>
              </View>
              <View style={styles.divider} />

              <Text style={styles.inputFieldLabel}>New price *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.drawerTextInput}
                  value={drawerInputPrice.startsWith('₹') ? drawerInputPrice : `₹${drawerInputPrice}`}
                  onChangeText={(val) => setDrawerInputPrice(val.replace('₹', ''))}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.drawerRow, { marginTop: 14 }]}>
                <Text style={styles.drawerLabel}>Proposed</Text>
                <Text style={styles.drawerValBold}>{drawerCalc.proposed}</Text>
              </View>

              <View style={[styles.drawerRow, { marginTop: 8 }]}>
                <Text style={styles.drawerLabel}>Difference from ceiling</Text>
                <Text
                  style={[
                    styles.drawerValBold,
                    {
                      color: drawerCalc.isWithin
                        ? adminColors.success.text
                        : adminColors.danger.text,
                    },
                  ]}
                >
                  {drawerCalc.diffText}
                </Text>
              </View>

              <View style={[styles.drawerRow, { marginTop: 8 }]}>
                <Text style={styles.drawerLabel}>Status</Text>
                <Text
                  style={[
                    styles.drawerValBold,
                    {
                      color: drawerCalc.isWithin
                        ? adminColors.success.text
                        : adminColors.danger.text,
                    },
                  ]}
                >
                  {drawerCalc.statusText}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── Item 2: Carrot · Grade 1 with Red Border Matching Image 1 ── */}
        {filteredItems.some((i) => i.id === 'rpm-carrot-g1') && (
          <View style={styles.dangerCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Carrot · Grade 1</Text>
              <View style={styles.badgeActionRequired}>
                <Text style={styles.badgeActionRequiredText}>Action required</Text>
              </View>
            </View>

            <Text style={styles.cardSubtitle1}>
              Ceiling ₹70.00 · Retail ₹74.00 · Diff -₹4.00
            </Text>
            <Text style={styles.cardSubtitle2}>
              The ceiling was lowered; the price was not rewritten automatically.
            </Text>

            <TouchableOpacity
              style={styles.editFilledBtn}
              onPress={() => {
                const itm = items.find((i) => i.id === 'rpm-carrot-g1')!;
                handleEditClick(itm);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.editFilledBtnText}>Edit Retail Price</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Remaining Items ── */}
        {filteredItems
          .filter((i) => i.id !== 'rpm-tomato-g1' && i.id !== 'rpm-carrot-g1')
          .map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>
                  {item.product} · {item.grade}
                </Text>
                <View
                  style={
                    item.status === 'No retail price'
                      ? styles.badgeNoRetail
                      : styles.badgeWithinCeiling
                  }
                >
                  <Text
                    style={
                      item.status === 'No retail price'
                        ? styles.badgeNoRetailText
                        : styles.badgeWithinCeilingText
                    }
                  >
                    {item.statusBadge}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardSubtitle1}>
                Ceiling {item.ceilingText} · Retail {item.retailText} · Diff {item.diffText}
              </Text>
              <Text style={styles.cardSubtitle2}>{item.effectiveDate}</Text>

              <TouchableOpacity
                style={styles.editOutlinedBtn}
                onPress={() => handleEditClick(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.editOutlinedBtnText}>Edit Retail Price</Text>
              </TouchableOpacity>
            </View>
          ))}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ─── Filters Bottom Sheet Modal (Images 2, 3, 4) ─── */}
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

            {/* 1. Category Dropdown (Image 2) */}
            <Text style={styles.filterFieldLabel}>Category</Text>
            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => {
                setCategoryDropdownOpen(!categoryDropdownOpen);
                setGradeDropdownOpen(false);
                setStatusDropdownOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownSelectedText}>{draftCategory}</Text>
              <ChevronDownIcon size={18} color={adminColors.ink} />
            </TouchableOpacity>

            {categoryDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {(['All', 'Vegetables', 'Root crops & bulbs', 'Spices'] as const).map((cat) => {
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

            {/* 2. Grade Dropdown (Image 3) */}
            <Text style={styles.filterFieldLabel}>Grade</Text>
            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => {
                setGradeDropdownOpen(!gradeDropdownOpen);
                setCategoryDropdownOpen(false);
                setStatusDropdownOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownSelectedText}>{draftGrade}</Text>
              <ChevronDownIcon size={18} color={adminColors.ink} />
            </TouchableOpacity>

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

            {/* 3. Status Dropdown (Image 4) */}
            <Text style={styles.filterFieldLabel}>Status</Text>
            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => {
                setStatusDropdownOpen(!statusDropdownOpen);
                setCategoryDropdownOpen(false);
                setGradeDropdownOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownSelectedText}>{draftStatus}</Text>
              <ChevronDownIcon size={18} color={adminColors.ink} />
            </TouchableOpacity>

            {statusDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {(
                  [
                    'All',
                    'Compliant',
                    'Action required',
                    'No retail price',
                    'Review needed',
                  ] as const
                ).map((st) => {
                  const isSelected = draftStatus === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                      onPress={() => {
                        setDraftStatus(st);
                        setStatusDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          isSelected && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Actions Row */}
            <View style={styles.filterActionsRow}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApplyFilter}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={handleResetFilter}
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
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    flex: 1,
  },

  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
  },

  // Search Bar
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

  recordCountText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },

  // Standard Card
  card: {
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
  badgeWithinCeiling: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
  },
  badgeWithinCeilingText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  badgeNoRetail: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.warning.bg,
  },
  badgeNoRetailText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.warning.text,
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

  editOutlinedBtn: {
    marginTop: 12,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: adminColors.card,
  },
  editOutlinedBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Danger Card with Red Border Matching Image 1
  dangerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    borderWidth: 1.5,
    borderColor: adminColors.danger.border,
    ...adminShadow.sm,
  },
  badgeActionRequired: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.danger.bg,
  },
  badgeActionRequiredText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  editFilledBtn: {
    marginTop: 12,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editFilledBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.onBrand,
  },

  // Edit Drawer Card Matching Image 1
  drawerSectionHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 8,
    marginTop: 4,
  },
  drawerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  drawerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  drawerLabel: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.muted,
  },
  drawerValBold: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 6,
  },
  inputFieldLabel: {
    ...adminType.rowTitle,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 8,
    marginBottom: 6,
  },
  inputWrapper: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
  },
  drawerTextInput: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    paddingVertical: 0,
  },

  // Filter Sheet Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
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
