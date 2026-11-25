/**
 * The pure rules behind the Super Admin price writes and the market day
 * schedule: the POST bodies, the percentage arithmetic (integer paise only),
 * and the venue list the schedule screen reads.
 *
 * Plus a source guard: the four dashboard screens must not carry the fixtures
 * or the dead save stubs back in. That guard is the one that fails loudest if
 * a later edit re-introduces MOCK_DAYS or a "// Save logic here" handler.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseMoney, toPaise } from '@tohfa/shared-types';
import {
  applyPercentToCeiling,
  applyPercentToPaise,
  buildBulkFairPriceItems,
  buildFairPriceBody,
  toBulkDraftRows,
} from '../api/pricingMappers';
import { toMarketDayVenues } from '../api/marketDay';
import type { FairPriceRowView } from '../api/pricingTypes';
import type { WarehouseDto } from '../api/warehouses';

const CROP = '11112222-3333-4444-5555-666677778888';

function row(over: Partial<FairPriceRowView> = {}): FairPriceRowView {
  return {
    id: 'fp-1',
    cropId: CROP,
    cropName: 'Carrot',
    grade: 'GRADE_1',
    ceilingPrice: parseMoney('48.00'),
    frequency: 'WEEKLY',
    effectiveFrom: '2026-11-01',
    effectiveTo: null,
    windowStatus: 'current',
    setById: null,
    notes: null,
    category: null,
    setByName: null,
    lastUpdatedAt: null,
    recentChanges: null,
    hasRetailPrice: null,
    ...over,
  };
}

describe('BR-08: the POST /fair-prices body', () => {
  it('BR-08: sends the typed amount as Money, with the grade, date and frequency', () => {
    expect(
      buildFairPriceBody({ cropId: CROP, grade: 'GRADE_1', ceilingInput: '52.5', effectiveFrom: '2026-11-17', frequency: 'DAILY' }),
    ).toEqual({ cropId: CROP, grade: 'GRADE_1', ceilingPrice: '52.50', effectiveFrom: '2026-11-17', frequency: 'DAILY' });
  });

  it('BR-08: refuses an amount the server would reject rather than guessing one', () => {
    for (const bad of ['', '0', '-5', '52.555', 'fifty']) {
      expect(buildFairPriceBody({ cropId: CROP, grade: 'GRADE_1', ceilingInput: bad, effectiveFrom: '2026-11-17' })).toBeNull();
    }
  });

  it('leaves out notes and frequency when they are not set, so the server defaults apply', () => {
    const body = buildFairPriceBody({ cropId: CROP, grade: 'GRADE_2', ceilingInput: '40', effectiveFrom: '2026-11-17', notes: '  ' });
    expect(body).toEqual({ cropId: CROP, grade: 'GRADE_2', ceilingPrice: '40.00', effectiveFrom: '2026-11-17' });
  });
});

describe('BR-08: the bulk percentage is applied in integer paise, never on a float', () => {
  it('BR-08: +5% of ₹48.00 is ₹50.40, computed on paise', () => {
    expect(applyPercentToPaise(4800, 5)).toBe(5040);
    expect(applyPercentToCeiling(parseMoney('48.00'), 5)).toBe('50.40');
  });

  it('BR-08: rounds to the paisa instead of carrying a float remainder', () => {
    // 0.1 + 0.2 territory: 3333 paise + 5% is 3499.65, which must land on a whole paisa.
    expect(applyPercentToPaise(3333, 5)).toBe(3500);
    expect(toPaise(applyPercentToCeiling(parseMoney('33.33'), 5) ?? parseMoney('0'))).toBe(3500);
  });

  it('never invents a ceiling for a row whose own ceiling could not be read', () => {
    expect(applyPercentToCeiling(null, 5)).toBeNull();
  });

  it('BR-08: builds one item per selected row, each at its own new ceiling', () => {
    const drafts = toBulkDraftRows([row(), row({ id: 'fp-2', cropName: 'Cabbage', ceilingPrice: parseMoney('28.00') })], ['fp-1', 'fp-2'], 5);
    expect(buildBulkFairPriceItems(drafts, '2026-11-17')).toEqual([
      { cropId: CROP, grade: 'GRADE_1', ceilingPrice: '50.40', effectiveFrom: '2026-11-17', frequency: 'WEEKLY' },
      { cropId: CROP, grade: 'GRADE_1', ceilingPrice: '29.40', effectiveFrom: '2026-11-17', frequency: 'WEEKLY' },
    ]);
  });

  it('sends nothing when nothing is selected, or when a selected row has no readable ceiling', () => {
    expect(buildBulkFairPriceItems(toBulkDraftRows([row()], [], 5), '2026-11-17')).toBeNull();
    const unreadable = toBulkDraftRows([row({ ceilingPrice: null })], ['fp-1'], 5);
    expect(buildBulkFairPriceItems(unreadable, '2026-11-17')).toBeNull();
  });
});

function warehouse(over: Partial<WarehouseDto> = {}): WarehouseDto {
  return { id: 'w1', code: 'WH-OOTY', name: 'Ooty Warehouse', type: 'SUB', isActive: true, createdAt: '2026-01-01T00:00:00Z', ...over };
}

describe('the market day schedule reads the live warehouse network', () => {
  it('keeps only the market day venues, weekday first', () => {
    const venues = toMarketDayVenues([
      warehouse({ id: 'w1', name: 'Ooty Warehouse', isMarketDayVenue: true, marketDayOfWeek: 6 }),
      warehouse({ id: 'w2', name: 'Coonoor Warehouse', isMarketDayVenue: true, marketDayOfWeek: 2 }),
      warehouse({ id: 'w3', name: 'Main Warehouse', isMarketDayVenue: false, marketDayOfWeek: null }),
    ]);
    expect(venues.map((v) => v.warehouseId)).toEqual(['w2', 'w1']);
  });

  it('shows no value for what the API does not carry, rather than a demo date or time', () => {
    const [venue] = toMarketDayVenues([warehouse({ isMarketDayVenue: true, marketDayOfWeek: null })]);
    expect(venue).toMatchObject({ dayOfWeek: null, calendarDate: null, timeRange: null });
  });
});

const DASH = path.resolve(__dirname, '../screens/dashboard');
const SCREENS = ['UpdateFairPriceScreen.tsx', 'BulkPriceUpdateScreen.tsx', 'AddMarketDayScreen.tsx', 'MarketDayScheduleScreen.tsx'];
const read = (f: string) => fs.readFileSync(path.join(DASH, f), 'utf8');
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

describe('source guard: the fixtures and the dead save stubs stay gone', () => {
  it('MOCK_DAYS is not exported or imported anywhere', () => {
    const app = fs.readFileSync(path.resolve(__dirname, '../../farmer/App.tsx'), 'utf8');
    expect(stripComments(app)).not.toMatch(/MOCK_DAYS/);
    for (const f of SCREENS) expect(stripComments(read(f)), f).not.toMatch(/MOCK_DAYS/);
  });

  it('no "Save logic here" style stub survives on these screens or their host', () => {
    const app = fs.readFileSync(path.resolve(__dirname, '../../farmer/App.tsx'), 'utf8');
    expect(app).not.toMatch(/\/\/\s*Save (market day )?logic here/);
    expect(app).not.toMatch(/\/\/\s*Handle (toggle|days change)/);
  });

  it('no hardcoded demo crops or warehouse names remain', () => {
    for (const f of SCREENS) {
      expect(stripComments(read(f)), f).not.toMatch(/'Ooty Warehouse'|'Coonoor Warehouse'|'Kotagiri Warehouse'|'Gudalur Market'/);
    }
    for (const f of ['UpdateFairPriceScreen.tsx', 'BulkPriceUpdateScreen.tsx']) {
      expect(stripComments(read(f)), f).not.toMatch(/currentPrice:\s*\d|itemName\s*=\s*'/);
    }
  });

  it('no role strings: every gate goes through a permission code', () => {
    for (const f of SCREENS) {
      expect(stripComments(read(f)), f).not.toMatch(/\b(SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN)\b/);
    }
  });
});
