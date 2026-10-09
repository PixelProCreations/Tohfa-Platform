import { z } from 'zod';

export const ticketStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export type TicketStatus = z.infer<typeof ticketStatusEnum>;

export const ticketPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);
export type TicketPriority = z.infer<typeof ticketPriorityEnum>;

export const ticketIdParams = z.object({
  id: z.string().uuid(),
}).strict();
export type TicketIdParams = z.infer<typeof ticketIdParams>;

// ── Farmer Schemas ───────────────────────────────────────────────────────────

export const listMyTicketsQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: ticketStatusEnum.optional(),
}).strict();
export type ListMyTicketsQuery = z.infer<typeof listMyTicketsQuery>;

// Free-text limits follow the rest of the API: 2000 for long text (calendar, pest, audits), 500 for a
// reason/remark (audits, livestock). Priority is triage, so it is not a farmer input: new tickets are
// NORMAL and `.strict()` turns a supplied `priority` into a 422.
export const SUPPORT_TEXT_MAX = 2000;
export const SUPPORT_REASON_MAX = 500;
export const SUPPORT_CATEGORY_CODE_MAX = 64;

export const createSupportTicketBody = z.object({
  categoryCode: z.string().trim().min(1).max(SUPPORT_CATEGORY_CODE_MAX),
  subject: z.string().trim().min(1).max(250),
  description: z.string().trim().min(1).max(SUPPORT_TEXT_MAX),
  attachmentUrl: z.string().trim().nullable().optional(),
}).strict();
export type CreateSupportTicketBody = z.infer<typeof createSupportTicketBody>;

export const sendTicketMessageBody = z.object({
  message: z.string().trim().min(1).max(SUPPORT_TEXT_MAX),
  attachmentUrl: z.string().trim().nullable().optional(),
}).strict();
export type SendTicketMessageBody = z.infer<typeof sendTicketMessageBody>;

// ── Admin Schemas ────────────────────────────────────────────────────────────

export const listAdminTicketsQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: ticketStatusEnum.optional(),
  categoryCode: z.string().trim().max(SUPPORT_CATEGORY_CODE_MAX).optional(),
  priority: ticketPriorityEnum.optional(),
  assignedToUserId: z.string().uuid().optional(),
}).strict();
export type ListAdminTicketsQuery = z.infer<typeof listAdminTicketsQuery>;

export const transitionTicketStatusBody = z.object({
  status: ticketStatusEnum,
  reason: z.string().trim().max(SUPPORT_REASON_MAX).optional(),
}).strict();
export type TransitionTicketStatusBody = z.infer<typeof transitionTicketStatusBody>;

export const assignTicketBody = z.object({
  assignedToUserId: z.string().uuid().nullable().optional(),
}).strict();
export type AssignTicketBody = z.infer<typeof assignTicketBody>;

// ── Response Schemas ─────────────────────────────────────────────────────────

export const supportTicketCategoryResponse = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
});
export type SupportTicketCategoryResponse = z.infer<typeof supportTicketCategoryResponse>;

// Admin shape: full fields, including who it is assigned to and who sent each message.
export const supportTicketSummaryResponse = z.object({
  id: z.string().uuid(),
  ticketNumber: z.string(),
  farmerId: z.string().uuid(),
  categoryCode: z.string(),
  subject: z.string(),
  description: z.string(),
  attachmentUrl: z.string().nullable(),
  status: ticketStatusEnum,
  priority: ticketPriorityEnum,
  assignedToUserId: z.string().uuid().nullable(),
  messageCount: z.number(),
  resolvedAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SupportTicketSummaryResponse = z.infer<typeof supportTicketSummaryResponse>;

export const supportTicketMessageResponse = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  senderUserId: z.string().uuid(),
  senderRole: z.string(),
  message: z.string(),
  attachmentUrl: z.string().nullable(),
  createdAt: z.string(),
});
export type SupportTicketMessageResponse = z.infer<typeof supportTicketMessageResponse>;

export const supportTicketStatusHistoryResponse = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  fromStatus: ticketStatusEnum.nullable(),
  toStatus: ticketStatusEnum,
  changedByUserId: z.string().uuid(),
  reason: z.string().nullable(),
  createdAt: z.string(),
});
export type SupportTicketStatusHistoryResponse = z.infer<typeof supportTicketStatusHistoryResponse>;

// Farmer shape: no staff identity. `assignedToUserId` and `senderUserId` are dropped and the raw staff
// role code (`senderRole`) is collapsed to one of two labels, so a farmer never learns who (or which role) answered.
export const farmerMessageSenderEnum = z.enum(['FARMER', 'SUPPORT']);
export type FarmerMessageSender = z.infer<typeof farmerMessageSenderEnum>;

export const farmerSupportTicketSummaryResponse = supportTicketSummaryResponse.omit({
  assignedToUserId: true,
});
export type FarmerSupportTicketSummaryResponse = z.infer<typeof farmerSupportTicketSummaryResponse>;

export const farmerSupportTicketMessageResponse = supportTicketMessageResponse
  .omit({ senderUserId: true })
  .extend({ senderRole: farmerMessageSenderEnum });
export type FarmerSupportTicketMessageResponse = z.infer<typeof farmerSupportTicketMessageResponse>;
