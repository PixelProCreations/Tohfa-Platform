/**
 * Admin promotion requests (BR-114 approve, BR-117 create/list/read/reject). Zod schemas only, matching
 * docs/openapi.yaml `approvePromotionRequest`, `createPromotionRequest`, `listPromotionRequests`,
 * `getPromotionRequest`, `rejectPromotionRequest` and their schemas.
 */
import { z } from 'zod';
import { CURSOR_TAGS, decodeKeysetCursor } from '../../http/keysetCursor.js';

export const PROMOTION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const PROMOTION_FROM_ROLES = ['SUPER_ADMIN', 'TOHFA_ADMIN', 'FARMER_ADMIN', 'MAIN_WH_ADMIN', 'SUB_WH_ADMIN'] as const;
/** Migration 0074 `promotion_requests_to_role_chk` (UNCONFIRMED default, BR-114). */
export const PROMOTION_TO_ROLES = ['SUPER_ADMIN', 'TOHFA_ADMIN', 'MAIN_WH_ADMIN'] as const;

export const promotionIdParams = z.object({ id: z.string().uuid() }).strict();

/** A decision body is optional: no body (or `{}`) decides without a note. */
const decisionBody = z.preprocess(
  (value) => value ?? {},
  z.object({ note: z.string().trim().min(1).max(500).optional() }).strict(),
);

/** POST /admin/promotions/{id}/approve (openapi `ApprovePromotionRequest`). */
export const approvePromotionBody = decisionBody;
export type ApprovePromotionBody = z.infer<typeof approvePromotionBody>;

/** POST /admin/promotions/{id}/reject (openapi `RejectPromotionRequest`). */
export const rejectPromotionBody = decisionBody;
export type RejectPromotionBody = z.infer<typeof rejectPromotionBody>;

/**
 * POST /admin/promotions (openapi `CreatePromotionRequest`). `fromRole` is never taken from the
 * client: the service derives it from the target's live roles. `reason` is required (UNCONFIRMED, BR-117).
 */
export const createPromotionBody = z
  .object({
    targetUserId: z.string().uuid(),
    toRole: z.enum(PROMOTION_TO_ROLES),
    reason: z.string().trim().min(1).max(500),
  })
  .strict();
export type CreatePromotionBody = z.infer<typeof createPromotionBody>;

/** GET /admin/promotions */
export const listPromotionsQuery = z
  .object({
    status: z.enum(PROMOTION_STATUSES).optional(),
    targetUserId: z.string().uuid().optional(),
    // Opaque keyset cursor (http/keysetCursor.ts); anything this list did not produce is 422.
    cursor: z
      .string()
      .max(512)
      .refine((raw) => decodeKeysetCursor(CURSOR_TAGS.promotionRequests, raw) !== null, { message: 'Invalid cursor.' })
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListPromotionsQuery = z.infer<typeof listPromotionsQuery>;

export const promotionRequest = z.object({
  id: z.string().uuid(),
  targetUserId: z.string().uuid(),
  fromRole: z.enum(PROMOTION_FROM_ROLES),
  toRole: z.enum(PROMOTION_TO_ROLES),
  requestedBy: z.string().uuid(),
  reason: z.string().nullable(),
  status: z.enum(PROMOTION_STATUSES),
  decidedBy: z.string().uuid().nullable(),
  decidedAt: z.string().datetime({ offset: true }).nullable(),
  decisionNote: z.string().nullable(),
  createdAt: z.string().datetime({ offset: true }),
});
export type PromotionRequest = z.infer<typeof promotionRequest>;

export const listPromotionsResponse = z.object({
  items: z.array(promotionRequest),
  page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ListPromotionsResponse = z.infer<typeof listPromotionsResponse>;
