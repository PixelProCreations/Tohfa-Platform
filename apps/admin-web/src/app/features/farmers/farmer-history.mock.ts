/**
 * UI-only placeholder data — replace with API when this tab is integrated.
 *
 * Nothing here comes from the backend. The 2026 entries match the approved Farmer History design;
 * the 2025 entries exist only so the year dropdown has something to switch to. When the API exists
 * these interfaces are to be replaced by the docs/openapi.yaml schemas and this file deleted.
 */

export type FarmerHistoryKindMock = 'LISTING_SUBMITTED' | 'AUDIT_COMPLETED' | 'RATING_UPDATED' | 'LISTING_APPROVED';

export interface FarmerHistoryEntryMock {
  id: string;
  kind: FarmerHistoryKindMock;
  title: string;
  description: string;
  /** ISO calendar date (yyyy-mm-dd), no time component. */
  date: string;
}

/** Newest first, the order the timeline renders in. */
export const FARMER_HISTORY_MOCK: readonly FarmerHistoryEntryMock[] = [
  {
    id: 'H-6',
    kind: 'LISTING_SUBMITTED',
    title: 'Produce listing submitted',
    description: 'Produce listing submitted for review and approval.',
    date: '2026-09-28',
  },
  {
    id: 'H-5',
    kind: 'AUDIT_COMPLETED',
    title: 'Farm audit completed',
    description: 'Farm audit completed and recorded in the system.',
    date: '2026-09-25',
  },
  {
    id: 'H-4',
    kind: 'RATING_UPDATED',
    title: 'Farmer rating updated',
    description: 'Farmer rating updated after audit assessment.',
    date: '2026-09-12',
  },
  {
    id: 'H-3',
    kind: 'LISTING_APPROVED',
    title: 'Produce listing approved',
    description: 'Produce listing approved for sale in the market.',
    date: '2026-09-05',
  },
  {
    id: 'H-2',
    kind: 'AUDIT_COMPLETED',
    title: 'Farm audit completed',
    description: 'Annual farm audit completed with no corrective actions.',
    date: '2025-10-18',
  },
  {
    id: 'H-1',
    kind: 'LISTING_SUBMITTED',
    title: 'Produce listing submitted',
    description: 'First produce listing submitted for review and approval.',
    date: '2025-08-02',
  },
];
