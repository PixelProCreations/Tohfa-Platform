/**
 * Hooks for billing & invoices data from the real API client.
 */
import { useMemo } from 'react';
import { Linking } from 'react-native';
import { getInvoice, getInvoiceDownloadUrl, listInvoices, type InvoiceDto, type ListInvoicesParams } from '../../../api/invoices';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { mapInvoiceDetailDtoToRecord, mapInvoiceDtoToRecord } from './mappers';
import type { InvoiceDetailRecord, InvoiceRecord } from './types';

export const BILLING_MODULE = 'invoices';

export interface UseInvoicesResult {
  invoices: InvoiceRecord[];
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

export function useInvoices(params: ListInvoicesParams = {}, enabled = true): UseInvoicesResult {
  const query = useAdminQuery(
    adminKeys.scoped(BILLING_MODULE, undefined, params as Record<string, unknown>),
    (signal) => listInvoices(params, signal),
    { enabled },
  );

  const invoices = useMemo(() => {
    if (!query.data?.items) return [];
    return query.data.items.map((dto: InvoiceDto) => mapInvoiceDtoToRecord(dto));
  }, [query.data]);

  return {
    invoices,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

export interface UseInvoiceDetailResult {
  invoice: InvoiceDetailRecord | undefined;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  downloadPdf: () => Promise<void>;
}

export function useInvoiceDetail(invoiceId: string, enabled = true): UseInvoiceDetailResult {
  const query = useAdminQuery(
    adminKeys.scoped(BILLING_MODULE, undefined, { invoiceId }),
    (signal) => getInvoice(invoiceId, signal),
    { enabled: enabled && Boolean(invoiceId) },
  );

  const invoice = useMemo(() => {
    if (!query.data) return undefined;
    return mapInvoiceDetailDtoToRecord(query.data);
  }, [query.data]);

  const downloadPdf = async () => {
    const url = await getInvoiceDownloadUrl(invoiceId);
    if (url) {
      await Linking.openURL(url);
    }
  };

  return {
    invoice,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    downloadPdf,
  };
}
