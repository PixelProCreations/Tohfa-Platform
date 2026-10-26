/**
 * Live data for the goods receiving area (design M2). Thin wrappers over the
 * admin hooks (../../../api/hooks.ts); every decision lives in ./mappers.ts,
 * ./receivingViews.ts, ./submission.ts or the API module, which are tested
 * (hooks cannot run in this app's plain-Node vitest).
 *
 * Every hook takes the warehouseId to send, which a screen computes with
 * receivingWarehouseFilter (a Sub scope is always its own warehouse, BR-30).
 * It is part of every query key, so one warehouse's rows never answer
 * another's. `naming` names each row's warehouse (useReceivingNaming); keep it
 * memoised, it is a memo dependency.
 *
 * The dashboard needs every order and receipt of the warehouse to derive each
 * order's receiving progress (the server never advances an order's status on
 * its own), so those reads walk the cursor to the end (collectPages). The page
 * cap is a guard against a looping cursor, not a business limit; when it
 * trips the result says `complete: false`.
 */
import { useCallback, useMemo } from 'react';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import {
  createCounterOffer,
  createGoodsReceipt,
  createGoodsReceiptDiscrepancy,
  getGoodsReceipt,
  getGoodsReceiptDocument,
  getPurchaseOrder,
  listGoodsReceiptDiscrepancies,
  listGoodsReceipts,
  listPurchaseOrders,
  recordQualityCheck,
  type CounterOfferCreate,
  type CounterOfferDto,
  type GoodsReceiptCreate,
  type GoodsReceiptDiscrepancyCreate,
  type GoodsReceiptDiscrepancyDto,
  type GoodsReceiptDocumentDto,
  type GoodsReceiptDto,
  type GoodsReceiptStatus,
  type PurchaseOrderDetailDto,
  type PurchaseOrderDto,
  type QualityCheckCreate,
  type QualityCheckResultDto,
} from '../../../api/receiving';
import { listStorageLocations, listWarehouses } from '../../../api/warehouses';
import { listWarehouseTransfers } from '../../../api/warehouseTransfers';
import { collectPages } from '../../../../../shell/api/pagination';
import { NETWORK_WAREHOUSES_KEY } from '../warehouse-admin/useWarehouseNetwork';
import {
  grams,
  isMainScope,
  pendingReceiptOf,
  qcPendingIssues,
  toDiscrepancy,
  toLiveReceipt,
  toPurchaseOrderShipment,
  toReceiptDetail,
  toStorageOption,
  toTransferShipment,
  type IntakeFilterParams,
  type WarehouseNaming,
} from './mappers';
import type {
  LiveDiscrepancy,
  LiveQualityIssue,
  LiveReceipt,
  LiveReceiptDetail,
  LiveShipment,
  LiveStorageOption,
} from './liveTypes';
import type { PermissionCheck, WarehouseScope } from './types';

const RECEIVING = 'receiving';
const INVENTORY = 'inventory';
/** The largest page the spec allows (LimitParam / pageSize), so a walk needs the fewest calls. */
const WALK_PAGE_LIMIT = 100;
/** Guard against a server cursor that never ends; not a business limit. */
const WALK_MAX_PAGES = 50;
/** Guard against a page total that never comes in; not a business limit. */
const OFFSET_MAX_PAGES = 20;
/** docs/rbac.json: GET /warehouses needs warehouse.all.view (MAIN all, SUB none). */
const WAREHOUSE_LIST_CODE = 'warehouse.all.view';
/** docs/rbac.json: GET /warehouse-transfers. */
const TRANSFER_VIEW_CODE = 'transfer.inter_warehouse.view';

/** What a data screen needs to pick an async state and to refresh. */
export interface LiveQueryState {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

function queryState(query: { isPending: boolean; error: unknown; refetch: () => unknown; isRefetching: boolean }, enabled = true): LiveQueryState {
  return {
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching,
  };
}

function receiptsByOrder(receipts: readonly GoodsReceiptDto[]): Map<string, GoodsReceiptDto[]> {
  const byOrder = new Map<string, GoodsReceiptDto[]>();
  for (const receipt of receipts) {
    const list = byOrder.get(receipt.purchaseOrderId);
    if (list === undefined) byOrder.set(receipt.purchaseOrderId, [receipt]);
    else list.push(receipt);
  }
  return byOrder;
}

// ─── Warehouse names ─────────────────────────────────────────────────────────

export interface ReceivingNaming {
  naming: WarehouseNaming;
  /** The Main warehouse selector's options (live), [] for a Sub scope. */
  options: readonly WarehouseScope[];
  isLoading: boolean;
}

/**
 * A Sub scope names its own warehouse; the Main view names rows from GET
 * /warehouses (the same key the dashboards use, so it is read once).
 */
export function useReceivingNaming(scope: WarehouseScope, can: PermissionCheck): ReceivingNaming {
  const main = isMainScope(scope);
  const enabled = main && can(WAREHOUSE_LIST_CODE);
  const query = useAdminQuery(NETWORK_WAREHOUSES_KEY, (signal) => listWarehouses({ isActive: true, pageSize: 100 }, signal), { enabled });
  const items = query.data?.items;
  const ownName = scope.warehouseName;
  return useMemo(() => {
    if (!main) return { naming: { warehouseName: ownName }, options: [], isLoading: false };
    const list = items ?? [];
    return {
      naming: { warehouseNames: new Map(list.map((w) => [w.id, w.name])) },
      options: list.map((w) => ({ warehouseId: w.id, warehouseName: w.name })),
      isLoading: enabled && query.isPending,
    };
  }, [main, ownName, items, enabled, query.isPending]);
}

// ─── Walks ───────────────────────────────────────────────────────────────────

function useAllReceipts(warehouseId: string | undefined, enabled: boolean) {
  const query = useAdminQuery(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'goods-receipts', walk: 'all' }),
    (signal) => collectPages((cursor) => listGoodsReceipts({ cursor, limit: WALK_PAGE_LIMIT, warehouseId }, signal), WALK_MAX_PAGES),
    { enabled },
  );
  return { ...queryState(query, enabled), items: query.data?.items ?? [], complete: query.data?.complete ?? true };
}

function useAllPurchaseOrders(warehouseId: string | undefined, enabled: boolean) {
  const query = useAdminQuery(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'purchase-orders', walk: 'all' }),
    (signal) => collectPages((cursor) => listPurchaseOrders({ cursor, limit: WALK_PAGE_LIMIT, warehouseId }, signal), WALK_MAX_PAGES),
    { enabled },
  );
  return { ...queryState(query, enabled), items: query.data?.items ?? [], complete: query.data?.complete ?? true };
}

export interface LiveReceivingDashboard extends LiveQueryState {
  shipments: LiveShipment[];
  records: LiveReceipt[];
  issues: LiveQualityIssue[];
  /** False when a walk stopped early, so the counts may be partial. */
  complete: boolean;
}

/** The dashboard's orders, receipts and QC-pending issues (M2-01, the pending queue, the activity screen). */
export function useReceivingDashboard(warehouseId: string | undefined, naming: WarehouseNaming, enabled = true): LiveReceivingDashboard {
  const orders = useAllPurchaseOrders(warehouseId, enabled);
  const receipts = useAllReceipts(warehouseId, enabled);
  const data = useMemo(() => {
    const now = new Date();
    const byOrder = receiptsByOrder(receipts.items);
    const orderOf = new Map(orders.items.map((po) => [po.id, po]));
    const records = receipts.items
      .map((gr) => {
        const po = orderOf.get(gr.purchaseOrderId);
        return toLiveReceipt(gr, { ...naming, now, poNumber: po?.poNumber, expectedGrams: po === undefined ? null : grams(po.quantityKg), cropName: po?.cropName, grade: po?.grade });
      })
      .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : a.receivedAt > b.receivedAt ? -1 : 0));
    return {
      shipments: orders.items.map((po) => toPurchaseOrderShipment(po, { ...naming, receipts: byOrder.get(po.id) ?? [] })),
      records,
      issues: qcPendingIssues(records),
    };
  }, [orders.items, receipts.items, naming]);
  return {
    isLoading: orders.isLoading || receipts.isLoading,
    error: orders.error ?? receipts.error,
    refresh: () => {
      orders.refresh();
      receipts.refresh();
    },
    isRefreshing: orders.isRefreshing || receipts.isRefreshing,
    complete: orders.complete && receipts.complete,
    ...data,
  };
}

// ─── Lists ───────────────────────────────────────────────────────────────────

/**
 * The purchase orders, page by page, narrowed by `filters` (BR-122). A row's
 * progress comes from the warehouse's receipts once they load (until then,
 * the order's own status).
 */
export function useShipmentList(
  warehouseId: string | undefined,
  naming: WarehouseNaming,
  filters: IntakeFilterParams = {},
  enabled = true,
): CursorList<LiveShipment> {
  const receipts = useAllReceipts(warehouseId, enabled);
  const receiptsKnown = !receipts.isLoading && (receipts.error === null || receipts.error === undefined);
  const byOrder = useMemo(() => receiptsByOrder(receipts.items), [receipts.items]);
  const map = useCallback(
    (po: PurchaseOrderDto) => toPurchaseOrderShipment(po, { ...naming, receipts: receiptsKnown ? byOrder.get(po.id) ?? [] : undefined }),
    [byOrder, receiptsKnown, naming],
  );
  const list = useCursorList(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'purchase-orders', q: filters.q ?? null, from: filters.from ?? null, to: filters.to ?? null }),
    (cursor, signal) => listPurchaseOrders({ cursor, warehouseId, q: filters.q, from: filters.from, to: filters.to }, signal),
    map,
    { enabled },
  );
  return {
    ...list,
    refresh: () => {
      list.refresh();
      receipts.refresh();
    },
  };
}

export interface LiveTransfers extends LiveQueryState {
  shipments: LiveShipment[];
}

/**
 * Inter-warehouse transfers arriving at `warehouseId` (Main with no pick:
 * every transfer in transit, each inbound to some warehouse; the server
 * answers 422 for a direction without a warehouse). Needs
 * transfer.inter_warehouse.view; without it nothing is read.
 */
export function useInboundTransfers(
  warehouseId: string | undefined,
  naming: WarehouseNaming,
  can: PermissionCheck,
  enabled = true,
): LiveTransfers {
  const on = enabled && can(TRANSFER_VIEW_CODE);
  const query = useAdminQuery(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'inbound-transfers' }),
    async (signal) => {
      const items = [];
      for (let page = 1; page <= OFFSET_MAX_PAGES; page += 1) {
        const result = await listWarehouseTransfers(
          warehouseId === undefined
            ? { status: 'IN_TRANSIT', page, pageSize: WALK_PAGE_LIMIT }
            : { status: 'IN_TRANSIT', warehouseId, direction: 'INBOUND', page, pageSize: WALK_PAGE_LIMIT },
          signal,
        );
        items.push(...result.items);
        if (result.items.length === 0 || items.length >= result.total) break;
      }
      return items;
    },
    { enabled: on },
  );
  const data = query.data;
  const shipments = useMemo(() => (data ?? []).map((tr) => toTransferShipment(tr, naming)), [data, naming]);
  return { ...queryState(query, on), shipments };
}

/** Receiving History, page by page; `status` and `filters` are server-side (BR-122). */
export function useReceiptHistory(
  warehouseId: string | undefined,
  status: GoodsReceiptStatus | undefined,
  naming: WarehouseNaming,
  filters: IntakeFilterParams = {},
  enabled = true,
): CursorList<LiveReceipt> {
  // The clock is read when a page is mapped, so "Today" is fresh after every fetch.
  const map = useCallback((gr: GoodsReceiptDto) => toLiveReceipt(gr, { ...naming, now: new Date() }), [naming]);
  return useCursorList(
    adminKeys.scoped(RECEIVING, warehouseId, {
      resource: 'goods-receipts',
      status: status ?? null,
      q: filters.q ?? null,
      from: filters.from ?? null,
      to: filters.to ?? null,
    }),
    (cursor, signal) => listGoodsReceipts({ cursor, warehouseId, status, q: filters.q, from: filters.from, to: filters.to }, signal),
    map,
    { enabled },
  );
}

// ─── One order / one receipt ─────────────────────────────────────────────────

export interface LivePurchaseOrder extends LiveQueryState {
  detail: PurchaseOrderDetailDto | undefined;
  shipment: LiveShipment | undefined;
  /** Its receipts, newest first. */
  records: LiveReceipt[];
  /** A receipt of this order still awaiting QC (the wizard resumes it). */
  pendingReceipt: GoodsReceiptDto | undefined;
}

/** One purchase order with its farmer and receipts; nothing while `id` is undefined. 404 outside the caller's scope. */
export function usePurchaseOrder(warehouseId: string | undefined, id: string | undefined, naming: WarehouseNaming): LivePurchaseOrder {
  const enabled = id !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'purchase-order', id: id ?? null }),
    (signal) => getPurchaseOrder(id ?? '', signal),
    { enabled },
  );
  const detail = query.data;
  const data = useMemo(() => {
    if (detail === undefined) return { shipment: undefined, records: [], pendingReceipt: undefined };
    const receipts = detail.goodsReceipts ?? [];
    const shipment = toPurchaseOrderShipment(detail, { ...naming, receipts });
    const now = new Date();
    return {
      shipment,
      records: receipts
        .map((gr) =>
          toLiveReceipt(gr, {
            ...naming,
            now,
            poNumber: detail.poNumber,
            expectedGrams: shipment.expectedGrams,
            cropName: detail.cropName,
            grade: detail.grade,
          }),
        )
        .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1)),
      pendingReceipt: pendingReceiptOf(receipts),
    };
  }, [detail, naming]);
  return { ...queryState(query, enabled), detail, ...data };
}

export interface LiveReceiptRead extends LiveQueryState {
  receipt: LiveReceiptDetail | undefined;
  /** The raw read, for the wizard's resume (submission state). */
  dto: GoodsReceiptDto | undefined;
}

/** One receipt with its quality check (BR-119, BR-120) and its order's quantity once the order loads. */
export function useReceipt(warehouseId: string | undefined, id: string | undefined, naming: WarehouseNaming): LiveReceiptRead {
  const enabled = id !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'goods-receipt', id: id ?? null }),
    (signal) => getGoodsReceipt(id ?? '', signal),
    { enabled },
  );
  const order = usePurchaseOrder(warehouseId, query.data?.purchaseOrderId, naming);
  const expectedGrams = order.shipment?.expectedGrams ?? null;
  const poNumber = order.detail?.poNumber;
  const data = query.data;
  const receipt = useMemo(
    () => (data === undefined ? undefined : toReceiptDetail(data, { ...naming, now: new Date(), expectedGrams, poNumber })),
    [data, naming, expectedGrams, poNumber],
  );
  return {
    ...queryState(query, enabled),
    refresh: () => {
      void query.refetch();
      order.refresh();
    },
    receipt,
    dto: data,
  };
}

export interface LiveDiscrepancies extends LiveQueryState {
  items: LiveDiscrepancy[];
}

/** The receipt's damage / mismatch reports, newest first (BR-121); every page. */
export function useReceiptDiscrepancies(warehouseId: string | undefined, receiptId: string | undefined): LiveDiscrepancies {
  const enabled = receiptId !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'discrepancies', receiptId: receiptId ?? null }),
    (signal) =>
      collectPages((cursor) => listGoodsReceiptDiscrepancies(receiptId ?? '', { cursor, limit: WALK_PAGE_LIMIT }, signal), WALK_MAX_PAGES),
    { enabled },
  );
  const data = query.data;
  const items = useMemo(() => {
    const now = new Date();
    return (data?.items ?? []).map((d: GoodsReceiptDiscrepancyDto) => toDiscrepancy(d, now));
  }, [data]);
  return { ...queryState(query, enabled), items };
}

export interface LiveReceiptDocument extends LiveQueryState {
  document: GoodsReceiptDocumentDto | undefined;
}

/** The printable goods receipt note (BR-124); nothing while `receiptId` is undefined. */
export function useReceiptDocument(warehouseId: string | undefined, receiptId: string | undefined): LiveReceiptDocument {
  const enabled = receiptId !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'receipt-document', receiptId: receiptId ?? null }),
    (signal) => getGoodsReceiptDocument(receiptId ?? '', signal),
    { enabled },
  );
  return { ...queryState(query, enabled), document: query.data };
}

export interface LiveStorageLocations extends LiveQueryState {
  options: LiveStorageOption[];
}

/** The warehouse's active storage locations, every page; nothing without a warehouse. */
export function useStorageLocations(warehouseId: string | undefined): LiveStorageLocations {
  const enabled = warehouseId !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'storage-locations' }),
    async (signal) => {
      const options: LiveStorageOption[] = [];
      for (let page = 1; page <= OFFSET_MAX_PAGES; page += 1) {
        const result = await listStorageLocations(warehouseId ?? '', { isActive: true, page, pageSize: WALK_PAGE_LIMIT }, signal);
        options.push(...result.items.map(toStorageOption));
        if (result.items.length === 0 || options.length >= result.total) break;
      }
      return options;
    },
    { enabled },
  );
  return { ...queryState(query, enabled), options: query.data ?? [] };
}

// ─── Writes ──────────────────────────────────────────────────────────────────

/** The wizard's calls; each takes the Idempotency-Key from the wizard's key ring (BR-118). */
export interface ReceivingWrites {
  createReceipt: (body: GoodsReceiptCreate, key: string) => Promise<GoodsReceiptDto>;
  getReceipt: (id: string) => Promise<GoodsReceiptDto>;
  recordQualityCheck: (id: string, body: QualityCheckCreate, key: string) => Promise<QualityCheckResultDto>;
  createDiscrepancy: (id: string, body: GoodsReceiptDiscrepancyCreate, key: string) => Promise<GoodsReceiptDiscrepancyDto>;
  createCounterOffer: (id: string, body: CounterOfferCreate, key: string) => Promise<CounterOfferDto>;
}

/**
 * Through useAdminMutation: a success refetches every receiving and inventory
 * query (a quality check creates stock), so lists and counts move at once.
 */
export function useReceivingWrites(): ReceivingWrites {
  const invalidates = [adminKeys.module(RECEIVING), adminKeys.module(INVENTORY)] as const;
  const create = useAdminMutation({
    mutationFn: ({ body, key }: { body: GoodsReceiptCreate; key: string }) => createGoodsReceipt(body, key),
    invalidates,
  });
  const qc = useAdminMutation({
    mutationFn: ({ id, body, key }: { id: string; body: QualityCheckCreate; key: string }) => recordQualityCheck(id, body, key),
    invalidates,
  });
  const discrepancy = useAdminMutation({
    mutationFn: ({ id, body, key }: { id: string; body: GoodsReceiptDiscrepancyCreate; key: string }) =>
      createGoodsReceiptDiscrepancy(id, body, key),
    invalidates,
  });
  const counter = useAdminMutation({
    mutationFn: ({ id, body, key }: { id: string; body: CounterOfferCreate; key: string }) => createCounterOffer(id, body, key),
    invalidates,
  });
  const createAsync = create.mutateAsync;
  const qcAsync = qc.mutateAsync;
  const discrepancyAsync = discrepancy.mutateAsync;
  const counterAsync = counter.mutateAsync;
  return useMemo(
    () => ({
      createReceipt: (body, key) => createAsync({ body, key }),
      getReceipt: (id) => getGoodsReceipt(id),
      recordQualityCheck: (id, body, key) => qcAsync({ id, body, key }),
      createDiscrepancy: (id, body, key) => discrepancyAsync({ id, body, key }),
      createCounterOffer: (id, body, key) => counterAsync({ id, body, key }),
    }),
    [createAsync, qcAsync, discrepancyAsync, counterAsync],
  );
}
