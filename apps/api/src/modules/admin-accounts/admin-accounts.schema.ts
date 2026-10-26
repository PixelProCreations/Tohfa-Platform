/**
 * Admin account disable (BR-110). Zod schemas only, matching docs/openapi.yaml `disableAdminAccount`,
 * `DisableAdminAccountRequest` and `AdminAccountStatus`.
 */
import { z } from 'zod';

export const ACCOUNT_STATUSES = ['PENDING', 'ACTIVE', 'DISABLED'] as const;

export const adminAccountIdParams = z.object({ id: z.string().uuid() }).strict();

/** The body is optional: no body (or `{}`) disables without a reason. */
export const disableAdminAccountBody = z.preprocess(
  (value) => value ?? {},
  z.object({ reason: z.string().trim().min(1).max(500).optional() }).strict(),
);
export type DisableAdminAccountBody = z.infer<typeof disableAdminAccountBody>;

export const adminAccountStatus = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  status: z.enum(ACCOUNT_STATUSES),
  roles: z.array(z.string()),
  disabledAt: z.string().datetime({ offset: true }).nullable(),
  disabledBy: z.string().uuid().nullable(),
  disabledReason: z.string().nullable(),
});
export type AdminAccountStatus = z.infer<typeof adminAccountStatus>;

/* ---------------------------------------------------------------------------
 * Admin account creation (BR-28, BR-112): docs/openapi.yaml `createAdminAccount`,
 * `AdminAccountCreate` and `AdminAccountCreated`.
 * ------------------------------------------------------------------------- */

/**
 * The create permission for each role, from docs/rbac.json. The route admits a caller holding ANY
 * of them (`x-permission-any-of`); the service then requires the one for the requested role.
 */
export const CREATE_PERMISSION_BY_ROLE = {
  SUPER_ADMIN: 'admin.super_admin.create',
  TOHFA_ADMIN: 'admin.tohfa_admin.create',
  FARMER_ADMIN: 'admin.farmer_admin.create',
  MAIN_WH_ADMIN: 'admin.main_wh_admin.create',
  SUB_WH_ADMIN: 'admin.sub_wh_admin.create',
} as const;

export const CREATE_ROLES = ['SUPER_ADMIN', 'TOHFA_ADMIN', 'FARMER_ADMIN', 'MAIN_WH_ADMIN', 'SUB_WH_ADMIN'] as const;
export type CreateRole = (typeof CREATE_ROLES)[number];

/** The roles this endpoint actually creates; SUB_WH_ADMIN is refused (BR-112a). */
export const CREATED_ROLES = ['SUPER_ADMIN', 'TOHFA_ADMIN', 'FARMER_ADMIN', 'MAIN_WH_ADMIN'] as const;

/** E.164, the same pattern as the Sub Warehouse Admin create body. */
const mobile = z.string().regex(/^\+[1-9][0-9]{7,14}$/, 'Must be a valid E.164 mobile number (+91...)');

/**
 * Strict: no password, email, status or admin code can be sent. `zoneId` is optional in the schema
 * on purpose: whether it is required or refused depends on the role, which the service answers
 * with a field-level 422 (BR-112b).
 */
export const createAdminAccountBody = z
  .object({
    role: z.enum(CREATE_ROLES),
    fullName: z.string().trim().min(1).max(120),
    mobile,
    zoneId: z.string().uuid('zoneId must be a UUID').nullable().optional(),
  })
  .strict();
export type CreateAdminAccountBody = z.infer<typeof createAdminAccountBody>;

export const adminAccountCreated = z.object({
  userId: z.string().uuid(),
  adminCode: z.string(),
  fullName: z.string(),
  role: z.enum(CREATED_ROLES),
  status: z.literal('ACTIVE'),
  zoneIds: z.array(z.string().uuid()),
  assignedAt: z.string().datetime({ offset: true }),
});
export type AdminAccountCreated = z.infer<typeof adminAccountCreated>;

/* ---------------------------------------------------------------------------
 * Farmer Admin zones (BR-113): docs/openapi.yaml `setFarmerAdminZones`,
 * `FarmerAdminZonesRequest` and `FarmerAdminZones`.
 * ------------------------------------------------------------------------- */

/** The complete new zone set: non-empty, distinct. */
export const setFarmerAdminZonesBody = z
  .object({
    zoneIds: z
      .array(z.string().uuid('Each zone id must be a UUID'))
      .min(1, 'A Farmer Admin keeps at least one zone.')
      .refine((ids) => new Set(ids).size === ids.length, 'Zone ids must be distinct.'),
  })
  .strict();
export type SetFarmerAdminZonesBody = z.infer<typeof setFarmerAdminZonesBody>;

export const farmerAdminZones = z.object({
  userId: z.string().uuid(),
  zoneIds: z.array(z.string().uuid()),
});
export type FarmerAdminZones = z.infer<typeof farmerAdminZones>;
