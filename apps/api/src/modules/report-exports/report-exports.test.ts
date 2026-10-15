/**
 * BR-76: CSV exports of the reports and finance reports (GET /v1/admin/exports/<report>, one literal route per report).
 *
 * Layers, as in the neighbouring report and finance modules:
 *  1. pure CSV writer (injection guard, RFC 4180 quoting)
 *  2. request schemas
 *  3. service against mocked sources (confinement, 404, row cap, filename, same-transaction audit)
 *  4. repo against a fake Executor (the `export_max_rows` fallback)
 *  5. PostgreSQL: every export against seeded rows, in a transaction that always rolls back
 *  6. HTTP through the real router (401/403 wiring, headers, 404, 422)
 */
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { parseMoney, RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import type { ReportsRepo } from '../reports/reports.repo.js';
import { guardCell, toCsv, type CsvColumn } from './csv.js';
import { reportExportsRepo, type ReportExportsRepo } from './report-exports.repo.js';
import { exportQuerySchemas, exportReports, type ExportReport } from './report-exports.schema.js';
import {
  createReportExportsService,
  type ExpenseExportRow,
  type ExportRequest,
  type ReportExportsSources,
} from './report-exports.service.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const W1 = '11111111-1111-4111-8111-111111111111';
const W2 = '22222222-2222-4222-8222-222222222222';
const SEEDED_USER = '00000000-0000-0000-0000-000000000001';
const CRLF = '\r\n';

const lines = (...rows: string[]): string => rows.join(CRLF) + CRLF;

/** An independent RFC 4180 reader, so the writer is not checked against itself. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r' && text[i + 1] === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i += 1;
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) throw new Error('CSV does not end with CRLF');
  return rows;
}

function subScope(level: ResolvedScope['level'], warehouseId: string, permission: string): ResolvedScope {
  return aScope({ level, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission, userId: SEEDED_USER });
}

function mainScope(level: ResolvedScope['level'], permission: string): ResolvedScope {
  return aScope({ level, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [], permission, userId: SEEDED_USER });
}

/** The source-data permission each export is gated by besides `report.export.file`. */
const DATA_PERMISSION: Record<ExportReport, string> = {
  sales: 'order.list.view_all',
  receiving: 'inventory.goods_receipt.record',
  inventory: 'inventory.batch.view',
  returns: 'rma.request.process',
  customers: 'customer.list.view',
  'cash-topups': 'wallet.cash_topup.process',
  expenses: 'finance.expense.log',
  'finance-revenue': 'finance.sales_income.view',
  'finance-expenses': 'finance.expense.log',
};

/** One valid request per report, over `range`, optionally for one warehouse. */
function requestFor(report: ExportReport, range: { from: string; to: string }, warehouseId?: string): ExportRequest {
  const w = warehouseId === undefined ? {} : { warehouseId };
  switch (report) {
    case 'sales':
      return { report, query: { ...range, ...w } };
    case 'inventory':
      return { report, query: { ...w } };
    case 'expenses':
      return { report, query: { ...range, ...w } };
    case 'receiving':
    case 'returns':
    case 'customers':
    case 'cash-topups':
    case 'finance-revenue':
    case 'finance-expenses':
      return { report, query: { ...range, ...w } };
  }
}

async function expectAppError(promise: Promise<unknown>, code: string, status: number): Promise<AppError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  const appError = error as AppError;
  expect(appError.code).toBe(code);
  expect(appError.status).toBe(status);
  return appError;
}

const MAIN_RANGE = { from: '2031-03-10', to: '2031-03-12' };
const FINANCE_RANGE = { from: '2031-05-10', to: '2031-05-12' };

// ---------------------------------------------------------------------------
// 1. The CSV writer
// ---------------------------------------------------------------------------
describe('CSV writer', () => {
  const text: CsvColumn = { name: 'label', kind: 'text' };
  const number: CsvColumn = { name: 'amount', kind: 'number' };

  it.each(['=1+1', '+1', '-1', '@SUM(A1)', '\tx', '\rx'])(
    'BR-76d: a text cell starting with %j is prefixed with a single quote',
    (value) => {
      expect(guardCell(value)).toBe(`'${value}`);
    },
  );

  it('BR-76d: a text cell that does not start with a trigger character is left alone', () => {
    for (const value of ['', 'Carrot', '1=1', 'a=b', ' =x', "'=x", '2031-03-10']) {
      expect(guardCell(value)).toBe(value);
    }
  });

  it('BR-76d: the quote prefix survives into the file, and a guarded cell is still quoted when it needs to be', () => {
    const csv = toCsv([text], [['=HYPERLINK("http://x","y")'], ['-cmd, with comma'], ['@a']]);
    expect(csv).toBe(lines('label', `"'=HYPERLINK(""http://x"",""y"")"`, `"'-cmd, with comma"`, `'@a`));
  });

  it('BR-76e: commas, double quotes, CR and LF are quoted RFC 4180 style, with CRLF row endings and a final CRLF', () => {
    const csv = toCsv([text, number], [
      ['a,b', '1.00'],
      ['say "hi"', '2.00'],
      ['two\nlines', '3.00'],
      ['carriage\rreturn', '4.00'],
      ['plain', '5.00'],
    ]);
    expect(csv).toBe(
      'label,amount\r\n"a,b",1.00\r\n"say ""hi""",2.00\r\n"two\nlines",3.00\r\n"carriage\rreturn",4.00\r\nplain,5.00\r\n',
    );
    expect(parseCsv(csv).map((r) => r[0])).toEqual(['label', 'a,b', 'say "hi"', 'two\nlines', 'carriage\rreturn', 'plain']);
  });

  it('BR-76e: a null cell is empty, in a text and in a number column', () => {
    expect(toCsv([text, number], [[null, null]])).toBe(lines('label,amount', ','));
  });

  it('BR-76d: a number column is never quote-prefixed (a negative amount stays a number) but must be numeric', () => {
    expect(toCsv([number], [['-5.00']])).toBe(lines('amount', '-5.00'));
    expect(() => toCsv([number], [['=1+1']])).toThrow(/amount/);
    expect(() => toCsv([number], [['1,5']])).toThrow(/amount/);
  });

  it('BR-76a: a header-only file is the header row and a CRLF', () => {
    expect(toCsv([text, number], [])).toBe(lines('label,amount'));
  });

  it('BR-76a: a row with the wrong number of cells is a bug, not a malformed file', () => {
    expect(() => toCsv([text, number], [['only one']])).toThrow(/cells/);
  });
});

// ---------------------------------------------------------------------------
// 2. Request schemas
// ---------------------------------------------------------------------------
describe('Export request schemas (BR-76j)', () => {
  const RANGE = { from: '2031-03-10', to: '2031-03-12' };
  const ranged = exportReports.filter((r) => r !== 'inventory');

  it('BR-76j: the nine reports are exactly the documented ones', () => {
    expect([...exportReports]).toEqual([
      'sales',
      'receiving',
      'inventory',
      'returns',
      'customers',
      'cash-topups',
      'expenses',
      'finance-revenue',
      'finance-expenses',
    ]);
  });

  it.each(ranged)('BR-76j: %s requires from and to as real calendar dates with from <= to', (report) => {
    const schema = exportQuerySchemas[report];
    expect(schema.safeParse(RANGE).success).toBe(true);
    expect(schema.safeParse({ from: '2031-03-10', to: '2031-03-10' }).success).toBe(true);
    expect(schema.safeParse({ from: '2031-03-12', to: '2031-03-10' }).success).toBe(false);
    expect(schema.safeParse({ from: '2031-02-30', to: '2031-03-10' }).success).toBe(false);
    expect(schema.safeParse({ to: '2031-03-10' }).success).toBe(false);
    expect(schema.safeParse({ from: '2031-03-10' }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ ...RANGE, warehouseId: 'not-a-uuid' }).success).toBe(false);
    expect(schema.safeParse({ ...RANGE, warehouseId: W1 }).success).toBe(true);
    expect(schema.safeParse({ ...RANGE, surprise: '1' }).success).toBe(false);
  });

  it('BR-76j: inventory is a snapshot, so from and to are optional there, but real dates and ordered when sent', () => {
    const schema = exportQuerySchemas['inventory'];
    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ warehouseId: W1 }).success).toBe(true);
    expect(schema.safeParse(RANGE).success).toBe(true);
    expect(schema.safeParse({ from: '2031-02-30' }).success).toBe(false);
    expect(schema.safeParse({ from: '2031-03-12', to: '2031-03-10' }).success).toBe(false);
    expect(schema.safeParse({ surprise: '1' }).success).toBe(false);
  });

  it('BR-76j: only sales takes a channel, and only the four order channels', () => {
    expect(exportQuerySchemas['sales'].safeParse({ ...RANGE, channel: 'MARKET' }).success).toBe(true);
    expect(exportQuerySchemas['sales'].safeParse({ ...RANGE, channel: 'EBAY' }).success).toBe(false);
    expect(exportQuerySchemas['receiving'].safeParse({ ...RANGE, channel: 'MARKET' }).success).toBe(false);
  });

  it('BR-76j: only expenses takes the expense filters (category, payment method, status)', () => {
    const schema = exportQuerySchemas['expenses'];
    expect(schema.safeParse({ ...RANGE, categoryId: W1, paymentMethod: 'UPI', status: 'APPROVED' }).success).toBe(true);
    expect(schema.safeParse({ ...RANGE, paymentMethod: 'CHEQUE' }).success).toBe(false);
    expect(schema.safeParse({ ...RANGE, status: 'PAID' }).success).toBe(false);
    expect(schema.safeParse({ ...RANGE, categoryId: 'x' }).success).toBe(false);
    expect(exportQuerySchemas['finance-expenses'].safeParse({ ...RANGE, status: 'APPROVED' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Service against mocked sources
// ---------------------------------------------------------------------------
interface Recorded {
  calls: string[];
  /** Every executor handed to a source, and every executor the audit INSERT went to. */
  dbs: Executor[];
  auditDbs: Executor[];
  /** The filters each source received, by call name. */
  args: Record<string, unknown>;
}

interface FakeOptions {
  maxRangeDays?: number;
  financeMaxRangeDays?: number;
  maxRows?: number;
  warehouseCode?: string | null;
  salesRows?: Awaited<ReturnType<ReportsRepo['sales']>>;
  inventoryRows?: Awaited<ReturnType<ReportsRepo['inventory']>>;
  expenseRows?: { items: ExpenseExportRow[] };
}

function createFakes(options: FakeOptions = {}): {
  sources: ReportExportsSources;
  repo: ReportExportsRepo;
  tx: Executor;
  recorded: Recorded;
} {
  const recorded: Recorded = { calls: [], dbs: [], auditDbs: [], args: {} };
  const note = (name: string, db: Executor, filter?: unknown): void => {
    recorded.calls.push(name);
    recorded.dbs.push(db);
    recorded.args[name] = filter;
  };
  const tx: Executor = {
    async query(sql: string) {
      if (/INSERT INTO audit_log/.test(sql)) {
        recorded.auditDbs.push(tx);
        return { rows: [{ id: newId() }], rowCount: 1, command: 'INSERT', oid: 0, fields: [] } as never;
      }
      throw new Error(`unexpected SQL on the fake executor: ${sql}`);
    },
  };
  const day = { date: '2031-03-10', count: 1, total: '1.00' };
  const sources: ReportExportsSources = {
    reports: {
      async getMaxRangeDays(db) {
        note('getMaxRangeDays', db);
        return options.maxRangeDays ?? 366;
      },
      async sales(db, filter) {
        note('sales', db, filter);
        return options.salesRows ?? { count: 1, total: '1.00', byDay: [day], byChannel: [], byStatus: [] };
      },
      async receiving(db, filter) {
        note('receiving', db, filter);
        return [];
      },
      async inventory(db, filter) {
        note('inventory', db, filter);
        return options.inventoryRows ?? [];
      },
      async returns(db, filter) {
        note('returns', db, filter);
        return { byStatus: [], byDay: [], refundedTotal: '0.00' };
      },
      async customers(db, filter) {
        note('customers', db, filter);
        return { customersWithOrders: 0, newCustomers: 0, byDay: [] };
      },
      async cashTopups(db, filter) {
        note('cashTopups', db, filter);
        return { count: 0, total: '0.00', byDay: [] };
      },
    },
    finance: {
      async getReportMaxRangeDays(db) {
        note('getReportMaxRangeDays', db);
        return options.financeMaxRangeDays ?? 366;
      },
      async listExpenses(db, scope, filters, limit) {
        note('listExpenses', db, { scope, filters, limit });
        return options.expenseRows ?? { items: [] };
      },
      async revenueByChannel(db, scope) {
        note('revenueByChannel', db, { scope });
        return [];
      },
      async revenueReportByDay(db, scope) {
        note('revenueReportByDay', db, { scope });
        return [];
      },
      async revenueReportByPaymentMethod(db, scope) {
        note('revenueReportByPaymentMethod', db, { scope });
        return [];
      },
      async expenseReportByDay(db, scope) {
        note('expenseReportByDay', db, { scope });
        return [];
      },
      async expenseReportByCategory(db, scope) {
        note('expenseReportByCategory', db, { scope });
        return [];
      },
      async expenseReportByPaymentMethod(db, scope) {
        note('expenseReportByPaymentMethod', db, { scope });
        return [];
      },
    },
  };
  const repo: ReportExportsRepo = {
    async getMaxRows(db) {
      note('getMaxRows', db);
      return options.maxRows ?? 50000;
    },
    async findWarehouseCode(db, id) {
      note('findWarehouseCode', db, id);
      return options.warehouseCode === undefined ? 'WH-TEST' : options.warehouseCode;
    },
  };
  return { sources, repo, tx, recorded };
}

function serviceWith(fakes: ReturnType<typeof createFakes>) {
  return createReportExportsService({
    sources: fakes.sources,
    repo: fakes.repo,
    runTx: async (fn) => fn(fakes.tx),
  });
}

const SOURCE_CALLS = [
  'sales',
  'receiving',
  'inventory',
  'returns',
  'customers',
  'cashTopups',
  'listExpenses',
  'revenueByChannel',
  'revenueReportByDay',
  'revenueReportByPaymentMethod',
  'expenseReportByDay',
  'expenseReportByCategory',
  'expenseReportByPaymentMethod',
];

describe('Report exports service (mocked sources)', () => {
  it.each(exportReports)(
    'BR-76b: a Sub admin asking %s for another warehouse gets 404 NOT_FOUND, nothing is read and no audit row is written',
    async (report) => {
      const fakes = createFakes();
      const service = serviceWith(fakes);
      const sub = subScope(ScopeLevel.OWN, W1, DATA_PERMISSION[report]);

      await expectAppError(service.exportReport(sub, requestFor(report, MAIN_RANGE, W2)), 'NOT_FOUND', 404);
      expect(fakes.recorded.calls.filter((c) => SOURCE_CALLS.includes(c))).toEqual([]);
      expect(fakes.recorded.auditDbs).toEqual([]);

      // Its own warehouse is fine.
      const own = await service.exportReport(sub, requestFor(report, MAIN_RANGE, W1));
      expect(own.filename).toBe(`${report}_WH-TEST_${report === 'inventory' ? 'current' : `${MAIN_RANGE.from}_${MAIN_RANGE.to}`}.csv`);
    },
  );

  it.each([
    ['receiving', 'inventory.goods_receipt.record'],
    ['returns', 'rma.request.process'],
    ['cash-topups', 'wallet.cash_topup.process'],
  ] as const)(
    'BR-76b: a Sub admin is confined even where docs/rbac.json grants it `all` (%s)',
    async (report, permission) => {
      const fakes = createFakes();
      const service = serviceWith(fakes);
      const sub = subScope(ScopeLevel.ALL, W1, permission);
      await expectAppError(service.exportReport(sub, requestFor(report, MAIN_RANGE, W2)), 'NOT_FOUND', 404);
      expect(fakes.recorded.calls.filter((c) => SOURCE_CALLS.includes(c))).toEqual([]);

      await service.exportReport(sub, requestFor(report, MAIN_RANGE));
      const filter = Object.values(fakes.recorded.args).find(
        (a): a is { scope: ResolvedScope } => typeof a === 'object' && a !== null && 'scope' in a,
      );
      expect(filter?.scope.level).toBe(ScopeLevel.OWN);
      expect(filter?.scope.warehouseIds).toEqual([W1]);
    },
  );

  it('BR-76b: a Sub admin without a warehouse id is confined to its own, and the file is named after it', async () => {
    const fakes = createFakes({ warehouseCode: 'WH-COON' });
    const result = await serviceWith(fakes).exportReport(
      subScope(ScopeLevel.OWN, W1, 'order.list.view_all'),
      requestFor('sales', MAIN_RANGE),
    );
    expect(result.filename).toBe('sales_WH-COON_2031-03-10_2031-03-12.csv');
    expect(fakes.recorded.args['findWarehouseCode']).toBe(W1);
  });

  it('BR-76c: a Main admin may export any warehouse id, and without one the file is for all', async () => {
    const fakes = createFakes({ warehouseCode: 'WH-KOTA' });
    const service = serviceWith(fakes);
    const main = mainScope(ScopeLevel.ALL, 'order.list.view_all');
    expect((await service.exportReport(main, requestFor('sales', MAIN_RANGE, W2))).filename).toBe(
      'sales_WH-KOTA_2031-03-10_2031-03-12.csv',
    );
    expect((await service.exportReport(main, requestFor('sales', MAIN_RANGE))).filename).toBe(
      'sales_all_2031-03-10_2031-03-12.csv',
    );
  });

  it('BR-76c: a warehouse id that does not exist is 404 even for a Main admin (there is no code to name the file)', async () => {
    const fakes = createFakes({ warehouseCode: null });
    await expectAppError(
      serviceWith(fakes).exportReport(mainScope(ScopeLevel.ALL, 'order.list.view_all'), requestFor('sales', MAIN_RANGE, W2)),
      'NOT_FOUND',
      404,
    );
    expect(fakes.recorded.auditDbs).toEqual([]);
  });

  it('BR-76l: a scope that carries a customer or farmer id is 403 and reads nothing', async () => {
    for (const owner of [{ customerId: newId() }, { farmerId: newId() }]) {
      const fakes = createFakes();
      const scope = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, permission: 'order.list.view_all', ...owner });
      await expectAppError(serviceWith(fakes).exportReport(scope, requestFor('sales', MAIN_RANGE)), 'FORBIDDEN', 403);
      expect(fakes.recorded.calls).toEqual([]);
    }
  });

  it.each([
    ['sales', 'maxRangeDays'],
    ['receiving', 'maxRangeDays'],
    ['returns', 'maxRangeDays'],
    ['customers', 'maxRangeDays'],
    ['cash-topups', 'maxRangeDays'],
    ['expenses', 'financeMaxRangeDays'],
    ['finance-revenue', 'financeMaxRangeDays'],
    ['finance-expenses', 'financeMaxRangeDays'],
  ] as const)(
    'BR-76j: %s follows the same range cap as the report it exports (%s): the limit is allowed, one day more is 422 on query.to',
    async (report, key) => {
      const options: FakeOptions = { [key]: 30 };
      const main = mainScope(ScopeLevel.ALL, DATA_PERMISSION[report]);

      // 2031-03-01 .. 2031-03-31 is a span of 30 days.
      const ok = createFakes(options);
      await expect(
        serviceWith(ok).exportReport(main, requestFor(report, { from: '2031-03-01', to: '2031-03-31' })),
      ).resolves.toBeDefined();

      const over = createFakes(options);
      const error = await expectAppError(
        serviceWith(over).exportReport(main, requestFor(report, { from: '2031-03-01', to: '2031-04-01' })),
        'VALIDATION_FAILED',
        422,
      );
      expect(Object.keys(error.errors ?? {})).toEqual(['query.to']);
      expect(over.recorded.calls.filter((c) => SOURCE_CALLS.includes(c))).toEqual([]);
      expect(over.recorded.auditDbs).toEqual([]);
    },
  );

  it('BR-76j: the inventory snapshot has no range, so no range cap applies to it', async () => {
    const fakes = createFakes({ maxRangeDays: 0 });
    await serviceWith(fakes).exportReport(mainScope(ScopeLevel.ALL, 'inventory.batch.view'), { report: 'inventory', query: {} });
    expect(fakes.recorded.calls).not.toContain('getMaxRangeDays');
  });

  it('BR-76f: an export with more data rows than export_max_rows is 422 on query.to and is never truncated; exactly the cap is allowed', async () => {
    // summary + 1 day + 1 channel + 1 status = 4 data rows.
    const salesRows = {
      count: 1,
      total: '1.00',
      byDay: [{ date: '2031-03-10', count: 1, total: '1.00' }],
      byChannel: [{ channel: 'ONLINE' as const, count: 1, total: '1.00' }],
      byStatus: [{ status: 'DELIVERED' as const, count: 1 }],
    };
    const main = mainScope(ScopeLevel.ALL, 'order.list.view_all');

    const exact = await serviceWith(createFakes({ maxRows: 4, salesRows })).exportReport(main, requestFor('sales', MAIN_RANGE));
    expect(exact.rowCount).toBe(4);

    const fakes = createFakes({ maxRows: 3, salesRows });
    const error = await expectAppError(serviceWith(fakes).exportReport(main, requestFor('sales', MAIN_RANGE)), 'VALIDATION_FAILED', 422);
    expect(Object.keys(error.errors ?? {})).toEqual(['query.to']);
    expect(error.errors?.['query.to']?.[0]).toMatch(/narrow/i);
    expect(fakes.recorded.auditDbs).toEqual([]);
  });

  it('BR-76f: for the expense list the cap is applied in the query: it asks for one row more than the cap, and seeing it means over the cap', async () => {
    const item = (): ExpenseExportRow => ({
      id: newId(),
      warehouseId: W1,
      category: 'Transport',
      amount: parseMoney('1.00'),
      expenseDate: '2031-05-10',
      paymentMethod: null,
      status: 'RECORDED',
    });
    const main = mainScope(ScopeLevel.ALL, 'finance.expense.log');

    const within = createFakes({ maxRows: 2, expenseRows: { items: [item(), item()] } });
    expect((await serviceWith(within).exportReport(main, requestFor('expenses', FINANCE_RANGE))).rowCount).toBe(2);
    expect((within.recorded.args['listExpenses'] as { limit: number }).limit).toBe(3);

    const over = createFakes({ maxRows: 2, expenseRows: { items: [item(), item(), item()] } });
    await expectAppError(serviceWith(over).exportReport(main, requestFor('expenses', FINANCE_RANGE)), 'VALIDATION_FAILED', 422);
  });

  it('BR-76f: the inventory snapshot has no range, so its over-the-cap advice is to narrow to one warehouse', async () => {
    const inventoryRows = [{ cropId: newId(), name: 'Apple', totalQty: '1.000', batchCount: 1 }];
    const error = await expectAppError(
      serviceWith(createFakes({ maxRows: 0, inventoryRows })).exportReport(mainScope(ScopeLevel.ALL, 'inventory.batch.view'), requestFor('inventory', MAIN_RANGE)),
      'VALIDATION_FAILED',
      422,
    );
    expect(Object.keys(error.errors ?? {})).toEqual(['query.warehouseId']);
  });

  it('BR-76h: the audit row goes through the same executor as every read, once, with a masked image', async () => {
    const fakes = createFakes({ warehouseCode: 'WH-COON' });
    const sub = subScope(ScopeLevel.OWN, W1, 'order.list.view_all');
    await serviceWith(fakes).exportReport(sub, requestFor('sales', MAIN_RANGE));
    expect(fakes.recorded.auditDbs).toEqual([fakes.tx]);
    expect(fakes.recorded.dbs.every((db) => db === fakes.tx)).toBe(true);
    expect(fakes.recorded.dbs.length).toBeGreaterThan(0);
  });

  it('BR-76k: the file name is built only from safe characters, whatever the warehouse code holds', async () => {
    const fakes = createFakes({ warehouseCode: 'W/H "x"\r\n;..\\é' });
    const result = await serviceWith(fakes).exportReport(
      mainScope(ScopeLevel.ALL, 'order.list.view_all'),
      requestFor('sales', MAIN_RANGE, W1),
    );
    expect(result.filename).toMatch(/^sales_[A-Za-z0-9_-]+_2031-03-10_2031-03-12\.csv$/);
  });
});

// ---------------------------------------------------------------------------
// 4. The repo against a fake Executor
// ---------------------------------------------------------------------------
describe('Report exports repo', () => {
  const executorReturning = (rows: Array<{ value: unknown }>): Executor => ({
    async query() {
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] } as never;
    },
  });

  it.each([
    [[], 50000],
    [[{ value: 'abc' }], 50000],
    [[{ value: -1 }], 50000],
    [[{ value: 1.5 }], 50000],
    [[{ value: null }], 50000],
    [[{ value: 7 }], 7],
    [[{ value: '12' }], 12],
    [[{ value: 0 }], 0],
  ])('BR-76f: export_max_rows %j reads as %i (fallback 50000 only when the row is missing or unusable)', async (rows, expected) => {
    await expect(reportExportsRepo.getMaxRows(executorReturning(rows))).resolves.toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 5. PostgreSQL: every export against the real schema
// ---------------------------------------------------------------------------
class RollbackFixture extends Error {}

describeIfDatabase('Report exports (PostgreSQL)', () => {
  beforeAll(async () => {
    expect(await databaseReady('goods_receipts'), 'the database is reachable and migrated').toBe(true);
    expect(await databaseReady('expense_categories'), 'migration 0047 is applied').toBe(true);
  });

  async function inRolledBackTx(fn: (tx: Executor) => Promise<void>): Promise<void> {
    const { withTransaction } = await import('../../db/pool.js');
    await withTransaction(async (tx) => {
      await fn(tx);
      throw new RollbackFixture();
    }).catch((error: unknown) => {
      if (!(error instanceof RollbackFixture)) throw error;
    });
  }

  async function serviceOn(tx: Executor) {
    const [{ reportsRepo }, { financeRepo }] = await Promise.all([
      import('../reports/reports.repo.js'),
      import('../finance/finance.repo.js'),
    ]);
    return createReportExportsService({
      sources: { reports: reportsRepo, finance: financeRepo },
      repo: reportExportsRepo,
      runTx: async (fn) => fn(tx),
    });
  }

  interface World {
    coon: string;
    kota: string;
    cropA: string;
    cropB: string;
    customer: { name: string; mobile: string; code: string };
  }

  /**
   * One fixed world. Reports: IST days 2031-03-10..12. Finance: IST days 2031-05-10..12. Both are
   * ranges no real data can occupy.
   *
   * `session_replication_role = replica` switches off FK and trigger enforcement for this
   * transaction only, so the fixture need not build purchase orders, listings and farmers just to
   * get a goods receipt row. The queries under test are plain SELECTs and joins. Everything rolls back.
   */
  async function seedWorld(tx: Executor): Promise<World> {
    await tx.query(`SET LOCAL session_replication_role = replica`);
    const stamp = `${Date.now()}${Math.floor(Math.random() * 100000)}`;

    const wh = await tx.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses`);
    const byCode = new Map(wh.rows.map((r) => [r.code, r.id]));
    const coon = byCode.get('WH-COON')!;
    const kota = byCode.get('WH-KOTA')!;

    // The batches already in the database would otherwise be part of the inventory snapshot.
    await tx.query(`DELETE FROM inventory_batches`);
    const crops = await tx.query<{ id: string }>(`SELECT id FROM crop_master ORDER BY slug LIMIT 2`);
    const [cropA, cropB] = [crops.rows[0]!.id, crops.rows[1]!.id];
    await tx.query(`UPDATE crop_master SET name = 'Apple' WHERE id = $1`, [cropA]);
    await tx.query(`UPDATE crop_master SET name = 'Banana' WHERE id = $1`, [cropB]);

    const person = { name: `Private Person ${stamp}`, mobile: `+9196${stamp.slice(-8)}`, code: `C-PII-${stamp}` };
    const customer = async (label: string, preferred: string | null, createdAt: string): Promise<string> => {
      const user = await tx.query<{ id: string }>(
        `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, $2, 'CUSTOMER', 'ACTIVE') RETURNING id`,
        [label === '1' ? person.mobile : `+9195${stamp.slice(-7)}${label}`, label === '1' ? person.name : `Other ${label}`],
      );
      const r = await tx.query<{ id: string }>(
        `INSERT INTO customers (user_id, customer_code, preferred_warehouse_id, created_at)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [user.rows[0]!.id, label === '1' ? person.code : `C-${label}-${stamp}`, preferred, createdAt],
      );
      return r.rows[0]!.id;
    };
    const c1 = await customer('1', coon, '2031-03-10T10:00:00Z');
    const c2 = await customer('2', coon, '2031-03-11T05:00:00Z');
    const c3 = await customer('3', kota, '2031-03-11T05:00:00Z');
    await customer('4', coon, '2031-03-09T10:00:00Z'); // created before the range

    const order = async (
      n: string,
      warehouse: string,
      customerId: string,
      o: { channel: string; status: string; total: string; placedAt: string; paymentMethod?: string; paymentStatus?: string; completedAt?: string },
    ): Promise<string> => {
      const r = await tx.query<{ id: string }>(
        `INSERT INTO orders (order_number, customer_id, warehouse_id, channel, status, total_amount, placed_at,
                             cancellation_reason, payment_method, payment_status, completed_at)
         VALUES ($1, $2, $3, $4, $5::order_status, $6, $7, $8, $9::payment_method, $10, $11)
         RETURNING id`,
        [
          `O-${n}-${stamp}`,
          customerId,
          warehouse,
          o.channel,
          o.status,
          o.total,
          o.placedAt,
          o.status === 'CANCELLED' ? 'fixture' : null,
          o.paymentMethod ?? 'UPI',
          o.paymentStatus ?? 'PENDING',
          o.completedAt ?? null,
        ],
      );
      return r.rows[0]!.id;
    };
    const o1 = await order('1', coon, c1, { channel: 'ONLINE', status: 'DELIVERED', total: '100.10', placedAt: '2031-03-10T10:00:00Z' });
    const o2 = await order('2', coon, c1, { channel: 'ONLINE', status: 'CONFIRMED', total: '200.20', placedAt: '2031-03-10T20:00:00Z' });
    const o3 = await order('3', coon, c2, { channel: 'MARKET', status: 'DELIVERED', total: '0.05', placedAt: '2031-03-11T05:00:00Z' });
    const o4 = await order('4', kota, c3, { channel: 'ONLINE', status: 'CANCELLED', total: '1000.00', placedAt: '2031-03-11T05:00:00Z' });
    await order('5', coon, c1, { channel: 'ONLINE', status: 'DELIVERED', total: '5.00', placedAt: '2031-03-09T18:29:59Z' });
    await order('6', coon, c1, { channel: 'ONLINE', status: 'DELIVERED', total: '7.00', placedAt: '2031-03-12T18:30:00Z' });

    // Returns: 10.05 x 3.333 + 2.00 x 1.000 = 35.49665 -> 35.50 refunded for r1; r4 refunds 10.00 x 2.000 = 20.00.
    const item = async (orderId: string, price: string): Promise<string> => {
      const r = await tx.query<{ id: string }>(
        `INSERT INTO order_items (order_id, crop_id, grade, qty_kg, unit_price, line_total)
         VALUES ($1, $2, 'GRADE_1', 5, $3, 0) RETURNING id`,
        [orderId, cropA, price],
      );
      return r.rows[0]!.id;
    };
    const ret = async (orderId: string, customerId: string, status: string, createdAt: string): Promise<string> => {
      const r = await tx.query<{ id: string }>(
        `INSERT INTO return_requests (order_id, customer_id, status, reason, created_at)
         VALUES ($1, $2, $3::return_status, 'fixture', $4) RETURNING id`,
        [orderId, customerId, status, createdAt],
      );
      return r.rows[0]!.id;
    };
    const retItem = async (returnId: string, orderItemId: string, accepted: string | null): Promise<void> => {
      await tx.query(
        `INSERT INTO return_request_items (return_request_id, order_item_id, requested_qty, accepted_qty)
         VALUES ($1, $2, 5, $3)`,
        [returnId, orderItemId, accepted],
      );
    };
    const i1a = await item(o1, '10.05');
    const i1b = await item(o1, '2.00');
    const i3 = await item(o3, '4.00');
    const i2 = await item(o2, '9.00');
    const i4 = await item(o4, '10.00');
    const r1 = await ret(o1, c1, 'REFUNDED', '2031-03-10T10:00:00Z');
    await retItem(r1, i1a, '3.333');
    await retItem(r1, i1b, '1.000');
    const r2 = await ret(o3, c2, 'PENDING', '2031-03-11T05:00:00Z');
    await retItem(r2, i3, null);
    const r3 = await ret(o2, c1, 'REJECTED', '2031-03-10T20:00:00Z'); // IST 03-11
    await retItem(r3, i2, '2.000'); // rejected: not refunded
    const r4 = await ret(o4, c3, 'REFUNDED', '2031-03-11T05:00:00Z');
    await retItem(r4, i4, '2.000');

    const grn = async (n: string, warehouse: string, status: string, receivedAt: string): Promise<void> => {
      await tx.query(
        `INSERT INTO goods_receipts (grn_number, purchase_order_id, warehouse_id, farmer_id, status,
                                     gross_qty_kg, received_by, received_at)
         VALUES ($1, $2, $3, $4, $5::grn_status, 10, $6, $7)`,
        [`GRN-${n}-${stamp}`, newId(), warehouse, newId(), status, newId(), receivedAt],
      );
    };
    await grn('1', coon, 'ACCEPTED', '2031-03-10T10:00:00Z');
    await grn('2', coon, 'ACCEPTED', '2031-03-10T11:00:00Z');
    await grn('3', coon, 'REJECTED', '2031-03-10T20:00:00Z'); // IST 03-11
    await grn('4', kota, 'ACCEPTED', '2031-03-11T05:00:00Z');
    await grn('5', coon, 'ACCEPTED', '2031-03-12T18:30:00Z'); // IST 03-13, outside

    const batch = async (n: string, warehouse: string, crop: string, avail: string, status: string): Promise<void> => {
      await tx.query(
        `INSERT INTO inventory_batches (batch_code, warehouse_id, crop_id, grade, source_farmer_id,
                                        qty_received, qty_available, status)
         VALUES ($1, $2, $3, 'GRADE_1', $4, 100, $5, $6)`,
        [`B-${n}-${stamp}`, warehouse, crop, newId(), avail, status],
      );
    };
    await batch('1', coon, cropA, '10.500', 'ACTIVE');
    await batch('2', coon, cropA, '4.250', 'ACTIVE');
    await batch('3', coon, cropA, '3.000', 'EXPIRED');
    await batch('4', coon, cropA, '0.000', 'DEPLETED');
    await batch('5', kota, cropB, '1.000', 'ACTIVE');

    const topup = async (n: string, channel: string, status: string, amount: string, warehouse: string, createdAt: string): Promise<void> => {
      const cash = channel === 'CASH';
      await tx.query(
        `INSERT INTO topups (wallet_id, channel, amount, fiscal_cash_tag, warehouse_id, processed_by, status, created_at)
         VALUES ($1, $2::topup_channel, $3, $4, $5, $6, $7, $8)`,
        [newId(), channel, amount, cash ? `FT-${n}-${stamp}` : null, warehouse, cash ? newId() : null, status, createdAt],
      );
    };
    await topup('1', 'CASH', 'SUCCESS', '100.50', coon, '2031-03-10T10:00:00Z');
    await topup('2', 'CASH', 'SUCCESS', '200.25', coon, '2031-03-10T20:00:00Z'); // IST 03-11
    await topup('3', 'CASH', 'PENDING', '999.00', coon, '2031-03-10T10:00:00Z');
    await topup('4', 'UPI', 'SUCCESS', '888.00', coon, '2031-03-10T10:00:00Z');
    await topup('5', 'CASH', 'SUCCESS', '50.00', kota, '2031-03-11T05:00:00Z');
    await topup('6', 'CASH', 'FAILED', '777.00', coon, '2031-03-11T05:00:00Z');

    // Finance: revenue is a PAID order in DELIVERED or PICKED_UP, dated by completed_at.
    const paid = (n: string, warehouse: string, o: { channel: string; method: string; total: string; completedAt: string; status?: string; payment?: string }) =>
      order(`F${n}`, warehouse, c1, {
        channel: o.channel,
        status: o.status ?? 'DELIVERED',
        total: o.total,
        placedAt: '2031-05-09T00:00:00Z',
        paymentMethod: o.method,
        paymentStatus: o.payment ?? 'PAID',
        completedAt: o.completedAt,
      });
    await paid('1', coon, { channel: 'ONLINE', method: 'UPI', total: '100.10', completedAt: '2031-05-10T10:00:00Z' });
    await paid('2', coon, { channel: 'MARKET', method: 'CASH', total: '0.05', completedAt: '2031-05-10T20:00:00Z', status: 'PICKED_UP' }); // IST 05-11
    await paid('3', coon, { channel: 'ONLINE', method: 'UPI', total: '200.20', completedAt: '2031-05-11T05:00:00Z' });
    await paid('4', kota, { channel: 'ONLINE', method: 'WALLET', total: '1000.00', completedAt: '2031-05-11T05:00:00Z' });
    await paid('5', coon, { channel: 'ONLINE', method: 'UPI', total: '999.00', completedAt: '2031-05-11T05:00:00Z', payment: 'PENDING' }); // not paid
    await paid('6', coon, { channel: 'ONLINE', method: 'UPI', total: '888.00', completedAt: '2031-05-11T05:00:00Z', status: 'CONFIRMED' }); // not completed

    const cats = await tx.query<{ id: string; name: string }>(`SELECT id, name FROM expense_categories`);
    const cat = new Map(cats.rows.map((c) => [c.name, c.id]));
    const expense = async (o: {
      warehouse: string;
      category: string;
      categoryId: string | null;
      amount: string;
      date: string;
      method: string | null;
      status?: string;
      createdAt: string;
      deleted?: boolean;
    }): Promise<void> => {
      await tx.query(
        `INSERT INTO expenses (warehouse_id, category, category_id, amount, expense_date, payment_method, status,
                               recorded_by, created_at, deleted_at, vendor, description)
         VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, $9::timestamptz, CASE WHEN $10::boolean THEN now() END,
                 'Vendor Secret', 'Description Secret')`,
        [o.warehouse, o.category, o.categoryId, o.amount, o.date, o.method, o.status ?? 'RECORDED', SEEDED_USER, o.createdAt, o.deleted ?? false],
      );
    };
    await expense({ warehouse: coon, category: 'Transport', categoryId: cat.get('Transport')!, amount: '10.10', date: '2031-05-10', method: 'CASH', createdAt: '2031-05-10T01:00:00Z' });
    await expense({ warehouse: coon, category: 'Other', categoryId: cat.get('Other')!, amount: '20.20', date: '2031-05-11', method: 'UPI', status: 'APPROVED', createdAt: '2031-05-11T08:00:00Z' });
    await expense({ warehouse: kota, category: 'Transport', categoryId: cat.get('Transport')!, amount: '5.00', date: '2031-05-11', method: 'BANK', createdAt: '2031-05-11T09:00:00Z' });
    await expense({ warehouse: coon, category: 'Transport', categoryId: cat.get('Transport')!, amount: '999.00', date: '2031-05-11', method: 'CASH', createdAt: '2031-05-11T10:00:00Z', deleted: true });
    await expense({ warehouse: coon, category: 'Maintenance', categoryId: null, amount: '1.05', date: '2031-05-12', method: null, createdAt: '2031-05-12T01:00:00Z' });
    await expense({ warehouse: coon, category: 'Transport', categoryId: cat.get('Transport')!, amount: '777.00', date: '2031-05-13', method: 'CASH', createdAt: '2031-05-13T01:00:00Z' }); // outside

    return { coon, kota, cropA, cropB, customer: person };
  }

  const exportOf = async (tx: Executor, scope: ResolvedScope, request: ExportRequest): Promise<string> =>
    (await (await serviceOn(tx)).exportReport(scope, request)).csv;

  it('BR-76a: sales CSV, Main, all warehouses: exact sums in 2dp strings, Kolkata-day buckets, lifecycle status order', async () => {
    await inRolledBackTx(async (tx) => {
      await seedWorld(tx);
      const csv = await exportOf(tx, mainScope(ScopeLevel.OWN, 'order.list.view_all'), requestFor('sales', MAIN_RANGE));
      expect(csv).toBe(
        lines(
          'section,key,order_count,total_amount',
          'summary,all,4,1300.35',
          'day,2031-03-10,1,100.10',
          // o2 was placed at 20:00 UTC = 01:30 IST the next morning: 200.20 + 0.05 + 1000.00.
          'day,2031-03-11,3,1200.25',
          'channel,MARKET,1,0.05',
          'channel,ONLINE,3,1300.30',
          'status,CONFIRMED,1,',
          'status,DELIVERED,2,',
          'status,CANCELLED,1,',
        ),
      );
    });
  });

  it('BR-76a: sales CSV honours the channel filter', async () => {
    await inRolledBackTx(async (tx) => {
      await seedWorld(tx);
      const csv = await exportOf(tx, mainScope(ScopeLevel.ALL, 'order.list.view_all'), {
        report: 'sales',
        query: { ...MAIN_RANGE, channel: 'MARKET' },
      });
      expect(csv).toBe(
        lines(
          'section,key,order_count,total_amount',
          'summary,all,1,0.05',
          'day,2031-03-11,1,0.05',
          'channel,MARKET,1,0.05',
          'status,DELIVERED,1,',
        ),
      );
    });
  });

  it('BR-76a: receiving CSV, Main', async () => {
    await inRolledBackTx(async (tx) => {
      await seedWorld(tx);
      const csv = await exportOf(tx, mainScope(ScopeLevel.ALL, 'inventory.goods_receipt.record'), requestFor('receiving', MAIN_RANGE));
      expect(csv).toBe(
        lines('date,status,grn_count', '2031-03-10,ACCEPTED,2', '2031-03-11,ACCEPTED,1', '2031-03-11,REJECTED,1'),
      );
    });
  });

  it('BR-76a: inventory CSV, Main: active batches only, quantities with 3 decimals, ordered by crop name', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const csv = await exportOf(tx, mainScope(ScopeLevel.ALL, 'inventory.batch.view'), requestFor('inventory', MAIN_RANGE));
      expect(csv).toBe(
        lines(
          'crop_id,crop_name,total_qty_kg,batch_count',
          `${w.cropA},Apple,14.750,2`,
          `${w.cropB},Banana,1.000,1`,
        ),
      );
    });
  });

  it('BR-76a: returns CSV, Main: counts by status and day, and the refunded total of REFUNDED returns only', async () => {
    await inRolledBackTx(async (tx) => {
      await seedWorld(tx);
      const csv = await exportOf(tx, mainScope(ScopeLevel.ALL, 'rma.request.process'), requestFor('returns', MAIN_RANGE));
      expect(csv).toBe(
        lines(
          'section,key,return_count,refunded_amount',
          // 35.50 (r1) + 20.00 (r4); the REJECTED return's accepted quantity is not refunded.
          'summary,all,4,55.50',
          'status,PENDING,1,',
          'status,REJECTED,1,',
          'status,REFUNDED,2,',
          'day,2031-03-10,1,',
          'day,2031-03-11,3,',
        ),
      );
    });
  });

  it('BR-76a: customers CSV, Main: counts only', async () => {
    await inRolledBackTx(async (tx) => {
      await seedWorld(tx);
      const csv = await exportOf(tx, mainScope(ScopeLevel.OWN, 'customer.list.view'), requestFor('customers', MAIN_RANGE));
      expect(csv).toBe(
        lines(
          'section,key,customer_count',
          'summary,customers_with_orders,3',
          'summary,new_customers,3',
          'day,2031-03-10,1',
          'day,2031-03-11,3',
        ),
      );
    });
  });

  it('BR-76a: cash-topups CSV, Main: only SUCCESS CASH top-ups', async () => {
    await inRolledBackTx(async (tx) => {
      await seedWorld(tx);
      const csv = await exportOf(tx, mainScope(ScopeLevel.ALL, 'wallet.cash_topup.process'), requestFor('cash-topups', MAIN_RANGE));
      expect(csv).toBe(
        lines(
          'section,key,topup_count,total_amount',
          'summary,all,3,350.75',
          'day,2031-03-10,1,100.50',
          'day,2031-03-11,2,250.25',
        ),
      );
    });
  });

  it('BR-76a: finance-revenue CSV, Main: paid and completed orders only, dated by the Kolkata day of completion', async () => {
    await inRolledBackTx(async (tx) => {
      await seedWorld(tx);
      const csv = await exportOf(tx, mainScope(ScopeLevel.OWN, 'finance.sales_income.view'), requestFor('finance-revenue', FINANCE_RANGE));
      expect(csv).toBe(
        lines(
          'section,key,order_count,total_amount',
          'summary,all,4,1300.35',
          'day,2031-05-10,1,100.10',
          'day,2031-05-11,3,1200.25',
          'channel,MARKET,1,0.05',
          'channel,ONLINE,3,1300.30',
          'payment_method,CASH,1,0.05',
          'payment_method,UPI,2,300.30',
          'payment_method,WALLET,1,1000.00',
        ),
      );
    });
  });

  it('BR-76a: finance-expenses CSV, Main: non-deleted expenses in range, legacy rows with no payment method have an empty key', async () => {
    await inRolledBackTx(async (tx) => {
      await seedWorld(tx);
      const csv = await exportOf(tx, mainScope(ScopeLevel.ALL, 'finance.expense.log'), requestFor('finance-expenses', FINANCE_RANGE));
      expect(csv).toBe(
        lines(
          'section,key,expense_count,total_amount',
          'summary,all,4,36.35',
          'day,2031-05-10,1,10.10',
          'day,2031-05-11,2,25.20',
          'day,2031-05-12,1,1.05',
          'category,Maintenance,1,1.05',
          'category,Other,1,20.20',
          'category,Transport,2,15.10',
          'payment_method,BANK,1,5.00',
          'payment_method,CASH,1,10.10',
          'payment_method,UPI,1,20.20',
          'payment_method,,1,1.05',
        ),
      );
    });
  });

  it('BR-76a: expenses CSV, Main: one row per expense, newest first, free text (vendor, description) not exported', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const csv = await exportOf(tx, mainScope(ScopeLevel.ALL, 'finance.expense.log'), requestFor('expenses', FINANCE_RANGE));
      const rows = parseCsv(csv);
      expect(rows[0]).toEqual(['expense_id', 'warehouse_id', 'expense_date', 'category', 'amount', 'payment_method', 'status']);
      expect(rows.slice(1).map(([, warehouse, date, category, amount, method, status]) => [warehouse, date, category, amount, method, status])).toEqual([
        [w.coon, '2031-05-12', 'Maintenance', '1.05', '', 'RECORDED'],
        [w.kota, '2031-05-11', 'Transport', '5.00', 'BANK', 'RECORDED'],
        [w.coon, '2031-05-11', 'Other', '20.20', 'UPI', 'APPROVED'],
        [w.coon, '2031-05-10', 'Transport', '10.10', 'CASH', 'RECORDED'],
      ]);
      for (const row of rows.slice(1)) expect(row[0]).toMatch(/^[0-9a-f-]{36}$/);
      expect(csv).not.toContain('Secret');
    });
  });

  it('BR-76a: expenses CSV honours the category, payment method and status filters', async () => {
    await inRolledBackTx(async (tx) => {
      await seedWorld(tx);
      const main = mainScope(ScopeLevel.ALL, 'finance.expense.log');
      const byMethod = parseCsv(await exportOf(tx, main, { report: 'expenses', query: { ...FINANCE_RANGE, paymentMethod: 'UPI' } }));
      expect(byMethod.slice(1).map((r) => r[4])).toEqual(['20.20']);
      const byStatus = parseCsv(await exportOf(tx, main, { report: 'expenses', query: { ...FINANCE_RANGE, status: 'APPROVED' } }));
      expect(byStatus.slice(1).map((r) => r[4])).toEqual(['20.20']);
      const { rows } = await tx.query<{ id: string }>(`SELECT id FROM expense_categories WHERE name = 'Transport'`);
      const byCategory = parseCsv(await exportOf(tx, main, { report: 'expenses', query: { ...FINANCE_RANGE, categoryId: rows[0]!.id } }));
      expect(byCategory.slice(1).map((r) => r[4])).toEqual(['5.00', '10.10']);
    });
  });

  it('BR-76b: a Sub admin gets only its own warehouse in every export, even where its grant is `all`', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const level = (report: ExportReport): ResolvedScope['level'] =>
        ['receiving', 'returns', 'cash-topups'].includes(report) ? ScopeLevel.ALL : ScopeLevel.OWN;
      const csvs = new Map<ExportReport, string>();
      for (const report of exportReports) {
        const range = report.startsWith('finance') || report === 'expenses' ? FINANCE_RANGE : MAIN_RANGE;
        csvs.set(report, await exportOf(tx, subScope(level(report), w.coon, DATA_PERMISSION[report]), requestFor(report, range)));
      }
      expect(csvs.get('sales')).toBe(
        lines(
          'section,key,order_count,total_amount',
          'summary,all,3,300.35',
          'day,2031-03-10,1,100.10',
          'day,2031-03-11,2,200.25',
          'channel,MARKET,1,0.05',
          'channel,ONLINE,2,300.30',
          'status,CONFIRMED,1,',
          'status,DELIVERED,2,',
        ),
      );
      expect(csvs.get('receiving')).toBe(lines('date,status,grn_count', '2031-03-10,ACCEPTED,2', '2031-03-11,REJECTED,1'));
      expect(csvs.get('inventory')).toBe(lines('crop_id,crop_name,total_qty_kg,batch_count', `${w.cropA},Apple,14.750,2`));
      expect(csvs.get('returns')).toBe(
        lines(
          'section,key,return_count,refunded_amount',
          'summary,all,3,35.50',
          'status,PENDING,1,',
          'status,REJECTED,1,',
          'status,REFUNDED,1,',
          'day,2031-03-10,1,',
          'day,2031-03-11,2,',
        ),
      );
      expect(csvs.get('customers')).toBe(
        lines(
          'section,key,customer_count',
          'summary,customers_with_orders,2',
          'summary,new_customers,2',
          'day,2031-03-10,1',
          'day,2031-03-11,2',
        ),
      );
      expect(csvs.get('cash-topups')).toBe(
        lines('section,key,topup_count,total_amount', 'summary,all,2,300.75', 'day,2031-03-10,1,100.50', 'day,2031-03-11,1,200.25'),
      );
      expect(csvs.get('finance-revenue')).toBe(
        lines(
          'section,key,order_count,total_amount',
          'summary,all,3,300.35',
          'day,2031-05-10,1,100.10',
          'day,2031-05-11,2,200.25',
          'channel,MARKET,1,0.05',
          'channel,ONLINE,2,300.30',
          'payment_method,CASH,1,0.05',
          'payment_method,UPI,2,300.30',
        ),
      );
      expect(csvs.get('finance-expenses')).toBe(
        lines(
          'section,key,expense_count,total_amount',
          'summary,all,3,31.35',
          'day,2031-05-10,1,10.10',
          'day,2031-05-11,1,20.20',
          'day,2031-05-12,1,1.05',
          'category,Maintenance,1,1.05',
          'category,Other,1,20.20',
          'category,Transport,1,10.10',
          'payment_method,CASH,1,10.10',
          'payment_method,UPI,1,20.20',
          'payment_method,,1,1.05',
        ),
      );
      const expenses = parseCsv(csvs.get('expenses')!);
      expect(expenses.slice(1).map((r) => r[1])).toEqual([w.coon, w.coon, w.coon]);
    });
  });

  it('BR-76b: a Sub admin asking for the other warehouse gets 404 for every export, against the real database', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await serviceOn(tx);
      for (const report of exportReports) {
        const range = report.startsWith('finance') || report === 'expenses' ? FINANCE_RANGE : MAIN_RANGE;
        await expectAppError(
          service.exportReport(subScope(ScopeLevel.OWN, w.coon, DATA_PERMISSION[report]), requestFor(report, range, w.kota)),
          'NOT_FOUND',
          404,
        );
      }
    });
  });

  it('BR-76c: a Main admin may narrow every export to one warehouse, and the file is named after it', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await serviceOn(tx);
      const main = mainScope(ScopeLevel.ALL, 'order.list.view_all');
      const sales = await service.exportReport(main, requestFor('sales', MAIN_RANGE, w.kota));
      expect(sales.filename).toBe('sales_WH-KOTA_2031-03-10_2031-03-12.csv');
      expect(sales.csv).toBe(
        lines(
          'section,key,order_count,total_amount',
          'summary,all,1,1000.00',
          'day,2031-03-11,1,1000.00',
          'channel,ONLINE,1,1000.00',
          'status,CANCELLED,1,',
        ),
      );
      const revenue = await service.exportReport(mainScope(ScopeLevel.OWN, 'finance.sales_income.view'), requestFor('finance-revenue', FINANCE_RANGE, w.kota));
      expect(revenue.csv).toBe(
        lines(
          'section,key,order_count,total_amount',
          'summary,all,1,1000.00',
          'day,2031-05-11,1,1000.00',
          'channel,ONLINE,1,1000.00',
          'payment_method,WALLET,1,1000.00',
        ),
      );
      const expenses = await service.exportReport(mainScope(ScopeLevel.ALL, 'finance.expense.log'), requestFor('expenses', FINANCE_RANGE, w.kota));
      expect(parseCsv(expenses.csv).slice(1).map((r) => [r[1], r[4]])).toEqual([[w.kota, '5.00']]);
      expect(expenses.filename).toBe('expenses_WH-KOTA_2031-05-10_2031-05-12.csv');
    });
  });

  it('BR-76c: a Main admin asking for a warehouse id that does not exist gets 404', async () => {
    await inRolledBackTx(async (tx) => {
      const service = await serviceOn(tx);
      await expectAppError(
        service.exportReport(mainScope(ScopeLevel.ALL, 'order.list.view_all'), requestFor('sales', MAIN_RANGE, newId())),
        'NOT_FOUND',
        404,
      );
    });
  });

  it('BR-76d: a crop name that starts with = + - @ is quote-prefixed in the inventory export', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const main = mainScope(ScopeLevel.ALL, 'inventory.batch.view');
      for (const name of ['=HYPERLINK("http://evil","x")', '+1', '-2+3', '@SUM(1)']) {
        await tx.query(`UPDATE crop_master SET name = $1 WHERE id = $2`, [name, w.cropB]);
        const rows = parseCsv(await exportOf(tx, main, requestFor('inventory', MAIN_RANGE)));
        const row = rows.find((r) => r[0] === w.cropB)!;
        expect(row[1], name).toBe(`'${name}`);
      }
    });
  });

  it('BR-76e: a crop name holding a comma, a double quote and a newline round-trips through RFC 4180 quoting', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const name = 'Big, "red"\nApple';
      await tx.query(`UPDATE crop_master SET name = $1 WHERE id = $2`, [name, w.cropB]);
      const csv = await exportOf(tx, mainScope(ScopeLevel.ALL, 'inventory.batch.view'), requestFor('inventory', MAIN_RANGE));
      expect(csv).toContain('"Big, ""red""\nApple"');
      const rows = parseCsv(csv);
      expect(rows.every((r) => r.length === 4)).toBe(true);
      expect(rows.find((r) => r[0] === w.cropB)![1]).toBe(name);
    });
  });

  it('BR-76f: with export_max_rows set in the database, one row over is 422 and exactly the cap is allowed; the table is never truncated', async () => {
    await inRolledBackTx(async (tx) => {
      await seedWorld(tx);
      const service = await serviceOn(tx);
      const main = mainScope(ScopeLevel.ALL, 'order.list.view_all');

      await tx.query(`UPDATE system_config SET value = '8'::jsonb WHERE key = 'export_max_rows'`);
      const exact = await service.exportReport(main, requestFor('sales', MAIN_RANGE));
      expect(exact.rowCount).toBe(8);
      expect(parseCsv(exact.csv)).toHaveLength(9);

      await tx.query(`UPDATE system_config SET value = '7'::jsonb WHERE key = 'export_max_rows'`);
      const error = await expectAppError(service.exportReport(main, requestFor('sales', MAIN_RANGE)), 'VALIDATION_FAILED', 422);
      expect(error.errors?.['query.to']?.[0]).toMatch(/narrow/i);
    });
  });

  it('BR-76f: the expense list export applies the cap too (4 expenses: cap 4 allowed, cap 3 is 422)', async () => {
    await inRolledBackTx(async (tx) => {
      await seedWorld(tx);
      const service = await serviceOn(tx);
      const main = mainScope(ScopeLevel.ALL, 'finance.expense.log');
      await tx.query(`UPDATE system_config SET value = '4'::jsonb WHERE key = 'export_max_rows'`);
      expect((await service.exportReport(main, requestFor('expenses', FINANCE_RANGE))).rowCount).toBe(4);
      await tx.query(`UPDATE system_config SET value = '3'::jsonb WHERE key = 'export_max_rows'`);
      await expectAppError(service.exportReport(main, requestFor('expenses', FINANCE_RANGE)), 'VALIDATION_FAILED', 422);
    });
  });

  it('BR-76f: the migration seeds export_max_rows as 50000, and a missing row falls back to 50000', async () => {
    await inRolledBackTx(async (tx) => {
      expect(await reportExportsRepo.getMaxRows(tx)).toBe(50000);
      await tx.query(`DELETE FROM system_config WHERE key = 'export_max_rows'`);
      expect(await reportExportsRepo.getMaxRows(tx)).toBe(50000);
    });
  });

  it('BR-76g: the customers export carries counts only: no name, phone, e-mail, customer code or address of anyone', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const main = mainScope(ScopeLevel.OWN, 'customer.list.view');
      const csv = await exportOf(tx, main, requestFor('customers', MAIN_RANGE));
      expect(parseCsv(csv)[0]).toEqual(['section', 'key', 'customer_count']);
      for (const secret of [w.customer.name, w.customer.mobile, w.customer.code, 'Other', '@', 'C-1-', 'C-PII']) {
        expect(csv, secret).not.toContain(secret);
      }
      // And no export of any kind leaks the fixture customer.
      for (const report of exportReports) {
        const range = report.startsWith('finance') || report === 'expenses' ? FINANCE_RANGE : MAIN_RANGE;
        const text = await exportOf(tx, mainScope(ScopeLevel.ALL, DATA_PERMISSION[report]), requestFor(report, range));
        for (const secret of [w.customer.name, w.customer.mobile, w.customer.code]) expect(text, `${report}: ${secret}`).not.toContain(secret);
      }
    });
  });

  it('BR-76h: an export writes exactly one report.export audit row on the request transaction, masked to report, warehouse, range and row count', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await serviceOn(tx);
      const before = await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log WHERE action_code = 'report.export'`);

      const result = await service.exportReport(mainScope(ScopeLevel.ALL, 'order.list.view_all'), requestFor('sales', MAIN_RANGE, w.coon));
      const rows = await tx.query<{
        actor_id: string;
        actor_role: string;
        entity_type: string;
        entity_id: string | null;
        warehouse_id: string | null;
        outcome: string;
        before: unknown;
        after: unknown;
      }>(`SELECT actor_id, actor_role, entity_type, entity_id, warehouse_id, outcome, before, after FROM audit_log WHERE action_code = 'report.export' ORDER BY created_at DESC LIMIT 1`);
      const after = await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log WHERE action_code = 'report.export'`);
      expect(after.rows[0]!.n).toBe(before.rows[0]!.n + 1);
      expect(rows.rows[0]).toEqual({
        actor_id: SEEDED_USER,
        actor_role: RoleCode.MAIN_WH_ADMIN,
        entity_type: 'report_export',
        entity_id: null,
        warehouse_id: w.coon,
        outcome: 'ALLOWED',
        before: null,
        after: { report: 'sales', warehouseId: w.coon, from: '2031-03-10', to: '2031-03-12', rowCount: result.rowCount },
      });
      expect(JSON.stringify(rows.rows[0]!.after)).not.toContain('Private');
    });
  });

  it('BR-76h: an export that is refused (404, 422) writes no audit row', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await serviceOn(tx);
      const count = async (): Promise<number> =>
        (await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log WHERE action_code = 'report.export'`)).rows[0]!.n;
      const start = await count();
      await expectAppError(service.exportReport(subScope(ScopeLevel.OWN, w.coon, 'order.list.view_all'), requestFor('sales', MAIN_RANGE, w.kota)), 'NOT_FOUND', 404);
      await tx.query(`UPDATE system_config SET value = '0'::jsonb WHERE key = 'export_max_rows'`);
      await expectAppError(service.exportReport(mainScope(ScopeLevel.ALL, 'order.list.view_all'), requestFor('sales', MAIN_RANGE)), 'VALIDATION_FAILED', 422);
      expect(await count()).toBe(start);
    });
  });

  it('BR-76k: a warehouse code with unsafe characters never reaches the file name', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      await tx.query(`UPDATE warehouses SET code = $1 WHERE id = $2`, ['W/H "x"\r\n;é', w.coon]);
      const result = await (await serviceOn(tx)).exportReport(mainScope(ScopeLevel.ALL, 'order.list.view_all'), requestFor('sales', MAIN_RANGE, w.coon));
      expect(result.filename).toMatch(/^sales_[A-Za-z0-9_-]+_2031-03-10_2031-03-12\.csv$/);
    });
  });
});

// ---------------------------------------------------------------------------
// 6. HTTP through the real router
// ---------------------------------------------------------------------------
describeIfDatabase('Report exports routes (real app router, PostgreSQL)', () => {
  let app: Express;
  let server: Server;
  const tokens: Record<string, string> = {};
  let coonoorId = '';
  let kotagiriId = '';
  // A range no data can occupy, so a committed export of it is a header-only file.
  const EMPTY = 'from=2041-01-01&to=2041-01-02';

  const urlFor = (report: ExportReport, extra = ''): string =>
    report === 'inventory'
      ? `/v1/admin/exports/inventory${extra === '' ? '' : `?${extra}`}`
      : `/v1/admin/exports/${report}?${EMPTY}${extra === '' ? '' : `&${extra}`}`;

  beforeAll(async () => {
    expect(await databaseReady('goods_receipts'), 'the database is reachable and migrated').toBe(true);
    const [{ createApp }, { signAccessToken }, { pool }] = await Promise.all([
      import('../../app.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
    ]);
    app = createApp();
    server = app.listen(0);
    const wh = await pool.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-COON', 'WH-KOTA')`);
    coonoorId = wh.rows.find((w) => w.code === 'WH-COON')!.id;
    kotagiriId = wh.rows.find((w) => w.code === 'WH-KOTA')!.id;

    const base = { farmerId: null, customerId: null };
    tokens['subCoonoor'] = signAccessToken({ sub: SEEDED_USER, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: coonoorId }], ...base });
    tokens['main'] = signAccessToken({ sub: SEEDED_USER, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], ...base });
    tokens['super'] = signAccessToken({ sub: SEEDED_USER, roles: [{ code: RoleCode.SUPER_ADMIN }], ...base });
    tokens['farmer'] = signAccessToken({ sub: SEEDED_USER, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null });
    tokens['customer'] = signAccessToken({ sub: SEEDED_USER, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() });
    tokens['farmerAdmin'] = signAccessToken({ sub: SEEDED_USER, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base });
  });

  afterAll(async () => {
    const [{ closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  const auth = (name: string): string => `Bearer ${tokens[name]!}`;
  const auditCount = async (): Promise<number> => {
    const { pool } = await import('../../db/pool.js');
    const r = await pool.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log WHERE action_code = 'report.export'`);
    return r.rows[0]!.n;
  };

  it.each(exportReports)('BR-76i: GET /v1/admin/exports/%s is 401 without a token and 403 for FARMER, CUSTOMER and FARMER_ADMIN, with no audit row', async (report) => {
    const start = await auditCount();
    const anonymous = await request(server).get(urlFor(report));
    expect(anonymous.status).toBe(401);
    for (const role of ['farmer', 'customer', 'farmerAdmin']) {
      const res = await request(server).get(urlFor(report)).set('Authorization', auth(role));
      expect(res.status, `${report} as ${role}: ${JSON.stringify(res.body)}`).toBe(403);
      expect(res.headers['content-type']).toContain('application/problem+json');
    }
    expect(await auditCount()).toBe(start);
  });

  it.each(exportReports)('BR-76i: %s answers a Main admin (report.export.file is `view`: a GET is allowed) with a CSV attachment and writes one audit row', async (report) => {
    const start = await auditCount();
    const res = await request(server).get(urlFor(report)).set('Authorization', auth('main'));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
    const expectedName = report === 'inventory' ? 'inventory_all_current.csv' : `${report}_all_2041-01-01_2041-01-02.csv`;
    expect(res.headers['content-disposition']).toBe(`attachment; filename="${expectedName}"`);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    const text = res.text;
    expect(text.endsWith('\r\n')).toBe(true);
    const rows = parseCsv(text);
    expect(rows.every((r) => r.length === rows[0]!.length)).toBe(true);
    if (report !== 'inventory') {
      // Summary rows are always present for the aggregate reports, the expense list is empty.
      expect(rows.length).toBeGreaterThanOrEqual(1);
    }
    expect(await auditCount()).toBe(start + 1);
  });

  it('BR-76i: a Sub admin gets a CSV named after its warehouse, and 404 (problem+json) for another warehouse, in every report', async () => {
    for (const report of exportReports) {
      const own = await request(server).get(urlFor(report, `warehouseId=${coonoorId}`)).set('Authorization', auth('subCoonoor'));
      expect(own.status, `${report}: ${JSON.stringify(own.body)}`).toBe(200);
      expect(own.headers['content-disposition']).toContain('_WH-COON_');
      const noParam = await request(server).get(urlFor(report)).set('Authorization', auth('subCoonoor'));
      expect(noParam.status, report).toBe(200);
      expect(noParam.headers['content-disposition']).toContain('_WH-COON_');
      const foreign = await request(server).get(urlFor(report, `warehouseId=${kotagiriId}`)).set('Authorization', auth('subCoonoor'));
      expect(foreign.status, report).toBe(404);
      expect(foreign.headers['content-type']).toContain('application/problem+json');
      expect(foreign.body.code).toBe('NOT_FOUND');
    }
  });

  it('BR-76i: a Super admin may export; a customer token is 403 even on sales, where its own grants overlap', async () => {
    const ok = await request(server).get(urlFor('sales')).set('Authorization', auth('super'));
    expect(ok.status).toBe(200);
    const customer = await request(server).get(urlFor('sales')).set('Authorization', auth('customer'));
    expect(customer.status).toBe(403);
  });

  it('BR-76i: an unknown report is 404 and a write verb is 404, with no audit row', async () => {
    const start = await auditCount();
    const unknown = await request(server).get(`/v1/admin/exports/everything?${EMPTY}`).set('Authorization', auth('main'));
    expect(unknown.status).toBe(404);
    const post = await request(server).post(urlFor('sales')).set('Authorization', auth('main')).send({});
    expect(post.status).toBe(404);
    expect(await auditCount()).toBe(start);
  });

  it('BR-76j: range validation is 422 through the router and writes no audit row', async () => {
    const start = await auditCount();
    const get = (path: string) => request(server).get(path).set('Authorization', auth('main'));
    for (const path of [
      '/v1/admin/exports/sales',
      '/v1/admin/exports/sales?from=2031-03-10',
      '/v1/admin/exports/sales?to=2031-03-10',
      '/v1/admin/exports/sales?from=2031-02-30&to=2031-03-10',
      '/v1/admin/exports/sales?from=2031-03-12&to=2031-03-10',
      '/v1/admin/exports/sales?from=2031-03-10&to=2031-03-12&warehouseId=nope',
      '/v1/admin/exports/sales?from=2031-03-10&to=2031-03-12&surprise=1',
      '/v1/admin/exports/finance-revenue?from=2031-03-10',
      '/v1/admin/exports/expenses?from=2031-03-10&to=2031-03-12&paymentMethod=CHEQUE',
      '/v1/admin/exports/inventory?from=2031-03-12&to=2031-03-10',
      '/v1/admin/exports/sales?from=2031-01-01&to=2033-01-01',
      '/v1/admin/exports/finance-expenses?from=2031-01-01&to=2033-01-01',
    ]) {
      const res = await get(path);
      expect(res.status, path).toBe(422);
      expect(res.body.code, path).toBe('VALIDATION_FAILED');
    }
    expect(await auditCount()).toBe(start);
  });

  it('BR-76f: an export over export_max_rows is 422 through the router and writes no audit row (config changed in a committed transaction, restored after)', async () => {
    const { pool } = await import('../../db/pool.js');
    const start = await auditCount();
    await pool.query(`UPDATE system_config SET value = '0'::jsonb WHERE key = 'export_max_rows'`);
    try {
      // The sales summary row alone is over a cap of 0.
      const res = await request(server).get(urlFor('sales')).set('Authorization', auth('main'));
      expect(res.status).toBe(422);
      expect(res.body.errors['query.to'][0]).toMatch(/narrow/i);
    } finally {
      await pool.query(`UPDATE system_config SET value = '50000'::jsonb WHERE key = 'export_max_rows'`);
    }
    expect(await auditCount()).toBe(start);
  });
});
