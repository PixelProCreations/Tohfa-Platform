/**
 * Pure (no React, no network) support-ticket logic shared by the customer
 * support screens and their tests: wire types (docs/openapi.yaml
 * `CreateCustomerTicketRequest`, `CustomerTicket*`), UI issue-type -> API
 * category mapping, subject synthesis, tab -> status filters and the
 * timeline derived from a ticket (there is no events endpoint).
 */
import type { IssueTypeCode } from '../components/contactSupportData';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export type TicketCategory =
  | 'QUALITY'
  | 'QUANTITY'
  | 'MISSING'
  | 'WRONG_ITEM'
  | 'DAMAGED'
  | 'LATE'
  | 'PAYMENT'
  | 'OTHER';

export interface CustomerTicketMessage {
  id: string;
  ticketId: string;
  sender: 'CUSTOMER' | 'SUPPORT';
  message: string;
  attachmentUrl: string | null;
  redacted: boolean;
  createdAt: string;
}

export interface CustomerTicketSummary {
  id: string;
  ticketNumber: string;
  orderId: string | null;
  orderNumber: string | null;
  category: TicketCategory;
  subject: string;
  description: string;
  photos: string[];
  status: TicketStatus;
  messageCount: number;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerTicketDetail extends CustomerTicketSummary {
  messages: CustomerTicketMessage[];
}

export interface CustomerTicketList {
  items: CustomerTicketSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCustomerTicketRequest {
  category?: TicketCategory;
  subject: string;
  description: string;
  orderId?: string;
  photoUploadIds?: string[];
}

/** API limits (CreateCustomerTicketRequest / messages body). */
export const MAX_TICKET_PHOTOS = 5;
export const SUBJECT_MAX = 250;
export const DESCRIPTION_MAX = 2000;
export const MESSAGE_MAX = 2000;

const CATEGORY_BY_ISSUE: Partial<Record<IssueTypeCode, TicketCategory>> = {
  quality_issue: 'QUALITY',
  weight_quantity: 'QUANTITY',
  missing_item: 'MISSING',
  wrong_item: 'WRONG_ITEM',
  damaged_item: 'DAMAGED',
  pickup_delivery: 'LATE',
  order_status: 'LATE',
  payment_refund: 'PAYMENT',
  payments_wallet: 'PAYMENT',
};

/** The 18 UI issue types collapse onto the 8 API categories; everything else is OTHER. */
export function issueToCategory(issue: IssueTypeCode): TicketCategory {
  return CATEGORY_BY_ISSUE[issue] ?? 'OTHER';
}

/** `${label} - ${orderNumber}` (label alone without an order), capped at 250 chars. */
export function buildTicketSubject(issueLabel: string, orderNumber?: string | null): string {
  const label = issueLabel.trim() || 'Support request';
  const subject = orderNumber ? `${label} - ${orderNumber}` : label;
  return subject.slice(0, SUBJECT_MAX);
}

/**
 * The API has no product field: the chosen product is folded into the
 * description (`Product: <name>` first line), capped at 2000 chars.
 */
export function buildTicketDescription(text: string, productName?: string | null): string {
  const body = text.trim();
  const full = productName ? `Product: ${productName}\n${body}` : body;
  return full.slice(0, DESCRIPTION_MAX);
}

/** Inverse of buildTicketDescription for display: the folded product line, if any. */
export function productFromDescription(description: string): string | null {
  const match = /^Product: (.+)$/m.exec(description.split('\n')[0] ?? '');
  return match?.[1]?.trim() || null;
}

/** Issue label from a subject written by buildTicketSubject (`label - ORD...`). */
export function issueLabelFromSubject(subject: string, orderNumber: string | null): string {
  if (orderNumber && subject.endsWith(` - ${orderNumber}`)) {
    return subject.slice(0, subject.length - orderNumber.length - 3);
  }
  return subject;
}

export interface TicketDraftInput {
  relatedTo: 'order' | 'product' | 'other' | 'review';
  orderId: string | null;
  description: string;
  photosUploading: boolean;
}

export type TicketDraftProblem = 'order_required' | 'description_required' | 'description_too_long' | 'photos_uploading';

/** First reason the draft cannot be sent, or null when it is valid. */
export function validateTicketDraft(input: TicketDraftInput): TicketDraftProblem | null {
  if ((input.relatedTo === 'order' || input.relatedTo === 'product') && !input.orderId) return 'order_required';
  const len = input.description.trim().length;
  if (len === 0) return 'description_required';
  if (len > DESCRIPTION_MAX) return 'description_too_long';
  if (input.photosUploading) return 'photos_uploading';
  return null;
}

/** How many more photos can be added (never negative). */
export function remainingPhotoSlots(current: number): number {
  return Math.max(0, MAX_TICKET_PHOTOS - current);
}

/** Keeps at most the slots still free (the picker may return more than asked). */
export function capPhotos<T>(existing: readonly T[], added: readonly T[]): T[] {
  return [...existing, ...added.slice(0, remainingPhotoSlots(existing.length))];
}

// ── My requests tabs ─────────────────────────────────────────────────────────

export type SupportTab = 'ALL' | 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CANCELLED';

/** API `status` values a tab lists; `[null]` means no filter. Resolved folds CLOSED in. */
export function statusesForTab(tab: SupportTab): (TicketStatus | null)[] {
  switch (tab) {
    case 'OPEN':
      return ['OPEN'];
    case 'IN_REVIEW':
      return ['IN_PROGRESS'];
    case 'RESOLVED':
      return ['RESOLVED', 'CLOSED'];
    case 'CANCELLED':
      return ['CANCELLED'];
    default:
      return [null];
  }
}

/** Merge pages of several status lists into one newest-first list (deduped by id). */
export function mergeTicketPages(pages: readonly CustomerTicketSummary[][]): CustomerTicketSummary[] {
  const seen = new Set<string>();
  const out: CustomerTicketSummary[] = [];
  for (const page of pages) {
    for (const item of page) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  return out.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

// ── Track timeline ───────────────────────────────────────────────────────────

export type TimelineStepKey = 'received' | 'review' | 'resolution' | 'cancelled';
export type TimelineStepState = 'done' | 'current' | 'pending';

export interface TimelineStep {
  key: TimelineStepKey;
  state: TimelineStepState;
  /** ISO timestamp, or null when not reached / unknown. */
  at: string | null;
}

/**
 * received = createdAt; under review = IN_PROGRESS (time = first SUPPORT
 * message, else updatedAt -- approximate, there is no status history);
 * resolution = RESOLVED/CLOSED at resolvedAt; a CANCELLED ticket ends in a
 * `cancelled` step at updatedAt.
 */
export function deriveTimeline(ticket: Pick<CustomerTicketDetail, 'status' | 'createdAt' | 'updatedAt' | 'resolvedAt'> & {
  messages?: readonly CustomerTicketMessage[] | undefined;
}): TimelineStep[] {
  const firstSupport = (ticket.messages ?? [])
    .filter((m) => m.sender === 'SUPPORT')
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))[0];
  const received: TimelineStep = { key: 'received', state: 'done', at: ticket.createdAt };

  switch (ticket.status) {
    case 'OPEN':
      return [received, { key: 'review', state: 'current', at: null }, { key: 'resolution', state: 'pending', at: null }];
    case 'IN_PROGRESS':
      return [
        received,
        { key: 'review', state: 'current', at: firstSupport?.createdAt ?? ticket.updatedAt },
        { key: 'resolution', state: 'pending', at: null },
      ];
    case 'RESOLVED':
    case 'CLOSED':
      return [
        received,
        { key: 'review', state: 'done', at: firstSupport?.createdAt ?? null },
        { key: 'resolution', state: 'done', at: ticket.resolvedAt ?? ticket.updatedAt },
      ];
    case 'CANCELLED':
      return [received, { key: 'cancelled', state: 'done', at: ticket.updatedAt }];
    default:
      return [received];
  }
}

/** Thread newest first (the "Request Updates" list). */
export function sortMessagesNewestFirst(messages: readonly CustomerTicketMessage[]): CustomerTicketMessage[] {
  return [...messages].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** Composer is hidden for terminal tickets the API refuses or that make no sense to reply to. */
export function canReply(status: TicketStatus): boolean {
  return status !== 'CLOSED' && status !== 'CANCELLED';
}

export function canCancel(status: TicketStatus): boolean {
  return status === 'OPEN';
}

export function shouldPoll(status: TicketStatus | undefined): boolean {
  return status === 'OPEN' || status === 'IN_PROGRESS';
}

/** `15 Nov 2026, 9:41 AM` in the device zone; '' for a missing/invalid value. */
export function formatSupportDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const h24 = d.getHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${h12}:${mm} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/** `15 Jul 2026`; '' for a missing/invalid value. */
export function formatSupportDate(iso: string | null | undefined): string {
  const full = formatSupportDateTime(iso);
  return full ? full.split(',')[0]! : '';
}

// ── Photo bytes ──────────────────────────────────────────────────────────────

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodes standard base64 (the image picker's `includeBase64`) to bytes. */
export function base64ToBytes(input: string): Uint8Array {
  const clean = input.replace(/^data:[^,]*,/, '').replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let o = 0;
  for (let i = 0; i < clean.length; i++) {
    buffer = (buffer << 6) | B64.indexOf(clean[i]!);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (buffer >> bits) & 0xff;
    }
  }
  return out.subarray(0, o);
}

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const;

export function isAllowedPhotoType(type: string | undefined): boolean {
  return type !== undefined && (ALLOWED_PHOTO_TYPES as readonly string[]).includes(type.toLowerCase());
}
