/**
 * Which warehouse areas the app offers at all. Owner decision (API
 * integration plan, decision 2):
 *
 *   - Material handling has no server API wired here, so it is hidden for
 *     every warehouse admin. Its screens stay in the code (fixture-backed)
 *     until an API exists; only the entry points (button, row, tile, route)
 *     are hidden.
 *   - Operational issues (/warehouses/{id}/issues, BR-103) and the warehouse
 *     activity feed (GET /warehouses/{id}/activity, BR-104) are live and shown
 *     with `warehouse.issue.view` / `warehouse.activity.view` (MAIN all, SUB
 *     own). Reporting and working an issue need warehouse.issue.manage, which
 *     the issue screens check themselves.
 *   - Inter-warehouse transfers are live (/warehouse-transfers, BR-102) and
 *     shown with `transfer.inter_warehouse.view` (SA/TOHFA/MAIN all, SUB own).
 *   - Warehouse documents are live (GET /warehouses/{id}/documents, BR-105)
 *     and shown only with `warehouse.document.view` (MAIN_WH_ADMIN all,
 *     SUB_WH_ADMIN own). Add / edit / archive need warehouse.document.manage,
 *     which the Documents screen checks itself.
 *   - Staff (roster and attendance) is shown only with `admin.staff.list_view`.
 *     docs/rbac.json grants it MAIN_WH_ADMIN `own` and SUB_WH_ADMIN `none`
 *     (owner decision 2026-10-11, superseding the withdrawn
 *     `warehouse.staff.list_view`).
 *
 *   - Stock counts are live (/admin/stock-verifications, BR-107) and shown
 *     with `inventory.stock_verification.perform` (SA/TOHFA/MAIN all, SUB
 *     own). Stock adjustments are live (/admin/stock-adjustments, BR-37) and
 *     shown with `inventory.stock_adjustment.create` (SA/TOHFA/MAIN all, SUB
 *     own), which the server also uses for its reads. Approving or rejecting
 *     one needs `inventory.stock_adjustment.approve` (SUB none, BR-37a),
 *     which the adjustment detail checks itself.
 *
 *   - Four order areas have no server API either (API integration plan,
 *     phase 5): cancelling an order (no admin cancel route), reporting an
 *     order issue (no admin route), the stock check before packing (no
 *     endpoint), delivery preparation and dispatch to a delivery partner
 *     (delivery is not enabled in Track 1, BR-21 / docs/rules.md open
 *     contradiction 3; there is no delivery-partner list and the admin detail
 *     carries no address). Hidden the same way. Marking a pickup order ready
 *     still uses POST .../dispatch.
 *
 *   - Invoice generation has no server API (plan phase 7): there is no
 *     create-invoice route, because the sale or the order that needs an
 *     invoice issues it. The Generate Invoice picker, the invoice wizard and
 *     its result page are hidden the same way; the invoice list, detail and
 *     download are live.
 *
 *   - The order invoice (M5S18) is live: the admin order detail (GET
 *     /admin/orders/{orderId}) carries its invoice id, and the page renders
 *     that invoice through GET /invoices/{id} and its download (BR-36). Shown
 *     with `invoice.view_own` (SA/TOHFA/MAIN all, SUB own); the order detail
 *     also hides the entry when the order has no invoice.
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
  'invoiceGeneration',
  'orderCancellation',
  'orderIssues',
  'orderStockCheck',
  'orderDelivery',
];

/** The docs/rbac.json code that lists the warehouse staff roster. */
export const STAFF_AREA_CODE = 'admin.staff.list_view';

/** The docs/rbac.json code that lists a warehouse's documents (BR-105). */
export const DOCUMENTS_AREA_CODE = 'warehouse.document.view';

/** The docs/rbac.json code that reads inter-warehouse transfers. */
export const TRANSFERS_AREA_CODE = 'transfer.inter_warehouse.view';

/** The docs/rbac.json code that reads a warehouse's operational issues (BR-103). */
export const ISSUES_AREA_CODE = 'warehouse.issue.view';

/** The docs/rbac.json code that reads a warehouse's activity feed (BR-104). */
export const ACTIVITY_AREA_CODE = 'warehouse.activity.view';

/** The docs/rbac.json code that records and reads physical stock counts (BR-107). */
export const STOCK_COUNTS_AREA_CODE = 'inventory.stock_verification.perform';

/** The docs/rbac.json code that raises and reads stock adjustments (BR-37). */
export const STOCK_ADJUSTMENTS_AREA_CODE = 'inventory.stock_adjustment.create';

/** The docs/rbac.json code that reads and downloads an invoice, here an order's (M5S18, BR-36). */
export const ORDER_INVOICES_AREA_CODE = 'invoice.view_own';

export function isAreaAvailable(area: WarehouseArea, can: PermissionCheck): boolean {
  if (AREAS_WITHOUT_API.includes(area)) return false;
  if (area === 'operationalIssues') return can(ISSUES_AREA_CODE);
  if (area === 'warehouseActivity') return can(ACTIVITY_AREA_CODE);
  if (area === 'staff') return can(STAFF_AREA_CODE);
  if (area === 'warehouseDocuments') return can(DOCUMENTS_AREA_CODE);
  if (area === 'interWarehouseTransfers') return can(TRANSFERS_AREA_CODE);
  if (area === 'stockCounts') return can(STOCK_COUNTS_AREA_CODE);
  if (area === 'stockAdjustments') return can(STOCK_ADJUSTMENTS_AREA_CODE);
  if (area === 'orderInvoices') return can(ORDER_INVOICES_AREA_CODE);
  return true;
}

/**
 * The area a storage-ops route belongs to (hidden, or gated on its view
 * permission: issues and activity stay mapped so StorageFlow refuses them
 * without warehouse.issue.view / warehouse.activity.view). ReportIssue and
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

/** The permission-gated area an inventory route (design id, InventoryFlow) belongs to. */
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

/** The hidden or permission-gated area an order route (design id, OrdersFlow) belongs to. */
const ORDERS_ROUTE_AREA: Readonly<Record<string, WarehouseArea>> = {
  M5S05: 'orderStockCheck', // stock check + shortage
  M5S13: 'orderDelivery', // delivery preparation
  M5S14: 'orderDelivery', // dispatch to a delivery partner
  M5S16: 'orderIssues', // report an order issue
  M5S17: 'orderCancellation', // cancel order
  M5S18: 'orderInvoices', // order invoice (live, gated on invoice.view_own)
};

/** Takes the short key ('M5S17') or the long one ('M5S17_CancelOrder'). */
export function ordersRouteArea(route: string): WarehouseArea | undefined {
  const key = route.split('_')[0] ?? route;
  return Object.prototype.hasOwnProperty.call(ORDERS_ROUTE_AREA, key) ? ORDERS_ROUTE_AREA[key] : undefined;
}
