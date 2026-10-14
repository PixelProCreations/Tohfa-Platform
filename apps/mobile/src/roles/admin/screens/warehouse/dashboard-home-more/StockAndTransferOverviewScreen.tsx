/**
 * Stock & Transfer Overview (Main only): consolidated stock of the four
 * warehouses, the low-stock / surplus summary and the inter-warehouse
 * transfer counts.
 *
 * Gate (FINAL_LIST 22): route-guarded on `warehouse.all.view` (MAIN all, SUB
 * none); without it a not-available note renders and HomeFlow refuses the
 * route. Initiate Stock Transfer shows only with
 * `transfer.inter_warehouse.initiate` (MAIN all, SUB none). Stock comes from
 * the seeded warehouse rows (warehouse-admin/fixtures) and the transfer counts
 * from the shared transfer list (transfers/fixtures), so no warehouse name or
 * figure is written here; the server owns the real numbers.
 */
import React from 'react';
import { ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors } from '../../../theme';
import { EmptyState, WalletButton, WalletFooter, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { TRANSFERS, type TransferItem, type TransferStatus } from '../transfers';
import { WAREHOUSE_ADMIN_ROWS, type WarehouseAdminRow } from '../warehouse-admin';
import { adminWarehouseLabel } from '../warehouse-admin/fixtures';
import { formatAdminKg } from '../warehouse-admin/WarehouseAdminParts';
import type { WarehouseScreenBaseProps } from '../finance-expenses/types';
import { DataRowCard, HOME_CODES, SectionLink, SummaryCard, type DataRow } from './HomeParts';

function TransferArrowsIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Transfer statuses in display order, with the label the overview shows. */
const TRANSFER_STATUS_ROWS: readonly { status: TransferStatus; label: string }[] = [
  { status: 'Pending SA Approval', label: 'Pending' },
  { status: 'In Transit', label: 'In Transit' },
  { status: 'Arrived', label: 'Arrived' },
  { status: 'Completed', label: 'Received' },
];

export interface StockAndTransferOverviewScreenProps extends WarehouseScreenBaseProps {
  warehouses?: readonly WarehouseAdminRow[] | undefined;
  transfers?: readonly TransferItem[] | undefined;
  /** Low-stock / surplus summary line (mock until a low-stock summary endpoint exists). */
  lowStockSummary?: string | undefined;
  onInitiateTransfer?: (() => void) | undefined;
  onViewConsolidatedStock?: (() => void) | undefined;
  onViewLowStock?: (() => void) | undefined;
  onViewTransfers?: (() => void) | undefined;
}

export function StockAndTransferOverviewScreen({
  can,
  onBack,
  warehouses = WAREHOUSE_ADMIN_ROWS,
  transfers = TRANSFERS,
  lowStockSummary = '3 products below target · 2 warehouses with surplus available',
  onInitiateTransfer,
  onViewConsolidatedStock,
  onViewLowStock,
  onViewTransfers,
}: StockAndTransferOverviewScreenProps) {
  if (!can(HOME_CODES.allView)) {
    return (
      <WalletScreen title="Stock & Transfer Overview" onBack={onBack}>
        <EmptyState title="Not available" subtitle="The consolidated view needs warehouse.all.view." />
      </WalletScreen>
    );
  }

  const stockRows: DataRow[] = warehouses.map((w) => ({ label: adminWarehouseLabel(w.warehouseId), value: formatAdminKg(w.stockKg) }));
  const totalKg = warehouses.reduce((sum, w) => sum + w.stockKg, 0);
  const transferRows: DataRow[] = TRANSFER_STATUS_ROWS.map(({ status, label }) => ({
    label,
    value: String(transfers.filter((t) => t.status === status).length),
  }));
  return (
    <WalletScreen
      title="Stock & Transfer Overview"
      subtitle="Consolidated inventory + inter-warehouse transfers"
      onBack={onBack}
      footer={
        onInitiateTransfer !== undefined && can(HOME_CODES.transferInitiate) ? (
          <WalletFooter>
            <WalletButton label="Initiate Stock Transfer" icon={<TransferArrowsIcon />} onPress={onInitiateTransfer} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionLink title="Consolidated Stock" onPress={onViewConsolidatedStock} />
        <DataRowCard rows={stockRows} total={{ label: 'Total', value: formatAdminKg(totalKg) }} />

        <SectionLink title="Low Stock & Surplus" onPress={onViewLowStock} />
        <SummaryCard text={lowStockSummary} onPress={onViewLowStock} />

        <SectionLink title="Transfers" onPress={onViewTransfers} />
        <DataRowCard rows={transferRows} />
      </ScrollView>
    </WalletScreen>
  );
}
