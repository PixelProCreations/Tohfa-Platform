import React from 'react';
import type { Can } from '../../permissions/can';
import { WarehouseOverviewScreen } from '../operations/WarehouseOverviewScreen';

export interface AdminOperationsOverviewScreenProps {
  initialViewMode?: 'overview' | 'warehouses';
  onBack?: () => void;
  onExportReports?: () => void;
  onNavigateToFarmers?: () => void;
  onNavigateToApplications?: () => void;
  onNavigateToProduce?: () => void;
  onNavigateToStockLedger?: (warehouseId?: string) => void;
  onNavigateToStockVerification?: (warehouseId?: string) => void;
  onNavigateToTransfers?: () => void;
  onNotifications?: () => void;
  onPlusAction?: () => void;
  onSelectWarehouse?: (warehouseId: string) => void;
  can?: Can;
}

export function AdminOperationsOverviewScreen({
  onBack,
  onExportReports: _onExportReports,
  onNavigateToFarmers: _onNavigateToFarmers,
  onNavigateToApplications: _onNavigateToApplications,
  onNavigateToProduce: _onNavigateToProduce,
  onNavigateToStockLedger,
  onNavigateToStockVerification,
  onNavigateToTransfers,
  onNotifications,
  onPlusAction,
  onSelectWarehouse,
  can,
}: AdminOperationsOverviewScreenProps): React.JSX.Element {
  // Pass-through to the modern, tokenized, real-data wired WarehouseOverviewScreen
  const defaultCan = can ?? (() => true);

  return (
    <WarehouseOverviewScreen
      can={defaultCan}
      onBack={onBack}
      onOpenStockLedger={onNavigateToStockLedger}
      onOpenStockVerification={onNavigateToStockVerification}
      onOpenTransfers={onNavigateToTransfers}
      onOpenWarehouse={onSelectWarehouse}
      onOpenNotifications={onNotifications}
      onPlusAction={onPlusAction}
    />
  );
}
