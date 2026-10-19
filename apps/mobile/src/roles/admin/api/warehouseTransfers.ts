/**
 * Inter-warehouse transfers, read side (docs/openapi.yaml tag Inventory):
 *   GET /warehouse-transfers    transfer.inter_warehouse.view   (BR-30, BR-102; Sub = own)
 *
 * Newest first. Super, Tohfa and Main Warehouse admins see every transfer; a
 * Sub Warehouse Admin only those its own warehouse sends or receives, and a
 * `warehouseId` of another warehouse is an empty page, never 403 (BR-30). List
 * items are headers only (no `lines`). Pages by number (`WarehouseTransferList`:
 * items, page, pageSize, total), not by cursor.
 *
 * Read only on purpose: initiate (POST, Idempotency-Key, transfer.inter_warehouse.initiate),
 * approve, dispatch, receive and cancel belong to a later phase, so no write
 * helper is exported here. Money stays as the API's decimal string (`Money`);
 * the screen mappers turn it into integer paise.
 *
 * No UI imports, so any admin shell can reuse this module.
 */
import type { GenericProblemCode, Money } from '@tohfa/shared-types';
import type { OffsetPage } from '../../../shell/api/pagination';
import { adminGet } from './http';

/** docs/openapi.yaml `WarehouseTransferSummary.status`. */
export const TRANSFER_STATUSES = ['PENDING_APPROVAL', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

/** docs/openapi.yaml `WarehouseTransferSummary`: the transfer header (list items carry no lines). */
export interface WarehouseTransferDto {
  id: string;
  /** e.g. `TRF-000001`. */
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: TransferStatus;
  totalValue: Money;
  /** Some line's batch had no cost, so `totalValue` leaves it out; such a transfer always needs approval. */
  hasUnvaluedLines: boolean;
  requiresApproval: boolean;
  /** Some line was received short. */
  hasDiscrepancy: boolean;
  vehicleNumber: string | null;
  notes: string | null;
  receiptNote: string | null;
  cancelReason: string | null;
  initiatedBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  dispatchedAt: string | null;
  receivedBy: string | null;
  receivedAt: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListWarehouseTransfersParams {
  status?: TransferStatus | undefined;
  /** Either side of the transfer. */
  warehouseId?: string | undefined;
  /** Relative to `warehouseId`, which it then requires (422 without it). */
  direction?: 'INBOUND' | 'OUTBOUND' | undefined;
  /** From 1. */
  page?: number | undefined;
  /** 1-100, server default 20. */
  pageSize?: number | undefined;
}

/** Problem codes the list documents (401, 403, 422, 500). */
export const ERROR_CODES: readonly GenericProblemCode[] = ['UNAUTHENTICATED', 'FORBIDDEN', 'VALIDATION_FAILED', 'INTERNAL'];

export function listWarehouseTransfers(
  params: ListWarehouseTransfersParams = {},
  signal?: AbortSignal,
): Promise<OffsetPage<WarehouseTransferDto>> {
  return adminGet<OffsetPage<WarehouseTransferDto>>(
    '/warehouse-transfers',
    {
      status: params.status,
      warehouseId: params.warehouseId,
      direction: params.direction,
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  );
}
