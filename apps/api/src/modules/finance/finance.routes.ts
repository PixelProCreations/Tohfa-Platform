/**
 * Module 11 (Warehouse Finance). Wiring only: requireAuth -> requirePermission -> validate -> handler.
 *
 * Three routers, mounted by app.ts:
 *  - `adminExpensesRouter`           at /v1/admin/expenses
 *  - `adminExpenseCategoriesRouter`  at /v1/admin/expense-categories
 *  - `adminFinanceRouter`            at /v1/admin/finance
 *
 * Permission codes must exist in docs/rbac.json; requirePermission throws at import time on a typo.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  createExpenseBody,
  financeIdParams,
  listExpensesQuery,
  listRevenueQuery,
  reportQuery,
} from './finance.schema.js';
import { financeService } from './finance.service.js';

export const adminExpensesRouter: Router = Router();
export const adminExpenseCategoriesRouter: Router = Router();
export const adminFinanceRouter: Router = Router();

// POST /v1/admin/expenses
adminExpensesRouter.post(
  '/',
  requireAuth,
  requirePermission('finance.expense.log'),
  validate({ body: createExpenseBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createExpenseBody);
    const { expense, replayed } = await financeService.createExpense(scope, req.header('idempotency-key'), body);
    res.status(replayed ? 200 : 201).json(expense);
  }),
);

// GET /v1/admin/expenses
adminExpensesRouter.get(
  '/',
  requireAuth,
  requirePermission('finance.expense.log'),
  validate({ query: listExpensesQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listExpensesQuery);
    res.json(await financeService.listExpenses(scope, query));
  }),
);

// GET /v1/admin/expenses/:id
adminExpensesRouter.get(
  '/:id',
  requireAuth,
  requirePermission('finance.expense.log'),
  validate({ params: financeIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', financeIdParams);
    res.json(await financeService.getExpense(scope, id));
  }),
);

// GET /v1/admin/expense-categories
adminExpenseCategoriesRouter.get(
  '/',
  requireAuth,
  requirePermission('finance.expense.log'),
  asyncHandler(async (_req, res) => {
    res.json(await financeService.listExpenseCategories());
  }),
);

// GET /v1/admin/finance/revenue
adminFinanceRouter.get(
  '/revenue',
  requireAuth,
  requirePermission('finance.sales_income.view'),
  validate({ query: listRevenueQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listRevenueQuery);
    res.json(await financeService.listRevenue(scope, query));
  }),
);

// GET /v1/admin/finance/revenue/:id
adminFinanceRouter.get(
  '/revenue/:id',
  requireAuth,
  requirePermission('finance.sales_income.view'),
  validate({ params: financeIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', financeIdParams);
    res.json(await financeService.getRevenue(scope, id));
  }),
);

// GET /v1/admin/finance/reports/revenue
adminFinanceRouter.get(
  '/reports/revenue',
  requireAuth,
  requirePermission('finance.sales_income.view'),
  validate({ query: reportQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', reportQuery);
    res.json(await financeService.revenueReport(scope, query));
  }),
);

// GET /v1/admin/finance/reports/expenses
adminFinanceRouter.get(
  '/reports/expenses',
  requireAuth,
  requirePermission('finance.expense.log'),
  validate({ query: reportQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', reportQuery);
    res.json(await financeService.expenseReport(scope, query));
  }),
);
