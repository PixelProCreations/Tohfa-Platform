/**
 * Navigation state of the shared Farmers flow (../FarmersFlow.tsx), kept pure
 * so plain-Node vitest pins it (tests/farmersFlow_nav.test.ts).
 *
 * The flow is ONE stack for every admin role that may open Farmers
 * Management (Super, Tohfa, Farmer Admin, Main and Sub warehouse admins).
 * Which role sees what is decided by permission codes only (`can`), never by
 * a role name; which farmers a caller sees is the server's job (BR-108a).
 *
 * Every route carries the REAL id the server returned for the tapped row (the
 * farmer uuid or the application uuid). There is no fixture fallback: a route
 * without an id cannot be built.
 */
import type { Can } from '../../../permissions/can';
import type { FarmerDetailTabType } from '../detail/model';
import type { FarmersMainTab } from '../list/farmersListLogic';
import type { FarmerListItem } from '../list/legacyFarmerListItem';

/** Where the flow starts: the Farmers | Applications list, or the pending-applications queue. */
export type FarmersFlowEntry = 'list' | 'pendingApplications';

/**
 * One screen above the root. `farmer` on the farmer routes is the legacy
 * item the list built from the live row (real id, name, code; nothing
 * invented); the satellite screens of other modules still take that shape.
 */
export type FarmersFlowRoute =
  | { name: 'detail'; farmerId: string; farmer: FarmerListItem; tab: FarmerDetailTabType | undefined }
  | { name: 'edit'; farmerId: string; tab: FarmerDetailTabType | undefined }
  | { name: 'farmMap'; farmer: FarmerListItem }
  | { name: 'kycReview'; farmer: FarmerListItem }
  | { name: 'scorecard'; farmer: FarmerListItem }
  | { name: 'certVerification'; farmer: FarmerListItem }
  | { name: 'complianceTiers' }
  | { name: 'application'; applicationId: string }
  | { name: 'reject'; applicationId: string };

export interface FarmersFlowState {
  /** Screens above the root, last = visible. Empty = the root (list or queue). */
  stack: readonly FarmersFlowRoute[];
  /** The list tab to show when the list is (re)mounted: the tab the admin left it on. */
  listTab: FarmersMainTab;
}

export type FarmersFlowAction =
  | { type: 'openFarmer'; farmerId: string; farmer: FarmerListItem }
  | { type: 'openApplication'; applicationId: string }
  | { type: 'push'; route: FarmersFlowRoute }
  | { type: 'detailTab'; tab: FarmerDetailTabType }
  | { type: 'edited'; tab: FarmerDetailTabType }
  | { type: 'decided' }
  | { type: 'back' };

export function initialFarmersFlowState(initialTab: FarmersMainTab | undefined): FarmersFlowState {
  return { stack: [], listTab: initialTab ?? 'farmers' };
}

function replaceTop(stack: readonly FarmersFlowRoute[], route: FarmersFlowRoute): FarmersFlowRoute[] {
  return [...stack.slice(0, -1), route];
}

export function farmersFlowReducer(state: FarmersFlowState, action: FarmersFlowAction): FarmersFlowState {
  switch (action.type) {
    case 'openFarmer':
      // A farmer card is only on the farmers tab: coming back shows that tab.
      if (action.farmerId === '') return state;
      return {
        listTab: 'farmers',
        stack: [...state.stack, { name: 'detail', farmerId: action.farmerId, farmer: action.farmer, tab: undefined }],
      };
    case 'openApplication':
      if (action.applicationId === '') return state;
      return {
        listTab: 'applications',
        stack: [...state.stack, { name: 'application', applicationId: action.applicationId }],
      };
    case 'push':
      return { ...state, stack: [...state.stack, action.route] };
    case 'detailTab': {
      const top = state.stack[state.stack.length - 1];
      if (top?.name !== 'detail') return state;
      return { ...state, stack: replaceTop(state.stack, { ...top, tab: action.tab }) };
    }
    case 'edited': {
      // Saved: leave the form and reopen the detail on the tab the edit came from.
      const below = state.stack.slice(0, -1);
      const detail = below[below.length - 1];
      if (state.stack[state.stack.length - 1]?.name !== 'edit') return state;
      return detail?.name === 'detail'
        ? { ...state, stack: replaceTop(below, { ...detail, tab: action.tab }) }
        : { ...state, stack: below };
    }
    case 'decided': {
      // Rejected: the application left the queue, so return to the screen the review was opened from.
      const at = state.stack.findIndex((r) => r.name === 'application');
      return at < 0 ? state : { ...state, stack: state.stack.slice(0, at) };
    }
    case 'back':
      return state.stack.length === 0 ? state : { ...state, stack: state.stack.slice(0, -1) };
    default:
      return state;
  }
}

/** The one code that opens Farmers Management from any host (rbac.json: all five admin roles). */
export const FARMERS_ENTRY_CODE = 'farmer.profile.view_all';

/** True when a host may draw its Farmers entry (tab, tile or More row). Fail closed. */
export function canOpenFarmers(can: Can | undefined): boolean {
  return can !== undefined && can(FARMERS_ENTRY_CODE) === true;
}

/**
 * Which satellite screens (other modules, still on the legacy item) the flow
 * may open from the farmer detail. Each is code-gated so a role without the
 * grant never gets the button (the detail hides a button whose handler is
 * missing). Rating edit is not here: BR-06e removed it.
 */
export interface FarmersFlowSatellites {
  farmMap: boolean;
  kycReview: boolean;
  scorecard: boolean;
  certVerification: boolean;
  complianceTiers: boolean;
}

export function farmersFlowSatellites(can: Can | undefined): FarmersFlowSatellites {
  const has = (code: string) => can !== undefined && can(code) === true;
  const view = has(FARMERS_ENTRY_CODE);
  return {
    farmMap: view,
    kycReview: view && has('farmer.document.view'),
    scorecard: view && has('farmer.rating.view'),
    certVerification: view && has('farmer.document.view') && has('certification.view'),
    complianceTiers: view && has('farmer.rating.view'),
  };
}
