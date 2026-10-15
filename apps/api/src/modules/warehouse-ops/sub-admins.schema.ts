/**
 * BR-81: Sub Warehouse Admin staffing. Must match docs/openapi.yaml (`/admin/sub-warehouse-admins`).
 *
 * The create body deliberately has no role, email, password, status, admin code or standby flag:
 * this endpoint can only ever create a SUB_WH_ADMIN (BR-28), bound to exactly ONE warehouse (BR-25);
 * the account starts ACTIVE with NO password and sets one through the existing forgot-password flow.
 * `warehouseId` is optional in the schema on purpose: the service answers a missing one with the
 * domain error `WAREHOUSE_REQUIRED` that BR-25a names, not a generic validation failure.
 */
import { z } from 'zod';

/** E.164, the same pattern as every other mobile field in the API. */
const mobile = z.string().regex(/^\+[1-9][0-9]{7,14}$/, 'Must be a valid E.164 mobile number (+91...)');

export const createSubAdminBody = z
  .object({
    fullName: z.string().trim().min(1).max(120),
    mobile,
    warehouseId: z.string().uuid('warehouseId must be a UUID').nullable().optional(),
  })
  .strict();
export type CreateSubAdminBody = z.infer<typeof createSubAdminBody>;

export const listSubAdminsQuery = z
  .object({
    warehouseId: z.string().uuid('warehouseId must be a UUID').optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListSubAdminsQuery = z.infer<typeof listSubAdminsQuery>;

export const userStatuses = ['PENDING', 'ACTIVE', 'DISABLED'] as const;

/** One live Sub Warehouse Admin assignment. No mobile, no email: the list is not a contact directory. */
export const subAdminResponse = z.object({
  userId: z.string().uuid(),
  adminCode: z.string().nullable(),
  fullName: z.string(),
  status: z.enum(userStatuses),
  warehouseId: z.string().uuid(),
  assignedAt: z.string(),
});
export type SubAdmin = z.infer<typeof subAdminResponse>;

export const createdSubAdminResponse = subAdminResponse.extend({ adminCode: z.string() });
export type CreatedSubAdmin = z.infer<typeof createdSubAdminResponse>;

export const listSubAdminsResponse = z.object({
  items: z.array(subAdminResponse),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
export type ListSubAdminsResponse = z.infer<typeof listSubAdminsResponse>;
