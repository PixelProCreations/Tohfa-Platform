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
import type { WarehouseScope, WarehouseScreenBaseProps } from '../finance-expenses/types';

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

// ─── Live orders (./mappers.ts) ──────────────────────────────────────────────
// Money is integer paise and weight integer grams (roles/admin/money), never
// floats; null means the server sent no figure (or one that is not Money /
// Quantity), which the screens show as "no value", never as zero.

/** What a data screen needs to pick an AsyncState and to refresh. */
export interface OrdersLiveStateProps {
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
}

/** An order status as the screens show it; 'unknown' for a value the app does not know yet. */
export type OrderUiStatus =
  | 'pendingPayment'
  | 'confirmed'
  | 'packed'
  | 'readyForPickup'
  | 'dispatched'
  | 'outForDelivery'
  | 'delivered'
  | 'pickedUp'
  | 'cancelled'
  | 'returned'
  | 'unknown';

/** The badge tone of a status; the screens map it to adminColors. */
export type OrderStatusTone = 'warning' | 'success' | 'danger' | 'info' | 'neutral';

/** Pickup or delivery, whichever spelling the endpoint used (HOME_DELIVERY/DELIVERY, WAREHOUSE_PICKUP/PICKUP). */
export type OrderFulfilment = 'pickup' | 'delivery' | 'unknown';

/** One row of the order queue (GET /admin/orders). The list carries no customer name (BR-101). */
export interface OrderListRow {
  /** The order uuid. */
  id: string;
  orderNumber: string;
  status: OrderUiStatus;
  statusLabel: string;
  tone: OrderStatusTone;
  fulfilment: OrderFulfilment;
  fulfilmentLabel: string;
  itemCount: number | null;
  itemsLabel: string;
  totalPaise: number | null;
  amountLabel: string;
  /** "Today · 10:05 AM". */
  placedLabel: string;
  /** "3 hours ago". */
  placedAgo: string;
  warehouseId: string | null;
}

/** One line of an order (AdminOrderDetail.items). */
export interface OrderLineView {
  key: string;
  name: string;
  gradeLabel: string;
  qtyGrams: number | null;
  /** "2 kg × ₹451.49". */
  qtyDetail: string;
  lineTotalPaise: number | null;
  lineTotalLabel: string;
  /** "Carrot · 0.125 kg", for the packing checklist. */
  checklistLabel: string;
}

/** One status change of the timeline (no actor, no note: the API does not send them). */
export interface OrderTimelineEntry {
  key: string;
  status: OrderUiStatus;
  label: string;
  /** "25 Sep 2026". */
  dayLabel: string;
  /** "Today · 10:05 AM". */
  atLabel: string;
}

export interface OrderTotalsView {
  subtotalPaise: number | null;
  deliveryFeePaise: number | null;
  discountPaise: number | null;
  gstPaise: number | null;
  totalPaise: number | null;
  subtotalLabel: string;
  deliveryFeeLabel: string;
  discountLabel: string;
  gstLabel: string;
  totalLabel: string;
}

/** One order (GET /admin/orders/{orderId}), farm-anonymous and without the OTP (BR-99). */
export interface OrderDetailView {
  id: string;
  orderNumber: string;
  status: OrderUiStatus;
  statusLabel: string;
  tone: OrderStatusTone;
  fulfilment: OrderFulfilment;
  fulfilmentLabel: string;
  warehouseId: string;
  warehouseName: string;
  buyerName: string;
  /** `******3210` as sent (BR-92), or null. */
  buyerMobileMasked: string | null;
  paymentStatusLabel: string;
  paymentMethodLabel: string;
  lines: OrderLineView[];
  itemCount: number;
  /** Sum of the line weights; null when a line has none. */
  totalGrams: number | null;
  totals: OrderTotalsView;
  deliveryDateLabel: string | null;
  /** True while the handover code is set and not yet verified. */
  otpRequired: boolean;
  /** When the handover code was verified, or null. */
  otpVerifiedLabel: string | null;
  timeline: OrderTimelineEntry[];
  placedLabel: string;
  packedLabel: string | null;
  completedLabel: string | null;
}

/** The order task counts the dashboard shows (GET /admin/tasks/summary). */
export interface OrderTaskCounts {
  /** ORDER_PACK: orders CONFIRMED, waiting to be packed. */
  toPack: number;
  /** ORDER_DISPATCH: orders PACKED, waiting to be marked ready. */
  toMarkReady: number;
  /** ORDER_PICKUP_OTP: orders READY_FOR_PICKUP, waiting for the customer. */
  awaitingPickup: number;
}

/** A write on an order: pack, mark ready for pickup (POST .../dispatch), or the OTP handover. */
export type OrderAction = 'pack' | 'markReady' | 'verifyOtp';

/** What the order detail offers next, by status and permission. */
export type OrderNextAction =
  | { kind: 'pack'; screen: 'M5S07'; step: 'packing' }
  | { kind: 'markReady'; screen: 'M5S07'; step: 'confirm' }
  | { kind: 'verifyPickup'; screen: 'M5S11'; step: 'verify' };

/** The Main view's warehouse selector, held by the flow (a Sub scope ignores it). */
export interface OrdersWarehouseSelector {
  /** Warehouses with their uuid ids; none passed means only "All warehouses". */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  selectedWarehouseId?: string | undefined;
  onSelectWarehouse?: ((id: string | undefined) => void) | undefined;
}
