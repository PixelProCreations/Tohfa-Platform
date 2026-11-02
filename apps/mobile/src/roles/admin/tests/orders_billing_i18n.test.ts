/**
 * Root CLAUDE.md 2.7 on the order, invoice and allocation screens: no
 * user-facing English in the component, every string a key of the admin
 * catalogue, with a Tamil string next to the English one.
 *
 * Source scan, because JSX cannot render in this plain-Node vitest. Comments
 * are stripped first: docblocks name the design's wording on purpose.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import en from '../i18n/en.json';
import ta from '../i18n/ta.json';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const WAREHOUSE = 'roles/admin/screens/warehouse';
const SCREENS = [
  'orders/PackingScreen.tsx',
  'orders/ReadyForPickupScreen.tsx',
  'orders/PickupOtpScreen.tsx',
  'billing-invoices/InvoiceDetailScreen.tsx',
  'billing-invoices/BillingHubScreen.tsx',
  'inventory/StockAllocationDashboardScreen.tsx',
] as const;

const sources = SCREENS.map((file) => ({ file, body: code(read(`${WAREHOUSE}/${file}`)) }));

/** The catalogue prefixes these screens own; each key under them needs a Tamil string. */
const OWNED_PREFIXES = [
  'orders.packing.',
  'orders.pickup.',
  'orders.ready.',
  'billing.detail.',
  'billing.hub.',
  'inventory.allocation.',
];

const enKeys = new Set(Object.keys(en));
const taKeys = new Set(Object.keys(ta));

describe('no hard-coded English in the order, invoice and allocation screens (CLAUDE.md 2.7)', () => {
  it.each(sources)('$file has no English text between JSX tags', ({ body }) => {
    expect(body.match(/>\s*[A-Za-z][A-Za-z0-9 ,.'?&/·-]*\s*<\//g) ?? []).toEqual([]);
  });

  it.each(sources)('$file passes no English literal as a title, label or placeholder', ({ body }) => {
    expect(body.match(/\b(title|label|subtitle|placeholder|accessibilityLabel)=["'][^"']*[A-Za-z][^"']*["']/g) ?? []).toEqual([]);
    expect(body.match(/\b(title|label|subtitle):\s*['"`][^'"`]*[A-Za-z]/g) ?? []).toEqual([]);
  });

  it.each(sources)('$file holds no English sentence or phrase as a string literal', ({ body }) => {
    // "All items checked", 'Order Packed', ...: two or more words, starting with a capital.
    expect(body.match(/'[A-Z][a-z]+(?: [A-Za-z?]+)+'/g) ?? []).toEqual([]);
  });
});

describe('every key these screens use is in the catalogue', () => {
  const used = new Set<string>();
  for (const { body } of sources) {
    for (const match of body.matchAll(/'((?:orders|billing|inventory)\.[A-Za-z0-9_.]+)'/g)) used.add(match[1] as string);
  }

  it('has an English string for each key', () => {
    expect([...used].filter((key) => !enKeys.has(key))).toEqual([]);
  });

  it('has a Tamil string for each key under the prefixes these screens own', () => {
    const owned = [...enKeys].filter((key) => OWNED_PREFIXES.some((prefix) => key.startsWith(prefix)));
    expect(owned.length).toBeGreaterThan(0);
    expect(owned.filter((key) => !taKeys.has(key))).toEqual([]);
  });
});
