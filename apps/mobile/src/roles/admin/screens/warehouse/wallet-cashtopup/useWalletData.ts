/**
 * The wallet module's data hooks: the cash top-up counter lookup, the top-up
 * write and the hub's cash top-up report. Thin wrappers only; every decision
 * is in ./mappers.ts so plain-Node vitest can test it.
 *
 * Keys are scoped by the caller's warehouse (BR-30), so one warehouse's lookup
 * can never answer another's. The lookup sends no warehouse (BR-91i).
 */
import { useMemo } from 'react';
import { getCashTopupsReport } from '../../../api/reports';
import type { CashTopupCreate, WalletTransactionDto } from '../../../api/wallet';
import { createCashTopup, lookupCustomers } from '../../../api/wallet';
import { useAdminMutation, useAdminQuery, useIdempotencyKey } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { istToday } from '../finance-expenses/mappers';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import type { PermissionCheck, WarehouseScope } from './types';
import {
  cashTopupsReportRange,
  customerLookupQuery,
  submitCashTopup,
  toCashTopupKpis,
  toTopUpCustomer,
  toWalletWarehouseScopes,
  type CashTopupKpis,
  type TopUpCustomer,
} from './mappers';

const WALLET = 'wallet';
/** The customers module's key prefix (useCustomersData.ts): the wallet summary and ledger live there. */
const CUSTOMERS = 'customers';

export interface LiveCustomerLookup {
  /** False until 2+ characters are typed (nothing is asked before). */
  hasQuery: boolean;
  customers: TopUpCustomer[];
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

/** GET /admin/wallets/cash-topup/customers/lookup for `text` (already debounced by the caller). */
export function useCustomerLookup(warehouseId: string | undefined, text: string): LiveCustomerLookup {
  const query = useMemo(() => customerLookupQuery(text), [text]);
  const result = useAdminQuery(
    adminKeys.scoped(WALLET, warehouseId, { resource: 'lookup', ...(query ?? {}) }),
    // Only runs with a query (enabled below); the fallback is never sent.
    (signal) => (query === null ? Promise.resolve({ items: [] }) : lookupCustomers(query, signal)),
    { enabled: query !== null },
  );
  const customers = useMemo(() => (result.data?.items ?? []).map(toTopUpCustomer), [result.data]);
  return {
    hasQuery: query !== null,
    customers,
    isLoading: query !== null && result.isPending,
    error: result.error,
    refresh: () => {
      void result.refetch();
    },
  };
}

export interface CashTopupVariables {
  customerId: string;
  body: CashTopupCreate;
}

export interface LiveCashTopupSubmit {
  submit: (variables: CashTopupVariables, onDone: (row: WalletTransactionDto) => void) => void;
  isPending: boolean;
  /** The last failure, for cashTopupErrorKey; null after a success or reset(). */
  error: unknown;
  /** Clear the failure (the form was edited). */
  reset: () => void;
  /** The top-up landed: the next one starts with a fresh key. */
  finish: () => void;
}

/**
 * POST /admin/wallets/{id}/cash-topup. Held by WalletFlow, not the Confirm
 * screen, so the Idempotency-Key survives going back a step: a retry of the
 * same body (customer + amount + tag + warehouse) reuses its key, an edited
 * one gets a new key (root CLAUDE.md 2.4). A success refetches the customer's
 * wallet summary and ledger and the lookup (its balance changed).
 */
export function useCashTopupSubmit(): LiveCashTopupSubmit {
  const keys = useIdempotencyKey();
  const mutation = useAdminMutation<CashTopupVariables, WalletTransactionDto>({
    mutationFn: (variables) => submitCashTopup(variables, { keyFor: keys.keyFor, post: createCashTopup }),
    invalidates: [adminKeys.module(CUSTOMERS), adminKeys.module(WALLET)],
  });
  const { mutate, isPending, error, reset } = mutation;
  return useMemo(
    () => ({
      submit: (variables: CashTopupVariables, onDone: (row: WalletTransactionDto) => void) => {
        if (isPending) return;
        mutate(variables, { onSuccess: (row) => onDone(row) });
      },
      isPending,
      error,
      reset,
      finish: () => {
        keys.reset();
        reset();
      },
    }),
    [mutate, isPending, error, reset, keys],
  );
}

export interface LiveCashTopupKpis {
  kpis: CashTopupKpis | undefined;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

/**
 * GET /admin/reports/cash-topups, month to date (wallet.cash_topup.process,
 * BR-64). `warehouseId` is scope.warehouseId for a Sub admin (BR-64a) or the
 * Main admin's picked uuid (undefined = all warehouses). Lives under the
 * wallet key, so a successful top-up (useCashTopupSubmit) refetches it.
 */
export function useCashTopupKpis(warehouseId: string | undefined, enabled: boolean): LiveCashTopupKpis {
  const today = istToday();
  const range = cashTopupsReportRange(today);
  const result = useAdminQuery(
    adminKeys.scoped(WALLET, warehouseId, { resource: 'cashTopupsReport', ...range }),
    (signal) => getCashTopupsReport({ ...range, warehouseId }, signal),
    { enabled },
  );
  const kpis = useMemo(() => (result.data === undefined ? undefined : toCashTopupKpis(result.data, today)), [result.data, today]);
  return {
    kpis,
    isLoading: enabled && result.isPending,
    error: result.error,
    refresh: () => {
      void result.refetch();
    },
  };
}

/**
 * The Main admin's warehouses (GET /warehouses, warehouse.all.view) as
 * WarehouseScope, uuids only. A Sub scope asks nothing and gets no options:
 * it collects at its own warehouse (BR-30).
 */
export function useWalletWarehouseScopes(scope: WarehouseScope, can: PermissionCheck): WarehouseScope[] {
  const warehouses = useWarehouseOptions({ enabled: scope.warehouseId === undefined && can('warehouse.all.view') });
  return useMemo(
    () => (scope.warehouseId === undefined ? toWalletWarehouseScopes(warehouses.options) : []),
    [scope.warehouseId, warehouses.options],
  );
}
