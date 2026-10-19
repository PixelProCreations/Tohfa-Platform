/**
 * Warehouse Operations: the storage-ops hub for ONE warehouse (Sub: its own,
 * locked; Main: the one picked in the header), composed only from live
 * endpoints:
 *   - Storage Locations: the location total (GET .../storage-locations);
 *   - Utilisation: GET .../capacity (the server's percentage);
 *   - Open Issues: the server totals of OPEN + IN_PROGRESS (GET .../issues);
 *   - Today's Activity: today's IST events of the feed (GET .../activity),
 *     "N+" when the capped walk did not reach the end;
 *   - Needs Attention: the newest OPEN issues, and over-capacity when the
 *     capacity read says so (a fact, not a threshold);
 *   - Recent Activity: the newest events of the feed.
 * The old staff-present, receiving / verification counts and
 * per-warehouse cards were fixed numbers and are gone.
 *
 * Areas gated in ../availability.ts stay gated: tiles into them
 * carry an `area` and are filtered on isAreaAvailable; links drawn outside the
 * tile arrays go through `*Link` aliases that are undefined when the area is
 * hidden; and the data of a hidden area is not fetched at all.
 */
// Design id: M4-S01
import React, { useEffect } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { BellRingIcon, HeaderIconButton, SectionTitle, WalletScreen, WarehouseTabBar, walletLayout } from '../wallet-cashtopup/WalletParts';
import { isAreaAvailable, type WarehouseArea } from '../availability';
import { countLabel, toCapacityView, type ActivityRow } from './mappers';
import {
  AlertCircleIcon,
  ChevronRightIcon,
  DonutIcon,
  HistoryIcon,
  ReceiveGoodsIcon,
  ReportIssueIcon,
  ShelfIcon,
  STORAGE_CODES,
} from './StorageParts';
import type { StorageWarehouse } from './StorageWarehouse';
import {
  useCapacity,
  useIssueCounts,
  useIssuePreview,
  useRecentActivity,
  useStorageLocationList,
  useTodayActivity,
} from './useStorageData';
import { ActivityRowCard } from './WarehouseActivityScreen';
import type { ActivityModule, WarehouseScreenBaseProps } from './types';

/** A tile or action into a hidden-able area; untagged entries always show. */
type AreaTagged = { area?: WarehouseArea | undefined };

const UNRESOLVED = ['OPEN', 'IN_PROGRESS'] as const;

export interface WarehouseOperationsScreenProps extends WarehouseScreenBaseProps {
  warehouse: StorageWarehouse;
  onOpenCapacity: () => void;
  onOpenIssues: () => void;
  /** Warehouse Activity on a preset ('Today' = Today's Operational Status). */
  onOpenActivity: (preset: 'Today' | 'All') => void;
  onSelectActivity: (row: ActivityRow) => void;
  /** Modules outside storage-ops: storage locations, receiving. */
  onOpenModule: (module: ActivityModule) => void;
  onOpenNotifications?: (() => void) | undefined;
  /** Main: Warehouse Overview "View" link. */
  onOpenWarehouseOverview?: (() => void) | undefined;
  /** Main: the picked warehouse (by display name, as the Main shell keys warehouses). */
  onSelectWarehouse?: ((warehouseName: string) => void) | undefined;
}

export function WarehouseOperationsScreen({
  can,
  onBack,
  onTabChange,
  warehouse,
  onOpenCapacity,
  onOpenIssues,
  onOpenActivity,
  onSelectActivity,
  onOpenModule,
  onOpenNotifications,
  onOpenWarehouseOverview,
  onSelectWarehouse,
}: WarehouseOperationsScreenProps) {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const issuesAvailable = isAreaAvailable('operationalIssues', can);
  const activityAvailable = isAreaAvailable('warehouseActivity', can);
  const shown = (item: AreaTagged) => item.area === undefined || isAreaAvailable(item.area, can);
  // Links drawn outside the tile arrays; undefined when the area is hidden.
  const issuesLink = issuesAvailable ? onOpenIssues : undefined;
  const activityLink = activityAvailable ? onOpenActivity : undefined;
  const selectActivityLink = activityAvailable ? onSelectActivity : undefined;

  const id = warehouse.warehouseId;
  const locations = useStorageLocationList(can(STORAGE_CODES.batchView) ? id : undefined);
  const capacity = useCapacity(id);
  const issueCounts = useIssueCounts(issuesAvailable ? id : undefined, UNRESOLVED);
  const openIssues = useIssuePreview(issuesAvailable ? id : undefined, 'OPEN');
  const today = useTodayActivity(activityAvailable ? id : undefined);
  const recent = useRecentActivity(activityAvailable ? id : undefined);

  const none = t('storageOps.notAvailable');
  const cap = capacity.capacity === undefined ? undefined : toCapacityView(capacity.capacity);
  const unresolved =
    issueCounts.counts.OPEN === undefined || issueCounts.counts.IN_PROGRESS === undefined
      ? none
      : String(issueCounts.counts.OPEN + issueCounts.counts.IN_PROGRESS);
  const locationCount = locations.isLoading || locations.error ? none : countLabel(locations.items.length, locations.complete);
  const todayCount = today.isLoading || today.error ? none : countLabel(today.rows.length, today.complete);

  const tiles: ({ label: string; value: string; icon: React.ReactNode; onPress: () => void } & AreaTagged)[] = [
    { label: t('storageOps.hub.locations'), value: locationCount, icon: <ShelfIcon size={22} color={adminColors.brand} />, onPress: () => onOpenModule('storage') },
    { label: t('storageOps.hub.utilization'), value: cap?.utilizationLabel ?? none, icon: <DonutIcon size={22} color={adminColors.brand} />, onPress: onOpenCapacity },
    { label: t('storageOps.hub.openIssues'), value: unresolved, icon: <AlertCircleIcon size={22} />, onPress: onOpenIssues, area: 'operationalIssues' },
    { label: t('storageOps.hub.todayActivity'), value: todayCount, icon: <HistoryIcon size={22} />, onPress: () => onOpenActivity('Today'), area: 'warehouseActivity' },
  ];

  const quickActions: ({ label: string; icon: React.ReactNode; onPress: () => void } & AreaTagged)[] = [
    { label: t('storageOps.hub.action.locations'), icon: <ShelfIcon size={24} color={adminColors.brand} />, onPress: () => onOpenModule('storage') },
    { label: t('storageOps.hub.action.capacity'), icon: <DonutIcon size={24} color={adminColors.brand} />, onPress: onOpenCapacity },
    { label: t('storageOps.hub.action.issues'), icon: <ReportIssueIcon size={24} color={adminColors.brand} />, onPress: onOpenIssues, area: 'operationalIssues' },
    { label: t('storageOps.hub.action.receive'), icon: <ReceiveGoodsIcon size={24} color={adminColors.success.text} />, onPress: () => onOpenModule('receiving') },
    { label: t('storageOps.hub.action.activity'), icon: <HistoryIcon size={24} />, onPress: () => onOpenActivity('All'), area: 'warehouseActivity' },
  ];

  return (
    <WalletScreen
      title={t('storageOps.hub.title')}
      onBack={onBack}
      headerRight={
        onOpenNotifications ? (
          <HeaderIconButton onPress={onOpenNotifications} accessibilityLabel={t('storageOps.hub.notifications')}>
            <BellRingIcon size={20} color={adminColors.onBrand} />
          </HeaderIconButton>
        ) : undefined
      }
      headerExtra={warehouse.header}
      footer={onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined}
    >
      {warehouse.placeholder ?? (
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
          {warehouse.isMain && (onSelectWarehouse || onOpenWarehouseOverview) ? (
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => {
                if (onSelectWarehouse && warehouse.warehouseName !== undefined) onSelectWarehouse(warehouse.warehouseName);
                else onOpenWarehouseOverview?.();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.link}>{t('storageOps.hub.openWarehouse')}</Text>
              <ChevronRightIcon />
            </TouchableOpacity>
          ) : null}

          <SectionTitle>{t('storageOps.hub.overview')}</SectionTitle>
          <View style={styles.grid}>
            {tiles.filter(shown).map((tile) => (
              <TouchableOpacity key={tile.label} style={styles.tile} onPress={tile.onPress} activeOpacity={0.75} accessibilityRole="button">
                <View style={styles.tileIcon}>{tile.icon}</View>
                <Text style={styles.tileValue}>{tile.value}</Text>
                <Text style={styles.tileLabel}>{tile.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <SectionTitle>{t('storageOps.hub.quickActions')}</SectionTitle>
          <View style={styles.grid}>
            {quickActions.filter(shown).map((qa) => (
              <TouchableOpacity key={qa.label} style={styles.actionTile} onPress={qa.onPress} activeOpacity={0.75} accessibilityRole="button">
                {qa.icon}
                <Text style={styles.actionLabel}>{qa.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {cap?.overCapacity || (issuesLink && openIssues.rows.length > 0) ? (
            <SectionTitle>{t('storageOps.hub.attention')}</SectionTitle>
          ) : null}
          {cap?.overCapacity ? (
            <TouchableOpacity style={styles.attentionCard} onPress={onOpenCapacity} activeOpacity={0.75} accessibilityRole="button">
              <View style={[styles.attentionAccent, { backgroundColor: adminColors.danger.border }]} />
              <View style={styles.attentionText}>
                <Text style={styles.cardTitle}>{t('storageOps.capacity.over')}</Text>
                <Text style={styles.meta}>{t('storageOps.performance.capacityLine', { used: cap.used, capacity: cap.capacity ?? none })}</Text>
              </View>
              <ChevronRightIcon color={adminColors.muted} />
            </TouchableOpacity>
          ) : null}
          {issuesLink
            ? openIssues.rows.map((issue) => (
                <TouchableOpacity key={issue.id} style={styles.attentionCard} onPress={issuesLink} activeOpacity={0.75} accessibilityRole="button">
                  <View style={[styles.attentionAccent, { backgroundColor: adminColors[issue.severityTone].border }]} />
                  <View style={styles.attentionText}>
                    <Text style={styles.cardTitle}>{issue.title}</Text>
                    <Text style={styles.meta}>
                      {t('storageOps.issues.rowMeta', { category: issue.categoryLabel, severity: issue.severityLabel })}
                    </Text>
                  </View>
                  <ChevronRightIcon color={adminColors.muted} />
                </TouchableOpacity>
              ))
            : null}

          {/* Recent Activity lists records of the activity area, so it goes with it. */}
          {activityLink && selectActivityLink ? (
            <>
              <SectionTitle
                right={
                  <TouchableOpacity onPress={() => activityLink('All')} accessibilityRole="button">
                    <Text style={styles.link}>{t('storageOps.hub.viewAll')}</Text>
                  </TouchableOpacity>
                }
              >
                {t('storageOps.hub.recent')}
              </SectionTitle>
              {recent.rows.length === 0 && !recent.isLoading ? <Text style={styles.meta}>{t('storageOps.activity.empty')}</Text> : null}
              {recent.rows.map((row) => (
                <ActivityRowCard key={row.key} row={row} onPress={() => selectActivityLink(row)} />
              ))}
            </>
          ) : null}
        </ScrollView>
      )}
    </WalletScreen>
  );
}

const TILE_ICON = 36;

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: adminSpacing.xs, marginBottom: adminSpacing.sm },
  link: { ...adminType.caption, color: adminColors.brand },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  tileIcon: {
    width: TILE_ICON,
    height: TILE_ICON,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  tileValue: { ...adminType.kpiValue, color: adminColors.ink },
  tileLabel: { ...adminType.rowTitle, color: adminColors.ink, marginTop: adminSpacing.xs },
  actionTile: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.xs,
    alignItems: 'center',
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  actionLabel: { ...adminType.caption, color: adminColors.ink, textAlign: 'center' },
  attentionCard: {
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
  attentionAccent: { width: adminSpacing.xs, alignSelf: 'stretch' },
  attentionText: { flex: 1 },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted },
});
