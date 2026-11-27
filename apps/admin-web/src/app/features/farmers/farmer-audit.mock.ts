/**
 * UI-only placeholder data — replace with API when this tab is integrated.
 *
 * Nothing here comes from the backend. The values match the approved Audit tab design so the
 * screen can be reviewed locally. When the API exists these interfaces are to be replaced by the
 * docs/openapi.yaml schemas and this file deleted.
 */

export type CertificationStatusMock = 'VALID' | 'EXPIRING' | 'EXPIRED';
export type AuditStatusMock = 'PASSED' | 'CORRECTIVE_ACTION_REQUIRED' | 'FAILED';
export type CorrectiveActionStatusMock = 'OPEN' | 'CLOSED';

export interface CorrectiveActionMock {
  id: string;
  title: string;
  status: CorrectiveActionStatusMock;
}

export interface FarmerAuditMock {
  certificationStatus: CertificationStatusMock;
  /** ISO calendar date (yyyy-mm-dd), no time component. */
  certificationExpiry: string;
  latestAuditId: string;
  latestAuditStatus: AuditStatusMock;
  /** ISO calendar date (yyyy-mm-dd). */
  nextAuditDate: string;
  correctiveActions: CorrectiveActionMock[];
}

export const FARMER_AUDIT_MOCK: FarmerAuditMock = {
  certificationStatus: 'EXPIRED',
  certificationExpiry: '2026-09-24',
  latestAuditId: 'AUD-2026-40',
  latestAuditStatus: 'CORRECTIVE_ACTION_REQUIRED',
  nextAuditDate: '2026-12-13',
  correctiveActions: [{ id: 'CA-1', title: 'Open Corrective Action', status: 'OPEN' }],
};
