/**
 * Shared types for the inter-warehouse transfer screens, which read and write
 * the live /warehouse-transfers API (roles/admin/api/transfers.ts, BR-102).
 *
 * As in the other warehouse areas the role difference is carried by `scope`
 * (warehouseId undefined = all four warehouses, the Main view) and `can` (a
 * docs/rbac.json code check that only decides what to render; the server
 * enforces every action again, CLAUDE.md 2.1).
 *
 * Permissions (rbac.json):
 *   - `transfer.inter_warehouse.view`      SA/TOHFA/MAIN all, SUB own. List and detail.
 *   - `transfer.inter_warehouse.initiate`  SA all, MAIN all, SUB none (BR-26).
 *     Initiate New Transfer and Cancel (the server gates cancel on it too).
 *   - `transfer.inter_warehouse.receive`   SA/TOHFA/MAIN/SUB all; the server
 *     confines it to the destination warehouse.
 *   - `transfer.high_value.approve`        SA only. Approve (which dispatches)
 *     a PENDING_APPROVAL transfer; Main cannot.
 *
 * Quantities are integer grams and money integer paise once mapped (the API
 * sends kg and Money decimal strings); nothing here is a float.
 */
import type { Paise } from '@tohfa/shared-types';
import type { AdminTone } from '../../../theme';
import type { WarehouseTransferStatus } from '../../../api/transfers';

export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

/** The server's transfer status (PENDING_APPROVAL, IN_TRANSIT, RECEIVED, CANCELLED). */
export type TransferStatusCode = WarehouseTransferStatus;

/** One transfer row of a list, mapped from the API header. */
export interface TransferListItem {
  id: string;
  /** The server's transfer number, e.g. 'TRF-2026-00012'. */
  code: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  /** Resolved display names (a fallback label when the viewer cannot see the warehouse). */
  sourceName: string;
  destinationName: string;
  status: TransferStatusCode;
  statusLabel: string;
  statusTone: AdminTone;
  totalValuePaise: Paise;
  hasUnvaluedLines: boolean;
  requiresApproval: boolean;
  hasDiscrepancy: boolean;
  vehicleNumber: string | null;
  createdAt: string;
}

/** One line of a transfer, quantities in integer grams. */
export interface TransferLineView {
  id: string;
  batchId: string;
  batchCode: string;
  gradeLabel: string;
  sentGrams: number;
  /** null until the transfer is received. */
  receivedGrams: number | null;
  /** received minus sent (negative = short); null until received. */
  varianceGrams: number | null;
  /** The batch the receipt created at the destination; null until received, or when 0 was received. */
  destBatchId: string | null;
  /** null when the source batch had no cost. */
  lineValuePaise: Paise | null;
}

/** A step of the detail timeline. */
export interface TransferTimelineStep {
  key: 'requested' | 'approved' | 'dispatched' | 'received' | 'cancelled';
  label: string;
  done: boolean;
  /** ISO time the step happened, when it did. */
  at: string | null;
}

/** One transfer with its lines, for the detail and the receiving inspection. */
export interface TransferDetailView extends TransferListItem {
  notes: string | null;
  receiptNote: string | null;
  cancelReason: string | null;
  /** When the destination received it (ISO); null until then. */
  receivedAt: string | null;
  lines: TransferLineView[];
  sentGrams: number;
  timeline: TransferTimelineStep[];
}

/** Screens of the transfers flow. */
export type TransferRoute = 'Transfers' | 'TransferDetail' | 'InitiateNewTransfer' | 'TransferReceiving' | 'TransferInspection';

export interface TransferRouteParams {
  transferId?: string | undefined;
}
