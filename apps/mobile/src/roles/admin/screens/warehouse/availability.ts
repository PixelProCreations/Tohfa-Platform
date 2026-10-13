/**
 * Which warehouse-admin features the app may show, and why.
 *
 * A feature is visible only when BOTH hold:
 *  1. the server has an endpoint for it (`endpoint` is a docs/openapi.yaml
 *     path — tests/availability.test.ts checks it exists), and
 *  2. the signed-in admin holds its docs/rbac.json `permission`.
 *
 * A feature with no endpoint is HIDDEN, not deleted: set `endpoint: null` and
 * cite the gap in `specGap` so it can be switched on when the API lands.
 * Visibility is presentation only; the server still enforces every call.
 */
import type { AdminCan, AdminPermissionCode } from '../../rbac/permissions';

export interface WarehouseFeature {
  permission: AdminPermissionCode;
  /** The OpenAPI path that backs it, or null when there is none (hidden). */
  endpoint: string | null;
  /** Required when `endpoint` is null: what is missing from the spec. */
  specGap?: string | undefined;
}

export const WAREHOUSE_FEATURES = {
  invoices: { permission: 'invoice.view_own', endpoint: '/invoices' },
  invoiceDownload: {
    permission: 'invoice.view_own',
    endpoint: null,
    specGap:
      '/invoices/{id}/download returns application/pdf bytes or a 302 to a signed link; ' +
      'there is no JSON response carrying the signed URL, RN fetch follows the 302 itself, ' +
      'and the app has no file-saving dependency, so mobile cannot consume it yet.',
  },
  /** Profile entry + read-only view (GET /auth/me). */
  profileView: { permission: 'auth.principal.view_own', endpoint: '/auth/me' },
  /** Edit name/locale (PATCH /auth/me, BR-82). */
  adminProfile: { permission: 'auth.profile.edit_own', endpoint: '/auth/me' },
  activeSessions: { permission: 'auth.principal.view_own', endpoint: '/auth/me/sessions' },
  changePassword: {
    permission: 'auth.password.change_own',
    endpoint: '/auth/me/change-password',
  },
  terminateOwnSession: {
    permission: 'auth.session.terminate_other',
    endpoint: null,
    specGap:
      'No endpoint ends one of the caller’s OWN other sessions. /auth/sessions/{id}/terminate ' +
      'is auth.session.terminate_other (Super Admin only, SUB_WH_ADMIN none) for ANOTHER ' +
      'admin’s session; GET /auth/me/sessions returns no isCurrent flag (BR-67).',
  },
  notificationSettings: {
    permission: 'notification.own.admin_preferences',
    endpoint: '/notification-preferences/admin',
  },
  helpSupport: { permission: 'help.article.view', endpoint: '/admin/help' },
  helpTickets: {
    permission: 'help.article.view',
    endpoint: null,
    specGap: 'Admin support tickets are not built (docs/rules.md BR-82 rule 3); no endpoint.',
  },
  warehouseProfile: { permission: 'warehouse.own.view', endpoint: '/warehouses/{id}' },
  warehouseProfileEdit: { permission: 'warehouse.profile.edit', endpoint: '/warehouses/{id}' },
  warehouseCapacity: { permission: 'warehouse.own.view', endpoint: '/warehouses/{id}/capacity' },
  storageLocations: {
    permission: 'inventory.batch.view',
    endpoint: '/warehouses/{id}/storage-locations',
  },
  warehousePerformance: {
    permission: 'warehouse.all.view',
    endpoint: null,
    specGap:
      'No warehouse performance/KPI endpoint exists; warehouse.all.view only backs the ' +
      'GET /warehouses master list. SUB_WH_ADMIN holds none of warehouse.all.view either.',
  },
  customerWallet: {
    permission: 'customer.wallet.view',
    endpoint: '/admin/customers/{customerId}/wallet',
  },
  cashTopup: {
    permission: 'wallet.cash_topup.process',
    endpoint: '/admin/wallets/{customerId}/cash-topup',
  },
  returns: { permission: 'rma.request.process', endpoint: '/admin/returns' },
  returnsInspect: {
    permission: 'inventory.quality_check.perform',
    endpoint: '/admin/returns/{id}/inspect',
  },
  returnsApprove: { permission: 'rma.refund.approve', endpoint: '/admin/returns/{id}/approve' },
  returnsRefundWallet: {
    permission: 'rma.refund.wallet_process',
    endpoint: '/admin/returns/{id}/refund/wallet',
  },
  returnsRefundBank: {
    permission: 'rma.refund.bank_process',
    endpoint: '/admin/returns/{id}/refund/bank',
  },
} as const satisfies Record<string, WarehouseFeature>;

export type WarehouseFeatureId = keyof typeof WAREHOUSE_FEATURES;

export function isWarehouseFeatureVisible(id: WarehouseFeatureId, can: AdminCan): boolean {
  const feature: WarehouseFeature = WAREHOUSE_FEATURES[id];
  return feature.endpoint !== null && can(feature.permission);
}
