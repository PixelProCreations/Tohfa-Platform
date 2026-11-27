/**
 * UI-only placeholder data — replace with API when this tab is integrated.
 *
 * Nothing here comes from the backend. The values match the approved Verification & Compliance
 * design so the tab and its three dialogs can be reviewed and clicked through locally. When the
 * API exists these interfaces are to be replaced by the docs/openapi.yaml schemas and this file
 * deleted.
 */

export type CertificationStatusMock = 'VERIFIED' | 'EXPIRED' | 'UNVERIFIED';

export interface CertificationRecordMock {
  id: string;
  /** Scheme name shown as the card title, e.g. "PGS Organic". */
  name: string;
  /** Material Symbols ligature for the card's icon tile. */
  icon: string;
  certNo: string;
  issuedBy: string;
  /** ISO calendar dates (yyyy-mm-dd), no time component. */
  issueDate: string;
  expiryDate: string;
  lastVerifiedOn: string;
  verifiedBy: string;
  status: CertificationStatusMock;
  /** Host name of the issuing body's lookup portal. Display only — never navigated to. */
  portalHost: string;
}

export type ListingStatusMock = 'ACTIVE' | 'BLOCKED';

/** Tone of the coloured initial tile that stands in for a produce photo. */
export type ProduceToneMock = 'amber' | 'brown' | 'red' | 'green';

export interface CertificationListingMock {
  id: string;
  /** The certification this listing is tagged with. */
  certId: string;
  product: string;
  tone: ProduceToneMock;
  category: string;
  stockKg: number;
  status: ListingStatusMock;
}

export interface FarmerVerificationMock {
  certifications: CertificationRecordMock[];
  listings: CertificationListingMock[];
  /** Pre-filled text of the "Correct or remove a record" reason box, as in the design. */
  correctionReasonDraft: string;
}

export const FARMER_VERIFICATION_MOCK: FarmerVerificationMock = {
  certifications: [
    {
      id: 'cert-pgs',
      name: 'PGS Organic',
      icon: 'eco',
      certNo: 'PGS-TN-04821',
      issuedBy: 'PGS India Council',
      issueDate: '2024-08-30',
      expiryDate: '2027-08-30',
      lastVerifiedOn: '2025-11-04',
      verifiedBy: 'Demo Super Admin',
      status: 'VERIFIED',
      portalHost: 'pgsindia-ncof.gov.in',
    },
    {
      id: 'cert-npop',
      name: 'NPOP',
      icon: 'description',
      certNo: 'NPOP-2023-1187',
      issuedBy: 'APEDA',
      issueDate: '2023-09-24',
      expiryDate: '2026-09-24',
      lastVerifiedOn: '2025-09-02',
      verifiedBy: 'Demo Super Admin',
      status: 'EXPIRED',
      portalHost: 'apeda.gov.in',
    },
  ],
  listings: [
    { id: 'PL-0001', certId: 'cert-npop', product: 'Carrot', tone: 'amber', category: 'Vegetables', stockKg: 240, status: 'ACTIVE' },
    { id: 'PL-0002', certId: 'cert-npop', product: 'Potato', tone: 'brown', category: 'Vegetables', stockKg: 500, status: 'ACTIVE' },
    { id: 'PL-0003', certId: 'cert-npop', product: 'Tomato', tone: 'red', category: 'Vegetables', stockKg: 300, status: 'ACTIVE' },
    { id: 'PL-0004', certId: 'cert-npop', product: 'Spinach', tone: 'green', category: 'Leafy Greens', stockKg: 120, status: 'ACTIVE' },
    { id: 'PL-0005', certId: 'cert-pgs', product: 'Beans', tone: 'green', category: 'Vegetables', stockKg: 180, status: 'ACTIVE' },
    { id: 'PL-0006', certId: 'cert-pgs', product: 'Cabbage', tone: 'green', category: 'Vegetables', stockKg: 260, status: 'ACTIVE' },
  ],
  correctionReasonDraft: 'Certificate number was entered incorrectly at onboarding (demo).',
};
