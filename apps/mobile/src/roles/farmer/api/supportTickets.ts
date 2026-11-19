/**
 * Typed API client for a farmer's own help-desk tickets (BR-60, BR-36).
 *
 * Route is `/farmers/me/support-tickets`, so the caller is identified by the token and no
 * farmer id travels in the request. Field names match docs/openapi.yaml
 * (CreateSupportTicketRequest, FarmerSupportTicketDetailResponse) verbatim. Creating a ticket
 * does not move money, so it takes no Idempotency-Key.
 *
 * x-permission: farmer.support_ticket.manage_own
 */
import { api } from '../../../shell/api/client';

/** Mirrors the seeded `support_ticket_categories` codes (db/migrations/0039). */
export type SupportTicketCategoryCode = 'ACCOUNT' | 'PAYMENTS' | 'LISTINGS' | 'APP_PROBLEM' | 'OTHER';

export interface CreateSupportTicketInput {
  categoryCode: SupportTicketCategoryCode;
  /** 1 to 250 characters. */
  subject: string;
  /** 1 to 2000 characters. */
  description: string;
}

export const SUPPORT_TICKET_DESCRIPTION_MAX = 2000;

export interface FarmerSupportTicketSummary {
  id: string;
  ticketNumber: string;
  categoryCode: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

export interface FarmerSupportTicketDetail {
  ticket: FarmerSupportTicketSummary;
}

/**
 * Raise a new ticket. The server starts it OPEN with NORMAL priority; `priority` is triage and
 * is rejected with 422 if sent, so it is not part of the input type.
 */
export async function createSupportTicket(
  input: CreateSupportTicketInput,
): Promise<FarmerSupportTicketDetail> {
  return api.post<FarmerSupportTicketDetail>('/farmers/me/support-tickets', input);
}
