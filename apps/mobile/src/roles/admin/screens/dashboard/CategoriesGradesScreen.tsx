import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { t } from '../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

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

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface CategoryItem {
  id: string;
  name: string;
  code: string;
  productCount: number;
  products: string[];
  itemsSummary: string;
  status: 'Active';
}

export interface GradeItem {
  id: string;
  gradeLabel: string;
  description: string;
}

export const CATEGORY_LIST: CategoryItem[] = [
  {
    id: 'cat-veg',
    name: 'Vegetables',
    code: 'CAT-VEG',
    productCount: 4,
    products: ['Carrot', 'Cabbage', 'Radish', 'Beans'],
    itemsSummary: 'Carrot, Cabbage, Radish, Beans',
    status: 'Active',
  },
  {
    id: 'cat-fruit',
    name: 'Fruits',
    code: 'CAT-FRUIT',
    productCount: 3,
    products: ['Apple', 'Orange', 'Banana'],
    itemsSummary: 'Apple, Orange, Banana',
    status: 'Active',
  },
];

export const GRADE_REFERENCE_LIST: GradeItem[] = [
  {
    id: 'g-1',
    gradeLabel: 'Grade 1',
    description: 'Premium quality',
  },
  {
    id: 'g-2',
    gradeLabel: 'Grade 2',
    description: 'Standard quality',
  },
  {
    id: 'g-3',
    gradeLabel: 'Grade 3',
    description: 'Configured lower grade',
  },
  {
    id: 'g-reject',
    gradeLabel: 'Reject',
    description: 'Not eligible for normal approved produce sale where applicable',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface CategoriesGradesScreenProps {
  onBack: () => void;
}

export function CategoriesGradesScreen({ onBack }: CategoriesGradesScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);

  const handleHeaderBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
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
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('categoriesGrades.title')}</Text>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedCategory ? (
          /* ─── Category Detail Screen ─── */
          <>
            {/* Top 2x2 Metadata Card */}
            <View style={styles.detailCard}>
              {/* Row 1: Category Name & Category Code */}
              <View style={styles.detailGridRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('categoriesGrades.tab.categories')}</Text>
                  <Text style={styles.detailValue}>{selectedCategory.name}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('categoriesGrades.detail.categoryCode')}</Text>
                  <Text style={styles.detailValue}>{selectedCategory.code}</Text>
                </View>
              </View>

              {/* Row 2: Product Count & Status */}
              <View style={[styles.detailGridRow, styles.detailRowSpacing]}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('categoriesGrades.detail.totalProducts')}</Text>
                  <Text style={styles.detailValue}>{selectedCategory.productCount}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('approvedInputs.filterByStatus')}</Text>
                  <Text style={styles.detailValue}>{selectedCategory.status}</Text>
                </View>
              </View>
            </View>

            {/* Section: Products */}
            <Text style={styles.sectionHeading}>{t('categoriesGrades.detail.associatedProducts')}</Text>

            {/* Products Chips Card */}
            <View style={styles.productsCard}>
              <View style={styles.productsWrap}>
                {selectedCategory.products.map((prod) => (
                  <View key={prod} style={styles.productPill}>
                    <Text style={styles.productPillText}>{prod}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Button: Back to Categories */}
            <TouchableOpacity
              style={styles.backToCategoriesBtn}
              onPress={() => setSelectedCategory(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.backToCategoriesBtnText}>{t('categoriesGrades.detail.backToCategories')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ─── Category List & Grade Reference ─── */
          <>
            {/* Section 1: Category List */}
            <Text style={styles.sectionHeading}>{t('categoriesGrades.tab.categories')}</Text>

            {CATEGORY_LIST.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.85}
              >
                <View style={styles.categoryHeaderRow}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>{cat.status}</Text>
                  </View>
                </View>
                <Text style={styles.categorySubtext}>{cat.itemsSummary}</Text>
              </TouchableOpacity>
            ))}

            {/* Section 2: Grade Reference */}
            <Text style={[styles.sectionHeading, styles.gradeSectionSpacing]}>
              {t('categoriesGrades.tab.grades')}
            </Text>

            {GRADE_REFERENCE_LIST.map((grade) => (
              <View key={grade.id} style={styles.gradeCard}>
                <Text style={styles.gradeLabel}>{grade.gradeLabel}</Text>
                <Text style={styles.gradeDescription}>{grade.description}</Text>
              </View>
            ))}
          </>
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backBtn: {
    paddingVertical: adminSpacing.xs,
    paddingRight: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },

  // Scroll Body
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },

  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    letterSpacing: -0.2,
  },
  gradeSectionSpacing: {
    marginTop: adminSpacing.lg,
  },

  // Category Cards
  categoryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  categorySubtext: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  activeBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  activeBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },

  // Grade Reference Cards
  gradeCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  gradeLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    textTransform: 'none',
  },
  gradeDescription: {
    ...adminType.body,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },

  // Category Detail Screen
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
  detailRowSpacing: {
    marginTop: adminSpacing.lg,
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

  // Products Card
  productsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  productsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  productPill: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  productPillText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Back to Categories Button
  backToCategoriesBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToCategoriesBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
