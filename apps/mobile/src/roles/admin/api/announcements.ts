/**
 * Admin announcements (docs/openapi.yaml tag Platform, BR-213):
 *
 *   GET   /admin/announcements               announcement.system_wide.create | announcement.warehouse.create
 *   POST  /admin/announcements               the permission of the requested `target`
 *   PATCH /admin/announcements/{id}          the permission of the STORED target
 *   POST  /admin/announcements/{id}/retire   the permission of the STORED target
 *
 * The target discriminator is `SYSTEM_WIDE | WAREHOUSE | ZONE | ROLE` — note
 * SYSTEM_WIDE, not SYSTEM. Only SYSTEM_WIDE and WAREHOUSE can be AUTHORED:
 * docs/rbac.json has no create permission for ZONE or ROLE, so the API refuses
 * them 422 VALIDATION_FAILED on `body.target`. Existing ZONE and ROLE rows can
 * still be read, edited and retired. `CreateAnnouncementBody.target` is
 * therefore typed as the two that work, so a screen cannot offer the others.
 *
 * The list is cursor-paged ({ items, page }), unlike the numbered Learning Hub
 * lists. A retired announcement cannot be edited (409 INVALID_STATE_TRANSITION),
 * and retiring is idempotent on the server. Nothing here moves money.
 *
 * No UI imports.
 */
import type { Page } from '../../../shell/api/pagination';
import { adminGet, adminPatch, adminPost } from './http';

/** docs/openapi.yaml AdminAnnouncement.target: every stored scope, readable. */
export type AnnouncementTarget = 'SYSTEM_WIDE' | 'WAREHOUSE' | 'ZONE' | 'ROLE';
/** The two targets an admin can author (BR-213). */
export type AuthorableAnnouncementTarget = 'SYSTEM_WIDE' | 'WAREHOUSE';
/** docs/openapi.yaml AdminAnnouncement.type (BR-134, an UNCONFIRMED value set). */
export type AnnouncementType = 'GENERAL' | 'MAINTENANCE' | 'ALERT' | 'PROMOTION';
export type AnnouncementStatus = 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'RETIRED';

/** docs/openapi.yaml AdminAnnouncement. */
export interface AdminAnnouncementDto {
  id: string;
  target: AnnouncementTarget;
  warehouseId: string | null;
  zoneId: string | null;
  roleId: string | null;
  type: AnnouncementType;
  title: string;
  body: string;
  locale: 'en' | 'ta';
  startsAt: string;
  endsAt: string | null;
  status: AnnouncementStatus;
  retiredAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
}

/** docs/openapi.yaml AdminAnnouncementCreate. */
export interface CreateAnnouncementBody {
  target: AuthorableAnnouncementTarget;
  /** Required for WAREHOUSE, refused (422) for SYSTEM_WIDE. */
  warehouseId?: string;
  type?: AnnouncementType;
  /** 1-200 characters. */
  title: string;
  /** 1-5000 characters. */
  body: string;
  locale?: 'en' | 'ta';
  /** Omitted means publish now. */
  startsAt?: string;
  /** After startsAt; omitted or null means it runs until retired. */
  endsAt?: string | null;
}

/** docs/openapi.yaml AdminAnnouncementUpdate: at least one field; no `target`, no `warehouseId`. */
export interface UpdateAnnouncementBody {
  type?: AnnouncementType;
  title?: string;
  body?: string;
  locale?: 'en' | 'ta';
  startsAt?: string;
  endsAt?: string | null;
}

export interface ListAnnouncementsParams {
  cursor?: string | undefined;
  limit?: number | undefined;
  target?: AnnouncementTarget | undefined;
  status?: AnnouncementStatus | undefined;
  type?: AnnouncementType | undefined;
  warehouseId?: string | undefined;
}

const ANNOUNCEMENTS = '/admin/announcements';

/** One page of announcements the caller may manage, newest first. */
export function listAdminAnnouncements(params: ListAnnouncementsParams = {}, signal?: AbortSignal): Promise<Page<AdminAnnouncementDto>> {
  return adminGet<Page<AdminAnnouncementDto>>(
    ANNOUNCEMENTS,
    {
      cursor: params.cursor,
      limit: params.limit,
      target: params.target,
      status: params.status,
      type: params.type,
      warehouseId: params.warehouseId,
    },
    signal,
  );
}

/** Publish an announcement (201). ZONE and ROLE are not authorable. */
export function createAdminAnnouncement(body: CreateAnnouncementBody, signal?: AbortSignal): Promise<AdminAnnouncementDto> {
  return adminPost<AdminAnnouncementDto>(ANNOUNCEMENTS, body, { signal });
}

/** Edit a live announcement; a retired one is 409. */
export function updateAdminAnnouncement(id: string, body: UpdateAnnouncementBody, signal?: AbortSignal): Promise<AdminAnnouncementDto> {
  return adminPatch<AdminAnnouncementDto>(`${ANNOUNCEMENTS}/${encodeURIComponent(id)}`, body, { signal });
}

/** Retire an announcement so it stops reaching readers; idempotent. */
export function retireAdminAnnouncement(id: string, reason?: string, signal?: AbortSignal): Promise<AdminAnnouncementDto> {
  return adminPost<AdminAnnouncementDto>(`${ANNOUNCEMENTS}/${encodeURIComponent(id)}/retire`, reason === undefined ? {} : { reason }, { signal });
}
