/**
 * M9-05 GST Invoice and M9-04 Generate Invoice (designs 109 and 108).
 *
 * The Main hub's GST Invoice tile lists the live B2B invoices: the history
 * layout on its B2B chip, which is GET /invoices?type=SALE_B2B
 * (invoice.view_own). GST applies only to B2B and Horeca (BR-15), and an
 * existing GST invoice opens in the generic invoice detail. The design's
 * "GST Invoice Generation Restricted" notice stays out (it needs owner
 * sign-off), and nothing offers to generate one.
 *
 * Generate Invoice is excluded from the app (2026-10-23 triage, M9-04): there
 * is no create-invoice route, and the GenerateInvoice / InvoiceWizard /
 * InvoiceGenerated screens only hold sample data. BillingFlow refuses those
 * routes, so a deep link (App.tsx still maps the legacy keys) lands on the hub.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { EXCLUDED_BILLING_ROUTES, isBillingRouteExcluded } from '../screens/warehouse/availability';
import { GST_INVOICE_LIST_PARAMS, historyTypeFilter } from '../screens/warehouse/billing-invoices/mappers';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const BILLING = 'roles/admin/screens/warehouse/billing-invoices';
const FLOW = read(`${BILLING}/BillingFlow.tsx`);
const HUB_SOURCE = read(`${BILLING}/BillingHubScreen.tsx`);
const HUB = code(HUB_SOURCE);

function functionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  expect(start, `function ${name} not found`).toBeGreaterThanOrEqual(0);
  const rest = source.slice(start + 1);
  const next = rest.search(/\n(export )?(function|const|interface|type) /);
  return next === -1 ? rest : rest.slice(0, next);
}

describe('M9-05: the GST Invoice tile lists live B2B invoices', () => {
  it('BR-15: opens the history list on its B2B chip, which is the server filter type=SALE_B2B', () => {
    expect(GST_INVOICE_LIST_PARAMS).toEqual({ layout: 'history', historyChip: 'B2B' });
    expect(historyTypeFilter(GST_INVOICE_LIST_PARAMS.historyChip ?? 'All')).toBe('SALE_B2B');
  });

  it('the hub\'s GST tile has its own handler; the flow opens the list with GST_INVOICE_LIST_PARAMS', () => {
    expect(HUB).toMatch(/onPress=\{onNavigateToGstInvoices\}/);
    expect(functionBody(FLOW, 'LiveHubRoute')).toMatch(/onNavigateToGstInvoices=\{onOpenGstInvoices\}/);
    expect(FLOW).toMatch(/navigate\('InvoiceList', GST_INVOICE_LIST_PARAMS\)/);
  });

  it('the list route starts on the chip the route asked for (still the server type filter)', () => {
    const route = functionBody(FLOW, 'LiveListRoute');
    expect(route).toMatch(/useState<InvoiceHistoryChip>\(initialChip \?\? 'All'\)/);
    expect(route).toMatch(/useInvoiceList\(warehouseId, historyTypeFilter\(chip\)\)/);
    expect(FLOW).toMatch(/initialChip=\{params\.historyChip\}/);
  });

  it('shows no generation notice and offers no Generate action', () => {
    expect(HUB).not.toMatch(/Generation Restricted|Generate Invoice|onGenerate|invoice\.gst\.generate/);
  });

  it('the hub has no raw colour literal (#F0562A is adminColors.brand) and no numeric fontSize', () => {
    expect(HUB_SOURCE).not.toMatch(/#[0-9A-Fa-f]{3,8}\b|rgba?\(/);
    expect(HUB_SOURCE).not.toMatch(/fontSize:\s*\d/);
  });
});

describe('M9-04: BillingFlow refuses the invoice generation routes', () => {
  it('the three generation routes are excluded; the read-only routes are not', () => {
    expect([...EXCLUDED_BILLING_ROUTES]).toEqual(['GenerateInvoice', 'InvoiceWizard', 'InvoiceGenerated']);
    for (const route of ['GenerateInvoice', 'InvoiceWizard', 'InvoiceGenerated']) {
      expect({ route, excluded: isBillingRouteExcluded(route) }).toEqual({ route, excluded: true });
    }
    for (const route of ['BillingHub', 'InvoiceList', 'InvoiceFilters', 'InvoiceDetail', 'SubWarehouseGenerateInvoice', '']) {
      expect({ route, excluded: isBillingRouteExcluded(route) }).toEqual({ route, excluded: false });
    }
  });

  it('BillingFlow checks the exclusion first, for both navigate and the initial screen, and lands on the hub', () => {
    expect(FLOW).toMatch(
      /const isRouteAvailable = \(screen: BillingRoute\): boolean => \{\s*if \(isBillingRouteExcluded\(screen\)\) return false;\s*const area = billingRouteArea\(screen\);/,
    );
    expect(FLOW).toMatch(/const screen = isRouteAvailable\(current\.screen\) \? current\.screen : HOME_SCREEN;/);
    expect(FLOW).toMatch(/if \(!isRouteAvailable\(screen\)\) return;/);
  });

  it('the flow\'s docblock no longer says the generation screens are offered', () => {
    expect(FLOW).not.toMatch(/is offered under the owner decision of 2026-10-14/);
  });
});
