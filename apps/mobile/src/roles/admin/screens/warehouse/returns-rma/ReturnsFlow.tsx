/**
 * In-module navigator for the returns (RMA) screens (design module M10).
 *
 * The RMA flow (list -> detail -> inspect -> review -> approve / reject ->
 * refund status -> refund completed / failed, plus history) used to be
 * stitched twice: as fourteen `if (xxxRma)` state branches in the Sub shell and
 * fourteen App.tsx route keys, while the Main shell nested its own copies
 * (MainWarehouseReturnsIssuesScreen -> RmaDetail -> ...) through local state.
 * It now lives next to the screens and takes `scope` + `can`, so both shells
 * render the same flow: the Sub shell / App.tsx with the Sub warehouse scope,
 * the Main shell with MAIN_WAREHOUSE_SCOPE (all warehouses).
 *
 * Route keys are the old App.tsx keys without the 'SubWarehouse' prefix
 * (ReturnsRoute). The image viewer route ('SubWarehouseImageViewer') was
 * dropped with its screen (FINAL_LIST row 106).
 */
import React, { useEffect, useState } from 'react';

import { ApproveReturnScreen } from './ApproveReturnScreen';
import { SAMPLE_REFUND_AMOUNT, SAMPLE_RETURN_HISTORY_RECORD, SAMPLE_RMA } from './fixtures';
import { InspectProductScreen } from './InspectProductScreen';
import { RefundCompletedScreen } from './RefundCompletedScreen';
import { RefundFailedScreen } from './RefundFailedScreen';
import { RefundStatusScreen } from './RefundStatusScreen';
import { RejectReturnRequestScreen } from './RejectReturnRequestScreen';
import { RequestRejectedScreen } from './RequestRejectedScreen';
import { ReturnApprovedScreen } from './ReturnApprovedScreen';
import { ReturnHistoryDetailScreen } from './ReturnHistoryDetailScreen';
import { ReturnHistoryScreen } from './ReturnHistoryScreen';
import { ReturnsIssuesScreen } from './ReturnsIssuesScreen';
import { ReviewReturnRequestScreen } from './ReviewReturnRequestScreen';
import { RmaDetailScreen } from './RmaDetailScreen';
import type { PermissionCheck, ReturnsRoute, ReturnsRouteParams, WarehouseScope, WarehouseTab } from './types';

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
  onNavigateToNotifications?: (() => void) | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

export function ReturnsFlow({
  scope,
  can,
  initialScreen = 'ReturnsIssues',
  initialParams,
  initialBackStack,
  onBack,
  onTabChange,
  onNavigateToNotifications,
  warehouseOptions,
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
  const rma = params.rma ?? SAMPLE_RMA;

  const navigate = (screen: ReturnsRoute, nextParams?: ReturnsRouteParams) => {
    setStack((prev) => [...prev, { screen, params: nextParams }]);
  };

  const back = () => {
    if (stack.length > 1) {
      setStack((prev) => prev.slice(0, -1));
    } else {
      onBack();
    }
  };

  /** Finish a review: back to the RMA list with a fresh stack (the old shells did the same). */
  const backToList = () => setStack([{ screen: 'ReturnsIssues' }]);

  const common = { scope, can, onBack: back, onTabChange };

  switch (current.screen) {
    case 'ReturnsIssues':
      return (
        <ReturnsIssuesScreen
          {...common}
          warehouseOptions={warehouseOptions}
          onSelectRma={(selected) => navigate('RmaDetail', { rma: selected })}
          onNavigateToHistory={() => navigate('ReturnHistory')}
          onNavigateToNotifications={onNavigateToNotifications}
        />
      );
    case 'RmaDetail':
      return <RmaDetailScreen {...common} rma={rma} onInspectProduct={(r) => navigate('InspectProduct', { rma: r })} />;
    case 'InspectProduct':
      return (
        <InspectProductScreen
          {...common}
          rma={rma}
          initialStep={params.step}
          onContinueToReview={(inspection) =>
            navigate('ReviewReturnRequest', {
              rma: inspection.rma,
              inspectedQty: inspection.receivedQty,
              notes: inspection.notes,
            })
          }
        />
      );
    case 'ReviewReturnRequest':
      return (
        <ReviewReturnRequestScreen
          {...common}
          rma={rma}
          inspectedQty={params.inspectedQty}
          inspectionNotes={params.notes}
          onApprove={(r) => navigate('ApproveReturn', { rma: r })}
          onReject={(r) => navigate('RejectReturnRequest', { rma: r })}
        />
      );
    case 'ApproveReturn':
      return <ApproveReturnScreen {...common} rma={rma} onConfirmApprove={(r) => navigate('ReturnApproved', { rma: r })} />;
    case 'RejectReturnRequest':
      return (
        <RejectReturnRequestScreen
          {...common}
          rma={rma}
          onRejectSuccess={(data) => navigate('RequestRejected', { rma: data.rma, reason: data.reason })}
        />
      );
    case 'RequestRejected':
      return <RequestRejectedScreen {...common} rma={rma} onDone={backToList} />;
    case 'ReturnApproved':
      return <ReturnApprovedScreen {...common} rma={rma} onGoToRefundStatus={(r) => navigate('RefundStatus', { rma: r })} />;
    case 'RefundStatus':
      return (
        <RefundStatusScreen
          {...common}
          rma={rma}
          refundAmount={params.refundAmount ?? SAMPLE_REFUND_AMOUNT}
          onConfirmSuccess={(data) =>
            navigate('RefundCompleted', { rma: data.rma, refundAmount: data.refundAmount })
          }
        />
      );
    case 'RefundFailed':
      return (
        <RefundFailedScreen {...common} rma={rma} onCheckRefundStatus={(r) => navigate('RefundStatus', { rma: r })} />
      );
    case 'RefundCompleted':
      return (
        <RefundCompletedScreen
          {...common}
          onBack={backToList}
          rma={rma}
          refundAmount={params.refundAmount ?? SAMPLE_REFUND_AMOUNT}
          transactionId={params.transactionId}
          onViewReturnHistory={() => navigate('ReturnHistory')}
        />
      );
    case 'ReturnHistory':
      return (
        <ReturnHistoryScreen
          {...common}
          warehouseOptions={warehouseOptions}
          onSelectRecord={(record) => navigate('ReturnHistoryDetail', { record })}
        />
      );
    case 'ReturnHistoryDetail':
      return <ReturnHistoryDetailScreen {...common} record={params.record ?? SAMPLE_RETURN_HISTORY_RECORD} />;
    default:
      return null;
  }
}
