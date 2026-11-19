/**
 * Admin-wide certification records (docs/openapi.yaml, BR-48/BR-51):
 *   GET /admin/certifications            certification.view
 *
 * The admin surface carries `farmerId` on every item; that is admin-only
 * context and never reaches a customer response (BR-16). Nothing here writes,
 * so there is no Idempotency-Key and no UI import.
 *
 * Only the read the audit records screen needs is defined. Verify / unverify
 * (`POST /admin/certifications/{id}/verify`) belong to the certifications
 * module and are deliberately not re-declared here.
 */
import type { Page } from '../../../shell/api/pagination';
import { adminGet } from './http';

export const CERTIFICATION_TYPES = ['PGS', 'NPOP', 'OTHER'] as const;
export type CertificationType = (typeof CERTIFICATION_TYPES)[number];

export const CERTIFICATION_VERIFICATION_STATUSES = ['UNVERIFIED', 'VERIFIED', 'REJECTED'] as const;
export type CertificationVerificationStatus = (typeof CERTIFICATION_VERIFICATION_STATUSES)[number];

/** docs/openapi.yaml `Certification`. Optional keys are the ones absent from its `required` list. */
export interface CertificationDto {
  id: string;
  farmerId: string;
  farmerName?: string;
  tohfaFarmerId?: string;
  certType: CertificationType;
  /** The scheme an OTHER certificate belongs to; always null for PGS and NPOP (BR-48i). */
  customTypeName: string | null;
  certNumber: string;
  issuingBody?: string;
  /** YYYY-MM-DD. */
  issuedOn?: string;
  /** YYYY-MM-DD. */
  expiresOn: string;
  documentUrl?: string | null;
  verificationStatus: CertificationVerificationStatus;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
  /** Negative once expired. */
  daysToExpiry?: number;
  /** Per certificate only (BR-01/BR-02); not the farmer's eligibility. */
  blocksListings: boolean;
  createdAt: string;
}

export type CertificationListPage = Page<CertificationDto>;

export interface ListCertificationsParams {
  farmerId?: string | undefined;
  status?: CertificationVerificationStatus | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

/** Certifications across all farmers, cursor paged; filter by `farmerId` for one farmer's record. */
export function listCertifications(
  params: ListCertificationsParams = {},
  signal?: AbortSignal,
): Promise<CertificationListPage> {
  return adminGet<CertificationListPage>(
    '/admin/certifications',
    {
      farmerId: params.farmerId,
      status: params.status,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}
