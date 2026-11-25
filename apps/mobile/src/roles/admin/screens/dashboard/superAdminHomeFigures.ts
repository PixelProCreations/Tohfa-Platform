/**
 * Pure figure mapping for the admin HOME dashboards: the Super Admin Overview
 * tab (SuperAdminDashboardScreen) and the Farmer Admin Home tab
 * (FarmerAdminDashboardScreen). No react-native import, so plain-Node vitest
 * can run it.
 *
 * Every figure is either a server value or the dash. Design elements are never
 * removed for a missing number (utils/noValue.ts): a card whose figure has no
 * endpoint, has not loaded, failed, or is not permitted carries
 * ADMIN_NO_VALUE. An unknown figure must never read as a real number, and
 * never as "0"; a real 0 is "0".
 *
 * Super Admin KPI cards (design: origin/Superadmin-main) and their source:
 *   Total Farmers         GET /admin/farmers/summary totalFarmers        farmer.profile.view_all
 *   Pending Applications  GET /admin/farmers/summary pendingApplications farmer.profile.view_all
 *   Active Farmers        GET /admin/farmers/summary activeFarmers       farmer.profile.view_all
 *   Deactivated Farmers   GET /admin/farmers/summary deactivatedFarmers  farmer.profile.view_all
 *                         (the server counts users.status = 'DISABLED')
 *   Pending Listings      GET /admin/listings?status=PENDING_APPROVAL     listing.queue.view_pending
 *                         The list has no total, so the count is shown only
 *                         when the whole queue fits in the loaded page(s)
 *                         (page.hasMore false); otherwise the dash.
 *   Active Audits         NO SOURCE CHOSEN. Which audits count as "active"
 *                         (IN_PROGRESS only? SCHEDULED + IN_PROGRESS?) is an
 *                         owner decision; dash until it is made.
 *   Total Customers       GET /admin/customers?limit=1 summary.total      customer.list.view
 *                         (a count over the whole visible set, not the page)
 *   Staff & Admins        NO ENDPOINT. /admin/accounts is POST-only; there is
 *                         no admin or combined staff+admin count. Dash.
 */
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { formatAdminTime } from '../../utils/datetime';
import { countText } from './saOverviewFormat';

/** Whether /auth/me has answered yet. */
export type MeStatus = 'loading' | 'ready' | 'error';

/**
 * The name shown in the greeting: whatever /auth/me returned, always.
 * 'Super Administrator' IS a name when the server says so; it is never
 * swapped for a person. Before it arrives the greeting shows the loading
 * state, and a failed /auth/me shows the dash — never a placeholder name.
 */
export function greetingNameText(fullName: unknown, status: MeStatus): string {
  if (status === 'loading') return t('async.loading');
  if (status === 'error') return ADMIN_NO_VALUE;
  return typeof fullName === 'string' && fullName.trim() !== '' ? fullName.trim() : ADMIN_NO_VALUE;
}

/** The farmer-summary fields the home cards read (GET /admin/farmers/summary). */
export interface HomeFarmerCounts {
  totalFarmers: number;
  pendingApplications: number;
  activeFarmers: number;
  deactivatedFarmers: number;
}

/** What the Super Admin home has loaded. `undefined` / `null`: not loaded, failed or not permitted. */
export interface SaHomeSources {
  farmerSummary: HomeFarmerCounts | undefined;
  customerTotal: number | undefined;
  /** An exact count (exactCount), or null when the queue is not fully known. */
  pendingListings: number | null;
}

/** The value of each of the 8 KPI cards, in the design's order. */
export interface SaHomeKpiValues {
  totalFarmers: string;
  pendingApplications: string;
  activeFarmers: string;
  deactivatedFarmers: string;
  pendingListings: string;
  activeAudits: string;
  totalCustomers: string;
  staffAndAdmins: string;
}

export function saHomeKpiValues(src: SaHomeSources): SaHomeKpiValues {
  const s = src.farmerSummary;
  return {
    totalFarmers: countText(s?.totalFarmers),
    pendingApplications: countText(s?.pendingApplications),
    activeFarmers: countText(s?.activeFarmers),
    deactivatedFarmers: countText(s?.deactivatedFarmers),
    pendingListings: countText(src.pendingListings),
    // Owner decision pending (see the header): never a number until then.
    activeAudits: ADMIN_NO_VALUE,
    totalCustomers: countText(src.customerTotal),
    // No endpoint: never a number.
    staffAndAdmins: ADMIN_NO_VALUE,
  };
}

/**
 * "Last updated 10:45 · All details", where the time is when the newest home
 * read last succeeded (TanStack Query's dataUpdatedAt, 0 = never). Nothing
 * loaded yet: the dash, never a made-up time.
 */
export function lastUpdatedText(updatedAt: readonly number[]): string {
  const latest = updatedAt.reduce((max, at) => (at > max ? at : max), 0);
  const time = latest > 0 ? formatAdminTime(new Date(latest)) : '';
  return t('homeDashboards.sa.lastUpdated', { time: time === '' ? ADMIN_NO_VALUE : time });
}

/** The bell badge: the server's unread total when above zero, otherwise no badge (null). */
export function unreadBadgeText(unread: unknown): string | null {
  return typeof unread === 'number' && Number.isInteger(unread) && unread > 0 ? String(unread) : null;
}

// ─── Farmer Admin home: pending-listing groups ───────────────────────────────

/** The listing-queue row fields the Farmer Admin home reads. */
export interface HomeListingRow {
  id: string;
  farmerName: string | null;
}

export interface HomeListingGroup<R extends HomeListingRow> {
  /** The farmer's name, or the dash when the row carries none (never invented). */
  farmer: string;
  rows: R[];
}

/** Loaded queue rows grouped by farmer, in first-seen order. */
export function groupListingsByFarmer<R extends HomeListingRow>(rows: readonly R[]): HomeListingGroup<R>[] {
  const groups = new Map<string, R[]>();
  for (const row of rows) {
    const farmer = row.farmerName ?? ADMIN_NO_VALUE;
    const list = groups.get(farmer);
    if (list) list.push(row);
    else groups.set(farmer, [row]);
  }
  return Array.from(groups, ([farmer, groupRows]) => ({ farmer, rows: groupRows }));
}

/**
 * "24 pending · 8 farmers". Both figures are exact only when the whole queue
 * is loaded (`exact` = exactCount's result); otherwise both are the dash, so a
 * page is never shown as a total.
 */
export function listingSummaryText(rows: readonly HomeListingRow[], exact: number | null): string {
  if (exact === null) return t('homeDashboards.fa.listings.summary', { pending: ADMIN_NO_VALUE, farmers: ADMIN_NO_VALUE });
  return t('homeDashboards.fa.listings.summary', {
    pending: String(exact),
    farmers: String(groupListingsByFarmer(rows).length),
  });
}

/** One farmer's "3 pending listings": exact only when the whole queue is loaded. */
export function farmerPendingText(count: number, queueComplete: boolean): string {
  return t('homeDashboards.fa.listings.farmerPending', { count: queueComplete ? String(count) : ADMIN_NO_VALUE });
}

/** The avatar initial for a farmer group; the dash for a row with no name. */
export function farmerInitial(farmer: string): string {
  return farmer === ADMIN_NO_VALUE ? ADMIN_NO_VALUE : farmer.charAt(0).toUpperCase();
}

/** A count figure for a card, or the dash. Re-exported so the screens have one import for figures. */
export { countText };
