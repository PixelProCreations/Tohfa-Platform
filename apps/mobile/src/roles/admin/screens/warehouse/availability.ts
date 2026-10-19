/**
 * Which warehouse areas the app offers at all. One policy:
 *
 *   - Owner decision (2026-10-14): nothing is hidden for having no server API.
 *     Operational issues, warehouse activity, warehouse documents,
 *     inter-warehouse transfers, stock adjustments, stock counts, invoice
 *     generation and the order areas (cancellation, issues, stock check,
 *     invoices) are all offered. Their screens are fixture-backed until an API
 *     exists, so they show sample data rather than live data. The server
 *     refuses what it has no route for.
 *   - The only area taken out of the app is order delivery
 *     (AREAS_WITHOUT_API): the business supports warehouse pickup only, not
 *     delivery dispatch (BR-21; docs/rules.md open contradiction 3). Its screens
 *     stay in the code in case delivery is built later -- a hide, not a delete.
 *     Material handling was dropped as a product decision (2026-10-14); it is
 *     deleted, so it is no area at all.
 *   - Staff (roster and attendance) is offered only with
 *     `admin.staff.list_view`. docs/rbac.json grants it MAIN_WH_ADMIN `own` and
 *     SUB_WH_ADMIN `none` (owner decision 2026-10-11, superseding the withdrawn
 *     `warehouse.staff.list_view`). That is a real permission rule, not a
 *     no-API hide, so the policy above does not touch it.
 *
 * Hiding is display only. The server authorises everything on the caller's
 * token (root CLAUDE.md 2.1).
 */
import type { PermissionCheck } from './finance-expenses/types';
import type { StorageRoute } from './storage-ops/types';

export type WarehouseArea =
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

/** The areas the app does not offer whatever the permissions: pickup only, no delivery (BR-21). */
export const AREAS_WITHOUT_API: readonly WarehouseArea[] = ['orderDelivery'];

/** The docs/rbac.json code that lists the warehouse staff roster. */
export const STAFF_AREA_CODE = 'admin.staff.list_view';

export function isAreaAvailable(area: WarehouseArea, can: PermissionCheck): boolean {
  if (AREAS_WITHOUT_API.includes(area)) return false;
  if (area === 'staff') return can(STAFF_AREA_CODE);
  return true;
}

/**
 * The area a storage-ops route belongs to. ReportIssue and
 * IssueSubmitted are left out on purpose: Help & Support opens them in
 * 'support' mode, which is not the operational-issues area.
 */
const STORAGE_ROUTE_AREA: Partial<Record<StorageRoute, WarehouseArea>> = {
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

/** The area an inventory route (design id, InventoryFlow) belongs to. */
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

/** The area a billing route (BillingFlow) belongs to: the three invoice generation routes. */
const BILLING_ROUTE_AREA: Readonly<Record<string, WarehouseArea>> = {
  GenerateInvoice: 'invoiceGeneration',
  InvoiceWizard: 'invoiceGeneration',
  InvoiceGenerated: 'invoiceGeneration',
};

export function billingRouteArea(route: string): WarehouseArea | undefined {
  return Object.prototype.hasOwnProperty.call(BILLING_ROUTE_AREA, route) ? BILLING_ROUTE_AREA[route] : undefined;
}

/** The area an order route (design id, OrdersFlow) belongs to. */
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
