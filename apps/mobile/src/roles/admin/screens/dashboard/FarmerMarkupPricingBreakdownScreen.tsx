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

function BlockCircleIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerMarkupPricingBreakdownScreenProps {
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

export function FarmerMarkupPricingBreakdownScreen({
  onBack,
  cropGradeTitle = 'Carrot · Grade 1',
  purchasePrice = '₹80.00/kg',
  markup = '10%',
  expensesSummary = 'Freight ₹5 · Loading ₹2 · Unloading ₹3',
  retailPrice = '₹98.00/kg',
  customerDiscount = '₹5.00/kg',
  finalCustomerPrice = '₹93.00/kg',
  expenseList = DEFAULT_EXPENSES,
}: FarmerMarkupPricingBreakdownScreenProps) {
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
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Markup & Pricing Breakdown</Text>
        </View>

        <Text style={styles.headerSubtitle}>{cropGradeTitle}</Text>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Pricing Flow */}
        <Text style={styles.sectionHeading}>Pricing Flow</Text>

        {/* 1. Purchase Price */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>Purchase Price</Text>
          <Text style={styles.flowCardValue}>{purchasePrice}</Text>
        </View>

        <Text style={styles.operator}>+</Text>

        {/* 2. Markup */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>Markup</Text>
          <Text style={styles.flowCardValue}>{markup}</Text>
        </View>

        <Text style={styles.operator}>+</Text>

        {/* 3. Expenses */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>Expenses</Text>
          <Text style={styles.flowCardDetail}>{expensesSummary}</Text>
        </View>

        <Text style={styles.operator}>=</Text>

        {/* 4. Retail Price */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>Retail Price</Text>
          <Text style={styles.flowCardValue}>{retailPrice}</Text>
        </View>

        <Text style={styles.operator}>-</Text>

        {/* 5. Customer Discount */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardLabel}>Customer Discount</Text>
          <Text style={styles.flowCardValue}>{customerDiscount}</Text>
        </View>

        <Text style={styles.operator}>=</Text>

        {/* 6. Highlighted Final Customer Price */}
        <View style={styles.finalCard}>
          <Text style={styles.finalCardLabel}>Final Customer Price</Text>
          <Text style={styles.finalCardValue}>{finalCustomerPrice}</Text>
        </View>

        {/* Section: Expense Breakdown */}
        <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>
          Expense Breakdown
        </Text>

        <View style={styles.expenseCard}>
          {expenseList.map((exp, idx) => (
            <React.Fragment key={exp.name}>
              <View style={styles.expenseRow}>
                <Text style={styles.expenseName}>{exp.name}</Text>
                <Text style={styles.expenseAmount}>{exp.amount}</Text>
              </View>
              {idx < expenseList.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.helperNote}>
          Only expense types actually configured in the system are shown here — no invented
          categories.
        </Text>

        {/* Disclaimer Box */}
        <View style={styles.disclaimerBox}>
          <BlockCircleIcon size={18} color={adminColors.muted} />
          <Text style={styles.disclaimerText}>
            Read-only pricing explanation — no Edit Markup, Edit Expenses, Set Retail Price, or
            Override Fair Price Ceiling anywhere.
          </Text>
        </View>

        <View style={{ height: adminSpacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
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
    fontSize: 12,
    color: adminColors.onBrand,
    marginTop: 2,
    paddingLeft: 36,
    opacity: 0.95,
  },

  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },

  sectionHeading: {
    ...adminType.sectionHeader,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },

  flowCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  flowCardLabel: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  flowCardValue: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  flowCardDetail: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },

  operator: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.muted,
    marginVertical: 4,
  },

  finalCard: {
    backgroundColor: '#FDF6ED',
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  finalCardLabel: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  finalCardValue: {
    ...adminType.body,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brand,
  },

  expenseCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  expenseName: {
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
  },
  expenseAmount: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5EFE6',
    marginVertical: adminSpacing.xs,
  },

  helperNote: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
    lineHeight: 16,
  },

  disclaimerBox: {
    marginTop: adminSpacing.lg,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
  },
  disclaimerText: {
    ...adminType.caption,
    fontSize: 12,
    color: '#6B6055',
    lineHeight: 18,
    flex: 1,
  },
});
