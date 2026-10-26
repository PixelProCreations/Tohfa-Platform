/**
 * Inbound inter-warehouse transfers on Incoming Shipments (design M2-02, and
 * the Shipment Type facet of M2-03). Pure decisions, no React, so plain-Node
 * vitest covers them.
 *
 * The design names two shipment types: farmer goods (here a purchase order
 * raised to a farmer, GET /admin/purchase-orders) and a warehouse transfer
 * (GET /warehouse-transfers). A transfer is awaiting receipt while it is
 * IN_TRANSIT: the API has no ARRIVED status and no arrival action (owner
 * decision: no arrival step), so IN_TRANSIT is the only status listed here.
 *
 * Scope (BR-30): the list sends the warehouse the receiving flow already
 * computed (receivingWarehouseFilter: a Sub scope always its own uuid, Main
 * its pick or none) as the INBOUND side. The server answers 422 for a
 * direction without a warehouse, so Main with no pick asks for every transfer
 * in transit, each of which is inbound to some warehouse.
 */
import type { ListWarehouseTransfersParams, WarehouseTransferStatus } from '../../../api/transfers';
import { t, type TranslationKey } from '../../../i18n';
import { isAreaAvailable } from '../availability';
import { TRANSFER_CODES } from '../transfers/mappers';
import type { TransferListItem } from '../transfers/types';
import { matchesShipmentTab } from './mappers';
import type { IncomingShipment, PermissionCheck, ShipmentFilterTab, ShipmentTypeFilter } from './types';

export type { ShipmentTypeFilter };

/** The Shipment Type facet: both, purchase orders only, transfers only. */
export const SHIPMENT_TYPE_FILTERS: readonly ShipmentTypeFilter[] = ['All', 'PurchaseOrders', 'Transfers'];

const SHIPMENT_TYPE_LABEL: Record<ShipmentTypeFilter, TranslationKey> = {
  All: 'receiving.shipmentType.all',
  PurchaseOrders: 'receiving.shipmentType.purchaseOrders',
  Transfers: 'receiving.shipmentType.transfers',
};

export function shipmentTypeLabel(filter: ShipmentTypeFilter): string {
  return t(SHIPMENT_TYPE_LABEL[filter]);
}

/** BR-102: dispatched and not yet received. */
export const AWAITING_RECEIPT_STATUS: WarehouseTransferStatus = 'IN_TRANSIT';

/** GET /warehouse-transfers params for the transfers arriving at `warehouseId` (undefined = every warehouse). */
export function inboundTransferParams(warehouseId: string | undefined): ListWarehouseTransfersParams {
  if (warehouseId === undefined) return { status: AWAITING_RECEIPT_STATUS };
  return { status: AWAITING_RECEIPT_STATUS, warehouseId, direction: 'INBOUND' };
}

/** Transfer rows (and so the facet) need transfer.inter_warehouse.view. */
export function offersTransferRows(can: PermissionCheck): boolean {
  return isAreaAvailable('interWarehouseTransfers', can);
}

/** The receive screen needs transfer.inter_warehouse.receive; the server also confines it to the destination. */
export function canOpenTransferInspection(can: PermissionCheck): boolean {
  return can(TRANSFER_CODES.receive);
}

/** A transfer in transit has had nothing received yet: it is "Expected", never part-received, in QC or completed. */
export function transferMatchesTab(tab: ShipmentFilterTab): boolean {
  return tab === 'All' || tab === 'Expected';
}

export type IncomingRow =
  | { kind: 'transfer'; key: string; transfer: TransferListItem }
  | { kind: 'purchaseOrder'; key: string; shipment: IncomingShipment };

/**
 * The rows the list shows for a type and a status pill. Transfers come first:
 * they are few and already on the road, while the purchase orders page in
 * below them.
 */
export function incomingRows(input: {
  shipments: readonly IncomingShipment[];
  transfers: readonly TransferListItem[];
  type: ShipmentTypeFilter;
  tab: ShipmentFilterTab;
}): IncomingRow[] {
  const rows: IncomingRow[] = [];
  if (input.type !== 'PurchaseOrders' && transferMatchesTab(input.tab)) {
    for (const transfer of input.transfers) rows.push({ kind: 'transfer', key: transfer.id, transfer });
  }
  if (input.type !== 'Transfers') {
    for (const shipment of input.shipments) {
      if (matchesShipmentTab(shipment.status, input.tab)) rows.push({ kind: 'purchaseOrder', key: shipment.purchaseOrderId, shipment });
    }
  }
  return rows;
}
