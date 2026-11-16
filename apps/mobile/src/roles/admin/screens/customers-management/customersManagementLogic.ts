/**
 * Pure helpers for the Customers Management screen (no React, no react-native,
 * so plain-Node vitest covers them: tests/customers_management_logic.test.ts).
 *
 * The design (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen, Customers
 * Management) was drawn with fixture numbers. The owner's rule for this port is
 * "don't remove any designs": a figure the API cannot supply is drawn as the
 * one shared dash below, never hidden.
 */
import type { AdminCustomerListItemDto, CustomerListSummaryDto, CustomerType } from '../../api/customers';
import { t } from '../../i18n';
import { formatAdminDay } from '../../utils/datetime';

/** The one placeholder for a figure the API has no field for. Reused across this module. */
export const CUSTOMERS_MGMT_DASH = '—';

/** Permission for this screen (docs/rbac.json). */
export const CUSTOMER_LIST_PERMISSION = 'customer.list.view';

/** "Recent customers" shows the first rows of the list; this is how many are asked for. */
export const RECENT_CUSTOMERS_LIMIT = 5;

/** Typing pause before the search box is sent to the API as `q`. */
export const SEARCH_DEBOUNCE_MS = 300;

/** The API's `q` is 1-100 characters after trimming (api/customers.ts ListCustomersParams). */
const SEARCH_MAX_LENGTH = 100;

/** The design's six metric cards, in its order. */
export const METRIC_KEYS = ['total', 'newRegistrations', 'individual', 'business', 'recentOrders', 'detailsPending'] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

/** The design's period chips, in its order. Local state only: no endpoint takes a period yet. */
export const PERIOD_KEYS = ['thisWeek', 'lastWeek', 'thisMonth', 'last30Days', 'allTime'] as const;
export type PeriodKey = (typeof PERIOD_KEYS)[number];
export const DEFAULT_PERIOD: PeriodKey = 'thisWeek';

/** The search box text as the API's `q`: trimmed, undefined when empty, capped at the API's limit. */
export function searchParam(text: string): string | undefined {
  const trimmed = text.trim();
  return trimmed === '' ? undefined : trimmed.slice(0, SEARCH_MAX_LENGTH);
}

/**
 * Each card's figure. Total and New come from the list summary (BR-91e);
 * Individual, Business, Recent Orders and Business Details Pending have no API
 * field, so they are the dash. Before the summary has loaded every card is the dash.
 */
export function metricValue(key: MetricKey, summary: CustomerListSummaryDto | undefined): string {
  if (summary === undefined) return CUSTOMERS_MGMT_DASH;
  switch (key) {
    case 'total':
      return String(summary.total);
    case 'newRegistrations':
      return String(summary.new);
    default:
      return CUSTOMERS_MGMT_DASH;
  }
}

function typeLabel(type: CustomerType): string {
  switch (type) {
    case 'RETAIL':
      return t('customersMgmt.type.RETAIL');
    case 'B2B':
      return t('customersMgmt.type.B2B');
    case 'HORECA':
      return t('customersMgmt.type.HORECA');
    default:
      return t('customersMgmt.type.unknown');
  }
}

export type CustomerBadgeTone = 'active' | 'inactive';

export interface RecentCustomerView {
  id: string;
  /** "CUS-1011 · Lakshmi Narayan" */
  title: string;
  badgeLabel: string;
  badgeTone: CustomerBadgeTone;
  /** "Individual · ******0164 · Reg. 13 Oct 2026 · No preferred warehouse · No orders yet" */
  subtext: string;
  a11yLabel: string;
}

function ordersLabel(totalOrders: number): string {
  if (totalOrders <= 0) return t('customersMgmt.orders.none');
  return totalOrders === 1 ? t('customersMgmt.orders.one') : t('customersMgmt.orders.many', { count: totalOrders });
}

/**
 * One "Recent customers" card from a list row. The mobile is the server's
 * `mobileMasked` exactly as sent (BR-92); the full number is never read, even
 * when the row happens to carry it. The design's "Pending activation" badge has
 * no API state: the status is ACTIVE or INACTIVE (BR-98), so INACTIVE is
 * labelled as such in the badge's warning tone.
 */
export function toRecentCustomerView(row: AdminCustomerListItemDto): RecentCustomerView {
  const registered = formatAdminDay(row.createdAt);
  const parts = [
    typeLabel(row.customerType),
    row.mobileMasked,
    registered === '' ? undefined : t('customersMgmt.registered', { date: registered }),
    row.preferredWarehouseId === null ? t('customersMgmt.warehouse.none') : t('customersMgmt.warehouse.set'),
    ordersLabel(row.totalOrders),
  ].filter((part): part is string => part !== undefined);
  const active = row.status === 'ACTIVE';
  return {
    id: row.id,
    title: `${row.customerCode} · ${row.name}`,
    badgeLabel: active ? t('customersMgmt.badge.active') : t('customersMgmt.badge.inactive'),
    badgeTone: active ? 'active' : 'inactive',
    subtext: parts.join(' · '),
    a11yLabel: t('customersMgmt.customerA11y', { code: row.customerCode, name: row.name }),
  };
}
