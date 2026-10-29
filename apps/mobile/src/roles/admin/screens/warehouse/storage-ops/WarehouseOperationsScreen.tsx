/**
 * Warehouse Operations: the storage-ops hub (overview tiles, quick actions,
 * today's status, needs attention, recent activity).
 *
 * Gate: scope-locked. Every tile leads to a child that carries its own gate.
 * The Main-only parts show only for the all-warehouses scope with `warehouse.all.view`.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getOpenIssueCounts, getWarehouseCapacities } from '../../../api/dashboardFeeds';
import { listStorageLocations } from '../../../api/warehouses';
import { listWarehouseActivity } from '../../../api/warehouseActivity';
import { listWarehouseIssues } from '../../../api/warehouseIssues';
import { OverviewDashboardCard } from '../../../components';
import { t } from '../../../i18n';
import { parseKgToGrams } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { istDay } from '../../../utils/datetime';
import {
  BellRingIcon,
  HeaderIconButton,
  inScope,
  isAllWarehouses,
  ScopeHeader,
  SectionTitle,
  StatusBadge,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { WarehouseSelector } from '../inventory';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { toActivityRow, type ActivityRow } from './mappers_activity';
import {
  AlertCircleIcon,
  ChevronRightIcon,
  DonutIcon,
  HistoryIcon,
  ReceiveGoodsIcon,
  ReportIssueIcon,
  STORAGE_CODES,
  ShelfIcon,
  WarningTriangleIcon,
} from './StorageParts';
import type { ActivityModule, WarehouseScreenBaseProps } from './types';

export interface WarehouseOperationsScreenProps extends WarehouseScreenBaseProps {
  onOpenCapacity: () => void;
  onOpenIssues: () => void;
  /** Warehouse Activity on a preset ('Today' = Today's Operational Status). */
  onOpenActivity: (preset: 'Today' | 'All') => void;
  onSelectActivity: (activity: ActivityRow) => void;
  /** Modules outside storage-ops: storage locations, receiving. */
  onOpenModule: (module: ActivityModule) => void;
  onOpenNotifications?: (() => void) | undefined;
  /** Main: Warehouse Overview "View" link. */
  onOpenWarehouseOverview?: (() => void) | undefined;
  /** Main: one warehouse card (by display name, as the Main shell keys warehouses). */
  onSelectWarehouse?: ((warehouseName: string) => void) | undefined;
}

export function WarehouseOperationsScreen({
  scope,
  can,
  onBack,
  onOpenCapacity,
  onOpenIssues,
  onOpenActivity,
  onSelectActivity,
  onOpenModule,
  onOpenNotifications,
  onOpenWarehouseOverview,
  onSelectWarehouse,
}: WarehouseOperationsScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const mainView = isAllWarehouses(scope) && can(STORAGE_CODES.allWarehousesView);

  const { options, scopes } = useWarehouseOptions({
    enabled: mainView,
    activeOnly: true,
  });

  const targetWarehouseIds = useMemo(() => {
    if (scope.warehouseId) return [scope.warehouseId];
    if (selectedWarehouseId) return [selectedWarehouseId];
    return options.map((o) => o.warehouseId);
  }, [scope.warehouseId, selectedWarehouseId, options]);

  // Storage Locations count
  const locationsQuery = useAdminQuery(
    adminKeys.scoped('storageLocationsCount', undefined, { ids: targetWarehouseIds }),
    async (signal) => {
      const results = await Promise.all(
        targetWarehouseIds.map((id) => listStorageLocations(id, { isActive: true, page: 1, pageSize: 1 }, signal)),
      );
      return results.reduce((sum: number, p) => sum + p.total, 0);
    },
    { enabled: targetWarehouseIds.length > 0 && can(STORAGE_CODES.batchView) },
  );

  // Capacities
  const capacityQuery = useAdminQuery(
    adminKeys.scoped('warehouseCapacity', undefined, { ids: targetWarehouseIds }),
    (signal) => getWarehouseCapacities(targetWarehouseIds, signal),
    { enabled: targetWarehouseIds.length > 0 && (can('warehouse.own.view') || can(STORAGE_CODES.allWarehousesView)) },
  );

  // Open Issues count
  const issuesQuery = useAdminQuery(
    adminKeys.scoped('openIssuesCount', undefined, { ids: targetWarehouseIds }),
    (signal) => getOpenIssueCounts(targetWarehouseIds, signal),
    { enabled: targetWarehouseIds.length > 0 && can(STORAGE_CODES.issueView) },
  );

  // High / Critical Open Issues for Needs Attention
  const highIssuesQuery = useAdminQuery(
    adminKeys.scoped('highIssues', undefined, { ids: targetWarehouseIds }),
    async (signal) => {
      const pages = await Promise.all(
        targetWarehouseIds.map((id) =>
          listWarehouseIssues(id, { status: 'OPEN', severity: 'HIGH', page: 1, pageSize: 3 }, signal),
        ),
      );
      return pages.flatMap((p) => p.items).slice(0, 3);
    },
    { enabled: targetWarehouseIds.length > 0 && can(STORAGE_CODES.issueView) },
  );

  // Activities today
  const today = useMemo(() => istDay(new Date()), []);
  const activityQuery = useAdminQuery(
    adminKeys.scoped('warehouseActivityToday', undefined, { ids: targetWarehouseIds, today }),
    async (signal) => {
      const pages = await Promise.all(
        targetWarehouseIds.map(async (id) => {
          const res = await listWarehouseActivity(id, { from: today, to: today, limit: 100 }, signal);
          return { warehouseId: id, items: res.items, hasMore: res.page.hasMore };
        }),
      );
      return pages;
    },
    { enabled: targetWarehouseIds.length > 0 && can(STORAGE_CODES.activityView) },
  );

  const occupancyDisplay = useMemo(() => {
    if (!capacityQuery.data || capacityQuery.data.size === 0) return '—';
    let totalUsedGrams = 0;
    let totalCapGrams = 0;
    for (const cap of capacityQuery.data.values()) {
      totalUsedGrams += parseKgToGrams(cap.usedKg ?? '0') ?? 0;
      totalCapGrams += parseKgToGrams(cap.capacityKg ?? '0') ?? 0;
    }
    if (totalCapGrams === 0) return '—';
    const pct = Math.round((totalUsedGrams / totalCapGrams) * 100);
    return `${pct}%`;
  }, [capacityQuery.data]);

  const totalOpenIssues = useMemo(() => {
    if (!issuesQuery.data) return '—';
    return String(Object.values(issuesQuery.data).reduce((sum, n) => sum + n, 0));
  }, [issuesQuery.data]);

  const totalTodayActivities = useMemo(() => {
    if (!activityQuery.data) return '—';
    return String(activityQuery.data.reduce((sum, p) => sum + p.items.length, 0));
  }, [activityQuery.data]);

  const receivingCount = useMemo(() => {
    if (!activityQuery.data) return 0;
    return activityQuery.data.reduce(
      (sum, p) => sum + p.items.filter((item) => item.type === 'GOODS_RECEIPT').length,
      0,
    );
  }, [activityQuery.data]);

  const storageMovementCount = useMemo(() => {
    if (!activityQuery.data) return 0;
    return activityQuery.data.reduce(
      (sum, p) => sum + p.items.filter((item) => item.type === 'STOCK_MOVEMENT').length,
      0,
    );
  }, [activityQuery.data]);

  const recentRows = useMemo(() => {
    if (!activityQuery.data) return [];
    const now = new Date();
    const rows: ActivityRow[] = [];
    for (const page of activityQuery.data) {
      const opt = options.find((o) => o.warehouseId === page.warehouseId);
      const whName = opt?.warehouseName ?? (scope.warehouseName ?? '');
      for (const item of page.items) {
        rows.push(toActivityRow(item, { id: page.warehouseId, name: whName }, now));
      }
    }
    return rows.slice(0, 2);
  }, [activityQuery.data, options, scope.warehouseName]);

  const overviewTiles = [
    {
      label: t('storageOps.operations.locations'),
      value: locationsQuery.data !== undefined ? String(locationsQuery.data) : '—',
      sub: t('storageOps.operations.locations'),
      icon: <ShelfIcon size={22} color={adminColors.brand} />,
      onPress: () => onOpenModule('storage'),
    },
    {
      label: t('storageOps.operations.occupancy'),
      value: occupancyDisplay,
      sub: t('storageOps.operations.occupancy'),
      icon: <DonutIcon size={22} color={adminColors.brand} />,
      onPress: onOpenCapacity,
    },
    {
      label: t('storageOps.operations.openIssues'),
      value: totalOpenIssues,
      sub: t('storageOps.operations.needsAttention'),
      icon: <AlertCircleIcon />,
      onPress: onOpenIssues,
    },
    {
      label: t('storageOps.operations.todayActivities'),
      value: totalTodayActivities,
      sub: t('storageOps.operations.todayStatus'),
      icon: <HistoryIcon color={adminColors.warning.text} />,
      onPress: () => onOpenActivity('Today'),
    },
  ];

  const mainQuickActions = [
    { label: t('storageOps.operations.locations'), icon: <ShelfIcon size={26} color={adminColors.brand} />, onPress: () => onOpenModule('storage') },
    { label: t('storageOps.operations.occupancy'), icon: <DonutIcon size={26} color={adminColors.brand} />, onPress: onOpenCapacity },
    { label: t('storageOps.operations.openIssues'), icon: <AlertCircleIcon size={26} color={adminColors.brand} />, onPress: onOpenIssues },
  ];

  const quickActions = [
    { label: t('storageOps.operations.locations'), icon: <ShelfIcon size={24} color={adminColors.brand} />, onPress: () => onOpenModule('storage') },
    { label: t('storageOps.operations.occupancy'), icon: <DonutIcon size={24} color={adminColors.brand} />, onPress: onOpenCapacity },
    { label: t('storageOps.operations.openIssues'), icon: <ReportIssueIcon size={24} color={adminColors.brand} />, onPress: onOpenIssues },
    { label: t('storageOps.operations.receiving'), icon: <ReceiveGoodsIcon size={24} color={adminColors.success.text} />, onPress: () => onOpenModule('receiving') },
    ...(mainView ? [{ label: t('storageOps.performance.operationsLog'), icon: <HistoryIcon />, onPress: () => onOpenActivity('All') }] : []),
  ];

  return (
    <WalletScreen
      title={t('storageOps.operations.title')}
      onBack={onBack}
      headerRight={
        <HeaderIconButton onPress={onOpenNotifications ?? (() => {})} accessibilityLabel="Notifications">
          <BellRingIcon size={20} color={adminColors.onBrand} />
        </HeaderIconButton>
      }
      headerExtra={
        mainView ? (
          <WarehouseSelector
            scope={scope}
            options={scopes}
            selectedId={selectedWarehouseId}
            onSelect={setSelectedWarehouseId}
          />
        ) : (
          <ScopeHeader
            scope={scope}
            label={`${scope.warehouseName ?? ''} · Operational`}
          />
        )
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>{t('storageOps.operations.overview')}</SectionTitle>
        <View style={styles.grid}>
          {overviewTiles.map((tile) => {
            const isAlert = tile.label === t('storageOps.operations.openIssues');
            return (
              <OverviewDashboardCard
                key={tile.label}
                value={tile.value}
                title={tile.label}
                subtitle={tile.sub}
                icon="box"
                tone={isAlert ? 'danger' : 'default'}
              />
            );
          })}
        </View>

        {mainView ? (
          <>
            <SectionTitle
              right={
                onOpenWarehouseOverview ? (
                  <TouchableOpacity onPress={onOpenWarehouseOverview} accessibilityRole="button">
                    <Text style={styles.link}>{t('storageOps.operations.view')}</Text>
                  </TouchableOpacity>
                ) : undefined
              }
            >
              {t('storageOps.operations.hubOverview')}
            </SectionTitle>

            {options.map((w) => {
              const displayName = w.warehouseName.replace(/ Warehouse$/, '');
              const cap = capacityQuery.data?.get(w.warehouseId);
              const occPercent = cap?.utilizationPercent != null ? `${cap.utilizationPercent}%` : '—';
              const whIssues = issuesQuery.data?.[w.warehouseId] ?? 0;
              const whPage = activityQuery.data?.find((p) => p.warehouseId === w.warehouseId);
              const whActivities = whPage ? whPage.items.length : 0;

              return (
                <TouchableOpacity
                  key={w.warehouseId}
                  style={styles.card}
                  disabled={onSelectWarehouse === undefined && onOpenWarehouseOverview === undefined}
                  onPress={() => (onSelectWarehouse ? onSelectWarehouse(w.warehouseName) : onOpenWarehouseOverview?.())}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{displayName}</Text>
                    <StatusBadge label="Operational" tone="success" />
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>{t('storageOps.operations.occupancy')}</Text>
                      <Text style={styles.statValue}>{occPercent}</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>{t('storageOps.operations.todayActivities')}</Text>
                      <Text style={styles.statValue}>{whActivities}</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>{t('storageOps.operations.openIssues')}</Text>
                      <Text style={styles.statValue}>{whIssues}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            <SectionTitle
              right={
                <TouchableOpacity onPress={() => onOpenActivity('Today')} accessibilityRole="button">
                  <Text style={styles.link}>{t('storageOps.operations.view')} →</Text>
                </TouchableOpacity>
              }
            >
              {t('storageOps.operations.todayStatus')}
            </SectionTitle>
            <View style={styles.card}>
              <TouchableOpacity style={styles.statusRowItem} onPress={() => onOpenActivity('Today')} activeOpacity={0.75} accessibilityRole="button">
                <Text style={styles.statusRowItemLabel}>{t('storageOps.operations.receiving')}</Text>
                <Text style={styles.statusRowItemValue}>{receivingCount} shipments</Text>
              </TouchableOpacity>
              <View style={styles.rowDivider} />
              <TouchableOpacity style={styles.statusRowItem} onPress={() => onOpenActivity('Today')} activeOpacity={0.75} accessibilityRole="button">
                <Text style={styles.statusRowItemLabel}>{t('storageOps.operations.storage')}</Text>
                <Text style={styles.statusRowItemValue}>{storageMovementCount} activities</Text>
              </TouchableOpacity>
            </View>

            {highIssuesQuery.data && highIssuesQuery.data.length > 0 ? (
              <>
                <SectionTitle
                  right={
                    <TouchableOpacity onPress={onOpenIssues} accessibilityRole="button">
                      <Text style={styles.link}>{t('storageOps.operations.view')} →</Text>
                    </TouchableOpacity>
                  }
                >
                  {t('storageOps.operations.needsAttention')}
                </SectionTitle>
                {highIssuesQuery.data.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.attentionCard}
                    onPress={onOpenIssues}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                  >
                    <View style={[styles.attentionAccent, { backgroundColor: adminColors.brand }]} />
                    <View style={styles.attentionIconBrand}>
                      <WarningTriangleIcon size={20} color={adminColors.brand} />
                    </View>
                    <View style={styles.attentionText}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.statLabel}>{item.issueNumber} · {item.severity}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            ) : null}

            <SectionTitle>{t('storageOps.operations.quickActions')}</SectionTitle>
            <View style={styles.grid}>
              {mainQuickActions.map((qa) => (
                <TouchableOpacity key={qa.label} style={styles.mainActionTile} onPress={qa.onPress} activeOpacity={0.75} accessibilityRole="button">
                  {qa.icon}
                  <Text style={styles.mainActionLabel}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <SectionTitle>{t('storageOps.operations.quickActions')}</SectionTitle>
            <View style={styles.grid}>
              {quickActions.map((qa) => (
                <TouchableOpacity key={qa.label} style={styles.actionTile} onPress={qa.onPress} activeOpacity={0.75} accessibilityRole="button">
                  {qa.icon}
                  <Text style={styles.actionLabel}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <SectionTitle>{t('storageOps.operations.todayStatus')}</SectionTitle>
            <View style={styles.grid}>
              <TouchableOpacity style={styles.statusTile} onPress={() => onOpenActivity('Today')} activeOpacity={0.75} accessibilityRole="button">
                <Text style={styles.tileValue}>{receivingCount}</Text>
                <Text style={styles.statusLabel}>{t('storageOps.operations.receiving')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statusTile} onPress={() => onOpenActivity('Today')} activeOpacity={0.75} accessibilityRole="button">
                <Text style={styles.tileValue}>{storageMovementCount}</Text>
                <Text style={styles.statusLabel}>{t('storageOps.operations.storage')}</Text>
              </TouchableOpacity>
            </View>

            {highIssuesQuery.data && highIssuesQuery.data.length > 0 ? (
              <>
                <SectionTitle>{t('storageOps.operations.needsAttention')}</SectionTitle>
                {highIssuesQuery.data.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.attentionCard}
                    onPress={onOpenIssues}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                  >
                    <View style={[styles.attentionAccent, { backgroundColor: adminColors.danger.border }]} />
                    <View style={[styles.attentionIcon, { backgroundColor: adminColors.danger.bg }]}>
                      <AlertCircleIcon size={18} color={adminColors.danger.text} />
                    </View>
                    <View style={styles.attentionText}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.statLabel}>{item.issueNumber} · {item.severity}</Text>
                    </View>
                    <ChevronRightIcon color={adminColors.muted} />
                  </TouchableOpacity>
                ))}
              </>
            ) : null}

            {recentRows.length > 0 ? (
              <>
                <SectionTitle
                  right={
                    <TouchableOpacity onPress={() => onOpenActivity('All')} accessibilityRole="button">
                      <Text style={styles.link}>{t('storageOps.operations.viewAll')}</Text>
                    </TouchableOpacity>
                  }
                >
                  {t('storageOps.operations.recentActivity')}
                </SectionTitle>
                {recentRows.map((act) => (
                  <TouchableOpacity key={act.key} style={styles.card} onPress={() => onSelectActivity(act)} activeOpacity={0.75} accessibilityRole="button">
                    <Text style={styles.cardTitle}>{act.title}</Text>
                    <Text style={styles.statLabel}>
                      {act.subtitle} · {act.time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  cardTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  statValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 2,
  },
  link: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  statusRowItem: {
    paddingVertical: adminSpacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRowItemLabel: {
    ...adminType.body,
    color: adminColors.ink,
  },
  statusRowItemValue: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  rowDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  attentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
    overflow: 'hidden',
  },
  attentionAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  attentionIconBrand: {
    marginRight: adminSpacing.sm,
    marginLeft: adminSpacing.xs,
  },
  attentionIcon: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.sm,
    marginLeft: adminSpacing.xs,
  },
  attentionText: {
    flex: 1,
  },
  mainActionTile: {
    width: '31%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
  },
  mainActionLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    textAlign: 'center',
  },
  actionTile: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
  },
  actionLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    textAlign: 'center',
  },
  statusTile: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  tileValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  statusLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
});
