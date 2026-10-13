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

  it('BR-61: bank refunds stay hidden for a role the server grants none (MW/SW default)', () => {
    const can = createAdminCan(['rma.request.process', 'rma.refund.wallet_process']);
    expect(isWarehouseFeatureVisible('returnsRefundBank', can)).toBe(false);
    expect(isWarehouseFeatureVisible('returnsRefundWallet', can)).toBe(true);
  });
});
