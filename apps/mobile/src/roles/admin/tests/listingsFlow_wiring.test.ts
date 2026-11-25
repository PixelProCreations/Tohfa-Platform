/**
 * Listing Approval Queue entry point, pinned at the source.
 *
 * The app used to mount a fixture copy of this screen
 * (screens/dashboard/ListingApprovalQueueScreen.tsx: MOCK_LISTINGS, a
 * hardcoded `const P = {...}` palette, and empty onApprove/onCounter/onReject
 * handlers), so an admin tapping Approve on a farmer's produce listing moved
 * nothing. The live queue — screens/listings/ListingsFlow.tsx on
 * GET/POST /admin/listings — is the only one that may be mounted now.
 *
 * What the live flow does once mounted (rows from the API, approve / reject /
 * counter sent once, toasts only after the server answered, one rbac.json code
 * per action) is covered by ./listings_admin.test.tsx, which renders the same
 * ListingsFlow this file pins as the mounted component.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const exists = (rel: string) => fs.existsSync(path.join(SRC, rel));
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '');

const APP = 'roles/farmer/App.tsx';
const FLOW = 'roles/admin/screens/listings/ListingsFlow.tsx';
const QUEUE = 'roles/admin/screens/listings/ListingApprovalQueueScreen.tsx';
const FIXTURE = 'roles/admin/screens/dashboard/ListingApprovalQueueScreen.tsx';
const DASH_INDEX = 'roles/admin/screens/dashboard/index.ts';

describe('listing approval queue: the host mounts the live flow', () => {
  it('App.tsx imports ListingsFlow and no longer imports the dashboard fixture screen', () => {
    const src = code(read(APP));
    expect(src).toMatch(/import \{ ListingsFlow \} from '\.\.\/admin\/screens\/listings\/ListingsFlow';/);
    expect(src).not.toMatch(/screens\/dashboard\/ListingApprovalQueueScreen/);
    expect(src).not.toMatch(/<ListingApprovalQueueScreen\b/);
  });

  it('the ListingApprovalQueue route renders ListingsFlow with the signed-in admin\'s own can', () => {
    const src = code(read(APP));
    const mounts = [...src.matchAll(/<ListingsFlow\b[\s\S]*?\/>/g)].map((m) => m[0]);
    expect(mounts.length).toBe(1);
    const mount = mounts[0] as string;
    expect(mount).toMatch(/\bcan=\{listingsCan\}/);
    expect(mount).not.toMatch(/can=\{\s*\(\)\s*=>\s*true\s*\}|role=/);
    // listingsCan is built from GET /auth/me's permission list, never a default grant.
    expect(src).toMatch(/const listingsCan = useMemo\(\(\) => makeCan\(listingsSession\.permissions\), \[listingsSession\.permissions\]\)/);
    expect(src).toMatch(/enabled: LISTING_SCREENS\.includes\(screen\)/);
  });

  it('the empty approve / counter / reject stubs are gone from the route', () => {
    const src = read(APP);
    for (const stub of ['Handle approve', 'Handle counter', 'Handle reject']) {
      expect(src, stub).not.toContain(stub);
    }
  });
});

describe('listing approval queue: the fixture screen is gone', () => {
  it('screens/dashboard no longer holds or re-exports a ListingApprovalQueueScreen', () => {
    expect(exists(FIXTURE)).toBe(false);
    expect(code(read(DASH_INDEX))).not.toMatch(/ListingApprovalQueueScreen/);
  });

  it('nothing outside screens/listings imports a ListingApprovalQueueScreen', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(abs);
        else if (/\.tsx?$/.test(entry.name)) {
          const rel = path.relative(SRC, abs).split(path.sep).join('/');
          if (rel.startsWith('roles/admin/screens/listings/') || rel.startsWith('roles/admin/tests/')) continue;
          if (/ListingApprovalQueueScreen/.test(code(fs.readFileSync(abs, 'utf8')))) offenders.push(rel);
        }
      }
    };
    walk(SRC);
    expect(offenders).toEqual([]);
  });
});

describe('listing approval queue: no fixtures or hardcoded palette in what is mounted', () => {
  it.each([APP, FLOW, QUEUE])('%s carries no MOCK_LISTINGS and no hardcoded palette', (file) => {
    const src = code(read(file));
    expect(src).not.toMatch(/MOCK_LISTINGS/);
    // The fixture's `const P = { pageBg: '#FAF8F5', ... }` (root CLAUDE.md 2.7).
    expect(src).not.toMatch(/const P = \{/);
  });

  it.each([FLOW, QUEUE])('%s uses no literal colour and no fixture farmer', (file) => {
    const src = code(read(file));
    expect(src).not.toMatch(/['"`]#[0-9A-Fa-f]{3,8}['"`]|\brgba?\(/);
    // The fixture's farmers. (App.tsx still holds TOHFA-F placeholders for
    // OTHER unwired screens — out of scope here, not introduced by this flow.)
    expect(src).not.toMatch(/TOHFA-F-\d+|Vijay Anand|Kavitha M\.|Ravi Kumar|Lakshmi R\./);
  });

  it('the render tests cover the same component the host mounts', () => {
    expect(code(read('roles/admin/tests/listings_admin.test.tsx'))).toMatch(/from '\.\.\/screens\/listings\/ListingsFlow'/);
  });
});
