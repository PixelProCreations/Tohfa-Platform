/**
 * BR-160 (addresses part): own-only, one default, soft delete. Service tests
 * against an in-memory fake repo keyed on customer_id like the real SQL.
 */
import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { aScope } from '../../test/factories.js';
import type { CustomerAddressesRepo, NewAddress } from './customer-addresses.repo.js';
import { createCustomerAddressesService } from './customer-addresses.service.js';
import { createAddressBody, updateAddressBody, type CustomerAddress } from './customer-addresses.schema.js';

const CUSTOMER_A = '40000000-0000-4000-8000-00000000000a';
const CUSTOMER_B = '40000000-0000-4000-8000-00000000000b';

interface Stored extends CustomerAddress {
  customerId: string;
  deleted: boolean;
}

function fakeRepo() {
  const rows: Stored[] = [];
  const customerDefault = new Map<string, string | null>();
  let seq = 0;
  const strip = ({ customerId: _c, deleted: _d, ...rest }: Stored): CustomerAddress => rest;
  const live = (customerId: string) => rows.filter((r) => r.customerId === customerId && !r.deleted);
  const repo: CustomerAddressesRepo = {
    async pickupPointExists(_db, id) {
      return id === '60000000-0000-4000-8000-000000000001';
    },
    async list(_db, customerId) {
      return live(customerId).map(strip);
    },
    async findOwn(_db, customerId, id) {
      const r = live(customerId).find((x) => x.id === id);
      return r ? strip(r) : null;
    },
    async countLive(_db, customerId) {
      return live(customerId).length;
    },
    async insert(_db, customerId, a: NewAddress) {
      seq += 1;
      const row: Stored = {
        id: `50000000-0000-4000-8000-${String(seq).padStart(12, '0')}`,
        ...a,
        isDefault: false,
        createdAt: '2026-11-16T00:00:00.000Z',
        updatedAt: null,
        customerId,
        deleted: false,
      };
      rows.push(row);
      return strip(row);
    },
    async update(_db, customerId, id, patch) {
      const r = live(customerId).find((x) => x.id === id);
      if (!r) return null;
      Object.assign(r, patch);
      return strip(r);
    },
    async softDelete(_db, customerId, id) {
      const r = live(customerId).find((x) => x.id === id);
      if (!r) return false;
      r.deleted = true;
      r.isDefault = false;
      return true;
    },
    async clearDefault(_db, customerId) {
      for (const r of live(customerId)) r.isDefault = false;
    },
    async markDefault(_db, customerId, id) {
      const r = live(customerId).find((x) => x.id === id);
      if (r) r.isDefault = true;
    },
    async setCustomerDefault(_db, customerId, id) {
      customerDefault.set(customerId, id);
    },
  };
  return { repo, rows, customerDefault };
}

const PICKUP = '60000000-0000-4000-8000-000000000001';
const db = {} as Executor;
const scopeFor = (customerId: string) =>
  aScope({
    level: ScopeLevel.OWN,
    roleCode: RoleCode.CUSTOMER,
    permission: 'customer.address.manage_own',
    customerId,
  });

function setup() {
  const fake = fakeRepo();
  const svc = createCustomerAddressesService({ repo: fake.repo, db, transaction: (fn) => fn(db) });
  return { ...fake, svc };
}

const body = (over: Record<string, unknown> = {}) =>
  createAddressBody.parse({ line1: '12 Hill Road', city: 'Ooty', pincode: '643001', ...over });

describe('customer addresses', () => {
  it('BR-160: the first address becomes the default and is mirrored on the customer', async () => {
    const { svc, customerDefault } = setup();
    const a = await svc.create(scopeFor(CUSTOMER_A), body());
    expect(a.isDefault).toBe(true);
    expect(customerDefault.get(CUSTOMER_A)).toBe(a.id);
  });

  it('BR-160: setting a new default clears the old one (exactly one default)', async () => {
    const { svc, customerDefault } = setup();
    const scope = scopeFor(CUSTOMER_A);
    const first = await svc.create(scope, body());
    const second = await svc.create(scope, body({ label: 'WORK' }));
    expect(second.isDefault).toBe(false);
    await svc.setDefault(scope, second.id);
    const list = (await svc.list(scope)).items;
    expect(list.filter((x) => x.isDefault).map((x) => x.id)).toEqual([second.id]);
    expect(list.find((x) => x.id === first.id)?.isDefault).toBe(false);
    expect(customerDefault.get(CUSTOMER_A)).toBe(second.id);
  });

  it('BR-36: another customer\'s address is 404 on get, update, delete and set-default', async () => {
    const { svc } = setup();
    const a = await svc.create(scopeFor(CUSTOMER_A), body());
    const other = scopeFor(CUSTOMER_B);
    for (const op of [
      () => svc.get(other, a.id),
      () => svc.update(other, a.id, updateAddressBody.parse({ city: 'Coonoor' })),
      () => svc.remove(other, a.id),
      () => svc.setDefault(other, a.id),
    ]) {
      await expect(op()).rejects.toMatchObject({ code: 'NOT_FOUND' });
    }
    expect((await svc.list(other)).items).toEqual([]);
  });

  it('BR-160: delete is soft and a deleted default clears customers.default_address_id', async () => {
    const { svc, rows, customerDefault } = setup();
    const scope = scopeFor(CUSTOMER_A);
    const a = await svc.create(scope, body());
    await svc.remove(scope, a.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.deleted).toBe(true);
    expect(customerDefault.get(CUSTOMER_A)).toBeNull();
    await expect(svc.get(scope, a.id)).rejects.toBeInstanceOf(AppError);
  });

  it('BR-160: a non-customer scope sees no addresses', async () => {
    const { svc } = setup();
    expect((await svc.list(aScope())).items).toEqual([]);
  });

  it('validates pincode and lat/lng pairing', () => {
    expect(createAddressBody.safeParse({ line1: 'x', city: 'y', pincode: '043001' }).success).toBe(false);
    expect(createAddressBody.safeParse({ line1: 'x', city: 'y', pincode: '643001', lat: 11.4 }).success).toBe(false);
    expect(updateAddressBody.safeParse({}).success).toBe(false);
  });

  it('BR-180: landmark, contactPhone and a valid nearestPickupPointId are stored', async () => {
    const { svc } = setup();
    const a = await svc.create(
      scopeFor(CUSTOMER_A),
      body({ landmark: 'Near temple', contactPhone: '+919876543210', nearestPickupPointId: PICKUP }),
    );
    expect(a).toMatchObject({ landmark: 'Near temple', contactPhone: '+919876543210', nearestPickupPointId: PICKUP });
  });

  it('BR-180: an unknown pickup point is a 422 on create and update', async () => {
    const { svc } = setup();
    const scope = scopeFor(CUSTOMER_A);
    const bad = '60000000-0000-4000-8000-0000000000ff';
    await expect(svc.create(scope, body({ nearestPickupPointId: bad }))).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    const a = await svc.create(scope, body());
    await expect(
      svc.update(scope, a.id, updateAddressBody.parse({ nearestPickupPointId: bad })),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('BR-180: label WORK is an alias for OFFICE; labels are HOME/OFFICE/OTHER', () => {
    expect(body({ label: 'WORK' }).label).toBe('OFFICE');
    expect(body({ label: 'OFFICE' }).label).toBe('OFFICE');
    expect(body().label).toBe('HOME');
    expect(createAddressBody.safeParse({ line1: 'x', city: 'y', pincode: '643001', label: 'CAMP' }).success).toBe(false);
    expect(createAddressBody.safeParse({ line1: 'x', city: 'y', pincode: '643001', contactPhone: '123' }).success).toBe(false);
  });
});
