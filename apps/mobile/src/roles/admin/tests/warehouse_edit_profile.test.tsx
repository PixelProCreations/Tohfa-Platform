/**
 * Edit Warehouse Profile, wired into ProfileFlow behind warehouse.profile.edit.
 *
 * What is real here: ProfileFlow, WarehouseInfoScreen, WarehouseEditProfileScreen, the live data
 * hooks, the mappers and the API module (body allow-list included), all under a real
 * QueryClient. What is replaced: only the HTTP layer (adminGet / adminPatch), so the test can
 * see the exact path and body that would go on the wire and decide when the server answers.
 *
 * Rules pinned: BR-80 (PATCH /warehouses/{id}: contactPhone and operatingHours only) and BR-66
 * (PATCH /warehouses/{id}/capacity: capacityKg). Authorisation is server-side (root CLAUDE.md
 * 2.1); the client gate only decides what to render, and fails closed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as HttpModule from '../api/http';
import * as fs from 'node:fs';
import * as path from 'node:path';

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Linking: { openURL: () => Promise.resolve() },
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (o: Record<string, unknown>) => o['ios'] ?? o['default'] },
  Pressable: 'Pressable',
  RefreshControl: 'RefreshControl',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s },
  Switch: 'Switch',
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
  Polyline: 'Polyline',
  Rect: 'Rect',
}));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));

// Only the transport is replaced; every API module, hook and mapper above it stays real.
const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }));
vi.mock('../api/http', async (importOriginal) => ({
  ...(await importOriginal<typeof HttpModule>()),
  adminGet: http.get,
  adminPatch: http.patch,
}));

import { ProfileFlow } from '../screens/warehouse/profile-settings/ProfileFlow';
import { WarehouseEditProfileScreen } from '../screens/warehouse/profile-settings/WarehouseEditProfileScreen';
import { canOpenProfileRoute } from '../screens/warehouse/profile-settings/mappers';
import type { ProfileRoute } from '../screens/warehouse/profile-settings/types';
import { makeCan, type Can } from '../permissions/can';
import { ApiError } from '../../../shell/api/client';
import { en } from '../i18n';

const WID = '11111111-1111-4111-8111-111111111111';
const WAREHOUSE_PATH = `/warehouses/${WID}`;
const CAPACITY_PATH = `/warehouses/${WID}/capacity`;

const EDIT = 'warehouse.profile.edit';
const CAPACITY_SET = 'warehouse.capacity.set';
const VIEW = 'warehouse.own.view';

// What the mock server holds for the warehouse; the PATCH mock mutates it like the real one would.
const day = (open: string, close: string) => ({ closed: false, open, close });
const WEEK = {
  mon: day('08:00', '18:00'),
  tue: day('08:00', '18:00'),
  wed: day('08:00', '18:00'),
  thu: day('08:00', '18:00'),
  fri: day('08:00', '18:00'),
  sat: day('09:00', '13:00'),
  sun: { closed: true },
};
let server: { warehouse: Record<string, unknown>; capacityKg: string | null };

beforeEach(() => {
  server = {
    warehouse: {
      id: WID,
      code: 'WH-COON',
      name: 'Coonoor Warehouse',
      type: 'SUB',
      address: 'Mount Road',
      city: 'Coonoor',
      pincode: '643101',
      latitude: 11.353,
      longitude: 76.7959,
      capacityKg: '30000.000',
      contactPhone: '+919876543210',
      operatingHours: structuredClone(WEEK),
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    capacityKg: '30000.000',
  };
  http.get.mockReset();
  http.patch.mockReset();
  http.get.mockImplementation(async (p: string) => {
    if (p === WAREHOUSE_PATH) return structuredClone(server.warehouse);
    if (p === CAPACITY_PATH) {
      return { warehouseId: WID, capacityKg: server.capacityKg, usedKg: '12000.000', availableKg: '18000.000', utilizationPercent: 40 };
    }
    if (p === `${WAREHOUSE_PATH}/storage-locations`) {
      return {
        items: [
          { id: 'loc-1', warehouseId: WID, code: 'A-01', name: 'Cold Room', locationType: 'Cold', capacityKg: '500.000', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: null },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      };
    }
    throw new Error(`unexpected GET ${p}`);
  });
  http.patch.mockImplementation(async (p: string, body: Record<string, unknown>) => {
    if (p === WAREHOUSE_PATH) {
      Object.assign(server.warehouse, body);
      return structuredClone(server.warehouse);
    }
    if (p === CAPACITY_PATH) {
      server.capacityKg = body['capacityKg'] as string;
      return { warehouseId: WID, capacityKg: server.capacityKg, usedKg: '12000.000', availableKg: '0.000', utilizationPercent: 0 };
    }
    throw new Error(`unexpected PATCH ${p}`);
  });
});

const mounted: renderer.ReactTestRenderer[] = [];
afterEach(() => {
  for (const tree of mounted.splice(0)) act(() => tree.unmount());
});

async function settle(rounds = 6) {
  for (let i = 0; i < rounds; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

async function mount(element: React.ReactElement): Promise<renderer.ReactTestRenderer> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<QueryClientProvider client={client}>{element}</QueryClientProvider>);
  });
  mounted.push(tree);
  await settle();
  return tree;
}

function flow(can: Can | undefined, initialScreen: ProfileRoute = 'WarehouseProfile') {
  return (
    <ProfileFlow
      scope={{}}
      can={can as Can}
      initialScreen={initialScreen}
      onBack={() => undefined}
      warehouseOptions={[{ warehouseId: WID, warehouseName: 'Coonoor Warehouse' }]}
      initialWarehouseId={WID}
    />
  );
}

function screen(can: Can, extra: Partial<React.ComponentProps<typeof WarehouseEditProfileScreen>> = {}) {
  return <WarehouseEditProfileScreen scope={{}} can={can} onBack={() => undefined} warehouseId={WID} {...extra} />;
}

// Rendered text only (children), never props: a prop can hold an element, which is circular.
function collectText(node: renderer.ReactTestRendererJSON | renderer.ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(collectText);
  return (node.children ?? []).flatMap(collectText);
}
const textOf = (tree: renderer.ReactTestRenderer) => collectText(tree.toJSON()).join('|');
const byId = (tree: renderer.ReactTestRenderer, testID: string) => tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === testID)[0];
const editButton = (tree: renderer.ReactTestRenderer) => {
  // A missing key would match every unlabelled button; the catalogue must define the label.
  expect(en['warehouseEdit.open'], 'en catalogue key warehouseEdit.open').toBeTruthy();
  return tree.root.findAll((n) => (n.type as unknown) === 'TouchableOpacity' && n.props.accessibilityLabel === en['warehouseEdit.open'])[0];
};
const press = async (node: renderer.ReactTestInstance | undefined) => {
  expect(node).toBeDefined();
  await act(async () => {
    node?.props.onPress();
  });
  await settle();
};
const type = async (node: renderer.ReactTestInstance | undefined, text: string) => {
  expect(node).toBeDefined();
  await act(async () => {
    node?.props.onChangeText(text);
  });
};
const warehouseReads = () => http.get.mock.calls.filter((c) => c[0] === WAREHOUSE_PATH).length;

// ─── The Edit control and the route gate ─────────────────────────────────────

describe('Edit control on Warehouse Info', () => {
  it('BR-80: is hidden without warehouse.profile.edit', async () => {
    const tree = await mount(flow(makeCan([VIEW, CAPACITY_SET])));
    expect(textOf(tree)).toContain('Coonoor Warehouse');
    expect(editButton(tree)).toBeUndefined();
  });

  it('BR-80: is shown with warehouse.profile.edit', async () => {
    const tree = await mount(flow(makeCan([VIEW, EDIT])));
    expect(editButton(tree)).toBeDefined();
  });

  it('BR-80: a missing can denies: no Edit control', async () => {
    const tree = await mount(flow(makeCan(undefined)));
    expect(editButton(tree)).toBeUndefined();
    const nullTree = await mount(flow(makeCan(null)));
    expect(editButton(nullTree)).toBeUndefined();
  });

  it('BR-80: canOpenProfileRoute refuses WarehouseEditProfile without the code and leaves every other route open', () => {
    expect(canOpenProfileRoute('WarehouseEditProfile', makeCan([VIEW, CAPACITY_SET]))).toBe(false);
    expect(canOpenProfileRoute('WarehouseEditProfile', makeCan(undefined))).toBe(false);
    expect(canOpenProfileRoute('WarehouseEditProfile', makeCan([EDIT]))).toBe(true);
    expect(canOpenProfileRoute('WarehouseProfile', makeCan([]))).toBe(true);
    expect(canOpenProfileRoute('Settings', makeCan([]))).toBe(true);
  });

  it('BR-80: the flow renders no form and reads nothing when the route is opened directly without the code', async () => {
    const tree = await mount(flow(makeCan([VIEW, CAPACITY_SET]), 'WarehouseEditProfile'));
    expect(textOf(tree)).toContain(en['warehouseAdmin.notAvailable.title']);
    expect(tree.root.findAll((n) => (n.type as unknown) === 'TextInput')).toHaveLength(0);
    expect(http.get).not.toHaveBeenCalledWith(WAREHOUSE_PATH, expect.anything(), expect.anything());
    expect(warehouseReads()).toBe(0);
  });

  it('opens the editor for the selected warehouse, and Back returns to Warehouse Info', async () => {
    const tree = await mount(flow(makeCan([VIEW, EDIT])));
    await press(editButton(tree));
    expect(textOf(tree)).toContain(en['warehouseEdit.title']);
    expect(http.get).toHaveBeenCalledWith(WAREHOUSE_PATH, undefined, expect.anything());
    await press(byId(tree, 'warehouseEdit.back'));
    expect(textOf(tree)).not.toContain(en['warehouseEdit.title']);
    expect(editButton(tree)).toBeDefined();
  });
});

// ─── The form is the live record ─────────────────────────────────────────────

describe('Edit form data', () => {
  it('is pre-filled from the live warehouse: phone, capacity, hours and storage locations', async () => {
    const can = makeCan([EDIT, CAPACITY_SET]);
    const contact = await mount(screen(can, { initialTab: 'Contact' }));
    expect(byId(contact, 'warehouseEdit.contactPhone')?.props.value).toBe('+919876543210');

    const storage = await mount(screen(can, { initialTab: 'Storage' }));
    expect(byId(storage, 'warehouseEdit.capacity')?.props.value).toBe('30000');
    expect(textOf(storage)).toContain('Cold Room');

    const hours = await mount(screen(can, { initialTab: 'Operations' }));
    expect(byId(hours, 'warehouseEdit.day.mon')?.props.value).toBe(true);
    expect(byId(hours, 'warehouseEdit.day.sun')?.props.value).toBe(false);

    const details = await mount(screen(can));
    expect(textOf(details)).toContain('Coonoor Warehouse');
    expect(textOf(details)).toContain('WH-COON');
  });

  it('shows no capacity input without warehouse.capacity.set', async () => {
    const tree = await mount(screen(makeCan([EDIT]), { initialTab: 'Storage' }));
    expect(byId(tree, 'warehouseEdit.capacity')).toBeUndefined();
    expect(byId(tree, 'warehouseEdit.saveCapacity')).toBeUndefined();
  });

  it('BR-80: fails closed itself without warehouse.profile.edit: no form, no reads', async () => {
    const tree = await mount(screen(makeCan([VIEW, CAPACITY_SET]), { initialTab: 'Contact' }));
    expect(tree.root.findAll((n) => (n.type as unknown) === 'TextInput')).toHaveLength(0);
    expect(http.get).not.toHaveBeenCalled();
  });
});

// ─── Saves go to the API with the contract body ──────────────────────────────

describe('Saving', () => {
  it('BR-80: saving the phone sends one PATCH /warehouses/{id} with exactly { contactPhone } and no Idempotency-Key', async () => {
    const tree = await mount(screen(makeCan([EDIT]), { initialTab: 'Contact' }));
    await type(byId(tree, 'warehouseEdit.contactPhone'), '+91 98765 43211');
    await press(byId(tree, 'warehouseEdit.savePhone'));
    expect(http.patch).toHaveBeenCalledTimes(1);
    // Two arguments only: openapi declares no Idempotency-Key on this write (nothing moves money).
    expect(http.patch.mock.calls[0]).toEqual([WAREHOUSE_PATH, { contactPhone: '+919876543211' }]);
  });

  it('BR-80: an invalid phone is refused before any request', async () => {
    const tree = await mount(screen(makeCan([EDIT]), { initialTab: 'Contact' }));
    await type(byId(tree, 'warehouseEdit.contactPhone'), '98765');
    await press(byId(tree, 'warehouseEdit.savePhone'));
    expect(http.patch).not.toHaveBeenCalled();
    expect(textOf(tree)).toContain(en['warehouseSettings.phone.error.format']);
  });

  it('BR-80: saving the hours sends one PATCH /warehouses/{id} with exactly { operatingHours } of all seven days', async () => {
    const tree = await mount(screen(makeCan([EDIT]), { initialTab: 'Operations' }));
    await act(async () => {
      byId(tree, 'warehouseEdit.day.sun')?.props.onValueChange(true);
    });
    await press(byId(tree, 'warehouseEdit.saveHours'));
    expect(http.patch).toHaveBeenCalledTimes(1);
    expect(http.patch.mock.calls[0]).toEqual([
      WAREHOUSE_PATH,
      { operatingHours: { ...WEEK, sun: { closed: false, open: '08:00', close: '18:00' } } },
    ]);
  });

  it('BR-66: saving the capacity sends one PATCH /warehouses/{id}/capacity with exactly { capacityKg } as a decimal string', async () => {
    const tree = await mount(screen(makeCan([EDIT, CAPACITY_SET]), { initialTab: 'Storage' }));
    await type(byId(tree, 'warehouseEdit.capacity'), '31,000.5');
    await press(byId(tree, 'warehouseEdit.saveCapacity'));
    expect(http.patch).toHaveBeenCalledTimes(1);
    expect(http.patch.mock.calls[0]).toEqual([CAPACITY_PATH, { capacityKg: '31000.5' }]);
  });

  it('BR-66: a zero capacity is refused before any request', async () => {
    const tree = await mount(screen(makeCan([EDIT, CAPACITY_SET]), { initialTab: 'Storage' }));
    await type(byId(tree, 'warehouseEdit.capacity'), '0');
    await press(byId(tree, 'warehouseEdit.saveCapacity'));
    expect(http.patch).not.toHaveBeenCalled();
    expect(textOf(tree)).toContain(en['warehouseSettings.capacity.error.zero']);
  });
});

// ─── Success only after the server answered ──────────────────────────────────

describe('Save outcome', () => {
  it('a server error shows the error and never reports success', async () => {
    http.patch.mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Unprocessable', status: 422, code: 'VALIDATION_FAILED' } as never));
    const onSaveSuccess = vi.fn();
    const tree = await mount(screen(makeCan([EDIT]), { initialTab: 'Contact', onSaveSuccess }));
    await type(byId(tree, 'warehouseEdit.contactPhone'), '+919876543211');
    await press(byId(tree, 'warehouseEdit.savePhone'));
    expect(textOf(tree)).toContain(en['admin.error.VALIDATION_FAILED']);
    expect(onSaveSuccess).not.toHaveBeenCalled();
  });

  it('reports success only once the API resolved, exactly once', async () => {
    let answer!: (value: unknown) => void;
    http.patch.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));
    const onSaveSuccess = vi.fn();
    const tree = await mount(screen(makeCan([EDIT]), { initialTab: 'Contact', onSaveSuccess }));
    await type(byId(tree, 'warehouseEdit.contactPhone'), '+919876543211');
    await press(byId(tree, 'warehouseEdit.savePhone'));
    // The request is in flight: nothing is reported yet and the button is locked against a second send.
    expect(http.patch).toHaveBeenCalledTimes(1);
    expect(onSaveSuccess).not.toHaveBeenCalled();
    expect(byId(tree, 'warehouseEdit.savePhone')?.props.disabled).toBe(true);
    await act(async () => {
      answer({ ...server.warehouse, contactPhone: '+919876543211' });
    });
    await settle();
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
  });

  it('a saved edit returns to Warehouse Info and re-reads the warehouse', async () => {
    const tree = await mount(flow(makeCan([VIEW, EDIT])));
    await press(editButton(tree));
    const readsBefore = warehouseReads();
    await press(tree.root.findAll((n) => (n.type as unknown) === 'TouchableOpacity' && n.props.testID === 'warehouseEdit.tab.Contact')[0]);
    await type(byId(tree, 'warehouseEdit.contactPhone'), '+919876543299');
    await press(byId(tree, 'warehouseEdit.savePhone'));
    expect(http.patch).toHaveBeenCalledWith(WAREHOUSE_PATH, { contactPhone: '+919876543299' });
    // Back on Warehouse Info, and the saved warehouse was fetched again, not served from the stale cache.
    expect(textOf(tree)).not.toContain(en['warehouseEdit.title']);
    expect(editButton(tree)).toBeDefined();
    expect(warehouseReads()).toBeGreaterThan(readsBefore);
  });

  it('a failed edit stays on the editor', async () => {
    http.patch.mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Forbidden', status: 403, code: 'FORBIDDEN' } as never));
    const tree = await mount(flow(makeCan([VIEW, EDIT])));
    await press(editButton(tree));
    await press(tree.root.findAll((n) => (n.type as unknown) === 'TouchableOpacity' && n.props.testID === 'warehouseEdit.tab.Contact')[0]);
    await type(byId(tree, 'warehouseEdit.contactPhone'), '+919876543299');
    await press(byId(tree, 'warehouseEdit.savePhone'));
    expect(textOf(tree)).toContain(en['warehouseEdit.title']);
    expect(textOf(tree)).toContain(en['admin.error.FORBIDDEN']);
  });
});

// ─── Source guards ───────────────────────────────────────────────────────────

const PROFILE_DIR = path.join(__dirname, '..', 'screens', 'warehouse', 'profile-settings');
const EDIT_SRC = fs.readFileSync(path.join(PROFILE_DIR, 'WarehouseEditProfileScreen.tsx'), 'utf8');
const INFO_SRC = fs.readFileSync(path.join(PROFILE_DIR, 'WarehouseInfoScreen.tsx'), 'utf8');
const FLOW_SRC = fs.readFileSync(path.join(PROFILE_DIR, 'ProfileFlow.tsx'), 'utf8');
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const EDIT_CODE = stripComments(EDIT_SRC);

describe('WarehouseEditProfileScreen source guard', () => {
  it('has no hex or rgb colour literal', () => {
    expect(EDIT_CODE).not.toMatch(/['"`]#[0-9A-Fa-f]{3,8}['"`]/);
    expect(EDIT_CODE).not.toMatch(/\brgba?\s*\(/);
  });

  it('has no numeric fontSize and no fontFamily (adminType carries both)', () => {
    expect(EDIT_CODE).not.toMatch(/fontSize\s*:\s*[0-9]/);
    expect(EDIT_CODE).not.toMatch(/\bfontFamily\s*:/);
  });

  it('names no role: permissions are checked by code, never by who the user is', () => {
    expect(EDIT_CODE).not.toMatch(/SUPER_ADMIN|TOHFA_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN|FARMER_ADMIN|WAREHOUSE_ADMIN/);
    expect(EDIT_CODE).not.toMatch(/Main Warehouse|Sub Warehouse|Super Admin|Tohfa Admin/);
    expect(EDIT_CODE).not.toMatch(/\brole\s*===|\.role\b/);
  });

  it('never fails open and holds no fixture data', () => {
    expect(EDIT_CODE).not.toMatch(/can\s*=\s*\{\s*\(\s*\)\s*=>\s*true/);
    expect(EDIT_CODE).not.toMatch(/\|\|\s*!user/);
    expect(EDIT_CODE).not.toMatch(/from '\.\/fixtures'/);
    expect(EDIT_CODE).not.toMatch(/DAY_CHIPS/);
  });

  it('keeps user-facing English out of the component (every string is a t() key)', () => {
    for (const literal of ['Saving…', 'Saved ✓', 'Save failed', 'Warehouse Details', 'Edit Warehouse Profile', 'Contact Phone', 'Operating Hours', 'No warehouse selected', 'Save Capacity']) {
      expect(EDIT_CODE, literal).not.toContain(literal);
    }
  });

  it('uses only t() keys that exist in the admin en catalogue', () => {
    const keys = [...EDIT_CODE.matchAll(/\bt\(\s*'([^']+)'/g)].map((m) => m[1] as string);
    expect(keys.length).toBeGreaterThan(10);
    for (const key of keys) expect(Object.prototype.hasOwnProperty.call(en, key), key).toBe(true);
  });

  it('is at most 800 lines', () => {
    expect(EDIT_SRC.split('\n').length).toBeLessThanOrEqual(800);
  });
});

describe('Edit wiring source guard', () => {
  it('BR-80: the Info screen draws the Edit control only behind can(warehouse.profile.edit)', () => {
    expect(stripComments(INFO_SRC)).toMatch(/can\(\s*'warehouse\.profile\.edit'\s*\)/);
  });

  it('BR-80: the flow guards navigate() and the direct-open render with canOpenProfileRoute', () => {
    const code = stripComments(FLOW_SRC);
    expect(code).toMatch(/canOpenProfileRoute\(screen,\s*can\)/);
    expect(code).toMatch(/case 'WarehouseEditProfile'/);
    expect(code).not.toMatch(/can=\{\s*\(\s*\)\s*=>\s*true/);
  });
});
