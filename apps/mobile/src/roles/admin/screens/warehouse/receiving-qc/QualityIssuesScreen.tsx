/**
 * Quality Issues (receiving QC issues), shared by the Main and Sub warehouse
 * admins. Read-only list.
 *
 * The full list behind the dashboard's Needs Attention section; absorbs the
 * Main QualityIssuesOperationsScreen (the summary, the issue cards and the
 * "View Operational Issues & Action Center" link). Main (scope.warehouseId
 * undefined) sees every warehouse with the warehouse named in each row; Sub
 * only its own (BR-30).
 *
 * Live data: the same orders and receipts as the dashboard
 * (useReceivingDashboard). The issues the API backs are the receipts still
 * awaiting their quality check; the summary counts those, and the rejected
 * and partially accepted receipts. "Damage Reported" is not shown: damage /
 * mismatch reports are listed per receipt only (no network-wide list).
 *
 * Nothing here mutates: opening an issue hands it to the host, which resumes
 * that receipt in the wizard (itself gated).
 * Gate: inventory.batch.view, inventory.goods_receipt.record or
 * inventory.quality_check.perform.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { EmptyState, ScopeHeader, SectionTitle, WalletButton, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import {
  AlertCircleOutlineIcon,
  ChevronRightSmall,
  PermissionNote,
  RECEIVING_CODES,
  canViewReceiving,
  qualityIssueTone,
} from './ReceivingParts';
import type { LiveQualityIssue } from './liveTypes';
import { isMainScope, receivingWarehouseFilter, warehouseNameFor } from './mappers';
import { useReceivingDashboard, useReceivingNaming } from './useReceivingData';
import type { WarehouseScreenBaseProps } from './types';

export interface QualityIssuesScreenProps extends WarehouseScreenBaseProps {
  /** A receipt awaiting its quality check (the host resumes it in the wizard). */
  onSelectIssue: (issue: LiveQualityIssue) => void;
  /** Operational Issues & Action Center (storage-ops). */
  onOpenOperationalIssues?: (() => void) | undefined;
}

export function QualityIssuesScreen({
  scope,
  can,
  onBack,
  onSelectIssue,
  onOpenOperationalIssues,
}: QualityIssuesScreenProps) {
  const mainView = isMainScope(scope);
  const canView = canViewReceiving(can) || can(RECEIVING_CODES.qualityCheck);
  const naming = useReceivingNaming(scope, can);
  const dashboard = useReceivingDashboard(receivingWarehouseFilter(scope, undefined), naming.naming, canView);
  const view = queryViewState({
    isLoading: dashboard.isLoading,
    error: dashboard.error,
    itemCount: dashboard.shipments.length + dashboard.records.length,
  });
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

  if (view === 'loading' || view === 'error') {
    return (
      <WalletScreen {...header}>
        {view === 'loading' ? <AdminLoadingState /> : <AdminErrorState error={dashboard.error} onRetry={dashboard.refresh} />}
      </WalletScreen>
    );
  }

  const rows = dashboard.issues;
  const receipts = dashboard.records;
  const summary: [string, number][] = [
    [t('receiving.issues.pendingChecks'), rows.length],
    [t('receiving.issues.rejected'), receipts.filter((r) => r.result === 'Rejected').length],
    [t('receiving.issues.partiallyAccepted'), receipts.filter((r) => r.result === 'Partially Accepted').length],
  ];

  return (
    <WalletScreen {...header}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
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
        {rows.length === 0 ? <EmptyState title="No open quality issues" /> : null}
        {rows.map((issue) => {
          const tone = adminColors[qualityIssueTone(issue.kind)];
          const warehouseName = mainView ? warehouseNameFor(issue.warehouseId, naming.naming) : undefined;
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
                <Text style={styles.title}>
                  {issue.receiptCode} · {t('receiving.issueKind.qcPending')}
                </Text>
                <Text style={styles.meta}>
                  {warehouseName !== undefined && warehouseName !== '' ? `${warehouseName} · ` : ''}
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
