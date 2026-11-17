/**
 * Customer self-service profile (BR-160). Zod in/out, matching docs/openapi.yaml
 * `CustomerProfile`, `UpdateCustomerProfileRequest`, `CustomerGstDetailsRequest`,
 * `CustomerEmailOtpRequest`, `CustomerEmailVerifyRequest`.
 */
import { z } from 'zod';

export const genders = ['FEMALE', 'MALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;
export const customerTypes = ['RETAIL', 'B2B', 'HORECA'] as const;

/** Same pattern as the customers_gstin_format_chk CHECK in 0006. */
const gstin = z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/, 'gstin is not a valid GSTIN');

export const updateProfileBody = z
  .object({
    fullName: z.string().trim().min(1).max(120).optional(),
    age: z.number().int().min(13).max(120).nullable().optional(),
    gender: z.enum(genders).nullable().optional(),
    harvestPreferences: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
    /** An object key returned by POST /uploads; null removes the photo. */
    photoKey: z.string().trim().min(1).max(500).nullable().optional(),
    /** BR-191: the customer's own app language. */
    preferredLocale: z.enum(['en', 'ta']).optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'at least one field is required' });
export type UpdateProfileBody = z.infer<typeof updateProfileBody>;

export const gstDetailsBody = z
  .object({
    customerType: z.enum(customerTypes),
    businessName: z.string().trim().min(1).max(200).nullable().optional(),
    gstin: gstin.nullable().optional(),
  })
  .strict()
  .refine((b) => b.customerType === 'RETAIL' || (b.businessName ?? null) !== null, {
    message: 'businessName is required for B2B and HORECA accounts',
    path: ['businessName'],
  });
export type GstDetailsBody = z.infer<typeof gstDetailsBody>;

export const emailOtpBody = z.object({ email: z.string().trim().toLowerCase().email().max(254) }).strict();
export type EmailOtpBody = z.infer<typeof emailOtpBody>;

export const emailVerifyBody = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    code: z.string().regex(/^[0-9]{4,8}$/),
  })
  .strict();
export type EmailVerifyBody = z.infer<typeof emailVerifyBody>;

export const customerProfileSchema = z.object({
  id: z.string().uuid(),
  customerCode: z.string(),
  fullName: z.string(),
  mobile: z.string(),
  email: z.string().nullable(),
  emailVerified: z.boolean(),
  age: z.number().int().nullable(),
  gender: z.enum(genders).nullable(),
  harvestPreferences: z.array(z.string()),
  photoKey: z.string().nullable(),
  customerType: z.enum(customerTypes),
  businessName: z.string().nullable(),
  gstin: z.string().nullable(),
  gstVerified: z.boolean(),
  defaultAddressId: z.string().uuid().nullable(),
  preferredLocale: z.enum(['en', 'ta']),
  profileComplete: z.boolean(),
  missingFields: z.array(z.enum(['fullName', 'age', 'gender', 'harvestPreferences'])),
  createdAt: z.string(),
});
export type CustomerProfile = z.infer<typeof customerProfileSchema>;
/** What the repo returns; the service adds the derived completeness members (BR-190). */
export type CustomerProfileRecord = Omit<CustomerProfile, 'profileComplete' | 'missingFields'>;

export interface EmailOtpSentResponse {
  email: string;
  expiresAt: string;
}
