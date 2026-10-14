/**
 * Source scan: the customer screens and the customer wallet read the live
 * customers API (plan phase 6), hold no design samples, link to the real order
 * detail by uuid, and offer no wallet write. Hooks and JSX cannot render in
 * this plain-Node vitest, so the wiring is pinned by reading the sources, as
 * availability_entrypoints.test.ts does. The behaviour behind each screen
 * (masking, paise, status tables, the API paths) is tested on the pure
 * mappers and the API module (mappers_customers.test.ts, api_customers.test.ts).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

const CUSTOMERS = 'roles/admin/screens/warehouse/customers';
const WALLET = 'roles/admin/screens/warehouse/wallet-cashtopup';

/** Every customer screen the live flow renders, plus the flow and its parts. */
const LIVE_CUSTOMER_FILES = [
  'CustomersFlow.tsx',
  'CustomersListScreen.tsx',
  'CustomerDetailsScreen.tsx',
  'CustomerOrdersScreen.tsx',
  'PurchaseHistoryScreen.tsx',
  'CustomerIssuesScreen.tsx',
  'CustomerIssueDetailScreen.tsx',
  'SupportHistoryScreen.tsx',
  'CustomerSupportDetailScreen.tsx',
  'CustomersParts.tsx',
  'useCustomersData.ts',
];

const FLOW = read(`${CUSTOMERS}/CustomersFlow.tsx`);
const DATA = read(`${CUSTOMERS}/useCustomersData.ts`);
const DETAILS = read(`${CUSTOMERS}/CustomerDetailsScreen.tsx`);
const WALLET_SCREEN = read(`${WALLET}/CustomerWalletScreen.tsx`);
const WALLET_FLOW = read(`${WALLET}/WalletFlow.tsx`);
const SUB_DASHBOARD = read('roles/subwarehouse/screens/SubWarehouseAdminDashboardScreen.tsx');
const MAIN_DASHBOARD = read('roles/admin/screens/dashboard/MainWarehouseAdminDashboardScreen.tsx');
const APP = read('roles/farmer/App.tsx');

/** The body of a top-level function declaration (up to the next top-level declaration). */
function functionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  expect(start, `function ${name} not found`).toBeGreaterThanOrEqual(0);
  const rest = source.slice(start + 1);
  const next = rest.search(/\n(export )?(function|const|interface|type) /);
  return next === -1 ? rest : rest.slice(0, next);
}

describe('no design samples on a live customer screen', () => {
  it.each(LIVE_CUSTOMER_FILES)('%s imports no fixture', (file) => {
    expect(read(`${CUSTOMERS}/${file}`)).not.toMatch(/from '\.\/fixtures'|\/fixtures'/);
  });

  it('Customer Wallet imports no fixture and has no sample default', () => {
    expect(WALLET_SCREEN).not.toMatch(/fixtures'/);
    expect(WALLET_SCREEN).not.toMatch(/CUSTOMER_WALLET_TRANSACTIONS|SAMPLE_WALLET_CUSTOMER/);
  });
});

describe('Customer Wallet is live and read-only (BR-93)', () => {
  it('a customer with a uuid opens the live route, fed by the wallet summary and ledger hooks', () => {
    expect(WALLET_FLOW).toMatch(/customerIdParam\(params\.customer\?\.customerUuid\)/);
    const live = functionBody(WALLET_FLOW, 'LiveCustomerWalletRoute');
    expect(live).toMatch(/useCustomerWallet\(warehouseId, customerUuid\)/);
    expect(live).toMatch(/useCustomerWalletTxns\(warehouseId, customerUuid\)/);
    expect(live).not.toMatch(/CUSTOMER_WALLET_TRANSACTIONS|SAMPLE_/);
  });

  it('BR-93: the customer data hooks reach no wallet write; the reply is the only non-GET', () => {
    expect(DATA).not.toMatch(/adminPost|adminPatch|adminPut|createCashTopup|topup/i);
    const apiImports = /import \{([^}]*)\} from '\.\.\/\.\.\/\.\.\/api\/customers'/.exec(DATA)?.[1] ?? '';
    const calls = apiImports
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '' && !s.startsWith('type '));
    expect(calls.filter((name) => !/^(get|list)/.test(name))).toEqual(['replyToSupportTicket']);
  });

  it('BR-92: the wallet carries the masked mobile, and the uuid apart from the CUS- code', () => {
    const params = functionBody(WALLET_FLOW, 'walletParamsForCustomer');
    expect(params).toMatch(/mobile: customer\.mobileMasked \?\? customer\.phone/);
    expect(params).toMatch(/customerUuid/);
  });
});

describe('the customer list is the server search and summary', () => {
  it('search is the server q (debounced), and the KPIs are the server summary', () => {
    const list = functionBody(FLOW, 'LiveListRoute');
    expect(list).toMatch(/setQ\(customerSearchQuery\(searchText\)\)/);
    expect(list).toMatch(/useCustomerList\(warehouseId, q\)/);
    expect(list).toMatch(/summary=\{list\.summary\}/);
  });

  it('BR-30: the customer hooks key the cache by warehouse but never send one', () => {
    expect(DATA).toMatch(/adminKeys\.scoped\(CUSTOMERS, warehouseId/);
    expect(DATA).toMatch(/listCustomers\(\{ q, cursor \}, signal\)/);
    // The sub-resources are fetched by customer id, cursor and signal only.
    expect(DATA).toMatch(/list\(customerId \?\? '', \{ cursor \}, signal\)/);
  });
});

describe('hidden: what the API cannot do', () => {
  it('no live route opens the order or purchase filter screens (grade, crop, date, sort)', () => {
    expect(FLOW).not.toMatch(/navigate\('OrderFilters'|navigate\('PurchaseFilters'/);
  });

  it('BR-92a: Customer Details shows the e-mail only through contactActions, and has no edit or suspend', () => {
    expect(DETAILS).toMatch(/const contact = contactActions\(c\)/);
    expect(DETAILS).toMatch(/contact\.email \?/);
    expect(DETAILS).not.toMatch(/label="(Edit|Suspend)[^"]*"/);
    expect(DETAILS).not.toMatch(/onNavigateTo(Edit|Suspend|CustomerActions)/);
  });
});

describe('an order opens the Phase 5 order detail by its uuid', () => {
  it('the customer orders and purchases send the order uuid', () => {
    expect(functionBody(FLOW, 'LiveOrdersRoute')).toMatch(/navigate\('OrderDetail', \{[^}]*orderId: order\.id/);
    expect(functionBody(FLOW, 'LivePurchasesRoute')).toMatch(/navigate\('OrderDetail', \{[^}]*orderId: purchase\.orderId/);
  });

  it('every host opens the order detail from a customer screen with that uuid, never a sample number', () => {
    expect(SUB_DASHBOARD).toMatch(/initialParams=\{\{ orderId: p\.orderId, customerName: c\?\.name \}\}/);
    expect(MAIN_DASHBOARD).toMatch(/initialParams=\{\{ orderId: p\.orderId, customerName: p\.customer\?\.name \}\}/);
    expect(APP).toMatch(/navigate\('SubWarehouseOrderDetail', \{ orderId: p\.orderId/);
    for (const host of [SUB_DASHBOARD, MAIN_DASHBOARD]) {
      expect(host).not.toMatch(/orderId: p\.order\?\.orderNo/);
    }
    expect(APP).not.toMatch(/orderId: \(params\['orderNo'\] as string\) \|\| 'ORD-/);
  });
});
