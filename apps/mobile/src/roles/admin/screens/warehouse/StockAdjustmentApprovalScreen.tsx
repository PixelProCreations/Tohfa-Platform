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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { WAREHOUSE_THEME } from './WarehouseOverviewScreen';

function BackChevronIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={WAREHOUSE_THEME.ink}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#B45309" strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ShieldCheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke="#B45309"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BookOpenIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
        stroke={WAREHOUSE_THEME.ink}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface StockAdjustmentApprovalScreenProps {
  onBack?: () => void;
  onReturnToLedger?: () => void;
  produceName?: string;
  batchId?: string;
  zone?: string;
  systemCount?: number;
  physicalCount?: number;
  varianceKg?: number;
  variancePct?: number;
  reason?: string;
}

export function StockAdjustmentApprovalScreen({
  onBack,
  onReturnToLedger,
  produceName = 'Carrots',
  batchId = 'BT-4471',
  zone = 'Zone A-2',
  systemCount = 240,
  physicalCount = 225,
  varianceKg = -15,
  variancePct = -6.25,
  reason = 'Spoilage during cold storage holding.',
}: StockAdjustmentApprovalScreenProps) {
  const referenceId = `ADJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={WAREHOUSE_THEME.bg} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        {onBack && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackChevronIcon />
          </TouchableOpacity>
        )}

        {/* Title Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Adjustment Submitted</Text>
          <Text style={styles.subtitle}>Routed to Super Admin dual-approval queue</Text>
        </View>

        {/* Status Pill Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View style={styles.pendingBadge}>
              <ClockIcon />
              <Text style={styles.pendingBadgeText}>Pending SA Approval</Text>
            </View>
            <Text style={styles.refIdText}>#{referenceId}</Text>
          </View>

          <Text style={styles.statusExplainer}>
            Your physical stock verification requires Super Admin sign-off because variance exceeds ±5%.
          </Text>

          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Submitted By</Text>
            <Text style={styles.metaValue}>Prakash Babu (Main WH Admin)</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Facility</Text>
            <Text style={styles.metaValue}>Ooty Warehouse · {zone}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Timestamp</Text>
            <Text style={styles.metaValue}>Today, 8:42 AM</Text>
          </View>
        </View>

        {/* Batch Breakdown Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsCardTitle}>Produce & Count Record</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Produce</Text>
            <Text style={styles.detailValueBold}>{produceName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Batch ID</Text>
            <Text style={styles.detailValue}>Batch {batchId}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>System Count</Text>
            <Text style={styles.detailValue}>{systemCount} kg</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Physical Count</Text>
            <Text style={styles.detailValueBold}>{physicalCount} kg</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recorded Variance</Text>
            <Text style={[styles.detailValueBold, { color: varianceKg < 0 ? WAREHOUSE_THEME.red : '#0D8253' }]}>
              {varianceKg > 0 ? `+${varianceKg}` : varianceKg} kg ({variancePct.toFixed(2)}%)
            </Text>
          </View>

          {reason ? (
            <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
              <Text style={styles.detailLabel}>Reason Stated</Text>
              <Text style={[styles.detailValue, { flex: 1, textAlign: 'right', marginLeft: 12 }]}>{reason}</Text>
            </View>
          ) : null}
        </View>

        {/* Dual Approval Policy Notice */}
        <View style={styles.policyNoticeBox}>
          <ShieldCheckIcon />
          <Text style={styles.policyNoticeText}>
            Dual-approval safeguards inventory integrity. The stock ledger will automatically update the moment Super Admin signs off.
          </Text>
        </View>

        {/* Action Button: Return to Ledger */}
        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={onReturnToLedger ?? onBack}
          activeOpacity={0.85}
        >
          <BookOpenIcon />
          <Text style={styles.primaryActionBtnText}>Back to Stock Ledger</Text>
        </TouchableOpacity>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WAREHOUSE_THEME.bg,
  },
  container: {
    flex: 1,
    backgroundColor: WAREHOUSE_THEME.bg,
  },
  contentPad: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    backgroundColor: WAREHOUSE_THEME.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerBlock: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: WAREHOUSE_THEME.titleRust,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: WAREHOUSE_THEME.muted,
    marginTop: 6,
  },
  statusCard: {
    backgroundColor: WAREHOUSE_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    padding: 18,
    marginBottom: 16,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF6E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pendingBadgeText: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  refIdText: {
    fontSize: 13,
    color: WAREHOUSE_THEME.muted,
    fontWeight: '600',
  },
  statusExplainer: {
    fontSize: 13,
    color: '#524B48',
    lineHeight: 18,
    marginTop: 12,
  },
  metaDivider: {
    height: 1,
    backgroundColor: '#F5F1EB',
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 13,
    color: WAREHOUSE_THEME.muted,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: WAREHOUSE_THEME.ink,
  },
  detailsCard: {
    backgroundColor: WAREHOUSE_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    padding: 18,
    marginBottom: 16,
  },
  detailsCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F4EF',
  },
  detailLabel: {
    fontSize: 13,
    color: WAREHOUSE_THEME.muted,
  },
  detailValue: {
    fontSize: 13,
    color: WAREHOUSE_THEME.ink,
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
  },
  policyNoticeBox: {
    backgroundColor: WAREHOUSE_THEME.alertBg,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.alertBorder,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  policyNoticeText: {
    flex: 1,
    fontSize: 13,
    color: WAREHOUSE_THEME.alertText,
    lineHeight: 18,
    marginLeft: 10,
  },
  primaryActionBtn: {
    backgroundColor: WAREHOUSE_THEME.orange,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
