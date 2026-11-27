/**
 * UI-only placeholder data — replace with API when this tab is integrated.
 *
 * Nothing here comes from the backend. The values match the approved Payout tab design so the
 * screen can be reviewed and clicked through locally. When the API exists these interfaces are to
 * be replaced by the docs/openapi.yaml schemas and this file deleted.
 *
 * The summary card values are STATIC constants copied from the design, not derived from `rows`.
 * They deliberately disagree with the rows in one place: the design shows "Failed Payout ₹0" even
 * though PAY-0003 is Failed (₹6,200). Rather than silently "fix" the design, the cards keep the
 * designed numbers; the real values will come from the API.
 *
 * The All Dates filter is evaluated against `PAYOUT_REFERENCE_DATE`, never the real current date,
 * so the mock behaves the same whenever it is opened.
 */
import { parseMoney, type Money } from '@tohfa/shared-types';

export type PayoutStatusMock = 'SETTLED' | 'PAID' | 'FAILED' | 'PENDING';

export interface PayoutRowMock {
  payoutId: string;
  purchaseReference: string;
  /** ISO calendar date (yyyy-mm-dd), no time component. */
  date: string;
  /** Money string backed by integer paise — never a float. */
  amount: Money;
  paymentMethod: string;
  status: PayoutStatusMock;
}

export interface PayoutSummaryMock {
  totalPaid: Money;
  pendingPayout: Money;
  failedPayout: Money;
  /** ISO calendar date (yyyy-mm-dd). */
  lastPayoutDate: string;
}

export interface FarmerPayoutMock {
  summary: PayoutSummaryMock;
  rows: readonly PayoutRowMock[];
}

/** "Today" for the date-range filter (yyyy-mm-dd). Fixed so the mock is deterministic. */
export const PAYOUT_REFERENCE_DATE = '2026-11-20';

export const FARMER_PAYOUT_MOCK: FarmerPayoutMock = {
  summary: {
    totalPaid: parseMoney('25700.00'),
    pendingPayout: parseMoney('18500.00'),
    failedPayout: parseMoney('0.00'),
    lastPayoutDate: '2026-10-14',
  },
  rows: [
    {
      payoutId: 'PAY-0002',
      purchaseReference: 'PO-2026-0038',
      date: '2026-10-14',
      amount: parseMoney('18500.00'),
      paymentMethod: 'Bank Transfer (API)',
      status: 'SETTLED',
    },
    {
      payoutId: 'PAY-0001',
      purchaseReference: 'PO-2026-0021',
      date: '2026-10-02',
      amount: parseMoney('7200.00'),
      paymentMethod: 'Bank Transfer (API)',
      status: 'PAID',
    },
    {
      payoutId: 'PAY-0003',
      purchaseReference: 'PO-2026-0043',
      date: '2026-11-10',
      amount: parseMoney('6200.00'),
      paymentMethod: 'Bank Transfer (API)',
      status: 'FAILED',
    },
  ],
};
