/**
 * Which warehouse areas the app offers at all. Owner decision (2026-10-14):
 * nothing is hidden for having no server API. The one exception is order
 * delivery, hidden because the business supports warehouse pickup only
 * (BR-21; docs/rules.md open contradiction 3). Material handling was deleted
 * outright (product decision 2026-10-14), so it is no area at all. Invoice
 * generation, which has no create-invoice route, is offered like every other
 * area with no API. Staff is still offered only with `admin.staff.list_view`,
 * which docs/rbac.json grants MAIN_WH_ADMIN (own) and not SUB_WH_ADMIN (none);
 * that is a real permission rule, not a no-API hide. The grants used here are
 * the ones generated from rbac.json (demoGrants.ts).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { makeCan } from '../permissions/can';
import { DEMO_ROLE_PERMISSIONS } from '../permissions/demoGrants';
import {
  AREAS_WITHOUT_API,
  STAFF_AREA_CODE,
  billingRouteArea,
  inventoryRouteArea,
  isAreaAvailable,
  ordersRouteArea,
  storageRouteArea,
  type WarehouseArea,
} from '../screens/warehouse/availability';

const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', '..');
const subCan = makeCan(DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN);
const mainCan = makeCan(DEMO_ROLE_PERMISSIONS.MAIN_WH_ADMIN);
const allowAll = () => true;

describe('AREAS_WITHOUT_API', () => {
  it('hides only order delivery: owner decision 2026-10-14 is to hide nothing for having no server API', () => {
    expect(AREAS_WITHOUT_API).toEqual(['orderDelivery']);
  });

  it('BR-21: order delivery is hidden whatever the permissions, for Sub and Main alike (pickup only)', () => {
    expect(isAreaAvailable('orderDelivery', allowAll)).toBe(false);
    expect(isAreaAvailable('orderDelivery', subCan)).toBe(false);
    expect(isAreaAvailable('orderDelivery', mainCan)).toBe(false);
  });

  it('every area but staff and order delivery is available whatever the permissions, for Sub and Main alike', () => {
    const areasWithNoApiPreviously: WarehouseArea[] = [
      'invoiceGeneration',
      'interWarehouseTransfers',
      'operationalIssues',
      'warehouseActivity',
      'warehouseDocuments',
      'stockAdjustments',
      'stockCounts',
      'orderCancellation',
      'orderIssues',
      'orderStockCheck',
      'orderInvoices',
    ];
    for (const area of areasWithNoApiPreviously) {
      expect({ area, any: isAreaAvailable(area, allowAll) }).toEqual({ area, any: true });
      expect({ area, sub: isAreaAvailable(area, subCan) }).toEqual({ area, sub: true });
      expect({ area, main: isAreaAvailable(area, mainCan) }).toEqual({ area, main: true });
    }
  });
});

describe('staff', () => {
  it('is gated on admin.staff.list_view, a code that exists in docs/rbac.json', () => {
    const rbac = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs', 'rbac.json'), 'utf8')) as {
      permissions: { code: string; grants?: Record<string, string> }[];
    };
    const perm = rbac.permissions.find((p) => p.code === STAFF_AREA_CODE);
    expect(STAFF_AREA_CODE).toBe('admin.staff.list_view');
    expect(perm).toBeDefined();
    expect(perm?.grants?.['SUB_WH_ADMIN']).toBe('none');
    expect(perm?.grants?.['MAIN_WH_ADMIN']).toBe('own');
  });

  it('is unavailable for a Sub admin (rbac grants SUB_WH_ADMIN none)', () => {
    expect(DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN).not.toContain(STAFF_AREA_CODE);
    expect(isAreaAvailable('staff', subCan)).toBe(false);
  });

  it('is available for a Main admin (rbac grants MAIN_WH_ADMIN own)', () => {
    expect(DEMO_ROLE_PERMISSIONS.MAIN_WH_ADMIN).toContain(STAFF_AREA_CODE);
    expect(isAreaAvailable('staff', mainCan)).toBe(true);
  });

  it('fails closed before permissions load', () => {
    expect(isAreaAvailable('staff', makeCan(null))).toBe(false);
  });
});

describe('storageRouteArea', () => {
  it('maps the storage-ops routes of hidden areas to their area', () => {
    const expected: Record<string, WarehouseArea> = {
      OperationalIssues: 'operationalIssues',
      OperationalIssueDetail: 'operationalIssues',
      Activity: 'warehouseActivity',
      ActivityDetail: 'warehouseActivity',
    };
    for (const [route, area] of Object.entries(expected)) {
      expect({ route, area: storageRouteArea(route) }).toEqual({ route, area });
    }
  });

  it('leaves the routes with an API (and Help & Support issue reports) ungated', () => {
    for (const route of ['Operations', 'StorageLocations', 'StorageLocationDetail', 'Capacity', 'ReportIssue', 'IssueSubmitted']) {
      expect({ route, area: storageRouteArea(route) }).toEqual({ route, area: undefined });
    }
  });
});

describe('inventoryRouteArea', () => {
  it('maps the inventory routes with no API to their area', () => {
    const expected: Record<string, WarehouseArea> = {
      M3S10: 'stockCounts', // stock verification
      M3S11: 'stockCounts', // physical count
      M3S12: 'stockCounts', // variance review
      M3S13: 'stockAdjustments', // adjustment request
      M3S14: 'stockAdjustments', // adjustment history
      M3S17: 'stockAdjustments', // adjustment detail / approval
    };
    for (const [route, area] of Object.entries(expected)) {
      expect({ route, area: inventoryRouteArea(route) }).toEqual({ route, area });
      expect({ route, sub: isAreaAvailable(area, subCan), main: isAreaAvailable(area, mainCan) }).toEqual({
        route,
        sub: true,
        main: true,
      });
    }
  });

  it('leaves the read-only inventory routes with an API ungated', () => {
    for (const route of ['M3S01', 'M3S02', 'M3S03', 'M3S04', 'M3S05', 'M3S06', 'M3S07', 'M3S08', 'M3S09']) {
      expect({ route, area: inventoryRouteArea(route) }).toEqual({ route, area: undefined });
    }
  });
});

describe('billingRouteArea', () => {
  it('maps the invoice generation routes to invoiceGeneration, which is offered: owner decision 2026-10-14 hides nothing for having no server API', () => {
    for (const route of ['GenerateInvoice', 'InvoiceWizard', 'InvoiceGenerated']) {
      expect({ route, area: billingRouteArea(route) }).toEqual({ route, area: 'invoiceGeneration' });
    }
    expect(isAreaAvailable('invoiceGeneration', allowAll)).toBe(true);
    expect(isAreaAvailable('invoiceGeneration', subCan)).toBe(true);
    expect(isAreaAvailable('invoiceGeneration', mainCan)).toBe(true);
  });

  it('leaves the read-only invoice routes with an API ungated', () => {
    for (const route of ['BillingHub', 'InvoiceList', 'InvoiceFilters', 'InvoiceDetail']) {
      expect({ route, area: billingRouteArea(route) }).toEqual({ route, area: undefined });
    }
  });
});

describe('ordersRouteArea', () => {
  it('maps the order routes with no API to their area', () => {
    const expected: Record<string, WarehouseArea> = {
      M5S05: 'orderStockCheck', // stock check + shortage
      M5S13: 'orderDelivery', // delivery preparation
      M5S14: 'orderDelivery', // dispatch to a delivery partner
      M5S16: 'orderIssues', // report an order issue
      M5S17: 'orderCancellation', // cancel order
      M5S18: 'orderInvoices', // order invoice (phase 7)
    };
    for (const [route, area] of Object.entries(expected)) {
      // Delivery is the one hidden order area (BR-21, pickup only).
      const offered = area !== 'orderDelivery';
      expect({ route, area: ordersRouteArea(route) }).toEqual({ route, area });
      expect({ route, sub: isAreaAvailable(area, subCan), main: isAreaAvailable(area, mainCan) }).toEqual({
        route,
        sub: offered,
        main: offered,
      });
    }
  });

  it('leaves the order routes with an API ungated', () => {
    for (const route of ['M5S01', 'M5S02', 'M5S03', 'M5S04', 'M5S07', 'M5S09', 'M5S11', 'M5S15']) {
      expect({ route, area: ordersRouteArea(route) }).toEqual({ route, area: undefined });
    }
  });

  it('maps the long route keys too', () => {
    expect(ordersRouteArea('M5S17_CancelOrder')).toBe('orderCancellation');
    expect(ordersRouteArea('M5S04_OrderDetail')).toBeUndefined();
  });
});
