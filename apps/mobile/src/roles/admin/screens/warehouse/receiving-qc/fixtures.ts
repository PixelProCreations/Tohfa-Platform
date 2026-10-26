/**
 * LEGACY sample data, kept ONLY for host code outside the receiving area that
 * still imports it through ./index.ts (the Sub shell
 * roles/subwarehouse/screens/SubWarehouseAdminDashboardScreen.tsx:
 * ALERT_RECEIPT_ID, findShipment, shipmentsInScope, IncomingShipment; and the
 * farmer App.tsx via screens/warehouse/index.ts: ALERT_RECEIPT_ID,
 * DEMO_SHIPMENT). No receiving screen reads this file any more: they read the
 * API (./useReceivingData.ts). Delete it once those hosts stop importing it.
 */
import type { IncomingShipment, WarehouseScope, WizardShipmentData } from './types';

/** Main Warehouse view: no warehouseId means every warehouse. */
function isMainScope(scope: WarehouseScope): boolean {
  return scope.warehouseId === undefined;
}

/** Warehouse id of the demo Sub warehouse (matches the Sub shell scope). */
const COONOOR_ID = 'WH-COON';

/** The shipment the wizard opens on when a shell passes none. */
export const DEMO_SHIPMENT: WizardShipmentData = {
  code: 'GR-1024',
  produce: 'Tomato',
  grade: 'Grade 1',
  expectedQty: 150,
  receivedQty: 145,
  rejectedQty: 5,
  receivedDate: '24 Sep 2026',
  receivedTime: '10:30 AM',
  reference: 'PO-2026-0024',
  from: 'Main Warehouse',
  vehicle: 'TN-43-E-8821 (Murugan)',
  arrival: '10:32 AM · Today',
  crateTareKg: 2,
};

/** The receipt the Sub "goods receipt" alert opens (was SubWarehouseGoodsReceiptDetail). */
export const ALERT_RECEIPT_ID = 'GR-00245';

// ─── Receiving list screens ──────────────────────────────────────────────────

const OOTY_ID = 'WH-OOTY';
const KOTAGIRI_ID = 'WH-KOTA';

/**
 * Incoming shipments. The GR-10xx rows are the Sub shell's inline list
 * (Coonoor); the SHP-0001xx rows and GR-04512 are the Main IncomingShipments /
 * Incoming Goods rows (all four warehouses).
 */
export const INCOMING_SHIPMENTS: IncomingShipment[] = [
  {
    code: 'GR-1024',
    reference: 'PO-2026-0024',
    status: 'Awaiting QC',
    type: 'Inter-Warehouse Transfer',
    warehouseId: COONOOR_ID,
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Tomato',
    grade: 'Grade 1',
    expectedQty: 150,
    receivedQty: 145,
    acceptedQty: 140,
    rejectedQty: 5,
    actualArrival: '24 Sep · 10:30 AM',
    dispatchDate: '23 Sep 2026',
    expectedArrival: '24 Sep 2026',
    batchSource: 'Internal only',
    vehicle: DEMO_SHIPMENT.vehicle,
    arrival: DEMO_SHIPMENT.arrival,
    crateTareKg: DEMO_SHIPMENT.crateTareKg,
  },
  {
    code: 'GR-1021',
    reference: 'PO-2026-0021',
    status: 'Mismatch',
    type: 'Inter-Warehouse Transfer',
    warehouseId: COONOOR_ID,
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Carrot',
    grade: 'Grade 1',
    expectedQty: 100,
    receivedQty: 95,
    dispatchDate: '22 Sep 2026',
    expectedArrival: '23 Sep 2026',
    actualArrival: '23 Sep · 11:15 AM',
    batchSource: 'Internal only',
    hasReview: true,
  },
  {
    code: 'GR-1026',
    reference: 'PO-2026-0026',
    status: 'Expected',
    type: 'Inter-Warehouse Transfer',
    warehouseId: COONOOR_ID,
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Beetroot',
    grade: 'Grade 1',
    expectedQty: 60,
    dispatchStatus: 'Today',
    dispatchDate: '24 Sep 2026',
    expectedArrival: '25 Sep 2026',
    actualArrival: 'Pending',
    batchSource: 'Internal only',
  },
  {
    code: 'GR-1023',
    reference: 'PO-2026-0023',
    status: 'Completed',
    type: 'Inter-Warehouse Transfer',
    warehouseId: COONOOR_ID,
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Carrot',
    grade: 'Grade 1',
    expectedQty: 80,
    receivedQty: 80,
    acceptedQty: 80,
    dispatchDate: '22 Sep 2026',
    expectedArrival: '23 Sep 2026',
    actualArrival: '23 Sep · 09:00 AM',
    batchSource: 'Internal only',
  },
  {
    code: 'GR-1018',
    reference: 'PO-2026-0018',
    status: 'Rejected',
    type: 'Farmer/Admin',
    warehouseId: COONOOR_ID,
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Spinach',
    grade: 'Grade 2',
    expectedQty: 30,
    receivedQty: 30,
    rejectedQty: 30,
    dispatchDate: '21 Sep 2026',
    expectedArrival: '22 Sep 2026',
    actualArrival: '22 Sep · 02:30 PM',
    batchSource: 'Purchase Order',
  },
  {
    code: 'SHP-000124',
    reference: 'CON-2026-0124',
    status: 'Arrived',
    type: 'Farmer/Admin',
    warehouseId: COONOOR_ID,
    from: 'Farmer Admin',
    to: 'Coonoor',
    produce: 'Tomato',
    grade: 'Grade 1',
    expectedQty: 500,
    dispatchDate: '24 Sep 2026',
    expectedArrival: '25 Sep 2026',
    actualArrival: '25 Sep · 09:15 AM',
    batchSource: 'Purchase Order',
    crates: 20,
  },
  {
    code: 'SHP-000119',
    reference: 'TRF-2026-0119',
    status: 'Receiving',
    type: 'Inter-Warehouse Transfer',
    warehouseId: OOTY_ID,
    from: 'Kotagiri',
    to: 'Ooty',
    produce: 'Carrot',
    grade: 'Grade 1',
    expectedQty: 200,
    dispatchDate: '24 Sep 2026',
    expectedArrival: '25 Sep 2026',
    actualArrival: '25 Sep · 08:40 AM',
    batchSource: 'Internal only',
  },
  {
    code: 'SHP-000120',
    reference: 'CON-2026-0120',
    status: 'Expected',
    type: 'Farmer/Admin',
    warehouseId: KOTAGIRI_ID,
    from: 'Farmer Admin',
    to: 'Kotagiri',
    produce: 'Cabbage',
    grade: 'Grade 1',
    expectedQty: 350,
    dispatchStatus: 'Today',
    dispatchDate: '25 Sep 2026',
    expectedArrival: '25 Sep 2026',
    batchSource: 'Purchase Order',
  },
  {
    code: 'SHP-000115',
    reference: 'TRF-2026-0115',
    status: 'Completed',
    type: 'Inter-Warehouse Transfer',
    warehouseId: COONOOR_ID,
    from: 'Ooty',
    to: 'Coonoor',
    produce: 'Potato Jyoti',
    grade: 'Grade 1',
    expectedQty: 600,
    receivedQty: 600,
    acceptedQty: 600,
    dispatchDate: '23 Sep 2026',
    expectedArrival: '24 Sep 2026',
    actualArrival: '24 Sep · 04:10 PM',
    batchSource: 'Internal only',
  },
  {
    code: 'GR-04512',
    reference: 'CON-2026-4512',
    status: 'Mismatch',
    type: 'Farmer/Admin',
    warehouseId: KOTAGIRI_ID,
    from: 'Farmer Admin',
    to: 'Kotagiri',
    produce: 'Beans',
    grade: 'Grade 1',
    expectedQty: 120,
    receivedQty: 112,
    dispatchDate: '24 Sep 2026',
    expectedArrival: '25 Sep 2026',
    actualArrival: '25 Sep · 09:45 AM',
    batchSource: 'Purchase Order',
    hasReview: true,
  },
];

/** True when a row owned by `warehouseId` is visible to `scope` (and the Main selector, if any). */
function inReceivingScope(scope: WarehouseScope, warehouseId: string, selectedId?: string | undefined): boolean {
  if (!isMainScope(scope)) return warehouseId === scope.warehouseId;
  return selectedId === undefined || warehouseId === selectedId;
}

/** Shipments a scope may see; a cross-scope id resolves to nothing (no existence leak). */
export function shipmentsInScope(scope: WarehouseScope, shipments: IncomingShipment[] = INCOMING_SHIPMENTS): IncomingShipment[] {
  return shipments.filter((s) => inReceivingScope(scope, s.warehouseId));
}

/** Find a shipment within the scope. */
export function findShipment(
  scope: WarehouseScope,
  code: string | undefined,
  shipments: IncomingShipment[] = INCOMING_SHIPMENTS,
): IncomingShipment | undefined {
  return shipmentsInScope(scope, shipments).find((s) => s.code === code);
}

