import React, { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  amberText:     '#B45309',
  amberBg:       '#FEF3C7',
  amberBorder:   '#F59E0B',

  redText:       '#DC2626',
  redBg:         '#FEE2E2',
  redBorder:     '#EF4444',

  greenText:     '#15803D',
  greenBg:       '#DCFCE7',
  greenBorder:   '#22C55E',

  blueText:      '#1D4ED8',
  blueBg:        '#DBEAFE',
  blueBorder:    '#93C5FD',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function AlertTriangleIcon({ size = 20, color = '#B45309' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export type AttentionCategory = 'all' | 'pending' | 'failed' | 'fiscal' | 'reconciliation';

export interface SubWarehouseWalletAttentionScreenProps {
  onBack?: () => void;
  initialCategory?: AttentionCategory;
  onNavigateToCashTopUp?: () => void;
}

interface IssueItem {
  id: string;
  category: 'pending' | 'failed' | 'fiscal' | 'reconciliation';
  badgeLabel: string;
  severity: 'warning' | 'error' | 'info';
  title: string;
  customer: string;
  customerId: string;
  amount: string;
  time: string;
  description: string;
  diagnostics: string;
  primaryAction: string;
  secondaryAction?: string;
}

const DEFAULT_ISSUES: IssueItem[] = [
  {
    id: 'TXN-00918',
    category: 'pending',
    badgeLabel: 'Awaiting Verification',
    severity: 'warning',
    title: 'Pending Top-Up Verification',
    customer: 'Kavitha R.',
    customerId: 'CUS-002140',
    amount: '₹1,000.00',
    time: 'Today · 10:15 AM',
    description: 'Cash was collected at warehouse register #1, but the SMS/webhook verification server did not acknowledge receipt within 180 seconds. Funds have not credited to customer wallet.',
    diagnostics: 'Gateway ACK: Timeout (Code 408) · Ledger entry registered in drawer count.',
    primaryAction: 'Mark Cash Verified & Credit Wallet',
    secondaryAction: 'Refund Cash to Customer',
  },
  {
    id: 'TXN-00912',
    category: 'failed',
    badgeLabel: 'Failed Top-Up',
    severity: 'error',
    title: 'Top-Up Attempt Failed',
    customer: 'Anand Kumar',
    customerId: 'CUS-00188',
    amount: '₹500.00',
    time: 'Today · 09:20 AM',
    description: 'Top-up sequence aborted due to cellular connection drop before fiscal registration. No funds were debited or credited.',
    diagnostics: 'Status: Connection Reset · Cash safe: Not collected.',
    primaryAction: 'Retry Top-Up Flow',
    secondaryAction: 'Dismiss Alert',
  },
  {
    id: 'TXN-00905',
    category: 'fiscal',
    badgeLabel: 'Missing Tag',
    severity: 'warning',
    title: 'Missing Fiscal Cash Tag',
    customer: 'Priya Stores',
    customerId: 'CUS-00152',
    amount: '₹2,100.00',
    time: 'Today · 08:45 AM',
    description: 'Top-up was completed and customer balance was credited, but Government Fiscal Cash Tag generation timed out. Required before day-end closing.',
    diagnostics: 'Secure Enclave Hash pending sync · Warehouse ID: WH-COONOOR-01',
    primaryAction: 'Generate & Attach Fiscal Tag',
    secondaryAction: 'Review Transaction',
  },
  {
    id: 'REC-20260924',
    category: 'reconciliation',
    badgeLabel: 'Discrepancy',
    severity: 'warning',
    title: 'Yesterday Cash Reconciliation Discrepancy',
    customer: 'Drawer Register #1',
    customerId: 'AUD-20260924',
    amount: '- ₹100.00 Variance',
    time: '24 Sep 2026 · Close of Day',
    description: "Physical cash count counted ₹18,400.00 vs POS ledger ₹18,500.00. Under-count of ₹100 requires SWA admin acknowledgement and variance reason note.",
    diagnostics: 'Expected: ₹18,500 | Physical: ₹18,400 | Discrepancy: -₹100 (Unresolved)',
    primaryAction: 'Acknowledge & Close Day Variance',
    secondaryAction: 'Open Audit Ledger',
  },
];

export function SubWarehouseWalletAttentionScreen({
  onBack,
  initialCategory = 'all',
  onNavigateToCashTopUp,
}: SubWarehouseWalletAttentionScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<AttentionCategory>(initialCategory);
  const [issues, setIssues] = useState<IssueItem[]>(DEFAULT_ISSUES);

  const filterTabs: { id: AttentionCategory; label: string }[] = [
    { id: 'all', label: `All (${issues.length})` },
    { id: 'pending', label: 'Pending (1)' },
    { id: 'failed', label: 'Failed (1)' },
    { id: 'fiscal', label: 'Fiscal Tag (1)' },
    { id: 'reconciliation', label: 'Discrepancy (1)' },
  ];

  const filteredIssues =
    selectedCategory === 'all'
      ? issues
      : issues.filter((item) => item.category === selectedCategory);

  const handleResolve = (item: IssueItem) => {
    Alert.alert(
      item.primaryAction,
      `Action executed for ${item.title} (${item.id}). Item marked as resolved.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setIssues((prev) => prev.filter((i) => i.id !== item.id));
          },
        },
      ]
    );
  };

  const handleSecondary = (item: IssueItem) => {
    if (item.category === 'failed' && onNavigateToCashTopUp) {
      onNavigateToCashTopUp();
    } else {
      Alert.alert(item.secondaryAction || 'Dismissed', `Action recorded for ${item.id}.`);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Needs Attention</Text>
      </View>

      {/* Category Pills */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterTabs.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedCategory(tab.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredIssues.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <CheckmarkIcon size={32} color={PALETTE.greenText} />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySub}>
              No pending issues requiring your attention in this category.
            </Text>
          </View>
        ) : (
          filteredIssues.map((item) => {
            const isError = item.severity === 'error';
            return (
              <View key={item.id} style={styles.issueCard}>
                {/* Card Top Row: Badge + Time */}
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.badge,
                      isError
                        ? { backgroundColor: PALETTE.redBg, borderColor: PALETTE.redBorder }
                        : { backgroundColor: PALETTE.amberBg, borderColor: PALETTE.amberBorder },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isError ? { color: PALETTE.redText } : { color: PALETTE.amberText },
                      ]}
                    >
                      {item.badgeLabel}
                    </Text>
                  </View>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>

                {/* Title & Customer */}
                <Text style={styles.issueTitle}>{item.title}</Text>
                <View style={styles.targetInfoRow}>
                  <Text style={styles.customerName}>{item.customer}</Text>
                  <Text style={styles.dotSeparator}>·</Text>
                  <Text style={styles.customerId}>{item.customerId}</Text>
                  <View style={styles.amountPill}>
                    <Text style={styles.amountText}>{item.amount}</Text>
                  </View>
                </View>

                {/* Issue Description */}
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionText}>{item.description}</Text>
                </View>

                {/* Diagnostics Box */}
                <View style={styles.diagnosticsBox}>
                  <Text style={styles.diagnosticsLabel}>Diagnostic Info:</Text>
                  <Text style={styles.diagnosticsText}>{item.diagnostics}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => handleResolve(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryActionBtnText}>{item.primaryAction}</Text>
                  </TouchableOpacity>

                  {item.secondaryAction && (
                    <TouchableOpacity
                      style={styles.secondaryActionBtn}
                      onPress={() => handleSecondary(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.secondaryActionBtnText}>{item.secondaryAction}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  filterBar: {
    backgroundColor: PALETTE.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: PALETTE.pageBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  filterChipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  issueCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    color: PALETTE.textMuted,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  targetInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  customerName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  dotSeparator: {
    color: PALETTE.textMuted,
  },
  customerId: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
  },
  amountPill: {
    marginLeft: 'auto',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  amountText: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.primary,
  },
  descriptionBox: {
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  diagnosticsBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  diagnosticsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  diagnosticsText: {
    fontSize: 12,
    color: PALETTE.textInk,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionsContainer: {
    gap: 8,
  },
  primaryActionBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    color: PALETTE.textSecondary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PALETTE.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13.5,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
