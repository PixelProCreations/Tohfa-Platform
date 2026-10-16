/**
 * In-module navigator for the inter-warehouse transfer screens.
 *
 *   Transfers -> Transfer Detail -> Transfer Inspection (receive)
 *   Transfers -> Initiate New Transfer -> Transfer Detail (of the new transfer)
 *   Transfer Receiving -> Transfer Inspection (the Receiving tab entry)
 *
 * Every screen reads the live /warehouse-transfers API through
 * ./useTransfersData.ts; writes invalidate the lists, so going back shows the
 * new state. The flow only owns the stack.
 *
 * Gate: InitiateNewTransfer needs `transfer.inter_warehouse.initiate` (MAIN
 * all, SUB none, BR-26); navigate() refuses it without the code and the screen
 * renders a not-available note if opened directly. The other screens are
 * Shared and scope-locked (Sub: incoming transfers only).
 */
import React, { useEffect, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { InitiateNewTransferScreen } from './InitiateNewTransferScreen';
import { InterWarehouseTransferScreen } from './InterWarehouseTransferScreen';
import { TransferDetailScreen } from './TransferDetailScreen';
import { canOpenTransferRoute } from './mappers';
import { TransferReceivingInspectionScreen } from './TransferReceivingInspectionScreen';
import { TransferReceivingScreen } from './TransferReceivingScreen';
import type { PermissionCheck, TransferRoute, TransferRouteParams, WarehouseScope } from './types';

interface TransferStackEntry {
  screen: TransferRoute;
  params?: TransferRouteParams | undefined;
}

export { canOpenTransferRoute };

export interface TransfersFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: TransferRoute | undefined;
  initialParams?: TransferRouteParams | undefined;
  /** Leave the module (pressed back on its first screen). */
  onBack: () => void;
}

export function TransfersFlow({ scope, can, initialScreen = 'Transfers', initialParams, onBack }: TransfersFlowProps) {
  const [stack, setStack] = useState<TransferStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do (keyed on the value, not the params object).
  const presetKey = initialParams?.transferId ?? '';
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
    // initialParams is read through presetKey on purpose (see above).
  }, [initialScreen, presetKey]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: TransferRouteParams = current.params ?? {};

  const navigate = (screen: TransferRoute, nextParams?: TransferRouteParams) => {
    if (!canOpenTransferRoute(screen, can)) return;
    setStack((prev) => [...prev, { screen, params: nextParams }]);
  };
  const back = () => {
    if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
    else onBack();
  };

  // Hardware back pops this flow's stack; at its root the host's listener handles it.
  useFlowBack(() => {
    if (stack.length <= 1) return false;
    back();
    return true;
  });
  /** Return to the list (or leave, when the flow did not start on it). */
  const backToList = () => {
    const index = stack.map((e) => e.screen).lastIndexOf('Transfers');
    if (index >= 0) setStack((prev) => prev.slice(0, index + 1));
    else onBack();
  };

  const common = { scope, can, onBack: back };
  /** Replace the top screen (after a create, the new transfer's detail). */
  const replace = (screen: TransferRoute, nextParams?: TransferRouteParams) =>
    setStack((prev) => [...prev.slice(0, -1), { screen, params: nextParams }]);

  switch (current.screen) {
    case 'Transfers':
      return (
        <InterWarehouseTransferScreen
          {...common}
          onNewTransfer={() => navigate('InitiateNewTransfer')}
          onSelectTransfer={(t) => navigate('TransferDetail', { transferId: t.id })}
        />
      );
    case 'TransferDetail':
      return (
        <TransferDetailScreen
          {...common}
          transferId={params.transferId}
          onReceiveTransfer={(id) => navigate('TransferInspection', { transferId: id })}
          onBackToTransfers={backToList}
        />
      );
    case 'InitiateNewTransfer':
      return <InitiateNewTransferScreen {...common} onTransferCreated={(t) => replace('TransferDetail', { transferId: t.id })} />;
    case 'TransferReceiving':
      return (
        <TransferReceivingScreen
          {...common}
          onStartTransferInspection={(id) => navigate('TransferInspection', { transferId: id })}
        />
      );
    case 'TransferInspection':
      return <TransferReceivingInspectionScreen {...common} transferId={params.transferId} onCompleteTransfer={() => back()} />;
    default:
      return null;
  }
}
