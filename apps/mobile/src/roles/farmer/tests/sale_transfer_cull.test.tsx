/**
 * SaleTransferCullScreen used to default `animalId = 'a1'` / `animalName =
 * 'Lakshmi'` / `animalCode = 'C-014'`, so a missing route param silently
 * recorded a terminal event against a fake animal. These tests pin:
 *   - a missing/blank animalId renders an error state and can never submit;
 *   - a real id POSTs /farmers/me/livestock/animals/:id/lifecycle-events with
 *     the documented body (SOLD / TRANSFERRED / CULLED, integer paise);
 *   - the fake literals are gone from source;
 *   - en/ta parity for the screen's i18n keys.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';

const alertMock = vi.hoisted(() => vi.fn());
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: alertMock },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'android' },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('@tohfa/mobile-ui', () => ({
  SafeAreaView: 'SafeAreaView',
  ScreenStatusBar: 'ScreenStatusBar',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));

const apiPost = vi.hoisted(() => vi.fn());
vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, api: { get: vi.fn(), post: apiPost } };
});

import { SaleTransferCullScreen } from '../screens/farm/livestock/SaleTransferCullScreen';
import farmerEn from '../../../i18n/farmer.en.json';
import farmerTa from '../../../i18n/farmer.ta.json';

const ID = 'a0000000-0000-4000-8000-000000000001';
const SCREEN_PATH = path.resolve(__dirname, '../screens/farm/livestock/SaleTransferCullScreen.tsx');

const NEW_KEYS = [
  'farmer.livestock.saleTransferCull.missingAnimal',
  'farmer.livestock.saleTransferCull.back',
  'farmer.livestock.saleTransferCull.savedTitle.sale',
  'farmer.livestock.saleTransferCull.savedTitle.transfer',
  'farmer.livestock.saleTransferCull.savedTitle.cull',
  'farmer.livestock.saleTransferCull.savedBody',
  'farmer.livestock.saleTransferCull.ok',
];

function byTestId(root: ReactTestInstance, id: string): ReactTestInstance[] {
  return root.findAll((n) => n.props?.testID === id);
}

async function mount(props: Partial<React.ComponentProps<typeof SaleTransferCullScreen>>) {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<SaleTransferCullScreen {...props} />);
  });
  return tree;
}

beforeEach(() => {
  apiPost.mockReset();
  alertMock.mockReset();
  apiPost.mockResolvedValue({ id: ID, lifecycleStatus: 'SOLD' });
});

describe('SaleTransferCullScreen', () => {
  it('missing animalId renders the error state and makes no request', async () => {
    const onBack = vi.fn();
    const tree = await mount({ onBack });
    expect(byTestId(tree.root, 'saleTransferCull.error').length).toBeGreaterThan(0);
    expect(byTestId(tree.root, 'saleTransferCull.submit')).toHaveLength(0);
    const back = byTestId(tree.root, 'saleTransferCull.errorBack')[0]!;
    await act(async () => {
      back.props.onPress();
    });
    expect(onBack).toHaveBeenCalled();
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('blank animalId is treated as missing', async () => {
    const tree = await mount({ animalId: '   ' });
    expect(byTestId(tree.root, 'saleTransferCull.error').length).toBeGreaterThan(0);
    expect(byTestId(tree.root, 'saleTransferCull.submit')).toHaveLength(0);
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('real id: submit POSTs the SOLD lifecycle event to the real path with integer paise', async () => {
    const onSuccess = vi.fn();
    const tree = await mount({ animalId: ID, animalName: 'Gauri', animalCode: 'C-77', onSuccess });
    expect(byTestId(tree.root, 'saleTransferCull.error')).toHaveLength(0);

    const inputs = tree.root.findAllByType('TextInput' as never);
    // Sale tab: [buyer, price]
    await act(async () => {
      inputs[0]!.props.onChangeText('Ravi');
      inputs[1]!.props.onChangeText('12500.50');
    });
    await act(async () => {
      await byTestId(tree.root, 'saleTransferCull.submit')[0]!.props.onPress();
    });

    expect(apiPost).toHaveBeenCalledTimes(1);
    const [url, body] = apiPost.mock.calls[0]!;
    expect(url).toBe(`/farmers/me/livestock/animals/${ID}/lifecycle-events`);
    expect(body).toMatchObject({ eventType: 'SOLD', counterparty: 'Ravi', salePricePaise: 1250050 });
    expect(body.eventDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Success alert is built from the real animal, and OK signals the caller.
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock.mock.calls[0]![0]).toBe('Sale recorded');
    expect(alertMock.mock.calls[0]![1]).toContain('Gauri (C-77)');
    const buttons = alertMock.mock.calls[0]![2] as { onPress: () => void }[];
    buttons[0]!.onPress();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('a failed request shows an error banner and does not signal success', async () => {
    apiPost.mockRejectedValue(new Error('boom'));
    const onSuccess = vi.fn();
    const tree = await mount({ animalId: ID, animalName: 'Gauri', animalCode: 'C-77', onSuccess });
    await act(async () => {
      await byTestId(tree.root, 'saleTransferCull.submit')[0]!.props.onPress();
    });
    expect(byTestId(tree.root, 'saleTransferCull.submitError').length).toBeGreaterThan(0);
    expect(alertMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("source no longer contains the fake 'a1' / 'Lakshmi' / 'C-014' defaults", () => {
    const src = fs.readFileSync(SCREEN_PATH, 'utf8');
    expect(src).not.toMatch(/['"]a1['"]/);
    expect(src).not.toContain('Lakshmi');
    expect(src).not.toContain('C-014');
    expect(src).not.toMatch(/animalId\s*=\s*['"]/);
  });

  it('new i18n keys exist in both en and ta, non-empty', () => {
    for (const k of NEW_KEYS) {
      expect((farmerEn as Record<string, string>)[k], `en ${k}`).toBeTruthy();
      expect((farmerTa as Record<string, string>)[k], `ta ${k}`).toBeTruthy();
    }
  });
});
