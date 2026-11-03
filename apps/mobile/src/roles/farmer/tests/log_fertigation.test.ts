import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import { isMoney, type Money } from '@tohfa/shared-types';

/*
 * LogFertigationScreen is rendered below with react-test-renderer, so the
 * global react-native stub (which returns props, not elements) is replaced by
 * string host components. Alert is a spy so validation/success paths are
 * observable. The crop picker hook is stubbed so the only network call the
 * screen makes is the BR-56 POST, which is captured via global.fetch exactly
 * like the client tests in this file.
 */
const alertSpy = vi.hoisted(() => vi.fn());
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: alertSpy },
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));
const cropItemsState = vi.hoisted(() => ({ items: [] as unknown[] }));
vi.mock('../screens/farm/crops/cropItems', () => ({
  useActiveCropItems: () => ({ items: cropItemsState.items, loading: false, error: false, reload: () => undefined }),
}));

import {
  createCropInput,
  deleteCropInput,
  getCropInput,
  updateCropInput,
  type CreateCropInputRequest,
  type CropInputResponse,
  type UpdateCropInputRequest,
} from '../api/crops';
import { ApiError, setAccessToken } from '../../../shell/api/client';
import { computeCostInr, parseQuantity } from '../screens/farm/crops/fertigationCost';
import {
  APPROVED_FERTIGATION_INPUTS,
  nutrientReferenceFor,
} from '../screens/farm/crops/fertigationCatalogue';
import { LogFertigationScreen } from '../screens/farm/crops/LogFertigationScreen';
import { todayInKolkata } from '../screens/certifications/certificationForm';
import errorsEn from '../../../i18n/errors.en.json';
import errorsTa from '../../../i18n/errors.ta.json';
import farmerEn from '../../../i18n/farmer.en.json';
import farmerTa from '../../../i18n/farmer.ta.json';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });
}

describe('Farmer Crop Inputs API Client (BR-56 & Fertigation Logging)', () => {
  const farmCropId = '77777777-8888-4444-9999-000000000001';
  const inputId = '55555555-4444-3333-2222-111111111111';

  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-fertigation-test');
  });

  afterEach(() => {
    setAccessToken(null);
  });

  it('BR-56: createCropInput sends POST /farmers/me/crops/:farmCropId/inputs with proper body', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: unknown = null;

    const requestBody: CreateCropInputRequest = {
      inputType: 'MANURE',
      inputName: 'Vermicompost',
      appliedOn: '2026-07-31',
      quantity: 60,
      unit: 'KG',
      costInr: '720.00',
      nitrogenPct: 2.0,
      phosphorusPct: 1.0,
      potassiumPct: 1.5,
      applicationMethod: 'Drench',
      notes: 'Dosage: 2 kg per plant | PHI: 0 days',
    };

    const mockResponse: CropInputResponse = {
      id: inputId,
      farmerId: 'farmer-uuid',
      farmCropId,
      inputType: 'MANURE',
      inputName: 'Vermicompost',
      appliedOn: '2026-07-31',
      quantity: 60,
      unit: 'KG',
      costInr: '720.00',
      nitrogenPct: 2.0,
      phosphorusPct: 1.0,
      potassiumPct: 1.5,
      applicationMethod: 'Drench',
      notes: 'Dosage: 2 kg per plant | PHI: 0 days',
      createdAt: '2026-07-31T05:30:00.000Z',
      updatedAt: null,
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? 'GET';
      capturedBody = init?.body ? JSON.parse(String(init.body)) : null;
      return jsonResponse(mockResponse, 201);
    }) as typeof fetch;

    const result = await createCropInput(farmCropId, requestBody);

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/inputs`);
    expect(capturedMethod).toBe('POST');
    expect(capturedBody).toEqual(requestBody);
    expect(result.id).toBe(inputId);
    expect(result.inputName).toBe('Vermicompost');
    expect(result.quantity).toBe(60);
    expect(result.costInr).toBe('720.00');
  });

  it('BR-56: getCropInput sends GET /farmers/me/crops/:farmCropId/inputs/:id', async () => {
    let capturedUrl = '';
    const mockResponse: CropInputResponse = {
      id: inputId,
      farmerId: 'farmer-uuid',
      farmCropId,
      inputType: 'BIO_INPUT',
      inputName: 'Jeevamrutha',
      appliedOn: '2026-07-31',
      quantity: 50,
      unit: 'LITRE',
      costInr: '400.00',
      nitrogenPct: 1.5,
      phosphorusPct: 0.5,
      potassiumPct: 1.0,
      applicationMethod: 'Drench',
      notes: null,
      createdAt: '2026-07-31T05:30:00.000Z',
      updatedAt: null,
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return jsonResponse(mockResponse);
    }) as typeof fetch;

    const result = await getCropInput(farmCropId, inputId);

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/inputs/${inputId}`);
    expect(result.inputName).toBe('Jeevamrutha');
    expect(result.unit).toBe('LITRE');
  });

  it('BR-56: updateCropInput sends PATCH /farmers/me/crops/:farmCropId/inputs/:id', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: unknown = null;

    const patchBody: UpdateCropInputRequest = {
      quantity: 80,
      costInr: '960.00',
    };

    const mockResponse: CropInputResponse = {
      id: inputId,
      farmerId: 'farmer-uuid',
      farmCropId,
      inputType: 'MANURE',
      inputName: 'Vermicompost',
      appliedOn: '2026-07-31',
      quantity: 80,
      unit: 'KG',
      costInr: '960.00',
      nitrogenPct: 2.0,
      phosphorusPct: 1.0,
      potassiumPct: 1.5,
      applicationMethod: 'Drench',
      notes: null,
      createdAt: '2026-07-31T05:30:00.000Z',
      updatedAt: '2026-07-31T06:00:00.000Z',
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? 'GET';
      capturedBody = init?.body ? JSON.parse(String(init.body)) : null;
      return jsonResponse(mockResponse);
    }) as typeof fetch;

    const result = await updateCropInput(farmCropId, inputId, patchBody);

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/inputs/${inputId}`);
    expect(capturedMethod).toBe('PATCH');
    expect(capturedBody).toEqual(patchBody);
    expect(result.quantity).toBe(80);
    expect(result.costInr).toBe('960.00');
  });

  it('BR-56: deleteCropInput sends DELETE /farmers/me/crops/:farmCropId/inputs/:id', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? 'GET';
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    await deleteCropInput(farmCropId, inputId);

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/inputs/${inputId}`);
    expect(capturedMethod).toBe('DELETE');
  });

  it('rejects with ApiError on validation failure', async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse(
        {
          type: 'about:blank',
          title: 'Validation Failed',
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: 'quantity must be greater than 0.',
        },
        422,
      ),
    ) as typeof fetch;

    const error = await createCropInput(farmCropId, {
      inputType: 'MANURE',
      inputName: 'Vermicompost',
      appliedOn: '2026-07-31',
      quantity: 0,
      unit: 'KG',
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).problem.status).toBe(422);
    expect((error as ApiError).problem.code).toBe('VALIDATION_FAILED');
    expect((error as ApiError).problem.detail).toBe('quantity must be greater than 0.');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LogFertigationScreen: exact cost maths, honest catalogue, no fabricated date
// ─────────────────────────────────────────────────────────────────────────────

const money = (s: string): Money => s as Money;

describe('BR-56f: fertigation cost is computed exactly in integer paise (never a float)', () => {
  it.each([
    // [quantity, price per unit, expected cost]  -- half-up to the paisa
    ['0.3', '10.10', '3.03'], // old Math.round(qty * price) gave 3
    ['12.5', '33.33', '416.63'], // 416.625 -> half-up
    ['4.1', '123.45', '506.15'], // 506.145; float paise * factor rounds to 506.14
    ['2.3', '123.45', '283.94'], // 283.935; float rounds to 283.93
    ['1.01', '0.50', '0.51'], // 0.505 -> half-up
    ['0.5', '0.01', '0.01'], // half a paisa rounds up
    ['0.01', '0.01', '0.00'], // a hundredth of a paisa rounds down
    ['0.35', '12.00', '4.20'],
    ['60', '12.00', '720.00'],
    ['99999999.99', '1.00', '99999999.99'],
    ['12345678.91', '999.99', '12345555453.21'], // beyond float-exact cents territory
  ])('BR-56f: %s x Rs %s = Rs %s', (qty, price, expected) => {
    expect(computeCostInr(qty, money(price))).toBe(expected);
  });

  it('BR-56f: the result is always a Money string with exactly 2 decimals', () => {
    const cost = computeCostInr('0.3', money('10.10'));
    expect(typeof cost).toBe('string');
    expect(isMoney(cost)).toBe(true);
    expect(cost).toMatch(/^\d+\.\d{2}$/);
  });

  it.each(['', '  ', '0', '0.00', '-1', 'abc', '1.234', '1e3', '1,5', '.', '123456789', 'Infinity', 'NaN'])(
    'BR-56a: quantity %j is rejected (no cost, no request)',
    (qty) => {
      expect(parseQuantity(qty)).toBeNull();
      expect(computeCostInr(qty, money('12.00'))).toBeNull();
    },
  );

  it('BR-56a: parseQuantity accepts up to 2 decimals and normalises whitespace', () => {
    expect(parseQuantity(' 0.3 ')).toBe('0.3');
    expect(parseQuantity('12.50')).toBe('12.50');
    expect(parseQuantity('.5')).toBe('.5');
    expect(parseQuantity('99999999.99')).toBe('99999999.99');
  });
});

describe('Approved fertigation inputs catalogue (local, pending a backend catalogue)', () => {
  it('every price is a Money string, never a JS number', () => {
    expect(APPROVED_FERTIGATION_INPUTS.length).toBeGreaterThan(0);
    for (const item of APPROVED_FERTIGATION_INPUTS) {
      expect(typeof item.pricePerUnit, item.name).toBe('string');
      expect(isMoney(item.pricePerUnit), item.name).toBe(true);
    }
  });

  it('the screen no longer owns an inline price list or reference table', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../screens/farm/crops/LogFertigationScreen.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/pricePerUnit:\s*\d/);
    expect(src).not.toMatch(/APPROVED_INPUTS\s*[:=]/);
    expect(src).not.toMatch(/CROP_REFERENCES\s*[:=]/);
    expect(src).not.toMatch(/Math\.round|parseFloat|toFixed/);
    expect(src).not.toContain('31 Jul 2026');
  });

  it('an unknown crop has no reference values (no silent fallback to carrot)', () => {
    expect(nutrientReferenceFor('Carrot')).not.toBeNull();
    expect(nutrientReferenceFor('Beans')).toBeNull();
  });
});

describe('LogFertigationScreen i18n', () => {
  const en: Record<string, string> = { ...errorsEn, ...farmerEn };
  const ta: Record<string, string> = { ...errorsTa, ...farmerTa };
  it('every farmer.logFertigation.* key used by the screen and its catalogue exists in en and ta', () => {
    const files = [
      '../screens/farm/crops/LogFertigationScreen.tsx',
      '../screens/farm/crops/fertigationCatalogue.ts',
    ];
    const keys = new Set<string>();
    for (const f of files) {
      const src = fs.readFileSync(path.resolve(__dirname, f), 'utf8');
      for (const m of src.matchAll(/(['"])(farmer\.logFertigation\.[A-Za-z0-9_.-]+)\1/g)) keys.add(m[2]!);
    }
    expect(keys.size).toBeGreaterThan(10);
    for (const key of keys) {
      expect(en[key], `en ${key}`).toBeTruthy();
      expect(ta[key], `ta ${key}`).toBeTruthy();
    }
  });
});

describe('LogFertigationScreen (rendered)', () => {
  const CROP = {
    id: '77777777-8888-4444-9999-000000000001',
    name: 'Carrot',
    variety: 'Nantes',
    cropType: 'carrot',
    zone: 'Zone 1 — Upper Field',
    zoneShort: 'Zone 1',
    area: '1 acre',
    daysOld: 20,
    statusType: 'growing',
    statusDays: 40,
    statusText: '',
    accentColor: '',
  };

  let posted: Record<string, unknown> | null;
  let postCount: number;

  beforeEach(() => {
    alertSpy.mockReset();
    posted = null;
    postCount = 0;
    cropItemsState.items = [CROP];
    setAccessToken('token-fertigation-test');
    global.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      postCount += 1;
      posted = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null;
      return jsonResponse({ id: 'new-input', ...posted }, 201);
    }) as typeof fetch;
  });

  afterEach(() => setAccessToken(null));

  function renderedText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
    if (node === null) return [];
    if (typeof node === 'string') return [node];
    if (Array.isArray(node)) return node.flatMap(renderedText);
    return (node.children ?? []).flatMap(renderedText);
  }
  const textOf = (tree: renderer.ReactTestRenderer): string => renderedText(tree.toJSON()).join('');

  async function mount(crop: Record<string, unknown> = CROP): Promise<renderer.ReactTestRenderer> {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        React.createElement(LogFertigationScreen, { crop: crop as never, onBack: () => undefined }),
      );
    });
    return tree;
  }

  async function typeQuantity(tree: renderer.ReactTestRenderer, value: string): Promise<void> {
    const input = tree.root.findByProps({ testID: 'logFertigation.quantity' });
    await act(async () => {
      (input.props.onChangeText as (v: string) => void)(value);
    });
  }

  async function save(tree: renderer.ReactTestRenderer): Promise<void> {
    const btn = tree.root.findByProps({ testID: 'logFertigation.save' });
    await act(async () => {
      await (btn.props.onPress as () => Promise<void>)();
    });
  }

  /** Joined text of the <Text> carrying `testID`. */
  function textById(tree: renderer.ReactTestRenderer, testID: string): string {
    const node = tree.root.findByProps({ testID });
    const flat = (v: unknown): string =>
      Array.isArray(v) ? v.map(flat).join('') : typeof v === 'string' || typeof v === 'number' ? String(v) : '';
    return flat(node.props.children as unknown);
  }

  it('BR-56f: a decimal quantity shows and POSTs the exact paise-accurate cost as a 2dp string', async () => {
    const tree = await mount();
    // Default input is the first catalogue entry; its price comes from the catalogue, not the screen.
    const price = APPROVED_FERTIGATION_INPUTS[0]!.pricePerUnit;
    expect(price).toBe('12.00');
    await typeQuantity(tree, '0.35');
    expect(textById(tree, 'logFertigation.cost')).toBe('₹4.20');

    await save(tree);
    expect(postCount).toBe(1);
    expect(posted).not.toBeNull();
    expect(posted!['costInr']).toBe('4.20'); // old screen sent Math.round(4.2).toFixed(2) === '4.00'
    expect(typeof posted!['costInr']).toBe('string');
    expect(posted!['quantity']).toBe(0.35); // the API contract types quantity as a JSON number
    expect(posted!['unit']).toBe('KG');
    expect(posted!['appliedOn']).toBe(todayInKolkata());
  });

  it('BR-56: no fabricated next application date is shown or sent (no interval exists in the API)', async () => {
    const tree = await mount();
    const text = textOf(tree);
    expect(text).not.toContain('31 Jul 2026');
    expect(text).not.toContain('+14');
    expect(tree.root.findAllByProps({ testID: 'logFertigation.nextDate' })).toHaveLength(0);

    await save(tree);
    expect(postCount).toBe(1);
    expect(String(posted!['notes'] ?? '')).not.toMatch(/next application/i);
    expect(String(posted!['notes'] ?? '')).not.toContain('31 Jul 2026');
  });

  it.each(['0', '1.234', 'abc', ''])('BR-56a: quantity %j blocks the save with no request', async (qty) => {
    const tree = await mount();
    await typeQuantity(tree, qty);
    await save(tree);
    expect(postCount).toBe(0);
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it('BR-56a: a cost above the numeric(10,2) column is blocked client-side instead of a server 422', async () => {
    const tree = await mount();
    await typeQuantity(tree, '99999999.99'); // x Rs 12.00 > 99,999,999.99
    await save(tree);
    expect(postCount).toBe(0);
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it('BR-56f: switching to a unit the catalogue price is not quoted in sends no cost instead of a wrong one', async () => {
    const tree = await mount();
    await typeQuantity(tree, '500');
    const gram = tree.root.findByProps({ testID: 'logFertigation.unit.GRAM' });
    await act(async () => {
      (gram.props.onPress as () => void)();
    });
    // 500 g at "Rs 12.00 per kg" must not be costed as 500 x 12.00 = Rs 6000.
    expect(textById(tree, 'logFertigation.cost')).not.toContain('6,000');
    await save(tree);
    expect(postCount).toBe(1);
    expect(posted!['unit']).toBe('GRAM');
    expect(posted!['quantity']).toBe(500);
    expect(posted).not.toHaveProperty('costInr');
  });

  it('BR-56: a server rejection surfaces the problem detail and no success alert', async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse(
        { type: 'about:blank', title: 'Validation Failed', status: 422, code: 'VALIDATION_FAILED', detail: 'appliedOn is in the future' },
        422,
      ),
    ) as typeof fetch;
    const tree = await mount();
    await save(tree);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0]![1]).toBe('appliedOn is in the future');
    expect(textOf(tree)).toContain('appliedOn is in the future');
  });

  it('an unknown crop shows no reference card rather than carrot values', async () => {
    cropItemsState.items = [{ ...CROP, name: 'Beans' }];
    const tree = await mount({ ...CROP, name: 'Beans' });
    expect(tree.root.findAllByProps({ testID: 'logFertigation.referenceCard' })).toHaveLength(0);
    const carrot = await mount();
    expect(carrot.root.findAllByProps({ testID: 'logFertigation.referenceCard' }).length).toBeGreaterThan(0);
  });
});
