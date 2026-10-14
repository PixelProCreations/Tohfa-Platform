/**
 * In-module navigator for Returns & Issues (RMA, BR-61):
 * list -> detail -> inspect | reject | refund confirm -> refund receipt,
 * and detail -> status history.
 *
 * Gates (presentation only; the server re-checks every call):
 *  - the module: feature `returns` (`rma.request.process`);
 *  - each action: mappers.ts `returnActions` (BR-61 status + its rbac code).
 * There is no bank-refund path: `rma.refund.bank_process` is none for MW/SW.
 *
 * The wallet refund's Idempotency-Key handle lives HERE (root CLAUDE.md
 * §2.4), not in the confirm screen, so leaving the confirm screen after an
 * unknown outcome and coming back still resends the same key.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { EmptyState } from '@tohfa/mobile-ui';
import { useIdempotencyKey } from '../../../api/hooks';
import type { ReturnStatusDto } from '../../../api/returns';
import { t } from '../../../i18n';
import { useAdminSession } from '../../../session/AdminSession';
import { isWarehouseFeatureVisible } from '../availability';
import type { RefundResult, ReturnDetail } from './mappers';
import { ReturnDetailScreen } from './ReturnDetailScreen';
import { ReturnHistoryScreen } from './ReturnHistoryScreen';
import { ReturnInspectScreen } from './ReturnInspectScreen';
import { ReturnListScreen } from './ReturnListScreen';
import { ReturnRefundConfirmScreen } from './ReturnRefundConfirmScreen';
import { ReturnRefundSuccessScreen } from './ReturnRefundSuccessScreen';
import { ReturnRejectScreen } from './ReturnRejectScreen';

type Route =
  | { screen: 'list' }
  | { screen: 'detail'; returnId: string }
  | { screen: 'inspect'; detail: ReturnDetail }
  | { screen: 'reject'; detail: ReturnDetail }
  | { screen: 'refund'; detail: ReturnDetail }
  | { screen: 'refunded'; result: RefundResult }
  | { screen: 'history'; returnId: string };

export function ReturnsFlow(props: { onExit: () => void }): React.JSX.Element {
  const { can, scope } = useAdminSession();
  const idempotency = useIdempotencyKey();
  const [stack, setStack] = useState<Route[]>([{ screen: 'list' }]);
  const [statusFilter, setStatusFilter] = useState<ReturnStatusDto | undefined>(undefined);
  const { onExit } = props;
  const current = stack[stack.length - 1] ?? { screen: 'list' };

  const push = (route: Route): void => setStack((s) => [...s, route]);
  const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);

  // The receipt REPLACES the confirm screen (see onSuccess below), so back from
  // it lands on the detail, never on a confirm screen for a completed write.
  const back = useCallback(() => {
    if (stack.length > 1) pop();
    else onExit();
  }, [stack.length, pop, onExit]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => sub.remove();
  }, [back]);

  if (!isWarehouseFeatureVisible('returns', can)) {
    return <EmptyState title={t('admin.errors.FORBIDDEN')} />;
  }

  switch (current.screen) {
    case 'detail':
      return (
        <ReturnDetailScreen
          returnId={current.returnId}
          onBack={back}
          onInspect={(detail) => push({ screen: 'inspect', detail })}
          onReject={(detail) => push({ screen: 'reject', detail })}
          onRefund={(detail) => push({ screen: 'refund', detail })}
          onHistory={(returnId) => push({ screen: 'history', returnId })}
        />
      );
    case 'inspect':
      return <ReturnInspectScreen detail={current.detail} warehouseId={scope.warehouseId} onBack={back} onDone={pop} />;
    case 'reject':
      return <ReturnRejectScreen detail={current.detail} warehouseId={scope.warehouseId} onBack={back} onDone={pop} />;
    case 'refund':
      return (
        <ReturnRefundConfirmScreen
          detail={current.detail}
          warehouseId={scope.warehouseId}
          idempotency={idempotency}
          onBack={back}
          onSuccess={(result) => setStack((s) => [...s.slice(0, -1), { screen: 'refunded', result }])}
        />
      );
    case 'refunded':
      return <ReturnRefundSuccessScreen result={current.result} onDone={pop} />;
    case 'history':
      return <ReturnHistoryScreen returnId={current.returnId} onBack={back} />;
    case 'list':
      return (
        <ReturnListScreen
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onOpenReturn={(returnId) => push({ screen: 'detail', returnId })}
          onBack={back}
        />
      );
  }
}
