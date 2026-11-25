/**
 * Live data for the Customers Management screen: one cursor list on
 * GET /admin/customers (customer.list.view), whose first page carries the
 * `summary` the metric cards read (BR-91e). A thin wrapper over the admin hooks
 * (../../api/hooks.ts); the decisions are in ./customersManagementLogic.ts.
 *
 * The key is this module's own ('customersManagement'), so the cache never
 * answers for another customers screen, and the warehouse is 'all' because the
 * list route takes no warehouseId: scope is the server's (BR-91, BR-30).
 */
import { listCustomers, type AdminCustomerListItemDto, type CustomerListPage } from '../../api/customers';
import { useCursorList, type CursorList } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import { RECENT_CUSTOMERS_LIMIT } from './customersManagementLogic';

const CUSTOMERS_MANAGEMENT_MODULE = 'customersManagement';

function keepRow(row: AdminCustomerListItemDto): AdminCustomerListItemDto {
  return row;
}

/** The customers matching `q` (undefined = all), first rows only; nothing is fetched while `enabled` is false. */
export function useCustomersManagementList(
  q: string | undefined,
  enabled: boolean,
): CursorList<AdminCustomerListItemDto, CustomerListPage> {
  return useCursorList<AdminCustomerListItemDto, AdminCustomerListItemDto, CustomerListPage>(
    adminKeys.scoped(CUSTOMERS_MANAGEMENT_MODULE, undefined, { resource: 'list', q: q ?? null }),
    (cursor, signal) => listCustomers({ q, cursor, limit: RECENT_CUSTOMERS_LIMIT }, signal),
    keepRow,
    { enabled },
  );
}
