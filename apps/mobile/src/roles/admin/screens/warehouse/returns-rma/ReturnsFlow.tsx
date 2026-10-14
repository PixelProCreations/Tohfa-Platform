/**
 * In-module navigator for the returns (RMA) screens (design module M10).
 *
 * The RMA flow (queue -> detail -> inspect -> review -> approve / reject ->
 * wallet refund -> refund completed, plus history) lives next to the screens
 * and takes `scope` + `can`, so both shells render the same flow: the Sub
 * shell / App.tsx with the Sub warehouse scope, the Main shell with
 * MAIN_WAREHOUSE_SCOPE (all warehouses).
 *
 * Live since plan phase 10: every route reads the return by its uuid through
 * ./useReturnsData.ts; nothing is drawn from a sample. A route param is run
 * through returnIdParam, so a host still passing a display reference
 * ('RET-...') or an old sample number gets "not found" without a request.
 *
 * The screens stay presentational (props only); the Live*Route components
 * here own the hooks. Writes replace the route they were made from with
 * their result page, so back never returns to a form whose step the server
 * has already moved past (BR-61).
 *
 * Route keys are the old App.tsx keys without the 'SubWarehouse' prefix
 * (ReturnsRoute).
 */
import React, { useEffect, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { t } from '../../../i18n';
import { ApproveReturnScreen } from './ApproveReturnScreen';
import { InspectProductScreen } from './InspectProductScreen';
import { RETURN_HISTORY_FILTERS, RETURN_QUEUE_FILTERS, returnIdParam, returnReference, returnStatusView } from './mappers';
import { RefundCompletedScreen } from './RefundCompletedScreen';
import { RefundFailedScreen } from './RefundFailedScreen';
import { RefundStatusScreen } from './RefundStatusScreen';
import { RejectReturnRequestScreen } from './RejectReturnRequestScreen';
import { RequestRejectedScreen } from './RequestRejectedScreen';
import { ReturnApprovedScreen } from './ReturnApprovedScreen';
import { ReturnHistoryScreen } from './ReturnHistoryScreen';
import type { FilterChip } from './ReturnsParts';
import { ReturnsIssuesScreen } from './ReturnsIssuesScreen';
import { ReviewReturnRequestScreen } from './ReviewReturnRequestScreen';
import { RmaDetailScreen } from './RmaDetailScreen';
import type { ReturnStatus } from '../../../api/returns';
import type {
  PermissionCheck,
  ReturnsRoute,
  ReturnsRouteParams,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from './types';
import {
  useApproveReturn,
  useInspectReturn,
  useRejectReturn,
  useReturn,
  useReturnList,
  useWalletRefund,
} from './useReturnsData';

/** One entry of the flow's back stack. */
export interface ReturnsStackEntry {
  screen: ReturnsRoute;
  params?: ReturnsRouteParams | undefined;
}

export interface ReturnsFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: ReturnsRoute | undefined;
  initialParams?: ReturnsRouteParams | undefined;
  /**
   * Screens under the initial one, so back from it lands somewhere inside the
   * flow (e.g. a customer issue opens RmaDetail with the RMA list beneath).
   */
  initialBackStack?: readonly ReturnsStackEntry[] | undefined;
  /** Leave the returns module (pressed back on its first screen). */
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  /**
   * Accepted from the hosts but unused: the live queue has no bell, and no
   * all-warehouses selector (GET /admin/returns has no warehouse filter).
   */
  onNavigateToNotifications?: (() => void) | undefined;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

type Navigate = (screen: ReturnsRoute, params?: ReturnsRouteParams) => void;

/** What the flow hands every live route that works on one return. */
interface LiveReturnRouteProps {
  base: WarehouseScreenBaseProps;
  warehouseId: string | undefined;
  /** The return uuid, or undefined when the route carried none (or not a uuid). */
  returnId: string | undefined;
  params: ReturnsRouteParams;
  navigate: Navigate;
  /** Swap the current route for another (a write's result page). */
  replace: Navigate;
  backToList: () => void;
}

function statusChips<V extends ReturnStatus | undefined>(values: readonly V[]): FilterChip<V>[] {
  return values.map((value) => ({
    key: value ?? 'ALL',
    label: value === undefined ? t('returns.filter.all') : returnStatusView(value).label,
    value,
  }));
}

const QUEUE_CHIPS = statusChips(RETURN_QUEUE_FILTERS);
const HISTORY_CHIPS = statusChips(RETURN_HISTORY_FILTERS);

// ─── Routes ──────────────────────────────────────────────────────────────────

function LiveQueueRoute({
  base,
  history,
  onSelectReturn,
  onNavigateToHistory,
}: {
  base: WarehouseScreenBaseProps;
  history: boolean;
  onSelectReturn: (returnId: string) => void;
  onNavigateToHistory?: (() => void) | undefined;
}) {
  const chips: readonly FilterChip<ReturnStatus | undefined>[] = history ? HISTORY_CHIPS : QUEUE_CHIPS;
  // The history has no "All closed" (the server filters by one status), so it opens on its first chip.
  const [status, setStatus] = useState<ReturnStatus | undefined>(chips[0]?.value);
  const list = useReturnList(base.scope.warehouseId, status);
  const common = {
    ...base,
    rows: list.items,
    chips,
    chip: status,
    onChipChange: (value: string | undefined) => setStatus(chips.find((chip) => chip.value === value)?.value),
    onSelectReturn,
    onLoadMore: list.loadMore,
    hasMore: list.hasMore,
    isLoading: list.isLoading,
    error: list.error,
    onRetry: list.refresh,
    onRefresh: list.refresh,
    isRefreshing: list.isRefreshing,
  };
  return history ? (
    <ReturnHistoryScreen {...common} />
  ) : (
    <ReturnsIssuesScreen {...common} onNavigateToHistory={onNavigateToHistory} showTabs />
  );
}

function LiveDetailRoute({ base, warehouseId, returnId, navigate }: LiveReturnRouteProps) {
  const live = useReturn(warehouseId, returnId);
  const next = (screen: ReturnsRoute) => () => navigate(screen, { returnId });
  return (
    <RmaDetailScreen
      {...base}
      detail={live.detail}
      timeline={live.timeline}
      notFound={returnId === undefined}
      onInspect={next('InspectProduct')}
      onReview={next('ReviewReturnRequest')}
      onReject={next('RejectReturnRequest')}
      onRefund={next('RefundStatus')}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

/**
 * BR-61: the inspection form builds its body with inspectionBody (the summed
 * per-item accepted + damaged check) and hands over only a body that passed;
 * this route posts exactly that body through useInspectReturn.
 */
function LiveInspectRoute({ base, warehouseId, returnId, params, navigate, replace }: LiveReturnRouteProps) {
  const live = useReturn(warehouseId, returnId);
  const inspect = useInspectReturn(returnId);
  return (
    <InspectProductScreen
      {...base}
      detail={live.detail}
      notFound={returnId === undefined}
      step={params.step ?? 'form'}
      onSubmit={(body) => inspect.run(body, () => replace('InspectProduct', { returnId, step: 'saved' }))}
      onContinueToReview={() => navigate('ReviewReturnRequest', { returnId })}
      isSubmitting={inspect.isPending}
      submitError={inspect.error}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
    />
  );
}

function LiveReviewRoute({ base, warehouseId, returnId, navigate }: LiveReturnRouteProps) {
  const live = useReturn(warehouseId, returnId);
  return (
    <ReviewReturnRequestScreen
      {...base}
      detail={live.detail}
      notFound={returnId === undefined}
      onApprove={() => navigate('ApproveReturn', { returnId })}
      onReject={() => navigate('RejectReturnRequest', { returnId })}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
    />
  );
}

function LiveApproveRoute({ base, warehouseId, returnId, replace }: LiveReturnRouteProps) {
  const live = useReturn(warehouseId, returnId);
  const approve = useApproveReturn(returnId);
  return (
    <ApproveReturnScreen
      {...base}
      detail={live.detail}
      notFound={returnId === undefined}
      onConfirmApprove={() => approve.run(undefined, () => replace('ReturnApproved', { returnId }))}
      isSubmitting={approve.isPending}
      submitError={approve.error}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
    />
  );
}

function LiveRejectRoute({ base, warehouseId, returnId, replace }: LiveReturnRouteProps) {
  const live = useReturn(warehouseId, returnId);
  const reject = useRejectReturn(returnId);
  return (
    <RejectReturnRequestScreen
      {...base}
      detail={live.detail}
      notFound={returnId === undefined}
      onConfirmReject={(reason) => reject.run(reason, () => replace('RequestRejected', { returnId }))}
      isSubmitting={reject.isPending}
      submitError={reject.error}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
    />
  );
}

/**
 * BR-61d: the wallet refund and its retry. One useWalletRefund (so one
 * useIdempotencyKey) lives for this route; a failed attempt is shown in place
 * by RefundFailedScreen, and its Try Again runs the same hook, which sends the
 * same Idempotency-Key for this return. Opening the failure as a new route
 * would mount a new hook with a new key, and a dropped-but-applied refund
 * could then be credited twice. The 'RefundFailed' route key (a legacy deep
 * link) lands here too, so it never starts a second request of its own.
 */
function LiveRefundRoute({ base, warehouseId, returnId, replace }: LiveReturnRouteProps) {
  const live = useReturn(warehouseId, returnId);
  const refund = useWalletRefund(returnId);
  // The last failure stays on screen while Try Again is in flight (the
  // mutation clears its own error when it restarts).
  const [lastError, setLastError] = useState<unknown>(null);
  useEffect(() => {
    if (refund.error !== null && refund.error !== undefined) setLastError(refund.error);
  }, [refund.error]);

  const submit = () =>
    refund.run(undefined, (result) => {
      setLastError(null);
      replace('RefundCompleted', { returnId, refund: result });
    });

  if (lastError !== null) {
    return (
      <RefundFailedScreen
        {...base}
        reference={live.detail?.reference ?? (returnId === undefined ? undefined : returnReference(returnId))}
        error={lastError}
        isRetrying={refund.isPending}
        onRetry={submit}
      />
    );
  }

  return (
    <RefundStatusScreen
      {...base}
      detail={live.detail}
      notFound={returnId === undefined}
      onConfirmRefund={submit}
      isSubmitting={refund.isPending}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
    />
  );
}

function LiveRefundCompletedRoute({ base, warehouseId, returnId, params, navigate, backToList }: LiveReturnRouteProps) {
  const live = useReturn(warehouseId, returnId);
  return (
    <RefundCompletedScreen
      {...base}
      onBack={backToList}
      reference={live.detail?.reference ?? (returnId === undefined ? undefined : returnReference(returnId))}
      refund={params.refund}
      timeline={live.timeline}
      onViewReturnHistory={() => navigate('ReturnHistory')}
    />
  );
}

// ─── Flow ────────────────────────────────────────────────────────────────────

export function ReturnsFlow({
  scope,
  can,
  initialScreen = 'ReturnsIssues',
  initialParams,
  initialBackStack,
  onBack,
  onTabChange,
}: ReturnsFlowProps) {
  const [stack, setStack] = useState<ReturnsStackEntry[]>(() => [
    ...(initialBackStack ?? []),
    { screen: initialScreen, params: initialParams },
  ]);

  // A host that re-targets the open module (new initial screen / params)
  // restarts the stack, as the inventory and orders flows do. Hosts keep these
  // props referentially stable (state, not inline literals).
  useEffect(() => {
    setStack([...(initialBackStack ?? []), { screen: initialScreen, params: initialParams }]);
  }, [initialScreen, initialParams, initialBackStack]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: ReturnsRouteParams = current.params ?? {};
  // The detail is opened by the return uuid only; anything else is "not found".
  const returnId = returnIdParam(params.returnId);

  const navigate: Navigate = (screen, nextParams) => {
    setStack((prev) => [...prev, { screen, params: nextParams }]);
  };
  const replace: Navigate = (screen, nextParams) => {
    setStack((prev) => [...prev.slice(0, -1), { screen, params: nextParams }]);
  };

  const back = () => {
    if (stack.length > 1) {
      setStack((prev) => prev.slice(0, -1));
    } else {
      onBack();
    }
  };

  // Hardware back pops this flow's stack; at its root the host's listener handles it.
  useFlowBack(() => {
    if (stack.length <= 1) return false;
    back();
    return true;
  });

  /** Finish a review: back to the RMA list with a fresh stack (the old shells did the same). */
  const backToList = () => setStack([{ screen: 'ReturnsIssues' }]);

  const base: WarehouseScreenBaseProps = { scope, can, onBack: back, onTabChange };
  const live: LiveReturnRouteProps = {
    base,
    warehouseId: scope.warehouseId,
    returnId,
    params,
    navigate,
    replace,
    backToList,
  };
  const reference = returnId === undefined ? t('returns.noValue') : returnReference(returnId);

  switch (current.screen) {
    case 'ReturnsIssues':
      return (
        <LiveQueueRoute
          base={base}
          history={false}
          onSelectReturn={(id) => navigate('RmaDetail', { returnId: id })}
          onNavigateToHistory={() => navigate('ReturnHistory')}
        />
      );
    case 'ReturnHistory':
      return <LiveQueueRoute base={base} history onSelectReturn={(id) => navigate('ReturnHistoryDetail', { returnId: id })} />;
    case 'RmaDetail':
    case 'ReturnHistoryDetail':
      // Return History's detail is the same live detail; a closed return offers nothing (BR-61).
      return <LiveDetailRoute {...live} />;
    case 'InspectProduct':
      return <LiveInspectRoute {...live} />;
    case 'ReviewReturnRequest':
      return <LiveReviewRoute {...live} />;
    case 'ApproveReturn':
      return <LiveApproveRoute {...live} />;
    case 'RejectReturnRequest':
      return <LiveRejectRoute {...live} />;
    case 'RequestRejected':
      return <RequestRejectedScreen {...base} reference={reference} onDone={backToList} />;
    case 'ReturnApproved':
      return (
        <ReturnApprovedScreen
          {...base}
          reference={reference}
          onGoToRefundStatus={() => replace('RefundStatus', { returnId })}
          onDone={backToList}
        />
      );
    case 'RefundStatus':
    case 'RefundFailed':
      return <LiveRefundRoute {...live} />;
    case 'RefundCompleted':
      return <LiveRefundCompletedRoute {...live} />;
    default:
      return null;
  }
}
