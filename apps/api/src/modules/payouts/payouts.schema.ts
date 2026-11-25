import { z } from 'zod';
import { CURSOR_TAGS, decodeKeysetCursor } from '../../http/keysetCursor.js';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export const payoutModes = ['UPI', 'IMPS', 'NEFT'] as const;
export type PayoutMode = (typeof payoutModes)[number];

export const payoutStatuses = [
  'REQUESTED',
  'PENDING_APPROVAL',
  'APPROVED',
  'PROCESSING',
  'PAID',
  'FAILED',
  'REVERSED',
  'REJECTED',
] as const;
export type PayoutStatus = (typeof payoutStatuses)[number];

export const ageBuckets = ['D0_7', 'D8_15', 'D16_30', 'D30_PLUS'] as const;
export type AgeBucket = (typeof ageBuckets)[number];

// ---------------------------------------------------------------------------
// GET /admin/payout-dues
// ---------------------------------------------------------------------------

export const exportPayoutsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});
export type ExportPayoutsQuery = z.infer<typeof exportPayoutsQuerySchema>;

export const payoutDuesQuerySchema = z.object({
  farmerId: z.string().uuid().optional(),
  ageBucket: z.enum(ageBuckets).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
});
export type PayoutDuesQuery = z.infer<typeof payoutDuesQuerySchema>;

export interface PayoutDue {
  id: string;
  farmerId: string;
  tohfaFarmerId: string | null;
  farmerName: string;
  purchaseOrderId: string;
  goodsReceiptId: string | null;
  amountDue: string;
  dueSince: string;
  ageDays: number;
  ageBucket: AgeBucket;
}

export interface PayoutDuesTotals {
  totalDue: string;
  farmerCount: number;
}

// ---------------------------------------------------------------------------
// POST /admin/payouts
// ---------------------------------------------------------------------------

export const payoutItemInputSchema = z.object({
  goodsReceiptId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a decimal string e.g. "500.00"'),
});
export type PayoutItemInput = z.infer<typeof payoutItemInputSchema>;

export const createPayoutSchema = z.object({
  farmerId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a decimal string e.g. "500.00"'),
  mode: z.enum(payoutModes),
  bankAccountId: z.string().uuid().optional(),
  dueIds: z.array(z.string().uuid()).optional(),
  items: z.array(payoutItemInputSchema).optional(),
  remarks: z.string().max(300).optional(),
});
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;

// ---------------------------------------------------------------------------
// POST /admin/payouts/{id}/approve
// ---------------------------------------------------------------------------

export const approvePayoutSchema = z.object({
  note: z.string().max(500).optional(),
});
export type ApprovePayoutInput = z.infer<typeof approvePayoutSchema>;

export const rejectPayoutSchema = z.object({
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters.').max(500),
});
export type RejectPayoutInput = z.infer<typeof rejectPayoutSchema>;

export const intimatePayoutSchema = z.object({
  note: z.string().trim().max(500).optional(),
});
export type IntimatePayoutInput = z.infer<typeof intimatePayoutSchema>;

export const bulkCreatePayoutsSchema = z.object({
  items: z.array(createPayoutSchema).min(1).max(50),
});
export type BulkCreatePayoutsInput = z.infer<typeof bulkCreatePayoutsSchema>;

export interface IntimatePayoutResponse {
  payoutId: string;
  payoutNumber: string;
  farmerId: string;
  status: PayoutStatus;
  intimatedAt: string;
  intimatedBy: string;
  note: string | null;
}

export interface BulkCreatePayoutsResponse {
  batchId: string;
  createdCount: number;
  totalAmount: string;
  items: PayoutResponse[];
}

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

export interface PayoutResponse {
  id: string;
  payoutNumber: string;
  farmerId: string;
  farmerName: string;
  amount: string;
  mode: PayoutMode;
  status: PayoutStatus;
  requiresDualApproval: boolean;
  initiatedBy: string;
  approvedBy: string[];
  approvedAt: string | null;
  gatewayPayoutId: string | null;
  failureReason: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  intimatedAt?: string | null;
  paidAt: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// ---------------------------------------------------------------------------
// GET /admin/payouts (list) & GET /admin/payouts/{id} (detail) - P0-40
// ---------------------------------------------------------------------------

export const listPayoutsQuerySchema = z.object({
  status: z.enum(payoutStatuses).optional(),
  farmerId: z.string().uuid().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z
    .string()
    .max(512)
    .refine((raw) => decodeKeysetCursor(CURSOR_TAGS.adminPayouts, raw) !== null, { message: 'Invalid cursor.' })
    .optional(),
});
export type ListPayoutsQuery = z.infer<typeof listPayoutsQuerySchema>;

export interface PayoutListItem {
  id: string;
  payoutNumber: string;
  farmerId: string;
  farmerName: string;
  amount: string;
  status: PayoutStatus;
  requestedAt: string;
  requestedBy: string;
}

export interface PayoutListSummary {
  total: number;
  requested: number;
  pendingApproval: number;
  approved: number;
  processing: number;
  paid: number;
  failed: number;
  reversed: number;
  rejected: number;
}

export interface ListPayoutsResponse {
  items: PayoutListItem[];
  summary: PayoutListSummary;
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  nextCursor: string | null;
  hasMore: boolean;
}

export const payoutIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type PayoutIdParam = z.infer<typeof payoutIdParamSchema>;

export interface PayoutLinkedItem {
  id: string;
  purchaseOrderId: string | null;
  purchaseOrderNumber: string | null;
  goodsReceiptId: string;
  goodsReceiptNumber: string | null;
  produce: string | null;
  acceptedQuantity: string | null;
  acceptedGrade: string | null;
  unitPrice: string | null;
  purchaseValue: string | null;
  amount: string;
}

export interface PayoutAuditEvent {
  id: string;
  actionCode: string;
  actorId: string;
  actorName: string | null;
  outcome: string;
  createdAt: string;
  details: unknown;
}

export interface PayoutDetailResponse extends PayoutListItem {
  farmerContact: string | null;
  farmerCode: string | null;
  verifiedPayoutAccount: string | null;
  purchaseOrderId: string | null;
  purchaseOrderNumber: string | null;
  goodsReceiptId: string | null;
  goodsReceiptNumber: string | null;
  produce: string | null;
  acceptedQuantity: string | null;
  acceptedGrade: string | null;
  unitPrice: string | null;
  purchaseValue: string | null;
  items: PayoutLinkedItem[];
  netPayableAmount: string;
  approvedAdjustments: string;
  calculationReference: string;
  approvalStatus: string;
  approver: string | null;
  rejectionReason: string | null;
  auditTrail: PayoutAuditEvent[];
}
