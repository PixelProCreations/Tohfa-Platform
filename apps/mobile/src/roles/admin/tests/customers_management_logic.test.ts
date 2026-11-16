/**
 * Customers Management (screens/customers-management): the pure mapping.
 * Real figures come from the list summary; every figure with no API field is
 * the one shared dash, so a card is never dropped (owner rule: don't remove any design).
 */
import { describe, expect, it } from 'vitest';
import type { AdminCustomerListItemDto } from '../api/customers';
import {
  CUSTOMERS_MGMT_DASH,
  METRIC_KEYS,
  PERIOD_KEYS,
  metricValue,
  searchParam,
  toRecentCustomerView,
} from '../screens/customers-management/customersManagementLogic';

const SUMMARY = { total: 18, active: 12, new: 2 };

function row(overrides: Partial<AdminCustomerListItemDto> = {}): AdminCustomerListItemDto {
  return {
    id: 'c1',
    customerCode: 'CUS-1011',
    name: 'Lakshmi Narayan',
    mobileMasked: '******0164',
    customerType: 'RETAIL',
    status: 'ACTIVE',
    isNew: true,
    preferredWarehouseId: null,
    totalOrders: 0,
    lastActivityAt: null,
    piiMasked: true,
    createdAt: '2026-10-13T05:00:00.000Z',
    ...overrides,
  };
}

describe('Customers Management metrics', () => {
  it('has the design six cards in order', () => {
    expect(METRIC_KEYS).toEqual(['total', 'newRegistrations', 'individual', 'business', 'recentOrders', 'detailsPending']);
  });

  it('shows Total and New from the summary', () => {
    expect(metricValue('total', SUMMARY)).toBe('18');
    expect(metricValue('newRegistrations', SUMMARY)).toBe('2');
  });

  it('shows the dash, not a hidden card, for the four figures with no API field', () => {
    for (const key of ['individual', 'business', 'recentOrders', 'detailsPending'] as const) {
      expect(metricValue(key, SUMMARY)).toBe(CUSTOMERS_MGMT_DASH);
    }
  });

  it('shows the dash everywhere before the summary has loaded', () => {
    for (const key of METRIC_KEYS) expect(metricValue(key, undefined)).toBe(CUSTOMERS_MGMT_DASH);
  });
});

describe('Customers Management search and period', () => {
  it('trims the search and sends nothing when empty', () => {
    expect(searchParam('  ')).toBeUndefined();
    expect(searchParam(' priya ')).toBe('priya');
    expect(searchParam('x'.repeat(150))).toHaveLength(100);
  });

  it('has the design five period chips in order', () => {
    expect(PERIOD_KEYS).toEqual(['thisWeek', 'lastWeek', 'thisMonth', 'last30Days', 'allTime']);
  });
});

describe('Customers Management recent customer card', () => {
  it('BR-92: shows the masked mobile exactly as the server sent it, never the full number', () => {
    const view = toRecentCustomerView(row({ mobile: '+919876500164' }));
    expect(view.subtext).toContain('******0164');
    expect(view.subtext).not.toContain('9876500164');
  });

  it('builds the design title and subtext line', () => {
    const view = toRecentCustomerView(row());
    expect(view.title).toBe('CUS-1011 · Lakshmi Narayan');
    expect(view.subtext).toBe('Individual · ******0164 · Reg. 13 Oct 2026 · No preferred warehouse · No orders yet');
  });

  it('maps ACTIVE and INACTIVE to the success and warning badges', () => {
    expect(toRecentCustomerView(row({ status: 'ACTIVE' })).badgeTone).toBe('active');
    const inactive = toRecentCustomerView(row({ status: 'INACTIVE' }));
    expect(inactive.badgeTone).toBe('inactive');
    expect(inactive.badgeLabel).toBe('Inactive');
  });

  it('counts orders and notes a preferred warehouse', () => {
    expect(toRecentCustomerView(row({ totalOrders: 1, preferredWarehouseId: 'w1' })).subtext).toContain('Preferred warehouse set · 1 order');
    expect(toRecentCustomerView(row({ totalOrders: 4 })).subtext).toContain('4 orders');
  });
});
