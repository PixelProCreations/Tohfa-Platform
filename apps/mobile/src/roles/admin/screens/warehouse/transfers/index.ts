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
export { TRANSFER_CODES, transferInScope } from './TransferParts';
export { TRANSFERS } from './fixtures';
export type { TransferItem, TransferRoute, TransferRouteParams, TransferStatus } from './types';
