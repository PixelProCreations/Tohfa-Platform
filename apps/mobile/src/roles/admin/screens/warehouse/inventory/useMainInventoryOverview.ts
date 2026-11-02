/**
 * Live data for the Inventory tab overview (the 8 stat cards and their
 * sections, ./MainInventoryDashboard.tsx). One hook for both warehouse
 * shells: the caller passes the warehouse every request sends (computed with
 * inventoryWarehouseFilter, so a Sub scope always sends its own, BR-30) and
 * its permission check. Every decision is in ./mainInventoryMappers.ts.
 *
 * Each source is fetched only with the docs/rbac.json code its endpoint
 * checks (mainInventoryAccess), so a role without it gets no card rather than
 * a card that answers 403. Each query's status travels with its figure: a
 * figure is drawn only once every source it reads has answered (the same
 * SectionSource gate the Main dashboard uses), never as a fake 0.
 *
 * Query keys follow the modules whose writes should refresh these figures:
 * the stock-count and adjustment screens invalidate 'stock-verifications' /
 * 'stock-adjustments' / 'inventory', and the transfer screens 'transfers', so
 * approving an adjustment in InventoryFlow updates Pending Adjustments here.
 * The batch and allocation keys are the ones the Main shell's Home tab uses,
 * so both tabs share one cached read.
 */
import { useMemo } from 'react';
import { listAlerts } from '../../../api/alerts';
import { useAdminQuery } from '../../../api/hooks';
import { listAllocations, listBatches, listStockLedger } from '../../../api/inventory';
import { adminKeys } from '../../../api/queryKeys';
import { listStockAdjustments } from '../../../api/stockAdjustments';
import { listStockVerifications } from '../../../api/stockVerifications';
import { listWarehouseTransfers } from '../../../api/warehouseTransfers';
import { DASHBOARD_MAX_PAGES, DASHBOARD_PAGE_LIMIT, collectPages, figureOrPlaceholder } from '../../dashboard/mappers_mainDashboard';
import { derivedSource, mergeSources, retryFailed, sourceOf, type SectionSource } from '../../dashboard/MainDashboardParts';
import { transferListScopeParams } from '../transfers/mappers';
import { TRANSFERS_MODULE } from '../transfers/useTransfersData';
import {
  EMPTY_MAIN_INVENTORY_FIGURES,
  buildInventoryHealth,
  buildMainInventoryCards,
  buildPendingActions,
  buildQuickActions,
  buildWarehouseOverview,
  collectOffsetPages,
  countLowStockItems,
  countLabelOf,
  deriveAllocatedStockGrams,
  deriveAvailableStockGrams,
  deriveReservedStockGrams,
  deriveServerTotal,
  deriveTotalStockGrams,
  deriveVerificationCounts,
  mainInventoryAccess,
  toRecentMovements,
  type InventoryHealth,
  type MainInventoryAccess,
  type MainInventoryCard,
  type MainInventoryCardKey,
  type MainInventoryFigures,
  type MainInventoryWarehouse,
  type PendingActionRow,
  type QuickAction,
  type RecentMovementRow,
  type WarehouseOverviewRow,
} from './mainInventoryMappers';
import type { PermissionCheck } from './types';
import { ADJUSTMENTS_MODULE, VERIFICATIONS_MODULE } from './useStockAdjustmentData';

const INVENTORY_MODULE = 'inventory';
const ALERTS_MODULE = 'alerts';
/** How many ledger rows Recent Stock Movements shows (a layout choice, not a business rule). */
export const RECENT_MOVEMENT_ROWS = 3;

const NO_BATCHES: never[] = [];
const NO_ROWS: never[] = [];
const NO_HEALTH: InventoryHealth = { normal: 0, low: 0 };

export interface MainInventoryOverviewOptions {
  can: PermissionCheck;
  /** The warehouse uuid every request sends; undefined = every warehouse the caller can see. */
  warehouseId: string | undefined;
  /** The warehouses Warehouse Overview lists (names and uuids from the live list). */
  warehouses: readonly MainInventoryWarehouse[];
  /** The source of `warehouses`, so the overview waits for it; omit when the list is fixed (Sub). */
  warehousesSource?: SectionSource | undefined;
  /** False while the tab is not shown or the shell's own gate is closed: nothing is fetched. */
  enabled: boolean;
}

export interface MainInventoryOverview {
  access: MainInventoryAccess;
  /** The visible cards, in order. */
  cards: MainInventoryCard[];
  /** The sources behind the visible cards: the error banner and its Retry read these. */
  cardSources: SectionSource[];
  figures: MainInventoryFigures;
  overview: { source: SectionSource; rows: WarehouseOverviewRow[] };
  health: { source: SectionSource; value: InventoryHealth; verificationPending: string | null };
  movements: { source: SectionSource; rows: RecentMovementRow[] };
  pendingActions: PendingActionRow[];
  quickActions: QuickAction[];
  /** A list the page cap cut short: its totals say so instead of looking whole. */
  partial: boolean;
  /** Runs Retry on the failed sources only. */
  retry: () => void;
  /** Pull-to-refresh: refetches every source this caller reads. */
  refresh: () => void;
  isRefreshing: boolean;
}

interface Refetchable {
  refetch: () => unknown;
  isRefetching: boolean;
}

export function useMainInventoryOverview({
  can,
  warehouseId,
  warehouses,
  warehousesSource,
  enabled,
}: MainInventoryOverviewOptions): MainInventoryOverview {
  const access = mainInventoryAccess(can);
  const on = {
    stock: enabled && access.stock,
    allocations: enabled && access.allocations,
    lowStock: enabled && access.lowStock,
    verifications: enabled && access.verifications,
    adjustments: enabled && access.adjustments,
    transfers: enabled && access.transfers,
    ledger: enabled && access.ledger,
  };

  // ACTIVE batches, every page up to the cap (GET /admin/batches, BR-24, BR-30).
  const batchesQuery = useAdminQuery(
    adminKeys.scoped(INVENTORY_MODULE, warehouseId, { resource: 'batches', status: 'ACTIVE', limit: DASHBOARD_PAGE_LIMIT }),
    (signal) =>
      collectPages((cursor) => listBatches({ warehouseId, status: 'ACTIVE', limit: DASHBOARD_PAGE_LIMIT, cursor }, signal)),
    { enabled: on.stock },
  );
  // Channel allocations (GET /admin/allocations, BR-12, BR-100).
  const allocationsQuery = useAdminQuery(
    adminKeys.scoped(INVENTORY_MODULE, warehouseId, { resource: 'allocations', limit: DASHBOARD_PAGE_LIMIT }),
    (signal) => collectPages((cursor) => listAllocations({ warehouseId, limit: DASHBOARD_PAGE_LIMIT, cursor }, signal)),
    { enabled: on.allocations },
  );
  // The server's active LOW_STOCK alerts (GET /admin/alerts, BR-77).
  const lowStockQuery = useAdminQuery(
    adminKeys.scoped(ALERTS_MODULE, warehouseId, { resource: 'list', state: 'active', type: 'LOW_STOCK', limit: DASHBOARD_PAGE_LIMIT }),
    (signal) =>
      collectPages((cursor) =>
        listAlerts({ type: 'LOW_STOCK', state: 'active', warehouseId, limit: DASHBOARD_PAGE_LIMIT, cursor }, signal),
      ),
    { enabled: on.lowStock },
  );
  // Counts recorded but not reconciled (GET /admin/stock-verifications?status=RECORDED, BR-107).
  // Both Verification Pending and Variance Detected are read from these rows.
  const verificationsQuery = useAdminQuery(
    adminKeys.scoped(VERIFICATIONS_MODULE, warehouseId, { resource: 'overview', status: 'RECORDED' }),
    (signal) =>
      collectOffsetPages(
        (page) => listStockVerifications({ status: 'RECORDED', warehouseId, page, pageSize: DASHBOARD_PAGE_LIMIT }, signal),
        DASHBOARD_MAX_PAGES,
      ),
    { enabled: on.verifications },
  );
  // The server's total of PENDING adjustments (GET /admin/stock-adjustments, BR-37): one row read.
  const adjustmentsQuery = useAdminQuery(
    adminKeys.scoped(ADJUSTMENTS_MODULE, warehouseId, { resource: 'pending-count' }),
    (signal) =>
      listStockAdjustments({ status: 'PENDING', warehouseId, page: 1, pageSize: 1 }, signal).then((page) => page.total),
    { enabled: on.adjustments },
  );
  // Transfers on the road into the covered warehouses (GET /warehouse-transfers, BR-102). The
  // key and the read match the transfers area's own count, so both share one cached answer.
  const transferParams = transferListScopeParams({ warehouseId });
  const transfersQuery = useAdminQuery(
    adminKeys.scoped(TRANSFERS_MODULE, warehouseId, { resource: 'count', status: 'IN_TRANSIT', ...transferParams }),
    (signal) => listWarehouseTransfers({ ...transferParams, status: 'IN_TRANSIT', page: 1, pageSize: 1 }, signal),
    { enabled: on.transfers },
  );
  // The newest ledger rows (GET /admin/stock-ledger, newest first, BR-37).
  const ledgerQuery = useAdminQuery(
    adminKeys.scoped(INVENTORY_MODULE, warehouseId, { resource: 'stock-ledger-recent', limit: RECENT_MOVEMENT_ROWS }),
    (signal) => listStockLedger({ warehouseId, limit: RECENT_MOVEMENT_ROWS }, signal),
    { enabled: on.ledger },
  );

  const batches = batchesQuery.data?.items ?? NO_BATCHES;
  const allocations = allocationsQuery.data?.items ?? NO_ROWS;
  const lowStockAlerts = lowStockQuery.data?.items ?? NO_ROWS;
  const verifications = verificationsQuery.data?.items ?? NO_ROWS;

  // Derivations: a malformed server value fails its figure (error + Retry), never a smaller total.
  const totalD = useMemo(() => (batchesQuery.data === undefined ? null : deriveTotalStockGrams(batches)), [batchesQuery.data, batches]);
  const availableD = useMemo(
    () =>
      batchesQuery.data === undefined || allocationsQuery.data === undefined
        ? null
        : deriveAvailableStockGrams(batches, allocations),
    [batchesQuery.data, allocationsQuery.data, batches, allocations],
  );
  const allocatedD = useMemo(
    () => (allocationsQuery.data === undefined ? null : deriveAllocatedStockGrams(allocations)),
    [allocationsQuery.data, allocations],
  );
  const reservedD = useMemo(
    () => (allocationsQuery.data === undefined ? null : deriveReservedStockGrams(allocations)),
    [allocationsQuery.data, allocations],
  );
  const verificationsD = useMemo(
    () => (verificationsQuery.data === undefined ? null : deriveVerificationCounts(verifications)),
    [verificationsQuery.data, verifications],
  );
  const adjustmentsD = useMemo(
    () => (adjustmentsQuery.data === undefined ? null : deriveServerTotal(adjustmentsQuery.data)),
    [adjustmentsQuery.data],
  );
  const transfersD = useMemo(
    () => (transfersQuery.data === undefined ? null : deriveServerTotal(transfersQuery.data.total)),
    [transfersQuery.data],
  );
  const overviewD = useMemo(
    () => (batchesQuery.data === undefined ? null : buildWarehouseOverview(batches, warehouses, warehouseId)),
    [batchesQuery.data, batches, warehouses, warehouseId],
  );
  const healthD = useMemo(
    () =>
      batchesQuery.data === undefined || lowStockQuery.data === undefined ? null : buildInventoryHealth(batches, lowStockAlerts),
    [batchesQuery.data, lowStockQuery.data, batches, lowStockAlerts],
  );
  const movements = useMemo(
    // The clock is read when the rows are built, so times are as of the last data change.
    () => toRecentMovements(ledgerQuery.data?.items ?? NO_ROWS, batches, warehouses, new Date(), RECENT_MOVEMENT_ROWS),
    [ledgerQuery.data, batches, warehouses],
  );

  const lowStockComplete = lowStockQuery.data?.complete ?? true;
  const verificationsComplete = verificationsQuery.data?.complete ?? true;
  const figures: MainInventoryFigures = {
    totalStockGrams: valueOr(totalD, EMPTY_MAIN_INVENTORY_FIGURES.totalStockGrams),
    availableStockGrams: valueOr(availableD, EMPTY_MAIN_INVENTORY_FIGURES.availableStockGrams),
    allocatedStockGrams: valueOr(allocatedD, EMPTY_MAIN_INVENTORY_FIGURES.allocatedStockGrams),
    reservedStockGrams: valueOr(reservedD, EMPTY_MAIN_INVENTORY_FIGURES.reservedStockGrams),
    lowStockItems: { count: countLowStockItems(lowStockAlerts), exact: lowStockComplete },
    verificationPending: { count: valueOr(verificationsD, { pending: 0, variance: 0 }).pending, exact: verificationsComplete },
    varianceDetected: { count: valueOr(verificationsD, { pending: 0, variance: 0 }).variance, exact: verificationsComplete },
    pendingAdjustments: valueOr(adjustmentsD, EMPTY_MAIN_INVENTORY_FIGURES.pendingAdjustments),
    transfersAwaitingReceipt: valueOr(transfersD, EMPTY_MAIN_INVENTORY_FIGURES.transfersAwaitingReceipt),
  };

  // Every query's state, so no card draws a figure the server has not sent.
  const batchesSrc = sourceOf(batchesQuery);
  const allocationsSrc = sourceOf(allocationsQuery);
  const lowStockSrc = sourceOf(lowStockQuery);
  const verificationsSrc = mergeSources(sourceOf(verificationsQuery), derivedSource(verificationsD, () => void verificationsQuery.refetch()));
  const adjustmentsSrc = mergeSources(sourceOf(adjustmentsQuery), derivedSource(adjustmentsD, () => void adjustmentsQuery.refetch()));
  const transfersSrc = mergeSources(sourceOf(transfersQuery), derivedSource(transfersD, () => void transfersQuery.refetch()));
  const cardSource: Record<MainInventoryCardKey, SectionSource> = {
    totalStock: mergeSources(batchesSrc, derivedSource(totalD, () => void batchesQuery.refetch())),
    availableStock: mergeSources(
      batchesSrc,
      allocationsSrc,
      derivedSource(availableD, () => {
        void batchesQuery.refetch();
        void allocationsQuery.refetch();
      }),
    ),
    allocatedStock: mergeSources(allocationsSrc, derivedSource(allocatedD, () => void allocationsQuery.refetch())),
    reservedStock: mergeSources(allocationsSrc, derivedSource(reservedD, () => void allocationsQuery.refetch())),
    lowStockItems: lowStockSrc,
    verificationPending: verificationsSrc,
    varianceDetected: verificationsSrc,
    pendingAdjustments: adjustmentsSrc,
  };
  const statuses = {
    totalStock: cardSource.totalStock.status,
    availableStock: cardSource.availableStock.status,
    allocatedStock: cardSource.allocatedStock.status,
    reservedStock: cardSource.reservedStock.status,
    lowStockItems: cardSource.lowStockItems.status,
    verificationPending: cardSource.verificationPending.status,
    varianceDetected: cardSource.varianceDetected.status,
    pendingAdjustments: cardSource.pendingAdjustments.status,
  };
  const cards = buildMainInventoryCards(access, statuses, figures);
  const cardSources = cards.map((card) => cardSource[card.key]);

  const overviewSrc = mergeSources(
    ...(warehousesSource === undefined ? [] : [warehousesSource]),
    batchesSrc,
    derivedSource(overviewD, () => void batchesQuery.refetch()),
  );
  const healthSrc = mergeSources(batchesSrc, lowStockSrc, derivedSource(healthD, () => void batchesQuery.refetch()));
  const movementsSrc = mergeSources(sourceOf(ledgerQuery), ...(access.stock ? [batchesSrc] : []));

  const pendingActions = buildPendingActions(
    access,
    { verifications: verificationsSrc.status, adjustments: adjustmentsSrc.status, transfers: transfersSrc.status },
    figures,
  );

  const partial = [batchesQuery.data, allocationsQuery.data, lowStockQuery.data, verificationsQuery.data].some(
    (collected) => collected !== undefined && !collected.complete,
  );

  // Only the queries this caller reads: TanStack's refetch() ignores `enabled`.
  const live: Refetchable[] = [
    ...(on.stock ? [batchesQuery] : []),
    ...(on.allocations ? [allocationsQuery] : []),
    ...(on.lowStock ? [lowStockQuery] : []),
    ...(on.verifications ? [verificationsQuery] : []),
    ...(on.adjustments ? [adjustmentsQuery] : []),
    ...(on.transfers ? [transfersQuery] : []),
    ...(on.ledger ? [ledgerQuery] : []),
  ];
  const allSources = [...cardSources, overviewSrc, healthSrc, movementsSrc, verificationsSrc, adjustmentsSrc, transfersSrc];

  return {
    access,
    cards,
    cardSources,
    figures,
    overview: { source: overviewSrc, rows: overviewD !== null && overviewD.ok ? overviewD.value : NO_ROWS },
    health: {
      source: healthSrc,
      value: healthD !== null && healthD.ok ? healthD.value : NO_HEALTH,
      verificationPending: access.verifications
        ? figureOrPlaceholder(verificationsSrc.status, () => countLabelOf(figures.verificationPending))
        : null,
    },
    movements: { source: movementsSrc, rows: movements },
    pendingActions,
    quickActions: buildQuickActions(access),
    partial,
    retry: () => retryFailed(allSources),
    refresh: () => {
      for (const query of live) void query.refetch();
    },
    isRefreshing: live.some((query) => query.isRefetching),
  };
}

/** The derived value, or `fallback` while it is not there (a status gate keeps the fallback off screen). */
function valueOr<T>(derived: { ok: true; value: T } | { ok: false } | null, fallback: T): T {
  return derived !== null && derived.ok ? derived.value : fallback;
}
