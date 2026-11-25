/**
 * FarmerPayoutDetailScreen: "Farmer ID" is the farmer's human code
 * (tohfaFarmerId), never a uuid, whichever uuid the payout or the caller holds.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  Platform: { OS: 'ios', select: (o: Record<string, unknown>) => o['ios'] ?? o['default'] },
  Pressable: 'Pressable',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {}, hairlineWidth: 1 },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect', Line: 'Line' }));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView', Icon: 'Icon' }));
vi.mock('../api/payoutsHooks', () => ({
  useApprovePayout: () => ({ run: vi.fn(), isPending: false, error: null }),
}));

import { FarmerPayoutDetailScreen } from '../screens/farmers/FarmerPayoutDetailScreen';
import { ADMIN_NO_VALUE } from '../utils/noValue';

const FARMER_UUID = '33333333-3333-4333-8333-333333333333';
const FARMER_CODE = 'TOHFA-F-2026-0042';
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const PAYOUT = {
  id: '99999999-9999-4999-8999-999999999999',
  code: 'PO-REAL-17',
  amount: '10800.00' as never,
  status: 'PENDING_APPROVAL',
  farmerId: FARMER_UUID,
  farmerName: 'Lakshmi Devi',
};

function flat(children: unknown): string {
  if (children === null || children === undefined || typeof children === 'boolean') return '';
  if (Array.isArray(children)) return children.map(flat).join('');
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  return '';
}

function texts(el: React.ReactElement): string[] {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(el);
  });
  const root: ReactTestInstance = tree.root;
  return root.findAll((n) => (n.type as unknown) === 'Text').map((n) => flat(n.props.children));
}

beforeEach(() => vi.clearAllMocks());

describe('Payout detail: Farmer ID is the human code', () => {
  it('shows the farmer code passed by the caller, never the payout or farmer uuid', () => {
    const all = texts(<FarmerPayoutDetailScreen payout={PAYOUT} farmerId={FARMER_UUID} farmerCode={FARMER_CODE} onBack={vi.fn()} />);
    expect(all).toContain(FARMER_CODE);
    expect(all.some((s) => UUID_RE.test(s))).toBe(false);
  });

  it('without a code it shows the dash, not the uuid it holds', () => {
    const all = texts(<FarmerPayoutDetailScreen payout={PAYOUT} farmerId={FARMER_UUID} onBack={vi.fn()} />);
    expect(all.some((s) => UUID_RE.test(s))).toBe(false);
    expect(all).toContain(ADMIN_NO_VALUE);
  });
});
