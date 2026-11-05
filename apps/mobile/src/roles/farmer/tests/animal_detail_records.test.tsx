/**
 * AnimalDetailScreen used to render hard-coded rows (FMD vaccine given
 * "10 Apr", a "Dr. Anand" checkup, "Cycle 3 · Confirmed pregnant",
 * "Upper paddock · 5 h/day", "Bedding replaced 16 Jul" ...). These tests pin the
 * Health, Feed, Breeding and Housing tabs to the real per-animal endpoints
 * (BR-137..BR-141) while the design stays Dev's:
 *   GET /farmers/me/livestock/animals/:id
 *   GET /farmers/me/livestock/animals/:id/{health,breeding}-records
 *   GET /farmers/me/livestock/animals/:id/{feed-plans,feed-logs,housing-records,hygiene-logs}
 * The Production tab is Dev's own wiring and is not changed here.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: {
    create: (s: Record<string, unknown>) => s,
    flatten: (s: unknown) => s,
    absoluteFill: {},
  },
  Text: 'Text',
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
  ScreenStatusBar: 'ScreenStatusBar',
}));

const apiGet = vi.hoisted(() => vi.fn());
vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, api: { get: apiGet } };
});

import { AnimalDetailScreen } from '../screens/farm/livestock/AnimalDetailScreen';
import { addDaysIso, todayInKolkata } from '../screens/certifications/certificationForm';
import { setLocale, t } from '../../../i18n/farmer';

const A = 'a0000000-0000-4000-8000-000000000001';
const BASE = `/farmers/me/livestock/animals/${A}`;

interface Fixture {
  animal: Record<string, unknown>;
  health: unknown[] | 'error';
  breeding: unknown[];
  breedingHasMore: boolean;
  feedPlans: unknown[];
  feedLogs: unknown[];
  housing: unknown[];
  /** BR-141: the server's spaceStandard; 'unconfigured' = the server sends null (no system_config value yet) and a null verdict per item. */
  spaceStandard: number | 'unconfigured';
  hygiene: unknown[];
}

let fx: Fixture;

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

const page = (items: unknown[]) => ({ items, page: { nextCursor: null, hasMore: false } });

function defaultFixture(): Fixture {
  return {
    animal: animal(),
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
  };
}

function route(p: string): Promise<unknown> {
  if (p === BASE) return Promise.resolve(fx.animal);
  if (p.startsWith(`${BASE}/health-records`)) {
    return fx.health === 'error' ? Promise.reject(new Error('offline')) : Promise.resolve(page(fx.health));
  }
  if (p.startsWith(`${BASE}/breeding-records`)) {
    return Promise.resolve({ items: fx.breeding, page: { nextCursor: fx.breedingHasMore ? 'c2' : null, hasMore: fx.breedingHasMore } });
  }
  if (p.startsWith(`${BASE}/feed-plans`)) return Promise.resolve(page(fx.feedPlans));
  if (p.startsWith(`${BASE}/feed-logs`)) return Promise.resolve(page(fx.feedLogs));
  if (p.startsWith(`${BASE}/housing-records`)) {
    if (fx.spaceStandard === 'unconfigured') {
      const items = (fx.housing as Array<Record<string, unknown>>).map((h) => ({ ...h, meetsIndoorSpaceStandard: null }));
      return Promise.resolve({ ...page(items), spaceStandard: null });
    }
    return Promise.resolve({ ...page(fx.housing), spaceStandard: { minIndoorSqFtPerAnimal: fx.spaceStandard } });
  }
  if (p.startsWith(`${BASE}/hygiene-logs`)) return Promise.resolve(page(fx.hygiene));
  if (p.startsWith('/farmers/me/livestock/production-logs')) return Promise.resolve(page([]));
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

function getPaths(): string[] {
  return apiGet.mock.calls.map((c) => c[0] as string);
}

beforeEach(() => {
  apiGet.mockReset();
  fx = defaultFixture();
  apiGet.mockImplementation((p: string) => route(p));
});

describe('animal + loading / error states', () => {
  it('requests the real animal, then shows it', async () => {
    const tree = await mount();
    expect(getPaths()).toContain(BASE);
    expect(textOf(tree)).toContain('Kaveri');
    expect(textOf(tree)).toContain('C-201');
  });

  it('an unknown animal is an error state with Retry, never a fabricated animal', async () => {
    apiGet.mockImplementation((p: string) => (p === BASE ? Promise.reject(new Error('404')) : route(p)));
    const tree = await mount();
    expect(tree.root.findAll((n) => (n.type as unknown) === 'ErrorState').length).toBe(1);
    expect(textOf(tree)).not.toContain('Lakshmi');
    expect(getPaths().filter((p) => p.includes('/health-records'))).toEqual([]);
  });

  it('a missing animalId renders the missing-animal error state and makes no request', async () => {
    const onBack = vi.fn();
    const tree = await mount({ onBack });
    expect(has(tree, 'animalDetail.missingAnimal')).toBe(true);
    expect(textOf(tree)).toContain(t('farmer.livestock.detail.missingAnimal'));
    expect(textOf(tree)).not.toContain('Lakshmi');
    expect(textOf(tree)).not.toContain('C-014');
    expect(getPaths()).toEqual([]);
    await press(tree, 'animalDetail.missingAnimalBack');
    expect(onBack).toHaveBeenCalled();
  });

  it('a blank animalId is treated as missing', async () => {
    const tree = await mount({ animalId: '   ' });
    expect(has(tree, 'animalDetail.missingAnimal')).toBe(true);
    expect(getPaths()).toEqual([]);
  });
});

describe('Health tab', () => {
  it('maps vaccinations, deworming and treatments from ONE health-records list', async () => {
    const tree = await mount();
    expect(getPaths().filter((p) => p.includes('/health-records'))).toEqual([`${BASE}/health-records?limit=20`]);
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
    expect(has(tree, 'animalDetail.health.empty.vaccinations')).toBe(true);
    expect(has(tree, 'animalDetail.health.empty.deworming')).toBe(true);
    expect(has(tree, 'animalDetail.health.empty.checkups')).toBe(true);
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

  it('BR-138: the withdrawal banner is driven by the animal withdrawalUntil, with the days left', async () => {
    fx.animal = animal({ withdrawalUntil: addDaysIso(todayInKolkata(), 6) });
    const tree = await mount();
    const banner = textWithin(tree, 'animalDetail.withdrawalBanner');
    expect(banner).toContain(t('farmer.livestock.detail.health.withdrawalTitle'));
    expect(banner).toContain('6');
  });

  it('BR-138: no withdrawal banner when the animal has no active withdrawal', async () => {
    const tree = await mount();
    expect(has(tree, 'animalDetail.withdrawalBanner')).toBe(false);
  });

  describe('BR-138: "today" is the Asia/Kolkata date, as on the server, not the device date', () => {
    // 20:00 UTC on 12 Jul is 01:30 on 13 Jul in IST but still 12 Jul in Los Angeles.
    const NOW = new Date('2026-07-12T20:00:00.000Z');
    let savedTz: string | undefined;
    beforeEach(() => {
      savedTz = process.env.TZ;
      process.env.TZ = 'America/Los_Angeles';
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);
    });
    afterEach(() => {
      vi.useRealTimers();
      if (savedTz === undefined) delete process.env.TZ;
      else process.env.TZ = savedTz;
    });

    it('BR-138: a withdrawal that ended yesterday in IST shows no banner, even where the device date is still that day', async () => {
      fx.animal = animal({ withdrawalUntil: '2026-07-12' });
      const tree = await mount();
      expect(has(tree, 'animalDetail.withdrawalBanner')).toBe(false);
    });

    it('BR-138: the days left are counted from the IST date', async () => {
      fx.animal = animal({ withdrawalUntil: '2026-07-14' });
      const tree = await mount();
      const banner = textWithin(tree, 'animalDetail.withdrawalBanner');
      expect(banner).toContain(t('farmer.livestock.detail.health.withdrawalBody', { date: '14 Jul', count: 1 }));
    });
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
      calving('c1', '2025-03-14'),
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

  it('shows honest empty states', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    expect(has(tree, 'animalDetail.breeding.noCycle')).toBe(true);
    expect(has(tree, 'animalDetail.breeding.noCalving')).toBe(true);
  });

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
    expect(has(tree, 'animalDetail.breeding.cycleNumber')).toBe(false);
  });

  it('calving history shows calvingTime only when it is recorded', async () => {
    fx.breeding = [calving('c2', '2025-03-14', '05:40'), calving('c1', '2024-02-01', null)];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Breeding');
    expect(textWithin(tree, 'animalDetail.breeding.calving:c2')).toContain('05:40');
    expect(textWithin(tree, 'animalDetail.breeding.calving:c1')).toContain('1 Feb 2024');
    expect(textWithin(tree, 'animalDetail.breeding.calving:c1')).not.toMatch(/\d{2}:\d{2}/);
  });

  it('Register offspring hands the calving date and the calf sex to the register form', async () => {
    fx.breeding = [calving('c1', '2025-03-14')];
    const onNavigateToEdit = vi.fn();
    const tree = await mount({ animalId: A, onNavigateToEdit });
    await press(tree, 'animalDetail.tab.Breeding');
    await press(tree, 'animalDetail.breeding.registerOffspring:c1');
    expect(onNavigateToEdit).toHaveBeenCalledTimes(1);
    expect(onNavigateToEdit.mock.calls[0]![0]).toMatchObject({ dob: '14 Mar 2025', gender: 'Female', source: 'born_on_farm' });
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
    expect(ref).toContain('4 h/day');
    expect(ref).toContain('Well');
    expect(ref).not.toContain('Upper paddock');
    expect(textWithin(tree, 'animalDetail.feed.log:fl1')).toContain('18 kg');
  });

  it("keeps Dev's water-source caption (Field Context, Screen 18)", async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Feed');
    expect(textWithin(tree, 'animalDetail.feed.waterSourceCaption')).toBe(
      'Water source read from Field Context (Screen 18) — not re-entered here.',
    );
  });

  it('shows honest empty states', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Feed');
    expect(has(tree, 'animalDetail.feed.noPlan')).toBe(true);
    expect(has(tree, 'animalDetail.feed.noLogs')).toBe(true);
  });
});

describe('Housing tab', () => {
  it('card from the newest housing record; hygiene log from hygiene-logs', async () => {
    fx.housing = [housingRecord('h1', 14, true)];
    fx.hygiene = [{ ...meta('hy1'), activity: 'Floor scrubbed', performedOn: '2026-07-14', notes: null }];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    expect(getPaths()).toContain(`${BASE}/housing-records?limit=1`);
    const card = textWithin(tree, 'animalDetail.housing.card');
    expect(card).toContain('Main barn');
    expect(card).toContain('14');
    expect(textWithin(tree, 'animalDetail.housing.hygiene:hy1')).toContain('Floor scrubbed');
    expect(textOf(tree)).not.toContain('Bedding replaced');
  });

  it('shows empty states when nothing is recorded', async () => {
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    expect(has(tree, 'animalDetail.housing.noRecord')).toBe(true);
    expect(has(tree, 'animalDetail.housing.noHygiene')).toBe(true);
  });

  it('BR-141: the standard box shows the server threshold, never a constant', async () => {
    fx.housing = [housingRecord('h1', 14, true)];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    const box = textWithin(tree, 'animalDetail.housing.standard');
    expect(box).toContain(t('farmer.livestock.detail.housing.standardValue', { value: '12.5' }));
    expect(box).toContain(t('farmer.livestock.detail.spaceUnit.SQ_FT'));
    expect(box).toContain(t('farmer.livestock.detail.housing.standardLabel'));
    expect(box).not.toContain('11');
  });

  it('BR-141: a record that meets the standard shows the welfare banner (the server verdict)', async () => {
    fx.housing = [housingRecord('h1', 14, true)];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    expect(textWithin(tree, 'animalDetail.housing.verdict.meets')).toContain(t('farmer.livestock.detail.housing.welfareTitle'));
  });

  it('BR-141: the welfare banner names the species in the farmer locale (Tamil), not the English label', async () => {
    fx.animal = animal({ species: 'BUFFALO' });
    fx.housing = [housingRecord('h1', 14, true)];
    setLocale('ta');
    try {
      const tree = await mount();
      await press(tree, 'animalDetail.tab.Housing');
      const banner = textWithin(tree, 'animalDetail.housing.verdict.meets');
      expect(banner).toContain(
        t('farmer.livestock.detail.housing.welfareSubtitle', {
          species: t('farmer.livestock.detail.housing.welfareSpecies.BUFFALO'),
        }),
      );
      expect(banner).not.toContain('buffalo');
    } finally {
      setLocale('en');
    }
  });

  it('BR-141: a record below the standard shows no welfare banner (no client comparison, no invented warning)', async () => {
    fx.housing = [housingRecord('h1', 9, false)];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    expect(has(tree, 'animalDetail.housing.verdict.meets')).toBe(false);
    expect(has(tree, 'animalDetail.housing.card')).toBe(true);
  });

  it('BR-141c: with no standard configured the records still show, with no standard box, no verdict banner and no invented number', async () => {
    fx.spaceStandard = 'unconfigured';
    fx.housing = [housingRecord('h1', 14, true)];
    const tree = await mount();
    await press(tree, 'animalDetail.tab.Housing');
    expect(has(tree, 'animalDetail.housing.error')).toBe(false);
    expect(textWithin(tree, 'animalDetail.housing.card')).toContain('Main barn');
    expect(has(tree, 'animalDetail.housing.standard')).toBe(false);
    expect(has(tree, 'animalDetail.housing.verdict.meets')).toBe(false);
    expect(textOf(tree)).not.toContain('≥');
  });
});

describe('source hygiene', () => {
  const dir = path.resolve(__dirname, '../screens/farm/livestock');
  const sectionFiles = [
    'AnimalHealthSection.tsx',
    'AnimalFeedSection.tsx',
    'AnimalBreedingSection.tsx',
    'AnimalHousingSection.tsx',
    'animalDetailSectionParts.tsx',
    'animalRecordView.ts',
    'useAnimalRecords.ts',
  ];
  const read = (f: string): string => fs.readFileSync(path.join(dir, f), 'utf8');

  it('no fake animal stand-in (a1 / Lakshmi / C-014) in the detail screen or the farmer navigator wiring', () => {
    const appSrc = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf8');
    for (const src of [read('AnimalDetailScreen.tsx'), appSrc]) {
      expect(src).not.toContain("'Lakshmi'");
      expect(src).not.toContain("'C-014'");
      expect(src).not.toContain("'a1'");
    }
  });

  it('no mock seed data remains in the sections', () => {
    for (const mock of ["'Dr. Anand'", 'Upper paddock', 'Bedding replaced', 'Barn washed', 'Organic fodder + concentrate', '20 Nov 2026']) {
      for (const f of sectionFiles) expect(read(f), `${f}: ${mock}`).not.toContain(mock);
    }
  });

  it('no StyleSheet.absoluteFillObject (removed in RN 0.88) and no bare StatusBar in the livestock screens', () => {
    for (const f of ['AnimalDetailScreen.tsx', 'SaleTransferCullScreen.tsx', ...sectionFiles]) {
      const src = read(f);
      expect(src, f).not.toContain('absoluteFillObject');
      expect(src, f).not.toMatch(/<StatusBar[\s>]/);
    }
  });
});
