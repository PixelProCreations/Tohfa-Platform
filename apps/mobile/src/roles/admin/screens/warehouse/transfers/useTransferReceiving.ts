/**
 * Live data for Transfer Receiving (design M2-16), the transfer detail and the
 * receiving inspection. Thin TanStack Query wrappers; every decision (scope,
 * mapping, counts, the receive body, the key and the replay) is in
 * ./transferReceiving.ts, which is tested (hooks cannot run in this app's
 * plain-Node vitest).
 *
 * Keys are adminKeys.scoped('transfers', warehouseId, ...), so one
 * warehouse's rows never answer another's query (BR-30). A receive
 * invalidates the transfer, receiving and inventory modules: it moves stock
 * into the destination (new batches, TRANSFER_IN ledger rows) and takes the
 * transfer off the receiving area's incoming list.
 */
import { useCallback, useMemo, useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useAdminMutation, useAdminQuery } from '../../../api/hooks';
import { getBatch } from '../../../api/inventory';
import { adminKeys } from '../../../api/queryKeys';
import { getWarehouseTransfer, receiveWarehouseTransfer, type WarehouseTransferReceive } from '../../../api/transfers';
import { listWarehouseTransfers, type TransferStatus, type WarehouseTransferDto } from '../../../api/warehouseTransfers';
import { useReceivingNaming } from '../receiving-qc/useReceivingData';
import {
  createTransferReceiveKeys,
  inboundTransferScopeParams,
  mismatchTally,
  submitTransferReceive,
  toLiveTransferDetail,
  toLiveTransferRow,
  TRANSFER_RECEIVING_CODES,
  transferNamingOf,
  type LiveTransferDetail,
  type LiveTransferRow,
  type MismatchTally,
  type ReceiveOutcome,
  type ReceiveSessionState,
  type TransferNaming,
} from './transferReceiving';
import type { PermissionCheck, WarehouseScope } from './types';

export const TRANSFERS_MODULE = 'transfers';
const RECEIVING_MODULE = 'receiving';
const INVENTORY_MODULE = 'inventory';
/** The largest page the spec allows, so a walk needs the fewest calls. */
const PAGE_SIZE = 100;
/** Guard on a walk of the incoming list; not a business limit. */
const INCOMING_MAX_PAGES = 20;
/** Guard on the RECEIVED walk behind QTY MISMATCH; past it the tile says "n+". Not a business limit. */
const TALLY_MAX_PAGES = 10;

export interface TransferQueryState {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

function stateOf(query: { isPending: boolean; error: unknown; refetch: () => unknown }, enabled: boolean): TransferQueryState {
  return {
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

async function walk(
  params: { status: TransferStatus; warehouseId?: string; direction?: 'INBOUND' },
  maxPages: number,
  signal: AbortSignal,
): Promise<{ items: WarehouseTransferDto[]; total: number }> {
  const items: WarehouseTransferDto[] = [];
  let total = 0;
  for (let page = 1; page <= maxPages; page += 1) {
    const result = await listWarehouseTransfers({ ...params, page, pageSize: PAGE_SIZE }, signal);
    total = result.total;
    items.push(...result.items);
    if (result.items.length === 0 || items.length >= result.total) break;
  }
  return { items, total };
}

/** Warehouse names for this viewer (Main: GET /warehouses, shared with the receiving area; Sub: its own only). */
export function useTransferNaming(scope: WarehouseScope, can: PermissionCheck): TransferNaming {
  const { options } = useReceivingNaming(scope, can);
  // Keyed on the values, not the scope object: hosts may pass a new object each render.
  const { warehouseId, warehouseName } = scope;
  return useMemo(() => transferNamingOf({ warehouseId, warehouseName }, options), [warehouseId, warehouseName, options]);
}

export interface IncomingTransfers extends TransferQueryState {
  rows: LiveTransferRow[];
  /** The server's IN_TRANSIT total; undefined until loaded. */
  total: number | undefined;
}

/** IN_TRANSIT transfers arriving at the scope (Sub: its own warehouse, INBOUND; Main: every warehouse). */
export function useIncomingTransfers(scope: WarehouseScope, can: PermissionCheck, naming: TransferNaming): IncomingTransfers {
  const enabled = can(TRANSFER_RECEIVING_CODES.view);
  const params = inboundTransferScopeParams(scope);
  const query = useAdminQuery(
    adminKeys.scoped(TRANSFERS_MODULE, scope.warehouseId, { resource: 'incoming', status: 'IN_TRANSIT', ...params }),
    (signal) => walk({ status: 'IN_TRANSIT', ...params }, INCOMING_MAX_PAGES, signal),
    { enabled },
  );
  const data = query.data;
  const rows = useMemo(() => (data?.items ?? []).map((dto) => toLiveTransferRow(dto, naming)), [data, naming]);
  return { ...stateOf(query, enabled), rows, total: data?.total };
}

export interface ReceivedTransfers extends TransferQueryState {
  /** COMPLETED: the server's RECEIVED total; undefined until loaded. */
  completed: number | undefined;
  /** QTY MISMATCH; undefined until loaded. */
  mismatch: MismatchTally | undefined;
}

export interface TransferListResult extends TransferQueryState {
  items: LiveTransferRow[];
  total: number;
}

/**
 * Live list of inter-warehouse transfers matching status/direction filters.
 */
export function useTransferList(
  scope: WarehouseScope,
  can: PermissionCheck,
  filter: { status?: TransferStatus | undefined; direction?: 'INBOUND' | 'OUTBOUND' | undefined; page?: number | undefined } = {},
): TransferListResult {
  const enabled = can(TRANSFER_RECEIVING_CODES.view);
  const naming = useTransferNaming(scope, can);
  const page = filter.page ?? 1;
  const direction = scope.warehouseId ? filter.direction : undefined;
  const query = useAdminQuery(
    adminKeys.scoped(TRANSFERS_MODULE, scope.warehouseId, {
      resource: 'list',
      status: filter.status,
      direction,
      page,
    }),
    (signal) =>
      listWarehouseTransfers(
        {
          status: filter.status,
          warehouseId: scope.warehouseId,
          direction,
          page,
          pageSize: 20,
        },
        signal,
      ),
    { enabled },
  );

  const data = query.data;
  const items = useMemo(() => (data?.items ?? []).map((dto) => toLiveTransferRow(dto, naming)), [data, naming]);
  return {
    ...stateOf(query, enabled),
    items,
    total: data?.total ?? 0,
  };
}

/**
 * The scope's RECEIVED transfers: their total (COMPLETED) and how many were
 * received short (QTY MISMATCH, hasDiscrepancy). The list takes no
 * discrepancy filter, so the RECEIVED pages are read up to a bound.
 */
export function useReceivedTransfers(scope: WarehouseScope, can: PermissionCheck): ReceivedTransfers {
  const enabled = can(TRANSFER_RECEIVING_CODES.view);
  const params = inboundTransferScopeParams(scope);
  const query = useAdminQuery(
    adminKeys.scoped(TRANSFERS_MODULE, scope.warehouseId, { resource: 'received-tally', status: 'RECEIVED', ...params }),
    (signal) => walk({ status: 'RECEIVED', ...params }, TALLY_MAX_PAGES, signal),
    { enabled },
  );
  const data = query.data;
  const mismatch = useMemo(() => (data === undefined ? undefined : mismatchTally(data.items, data.total)), [data]);
  return { ...stateOf(query, enabled), completed: data?.total, mismatch };
}

function detailKey(scope: WarehouseScope, id: string) {
  return adminKeys.scoped(TRANSFERS_MODULE, scope.warehouseId, { resource: 'detail', id });
}

/**
 * Total sent per transfer, from each one's lines (list items carry no lines).
 * One GET per listed transfer, on the detail's own key, so opening a row is
 * already cached. Absent from the map until read (the screen hides it).
 */
export function useTransferSentTotals(scope: WarehouseScope, ids: readonly string[]): ReadonlyMap<string, number> {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: detailKey(scope, id),
      queryFn: ({ signal }: { signal: AbortSignal }) => getWarehouseTransfer(id, signal),
    })),
    combine: (results) => {
      const out = new Map<string, number>();
      const empty: TransferNaming = { names: new Map() };
      for (const r of results) {
        if (r.data === undefined) continue;
        const sent = toLiveTransferDetail(r.data, empty).sentGrams;
        if (sent !== null) out.set(r.data.id, sent);
      }
      return out;
    },
  });
}

export interface TransferDetailState extends TransferQueryState {
  transfer: LiveTransferDetail | undefined;
}

/** One transfer with its lines; a 404 (unknown or outside the scope, BR-30) is an error, never a 403. */
export function useTransferDetail(
  scope: WarehouseScope,
  can: PermissionCheck,
  transferId: string | undefined,
  naming: TransferNaming,
): TransferDetailState {
  const enabled = transferId !== undefined && transferId !== '' && can(TRANSFER_RECEIVING_CODES.view);
  const query = useAdminQuery(detailKey(scope, transferId ?? ''), (signal) => getWarehouseTransfer(transferId ?? '', signal), {
    enabled,
  });
  const data = query.data;
  const transfer = useMemo(() => (data === undefined ? undefined : toLiveTransferDetail(data, naming)), [data, naming]);
  return { ...stateOf(query, enabled), transfer };
}

export interface BatchFacts {
  /** batchId -> crop name (only batches whose read carried one). */
  cropNames: ReadonlyMap<string, string>;
  /** batchId -> batch code. */
  codes: ReadonlyMap<string, string>;
}

/**
 * Crop name and code of the batches the scope may read (transferReceiving.ts
 * decides which, BR-30). An allow-list of two fields: never the batch's
 * source farmer (BR-16).
 */
export function useTransferBatchFacts(scope: WarehouseScope, batchIds: readonly string[]): BatchFacts {
  return useQueries({
    queries: batchIds.map((id) => ({
      // Its own resource name: other areas cache this batch in other shapes.
      queryKey: adminKeys.scoped(INVENTORY_MODULE, scope.warehouseId, { resource: 'transfer-line-batch', batchId: id }),
      queryFn: ({ signal }: { signal: AbortSignal }) => getBatch(id, signal),
    })),
    combine: (results) => {
      const cropNames = new Map<string, string>();
      const codes = new Map<string, string>();
      for (const r of results) {
        if (r.data === undefined) continue;
        codes.set(r.data.id, r.data.batchCode);
        if (r.data.cropName) cropNames.set(r.data.id, r.data.cropName);
      }
      return { cropNames, codes };
    },
  });
}

/**
 * The receive write. `submit` keeps one Idempotency-Key per body and replays
 * a body whose outcome is unknown exactly as sent (BR-118); see
 * submitTransferReceive.
 */
export function useReceiveTransfer() {
  const mutation = useAdminMutation({
    mutationFn: ({ id, body, idempotencyKey }: { id: string; body: WarehouseTransferReceive; idempotencyKey: string }) =>
      receiveWarehouseTransfer(id, body, idempotencyKey),
    invalidates: [adminKeys.module(TRANSFERS_MODULE), adminKeys.module(RECEIVING_MODULE), adminKeys.module(INVENTORY_MODULE)],
  });
  const keysRef = useRef(createTransferReceiveKeys());
  const sessionRef = useRef<ReceiveSessionState>({ held: null });
  const { mutateAsync } = mutation;
  const submit = useCallback(
    async (transferId: string, body: WarehouseTransferReceive): Promise<ReceiveOutcome> => {
      const outcome = await submitTransferReceive(
        sessionRef.current,
        transferId,
        body,
        { receive: (id, sent, idempotencyKey) => mutateAsync({ id, body: sent, idempotencyKey }) },
        keysRef.current,
      );
      sessionRef.current = outcome.state;
      return outcome;
    },
    [mutateAsync],
  );
  return { submit, isPending: mutation.isPending };
}

/** Read the codes of the batches a receipt created (for the summary), as far as the scope may. */
export async function readBatchCodes(batchIds: readonly string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const results = await Promise.allSettled(batchIds.map((id) => getBatch(id)));
  for (const r of results) if (r.status === 'fulfilled') out.set(r.value.id, r.value.batchCode);
  return out;
}

