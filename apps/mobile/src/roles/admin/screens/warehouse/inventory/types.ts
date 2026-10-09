/**
 * Shared types for the warehouse inventory screens (design module M3).
 *
 * One set of screens serves both warehouse roles. As in orders and
 * finance-expenses, the role difference is carried by `scope` (warehouseId
 * undefined = all warehouses, the Main Warehouse view) and `can` (a
 * docs/rbac.json code check that only decides what to render; the server
 * enforces every action again, CLAUDE.md 2.1).
 *
 * Four Main-only screens were folded into the shared ones (W4):
 *   warehouse/StockLedgerScreen            -> StockLedgerScreen (M3S06)
 *   warehouse/LowStockAlertsScreen         -> LowStockScreen (M3S09)
 *   warehouse/VerifyStockScreen            -> PhysicalCountScreen (M3S11)
 *   warehouse/StockAdjustmentApprovalScreen -> AdjustmentDetailScreen (M3S17)
 * Their Main-only content now renders when `scope.warehouseId` is undefined.
 */
import type { WarehouseScope, WarehouseScreenBaseProps } from '../finance-expenses/types';

export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

/** Route params passed between inventory screens. Loose on purpose: they come from deep links. */
export type InventoryRouteParams = Record<string, any> | null;

/** Props every inventory screen takes: the warehouse base props plus optional route params. */
export interface InventoryScreenBaseProps extends WarehouseScreenBaseProps {
  routeParams?: InventoryRouteParams | undefined;
  /**
   * Warehouses the Main admin can pick from in the all-warehouses selector.
   * Ignored when `scope.warehouseId` is set (the Sub admin is locked to one).
   * Supplied by the host; the screens never hard-code warehouse names.
   */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

/** A physical-count result carried from PhysicalCountScreen to the adjustment screens. */
export interface PhysicalCountResult {
  produceName: string;
  batchId: string;
  zone: string;
  systemCount: number;
  physicalCount: number;
  varianceKg: number;
  variancePct: number;
  reason: string;
}
