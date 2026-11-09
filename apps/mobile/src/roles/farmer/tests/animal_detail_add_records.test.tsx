/**
 * AnimalDetailScreen's tabs used to be read-only: the client had POST
 * functions for every per-animal record but no screen called them. These pin
 * the add-record flow on each tab (BR-137..BR-141) and the per-animal
 * MEAT / WOOL / MANURE production log (BR-139):
 *   POST /farmers/me/livestock/animals/:id/{health,breeding}-records
 *   POST /farmers/me/livestock/animals/:id/{feed-plans,feed-logs,housing-records,hygiene-logs}
 *   POST /farmers/me/livestock/production-logs
 * The form opens in a modal, validates like the server's zod schema, cannot be
 * double-submitted, shows a localized error, and refreshes the tab after a save.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Modal: 'Modal',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: {
    create: (s: Record<string, unknown>) => s,
    flatten: (s: unknown) => s,
    absoluteFill: {},
  },
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

vi.mock('@tohfa/mobile-ui', () => ({
  Button: 'Button',
  ErrorState: 'ErrorState',
  Input: 'Input',
  Skeleton: 'Skeleton',
  SafeAreaView: 'SafeAreaView',
  ScreenStatusBar: 'ScreenStatusBar',
}));

const attachment = vi.hoisted(() => ({
  pickAnimalAttachment: vi.fn(),
  uploadAnimalAttachment: vi.fn(),
}));
vi.mock('../screens/farm/livestock/animalAttachment', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, ...attachment };
});
vi.mock('../native/documentPicker', () => ({ default: { pickSingle: vi.fn(), isCancel: vi.fn(), types: {} } }));
vi.mock('../api/registration', () => ({ signUpload: vi.fn() }));
vi.mock('../api/uploader', () => ({ uploadWithResume: vi.fn() }));

const apiGet = vi.hoisted(() => vi.fn());
const apiPost = vi.hoisted(() => vi.fn());
vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, api: { get: apiGet, post: apiPost } };
});

import { AnimalDetailScreen } from '../screens/farm/livestock/AnimalDetailScreen';
import { addDaysIso, todayInKolkata } from '../screens/certifications/certificationForm';
import { formatDayMonth } from '../screens/farm/livestock/animalRecordView';
import { ApiError } from '../../../shell/api/client';
import { setLocale, t } from '../../../i18n/farmer';

const A = 'a0000000-0000-4000-8000-000000000001';
const BASE = `/farmers/me/livestock/animals/${A}`;
const PROD = '/farmers/me/livestock/production-logs';

let animalRow: Record<string, unknown>;
let otherProduce: unknown[];

function animal(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: A,
    tag: 'C-201',
    name: 'Kaveri',
    species: 'CATTLE',
    breed: 'Gir',
    gender: 'FEMALE',
    dateOfBirth: '2022-01-10',
    source: 'BORN_ON_FARM',
    purchasedOn: null,
    sourceFarm: null,
    organicStatus: 'ORGANIC',
    lifecycleStatus: 'ACTIVE',
    withdrawalUntil: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

const page = (items: unknown[]) => ({ items, page: { nextCursor: null, hasMore: false } });

function productionLog(id: string, productType: string, quantity: number, restrictedFromSale: boolean): Record<string, unknown> {
  return {
    id,
    animalId: A,
    productType,
    quantity,
    unit: 'KG',
    loggedOn: todayInKolkata(),
    batchInfo: null,
    sessions: null,
    session: null,
    qualityGrade: null,
    fatPercent: null,
    restrictedFromSale,
    notes: null,
    createdAt: '2026-07-12T06:00:00.000Z',
    updatedAt: null,
  };
}

function route(p: string): Promise<unknown> {
  if (p === BASE) return Promise.resolve(animalRow);
  if (p.startsWith(`${BASE}/housing-records`)) return Promise.resolve({ ...page([]), spaceStandard: null });
  if (p.startsWith(`${BASE}/`)) return Promise.resolve(page([]));
  if (p.startsWith(PROD)) {
    const type = new URLSearchParams(p.split('?')[1] ?? '').get('productType');
    return Promise.resolve(page(otherProduce.filter((l) => (l as { productType: string }).productType === type)));
  }
  return Promise.reject(new Error(`unexpected GET ${p}`));
}

function renderedText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

function textOf(tree: renderer.ReactTestRenderer): string {
  return renderedText(tree.toJSON()).join('');
}

function textWithin(tree: renderer.ReactTestRenderer, testID: string): string {
  const node = tree.root.findByProps({ testID });
  const collect = (n: renderer.ReactTestInstance | string): string =>
    typeof n === 'string' ? n : n.children.map(collect).join('');
  return collect(node);
}

function has(tree: renderer.ReactTestRenderer, testID: string): boolean {
  return tree.root.findAllByProps({ testID }).length > 0;
}

async function settle(): Promise<void> {
  for (let i = 0; i < 3; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<AnimalDetailScreen animalId={A} />);
  });
  await settle();
  return tree;
}

async function press(tree: renderer.ReactTestRenderer, testID: string): Promise<void> {
  const node = tree.root.findByProps({ testID });
  await act(async () => {
    (node.props as { onPress: () => void }).onPress();
  });
  await settle();
}

async function type(tree: renderer.ReactTestRenderer, field: string, text: string): Promise<void> {
  const node = tree.root.findByProps({ testID: `animalRecordForm.field.${field}` });
  await act(async () => {
    (node.props as { onChangeText: (s: string) => void }).onChangeText(text);
  });
}

async function choose(tree: renderer.ReactTestRenderer, field: string, value: string): Promise<void> {
  await press(tree, `animalRecordForm.option.${field}.${value}`);
}

function getCount(prefix: string): number {
  return apiGet.mock.calls.filter((c) => (c[0] as string).startsWith(prefix)).length;
}

function validationProblem(errors?: Record<string, string[]>): ApiError {
  return new ApiError({
    type: 'about:blank',
    title: 'Request validation failed',
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'One or more fields are invalid.',
    ...(errors ? { errors } : {}),
  });
}

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  attachment.pickAnimalAttachment.mockReset();
  attachment.uploadAnimalAttachment.mockReset();
  animalRow = animal();
  otherProduce = [];
  apiGet.mockImplementation((p: string) => route(p));
  apiPost.mockImplementation((p: string, body: Record<string, unknown>) => Promise.resolve({ id: 'new-1', animalId: A, ...body, path: p }));
});

afterEach(() => {
  setLocale('en');
});

describe('health: add a record', () => {
  it('opens the form, posts the vaccination and refreshes the health list', async () => {
    const tree = await mount();
    expect(getCount(`${BASE}/health-records`)).toBe(1);
    await press(tree, 'animalDetail.health.add');
    expect(has(tree, 'animalRecordForm.health')).toBe(true);
    await type(tree, 'vaccineName', 'HS vaccine');
    await press(tree, 'animalRecordForm.submit');
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(apiPost.mock.calls[0]![0]).toBe(`${BASE}/health-records`);
    expect(apiPost.mock.calls[0]![1]).toEqual({ recordType: 'VACCINATION', recordDate: todayInKolkata(), vaccineName: 'HS vaccine' });
    expect(has(tree, 'animalRecordForm.health')).toBe(false);
    expect(getCount(`${BASE}/health-records`)).toBe(2);
  });

  it('shows the field error next to the field and posts nothing while the form is invalid', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.health.add');
    await press(tree, 'animalRecordForm.submit');
    expect(apiPost).not.toHaveBeenCalled();
    expect(textWithin(tree, 'animalRecordForm.fieldError.vaccineName')).toBe(t('farmer.livestock.detail.form.error.required'));
  });

  it('cannot be submitted twice while the first save is in flight', async () => {
    let resolvePost!: (v: unknown) => void;
    apiPost.mockImplementation(() => new Promise((resolve) => (resolvePost = resolve)));
    const tree = await mount();
    await press(tree, 'animalDetail.health.add');
    await type(tree, 'vaccineName', 'HS vaccine');
    const submit = tree.root.findByProps({ testID: 'animalRecordForm.submit' });
    await act(async () => {
      (submit.props as { onPress: () => void }).onPress();
      (submit.props as { onPress: () => void }).onPress();
    });
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect((tree.root.findByProps({ testID: 'animalRecordForm.submit' }).props as { disabled: boolean }).disabled).toBe(true);
    await act(async () => {
      resolvePost({ id: 'h1' });
    });
    await settle();
  });

  it('a server error is shown localized (Tamil), and the form stays open', async () => {
    apiPost.mockRejectedValue(validationProblem({ 'body.vaccineName': ['String must contain at most 160 character(s)'] }));
    setLocale('ta');
    const tree = await mount();
    await press(tree, 'animalDetail.health.add');
    await type(tree, 'vaccineName', 'HS vaccine');
    await press(tree, 'animalRecordForm.submit');
    expect(textWithin(tree, 'animalRecordForm.error')).toBe(t('farmer.livestock.detail.form.error.validation'));
    expect(textWithin(tree, 'animalRecordForm.fieldError.vaccineName')).toBe(t('farmer.livestock.detail.form.error.serverRejected'));
    expect(textOf(tree)).not.toContain('String must contain');
    expect(has(tree, 'animalRecordForm.health')).toBe(true);
  });

  it('BR-138c: rejects a withdrawal end date before its start date before anything is sent', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.health.add');
    await choose(tree, 'recordType', 'TREATMENT');
    await type(tree, 'condition', 'Mastitis');
    await type(tree, 'description', 'Herbal udder wash');
    await type(tree, 'milkWithdrawalStart', addDaysIso(todayInKolkata(), 3));
    await type(tree, 'milkWithdrawalEnd', addDaysIso(todayInKolkata(), 2));
    await press(tree, 'animalRecordForm.submit');
    expect(apiPost).not.toHaveBeenCalled();
    expect(has(tree, 'animalRecordForm.fieldError.milkWithdrawalEnd')).toBe(true);
  });

  it('BR-138: a treatment with a withdrawal refreshes the animal, so the withdrawal banner appears', async () => {
    const tree = await mount();
    expect(has(tree, 'animalDetail.withdrawalBanner')).toBe(false);
    const end = addDaysIso(todayInKolkata(), 5);
    await press(tree, 'animalDetail.health.add');
    await choose(tree, 'recordType', 'TREATMENT');
    await type(tree, 'condition', 'Mastitis');
    await type(tree, 'description', 'Herbal udder wash');
    await type(tree, 'milkWithdrawalStart', todayInKolkata());
    await type(tree, 'milkWithdrawalEnd', end);
    animalRow = animal({ withdrawalUntil: end });
    await press(tree, 'animalRecordForm.submit');
    expect(apiPost.mock.calls[0]![1]).toMatchObject({
      recordType: 'TREATMENT',
      milkWithdrawal: { startDate: todayInKolkata(), endDate: end },
    });
    expect(apiGet.mock.calls.filter((c) => c[0] === BASE).length).toBe(2);
    expect(has(tree, 'animalDetail.withdrawalBanner')).toBe(true);
  });

  it('sends the uploaded attachment id as attachmentUploadId', async () => {
    attachment.pickAnimalAttachment.mockResolvedValue({
      kind: 'picked',
      file: { uri: 'file:///c/receipt.pdf', name: 'receipt.pdf', contentType: 'application/pdf', sizeBytes: 2048 },
    });
    attachment.uploadAnimalAttachment.mockResolvedValue('b0000000-0000-4000-8000-0000000000aa');
    const tree = await mount();
    await press(tree, 'animalDetail.health.add');
    await type(tree, 'vaccineName', 'HS vaccine');
    await press(tree, 'animalRecordForm.attach');
    expect(textWithin(tree, 'animalRecordForm.attachment')).toContain('receipt.pdf');
    await press(tree, 'animalRecordForm.submit');
    expect(attachment.uploadAnimalAttachment).toHaveBeenCalledTimes(1);
    expect(apiPost.mock.calls[0]![1]).toMatchObject({ attachmentUploadId: 'b0000000-0000-4000-8000-0000000000aa' });
  });

  it('a failed attachment upload is a localized error and nothing is posted', async () => {
    attachment.pickAnimalAttachment.mockResolvedValue({
      kind: 'picked',
      file: { uri: 'file:///c/receipt.pdf', name: 'receipt.pdf', contentType: 'application/pdf', sizeBytes: 2048 },
    });
    attachment.uploadAnimalAttachment.mockRejectedValue(new Error('offline'));
    const tree = await mount();
    await press(tree, 'animalDetail.health.add');
    await type(tree, 'vaccineName', 'HS vaccine');
    await press(tree, 'animalRecordForm.attach');
    await press(tree, 'animalRecordForm.submit');
    expect(apiPost).not.toHaveBeenCalled();
    expect(textWithin(tree, 'animalRecordForm.error')).toBe(t('farmer.livestock.detail.form.attachment.uploadFailed'));
  });
});

describe('breeding: add a record', () => {
  it('BR-140: hides add-breeding for a MALE animal', async () => {
    animalRow = animal({ gender: 'MALE' });
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    expect(has(tree, 'animalDetail.breeding.add')).toBe(false);
  });

  it('BR-140: a FEMALE animal can add a breeding record, and the list refreshes', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    expect(getCount(`${BASE}/breeding-records`)).toBe(1);
    await press(tree, 'animalDetail.breeding.add');
    await choose(tree, 'recordType', 'HEAT');
    await choose(tree, 'breedingMethod', 'NATURAL_SERVICE');
    await type(tree, 'sire', 'B-07');
    await press(tree, 'animalRecordForm.submit');
    expect(apiPost.mock.calls[0]![0]).toBe(`${BASE}/breeding-records`);
    expect(apiPost.mock.calls[0]![1]).toEqual({
      recordType: 'HEAT',
      recordDate: todayInKolkata(),
      breedingMethod: 'NATURAL_SERVICE',
      sire: 'B-07',
    });
    expect(getCount(`${BASE}/breeding-records`)).toBe(2);
  });

  it("BR-140: the server's female-only 422 is shown clearly (localized)", async () => {
    apiPost.mockRejectedValue(validationProblem());
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    await press(tree, 'animalDetail.breeding.add');
    await choose(tree, 'recordType', 'HEAT');
    await choose(tree, 'breedingMethod', 'NATURAL_SERVICE');
    await type(tree, 'sire', 'B-07');
    await press(tree, 'animalRecordForm.submit');
    expect(textWithin(tree, 'animalRecordForm.error')).toBe(t('farmer.livestock.detail.form.error.femaleOnly'));
  });
});

describe('feed and housing: add records', () => {
  const cases: Array<{
    name: string;
    tab: string;
    button: string;
    fill: (tree: renderer.ReactTestRenderer) => Promise<void>;
    path: string;
    body: Record<string, unknown>;
  }> = [
    {
      name: 'feed plan',
      tab: 'Feed',
      button: 'animalDetail.feed.addPlan',
      fill: async (tree) => {
        await choose(tree, 'feedType', 'GREEN_FODDER');
        await choose(tree, 'waterSource', 'WELL');
      },
      path: `${BASE}/feed-plans`,
      body: { feedType: 'GREEN_FODDER', waterSource: 'WELL', effectiveFrom: todayInKolkata() },
    },
    {
      name: 'feed log',
      tab: 'Feed',
      button: 'animalDetail.feed.addLog',
      fill: async (tree) => {
        await choose(tree, 'feedType', 'DRY_FODDER');
        await type(tree, 'quantity', '12');
      },
      path: `${BASE}/feed-logs`,
      body: { feedType: 'DRY_FODDER', quantity: 12, unit: 'KG', fedOn: todayInKolkata() },
    },
    {
      name: 'housing record',
      tab: 'Housing',
      button: 'animalDetail.housing.add',
      fill: async (tree) => {
        await choose(tree, 'housingType', 'BARN');
        await type(tree, 'housingName', 'Main barn');
        await type(tree, 'indoorValue', '14');
        await type(tree, 'outdoorValue', '40');
      },
      path: `${BASE}/housing-records`,
      body: {
        housingType: 'BARN',
        housingName: 'Main barn',
        indoorSpacePerAnimal: { value: 14, unit: 'SQ_FT' },
        outdoorSpace: { value: 40, unit: 'SQ_FT' },
        startDate: todayInKolkata(),
      },
    },
    {
      name: 'hygiene log',
      tab: 'Housing',
      button: 'animalDetail.housing.addHygiene',
      fill: async (tree) => {
        await type(tree, 'activity', 'Floor scrubbed');
      },
      path: `${BASE}/hygiene-logs`,
      body: { activity: 'Floor scrubbed', performedOn: todayInKolkata() },
    },
  ];

  it.each(cases)('$name: posts the body and refreshes its list', async ({ tab, button, fill, path, body }) => {
    const tree = await mount();
    await press(tree, `animalDetail.tab.${tab}`);
    const listPath = path;
    const before = getCount(listPath);
    expect(before).toBe(1);
    await press(tree, button);
    await fill(tree);
    await press(tree, 'animalRecordForm.submit');
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(apiPost.mock.calls[0]![0]).toBe(path);
    expect(apiPost.mock.calls[0]![1]).toEqual(body);
    expect(getCount(listPath)).toBe(2);
  });
});

describe('production: MEAT / WOOL / MANURE', () => {
  it('logs the product in KG for this animal and lists it in the Production tab', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Production');
    expect(has(tree, 'animalDetail.production.otherEmpty')).toBe(true);
    await press(tree, 'animalDetail.production.add');
    await choose(tree, 'productType', 'WOOL');
    await type(tree, 'quantity', '2.5');
    otherProduce = [productionLog('w1', 'WOOL', 2.5, false)];
    apiPost.mockResolvedValue(productionLog('w1', 'WOOL', 2.5, false));
    await press(tree, 'animalRecordForm.submit');
    expect(apiPost.mock.calls[0]![0]).toBe(PROD);
    expect(apiPost.mock.calls[0]![1]).toEqual({
      animalId: A,
      productType: 'WOOL',
      quantity: 2.5,
      unit: 'KG',
      loggedOn: todayInKolkata(),
    });
    expect(apiPost.mock.calls[0]![1]).not.toHaveProperty('fatPercent');
    expect(textWithin(tree, 'animalDetail.production.log:w1')).toContain(t('farmer.livestock.detail.form.option.productType.WOOL'));
    expect(has(tree, 'animalDetail.production.restricted:w1')).toBe(false);
    expect(has(tree, 'animalDetail.production.restrictedNotice')).toBe(false);
  });

  it('BR-139: shows the restricted-from-sale notice when the saved log comes back restricted', async () => {
    const until = addDaysIso(todayInKolkata(), 4);
    animalRow = animal({ withdrawalUntil: until });
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Production');
    await press(tree, 'animalDetail.production.add');
    await choose(tree, 'productType', 'MEAT');
    await type(tree, 'quantity', '30');
    otherProduce = [productionLog('m1', 'MEAT', 30, true)];
    apiPost.mockResolvedValue(productionLog('m1', 'MEAT', 30, true));
    await press(tree, 'animalRecordForm.submit');
    expect(textWithin(tree, 'animalDetail.production.restrictedNotice')).toBe(
      t('farmer.livestock.detail.form.production.restrictedNotice', { date: formatDayMonth(until) }),
    );
    expect(textWithin(tree, 'animalDetail.production.restricted:m1')).toBe(t('farmer.livestock.detail.form.production.restrictedBadge'));
  });

  it('BR-139: the notice follows the server flag, not the client: restricted even when the animal looked clear', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Production');
    await press(tree, 'animalDetail.production.add');
    await choose(tree, 'productType', 'MANURE');
    await type(tree, 'quantity', '40');
    apiPost.mockResolvedValue(productionLog('n1', 'MANURE', 40, true));
    await press(tree, 'animalRecordForm.submit');
    expect(textWithin(tree, 'animalDetail.production.restrictedNotice')).toBe(
      t('farmer.livestock.detail.form.production.restrictedNoticeNoDate'),
    );
  });

  it('BR-139: warns on the form, before saving, that the animal is under withdrawal (Tamil)', async () => {
    const until = addDaysIso(todayInKolkata(), 4);
    animalRow = animal({ withdrawalUntil: until });
    setLocale('ta');
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Production');
    await press(tree, 'animalDetail.production.add');
    expect(textWithin(tree, 'animalRecordForm.withdrawalWarning')).toBe(
      t('farmer.livestock.detail.form.production.withdrawalWarning', { date: formatDayMonth(until) }),
    );
  });

  it('BR-139: no withdrawal warning for an animal that is not under withdrawal', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Production');
    await press(tree, 'animalDetail.production.add');
    expect(has(tree, 'animalRecordForm.withdrawalWarning')).toBe(false);
  });

  it('a 422 from the server is a localized error, not a saved notice', async () => {
    apiPost.mockRejectedValue(validationProblem({ 'body.unit': ["unit does not match this productType's fixed unit"] }));
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Production');
    await press(tree, 'animalDetail.production.add');
    await choose(tree, 'productType', 'MEAT');
    await type(tree, 'quantity', '30');
    await press(tree, 'animalRecordForm.submit');
    expect(textWithin(tree, 'animalRecordForm.error')).toBe(t('farmer.livestock.detail.form.error.validation'));
    expect(has(tree, 'animalDetail.production.restrictedNotice')).toBe(false);
  });
});
