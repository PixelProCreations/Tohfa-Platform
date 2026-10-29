import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import {
  listWarehouseIssues,
  type IssueStatusCode,
  type WarehouseIssueDto,
} from '../../../api/warehouseIssues';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType, type AdminTone } from '../../../theme';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from '../shared/AsyncStates';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import {
  ChipGroup,
  isAllWarehouses,
  ScopeHeader,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { AlertCircleIcon, PlusIcon, STORAGE_CODES } from './StorageParts';
import type { WarehouseScreenBaseProps } from './types';

type IssueFilter = IssueStatusCode | 'ALL';

const FILTERS: readonly IssueFilter[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ALL'];

/** Badge tone per status; also exported for the detail screen. */
export const ISSUE_STATUS_TONE: Record<IssueStatusCode, AdminTone> = {
  OPEN: 'danger',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'info',
};

const SEVERITY_TONE: Record<string, AdminTone> = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'danger',
};

export interface OperationalIssuesScreenProps extends WarehouseScreenBaseProps {
  onSelectIssue: (issueId: string, warehouseId?: string) => void;
  /** Report Operational Issue; offered only with warehouse.issue.manage. */
  onReportIssue?: (() => void) | undefined;
}

export function OperationalIssuesScreen({
  scope,
  can,
  onBack,
  onSelectIssue,
  onReportIssue,
}: OperationalIssuesScreenProps) {
  const [filter, setFilter] = useState<IssueFilter>('OPEN');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  const { options, scopes } = useWarehouseOptions();
  const allWarehouses = isAllWarehouses(scope);
  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId ?? options[0]?.warehouseId;

  const canView = can(STORAGE_CODES.issueView);
  const canReport = can(STORAGE_CODES.issueManage) && onReportIssue !== undefined;

  const issuesQuery = useAdminQuery(
    adminKeys.scoped('warehouseIssues', effectiveWarehouseId, {
      status: filter === 'ALL' ? undefined : filter,
    }),
    (signal) =>
      listWarehouseIssues(
        effectiveWarehouseId as string,
        {
          status: filter === 'ALL' ? undefined : filter,
          pageSize: 50,
        },
        signal,
      ),
    { enabled: !!effectiveWarehouseId && canView },
  );

  const issues = issuesQuery.data?.items ?? [];

  if (!canView) {
    return (
      <WalletScreen title={t('storageOps.issues.title')} onBack={onBack}>
        <AdminEmptyState
          title={t('storageOps.issues.notAvailable.title')}
          subtitle={t('storageOps.issues.notAvailable.subtitle')}
        />
      </WalletScreen>
    );
  }

  const filterOptions = FILTERS.map((f) => t(`storageOps.issues.status.${f}`));
  const activeFilterLabel = t(`storageOps.issues.status.${filter}`);

  const handleFilterChange = (label: string) => {
    const idx = filterOptions.indexOf(label);
    if (idx >= 0 && FILTERS[idx]) {
      setFilter(FILTERS[idx]!);
    }
  };

  return (
    <WalletScreen
      title={t('storageOps.issues.title')}
      onBack={onBack}
      headerExtra={
        allWarehouses ? (
          <ScopeHeader
            scope={scope}
            warehouseOptions={scopes}
            selectedWarehouseId={selectedWarehouseId}
            onSelectWarehouse={setSelectedWarehouseId}
          />
        ) : undefined
      }
      footer={
        canReport ? (
          <WalletFooter>
            <WalletButton
              label={t('storageOps.issues.report')}
              icon={<PlusIcon size={18} color={adminColors.onBrand} />}
              onPress={onReportIssue}
            />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <ChipGroup
          options={filterOptions}
          value={activeFilterLabel}
          onChange={handleFilterChange}
        />

        {issuesQuery.isLoading ? (
          <AdminLoadingState />
        ) : issuesQuery.error ? (
          <AdminErrorState error={issuesQuery.error} onRetry={() => issuesQuery.refetch()} />
        ) : issues.length === 0 ? (
          <AdminEmptyState
            title={t('storageOps.issues.empty')}
            subtitle={t('storageOps.issues.emptyHint')}
          />
        ) : (
          <View style={styles.list}>
            {issues.map((issue, index) => {
              const statusTone = ISSUE_STATUS_TONE[issue.status] ?? 'default';
              const sevTone: AdminTone = SEVERITY_TONE[issue.severity] ?? 'info';
              return (
                <TouchableOpacity
                  key={issue.id}
                  style={[styles.item, index > 0 && styles.itemDivider]}
                  onPress={() => onSelectIssue(issue.id, issue.warehouseId)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                >
                  <View style={[styles.itemIcon, { backgroundColor: adminColors[statusTone].bg }]}>
                    <AlertCircleIcon color={adminColors[statusTone].text} />
                  </View>
                  <View style={styles.itemText}>
                    <View style={styles.titleRow}>
                      <Text style={styles.issueNumber}>{issue.issueNumber}</Text>
                      <StatusBadge
                        label={t(`storageOps.issues.severity.${issue.severity}`)}
                        tone={sevTone}
                      />
                    </View>
                    <Text style={styles.itemTitle}>{issue.title}</Text>
                    <Text style={styles.itemSub}>
                      {t(`storageOps.issues.category.${issue.category}`)} · {issue.createdAt.slice(0, 10)}
                    </Text>
                  </View>
                  <StatusBadge
                    label={t(`storageOps.issues.status.${issue.status}`)}
                    tone={statusTone}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
    marginBottom: 20,
    marginTop: adminSpacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  itemDivider: {
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginBottom: 2,
  },
  issueNumber: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brand,
  },
  itemTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 2,
  },
  itemSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
});