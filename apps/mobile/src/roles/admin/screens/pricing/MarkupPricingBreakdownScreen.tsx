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
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import type { PricingRecordItem } from './MarketPricingOverviewScreen';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface MarkupPricingBreakdownScreenProps {
  onBack: () => void;
  record?: PricingRecordItem | null | undefined;
  cropGradeTitle?: string | undefined;
  purchasePrice?: string | undefined;
  retailPrice?: string | undefined;
  ceilingPrice?: string | undefined;
}

export function MarkupPricingBreakdownScreen({
  onBack,
  record,
  cropGradeTitle,
  purchasePrice,
  retailPrice,
  ceilingPrice,
}: MarkupPricingBreakdownScreenProps) {
  const title =
    cropGradeTitle ||
    (record ? `${record.product} · ${record.grade}` : 'Tomato · Grade 1');

  const farmerPurchase = purchasePrice || record?.farmerPurchasePrice || '₹42.00/kg';
  const currentRetail = retailPrice || record?.retailPrice || '₹55.00/kg';
  const currentCeiling = ceilingPrice || record?.ceiling || '₹60.00/kg';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header Banner Matching Image 5 ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Breakdown: {title}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section 2: Price inputs Matching Image 5 ── */}
        <Text style={styles.sectionHeading}>2 · Price inputs</Text>
        <View style={styles.tableCard}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Farmer purchase price</Text>
            <Text style={styles.tableValue}>{farmerPurchase}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Recorded cost components</Text>
            <Text style={styles.tableValue}>Unavailable</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Applicable markup rule</Text>
            <Text style={styles.tableValue}>Not configured</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Retail price</Text>
            <Text style={styles.tableValue}>{currentRetail}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Fair price ceiling</Text>
            <Text style={styles.tableValue}>{currentCeiling}</Text>
          </View>
        </View>

        {/* ── Section 3: Calculation details Matching Image 5 ── */}
        <Text style={styles.sectionHeading}>3 · Calculation details</Text>
        <View style={styles.tableCard}>
          <Text style={styles.calculationNoteText}>
            The markup formula and cost inputs are not confirmed, so no price is calculated.
          </Text>
          <View style={styles.tableDivider} />

          <View style={styles.validationRow}>
            <Text style={styles.tableLabel}>Validation</Text>
            <Text style={styles.validationValue}>
              (₹75.00/kg) Retail price within the ceiling
            </Text>
          </View>
        </View>

        {/* ── Section 4: History Matching Image 5 ── */}
        <Text style={styles.sectionHeading}>4 · History</Text>
        <View style={styles.tableCard}>
          {/* History Entry 1 */}
          <View style={styles.historyEntry}>
            <Text style={styles.historyDate}>11 Oct 2026, 10:00 · Demo TOHFA Admin</Text>
            <Text style={styles.historyNote}>
              Retail ₹52.00/kg to {currentRetail}. Regular review (demo)
            </Text>
          </View>
          <View style={styles.tableDivider} />

          {/* History Entry 2 */}
          <View style={styles.historyEntry}>
            <Text style={styles.historyDate}>5 Apr 2026, 10:00 · Demo TOHFA Admin</Text>
            <Text style={styles.historyNote}>
              Retail — to ₹52.00/kg. Initial retail price (demo)
            </Text>
          </View>
        </View>

        <Text style={styles.historyFooterDisclaimer}>
          Earlier pricing inputs and calculated values are not recorded, because no formula has been confirmed.
        </Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: adminColors.onBrand,
    flex: 1,
    marginLeft: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },

  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.xs,
    marginTop: 6,
  },

  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  tableLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },
  tableValue: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  tableDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    opacity: 0.5,
  },

  // Section 3
  calculationNoteText: {
    ...adminType.body,
    fontSize: 12.5,
    color: adminColors.ink,
    lineHeight: 18,
    paddingBottom: 8,
  },
  validationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  validationValue: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },

  // Section 4
  historyEntry: {
    paddingVertical: 8,
  },
  historyDate: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 2,
  },
  historyNote: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  historyFooterDisclaimer: {
    ...adminType.caption,
    fontSize: 11,
    lineHeight: 16,
    color: adminColors.muted,
    marginTop: 2,
    paddingHorizontal: 2,
  },

  bottomSpacer: {
    height: adminSpacing.xl,
  },
});
