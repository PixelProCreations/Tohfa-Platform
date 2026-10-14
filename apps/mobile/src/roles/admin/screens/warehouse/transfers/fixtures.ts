/**
 * Mock transfers until a transfer endpoint exists (none in docs/openapi.yaml;
 * BR-26 scope is deferred). Rows carry the seeded warehouse ids (seed
 * 001_reference.sql); screens look the names up, never write them.
 */
import { WALLET_WAREHOUSES, warehouseNameOf } from '../wallet-cashtopup/fixtures';
import type { TransferItem, WarehouseScope } from './types';

/** The four seeded warehouses (transfer source / destination options). */
export const TRANSFER_WAREHOUSES: readonly WarehouseScope[] = WALLET_WAREHOUSES;

/** Display name of a warehouse id without the ' Warehouse' suffix ('Kotagiri'). */
export function transferWarehouseLabel(warehouseId: string): string {
  return warehouseNameOf(warehouseId).replace(/ Warehouse$/, '');
}

/** Produce offered on Initiate New Transfer (demo; the real list comes from stock). */
export const TRANSFER_PRODUCE_OPTIONS: readonly string[] = ['Beetroot', 'Carrots', 'Cabbage', 'Green Tea'];

/** Quick-add quantity presets on Initiate New Transfer, in kg. */
export const TRANSFER_QTY_PRESETS_KG: readonly number[] = [50, 100, 250, 500];

/** Demo dispatch details shown when a transfer leaves without approval. */
export const DEMO_DISPATCH = { vehicle: 'TN-43-E-8821', eta: 'ETA 2.5 hrs', initiatedBy: 'Suresh (MWA)' } as const;

export const TRANSFERS: readonly TransferItem[] = [
  {
    id: '00001',
    code: 'TRF-00001',
    sourceWarehouseId: 'WH-OOTY',
    destinationWarehouseId: 'WH-KOTA',
    produce: 'Beetroot',
    quantityKg: 300,
    status: 'In Transit',
    eta: 'ETA 3 hrs',
    vehicle: DEMO_DISPATCH.vehicle,
    initiatedBy: DEMO_DISPATCH.initiatedBy,
  },
  {
    id: '00002',
    code: 'TRF-00002',
    sourceWarehouseId: 'WH-COON',
    destinationWarehouseId: 'WH-KOTA',
    produce: 'Mixed vegetables',
    quantityKg: 1200,
    status: 'Pending SA Approval',
    initiatedBy: DEMO_DISPATCH.initiatedBy,
  },
  {
    id: '00003',
    code: 'TRF-00003',
    sourceWarehouseId: 'WH-KOTA',
    destinationWarehouseId: 'WH-OOTY',
    produce: 'Carrots',
    quantityKg: 450,
    status: 'Completed',
    receivedKg: 450,
    vehicle: DEMO_DISPATCH.vehicle,
    initiatedBy: DEMO_DISPATCH.initiatedBy,
  },
  {
    id: '00284',
    code: 'TRF-00284',
    sourceWarehouseId: 'WH-KOTA',
    destinationWarehouseId: 'WH-COON',
    produce: 'Tomato',
    quantityKg: 200,
    status: 'Arrived',
    vehicle: DEMO_DISPATCH.vehicle,
    initiatedBy: DEMO_DISPATCH.initiatedBy,
  },
];
