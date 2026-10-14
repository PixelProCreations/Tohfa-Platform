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
import Svg, { Circle, Line, Path } from 'react-native-svg';

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

  // Highlight
  highlightBorder: adminColors.brand,
  highlightBg: adminColors.brandTint,
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

// Read-only Circle Slash Icon (Exact Material Symbols block)
function BlockCircleIcon({ size = 18, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface MarkupPricingBreakdownScreenProps {
  onBack: () => void;
  cropGradeTitle?: string;
  purchasePrice?: string;
  markup?: string;
  expensesSummary?: string;
  retailPrice?: string;
  customerDiscount?: string;
  finalCustomerPrice?: string;
  expenseList?: Array<{ name: string; amount: string }>;
}

export function MarkupPricingBreakdownScreen({
  onBack,
  cropGradeTitle = 'Carrot · Grade 1',
  purchasePrice = '₹80.00/kg',
  markup = '10%',
  expensesSummary = 'Freight ₹5 · Loading ₹2 · Unloading ₹3',
  retailPrice = '₹98.00/kg',
  customerDiscount = '₹5.00/kg',
  finalCustomerPrice = '₹93.00/kg',
  expenseList = [
    { name: 'Freight', amount: '₹5.00' },
    { name: 'Loading', amount: '₹2.00' },
    { name: 'Unloading', amount: '₹3.00' },
  ],
}: MarkupPricingBreakdownScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Matching Screenshot 5 Exactly ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Markup & Pricing Breakdown</Text>
        </View>

        <Text style={styles.headerSubtitle}>{cropGradeTitle}</Text>
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Pricing Flow */}
        <Text style={styles.sectionHeading}>Pricing Flow</Text>

        {/* 1. Purchase Price */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>Purchase Price</Text>
          <Text style={styles.flowCardValue}>{purchasePrice}</Text>
        </View>

        {/* Operator: + */}
        <View style={styles.operatorWrap}>
          <Text style={styles.operatorText}>+</Text>
        </View>

        {/* 2. Markup */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>Markup</Text>
          <Text style={styles.flowCardValue}>{markup}</Text>
        </View>

        {/* Operator: + */}
        <View style={styles.operatorWrap}>
          <Text style={styles.operatorText}>+</Text>
        </View>

        {/* 3. Expenses */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>Expenses</Text>
          <Text style={styles.flowCardExpensesDetail}>{expensesSummary}</Text>
        </View>

        {/* Operator: = */}
        <View style={styles.operatorWrap}>
          <Text style={styles.operatorText}>=</Text>
        </View>

        {/* 4. Retail Price */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>Retail Price</Text>
          <Text style={styles.flowCardValue}>{retailPrice}</Text>
        </View>

        {/* Operator: - */}
        <View style={styles.operatorWrap}>
          <Text style={styles.operatorText}>-</Text>
        </View>

        {/* 5. Customer Discount */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>Customer Discount</Text>
          <Text style={styles.flowCardValue}>{customerDiscount}</Text>
        </View>

        {/* Operator: = */}
        <View style={styles.operatorWrap}>
          <Text style={styles.operatorText}>=</Text>
        </View>

        {/* 6. Highlighted Final Customer Price Card */}
        <View style={styles.finalPriceCard}>
          <Text style={styles.finalPriceLabel}>Final Customer Price</Text>
          <Text style={styles.finalPriceValue}>{finalCustomerPrice}</Text>
        </View>

        {/* Section: Expense Breakdown */}
        <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>
          Expense Breakdown
        </Text>

        <View style={styles.expenseTableCard}>
          {expenseList.map((expense, idx) => (
            <React.Fragment key={expense.name}>
              <View style={styles.expenseTableRow}>
                <Text style={styles.expenseName}>{expense.name}</Text>
                <Text style={styles.expenseAmount}>{expense.amount}</Text>
              </View>
              {idx < expenseList.length - 1 && <View style={styles.tableDivider} />}
            </React.Fragment>
          ))}
        </View>


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

  // Header (Screenshot 5)
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
    fontSize: 18,
    fontWeight: '700',
    color: THEME.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 3,
    paddingLeft: 34,
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

  // Calculation Flow Cards
  flowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 14,
    ...adminShadow.sm,
  },
  flowCardLabel: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: THEME.ink,
  },
  flowCardValue: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: THEME.ink,
  },
  flowCardExpensesDetail: {
    ...adminType.caption,
    fontSize: 11,
    color: THEME.labelMuted,
  },

  operatorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  operatorText: {
    ...adminType.title,
    fontSize: 16,
    color: THEME.labelMuted,
  },

  // Highlighted Final Customer Price Card (Screenshot 5)
  finalPriceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.highlightBg,
    borderRadius: adminRadius.xl,
    borderWidth: 1.5,
    borderColor: THEME.highlightBorder,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 16,
    ...adminShadow.sm,
  },
  finalPriceLabel: {
    ...adminType.title,
    fontSize: 15,
    color: THEME.titleRustDark,
  },
  finalPriceValue: {
    ...adminType.title,
    fontSize: 16,
    color: THEME.titleRustDark,
  },

  // Expense Breakdown Table (Screenshot 5)
  expenseTableCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 6,
    ...adminShadow.sm,
  },
  expenseTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  expenseName: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: THEME.ink,
  },
  expenseAmount: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: THEME.ink,
  },
  tableDivider: {
    height: 1,
    backgroundColor: THEME.border,
  },

  // Notice Banner
  noticeBanner: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  noticeBannerText: {
    ...adminType.rowMeta,
    fontSize: 12,
    color: THEME.titleRustDark,
    lineHeight: 18,
  },

  // Read-only Disclaimer Card (Screenshot 5 Bottom)
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  disclaimerText: {
    flex: 1,
    ...adminType.rowMeta,
    fontSize: 12,
    color: THEME.labelMuted,
    lineHeight: 18,
  },
});
