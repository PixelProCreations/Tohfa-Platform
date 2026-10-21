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

// ─── Data Interfaces ─────────────────────────────────────────────────────────

export interface CategoryDetailItem {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'Active' | 'Inactive';
  associatedProducts: string[];
  gradeConfig: string;
  created: string;
  updated: string;
  subtitle: string;
  linkedProductsText: string;
  productsInCat: {
    product: string;
    grades: string;
  }[];
}

export interface GradeDetailItem {
  id: string;
  label: string;
  status: 'Active' | 'Inactive';
  codePrefix: string;
  meaning: string;
  applicableProducts: string[];
  pricingRecordsCount: number;
  subtitleRecordsText: string;
}

// ─── Fixtures Matching Design Mockups ───────────────────────────────────────

export const CATEGORIES_DATA: CategoryDetailItem[] = [
  {
    id: 'cat-veg',
    name: 'Vegetables',
    code: 'CAT-01',
    description: 'Demo category (proposed).',
    status: 'Active',
    associatedProducts: ['Tomato', 'Beans', 'Cabbage', 'Carrot'],
    gradeConfig: 'Not configured per category',
    created: '1 Mar 2026',
    updated: '12 Sep 2026, 09:00',
    subtitle: 'CAT-01 · Fresh vegetable produce',
    linkedProductsText: '4 linked products · Updated 12 Sep 2026',
    productsInCat: [
      { product: 'Tomato', grades: 'Grade 1, Grade 2, Grade 3' },
      { product: 'Beans', grades: 'Grade 1, Grade 2' },
      { product: 'Cabbage', grades: 'Grade 1, Grade 2' },
    ],
  },
  {
    id: 'cat-spices',
    name: 'Spices',
    code: 'CAT-02',
    description: 'Dried and bulb spices.',
    status: 'Active',
    associatedProducts: ['Garlic', 'Ginger'],
    gradeConfig: 'Not configured per category',
    created: '1 Mar 2026',
    updated: '2 Aug 2026, 14:00',
    subtitle: 'CAT-02 · Dried and bulb spices',
    linkedProductsText: '2 linked products · Updated 2 Aug 2026',
    productsInCat: [
      { product: 'Garlic', grades: 'Grade 1' },
      { product: 'Ginger', grades: 'Grade 1' },
    ],
  },
];

export const GRADES_DATA: GradeDetailItem[] = [
  {
    id: 'gr-1',
    label: 'Grade 1',
    status: 'Active',
    codePrefix: 'GR-1',
    meaning: 'Quality criteria are not defined in this module.',
    applicableProducts: ['Tomato', 'Beans', 'Cabbage', 'Carrot', 'Potato', 'Garlic'],
    pricingRecordsCount: 6,
    subtitleRecordsText: 'Pricing records 6',
  },
  {
    id: 'gr-2',
    label: 'Grade 2',
    status: 'Active',
    codePrefix: 'GR-2',
    meaning: 'Quality criteria are not defined in this module.',
    applicableProducts: ['Tomato', 'Beans', 'Cabbage', 'Carrot', 'Potato'],
    pricingRecordsCount: 5,
    subtitleRecordsText: 'Pricing records 5',
  },
  {
    id: 'gr-3',
    label: 'Grade 3',
    status: 'Active',
    codePrefix: 'GR-3',
    meaning: 'Quality criteria are not defined in this module.',
    applicableProducts: ['Tomato', 'Carrot'],
    pricingRecordsCount: 2,
    subtitleRecordsText: 'Pricing records 2',
  },
  {
    id: 'gr-reject',
    label: 'Reject',
    status: 'Active',
    codePrefix: 'GR-4',
    meaning: 'Quality criteria are not defined in this module.',
    applicableProducts: [],
    pricingRecordsCount: 0,
    subtitleRecordsText: 'Pricing records 0 (this grade is not priced)',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface CategoriesGradesScreenProps {
  onBack: () => void;
}

export function CategoriesGradesScreen({ onBack }: CategoriesGradesScreenProps) {
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState<'categories' | 'grades'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<CategoryDetailItem | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<GradeDetailItem | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter popup modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filter criteria for Categories
  const [appliedCatStatus, setAppliedCatStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [appliedCatProducts, setAppliedCatProducts] = useState<'All' | 'With products (2+)' | 'Without products'>('All');
  const [draftCatStatus, setDraftCatStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [draftCatProducts, setDraftCatProducts] = useState<'All' | 'With products (2+)' | 'Without products'>('All');

  // Filter criteria for Grades
  const [appliedGradeStatus, setAppliedGradeStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [appliedGradeRecords, setAppliedGradeRecords] = useState<'All' | 'With pricing records' | 'Zero pricing records (Unpriced)'>('All');
  const [draftGradeStatus, setDraftGradeStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [draftGradeRecords, setDraftGradeRecords] = useState<'All' | 'With pricing records' | 'Zero pricing records (Unpriced)'>('All');

  // Dropdown open toggles in Filter popup
  const [catStatusDropdownOpen, setCatStatusDropdownOpen] = useState(false);
  const [catProductsDropdownOpen, setCatProductsDropdownOpen] = useState(false);
  const [gradeStatusDropdownOpen, setGradeStatusDropdownOpen] = useState(false);
  const [gradeRecordsDropdownOpen, setGradeRecordsDropdownOpen] = useState(false);

  const openFilterModal = () => {
    setDraftCatStatus(appliedCatStatus);
    setDraftCatProducts(appliedCatProducts);
    setDraftGradeStatus(appliedGradeStatus);
    setDraftGradeRecords(appliedGradeRecords);
    setCatStatusDropdownOpen(false);
    setCatProductsDropdownOpen(false);
    setGradeStatusDropdownOpen(false);
    setGradeRecordsDropdownOpen(false);
    setFilterModalVisible(true);
  };

  const handleApplyFilter = () => {
    setAppliedCatStatus(draftCatStatus);
    setAppliedCatProducts(draftCatProducts);
    setAppliedGradeStatus(draftGradeStatus);
    setAppliedGradeRecords(draftGradeRecords);
    setFilterModalVisible(false);
  };

  const handleResetFilter = () => {
    if (activeTab === 'categories') {
      setDraftCatStatus('All');
      setDraftCatProducts('All');
      setAppliedCatStatus('All');
      setAppliedCatProducts('All');
    } else {
      setDraftGradeStatus('All');
      setDraftGradeRecords('All');
      setAppliedGradeStatus('All');
      setAppliedGradeRecords('All');
    }
    setFilterModalVisible(false);
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return CATEGORIES_DATA.filter((cat) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches =
          cat.name.toLowerCase().includes(q) ||
          cat.code.toLowerCase().includes(q) ||
          cat.associatedProducts.some((p) => p.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (appliedCatStatus !== 'All' && cat.status !== appliedCatStatus) {
        return false;
      }

      if (appliedCatProducts === 'With products (2+)' && cat.associatedProducts.length < 2) {
        return false;
      }
      if (appliedCatProducts === 'Without products' && cat.associatedProducts.length > 0) {
        return false;
      }

      return true;
    });
  }, [searchQuery, appliedCatStatus, appliedCatProducts]);

  // Filtered grades
  const filteredGrades = useMemo(() => {
    return GRADES_DATA.filter((grade) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches =
          grade.label.toLowerCase().includes(q) ||
          grade.codePrefix.toLowerCase().includes(q) ||
          grade.applicableProducts.some((p) => p.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (appliedGradeStatus !== 'All' && grade.status !== appliedGradeStatus) {
        return false;
      }

      if (appliedGradeRecords === 'With pricing records' && grade.pricingRecordsCount === 0) {
        return false;
      }
      if (appliedGradeRecords === 'Zero pricing records (Unpriced)' && grade.pricingRecordsCount > 0) {
        return false;
      }

      return true;
    });
  }, [searchQuery, appliedGradeStatus, appliedGradeRecords]);

  // Header back navigation
  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Orange Gradient Header ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectedCategory ? selectedCategory.name : 'Categories & Grades'}
          </Text>
        </View>
      </View>

      {/* ─── Screen Body ─── */}
      {selectedCategory ? (
        /* ═════ Category Detail View (Image 2 Left) ═════ */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Category Metadata */}
          <Text style={styles.sectionHeading}>
            Category {selectedCategory.code}
          </Text>
          <View style={styles.detailCard}>
            <View style={styles.specRow}>
              <Text style={styles.specKey}>Name</Text>
              <Text style={styles.specValBold}>{selectedCategory.name}</Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.specRow}>
              <Text style={styles.specKey}>Description</Text>
              <Text style={styles.specValBold}>{selectedCategory.description}</Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.specRow}>
              <Text style={styles.specKey}>Status</Text>
              <Text style={styles.specValBold}>{selectedCategory.status}</Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.specRow}>
              <Text style={styles.specKey}>Associated products</Text>
              <Text style={styles.specValBold}>
                {selectedCategory.associatedProducts.join(', ')}
              </Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.specRow}>
              <Text style={styles.specKey}>Grade configuration</Text>
              <Text style={styles.specValBold}>{selectedCategory.gradeConfig}</Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.specRow}>
              <Text style={styles.specKey}>Created</Text>
              <Text style={styles.specValBold}>{selectedCategory.created}</Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.specRow}>
              <Text style={styles.specKey}>Updated</Text>
              <Text style={styles.specValBold}>{selectedCategory.updated}</Text>
            </View>
          </View>

          {/* Card 2: Products in Category */}
          <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>
            Products in {selectedCategory.name}
          </Text>
          <View style={styles.detailCard}>
            {selectedCategory.productsInCat.map((item, idx) => (
              <React.Fragment key={item.product}>
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>{item.product}</Text>
                  <Text style={styles.specValBold}>{item.grades}</Text>
                </View>
                {idx < selectedCategory.productsInCat.length - 1 && (
                  <View style={styles.dottedDivider} />
                )}
              </React.Fragment>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* ═════ Categories & Grades Main Tabs (Images 1, 2 Right, 3 Left) ═════ */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Segmented Control Switch */}
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeTab === 'categories' && styles.segmentBtnActive,
              ]}
              onPress={() => setActiveTab('categories')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  activeTab === 'categories' && styles.segmentBtnTextActive,
                ]}
              >
                Categories
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeTab === 'grades' && styles.segmentBtnActive,
              ]}
              onPress={() => setActiveTab('grades')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  activeTab === 'grades' && styles.segmentBtnTextActive,
                ]}
              >
                Grades
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar with Filter Sliders Icon */}
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

          {/* Active Tab Content */}
          {activeTab === 'categories' ? (
            /* ── Categories List ── */
            <>
              <Text style={styles.recordCountText}>
                {filteredCategories.length} categories
                {appliedCatStatus !== 'All' ? ` · ${appliedCatStatus}` : ''}
              </Text>

              {filteredCategories.map((cat) => (
                <View key={cat.id} style={styles.itemCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{cat.name}</Text>
                    <View style={styles.badgeActive}>
                      <Text style={styles.badgeActiveText}>{cat.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardSubtitle1}>{cat.subtitle}</Text>
                  <Text style={styles.cardSubtitle2}>{cat.linkedProductsText}</Text>

                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cardActionText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : (
            /* ── Grades List ── */
            <>
              <Text style={styles.recordCountText}>
                {filteredGrades.length} grades
                {appliedGradeStatus !== 'All' ? ` · ${appliedGradeStatus}` : ''}
              </Text>

              {filteredGrades.map((grade) => (
                <View key={grade.id} style={styles.itemCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{grade.label}</Text>
                    <View style={styles.badgeActive}>
                      <Text style={styles.badgeActiveText}>{grade.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardSubtitle1}>
                    {grade.codePrefix} · {grade.meaning}
                  </Text>
                  <Text style={styles.cardSubtitle2}>
                    {grade.applicableProducts.length > 0
                      ? `Applicable products ${grade.applicableProducts.join(', ')}`
                      : 'Applicable products none priced'}
                  </Text>
                  <Text style={styles.cardSubtitle3}>{grade.subtitleRecordsText}</Text>

                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => setSelectedGrade(grade)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cardActionText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ─── Grade Details Bottom Sheet Modal (Image 3 Right) ─── */}
      <Modal
        visible={selectedGrade !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedGrade(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedGrade(null)}
        >
          <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>
              Grade: {selectedGrade?.label}
            </Text>

            {/* Spec Card with Dotted Lines */}
            <View style={styles.detailCard}>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Grade</Text>
                <Text style={styles.specValBold}>{selectedGrade?.label}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Meaning and criteria</Text>
                <Text style={styles.specValBold} numberOfLines={2}>
                  {selectedGrade?.meaning}
                </Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Status</Text>
                <Text style={styles.specValBold}>{selectedGrade?.status}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Pricing records</Text>
                <Text style={styles.specValBold}>{selectedGrade?.pricingRecordsCount}</Text>
              </View>
              <View style={styles.dottedDivider} />

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Products</Text>
                <Text style={[styles.specValBold, { flex: 1, textAlign: 'right', marginLeft: 12 }]}>
                  {selectedGrade && selectedGrade.applicableProducts.length > 0
                    ? selectedGrade.applicableProducts.join(', ')
                    : 'none'}
                </Text>
              </View>
            </View>

            {/* Explanatory Footnote */}
            <Text style={styles.sheetFootnote}>
              Grade names are not changed here, and a grade change would never rewrite historical prices or transactions.
            </Text>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setSelectedGrade(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetCloseText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Suitable Filters Bottom Sheet Modal for Categories & Grades ─── */}
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

            {activeTab === 'categories' ? (
              /* ── Filter Fields for Categories ── */
              <>
                <Text style={styles.filterFieldLabel}>Status</Text>
                <TouchableOpacity
                  style={styles.dropdownBox}
                  onPress={() => {
                    setCatStatusDropdownOpen(!catStatusDropdownOpen);
                    setCatProductsDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectedText}>{draftCatStatus}</Text>
                  <ChevronDownIcon size={18} color={adminColors.ink} />
                </TouchableOpacity>

                {catStatusDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(['All', 'Active', 'Inactive'] as const).map((opt) => {
                      const isSelected = draftCatStatus === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                          onPress={() => {
                            setDraftCatStatus(opt);
                            setCatStatusDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <Text style={styles.filterFieldLabel}>Linked Products</Text>
                <TouchableOpacity
                  style={styles.dropdownBox}
                  onPress={() => {
                    setCatProductsDropdownOpen(!catProductsDropdownOpen);
                    setCatStatusDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectedText}>{draftCatProducts}</Text>
                  <ChevronDownIcon size={18} color={adminColors.ink} />
                </TouchableOpacity>

                {catProductsDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(['All', 'With products (2+)', 'Without products'] as const).map((opt) => {
                      const isSelected = draftCatProducts === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                          onPress={() => {
                            setDraftCatProducts(opt);
                            setCatProductsDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              /* ── Filter Fields for Grades ── */
              <>
                <Text style={styles.filterFieldLabel}>Status</Text>
                <TouchableOpacity
                  style={styles.dropdownBox}
                  onPress={() => {
                    setGradeStatusDropdownOpen(!gradeStatusDropdownOpen);
                    setGradeRecordsDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectedText}>{draftGradeStatus}</Text>
                  <ChevronDownIcon size={18} color={adminColors.ink} />
                </TouchableOpacity>

                {gradeStatusDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(['All', 'Active', 'Inactive'] as const).map((opt) => {
                      const isSelected = draftGradeStatus === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                          onPress={() => {
                            setDraftGradeStatus(opt);
                            setGradeStatusDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <Text style={styles.filterFieldLabel}>Pricing Records</Text>
                <TouchableOpacity
                  style={styles.dropdownBox}
                  onPress={() => {
                    setGradeRecordsDropdownOpen(!gradeRecordsDropdownOpen);
                    setGradeStatusDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectedText}>{draftGradeRecords}</Text>
                  <ChevronDownIcon size={18} color={adminColors.ink} />
                </TouchableOpacity>

                {gradeRecordsDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(
                      [
                        'All',
                        'With pricing records',
                        'Zero pricing records (Unpriced)',
                      ] as const
                    ).map((opt) => {
                      const isSelected = draftGradeRecords === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                          onPress={() => {
                            setDraftGradeRecords(opt);
                            setGradeRecordsDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {/* Filter Action Buttons (Apply & Reset Pills) */}
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

  // Segmented Tabs
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: adminRadius.md,
  },
  segmentBtnActive: {
    backgroundColor: adminColors.brand,
  },
  segmentBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  segmentBtnTextActive: {
    color: adminColors.onBrand,
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

  // List Cards
  itemCard: {
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
  badgeActive: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
  },
  badgeActiveText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.success.text,
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
  cardSubtitle3: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
  },
  cardActionBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  cardActionText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // Details Card
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 8,
  },
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
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

  // Modal Overlays
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
  sheetFootnote: {
    ...adminType.caption,
    fontSize: 11.5,
    lineHeight: 16,
    color: adminColors.muted,
    marginVertical: adminSpacing.md,
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

  // Filter Sheet Modal
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
