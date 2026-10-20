/**
 * Operational Issues: the warehouse floor / facility issue list, live from
 * GET /warehouses/{id}/issues (warehouse.issue.view, Sub = own; BR-103).
 *
 * The status chips are the server's `status` filter; the Open / In Progress /
 * Resolved counts are the server's totals for each status (one pageSize=1
 * request each), never counted from the rows loaded so far. Rows page by
 * number with "Load more".
 *
 * Report Operational Issue needs `warehouse.issue.manage` (Main all, Sub own);
 * the server re-checks it. One warehouse at a time (the endpoint takes one
 * warehouse uuid): Sub its own, Main the one picked in the header.
 */
// Design id: M4-S09
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { ChipGroup, KpiRow, StatusBadge, WalletButton, WalletFooter, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { ISSUE_FILTERS, issueFilterLabel, type IssueListFilter } from './mappers';
import { AlertCircleIcon, PlusIcon, STORAGE_CODES } from './StorageParts';
import type { StorageWarehouse } from './StorageWarehouse';
import { useIssueCounts, useIssueList } from './useStorageData';
import type { WarehouseScreenBaseProps } from './types';

const COUNTED = ['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const;

export interface OperationalIssuesScreenProps extends WarehouseScreenBaseProps {
  warehouse: StorageWarehouse;
  onSelectIssue: (issueId: string) => void;
  /** Report Operational Issue; offered only with warehouse.issue.manage. */
  onReportIssue?: (() => void) | undefined;
}

export function OperationalIssuesScreen({ can, onBack, warehouse, onSelectIssue, onReportIssue }: OperationalIssuesScreenProps) {
  const [filter, setFilter] = useState<IssueListFilter>('OPEN');
  const list = useIssueList(warehouse.warehouseId, filter);
  const counts = useIssueCounts(warehouse.warehouseId, COUNTED);
  const canReport = can(STORAGE_CODES.issueManage) && onReportIssue !== undefined && warehouse.warehouseId !== undefined;
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  const count = (status: (typeof COUNTED)[number]) => {
    const value = counts.counts[status];
    return value === undefined ? t('storageOps.notAvailable') : String(value);
  };
  const openCount = counts.counts.OPEN ?? 0;

  return (
    <WalletScreen
      title={t('storageOps.issues.title')}
      onBack={onBack}
      headerExtra={warehouse.header}
      footer={
        canReport ? (
          <WalletFooter>
            <WalletButton label={t('storageOps.issues.report')} icon={<PlusIcon />} onPress={() => onReportIssue?.()} />
          </WalletFooter>
        ) : undefined
      }
    >
      {warehouse.placeholder ?? (
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
          <KpiRow
            items={[
              { value: count('OPEN'), label: t('storageOps.issue.kpi.open'), tone: openCount > 0 ? 'danger' : undefined },
              { value: count('IN_PROGRESS'), label: t('storageOps.issue.kpi.inProgress') },
              { value: count('RESOLVED'), label: t('storageOps.issue.kpi.resolved') },
            ]}
          />
          <ChipGroup options={ISSUE_FILTERS} value={filter} onChange={setFilter} labelOf={issueFilterLabel} />

          <View style={styles.list}>
            {view === 'loading' ? <AdminLoadingState /> : null}
            {view === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
            {view === 'empty' ? (
              <AdminEmptyState title={t('storageOps.issues.empty')} subtitle={t('storageOps.issues.emptyHint')} />
            ) : null}
            {view === 'ready'
              ? list.items.map((issue) => (
                  <TouchableOpacity
                    key={issue.id}
                    style={styles.card}
                    activeOpacity={0.7}
                    onPress={() => onSelectIssue(issue.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${issue.issueNumber} ${issue.title}`}
                  >
                    <View style={[styles.accent, { backgroundColor: adminColors[issue.statusTone].border }]} />
                    <View style={styles.cardBody}>
                      <View style={styles.cardHeader}>
                        <View style={styles.idRow}>
                          <AlertCircleIcon size={18} color={adminColors[issue.severityTone].text} />
                          <Text style={styles.cardId}>{issue.issueNumber}</Text>
                        </View>
                        <StatusBadge label={issue.statusLabel} tone={issue.statusTone} />
                      </View>
                      <Text style={styles.cardTitle}>{issue.title}</Text>
                      <Text style={styles.cardMeta}>
                        {t('storageOps.issues.rowMeta', { category: issue.categoryLabel, severity: issue.severityLabel })}
                      </Text>
                      <Text style={styles.cardMeta}>{issue.reportedAt}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              : null}
            {view === 'ready' && list.hasMore ? (
              <WalletButton label={t('storageOps.loadMore')} variant="neutral" onPress={list.loadMore} />
            ) : null}
          </View>
        </ScrollView>
      )}
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
  accent: { width: adminSpacing.xs },
  cardBody: { flex: 1, padding: adminSpacing.lg, gap: adminSpacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  cardId: { ...adminType.sectionHead, color: adminColors.ink },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink },
  cardMeta: { ...adminType.rowMeta, color: adminColors.muted },
});
