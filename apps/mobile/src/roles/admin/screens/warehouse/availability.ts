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
  invoiceDownload: { permission: 'invoice.view_own', endpoint: '/invoices/{id}/download' },
  adminProfile: { permission: 'auth.profile.edit_own', endpoint: '/auth/me' },
  warehouseProfile: { permission: 'warehouse.own.view', endpoint: '/warehouses/{id}' },
  warehouseProfileEdit: { permission: 'warehouse.profile.edit', endpoint: '/warehouses/{id}' },
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
