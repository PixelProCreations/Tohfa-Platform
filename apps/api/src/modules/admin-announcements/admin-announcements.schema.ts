/**
 * Admin announcement authoring (BR-213). Zod schemas only, matching docs/openapi.yaml
 * `listAdminAnnouncements`, `createAdminAnnouncement`, `updateAdminAnnouncement`,
 * `retireAdminAnnouncement` and the `AdminAnnouncement*` schemas.
 *
 * The read half of the same table is `GET /system-messages` (BR-65, BR-134); it stays
 * untouched. These schemas describe the ADMIN view, which also shows scheduled, expired and
 * retired rows.
 */
import { z } from 'zod';
import { CURSOR_TAGS, decodeKeysetCursor } from '../../http/keysetCursor.js';

/**
 * `announcements.scope` (db/migrations/0008_platform.sql `announcements_scope_target_chk`).
 * All four values can be READ here; only two can be CREATED — see `CREATE_PERMISSION_BY_TARGET`.
 */
export const ANNOUNCEMENT_TARGETS = ['SYSTEM_WIDE', 'WAREHOUSE', 'ZONE', 'ROLE'] as const;
export type AnnouncementTarget = (typeof ANNOUNCEMENT_TARGETS)[number];

/**
 * The create permission for each target, from docs/rbac.json. The route admits a caller holding
 * EITHER code (`x-permission-any-of`); the service then requires the one for the requested target.
 *
 * SPEC GAP: docs/rbac.json defines a create code for SYSTEM_WIDE and WAREHOUSE only. There is no
 * `announcement.zone.create` or `announcement.role.create`, so this endpoint cannot author those
 * two targets — `target: 'ZONE'` / `'ROLE'` is refused 422 on `body.target`. Existing ZONE and
 * ROLE rows (seeded or written by another path) are still listed, edited and retired here under
 * the system-wide code, because only a holder of that `all` grant can see them.
 */
export const CREATE_PERMISSION_BY_TARGET = {
  SYSTEM_WIDE: 'announcement.system_wide.create',
  WAREHOUSE: 'announcement.warehouse.create',
} as const;

export const CREATABLE_TARGETS = ['SYSTEM_WIDE', 'WAREHOUSE'] as const;
export type CreatableTarget = (typeof CREATABLE_TARGETS)[number];

/**
 * BR-134: `announcements.type` (migration 0081). UNCONFIRMED value set: the owner has not defined
 * the kinds. Must stay equal to `SYSTEM_MESSAGE_TYPES` and to `announcements_type_chk`.
 */
export const ANNOUNCEMENT_TYPES = ['GENERAL', 'MAINTENANCE', 'ALERT', 'PROMOTION'] as const;
export type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number];

export const ANNOUNCEMENT_LOCALES = ['en', 'ta'] as const;

/**
 * Derived, never stored: the publication state the admin list shows.
 *  RETIRED   `deleted_at` is set (it was retired; see BR-213 on why retire is the soft delete)
 *  SCHEDULED `starts_at` is in the future
 *  EXPIRED   `ends_at` has passed
 *  ACTIVE    inside its window — exactly the rows BR-65 shows to readers
 * Checked in that order, so a retired future row reads RETIRED.
 */
export const ANNOUNCEMENT_STATUSES = ['SCHEDULED', 'ACTIVE', 'EXPIRED', 'RETIRED'] as const;
export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

export const adminAnnouncementIdParams = z.object({ id: z.string().uuid() }).strict();
export type AdminAnnouncementIdParams = z.infer<typeof adminAnnouncementIdParams>;

/* ---------------------------------------------------------------------------
 * List
 * ------------------------------------------------------------------------- */

export const listAdminAnnouncementsQuery = z
  .object({
    target: z.enum(ANNOUNCEMENT_TARGETS).optional(),
    status: z.enum(ANNOUNCEMENT_STATUSES).optional(),
    type: z.enum(ANNOUNCEMENT_TYPES).optional(),
    warehouseId: z.string().uuid().optional(),
    cursor: z
      .string()
      .max(512)
      .refine((raw) => decodeKeysetCursor(CURSOR_TAGS.adminAnnouncements, raw) !== null, {
        message: 'Invalid cursor.',
      })
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListAdminAnnouncementsQuery = z.infer<typeof listAdminAnnouncementsQuery>;

/* ---------------------------------------------------------------------------
 * Item
 * ------------------------------------------------------------------------- */

export const adminAnnouncement = z
  .object({
    id: z.string().uuid(),
    target: z.enum(ANNOUNCEMENT_TARGETS),
    /** Set only when `target` is WAREHOUSE. */
    warehouseId: z.string().uuid().nullable(),
    /** Set only when `target` is ZONE. Read-only here; this endpoint cannot author ZONE rows. */
    zoneId: z.string().uuid().nullable(),
    /** Set only when `target` is ROLE. Read-only here; this endpoint cannot author ROLE rows. */
    roleId: z.string().uuid().nullable(),
    type: z.enum(ANNOUNCEMENT_TYPES),
    title: z.string(),
    body: z.string(),
    locale: z.enum(ANNOUNCEMENT_LOCALES),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }).nullable(),
    status: z.enum(ANNOUNCEMENT_STATUSES),
    /** `announcements.deleted_at`, surfaced under its domain name. Null until retired. */
    retiredAt: z.string().datetime({ offset: true }).nullable(),
    createdBy: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();
export type AdminAnnouncement = z.infer<typeof adminAnnouncement>;

export const adminAnnouncementListResponse = z
  .object({
    items: z.array(adminAnnouncement),
    page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }).strict(),
  })
  .strict();
export type AdminAnnouncementListResponse = z.infer<typeof adminAnnouncementListResponse>;

/* ---------------------------------------------------------------------------
 * Create / update / retire
 * ------------------------------------------------------------------------- */

/** Bounds on free text, not business thresholds: they protect the column, nothing tunable. */
const title = z.string().trim().min(1).max(200);
const body = z.string().trim().min(1).max(5000);

export const createAdminAnnouncementBody = z
  .object({
    target: z.enum(CREATABLE_TARGETS),
    /** Required for WAREHOUSE, refused otherwise — `announcements_scope_target_chk`. */
    warehouseId: z.string().uuid().optional(),
    type: z.enum(ANNOUNCEMENT_TYPES).default('GENERAL'),
    title,
    body,
    locale: z.enum(ANNOUNCEMENT_LOCALES).default('en'),
    /** Omitted means "publish now" (the column defaults to `now()`). */
    startsAt: z.string().datetime({ offset: true }).optional(),
    /** Omitted means "runs until retired". */
    endsAt: z.string().datetime({ offset: true }).nullish(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.target === 'WAREHOUSE' && value.warehouseId === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['warehouseId'],
        message: 'warehouseId is required when target is WAREHOUSE.',
      });
    }
    if (value.target !== 'WAREHOUSE' && value.warehouseId !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['warehouseId'],
        message: 'warehouseId is only allowed when target is WAREHOUSE.',
      });
    }
    // `announcements_window_chk` is `ends_at > starts_at`. Refuse it here so the caller gets a
    // field-level 422 instead of the database's 500. The against-now case needs the clock, so the
    // service does it.
    if (
      value.startsAt !== undefined &&
      value.endsAt !== undefined &&
      value.endsAt !== null &&
      Date.parse(value.endsAt) <= Date.parse(value.startsAt)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'endsAt must be after startsAt.',
      });
    }
  });
export type CreateAdminAnnouncementBody = z.infer<typeof createAdminAnnouncementBody>;

/**
 * Retargeting is deliberately NOT editable: the target picks the permission, so moving a row from
 * WAREHOUSE to SYSTEM_WIDE would be a create under a code the caller may not hold. Retire it and
 * publish a new one.
 */
export const updateAdminAnnouncementBody = z
  .object({
    type: z.enum(ANNOUNCEMENT_TYPES).optional(),
    title: title.optional(),
    body: body.optional(),
    locale: z.enum(ANNOUNCEMENT_LOCALES).optional(),
    startsAt: z.string().datetime({ offset: true }).optional(),
    endsAt: z.string().datetime({ offset: true }).nullish(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required.' });
export type UpdateAdminAnnouncementBody = z.infer<typeof updateAdminAnnouncementBody>;

/** The body is optional: no body (or `{}`) retires without a reason. Mirrors the disable body. */
export const retireAdminAnnouncementBody = z.preprocess(
  (value) => value ?? {},
  z.object({ reason: z.string().trim().min(1).max(500).optional() }).strict(),
);
export type RetireAdminAnnouncementBody = z.infer<typeof retireAdminAnnouncementBody>;
