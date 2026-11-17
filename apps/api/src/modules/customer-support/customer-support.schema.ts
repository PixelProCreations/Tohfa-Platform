/**
 * Customer support tickets (`/v1/support/tickets`): Zod schemas, `.strict()`, matching docs/openapi.yaml.
 *
 * The tickets live in the shared `support_tickets` / `support_messages` tables (0008), so a ticket a
 * customer raises is exactly what `/v1/admin/customers/{id}/support-tickets` reads and replies to.
 * Priority, assignee, internal notes and staff identity are triage / admin data and never appear in a
 * customer response (allow-list shapes below).
 */
import { z } from 'zod';

export const SUPPORT_SUBJECT_MAX = 250;
export const SUPPORT_TEXT_MAX = 2000;
/** Photos per ticket: a technical bound on the request, not a business threshold. */
export const SUPPORT_MAX_PHOTOS = 3;

/** support_tickets.category CHECK (0008). */
export const ticketCategoryEnum = z.enum(['QUALITY', 'QUANTITY', 'MISSING', 'WRONG_ITEM', 'DAMAGED', 'LATE', 'PAYMENT', 'OTHER']);
export type TicketCategory = z.infer<typeof ticketCategoryEnum>;

/** The API vocabulary (the DB stores INVESTIGATING for IN_PROGRESS; same mapping as the admin API, BR-97). */
export const ticketStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export type TicketStatus = z.infer<typeof ticketStatusEnum>;

export const ticketIdParams = z.object({ id: z.string().uuid() }).strict();

export const listTicketsQuery = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: ticketStatusEnum.optional(),
  })
  .strict();
export type ListTicketsQuery = z.infer<typeof listTicketsQuery>;

export const createTicketBody = z
  .object({
    category: ticketCategoryEnum.default('OTHER'),
    subject: z.string().trim().min(1).max(SUPPORT_SUBJECT_MAX),
    description: z.string().trim().min(1).max(SUPPORT_TEXT_MAX),
    /** Optional: the order the issue is about. Must be the caller's own order (else 404). */
    orderId: z.string().uuid().optional(),
    /** Ids returned by `POST /uploads/sign` with purpose ISSUE_PHOTO. */
    photoUploadIds: z.array(z.string().uuid()).max(SUPPORT_MAX_PHOTOS).default([]),
  })
  .strict();
export type CreateTicketBody = z.infer<typeof createTicketBody>;

export const sendMessageBody = z
  .object({
    message: z.string().trim().min(1).max(SUPPORT_TEXT_MAX),
    /** Id returned by `POST /uploads/sign` with purpose ISSUE_PHOTO. */
    attachmentUploadId: z.string().uuid().optional(),
  })
  .strict();
export type SendMessageBody = z.infer<typeof sendMessageBody>;

export const messageSenderEnum = z.enum(['CUSTOMER', 'SUPPORT']);

export const customerTicketMessageResponse = z
  .object({
    id: z.string().uuid(),
    ticketId: z.string().uuid(),
    sender: messageSenderEnum,
    message: z.string(),
    attachmentUrl: z.string().nullable(),
    redacted: z.boolean(),
    createdAt: z.string(),
  })
  .strict();
export type CustomerTicketMessage = z.infer<typeof customerTicketMessageResponse>;

export const customerTicketSummaryResponse = z
  .object({
    id: z.string().uuid(),
    ticketNumber: z.string(),
    orderId: z.string().uuid().nullable(),
    category: ticketCategoryEnum,
    subject: z.string(),
    description: z.string(),
    photos: z.array(z.string()),
    status: ticketStatusEnum,
    messageCount: z.number().int(),
    resolvedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();
export type CustomerTicketSummary = z.infer<typeof customerTicketSummaryResponse>;

export const customerTicketDetailResponse = customerTicketSummaryResponse
  .extend({ messages: z.array(customerTicketMessageResponse) })
  .strict();
export type CustomerTicketDetail = z.infer<typeof customerTicketDetailResponse>;

export const customerTicketListResponse = z
  .object({
    items: z.array(customerTicketSummaryResponse),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
  })
  .strict();
export type CustomerTicketList = z.infer<typeof customerTicketListResponse>;
