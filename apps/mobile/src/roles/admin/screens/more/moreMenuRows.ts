/**
 * The shared admin "More" menu: one row table for every admin role, and the
 * pure rule that decides which rows a given user sees.
 *
 * The design (origin/tofhafarmfin-rbac AdminMoreMenuScreen) kept two row lists
 * and picked one by role name. Here there is one list, and each row is gated
 * by a docs/rbac.json code instead, so which rows a user sees follows the
 * permissions /auth/me returns rather than a role string baked into the app.
 * This only decides what is worth rendering; every screen behind a row is
 * authorised again on the server (root CLAUDE.md 2.1).
 *
 * No React and no react-native import, so the rule is unit-testable in plain
 * Node (tests/more_menu_rows.test.ts).
 */
import type { Can } from '../../permissions/can';
import type { TranslationKey } from '../../i18n';

export type MoreRowId =
  | 'farmers'
  | 'produce'
  | 'purchase_sales'
  | 'audit'
  | 'inputs'
  | 'pricing'
  | 'disputes'
  | 'allocation'
  | 'sales_orders'
  | 'customers'
  | 'reports'
  | 'workforce'
  | 'staff'
  | 'community'
  | 'switch_role'
  | 'notifications'
  | 'settings'
  | 'logout';

/**
 * - `code`: needs `can(code)`.
 * - `noCode`: the module has no rbac.json code yet. Fails closed: the row
 *   stays hidden even when a handler is passed, until a code is added here
 *   (a row with no server permission behind it would show to every role).
 * - `switchRole`: needs the host's `canSwitchRole` (it knows from /auth/me
 *   whether the user holds more than one role).
 * - `always`: settings and logout, which every signed-in admin gets.
 */
export type MoreRowGate =
  | { kind: 'code'; code: string }
  | { kind: 'noCode' }
  | { kind: 'switchRole' }
  | { kind: 'always' };

export interface MoreRowDef {
  id: MoreRowId;
  labelKey: TranslationKey;
  gate: MoreRowGate;
}

const code = (c: string): MoreRowGate => ({ kind: 'code', code: c });

/** Display order: the design's Tohfa list, with its Farmer-Admin-only rows (Disputes, Switch Role) inserted. */
export const MORE_ROWS: readonly MoreRowDef[] = [
  { id: 'farmers', labelKey: 'moreMenu.row.farmers', gate: code('farmer.profile.view_all') },
  { id: 'produce', labelKey: 'moreMenu.row.produce', gate: code('produce.calendar.view_consolidated') },
  { id: 'purchase_sales', labelKey: 'moreMenu.row.purchase_sales', gate: code('purchase.order.view') },
  { id: 'audit', labelKey: 'moreMenu.row.audit', gate: code('audit.view') },
  { id: 'inputs', labelKey: 'moreMenu.row.inputs', gate: code('inputs.catalog.manage') },
  { id: 'pricing', labelKey: 'moreMenu.row.pricing', gate: code('pricing.fair_price.view') },
  { id: 'disputes', labelKey: 'moreMenu.row.disputes', gate: code('dispute.farmer.mediate') },
  { id: 'allocation', labelKey: 'moreMenu.row.allocation', gate: code('allocation.dashboard.view') },
  { id: 'sales_orders', labelKey: 'moreMenu.row.sales_orders', gate: code('order.list.view_all') },
  { id: 'customers', labelKey: 'moreMenu.row.customers', gate: code('customer.list.view') },
  { id: 'reports', labelKey: 'moreMenu.row.reports', gate: code('report.export.file') },
  { id: 'workforce', labelKey: 'moreMenu.row.workforce', gate: { kind: 'noCode' } },
  { id: 'staff', labelKey: 'moreMenu.row.staff', gate: code('admin.staff.list_view') },
  { id: 'community', labelKey: 'moreMenu.row.community', gate: code('farmer.learning.view') },
  { id: 'switch_role', labelKey: 'moreMenu.row.switch_role', gate: { kind: 'switchRole' } },
  { id: 'notifications', labelKey: 'moreMenu.row.notifications', gate: code('notification.own.view') },
  { id: 'settings', labelKey: 'moreMenu.row.settings', gate: { kind: 'always' } },
  { id: 'logout', labelKey: 'moreMenu.row.logout', gate: { kind: 'always' } },
];

export type MoreRowHandlers = Partial<Record<MoreRowId, () => void>>;

export interface MoreRowVisibilityInput {
  /** Missing `can` denies every code-gated row (fail closed). */
  can?: Can | undefined;
  handlers: MoreRowHandlers;
  hiddenRows?: readonly MoreRowId[] | undefined;
  canSwitchRole?: boolean | undefined;
  onLogout?: (() => void) | undefined;
}

function hasOpener(id: MoreRowId, input: MoreRowVisibilityInput): boolean {
  const opener = id === 'logout' ? input.onLogout : input.handlers[id];
  return typeof opener === 'function';
}

function gatePasses(gate: MoreRowGate, input: MoreRowVisibilityInput): boolean {
  switch (gate.kind) {
    case 'code':
      return input.can ? input.can(gate.code) : false;
    case 'switchRole':
      return input.canSwitchRole === true;
    case 'always':
      return true;
    case 'noCode':
      return false;
  }
}

/**
 * The rows to render, in display order. A row shows when its gate passes
 * and the host did not hide it. No handler → the row is still shown; the
 * screen toasts "Not available yet" on press (owner rule: never hide a
 * design element just because its destination is not built yet).
 * Settings and Logout are always shown; Switch Role needs canSwitchRole.
 */
export function visibleMoreRows(input: MoreRowVisibilityInput): MoreRowId[] {
  const hidden = new Set(input.hiddenRows ?? []);
  return MORE_ROWS.filter((row) => {
    if (row.gate.kind === 'always') return true;
    // No `can` means /auth/me has not answered: nothing but settings and
    // logout, not even Switch Role, until it has.
    if (!input.can) return false;
    if (row.gate.kind === 'switchRole') return input.canSwitchRole === true && !hidden.has(row.id);
    return gatePasses(row.gate, input) && !hidden.has(row.id);
  }).map((row) => row.id);
}

/** True when the host supplied a real opener for this row. */
export function moreRowHasOpener(id: MoreRowId, input: MoreRowVisibilityInput): boolean {
  return hasOpener(id, input);
}

export function moreRowDef(id: MoreRowId): MoreRowDef {
  const row = MORE_ROWS.find((r) => r.id === id);
  if (!row) throw new Error(`Unknown More row: ${id}`);
  return row;
}
