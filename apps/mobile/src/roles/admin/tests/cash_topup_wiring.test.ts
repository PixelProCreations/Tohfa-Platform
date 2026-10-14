/**
 * Source scan: the cash top-up wizard is live (plan phase 9) and reachable.
 * Hooks and JSX cannot render in this plain-Node vitest, so the wiring is
 * pinned by reading the sources, as customers_wiring.test.ts does. The money
 * rules behind each screen (BR-18, BR-19, the key per top-up, the error copy)
 * are tested on the pure mappers and the API module (mappers_wallet.test.ts,
 * api_wallet.test.ts).
 *
 * The mount chain pinned here, for the Sub Warehouse Admin:
 *   Customer Details "Cash Top-Up" -> CustomersFlow navigate('CashTopUp')
 *     -> App.tsx onOpenExternal -> 'SubWarehouseCashTopUp' with the customer uuid
 *        (or the Sub dashboard's renderExternalScreen -> WalletFlow with walletParamsForCustomer)
 *     -> WalletFlow 'CashTopUp' with a live customer -> Fiscal Tag -> Confirm (POST) -> Success.
 *   Dashboard "Cash Top-Up" / the wallet hub -> WalletFlow 'CashTopUp' without a customer
 *     -> the live counter lookup first.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
/** The source without comments, so "never drawn" checks read code only. */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const WALLET = 'roles/admin/screens/warehouse/wallet-cashtopup';
const LIVE_WIZARD_FILES = ['CashTopUpScreen.tsx', 'FiscalTagScreen.tsx', 'ConfirmCashTopUpScreen.tsx', 'TopUpSuccessScreen.tsx', 'useWalletData.ts'];

const FLOW = read(`${WALLET}/WalletFlow.tsx`);
const DATA = read(`${WALLET}/useWalletData.ts`);
const CONFIRM = code(read(`${WALLET}/ConfirmCashTopUpScreen.tsx`));
const SUCCESS = code(read(`${WALLET}/TopUpSuccessScreen.tsx`));
const SEARCH = read('roles/admin/screens/warehouse/customers/CustomerSearchScreen.tsx');
const DETAILS = read('roles/admin/screens/warehouse/customers/CustomerDetailsScreen.tsx');
const CUSTOMERS_FLOW = read('roles/admin/screens/warehouse/customers/CustomersFlow.tsx');
const SUB_DASHBOARD = read('roles/subwarehouse/screens/SubWarehouseAdminDashboardScreen.tsx');
const APP = read('roles/farmer/App.tsx');

/** The body of a top-level function declaration (up to the next top-level declaration). */
function functionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  expect(start, `function ${name} not found`).toBeGreaterThanOrEqual(0);
  const rest = source.slice(start + 1);
  const next = rest.search(/\n(export )?(function|const|interface|type) /);
  return next === -1 ? rest : rest.slice(0, next);
}

describe('no design samples on the live cash top-up wizard', () => {
  it.each(LIVE_WIZARD_FILES)('%s imports no fixture and no sample', (file) => {
    const source = read(`${WALLET}/${file}`);
    expect(source).not.toMatch(/from '\.\/fixtures'/);
    expect(source).not.toMatch(/SAMPLE_|sampleProcessedBy/);
  });

  it('BR-18: Confirm no longer fakes the server round-trip or simulates failures', () => {
    expect(CONFIRM).not.toMatch(/setTimeout|MOCK_SUBMIT_MS|handleSimulate/);
  });

  it('Success claims no customer SMS: the 201 does not say one was sent', () => {
    expect(SUCCESS).not.toMatch(/notification sent/i);
  });
});

describe('the top-up write (root CLAUDE.md 2.4)', () => {
  it('posts through createCashTopup, keyed by useIdempotencyKey via submitCashTopup', () => {
    expect(DATA).toMatch(/useIdempotencyKey\(\)/);
    expect(DATA).toMatch(/submitCashTopup\(/);
    expect(DATA).toMatch(/post: createCashTopup/);
    expect(DATA).toMatch(/useAdminMutation/);
  });

  it('the key cache lives in the flow, so going back a step and returning reuses it for the same body', () => {
    expect(FLOW).toMatch(/useCashTopupSubmit\(\)/);
    const confirm = functionBody(FLOW, 'LiveConfirmRoute');
    expect(confirm).toMatch(/cashTopupErrorKey\(/);
    expect(confirm).toMatch(/isTopUpOutcomeUnknown\(/);
  });

  it('a success refetches the customer wallet and lookup', () => {
    expect(DATA).toMatch(/invalidates: \[adminKeys\.module\(CUSTOMERS\), adminKeys\.module\(WALLET\)\]/);
  });
});

describe('the counter lookup (BR-91)', () => {
  it('the lookup hook sends the mapped query, keyed by warehouse, enabled only with a query', () => {
    expect(DATA).toMatch(/lookupCustomers\(query/);
    expect(DATA).toMatch(/adminKeys\.scoped\(WALLET, warehouseId/);
    expect(DATA).toMatch(/enabled: query !== null/);
  });

  it('a top-up without a live customer starts at the lookup; the wallet search is the same live lookup', () => {
    const topUp = functionBody(FLOW, 'WalletFlow');
    expect(topUp).toMatch(/case 'CashTopUp'/);
    expect(FLOW).toMatch(/topUpCustomerFromWallet\(params\.customer\)/);
    expect(FLOW).toMatch(/<LiveCustomerLookupRoute/);
    expect(functionBody(FLOW, 'LiveCustomerLookupRoute')).toMatch(/customerLookupView\(/);
  });

  it('Customer Search draws the server results and the no-match copy in live mode', () => {
    expect(SEARCH).toMatch(/live\?: CustomerLookupLiveProps/);
    expect(SEARCH).toMatch(/LOOKUP_NO_MATCH_KEY/);
  });
});

describe('mounted: Customer Details and the dashboard reach the live top-up', () => {
  it('Customer Details shows Cash Top-Up only with wallet.cash_topup.process, and CustomersFlow opens CashTopUp', () => {
    expect(DETAILS).toMatch(/can\('wallet\.cash_topup\.process'\)/);
    expect(CUSTOMERS_FLOW).toMatch(/onNavigateToCashTopUp=\{\(\) => navigate\('CashTopUp'\)\}/);
  });

  it('App.tsx carries the customer uuid and masked mobile to the top-up route', () => {
    expect(APP).toMatch(/navigate\('SubWarehouseCashTopUp', \{[^}]*customerUuid: p\.customer\?\.id/);
    expect(APP).toMatch(/navigate\('SubWarehouseCashTopUp', \{[^}]*mobile: p\.customer\?\.mobileMasked/);
    expect(APP).toMatch(/SubWarehouseCashTopUp: 'CashTopUp'/);
    expect(APP).toMatch(/customerUuid: stringParam\(params\['customerUuid'\]\)/);
  });

  it('the Sub dashboard opens the shared flow with the customer from a customer screen', () => {
    expect(SUB_DASHBOARD).toMatch(/initialParams=\{walletParamsForCustomer\(c\)\}/);
  });

  it('the Sub dashboard Cash Top-Up quick action opens the top-up, not the wallet hub', () => {
    const quickAction = SUB_DASHBOARD.slice(0, SUB_DASHBOARD.indexOf('<CashTopUpActionIcon />\n                  <Text style={styles.quickActionLabel}>Cash Top-Up'));
    const handler = quickAction.slice(quickAction.lastIndexOf('onPress='));
    expect(handler).toMatch(/onNavigate\('SubWarehouseCashTopUp'\)/);
    expect(handler).not.toMatch(/WarehouseWalletOperations/);
  });
});
