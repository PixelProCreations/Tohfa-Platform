/**
 * Shared types for the warehouse customer-order screens (design module M5).
 *
 * One set of screens serves both warehouse roles. As in finance-expenses, the
 * role difference is carried by `scope` (warehouseId undefined = all
 * warehouses, the Main Warehouse view) and `can` (a docs/rbac.json code check
 * that only decides what to render; the server enforces every action again).
 *
 * Several designed screens used to be separate route keys and are now inline
 * steps of one survivor. The host navigator passes `params.step` through as
 * `initialStep`, so an old deep link still lands on the right step:
 *   M5S06  -> M5S05 step 'shortage'      M5S08  -> M5S07 step 'confirm'
 *   M5S10  -> M5S11 step 'verify'        M5S12  -> M5S11 step 'handover'
 *   M5S14B -> M5S14 step 'confirm'       M5S14C -> M5S14 step 'dispatched'
 *   M5S15B -> M5S15 (expandable event)   M5S16B -> M5S16 step 'submitted'
 */
import type { WarehouseScreenBaseProps } from '../finance-expenses/types';

export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

/** Props every order screen takes: the warehouse base props plus the order in focus. */
export interface OrderScreenBaseProps extends WarehouseScreenBaseProps {
  orderId?: string | undefined;
}

/** StockCheckScreen steps (M5S05 check, then the folded M5S06 shortage). */
export type StockCheckStep = 'check' | 'shortage';

/** PackingScreen steps (M5S07 packing, then the folded M5S08 confirm). */
export type PackingStep = 'packing' | 'confirm';

/** PickupOtpScreen wizard steps (folded M5S10 verify, M5S11 OTP, folded M5S12 handover). */
export type PickupStep = 'verify' | 'otp' | 'handover';

/** DispatchScreen steps (M5S14 dispatch, folded M5S14B confirm, folded M5S14C dispatched). */
export type DispatchStep = 'dispatch' | 'confirm' | 'dispatched';

/** OrderIssueScreen steps (M5S16 form, folded M5S16B submitted). */
export type OrderIssueStep = 'form' | 'submitted';

// ─── Sample data shapes (./fixtures.ts) ──────────────────────────────────────
// The design samples the order screens were built on. They live in fixtures.ts
// so the screens can be moved to live data one at a time.

/** A warehouse offered by the Main all-warehouses selector. */
export interface OrderWarehouseOption {
  id: string;
  name: string;
}

/** The status words the sample order list uses. */
export type SampleOrderStatus = 'Confirmed' | 'Ready for Pickup' | 'Packing' | 'Quantity Issue' | 'Completed';

/** One row of the sample order list (M5S02). */
export interface SampleOrderRow {
  id: string;
  warehouseId: string;
  warehouseName: string;
  customer: string;
  status: SampleOrderStatus;
  items: string;
  amount: string;
  fulfillment: 'Pickup' | 'Delivery';
  time: string;
  action: string;
  /** Route key of the screen that performs `action`. */
  actionScreen: string;
  /** Step inside `actionScreen`, for actions that land on a folded step. */
  actionStep?: string;
}

/** One sample order waiting at the counter (M5S09). */
export interface SampleReadyOrder {
  id: string;
  customer: string;
  items: string;
  amount: string;
  time: string;
  packed: string;
}

/** One event of the sample status timeline (M5S15). */
export interface SampleStatusEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  performedBy: string;
}

/** One line of the sample order detail (M5S04). */
export interface SampleOrderItem {
  name: string;
  grade: string;
  qtyDetail: string;
  price: string;
}

/** The sample order detail (M5S04): keyed off two demo invoice ids, as the old M5S04 did. */
export interface SampleOrderDetail {
  displayDate: string;
  displayCustomer: string;
  displayStatus: string;
  phone: string;
  items: SampleOrderItem[];
  subtotal: string;
  gst: string;
  total: string;
}

/** One row of the sample packing checklist (M5S07). */
export interface SamplePackingItem {
  id: string;
  name: string;
  checked: boolean;
}

/** One warehouse's sample order count (Main dashboard). */
export interface SampleWarehouseOrderCount {
  id: string;
  name: string;
  orders: number;
}
