/**
 * UI-only placeholder data — replace with API when the subscription tab is integrated.
 *
 * Nothing here comes from the backend. The values match the approved Subscription tab design so
 * the screen can be reviewed and clicked through locally. When the API exists these interfaces are
 * to be replaced by the docs/openapi.yaml schemas and this file deleted.
 */
import { parseMoney, type Money } from '@tohfa/shared-types';

export type SubscriptionStatusMock = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';

export interface SubscriptionPlanMock {
  planName: string;
  status: SubscriptionStatusMock;
  /** ISO calendar dates (yyyy-mm-dd), no time component. */
  periodStart: string;
  periodEnd: string;
  /** Money string backed by integer paise — never a float. */
  amount: Money;
  billingCycle: 'YEAR' | 'MONTH';
}

export interface FreeTierUsageMock {
  listingsUsed: number;
  listingsLimit: number;
  storageDaysUsed: number;
  storageDaysLimit: number;
  /** ISO calendar date (yyyy-mm-dd). */
  resetsOn: string;
}

export interface FarmerSubscriptionMock {
  plan: SubscriptionPlanMock;
  freeTier: FreeTierUsageMock;
}

export const FARMER_SUBSCRIPTION_MOCK: FarmerSubscriptionMock = {
  plan: {
    planName: 'Annual subscription',
    status: 'ACTIVE',
    periodStart: '2025-11-01',
    periodEnd: '2026-11-20',
    amount: parseMoney('500.00'),
    billingCycle: 'YEAR',
  },
  freeTier: {
    listingsUsed: 5,
    listingsLimit: 5,
    storageDaysUsed: 7,
    storageDaysLimit: 7,
    resetsOn: '2026-11-01',
  },
};
