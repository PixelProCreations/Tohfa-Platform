import { randomUUID } from 'node:crypto';
import type { Money } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import {
  cartRepo,
  type CartRepo,
  type CartRecord,
  type CartItemRecord,
} from './cart.repo.js';
import type {
  CartItemCreateInput,
  CartItemResponse,
  CartReplaceInput,
  CartLineAvailability,
  CartResponse,
  ProduceGrade,
} from './cart.schema.js';
import { gramsToKg } from '../sales/sales.math.js';
import { cartLineTotal, qtyGrams } from './cart.pricing.js';

/** D-01: quantities compared as integer grams, never as floats. "0.000" and malformed are <= 0. */
function requirePositiveGrams(qtyKg: string): number {
  const grams = qtyGrams(qtyKg);
  if (grams === null || grams <= 0) {
    throw new AppError('VALIDATION_FAILED', {
      status: 422,
      detail: 'Quantity must be greater than 0.',
    });
  }
  return grams;
}

/** Grams of a pg NUMERIC(…,3) stock figure; anything unparseable counts as 0 (fail closed). */
function stockGrams(qtyKg: string): number {
  return qtyGrams(qtyKg) ?? 0;
}

export interface CartService {
  getCart(actor: Actor, scope: ResolvedScope): Promise<CartResponse>;

  addItem(
    actor: Actor,
    scope: ResolvedScope,
    input: CartItemCreateInput,
  ): Promise<CartResponse>;

  replaceCart(
    actor: Actor,
    scope: ResolvedScope,
    input: CartReplaceInput,
  ): Promise<CartResponse>;

  clearCart(actor: Actor, scope: ResolvedScope): Promise<void>;
}

/** BR-203: documented default when cart_low_stock_threshold_kg is missing or invalid. */
export const DEFAULT_LOW_STOCK_THRESHOLD_KG = '2';

/** Threshold in integer grams; anything unparseable or negative falls back to the default. */
export function lowStockThresholdGrams(raw: unknown): number {
  const text = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw.trim() : '';
  const grams = qtyGrams(text);
  return grams === null || grams < 0 ? (qtyGrams(DEFAULT_LOW_STOCK_THRESHOLD_KG) ?? 0) : grams;
}

/**
 * BR-203: classify one held line, in integer grams (D-01).
 *  - UNAVAILABLE: the hold is no longer fully backed by the shelf (BR-100); checkout would 409.
 *  - LOW_STOCK:   fully backed, but the further ONLINE availability is below the threshold.
 *  - OK:          otherwise.
 * availableKg = backed hold + further availability: the most this line could hold right now.
 */
export function classifyCartLine(
  qtyKg: string,
  backedKg: string,
  moreKg: string,
  thresholdGrams: number,
): { availability: CartLineAvailability; availableKg: string } {
  const line = stockGrams(qtyKg);
  const backed = stockGrams(backedKg);
  const more = stockGrams(moreKg);
  const availability: CartLineAvailability =
    backed < line ? 'UNAVAILABLE' : more < thresholdGrams ? 'LOW_STOCK' : 'OK';
  return { availability, availableKg: gramsToKg(backed + more) };
}

function mapCartResponse(
  cart: CartRecord,
  items: CartItemRecord[],
  availability: Map<string, { availability: CartLineAvailability; availableKg: string }>,
): CartResponse {
  const mappedItems: CartItemResponse[] = items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.name,
    grade: item.grade,
    qtyKg: item.qtyKg,
    unitPrice: item.unitPrice as Money,
    lineTotal: item.lineTotal as Money,
    certificationBadges: [],
    // A line the availability read did not return (it cannot happen for a HELD line) fails closed.
    ...(availability.get(item.id) ?? { availability: 'UNAVAILABLE' as const, availableKg: '0.000' }),
  }));

  return {
    id: cart.id,
    warehouseId: cart.warehouse_id,
    status: cart.status,
    items: mappedItems,
    subtotal: cart.subtotal as Money,
    lockedAt: cart.locked_at ? cart.locked_at.toISOString() : null,
    lockExpiresAt: cart.locked_until ? cart.locked_until.toISOString() : null,
  };
}

export function createCartService(opts: {
  repo?: CartRepo;
  db?: Executor;
} = {}): CartService {
  const repo = opts.repo ?? cartRepo;
  const db = opts.db ?? pool;

  /**
   * Insert or merge a HELD line, then store its line total computed in integer paise from the
   * line's final (possibly merged) quantity and unit price. The upsert's row lock is held until
   * the transaction commits, so a concurrent add cannot interleave between the two statements.
   */
  /** BR-203: the stock flag of every held line, from the same BR-100 shelf figures. */
  async function lineAvailability(
    executor: Executor,
    cartId: string,
    items: CartItemRecord[],
  ): Promise<Map<string, { availability: CartLineAvailability; availableKg: string }>> {
    const out = new Map<string, { availability: CartLineAvailability; availableKg: string }>();
    if (items.length === 0) return out;
    const [rows, rawThreshold] = await Promise.all([
      repo.getHeldLineAvailability(executor, cartId),
      repo.getLowStockThresholdRaw(executor),
    ]);
    const threshold = lowStockThresholdGrams(rawThreshold);
    const byId = new Map(rows.map((r) => [r.itemId, r]));
    for (const item of items) {
      const row = byId.get(item.id);
      if (row) out.set(item.id, classifyCartLine(item.qtyKg, row.backedKg, row.moreKg, threshold));
    }
    return out;
  }

  async function upsertLine(
    tx: Executor,
    line: {
      cartId: string;
      cropId: string;
      grade: ProduceGrade;
      qtyKg: string;
      unitPrice: string;
      allocationId: string;
      reservedUntil: Date;
    },
    mode: 'add' | 'set' = 'add',
  ): Promise<void> {
    const row = await repo.upsertCartItem(tx, {
      ...line,
      lineTotal: cartLineTotal(line.unitPrice, line.qtyKg),
      mode,
    });
    const lineTotal = cartLineTotal(row.unitPrice, row.qtyKg);
    await repo.setLineTotal(tx, row.id, lineTotal);
  }

  return {
    async getCart(actor, _scope) {
      if (!actor.customerId) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Cart is accessible only by customers.',
        });
      }

      const cart = await repo.findActiveCart(db, actor.customerId);
      if (!cart) {
        return {
          id: randomUUID(),
          warehouseId: null,
          status: 'ACTIVE',
          items: [],
          subtotal: '0.00' as Money,
          lockedAt: null,
          lockExpiresAt: null,
        };
      }

      const items = await repo.getCartItems(db, cart.id);
      return mapCartResponse(cart, items, await lineAvailability(db, cart.id, items));
    },

    async addItem(actor, _scope, input) {
      if (!actor.customerId) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Cart is accessible only by customers.',
        });
      }

      const grams = requirePositiveGrams(input.qtyKg);

      const grade: ProduceGrade = input.grade ?? 'GRADE_1';

      return await withTransaction(async (tx) => {
        let cart = await repo.findActiveCart(tx, actor.customerId!);
        if (!cart) {
          cart = await repo.createActiveCart(tx, actor.customerId!);
        }

        const priceInfo = await repo.findActiveRetailPrice(tx, input.productId, grade);
        if (!priceInfo) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: 'Product or retail price not found for the specified grade.',
          });
        }

        const targetWarehouseId = input.warehouseId ?? cart.warehouse_id;

        const allocation = await repo.findAndLockOnlineAllocation(tx, {
          cropId: input.productId,
          grade,
          warehouseId: targetWarehouseId,
          requiredQty: input.qtyKg,
        });

        if (!allocation) {
          const breakdown = await repo.getAvailableStockBreakdown(tx, {
            cropId: input.productId,
            grade,
            warehouseId: targetWarehouseId,
          });

          if (stockGrams(breakdown.totalAvailable) === 0) {
            throw new AppError('STOCK_UNAVAILABLE', {
              status: 409,
              detail: `Only ${breakdown.onlineAvailable} kg of ${priceInfo.cropName} ${grade} remains today.`,
            });
          }

          // BR-12c: above the stored ONLINE bucket itself is an allocation refusal, never a draw on
          // Reserve. Within the bucket but above the shelf (a DIRECT sale took it, BR-100) is a
          // stock refusal.
          if (stockGrams(breakdown.onlineAllocationAvailable) < grams) {
            throw new AppError('INSUFFICIENT_ALLOCATION', {
              status: 409,
              detail: `Requested ${input.qtyKg} kg exceeds remaining online allocation of ${breakdown.onlineAllocationAvailable} kg (BR-12c).`,
            });
          }

          throw new AppError('STOCK_UNAVAILABLE', {
            status: 409,
            detail: `Only ${breakdown.onlineAvailable} kg of ${priceInfo.cropName} ${grade} is available online now.`,
          });
        }

        try {
          await repo.reserveAllocation(tx, allocation.id, input.qtyKg);
        } catch (err: unknown) {
          const pgErr = err as { code?: string };
          if (pgErr.code === '23514') {
            throw new AppError('STOCK_UNAVAILABLE', {
              status: 409,
              detail: 'Allocation oversold constraint reached.',
            });
          }
          throw err;
        }

        const lockHours = await repo.getCartLockHours(tx);
        const reservedUntil = new Date(Date.now() + lockHours * 3600 * 1000);

        await upsertLine(tx, {
          cartId: cart.id,
          cropId: input.productId,
          grade,
          qtyKg: input.qtyKg,
          unitPrice: priceInfo.price,
          allocationId: allocation.id,
          reservedUntil,
        });

        const updatedCart = await repo.updateCartLockAndSubtotal(
          tx,
          cart.id,
          allocation.warehouse_id,
          lockHours,
        );

        const items = await repo.getCartItems(tx, cart.id);
        return mapCartResponse(updatedCart, items, await lineAvailability(tx, cart.id, items));
      });
    },

    async replaceCart(actor, _scope, input) {
      if (!actor.customerId) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Cart is accessible only by customers.',
        });
      }

      return await withTransaction(async (tx) => {
        let cart = await repo.findActiveCart(tx, actor.customerId!);
        if (!cart) {
          cart = await repo.createActiveCart(tx, actor.customerId!, input.warehouseId ?? null);
        } else {
          await repo.clearCart(tx, cart.id);
        }

        const lockHours = await repo.getCartLockHours(tx);
        const targetWarehouseId = input.warehouseId ?? cart.warehouse_id;

        for (const itemInput of input.items) {
          const grams = requirePositiveGrams(itemInput.qtyKg);

          const grade: ProduceGrade = itemInput.grade ?? 'GRADE_1';
          const priceInfo = await repo.findActiveRetailPrice(tx, itemInput.productId, grade);
          if (!priceInfo) {
            throw new AppError('NOT_FOUND', {
              status: 404,
              detail: `Product or retail price not found for ${itemInput.productId}.`,
            });
          }

          const allocation = await repo.findAndLockOnlineAllocation(tx, {
            cropId: itemInput.productId,
            grade,
            warehouseId: targetWarehouseId,
            requiredQty: itemInput.qtyKg,
          });

          if (!allocation) {
            const breakdown = await repo.getAvailableStockBreakdown(tx, {
              cropId: itemInput.productId,
              grade,
              warehouseId: targetWarehouseId,
            });

            if (stockGrams(breakdown.totalAvailable) === 0) {
              throw new AppError('STOCK_UNAVAILABLE', {
                status: 409,
                detail: `Only ${breakdown.onlineAvailable} kg of ${priceInfo.cropName} ${grade} remains today.`,
              });
            }

            // BR-12c: above the stored ONLINE bucket itself is an allocation refusal, never a draw on
            // Reserve. Within the bucket but above the shelf (a DIRECT sale took it, BR-100) is a
            // stock refusal.
            if (stockGrams(breakdown.onlineAllocationAvailable) < grams) {
              throw new AppError('INSUFFICIENT_ALLOCATION', {
                status: 409,
                detail: `Requested ${itemInput.qtyKg} kg exceeds remaining online allocation of ${breakdown.onlineAllocationAvailable} kg (BR-12c).`,
              });
            }

            throw new AppError('STOCK_UNAVAILABLE', {
              status: 409,
              detail: `Only ${breakdown.onlineAvailable} kg of ${priceInfo.cropName} ${grade} is available online now.`,
            });
          }

          await repo.reserveAllocation(tx, allocation.id, itemInput.qtyKg);

          const reservedUntil = new Date(Date.now() + lockHours * 3600 * 1000);

          await upsertLine(
            tx,
            {
              cartId: cart.id,
              cropId: itemInput.productId,
              grade,
              qtyKg: itemInput.qtyKg,
              unitPrice: priceInfo.price,
              allocationId: allocation.id,
              reservedUntil,
            },
            'set',
          );
        }

        const updatedCart = await repo.updateCartLockAndSubtotal(
          tx,
          cart.id,
          targetWarehouseId,
          lockHours,
        );

        const items = await repo.getCartItems(tx, cart.id);
        return mapCartResponse(updatedCart, items, await lineAvailability(tx, cart.id, items));
      });
    },

    async clearCart(actor, _scope) {
      if (!actor.customerId) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Cart is accessible only by customers.',
        });
      }

      await withTransaction(async (tx) => {
        const cart = await repo.findActiveCart(tx, actor.customerId!);
        if (cart) {
          await repo.clearCart(tx, cart.id);
        }
      });
    },
  };
}

export const cartService = createCartService();
