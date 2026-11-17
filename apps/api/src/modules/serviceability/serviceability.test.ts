import { describe, expect, it } from 'vitest';
import type { Executor } from '../../db/pool.js';
import type { PickupPointRow, PickupPointsRepo } from '../pickup-points/pickup-points.repo.js';
import type { AreaRequestRow, InsertAreaRequest, ServiceabilityRepo, ServedPincodeRow } from './serviceability.repo.js';
import { createAreaRequestBody, serviceabilityQuery, serviceabilityResponse } from './serviceability.schema.js';
import { createServiceabilityService, normalizeContact, normalizeKey } from './serviceability.service.js';

const WH = '10000000-0000-4000-8000-000000000001';
const db = {} as Executor;

class FakeRepo implements ServiceabilityRepo {
  radius: unknown = 60;
  served: ServedPincodeRow[] = [{ pincode: '643001', warehouse_id: WH, delivery_available: true }];
  requests = new Map<string, AreaRequestRow>();
  async getServedPincode(_d: Executor, p: string) { return this.served.find((s) => s.pincode === p) ?? null; }
  async getNumberConfig() { return this.radius; }
  async insertAreaRequest(_d: Executor, r: InsertAreaRequest) {
    const k = `${r.requesterKey}#${r.areaKey}`;
    const old = this.requests.get(k);
    if (old) return { row: old, created: false };
    const row: AreaRequestRow = {
      id: `20000000-0000-4000-8000-00000000000${this.requests.size + 1}`, area: r.area, locality: r.locality,
      city: r.city, pincode: r.pincode, contact: r.contact, customer_id: r.customerId, status: 'NEW', created_at: new Date('2026-11-17T00:00:00Z'),
    };
    this.requests.set(k, row);
    return { row, created: true };
  }
  async listAreaRequests(_d: Executor, status: string | undefined, limit: number) {
    return [...this.requests.values()].filter((r) => !status || r.status === status).slice(0, limit);
  }
}
const pickups: PickupPointsRepo = {
  async listPublic() {
    return [{ id: WH, name: 'Ooty', address: null, public_phone: null, operating_hours: null, lat: '11.4102', lng: '76.695' } as PickupPointRow];
  },
};
const make = (repo = new FakeRepo()) => ({ repo, svc: createServiceabilityService({ repo, pickupRepo: pickups, db }) });

describe('BR-171: serviceability', () => {
  it('a served pincode is serviceable with delivery and its pickup point', async () => {
    const out = await make().svc.check({ pincode: '643001' });
    expect(out).toEqual({ serviceable: true, deliveryAvailable: true, nearestPickupPointId: WH });
    expect(() => serviceabilityResponse.parse(out)).not.toThrow();
  });

  it('an unknown pincode is not serviceable and offers no delivery', async () => {
    expect(await make().svc.check({ pincode: '560001' })).toEqual({ serviceable: false, deliveryAvailable: false });
  });

  it('lat/lng inside the configured radius is pickup-serviceable, never delivery', async () => {
    const out = await make().svc.check({ lat: 11.42, lng: 76.7 });
    expect(out).toEqual({ serviceable: true, deliveryAvailable: false, nearestPickupPointId: WH });
  });

  it('lat/lng outside the radius is not serviceable but still names the nearest point', async () => {
    const out = await make().svc.check({ lat: 12.97, lng: 77.59 }); // Bengaluru
    expect(out.serviceable).toBe(false);
    expect(out.nearestPickupPointId).toBe(WH);
  });

  it('fails closed with INTERNAL when the radius config is missing', async () => {
    const { repo, svc } = make();
    repo.radius = null;
    await expect(svc.check({ lat: 11.42, lng: 76.7 })).rejects.toMatchObject({ code: 'INTERNAL' });
  });

  it('query needs a pincode or a lat+lng pair', () => {
    expect(serviceabilityQuery.safeParse({}).success).toBe(false);
    expect(serviceabilityQuery.safeParse({ lat: '11' }).success).toBe(false);
    expect(serviceabilityQuery.safeParse({ pincode: '12' }).success).toBe(false);
    expect(serviceabilityQuery.safeParse({ pincode: '643001' }).success).toBe(true);
  });
});

describe('BR-171: service-area requests', () => {
  const body = { area: 'Fernhill', locality: 'Ooty North', city: 'Ooty', contact: '+91 98765 43210' };

  it('is idempotent per requester and area (case and spacing insensitive)', async () => {
    const { repo, svc } = make();
    const who = { customerId: null, ip: '1.1.1.1' };
    const a = await svc.createRequest(body, who);
    const b = await svc.createRequest({ ...body, area: '  FERNHILL ', contact: '09876543210' }, { customerId: null, ip: '9.9.9.9' });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.request.id).toBe(a.request.id);
    expect(repo.requests.size).toBe(1);
  });

  it('a different area or a different requester is a new request', async () => {
    const { svc } = make();
    await svc.createRequest(body, { customerId: null, ip: null });
    expect((await svc.createRequest({ ...body, area: 'Lovedale' }, { customerId: null, ip: null })).created).toBe(true);
    expect((await svc.createRequest(body, { customerId: '30000000-0000-4000-8000-000000000001', ip: null })).created).toBe(true);
  });

  it('the public response omits contact and customer id; the admin list includes them', async () => {
    const { svc } = make();
    const { request } = await svc.createRequest(body, { customerId: null, ip: null });
    expect(request).not.toHaveProperty('contact');
    expect(request).not.toHaveProperty('customerId');
    const admin = await svc.listRequests({ limit: 50 });
    expect(admin.items[0]?.contact).toBe(body.contact);
  });

  it('body is strict and validated', () => {
    expect(createAreaRequestBody.safeParse(body).success).toBe(true);
    expect(createAreaRequestBody.safeParse({ ...body, extra: 1 }).success).toBe(false);
    expect(createAreaRequestBody.safeParse({ ...body, pincode: 'abc' }).success).toBe(false);
    expect(createAreaRequestBody.safeParse({ area: 'x' }).success).toBe(false);
  });

  it('normalisers', () => {
    expect(normalizeKey(' A  b ', 'C')).toBe('a b|c');
    expect(normalizeContact('+91 98765-43210')).toBe('9876543210');
  });
});
