/**
 * Navigation state for the Tohfa Admin shell (TohfaAdminDashboardScreen):
 * which bottom tab is active and which full-screen sub-flow, if any, is open
 * on top of it. Pure (no React, no react-native) so it is unit-tested on its
 * own (tests/tohfa_shell_routes.test.ts).
 *
 * Why a sub-flow remembers the tab it was opened from: every sub-flow's onBack
 * and the Android back button return to that tab, never to a fixed one. The
 * state keeps `tab` untouched while a flow is open, so "close the flow" is
 * simply `flow: null`.
 */
import type { FarmersFlowEntry } from '../farmers/FarmersFlow';

/** The design's five bottom tabs (origin/tofhafarmfin-rbac), in its order. */
export type TohfaShellTab = 'Home' | 'WorkQueue' | 'Inventory' | 'Finance' | 'More';

export const TOHFA_SHELL_TABS: readonly TohfaShellTab[] = ['Home', 'WorkQueue', 'Inventory', 'Finance', 'More'];

/**
 * Tabs the bar does not draw. Empty: owner decision 2026-11-11 shows Work
 * Queue (Home · Work Queue · Inventory · Finance · More). Kept as one list so
 * hiding a tab again is one edit.
 */
export const TOHFA_HIDDEN_TABS: readonly TohfaShellTab[] = [];

export function visibleTohfaTabs(hidden: readonly TohfaShellTab[] = TOHFA_HIDDEN_TABS): TohfaShellTab[] {
  return TOHFA_SHELL_TABS.filter((tab) => !hidden.includes(tab));
}

/** The tab values the old five-tab shell accepted; callers (App.tsx) still pass them. */
export type LegacyTohfaAdminTab = 'Dashboard' | 'Farmers' | 'Sales' | 'Reports' | 'Profile';

/** Full-screen sub-flows the shell can open. Each one hides the tab bar. */
export type TohfaSubFlow =
  | { kind: 'farmers'; entry: FarmersFlowEntry }
  | { kind: 'pricing' }
  | { kind: 'notifications' }
  | { kind: 'settings' }
  | { kind: 'transfers' }
  | { kind: 'wallet' }
  | { kind: 'receiving' }
  /** M3S02 = stock list (the design's "stock ledger" link), M3S10 = stock verification. */
  | { kind: 'inventory'; screen: 'M3S02' | 'M3S07' | 'M3S10'; warehouseId?: string | undefined }
  | { kind: 'sales' }
  | { kind: 'finance'; screen: 'Revenue' | 'Expenses' | 'FinanceHistory' }
  | { kind: 'returns' }
  | { kind: 'customers' }
  /** Customers Management (design "Screen 1"); the More menu's Customers row opens this. */
  | { kind: 'customersManagement' }
  | { kind: 'reports' }
  /** Staff list ('Staff') or Add Staff ('EditStaffProfile' with no staff = create). */
  | { kind: 'staff'; screen: 'Staff' | 'EditStaffProfile' }
  /** Billing & invoices hub. */
  | { kind: 'billing' }
  /** Orders module (Work Queue order tasks). */
  | { kind: 'orders' }
  /** Listing approval queue ("Produce list" Home quick action). */
  | { kind: 'listings' }
  /** Purchase orders list / detail / history. */
  | { kind: 'purchaseOrders' }
  /** Produce Calendar and Crop Data (screens/produce); the More menu's Produce row opens this. */
  | { kind: 'produce' }
  /** Audit Management (screens/audits/AuditManagementFlow); the More menu's Audit row opens this. */
  | { kind: 'audits' }
  /** Inputs & Pest Management (screens/inputs/InputsPestManagementFlow); the More menu's Inputs row opens this. */
  | { kind: 'inputs' };

export interface TohfaShellState {
  tab: TohfaShellTab;
  flow: TohfaSubFlow | null;
}

export type TohfaShellAction =
  | { type: 'selectTab'; tab: TohfaShellTab }
  | { type: 'open'; flow: TohfaSubFlow }
  | { type: 'closeFlow' }
  | { type: 'back' };

/** A tab the bar does not draw falls back to Home, so a hidden tab is never stranded on screen. */
function shownTab(tab: TohfaShellTab, hidden: readonly TohfaShellTab[] = TOHFA_HIDDEN_TABS): TohfaShellTab {
  return hidden.includes(tab) ? 'Home' : tab;
}

/**
 * The state for an `initialTab` prop, old or new value:
 *   undefined | 'Dashboard' | 'Home'               -> Home
 *   'WorkQueue' | 'Inventory' | 'Finance' | 'More' -> that tab (Home if hidden)
 *   'Farmers'  -> More tab with the Farmers flow open (the design groups Farmers under More)
 *   'Reports'  -> More tab with the Reports flow open (More's Reports row)
 *   'Profile'  -> More tab with the Settings hub open (More's Settings row)
 *   'Sales'    -> Finance tab with the sales-direct Sales flow open (Finance hub's Purchase & Sales)
 */
export function initialTohfaShellState(initialTab?: TohfaShellTab | LegacyTohfaAdminTab | undefined): TohfaShellState {
  switch (initialTab) {
    case 'Farmers':
      return { tab: 'More', flow: { kind: 'farmers', entry: 'list' } };
    case 'Reports':
      return { tab: 'More', flow: { kind: 'reports' } };
    case 'Profile':
      return { tab: 'More', flow: { kind: 'settings' } };
    case 'Sales':
      return { tab: 'Finance', flow: { kind: 'sales' } };
    case 'Inventory':
    case 'Finance':
    case 'More':
    case 'WorkQueue':
      return { tab: shownTab(initialTab), flow: null };
    default:
      return { tab: 'Home', flow: null };
  }
}

/**
 * What Android back does, or null when the shell does not handle it (Home with
 * nothing open: the press falls through to the host app, as before).
 *   sub-flow open -> close it, back on the tab it was opened from
 *   other tab     -> Home
 */
export function tohfaShellBack(state: TohfaShellState): TohfaShellState | null {
  if (state.flow !== null) return { tab: state.tab, flow: null };
  if (state.tab !== 'Home') return { tab: 'Home', flow: null };
  return null;
}

export function tohfaShellReducer(state: TohfaShellState, action: TohfaShellAction): TohfaShellState {
  switch (action.type) {
    case 'selectTab':
      return { tab: shownTab(action.tab), flow: null };
    case 'open':
      return { tab: state.tab, flow: action.flow };
    case 'closeFlow':
      return state.flow === null ? state : { tab: state.tab, flow: null };
    case 'back':
      return tohfaShellBack(state) ?? state;
    default:
      return state;
  }
}

/**
 * The role the More menu's "Switch role" row hands to the host: the first of
 * the user's role codes that is not the one this shell is showing. Undefined
 * when the user holds only one distinct role, so the row is not drawn.
 */
export function tohfaSwitchRoleTarget(roleCodes: readonly string[], current: string | null | undefined): string | undefined {
  const distinct = [...new Set(roleCodes)];
  if (distinct.length < 2) return undefined;
  return distinct.find((code) => code !== current);
}
