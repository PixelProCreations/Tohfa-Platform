/**
 * SWA Module 6 (Direct / Market sales), write side. Zod schemas for the request and response
 * shapes of docs/openapi.yaml (tag Sales): GET /admin/sales/products, GET /admin/sales/customers/lookup,
 * POST /admin/sales/quote, POST /admin/sales, POST /admin/sales/{saleId}/payments/upi/confirm.
 *
 * Response schemas are `.strict()` on purpose: they are the BR-90 allow-list. A test parses every
 * response with them, so a key that is not documented (a farmerId, a batch's source farmer, a
 * farm name...) fails the test instead of leaking (BR-90a, BR-90b).
 */
import { z } from 'zod';

const UUID = z.string().uuid();

/** Non-negative Money string (docs/openapi.yaml Money, sign excluded for amounts a client sends). */
const MONEY_INPUT_RE = /^[0-9]{1,10}(\.[0-9]{1,2})?$/;
const MONEY_OUTPUT_RE = /^-?[0-9]{1,10}\.[0-9]{2}$/;
/** docs/openapi.yaml Quantity, positive only. */
const QTY_RE = /^[0-9]{1,9}(\.[0-9]{1,3})?$/;
const QTY_OUTPUT_RE = /^[0-9]{1,9}\.[0-9]{3}$/;

export const SALE_CHANNELS = ['DIRECT', 'MARKET'] as const;
export const SALE_CREATE_CHANNELS = ['DIRECT', 'MARKET', 'HORECA', 'B2B'] as const;
export const SALE_PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'WALLET'] as const;
export const GRADES = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'] as const;

export const saleChannel = z.enum(SALE_CHANNELS);
export const saleCreateChannel = z.enum(SALE_CREATE_CHANNELS);
export const salePaymentMethod = z.enum(SALE_PAYMENT_METHODS);
export const grade = z.enum(GRADES);

export type SaleChannel = z.infer<typeof saleChannel>;
export type SaleCreateChannel = z.infer<typeof saleCreateChannel>;
export type SalePaymentMethod = z.infer<typeof salePaymentMethod>;
export type Grade = z.infer<typeof grade>;

const moneyInput = z.string().regex(MONEY_INPUT_RE, 'Must be a non-negative amount with at most 2 decimal places.');
const qtyInput = z
  .string()
  .regex(QTY_RE, 'Must be a weight in kg with at most 3 decimal places.')
  .refine((v) => /[1-9]/.test(v), 'Must be greater than zero.');

export const saleItemRequest = z
  .object({
    productId: UUID,
    grade,
    qtyKg: qtyInput,
  })
  .strict();

const saleItems = z
  .array(saleItemRequest)
  .min(1)
  .max(100)
  .superRefine((items, ctx) => {
    // One line per product and grade: two lines for the same stock would be priced and drawn
    // twice from one availability figure.
    const seen = new Set<string>();
    items.forEach((item, index) => {
      const key = `${item.productId}|${item.grade}`;
      if (seen.has(key)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, 'productId'], message: 'Each product and grade may appear once.' });
      }
      seen.add(key);
    });
  });

/**
 * `warehouseId` is optional and NOT in docs/openapi.yaml SaleQuoteRequest/SaleCreateRequest as
 * delivered; it was added as a spec gap so an `all`-scope actor (Super/TOHFA Admin, no warehouse)
 * can name the counter it sells from. A Sub admin may omit it (their own warehouse is used) and gets
 * 404 for any other (BR-85f).
 */
export const saleQuoteBody = z
  .object({
    channel: saleCreateChannel,
    items: saleItems,
    warehouseId: UUID.optional(),
  })
  .strict();
export type SaleQuoteBody = z.infer<typeof saleQuoteBody>;

export const saleCustomerRef = z.object({ customerId: UUID }).strict();
export const saleWalkIn = z
  .object({
    name: z
      .string()
      .min(1)
      .max(120)
      .refine((v) => v.trim().length > 0, 'Must not be blank.'),
    mobile: z
      .string()
      .regex(/^\+[1-9][0-9]{7,14}$/, 'Must be an E.164 mobile number.')
      .optional(),
  })
  .strict();

export const salePaymentRequest = z
  .object({
    method: salePaymentMethod,
    amountReceived: moneyInput.optional(),
    cardRef: z.string().min(1).max(120).optional(),
  })
  .strict()
  .superRefine((payment, ctx) => {
    // BR-94: CASH records the tender; CARD needs a non-blank manual reference. Both are request
    // shape problems (422, nothing written), unlike PAYMENT_AMOUNT_INSUFFICIENT which needs the total.
    if (payment.method === 'CASH' && payment.amountReceived === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amountReceived'], message: 'Required for a CASH payment.' });
    }
    if (payment.method !== 'CASH' && payment.amountReceived !== undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amountReceived'], message: 'Only a CASH payment carries amountReceived.' });
    }
    if (payment.method === 'CARD' && (payment.cardRef === undefined || payment.cardRef.trim().length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cardRef'], message: 'A non-blank card reference is required for a CARD payment.' });
    }
    if (payment.method !== 'CARD' && payment.cardRef !== undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cardRef'], message: 'Only a CARD payment carries cardRef.' });
    }
  });

export const saleCreateBody = z
  .object({
    channel: saleCreateChannel,
    customer: saleCustomerRef.optional(),
    walkIn: saleWalkIn.optional(),
    items: saleItems,
    expectedTotal: moneyInput,
    payment: salePaymentRequest,
    warehouseId: UUID.optional(),
  })
  .strict()
  .superRefine((body, ctx) => {
    // BR-86e: exactly one buyer identity.
    if ((body.customer === undefined) === (body.walkIn === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customer'],
        message: 'Exactly one of customer or walkIn is required.',
      });
    }
  });
export type SaleCreateBody = z.infer<typeof saleCreateBody>;

export const saleUpiConfirmBody = z
  .object({
    upiTxnRef: z
      .string()
      .min(1)
      .max(120)
      .refine((v) => v.trim().length > 0, 'Must not be blank.'),
  })
  .strict();
export type SaleUpiConfirmBody = z.infer<typeof saleUpiConfirmBody>;

export const saleCancelBody = z
  .object({
    reason: z
      .string()
      .trim()
      .max(300)
      .optional(),
  })
  .strict();
export type SaleCancelBody = z.infer<typeof saleCancelBody>;

export const saleIdParams = z.object({ saleId: UUID }).strict();

export const listSaleProductsQuery = z
  .object({
    channel: saleChannel,
    q: z.string().min(1).max(100).optional(),
    cursor: z.string().min(1).max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    warehouseId: UUID.optional(),
  })
  .strict();
export type ListSaleProductsQuery = z.infer<typeof listSaleProductsQuery>;

/**
 * docs/openapi.yaml has `mobile` and `code`. `q` (name, code or mobile digits) is a spec gap
 * added for the counter search box. Exactly one of the three.
 */
export const customerLookupQuery = z
  .object({
    mobile: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
    code: z.string().min(1).max(40).optional(),
    q: z.string().trim().min(2).max(100).optional(),
  })
  .strict()
  .superRefine((query, ctx) => {
    const given = [query.mobile, query.code, query.q].filter((v) => v !== undefined).length;
    if (given !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mobile'], message: 'Exactly one of mobile, code or q is required.' });
    }
  });
export type CustomerLookupQuery = z.infer<typeof customerLookupQuery>;

// ---------------------------------------------------------------------------
// Responses (allow-lists)
// ---------------------------------------------------------------------------

const moneyOut = z.string().regex(MONEY_OUTPUT_RE);
const qtyOut = z.string().regex(QTY_OUTPUT_RE);
const maskedMobile = z.string().regex(/^\*+[0-9]{0,4}$/);
const isoDate = z.string().datetime({ offset: true });

export const saleLineResponse = z
  .object({
    productId: UUID,
    name: z.string(),
    grade,
    qtyKg: qtyOut,
    unitPrice: moneyOut,
    lineTotal: moneyOut,
  })
  .strict();
export type SaleLine = z.infer<typeof saleLineResponse>;

export const saleTotalsResponse = z
  .object({
    subtotal: moneyOut,
    gst: moneyOut,
    total: moneyOut,
    changeGiven: moneyOut.nullable().optional(),
  })
  .strict();
export type SaleTotals = z.infer<typeof saleTotalsResponse>;

export const saleQuoteResponse = z
  .object({
    channel: saleCreateChannel,
    lines: z.array(saleLineResponse),
    totals: saleTotalsResponse,
    gstRatePercent: z.string().regex(/^[0-9]{1,2}(\.[0-9]{1,2})?$/),
    quotedAt: isoDate,
  })
  .strict();
export type SaleQuote = z.infer<typeof saleQuoteResponse>;

export const saleBuyerResponse = z
  .object({
    kind: z.enum(['CUSTOMER', 'WALK_IN']),
    customerId: UUID.nullable(),
    customerCode: z.string().nullable(),
    name: z.string(),
    mobileMasked: maskedMobile.nullable(),
  })
  .strict();

export const salePaymentResponse = z
  .object({
    method: salePaymentMethod,
    status: z.enum(['PENDING', 'CONFIRMED', 'FAILED', 'REFUND_DUE', 'REFUNDED']),
    amount: moneyOut,
    amountReceived: moneyOut.nullable(),
    cardRef: z.string().nullable(),
    upiTxnRef: z.string().nullable(),
    confirmedAt: isoDate.nullable(),
  })
  .strict();

export const saleResponse = z
  .object({
    id: UUID,
    saleNumber: z.string(),
    channel: saleChannel,
    status: z.enum(['PENDING_PAYMENT', 'PICKED_UP', 'CANCELLED']),
    paymentStatus: z.enum(['PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'FAILED', 'REFUND_DUE']),
    warehouseId: UUID,
    buyer: saleBuyerResponse,
    items: z.array(saleLineResponse),
    totals: saleTotalsResponse,
    payment: salePaymentResponse,
    invoiceNumber: z.string().nullable(),
    invoiceId: UUID.nullable(),
    createdAt: isoDate,
    completedAt: isoDate.nullable(),
  })
  .strict();
export type Sale = z.infer<typeof saleResponse>;

export const saleCustomerMatchResponse = z
  .object({
    customerId: UUID,
    customerCode: z.string(),
    name: z.string(),
    mobileMasked: maskedMobile,
    walletBalance: moneyOut,
  })
  .strict();
export type SaleCustomerMatch = z.infer<typeof saleCustomerMatchResponse>;

export const customerLookupResponse = z.object({ items: z.array(saleCustomerMatchResponse).max(20) }).strict();
export type CustomerLookupResponse = z.infer<typeof customerLookupResponse>;

/**
 * docs/openapi.yaml SaleProduct, plus `batchCode` and `storageLocation` (spec gap): the counter
 * needs to know which batch FEFO will draw first and where it is kept. `batchCode` is TOHFA's own
 * code (BR-90d); no source farmer, farm or GRN farmer data is ever selected.
 */
export const saleProductResponse = z
  .object({
    productId: UUID,
    name: z.string(),
    categoryId: UUID,
    grade,
    unitPrice: moneyOut,
    availableQtyKg: qtyOut,
    unit: z.literal('kg'),
    photos: z.array(z.string()),
    certificationBadges: z.array(z.enum(['PGS', 'NPOP', 'OTHER'])),
    batchCode: z.string().nullable(),
    storageLocation: z.string().nullable(),
  })
  .strict();
export type SaleProduct = z.infer<typeof saleProductResponse>;

export const listSaleProductsResponse = z
  .object({
    items: z.array(saleProductResponse),
    page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }).strict(),
  })
  .strict();
export type ListSaleProductsResponse = z.infer<typeof listSaleProductsResponse>;
