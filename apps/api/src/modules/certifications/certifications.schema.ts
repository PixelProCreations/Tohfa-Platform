import { z } from 'zod';

export const CertificationType = {
  PGS: 'PGS',
  NPOP: 'NPOP',
  OTHER: 'OTHER',
} as const;
export type CertificationType = (typeof CertificationType)[keyof typeof CertificationType];

export const VerificationStatus = {
  UNVERIFIED: 'UNVERIFIED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const certificationIdParam = z.object({
  id: z.string().uuid(),
});
export type CertificationIdParam = z.infer<typeof certificationIdParam>;

/**
 * BR-02: the only certificate types that can qualify a farmer to list. OTHER is
 * recorded, shown and may be verified by an admin, but never qualifies on its
 * own. Both the per-certificate `blocksListings` flag and
 * recomputeFarmerMarketBlock read this one list so they cannot disagree, and
 * listings.service passes it to listings.repo getListingCertEligibility as a
 * bound SQL parameter, so the listing gate neither counts OTHER nor names an
 * OTHER certificate as pending or expired (BR-02i).
 */
export const LISTING_QUALIFYING_CERT_TYPES: readonly CertificationType[] = [
  CertificationType.PGS,
  CertificationType.NPOP,
];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * BR-48e: true only for a real calendar date written exactly as YYYY-MM-DD
 * (year 0001-9999). The regex alone let `2026-02-30` through to Postgres, which
 * rejected it as a 500 instead of a field-level 422.
 */
export function isCalendarDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!;
  return day <= daysInMonth;
}

const calendarDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });

/**
 * The fields a farmer keys in. Shared by POST (all required, except as marked)
 * and PATCH (every one optional) so the two cannot drift apart field by field.
 *
 * customTypeName (BR-48i) is nullable so PATCH can clear it when a certificate
 * moves from OTHER to PGS/NPOP; whether it must or must not be present depends
 * on certType, which is the cross-field check below.
 */
const certificationFields = {
  certType: z.enum(['PGS', 'NPOP', 'OTHER']),
  customTypeName: z.string().trim().min(1).max(80).nullable().optional(),
  certNumber: z.string().trim().min(1).max(80),
  issuingBody: z.string().trim().min(1).max(160),
  issuedOn: calendarDate,
  expiresOn: calendarDate,
  documentUrl: z.string().url().optional(),
};

/**
 * Static checks only. The checks that depend on today's date (issuedOn not in
 * the future, expiresOn within cert_expiry_max_past_days /
 * cert_expiry_max_future_days) need system_config and the clock, so they live
 * in certifications.service.ts (BR-48). PATCH validates its MERGED result with
 * this same schema (BR-49c), so a rule added here applies to both.
 */
export const certificationCreateSchema = z
  .object(certificationFields)
  .superRefine((data, ctx) => {
    // BR-48f, mirroring certifications_dates_chk (expires_on > issued_on). Only
    // compared once both are real dates; otherwise their own field errors say so.
    if (isCalendarDate(data.issuedOn) && isCalendarDate(data.expiresOn) && data.expiresOn <= data.issuedOn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'expiresOn must be after issuedOn',
        path: ['expiresOn'],
      });
    }

    // BR-48i, mirroring certifications_custom_type_name_chk. A blank name
    // already carries its own min-length error, so it is not reported twice.
    const name = data.customTypeName;
    if (data.certType === CertificationType.OTHER) {
      if (name === undefined || name === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Required when certType is OTHER: name the certification scheme.',
          path: ['customTypeName'],
        });
      }
    } else if (typeof name === 'string' && name.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must be null or omitted unless certType is OTHER.',
        path: ['customTypeName'],
      });
    }
  });
export type CertificationCreate = z.infer<typeof certificationCreateSchema>;

/**
 * PATCH /farmers/me/certifications/{id} (BR-49). Field-level checks only, each
 * exactly as on POST; the cross-field and date rules run in the service on the
 * merged result (stored row + this patch), because a single field cannot be
 * judged without the others (a new expiresOn against the stored issuedOn, a
 * certType change against the stored customTypeName). Unknown keys — farmerId,
 * verificationStatus — are stripped, so they can never reach the update.
 */
export const certificationUpdateSchema = z
  .object(certificationFields)
  .partial()
  .superRefine((data, ctx) => {
    if (Object.values(data).every((value) => value === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field must be provided.',
        path: [],
      });
    }
  });
export type CertificationUpdate = z.infer<typeof certificationUpdateSchema>;

export const verifyCertificationBody = z.object({
  portalReference: z.string().max(120).optional(),
  note: z.string().max(500).optional(),
});
export type VerifyCertificationBody = z.infer<typeof verifyCertificationBody>;

export const unverifyCertificationBody = z.object({
  reason: z.string().trim().min(5).max(500),
});
export type UnverifyCertificationBody = z.infer<typeof unverifyCertificationBody>;

export const listCertificationsQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListCertificationsQuery = z.infer<typeof listCertificationsQuery>;

// Admin list query — supports filtering by verification status and farmer
export const adminListCertificationsQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['UNVERIFIED', 'VERIFIED', 'REJECTED']).optional(),
  farmerId: z.string().uuid().optional(),
});
export type AdminListCertificationsQuery = z.infer<typeof adminListCertificationsQuery>;

export const farmerConfigResponse = z.object({
  certExpiryWarningDays: z.number().int().positive(),
  certExpiryMaxPastDays: z.number().int().nonnegative(),
  certExpiryMaxFutureDays: z.number().int().nonnegative(),
});
export type FarmerConfigResponse = z.infer<typeof farmerConfigResponse>;
