/**
 * Warehouse & Operations Overview Screen, ported from the Super Admin design
 * (origin/Superadmin-main screens/dashboard/WarehouseOperationsOverviewScreen.tsx).
 * Shared by the Super Admin, TOHFA Admin and Main Warehouse Admin shells; every
 * query is gated by its route's code, so a caller without it gets the dash.
 *
 * Figures and their source (all six tiles are always drawn):
 *   Total warehouses      GET /warehouses                   warehouse.all.view
 *   Inventory (total)     GET /admin/inventory/overview     inventory.batch.view   sum of free shelf (BR-100/116)
 *   Pending receipts      GET /admin/tasks/summary          task.own.view          open GOODS_RECEIPT_QC tasks
 *   Pending verifications GET /admin/inventory/overview     inventory.batch.view   RECORDED stock counts (BR-107)
 *   Active transfers      GET /warehouse-transfers          transfer.inter_warehouse.view  PENDING_APPROVAL + IN_TRANSIT
 *   Exceptions            GET /admin/inventory/overview     inventory.batch.view   RECORDED counts with a variance
 * The warehouse list rows come from GET /warehouses plus each warehouse's
 * capacity (warehouse.own.view); a missing capacity is the dash.
 */
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import {
  BackArrowIcon,
  BuildingWarehouseIcon,
  ClipboardListIcon,
  FilterSlidersIcon,
  PackageBoxIcon,
  PieChartIcon,
  SwitchArrowsIcon,
} from '../../components/AdminIcons';
import { OverviewCardsGrid, OverviewDashboardCard, OverviewSectionHeader } from '../../components/OverviewDashboardCard';
import { OverviewActionCard } from '../../components/OverviewSuperAdminCards';
import { AdminStatusBadge } from '../../components/AdminStatusBadge';
import { useAdminQuery } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import type { InventoryOverviewDto } from '../../api/inventoryOverview';
import { listWarehouseTransfers } from '../../api/transfers';
import type { WarehouseCapacityDto, WarehouseDto } from '../../api/warehouses';
import { formatKg, parseKgToGrams } from '../../money/quantity';
import type { Can } from '../../permissions/can';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { useWarehouseOverviewData, type Fetched } from '../operations/useWarehouseOverviewData';
import { useWorkQueueSummary } from '../work-queue/useWorkQueueData';
import { countText } from './saOverviewFormat';

export interface WarehouseOperationsOverviewScreenProps {
  /** Permission check from /auth/me. Missing denies every read and the gated tiles (fail closed). */
  can?: Can | undefined;
  onBack: () => void;
  onNavigateSubScreen?: ((subscreen: string) => void) | undefined;
}

/** docs/rbac.json codes (also the API routes' own codes). */
const CODES = {
  warehouses: 'warehouse.all.view',
  capacity: 'warehouse.own.view',
  overview: 'inventory.batch.view',
  tasks: 'task.own.view',
  transfersView: 'transfer.inter_warehouse.view',
  transferInitiate: 'transfer.inter_warehouse.initiate',
  allocation: 'allocation.channel_percentage.set',
} as const;

const MODULE = 'saWhOps';
const RECEIPT_TASK_TYPE = 'GOODS_RECEIPT_QC';
const BACK_SIZE = adminSpacing.xxl + adminSpacing.xs;
const BACK_ICON_SIZE = adminSpacing.lg + adminSpacing.xs + adminSpacing.xs;
const QUICK_ICON_SIZE = adminSpacing.lg + adminSpacing.xs;

function fromOverview(src: Fetched<InventoryOverviewDto>, pick: (o: InventoryOverviewDto) => unknown): string {
  return src.status === 'ok' ? countText(pick(src.data)) : ADMIN_NO_VALUE;
}

/** Free shelf summed as integer grams; the dash when any row is unreadable. */
export function totalInventoryText(src: Fetched<InventoryOverviewDto>): string {
  if (src.status !== 'ok') return ADMIN_NO_VALUE;
  let sum = 0;
  for (const row of src.data.warehouses) {
    const grams = parseKgToGrams(row.availableQtyKg);
    if (grams === null) return ADMIN_NO_VALUE;
    sum += grams;
  }
  return formatKg(sum);
}

/** "50,000 kg capacity · 42% used"; each unknown part is the dash. */
export function capacityMeta(src: Fetched<WarehouseCapacityDto> | undefined): string {
  const data = src?.status === 'ok' ? src.data : undefined;
  const grams = data?.capacityKg ? parseKgToGrams(data.capacityKg) : null;
  const pct = data?.utilizationPercent;
  return t('saWhOps.wh.capacity', {
    capacity: grams === null ? ADMIN_NO_VALUE : formatKg(grams),
    used: typeof pct === 'number' ? String(Math.round(pct)) : ADMIN_NO_VALUE,
  });
}

function sortWarehouses(list: readonly WarehouseDto[]): WarehouseDto[] {
  return [...list].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    if (a.type !== b.type) return a.type === 'MAIN' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function WarehouseOperationsOverviewScreen({ can, onBack, onNavigateSubScreen }: WarehouseOperationsOverviewScreenProps) {
  const has = (code: string): boolean => typeof can === 'function' && can(code);

  const data = useWarehouseOverviewData({
    enabled: has(CODES.warehouses),
    overview: has(CODES.overview),
    capacity: has(CODES.capacity),
    // The hook's transfer reads are per warehouse; this screen only needs the network total below.
    transfers: false,
  });
  const summary = useWorkQueueSummary(undefined, has(CODES.tasks));
  const active = useAdminQuery(
    adminKeys.scoped(MODULE, undefined, { resource: 'activeTransfers' }),
    async (signal) => {
      const [pending, inTransit] = await Promise.all([
        listWarehouseTransfers({ status: 'PENDING_APPROVAL', page: 1, pageSize: 1 }, signal),
        listWarehouseTransfers({ status: 'IN_TRANSIT', page: 1, pageSize: 1 }, signal),
      ]);
      return pending.total + inTransit.total;
    },
    { enabled: has(CODES.transfersView) },
  );

  const warehouses = sortWarehouses(data.warehouses.data ?? []);
  const receipts = summary.data?.byType[RECEIPT_TASK_TYPE];
  const nav = (id: string): (() => void) | undefined => (onNavigateSubScreen ? () => onNavigateSubScreen(id) : undefined);
  const stroke = adminColors.brandDeep;

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="saWhOps.back"
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('saWhOps.back')}
        >
          <BackArrowIcon size={BACK_ICON_SIZE} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('saWhOps.title')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 6 KPI Cards Grid */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard
            title={t('saWhOps.kpi.warehouses')}
            value={data.warehouses.data ? countText(data.warehouses.data.length) : ADMIN_NO_VALUE}
            titlePosition="top"
            onPress={nav('warehouse_list')}
          />
          <OverviewDashboardCard
            title={t('saWhOps.kpi.inventory')}
            value={totalInventoryText(data.overview)}
            titlePosition="top"
            onPress={nav('inventory_flow')}
          />
          <OverviewDashboardCard
            title={t('saWhOps.kpi.receipts')}
            value={countText(receipts)}
            titlePosition="top"
            onPress={nav('receiving_qc')}
          />
          <OverviewDashboardCard
            title={t('saWhOps.kpi.verifications')}
            value={fromOverview(data.overview, (o) => o.unreconciledVerificationCount)}
            titlePosition="top"
            onPress={nav('verification_flow')}
          />
          <OverviewDashboardCard
            title={t('saWhOps.kpi.transfers')}
            value={countText(active.data)}
            titlePosition="top"
            onPress={nav('transfers_flow')}
          />
          <OverviewDashboardCard
            title={t('saWhOps.kpi.exceptions')}
            value={fromOverview(data.overview, (o) => o.varianceUnreconciledVerificationCount)}
            titlePosition="top"
            onPress={nav('exceptions_flow')}
          />
        </OverviewCardsGrid>

        {/* Quick Access */}
        <OverviewSectionHeader title={t('saWhOps.quick.heading')} actionLabel="" />
        <OverviewCardsGrid style={styles.quickGrid}>
          <OverviewActionCard
            title={t('saWhOps.quick.warehouses')}
            icon={<BuildingWarehouseIcon size={QUICK_ICON_SIZE} color={stroke} />}
            onPress={nav('warehouse_list')}
          />
          <OverviewActionCard
            title={t('saWhOps.quick.stock')}
            icon={<PackageBoxIcon size={QUICK_ICON_SIZE} color={stroke} />}
            onPress={nav('inventory_flow')}
          />
          <OverviewActionCard
            title={t('saWhOps.quick.verification')}
            icon={<ClipboardListIcon size={QUICK_ICON_SIZE} color={stroke} />}
            onPress={nav('verification_flow')}
          />
          {has(CODES.transferInitiate) ? (
            <OverviewActionCard
              title={t('saWhOps.quick.transfer')}
              icon={<SwitchArrowsIcon size={QUICK_ICON_SIZE} color={stroke} />}
              onPress={nav('transfers_flow')}
            />
          ) : null}
          <OverviewActionCard
            title={t('saWhOps.quick.adjustments')}
            icon={<FilterSlidersIcon size={QUICK_ICON_SIZE} color={stroke} />}
            onPress={nav('adjustments_flow')}
          />
          {has(CODES.allocation) ? (
            <OverviewActionCard
              title={t('saWhOps.quick.allocation')}
              icon={<PieChartIcon size={QUICK_ICON_SIZE} color={stroke} />}
              onPress={nav('allocation')}
            />
          ) : null}
        </OverviewCardsGrid>

        {/* Warehouses Section */}
        <OverviewSectionHeader title={t('saWhOps.list.heading')} actionLabel="" />
        <View style={styles.warehousesList} testID="saWhOps.list">
          {warehouses.length === 0 ? (
            <View style={styles.whCard} testID="saWhOps.empty">
              <Text style={styles.whMeta}>{data.warehouses.isLoading ? t('saWhOps.list.loading') : t('saWhOps.list.empty')}</Text>
            </View>
          ) : null}
          {warehouses.map((wh) => (
            <View key={wh.id} style={styles.whCard} testID={`saWhOps.wh.${wh.id}`}>
              <View style={styles.whCardLeft}>
                <Text style={styles.whName}>{t('saWhOps.wh.name', { name: wh.name, code: wh.code })}</Text>
                <Text style={styles.whMeta}>{capacityMeta(data.capacityById[wh.id])}</Text>
              </View>
              <AdminStatusBadge
                label={t(wh.isActive ? 'saWhOps.wh.active' : 'saWhOps.wh.inactive')}
                tone={wh.isActive ? 'success' : 'warning'}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backButton: {
    width: BACK_SIZE,
    height: BACK_SIZE,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  kpiGrid: {
    marginBottom: adminSpacing.md,
  },
  quickGrid: {
    marginBottom: adminSpacing.md,
  },
  warehousesList: {
    gap: adminSpacing.sm,
  },
  whCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  whCardLeft: {
    flex: 1,
    gap: adminSpacing.xs / 2,
  },
  whName: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontWeight: '700',
  },
  whMeta: {
    ...adminType.caption,
    color: adminColors.muted,
  },
});
