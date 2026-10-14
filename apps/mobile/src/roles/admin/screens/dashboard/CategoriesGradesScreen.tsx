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

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

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
  labelMuted: adminColors.muted,

  // Badges & Buttons
  activeBadgeBg: adminColors.success.bg,
  activeBadgeText: adminColors.success.text,
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
  // Navigation state between list and category detail (Image 3)
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Matching Screenshot 1 & 3 Exactly ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Categories & Grades</Text>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedCategory ? (
          /* ─── Category Detail Screen (Image 3 Request) ─── */
          <>
            {/* Top 2x2 Metadata Card */}
            <View style={styles.detailCard}>
              {/* Row 1: Category Name & Category Code */}
              <View style={styles.detailGridRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Category Name</Text>
                  <Text style={styles.detailValue}>{selectedCategory.name}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Category Code</Text>
                  <Text style={styles.detailValue}>{selectedCategory.code}</Text>
                </View>
              </View>

              {/* Row 2: Product Count & Status */}
              <View style={[styles.detailGridRow, { marginTop: adminSpacing.lg }]}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Product Count</Text>
                  <Text style={styles.detailValue}>{selectedCategory.productCount}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>{selectedCategory.status}</Text>
                </View>
              </View>
            </View>

            {/* Section: Products */}
            <Text style={styles.sectionHeading}>Products</Text>

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
              <Text style={styles.backToCategoriesBtnText}>Back to Categories</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ─── Category List & Grade Reference (Image 1 Request) ─── */
          <>
            {/* Section 1: Category List */}
            <Text style={styles.sectionHeading}>Category List</Text>

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
            <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>
              Grade Reference
            </Text>

            {GRADE_REFERENCE_LIST.map((grade) => (
              <View key={grade.id} style={styles.gradeCard}>
                <Text style={styles.gradeLabel}>{grade.gradeLabel}</Text>
                <Text style={styles.gradeDescription}>{grade.description}</Text>
              </View>
            ))}
          </>
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

  // Header (Screenshot 1 & 3)
  header: {
    backgroundColor: THEME.headerBg,
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
    paddingVertical: 4,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.white,
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
    fontSize: 16,
    fontWeight: '700',
    color: THEME.titleRustDark,
    marginBottom: adminSpacing.sm,
    letterSpacing: -0.2,
  },

  // Category Cards (Screenshot 1 Top)
  categoryCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.ink,
  },
  categorySubtext: {
    fontSize: 13,
    color: THEME.labelMuted,
    marginTop: 6,
  },
  activeBadge: {
    backgroundColor: THEME.activeBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.activeBadgeText,
  },

  // Grade Reference Cards (Screenshot 1 Bottom)
  gradeCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  gradeLabel: {
    ...adminType.caption,
    fontSize: 11,
    color: THEME.labelMuted,
    textTransform: 'none',
  },
  gradeDescription: {
    ...adminType.rowTitle,
    fontSize: 15,
    color: THEME.ink,
    marginTop: 4,
    lineHeight: 20,
  },

  // Category Detail Screen (Image 3)
  detailCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  detailGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: THEME.labelMuted,
  },
  detailValue: {
    ...adminType.title,
    fontSize: 16,
    color: THEME.ink,
    marginTop: 4,
  },

  // Products Card (Image 3)
  productsCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
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
    backgroundColor: THEME.canvas,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  productPillText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: THEME.ink,
  },

  // Back to Categories Button (Image 3)
  backToCategoriesBtn: {
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToCategoriesBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: THEME.titleRustDark,
  },
});
