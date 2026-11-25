/**
 * Listing approval (the Tohfa "Produce list" queue) against docs/openapi.yaml
 * and apps/api/src/modules/listings/counter-offers.routes.ts:
 *   GET  /admin/listings                     listing.queue.view_pending (BR-29)
 *   POST /admin/listings/{id}/approve        listing.approve            (BR-07, BR-29, BR-119)
 *   POST /admin/listings/{id}/reject         listing.reject             (BR-29)
 *   POST /admin/listings/{id}/counter-offers listing.counter_offer.send (BR-07, BR-10, BR-11, BR-29)
 *
 * There is no admin GET for a single listing in the spec; the queue row is
 * everything the design's card shows.
 *
 * Idempotency: the spec declares a REQUIRED Idempotency-Key on all three
 * POSTs, so the client always sends one. As of this writing the admin
 * handlers do not read the header (counter-offers.routes.ts passes no key to
 * the service); sending it is correct once the server honours it.
 *
 * Money arrives as a 2-dp decimal string and stays a `Money` string (root
 * CLAUDE.md 2.2); a value that is not well-formed money becomes null so the
 * screen shows the dash instead of a guess.
 *
 * No UI imports, so any admin area can reuse it.
 */
import { isMoney, parseMoney, type Money } from '@tohfa/shared-types';
import type { Page } from '../../../shell/api/pagination';
import { bodyFingerprint } from './hookHelpers';
import { adminGet, adminPost } from './http';

/** counter-offers.schema.ts / openapi `Grade`. */
export const LISTING_GRADES = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'] as const;
export type ListingGrade = (typeof LISTING_GRADES)[number];

/** openapi `ListingStatus`. */
export type ListingStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'COUNTER_OFFERED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'EXPIRED'
  | 'FULFILLED';

/** The statuses GET /admin/listings accepts as a filter (counter-offers.schema.ts listAdminQueueQuery). */
export type ListingQueueStatus = 'PENDING_APPROVAL' | 'COUNTER_OFFERED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

/** The approval queue shows listings awaiting an admin decision. */
export const QUEUE_STATUS: ListingQueueStatus = 'PENDING_APPROVAL';

/** POST /admin/listings/{id}/reject `reasonCode` enum. */
export const REJECT_REASON_CODES = ['QUALITY_CONCERN', 'PRICE_UNACCEPTABLE', 'NO_DEMAND', 'CERT_ISSUE', 'DUPLICATE', 'OTHER'] as const;
export type RejectReasonCode = (typeof REJECT_REASON_CODES)[number];

/** API validation limits of the reject `reason` (openapi minLength / maxLength), not business thresholds. */
export const REJECT_REASON_MIN = 5;
export const REJECT_REASON_MAX = 500;
/** API validation limit of a counter-offer `message` (openapi maxLength). */
export const COUNTER_MESSAGE_MAX = 500;

/** openapi `AdminListing` (Listing + farmer fields). Optional members are optional in the spec. */
export interface AdminListingDto {
  id: string;
  cropId: string;
  cropName?: string | undefined;
  grade: string;
  quantityKg: string;
  askingPricePerKg: string;
  ceilingPricePerKg?: string | null | undefined;
  finalPricePerKg?: string | null | undefined;
  status: string;
  counterRoundsUsed?: number | undefined;
  rejectionReason?: string | null | undefined;
  createdAt: string;
  farmerName?: string | null | undefined;
  tohfaFarmerId?: string | null | undefined;
  zoneId?: string | null | undefined;
  /** BR-29: the viewing Farmer Admin owns it; read-only for them. */
  routedAway?: boolean | undefined;
}

export type AdminListingPage = Page<AdminListingDto>;

export interface ListAdminListingsParams {
  status?: ListingQueueStatus | undefined;
  cropId?: string | undefined;
  zoneId?: string | undefined;
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
}

export interface ApproveListingBody {
  /** The warehouse the purchase order is raised to. Required by the spec. */
  warehouseId: string;
  /** YYYY-MM-DD. */
  expectedDeliveryDate?: string | undefined;
  note?: string | undefined;
}

export interface RejectListingBody {
  reasonCode: RejectReasonCode;
  /** 5-500 characters; the farmer sees it. */
  reason: string;
}

/** openapi `CounterOfferCreate`. */
export interface CounterOfferBody {
  pricePerKg: Money;
  /** Positive decimal, at most 3 dp (openapi `Quantity`). */
  quantityKg: string;
  message?: string | undefined;
}

/** The queue card's view of one listing. null = the API did not send it (render the dash). */
export interface ListingQueueRow {
  id: string;
  cropName: string | null;
  quantityKg: string | null;
  askingPrice: Money | null;
  ceilingPrice: Money | null;
  farmerName: string | null;
  farmerCode: string | null;
  grade: ListingGrade | null;
  status: string;
  routedAway: boolean;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function money(value: unknown): Money | null {
  return typeof value === 'string' && isMoney(value) ? parseMoney(value) : null;
}

function grade(value: unknown): ListingGrade | null {
  return (LISTING_GRADES as readonly unknown[]).includes(value) ? (value as ListingGrade) : null;
}

export function toListingQueueRow(dto: AdminListingDto): ListingQueueRow {
  return {
    id: dto.id,
    cropName: text(dto.cropName),
    quantityKg: text(dto.quantityKg),
    askingPrice: money(dto.askingPricePerKg),
    ceilingPrice: money(dto.ceilingPricePerKg),
    farmerName: text(dto.farmerName),
    farmerCode: text(dto.tohfaFarmerId),
    grade: grade(dto.grade),
    status: dto.status,
    routedAway: dto.routedAway === true,
  };
}

/**
 * What one Idempotency-Key stands for: the listing AND the body. Approving two
 * listings sends the same body ({ warehouseId }), so the body alone would
 * replay the first listing's key for the second.
 */
export function listingWriteFingerprint(listingId: string, body: unknown): string {
  return bodyFingerprint({ listingId, body });
}

/** The approval queue, newest first, cursor paged. Not zone-scoped server-side yet (API team fixing). */
export function listAdminListings(params: ListAdminListingsParams = {}, signal?: AbortSignal): Promise<AdminListingPage> {
  return adminGet<AdminListingPage>(
    '/admin/listings',
    { status: params.status, cropId: params.cropId, zoneId: params.zoneId, cursor: params.cursor, limit: params.limit },
    signal,
  );
}

function listingPath(listingId: string, verb: string): string {
  return `/admin/listings/${encodeURIComponent(listingId)}/${verb}`;
}

/**
 * Approves at the asking (or accepted counter) price and raises the purchase
 * order to `warehouseId`. 403 SELF_APPROVAL_FORBIDDEN (BR-29), 409
 * LISTING_NOT_PENDING / CONFLICT, 404.
 */
export function approveListing(listingId: string, body: ApproveListingBody, idempotencyKey: string): Promise<unknown> {
  return adminPost<unknown>(listingPath(listingId, 'approve'), body, { idempotencyKey });
}

/** Rejects a pending listing with the reason the farmer sees. 409 LISTING_NOT_PENDING, 404, 403. */
export function rejectListing(listingId: string, body: RejectListingBody, idempotencyKey: string): Promise<unknown> {
  return adminPost<unknown>(listingPath(listingId, 'reject'), body, { idempotencyKey });
}

/**
 * Sends a counter-offer (201). The farmer has the configured window to answer
 * (BR-10); 409 COUNTER_LIMIT_REACHED once the rounds are used (BR-11). The
 * BR-07 ceiling check on the price is the server's (not enforced there yet;
 * the API team is fixing it).
 */
export function sendCounterOffer(listingId: string, body: CounterOfferBody, idempotencyKey: string): Promise<unknown> {
  return adminPost<unknown>(listingPath(listingId, 'counter-offers'), body, { idempotencyKey });
}
