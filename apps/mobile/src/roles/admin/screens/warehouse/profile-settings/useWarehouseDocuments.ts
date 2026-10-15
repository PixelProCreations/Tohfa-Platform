/**
 * Live data for Warehouse Documents (BR-105). Thin wrappers over TanStack
 * Query; every decision lives in ./mappers_documents.ts or
 * ../../../api/warehouseDocuments.ts, which are tested.
 *
 * Every hook takes the warehouse uuid the flow picked (a Sub scope is always
 * its own, BR-30) and fetches nothing without one.
 *
 * Opening a file asks for the document detail AGAIN right before handing the
 * signed URL to the OS: the URL lives 15 minutes, so a cached one may already
 * be dead (the same rule as the invoice download in billing-invoices).
 */
import { useCallback, useMemo } from 'react';
import { Linking } from 'react-native';
import { keepPreviousData, useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { useAdminMutation, useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import {
  archiveWarehouseDocument,
  getWarehouseDocument,
  listWarehouseDocuments,
  updateWarehouseDocument,
  type UpdateWarehouseDocumentBody,
  type WarehouseDocumentListDto,
  type WarehouseDocumentStatus,
  type WarehouseDocumentType,
} from '../../../api/warehouseDocuments';
import { nextStoragePage } from './mappers';
import { openableFileUrl, toDocumentDetailView, toDocumentView, type WarehouseDocumentDetailView, type WarehouseDocumentView } from './mappers_documents';
import { queryState, useWrite, type LiveQueryState, type LiveWrite } from './useProfileData';

export const WAREHOUSE_DOCUMENTS_MODULE = 'warehouseDocuments';

/** Rows per page; the server caps pageSize at 100. */
const DOCUMENTS_PAGE_SIZE = 50;

export interface DocumentListFilter {
  status?: WarehouseDocumentStatus | undefined;
  docType?: WarehouseDocumentType | undefined;
  q?: string | undefined;
}

export interface LiveDocumentList extends LiveQueryState {
  documents: WarehouseDocumentView[];
  /** The server's total for the filter; null before the first page. */
  total: number | null;
  loadMore: () => void;
  hasMore: boolean;
}

function searchText(q: string | undefined): string | undefined {
  const trimmed = (q ?? '').trim();
  return trimmed === '' ? undefined : trimmed.slice(0, 120);
}

/** GET /warehouses/{id}/documents, page by page; the rows on screen stay while a new filter loads. */
export function useWarehouseDocumentList(warehouseId: string | undefined, filter: DocumentListFilter): LiveDocumentList {
  const q = searchText(filter.q);
  const query = useInfiniteQuery<WarehouseDocumentListDto, Error, InfiniteData<WarehouseDocumentListDto, number>, QueryKey, number>({
    queryKey: adminKeys.scoped(WAREHOUSE_DOCUMENTS_MODULE, warehouseId, {
      resource: 'list',
      status: filter.status ?? null,
      docType: filter.docType ?? null,
      q: q ?? null,
    }),
    queryFn: ({ pageParam, signal }) =>
      listWarehouseDocuments(
        warehouseId ?? '',
        { status: filter.status, docType: filter.docType, q, page: pageParam, pageSize: DOCUMENTS_PAGE_SIZE },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: nextStoragePage,
    enabled: warehouseId !== undefined,
    placeholderData: keepPreviousData,
  });
  const documents = useMemo(() => (query.data?.pages ?? []).flatMap((page) => page.items.map(toDocumentView)), [query.data]);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  return {
    isLoading: warehouseId !== undefined && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    documents,
    total: query.data?.pages[0]?.total ?? null,
    loadMore,
    hasMore: hasNextPage,
  };
}

export interface LiveDocumentDetail extends LiveQueryState {
  document: WarehouseDocumentDetailView | undefined;
}

/** GET /warehouses/{id}/documents/{documentId}; nothing without both ids. */
export function useWarehouseDocumentDetail(warehouseId: string | undefined, documentId: string | undefined): LiveDocumentDetail {
  const enabled = warehouseId !== undefined && documentId !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(WAREHOUSE_DOCUMENTS_MODULE, warehouseId, { resource: 'detail', documentId: documentId ?? null }),
    (signal) => getWarehouseDocument(warehouseId ?? '', documentId ?? '', signal),
    { enabled },
  );
  const document = useMemo(() => (query.data === undefined ? undefined : toDocumentDetailView(query.data)), [query.data]);
  return { ...queryState(query), isLoading: enabled && query.isPending, document };
}

/** Thrown when the document's file was deleted (fileUrl null): there is nothing to open. */
export class DocumentFileMissingError extends Error {
  constructor() {
    super('the document has no file to open');
    this.name = 'DocumentFileMissingError';
  }
}

export interface DocumentFileOpen {
  /** Opens the document's file in the device's viewer. Ignored while one is opening. */
  run: (documentId: string) => void;
  isPending: boolean;
  error: unknown;
  reset: () => void;
}

/** Fresh detail -> signed URL -> the OS viewer. Nothing is cached: the link expires. */
export function useOpenWarehouseDocument(warehouseId: string | undefined): DocumentFileOpen {
  const { mutate, isPending, error, reset } = useAdminMutation<string, void>({
    mutationFn: async (documentId) => {
      const detail = await getWarehouseDocument(warehouseId ?? '', documentId);
      const url = openableFileUrl(detail);
      if (url === null) throw new DocumentFileMissingError();
      await Linking.openURL(url);
    },
  });
  return useMemo(
    () => ({
      run: (documentId: string) => {
        if (!isPending && warehouseId !== undefined) mutate(documentId);
      },
      isPending,
      error,
      reset,
    }),
    [mutate, isPending, error, reset, warehouseId],
  );
}

export interface DocumentEdit {
  documentId: string;
  body: UpdateWarehouseDocumentBody;
}

/** PATCH the metadata (warehouse.document.manage); the list and the detail refetch after a success. */
export function useUpdateWarehouseDocument(warehouseId: string | undefined): LiveWrite<DocumentEdit> {
  return useWrite(
    (edit: DocumentEdit) => updateWarehouseDocument(warehouseId ?? '', edit.documentId, edit.body),
    [adminKeys.module(WAREHOUSE_DOCUMENTS_MODULE)],
  );
}

/** POST .../archive (warehouse.document.manage); a repeat is a server no-op. */
export function useArchiveWarehouseDocument(warehouseId: string | undefined): LiveWrite<string> {
  return useWrite(
    (documentId: string) => archiveWarehouseDocument(warehouseId ?? '', documentId),
    [adminKeys.module(WAREHOUSE_DOCUMENTS_MODULE)],
  );
}
