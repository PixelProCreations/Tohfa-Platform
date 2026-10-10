/**
 * Operational Issues: the warehouse floor / facility issue list.
 *
 * Gate (FINAL_LIST 133): no rbac code covers operational issues (SPEC_GAPS
 * W4v-1), so the list is ungated and scope-locked: Sub sees its own
 * warehouse's issues behind the locked pill, Main sees all four with the
 * warehouse selector. The Report button opens Report an Issue only with
 * `support.ticket.create_own`, which neither warehouse admin role holds today
 * (W4v-2), so it is normally replaced by a note.
 *
 * Absorbs Main OperationalIssuesScreen (pair M4-S09): the cross-warehouse rows
 * (warehouse name on each card, accent stripe) for the Main view. The Open /
 * In Progress / Resolved counts are computed from the rows in scope instead of
 * the hard-coded 3 / 2 / 8 both copies showed.
 */
// Design id: M4-S09
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType, type AdminTone } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  inScope,
  isAllWarehouses,
  KpiRow,
  PermissionNote,
  ScopeHeader,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { OPERATIONAL_ISSUES, STORAGE_WAREHOUSES, storageWarehouseName } from './fixtures';
import { AlertCircleIcon, PlusIcon, STORAGE_CODES } from './StorageParts';
import type { IssueFilter, IssueStatus, OperationalIssue, WarehouseScreenBaseProps } from './types';

const FILTERS: readonly IssueFilter[] = ['Open', 'In Progress', 'Resolved', 'All'];

/** Badge tone per status; also exported for the detail screen. */
export const ISSUE_STATUS_TONE: Record<IssueStatus, AdminTone> = {
  Open: 'danger',
  'In Progress': 'warning',
  Resolved: 'success',
};

export interface OperationalIssuesScreenProps extends WarehouseScreenBaseProps {
  issues?: readonly OperationalIssue[] | undefined;
  onSelectIssue: (issueId: string) => void;
  /** Report Operational Issue; offered only with support.ticket.create_own. */
  onReportIssue?: (() => void) | undefined;
}

export function OperationalIssuesScreen({
  scope,
  can,
  onBack,
  issues = OPERATIONAL_ISSUES,
  onSelectIssue,
  onReportIssue,
}: OperationalIssuesScreenProps) {
  const [filter, setFilter] = useState<IssueFilter>('Open');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  const allWarehouses = isAllWarehouses(scope);
  const canReport = can(STORAGE_CODES.issueReport) && onReportIssue !== undefined;

  const scoped = useMemo(
    () => issues.filter((i) => inScope(scope, i.warehouseId, selectedWarehouseId)),
    [issues, scope, selectedWarehouseId],
  );
  const visible = filter === 'All' ? scoped : scoped.filter((i) => i.status === filter);
  const count = (status: IssueStatus) => scoped.filter((i) => i.status === status).length;
  const openCount = count('Open');

  return (
    <WalletScreen
      title="Operational Issues"
      onBack={onBack}
      headerExtra={
        <ScopeHeader
          scope={scope}
          warehouseOptions={STORAGE_WAREHOUSES}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
        />
      }
      footer={
        <WalletFooter>
          {canReport ? (
            <WalletButton label="Report Operational Issue" icon={<PlusIcon />} onPress={() => onReportIssue?.()} />
          ) : (
            <PermissionNote>Reporting an operational issue needs an issue-reporting permission your role does not have.</PermissionNote>
          )}
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <KpiRow
          items={[
            { value: String(openCount), label: 'OPEN', tone: openCount > 0 ? 'danger' : undefined },
            { value: String(count('In Progress')), label: 'IN PROGRESS' },
            { value: String(count('Resolved')), label: 'RESOLVED' },
          ]}
        />
        <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />

        <View style={styles.list}>
          {visible.length === 0 ? (
            <EmptyState title="No issues" subtitle="No operational issues match this filter." />
          ) : (
            visible.map((issue) => {
              const tone = ISSUE_STATUS_TONE[issue.status];
              return (
                <TouchableOpacity
                  key={issue.id}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => onSelectIssue(issue.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${issue.id} ${issue.title}`}
                >
                  <View style={[styles.accent, { backgroundColor: adminColors[tone].border }]} />
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <View style={styles.idRow}>
                        <AlertCircleIcon size={18} color={adminColors[tone].text} />
                        <Text style={styles.cardId}>{issue.id}</Text>
                      </View>
                      <StatusBadge label={issue.status} tone={tone} />
                    </View>
                    <Text style={styles.cardMeta}>
                      {allWarehouses ? `${storageWarehouseName(issue.warehouseId)} · ` : ''}
                      {issue.area}
                    </Text>
                    <Text style={styles.cardTitle}>{issue.title}</Text>
                    <Text style={styles.cardMeta}>{issue.reportedAt}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: adminSpacing.md },
  card: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    overflow: 'hidden',
  },
  accent: { width: 4 },
  cardBody: { flex: 1, padding: adminSpacing.lg, gap: adminSpacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  cardId: { ...adminType.sectionHead, color: adminColors.ink },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink },
  cardMeta: { ...adminType.rowMeta, color: adminColors.muted },
});
