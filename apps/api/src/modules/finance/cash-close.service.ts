/**
 * Module 11 (Warehouse Finance), BR-74: the daily cash summary and close.
 *
 * For one warehouse and one Asia/Kolkata day the system COMPUTES, from existing data:
 *   cash sales    completed, paid CASH orders (the BR-63 revenue definition, restricted to CASH)
 *   cash top-ups  successful CASH wallet top-ups processed at the warehouse (the design lists them as cash in)
 *   cash expenses every CASH expense dated that day (expenses are only recorded, BR-62: none is excluded)
 *   opening cash  the COUNTED cash of the latest earlier close of the warehouse, 0 with none
 *   expected      opening + sales + top-ups - expenses   (integer paise, never typed in)
 * and a close stores those figures with the counted cash, the difference and who closed it.
 *
 * UNCONFIRMED DEFAULTS (owner approval pending; also stated in docs/openapi.yaml): the design only
 * shows the screen, so these are the smallest safe readings. The difference is recorded, never
 * judged (no tolerance, reason optional). A day closes once; how a mistaken close is corrected is undefined, so a close cannot be changed.
 * Closing a day earlier than an existing later close is recorded with its own opening.
 *
 * Takes a `ResolvedScope`, never a `Request`. The close and its masked audit row share one transaction.
 */
import { fromPaise, parseMoney, toPaise, type Money } from '@tohfa/shared-types';
import { writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import {
  beginIdempotent,
  idempotencyStore,
  requireIdempotencyKey,
  type IdempotencyStore,
} from '../../http/idempotency.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { isCalendarDate } from '../certifications/certifications.schema.js';
import { cashCloseRepo, type CashCloseCursor, type CashCloseRepo, type DayFigures } from './cash-close.repo.js';
import type {
  CashCloseResponse,
  CreateCashCloseBody,
  DailySummaryQuery,
  DailySummaryResponse,
  ListCashClosesQuery,
  ListCashClosesResponse,
  SystemFigures,
} from './cash-close.schema.js';
import {
  decodeCursorParts,
  encodeCursor,
  failValidation,
  invalidCursor,
  MICRO_TS,
  notFound,
  pageOf,
  targetWarehouse,
  UUID,
} from './finance.shared.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface CashCloseServiceDeps {
  repo: CashCloseRepo;
  db: Executor;
  runTx: TransactionRunner;
  idempotency?: IdempotencyStore;
}

export interface CloseCashResult {
  close: CashCloseResponse;
  /** True when the Idempotency-Key had already recorded this exact close. */
  replayed: boolean;
}

export interface CashCloseService {
  dailySummary(scope: ResolvedScope, query: DailySummaryQuery): Promise<DailySummaryResponse>;
  close(scope: ResolvedScope, idempotencyKey: string | undefined, body: CreateCashCloseBody): Promise<CloseCashResult>;
  list(scope: ResolvedScope, query: ListCashClosesQuery): Promise<ListCashClosesResponse>;
  get(scope: ResolvedScope, id: string): Promise<CashCloseResponse>;
}

const AUDIT_CODE = 'finance.cash_close.manage';

function decodeCloseCursor(raw: string): CashCloseCursor {
  const [date, createdAt, id] = decodeCursorParts(raw, 3);
  // Validated so a forged cursor is a 422 here, not a failed ::date / ::timestamptz cast (500) in SQL.
  if (!isCalendarDate(date ?? '') || !MICRO_TS.test(createdAt ?? '') || !UUID.test(id ?? '')) return invalidCursor();
  return { date: date as string, createdAt: createdAt as string, id: id as string };
}

/** Exact integer-paise arithmetic: opening + sales + top-ups - expenses. */
function expectedClosing(figures: DayFigures): Money {
  return fromPaise(
    toPaise(figures.openingCash) + toPaise(figures.cashSales) + toPaise(figures.cashTopUps) - toPaise(figures.cashExpenses),
  );
}

function toSystemFigures(figures: DayFigures): SystemFigures {
  return { ...figures, expectedClosing: expectedClosing(figures) };
}

export function createCashCloseService(
  deps: CashCloseServiceDeps = { repo: cashCloseRepo, db: pool, runTx: withTransaction },
): CashCloseService {
  const { repo, db, runTx } = deps;
  const idempotency = deps.idempotency ?? idempotencyStore;

  async function requireActiveWarehouse(executor: Executor, warehouseId: string, field: string): Promise<void> {
    if (!(await repo.activeWarehouseExists(executor, warehouseId))) {
      failValidation({ [field]: ['warehouseId is not an existing active warehouse.'] });
    }
  }

  return {
    async dailySummary(scope, query) {
      const warehouseId = targetWarehouse(scope, query.warehouseId, 'query.warehouseId');
      await requireActiveWarehouse(db, warehouseId, 'query.warehouseId');
      const figures = await repo.dayFigures(db, warehouseId, query.date);
      const closed = await repo.findByWarehouseAndDate(db, warehouseId, query.date);
      return { warehouseId, date: query.date, system: toSystemFigures(figures), closed };
    },

    async close(scope, idempotencyKey, body) {
      const key = requireIdempotencyKey(idempotencyKey);
      const warehouseId = targetWarehouse(scope, body.warehouseId);

      return runTx(async (tx) => {
        // Before any other check, so a replay still answers after the warehouse day has moved on.
        const idem = await beginIdempotent<CashCloseResponse>(idempotency, tx, {
          actorUserId: scope.userId,
          key,
          operation: AUDIT_CODE,
          request: { warehouseId, date: body.date, countedCash: body.countedCash, note: body.note ?? null },
        });
        if (idem.replay) return { close: idem.response, replayed: true };

        if (body.date > (await repo.todayInIndia(tx))) {
          failValidation({ 'body.date': ['A day that has not started yet (Asia/Kolkata) cannot be closed.'] });
        }
        await requireActiveWarehouse(tx, warehouseId, 'body.warehouseId');

        const figures = await repo.dayFigures(tx, warehouseId, body.date);
        const expected = expectedClosing(figures);
        const counted = parseMoney(body.countedCash);
        const inserted = await repo.insert(tx, {
          warehouseId,
          date: body.date,
          ...figures,
          expectedClosing: expected,
          countedCash: counted,
          difference: fromPaise(toPaise(counted) - toPaise(expected)),
          note: body.note ?? null,
          closedBy: scope.userId,
        });
        if (inserted === null) {
          throw new AppError('CONFLICT', {
            detail: 'This warehouse day is already closed. A close cannot be replaced or changed.',
          });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: AUDIT_CODE,
          entityType: 'cash_close',
          entityId: inserted.id,
          warehouseId,
          // Masked image: no note, which is free text that can carry names or phone numbers.
          after: {
            id: inserted.id,
            warehouseId: inserted.warehouseId,
            date: inserted.date,
            expectedClosing: inserted.expectedClosing,
            countedCash: inserted.countedCash,
            difference: inserted.difference,
          },
        });

        await idem.complete(inserted);
        return { close: inserted, replayed: false };
      });
    },

    async list(scope, query) {
      const cursor = query.cursor === undefined ? undefined : decodeCloseCursor(query.cursor);
      const { items, next } = await repo.list(
        db,
        scope,
        { warehouseId: query.warehouseId, from: query.from, to: query.to },
        query.limit,
        cursor,
      );
      return { items, page: pageOf(next, (c) => encodeCursor([c.date, c.createdAt, c.id])) };
    },

    async get(scope, id) {
      const close = await repo.findById(db, scope, id);
      if (close === null) throw notFound('Cash close', id);
      return close;
    },
  };
}

export const cashCloseService: CashCloseService = createCashCloseService();
