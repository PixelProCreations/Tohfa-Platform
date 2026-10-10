/**
 * In-module navigator for the inter-warehouse transfer screens.
 *
 *   Transfers -> Transfer Detail -> Transfer Receiving -> Transfer Inspection
 *   Transfers -> Initiate New Transfer
 *   (Transfer Receiving can also be the entry, from the Receiving tab)
 *
 * The screens used to be stitched by the Main shell (whSubView / receiving
 * sub-views with a shell-held transfer list) and by App.tsx keys, none of
 * which passed `scope` / `can`. This flow owns the stack and the (mock)
 * transfer list, so every step gets the viewer's scope and `can`.
 *
 * Gate: InitiateNewTransfer needs `transfer.inter_warehouse.initiate` (MAIN
 * all, SUB none, BR-26); navigate() refuses it without the code and the screen
 * renders a not-available note if opened directly. The other screens are
 * Shared and scope-locked (Sub: incoming transfers only).
 */
import React, { useEffect, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { TRANSFERS } from './fixtures';
import { InitiateNewTransferScreen } from './InitiateNewTransferScreen';
import { InterWarehouseTransferScreen } from './InterWarehouseTransferScreen';
import { TransferDetailScreen } from './TransferDetailScreen';
import { TRANSFER_CODES } from './TransferParts';
import { TransferReceivingInspectionScreen } from './TransferReceivingInspectionScreen';
import { TransferReceivingScreen } from './TransferReceivingScreen';
import type { PermissionCheck, TransferItem, TransferRoute, TransferRouteParams, WarehouseScope } from './types';

interface TransferStackEntry {
  screen: TransferRoute;
  params?: TransferRouteParams | undefined;
}

/** True when `can` allows opening `route` (Initiate needs transfer.inter_warehouse.initiate). */
export function canOpenTransferRoute(route: TransferRoute, can: PermissionCheck): boolean {
  return route !== 'InitiateNewTransfer' || can(TRANSFER_CODES.initiate);
}

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
  const [transfers, setTransfers] = useState<readonly TransferItem[]>(TRANSFERS);

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

  const common = { scope, can, onBack: back, transfers };

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
          onTrackReceiving={() => navigate('TransferReceiving')}
          onCancelTransfer={(id) => setTransfers((prev) => prev.filter((t) => t.id !== id))}
          onBackToTransfers={backToList}
        />
      );
    case 'InitiateNewTransfer':
      return (
        <InitiateNewTransferScreen
          {...common}
          onSubmitTransfer={(t) => {
            setTransfers((prev) => [t, ...prev]);
            back();
          }}
        />
      );
    case 'TransferReceiving':
      return (
        <TransferReceivingScreen
          {...common}
          onStartTransferInspection={(id) => navigate('TransferInspection', { transferId: id })}
        />
      );
    case 'TransferInspection':
      return (
        <TransferReceivingInspectionScreen
          {...common}
          transferId={params.transferId}
          onCompleteTransfer={(id, receivedKg) => {
            setTransfers((prev) =>
              prev.map((t) =>
                t.id === id
                  ? { ...t, status: 'Completed', receivedKg, qtyMismatch: receivedKg !== t.quantityKg, eta: undefined }
                  : t,
              ),
            );
            back();
          }}
        />
      );
    default:
      return null;
  }
}
