/**
 * The rows of the shared More menu (./MoreScreen.tsx) and their permission
 * gates. Pure (no React), so plain-Node vitest covers who sees which row
 * (tests/warehouse_management_m15.test.ts). Every title is an i18n key.
 *
 * `can` only decides what is worth rendering; the server re-checks each code
 * when the destination screen loads its data (root CLAUDE.md 2.1).
 */
import type { TranslationKey } from '../../../i18n';
import type { MoreOptionItem, OptionGroup, PermissionCheck } from './types';

/**
 * Menu items whose visibility depends on a docs/rbac.json permission. Items
 * not listed here are shown to every warehouse admin. `staff` is not listed:
 * it is the Staff area, shown only when isAreaAvailable says so (see
 * ../availability.ts and MoreScreen).
 */
const ITEM_PERMISSION: Readonly<Record<string, string>> = {
  finance: 'finance.dashboard.view',
  reports: 'report.export.file',
  // Warehouse Management (design M15) lists every warehouse: MAIN all, SUB none.
  warehouse_management: 'warehouse.all.view',
};

/**
 * Rows only the Main admin (all-warehouses scope) gets. The code alone is not
 * enough: M15 is the Main admin's module, and a Sub scope is one warehouse.
 */
const MAIN_ONLY_ITEMS: ReadonlySet<string> = new Set(['warehouse_management']);

/** True when a row may be drawn for this caller (before the host-destination check). */
export function isMoreItemPermitted(id: string, isMain: boolean, can: PermissionCheck): boolean {
  if (MAIN_ONLY_ITEMS.has(id) && !isMain) return false;
  const code = ITEM_PERMISSION[id];
  return code === undefined || can(code);
}

function item(id: string, iconType: MoreOptionItem['iconType'], titleKey: TranslationKey, subtitleKey: TranslationKey): MoreOptionItem {
  return { id, iconType, titleKey, subtitleKey };
}

export const MORE_OPTION_GROUPS: readonly OptionGroup[] = [
  {
    id: 'operations',
    titleKey: 'more.group.operations',
    items: [
      item('orders', 'orders', 'more.item.orders.title', 'more.item.orders.subtitle'),
      item('sales', 'sales', 'more.item.sales.title', 'more.item.sales.subtitle'),
      item('customers', 'customers', 'more.item.customers.title', 'more.item.customers.subtitle'),
    ],
  },
  {
    id: 'finance_transactions',
    titleKey: 'more.group.financeTransactions',
    items: [
      item('wallet', 'wallet', 'more.item.wallet.title', 'more.item.wallet.subtitle'),
      item('billing', 'billing', 'more.item.billing.title', 'more.item.billing.subtitle'),
      item('returns', 'returns', 'more.item.returns.title', 'more.item.returns.subtitle'),
      item('finance', 'finance', 'more.item.finance.title', 'more.item.finance.subtitle'),
      item('reports', 'reports', 'more.item.reports.title', 'more.item.reports.subtitle'),
      item('notifications', 'notifications', 'more.item.notifications.title', 'more.item.notifications.subtitle'),
      item('staff', 'staff', 'more.item.staff.title', 'more.item.staff.subtitle'),
      item('warehouse_management', 'warehouse_management', 'more.item.warehouseManagement.title', 'more.item.warehouseManagement.subtitle'),
      item('warehouse_operations', 'warehouse_operations', 'more.item.warehouseOperations.title', 'more.item.warehouseOperations.subtitle'),
      item('profile', 'profile', 'more.item.profile.title', 'more.item.profile.subtitle'),
    ],
  },
  {
    id: 'account_settings',
    titleKey: 'more.group.accountSettings',
    items: [item('settings', 'settings', 'more.item.settings.title', 'more.item.settings.subtitle')],
  },
];
