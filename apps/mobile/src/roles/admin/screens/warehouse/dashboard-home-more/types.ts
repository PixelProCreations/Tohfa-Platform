/** Types for the shared warehouse More menu. */

/** One row of the More menu. `id` is also the key the permission gate in MoreScreen looks up. */
export interface MoreOptionItem {
  id: string;
  title: string;
  subtitle: string;
  iconType:
    | 'orders'
    | 'sales'
    | 'customers'
    | 'wallet'
    | 'billing'
    | 'returns'
    | 'finance'
    | 'reports'
    | 'notifications'
    | 'staff'
    | 'attendance'
    | 'profile'
    | 'settings'
    | 'warehouse_operations'
    | 'help';
}

/** A titled card of More menu rows. */
export interface OptionGroup {
  id: string;
  title: string;
  items: MoreOptionItem[];
}
