/**
 * Placeholder data for Verification & Compliance (UI only — docs/openapi.yaml has no certification
 * list endpoint yet). Replace with the API response when it exists.
 */
export type CertificationStatus = 'EXPIRED' | 'VERIFIED' | 'PENDING' | 'EXPIRING_SOON';

export interface CertificationRow {
  readonly id: string;
  readonly farmerName: string;
  readonly certType: string;
  readonly certNumber: string;
  readonly authority: string;
  readonly issuedDate: string;
  readonly expiryDate: string;
  readonly status: CertificationStatus;
}

export const COMPLIANCE_KPIS = { total: 284, verified: 248, pending: 27, expired: 9 } as const;

/** Total shown in the footer — the design's full count, not the sample length. */
export const COMPLIANCE_TOTAL = 284;

export const COMPLIANCE_MOCK: readonly CertificationRow[] = [
  { id: 'c1', farmerName: 'Ramesh Kumar', certType: 'Organic Certification', certNumber: 'OC-2024-1182', authority: 'INDOCERT', issuedDate: '10 Jan 2024', expiryDate: '10 Jan 2026', status: 'EXPIRED' },
  { id: 'c2', farmerName: 'Lakshmi Devi', certType: 'Organic Certification', certNumber: 'OC-2025-0341', authority: 'INDOCERT', issuedDate: '14 Mar 2025', expiryDate: '14 Mar 2027', status: 'VERIFIED' },
  { id: 'c3', farmerName: 'Selvam Raj', certType: 'Biodynamic (Demeter)', certNumber: 'BD-2025-0098', authority: 'Demeter India', issuedDate: '02 Sep 2025', expiryDate: '02 Sep 2027', status: 'PENDING' },
  { id: 'c4', farmerName: 'Murugan Devi', certType: 'Organic Certification', certNumber: 'OC-2023-0877', authority: 'ICCOA', issuedDate: '18 Jun 2023', expiryDate: '18 Jun 2026', status: 'EXPIRING_SOON' },
];
