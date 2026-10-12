/**
 * Which warehouse areas the app offers at all (owner decision 2 in the API
 * integration plan): five areas have no server API, so they are hidden for
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
  STAFF_AREA_CODE,
  isAreaAvailable,
  storageRouteArea,
  type WarehouseArea,
} from '../screens/warehouse/availability';

const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', '..');
const subCan = makeCan(DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN);
const mainCan = makeCan(DEMO_ROLE_PERMISSIONS.MAIN_WH_ADMIN);
const allowAll = () => true;

describe('AREAS_WITHOUT_API', () => {
  it('lists exactly the five areas the server has no API for', () => {
    expect([...AREAS_WITHOUT_API].sort()).toEqual(
      ['interWarehouseTransfers', 'materialHandling', 'operationalIssues', 'warehouseActivity', 'warehouseDocuments'].sort(),
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
