import React from 'react';
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

// ─── Component Props ──────────────────────────────────────────────────────────

export interface MarkupPricingBreakdownScreenProps {
  onBack: () => void;
  record?: any;
  cropGradeTitle?: string | undefined;
  purchasePrice?: string | undefined;
  markup?: string | undefined;
  expensesSummary?: string | undefined;
  retailPrice?: string | undefined;
  customerDiscount?: string | undefined;
  finalCustomerPrice?: string | undefined;
  expenseList?: Array<{ name: string; amount: string }> | undefined;
  ceilingPrice?: string | undefined;
  role?: string | undefined;
}

// ─── Default Data Matching Target Design ──────────────────────────────────────

const DEFAULT_EXPENSES = [
  { name: 'Freight', amount: '₹5.00' },
  { name: 'Loading', amount: '₹2.00' },
  { name: 'Unloading', amount: '₹3.00' },
];

export function MarkupPricingBreakdownScreen({
  onBack,
  record,
  cropGradeTitle,
  purchasePrice,
  retailPrice,
  ceilingPrice,
  role = 'TOHFA_ADMIN',
}: MarkupPricingBreakdownScreenProps) {
  const isFarmerAdmin = role === 'FARMER_ADMIN';
  // Determine item title
  const product = record?.product ?? 'Tomato';
  const grade = record?.grade ?? 'Grade 1';
  const rawTitle = cropGradeTitle || `${product} · ${grade}`;
  const headerTitle = rawTitle.startsWith('Breakdown:') ? rawTitle : `Breakdown: ${rawTitle}`;

  // Pricing values matching M7-S02a
  const farmerPurchasePrice = record?.farmerPurchasePrice ?? purchasePrice ?? '₹42.00/kg';
  const effectiveRetail = record?.retailPrice ?? retailPrice ?? '₹55.00/kg';
  const effectiveCeiling = record?.ceiling ?? ceilingPrice ?? '₹60.00/kg';

  // Validation comparison
  const isOverCeiling = record?.badge === 'Action required' || record?.badge === 'Over ceiling';
  const validationText = isOverCeiling
    ? `(${effectiveRetail}) Retail price above the ceiling`
    : `(${effectiveRetail}) Retail price within the ceiling`;

  if (isFarmerAdmin) {
    const itemTitle = cropGradeTitle || (record?.product ? `${record.product} · ${record.grade || 'Grade 1'}` : 'Carrot · Grade 1');
    const cleanKg = (val?: string) => val ? val.replace(/(\/kg)+/gi, '').trim() + '/kg' : '';
    const pPrice = cleanKg(purchasePrice || record?.purchasePrice || '₹80.00');
    const rPrice = cleanKg(retailPrice || record?.retailPrice || '₹98.00');

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Markup & Pricing Breakdown
              </Text>
              <Text style={styles.headerSubtitle}>
                {itemTitle}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Main Content Matching Image 3 Right Phone (M7-S06) ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Pricing Flow */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Pricing Flow</Text>

            {/* Purchase Price */}
            <View style={styles.flowCard}>
              <Text style={styles.flowLabel}>Purchase Price</Text>
              <Text style={styles.flowValue}>{pPrice}</Text>
            </View>

            <Text style={styles.operatorText}>+</Text>

            {/* Markup */}
            <View style={styles.flowCard}>
              <Text style={styles.flowLabel}>Markup</Text>
              <Text style={styles.flowValue}>10%</Text>
            </View>

            <Text style={styles.operatorText}>+</Text>

            {/* Expenses */}
            <View style={styles.flowCard}>
              <Text style={styles.flowLabel}>Expenses</Text>
              <Text style={styles.flowSubtext}>Freight ₹5 · Loading ₹2 · Unloading ₹3</Text>
            </View>

            <Text style={styles.operatorText}>=</Text>

            {/* Retail Price */}
            <View style={styles.flowCard}>
              <Text style={styles.flowLabel}>Retail Price</Text>
              <Text style={styles.flowValue}>{rPrice}</Text>
            </View>

            <Text style={styles.operatorText}>-</Text>

            {/* Customer Discount */}
            <View style={styles.flowCard}>
              <Text style={styles.flowLabel}>Customer Discount</Text>
              <Text style={styles.flowValue}>₹5.00/kg</Text>
            </View>

            <Text style={styles.operatorText}>=</Text>

            {/* Final Customer Price Highlighted Box */}
            <View style={styles.finalPriceCard}>
              <Text style={styles.finalPriceLabel}>Final Customer Price</Text>
              <Text style={styles.finalPriceValue}>₹93.00/kg</Text>
            </View>
          </View>

          {/* Section 2: Expense Breakdown */}
          <View style={[styles.sectionContainer, { marginTop: adminSpacing.lg }]}>
            <Text style={styles.sectionHeading}>Expense Breakdown</Text>

            <View style={styles.expenseCard}>
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Freight</Text>
                <Text style={styles.expenseValue}>₹5.00</Text>
              </View>
              <View style={styles.expenseDivider} />

              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Loading</Text>
                <Text style={styles.expenseValue}>₹2.00</Text>
              </View>
              <View style={styles.expenseDivider} />

              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Unloading</Text>
                <Text style={styles.expenseValue}>₹3.00</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header Banner (Matching Image 2) ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {headerTitle}
          </Text>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section 2: Price inputs ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>2 · Price inputs</Text>

          <View style={styles.card}>
            <View style={styles.inputRow}>
              <Text style={styles.rowLabel}>Farmer purchase price</Text>
              <Text style={styles.rowValueBold}>{farmerPurchasePrice}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <Text style={styles.rowLabel}>Recorded cost components</Text>
              <Text style={styles.rowValueBold}>Unavailable</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <Text style={styles.rowLabel}>Applicable markup rule</Text>
              <Text style={styles.rowValueBold}>Not configured</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <Text style={styles.rowLabel}>Retail price</Text>
              <Text style={styles.rowValueBold}>{effectiveRetail}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <Text style={styles.rowLabel}>Fair price ceiling</Text>
              <Text style={styles.rowValueBold}>{effectiveCeiling}</Text>
            </View>
          </View>
        </View>

        {/* ── Section 3: Calculation details ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>3 · Calculation details</Text>

          <View style={styles.card}>
            <View style={styles.calcHeaderPadding}>
              <Text style={styles.calcNoticeText}>
                The markup formula and cost inputs are not confirmed, so no price is calculated.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.validationRow}>
              <Text style={styles.validationLabel}>Validation</Text>
              <Text
                style={[
                  styles.validationValue,
                  isOverCeiling && styles.validationValueAlert,
                ]}
              >
                {validationText}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Section 4: History ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>4 · History</Text>

          <View style={styles.card}>
            {/* Entry 1 */}
            <View style={styles.historyEntry}>
              <Text style={styles.historyMetaText}>11 Oct 2026, 10:00 · Demo TOHFA Admin</Text>
              <Text style={styles.historyTitleText}>
                Retail ₹52.00/kg to {effectiveRetail}. Regular review (demo)
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Entry 2 */}
            <View style={styles.historyEntry}>
              <Text style={styles.historyMetaText}>5 Apr 2026, 10:00 · Demo TOHFA Admin</Text>
              <Text style={styles.historyTitleText}>
                Retail — to ₹52.00/kg. Initial retail price (demo)
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Footnote */}
            <View style={styles.historyFootnotePadding}>
              <Text style={styles.historyFootnoteText}>
                Earlier pricing inputs and calculated values are not recorded, because no formula has been confirmed.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 2,
  },
  flowCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  flowLabel: {
    ...adminType.rowTitle,
    fontSize: 13,
    color: adminColors.ink,
  },
  flowValue: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  flowSubtext: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  operatorText: {
    ...adminType.rowTitle,
    fontSize: 18,
    color: adminColors.muted,
    textAlign: 'center',
    marginVertical: 4,
  },
  finalPriceCard: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  finalPriceLabel: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  finalPriceValue: {
    ...adminType.title,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  expenseCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.card,
    ...adminShadow.sm,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  expenseLabel: {
    ...adminType.rowTitle,
    fontSize: 13,
    color: adminColors.ink,
  },
  expenseValue: {
    ...adminType.rowTitle,
    fontSize: 13,
    color: adminColors.ink,
  },
  expenseDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    includeFontPadding: false,
    paddingBottom: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },
  sectionContainer: {
    marginBottom: adminSpacing.lg,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A5835',
    marginBottom: adminSpacing.xs,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLabel: {
    ...adminType.body,
    fontSize: 13,
    color: '#1A1412',
  },
  rowValueBold: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1A1412',
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  calcHeaderPadding: {
    paddingVertical: 12,
  },
  calcNoticeText: {
    fontSize: 12.5,
    color: '#1A1412',
    lineHeight: 18,
  },
  validationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  validationLabel: {
    fontSize: 12,
    color: '#8A827B',
  },
  validationValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1A1412',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  validationValueAlert: {
    color: '#C62828',
  },
  historyEntry: {
    paddingVertical: 10,
  },
  historyMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A5835',
    marginBottom: 2,
  },
  historyTitleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1A1412',
    lineHeight: 17,
  },
  historyFootnotePadding: {
    paddingVertical: 10,
  },
  historyFootnoteText: {
    fontSize: 11,
    color: '#8A827B',
    lineHeight: 16,
  },
});
