// Design id: M1-S05 (Main side; the Sub single-warehouse dashboard is dashboard-home-more/WarehouseSnapshotScreen, a different screen)
/**
 * Warehouse Overview: every warehouse at a glance, plus the warehouse
 * management the Main admin used to reach through three other screens.
 *
 * Gate (FINAL_LIST 157): Main-only. The screen needs `warehouse.all.view`
 * (MAIN all, SUB none); without it a not-available note renders and
 * WarehouseAdminFlow refuses the route. The 'Manage Warehouses' tile and the
 * Manage SWAs tile need `admin.sub_wh_admin.create`; Settings also needs
 * `warehouse.capacity.set`.
 *
 * Live data (./useWarehouseAdminData.ts): the list from GET /warehouses, each
 * warehouse's capacity from GET /warehouses/{id}/capacity (BR-66b), its OPEN
 * issue count from GET /warehouses/{id}/issues `total` (BR-103, only with
 * `warehouse.issue.view`) and the SWA assignments from GET
 * /admin/sub-warehouse-admins (only with `admin.sub_wh_admin.create`).
 *
 * Removed with the fixtures, because no endpoint carries them: today's
 * receipts, low-stock trigger, staff count (the staff list is cursor-paged
 * with no total) and the per-card operating hours. The "Near Capacity" status
 * and filter are gone too: no near-capacity threshold is exposed to clients
 * (root CLAUDE.md 2.7), so the only capacity flag is "Over capacity", which is
 * the server's own figure (available below zero). Dropped earlier: 'Add
 * Warehouse' (BR-23: four fixed warehouses, no create endpoint; SPEC_GAPS W4x-1).
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { WarningTriangleIcon } from '../storage-ops/StorageParts';
import {
  ChipGroup,
  EmptyState,
  InfoNote,
  KpiRow,
  ScopeHeader,
  SearchBar,
  SectionHint,
  SectionTitle,
  StatusBadge,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  countLabel,
  figureLabel,
  filterWarehouses,
  OVERVIEW_FILTERS,
  overviewFilterLabel,
  subAdminNamesByWarehouse,
  toCapacitySummary,
  warehouseMetaLine,
  warehousesWithoutSubAdmin,
  type CapacitySummaryView,
  type OverviewFilter,
} from './mappers';
import { useOpenIssueCounts, useSubAdmins, useWarehouseCapacities } from './useWarehouseAdminData';
import {
  CapacityBar,
  CapacityIcon,
  EyeIcon,
  GearIcon,
  ManageUsersIcon,
  RefreshIcon,
  ScaleIcon,
  TrendIcon,
  ViewTile,
  ViewTileGrid,
  WAREHOUSE_ADMIN_CODES,
} from './WarehouseAdminParts';
import type { WarehouseScreenBaseProps } from './types';

export interface WarehouseOverviewScreenProps extends WarehouseScreenBaseProps {
  onSelectWarehouse?: ((warehouseId: string) => void) | undefined;
  onOpenSettings?: ((warehouseId: string) => void) | undefined;
  onNavigateComparison?: (() => void) | undefined;
  onNavigatePerformance?: (() => void) | undefined;
  onNavigateCapacitySummary?: (() => void) | undefined;
  onManageSubWarehouseAdmins?: (() => void) | undefined;
  onNavigateStaff?: (() => void) | undefined;
}

export function WarehouseOverviewScreen(props: WarehouseOverviewScreenProps) {
  if (!props.can(WAREHOUSE_ADMIN_CODES.allView)) {
    return (
      <WalletScreen title={t('warehouseAdmin.overview.title')} onBack={props.onBack}>
        <EmptyState title={t('warehouseAdmin.notAvailable.title')} subtitle={t('warehouseAdmin.overview.notAvailable')} />
      </WalletScreen>
    );
  }
  return <WarehouseOverviewContent {...props} />;
}

function WarehouseOverviewContent({
  scope,
  can,
  onBack,
  onSelectWarehouse,
  onOpenSettings,
  onNavigateComparison,
  onNavigatePerformance,
  onNavigateCapacitySummary,
  onManageSubWarehouseAdmins,
  onNavigateStaff,
}: WarehouseOverviewScreenProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<OverviewFilter>('all');
  const [managing, setManaging] = useState(false);

  const canManage = can(WAREHOUSE_ADMIN_CODES.swaCreate);
  const canIssues = can(WAREHOUSE_ADMIN_CODES.issueView);
  const canSettings = can(WAREHOUSE_ADMIN_CODES.capacitySet) && onOpenSettings !== undefined;
  const canStaff = can(WAREHOUSE_ADMIN_CODES.staffView);
  const manageSwas = canManage ? onManageSubWarehouseAdmins : undefined;

  const warehouses = useWarehouseOptions();
  const ids = useMemo(() => warehouses.options.map((o) => o.warehouseId), [warehouses.options]);
  const capacities = useWarehouseCapacities(ids, true);
  const issueCounts = useOpenIssueCounts(ids, canIssues);
  const subAdmins = useSubAdmins(canManage);

  const visible = useMemo(() => filterWarehouses(warehouses.options, query, filter), [warehouses.options, query, filter]);
  const summaries = useMemo(() => {
    const out = new Map<string, CapacitySummaryView>();
    for (const [id, r] of capacities) if (r.data !== undefined) out.set(id, toCapacitySummary(r.data));
    return out;
  }, [capacities]);
  const swaNames = useMemo(() => subAdminNamesByWarehouse(subAdmins.data ?? []), [subAdmins.data]);
  const unstaffed = subAdmins.data === undefined ? [] : warehousesWithoutSubAdmin(warehouses.options, subAdmins.data);
  const overCapacity = warehouses.options.filter((o) => summaries.get(o.warehouseId)?.overCapacity === true);

  const state = queryViewState({ isLoading: warehouses.isLoading, error: warehouses.error, itemCount: warehouses.options.length });
  const total = warehouses.options.length;

  const kpis = [
    { value: countLabel(total), label: t('warehouseAdmin.overview.kpi.total') },
    {
      value: countLabel(warehouses.options.filter((o) => o.isActive).length),
      label: t('warehouseAdmin.overview.kpi.active'),
      tone: 'success' as const,
    },
    { value: countLabel(overCapacity.length), label: t('warehouseAdmin.overview.kpi.overCapacity'), tone: 'warning' as const },
    ...(canManage
      ? [
          {
            value: figureLabel(subAdmins, () => countLabel(unstaffed.length)),
            label: t('warehouseAdmin.overview.kpi.noSwa'),
            tone: 'danger' as const,
          },
        ]
      : []),
  ];

  return (
    <WalletScreen
      title={t('warehouseAdmin.overview.title')}
      subtitle={state === 'ready' ? t('warehouseAdmin.overview.subtitle', { count: String(total) }) : undefined}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={t('warehouseAdmin.scope.all')} />}
    >
      {state === 'loading' ? <AdminLoadingState /> : null}
      {state === 'error' ? <AdminErrorState error={warehouses.error} onRetry={warehouses.refresh} /> : null}
      {state === 'empty' ? <AdminEmptyState title={t('warehouseAdmin.overview.empty')} /> : null}
      {state === 'ready' ? (
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
          <KpiRow items={kpis} />
          <SearchBar value={query} onChangeText={setQuery} placeholder={t('warehouseAdmin.overview.search')} />
          <ChipGroup options={OVERVIEW_FILTERS} value={filter} onChange={setFilter} labelOf={overviewFilterLabel} />

          <SectionTitle
            right={
              <SectionHint>
                {managing
                  ? t('warehouseAdmin.overview.managing')
                  : t('warehouseAdmin.overview.shown', { count: String(visible.length) })}
              </SectionHint>
            }
          >
            {t('warehouseAdmin.overview.section.warehouses')}
          </SectionTitle>
          {visible.length === 0 ? (
            <EmptyState title={t('warehouseAdmin.overview.noMatch.title')} subtitle={t('warehouseAdmin.overview.noMatch.subtitle')} />
          ) : null}
          {visible.map((w) => {
            const capacity = capacities.get(w.warehouseId);
            const summary = summaries.get(w.warehouseId);
            const swa = swaNames.get(w.warehouseId);
            const badge = !w.isActive
              ? { label: t('warehouseAdmin.status.inactive'), tone: 'danger' as const }
              : summary?.overCapacity
                ? { label: t('warehouseAdmin.capacity.over', { percent: summary.percentLabel ?? '' }), tone: 'warning' as const }
                : summary !== undefined
                  ? {
                      label:
                        summary.percentLabel === null
                          ? t('warehouseAdmin.capacity.notSet')
                          : t('warehouseAdmin.capacity.percentUsed', { percent: summary.percentLabel }),
                      tone: 'success' as const,
                    }
                  : undefined;
            const card = (
              <>
                <View style={styles.cardTopRow}>
                  <View style={styles.flex}>
                    <Text style={styles.whName}>{w.warehouseName}</Text>
                    <Text style={styles.meta}>{warehouseMetaLine(w)}</Text>
                  </View>
                  {badge ? <StatusBadge label={badge.label} tone={badge.tone} /> : null}
                </View>
                <CapacityBar percent={summary?.fillPercent ?? 0} warning={summary?.overCapacity === true} />
                <Text style={styles.capacityText}>
                  {figureLabel(capacity, (dto) => {
                    const s = toCapacitySummary(dto);
                    return s.capacityLabel === null
                      ? t('warehouseAdmin.capacity.usedOnly', { used: s.usedLabel })
                      : t('warehouseAdmin.capacity.usedOf', { used: s.usedLabel, capacity: s.capacityLabel });
                  })}
                </Text>
                <View style={styles.statsRow}>
                  <Stat label={t('warehouseAdmin.overview.stat.stock')} value={figureLabel(capacity, (dto) => toCapacitySummary(dto).usedLabel)} />
                  <Stat
                    label={t('warehouseAdmin.overview.stat.available')}
                    value={figureLabel(capacity, (dto) => toCapacitySummary(dto).availableLabel ?? t('warehouseAdmin.figure.unavailable'))}
                  />
                  {canIssues ? (
                    <Stat label={t('warehouseAdmin.overview.stat.openIssues')} value={figureLabel(issueCounts.get(w.warehouseId), countLabel)} />
                  ) : null}
                </View>
                {managing ? (
                  <>
                    {canManage ? (
                      <View style={styles.statsRow}>
                        <Stat
                          label={t('warehouseAdmin.overview.stat.swa')}
                          value={figureLabel(subAdmins, () =>
                            swa === undefined ? t('warehouseAdmin.swa.unassigned') : swa.join(t('warehouseAdmin.listSeparator')),
                          )}
                        />
                      </View>
                    ) : null}
                    <View style={styles.actionsRow}>
                      {canSettings ? (
                        <CardAction
                          label={t('warehouseAdmin.action.settings')}
                          primary
                          icon={<GearIcon size={15} color={adminColors.onBrand} />}
                          onPress={() => onOpenSettings?.(w.warehouseId)}
                        />
                      ) : null}
                      {onSelectWarehouse ? (
                        <CardAction
                          label={t('warehouseAdmin.action.viewHub')}
                          icon={<EyeIcon size={15} />}
                          onPress={() => onSelectWarehouse(w.warehouseId)}
                        />
                      ) : null}
                      {onNavigateCapacitySummary ? (
                        <CardAction
                          label={t('warehouseAdmin.action.capacity')}
                          icon={<CapacityIcon size={15} />}
                          onPress={onNavigateCapacitySummary}
                        />
                      ) : null}
                    </View>
                  </>
                ) : null}
              </>
            );
            if (managing || onSelectWarehouse === undefined) {
              return (
                <View key={w.warehouseId} style={styles.card}>
                  {card}
                </View>
              );
            }
            return (
              <TouchableOpacity
                key={w.warehouseId}
                style={styles.card}
                onPress={() => onSelectWarehouse(w.warehouseId)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('warehouseAdmin.overview.cardA11y', { name: w.warehouseName })}
              >
                {card}
              </TouchableOpacity>
            );
          })}

          {overCapacity.length > 0 || unstaffed.length > 0 ? (
            <SectionTitle>{t('warehouseAdmin.overview.section.attention')}</SectionTitle>
          ) : null}
          {overCapacity.map((w) => (
            <InfoNote key={`cap-${w.warehouseId}`} tone="warning" icon={<WarningTriangleIcon color={adminColors.warning.text} />}>
              {t('warehouseAdmin.overview.attention.overCapacity', {
                name: w.warehouseName,
                percent: summaries.get(w.warehouseId)?.percentLabel ?? '',
              })}
            </InfoNote>
          ))}
          {unstaffed.map((w) => (
            <InfoNote key={`swa-${w.warehouseId}`} tone="danger">
              {manageSwas
                ? t('warehouseAdmin.overview.attention.noSwaCreate', { name: w.warehouseName })
                : t('warehouseAdmin.overview.attention.noSwa', { name: w.warehouseName })}
            </InfoNote>
          ))}

          <SectionTitle>{t('warehouseAdmin.overview.section.moreViews')}</SectionTitle>
          <ViewTileGrid>
            {onNavigateComparison ? (
              <ViewTile label={t('warehouseAdmin.overview.tile.comparison')} icon={<ScaleIcon />} onPress={onNavigateComparison} />
            ) : null}
            {onNavigatePerformance ? (
              <ViewTile label={t('warehouseAdmin.overview.tile.performance')} icon={<TrendIcon />} onPress={onNavigatePerformance} />
            ) : null}
            {onNavigateCapacitySummary ? (
              <ViewTile
                label={t('warehouseAdmin.overview.tile.capacitySummary')}
                icon={<RefreshIcon />}
                onPress={onNavigateCapacitySummary}
              />
            ) : null}
            {canManage ? (
              <ViewTile
                label={managing ? t('warehouseAdmin.overview.tile.doneManaging') : t('warehouseAdmin.overview.tile.manageWarehouses')}
                icon={<GearIcon />}
                onPress={() => setManaging((m) => !m)}
              />
            ) : null}
            {manageSwas ? (
              <ViewTile label={t('warehouseAdmin.overview.tile.manageSwas')} icon={<ManageUsersIcon />} onPress={manageSwas} />
            ) : null}
            {canStaff && onNavigateStaff ? (
              <ViewTile label={t('warehouseAdmin.overview.tile.staff')} icon={<ManageUsersIcon />} onPress={onNavigateStaff} />
            ) : null}
          </ViewTileGrid>
        </ScrollView>
      ) : null}
    </WalletScreen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function CardAction({
  label,
  icon,
  onPress,
  primary = false,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.action, primary && styles.actionPrimary]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      {icon}
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: adminSpacing.sm },
  whName: { ...adminType.sectionHead, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  capacityText: { ...adminType.rowMeta, color: adminColors.muted },
  statsRow: { flexDirection: 'row', gap: adminSpacing.sm },
  stat: { flex: 1 },
  statLabel: { ...adminType.caption, color: adminColors.muted },
  statValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: adminSpacing.xs },
  actionsRow: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.xs },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  actionPrimary: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  actionText: { ...adminType.caption, color: adminColors.ink },
  actionTextPrimary: { color: adminColors.onBrand },
});
