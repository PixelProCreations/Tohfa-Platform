/**
 * AnimalDetailScreen used to render hard-coded mock rows (FMD vaccine given
 * "10 Apr", a "Dr. Anand" checkup, "Cycle 3 · Confirmed pregnant",
 * "Upper paddock · 5 h/day", "Bedding replaced 16 Jul" ...) and its add
 * modals "saved" into local state only. These tests pin every tab to the real
 * per-animal endpoints (BR-136..BR-139):
 *   GET  /farmers/me/livestock/animals/:id
 *   GET  /farmers/me/livestock/animals/:id/{health,breeding}-records
 *   GET  /farmers/me/livestock/animals/:id/{feed-plans,feed-logs,housing-records,hygiene-logs}
 *   GET  /farmers/me/livestock/production-logs?animalId=:id
 *   POST the same resources (+ production-logs)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  Modal: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? React.createElement('Modal', null, children) : null,
  RefreshControl: 'RefreshControl',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFillObject: {} },
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
  ErrorState: 'ErrorState',
  Skeleton: 'Skeleton',
}));

vi.mock('react-native-document-picker', () => ({
  default: { pickSingle: vi.fn(), isCancel: () => false, types: { pdf: 'pdf', images: 'images' } },
}));

const apiGet = vi.hoisted(() => vi.fn());
const apiPost = vi.hoisted(() => vi.fn());
vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, api: { get: apiGet, post: apiPost } };
});

import { AnimalDetailScreen } from '../screens/farm/livestock/AnimalDetailScreen';
import { addDaysIso, localTodayIso } from '../screens/farm/livestock/animalRecordView';
import { FORM_I18N_KEYS, fieldErrorMessage } from '../screens/farm/livestock/animalRecordForms';
import { t } from '../../../i18n/farmer';
import { VIEW_I18N_KEYS } from '../screens/farm/livestock/animalRecordView';
import errorsEn from '../../../i18n/errors.en.json';
import errorsTa from '../../../i18n/errors.ta.json';
import farmerEn from '../../../i18n/farmer.en.json';
import farmerTa from '../../../i18n/farmer.ta.json';

const A = 'a0000000-0000-4000-8000-000000000001';
const BASE = `/farmers/me/livestock/animals/${A}`;
const TODAY = localTodayIso();

interface Fixture {
  animal: Record<string, unknown>;
  animalAfterSave: Record<string, unknown> | null;
  health: unknown[] | 'error';
  breeding: unknown[];
  /** The breeding list's page.hasMore (pagination of the cycle derivation). */
  breedingHasMore: boolean;
  feedPlans: unknown[];
  feedLogs: unknown[];
  housing: unknown[];
  /** BR-140: the server's spaceStandard; 'missing' = a response without it; '503' = the GET fails. */
  spaceStandard: number | 'missing' | '503';
  hygiene: unknown[];
  production: unknown[];
  milkWindow: unknown[];
}

let fx: Fixture;
let animalGets = 0;
let savedOnce = false;

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

const meta = (id: string) => ({ id, animalId: A, createdAt: '2026-07-12T06:00:00.000Z', updatedAt: null });

function vaccination(id: string, name: string, recordDate: string, nextDueDate: string | null): unknown {
  return {
    ...meta(id),
    recordType: 'VACCINATION',
    recordDate,
    notes: null,
    attachmentUploadId: null,
    vaccineName: name,
    veterinarian: null,
    dose: null,
    route: null,
    batchNumber: null,
    nextDueDate,
  };
}

function treatment(id: string, condition: string, description: string): unknown {
  return {
    ...meta(id),
    recordType: 'TREATMENT',
    recordDate: '2026-07-10',
    notes: null,
    attachmentUploadId: null,
    treatmentType: null,
    condition,
    symptoms: null,
    description,
    medicineName: null,
    dosage: null,
    route: null,
    frequency: null,
    medicationStartDate: null,
    medicationEndDate: null,
    milkWithdrawal: null,
    meatWithdrawal: null,
    prescribedBy: 'Dr. Priya',
    administeredBy: null,
  };
}

function prodLog(id: string, productType: string, quantity: number, unit: string, loggedOn: string, extra: Record<string, unknown> = {}): unknown {
  return {
    id,
    animalId: A,
    productType,
    quantity,
    unit,
    loggedOn,
    batchInfo: null,
    sessions: null,
    session: null,
    qualityGrade: null,
    fatPercent: null,
    restrictedFromSale: false,
    notes: null,
    createdAt: `${loggedOn}T06:00:00.000Z`,
    updatedAt: null,
    ...extra,
  };
}

const page = (items: unknown[]) => ({ items, page: { nextCursor: null, hasMore: false } });

function defaultFixture(): Fixture {
  return {
    animal: animal(),
    animalAfterSave: null,
    health: [
      vaccination('v1', 'HS vaccine', '2026-04-10', '2026-10-10'),
      {
        ...meta('d1'),
        recordType: 'DEWORMING',
        recordDate: '2026-07-01',
        notes: null,
        attachmentUploadId: null,
        productName: 'Albendazole',
        activeIngredient: null,
        targetParasite: null,
        dose: null,
        route: null,
        animalWeight: null,
        batchNumber: null,
        expiryDate: null,
        administeredBy: null,
        nextDueDate: null,
        observedReaction: null,
      },
      treatment('t1', 'Mastitis', 'Herbal udder wash'),
    ],
    breeding: [],
    breedingHasMore: false,
    feedPlans: [],
    feedLogs: [],
    housing: [],
    spaceStandard: 12.5,
    hygiene: [],
    production: [],
    milkWindow: [],
  };
}

function route(p: string): Promise<unknown> {
  if (p === BASE) {
    animalGets += 1;
    return Promise.resolve(savedOnce && fx.animalAfterSave ? fx.animalAfterSave : fx.animal);
  }
  if (p.startsWith(`${BASE}/health-records`)) {
    return fx.health === 'error' ? Promise.reject(new Error('offline')) : Promise.resolve(page(fx.health));
  }
  if (p.startsWith(`${BASE}/breeding-records`)) {
    return Promise.resolve({ items: fx.breeding, page: { nextCursor: fx.breedingHasMore ? 'c2' : null, hasMore: fx.breedingHasMore } });
  }
  if (p.startsWith(`${BASE}/feed-plans`)) return Promise.resolve(page(fx.feedPlans));
  if (p.startsWith(`${BASE}/feed-logs`)) return Promise.resolve(page(fx.feedLogs));
  if (p.startsWith(`${BASE}/housing-records`)) {
    if (fx.spaceStandard === '503') return Promise.reject(new Error('503 INTERNAL'));
    if (fx.spaceStandard === 'missing') return Promise.resolve(page(fx.housing));
    return Promise.resolve({ ...page(fx.housing), spaceStandard: { minIndoorSqFtPerAnimal: fx.spaceStandard } });
  }
  if (p.startsWith(`${BASE}/hygiene-logs`)) return Promise.resolve(page(fx.hygiene));
  if (p.startsWith('/farmers/me/livestock/production-logs')) {
    return Promise.resolve(page(p.includes('productType=MILK') ? fx.milkWindow : fx.production));
  }
  if (p.startsWith('/farmers/me/livestock/animals?')) return Promise.resolve(page([]));
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

async function settle(): Promise<void> {
  for (let i = 0; i < 3; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

async function mount(props: Record<string, unknown> = { animalId: A }): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<AnimalDetailScreen {...props} />);
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

async function type(tree: renderer.ReactTestRenderer, testID: string, value: string): Promise<void> {
  const node = tree.root.findByProps({ testID });
  await act(async () => {
    (node.props as { onChangeText: (v: string) => void }).onChangeText(value);
  });
}

function getPaths(): string[] {
  return apiGet.mock.calls.map((c) => c[0] as string);
}

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  fx = defaultFixture();
  animalGets = 0;
  savedOnce = false;
  apiGet.mockImplementation((p: string) => route(p));
  apiPost.mockImplementation((p: string, body: Record<string, unknown>) => {
    savedOnce = true;
    return Promise.resolve({ id: 'new', animalId: A, ...body, path: p });
  });
});

describe('animal + loading / error states', () => {
  it('shows the loading skeleton first, then the real animal', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AnimalDetailScreen animalId={A} />);
    });
    // The GET has not resolved inside the first act tick for this assertion's purpose:
    expect(getPaths()).toContain(BASE);
    await settle();
    expect(textOf(tree)).toContain('Kaveri');
    expect(textOf(tree)).toContain('C-201');
  });

  it('a missing animal id is an error state, never a fabricated animal', async () => {
    const tree = await mount({});
    expect(apiGet).not.toHaveBeenCalled();
    expect(tree.root.findAllByProps({ testID: 'animalDetail.error' }).length).toBe(1);
    expect(textOf(tree)).not.toContain('Lakshmi');
  });
});

describe('Health tab', () => {
  it('maps vaccinations, deworming and treatments from ONE health-records list', async () => {
    const tree = await mount();
    const healthCalls = getPaths().filter((p) => p.includes('/health-records'));
    expect(healthCalls).toEqual([`${BASE}/health-records?limit=20`]);
    expect(textWithin(tree, 'animalDetail.health.vaccination:v1')).toContain('HS vaccine');
    expect(textWithin(tree, 'animalDetail.health.vaccination:v1')).toContain('10 Apr');
    expect(textWithin(tree, 'animalDetail.health.vaccination:v1')).toContain('10 Oct');
    expect(textWithin(tree, 'animalDetail.health.deworming:d1')).toContain('Albendazole');
    expect(textWithin(tree, 'animalDetail.health.checkup:t1')).toContain('Mastitis');
    expect(textWithin(tree, 'animalDetail.health.checkup:t1')).toContain('Dr. Priya');
    expect(textWithin(tree, 'animalDetail.health.checkup:t1')).toContain('Herbal udder wash');
    expect(textOf(tree)).not.toContain('FMD vaccine');
    expect(textOf(tree)).not.toContain('Dr. Anand');
  });

  it('shows an empty state per section when nothing is recorded', async () => {
    fx.health = [];
    const tree = await mount();
    expect(tree.root.findAllByProps({ testID: 'animalDetail.health.empty.vaccinations' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.health.empty.deworming' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.health.empty.checkups' }).length).toBe(1);
  });

  it('shows an error with Retry, and Retry refetches', async () => {
    fx.health = 'error';
    const tree = await mount();
    const error = tree.root
      .findByProps({ testID: 'animalDetail.health.error' })
      .find((n) => typeof (n.props as { onRetry?: unknown }).onRetry === 'function');
    fx.health = [vaccination('v9', 'BQ vaccine', '2026-05-01', null)];
    await act(async () => {
      (error.props as { onRetry: () => void }).onRetry();
    });
    await settle();
    expect(textWithin(tree, 'animalDetail.health.vaccination:v9')).toContain('BQ vaccine');
  });

  it('VACCINATION add posts the exact body with YYYY-MM-DD dates', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.health.addVaccination');
    await type(tree, 'healthForm.vaccinationDate', '12/07/2026');
    await type(tree, 'healthForm.vaccineName', 'FMD');
    await type(tree, 'healthForm.nextVaccinationDate', '10 Oct 2026');
    await press(tree, 'healthForm.save');
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(apiPost.mock.calls[0]![0]).toBe(`${BASE}/health-records`);
    expect(apiPost.mock.calls[0]![1]).toEqual({
      recordType: 'VACCINATION',
      recordDate: '2026-07-12',
      vaccineName: 'FMD',
      route: 'INJECTION_IM',
      nextDueDate: '2026-10-10',
    });
  });

  it('validation blocks a bad date and sends nothing', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.health.addVaccination');
    await type(tree, 'healthForm.vaccinationDate', '31/02/2026');
    await type(tree, 'healthForm.vaccineName', '');
    await press(tree, 'healthForm.save');
    expect(apiPost).not.toHaveBeenCalled();
    const errors = textWithin(tree, 'healthForm.errors');
    expect(errors).toContain('Record date');
    expect(errors).toContain('Vaccine name');
  });

  it('BR-137: a TREATMENT with milk withdrawal posts the window, then re-fetches the animal and shows the banner', async () => {
    const until = addDaysIso(TODAY, 6);
    fx.animalAfterSave = animal({ withdrawalUntil: until });
    const tree = await mount();
    expect(tree.root.findAllByProps({ testID: 'animalDetail.withdrawalBanner' }).length).toBe(0);
    const before = animalGets;

    await press(tree, 'animalDetail.health.addTreatment');
    await type(tree, 'healthForm.treatmentDate', TODAY);
    await type(tree, 'healthForm.condition', 'Mastitis');
    await type(tree, 'healthForm.description', 'Herbal wash');
    await press(tree, 'healthForm.milkWithdrawalYes');
    await type(tree, 'healthForm.milkWithdrawalStart', TODAY);
    await type(tree, 'healthForm.milkWithdrawalEnd', until);
    await press(tree, 'healthForm.save');

    expect(apiPost.mock.calls[0]![0]).toBe(`${BASE}/health-records`);
    expect(apiPost.mock.calls[0]![1]).toMatchObject({
      recordType: 'TREATMENT',
      recordDate: TODAY,
      condition: 'Mastitis',
      description: 'Herbal wash',
      milkWithdrawal: { startDate: TODAY, endDate: until },
    });
    expect(animalGets).toBeGreaterThan(before);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.withdrawalBanner' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.withdrawalDot' }).length).toBe(1);
  });
});

describe('Breeding tab', () => {
  it('derives the current cycle and calving history from real records', async () => {
    fx.breeding = [
      {
        ...meta('p1'),
        recordType: 'PREGNANCY_CHECK',
        recordDate: '2026-04-01',
        notes: null,
        attachmentUploadId: null,
        checkType: 'CONFIRMATION',
        result: 'POSITIVE',
        examinationMethod: 'ULTRASOUND',
        location: null,
        gestationAge: null,
        expectedDeliveryDate: '2026-11-20',
        nextCheckDate: '2026-05-01',
        findings: null,
      },
      {
        ...meta('i1'),
        recordType: 'INSEMINATION',
        recordDate: '2026-02-12',
        notes: null,
        attachmentUploadId: null,
        inseminationType: 'ARTIFICIAL',
        inseminationTime: null,
        sire: null,
        semenStrawRef: null,
        location: null,
        technician: null,
        heatSigns: null,
      },
      {
        ...meta('c1'),
        recordType: 'CALVING',
        recordDate: '2025-03-14',
        notes: null,
        attachmentUploadId: null,
        outcome: 'LIVE_BIRTH',
        offspringCount: 1,
        deliveryType: null,
        offspringName: null,
        offspringGender: 'FEMALE',
        birthWeight: null,
        findings: null,
      },
    ];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    const cycle = textWithin(tree, 'animalDetail.breeding.currentCycle');
    expect(cycle).toContain('12 Feb');
    expect(cycle).toContain('20 Nov 2026');
    expect(cycle).toContain('Confirmed pregnant');
    expect(cycle).not.toContain('Cycle 3');
    expect(textWithin(tree, 'animalDetail.breeding.calving:c1')).toContain('14 Mar 2025');
  });

  it('BR-138: breeding add is disabled for a male animal, with an explanation', async () => {
    fx.animal = animal({ gender: 'MALE' });
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    const add = tree.root.findByProps({ testID: 'animalDetail.breeding.add' });
    expect((add.props as { disabled?: boolean }).disabled).toBe(true);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.breeding.femaleOnly' }).length).toBe(1);
  });

  it('BR-138: breeding add is enabled for a female animal and posts a HEAT record', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    const add = tree.root.findByProps({ testID: 'animalDetail.breeding.add' });
    expect((add.props as { disabled?: boolean }).disabled).toBeFalsy();
    await press(tree, 'animalDetail.breeding.add');
    await type(tree, 'breedingForm.heatDate', '12/02/2026');
    await press(tree, 'breedingForm.sireTrigger');
    await press(tree, 'breedingForm.sireExternal');
    await press(tree, 'breedingForm.save');
    expect(apiPost.mock.calls[0]![0]).toBe(`${BASE}/breeding-records`);
    expect(apiPost.mock.calls[0]![1]).toMatchObject({
      recordType: 'HEAT',
      recordDate: '2026-02-12',
      breedingMethod: 'ARTIFICIAL_INSEMINATION',
    });
  });
});

describe('Feed tab', () => {
  it('reference card comes from the newest feed plan; the daily log from feed-logs', async () => {
    fx.feedPlans = [
      {
        ...meta('fp1'),
        effectiveFrom: '2026-07-01',
        planName: null,
        feedType: 'CONCENTRATE_MIX',
        source: 'Own farm',
        grazingDuration: { value: 4, unit: 'HOURS_PER_DAY' },
        waterSource: 'WELL',
        startTime: null,
        endTime: null,
        items: [],
        notes: null,
        attachmentUploadId: null,
      },
    ];
    fx.feedLogs = [{ ...meta('fl1'), fedOn: '2026-07-16', feedType: 'GREEN_FODDER', quantity: 18, unit: 'KG', notes: null }];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Feed');
    expect(getPaths()).toContain(`${BASE}/feed-plans?limit=1`);
    const ref = textWithin(tree, 'animalDetail.feed.reference');
    expect(ref).toContain('Concentrate mix');
    expect(ref).toContain('Own farm');
    expect(ref).toContain('Well');
    expect(ref).not.toContain('Upper paddock');
    expect(textWithin(tree, 'animalDetail.feed.log:fl1')).toContain('18 kg');
  });

  it('Add Feed Reference posts a feed plan with mapped enums and items', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Feed');
    await press(tree, 'animalDetail.feed.add');
    await press(tree, 'feedForm.waterSourceTrigger');
    await press(tree, 'feedForm.waterSource:WELL');
    await type(tree, 'feedForm.itemName:0', 'Napier grass');
    await type(tree, 'feedForm.itemAmount:0', '18');
    await press(tree, 'feedForm.save');
    expect(apiPost.mock.calls[0]![0]).toBe(`${BASE}/feed-plans`);
    expect(apiPost.mock.calls[0]![1]).toEqual({
      feedType: 'GREEN_FODDER',
      waterSource: 'WELL',
      items: [{ name: 'Napier grass', amount: 18, unit: 'KG_PER_DAY' }],
    });
  });

  it('feed plan validation (no water source) sends nothing', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Feed');
    await press(tree, 'animalDetail.feed.add');
    await press(tree, 'feedForm.save');
    expect(apiPost).not.toHaveBeenCalled();
    expect(textWithin(tree, 'feedForm.errors')).toContain('Water source');
  });

  it('shows honest empty states', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Feed');
    expect(tree.root.findAllByProps({ testID: 'animalDetail.feed.noPlan' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.feed.noLogs' }).length).toBe(1);
  });
});

describe('Production tab', () => {
  it('BR-139: each log shows its real product + unit and the stored restricted flag', async () => {
    fx.production = [
      prodLog('m1', 'MILK', 6.5, 'LITERS', TODAY, { session: 'MORNING', restrictedFromSale: true }),
      prodLog('w1', 'WOOL', 1.134, 'KG', TODAY),
      prodLog('e1', 'EGGS', 60, 'COUNT', TODAY),
    ];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Production');
    expect(textWithin(tree, 'animalDetail.production.row:m1')).toContain('6.5 L');
    expect(textWithin(tree, 'animalDetail.production.row:w1')).toContain('1.134 kg');
    expect(textWithin(tree, 'animalDetail.production.row:w1')).toContain('Wool');
    expect(textWithin(tree, 'animalDetail.production.row:e1')).toContain('60');
    expect(tree.root.findAllByProps({ testID: 'animalDetail.production.row:m1.restricted' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.production.row:w1.restricted' }).length).toBe(0);
  });

  it('draws the sparkline only from real daily milk totals (hidden with <2 days)', async () => {
    fx.milkWindow = [prodLog('m1', 'MILK', 6, 'LITERS', TODAY)];
    let tree = await mount();
    await press(tree, 'animalDetail.tab.Production');
    expect(tree.root.findAllByProps({ testID: 'animalDetail.production.sparkline' }).length).toBe(0);
    tree.unmount();

    fx.milkWindow = [prodLog('m1', 'MILK', 6, 'LITERS', TODAY), prodLog('m2', 'MILK', 5, 'LITERS', addDaysIso(TODAY, -1))];
    tree = await mount();
    await press(tree, 'animalDetail.tab.Production');
    expect(tree.root.findAllByProps({ testID: 'animalDetail.production.sparkline' }).length).toBe(1);
    expect(textWithin(tree, 'animalDetail.production.todayYield')).toContain('6.0');
  });

  it('MEAT in lbs posts productType MEAT, unit KG, exact quantity (not MILK / L)', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Production');
    await press(tree, 'animalDetail.production.add');
    await press(tree, 'productionForm.typeTrigger');
    await press(tree, 'productionForm.type:MEAT');
    await type(tree, 'productionForm.date', '03/11/2026');
    await type(tree, 'productionForm.meatWeight', '10');
    await press(tree, 'productionForm.meatUnitTrigger');
    await press(tree, 'productionForm.meatUnit:LB');
    await press(tree, 'productionForm.save');
    expect(apiPost.mock.calls[0]![0]).toBe('/farmers/me/livestock/production-logs');
    expect(apiPost.mock.calls[0]![1]).toMatchObject({
      animalId: A,
      productType: 'MEAT',
      quantity: 4.536,
      unit: 'KG',
      loggedOn: '2026-11-03',
      restrictedFromSale: false,
    });
  });
});

describe('Housing tab', () => {
  it('card from the newest housing record; hygiene log from hygiene-logs', async () => {
    fx.housing = [
      {
        ...meta('h1'),
        housingType: 'OPEN_SHED',
        housingName: 'North shed',
        location: null,
        indoorSpacePerAnimal: { value: 14, unit: 'SQ_FT' },
        outdoorSpace: { value: 100, unit: 'SQ_FT' },
        startDate: '2026-06-01',
        notes: null,
        attachmentUploadId: null,
        meetsIndoorSpaceStandard: true,
      },
    ];
    fx.hygiene = [{ ...meta('hy1'), activity: 'Floor scrubbed', performedOn: '2026-07-14', notes: null }];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    const card = textWithin(tree, 'animalDetail.housing.card');
    expect(card).toContain('North shed');
    expect(card).toContain('14');
    expect(textWithin(tree, 'animalDetail.housing.hygiene:hy1')).toContain('Floor scrubbed');
    expect(textOf(tree)).not.toContain('Bedding replaced');
  });

  it('Add housing posts a housing record with exact spaces and date', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    await press(tree, 'animalDetail.housing.add');
    await type(tree, 'housingForm.name', 'North shed');
    await type(tree, 'housingForm.indoorSpace', '12.5');
    await type(tree, 'housingForm.outdoorSpace', '150');
    await type(tree, 'housingForm.startDate', '01/06/2026');
    await press(tree, 'housingForm.save');
    expect(apiPost.mock.calls[0]![0]).toBe(`${BASE}/housing-records`);
    expect(apiPost.mock.calls[0]![1]).toEqual({
      housingType: 'BARN',
      housingName: 'North shed',
      indoorSpacePerAnimal: { value: 12.5, unit: 'SQ_FT' },
      outdoorSpace: { value: 150, unit: 'SQ_FT' },
      startDate: '2026-06-01',
    });
  });

  it('shows empty states when nothing is recorded', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    expect(tree.root.findAllByProps({ testID: 'animalDetail.housing.noRecord' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.housing.noHygiene' }).length).toBe(1);
  });
});

function housingRecord(id: string, indoor: number, meets: boolean): unknown {
  return {
    ...meta(id),
    housingType: 'BARN',
    housingName: 'Main barn',
    location: null,
    indoorSpacePerAnimal: { value: indoor, unit: 'SQ_FT' },
    outdoorSpace: { value: 50, unit: 'SQ_FT' },
    startDate: '2026-06-01',
    notes: null,
    attachmentUploadId: null,
    meetsIndoorSpaceStandard: meets,
  };
}

function calving(id: string, recordDate: string, calvingTime: string | null = null): unknown {
  return {
    ...meta(id),
    recordType: 'CALVING',
    recordDate,
    notes: null,
    attachmentUploadId: null,
    outcome: 'LIVE_BIRTH',
    offspringCount: 1,
    deliveryType: null,
    offspringName: null,
    offspringGender: 'FEMALE',
    birthWeight: null,
    findings: null,
    calvingTime,
  };
}

const heat = (id: string, recordDate: string): unknown => ({
  ...meta(id),
  recordType: 'HEAT',
  recordDate,
  notes: null,
  attachmentUploadId: null,
  breedingMethod: 'NATURAL_SERVICE',
  sire: 'B-07',
  semenStrawRef: null,
  technician: null,
  heatSigns: null,
});

function countGets(prefix: string): number {
  return getPaths().filter((p) => p.startsWith(prefix)).length;
}

describe('Housing tab — BR-140 indoor space standard from the server', () => {
  it('BR-140: the standard box shows the server threshold, never a constant', async () => {
    fx.housing = [housingRecord('h1', 14, true)];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    const box = textWithin(tree, 'animalDetail.housing.standard');
    expect(box).toContain(t('farmer.livestock.detail.housing.standardValue', { value: '12.5' }));
    expect(box).toContain(t('farmer.livestock.detail.spaceUnit.SQ_FT'));
    expect(box).toContain(t('farmer.livestock.detail.housing.standardLabel'));
    expect(box).not.toContain('11');
    expect(box).not.toContain('NPOP');
  });

  it('BR-140: a record that meets the standard shows the success banner', async () => {
    fx.housing = [housingRecord('h1', 14, true)];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    expect(tree.root.findAllByProps({ testID: 'animalDetail.housing.verdict.meets' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.housing.verdict.below' }).length).toBe(0);
    expect(textWithin(tree, 'animalDetail.housing.verdict.meets')).toContain(
      t('farmer.livestock.detail.housing.verdict.meetsTitle'),
    );
    // One value for every species (BR-140): the banner must not claim a species.
    expect(textOf(tree)).not.toContain('for cattle');
  });

  it('BR-140: a record below the standard shows the warning banner (the server verdict, not a client comparison)', async () => {
    // 14 sq.ft would "meet" 12.5 if the client compared; the server says it does not, and the server wins.
    fx.housing = [housingRecord('h1', 14, false)];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    expect(tree.root.findAllByProps({ testID: 'animalDetail.housing.verdict.below' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.housing.verdict.meets' }).length).toBe(0);
    const banner = textWithin(tree, 'animalDetail.housing.verdict.below');
    expect(banner).toContain(t('farmer.livestock.detail.housing.verdict.belowTitle'));
    expect(banner).toContain('12.5');
  });

  it('BR-140: no housing record shows the neutral "not recorded" text with the server threshold', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    expect(tree.root.findAllByProps({ testID: 'animalDetail.housing.verdict.notRecorded' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.housing.verdict.meets' }).length).toBe(0);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.housing.verdict.below' }).length).toBe(0);
    const text = textWithin(tree, 'animalDetail.housing.verdict.notRecorded');
    expect(text).toContain(t('farmer.livestock.detail.housing.verdict.notRecordedTitle'));
    expect(text).toContain('12.5');
  });

  it('BR-140c: a 503 (standard missing in system_config) is the housing error state — no fallback number, no verdict', async () => {
    fx.spaceStandard = '503';
    fx.housing = [housingRecord('h1', 14, true)];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    expect(tree.root.findAllByProps({ testID: 'animalDetail.housing.record.error' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.housing.standard' }).length).toBe(0);
    for (const v of ['meets', 'below', 'notRecorded']) {
      expect(tree.root.findAllByProps({ testID: `animalDetail.housing.verdict.${v}` }).length).toBe(0);
    }
    expect(textOf(tree)).not.toContain('≥');
  });

  it('BR-140c: a response without spaceStandard is treated as an error, not given a default', async () => {
    fx.spaceStandard = 'missing';
    fx.housing = [housingRecord('h1', 14, true)];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    expect(tree.root.findAllByProps({ testID: 'animalDetail.housing.record.error' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'animalDetail.housing.standard' }).length).toBe(0);
  });
});

describe('Feed tab — daily feed log add', () => {
  it("the daily log's + Add opens the feed-log modal, never the feed-plan modal", async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Feed');
    await press(tree, 'animalDetail.feed.addLog');
    expect(tree.root.findAllByProps({ testID: 'feedLogForm.save' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'feedForm.save' }).length).toBe(0);
  });

  it('posts the exact feed-log body and refetches the list', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Feed');
    const before = countGets(`${BASE}/feed-logs`);
    await press(tree, 'animalDetail.feed.addLog');
    await type(tree, 'feedLogForm.date', '16/07/2026');
    await press(tree, 'feedLogForm.feedTypeTrigger');
    await press(tree, 'feedLogForm.feedType:DRY_FODDER');
    await type(tree, 'feedLogForm.quantity', '2.5');
    await press(tree, 'feedLogForm.unitTrigger');
    await press(tree, 'feedLogForm.unit:BUNDLES');
    fx.feedLogs = [{ ...meta('fl9'), fedOn: '2026-07-16', feedType: 'DRY_FODDER', quantity: 2.5, unit: 'BUNDLES', notes: null }];
    await press(tree, 'feedLogForm.save');
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(apiPost.mock.calls[0]![0]).toBe(`${BASE}/feed-logs`);
    expect(apiPost.mock.calls[0]![1]).toEqual({ fedOn: '2026-07-16', feedType: 'DRY_FODDER', quantity: 2.5, unit: 'BUNDLES' });
    expect(countGets(`${BASE}/feed-logs`)).toBeGreaterThan(before);
    expect(textWithin(tree, 'animalDetail.feed.log:fl9')).toContain('2.5');
    expect(tree.root.findAllByProps({ testID: 'feedLogForm.save' }).length).toBe(0);
  });

  it('an invalid quantity shows the translated error and sends nothing', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Feed');
    await press(tree, 'animalDetail.feed.addLog');
    await type(tree, 'feedLogForm.date', '16/07/2026');
    await type(tree, 'feedLogForm.quantity', '0');
    await press(tree, 'feedLogForm.save');
    expect(apiPost).not.toHaveBeenCalled();
    expect(textWithin(tree, 'feedLogForm.errors')).toContain(fieldErrorMessage({ field: 'quantity', problem: 'notPositive' }));
  });
});

describe('Housing tab — hygiene log add', () => {
  it('posts the exact hygiene-log body and refetches the list', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    const before = countGets(`${BASE}/hygiene-logs`);
    await press(tree, 'animalDetail.housing.addHygiene');
    await type(tree, 'hygieneForm.activity', 'Bedding changed');
    await type(tree, 'hygieneForm.date', '14/07/2026');
    fx.hygiene = [{ ...meta('hy9'), activity: 'Bedding changed', performedOn: '2026-07-14', notes: null }];
    await press(tree, 'hygieneForm.save');
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(apiPost.mock.calls[0]![0]).toBe(`${BASE}/hygiene-logs`);
    expect(apiPost.mock.calls[0]![1]).toEqual({ activity: 'Bedding changed', performedOn: '2026-07-14' });
    expect(countGets(`${BASE}/hygiene-logs`)).toBeGreaterThan(before);
    expect(textWithin(tree, 'animalDetail.housing.hygiene:hy9')).toContain('Bedding changed');
  });

  it('a blank activity shows the translated error and sends nothing', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    await press(tree, 'animalDetail.housing.addHygiene');
    await type(tree, 'hygieneForm.activity', '   ');
    await type(tree, 'hygieneForm.date', '14/07/2026');
    await press(tree, 'hygieneForm.save');
    expect(apiPost).not.toHaveBeenCalled();
    expect(textWithin(tree, 'hygieneForm.errors')).toContain(fieldErrorMessage({ field: 'activity', problem: 'required' }));
  });
});

describe('Breeding tab — cycle counter and calving time', () => {
  it('cycle number = 1 + CALVING records: none recorded is cycle 1', async () => {
    fx.breeding = [heat('ht1', '2026-02-12')];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    expect(textWithin(tree, 'animalDetail.breeding.cycleNumber')).toBe(t('farmer.livestock.detail.breeding.cycleNumber', { n: 1 }));
  });

  it('cycle number = 1 + CALVING records: two calvings is cycle 3', async () => {
    fx.breeding = [heat('ht1', '2026-02-12'), calving('c2', '2025-03-14'), calving('c1', '2024-02-01')];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    expect(textWithin(tree, 'animalDetail.breeding.cycleNumber')).toBe(t('farmer.livestock.detail.breeding.cycleNumber', { n: 3 }));
  });

  it('no counter while older breeding pages are unloaded (a calving could be on them)', async () => {
    fx.breeding = [heat('ht1', '2026-02-12'), calving('c2', '2025-03-14')];
    fx.breedingHasMore = true;
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    expect(tree.root.findAllByProps({ testID: 'animalDetail.breeding.cycleNumber' }).length).toBe(0);
  });

  it('calving history shows calvingTime only when it is recorded', async () => {
    fx.breeding = [calving('c2', '2025-03-14', '05:40'), calving('c1', '2024-02-01', null)];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    expect(textWithin(tree, 'animalDetail.breeding.calving:c2')).toContain('05:40');
    expect(textWithin(tree, 'animalDetail.breeding.calving:c1')).toContain('1 Feb 2024');
    expect(textWithin(tree, 'animalDetail.breeding.calving:c1')).not.toMatch(/\d{2}:\d{2}/);
  });

  it('the calving modal sends calvingTime (HH:MM 24h)', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    await press(tree, 'animalDetail.breeding.addCalving');
    await type(tree, 'breedingForm.calvingDate', '14/03/2026');
    await type(tree, 'breedingForm.calvingTime', '5:40');
    await press(tree, 'breedingForm.save');
    expect(apiPost.mock.calls[0]![0]).toBe(`${BASE}/breeding-records`);
    expect(apiPost.mock.calls[0]![1]).toMatchObject({ recordType: 'CALVING', recordDate: '2026-03-14', calvingTime: '05:40' });
  });

  it('an invalid calving time is rejected with the translated error and nothing is sent', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    await press(tree, 'animalDetail.breeding.addCalving');
    await type(tree, 'breedingForm.calvingDate', '14/03/2026');
    await type(tree, 'breedingForm.calvingTime', '25:00');
    await press(tree, 'breedingForm.save');
    expect(apiPost).not.toHaveBeenCalled();
    expect(textWithin(tree, 'breedingForm.errors')).toContain(fieldErrorMessage({ field: 'calvingTime', problem: 'invalidTime' }));
  });
});

describe('source hygiene', () => {
  const screenSource = fs.readFileSync(
    path.resolve(__dirname, '../screens/farm/livestock/AnimalDetailScreen.tsx'),
    'utf8',
  );
  const appSource = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf8');

  it('no mock seed data or fake attachments remain', () => {
    for (const mock of [
      'vaccine_receipt.jpg',
      "'Dr. Anand'",
      'Bull #01',
      'Upper paddock',
      'Bedding replaced',
      'Barn washed',
      'Cycle 3',
      '20 Nov 2026',
      'Organic fodder + concentrate',
      "'Lakshmi'",
      "'C-014'",
      "'12/06/26'",
    ]) {
      expect(screenSource, mock).not.toContain(mock);
    }
    expect(appSource).not.toMatch(/'a1'|'Lakshmi'|'C-014'/);
  });

  it('label typos are fixed', () => {
    for (const typo of ['Live brith', 'Stillbrith', 'Examination metod', 'Milking seccion', 'Prousing']) {
      expect(screenSource, typo).not.toContain(typo);
    }
  });

  it('i18n: every literal t() key in the screen and every form/view key exists in en and ta', () => {
    const en: Record<string, string> = { ...errorsEn, ...farmerEn };
    const ta: Record<string, string> = { ...errorsTa, ...farmerTa };
    const literal = [...screenSource.matchAll(/\bt\(\s*(['"])([A-Za-z0-9_.-]+)\1/g)].map((m) => m[2]!);
    const keys = new Set([...literal, ...FORM_I18N_KEYS, ...VIEW_I18N_KEYS]);
    expect(keys.size).toBeGreaterThan(50);
    for (const key of keys) {
      expect(en[key], `en ${key}`).toBeTruthy();
      expect(ta[key], `ta ${key}`).toBeTruthy();
    }
    const detailKeys = Object.keys(farmerEn).filter((k) => k.startsWith('farmer.livestock.detail.'));
    for (const key of detailKeys) expect((farmerTa as Record<string, string>)[key], `ta ${key}`).toBeTruthy();
  });
});
