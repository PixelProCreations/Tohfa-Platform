// Shared Main/Sub inter-warehouse transfer screens (W4). Explicit exports only
// (no `export *`), mirroring the other area barrels.
export { TransfersFlow, canOpenTransferRoute, type TransfersFlowProps } from './TransfersFlow';
export { InterWarehouseTransferScreen, type InterWarehouseTransferScreenProps } from './InterWarehouseTransferScreen';
export { InitiateNewTransferScreen, type InitiateNewTransferScreenProps } from './InitiateNewTransferScreen';
export { TransferDetailScreen, type TransferDetailScreenProps } from './TransferDetailScreen';
export { TransferReceivingScreen, type TransferReceivingScreenProps } from './TransferReceivingScreen';
export {
  TransferReceivingInspectionScreen,
  type TransferReceivingInspectionScreenProps,
} from './TransferReceivingInspectionScreen';
export { TRANSFER_CODES, transferActions, transferListScopeParams } from './mappers';
export { useTransferStatusCounts } from './useTransfersData';
export type {
  // `TransferItem` is kept as a name for the warehouse barrel (../index.ts); it is the live list row.
  TransferListItem as TransferItem,
  TransferDetailView,
  TransferListItem,
  TransferRoute,
  TransferRouteParams,
  TransferStatusCode,
} from './types';
