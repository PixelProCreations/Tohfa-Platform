/**
 * Source scan: the billing screens read the live invoices API (plan phase 7),
 * hold no design samples, and offer no way to generate an invoice (there is no
 * create-invoice route; sales and orders issue invoices). Hooks and JSX cannot
 * render in this plain-Node vitest, so the wiring is pinned by reading the
 * sources, as customers_wiring.test.ts does. The behaviour behind each screen
 * (paise, grams, status tables, the API paths, the signed download link) is
 * tested on the pure mappers and the API module (mappers_invoices.test.ts,
 * api_invoices.test.ts).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
/**
 * The source without comments: the docblocks name what is hidden ("Generate
 * Invoice", "Bill To", ...) on purpose, so the "never drawn" checks read code only.
 */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const BILLING = 'roles/admin/screens/warehouse/billing-invoices';

/** Every billing file the live flow renders, plus the flow, its parts and its data hooks. */
const LIVE_BILLING_FILES = [
  'BillingFlow.tsx',
  'BillingHubScreen.tsx',
  'InvoiceListScreen.tsx',
  'InvoiceDetailScreen.tsx',
  'InvoiceFiltersScreen.tsx',
  'BillingParts.tsx',
  'useBillingData.ts',
];

const FLOW = read(`${BILLING}/BillingFlow.tsx`);
const DATA = read(`${BILLING}/useBillingData.ts`);
const HUB = code(read(`${BILLING}/BillingHubScreen.tsx`));
const LIST = code(read(`${BILLING}/InvoiceListScreen.tsx`));
const DETAIL = code(read(`${BILLING}/InvoiceDetailScreen.tsx`));
const APP = read('roles/farmer/App.tsx');

/** The body of a top-level function declaration (up to the next top-level declaration). */
function functionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  expect(start, `function ${name} not found`).toBeGreaterThanOrEqual(0);
  const rest = source.slice(start + 1);
  const next = rest.search(/\n(export )?(function|const|interface|type) /);
  return next === -1 ? rest : rest.slice(0, next);
}

describe('no design samples on a live billing screen', () => {
  it.each(LIVE_BILLING_FILES)('%s imports no fixture', (file) => {
    expect(read(`${BILLING}/${file}`)).not.toMatch(/from '\.\/fixtures'|\/fixtures'/);
  });

  it('the hub, list and detail have no sample invoice numbers or amounts', () => {
    for (const source of [HUB, LIST, DETAIL]) {
      expect(source).not.toMatch(/INV-2026-|ORD-2026-|₹2,100|Arun Kumar|SAMPLE_|INITIAL_INVOICES/);
    }
  });
});

describe('no invoice generation (no create-invoice route)', () => {
  it('BillingFlow refuses the generation routes (navigate and initial screen) and opens the hub', () => {
    expect(FLOW).toMatch(/const area = billingRouteArea\(screen\);\s*return area === undefined \|\| isAreaAvailable\(area, can\);/);
    expect(FLOW).toMatch(/if \(!isRouteAvailable\(screen\)\) return;/);
    expect(FLOW).toMatch(/const screen = isRouteAvailable\(current\.screen\) \? current\.screen : HOME_SCREEN;/);
  });

  it('no live billing screen offers Generate Invoice or the Invoice Required card', () => {
    for (const source of [HUB, LIST, DETAIL]) {
      expect(source).not.toMatch(/Generate Invoice|onGenerateInvoice|INVOICE REQUIRED|Invoice Required/);
    }
  });

  it('App.tsx refuses the legacy generation route keys through billingRouteArea', () => {
    expect(APP).toMatch(/const billing = BILLING_ROUTE_ENTRY\[screen\];\s*if \(billing !== undefined\) return billingRouteArea\(billing\);/);
  });
});

describe('the live data (BR-30, BR-36)', () => {
  it('the list is the server list, filtered only by the spec type filter; it never sends a warehouse', () => {
    expect(DATA).toMatch(/adminKeys\.scoped\(INVOICES, warehouseId/);
    expect(DATA).toMatch(/listInvoices\(\{ cursor, type \}, signal\)/);
    expect(DATA).not.toMatch(/listInvoices\(\{[^}]*warehouseId/);
  });

  it('an invoice route needs the invoice uuid (invoiceIdParam); nothing is fetched without one', () => {
    expect(functionBody(FLOW, 'LiveInvoiceDetail')).toMatch(/const invoiceId = invoiceIdParam\(requested\);/);
    expect(functionBody(FLOW, 'LiveInvoiceDetail')).toMatch(/notFound=\{invoiceId === undefined\}/);
    expect(DATA).toMatch(/enabled: invoiceId !== undefined/);
  });

  it('BR-36: Download opens the signed link from GET /invoices/{id}/download?redirect=true, nothing else', () => {
    expect(DATA).toMatch(/Linking\.openURL\(await getInvoiceDownloadUrl\(invoiceId\)\)/);
    expect(DETAIL).not.toMatch(/Invoice downloaded|Alert\.alert\('Share'/);
  });

  it('the history chips are the server type filter', () => {
    expect(functionBody(FLOW, 'LiveListRoute')).toMatch(/useInvoiceList\(warehouseId, historyTypeFilter\(chip\)\)/);
  });
});

describe('hidden: what the API cannot back', () => {
  it('the detail shows no customer, payment, timeline or generated-by fields (the invoice API carries none)', () => {
    expect(DETAIL).not.toMatch(/Bill To|Payment Information|Invoice Timeline|Generated By|customerPhone/);
  });

  it('the detail offers no Share action (the signed link expires in 5 minutes)', () => {
    expect(DETAIL).not.toMatch(/label="Share"/);
  });

  it('the list opens no filters screen (the API filters by type and date only; the chips cover type)', () => {
    expect(LIST).not.toMatch(/onOpenFilters/);
    expect(functionBody(FLOW, 'LiveListRoute')).not.toMatch(/navigate\('InvoiceFilters'/);
  });

  it('the hub shows no invoice KPI tiles (there is no invoice summary endpoint)', () => {
    expect(HUB).not.toMatch(/Today's Invoices|Invoice Value|TODAY'S INVOICES/);
  });
});
