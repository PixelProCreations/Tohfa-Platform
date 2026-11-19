/**
 * Pure figure mapping for the Super Admin home dashboard (the Overview tab of
 * SuperAdminDashboardScreen). No react-native import, so plain-Node vitest can
 * run it.
 *
 * Every figure on that screen is either a server value or the dash. The design
 * elements are never removed for a missing number (utils/noValue.ts): a card
 * whose figure has no endpoint, has not loaded, or failed carries
 * ADMIN_NO_VALUE. An unknown figure must never read as a real number, and
 * never as "0".
 *
 * Figures and their source:
 *   Total farmers        NO ENDPOINT. GET /admin/farmers is cursor-paged with
 *                        no `total`/`summary`, and summing a page would cap the
 *                        figure at the page size. Dash until the API grows a
 *                        count.
 *   Total customers      GET /admin/customers -> summary.total   customer.list.view
 *                        (a count over the whole visible set, not the page)
 *   Revenue (MTD)        GET /admin/finance/reports/revenue?from=<1st>&to=<today>
 *                        -> summary.total (Money)                finance.sales_income.view
 *   Warehouses active    GET /warehouses -> rows.isActive        warehouse.all.view
 *                        (listAllWarehouses follows `total`, so the count is exact)
 *   Payouts awaiting     NO COUNT. GET /admin/payouts exists (payout.view) but
 *                        returns a cursor page with no total. Dash.
 *   Admin accounts       NO ENDPOINT for pending account requests. Dash.
 *   Audits overdue       GET /admin/audits/compliance ->
 *                        counts.farmersWithoutCurrentQuarterAudit   audit.view
 *   Certs expiring       NO ENDPOINT. GET /admin/certifications has no expiry
 *                        filter and no count. Dash.
 */
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { countText } from './saOverviewFormat';

/** Whether /auth/me has answered yet. */
export type MeStatus = 'loading' | 'ready' | 'error';

/**
 * The name shown under the greeting: whatever /auth/me returned, always.
 * 'Super Administrator' IS a name when the server says so; it is never
 * swapped for a person. Before it arrives the greeting shows the loading
 * state, and a failed /auth/me shows the dash — never a placeholder name.
 */
export function greetingNameText(fullName: unknown, status: MeStatus): string {
  if (status === 'loading') return t('async.loading');
  if (status === 'error') return ADMIN_NO_VALUE;
  return typeof fullName === 'string' && fullName.trim() !== '' ? fullName.trim() : ADMIN_NO_VALUE;
}

/** Just the rows' `isActive` matters here. */
export interface ActiveFlagRow {
  isActive: boolean;
}

/**
 * "3 / 4" from the warehouse list; the dash while it is unknown. The list is
 * followed to its `total`, so both halves are exact rather than a page count.
 */
export function warehousesActiveText(rows: readonly ActiveFlagRow[] | undefined): string {
  if (rows === undefined) return ADMIN_NO_VALUE;
  const active = rows.filter((row) => row.isActive).length;
  return t('saShell.home.kpi.warehousesValue', { active: String(active), total: String(rows.length) });
}

/** A delta/trend line: no endpoint supplies one, so every delta on this screen is the dash. */
export const HOME_DELTA_NO_SOURCE = ADMIN_NO_VALUE;

/** A count figure for a card, or the dash. Re-exported so the screen has one import for figures. */
export { countText };
