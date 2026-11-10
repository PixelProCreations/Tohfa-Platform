/**
 * Live data for Farmers Management. Thin wrappers over ./hooks.ts; every
 * decision lives in ./farmers.ts, ./farmerApplications.ts, ./farmerMappers.ts
 * or ./queryKeys.ts, which are tested (hooks cannot be rendered in this app's
 * plain-Node vitest).
 *
 * Scope is server-side (BR-108a): no route takes a scope, and a farmer outside
 * it is absent / 404. The caller's warehouse is still in every key (BR-30).
 * Hooks that need an id take it possibly undefined; without one nothing is
 * fetched and nothing is loading.
 *
 * Idempotency: approve, reject and request-info carry an Idempotency-Key (the
 * spec declares it); one key per logical decision (same application + same
 * body), released by `finish()`. The farmer PATCH and the document verify
 * carry none (the spec declares none; verify is a no-op on replay, BR-108e).
 */
import { useMemo } from 'react';
import {
  approveFarmerApplication,
  getFarmerApplication,
  listFarmerApplications,
  rejectFarmerApplication,
  requestFarmerApplicationInfo,
  type ApplicationListFilterStatus,
  type ApproveApplicationBody,
  type FarmerApplicationDto,
  type FarmerApplicationPage,
  type RejectApplicationBody,
  type RequestInfoApplicationBody,
} from './farmerApplications';
import {
  toApplicationDetail,
  toApplicationRow,
  toFarmerDetail,
  toFarmerDocument,
  toFarmerRating,
  toFarmerRow,
  toFarmerSubscription,
  toPayoutDestination,
} from './farmerMappers';
import {
  getFarmer,
  getFarmerRating,
  getFarmerSubscription,
  listFarmerBankAccounts,
  listFarmerDocuments,
  listFarmers,
  updateFarmer,
  verifyFarmerDocument,
  type AdminFarmerAccountStatus,
  type AdminFarmerDetailDto,
  type AdminFarmerDocumentDto,
  type AdminFarmerListItemDto,
  type AdminFarmerListPage,
  type RatingTierCode,
  type UpdateAdminFarmerBody,
} from './farmers';
import type {
  ApplicationDetailView,
  ApplicationRowView,
  FarmerDetailView,
  FarmerDocumentView,
  FarmerRatingView,
  FarmerRowView,
  FarmerSubscriptionView,
  PayoutDestinationView,
} from './farmerTypes';
import { useAdminMutation, useAdminQuery, useCursorList, useIdempotencyKey, type CursorList } from './hooks';
import { adminKeys, applicationKeys, farmerKeys, FARMER_APPLICATIONS_MODULE, FARMERS_MODULE } from './queryKeys';

/** What a data screen needs to pick an AsyncState and to refresh. */
export interface LiveQueryState {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

function queryState(
  query: { isPending: boolean; error: unknown; refetch: () => unknown; isRefetching: boolean },
  enabled: boolean,
): LiveQueryState {
  return {
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching,
  };
}

function noId(): Promise<never> {
  return Promise.reject(new Error('No id to act on.'));
}

// ---------------------------------------------------------------------------
// Farmers (reads)
// ---------------------------------------------------------------------------

export interface FarmerListFilters {
  q?: string | undefined;
  status?: AdminFarmerAccountStatus | undefined;
  zoneId?: string | undefined;
  ratingTier?: RatingTierCode | undefined;
}

/** The farmer directory, page by page (BR-108). */
export function useFarmerList(
  warehouseId: string | undefined,
  filters: FarmerListFilters = {},
): CursorList<FarmerRowView, AdminFarmerListPage> {
  return useCursorList<AdminFarmerListItemDto, FarmerRowView, AdminFarmerListPage>(
    farmerKeys.list(warehouseId, filters),
    (cursor, signal) => listFarmers({ ...filters, cursor }, signal),
    toFarmerRow,
  );
}

export interface LiveFarmer extends LiveQueryState {
  farmer: FarmerDetailView | undefined;
  /** The raw profile, for the edit form (toEditFarmerForm). */
  dto: AdminFarmerDetailDto | undefined;
}

export function useFarmer(warehouseId: string | undefined, farmerId: string | undefined): LiveFarmer {
  const enabled = farmerId !== undefined;
  const query = useAdminQuery(farmerKeys.detail(warehouseId, farmerId), (signal) => getFarmer(farmerId ?? '', signal), { enabled });
  const farmer = useMemo(() => (query.data === undefined ? undefined : toFarmerDetail(query.data)), [query.data]);
  return { ...queryState(query, enabled), farmer, dto: query.data };
}

export interface LiveFarmerDocuments extends LiveQueryState {
  documents: FarmerDocumentView[] | undefined;
}

/** farmer.document.view. */
export function useFarmerDocuments(warehouseId: string | undefined, farmerId: string | undefined): LiveFarmerDocuments {
  const enabled = farmerId !== undefined;
  const query = useAdminQuery(
    farmerKeys.documents(warehouseId, farmerId),
    (signal) => listFarmerDocuments(farmerId ?? '', signal),
    { enabled },
  );
  const documents = useMemo(() => query.data?.items.map(toFarmerDocument), [query.data]);
  return { ...queryState(query, enabled), documents };
}

export interface LivePayoutDestinations extends LiveQueryState {
  destinations: PayoutDestinationView[] | undefined;
}

/** farmer.bank_account.view (SUPER/TOHFA only); pass enabled=false for anyone else. */
export function useFarmerBankAccounts(
  warehouseId: string | undefined,
  farmerId: string | undefined,
  options: { enabled?: boolean } = {},
): LivePayoutDestinations {
  const enabled = farmerId !== undefined && (options.enabled ?? true);
  const query = useAdminQuery(
    farmerKeys.bankAccounts(warehouseId, farmerId),
    (signal) => listFarmerBankAccounts(farmerId ?? '', signal),
    { enabled },
  );
  const destinations = useMemo(() => query.data?.items.map(toPayoutDestination), [query.data]);
  return { ...queryState(query, enabled), destinations };
}

export interface LiveFarmerSubscription extends LiveQueryState {
  subscription: FarmerSubscriptionView | undefined;
}

/** farmer.subscription.view_tier_limits. */
export function useFarmerSubscription(warehouseId: string | undefined, farmerId: string | undefined): LiveFarmerSubscription {
  const enabled = farmerId !== undefined;
  const query = useAdminQuery(
    farmerKeys.subscription(warehouseId, farmerId),
    (signal) => getFarmerSubscription(farmerId ?? '', signal),
    { enabled },
  );
  const subscription = useMemo(() => (query.data === undefined ? undefined : toFarmerSubscription(query.data)), [query.data]);
  return { ...queryState(query, enabled), subscription };
}

export interface LiveFarmerRating extends LiveQueryState {
  rating: FarmerRatingView | undefined;
}

/** farmer.rating.view; read-only (BR-06). */
export function useFarmerRating(warehouseId: string | undefined, farmerId: string | undefined): LiveFarmerRating {
  const enabled = farmerId !== undefined;
  const query = useAdminQuery(farmerKeys.rating(warehouseId, farmerId), (signal) => getFarmerRating(farmerId ?? '', signal), {
    enabled,
  });
  const rating = useMemo(() => (query.data === undefined ? undefined : toFarmerRating(query.data)), [query.data]);
  return { ...queryState(query, enabled), rating };
}

// ---------------------------------------------------------------------------
// Farmers (writes)
// ---------------------------------------------------------------------------

export interface LiveAction<TBody, TResult> {
  /** Runs the write; `onDone` fires after the server stored it. Ignored while one is in flight. */
  run: (body: TBody, onDone?: (result: TResult) => void) => void;
  isPending: boolean;
  /** The last failure, for adminErrorKey (e.g. FIELD_LOCKED, CONFLICT, VALIDATION_FAILED). */
  error: unknown;
  reset: () => void;
}

function useAction<TBody, TResult>(
  mutate: (body: TBody, options?: { onSuccess?: (result: TResult) => void }) => void,
  state: { isPending: boolean; error: unknown; reset: () => void },
): LiveAction<TBody, TResult> {
  const { isPending, error, reset } = state;
  return useMemo(
    () => ({
      run: (body: TBody, onDone?: (result: TResult) => void) => {
        if (isPending) return;
        if (onDone === undefined) mutate(body);
        else mutate(body, { onSuccess: (result) => onDone(result) });
      },
      isPending,
      error,
      reset,
    }),
    [mutate, isPending, error, reset],
  );
}

/**
 * PATCH /admin/farmers/{id} (farmer.profile.edit). Build the body with
 * buildFarmerPatch (BR-33a). A success refetches the whole farmers module
 * (list and detail).
 */
export function useUpdateFarmer(farmerId: string | undefined): LiveAction<UpdateAdminFarmerBody, AdminFarmerDetailDto> {
  const mutation = useAdminMutation<UpdateAdminFarmerBody, AdminFarmerDetailDto>({
    mutationFn: (body) => (farmerId === undefined ? noId() : updateFarmer(farmerId, body)),
    invalidates: [adminKeys.module(FARMERS_MODULE)],
  });
  return useAction(mutation.mutate, mutation);
}

/** POST .../documents/{docId}/verify (farmer.document.verify). The body is the document id. */
export function useVerifyFarmerDocument(farmerId: string | undefined): LiveAction<string, AdminFarmerDocumentDto> {
  const mutation = useAdminMutation<string, AdminFarmerDocumentDto>({
    mutationFn: (docId) => (farmerId === undefined ? noId() : verifyFarmerDocument(farmerId, docId)),
    invalidates: [adminKeys.module(FARMERS_MODULE)],
  });
  return useAction(mutation.mutate, mutation);
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export interface ApplicationListFilters {
  status?: ApplicationListFilterStatus | undefined;
  zoneId?: string | undefined;
  submittedAfter?: string | undefined;
}

/** farmer.application.list_pending. With no status the server returns every status. */
export function useApplicationList(
  warehouseId: string | undefined,
  filters: ApplicationListFilters = {},
  options: { enabled?: boolean } = {},
): CursorList<ApplicationRowView, FarmerApplicationPage> {
  return useCursorList<FarmerApplicationDto, ApplicationRowView, FarmerApplicationPage>(
    applicationKeys.list(warehouseId, filters),
    (cursor, signal) => listFarmerApplications({ ...filters, cursor }, signal),
    toApplicationRow,
    { enabled: options.enabled ?? true },
  );
}

export interface LiveApplication extends LiveQueryState {
  application: ApplicationDetailView | undefined;
}

/** farmer.application.view. */
export function useApplication(warehouseId: string | undefined, applicationId: string | undefined): LiveApplication {
  const enabled = applicationId !== undefined;
  const query = useAdminQuery(
    applicationKeys.detail(warehouseId, applicationId),
    (signal) => getFarmerApplication(applicationId ?? '', signal),
    { enabled },
  );
  const application = useMemo(() => (query.data === undefined ? undefined : toApplicationDetail(query.data)), [query.data]);
  return { ...queryState(query, enabled), application };
}

export interface LiveDecision<TBody> extends LiveAction<TBody, FarmerApplicationDto> {
  /** Call once the decision is done (or abandoned), so the next one gets a fresh Idempotency-Key. */
  finish: () => void;
}

type DecisionCall<TBody> = (id: string, body: TBody, idempotencyKey: string) => Promise<FarmerApplicationDto>;

/** A decision write: one Idempotency-Key per (application, body); refetches applications and farmers. */
function useDecision<TBody>(applicationId: string | undefined, call: DecisionCall<TBody>): LiveDecision<TBody> {
  const keys = useIdempotencyKey();
  const mutation = useAdminMutation<TBody, FarmerApplicationDto>({
    mutationFn: (body) =>
      applicationId === undefined ? noId() : call(applicationId, body, keys.keyFor({ applicationId, body })),
    // An approval creates a farmer, so the farmer list is refetched too.
    invalidates: [adminKeys.module(FARMER_APPLICATIONS_MODULE), adminKeys.module(FARMERS_MODULE)],
  });
  // TanStack types mutate's arguments with a conditional rest tuple that TypeScript cannot resolve
  // for a generic TBody; at run time it is exactly (variables, options).
  const mutate = mutation.mutate as (body: TBody, options?: { onSuccess?: (result: FarmerApplicationDto) => void }) => void;
  const action = useAction(mutate, mutation);
  const { reset } = mutation;
  return useMemo(
    () => ({
      ...action,
      finish: () => {
        keys.reset();
        reset();
      },
    }),
    [action, keys, reset],
  );
}

/** farmer.application.approve (SUPER/TOHFA in effect; a FARMER_ADMIN holds it at `view`, so the POST is 403). */
export function useApproveApplication(applicationId: string | undefined): LiveDecision<ApproveApplicationBody> {
  return useDecision(applicationId, approveFarmerApplication);
}

/** farmer.application.reject. */
export function useRejectApplication(applicationId: string | undefined): LiveDecision<RejectApplicationBody> {
  return useDecision(applicationId, rejectFarmerApplication);
}

/** farmer.application.request_info. The design dropped the button; the client stays available. */
export function useRequestApplicationInfo(applicationId: string | undefined): LiveDecision<RequestInfoApplicationBody> {
  return useDecision(applicationId, requestFarmerApplicationInfo);
}
