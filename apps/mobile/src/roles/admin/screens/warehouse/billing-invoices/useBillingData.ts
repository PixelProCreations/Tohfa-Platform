/**
 * Live data for the billing area. Thin wrappers over the admin hooks
 * (../../../api/hooks.ts); every decision lives in ./mappers.ts or the API
 * module, which are tested.
 *
 * No invoice route takes a warehouse: the server scopes the caller (BR-36; a
 * Sub admin sees the invoices of orders placed at its own warehouse, BR-30).
 * The scope's warehouse is still part of every query key, so one warehouse's
 * cached invoices never answer another warehouse's screen. Hooks that need an
 * invoice take its uuid (invoiceIdParam); without one nothing is fetched and
 * the screen shows "not found".
 */
import { useMemo } from 'react';
import { Linking } from 'react-native';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import { getInvoice, getInvoiceDownloadUrl, listInvoices, type InvoiceDto, type InvoiceType } from '../../../api/invoices';
import { adminKeys } from '../../../api/queryKeys';
import { toInvoiceDetail, toInvoiceRow } from './mappers';
import type { InvoiceDetailView, InvoiceRow } from './types';

const INVOICES = 'invoices';

/** The invoices visible to the caller, newest first; `type` is the server's InvoiceType filter. */
export function useInvoiceList(warehouseId: string | undefined, type: InvoiceType | undefined): CursorList<InvoiceRow> {
  return useCursorList<InvoiceDto, InvoiceRow>(
    adminKeys.scoped(INVOICES, warehouseId, { resource: 'list', type: type ?? null }),
    (cursor, signal) => listInvoices({ cursor, type }, signal),
    toInvoiceRow,
  );
}

export interface LiveInvoice {
  invoice: InvoiceDetailView | undefined;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

/** One invoice with its lines; 404 outside the caller's scope (BR-36). */
export function useInvoice(warehouseId: string | undefined, invoiceId: string | undefined): LiveInvoice {
  const query = useAdminQuery(
    adminKeys.scoped(INVOICES, warehouseId, { resource: 'invoice', invoiceId: invoiceId ?? null }),
    (signal) => getInvoice(invoiceId ?? '', signal),
    { enabled: invoiceId !== undefined },
  );
  const invoice = useMemo(() => (query.data === undefined ? undefined : toInvoiceDetail(query.data)), [query.data]);
  return {
    invoice,
    isLoading: invoiceId !== undefined && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching,
  };
}

export interface InvoiceDownload {
  /** Opens the invoice PDF in the device's viewer. Ignored while one is opening. */
  run: (invoiceId: string) => void;
  isPending: boolean;
  /** The last failure, for adminErrorKey (404 outside the scope, network). */
  error: unknown;
  reset: () => void;
}

/**
 * Download: GET /invoices/{id}/download?redirect=true for the signed 5-minute
 * link (api/invoices.ts), then hand it to the OS. Nothing is cached, because
 * the link expires; every tap asks for a fresh one.
 */
export function useInvoiceDownload(): InvoiceDownload {
  const mutation = useAdminMutation<string, void>({
    mutationFn: async (invoiceId) => {
      await Linking.openURL(await getInvoiceDownloadUrl(invoiceId));
    },
  });
  const { mutate, isPending, error, reset } = mutation;
  return useMemo(
    () => ({
      run: (invoiceId: string) => {
        if (!isPending) mutate(invoiceId);
      },
      isPending,
      error,
      reset,
    }),
    [mutate, isPending, error, reset],
  );
}
