/**
 * Source scan: the returns (RMA) screens read and write the live returns API
 * (plan phase 10), hold no design samples, offer no bank refund, and are
 * reachable from the Sub admin's More menu and from a customer issue. Hooks
 * and JSX cannot render in this plain-Node vitest, so the wiring is pinned by
 * reading the sources, as customers_wiring.test.ts does. The rules behind each
 * screen (BR-61 ordering, the summed inspection check, the zero-accept gate,
 * paise, the refund key) are tested on the pure mappers and the API module
 * (mappers_returns.test.ts, api_returns.test.ts).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = path.join(__dirname, '..', '..', '..');
const REPO = path.join(SRC, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
/** The source without comments, so "never offered" checks read code only. */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const RETURNS = 'roles/admin/screens/warehouse/returns-rma';

/** Every file the live returns flow renders or calls. */
const LIVE_RETURN_FILES = [
  'ReturnsFlow.tsx',
  'ReturnsParts.tsx',
  'ReturnsIssuesScreen.tsx',
  'RmaDetailScreen.tsx',
  'InspectProductScreen.tsx',
  'ReviewReturnRequestScreen.tsx',
  'ApproveReturnScreen.tsx',
  'ReturnApprovedScreen.tsx',
  'RejectReturnRequestScreen.tsx',
  'RequestRejectedScreen.tsx',
  'RefundStatusScreen.tsx',
  'RefundFailedScreen.tsx',
  'RefundCompletedScreen.tsx',
  'ReturnHistoryScreen.tsx',
  'useReturnsData.ts',
  'mappers.ts',
  'types.ts',
  'index.ts',
];

const FLOW = read(`${RETURNS}/ReturnsFlow.tsx`);
const DATA = read(`${RETURNS}/useReturnsData.ts`);
const REVIEW = code(read(`${RETURNS}/ReviewReturnRequestScreen.tsx`));
const DETAIL = code(read(`${RETURNS}/RmaDetailScreen.tsx`));
const INSPECT = code(read(`${RETURNS}/InspectProductScreen.tsx`));
const TYPES = code(read(`${RETURNS}/types.ts`));
const ISSUE_DETAIL = read('roles/admin/screens/warehouse/customers/CustomerIssueDetailScreen.tsx');
const CUSTOMERS_FLOW = read('roles/admin/screens/warehouse/customers/CustomersFlow.tsx');
const MORE = read('roles/admin/screens/warehouse/dashboard-home-more/MoreScreen.tsx');
const SUB_DASHBOARD = read('roles/admin/screens/dashboard/SubWarehouseAdminDashboardScreen.tsx');
const APP = read('roles/farmer/App.tsx');

function grant(codeName: string, role: string): string | undefined {
  const rbac = JSON.parse(fs.readFileSync(path.join(REPO, 'docs', 'rbac.json'), 'utf8')) as {
    permissions: { code: string; grants: Record<string, string> }[];
  };
  return rbac.permissions.find((p) => p.code === codeName)?.grants[role];
}

describe('no design samples on a live returns screen', () => {
  it.each(LIVE_RETURN_FILES)('%s imports no fixture', (file) => {
    expect(read(`${RETURNS}/${file}`)).not.toMatch(/from '\.\/fixtures'|\/fixtures'/);
  });

  it('the sample RMA records are gone', () => {
    expect(fs.existsSync(path.join(SRC, RETURNS, 'fixtures.ts'))).toBe(false);
    expect(SUB_DASHBOARD).not.toMatch(/RMA-00231|Rajesh Kumar|RmaRecord/);
  });
});

describe('BR-61: the flow follows the server state machine', () => {
  it('every action the detail offers comes from returnActions / approveGate, never a local status check', () => {
    expect(DETAIL).toMatch(/returnActions\(/);
    expect(REVIEW).toMatch(/approveGate\(/);
  });

  it('BR-61: Approve is drawn disabled with the reason when nothing was accepted, and Reject is still offered', () => {
    expect(REVIEW).toMatch(/disabled=\{!gate\.enabled/);
    expect(REVIEW).toMatch(/gate\.noteKey/);
    expect(REVIEW).toMatch(/actions\.reject/);
  });

  it('BR-61: the inspection form validates with inspectionBody (the summed per-item check) before it posts', () => {
    expect(INSPECT).toMatch(/inspectionBody\(/);
    expect(FLOW).toMatch(/inspectReturn|useInspectReturn/);
  });

  it('BR-61: there is no bank refund route, action or call (rma.refund.bank_process is none for both warehouse roles)', () => {
    expect(grant('rma.refund.bank_process', 'SUB_WH_ADMIN')).toBe('none');
    expect(grant('rma.refund.bank_process', 'MAIN_WH_ADMIN')).toBe('none');
    const routes = /export type ReturnsRoute =([^;]*);/.exec(TYPES)?.[1] ?? '';
    expect(routes).toMatch(/'RefundStatus'/);
    expect(routes).not.toMatch(/bank/i);
    for (const file of LIVE_RETURN_FILES) {
      expect({ file, bank: /refund\/bank|bank_process|refundBank|RefundBank|Bank Transfer/.test(code(read(`${RETURNS}/${file}`))) }).toEqual({
        file,
        bank: false,
      });
    }
  });
});

describe('BR-61d: the wallet refund is idempotent', () => {
  it('the refund hook takes its key from useIdempotencyKey, keyed on the return, and sends it', () => {
    expect(DATA).toMatch(/useIdempotencyKey\(\)/);
    expect(DATA).toMatch(/keyFor\(refundIdempotencyFingerprint\(returnId\)\)/);
    expect(DATA).toMatch(/refundReturnToWallet\(returnId, key\)/);
  });

  it('a failed refund is retried from the same route (same hook, same key), not a new screen', () => {
    expect(FLOW).toMatch(/function LiveRefundRoute/);
    expect(FLOW).toMatch(/<RefundFailedScreen/);
  });
});

describe('mounting: the Sub admin reaches the live returns', () => {
  it('the More menu row opens the returns queue through the host', () => {
    // The More row calls the host callback directly (the fake Alert fallback is gone).
    expect(MORE).toMatch(/case 'returns':\s*\n\s*onNavigateToReturns\?\.\(\);/);
    expect(APP).toMatch(/onNavigateToReturns=\{\(\) => navigate\('SubWarehouseReturnsIssues'\)\}/);
    expect(APP).toMatch(/SubWarehouseReturnsIssues: 'ReturnsIssues'/);
    expect(APP).toMatch(/SubWarehouseRmaDetail: 'RmaDetail'/);
  });

  it('a customer issue offers "View Return" with rma.request.process and opens that return by its id', () => {
    expect(ISSUE_DETAIL).toMatch(/onOpenReturn/);
    expect(CUSTOMERS_FLOW).toMatch(/can\('rma\.request\.process'\)/);
    expect(CUSTOMERS_FLOW).toMatch(/navigate\('RmaDetail', \{ issue: params\.issue \}\)/);
    expect(APP).toMatch(/navigate\('SubWarehouseRmaDetail', \{ returnId: p\.issue\?\.id \}\)/);
    expect(SUB_DASHBOARD).toMatch(/returnId: params\.issue\?\.id/);
  });

  it('the flow opens the detail by the return uuid only', () => {
    expect(FLOW).toMatch(/returnIdParam\(params\.returnId\)/);
  });
});
