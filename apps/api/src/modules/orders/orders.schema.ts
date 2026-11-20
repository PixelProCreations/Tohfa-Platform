import { z } from 'zod';
import type { Money } from '@tohfa/shared-types';
import type { CartResponse } from '../cart/cart.schema.js';

const moneySchema = z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/);
const quantitySchema = z.string().regex(/^[0-9]{1,9}(\.[0-9]{1,3})?$/);

export const produceGrades = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'] as const;
export type ProduceGrade = (typeof produceGrades)[number];
export const gradeSchema = z.enum(produceGrades);

export const fulfillmentTypes = [
  'PICKUP',
  'HOME_DELIVERY',
  'DELIVERY',
  'WAREHOUSE_PICKUP',
] as const;
export type FulfillmentType = (typeof fulfillmentTypes)[number];

export const deliverySlots = [
  'MORNING_8_12',
  'AFTERNOON_12_4',
  'EVENING_4_8',
] as const;
export type DeliverySlot = (typeof deliverySlots)[number];

export const orderStatuses = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PACKED',
  'READY_FOR_PICKUP',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'PICKED_UP',
  // No COMPLETED: it is not in the order_status DB enum (docs/openapi.yaml OrderStatus).
  'CANCELLED',
  'RETURNED',
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const paymentStatuses = [
  'PENDING',
  'PAID',
  'PARTIALLY_PAID',
  'REFUNDED',
  'FAILED',
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

/** docs/openapi.yaml SalesChannel. DIRECT is the at-counter sale (BR-85, migration 0059). */
export const salesChannels = ['ONLINE', 'MARKET', 'HORECA', 'B2B', 'DIRECT'] as const;
export type SalesChannel = (typeof salesChannels)[number];

export const paymentMethods = [
  'WALLET',
  'CASH',
  'NETBANKING',
  'UPI',
  'CARD',
] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const checkoutRequestSchema = z.object({
  fulfillmentType: z.enum(fulfillmentTypes).default('PICKUP'),
  warehouseId: z.string().uuid(),
  deliveryAddressId: z.string().uuid().nullable().optional(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  deliverySlot: z.enum(deliverySlots).optional(),
  paymentMethod: z.enum(paymentMethods).default('WALLET'),
  notes: z.string().max(300).optional(),
});
export type CheckoutRequest = {
  fulfillmentType: FulfillmentType;
  warehouseId: string;
  deliveryAddressId?: string | null | undefined;
  deliveryDate?: string | undefined;
  deliverySlot?: DeliverySlot | undefined;
  paymentMethod: PaymentMethod;
  notes?: string | undefined;
};

// ---------------------------------------------------------------------------
// POST /v1/orders/quote (BR-200): the checkout body; nothing is reserved, debited or booked.
// ---------------------------------------------------------------------------
export const quoteRequestSchema = checkoutRequestSchema;
export type QuoteRequest = CheckoutRequest;

export interface QuoteSlotInfo {
  date: string;
  slot: DeliverySlot;
  label: string;
  startsAt: string;
  cutoff: string;
  cutoffPassed: boolean;
  capacity: number | null;
  booked: number;
  available: number | null;
  bookable: boolean;
}

export interface QuoteResponse {
  fulfillmentType: FulfillmentType;
  warehouseId: string;
  cartId: string;
  cartStatus: string;
  lockExpiresAt: string | null;
  /** BR-22: true when checkout would be refused CART_LOCK_EXPIRED right now. */
  lockExpired: boolean;
  lines: OrderItemResponse[];
  itemCount: number;
  subtotal: Money;
  deliveryFee: Money;
  handlingFee: Money;
  /** GST rate in basis points of a percent (5% -> 500), from system_config (BR-98). */
  gstRateBasisPoints: number;
  gstAmount: Money;
  discount: Money;
  totalAmount: Money;
  freeDeliveryThreshold: Money;
  walletBalance: Money;
  walletSufficient: boolean;
  /** totalAmount - walletBalance when insufficient, else 0.00 (same as the BR-192 problem member). */
  shortfall: Money;
  slot: QuoteSlotInfo | null;
}

export const orderItemResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  name: z.string(),
  grade: gradeSchema,
  qtyKg: quantitySchema,
  unitPrice: moneySchema,
  lineTotal: moneySchema,
});
export type OrderItemResponse = {
  id: string;
  productId: string;
  name: string;
  grade: ProduceGrade;
  qtyKg: string;
  unitPrice: Money;
  lineTotal: Money;
};

/** BR-195: catalog name + allow-listed CDN image; never any farm information. */
export const orderThumbnailSchema = z.object({ productName: z.string(), imageUrl: z.string().url() });
export type OrderThumbnail = { productName: string; imageUrl: string };

export const orderSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  status: z.enum(orderStatuses),
  channel: z.enum(salesChannels),
  fulfillmentType: z.enum(fulfillmentTypes),
  warehouseId: z.string().uuid(),
  itemCount: z.number().int(),
  thumbnails: z.array(orderThumbnailSchema).max(3),
  totalAmount: moneySchema,
  paymentStatus: z.enum(paymentStatuses),
  deliveryDate: z.string().nullable().optional(),
  placedAt: z.string(),
});
export type OrderSummaryResponse = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  channel: SalesChannel;
  fulfillmentType: FulfillmentType;
  warehouseId: string;
  itemCount: number;
  thumbnails: OrderThumbnail[];
  totalAmount: Money;
  paymentStatus: PaymentStatus;
  deliveryDate?: string | null | undefined;
  placedAt: string;
};

export const orderResponseSchema = orderSummaryResponseSchema.extend({
  items: z.array(orderItemResponseSchema),
  subtotal: moneySchema,
  deliveryFee: moneySchema.optional(),
  handlingFee: moneySchema.optional(),
  discount: moneySchema.optional(),
  gstAmount: moneySchema.optional(),
  deliveryAddressId: z.string().uuid().nullable().optional(),
  deliverySlot: z.enum(deliverySlots).nullable().optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  paymentMethodLabel: z.string().optional(),
  pickupCode: z.string().nullable().optional(),
  pickupQr: z.object({ payload: z.string() }).nullable().optional(),
});
export type OrderResponse = OrderSummaryResponse & {
  items: OrderItemResponse[];
  subtotal: Money;
  deliveryFee?: Money | undefined;
  /** BR-200. */
  handlingFee?: Money | undefined;
  discount?: Money | undefined;
  gstAmount?: Money | undefined;
  deliveryAddressId?: string | null | undefined;
  deliverySlot?: DeliverySlot | null | undefined;
  /** BR-182. */
  paymentMethod?: PaymentMethod | undefined;
  paymentMethodLabel?: string | undefined;
  pickupCode?: string | null | undefined;
  /** BR-194: PICKUP orders only; order number + pickup code, HMAC-signed. */
  pickupQr?: { payload: string } | null | undefined;
};

export const listOrdersQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(orderStatuses).optional(),
});
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const orderIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type OrderIdParam = z.infer<typeof orderIdParamSchema>;

// ---------------------------------------------------------------------------
// POST /v1/orders/:id/reorder (BR-162)
// ---------------------------------------------------------------------------
/** Why a past line could not be put back in the cart. Mirrors the cart refusal codes. */
export const reorderUnavailableReasons = [
  'OUT_OF_STOCK',
  'DELISTED',
  'INSUFFICIENT_ALLOCATION',
] as const;
export type ReorderUnavailableReason = (typeof reorderUnavailableReasons)[number];

export interface ReorderUnavailableItem {
  productId: string;
  name: string;
  grade: ProduceGrade;
  qtyKg: string;
  reason: ReorderUnavailableReason;
}

export interface ReorderResponse {
  /** The customer's active cart after the rebuild (cart.schema.ts CartResponse). */
  cart: CartResponse;
  addedCount: number;
  unavailable: ReorderUnavailableItem[];
}
