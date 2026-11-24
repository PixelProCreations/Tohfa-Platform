/**
 * Admin announcements (BR-213). Wiring only: requireAuth -> requirePermission -> validate -> handler.
 *
 * Mounted by app.ts at /v1/admin/announcements. The reader-facing half of the same table is
 * /v1/system-messages (BR-65, BR-134) and is not touched here.
 *
 * Every route is gated by `requireAnyPermission` over the two create codes in docs/rbac.json
 * (`x-permission-any-of` in docs/openapi.yaml): a caller holding neither is 403 before the body is
 * read. WHICH of the two applies is decided by the announcement's target — the body's on create,
 * the stored row's on edit and retire — and that decision belongs to the service, which gets the
 * caller's resolved scope for BOTH codes from `announcementAuthority`.
 */
import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requireAnyPermission } from '../../rbac/requirePermission.js';
import {
  adminAnnouncementIdParams,
  createAdminAnnouncementBody,
  CREATE_PERMISSION_BY_TARGET,
  listAdminAnnouncementsQuery,
  retireAdminAnnouncementBody,
  updateAdminAnnouncementBody,
} from './admin-announcements.schema.js';
import { adminAnnouncementsService, announcementAuthority } from './admin-announcements.service.js';

const ANNOUNCEMENT_PERMISSIONS = Object.values(CREATE_PERMISSION_BY_TARGET);

export const adminAnnouncementsRouter: Router = Router();

// GET /v1/admin/announcements — every announcement the caller may manage, newest first. Rows
// outside the caller's authority are absent from the page, never 403 (requirePermission.ts).
adminAnnouncementsRouter.get(
  '/',
  requireAuth,
  requireAnyPermission(ANNOUNCEMENT_PERMISSIONS),
  validate({ query: listAdminAnnouncementsQuery }),
  asyncHandler(async (req, res) => {
    const authority = announcementAuthority(requireActor(req.actor));
    const query = getValidated(req, 'query', listAdminAnnouncementsQuery);
    res.status(200).json(await adminAnnouncementsService.list(authority, query));
  }),
);

// POST /v1/admin/announcements — the code that applies depends on `target` in the body.
adminAnnouncementsRouter.post(
  '/',
  requireAuth,
  requireAnyPermission(ANNOUNCEMENT_PERMISSIONS),
  validate({ body: createAdminAnnouncementBody }),
  asyncHandler(async (req, res) => {
    const authority = announcementAuthority(requireActor(req.actor));
    const body = getValidated(req, 'body', createAdminAnnouncementBody);
    res.status(201).json(await adminAnnouncementsService.create(authority, body));
  }),
);

// PATCH /v1/admin/announcements/:id — the code that applies depends on the STORED target.
adminAnnouncementsRouter.patch(
  '/:id',
  requireAuth,
  requireAnyPermission(ANNOUNCEMENT_PERMISSIONS),
  validate({ params: adminAnnouncementIdParams, body: updateAdminAnnouncementBody }),
  asyncHandler(async (req, res) => {
    const authority = announcementAuthority(requireActor(req.actor));
    const { id } = getValidated(req, 'params', adminAnnouncementIdParams);
    const body = getValidated(req, 'body', updateAdminAnnouncementBody);
    res.status(200).json(await adminAnnouncementsService.update(authority, id, body));
  }),
);

// POST /v1/admin/announcements/:id/retire — idempotent; a replay keeps the first `retiredAt`.
adminAnnouncementsRouter.post(
  '/:id/retire',
  requireAuth,
  requireAnyPermission(ANNOUNCEMENT_PERMISSIONS),
  validate({ params: adminAnnouncementIdParams, body: retireAdminAnnouncementBody }),
  asyncHandler(async (req, res) => {
    const authority = announcementAuthority(requireActor(req.actor));
    const { id } = getValidated(req, 'params', adminAnnouncementIdParams);
    const body = getValidated(req, 'body', retireAdminAnnouncementBody);
    res.status(200).json(await adminAnnouncementsService.retire(authority, id, body));
  }),
);
