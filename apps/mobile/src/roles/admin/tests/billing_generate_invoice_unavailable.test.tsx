/**
 * Billing hub: the Generate Invoice tile is excluded from the app
 * (availability.ts EXCLUDED_BILLING_ROUTES, 2026-10-23 triage M9-04), so
 * BillingFlow passes no onGenerateInvoice. The tile must stay drawn (a design
 * element) but never be a tappable control that does nothing: it is disabled
 * and reads as unavailable. With a handler it is live and calls it.
 * Rendered with react-test-renderer; hooks the hub reads are mocked.
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  BackHandler: { addEventListener: vi.fn(() => ({ remove: () => undefined })) },
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (o: Record<string, unknown>) => o['ios'] ?? o['default'] },
  RefreshControl: 'RefreshControl',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Line: 'Line', Path: 'Path', Rect: 'Rect' }));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));
vi.mock('../screens/warehouse/shared/useWarehouseOptions', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWarehouseOptions: () => ({ options: [], isLoading: false, error: null }),
}));

import { BillingHubScreen, type BillingHubScreenProps } from '../screens/warehouse/billing-invoices/BillingHubScreen';
import { makeCan } from '../permissions/can';
import { t } from '../i18n';

const CAN = makeCan(['invoice.view_own', 'invoice.generate']);

function props(over: Partial<BillingHubScreenProps>): BillingHubScreenProps {
  return {
    scope: {},
    can: CAN,
    onBack: vi.fn(),
    onNavigateToInvoiceList: vi.fn(),
    onNavigateToInvoiceHistory: vi.fn(),
    onNavigateToGstInvoices: vi.fn(),
    onNavigateToInvoiceDetail: vi.fn(),
    warehouseOptions: [],
    ...over,
  };
}

/** The TouchableOpacity wrapping the Generate Invoice label. */
function generateTiles(root: ReactTestInstance): ReactTestInstance[] {
  const label = t('billing.hub.generateInvoice');
  return root
    .findAll((n) => (n.type as unknown) === 'TouchableOpacity')
    .filter((n) => n.findAll((c) => (c.type as unknown) === 'Text' && c.props.children === label).length > 0)
    // innermost tile only: skip a TouchableOpacity that merely contains another one
    .filter((n) => n.findAll((c) => c !== n && (c.type as unknown) === 'TouchableOpacity').length === 0);
}

function render(p: BillingHubScreenProps): ReactTestInstance {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<BillingHubScreen {...p} />);
  });
  return tree.root;
}

describe('Billing hub: Generate Invoice is never a silent dead control', () => {
  it.each([
    ['Main (all warehouses)', {}],
    ['Sub warehouse', { warehouseId: '11111111-1111-4111-8111-111111111111' }],
  ])('%s: with no onGenerateInvoice the tile stays drawn but is disabled and not tappable', (_name, scope) => {
    const root = render(props({ scope }));
    const tiles = generateTiles(root);
    expect(tiles.length).toBeGreaterThan(0);
    for (const tile of tiles) {
      expect(tile.props.disabled).toBe(true);
      expect(tile.props.accessibilityState).toEqual({ disabled: true });
    }
  });

  it.each([
    ['Main (all warehouses)', {}],
    ['Sub warehouse', { warehouseId: '11111111-1111-4111-8111-111111111111' }],
  ])('%s: with a handler the tile is enabled and calls it', (_name, scope) => {
    const onGenerateInvoice = vi.fn();
    const root = render(props({ scope, onGenerateInvoice }));
    const tiles = generateTiles(root);
    expect(tiles.length).toBeGreaterThan(0);
    for (const tile of tiles) expect(tile.props.disabled).toBe(false);
    act(() => {
      tiles[0]!.props.onPress();
    });
    expect(onGenerateInvoice).toHaveBeenCalledTimes(1);
  });

  it('a Sub admin without invoice.generate still gets no tile (permission guard kept)', () => {
    const root = render(props({ scope: { warehouseId: '11111111-1111-4111-8111-111111111111' }, can: makeCan(['invoice.view_own']), onGenerateInvoice: vi.fn() }));
    expect(generateTiles(root)).toHaveLength(0);
  });
});
