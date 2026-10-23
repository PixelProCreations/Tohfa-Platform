/**
 * Source scan: every entry point into an area with no API (operational
 * issues, warehouse activity, documents, transfers), and into
 * Staff for a Sub admin, is behind isAreaAvailable. The screens themselves stay
 * in the code; only the button, row, tile or route that opens them is hidden.
 * Hooks and JSX cannot render in this plain-Node vitest, so the wiring is
 * pinned by reading the sources, as roles/farmer/tests/admin_login_signout.test.ts does.
 *
 * `guardedNear` checks that each line matching `anchor` has the guard on the
 * same line or within the `before` lines above it, and that the anchor occurs
 * at least once (so a renamed handler cannot make the check pass vacuously).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

const SUB_DASHBOARD = read('roles/admin/screens/dashboard/SubWarehouseAdminDashboardScreen.tsx');
const APP = read('roles/farmer/App.tsx');
const ORDER_ISSUE = read('roles/admin/screens/warehouse/orders/OrderIssueScreen.tsx');
const WAREHOUSE_INFO = read('roles/admin/screens/warehouse/profile-settings/WarehouseInfoScreen.tsx');
const OPERATIONS_HUB = read('roles/admin/screens/warehouse/storage-ops/WarehouseOperationsScreen.tsx');
const STORAGE_FLOW = read('roles/admin/screens/warehouse/storage-ops/StorageFlow.tsx');
const MORE = read('roles/admin/screens/warehouse/dashboard-home-more/MoreScreen.tsx');

function guardedNear(source: string, anchor: RegExp, guard: RegExp, before: number): string[] {
  const lines = source.split('\n');
  const hits = lines.flatMap((line, i) => (anchor.test(line) ? [i] : []));
  expect(hits.length, `anchor ${String(anchor)} not found`).toBeGreaterThan(0);
  return hits
    .filter((i) => !guard.test(lines.slice(Math.max(0, i - before), i + 1).join('\n')))
    .map((i) => `line ${i + 1}: ${lines[i]?.trim()}`);
}

const STAFF = /isAreaAvailable\('staff', can\)/;
const ISSUES = /isAreaAvailable\('operationalIssues', can\)/;
const ACTIVITY = /isAreaAvailable\('warehouseActivity', can\)/;
const TRANSFERS = /isAreaAvailable\('interWarehouseTransfers', can\)/;
const DOCUMENTS = /isAreaAvailable\('warehouseDocuments', can\)/;

describe('Sub warehouse dashboard', () => {
  it('Staff: the More row handlers and the Staff Present module are gated on staff', () => {
    expect(SUB_DASHBOARD).toMatch(/onNavigateToStaff=\{isAreaAvailable\('staff', can\)/);
    expect(SUB_DASHBOARD).toMatch(/onNavigateToAttendance=\{isAreaAvailable\('staff', can\)/);
    expect(guardedNear(SUB_DASHBOARD, /setStaffEntry\(\{ screen: 'Attendance', filter: 'All' \}\)/, STAFF, 2)).toEqual([]);
  });

  it('Transfers: the transfer approval alert opens transfers only when available', () => {
    expect(guardedNear(SUB_DASHBOARD, /'InterWarehouseTransfer'/, TRANSFERS, 3)).toEqual([]);
  });

  it('Activity: the Activity quick action and the Recent Activity "View all" are gated', () => {
    expect(guardedNear(SUB_DASHBOARD, /setShowRecentActivity\(true\)/, ACTIVITY, 3)).toEqual([]);
  });

  it('Operational issues: every handler that opens the issues list is gated', () => {
    expect(guardedNear(SUB_DASHBOARD, /setStorageEntry\(\{ screen: 'OperationalIssues' \}\)/, ISSUES, 4)).toEqual([]);
  });
});

describe('Warehouse Operations hub (shared Main/Sub)', () => {
  it('tags every tile and quick action into a hidden area and filters on isAreaAvailable', () => {
    expect(OPERATIONS_HUB).toMatch(/isAreaAvailable\(item\.area, can\)/);
    const lines = OPERATIONS_HUB.split('\n');
    const untagged = lines.filter(
      (l) =>
        /\{ label: .*onPress: (onOpenIssues|\(\) => onOpenActivity|\(\) => onOpenModule\('staff'\))/.test(l) &&
        !/area: '(operationalIssues|warehouseActivity|staff)'/.test(l),
    );
    expect(untagged).toEqual([]);
  });

  it('uses the raw handlers only in tagged tiles or in links that are undefined when the area is hidden', () => {
    // Outside the props interface and the destructuring, every reference to a
    // handler into a hidden area must be a tile tagged with its area (filtered
    // on isAreaAvailable) or the one alias that is undefined when it is hidden.
    const body = OPERATIONS_HUB.slice(OPERATIONS_HUB.indexOf('}: WarehouseOperationsScreenProps) {'));
    const raw = /\b(onOpenIssues|onOpenActivity|onSelectActivity)\b|onOpenModule\('staff'\)/;
    const unguarded = body
      .split('\n')
      .filter((l) => raw.test(l))
      .filter((l) => !/area: '(operationalIssues|warehouseActivity|staff)'/.test(l))
      .filter((l) => !/^\s*const \w+Link = \w+Available \? on\w+ : undefined;$/.test(l));
    expect(unguarded).toEqual([]);
    expect(OPERATIONS_HUB).toMatch(/const issuesAvailable = isAreaAvailable\('operationalIssues', can\)/);
    expect(OPERATIONS_HUB).toMatch(/const activityAvailable = isAreaAvailable\('warehouseActivity', can\)/);
  });

  it('StorageFlow refuses routes of hidden areas', () => {
    expect(STORAGE_FLOW).toMatch(/storageRouteArea\(route\)/);
    expect(STORAGE_FLOW).toMatch(/isAreaAvailable\(area, can\)/);
  });
});

describe('More screen (shared Main/Sub)', () => {
  it('shows the Warehouse Staff row only when the staff area is available', () => {
    expect(MORE).toMatch(/item\.id === 'staff'\) return isAreaAvailable\('staff', can\)/);
    expect(MORE).not.toMatch(/'warehouse\.staff\.list_view'/);
  });
});

describe('Orders', () => {
  it('"View Issue" on the issue confirmation is offered only when operational issues are available', () => {
    expect(ORDER_ISSUE).toMatch(/onViewIssue=\{isAreaAvailable\('operationalIssues', can\) \? handleViewIssue : undefined\}/);
  });
});

describe('Profile', () => {
  it('the Warehouse Documents row is gated on the documents area', () => {
    expect(guardedNear(WAREHOUSE_INFO, /onOpen\('Documents'\)/, DOCUMENTS, 1)).toEqual([]);
  });
});

describe('App.tsx (Sub shell routes and links)', () => {
  it('navigate() refuses a route key that opens a hidden area', () => {
    expect(APP).toMatch(/const area = warehouseAreaForScreen\(nextScreen\);\s*if \(area !== undefined && !isAreaAvailable\(area, warehouseCan\)\) return;/);
  });

  it('maps the transfer, staff, documents and storage-ops keys to their area', () => {
    expect(APP).toMatch(/screen === 'InterWarehouseTransfer' \|\| screen === 'InitiateNewTransfer'\) return 'interWarehouseTransfers'/);
    expect(APP).toMatch(/STAFF_ROUTE_ENTRY\[screen\] !== undefined\) return 'staff'/);
    expect(APP).toMatch(/PROFILE_ROUTE_ENTRY\[screen\] === 'Documents'\) return 'warehouseDocuments'/);
    expect(APP).toMatch(/storageRouteArea\(storage\.route\)/);
  });

  it('the links into hidden areas are gated where they are drawn', () => {
    // Sub transfer alert, the WarehouseMore staff rows, Main's Initiate transfer.
    expect(guardedNear(APP, /navigate\('InterWarehouseTransfer'/, /isAreaAvailable\('interWarehouseTransfers', warehouseCan\)/, 1)).toEqual([]);
    expect(guardedNear(APP, /navigate\('SubWarehouseStaff'\)/, /isAreaAvailable\('staff', warehouseCan\)/, 0)).toEqual([]);
    expect(guardedNear(APP, /navigate\('SubWarehouseAttendance'\)/, /isAreaAvailable\('staff', warehouseCan\)/, 0)).toEqual([]);
  });
});

describe('Inventory: stock counts and stock adjustments (permission-gated, BR-107 / BR-37)', () => {
  const INVENTORY = 'roles/admin/screens/warehouse/inventory';
  const FLOW = read(`${INVENTORY}/InventoryFlow.tsx`);
  const LIVE_SCREENS = [
    'InventoryDashboardScreen',
    'StockListScreen',
    'ProductStockDetailScreen',
    'BatchListScreen',
    'BatchDetailScreen',
    'StockLedgerScreen',
    'StockAllocationDashboardScreen',
    'LowStockScreen',
  ].map((name) => ({ name, source: read(`${INVENTORY}/${name}.tsx`) }));
  const HIDDEN_ROUTE = /onNavigate\?\.\('M3S1[0-4]'|onNavigate\?\.\('M3S17'/;

  it('InventoryFlow refuses a hidden route (navigate and initial screen) and opens the dashboard', () => {
    expect(FLOW).toMatch(/const area = inventoryRouteArea\(screen\);\s*return area === undefined \|\| isAreaAvailable\(area, can\);/);
    expect(FLOW).toMatch(/if \(!isRouteAvailable\(screen\)\) return;/);
    expect(FLOW).toMatch(/const screen = isRouteAvailable\(current\.screen\) \? current\.screen : HOME_SCREEN;/);
  });

  it('every link from a live screen into verification or adjustments is behind canVerify / canAdjust', () => {
    const unguarded = LIVE_SCREENS.flatMap(({ name, source }) => {
      if (!HIDDEN_ROUTE.test(source)) return [];
      expect(source).toMatch(/const canVerify = isAreaAvailable\('stockCounts', can\);/);
      if (/'M3S1[34]'|'M3S17'/.test(source)) {
        expect(source).toMatch(/const canAdjust = isAreaAvailable\('stockAdjustments', can\);/);
      }
      return guardedNear(source, HIDDEN_ROUTE, /can(Verify|Adjust) \? \(/, 6).map((hit) => `${name} ${hit}`);
    });
    expect(unguarded).toEqual([]);
  });

  it('the live screens read no sample data and open neither the filters nor the movement-detail samples', () => {
    for (const { name, source } of LIVE_SCREENS) {
      expect({ name, fixtures: /from '\.\/fixtures'/.test(source) }).toEqual({ name, fixtures: false });
      expect({ name, filters: /'M3S16'/.test(source) }).toEqual({ name, filters: false });
      // M3S15 is now the live Movement Detail (design M3-16), rendered from the
      // tapped ledger row. Only the ledger may open it, and only with that row;
      // the sample screens themselves are deleted (movement_detail.test.ts).
      const opensMovement = /'M3S15'/.test(source);
      const withRow = /onNavigate\?\.\('M3S15', movementRouteParams\(movement\)\)/.test(source);
      expect({ name, movementDetail: opensMovement && !(name === 'StockLedgerScreen' && withRow) }).toEqual({ name, movementDetail: false });
    }
    expect(fs.existsSync(path.join(SRC, INVENTORY, 'StockMovementDetailScreen.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(SRC, INVENTORY, 'StockMovementReceiptScreen.tsx'))).toBe(false);
  });

  it('Sub dashboard: both verification entry points are gated on stockCounts', () => {
    expect(guardedNear(SUB_DASHBOARD, /setInventoryInitialScreen\('M3S10'\)/, /isAreaAvailable\('stockCounts', can\)/, 2)).toEqual([]);
  });

  it('App.tsx: the verification module link is gated, and the legacy inventory keys map to their area', () => {
    expect(guardedNear(APP, /initialInventoryScreen: 'M3S10'/, /isAreaAvailable\('stockCounts', warehouseCan\)/, 1)).toEqual([]);
    expect(APP).toMatch(/const inventory = INVENTORY_ROUTE_ENTRY\[screen\];\s*if \(inventory !== undefined\) return inventoryRouteArea\(inventory\);/);
  });
});

describe('Orders: cancel, issues, stock check and delivery (no API, phase 5); the invoice gated', () => {
  const ORDERS = 'roles/admin/screens/warehouse/orders';
  const FLOW = read(`${ORDERS}/OrdersFlow.tsx`);
  const LIVE_SCREENS = [
    'OrdersDashboardScreen',
    'OrdersListScreen',
    'OrderDetailScreen',
    'ReadyForPickupScreen',
    'OrderStatusHistoryScreen',
    'PackingScreen',
    'PickupOtpScreen',
  ].map((name) => ({ name, source: read(`${ORDERS}/${name}.tsx`) }));
  // M5S05 stock check, M5S13/M5S14 delivery, M5S16 issues, M5S17 cancel. M5S18
  // (order invoice) is live and gated; see the next-but-one test.
  const HIDDEN_ROUTE = /'M5S(05|13|14|16|17)'/;

  it('OrdersFlow refuses a hidden route (navigate and initial screen) and opens the dashboard', () => {
    expect(FLOW).toMatch(/const area = ordersRouteArea\(screen\);\s*return area === undefined \|\| isAreaAvailable\(area, can\);/);
    expect(FLOW).toMatch(/if \(!isRouteAvailable\(screen\)\) return;/);
    expect(FLOW).toMatch(/const screen = isRouteAvailable\(current\.screen\) \? current\.screen : HOME_SCREEN;/);
  });

  it('the live screens link to no hidden route and read no sample data', () => {
    for (const { name, source } of LIVE_SCREENS) {
      expect({ name, hidden: source.match(HIDDEN_ROUTE)?.[0] ?? null }).toEqual({ name, hidden: null });
      expect({ name, fixtures: /from '\.\/fixtures'/.test(source) }).toEqual({ name, fixtures: false });
    }
  });

  it('BR-36: the order detail offers View Invoice (M5S18) only through orderInvoiceEntry (an invoice id and invoice.view_own)', () => {
    const detail = read(`${ORDERS}/OrderDetailScreen.tsx`);
    expect(detail).toMatch(/const invoiceEntry = orderInvoiceEntry\(order, can\);/);
    expect(guardedNear(detail, /'M5S18'/, /invoiceEntry !== undefined \?/, 2)).toEqual([]);
    for (const { name, source } of LIVE_SCREENS.filter((s) => s.name !== 'OrderDetailScreen')) {
      expect({ name, invoice: /'M5S18'/.test(source) }).toEqual({ name, invoice: false });
    }
  });

  it('BR-20: the pickup OTP is never pre-filled', () => {
    const pickup = read(`${ORDERS}/PickupOtpScreen.tsx`);
    expect(pickup).toMatch(/const \[otp, setOtp\] = useState\(''\);/);
    expect(pickup).not.toMatch(/'4', '8', '2', '1'|4821'|otpDigits/);
  });
});
