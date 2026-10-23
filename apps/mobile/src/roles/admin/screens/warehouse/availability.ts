/**
 * Which warehouse areas the app offers at all. One policy:
 *
 *   - Owner decision (2026-10-14): nothing is hidden for having no server API.
 *     Invoice generation, order cancellation, order issues and the order stock
 *     check have no API yet; their screens are fixture-backed and show sample
 *     data until one exists, and they are offered all the same. The server
 *     refuses what it has no route for. Invoice generation is the exception in
 *     practice: Generate Invoice was later excluded (2026-10-23, M9-04), and
 *     BillingFlow refuses its routes through EXCLUDED_BILLING_ROUTES below.
 *   - The only area taken out of the app is order delivery
 *     (AREAS_WITHOUT_API): the business supports warehouse pickup only, not
 *     delivery dispatch (BR-21; docs/rules.md open contradiction 3). Its screens
 *     stay in the code in case delivery is built later -- a hide, not a delete.
 *     Material Handling was removed entirely, product decision 2026-10-23.
 *     Marking a pickup order ready still uses
 *     POST .../dispatch.
 *   - Areas that now HAVE a live API are offered on the view permission that
 *     API enforces, the same real permission rule as Staff below. That is not a
 *     no-API hide, so the policy above does not touch it:
 *       * operational issues (/warehouses/{id}/issues, BR-103) and the
 *         warehouse activity feed (GET /warehouses/{id}/activity, BR-104) need
 *         `warehouse.issue.view` / `warehouse.activity.view` (MAIN all, SUB
 *         own). Reporting and working an issue need warehouse.issue.manage,
 *         which the issue screens check themselves.
 *       * inter-warehouse transfers (/warehouse-transfers, BR-102) need
 *         `transfer.inter_warehouse.view` (SA/TOHFA/MAIN all, SUB own).
 *       * warehouse documents (GET /warehouses/{id}/documents, BR-105) need
 *         `warehouse.document.view` (MAIN_WH_ADMIN all, SUB_WH_ADMIN own).
 *         Add / edit / archive need warehouse.document.manage, which the
 *         Documents screen checks itself.
 *       * stock counts (/admin/stock-verifications, BR-107) need
 *         `inventory.stock_verification.perform` (SA/TOHFA/MAIN all, SUB own).
 *       * stock adjustments (/admin/stock-adjustments, BR-37) need
 *         `inventory.stock_adjustment.create` (SA/TOHFA/MAIN all, SUB own),
 *         which the server also uses for its reads. Approving or rejecting one
 *         needs `inventory.stock_adjustment.approve` (SUB none, BR-37a), which
 *         the adjustment detail checks itself.
 *       * the order invoice (M5S18, GET /invoices/{id} and its download,
 *         BR-36) needs `invoice.view_own` (SA/TOHFA/MAIN all, SUB own); the
 *         order detail also hides the entry when the order has no invoice.
 *   - Staff (roster and attendance) is offered only with
 *     `admin.staff.list_view`. docs/rbac.json grants it MAIN_WH_ADMIN `own` and
 *     SUB_WH_ADMIN `none` (owner decision 2026-10-11, superseding the withdrawn
 *     `warehouse.staff.list_view`).
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
 * The area a storage-ops route belongs to (gated on its view
 * permission: issues and activity stay mapped so StorageFlow refuses them
 * without warehouse.issue.view / warehouse.activity.view). ReportIssue and
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

/** The area a billing route (BillingFlow) belongs to: the three invoice generation routes. */
const BILLING_ROUTE_AREA: Readonly<Record<string, WarehouseArea>> = {
  GenerateInvoice: 'invoiceGeneration',
  InvoiceWizard: 'invoiceGeneration',
  InvoiceGenerated: 'invoiceGeneration',
};

export function billingRouteArea(route: string): WarehouseArea | undefined {
  return Object.prototype.hasOwnProperty.call(BILLING_ROUTE_AREA, route) ? BILLING_ROUTE_AREA[route] : undefined;
}

/**
 * Billing routes BillingFlow never opens, whatever isAreaAvailable says about
 * 'invoiceGeneration'. Generate Invoice is excluded (2026-10-23 triage, M9-04):
 * there is no create-invoice route (sales and orders issue invoices), and these
 * screens only hold sample data, so a deep link to one would show an invoice
 * that does not exist. The area entry above stays for App.tsx's legacy keys.
 */
export const EXCLUDED_BILLING_ROUTES: readonly string[] = ['GenerateInvoice', 'InvoiceWizard', 'InvoiceGenerated'];

export function isBillingRouteExcluded(route: string): boolean {
  return EXCLUDED_BILLING_ROUTES.includes(route);
}

/** The area an order route (design id, OrdersFlow) belongs to. */
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
