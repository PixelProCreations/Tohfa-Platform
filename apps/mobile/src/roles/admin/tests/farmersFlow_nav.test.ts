/**
 * Shared Farmers flow (Module 1 phase 3A): the pure navigation state and the
 * permission gates every host uses. BR-108a: which farmers a caller sees is
 * the server's job; nothing here filters by role, zone or warehouse.
 */
import { describe, expect, it } from 'vitest';
import { makeCan } from '../permissions/can';
import {
  canOpenFarmers,
  farmersFlowReducer,
  farmersFlowSatellites,
  initialFarmersFlowState,
  type FarmersFlowState,
} from '../screens/farmers/flow/farmersFlowNav';
import type { FarmerListItem } from '../screens/farmers/list/legacyFarmerListItem';

const legacy: FarmerListItem = { id: 'uuid-farmer-1', name: 'Live Name', code: 'TOHFA-F-1', initials: 'LN', location: '', status: 'ACTIVE', rating: null };

function open(state: FarmersFlowState = initialFarmersFlowState(undefined)) {
  return farmersFlowReducer(state, { type: 'openFarmer', farmerId: 'uuid-farmer-1', farmer: legacy });
}

describe('farmers flow navigation', () => {
  it('starts on the list root, on the farmers tab unless told otherwise', () => {
    expect(initialFarmersFlowState(undefined)).toEqual({ stack: [], listTab: 'farmers' });
    expect(initialFarmersFlowState('applications').listTab).toBe('applications');
  });

  it('opening a farmer pushes the detail with the REAL id of the row', () => {
    const s = open();
    expect(s.stack).toEqual([{ name: 'detail', farmerId: 'uuid-farmer-1', farmer: legacy, tab: undefined }]);
    expect(s.listTab).toBe('farmers');
  });

  it('never builds a route without an id (no fixture fallback)', () => {
    const s0 = initialFarmersFlowState(undefined);
    expect(farmersFlowReducer(s0, { type: 'openFarmer', farmerId: '', farmer: legacy })).toBe(s0);
    expect(farmersFlowReducer(s0, { type: 'openApplication', applicationId: '' })).toBe(s0);
  });

  it('edit returns to the detail, on the tab the edit was opened from', () => {
    let s = open();
    s = farmersFlowReducer(s, { type: 'detailTab', tab: 'KYC' });
    s = farmersFlowReducer(s, { type: 'push', route: { name: 'edit', farmerId: 'uuid-farmer-1', tab: 'KYC' } });
    s = farmersFlowReducer(s, { type: 'edited', tab: 'KYC' });
    expect(s.stack).toEqual([{ name: 'detail', farmerId: 'uuid-farmer-1', farmer: legacy, tab: 'KYC' }]);
  });

  it('back pops one screen and is a no-op on the root (the host owns leaving the flow)', () => {
    const s = open();
    expect(farmersFlowReducer(s, { type: 'back' }).stack).toEqual([]);
    const root = initialFarmersFlowState(undefined);
    expect(farmersFlowReducer(root, { type: 'back' })).toBe(root);
  });

  it('application -> reject -> decided returns below the review, on the applications tab', () => {
    let s = farmersFlowReducer(initialFarmersFlowState(undefined), { type: 'openApplication', applicationId: 'uuid-app-9' });
    expect(s.listTab).toBe('applications');
    expect(s.stack).toEqual([{ name: 'application', applicationId: 'uuid-app-9' }]);
    s = farmersFlowReducer(s, { type: 'push', route: { name: 'reject', applicationId: 'uuid-app-9' } });
    s = farmersFlowReducer(s, { type: 'decided' });
    expect(s.stack).toEqual([]);
    expect(s.listTab).toBe('applications');
  });
});

describe('farmers flow gates (codes only, fail closed)', () => {
  it('the entry needs farmer.profile.view_all; no can = no entry', () => {
    expect(canOpenFarmers(undefined)).toBe(false);
    expect(canOpenFarmers(makeCan([]))).toBe(false);
    expect(canOpenFarmers(makeCan(['farmer.rating.view']))).toBe(false);
    expect(canOpenFarmers(makeCan(['farmer.profile.view_all']))).toBe(true);
  });

  it('a warehouse-admin-like grant (view_all + rating.view) gets map and scorecard, not KYC or certification', () => {
    const s = farmersFlowSatellites(makeCan(['farmer.profile.view_all', 'farmer.rating.view']));
    expect(s).toEqual({ farmMap: true, kycReview: false, scorecard: true, certVerification: false, complianceTiers: true });
  });

  it('no satellite opens without view_all, whatever else is held', () => {
    const s = farmersFlowSatellites(makeCan(['farmer.document.view', 'farmer.rating.view', 'certification.view']));
    expect(Object.values(s).every((v) => v === false)).toBe(true);
    expect(Object.values(farmersFlowSatellites(undefined)).every((v) => v === false)).toBe(true);
  });
});
