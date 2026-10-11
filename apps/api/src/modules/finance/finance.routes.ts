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
import { cashCloseService } from './cash-close.service.js';
import {
  cashCloseIdParams,
  createCashCloseBody,
  dailySummaryQuery,
  listCashClosesQuery,
} from './cash-close.schema.js';
import { expenseCategoriesService } from './expense-categories.service.js';
import { expenseLifecycleService } from './expense-lifecycle.service.js';
import {
  createExpenseBody,
  createExpenseCategoryBody,
  expenseDecisionEmptyBody,
  financeIdParams,
  listExpensesQuery,
  listRevenueQuery,
  manageCategoriesQuery,
  rejectExpenseBody,
  reportQuery,
  updateExpenseCategoryBody,
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

// POST /v1/admin/expenses/:id/approve   (BR-73)
adminExpensesRouter.post(
  '/:id/approve',
  requireAuth,
  requirePermission('finance.expense.approve'),
  validate({ params: financeIdParams, body: expenseDecisionEmptyBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', financeIdParams);
    res.json(await expenseLifecycleService.approve(scope, req.header('idempotency-key'), id));
  }),
);

// POST /v1/admin/expenses/:id/reject   (BR-73)
adminExpensesRouter.post(
  '/:id/reject',
  requireAuth,
  requirePermission('finance.expense.approve'),
  validate({ params: financeIdParams, body: rejectExpenseBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', financeIdParams);
    const body = getValidated(req, 'body', rejectExpenseBody);
    res.json(await expenseLifecycleService.reject(scope, req.header('idempotency-key'), id, body));
  }),
);

// POST /v1/admin/expenses/:id/cancel   (BR-73; the recorder only, enforced by the service)
adminExpensesRouter.post(
  '/:id/cancel',
  requireAuth,
  requirePermission('finance.expense.log'),
  validate({ params: financeIdParams, body: expenseDecisionEmptyBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', financeIdParams);
    res.json(await expenseLifecycleService.cancel(scope, req.header('idempotency-key'), id));
  }),
);

// GET /v1/admin/expenses/:id/voucher   (BR-75; interim gate finance.expense.log, per SPEC_GAPS)
adminExpensesRouter.get(
  '/:id/voucher',
  requireAuth,
  requirePermission('finance.expense.log'),
  validate({ params: financeIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', financeIdParams);
    res.json(await expenseLifecycleService.getVoucher(scope, id));
  }),
);

// GET /v1/admin/expense-categories/manage   (BR-73: every category incl. inactive, with usage counts)
adminExpenseCategoriesRouter.get(
  '/manage',
  requireAuth,
  requirePermission('finance.expense_category.manage'),
  validate({ query: manageCategoriesQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', manageCategoriesQuery);
    res.json(await expenseCategoriesService.list(query));
  }),
);

// POST /v1/admin/expense-categories   (BR-73)
adminExpenseCategoriesRouter.post(
  '/',
  requireAuth,
  requirePermission('finance.expense_category.manage'),
  validate({ body: createExpenseCategoryBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createExpenseCategoryBody);
    res.status(201).json(await expenseCategoriesService.create(scope, body));
  }),
);

// PATCH /v1/admin/expense-categories/:id   (BR-73: rename, deactivate, reactivate)
adminExpenseCategoriesRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('finance.expense_category.manage'),
  validate({ params: financeIdParams, body: updateExpenseCategoryBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', financeIdParams);
    const body = getValidated(req, 'body', updateExpenseCategoryBody);
    res.json(await expenseCategoriesService.update(scope, id, body));
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

// GET /v1/admin/finance/daily-summary   (BR-74: computed, not stored)
adminFinanceRouter.get(
  '/daily-summary',
  requireAuth,
  requirePermission('finance.cash_close.manage'),
  validate({ query: dailySummaryQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', dailySummaryQuery);
    res.json(await cashCloseService.dailySummary(scope, query));
  }),
);

// POST /v1/admin/finance/cash-close   (BR-74: idempotent, one close per warehouse and day)
adminFinanceRouter.post(
  '/cash-close',
  requireAuth,
  requirePermission('finance.cash_close.manage'),
  validate({ body: createCashCloseBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createCashCloseBody);
    const { close, replayed } = await cashCloseService.close(scope, req.header('idempotency-key'), body);
    res.status(replayed ? 200 : 201).json(close);
  }),
);

// GET /v1/admin/finance/cash-close
adminFinanceRouter.get(
  '/cash-close',
  requireAuth,
  requirePermission('finance.cash_close.manage'),
  validate({ query: listCashClosesQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listCashClosesQuery);
    res.json(await cashCloseService.list(scope, query));
  }),
);

// GET /v1/admin/finance/cash-close/:id
adminFinanceRouter.get(
  '/cash-close/:id',
  requireAuth,
  requirePermission('finance.cash_close.manage'),
  validate({ params: cashCloseIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', cashCloseIdParams);
    res.json(await cashCloseService.get(scope, id));
  }),
);
