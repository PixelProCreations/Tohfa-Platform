/**
 * BR-213 / BR-214 / BR-215 (migration 0190): the orders repo functions behind gateway-paid orders,
 * against a real database. Everything runs inside ONE transaction that is rolled back at the end,
 * so the suite leaves no rows behind. Soft-skips when no database is configured or the schema
 * predates 0190 (orders.idempotency_key missing).
 *
 *  - createOrder without the new params is the unchanged wallet path (CONFIRMED / PAID);
 *  - a PENDING_PAYMENT order is found again by (customer, Idempotency-Key) and by gateway order id;
 *  - cancel + releaseOrderStock + releaseDeliverySlot undo the placement exactly once (a positive
 *    RELEASE ledger row is accepted by trg_stock_ledger_balance);
 *  - a capture after cancellation is REFUND_DUE; a capture before it confirms the order.
 */
import type pg from 'pg';
import { afterAll, beforeAll, expect, it } from 'vitest';
import type { Money } from '@tohfa/shared-types';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { ordersRepo, type CartCheckoutItem, type CreateOrderParams } from './orders.repo.js';

describeIfDatabase('BR-213..215: orders repo, gateway-paid orders (integration)', () => {
  let ready = false;
  let tx: pg.PoolClient | null = null;
  const ids = {
    warehouse: newId(),
    user: newId(),
    customer: newId(),
    otherCustomer: newId(),
    farmerUser: newId(),
    farmer: newId(),
    crop: newId(),
    batch: newId(),
    allocation: newId(),
  };
  const slotDate = '2999-04-01';
  const rand = Math.floor(100000 + Math.random() * 900000);

  async function q<R extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, params: unknown[] = []) {
    return tx!.query<R>(sql, params);
  }

  /** A LOCKED cart with one HELD 3 kg line reserved on the ONLINE allocation. */
  async function lockedCart(customerId: string): Promise<{ cartId: string; items: CartCheckoutItem[] }> {
    const cartId = newId();
    await q(
      `INSERT INTO carts (id, customer_id, warehouse_id, status, locked_at, locked_until, subtotal)
       VALUES ($1, $2, $3, 'LOCKED', now(), now() + interval '15 minutes', 30.00)`,
      [cartId, customerId, ids.warehouse],
    );
    const itemId = newId();
    await q(
      `INSERT INTO cart_items (id, cart_id, crop_id, grade, qty_kg, unit_price, line_total, allocation_id, status)
       VALUES ($1, $2, $3, 'GRADE_1', 3.000, 10.00, 30.00, $4, 'HELD')`,
      [itemId, cartId, ids.crop, ids.allocation],
    );
    await q(`UPDATE allocations SET reserved_qty = reserved_qty + 3.000 WHERE id = $1`, [ids.allocation]);
    return {
      cartId,
      items: [{
        id: itemId, cartId, productId: ids.crop, name: `Gw Leek ${rand}`, grade: 'GRADE_1',
        qtyKg: '3.000', unitPrice: '10.00', lineTotal: '30.00', allocationId: ids.allocation, batchId: ids.batch,
      }],
    };
  }

  function orderParams(cartId: string, items: CartCheckoutItem[], extra: Partial<CreateOrderParams> = {}): CreateOrderParams {
    return {
      orderNumber: `TOH-GW-${rand}-${newId().slice(0, 8)}`,
      customerId: ids.customer,
      warehouseId: ids.warehouse,
      cartId,
      channel: 'ONLINE',
      fulfillmentType: 'PICKUP',
      subtotal: '30.00' as Money,
      deliveryFee: '0.00' as Money,
      handlingFee: '0.00' as Money,
      discount: '0.00' as Money,
      gstAmount: '0.00' as Money,
      totalAmount: '30.00' as Money,
      paymentMethod: 'WALLET',
      deliveryOtpPlaintext: '1234',
      items,
      actorUserId: ids.user,
      ...extra,
    };
  }

  async function stock() {
    const r = await q<{ available: string; consumed: string; reserved: string; booked: number | null }>(
      `SELECT (SELECT qty_available::text FROM inventory_batches WHERE id = $1) AS available,
              (SELECT consumed_qty::text FROM allocations WHERE id = $2) AS consumed,
              (SELECT reserved_qty::text FROM allocations WHERE id = $2) AS reserved,
              (SELECT booked_orders FROM delivery_slots WHERE warehouse_id = $3 AND slot_date = $4 AND slot = 'EVENING_4_8') AS booked`,
      [ids.batch, ids.allocation, ids.warehouse, slotDate],
    );
    return r.rows[0]!;
  }

  beforeAll(async () => {
    ready = await databaseReady('orders');
    if (!ready) return;
    const col = await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'idempotency_key'`,
    );
    if ((col.rowCount ?? 0) === 0) { ready = false; return; }

    tx = await pool.connect();
    await tx.query('BEGIN');
    await q(`INSERT INTO warehouses (id, code, name, type, address, city, pincode) VALUES ($1, $2, 'Gw WH', 'MAIN', '1 Rd', 'Ooty', '643001')`, [ids.warehouse, `WH-GW-${rand}`]);
    const otherUser = newId();
    await q(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES
         ($1, $2, 'Gw C', 'CUSTOMER', 'ACTIVE'), ($3, $4, 'Gw F', 'FARMER', 'ACTIVE'), ($5, $6, 'Gw C2', 'CUSTOMER', 'ACTIVE')`,
      [ids.user, `+919811${rand}`, ids.farmerUser, `+919822${rand}`, otherUser, `+919833${rand}`],
    );
    await q(`INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3), ($4, $5, $6)`, [ids.customer, ids.user, `CUST-GW-${rand}`, ids.otherCustomer, otherUser, `CUST-GW2-${rand}`]);
    await q(`INSERT INTO farmers (id, user_id, tohfa_farmer_id, application_status) VALUES ($1, $2, $3, 'APPROVED')`, [ids.farmer, ids.farmerUser, `FARM-GW-${rand}`]);
    const cat = await q<{ id: string }>(`SELECT id FROM categories LIMIT 1`);
    await q(`INSERT INTO crop_master (id, category_id, slug, name) VALUES ($1, $2, $3, $4)`, [ids.crop, cat.rows[0]!.id, `gw-${rand}`, `Gw Leek ${rand}`]);
    await q(
      `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, status)
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 100.000, 100.000, 'ACTIVE')`,
      [ids.batch, `B-GW-${rand}`, ids.warehouse, ids.crop, ids.farmer],
    );
    await q(`INSERT INTO allocations (id, batch_id, warehouse_id, channel, allocated_qty, consumed_qty, reserved_qty) VALUES ($1, $2, $3, 'ONLINE', 50.000, 0, 0)`, [ids.allocation, ids.batch, ids.warehouse]);
    await q(`INSERT INTO delivery_slots (warehouse_id, slot_date, slot, capacity_orders, booked_orders) VALUES ($1, $2, 'EVENING_4_8', 5, 0)`, [ids.warehouse, slotDate]);
  });

  afterAll(async () => {
    if (!tx) return;
    await tx.query('ROLLBACK');
    tx.release();
  });

  it('BR-17: createOrder without the new params is the unchanged wallet path (CONFIRMED / PAID, wallet note)', async () => {
    if (!ready) return;
    const { cartId, items } = await lockedCart(ids.customer);
    const { order } = await ordersRepo.createOrder(tx!, orderParams(cartId, items));
    expect(order).toMatchObject({ status: 'CONFIRMED', paymentStatus: 'PAID', idempotencyKey: null, paymentExpiresAt: null });
    const hist = await q<{ to_status: string; note: string }>(`SELECT to_status, note FROM order_status_history WHERE order_id = $1`, [order.id]);
    expect(hist.rows).toEqual([{ to_status: 'CONFIRMED', note: 'Order placed via wallet checkout' }]);
    const cart = await q<{ status: string }>(`SELECT status FROM carts WHERE id = $1`, [cartId]);
    expect(cart.rows[0]!.status).toBe('CONVERTED');
    await expect(
      ordersRepo.createOrder(tx!, orderParams(newId(), [], { status: 'CONFIRMED', paymentStatus: 'PENDING' })),
    ).rejects.toThrow(/never CONFIRMED/);
  });

  it('BR-213 / BR-215: pending order is replayable, cancel releases stock and slot exactly once, late capture is REFUND_DUE', async () => {
    if (!ready) return;
    const before = await stock();
    const { cartId, items } = await lockedCart(ids.customer);
    const key = `idem-${newId()}`;
    const expiresAt = new Date(Date.now() + 15 * 60_000);
    await ordersRepo.checkAndBookDeliverySlot(tx!, ids.warehouse, slotDate, 'EVENING_4_8');
    const addr = newId();
    await q(`INSERT INTO customer_addresses (id, customer_id, label, line1, city, pincode, is_default) VALUES ($1, $2, 'HOME', '1 Lane', 'Ooty', '643004', true)`, [addr, ids.customer]);
    const { order } = await ordersRepo.createOrder(tx!, orderParams(cartId, items, {
      paymentMethod: 'UPI', status: 'PENDING_PAYMENT', idempotencyKey: key, paymentExpiresAt: expiresAt,
      fulfillmentType: 'DELIVERY', deliveryAddressId: addr, deliveryDate: slotDate, deliverySlot: 'EVENING_4_8',
    }));
    expect(order).toMatchObject({ status: 'PENDING_PAYMENT', paymentStatus: 'PENDING', idempotencyKey: key });
    await ordersRepo.convertAllocationsAndAppendStockLedger(tx!, items, order.id, ids.warehouse, ids.user);
    const gwOrderId = `order_test_${newId().slice(0, 12)}`;
    const payment = await ordersRepo.insertOrderPayment(tx!, { orderId: order.id, gatewayOrderId: gwOrderId, amount: '30.00' as Money, method: 'UPI' });
    expect(payment).toMatchObject({ status: 'CREATED', refType: 'ORDER', refId: order.id, amount: '30.00', method: 'UPI' });

    const taken = await stock();
    expect(Number(taken.available)).toBeCloseTo(Number(before.available) - 3, 3);
    expect(Number(taken.consumed)).toBeCloseTo(Number(before.consumed) + 3, 3);
    expect(taken.booked).toBe((before.booked ?? 0) + 1);

    // Replay by (customer, key); another customer with the same key sees nothing.
    const replay = await ordersRepo.findOrderByIdempotencyKey(tx!, ids.customer, key);
    expect(replay?.order.id).toBe(order.id);
    expect(replay?.payment?.gatewayOrderId).toBe(gwOrderId);
    expect(replay?.items).toHaveLength(1);
    expect(await ordersRepo.findOrderByIdempotencyKey(tx!, ids.otherCustomer, key)).toBeNull();
    expect((await ordersRepo.getOrderByGatewayOrderId(tx!, gwOrderId))?.order.id).toBe(order.id);
    expect((await ordersRepo.getPaymentByGatewayOrderId(tx!, gwOrderId))?.id).toBe(payment.id);

    // A second ORDER payments row for the same gateway order id is refused (0190 unique index).
    await q('SAVEPOINT dup');
    await expect(ordersRepo.insertOrderPayment(tx!, { orderId: order.id, gatewayOrderId: gwOrderId, amount: '30.00' as Money, method: 'UPI' }))
      .rejects.toMatchObject({ code: '23505' });
    await q('ROLLBACK TO SAVEPOINT dup');

    // payment.failed records the attempt only.
    expect((await ordersRepo.markOrderPaymentFailed(tx!, { paymentId: payment.id, rawPayload: { e: 'x' } }))?.status).toBe('FAILED');
    expect((await ordersRepo.lockOrderForPayment(tx!, order.id))?.status).toBe('PENDING_PAYMENT');

    const cancelled = await ordersRepo.cancelPendingOrder(tx!, { orderId: order.id, reason: 'PAYMENT_NOT_COMPLETED', actorUserId: null });
    expect(cancelled).toMatchObject({ status: 'CANCELLED', paymentStatus: 'FAILED', cancellationReason: 'PAYMENT_NOT_COMPLETED' });
    expect(await ordersRepo.cancelPendingOrder(tx!, { orderId: order.id, reason: 'CUSTOMER_CANCELLED', actorUserId: null })).toBeNull();

    const rel = await ordersRepo.releaseOrderStock(tx!, order, null);
    expect(rel).toEqual({ released: true, ledgerRows: 1, allocations: 1 });
    expect(await ordersRepo.releaseDeliverySlot(tx!, order)).toBe(true);
    expect((await ordersRepo.releaseOrderStock(tx!, order, null)).released).toBe(false);

    const after = await stock();
    expect(after.available).toBe(before.available);
    expect(after.consumed).toBe(before.consumed);
    expect(after.booked).toBe(before.booked ?? 0);
    const ledger = await q<{ movement_type: string; qty_delta: string }>(
      `SELECT movement_type, qty_delta::text FROM stock_ledger WHERE ref_type = 'ORDER' AND ref_id = $1 ORDER BY created_at, movement_type::text DESC`,
      [order.id],
    );
    expect(ledger.rows).toEqual([{ movement_type: 'SALE', qty_delta: '-3.000' }, { movement_type: 'RELEASE', qty_delta: '3.000' }]);
    const hist = await q<{ from_status: string | null; to_status: string }>(
      `SELECT from_status, to_status FROM order_status_history WHERE order_id = $1 ORDER BY created_at, to_status::text DESC`,
      [order.id],
    );
    expect(hist.rows.map((h) => `${h.from_status}->${h.to_status}`)).toEqual(['null->PENDING_PAYMENT', 'PENDING_PAYMENT->CANCELLED']);

    // Late capture: money arrived after cancellation.
    const captured = await ordersRepo.markOrderPaymentCaptured(tx!, { paymentId: payment.id, gatewayPaymentId: `pay_${newId().slice(0, 12)}` });
    expect(captured?.status).toBe('CAPTURED');
    expect(await ordersRepo.markOrderPaymentCaptured(tx!, { paymentId: payment.id, gatewayPaymentId: 'pay_other' })).toBeNull();
    expect(await ordersRepo.confirmPendingOrder(tx!, { orderId: order.id, actorUserId: null })).toBeNull();
    expect((await ordersRepo.markOrderRefundDue(tx!, order.id))?.paymentStatus).toBe('REFUND_DUE');
  });

  it('BR-214: a verified capture confirms the pending order; expired orders are listed for the sweep', async () => {
    if (!ready) return;
    const { cartId, items } = await lockedCart(ids.customer);
    const { order } = await ordersRepo.createOrder(tx!, orderParams(cartId, items, {
      paymentMethod: 'CARD', status: 'PENDING_PAYMENT', idempotencyKey: `idem-${newId()}`,
      paymentExpiresAt: new Date(Date.now() - 60_000),
    }));
    const gwOrderId = `order_test_${newId().slice(0, 12)}`;
    const payment = await ordersRepo.insertOrderPayment(tx!, { orderId: order.id, gatewayOrderId: gwOrderId, amount: '30.00' as Money, method: 'CARD' });

    const expired = await ordersRepo.listExpiredPendingPaymentOrders(tx!, 1000);
    expect(expired.find((e) => e.orderId === order.id)).toMatchObject({ customerId: ids.customer, gatewayOrderId: gwOrderId });

    expect(await ordersRepo.markOrderPaymentCaptured(tx!, { paymentId: payment.id, gatewayPaymentId: `pay_${newId().slice(0, 12)}`, signature: 'sig' }))
      .toMatchObject({ status: 'CAPTURED' });
    const confirmed = await ordersRepo.confirmPendingOrder(tx!, { orderId: order.id, actorUserId: ids.user });
    expect(confirmed).toMatchObject({ status: 'CONFIRMED', paymentStatus: 'PAID' });
    expect(await ordersRepo.confirmPendingOrder(tx!, { orderId: order.id, actorUserId: ids.user })).toBeNull();
    expect(await ordersRepo.markOrderRefundDue(tx!, order.id)).toBeNull();
    expect((await ordersRepo.listExpiredPendingPaymentOrders(tx!, 1000)).some((e) => e.orderId === order.id)).toBe(false);
  });
});
