/**
 * Quality Issues (receiving QC issues), shared by the Main and Sub warehouse
 * admins. Read-only list.
 *
 * The Sub shell had no separate view: its Receiving dashboard listed these as
 * Needs Attention cards (QC pending, quantity mismatch, damage report) and sent
 * "Issues" to Operational Issues. This screen is the full list behind that
 * section and absorbs the Main QualityIssuesOperationsScreen: the summary
 * (Pending Checks, Damage Reported, Rejected, Partially Accepted), the
 * incident card and the "View Operational Issues & Action Center" link. Main
 * (scope.warehouseId undefined) sees every warehouse with the warehouse named
 * in each row; Sub only its own.
 *
 * Nothing here mutates: opening an issue hands it to the host, which opens the
 * wizard step (itself gated), the shipment or Operational Issues.
 * Gate: inventory.batch.view, inventory.goods_receipt.record or
 * inventory.quality_check.perform.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { warehouseNameOf } from '../wallet-cashtopup/fixtures';
import { EmptyState, ScopeHeader, SectionTitle, WalletButton, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { QUALITY_ISSUES, RECEIVING_RECORDS, inReceivingScope, isMainScope } from './fixtures';
import {
  AlertCircleOutlineIcon,
  ChevronRightSmall,
  PermissionNote,
  RECEIVING_CODES,
  canViewReceiving,
  qualityIssueTone,
} from './ReceivingParts';
import type { QualityIssue, ReceivingRecord, WarehouseScreenBaseProps } from './types';

export interface QualityIssuesScreenProps extends WarehouseScreenBaseProps {
  issues?: QualityIssue[] | undefined;
  records?: ReceivingRecord[] | undefined;
  onSelectIssue: (issue: QualityIssue) => void;
  /** Operational Issues & Action Center (storage-ops). */
  onOpenOperationalIssues?: (() => void) | undefined;
}

export function QualityIssuesScreen({
  scope,
  can,
  onBack,
  issues = QUALITY_ISSUES,
  records = RECEIVING_RECORDS,
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

  const rows = issues.filter((i) => inReceivingScope(scope, i.warehouseId));
  const receipts = records.filter((r) => inReceivingScope(scope, r.warehouseId));
  const summary: [string, number][] = [
    ['Pending Checks', rows.filter((i) => i.kind === 'QC Pending').length],
    ['Damage Reported', rows.filter((i) => i.kind === 'Damage Reported').length],
    ['Rejected', receipts.filter((r) => r.result === 'Rejected').length],
    ['Partially Accepted', receipts.filter((r) => r.result === 'Partially Accepted').length],
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
                  {issue.id} · {issue.kind}
                </Text>
                <Text style={styles.meta}>
                  {mainView ? `${warehouseNameOf(issue.warehouseId)} · ` : ''}
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
