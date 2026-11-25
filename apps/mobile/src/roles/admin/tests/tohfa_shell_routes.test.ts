/**
 * Tohfa Admin shell navigation state (screens/tohfa-shell/tohfaShellRoutes.ts):
 * the design's bottom tabs, all five shown (owner decision 2026-11-11: Work Queue visible),
 * the old five-tab `initialTab` values mapped onto the new shell, and back
 * returning a sub-flow to the tab it was opened from.
 */
import { describe, expect, it } from 'vitest';
import {
  TOHFA_HIDDEN_TABS,
  TOHFA_SHELL_TABS,
  initialTohfaShellState,
  tohfaShellBack,
  tohfaShellReducer,
  tohfaSwitchRoleTarget,
  visibleTohfaTabs,
  type TohfaShellState,
} from '../screens/tohfa-shell/tohfaShellRoutes';

const HOME: TohfaShellState = { tab: 'Home', flow: null };

describe('tohfa shell tabs', () => {
  it('keeps the design order Home, Work Queue, Inventory, Finance, More', () => {
    expect(TOHFA_SHELL_TABS).toEqual(['Home', 'WorkQueue', 'Inventory', 'Finance', 'More']);
  });

  it('shows every tab, Work Queue included; the hidden list still filters when used', () => {
    expect(TOHFA_HIDDEN_TABS).toEqual([]);
    expect(visibleTohfaTabs()).toEqual(['Home', 'WorkQueue', 'Inventory', 'Finance', 'More']);
    expect(visibleTohfaTabs(['WorkQueue'])).toEqual(['Home', 'Inventory', 'Finance', 'More']);
  });

  it('selecting Work Queue opens it, closing any flow', () => {
    expect(tohfaShellReducer({ tab: 'Finance', flow: { kind: 'wallet' } }, { type: 'selectTab', tab: 'WorkQueue' })).toEqual({
      tab: 'WorkQueue',
      flow: null,
    });
  });

  it('a flow opened from Work Queue returns to Work Queue', () => {
    const opened = tohfaShellReducer({ tab: 'WorkQueue', flow: null }, { type: 'open', flow: { kind: 'orders' } });
    expect(opened).toEqual({ tab: 'WorkQueue', flow: { kind: 'orders' } });
    expect(tohfaShellBack(opened)).toEqual({ tab: 'WorkQueue', flow: null });
  });
});

describe('old initialTab values map onto the new shell', () => {
  it.each([
    [undefined, { tab: 'Home', flow: null }],
    ['Dashboard', { tab: 'Home', flow: null }],
    ['Home', { tab: 'Home', flow: null }],
    ['WorkQueue', { tab: 'WorkQueue', flow: null }],
    ['Inventory', { tab: 'Inventory', flow: null }],
    ['Finance', { tab: 'Finance', flow: null }],
    ['More', { tab: 'More', flow: null }],
    ['Farmers', { tab: 'More', flow: { kind: 'farmers', entry: 'list' } }],
    ['Reports', { tab: 'More', flow: { kind: 'reports' } }],
    ['Profile', { tab: 'More', flow: { kind: 'settings' } }],
    ['Sales', { tab: 'Finance', flow: { kind: 'sales' } }],
  ] as const)('%s', (initial, expected) => {
    expect(initialTohfaShellState(initial)).toEqual(expected);
  });
});

describe('sub-flows return to the tab they were opened from', () => {
  it('opening a flow keeps the originating tab; closing it returns there', () => {
    const opened = tohfaShellReducer({ tab: 'Inventory', flow: null }, { type: 'open', flow: { kind: 'transfers' } });
    expect(opened).toEqual({ tab: 'Inventory', flow: { kind: 'transfers' } });
    expect(tohfaShellReducer(opened, { type: 'closeFlow' })).toEqual({ tab: 'Inventory', flow: null });
  });

  it('selecting a tab closes any open flow', () => {
    const opened: TohfaShellState = { tab: 'Finance', flow: { kind: 'wallet' } };
    expect(tohfaShellReducer(opened, { type: 'selectTab', tab: 'More' })).toEqual({ tab: 'More', flow: null });
  });

  it('closeFlow with nothing open is a no-op', () => {
    expect(tohfaShellReducer(HOME, { type: 'closeFlow' })).toBe(HOME);
  });
});

describe('Android back', () => {
  it('sub-flow -> its tab', () => {
    expect(tohfaShellBack({ tab: 'More', flow: { kind: 'customers' } })).toEqual({ tab: 'More', flow: null });
    expect(tohfaShellBack({ tab: 'Home', flow: { kind: 'pricing' } })).toEqual(HOME);
  });

  it('a tab other than Home -> Home', () => {
    for (const tab of ['WorkQueue', 'Inventory', 'Finance', 'More'] as const) {
      expect(tohfaShellBack({ tab, flow: null })).toEqual(HOME);
    }
  });

  it('Home with nothing open is not handled (falls through to the host app)', () => {
    expect(tohfaShellBack(HOME)).toBeNull();
    expect(tohfaShellReducer(HOME, { type: 'back' })).toBe(HOME);
  });
});

describe('switch-role target', () => {
  it('is undefined for a single-role user', () => {
    expect(tohfaSwitchRoleTarget(['A'], 'A')).toBeUndefined();
    expect(tohfaSwitchRoleTarget(['A', 'A'], 'A')).toBeUndefined();
    expect(tohfaSwitchRoleTarget([], null)).toBeUndefined();
  });

  it('is the first role that is not the current one', () => {
    expect(tohfaSwitchRoleTarget(['A', 'B'], 'A')).toBe('B');
    expect(tohfaSwitchRoleTarget(['B', 'A'], 'A')).toBe('B');
  });
});
