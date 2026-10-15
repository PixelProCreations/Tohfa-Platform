/**
 * Which warehouse areas the app offers at all (owner decision 2 in the API
 * integration plan): the areas in AREAS_WITHOUT_API have no server API, so they are hidden for
 * every warehouse admin; Staff is offered only with `admin.staff.list_view`,
 * which docs/rbac.json grants MAIN_WH_ADMIN (own) and not SUB_WH_ADMIN (none).
 * The grants used here are the ones generated from rbac.json (demoGrants.ts).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { makeCan } from '../permissions/can';
import { DEMO_ROLE_PERMISSIONS } from '../permissions/demoGrants';
import {
  AREAS_WITHOUT_API,
  ACTIVITY_AREA_CODE,
  DOCUMENTS_AREA_CODE,
  ISSUES_AREA_CODE,
  ORDER_INVOICES_AREA_CODE,
  STAFF_AREA_CODE,
  STOCK_ADJUSTMENTS_AREA_CODE,
  STOCK_COUNTS_AREA_CODE,
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
  it('lists exactly the areas the server has no API for (transfers, stock adjustments and stock counts are live now)', () => {
    expect([...AREAS_WITHOUT_API].sort()).toEqual(
      [
        // Phase 7: there is no create-invoice route; sales and orders issue
        // invoices, so the Generate Invoice picker, wizard and result are hidden.
        'invoiceGeneration',
        'materialHandling',
        // operationalIssues (BR-103) and warehouseActivity (BR-104) are live:
        // gated on warehouse.issue.view / warehouse.activity.view below.
        // warehouseDocuments is live (BR-105): gated on warehouse.document.view below.
        // stockAdjustments (BR-37) and stockCounts (BR-107) are live: gated on
        // inventory.stock_adjustment.create / inventory.stock_verification.perform below.
        // Phase 5: there is no admin cancel route, no admin order-issue route, no
        // stock-check endpoint, delivery dispatch is not enabled in Track 1 (BR-21;
        // no delivery-partner list, no address in the admin detail).
        // orderInvoices is live (M5S18): gated on invoice.view_own below.
        'orderCancellation',
        'orderIssues',
        'orderStockCheck',
        'orderDelivery',
      ].sort(),
    );
  });

  it('each is unavailable whatever the permissions, for Sub and Main alike', () => {
    for (const area of AREAS_WITHOUT_API) {
      expect({ area, any: isAreaAvailable(area, allowAll) }).toEqual({ area, any: false });
      expect({ area, sub: isAreaAvailable(area, subCan) }).toEqual({ area, sub: false });
      expect({ area, main: isAreaAvailable(area, mainCan) }).toEqual({ area, main: false });
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

describe('warehouseDocuments (BR-105)', () => {
  it('is gated on warehouse.document.view, a code in docs/rbac.json (Main all, Sub own)', () => {
    const rbac = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs', 'rbac.json'), 'utf8')) as {
      permissions: { code: string; grants?: Record<string, string> }[];
    };
    const perm = rbac.permissions.find((p) => p.code === DOCUMENTS_AREA_CODE);
    expect(DOCUMENTS_AREA_CODE).toBe('warehouse.document.view');
    expect(perm?.grants?.['MAIN_WH_ADMIN']).toBe('all');
    expect(perm?.grants?.['SUB_WH_ADMIN']).toBe('own');
  });

  it('BR-105: is available for both warehouse roles, and fails closed before permissions load', () => {
    expect(AREAS_WITHOUT_API).not.toContain('warehouseDocuments');
    expect(isAreaAvailable('warehouseDocuments', subCan)).toBe(true);
    expect(isAreaAvailable('warehouseDocuments', mainCan)).toBe(true);
    expect(isAreaAvailable('warehouseDocuments', makeCan(null))).toBe(false);
  });
});

describe('orderInvoices (M5S18, live, BR-36)', () => {
  it('is gated on invoice.view_own, a code in docs/rbac.json (Main all, Sub own)', () => {
    const rbac = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs', 'rbac.json'), 'utf8')) as {
      permissions: { code: string; grants?: Record<string, string> }[];
    };
    const perm = rbac.permissions.find((p) => p.code === ORDER_INVOICES_AREA_CODE);
    expect(ORDER_INVOICES_AREA_CODE).toBe('invoice.view_own');
    expect(perm?.grants?.['MAIN_WH_ADMIN']).toBe('all');
    expect(perm?.grants?.['SUB_WH_ADMIN']).toBe('own');
  });

  it('BR-36: is available to both warehouse admins, to nobody without the code, and fails closed before permissions load', () => {
    expect(AREAS_WITHOUT_API).not.toContain('orderInvoices');
    expect(isAreaAvailable('orderInvoices', subCan)).toBe(true);
    expect(isAreaAvailable('orderInvoices', mainCan)).toBe(true);
    expect(isAreaAvailable('orderInvoices', (code) => code !== ORDER_INVOICES_AREA_CODE)).toBe(false);
    expect(isAreaAvailable('orderInvoices', makeCan(null))).toBe(false);
  });
});

describe('operational issues and warehouse activity (live, BR-103 / BR-104)', () => {
  const rbac = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs', 'rbac.json'), 'utf8')) as {
    permissions: { code: string; grants?: Record<string, string> }[];
  };
  const grant = (code: string, role: string) => rbac.permissions.find((p) => p.code === code)?.grants?.[role];

  it('are gated on view codes that exist in docs/rbac.json (MAIN all, SUB own)', () => {
    expect(ISSUES_AREA_CODE).toBe('warehouse.issue.view');
    expect(ACTIVITY_AREA_CODE).toBe('warehouse.activity.view');
    for (const code of [ISSUES_AREA_CODE, ACTIVITY_AREA_CODE]) {
      expect({ code, main: grant(code, 'MAIN_WH_ADMIN'), sub: grant(code, 'SUB_WH_ADMIN') }).toEqual({ code, main: 'all', sub: 'own' });
    }
  });

  it('are available to both warehouse admins and to nobody without the code', () => {
    for (const area of ['operationalIssues', 'warehouseActivity'] as const) {
      expect({ area, sub: isAreaAvailable(area, subCan), main: isAreaAvailable(area, mainCan) }).toEqual({ area, sub: true, main: true });
      expect({ area, none: isAreaAvailable(area, () => false) }).toEqual({ area, none: false });
      expect({ area, loading: isAreaAvailable(area, makeCan(null)) }).toEqual({ area, loading: false });
    }
  });
});

describe('storageRouteArea', () => {
  it('maps the storage-ops routes of hidden areas to their area', () => {
    const expected: Record<string, WarehouseArea> = {
      MaterialHandling: 'materialHandling',
      MaterialDetail: 'materialHandling',
      AddMaterial: 'materialHandling',
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
  it('maps the stock count and adjustment routes to their permission-gated area', () => {
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
      // Both warehouse roles hold the create / perform codes (SUB own, MAIN all).
      expect({ route, sub: isAreaAvailable(area, subCan), main: isAreaAvailable(area, mainCan) }).toEqual({
        route,
        sub: true,
        main: true,
      });
      expect({ route, none: isAreaAvailable(area, () => false) }).toEqual({ route, none: false });
    }
  });

  it('BR-107: stock counts need inventory.stock_verification.perform, nothing else', () => {
    expect(STOCK_COUNTS_AREA_CODE).toBe('inventory.stock_verification.perform');
    expect(isAreaAvailable('stockCounts', (code) => code === STOCK_COUNTS_AREA_CODE)).toBe(true);
    expect(isAreaAvailable('stockCounts', (code) => code === STOCK_ADJUSTMENTS_AREA_CODE)).toBe(false);
  });

  it('BR-37: stock adjustments need inventory.stock_adjustment.create (approve alone does not open them)', () => {
    expect(STOCK_ADJUSTMENTS_AREA_CODE).toBe('inventory.stock_adjustment.create');
    expect(isAreaAvailable('stockAdjustments', (code) => code === STOCK_ADJUSTMENTS_AREA_CODE)).toBe(true);
    expect(isAreaAvailable('stockAdjustments', (code) => code === 'inventory.stock_adjustment.approve')).toBe(false);
  });

  it('leaves the read-only inventory routes with an API ungated', () => {
    for (const route of ['M3S01', 'M3S02', 'M3S03', 'M3S04', 'M3S05', 'M3S06', 'M3S07', 'M3S08', 'M3S09']) {
      expect({ route, area: inventoryRouteArea(route) }).toEqual({ route, area: undefined });
    }
  });
});

describe('billingRouteArea', () => {
  it('maps the invoice generation routes (no create-invoice API, phase 7) to invoiceGeneration', () => {
    for (const route of ['GenerateInvoice', 'InvoiceWizard', 'InvoiceGenerated']) {
      expect({ route, area: billingRouteArea(route) }).toEqual({ route, area: 'invoiceGeneration' });
    }
    expect(isAreaAvailable('invoiceGeneration', subCan)).toBe(false);
    expect(isAreaAvailable('invoiceGeneration', mainCan)).toBe(false);
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
    };
    for (const [route, area] of Object.entries(expected)) {
      expect({ route, area: ordersRouteArea(route) }).toEqual({ route, area });
      expect({ route, sub: isAreaAvailable(area, subCan), main: isAreaAvailable(area, mainCan) }).toEqual({
        route,
        sub: false,
        main: false,
      });
    }
  });

  it('maps the order invoice (M5S18, live) to orderInvoices, open with invoice.view_own only', () => {
    expect(ordersRouteArea('M5S18')).toBe('orderInvoices');
    expect(ordersRouteArea('M5S18_OrderInvoice')).toBe('orderInvoices');
    expect(isAreaAvailable('orderInvoices', subCan)).toBe(true);
    expect(isAreaAvailable('orderInvoices', mainCan)).toBe(true);
    expect(isAreaAvailable('orderInvoices', () => false)).toBe(false);
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
