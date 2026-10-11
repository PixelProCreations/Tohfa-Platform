/**
 * Tasks and alerts worklists.
 *
 * BR-77 = tasks and alerts are DERIVED live from existing records, for the caller's warehouse
 *         scope only; an item whose condition clears is not returned; an item outside the scope
 *         is 404; titles and messages are machine keys, never English.
 * BR-78 = what a user does to an item (done / dismiss / snooze) is that user's own state: it is
 *         isolated between users, validated, capped by system_config, not audited, and it ends
 *         when the underlying condition clears.
 *
 * Mocked-repo tests alone once let SQL on nonexistent columns ship, so there is no fake repo:
 *   1. pure schema tests (no I/O),
 *   2. `describeIfDatabase` tests that run EVERY repo query against a migrated Postgres inside a
 *      transaction that is rolled back,
 *   3. real HTTP through the real app router (committed fixtures, removed in afterAll).
 * A configured-but-unreachable database fails loudly instead of passing vacuously.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { Server } from 'node:http';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { insertCrop, insertPurchaseOrder, insertUser } from '../../test/dbFixtures.js';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import {
  ALERT_TYPES,
  alertItemKeyParam,
  isAnyItemKey,
  listAlertsQuery,
  listTasksQuery,
  snoozeAlertBody,
  TASK_TYPES,
  taskItemKeyParam,
  taskListResponse,
  alertListResponse,
  taskSummaryQuery,
} from './tasks-alerts.schema.js';
import { createTasksAlertsService, type TasksAlertsService } from './tasks-alerts.service.js';

const UUID_A = '10000000-0000-4000-8000-0000000000a1';
const UUID_B = '10000000-0000-4000-8000-0000000000b2';

// ===========================================================================
// 1. Schemas
// ===========================================================================
describe('tasks-alerts schemas', () => {
  it('BR-78e: accepts only the canonical item key of the right kind and rejects every other shape', () => {
    const good = {
      task: [
        `RETURN_INSPECTION:${UUID_A}`,
        `RETURN_APPROVAL:${UUID_A}`,
        `GOODS_RECEIPT_QC:${UUID_A}`,
        `ORDER_PACK:${UUID_A}`,
        `ORDER_DISPATCH:${UUID_A}`,
        `ORDER_PICKUP_OTP:${UUID_A}`,
      ],
      alert: [`BATCH_NEAR_EXPIRY:${UUID_A}`, `CAPACITY_NEAR_FULL:${UUID_A}`, `LOW_STOCK:${UUID_A}:${UUID_B}:GRADE_1`],
    };
    for (const itemKey of good.task) expect(taskItemKeyParam.safeParse({ itemKey }).success, itemKey).toBe(true);
    for (const itemKey of good.alert) expect(alertItemKeyParam.safeParse({ itemKey }).success, itemKey).toBe(true);

    // A task key on the alert endpoint and an alert key on the task endpoint are wrong-kind keys.
    for (const itemKey of good.task) expect(alertItemKeyParam.safeParse({ itemKey }).success, itemKey).toBe(false);
    for (const itemKey of good.alert) expect(taskItemKeyParam.safeParse({ itemKey }).success, itemKey).toBe(false);

    const bad = [
      '',
      'ORDER_PACK',
      'ORDER_PACK:',
      `ORDER_PACK:${UUID_A.toUpperCase()}`,
      `order_pack:${UUID_A}`,
      `ORDER_PACK:${UUID_A}:extra`,
      `ORDER_PACK:${UUID_A}:${UUID_B}:GRADE_1`,
      `ORDER_PACK: ${UUID_A}`,
      `ORDER_PACK:${UUID_A}\n`,
      `ORDER_PACK:not-a-uuid`,
      `UNKNOWN_TYPE:${UUID_A}`,
      `ORDER_PACK:${UUID_A}'; DROP TABLE users; --`,
      `ORDER_PACK:${'a'.repeat(300)}`,
      `ORDER_PACK:${UUID_A}%00`,
    ];
    for (const itemKey of bad) {
      expect(taskItemKeyParam.safeParse({ itemKey }).success, JSON.stringify(itemKey)).toBe(false);
      expect(alertItemKeyParam.safeParse({ itemKey }).success, JSON.stringify(itemKey)).toBe(false);
    }
    for (const itemKey of [`LOW_STOCK:${UUID_A}`, `LOW_STOCK:${UUID_A}:${UUID_B}`, `LOW_STOCK:${UUID_A}:${UUID_B}:grade_1`, `LOW_STOCK:${UUID_A}:${UUID_B}:${'G'.repeat(21)}`]) {
      expect(alertItemKeyParam.safeParse({ itemKey }).success, itemKey).toBe(false);
    }
    expect(taskItemKeyParam.safeParse({ itemKey: `ORDER_PACK:${UUID_A}`, extra: 1 }).success).toBe(false);
    expect(isAnyItemKey(`ORDER_PACK:${UUID_A}`)).toBe(true);
    expect(isAnyItemKey(`BATCH_NEAR_EXPIRY:${UUID_A}`)).toBe(true);
    expect(isAnyItemKey('nope')).toBe(false);
  });

  it('BR-77: list queries default to limit 20, cap at 100, are strict, and know every type', () => {
    expect(listTasksQuery.parse({}).limit).toBe(20);
    expect(listTasksQuery.parse({}).state).toBe('open');
    expect(listAlertsQuery.parse({}).state).toBe('active');
    for (const query of [listTasksQuery, listAlertsQuery]) {
      expect(query.safeParse({ limit: '0' }).success).toBe(false);
      expect(query.safeParse({ limit: '101' }).success).toBe(false);
      expect(query.safeParse({ limit: '100' }).success).toBe(true);
      expect(query.safeParse({ limit: '1.5' }).success).toBe(false);
      expect(query.safeParse({ warehouseId: 'nope' }).success).toBe(false);
      expect(query.safeParse({ cursor: '' }).success).toBe(false);
      expect(query.safeParse({ bogus: 'x' }).success).toBe(false);
    }
    for (const type of TASK_TYPES) expect(listTasksQuery.safeParse({ type }).success, type).toBe(true);
    for (const type of ALERT_TYPES) expect(listAlertsQuery.safeParse({ type }).success, type).toBe(true);
    expect(listTasksQuery.safeParse({ type: 'BATCH_NEAR_EXPIRY' }).success).toBe(false);
    expect(listAlertsQuery.safeParse({ type: 'ORDER_PACK' }).success).toBe(false);
    expect(listTasksQuery.safeParse({ state: 'snoozed' }).success).toBe(false);
    expect(listAlertsQuery.safeParse({ state: 'done' }).success).toBe(false);
    expect(taskSummaryQuery.safeParse({ type: 'ORDER_PACK' }).success).toBe(false);
  });

  it('BR-78f: the snooze body is one ISO instant and nothing else', () => {
    expect(snoozeAlertBody.safeParse({ until: '2031-01-01T10:00:00Z' }).success).toBe(true);
    expect(snoozeAlertBody.safeParse({ until: '2031-01-01T10:00:00+05:30' }).success).toBe(true);
    for (const body of [{}, { until: 'tomorrow' }, { until: '2031-01-01' }, { until: 1893500000 }, { until: '2031-01-01T10:00:00Z', hours: 1 }]) {
      expect(snoozeAlertBody.safeParse(body).success, JSON.stringify(body)).toBe(false);
    }
  });
});

// ===========================================================================
// 2. Real database, every query, inside a rolled-back transaction
// ===========================================================================
class RollbackFixture extends Error {}

const TASK_PERMISSION = 'task.own.view';
const ALERT_PERMISSION = 'alert.own.view';

describeIfDatabase('Tasks and alerts (PostgreSQL)', () => {
  beforeAll(async () => {
    const ready = await databaseReady('task_alert_states');
    expect(ready, 'DATABASE_URL is set but `task_alert_states` is not reachable: apply migration 0052').toBe(true);
  });

  // The pool is shared with the HTTP describe below, whose afterAll closes it.

  async function inRolledBackTx(fn: (tx: Executor) => Promise<void>): Promise<void> {
    const { withTransaction } = await import('../../db/pool.js');
    await withTransaction(async (tx) => {
      await fn(tx);
      throw new RollbackFixture();
    }).catch((error: unknown) => {
      if (!(error instanceof RollbackFixture)) throw error;
    });
  }

  const subOf = (userId: string, warehouseId: string, permission = TASK_PERMISSION): ResolvedScope =>
    aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission, userId });
  const mainOf = (userId: string, permission = TASK_PERMISSION): ResolvedScope =>
    aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [], permission, userId });

  function serviceOn(tx: Executor, now: () => Date = () => new Date()): TasksAlertsService {
    return createTasksAlertsService({ db: tx, now });
  }

  interface World {
    userA: string;
    userB: string;
    customerId: string;
    farmerId: string;
    purchaseOrderId: string;
    receivedBy: string;
    w1: string;
    w2: string;
  }

  async function insertWarehouse(tx: Executor, capacityKg: string | null = null): Promise<string> {
    const id = newId();
    await tx.query(`INSERT INTO warehouses (id, code, name, type, capacity_kg) VALUES ($1, $2, 'Worklist Test WH', 'SUB', $3)`, [
      id,
      `WH-WL-${id.slice(0, 8)}`,
      capacityKg,
    ]);
    return id;
  }

  async function seed(tx: Executor): Promise<World> {
    const userA = await insertUser(tx, 'ADMIN', 'Worklist Admin A');
    const userB = await insertUser(tx, 'ADMIN', 'Worklist Admin B');
    const customerUser = await insertUser(tx, 'CUSTOMER', 'Private Customer Name');
    const customer = await tx.query<{ id: string }>(`INSERT INTO customers (user_id, customer_code) VALUES ($1, $2) RETURNING id`, [
      customerUser,
      `CUST-WL-${customerUser.slice(0, 8)}`,
    ]);
    const po = await insertPurchaseOrder(tx);
    return {
      userA,
      userB,
      customerId: customer.rows[0]!.id,
      farmerId: po.farmerId,
      purchaseOrderId: po.purchaseOrderId,
      receivedBy: po.receivedBy,
      w1: await insertWarehouse(tx),
      w2: await insertWarehouse(tx),
    };
  }

  interface OrderSpec {
    warehouseId: string;
    status: string;
    fulfilment?: 'PICKUP' | 'DELIVERY';
    deliveryDate?: string | null;
  }
  async function insertOrder(tx: Executor, world: World, spec: OrderSpec): Promise<{ id: string; orderNumber: string }> {
    const fulfilment = spec.fulfilment ?? 'PICKUP';
    let addressId: string | null = null;
    if (fulfilment === 'DELIVERY') {
      const address = await tx.query<{ id: string }>(
        `INSERT INTO customer_addresses (customer_id, line1, city, pincode) VALUES ($1, '1 Test Road', 'Ooty', '643001') RETURNING id`,
        [world.customerId],
      );
      addressId = address.rows[0]!.id;
    }
    const orderNumber = `WL-${newId()}`;
    const result = await tx.query<{ id: string }>(
      `INSERT INTO orders (order_number, customer_id, warehouse_id, fulfilment_type, delivery_address_id, delivery_date, status)
       VALUES ($1, $2, $3, $4::fulfilment_type, $5, $6::date, $7::order_status) RETURNING id`,
      [orderNumber, world.customerId, spec.warehouseId, fulfilment, addressId, spec.deliveryDate ?? null, spec.status],
    );
    return { id: result.rows[0]!.id, orderNumber };
  }

  async function insertReturn(tx: Executor, world: World, warehouseId: string, status: string): Promise<{ id: string; orderNumber: string; createdAt: Date }> {
    const order = await insertOrder(tx, world, { warehouseId, status: 'DELIVERED' });
    const result = await tx.query<{ id: string; created_at: Date }>(
      `INSERT INTO return_requests (order_id, customer_id, status, reason) VALUES ($1, $2, $3::return_status, 'damaged') RETURNING id, created_at`,
      [order.id, world.customerId, status],
    );
    return { id: result.rows[0]!.id, orderNumber: order.orderNumber, createdAt: result.rows[0]!.created_at };
  }

  async function insertGoodsReceipt(
    tx: Executor,
    world: World,
    warehouseId: string,
    status: string,
    createdAt: string | null = null,
  ): Promise<{ id: string; grnNumber: string }> {
    const grnNumber = `GRN-WL-${newId()}`;
    const result = await tx.query<{ id: string }>(
      `INSERT INTO goods_receipts (grn_number, purchase_order_id, warehouse_id, farmer_id, status, gross_qty_kg, received_by, created_at)
       VALUES ($1, $2, $3, $4, $5::grn_status, 100, $6, COALESCE($7::timestamptz, now())) RETURNING id`,
      [grnNumber, world.purchaseOrderId, warehouseId, world.farmerId, status, world.receivedBy, createdAt],
    );
    return { id: result.rows[0]!.id, grnNumber };
  }

  interface BatchSpec {
    warehouseId: string;
    cropId: string;
    qty: string;
    grade?: string;
    status?: string;
    expiryOn?: string | null;
  }
  async function insertBatch(tx: Executor, world: World, spec: BatchSpec): Promise<{ id: string; batchCode: string }> {
    const id = newId();
    const batchCode = `B-WL-${id}`;
    await tx.query(
      `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, status, expiry_on)
       VALUES ($1, $2, $3, $4, $5::produce_grade, $6, $7, $7, $8, $9::date)`,
      [id, batchCode, spec.warehouseId, spec.cropId, spec.grade ?? 'GRADE_1', world.farmerId, spec.qty, spec.status ?? 'ACTIVE', spec.expiryOn ?? null],
    );
    return { id, batchCode };
  }

  const istToday = async (tx: Executor, offsetDays = 0): Promise<string> =>
    (await tx.query<{ d: string }>(`SELECT (((now() AT TIME ZONE 'Asia/Kolkata')::date) + $1::int)::text AS d`, [offsetDays])).rows[0]!.d;

  async function setConfig(tx: Executor, key: string, value: string | null): Promise<void> {
    if (value === null) await tx.query(`DELETE FROM system_config WHERE key = $1`, [key]);
    else await tx.query(`UPDATE system_config SET value = $2::jsonb WHERE key = $1`, [key, value]);
  }

  const tasksOf = (service: TasksAlertsService, scope: ResolvedScope, raw: Record<string, unknown> = {}) =>
    service.listTasks(scope, listTasksQuery.parse({ limit: '100', ...raw }));
  const alertsOf = (service: TasksAlertsService, scope: ResolvedScope, raw: Record<string, unknown> = {}) =>
    service.listAlerts(scope, listAlertsQuery.parse({ limit: '100', ...raw }));

  async function expectAppError(promise: Promise<unknown>, code: string): Promise<AppError> {
    const error = await promise.then(
      () => null,
      (e: unknown) => e,
    );
    expect(error, `expected AppError ${code}`).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(code);
    return error as AppError;
  }

  const stateRows = async (tx: Executor, userId: string) =>
    (await tx.query<{ kind: string; item_key: string; state: string; snoozed_until: Date | null }>(
      `SELECT kind, item_key, state, snoozed_until FROM task_alert_states WHERE user_id = $1 ORDER BY item_key`,
      [userId],
    )).rows;

  // ----- migration facts ----------------------------------------------------
  it('BR-78: migration 0052 creates task_alert_states with its checks, seeds the three config keys and is not append-only', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const key = `ORDER_PACK:${newId()}`;
      const fails = async (sql: string, params: unknown[]): Promise<void> => {
        await tx.query('SAVEPOINT attempt');
        await expect(tx.query(sql, params)).rejects.toThrow();
        await tx.query('ROLLBACK TO SAVEPOINT attempt');
      };
      const insert = `INSERT INTO task_alert_states (user_id, kind, item_key, state, snoozed_until) VALUES ($1, $2, $3, $4, $5)`;
      await fails(insert, [world.userA, 'TASK', key, 'DISMISSED', null]);
      await fails(insert, [world.userA, 'TASK', key, 'SNOOZED', new Date(Date.now() + 3600_000)]);
      await fails(insert, [world.userA, 'ALERT', key, 'DONE', null]);
      await fails(insert, [world.userA, 'ALERT', key, 'SNOOZED', null]);
      await fails(insert, [world.userA, 'ALERT', key, 'DISMISSED', new Date(Date.now() + 3600_000)]);
      await fails(insert, [world.userA, 'OTHER', key, 'DONE', null]);
      await fails(insert, [world.userA, 'TASK', '', 'DONE', null]);
      await fails(insert, [world.userA, 'TASK', 'x'.repeat(201), 'DONE', null]);
      await fails(insert, [newId(), 'TASK', key, 'DONE', null]); // user must exist

      await tx.query(insert, [world.userA, 'TASK', key, 'DONE', null]);
      await fails(insert, [world.userA, 'TASK', key, 'DONE', null]); // primary key
      // Not a ledger: the state may be changed and removed.
      await tx.query(`UPDATE task_alert_states SET updated_at = now() WHERE user_id = $1`, [world.userA]);
      expect((await tx.query(`DELETE FROM task_alert_states WHERE user_id = $1`, [world.userA])).rowCount).toBe(1);

      const config = await tx.query<{ key: string; value: unknown }>(
        `SELECT key, value FROM system_config WHERE key IN ('alert_batch_expiry_days', 'alert_capacity_utilization_percent', 'alert_snooze_max_hours') ORDER BY key`,
      );
      expect(config.rows).toEqual([
        { key: 'alert_batch_expiry_days', value: 7 },
        { key: 'alert_capacity_utilization_percent', value: 90 },
        { key: 'alert_snooze_max_hours', value: 168 },
      ]);
    });
  });

  // ----- BR-77: derivation per source ----------------------------------------
  it('BR-77a: a PENDING return is a RETURN_INSPECTION task and an INSPECTED one a RETURN_APPROVAL task, in the order warehouse; later states are not tasks', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const pending = await insertReturn(tx, world, world.w1, 'PENDING');
      const inspected = await insertReturn(tx, world, world.w1, 'INSPECTED');
      for (const status of ['APPROVED', 'REJECTED', 'REFUND_PENDING_BANK', 'REFUNDED']) await insertReturn(tx, world, world.w1, status);
      const service = serviceOn(tx);
      const sub = subOf(world.userA, world.w1);

      const { items } = await tasksOf(service, sub);
      expect(items.map((i) => [i.type, i.refId]).sort()).toEqual(
        [
          ['RETURN_INSPECTION', pending.id],
          ['RETURN_APPROVAL', inspected.id],
        ].sort(),
      );
      const inspection = items.find((i) => i.type === 'RETURN_INSPECTION')!;
      expect(inspection).toEqual({
        itemKey: `RETURN_INSPECTION:${pending.id}`,
        type: 'RETURN_INSPECTION',
        titleKey: 'task.return_inspection.title',
        refType: 'RETURN_REQUEST',
        refId: pending.id,
        warehouseId: world.w1,
        createdAt: pending.createdAt.toISOString(),
        dueOn: null,
        params: { orderNumber: pending.orderNumber },
        state: 'OPEN',
      });
      expect(items.find((i) => i.type === 'RETURN_APPROVAL')!.titleKey).toBe('task.return_approval.title');

      // The condition changes: the inspection task is gone and the same return is now an approval task.
      await tx.query(`UPDATE return_requests SET status = 'INSPECTED' WHERE id = $1`, [pending.id]);
      const after = await tasksOf(service, sub);
      expect(after.items.map((i) => i.itemKey).sort()).toEqual([`RETURN_APPROVAL:${pending.id}`, `RETURN_APPROVAL:${inspected.id}`].sort());
      await tx.query(`UPDATE return_requests SET status = 'APPROVED' WHERE id IN ($1, $2)`, [pending.id, inspected.id]);
      expect((await tasksOf(service, sub)).items).toEqual([]);
    });
  });

  it('BR-77b: a goods receipt AWAITING_QC is a GOODS_RECEIPT_QC task; once checked it is not', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const waiting = await insertGoodsReceipt(tx, world, world.w1, 'AWAITING_QC');
      for (const status of ['ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'COUNTER_OFFERED']) await insertGoodsReceipt(tx, world, world.w1, status);
      await insertGoodsReceipt(tx, world, world.w2, 'AWAITING_QC');
      const service = serviceOn(tx);

      const { items } = await tasksOf(service, subOf(world.userA, world.w1));
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        itemKey: `GOODS_RECEIPT_QC:${waiting.id}`,
        type: 'GOODS_RECEIPT_QC',
        titleKey: 'task.goods_receipt_qc.title',
        refType: 'GOODS_RECEIPT',
        refId: waiting.id,
        warehouseId: world.w1,
        dueOn: null,
        params: { grnNumber: waiting.grnNumber, grossQtyKg: '100.000' },
      });
      await tx.query(`UPDATE goods_receipts SET status = 'ACCEPTED' WHERE id = $1`, [waiting.id]);
      expect((await tasksOf(service, subOf(world.userA, world.w1))).items).toEqual([]);
    });
  });

  it('BR-77c: an order is a pack, dispatch or pickup-OTP task by its status, with the delivery date as dueOn; other statuses are not tasks', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const confirmed = await insertOrder(tx, world, { warehouseId: world.w1, status: 'CONFIRMED', fulfilment: 'DELIVERY', deliveryDate: '2031-05-05' });
      const packed = await insertOrder(tx, world, { warehouseId: world.w1, status: 'PACKED' });
      const ready = await insertOrder(tx, world, { warehouseId: world.w1, status: 'READY_FOR_PICKUP' });
      for (const status of ['PENDING_PAYMENT', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PICKED_UP', 'RETURNED']) {
        await insertOrder(tx, world, { warehouseId: world.w1, status });
      }
      await insertOrder(tx, world, { warehouseId: world.w2, status: 'CONFIRMED' });
      const service = serviceOn(tx);

      const { items } = await tasksOf(service, subOf(world.userA, world.w1));
      const byType = new Map(items.map((i) => [i.type, i]));
      expect(items).toHaveLength(3);
      expect(byType.get('ORDER_PACK')).toMatchObject({
        itemKey: `ORDER_PACK:${confirmed.id}`,
        titleKey: 'task.order_pack.title',
        refType: 'ORDER',
        refId: confirmed.id,
        dueOn: '2031-05-05',
        params: { orderNumber: confirmed.orderNumber, fulfilmentType: 'DELIVERY' },
      });
      expect(byType.get('ORDER_DISPATCH')).toMatchObject({ refId: packed.id, dueOn: null, params: { orderNumber: packed.orderNumber, fulfilmentType: 'PICKUP' } });
      expect(byType.get('ORDER_PICKUP_OTP')).toMatchObject({ refId: ready.id, titleKey: 'task.order_pickup_otp.title' });

      await tx.query(`UPDATE orders SET status = 'PACKED' WHERE id = $1`, [confirmed.id]);
      const moved = await tasksOf(service, subOf(world.userA, world.w1));
      expect(moved.items.map((i) => i.itemKey).sort()).toEqual([`ORDER_DISPATCH:${confirmed.id}`, `ORDER_DISPATCH:${packed.id}`, `ORDER_PICKUP_OTP:${ready.id}`].sort());
    });
  });

  it('BR-77d: an ACTIVE batch with stock expiring within alert_batch_expiry_days (past expiry included) is a BATCH_NEAR_EXPIRY alert; the horizon is system_config', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const crop = await insertCrop(tx);
      const spec = { warehouseId: world.w1, cropId: crop, qty: '10.000' };
      const past = await insertBatch(tx, world, { ...spec, expiryOn: await istToday(tx, -3) });
      const today = await insertBatch(tx, world, { ...spec, expiryOn: await istToday(tx, 0) });
      const edge = await insertBatch(tx, world, { ...spec, expiryOn: await istToday(tx, 7) });
      await insertBatch(tx, world, { ...spec, expiryOn: await istToday(tx, 8) }); // one day beyond the horizon
      await insertBatch(tx, world, { ...spec, expiryOn: null });
      await insertBatch(tx, world, { ...spec, qty: '0.000', expiryOn: await istToday(tx, 0) }); // nothing left
      for (const status of ['DEPLETED', 'EXPIRED', 'WRITTEN_OFF']) await insertBatch(tx, world, { ...spec, status, expiryOn: await istToday(tx, 0) });
      await insertBatch(tx, world, { warehouseId: world.w2, cropId: crop, qty: '10.000', expiryOn: await istToday(tx, 0) });
      const service = serviceOn(tx);
      const sub = subOf(world.userA, world.w1, ALERT_PERMISSION);
      const expiry = async () => (await alertsOf(service, sub, { type: 'BATCH_NEAR_EXPIRY' })).items;

      const items = await expiry();
      expect(items.map((i) => i.refId).sort()).toEqual([past.id, today.id, edge.id].sort());
      const pastItem = items.find((i) => i.refId === past.id)!;
      expect(pastItem).toMatchObject({
        itemKey: `BATCH_NEAR_EXPIRY:${past.id}`,
        type: 'BATCH_NEAR_EXPIRY',
        messageKey: 'alert.batch_near_expiry.message',
        refType: 'INVENTORY_BATCH',
        warehouseId: world.w1,
        state: 'ACTIVE',
        snoozedUntil: null,
        params: { batchCode: past.batchCode, expiryOn: await istToday(tx, -3), daysToExpiry: -3, qtyAvailableKg: '10.000' },
      });
      expect(pastItem.since).not.toBeNull();
      expect(new Date(pastItem.since!).getTime()).toBeLessThanOrEqual(Date.now());
      expect(items.find((i) => i.refId === edge.id)!.params).toMatchObject({ daysToExpiry: 7 });

      await setConfig(tx, 'alert_batch_expiry_days', '1');
      expect((await expiry()).map((i) => i.refId).sort()).toEqual([past.id, today.id].sort());
      await setConfig(tx, 'alert_batch_expiry_days', '0');
      expect((await expiry()).map((i) => i.refId).sort()).toEqual([past.id, today.id].sort());
      await setConfig(tx, 'alert_batch_expiry_days', '30');
      expect((await expiry())).toHaveLength(4);

      // Not a usable horizon: the alert type is not raised at all, no constant stands in for it.
      for (const bad of [null, '-1', '7.5', '"7"', 'null', '{"a":1}']) {
        await setConfig(tx, 'alert_batch_expiry_days', bad);
        expect(await expiry(), `config ${String(bad)}`).toEqual([]);
      }
    });
  });

  it('BR-77e: a warehouse+crop+grade whose ACTIVE stock sums below low_stock_threshold_kg is a LOW_STOCK alert; the threshold is system_config', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const [c1, c2, c3, c4] = [await insertCrop(tx), await insertCrop(tx), await insertCrop(tx), await insertCrop(tx)];
      const at = (cropId: string, qty: string, grade = 'GRADE_1', status = 'ACTIVE') => insertBatch(tx, world, { warehouseId: world.w1, cropId, qty, grade, status });
      await at(c1, '20.000');
      await at(c1, '25.000'); // 45 across two batches
      await at(c1, '50.000', 'GRADE_2'); // exactly the threshold: not low
      await at(c2, '49.999'); // just below
      await at(c3, '10.000', 'GRADE_1', 'DEPLETED'); // inactive stock does not count
      await at(c3, '100.000');
      await at(c4, '5.000', 'GRADE_1', 'EXPIRED'); // no ACTIVE stock at all: nothing to be low about
      await insertBatch(tx, world, { warehouseId: world.w2, cropId: c1, qty: '1.000' });
      const service = serviceOn(tx);
      const sub = subOf(world.userA, world.w1, ALERT_PERMISSION);
      const low = async () => (await alertsOf(service, sub, { type: 'LOW_STOCK' })).items;

      const items = await low();
      expect(items.map((i) => i.itemKey).sort()).toEqual([`LOW_STOCK:${world.w1}:${c1}:GRADE_1`, `LOW_STOCK:${world.w1}:${c2}:GRADE_1`].sort());
      expect(items.find((i) => i.itemKey.includes(c1))).toEqual({
        itemKey: `LOW_STOCK:${world.w1}:${c1}:GRADE_1`,
        type: 'LOW_STOCK',
        messageKey: 'alert.low_stock.message',
        refType: 'WAREHOUSE',
        refId: world.w1,
        warehouseId: world.w1,
        since: null,
        params: { cropId: c1, grade: 'GRADE_1', totalQtyKg: '45.000', thresholdKg: '50' },
        state: 'ACTIVE',
        snoozedUntil: null,
      });

      await setConfig(tx, 'low_stock_threshold_kg', '49.999'); // c2 sits exactly on it: not low
      expect((await low()).map((i) => [i.params['cropId'], i.params['thresholdKg']])).toEqual([[c1, '49.999']]);
      await setConfig(tx, 'low_stock_threshold_kg', '101');
      expect((await low())).toHaveLength(4);
      for (const bad of [null, '-1', '"50"', 'null']) {
        await setConfig(tx, 'low_stock_threshold_kg', bad);
        expect(await low(), `config ${String(bad)}`).toEqual([]);
      }
    });
  });

  it('BR-77f: a warehouse at or above alert_capacity_utilization_percent of its capacity is a CAPACITY_NEAR_FULL alert; no capacity, no alert', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const crop = await insertCrop(tx);
      const at90 = await insertWarehouse(tx, '1000.000');
      const below = await insertWarehouse(tx, '1000.000');
      const noCapacity = await insertWarehouse(tx, null);
      const over = await insertWarehouse(tx, '1000.000');
      await insertBatch(tx, world, { warehouseId: at90, cropId: crop, qty: '900.000' });
      await insertBatch(tx, world, { warehouseId: below, cropId: crop, qty: '899.999' });
      await insertBatch(tx, world, { warehouseId: noCapacity, cropId: crop, qty: '5000.000' });
      await insertBatch(tx, world, { warehouseId: over, cropId: crop, qty: '950.000' });
      await insertBatch(tx, world, { warehouseId: over, cropId: crop, qty: '500.000', status: 'DEPLETED' }); // not occupying space
      const service = serviceOn(tx);
      const main = mainOf(world.userA, ALERT_PERMISSION);
      const mine = new Set([at90, below, noCapacity, over]);
      const full = async () =>
        (await alertsOf(service, main, { type: 'CAPACITY_NEAR_FULL' })).items.filter((i) => mine.has(i.warehouseId));

      const items = await full();
      expect(items.map((i) => i.warehouseId).sort()).toEqual([at90, over].sort());
      expect(items.find((i) => i.warehouseId === at90)).toEqual({
        itemKey: `CAPACITY_NEAR_FULL:${at90}`,
        type: 'CAPACITY_NEAR_FULL',
        messageKey: 'alert.capacity_near_full.message',
        refType: 'WAREHOUSE',
        refId: at90,
        warehouseId: at90,
        since: null,
        params: { capacityKg: '1000.000', usedKg: '900.000', utilizationPercent: '90.00', thresholdPercent: '90' },
        state: 'ACTIVE',
        snoozedUntil: null,
      });
      expect(items.find((i) => i.warehouseId === over)!.params).toMatchObject({ usedKg: '950.000', utilizationPercent: '95.00' });

      await setConfig(tx, 'alert_capacity_utilization_percent', '95');
      expect((await full()).map((i) => i.warehouseId)).toEqual([over]);
      await setConfig(tx, 'alert_capacity_utilization_percent', '89.9');
      expect((await full()).map((i) => i.warehouseId).sort()).toEqual([at90, below, over].sort());
      for (const bad of [null, '-1', '101', '"90"', 'null']) {
        await setConfig(tx, 'alert_capacity_utilization_percent', bad);
        expect(await full(), `config ${String(bad)}`).toEqual([]);
      }
    });
  });

  // ----- BR-77: scope ----------------------------------------------------------
  it('BR-77g: a Sub admin sees only its own warehouse, Main sees every warehouse, and the warehouseId filter on another warehouse is 404', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const o1 = await insertOrder(tx, world, { warehouseId: world.w1, status: 'CONFIRMED' });
      const o2 = await insertOrder(tx, world, { warehouseId: world.w2, status: 'CONFIRMED' });
      const g2 = await insertGoodsReceipt(tx, world, world.w2, 'AWAITING_QC');
      const service = serviceOn(tx);

      expect((await tasksOf(service, subOf(world.userA, world.w1))).items.map((i) => i.refId)).toEqual([o1.id]);
      expect((await tasksOf(service, subOf(world.userA, world.w2))).items.map((i) => i.refId).sort()).toEqual([o2.id, g2.id].sort());

      const main = (await tasksOf(service, mainOf(world.userA))).items;
      for (const id of [o1.id, o2.id, g2.id]) expect(main.map((i) => i.refId)).toContain(id);

      // Filters: own warehouse, another's (404 for Sub, never an empty list that confirms nothing), type.
      expect((await tasksOf(service, subOf(world.userA, world.w1), { warehouseId: world.w1 })).items.map((i) => i.refId)).toEqual([o1.id]);
      await expectAppError(tasksOf(service, subOf(world.userA, world.w1), { warehouseId: world.w2 }), 'NOT_FOUND');
      await expectAppError(alertsOf(service, subOf(world.userA, world.w1, ALERT_PERMISSION), { warehouseId: world.w2 }), 'NOT_FOUND');
      await expectAppError(service.taskSummary(subOf(world.userA, world.w1), { warehouseId: world.w2 }), 'NOT_FOUND');
      expect((await tasksOf(service, mainOf(world.userA), { warehouseId: world.w2 })).items.map((i) => i.refId).sort()).toEqual([o2.id, g2.id].sort());
      expect((await tasksOf(service, mainOf(world.userA), { warehouseId: world.w2, type: 'GOODS_RECEIPT_QC' })).items.map((i) => i.refId)).toEqual([g2.id]);
      // A warehouse that does not exist is 404 for Main too.
      await expectAppError(tasksOf(service, mainOf(world.userA), { warehouseId: newId() }), 'NOT_FOUND');
    });
  });

  it('BR-77h: pagination is stable: newest first, ties broken by key, no row skipped or repeated, bad cursors are 422', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const stamps = ['2031-01-05T10:00:00Z', '2031-01-04T10:00:00Z', '2031-01-04T10:00:00Z', '2031-01-03T10:00:00Z', '2031-01-02T10:00:00Z'];
      const made = [];
      for (const stamp of stamps) made.push(await insertGoodsReceipt(tx, world, world.w1, 'AWAITING_QC', stamp));
      const service = serviceOn(tx);
      const sub = subOf(world.userA, world.w1);

      const seen: string[] = [];
      let cursor: string | undefined;
      const sizes: number[] = [];
      for (let guard = 0; guard < 10; guard += 1) {
        const page = await service.listTasks(sub, listTasksQuery.parse({ limit: '2', ...(cursor === undefined ? {} : { cursor }) }));
        sizes.push(page.items.length);
        seen.push(...page.items.map((i) => i.refId));
        expect(page.page.hasMore).toBe(page.page.nextCursor !== null);
        if (page.page.nextCursor === null) break;
        cursor = page.page.nextCursor;
      }
      expect(sizes).toEqual([2, 2, 1]);
      expect(new Set(seen).size).toBe(5);
      expect([...seen].sort()).toEqual(made.map((m) => m.id).sort());

      const all = (await tasksOf(service, sub)).items;
      expect(all.map((i) => i.createdAt)).toEqual([...all.map((i) => i.createdAt)].sort().reverse());
      const tied = all.filter((i) => i.createdAt === '2031-01-04T10:00:00.000Z').map((i) => i.itemKey);
      expect(tied).toEqual([...tied].sort().reverse());
      expect(seen).toEqual(all.map((i) => i.refId));

      for (const cursorValue of ['garbage', Buffer.from('{"a":1}').toString('base64url'), Buffer.from(JSON.stringify(['2031-01-01', 'x'])).toString('base64url')]) {
        await expectAppError(service.listTasks(sub, listTasksQuery.parse({ cursor: cursorValue })), 'VALIDATION_FAILED');
      }
      expect(taskListResponse.safeParse(await tasksOf(service, sub)).success).toBe(true);
    });
  });

  it('BR-77i: the summary counts open tasks per type (zero for the rest), leaves out tasks the caller marked done, and honours the warehouse filter', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const r1 = await insertReturn(tx, world, world.w1, 'PENDING');
      await insertReturn(tx, world, world.w1, 'PENDING');
      await insertGoodsReceipt(tx, world, world.w1, 'AWAITING_QC');
      await insertOrder(tx, world, { warehouseId: world.w1, status: 'CONFIRMED' });
      await insertOrder(tx, world, { warehouseId: world.w2, status: 'CONFIRMED' });
      const service = serviceOn(tx);
      const sub = subOf(world.userA, world.w1);

      const zero = Object.fromEntries(TASK_TYPES.map((t) => [t, 0]));
      expect(await service.taskSummary(sub, {})).toEqual({
        open: 4,
        byType: { ...zero, RETURN_INSPECTION: 2, GOODS_RECEIPT_QC: 1, ORDER_PACK: 1 },
      });
      await service.markTaskDone(sub, `RETURN_INSPECTION:${r1.id}`);
      expect(await service.taskSummary(sub, {})).toEqual({
        open: 3,
        byType: { ...zero, RETURN_INSPECTION: 1, GOODS_RECEIPT_QC: 1, ORDER_PACK: 1 },
      });
      // Another user's count is untouched by A's done mark.
      expect((await service.taskSummary(subOf(world.userB, world.w1), {})).open).toBe(4);
      expect(await service.taskSummary(mainOf(world.userA), { warehouseId: world.w2 })).toEqual({ open: 1, byType: { ...zero, ORDER_PACK: 1 } });
      expect((await service.taskSummary(mainOf(world.userA), {})).open).toBeGreaterThanOrEqual(4);
    });
  });

  it('BR-77j: acting on an item that is outside the scope, never derived, or whose condition has cleared is 404 and writes nothing', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const crop = await insertCrop(tx);
      const other = await insertOrder(tx, world, { warehouseId: world.w2, status: 'CONFIRMED' });
      const mine = await insertOrder(tx, world, { warehouseId: world.w1, status: 'CONFIRMED' });
      const otherBatch = await insertBatch(tx, world, { warehouseId: world.w2, cropId: crop, qty: '5.000', expiryOn: await istToday(tx, 0) });
      const myBatch = await insertBatch(tx, world, { warehouseId: world.w1, cropId: crop, qty: '5.000', expiryOn: await istToday(tx, 0) });
      const service = serviceOn(tx);
      const subTask = subOf(world.userA, world.w1);
      const subAlert = subOf(world.userA, world.w1, ALERT_PERMISSION);
      const until = new Date(Date.now() + 3600_000).toISOString();

      await expectAppError(service.markTaskDone(subTask, `ORDER_PACK:${other.id}`), 'NOT_FOUND'); // another warehouse's task
      await expectAppError(service.markTaskDone(subTask, `ORDER_PACK:${newId()}`), 'NOT_FOUND'); // never existed
      await expectAppError(service.markTaskDone(subTask, `ORDER_DISPATCH:${mine.id}`), 'NOT_FOUND'); // right order, wrong state: not a task
      await expectAppError(service.dismissAlert(subAlert, `BATCH_NEAR_EXPIRY:${otherBatch.id}`), 'NOT_FOUND');
      await expectAppError(service.snoozeAlert(subAlert, `BATCH_NEAR_EXPIRY:${otherBatch.id}`, { until }), 'NOT_FOUND');
      await expectAppError(service.dismissAlert(subAlert, `CAPACITY_NEAR_FULL:${world.w1}`), 'NOT_FOUND'); // no capacity: not raised
      expect(await stateRows(tx, world.userA)).toEqual([]);

      // The same answer for a key that was visible and then cleared.
      await tx.query(`UPDATE orders SET status = 'PACKED' WHERE id = $1`, [mine.id]);
      await expectAppError(service.markTaskDone(subTask, `ORDER_PACK:${mine.id}`), 'NOT_FOUND');
      await tx.query(`UPDATE inventory_batches SET qty_available = 0 WHERE id = $1`, [myBatch.id]);
      await expectAppError(service.dismissAlert(subAlert, `BATCH_NEAR_EXPIRY:${myBatch.id}`), 'NOT_FOUND');
      expect(await stateRows(tx, world.userA)).toEqual([]);

      // Main, whose scope covers the warehouse, can act on it.
      const done = await service.markTaskDone(mainOf(world.userA), `ORDER_PACK:${other.id}`);
      expect(done).toMatchObject({ itemKey: `ORDER_PACK:${other.id}`, state: 'DONE', snoozedUntil: null });
    });
  });

  it('BR-77k: responses are allow-listed machine data: no customer or farmer id, no user-facing English, keys that match the type', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const crop = await insertCrop(tx);
      await insertReturn(tx, world, world.w1, 'PENDING');
      await insertGoodsReceipt(tx, world, world.w1, 'AWAITING_QC');
      await insertOrder(tx, world, { warehouseId: world.w1, status: 'CONFIRMED' });
      await insertBatch(tx, world, { warehouseId: world.w1, cropId: crop, qty: '5.000', expiryOn: await istToday(tx, 1) });
      const service = serviceOn(tx);

      const tasks = await tasksOf(service, subOf(world.userA, world.w1));
      const alerts = await alertsOf(service, subOf(world.userA, world.w1, ALERT_PERMISSION));
      expect(tasks.items.length).toBeGreaterThanOrEqual(3);
      expect(alerts.items.length).toBeGreaterThanOrEqual(2);
      expect(taskListResponse.safeParse(tasks).success).toBe(true);
      expect(alertListResponse.safeParse(alerts).success).toBe(true);
      const wire = JSON.stringify([tasks, alerts]);
      for (const secret of [world.customerId, world.farmerId, 'Private Customer Name', 'customer_id', 'farmer_id']) expect(wire).not.toContain(secret);
      for (const task of tasks.items) {
        expect(task.titleKey).toBe(`task.${task.type.toLowerCase()}.title`);
        expect(task.itemKey.startsWith(`${task.type}:`)).toBe(true);
      }
      for (const alert of alerts.items) {
        expect(alert.messageKey).toBe(`alert.${alert.type.toLowerCase()}.message`);
        expect(alert.itemKey.startsWith(`${alert.type}:`)).toBe(true);
      }
    });
  });

  // ----- BR-78: per-user state --------------------------------------------------
  it('BR-78a: done hides a task from the open list and shows it in the done list; replays are idempotent', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const order = await insertOrder(tx, world, { warehouseId: world.w1, status: 'CONFIRMED' });
      const service = serviceOn(tx);
      const sub = subOf(world.userA, world.w1);
      const key = `ORDER_PACK:${order.id}`;

      const first = await service.markTaskDone(sub, key);
      expect(first).toMatchObject({ itemKey: key, state: 'DONE', snoozedUntil: null });
      expect(new Date(first.updatedAt).getTime()).toBeLessThanOrEqual(Date.now() + 1000);
      expect((await tasksOf(service, sub)).items).toEqual([]);
      const done = await tasksOf(service, sub, { state: 'done' });
      expect(done.items.map((i) => [i.itemKey, i.state])).toEqual([[key, 'DONE']]);

      const replay = await service.markTaskDone(sub, key);
      expect(replay).toMatchObject({ itemKey: key, state: 'DONE' });
      expect(await stateRows(tx, world.userA)).toEqual([{ kind: 'TASK', item_key: key, state: 'DONE', snoozed_until: null }]);
    });
  });

  it('BR-78a: dismiss hides an alert from both lists; snooze moves it to the snoozed list with its end time; the last action wins', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const crop = await insertCrop(tx);
      const batch = await insertBatch(tx, world, { warehouseId: world.w1, cropId: crop, qty: '5.000', expiryOn: await istToday(tx, 0) });
      const service = serviceOn(tx);
      const sub = subOf(world.userA, world.w1, ALERT_PERMISSION);
      const key = `BATCH_NEAR_EXPIRY:${batch.id}`;
      const until = new Date(Date.now() + 2 * 3600_000);
      const active = async () => (await alertsOf(service, sub, { type: 'BATCH_NEAR_EXPIRY' })).items.map((i) => i.itemKey);
      const snoozed = async () => (await alertsOf(service, sub, { type: 'BATCH_NEAR_EXPIRY', state: 'snoozed' })).items;

      expect(await active()).toEqual([key]);
      expect(await snoozed()).toEqual([]);

      const snooze = await service.snoozeAlert(sub, key, { until: until.toISOString() });
      expect(snooze).toMatchObject({ itemKey: key, state: 'SNOOZED', snoozedUntil: until.toISOString() });
      expect(await active()).toEqual([]);
      const list = await snoozed();
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({ itemKey: key, state: 'SNOOZED', snoozedUntil: until.toISOString() });

      const dismissed = await service.dismissAlert(sub, key);
      expect(dismissed).toMatchObject({ itemKey: key, state: 'DISMISSED', snoozedUntil: null });
      expect(await active()).toEqual([]);
      expect(await snoozed()).toEqual([]);
      expect(await service.dismissAlert(sub, key)).toMatchObject({ state: 'DISMISSED' }); // replay

      const again = await service.snoozeAlert(sub, key, { until: until.toISOString() });
      expect(again.state).toBe('SNOOZED');
      expect(await stateRows(tx, world.userA)).toEqual([{ kind: 'ALERT', item_key: key, state: 'SNOOZED', snoozed_until: until }]);
    });
  });

  it('BR-78b: a snooze that has ended no longer hides the alert', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const crop = await insertCrop(tx);
      const batch = await insertBatch(tx, world, { warehouseId: world.w1, cropId: crop, qty: '5.000', expiryOn: await istToday(tx, 0) });
      const service = serviceOn(tx);
      const sub = subOf(world.userA, world.w1, ALERT_PERMISSION);
      const key = `BATCH_NEAR_EXPIRY:${batch.id}`;
      await service.snoozeAlert(sub, key, { until: new Date(Date.now() + 3600_000).toISOString() });
      expect((await alertsOf(service, sub, { type: 'BATCH_NEAR_EXPIRY' })).items).toEqual([]);

      // Time passes: the API cannot write a snooze in the past, so move the stored end time back.
      await tx.query(`UPDATE task_alert_states SET snoozed_until = now() - interval '1 second' WHERE user_id = $1`, [world.userA]);
      const back = await alertsOf(service, sub, { type: 'BATCH_NEAR_EXPIRY' });
      expect(back.items.map((i) => [i.itemKey, i.state, i.snoozedUntil])).toEqual([[key, 'ACTIVE', null]]);
      expect((await alertsOf(service, sub, { type: 'BATCH_NEAR_EXPIRY', state: 'snoozed' })).items).toEqual([]);
      // One moment before the end it is still snoozed.
      await tx.query(`UPDATE task_alert_states SET snoozed_until = now() + interval '1 minute' WHERE user_id = $1`, [world.userA]);
      expect((await alertsOf(service, sub, { type: 'BATCH_NEAR_EXPIRY' })).items).toEqual([]);
    });
  });

  it('BR-78c: when the condition clears the state is forgotten, so a condition that comes back starts un-dismissed', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const crop = await insertCrop(tx);
      await insertBatch(tx, world, { warehouseId: world.w1, cropId: crop, qty: '10.000' });
      const order = await insertOrder(tx, world, { warehouseId: world.w1, status: 'CONFIRMED' });
      const service = serviceOn(tx);
      const alertScope = subOf(world.userA, world.w1, ALERT_PERMISSION);
      const taskScope = subOf(world.userA, world.w1);
      const lowKey = `LOW_STOCK:${world.w1}:${crop}:GRADE_1`;
      const orderKey = `ORDER_PACK:${order.id}`;

      await service.dismissAlert(alertScope, lowKey);
      await service.markTaskDone(taskScope, orderKey);
      expect((await alertsOf(service, alertScope, { type: 'LOW_STOCK' })).items).toEqual([]);
      expect((await stateRows(tx, world.userA)).map((r) => r.item_key).sort()).toEqual([lowKey, orderKey].sort());

      // Restocked above the threshold and the order moved on.
      await insertBatch(tx, world, { warehouseId: world.w1, cropId: crop, qty: '100.000' });
      await tx.query(`UPDATE orders SET status = 'PACKED' WHERE id = $1`, [order.id]);
      expect((await alertsOf(service, alertScope, { type: 'LOW_STOCK' })).items).toEqual([]);
      expect((await tasksOf(service, taskScope)).items.map((i) => i.itemKey)).toEqual([`ORDER_DISPATCH:${order.id}`]);
      expect(await stateRows(tx, world.userA)).toEqual([]);

      // Low again: the alert is back, not still dismissed. The order is back to CONFIRMED: open again.
      await tx.query(`UPDATE inventory_batches SET qty_available = 1 WHERE warehouse_id = $1 AND qty_available > 50`, [world.w1]);
      await tx.query(`UPDATE orders SET status = 'CONFIRMED' WHERE id = $1`, [order.id]);
      const low = await alertsOf(service, alertScope, { type: 'LOW_STOCK' });
      expect(low.items.map((i) => [i.itemKey, i.state])).toEqual([[lowKey, 'ACTIVE']]);
      expect((await tasksOf(service, taskScope)).items.map((i) => i.itemKey)).toEqual([orderKey]);
    });
  });

  it('BR-78c: forgetting is per user and only for that user\'s own cleared items; a filtered list still forgets, and another user\'s state is untouched', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const order = await insertOrder(tx, world, { warehouseId: world.w1, status: 'CONFIRMED' });
      const service = serviceOn(tx);
      const a = subOf(world.userA, world.w1);
      const b = subOf(world.userB, world.w1);
      const key = `ORDER_PACK:${order.id}`;
      await service.markTaskDone(a, key);
      await service.markTaskDone(b, key);
      await tx.query(`UPDATE orders SET status = 'PACKED' WHERE id = $1`, [order.id]);

      // Only A lists, and only through a type filter that does not even include the cleared type.
      await tasksOf(service, a, { type: 'GOODS_RECEIPT_QC' });
      expect(await stateRows(tx, world.userA)).toEqual([]);
      expect((await stateRows(tx, world.userB)).map((r) => r.item_key)).toEqual([key]);
    });
  });

  it('BR-78d: one user\'s done, dismiss and snooze never touch another user\'s list', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const crop = await insertCrop(tx);
      const order = await insertOrder(tx, world, { warehouseId: world.w1, status: 'CONFIRMED' });
      const batch = await insertBatch(tx, world, { warehouseId: world.w1, cropId: crop, qty: '5.000', expiryOn: await istToday(tx, 0) });
      const service = serviceOn(tx);
      const tasksA = subOf(world.userA, world.w1);
      const tasksB = subOf(world.userB, world.w1);
      const alertsA = subOf(world.userA, world.w1, ALERT_PERMISSION);
      const alertsB = subOf(world.userB, world.w1, ALERT_PERMISSION);
      const taskKey = `ORDER_PACK:${order.id}`;
      const alertKey = `BATCH_NEAR_EXPIRY:${batch.id}`;
      const expiryKeys = async (scope: ResolvedScope, state?: string) =>
        (await alertsOf(service, scope, { type: 'BATCH_NEAR_EXPIRY', ...(state === undefined ? {} : { state }) })).items.map((i) => i.itemKey);

      await service.markTaskDone(tasksA, taskKey);
      await service.dismissAlert(alertsA, alertKey);
      expect((await tasksOf(service, tasksA)).items).toEqual([]);
      expect((await tasksOf(service, tasksB)).items.map((i) => i.itemKey)).toEqual([taskKey]);
      expect((await tasksOf(service, tasksB, { state: 'done' })).items).toEqual([]);
      expect(await expiryKeys(alertsA)).toEqual([]);
      expect(await expiryKeys(alertsB)).toEqual([alertKey]);

      // B snoozes: that neither revives nor changes A's dismissal.
      const until = new Date(Date.now() + 3600_000);
      await service.snoozeAlert(alertsB, alertKey, { until: until.toISOString() });
      expect(await expiryKeys(alertsB)).toEqual([]);
      expect(await expiryKeys(alertsB, 'snoozed')).toEqual([alertKey]);
      expect(await expiryKeys(alertsA)).toEqual([]);
      expect(await expiryKeys(alertsA, 'snoozed')).toEqual([]);

      expect(await stateRows(tx, world.userA)).toEqual([
        { kind: 'ALERT', item_key: alertKey, state: 'DISMISSED', snoozed_until: null },
        { kind: 'TASK', item_key: taskKey, state: 'DONE', snoozed_until: null },
      ]);
      expect(await stateRows(tx, world.userB)).toEqual([{ kind: 'ALERT', item_key: alertKey, state: 'SNOOZED', snoozed_until: until }]);
    });
  });

  it('BR-78d: a task key and an alert key never share state, and the user id comes from the scope, never the request', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const order = await insertOrder(tx, world, { warehouseId: world.w1, status: 'CONFIRMED' });
      const service = serviceOn(tx);
      const sub = subOf(world.userA, world.w1);
      await service.markTaskDone(sub, `ORDER_PACK:${order.id}`);
      expect((await stateRows(tx, world.userA)).map((r) => r.kind)).toEqual(['TASK']);
      expect(await stateRows(tx, world.userB)).toEqual([]);
    });
  });

  it('BR-78f: a snooze must end in the future and no later than alert_snooze_max_hours from now; the cap is system_config, 168 when missing or unusable', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const crop = await insertCrop(tx);
      const batch = await insertBatch(tx, world, { warehouseId: world.w1, cropId: crop, qty: '5.000', expiryOn: await istToday(tx, 0) });
      const fixedNow = new Date('2031-06-01T10:00:00.000Z');
      const service = serviceOn(tx, () => fixedNow);
      const sub = subOf(world.userA, world.w1, ALERT_PERMISSION);
      const key = `BATCH_NEAR_EXPIRY:${batch.id}`;
      const at = (ms: number): { until: string } => ({ until: new Date(fixedNow.getTime() + ms).toISOString() });
      const hour = 3600_000;

      const rejected = async (body: { until: string }): Promise<AppError> => {
        const error = await expectAppError(service.snoozeAlert(sub, key, body), 'VALIDATION_FAILED');
        expect(Object.keys((error.errors ?? {}) as Record<string, unknown>)).toEqual(['body.until']);
        return error;
      };
      await rejected(at(-hour)); // in the past
      await rejected(at(0)); // not in the future
      await rejected(at(168 * hour + 1000)); // one second past the default cap
      expect(await stateRows(tx, world.userA)).toEqual([]);
      expect((await service.snoozeAlert(sub, key, at(1000))).state).toBe('SNOOZED'); // one second ahead
      expect((await service.snoozeAlert(sub, key, at(168 * hour))).snoozedUntil).toBe(at(168 * hour).until); // exactly the cap

      await setConfig(tx, 'alert_snooze_max_hours', '2');
      await rejected(at(2 * hour + 1000));
      expect((await service.snoozeAlert(sub, key, at(2 * hour))).state).toBe('SNOOZED');
      await setConfig(tx, 'alert_snooze_max_hours', '720');
      expect((await service.snoozeAlert(sub, key, at(720 * hour))).state).toBe('SNOOZED');
      for (const bad of [null, '0', '-5', '1.5', '"168"', 'null']) {
        await setConfig(tx, 'alert_snooze_max_hours', bad);
        expect((await service.snoozeAlert(sub, key, at(168 * hour))).state, `config ${String(bad)}`).toBe('SNOOZED');
        await rejected(at(168 * hour + 1000));
      }
    });
  });

  it('BR-78g: dismiss, snooze and done write no audit_log row (own list preference, like marking a message read)', async () => {
    await inRolledBackTx(async (tx) => {
      const world = await seed(tx);
      const crop = await insertCrop(tx);
      const order = await insertOrder(tx, world, { warehouseId: world.w1, status: 'CONFIRMED' });
      const batch = await insertBatch(tx, world, { warehouseId: world.w1, cropId: crop, qty: '5.000', expiryOn: await istToday(tx, 0) });
      const service = serviceOn(tx);
      const auditCount = async (): Promise<number> =>
        Number((await tx.query<{ n: string }>(`SELECT count(*) AS n FROM audit_log WHERE actor_id = $1`, [world.userA])).rows[0]!.n);

      expect(await auditCount()).toBe(0);
      await service.markTaskDone(subOf(world.userA, world.w1), `ORDER_PACK:${order.id}`);
      const alertScope = subOf(world.userA, world.w1, ALERT_PERMISSION);
      await service.snoozeAlert(alertScope, `BATCH_NEAR_EXPIRY:${batch.id}`, { until: new Date(Date.now() + 3600_000).toISOString() });
      await service.dismissAlert(alertScope, `BATCH_NEAR_EXPIRY:${batch.id}`);
      expect(await stateRows(tx, world.userA)).toHaveLength(2);
      expect(await auditCount()).toBe(0);
    });
  });
});

// ===========================================================================
// 3. Real HTTP through the real app router
// ===========================================================================
describeIfDatabase('Tasks and alerts routes (real app router, PostgreSQL)', () => {
  let app: Express;
  let server: Server;
  const tokens: Record<string, string> = {};
  const created = {
    users: [] as string[],
    farmerUsers: [] as string[],
    farmers: [] as string[],
    warehouses: [] as string[],
    crops: [] as string[],
    receipts: [] as string[],
    batches: [] as string[],
    purchaseOrders: [] as string[],
    listings: [] as string[],
    fairPrices: [] as string[],
  };
  let h1 = '';
  let h2 = '';
  let receiptH1 = '';
  let receiptH2 = '';
  let batchH1 = '';
  let batchH2 = '';
  let userA = '';
  let userB = '';

  beforeAll(async () => {
    const ready = await databaseReady('task_alert_states');
    expect(ready, 'DATABASE_URL is set but `task_alert_states` is not reachable: apply migration 0052').toBe(true);
    const [{ createApp }, { signAccessToken }, { pool }] = await Promise.all([
      import('../../app.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
    ]);
    app = createApp();
    server = app.listen(0);

    userA = await insertUser(pool, 'ADMIN', 'HTTP Worklist A');
    userB = await insertUser(pool, 'ADMIN', 'HTTP Worklist B');
    created.users.push(userA, userB);
    for (const name of ['H1', 'H2']) {
      const id = newId();
      await pool.query(`INSERT INTO warehouses (id, code, name, type) VALUES ($1, $2, $3, 'SUB')`, [id, `WH-HW-${id.slice(0, 8)}`, `HTTP ${name}`]);
      created.warehouses.push(id);
      if (name === 'H1') h1 = id;
      else h2 = id;
    }
    // Orders cannot be fixtures here: DELETE on orders trips the append-only order_status_history
    // trigger through its cascade, so a committed order could never be removed. A goods receipt
    // (a QC task) and a batch (alerts) can.
    const po = await insertPurchaseOrder(pool);
    created.farmers.push(po.farmerId);
    created.purchaseOrders.push(po.purchaseOrderId);
    created.warehouses.push(po.warehouseId);
    created.users.push(po.issuedBy);
    const poRow = await pool.query<{ listing_id: string; crop_id: string; fair_price_id: string }>(
      `SELECT po.listing_id, po.crop_id, l.fair_price_id FROM purchase_orders po JOIN produce_listings l ON l.id = po.listing_id WHERE po.id = $1`,
      [po.purchaseOrderId],
    );
    created.listings.push(poRow.rows[0]!.listing_id);
    created.crops.push(poRow.rows[0]!.crop_id);
    created.fairPrices.push(poRow.rows[0]!.fair_price_id);
    const farmerUser = await pool.query<{ user_id: string }>(`SELECT user_id FROM farmers WHERE id = $1`, [po.farmerId]);
    created.farmerUsers.push(farmerUser.rows[0]!.user_id);

    const mkReceipt = async (warehouseId: string): Promise<string> => {
      const r = await pool.query<{ id: string }>(
        `INSERT INTO goods_receipts (grn_number, purchase_order_id, warehouse_id, farmer_id, status, gross_qty_kg, received_by)
         VALUES ($1, $2, $3, $4, 'AWAITING_QC', 100, $5) RETURNING id`,
        [`GRN-HW-${newId()}`, po.purchaseOrderId, warehouseId, po.farmerId, po.receivedBy],
      );
      created.receipts.push(r.rows[0]!.id);
      return r.rows[0]!.id;
    };
    receiptH1 = await mkReceipt(h1);
    receiptH2 = await mkReceipt(h2);
    const crop = await insertCrop(pool);
    created.crops.push(crop);
    const mkBatch = async (warehouseId: string): Promise<string> => {
      const id = newId();
      await pool.query(
        `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, status, expiry_on)
         VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 5, 5, 'ACTIVE', (now() AT TIME ZONE 'Asia/Kolkata')::date)`,
        [id, `B-HW-${id}`, warehouseId, crop, po.farmerId],
      );
      created.batches.push(id);
      return id;
    };
    batchH1 = await mkBatch(h1);
    batchH2 = await mkBatch(h2);

    const base = { farmerId: null, customerId: null };
    tokens['subH1'] = signAccessToken({ sub: userA, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: h1 }], ...base });
    tokens['subH2'] = signAccessToken({ sub: userB, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: h2 }], ...base });
    tokens['main'] = signAccessToken({ sub: userB, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], ...base });
    tokens['superAdmin'] = signAccessToken({ sub: userA, roles: [{ code: RoleCode.SUPER_ADMIN }], ...base });
    tokens['farmer'] = signAccessToken({ sub: userA, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null });
    tokens['customer'] = signAccessToken({ sub: userA, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() });
    tokens['farmerAdmin'] = signAccessToken({ sub: userA, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base });
  });

  afterAll(async () => {
    const [{ pool, closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    const del = (sql: string, ids: string[]): Promise<unknown> => (ids.length === 0 ? Promise.resolve() : pool.query(sql, [ids]));
    await del(`DELETE FROM task_alert_states WHERE user_id = ANY($1::uuid[])`, created.users);
    await del(`DELETE FROM inventory_batches WHERE id = ANY($1::uuid[])`, created.batches);
    await del(`DELETE FROM goods_receipts WHERE id = ANY($1::uuid[])`, created.receipts);
    await del(`DELETE FROM purchase_orders WHERE id = ANY($1::uuid[])`, created.purchaseOrders);
    await del(`DELETE FROM produce_listings WHERE id = ANY($1::uuid[])`, created.listings);
    await del(`DELETE FROM fair_prices WHERE id = ANY($1::uuid[])`, created.fairPrices);
    await del(`DELETE FROM plots WHERE farm_id IN (SELECT id FROM farms WHERE farmer_id = ANY($1::uuid[]))`, created.farmers);
    await del(`DELETE FROM farms WHERE farmer_id = ANY($1::uuid[])`, created.farmers);
    await del(`DELETE FROM farmers WHERE id = ANY($1::uuid[])`, created.farmers);
    await del(`DELETE FROM crop_master WHERE id = ANY($1::uuid[])`, created.crops);
    await del(`DELETE FROM warehouses WHERE id = ANY($1::uuid[])`, created.warehouses);
    await del(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [...created.users, ...created.farmerUsers]);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  const auth = (name: string): string => `Bearer ${tokens[name]!}`;
  const any = '99999999-9999-4999-8999-999999999999';

  const ROUTES: Array<{ method: 'get' | 'post'; path: string; body?: Record<string, unknown> }> = [
    { method: 'get', path: '/v1/admin/tasks' },
    { method: 'get', path: '/v1/admin/tasks/summary' },
    { method: 'post', path: `/v1/admin/tasks/ORDER_PACK:${any}/done` },
    { method: 'get', path: '/v1/admin/alerts' },
    { method: 'post', path: `/v1/admin/alerts/BATCH_NEAR_EXPIRY:${any}/dismiss` },
    { method: 'post', path: `/v1/admin/alerts/BATCH_NEAR_EXPIRY:${any}/snooze`, body: { until: '2031-01-01T00:00:00Z' } },
  ];

  it('BR-77l (HTTP): every route is 401 without a token and 403 problem+json for FARMER, CUSTOMER and FARMER_ADMIN', async () => {
    for (const { method, path, body } of ROUTES) {
      const anonymous = await request(server)[method](path).send(body);
      expect(anonymous.status, `${method} ${path} anonymous`).toBe(401);
      for (const role of ['farmer', 'customer', 'farmerAdmin']) {
        const res = await request(server)[method](path).set('Authorization', auth(role)).send(body);
        expect(res.status, `${method} ${path} as ${role}: ${JSON.stringify(res.body)}`).toBe(403);
        expect(res.headers['content-type']).toContain('application/problem+json');
      }
    }
  });

  it('BR-77g (HTTP): a Sub admin sees only its warehouse and is 404 for another, Main and Super Admin see both, filters validate', async () => {
    const own = await request(server).get('/v1/admin/tasks').set('Authorization', auth('subH1'));
    expect(own.status, JSON.stringify(own.body)).toBe(200);
    expect(own.body.items.map((i: { refId: string }) => i.refId)).toEqual([receiptH1]);
    expect(own.body.items[0]).toMatchObject({ itemKey: `GOODS_RECEIPT_QC:${receiptH1}`, titleKey: 'task.goods_receipt_qc.title', warehouseId: h1, state: 'OPEN' });
    expect(own.body.page).toEqual({ nextCursor: null, hasMore: false });

    const cross = await request(server).get('/v1/admin/tasks').query({ warehouseId: h2 }).set('Authorization', auth('subH1'));
    expect(cross.status).toBe(404);
    expect(cross.headers['content-type']).toContain('application/problem+json');
    for (const path of ['/v1/admin/alerts', '/v1/admin/tasks/summary']) {
      expect((await request(server).get(path).query({ warehouseId: h2 }).set('Authorization', auth('subH1'))).status, path).toBe(404);
    }
    for (const role of ['main', 'superAdmin']) {
      const res = await request(server).get('/v1/admin/tasks').query({ warehouseId: h2 }).set('Authorization', auth(role));
      expect(res.status).toBe(200);
      expect(res.body.items.map((i: { refId: string }) => i.refId)).toEqual([receiptH2]);
    }
    expect((await request(server).get('/v1/admin/tasks').query({ warehouseId: newId() }).set('Authorization', auth('main'))).status).toBe(404);

    const summary = await request(server).get('/v1/admin/tasks/summary').set('Authorization', auth('subH1'));
    expect(summary.status).toBe(200);
    expect(summary.body.open).toBe(1);
    expect(summary.body.byType.GOODS_RECEIPT_QC).toBe(1);
    expect(Object.keys(summary.body.byType).sort()).toEqual([...TASK_TYPES].sort());

    for (const query of [{ limit: '0' }, { limit: '101' }, { type: 'NOPE' }, { cursor: 'garbage' }, { warehouseId: 'x' }, { bogus: '1' }, { state: 'snoozed' }]) {
      const res = await request(server).get('/v1/admin/tasks').query(query).set('Authorization', auth('main'));
      expect(res.status, JSON.stringify(query)).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    }
    expect((await request(server).get('/v1/admin/alerts').query({ type: 'ORDER_PACK' }).set('Authorization', auth('main'))).status).toBe(422);
  });

  it('BR-78a/BR-78d (HTTP): done, dismiss and snooze answer with the caller\'s own state, are isolated between users and 404 outside the scope', async () => {
    const taskKey = `GOODS_RECEIPT_QC:${receiptH1}`;
    const alertKey = `BATCH_NEAR_EXPIRY:${batchH1}`;

    // Wrong shape: 422 before anything else. Out of scope or unknown: 404, same body shape.
    for (const path of [`/v1/admin/tasks/not-a-key/done`, `/v1/admin/tasks/BATCH_NEAR_EXPIRY:${batchH1}/done`, `/v1/admin/alerts/${taskKey}/dismiss`]) {
      const res = await request(server).post(path).set('Authorization', auth('subH1'));
      expect(res.status, path).toBe(422);
    }
    expect((await request(server).post(`/v1/admin/tasks/GOODS_RECEIPT_QC:${receiptH2}/done`).set('Authorization', auth('subH1'))).status).toBe(404);
    expect((await request(server).post(`/v1/admin/tasks/ORDER_PACK:${any}/done`).set('Authorization', auth('subH1'))).status).toBe(404);
    expect((await request(server).post(`/v1/admin/alerts/BATCH_NEAR_EXPIRY:${batchH2}/dismiss`).set('Authorization', auth('subH1'))).status).toBe(404);

    const done = await request(server).post(`/v1/admin/tasks/${taskKey}/done`).set('Authorization', auth('subH1'));
    expect(done.status, JSON.stringify(done.body)).toBe(200);
    expect(done.body).toMatchObject({ itemKey: taskKey, state: 'DONE', snoozedUntil: null });
    expect((await request(server).post(`/v1/admin/tasks/${taskKey}/done`).set('Authorization', auth('subH1'))).status).toBe(200);
    const openA = await request(server).get('/v1/admin/tasks').set('Authorization', auth('subH1'));
    expect(openA.body.items).toEqual([]);
    const doneA = await request(server).get('/v1/admin/tasks').query({ state: 'done' }).set('Authorization', auth('subH1'));
    expect(doneA.body.items.map((i: { itemKey: string }) => i.itemKey)).toEqual([taskKey]);
    // User B (Main) still has the task open.
    const openB = await request(server).get('/v1/admin/tasks').query({ warehouseId: h1 }).set('Authorization', auth('main'));
    expect(openB.body.items.map((i: { itemKey: string }) => i.itemKey)).toEqual([taskKey]);

    const alertsBefore = await request(server).get('/v1/admin/alerts').query({ type: 'BATCH_NEAR_EXPIRY' }).set('Authorization', auth('subH1'));
    expect(alertsBefore.status).toBe(200);
    expect(alertsBefore.body.items.map((i: { itemKey: string }) => i.itemKey)).toEqual([alertKey]);

    const snoozeUntil = new Date(Date.now() + 3600_000).toISOString();
    const snooze = await request(server).post(`/v1/admin/alerts/${alertKey}/snooze`).set('Authorization', auth('subH1')).send({ until: snoozeUntil });
    expect(snooze.status, JSON.stringify(snooze.body)).toBe(200);
    expect(snooze.body).toMatchObject({ itemKey: alertKey, state: 'SNOOZED', snoozedUntil: snoozeUntil });
    const snoozedList = await request(server).get('/v1/admin/alerts').query({ state: 'snoozed' }).set('Authorization', auth('subH1'));
    expect(snoozedList.body.items.map((i: { itemKey: string; snoozedUntil: string }) => [i.itemKey, i.snoozedUntil])).toEqual([[alertKey, snoozeUntil]]);
    const activeList = await request(server).get('/v1/admin/alerts').query({ type: 'BATCH_NEAR_EXPIRY' }).set('Authorization', auth('subH1'));
    expect(activeList.body.items).toEqual([]);

    const dismiss = await request(server).post(`/v1/admin/alerts/${alertKey}/dismiss`).set('Authorization', auth('subH1'));
    expect(dismiss.status).toBe(200);
    expect(dismiss.body).toMatchObject({ itemKey: alertKey, state: 'DISMISSED', snoozedUntil: null });
    const stillB = await request(server).get('/v1/admin/alerts').query({ type: 'BATCH_NEAR_EXPIRY', warehouseId: h1 }).set('Authorization', auth('main'));
    expect(stillB.body.items.map((i: { itemKey: string }) => i.itemKey)).toEqual([alertKey]);
  });

  it('BR-78f (HTTP): snooze needs a body with a future time inside the configured cap, otherwise 422 on body.until', async () => {
    const alertKey = `BATCH_NEAR_EXPIRY:${batchH2}`;
    const post = (body: unknown) => request(server).post(`/v1/admin/alerts/${alertKey}/snooze`).set('Authorization', auth('subH2')).send(body as object);
    const ms = (n: number): string => new Date(Date.now() + n).toISOString();

    expect((await post({})).status).toBe(422);
    expect((await post({ until: 'tomorrow' })).status).toBe(422);
    expect((await post({ until: ms(3600_000), extra: 1 })).status).toBe(422);
    for (const until of [ms(-3600_000), ms(169 * 3600_000), ms(100 * 24 * 3600_000)]) {
      const res = await post({ until });
      expect(res.status, until).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
      expect(Object.keys(res.body.errors)).toEqual(['body.until']);
    }
    const ok = await post({ until: ms(167 * 3600_000) });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    expect(ok.body.state).toBe('SNOOZED');
  });
});
