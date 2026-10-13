import { z } from 'zod';
import type { Money } from '@tohfa/shared-types';
import {
  orderStatuses,
  salesChannels,
  type OrderStatus,
  type SalesChannel,
  type FulfillmentType,
  type DeliverySlot,
  type ProduceGrade,
} from './orders.schema.js';
import { decodeAdminOrderCursor } from './fulfilment.cursor.js';

export const adminOrdersQuerySchema = z.object({
  // Opaque keyset cursor (fulfilment.cursor.ts); anything this endpoint did not produce is 422.
  cursor: z
    .string()
    .refine((raw) => decodeAdminOrderCursor(raw) !== null, { message: 'Invalid cursor.' })
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(orderStatuses).optional(),
  warehouseId: z.string().uuid().optional(),
  channel: z.enum(salesChannels).optional(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;

export const assignWarehouseSchema = z.object({
  warehouseId: z.string().uuid(),
  reason: z.string().max(300).optional(),
});
export type AssignWarehouseRequest = z.infer<typeof assignWarehouseSchema>;

export const packOrderSchema = z.object({
  packedLines: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        fulfilledQtyKg: z.string().regex(/^[0-9]{1,9}(\.[0-9]{1,3})?$/),
      }),
    )
    .optional(),
});
export type PackOrderRequest = z.infer<typeof packOrderSchema>;

export const dispatchOrderSchema = z.object({
  vehicleNumber: z.string().max(20).optional(),
  deliveryPartnerId: z.string().uuid().optional(),
  expectedArrival: z.string().datetime().optional(),
});
export type DispatchOrderRequest = z.infer<typeof dispatchOrderSchema>;

export const verifyOtpSchema = z.object({
  otp: z.string().regex(/^[0-9]{4}$/, 'OTP must be 4 digits'),
  podPhotoUrl: z.string().url().optional(),
});
export type VerifyOtpRequest = z.infer<typeof verifyOtpSchema>;

export const orderTrackingEventSchema = z.object({
  id: z.string().optional(),
  status: z.enum(orderStatuses),
  at: z.string(),
  note: z.string().nullable().optional(),
});
export type OrderTrackingEvent = z.infer<typeof orderTrackingEventSchema>;

export const orderTrackingSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(orderStatuses),
  otpRequired: z.boolean(),
  estimatedArrival: z.string().nullable().optional(),
  events: z.array(orderTrackingEventSchema),
});
export type OrderTracking = z.infer<typeof orderTrackingSchema>;

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  channel: SalesChannel;
  fulfillmentType: FulfillmentType;
  warehouseId: string;
  itemCount: number;
  totalAmount: Money;
  paymentStatus: string;
  deliveryDate: string | null;
  placedAt: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  subtotal: Money;
  deliveryFee: Money;
  discount: Money;
  gstAmount: Money;
  deliverySlot: DeliverySlot | null;
  deliveryAddressId: string | null;
  otpRequired: boolean;
  cancellationReason: string | null;
  deliveredAt: string | null;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    grade: ProduceGrade;
    qtyKg: string;
    fulfilledQtyKg?: string;
    unitPrice: Money;
    gstRate?: number;
    gstAmount?: Money;
    lineTotal: Money;
  }>;
}

// ---------------------------------------------------------------------------
// GET /admin/orders/{orderId} — general admin order detail (BR-99).
//
// Strict (allow-list) response schema matching docs/openapi.yaml `AdminOrderDetail`. Every object
// is `.strict()` so an extra key at any depth (a farmer id, a batch id, the OTP hash) fails the
// parse in the service instead of reaching the wire (BR-16, BR-20, BR-90).
// The enums are the database values (any channel, including DIRECT); they are declared here rather
// than reusing `salesChannels` / `fulfillmentTypes`, which predate DIRECT and carry legacy aliases.
// ---------------------------------------------------------------------------
export const adminOrderChannels = ['ONLINE', 'DIRECT', 'MARKET', 'HORECA', 'B2B'] as const;
export type AdminOrderChannel = (typeof adminOrderChannels)[number];
export const adminOrderStatuses = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PACKED',
  'DISPATCHED',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'PICKED_UP',
  'CANCELLED',
  'RETURNED',
] as const;
export type AdminOrderStatus = (typeof adminOrderStatuses)[number];
export const adminOrderFulfilmentTypes = ['PICKUP', 'DELIVERY'] as const;
export type AdminOrderFulfilmentType = (typeof adminOrderFulfilmentTypes)[number];
export const adminOrderPaymentMethods = ['WALLET', 'UPI', 'CARD', 'NETBANKING', 'CASH'] as const;
export type AdminOrderPaymentMethod = (typeof adminOrderPaymentMethods)[number];
export const adminOrderPaymentStatuses = ['PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'FAILED'] as const;
export type AdminOrderPaymentStatus = (typeof adminOrderPaymentStatuses)[number];
export const adminOrderInvoiceStatuses = ['DRAFT', 'ISSUED', 'CANCELLED', 'CREDIT_NOTED'] as const;
export type AdminOrderInvoiceStatus = (typeof adminOrderInvoiceStatuses)[number];

const moneyString = z.string().regex(/^-?[0-9]{1,10}\.[0-9]{2}$/);
const qtyKgString = z.string().regex(/^[0-9]{1,9}\.[0-9]{3}$/);
const isoInstant = z.string().datetime({ offset: true });
const maskedMobile = z.string().regex(/^\*+[0-9]{0,4}$/);

export const adminOrderIdParams = z.object({ orderId: z.string().uuid() });

export const adminOrderDetailResponse = z
  .object({
    id: z.string().uuid(),
    orderNumber: z.string(),
    channel: z.enum(adminOrderChannels),
    status: z.enum(adminOrderStatuses),
    fulfilmentType: z.enum(adminOrderFulfilmentTypes),
    paymentMethod: z.enum(adminOrderPaymentMethods),
    paymentStatus: z.enum(adminOrderPaymentStatuses),
    warehouse: z.object({ id: z.string().uuid(), name: z.string() }).strict(),
    buyer: z
      .object({
        kind: z.enum(['CUSTOMER', 'WALK_IN']),
        customerId: z.string().uuid().nullable(),
        customerCode: z.string().nullable(),
        name: z.string(),
        mobileMasked: maskedMobile.nullable(),
      })
      .strict(),
    items: z.array(
      z
        .object({
          productId: z.string().uuid(),
          name: z.string(),
          grade: z.enum(['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT']),
          qtyKg: qtyKgString,
          unitPrice: moneyString,
          gstRate: z.string().regex(/^[0-9]{1,3}\.[0-9]{2}$/),
          gstAmount: moneyString,
          lineTotal: moneyString,
        })
        .strict(),
    ),
    totals: z
      .object({
        subtotal: moneyString,
        deliveryFee: moneyString,
        discount: moneyString,
        gst: moneyString,
        total: moneyString,
      })
      .strict(),
    invoice: z
      .object({ id: z.string().uuid(), invoiceNumber: z.string(), status: z.enum(adminOrderInvoiceStatuses) })
      .strict()
      .nullable(),
    fulfilment: z
      .object({
        deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
        deliverySlot: z.enum(['MORNING_8_12', 'AFTERNOON_12_4', 'EVENING_4_8']).nullable(),
        otpRequired: z.boolean(),
        otpVerifiedAt: isoInstant.nullable(),
      })
      .strict(),
    timeline: z.array(
      z
        .object({
          fromStatus: z.enum(adminOrderStatuses).nullable(),
          toStatus: z.enum(adminOrderStatuses),
          at: isoInstant,
        })
        .strict(),
    ),
    placedAt: isoInstant,
    packedAt: isoInstant.nullable(),
    completedAt: isoInstant.nullable(),
    cancelledAt: isoInstant.nullable(),
  })
  .strict();
export type AdminOrderDetailResponse = z.infer<typeof adminOrderDetailResponse>;
