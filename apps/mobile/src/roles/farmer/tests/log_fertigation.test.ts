import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

/*
 * LogFertigationScreen is rendered below with react-test-renderer, so the
 * global react-native stub (which returns props, not elements) is replaced by
 * string host components. Only what the screen actually imports from
 * 'react-native' is provided. Alert is a spy so validation/success/failure
 * paths are observable. The crop picker hook is stubbed so the only network
 * call the screen makes is the BR-56 POST, captured via global.fetch.
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
  StyleSheet: { create: (s: Record<string, unknown>) => s },
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
vi.mock('@tohfa/mobile-ui', () => ({ SafeAreaView: 'SafeAreaView', ScreenStatusBar: 'ScreenStatusBar' }));
const cropItemsState = vi.hoisted(() => ({
  items: [] as unknown[],
  loading: false,
  error: null as unknown,
  reload: vi.fn(async () => undefined),
}));
vi.mock('../screens/farm/crops/cropItems', () => ({
  useActiveCropItems: () => ({
    items: cropItemsState.items,
    loading: cropItemsState.loading,
    error: cropItemsState.error,
    reload: cropItemsState.reload,
  }),
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
import { parseQuantity } from '../screens/farm/crops/fertigationQuantity';
import {
  APPLICATION_METHODS,
  APPROVED_FERTIGATION_INPUTS,
} from '../screens/farm/crops/fertigationCatalogue';
import { LogFertigationScreen } from '../screens/farm/crops/LogFertigationScreen';
import { todayInKolkata } from '../screens/certifications/certificationForm';
import { t } from '../../../i18n/farmer';
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

function headerOf(init: RequestInit | undefined, name: string): string | null {
  const h = init?.headers;
  if (!h) return null;
  if (h instanceof Headers) return h.get(name);
  const entry = Object.entries(h as Record<string, string>).find(([k]) => k.toLowerCase() === name.toLowerCase());
  return entry ? entry[1] : null;
}

describe('Farmer Crop Inputs API Client (BR-56)', () => {
  const farmCropId = '77777777-8888-4444-9999-000000000001';
  const inputId = '55555555-4444-3333-2222-111111111111';

  const baseResponse: CropInputResponse = {
    id: inputId,
    farmerId: 'farmer-uuid',
    farmCropId,
    inputType: 'MANURE',
    inputName: 'Vermicompost',
    appliedOn: '2026-07-31',
    quantity: 60,
    unit: 'KG',
    costInr: null,
    nitrogenPct: null,
    phosphorusPct: null,
    potassiumPct: null,
    applicationMethod: 'Drench',
    notes: null,
    createdAt: '2026-07-31T05:30:00.000Z',
    updatedAt: null,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-fertigation-test');
  });

  afterEach(() => {
    setAccessToken(null);
  });

  it('BR-56: createCropInput sends POST /farmers/me/crops/:farmCropId/inputs with the body and Idempotency-Key', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: unknown = null;
    let capturedKey: string | null = null;

    const requestBody: CreateCropInputRequest = {
      inputType: 'MANURE',
      inputName: 'Vermicompost',
      appliedOn: '2026-07-31',
      quantity: 60,
      unit: 'KG',
      applicationMethod: 'Drench',
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? 'GET';
      capturedBody = init?.body ? JSON.parse(String(init.body)) : null;
      capturedKey = headerOf(init, 'Idempotency-Key');
      return jsonResponse(baseResponse, 201);
    }) as typeof fetch;

    const result = await createCropInput(farmCropId, requestBody, 'key-123');

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/inputs`);
    expect(capturedMethod).toBe('POST');
    expect(capturedBody).toEqual(requestBody);
    expect(capturedKey).toBe('key-123');
    expect(result.id).toBe(inputId);
  });

  it('BR-56: getCropInput sends GET /farmers/me/crops/:farmCropId/inputs/:id', async () => {
    let capturedUrl = '';
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return jsonResponse({ ...baseResponse, inputName: 'Jeevamrutha', unit: 'LITRE' });
    }) as typeof fetch;

    const result = await getCropInput(farmCropId, inputId);

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/inputs/${inputId}`);
    expect(result.inputName).toBe('Jeevamrutha');
    expect(result.unit).toBe('LITRE');
  });

  it('BR-56: updateCropInput sends PATCH /farmers/me/crops/:farmCropId/inputs/:id', async () => {
    let capturedMethod = '';
    let capturedBody: unknown = null;
    const patchBody: UpdateCropInputRequest = { quantity: 80 };

    global.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedMethod = init?.method ?? 'GET';
      capturedBody = init?.body ? JSON.parse(String(init.body)) : null;
      return jsonResponse({ ...baseResponse, quantity: 80 });
    }) as typeof fetch;

    const result = await updateCropInput(farmCropId, inputId, patchBody);

    expect(capturedMethod).toBe('PATCH');
    expect(capturedBody).toEqual(patchBody);
    expect(result.quantity).toBe(80);
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

  it('BR-56a: rejects with ApiError on validation failure', async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse(
        { type: 'about:blank', title: 'Validation Failed', status: 422, code: 'VALIDATION_FAILED', detail: 'quantity must be greater than 0.' },
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
    expect((error as ApiError).problem.detail).toBe('quantity must be greater than 0.');
  });
});

describe('BR-56a: fertigation quantity validation (numeric(10,2), positive)', () => {
  it.each(['', '  ', '0', '0.00', '-1', 'abc', '1.234', '1e3', '1,5', '.', '123456789', 'Infinity', 'NaN'])(
    'BR-56a: quantity %j is rejected',
    (qty) => {
      expect(parseQuantity(qty)).toBeNull();
    },
  );

  it('BR-56a: parseQuantity accepts up to 2 decimals and trims whitespace', () => {
    expect(parseQuantity(' 0.3 ')).toBe('0.3');
    expect(parseQuantity('12.50')).toBe('12.50');
    expect(parseQuantity('.5')).toBe('.5');
    expect(parseQuantity('99999999.99')).toBe('99999999.99');
  });
});

describe('Approved fertigation inputs catalogue (local, pending a backend catalogue)', () => {
  it('carries no placeholder prices and no invented NPK percentages', () => {
    expect(APPROVED_FERTIGATION_INPUTS.length).toBeGreaterThan(0);
    for (const item of APPROVED_FERTIGATION_INPUTS) {
      const keys = Object.keys(item);
      for (const banned of ['pricePerUnit', 'nitrogenPct', 'phosphorusPct', 'potassiumPct']) {
        expect(keys, `${item.name} ${banned}`).not.toContain(banned);
      }
    }
  });

  it('the method picker offers exactly the Dev design methods', () => {
    expect(APPLICATION_METHODS.map((m) => m.value)).toEqual([
      'Drench',
      'Foliar spray',
      'Drip irrigation',
      'Soil incorporation',
      'Broadcasting',
    ]);
  });

  it('neither the screen nor the catalogue holds a price list, nutrient reference table, or fixed date', () => {
    for (const f of [
      '../screens/farm/crops/LogFertigationScreen.tsx',
      '../screens/farm/crops/fertigationCatalogue.ts',
    ]) {
      const src = fs.readFileSync(path.resolve(__dirname, f), 'utf8');
      expect(src, f).not.toMatch(/pricePerUnit|nitrogenPct|phosphorusPct|potassiumPct|costInr/);
      expect(src, f).not.toMatch(/CROP_REFERENCES|CROP_NUTRIENT_REFERENCES|idealPh:\s*'/);
      expect(src, f).not.toMatch(/Math\.round|parseFloat|toFixed/);
      expect(src, f).not.toContain('31 Jul 2026');
    }
  });
});

describe('LogFertigationScreen i18n', () => {
  const en: Record<string, string> = { ...errorsEn, ...farmerEn };
  const ta: Record<string, string> = { ...errorsTa, ...farmerTa };
  it('every farmer.logFertigation.* key used by the screen and its catalogue exists in en and ta', () => {
    const keys = new Set<string>();
    for (const f of ['../screens/farm/crops/LogFertigationScreen.tsx', '../screens/farm/crops/fertigationCatalogue.ts']) {
      const src = fs.readFileSync(path.resolve(__dirname, f), 'utf8');
      for (const m of src.matchAll(/(['"])(farmer\.logFertigation\.[A-Za-z0-9_.-]+)\1/g)) keys.add(m[2]!);
    }
    expect(keys.size).toBeGreaterThan(10);
    for (const key of keys) {
      expect(en[key], `en ${key}`).toBeTruthy();
      expect(ta[key], `ta ${key}`).toBeTruthy();
    }
  });

  it('en copy renders exactly what the Dev screen rendered', () => {
    expect(en['farmer.logFertigation.reference.footer']).toBe('Full breakdown in the NPK Contribution Tracker (Screen 38).');
    expect(en['farmer.logFertigation.cost.badge']).toBe('AUTO · EDITABLE');
    expect(en['farmer.logFertigation.nextDate.label']).toBe('Next application date');
    expect(en['farmer.logFertigation.alert.savedTitle']).toBe('Fertigation Logged');
    expect(en['farmer.logFertigation.alert.invalidQuantityTitle']).toBe('Invalid Quantity');
    expect(en['farmer.logFertigation.alert.invalidQuantityBody']).toBe('Please enter a valid application quantity.');
    expect(en['farmer.logFertigation.field.select']).toBe('Select Field');
    expect(en['farmer.logFertigation.input.select']).toBe('Select Input name');
    expect(en['farmer.logFertigation.method.select']).toBe('Select Method');
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

  let posts: { body: Record<string, unknown>; key: string | null }[];

  beforeEach(() => {
    alertSpy.mockReset();
    posts = [];
    cropItemsState.items = [CROP];
    cropItemsState.loading = false;
    cropItemsState.error = null;
    cropItemsState.reload.mockClear();
    setAccessToken('token-fertigation-test');
    global.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
      posts.push({ body, key: headerOf(init, 'Idempotency-Key') });
      return jsonResponse({ id: 'new-input', ...body }, 201);
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

  async function mount(crop: Record<string, unknown> | null = CROP): Promise<renderer.ReactTestRenderer> {
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

  it('BR-56: saving POSTs the farmer-entered application with an Idempotency-Key, and no cost or NPK percentages', async () => {
    const tree = await mount();
    await typeQuantity(tree, '0.35');
    await save(tree);

    expect(posts).toHaveLength(1);
    const body = posts[0]!.body;
    expect(body['inputName']).toBe('Vermicompost');
    expect(body['inputType']).toBe('MANURE');
    expect(body['quantity']).toBe(0.35);
    expect(body['unit']).toBe('KG');
    expect(body['applicationMethod']).toBe('Drench');
    expect(body['appliedOn']).toBe(todayInKolkata());
    expect(body).not.toHaveProperty('costInr');
    expect(body).not.toHaveProperty('nitrogenPct');
    expect(body).not.toHaveProperty('phosphorusPct');
    expect(body).not.toHaveProperty('potassiumPct');
    expect(posts[0]!.key).toMatch(/^[0-9a-f-]{36}$/);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0]![0]).toBe(t('farmer.logFertigation.alert.savedTitle'));
  });

  it('BR-56f: the cost card shows no invented price or amount', async () => {
    const tree = await mount();
    const text = textOf(tree);
    // Dev's placeholder: 60 kg x Rs 12 = Rs 720.
    expect(text).not.toContain('720');
    expect(text).not.toContain('₹12');
    expect(text).toContain(t('farmer.logFertigation.cost.badge'));
    const amount = tree.root.findByProps({ testID: 'logFertigation.cost' });
    expect(renderedText(amount.children as never).join('')).toBe(
      t('farmer.logFertigation.cost.amount', { amount: t('farmer.logFertigation.empty') }),
    );
  });

  it('the designed "Next application date" block is present, with no fabricated date or interval', async () => {
    const tree = await mount();
    expect(tree.root.findAllByProps({ testID: 'logFertigation.nextDate' }).length).toBeGreaterThan(0);
    const text = textOf(tree);
    expect(text).toContain('Next application date');
    expect(text).not.toContain('31 Jul 2026');
    expect(text).not.toContain('+14');

    await save(tree);
    expect(posts).toHaveLength(1);
    expect(String(posts[0]!.body['notes'] ?? '')).not.toMatch(/next application|31 Jul 2026/i);
  });

  it('the reference card keeps its layout but shows no invented pH/NPK targets', async () => {
    const tree = await mount();
    expect(tree.root.findAllByProps({ testID: 'logFertigation.referenceCard' }).length).toBeGreaterThan(0);
    const text = textOf(tree);
    expect(text).toContain('REFERENCE · CARROT');
    for (const fake of ['5.5', '40', '30', '50']) {
      const values = tree.root
        .findAllByProps({ testID: 'logFertigation.referenceValue' })
        .map((n) => renderedText(n.children as never).join(''));
      expect(values).not.toContain(fake);
    }
  });

  it.each(['0', '1.234', 'abc', ''])('BR-56a: quantity %j blocks the save with no request', async (qty) => {
    const tree = await mount();
    await typeQuantity(tree, qty);
    await save(tree);
    expect(posts).toHaveLength(0);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0]![0]).toBe(t('farmer.logFertigation.alert.invalidQuantityTitle'));
  });

  it('BR-56: with no crop to log against, nothing is sent', async () => {
    cropItemsState.items = [];
    const tree = await mount(null);
    await save(tree);
    expect(posts).toHaveLength(0);
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it('BR-56: a server rejection surfaces the problem detail, and a retry replays the same Idempotency-Key', async () => {
    let calls = 0;
    const keys: (string | null)[] = [];
    global.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls += 1;
      keys.push(headerOf(init, 'Idempotency-Key'));
      return jsonResponse(
        { type: 'about:blank', title: 'Validation Failed', status: 422, code: 'VALIDATION_FAILED', detail: 'appliedOn is in the future' },
        422,
      );
    }) as typeof fetch;
    const tree = await mount();
    await save(tree);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0]![0]).toBe(t('farmer.logFertigation.alert.saveFailedTitle'));
    expect(alertSpy.mock.calls[0]![1]).toBe('appliedOn is in the future');

    await save(tree);
    expect(calls).toBe(2);
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
  });

  it('BR-56: the save button is disabled while a save is in flight (no double submit)', async () => {
    let release!: () => void;
    global.fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          release = () => resolve(jsonResponse({ id: 'x' }, 201));
        }),
    ) as typeof fetch;
    const tree = await mount();
    const btn = tree.root.findByProps({ testID: 'logFertigation.save' });
    let pending!: Promise<void>;
    await act(async () => {
      pending = (btn.props.onPress as () => Promise<void>)();
    });
    expect(tree.root.findByProps({ testID: 'logFertigation.save' }).props.disabled).toBe(true);
    await act(async () => {
      release();
      await pending;
    });
    expect(tree.root.findByProps({ testID: 'logFertigation.save' }).props.disabled).toBe(false);
  });

  it('crop list load failure shows a retry state in the field selector instead of an invented field', async () => {
    cropItemsState.items = [];
    cropItemsState.error = new Error('offline');
    const tree = await mount(null);
    const text = textOf(tree);
    expect(text).toContain(t('farmer.logFertigation.field.loadError'));
    expect(text).not.toContain('Zone 1 — Upper Field (Carrot)');
    const field = tree.root.findByProps({ accessibilityLabel: t('farmer.logFertigation.field.select') });
    await act(async () => {
      (field.props.onPress as () => void)();
    });
    expect(cropItemsState.reload).toHaveBeenCalledTimes(1);
  });
});
