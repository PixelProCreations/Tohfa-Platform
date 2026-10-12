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

// ─── Design-sample shapes (./fixtures.ts) ────────────────────────────────────
// Display strings exactly as the design samples show them ('95 KG', 'Grade 1').

/** One product row of the stock list sample (M3S02). */
export interface SampleStockItem {
  name: string;
  grade: string;
  status: 'Healthy Stock' | 'Low Stock' | 'Out of Stock';
  available: string;
  reserved: string;
  allocated: string;
}

/** The inventory dashboard sample totals (M3S01). */
export interface SampleInventoryTotals {
  totalAvailable: string;
  available: string;
  reserved: string;
  allocated: string;
  lowStockCount: string;
  verificationPending: string;
}

/** One "Top Stock Products" card of the inventory dashboard sample (M3S01). */
export interface SampleTopStockProduct {
  name: string;
  grade: string;
  lowStock: boolean;
  available: string;
  reserved: string;
  allocated: string;
}

/** The product stock detail sample (M3S03). */
export interface SampleProductStockDetail {
  name: string;
  grade: string;
  available: string;
  reserved: string;
  allocated: string;
  online: string;
  liveMarket: string;
  reserve: string;
  buffer: string;
  activeBatches: string;
  storageLocations: string;
  primaryStorage: string;
}

/** One batch card of the batch list sample (M3S04). */
export interface SampleBatchListItem {
  id: string;
  product: string;
  grade: string;
  status: string;
  available: string;
  storage: string;
  dateText: string;
}

/** The batch detail sample (M3S05). */
export interface SampleBatchDetail {
  batchCode: string;
  product: string;
  grade: string;
  status: string;
  storageLocation: string;
  receivedQty: string;
  availableQty: string;
  receivedDate: string;
  goodsReceipt: string;
  sourceFarmer: string;
  movementReceived: string;
  movementDispatched: string;
  movementReserved: string;
}

/** One batch row of the cross-warehouse batch list (absorbed Main StockLedgerScreen). */
export interface StockBatchItem {
  id: string;
  name: string;
  quantityKg: number;
  batchId: string;
  zone: string;
  receivedDate: string;
  warehouseName?: string | undefined;
}

/** One ledger card of the stock ledger sample (M3S06). Optional fields are drawn only when set. */
export interface SampleLedgerMovement {
  type: string;
  quantity: string;
  product: string;
  time: string;
  batch?: string | undefined;
  order?: string | undefined;
  ref?: string | undefined;
  balance?: string | undefined;
}

/** One channel card of the stock allocation sample (M3S07). */
export interface SampleAllocation {
  channel: string;
  allocated: string;
  consumed: string;
  reserved: string;
  available: string;
}

/** One low-stock row. `warehouseName` is shown in the Main (all-warehouses) view. */
export interface LowStockItem {
  name: string;
  available: string;
  threshold: string;
  warehouseName?: string | undefined;
}

/** One adjustment row. `warehouseId` is the warehouse the adjustment was created in. */
export interface AdjustmentHistoryItem {
  id: string;
  status: string;
  statusKey: 'Pending' | 'Approved' | 'Rejected';
  product: string;
  warehouseId?: string | undefined;
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
