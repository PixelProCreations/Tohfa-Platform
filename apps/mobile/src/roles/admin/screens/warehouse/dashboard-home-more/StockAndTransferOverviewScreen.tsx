/**
 * Stock & Transfer Overview (Main only): stock held per warehouse, the
 * low-stock count and the inter-warehouse transfer counts, all live.
 *
 *   Stock per warehouse   GET /warehouses (list) + GET /warehouses/{id}/capacity usedKg
 *                         (ACTIVE batches, BR-66b)
 *   Low stock             LOW_STOCK alerts (GET /admin/alerts?type=LOW_STOCK, BR-77)
 *   Transfers             GET /warehouse-transfers?status=..., `total` per status (BR-102)
 *
 * "Surplus" was in the design but no endpoint defines it, so it is not shown.
 *
 * Gate (FINAL_LIST 22): route-guarded on `warehouse.all.view` (MAIN all, SUB
 * none); without it a not-available note renders and HomeFlow refuses the
 * route. Initiate Stock Transfer shows only with
 * `transfer.inter_warehouse.initiate`. The server re-checks every call.
 */
import React from 'react';
import { ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { useLowStockRows } from '../inventory/useInventoryData';
import { EmptyState, WalletButton, WalletFooter, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import type { WarehouseScreenBaseProps } from '../finance-expenses/types';
import { DataRowCard, HOME_CODES, SectionLink, SummaryCard } from './HomeParts';
import { transferCountRows, warehouseStockRows } from './mappers_dashboardHome';
import { useTransferStatusCounts, useWarehouseCapacities } from './useDashboardHomeData';

function TransferArrowsIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface StockAndTransferOverviewScreenProps extends WarehouseScreenBaseProps {
  onInitiateTransfer?: (() => void) | undefined;
  onViewConsolidatedStock?: (() => void) | undefined;
  onViewLowStock?: (() => void) | undefined;
  onViewTransfers?: (() => void) | undefined;
}

export function StockAndTransferOverviewScreen({
  can,
  onBack,
  onInitiateTransfer,
  onViewConsolidatedStock,
  onViewLowStock,
  onViewTransfers,
}: StockAndTransferOverviewScreenProps) {
  const allowed = can(HOME_CODES.allView);
  const warehouses = useWarehouseOptions({ enabled: allowed });
  const ids = warehouses.options.map((o) => o.warehouseId);
  const capacities = useWarehouseCapacities(ids, allowed);
  const lowStock = useLowStockRows(undefined);
  const transferCounts = useTransferStatusCounts(undefined, allowed);

  if (!allowed) {
    return (
      <WalletScreen title={t('dashboardHome.stockTransfer.title')} onBack={onBack}>
        <EmptyState title={t('dashboardHome.notAvailable')} subtitle={t('dashboardHome.needsAllView')} />
      </WalletScreen>
    );
  }

  const stock = warehouseStockRows(warehouses.options, capacities.data);
  const lowStockText =
    lowStock.isLoading
      ? t('async.loading')
      : lowStock.error !== null && lowStock.error !== undefined
        ? t('async.error.title')
        : t('dashboardHome.stockTransfer.lowStockCount', { count: lowStock.rows.length });

  return (
    <WalletScreen
      title={t('dashboardHome.stockTransfer.title')}
      subtitle={t('dashboardHome.stockTransfer.subtitle')}
      onBack={onBack}
      footer={
        onInitiateTransfer !== undefined && can(HOME_CODES.transferInitiate) ? (
          <WalletFooter>
            <WalletButton label={t('dashboardHome.stockTransfer.initiate')} icon={<TransferArrowsIcon />} onPress={onInitiateTransfer} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionLink title={t('dashboardHome.stockTransfer.stock')} linkLabel={t('dashboardHome.viewAll')} onPress={onViewConsolidatedStock} />
        {warehouses.isLoading || (capacities.isPending && capacities.fetchStatus !== 'idle') ? (
          <AdminLoadingState />
        ) : warehouses.error || capacities.error ? (
          <AdminErrorState
            error={warehouses.error ?? capacities.error}
            onRetry={() => {
              warehouses.refresh();
              void capacities.refetch();
            }}
          />
        ) : (
          <DataRowCard
            rows={stock.rows.map((r) => ({ label: r.label, value: r.value }))}
            total={{ label: t('dashboardHome.total'), value: stock.total }}
          />
        )}

        <SectionLink title={t('dashboardHome.stockTransfer.lowStock')} linkLabel={t('dashboardHome.viewAll')} onPress={onViewLowStock} />
        <SummaryCard text={lowStockText} onPress={onViewLowStock} />

        <SectionLink title={t('dashboardHome.stockTransfer.transfers')} linkLabel={t('dashboardHome.viewAll')} onPress={onViewTransfers} />
        {transferCounts.error ? (
          <AdminErrorState error={transferCounts.error} onRetry={() => void transferCounts.refetch()} />
        ) : (
          <DataRowCard rows={transferCountRows(transferCounts.data).map((r) => ({ label: r.label, value: r.value }))} />
        )}
      </ScrollView>
    </WalletScreen>
  );
}
