/**
 * UI-only placeholder data — replace with API when this screen is integrated.
 *
 * Mirrors the design SA-M3-S016 exactly. Nothing here is real, and none of it is a spec
 * (docs/openapi.yaml has no summary, total or document-status contract for this list yet).
 * Dates are ISO strings; format them in UTC so a day never shifts with the viewer's timezone.
 */

export type MockApplicationStatus =
  | 'PENDING_REVIEW'
  | 'REQUEST_DOCUMENT'
  | 'APPROVED'
  | 'AUDIT_SCHEDULED'
  | 'AUDIT_IN_PROGRESS'
  | 'AUDIT_COMPLETED'
  | 'FINAL_APPROVED'
  | 'REJECTED'
  | 'ON_HOLD';

export type MockDocumentStatus = 'COMPLETE' | 'INCOMPLETE';

export type MockZone = 'Ooty' | 'Coonoor' | 'Kotagiri' | 'Gudalur';

export type MockFarmingMethod = 'Natural' | 'Organic' | 'Biodynamic';

export type MockApplication = {
  applicationCode: string;
  name: string;
  mobile: string;
  zone: MockZone;
  farmingMethod: MockFarmingMethod;
  /** ISO calendar date (yyyy-MM-dd), interpreted as UTC. */
  submittedAt: string;
  documentStatus: MockDocumentStatus;
  status: MockApplicationStatus;
};

export type MockKpi = {
  key: 'TOTAL' | 'PENDING_REVIEW' | 'REQUEST_DOCUMENT' | 'APPROVED' | 'AUDIT_SCHEDULED' | 'REJECTED';
  value: number;
};

export const MOCK_KPIS: readonly MockKpi[] = [
  { key: 'TOTAL', value: 324 },
  { key: 'PENDING_REVIEW', value: 36 },
  { key: 'REQUEST_DOCUMENT', value: 18 },
  { key: 'APPROVED', value: 248 },
  { key: 'AUDIT_SCHEDULED', value: 17 },
  { key: 'REJECTED', value: 5 },
];

/** Grand total shown in the footer when no filter is active (the design's "324 applications"). */
export const MOCK_TOTAL_APPLICATIONS = 324;

export const MOCK_ZONES: readonly MockZone[] = ['Ooty', 'Coonoor', 'Kotagiri', 'Gudalur'];

export const MOCK_APPLICATIONS: readonly MockApplication[] = [
  // ---- Page 1 (as in the design) ----
  { applicationCode: 'APP-2026-0101', name: 'Sathish Kumar', mobile: '98765 11223', zone: 'Ooty', farmingMethod: 'Natural', submittedAt: '2026-10-12', documentStatus: 'COMPLETE', status: 'PENDING_REVIEW' },
  { applicationCode: 'APP-2026-0098', name: 'Geetha Palani', mobile: '97654 22334', zone: 'Coonoor', farmingMethod: 'Organic', submittedAt: '2026-10-10', documentStatus: 'INCOMPLETE', status: 'REQUEST_DOCUMENT' },
  { applicationCode: 'APP-2026-0094', name: 'Bala Subramaniam', mobile: '96543 33445', zone: 'Kotagiri', farmingMethod: 'Biodynamic', submittedAt: '2026-10-08', documentStatus: 'COMPLETE', status: 'APPROVED' },
  { applicationCode: 'APP-2026-0087', name: 'Anitha Murthy', mobile: '95432 44556', zone: 'Gudalur', farmingMethod: 'Organic', submittedAt: '2026-10-05', documentStatus: 'COMPLETE', status: 'AUDIT_SCHEDULED' },
  { applicationCode: 'APP-2026-0081', name: 'Ramu Perumal', mobile: '94321 55668', zone: 'Kotagiri', farmingMethod: 'Natural', submittedAt: '2026-10-03', documentStatus: 'COMPLETE', status: 'AUDIT_IN_PROGRESS' },
  { applicationCode: 'APP-2026-0076', name: 'Deepa Krishnan', mobile: '93210 66779', zone: 'Ooty', farmingMethod: 'Organic', submittedAt: '2026-09-30', documentStatus: 'INCOMPLETE', status: 'REJECTED' },
  { applicationCode: 'APP-2026-0070', name: 'Vignesh Raman', mobile: '92109 77890', zone: 'Coonoor', farmingMethod: 'Biodynamic', submittedAt: '2026-09-28', documentStatus: 'COMPLETE', status: 'AUDIT_COMPLETED' },
  { applicationCode: 'APP-2026-0063', name: 'Meena Ganesan', mobile: '91098 88901', zone: 'Gudalur', farmingMethod: 'Natural', submittedAt: '2026-09-25', documentStatus: 'COMPLETE', status: 'APPROVED' },
  { applicationCode: 'APP-2026-0058', name: 'Suresh Pandian', mobile: '90987 99012', zone: 'Kotagiri', farmingMethod: 'Organic', submittedAt: '2026-09-22', documentStatus: 'INCOMPLETE', status: 'ON_HOLD' },

  // ---- Page 2 (invented, plausible) ----
  { applicationCode: 'APP-2026-0052', name: 'Lakshmi Narayanan', mobile: '89876 10234', zone: 'Ooty', farmingMethod: 'Organic', submittedAt: '2026-09-19', documentStatus: 'COMPLETE', status: 'FINAL_APPROVED' },
  { applicationCode: 'APP-2026-0049', name: 'Karthik Selvam', mobile: '88765 21345', zone: 'Coonoor', farmingMethod: 'Natural', submittedAt: '2026-09-17', documentStatus: 'COMPLETE', status: 'PENDING_REVIEW' },
  { applicationCode: 'APP-2026-0045', name: 'Priya Venkatesh', mobile: '87654 32456', zone: 'Gudalur', farmingMethod: 'Biodynamic', submittedAt: '2026-09-15', documentStatus: 'INCOMPLETE', status: 'REQUEST_DOCUMENT' },
  { applicationCode: 'APP-2026-0041', name: 'Murugan Chellappa', mobile: '86543 43567', zone: 'Kotagiri', farmingMethod: 'Organic', submittedAt: '2026-09-12', documentStatus: 'COMPLETE', status: 'AUDIT_SCHEDULED' },
  { applicationCode: 'APP-2026-0038', name: 'Revathi Sundaram', mobile: '85432 54678', zone: 'Ooty', farmingMethod: 'Natural', submittedAt: '2026-09-10', documentStatus: 'COMPLETE', status: 'APPROVED' },
  { applicationCode: 'APP-2026-0034', name: 'Arjun Mohan', mobile: '84321 65789', zone: 'Coonoor', farmingMethod: 'Organic', submittedAt: '2026-09-08', documentStatus: 'INCOMPLETE', status: 'REJECTED' },
  { applicationCode: 'APP-2026-0031', name: 'Selvi Rajendran', mobile: '83210 76890', zone: 'Gudalur', farmingMethod: 'Biodynamic', submittedAt: '2026-09-05', documentStatus: 'COMPLETE', status: 'AUDIT_IN_PROGRESS' },
  { applicationCode: 'APP-2026-0027', name: 'Dinesh Babu', mobile: '82109 87901', zone: 'Kotagiri', farmingMethod: 'Natural', submittedAt: '2026-09-03', documentStatus: 'COMPLETE', status: 'AUDIT_COMPLETED' },
  { applicationCode: 'APP-2026-0023', name: 'Kavitha Ramesh', mobile: '81098 98012', zone: 'Ooty', farmingMethod: 'Organic', submittedAt: '2026-09-01', documentStatus: 'INCOMPLETE', status: 'ON_HOLD' },
];
