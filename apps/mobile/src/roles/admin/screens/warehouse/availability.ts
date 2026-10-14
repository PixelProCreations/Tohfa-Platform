/**
 * Which warehouse areas the app offers at all. Owner decision (API
 * integration plan, decision 2):
 *
 *   - Five areas have no server API, so they are hidden for every warehouse
 *     admin: material handling, operational issues, warehouse activity,
 *     warehouse documents and inter-warehouse transfers. Their screens stay in
 *     the code (fixture-backed) until an API exists; only the entry points
 *     (button, row, tile, route) are hidden.
 *   - Staff (roster and attendance) is shown only with `admin.staff.list_view`.
 *     docs/rbac.json grants it MAIN_WH_ADMIN `own` and SUB_WH_ADMIN `none`
 *     (owner decision 2026-10-11, superseding the withdrawn
 *     `warehouse.staff.list_view`).
 *
 *   - Two inventory areas have no server API either (API integration plan,
 *     phase 3): stock adjustments (POST /admin/stock-adjustments is in the
 *     spec but has no server route, and there is no list or approve endpoint)
 *     and stock counts (physical count, stock verification and variance
 *     review have no endpoint). Hidden the same way.
 *
 *   - Five order areas have no server API either (API integration plan,
 *     phase 5): cancelling an order (no admin cancel route), reporting an
 *     order issue (no admin route), the stock check before packing (no
 *     endpoint), delivery preparation and dispatch to a delivery partner
 *     (delivery is not enabled in Track 1, BR-21 / docs/rules.md open
 *     contradiction 3; there is no delivery-partner list and the admin detail
 *     carries no address), and the order invoice (wired in phase 7). Hidden the
 *     same way. Marking a pickup order ready still uses POST .../dispatch.
 *
 *   - Invoice generation has no server API (plan phase 7): there is no
 *     create-invoice route, because the sale or the order that needs an
 *     invoice issues it. The Generate Invoice picker, the invoice wizard and
 *     its result page are hidden the same way; the invoice list, detail and
 *     download are live. The order invoice page (M5S18) stays hidden: the
 *     order detail carries its invoice id, but that page is not wired yet.
 *
 * Hiding is display only. The server refuses what it has no route for, and
 * authorises everything else on the caller's token (root CLAUDE.md 2.1).
 */
import type { PermissionCheck } from './finance-expenses/types';
import type { StorageRoute } from './storage-ops/types';

export type WarehouseArea =
  | 'materialHandling'
  | 'operationalIssues'
  | 'warehouseActivity'
  | 'warehouseDocuments'
  | 'interWarehouseTransfers'
  | 'invoiceGeneration'
  | 'stockAdjustments'
  | 'stockCounts'
  | 'orderCancellation'
  | 'orderIssues'
  | 'orderStockCheck'
  | 'orderDelivery'
  | 'orderInvoices'
  | 'staff';

export const AREAS_WITHOUT_API: readonly WarehouseArea[] = [
  'materialHandling',
  'operationalIssues',
  'warehouseActivity',
  'warehouseDocuments',
  'interWarehouseTransfers',
  'invoiceGeneration',
  'stockAdjustments',
  'stockCounts',
  'orderCancellation',
  'orderIssues',
  'orderStockCheck',
  'orderDelivery',
  'orderInvoices',
];

/** The docs/rbac.json code that lists the warehouse staff roster. */
export const STAFF_AREA_CODE = 'admin.staff.list_view';

export function isAreaAvailable(area: WarehouseArea, can: PermissionCheck): boolean {
  if (AREAS_WITHOUT_API.includes(area)) return false;
  if (area === 'staff') return can(STAFF_AREA_CODE);
  return true;
}

/**
 * The hidden area a storage-ops route belongs to. ReportIssue and
 * IssueSubmitted are left out on purpose: Help & Support opens them in
 * 'support' mode, which is not the operational-issues area.
 */
const STORAGE_ROUTE_AREA: Partial<Record<StorageRoute, WarehouseArea>> = {
  MaterialHandling: 'materialHandling',
  MaterialDetail: 'materialHandling',
  AddMaterial: 'materialHandling',
  OperationalIssues: 'operationalIssues',
  OperationalIssueDetail: 'operationalIssues',
  Activity: 'warehouseActivity',
  ActivityDetail: 'warehouseActivity',
};

export function storageRouteArea(route: string): WarehouseArea | undefined {
  return Object.prototype.hasOwnProperty.call(STORAGE_ROUTE_AREA, route)
    ? STORAGE_ROUTE_AREA[route as StorageRoute]
    : undefined;
}

/** The hidden area an inventory route (design id, InventoryFlow) belongs to. */
const INVENTORY_ROUTE_AREA: Readonly<Record<string, WarehouseArea>> = {
  M3S10: 'stockCounts', // stock verification
  M3S11: 'stockCounts', // physical count
  M3S12: 'stockCounts', // variance review
  M3S13: 'stockAdjustments', // adjustment request
  M3S14: 'stockAdjustments', // adjustment history
  M3S17: 'stockAdjustments', // adjustment detail / approval
};

export function inventoryRouteArea(route: string): WarehouseArea | undefined {
  return Object.prototype.hasOwnProperty.call(INVENTORY_ROUTE_AREA, route) ? INVENTORY_ROUTE_AREA[route] : undefined;
}

/** The hidden area a billing route (BillingFlow) belongs to: the three invoice generation routes. */
const BILLING_ROUTE_AREA: Readonly<Record<string, WarehouseArea>> = {
  GenerateInvoice: 'invoiceGeneration',
  InvoiceWizard: 'invoiceGeneration',
  InvoiceGenerated: 'invoiceGeneration',
};

export function billingRouteArea(route: string): WarehouseArea | undefined {
  return Object.prototype.hasOwnProperty.call(BILLING_ROUTE_AREA, route) ? BILLING_ROUTE_AREA[route] : undefined;
}

/** The hidden area an order route (design id, OrdersFlow) belongs to. */
const ORDERS_ROUTE_AREA: Readonly<Record<string, WarehouseArea>> = {
  M5S05: 'orderStockCheck', // stock check + shortage
  M5S13: 'orderDelivery', // delivery preparation
  M5S14: 'orderDelivery', // dispatch to a delivery partner
  M5S16: 'orderIssues', // report an order issue
  M5S17: 'orderCancellation', // cancel order
  M5S18: 'orderInvoices', // order invoice (phase 7)
};

/** Takes the short key ('M5S17') or the long one ('M5S17_CancelOrder'). */
export function ordersRouteArea(route: string): WarehouseArea | undefined {
  const key = route.split('_')[0] ?? route;
  return Object.prototype.hasOwnProperty.call(ORDERS_ROUTE_AREA, key) ? ORDERS_ROUTE_AREA[key] : undefined;
}
