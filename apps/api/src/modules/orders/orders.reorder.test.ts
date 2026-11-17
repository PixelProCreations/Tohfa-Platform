/**
 * BR-162: reorder rebuilds the cart from the caller's own past order, line by
 * line, subject to today's availability, and reports what could not be added.
 */
import { describe, expect, it, vi } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { aScope } from '../../test/factories.js';
import type { CartService } from '../cart/cart.service.js';
import type { CartResponse } from '../cart/cart.schema.js';
import type { OrderItemRecord, OrderRecord, OrdersRepo } from './orders.repo.js';
import { createOrdersService } from './orders.service.js';

const CUSTOMER = '40000000-0000-4000-8000-00000000000a';
const OTHER = '40000000-0000-4000-8000-00000000000b';
const ORDER = '50000000-0000-4000-8000-000000000001';
const WH = '10000000-0000-4000-8000-000000000001';

const actorFor = (customerId: string | null): Actor => ({
  userId: '30000000-0000-4000-8000-00000000000a',
  roles: [{ code: RoleCode.CUSTOMER }],
  farmerId: null,
  customerId,
});
const scope = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, permission: 'order.reorder_own' });

function item(productId: string, name: string): OrderItemRecord {
  return { id: `i-${productId}`, orderId: ORDER, productId, name, grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '50.00', lineTotal: '100.00' };
}

const emptyCart: CartResponse = {
  id: '60000000-0000-4000-8000-000000000001',
  warehouseId: WH,
  status: 'LOCKED',
  items: [],
  subtotal: '0.00',
  lockedAt: null,
  lockExpiresAt: null,
};

function setup(refusals: Record<string, unknown> = {}) {
  const items = [item('p-carrot', 'Carrot'), item('p-beans', 'Beans'), item('p-leek', 'Leek')];
  const repo = {
    findOrderById: vi.fn(async (_db: Executor, id: string, customerId?: string | null) =>
      id === ORDER && customerId === CUSTOMER
        ? { order: { id: ORDER, warehouseId: WH } as OrderRecord, items }
        : null,
    ),
  } as unknown as OrdersRepo;
  const added: Array<{ productId: string; warehouseId?: string | undefined; qtyKg: string }> = [];
  const cartSvc = {
    addItem: vi.fn(async (_a, _s, input) => {
      const refusal = refusals[input.productId];
      if (refusal) throw refusal;
      added.push(input);
      return emptyCart;
    }),
    getCart: vi.fn(async () => emptyCart),
  } as unknown as CartService;
  const svc = createOrdersService({ repo, db: {} as Executor, cartSvc, events: { publish: vi.fn() } });
  return { svc, added, cartSvc };
}

describe('BR-162: reorder', () => {
  it('BR-162: adds every available line at the original warehouse and lists the unavailable ones', async () => {
    const { svc, added } = setup({
      'p-beans': new AppError('STOCK_UNAVAILABLE', { detail: 'sold out' }),
      'p-leek': new AppError('NOT_FOUND', { detail: 'no retail price' }),
    });
    const res = await svc.reorder(actorFor(CUSTOMER), scope, ORDER, 'k');
    expect(added).toEqual([{ productId: 'p-carrot', grade: 'GRADE_1', qtyKg: '2.000', warehouseId: WH }]);
    expect(res.addedCount).toBe(1);
    expect(res.unavailable).toEqual([
      { productId: 'p-beans', name: 'Beans', grade: 'GRADE_1', qtyKg: '2.000', reason: 'OUT_OF_STOCK' },
      { productId: 'p-leek', name: 'Leek', grade: 'GRADE_1', qtyKg: '2.000', reason: 'DELISTED' },
    ]);
    expect(res.cart).toEqual(emptyCart);
  });

  it('BR-162: a replay adds only what the cart is missing, never doubling a reservation', async () => {
    const { svc, added, cartSvc } = setup();
    vi.mocked(cartSvc.getCart).mockResolvedValueOnce({
      ...emptyCart,
      items: [
        { id: 'c1', productId: 'p-carrot', name: 'Carrot', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '50.00', lineTotal: '100.00' },
        { id: 'c2', productId: 'p-beans', name: 'Beans', grade: 'GRADE_1', qtyKg: '0.500', unitPrice: '50.00', lineTotal: '25.00' },
      ],
    });
    const res = await svc.reorder(actorFor(CUSTOMER), scope, ORDER, 'k');
    expect(added.map((a) => [a.productId, a.qtyKg])).toEqual([
      ['p-beans', '1.500'],
      ['p-leek', '2.000'],
    ]);
    expect(res.addedCount).toBe(3);
  });

  it('a missing Idempotency-Key is 422', async () => {
    const { svc } = setup();
    await expect(svc.reorder(actorFor(CUSTOMER), scope, ORDER, undefined)).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('BR-36: another customer\'s order is 404 and nothing is added to the cart', async () => {
    const { svc, cartSvc } = setup();
    await expect(svc.reorder(actorFor(OTHER), scope, ORDER, 'k')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(svc.reorder(actorFor(null), scope, ORDER, 'k')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(cartSvc.addItem).not.toHaveBeenCalled();
  });

  it('BR-162: an unexpected cart failure is not reported as "unavailable"', async () => {
    const { svc } = setup({ 'p-carrot': new Error('connection reset') });
    await expect(svc.reorder(actorFor(CUSTOMER), scope, ORDER, 'k')).rejects.toThrow('connection reset');
  });
});
