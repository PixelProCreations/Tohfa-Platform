import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  WAREHOUSE_FEATURES,
  isWarehouseFeatureVisible,
  type WarehouseFeature,
} from '../screens/warehouse/availability';
import { createAdminCan } from '../rbac/permissions';

const openapi = fs.readFileSync(
  path.resolve(__dirname, '../../../../../../docs/openapi.yaml'),
  'utf8',
);

describe('warehouse feature availability', () => {
  it('every feature marked available names a path that exists in docs/openapi.yaml', () => {
    const features: [string, WarehouseFeature][] = Object.entries(WAREHOUSE_FEATURES);
    for (const [id, feature] of features) {
      if (feature.endpoint === null) {
        expect(feature.specGap, `${id} is hidden and must cite a spec gap`).toBeTruthy();
        continue;
      }
      expect(openapi, id).toContain(`\n  ${feature.endpoint}:`);
    }
  });

  it('a feature is visible only with both an endpoint and the permission', () => {
    const can = createAdminCan(['invoice.view_own']);
    expect(isWarehouseFeatureVisible('invoices', can)).toBe(true);
    expect(isWarehouseFeatureVisible('returns', can)).toBe(false);
  });

  it('invoice PDF download stays hidden (spec gap cited) even with invoice.view_own', () => {
    const can = createAdminCan(['invoice.view_own']);
    expect(isWarehouseFeatureVisible('invoiceDownload', can)).toBe(false);
    expect(WAREHOUSE_FEATURES.invoiceDownload.specGap).toContain('/invoices/{id}/download');
  });

  it('BR-61: bank refunds stay hidden for a role the server grants none (MW/SW default)', () => {
    const can = createAdminCan(['rma.request.process', 'rma.refund.wallet_process']);
    expect(isWarehouseFeatureVisible('returnsRefundBank', can)).toBe(false);
    expect(isWarehouseFeatureVisible('returnsRefundWallet', can)).toBe(true);
  });
  it('BR-82/BR-67/BR-66: a Sub Warehouse Admin (rbac.json grants) sees profile, sessions, password, notification settings, help, its warehouse and storage locations', () => {
    const can = createAdminCan(subWarehouseAdminGrants());
    for (const id of [
      'profileView',
      'adminProfile',
      'activeSessions',
      'changePassword',
      'notificationSettings',
      'helpSupport',
      'warehouseProfile',
      'warehouseCapacity',
      'storageLocations',
    ] as const) {
      expect(isWarehouseFeatureVisible(id, can), id).toBe(true);
    }
  });

  it('BR-66: warehouse edit and performance stay hidden for a Sub Warehouse Admin (rbac.json none)', () => {
    const can = createAdminCan(subWarehouseAdminGrants());
    expect(isWarehouseFeatureVisible('warehouseProfileEdit', can)).toBe(false);
    expect(isWarehouseFeatureVisible('warehousePerformance', can)).toBe(false);
    expect(WAREHOUSE_FEATURES.warehousePerformance.permission).toBe('warehouse.all.view');
  });

  it('BR-67: terminating an own session and admin support tickets stay hidden (no endpoint), even for Super Admin', () => {
    const can = createAdminCan(['auth.session.terminate_other', 'help.article.view', 'help.article.manage']);
    expect(isWarehouseFeatureVisible('terminateOwnSession', can)).toBe(false);
    expect(isWarehouseFeatureVisible('helpTickets', can)).toBe(false);
    expect(WAREHOUSE_FEATURES.terminateOwnSession.specGap).toContain('/auth/sessions/{id}/terminate');
  });

  it('BR-91: the cash top-up customer search stays hidden (first-time customers are un-findable), even with every grant', () => {
    const can = createAdminCan(subWarehouseAdminGrants());
    expect(can('wallet.cash_topup.process')).toBe(true);
    expect(isWarehouseFeatureVisible('cashTopupCustomerLookup', can)).toBe(false);
    expect(WAREHOUSE_FEATURES.cashTopupCustomerLookup.specGap).toContain('/admin/sales/customers/lookup');
  });

  it('BR-64: top-up history stays hidden — /admin/reports/cash-topups is an aggregate, not a list', () => {
    const can = createAdminCan(subWarehouseAdminGrants());
    expect(isWarehouseFeatureVisible('cashTopupHistory', can)).toBe(false);
    expect(WAREHOUSE_FEATURES.cashTopupHistory.specGap).toContain('/admin/reports/cash-topups');
  });
});

function subWarehouseAdminGrants(): string[] {
  const rbac = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../../../../../docs/rbac.json'), 'utf8'),
  ) as { permissions: { code: string; grants: Record<string, string> }[] };
  return rbac.permissions
    .filter((p) => (p.grants['SUB_WH_ADMIN'] ?? 'none') !== 'none')
    .map((p) => p.code);
}
