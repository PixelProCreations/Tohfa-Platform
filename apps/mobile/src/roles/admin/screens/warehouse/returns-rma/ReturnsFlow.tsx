/**
 * In-module navigator for the returns (RMA) screens (design module M10).
 *
 * Route keys are the old App.tsx keys without the 'SubWarehouse' prefix
 * (ReturnsRoute).
 */
import React, { useEffect, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { ApproveReturnScreen } from './ApproveReturnScreen';
import { useReturnList } from './useReturnData';
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
import type { PermissionCheck, ReturnHistoryRecord, ReturnsRoute, ReturnsRouteParams, RmaRecord, WarehouseScope, WarehouseTab } from './types';

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
  initialBackStack?: readonly ReturnsStackEntry[] | undefined;
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
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

  useEffect(() => {
    setStack([...(initialBackStack ?? []), { screen: initialScreen, params: initialParams }]);
  }, [initialScreen, initialParams, initialBackStack]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: ReturnsRouteParams = current.params ?? {};
  const returnId = params.returnId ?? params.rma?.id;
  const rma = params.rma;

  const returnList = useReturnList(scope, can, undefined);

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

  useFlowBack(() => {
    if (stack.length <= 1) return false;
    back();
    return true;
  });

  const backToList = () => setStack([{ screen: 'ReturnsIssues' }]);

  const common = { scope, can, onBack: back, onTabChange };

  switch (current.screen) {
    case 'ReturnsIssues':
      return (
        <ReturnsIssuesScreen
          {...common}
          warehouseOptions={warehouseOptions}
          items={returnList.items}
          isLoading={returnList.isLoading}
          error={returnList.error}
          onRetry={returnList.refresh}
          onSelectRma={(selected) => navigate('RmaDetail', { returnId: selected.id, rma: selected })}
          onNavigateToHistory={() => navigate('ReturnHistory')}
          onNavigateToNotifications={onNavigateToNotifications}
        />
      );
    case 'RmaDetail':
      return (
        <RmaDetailScreen
          {...common}
          returnId={returnId}
          rma={rma}
          onInspectProduct={(r) => navigate('InspectProduct', { returnId: r.id, rma: r })}
        />
      );
    case 'InspectProduct':
      return (
        <InspectProductScreen
          {...common}
          returnId={returnId}
          rma={rma}
          initialStep={params.step}
          onContinueToReview={(inspection) =>
            navigate('ReviewReturnRequest', {
              returnId: inspection.rma.id,
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
          returnId={returnId}
          rma={rma}
          inspectedQty={params.inspectedQty}
          inspectionNotes={params.notes}
          onApprove={(r) => navigate('ApproveReturn', { returnId: r.id, rma: r })}
          onReject={(r) => navigate('RejectReturnRequest', { returnId: r.id, rma: r })}
        />
      );
    case 'ApproveReturn':
      return (
        <ApproveReturnScreen
          {...common}
          returnId={returnId}
          rma={rma}
          onConfirmApprove={(r) => navigate('ReturnApproved', { returnId: r.id, rma: r })}
        />
      );
    case 'RejectReturnRequest':
      return (
        <RejectReturnRequestScreen
          {...common}
          returnId={returnId}
          rma={rma}
          onRejectSuccess={(data) => navigate('RequestRejected', { returnId: data.rma.id, rma: data.rma, reason: data.reason })}
        />
      );
    case 'RequestRejected':
      return <RequestRejectedScreen {...common} rma={rma ?? ({} as RmaRecord)} onDone={backToList} />;
    case 'ReturnApproved':
      return <ReturnApprovedScreen {...common} rma={rma ?? ({} as RmaRecord)} onGoToRefundStatus={(r) => navigate('RefundStatus', { returnId: r.id, rma: r })} />;
    case 'RefundStatus':
      return (
        <RefundStatusScreen
          {...common}
          returnId={returnId}
          rma={rma}
          refundAmount={params.refundAmount ?? '—'}
          onConfirmSuccess={(data) =>
            navigate('RefundCompleted', { returnId: data.rma.id, rma: data.rma, refundAmount: data.refundAmount, transactionId: data.transactionId })
          }
        />
      );
    case 'RefundFailed':
      return (
        <RefundFailedScreen
          {...common}
          returnId={returnId}
          rma={rma}
          onCheckRefundStatus={(r) => navigate('RefundStatus', { returnId: r.id, rma: r })}
        />
      );
    case 'RefundCompleted':
      return (
        <RefundCompletedScreen
          {...common}
          onBack={backToList}
          returnId={returnId}
          rma={rma}
          refundAmount={params.refundAmount ?? '—'}
          transactionId={params.transactionId}
          onViewReturnHistory={() => navigate('ReturnHistory')}
        />
      );
    case 'ReturnHistory':
      return (
        <ReturnHistoryScreen
          {...common}
          warehouseOptions={warehouseOptions}
          onSelectRecord={(record) => navigate('ReturnHistoryDetail', { returnId: record.id, record })}
        />
      );
    case 'ReturnHistoryDetail':
      return (
        <ReturnHistoryDetailScreen
          {...common}
          returnId={returnId}
          record={params.record ?? ({ id: returnId, rmaId: '—', orderId: '—', customerName: '—', status: 'Completed', date: '—', reasonTag: '—' } as ReturnHistoryRecord)}
        />
      );
    default:
      return null;
  }
}
