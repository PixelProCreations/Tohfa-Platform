/**
 * Live data for the goods receiving area. Thin wrappers over the admin hooks
 * (../../../api/hooks.ts); every decision lives in ./mappers.ts,
 * ./submission.ts or the API module, which are tested.
 *
 * Every hook takes the warehouseId to send, which the flow computes once with
 * receivingWarehouseFilter (a Sub scope is always its own warehouse, BR-30). It
 * is part of every query key, so one warehouse's rows never answer another's.
 * `naming` names each row's warehouse: a Sub scope's own name, or for the Main
 * view (whose scope names none) the GET /warehouses list (mappers.ts
 * warehouseNameFor). The flow memoises it, so it is a stable memo dependency.
 *
 * The dashboard and the shipment list need every receipt of the warehouse to
 * derive each order's receiving progress (the server never advances a purchase
 * order's status), so that query walks the cursor to the end (collectPages).
 * The page cap is a guard against a looping cursor, not a business limit; when
 * it trips the result says `complete: false`.
 */
import { useCallback, useMemo } from 'react';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import {
  createCounterOffer,
  createGoodsReceipt,
  getGoodsReceipt,
  getPurchaseOrder,
  listGoodsReceipts,
  listPurchaseOrders,
  recordQualityCheck,
  type CounterOfferCreate,
  type GoodsReceiptCreate,
  type GoodsReceiptDto,
  type GoodsReceiptStatus,
  type QualityCheckCreate,
  type PurchaseOrderDetailDto,
  type PurchaseOrderDto,
} from '../../../api/receiving';
import { adminKeys } from '../../../api/queryKeys';
import { listStorageLocations } from '../../../api/warehouses';
import { collectPages } from '../../../../../shell/api/pagination';
import {
  pendingReceiptOf,
  qcPendingIssues,
  toIncomingShipment,
  toReceivingRecord,
  toStorageLocationOption,
  type WarehouseNaming,
} from './mappers';
import type { ReceivingWrites } from './GoodsReceivingWizardScreen';
import type { IncomingShipment, QualityIssue, ReceivingRecord, StorageBayOption } from './types';

const RECEIVING = 'receiving';
const INVENTORY = 'inventory';
/** The largest page the spec allows (LimitParam), so a walk needs the fewest calls. */
const WALK_PAGE_LIMIT = 100;
/** Guard against a server cursor that never ends; not a business limit. */
const WALK_MAX_PAGES = 50;
/** Storage locations page by number; the spec caps a page at 100. */
const LOCATION_PAGE_SIZE = 100;
/** Guard against a total that never comes in; not a business limit. */
const LOCATION_MAX_PAGES = 20;

/** What a data screen needs to pick an AsyncState and to refresh. */
export interface LiveQueryState {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

function queryState(query: { isPending: boolean; error: unknown; refetch: () => unknown; isRefetching: boolean }): LiveQueryState {
  return {
    isLoading: query.isPending,
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

/** Every goods receipt of the warehouse, as the API sends them. */
function useAllReceipts(warehouseId: string | undefined) {
  const query = useAdminQuery(adminKeys.scoped(RECEIVING, warehouseId, { resource: 'goods-receipts', walk: 'all' }), (signal) =>
    collectPages((cursor) => listGoodsReceipts({ cursor, limit: WALK_PAGE_LIMIT, warehouseId }, signal), WALK_MAX_PAGES),
  );
  return { ...queryState(query), items: query.data?.items ?? [], complete: query.data?.complete ?? true };
}

/** Every purchase order of the warehouse, as the API sends them. */
function useAllPurchaseOrders(warehouseId: string | undefined) {
  const query = useAdminQuery(adminKeys.scoped(RECEIVING, warehouseId, { resource: 'purchase-orders', walk: 'all' }), (signal) =>
    collectPages((cursor) => listPurchaseOrders({ cursor, limit: WALK_PAGE_LIMIT, warehouseId }, signal), WALK_MAX_PAGES),
  );
  return { ...queryState(query), items: query.data?.items ?? [], complete: query.data?.complete ?? true };
}

export interface LiveReceivingDashboard extends LiveQueryState {
  shipments: IncomingShipment[];
  records: ReceivingRecord[];
  issues: QualityIssue[];
  /** False when a walk stopped early, so the counts may be partial. */
  complete: boolean;
}

/** The dashboard's orders, receipts and QC-pending issues. */
export function useReceivingDashboard(warehouseId: string | undefined, naming: WarehouseNaming): LiveReceivingDashboard {
  const orders = useAllPurchaseOrders(warehouseId);
  const receipts = useAllReceipts(warehouseId);
  const data = useMemo(() => {
    const now = new Date();
    const byOrder = receiptsByOrder(receipts.items);
    const poNumbers = new Map(orders.items.map((po) => [po.id, po.poNumber]));
    const records = receipts.items.map((gr) => toReceivingRecord(gr, { ...naming, now, poNumber: poNumbers.get(gr.purchaseOrderId) }));
    return {
      shipments: orders.items.map((po) => toIncomingShipment(po, { ...naming, receipts: byOrder.get(po.id) ?? [] })),
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

/**
 * The purchase orders, page by page. A row's progress comes from the
 * warehouse's receipts once they load (until then, the order's own status).
 */
export function useShipmentList(warehouseId: string | undefined, naming: WarehouseNaming): CursorList<IncomingShipment> {
  const receipts = useAllReceipts(warehouseId);
  const receiptsKnown = !receipts.isLoading && receipts.error === null;
  const byOrder = useMemo(() => receiptsByOrder(receipts.items), [receipts.items]);
  const map = useCallback(
    (po: PurchaseOrderDto) =>
      toIncomingShipment(po, { ...naming, receipts: receiptsKnown ? byOrder.get(po.id) ?? [] : undefined }),
    [byOrder, receiptsKnown, naming],
  );
  const list = useCursorList(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'purchase-orders' }),
    (cursor, signal) => listPurchaseOrders({ cursor, warehouseId }, signal),
    map,
  );
  return {
    ...list,
    refresh: () => {
      list.refresh();
      receipts.refresh();
    },
  };
}

export interface LivePurchaseOrder extends LiveQueryState {
  detail: PurchaseOrderDetailDto | undefined;
  shipment: IncomingShipment | undefined;
  /** Its receipts, as rows. */
  records: ReceivingRecord[];
  /** A receipt of this order still awaiting QC. */
  pendingReceipt: GoodsReceiptDto | undefined;
}

/** One purchase order with its farmer and receipts; nothing while `id` is undefined. */
export function usePurchaseOrder(warehouseId: string | undefined, id: string | undefined, naming: WarehouseNaming): LivePurchaseOrder {
  const query = useAdminQuery(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'purchase-order', id: id ?? null }),
    (signal) => getPurchaseOrder(id ?? '', signal),
    { enabled: id !== undefined },
  );
  const detail = query.data;
  const data = useMemo(() => {
    if (detail === undefined) return { shipment: undefined, records: [], pendingReceipt: undefined };
    const receipts = detail.goodsReceipts ?? [];
    const shipment = toIncomingShipment(detail, { ...naming, receipts });
    const now = new Date();
    return {
      shipment,
      records: receipts.map((gr) =>
        toReceivingRecord(gr, { ...naming, now, poNumber: detail.poNumber, expectedGrams: shipment.expectedGrams }),
      ),
      pendingReceipt: pendingReceiptOf(receipts),
    };
  }, [detail, naming]);
  return { ...queryState(query), isLoading: id !== undefined && query.isPending, detail, ...data };
}

/** Receiving History, page by page; `status` is the server-side filter. */
export function useReceiptHistory(
  warehouseId: string | undefined,
  status: GoodsReceiptStatus | undefined,
  naming: WarehouseNaming,
): CursorList<ReceivingRecord> {
  // The clock is read when a page is mapped, so "Today" is fresh after every fetch.
  const map = useCallback((gr: GoodsReceiptDto) => toReceivingRecord(gr, { ...naming, now: new Date() }), [naming]);
  return useCursorList(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'goods-receipts', status: status ?? null }),
    (cursor, signal) => listGoodsReceipts({ cursor, warehouseId, status }, signal),
    map,
  );
}

export interface LiveReceipt extends LiveQueryState {
  record: ReceivingRecord | undefined;
}

/** One receipt, with its order's quantity once the order loads. 404 outside the caller's scope. */
export function useReceipt(warehouseId: string | undefined, id: string | undefined, naming: WarehouseNaming): LiveReceipt {
  const query = useAdminQuery(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'goods-receipt', id: id ?? null }),
    (signal) => getGoodsReceipt(id ?? '', signal),
    { enabled: id !== undefined },
  );
  const order = usePurchaseOrder(warehouseId, query.data?.purchaseOrderId, naming);
  const expectedGrams = order.shipment?.expectedGrams ?? null;
  const poNumber = order.detail?.poNumber;
  const record = useMemo(
    () =>
      query.data === undefined
        ? undefined
        : toReceivingRecord(query.data, { ...naming, now: new Date(), expectedGrams, poNumber }),
    [query.data, naming, expectedGrams, poNumber],
  );
  return {
    ...queryState(query),
    isLoading: id !== undefined && query.isPending,
    refresh: () => {
      void query.refetch();
      order.refresh();
    },
    record,
  };
}

export interface LiveStorageLocations extends LiveQueryState {
  options: StorageBayOption[];
}

/** The warehouse's active storage locations, every page. */
export function useStorageLocations(warehouseId: string | undefined): LiveStorageLocations {
  const query = useAdminQuery(
    adminKeys.scoped(RECEIVING, warehouseId, { resource: 'storage-locations' }),
    async (signal) => {
      const options: StorageBayOption[] = [];
      for (let page = 1; page <= LOCATION_MAX_PAGES; page += 1) {
        const result = await listStorageLocations(warehouseId ?? '', { isActive: true, page, pageSize: LOCATION_PAGE_SIZE }, signal);
        options.push(...result.items.map(toStorageLocationOption));
        if (result.items.length === 0 || options.length >= result.total) break;
      }
      return options;
    },
    { enabled: warehouseId !== undefined },
  );
  return { ...queryState(query), isLoading: warehouseId !== undefined && query.isPending, options: query.data ?? [] };
}

/**
 * The wizard's API calls, through useAdminMutation: a success refetches every
 * receiving and inventory query (a quality check creates stock), so lists and
 * counts move at once. The Idempotency-Keys come from the wizard's key ring.
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
  const counter = useAdminMutation({
    mutationFn: ({ id, body, key }: { id: string; body: CounterOfferCreate; key: string }) => createCounterOffer(id, body, key),
    invalidates,
  });
  const createAsync = create.mutateAsync;
  const qcAsync = qc.mutateAsync;
  const counterAsync = counter.mutateAsync;
  return useMemo(
    () => ({
      createReceipt: (body, key) => createAsync({ body, key }),
      receiptsOfPurchaseOrder: async (purchaseOrderId) => {
        const walked = await collectPages(
          (cursor) => listGoodsReceipts({ cursor, limit: WALK_PAGE_LIMIT, purchaseOrderId }),
          WALK_MAX_PAGES,
        );
        return walked.items;
      },
      getReceipt: (id) => getGoodsReceipt(id),
      recordQualityCheck: (id, body, key) => qcAsync({ id, body, key }),
      createCounterOffer: (id, body, key) => counterAsync({ id, body, key }),
    }),
    [createAsync, qcAsync, counterAsync],
  );
}
