import { describe, expect, it } from 'vitest';
import type { Executor } from '../../db/pool.js';
import type { PickupPointRow, PickupPointsRepo } from './pickup-points.repo.js';
import { listPickupPointsQuery, pickupPointsResponse } from './pickup-points.schema.js';
import { createPickupPointsService, isOpenNow, parseHours } from './pickup-points.service.js';

const open = { closed: false as const, open: '09:00', close: '18:00' };
const HOURS = { mon: open, tue: open, wed: open, thu: open, fri: open, sat: open, sun: { closed: true as const } };
// 2026-11-16 is a Monday. 05:00Z = 10:30 IST (open); 14:00Z = 19:30 IST (closed).
const MON_OPEN = new Date('2026-11-16T05:00:00Z');
const MON_LATE = new Date('2026-11-16T14:00:00Z');
const SUN = new Date('2026-11-15T05:00:00Z');

function row(id: string, name: string, lat: string, lng: string, hours: unknown = HOURS): PickupPointRow {
  return {
    id, name, address: `${name} road`, public_phone: '+914232000000', operating_hours: hours, lat, lng,
    // internal columns a careless serializer would leak
    ...({ contact_phone: '+919999999999', capacity_kg: '5000', code: 'WH-X', type: 'MAIN' } as object),
  } as PickupPointRow;
}
const A = '10000000-0000-4000-8000-000000000001';
const B = '10000000-0000-4000-8000-000000000002';
const rows = [row(A, 'Ooty', '11.4102', '76.695'), row(B, 'Coonoor', '11.353', '76.7959')];
const repo: PickupPointsRepo = { async listPublic() { return rows; } };
const svc = (now = MON_OPEN) => createPickupPointsService({ repo, db: {} as Executor, now: () => now });

describe('BR-170: public pickup points', () => {
  it('serialises only allow-listed keys (no contact_phone, capacity, code, type)', async () => {
    const out = await svc().list({});
    expect(() => pickupPointsResponse.parse(out)).not.toThrow();
    const json = JSON.stringify(out);
    for (const k of ['contact_phone', 'capacity', 'WH-X', '9999999999', '"type"']) expect(json).not.toContain(k);
    expect(out.items[0]).not.toHaveProperty('distanceKm');
  });

  it('computes isOpenNow in IST from the weekly hours', async () => {
    expect((await svc(MON_OPEN).list({})).items[0]?.isOpenNow).toBe(true);
    expect((await svc(MON_LATE).list({})).items[0]?.isOpenNow).toBe(false);
    expect((await svc(SUN).list({})).items[0]?.isOpenNow).toBe(false);
  });

  it('missing or malformed hours means closed, never a crash', () => {
    expect(isOpenNow(parseHours(null), MON_OPEN)).toBe(false);
    expect(isOpenNow(parseHours({ nonsense: 1 }), MON_OPEN)).toBe(false);
  });

  it('with lat/lng adds distanceKm, marks exactly one nearest and sorts by distance', async () => {
    const out = await svc().list({ lat: 11.35, lng: 76.79 }); // next to Coonoor
    expect(out.items.map((p) => p.name)).toEqual(['Coonoor', 'Ooty']);
    expect(out.items.filter((p) => p.isNearest)).toHaveLength(1);
    expect(out.items[0]?.isNearest).toBe(true);
    expect(out.items[0]?.distanceKm).toBeLessThan(2);
    expect(out.items[1]?.distanceKm).toBeGreaterThan(10);
  });

  it('lat and lng must come together and be in range', () => {
    expect(listPickupPointsQuery.safeParse({ lat: '11' }).success).toBe(false);
    expect(listPickupPointsQuery.safeParse({ lat: '91', lng: '76' }).success).toBe(false);
    expect(listPickupPointsQuery.safeParse({ lat: '11', lng: '76' }).success).toBe(true);
    expect(listPickupPointsQuery.safeParse({}).success).toBe(true);
  });
});
