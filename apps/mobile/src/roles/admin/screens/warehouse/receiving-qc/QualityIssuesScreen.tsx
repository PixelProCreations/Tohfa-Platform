/**
 * Quality Issues (receiving QC issues), shared by the Main and Sub warehouse
 * admins. Read-only list.
 *
 * Absorbed the Main QualityIssuesOperationsScreen. Live since integration
 * phase 4: the open issues are the goods receipts still awaiting their quality
 * check (the only receiving issue the API can tell), and the summary counts
 * the warehouse's receipts by result. Damage reports and quantity mismatches
 * have no API, so they are not listed or counted.
 *
 * Nothing here mutates: opening an issue hands it to the host, which resumes
 * the wizard at the quality check (itself gated).
 * Gate: inventory.batch.view, inventory.goods_receipt.record or
 * inventory.quality_check.perform.
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { ScopeHeader, SectionTitle, WalletButton, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { isMainScope } from './mappers';
import {
  AlertCircleOutlineIcon,
  ChevronRightSmall,
  PermissionNote,
  RECEIVING_CODES,
  canViewReceiving,
  qualityIssueTone,
} from './ReceivingParts';
import type { QualityIssue, ReceivingLiveStateProps, ReceivingRecord, WarehouseScreenBaseProps } from './types';

export interface QualityIssuesScreenProps extends WarehouseScreenBaseProps, ReceivingLiveStateProps {
  /** Receipts awaiting their quality check. */
  issues?: readonly QualityIssue[] | undefined;
  /** The warehouse's receipts, for the summary counts. */
  records?: readonly ReceivingRecord[] | undefined;
  onSelectIssue: (issue: QualityIssue) => void;
  /** Operational Issues & Action Center (storage-ops), when the host offers it. */
  onOpenOperationalIssues?: (() => void) | undefined;
}

export function QualityIssuesScreen({
  scope,
  can,
  onBack,
  issues = [],
  records = [],
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onSelectIssue,
  onOpenOperationalIssues,
}: QualityIssuesScreenProps) {
  const mainView = isMainScope(scope);
  const canView = canViewReceiving(can) || can(RECEIVING_CODES.qualityCheck);
  const header = {
    title: 'Quality Issues',
    onBack,
    headerExtra: <ScopeHeader scope={scope} label={mainView ? undefined : scope.warehouseName ?? scope.warehouseId} />,
  };

  if (!canView) {
    return (
      <WalletScreen {...header}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message="You do not have permission to view quality issues." />
        </View>
      </WalletScreen>
    );
  }

  const hasData = issues.length > 0 || records.length > 0;
  if (!hasData && isLoading) {
    return (
      <WalletScreen {...header}>
        <AdminLoadingState />
      </WalletScreen>
    );
  }
  if (!hasData && error !== null && error !== undefined) {
    return (
      <WalletScreen {...header}>
        <AdminErrorState error={error} onRetry={onRetry} />
      </WalletScreen>
    );
  }

  const summary: [string, number][] = [
    ['Pending Checks', issues.length],
    ['Rejected', records.filter((r) => r.result === 'Rejected').length],
    ['Partially Accepted', records.filter((r) => r.result === 'Partially Accepted').length],
  ];

  return (
    <WalletScreen {...header}>
      <ScrollView
        contentContainerStyle={walletLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
          ) : undefined
        }
      >
        <SectionTitle>Quality Issues Summary</SectionTitle>
        <View style={styles.card}>
          {summary.map(([label, value], index) => (
            <View key={label} style={[styles.summaryRow, index > 0 && styles.divider]}>
              <Text style={styles.summaryLabel}>{label}</Text>
              <Text style={styles.summaryValue}>{value}</Text>
            </View>
          ))}
        </View>

        <SectionTitle>Open Issues</SectionTitle>
        {issues.length === 0 ? <AdminEmptyState title={t('receiving.empty.issues')} /> : null}
        {issues.map((issue) => {
          const tone = adminColors[qualityIssueTone(issue.kind)];
          return (
            <TouchableOpacity
              key={issue.id}
              style={styles.issueCard}
              onPress={() => onSelectIssue(issue)}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <View style={[styles.accent, { backgroundColor: tone.border }]} />
              <View style={[styles.iconBox, { backgroundColor: tone.bg }]}>
                <AlertCircleOutlineIcon size={18} color={tone.text} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.title}>{issue.kind}</Text>
                <Text style={styles.meta}>
                  {issue.produce} — {issue.shipmentCode} · {issue.detail}
                </Text>
              </View>
              <View style={styles.trailing}>
                <Text style={styles.meta}>{issue.time}</Text>
                <ChevronRightSmall color={tone.text} />
              </View>
            </TouchableOpacity>
          );
        })}

        {onOpenOperationalIssues ? (
          <>
            <View style={styles.spacer} />
            <WalletButton label="View Operational Issues & Action Center →" variant="outline" onPress={onOpenOperationalIssues} />
          </>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const ICON_BOX = 36;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spacer: { height: adminSpacing.sm },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: adminSpacing.md },
  divider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  summaryLabel: { ...adminType.sectionHead, color: adminColors.ink },
  summaryValue: { ...adminType.sectionHead, color: adminColors.ink },
  issueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingRight: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    overflow: 'hidden',
  },
  accent: { width: 4, alignSelf: 'stretch' },
  iconBox: { width: ICON_BOX, height: ICON_BOX, borderRadius: adminRadius.sm, alignItems: 'center', justifyContent: 'center' },
  title: { ...adminType.rowTitle, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  trailing: { alignItems: 'flex-end', gap: adminSpacing.xs },
});
