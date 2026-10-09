// Design id: M3S17
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { adminColors, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export type AdjustmentDetailScreenProps = InventoryScreenBaseProps;

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownArrowGreyIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M6 14l6 6 6-6" stroke={adminColors.muted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownArrowRedIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M6 14l6 6 6-6" stroke={adminColors.danger.text} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function OutlinedImageIcon({ size = 22, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="8.5" cy="8.5" r="1.5" stroke={color} strokeWidth="1.5" />
      <Path d="M21 16l-5-5-5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 14l2-2 5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}



function ProhibitedRedIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.danger.text} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={adminColors.danger.text} strokeWidth="2" />
    </Svg>
  );
}

function LedgerIcon({ color = adminColors.brandDeep, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 20V5.5L7.5 3.5 10 5.5l2-2 2 2 2-2 3 2V20H5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 9h8M8 13h8M8 16.5h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function TimelineCheckDot() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={adminColors.success.text} strokeWidth="1.8" fill={adminColors.card} />
      <Circle cx="12" cy="12" r="5" fill={adminColors.success.text} />
    </Svg>
  );
}

function TimelinePendingDot() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={adminColors.placeholder} strokeWidth="1.8" fill={adminColors.card} />
    </Svg>
  );
}

export function AdjustmentDetailScreen({ scope, can, onNavigate, onBack, routeParams }: AdjustmentDetailScreenProps) {
  // Approval is read-only in this app: neither this screen nor the absorbed Main
  // StockAdjustmentApprovalScreen ever had an approve/reject control. With
  // inventory.stock_adjustment.approve (Main) we explain the dual-approval
  // routing instead of the "no approval permission" notice.
  const canApprove = can('inventory.stock_adjustment.approve');
  const warehouseLabel = scope.warehouseName ?? String(routeParams?.warehouseName ?? '—');
  const produceName = String(routeParams?.produceName ?? 'Tomato');
  const batchId = String(routeParams?.batchId ?? 'BAT-2026-00241');
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Custom Header matching Image 2 & 3 exact UI */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Stock Adjustment</Text>
              <Text style={styles.headerSubtitle}>ADJ-000128</Text>
            </View>
          </View>

          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Pending Approval</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Section 1: Adjustment Summary */}
          <Text style={styles.sectionHeader}>Adjustment Summary</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Adjustment ID</Text>
                <Text style={styles.colValue}>ADJ-000128</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Warehouse</Text>
                <Text style={styles.colValue}>{warehouseLabel}</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Created</Text>
                <Text style={styles.colValue}>16 Sep 2026, 2:30 PM</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Created By</Text>
                <Text style={styles.colValue}>Suresh · SWA</Text>
              </View>
            </View>
          </View>

          {/* Section 2: Product */}
          <Text style={styles.sectionHeader}>Product</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Product</Text>
                <Text style={styles.colValue}>{produceName}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Grade</Text>
                <Text style={styles.colValue}>Grade 1</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Batch</Text>
                <Text style={styles.colValue}>{batchId}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Storage Location</Text>
                <Text style={styles.colValue}>Cold Storage → A → Rack 02</Text>
              </View>
            </View>
          </View>

          {/* Section 3: Quantity Comparison */}
          <Text style={styles.sectionHeader}>Quantity Comparison</Text>
          <View style={styles.flowCard}>
            <Text style={styles.flowNumber}>140 KG</Text>
            <Text style={styles.flowLabel}>SYSTEM</Text>

            <View style={styles.arrowWrap}>
              <DownArrowGreyIcon />
            </View>

            <Text style={styles.flowNumber}>135 KG</Text>
            <Text style={styles.flowLabel}>PHYSICAL</Text>

            <View style={styles.arrowWrap}>
              <DownArrowGreyIcon />
            </View>

            <Text style={styles.flowVarianceNumber}>-5 KG</Text>
            <Text style={styles.flowVarianceLabel}>VARIANCE</Text>
          </View>

          {/* Section 4: Adjustment Requested */}
          <Text style={styles.sectionHeader}>Adjustment Requested</Text>
          <View style={styles.adjustmentBadge}>
            <DownArrowRedIcon />
            <Text style={styles.adjustmentBadgeText}>ADJUSTMENT_DOWN · -5 KG</Text>
          </View>

          {/* Section 5: Reason */}
          <Text style={styles.sectionHeader}>Reason</Text>
          <View style={styles.card}>
            <Text style={styles.colLabel}>Adjustment Reason</Text>
            <Text style={[styles.colValue, { marginTop: 2 }]}>Quantity Mismatch</Text>
          </View>

          {/* Section 6: Evidence */}
          <Text style={styles.sectionHeader}>Evidence</Text>
          <View style={styles.evidenceThumbnailsRow}>
            <OutlinedImageIcon />
            <OutlinedImageIcon />
          </View>

          {/* Section 7: Notes */}
          <Text style={styles.sectionHeader}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>
              Physical count found 135 KG against system quantity of 140 KG.
            </Text>
          </View>

          {/* Section 8: Approval Status */}
          <Text style={styles.sectionHeader}>Approval Status</Text>
          <View style={styles.timelineContainer}>
            {/* Step 1 */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelineCheckDot />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>Adjustment Created</Text>
                <Text style={styles.timelineTime}>2:30 PM</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelineCheckDot />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>Submitted for Approval</Text>
                <Text style={styles.timelineTime}>2:31 PM</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.timelineRowLast}>
              <View style={styles.timelineIndicatorCol}>
                <TimelinePendingDot />
                <View style={styles.timelineLineShort} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={[styles.timelineTitle, { color: adminColors.muted }]}>Awaiting Approval</Text>
                <Text style={[styles.timelineTime, { color: adminColors.muted }]}>Pending</Text>
              </View>
            </View>
          </View>

          {/* Section 9: Approval Information */}
          <Text style={styles.sectionHeader}>Approval Information</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Status</Text>
                <Text style={styles.colValue}>Pending</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Approved By</Text>
                <Text style={styles.colValue}>—</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Approved At</Text>
                <Text style={styles.colValue}>—</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Comments</Text>
                <Text style={styles.colValue}>—</Text>
              </View>
            </View>
          </View>

          {/* Section 10: Actions */}
          <Text style={styles.sectionHeader}>Actions</Text>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <OutlinedImageIcon size={18} color={adminColors.brandDeep} />
            <Text style={styles.actionBtnText}>View Evidence</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => onNavigate?.('M3S06')}
          >
            <LedgerIcon color={adminColors.brandDeep} size={18} />
            <Text style={styles.actionBtnText}>View Ledger History</Text>
          </TouchableOpacity>

          {/* Section 11: Disclaimer Notice Box */}
          <View style={styles.disclaimerBox}>
            <ProhibitedRedIcon />
            <Text style={styles.disclaimerText}>
              {canApprove
                ? 'Routed to the Super Admin dual-approval queue. Dual approval safeguards inventory integrity: the stock ledger updates automatically the moment Super Admin signs off.'
                : 'No approval action is shown here — you can create and submit adjustments but not approve them. Once approved, the resulting ADJUSTMENT_DOWN movement becomes visible through the Stock Ledger, not through an action on this screen.'}
            </Text>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.body,
    color: adminColors.onBrand,
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: adminColors.brandTint,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  pendingBadgeText: {
    ...adminType.caption,
    color: adminColors.brand,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 10,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  colLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  colValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  flowCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  flowNumber: {
    ...adminType.title,
    color: adminColors.ink,
  },
  flowLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  arrowWrap: {
    marginVertical: 12,
  },
  flowVarianceNumber: {
    ...adminType.title,
    color: adminColors.danger.text,
  },
  flowVarianceLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  adjustmentBadge: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 9,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  adjustmentBadgeText: {
    ...adminType.sectionHead,
    color: adminColors.danger.text,
    letterSpacing: 0.3,
  },
  evidenceThumbnailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  notesText: {
    ...adminType.body,
    color: adminColors.ink,
    lineHeight: 19,
  },
  timelineContainer: {
    marginBottom: 16,
    paddingLeft: 4,
    marginTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineRowLast: {
    flexDirection: 'row',
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
    paddingTop: 1,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: adminColors.placeholder,
    marginVertical: 2,
  },
  timelineLineShort: {
    width: 1.5,
    height: 12,
    backgroundColor: adminColors.placeholder,
    marginTop: 2,
  },
  timelineTextCol: {
    flex: 1,
  },
  timelineTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  timelineTime: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: adminColors.brandDeep,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  actionBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  disclaimerBox: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.danger.bg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 24,
  },
  disclaimerText: {
    ...adminType.rowMeta,
    flex: 1,
    color: adminColors.danger.text,
    lineHeight: 17,
  },
});
