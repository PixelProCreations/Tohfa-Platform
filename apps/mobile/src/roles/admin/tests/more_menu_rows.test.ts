/**
 * The shared admin "More" menu row logic (screens/more/moreMenuRows.ts).
 *
 * A row is visible when its permission gate passes and the host did not hide
 * it. No handler is required — a row without a handler shows with a "Not
 * available yet" toast on press (owner rule: never hide a design element).
 * Settings and Logout are always visible. The "Tohfa-like" and "Farmer-Admin-like" permission sets
 * are read from docs/rbac.json (every code the role holds at a scope other
 * than 'none'), the same filter /auth/me applies, so this test follows the
 * spec rather than a copy of it.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeCan, type Can } from '../permissions/can';
import { MORE_ROWS, visibleMoreRows, type MoreRowId } from '../screens/more/moreMenuRows';

interface RbacPermission {
  code: string;
  grants: Record<string, string>;
}
const RBAC = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../../../../docs/rbac.json'), 'utf8'),
) as { permissions: RbacPermission[] };

function codesHeldBy(roleCode: string): string[] {
  return RBAC.permissions.filter((p) => (p.grants[roleCode] ?? 'none') !== 'none').map((p) => p.code);
}

const noop = () => undefined;
const ALL_IDS: MoreRowId[] = MORE_ROWS.map((r) => r.id);
function handlersFor(ids: readonly MoreRowId[]): Partial<Record<MoreRowId, () => void>> {
  return Object.fromEntries(ids.map((id) => [id, noop]));
}
const allHandlers = handlersFor(ALL_IDS);
const allowAll: Can = (code) => code.length > 0;

const GATED: Array<[MoreRowId, string]> = [
  ['farmers', 'farmer.profile.view_all'],
  ['produce', 'produce.calendar.view_consolidated'],
  ['purchase_sales', 'purchase.order.view'],
  ['audit', 'audit.view'],
  ['inputs', 'inputs.catalog.manage'],
  ['pricing', 'pricing.fair_price.view'],
  ['disputes', 'dispute.farmer.mediate'],
  ['customers', 'customer.list.view'],
  ['reports', 'report.export.file'],
  ['community', 'farmer.learning.view'],
  ['notifications', 'notification.own.view'],
];

describe('more menu rows: table', () => {
  it('has the fifteen rows in the design order', () => {
    expect(ALL_IDS).toEqual([
      'farmers',
      'produce',
      'purchase_sales',
      'audit',
      'inputs',
      'pricing',
      'disputes',
      'customers',
      'reports',
      'workforce',
      'community',
      'switch_role',
      'notifications',
      'settings',
      'logout',
    ]);
  });

  it('every gate code exists in docs/rbac.json', () => {
    const known = new Set(RBAC.permissions.map((p) => p.code));
    for (const row of MORE_ROWS) {
      if (row.gate.kind === 'code') expect(known.has(row.gate.code), row.gate.code).toBe(true);
    }
  });

  it.each(GATED)('%s is gated by %s', (id, code) => {
    const row = MORE_ROWS.find((r) => r.id === id);
    expect(row?.gate).toEqual({ kind: 'code', code });
  });
});

describe('more menu rows: visibility', () => {
  it('missing can denies every gated row: only settings and logout remain (fail closed)', () => {
    expect(visibleMoreRows({ handlers: allHandlers, canSwitchRole: true, onLogout: noop })).toEqual([
      'settings',
      'logout',
    ]);
  });

  it.each(GATED)('%s appears with its code (%s), no handler required; hidden without its code', (id, code) => {
    const onlyThis = makeCan([code]);
    // Shows with handler
    expect(visibleMoreRows({ can: onlyThis, handlers: allHandlers, onLogout: noop })).toContain(id);
    // Also shows WITHOUT a handler (toasts "Not available yet" on press — owner rule)
    expect(visibleMoreRows({ can: onlyThis, handlers: {}, onLogout: noop })).toContain(id);
    // Does NOT show without its rbac code, regardless of handler
    const everyOtherCode = makeCan(GATED.map(([, c]) => c).filter((c) => c !== code));
    expect(visibleMoreRows({ can: everyOtherCode, handlers: allHandlers, onLogout: noop })).not.toContain(id);
  });

  it('hiddenRows hides a row even with its code and a handler', () => {
    const visible = visibleMoreRows({ can: allowAll, handlers: allHandlers, hiddenRows: ['farmers', 'pricing'], onLogout: noop });
    expect(visible).not.toContain('farmers');
    expect(visible).not.toContain('pricing');
    expect(visible).toContain('produce');
  });

  it('switch_role shows only when canSwitchRole is true (no handler required)', () => {
    expect(visibleMoreRows({ can: allowAll, handlers: allHandlers, onLogout: noop })).not.toContain('switch_role');
    expect(visibleMoreRows({ can: allowAll, handlers: allHandlers, canSwitchRole: false, onLogout: noop })).not.toContain('switch_role');
    expect(visibleMoreRows({ can: allowAll, handlers: allHandlers, canSwitchRole: true, onLogout: noop })).toContain('switch_role');
    // Shows even without a handler when canSwitchRole is true (toasts if no opener)
    expect(
      visibleMoreRows({ can: allowAll, handlers: {}, canSwitchRole: true, onLogout: noop }),
    ).toContain('switch_role');
  });

  it('workforce has no rbac code yet, so it stays hidden even with a handler (fail closed)', () => {
    expect(visibleMoreRows({ can: allowAll, handlers: allHandlers, onLogout: noop })).not.toContain('workforce');
  });

  it('settings and logout always show (no handler or code required)', () => {
    // Settings and logout appear even with no handlers (they are always-visible)
    const rows = visibleMoreRows({ can: allowAll, handlers: {}, onLogout: noop });
    expect(rows).toContain('settings');
    expect(rows).toContain('logout');
    // All code-gated rows also show because can=allowAll, regardless of handlers
    expect(rows).toContain('farmers');
    expect(rows).toContain('produce');
    // workforce (noCode) is still hidden
    expect(rows).not.toContain('workforce');
  });

  it('without any can, only settings and logout show', () => {
    expect(visibleMoreRows({ handlers: {}, onLogout: noop })).toEqual(['settings', 'logout']);
  });

  it('a Tohfa-like permission set with every handler shows rows 1-9, 11, 13, 14, 15 in order', () => {
    const can = makeCan(codesHeldBy('TOHFA_ADMIN'));
    expect(visibleMoreRows({ can, handlers: allHandlers, onLogout: noop })).toEqual([
      'farmers',
      'produce',
      'purchase_sales',
      'audit',
      'inputs',
      'pricing',
      'disputes',
      'customers',
      'reports',
      'community',
      'notifications',
      'settings',
      'logout',
    ]);
  });

  it('a Farmer-Admin-like permission set shows only the rows its codes allow', () => {
    const can = makeCan(codesHeldBy('FARMER_ADMIN'));
    expect(visibleMoreRows({ can, handlers: allHandlers, onLogout: noop })).toEqual([
      'farmers',
      'produce',
      'audit',
      'pricing',
      'disputes',
      'reports',
      'community',
      'notifications',
      'settings',
      'logout',
    ]);
  });
});
