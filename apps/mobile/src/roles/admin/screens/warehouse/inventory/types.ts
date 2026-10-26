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
import type { Grade } from '../../../api/inventory';
import type { WarehouseScope, WarehouseScreenBaseProps } from '../finance-expenses/types';

export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

/**
 * Route params passed between inventory screens. Loose on purpose: they come
 * from deep links. The live screens read only these, through InventoryFlow:
 * `cropId` + `grade` (a product), `batchId` (a batch uuid), `initialTab`.
 */
export type InventoryRouteParams = Record<string, any> | null;

/** One product (crop + grade) as a route param. */
export interface InventoryProductRef {
  cropId: string;
  grade: Grade;
}

/** Props every inventory screen takes: the warehouse base props plus optional route params. */
export interface InventoryScreenBaseProps extends WarehouseScreenBaseProps {
  routeParams?: InventoryRouteParams | undefined;
  /**
   * Warehouses the Main admin can pick from in the all-warehouses selector.
   * Ignored when `scope.warehouseId` is set (the Sub admin is locked to one).
   * Supplied by the host; the screens never hard-code warehouse names.
   */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** The Main selector's warehouse (undefined = all). Owned by InventoryFlow; ignored for a Sub scope. */
  selectedWarehouseId?: string | undefined;
  onSelectWarehouse?: ((warehouseId: string | undefined) => void) | undefined;
}

/** The request state a live inventory screen draws (pick it with queryViewState). */
export interface InventoryLiveStateProps {
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
}

// ─── Live inventory (./mappers.ts) ───────────────────────────────────────────
// Quantities are integer grams (roles/admin/money/quantity.ts), never floats;
// null means the server sent no figure (or one that is not a Quantity), which
// the screens show as "no value", never as zero.

/** A batch status as the screens group it; 'unknown' for a value the app does not know yet. */
export type BatchUiStatus = 'active' | 'depleted' | 'expired' | 'writtenOff' | 'unknown';

/** One batch (GET /admin/batches, /admin/batches/{id}). `id` is the uuid, `batchCode` the human code. */
export interface BatchRow {
  id: string;
  batchCode: string;
  warehouseId: string;
  cropId: string;
  /** The API grade value (GRADE_1...), for filters and keys. */
  grade: string;
  /** The crop name, or a neutral label when the server sent none. */
  productName: string;
  gradeLabel: string;
  status: BatchUiStatus;
  statusLabel: string;
  /** The server's qtyAvailableKg, exactly (BR-100). */
  availableGrams: number | null;
  receivedGrams: number | null;
  reservedGrams: number | null;
  storageLocation: string | null;
  /** IST day, '' when unknown. */
  receivedOn: string;
  expiryOn: string;
}

/** 'low' only when the server raised a LOW_STOCK alert for the product (the threshold is server config). */
export type StockLevel = 'inStock' | 'low' | 'out';

/** One crop + grade, summed over its ACTIVE batches. */
export interface ProductStock {
  /** productKey(cropId, grade). */
  key: string;
  cropId: string;
  grade: string;
  productName: string;
  gradeLabel: string;
  availableGrams: number;
  reservedGrams: number;
  /** Sum of the allocation rows for this product, or null when allocations were not given. */
  allocatedGrams: number | null;
  activeBatchCount: number;
  storageLocations: string[];
  /** The location holding the most available stock. */
  primaryStorage: string | null;
  level: StockLevel;
  /** False when a batch quantity could not be read, so the sums leave it out. */
  complete: boolean;
}

export interface StockSummary {
  /** Most available first. */
  products: ProductStock[];
  totalAvailableGrams: number;
  totalReservedGrams: number;
}

export type StockMovementKind =
  | 'receipt'
  | 'sale'
  | 'transferOut'
  | 'transferIn'
  | 'adjustment'
  | 'wastage'
  | 'returnIn'
  | 'reservation'
  | 'release'
  | 'unknown';

/** From the sign of the ledger delta itself (BR-37). */
export type MovementDirection = 'in' | 'out' | 'none';

/** One stock ledger row. Also the Movement Detail's route param (there is no per-id ledger read). */
export interface StockMovementRow {
  id: string;
  batchId: string;
  warehouseId: string;
  kind: StockMovementKind;
  typeLabel: string;
  direction: MovementDirection;
  /** Signed grams; null when the delta is not a Quantity. */
  deltaGrams: number | null;
  /** "+100 kg" / "-20 kg"; '' when unreadable. */
  deltaText: string;
  balanceAfterGrams: number | null;
  balanceText: string;
  /** IST date and time. */
  performedAt: string;
  /** Only when the batch is among the loaded batches. */
  batchCode?: string | undefined;
  productLabel?: string | undefined;
  remarks?: string | undefined;
  /** What the movement belongs to, as the server recorded it (GOODS_RECEIPT, ORDER, stock_adjustment...). */
  refType?: string | undefined;
  /** The uuid of that record; the API carries no human code for it. */
  refId?: string | undefined;
}

export type AllocationChannelKey = 'online' | 'liveMarket' | 'reserve' | 'buffer' | 'unknown';

/** One channel of the allocation dashboard, summed over its rows. */
export interface AllocationChannelSummary {
  channel: AllocationChannelKey;
  label: string;
  allocatedGrams: number;
  consumedGrams: number;
  reservedGrams: number;
  /** Sum of the server's effective availableQtyKg (BR-100); null when a row carried none. */
  availableGrams: number | null;
  /** Share of all allocated grams, in basis points (the channels sum to 10000 when anything is allocated). */
  shareBasisPoints: number;
}

export interface AllocationDashboard {
  /** online, liveMarket, reserve, buffer always; 'unknown' appended only when present. */
  channels: AllocationChannelSummary[];
  totalAllocatedGrams: number;
}

/** One LOW_STOCK alert as a low-stock row. */
export interface LowStockRow {
  /** The alert itemKey. */
  id: string;
  cropId: string;
  grade: string;
  name: string;
  available: string;
  threshold: string;
  warehouseId: string;
}
