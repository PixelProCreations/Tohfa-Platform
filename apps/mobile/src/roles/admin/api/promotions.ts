/**
 * Admin promotion requests, read-only (docs/openapi.yaml /admin/promotions, BR-114, BR-117):
 *   GET /admin/promotions   admin.promotion.view   (SUPER_ADMIN and TOHFA_ADMIN `all`)
 *
 * Only the list is here: the approve and reject writes are not wired from the
 * mobile admin yet, so this module exports no write call.
 *
 * Shape mirrors apps/api/src/modules/admin-promotions/admin-promotions.schema.ts.
 * The request never carries the target's name or contact, only ids and the
 * from/to role, so a screen that wants a name must look it up elsewhere.
 *
 * No UI imports, so any admin area can reuse it.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import type { Page } from '../../../shell/api/pagination';
import { adminGet } from './http';

export const PROMOTION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];

/** docs/openapi.yaml `PromotionRequest`. */
export interface PromotionRequestDto {
  id: string;
  targetUserId: string;
  fromRole: string;
  toRole: string;
  requestedBy: string;
  reason: string | null;
  status: PromotionStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
}

export interface ListPromotionsParams {
  status?: PromotionStatus | undefined;
  targetUserId?: string | undefined;
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
}

/** 401/403/422/500 (an unknown cursor is 422). */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = ['UNAUTHENTICATED', 'FORBIDDEN', 'VALIDATION_FAILED', 'INTERNAL'];

/** Newest first, cursor paged. A scope that is not `all` reads an empty page, never 403. */
export function listPromotionRequests(params: ListPromotionsParams = {}, signal?: AbortSignal): Promise<Page<PromotionRequestDto>> {
  return adminGet<Page<PromotionRequestDto>>(
    '/admin/promotions',
    { status: params.status, targetUserId: params.targetUserId, cursor: params.cursor, limit: params.limit },
    signal,
  );
}
