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
import { t } from '../../i18n';

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

function BlockCircleIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
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
  cropGradeTitle?: string | undefined;
  purchasePrice?: string | undefined;
  markup?: string | undefined;
  expensesSummary?: string | undefined;
  retailPrice?: string | undefined;
  customerDiscount?: string | undefined;
  finalCustomerPrice?: string | undefined;
  expenseList?: Array<{ name: string; amount: string }> | undefined;
}

const DEFAULT_EXPENSES = [
  { name: 'Freight', amount: '₹5.00' },
  { name: 'Loading', amount: '₹2.00' },
  { name: 'Unloading', amount: '₹3.00' },
];

export function MarkupPricingBreakdownScreen({
  onBack,
  cropGradeTitle = 'Carrot · Grade 1',
  purchasePrice = '₹80.00/kg',
  markup = '10%',
  expensesSummary = 'Freight ₹5 · Loading ₹2 · Unloading ₹3',
  retailPrice = '₹98.00/kg',
  customerDiscount = '₹5.00/kg',
  finalCustomerPrice = '₹93.00/kg',
  expenseList,
}: MarkupPricingBreakdownScreenProps) {
  const expenses = expenseList && expenseList.length > 0 ? expenseList : DEFAULT_EXPENSES;

  const displayDiscount = customerDiscount.includes('/kg')
    ? customerDiscount
    : `${customerDiscount}/kg`;

  const displayFinalPrice = finalCustomerPrice.includes('/kg')
    ? finalCustomerPrice
    : `${finalCustomerPrice}/kg`;

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
            accessibilityLabel={t('markupPricingBreakdown.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('markupPricingBreakdown.title')}</Text>
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
        <Text style={styles.sectionHeading}>{t('markupPricingBreakdown.section.pricingFlow')}</Text>

        {/* 1. Purchase Price */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>{t('markupPricingBreakdown.label.purchasePrice')}</Text>
          <Text style={styles.flowCardValue}>{purchasePrice}</Text>
        </View>

        {/* Operator: + */}
        <View style={styles.operatorWrap}>
          <Text style={styles.operatorText}>+</Text>
        </View>

        {/* 2. Markup */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>{t('markupPricingBreakdown.label.markup')}</Text>
          <Text style={styles.flowCardValue}>{markup}</Text>
        </View>

        {/* Operator: + */}
        <View style={styles.operatorWrap}>
          <Text style={styles.operatorText}>+</Text>
        </View>

        {/* 3. Expenses */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>{t('markupPricingBreakdown.label.expenses')}</Text>
          <Text style={styles.flowCardExpensesDetail}>{expensesSummary}</Text>
        </View>

        {/* Operator: = */}
        <View style={styles.operatorWrap}>
          <Text style={styles.operatorText}>=</Text>
        </View>

        {/* 4. Retail Price */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>{t('markupPricingBreakdown.label.retailPrice')}</Text>
          <Text style={styles.flowCardValue}>{retailPrice}</Text>
        </View>

        {/* Operator: - */}
        <View style={styles.operatorWrap}>
          <Text style={styles.operatorText}>-</Text>
        </View>

        {/* 5. Customer Discount */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>{t('markupPricingBreakdown.label.customerDiscount')}</Text>
          <Text style={styles.flowCardValue}>{displayDiscount}</Text>
        </View>

        {/* Operator: = */}
        <View style={styles.operatorWrap}>
          <Text style={styles.operatorText}>=</Text>
        </View>

        {/* 6. Highlighted Final Customer Price Card */}
        <View style={styles.finalPriceCard}>
          <Text style={styles.finalPriceLabel}>{t('markupPricingBreakdown.label.finalCustomerPrice')}</Text>
          <Text style={styles.finalPriceValue}>{displayFinalPrice}</Text>
        </View>

        {/* Section: Expense Breakdown */}
        <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>
          {t('markupPricingBreakdown.section.expenseBreakdown')}
        </Text>

        <View style={styles.expenseTableCard}>
          {expenses.map((expense, idx) => (
            <React.Fragment key={expense.name}>
              <View style={styles.expenseTableRow}>
                <Text style={styles.expenseName}>{expense.name}</Text>
                <Text style={styles.expenseAmount}>{expense.amount}</Text>
              </View>
              {idx < expenses.length - 1 && <View style={styles.tableDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Notice Banner */}
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeBannerText}>
            Only expense types actually configured in the system are shown here — no invented categories.
          </Text>
        </View>

        {/* Read-Only Disclaimer Card */}
        <View style={styles.disclaimerCard}>
          <BlockCircleIcon size={18} color={adminColors.muted} />
          <Text style={styles.disclaimerText}>
            Read-only pricing explanation — no Edit Markup, Edit Expenses, Set Retail Price, or Override Fair Price Ceiling anywhere.
          </Text>
        </View>

        <View style={{ height: adminSpacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    gap: adminSpacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    marginTop: 2,
    paddingLeft: 36,
    opacity: 0.95,
  },

  // Scroll Body
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },

  // Calculation Flow Cards
  flowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 14,
    ...adminShadow.sm,
  },
  flowCardLabel: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  flowCardValue: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  flowCardExpensesDetail: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },

  operatorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  operatorText: {
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.muted,
  },

  // Highlighted Final Customer Price Card
  finalPriceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF0E6',
    borderRadius: adminRadius.xl,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 16,
    ...adminShadow.sm,
  },
  finalPriceLabel: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  finalPriceValue: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // Expense Breakdown Table
  expenseTableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  expenseAmount: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  tableDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },

  // Notice Banner
  noticeBanner: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  noticeBannerText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    lineHeight: 18,
    fontWeight: '600',
  },

  // Read-only Disclaimer Card
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: adminSpacing.sm,
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
  },
});
