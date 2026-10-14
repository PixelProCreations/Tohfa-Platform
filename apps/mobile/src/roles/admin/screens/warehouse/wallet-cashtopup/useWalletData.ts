/**
 * The cash top-up's data hooks (plan phase 9): the counter lookup and the
 * top-up write. Thin wrappers only; every decision is in ./mappers.ts so
 * plain-Node vitest can test it.
 *
 * Keys are scoped by the caller's warehouse (BR-30), so one warehouse's lookup
 * can never answer another's. The lookup sends no warehouse; the server
 * scopes it to the caller (BR-91).
 */
import { useMemo } from 'react';
import type { CashTopupCreate, WalletTransactionDto } from '../../../api/wallet';
import { createCashTopup, lookupCustomers } from '../../../api/wallet';
import { useAdminMutation, useAdminQuery, useIdempotencyKey } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { customerLookupQuery, submitCashTopup, toTopUpCustomer, type TopUpCustomer } from './mappers';

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

/** GET /admin/sales/customers/lookup for `text` (already debounced by the caller). */
export function useCustomerLookup(warehouseId: string | undefined, text: string): LiveCustomerLookup {
  const query = useMemo(() => customerLookupQuery(text), [text]);
  const result = useAdminQuery(
    adminKeys.scoped(WALLET, warehouseId, { resource: 'lookup', ...(query ?? {}) }),
    (signal) => lookupCustomers(query ?? { q: '' }, signal),
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
