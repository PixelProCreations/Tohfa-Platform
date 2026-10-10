/**
 * Shared types for the inter-warehouse transfer screens.
 *
 * As in the other warehouse areas the role difference is carried by `scope`
 * (warehouseId undefined = all four warehouses, the Main view) and `can` (a
 * docs/rbac.json code check that only decides what to render; the server
 * enforces every action again, CLAUDE.md 2.1).
 *
 * Permissions (rbac.json, FINAL_LIST 142-146):
 *   - `transfer.inter_warehouse.initiate`  SA all, MAIN all, SUB none (BR-26).
 *     Initiate New Transfer, the list's New Transfer actions, Cancel Request.
 *   - `transfer.inter_warehouse.receive`   SA/TOHFA/MAIN/SUB all.
 *     Receive at destination, Start Inspection, Complete Transfer Receipt.
 *   - `transfer.high_value.approve`        SA only. A transfer at or above the
 *     high-value threshold (config/businessThresholds.ts, BR-26) is routed to
 *     Super Admin approval unless the initiator holds it.
 *
 * No `transfer.view` code exists. A Sub scope sees only INCOMING transfers
 * (destination = scope.warehouseId) because receiving them is all it may do;
 * a transfer it is not the destination of reads as "not found" (no 403 leak).
 */
export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

export type TransferStatus = 'Pending SA Approval' | 'In Transit' | 'Arrived' | 'Completed';

/** One inter-warehouse transfer (mock data today; no transfer endpoint in docs/openapi.yaml). */
export interface TransferItem {
  id: string;
  /** 'TRF-00284' */
  code: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  produce: string;
  quantityKg: number;
  status: TransferStatus;
  eta?: string | undefined;
  vehicle?: string | undefined;
  initiatedBy?: string | undefined;
  /** Received quantity recorded at inspection (Completed transfers). */
  receivedKg?: number | undefined;
  /** The destination counted a different quantity than was sent. */
  qtyMismatch?: boolean | undefined;
}

/** Screens of the transfers flow. */
export type TransferRoute = 'Transfers' | 'TransferDetail' | 'InitiateNewTransfer' | 'TransferReceiving' | 'TransferInspection';

export interface TransferRouteParams {
  transferId?: string | undefined;
}
